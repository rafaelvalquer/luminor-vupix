const ALLOWED_PROFILES = ["divertido", "profissional", "empatico"];

export function normalizeMessageProfile(rawProfile) {
  const value = String(rawProfile || "").trim();
  if (!value) return "profissional";
  if (!ALLOWED_PROFILES.includes(value)) {
    throw new Error("INVALID_PROFILE");
  }
  return value;
}

export function getChargeMessageProfile(charge) {
  const value = charge?.messageProfile;
  if (!value || !ALLOWED_PROFILES.includes(value)) {
    return "profissional";
  }
  return value;
}

export function buildProfiledMessage({ profile, baseMessage, customerName, amount, dueDate, description }) {
  const safeProfile = ALLOWED_PROFILES.includes(profile) ? profile : "profissional";
  const core = String(baseMessage || "").trim();

  const commonContext =
    description && amount && dueDate
      ? `'${description}' no valor de ${amount}, com vencimento em ${dueDate}`
      : description && amount
      ? `'${description}' no valor de ${amount}`
      : description || "";

  if (safeProfile === "divertido") {
    const intro = customerName
      ? `Oi, ${customerName}! Vamos deixar as contas em dia de um jeito leve?`
      : "Oi! Vamos deixar as contas em dia de um jeito leve?";
    const outro =
      "Se já estiver tudo certo por aí, pode desconsiderar. Se precisar de algo, é só responder por aqui.";

    if (!core) {
      return [intro, commonContext ? `Falo sobre ${commonContext}.` : "", outro].filter(Boolean).join(" ");
    }

    return [intro, core, outro].filter(Boolean).join(" ");
  }

  if (safeProfile === "empatico") {
    const intro = customerName
      ? `Olá, ${customerName}. Espero que você esteja bem.`
      : "Olá. Espero que você esteja bem.";
    const outro =
      "Se precisar ajustar prazos ou tiver qualquer dúvida sobre essa cobrança, responda esta mensagem para alinharmos da melhor forma.";

    if (!core) {
      return [
        intro,
        commonContext
          ? `Estamos entrando em contato sobre ${commonContext}, registrada em nosso sistema.`
          : "",
        outro,
      ]
        .filter(Boolean)
        .join(" ");
    }

    return [intro, core, outro].filter(Boolean).join(" ");
  }

  // profissional (padrão)
  const intro = customerName
    ? `Olá, ${customerName}. Esta é uma mensagem sobre uma cobrança registrada em seu nome.`
    : "Olá. Esta é uma mensagem sobre uma cobrança registrada em seu nome.";

  if (!core) {
    return commonContext
      ? `${intro} Referente a ${commonContext}. Em caso de dúvidas, estamos à disposição por este canal.`
      : `${intro} Em caso de dúvidas, estamos à disposição por este canal.`;
  }

  return [intro, core].filter(Boolean).join(" ");
}

