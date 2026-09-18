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

// Cập nhật thông tin tài khoản của chính người đang đăng nhập
export const updateProfileSchema = z
  .object({
    first_name: z.string().trim().min(1, "Tên không được để trống").max(100).optional(),
    last_name: z.string().trim().min(1, "Họ không được để trống").max(100).optional(),
    phone: z.string().trim().max(20, "Số điện thoại tối đa 20 ký tự").nullable().optional(),
    gender: z.enum(["Male", "Female", "Other"]).nullable().optional(),
    date_of_birth: z
      .string()
      .date("Ngày sinh không hợp lệ")
      .nullable()
      .optional(),
    address: z.string().trim().max(255, "Địa chỉ tối đa 255 ký tự").nullable().optional(),
    avatar: z.string().trim().max(5000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Cần ít nhất một thông tin để cập nhật",
  });

// Đổi mật khẩu khi người dùng vẫn đang đăng nhập
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại").max(128),
    newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự").max(128),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới").max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận không khớp",
  });
