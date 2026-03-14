import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import qrcodePkg from "qrcode-terminal";
import whatsappPkg from "whatsapp-web.js";
import QRCode from "qrcode";

dotenv.config();

const qrcode = qrcodePkg?.default ?? qrcodePkg;
const { Client, LocalAuth } = whatsappPkg?.default ?? whatsappPkg;

const PORT = Number(process.env.PORT || process.env.WA_PORT || 3010);
const API_KEY = String(process.env.WA_API_KEY || "").trim();

const QR_PUBLIC =
  String(process.env.WA_QR_PUBLIC || "true").toLowerCase() === "true";

const QR_KEY = String(process.env.WA_QR_KEY || "").trim();

const HEADLESS =
  String(process.env.WA_PUPPETEER_HEADLESS || "true").toLowerCase() === "true";

const CLIENT_ID = String(process.env.WA_CLIENT_ID || "luminor-vupix").trim();

const SESSION_PATH_INPUT = String(
  process.env.WA_SESSION_PATH || "./wa-session",
).trim();

const CHROME_PATH = String(process.env.WA_CHROME_PATH || "").trim();

const RECONNECT_BASE_MS = Number(process.env.WA_RECONNECT_BASE_MS || 5000);
const RECONNECT_MAX_MS = Number(process.env.WA_RECONNECT_MAX_MS || 60000);
const SEND_TIMEOUT_MS = Number(process.env.WA_SEND_TIMEOUT_MS || 30000);

const app = express();
app.use(express.json({ limit: "1mb" }));

function nowIso() {
  return new Date().toISOString();
}

function log(level, message, extra = undefined) {
  const entry = {
    time: nowIso(),
    service: "wa-gateway",
    level,
    message,
  };

  if (extra !== undefined) entry.extra = extra;
  console.log(JSON.stringify(entry));
}

function resolveFsPath(input) {
  if (!input) return path.resolve(process.cwd(), "./wa-session");
  if (path.isAbsolute(input)) return input;
  if (/^[a-zA-Z]:\\/.test(input)) return input;
  return path.resolve(process.cwd(), input);
}

const SESSION_PATH = resolveFsPath(SESSION_PATH_INPUT);
fs.mkdirSync(SESSION_PATH, { recursive: true });

const runtime = {
  state: "INIT",
  ready: false,
  qrDataUrl: null,
  qrUpdatedAt: null,
  lastError: null,
  lastDisconnectedAt: null,
  authenticatedAt: null,
  readyAt: null,
  connectedNumber: null,
  connectedName: null,
  reconnectAttempt: 0,
  reconnectInMs: null,
  restartCount: 0,
  lastRestartAt: null,
  lastSendAt: null,
  lastSendTo: null,
  currentSendCount: 0,
};

let waClient = null;
let initPromise = null;
let restartPromise = null;
let reconnectTimer = null;
let plannedRestartUntil = 0;

function getPublicStatus() {
  const status = runtime.ready
    ? "READY"
    : runtime.qrDataUrl
      ? "QR"
      : runtime.state || "UNKNOWN";

  return {
    ok: true,
    service: "wa-gateway",
    status,
    ready: runtime.ready,
    qrAvailable: Boolean(runtime.qrDataUrl),
    connectedNumber: runtime.connectedNumber,
    connectedName: runtime.connectedName,
    lastError: runtime.lastError,
    reconnectAttempt: runtime.reconnectAttempt,
    reconnectInMs: runtime.reconnectInMs,
    restartCount: runtime.restartCount,
    currentSendCount: runtime.currentSendCount,
    lastSendAt: runtime.lastSendAt,
    lastSendTo: runtime.lastSendTo,
    authenticatedAt: runtime.authenticatedAt,
    readyAt: runtime.readyAt,
    qrUpdatedAt: runtime.qrUpdatedAt,
    lastDisconnectedAt: runtime.lastDisconnectedAt,
    clientId: CLIENT_ID,
    headless: HEADLESS,
    uptimeSeconds: Math.floor(process.uptime()),
    now: nowIso(),
  };
}

