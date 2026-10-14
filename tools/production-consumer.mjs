// Copied into a fresh consumer. This file imports no source tree, fixture SDK or dev tooling.
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const dir = fileURLToPath(new URL('.', import.meta.url));
const data = JSON.parse(readFileSync(new URL('./input.json', import.meta.url)));
const graph = [];
registerHooks({ resolve(specifier, context, next) {
 const result = next(specifier, context); graph.push({ specifier, parent: context.parentURL, url: result.url });
 if (result.url.startsWith('file:')) {
  const path = realpathSync(fileURLToPath(result.url));
  assert.ok(path.startsWith(dir), `resolution escaped isolated consumer: ${path}`);
  assert.ok(!path.includes('/hanaworlds-contracts/'), 'contract runtime resolution');
 }
 return result;
}});
const api = await import(data.packageName);
for (const file of data.entries.filter(f => /\.[cm]?js$/.test(f))) await import(pathToFileURL(resolve(dir, 'node_modules', data.packageName, file)).href);
await assert.rejects(import(data.absentRetiredPackage), { code: 'ERR_MODULE_NOT_FOUND' });
const clone = structuredClone;
const facts = async (body, operation) => operation === 'ValidateBuildProposal' ? clone(data.main.facts) : {
 currentContext: clone(body.localContext), sessionRef: body.sessionRef, currentTurnRevision: body.turnRevision,
 currentBriefDigest: body.referenceBriefDigest, requestState: 'ACTIVE', replay: 'NEW', priorRequestDigest: null,
};
const provided = new Map();
const factsPort = { read: facts };
const painter = api.apply({ provide: (name, value) => provided.set(name, value), get: () => factsPort });
assert.equal(provided.get(api.SERVICE), painter);
assert.equal(typeof provided.get('hanaworlds_image_material').execute, 'function');
assert.deepEqual(api.Config({}), {});
assert.equal(painter.handshake().contracts, 'hanaworlds-contracts@2.0.0');
for (const encode of [v => v, JSON.stringify, v => new TextEncoder().encode(JSON.stringify(v))]) {
 const build = await painter.call('ValidateBuildProposal', encode(data.main.request));
 assert.deepEqual(JSON.parse(JSON.stringify(build)), data.main.response);
 const region = await painter.call('ValidateRegionProposal', encode(data.region.proposalRequest));
 assert.equal(region.error, null); assert.equal(region.result.build.contractVersion, 'region-build/v2');
 assert.deepEqual(JSON.parse(JSON.stringify(region.result.build.block)), data.region.proposalRequest.proposal.block);
}
const invalid = clone(data.main.request); invalid.proposal.materials.stone.orientation = -1;
assert.equal((await painter.call('ValidateBuildProposal', invalid)).error.code, 'SCHEMA_INVALID');
const noFacts = new api.ExteriorPainterV2();
assert.equal((await noFacts.call('ValidateBuildProposal', data.main.request)).error.code, 'CAPABILITY_UNAVAILABLE');
await assert.rejects(noFacts.call('CreateBuildPlan', data.main.request), e => e.code === 'UNSUPPORTED_OPERATION');
// Consume a foreign provider's error by protocol. It has a different constructor.
const foreign = Object.assign(new Error('independent provider'), { publicError: data.foreignError });
for (const [op, request] of [['ValidateBuildProposal', data.main.request], ['ValidateRegionProposal', data.region.proposalRequest]]) {
 const other = new api.ExteriorPainterV2({ localFacts: { read: async () => { throw foreign; } } });
 const result = await other.call(op, request);
 assert.deepEqual(JSON.parse(JSON.stringify(result.error)), data.foreignError);
}
const context = data.main.facts.sourceContext;
assert.equal(api.buildMessages(context).messages[0].content[0].type, 'text');
assert.match(api.promptText(context), /Confirmed request facts/);
assert.ok(api.planGeometry(data.main.request).effects.length);
const imageInput = data.imageInput;
imageInput.imageBytes = new Uint8Array(imageInput.imageBytes);
imageInput.materialSources.textures.forEach(t => { t.bytes = new Uint8Array(t.bytes); });
const hint = await provided.get('hanaworlds_image_material').execute(imageInput);
assert.equal(hint.material.materialRef, 'opaque-red'); assert.equal(hint.match.algorithm, 'CIEDE2000');
assert.equal(hint.modelCalls, 0); assert.equal(hint.worldWrites, 0);
await assert.rejects(api.matchCurrentImageMaterials({ imageBytes: imageInput.imageBytes }), e => e.code === 'CAPABILITY_UNAVAILABLE');
const stale = clone(imageInput); stale.currentConnection.connectionIncarnationRef = 'closed';
await assert.rejects(api.matchCurrentImageMaterials(stale), e => e.code === 'CURRENT_WORLD_MISMATCH');
assert.equal(painter.describe().worldWrites, 0); assert.equal(painter.describe().modelCalls, 0);
writeFileSync(new URL('./runtime-resolution.json', import.meta.url), JSON.stringify(graph, null, 2) + '\n');
console.log(JSON.stringify({ result: 'PASS', entries: data.entries, build: 'BUILD/V5', region: 'region-build/v2', image: 'sharp/CIEDE2000', errors: 'public protocol', modelCalls: 0, worldWrites: 0 }));
