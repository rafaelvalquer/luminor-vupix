export function buildReminderIdempotencyKey({ chargeId, eventKey, date = new Date() }) {
  const stamp = new Date(date).toISOString().slice(0, 10);
  return `reminder:${chargeId}:${eventKey}:${stamp}`;
}

export function buildManualIdempotencyKey({ chargeId, templateId, phone, fingerprint }) {
  return `manual:${chargeId}:${templateId || "custom"}:${phone}:${fingerprint || Date.now()}`;
}
