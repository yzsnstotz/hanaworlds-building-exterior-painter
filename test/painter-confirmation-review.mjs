import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import { doc,runtime,registerCase,encodings } from './painter-review-harness.mjs';
import {baselineDoc,q241Doc,assertShape} from './painter-document-oracle.mjs';
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
 assert.deepEqual(doc.formalErrors,baselineDoc.formalErrors);
 for(const name of ['SourcePublicError'])
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

// Exact observed values, frozen independently of the candidate's error schema.
const observedAdditions={
  "ValidateBuildProposal": [
    {
      "code": "TURN_REVISION_MISMATCH",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "REVISION_CHANGED"
    },
    {
      "code": "TRANSACTION_CONFLICT",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "PAYLOAD_CHANGED"
    },
    {
      "code": "CATALOGUE_MISMATCH",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "CATALOGUE_UNRESOLVED"
    },
    {
      "code": "UNSUPPORTED_MUTATION_SEMANTICS",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "REQUIRED_FACT_UNKNOWN"
    },
    {
      "code": "INTENT_UNCONFIRMED",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "IDENTITY_UNVERIFIED"
    },
    {
      "code": "CURRENT_WORLD_MISMATCH",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "SCOPE_DENIED"
    },
    {
      "code": "INVALID_FRAME",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "PAYLOAD_CHANGED"
    },
    {
      "code": "TARGET_FACTS_STALE",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "PAYLOAD_CHANGED"
    },
    {
      "code": "INTENT_UNCONFIRMED",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "INVALID_GEOMETRY"
    },
    {
      "code": "CAPABILITY_UNAVAILABLE",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "REQUIRED_FACT_UNKNOWN"
    }
  ],
  "ValidateRegionProposal": [
    {
      "code": "CATALOGUE_MISMATCH",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "CATALOGUE_UNRESOLVED"
    },
    {
      "code": "UNSUPPORTED_MUTATION_SEMANTICS",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "REQUIRED_FACT_UNKNOWN"
    },
    {
      "code": "TRANSACTION_CONFLICT",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "PAYLOAD_CHANGED"
    },
    {
      "code": "TURN_REVISION_MISMATCH",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "REVISION_CHANGED"
    },
    {
      "code": "UNSUPPORTED_MATERIAL",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "REQUIRED_FACT_UNKNOWN"
    },
    {
      "code": "SAFETY_INVARIANT_FAILED",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "REQUIRED_FACT_UNKNOWN"
    },
    {
      "code": "INTENT_UNCONFIRMED",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "IDENTITY_UNVERIFIED"
    },
    {
      "code": "CURRENT_WORLD_MISMATCH",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "SCOPE_DENIED"
    },
    {
      "code": "INTENT_UNCONFIRMED",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "INVALID_GEOMETRY"
    },
    {
      "code": "CAPABILITY_UNAVAILABLE",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "REQUIRED_FACT_UNKNOWN"
    }
  ],
  "hanaworlds_image_material": [
    {
      "code": "CURRENT_WORLD_MISMATCH",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "INVALID_SHAPE"
    },
    {
      "code": "CATALOGUE_MISMATCH",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "INVALID_SHAPE"
    },
    {
      "code": "NON_CANONICAL_AMBIGUITY",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "INVALID_SHAPE"
    },
    {
      "code": "UNSUPPORTED_MUTATION_SEMANTICS",
      "phase": "validate",
      "retryability": "AFTER_NEW_FACTS",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "INVALID_SHAPE"
    }
  ]
};
test('Q247 only adds exact witnessed own tuples; source grammar and the prior closure remain',()=>{
 assert.deepEqual(doc.q247Review.addedTupleCounts,{ValidateBuildProposal:10,ValidateRegionProposal:10,hanaworlds_image_material:4});
 assert.deepEqual(doc.sourceErrorAdmission,q241Doc.sourceErrorAdmission);
 const changedTypes=new Set(['ValidateBuildProposalError','ValidateRegionProposalError','ImageMaterialOwnAdmissionError']);
 for(const [name,schema] of Object.entries(q241Doc.definitions)){
  if(!changedTypes.has(name))assert.deepEqual(doc.definitions[name],schema,name);
  else assert.deepEqual(doc.definitions[name].anyOf.slice(0,schema.anyOf.length),schema.anyOf,name+' original branches');
 }
 for(const [op,values] of Object.entries(observedAdditions)){
  const key=op==='hanaworlds_image_material'?'ownAdmission':'own';
  const before=q241Doc.operationErrors[op][key],after=doc.operationErrors[op][key];
  assert.deepEqual(after.slice(0,before.length),before);
  assert.deepEqual(after.slice(before.length).map(r=>r.value),values);
  assert.deepEqual(doc.q247ErrorAdditions[op].map(r=>r.value),values);
  const unchanged={...doc.operationErrors[op],[key]:before};
  if(op==='hanaworlds_image_material'){delete unchanged.own;assert.deepEqual(doc.operationErrors[op].own,after);}
  assert.deepEqual(unchanged,q241Doc.operationErrors[op]);
  const type=op==='hanaworlds_image_material'?'ImageMaterialOwnAdmissionError':op+'Error';
  assert.equal(doc.definitions[type].anyOf.length,q241Doc.definitions[type].anyOf.length+values.length);
  for(const value of values){
   assertShape(type,value);
   // Newly owned branches never authorize their seven fields as provider errors.
   assert.throws(()=>assertShape('SourcePublicError',value));
   for(const field of ['code','phase','retryability','reason','mutationState','transactionRef','causeCode']){
    const invalid={...value,[field]:field==='transactionRef'?'invented-tx':field==='causeCode'?'invented-cause':'__UNDOCUMENTED__'};
    assert.throws(()=>assertShape(type,invalid));
   }
   assert.throws(()=>assertShape(type,{...value,sourceIdentity:'invented'}));
  }
  assert.throws(()=>assertShape(type,{...values[0],code:'__UNKNOWN_CODE__'}));
 }
 // Avoid a code-wise cartesian product even when all selected fields occur elsewhere.
 const region=observedAdditions.ValidateRegionProposal;
 const conflict=region.find(v=>v.code==='TRANSACTION_CONFLICT');
 assert.throws(()=>assertShape('ValidateRegionProposalError',{...conflict,reason:'REVISION_CHANGED'}));
 assert.throws(()=>assertShape('ValidateRegionProposalError',{...conflict,retryability:'NEVER'}));
 for(const key of Object.keys(q241Doc).filter(k=>!['definitions','operationErrors'].includes(k)))assert.deepEqual(doc[key],q241Doc[key],key+' preserved');
});
test('Q247 captured originals have full admission/read/recovery values and preserved artifact provenance',()=>{
 assert.equal(doc.q247ObservedCases.length,104);
 assert.equal(doc.q247Review.originalArtifact.sha256,'3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2');
 for(const row of doc.q247ObservedCases){
  assert.equal(row.sourceArtifactSHA,doc.q247Review.originalArtifact.sha256);
  if(row.operation!=='hanaworlds_image_material'){
   assertShape(row.requestType,row.request);assertShape(row.factsType,row.facts);
   for(const facts of row.readFacts)assertShape(row.factsType,facts);
   assertShape(row.responseType,row.expected);assert.equal(row.originalException,null);
   assert.deepEqual(row.recoveryObserved,row.recovery.expected);assert.equal(row.recoveryReads,2);
   if(row.replayObserved){assert.deepEqual(row.replayObserved,row.recovery.expected);assert.equal(row.replayReads,4);}
  }else{
   assertShape('ImageMaterialOwnAdmissionError',row.expectedError.publicError);
   assert.deepEqual(row.originalException,row.expectedError);
   assert.deepEqual(row.recoveryObserved,row.recovery.expected);assert.equal(row.recoveryReads,0);
  }
 }
});
