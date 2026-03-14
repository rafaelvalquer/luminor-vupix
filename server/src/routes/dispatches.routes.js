import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getDispatch,
  getDispatches,
  postRetryDispatch,
  postSendManualDispatch,
} from "../controllers/dispatches.controller.js";

const router = Router();

router.get("/", asyncHandler(getDispatches));
router.get("/:id", asyncHandler(getDispatch));
router.post("/send-manual", asyncHandler(postSendManualDispatch));
router.post("/:id/retry", asyncHandler(postRetryDispatch));

export default router;
