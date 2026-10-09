// Actual source/installed Painter, public contract fixture and external business port.
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = process.env.PAINTER_TEST_PACKAGE ?? resolve(new URL('..', import.meta.url).pathname);
const { contracts: api, contractFixture } = await import(pathToFileURL(resolve(root, 'src/contract-package.mjs')));
const { ExteriorPainterV2, DEFAULT_ROUTE } = await import(pathToFileURL(resolve(root, 'src/index.mjs')));
const fixture = contractFixture('main');
const op = 'ValidateBuildProposal';
const clone = structuredClone;
function setup(change) {
  const request = clone(fixture.request), state = { reads: 0, facts: clone(fixture.facts) };
  const localFacts = { async read(body, operation) {
    assert.equal(operation, op); assert.equal(api.canonicalJSON(body), api.canonicalJSON(request));
    state.reads++; if (change) await change(state); return clone(state.facts);
  }};
  const forbidden = new Proxy({}, { get() { throw new Error('text entry read model/media'); } });
  return { request, state, painter: new ExteriorPainterV2({ localFacts, llm: forbidden, attachments: forbidden }) };
}
async function rejected(f, code, request = f.request, options) {
  const r = await f.painter.call(op, request, options);
  assert.equal(r.result, null); assert.equal(r.error.code, code);
  assert.equal(r.error.mutationState, 'NONE'); assert.equal(r.error.transactionRef, null);
}
test('current root handshake and text BUILD/V4, raw admission and three retained witnesses', async () => {
  const f = setup(); api.checkBuildProposalHandshake(f.painter.handshake());
  assert.deepEqual(DEFAULT_ROUTE, { provider: 'openai-codex', model: 'gpt-5.6-luna' });
  const response = await f.painter.call(op, JSON.stringify(f.request));
  assert.equal(response.error, null); api.validateBuildProposalResponse(f.request, response);
  assert.equal(api.canonicalJSON(response), api.canonicalJSON(fixture.response)); assert.equal(f.state.reads, 2);
  assert.deepEqual(response.result.build.witnesses.map(w => w.predicate), ['COVERAGE','BODY_CLEARANCE','HAZARD']);
  assert.equal(f.painter.describe().worldWrites, 0);
});
test('wrong live world and reopened connection reject before releasing BUILD', async () => {
  for (const field of ['worldRef','connectionIncarnationRef']) {
    const f = setup(s => { s.facts.requestFacts.currentContext[field] = 'changed'; });
    await rejected(f, 'CURRENT_WORLD_MISMATCH');
  }
});
test('late brief change and business cancellation reject after facts await', async () => {
  for (const [change, code] of [
    [s => s.facts.currentContext.referenceBrief.briefRevision = 'changed', 'TARGET_FACTS_STALE'],
    [s => s.facts.requestFacts.requestState = 'CANCELLED', 'REQUEST_CANCELLED'],
  ]) {
    const f = setup(s => { if (s.reads === 2) change(s); }); await rejected(f, code);
  }
  const abort = new AbortController(), f = setup(s => { if (s.reads === 2) abort.abort(); });
  await rejected(f, 'REQUEST_CANCELLED', f.request, { signal: abort.signal });
});
test('no default local facts or request/call-options facts injection', async () => {
  const f = setup(), p = new ExteriorPainterV2();
  await rejected({ ...f, painter: p }, 'CAPABILITY_UNAVAILABLE', f.request, { providerFacts: fixture.facts });
  await rejected(f, 'UNKNOWN_REQUIRED_FIELD', { ...f.request, authorizationRef: 'old' });
});
test('new public geometry/bad-param admission; player body geometry is no longer an input', async () => {
  const f = setup(); f.request.proposal.materials.stone.param2 = 256;
  await rejected(f, 'SCHEMA_INVALID'); assert.equal(f.state.reads, 0);
  const outside = setup(); outside.request.proposal.boxes[0].max[0] = 2;
  await rejected(outside, 'BUILD_INVALID');
  const body = setup(); body.request.regionInspection.bodyOccupiedPositions = [[0,1,3]];
  await rejected(body, 'UNKNOWN_REQUIRED_FIELD'); assert.equal(body.state.reads, 0);
});
