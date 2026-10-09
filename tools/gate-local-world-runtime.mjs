// Actual Cordis and installed package; external business state is a fixture.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [installed, app] = process.argv.slice(2), url = p => pathToFileURL(resolve(p));
const pkg = await import(url(`${installed}/src/index.mjs`));
const api = await import(url(`${installed}/vendor/hanaworlds-contracts/dist/local/index.mjs`));
const cordisFile = `${app}/Contents/Resources/hanaworlds-dsh/node_modules/@deepseek-ai/cordis/lib/index.js`;
const { Context } = await import(url(cordisFile));
const fixture = JSON.parse(readFileSync(`${installed}/vendor/hanaworlds-contracts/fixtures/local/main.json`));
const ctx = new Context(); let reads = 0, lateCancel = false, facts = structuredClone(fixture.facts);
ctx.provide('hanaworldsPainterLocalFacts', { async read(body, operation) {
  assert.equal(operation, 'ValidateBuildProposal'); reads++;
  if (lateCancel && reads % 2 === 0) facts.requestFacts.requestState = 'CANCELLED';
  return structuredClone(facts);
}});
const load = () => ctx.plugin(pkg.default, pkg.Config({}));
let fiber = load();
try {
  await fiber.await(); const painter = ctx.get(pkg.SERVICE);
  api.checkBuildProposalHandshake(painter.handshake());
  const response = await painter.call('ValidateBuildProposal', fixture.request);
  assert.equal(api.canonicalJSON(response), api.canonicalJSON(fixture.response));
  facts.requestFacts.currentContext.worldRef = 'wrong-world';
  assert.equal((await painter.call('ValidateBuildProposal', fixture.request)).error.code, 'CURRENT_WORLD_MISMATCH');
  facts = structuredClone(fixture.facts); reads = 0; lateCancel = true;
  const late = { ...fixture.request, requestId: 'late-result' };
  assert.equal((await painter.call('ValidateBuildProposal', late)).error.code, 'REQUEST_CANCELLED');
  lateCancel = false; facts = structuredClone(fixture.facts);
  const bad = structuredClone(fixture.request); bad.proposal.materials.stone.param2 = 256;
  assert.equal((await painter.call('ValidateBuildProposal', bad)).error.code, 'SCHEMA_INVALID');
  await fiber.dispose(); assert.equal(ctx.get(pkg.SERVICE), undefined);
  fiber = load(); await fiber.await();
  assert.equal((await ctx.get(pkg.SERVICE).call('ValidateBuildProposal', fixture.request)).error, null);
  console.log(JSON.stringify({ evidence: 'REAL_CORDIS_OWN_INSTALLED_PACKAGE + FIXTURE_EXTERNAL_BUSINESS_FACTS',
    node: process.version, installed, painterVersion: JSON.parse(readFileSync(`${installed}/package.json`)).version,
    contractsVersion: api.version, cordisFile,
    cordisSha256: createHash('sha256').update(readFileSync(cordisFile)).digest('hex'),
    normalBuild: true, wrongWorldRefused: true, lateCancellationRefused: true, badParamRefused: true,
    disposeRemovedService: true, reenableNewService: true, modelCalls: 0, worldWrites: 0,
    fullDSHHost: 'NOT_RUN', realModel: 'NOT_RUN', realUI: 'NOT_RUN', realWorld: 'NOT_RUN', undo: 'NOT_RUN'
  }, null, 2));
} finally { await fiber.dispose(); }
assert.equal(ctx.get(pkg.SERVICE), undefined);
