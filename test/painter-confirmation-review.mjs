import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import { doc,runtime,registerCase,encodings } from './painter-review-harness.mjs';
import {baselineDoc,assertShape} from './painter-document-oracle.mjs';
import {canonical,v5Digest} from './painter-intent-versions-review.mjs';
const supply=JSON.parse(readFileSync(new URL('../../pm-supply/Q-241/WORKSHOP-V6-CARRIER-SUPPLY.json',import.meta.url)));
const requests=JSON.parse(readFileSync(new URL('../../pm-supply/Q-241/WORKSHOP-COMPLETE-REQUESTS.json',import.meta.url)));
const digest=(version,kind,value)=>createHash('sha256').update(Buffer.from(doc.versionCompatibility.digestDomains['v'+version][kind]+canonical(value),'utf8')).digest('hex');
const success=operation=>doc.confirmationCases.find(r=>r.operation===operation&&r.id.endsWith('-v6-success'));
test('Q241 own v6 closure follows complete carried supply; original v5 and error grammar preserved',()=>{
 assert.equal(supply.status,'WORKSHOP_AUTHOR_CANDIDATE_NOT_FORMAL_NOT_APPROVED_NOT_RUNTIME_PROOF');
 const renamed=value=>Array.isArray(value)?value.map(renamed):value!==null&&typeof value==='object'?
  Object.fromEntries(Object.entries(value).map(([k,v])=>[k,k==='$ref'?v+'V6':renamed(v)])):value;
 for(const [name,schema] of Object.entries(supply.definitions))assert.deepEqual(doc.definitions[name+'V6'],renamed(schema));
 assert.deepEqual(doc.legacyDefinitions,baselineDoc.definitions);
 assert.deepEqual(doc.definitions.LocalRequestFacts,baselineDoc.definitions.LocalRequestFacts);
 assert.deepEqual(doc.operationErrors,baselineDoc.operationErrors);
 assert.deepEqual(doc.formalErrors,baselineDoc.formalErrors);
 for(const name of ['ValidateBuildProposalError','ValidateRegionProposalError','SourcePublicError'])
  assert.deepEqual(doc.definitions[name],baselineDoc.definitions[name]);
 for(const [kind,data] of Object.entries(supply.digestSemantics))
  assert.equal(doc.versionCompatibility.digestDomains.v6[kind],data.domain);
 assert.deepEqual(doc.versionCompatibility.allowed,[{intent:'session/v5',referenceBrief:'ReferenceBrief/v5'},{intent:'session/v6',referenceBrief:'ReferenceBrief/v6'}]);
 assert.deepEqual(doc.exports,baselineDoc.exports);
 assert.deepEqual(doc.consumption,baselineDoc.consumption);
 assert.deepEqual(doc.authorizationEvidence,[]);
});
test('full v6 requests retain carried values and independently match exact new byte domains',()=>{
 for(const provided of requests.cases){
  const row=success(provided.operation);assert.ok(row);
  const {confirmation,...request}=row.request;
  assert.deepEqual(request,provided.proposedRequest);
  assertShape(row.requestType,row.request);assertShape(row.factsType,row.facts);
  for(const kind of ['intent','reference-brief']){
   const value=kind==='intent'?request.intent:request.referenceBrief;
   const expected=kind==='intent'?request.intentDigest:request.referenceBriefDigest;
   assert.equal(digest(6,kind,value),expected);
   assert.notEqual(v5Digest(kind,value),expected,'v6 is never silently hashed in the v5 domain');
  }
  assert.deepEqual(confirmation.intent,request.intent);assert.deepEqual(confirmation.referenceBrief,request.referenceBrief);
  assert.equal(confirmation.intentDigest,request.intentDigest);assert.equal(confirmation.referenceBriefDigest,request.referenceBriefDigest);
  assert.deepEqual(confirmation.authorization.intent,request.intent.confirmedIntent);
  assert.equal(confirmation.authorization.sessionRef,request.sessionRef);
  assert.equal(confirmation.authorization.turnRevision,request.turnRevision);
  assert.deepEqual(confirmation.authorization.localContext,request.localContext);
  assert.deepEqual(row.facts.currentConfirmation,confirmation);
  for(const context of [row.facts.sourceContext,row.facts.currentContext])
   assert.deepEqual(context,Object.fromEntries(Object.entries(row.request).filter(([k])=>!['requestId','proposal'].includes(k))));
  // This is a newly authored Painter result, independently digest checked; not a provider runtime proof.
  const build=row.expected.result.build;
  const kind=provided.operation==='ValidateBuildProposal'?'build':'region-build';
  assert.equal(createHash('sha256').update(doc.digest.prefixes[kind]+kind+'|'+canonical(build)).digest('hex'),row.expected.result.buildDigest);
 }
});
for(const row of doc.confirmationCases)test('v6 confirmation public refusal/replay/same-instance recovery: '+row.id,async()=>{
 if(row.requestAdmitted)assertShape(row.requestType,row.request);
 assertShape(row.factsType,row.facts);
 for(const facts of row.readFacts??[])assertShape(row.factsType,facts);
 assertShape(row.responseType,row.expected);
 const api=await runtime();
 for(const raw of encodings(row.request)){
  const run=registerCase(api,row);
  assert.deepEqual(await run.painter.call(row.operation,raw,{signal:run.signal}),row.expected);
  const valid=success(row.operation);run.recover(valid);
  assert.deepEqual(await run.painter.call(valid.operation,valid.request),valid.expected);
  assert.equal(run.reads,2);
  assert.deepEqual(await run.painter.call(valid.operation,valid.request),valid.expected);
  assert.equal(run.reads,4);
 }
});
