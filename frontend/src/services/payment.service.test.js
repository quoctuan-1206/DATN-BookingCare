import test from "node:test";
import assert from "node:assert/strict";
import axiosClient from "../api/axios.js";
import { paymentService } from "./payment.service.js";

test("paymentService.createPaymentUrl calls correct endpoint and returns backend data", async () => {
  const originalPost = axiosClient.post;
  let requestedUrl = null;

  axiosClient.post = async (url) => {
    requestedUrl = url;
    return {
      data: {
        success: true,
        data: {
          payment_url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=15000000",
          txn_ref: "INV42",
          expires_at: "2026-09-25T03:10:00.000Z",
        },
      },
    };
  };

  try {
    const result = await paymentService.createPaymentUrl(42);
    assert.equal(requestedUrl, "/payments/vnpay/42/create");
    assert.match(result.payment_url, /^https:\/\/sandbox\.vnpayment\.vn\//);
    assert.equal(result.txn_ref, "INV42");
  } finally {
    axiosClient.post = originalPost;
  }
});

test("paymentService.getStatus calls correct endpoint and returns status payload", async () => {
  const originalGet = axiosClient.get;
  let requestedUrl = null;

  axiosClient.get = async (url) => {
    requestedUrl = url;
    return {
      data: {
        success: true,
        data: {
          invoice_id: 42,
          appointment_id: 10,
          payment_status: "UNPAID",
          payment_expires_at: "2026-09-25T03:10:00.000Z",
          amount: 150000,
          can_retry: true,
        },
      },
    };
  };

  try {
    const result = await paymentService.getStatus(42);
    assert.equal(requestedUrl, "/payments/42/status");
    assert.equal(result.payment_status, "UNPAID");
    assert.equal(result.can_retry, true);
  } finally {
    axiosClient.get = originalGet;
  }
});
