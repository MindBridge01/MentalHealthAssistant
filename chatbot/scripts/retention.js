import '../server/environment.js';
import {databaseOptions} from '../server/databaseOptions.js';
import pg from 'pg';
import { config } from '../server/config.js';
const c = config(),
  db = new pg.Client({
    ...databaseOptions(c)
  });
try {
  await db.connect();
  await db.query('BEGIN');
  const conversations = await db.query('DELETE FROM chatbot.conversations WHERE expires_at<=now()');
  const memories = await db.query('DELETE FROM chatbot.user_memories WHERE expires_at<=now()');
  await db.query("DELETE FROM chatbot.knowledge_audit WHERE created_at<now()-interval '90 days'");
  await db.query('COMMIT');
  console.log(`Expired conversations removed: ${conversations.rowCount}; memories: ${memories.rowCount}.`);
} catch {
  console.error('Retention job failed.');
  process.exitCode = 1;
} finally {
  await db.end();
}
