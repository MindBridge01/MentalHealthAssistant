const { query } = require("../config/database");

function toVectorLiteral(values) {
  return `[${values.join(",")}]`;
}

async function deleteChunksByDocumentKey(documentKey) {
  await query("DELETE FROM knowledge_chunks WHERE document_key = $1", [documentKey]);
}

async function insertKnowledgeChunk(chunk) {
  await query(
    `
      INSERT INTO knowledge_chunks (
        document_key,
        title,
        source_path,
        chunk_index,
        content,
        metadata,
        embedding
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::vector)
    `,
    [
      chunk.documentKey,
      chunk.title,
      chunk.sourcePath,
      chunk.chunkIndex,
      chunk.content,
      chunk.metadata || {},
      toVectorLiteral(chunk.embedding),
    ]
  );
}

async function searchKnowledgeChunks(embedding, limit = 5) {
  const result = await query(
    `
      SELECT
        id,
        document_key,
        title,
        source_path,
        chunk_index,
        content,
        metadata,
        1 - (embedding <=> $1::vector) AS similarity
      FROM knowledge_chunks
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `,
    [toVectorLiteral(embedding), limit]
  );

  return result.rows;
}

module.exports = {
  deleteChunksByDocumentKey,
  insertKnowledgeChunk,
  searchKnowledgeChunks,
};
