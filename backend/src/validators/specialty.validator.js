import { z } from "zod";

// Schema tạo chuyên khoa
export const createSpecialtySchema = z.object({
  name: z.string().min(1, "Tên chuyên khoa không được để trống"),
  description: z.string().optional(),
  image: z.string().optional(),
});

// Schema cập nhật chuyên khoa
export const updateSpecialtySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  is_active: z.boolean().optional(),
});

// Schema query danh sách chuyên khoa
export const querySpecialtySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
