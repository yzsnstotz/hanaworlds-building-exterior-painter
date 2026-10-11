import test from 'node:test';
import assert from 'node:assert/strict';
import { Painter as runtime } from './painter-under-test.mjs';
const { ExteriorPainterV2 } = runtime;
import { contractFixture, contracts } from '../tools/contract-package.mjs';
test('facts provider error is consumed by public protocol across independent SDK constructors', async () => {
 const error = new Error('foreign provider');
 Object.defineProperty(error, 'publicError', { value: structuredClone(new contracts.ContractError('CAPABILITY_UNAVAILABLE', 'validate', 'POLICY_UNAVAILABLE').publicError) });
 for (const [operation, request] of [['ValidateBuildProposal', contractFixture('main').request], ['ValidateRegionProposal', contractFixture('region').proposalRequest]]) {
  const painter = new ExteriorPainterV2({ localFacts: { read: async () => { throw error; } } });
  const response = await painter.call(operation, request);
  assert.equal(contracts.canonicalJSON(response.error), contracts.canonicalJSON(error.publicError));
  contracts.validateResponse(response.contractVersion, operation, response);
 }
});

test('facts provider malformed or opaque failures are not rewritten as contract refusals', async () => {
 const opaque = new Error('opaque provider');
 const malformed = Object.assign(new Error('malformed public protocol'), { publicError: { code: 'CAPABILITY_UNAVAILABLE' } });
 const accessor = new Error('accessor provider');
 Object.defineProperty(accessor, 'publicError', { get() { throw new Error('getter must not run'); } });
 for (const error of [opaque, malformed, accessor]) {
  for (const [op, request] of [['ValidateBuildProposal', contractFixture('main').request], ['ValidateRegionProposal', contractFixture('region').proposalRequest]]) {
   const painter = new runtime.ExteriorPainterV2({ localFacts: { read: async () => { throw error; } } });
   await assert.rejects(painter.call(op, request), e => e === error);
  }
 }
});
