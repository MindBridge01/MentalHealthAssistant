const fs = require("fs/promises");
const path = require("path");
const { chunkText } = require("../utils/textChunker");
const { generateEmbedding } = require("./embeddingService");
const {
  deleteChunksByDocumentKey,
  insertKnowledgeChunk,
} = require("../models/knowledgeModel");

const KNOWLEDGE_DIR = path.join(__dirname, "..", "knowledge");

function extractTitle(text, fallback) {
  const firstLine = text.split("\n")[0]?.trim() || "";
  if (firstLine.toLowerCase().startsWith("topic:")) {
    return firstLine.slice(6).trim();
  }
  return fallback;
}

async function loadKnowledgeBase() {
  const files = await fs.readdir(KNOWLEDGE_DIR);
  const textFiles = files.filter((file) => file.endsWith(".txt"));

  for (const fileName of textFiles) {
    const fullPath = path.join(KNOWLEDGE_DIR, fileName);
    const raw = await fs.readFile(fullPath, "utf8");
    const title = extractTitle(raw, fileName.replace(".txt", ""));
    const chunks = chunkText(raw);

    await deleteChunksByDocumentKey(fileName);

    for (let i = 0; i < chunks.length; i += 1) {
      const embedding = await generateEmbedding(chunks[i]);

      await insertKnowledgeChunk({
        documentKey: fileName,
        title,
        sourcePath: fullPath,
        chunkIndex: i,
        content: chunks[i],
        metadata: { fileName },
        embedding,
      });
    }

    console.log(`Loaded ${fileName} with ${chunks.length} chunks`);
  }
}

module.exports = {
  loadKnowledgeBase,
};
