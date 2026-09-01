import { z } from "zod";

export const queryMedicineSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export const createMedicineSchema = z.object({
  name: z.string().trim().min(1, "Tên thuốc không được để trống"),
  unit: z.string().trim().optional().nullable(),
  price: z.coerce.number().min(0, "Giá thuốc không được âm").optional().nullable(),
  description: z.string().trim().optional().nullable(),
});

export const updateMedicineSchema = z.object({
  name: z.string().trim().min(1).optional(),
  unit: z.string().trim().optional().nullable(),
  price: z.coerce.number().min(0).optional().nullable(),
  description: z.string().trim().optional().nullable(),
});
