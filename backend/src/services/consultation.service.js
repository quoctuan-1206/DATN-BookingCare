import { randomUUID } from "node:crypto";
import prisma from "../config/prisma.js";

const activeAppointmentStatuses = ["CONFIRMED", "IN_PROGRESS"];

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function slotDateTime(date, time) {
  const day = new Date(date).toISOString().slice(0, 10);
  const clock = new Date(time).toISOString().slice(11, 19);
  return new Date(`${day}T${clock}+07:00`);
}

export class ConsultationService {
  constructor(prismaClient = prisma) {
    this.prisma = prismaClient;
  }

  async getAuthorizedAppointment(user, appointmentId, { allowCompletedSessionOutsideWindow = false } = {}) {
    const id = Number(appointmentId);
    if (!Number.isInteger(id) || id < 1) fail("Appointment không hợp lệ");
    const appointment = await this.prisma.appointments.findUnique({
      where: { id },
      include: {
        schedules: { include: { doctor_workplaces: true } },
        patient_profiles: { select: { account_id: true } },
        consultation_session: true,
      },
    });
    if (!appointment) fail("Không tìm thấy lịch hẹn", 404);
    const role = user.role?.name;
    const allowed = (role === "Patient" && appointment.patient_profiles.account_id === user.id) ||
      (role === "Doctor" && appointment.schedules.doctor_workplaces.doctor_id === user.id);
    if (!allowed) fail("Bạn không có quyền tham gia phiên này", 403);
    if (appointment.consultation_type !== "ONLINE") fail("Lịch hẹn này không phải khám trực tuyến", 409);
    if (!activeAppointmentStatuses.includes(appointment.status)) fail("Lịch hẹn chưa được xác nhận hoặc không ở trạng thái tư vấn", 409);
    if (appointment.status === "CANCELLED" || appointment.status === "NO_SHOW" || appointment.status === "COMPLETED") {
      fail("Lịch hẹn không còn cho phép tư vấn", 409);
    }
    const start = slotDateTime(appointment.schedules.work_date, appointment.schedules.start_time);
    const end = slotDateTime(appointment.schedules.work_date, appointment.schedules.end_time);
    const now = Date.now();
    const outsideWindow = now < start.getTime() - 15 * 60_000 || now > end.getTime() + 30 * 60_000;
    const completedSessionRead = allowCompletedSessionOutsideWindow &&
      appointment.consultation_session?.status === "COMPLETED";
    if (outsideWindow && !completedSessionRead) {
      fail("Phòng tư vấn chỉ mở trước giờ hẹn 15 phút đến 30 phút sau giờ kết thúc", 403);
    }
    return appointment;
  }

  async getOrCreate(user, appointmentId) {
    const appointment = await this.getAuthorizedAppointment(user, appointmentId);
    if (appointment.consultation_session) return appointment.consultation_session;
    try {
      return await this.prisma.consultation_sessions.create({
        data: { appointment_id: appointment.id, room_id: randomUUID() },
      });
    } catch (error) {
      if (error.code !== "P2002") throw error;
      return this.prisma.consultation_sessions.findUnique({ where: { appointment_id: appointment.id } });
    }
  }

  async get(user, appointmentId) {
    const appointment = await this.getAuthorizedAppointment(user, appointmentId, {
      allowCompletedSessionOutsideWindow: true,
    });
    if (appointment.consultation_session) return appointment.consultation_session;
    return this.getOrCreate(user, appointmentId);
  }

  async start(user, appointmentId) {
    const session = await this.getOrCreate(user, appointmentId);
    if (["COMPLETED", "CANCELLED", "FAILED"].includes(session.status)) fail("Phiên tư vấn đã kết thúc", 409);
    if (session.status === "WAITING") {
      return this.prisma.consultation_sessions.update({
        where: { id: session.id },
        data: { status: "CONNECTING" },
      });
    }
    return session;
  }

  async finish(user, appointmentId) {
    const appointment = await this.getAuthorizedAppointment(user, appointmentId, {
      allowCompletedSessionOutsideWindow: true,
    });
    if (user.role?.name !== "Doctor") fail("Chỉ bác sĩ phụ trách mới được kết thúc phiên tư vấn", 403);
    const session = appointment.consultation_session;
    if (!session) fail("Lịch hẹn chưa có phiên tư vấn để kết thúc", 409);
    if (["COMPLETED", "CANCELLED"].includes(session.status)) {
      return { session, completedNow: false };
    }
    const activeSessionStatuses = ["WAITING", "CONNECTING", "IN_PROGRESS"];
    if (!activeSessionStatuses.includes(session.status)) fail("Phiên tư vấn không ở trạng thái có thể kết thúc", 409);

    const endedAt = new Date();
    const result = await this.prisma.consultation_sessions.updateMany({
      where: { id: session.id, status: { in: activeSessionStatuses } },
      data: {
        status: "COMPLETED",
        ended_at: endedAt,
        duration_seconds: session.started_at ? Math.max(0, Math.floor((endedAt - session.started_at) / 1000)) : null,
      },
    });
    const latestSession = await this.prisma.consultation_sessions.findUnique({ where: { id: session.id } });
    if (result.count) return { session: latestSession, completedNow: true };
    if (latestSession?.status === "COMPLETED") return { session: latestSession, completedNow: false };
    fail("Phiên tư vấn đã thay đổi trạng thái; vui lòng tải lại lịch hẹn", 409);
  }

  async markInProgress(sessionId) {
    return this.prisma.consultation_sessions.updateMany({
      where: { id: Number(sessionId), status: { in: ["WAITING", "CONNECTING"] } },
      data: { status: "IN_PROGRESS", started_at: new Date() },
    });
  }

  async history(user) {
    const role = user.role?.name;
    const where = role === "Doctor"
      ? { schedules: { doctor_workplaces: { doctor_id: user.id } } }
      : { patient_profiles: { account_id: user.id } };
    const appointments = await this.prisma.appointments.findMany({
      where: { consultation_type: "ONLINE", ...where },
      include: {
        schedules: {
          include: {
            doctor_workplaces: {
              include: {
                doctor_profiles: {
                  include: {
                    users: {
                      select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        consultation_session: true,
      },
      orderBy: { id: "desc" },
      take: 100,
    });
    return appointments.map(({ id, status, schedules, consultation_session }) => ({
      appointment_id: id,
      appointment_status: status,
      date: schedules.work_date,
      start_time: schedules.start_time,
      end_time: schedules.end_time,
      doctor: schedules.doctor_workplaces.doctor_profiles.users,
      session: consultation_session,
    }));
  }
}

export default new ConsultationService();
