import { CHAT_SYSTEM_INSTRUCTION, makeChatGenerationInput } from "./answer.prompt.js";
import { chatAnswerSchema, geminiChatResponseSchema } from "./answer.schema.js";
import { generateGeminiChat } from "../gemini.client.js";

export class ChatGenerationError extends Error {
  constructor(message, statusCode = 503, code = "CHAT_GENERATION_FAILED") {
    super(message);
    this.name = "ChatGenerationError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function safeLog(logger, event, details = {}) {
  try {
    logger(JSON.stringify({ scope: "mediute-ai-chat", event, ...details }));
  } catch {
    // Logging failures must not change the API result.
  }
}

function classifyGenerationError(error) {
  const status = Number(error?.status || error?.statusCode) || null;
  const message = [error?.code, error?.message].filter(Boolean).join(" ");
  if (error?.code === "GEMINI_NOT_CONFIGURED") return { category: "missing_configuration", status };
  if (status === 429 || /RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(message)) return { category: "quota", status };
  if (["AbortError", "TimeoutError"].includes(error?.name) || /timeout|timed out|deadline exceeded/i.test(message)) return { category: "timeout", status };
  if (status === 401 || /API_KEY_INVALID|invalid api key|api key is not valid/i.test(message)) return { category: "invalid_api_key", status };
  if (status === 404 || /MODEL_NOT_FOUND|model.+not found/i.test(message)) return { category: "model_not_found", status };
  if (error?.code === "ERR_MODULE_NOT_FOUND" || error?.code === "ERR_PACKAGE_PATH_NOT_EXPORTED") return { category: "sdk_initialization", status };
  if (status >= 500 || /fetch failed|network|ECONN|ENOTFOUND/i.test(message)) return { category: "provider_unavailable", status };
  return { category: "request_failed", status };
}

export async function generateChatAnswer({ message, context }, { generate = generateGeminiChat, logger = console.error } = {}) {
  let response;
  try {
    response = await generate({
      contents: makeChatGenerationInput(message, context),
      systemInstruction: CHAT_SYSTEM_INSTRUCTION,
      responseSchema: geminiChatResponseSchema,
    });
  } catch (error) {
    const { category, status } = classifyGenerationError(error);
    safeLog(logger, "generation_failed", { category, status });
    if (category === "timeout") throw new ChatGenerationError("AI service timed out. Please try again.", 504, "GEMINI_TIMEOUT");
    if (category === "quota") throw new ChatGenerationError("AI service is busy. Please try again later.", 503, "GEMINI_RATE_LIMITED");
    if (category === "missing_configuration") throw new ChatGenerationError("AI service is not configured", 503, "GEMINI_NOT_CONFIGURED");
    if (["invalid_api_key", "model_not_found", "sdk_initialization"].includes(category)) {
      throw new ChatGenerationError("AI service configuration is invalid or unavailable", 503, `GEMINI_${category.toUpperCase()}`);
    }
    if (category === "provider_unavailable") throw new ChatGenerationError("AI service is temporarily unavailable", 503, "GEMINI_UNAVAILABLE");
    throw new ChatGenerationError("Could not generate an answer", 502, "GEMINI_REQUEST_FAILED");
  }

  const text = typeof response?.text === "string" ? response.text : "";
  if (!text.trim()) {
    safeLog(logger, "generation_response_empty", { category: "empty_response" });
    throw new ChatGenerationError("AI service returned an invalid response", 502, "GEMINI_EMPTY_RESPONSE");
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    safeLog(logger, "generation_response_invalid_json", { category: "json_parse_failed" });
    throw new ChatGenerationError("AI service returned an invalid response", 502, "GEMINI_INVALID_RESPONSE");
  }

  const validated = chatAnswerSchema.safeParse(parsed);
  if (!validated.success) {
    safeLog(logger, "generation_response_zod_invalid", {
      category: "zod_validation_failed",
      issues: validated.error.issues.map((issue) => ({ field: issue.path.join("."), code: issue.code })),
    });
    throw new ChatGenerationError("AI service returned an invalid response", 502, "GEMINI_INVALID_RESPONSE");
  }
  return validated.data;
}
