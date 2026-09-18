import * as authService from "../services/auth.service.js";
import { successResponse, errorResponse } from "../utils/response.js";

// Lấy statusCode từ lỗi service, mặc định fallback
function getStatusCode(error, fallback = 400) {
  return error.statusCode || fallback;
}

// Đăng ký tài khoản bệnh nhân (POST /api/auth/register)
export async function register(req, res) {
  try {
    const result = await authService.register(req.body);
    return successResponse(res, "Register successfully", result, 201);
  } catch (error) {
    return errorResponse(res, error.message, getStatusCode(error, 400));
  }
}

// Đăng nhập (POST /api/auth/login)
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return successResponse(res, "Login successfully", result);
  } catch (error) {
    return errorResponse(res, error.message, getStatusCode(error, 401));
  }
}

// Làm mới access token bằng refresh token (POST /api/auth/refresh-token)
export async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    return successResponse(res, "Refresh token successfully", result);
  } catch (error) {
    return errorResponse(res, error.message, getStatusCode(error, 401));
  }
}

// Đăng xuất 1 thiết bị — xóa 1 refresh token (POST /api/auth/logout)
export async function logout(req, res) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.logout(refreshToken);
    return successResponse(res, result.message);
  } catch (error) {
    return errorResponse(res, error.message, getStatusCode(error, 400));
  }
}

// Đăng xuất mọi thiết bị — xóa toàn bộ refresh token (POST /api/auth/logout-all)
export async function logoutAll(req, res) {
  try {
    const result = await authService.logoutAll(req.user.id);
    return successResponse(res, result.message);
  } catch (error) {
    return errorResponse(res, error.message, getStatusCode(error, 400));
  }
}

// Quên mật khẩu — tạo OTP gửi cho email (POST /api/auth/forgot-password)
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    return successResponse(res, result.message);
  } catch (error) {
    return errorResponse(res, error.message, getStatusCode(error, 400));
  }
}

// Xác thực mã OTP quên mật khẩu (POST /api/auth/verify-otp)
export async function verifyOTP(req, res) {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyOTP(email, otp);
    return successResponse(res, result.message);
  } catch (error) {
    return errorResponse(res, error.message, getStatusCode(error, 400));
  }
}

// Đặt lại mật khẩu sau khi OTP đã xác thực (POST /api/auth/reset-password)
export async function resetPassword(req, res) {
  try {
    const { email, newPassword } = req.body;
    const result = await authService.resetPassword(email, newPassword);
    return successResponse(res, result.message);
  } catch (error) {
    return errorResponse(res, error.message, getStatusCode(error, 400));
  }
}

// Lấy thông tin user đang đăng nhập (GET /api/auth/me)
export async function me(req, res) {
  try {
    return successResponse(res, "Current user", req.user);
  } catch (error) {
    return errorResponse(res, error.message, getStatusCode(error, 400));
  }
}

// Cập nhật hồ sơ tài khoản hiện tại (PUT /api/auth/profile)
export async function updateProfile(req, res) {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    return successResponse(res, "Cập nhật thông tin cá nhân thành công", user);
  } catch (error) {
    return errorResponse(res, error.message, getStatusCode(error, 400));
  }
}

// Đổi mật khẩu tài khoản hiện tại (PUT /api/auth/change-password)
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(
      req.user.id,
      currentPassword,
      newPassword,
    );
    return successResponse(res, result.message);
  } catch (error) {
    return errorResponse(res, error.message, getStatusCode(error, 400));
  }
}
