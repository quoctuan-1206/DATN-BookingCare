import { z } from "zod";

const roleNames = ["Admin", "Doctor", "Patient", "Receptionist", "STAFF"];

// Schema query danh sách người dùng (Admin)
export const queryUserSchema = z.object({
  search: z.string().optional(),
  role: z.enum(roleNames).optional(),
  is_active: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// Schema khóa / mở khóa tài khoản
export const updateUserStatusSchema = z.object({
  is_active: z.boolean(),
});

export const createStaffSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").max(128),
  first_name: z.string().trim().min(1, "Tên không được để trống").max(100),
  last_name: z.string().trim().min(1, "Họ không được để trống").max(100),
  phone: z.string().trim().max(20).nullable().optional(),
});
