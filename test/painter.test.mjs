// FIXTURE conformance and negative cases for painter/v2 picture-blocks.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  ContractError, validateType, validateWitnessCoherence, digestValue,
} from '#contracts';
import * as Painter from '#contracts/painter/v2';
import * as Build from '#contracts/BUILD/V2';
import { ExteriorPainterV2, PainterHostError, planGeometry, assembleBuild, parseProposal } from '../src/index.mjs';
import * as F from './fixtures.mjs';

const painter = (over = {}) => new ExteriorPainterV2({ authority: F.authority(), llm: F.llm(),
  attachments: F.attachments(), ...over });
const wireRequest = async id => JSON.parse(await readFile(new URL('../vendor/hanaworlds-contracts/fixtures/candidate/wire-inputs.json', import.meta.url), 'utf8'))
  .requests.find(r => r.id === id).request;
const errorOf = response => { assert.equal(response.result, null); return response.error; };

test('BUILD proposal is validated, then refused only for missing trusted frame/evidence (CONTRACT_GAP-EXT-01/02)', async () => {
  const model = F.llm();
  const response = await painter({ llm: model }).call('CreateBuildPlan', F.request());
  Painter.response('CreateBuildPlan', response);
  assert.deepEqual(errorOf(response), { code: 'TARGET_FACTS_INCOMPLETE', phase: 'validate',
    retryability: 'AFTER_NEW_FACTS', mutationState: 'NONE', transactionRef: null, causeCode: null,
    reason: 'REQUIRED_FACT_UNKNOWN' });
  assert.equal(model.requests.length, 1);
});

test('image and text go together through the host model route by durable attachment reference', async () => {
  const model = F.llm();
  await painter({ llm: model }).call('CreateBuildPlan', F.request());
  const [options] = model.requests;
  assert.equal(options.provider, 'codex-oauth');
  assert.equal(options.model, 'gpt-5.6-luna');
  assert.equal(options.messages.length, 1);
  const content = options.messages[0].content;
  assert.equal(content[0].type, 'text');
  assert.match(content[0].text, /照这张图搭一个小木屋/);
  assert.deepEqual(content[1], { type: 'image', attachment: { attachmentId: `sha256:${F.IMAGE_SHA}`,
    mediaType: 'image/png', bytes: 2048, width: 64, height: 48 } });
  // No image bytes or base64 in any text sent to the model.
  const visible = JSON.stringify(options);
  assert.doesNotMatch(visible, /base64|data:image/);
});

test('FIXTURE: with trusted facts the assembled BUILD/V2 is schema-valid, witness-coherent and a valid painter response', async () => {
  const body = F.request();
  const proposal = parseProposal(F.CABIN);
  const geometry = planGeometry({ proposal, catalogue: body.catalogue, targetFacts: body.targetFacts });
  assert.equal(geometry.effects.length, 18);
  const { build, buildDigest, finalEffects } = assembleBuild({ request: body, geometry,
    documentId: 'exterior-fixture', trusted: F.trustedFixtureFacts() });
  validateType('BuildProjection', build);
  assert.deepEqual(validateWitnessCoherence({ build, finalEffects, targetFacts: body.targetFacts,
    safetyProfile: body.safetyProfile, catalogue: body.catalogue }),
  { coherent: true, authenticityVerified: false, providerAuthorization: 'NOT_RUN', worldWrites: 0 });
  assert.equal(buildDigest, digestValue('build', build).sha256);
  Painter.response('CreateBuildPlan', { contractVersion: 'painter/v2', requestId: body.requestId,
    result: { invocationId: body.invocationId, build, buildDigest }, error: null });
  // Brush-side BUILD/V2 request shape accepts the same projection.
  const wire = await wireRequest('WIRE-BUILD-V2');
  Build.validate('BuildDocument', { ...wire, worldRef: body.worldRef, build, buildDigest,
    catalogue: body.catalogue, catalogueDigest: build.catalogueDigest, targetFacts: body.targetFacts,
    targetFactsDigest: body.targetFactsDigest, safetyProfile: body.safetyProfile,
    safetyProfileDigest: body.safetyProfileDigest });
});

