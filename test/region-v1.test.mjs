// Actual source/installed Painter on the original ValidateBuildProposal channel.
// FIXTURE boundary: contracts region v1 port (region-contract-fixture.mjs),
// Host current facts, inspected world cells and catalogue nodes. No world write.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRegionContractFixture } from './region-contract-fixture.mjs';
import { regionWorld, regionProposal, cellsOf, hostFacts, rebind } from './region-v1-fixtures.mjs';
const root = process.env.PAINTER_TEST_PACKAGE ?? resolve(new URL('..', import.meta.url).pathname);
const api = await import(pathToFileURL(resolve(root, 'vendor/hanaworlds-contracts/dist/local/index.mjs')));
const Painter = await import(pathToFileURL(resolve(root, 'src/index.mjs')));
const { ExteriorPainterV2 } = Painter;
const fixture = JSON.parse(readFileSync(resolve(root, 'vendor/hanaworlds-contracts/fixtures/local/main.json')));
const op = 'ValidateBuildProposal';
const clone = structuredClone;
const STONE = { nodeName: 'fixture:stone', param2: 0 }, AIR = { nodeName: 'air', param2: 0 };
const forbidden = () => new Proxy({}, { get() { throw new Error('region entry touched model/media'); } });

function setup({ proposal, world = {}, contract = createRegionContractFixture(api), change, mutate } = {}) {
  const request = regionWorld(api, fixture, world);
  request.proposal = proposal;
  if (mutate) { mutate(request); rebind(api, request); }
  const state = { reads: 0, bodies: [], facts: hostFacts(fixture, request) };
  const localFacts = { async read(body, operation) {
    assert.equal(operation, op); state.bodies.push(api.canonicalJSON(body));
    state.reads++; if (change) await change(state); return clone(state.facts);
  } };
  const painter = new ExteriorPainterV2({ localFacts, llm: forbidden(), attachments: forbidden(), regionContract: contract });
  return { request, state, painter, contract };
}
async function rejected(f, code, request = f.request, options) {
  const r = await f.painter.call(op, request, options);
  assert.equal(r.result, null, JSON.stringify(r)); assert.equal(r.error.code, code);
  assert.equal(r.error.mutationState, 'NONE'); assert.equal(r.error.transactionRef, null);
  return r;
}
// Fill the empty y=2 layer with stone at x<2, leave x>=2 unspecified; y0/y1 unspecified.
const fillProposal = () => regionProposal({ palette: [STONE],
  cells: cellsOf([4, 3, 4], (x, y) => (y === 2 && x < 2 ? 0 : null)) });
// Carve: dig dirt (y=1) and stone (y=0) at x=0,z=0 with explicit air; air on empty y=2 is unchanged.
const carveProposal = () => regionProposal({ palette: [AIR],
  cells: cellsOf([4, 3, 4], (x, y, z) => (x === 0 && z === 0 ? 0 : null)) });

test('region fill: original channel emits region BUILD; unspecified cells untouched; fresh Host facts before/after', async () => {
  const f = setup({ proposal: fillProposal() });
  const response = await f.painter.call(op, JSON.stringify(f.request));
  assert.equal(response.error, null, JSON.stringify(response.error));
  f.contract.validateRegionResponse(f.request, response);
  const { build, buildDigest } = response.result;
  assert.equal(build.contractVersion, 'BUILD-REGION/v1');
  assert.deepEqual(build.summary, { specified: 8, unspecified: 40, filled: 8, carved: 0, unchanged: 0 });
  assert.deepEqual(build.region.min, [0, 0, 3]); assert.deepEqual(build.declaredBounds, { min: [0, 0, 3], max: [3, 2, 6] });
  assert.equal(build.region.axisOrder, 'x-fastest,y,z');
  assert.deepEqual(build.coordinateFrame, f.request.regionInspection.frame);
  assert.deepEqual(build.evidence, f.request.regionInspection.evidence);
  assert.equal(buildDigest, f.contract.regionBuildDigest(build));
  assert.equal(f.state.reads, 2);
  assert.ok(f.state.bodies.every(b => b === api.canonicalJSON(f.request)));
  const d = f.painter.describe();
  assert.equal(d.worldWrites, 0);
  const tool = d.tools.find(t => t.name === 'BuildRegionProposal');
  assert.equal(tool.availability.available, true); assert.equal(tool.operation, op);
  assert.ok(tool.typicalUse && tool.preconditions.length >= 3); assert.equal(tool.modelCalls, 0);
  assert.ok(d.tools.some(t => t.name === 'MatchCurrentImageMaterials'));
});

