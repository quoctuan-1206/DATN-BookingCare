import { formatDateDisplay, formatDateOnly, formatTimeOnly } from "../utils/datetime.js";
import reminderEmailRepository from "../repositories/reminder-email.repository.js";
import { getTransport } from "../config/mail.js";

const MAX_ATTEMPTS = 3;

// Chặn gửi trùng trong cùng process khi không ghi được trạng thái đã gửi vào DB.
const sentThisProcess = new Set();

export function resetProcessDedupe() {
  sentThisProcess.clear();
}

function doctorName(appointment) {
  const user = appointment?.schedules?.doctor_workplaces?.doctor_profiles?.users;
  if (!user) return null;
  return [user.last_name, user.first_name].filter(Boolean).join(" ") || null;
}

function normalizeBaseUrl(value) {
  const baseUrl = String(value || "")
    .split(",")[0]
    .trim()
    .replace(/\/$/, "");
  return baseUrl || "http://localhost:5173";
}

export function renderAppointmentReminder(appointment, { frontendUrl = process.env.FRONTEND_URL } = {}) {
  const schedule = appointment?.schedules || {};
  const workplace = schedule.doctor_workplaces || {};
  const date = formatDateOnly(schedule.work_date);
  const time = formatTimeOnly(schedule.start_time);
  const dateDisplay = formatDateDisplay(date);
  const patientName = appointment?.patient_profiles?.full_name || "Quý khách";
  const bookingCode = appointment?.booking_code || `#${appointment.id}`;
  const link = `${normalizeBaseUrl(frontendUrl)}/patient/appointments/${appointment.id}`;

  const rows = [
    ["Mã đặt lịch", bookingCode],
    ["Thời gian", `${dateDisplay} lúc ${time}`],
    ["Bác sĩ", doctorName(appointment)],
    ["Chuyên khoa", workplace.specialties?.name],
    ["Phòng khám", workplace.clinics?.name],
    ["Địa chỉ", workplace.clinics?.address],
    ["Phòng", workplace.room],
  ].filter(([, value]) => Boolean(value));

  const subject = `[BookingCare] Nhắc lịch khám ${dateDisplay} lúc ${time}`;
  const text = [
    `Xin chào ${patientName},`,
    "",
    `Bạn có lịch khám vào ${dateDisplay} lúc ${time}.`,
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Vui lòng đến sớm 15 phút và mang theo giấy tờ tùy thân.",
    `Xem chi tiết: ${link}`,
  ].join("\n");

  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1f2937">
  <p>Xin chào <strong>${patientName}</strong>,</p>
  <p>Bạn có lịch khám vào <strong>${dateDisplay} lúc ${time}</strong>.</p>
  <table cellpadding="6" style="border-collapse:collapse">${rows
    .map(([label, value]) => `<tr><td style="color:#6b7280">${label}</td><td><strong>${value}</strong></td></tr>`)
    .join("")}</table>
  <p>Vui lòng đến sớm 15 phút và mang theo giấy tờ tùy thân.</p>
  <p><a href="${link}">Xem chi tiết lịch hẹn</a></p>
</div>`;

  return { subject, text, html };
}

export async function sendAppointmentReminder(appointment, {
  reminderKey,
  repository = reminderEmailRepository,
  transport = getTransport(),
  now = new Date(),
} = {}) {
  const to = appointment?.patient_profiles?.users?.email;
  if (!to || !reminderKey) return "SKIPPED";
  if (!transport) return "DISABLED";

  const dedupeKey = `${appointment.id}:${reminderKey}`;
  if (sentThisProcess.has(dedupeKey)) return "SKIPPED";

  let existing;
  try {
    existing = await repository.findByKey(appointment.id, reminderKey);
  } catch (error) {
    console.error(`[email] Không đọc được trạng thái nhắc lịch ${reminderKey}, bỏ qua để tránh gửi trùng:`, error.message);
    return "SKIPPED";
  }
  if (existing?.status === "SENT") return "SKIPPED";
  if ((existing?.attempts || 0) >= MAX_ATTEMPTS) return "SKIPPED";

  const { subject, text, html } = renderAppointmentReminder(appointment);
  try {
    await transport.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    });
    sentThisProcess.add(dedupeKey);
  } catch (error) {
    console.error(`[email] Không gửi được nhắc lịch ${reminderKey}:`, error.message);
    try {
      await repository.recordFailure({ appointmentId: appointment.id, reminderKey, error: error.message, now });
    } catch (recordError) {
      console.error(`[email] Không ghi nhận được lỗi gửi nhắc lịch ${reminderKey}:`, recordError.message);
    }
    return "FAILED";
  }

  try {
    await repository.markSent({ appointmentId: appointment.id, reminderKey, now });
    return "SENT";
  } catch (error) {
    console.error(`[email] Không lưu được trạng thái đã gửi nhắc lịch ${reminderKey}:`, error.message);
    try {
      const landed = await repository.findByKey(appointment.id, reminderKey);
      if (landed?.status === "SENT") return "SENT";
    } catch (readError) {
      console.error(`[email] Không đọc lại được trạng thái nhắc lịch ${reminderKey}:`, readError.message);
    }
    console.error(`[email] Đã gửi nhắc lịch ${reminderKey} nhưng chưa ghi nhận được; sẽ bỏ qua trong process này.`);
    return "FAILED";
  }
}

export default { renderAppointmentReminder, sendAppointmentReminder };
