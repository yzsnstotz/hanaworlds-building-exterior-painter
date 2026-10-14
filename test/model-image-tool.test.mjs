// Own public entry consuming complete formal C-session §13 fixtures.
// The fixture receiver checks object identity; it never proves real Host authority.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {Painter as api} from './painter-under-test.mjs';
import canonicalJSON from 'canonicalize';
import {doc,example,typed,assertError} from './painter-review-harness.mjs';
const supply=JSON.parse(readFileSync(new URL('./model-image-supply.json',import.meta.url)));
const normal=supply.cases.find(row=>row.id==='normal');
const ownError=(code,phase,reason,retryability='NEVER')=>({code,phase,retryability,
 mutationState:'NONE',transactionRef:null,causeCode:null,reason});
function exception(observation) {
 if(observation.publicError && !observation.message) {
  const error=new Error(JSON.stringify(observation));error.publicError=structuredClone(observation.publicError);return error;
 }
 const cause=observation.cause?new Error(observation.cause.message):undefined;
 const error=new Error(observation.message,{cause});
 for(const [key,value] of Object.entries(observation))if(!['cause','message','name'].includes(key))error[key]=structuredClone(value);
 return error;
}
function projection(row) {
 const result=structuredClone(row.projection);
 result.imageBytes=Uint8Array.from(result.imageBytes);
 for(const texture of result.materialSources.textures)texture.bytes=Uint8Array.from(texture.bytes);
 return result;
}
function typedFromProjection(p) {
 return {imageBytes:p.imageBytes,catalogue:p.catalogue.facts.catalogue,
  currentConnection:p.catalogue.facts.connection,
  materialSources:{snapshot:p.materialSources.facts.snapshot,textures:p.materialSources.textures}};
}
function expectedResult(row=normal) {
 const result=structuredClone(row.response.result);
 // §13 labels this as a display observation, not Painter ABI. Original byte-
 // weighted semantics give this single opaque pixel weight 255, not 1.
 result.dominant.alphaWeight=255;return result;
}
async function projectedTyped(input) {
 const p=projection(normal),meta=await sharp(input.imageBytes).metadata();
 p.imageBytes=input.imageBytes;
 Object.assign(p.localContext,input.currentConnection);
 p.attachment={attachmentId:p.attachment.attachmentId,mediaType:`image/${meta.format}`,
  bytes:input.imageBytes.byteLength,width:meta.width,height:meta.height};
 Object.assign(p.media,{mediaType:p.attachment.mediaType,bytes:p.attachment.bytes,
  width:p.attachment.width,height:p.attachment.height,
  storedBytesDigest:createHash('sha256').update(input.imageBytes).digest('hex'),
  projectionVariantId:null,projectionBytesDigest:null});
 Object.assign(p.catalogue.facts,{connection:input.currentConnection,catalogue:input.catalogue,
  catalogueDigest:input.materialSources.snapshot.catalogueDigest,
  presentation:Object.fromEntries(Object.keys(input.catalogue.materials).map(ref=>[ref,{displayName:null,color:null}])),
  orientationIndex:[{orientation:0,quarterTurnsAboutUp:null,upsideDown:null}]});
 p.materialSources.facts.snapshot=input.materialSources.snapshot;
 p.materialSources.textures=input.materialSources.textures;
 return p;
}
function mount({row=normal,settings={}}={}) {
 const provided=new Map(),registered=new Map(),calls=[],disposers=[];
 const controller=new AbortController();
 const session={id:normal.projection.sessionRef};
 const agent={id:'fixture-agent',session};
 const exec={callId:'fixture-model-call',rootCallId:'fixture-model-call',
  name:'hanaworlds_image_material',arguments:structuredClone(normal.supplyRequest),
  agent,signal:controller.signal,token:Symbol('fixture-only'),deferContext(){throw new Error('extra model context');}};
 let current=row,original=current.response.error?exception(current.response.error):null,port;
 const receiver={async readMaterialSourcesProjection(request,execution) {
  assert.equal(this,receiver,'preserve original receiver');
  calls.push({request:structuredClone(request),exec:execution});
  assert.equal(execution,exec,'never clone the execution or derive it from model JSON');
  assert.equal(execution.agent,agent);assert.equal(execution.agent.session,session);
  assert.deepEqual(request,current.supplyRequest);
  if(execution.signal.aborted)throw execution.signal.reason;
  if(original)throw original;
  return projection(current);
 }};
 port=receiver;
 const tools={register(definition) {
  assert.equal(definition.name,'hanaworlds_image_material');
  assert.ok(!registered.has(definition.name),'only one native image tool');
  registered.set(definition.name,definition);
  const dispose=()=>registered.delete(definition.name);disposers.push(dispose);return dispose;
 }};
 const ctx={tools,provide:(key,value)=>provided.set(key,value),
  get(key){
   if(key==='hanaworldsWorkshop')return port;
   if(key==='tools')return tools;
   if(provided.has(key))return provided.get(key);
   if(key==='hanaworldsPainterLocalFacts')return undefined;
   throw new Error('Painter touched unauthorized service: '+key);
  },
  plugin(child){
   assert.deepEqual(child.inject,['tools'],'only the child waits for the native registry');
   child.apply(ctx);return {dispose:async()=>{for(const d of disposers)d();}};
  }};
 const painter=api.apply(ctx,api.Config(settings));
 return {painter,provided,registered,calls,exec,controller,receiver,
  get original(){return original;},
  recover(){current=normal;original=null;},
  replace(){port={...receiver};},missing(){port=undefined;},
  dispose(){for(const d of disposers)d();}};
}
function native(h) {
 const tool=h.registered.get('hanaworlds_image_material');
 assert.ok(tool,'IMAGE_MODEL_NOT_REGISTERED: original image capability must be registered on official ctx.tools');
 return tool;
}
function assertOriginal(error,expected) {
 assert.deepEqual(Object.fromEntries(Object.keys(expected).map(key=>[key,error[key]])),expected);
}

