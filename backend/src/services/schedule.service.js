import scheduleRepository from "../repositories/schedule.repository.js";
import {
  formatDateOnly,
  formatTimeOnly,
  formatDateDisplay,
} from "../utils/datetime.js";

class ScheduleService {
  // Chuẩn hóa định dạng dữ liệu lịch khám trả về cho API
  formatScheduleResponse(schedule) {
    if (!schedule) return null;

    const workplace = schedule.doctor_workplaces;
    const doctorUser = workplace?.doctor_profiles?.users;
    const doctorName = doctorUser
      ? [doctorUser.last_name, doctorUser.first_name]
          .filter(Boolean)
          .join(" ")
          .trim()
      : null;

    const workDate = formatDateOnly(schedule.work_date);
    const startTime = formatTimeOnly(schedule.start_time);
    const endTime = formatTimeOnly(schedule.end_time);
    const maxPatients = schedule.max_patients ?? 10;
    const bookedPatients = schedule.booked_patients ?? 0;

    return {
      id: schedule.id,
      doctor_workplace_id: schedule.doctor_workplace_id,
      work_date: workDate,
      date_display: formatDateDisplay(workDate),
      start_time: startTime,
      end_time: endTime,
      time: `${startTime} - ${endTime}`,
      max_patients: maxPatients,
      booked_patients: bookedPatients,
      available: bookedPatients < maxPatients,
      remaining: Math.max(maxPatients - bookedPatients, 0),
      doctor_id: workplace?.doctor_id || doctorUser?.id || null,
      doctor_name: doctorName,
      clinic_id: workplace?.clinic_id || workplace?.clinics?.id || null,
      clinic_name: workplace?.clinics?.name || null,
      clinic_address: workplace?.clinics?.address || null,
      specialty_id:
        workplace?.specialty_id || workplace?.specialties?.id || null,
      specialty_name: workplace?.specialties?.name || null,
      room: workplace?.room || null,
      created_at: schedule.created_at,
      updated_at: schedule.updated_at,
    };
  }

  // Validate id là số nguyên dương
  parseId(id) {
    const scheduleId = Number(id);
    if (!Number.isInteger(scheduleId) || scheduleId <= 0) {
      const error = new Error("ID lịch khám không hợp lệ");
      error.statusCode = 400;
      throw error;
    }
    return scheduleId;
  }

  // Kiểm tra quyền quản lý lịch theo nơi làm việc
  async assertCanManageWorkplace(workplaceId, currentUser) {
    const workplace = await scheduleRepository.findWorkplaceById(workplaceId);

    if (!workplace || workplace.is_active === false) {
      const error = new Error("Không tìm thấy nơi làm việc của bác sĩ");
      error.statusCode = 404;
      throw error;
    }

    const role = currentUser?.role?.name;
    if (role === "Admin") return workplace;

    if (role === "Doctor" && workplace.doctor_id === currentUser.id) {
      return workplace;
    }

    const error = new Error("Bạn không có quyền quản lý lịch này");
    error.statusCode = 403;
    throw error;
  }

  // Lấy danh sách lịch khám
  async getAllSchedules(queryParams) {
    const { total, schedules, page, limit } =
      await scheduleRepository.findAll(queryParams);

    return {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 0,
      data: schedules.map((s) => this.formatScheduleResponse(s)),
    };
  }

  // Lấy chi tiết lịch khám theo ID
  async getScheduleById(id) {
    const scheduleId = this.parseId(id);
    const schedule = await scheduleRepository.findById(scheduleId);

    if (!schedule) {
      const error = new Error("Không tìm thấy lịch khám");
      error.statusCode = 404;
      throw error;
    }

    return this.formatScheduleResponse(schedule);
  }

  // Chuẩn hóa danh sách khung giờ cần tạo
  normalizeSlots(data) {
    if (Array.isArray(data.slots) && data.slots.length > 0) {
      return data.slots.map((slot) => ({
        doctor_workplace_id: data.doctor_workplace_id,
        work_date: data.work_date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        max_patients: slot.max_patients ?? data.max_patients ?? 10,
      }));
    }

    return [
      {
        doctor_workplace_id: data.doctor_workplace_id,
        work_date: data.work_date,
        start_time: data.start_time,
        end_time: data.end_time,
        max_patients: data.max_patients ?? 10,
      },
    ];
  }

  // Tạo lịch khám mới (1 hoặc nhiều khung giờ)
  async createSchedule(data, currentUser) {
    await this.assertCanManageWorkplace(data.doctor_workplace_id, currentUser);

    const slots = this.normalizeSlots(data);

    try {
      if (slots.length === 1) {
        const schedule = await scheduleRepository.create(slots[0]);
        return this.formatScheduleResponse(schedule);
      }

      const created = await scheduleRepository.createMany(slots);
      return created.map((s) => this.formatScheduleResponse(s));
    } catch (error) {
      if (error.code === "P2002") {
        const err = new Error(
          "Khung giờ đã tồn tại cho nơi làm việc / ngày này",
        );
        err.statusCode = 409;
        throw err;
      }
      throw error;
    }
  }

  // Cập nhật lịch khám
  async updateSchedule(id, data, currentUser) {
    const scheduleId = this.parseId(id);
    const existing = await scheduleRepository.findById(scheduleId);

    if (!existing) {
      const error = new Error("Không tìm thấy lịch khám");
      error.statusCode = 404;
      throw error;
    }

    await this.assertCanManageWorkplace(
      existing.doctor_workplace_id,
      currentUser,
    );

    if ((existing.booked_patients || 0) > 0) {
      if (data.work_date || data.start_time || data.end_time) {
        const error = new Error(
          "Không thể đổi ngày/giờ khi đã có bệnh nhân đặt lịch",
        );
        error.statusCode = 400;
        throw error;
      }
    }

    const start = data.start_time || formatTimeOnly(existing.start_time);
    const end = data.end_time || formatTimeOnly(existing.end_time);
    if (start >= end) {
      const error = new Error("end_time phải sau start_time");
      error.statusCode = 400;
      throw error;
    }

    try {
      const updated = await scheduleRepository.update(scheduleId, data);
      return this.formatScheduleResponse(updated);
    } catch (error) {
      if (error.code === "P2002") {
        const err = new Error(
          "Khung giờ đã tồn tại cho nơi làm việc / ngày này",
        );
        err.statusCode = 409;
        throw err;
      }
      throw error;
    }
  }

  // Xóa lịch khám
  async deleteSchedule(id, currentUser) {
    const scheduleId = this.parseId(id);
    const existing = await scheduleRepository.findById(scheduleId);

    if (!existing) {
      const error = new Error("Không tìm thấy lịch khám");
      error.statusCode = 404;
      throw error;
    }

    await this.assertCanManageWorkplace(
      existing.doctor_workplace_id,
      currentUser,
    );

    if ((existing.booked_patients || 0) > 0 || existing._count?.appointments > 0) {
      const error = new Error(
        "Không thể xóa lịch đã có lượt đặt. Hãy hủy các appointment trước.",
      );
      error.statusCode = 400;
      throw error;
    }

    await scheduleRepository.delete(scheduleId);

    return {
      message: `Đã xóa lịch khám ID ${scheduleId} thành công`,
    };
  }
}

export default new ScheduleService();
