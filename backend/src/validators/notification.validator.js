import { z } from "zod";

export const queryNotificationSchema = z.object({
  unread_only: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const createNotificationSchema = z.object({
  user_id: z.coerce.number().int().positive(),
  title: z.string().min(1, "Tiêu đề không được để trống"),
  content: z.string().min(1, "Nội dung không được để trống"),
  link: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
});
