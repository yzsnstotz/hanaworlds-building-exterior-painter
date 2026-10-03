// FIXTURE: provider-side ContractHandshake (CONTRACT_RULES "Compatibility (rc.7)";
// closure row PA-09). The registered service must advertise exactly the admitted
// contracts@0.3.0 handshake, accepted by the contracts consumer check; a missing or
// incompatible advertisement must fail closed before any CreateBuildPlan request.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ContractError, checkContractHandshake, contractHandshake as admitted, validateType } from '#contracts';
import { apply, SERVICE, contractHandshake as exported } from '../src/index.mjs';
import * as F from './fixtures.mjs';
import * as R from './region-fixtures.mjs';

const PAINTER_REQUIREMENT = { wires: ['painter/v3'], factProfiles: ['target-facts/v3'] };
const compat = id => R.chain.compatibilityCases.find(c => c.id === id);

function registered() {
  const provided = new Map();
  apply({ get: () => undefined, provide: (name, value) => provided.set(name, value) }, {});
  return provided.get(SERVICE);
}

/** The consumer seam as Workshop performs it: read the advertisement from the
 * port, check it with contracts checkContractHandshake, and only then send. */
async function consumerSend(port, body) {
  const advertised = port.contractHandshake ?? port.handshake?.() ?? port.status?.().contractHandshake;
  if (!advertised) throw new ContractError('UNSUPPORTED_VERSION', 'decode', 'VERSION_UNSUPPORTED');
  checkContractHandshake(advertised, PAINTER_REQUIREMENT);
  return port.call('CreateBuildPlan', body);
}
const failsClosed = async (port, sent) => {
  await assert.rejects(consumerSend(port, F.request()), e => e instanceof ContractError &&
    e.code === 'UNSUPPORTED_VERSION' && e.phase === 'decode' && e.reason === 'VERSION_UNSUPPORTED');
  assert.equal(sent.length, 0);
};

test('registered painter service advertises exactly the admitted contracts@0.3.0 ContractHandshake', () => {
  const painter = registered();
  validateType('ContractHandshake', painter.contractHandshake);
  assert.equal(painter.contractHandshake, admitted);
  assert.equal(painter.handshake(), admitted);
  assert.equal(exported, admitted);
  // HS-V030-PAIR-MATCH: the approved 0.3.0 advertisement
  assert.deepEqual([...admitted.wireVersions].sort(), [...compat('HS-V030-PAIR-MATCH').advertised.wireVersions].sort());
  assert.deepEqual([...admitted.factProfiles].sort(), [...compat('HS-V030-PAIR-MATCH').advertised.factProfiles].sort());
  assert.equal(admitted.contracts, compat('HS-V030-PAIR-MATCH').advertised.contracts);
  assert.equal(admitted.compiledOperationsVersion, 'operations/v2');
  assert.equal(checkContractHandshake(painter.contractHandshake, PAINTER_REQUIREMENT).result, 'HANDSHAKE_VERSION_MATCH');
  // the advertisement cannot be rewritten through the service
  assert.throws(() => { painter.contractHandshake = { contracts: 'forged' }; }, TypeError);
  assert.ok(Object.isFrozen(painter.contractHandshake) && Object.isFrozen(painter.contractHandshake.wireVersions));
  // describe() is unchanged in shape and still has no handshake field
  assert.equal(Object.hasOwn(painter.describe(), 'contractHandshake'), false);
});

test('a consumer passes the handshake and then sends exactly one painter/v3 request', async () => {
  const painter = registered();
  const sent = [];
  const port = { contractHandshake: painter.contractHandshake, call: async (...args) => { sent.push(args); return null; } };
  await consumerSend(port, R.clone(R.approved.painterRequest));
  assert.equal(sent.length, 1);
});

test('missing or incompatible advertisement fails closed before any request (HS-MIXED-PAINTER-V2)', async () => {
  const sent = [];
  const call = async (...args) => { sent.push(args); return null; };
  // missing advertisement (the 0.2.0 admitted revision 8220f21 / 0.1.0 a3156fc shape)
  await failsClosed({ call, describe: () => ({ wire: 'painter/v3' }) }, sent);
  // approved incompatible peer: painter/v2 on contracts@0.2.1, target-facts/v2 only
  await failsClosed({ contractHandshake: compat('HS-MIXED-PAINTER-V2').advertised, call }, sent);
  // a 0.3.0-shaped advertisement lacking target-facts/v3
  await failsClosed({ contractHandshake: { ...admitted, factProfiles: ['target-facts/v2'] }, call }, sent);
  // a malformed advertisement is a schema rejection, still before any request
  await assert.rejects(consumerSend({ contractHandshake: { contracts: 'x' }, call }, F.request()),
    e => e instanceof ContractError && e.phase === 'decode');
  assert.equal(sent.length, 0);
  assert.equal(compat('HS-MIXED-PAINTER-V2').expected.code, 'UNSUPPORTED_VERSION');
});
