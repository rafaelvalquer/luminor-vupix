import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getCharge,
  getCharges,
  patchCharge,
  postCancelCharge,
  postCharge,
  postMarkPaid,
} from "../controllers/charges.controller.js";

const router = Router();

router.get("/", asyncHandler(getCharges));
router.post("/", asyncHandler(postCharge));
router.get("/:id", asyncHandler(getCharge));
router.patch("/:id", asyncHandler(patchCharge));
router.post("/:id/mark-paid", asyncHandler(postMarkPaid));
router.post("/:id/cancel", asyncHandler(postCancelCharge));

export default router;
