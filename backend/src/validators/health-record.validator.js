import { z } from "zod";

const optionalText = (max = 4000) => z.string().trim().max(max).optional().nullable();
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable();
const record = (shape) => z.object(shape).strict();
const nonEmpty = (schema) => schema.refine((value) => Object.keys(value).length > 0, "Cần nhập ít nhất một trường");

export const historySchema = record({
  title: z.string().trim().min(1).max(255),
  discovered_at: dateOnly,
  description: optionalText(),
  surgery_history: optionalText(),
  family_history: optionalText(),
});
export const historyUpdateSchema = nonEmpty(record({
  title: z.string().trim().min(1).max(255).optional(),
  discovered_at: dateOnly,
  description: optionalText(),
  surgery_history: optionalText(),
  family_history: optionalText(),
  confirmation_status: z.enum(["CONFIRMED", "REJECTED"]).optional(),
}));

export const allergySchema = record({
  allergen: z.string().trim().max(255).optional(),
  allergy_type: z.enum(["MEDICATION", "FOOD", "ENVIRONMENT", "OTHER"]).optional(),
  reaction: optionalText(),
  severity: z.enum(["MILD", "MODERATE", "SEVERE", "UNKNOWN"]).optional().nullable(),
  no_known_allergies: z.boolean().optional(),
}).superRefine((value, context) => {
  if (!value.no_known_allergies && !value.allergen?.trim()) {
    context.addIssue({ code: "custom", path: ["allergen"], message: "Vui lòng nhập tác nhân dị ứng" });
  }
});
export const allergyUpdateSchema = nonEmpty(record({
  allergen: z.string().trim().min(1).max(255).optional(),
  allergy_type: z.enum(["MEDICATION", "FOOD", "ENVIRONMENT", "OTHER"]).optional(),
  reaction: optionalText(),
  severity: z.enum(["MILD", "MODERATE", "SEVERE", "UNKNOWN"]).optional().nullable(),
  confirmation_status: z.enum(["CONFIRMED", "REJECTED"]).optional(),
}));

export const conditionSchema = record({
  name: z.string().trim().min(1).max(255),
  recorded_at: z.coerce.date().optional(),
  note: optionalText(),
  medical_record_id: z.coerce.number().int().positive().optional().nullable(),
});
export const conditionUpdateSchema = nonEmpty(record({
  name: z.string().trim().min(1).max(255).optional(),
  recorded_at: z.coerce.date().optional(),
  status: z.enum(["MONITORING", "RESOLVED"]).optional(),
  note: optionalText(),
  medical_record_id: z.coerce.number().int().positive().optional().nullable(),
  confirmation_status: z.enum(["CONFIRMED", "REJECTED"]).optional(),
}));

export const vitalSchema = record({
  type: z.enum(["BLOOD_PRESSURE", "HEART_RATE", "WEIGHT", "HEIGHT", "TEMPERATURE", "BLOOD_GLUCOSE", "SPO2"]),
  value: z.coerce.number(),
  secondary_value: z.coerce.number().optional().nullable(),
  unit: z.string().trim().min(1).max(20),
  measured_at: z.coerce.date(),
});
export const vitalUpdateSchema = nonEmpty(vitalSchema.partial());

export const timelineQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  type: z.enum(["ALL", "APPOINTMENT", "MEDICAL_RECORD", "PRESCRIPTION", "LAB", "CLINICAL"]).optional(),
});
