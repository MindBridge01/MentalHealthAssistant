const axios = require("axios");

function getOllamaBaseUrl() {
  const baseUrl = process.env.OLLAMA_BASE_URL;
  if (!baseUrl) {
    const err = new Error("OLLAMA_BASE_URL is not configured");
    err.statusCode = 500;
    throw err;
  }
  return baseUrl;
}

async function generateEmbedding(input) {
  const response = await axios.post(
    `${getOllamaBaseUrl()}/api/embed`,
    {
      model: process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text",
      input,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const embedding = response.data?.embeddings?.[0];

  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Ollama did not return a valid embedding");
  }

  return embedding;
}

module.exports = {
  generateEmbedding,
};
