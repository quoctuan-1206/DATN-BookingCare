import test from "node:test";
import assert from "node:assert/strict";
import { renderAppointmentReminder, resetProcessDedupe, sendAppointmentReminder } from "./email.service.js";

const appointmentBase = {
  id: 42,
  booking_code: "BK0042",
  patient_profiles: { full_name: "Nguyễn Văn A" },
  schedules: {
    work_date: "2026-11-20T00:00:00.000Z",
    start_time: "1970-01-01T09:30:00.000Z",
    doctor_workplaces: {
      room: "P201",
      specialties: { name: "Tim mạch" },
      clinics: { name: "Phòng khám BookingCare", address: "12 Lê Lợi, Q.1" },
      doctor_profiles: { users: { first_name: "Bình", last_name: "Trần" } },
    },
  },
};

test("reminder includes booking details and app link", () => {
  const { subject, text, html } = renderAppointmentReminder(appointmentBase, {
    frontendUrl: "http://localhost:5173",
  });
  assert.equal(subject, "[BookingCare] Nhắc lịch khám 20/11/2026 lúc 09:30");
  for (const value of ["BK0042", "Nguyễn Văn A", "20/11/2026", "09:30", "Trần Bình", "Tim mạch", "Phòng khám BookingCare", "12 Lê Lợi, Q.1", "P201", "http://localhost:5173/patient/appointments/42"]) {
    assert.ok(text.includes(value), `text thiếu: ${value}`);
    assert.ok(html.includes(value), `html thiếu: ${value}`);
  }
});