test('formal supply preserves all 24 complete counterpart cases without treating JSON as authority',()=>{
 assert.equal(supply.source.SHA256,'9f4b559c281d0839eecd5a64c07667373749569eb6e6cd55fa5ef61f191f2376');
 assert.equal(supply.cases.length,24);assert.equal(supply.attachmentExamples.length,3);
 for(const row of supply.cases) {
  assert.ok(row.hostContext);assert.ok(row.runtimeIdentityObservation);
  assert.ok(row.calls.length);assert.ok(row.before);assert.ok(row.after);assert.ok(row.effects);
  assert.equal(row.responseIsObservationNotABI,true);
 }
});

test('formal source bytes match the retained typed result and original alpha-byte weight',async()=>{
 assert.deepEqual(await api.matchCurrentImageMaterials(typedFromProjection(projection(normal))),expectedResult());
 assert.equal(normal.response.result.dominant.alphaWeight,1,'preserve the original display observation');
 assert.equal(expectedResult().dominant.alphaWeight,255,'own contract keeps alpha-byte weight');
});

test('whole model supplement retains source values, closes schemas and defines every native budget case',()=>{
 const text=readFileSync(new URL('../../contract-add/C-painter.md',import.meta.url),'utf8');
 const match=[...text.matchAll(/```json title=Q278ModelImageSupplement\n([\s\S]*?)\n```/g)].at(-1);
 assert.ok(match,'Complete own model/typed body must exist before whole review');
 const document=JSON.parse(match[1]);
 assert.equal(Object.keys(document.definitions).length,88);
 assert.deepEqual(document.examples.map(row=>row.counterpartOriginal),supply.cases);
 assert.deepEqual(document.attachmentExamplesOriginal,supply.attachmentExamples);
 assert.deepEqual(document.imageBudgetProposalUnchanged,doc.imageBudgetProposal);
 assert.deepEqual(document.configInputUnchanged,doc.definitions.ConfigInput);
 assert.equal(document.nativeBudgetCases.length,6);
 for(const row of document.nativeBudgetCases) {
  assert.deepEqual(typedFromProjection(row.limitedProjection),row.typedInput);
  assert.deepEqual(typedFromProjection(row.recoveryProjection),row.recoveryTypedInput);
  assert.equal(row.releaseReadsOnFailure,0);assert.equal(row.toolReapply,false);
 }
 function refs(value) {
  if(!value||typeof value!=='object')return;
  if(value.$ref)assert.ok(document.definitions[value.$ref.slice(14)],value.$ref);
  for(const child of Object.values(value))refs(child);
 }refs(document.definitions);
 for(const row of document.examples) {
  if(row.ownExpectedObservation.result)
   assert.deepEqual(row.nativeDisplayObservation.value,row.ownExpectedObservation.result);
 }
});

test('native registration publishes reference-only schema, complete output and visible instance budgets',()=>{
 const h=mount({settings:{maxBytes:700,maxPixels:8,formats:['png']}}),tool=native(h);
 assert.deepEqual(tool.parameters,{type:'object',properties:{attachmentRef:{type:'string'}},
  required:['attachmentRef'],additionalProperties:false});
 assert.equal(tool.output.schema.type,'object');
 assert.deepEqual([...tool.output.schema.required].sort(),Object.keys(normal.response.result).sort());
 assert.match(tool.description,/700/);assert.match(tool.description,/8/);assert.match(tool.description,/png/);
 assert.deepEqual(api.inject,[],'typed-only loading remains available');
 assert.deepEqual([...h.provided.keys()],[api.SERVICE,'hanaworlds_image_material']);
 h.dispose();assert.equal(h.registered.size,0);
});

