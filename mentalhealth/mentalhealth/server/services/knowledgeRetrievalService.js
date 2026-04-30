const { generateEmbedding } = require("./embeddingService");
const { searchKnowledgeChunks } = require("../models/knowledgeModel");

async function retrieveKnowledgeContext(question, options = {}) {
  const limit = options.limit || 4;
  const minSimilarity = options.minSimilarity || 0.55;

  try {
    const queryEmbedding = await generateEmbedding(question);
    const matches = await searchKnowledgeChunks(queryEmbedding, limit);
    const filteredMatches = matches.filter((item) => Number(item.similarity) >= minSimilarity);

    const contextText = filteredMatches
      .map((item, index) => {
        return `Source ${index + 1}: ${item.title}\n${item.content}`;
      })
      .join("\n\n");

    return {
      matches: filteredMatches,
      contextText,
    };
  } catch (error) {
    console.warn("[knowledge] retrieval skipped:", error.message);
    return {
      matches: [],
      contextText: "",
    };
  }
}

module.exports = {
  retrieveKnowledgeContext,
};