test("reminder normalizes FRONTEND_URL to a single origin", () => {
  const original = process.env.FRONTEND_URL;
  try {
    process.env.FRONTEND_URL = "https://a.example, https://b.example/";
    const { text, html } = renderAppointmentReminder(appointmentBase);
    for (const body of [text, html]) {
      assert.ok(body.includes("https://a.example/patient/appointments/42"), "link chưa chuẩn hoá");
      assert.ok(!body.includes("b.example"), "link còn origin thứ hai");
      assert.ok(!body.includes("a.example,"), "link còn dấu phẩy");
      assert.ok(!body.includes("//patient/appointments/42"), "link bị nhân đôi dấu gạch chéo");
    }

    const withSlash = renderAppointmentReminder(appointmentBase, { frontendUrl: "https://c.example/" });
    assert.ok(withSlash.text.includes("https://c.example/patient/appointments/42"));
    assert.ok(!withSlash.text.includes("c.example//patient"));
  } finally {
    if (original === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = original;
  }
});

test("reminder omits missing fields instead of printing null", () => {
  const sparse = {
    id: 7,
    booking_code: "BK0007",
    patient_profiles: { full_name: "Lê C" },
    schedules: { work_date: "2026-11-21T00:00:00.000Z", start_time: "1970-01-01T08:00:00.000Z", doctor_workplaces: {} },
  };
  const { text } = renderAppointmentReminder(sparse, { frontendUrl: "http://localhost:5173" });
  assert.ok(!text.includes("null"));
  assert.ok(!text.includes("undefined"));
  assert.ok(text.includes("BK0007"));
});

function fixture(email) {
  const appointment = structuredClone(appointmentBase);
  appointment.patient_profiles.users = email ? { email } : null;
  return appointment;
}

function memoryRepository() {
  const rows = new Map();
  const k = (id, key) => `${id}:${key}`;
  return {
    rows,
    async findByKey(id, key) { return rows.get(k(id, key)) || null; },
    async markSent({ appointmentId, reminderKey }) {
      const row = { status: "SENT", attempts: (rows.get(k(appointmentId, reminderKey))?.attempts || 0) + 1 };
      rows.set(k(appointmentId, reminderKey), row);
      return row;
    },
    async recordFailure({ appointmentId, reminderKey }) {
      const row = { status: "FAILED", attempts: (rows.get(k(appointmentId, reminderKey))?.attempts || 0) + 1 };
      rows.set(k(appointmentId, reminderKey), row);
      return row;
    },
  };
}

function memoryTransport(error = null) {
  const messages = [];
  return {
    messages,
    async sendMail(message) {
      if (error) throw error;
      messages.push(message);
      return { messageId: "test" };
    },
  };
}

test("sends once then skips the same reminder key", async () => {
  resetProcessDedupe();
  const repository = memoryRepository();
  const transport = memoryTransport();
  const appointment = fixture("benhnhan@example.com");
  const first = await sendAppointmentReminder(appointment, { reminderKey: "K1", repository, transport });
  const second = await sendAppointmentReminder(appointment, { reminderKey: "K1", repository, transport });
  assert.equal(first, "SENT");
  assert.equal(second, "SKIPPED");
  assert.equal(transport.messages.length, 1);
  assert.equal(transport.messages[0].to, "benhnhan@example.com");
});

test("skips when the patient has no email address", async () => {
  resetProcessDedupe();
  const transport = memoryTransport();
  const result = await sendAppointmentReminder(fixture(null), { reminderKey: "K1", repository: memoryRepository(), transport });
  assert.equal(result, "SKIPPED");
  assert.equal(transport.messages.length, 0);
});

test("returns DISABLED when SMTP is not configured", async () => {
  resetProcessDedupe();
  const result = await sendAppointmentReminder(fixture("a@example.com"), { reminderKey: "K1", repository: memoryRepository(), transport: null });
  assert.equal(result, "DISABLED");
});

test("stops after three failed attempts and never throws", async () => {
  resetProcessDedupe();
  const repository = memoryRepository();
  const transport = memoryTransport(new Error("SMTP 535 auth failed"));
  const appointment = fixture("a@example.com");
  const originalError = console.error;
  console.error = () => {};
  try {
    for (let i = 0; i < 5; i += 1) {
      await assert.doesNotReject(() => sendAppointmentReminder(appointment, { reminderKey: "K1", repository, transport }));
    }
  } finally {
    console.error = originalError;
  }
  assert.equal(repository.rows.get(`${appointment.id}:K1`).attempts, 3);
  assert.equal(repository.rows.get(`${appointment.id}:K1`).status, "FAILED");
});

test("returns FAILED instead of rejecting when the failure record cannot be saved", async () => {
  resetProcessDedupe();
  const repository = memoryRepository();
  repository.recordFailure = async () => { throw new Error("DB không phản hồi"); };
  const transport = memoryTransport(new Error("SMTP 535 auth failed"));
  const logged = [];
  const originalError = console.error;
  console.error = (...args) => logged.push(args.join(" "));
  let result;
  try {
    await assert.doesNotReject(async () => {
      result = await sendAppointmentReminder(fixture("a@example.com"), { reminderKey: "K1", repository, transport });
    });
  } finally {
    console.error = originalError;
  }
  assert.equal(result, "FAILED");
  assert.equal(logged.length, 2);
  for (const line of logged) assert.ok(line.startsWith("[email]"), `log thiếu tiền tố: ${line}`);
});

test("skips without sending when the dedupe read fails", async () => {
  resetProcessDedupe();
  const repository = memoryRepository();
  repository.findByKey = async () => { throw new Error("DB không phản hồi"); };
  const transport = memoryTransport();
  const logged = [];
  const originalError = console.error;
  console.error = (...args) => logged.push(args.join(" "));
  let result;
  try {
    await assert.doesNotReject(async () => {
      result = await sendAppointmentReminder(fixture("a@example.com"), { reminderKey: "K1", repository, transport });
    });
  } finally {
    console.error = originalError;
  }
  assert.equal(result, "SKIPPED");
  assert.equal(transport.messages.length, 0);
  assert.equal(logged.length, 1);
  assert.ok(logged[0].startsWith("[email]"), `log thiếu tiền tố: ${logged[0]}`);
});

test("treats a landed SENT row as sent when the status write fails", async () => {
  resetProcessDedupe();
  const repository = memoryRepository();
  let reads = 0;
  repository.findByKey = async () => {
    reads += 1;
    return reads === 1 ? null : { status: "SENT", attempts: 1 };
  };
  repository.markSent = async () => { throw new Error("DB không phản hồi"); };
  const transport = memoryTransport();
  const logged = [];
  const originalError = console.error;
  console.error = (...args) => logged.push(args.join(" "));
  let result;
  try {
    result = await sendAppointmentReminder(fixture("a@example.com"), { reminderKey: "K1", repository, transport });
  } finally {
    console.error = originalError;
  }
  assert.equal(result, "SENT");
  assert.equal(transport.messages.length, 1);
  for (const line of logged) assert.ok(line.startsWith("[email]"), `log thiếu tiền tố: ${line}`);
});

test("does not resend when the status write fails and nothing was recorded", async () => {
  resetProcessDedupe();
  const repository = memoryRepository();
  repository.markSent = async () => { throw new Error("DB không phản hồi"); };
  const transport = memoryTransport();
  const appointment = fixture("a@example.com");
  const logged = [];
  const originalError = console.error;
  console.error = (...args) => logged.push(args.join(" "));
  let first;
  let second;
  try {
    first = await sendAppointmentReminder(appointment, { reminderKey: "K1", repository, transport });
    second = await sendAppointmentReminder(appointment, { reminderKey: "K1", repository, transport });
  } finally {
    console.error = originalError;
  }
  assert.equal(first, "FAILED");
  assert.equal(second, "SKIPPED");
  assert.equal(transport.messages.length, 1);
  for (const line of logged) assert.ok(line.startsWith("[email]"), `log thiếu tiền tố: ${line}`);
});
