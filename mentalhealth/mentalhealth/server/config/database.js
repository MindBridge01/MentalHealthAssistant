const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const { loadEnvironment } = require("./environment");

loadEnvironment();

function resolveConnectionString() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const user =
    process.env.POSTGRES_USER || process.env.PGUSER || process.env.USER;
  const password = process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD;
  const database =
    process.env.POSTGRES_DB || process.env.PGDATABASE || "mindbridge";
  const host = process.env.POSTGRES_HOST || process.env.PGHOST || "localhost";
  const port = process.env.POSTGRES_PORT || process.env.PGPORT || "5432";

  if (!user) {
    throw new Error(
      "PostgreSQL configuration is missing. Set DATABASE_URL or POSTGRES_USER/POSTGRES_DB (or PGUSER/PGDATABASE)."
    );
  }

  const credentials = password
    ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}`
    : encodeURIComponent(user);

  return `postgresql://${credentials}@${host}:${port}/${encodeURIComponent(
    database
  )}`;
}

const connectionString = resolveConnectionString();
const ssl =
  process.env.POSTGRES_SSL === "true"
    ? {
        rejectUnauthorized: process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED !== "false",
        ca: process.env.POSTGRES_CA_CERT
          ? fs.readFileSync(path.resolve(process.env.POSTGRES_CA_CERT), "utf8")
          : undefined,
      }
    : false;

const pool = new Pool({
  connectionString,
  ssl,
  max: Number(process.env.POSTGRES_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.POSTGRES_IDLE_TIMEOUT_MS || 30000),
});

function mapMongoStyleDocument(document) {
  if (!document || typeof document !== "object") return document;
  if (Array.isArray(document)) {
    return document.map(mapMongoStyleDocument);
  }

  const mapped = {};
  for (const [key, value] of Object.entries(document)) {
    if (key === "id") {
      mapped._id = mapMongoStyleDocument(value);
      continue;
    }
    mapped[key] = mapMongoStyleDocument(value);
  }
  return mapped;
}

async function query(text, params = []) {
  return pool.query(text, params);
}

async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function testConnection() {
  await query("SELECT 1");
}

async function closePool() {
  await pool.end();
}

module.exports = {
  pool,
  query,
  withTransaction,
  testConnection,
  closePool,
  mapMongoStyleDocument,
};
