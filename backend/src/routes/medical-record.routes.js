import { Router } from "express";
import medicalRecordController from "../controllers/medical-record.controller.js";
import { verifyAccessTokenMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { preventSensitiveCaching } from "../middlewares/security.middleware.js";

const router = Router();

// Patient / Doctor / Admin: xem bệnh án
router.use(
  verifyAccessTokenMiddleware,
  authorize("Patient", "Doctor", "Admin"),
  preventSensitiveCaching,
);

// GET /api/medical-records - Danh sách bệnh án
router.get("/", medicalRecordController.getRecords);
// GET /api/medical-records/by-appointment/:appointmentId - Bệnh án theo lịch hẹn
router.get(
  "/by-appointment/:appointmentId",
  medicalRecordController.getByAppointmentId,
);
// GET /api/medical-records/:id - Chi tiết bệnh án
router.get("/:id", medicalRecordController.getById);

// Chỉ Doctor / Admin: tạo / cập nhật bệnh án
router.post(
  "/",
  authorize("Doctor", "Admin"),
  medicalRecordController.create,
);

router.put(
  "/:id",
  authorize("Doctor", "Admin"),
  medicalRecordController.update,
);

export default router;
