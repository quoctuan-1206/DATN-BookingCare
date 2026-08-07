import { z } from "zod";

export const createPatientProfileSchema = z.object({
  full_name: z.string().min(1, "Họ tên không được để trống"),
  phone: z.string().optional().nullable(),
  gender: z.enum(["Male", "Female", "Other"]),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày sinh phải dạng YYYY-MM-DD"),
  relationship: z.string().optional().default("Self"),
  blood_type: z.string().optional().nullable(),
  height: z.coerce.number().positive().optional().nullable(),
  weight: z.coerce.number().positive().optional().nullable(),
  insurance_number: z.string().optional().nullable(),
  emergency_contact: z.string().optional().nullable(),
});

export const updatePatientProfileSchema = createPatientProfileSchema.partial();
