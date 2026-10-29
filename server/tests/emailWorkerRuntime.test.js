const test=require('node:test');
const assert=require('node:assert/strict');
const {startEmailWorker}=require('../services/emailWorkerRuntime');
const env={APP_PUBLIC_URL:'https://example.test',REGISTRATION_ADMIN_EMAIL:'admin@example.test',MAIL_FROM:'mail@example.test',SMTP_HOST:'example.test'};
const logger={log(){},error(){}};
test('check verifies connection without delivering; closes transport but not shared database',async()=>{
 let sent=0,closed=0;
 const worker=startEmailWorker({env,logger,database:{query:async()=>{}},check:true,createTransport:()=>({verify:async()=>{},close:()=>closed++}),processQueue:async()=>sent++});
 assert.equal(await worker.done,true);assert.equal(sent,0);assert.equal(closed,1);
});
test('transient SMTP failure retries and shutdown interrupts idle wait',async()=>{
 let verifies=0,processed=0,closed=0;
 let reached;const ready=new Promise(resolve=>reached=resolve);
 const worker=startEmailWorker({env,logger,retryMs:1,idleMs:60000,database:{query:async()=>{}},createTransport:()=>({verify:async()=>{if(++verifies===1)throw Object.assign(Error('private'),{code:'ETIMEDOUT'});},close:()=>closed++}),processQueue:async()=>{processed++;reached();return false;}});
 await ready;await worker.stop();assert.equal(verifies,2);assert.equal(processed,1);assert.equal(closed,2);
});
test('invalid configuration never queries database or starts SMTP',async()=>{
 const worker=startEmailWorker({env:{},logger,database:{query:()=>assert.fail('unexpected database access')}});
 assert.equal(await worker.done,false);
});
