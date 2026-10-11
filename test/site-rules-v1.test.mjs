// Actual source/installed Painter against hanaworlds-contracts major 2 SiteRules.
// FIXTURE boundary: the contract's public `main` and `skill-site-rules` fixtures
// (rule values are test inputs, not product values) applied to the per-box
// ValidateBuildProposal path with every digest rebound through the public
// digestValue, plus a Painter-local hut region built the same way. No world,
// Canvas, Adapter, Brush, model or attachment is reached.
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = process.env.PAINTER_TEST_PACKAGE ?? resolve(new URL('..', import.meta.url).pathname);
const { contracts: api, contractFixture } = await import(pathToFileURL(resolve(root, 'src/contract-package.mjs')));
const Painter = await import(pathToFileURL(resolve(root, 'src/index.mjs')));
const main = contractFixture('main');
const rules = contractFixture('skill-site-rules');
const op = 'ValidateBuildProposal';
const clone = structuredClone;
const forbidden = () => new Proxy({}, { get(t, k) { if (typeof k === 'symbol') return Reflect.get(t, k); throw new Error('touched model/media'); } });
const digest = (kind, value) => api.digestValue(kind, value).sha256;
const CONTEXT = Object.keys(main.facts.sourceContext);
const sorted = list => [...list].sort(api.comparePosition);

/** Hut region (Painter-local FIXTURE): stone ground at y=0 under a 5x5 footprint, air
 * above up to y=3; inside the same public frame and evidence as `main`. */
function hutRegion(r) {
  const [ox, , oz] = [0, 0, 3];
  const occupied = [], empty = [];
  for (let x = 0; x <= 4; x++) for (let z = 0; z <= 4; z++) {
    occupied.push({ position: [ox + x, 0, oz + z], materialRef: 'fixture:stone', orientation: 0 });
    for (let y = 1; y <= 3; y++) empty.push([ox + x, y, oz + z]);
  }
  const tf = r.targetFacts;
  const sampledBounds = { min: [ox, 0, oz], max: [ox + 4, 3, oz + 4] };
  const sampledPositions = sorted([...occupied.map(c => c.position), ...empty]);
  Object.assign(tf, { sampledBounds, occupiedCells: occupied, knownEmptyCells: sorted(empty), unknownCells: [],
    coverageDigest: digest('coverage', { profileVersion: 'coverage/v2', sampledBounds, sampledPositions }),
    usableVolume: { ...tf.usableVolume, emptyCellCount: empty.length } });
  tf.occupiedCells.sort((a, b) => api.comparePosition(a.position, b.position));
  r.regionInspection.targetFacts = clone(tf);
}
/** Four 2-high walls around a 3x3 interior, a roof at y=3; `door` cuts a 1x2 gap on `face`. */
function hut({ door = true, face = '-Z', doorHeight = 2 } = {}) {
  const boxes = [
    { min: [0, 1, 0], max: [4, 2, 0], materialRef: 'wall' }, { min: [0, 1, 4], max: [4, 2, 4], materialRef: 'wall' },
    { min: [0, 1, 0], max: [0, 2, 4], materialRef: 'wall' }, { min: [4, 1, 0], max: [4, 2, 4], materialRef: 'wall' },
    { min: [0, 3, 0], max: [4, 3, 4], materialRef: 'wall' },
  ];
  const at = { '-Z': [2, 0], '+Z': [2, 4], '-X': [0, 2], '+X': [4, 2] }[face];
  if (door) boxes.push({ min: [at[0], 1, at[1]], max: [at[0], doorHeight, at[1]], materialRef: 'gap' });
  return { decision: 'BUILD', materials: { wall: { materialRef: 'fixture:stone', orientation: 0 }, gap: { materialRef: 'air', orientation: 0 } }, boxes };
}

/**
 * The `main` request with confirmed site rules `siteRules` (skill controls equal to
 * them), optional portal refs, region and proposal, and every digest and Host
 * context rebound. `tamper` edits the SafetyProfile after derivation;
 * `changeAfterConfirmation` edits the confirmed rules but keeps the old intent digest.
 */
