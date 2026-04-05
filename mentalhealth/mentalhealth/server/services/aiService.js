const axios = require("axios");
const { buildStructuredPrompt } = require("./chatPromptService");

async function generateAiResponse({ userMessage, knowledgeContext, messages = [] }) {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL;
  if (!ollamaBaseUrl) {
    const err = new Error("AI backend is not configured");
    err.statusCode = 500;
    throw err;
  }

  const response = await axios.post(
    `${ollamaBaseUrl}/api/chat`,
    {
      model: process.env.OLLAMA_CHAT_MODEL || "llama3.2:1b",
      messages: buildStructuredPrompt({
        userMessage,
        knowledgeContext,
        conversationHistory: messages,
      }),
      stream: false,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data?.message?.content || "";
}

module.exports = { generateAiResponse };
