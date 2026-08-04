import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ZodError } from "zod";
import doctorRoutes from "./routes/doctor.routes.js";
import authRoutes from "./routes/auth.routes.js";

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
