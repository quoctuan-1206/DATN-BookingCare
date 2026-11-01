import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { normalizeKnowledgeText, tokenizeKnowledgeText } from "../src/modules/ai/knowledge/knowledge.normalizer.js";
import { articleToPlainText, chunkArticle } from "../src/modules/ai/knowledge/knowledge.chunker.js";
import { scoreKnowledgeChunk } from "../src/modules/ai/knowledge/knowledge.scorer.js";
import { retrieveKnowledge, MAX_KNOWLEDGE_CANDIDATES } from "../src/modules/ai/knowledge/knowledge.retriever.js";
import { KnowledgeRetrievalError } from "../src/modules/ai/knowledge/knowledge.error.js";
import { AiService } from "../src/services/ai.service.js";
import aiService from "../src/services/ai.service.js";
import aiRoutes from "../src/routes/ai.routes.js";

const article = (overrides = {}) => ({
  id: 17,
  title: "Chăm sóc sức khỏe tim mạch",
  slug: "cham-soc-tim-mach",
  description: null,
  content_markdown: "## Dấu hiệu\n\nĐau ngực và khó thở cần được bác sĩ đánh giá.",
  content_html: null,
  article_type: "NEWS",
  is_active: true,
  is_published: true,
  updated_at: new Date("2026-10-01T00:00:00Z"),
  ...overrides,
});

test("knowledge normalization matches Vietnamese with and without accents and keeps negation", () => {
  assert.equal(normalizeKnowledgeText("Bác sĩ Đặng — tim mạch"), "bac si dang tim mach");
  assert.deepEqual(tokenizeKnowledgeText("không nên tự ý dùng thuốc", { removeStopWords: true }), ["khong", "nen", "tu", "y", "dung", "thuoc"]);
});

test("article content is converted to plain text and script/style content is excluded", () => {
  const content = articleToPlainText(article({
    content_html: "<h2>Hướng dẫn</h2><p>Uống thuốc &amp; theo chỉ dẫn.</p><script>secret-token</script><style>hidden</style>",
  }));
  assert.match(content, /Hướng dẫn/);
  assert.match(content, /Uống thuốc & theo chỉ dẫn/);
  assert.doesNotMatch(content, /secret-token|hidden/);
});

test("chunker bounds long article chunks and scoring prefers matching titles", () => {
  const chunks = chunkArticle(article({ content_markdown: `${"Đau ngực cần được đánh giá. ".repeat(80)}` }), { maxChars: 180, overlapChars: 20 });
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.content.length <= 180));
  assert.ok(chunks.every((chunk) => chunk.id.startsWith("article-17-chunk-")));
  assert.ok(scoreKnowledgeChunk("tim mạch", "Chăm sóc tim mạch", "Bài viết sức khỏe") > scoreKnowledgeChunk("tim mạch", "Tin sức khỏe", "Thông tin tim mạch"));
  assert.equal(scoreKnowledgeChunk("thuốc", "Chăm sóc tim mạch", "Thông tin về tim mạch"), 0);
});

test("knowledge retriever queries only published active NEWS with a bounded projection", async () => {
  let args;
  const result = await retrieveKnowledge({ query: "chăm sóc tim mạch", limit: 5 }, {
    db: { articles: { findMany: async (query) => { args = query; return [article()]; } } },
  });
  assert.equal(args.where.is_active, true);
  assert.equal(args.where.is_published, true);
  assert.equal(args.where.article_type, "NEWS");
  assert.equal(args.take, MAX_KNOWLEDGE_CANDIDATES);
  assert.deepEqual(args.orderBy, [{ updated_at: "desc" }, { id: "desc" }]);
  assert.equal("author_id" in args.select, false);
  assert.equal(result.source, "RAG");
  assert.equal(result.returnedCount, 1);
  assert.equal(result.items[0].sourceType, "ARTICLE");
  assert.equal(result.items[0].url, "/articles/17");
  assert.ok(result.items[0].score > 0);
});

test("knowledge retriever rejects unpublished or non-NEWS mocked rows and skips unsupported source types", async () => {
  let calls = 0;
  const db = { articles: { findMany: async () => { calls += 1; return [
    article({ id: 1, is_published: false }),
    article({ id: 2, is_active: false }),
    article({ id: 3, article_type: "DOCTOR" }),
  ]; } } };
  const result = await retrieveKnowledge({ query: "tim mạch" }, { db });
  assert.deepEqual(result.items, []);
  assert.deepEqual(await retrieveKnowledge({ query: "tim mạch", sourceTypes: ["FAQ"] }, { db }), {
    source: "RAG", query: "tim mạch", returnedCount: 0, items: [],
  });
  assert.equal(calls, 1);
});

