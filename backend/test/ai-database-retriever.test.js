import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { retrieveDoctors } from "../src/modules/ai/retrieval/doctor.retriever.js";
import { retrieveClinics } from "../src/modules/ai/retrieval/clinic.retriever.js";
import { retrieveSpecialties } from "../src/modules/ai/retrieval/specialty.retriever.js";
import { retrieveDatabase } from "../src/modules/ai/retrieval/database.retriever.js";
import { mapDoctorItem } from "../src/modules/ai/retrieval/retrieval.mapper.js";
import { DatabaseRetrievalError } from "../src/modules/ai/retrieval/retrieval.error.js";
import { AiService } from "../src/services/ai.service.js";
import aiService from "../src/services/ai.service.js";
import aiRoutes from "../src/routes/ai.routes.js";

const emptyFilters = {
  specialty: null,
  doctorName: null,
  clinicName: null,
  district: null,
  maxPrice: null,
};

const workplace = (overrides = {}) => ({
  id: 31,
  consultation_fee: 275000,
  room: "A2",
  clinics: { id: 8, name: "MediUTE Clinic", address: "Thủ Đức" },
  specialties: { id: 4, name: "Tim mạch" },
  ...overrides,
});

function doctorRecord(overrides = {}) {
  return {
    id: 12,
    first_name: "An",
    last_name: "Nguyễn Văn",
    avatar: null,
    doctor_profiles: {
      degree: "BS",
      position: "Bác sĩ",
      experience_years: 8,
      consultation_fee: 300000,
      doctor_workplaces: [workplace()],
    },
    ...overrides,
  };
}

test("doctor retriever combines filters on one active workplace and uses a stable capped query", async () => {
  let args;
  const db = { users: { findMany: async (query) => { args = query; return [doctorRecord()]; } } };
  const result = await retrieveDoctors({
    ...emptyFilters,
    doctorName: "Nguyễn Văn An",
    specialty: "Tim mạch",
    clinicName: "MediUTE",
    district: "Thủ Đức",
    maxPrice: 300000,
  }, { db });

  const workplaceWhere = args.where.doctor_profiles.doctor_workplaces.some;
  assert.equal(args.where.role_id, 2);
  assert.equal(args.where.is_active, true);
  assert.equal(args.take, 10);
  assert.deepEqual(args.orderBy, { id: "asc" });
  assert.equal(workplaceWhere.is_active, true);
  assert.equal(workplaceWhere.specialties.name.contains, "Tim mạch");
  assert.equal(workplaceWhere.clinics.name.contains, "MediUTE");
  assert.equal(workplaceWhere.clinics.address.contains, "Thủ Đức");
  assert.deepEqual(workplaceWhere.OR, [
    { consultation_fee: { lte: 300000 } },
    { consultation_fee: null, doctor_profiles: { consultation_fee: { lte: 300000 } } },
    { consultation_fee: null, doctor_profiles: { consultation_fee: null } },
  ]);
  assert.deepEqual(args.where.AND.map((condition) => condition.OR.length), [2, 2, 2]);
  assert.equal("email" in args.select, false);
  assert.equal("phone" in args.select, false);
  assert.equal(result.total, 1);
  assert.equal(result.items[0].workplaces[0].consultation_fee, 275000);
  assert.equal("email" in result.items[0], false);
});

test("doctor DTO applies workplace fee then profile default and emits JSON-safe IDs", () => {
  const item = mapDoctorItem({
    ...doctorRecord({ id: 12n }),
    doctor_profiles: {
      ...doctorRecord().doctor_profiles,
      consultation_fee: 350000,
      doctor_workplaces: [
        workplace({ id: 31n, consultation_fee: null }),
        workplace({ id: 32n, consultation_fee: 0 }),
      ],
    },
  });
  assert.equal(item.id, "12");
  assert.equal(item.workplaces[0].id, "31");
  assert.equal(item.workplaces[0].consultation_fee, 350000);
  assert.equal(item.workplaces[1].consultation_fee, 0);
  assert.equal("phone" in item, false);
  assert.equal("date_of_birth" in item, false);
});

test("doctor retriever returns an empty database result when there are no matching rows", async () => {
  const result = await retrieveDoctors(emptyFilters, {
    db: { users: { findMany: async () => [] } },
  });
  assert.deepEqual(result, { source: "DATABASE", entityType: "DOCTOR", total: 0, items: [] });
});

