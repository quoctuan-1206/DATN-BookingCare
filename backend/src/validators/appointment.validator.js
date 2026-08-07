import { z } from "zod";

const statuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

export const createAppointmentSchema = z.object({
  schedule_id: z.coerce.number().int().positive(),
  patient_profile_id: z.coerce.number().int().positive(),
  reason: z.string().min(1, "Lý do khám không được để trống"),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(statuses),
});

export const queryAppointmentSchema = z.object({
  status: z.enum(statuses).optional(),
  doctor_id: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
