import test from 'node:test';
import assert from 'node:assert/strict';
import {commandPlan,deploy} from '../ec2.mjs';
const env={APP_IMAGE:'ghcr.io/example/app@sha256:'+'a'.repeat(64),MODELS_IMAGE:'ghcr.io/example/models@sha256:'+'b'.repeat(64),DEPLOY_SHA:'c'.repeat(40),EC2_INSTANCE_ID:'i-0123456789abcdef0'};
test('EC2 command rejects mutable images and shell injection',()=>{
  for(const update of [{APP_IMAGE:'ghcr.io/example/app:latest'},{DEPLOY_SHA:'main;echo bad'},{EC2_INSTANCE_ID:'i-12345678;id'}]) assert.throws(()=>commandPlan({...env,...update}));
  assert(commandPlan(env).commands.at(-1).startsWith('bash /opt/mindbridge/releases/'));
});
test('EC2 waits for command success and fails on remote failure',async()=>{
  let calls=0;
  await deploy(env,()=>++calls===1?{Command:{CommandId:'test'}}:{Status:'Success'},async()=>{});
  assert.equal(calls,2);
  calls=0;
  await assert.rejects(deploy(env,()=>++calls===1?{Command:{CommandId:'test'}}:{Status:'Failed'},async()=>{}),/Failed/);
});