test("clinic retriever applies name, district, specialty, doctor and fee filters and maps compact matches", async () => {
  let args;
  const clinic = {
    id: 8,
    name: "MediUTE Clinic",
    address: "Thủ Đức",
    image: null,
    description: "Public clinic description",
    doctor_workplaces: [{
      ...workplace(),
      doctor_profiles: {
        degree: "BS",
        consultation_fee: 300000,
        users: { id: 12, first_name: "An", last_name: "Nguyễn Văn", avatar: null },
      },
    }],
    email: "private@example.test",
    phone: "0123456789",
  };
  const result = await retrieveClinics({
    ...emptyFilters,
    clinicName: "MediUTE",
    district: "Thủ Đức",
    specialty: "Tim mạch",
    doctorName: "Nguyễn An",
    maxPrice: 300000,
  }, { db: { clinics: { findMany: async (query) => { args = query; return [clinic]; } } } });

  const workplaceWhere = args.where.doctor_workplaces.some;
  assert.equal(args.where.name.contains, "MediUTE");
  assert.equal(args.where.address.contains, "Thủ Đức");
  assert.equal(workplaceWhere.is_active, true);
  assert.equal(workplaceWhere.specialties.name.contains, "Tim mạch");
  assert.equal(workplaceWhere.OR.length, 3);
  assert.deepEqual(workplaceWhere.doctor_profiles.users.AND.map((condition) => condition.OR.length), [2, 2]);
  assert.equal(args.take, 10);
  assert.deepEqual(args.orderBy, { id: "asc" });
  assert.equal("email" in args.select, false);
  assert.equal("phone" in args.select, false);
  assert.equal(result.items[0].doctors[0].id, 12);
  assert.equal(result.items[0].specialties[0].name, "Tim mạch");
  assert.equal("email" in result.items[0], false);
});

test("clinic retriever can search by name/location without requiring a doctor filter", async () => {
  let args;
  const result = await retrieveClinics({ ...emptyFilters, district: "Thủ Đức" }, {
    db: { clinics: { findMany: async (query) => { args = query; return []; } } },
  });
  assert.equal(args.where.is_active, true);
  assert.equal(args.where.address.contains, "Thủ Đức");
  assert.equal("doctor_workplaces" in args.where, false);
  assert.deepEqual(result.items, []);
  assert.equal(result.total, 0);
});

test("specialty retriever lists or searches only active specialties with a bounded stable query", async () => {
  let args;
  const db = { specialties: { findMany: async (query) => { args = query; return [{ id: 4, name: "Tim mạch", description: null, image: null }]; } } };
  const result = await retrieveSpecialties({ ...emptyFilters, specialty: "Tim" }, { db });
  assert.equal(args.where.is_active, true);
  assert.equal(args.where.name.contains, "Tim");
  assert.equal(args.take, 10);
  assert.deepEqual(args.orderBy, { id: "asc" });
  assert.deepEqual(result.items, [{ id: 4, name: "Tim mạch", description: null, image: null }]);
});

test("specialty retriever returns no fabricated items when no specialty matches", async () => {
  const result = await retrieveSpecialties({ ...emptyFilters, specialty: "No match" }, {
    db: { specialties: { findMany: async () => [] } },
  });
  assert.deepEqual(result, { source: "DATABASE", entityType: "SPECIALTY", total: 0, items: [] });
});

test("retrieval router sends only eligible search intents to the matching retriever", async () => {
  const calls = [];
  const dependencies = {
    retrieveDoctors: async (filters) => { calls.push(["doctor", filters]); return "doctor-result"; },
    retrieveClinics: async (filters) => { calls.push(["clinic", filters]); return "clinic-result"; },
    retrieveSpecialties: async (filters) => { calls.push(["specialty", filters]); return "specialty-result"; },
  };
  assert.equal(await retrieveDatabase({ intent: "SEARCH_DOCTOR", retrievalMode: "DATABASE", filters: emptyFilters }, dependencies), "doctor-result");
  assert.equal(await retrieveDatabase({ intent: "SEARCH_DOCTOR", retrievalMode: "HYBRID", filters: emptyFilters }, dependencies), "doctor-result");
  assert.equal(await retrieveDatabase({ intent: "SEARCH_CLINIC", retrievalMode: "DATABASE", filters: emptyFilters }, dependencies), "clinic-result");
  assert.equal(await retrieveDatabase({ intent: "SEARCH_SPECIALTY", retrievalMode: "DATABASE", filters: emptyFilters }, dependencies), "specialty-result");
  assert.deepEqual(await retrieveDatabase({ intent: "MEDICAL_QUESTION", retrievalMode: "HYBRID", filters: emptyFilters }, dependencies), {
    source: "NONE", entityType: null, total: 0, items: [],
  });
  assert.deepEqual(await retrieveDatabase({ intent: "SEARCH_DOCTOR", retrievalMode: "RAG", filters: emptyFilters }, dependencies), {
    source: "NONE", entityType: null, total: 0, items: [],
  });
  assert.deepEqual(calls.map(([type]) => type), ["doctor", "doctor", "clinic", "specialty"]);
  await assert.rejects(retrieveDatabase({ intent: "SEARCH_DOCTOR", retrievalMode: "DATABASE", filters: { ...emptyFilters, extra: "unsafe" } }));
});

