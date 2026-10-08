import { Router } from "express";
import auditLogController from "../controllers/audit-log.controller.js";
import { verifyAccessTokenMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { preventSensitiveCaching } from "../middlewares/security.middleware.js";

const router = Router();

router.use(
  verifyAccessTokenMiddleware,
  authorize("Admin"),
  preventSensitiveCaching,
);

router.get("/", auditLogController.getAll);
router.get("/:id", auditLogController.getById);

export default router;
