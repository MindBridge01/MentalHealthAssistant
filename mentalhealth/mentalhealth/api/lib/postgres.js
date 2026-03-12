import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { testConnection } = require("../../server/config/database");

export async function ensurePostgres() {
  await testConnection();
}
