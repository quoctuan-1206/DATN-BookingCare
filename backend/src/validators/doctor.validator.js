import { z } from "zod";

// Schema kiểm tra dữ liệu đầu vào khi tạo mới Bác sĩ
export const createDoctorSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải chứa ít nhất 6 ký tự"),
  first_name: z.string().min(1, "Tên không được để trống"),
  last_name: z.string().min(1, "Họ không được để trống"),
  phone: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  avatar: z.string().optional(),

  position: z.string().optional(),
  degree: z.string().optional(),
  experience_years: z.coerce.number().int().min(0).optional(),
  consultation_fee: z.coerce.number().min(0).optional(),
  biography: z.string().optional(),

  clinic_id: z.coerce.number().int().positive("Phòng khám không hợp lệ"),
  specialty_id: z.coerce.number().int().positive("Chuyên khoa không hợp lệ"),
  room: z.string().optional(),
});

export const updateDoctorSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  avatar: z.string().optional(),
  is_active: z.boolean().optional(),

  position: z.string().optional(),
  degree: z.string().optional(),
  experience_years: z.coerce.number().int().min(0).optional(),
  consultation_fee: z.coerce.number().min(0).optional(),
  biography: z.string().optional(),

  clinic_id: z.coerce.number().int().positive().optional(),
  specialty_id: z.coerce.number().int().positive().optional(),
  room: z.string().optional(),
});

export const workplaceSchema = z.object({
  clinic_id: z.coerce.number().int().positive("Phòng khám không hợp lệ"),
  specialty_id: z.coerce.number().int().positive("Chuyên khoa không hợp lệ"),
  room: z.string().optional().nullable(),
  consultation_fee: z.coerce.number().min(0).optional().default(0),
});

export const updateWorkplaceSchema = z.object({
  room: z.string().optional().nullable(),
  consultation_fee: z.coerce.number().min(0).optional(),
  position: z.string().optional().nullable(),
});

export const queryDoctorSchema = z.object({
  search: z.string().optional(),
  specialty_id: z.coerce.number().int().positive().optional(),
  clinic_id: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
