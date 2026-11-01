import { z } from "zod";
import { KNOWLEDGE_SOURCE_TYPES, MAX_KNOWLEDGE_RESULTS } from "./knowledge.constants.js";

export const knowledgeSearchSchema = z.object({
  query: z.string().trim().min(1, "Query must not be empty").max(1200, "Query must be at most 1200 characters"),
  sourceTypes: z.array(z.enum(KNOWLEDGE_SOURCE_TYPES)).max(KNOWLEDGE_SOURCE_TYPES.length).optional(),
  limit: z.number().int().min(1).max(MAX_KNOWLEDGE_RESULTS).optional(),
}).strict();
