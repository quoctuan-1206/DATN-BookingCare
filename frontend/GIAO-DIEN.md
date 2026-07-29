# Tổng hợp giao diện & đường dẫn

Tài liệu liệt kê các giao diện frontend hiện có trong Booking Care.

---

## 1. Công khai

| Đường dẫn | Giao diện |
|---|---|
| `/` | Trang chủ |
| `/doctors` | Danh sách bác sĩ |
| `/doctors/:id` | Chi tiết bác sĩ |
| `/clinics` | Danh sách phòng khám |
| `/clinics/:id` | Chi tiết phòng khám |
| `/specialties` | Danh sách chuyên khoa |
| `/specialties/:id` | Chi tiết chuyên khoa |
| `/booking` | Đặt lịch |
| `/booking/success` | Đặt lịch thành công |

---

## 2. Auth

| Đường dẫn | Giao diện |
|---|---|
| `/login` | Đăng nhập |
| `/register` | Đăng ký |
| `/forgot-password` | Quên mật khẩu |
| `/verify-otp` | Xác thực OTP |
| `/reset-password` | Đặt lại mật khẩu |
| `/unauthorized` | Không có quyền |

---

## 3. Bệnh nhân (`/patient`)

| Đường dẫn | Giao diện |
|---|---|
| `/patient` | Dashboard |
| `/patient/profiles` | Hồ sơ bệnh nhân |
| `/patient/appointments` | Lịch hẹn |
| `/patient/appointments/:id` | Chi tiết lịch hẹn |
| `/patient/medical-records` | Hồ sơ bệnh án |
| `/patient/notifications` | Thông báo |
| `/patient/profile` | Tài khoản |

---

## 4. Bác sĩ (`/doctor`)

| Đường dẫn | Giao diện | Ghi chú |
|---|---|---|
| `/doctor` | Dashboard | UI đầy đủ |
| `/doctor/schedule` | Lịch hôm nay | Placeholder |
| `/doctor/appointments` | Lịch hẹn | Placeholder |
| `/doctor/appointments/:id` | Chi tiết lịch hẹn | Placeholder |
| `/doctor/medical-records` | Hồ sơ bệnh án | Placeholder |
| `/doctor/working-schedule` | Lịch làm việc | Placeholder |
| `/doctor/prescriptions` | Đơn thuốc | Placeholder |
| `/doctor/reviews` | Đánh giá | Placeholder |
| `/doctor/profile` | Hồ sơ bác sĩ | Placeholder |

---

## 5. Admin (`/admin`)

| Đường dẫn | Giao diện |
|---|---|
| `/admin` | Dashboard |
| `/admin/doctors` | Quản lý bác sĩ |
| `/admin/doctors/create` | Thêm bác sĩ |
| `/admin/clinics` | Quản lý phòng khám |
| `/admin/clinics/create` | Thêm phòng khám |
| `/admin/specialties` | Quản lý chuyên khoa |
| `/admin/specialties/create` | Thêm chuyên khoa |
| `/admin/appointments` | Quản lý lịch hẹn |
| `/admin/users` | Quản lý người dùng |
| `/admin/articles` | Quản lý bài viết |
| `/admin/articles/create` | Viết bài |
| `/admin/reviews` | Quản lý đánh giá |
| `/admin/payments` | Quản lý thanh toán |
| `/admin/settings` | Cài đặt |
| `/admin/profile` | Hồ sơ admin |

---

## Ghi chú

- Cấu hình route nằm trong `frontend/src/App.jsx`.
- `:id` là tham số động (ID bác sĩ, phòng khám, chuyên khoa, lịch hẹn…).
- Ví dụ chạy local: `http://localhost:5173/admin`, `http://localhost:5173/doctor`, `http://localhost:5173/patient`.
