import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { vector } from '@electric-sql/pglite/vector';
import { PostgresStore } from '../server/store.js';
import { retrieve } from '../server/retrieval.js';
test('real PostgreSQL schema, encryption, approval filters and deletion cascades', async t => {
  const db = new PGlite({
    extensions: {
      vector
    }
  });
  const query = async (sql, params) => {
    const result = await db.query(sql, params);
    return {
      ...result,
      rowCount: result.rows.length || result.affectedRows || 0
    };
  };
  const pool = {
    query,
    connect: async () => ({
      query,
      release() {}
    }),
    end: async () => db.close()
  };
  const store = new PostgresStore(pool, 'ab'.repeat(32));
  try {
    await db.exec(await readFile(new URL('../db/001_initial.sql', import.meta.url), 'utf8'));
    const c = await store.create('alice');
    await t.test('other users cannot access the conversation', async () => {
      await assert.rejects(store.get(c.id, 'bob'), {
        status: 404
      });
    });
    let assistant;
    await t.test('messages and summary are encrypted; history round trips', async () => {
      assistant = await store.withConversation(c.id, 'alice', async (conv, scoped) => scoped.saveTurn(conv, 'Synthetic private question', {
        content: 'Synthetic answer',
        route: 'demo',
        sources: [],
        safety: {
          categories: ['NORMAL_INFORMATION'],
          risk_level: 'LOW'
        }
      }, 'Private summary'));
      const raw = (await db.query('SELECT encrypted_payload FROM chatbot.messages')).rows;
      assert.ok(raw.every(m => !m.encrypted_payload.includes('Synthetic')));
      const loaded = await store.get(c.id, 'alice');
      assert.equal(loaded.messages.length, 2);
      assert.equal(loaded.summary, 'Private summary');
      assert.equal(loaded.messages[0].content, 'Synthetic private question');
    });
    await t.test('feedback checks ownership and assistant role', async () => {
      await assert.rejects(store.feedback('bob', assistant.id, 1, null), {
        status: 404
      });
      await store.feedback('alice', assistant.id, 1, null);
      assert.equal((await db.query('SELECT * FROM chatbot.feedback')).rows.length, 1);
    });
    await t.test('expired conversations and memories are not readable', async () => {
      const expired = await store.create('alice');
      await db.query("UPDATE chatbot.conversations SET expires_at=now()-interval '1 day' WHERE id=$1", [expired.id]);
      await assert.rejects(store.get(expired.id, 'alice'), {
        status: 404
      });
      const m = await store.addMemory('alice', 'Short explanations');
      assert.equal((await store.listMemories('alice')).length, 1);
      await db.query("UPDATE chatbot.user_memories SET expires_at=now()-interval '1 day' WHERE id=$1", [m.id]);
      assert.equal((await store.listMemories('alice')).length, 0);
    });
    await t.test('full-text/vector retrieval excludes pending and rejected sources', async () => {
      const metadata = {
        title: 'Synthetic knowledge',
        source: 'Test',
        source_url: 'https://example.test',
        language: 'en',
        audience: 'adult',
        evidence_type: 'patient_information'
      };
      const id = await store.addDocument({
        metadata,
        filename: 'test.txt',
        content: Buffer.from('fixture'),
        mime: 'text/plain',
        digest: 'fixture',
        submitted_by: 'reviewer'
      });
      const embedding = Array(384).fill(0);
      embedding[0] = 1;
      const models = {
        embed: async () => [embedding],
        rerank: async (q, items) => items.map(() => 2)
      };
      const insert = () => db.query('INSERT INTO chatbot.document_chunks(id,document_id,ordinal,section,page,chunk_text,parent_text,embedding) VALUES($1,$2,0,$3,1,$4,$4,$5::vector)', [randomUUID(), id, 'Fixture', 'Synthetic anxiety fixture', JSON.stringify(embedding)]);
      await insert();
      assert.equal((await retrieve(pool, models, 'anxiety')).length, 0);
      await store.review(id, 'reviewer', true);
      assert.equal((await db.query('SELECT * FROM chatbot.document_chunks')).rows.length, 0);
      assert.equal((await db.query('SELECT * FROM chatbot.ingestion_jobs')).rows.length, 1);
      await insert();
      await db.query("UPDATE chatbot.documents SET state='ready' WHERE id=$1", [id]);
      assert.equal((await retrieve(pool, models, 'anxiety')).length, 1);
      await store.review(id, 'reviewer', false);
      assert.equal((await retrieve(pool, models, 'anxiety')).length, 0);
      assert.equal((await db.query('SELECT * FROM chatbot.ingestion_jobs')).rows.length, 0);
    });
    await t.test('delete cascades to private messages, summary, feedback and logs', async () => {
      await store.remove(c.id, 'alice');
      for (const table of ['messages', 'conversation_summaries', 'feedback', 'safety_events', 'retrieval_logs']) assert.equal((await db.query(`SELECT * FROM chatbot.${table}`)).rows.length, 0);
    });
  } finally {
    await db.close();
  }
});
