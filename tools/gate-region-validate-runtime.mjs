// Real Cordis (from the fixed App) loads the independently installed Painter
// with the vendored real contracts@0.5.0. FIXTURE boundary: the contract's
// published region scenario and the Host current-facts business port.
// llm/attachments/world/canvas/adapter/brush are forbidden ports.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const [installed, app, evidence] = process.argv.slice(2), url = p => pathToFileURL(resolve(p));
const hash = b => createHash('sha256').update(b).digest('hex');
const pkg = await import(url(join(installed, 'src/index.mjs')));
const api = await import(url(join(installed, 'vendor/hanaworlds-contracts/dist/local/index.mjs')));
const region = JSON.parse(readFileSync(join(installed, 'vendor/hanaworlds-contracts/fixtures/local/region.json')));
const main = JSON.parse(readFileSync(join(installed, 'vendor/hanaworlds-contracts/fixtures/local/main.json')));
const cordisFile = join(app, 'Contents/Resources/hanaworlds-dsh/node_modules/@deepseek-ai/cordis/lib/index.js');
const { Context } = await import(url(cordisFile));
const op = 'ValidateRegionProposal', CAP = 'painter-region/v1:validate-region-proposal';
const ctx = new Context(); let forbiddenCalls = 0, reads = 0, facts = null;
const forbidden = new Proxy({}, { get(t, k) { if (typeof k === 'symbol') return Reflect.get(t, k); forbiddenCalls++; throw new Error('region entry accessed a forbidden port'); } });
for (const name of ['llm', 'attachments', 'world', 'canvas', 'adapter', 'brush']) ctx.provide(name, forbidden);
ctx.provide('hanaworldsPainterLocalFacts', { async read(body, operation) { reads++; return structuredClone(typeof facts === 'function' ? facts(operation) : facts); } });
const fiber = ctx.plugin(pkg.default, pkg.Config({})), results = [];
let serial = 0;
const make = mutate => {
  const r = structuredClone(region.proposalRequest); r.requestId = `region-gate-${++serial}`;
  if (mutate) { mutate(r); r.referenceBriefDigest = api.digestValue('reference-brief', r.referenceBrief).sha256;
    r.intent.referenceBriefDigest = r.referenceBriefDigest; r.intentDigest = api.digestValue('intent', r.intent).sha256;
    r.catalogueDigest = api.digestValue('catalogue', r.catalogue).sha256; }
  facts = { currentContext: structuredClone(r.localContext), sessionRef: r.sessionRef, currentTurnRevision: r.turnRevision,
    currentBriefDigest: r.referenceBriefDigest, requestState: 'ACTIVE', replay: 'NEW', priorRequestDigest: null };
  return r;
};
try {
  await fiber.await(); const service = ctx.get(pkg.SERVICE);
  assert.equal(service.handshake().contracts, 'hanaworlds-contracts@0.5.0');
  const compat = api.checkProtocolCompatibility(service.protocolHandshake(), [api.protocolRequirement('painter-region/v1', [CAP])]);
  assert.throws(() => api.checkProtocolCompatibility(service.protocolHandshake(), [api.protocolRequirement('painter-region/v2', [CAP])]), e => e.code === 'UNSUPPORTED_VERSION');
  results.push({ case: 'protocol-handshake', compat: compat.result, matched: compat.matched, provenance: compat.provenance, wrongMajor: 'UNSUPPORTED_VERSION' });
  // fill + explicit air carve + unspecified, raw bytes
  const req = make();
  const filled = await service.call(op, JSON.stringify(req));
  assert.equal(filled.error, null); api.validateRegionProposalResponse(req, filled);
  assert.deepEqual(filled.result.build.block, req.proposal.block);
  const idx = api.expandRegionBlock(filled.result.build.block).indices;
  results.push({ case: 'fill-carve-unspecified', buildDigest: filled.result.buildDigest, declaredBounds: filled.result.build.declaredBounds,
    cells: idx.length, unspecified: idx.filter(i => i === -1).length, carveAir: idx.filter(i => i === 0).length });
  // verified image media brief through the same path
  const image = make(r => { r.referenceBrief.media = [{ attachmentRef: 'fixture-attachment-1', storedBytesDigest: 'a'.repeat(64),
    projectionVariantId: null, projectionBytesDigest: null, mediaType: 'image/png', bytes: 1024, width: 16, height: 16 }]; });
  const withImage = await service.call(op, image); assert.equal(withImage.error, null);
  results.push({ case: 'image-media-brief', buildDigest: withImage.result.buildDigest });
  // rejections before any build
  const bad = await service.call(op, make(r => { r.proposal.block = api.encodeRegionBlock({ origin: [0, 0, 0], size: [2, 1, 1],
    palette: [{ nodeName: 'fixture:missing', param2: 0 }], indices: [0, 0] }); }));
  assert.equal(bad.error.code, 'CATALOGUE_MISMATCH');
  const v2 = await service.call(op, { ...make(), contractVersion: 'painter-region/v2' }); assert.equal(v2.error.code, 'UNSUPPORTED_VERSION');
  const moved = make(); facts.currentContext.worldRef = 'other-world';
  const wrongWorld = await service.call(op, moved); assert.equal(wrongWorld.error.code, 'CURRENT_WORLD_MISMATCH');
  results.push({ case: 'rejections', illegalPalette: bad.error, wrongMajorWire: v2.error, liveWorldChanged: wrongWorld.error });
  // text proposal on the same service: exact public fixture response
  facts = structuredClone(main.facts);
  const text = await service.call('ValidateBuildProposal', structuredClone(main.request));
  assert.equal(api.canonicalJSON(text), api.canonicalJSON(main.response));
  results.push({ case: 'text-proposal-unchanged', buildDigest: text.result.buildDigest });
  assert.equal(forbiddenCalls, 0);
  const receipt = { evidence: 'REAL_OWN_INSTALLED_PACKAGE_IN_REAL_CORDIS with vendored real contracts 0.5.0; CONTRACT REGION SCENARIO/HOST_FACTS FIXTURE',
    node: process.version, painterVersion: JSON.parse(readFileSync(join(installed, 'package.json'))).version,
    contractsVendored: service.handshake().contracts, cordisFile, cordisSha256: hash(readFileSync(cordisFile)), results,
    hostFactReads: reads, forbiddenCalls, modelCalls: 0, worldWrites: 0,
    peerRuntime: 'NOT_RUN (Brush/Canvas/Adapter not composed)', fullApp: 'NOT_RUN', realModel: 'NOT_RUN', realWorld: 'NOT_RUN', undo: 'NOT_RUN', realUI: 'NOT_RUN' };
  writeFileSync(join(evidence, 'runtime-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify(receipt, null, 2));
} finally { await fiber.dispose(); }
assert.equal(ctx.get(pkg.SERVICE), undefined);
