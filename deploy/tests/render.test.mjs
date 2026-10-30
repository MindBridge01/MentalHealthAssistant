import test from 'node:test';
import assert from 'node:assert/strict';
import {releasePlan, deployRelease} from '../render.mjs';
const roles = ['web','models','chatbot','ingestion','retention'];
const env = {RENDER_API_KEY:'synthetic-token',RENDER_OWNER_ID:'tea-synthetic',APP_IMAGE:'ghcr.io/example/mindbridge-app@sha256:'+'a'.repeat(64),MODELS_IMAGE:'ghcr.io/example/mindbridge-models@sha256:'+'b'.repeat(64),RENDER_SERVICES_JSON:JSON.stringify(roles.map(name=>({name,id:'srv-'+name,image:name==='models'?'models':'app'})))};
test('deployment rejects mutable images and incorrect target sets before network access', () => {
  assert.throws(()=>releasePlan({...env,APP_IMAGE:'ghcr.io/example/mindbridge-app:latest'}));
  assert.throws(()=>releasePlan({...env,RENDER_SERVICES_JSON:'[]'}));
});
test('preflight validates every workspace before any mutation', async () => {
  const methods=[];
  await assert.rejects(deployRelease({env,fetchImpl:async(_url,options)=>{methods.push(options.method);return {ok:true,status:200,json:async()=>({ownerId:'tea-other'})};}}),/different workspace/);
  assert.deepEqual(methods,['GET']);
});
test('release persists digests, preserves registry credentials, waits for live and stops on failure', async () => {
  const requests=[];let failure=false;
  const mockFetch=async(url,options)=>{
    const body=options.body?JSON.parse(options.body):null;
    requests.push({url,method:options.method,body});
    let result={};
    if(options.method==='GET'&&!url.includes('/deploys/')) {
      const name=url.split('srv-')[1];
      result={ownerId:env.RENDER_OWNER_ID,imagePath:`ghcr.io/example/mindbridge-${name==='models'?'models':'app'}:bootstrap`,registryCredential:{id:'reg-synthetic'}};
    } else if(options.method==='POST') result={id:'dep-synthetic'};
    else if(url.includes('/deploys/')) result={status:failure?'update_failed':'live'};
    return {ok:true,status:200,json:async()=>result};
  };
  await deployRelease({env,fetchImpl:mockFetch,sleep:async()=>{},log:()=>{}});
  const patches=requests.filter(r=>r.method==='PATCH');
  assert.equal(patches.length,5);
  for(const entry of patches){assert.match(entry.body.image.imagePath,/@sha256:/);assert.equal(entry.body.image.registryCredentialId,'reg-synthetic');}
  failure=true;requests.length=0;
  await assert.rejects(deployRelease({env,fetchImpl:mockFetch,sleep:async()=>{},log:()=>{}}),/update_failed/);
  assert.equal(requests.filter(r=>r.method==='PATCH').length,1);
});