function variant({ siteRules = main.request.intent.confirmedIntent.siteRules, portalRefs, proposal, region,
  tamper, changeAfterConfirmation, edit } = {}) {
  const r = clone(main.request);
  if (region) region(r);
  if (proposal) r.proposal = proposal;
  r.referenceBrief.controls.siteRules = clone(siteRules);
  r.intent.confirmedIntent.siteRules = clone(siteRules);
  if (portalRefs) { r.intent.confirmedIntent.entrancePortalRefs = portalRefs; r.referenceBrief.controls.entrancePortalRefs = portalRefs; }
  r.referenceBriefDigest = r.intent.referenceBriefDigest = digest('reference-brief', r.referenceBrief);
  r.targetFactsDigest = r.regionInspection.targetFactsDigest = digest('target-facts', r.targetFacts);
  r.intentDigest = digest('intent', r.intent);
  r.safetyProfile = clone(api.safetyProfileFromConfirmedIntent(r.intent));
  if (tamper) Object.assign(r.safetyProfile, tamper);
  r.safetyProfileDigest = digest('safety-profile', r.safetyProfile);
  if (changeAfterConfirmation) Object.assign(r.intent.confirmedIntent.siteRules, changeAfterConfirmation);
  if (edit) edit(r);
  const facts = clone(main.facts);
  const context = Object.fromEntries(CONTEXT.map(k => [k, clone(r[k])]));
  facts.sourceContext = context; facts.currentContext = clone(context);
  facts.requestFacts.currentBriefDigest = r.referenceBriefDigest;
  return { request: r, facts };
}
function painterFor(facts) {
  const state = { reads: 0 };
  const localFacts = { async read() { state.reads++; return clone(facts); } };
  return { state, painter: new Painter.ExteriorPainterV2({ localFacts, llm: forbidden(), attachments: forbidden() }) };
}
async function call(v, raw = v.request) {
  const { state, painter } = painterFor(v.facts);
  return { response: await painter.call(op, raw), state };
}
async function refused(v, code, reason) {
  const { response, state } = await call(v);
  assert.equal(response.result, null, `expected ${code}`);
  assert.equal(response.error.code, code); if (reason) assert.equal(response.error.reason, reason);
  assert.equal(response.error.mutationState, 'NONE');
  return { response, state };
}
async function accepted(v) {
  const { response } = await call(v);
  assert.equal(response.error, null, JSON.stringify(response.error));
  api.validateBuildProposalResponse(v.request, response);
  return response.result.build;
}
const GEOMETRY_KEYS = /avatarDimensions|bodyOccupiedPositions/;

test('public skill-site-rules accept sets: confirmed strict/permissive rules plan with no entrance check', async () => {
  for (const name of rules.perCell.accept.filter(n => !rules.ruleSets[n].requireEntranceConnectivity)) {
    const build = await accepted(variant({ siteRules: rules.ruleSets[name] }));
    assert.deepEqual(build.witnesses.map(w => w.predicate), ['COVERAGE', 'BODY_CLEARANCE', 'HAZARD'], name);
    assert.equal(build.contractVersion, 'BUILD/V5');
  }
});

test('public skill-site-rules reject cases are refused by Painter with the published code', async () => {
  for (const c of rules.perCell.reject) {
    const v = variant({ siteRules: rules.ruleSets[c.rules], tamper: c.tamper, portalRefs: c.entrancePortalRefs,
      changeAfterConfirmation: c.changeAfterConfirmation });
    await refused(v, c.error.code, c.error.reason);
  }
});

test('public decode rejects, including player geometry on SafetyProfile/RegionInspection, stop before Host facts', async () => {
  for (const c of rules.perCell.decodeReject) {
    const v = variant({ edit: r => {
      const target = c.path.split('.').reduce((o, k) => o[k], r);
      if (c.remove) delete target[c.remove]; else Object.assign(target, c.set);
    } });
    const { state } = await refused(v, c.error.code, c.error.reason);
    assert.equal(state.reads, 0, c.title);
  }
});

test('no geometry input: emitted witnesses carry no body or avatar fields; BODY_CLEARANCE binds positions only', async () => {
  const build = await accepted(variant());
  assert.ok(!GEOMETRY_KEYS.test(JSON.stringify(build)));
  assert.deepEqual(Object.keys(build.witnesses.find(w => w.predicate === 'BODY_CLEARANCE').facts).sort(), ['evidence', 'positions']);
  // A body at a written cell is not a Painter input any more (checked inside the engine).
  assert.equal(Painter.trustedFromRegion(main.request.regionInspection).body, undefined);
});

test('no entrance required: entrance rules are not run (door on any face, or none, still plans)', async () => {
  for (const proposal of [hut({ face: '+Z' }), hut({ face: '+X' }), hut({ door: false })]) {
    const build = await accepted(variant({ siteRules: rules.ruleSets.strict, region: hutRegion, proposal }));
    assert.ok(!build.witnesses.some(w => w.predicate === 'ENTRANCE_CONNECTIVITY'));
  }
});

