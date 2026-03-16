import { MessageTemplate } from "../models/MessageTemplate.js";
import { ReminderRule } from "../models/ReminderRule.js";
import { ApiError } from "../utils/apiError.js";

const GENTLE_DEFAULT_PROFILE_KEY = "gentil-padrao";

const DEFAULT_TEMPLATES = [
  {
    name: "Lembrete 2 dias antes",
    category: "before_due",
    content:
      "Ola, {{customerName}} 🙂 Tudo bem por ai? Passando para lembrar da cobranca '{{chargeDescription}}' no valor de {{amount}}, com vencimento em {{dueDate}}. Se ja estiver tudo certo, pode desconsiderar esta mensagem.",
    isSystemDefault: true,
    profileKey: GENTLE_DEFAULT_PROFILE_KEY,
    eventTypeWithinProfile: "before_due",
  },
  {
    name: "Lembrete vencimento hoje",
    category: "due_today",
    content:
      "Ola, {{customerName}} 🙂 Tudo certo por ai? A cobranca '{{chargeDescription}}' no valor de {{amount}} vence hoje, {{dueDate}}. Se ja tiver pago, desconsidere; caso contrario, pedimos a gentileza de regularizar assim que puder.",
    isSystemDefault: true,
    profileKey: GENTLE_DEFAULT_PROFILE_KEY,
    eventTypeWithinProfile: "due_today",
  },
  {
    name: "Lembrete pós-vencimento",
    category: "after_due",
    content:
      "Ola, {{customerName}} 🙂 Tudo bem? A cobranca '{{chargeDescription}}' no valor de {{amount}} venceu em {{dueDate}} e ainda consta como pendente em nosso sistema. Se precisar de ajuda ou de algum combinado, responda por aqui para alinharmos da melhor forma.",
    isSystemDefault: true,
    profileKey: GENTLE_DEFAULT_PROFILE_KEY,
    eventTypeWithinProfile: "after_due",
  },
  {
    name: "Mensagem manual padrão",
    category: "manual",
    content:
      "Ola, {{customerName}} 🙂 Estou entrando em contato sobre '{{chargeDescription}}', no valor de {{amount}}, com vencimento em {{dueDate}}. Qualquer duvida sobre o boleto ou forma de pagamento, e so responder por aqui.",
    isSystemDefault: true,
    profileKey: GENTLE_DEFAULT_PROFILE_KEY,
    eventTypeWithinProfile: "manual",
  },
];

export async function ensureDefaultTemplates() {
  const count = await MessageTemplate.countDocuments();
  if (count > 0) return;
  await MessageTemplate.insertMany(
    DEFAULT_TEMPLATES.map((template) => ({
      ...template,
      isActive: true,
    }))
  );
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
    isSystemDefault: false,
    profileKey: payload.profileKey || null,
    eventTypeWithinProfile: payload.eventTypeWithinProfile || null,
  });

  return template.toObject();
}

export async function updateTemplate(id, payload) {
  const template = await MessageTemplate.findById(id);
  if (!template) throw new ApiError(404, "Template não encontrado.");

  if (template.isSystemDefault) {
    throw new ApiError(409, "Templates default nao podem ser alterados.");
  }

  if (payload.name !== undefined) template.name = String(payload.name || "").trim();
  if (payload.category !== undefined) template.category = String(payload.category || "manual").trim();
  if (payload.content !== undefined) template.content = String(payload.content || "").trim();
  if (payload.isActive !== undefined) template.isActive = Boolean(payload.isActive);
  if (payload.profileKey !== undefined) template.profileKey = payload.profileKey || null;
  if (payload.eventTypeWithinProfile !== undefined) {
    template.eventTypeWithinProfile = payload.eventTypeWithinProfile || null;
  }

  await template.save();
  return template.toObject();
}

export async function deleteTemplate(id) {
  const template = await MessageTemplate.findById(id);
  if (template?.isSystemDefault) {
    throw new ApiError(409, "Templates default nao podem ser excluidos.");
  }
  const linkedRulesCount = template
    ? await ReminderRule.countDocuments({ templateId: template._id })
    : 0;
  if (linkedRulesCount > 0) {
    throw new ApiError(
      409,
      `Template esta vinculado a ${linkedRulesCount} regra(s) de lembrete e nao pode ser excluido.`
    );
  }
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

export async function listGentleProfiles() {
  const templates = await MessageTemplate.find({
    profileKey: { $ne: null },
    eventTypeWithinProfile: { $in: ["before_due", "due_today", "after_due", "manual"] },
  })
    .sort({ createdAt: 1 })
    .lean();

  const byProfile = new Map();

  for (const template of templates) {
    if (!template.profileKey) continue;
    if (!byProfile.has(template.profileKey)) {
      byProfile.set(template.profileKey, {
        profileKey: template.profileKey,
        name: template.name,
        isSystemDefault: Boolean(template.isSystemDefault),
        phrases: {
          before_due: null,
          due_today: null,
          after_due: null,
          manual: null,
        },
      });
    }

    const profile = byProfile.get(template.profileKey);
    if (template.eventTypeWithinProfile && profile.phrases[template.eventTypeWithinProfile] == null) {
      profile.phrases[template.eventTypeWithinProfile] = {
        _id: template._id,
        content: template.content,
        category: template.category,
        eventTypeWithinProfile: template.eventTypeWithinProfile,
      };
    }
  }

  return Array.from(byProfile.values());
}

export async function createGentleProfile(payload) {
  const name = String(payload.name || "").trim();
  if (!name) {
    throw new ApiError(400, "Nome do perfil gentil e obrigatorio.");
  }

  const phrases = payload.phrases || {};
  const requiredKeys = ["before_due", "due_today", "after_due", "manual"];
  for (const key of requiredKeys) {
    const value = String(phrases[key] || "").trim();
    if (!value) {
      throw new ApiError(400, `Frase para ${key} e obrigatoria.`);
    }
  }

  const profileKey = `gentil-${Date.now()}`;

  const docs = requiredKeys.map((eventType) => ({
    name: `${name} - ${eventType}`,
    category: eventType === "manual" ? "manual" : eventType,
    content: String(phrases[eventType] || "").trim(),
    isActive: true,
    isSystemDefault: false,
    profileKey,
    eventTypeWithinProfile: eventType,
  }));

  await MessageTemplate.insertMany(docs);

  return {
    profileKey,
    name,
  };
}
