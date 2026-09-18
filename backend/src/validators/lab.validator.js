import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
export const CLINICAL_SERVICE_TYPES = [
  "LAB",
  "XRAY",
  "ULTRASOUND",
  "ENDOSCOPY",
  "ECG",
];
export const CLINICAL_BOOKING_MODES = ["DOCTOR_ORDER", "SELF_BOOKING"];
export const CLINICAL_ORDER_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

const nullableText = (max, message) =>
  z.string().trim().max(max, message).nullable().optional();

const serviceImage = z
  .string()
  .trim()
  .max(500, "Đường dẫn ảnh tối đa 500 ký tự")
  .refine(
    (value) => /^\/uploads\/[A-Za-z0-9._-]+$/.test(value),
    "Đường dẫn ảnh dịch vụ không hợp lệ",
  )
  .nullable()
  .optional();

export const queryLabTestSchema = z.object({
  search: z.string().trim().optional(),
  service_type: z.enum(CLINICAL_SERVICE_TYPES).optional(),
  booking_mode: z.enum(CLINICAL_BOOKING_MODES).optional(),
  is_active: z
    .enum(["true", "false"])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === "true",
    ),
});

export const createLabTestSchema = z.object({
  name: z.string().trim().min(1, "Tên xét nghiệm không được để trống").max(255),
  image: serviceImage,
  description: nullableText(5000, "Mô tả tối đa 5000 ký tự"),
  preparation_instructions: nullableText(
    5000,
    "Hướng dẫn chuẩn bị tối đa 5000 ký tự",
  ),
  estimated_duration_minutes: z.coerce.number().int().min(1).max(1440).nullable().optional(),
  booking_mode: z.enum(CLINICAL_BOOKING_MODES).optional(),
  price: z.coerce
    .number()
    .min(0, "Giá dịch vụ không hợp lệ")
    .max(99999999.99, "Giá dịch vụ vượt quá giới hạn"),
  is_active: z.boolean().optional().default(true),
});

export const queryClinicalServiceSchema = queryLabTestSchema.extend({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createClinicalServiceSchema = createLabTestSchema.extend({
  service_type: z.enum(CLINICAL_SERVICE_TYPES),
});

export const updateLabTestSchema = createLabTestSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Cần ít nhất một thông tin để cập nhật" },
);

export const updateClinicalServiceSchema = createClinicalServiceSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Cần ít nhất một thông tin để cập nhật",
  });

export const createLabOrderSchema = z.object({
  appointment_id: z.coerce.number().int().positive(),
  test_ids: z
    .array(z.coerce.number().int().positive())
    .min(1, "Cần chọn ít nhất một xét nghiệm")
    .transform((ids) => [...new Set(ids)]),
});

export const createClinicalOrderSchema = z.object({
  appointment_id: z.coerce.number().int().positive(),
  service_type: z.enum(CLINICAL_SERVICE_TYPES),
  service_ids: z
    .array(z.coerce.number().int().positive())
    .min(1, "Cần chọn ít nhất một dịch vụ cận lâm sàng")
    .transform((ids) => [...new Set(ids)]),
  indication: z.string().trim().min(1, "Chỉ định không được để trống").max(5000),
  preparation_note: nullableText(5000, "Ghi chú chuẩn bị tối đa 5000 ký tự"),
});

export const createPatientLabOrderSchema = z.object({
  patient_id: z.coerce.number().int().positive(),
  lab_schedule_id: z.coerce.number().int().positive(),
  test_ids: z
    .array(z.coerce.number().int().positive())
    .min(1, "Cần chọn ít nhất một xét nghiệm")
    .transform((ids) => [...new Set(ids)]),
  patient_note: z.string().trim().max(500).nullable().optional(),
});

export const createPatientClinicalOrderSchema = z.object({
  patient_id: z.coerce.number().int().positive(),
  schedule_id: z.coerce.number().int().positive(),
  service_type: z.enum(CLINICAL_SERVICE_TYPES),
  service_ids: z
    .array(z.coerce.number().int().positive())
    .min(1, "Cần chọn ít nhất một dịch vụ cận lâm sàng")
    .transform((ids) => [...new Set(ids)]),
  patient_note: z.string().trim().max(500).nullable().optional(),
});

