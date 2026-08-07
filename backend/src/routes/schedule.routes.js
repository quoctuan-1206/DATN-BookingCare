import { Router } from "express";
import scheduleController from "../controllers/schedule.controller.js";
import { verifyAccessTokenMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

// Public: xem lịch khám
router.get("/", scheduleController.getAllSchedules);
router.get("/:id", scheduleController.getScheduleById);

// Admin hoặc Doctor: tạo / sửa / xóa lịch
router.post(
  "/",
  verifyAccessTokenMiddleware,
  authorize("Admin", "Doctor"),
  scheduleController.createSchedule,
);

router.put(
  "/:id",
  verifyAccessTokenMiddleware,
  authorize("Admin", "Doctor"),
  scheduleController.updateSchedule,
);

router.delete(
  "/:id",
  verifyAccessTokenMiddleware,
  authorize("Admin", "Doctor"),
  scheduleController.deleteSchedule,
);

export default router;
