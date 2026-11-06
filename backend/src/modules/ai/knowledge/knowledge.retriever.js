import { chunkArticle } from "./knowledge.chunker.js";
import { normalizeKnowledgeText, tokenizeKnowledgeText } from "./knowledge.normalizer.js";
import { scoreKnowledgeChunk } from "./knowledge.scorer.js";
import { knowledgeSearchSchema } from "./knowledge.schema.js";
import { findPublishedKnowledgeArticles } from "./knowledge.repository.js";
import { PATIENT_GUIDES } from "./patient-guides.js";
import { KNOWLEDGE_SOURCE_TYPES, MAX_KNOWLEDGE_RESULTS, MAX_KNOWLEDGE_CANDIDATES, MIN_KNOWLEDGE_SCORE } from "./knowledge.constants.js";

export { KNOWLEDGE_SOURCE_TYPES, MAX_KNOWLEDGE_RESULTS, MAX_KNOWLEDGE_CANDIDATES };
const SEARCH_FIELDS = ["title", "description", "slug", "content_markdown", "content_html"];

function buildCandidateWhere(query) {
  const terms = [...new Set(tokenizeKnowledgeText(query, { removeStopWords: true }))].slice(0, 6);
  const where = { is_active: true, is_published: true, article_type: "NEWS" };
  if (terms.length) {
    where.OR = terms.flatMap((term) => SEARCH_FIELDS.map((field) => ({ [field]: { contains: term } })));
  }
  return where;
}

function isRequestedSource(sourceTypes, type) {
  return !sourceTypes || sourceTypes.includes(type);
}

export async function retrieveKnowledge({ query, sourceTypes, limit = MAX_KNOWLEDGE_RESULTS }, dependencies = {}) {
  const validated = knowledgeSearchSchema.parse({ query, sourceTypes, limit });
  query = validated.query;
  sourceTypes = validated.sourceTypes;
  limit = validated.limit ?? MAX_KNOWLEDGE_RESULTS;
  const normalizedQuery = normalizeKnowledgeText(query);
  const requestedTypes = sourceTypes?.length ? sourceTypes : KNOWLEDGE_SOURCE_TYPES;
  const resultLimit = Math.min(Math.max(Number(limit) || MAX_KNOWLEDGE_RESULTS, 1), MAX_KNOWLEDGE_RESULTS);
  const empty = { source: "RAG", query, returnedCount: 0, items: [] };
  if (!normalizedQuery || !tokenizeKnowledgeText(query, { removeStopWords: true }).length) return empty;

  const articles = isRequestedSource(requestedTypes, "ARTICLE")
    ? await (dependencies.findArticles || findPublishedKnowledgeArticles)(query, {
      db: dependencies.db,
      take: MAX_KNOWLEDGE_CANDIDATES,
    })
    : [];

  const ranked = articles.flatMap((article) => {
    if (article.article_type !== "NEWS" || article.is_active !== true || article.is_published !== true) return [];
    const chunks = chunkArticle(article);
    return chunks.map((chunk) => ({
      documentId: `article-${article.id}`,
      chunkId: chunk.id,
      sourceType: "ARTICLE",
      title: article.title,
      content: chunk.content,
      score: scoreKnowledgeChunk(query, article.title, chunk.content),
      url: `/articles/${article.id}`,
      updatedAt: article.updated_at ?? null,
    }));
  })
    .filter((item) => item.score >= MIN_KNOWLEDGE_SCORE)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title) || a.chunkId.localeCompare(b.chunkId));

  const guideChunks = isRequestedSource(requestedTypes, "SYSTEM_GUIDE")
    ? PATIENT_GUIDES.flatMap((guide) => [
      ...guide.sections.map((section) => ({
        chunkId: `guide-${guide.id}-${section.id}`,
        section: section.title,
        content: `${section.title}\n${section.content}`,
      })),
      ...guide.faqs.map((faq, index) => ({
        chunkId: `guide-${guide.id}-faq-${index + 1}`,
        section: faq.question,
        content: `Câu hỏi: ${faq.question}\nTrả lời: ${faq.answer}`,
      })),
    ]).map((chunk) => ({
      documentId: guide.id,
      chunkId: chunk.chunkId,
      sourceType: "SYSTEM_GUIDE",
      title: guide.title,
      category: guide.category,
      section: chunk.section,
      content: chunk.content,
      score: scoreKnowledgeChunk(query, guide.title, chunk.content),
      url: guide.sourceUrl,
      updatedAt: guide.updatedAt,
    }))
    : [];

  const seenChunks = new Set();
  const uniqueRanked = [...ranked, ...guideChunks]
    .filter((item) => item.score >= MIN_KNOWLEDGE_SCORE)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title) || a.chunkId.localeCompare(b.chunkId))
    .filter((item) => {
      const key = normalizeKnowledgeText(item.content);
      if (seenChunks.has(key)) return false;
      seenChunks.add(key);
      return true;
    }).slice(0, resultLimit);

  return { source: "RAG", query, returnedCount: uniqueRanked.length, items: uniqueRanked };
}