test('region carve: explicit air removes occupied stone/dirt; air over air is unchanged, not a write', async () => {
  const f = setup({ proposal: carveProposal() });
  const response = await f.painter.call(op, f.request);
  assert.equal(response.error, null, JSON.stringify(response.error));
  assert.deepEqual(response.result.build.summary, { specified: 3, unspecified: 45, filled: 0, carved: 2, unchanged: 1 });
  const planned = Painter.planRegion({ proposal: Painter.parseRegionProposal(f.request.proposal), request: f.request });
  assert.deepEqual(planned.effects, [{ position: [0, 0, 3], ...AIR }, { position: [0, 1, 3], ...AIR }]);
});

test('unspecified is never carve; carve without declared air-carve is refused', async () => {
  const f = setup({ proposal: fillProposal() });
  const planned = Painter.planRegion({ proposal: Painter.parseRegionProposal(f.request.proposal), request: f.request });
  assert.ok(planned.effects.every(e => e.position[1] === 2 && e.nodeName === 'fixture:stone'));
  const undeclared = carveProposal(); undeclared.format.requires = ['palette-v1'];
  await rejected(setup({ proposal: undeclared }), 'BUILD_INVALID');
});

test('protocol major compatibility: same major other minor/patch accepted, wrong major or missing capability refused', async () => {
  const minor = fillProposal(); minor.format.version = '1.7.3';
  const ok = setup({ proposal: minor, contract: createRegionContractFixture(api, { version: '1.4.0' }) });
  assert.equal((await ok.painter.call(op, ok.request)).error, null);
  const major = fillProposal(); major.format.version = '2.0.0';
  await rejected(setup({ proposal: major }), 'UNSUPPORTED_VERSION');
  const zero = fillProposal(); zero.format.version = '0.9.0';
  await rejected(setup({ proposal: zero }), 'UNSUPPORTED_VERSION');
  const unknownCap = fillProposal(); unknownCap.format.requires = ['palette-v1', 'entity-rigging'];
  await rejected(setup({ proposal: unknownCap }), 'CAPABILITY_UNAVAILABLE');
  const proto = fillProposal(); proto.format.protocol = 'other-voxels';
  await rejected(setup({ proposal: proto }), 'UNSUPPORTED_VERSION');
  // Contract port of a different major, or lacking a needed capability, is not consumed.
  for (const port of [createRegionContractFixture(api, { version: '2.0.0' }),
    createRegionContractFixture(api, { capabilities: ['palette-v1'] })]) {
    const f = setup({ proposal: fillProposal(), contract: port });
    const r = await f.painter.call(op, f.request);
    assert.equal(r.result, null); assert.ok(['UNSUPPORTED_VERSION', 'CAPABILITY_UNAVAILABLE'].includes(r.error.code));
    assert.equal(f.state.reads, 0); assert.equal(f.painter.describe().tools.find(t => t.name === 'BuildRegionProposal').availability.available, false);
  }
  assert.deepEqual(Painter.checkRegionCompatibility({ protocol: 'hanaworlds-region-voxels', version: '1.0.9', requires: [] }).major, 1);
});

for (const [name, make, code, world] of [
  ['out of inspected bounds', () => regionProposal({ min: [1, 0, 0], palette: [STONE], cells: cellsOf([4, 3, 4], () => null).map((c, i) => (i === 0 ? 0 : c)) }), 'BUILD_INVALID'],
  ['unknown (unloaded) specified cell', () => regionProposal({ palette: [STONE], cells: cellsOf([4, 3, 4], (x, y, z) => (x === 3 && y === 2 && z === 3 ? 0 : null)) }), 'TARGET_FACTS_INCOMPLETE', { unknown: [[3, 2, 6]] }],
  ['cell count not size product', () => { const p = fillProposal(); p.region.cells.pop(); return p; }, 'BUILD_INVALID'],
  ['palette index out of range', () => { const p = fillProposal(); p.region.cells[0] = 5; return p; }, 'BUILD_INVALID'],
  ['node not in catalogue', () => regionProposal({ palette: [{ nodeName: 'fixture:missing', param2: 0 }], cells: cellsOf([4, 3, 4], (x, y) => (y === 2 ? 0 : null)) }), 'UNSUPPORTED_MATERIAL'],
  ['param2 not allowed', () => regionProposal({ palette: [{ nodeName: 'fixture:stone', param2: 3 }], cells: cellsOf([4, 3, 4], (x, y) => (y === 2 ? 0 : null)) }), 'UNSUPPORTED_MATERIAL'],
  ['stateful node in palette', () => regionProposal({ palette: [{ nodeName: 'fixture:chest', param2: 0 }], cells: cellsOf([4, 3, 4], (x, y) => (y === 2 ? 0 : null)) }), 'UNSUPPORTED_MATERIAL'],
  ['replacing existing stateful node', () => carveProposal(), 'UNSUPPORTED_MUTATION_SEMANTICS', { chest: [0, 1, 3] }],
  ['liquid against hazard policy', () => regionProposal({ palette: [{ nodeName: 'fixture:lava', param2: 0 }], cells: cellsOf([4, 3, 4], (x, y) => (y === 2 && x === 0 ? 0 : null)) }), 'SAFETY_INVARIANT_FAILED'],
  ['duplicate palette entries', () => regionProposal({ palette: [STONE, STONE], cells: cellsOf([4, 3, 4], (x, y) => (y === 2 ? 1 : null)) }), 'NON_CANONICAL_AMBIGUITY'],
  ['other axis order', () => { const p = fillProposal(); p.region.axisOrder = 'z-fastest,y,x'; return p; }, 'BUILD_INVALID'],
  ['nothing specified', () => regionProposal({ palette: [STONE], cells: cellsOf([4, 3, 4], () => null) }), 'BUILD_INVALID'],
  ['fractional origin', () => { const p = fillProposal(); p.region.min = [0.5, 0, 0]; return p; }, 'BUILD_INVALID'],
  ['extra proposal field', () => ({ ...fillProposal(), actorRef: 'forged' }), 'UNKNOWN_REQUIRED_FIELD'],
]) test('region rejects before any BUILD: ' + name, async () => {
  const f = setup({ proposal: make(), world });
  await rejected(f, code);
});

