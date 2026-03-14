import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/notFound.middleware.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (env.corsOrigins.includes(origin)) return callback(null, true);
        const error = new Error(`CORS blocked for origin: ${origin}`);
        error.statusCode = 403;
        return callback(error);
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "server",
      uptimeSeconds: Math.floor(process.uptime()),
      now: new Date().toISOString(),
    });
  });

  app.use("/api", routes);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