for(const row of supply.cases.filter(row=>!['forged-typed','forged-world'].includes(row.id))) {
 test(`model consumes formal supply through own native entry and recovers: ${row.id}`,async()=>{
  const h=mount({row}),tool=native(h);
  if(row.response.error===null) {
   const result=await tool.execute(structuredClone(row.supplyRequest),h.exec);
   assert.deepEqual(result,expectedResult(row));assert.equal(h.calls.length,2);
   assert.deepEqual(tool.output.render(row.supplyRequest,result),[{type:'text',text:canonicalJSON(result)}]);
  } else if(!row.releaseToPainter) {
   const original=h.original;
   await assert.rejects(tool.execute(structuredClone(row.supplyRequest),h.exec),error=>error===original);
   assert.equal(h.calls.length,1,'no retry or extra action on a carried exception');
   if(original.cause)assert.equal(h.original.cause,original.cause);
   if(original.publicError)assert.deepEqual(original.publicError,row.response.error.publicError);
  } else {
   // Legal UNKNOWN/texture source facts reach the actual original decoder.
   // Workshop succeeds here; the Painter alone creates the documented refusal.
   h.recover();
   const special=projection(row);
   const receiver=h.receiver;
   receiver.readMaterialSourcesProjection=async function(request,exec) {
    assert.equal(this,receiver);assert.equal(exec,h.exec);h.calls.push({request,exec});return special;
   };
   await assert.rejects(tool.execute(structuredClone(row.supplyRequest),h.exec),error=>{
    assertOriginal(error,row.response.error);return true;
   });
   assert.equal(h.calls.length,1,'no release read after original decode failure');
   receiver.readMaterialSourcesProjection=async function(request,exec) {
    assert.equal(this,receiver);assert.equal(exec,h.exec);h.calls.push({request,exec});return projection(normal);
   };
  }
  h.recover();const before=h.calls.length;
  const recovered=await tool.execute(structuredClone(normal.supplyRequest),h.exec);
  assert.deepEqual(recovered,expectedResult());assert.equal(h.calls.length-before,2);
  assert.equal(h.registered.get(tool.name),tool);assert.equal(recovered.modelCalls,0);assert.equal(recovered.worldWrites,0);
 });
}

for(const key of ['imageBytes','catalogue','currentConnection','materialSources','worldRef','sessionRef',
 'connectionRef','provider','sourceRevision','path','url','authorization','confirmed']) {
 test(`model ${key} cannot impersonate typed facts or authorize extra reads`,async()=>{
  const h=mount(),tool=native(h),args={...normal.supplyRequest,[key]:normal.request[key]??'MODEL_CLAIM'};
  await assert.rejects(tool.execute(args,h.exec),error=>{
   assertOriginal(error,ownError('UNKNOWN_REQUIRED_FIELD','decode','UNKNOWN_FIELD'));return true;
  });assert.equal(h.calls.length,0);
 });
}
for(const args of [null,[],{}, {attachmentRef:''},{attachmentRef:42}]) {
 test(`malformed model input is refused before supply: ${JSON.stringify(args)}`,async()=>{
  const h=mount(),tool=native(h);
  await assert.rejects(tool.execute(args,h.exec),error=>{
   assertOriginal(error,ownError('SCHEMA_INVALID','decode','INVALID_SHAPE'));return true;
  });assert.equal(h.calls.length,0);
 });
}
test('missing current Workshop keeps named capability refusal and no world access',async()=>{
 const h=mount(),tool=native(h);h.missing();
 await assert.rejects(tool.execute(normal.supplyRequest,h.exec),error=>{
  assert.equal(error.code,'CAPABILITY_UNAVAILABLE');assert.equal(error.mutationState,'NONE');return true;
 });assert.equal(h.calls.length,0);
});
test('same-id cloned execution cannot authorize the model supply',async()=>{
 const h=mount(),tool=native(h);
 const original=new Error('actual receiver rejected cloned execution');
 h.receiver.readMaterialSourcesProjection=async function(request,exec){
  if(exec!==h.exec)throw original;return projection(normal);
 };
 await assert.rejects(tool.execute(normal.supplyRequest,{...h.exec,agent:{...h.exec.agent}}),error=>error===original);
});
test('provider replacement after decode refuses release instead of returning a hint',async()=>{
 const h=mount(),tool=native(h),original=h.painter.matchCurrentImageMaterials.bind(h.painter);
 h.painter.matchCurrentImageMaterials=async input=>{const result=await original(input);h.replace();return result;};
 await assert.rejects(tool.execute(normal.supplyRequest,h.exec),error=>error.code==='CAPABILITY_UNAVAILABLE'
  &&error.mutationState==='NONE');assert.equal(h.calls.length,1);
});
for(const field of ['turnRevision','sourceMessageId','messageDigest','localContext','attachment','media',
 'catalogue','materialSources']) {
 test(`full projection ${field} change during decoding invalidates release`,async()=>{
  const h=mount(),tool=native(h);let reads=0;
  h.receiver.readMaterialSourcesProjection=async function(request,exec){
   assert.equal(this,h.receiver);assert.equal(exec,h.exec);h.calls.push({request,exec});
   const p=projection(normal);
   if(++reads===2){
    // The supplying port either rejects the late change with its original Error
    // or returns a changed legal projection. Own consumer must compare the full projection.
    if(typeof p[field]==='string')p[field]+='-changed';
    else if(field==='localContext')p[field].selectionRevision+='-changed';
    else if(field==='attachment')p[field].attachmentId+='-changed';
    else if(field==='media')p[field].attachmentRef+='-changed';
    else if(field==='catalogue')p[field].provider.providerRevision+='-changed';
    else p[field].provider.providerRevision+='-changed';
   }return p;
  };
  await assert.rejects(tool.execute(normal.supplyRequest,h.exec),error=>error.code==='CURRENT_WORLD_MISMATCH'
   &&error.mutationState==='NONE'&&error.transactionRef===null);
  assert.equal(h.calls.length,2);
 });
}
test('cancellation after matching preserves original signal reason before release reads',async()=>{
 const h=mount(),tool=native(h),reason=new Error('original cancel',{cause:new Error('original cause')});
 const original=h.painter.matchCurrentImageMaterials.bind(h.painter);
 h.painter.matchCurrentImageMaterials=async input=>{const value=await original(input);h.controller.abort(reason);return value;};
 await assert.rejects(tool.execute(normal.supplyRequest,h.exec),error=>error===reason);
 assert.equal(h.calls.length,1);
});

