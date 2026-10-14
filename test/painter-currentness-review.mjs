import test from 'node:test';
import assert from 'node:assert/strict';
import { runtime,register,doc,example } from './painter-review-harness.mjs';
for(const operation of ['ValidateBuildProposal','ValidateRegionProposal']){
 const row=example(operation==='ValidateBuildProposal'?'build-success':'region-success');
 const expected=code=>doc.operationErrors[operation].own.find(c=>c.value.code===code).value;
 test('provider replacement and AbortSignal after await refuse '+operation,async()=>{
  const api=await runtime();
  for(const action of ['provider','abort']){
   const controller=new AbortController();let reads=0,ctx;
   const reg=register(api,{facts:row.facts,read:async()=>{
    if(++reads===2){if(action==='abort')controller.abort();else ctx.get=()=>({read:async()=>structuredClone(row.facts)});}
    return structuredClone(row.facts);
   }});ctx=reg.ctx;
   const response=await reg.painter.call(operation,row.request,{signal:controller.signal});
   assert.deepEqual(response,{contractVersion:row.request.contractVersion,requestId:row.request.requestId,result:null,error:expected(action==='abort'?'REQUEST_CANCELLED':'CURRENT_WORLD_MISMATCH')});
   // A failed release must leave no receipt even when the same context returns.
   ctx.get=()=>reg.port;
   assert.deepEqual(await reg.painter.call(operation,row.request),row.expected);
  }
 });
 test('replay payload change refuses without world writes '+operation,async()=>{
  const api=await runtime(),{painter}=register(api,{facts:row.facts});
  assert.deepEqual(await painter.call(operation,row.request),row.expected);
  const changed=structuredClone(row.request);
  if(operation==='ValidateBuildProposal')changed.proposal.boxes.push(structuredClone(changed.proposal.boxes[0]));
  else changed.proposal.block.origin[0]++;
  assert.deepEqual(await painter.call(operation,changed),{contractVersion:changed.contractVersion,requestId:changed.requestId,result:null,error:expected('REPLAY_MISMATCH')});
  assert.deepEqual(await painter.call(operation,row.request),row.expected);
 });
}
