// Actual source/installed Painter, painter-region/v3 from the pinned real
// hanaworlds-contracts package (src/contract-package.mjs). FIXTURE boundary: the contract's published
// region scenario (Session/world/brief/catalogue) and the Host business port.
// No world, Canvas, Adapter, Brush, model or attachment is reached.
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = process.env.PAINTER_TEST_PACKAGE ?? resolve(new URL('..', import.meta.url).pathname);
const { contracts: api, contractFixture } = await import('../tools/contract-package.mjs');
const Painter = await import(pathToFileURL(resolve(root, process.env.PAINTER_TEST_PACKAGE ? 'dist/index.mjs' : 'src/index.mjs')));
const { ExteriorPainterV2 } = Painter;
const region = contractFixture('region');
const main = contractFixture('main');
const op = 'ValidateRegionProposal';
const CAP = 'painter-region/v3:validate-region-proposal';
const clone = structuredClone;
const forbidden = () => new Proxy({}, { get(t, k) { if (typeof k === 'symbol') return Reflect.get(t, k); throw new Error('region entry touched model/media'); } });

function rebind(r) {
  r.referenceBriefDigest = api.digestValue('reference-brief', r.referenceBrief).sha256;
  r.intent.referenceBriefDigest = r.referenceBriefDigest;
  r.intentDigest = api.digestValue('intent', r.intent).sha256;
  r.catalogueDigest = api.digestValue('catalogue', r.catalogue).sha256;
  return r;
}
const hostFacts = r => ({ currentContext: clone(r.localContext), sessionRef: r.sessionRef, currentTurnRevision: r.turnRevision,
  currentBriefDigest: r.referenceBriefDigest, requestState: 'ACTIVE', replay: 'NEW', priorRequestDigest: null });
function setup({ mutate, change } = {}) {
  const request = clone(region.proposalRequest);
  if (mutate) { mutate(request); rebind(request); }
  const state = { reads: 0, bodies: [], facts: hostFacts(request) };
  const localFacts = { async read(body, operation) {
    assert.equal(operation, op); state.bodies.push(api.canonicalJSON(body)); state.reads++;
    if (change) await change(state); return clone(state.facts);
  } };
  return { request, state, painter: new ExteriorPainterV2({ localFacts, llm: forbidden(), attachments: forbidden() }) };
}
async function rejected(f, code, request = f.request, options) {
  const r = await f.painter.call(op, request, options);
  assert.equal(r.result, null, JSON.stringify(r)); assert.equal(r.error.code, code, JSON.stringify(r.error));
  assert.equal(r.error.mutationState, 'NONE'); assert.equal(r.error.transactionRef, null);
  return r;
}
const block = (palette, indices, size = [4, 1, 1], origin = [0, 0, 0]) => api.encodeRegionBlock({ origin, size, palette, indices });
const AIR = { materialRef: 'air', orientation: 0 }, STONE = { materialRef: 'fixture:stone', orientation: 0 };

test('region tool explains geometry and opaque material palette without engine-specific instructions', () => {
  const tool = setup().painter.describe().tools.find(t => t.name === op);
  const instructions = tool.preconditions.join('\n');
  assert.match(instructions, /geometryProfile/);
  assert.match(instructions, /materialRef/);
  assert.match(instructions, /orientation/);
  assert.match(instructions, /emptyMaterialRef/);
  assert.doesNotMatch(instructions, /\b(?:air|param2|node)\b/i);
});

test('world-source emptyMaterialRef and nonzero orientations survive object, JSON and byte region proposals', async () => {
  const empty = { materialRef: 'opaque-empty-83', orientation: 7 };
  const fill = { materialRef: 'opaque-fill-21', orientation: 11 };
  const mutate = r => {
    const emptyTags = clone(r.catalogue.materials[r.catalogue.emptyMaterialRef]);
    const fillTags = clone(r.catalogue.materials[STONE.materialRef]);
    r.catalogue.emptyMaterialRef = empty.materialRef;
    r.catalogue.materials = {
      [empty.materialRef]: { ...emptyTags, orientations: [empty.orientation], extension: {} },
      [fill.materialRef]: { ...fillTags, orientations: [fill.orientation], extension: {} },
    };
    r.proposal.block = block([fill, empty], [0, -1, 1, -1], [2, 1, 2], [-9, 4, 13]);
  };
  for (const encode of [r => r, JSON.stringify, r => new TextEncoder().encode(JSON.stringify(r))]) {
    const f = setup({ mutate });
    const response = await f.painter.call(op, encode(f.request));
    assert.equal(response.error, null, JSON.stringify(response.error));
    api.validateRegionProposalResponse(f.request, response);
    assert.equal(api.canonicalJSON(response.result.build.block), api.canonicalJSON(f.request.proposal.block));
    assert.deepEqual(response.result.build.declaredBounds, { min: [-9, 4, 13], max: [-8, 4, 14] });
    const cells = api.expandRegionBlock(response.result.build.block);
    assert.deepEqual(Array.from(cells.indices, index => index === -1 ? null : clone(cells.palette[index])), [fill, null, empty, null]);
    assert.equal(f.state.reads, 2);
  }
  const illegal = setup({ mutate });
  illegal.request.proposal.block = clone(illegal.request.proposal.block);
  illegal.request.proposal.block.palette.find(p => p.materialRef === empty.materialRef).orientation = 0;
  await rejected(illegal, 'UNSUPPORTED_MUTATION_SEMANTICS');
  assert.equal(illegal.state.reads, 0);
});

