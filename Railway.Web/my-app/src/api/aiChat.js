import api from "./axios";

export async function sendChatMessage(text) {
  const res = await api.post("/api/ai/ask", { question: text });
  return res.data;
}
