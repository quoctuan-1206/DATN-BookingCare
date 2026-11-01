import { z } from "zod";

export const INTENTS = [
  "SEARCH_DOCTOR",
  "SEARCH_CLINIC",
  "SEARCH_SPECIALTY",
  "MEDICAL_QUESTION",
  "SYSTEM_GUIDE",
  "GENERAL",
];

export const RETRIEVAL_MODES = ["DATABASE", "RAG", "HYBRID", "NONE"];

const shortFilter = (max) => z.string().trim().min(1).max(max).nullable();

export const filterAnalysisSchema = z.object({
  intent: z.enum(INTENTS),
  retrievalMode: z.enum(RETRIEVAL_MODES),
  filters: z.object({
    specialty: shortFilter(100),
    doctorName: shortFilter(120),
    clinicName: shortFilter(150),
    district: shortFilter(100),
    maxPrice: z.number().int().min(0).max(1_000_000_000).nullable(),
  }).strict(),
}).strict();

// JSON Schema subset supported by Gemini structured output. Zod remains the
// authoritative validator after the SDK response is received.
export const geminiResponseSchema = {
  type: "OBJECT",
  properties: {
    intent: { type: "STRING", format: "enum", enum: INTENTS },
    retrievalMode: { type: "STRING", format: "enum", enum: RETRIEVAL_MODES },
    filters: {
      type: "OBJECT",
      properties: {
        specialty: { type: "STRING", nullable: true },
        doctorName: { type: "STRING", nullable: true },
        clinicName: { type: "STRING", nullable: true },
        district: { type: "STRING", nullable: true },
        maxPrice: { type: "INTEGER", nullable: true },
      },
      required: ["specialty", "doctorName", "clinicName", "district", "maxPrice"],
    },
  },
  required: ["intent", "retrievalMode", "filters"],
};
