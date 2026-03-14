import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getWhatsAppStatus, postWhatsAppRestart } from "../controllers/integrations.controller.js";

const router = Router();

router.get("/whatsapp/status", asyncHandler(getWhatsAppStatus));
router.post("/whatsapp/restart", asyncHandler(postWhatsAppRestart));

export default router;
