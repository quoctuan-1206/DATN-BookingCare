import { Router } from "express";
import doctorController from "../controllers/doctor.controller.js";
import { verifyAccessTokenMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

// Public: danh sách & chi tiết bác sĩ
router.get("/", doctorController.getAllDoctors);
router.get("/:id", doctorController.getDoctorById);

// Chỉ Admin: tạo / xóa mềm bác sĩ
router.post(
  "/",
  verifyAccessTokenMiddleware,
  authorize("Admin"),
  doctorController.createDoctor,
);

// Admin cập nhật bất kỳ; Doctor chỉ cập nhật hồ sơ của chính mình
router.put(
  "/:id",
  verifyAccessTokenMiddleware,
  authorize("Admin", "Doctor"),
  doctorController.updateDoctor,
);

// Quản lý nhiều phòng khám (Admin hoặc chính bác sĩ đó)
router.post(
  "/:id/workplaces",
  verifyAccessTokenMiddleware,
  authorize("Admin", "Doctor"),
  doctorController.addWorkplace,
);

router.put(
  "/:id/workplaces/:workplaceId",
  verifyAccessTokenMiddleware,
  authorize("Admin", "Doctor"),
  doctorController.updateWorkplace,
);

router.delete(
  "/:id/workplaces/:workplaceId",
  verifyAccessTokenMiddleware,
  authorize("Admin", "Doctor"),
  doctorController.removeWorkplace,
);

router.delete(
  "/:id",
  verifyAccessTokenMiddleware,
  authorize("Admin"),
  doctorController.deleteDoctor,
);

export default router;
