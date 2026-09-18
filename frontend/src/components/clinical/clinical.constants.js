export const CLINICAL_TYPES = [
  { value: "ALL", label: "Tất cả" },
  { value: "LAB", label: "Xét nghiệm" },
  { value: "XRAY", label: "X-quang" },
  { value: "ULTRASOUND", label: "Siêu âm" },
  { value: "ENDOSCOPY", label: "Nội soi" },
  { value: "ECG", label: "Điện tim" },
];

export const CLINICAL_TYPE_LABEL = Object.fromEntries(
  CLINICAL_TYPES.filter((item) => item.value !== "ALL").map((item) => [
    item.value,
    item.label,
  ]),
);

export const CLINICAL_BOOKING_MODES = [
  {
    value: "DOCTOR_ORDER",
    label: "Cần bác sĩ chỉ định",
    description: "Bệnh nhân chỉ thực hiện dịch vụ sau khi có phiếu chỉ định.",
  },
  {
    value: "SELF_BOOKING",
    label: "Bệnh nhân tự đặt",
    description: "Bệnh nhân có thể chọn dịch vụ và đặt lịch trực tiếp.",
  },
];

export const CLINICAL_BOOKING_MODE_LABEL = Object.fromEntries(
  CLINICAL_BOOKING_MODES.map((item) => [item.value, item.label]),
);

export const CLINICAL_STATUS = {
  PENDING: { label: "Chờ tiếp nhận", tone: "pending" },
  IN_PROGRESS: { label: "Đang thực hiện", tone: "progress" },
  COMPLETED: { label: "Đã hoàn thành", tone: "completed" },
  CANCELLED: { label: "Đã hủy", tone: "cancelled" },
};

export const CLINICAL_STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  ...Object.entries(CLINICAL_STATUS).map(([value, item]) => ({
    value,
    label: item.label,
  })),
];

export function formatClinicalDate(value, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export function formatClinicalPrice(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}
