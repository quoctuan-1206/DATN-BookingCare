import test from "node:test";
import assert from "node:assert/strict";
import { AppointmentRepository } from "../src/repositories/appointment.repository.js";
import appointmentService from "../src/services/appointment.service.js";

function createMockPrisma({
  schedule = {
    id: 1,
    max_patients: 10,
    booked_patients: 2,
    doctor_workplaces: {
      consultation_fee: 150000,
      doctor_profiles: { consultation_fee: 120000 },
    },
  },
  duplicate = null,
} = {}) {
  const state = {
    createdInvoices: [],
    createdAppointments: [],
    updatedSchedules: [],
  };

  const tx = {
    schedules: {
      async findFirst({ where }) {
        if (where.id === schedule?.id) {
          return schedule;
        }
        return null;
      },
      async update({ where, data }) {
        state.updatedSchedules.push({ where, data });
        return { ...schedule, ...data };
      },
    },
    appointments: {
      async findFirst({ where }) {
        if (where.schedule_id && where.patient_profile_id && duplicate) {
          return duplicate;
        }
        if (where.id) {
          const appt = state.createdAppointments.find((a) => a.id === where.id);
          if (!appt) return null;
          return {
            ...appt,
            schedules: schedule,
            invoices: state.createdInvoices.filter((i) => i.appointment_id === appt.id),
          };
        }
        return null;
      },
      async create({ data }) {
        const record = {
          id: 42,
          ...data,
          created_at: new Date(),
          updated_at: new Date(),
        };
        state.createdAppointments.push(record);
        return record;
      },
    },
    invoices: {
      async create({ data }) {
        const record = {
          id: 101,
          ...data,
          created_at: new Date(),
          updated_at: new Date(),
        };
        state.createdInvoices.push(record);
        return record;
      },
    },
  };

  const mockPrisma = {
    async $transaction(callback) {
      return callback(tx);
    },
    state,
  };

  return { mockPrisma, state };
}

test("createWithBooking creates one unpaid clinic invoice expiring in ten minutes", async () => {
  const { mockPrisma, state } = createMockPrisma();
  const repo = new AppointmentRepository(mockPrisma);
  const fixedNow = new Date("2026-09-25T03:00:00.000Z");

  const input = {
    schedule_id: 1,
    patient_profile_id: 5,
    reason: "Kham tong quat",
    booking_code: "BK202609250001",
  };

  const result = await repo.createWithBooking(input, fixedNow);

  assert.ok(result);
  assert.equal(state.createdInvoices.length, 1);
  const invoice = state.createdInvoices[0];
  assert.equal(invoice.appointment_id, 42);
  assert.equal(invoice.invoice_type, "CLINIC_FEE");
  assert.equal(invoice.payment_status, "UNPAID");
  assert.equal(invoice.payment_method, "VNPAY");
  assert.equal(Number(invoice.amount), 150000);
  assert.equal(
    invoice.payment_expires_at.toISOString(),
    "2026-09-25T03:10:00.000Z",
  );

  // Check schedule incremented
  assert.equal(state.updatedSchedules.length, 1);
  assert.equal(state.updatedSchedules[0].data.booked_patients, 3);

  // Result includes invoices
  assert.equal(result.invoices.length, 1);
  assert.equal(result.invoices[0].invoice_type, "CLINIC_FEE");
});

test("createWithBooking falls back to doctor_profiles consultation fee when workplace fee is null", async () => {
  const { mockPrisma, state } = createMockPrisma({
    schedule: {
      id: 2,
      max_patients: 10,
      booked_patients: 0,
      doctor_workplaces: {
        consultation_fee: null,
        doctor_profiles: { consultation_fee: 180000 },
      },
    },
  });
  const repo = new AppointmentRepository(mockPrisma);
  const fixedNow = new Date("2026-09-25T03:00:00.000Z");

  await repo.createWithBooking({ schedule_id: 2, patient_profile_id: 10 }, fixedNow);

  assert.equal(state.createdInvoices.length, 1);
  assert.equal(Number(state.createdInvoices[0].amount), 180000);
});

test("createWithBooking rejects when schedule is fully booked and creates no invoice", async () => {
  const { mockPrisma, state } = createMockPrisma({
    schedule: {
      id: 1,
      max_patients: 5,
      booked_patients: 5,
      doctor_workplaces: { consultation_fee: 100000 },
    },
  });
  const repo = new AppointmentRepository(mockPrisma);

  await assert.rejects(
    () => repo.createWithBooking({ schedule_id: 1, patient_profile_id: 5 }),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /Khung giờ đã hết chỗ/);
      return true;
    },
  );

  assert.equal(state.createdInvoices.length, 0);
  assert.equal(state.createdAppointments.length, 0);
  assert.equal(state.updatedSchedules.length, 0);
});

test("createWithBooking rejects when duplicate booking exists and creates no invoice", async () => {
  const { mockPrisma, state } = createMockPrisma({
    duplicate: { id: 99, status: "PENDING" },
  });
  const repo = new AppointmentRepository(mockPrisma);

  await assert.rejects(
    () => repo.createWithBooking({ schedule_id: 1, patient_profile_id: 5 }),
    (err) => {
      assert.equal(err.statusCode, 409);
      assert.match(err.message, /Hồ sơ này đã đặt khung giờ này rồi/);
      return true;
    },
  );

  assert.equal(state.createdInvoices.length, 0);
  assert.equal(state.createdAppointments.length, 0);
});

