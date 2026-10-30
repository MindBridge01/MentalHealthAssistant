import assert from 'node:assert/strict';
const origin = process.env.DEPLOY_URL;
assert(origin?.startsWith('https://'), 'Set DEPLOY_URL to the HTTPS website origin.');
const sha = process.env.DEPLOY_SHA;
async function get(path) {
  const response = await fetch(new URL(path, origin), {signal: AbortSignal.timeout(20000), redirect: 'error'});
  assert(response.ok, `${path} returned ${response.status}`);
  return response;
}
const ready = await (await get('/ready')).json();
assert.equal(ready.status, 'ready');
if (sha) assert.equal(ready.release, sha, 'Deployment has not reached the requested commit.');
for (const path of ['/login', '/patient/dashboard', '/doctor/dashboard', '/hospital/dashboard', '/admin/dashboard']) {
  assert((await (await get(path)).text()).includes('<div id="root">'), `${path} did not serve the React application`);
}
assert((await (await get('/config.js')).text()).includes('window.__MINDBRIDGE_CONFIG__'));
console.log('Database readiness, release identity, public configuration and SPA routes passed.');
