import { z } from "zod";

const prescriptionItemSchema = z.object({
  medicine_id: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
  dosage: z.string().optional().nullable(),
  instruction: z.string().optional().nullable(),
});

export const createPrescriptionSchema = z.object({
  medical_record_id: z.coerce.number().int().positive(),
  note: z.string().optional().nullable(),
  items: z.array(prescriptionItemSchema).min(1, "Cần ít nhất một loại thuốc"),
});

export const updatePrescriptionSchema = z.object({
  note: z.string().optional().nullable(),
  items: z.array(prescriptionItemSchema).min(1, "Cần ít nhất một loại thuốc"),
});
