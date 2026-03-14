import { Router } from "express";
import authRoutes from "./auth.routes.js";
import customersRoutes from "./customers.routes.js";
import chargesRoutes from "./charges.routes.js";
import templatesRoutes from "./templates.routes.js";
import dispatchesRoutes from "./dispatches.routes.js";
import remindersRoutes from "./reminders.routes.js";
import integrationsRoutes from "./integrations.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/customers", requireAuth, customersRoutes);
router.use("/charges", requireAuth, chargesRoutes);
router.use("/templates", requireAuth, templatesRoutes);
router.use("/dispatches", requireAuth, dispatchesRoutes);
router.use("/reminders", requireAuth, remindersRoutes);
router.use("/integrations", requireAuth, integrationsRoutes);
router.use("/dashboard", requireAuth, dashboardRoutes);

export default router;
