import { findPatientGuide } from "../knowledge/patient-guides.js";

const MAX_CONTEXT_CHARS = 12_000;
const MAX_CONTEXT_RECORDS = 10;
const MAX_TEXT_CHARS = 1_500;

function cleanText(value, maxLength = MAX_TEXT_CHARS) {
  if (value === null || value === undefined) return null;
  return String(value)
    .replace(/\bBearer\s+\S+/gi, "[token removed]")
    .replace(/\beyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]{8,}\b/g, "[token removed]")
    .replace(/\bAIza[\w-]{20,}\b/g, "[key removed]")
    .replace(/\bsk-[A-Za-z0-9_-]{20,}\b/g, "[key removed]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email removed]")
    .replace(/\b(password|api[_ -]?key|access[_ -]?token)\s*[:=]\s*\S+/gi, "$1=[redacted]")
    .slice(0, maxLength);
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function mapDoctor(item) {
  const workplaces = Array.isArray(item.workplaces) ? item.workplaces.slice(0, 5).map((workplace) => ({
    clinic: {
      id: cleanText(workplace.clinic?.id, 50),
      name: cleanText(workplace.clinic?.name, 160),
      address: cleanText(workplace.clinic?.address, 200),
    },
    specialty: {
      id: cleanText(workplace.specialty?.id, 50),
      name: cleanText(workplace.specialty?.name, 120),
    },
    consultationFeeVnd: finiteNumber(workplace.consultation_fee),
    room: cleanText(workplace.room, 80),
  })) : [];
  return {
    id: cleanText(item.id, 50),
    name: cleanText(item.name || [item.last_name, item.first_name].filter(Boolean).join(" "), 180),
    degree: cleanText(item.degree, 80),
    position: cleanText(item.position, 100),
    experienceYears: finiteNumber(item.experience_years),
    workplaces,
  };
}

function mapClinic(item) {
  return {
    id: cleanText(item.id, 50),
    name: cleanText(item.name, 180),
    address: cleanText(item.address, 220),
    description: cleanText(item.description, 500),
    specialties: (Array.isArray(item.specialties) ? item.specialties : []).slice(0, 8).map((specialty) => ({
      id: cleanText(specialty.id, 50),
      name: cleanText(specialty.name, 120),
    })),
    doctors: (Array.isArray(item.doctors) ? item.doctors : []).slice(0, 8).map((doctor) => ({
      id: cleanText(doctor.id, 50),
      name: cleanText(doctor.name, 180),
      specialty: cleanText(doctor.specialty?.name, 120),
      consultationFeeVnd: finiteNumber(doctor.consultation_fee),
    })),
  };
}

function mapSpecialty(item) {
  return {
    id: cleanText(item.id, 50),
    name: cleanText(item.name, 120),
    description: cleanText(item.description, 500),
  };
}

function mapDatabaseItems(databaseResults) {
  if (!databaseResults || databaseResults.source !== "DATABASE" || !Array.isArray(databaseResults.items)) {
    return { entityType: null, records: [] };
  }
  const mapper = {
    DOCTOR: mapDoctor,
    CLINIC: mapClinic,
    SPECIALTY: mapSpecialty,
  }[databaseResults.entityType];
  if (!mapper) return { entityType: null, records: [] };

  const records = databaseResults.items.slice(0, MAX_CONTEXT_RECORDS).map((item) => ({
    sourceId: `${databaseResults.entityType.toLowerCase()}-${cleanText(item.id, 50)}`,
    type: databaseResults.entityType,
    title: cleanText(item.name, 180) || cleanText(item.title, 180) || `${databaseResults.entityType} ${item.id}`,
    data: mapper(item),
  })).filter((record) => record.data.id !== null);
  const seen = new Set();
  return {
    entityType: databaseResults.entityType,
    records: records.filter((record) => {
      if (seen.has(record.sourceId)) return false;
      seen.add(record.sourceId);
      return true;
    }),
  };
}

