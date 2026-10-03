import { Router } from "express";
import appointmentController from "../controllers/appointment.controller.js";
import { verifyAccessTokenMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();
const workflowAction = (action) => (req, res, next) =>
  appointmentController.workflowAction(req, res, next, action);

// Patient / Doctor / Admin: quản lý lịch hẹn
router.use(
  verifyAccessTokenMiddleware,
  authorize("Patient", "Doctor", "STAFF", "Admin"),
);

// GET /api/appointments - Danh sách lịch hẹn
router.get("/", appointmentController.getAppointments);
// GET /api/appointments/today - Lịch khám trong ngày theo quyền người dùng
router.get("/today", appointmentController.getTodayAppointments);
// GET /api/appointments/:id/queue-position - Vị trí hàng đợi của lịch
router.get("/:id/queue-position", appointmentController.getQueuePosition);
// GET /api/appointments/:id - Chi tiết lịch hẹn
router.get("/:id", appointmentController.getAppointmentById);
// POST /api/appointments - Đặt lịch hẹn
router.post("/", appointmentController.createAppointment);
// PATCH /api/appointments/:id/status - Cập nhật trạng thái
router.patch("/:id/status", appointmentController.updateStatus);
// PATCH /api/appointments/:id/start-exam - Bác sĩ bắt đầu khám
router.patch("/:id/start-exam", appointmentController.startExam);
// Các action workflow bắt buộc đi đúng state transition và quyền backend.
router.post("/:id/check-in", workflowAction("check-in"));
router.post("/:id/enqueue", workflowAction("enqueue"));
router.post("/:id/call", workflowAction("call"));
router.post("/:id/start", workflowAction("start"));
router.post("/:id/complete", workflowAction("complete"));
router.post("/:id/no-show", workflowAction("no-show"));

export default router;