test("formatAppointment extracts clinic_fee_invoice metadata and ignores non-clinic invoices", () => {
  const expiresAt = new Date("2026-09-25T03:10:00.000Z");
  const appointmentWithInvoices = {
    id: 10,
    booking_code: "BK12345",
    status: "PENDING",
    schedules: {
      work_date: new Date("2026-09-26T00:00:00.000Z"),
      start_time: new Date("1970-01-01T08:00:00.000Z"),
      end_time: new Date("1970-01-01T08:30:00.000Z"),
    },
    invoices: [
      {
        id: 99,
        invoice_type: "MEDICINE_FEE",
        amount: "500000.00",
        payment_status: "UNPAID",
        payment_expires_at: null,
      },
      {
        id: 101,
        invoice_type: "CLINIC_FEE",
        amount: "150000.00",
        payment_status: "UNPAID",
        payment_expires_at: expiresAt,
        vnp_txn_ref: "INV10120260925",
      },
    ],
  };

  const formatted = appointmentService.formatAppointment(appointmentWithInvoices);

  assert.deepEqual(formatted.clinic_fee_invoice, {
    id: 101,
    amount: 150000,
    payment_status: "UNPAID",
    payment_expires_at: expiresAt,
    vnp_txn_ref: "INV10120260925",
  });
});

test("formatAppointment returns clinic_fee_invoice as null when no clinic invoice exists", () => {
  const appointmentWithoutInvoice = {
    id: 11,
    booking_code: "BK67890",
    status: "PENDING",
    schedules: {
      work_date: new Date("2026-09-26T00:00:00.000Z"),
    },
    invoices: [],
  };

  const formatted = appointmentService.formatAppointment(appointmentWithoutInvoice);
  assert.equal(formatted.clinic_fee_invoice, null);
});

test("notifyAppointmentCreated informs patient about 10-minute clinic fee payment when unpaid", async () => {
  const sentNotifications = [];
  const originalNotify = (await import("../src/services/notification.service.js")).default.notify;
  const originalNotifyMany = (await import("../src/services/notification.service.js")).default.notifyMany;
  const originalFindIds = (await import("../src/repositories/user.repository.js")).default.findIdsByRole;

  const notificationService = (await import("../src/services/notification.service.js")).default;
  const userRepository = (await import("../src/repositories/user.repository.js")).default;

  notificationService.notify = async (userId, payload) => {
    sentNotifications.push({ userId, payload });
  };
  notificationService.notifyMany = async () => {};
  userRepository.findIdsByRole = async () => [];

  try {
    const appointment = {
      id: 55,
      booking_code: "BK555",
      schedules: {
        work_date: new Date("2026-09-26T00:00:00.000Z"),
        start_time: new Date("1970-01-01T08:00:00.000Z"),
        end_time: new Date("1970-01-01T08:30:00.000Z"),
      },
      patient_profiles: {
        account_id: 12,
        full_name: "Nguyen Van A",
      },
      invoices: [
        {
          id: 1,
          invoice_type: "CLINIC_FEE",
          payment_status: "UNPAID",
          amount: 100000,
        },
      ],
    };

    await appointmentService.notifyAppointmentCreated(appointment);

    const patientNotif = sentNotifications.find((n) => n.userId === 12);
    assert.ok(patientNotif);
    assert.match(
      patientNotif.payload.content,
      /Vui lòng hoàn tất thanh toán phí khám trong vòng 10 phút/,
    );
  } finally {
    notificationService.notify = originalNotify;
    notificationService.notifyMany = originalNotifyMany;
    userRepository.findIdsByRole = originalFindIds;
  }
});

test("notifyAppointmentCreated uses default message when no unpaid clinic fee is present", async () => {
  const sentNotifications = [];
  const notificationService = (await import("../src/services/notification.service.js")).default;
  const userRepository = (await import("../src/repositories/user.repository.js")).default;
  const originalNotify = notificationService.notify;
  const originalNotifyMany = notificationService.notifyMany;
  const originalFindIds = userRepository.findIdsByRole;

  notificationService.notify = async (userId, payload) => {
    sentNotifications.push({ userId, payload });
  };
  notificationService.notifyMany = async () => {};
  userRepository.findIdsByRole = async () => [];

  try {
    const appointment = {
      id: 56,
      booking_code: "BK556",
      schedules: {
        work_date: new Date("2026-09-26T00:00:00.000Z"),
        start_time: new Date("1970-01-01T08:00:00.000Z"),
        end_time: new Date("1970-01-01T08:30:00.000Z"),
      },
      patient_profiles: {
        account_id: 12,
        full_name: "Nguyen Van A",
      },
      invoices: [
        {
          id: 1,
          invoice_type: "CLINIC_FEE",
          payment_status: "PAID",
          amount: 100000,
        },
      ],
    };

    await appointmentService.notifyAppointmentCreated(appointment);

    const patientNotif = sentNotifications.find((n) => n.userId === 12);
    assert.ok(patientNotif);
    assert.match(patientNotif.payload.content, /Vui lòng chờ xác nhận/);
  } finally {
    notificationService.notify = originalNotify;
    notificationService.notifyMany = originalNotifyMany;
    userRepository.findIdsByRole = originalFindIds;
  }
});

