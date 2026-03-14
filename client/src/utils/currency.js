export function formatBRLFromCents(cents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((Number(cents) || 0) / 100);
}

export function parseMoneyToCents(value) {
  const normalized = String(value || "")
    .replace(/\s/g, "")
    .replace(/[R$]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const numberValue = Number(normalized);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.round(numberValue * 100);
}

export function centsToInputValue(cents) {
  return ((Number(cents) || 0) / 100).toFixed(2).replace(".", ",");
}
