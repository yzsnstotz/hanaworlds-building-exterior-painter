import test from 'node:test';
import assert from 'node:assert/strict';
import { doc,runtime } from './painter-review-harness.mjs';
for(const row of doc.helpers)test('public helper full I/O: '+row.operation,async()=>{
 const api=await runtime();
 assert.deepEqual(await api[row.operation](structuredClone(row.request)),row.expected);
});
test('assembleBuild validates entrances locally when omitted',async()=>{
 const api=await runtime(),row=doc.helpers.find(r=>r.operation==='assembleBuild');
 const input=structuredClone(row.request);delete input.entrances;
 assert.deepEqual(api.assembleBuild(input),row.expected);
});
