export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + Number(days || 0));
  return d;
}

export function diffInCalendarDays(a, b) {
  const startA = startOfDay(a).getTime();
  const startB = startOfDay(b).getTime();
  return Math.round((startA - startB) / 86400000);
}

export function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function formatDateBR(date) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export function formatCurrencyBRLFromCents(cents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((Number(cents) || 0) / 100);
}

export function deriveChargeStatus(charge, referenceDate = new Date()) {
  const current = String(charge?.status || "pending");
  if (["paid", "cancelled"].includes(current)) return current;

  const dueDate = new Date(charge?.dueDate);
  if (Number.isNaN(dueDate.getTime())) return "pending";

  if (isSameDay(dueDate, referenceDate)) return "due_today";
  if (startOfDay(dueDate) < startOfDay(referenceDate)) return "overdue";
  return "pending";
}

export function computeNextReminderAt(charge, rules = [], referenceDate = new Date()) {
  const dueDate = new Date(charge?.dueDate);
  if (Number.isNaN(dueDate.getTime())) return null;

  const candidates = rules
    .filter((rule) => rule?.enabled)
    .map((rule) => {
      if (rule.eventType === "before_due") return addDays(dueDate, -Math.abs(rule.daysOffset || 0));
      if (rule.eventType === "due_today") return startOfDay(dueDate);
      if (rule.eventType === "after_due") return addDays(dueDate, Math.abs(rule.daysOffset || 0));
      return null;
    })
    .filter(Boolean)
    .filter((date) => startOfDay(date) >= startOfDay(referenceDate))
    .sort((a, b) => a.getTime() - b.getTime());

  return candidates[0] || null;
}
