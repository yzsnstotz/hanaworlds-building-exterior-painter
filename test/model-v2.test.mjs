import test from 'node:test';
import assert from 'node:assert/strict';
import { Painter as Painter } from './painter-under-test.mjs';
import { contractFixture, contracts as api } from '../tools/contract-package.mjs';
const main = contractFixture('main');
const digest = (kind, value) => api.digestValue(kind, value).sha256;
const contextOf = request => Object.fromEntries(Object.keys(main.facts.sourceContext).map(k => [k, structuredClone(request[k])]));
function neutralContext() {
  const r = structuredClone(main.request), c = r.catalogue;
  c.materials = {
    'source:void': { ...c.materials.air, extension: { nodeName: 'secret-empty', param2: 99 } },
    'source:wall': { ...c.materials['fixture:stone'], orientations: [3, 7], extension: { nodeName: 'secret-wall', param2: 99 } },
  };
  c.emptyMaterialRef = 'source:void';
  r.regionInspection.frame = { ...r.regionInspection.frame, frameId: 'source:frame', origin: [-20, 7, 91],
    axes: ['-Z', '+X', '-Y'], handedness: 'right', gridUnit: { name: 'source-cell', metersPerGridUnit: 0.25 } };
  r.targetFacts.frameDigest = digest('frame', r.regionInspection.frame);
  r.targetFacts.catalogueDigest = digest('catalogue', c);
  r.targetFacts.occupiedCells[0].materialRef = 'source:wall';
  r.targetFactsDigest = digest('target-facts', r.targetFacts);
  r.regionInspection.targetFacts = structuredClone(r.targetFacts);
  r.regionInspection.targetFactsDigest = r.targetFactsDigest;
  return contextOf(r);
}
const factsFrom = text => JSON.parse(text.slice(text.indexOf('\n') + 1));
test('prompt helper uses the source vocabulary, neutral tags and complete Frame', () => {
  assert.equal(typeof Painter.promptText, 'function', 'active v2 prompt helper is missing');
  const context = neutralContext(), original = structuredClone(context);
  const facts = factsFrom(Painter.promptText(context));
  assert.deepEqual(facts.frame, context.regionInspection.frame);
  assert.equal(facts.emptyMaterialRef, 'source:void');
  assert.deepEqual(facts.offeredMaterials['source:wall'].orientations, [3, 7]);
  for (const [ref, tags] of Object.entries(context.catalogue.materials)) {
    const { extension, ...neutral } = tags;
    assert.deepEqual(facts.offeredMaterials[ref], neutral);
  }
  assert.deepEqual(facts.region.proposalOrigin, [0, 0, 3]);
  assert.deepEqual(facts.region.knownEmptyCells, [[0, 1, 0]]);
  assert.deepEqual(facts.region.blockedCells, [[0, 0, 0]]);
  assert.deepEqual(context, original);
});
test('messages generate the response shape from materialRef/orientation with no world or axis lore', () => {
  assert.equal(typeof Painter.buildMessages, 'function', 'active v2 message builder is missing');
  const messages = Painter.buildMessages(neutralContext());
  assert.match(messages.system, /materialRef/);
  assert.match(messages.system, /orientation/);
  assert.match(messages.system, /frame.axes/);
  assert.doesNotMatch(JSON.stringify(messages), /voxel world|\bair\b|nodeName|param2|secret-wall|secret-empty|x and z horizontal|y up|\[x,y,z\]/);
  assert.equal(messages.messages[0].content[0].text, Painter.promptText(neutralContext()));
});
test('non-placeable and unknown orientation materials are never offered, including the empty ref', () => {
  assert.equal(typeof Painter.promptText, 'function');
  const context = neutralContext();
  context.catalogue.materials['source:void'].placeable = false;
  Object.assign(context.catalogue.materials['source:wall'], { orientations: null, unknownFields: ['orientations'] });
  context.targetFacts.catalogueDigest = digest('catalogue', context.catalogue);
  context.targetFactsDigest = digest('target-facts', context.targetFacts);
  context.regionInspection.targetFacts = structuredClone(context.targetFacts);
  context.regionInspection.targetFactsDigest = context.targetFactsDigest;
  const facts = factsFrom(Painter.promptText(context));
  assert.deepEqual(facts.offeredMaterials, {});
  assert.equal(facts.emptyMaterialRef, 'source:void');
});
test('confirmed placement and entrance use the supplied inspection without axis defaults', () => {
  assert.equal(typeof Painter.promptText, 'function');
  for (const c of contractFixture('confirmed-placement').perCell.accept) {
    const context = contextOf(c.request), facts = factsFrom(Painter.promptText(context));
    const placement = context.intent.confirmedIntent.placement;
    if (!placement) { assert.equal(facts.confirmedPlacement, undefined); continue; }
    const local = p => p.map((v, i) => v - context.targetFacts.sampledBounds.min[i]);
    assert.equal(facts.confirmedPlacement.kind, placement.target.kind);
    if (placement.target.kind === 'EXACT_CELLS') assert.deepEqual(facts.confirmedPlacement.cells, placement.target.cells.map(local));
    else assert.deepEqual(facts.confirmedPlacement.bounds, { min: local(placement.target.bounds.min), max: local(placement.target.bounds.max) });
    assert.equal(facts.entrance.facing, context.regionInspection.entranceFacing);
    assert.deepEqual(facts.entrance.clearance, context.intent.confirmedIntent.siteRules.entranceClearance);
  }
});
test('prompt messages retain image references as data with zero attachment or model reads', () => {
  assert.equal(typeof Painter.buildMessages, 'function');
  const context = neutralContext();
  context.referenceBrief.media = [{ attachmentRef: 'source:image', storedBytesDigest: 'a'.repeat(64),
    projectionVariantId: null, projectionBytesDigest: null, mediaType: 'image/png', bytes: 100, width: 2, height: 3 }];
  context.referenceBriefDigest = context.intent.referenceBriefDigest = digest('reference-brief', context.referenceBrief);
  context.intentDigest = digest('intent', context.intent);
  const messages = Painter.buildMessages(context);
  assert.deepEqual(messages.messages[0].content.slice(1), context.referenceBrief.media.map(m => ({ type: 'image',
    attachment: { attachmentId: m.attachmentRef, mediaType: m.mediaType, bytes: m.bytes, width: m.width, height: m.height } })));
});
test('prompt helper refuses an old confirmation and a detached source catalogue', () => {
  const unconfirmed = neutralContext();
  unconfirmed.intent.confirmedIntent.confirmedTurnRevision = 'old-turn';
  unconfirmed.intentDigest = digest('intent', unconfirmed.intent);
  assert.throws(() => Painter.promptText(unconfirmed), e => e.code === 'INTENT_UNCONFIRMED');
  const stale = neutralContext();
  stale.catalogue.materials['source:wall'].orientations = [9];
  assert.throws(() => Painter.promptText(stale), e => e.code === 'TARGET_FACTS_STALE');
});
test('prompt helper refuses contradictory confirmed rules and missing confirmed portals', () => {
  const rules = contractFixture('skill-site-rules').ruleSets.entrance;
  const cases = [
    ['INTENT_UNCONFIRMED', c => { c.intent.orderedTargetRefs = ['source:object']; }],
    ['INTENT_UNCONFIRMED', () => {}, c => { c.safetyProfile.hazardPolicy.forbidLiquid = false; }],
    ['INTENT_UNCONFIRMED', c => {
      c.intent.confirmedIntent.siteRules = { ...rules, entranceClearance: null };
      c.referenceBrief.controls.siteRules = structuredClone(c.intent.confirmedIntent.siteRules);
    }],
    ['TARGET_FACTS_INCOMPLETE', c => {
      c.intent.confirmedIntent.siteRules = structuredClone(rules);
      c.referenceBrief.controls.siteRules = structuredClone(rules);
      c.intent.confirmedIntent.entrancePortalRefs = ['missing:portal'];
      c.referenceBrief.controls.entrancePortalRefs = ['missing:portal'];
    }],
  ];
  for (const [code, edit, tamper] of cases) {
    const context = neutralContext(); edit(context);
    context.referenceBriefDigest = context.intent.referenceBriefDigest = digest('reference-brief', context.referenceBrief);
    context.intentDigest = digest('intent', context.intent);
    context.safetyProfile = structuredClone(api.safetyProfileFromConfirmedIntent(context.intent));
    if (tamper) tamper(context);
    context.safetyProfileDigest = digest('safety-profile', context.safetyProfile);
    assert.throws(() => Painter.promptText(context), e => e.code === code);
  }
});
