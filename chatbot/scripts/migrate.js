import '../server/environment.js';
import {databaseOptions} from '../server/databaseOptions.js';
import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { config } from '../server/config.js';
const c = config();
const db = new pg.Client({
  ...databaseOptions(c)
});
try {
  await db.connect();
  await db.query(await readFile(new URL('../db/001_initial.sql', import.meta.url), 'utf8'));
  console.log('Chatbot schema is ready.');
} catch {
  console.error('Migration failed. Check the isolated database connection and pgvector installation.');
  process.exitCode = 1;
} finally {
  await db.end();
}
