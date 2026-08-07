import { Router } from "express";
import userController from "../controllers/user.controller.js";
import { verifyAccessTokenMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

// Chỉ Admin được quản lý người dùng
router.use(verifyAccessTokenMiddleware, authorize("Admin"));

// GET /api/users - Danh sách người dùng
router.get("/", userController.getAllUsers);
// GET /api/users/:id - Chi tiết người dùng
router.get("/:id", userController.getUserById);
// PATCH /api/users/:id/status - Khóa / mở khóa tài khoản
router.patch("/:id/status", userController.updateUserStatus);

export default router;
