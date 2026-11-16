import test from "node:test";
import assert from "node:assert/strict";
import {
  canAccessPatientProfile,
  HealthRecordService,
  paginate,
  sortTimelineEvents,
  validateVitalInput,
} from "./health-record.service.js";
import {
  allergySchema,
  historySchema,
  timelineQuerySchema,
  vitalSchema,
} from "../validators/health-record.validator.js";

test("timeline pagination clamps page size and reports totals", () => {
  const result = paginate([1, 2, 3, 4, 5], 2, 2);
  assert.deepEqual(result, { data: [3, 4], page: 2, limit: 2, total: 5, total_pages: 3 });
  assert.equal(paginate([1], 1, 500).limit, 100);
});

test("timeline events sort newest first and omit events without a date", () => {
  const sorted = sortTimelineEvents([
    { id: "old", date: "2024-01-01" },
    { id: "new", date: "2025-06-01" },
    { id: "missing", date: null },
  ]);
  assert.deepEqual(sorted.map((item) => item.id), ["new", "old"]);
});

test("timeline query rejects unknown event types and invalid pagination", () => {
  assert.equal(timelineQuerySchema.safeParse({ type: "LAB", page: "2", limit: "20" }).success, true);
  assert.equal(timelineQuerySchema.safeParse({ type: "PAYMENT" }).success, false);
  assert.equal(timelineQuerySchema.safeParse({ page: "0" }).success, false);
});

test("multiple patient profiles owned by one account remain individually accessible", () => {
  const self = { role: { name: "Patient" }, id: 8 };
  assert.equal(canAccessPatientProfile(self, { id: 20, account_id: 8 }), true);
  assert.equal(canAccessPatientProfile(self, { id: 21, account_id: 8 }), true);
  assert.equal(canAccessPatientProfile(self, { id: 22, account_id: 9 }), false);
});

test("doctor, staff and admin access stays within configured relationships", () => {
  const profile = { id: 12, account_id: 30 };
  assert.equal(canAccessPatientProfile({ id: 4, role: { name: "Doctor" } }, profile, { doctorIds: [4] }), true);
  assert.equal(canAccessPatientProfile({ id: 5, role: { name: "Doctor" } }, profile, { doctorIds: [4] }), false);
  assert.equal(canAccessPatientProfile({ id: 6, clinic_id: 7, role: { name: "STAFF" } }, profile, { clinicIds: [7] }), true);
  assert.equal(canAccessPatientProfile({ id: 6, clinic_id: 8, role: { name: "STAFF" } }, profile, { clinicIds: [7] }), false);
  assert.equal(canAccessPatientProfile({ id: 1, role: { name: "Admin" } }, profile), true);
  assert.equal(canAccessPatientProfile({ id: 1, role: { name: "Guest" } }, profile), false);
});

test("allergy input distinguishes patient reported no-known-allergy from missing input", () => {
  assert.equal(allergySchema.safeParse({ no_known_allergies: true }).success, true);
  assert.equal(allergySchema.safeParse({}).success, false);
  assert.equal(allergySchema.safeParse({ allergen: "Penicillin", allergy_type: "MEDICATION" }).success, true);
});

test("vital input validates value ranges, units, and paired blood pressure", () => {
  const valid = { type: "BLOOD_PRESSURE", value: 120, secondary_value: 80, unit: "mmHg", measured_at: "2026-11-12T09:30:00.000Z" };
  assert.equal(vitalSchema.safeParse(valid).success, true);
  assert.equal(validateVitalInput(valid).secondary_value, 80);
  assert.throws(() => validateVitalInput({ ...valid, secondary_value: 130 }), /tâm trương/);
  assert.throws(() => validateVitalInput({ ...valid, value: 500 }), /khoảng/);
  assert.throws(() => validateVitalInput({ ...valid, unit: "kPa" }), /Đơn vị/);
  assert.equal(vitalSchema.safeParse({ ...valid, value: "invalid" }).success, false);
});

test("history input validates required title and date shape", () => {
  assert.equal(historySchema.safeParse({ title: "Hen suyễn", discovered_at: "2021-03-01" }).success, true);
  assert.equal(historySchema.safeParse({ title: "" }).success, false);
  assert.equal(historySchema.safeParse({ title: "Dị ứng", discovered_at: "01/03/2021" }).success, false);
});

