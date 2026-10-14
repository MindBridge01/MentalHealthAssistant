const { withTransaction, closePool } = require("../config/database");
const { runMigrations } = require('./migrationRunner');
const { backfillRegistry } = require('./registryBackfill');

async function run() {
  const applied = await withTransaction((client) => runMigrations(client, backfillRegistry));
  for (const migration of applied) console.log(`[migrations] ${migration.id}${migration.adopted ? ' (existing schema adopted)' : ''}`);
  console.log("[migrations] PostgreSQL schema is up to date");
}

run()
  .catch((error) => {
    console.error("[migrations] failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
