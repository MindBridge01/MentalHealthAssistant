import assert from 'node:assert/strict';
const base='http://127.0.0.1:18882';
const get=path=>fetch(base+path,{headers:{'X-Forwarded-Proto':'https'},signal:AbortSignal.timeout(15000),redirect:'error'});
const ready=await (await get('/ready')).json();
assert.equal(ready.status,'ready');
if(process.env.CONTAINER_SHA) assert.equal(ready.release,process.env.CONTAINER_SHA);
for(const path of ['/login','/doctor/dashboard','/patient/dashboard','/hospital/dashboard','/admin/dashboard']){
 const response=await get(path);assert.equal(response.status,200);
 assert.match(response.headers.get('content-security-policy'),/accounts\.google\.com/);
 assert((await response.text()).includes('<div id="root">'));
}
for(const path of ['/server/.env','/missing.js','/api/not-a-route'])assert.equal((await get(path)).status,404);
assert.equal((await fetch(base+'/api/upload',{method:'POST',headers:{'X-Forwarded-Proto':'https'}})).status,401);
console.log('Production container: real migrations, PostgreSQL readiness, role routes, security headers and upload authentication passed.');
