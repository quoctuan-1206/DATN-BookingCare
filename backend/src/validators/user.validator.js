import { z } from "zod";

const roleNames = ["Admin", "Doctor", "Patient", "Receptionist"];

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
