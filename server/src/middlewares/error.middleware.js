import { logger } from "../lib/logger.js";

export function errorMiddleware(error, _req, res, _next) {
  const statusCode = Number(error?.statusCode || 500);

  logger.error("request_failed", {
    statusCode,
    message: error?.message || "Internal server error",
    details: error?.details || null,
    stack: error?.stack || null,
  });

  res.status(statusCode).json({
    ok: false,
    message: error?.message || "Erro interno do servidor.",
    details: error?.details || null,
  });
}
