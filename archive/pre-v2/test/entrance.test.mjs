// FIXTURE: ENTRANCE_CONNECTIVITY (EXTERIOR-ENTRANCE-001) recomputed from bound facts.
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateType, validateWitnessCoherence } from '#contracts';
import * as Painter from '#contracts/painter/v3';
import { ExteriorPainterV2, planGeometry, planEntrances, assembleBuild, parseProposal, promptText } from '../src/index.mjs';
import * as F from './fixtures.mjs';

const geometryFor = (body, answer) => planGeometry({ proposal: parseProposal(answer),
  catalogue: body.catalogue, targetFacts: body.targetFacts });
const outcome = fn => { try { fn(); return 'OK'; } catch (e) { return `${e.code}/${e.reason}`; } };
const painter = answer => new ExteriorPainterV2({ authority: F.authority(), llm: F.llm({ answers: [answer] }),
  attachments: F.attachments() });

test('a doorway connects the confirmed portal to the enclosed interior by a six-neighbor usable path', () => {
  const body = F.entranceRequest();
  const [entrance] = planEntrances({ request: body, geometry: geometryFor(body, F.hut()) });
  assert.equal(entrance.portalRef, 'front');
  assert.deepEqual(entrance.path, [[12, 1, 10], [12, 1, 11]]);
  const usable = new Set(entrance.usablePositions.map(p => p.join(',')));
  for (const p of entrance.path) assert.ok(usable.has(p.join(',')));
  // every use/path cell is verified empty air in the final state
  const written = new Map(geometryFor(body, F.hut()).effects.map(e => [e.position.join(','), e.nodeName]));
  const emptyCells = new Set(body.targetFacts.knownEmptyCells.map(p => p.join(',')));
  for (const k of usable) assert.ok(written.has(k) ? written.get(k) === 'air' : emptyCells.has(k), k);
  // wall cells and cells without 2-high clearance are not usable
  // wall/ground cells and cells without 2-high clearance under the roof are not usable
  assert.ok(!usable.has('10,1,10') && !usable.has('12,0,12') && !usable.has('12,2,12'));
});

test('FIXTURE: assembled BUILD with entrance witness passes schema, domain path rules and witness coherence', () => {
  const body = F.entranceRequest();
  const geometry = geometryFor(body, F.hut());
  const { build, finalEffects } = assembleBuild({ request: body, geometry, documentId: 'hut',
    trusted: F.trustedFixtureFacts() });
  validateType('BuildProjection', build);
  const witness = build.witnesses.find(w => w.predicate === 'ENTRANCE_CONNECTIVITY');
  assert.equal(witness.witnessId, 'w5-front');
  assert.equal(JSON.stringify(witness.facts.avatarDimensions), JSON.stringify(body.safetyProfile.avatarDimensions));
  const hazard = build.witnesses.find(w => w.predicate === 'HAZARD');
  assert.ok(hazard.facts.positions.length > geometry.effects.length);
  assert.equal(validateWitnessCoherence({ build, finalEffects, targetFacts: body.targetFacts,
    safetyProfile: body.safetyProfile, catalogue: body.catalogue }).coherent, true);
});

test('roofless walls are open sky, not an interior (CONTRACT_RULES: 天空不冒充室内)', async () => {
  const body = F.entranceRequest();
  assert.equal(outcome(() => planEntrances({ request: body, geometry: geometryFor(body, F.hut({ roof: false })) })),
    'BUILD_INVALID/INVALID_GEOMETRY');
  const response = await painter(F.hut({ roof: false })).call('CreateBuildPlan', F.entranceRequest());
  assert.deepEqual([response.error.code, response.error.reason], ['BUILD_INVALID', 'INVALID_GEOMETRY']);
});

test('a cavity that leaks through an unsealed opening or an unknown cell is not interior', () => {
  // the portal plane covers only the lower door cell; the upper door cell leaks outside
  const leaky = F.entranceRequest({ portals: [{ portalRef: 'front', positions: [[12, 1, 10]] }] });
  assert.equal(outcome(() => planEntrances({ request: leaky, geometry: geometryFor(leaky, F.hut()) })),
    'BUILD_INVALID/INVALID_GEOMETRY');
  // an unknown cell inside the hut means enclosure is not proven
  const unknown = F.entranceRequest({ unknown: [[13, 2, 13]] });
  assert.equal(outcome(() => planEntrances({ request: unknown, geometry: geometryFor(unknown, F.hut()) })),
    'BUILD_INVALID/INVALID_GEOMETRY');
});

