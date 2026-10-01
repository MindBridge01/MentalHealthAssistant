const fs = require("fs/promises");
const path = require("path");
const { query, closePool } = require("../config/database");

async function run() {
  const filePath = path.join(__dirname, "init_schema.sql");
  const sql = await fs.readFile(filePath, "utf8");
  await query(sql);
  await query(await fs.readFile(path.join(__dirname, "patient_registration.sql"), "utf8"));
  console.log("[migrations] PostgreSQL schema is up to date");
}

run()
  .catch((error) => {
    console.error("[migrations] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
