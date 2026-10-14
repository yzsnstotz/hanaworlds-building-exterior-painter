import test from 'node:test';
import assert from 'node:assert/strict';
import { runtime,register,doc,example,encodings } from './painter-review-harness.mjs';
for(const row of doc.sourceErrorCases)test('source error seven fields and same-instance recovery: '+row.id,async()=>{
 const api=await runtime();
 for(const raw of encodings(row.request)){
  let reads=0,fail=true;
  const original={publicError:structuredClone(row.originalPublicError)};
  const {painter}=register(api,{facts:row.facts,read:async()=>{
   reads++;if(fail&&reads===row.throwOnRead)throw original;return structuredClone(row.facts);
  }});
  assert.deepEqual(await painter.call(row.operation,raw),row.expectedResponse);
  assert.equal(reads,row.throwOnRead);
  fail=false;reads=0;
  assert.deepEqual(await painter.call(row.operation,raw),row.recoveryExpected);
  assert.equal(reads,2);
  assert.deepEqual(await painter.call(row.operation,raw),row.recoveryExpected);
  assert.equal(reads,4);
 }
});
for(const operation of ['ValidateBuildProposal','ValidateRegionProposal'])for(const readAt of [1,2])
 test(`opaque/unrecognized/getter error identity ${operation} read${readAt}`,async()=>{
  const api=await runtime(),row=example(operation==='ValidateBuildProposal'?'build-success':'region-success');
  let getterCalls=0;
  const accessor={};Object.defineProperty(accessor,'publicError',{get(){getterCalls++;throw new Error('getter invoked');}});
  const badTuple={publicError:{...doc.sourceErrorCases[0].originalPublicError,reason:'POLICY_UNAVAILABLE'}};
  const addedKey={publicError:{...doc.sourceErrorCases[0].originalPublicError,sourceIdentity:'invented'}};
  const ordinary=new Error('original opaque error');ordinary.privateData=()=>ordinary;
  for(const original of [ordinary,accessor,badTuple,addedKey]){
   let reads=0,fail=true;
   const {painter}=register(api,{facts:row.facts,read:async()=>{if(fail&&++reads===readAt)throw original;return structuredClone(row.facts);}});
   await assert.rejects(painter.call(operation,row.request),e=>e===original);
   assert.equal(getterCalls,0);
   fail=false;assert.deepEqual(await painter.call(operation,row.request),row.expected);
  }
 });
for(const row of doc.sourceErrorCases)test('source error on existing success replay remains exact: '+row.id,async()=>{
 const api=await runtime();let reads=0,fail=false;
 const original={publicError:structuredClone(row.originalPublicError)};
 const {painter}=register(api,{facts:row.facts,read:async()=>{
  reads++;if(fail&&reads===row.throwOnRead)throw original;return structuredClone(row.facts);
 }});
 assert.deepEqual(await painter.call(row.operation,row.request),row.recoveryExpected);
 fail=true;reads=0;
 assert.deepEqual(await painter.call(row.operation,row.request),row.expectedResponse);
 assert.equal(reads,row.throwOnRead);
 fail=false;reads=0;
 assert.deepEqual(await painter.call(row.operation,row.request),row.recoveryExpected);
 assert.equal(reads,2);
});
