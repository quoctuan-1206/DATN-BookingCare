import { Router } from "express";
import doctorController from "../controllers/doctor.controller.js";

const router = Router();

// GET /api/doctors - Lấy danh sách bác sĩ
router.get("/", doctorController.getAllDoctors);

// GET /api/doctors/:id - Lấy chi tiết 1 bác sĩ
router.get("/:id", doctorController.getDoctorById);

// POST /api/doctors - Tạo tài khoản & hồ sơ bác sĩ mới
router.post("/", doctorController.createDoctor);

// PUT /api/doctors/:id - Cập nhật thông tin bác sĩ
router.put("/:id", doctorController.updateDoctor);

// DELETE /api/doctors/:id - Xóa mềm bác sĩ (is_active = false)
router.delete("/:id", doctorController.deleteDoctor);

export default router;
