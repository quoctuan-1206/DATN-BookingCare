import { Router } from "express";
import specialtyController from "../controllers/specialty.controller.js";
import { verifyAccessTokenMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

// Public: danh sách & chi tiết chuyên khoa
router.get("/", specialtyController.getAllSpecialties);
router.get("/:id", specialtyController.getSpecialtyById);

// Chỉ Admin: tạo / cập nhật / xóa mềm chuyên khoa
router.post(
  "/",
  verifyAccessTokenMiddleware,
  authorize("Admin"),
  specialtyController.createSpecialty,
);

router.put(
  "/:id",
  verifyAccessTokenMiddleware,
  authorize("Admin"),
  specialtyController.updateSpecialty,
);

router.delete(
  "/:id",
  verifyAccessTokenMiddleware,
  authorize("Admin"),
  specialtyController.deleteSpecialty,
);

export default router;