test('fill + explicit air carve + unspecified: original Painter channel returns the block unchanged as region-build/v2', async () => {
  const f = setup();
  const response = await f.painter.call(op, JSON.stringify(f.request));
  assert.equal(response.error, null, JSON.stringify(response.error));
  api.validateRegionProposalResponse(f.request, response);
  const { build, buildDigest } = response.result;
  assert.deepEqual(build.block, f.request.proposal.block);
  assert.equal(build.coordinateSpace, 'WORLD_NODE'); assert.equal(build.worldRef, f.request.worldRef);
  assert.deepEqual(build.declaredBounds, { min: [-2, 0, -2], max: [17, 1, 0] });
  assert.equal(buildDigest, api.digestValue('region-build', build).sha256);
  const cells = api.expandRegionBlock(build.block);
  const air = build.block.palette.findIndex(p => p.materialRef === f.request.catalogue.emptyMaterialRef);
  assert.ok(cells.indices.includes(-1) && cells.indices.includes(air)); // unspecified stays -1, carve stays explicit air
  assert.equal(f.state.reads, 2); assert.ok(f.state.bodies.every(b => b === api.canonicalJSON(f.request)));
});

test('unspecified is never carve: null and air stay distinct; all-null, ignore and invalid orientation are refused before any build', async () => {
  const f = setup({ mutate: r => { r.proposal.block = block([STONE, AIR], [0, -1, 1, -1]); } });
  const ok = await f.painter.call(op, f.request);
  assert.equal(ok.error, null, JSON.stringify(ok.error));
  assert.deepEqual(Array.from(api.expandRegionBlock(ok.result.build.block).indices), [1, -1, 0, -1]); // palette sorted: air, stone
  for (const bad of [
    { ...block([STONE], [0, 0, 0, 0]), runs: [[4, null]], palette: [] },
    { ...block([STONE], [0, 0, 0, 0]), palette: [{ materialRef: '', orientation: 0 }] },
    { ...block([STONE], [0, 0, 0, 0]), palette: [{ materialRef: 'air', orientation: -1 }] },
    { ...block([STONE], [0, 0, 0, 0]), runs: [[3, 0]] },
  ]) await rejected(setup({ mutate: r => { r.proposal.block = bad; } }), 'SCHEMA_INVALID');
  assert.equal(setup().state.reads, 0);
});

test('palette legality against the current Catalogue (carve air included) is refused before Host facts or build', async () => {
  for (const [name, mutate, code] of [
    ['unknown node', r => { r.proposal.block = block([{ materialRef: 'fixture:missing', orientation: 0 }], [0, 0, 0, 0]); }, 'CATALOGUE_MISMATCH'],
    ['orientation not allowed', r => { r.proposal.block = block([{ materialRef: 'fixture:stone', orientation: 3 }], [0, 0, 0, 0]); }, 'UNSUPPORTED_MUTATION_SEMANTICS'],
    ['stateful node', r => { r.catalogue.materials['fixture:chest'] = { ...r.catalogue.materials['fixture:stone'], placeable: false };
      r.proposal.block = block([{ materialRef: 'fixture:chest', orientation: 0 }], [0, 0, 0, 0]); }, 'UNSUPPORTED_MUTATION_SEMANTICS'],
    ['air missing from Catalogue', r => { r.catalogue.emptyMaterialRef='fixture:stone'; delete r.catalogue.materials.air; r.proposal.block = block([AIR], [0, 0, 0, 0]); }, 'CATALOGUE_MISMATCH'],
  ]) { const f = setup({ mutate }); await rejected(f, code); assert.equal(f.state.reads, 0, name); }
});

