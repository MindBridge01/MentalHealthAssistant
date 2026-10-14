const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const bcrypt=require('bcrypt');
const {loginFailure}=require('../services/loginDiagnostics');
function loginRoute(user,dbError,profileError) {
  const handlers={};let lookup;const logs=[];
  const deps={
    express:{Router:()=>({post:(route,...fns)=>{handlers[route]=fns.at(-1);}})},bcrypt,
    '../lib/jwt':{generateToken:()=> 'test-token'},
    '../middleware/authMiddleware':{authenticateJWT:()=>()=>{}},
    '../middleware/permissionMiddleware':{requirePermission:()=>()=>{},normalizeRole:role=>role},
    '../middleware/rateLimitMiddleware':{},axios:{},
    '../models/userModel':{findUserByEmail:async email=>{lookup=email;if(dbError)throw dbError;return user;}},
    '../models/profileModel':{findProfileByUserId:async()=>{if(profileError)throw profileError;return null;}},
    '../models/doctorModel':{},'../models/docApplicationModel':{},'../lib/objectId':{},
    '../services/signupDiagnostics':{},'../services/loginDiagnostics':{loginFailure},
    'google-auth-library':{OAuth2Client:class{}}
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../routes/authRoutes.js'),'utf8'),{
    module:{exports:{}},process:{env:{}},console:{error:msg=>logs.push(msg)},
    require:id=>{if(!(id in deps))throw Error(id);return deps[id];}
  });
  return {run:async(body)=>{
    const result={status:200};const res={status:code=>{result.status=code;return res;},json:value=>{result.body=value;return res;},cookie:(name,value)=>{result.cookie={name,value};}};
    await handlers['/login']({body},res);return {...result,lookup,logs};
  }};
}
test('admin bcrypt cost 12 hash authenticates through actual login handler',async()=>{
  const password='Synthetic admin password 123!';
  const user={_id:'admin-id',email:'admin@example.test',role:'admin',password:await bcrypt.hash(password,12)};
  const handler=loginRoute(user);
  const good=await handler.run({email:' ADMIN@example.test ',password});
  assert.equal(good.status,200);assert.equal(good.lookup,'admin@example.test');
  assert.equal(good.body.role,'admin');assert.equal(good.cookie.name,'auth_token');assert.equal(good.body.password,undefined);
  assert.equal((await handler.run({email:user.email,password:'wrong'})).status,401);
});
test('missing account uses 401, while database failures produce safe diagnostics',async()=>{
  assert.equal((await loginRoute(null).run({email:'missing@example.test',password:'test'})).status,401);
  const result=await loginRoute(null,{code:'28P01',message:'secret password must never appear'}).run({email:'a@example.test',password:'test'});
  assert.equal(result.status,503);assert.match(result.logs[0],/login_database_auth_failed/);
  assert.equal(JSON.stringify(result).includes('secret password'),false);
  assert.equal((await loginRoute(null).run({email:'a@example.test',password:{}})).status,400);
});

test('login failure identifies failing stage without exposing internal error details',async()=>{
 const user={_id:'admin',role:'admin',password:await bcrypt.hash('Synthetic password!',10)};
 const response=await loginRoute(user,null,new Error('private connection details')).run({email:'admin@example.test',password:'Synthetic password!'});
 assert.equal(response.status,500);assert.equal(response.body.stage,'profile_lookup');
 assert.match(response.body.error,/unexpected_login_failure\/profile_lookup/);
 assert.equal(JSON.stringify(response).includes('private connection details'),false);
});
