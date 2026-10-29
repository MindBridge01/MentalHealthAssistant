import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { deterministicSafety, mergeSafety, outputAllowed } from '../server/safety.js';
import { Pipeline } from '../server/pipeline.js';
import { rrf, buildContext } from '../server/retrieval.js';
import { MemoryStore } from '../server/store.js';
const base = {
  user_id: 'u',
  messages: [],
  summary: ''
};
const source = {
  id: randomUUID(),
  chunk_text: 'Synthetic reviewed fixture.',
  parent_text: 'Synthetic reviewed fixture.',
  metadata: {
    title: 'Fixture',
    source: 'Test reviewer',
    source_url: 'https://example.test/guide'
  },
  page: 1,
  section: 'Fixture',
  score: 2
};
test('risk cannot be downgraded by semantic model', () => {
  const d = deterministicSafety('I want to kill myself');
  assert.equal(mergeSafety(d, {
    categories: ['NORMAL_INFORMATION'],
    risk_level: 'LOW'
  }).risk_level, 'HIGH');
});
test('context retains urgent concern across short follow-up', () => assert.equal(deterministicSafety('tonight', [{
  role: 'user',
  content: 'I want to end my life'
}]).risk_level, 'HIGH'));
test('multi-label medication and self-harm routes to high risk', () => {
  const r = deterministicSafety('I want to hurt myself using medication');
  assert.ok(r.categories.includes('MEDICATION_REQUEST'));
  assert.equal(r.risk_level, 'HIGH');
});
test('invalid classifier categories fail validation', () => assert.throws(() => mergeSafety(deterministicSafety('Hello'), {
  categories: ['BIPOLAR'],
  risk_level: 'LOW'
})));
test('high risk does not call retrieval or a generation model', async () => {
  let calls = 0;
  const p = new Pipeline({
    models: {
      json: () => {
        calls++;
        throw Error();
      }
    },
    retriever: () => {
      calls++;
      throw Error();
    }
  });
  const r = await p.reply('I took too many pills', base, {});
  assert.equal(r.route, 'controlled_safety');
  assert.equal(calls, 0);
  assert.equal(r.sources.length, 0);
});
test('provider failure produces a controlled fallback, never unfiltered generation', async () => {
  const p = new Pipeline({
    models: {
      json: async () => {
        throw Error();
      }
    }
  });
  assert.equal((await p.reply('Hello', base, {})).route, 'provider_or_validation_unavailable');
});
test('semantic high risk handles indirect language before retrieval', async () => {
  let retrieved = false;
  const p = new Pipeline({
    models: {
      json: async () => ({
        categories: ['SELF_HARM_CONCERN'],
        risk_level: 'HIGH'
      })
    },
    retriever: async () => {
      retrieved = true;
      return [];
    }
  });
  assert.equal((await p.reply('Nobody will need to worry about me after tonight', base, {})).route, 'controlled_safety');
  assert.equal(retrieved, false);
});
test('unsupported diagnosis and invented citations are blocked', () => {
  assert.equal(outputAllowed('You have depression. [S1]', [source]), false);
  assert.equal(outputAllowed('A claim [S9]', [source]), false);
  assert.equal(outputAllowed('Stop your medication. [S1]', [source]), false);
  assert.equal(outputAllowed('A claim without citation', [source]), false);
});
test('RRF merges duplicate candidates', () => {
  const r = rrf([[{
    id: 'a'
  }, {
    id: 'b'
  }], [{
    id: 'b'
  }, {
    id: 'c'
  }]]);
  assert.equal(r[0].id, 'b');
  assert.equal(r.length, 3);
});
test('context honors source limit and character budget', () => {
  const r = buildContext(Array.from({
    length: 10
  }, () => ({
    ...source,
    parent_text: 'x'.repeat(4000)
  })), 5000);
  assert.ok(r.reduce((n, s) => n + s.text.length, 0) <= 5000);
});
test('grounded answer requires independent checks', async () => {
  const replies = [{
    categories: ['NORMAL_INFORMATION'],
    risk_level: 'LOW'
  }, {
    query: 'question'
  }, {
    answer: 'Synthetic reviewed fixture. [S1]'
  }, {
    safe: true,
    grounded: true,
    citationsCorrect: true
  }];
  const p = new Pipeline({
    models: {
      json: async () => replies.shift()
    },
    retriever: async () => [source]
  });
  const r = await p.reply('Question', base, {
    listMemories: async () => []
  });
  assert.equal(r.route, 'grounded_answer');
  assert.equal(r.sources[0].id, source.id);
});
test('grounding failure retries once then blocks', async () => {
  let generations = 0;
  const p = new Pipeline({
    models: {
      json: async task => {
        if (task.startsWith('Classify')) return {
          categories: ['NORMAL_INFORMATION'],
          risk_level: 'LOW'
        };
        if (task.startsWith('Rewrite')) return {
          query: 'test'
        };
        if (task.startsWith('Independently')) return {
          safe: true,
          grounded: false,
          citationsCorrect: false
        };
        generations++;
        return {
          answer: 'Unsupported fixture. [S1]'
        };
      }
    },
    retriever: async () => [source]
  });
  const r = await p.reply('test', base, {
    listMemories: async () => []
  });
  assert.equal(r.route, 'output_blocked');
  assert.equal(generations, 2);
});
test('preview mode does not imply live model or clinical evidence', async () => {
  const r = await new Pipeline({
    demo: true
  }).reply('How can I unwind?', base, {});
  assert.equal(r.route, 'demo');
  assert.match(r.content, /No language model/);
  assert.deepEqual(r.sources, []);
});
test('ownership and concurrent turns are enforced', async () => {
  const store = new MemoryStore(),
    c = await store.create('alice');
  await assert.rejects(store.get(c.id, 'bob'));
  let release;
  const first = store.withConversation(c.id, 'alice', async () => new Promise(r => release = r));
  await new Promise(r => setImmediate(r));
  await assert.rejects(store.withConversation(c.id, 'alice', async () => {}), {
    status: 409
  });
  release();
  await first;
});
