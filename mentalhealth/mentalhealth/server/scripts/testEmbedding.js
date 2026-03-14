const { loadEnvironment } = require("../config/environment");
const { generateEmbedding } = require("../services/embeddingService");

loadEnvironment();

async function run() {
  const embedding = await generateEmbedding("What are common symptoms of anxiety?");
  console.log("Embedding length:", embedding.length);
  console.log("First 5 values:", embedding.slice(0, 5));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
