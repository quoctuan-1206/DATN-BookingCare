import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { buildChatContext, MAX_CONTEXT_CHARS } from "../src/modules/ai/context/context.builder.js";
import { generateChatAnswer, ChatGenerationError } from "../src/modules/ai/generation/answer.generator.js";
import { CHAT_SYSTEM_INSTRUCTION, makeChatGenerationInput } from "../src/modules/ai/generation/answer.prompt.js";
import { AiService } from "../src/services/ai.service.js";
import aiService from "../src/services/ai.service.js";
import aiRoutes from "../src/routes/ai.routes.js";

const emptyFilters = { specialty: null, doctorName: null, clinicName: null, district: null, maxPrice: null };
const makeAnalysis = (intent, retrievalMode, filters = emptyFilters) => ({ intent, retrievalMode, filters });
const doctorResult = {
  source: "DATABASE",
  entityType: "DOCTOR",
  total: 1,
  items: [{
    id: "12", name: "BS An Nguyễn", degree: "BS", position: "Bác sĩ", experience_years: 8,
    workplaces: [{
      id: "31", clinic: { id: "8", name: "MediUTE", address: "Thủ Đức" },
      specialty: { id: "4", name: "Tim mạch" }, consultation_fee: 300000, room: "A2",
    }],
    email: "private@example.test", phone: "0900000000",
  }],
};
const ragResult = {
  source: "RAG", query: "đau ngực", returnedCount: 1,
  items: [{
    documentId: "article-17", chunkId: "article-17-chunk-1", sourceType: "ARTICLE",
    title: "Sức khỏe tim mạch", content: "Nếu đau ngực dữ dội, hãy tìm trợ giúp y tế.",
    score: 0.8, url: "/articles/17",
    }, {
      documentId: "article-17", chunkId: "article-17-copy", sourceType: "ARTICLE",
      title: "Sức khỏe tim mạch", content: "Nếu đau ngực dữ dội, hãy tìm trợ giúp y tế.",
      score: 0.7, url: "/articles/17",
    }],
};

test("context builder keeps a bounded allowlist of retrieved data and verifies stable sources", () => {
  const { context, sources } = buildChatContext({
    message: "Tìm bác sĩ và email hidden@example.test Bearer secret-token",
    analysis: makeAnalysis("SEARCH_DOCTOR", "DATABASE"),
    databaseResults: doctorResult,
    knowledgeResults: ragResult,
  });
  const serialized = JSON.stringify(context);
  assert.ok(serialized.length <= MAX_CONTEXT_CHARS);
  assert.doesNotMatch(serialized, /private@example\.test|hidden@example\.test|0900000000|secret-token/);
  assert.match(serialized, /email removed|token removed/);
  assert.equal(context.retrieval.database.records[0].data.workplaces[0].consultationFeeVnd, 300000);
  assert.equal("phone" in context.retrieval.database.records[0].data, false);
  assert.equal(context.retrieval.knowledge.records.length, 1);
  assert.deepEqual(sources, [
    { id: "doctor-12", type: "DOCTOR", title: "BS An Nguyễn", url: null },
    { id: "article-17", type: "ARTICLE", title: "Sức khỏe tim mạch", url: "/articles/17" },
  ]);
});

test("context builder ignores unknown database types and invalid/fabricated article references", () => {
  const { context, sources } = buildChatContext({
    message: "Câu hỏi",
    analysis: makeAnalysis("GENERAL", "NONE"),
    databaseResults: { source: "DATABASE", entityType: "PATIENT", items: [{ id: 1, name: "Patient" }] },
    knowledgeResults: { source: "RAG", items: [
      { documentId: "article-1", sourceType: "ARTICLE", title: "Fake URL", content: "text", url: "https://evil.test" },
      { documentId: "patient-1", sourceType: "ARTICLE", title: "Fake source", content: "text", url: "/articles/1" },
    ] },
  });
  assert.deepEqual(context.retrieval.database.records, []);
  assert.deepEqual(context.retrieval.knowledge.records.map((record) => ({ sourceId: record.sourceId, url: record.url })), [
    { sourceId: "article-1", url: null },
  ]);
  assert.deepEqual(sources, [{ id: "article-1", type: "ARTICLE", title: "Fake URL", url: null }]);
});

