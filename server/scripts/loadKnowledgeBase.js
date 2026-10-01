const { loadEnvironment } = require("../config/environment");
const { closePool } = require("../config/database");
const { loadKnowledgeBase } = require("../services/knowledgeLoaderService");

loadEnvironment();

async function run() {
  await loadKnowledgeBase();
  console.log("Knowledge base loaded successfully");
}

run()
  .catch((error) => {
    console.error("Knowledge load failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
