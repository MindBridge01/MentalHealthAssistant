const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const express = require('express');
const request = require('supertest');

test('officer acceptance route uses server-held MFA secret, creates session only on successful verification', async () => {
  let received, issued = 0;
  const officer = {_id:'synthetic-officer', role:'hospital', email:'officer@example.test', recoveryCodes:['synthetic-recovery']};
  const deps = {
    express, bcrypt:{}, axios:{}, '../lib/jwt':{},
    '../middleware/authMiddleware':{authenticateJWT:()=> (_req,_res,next)=>next()},
    '../middleware/permissionMiddleware':{normalizeRole:r=>r,requirePermission:()=> (_req,_res,next)=>next()},
    '../middleware/rateLimitMiddleware':{authRateLimiter:(_req,_res,next)=>next()},
    '../models/userModel':{findUserById:async()=>officer},
    '../models/profileModel':{}, '../models/doctorModel':{}, '../models/docApplicationModel':{},
    '../lib/objectId':{}, '../services/signupDiagnostics':{},
    'google-auth-library':{OAuth2Client:class{}}, '../config/database':{},
    '../services/invitationService':{acceptHospitalOfficerInvitation:async(_db,input)=>{
      received=input;
      return input.mfaCode==='123456'?officer:{verificationError:'Invalid authenticator code.'};
    }},
    '../services/authSecurity':{issue:async(_db,user,mfa)=>{
      assert.equal(user.role,'hospital');assert.equal(mfa,true);issued++;return 'synthetic-session';
    }},
  };
  const module={exports:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../routes/authRoutes.js'),'utf8'),{
    module,Buffer,process:{env:{NODE_ENV:'test'}},console,
    require:id=>{if(!(id in deps))throw Error(`Unexpected dependency: ${id}`);return deps[id];},
  });
  const app=express();app.use(express.json());app.use('/auth',module.exports);
  let response=await request(app).post('/auth/invitation/accept').send({token:'test-token',password:'Synthetic password',mfaCode:'123456',mfaSecret:'client-must-not-control-secret'});
  assert.equal(response.status,200,JSON.stringify(response.body));
  assert.equal(response.body.role,'hospital');
  assert.equal(Object.hasOwn(received,'mfaSecret'),false);
  assert.equal(received.mfaCode,'123456');
  assert.equal(issued,1);
  assert.match(response.headers['set-cookie'][0],/auth_token=synthetic-session/);
  response=await request(app).post('/auth/invitation/accept').send({token:'test-token',password:'Synthetic password',mfaCode:'invalid'});
  assert.equal(response.status,400);
  assert.equal(response.body.error,'Invalid authenticator code.');
  assert.equal(response.headers['set-cookie'],undefined);
  assert.equal(issued,1);
});
