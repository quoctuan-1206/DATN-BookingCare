import axiosClient from "../api/axios";

export const STATUS_LABEL = {
  PENDING: "Đang chờ",
  CONFIRMED: "Đã xác nhận",
  CHECKED_IN: "Đã check-in",
  WAITING: "Đang chờ khám",
  CALLED: "Đã gọi",
  IN_PROGRESS: "Đang khám",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  NO_SHOW: "Không đến",
};

export const STATUS_CLASS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CHECKED_IN: "checked-in",
  WAITING: "waiting",
  CALLED: "called",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no-show",
};

export function mapAppointmentFromApi(appointment) {
  if (!appointment) return null;

  return {
    ...appointment,
    doctor_name: appointment.doctor_name || "—",
    specialty: appointment.specialty || "—",
    clinic: appointment.clinic || "—",
    patient_name: appointment.patient_name || "—",
    date_display: appointment.date_display || appointment.work_date,
    time: appointment.time || `${appointment.start_time || ""} - ${appointment.end_time || ""}`,
    status_label: STATUS_LABEL[appointment.status] || appointment.status,
  };
}

export const appointmentService = {
  getAppointments: async (params = {}) => {
    const res = await axiosClient.get("/appointments", { params });
    const payload = res.data || {};
    const list = Array.isArray(payload.data) ? payload.data : [];

    return {
      ...payload,
      data: list.map(mapAppointmentFromApi),
      pagination: payload.pagination || {
        total: list.length,
        page: 1,
        limit: list.length,
        total_pages: 1,
      },
    };
  },

  getAppointmentById: async (id) => {
    const res = await axiosClient.get(`/appointments/${id}`);
    return mapAppointmentFromApi(res.data?.data);
  },

  createAppointment: (payload) =>
    axiosClient.post("/appointments", payload),

  updateStatus: (id, status) =>
    axiosClient.patch(`/appointments/${id}/status`, { status }),

  startExam: async (id) => {
    const res = await axiosClient.post(`/appointments/${id}/start`);
    return mapAppointmentFromApi(res.data?.data);
  },

  getToday: async (params = {}) => {
    const res = await axiosClient.get("/appointments/today", { params });
    const payload = res.data || {};
    return {
      ...payload,
      data: (Array.isArray(payload.data) ? payload.data : []).map(mapAppointmentFromApi),
    };
  },

  performAction: async (id, action) => {
    const res = await axiosClient.post(`/appointments/${id}/${action}`);
    return mapAppointmentFromApi(res.data?.data);
  },

  getQueuePosition: async (id) => {
    const res = await axiosClient.get(`/appointments/${id}/queue-position`);
    return res.data?.data;
  },
};

export default appointmentService;
