const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const express = require('express');
const request = require('supertest');
const { documentType } = require('../services/registrationDocumentService');

function appFor(role = 'patient', scannerFails = false) {
  let added = 0;
  const dependencies = {
    express, multer: require('multer'),
    '../middleware/authMiddleware': {
      authenticateJWT: () => (req, res, next) => { if (!role) return res.sendStatus(401); req.user = { _id: 'owner', role: 'admin' }; next(); },
      authorizeRoles: (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.sendStatus(403),
    },
    '../models/userModel': { findUserById: async () => ({ role }) },
    '../services/registrationValidation': require('../services/registrationValidation'),
    '../models/registrationModel': {},
    '../config/database': {},
    '../middleware/rateLimitMiddleware': { authenticatedChatRateLimiter: (_req, _res, next) => next() },
    '../services/registrationDocumentService': { documentType, scanDocument: async () => { if (scannerFails) throw Object.assign(new Error('scanner unavailable'), { status: 503 }); } },
    '../models/registrationDocumentModel': {
      addDocument: async (userId, file) => { added++; return { userId, size: file.buffer.length }; },
      readDocument: async () => null,
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../routes/registrationRoutes.js'), 'utf8'), {
    module, exports: module.exports, process: { env: {} }, require: (id) => {
      if (!(id in dependencies)) throw new Error(`Unexpected dependency ${id}`);
      return dependencies[id];
    },
  });
  const app = express(); app.use(express.json()); app.use('/api/registration', module.exports);
  return { app, added: () => added };
}
test('multipart report upload works and unsupported bytes are rejected', async () => {
  const { app, added } = appFor();
  const result = await request(app).post('/api/registration/documents').attach('document', Buffer.from('%PDF-1.4 test'), 'report.pdf');
  assert.equal(result.status, 201);
  assert.equal(result.body.document.userId, 'owner');
  assert.equal((await request(app).post('/api/registration/documents').attach('document', Buffer.from('malicious'), 'report.pdf')).status, 400);
  assert.equal(added(), 1);
});
test('unauthenticated, admin and failed scans cannot persist reports', async () => {
  for (const [role, scannerFails, expected] of [[null, false, 401], ['admin', false, 403], ['patient', true, 503]]) {
    const { app, added } = appFor(role, scannerFails);
    assert.equal((await request(app).post('/api/registration/documents').attach('document', Buffer.from('%PDF-1.4 test'), 'report.pdf')).status, expected);
    assert.equal(added(), 0);
  }
});
test('route checks live role instead of stale admin token and validates IDs', async () => {
  const { app } = appFor('patient');
  assert.equal((await request(app).get('/api/registration/applications')).status, 403);
  assert.equal((await request(app).get('/api/registration/documents/not-a-uuid')).status, 404);
});
