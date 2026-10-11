// Current proposal-producer advertisement; no old consumer compatibility lane.
import test from 'node:test';
import assert from 'node:assert/strict';
import { contractHandshake as admitted, checkBuildProposalHandshake } from '#contracts';
import { apply, SERVICE, contractHandshake as exported } from '../src/index.mjs';
function registered(){const services=new Map();apply({get:()=>undefined,provide:(k,v)=>services.set(k,v)},{});return services.get(SERVICE);}
test('registered producer advertises exactly current admitted0.3.10 and new operation',()=>{
 const p=registered();assert.equal(p.contractHandshake,admitted);assert.equal(p.handshake(),admitted);assert.equal(exported,admitted);
 assert.equal(admitted.contracts,'hanaworlds-contracts@0.3.10');assert.equal(checkBuildProposalHandshake(p.handshake()).result,'HANDSHAKE_OPERATION_MATCH');
 assert.ok(p.describe().operations.includes('ValidateBuildProposal'));assert.throws(()=>p.contractHandshake={},TypeError);
});
test('current feature requires exact package and region facts advertisement',()=>{
 for(const peer of [{...admitted,contracts:'hanaworlds-contracts@0.3.9'},{...admitted,factProfiles:['target-facts/v2']},{...admitted,wireVersions:admitted.wireVersions.filter(x=>x!=='painter/v3')}])
 assert.throws(()=>checkBuildProposalHandshake(peer),e=>e.code==='UNSUPPORTED_VERSION');
});
