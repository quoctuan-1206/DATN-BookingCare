import test from "node:test";
import assert from "node:assert/strict";
import {
  computeRemainingSeconds,
  formatCountdown,
  canRetryPayment,
  getPaymentBadge,
} from "./payment.js";

test("computeRemainingSeconds calculates positive remaining seconds and clamps to 0", () => {
  const base = new Date("2026-09-25T03:00:00.000Z").getTime();
  const future = new Date("2026-09-25T03:10:00.000Z");
  assert.equal(computeRemainingSeconds(future, base), 600);

  const past = new Date("2026-09-25T02:50:00.000Z");
  assert.equal(computeRemainingSeconds(past, base), 0);
});

test("formatCountdown formats seconds into mm:ss", () => {
  assert.equal(formatCountdown(600), "10:00");
  assert.equal(formatCountdown(59), "00:59");
  assert.equal(formatCountdown(5), "00:05");
  assert.equal(formatCountdown(0), "00:00");
});

test("canRetryPayment returns true only when unpaid, pending, and unexpired", () => {
  const base = new Date("2026-09-25T03:00:00.000Z").getTime();
  const liveInvoice = {
    payment_status: "UNPAID",
    payment_expires_at: new Date("2026-09-25T03:10:00.000Z"),
  };

  assert.equal(canRetryPayment(liveInvoice, "PENDING", base), true);
  assert.equal(canRetryPayment(liveInvoice, "CANCELLED", base), false);
  assert.equal(canRetryPayment({ ...liveInvoice, payment_status: "PAID" }, "PENDING", base), false);

  const expiredInvoice = {
    payment_status: "UNPAID",
    payment_expires_at: new Date("2026-09-25T02:59:00.000Z"),
  };
  assert.equal(canRetryPayment(expiredInvoice, "PENDING", base), false);
});

test("getPaymentBadge returns accurate label and style classes", () => {
  const base = new Date("2026-09-25T03:00:00.000Z").getTime();
  const paidInvoice = { payment_status: "PAID" };
  assert.deepEqual(getPaymentBadge(paidInvoice, "PENDING", base), {
    label: "Đã thanh toán",
    className: "paid",
    type: "success",
  });

  const unpaidLiveInvoice = {
    payment_status: "UNPAID",
    payment_expires_at: new Date("2026-09-25T03:05:00.000Z"),
  };
  assert.deepEqual(getPaymentBadge(unpaidLiveInvoice, "PENDING", base), {
    label: "Chưa thanh toán",
    className: "unpaid",
    type: "warning",
  });

  const expiredInvoice = {
    payment_status: "UNPAID",
    payment_expires_at: new Date("2026-09-25T02:55:00.000Z"),
  };
  assert.deepEqual(getPaymentBadge(expiredInvoice, "PENDING", base), {
    label: "Hết hạn thanh toán",
    className: "expired",
    type: "danger",
  });
});
