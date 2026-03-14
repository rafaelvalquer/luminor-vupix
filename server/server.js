import { createApp } from "./src/app.js";
import { connectDatabase } from "./src/config/database.js";
import { env } from "./src/config/env.js";
import { logger } from "./src/lib/logger.js";
import { ensureDefaultAdmin } from "./src/services/auth.service.js";
import { ensureDefaultReminderRules } from "./src/services/reminder.service.js";
import { startReminderScheduler } from "./src/jobs/reminderScheduler.js";

const app = createApp();

async function bootstrap() {
  await connectDatabase();
  await ensureDefaultAdmin();
  await ensureDefaultReminderRules();
  startReminderScheduler();

  app.listen(env.port, () => {
    logger.info("server_started", {
      port: env.port,
      env: env.nodeEnv,
    });
  });
}

bootstrap().catch((error) => {
  logger.error("server_bootstrap_failed", {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
