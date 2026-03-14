function log(level, message, meta = {}) {
  const payload = {
    time: new Date().toISOString(),
    service: "server",
    level,
    message,
    ...meta,
  };
  console.log(JSON.stringify(payload));
}

export const logger = {
  info: (message, meta) => log("info", message, meta),
  warn: (message, meta) => log("warn", message, meta),
  error: (message, meta) => log("error", message, meta),
};
