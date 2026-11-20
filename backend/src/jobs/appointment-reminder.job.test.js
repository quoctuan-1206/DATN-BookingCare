import test from "node:test";
import assert from "node:assert/strict";
import { sendAppointmentReminders } from "./appointment-reminder.job.js";

function appointment({ id = 1, date = "2026-11-20", time = "1970-01-01T09:30:00.000Z", status = "CONFIRMED" } = {}) {
  return {
    id,
    status,
    booking_code: `BK${id}`,
    patient_profiles: { account_id: 5, full_name: "Nguyễn Văn A", users: { email: "a@example.com" } },
    schedules: {
      work_date: `${date}T00:00:00.000Z`,
      start_time: time,
      doctor_workplaces: { doctor_id: 9, clinics: { name: "PK" }, specialties: { name: "Tim" } },
    },
  };
}

function repositoryWith(rows) {
  return { async findUpcomingForReminders() { return rows; } };
}

const notifications = { async notifyOnce() { return {}; } };

test("sends the 24h email once and skips the 1h milestone", async () => {
  const calls = [];
  const emails = { async sendAppointmentReminder(_appointment, options) { calls.push(options.reminderKey); return "SENT"; } };
  const now = new Date("2026-11-19T13:30:00Z");
  await sendAppointmentReminders({ now, repository: repositoryWith([appointment()]), notifications, emails });
  assert.deepEqual(calls, ["APPOINTMENT_REMINDER_24H_20261120_0930"]);
});

test("an appointment less than one hour away gets no email", async () => {
  const calls = [];
  const emails = { async sendAppointmentReminder(_appointment, options) { calls.push(options.reminderKey); return "SENT"; } };
  const now = new Date("2026-11-20T02:00:00Z");
  await sendAppointmentReminders({ now, repository: repositoryWith([appointment()]), notifications, emails });
  assert.deepEqual(calls, []);
});

test("cancelled appointments are not emailed", async () => {
  const calls = [];
  const emails = { async sendAppointmentReminder(_appointment, options) { calls.push(options.reminderKey); return "SENT"; } };
  const now = new Date("2026-11-19T13:30:00Z");
  await sendAppointmentReminders({ now, repository: repositoryWith([appointment({ status: "CANCELLED" })]), notifications, emails });
  assert.deepEqual(calls, []);
});

test("one failing email does not stop the next appointment", async () => {
  const sent = [];
  const emails = {
    async sendAppointmentReminder(item) {
      if (item.id === 1) throw new Error("SMTP down");
      sent.push(item.id);
      return "SENT";
    },
  };
  const now = new Date("2026-11-19T13:30:00Z");
  const originalError = console.error;
  console.error = () => {};
  try {
    await assert.doesNotReject(() =>
      sendAppointmentReminders({
        now,
        repository: repositoryWith([appointment({ id: 1 }), appointment({ id: 2 })]),
        notifications,
        emails,
      }),
    );
  } finally {
    console.error = originalError;
  }
  assert.deepEqual(sent, [2]);
});
