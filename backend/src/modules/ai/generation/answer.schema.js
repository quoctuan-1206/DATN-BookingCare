import { z } from "zod";

export const chatAnswerSchema = z.object({
  answer: z.string().trim().min(1).max(4_000),
  sourceIds: z.array(z.string().trim().min(1).max(100)).max(10),
  suggestions: z.array(z.string().trim().min(1).max(160)).max(3),
}).strict();

export const geminiChatResponseSchema = {
  type: "OBJECT",
  properties: {
    answer: { type: "STRING" },
    sourceIds: { type: "ARRAY", items: { type: "STRING" } },
    suggestions: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["answer", "sourceIds", "suggestions"],
};
