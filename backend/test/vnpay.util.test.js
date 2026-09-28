import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  buildPaymentUrl,
  verifyVnpaySignature,
  toVnpayDate,
  createTxnRef,
} from "../src/utils/vnpay.js";

const config = {
  tmnCode: "DEMOV210",
  hashSecret: "sandboxsecret123",
  paymentUrl: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  returnUrl: "https://example.com/return",
  ipnUrl: "https://example.com/ipn",
  frontendUrl: "http://localhost:5173",
};

const payload = {
  amount: 125000,
  txnRef: "INV4220260925093000A1B2C3",
  bookingCode: "BK12345",
  ipAddress: "127.0.0.1",
  createdAt: new Date("2026-09-25T02:30:00.000Z"),
  expiresAt: new Date("2026-09-25T02:40:00.000Z"),
};

function signedQuery() {
  const url = new URL(buildPaymentUrl(config, payload));
  return Object.fromEntries(url.searchParams);
}

test("buildPaymentUrl signs sorted fields and scales VND amount by 100", () => {
  const url = new URL(buildPaymentUrl(config, payload));
  assert.equal(url.searchParams.get("vnp_Amount"), "12500000");
  assert.ok(url.searchParams.get("vnp_SecureHash"));
  assert.equal(verifyVnpaySignature(Object.fromEntries(url.searchParams), config.hashSecret), true);
});

test("verifyVnpaySignature returns false after an amount is modified", () => {
  const query = signedQuery();
  query.vnp_Amount = "99900";
  assert.equal(verifyVnpaySignature(query, config.hashSecret), false);
});

test("verifyVnpaySignature returns false when secure hash is missing, invalid or malformed", () => {
  assert.equal(verifyVnpaySignature(null, config.hashSecret), false);
  assert.equal(verifyVnpaySignature({}, config.hashSecret), false);

  const queryWithoutHash = signedQuery();
  delete queryWithoutHash.vnp_SecureHash;
  assert.equal(verifyVnpaySignature(queryWithoutHash, config.hashSecret), false);

  const queryWithShortHash = signedQuery();
  queryWithShortHash.vnp_SecureHash = "abcd123";
  assert.equal(verifyVnpaySignature(queryWithShortHash, config.hashSecret), false);

  const queryWithEmptyHash = signedQuery();
  queryWithEmptyHash.vnp_SecureHash = "";
  assert.equal(verifyVnpaySignature(queryWithEmptyHash, config.hashSecret), false);

  const query = signedQuery();
  assert.equal(verifyVnpaySignature(query, ""), false);
  assert.equal(verifyVnpaySignature(query, null), false);
});

test("verifyVnpaySignature handles both excluded hash keys without affecting verification", () => {
  const query = signedQuery();
  query.vnp_SecureHashType = "SHA512";
  assert.equal(verifyVnpaySignature(query, config.hashSecret), true);

  // Lowercase variants should also be excluded
  query.vnp_secure_hash_type = "SHA512";
  assert.equal(verifyVnpaySignature(query, config.hashSecret), true);

  // Empty or undefined values should be discarded and not affect signature
  query.emptyParam = "";
  query.undefinedParam = undefined;
  query.nullParam = null;
  assert.equal(verifyVnpaySignature(query, config.hashSecret), true);
});

test("verifyVnpaySignature performs case-insensitive hex comparison and supports URLSearchParams", () => {
  const url = new URL(buildPaymentUrl(config, payload));
  // Direct URLSearchParams instance
  assert.equal(verifyVnpaySignature(url.searchParams, config.hashSecret), true);

  // Uppercase hash
  const query = Object.fromEntries(url.searchParams);
  query.vnp_SecureHash = query.vnp_SecureHash.toUpperCase();
  assert.equal(verifyVnpaySignature(query, config.hashSecret), true);
});

test("createTxnRef formats ref correctly and differing randomBytes yield differing txn refs", () => {
  const fixedDate = new Date("2026-09-25T02:30:00.000Z");
  const mockBytes1 = () => Buffer.from([0xa1, 0xb2, 0xc3]);
  const mockBytes2 = () => Buffer.from([0x01, 0x02, 0x03]);

  const ref1 = createTxnRef(42, fixedDate, mockBytes1);
  const ref2 = createTxnRef(42, fixedDate, mockBytes2);

  assert.equal(ref1, "INV4220260925093000A1B2C3");
  assert.equal(ref2, "INV4220260925093000010203");
  assert.notEqual(ref1, ref2);

  // Default randomBytes generates valid pattern
  const defaultRef = createTxnRef(101, fixedDate);
  assert.match(defaultRef, /^INV10120260925093000[0-9A-F]{6}$/);
});

test("toVnpayDate converts UTC to GMT+7 Vietnam time accurately across boundaries", () => {
  // Morning UTC (02:30) -> GMT+7 (09:30)
  assert.equal(toVnpayDate(new Date("2026-09-25T02:30:00.000Z")), "20260925093000");

  // Year boundary rollover (2026-12-31 20:15:05 UTC -> 2027-01-01 03:15:05 GMT+7)
  assert.equal(toVnpayDate(new Date("2026-12-31T20:15:05.000Z")), "20270101031505");

  // Month boundary rollover
  assert.equal(toVnpayDate(new Date("2026-02-28T18:00:00.000Z")), "20260301010000");

  // Accepts date strings
  assert.equal(toVnpayDate("2026-09-25T02:30:00.000Z"), "20260925093000");

  // Throws on invalid date
  assert.throws(() => toVnpayDate("invalid-date"), /Invalid date/);
});

test("buildPaymentUrl handles string/number amounts and rounds accurately", () => {
  const customPayload = {
    ...payload,
    amount: "500000",
  };
  const url = new URL(buildPaymentUrl(config, customPayload));
  assert.equal(url.searchParams.get("vnp_Amount"), "50000000");
  assert.equal(url.searchParams.get("vnp_Command"), "pay");
  assert.equal(url.searchParams.get("vnp_Version"), "2.1.0");
  assert.equal(url.searchParams.get("vnp_CurrCode"), "VND");
  assert.equal(url.searchParams.get("vnp_Locale"), "vn");
  assert.equal(url.searchParams.get("vnp_OrderType"), "other");
  assert.equal(url.searchParams.get("vnp_ReturnUrl"), config.returnUrl);
  assert.equal(url.searchParams.get("vnp_TxnRef"), payload.txnRef);
  assert.equal(verifyVnpaySignature(url.searchParams, config.hashSecret), true);
});
