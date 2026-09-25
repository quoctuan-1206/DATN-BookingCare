import test from "node:test";
import assert from "node:assert/strict";
import { PaymentService } from "../src/services/payment.service.js";
import { buildPaymentUrl } from "../src/utils/vnpay.js";

const config = {
  tmnCode: "DEMOV210",
  hashSecret: "sandboxtestsecret12345",
  paymentUrl: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  returnUrl: "https://backend.example.com/api/payments/vnpay/return",
  ipnUrl: "https://backend.example.com/api/payments/vnpay/ipn",
  frontendUrl: "http://localhost:5173",
};

function createMockRepo({
  invoice = {
    id: 42,
    appointment_id: 10,
    invoice_type: "CLINIC_FEE",
    amount: "150000.00",
    payment_status: "UNPAID",
    payment_expires_at: new Date("2026-09-25T03:10:00.000Z"),
    vnp_txn_ref: null,
    appointments: {
      id: 10,
      status: "PENDING",
      booking_code: "BK12345",
      patient_profiles: { id: 5, account_id: 1, full_name: "Nguyen Van A" },
      schedules: { id: 100 },
    },
  },
} = {}) {
  const currentInvoice = invoice ? { ...invoice } : null;
  return {
    async findClinicInvoiceById(id) {
      if (currentInvoice && currentInvoice.id === Number(id)) {
        return currentInvoice;
      }
      return null;
    },
    async findClinicInvoiceByTxnRef(txnRef) {
      if (currentInvoice && currentInvoice.vnp_txn_ref === txnRef) {
        return currentInvoice;
      }
      return null;
    },
    async setInvoiceTxnRef(id, txnRef) {
      if (currentInvoice && currentInvoice.id === Number(id)) {
        currentInvoice.vnp_txn_ref = txnRef;
        return currentInvoice;
      }
      return null;
    },
    async markPaidFromIpn({ txnRef, amount, transactionNo, paidAt, now }) {
      if (!currentInvoice || currentInvoice.vnp_txn_ref !== txnRef) {
        return { success: false, code: "NOT_FOUND" };
      }
      const expectedAmount = Math.round(Number(currentInvoice.amount) * 100);
      if (Number(amount) !== expectedAmount) {
        return { success: false, code: "INVALID_AMOUNT" };
      }
      if (currentInvoice.payment_status === "PAID") {
        return { success: true, code: "ALREADY_PAID", invoice: currentInvoice };
      }
      if (currentInvoice.payment_expires_at && currentInvoice.payment_expires_at < now) {
        return { success: false, code: "EXPIRED" };
      }
      currentInvoice.payment_status = "PAID";
      currentInvoice.transaction_id = String(transactionNo);
      currentInvoice.payment_date = paidAt;
      return { success: true, code: "SUCCESS", invoice: currentInvoice };
    },
    currentInvoice,
  };
}

test("createPaymentUrl generates a signed Sandbox URL for a valid clinic fee", async () => {
  const repo = createMockRepo();
  const service = new PaymentService({ config, repository: repo });
  const patient = { id: 1, role: { name: "Patient" } };
  const now = new Date("2026-09-25T03:02:00.000Z");

  const result = await service.createPaymentUrl(patient, 42, "127.0.0.1", now);

  assert.ok(result.payment_url);
  assert.match(result.payment_url, /^https:\/\/sandbox\.vnpayment\.vn\//);
  assert.ok(result.txn_ref);
  assert.equal(repo.currentInvoice.vnp_txn_ref, result.txn_ref);
});

test("createPaymentUrl rejects non-owner patient with 403", async () => {
  const repo = createMockRepo();
  const service = new PaymentService({ config, repository: repo });
  const wrongPatient = { id: 999, role: { name: "Patient" } };

  await assert.rejects(
    () => service.createPaymentUrl(wrongPatient, 42, "127.0.0.1"),
    (err) => {
      assert.equal(err.statusCode, 403);
      return true;
    },
  );
});

test("createPaymentUrl rejects expired invoice with 400", async () => {
  const repo = createMockRepo();
  const service = new PaymentService({ config, repository: repo });
  const patient = { id: 1, role: { name: "Patient" } };
  const expiredNow = new Date("2026-09-25T03:15:00.000Z");

  await assert.rejects(
    () => service.createPaymentUrl(patient, 42, "127.0.0.1", expiredNow),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /hết hạn/);
      return true;
    },
  );
});

test("getPaymentStatus returns can_retry correctly for live vs expired invoice", async () => {
  const repo = createMockRepo();
  const service = new PaymentService({ config, repository: repo });
  const patient = { id: 1, role: { name: "Patient" } };

  const live = await service.getPaymentStatus(
    patient,
    42,
    new Date("2026-09-25T03:05:00.000Z"),
  );
  assert.equal(live.can_retry, true);
  assert.equal(live.payment_status, "UNPAID");

  const expired = await service.getPaymentStatus(
    patient,
    42,
    new Date("2026-09-25T03:15:00.000Z"),
  );
  assert.equal(expired.can_retry, false);

  const doctor = { id: 1, role: { name: "Doctor" } };
  await assert.rejects(
    () => service.getPaymentStatus(doctor, 42),
    (err) => {
      assert.equal(err.statusCode, 403);
      return true;
    },
  );
});

