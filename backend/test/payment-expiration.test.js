import test from "node:test";
import assert from "node:assert/strict";
import { PaymentRepository } from "../src/repositories/payment.repository.js";
import { startPaymentExpirationJob } from "../src/jobs/payment-expiration.job.js";

function createMockPrisma({
  invoices = [],
  appointments = [],
  schedules = [],
} = {}) {
  const db = {
    invoices: [...invoices],
    appointments: [...appointments],
    schedules: [...schedules],
  };

  const client = {
    invoices: {
      async findFirst({ where }) {
        return db.invoices.find((inv) => {
          if (where.id && inv.id !== where.id) return false;
          if (where.vnp_txn_ref && inv.vnp_txn_ref !== where.vnp_txn_ref) return false;
          if (where.invoice_type && inv.invoice_type !== where.invoice_type) return false;
          return true;
        }) || null;
      },
      async findMany({ where }) {
        return db.invoices.filter((inv) => {
          if (where.invoice_type && inv.invoice_type !== where.invoice_type) return false;
          if (where.payment_status && inv.payment_status !== where.payment_status) return false;
          if (where.payment_expires_at?.lte && inv.payment_expires_at > where.payment_expires_at.lte) return false;
          if (where.appointments?.status) {
            const appt = db.appointments.find((a) => a.id === inv.appointment_id);
            if (!appt || appt.status !== where.appointments.status) return false;
          }
          return true;
        }).map((inv) => {
          const appt = db.appointments.find((a) => a.id === inv.appointment_id);
          return {
            ...inv,
            appointments: appt ? { ...appt } : null,
          };
        });
      },
      async update({ where, data }) {
        const inv = db.invoices.find((i) => i.id === where.id);
        if (!inv) throw new Error("Invoice not found");
        Object.assign(inv, data);
        return { ...inv };
      },
      async updateMany({ where, data }) {
        let count = 0;
        for (const inv of db.invoices) {
          if (where.id && inv.id !== where.id) continue;
          if (where.payment_status && inv.payment_status !== where.payment_status) continue;
          Object.assign(inv, data);
          count++;
        }
        return { count };
      },
    },
    appointments: {
      async findFirst({ where }) {
        return db.appointments.find((a) => a.id === where.id) || null;
      },
      async updateMany({ where, data }) {
        let count = 0;
        for (const appt of db.appointments) {
          if (where.id && appt.id !== where.id) continue;
          if (where.status && appt.status !== where.status) continue;
          Object.assign(appt, data);
          count++;
        }
        return { count };
      },
    },
    schedules: {
      async findFirst({ where }) {
        return db.schedules.find((s) => s.id === where.id) || null;
      },
      async updateMany({ where, data }) {
        let count = 0;
        for (const s of db.schedules) {
          if (where.id && s.id !== where.id) continue;
          if (where.booked_patients?.gt !== undefined && (s.booked_patients || 0) <= where.booked_patients.gt) continue;
          if (data.booked_patients?.decrement) {
            s.booked_patients = (s.booked_patients || 0) - data.booked_patients.decrement;
          }
          if (data.updated_at) s.updated_at = data.updated_at;
          count++;
        }
        return { count };
      },
    },
    async $transaction(callback) {
      return callback(client);
    },
    db,
  };

  return { client, db };
}

