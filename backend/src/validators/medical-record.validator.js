import { z } from "zod";

const optionalNumber = (min, max) =>
  z.preprocess(
    (value) => {
      if (value === undefined) return undefined;
      if (value === "" || value === null) return null;
      return Number(value);
    },
    z.number().min(min).max(max).nullable().optional(),
  );

const optionalDate = z
  .union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày tái khám không hợp lệ"),
    z.literal(""),
    z.null(),
  ])
  .optional()
  .transform((value) => (value === "" ? null : value));

const medicalRecordFields = {
  symptoms: z.string().max(1000).optional().nullable(),
  blood_pressure: z.string().max(20).optional().nullable(),
  heart_rate: optionalNumber(20, 250),
  temperature: optionalNumber(30, 45),
  spo2: optionalNumber(0, 100),
  respiratory_rate: optionalNumber(1, 100),
  weight: optionalNumber(0, 500),
  height: optionalNumber(0, 300),
  clinical_examination: z.string().max(1000).optional().nullable(),
  diagnosis: z.string().min(1, "Chẩn đoán không được để trống"),
  icd10_code: z.string().max(20).optional().nullable(),
  secondary_diagnosis: z.string().max(1000).optional().nullable(),
  assessment: z.string().max(1000).optional().nullable(),
  follow_up_date: optionalDate,
  conclusion: z.string().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
};

export const createMedicalRecordSchema = z.object({
  appointment_id: z.coerce.number().int().positive(),
  ...medicalRecordFields,
});

export const updateMedicalRecordSchema = z.object({
  ...medicalRecordFields,
  diagnosis: medicalRecordFields.diagnosis.optional(),
});

export const queryMedicalRecordSchema = z.object({
  search: z.string().optional(),
  appointment_id: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
