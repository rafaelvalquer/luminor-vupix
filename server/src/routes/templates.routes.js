import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getTemplates, patchTemplate, postTemplate, removeTemplate } from "../controllers/templates.controller.js";

const router = Router();

router.get("/", asyncHandler(getTemplates));
router.post("/", asyncHandler(postTemplate));
router.patch("/:id", asyncHandler(patchTemplate));
router.delete("/:id", asyncHandler(removeTemplate));

export default router;
