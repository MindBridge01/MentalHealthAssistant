const test=require('node:test');
const assert=require('node:assert/strict');
const {resolveGoogleIdentity}=require('../services/googleIdentity');
test('Google subject resolves an existing account and preserves its database role',async()=>{
 for(const role of ['patient']){
  const result=await resolveGoogleIdentity({sub:'verified-sub',email:'changed@example.test',email_verified:true},
   {findUserByGoogleId:async()=>({_id:'existing',role})},()=> 'unused');
  assert.equal(result.role,role);
 }
});
test('Google does not grant client-requested admin roles or auto-link email matches',async()=>{
 const payload={sub:'subject',email:'new@example.test',email_verified:true,role:'admin'};
 const users={findUserByGoogleId:async()=>null,findUserByEmail:async()=>null,createUser:async value=>value};
 const created=await resolveGoogleIdentity(payload,users,()=> 'new');
 assert.equal(created.role,'patient');assert.equal(created.password,undefined);
 await assert.rejects(resolveGoogleIdentity(payload,{...users,findUserByEmail:async()=>({role:'admin'})},()=> 'new'),{status:409});
 await assert.rejects(resolveGoogleIdentity({...payload,email_verified:false},users,()=> 'new'),{status:401});
});
test('admin dashboard endpoints reject unauthenticated and stale-admin sessions',async()=>{
 const express=require('express'),request=require('supertest'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
 for(const role of [null,'patient','admin']){
  let calls=0;
  const dependencies={express,
   '../models/userModel':{findUserById:async()=>({_id:'test',role})},
   '../services/auditLogService':{},
   '../middleware/authMiddleware':{authenticateJWT:()=> (req,res,next)=>{if(!role)return res.sendStatus(401);req.user={_id:'test',role:'admin'};next();},authorizeRoles:()=> (req,res,next)=>next()},
   '../middleware/permissionMiddleware':{requirePermission:()=> (req,res,next)=>next()},
   '../models/adminDashboardModel':{summary:async()=>{calls++;return {patients:0};}}
  };
  const module={exports:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../routes/adminRoutes.js'),'utf8'),{module,require:id=>{if(!dependencies[id])throw Error(id);return dependencies[id];}});
  const app=express();app.use(express.json());app.use(module.exports);
  const response=await request(app).get('/dashboard');
  assert.equal(response.status,role==='admin'?200:role?403:401);assert.equal(calls,role==='admin'?1:0);
  if(role==='admin'){
   assert.equal(response.headers['cache-control'],'no-store');
   assert.equal((await request(app).patch('/users/test/role').send({role:'admin'})).status,409);
  }
 }
});
