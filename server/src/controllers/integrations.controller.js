import { getWhatsAppIntegrationStatus, restartWhatsAppIntegration } from "../services/integration.service.js";

export async function getWhatsAppStatus(_req, res) {
  const item = await getWhatsAppIntegrationStatus();
  res.json({ ok: true, item });
}

export async function postWhatsAppRestart(_req, res) {
  const item = await restartWhatsAppIntegration();
  res.json({ ok: true, item });
}
