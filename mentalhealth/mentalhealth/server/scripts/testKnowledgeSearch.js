const { loadEnvironment } = require("../config/environment");
const { closePool } = require("../config/database");
const { retrieveKnowledgeContext } = require("../services/knowledgeRetrievalService");

loadEnvironment();

async function run() {
  const result = await retrieveKnowledgeContext("How can anxiety affect sleep?", {
    limit: 5,
    minSimilarity: 0.0,
  });

  console.log(JSON.stringify(result, null, 2));
}

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await closePool();
  });
