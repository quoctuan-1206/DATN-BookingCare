import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { verifyAccessTokenMiddleware } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validator.middleware.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  forgotPasswordSchema,
  verifyOTPSchema,
  resetPasswordSchema,
} from "../validators/auth.validator.js";

const router = Router();

// POST /api/auth/register - Đăng ký tài khoản Patient
router.post("/register", validateBody(registerSchema), authController.register);

// POST /api/auth/login - Đăng nhập
router.post("/login", validateBody(loginSchema), authController.login);

// POST /api/auth/refresh-token - Làm mới access/refresh token
router.post(
  "/refresh-token",
  validateBody(refreshTokenSchema),
  authController.refreshToken,
);

// POST /api/auth/logout - Đăng xuất 1 thiết bị
router.post("/logout", validateBody(logoutSchema), authController.logout);

// POST /api/auth/logout-all - Đăng xuất mọi thiết bị (cần JWT)
router.post(
  "/logout-all",
  verifyAccessTokenMiddleware,
  authController.logoutAll,
);

// POST /api/auth/forgot-password - Gửi OTP quên mật khẩu
router.post(
  "/forgot-password",
  validateBody(forgotPasswordSchema),
  authController.forgotPassword,
);

// POST /api/auth/verify-otp - Xác thực OTP
router.post(
  "/verify-otp",
  validateBody(verifyOTPSchema),
  authController.verifyOTP,
);

// POST /api/auth/reset-password - Đặt lại mật khẩu
router.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  authController.resetPassword,
);

// GET /api/auth/me - Lấy thông tin user hiện tại (cần JWT)
router.get("/me", verifyAccessTokenMiddleware, authController.me);

export default router;
