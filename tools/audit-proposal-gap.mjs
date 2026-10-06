// Read-only public-decoder proof. Business identities/facts/proposal are fixtures.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
const consumer = process.argv[2];
const require = createRequire(resolve(consumer, 'package.json'));
const publicEntry = require.resolve('hanaworlds-contracts/v4');
const { validateRequest, admitRequest, operationContracts, version } = await import(pathToFileURL(publicEntry));
assert.equal(version, '0.3.9');
const root = dirname(dirname(dirname(publicEntry)));
const fixture = JSON.parse(readFileSync(resolve(root, 'fixtures/v4/candidate/placement-region-chain-v4.json')));
const request = fixture.validCases.find(c => c.id === 'PLACE-LUANTI-INITIATOR-CHAIN').materializedChain.painterRequest;
validateRequest('painter/v3', 'CreateBuildPlan', request);
const proposal = { decision: 'BUILD', materials: { stone: { nodeName: 'fixture:stone', param2: 0 } }, boxes: [{ min: [0,1,0], max: [0,1,0], materialRef: 'stone' }] };
const results = [];
for (const [id, call] of [
 ['decoded-proposal-field', () => validateRequest('painter/v3', 'CreateBuildPlan', { ...request, proposal })],
 ['raw-proposal-field', () => admitRequest('painter/v3', 'CreateBuildPlan', new TextEncoder().encode(JSON.stringify({ ...request, proposal })))],
 ['missing-public-operation', () => validateRequest('painter/v3', 'ValidateBuildProposal', request)],
]) {
 let error;
 try { call(); } catch (e) { error = e; }
 assert.ok(error);
 assert.equal(error.code, id === 'missing-public-operation' ? 'UNSUPPORTED_OPERATION' : 'UNKNOWN_REQUIRED_FIELD');
 assert.equal(error.publicError.mutationState, 'NONE');
 results.push({ id, error: error.publicError });
}
console.log(JSON.stringify({ publicEntry, version, baselineAdmitted: true, painterOperations: operationContracts['painter/v3'], results, evidence: 'ACTUAL_PACKAGE_PUBLIC_DECODER + FIXTURE; no model/world' }, null, 2));