test("database failures return a sanitized error without database details", async () => {
  await assert.rejects(
    retrieveDoctors(emptyFilters, { db: { users: { findMany: async () => { throw new Error("SELECT * from users password=secret"); } } } }),
    (error) => error instanceof DatabaseRetrievalError && !error.message.includes("SELECT") && error.statusCode === 503,
  );
});

test("AI service preserves analyze and adds analyzed database results for retrieve", async () => {
  const analysis = {
    intent: "SEARCH_DOCTOR",
    retrievalMode: "DATABASE",
    filters: emptyFilters,
  };
  const calls = [];
  const service = new AiService({
    analyzeMessage: async (message) => { calls.push(["analyze", message]); return analysis; },
    databaseRetriever: async (value) => { calls.push(["retrieve", value]); return { source: "DATABASE", entityType: "DOCTOR", total: 0, items: [] }; },
  });
  assert.deepEqual(await service.analyze("Tìm bác sĩ"), analysis);
  assert.deepEqual(await service.retrieve("Tìm bác sĩ"), {
    message: "Tìm bác sĩ",
    ...analysis,
    retrieval: { source: "DATABASE", entityType: "DOCTOR", total: 0, items: [] },
  });
  assert.equal(calls.length, 3);
  await assert.rejects(new AiService({
    analyzeMessage: async () => ({ ...analysis, filters: { ...emptyFilters, rawQuery: "DROP" } }),
  }).retrieve("bad input"));
});

test("AI routes expose separate POST endpoints for analyze and retrieve", () => {
  const paths = aiRoutes.stack
    .filter((layer) => layer.route)
    .map((layer) => ({ path: layer.route.path, methods: JSON.parse(JSON.stringify(layer.route.methods)) }));
  assert.deepEqual(paths, [
    { path: "/analyze", methods: { post: true } },
    { path: "/retrieve", methods: { post: true } },
    { path: "/knowledge/search", methods: { post: true } },
    { path: "/chat", methods: { post: true } },
  ]);
});

test("POST /retrieve validates its request and returns retrieval JSON without changing /analyze", async () => {
  const originalRetrieve = aiService.retrieve;
  const originalAnalyze = aiService.analyze;
  aiService.retrieve = async (message) => ({
    message,
    intent: "SEARCH_DOCTOR",
    retrievalMode: "DATABASE",
    filters: emptyFilters,
    retrieval: { source: "DATABASE", entityType: "DOCTOR", total: 0, items: [] },
  });
  aiService.analyze = async () => ({ intent: "GENERAL", retrievalMode: "NONE", filters: emptyFilters });

  const app = express();
  app.use(express.json());
  app.use("/api/ai", aiRoutes);
  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const baseUrl = `http://127.0.0.1:${server.address().port}/api/ai`;
    const retrieved = await fetch(`${baseUrl}/retrieve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Tìm bác sĩ" }),
    });
    assert.equal(retrieved.status, 200);
    assert.equal((await retrieved.json()).data.retrieval.entityType, "DOCTOR");

    const invalid = await fetch(`${baseUrl}/retrieve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: " ", prismaQuery: { deleteMany: {} } }),
    });
    assert.equal(invalid.status, 400);

    const analyzed = await fetch(`${baseUrl}/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Xin chào" }),
    });
    assert.equal(analyzed.status, 200);
    assert.equal((await analyzed.json()).data.analysis.intent, "GENERAL");
  } finally {
    aiService.retrieve = originalRetrieve;
    aiService.analyze = originalAnalyze;
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
});
