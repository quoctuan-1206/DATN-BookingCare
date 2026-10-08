import defaultAppointmentRepository from "../repositories/appointment.repository.js";
import defaultNotificationService from "../services/notification.service.js";
import {
  formatDateDisplay,
  formatDateOnly,
  formatTimeOnly,
} from "../utils/datetime.js";

const HOUR_MS = 60 * 60 * 1000;

function appointmentTimestamp(appointment) {
  const date = formatDateOnly(appointment.schedules?.work_date);
  const time = formatTimeOnly(appointment.schedules?.start_time);
  if (!date || !time) return NaN;
  return new Date(`${date}T${time}:00+07:00`).getTime();
}

export async function sendAppointmentReminders({
  now = new Date(),
  repository = defaultAppointmentRepository,
  notifications = defaultNotificationService,
} = {}) {
  const fromDate = new Date(now);
  fromDate.setUTCHours(0, 0, 0, 0);
  const toDate = new Date(fromDate.getTime() + 2 * 24 * HOUR_MS);
  const appointments = await repository.findUpcomingForReminders(
    fromDate,
    toDate,
  );

  let sent = 0;
  for (const appointment of appointments) {
    const remaining = appointmentTimestamp(appointment) - now.getTime();
    if (remaining <= 0 || remaining > 24 * HOUR_MS) continue;

    const accountId = appointment.patient_profiles?.account_id;
    if (!accountId) continue;

    const isOneHour = remaining <= HOUR_MS;
    const typePrefix = isOneHour
      ? "APPOINTMENT_REMINDER_1H"
      : "APPOINTMENT_REMINDER_24H";
    const date = formatDateOnly(appointment.schedules?.work_date);
    const time = formatTimeOnly(appointment.schedules?.start_time);
    const type = `${typePrefix}_${date.replaceAll("-", "")}_${time.replace(":", "")}`;
    const bookingCode = appointment.booking_code || `#${appointment.id}`;

    const before = await notifications.notifyOnce(accountId, {
      title: isOneHour
        ? "Lịch khám sẽ bắt đầu sau 1 giờ"
        : "Nhắc lịch khám trong 24 giờ tới",
      content: `Lịch ${bookingCode} vào ${formatDateDisplay(date)} lúc ${time}. Vui lòng đến sớm 15 phút.`,
      link: `/patient/appointments/${appointment.id}`,
      type,
    });
    if (before) sent += 1;
  }

  return sent;
}

export function startAppointmentReminderJob({
  intervalMs = 60_000,
  repository = defaultAppointmentRepository,
  notifications = defaultNotificationService,
} = {}) {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await sendAppointmentReminders({ repository, notifications });
    } catch (error) {
      console.error("[AppointmentReminderJob] Không thể gửi nhắc lịch:", error);
    } finally {
      running = false;
    }
  };

  void run();
  const timer = setInterval(() => void run(), intervalMs);
  timer.unref?.();
  return { run, stop: () => clearInterval(timer) };
}
