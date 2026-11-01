import { normalizeKnowledgeText, tokenizeKnowledgeText } from "./knowledge.normalizer.js";

export function scoreKnowledgeChunk(query, title, content) {
  // Heuristic lexical relevance in [0, 1], not a probability/confidence score:
  // 0.65 keyword coverage + 0.25 title overlap + 0.10 heading overlap + exact phrase boost.
  const queryTerms = [...new Set(tokenizeKnowledgeText(query, { removeStopWords: true }))];
  if (queryTerms.length === 0) return 0;

  const titleTerms = new Set(tokenizeKnowledgeText(title, { removeStopWords: true }));
  const contentTerms = new Set(tokenizeKnowledgeText(content, { removeStopWords: true }));
  const heading = String(content).split(/[\n.!?]/, 1)[0].trim();
  const headingTerms = heading.length <= 100 ? new Set(tokenizeKnowledgeText(heading, { removeStopWords: true })) : new Set();
  const matched = queryTerms.filter((term) => titleTerms.has(term) || contentTerms.has(term));
  if (matched.length === 0) return 0;

  const titleMatches = matched.filter((term) => titleTerms.has(term)).length;
  const headingMatches = matched.filter((term) => headingTerms.has(term)).length;
  const coverage = matched.length / queryTerms.length;
  const titleBoost = (titleMatches / queryTerms.length) * 0.25;
  const headingBoost = (headingMatches / queryTerms.length) * 0.1;
  const phraseBoost = normalizeKnowledgeText(`${title} ${content}`).includes(normalizeKnowledgeText(query)) ? 0.1 : 0;
  return Math.min(1, Number((coverage * 0.65 + titleBoost + headingBoost + phraseBoost).toFixed(4)));
}