test("handleIpn confirms valid IPN with RspCode 00", async () => {
  const repo = createMockRepo();
  const service = new PaymentService({ config, repository: repo });
  repo.currentInvoice.vnp_txn_ref = "INV4220260925ABCDEF";

  const rawUrl = buildPaymentUrl(config, {
    amount: 150000,
    txnRef: "INV4220260925ABCDEF",
    bookingCode: "BK12345",
    ipAddress: "127.0.0.1",
    createdAt: new Date("2026-09-25T03:00:00.000Z"),
    expiresAt: new Date("2026-09-25T03:10:00.000Z"),
  });

  const ipnQuery = Object.fromEntries(new URL(rawUrl).searchParams);
  ipnQuery.vnp_ResponseCode = "00";
  ipnQuery.vnp_TransactionStatus = "00";
  ipnQuery.vnp_TransactionNo = "14892020";

  // Re-sign with the new parameters
  const reUrl = buildPaymentUrl(config, {
    amount: 150000,
    txnRef: "INV4220260925ABCDEF",
    bookingCode: "BK12345",
    ipAddress: "127.0.0.1",
    createdAt: new Date("2026-09-25T03:00:00.000Z"),
    expiresAt: new Date("2026-09-25T03:10:00.000Z"),
  });
  const urlObj = new URL(reUrl);
  urlObj.searchParams.set("vnp_ResponseCode", "00");
  urlObj.searchParams.set("vnp_TransactionStatus", "00");
  urlObj.searchParams.set("vnp_TransactionNo", "14892020");

  // Sign properly
  const { verifyVnpaySignature } = await import("../src/utils/vnpay.js");
  const crypto = await import("node:crypto");
  const sortedKeys = Array.from(urlObj.searchParams.keys())
    .filter((k) => k !== "vnp_SecureHash" && k !== "vnp_SecureHashType")
    .sort((a, b) => a.localeCompare(b));
  const signParams = new URLSearchParams();
  for (const key of sortedKeys) {
    signParams.append(key, urlObj.searchParams.get(key));
  }
  const signData = signParams.toString();
  const hmac = crypto.createHmac("sha512", config.hashSecret).update(Buffer.from(signData, "utf-8")).digest("hex");
  urlObj.searchParams.set("vnp_SecureHash", hmac);

  const signedQuery = Object.fromEntries(urlObj.searchParams);

  const response = await service.handleIpn(signedQuery, new Date("2026-09-25T03:05:00.000Z"));
  assert.equal(response.RspCode, "00");
  assert.equal(repo.currentInvoice.payment_status, "PAID");
});

test("handleIpn rejects invalid signature with RspCode 97", async () => {
  const repo = createMockRepo();
  const service = new PaymentService({ config, repository: repo });

  const response = await service.handleIpn({
    vnp_Amount: "15000000",
    vnp_TxnRef: "INV4220260925ABCDEF",
    vnp_SecureHash: "invalidhash",
  });

  assert.equal(response.RspCode, "97");
});

test("handleIpn rejects altered amount with RspCode 04", async () => {
  const repo = createMockRepo();
  const service = new PaymentService({ config, repository: repo });
  repo.currentInvoice.vnp_txn_ref = "INV4220260925ABCDEF";

  const crypto = await import("node:crypto");
  const params = new URLSearchParams({
    vnp_Amount: "99900",
    vnp_TxnRef: "INV4220260925ABCDEF",
    vnp_ResponseCode: "00",
    vnp_TransactionStatus: "00",
    vnp_TransactionNo: "12345",
  });
  const sortedKeys = Array.from(params.keys()).sort((a, b) => a.localeCompare(b));
  const signData = sortedKeys.map((k) => `${k}=${params.get(k)}`).join("&");
  const hmac = crypto.createHmac("sha512", config.hashSecret).update(Buffer.from(signData, "utf-8")).digest("hex");
  params.set("vnp_SecureHash", hmac);

  const response = await service.handleIpn(Object.fromEntries(params), new Date("2026-09-25T03:05:00.000Z"));
  assert.equal(response.RspCode, "04");
  assert.equal(repo.currentInvoice.payment_status, "UNPAID");
});

