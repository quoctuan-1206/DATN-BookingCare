import test from "node:test";
import assert from "node:assert/strict";
import {
  assertStaffClinicAccess,
  clinicIdForUser,
  getStaffClinicId,
} from "../src/utils/facility-scope.js";

const staff = { role: { name: "STAFF" }, clinic_id: 1 };

test("staff scope always comes from the authenticated user record", () => {
  assert.equal(getStaffClinicId(staff), 1);
  assert.equal(clinicIdForUser(staff, 2), 1);
});

test("staff can access assigned facility and cannot access another facility", () => {
  assert.doesNotThrow(() => assertStaffClinicAccess(staff, 1));
  assert.throws(() => assertStaffClinicAccess(staff, 2), { statusCode: 404 });
});

test("unassigned staff are denied and admins retain requested or global scope", () => {
  assert.throws(() => getStaffClinicId({ role: { name: "STAFF" }, clinic_id: null }), { statusCode: 403 });
  assert.equal(clinicIdForUser({ role: { name: "Admin" } }, 2), 2);
  assert.equal(clinicIdForUser({ role: { name: "Admin" } }), undefined);
});
