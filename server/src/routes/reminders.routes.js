import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getReminderRules, patchReminderRule, postReminderRule, runNow } from "../controllers/reminders.controller.js";

const router = Router();

router.post("/run-now", asyncHandler(runNow));
router.get("/rules", asyncHandler(getReminderRules));
router.post("/rules", asyncHandler(postReminderRule));
router.patch("/rules/:id", asyncHandler(patchReminderRule));

export default router;
