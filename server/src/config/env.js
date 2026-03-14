import dotenv from "dotenv";

dotenv.config();

function required(name, fallback = "") {
  const value = process.env[name] ?? fallback;
  if (value === "") {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  mongoUri: required("MONGODB_URI", "mongodb://127.0.0.1:27017/luminor-vupix"),
  jwtSecret: required("JWT_SECRET", "change-me-super-secret"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigins: splitCsv(process.env.CORS_ORIGIN || "http://localhost:5173"),
  defaultAdminName: process.env.DEFAULT_ADMIN_NAME || "Admin",
  defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL || "admin@luminorvupix.local",
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD || "123456",
  waGatewayBaseUrl: required("WA_GATEWAY_BASE_URL", "http://localhost:3010"),
  waGatewayApiKey: required("WA_GATEWAY_API_KEY", "change-me"),
  waGatewayTimeoutMs: Number(process.env.WA_GATEWAY_TIMEOUT_MS || 15000),
  reminderCron: process.env.REMINDER_CRON || "*/2 * * * *",
  reminderBatchLimit: Number(process.env.REMINDER_BATCH_LIMIT || 100),
};
