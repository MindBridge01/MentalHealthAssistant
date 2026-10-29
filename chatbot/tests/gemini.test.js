import test from 'node:test';
import assert from 'node:assert/strict';
import {ChatbotModels} from '../server/models.js';
test('Gemini request uses server header, JSON output and untrusted-data instructions',async()=>{
  const models=new ChatbotModels({geminiApiKey:'synthetic-key',model:'gemini-2.5-flash'},async(url,options)=>{
    assert.ok(url.startsWith('https://generativelanguage.googleapis.com/'));assert.ok(!url.includes('synthetic-key'));
    assert.equal(options.headers['x-goog-api-key'],'synthetic-key');
    const body=JSON.parse(options.body);assert.equal(body.generationConfig.responseMimeType,'application/json');assert.match(body.systemInstruction.parts[0].text,/untrusted/);
    assert.equal(body.safetySettings,undefined);
    return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:'{"answer":"example"}'}]}}]})};
  });
  assert.deepEqual(await models.json('Answer',{message:'fictional example'}),{answer:'example'});
});
for(const [label,result] of Object.entries({blocked:{promptFeedback:{blockReason:'SAFETY'}},truncated:{candidates:[{finishReason:'MAX_TOKENS'}]},invalid:{candidates:[{finishReason:'STOP',content:{parts:[{text:'not json'}]}}]}})){
 test(`Gemini rejects ${label} output`,async()=>{const models=new ChatbotModels({geminiApiKey:'test'},async()=>({ok:true,json:async()=>result}));await assert.rejects(models.json('task',{}),/blocked or invalid/);});
}
test('quota and network failures do not expose secrets or provider bodies',async()=>{
 const models=new ChatbotModels({geminiApiKey:'test'},async()=>({ok:false,status:429,json:()=>assert.fail('must not read error body')}));
 await assert.rejects(models.json('task',{}),/quota temporarily unavailable/);
 const broken=new ChatbotModels({geminiApiKey:'test'},async()=>{throw Error('secret request');});
 await assert.rejects(broken.json('task',{}),/^Error: Generation provider unavailable$/);
});
test('missing API key makes no network call',async()=>{const models=new ChatbotModels({},()=>assert.fail('unexpected request'));await assert.rejects(models.json('task',{}),/not configured/);});
