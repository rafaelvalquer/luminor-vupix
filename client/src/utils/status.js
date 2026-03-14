export const chargeStatusMap = {
  pending: { label: "Pendente", tone: "neutral" },
  due_today: { label: "Vence hoje", tone: "warning" },
  overdue: { label: "Vencida", tone: "danger" },
  paid: { label: "Paga", tone: "success" },
  cancelled: { label: "Cancelada", tone: "muted" },
};

export const dispatchStatusMap = {
  queued: { label: "Na fila", tone: "neutral" },
  processing: { label: "Processando", tone: "warning" },
  sent: { label: "Enviada", tone: "success" },
  failed: { label: "Falhou", tone: "danger" },
  cancelled: { label: "Cancelada", tone: "muted" },
};

export const dispatchTypeMap = {
  manual: "Manual",
  automatic: "Automático",
  retry: "Retry",
};

export function getChargeStatusMeta(status) {
  return chargeStatusMap[status] || { label: status || "—", tone: "neutral" };
}

export function getDispatchStatusMeta(status) {
  return dispatchStatusMap[status] || { label: status || "—", tone: "neutral" };
}
