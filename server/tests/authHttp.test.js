const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const express=require('express'),request=require('supertest'),bcrypt=require('bcrypt');
const {PGlite}=require('@electric-sql/pglite');
process.env.PHI_ENCRYPTION_KEY=require('node:crypto').randomBytes(32).toString('hex');
process.env.JWT_SECRET='Synthetic-http-test-key-at-least-32-characters';
const security=require('../services/authSecurity'),jwt=require('../lib/jwt');
function adapter(pg){return {query:async(sql,p=[])=>p.length?pg.query(sql,p):(await pg.exec(sql.replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;',''))).at(-1)||{rows:[]},withTransaction:f=>pg.transaction(tx=>f(adapter(tx)))};}
test('HTTP login issues only a challenge before MFA, protected middleware rejects it, logout revokes the full session',async t=>{
 const pg=new PGlite();t.after(()=>pg.close());const db=adapter(pg);
 await db.withTransaction(c=>require('../migrations/migrationRunner').runMigrations(c,require('../migrations/registryBackfill').backfillRegistry));
 const password='Synthetic administrator password';
 await db.query("INSERT INTO users(id,email,name,role,password) VALUES('admin','admin@example.test','Admin','admin',$1)",[await bcrypt.hash(password,12)]);
 const map=r=>r?{_id:r.id,email:r.email,name:r.name,role:r.role,password:r.password,mfaEnabled:r.mfa_enabled,authVersion:r.auth_version}:null;
 const users={findUserByEmail:async email=>map((await db.query('SELECT * FROM users WHERE email=$1',[email])).rows[0]),findUserById:async id=>map((await db.query('SELECT * FROM users WHERE id=$1',[id])).rows[0])};
 function load(file,deps){const module={exports:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,file),'utf8'),{module,Buffer,process,console,require:id=>{if(!(id in deps))throw Error('Unexpected dependency '+id);return deps[id];}});return module.exports;}
 const permission={normalizeRole:r=>r,requirePermission:()=> (_req,_res,next)=>next()};
 const middleware=load('../middleware/authMiddleware.js',{'../lib/jwt':jwt,'./permissionMiddleware':permission,'../services/authSecurity':security,'../config/database':db});
 const deps={express,bcrypt,'../lib/jwt':jwt,'../middleware/authMiddleware':middleware,'../middleware/permissionMiddleware':permission,'../middleware/rateLimitMiddleware':{authRateLimiter:(_req,_res,next)=>next()},axios:{},'../models/userModel':users,'../models/profileModel':{findProfileByUserId:async()=>null},'../models/doctorModel':{},'../models/docApplicationModel':{},'../lib/objectId':{},'../services/signupDiagnostics':{},'google-auth-library':{OAuth2Client:class{}},'../services/authSecurity':security,'../config/database':db,'../services/loginDiagnostics':require('../services/loginDiagnostics')};
 const app=express();app.use(express.json());app.use(require('cookie-parser')());app.use('/auth',load('../routes/authRoutes.js',deps));app.get('/private',middleware.authenticateJWT(),(req,res)=>res.json({role:req.user.role}));
 const agent=request.agent(app);
 let response=await agent.post('/auth/login').send({email:'admin@example.test',password});
 assert.equal(response.status,200);assert.equal(response.body.requiresMfaSetup,true);assert.equal(response.body.token,undefined);
 const challengeCookie=response.headers['set-cookie'].find(c=>c.startsWith('auth_step='));
 assert.match(challengeCookie,/HttpOnly/);assert.match(challengeCookie,/SameSite=Strict/);
 assert.equal((await agent.get('/private')).status,401);
 response=await agent.post('/auth/mfa/setup').send({});assert.equal(response.status,200);
 const code=require('../services/mfaService').generateTotp(response.body.secret);
 response=await agent.post('/auth/mfa/verify').send({mfaCode:code,mfaSecret:'attacker-chosen-value'});
 assert.equal(response.status,200);assert.equal(response.body.role,'admin');assert.equal(response.body.recoveryCodes.length,8);assert.equal(response.body.token,undefined);
 assert.equal(response.headers['cache-control'],'no-store');
 const cookie=response.headers['set-cookie'].find(c=>c.startsWith('auth_token=')).split(';')[0];
 assert.equal((await agent.get('/private')).status,200);
 assert.equal((await agent.post('/auth/mfa/enable').send({mfaSecret:'replacement',mfaCode:code})).status,404);
 await agent.post('/auth/logout').send({});
 assert.equal((await request(app).get('/private').set('Cookie',cookie)).status,401);
});
