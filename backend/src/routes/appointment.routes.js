import { Router } from "express";
import appointmentController from "../controllers/appointment.controller.js";
import { verifyAccessTokenMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

// Patient / Doctor / Admin: quản lý lịch hẹn
router.use(
  verifyAccessTokenMiddleware,
  authorize("Patient", "Doctor", "Admin"),
);

// GET /api/appointments - Danh sách lịch hẹn
router.get("/", appointmentController.getAppointments);
// GET /api/appointments/:id - Chi tiết lịch hẹn
router.get("/:id", appointmentController.getAppointmentById);
// POST /api/appointments - Đặt lịch hẹn
router.post("/", appointmentController.createAppointment);
// PATCH /api/appointments/:id/status - Cập nhật trạng thái
router.patch("/:id/status", appointmentController.updateStatus);
// PATCH /api/appointments/:id/start-exam - Bác sĩ bắt đầu khám
router.patch("/:id/start-exam", appointmentController.startExam);

export default router;
