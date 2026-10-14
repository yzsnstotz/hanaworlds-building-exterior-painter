import './painter-confirmation-review.mjs';
import './painter-intent-versions-review.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runtime,register,registerCase,doc,example,callExample,encodings,typed,assertError } from './painter-review-harness.mjs';
for(const row of doc.examples) test('full documented result/refusal: '+row.id,async()=>{
 const api=await runtime();
 if(row.operation==='hanaworlds_image_material'){
  if(row.expectedError)await assert.rejects(callExample(api,row),e=>{assertError(e,row.expectedError);return true;});
  else assert.deepEqual(await callExample(api,row),row.expected);
 }else for(const raw of encodings(row.request)){
  const run=registerCase(api,row);
  assert.deepEqual(await run.painter.call(row.operation,raw,{signal:run.signal}),row.expected);
  if(row.expected.result!==null){assert.equal(run.reads,2);assert.deepEqual(await run.painter.call(row.operation,raw),row.expected);assert.equal(run.reads,4);}
 }
});
for(const row of doc.ownedBusinessCases)test('safety refusal retains all fields: '+row.id,async()=>{
 const api=await runtime();
 for(const raw of encodings(row.request))assert.deepEqual(await callExample(api,row,raw),row.expected);
});
test('actual image input is copied before async decode; result records zero model/world calls',async()=>{
 const api=await runtime(),row=doc.examples.find(e=>e.id==='image-success');
 const {tool}=register(api),input=typed(row.request),pending=tool.execute(input);
 input.imageBytes.fill(0);for(const t of input.materialSources.textures)t.bytes.fill(0);
 assert.deepEqual(await pending,row.expected);
 assert.equal(row.expected.modelCalls,0);assert.equal(row.expected.worldWrites,0);
});
// Independent digest oracle for authored confirmation mutations; no product validator.
const canonical=value=>Array.isArray(value)?'['+value.map(canonical).join(',')+']'
 :value!==null&&typeof value==='object'?'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}'
 :JSON.stringify(value);
for(const operation of ['ValidateBuildProposal','ValidateRegionProposal'])test('unconfirmed turn refuses a correctly digested intent: '+operation,async()=>{
 const api=await runtime(),{createHash}=await import('node:crypto');
 const row=structuredClone(doc.examples.find(r=>r.id===(operation==='ValidateBuildProposal'?'build-success':'region-success')));
 const digest=value=>createHash('sha256').update(doc.digest.prefixes.intent+'intent|'+canonical(value)).digest('hex');
 assert.equal(digest(row.request.intent),row.request.intentDigest,'authored digest oracle matches document');
 row.request.intent.confirmedIntent.confirmedTurnRevision='unconfirmed-turn';
 row.request.intentDigest=digest(row.request.intent);
 if(operation==='ValidateBuildProposal')for(const name of ['sourceContext','currentContext'])
  row.facts[name]=Object.fromEntries(Object.keys(row.facts[name]).map(k=>[k,structuredClone(row.request[k])]));
 const error=doc.operationErrors[operation].own.find(c=>c.value.code==='INTENT_UNCONFIRMED'&&c.value.reason==='REQUIRED_FACT_UNKNOWN').value;
 for(const raw of encodings(row.request))assert.deepEqual(await callExample(api,row,raw),{
  contractVersion:row.request.contractVersion,requestId:row.request.requestId,result:null,error,
 });
});

for(const row of doc.q247ObservedCases)test('Q247 original public path all fields/reads/recovery: '+row.id,async()=>{
 const api=await runtime();
 if(row.operation==='hanaworlds_image_material'){
  const run=register(api);
  await assert.rejects(run.tool.execute(typed(row.request)),e=>{assertError(e,row.expectedError);return true;});
  assert.deepEqual(await run.tool.execute(typed(row.recovery.request)),row.recovery.expected);
 }else for(const raw of encodings(row.request)){
  const run=registerCase(api,row);
  assert.deepEqual(await run.painter.call(row.operation,raw),row.expected);
  assert.equal(run.reads,row.expectedReads);
  run.recover(row.recovery);
  assert.deepEqual(await run.painter.call(row.operation,row.recovery.request),row.recovery.expected);
  assert.equal(run.reads,2);
  assert.deepEqual(await run.painter.call(row.operation,row.recovery.request),row.recovery.expected);
  assert.equal(run.reads,4);
 }
});
for(const operation of ['ValidateBuildProposal','ValidateRegionProposal'])for(const readAt of [1,2])
 test(`Q247 own tuple is not a new source permission ${operation} read${readAt}`,async()=>{
  const api=await runtime(),row=example(operation==='ValidateBuildProposal'?'build-success':'region-success');
  for(const added of [...Object.values(doc.q247ErrorAdditions).flat(),...Object.values(doc.q256ErrorAdditions).flat()]){
   const original={publicError:structuredClone(added.value)};let reads=0,fail=true;
   const {painter}=register(api,{facts:row.facts,read:async()=>{
    if(fail&&++reads===readAt)throw original;return structuredClone(row.facts);
   }});
   await assert.rejects(painter.call(operation,row.request),error=>error===original);
   assert.equal(reads,readAt);fail=false;
   assert.deepEqual(await painter.call(operation,row.request),row.expected);
  }
 });

for(const row of doc.q256DigestCases)test('Q256 original digest/shape path full return/reads/recovery: '+row.id,async()=>{
 const api=await runtime();
 for(const raw of encodings(row.request)){
  let recovering=false,recoveryReads=0;const seen=[];
  const run=register(api,{facts:row.facts,read:async(body,operation)=>{
   assert.equal(operation,row.operation);
   if(recovering){recoveryReads++;assert.deepEqual(body,row.recovery.request);return structuredClone(row.recovery.facts);}
   seen.push(structuredClone(body));assert.deepEqual(body,row.request);return structuredClone(row.facts);
  }});
  assert.deepEqual(await run.painter.call(row.operation,raw),row.expected);
  assert.equal(seen.length,row.expectedReads);
  recovering=true;
  assert.deepEqual(await run.painter.call(row.operation,row.recovery.request),row.recovery.expected);
  assert.equal(recoveryReads,2);
  assert.deepEqual(await run.painter.call(row.operation,row.recovery.request),row.recovery.expected);
  assert.equal(recoveryReads,4);
 }
});
