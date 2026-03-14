import mongoose from "mongoose";
import { Charge } from "../models/Charge.js";
import { Customer } from "../models/Customer.js";
import { MessageDispatch } from "../models/MessageDispatch.js";
import { MessageTemplate } from "../models/MessageTemplate.js";
import { ReminderRule } from "../models/ReminderRule.js";
import { sendWhatsAppMessage } from "../lib/waGatewayClient.js";
import { logger } from "../lib/logger.js";
import { ApiError } from "../utils/apiError.js";
import { buildManualIdempotencyKey, buildReminderIdempotencyKey } from "../utils/idempotency.js";
import { normalizePhone } from "../utils/phone.js";
import { buildTemplateVariables, renderTemplate } from "../utils/templateRenderer.js";
import { computeNextReminderAt, deriveChargeStatus } from "../utils/date.js";

function buildTemplateSnapshot(template) {
  if (!template) {
    return {
      templateId: null,
      name: "Mensagem customizada",
      category: "custom",
      content: "",
    };
  }

  return {
    templateId: template._id,
    name: template.name,
    category: template.category,
    content: template.content,
  };
}

async function resolveChargeAndCustomer(chargeId) {
  const charge = await Charge.findById(chargeId).lean();
  if (!charge) throw new ApiError(404, "Cobrança não encontrada.");

  const customer = await Customer.findById(charge.customerId).lean();
  if (!customer) throw new ApiError(404, "Cliente não encontrado.");

  return { charge, customer };
}

async function processDispatch(dispatchId) {
  const dispatch = await MessageDispatch.findById(dispatchId);
  if (!dispatch) throw new ApiError(404, "Disparo não encontrado.");

  dispatch.status = "processing";
  dispatch.attemptsCount += 1;
  await dispatch.save();

  try {
    const gatewayResponse = await sendWhatsAppMessage({
      to: dispatch.phone,
      message: dispatch.renderedMessage,
    });

    dispatch.status = "sent";
    dispatch.providerMessageId = gatewayResponse.providerMessageId || null;
    dispatch.gatewayResponse = gatewayResponse;
    dispatch.sentAt = new Date();
    dispatch.error = null;
    await dispatch.save();

    const rules = await ReminderRule.find({ enabled: true }).lean();
    const charge = await Charge.findById(dispatch.chargeId);
    if (charge) {
      charge.lastDispatchId = dispatch._id;
      charge.lastReminderAt = new Date();
      charge.remindersSentCount = Number(charge.remindersSentCount || 0) + 1;
      charge.status = deriveChargeStatus(charge);
      charge.nextReminderAt = computeNextReminderAt(charge, rules, new Date(Date.now() + 86400000));
      await charge.save();
    }

    return dispatch.toObject();
  } catch (error) {
    dispatch.status = "failed";
    dispatch.error = {
      message: error.message,
      details: error.details || null,
      at: new Date().toISOString(),
    };
    dispatch.gatewayResponse = error.details || null;
    await dispatch.save();

    logger.error("dispatch_failed", {
      dispatchId: dispatch._id,
      chargeId: dispatch.chargeId,
      phone: dispatch.phone,
      message: error.message,
    });

    return dispatch.toObject();
  }
}

export async function listDispatches(query = {}) {
  const filter = {};

  if (query.status) filter.status = String(query.status);
  if (query.chargeId) filter.chargeId = String(query.chargeId);
  if (query.customerId) filter.customerId = String(query.customerId);
  if (query.dispatchType) filter.dispatchType = String(query.dispatchType);

  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.createdAt.$lte = new Date(query.dateTo);
  }

  const items = await MessageDispatch.find(filter)
    .populate("chargeId customerId retryOf")
    .sort({ createdAt: -1 })
    .lean();

  return items;
}

export async function getDispatchById(id) {
  const dispatch = await MessageDispatch.findById(id)
    .populate("chargeId customerId retryOf")
    .lean();

  if (!dispatch) throw new ApiError(404, "Disparo não encontrado.");
  return dispatch;
}

export async function sendManualDispatch(payload, auth) {
  const { charge, customer } = await resolveChargeAndCustomer(payload.chargeId);

  const template = payload.templateId
    ? await MessageTemplate.findById(payload.templateId).lean()
    : null;

  if (payload.templateId && !template) {
    throw new ApiError(404, "Template não encontrado.");
  }

  const variables = buildTemplateVariables({ charge, customer });
  const baseMessage = payload.finalMessage
    ? String(payload.finalMessage)
    : renderTemplate(template?.content || "", variables);

  if (!baseMessage.trim()) {
    throw new ApiError(400, "Mensagem final não pode ser vazia.");
  }

  const phone = normalizePhone(payload.phone || customer.phone);
  const idempotencyKey = buildManualIdempotencyKey({
    chargeId: charge._id,
    templateId: template?._id,
    phone,
    fingerprint: `${baseMessage.length}-${Date.now()}`,
  });

  const dispatch = await MessageDispatch.create({
    chargeId: charge._id,
    customerId: customer._id,
    phone,
    renderedMessage: baseMessage,
    templateUsed: buildTemplateSnapshot(template),
    dispatchType: "manual",
    status: "queued",
    attemptsCount: 0,
    idempotencyKey,
    createdByUserId: auth?.userId || null,
  });

  return processDispatch(dispatch._id);
}