test('fill into the avatar body is refused; carving body air is unchanged', async () => {
  const f = setup({ proposal: fillProposal(), mutate: r => { r.regionInspection.bodyOccupiedPositions = [[0, 2, 3]]; } });
  await rejected(f, 'BUILD_INVALID');
});

test('same Session/world/connection/brief as text path: live world, connection, brief or media change refuses after await', async () => {
  for (const field of ['worldRef', 'connectionIncarnationRef']) {
    const f = setup({ proposal: fillProposal(), change: s => { s.facts.requestFacts.currentContext[field] = 'changed'; } });
    await rejected(f, 'CURRENT_WORLD_MISMATCH');
  }
  const late = setup({ proposal: fillProposal(), change: s => { if (s.reads === 2) s.facts.currentContext.referenceBrief.briefRevision = 'changed'; } });
  await rejected(late, 'TARGET_FACTS_STALE');
  const image = setup({ proposal: fillProposal(), world: { media: true } });
  const ok = await image.painter.call(op, image.request);
  assert.equal(ok.error, null); assert.equal(image.request.referenceBrief.media.length, 1);
  const swapped = setup({ proposal: fillProposal(), world: { media: true },
    change: s => { if (s.reads === 2) s.facts.currentContext.referenceBrief.media[0].storedBytesDigest = 'b'.repeat(64); } });
  await rejected(swapped, 'TARGET_FACTS_STALE');
  const cancel = setup({ proposal: fillProposal(), change: s => { if (s.reads === 2) s.facts.requestFacts.requestState = 'CANCELLED'; } });
  await rejected(cancel, 'REQUEST_CANCELLED');
});

test('exact replay returns the original after fresh facts; changed payload is REPLAY_MISMATCH; deterministic digest', async () => {
  const f = setup({ proposal: fillProposal() });
  const first = await f.painter.call(op, f.request);
  const again = await f.painter.call(op, JSON.stringify(f.request));
  assert.deepEqual(again, first); assert.equal(f.state.reads, 4);
  const changed = clone(f.request); changed.proposal.region.cells[0] = 0;
  const r = await f.painter.call(op, changed); assert.equal(r.error.code, 'REPLAY_MISMATCH');
  const other = setup({ proposal: fillProposal() });
  assert.equal((await other.painter.call(op, other.request)).result.buildDigest, first.result.buildDigest);
});

test('without a contracts region v1 port (vendored 0.4.2): region refused and self-described; text path unchanged', async () => {
  const f = setup({ proposal: fillProposal() });
  const plain = new ExteriorPainterV2({ localFacts: { read: () => { throw new Error('must not read'); } } });
  const r = await plain.call(op, f.request);
  assert.equal(r.result, null); assert.equal(r.error.code, 'CAPABILITY_UNAVAILABLE');
  const tool = plain.describe().tools.find(t => t.name === 'BuildRegionProposal');
  assert.equal(tool.availability.available, false); assert.match(tool.availability.reason, /region v1/);
  assert.equal(Painter.REGION_CONTRACT_STATUS.available, false);
  // Original text proposal still produces the exact public fixture response.
  const request = clone(fixture.request), facts = clone(fixture.facts);
  const text = new ExteriorPainterV2({ localFacts: { async read() { return clone(facts); } }, llm: forbidden(), attachments: forbidden(),
    regionContract: createRegionContractFixture(api) });
  const response = await text.call(op, request);
  assert.equal(api.canonicalJSON(response), api.canonicalJSON(fixture.response));
});