test("context builder verifies patient guide citations against the published guide catalog", () => {
  const { context, sources } = buildChatContext({
    message: "Cách đặt lịch khám?",
    analysis: makeAnalysis("SYSTEM_GUIDE", "RAG"),
    databaseResults: { source: "NONE", entityType: null, items: [] },
    knowledgeResults: { source: "RAG", items: [
      { documentId: "patient-booking-guide", chunkId: "guide-patient-booking-guide-steps", sourceType: "SYSTEM_GUIDE", content: "Chọn giờ khám rồi xác nhận.", url: "/help/patient-booking-guide" },
      { documentId: "patient-internal-guide", chunkId: "guide-internal", sourceType: "SYSTEM_GUIDE", content: "Nội bộ.", url: "/help/patient-internal-guide" },
      { documentId: "patient-booking-guide", chunkId: "guide-fake-url", sourceType: "SYSTEM_GUIDE", content: "Sai liên kết.", url: "https://evil.test" },
    ] },
  });
  assert.deepEqual(sources, [{ id: "patient-booking-guide", type: "SYSTEM_GUIDE", title: "Đặt lịch khám", url: "/help/patient-booking-guide" }]);
  assert.equal(context.retrieval.knowledge.records.length, 1);
});

test("context builder drops tail records to enforce total context size", () => {
  const hugeKnowledge = {
    source: "RAG", returnedCount: 10,
    items: Array.from({ length: 10 }, (_, index) => ({
      documentId: `article-${index + 1}`, chunkId: `article-${index + 1}-chunk-1`,
      sourceType: "ARTICLE", title: `Article ${index + 1}`, content: "x".repeat(1500),
      score: 0.5, url: `/articles/${index + 1}`,
    })),
  };
  const result = buildChatContext({
    message: "question",
    analysis: makeAnalysis("MEDICAL_QUESTION", "RAG"),
    databaseResults: { source: "NONE", entityType: null, items: [] },
    knowledgeResults: hugeKnowledge,
  });
  assert.ok(JSON.stringify(result.context).length <= MAX_CONTEXT_CHARS);
  assert.equal(result.context.retrieval.knowledge.records.length, result.sources.length);
});

test("generation sends untrusted data as user content with fixed system instruction and structured schema", async () => {
  let input;
  const result = await generateChatAnswer({ message: "hello", context: { userQuestion: "hello" } }, {
    generate: async (value) => {
      input = value;
      return { text: JSON.stringify({ answer: "Xin chào!", sourceIds: [], suggestions: ["Tôi có thể giúp gì?"] }) };
    },
    logger: () => {},
  });
  assert.equal(input.systemInstruction, CHAT_SYSTEM_INSTRUCTION);
  assert.match(input.systemInstruction, /không đáng tin cậy/i);
  assert.match(input.contents, /UNTRUSTED_USER_AND_RETRIEVAL_DATA/);
  assert.match(input.contents, /"message":"hello"/);
  assert.equal(input.responseSchema.type, "OBJECT");
  assert.deepEqual(result.sourceIds, []);
});

test("generation validates JSON with Zod and never returns provider details", async () => {
  await assert.rejects(generateChatAnswer({ message: "x", context: {} }, {
    generate: async () => ({ text: "not json" }), logger: () => {},
  }), (error) => error instanceof ChatGenerationError && error.code === "GEMINI_INVALID_RESPONSE");
  await assert.rejects(generateChatAnswer({ message: "x", context: {} }, {
    generate: async () => ({ text: JSON.stringify({ answer: "", sourceIds: [], suggestions: [], internal: "secret" }) }), logger: () => {},
  }), (error) => error instanceof ChatGenerationError && error.code === "GEMINI_INVALID_RESPONSE");
});

test("generation safely classifies timeout and quota without logging credentials or raw errors", async () => {
  for (const [error, code, status] of [
    [Object.assign(new Error("request timed out; api key=secret-value"), { name: "TimeoutError" }), "GEMINI_TIMEOUT", 504],
    [Object.assign(new Error("RESOURCE_EXHAUSTED api key=secret-value"), { status: 429 }), "GEMINI_RATE_LIMITED", 503],
  ]) {
    const logs = [];
    await assert.rejects(generateChatAnswer({ message: "x", context: {} }, {
      generate: async () => { throw error; }, logger: (message) => logs.push(message),
    }), (caught) => caught.code === code && caught.statusCode === status && !caught.message.includes("secret-value"));
    assert.doesNotMatch(logs.join(" "), /secret-value|timed out|RESOURCE_EXHAUSTED/);
  }
});

