import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ZodError } from "zod";
import doctorRoutes from "./routes/doctor.routes.js";
import authRoutes from "./routes/auth.routes.js";
import clinicRoutes from "./routes/clinic.routes.js";
import specialtyRoutes from "./routes/specialty.routes.js";
import userRoutes from "./routes/user.routes.js";
import articleRoutes from "./routes/article.routes.js";
import scheduleRoutes from "./routes/schedule.routes.js";
import patientProfileRoutes from "./routes/patient-profile.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import medicalRecordRoutes from "./routes/medical-record.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Route kiểm tra hệ thống
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Hệ thống Booking Care API đang hoạt động",
  });
});

// Auth
app.use("/api/auth", authRoutes);

// Đăng ký router quản lý Bác sĩ
app.use("/api/doctors", doctorRoutes);

// Đăng ký router quản lý Phòng khám
app.use("/api/clinics", clinicRoutes);

// Đăng ký router quản lý Chuyên khoa
app.use("/api/specialties", specialtyRoutes);

// Đăng ký router quản lý Người dùng (Admin)
app.use("/api/users", userRoutes);

// Đăng ký router quản lý Bài viết
app.use("/api/articles", articleRoutes);

// Đăng ký router quản lý Lịch khám
app.use("/api/schedules", scheduleRoutes);

// Hồ sơ bệnh nhân (Patient)
app.use("/api/patient-profiles", patientProfileRoutes);

// Lịch hẹn (Appointment)
app.use("/api/appointments", appointmentRoutes);

// Bệnh án (Medical records)
app.use("/api/medical-records", medicalRecordRoutes);

// Thông báo
app.use("/api/notifications", notificationRoutes);

// Middleware bắt lỗi chung toàn hệ thống
app.use((err, req, res, next) => {
  console.error("Lỗi API:", err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu không hợp lệ",
      errors: err.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || "Lỗi máy chủ",
  });
});

export default app;
