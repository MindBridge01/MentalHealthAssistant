import { randomUUID } from 'node:crypto';
import { HttpError, vault } from './security.js';

// Preview data lives only in process memory. Never selected implicitly on a DB failure.
export class MemoryStore {
  constructor() {
    this.conversations = new Map();
    this.documents = new Map();
    this.memories = new Map();
    this.locks = new Set();
  }
  async list(user) {
    return [...this.conversations.values()].filter(c => c.user_id === user).map(({
      id,
      created_at,
      updated_at
    }) => ({
      id,
      created_at,
      updated_at
    }));
  }
  async create(user) {
    const c = {
      id: randomUUID(),
      user_id: user,
      messages: [],
      summary: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.conversations.set(c.id, c);
    return c;
  }
  async get(id, user) {
    const c = this.conversations.get(id);
    if (!c || c.user_id !== user) throw new HttpError(404, 'Conversation not found.');
    return structuredClone(c);
  }
  async remove(id, user) {
    await this.get(id, user);
    this.conversations.delete(id);
  }
  async withConversation(id, user, fn) {
    if (this.locks.has(id)) throw new HttpError(409, 'A reply is already being prepared.');
    this.locks.add(id);
    try {
      const c = await this.get(id, user);
      return await fn(c, this);
    } finally {
      this.locks.delete(id);
    }
  }
  async saveTurn(c, question, reply, summary) {
    const current = this.conversations.get(c.id);
    if (!current) throw new HttpError(404, 'Conversation was deleted.');
    const user = {
        id: randomUUID(),
        role: 'user',
        content: question
      },
      assistant = {
        id: randomUUID(),
        role: 'assistant',
        ...reply
      };
    current.messages.push(user, assistant);
    current.summary = summary;
    current.updated_at = new Date().toISOString();
    return assistant;
  }
  async listMemories(user) {
    return [...this.memories.values()].filter(m => m.user_id === user);
  }
  async addMemory(user, memory) {
    const m = {
      id: randomUUID(),
      user_id: user,
      memory,
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString()
    };
    this.memories.set(m.id, m);
    return m;
  }
  async deleteMemory(user, id) {
    if (this.memories.get(id)?.user_id !== user) throw new HttpError(404, 'Memory not found.');
    this.memories.delete(id);
  }
  async feedback(user, id, rating, reason) {
    if (![...this.conversations.values()].some(c => c.user_id === user && c.messages.some(m => m.id === id && m.role === 'assistant'))) throw new HttpError(404, 'Message not found.');
  }
  async listDocuments() {
    return [...this.documents.values()].map(({
      content,
      ...d
    }) => d);
  }
  async addDocument(d) {
    d = {
      ...d,
      id: randomUUID(),
      review_status: 'pending',
      state: 'waiting_review',
      created_at: new Date().toISOString()
    };
    this.documents.set(d.id, d);
    return d.id;
  }
  async document(id) {
    const d = this.documents.get(id);
    if (!d) throw new HttpError(404, 'Document not found.');
    return d;
  }
  async review(id, actor, approved) {
    const d = await this.document(id);
    d.review_status = approved ? 'approved' : 'rejected';
    d.state = approved ? 'queued' : 'waiting_review';
    d.reviewed_by = actor;
    d.reviewed_at = new Date().toISOString();
  }
  async close() {}
}
export class PostgresStore {
  constructor(pool, key) {
    this.pool = pool;
    this.db = pool;
    this.crypto = vault(key);
  }
  async list(user) {
    return (await this.db.query('SELECT id,created_at,updated_at FROM chatbot.conversations WHERE user_id=$1 AND expires_at>now() ORDER BY updated_at DESC LIMIT 100', [user])).rows;
  }
  async create(user) {
    return (await this.db.query('INSERT INTO chatbot.conversations(id,user_id) VALUES($1,$2) RETURNING *', [randomUUID(), user])).rows[0];
  }
  async get(id, user) {
    const c = (await this.db.query('SELECT * FROM chatbot.conversations WHERE id=$1 AND user_id=$2 AND expires_at>now()', [id, user])).rows[0];
    if (!c) throw new HttpError(404, 'Conversation not found.');
    c.messages = (await this.db.query('SELECT id,role,encrypted_payload FROM chatbot.messages WHERE conversation_id=$1 ORDER BY sequence_number LIMIT 200', [id])).rows.map(m => ({
      id: m.id,
      role: m.role,
      ...this.crypto.open(m.encrypted_payload)
    }));
    c.summary = this.crypto.open((await this.db.query('SELECT encrypted_summary FROM chatbot.conversation_summaries WHERE conversation_id=$1', [id])).rows[0]?.encrypted_summary || this.crypto.seal(''));
    return c;
  }
  async remove(id, user) {
    const r = await this.db.query('DELETE FROM chatbot.conversations WHERE id=$1 AND user_id=$2', [id, user]);
    if (!r.rowCount) throw new HttpError(404, 'Conversation not found.');
  }
  async withConversation(id, user, fn) {
    const db = await this.pool.connect();
    try {
      await db.query('BEGIN');
      const locked = await db.query('SELECT id FROM chatbot.conversations WHERE id=$1 AND user_id=$2 AND expires_at>now() FOR UPDATE NOWAIT', [id, user]);
      if (!locked.rowCount) throw new HttpError(404, 'Conversation not found.');
      const scoped = Object.create(this);
      scoped.db = db;
      const result = await fn(await scoped.get(id, user), scoped);
      await db.query('COMMIT');
      return result;
    } catch (e) {
      await db.query('ROLLBACK');
      if (e.code === '55P03') throw new HttpError(409, 'A reply is already being prepared.');
      throw e;
    } finally {
      db.release();
    }
  }
  async saveTurn(c, question, reply, summary) {
    const userId = randomUUID(),
      id = randomUUID();
    await this.db.query("INSERT INTO chatbot.messages(id,conversation_id,role,encrypted_payload) VALUES($1,$2,'user',$3),($4,$2,'assistant',$5)", [userId, c.id, this.crypto.seal({
      content: question
    }), id, this.crypto.seal(reply)]);
    await this.db.query('UPDATE chatbot.conversations SET updated_at=now() WHERE id=$1', [c.id]);
    await this.db.query('INSERT INTO chatbot.conversation_summaries(conversation_id,encrypted_summary,last_message_id) VALUES($1,$2,$3) ON CONFLICT(conversation_id) DO UPDATE SET encrypted_summary=$2,last_message_id=$3,updated_at=now()', [c.id, this.crypto.seal(summary), id]);
    await this.db.query('INSERT INTO chatbot.safety_events(id,conversation_id,categories,risk_level,action_taken,classifier_version) VALUES($1,$2,$3,$4,$5,$6)', [randomUUID(), c.id, reply.safety.categories, reply.safety.risk_level, reply.route, 'rules+semantic-v1']);
    await this.db.query('INSERT INTO chatbot.retrieval_logs(id,conversation_id,chunk_ids,scores) VALUES($1,$2,$3,$4)', [randomUUID(), c.id, reply.sources.map(s => s.id), JSON.stringify(reply.sources.map(s => s.score))]);
    return {
      id,
      role: 'assistant',
      ...reply
    };
  }
  async listMemories(user) {
    return (await this.db.query('SELECT id,encrypted_memory,expires_at FROM chatbot.user_memories WHERE user_id=$1 AND expires_at>now() ORDER BY created_at LIMIT 10', [user])).rows.map(m => ({
      id: m.id,
      memory: this.crypto.open(m.encrypted_memory),
      expires_at: m.expires_at
    }));
  }
  async addMemory(user, memory) {
    if ((await this.listMemories(user)).length >= 10) throw new HttpError(400, 'Delete an existing memory before adding another.');
    const id = randomUUID();
    await this.db.query("INSERT INTO chatbot.user_memories(id,user_id,encrypted_memory,consent_status) VALUES($1,$2,$3,'explicit')", [id, user, this.crypto.seal(memory)]);
    return {
      id,
      memory
    };
  }
  async deleteMemory(user, id) {
    const r = await this.db.query('DELETE FROM chatbot.user_memories WHERE id=$1 AND user_id=$2', [id, user]);
    if (!r.rowCount) throw new HttpError(404, 'Memory not found.');
  }
  async feedback(user, id, rating, reason) {
    const found = await this.db.query("SELECT m.id FROM chatbot.messages m JOIN chatbot.conversations c ON c.id=m.conversation_id WHERE m.id=$1 AND c.user_id=$2 AND m.role='assistant' AND c.expires_at>now()", [id, user]);
    if (!found.rowCount) throw new HttpError(404, 'Message not found.');
    await this.db.query('INSERT INTO chatbot.feedback(id,message_id,user_id,rating,report_reason) VALUES($1,$2,$3,$4,$5) ON CONFLICT(message_id,user_id) DO UPDATE SET rating=$4,report_reason=$5', [randomUUID(), id, user, rating, reason]);
  }
  async listDocuments() {
    return (await this.db.query('SELECT id,metadata,filename,review_status,state,reviewed_by,reviewed_at,created_at FROM chatbot.documents ORDER BY created_at DESC LIMIT 100')).rows;
  }
  async document(id) {
    const d = (await this.db.query('SELECT * FROM chatbot.documents WHERE id=$1', [id])).rows[0];
    if (!d) throw new HttpError(404, 'Document not found.');
    return d;
  }
  async addDocument(d) {
    const id = randomUUID();
    await this.db.query('INSERT INTO chatbot.documents(id,metadata,filename,content,mime,digest,submitted_by) VALUES($1,$2,$3,$4,$5,$6,$7)', [id, d.metadata, d.filename, d.content, d.mime, d.digest, d.submitted_by]);
    return id;
  }
  async review(id, actor, approved) {
    const db = await this.pool.connect();
    try {
      await db.query('BEGIN');
      const r = await db.query("UPDATE chatbot.documents SET review_status=$2,state=$3,reviewed_by=$4,reviewed_at=now() WHERE id=$1 RETURNING id", [id, approved ? 'approved' : 'rejected', approved ? 'queued' : 'waiting_review', actor]);
      if (!r.rowCount) throw new HttpError(404, 'Document not found.');
      await db.query('DELETE FROM chatbot.document_chunks WHERE document_id=$1', [id]);
      if (approved) await db.query("INSERT INTO chatbot.ingestion_jobs(id,document_id) VALUES($1,$2) ON CONFLICT(document_id) DO UPDATE SET status='queued',attempts=0,available_at=now(),locked_at=NULL,last_error=NULL", [randomUUID(), id]);else await db.query('DELETE FROM chatbot.ingestion_jobs WHERE document_id=$1', [id]);
      await db.query('INSERT INTO chatbot.knowledge_audit(id,document_id,actor_id,action) VALUES($1,$2,$3,$4)', [randomUUID(), id, actor, approved ? 'approved' : 'rejected']);
      await db.query('COMMIT');
    } catch (e) {
      await db.query('ROLLBACK');
      throw e;
    } finally {
      db.release();
    }
  }
  async close() {
    await this.pool.end();
  }
}
