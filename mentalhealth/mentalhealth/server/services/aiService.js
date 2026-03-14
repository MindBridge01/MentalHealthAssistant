const axios = require("axios");

function buildPrompt({ userMessage, knowledgeContext }) {
  return `
You are MindBridge, a healthcare support AI assistant.

Use the provided clinical knowledge when it is relevant.
Do not invent facts that are not supported by the knowledge context.
Do not present your answer as a formal diagnosis.
If the knowledge context is insufficient, say so clearly and give a safe, supportive response.

Knowledge Context:
${knowledgeContext || "No relevant knowledge was retrieved."}

User Question:
${userMessage}

Answer:
  `.trim();
}

async function generateAiResponse({ userMessage, knowledgeContext }) {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL;
  if (!ollamaBaseUrl) {
    const err = new Error("AI backend is not configured");
    err.statusCode = 500;
    throw err;
  }

  const response = await axios.post(
    `${ollamaBaseUrl}/api/generate`,
    {
      model: process.env.OLLAMA_CHAT_MODEL || "llama3",
      prompt: buildPrompt({ userMessage, knowledgeContext }),
      stream: false,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data?.response || "";
}

module.exports = { generateAiResponse };