test('FIXTURE: trusted frame digest mismatch, protected or body-occupied cells are refused', () => {
  const body = F.request();
  const geometry = planGeometry({ proposal: parseProposal(F.CABIN), catalogue: body.catalogue, targetFacts: body.targetFacts });
  const base = F.trustedFixtureFacts();
  const code = trusted => { try { assembleBuild({ request: body, geometry, documentId: 'd', trusted }); }
    catch (e) { return `${e.code}/${e.reason}`; } return 'OK'; };
  assert.equal(code({ ...base, frame: { ...base.frame, frameId: 'other' } }), 'TARGET_FACTS_STALE/REVISION_CHANGED');
  assert.equal(code({ ...base, protection: { protectedPositions: [[10, 0, 10]] } }), 'PERMISSION_DENIED/SCOPE_DENIED');
  assert.equal(code({ ...base, body: { bodyOccupiedPositions: [[10, 1, 10]] } }), 'BUILD_INVALID/INVALID_GEOMETRY');
  assert.equal(code(null), 'TARGET_FACTS_INCOMPLETE/REQUIRED_FACT_UNKNOWN');
});

test('model clarification becomes a contract ClarificationNeed for the same Session turn', async () => {
  const question = '图片里是两层还是一层？请补充说明。';
  const model = F.llm({ answers: [JSON.stringify({ decision: 'CLARIFY',
    clarification: { code: 'AMBIGUOUS_GEOMETRY', question } })] });
  const response = await painter({ llm: model }).call('CreateBuildPlan', F.request());
  const need = Painter.response('CreateBuildPlan', response);
  assert.equal(need.code, 'AMBIGUOUS_GEOMETRY');
  assert.equal(need.question, question);
  assert.equal(need.sessionRef, 'fixture-session');
  assert.equal(need.turnRevision, 'fixture-turn-1');
  assert.equal(need.invocationId, 'fixture-invocation-1');
  assert.match(need.clarificationId, /^clarify-[0-9a-f]{32}$/);
});

test('structure intent without an image is IMAGE_REQUIRED and never reaches the model', async () => {
  const model = F.llm();
  const response = await painter({ llm: model }).call('CreateBuildPlan', F.request({ briefOptions: { media: false } }));
  assert.equal(errorOf(response).code, 'IMAGE_REQUIRED');
  assert.equal(model.requests.length, 0);
});

test('structure intent without text is INTENT_UNCONFIRMED and never reaches the model', async () => {
  const model = F.llm();
  const response = await painter({ llm: model }).call('CreateBuildPlan',
    F.request({ briefOptions: { text: '   ' }, confirmedText: '   ' }));
  assert.equal(errorOf(response).code, 'INTENT_UNCONFIRMED');
  assert.equal(model.requests.length, 0);
});

test('non-structure intent, unconfirmed turn and other-world intent are INTENT_UNCONFIRMED', async () => {
  for (const body of [F.request({ kind: 'MODIFY_INTERIOR' }),
    F.request({ patch: { turnRevision: 'fixture-turn-2' } }),
    F.request({ patch: { worldRef: 'other-world' } })]) {
    const response = await painter().call('CreateBuildPlan', body);
    assert.equal(errorOf(response).code, 'INTENT_UNCONFIRMED');
  }
});

test('interior painterId is an ownership violation for this painter', async () => {
  const response = await painter().call('CreateBuildPlan', F.request({ patch: { painterId: 'interior' } }));
  assert.deepEqual([errorOf(response).code, errorOf(response).reason], ['PERMISSION_DENIED', 'OWNERSHIP_VIOLATION']);
});

test('media binding not addressed by its stored digest is refused before the model', async () => {
  const body = F.request();
  const b = structuredClone(body.referenceBrief);
  b.media[0].attachmentRef = 'sha256:' + 'f'.repeat(64);
  const patched = F.request();
  const bDigest = digestValue('reference-brief', b).sha256;
  const intent = { ...patched.intent, referenceBriefDigest: bDigest };
  const response = await painter().call('CreateBuildPlan', { ...patched, referenceBrief: b,
    referenceBriefDigest: bDigest, intent, intentDigest: digestValue('intent', intent).sha256 });
  assert.deepEqual([errorOf(response).code, errorOf(response).reason], ['IMAGE_REQUIRED', 'MEDIA_CORRUPT']);
});

test('carried digests must bind their projections', async () => {
  const cases = [['intentDigest', 'INTENT_UNCONFIRMED'], ['referenceBriefDigest', 'INTENT_UNCONFIRMED'],
    ['targetFactsDigest', 'TARGET_FACTS_STALE'], ['safetyProfileDigest', 'TARGET_FACTS_STALE']];
  for (const [field, code] of cases) {
    const response = await painter().call('CreateBuildPlan', F.request({ patch: { [field]: 'a'.repeat(64) } }));
    assert.deepEqual([errorOf(response).code, errorOf(response).reason], [code, 'PAYLOAD_CHANGED'], field);
  }
});

