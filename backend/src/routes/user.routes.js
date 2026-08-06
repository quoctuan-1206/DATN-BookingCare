import { Router } from "express";
import userController from "../controllers/user.controller.js";
import { verifyAccessTokenMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

// Chỉ Admin được quản lý người dùng
router.use(verifyAccessTokenMiddleware, authorize("Admin"));

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.patch("/:id/status", userController.updateUserStatus);

export default router;
