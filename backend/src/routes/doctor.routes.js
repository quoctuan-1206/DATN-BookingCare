import { Router } from "express";
import doctorController from "../controllers/doctor.controller.js";
import { verifyAccessTokenMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

// Public: danh sách & chi tiết bác sĩ
router.get("/", doctorController.getAllDoctors);
router.get("/:id", doctorController.getDoctorById);

// Chỉ Admin: tạo / cập nhật / xóa mềm bác sĩ
router.post(
  "/",
  verifyAccessTokenMiddleware,
  authorize("Admin"),
  doctorController.createDoctor,
);

router.put(
  "/:id",
  verifyAccessTokenMiddleware,
  authorize("Admin"),
  doctorController.updateDoctor,
);

router.delete(
  "/:id",
  verifyAccessTokenMiddleware,
  authorize("Admin"),
  doctorController.deleteDoctor,
);

export default router;
