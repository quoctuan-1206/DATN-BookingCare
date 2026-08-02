import { z } from "zod";

// Schema kiểm tra dữ liệu đầu vào khi tạo mới Bác sĩ
export const createDoctorSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải chứa ít nhất 6 ký tự"),
  first_name: z.string().min(1, "Tên không được để trống"),
  last_name: z.string().min(1, "Họ không được để trống"),
  phone: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  date_of_birth: z.string().optional(), // Định dạng YYYY-MM-DD
  address: z.string().optional(),
  avatar: z.string().optional(),
  
  // Các trường thông tin hồ sơ chuyên môn (doctor_profiles)
  position: z.string().optional(),
  degree: z.string().optional(),
  experience_years: z.number().int().min(0).optional(),
  consultation_fee: z.number().min(0).optional(),
  biography: z.string().optional(),
  
  // Cấu hình nơi làm việc ban đầu (tùy chọn)
  clinic_id: z.number().int().positive().optional(),
  specialty_id: z.number().int().positive().optional(),
  room: z.string().optional()
});

// Schema kiểm tra dữ liệu đầu vào khi cập nhật Bác sĩ
export const updateDoctorSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  avatar: z.string().optional(),
  is_active: z.boolean().optional(),
  
  // Các trường thông tin hồ sơ chuyên môn (doctor_profiles)
  position: z.string().optional(),
  degree: z.string().optional(),
  experience_years: z.number().int().min(0).optional(),
  consultation_fee: z.number().min(0).optional(),
  biography: z.string().optional(),
  
  // Cập nhật thông tin nơi làm việc (tùy chọn)
  clinic_id: z.number().int().positive().optional(),
  specialty_id: z.number().int().positive().optional(),
  room: z.string().optional()
});

// Schema kiểm tra query parameter khi lấy danh sách Bác sĩ
export const queryDoctorSchema = z.object({
  search: z.string().optional(),
  specialty_id: z.coerce.number().int().positive().optional(),
  clinic_id: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
});
