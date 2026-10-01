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
  const requestConfig = {
    headers: {
      "Content-Type": "application/json",
    },
  };
  const baseUrl = getOllamaBaseUrl();
  const model = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

  let response;
  try {
    // Prefer the older Ollama embed route because that is what the deployed server logged before.
    response = await axios.post(
      `${baseUrl}/api/embed`,
      {
        model,
        input,
      },
      requestConfig
    );
  } catch (error) {
    if (error.response?.status !== 404) {
      throw error;
    }

    // Fall back to the alternate embeddings API shape used by other Ollama versions.
    response = await axios.post(
      `${baseUrl}/api/embeddings`,
      {
        model,
        prompt: input,
      },
      requestConfig
    );
  }

  const embedding =
    response.data?.embeddings?.[0] ||
    response.data?.embedding ||
    null;

  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Ollama did not return a valid embedding");
  }

  return embedding;
}

module.exports = {
  generateEmbedding,
};
