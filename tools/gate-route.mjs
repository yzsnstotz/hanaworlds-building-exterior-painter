// Route-only component gate. Real Cordis; authority/LLM/media/world are fixtures.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { approved, clone, APPROVED_ANSWER, chainAuthority } from '../test/region-fixtures.mjs';
const [installed, app, contracts] = process.argv.slice(2);
assert.ok(installed && app && contracts, 'installed-package app extracted-contracts required');
const file = p => pathToFileURL(resolve(p));
const pkg = await import(file(`${installed}/src/index.mjs`));
const cordisFile = `${app}/Contents/Resources/hanaworlds-dsh/node_modules/@deepseek-ai/cordis/lib/index.js`;
const { Context } = await import(file(cordisFile));
const ctx = new Context();
const routes = [];
const authority = chainAuthority();
ctx.provide('hanaworldsAuthority', authority);
ctx.provide('attachments', {});
ctx.provide('llm', {
  async resolveModelInfo(provider, model) {
    routes.push([provider, model]);
    assert.equal(provider, 'openai-codex'); assert.equal(model, 'gpt-5.6-luna');
    return { inputModalities: ['text', 'image'] };
  },
  async *stream(options) {
    assert.equal(options.provider, 'openai-codex');
    yield { type: 'text-delta', index: 0, text: APPROVED_ANSWER };
    yield { type: 'finish', reason: { kind: 'stop' } };
  },
});
const fiber = ctx.plugin(pkg.default, pkg.Config({}));
try {
  await fiber.await();
  const painter = ctx.get(pkg.SERVICE);
  assert.deepEqual(painter.describe().settingDefaults, { modelProvider: 'openai-codex', modelId: 'gpt-5.6-luna' });
  const success = await painter.call('CreateBuildPlan', clone(approved.painterRequest));
  assert.equal(success.error, null); assert.deepEqual(success, approved.painterResponse);
  console.log('REAL_CORDIS + FIXTURE: installed package resolves default route and returns approved BUILD');
  const wrong = clone(approved.painterRequest); wrong.requestId += ':wrong'; wrong.worldRef = 'wrong-world';
  assert.equal((await painter.call('CreateBuildPlan', wrong)).error.code, 'INTENT_UNCONFIRMED');
  authority.verify = async () => ({ current: false });
  assert.equal((await painter.call('CreateBuildPlan', clone(approved.painterRequest))).error.code, 'AUTHORIZATION_REVOKED');
  assert.equal(routes.length, 1);
  console.log('REAL_CORDIS + FIXTURE: wrong world and revoked replay refused before LLM');
} finally { await fiber.dispose(); }
assert.equal(ctx.get(pkg.SERVICE), undefined);
console.log('REAL_CORDIS: provider disposal removes installed painter service');
// Inspect the actual admitted 0.3.9 package, not the old root schemas (painter/v2).
const { contractMetadata, schemaBundle } = await import(file(`${contracts}/dist/v4/generated/contracts.mjs`));
const { validateShape } = await import(file(`${contracts}/dist/v4/schema-validator.mjs`));
assert.equal(contractMetadata.version, '0.3.9');
const body = clone(approved.painterRequest);
validateShape('CreateBuildPlanRequest', body);
assert.throws(() => validateShape('CreateBuildPlanRequest', { ...body, proposal: JSON.parse(APPROVED_ANSWER) }), e => e.code === 'UNKNOWN_REQUIRED_FIELD');
const ops = contractMetadata.operations['painter/v3'].map(x => x.operation);
assert.deepEqual(ops, ['CreateBuildPlan']);
const schema = schemaBundle.definitions.CreateBuildPlanRequest;
assert.equal(schema.additionalProperties, false); assert.equal(Object.hasOwn(schema.properties, 'proposal'), false);
console.log('ACTUAL_CONTRACTS_0.3.9: CreateBuildPlan admits baseline; proposal field rejected UNKNOWN_REQUIRED_FIELD; only CreateBuildPlan operation');
console.log(JSON.stringify({ node: process.version, installed, painterVersion: JSON.parse(readFileSync(`${installed}/package.json`)).version,
 cordisFile, cordisSha256: createHash('sha256').update(readFileSync(cordisFile)).digest('hex'),
 contracts, operations: ops, requestFields: Object.keys(schema.properties), additionalProperties: schema.additionalProperties,
 skillProposal: 'BLOCKED_PUBLIC_CONTRACT', realModel: 'NOT_RUN', realWorld: 'NOT_RUN', realUI: 'NOT_RUN', undo: 'NOT_RUN' }, null, 2));
