import test from "node:test";
import assert from "node:assert/strict";
import { sendAppointmentReminders } from "../src/jobs/appointment-reminder.job.js";
import {
  publishNotification,
  subscribeToNotifications,
} from "../src/realtime/notification-stream.js";

function time(value) {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

test("SSE stream publishes a newly created notification to the correct user", () => {
  const chunks = [];
  const response = { write: (chunk) => chunks.push(chunk) };
  const unsubscribe = subscribeToNotifications(10, response);

  publishNotification(11, { id: 1, title: "Không thuộc user 10" });
  publishNotification(10, { id: 2, title: "Thông báo realtime" });
  unsubscribe();
  publishNotification(10, { id: 3, title: "Đã ngắt kết nối" });

  const output = chunks.join("");
  assert.match(output, /event: connected/);
  assert.match(output, /Thông báo realtime/);
  assert.doesNotMatch(output, /Không thuộc user 10|Đã ngắt kết nối/);
});

test("appointment reminders send distinct 24-hour and 1-hour notifications", async () => {
  const appointments = [
    {
      id: 101,
      booking_code: "BK24H",
      status: "CONFIRMED",
      patient_profiles: { account_id: 7 },
      schedules: {
        work_date: new Date("2026-10-06T00:00:00.000Z"),
        start_time: time("09:00"),
      },
    },
    {
      id: 102,
      booking_code: "BK1H",
      status: "CONFIRMED",
      patient_profiles: { account_id: 7 },
      schedules: {
        work_date: new Date("2026-10-05T00:00:00.000Z"),
        start_time: time("10:00"),
      },
    },
  ];
  const sent = [];
  const repository = {
    findUpcomingForReminders: async () => appointments,
  };
  const notifications = {
    notifyOnce: async (userId, payload) => {
      sent.push({ userId, ...payload });
      return payload;
    },
  };

  await sendAppointmentReminders({
    now: new Date("2026-10-05T02:00:00.000Z"),
    repository,
    notifications,
  });

  assert.equal(sent.length, 2);
  assert.match(sent[0].type, /^APPOINTMENT_REMINDER_24H_/);
  assert.match(sent[1].type, /^APPOINTMENT_REMINDER_1H_/);
  assert.equal(sent[0].link, "/patient/appointments/101");
  assert.equal(sent[1].link, "/patient/appointments/102");
});

test("rescheduled appointment gets a new reminder deduplication key", async () => {
  const sent = [];
  const appointment = {
    id: 103,
    booking_code: "BKMOVED",
    status: "CONFIRMED",
    patient_profiles: { account_id: 8 },
    schedules: {
      work_date: new Date("2026-10-06T00:00:00.000Z"),
      start_time: time("08:00"),
    },
  };
  const repository = { findUpcomingForReminders: async () => [appointment] };
  const notifications = {
    notifyOnce: async (_userId, payload) => {
      sent.push(payload.type);
      return payload;
    },
  };

  await sendAppointmentReminders({
    now: new Date("2026-10-05T01:00:00.000Z"),
    repository,
    notifications,
  });
  appointment.schedules.start_time = time("09:00");
  await sendAppointmentReminders({
    now: new Date("2026-10-05T02:00:00.000Z"),
    repository,
    notifications,
  });

  assert.equal(sent.length, 2);
  assert.notEqual(sent[0], sent[1]);
});
