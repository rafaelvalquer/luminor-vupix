import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getCustomer,
  getCustomers,
  patchCustomer,
  postCustomer,
  removeCustomer,
} from "../controllers/customers.controller.js";

const router = Router();

router.get("/", asyncHandler(getCustomers));
router.post("/", asyncHandler(postCustomer));
router.get("/:id", asyncHandler(getCustomer));
router.patch("/:id", asyncHandler(patchCustomer));
router.delete("/:id", asyncHandler(removeCustomer));

export default router;
