import assert from "node:assert/strict";
import { authorize } from "../src/middlewares/role.middleware.js";
import { limitClinicalUploads } from "../src/middlewares/security.middleware.js";
import labRepository from "../src/repositories/lab.repository.js";
import labService from "../src/services/lab.service.js";
import medicalRecordService from "../src/services/medical-record.service.js";
import {
  createClinicalScheduleSchema,
  createClinicalServiceSchema,
  createPatientClinicalOrderSchema,
  queryLabScheduleSchema,
} from "../src/validators/lab.validator.js";

const patient = { id: 10, role: { name: "Patient" } };
const doctor = { id: 20, role: { name: "Doctor" } };
const pendingOrder = {
  id: 1,
  service_type: "XRAY",
  status: "IN_PROGRESS",
  patient_profiles: { account_id: patient.id, full_name: "Patient" },
  doctor_id: doctor.id,
  lab_results: [
    {
      id: 2,
      test_id: 3,
      service_name_snapshot: "X-ray",
      result: "draft",
      findings: "draft finding",
      measurements: { value: 1 },
    },
  ],
  clinical_attachments: [
    {
      id: 4,
      kind: "DOCUMENT",
      original_name: "draft.pdf",
      mime_type: "application/pdf",
      file_size: 10,
    },
  ],
  clinical_order_events: [],
};

function testOwnershipFilters() {
  assert.equal(
    labService.buildOrderWhere({}, patient).patient_profiles.account_id,
    patient.id,
  );
  assert.equal(labService.buildOrderWhere({}, doctor).doctor_id, doctor.id);
  assert.throws(
    () =>
      labService.assertCanViewOrder(
        { patient_profiles: { account_id: patient.id + 1 } },
        patient,
      ),
    (error) => error.statusCode === 403,
  );
  assert.throws(
    () => labService.assertCanViewOrder({ doctor_id: doctor.id + 1 }, doctor),
    (error) => error.statusCode === 403,
  );
}

async function testPatientRedaction() {
  const originalFindOrders = labRepository.findOrders;
  try {
    labRepository.findOrders = async (_where, query) => ({
      total: 1,
      orders: [pendingOrder],
      page: query.page,
      limit: query.limit,
    });
    const pending = await labService.getOrders(
      { page: 1, limit: 10 },
      patient,
    );
    assert.equal(pending.data[0].results[0].result, null);
    assert.deepEqual(pending.data[0].attachments, []);

    labRepository.findOrders = async (_where, query) => ({
      total: 1,
      orders: [{ ...pendingOrder, status: "COMPLETED" }],
      page: query.page,
      limit: query.limit,
    });
    const completed = await labService.getOrders(
      { page: 1, limit: 10 },
      patient,
    );
    assert.equal(completed.data[0].results[0].result, "draft");
    assert.equal(completed.data[0].attachments.length, 1);
  } finally {
    labRepository.findOrders = originalFindOrders;
  }

  const record = medicalRecordService.formatRecord(
    { id: 1, appointments: { lab_orders: [pendingOrder] } },
    "Patient",
  );
  assert.equal(record.clinical_services[0].results[0].findings, null);
  assert.deepEqual(record.clinical_services[0].attachments, []);
}

function testRoleMiddleware() {
  let statusCode = null;
  let nextCalled = false;
  const response = {
    status(code) {
      statusCode = code;
      return this;
    },
    json() {},
  };
  authorize("Admin", "STAFF")(
    { user: patient },
    response,
    () => { nextCalled = true; },
  );
  assert.equal(statusCode, 403);
  assert.equal(nextCalled, false);
}

function testUploadRateLimit() {
  let statusCode = null;
  let nextCalls = 0;
  const response = {
    setHeader() {},
    status(code) {
      statusCode = code;
      return this;
    },
    json() {},
  };
  for (let index = 0; index < 21; index += 1) {
    limitClinicalUploads(
      { user: { id: 999999 }, ip: "127.0.0.1" },
      response,
      () => { nextCalls += 1; },
    );
  }
  assert.equal(nextCalls, 20);
  assert.equal(statusCode, 429);
}

