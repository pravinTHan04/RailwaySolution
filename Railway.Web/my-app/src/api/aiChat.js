import api from "./axios";

export async function sendChatMessage(question) {
  try {
    const res = await api.post(
      "/api/ai/ask",
      { question },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    return res.data;
  } catch (err) {
    console.error("AI Chat Error:", err);
    return { ai: "⚠ Something went wrong contacting AI server." };
  }
}
