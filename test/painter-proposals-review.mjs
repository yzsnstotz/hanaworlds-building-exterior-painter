import test from 'node:test';
import assert from 'node:assert/strict';
import { runtime,register,doc,callExample,encodings,typed,assertError } from './painter-review-harness.mjs';
for(const row of doc.examples) test('full documented result/refusal: '+row.id,async()=>{
 const api=await runtime();
 if(row.operation==='hanaworlds_image_material'){
  if(row.expectedError)await assert.rejects(callExample(api,row),e=>{assertError(e,row.expectedError);return true;});
  else assert.deepEqual(await callExample(api,row),row.expected);
 }else for(const raw of encodings(row.request)){
  let reads=0;
  const {painter}=register(api,{facts:row.facts,read:async()=>{reads++;return structuredClone(row.facts);}});
  assert.deepEqual(await painter.call(row.operation,raw),row.expected);
  if(row.expected.result!==null){assert.equal(reads,2);assert.deepEqual(await painter.call(row.operation,raw),row.expected);assert.equal(reads,4);}
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
