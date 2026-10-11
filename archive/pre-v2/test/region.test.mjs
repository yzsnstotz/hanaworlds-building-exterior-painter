// FIXTURE: painter/v3 regionInspection consumption for a first new building.
import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalJSON, digestValue, validateWitnessCoherence } from '#contracts';
import * as Painter from '#contracts/painter/v3';
import * as Build from '#contracts/BUILD/V2';
import { ExteriorPainterV2, promptText } from '../src/index.mjs';
import * as F from './fixtures.mjs';
import * as R from './region-fixtures.mjs';

const painter = (answer = R.APPROVED_ANSWER, authority = R.chainAuthority()) => {
  const llm = F.llm({ answers: [answer] });
  return { llm, p: new ExteriorPainterV2({ authority, llm, attachments: F.attachments() }) };
};
const errorOf = response => { assert.equal(response.result, null); return response.error; };

test('approved PLACE-LUANTI-INITIATOR-CHAIN: painter request -> exactly the approved painter response', async () => {
  const { p, llm } = painter();
  const response = await p.call('CreateBuildPlan', R.clone(R.approved.painterRequest));
  Painter.response('CreateBuildPlan', response);
  assert.equal(canonicalJSON(response), canonicalJSON(R.approved.painterResponse));
  assert.equal(llm.requests.length, 1);
  // the same document is what the approved Brush request compiles
  assert.equal(canonicalJSON(response.result.build), canonicalJSON(R.approved.brushRequest.build));
  Build.validate('BuildDocument', R.approved.brushRequest);
});

test('BUILD.coordinateFrame = regionInspection.frame; PROTECTION/BODY_CLEARANCE carry regionInspection.evidence', async () => {
  const { p } = painter();
  const { result } = await p.call('CreateBuildPlan', R.clone(R.approved.painterRequest));
  const ri = R.approved.painterRequest.regionInspection;
  assert.equal(canonicalJSON(result.build.coordinateFrame), canonicalJSON(ri.frame));
  for (const predicate of ['PROTECTION', 'BODY_CLEARANCE']) {
    const w = result.build.witnesses.find(x => x.predicate === predicate);
    assert.equal(canonicalJSON(w.facts.evidence), canonicalJSON(ri.evidence));
    assert.deepEqual(w.facts.positions, [[0, 1, 3]]);
  }
});

test('approved negatives give their exact approved errors and no BUILD', async () => {
  for (const id of ['INV-PAINTER-REGION-MISMATCH', 'INV-INTERIOR-ON-REGION', 'INV-INITIAL-PLANNED']) {
    const c = R.invalid(id);
    const { p, llm } = painter();
    const response = await p.call('CreateBuildPlan', R.clone(c.materialized.message));
    assert.equal(canonicalJSON(errorOf(response)), canonicalJSON(c.expected.error), id);
    assert.equal(llm.requests.length, 0, id);
  }
  // INV-REGION-SOURCE-WITH-OBJECTREF: the mutated TargetFacts inside a painter request
  const c = R.invalid('INV-REGION-SOURCE-WITH-OBJECTREF');
  const body = R.clone(R.approved.painterRequest);
  body.targetFacts = R.clone(c.materialized.message);
  const response = await painter().p.call('CreateBuildPlan', body);
  assert.equal(canonicalJSON(errorOf(response)), canonicalJSON(c.expected.error));
});

test('missing or fabricated region evidence/frame is a typed rejection, never defaulted', async () => {
  const run = async mutate => {
    const body = R.clone(R.approved.painterRequest); mutate(body);
    const { p, llm } = painter();
    const response = await p.call('CreateBuildPlan', body);
    return [`${errorOf(response).code}/${errorOf(response).phase}/${errorOf(response).reason}`, llm.requests.length];
  };
  // REGION_INSPECTED facts without the relayed RegionInspection
  assert.deepEqual(await run(b => { b.regionInspection = null; }), ['TARGET_FACTS_INCOMPLETE/validate/REQUIRED_FACT_UNKNOWN', 0]);
  // a painter-invented frame (INV-INVENTED-FRAME value) no longer matches the Adapter frameDigest
  const invented = R.invalid('INV-INVENTED-FRAME').mutation.mutatedValue;
  assert.deepEqual(await run(b => { b.regionInspection.frame = invented; }), ['TARGET_FACTS_STALE/validate/REVISION_CHANGED', 0]);
  // a frame whose transformRevision is not the evidence's Adapter execution revision
  assert.deepEqual(await run(b => { b.regionInspection.frame.transformRevision = 'painter-guess'; }), ['SCHEMA_INVALID/validate/INVALID_SHAPE', 0]);
  // evidence for another world revision than the facts
  assert.deepEqual(await run(b => { b.regionInspection.evidence.worldRevision = 'fixture-world-9'; }), ['SCHEMA_INVALID/validate/INVALID_SHAPE', 0]);
  // a RegionInspection attached to non-region (INSPECTED) facts
  const body = R.clone(F.request()); body.regionInspection = R.clone(R.approved.painterRequest.regionInspection);
  const response = await painter().p.call('CreateBuildPlan', body);
  assert.equal(errorOf(response).code, 'SCHEMA_INVALID');
  // stale world revision at the authority
  const { p } = painter(R.APPROVED_ANSWER, R.chainAuthority('fixture-world-11'));
  const stale = await p.call('CreateBuildPlan', R.clone(R.approved.painterRequest));
  assert.deepEqual([errorOf(stale).code, errorOf(stale).reason], ['TARGET_FACTS_STALE', 'REVISION_CHANGED']);
});

