const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const express=require('express');
const request=require('supertest');
const {createGateway,allowedPath,signIdentity}=require('../services/chatbotGateway');
test('gateway denies session minting, preview roles, traversal and unverified administrator MFA',async()=>{
  for(const p of ['/session','/demo-session','/auth/chatbot-token','/../admin/documents'])assert.equal(allowedPath('POST',p),false);
  const app=express();app.use((req,res,next)=>{req.user={_id:'a',role:'admin',mfa:false};next();});app.use(createGateway());
  assert.equal((await request(app).get('/admin/documents')).status,403);
});
test('server minted identities are compatible with standalone verification',async()=>{
  const {verifyToken}=await import('../../chatbot/server/security.js');
  const secret='test-secret-never-used-for-real-identities';
  assert.deepEqual(verifyToken(signIdentity({_id:'patient-1',role:'patient'},secret),secret),{id:'patient-1',role:'patient'});
});
test('gateway forwards only server identity and JSON; strips upstream cookies',async t=>{
  let received;
  const upstream=http.createServer((req,res)=>{let body='';req.on('data',c=>body+=c);req.on('end',()=>{received={headers:req.headers,path:req.url,body};res.setHeader('Content-Type','application/json');res.setHeader('Set-Cookie','unsafe=test');res.end('{"ok":true}');});});
  await new Promise(resolve=>upstream.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>upstream.close(resolve)));
  const app=express();app.use(express.json());app.use((req,res,next)=>{req.user={_id:'patient-1',role:'patient'};next();});
  app.use(createGateway({env:{CHATBOT_AUTH_SECRET:'test-secret-never-used-for-real-identities',CHATBOT_SERVICE_URL:`http://127.0.0.1:${upstream.address().port}`}}));
  const res=await request(app).post('/conversations').set('Cookie','auth_token=private').set('Authorization','Bearer forged').send({consent:true});
  assert.equal(res.status,200);assert.equal(res.headers['set-cookie'],undefined);assert.equal(received.headers.cookie,undefined);assert.notEqual(received.headers.authorization,'Bearer forged');assert.equal(received.path,'/api/conversations');assert.deepEqual(JSON.parse(received.body),{consent:true});
  assert.equal((await request(app).get('/admin/documents')).status,403);
});
