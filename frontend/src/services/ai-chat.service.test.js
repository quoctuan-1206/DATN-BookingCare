import test from "node:test";
import assert from "node:assert/strict";
import axiosClient from "../api/axios.js";
import aiChatService from "./ai-chat.service.js";

test("AI chat service posts to the existing chat API and returns structured data", async () => {
  const originalPost = axiosClient.post;
  let request;
  axiosClient.post = async (...args) => {
    request = args;
    return { data: { success: true, data: {
      answer: "Đã tìm thấy thông tin.",
      answerOrigin: "GEMINI",
      intent: "SEARCH_DOCTOR",
      retrievalMode: "DATABASE",
      sources: [{ id: "doctor-12", type: "DOCTOR", title: "Bác sĩ An", url: null }],
      suggestions: ["Tìm thêm bác sĩ"],
      internalContext: "must not be returned",
    } } };
  };

  try {
    const data = await aiChatService.sendMessage("Tìm bác sĩ tim mạch");
    assert.deepEqual(request, ["/ai/chat", { message: "Tìm bác sĩ tim mạch" }]);
    assert.deepEqual(data, {
      answer: "Đã tìm thấy thông tin.",
      answerOrigin: "GEMINI",
      intent: "SEARCH_DOCTOR",
      retrievalMode: "DATABASE",
      sources: [{ id: "doctor-12", type: "DOCTOR", title: "Bác sĩ An", url: null }],
      suggestions: ["Tìm thêm bác sĩ"],
    });
  } finally {
    axiosClient.post = originalPost;
  }
});

test("AI chat service rejects malformed backend responses", async () => {
  const originalPost = axiosClient.post;
  axiosClient.post = async () => ({ data: { success: true, data: { answer: null } } });
  try {
    await assert.rejects(aiChatService.sendMessage("hello"), /Invalid AI chat response/);
  } finally {
    axiosClient.post = originalPost;
  }
});
