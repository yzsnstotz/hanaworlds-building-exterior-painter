// C-painter ConfigInput and retained image semantics; no guessed Host/model ABI.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { Painter as api } from './painter-under-test.mjs';
import { doc, example, typed, assertError, register } from './painter-review-harness.mjs';

for (const [label, value] of [['null', null], ['array', []], ['string', ''],
 ['number', 0], ['boolean', true]]) {
 test(`ConfigInput refuses ${label} before registering a silently defaulted budget`, () => {
  assert.equal(doc.definitions.ConfigInput.type, 'object');
  const provided = new Map();
  assert.throws(() => api.apply({provide: (name, tool) => provided.set(name, tool)},
   api.Config(value)), {name: 'TypeError'},
  'Non-object settings must not silently create a default-budget Painter');
  assert.equal(provided.size, 0);
 });
}

for (const row of [...doc.imageBudgetProposal.cases, ...doc.imageBudgetProposal.textureCases]) {
 test(`migration retains actual budget failure and same-tool recovery: ${row.id}`, async () => {
  const {tool, provided} = register(api, {settings: row.settings});
  const expectedLimits = {...doc.imageBudgetProposal.defaults, ...row.settings};
  assert.deepEqual(tool.limits, expectedLimits);
  const input = typed(example(row.inputExample).request);
  await assert.rejects(tool.execute(input), error => {
   assertError(error, row.expectedError); return true;
  });
  const recovery = example(row.recoveryExample);
  assert.deepEqual(await tool.execute(typed(recovery.request)), recovery.expected);
  assert.equal(provided.get('hanaworlds_image_material'), tool);
  assert.deepEqual(tool.limits, expectedLimits);
  await assert.rejects(tool.execute(input), error => {
   assertError(error, row.expectedError); return true;
  });
  const normal = example('image-success');
  const ordinary = register(api);
  assert.deepEqual(ordinary.tool.limits, doc.imageBudgetProposal.defaults);
  assert.deepEqual(await ordinary.tool.execute(typed(normal.request)), normal.expected);
 });
}

test('retained typed tool requires real bytes and keeps current connection admission', async () => {
 const {tool} = register(api);
 const row = example('image-success');
 assert.deepEqual(await tool.execute(typed(row.request)), row.expected);
 // A JSON byte list cannot impersonate the original in-process typed channel.
 const forged = typed(row.request);
 forged.imageBytes = [...forged.imageBytes];
 await assert.rejects(tool.execute(forged), error => error.code === 'IMAGE_REQUIRED'
  && error.mutationState === 'NONE');
 const stale = typed(row.request);
 stale.currentConnection.connectionIncarnationRef += '-changed';
 await assert.rejects(tool.execute(stale), error => error.code === 'CURRENT_WORLD_MISMATCH'
  && error.mutationState === 'NONE' && error.transactionRef === null);
 assert.deepEqual(await tool.execute(typed(row.request)), row.expected);
});

test('legacy palette and panels remain archived without active runtime references', () => {
 const root = resolve(new URL('..', import.meta.url).pathname);
 for (const path of ['archive/pre-v2/src/material-palette.json',
  'archive/pre-v2/image-material-panel/README.md', 'archive/pre-v2/image-material-web/README.md'])
  assert.ok(readFileSync(resolve(root, path)).length, path);
 for (const dir of ['src', 'tools']) {
  for (const file of readdirSync(resolve(root, dir), {recursive: true}).filter(f => f.endsWith('.mjs'))) {
   assert.doesNotMatch(readFileSync(resolve(root, dir, file), 'utf8'),
    /material-palette\.json|image-material-panel\/|image-material-web\//, `${dir}/${file}`);
  }
 }
 const manifest = JSON.parse(readFileSync(resolve(root, 'package.json')));
 assert.ok(!manifest.files.some(path => path.startsWith('archive')));
 assert.equal(manifest.dependencies['@deepseek-ai/schemastery'], '3.18.2');
 assert.equal(manifest.dependencies.sharp, '0.35.3');
 assert.equal(manifest.dependencies['color-diff'], '1.4.0');
 assert.ok(!Object.hasOwn(manifest.dependencies, 'hanaworlds-contracts'));
});
