import { z } from "zod";

export const createReviewSchema = z.object({
  appointment_id: z.coerce.number().int().positive("appointment_id phải là số nguyên dương"),
  rating: z.coerce.number().int().min(1, "Tối thiểu 1 sao").max(5, "Tối đa 5 sao"),
  comment: z.string().max(2000, "Bình luận tối đa 2000 ký tự").optional(),
});

export const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  comment: z.string().max(2000).optional(),
});

export const queryReviewSchema = z.object({
  doctor_id: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
