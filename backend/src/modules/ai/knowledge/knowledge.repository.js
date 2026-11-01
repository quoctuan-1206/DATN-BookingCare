import prisma from "../../../config/prisma.js";
import { tokenizeKnowledgeText } from "./knowledge.normalizer.js";
import { KnowledgeRetrievalError } from "./knowledge.error.js";
import { MAX_KNOWLEDGE_CANDIDATES } from "./knowledge.constants.js";

const SEARCH_FIELDS = ["title", "description", "slug", "content_markdown", "content_html"];

function buildCandidateWhere(query) {
  const terms = [...new Set(tokenizeKnowledgeText(query, { removeStopWords: true }))].slice(0, 6);
  const where = { is_active: true, is_published: true, article_type: "NEWS" };
  if (terms.length) {
    where.OR = terms.flatMap((term) => SEARCH_FIELDS.map((field) => ({ [field]: { contains: term } })));
  }
  return where;
}

export async function findPublishedKnowledgeArticles(query, { db = prisma, take = MAX_KNOWLEDGE_CANDIDATES } = {}) {
  try {
    return await db.articles.findMany({
      where: buildCandidateWhere(query),
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        content_markdown: true,
        content_html: true,
        article_type: true,
        is_active: true,
        is_published: true,
        updated_at: true,
      },
      orderBy: [{ updated_at: "desc" }, { id: "desc" }],
      take: Math.min(Math.max(take, 1), MAX_KNOWLEDGE_CANDIDATES),
    });
  } catch {
    // Do not forward driver errors, query text, or connection details.
    throw new KnowledgeRetrievalError();
  }
}
