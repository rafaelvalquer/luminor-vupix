import { ReminderRule } from "../models/ReminderRule.js";
import { MessageTemplate } from "../models/MessageTemplate.js";
import { ApiError } from "../utils/apiError.js";
import { ensureDefaultTemplates } from "./template.service.js";
import { runReminderDispatchCycle } from "./dispatch.service.js";

const DEFAULT_RULES = [
  { name: "2 dias antes do vencimento", eventType: "before_due", daysOffset: 2, enabled: true },
  { name: "No dia do vencimento", eventType: "due_today", daysOffset: 0, enabled: true },
  { name: "2 dias após o vencimento", eventType: "after_due", daysOffset: 2, enabled: true },
];

export async function ensureDefaultReminderRules() {
  await ensureDefaultTemplates();
  const count = await ReminderRule.countDocuments();
  if (count > 0) return;

  const templates = await MessageTemplate.find({ isActive: true }).lean();

  const rules = DEFAULT_RULES.map((rule) => ({
    ...rule,
    templateId:
      templates.find((item) => item.category === rule.eventType)?._id || null,
  }));

  await ReminderRule.insertMany(rules);
}

export async function listReminderRules() {
  return ReminderRule.find().populate("templateId").sort({ createdAt: 1 }).lean();
}

export async function createReminderRule(payload) {
  if (payload.templateId) {
    const template = await MessageTemplate.findById(payload.templateId).lean();
    if (!template) throw new ApiError(404, "Template não encontrado.");
  }

  const rule = await ReminderRule.create({
    name: String(payload.name || "").trim(),
    eventType: String(payload.eventType || "due_today"),
    daysOffset: Number(payload.daysOffset || 0),
    enabled: payload.enabled !== false,
    templateId: payload.templateId || null,
  });

  return ReminderRule.findById(rule._id).populate("templateId").lean();
}

export async function updateReminderRule(id, payload) {
  const rule = await ReminderRule.findById(id);
  if (!rule) throw new ApiError(404, "Regra não encontrada.");

  if (payload.templateId !== undefined && payload.templateId) {
    const template = await MessageTemplate.findById(payload.templateId).lean();
    if (!template) throw new ApiError(404, "Template não encontrado.");
  }

  if (payload.name !== undefined) rule.name = String(payload.name || "").trim();
  if (payload.eventType !== undefined) rule.eventType = String(payload.eventType || rule.eventType);
  if (payload.daysOffset !== undefined) rule.daysOffset = Number(payload.daysOffset || 0);
  if (payload.enabled !== undefined) rule.enabled = Boolean(payload.enabled);
  if (payload.templateId !== undefined) rule.templateId = payload.templateId || null;

  await rule.save();
  return ReminderRule.findById(rule._id).populate("templateId").lean();
}

export async function runReminderJobNow(auth) {
  return runReminderDispatchCycle({ auth });
}
