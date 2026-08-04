import { z } from "zod";

// Schema đăng ký tài khoản Patient
export const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone is required"),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
});

// Schema đăng nhập
export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

// Schema làm mới token
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// Schema đăng xuất 1 thiết bị
export const logoutSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// Schema quên mật khẩu
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

// Schema xác thực OTP (6 số)
export const verifyOTPSchema = z.object({
  email: z.string().email("Invalid email"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

// Schema đặt lại mật khẩu
export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});
