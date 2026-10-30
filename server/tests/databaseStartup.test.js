const test=require('node:test'),assert=require('node:assert/strict');
const {connectWithRetry}=require('../services/databaseStartup');
test('retries a temporary disconnect and succeeds',async()=>{
 let n=0;await connectWithRetry(async()=>{if(++n<3)throw Error('Connection terminated unexpectedly');},{wait:async()=>{},log:()=>{}});assert.equal(n,3);
});
test('does not retry invalid credentials or certificates',async()=>{
 for(const code of ['28P01','SELF_SIGNED_CERT_IN_CHAIN']){
 let n=0;await assert.rejects(connectWithRetry(async()=>{n++;throw Object.assign(Error('invalid'),{code});},{wait:async()=>{},log:()=>{}}));assert.equal(n,1);
 }
});
test('stops after four attempts',async()=>{
 let n=0;await assert.rejects(connectWithRetry(async()=>{n++;throw Error('Connection terminated unexpectedly');},{wait:async()=>{},log:()=>{}}));assert.equal(n,4);
});
