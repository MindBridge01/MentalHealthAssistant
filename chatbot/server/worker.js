import './environment.js';
import {databaseOptions} from './databaseOptions.js';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';
import { ChatbotModels } from './models.js';
const c = config(),
  pool = new pg.Pool({
    ...databaseOptions(c),
    max: 2
  }),
  models = new ChatbotModels(c);
let stopped = false;
process.on('SIGINT', () => stopped = true);
process.on('SIGTERM', () => stopped = true);
async function claim() {
  await pool.query("UPDATE chatbot.ingestion_jobs SET status=CASE WHEN attempts>=3 THEN 'failed' ELSE 'queued' END,locked_at=NULL,last_error='Processing lease expired' WHERE status='processing' AND locked_at<now()-interval '10 minutes'");
  await pool.query("UPDATE chatbot.documents d SET state='failed' FROM chatbot.ingestion_jobs j WHERE j.document_id=d.id AND j.status='failed'");
  return (await pool.query(`UPDATE chatbot.ingestion_jobs SET status='processing',locked_at=date_trunc('milliseconds',clock_timestamp()),attempts=attempts+1
    WHERE id=(SELECT j.id FROM chatbot.ingestion_jobs j JOIN chatbot.documents d ON d.id=j.document_id WHERE j.status='queued' AND j.available_at<=now() AND d.review_status='approved' ORDER BY j.available_at FOR UPDATE OF j SKIP LOCKED LIMIT 1) RETURNING *`)).rows[0];
}
async function processJob(job) {
  const doc = (await pool.query('SELECT * FROM chatbot.documents WHERE id=$1', [job.document_id])).rows[0];
  if (!doc || doc.review_status !== 'approved') return;
  await pool.query("UPDATE chatbot.documents SET state='processing' WHERE id=$1 AND review_status='approved'", [doc.id]);
  const extracted = await models.call('/extract', {
    mime: doc.mime,
    content: doc.content.toString('base64')
  });
  const {
    chunks
  } = await models.call('/chunks', {
    pages: extracted.pages
  });
  if (!Array.isArray(chunks) || !chunks.length || chunks.length > 500) throw Error('Invalid extracted chunks');
  const vectors = [];
  for (let i = 0; i < chunks.length; i += 16) vectors.push(...(await models.embed(chunks.slice(i, i + 16).map(x => x.text))));
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    // Lock in the same order as review(): document first, then ingestion job.
    const latest = (await db.query('SELECT review_status,reviewed_at FROM chatbot.documents WHERE id=$1 FOR UPDATE', [doc.id])).rows[0];
    const lease = (await db.query("SELECT id FROM chatbot.ingestion_jobs WHERE id=$1 AND status='processing' AND locked_at=$2 FOR UPDATE", [job.id, job.locked_at])).rows[0];
    if (!lease || latest?.review_status !== 'approved' || new Date(latest.reviewed_at).getTime() !== new Date(doc.reviewed_at).getTime()) {
      await db.query('ROLLBACK');
      return;
    }
    await db.query('DELETE FROM chatbot.document_chunks WHERE document_id=$1', [doc.id]);
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      await db.query('INSERT INTO chatbot.document_chunks(id,document_id,ordinal,section,page,chunk_text,parent_text,embedding) VALUES($1,$2,$3,$4,$5,$6,$7,$8::vector)', [randomUUID(), doc.id, i, chunk.section, chunk.page, chunk.text, chunk.parent, JSON.stringify(vectors[i])]);
    }
    await db.query("UPDATE chatbot.documents SET state='ready' WHERE id=$1", [doc.id]);
    await db.query("UPDATE chatbot.ingestion_jobs SET status='done',locked_at=NULL,last_error=NULL WHERE id=$1", [job.id]);
    await db.query('COMMIT');
    console.log('Approved document indexed.');
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  } finally {
    db.release();
  }
}
try {
  console.log('Knowledge ingestion worker running.');
  while (!stopped) {
    const job = await claim();
    if (!job) {
      await new Promise(r => setTimeout(r, 3000));
      continue;
    }
    try {
      await processJob(job);
    } catch {
      await pool.query("UPDATE chatbot.ingestion_jobs SET status=CASE WHEN attempts>=3 THEN 'failed' ELSE 'queued' END,available_at=now()+interval '1 minute',locked_at=NULL,last_error='Extraction or model service failed; check source and model services' WHERE id=$1 AND status='processing' AND locked_at=$2", [job.id, job.locked_at]);
      console.error('Ingestion attempt failed. No source text logged.');
    }
  }
} catch {
  console.error('Worker stopped. Check the isolated database and model services.');
  process.exitCode = 1;
} finally {
  await pool.end();
}
