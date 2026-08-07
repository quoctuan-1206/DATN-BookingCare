import { z } from "zod";

export const createMedicalRecordSchema = z.object({
  appointment_id: z.coerce.number().int().positive(),
  symptoms: z.string().optional().nullable(),
  diagnosis: z.string().min(1, "Chẩn đoán không được để trống"),
  conclusion: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export const updateMedicalRecordSchema = z.object({
  symptoms: z.string().optional().nullable(),
  diagnosis: z.string().min(1).optional(),
  conclusion: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export const queryMedicalRecordSchema = z.object({
  search: z.string().optional(),
  appointment_id: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
