import { z } from "zod";
import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCES,
} from "../constants/audit-log.constants.js";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDateBound(value, endOfDay) {
  if (DATE_ONLY_PATTERN.test(value)) {
    return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  }
  return new Date(value);
}

function dateBoundSchema(endOfDay) {
  return z
    .string()
    .trim()
    .min(1)
    .max(64)
    .refine((value) => !Number.isNaN(parseDateBound(value, endOfDay).getTime()), {
      message: "Thoi gian khong hop le",
    })
    .transform((value) => parseDateBound(value, endOfDay));
}

const optionalTrimmedString = (max) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(max).optional(),
  );

export const queryAuditLogSchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: optionalTrimmedString(100),
    userId: z.coerce.number().int().positive().optional(),
    action: z.enum(AUDIT_ACTIONS).optional(),
    resource: z.enum(AUDIT_RESOURCES).optional(),
    resourceId: optionalTrimmedString(191),
    dateFrom: dateBoundSchema(false).optional(),
    dateTo: dateBoundSchema(true).optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .refine(
    (query) =>
      !query.dateFrom || !query.dateTo || query.dateFrom <= query.dateTo,
    {
      path: ["dateTo"],
      message: "dateTo phai lon hon hoac bang dateFrom",
    },
  );

export const auditLogIdSchema = z
  .string()
  .regex(/^\d+$/, "ID Audit Log khong hop le");
