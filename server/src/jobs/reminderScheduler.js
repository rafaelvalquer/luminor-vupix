import cron from "node-cron";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { runReminderDispatchCycle } from "../services/dispatch.service.js";

let task = null;

export function startReminderScheduler() {
  if (task) return task;

  task = cron.schedule(env.reminderCron, async () => {
    try {
      const result = await runReminderDispatchCycle({ limit: env.reminderBatchLimit });
      logger.info("reminder_job_executed", result);
    } catch (error) {
      logger.error("reminder_job_failed", {
        message: error.message,
        details: error.details || null,
      });
    }
  });

  logger.info("reminder_scheduler_started", {
    cron: env.reminderCron,
    batchLimit: env.reminderBatchLimit,
  });

  return task;
}
