import { Router } from "express";
import { verifyAccessTokenMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import controller from "../controllers/consultation.controller.js";
import { consultationRateLimit } from "../middlewares/consultation-rate-limit.middleware.js";

const router = Router();
router.use(verifyAccessTokenMiddleware, authorize("Patient", "Doctor"));
router.use(consultationRateLimit);
router.get("/history", controller.history);
router.get("/:appointmentId", controller.get);
router.post("/:appointmentId/start", controller.start);
router.post("/:appointmentId/finish", controller.finish);
export default router;
