const express = require('express');
const fs = require('node:fs');
const path = require('node:path');

function mountHealthRoutes(app, checkDatabase) {
  // Platform probes must work over the private HTTP connection before HTTPS enforcement.
  app.get('/health', (_req, res) => res.json({status: 'Server is running'}));
  app.get('/ready', async (_req, res) => {
    let timer;
    try {
      await Promise.race([checkDatabase(), new Promise((_, reject) => {
        timer = setTimeout(() => reject(Error('Database readiness timeout')), 5000);
      })]);
      res.set('Cache-Control', 'no-store').json({status: 'ready', release: process.env.APP_RELEASE_SHA || null});
    } catch {
      res.status(503).set('Cache-Control', 'no-store').json({status: 'unavailable'});
    } finally { clearTimeout(timer); }
  });
}
function mountWebApp(app, directory) {
  const root = path.resolve(directory);
  if (!fs.existsSync(path.join(root, 'index.html'))) throw Error('Compiled web application is missing.');
  app.use(express.static(root, {index: false, setHeaders(res, filename) {
    res.set('Cache-Control', /(?:index\.html|config\.js)$/.test(filename) ? 'no-store' : 'public, max-age=3600');
  }}));
  app.use((req, res, next) => {
    // Unknown API/asset requests must remain 404s, not become HTML responses.
    if (!['GET', 'HEAD'].includes(req.method) || /^\/(?:api|socket\.io|uploads)(?:\/|$)/.test(req.path) || /(?:^|\/)\./.test(req.path) || path.extname(req.path) || !req.accepts('html')) return next();
    res.set('Cache-Control', 'no-store').sendFile(path.join(root, 'index.html'));
  });
}
module.exports = {mountHealthRoutes, mountWebApp};