test("knowledge database errors use a sanitized 503 error", async () => {
  await assert.rejects(
    retrieveKnowledge({ query: "tim mạch" }, { db: { articles: { findMany: async () => { throw new Error("SELECT secret from articles"); } } } }),
    (error) => error instanceof KnowledgeRetrievalError && error.statusCode === 503 && !error.message.includes("SELECT"),
  );
});

test("AI service routes RAG and HYBRID through knowledge while preserving the database result", async () => {
  const knowledgeCalls = [];
  const databaseCalls = [];
  let mode = "RAG";
  const service = new AiService({
    analyzeMessage: async () => ({ intent: "MEDICAL_QUESTION", retrievalMode: mode, filters: {
      specialty: null, doctorName: null, clinicName: null, district: null, maxPrice: null,
    } }),
    databaseRetriever: async (analysis) => { databaseCalls.push(analysis); return { source: "NONE", entityType: null, total: 0, items: [] }; },
    knowledgeRetriever: async (input) => { knowledgeCalls.push(input); return { source: "RAG", returnedCount: 0, items: [] }; },
  });
  const rag = await service.retrieve("đau ngực");
  assert.equal(rag.retrieval.source, "NONE");
  assert.equal(rag.knowledge.source, "RAG");
  assert.deepEqual(knowledgeCalls, [{ query: "đau ngực" }]);
  assert.equal(databaseCalls.length, 1);
  mode = "HYBRID";
  await service.retrieve("thông tin huyết áp");
  assert.equal(knowledgeCalls.length, 2);
  assert.equal(databaseCalls.length, 2);
  assert.deepEqual(await service.searchKnowledge({ query: "tìm bài" }), { source: "RAG", returnedCount: 0, items: [] });
});

test("knowledge retriever removes duplicate chunks, applies the result cap, and returns no weak matches", async () => {
  const duplicateContent = "Thông tin tim mạch hữu ích và đã được kiểm duyệt.";
  const articles = [
    article({ id: 1, content_markdown: duplicateContent }),
    article({ id: 2, content_markdown: duplicateContent }),
    ...Array.from({ length: 12 }, (_, index) => article({
      id: index + 3,
      title: `Tim mạch bài ${index}`,
      content_markdown: `Tim mạch ${index} có nội dung chi tiết khác nhau.`,
    })),
  ];
  const result = await retrieveKnowledge({ query: "tim mạch", limit: 10 }, {
    db: { articles: { findMany: async () => articles } },
  });
  assert.equal(result.items.length, 10);
  assert.equal(result.items.filter((item) => item.content === duplicateContent).length, 1);
  const weak = await retrieveKnowledge({ query: "khám da liễu" }, {
    db: { articles: { findMany: async () => [article({ content_markdown: "Tư vấn dịch vụ và thông tin sức khỏe." })] } },
  });
  assert.equal(weak.returnedCount, 0);
});

test("knowledge retriever validates direct calls with Zod", async () => {
  await assert.rejects(retrieveKnowledge({ query: " " }, { db: { articles: { findMany: async () => [] } } }));
  await assert.rejects(retrieveKnowledge({ query: "tim mạch", limit: 11 }, { db: { articles: { findMany: async () => [] } } }));
});

test("POST /knowledge/search validates input and bypasses Gemini analysis", async () => {
  const original = aiService.searchKnowledge;
  aiService.searchKnowledge = async ({ query, sourceTypes, limit }) => ({ source: "RAG", query, sourceTypes, limit, returnedCount: 0, items: [] });

  const app = express();
  app.use(express.json());
  app.use("/api/ai", aiRoutes);
  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const url = `http://127.0.0.1:${server.address().port}/api/ai/knowledge/search`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "tăng huyết áp", sourceTypes: ["ARTICLE"], limit: 4 }),
    });
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).data, {
      source: "RAG", query: "tăng huyết áp", sourceTypes: ["ARTICLE"], limit: 4, returnedCount: 0, items: [],
    });

    const invalid = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: " ", prismaQuery: { deleteMany: {} } }),
    });
    assert.equal(invalid.status, 400);
  } finally {
    aiService.searchKnowledge = original;
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
});
