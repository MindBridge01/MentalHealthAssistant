import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../server/app.js';
import { MemoryStore } from '../server/store.js';
import { Pipeline } from '../server/pipeline.js';
const origin = 'http://localhost:5180';
function fixture() {
  const store = new MemoryStore();
  return {
    store,
    app: createApp({
      config: {
        demo: true,
        origin,
        production: false
      },
      store,
      pipeline: new Pipeline({
        demo: true
      })
    })
  };
}
async function session(app, role = 'patient') {
  const r = await request(app).post('/api/demo-session').set('Origin', origin).send({
    role
  }).expect(200);
  return r.headers['set-cookie'][0].split(';')[0];
}
test('unauthenticated access cannot read conversations', async () => {
  const {
    app
  } = fixture();
  await request(app).get('/api/conversations').expect(401);
});
test('website integration cannot use fixture responses from preview mode',async()=>{
  const {app}=fixture();
  await request(app).get('/api/health').set('X-MindBridge-Integration','website').expect(503);
});
test('cross-origin write is rejected', async () => {
  const {
    app
  } = fixture();
  await request(app).post('/api/demo-session').set('Origin', 'https://attacker.test').send({}).expect(403);
});
test('conversation consent, message persistence and deletion', async () => {
  const {
      app
    } = fixture(),
    cookie = await session(app);
  await request(app).post('/api/conversations').set('Origin', origin).set('Cookie', cookie).send({}).expect(400);
  const c = await request(app).post('/api/conversations').set('Origin', origin).set('Cookie', cookie).send({
    consent: true
  }).expect(201);
  const reply = await request(app).post(`/api/conversations/${c.body.id}/messages`).set('Origin', origin).set('Cookie', cookie).send({
    message: 'Hello'
  }).expect(200);
  assert.equal(reply.body.route, 'demo');
  const history = await request(app).get(`/api/conversations/${c.body.id}`).set('Cookie', cookie).expect(200);
  assert.equal(history.body.messages.length, 2);
  await request(app).delete(`/api/conversations/${c.body.id}`).set('Origin', origin).set('Cookie', cookie).expect(200);
  await request(app).get(`/api/conversations/${c.body.id}`).set('Cookie', cookie).expect(404);
});
test('admin cannot read another user conversation', async () => {
  const {
      app,
      store
    } = fixture(),
    c = await store.create('someone-else'),
    cookie = await session(app, 'admin');
  await request(app).get(`/api/conversations/${c.id}`).set('Cookie', cookie).expect(404);
});
test('patient cannot access source administration', async () => {
  const {
      app
    } = fixture(),
    cookie = await session(app);
  await request(app).get('/api/admin/documents').set('Cookie', cookie).expect(403);
});
test('memory requires consent and can be deleted', async () => {
  const {
      app
    } = fixture(),
    cookie = await session(app);
  await request(app).post('/api/memories').set('Origin', origin).set('Cookie', cookie).send({
    memory: 'Short answers'
  }).expect(400);
  const m = await request(app).post('/api/memories').set('Origin', origin).set('Cookie', cookie).send({
    memory: 'Short answers',
    consent: true
  }).expect(201);
  await request(app).delete(`/api/memories/${m.body.id}`).set('Origin', origin).set('Cookie', cookie).expect(200);
});
test('source approval requires clinical review confirmation', async () => {
  const {
      app,
      store
    } = fixture(),
    cookie = await session(app, 'admin'),
    id = await store.addDocument({
      metadata: {
        title: 'Fixture'
      },
      content: Buffer.from('fixture')
    });
  await request(app).post(`/api/admin/documents/${id}/review`).set('Origin', origin).set('Cookie', cookie).send({
    decision: 'approve'
  }).expect(400);
  await request(app).post(`/api/admin/documents/${id}/review`).set('Origin', origin).set('Cookie', cookie).send({
    decision: 'approve',
    clinicalReviewConfirmed: true
  }).expect(200);
  assert.equal((await store.document(id)).review_status, 'approved');
});
test('source upload validates provenance and remains pending', async () => {
  const {
      app,
      store
    } = fixture(),
    cookie = await session(app, 'admin');
  const metadata = {
    title: 'Synthetic source',
    source: 'Example',
    source_url: 'https://example.test/source',
    author: 'Example',
    publication_date: '2026-01-01',
    topic: 'testing',
    evidence_type: 'patient_information'
  };
  const r = await request(app).post('/api/admin/documents').set('Origin', origin).set('Cookie', cookie).field('metadata', JSON.stringify(metadata)).attach('file', Buffer.from('Synthetic source only.'), 'fixture.txt').expect(201);
  assert.equal((await store.document(r.body.id)).review_status, 'pending');
  await request(app).post('/api/admin/documents').set('Origin', origin).set('Cookie', cookie).field('metadata', JSON.stringify({
    ...metadata,
    source_url: 'javascript:alert(1)'
  })).attach('file', Buffer.from('test'), 'fixture.txt').expect(400);
});
