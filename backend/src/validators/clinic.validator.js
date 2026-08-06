import { z } from "zod";

// Schema tạo phòng khám
export const createClinicSchema = z.object({
  name: z.string().min(1, "Tên phòng khám không được để trống"),
  address: z.string().min(1, "Địa chỉ không được để trống"),
  phone: z.string().optional(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  description: z.string().optional(),
  image: z.string().optional(),
});

// Schema cập nhật phòng khám
export const updateClinicSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  description: z.string().optional(),
  image: z.string().optional(),
  is_active: z.boolean().optional(),
});

// Schema query danh sách phòng khám
export const queryClinicSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
