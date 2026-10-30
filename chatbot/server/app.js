import {scanSource} from './documentScanner.js';
import express from 'express';
import helmet from 'helmet';
import multer from 'multer';
import { randomUUID, createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { HttpError, text, uuid, verifyToken, signToken } from './security.js';
export function createApp({
  config,
  store,
  pipeline
}) {
  const app = express();
  app.disable('x-powered-by');
  app.use((req,res,next)=>{
    if(config.demo && req.headers['x-mindbridge-integration']==='website') return res.status(503).json({error:'The website requires the connected chatbot service, not preview mode.'});
    next();
  });
  app.use(helmet());
  app.use(express.json({
    limit: '32kb'
  }));
  const demoSecret = randomUUID() + randomUUID(),
    limits = new Map();
  const cookieOptions = `HttpOnly; SameSite=Strict; Path=/api; Max-Age=300${config.production ? '; Secure' : ''}`;
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-Request-ID', randomUUID());
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin !== config.origin && !req.headers.authorization?.startsWith('Bearer ')) return res.status(403).json({
      error: 'Request origin is not allowed.'
    });
    next();
  });
  app.get('/api/health', (_, res) => res.json({
    status: 'ok',
    mode: config.demo ? 'preview' : 'connected',
    retentionDays: 30,
    notice: 'Supportive information, not diagnosis or emergency care.'
  }));
  function token(req) {
    return req.headers.authorization?.replace(/^Bearer /, '') || req.headers.cookie?.match(/(?:^|;\s*)chat_session=([^;]+)/)?.[1];
  }
  app.post('/api/session', (req, res) => {
    const raw = text(req.body.token, 4096);
    const user = verifyToken(raw, config.authSecret || demoSecret);
    res.set('Set-Cookie', `chat_session=${raw}; ${cookieOptions}`);
    res.json({
      user
    });
  });
  app.post('/api/demo-session', (req, res) => {
    if (!config.demo) throw new HttpError(404, 'Not found.');
    const role = req.body.role === 'admin' ? 'admin' : 'patient';
    const now = Math.floor(Date.now() / 1000);
    const raw = signToken({
      sub: `demo-${role}`,
      role,
      mfa: role === 'admin',
      iss: 'mindbridge',
      aud: 'mindbridge-chatbot',
      iat: now,
      exp: now + 300
    }, demoSecret);
    res.set('Set-Cookie', `chat_session=${raw}; ${cookieOptions}`);
    res.json({
      user: {
        id: `demo-${role}`,
        role
      }
    });
  });
  app.use('/api', (req, res, next) => {
    try {
      req.user = verifyToken(token(req) || '', config.authSecret || demoSecret);
      next();
    } catch (e) {
      next(e);
    }
  });
  app.get('/api/me', (req, res) => res.json({
    user: req.user
  }));
  app.post('/api/logout', (_, res) => {
    res.set('Set-Cookie', `chat_session=; ${cookieOptions.replace('Max-Age=300', 'Max-Age=0')}`);
    res.json({
      ok: true
    });
  });
  app.use('/api', (req, res, next) => {
    const now = Date.now();
    for (const [key, item] of limits) if (item.expires < now) limits.delete(key);
    let item = limits.get(req.user.id);
    if (!item) {
      item = {
        count: 0,
        expires: now + 60000
      };
      limits.set(req.user.id, item);
    }
    if (++item.count > 60) {
      res.set('Retry-After', '60');
      return res.status(429).json({
        error: 'Please wait a moment before trying again.'
      });
    }
    next();
  });
  app.get('/api/conversations', async (req, res) => res.json(await store.list(req.user.id)));
  app.post('/api/conversations', async (req, res) => {
    if (req.body.consent !== true) throw new HttpError(400, 'Consent to storing this conversation is required.');
    const c = await store.create(req.user.id);
    res.status(201).json({
      id: c.id
    });
  });
  app.get('/api/conversations/:id', async (req, res) => {
    const c = await store.get(uuid(req.params.id), req.user.id);
    res.json({
      id: c.id,
      messages: c.messages,
      created_at: c.created_at,
      expires_at: c.expires_at
    });
  });
  app.delete('/api/conversations/:id', async (req, res) => {
    await store.remove(uuid(req.params.id), req.user.id);
    res.json({
      ok: true
    });
  });
  app.post('/api/conversations/:id/messages', async (req, res) => {
    const message = text(req.body.message);
    const result = await store.withConversation(uuid(req.params.id), req.user.id, async (c, scoped) => {
      if (c.messages.length >= 100) throw new HttpError(400, 'This conversation has reached its limit. Please start a new conversation.');
      const reply = await pipeline.reply(message, c, scoped);
      const summary = await pipeline.summary(c);
      return scoped.saveTurn(c, message, reply, summary);
    });
    res.json(result);
  });
  app.get('/api/memories', async (req, res) => res.json(await store.listMemories(req.user.id)));
  app.post('/api/memories', async (req, res) => {
    if (req.body.consent !== true) throw new HttpError(400, 'Explicit memory consent is required.');
    res.status(201).json(await store.addMemory(req.user.id, text(req.body.memory, 500)));
  });
  app.delete('/api/memories/:id', async (req, res) => {
    await store.deleteMemory(req.user.id, uuid(req.params.id));
    res.json({
      ok: true
    });
  });
  app.post('/api/feedback', async (req, res) => {
    if (![-1, 1].includes(req.body.rating) || req.body.reason && !['unsafe', 'incorrect', 'unhelpful', 'other'].includes(req.body.reason)) throw new HttpError(400, 'Invalid feedback.');
    await store.feedback(req.user.id, uuid(req.body.messageId), req.body.rating, req.body.reason || null);
    res.json({
      ok: true
    });
  });
  app.use('/api/admin', (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({
      error: 'Administrator access required.'
    });
    next();
  });
  app.get('/api/admin/documents', async (req, res) => res.json(await store.listDocuments()));
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
      fields: 1,
      fieldSize: 8192
    }
  });
  app.post('/api/admin/documents', upload.single('file'), async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Choose a PDF or text file.');
    let metadata;
    try {
      metadata = JSON.parse(req.body.metadata);
    } catch {
      throw new HttpError(400, 'Invalid document metadata.');
    }
    const fields = ['title', 'source', 'source_url', 'author', 'publication_date', 'topic', 'evidence_type'];
    const clean = {};
    for (const key of fields) clean[key] = text(metadata[key], key === 'source_url' ? 1500 : 250);
    let url;
    try {
      url = new URL(clean.source_url);
    } catch {
      throw new HttpError(400, 'Use an HTTPS source URL.');
    }
    if (url.protocol !== 'https:' || url.username || url.password) throw new HttpError(400, 'Use an HTTPS source URL without credentials.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(clean.publication_date) || !Number.isFinite(Date.parse(clean.publication_date))) throw new HttpError(400, 'Use a valid publication date.');
    if (!['clinical_guideline', 'systematic_review', 'research_paper', 'professional_guidance', 'patient_information'].includes(clean.evidence_type)) throw new HttpError(400, 'Choose an evidence type.');
    clean.language = 'en';
    clean.audience = 'adult';
    const pdf = req.file.buffer.subarray(0, 5).toString() === '%PDF-';
    const plain = req.file.originalname.toLowerCase().endsWith('.txt');
    if (!pdf && !plain) throw new HttpError(400, 'Only PDF or plain text is supported.');
    if (plain && req.file.buffer.includes(0)) throw new HttpError(400, 'Invalid plain text file.');
    if (!config.demo) await scanSource(req.file.buffer);
    const id = await store.addDocument({
      metadata: clean,
      filename: req.file.originalname.replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 150),
      content: req.file.buffer,
      mime: pdf ? 'application/pdf' : 'text/plain',
      digest: createHash('sha256').update(req.file.buffer).digest('hex'),
      submitted_by: req.user.id
    });
    res.status(201).json({
      id
    });
  });
  app.get('/api/admin/documents/:id/file', async (req, res) => {
    const d = await store.document(uuid(req.params.id));
    res.set('Content-Disposition', 'attachment; filename="knowledge-source"');
    res.type('application/octet-stream').send(d.content);
  });
  app.post('/api/admin/documents/:id/review', async (req, res) => {
    if (!['approve', 'reject'].includes(req.body.decision)) throw new HttpError(400, 'Choose approve or reject.');
    if (req.body.decision === 'approve' && req.body.clinicalReviewConfirmed !== true) throw new HttpError(400, 'Confirm qualified clinical review before approval.');
    await store.review(uuid(req.params.id), req.user.id, req.body.decision === 'approve');
    res.json({
      ok: true,
      notice: config.demo ? 'Preview only: ingestion worker is not connected.' : undefined
    });
  });
  app.use('/api', (_, res) => res.status(404).json({
    error: 'Endpoint not found.'
  }));
  if (existsSync(resolve('dist/index.html'))) {
    app.use(express.static(resolve('dist')));
    app.get('/{*path}', (_, res) => res.sendFile(resolve('dist/index.html')));
  }
  app.use((error, req, res, next) => {
    if (!(error instanceof HttpError)) console.error('[chatbot] Request failed:', /^[A-Z0-9_]{2,50}$/.test(error.code || '') ? error.code : 'UNCLASSIFIED');
    const status = error instanceof HttpError ? error.status : error.code === 'LIMIT_FILE_SIZE' ? 413 : error.type === 'entity.too.large' ? 413 : 500;
    res.status(status).json({
      error: status === 500 ? 'The request could not be completed. Please try again.' : status === 413 ? 'File or request is too large.' : error.message
    });
  });
  return app;
}

