import axiosClient from "../api/axios.js";

export const AI_CHAT_MAX_MESSAGE_LENGTH = 1200;

const aiChatService = {
  async sendMessage(message) {
    const response = await axiosClient.post("/ai/chat", { message });
    const data = response.data?.data;
    if (!response.data?.success || typeof data?.answer !== "string") {
      throw new Error("Invalid AI chat response");
    }
    return {
      answer: data.answer,
      answerOrigin: data.answerOrigin,
      intent: data.intent,
      retrievalMode: data.retrievalMode,
      sources: Array.isArray(data.sources) ? data.sources : [],
      suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
    };
  },
};

export default aiChatService;