function mapKnowledgeItems(knowledgeResults) {
  if (!knowledgeResults || knowledgeResults.source !== "RAG" || !Array.isArray(knowledgeResults.items)) return [];
  const records = knowledgeResults.items.slice(0, MAX_CONTEXT_RECORDS).flatMap((item) => {
    if (item.sourceType === "SYSTEM_GUIDE") {
      const guide = typeof item.documentId === "string" ? findPatientGuide(item.documentId) : null;
      if (!guide || item.url !== guide.sourceUrl || typeof item.content !== "string" || !item.content.trim()) return [];
      return [{
        sourceId: guide.id,
        chunkId: cleanText(item.chunkId, 100),
        type: "SYSTEM_GUIDE",
        title: cleanText(guide.title, 200),
        content: cleanText(item.content, MAX_TEXT_CHARS),
        score: finiteNumber(item.score),
        url: guide.sourceUrl,
      }];
    }
    if (item.sourceType !== "ARTICLE" || typeof item.documentId !== "string" || !item.documentId.startsWith("article-")) return [];
    const articleId = item.documentId.slice("article-".length);
    if (!/^\d+$/.test(articleId) || typeof item.content !== "string" || !item.content.trim()) return [];
    const url = item.url === `/articles/${articleId}` ? item.url : null;
    return [{
      sourceId: item.documentId,
      chunkId: cleanText(item.chunkId, 100),
      type: "ARTICLE",
      title: cleanText(item.title, 200),
      content: cleanText(item.content, MAX_TEXT_CHARS),
      score: finiteNumber(item.score),
      url,
    }];
  });
  const seenIds = new Set();
  const seenContent = new Set();
  return records.filter((record) => {
    const contentKey = record.content.toLocaleLowerCase().replace(/\s+/g, " ").trim();
    if (seenIds.has(record.chunkId) || seenContent.has(contentKey)) return false;
    seenIds.add(record.chunkId);
    seenContent.add(contentKey);
    return true;
  });
}

function sourceFromRecord(record) {
  if (record.type === "ARTICLE" || record.type === "SYSTEM_GUIDE") {
    return { id: record.sourceId, type: record.type, title: record.title, url: record.url };
  }
  return { id: record.sourceId, type: record.type, title: record.title, url: null };
}

export function buildChatContext({ message, analysis, databaseResults, knowledgeResults }) {
  const database = mapDatabaseItems(databaseResults);
  const knowledge = mapKnowledgeItems(knowledgeResults);
  const records = [...database.records, ...knowledge];
  const sources = [];
  const sourceIds = new Set();
  for (const record of records) {
    if (!sourceIds.has(record.sourceId)) {
      sourceIds.add(record.sourceId);
      sources.push(sourceFromRecord(record));
    }
  }

  const context = {
    intent: analysis.intent,
    retrievalMode: analysis.retrievalMode,
    userQuestion: cleanText(message, 1_200),
    sources,
    retrieval: {
      database: {
        entityType: database.entityType,
        returnedCount: database.records.length,
        records: database.records,
      },
      knowledge: { returnedCount: knowledge.length, records: knowledge },
    },
  };

  while (JSON.stringify(context).length > MAX_CONTEXT_CHARS && records.length > 0) {
    const removed = records.pop();
    const knowledgeIndex = context.retrieval.knowledge.records.findIndex((record) => record.sourceId === removed.sourceId && record.chunkId === removed.chunkId);
    if (knowledgeIndex >= 0) context.retrieval.knowledge.records.splice(knowledgeIndex, 1);
    else context.retrieval.database.records.pop();
    if (!records.some((record) => record.sourceId === removed.sourceId)) {
      const sourceIndex = sources.findIndex((source) => source.id === removed.sourceId);
      if (sourceIndex >= 0) sources.splice(sourceIndex, 1);
    }
  }
  context.retrieval.database.returnedCount = context.retrieval.database.records.length;
  context.retrieval.knowledge.returnedCount = context.retrieval.knowledge.records.length;
  return { context, sources };
}

export { MAX_CONTEXT_CHARS };
