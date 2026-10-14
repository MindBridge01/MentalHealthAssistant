const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const express=require('express');
const request=require('supertest');
const {documentType}=require('../services/registrationDocumentService');
function setup(role,scanFails=false){
 let uploaded=0,reviewed=0;
 const deps={express,multer:require('multer'),
 '../middleware/rateLimitMiddleware':{createRateLimiter:()=> (req,res,next)=>next()},
 '../middleware/authMiddleware':{authenticateJWT:()=> (req,res,next)=>{if(!role)return res.sendStatus(401);req.user={_id:'owner',role:'admin'};next();}},
 '../models/userModel':{findUserById:async()=>({_id:'owner',role})},
 '../services/registrationDocumentService':{documentType,scanDocument:async()=>{if(scanFails)throw {status:503};}},
 '../models/professionalRegistrationModel':{get:async()=>({status:'draft'}),list:async()=>[],history:async()=>[],review:async()=>{reviewed++;return {};},upload:async()=>{uploaded++;},download:async()=>({buffer:Buffer.from('test'),mime:'application/pdf'})}};
 const module={exports:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../routes/professionalRegistrationRoutes.js'),'utf8'),{module,require:id=>{if(!deps[id])throw Error(id);return deps[id];}});
 const app=express();app.use(express.json());app.use(module.exports);return {app,count:()=>({uploaded,reviewed})};
}
test('professional routes enforce current role and owner access',async()=>{
 const {app,count}=setup('pending-doctor');
 assert.equal((await request(app).get('/applications')).status,403);
 assert.equal((await request(app).patch('/applications/owner').send({status:'approved'})).status,403);
 assert.equal((await request(app).get('/documents/other/00000000-0000-0000-0000-000000000000')).status,403);
 assert.equal(count().reviewed,0);
 assert.equal((await request(setup(null).app).get('/me')).status,401);
 assert.equal((await request(setup('patient').app).get('/me')).status,403);
 const admin=setup('admin');assert.equal((await request(admin.app).get('/applications/owner')).status,200);
});
test('credentials require valid bytes, a working scanner and an applicant account',async()=>{
 for(const [role,failed,status] of [['pending-doctor',false,201],['pending-doctor',true,503],['admin',false,403]]){
 const {app,count}=setup(role,failed);
 assert.equal((await request(app).post('/documents/degree').attach('file',Buffer.from('%PDF-test'),'degree.pdf')).status,status);
 assert.equal(count().uploaded,status===201?1:0);
 }
 assert.equal((await request(setup('pending-doctor').app).post('/documents/degree').attach('file',Buffer.from('bad'),'degree.pdf')).status,400);
});