test('stale inspected target and catalogue mismatch are TARGET_FACTS_STALE', async () => {
  const stale = await painter({ authority: F.authority({ worldRevision: 'fixture-world-2' }) })
    .call('CreateBuildPlan', F.request());
  assert.equal(errorOf(stale).code, 'TARGET_FACTS_STALE');
  const body = F.request();
  const cat = structuredClone(body.catalogue); cat.gameRevision = 'fixture-game-2';
  const mismatch = await painter().call('CreateBuildPlan', { ...body, catalogue: cat });
  assert.equal(errorOf(mismatch).code, 'TARGET_FACTS_STALE');
});

test('authorization: absent verifier, revoked grant and missing action fail before replay or model', async () => {
  const model = F.llm();
  const absent = await new ExteriorPainterV2({ llm: model, attachments: F.attachments() }).call('CreateBuildPlan', F.request());
  assert.deepEqual([errorOf(absent).code, errorOf(absent).reason], ['PERMISSION_DENIED', 'IDENTITY_UNVERIFIED']);
  const revoked = await painter({ llm: model, authority: F.authority({ current: false }) }).call('CreateBuildPlan', F.request());
  assert.equal(errorOf(revoked).code, 'AUTHORIZATION_REVOKED');
  const scope = await painter({ llm: model, authority: F.authority({ allowed: ['ListObjects'] }) }).call('CreateBuildPlan', F.request());
  assert.deepEqual([errorOf(scope).code, errorOf(scope).reason], ['PERMISSION_DENIED', 'SCOPE_DENIED']);
  assert.equal(model.requests.length, 0);
});

test('replay: same payload returns the original response once; changed payload is REPLAY_MISMATCH; revocation precedes replay', async () => {
  const model = F.llm({ answers: [JSON.stringify({ decision: 'CLARIFY',
    clarification: { code: 'AMBIGUOUS_INTENT', question: '要几层？' } })] });
  const auth = F.authority();
  const p = painter({ llm: model, authority: auth });
  const first = await p.call('CreateBuildPlan', F.request());
  const second = await p.call('CreateBuildPlan', F.request());
  assert.deepEqual(second, first);
  assert.equal(model.requests.length, 1);
  const changed = await p.call('CreateBuildPlan', F.request({ patch: { invocationId: 'fixture-invocation-2' } }));
  assert.deepEqual([errorOf(changed).code, errorOf(changed).phase], ['REPLAY_MISMATCH', 'replay']);
  auth.state.current = false;
  const revoked = await p.call('CreateBuildPlan', F.request());
  assert.equal(errorOf(revoked).code, 'AUTHORIZATION_REVOKED');
});

test('text-only route, absent model or attachment service are host errors, never a degraded request', async () => {
  const textOnly = F.llm({ modalities: ['text'] });
  await assert.rejects(painter({ llm: textOnly }).call('CreateBuildPlan', F.request()),
    e => e instanceof PainterHostError && e.publicError.code === 'MODEL_UNAVAILABLE' && e.hostCode === 'ROUTE_NOT_IMAGE_CAPABLE');
  assert.equal(textOnly.requests.length, 0);
  await assert.rejects(painter({ llm: undefined }).call('CreateBuildPlan', F.request()),
    e => e instanceof PainterHostError && e.hostCode === 'LLM_SERVICE_ABSENT');
  await assert.rejects(painter({ attachments: undefined }).call('CreateBuildPlan', F.request()),
    e => e instanceof PainterHostError && e.hostCode === 'ATTACHMENT_SERVICE_ABSENT');
});

test('model request failure is surfaced with its stable host code and not recorded for replay', async () => {
  const failing = F.llm({ finish: { kind: 'error', failure: { code: 'AUTH' } } });
  const p = painter({ llm: failing });
  await assert.rejects(p.call('CreateBuildPlan', F.request()),
    e => e instanceof PainterHostError && e.publicError.code === 'MODEL_REQUEST_FAILED' && e.hostCode === 'AUTH');
  await assert.rejects(p.call('CreateBuildPlan', F.request()), PainterHostError);
  assert.equal(failing.requests.length, 2);
});

