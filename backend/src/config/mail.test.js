import test from "node:test";
import assert from "node:assert/strict";
import { isMailEnabled, getTransport } from "./mail.js";

test("mail is disabled when SMTP env vars are missing", () => {
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
  assert.equal(isMailEnabled(), false);
  assert.equal(getTransport(), null);
});

test("mail is enabled when host, user and password are present", () => {
  process.env.SMTP_HOST = "smtp.gmail.com";
  process.env.SMTP_USER = "demo@gmail.com";
  process.env.SMTP_PASS = "app-password";
  assert.equal(isMailEnabled(), true);
});
