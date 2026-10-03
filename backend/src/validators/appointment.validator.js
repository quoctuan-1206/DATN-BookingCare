import { z } from "zod";

export const appointmentStatuses = [
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "WAITING",
  "CALLED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

export const createAppointmentSchema = z.object({
  schedule_id: z.coerce.number().int().positive(),
  patient_profile_id: z.coerce.number().int().positive(),
  reason: z.string().min(1, "Lý do khám không được để trống"),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(appointmentStatuses),
});

export const queryAppointmentSchema = z.object({
  status: z.enum(appointmentStatuses).optional(),
  doctor_id: z.coerce.number().int().positive().optional(),
  clinic_id: z.coerce.number().int().positive().optional(),
  date: z.iso.date().optional(),
  today: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  queue_only: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
