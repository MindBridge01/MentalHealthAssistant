const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const express = require('express');
const request = require('supertest');
const {mountHealthRoutes, mountWebApp} = require('../services/webHosting');

test('platform probes distinguish liveness from database readiness without exposing errors', async () => {
  const app = express();
  mountHealthRoutes(app, async () => {throw Error('private database password');});
  assert.equal((await request(app).get('/health')).status, 200);
  const response = await request(app).get('/ready');
  assert.equal(response.status, 503);
  assert.deepEqual(response.body, {status: 'unavailable'});
  assert.equal(response.headers['cache-control'], 'no-store');
});
test('a ready database returns release identity', async () => {
  const app = express();
  mountHealthRoutes(app, async () => {});
  const response = await request(app).get('/ready');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ready');
});
test('deep links serve the SPA while missing API and asset URLs remain 404', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'mb-web-'));
  t.after(() => fs.rm(root, {recursive: true, force: true}));
  await fs.writeFile(path.join(root, 'index.html'), '<div id="root"></div>');
  await fs.writeFile(path.join(root, 'config.js'), 'window.__MINDBRIDGE_CONFIG__={};');
  const app = express();mountWebApp(app, root);
  for (const url of ['/login', '/doctor/dashboard', '/admin/dashboard']) {
    const response = await request(app).get(url).set('Accept', 'text/html');
    assert.equal(response.status, 200);assert.match(response.text, /id="root"/);
    assert.equal(response.headers['cache-control'], 'no-store');
  }
  for (const url of ['/api/missing', '/uploads/missing', '/missing.js', '/socket.io/missing', '/server/.env']) assert.equal((await request(app).get(url)).status, 404);
  assert.equal((await request(app).post('/login')).status, 404);
  assert.equal((await request(app).get('/config.js')).headers['cache-control'], 'no-store');
});
