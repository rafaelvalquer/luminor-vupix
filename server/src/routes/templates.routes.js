import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getGentleProfiles,
  getTemplates,
  patchTemplate,
  postGentleProfile,
  postTemplate,
  removeTemplate,
} from "../controllers/templates.controller.js";

const router = Router();

router.get("/", asyncHandler(getTemplates));
router.post("/", asyncHandler(postTemplate));
router.patch("/:id", asyncHandler(patchTemplate));
router.delete("/:id", asyncHandler(removeTemplate));

router.get("/gentle-profiles", asyncHandler(getGentleProfiles));
router.post("/gentle-profiles", asyncHandler(postGentleProfile));

export default router;
