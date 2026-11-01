import { z } from "zod";

export const MAX_AI_MESSAGE_LENGTH = 1200;

export const analyzeMessageSchema = z.object({
  message: z.string().trim().min(1, "Message must not be empty").max(
    MAX_AI_MESSAGE_LENGTH,
    `Message must be at most ${MAX_AI_MESSAGE_LENGTH} characters`,
  ),
}).strict();
