export const AUDIT_ACTIONS = Object.freeze([
  "LOGIN",
  "LOGOUT",
  "LOGIN_FAILED",
  "CREATE",
  "UPDATE",
  "DELETE",
  "VIEW",
  "DOWNLOAD",
  "CREATE_APPOINTMENT",
  "CANCEL_APPOINTMENT",
  "CONFIRM_APPOINTMENT",
  "CREATE_MEDICAL_RECORD",
  "UPDATE_MEDICAL_RECORD",
  "CREATE_PRESCRIPTION",
  "UPDATE_PRESCRIPTION",
  "CREATE_LAB_ORDER",
  "UPDATE_LAB_RESULT",
  "DOWNLOAD_LAB_RESULT",
  "PAYMENT_SUCCESS",
  "PAYMENT_FAILED",
  "REFUND",
  "CHANGE_PASSWORD",
  "RESET_PASSWORD",
  "LOCK_USER",
  "UNLOCK_USER",
]);

export const AUDIT_RESOURCES = Object.freeze([
  "USER",
  "PATIENT",
  "DOCTOR",
  "CLINIC",
  "SPECIALTY",
  "APPOINTMENT",
  "MEDICAL_RECORD",
  "PRESCRIPTION",
  "LAB_ORDER",
  "LAB_RESULT",
  "PAYMENT",
  "REVIEW",
  "NOTIFICATION",
]);

export const AUDIT_ACTION_LABELS = Object.freeze({
  LOGIN: "Đăng nhập",
  LOGOUT: "Đăng xuất",
  LOGIN_FAILED: "Đăng nhập thất bại",
  CREATE: "Tạo mới",
  UPDATE: "Cập nhật",
  DELETE: "Xóa",
  VIEW: "Xem",
  DOWNLOAD: "Tải xuống",
  CREATE_APPOINTMENT: "Tạo lịch hẹn",
  CANCEL_APPOINTMENT: "Hủy lịch hẹn",
  CONFIRM_APPOINTMENT: "Xác nhận lịch hẹn",
  CREATE_MEDICAL_RECORD: "Tạo bệnh án",
  UPDATE_MEDICAL_RECORD: "Cập nhật bệnh án",
  CREATE_PRESCRIPTION: "Tạo đơn thuốc",
  UPDATE_PRESCRIPTION: "Cập nhật đơn thuốc",
  CREATE_LAB_ORDER: "Tạo chỉ định CLS",
  UPDATE_LAB_RESULT: "Cập nhật kết quả CLS",
  DOWNLOAD_LAB_RESULT: "Tải kết quả CLS",
  PAYMENT_SUCCESS: "Thanh toán thành công",
  PAYMENT_FAILED: "Thanh toán thất bại",
  REFUND: "Hoàn tiền",
  CHANGE_PASSWORD: "Đổi mật khẩu",
  RESET_PASSWORD: "Đặt lại mật khẩu",
  LOCK_USER: "Khóa người dùng",
  UNLOCK_USER: "Mở khóa người dùng",
});

export const AUDIT_RESOURCE_LABELS = Object.freeze({
  USER: "Người dùng",
  PATIENT: "Bệnh nhân",
  DOCTOR: "Bác sĩ",
  CLINIC: "Phòng khám",
  SPECIALTY: "Chuyên khoa",
  APPOINTMENT: "Lịch hẹn",
  MEDICAL_RECORD: "Bệnh án",
  PRESCRIPTION: "Đơn thuốc",
  LAB_ORDER: "Chỉ định CLS",
  LAB_RESULT: "Kết quả CLS",
  PAYMENT: "Thanh toán",
  REVIEW: "Đánh giá",
  NOTIFICATION: "Thông báo",
});

const SENSITIVE_KEY_PARTS = [
  "password",
  "passwd",
  "token",
  "otp",
  "secret",
  "authorization",
  "cookie",
  "apikey",
  "securehash",
  "credential",
  "privatekey",
];

function isSensitiveKey(key) {
  const normalized = String(key).toLowerCase().replace(/[^a-z0-9]/g, "");
  return SENSITIVE_KEY_PARTS.some((part) => normalized.includes(part));
}

function redactAuditValue(value, seen = new WeakSet()) {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;

  if (seen.has(value)) return "[Circular]";
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      return value.map((item) => redactAuditValue(item, seen));
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        isSensitiveKey(key)
          ? "[REDACTED]"
          : redactAuditValue(item, seen),
      ]),
    );
  } finally {
    seen.delete(value);
  }
}

export function formatAuditJson(value, maxLength = 100_000) {
  if (value === null || value === undefined || value === "") return "—";

  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return value.length > maxLength
        ? `${value.slice(0, maxLength)}\n… [Nội dung đã được rút gọn]`
        : value;
    }
  }

  try {
    const formatted = JSON.stringify(redactAuditValue(parsed), null, 2);
    if (formatted === undefined) return String(value);
    return formatted.length > maxLength
      ? `${formatted.slice(0, maxLength)}\n… [Nội dung đã được rút gọn]`
      : formatted;
  } catch {
    return String(value);
  }
}

export function formatAuditDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN");
}

export function getAuditActor(log) {
  const user = log?.user;
  const name = user?.fullName || user?.full_name || "";
  const email = user?.email || log?.metadata?.attemptedEmail || "";

  return {
    name: name || email || (log?.userId ? `Người dùng #${log.userId}` : "Hệ thống / Ẩn danh"),
    detail: name && email ? email : user?.role || "",
  };
}

export function getAuditActionTone(action) {
  if (
    [
      "LOGIN_FAILED",
      "DELETE",
      "CANCEL_APPOINTMENT",
      "PAYMENT_FAILED",
      "LOCK_USER",
    ].includes(action)
  ) {
    return "danger";
  }
  if (["VIEW", "DOWNLOAD", "DOWNLOAD_LAB_RESULT"].includes(action)) {
    return "info";
  }
  if (
    [
      "CREATE",
      "CREATE_APPOINTMENT",
      "CONFIRM_APPOINTMENT",
      "CREATE_MEDICAL_RECORD",
      "CREATE_PRESCRIPTION",
      "CREATE_LAB_ORDER",
      "PAYMENT_SUCCESS",
      "UNLOCK_USER",
    ].includes(action)
  ) {
    return "success";
  }
  if (
    [
      "UPDATE",
      "UPDATE_MEDICAL_RECORD",
      "UPDATE_PRESCRIPTION",
      "UPDATE_LAB_RESULT",
      "REFUND",
      "CHANGE_PASSWORD",
      "RESET_PASSWORD",
    ].includes(action)
  ) {
    return "warning";
  }
  return "neutral";
}

export function isCanceledRequest(error) {
  return (
    error?.name === "AbortError" ||
    error?.name === "CanceledError" ||
    error?.code === "ERR_CANCELED"
  );
}