export async function retryDispatch(dispatchId, auth) {
  const previous = await MessageDispatch.findById(dispatchId).lean();
  if (!previous) throw new ApiError(404, "Disparo não encontrado.");
  if (previous.status !== "failed") {
    throw new ApiError(400, "Apenas disparos com falha podem ser reenviados.");
  }

  const retry = await MessageDispatch.create({
    chargeId: previous.chargeId,
    customerId: previous.customerId,
    phone: previous.phone,
    renderedMessage: previous.renderedMessage,
    templateUsed: previous.templateUsed,
    dispatchType: "retry",
    status: "queued",
    attemptsCount: 0,
    retryOf: previous._id,
    idempotencyKey: `retry:${previous._id}:${Date.now()}`,
    createdByUserId: auth?.userId || null,
  });

  return processDispatch(retry._id);
}

function matchReminderRule(charge, rules, now = new Date()) {
  const dueDate = new Date(charge.dueDate);
  const daysDiff = Math.round((new Date(dueDate).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 86400000);

  return rules.find((rule) => {
    if (!rule.enabled) return false;
    if (rule.eventType === "before_due") return daysDiff === Math.abs(rule.daysOffset || 0);
    if (rule.eventType === "due_today") return daysDiff === 0;
    if (rule.eventType === "after_due") return daysDiff === -Math.abs(rule.daysOffset || 0);
    return false;
  });
}

export async function queueAndSendAutomaticReminder({ charge, customer, rules, auth = null, now = new Date() }) {
  const rule = matchReminderRule(charge, rules, now);
  if (!rule) return null;

  const eventKey = `${rule.eventType}:${Math.abs(rule.daysOffset || 0)}`;
  const idempotencyKey = buildReminderIdempotencyKey({ chargeId: charge._id, eventKey, date: now });

  const existing = await MessageDispatch.findOne({ idempotencyKey }).lean();
  if (existing) {
    return { skipped: true, reason: "idempotent_duplicate", dispatch: existing };
  }

  const template = rule.templateId
    ? await MessageTemplate.findById(rule.templateId).lean()
    : await MessageTemplate.findOne({ category: rule.eventType, isActive: true }).sort({ updatedAt: -1 }).lean();

  if (!template) {
    throw new ApiError(400, `Nenhum template ativo encontrado para a regra ${rule.name}.`);
  }

  const variables = buildTemplateVariables({ charge, customer });
  const renderedMessage = renderTemplate(template.content, variables);

  const dispatch = await MessageDispatch.create({
    chargeId: charge._id,
    customerId: customer._id,
    phone: normalizePhone(customer.phone),
    renderedMessage,
    templateUsed: buildTemplateSnapshot(template),
    dispatchType: "automatic",
    reminderEventKey: eventKey,
    status: "queued",
    attemptsCount: 0,
    idempotencyKey,
    createdByUserId: auth?.userId || null,
  });

  return processDispatch(dispatch._id);
}

export async function runReminderDispatchCycle({ limit = 100, auth = null, now = new Date() } = {}) {
  const rules = await ReminderRule.find({ enabled: true }).lean();
  if (!rules.length) return { processed: 0, sent: 0, failed: 0, skipped: 0, items: [] };

  const charges = await Charge.find({
    autoReminderEnabled: true,
    status: { $nin: ["paid", "cancelled"] },
    dueDate: { $exists: true },
  })
    .sort({ dueDate: 1 })
    .limit(limit)
    .lean();

  const items = [];
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const charge of charges) {
    const customer = await Customer.findById(charge.customerId).lean();
    if (!customer || !customer.isActive) {
      skipped += 1;
      continue;
    }

    const result = await queueAndSendAutomaticReminder({ charge, customer, rules, auth, now });
    if (!result) {
      skipped += 1;
      continue;
    }

    items.push(result);

    if (result.skipped) skipped += 1;
    else if (result.status === "sent") sent += 1;
    else if (result.status === "failed") failed += 1;
    else if (result?.status === "processing") sent += 1;
    else if (result?.status === "queued") sent += 1;
    else if (result?.status === "failed") failed += 1;
    else if (result?.error) failed += 1;
    else if (result?.status === "sent") sent += 1;
  }

  return {
    processed: charges.length,
    sent,
    failed,
    skipped,
    items,
  };
}