test('entrance required, no portal confirmed: doorway on entranceFacing with the confirmed clearance (portalRef null)', async () => {
  const entrance = rules.ruleSets.entrance;
  const build = await accepted(variant({ siteRules: entrance, region: hutRegion, proposal: hut({ face: '-Z' }) }));
  const w = build.witnesses.find(x => x.predicate === 'ENTRANCE_CONNECTIVITY');
  assert.equal(w.witnessId, 'w5-doorway'); assert.equal(w.facts.portalRef, null);
  assert.deepEqual(w.facts.clearance, entrance.entranceClearance);
  assert.deepEqual(w.facts.path, [[2, 1, 3], [2, 1, 4]]);
  assert.ok(!GEOMETRY_KEYS.test(JSON.stringify(build)));
});

test('entrance required: clearance decides usability; wrong face, no doorway and solid block are BUILD_INVALID', async () => {
  const entrance = rules.ruleSets.entrance;
  const taller = { ...entrance, entranceClearance: { ...entrance.entranceClearance, height: 3 } };
  for (const [siteRules, proposal] of [
    [taller, hut({ face: '-Z' })], // 2-high door and interior cannot fit a confirmed 3-high clearance
    [entrance, hut({ face: '+Z' })], // entranceFacing is -Z
    [entrance, hut({ face: '-Z', doorHeight: 1 })], // 1-high gap is not a 2-high doorway
    [entrance, hut({ door: false })],
    [entrance, main.request.proposal],
  ]) await refused(variant({ siteRules, region: proposal === main.request.proposal ? undefined : hutRegion, proposal }),
    'BUILD_INVALID', 'INVALID_GEOMETRY');
});

test('confirmed portal ref with no portal producer is a named refusal', async () => {
  await refused(variant({ siteRules: rules.ruleSets.entrance, region: hutRegion, proposal: hut(), portalRefs: ['front'] }),
    'TARGET_FACTS_INCOMPLETE', 'REQUIRED_FACT_UNKNOWN');
});

test('stated light rule: CAPABILITY_UNAVAILABLE by capability name at Painter admission and at witness recheck', async () => {
  const light = variant({ siteRules: rules.ruleSets.light });
  await refused(light, 'CAPABILITY_UNAVAILABLE', 'REQUIRED_FACT_UNKNOWN');
  assert.deepEqual(rules.perCell.reject.find(c => c.rules === 'light').capability, 'painter/v6:light-rule');
  // Painter's own admission (independent of the contract request check) ...
  assert.throws(() => Painter.boundRules(light.request), e => e.code === 'CAPABILITY_UNAVAILABLE' && e.reason === 'REQUIRED_FACT_UNKNOWN');
  // ... and its witness recheck before releasing a BUILD.
  const ok = variant(), body = ok.request;
  const geometry = Painter.planGeometry({ proposal: body.proposal, catalogue: body.catalogue, targetFacts: body.targetFacts });
  assert.throws(() => Painter.assembleBuild({ request: light.request, geometry, documentId: 'x',
    trusted: Painter.trustedFromRegion(body.regionInspection), entrances: [] }), e => e.code === 'CAPABILITY_UNAVAILABLE');
  // The same rules with optionalLightRule null pass: only the unsupported capability is refused.
  await accepted(variant({ siteRules: { ...rules.ruleSets.light, optionalLightRule: null } }));
});

test('Painter output is what the public witness checks bind: tampered entrance/body witnesses are refused', async () => {
  const v = variant({ siteRules: rules.ruleSets.entrance, region: hutRegion, proposal: hut() });
  const { response } = await call(v);
  assert.equal(response.error, null);
  for (const c of rules.perCell.witnessReject) {
    const t = clone(response);
    const w = t.result.build.witnesses.find(x => x.predicate === (c.bodyExtra ? 'BODY_CLEARANCE' : 'ENTRANCE_CONNECTIVITY'));
    if (c.clearance) w.facts.clearance = c.clearance;
    if (c.portalRef) w.facts.portalRef = c.portalRef;
    if (c.bodyExtra) Object.assign(w.facts, c.bodyExtra);
    assert.throws(() => {
      t.result.buildDigest = digest('build', t.result.build); // an unknown witness field fails already here
      api.validateBuildProposalResponse(v.request, t);
    }, e => e.code === c.error.code, c.title);
  }
});

/** Hut region whose bound Catalogue has `edit` applied (digests rebound). A null
 * capability field is listed in unknownFields, as the contract's domain rule requires. */
const unknown = (node, field) => { node[field] = null; node.unknownFields = [...new Set([...node.unknownFields, field])].sort(); };
const hutWith = edit => r => {
  edit(r.catalogue.materials);
  r.targetFacts.catalogueDigest = digest('catalogue', r.catalogue);
  hutRegion(r);
};
const airUnknown = hutWith(nodes => unknown(nodes.air, 'passable'));

