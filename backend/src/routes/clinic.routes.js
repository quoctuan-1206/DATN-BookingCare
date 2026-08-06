import { Router } from "express";
import clinicController from "../controllers/clinic.controller.js";
import { verifyAccessTokenMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

// Public: danh sách & chi tiết phòng khám
router.get("/", clinicController.getAllClinics);
router.get("/:id", clinicController.getClinicById);

// Chỉ Admin: tạo / cập nhật / xóa mềm phòng khám
router.post(
  "/",
  verifyAccessTokenMiddleware,
  authorize("Admin"),
  clinicController.createClinic,
);

router.put(
  "/:id",
  verifyAccessTokenMiddleware,
  authorize("Admin"),
  clinicController.updateClinic,
);

router.delete(
  "/:id",
  verifyAccessTokenMiddleware,
  authorize("Admin"),
  clinicController.deleteClinic,
);

export default router;
