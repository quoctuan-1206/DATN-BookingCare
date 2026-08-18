import { Router } from "express";
import uploadController from "../controllers/upload.controller.js";
import { uploadImageMiddleware } from "../middlewares/upload.middleware.js";
import { verifyAccessTokenMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

// POST /api/upload - Tải ảnh (Admin / Doctor)
router.post(
  "/",
  verifyAccessTokenMiddleware,
  authorize("Admin", "Doctor"),
  uploadImageMiddleware,
  uploadController.uploadImage,
);

export default router;
