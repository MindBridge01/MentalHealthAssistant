const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),express=require('express'),request=require('supertest');
function setup(role){let called=0;const service=new Proxy({},{get:()=>async()=>{called++;return [];}});const deps={express,'../middleware/authMiddleware':{authenticateJWT:()=> (req,res,next)=>{if(!role)return res.sendStatus(401);req.user={_id:'actor',role:'admin'};next();}},'../models/userModel':{findUserById:async()=>({_id:'actor',role})},'../services/careService':{createCareService:()=>service},'../config/database':{},'../middleware/rateLimitMiddleware':{createRateLimiter:()=> (req,res,next)=>next()}};const module={exports:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../routes/careRoutes.js'),'utf8'),{module,require:id=>deps[id]});const app=express();app.use(express.json());app.use(module.exports);return {app,count:()=>called};}
test('care routes use live roles and deny hospital/admin/public escalation',async()=>{
 for(const role of [null,'patient','doctor','hospital','admin']){const {app}=setup(role);assert.equal((await request(app).post('/hospitals').send({})).status,role==='admin'?200:role?403:401);assert.equal((await request(app).put('/profile').send({})).status,role==='doctor'?200:role?403:401);assert.equal((await request(app).post('/bookings').send({})).status,role==='patient'?200:role?403:401);assert.equal((await request(app).patch('/bookings/id').send({})).status,['hospital','patient'].includes(role)?200:role?403:401);}
 const result=await request(setup('hospital').app).get('/bookings');assert.equal(result.headers['cache-control'],'no-store');
});
test('professional registration keeps doctor licensing mandatory and requires counsellor explanation',()=>{
 const {validateProfessional}=require('../services/professionalValidation');const base={name:'Demo',phone:'0000000',profession:'doctor',country:'Sri Lanka',specialty:'Mental health',qualification:'Demo degree',institution:'Demo university',practiceLocation:'Demo clinic',languages:'English',consent:true,registrationApplicable:false};
 assert.throws(()=>validateProfessional(base),/registration authority/);
 assert.throws(()=>validateProfessional({...base,profession:'counsellor'}),/Explain/);
 assert.equal(validateProfessional({...base,profession:'counsellor',registrationExplanation:'No applicable statutory registration; admin must verify.'}).registrationApplicable,false);
});