function serializeError(error) {
  return {
    message: String(error?.message || "unknown_error"),
    name: error?.name || "Error",
    stack: error?.stack || null,
    at: nowIso(),
  };
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function withTimeout(promise, timeoutMs, label) {
  let timer = null;

  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label}_timeout`));
    }, timeoutMs);
  });

  return Promise.race([
    promise.finally(() => {
      if (timer) clearTimeout(timer);
    }),
    timeoutPromise,
  ]);
}

function sanitizePhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    throw new Error("invalid_phone");
  }
  return digits;
}

function getProviderMessageId(messageResult) {
  return (
    messageResult?.id?._serialized ||
    messageResult?.id?.id ||
    messageResult?.id ||
    null
  );
}

function getChatIdFromNumberId(numberId, digits) {
  if (numberId?._serialized) return numberId._serialized;
  return `${digits}@c.us`;
}

function mapErrorToStatusCode(message) {
  const value = String(message || "").toLowerCase();

  if (
    value.includes("invalid_phone") ||
    value.includes("number_not_registered")
  ) {
    return 400;
  }

  if (value.includes("whatsapp_not_ready")) {
    return 503;
  }

  if (value.includes("_timeout")) {
    return 504;
  }

  if (value.includes("unauthorized")) {
    return 401;
  }

  return 502;
}

function hasValidApiKey(req) {
  const incoming = String(req.get("x-api-key") || "").trim();
  return Boolean(API_KEY) && incoming === API_KEY;
}

function requireApiKey(req, res, next) {
  if (!API_KEY) {
    return res.status(500).json({
      ok: false,
      error: "gateway_api_key_not_configured",
    });
  }

  if (!hasValidApiKey(req)) {
    return res.status(401).json({
      ok: false,
      error: "unauthorized",
    });
  }

  next();
}

function canAccessQr(req) {
  if (hasValidApiKey(req)) return true;

  if (!QR_PUBLIC) return false;
  if (!QR_KEY) return true;

  return String(req.query.key || "").trim() === QR_KEY;
}

function buildWhatsAppClient() {
  const puppeteer = {
    headless: HEADLESS,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--disable-features=site-per-process",
    ],
  };

  if (CHROME_PATH) {
    puppeteer.executablePath = CHROME_PATH;
  }

  return new Client({
    authStrategy: new LocalAuth({
      clientId: CLIENT_ID,
      dataPath: SESSION_PATH,
    }),
    puppeteer,
  });
}

function updateConnectedIdentity() {
  runtime.connectedNumber = waClient?.info?.wid?.user || null;
  runtime.connectedName =
    waClient?.info?.pushname ||
    waClient?.info?.me?._serialized ||
    runtime.connectedName ||
    null;
}

async function initializeClient(reason = "boot") {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    runtime.state = reason === "boot" ? "INITIALIZING" : "REINITIALIZING";
    runtime.ready = false;
    runtime.connectedNumber = null;
    runtime.connectedName = null;

    const client = buildWhatsAppClient();
    waClient = client;

    client.on("qr", async (qr) => {
      try {
        runtime.state = "QR";
        runtime.ready = false;
        runtime.qrUpdatedAt = nowIso();
        runtime.qrDataUrl = await QRCode.toDataURL(qr);
        qrcode.generate(qr, { small: true });
        log("info", "QR code atualizado");
      } catch (error) {
        runtime.lastError = serializeError(error);
        log("error", "Falha ao gerar QR code", runtime.lastError);
      }
    });

    client.on("authenticated", () => {
      runtime.state = "AUTHENTICATED";
      runtime.authenticatedAt = nowIso();
      runtime.lastError = null;
      log("info", "WhatsApp autenticado");
    });

    client.on("ready", () => {
      runtime.state = "READY";
      runtime.ready = true;
      runtime.readyAt = nowIso();
      runtime.qrDataUrl = null;
      runtime.qrUpdatedAt = null;
      runtime.reconnectAttempt = 0;
      runtime.reconnectInMs = null;
      runtime.lastError = null;
      updateConnectedIdentity();
      log("info", "WhatsApp pronto", {
        connectedNumber: runtime.connectedNumber,
        connectedName: runtime.connectedName,
      });
    });

    client.on("change_state", (state) => {
      runtime.state = String(state || "UNKNOWN").toUpperCase();
      updateConnectedIdentity();
      log("info", "Estado alterado", { state: runtime.state });
    });

    client.on("auth_failure", (message) => {
      runtime.ready = false;
      runtime.state = "AUTH_FAILURE";
      runtime.connectedNumber = null;
      runtime.connectedName = null;
      runtime.lastError = {
        message: String(message || "auth_failure"),
        at: nowIso(),
      };
      log("error", "Falha de autenticação", runtime.lastError);
      scheduleReconnect("auth_failure");
    });

    client.on("disconnected", (reasonValue) => {
      runtime.ready = false;
      runtime.state = "DISCONNECTED";
      runtime.lastDisconnectedAt = nowIso();
      runtime.connectedNumber = null;
      runtime.connectedName = null;
      runtime.qrDataUrl = null;
      runtime.qrUpdatedAt = null;
      runtime.lastError = {
        message: `disconnected:${String(reasonValue || "unknown")}`,
        at: nowIso(),
      };

      log("warn", "WhatsApp desconectado", {
        reason: String(reasonValue || "unknown"),
      });

      if (Date.now() < plannedRestartUntil) {
        return;
      }

      scheduleReconnect("disconnected");
    });

    await client.initialize();
    log("info", "Inicialização do cliente solicitada", { reason });
  })()
    .catch((error) => {
      runtime.ready = false;
      runtime.state = "ERROR";
      runtime.lastError = serializeError(error);
      log("error", "Falha ao inicializar client", runtime.lastError);
      scheduleReconnect("initialize_error");
      throw error;
    })
    .finally(() => {
      initPromise = null;
    });

  return initPromise;
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  runtime.reconnectInMs = null;
}

function scheduleReconnect(reason = "unknown") {
  if (restartPromise || reconnectTimer) {
    return;
  }

  runtime.reconnectAttempt += 1;
  const delay = Math.min(
    RECONNECT_BASE_MS * 2 ** Math.max(runtime.reconnectAttempt - 1, 0),
    RECONNECT_MAX_MS,
  );

  runtime.reconnectInMs = delay;

  log("warn", "Agendando reconexão do WhatsApp", {
    reason,
    attempt: runtime.reconnectAttempt,
    delay,
  });

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    runtime.reconnectInMs = null;

    try {
      await restartClient(`auto:${reason}`);
    } catch (error) {
      runtime.lastError = serializeError(error);
      log("error", "Falha na reconexão automática", runtime.lastError);
      scheduleReconnect("retry_after_failed_restart");
    }
  }, delay);
}

async function restartClient(reason = "manual") {
  if (restartPromise) return restartPromise;

  restartPromise = (async () => {
    plannedRestartUntil = Date.now() + 15000;
    clearReconnectTimer();

    runtime.restartCount += 1;
    runtime.lastRestartAt = nowIso();
    runtime.state = "RESTARTING";
    runtime.ready = false;
    runtime.connectedNumber = null;
    runtime.connectedName = null;
    runtime.qrDataUrl = null;
    runtime.qrUpdatedAt = null;

    const currentClient = waClient;
    waClient = null;

    if (currentClient) {
      try {
        await currentClient.destroy();
        log("info", "Client destruído para restart", { reason });
      } catch (error) {
        log("warn", "Erro ao destruir client durante restart", {
          reason,
          error: error?.message || "unknown_error",
        });
      }
    }

    await initializeClient(`restart:${reason}`);
  })().finally(() => {
    restartPromise = null;
  });

  return restartPromise;
}

app.use((req, _res, next) => {
  log("info", "HTTP request", {
    method: req.method,
    path: req.path,
  });
  next();
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "wa-gateway",
    state: runtime.state,
    ready: runtime.ready,
    uptimeSeconds: Math.floor(process.uptime()),
    now: nowIso(),
  });
});

app.get("/status", requireApiKey, (_req, res) => {
  res.json(getPublicStatus());
});

app.get("/qr", (req, res) => {
  if (!canAccessQr(req)) {
    return res.status(401).json({
      ok: false,
      error: "unauthorized",
    });
  }

  const wantsJson =
    String(req.query.format || "").toLowerCase() === "json" ||
    String(req.get("accept") || "").includes("application/json");

  if (!runtime.qrDataUrl) {
    if (wantsJson) {
      return res.status(404).json({
        ok: false,
        error: "qr_not_available",
        status: runtime.state,
        ready: runtime.ready,
      });
    }

    return res.status(404).send(`<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>QR indisponível</title>
    <style>
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        background: #0b1020;
        color: #e7ecf7;
        display: grid;
        min-height: 100vh;
        place-items: center;
      }
      .card {
        width: min(520px, 92vw);
        background: #121934;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 20px;
        padding: 24px;
        box-shadow: 0 20px 60px rgba(0,0,0,.35);
      }
      .muted { color: #98a3c7; }
      code {
        background: rgba(255,255,255,.08);
        padding: 3px 8px;
        border-radius: 8px;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>QR indisponível</h1>
      <p class="muted">O WhatsApp ainda não gerou um QR disponível neste momento.</p>
      <p>Status atual: <code>${escapeHtml(runtime.state)}</code></p>
      <p>Ready: <code>${escapeHtml(String(runtime.ready))}</code></p>
    </div>
  </body>
</html>`);
  }

  if (wantsJson) {
    return res.json({
      ok: true,
      qrAvailable: true,
      qrDataUrl: runtime.qrDataUrl,
      qrUpdatedAt: runtime.qrUpdatedAt,
      status: runtime.ready ? "READY" : runtime.state,
    });
  }

  return res.send(`<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>QR WhatsApp</title>
    <style>
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        background: radial-gradient(circle at top, #1c2755, #0b1020 60%);
        color: #e7ecf7;
        display: grid;
        min-height: 100vh;
        place-items: center;
      }
      .card {
        width: min(540px, 92vw);
        background: rgba(18, 25, 52, 0.95);
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 24px;
        padding: 28px;
        box-shadow: 0 20px 60px rgba(0,0,0,.35);
        text-align: center;
      }
      img {
        width: min(340px, 80vw);
        border-radius: 20px;
        background: white;
        padding: 14px;
      }
      .muted {
        color: #98a3c7;
      }
      .pill {
        display: inline-block;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(255,255,255,.08);
        margin-bottom: 14px;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="pill">Status: ${escapeHtml(runtime.ready ? "READY" : runtime.state)}</div>
      <h1>Conectar WhatsApp</h1>
      <p class="muted">Escaneie o QR abaixo no aplicativo do WhatsApp.</p>
      <img src="${runtime.qrDataUrl}" alt="QR Code WhatsApp" />
      <p class="muted">Atualizado em: ${escapeHtml(runtime.qrUpdatedAt || "-")}</p>
    </div>
  </body>
</html>`);
});

app.post("/send", requireApiKey, async (req, res) => {
  try {
    if (!waClient || !runtime.ready) {
      return res.status(503).json({
        ok: false,
        error: "whatsapp_not_ready",
        status: runtime.state,
      });
    }

    const rawTo = String(req.body?.to || "").trim();
    const message = String(req.body?.message || "").trim();

    if (!rawTo || !message) {
      return res.status(400).json({
        ok: false,
        error: "to_and_message_are_required",
      });
    }

    const digits = sanitizePhone(rawTo);

    runtime.currentSendCount += 1;
    runtime.lastSendAt = nowIso();
    runtime.lastSendTo = digits;

    const numberId = await withTimeout(
      waClient.getNumberId(digits),
      SEND_TIMEOUT_MS,
      "get_number_id",
    );

    if (!numberId) {
      return res.status(400).json({
        ok: false,
        error: "number_not_registered_on_whatsapp",
        to: digits,
      });
    }

    const chatId = getChatIdFromNumberId(numberId, digits);

    const messageResult = await withTimeout(
      waClient.sendMessage(chatId, message),
      SEND_TIMEOUT_MS,
      "send_message",
    );

    const providerMessageId = getProviderMessageId(messageResult);

    log("info", "Mensagem enviada", {
      to: digits,
      providerMessageId,
      chatId,
    });

    return res.json({
      ok: true,
      to: digits,
      chatId,
      providerMessageId,
      sentAt: nowIso(),
    });
  } catch (error) {
    const normalized = serializeError(error);
    const statusCode = mapErrorToStatusCode(normalized.message);

    log("error", "Falha ao enviar mensagem", {
      error: normalized,
      body: {
        to: req.body?.to || null,
      },
    });

    return res.status(statusCode).json({
      ok: false,
      error: normalized.message,
      details: normalized,
    });
  } finally {
    runtime.currentSendCount = Math.max(0, runtime.currentSendCount - 1);
  }
});

app.post("/restart", requireApiKey, async (_req, res) => {
  try {
    await restartClient("api");
    return res.status(202).json({
      ok: true,
      status: "RESTARTING",
      requestedAt: nowIso(),
    });
  } catch (error) {
    const normalized = serializeError(error);
    log("error", "Falha ao reiniciar gateway", normalized);

    return res.status(500).json({
      ok: false,
      error: "restart_failed",
      details: normalized,
    });
  }
});

app.use((error, _req, res, _next) => {
  const normalized = serializeError(error);
  log("error", "Erro não tratado", normalized);

  res.status(500).json({
    ok: false,
    error: "internal_server_error",
    details: normalized,
  });
});

const server = app.listen(PORT, () => {
  log("info", `wa-gateway listening on port ${PORT}`, {
    port: PORT,
    headless: HEADLESS,
    qrPublic: QR_PUBLIC,
    sessionPath: SESSION_PATH,
    clientId: CLIENT_ID,
  });
});

initializeClient("boot").catch((error) => {
  log("error", "Falha inicial na subida do gateway", serializeError(error));
});

async function shutdown(signal) {
  log("warn", "Encerrando wa-gateway", { signal });

  clearReconnectTimer();

  try {
    if (waClient) {
      plannedRestartUntil = Date.now() + 15000;
      await waClient.destroy();
    }
  } catch (error) {
    log("warn", "Erro ao destruir client no shutdown", {
      error: error?.message || "unknown_error",
    });
  }

  server.close(() => {
    process.exit(0);
  });

  setTimeout(() => {
    process.exit(1);
  }, 5000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
