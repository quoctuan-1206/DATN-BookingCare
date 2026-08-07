import axiosClient from "../api/axios";

export function mapScheduleFromApi(schedule) {
  if (!schedule) return null;

  return {
    ...schedule,
    date_display: schedule.date_display || schedule.work_date,
    time:
      schedule.time ||
      `${schedule.start_time || ""} - ${schedule.end_time || ""}`,
    available:
      schedule.available ??
      (schedule.booked_patients || 0) < (schedule.max_patients || 0),
  };
}

export const scheduleService = {
  getSchedules: async (params = {}) => {
    const res = await axiosClient.get("/schedules", { params });
    const payload = res.data || {};
    const list = Array.isArray(payload.data) ? payload.data : [];

    return {
      ...payload,
      data: list.map(mapScheduleFromApi),
      pagination: payload.pagination || {
        total: list.length,
        page: 1,
        limit: list.length,
        total_pages: 1,
      },
    };
  },

  getScheduleById: async (id) => {
    const res = await axiosClient.get(`/schedules/${id}`);
    return mapScheduleFromApi(res.data?.data);
  },

  createSchedule: (payload) => axiosClient.post("/schedules", payload),

  updateSchedule: (id, payload) =>
    axiosClient.put(`/schedules/${id}`, payload),

  deleteSchedule: (id) => axiosClient.delete(`/schedules/${id}`),

  /** Helper: ngày + slot theo bác sĩ */
  getDoctorScheduleMap: async (doctorId, params = {}) => {
    const result = await scheduleService.getSchedules({
      doctor_id: doctorId,
      limit: 200,
      ...params,
    });

    const byDate = {};
    for (const slot of result.data) {
      if (!byDate[slot.work_date]) byDate[slot.work_date] = [];
      byDate[slot.work_date].push(slot);
    }

    const dateOptions = Object.keys(byDate)
      .sort()
      .map((work_date) => ({
        value: work_date,
        label: byDate[work_date][0]?.date_display || work_date,
      }));

    return { schedules: result.data, byDate, dateOptions };
  },
};

export default scheduleService;
