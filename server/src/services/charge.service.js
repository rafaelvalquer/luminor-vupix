import { Charge } from "../models/Charge.js";
import { Customer } from "../models/Customer.js";
import { ReminderRule } from "../models/ReminderRule.js";
import { ApiError } from "../utils/apiError.js";
import { normalizeMessageProfile } from "../utils/messageProfile.js";
import {
  computeNextReminderAt,
  deriveChargeStatus,
  endOfDay,
  normalizeCalendarDate,
  startOfDay,
} from "../utils/date.js";

function parseAmountCents(value) {
  const amountCents = Number(value);
  if (!Number.isFinite(amountCents) || amountCents < 0) {
    throw new ApiError(400, "Valor da cobrança inválido.");
  }

  return amountCents;
}

function parseDueDate(value) {
  const dueDate = normalizeCalendarDate(value);
  if (!(dueDate instanceof Date) || Number.isNaN(dueDate.getTime())) {
    throw new ApiError(400, "Data de vencimento inválida.");
  }

  return dueDate;
}

function parseMessageProfile(value) {
  try {
    return normalizeMessageProfile(value);
  } catch (error) {
    if (error?.message === "INVALID_PROFILE") {
      throw new ApiError(400, "Perfil de cobranca invalido.");
    }
    throw error;
  }
}

function applyChargeStatusFilter(filter, requestedStatus, referenceDate = new Date()) {
  const status = String(requestedStatus || "").trim();
  if (!status) return;

  if (status === "paid" || status === "cancelled") {
    filter.status = status;
    return;
  }

  filter.status = { $nin: ["paid", "cancelled"] };

  if (status === "due_today") {
    filter.dueDate = {
      $gte: startOfDay(referenceDate),
      $lte: endOfDay(referenceDate),
    };
    return;
  }

  if (status === "overdue") {
    filter.dueDate = { $lt: startOfDay(referenceDate) };
    return;
  }

  if (status === "pending") {
    filter.dueDate = { $gt: endOfDay(referenceDate) };
  }
}

export async function listCharges(query = {}) {
  const filter = {};

  if (query.customerId) filter.customerId = String(query.customerId);
  applyChargeStatusFilter(filter, query.status);

  if (query.search) {
    const regex = new RegExp(String(query.search).trim(), "i");
    const customers = await Customer.find({ name: regex }).select("_id").lean();
    filter.$or = [
      { description: regex },
      { notes: regex },
      { customerId: { $in: customers.map((item) => item._id) } },
    ];
  }

  const charges = await Charge.find(filter)
    .populate("customerId")
    .sort({ dueDate: 1, createdAt: -1 })
    .lean();

  return charges.map((charge) => ({ ...charge, status: deriveChargeStatus(charge) }));
}

export async function createCharge(payload) {
  const customer = await Customer.findById(payload.customerId).lean();
  if (!customer) throw new ApiError(404, "Cliente não encontrado.");

  const description = String(payload.description || "").trim();
  if (!description) throw new ApiError(400, "Descricao da cobranca e obrigatoria.");
  if (!description) throw new ApiError(400, "DescriÃ§Ã£o da cobranÃ§a Ã© obrigatÃ³ria.");

  const amountCents = parseAmountCents(payload.amountCents);
  const dueDate = parseDueDate(payload.dueDate);
  const messageProfile = parseMessageProfile(payload.messageProfile);
  const rules = await ReminderRule.find({ enabled: true }).lean();
  const nextReminderAt =
    payload.autoReminderEnabled === false
      ? null
      : computeNextReminderAt({ ...payload, dueDate }, rules);

  const charge = await Charge.create({
    customerId: payload.customerId,
    description,
    amountCents,
    dueDate,
    notes: String(payload.notes || "").trim(),
    autoReminderEnabled: payload.autoReminderEnabled !== false,
     messageProfile,
    nextReminderAt,
    status: deriveChargeStatus({ ...payload, dueDate }),
  });

  return getChargeById(charge._id);
}

export async function getChargeById(id) {
  const charge = await Charge.findById(id).populate("customerId lastDispatchId").lean();
  if (!charge) throw new ApiError(404, "Cobrança não encontrada.");
  return { ...charge, status: deriveChargeStatus(charge) };
}

export async function updateCharge(id, payload) {
  const charge = await Charge.findById(id);
  if (!charge) throw new ApiError(404, "Cobrança não encontrada.");

  if (payload.customerId !== undefined) {
    const customer = await Customer.findById(payload.customerId).lean();
    if (!customer) throw new ApiError(404, "Cliente não encontrado.");
    charge.customerId = payload.customerId;
  }

  if (payload.description !== undefined) {
    const description = String(payload.description || "").trim();
    if (!description) throw new ApiError(400, "Descricao da cobranca e obrigatoria.");
    if (!description) throw new ApiError(400, "DescriÃ§Ã£o da cobranÃ§a Ã© obrigatÃ³ria.");
    charge.description = description;
  }
  if (payload.amountCents !== undefined) charge.amountCents = parseAmountCents(payload.amountCents);
  if (payload.dueDate !== undefined) charge.dueDate = parseDueDate(payload.dueDate);
  if (payload.notes !== undefined) charge.notes = String(payload.notes || "").trim();
  if (payload.autoReminderEnabled !== undefined) charge.autoReminderEnabled = Boolean(payload.autoReminderEnabled);
  if (payload.messageProfile !== undefined) {
    charge.messageProfile = parseMessageProfile(payload.messageProfile);
  }

  const rules = await ReminderRule.find({ enabled: true }).lean();
  charge.status = deriveChargeStatus(charge);
  charge.nextReminderAt = charge.autoReminderEnabled ? computeNextReminderAt(charge, rules) : null;

  await charge.save();
  return getChargeById(charge._id);
}

export async function markChargePaid(id) {
  const charge = await Charge.findById(id);
  if (charge?.status === "cancelled") {
    throw new ApiError(409, "Cobranca cancelada nao pode ser marcada como paga.");
  }
  if (charge?.status === "paid") {
    return getChargeById(charge._id);
  }
  if (!charge) throw new ApiError(404, "Cobrança não encontrada.");
  charge.status = "paid";
  charge.paidAt = new Date();
  charge.nextReminderAt = null;
  await charge.save();
  return getChargeById(charge._id);
}

export async function cancelCharge(id) {
  const charge = await Charge.findById(id);
  if (charge?.status === "paid") {
    throw new ApiError(409, "Cobranca paga nao pode ser cancelada.");
  }
  if (charge?.status === "cancelled") {
    return getChargeById(charge._id);
  }
  if (!charge) throw new ApiError(404, "Cobrança não encontrada.");
  charge.status = "cancelled";
  charge.cancelledAt = new Date();
  charge.nextReminderAt = null;
  await charge.save();
  return getChargeById(charge._id);
}
