import test from "node:test";
import assert from "node:assert/strict";
import { ConsultationService } from "../src/services/consultation.service.js";
import { emitConsultationStatus } from "../src/realtime/consultation-socket.js";

function makeHarness({ sessionStatus = "IN_PROGRESS", startedAt = new Date(Date.now() - 75_000), past = false } = {}) {
  const localDate = new Date(Date.now() + 7 * 60 * 60 * 1000 - (past ? 24 * 60 * 60 * 1000 : 0)).toISOString().slice(0, 10);
  const state = {
    appointmentStatus: "CONFIRMED",
    session: {
      id: 19,
      appointment_id: 47,
      room_id: "test-room",
      status: sessionStatus,
      started_at: startedAt,
      ended_at: null,
      duration_seconds: null,
    },
    writes: 0,
    creates: 0,
  };
  const appointment = () => ({
    id: 47,
    status: state.appointmentStatus,
    consultation_type: "ONLINE",
    schedules: {
      work_date: new Date(`${localDate}T00:00:00.000Z`),
      start_time: new Date("1970-01-01T00:00:00.000Z"),
      end_time: new Date("1970-01-01T23:59:00.000Z"),
      doctor_workplaces: { doctor_id: 7 },
    },
    patient_profiles: { account_id: 22 },
    consultation_session: state.session ? { ...state.session } : null,
  });
  const prisma = {
    appointments: {
      findUnique: async () => appointment(),
    },
    consultation_sessions: {
      create: async ({ data }) => {
        state.creates += 1;
        state.session = { id: 19, ...data, status: "WAITING" };
        return state.session;
      },
      updateMany: async ({ where, data }) => {
        if (
          state.session?.id === where.id &&
          where.status.in.includes(state.session.status)
        ) {
          state.writes += 1;
          state.session = { ...state.session, ...data };
          return { count: 1 };
        }
        return { count: 0 };
      },
      findUnique: async () => (state.session ? { ...state.session } : null),
    },
  };
  return { service: new ConsultationService(prisma), state };
}

const doctor = { id: 7, role: { name: "Doctor" } };
const patient = { id: 22, role: { name: "Patient" } };

test("assigned doctor completes the session and records duration without changing appointment", async () => {
  const { service, state } = makeHarness();
  const result = await service.finish(doctor, 47);

  assert.equal(result.completedNow, true);
  assert.equal(result.session.status, "COMPLETED");
  assert.ok(result.session.ended_at instanceof Date);
  assert.ok(result.session.duration_seconds >= 75);
  assert.equal(state.appointmentStatus, "CONFIRMED");
  assert.equal(state.writes, 1);
});

test("patient cannot finish the consultation session", async () => {
  const { service, state } = makeHarness();
  await assert.rejects(service.finish(patient, 47), { statusCode: 403 });
  assert.equal(state.session.status, "IN_PROGRESS");
  assert.equal(state.writes, 0);
});

test("a doctor not assigned to the appointment cannot finish its session", async () => {
  const { service, state } = makeHarness();
  await assert.rejects(service.finish({ ...doctor, id: 8 }, 47), { statusCode: 403 });
  assert.equal(state.writes, 0);
});

test("repeated completion is idempotent and does not overwrite the first end time", async () => {
  const { service, state } = makeHarness();
  const first = await service.finish(doctor, 47);
  const firstEndedAt = first.session.ended_at;
  const repeated = await service.finish(doctor, 47);

  assert.equal(repeated.completedNow, false);
  assert.equal(repeated.session.ended_at.getTime(), firstEndedAt.getTime());
  assert.equal(state.writes, 1);
  assert.equal(state.creates, 0);
});

test("a completed session remains idempotent after the room time window", async () => {
  const { service, state } = makeHarness({ sessionStatus: "COMPLETED", past: true });
  state.session.ended_at = new Date(Date.now() - 60_000);
  const originalEndedAt = state.session.ended_at.getTime();
  const result = await service.finish(doctor, 47);
  assert.equal(result.completedNow, false);
  assert.equal(result.session.ended_at.getTime(), originalEndedAt);
  assert.equal(state.writes, 0);
});

test("an authorized user can read the completed session summary after the room window", async () => {
  const { service, state } = makeHarness({ sessionStatus: "COMPLETED", past: true });
  const session = await service.get(doctor, 47);
  assert.equal(session.status, "COMPLETED");
  assert.equal(state.creates, 0);
});

test("parallel finish requests complete the session once", async () => {
  const { service, state } = makeHarness();
  const results = await Promise.all([
    service.finish(doctor, 47),
    service.finish(doctor, 47),
  ]);

  assert.equal(results.filter((result) => result.completedNow).length, 1);
  assert.equal(state.writes, 1);
  assert.equal(state.appointmentStatus, "CONFIRMED");
});

test("ending a session that never started leaves duration unset", async () => {
  const { service } = makeHarness({ sessionStatus: "WAITING", startedAt: null });
  const result = await service.finish(doctor, 47);
  assert.equal(result.session.status, "COMPLETED");
  assert.equal(result.session.duration_seconds, null);
});

test("a cancelled session is returned unchanged while a failed session cannot be completed", async () => {
  const cancelled = makeHarness({ sessionStatus: "CANCELLED" });
  const repeatedCancel = await cancelled.service.finish(doctor, 47);
  assert.equal(repeatedCancel.completedNow, false);
  assert.equal(repeatedCancel.session.status, "CANCELLED");
  assert.equal(cancelled.state.writes, 0);

  const failed = makeHarness({ sessionStatus: "FAILED" });
  await assert.rejects(failed.service.finish(doctor, 47), { statusCode: 409 });
  assert.equal(failed.state.session.status, "FAILED");
  assert.equal(failed.state.writes, 0);
});

test("ending a schedule without a session does not create one", async () => {
  const { service, state } = makeHarness();
  state.session = null;
  await assert.rejects(service.finish(doctor, 47), { statusCode: 409 });
  assert.equal(state.creates, 0);
});

test("completion realtime event carries session end time and duration to the room", () => {
  let emitted = null;
  const fakeIo = {
    to(roomId) {
      return { emit: (event, payload) => { emitted = { roomId, event, payload }; } };
    },
  };
  const endedAt = new Date();
  emitConsultationStatus(fakeIo, "consultation-room", "COMPLETED", {
    appointment_id: 47,
    ended_at: endedAt,
    duration_seconds: 75,
  });
  assert.deepEqual(emitted, {
    roomId: "consultation-room",
    event: "consultation:status",
    payload: {
      status: "COMPLETED",
      appointment_id: 47,
      ended_at: endedAt,
      duration_seconds: 75,
    },
  });
});