test("expireUnpaidClinicInvoices cancels expired pending appointment and decrements slot once", async () => {
  const expiredNow = new Date("2026-09-25T03:15:00.000Z");
  const { client, db } = createMockPrisma({
    invoices: [
      {
        id: 1,
        appointment_id: 10,
        invoice_type: "CLINIC_FEE",
        amount: "150000.00",
        payment_status: "UNPAID",
        payment_expires_at: new Date("2026-09-25T03:10:00.000Z"),
      },
    ],
    appointments: [
      {
        id: 10,
        schedule_id: 100,
        status: "PENDING",
      },
    ],
    schedules: [
      {
        id: 100,
        booked_patients: 1,
      },
    ],
  });

  const repo = new PaymentRepository(client);
  const changed = await repo.expireUnpaidClinicInvoices(expiredNow);

  assert.equal(changed, 1);
  assert.equal(db.appointments[0].status, "CANCELLED");
  assert.equal(db.schedules[0].booked_patients, 0);

  // Repeat sweep immediately is idempotent and does not decrement below 0
  const repeatChanged = await repo.expireUnpaidClinicInvoices(expiredNow);
  assert.equal(repeatChanged, 0);
  assert.equal(db.schedules[0].booked_patients, 0);
});

test("expireUnpaidClinicInvoices leaves paid and unexpired appointments untouched", async () => {
  const checkTime = new Date("2026-09-25T03:05:00.000Z");
  const { client, db } = createMockPrisma({
    invoices: [
      {
        id: 1,
        appointment_id: 10,
        invoice_type: "CLINIC_FEE",
        amount: "150000.00",
        payment_status: "PAID",
        payment_expires_at: new Date("2026-09-25T03:00:00.000Z"),
      },
      {
        id: 2,
        appointment_id: 20,
        invoice_type: "CLINIC_FEE",
        amount: "200000.00",
        payment_status: "UNPAID",
        payment_expires_at: new Date("2026-09-25T03:10:00.000Z"),
      },
    ],
    appointments: [
      { id: 10, schedule_id: 100, status: "CONFIRMED" },
      { id: 20, schedule_id: 200, status: "PENDING" },
    ],
    schedules: [
      { id: 100, booked_patients: 1 },
      { id: 200, booked_patients: 1 },
    ],
  });

  const repo = new PaymentRepository(client);
  const changed = await repo.expireUnpaidClinicInvoices(checkTime);

  assert.equal(changed, 0);
  assert.equal(db.appointments[0].status, "CONFIRMED");
  assert.equal(db.appointments[1].status, "PENDING");
  assert.equal(db.schedules[0].booked_patients, 1);
  assert.equal(db.schedules[1].booked_patients, 1);
});

test("markPaidFromIpn marks unpaid invoice paid on valid amount and reference", async () => {
  const now = new Date("2026-09-25T03:05:00.000Z");
  const { client, db } = createMockPrisma({
    invoices: [
      {
        id: 1,
        appointment_id: 10,
        invoice_type: "CLINIC_FEE",
        amount: "150000.00",
        payment_status: "UNPAID",
        payment_expires_at: new Date("2026-09-25T03:10:00.000Z"),
        vnp_txn_ref: "INV120260925030000ABCDEF",
      },
    ],
    appointments: [
      { id: 10, schedule_id: 100, status: "PENDING" },
    ],
  });

  const repo = new PaymentRepository(client);
  const result = await repo.markPaidFromIpn({
    txnRef: "INV120260925030000ABCDEF",
    amount: "15000000",
    transactionNo: "14892019",
    paidAt: now,
    now,
  });

  assert.equal(result.success, true);
  assert.equal(result.code, "SUCCESS");
  assert.equal(db.invoices[0].payment_status, "PAID");
  assert.equal(db.invoices[0].payment_method, "VNPAY");
  assert.equal(db.invoices[0].transaction_id, "14892019");
});

test("markPaidFromIpn rejects incorrect amount with INVALID_AMOUNT", async () => {
  const { client, db } = createMockPrisma({
    invoices: [
      {
        id: 1,
        appointment_id: 10,
        invoice_type: "CLINIC_FEE",
        amount: "150000.00",
        payment_status: "UNPAID",
        payment_expires_at: new Date("2026-09-25T03:10:00.000Z"),
        vnp_txn_ref: "INV120260925030000ABCDEF",
      },
    ],
    appointments: [{ id: 10, status: "PENDING" }],
  });

  const repo = new PaymentRepository(client);
  const result = await repo.markPaidFromIpn({
    txnRef: "INV120260925030000ABCDEF",
    amount: "99900",
    transactionNo: "14892019",
  });

  assert.equal(result.success, false);
  assert.equal(result.code, "INVALID_AMOUNT");
  assert.equal(db.invoices[0].payment_status, "UNPAID");
});

