// FIXTURE: ENTRANCE_CONNECTIVITY (EXTERIOR-ENTRANCE-001) recomputed from bound facts.
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateType, validateWitnessCoherence } from '#contracts';
import * as Painter from '#contracts/painter/v2';
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
  assert.deepEqual(entrance.path, [[12, 0, 10], [12, 0, 11]]);
  const usable = new Set(entrance.usablePositions.map(p => p.join(',')));
  for (const p of entrance.path) assert.ok(usable.has(p.join(',')));
  // wall cells and cells without 2-high clearance are not usable
  assert.ok(!usable.has('10,0,10') && !usable.has('12,2,12'));
});

test('FIXTURE: assembled BUILD with entrance witness passes schema, domain path rules and witness coherence', () => {
  const body = F.entranceRequest();
  const geometry = geometryFor(body, F.hut());
  const { build, finalEffects } = assembleBuild({ request: body, geometry, documentId: 'hut',
    trusted: F.trustedFixtureFacts() });
  validateType('BuildProjection', build);
  const witness = build.witnesses.find(w => w.predicate === 'ENTRANCE_CONNECTIVITY');
  assert.equal(witness.witnessId, 'w5-entrance-front');
  assert.equal(JSON.stringify(witness.facts.avatarDimensions), JSON.stringify(body.safetyProfile.avatarDimensions));
  const hazard = build.witnesses.find(w => w.predicate === 'HAZARD');
  assert.ok(hazard.facts.positions.length > geometry.effects.length);
  assert.equal(validateWitnessCoherence({ build, finalEffects, targetFacts: body.targetFacts,
    safetyProfile: body.safetyProfile, catalogue: body.catalogue }).coherent, true);
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
  assert.match(text, /"entrance":\{"required":true,"avatarCells":\[1,2,1\],"portals":\[\{"portalRef":"front","cells":\[\[2,0,0\]\]\}\]\}/);
  assert.match(text, /"nodeName":"air"/);
});
