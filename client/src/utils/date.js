export function formatDate(date) {
  if (!date) return "-";
  const normalized = normalizeCalendarDate(date);
  if (Number.isNaN(normalized.getTime())) return "-";
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(normalized);
}

export function formatDateTime(date) {
  if (!date) return "-";
  const normalized = new Date(date);
  if (Number.isNaN(normalized.getTime())) return "-";
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(normalized);
}

export function toDateInputValue(date) {
  if (!date) return "";
  const d = normalizeCalendarDate(date);
  if (Number.isNaN(d.getTime())) return "";
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function normalizeCalendarDate(value) {
  if (!value) return value;

  const match =
    typeof value === "string" ? String(value).trim().match(DATE_ONLY_PATTERN) : null;

  if (match) {
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return date;

  const isUtcMidnight =
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;

  if (isUtcMidnight) {
    return new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      12,
      0,
      0,
      0
    );
  }

  return date;
}
