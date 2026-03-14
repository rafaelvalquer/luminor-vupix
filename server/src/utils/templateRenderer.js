import { formatCurrencyBRLFromCents, formatDateBR } from "./date.js";

export function buildTemplateVariables({ charge, customer }) {
  return {
    customerName: customer?.name || "Cliente",
    amount: formatCurrencyBRLFromCents(charge?.amountCents || 0),
    dueDate: charge?.dueDate ? formatDateBR(charge.dueDate) : "-",
    chargeDescription: charge?.description || "Cobrança",
  };
}

export function renderTemplate(content, variables = {}) {
  return String(content || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key) => {
    return variables[key] ?? "";
  });
}
