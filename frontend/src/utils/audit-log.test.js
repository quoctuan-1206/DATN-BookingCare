import test from "node:test";
import assert from "node:assert/strict";
import {
  formatAuditDate,
  formatAuditJson,
  getAuditActor,
} from "./audit-log.js";

test("formatAuditJson pretty prints JSON and redacts sensitive fields", () => {
  const output = formatAuditJson({
    email: "admin@example.com",
    password: "plain-text-password",
    nested: { accessToken: "access-token", otp: "123456" },
  });

  assert.match(output, /admin@example\.com/);
  assert.doesNotMatch(output, /plain-text-password|access-token|123456/);
  assert.equal((output.match(/\[REDACTED\]/g) || []).length, 3);
});

test("formatAuditJson supports JSON strings and plain text", () => {
  assert.match(formatAuditJson('{"status":"DONE"}'), /"status": "DONE"/);
  assert.equal(formatAuditJson("plain text"), "plain text");
  assert.equal(formatAuditJson(null), "—");
});

test("getAuditActor handles deleted and anonymous actors", () => {
  assert.deepEqual(
    getAuditActor({
      userId: 3,
      user: { fullName: "Nguyễn An", email: "an@example.com", role: "Admin" },
    }),
    { name: "Nguyễn An", detail: "an@example.com" },
  );
  assert.deepEqual(getAuditActor({ userId: 9, user: null }), {
    name: "Người dùng #9",
    detail: "",
  });
  assert.equal(
    getAuditActor({ userId: null, metadata: { attemptedEmail: "x@example.com" } }).name,
    "x@example.com",
  );
});

test("formatAuditDate handles invalid values", () => {
  assert.equal(formatAuditDate(null), "—");
  assert.equal(formatAuditDate("not-a-date"), "—");
});
