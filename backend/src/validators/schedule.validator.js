import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

const slotSchema = z.object({
  start_time: z.string().regex(timeRegex, "start_time phải dạng HH:mm"),
  end_time: z.string().regex(timeRegex, "end_time phải dạng HH:mm"),
  max_patients: z.coerce.number().int().min(1).max(100).optional(),
});

export const createScheduleSchema = z
  .object({
    doctor_workplace_id: z.coerce.number().int().positive(),
    work_date: z.string().regex(dateRegex, "work_date phải dạng YYYY-MM-DD"),
    start_time: z
      .string()
      .regex(timeRegex, "start_time phải dạng HH:mm")
      .optional(),
    end_time: z
      .string()
      .regex(timeRegex, "end_time phải dạng HH:mm")
      .optional(),
    max_patients: z.coerce.number().int().min(1).max(100).optional().default(10),
    slots: z.array(slotSchema).min(1).optional(),
  })
  .superRefine((data, ctx) => {
    const hasSlots = Array.isArray(data.slots) && data.slots.length > 0;
    const hasSingle = Boolean(data.start_time && data.end_time);

    if (!hasSlots && !hasSingle) {
      ctx.addIssue({
        code: "custom",
        message: "Cần start_time/end_time hoặc danh sách slots",
      });
      return;
    }

    if (hasSingle && data.start_time >= data.end_time) {
      ctx.addIssue({
        code: "custom",
        path: ["end_time"],
        message: "end_time phải sau start_time",
      });
    }

    if (hasSlots) {
      data.slots.forEach((slot, index) => {
        if (slot.start_time >= slot.end_time) {
          ctx.addIssue({
            code: "custom",
            path: ["slots", index, "end_time"],
            message: "end_time phải sau start_time",
          });
        }
      });
    }
  });

export const updateScheduleSchema = z
  .object({
    work_date: z
      .string()
      .regex(dateRegex, "work_date phải dạng YYYY-MM-DD")
      .optional(),
    start_time: z
      .string()
      .regex(timeRegex, "start_time phải dạng HH:mm")
      .optional(),
    end_time: z
      .string()
      .regex(timeRegex, "end_time phải dạng HH:mm")
      .optional(),
    max_patients: z.coerce.number().int().min(1).max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Không có dữ liệu cập nhật",
  });

export const queryScheduleSchema = z.object({
  doctor_id: z.coerce.number().int().positive().optional(),
  clinic_id: z.coerce.number().int().positive().optional(),
  specialty_id: z.coerce.number().int().positive().optional(),
  doctor_workplace_id: z.coerce.number().int().positive().optional(),
  work_date: z.string().regex(dateRegex).optional(),
  from_date: z.string().regex(dateRegex).optional(),
  to_date: z.string().regex(dateRegex).optional(),
  available_only: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