test('protocol major + capability: Painter handshake is consumable by same major with any provenance; wrong major/minor/capability refused', async () => {
  const p = setup().painter, hs = p.protocolHandshake();
  const need = [api.protocolRequirement('painter-region/v3', [CAP])];
  assert.equal(api.checkProtocolCompatibility(hs, need).result, 'PROTOCOL_COMPATIBLE');
  const otherPatch = { ...clone(hs), provenance: { ...hs.provenance, packageVersion: '0.4.9', artifactDigest: 'f'.repeat(64) } };
  assert.equal(api.checkProtocolCompatibility(otherPatch, need).result, 'PROTOCOL_COMPATIBLE');
  for (const [req, code] of [[api.protocolRequirement('painter-region/v2', [CAP]), 'UNSUPPORTED_VERSION'],
    [api.protocolRequirement('painter-region/v1', []), 'UNSUPPORTED_VERSION'],
    [api.protocolRequirement('painter-region/v3', [CAP], 1), 'UNSUPPORTED_VERSION'],
    [api.protocolRequirement('painter-region/v3', ['painter-region/v3:other']), 'CAPABILITY_UNAVAILABLE']])
    assert.throws(() => api.checkProtocolCompatibility(hs, [req]), e => e.code === code);
  const v1 = setup({ mutate: r => { r.contractVersion = 'painter-region/v1'; } });
  await rejected(v1, 'UNSUPPORTED_VERSION'); assert.equal(v1.state.reads, 0);
  const d = p.describe();
  assert.ok(d.operations.includes(op)); assert.equal(d.worldWrites, 0);
  const tool = d.tools.find(t => t.name === op);
  assert.equal(tool.capability, CAP); assert.ok(tool.typicalScale && tool.preconditions.length >= 3);
  assert.ok(!Object.keys(tool).some(k => /threshold|max|limit/i.test(k)));
});

test('same Session/turn/intent/brief/world as text path: incoherent request refused before Host facts', async () => {
  for (const [mutate, code] of [
    [r => { r.referenceBrief.sessionRef = 'other'; }, 'SCHEMA_INVALID'], // contract domain rule
    [r => { r.intent.confirmedIntent.confirmedTurnRevision = 'other'; }, 'INTENT_UNCONFIRMED'],
    [r => { r.intent.intendedWorldRef = 'other-world'; }, 'CURRENT_WORLD_MISMATCH'],
    [r => { r.localContext.worldRef = 'other-world'; }, 'CURRENT_WORLD_MISMATCH'],
  ]) { const f = setup({ mutate }); await rejected(f, code); assert.equal(f.state.reads, 0); }
  const forged = setup(); await rejected(forged, 'UNKNOWN_REQUIRED_FIELD', { ...forged.request, actorRef: 'forged' });
});

test('current Host facts before and after: live world/connection, brief (incl. image media) change or cancel refuses; verified image brief passes', async () => {
  for (const field of ['worldRef', 'connectionIncarnationRef']) {
    const f = setup({ change: s => { s.facts.currentContext[field] = 'changed'; } });
    await rejected(f, 'CURRENT_WORLD_MISMATCH');
  }
  const media = r => { r.referenceBrief.media = [{ attachmentRef: 'fixture-attachment-1', storedBytesDigest: 'a'.repeat(64),
    projectionVariantId: null, projectionBytesDigest: null, mediaType: 'image/png', bytes: 1024, width: 16, height: 16 }]; };
  const image = setup({ mutate: media });
  assert.equal((await image.painter.call(op, image.request)).error, null);
  const swapped = setup({ mutate: media, change: s => { if (s.reads === 2) s.facts.currentBriefDigest = 'b'.repeat(64); } });
  await rejected(swapped, 'TRANSACTION_CONFLICT');
  const cancel = setup({ change: s => { if (s.reads === 2) s.facts.requestState = 'CANCELLED'; } });
  await rejected(cancel, 'REQUEST_CANCELLED');
  const abort = new AbortController(), late = setup({ change: s => { if (s.reads === 2) abort.abort(); } });
  await rejected(late, 'REQUEST_CANCELLED', late.request, { signal: abort.signal });
  const none = setup(), bare = new ExteriorPainterV2();
  await rejected({ ...none, painter: bare }, 'CAPABILITY_UNAVAILABLE');
});

test('exact replay returns the original after fresh facts; changed payload is REPLAY_MISMATCH; deterministic digest', async () => {
  const f = setup();
  const first = await f.painter.call(op, f.request);
  assert.deepEqual(await f.painter.call(op, JSON.stringify(f.request)), first); assert.equal(f.state.reads, 4);
  const changed = clone(f.request); changed.proposal.block = block([STONE], [0, 0, 0, 0]); rebind(changed);
  assert.equal((await f.painter.call(op, changed)).error.code, 'REPLAY_MISMATCH');
  const other = setup();
  assert.equal((await other.painter.call(op, other.request)).result.buildDigest, first.result.buildDigest);
});

test('text proposal on the same service still returns the exact public fixture response', async () => {
  const facts = clone(main.facts);
  const p = new ExteriorPainterV2({ localFacts: { async read() { return clone(facts); } }, llm: forbidden(), attachments: forbidden() });
  assert.equal(api.canonicalJSON(await p.call('ValidateBuildProposal', clone(main.request))), api.canonicalJSON(main.response));
});
