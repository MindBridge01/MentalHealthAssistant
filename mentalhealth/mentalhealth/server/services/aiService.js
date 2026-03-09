const axios = require("axios");

async function generateAiResponse(prompt) {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL;
  if (!ollamaBaseUrl) {
    const err = new Error("AI backend is not configured");
    err.statusCode = 500;
    throw err;
  }

  const response = await axios.post(
    `${ollamaBaseUrl}/api/generate`,
    {
      model: "llama2:7b",
      prompt,
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