test('protected or player-occupied region cells are never written', async () => {
  const prot = await painter(R.hutAnswer()).p.call('CreateBuildPlan', R.regionRequest({ protectedPositions: [[2, 1, 0]] }));
  assert.deepEqual([errorOf(prot).code, errorOf(prot).reason], ['PERMISSION_DENIED', 'SCOPE_DENIED']);
  const bodies = await painter(R.hutAnswer()).p.call('CreateBuildPlan', R.regionRequest({ bodyOccupiedPositions: [[0, 1, 0]] }));
  assert.deepEqual([errorOf(bodies).code, errorOf(bodies).reason], ['BUILD_INVALID', 'INVALID_GEOMETRY']);
  // a body inside the hut interior is not written over and is not projected into the witness
  const ok = await painter(R.hutAnswer()).p.call('CreateBuildPlan', R.regionRequest({ bodyOccupiedPositions: [[2, 1, 2]] }));
  const w = ok.result.build.witnesses.find(x => x.predicate === 'BODY_CLEARANCE');
  assert.deepEqual(w.facts.bodyOccupiedPositions, []);
});

test('HW-A028 painter side: the entrance is on the face whose outward normal is entranceFacing', async () => {
  for (const facing of ['-Z', '+Z', '-X', '+X']) {
    const body = R.regionRequest({ entranceFacing: facing });
    const good = await painter(R.hutAnswer([facing])).p.call('CreateBuildPlan', body);
    Painter.response('CreateBuildPlan', good);
    assert.equal(good.error, null, facing);
    assert.equal(digestValue('build', good.result.build).sha256, good.result.buildDigest);
    const wrong = { '-Z': '+X', '+Z': '-X', '-X': '-Z', '+X': '+Z' }[facing];
    const other = await painter(R.hutAnswer([wrong])).p.call('CreateBuildPlan', body);
    assert.deepEqual([errorOf(other).code, errorOf(other).reason], ['BUILD_INVALID', 'INVALID_GEOMETRY'], facing);
    const both = await painter(R.hutAnswer([facing, wrong])).p.call('CreateBuildPlan', body);
    assert.deepEqual([errorOf(both).code, errorOf(both).reason], ['BUILD_INVALID', 'INVALID_GEOMETRY'], facing);
  }
  // a hut without any door has a usable interior but no entrance
  const closed = await painter(R.hutAnswer([])).p.call('CreateBuildPlan', R.regionRequest());
  assert.deepEqual([errorOf(closed).code, errorOf(closed).reason], ['BUILD_INVALID', 'INVALID_GEOMETRY']);
  // the model is told the facing and that the footprint is fixed
  assert.match(promptText(R.regionRequest({ entranceFacing: '+X' })), /"firstBuilding":\{"footprintIsFixed":true,"entranceFacing":"\+X"\}/);
});

test('region BUILD is witness-coherent and Brush-shaped (FIXTURE)', async () => {
  const body = R.regionRequest();
  const { result } = await painter(R.hutAnswer(['-Z'])).p.call('CreateBuildPlan', body);
  const effects = new Map();
  for (const op of result.build.operations)
    for (let x = op.min[0]; x <= op.max[0]; x++) for (let y = op.min[1]; y <= op.max[1]; y++) for (let z = op.min[2]; z <= op.max[2]; z++)
      effects.set(`${x},${y},${z}`, { position: [x, y, z], ...result.build.materials[op.materialRef] });
  const finalEffects = { profileVersion: 'final-effects/v2', frameDigest: body.targetFacts.frameDigest,
    catalogueDigest: result.build.catalogueDigest,
    effects: [...effects.values()].sort((a, b) => a.position[0] - b.position[0] || a.position[1] - b.position[1] || a.position[2] - b.position[2]) };
  assert.equal(validateWitnessCoherence({ build: result.build, finalEffects, targetFacts: body.targetFacts,
    safetyProfile: body.safetyProfile, catalogue: body.catalogue }).coherent, true);
  Build.validate('BuildDocument', { ...R.clone(R.approved.brushRequest), build: result.build, buildDigest: result.buildDigest,
    targetFacts: body.targetFacts, targetFactsDigest: body.targetFactsDigest });
});
