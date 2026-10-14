import test from 'node:test';
import assert from 'node:assert/strict';
import { runtime,register,doc,example,typed,assertError } from './painter-review-harness.mjs';
for(const row of [...doc.imageBudgetProposal.cases,...doc.imageBudgetProposal.textureCases])
 test('visible instance budget refuses then recovers on same registered tool: '+row.id,async()=>{
  const api=await runtime();
  const limited=register(api,{settings:row.settings}),ordinary=register(api);
  assert.deepEqual(limited.tool.limits,{...doc.imageBudgetProposal.defaults,...row.settings});
  assert.deepEqual(ordinary.tool.limits,doc.imageBudgetProposal.defaults);
  const input=example(row.inputExample),recovery=example(row.recoveryExample),normal=example('image-success');
  await assert.rejects(limited.tool.execute(typed(input.request)),e=>{assertError(e,row.expectedError);return true;});
  assert.deepEqual(await limited.tool.execute(typed(recovery.request)),recovery.expected);
  assert.deepEqual(await ordinary.tool.execute(typed(normal.request)),normal.expected);
  assert.deepEqual(await api.matchCurrentImageMaterials(typed(normal.request)),normal.expected);
  // Recovery must not silently reset the configured limit or replace the tool.
  assert.equal(limited.provided.get('hanaworlds_image_material'),limited.tool);
  await assert.rejects(limited.tool.execute(typed(input.request)),e=>{assertError(e,row.expectedError);return true;});
 });