test('missing or corrupt Core attachment at dispatch is IMAGE_REQUIRED', async () => {
  for (const [hostCode, reason] of [['ATTACHMENT_NOT_FOUND', 'MEDIA_NOT_REFERENCED'], ['ATTACHMENT_CORRUPT', 'MEDIA_CORRUPT']]) {
    const response = await painter({ llm: F.llm({ finish: { kind: 'error', failure: { code: hostCode } } }) })
      .call('CreateBuildPlan', F.request());
    assert.deepEqual([errorOf(response).code, errorOf(response).reason], ['IMAGE_REQUIRED', reason]);
  }
});

test('invalid model proposals never become a guessed BUILD', async () => {
  const build = (boxes, materials = { m: { nodeName: 'fixture:wood', param2: 0 } }) =>
    JSON.stringify({ decision: 'BUILD', materials, boxes });
  const cases = [
    ['not json', 'BUILD_INVALID'],
    [JSON.stringify({ decision: 'BUILD', materials: {}, boxes: [], extra: 1 }), 'BUILD_INVALID'],
    [build([{ min: [3, 0, 3], max: [3, 0, 3], materialRef: 'm' }]), 'BUILD_INVALID'], // occupied cell
    [build([{ min: [0, 0, 0], max: [4, 0, 0], materialRef: 'm' }]), 'BUILD_INVALID'], // outside region
    [build([{ min: [3, 2, 3], max: [3, 2, 3], materialRef: 'm' }]), 'TARGET_FACTS_INCOMPLETE'], // unknown cell
    [build([{ min: [0, 0, 0], max: [0, 0, 0], materialRef: 'm' }], { m: { nodeName: 'fixture:marble', param2: 0 } }), 'UNSUPPORTED_MATERIAL'],
    [build([{ min: [0, 0, 0], max: [0, 0, 0], materialRef: 'm' }], { m: { nodeName: 'fixture:chest', param2: 0 } }), 'UNSUPPORTED_MATERIAL'],
    [build([{ min: [0, 0, 0], max: [0, 0, 0], materialRef: 'm' }], { m: { nodeName: 'fixture:wood', param2: 3 } }), 'UNSUPPORTED_MATERIAL'],
    [build([{ min: [0, 0, 0], max: [0, 0, 0], materialRef: 'other' }]), 'UNSUPPORTED_MATERIAL'],
  ];
  for (const [answer, code] of cases) {
    const response = await painter({ llm: F.llm({ answers: [answer] }) }).call('CreateBuildPlan', F.request());
    assert.equal(errorOf(response).code, code, answer);
  }
});

test('strict raw admission: unknown field, wrong version, duplicate decoded key (PA-01/PA-07/PA-09)', async () => {
  const unknown = await painter().call('CreateBuildPlan', { ...F.request(), unexpectedAuthority: true });
  assert.deepEqual([errorOf(unknown).code, errorOf(unknown).phase], ['UNKNOWN_REQUIRED_FIELD', 'decode']);
  const v1 = await painter().call('CreateBuildPlan', { ...F.request(), contractVersion: 'painter/v1' });
  assert.ok(['UNSUPPORTED_VERSION', 'SCHEMA_INVALID'].includes(errorOf(v1).code));
  await assert.rejects(painter().call('CreateBuildPlan', '{"actorRef":"A","\\u0061ctorRef":"B"}'),
    e => e instanceof ContractError && e.code === 'NON_CANONICAL_AMBIGUITY' && e.reason === 'DUPLICATE_DECODED_KEY');
  const raw = new TextEncoder().encode(JSON.stringify(F.request()));
  const viaBytes = await painter().call('CreateBuildPlan', raw);
  assert.equal(errorOf(viaBytes).code, 'TARGET_FACTS_INCOMPLETE');
});

test('contracts WIRE-painter-v2 fixture admits and is evaluated by this provider (zero world writes)', async () => {
  const wire = await wireRequest('WIRE-painter-v2');
  Painter.validate('CreateBuildPlan', wire);
  const response = await painter().call('CreateBuildPlan', wire);
  // Fixture attachmentRef is not a Core content address: refused before the model.
  assert.deepEqual([errorOf(response).code, errorOf(response).reason], ['IMAGE_REQUIRED', 'MEDIA_CORRUPT']);
});

test('public errors never project input values', async () => {
  const response = await painter({ llm: F.llm({ answers: ['secret-model-text {'] }) }).call('CreateBuildPlan', F.request());
  assert.deepEqual(Object.keys(response.error).sort(),
    ['causeCode', 'code', 'mutationState', 'phase', 'reason', 'retryability', 'transactionRef']);
  assert.doesNotMatch(JSON.stringify(response), /secret-model-text|照这张图/);
});