test('passable non-air cells are neither empty use/path cells nor cavity sides (SPEC recheck at 43620dd)', async () => {
  const body = F.entranceRequest();
  // a non-colliding vine roof does not enclose: sky leaks through it
  assert.equal(outcome(() => planEntrances({ request: body, geometry: geometryFor(body, F.hut({ roofNode: 'fixture:vine' })) })),
    'BUILD_INVALID/INVALID_GEOMETRY');
  // a doorway filled with a passable non-air node is not an empty entrance path
  assert.equal(outcome(() => planEntrances({ request: body, geometry: geometryFor(body, F.hut({ doorNode: 'fixture:vine' })) })),
    'BUILD_INVALID/INVALID_GEOMETRY');
  // an existing occupied non-colliding node in the floor leaks to unsampled ground
  const plantFloor = F.entranceRequest({ groundNode: p => p[0] === 12 && p[2] === 12 ? 'fixture:vine' : 'fixture:stone' });
  assert.equal(outcome(() => planEntrances({ request: plantFloor, geometry: geometryFor(plantFloor, F.hut()) })),
    'BUILD_INVALID/INVALID_GEOMETRY');
  // the production path applies the same rule before assembly
  const response = await painter(F.hut({ roofNode: 'fixture:vine' })).call('CreateBuildPlan', F.entranceRequest());
  assert.deepEqual([response.error.code, response.error.reason], ['BUILD_INVALID', 'INVALID_GEOMETRY']);
});

test('entrance negatives: closed doorway, unknown portal, no confirmed portal, unconvertible avatar unit', () => {
  const closed = F.entranceRequest();
  assert.equal(outcome(() => planEntrances({ request: closed, geometry: geometryFor(closed, F.hut({ door: false })) })),
    'BUILD_INVALID/INVALID_GEOMETRY');
  const unknown = F.entranceRequest({ refs: ['back'] });
  assert.equal(outcome(() => planEntrances({ request: unknown, geometry: geometryFor(unknown, F.hut()) })),
    'TARGET_FACTS_INCOMPLETE/REQUIRED_FACT_UNKNOWN');
  const none = F.entranceRequest({ refs: [] });
  assert.equal(outcome(() => planEntrances({ request: none, geometry: geometryFor(none, F.hut()) })),
    'INTENT_UNCONFIRMED/REQUIRED_FACT_UNKNOWN');
  const meters = F.entranceRequest({ unit: 'meter' });
  assert.equal(outcome(() => planEntrances({ request: meters, geometry: geometryFor(meters, F.hut()) })),
    'TARGET_FACTS_INCOMPLETE/REQUIRED_FACT_UNKNOWN');
  const plain = F.request();
  assert.deepEqual(planEntrances({ request: plain, geometry: geometryFor(plain, F.CABIN) }), []);
});

test('production path decides entrance before assembly; model is told the portals', async () => {
  const closed = await painter(F.hut({ door: false })).call('CreateBuildPlan', F.entranceRequest());
  Painter.response('CreateBuildPlan', closed);
  assert.deepEqual([closed.error.code, closed.error.reason], ['BUILD_INVALID', 'INVALID_GEOMETRY']);
  const open = await painter(F.hut()).call('CreateBuildPlan', F.entranceRequest());
  // connected; still blocked only by CONTRACT_GAP-EXT-01/02
  assert.deepEqual([open.error.code, open.error.reason], ['TARGET_FACTS_INCOMPLETE', 'REQUIRED_FACT_UNKNOWN']);
  const text = promptText(F.entranceRequest());
  assert.match(text, /"entrance":\{"required":true,"avatarCells":\[1,2,1\],"portals":\[\{"portalRef":"front","cells":\[\[2,1,0\],\[2,2,0\]\]\}\]\}/);
  assert.match(text, /"nodeName":"air"/);
});

test('SPEC recheck counterexample at 94d763d (roofless walls, no ground, portal [12,0,10]) is refused', () => {
  const body = F.request({ facts: F.targetFacts({ occupied: [], unknown: [], max: [14, 2, 14],
    portals: [{ portalRef: 'front', positions: [[12, 0, 10]] }] }),
  safety: F.safetyProfile({ entrance: true }), entrancePortalRefs: ['front'] });
  const roofless = JSON.stringify({ decision: 'BUILD', materials: { wall: { nodeName: 'fixture:wood', param2: 0 },
    gap: { nodeName: 'air', param2: 0 } }, boxes: [
    { min: [0, 0, 0], max: [4, 1, 0], materialRef: 'wall' }, { min: [0, 0, 4], max: [4, 1, 4], materialRef: 'wall' },
    { min: [0, 0, 0], max: [0, 1, 4], materialRef: 'wall' }, { min: [4, 0, 0], max: [4, 1, 4], materialRef: 'wall' },
    { min: [2, 0, 0], max: [2, 1, 0], materialRef: 'gap' }] });
  assert.equal(outcome(() => planEntrances({ request: body, geometry: geometryFor(body, roofless) })),
    'BUILD_INVALID/INVALID_GEOMETRY');
});