test('entrance needs proven passable air: unknown air passable is named REQUIRED_FACT_UNKNOWN, not invalid geometry', async () => {
  const entrance = rules.ruleSets.entrance;
  for (const height of [1, 2]) { // independent of the confirmed clearance height
    const siteRules = { ...entrance, entranceClearance: { ...entrance.entranceClearance, height } };
    await refused(variant({ siteRules, region: airUnknown, proposal: hut() }), 'TARGET_FACTS_INCOMPLETE', 'REQUIRED_FACT_UNKNOWN');
    // The same plan with the air fact supplied (known, no collision box) passes.
    await accepted(variant({ siteRules, region: hutRegion, proposal: hut() }));
  }
});

test('unknown facts never mask or replace a real verdict', async () => {
  const entrance = rules.ruleSets.entrance;
  // No entrance required: entrance facts are not consulted, the plan passes.
  await accepted(variant({ siteRules: rules.ruleSets.strict, region: airUnknown, proposal: hut() }));
  // Geometry that fails even if every unknown fact were favourable stays BUILD_INVALID.
  for (const proposal of [hut({ door: false }), hut({ face: '+Z' })])
    await refused(variant({ siteRules: entrance, region: airUnknown, proposal }), 'BUILD_INVALID', 'INVALID_GEOMETRY');
  // Empty material known to be non-passable: no usable doorway is invalid geometry.
  const solidAir = hutWith(nodes => { nodes.air.passable = false; });
  await refused(variant({ siteRules: entrance, region: solidAir, proposal: hut() }), 'BUILD_INVALID', 'INVALID_GEOMETRY');
  // A wall with unknown passable cannot prove the interior is enclosed.
  const wallUnknown = hutWith(nodes => { unknown(nodes['fixture:stone'], 'passable'); });
  await refused(variant({ siteRules: entrance, region: wallUnknown, proposal: hut() }), 'TARGET_FACTS_INCOMPLETE', 'REQUIRED_FACT_UNKNOWN');
});

// painter-02: a world source with opaque refs and no engine-specific metadata.
const EMPTY_REF = 'source:void-17';
const WALL_REF = 'source:solid-23';
function neutralHut({ siteRules = rules.ruleSets.entrance, edit = () => {} } = {}) {
  const proposal = hut();
  proposal.materials.gap.materialRef = EMPTY_REF;
  proposal.materials.wall.materialRef = WALL_REF;
  return variant({ siteRules, proposal, region: r => {
    const emptyTags = { ...r.catalogue.materials[r.catalogue.emptyMaterialRef], extension: {} };
    const wallTags = { ...r.catalogue.materials['fixture:stone'], extension: {} };
    r.catalogue.emptyMaterialRef = EMPTY_REF;
    r.catalogue.materials = { [EMPTY_REF]: emptyTags, [WALL_REF]: wallTags };
    edit(emptyTags, wallTags);
    r.targetFacts.catalogueDigest = digest('catalogue', r.catalogue);
    hutRegion(r);
    for (const cell of r.targetFacts.occupiedCells) cell.materialRef = WALL_REF;
    r.regionInspection.targetFacts = clone(r.targetFacts);
  } });
}

test('painter-02: opaque emptyMaterialRef supplies doorway, cavity and BUILD without nodeboxes', async () => {
  const v = neutralHut();
  assert.equal(Object.hasOwn(v.request.catalogue.materials, 'air'), false);
  const build = await accepted(v);
  assert.equal(build.materials.gap.materialRef, EMPTY_REF);
  assert.equal(build.materials.wall.materialRef, WALL_REF);
  const witness = build.witnesses.find(w => w.predicate === 'ENTRANCE_CONNECTIVITY');
  assert.deepEqual(witness.facts.path, [[2, 1, 3], [2, 1, 4]]);
});

test('painter-02: contradictory engine fields in opaque extensions do not override neutral tags', async () => {
  const edit = (emptyTags, wallTags) => {
    emptyTags.extension = { walkable: true, collisionBoxes: [[-0.5, -0.5, -0.5, 0.5, 0.5, 0.5]],
      liquidType: 'source', damagePerSecond: 1000, drawType: 'nodebox' };
    wallTags.extension = { walkable: false, collisionBoxes: [], liquidType: 'source', damagePerSecond: 1000 };
  };
  const actual = await accepted(neutralHut({ edit }));
  const expected = await accepted(neutralHut());
  // Extensions remain digest-bound even though they have no planning semantics.
  for (const field of ['materials', 'operations', 'declaredBounds']) assert.deepEqual(actual[field], expected[field]);
  assert.deepEqual(actual.witnesses.map(w => w.facts), expected.witnesses.map(w => w.facts));
});