test("markPaidFromIpn returns ALREADY_PAID idempotently when already paid", async () => {
  const { client, db } = createMockPrisma({
    invoices: [
      {
        id: 1,
        appointment_id: 10,
        invoice_type: "CLINIC_FEE",
        amount: "150000.00",
        payment_status: "PAID",
        payment_expires_at: new Date("2026-09-25T03:10:00.000Z"),
        vnp_txn_ref: "INV120260925030000ABCDEF",
        transaction_id: "14892019",
      },
    ],
    appointments: [{ id: 10, status: "PENDING" }],
  });

  const repo = new PaymentRepository(client);
  const result = await repo.markPaidFromIpn({
    txnRef: "INV120260925030000ABCDEF",
    amount: "15000000",
    transactionNo: "14892019",
  });

  assert.equal(result.success, true);
  assert.equal(result.code, "ALREADY_PAID");
  assert.equal(db.invoices[0].payment_status, "PAID");
});

test("markPaidFromIpn rejects expired invoice with EXPIRED", async () => {
  const pastTime = new Date("2026-09-25T03:15:00.000Z");
  const { client, db } = createMockPrisma({
    invoices: [
      {
        id: 1,
        appointment_id: 10,
        invoice_type: "CLINIC_FEE",
        amount: "150000.00",
        payment_status: "UNPAID",
        payment_expires_at: new Date("2026-09-25T03:10:00.000Z"),
        vnp_txn_ref: "INV120260925030000ABCDEF",
      },
    ],
    appointments: [{ id: 10, status: "PENDING" }],
  });

  const repo = new PaymentRepository(client);
  const result = await repo.markPaidFromIpn({
    txnRef: "INV120260925030000ABCDEF",
    amount: "15000000",
    transactionNo: "14892019",
    now: pastTime,
  });

  assert.equal(result.success, false);
  assert.equal(result.code, "EXPIRED");
  assert.equal(db.invoices[0].payment_status, "UNPAID");
});

test("startPaymentExpirationJob executes sweep immediately and cancels on stop", async () => {
  let sweepCount = 0;
  const mockRepo = {
    async expireUnpaidClinicInvoices() {
      sweepCount++;
      return 0;
    },
  };

  const job = startPaymentExpirationJob({
    intervalMs: 100_000,
    repository: mockRepo,
  });

  assert.ok(job);
  assert.equal(typeof job.stop, "function");
  assert.equal(sweepCount, 1);

  job.stop();
});

test("findClinicInvoiceById returns clinic fee invoice and ignores non-clinic fee", async () => {
  const { client } = createMockPrisma({
    invoices: [
      { id: 1, invoice_type: "CLINIC_FEE", amount: "150000.00" },
      { id: 2, invoice_type: "MEDICINE_FEE", amount: "250000.00" },
    ],
  });

  const repo = new PaymentRepository(client);
  const clinic = await repo.findClinicInvoiceById(1);
  assert.ok(clinic);
  assert.equal(clinic.id, 1);

  const medicine = await repo.findClinicInvoiceById(2);
  assert.equal(medicine, null);
});

test("setInvoiceTxnRef updates vnp_txn_ref on the invoice", async () => {
  const { client, db } = createMockPrisma({
    invoices: [{ id: 1, invoice_type: "CLINIC_FEE", vnp_txn_ref: null }],
  });

  const repo = new PaymentRepository(client);
  await repo.setInvoiceTxnRef(1, "INV120260925NEW");
  assert.equal(db.invoices[0].vnp_txn_ref, "INV120260925NEW");
});