export const queryLabScheduleSchema = z.object({
  service_type: z.enum(CLINICAL_SERVICE_TYPES).optional(),
  clinic_id: z.coerce.number().int().positive().optional(),
  from_date: z.string().regex(dateRegex).optional(),
  to_date: z.string().regex(dateRegex).optional(),
  is_active: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === undefined ? undefined : value === "true"),
  available_only: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export const queryClinicalAvailableScheduleSchema = queryLabScheduleSchema.extend({
  service_type: z.enum(CLINICAL_SERVICE_TYPES),
});

export const createLabScheduleSchema = z
  .object({
    clinic_id: z.coerce.number().int().positive(),
    work_date: z.string().regex(dateRegex, "Ngày xét nghiệm phải có dạng YYYY-MM-DD"),
    start_time: z.string().regex(timeRegex, "Giờ bắt đầu phải có dạng HH:mm"),
    end_time: z.string().regex(timeRegex, "Giờ kết thúc phải có dạng HH:mm"),
    max_orders: z.coerce.number().int().min(1).max(200).default(10),
  })
  .refine((data) => data.start_time < data.end_time, {
    path: ["end_time"],
    message: "Giờ kết thúc phải sau giờ bắt đầu",
  });

export const createClinicalScheduleSchema = z
  .object({
    service_type: z.enum(CLINICAL_SERVICE_TYPES),
    clinic_id: z.coerce.number().int().positive(),
    work_date: z.string().regex(dateRegex, "Ngày thực hiện phải có dạng YYYY-MM-DD"),
    start_time: z.string().regex(timeRegex, "Giờ bắt đầu phải có dạng HH:mm"),
    end_time: z.string().regex(timeRegex, "Giờ kết thúc phải có dạng HH:mm"),
    max_orders: z.coerce.number().int().min(1).max(200).default(10),
  })
  .refine((data) => data.start_time < data.end_time, {
    path: ["end_time"],
    message: "Giờ kết thúc phải sau giờ bắt đầu",
  });

export const updateLabScheduleSchema = z
  .object({
    clinic_id: z.coerce.number().int().positive().optional(),
    work_date: z.string().regex(dateRegex).optional(),
    start_time: z.string().regex(timeRegex).optional(),
    end_time: z.string().regex(timeRegex).optional(),
    max_orders: z.coerce.number().int().min(1).max(200).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Cần ít nhất một thông tin để cập nhật",
  });

export const updateClinicalScheduleSchema = z
  .object({
    service_type: z.enum(CLINICAL_SERVICE_TYPES).optional(),
    clinic_id: z.coerce.number().int().positive().optional(),
    work_date: z.string().regex(dateRegex).optional(),
    start_time: z.string().regex(timeRegex).optional(),
    end_time: z.string().regex(timeRegex).optional(),
    max_orders: z.coerce.number().int().min(1).max(200).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Cần ít nhất một thông tin để cập nhật",
  });

export const queryLabOrderSchema = z
  .object({
    status: z.enum(CLINICAL_ORDER_STATUSES).optional(),
    service_type: z.enum(CLINICAL_SERVICE_TYPES).optional(),
    appointment_id: z.coerce.number().int().positive().optional(),
    lab_schedule_id: z.coerce.number().int().positive().optional(),
    patient_id: z.coerce.number().int().positive().optional(),
    doctor_id: z.coerce.number().int().positive().optional(),
    from_date: z.string().regex(dateRegex, "Từ ngày phải có dạng YYYY-MM-DD").optional(),
    to_date: z.string().regex(dateRegex, "Đến ngày phải có dạng YYYY-MM-DD").optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine(
    (data) => !data.from_date || !data.to_date || data.from_date <= data.to_date,
    {
      path: ["to_date"],
      message: "Đến ngày phải bằng hoặc sau từ ngày",
    },
  );

export const updateLabOrderStatusSchema = z.object({
  status: z.enum(["IN_PROGRESS", "CANCELLED"]),
});

export const updateClinicalOrderStatusSchema = z
  .object({
    status: z.enum(["IN_PROGRESS", "COMPLETED", "CANCELLED"]),
    cancellation_reason: nullableText(2000, "Lý do hủy tối đa 2000 ký tự"),
  })
  .superRefine((data, context) => {
    if (data.status === "CANCELLED" && !data.cancellation_reason) {
      context.addIssue({
        code: "custom",
        path: ["cancellation_reason"],
        message: "Cần nhập lý do khi hủy phiếu",
      });
    }
  });

export const updateLabResultSchema = z.object({
  result: z.string().trim().min(1, "Kết quả không được để trống"),
  unit: z.string().trim().max(50).nullable().optional(),
  reference_range: z.string().trim().max(255).nullable().optional(),
  note: z.string().trim().nullable().optional(),
});

const clinicalResultFields = {
  result: nullableText(10000, "Kết quả tối đa 10000 ký tự"),
  unit: nullableText(50, "Đơn vị tối đa 50 ký tự"),
  reference_range: nullableText(255, "Khoảng tham chiếu tối đa 255 ký tự"),
  findings: nullableText(20000, "Mô tả kết quả tối đa 20000 ký tự"),
  conclusion: nullableText(10000, "Kết luận tối đa 10000 ký tự"),
  measurements: z.record(z.string(), z.unknown()).nullable().optional(),
  note: nullableText(5000, "Ghi chú tối đa 5000 ký tự"),
};

function hasClinicalResultPayload(data) {
  return Object.keys(clinicalResultFields).some(
    (field) => data[field] !== undefined,
  );
}

function hasMeaningfulClinicalResult(data) {
  return Boolean(
    data.result ||
      data.findings ||
      data.conclusion ||
      data.note ||
      (data.measurements && Object.keys(data.measurements).length > 0),
  );
}

export const createClinicalResultSchema = z
  .object({
    test_id: z.coerce.number().int().positive(),
    ...clinicalResultFields,
  })
  .refine(hasMeaningfulClinicalResult, {
    message: "Cần ít nhất một thông tin kết quả",
  });

export const updateClinicalResultSchema = z
  .object(clinicalResultFields)
  .refine(hasClinicalResultPayload, {
    message: "Cần ít nhất một thông tin kết quả để cập nhật",
  });