test("chat routes DATABASE, RAG, HYBRID, and NONE without mixing their records", async () => {
  const calls = [];
  const service = new AiService({
    analyzeMessage: async (message) => message === "mixed"
      ? makeAnalysis("MEDICAL_QUESTION", "HYBRID", { ...emptyFilters, specialty: "Tim mạch" })
      : message === "rag" ? makeAnalysis("MEDICAL_QUESTION", "RAG")
        : message === "none" ? makeAnalysis("GENERAL", "NONE")
          : makeAnalysis("SEARCH_DOCTOR", "DATABASE"),
    databaseRetriever: async (analysis) => { calls.push(["db", analysis.intent]); return doctorResult; },
    knowledgeRetriever: async ({ query }) => { calls.push(["rag", query]); return ragResult; },
    answerGenerator: async ({ context }) => ({
      answer: "Thông tin đã tra cứu.",
      sourceIds: context.retrieval.knowledge.records.length ? ["article-17"] : ["doctor-12"],
      suggestions: [],
    }),
  });

  const database = await service.chat("doctor");
  assert.equal(database.sources[0].type, "DOCTOR");
  assert.equal(database.retrievalMode, "DATABASE");
  const rag = await service.chat("rag");
  assert.equal(rag.sources[0].type, "ARTICLE");
  const hybrid = await service.chat("mixed");
  assert.equal(hybrid.sources[0].type, "ARTICLE");
  assert.equal(calls.some(([type, intent]) => type === "db" && intent === "SEARCH_DOCTOR"), true);
  assert.equal(calls.some(([type, query]) => type === "rag" && query === "mixed"), true);
  const none = await service.chat("none");
  assert.deepEqual(none.sources, []);
  assert.equal(calls.length, 4);
});

test("chat uses deterministic no-data responses and rejects fabricated citations", async () => {
  let generationCalls = 0;
  const noDataService = new AiService({
    analyzeMessage: async () => makeAnalysis("SEARCH_DOCTOR", "DATABASE"),
    databaseRetriever: async () => ({ source: "DATABASE", entityType: "DOCTOR", total: 0, items: [] }),
    answerGenerator: async () => { generationCalls += 1; throw new Error("must not run"); },
  });
  const noData = await noDataService.chat("find a doctor");
  assert.match(noData.answer, /chưa tìm thấy/);
  assert.equal(noData.answerOrigin, "DETERMINISTIC");
  assert.equal(generationCalls, 0);

  const invalidCitationService = new AiService({
    analyzeMessage: async () => makeAnalysis("SEARCH_DOCTOR", "DATABASE"),
    databaseRetriever: async () => doctorResult,
    answerGenerator: async () => ({ answer: "Bác sĩ tự tạo.", sourceIds: ["doctor-999"], suggestions: [] }),
  });
  const rejected = await invalidCitationService.chat("find a doctor");
  assert.match(rejected.answer, /chưa thể xác minh nguồn/);
  assert.deepEqual(rejected.sources, []);
});

test("emergency symptoms receive immediate deterministic guidance without retrieval or Gemini", async () => {
  const service = new AiService({
    analyzeMessage: async () => { throw new Error("analysis must be skipped"); },
    databaseRetriever: async () => { throw new Error("database must be skipped"); },
    knowledgeRetriever: async () => { throw new Error("RAG must be skipped"); },
    answerGenerator: async () => { throw new Error("Gemini must be skipped"); },
  });
  const response = await service.chat("Người nhà tôi đang bất tỉnh");
  assert.equal(response.answerOrigin, "DETERMINISTIC");
  assert.equal(response.retrievalMode, "NONE");
  assert.deepEqual(response.sources, []);
  assert.match(response.answer, /cấp cứu/);
});

test("POST /chat validates the body and returns only the structured public response", async () => {
  const originalChat = aiService.chat;
  aiService.chat = async (message) => ({ answer: "Xin chào", answerOrigin: "GEMINI", intent: "GENERAL", retrievalMode: "NONE", sources: [], suggestions: [] });
  const app = express();
  app.use(express.json());
  app.use("/api/ai", aiRoutes);
  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
    const url = `http://127.0.0.1:${server.address().port}/api/ai/chat`;
    const response = await fetch(url, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: "Xin chào" }),
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true, data: {
      answer: "Xin chào", answerOrigin: "GEMINI", intent: "GENERAL", retrievalMode: "NONE", sources: [], suggestions: [],
    } });
    const invalid = await fetch(url, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: " " }),
    });
    assert.equal(invalid.status, 400);
  } finally {
    aiService.chat = originalChat;
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
});
