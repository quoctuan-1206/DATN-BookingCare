import { z } from "zod";

const articleTypes = ["DOCTOR", "CLINIC", "SPECIALTY", "NEWS"];

export const createArticleSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  slug: z.string().optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  content_html: z.string().optional(),
  content_markdown: z.string().optional(),
  image: z.string().optional(),
  article_type: z.enum(articleTypes),
  reference_id: z.coerce.number().int().positive().optional().nullable(),
  is_published: z.boolean().optional().default(false),
});

export const updateArticleSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  content_html: z.string().optional().nullable(),
  content_markdown: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  article_type: z.enum(articleTypes).optional(),
  reference_id: z.coerce.number().int().positive().optional().nullable(),
  is_published: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export const queryArticleSchema = z.object({
  search: z.string().optional(),
  article_type: z.enum(articleTypes).optional(),
  is_published: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  // Admin có thể xem cả bài chưa publish / đã ẩn
  include_inactive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
