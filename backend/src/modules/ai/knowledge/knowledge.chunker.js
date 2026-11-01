import { normalizeKnowledgeText } from "./knowledge.normalizer.js";

const DEFAULT_MAX_CHARS = 900;
const DEFAULT_OVERLAP_CHARS = 100;

function htmlToText(html) {
  return String(html ?? "")
    .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<\s*br\s*\/?\s*>|<\/(?:p|div|section|article|h[1-6]|li|blockquote|tr)\s*>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/[\t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function articleToPlainText(article) {
  const sources = [article.content_html, article.content_markdown, article.description].filter(Boolean);
  const cleanSource = (source) => htmlToText(source)
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~>#]/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/[\t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return sources.map(cleanSource).find(Boolean) || "";
}

function splitLongParagraph(paragraph, maxChars) {
  const pieces = [];
  let remaining = paragraph;
  while (remaining.length > maxChars) {
    const sentenceBreaks = [...remaining.slice(0, maxChars).matchAll(/[.!?;](?=\s|$)/g)];
    let splitAt = sentenceBreaks.length ? sentenceBreaks.at(-1).index + 1 : remaining.lastIndexOf(" ", maxChars);
    if (splitAt < Math.floor(maxChars * 0.55)) splitAt = maxChars;
    pieces.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }
  if (remaining) pieces.push(remaining);
  return pieces;
}

export function chunkArticle(article, { maxChars = DEFAULT_MAX_CHARS, overlapChars = DEFAULT_OVERLAP_CHARS } = {}) {
  const text = articleToPlainText(article);
  if (!text) return [];

  const paragraphs = text.split(/\n\s*\n/).flatMap((paragraph) => splitLongParagraph(paragraph.trim(), maxChars)).filter(Boolean);
  const chunks = [];
  let current = "";
  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) chunks.push(current);
    const overlap = current.slice(Math.max(0, current.length - overlapChars)).trim();
    const withOverlap = overlap ? `${overlap}\n\n${paragraph}` : paragraph;
    current = withOverlap.length <= maxChars ? withOverlap : paragraph;
  }
  if (current) chunks.push(current);

  return chunks
    .map((content, index) => ({
      id: `article-${article.id}-chunk-${index + 1}`,
      content,
      index,
      normalizedContent: normalizeKnowledgeText(content),
    }))
    .filter((chunk) => chunk.normalizedContent);
}
