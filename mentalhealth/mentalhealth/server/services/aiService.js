const axios = require("axios");
const { buildStructuredPrompt } = require("./chatPromptService");

async function generateAiResponse({ userMessage, knowledgeContext, messages = [] }) {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL;
  if (!ollamaBaseUrl) {
    const err = new Error("AI backend is not configured");
    err.statusCode = 500;
    throw err;
  }

    const headers = {
      "Content-Type": "application/json",
    };
    
    // If connecting through the secure tunnel, attach the API key
    if (process.env.OLLAMA_API_KEY) {
        headers["x-api-key"] = process.env.OLLAMA_API_KEY;
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
      { headers }
    );

  return response.data?.message?.content || "";
}

module.exports = { generateAiResponse };
