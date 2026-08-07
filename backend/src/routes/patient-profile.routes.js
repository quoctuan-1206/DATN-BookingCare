import { Router } from "express";
import patientProfileController from "../controllers/patient-profile.controller.js";
import { verifyAccessTokenMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

// Patient / Admin: quản lý hồ sơ bệnh nhân
router.use(verifyAccessTokenMiddleware, authorize("Patient", "Admin"));

// GET /api/patient-profiles - Danh sách hồ sơ của tôi
router.get("/", patientProfileController.getMyProfiles);
// POST /api/patient-profiles - Tạo hồ sơ
router.post("/", patientProfileController.createProfile);
// PUT /api/patient-profiles/:id - Cập nhật hồ sơ
router.put("/:id", patientProfileController.updateProfile);

export default router;