test('provider-owned projection mutation cannot rewrite the captured first observation',async()=>{
 const h=mount(),tool=native(h),p=projection(normal);
 h.receiver.readMaterialSourcesProjection=async function(request,exec){
  assert.equal(this,h.receiver);assert.equal(exec,h.exec);h.calls.push({request,exec});return p;
 };
 const original=h.painter.matchCurrentImageMaterials.bind(h.painter);
 h.painter.matchCurrentImageMaterials=async input=>{const result=await original(input);p.localContext.selectionRevision+='-changed';return result;};
 await assert.rejects(tool.execute(normal.supplyRequest,h.exec),error=>error.code==='CURRENT_WORLD_MISMATCH'
  &&error.mutationState==='NONE');assert.equal(h.calls.length,2);
});

for(const row of [...doc.imageBudgetProposal.cases,...doc.imageBudgetProposal.textureCases]) {
 test(`native uses original main/texture budget and recovers on same tool: ${row.id}`,async()=>{
  const h=mount({settings:row.settings}),tool=native(h);
  const input=typed(example(row.inputExample).request),recovery=example(row.recoveryExample);
  let current=await projectedTyped(input);
  h.receiver.readMaterialSourcesProjection=async function(request,exec){
   assert.equal(this,h.receiver);assert.equal(exec,h.exec);h.calls.push({request,exec});return current;
  };
  await assert.rejects(tool.execute(normal.supplyRequest,h.exec),error=>{assertError(error,row.expectedError);return true;});
  assert.equal(h.calls.length,1,'no release observation or retry after budget/decode refusal');
  await assert.rejects(h.provided.get('hanaworlds_image_material').execute(input),error=>{
   assertError(error,row.expectedError);return true;
  });
  current=await projectedTyped(typed(recovery.request));
  assert.deepEqual(await tool.execute(normal.supplyRequest,h.exec),recovery.expected);
  assert.equal(h.registered.get(tool.name),tool);
  assert.deepEqual(h.provided.get(tool.name).limits,{...doc.imageBudgetProposal.defaults,...row.settings});
  current=await projectedTyped(input);
  await assert.rejects(tool.execute(normal.supplyRequest,h.exec),error=>{assertError(error,row.expectedError);return true;});
 });
}

test('same original typed API decodes formal current bytes; model JSON cannot select it',async()=>{
 const input=typedFromProjection(projection(normal));
 assert.deepEqual(await api.matchCurrentImageMaterials(input),expectedResult());
 const h=mount(),tool=native(h);
 assert.deepEqual(await h.provided.get('hanaworlds_image_material').execute(input),expectedResult());
 assert.equal(h.calls.length,0);
 await assert.rejects(tool.execute(input,h.exec),error=>error.code==='UNKNOWN_REQUIRED_FIELD');
 assert.equal(h.calls.length,0);
});
