const test=require('node:test'),assert=require('node:assert/strict');
const {PNG}=require('pngjs');
const {normalizeProfilePhoto}=require('../services/profilePhoto');
test('accepts a decoded bounded PNG and strips extra payload',()=>{
 const png=new PNG({width:2,height:2});png.data.fill(255);
 const result=normalizeProfilePhoto(PNG.sync.write(png));
 assert.ok(result.startsWith('data:image/png;base64,'));
});
test('rejects non-image, oversized bytes and excessive dimensions',()=>{
 for(const value of [Buffer.from('<svg/>'),Buffer.alloc(524289)])assert.throws(()=>normalizeProfilePhoto(value),{status:400});
 const png=new PNG({width:513,height:1});assert.throws(()=>normalizeProfilePhoto(PNG.sync.write(png)),{status:400});
});
test('rejects truncated PNG',()=>{
 const png=new PNG({width:2,height:2});
 assert.throws(()=>normalizeProfilePhoto(PNG.sync.write(png).subarray(0,30)),{status:400});
});