test("handleReturn redirects appropriately based on signature and response code", async () => {
  const repo = createMockRepo();
  const service = new PaymentService({ config, repository: repo });
  repo.currentInvoice.vnp_txn_ref = "INV4220260925ABCDEF";

  // Invalid hash
  const invalidResult = await service.handleReturn({ vnp_SecureHash: "bad" });
  assert.equal(invalidResult, "http://localhost:5173/payment/result?status=invalid");

  // Valid hash with success response code 00
  const crypto = await import("node:crypto");
  const successParams = new URLSearchParams({
    vnp_TxnRef: "INV4220260925ABCDEF",
    vnp_ResponseCode: "00",
  });
  const keys = Array.from(successParams.keys()).sort((a, b) => a.localeCompare(b));
  const signData = keys.map((k) => `${k}=${successParams.get(k)}`).join("&");
  const hash = crypto.createHmac("sha512", config.hashSecret).update(Buffer.from(signData, "utf-8")).digest("hex");
  successParams.set("vnp_SecureHash", hash);

  const successResult = await service.handleReturn(Object.fromEntries(successParams));
  assert.equal(successResult, "http://localhost:5173/payment/result?invoiceId=42");

  // Valid hash with failed response code 24
  const failedParams = new URLSearchParams({
    vnp_TxnRef: "INV4220260925ABCDEF",
    vnp_ResponseCode: "24",
  });
  const failKeys = Array.from(failedParams.keys()).sort((a, b) => a.localeCompare(b));
  const failSignData = failKeys.map((k) => `${k}=${failedParams.get(k)}`).join("&");
  const failHash = crypto.createHmac("sha512", config.hashSecret).update(Buffer.from(failSignData, "utf-8")).digest("hex");
  failedParams.set("vnp_SecureHash", failHash);

  const failResult = await service.handleReturn(Object.fromEntries(failedParams));
  assert.equal(failResult, "http://localhost:5173/payment/result?status=failed&invoiceId=42");
});

test("PaymentController.handleIpn returns HTTP 200 with JSON", async () => {
  const paymentController = (await import("../src/controllers/payment.controller.js")).default;
  const paymentService = (await import("../src/services/payment.service.js")).default;

  const originalHandleIpn = paymentService.handleIpn;
  paymentService.handleIpn = async () => ({ RspCode: "00", Message: "Confirm Success" });

  let statusCode = null;
  let jsonBody = null;
  const req = { query: {} };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      jsonBody = data;
      return this;
    },
  };

  try {
    await paymentController.handleIpn(req, res);
    assert.equal(statusCode, 200);
    assert.deepEqual(jsonBody, { RspCode: "00", Message: "Confirm Success" });
  } finally {
    paymentService.handleIpn = originalHandleIpn;
  }
});

test("PaymentController.handleReturn redirects to target URL", async () => {
  const paymentController = (await import("../src/controllers/payment.controller.js")).default;
  const paymentService = (await import("../src/services/payment.service.js")).default;

  const originalHandleReturn = paymentService.handleReturn;
  paymentService.handleReturn = async () => "http://localhost:5173/payment/result?invoiceId=42";

  let redirectedTo = null;
  const req = { query: {} };
  const res = {
    redirect(url) {
      redirectedTo = url;
      return this;
    },
  };

  try {
    await paymentController.handleReturn(req, res);
    assert.equal(redirectedTo, "http://localhost:5173/payment/result?invoiceId=42");
  } finally {
    paymentService.handleReturn = originalHandleReturn;
  }
});

test("PaymentController.createPaymentUrl sends status 200 and data", async () => {
  const paymentController = (await import("../src/controllers/payment.controller.js")).default;
  const paymentService = (await import("../src/services/payment.service.js")).default;

  const originalCreateUrl = paymentService.createPaymentUrl;
  paymentService.createPaymentUrl = async () => ({
    payment_url: "https://sandbox.vnpayment.vn/test",
    txn_ref: "INV10",
  });

  let statusCode = null;
  let jsonBody = null;
  const req = {
    user: { id: 1, role: { name: "Patient" } },
    params: { invoiceId: "10" },
    ip: "127.0.0.1",
  };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      jsonBody = data;
      return this;
    },
  };

  try {
    await paymentController.createPaymentUrl(req, res, () => {});
    assert.equal(statusCode, 200);
    assert.equal(jsonBody.success, true);
    assert.equal(jsonBody.data.txn_ref, "INV10");
  } finally {
    paymentService.createPaymentUrl = originalCreateUrl;
  }
});

test("PaymentController.getPaymentStatus sends status 200 and data", async () => {
  const paymentController = (await import("../src/controllers/payment.controller.js")).default;
  const paymentService = (await import("../src/services/payment.service.js")).default;

  const originalGetStatus = paymentService.getPaymentStatus;
  paymentService.getPaymentStatus = async () => ({
    invoice_id: 10,
    appointment_id: 20,
    payment_status: "UNPAID",
    can_retry: true,
  });

  let statusCode = null;
  let jsonBody = null;
  const req = {
    user: { id: 1, role: { name: "Patient" } },
    params: { invoiceId: "10" },
  };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      jsonBody = data;
      return this;
    },
  };

  try {
    await paymentController.getPaymentStatus(req, res, () => {});
    assert.equal(statusCode, 200);
    assert.equal(jsonBody.success, true);
    assert.equal(jsonBody.data.invoice_id, 10);
    assert.equal(jsonBody.data.can_retry, true);
  } finally {
    paymentService.getPaymentStatus = originalGetStatus;
  }
});