async function testScheduleScope() {
  const payload = createClinicalScheduleSchema.parse({
    service_type: "XRAY",
    clinic_id: 1,
    work_date: "2030-01-01",
    start_time: "08:00",
    end_time: "09:00",
    max_orders: 10,
  });
  assert.equal(payload.service_type, "XRAY");
  assert.throws(() => createClinicalScheduleSchema.parse({
    ...payload,
    service_type: "UNKNOWN",
  }));

  const originalFindSchedules = labRepository.findSchedules;
  let capturedQuery = null;
  try {
    labRepository.findSchedules = async (query) => {
      capturedQuery = query;
      return { total: 0, schedules: [], page: query.page, limit: query.limit };
    };
    const query = queryLabScheduleSchema.parse({
      service_type: "XRAY",
      page: 1,
      limit: 20,
    });
    await labService.getSchedules(query);
    assert.equal(capturedQuery.service_type, "XRAY");
    await labService.getSchedules(query, false, "LAB");
    assert.equal(capturedQuery.service_type, "LAB");
  } finally {
    labRepository.findSchedules = originalFindSchedules;
  }
}

async function testServiceBookingMode() {
  const payload = createClinicalServiceSchema.parse({
    service_type: "XRAY",
    booking_mode: "DOCTOR_ORDER",
    name: "X-ray chest",
    image: "/uploads/clinical-service.jpg",
    price: 100000,
  });
  assert.equal(payload.booking_mode, "DOCTOR_ORDER");
  assert.equal(payload.image, "/uploads/clinical-service.jpg");
  assert.throws(() => createClinicalServiceSchema.parse({
    ...payload,
    booking_mode: "UNKNOWN",
  }));
  assert.throws(() => createClinicalServiceSchema.parse({
    ...payload,
    image: "javascript:alert(1)",
  }));

  const originalFindTests = labRepository.findTests;
  const originalFindPatientProfile = labRepository.findPatientProfile;
  const originalFindScheduleById = labRepository.findScheduleById;
  const originalCreateOrder = labRepository.createOrder;
  let capturedWhere = null;
  let capturedOrder = null;
  try {
    labRepository.findTests = async (where) => {
      capturedWhere = where;
      return [];
    };
    await labService.getTests(
      { is_active: true, booking_mode: "SELF_BOOKING" },
      "LAB",
    );
    assert.equal(capturedWhere.booking_mode, "SELF_BOOKING");

    labRepository.findPatientProfile = async () => ({
      id: 1,
      account_id: patient.id,
    });
    await assert.rejects(
      () => labService.createPatientOrder(
        { patient_id: 1, lab_schedule_id: 1, test_ids: [99] },
        patient,
      ),
      (error) => error.statusCode === 400,
    );
    assert.equal(capturedWhere.booking_mode, "SELF_BOOKING");

    const patientOrder = createPatientClinicalOrderSchema.parse({
      patient_id: 1,
      schedule_id: 7,
      service_type: "XRAY",
      service_ids: [8],
      patient_note: "Self booking",
    });
    labRepository.findTests = async (where) => {
      capturedWhere = where;
      return [{ id: 8, name: "X-ray chest", price: 100000 }];
    };
    labRepository.findScheduleById = async () => ({
      id: 7,
      service_type: "XRAY",
      clinic_id: 2,
      work_date: new Date("2035-01-01T00:00:00.000Z"),
      start_time: new Date("1970-01-01T08:00:00.000Z"),
      end_time: new Date("1970-01-01T09:00:00.000Z"),
      max_orders: 10,
      booked_orders: 0,
      is_active: true,
      clinics: { id: 2, name: "Clinic", is_active: true },
    });
    labRepository.createOrder = async (order) => {
      capturedOrder = order;
      return {
        id: 10,
        service_type: order.serviceType,
        status: "PENDING",
        patient_profiles: { full_name: "Patient" },
        lab_schedules: await labRepository.findScheduleById(order.labScheduleId),
        lab_results: [],
        clinical_attachments: [],
        clinical_order_events: [],
      };
    };
    const created = await labService.createPatientOrder(patientOrder, patient, null);
    assert.equal(capturedWhere.service_type, "XRAY");
    assert.equal(capturedWhere.booking_mode, "SELF_BOOKING");
    assert.equal(capturedOrder.serviceType, "XRAY");
    assert.equal(capturedOrder.labScheduleId, 7);
    assert.match(capturedOrder.bookingCode, /^XQ-/);
    assert.equal(created.service_type, "XRAY");
  } finally {
    labRepository.findTests = originalFindTests;
    labRepository.findPatientProfile = originalFindPatientProfile;
    labRepository.findScheduleById = originalFindScheduleById;
    labRepository.createOrder = originalCreateOrder;
  }
}

testOwnershipFilters();
await testPatientRedaction();
testRoleMiddleware();
testUploadRateLimit();
await testScheduleScope();
await testServiceBookingMode();

console.log("Clinical permission checks passed");
