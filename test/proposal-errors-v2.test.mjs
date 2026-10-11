import test from 'node:test';
import assert from 'node:assert/strict';
import { ExteriorPainterV2 } from '../src/index.mjs';
import { contractFixture, contracts as api } from '../src/contract-package.mjs';
import { mockFacts } from '../examples/mock-facts.mjs';
const main = contractFixture('main');
const digest = (kind, value) => api.digestValue(kind, value).sha256;
test('ValidateBuildProposal returns every card-required v2 refusal in its public envelope', async () => {
  const cases = [
    ['SAFETY_INVARIANT_FAILED', r => {
      r.catalogue.materials['fixture:stone'].hazardPerSecond = 1;
      r.targetFacts.catalogueDigest = digest('catalogue', r.catalogue);
      r.targetFactsDigest = digest('target-facts', r.targetFacts);
      r.regionInspection.targetFacts = structuredClone(r.targetFacts);
      r.regionInspection.targetFactsDigest = r.targetFactsDigest;
    }],
    ['INTENT_UNCONFIRMED', r => {
      r.intent.confirmedIntent.confirmedTurnRevision = 'unconfirmed-turn';
      r.intentDigest = digest('intent', r.intent);
    }],
    ['TARGET_FACTS_STALE', () => {}, mock => { mock.state.buildFacts.currentContext.referenceBrief.briefRevision = 'stale'; }],
    ['SCHEMA_INVALID', r => { r.proposal.materials.stone.orientation = -1; }],
    ['CAPABILITY_UNAVAILABLE', () => {}, null],
  ];
  for (const [code, edit, mutate] of cases) {
    const request = structuredClone(main.request); edit(request);
    const facts = structuredClone(main.facts);
    facts.sourceContext = Object.fromEntries(Object.keys(facts.sourceContext).map(k => [k, structuredClone(request[k])]));
    facts.currentContext = structuredClone(facts.sourceContext);
    const mock = mockFacts({ buildFacts: facts });
    if (mutate) mutate(mock);
    for (const raw of [request, JSON.stringify(request), new TextEncoder().encode(JSON.stringify(request))]) {
      const painter = new ExteriorPainterV2({ localFacts: mutate === null ? undefined : mock.port });
      const response = await painter.call('ValidateBuildProposal', raw);
      assert.equal(response.requestId, request.requestId);
      assert.equal(response.result, null, code);
      assert.equal(response.error.code, code);
      assert.equal(response.error.mutationState, 'NONE');
      assert.equal(response.error.transactionRef, null);
      api.validateResponse('painter/v6', 'ValidateBuildProposal', response);
      assert.equal(painter.describe().modelCalls, 0);
      assert.equal(painter.describe().worldWrites, 0);
    }
  }
});