test('painter-02: entrance planner never interprets engine-specific fields', () => {
  const { request } = neutralHut();
  const geometry = Painter.planGeometry(request);
  const expected = Painter.planEntrances({ request, geometry, entranceFacing: '-Z' });
  const forbiddenFields = new Set(['walkable', 'collisionBoxes', 'liquidType', 'damagePerSecond']);
  for (const [ref, tags] of Object.entries(request.catalogue.materials)) {
    tags.extension = new Proxy({}, { get(_, field) {
      assert.fail(`planner interpreted extension.${String(field)}`);
    } });
    request.catalogue.materials[ref] = new Proxy(tags, { get(target, field, receiver) {
      assert.equal(forbiddenFields.has(field), false, `planner read ${String(field)}`);
      return Reflect.get(target, field, receiver);
    } });
  }
  assert.deepEqual(Painter.planEntrances({ request, geometry, entranceFacing: '-Z' }), expected);
  // Also exercise favourableCatalogue: an unknown wall remains a refusal even
  // without a default collision box or any engine metadata.
  unknown(request.catalogue.materials[WALL_REF], 'passable');
  assert.throws(() => Painter.planEntrances({ request, geometry, entranceFacing: '-Z' }),
    e => e.code === 'TARGET_FACTS_INCOMPLETE' && e.reason === 'REQUIRED_FACT_UNKNOWN');
});

test('painter-02: every unknown neutral empty tag refuses entrance with opaque refs', async () => {
  for (const field of ['passable', 'liquid', 'hazardPerSecond']) {
    const { request } = neutralHut();
    const geometry = Painter.planGeometry(request);
    unknown(request.catalogue.materials[EMPTY_REF], field);
    assert.throws(() => Painter.planEntrances({ request, geometry, entranceFacing: '-Z' }),
      e => e.code === 'TARGET_FACTS_INCOMPLETE' && e.reason === 'REQUIRED_FACT_UNKNOWN', field);
  }
  await refused(neutralHut({ edit: (_, wallTags) => unknown(wallTags, 'passable') }),
    'TARGET_FACTS_INCOMPLETE', 'REQUIRED_FACT_UNKNOWN');
});

test('painter-02: known non-passable, liquid or hazardous empty tags fail strict entrance rules', () => {
  for (const patch of [{ passable: false }, { liquid: true }, { hazardPerSecond: 1 }]) {
    const { request } = neutralHut();
    const geometry = Painter.planGeometry(request);
    Object.assign(request.catalogue.materials[EMPTY_REF], patch);
    assert.throws(() => Painter.planEntrances({ request, geometry, entranceFacing: '-Z' }),
      e => e.code === 'BUILD_INVALID' && e.reason === 'INVALID_GEOMETRY');
  }
});

test('painter-02: confirmed liquid and hazard allowance applies to entrance and written effects', async () => {
  const siteRules = { ...rules.ruleSets.entrance, hazardPolicy: { forbidLiquid: false, maximumDamagePerSecond: 2 } };
  const v = neutralHut({ siteRules, edit: (emptyTags, wallTags) => {
    Object.assign(emptyTags, { liquid: true, hazardPerSecond: 2 });
    Object.assign(wallTags, { liquid: true, hazardPerSecond: 2 });
  } });
  const build = await accepted(v);
  const hazard = build.witnesses.find(w => w.predicate === 'HAZARD');
  assert.equal(hazard.facts.forbidLiquid, false);
  assert.equal(hazard.facts.maximumDamagePerSecond, 2);
});

test('painter-02: written material hazard checks require known neutral tags without an entrance', () => {
  for (const patch of [{ liquid: true }, { hazardPerSecond: 1 }, { liquid: null }, { hazardPerSecond: null }]) {
    const { request } = neutralHut({ siteRules: rules.ruleSets.strict });
    const geometry = Painter.planGeometry(request);
    const wallTags = request.catalogue.materials[WALL_REF];
    for (const [field, value] of Object.entries(patch)) {
      if (value === null) unknown(wallTags, field); else wallTags[field] = value;
    }
    assert.throws(() => Painter.assembleBuild({ request, geometry, documentId: 'neutral-hut',
      trusted: Painter.trustedFromRegion(request.regionInspection), entrances: [] }),
      e => e.code === 'UNSUPPORTED_MATERIAL' && e.reason === 'REQUIRED_FACT_UNKNOWN');
  }
});
