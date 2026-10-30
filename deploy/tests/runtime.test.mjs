import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../runtime-config.cjs', import.meta.url),'utf8');
function load() {
  const writes=[];const module={exports:{}};
  vm.runInNewContext(source,{module,URL,require:()=>({writeFileSync:(...args)=>writes.push(args)})});
  return {prepare:module.exports.runtimeConfig,writes};
}
test('runtime browser configuration contains only public settings and valid JavaScript', () => {
  const {prepare,writes}=load();
  prepare({SERVE_WEB:'true',APP_PUBLIC_URL:'https://app.example.test',GOOGLE_CLIENT_ID:'public-client-id',APP_RELEASE_SHA:'a'.repeat(40),DATABASE_URL:'postgresql://private:secret@db.example.test/db',JWT_SECRET:'private-signing-key'});
  const output=writes.find(([name])=>name==='/app/dist/config.js')[1];
  const context={window:{}};vm.runInNewContext(output,context);
  assert.equal(context.window.__MINDBRIDGE_CONFIG__.googleClientId,'public-client-id');
  assert.equal(context.window.__MINDBRIDGE_CONFIG__.release,'a'.repeat(40));
  assert(!output.includes('private'));assert(!output.includes('secret'));
});
test('CA material is kept private and URL parameters cannot disable verified TLS', () => {
  const {prepare,writes}=load();
  const config=prepare({DATABASE_CA_PEM:'synthetic-ca',DATABASE_URL:'postgresql://db.example.test/app?sslmode=no-verify',CHATBOT_DATABASE_URL:'postgresql://db.example.test/chat?sslmode=disable',CHATBOT_SERVICE_HOSTPORT:'chat.private:10000',MODEL_SERVICE_HOSTPORT:'models.private:8100'});
  assert.equal(writes[0][2].mode,0o600);
  assert.equal(new URL(config.DATABASE_URL).searchParams.has('sslmode'),false);
  assert.equal(new URL(config.CHATBOT_DATABASE_URL).searchParams.has('sslmode'),false);
  assert.equal(config.CHATBOT_SERVICE_URL,'http://chat.private:10000');
  assert.equal(config.MODEL_SERVICE_URL,'http://models.private:8100');
});
test('without a custom CA the chatbot still requires verified TLS', () => {
  const {prepare}=load();
  const config=prepare({CHATBOT_DATABASE_URL:'postgresql://db.example.test/chat?sslmode=disable'});
  assert.equal(new URL(config.CHATBOT_DATABASE_URL).searchParams.get('sslmode'),'verify-full');
});
