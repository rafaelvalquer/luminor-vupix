import { IntegrationSetting } from "../models/IntegrationSetting.js";
import { getGatewayHealth, getGatewayQrUrl, getGatewayStatus, restartGateway } from "../lib/waGatewayClient.js";

async function upsertStatus(lastStatus) {
  await IntegrationSetting.findOneAndUpdate(
    { key: "whatsapp" },
    {
      $set: {
        provider: "whatsapp-web.js",
        isActive: true,
        lastStatus,
        lastCheckedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );
}

export async function getWhatsAppIntegrationStatus() {
  const [health, status] = await Promise.all([getGatewayHealth(), getGatewayStatus()]);
  const payload = {
    health,
    status,
    qrUrl: getGatewayQrUrl(),
  };
  await upsertStatus(payload);
  return payload;
}

export async function restartWhatsAppIntegration() {
  const result = await restartGateway();
  await upsertStatus({ restart: result });
  return result;
}
