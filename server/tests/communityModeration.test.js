const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { PGlite } = require('@electric-sql/pglite');
const express = require('express');
const request = require('supertest');

process.env.PHI_ENCRYPTION_KEY ||= '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

const { runMigrations } = require('../migrations/migrationRunner');
const { backfillRegistry } = require('../migrations/registryBackfill');
const { normalizeId } = require('../models/_shared');
const {
  deliverCommunityPostNext,
  renderCommunityPostEmail,
} = require('../services/communityPostEmailDelivery');

function adapter(pg) {
  return {
    query: async (sql, params = []) => {
      sql = sql.replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;', '');
      if (params.length) return pg.query(sql, params);
      return (await pg.exec(sql)).at(-1) || { rows: [] };
    },
    withTransaction: (callback) => pg.transaction((transaction) => callback(adapter(transaction))),
  };
}

function loadModel(file, database) {
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    require: (id) => {
      if (id === '../config/database') return database;
      if (id === './_shared') return { normalizeId };
      throw new Error(`Unexpected dependency ${id}`);
    },
  });
  return module.exports;
}

test('community posts remain hidden until an admin approves them', async (t) => {
  const pg = new PGlite();
  t.after(() => pg.close());
  const database = adapter(pg);
  await database.withTransaction((client) => runMigrations(client, backfillRegistry));
  await database.query("INSERT INTO users(id,email,name,role) VALUES('patient-1','patient@example.test','Patient One','patient'),('admin-1','admin@example.test','Admin One','admin')");

  const community = loadModel('models/communityModel.js', database);
  const posts = loadModel('models/postModel.js', database);
  const pendingPost = await community.createCommunityPost({
    _id: '111111111111111111111111',
    caption: 'A personal reflection awaiting review',
    submittedBy: 'patient-1',
    name: 'Patient One',
    createdAt: new Date().toISOString(),
  });

  assert.equal(pendingPost.moderationStatus, 'pending');
  assert.equal((await community.listCommunityPosts('patient-1')).length, 0);
  assert.equal((await posts.listPosts()).length, 0);
  assert.equal((await community.listPendingCommunityPosts())[0].submitter.email, 'patient@example.test');
  assert.equal((await database.query('SELECT count(*)::int AS count FROM community_post_email_jobs')).rows[0].count, 1);
  const sentMessages = [];
  assert.equal(await deliverCommunityPostNext({
    database,
    transport: {
      sendMail: async (message) => {
        sentMessages.push(message);
        return { accepted: ['admin@example.test'], rejected: [] };
      },
    },
    config: {
      adminEmail: 'admin@example.test',
      appOrigin: 'https://mindbridge.example',
      from: 'MindBridge <no-reply@example.test>',
    },
  }), true);
  assert.equal(sentMessages[0].to, 'admin@example.test');
  assert.doesNotMatch(sentMessages[0].text, /A personal reflection awaiting review/);
  assert.equal((await database.query('SELECT status FROM community_post_email_jobs')).rows[0].status, 'sent');

  await community.reviewCommunityPost(pendingPost._id, 'admin-1', 'approved');
  assert.equal((await community.listCommunityPosts('patient-1')).length, 1);
  assert.equal((await posts.listPosts()).length, 1);
  assert.deepEqual(await community.listPendingCommunityPosts(), []);

  const rejectedPost = await community.createCommunityPost({
    _id: '222222222222222222222222',
    caption: 'A separate reflection that is rejected',
    submittedBy: 'patient-1',
    createdAt: new Date().toISOString(),
  });
  await community.reviewCommunityPost(rejectedPost._id, 'admin-1', 'rejected');
  assert.equal((await community.listCommunityPosts('patient-1')).length, 1);
  assert.equal((await posts.listPosts()).length, 1);
});

test('admin notification contains a secure review link without the submitted story', () => {
  const email = renderCommunityPostEmail('111111111111111111111111', 'https://mindbridge.example');
  assert.match(email.subject, /awaiting review/);
  assert.match(email.text, /https:\/\/mindbridge\.example\/admin\/content-review/);
  assert.match(email.text, /111111111111111111111111/);
  assert.doesNotMatch(email.text, /personal story|patient reflection text/i);
});

test('admin community review endpoints list pending posts and publish only valid decisions', async () => {
  const decisions = [];
  const dependencies = {
    express,
    '../models/userModel': {
      findUserById: async () => ({ _id: 'admin-1', role: 'admin' }),
      deleteUser: async () => {},
      listUsers: async () => [],
      updateUser: async () => null,
    },
    '../services/auditLogService': { listAuditLogs: async () => [] },
    '../middleware/authMiddleware': {
      authenticateJWT: () => (req, _res, next) => {
        req.user = { _id: 'admin-1', role: 'admin' };
        next();
      },
      authorizeRoles: (...roles) => (req, res, next) =>
        roles.includes(req.user.role) ? next() : res.sendStatus(403),
    },
    '../middleware/permissionMiddleware': { requirePermission: () => (_req, _res, next) => next() },
    '../models/adminDashboardModel': {
      summary: async () => ({}),
      directory: async () => ({}),
      appointments: async () => ({}),
      emails: async () => ({}),
      activity: async () => ({}),
      retryEmail: async () => ({}),
    },
    '../models/communityModel': {
      listPendingCommunityPosts: async () => [{ _id: '111111111111111111111111', caption: 'Pending story' }],
      reviewCommunityPost: async (postId, adminId, decision) => {
        decisions.push({ postId, adminId, decision });
        return { _id: postId, moderationStatus: decision };
      },
    },
  };
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(__dirname, '..', 'routes/adminRoutes.js'), 'utf8');
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    require: (id) => {
      if (!(id in dependencies)) throw new Error(`Unexpected dependency ${id}`);
      return dependencies[id];
    },
  });
  const app = express();
  app.use(express.json());
  app.use('/api/admin', module.exports);

  const listed = await request(app).get('/api/admin/community-posts/pending');
  assert.equal(listed.status, 200);
  assert.equal(listed.body.posts[0].caption, 'Pending story');

  const approved = await request(app)
    .patch('/api/admin/community-posts/111111111111111111111111/review')
    .send({ decision: 'approved' });
  assert.equal(approved.status, 200);
  assert.equal(approved.body.post.moderationStatus, 'approved');
  assert.deepEqual(decisions, [{
    postId: '111111111111111111111111',
    adminId: 'admin-1',
    decision: 'approved',
  }]);

  const invalid = await request(app)
    .patch('/api/admin/community-posts/111111111111111111111111/review')
    .send({ decision: 'published' });
  assert.equal(invalid.status, 400);
});
