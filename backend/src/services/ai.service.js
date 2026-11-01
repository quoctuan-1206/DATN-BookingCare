import { extractFilters } from "../modules/ai/filters/filter.extractor.js";
import { filterAnalysisSchema } from "../modules/ai/filters/filter.schema.js";
import { retrieveDatabase } from "../modules/ai/retrieval/database.retriever.js";
import { retrieveKnowledge } from "../modules/ai/knowledge/knowledge.retriever.js";
import { buildChatContext } from "../modules/ai/context/context.builder.js";
import { generateChatAnswer } from "../modules/ai/generation/answer.generator.js";
import { noRetrievalResult } from "../modules/ai/retrieval/retrieval.mapper.js";

const noKnowledgeResult = () => ({ source: "RAG", query: "", returnedCount: 0, items: [] });

function emergencyResponse(message) {
  if (!/(đau ngực\s+(?:dữ dội|nghiêm trọng|nặng)|khó thở\s+(?:nghiêm trọng|nặng)|bất tỉnh|mất ý thức)/iu.test(message)) return null;
  return {
    answer: "Nếu tình trạng đau ngực dữ dội, khó thở nghiêm trọng hoặc bất tỉnh đang xảy ra, hãy gọi cấp cứu hoặc đến cơ sở y tế gần nhất ngay. Đừng chờ tìm lịch khám thông thường.",
    answerOrigin: "DETERMINISTIC",
    intent: "MEDICAL_QUESTION",
    retrievalMode: "NONE",
    sources: [],
    suggestions: [],
  };
}

function hybridDirectoryAnalysis(analysis) {
  if (["SEARCH_DOCTOR", "SEARCH_CLINIC", "SEARCH_SPECIALTY"].includes(analysis.intent)) return analysis;
  const { doctorName, clinicName, district, specialty, maxPrice } = analysis.filters;
  let intent = null;
  if (doctorName || specialty || maxPrice !== null) intent = "SEARCH_DOCTOR";
  else if (clinicName || district) intent = "SEARCH_CLINIC";
  return intent ? { ...analysis, intent } : null;
}

function noDataAnswer(retrievalMode) {
  if (retrievalMode === "DATABASE") {
    return "Mình chưa tìm thấy kết quả phù hợp trong dữ liệu hiện có của MediUTE.";
  }
  if (retrievalMode === "RAG") {
    return "Mình chưa tìm thấy tài liệu MediUTE phù hợp với câu hỏi này, nên chưa thể cung cấp thông tin có nguồn tham khảo.";
  }
  return "Mình chưa tìm thấy dữ liệu phù hợp trong danh mục và tài liệu MediUTE hiện có.";
}

function chatResponse(answer, analysis, sources = [], suggestions = [], answerOrigin = "GEMINI") {
  return {
    answer,
    answerOrigin,
    intent: analysis.intent,
    retrievalMode: analysis.retrievalMode,
    sources,
    suggestions,
  };
}

export class AiService {
  constructor({
    analyzeMessage = extractFilters,
    databaseRetriever = retrieveDatabase,
    knowledgeRetriever = retrieveKnowledge,
    answerGenerator = generateChatAnswer,
  } = {}) {
    this.analyzeMessage = analyzeMessage;
    this.databaseRetriever = databaseRetriever;
    this.knowledgeRetriever = knowledgeRetriever;
    this.answerGenerator = answerGenerator;
  }

  async analyze(message) {
    return this.analyzeMessage(message);
  }

  async retrieve(message) {
    const analysis = filterAnalysisSchema.parse(await this.analyzeMessage(message));
    const retrieval = await this.databaseRetriever(analysis);
    const result = { message, ...analysis, retrieval };
    if (analysis.retrievalMode === "RAG" || (analysis.retrievalMode === "HYBRID" && analysis.intent === "MEDICAL_QUESTION")) {
      result.knowledge = await this.knowledgeRetriever({ query: message });
    }
    return result;
  }

  async searchKnowledge({ query, sourceTypes, limit } = {}) {
    return this.knowledgeRetriever({
      query,
      ...(sourceTypes ? { sourceTypes } : {}),
      ...(limit !== undefined ? { limit } : {}),
    });
  }

  async chat(message) {
    const emergency = emergencyResponse(message);
    if (emergency) return emergency;

    const analysis = filterAnalysisSchema.parse(await this.analyzeMessage(message));
    let databaseResults = noRetrievalResult();
    let knowledgeResults = noKnowledgeResult();

    if (analysis.retrievalMode === "DATABASE") {
      databaseResults = await this.databaseRetriever(analysis);
    } else if (analysis.retrievalMode === "RAG") {
      knowledgeResults = await this.knowledgeRetriever({ query: message });
    } else if (analysis.retrievalMode === "HYBRID") {
      const directoryAnalysis = hybridDirectoryAnalysis(analysis);
      if (directoryAnalysis) databaseResults = await this.databaseRetriever(directoryAnalysis);
      knowledgeResults = await this.knowledgeRetriever({ query: message });
    }

    const { context, sources } = buildChatContext({ message, analysis, databaseResults, knowledgeResults });
    const hasDatabaseResults = context.retrieval.database.returnedCount > 0;
    const hasKnowledgeResults = context.retrieval.knowledge.returnedCount > 0;
    const hasRetrievedData = hasDatabaseResults || hasKnowledgeResults;

    if (["DATABASE", "RAG", "HYBRID"].includes(analysis.retrievalMode) && !hasRetrievedData) {
      return chatResponse(noDataAnswer(analysis.retrievalMode), analysis, [], [], "DETERMINISTIC");
    }

    const generated = await this.answerGenerator({ message, context });
    const allowedSources = new Map(sources.map((source) => [source.id, source]));
    const verifiedSources = [...new Set(generated.sourceIds)].map((id) => allowedSources.get(id)).filter(Boolean);
    if (hasRetrievedData && verifiedSources.length === 0) {
      return chatResponse("Mình chưa thể xác minh nguồn tham khảo cho câu trả lời này. Vui lòng thử lại sau.", analysis, [], [], "DETERMINISTIC");
    }

    return chatResponse(generated.answer, analysis, verifiedSources, generated.suggestions);
  }
}

export default new AiService();
