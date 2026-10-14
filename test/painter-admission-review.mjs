import test from 'node:test';
import assert from 'node:assert/strict';
import { runtime,register,doc,example,typed,mutated,assertError } from './painter-review-harness.mjs';
for(const [i,row] of doc.ownedAdmissionCases.entries())test('complete owned admission refusal '+i+' '+row.operation,async()=>{
 const api=await runtime(),base=example(row.operation==='ValidateBuildProposal'?'build-success':row.operation==='ValidateRegionProposal'?'region-success':'image-success');
 const {painter,tool}=register(api,{facts:base.facts}),input=mutated(row);
 const invoke=()=>row.operation==='hanaworlds_image_material'?tool.execute(typed(input)):painter.call(row.operation,input);
 if(row.thrown)await assert.rejects(invoke(),e=>{assertError(e,row.thrown);return true;});
 else assert.deepEqual(await invoke(),row.returned);
});
for(const operation of ['ValidateBuildProposal','ValidateRegionProposal'])test('strict decoder and data descriptors '+operation,async()=>{
 const api=await runtime(),row=example(operation==='ValidateBuildProposal'?'build-success':'region-success');
 const {painter}=register(api,{facts:row.facts});
 for(const [raw,reason] of [[Uint8Array.of(255),'INVALID_UTF8'],['{"a":1,"\\u0061":2}','DUPLICATE_DECODED_KEY'],['{"a":"\\ud800"}','LONE_SURROGATE'],['{"a":1e999}','INVALID_NUMBER']])
  await assert.rejects(painter.call(operation,raw),e=>{assert.deepEqual(e.publicError,doc.operationErrors[operation].own.find(c=>c.value.reason===reason).value);return true;});
 let reads=0;const input=structuredClone(row.request);
 Object.defineProperty(input,'requestId',{enumerable:true,get(){reads++;throw new Error('must not evaluate getter');}});
 await assert.rejects(painter.call(operation,input));assert.equal(reads,0);
});
test('typed image root is closed and data descriptors are never evaluated',async()=>{
 const api=await runtime(),row=example('image-success'),{tool}=register(api);
 await assert.rejects(tool.execute({...typed(row.request),__unpublished_field__:true}),e=>{
  assert.deepEqual(e.publicError,doc.operationErrors.hanaworlds_image_material.own.find(c=>c.value.reason==='UNKNOWN_FIELD').value);return true;
 });
 let getterCalls=0;const input=typed(row.request);
 Object.defineProperty(input,'catalogue',{enumerable:true,get(){getterCalls++;throw new Error('must not evaluate getter');}});
 await assert.rejects(tool.execute(input));assert.equal(getterCalls,0);
});
