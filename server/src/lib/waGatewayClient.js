import axios from "axios";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

const http = axios.create({
  baseURL: env.waGatewayBaseUrl,
  timeout: env.waGatewayTimeoutMs,
  headers: {
    "x-api-key": env.waGatewayApiKey,
    "Content-Type": "application/json",
  },
});

function normalizeGatewayError(error) {
  if (error.response) {
    return new ApiError(
      error.response.status || 502,
      error.response.data?.error || "wa_gateway_request_failed",
      error.response.data || null
    );
  }

  if (error.code === "ECONNABORTED") {
    return new ApiError(504, "wa_gateway_timeout", { code: error.code });
  }

  return new ApiError(503, "wa_gateway_unavailable", {
    message: error.message,
    code: error.code || null,
  });
}

export async function getGatewayHealth() {
  try {
    const { data } = await http.get("/health");
    return data;
  } catch (error) {
    throw normalizeGatewayError(error);
  }
}

export async function getGatewayStatus() {
  try {
    const { data } = await http.get("/status");
    return data;
  } catch (error) {
    throw normalizeGatewayError(error);
  }
}

export async function sendWhatsAppMessage({ to, message }) {
  try {
    const { data } = await http.post("/send", { to, message });
    return data;
  } catch (error) {
    throw normalizeGatewayError(error);
  }
}

export async function restartGateway() {
  try {
    const { data } = await http.post("/restart");
    return data;
  } catch (error) {
    throw normalizeGatewayError(error);
  }
}

export function getGatewayQrUrl() {
  return `${env.waGatewayBaseUrl.replace(/\/$/, "")}/qr`;
}
