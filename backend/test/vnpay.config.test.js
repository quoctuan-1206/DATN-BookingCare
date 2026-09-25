import test from "node:test";
import assert from "node:assert/strict";
import { getVnpayConfig } from "../src/config/vnpay.js";

test("getVnpayConfig rejects a missing Sandbox secret", () => {
  assert.throws(() => getVnpayConfig({ VNPAY_TMN_CODE: "DEMOV210" }), {
    message: /VNPAY_HASH_SECRET/,
  });
});

test("getVnpayConfig rejects missing required configuration keys", () => {
  assert.throws(
    () =>
      getVnpayConfig({
        VNPAY_HASH_SECRET: "sandboxsecret",
        VNPAY_RETURN_URL: "https://example.com/return",
        VNPAY_IPN_URL: "https://example.com/ipn",
        FRONTEND_URL: "http://localhost:5173",
      }),
    { message: /VNPAY_TMN_CODE/ },
  );

  assert.throws(
    () =>
      getVnpayConfig({
        VNPAY_TMN_CODE: "DEMOV210",
        VNPAY_HASH_SECRET: "sandboxsecret",
        VNPAY_IPN_URL: "https://example.com/ipn",
        FRONTEND_URL: "http://localhost:5173",
      }),
    { message: /VNPAY_RETURN_URL/ },
  );

  assert.throws(
    () =>
      getVnpayConfig({
        VNPAY_TMN_CODE: "DEMOV210",
        VNPAY_HASH_SECRET: "sandboxsecret",
        VNPAY_RETURN_URL: "https://example.com/return",
        FRONTEND_URL: "http://localhost:5173",
      }),
    { message: /VNPAY_IPN_URL/ },
  );

  assert.throws(
    () =>
      getVnpayConfig({
        VNPAY_TMN_CODE: "DEMOV210",
        VNPAY_HASH_SECRET: "sandboxsecret",
        VNPAY_RETURN_URL: "https://example.com/return",
        VNPAY_IPN_URL: "https://example.com/ipn",
      }),
    { message: /FRONTEND_URL/ },
  );
});

test("getVnpayConfig parses valid config and trims trailing slash from frontendUrl", () => {
  const config = getVnpayConfig({
    VNPAY_TMN_CODE: "DEMOV210",
    VNPAY_HASH_SECRET: "secret123",
    VNPAY_RETURN_URL: "https://backend.example/api/payments/vnpay/return",
    VNPAY_IPN_URL: "https://backend.example/api/payments/vnpay/ipn",
    FRONTEND_URL: "http://localhost:5173/",
  });

  assert.deepEqual(config, {
    tmnCode: "DEMOV210",
    hashSecret: "secret123",
    paymentUrl: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    returnUrl: "https://backend.example/api/payments/vnpay/return",
    ipnUrl: "https://backend.example/api/payments/vnpay/ipn",
    frontendUrl: "http://localhost:5173",
  });
});

test("getVnpayConfig uses custom paymentUrl if provided", () => {
  const config = getVnpayConfig({
    VNPAY_TMN_CODE: "DEMOV210",
    VNPAY_HASH_SECRET: "secret123",
    VNPAY_PAYMENT_URL: "https://custom.vnpay.vn/vpcpay.html",
    VNPAY_RETURN_URL: "https://backend.example/api/payments/vnpay/return",
    VNPAY_IPN_URL: "https://backend.example/api/payments/vnpay/ipn",
    FRONTEND_URL: "http://localhost:5173",
  });

  assert.equal(config.paymentUrl, "https://custom.vnpay.vn/vpcpay.html");
});
