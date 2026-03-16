import { api } from "../app/api.js";

export async function getWhatsAppStatus() {
  const { data } = await api.get("/integrations/whatsapp/status");
  return data.item;
}

export async function restartWhatsApp() {
  const { data } = await api.post("/integrations/whatsapp/restart");
  return data.item;
}
