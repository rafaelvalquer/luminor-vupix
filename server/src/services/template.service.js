import { MessageTemplate } from "../models/MessageTemplate.js";
import { ApiError } from "../utils/apiError.js";

const DEFAULT_TEMPLATES = [
  {
    name: "Lembrete 2 dias antes",
    category: "before_due",
    content:
      "Olá, {{customerName}}. Passando para lembrar da cobrança '{{chargeDescription}}' no valor de {{amount}}, com vencimento em {{dueDate}}.",
  },
  {
    name: "Lembrete vencimento hoje",
    category: "due_today",
    content:
      "Olá, {{customerName}}. A cobrança '{{chargeDescription}}' no valor de {{amount}} vence hoje, {{dueDate}}. Qualquer dúvida, fico à disposição.",
  },
  {
    name: "Lembrete pós-vencimento",
    category: "after_due",
    content:
      "Olá, {{customerName}}. A cobrança '{{chargeDescription}}' no valor de {{amount}} venceu em {{dueDate}} e ainda está pendente. Posso te ajudar com algo?",
  },
  {
    name: "Mensagem manual padrão",
    category: "manual",
    content:
      "Olá, {{customerName}}. Estou entrando em contato sobre '{{chargeDescription}}', no valor de {{amount}}, com vencimento em {{dueDate}}.",
  },
];

export async function ensureDefaultTemplates() {
  const count = await MessageTemplate.countDocuments();
  if (count > 0) return;
  await MessageTemplate.insertMany(DEFAULT_TEMPLATES.map((template) => ({ ...template, isActive: true })));
}

export async function listTemplates(query = {}) {
  const filter = {};
  if (query.category) filter.category = String(query.category);
  if (query.isActive !== undefined && query.isActive !== "") {
    filter.isActive = String(query.isActive) === "true";
  }
  return MessageTemplate.find(filter).sort({ createdAt: -1 }).lean();
}

export async function createTemplate(payload) {
  const template = await MessageTemplate.create({
    name: String(payload.name || "").trim(),
    category: String(payload.category || "manual").trim(),
    content: String(payload.content || "").trim(),
    isActive: payload.isActive !== false,
  });

  return template.toObject();
}

export async function updateTemplate(id, payload) {
  const template = await MessageTemplate.findById(id);
  if (!template) throw new ApiError(404, "Template não encontrado.");

  if (payload.name !== undefined) template.name = String(payload.name || "").trim();
  if (payload.category !== undefined) template.category = String(payload.category || "manual").trim();
  if (payload.content !== undefined) template.content = String(payload.content || "").trim();
  if (payload.isActive !== undefined) template.isActive = Boolean(payload.isActive);

  await template.save();
  return template.toObject();
}

export async function deleteTemplate(id) {
  const template = await MessageTemplate.findById(id);
  if (!template) throw new ApiError(404, "Template não encontrado.");
  await template.deleteOne();
  return { success: true };
}

export async function getTemplateById(id) {
  const template = await MessageTemplate.findById(id).lean();
  if (!template) throw new ApiError(404, "Template não encontrado.");
  return template;
}

export async function getActiveTemplateByCategory(category) {
  let template = await MessageTemplate.findOne({ category, isActive: true }).sort({ updatedAt: -1 }).lean();
  if (!template) {
    await ensureDefaultTemplates();
    template = await MessageTemplate.findOne({ category, isActive: true }).sort({ updatedAt: -1 }).lean();
  }
  if (!template) throw new ApiError(404, `Template ativo não encontrado para categoria ${category}.`);
  return template;
}
