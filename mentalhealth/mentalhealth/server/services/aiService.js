const axios = require("axios");

function formatConversationHistory(messages = []) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return "No prior conversation context.";
  }

  return messages
    .slice(-10)
    .map((message) => {
      const role = message.role === "assistant" ? "MindBridge AI" : "User";
      return `${role}: ${String(message.content || "").trim()}`;
    })
    .join("\n");
}

function buildPrompt({ userMessage, knowledgeContext, conversationHistory }) {
  return `
You are MindBridge, a compassionate mental wellness support assistant.

Respond with warmth, clarity, and emotional steadiness.
Use the provided knowledge when it is relevant.
Do not invent facts that are not supported by the knowledge context.
Do not present your answer as a formal diagnosis or prescribe medication.
Do not use markdown, bullet spam, or robotic clinical wording unless structure is truly helpful.
If the user sounds distressed, validate the feeling first and then offer one or two grounded next steps.
If the knowledge context is insufficient, say so clearly and still give a safe, supportive response.
Keep continuity with the conversation history instead of answering like every turn is brand new.

Knowledge Context:
${knowledgeContext || "No relevant knowledge was retrieved."}

Recent Conversation:
${conversationHistory || "No prior conversation context."}

User Question:
${userMessage}

Answer:
  `.trim();
}

async function generateAiResponse({ userMessage, knowledgeContext, messages = [] }) {
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
      prompt: buildPrompt({
        userMessage,
        knowledgeContext,
        conversationHistory: formatConversationHistory(messages),
      }),
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