function makeService({ profile = { id: 12, account_id: 8 }, relatedAppointment = null, existingEntry = null } = {}) {
  const auditEvents = [];
  let stored;
  let updatePayload;
  const database = {
    patient_profiles: { findUnique: async () => profile },
    appointments: { findFirst: async () => relatedAppointment },
    lab_orders: { findFirst: async () => null },
    patient_medical_history: {
      create: async ({ data }) => { stored = { id: 99, ...data }; return stored; },
      findFirst: async () => existingEntry,
      update: async ({ data }) => { updatePayload = data; return { ...existingEntry, ...data }; },
    },
    patient_allergies: {
      create: async ({ data }) => { stored = { id: 100, ...data }; return stored; },
      findFirst: async () => existingEntry,
      update: async ({ data }) => { updatePayload = data; return { ...existingEntry, ...data }; },
    },
    patient_conditions: {
      create: async ({ data }) => { stored = { id: 101, ...data }; return stored; },
      findFirst: async () => existingEntry,
      update: async ({ data }) => { updatePayload = data; return { ...existingEntry, ...data }; },
    },
    patient_vitals: {
      create: async ({ data }) => { stored = { id: 102, ...data }; return stored; },
      findFirst: async () => existingEntry,
      update: async ({ data }) => { updatePayload = data; return { ...existingEntry, ...data }; },
    },
  };
  const service = new HealthRecordService({ database, audit: { record: async (event) => auditEvents.push(event) } });
  return { service, auditEvents, get stored() { return stored; }, get updatePayload() { return updatePayload; }, database };
}

test("patient CRUD stores a pending history, confirms no declarations automatically, and soft deletes", async () => {
  const harness = makeService({ existingEntry: { id: 99, patient_profile_id: 12, deleted_at: null } });
  const patient = { id: 8, role: { name: "Patient" } };
  const created = await harness.service.createEntry("history", 12, patient, { title: "Hen suyễn" });
  assert.equal(created.source, "PATIENT");
  assert.equal(created.reported_by, 8);
  assert.equal(created.confirmation_status, "PENDING");
  assert.equal(harness.auditEvents[0].metadata.category, "history");

  await harness.service.updateEntry("history", 12, 99, patient, { description: "Khai báo của bệnh nhân" });
  assert.equal(harness.updatePayload.description, "Khai báo của bệnh nhân");
  await harness.service.deleteEntry("history", 12, 99, patient);
  assert.ok(harness.updatePayload.deleted_at instanceof Date);
  assert.ok(harness.auditEvents.some((event) => event.action === "DELETE"));
});

test("treating doctor can create confirmed information and confirm patient reported history", async () => {
  const existing = { id: 99, patient_profile_id: 12, deleted_at: null, confirmation_status: "PENDING" };
  const harness = makeService({ relatedAppointment: { id: 45 }, existingEntry: existing });
  const doctor = { id: 4, role: { name: "Doctor" } };
  const allergy = await harness.service.createEntry("allergies", 12, doctor, { allergen: "Penicillin", allergy_type: "MEDICATION" });
  assert.equal(allergy.source, "CLINICIAN");
  assert.equal(allergy.confirmation_status, "CONFIRMED");
  assert.equal(allergy.confirmed_by, 4);

  await harness.service.updateEntry("history", 12, 99, doctor, { confirmation_status: "CONFIRMED" });
  assert.equal(harness.updatePayload.confirmed_by, 4);
  assert.equal(harness.updatePayload.confirmation_status, "CONFIRMED");
});

test("health record service blocks cross-owner CRUD and doctors without care relationships", async () => {
  const otherOwner = makeService({ profile: { id: 12, account_id: 77 } });
  await assert.rejects(
    otherOwner.service.createEntry("history", 12, { id: 8, role: { name: "Patient" } }, { title: "Not mine" }),
    (error) => error.statusCode === 404,
  );

  const noCareRelation = makeService();
  await assert.rejects(
    noCareRelation.service.createEntry("history", 12, { id: 4, role: { name: "Doctor" } }, { title: "No access" }),
    (error) => error.statusCode === 404,
  );
});
