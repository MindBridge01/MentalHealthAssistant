import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../server/package.json',import.meta.url));
const yaml=require('js-yaml');
test('Blueprint HTTP health checks are used only on public web services',()=>{
 for(const path of ['../../render.yaml','../render.production.yaml']){
  const blueprint=yaml.load(fs.readFileSync(new URL(path,import.meta.url),'utf8'));
  assert.equal(blueprint.services.find(s=>s.type==='web').healthCheckPath,'/ready');
  for(const service of blueprint.services.filter(s=>s.type!=='web'))assert.equal(service.healthCheckPath,undefined);
 }
});
