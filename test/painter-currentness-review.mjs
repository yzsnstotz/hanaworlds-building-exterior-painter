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

// All changes below use the existing v5 projection. This local carrier is not
// evidence of durable storage, human authorization or an external v6 source.
import { assertShape } from './painter-document-oracle.mjs';
import { v5Digest } from './painter-intent-versions-review.mjs';
import { isDeepStrictEqual } from 'node:util';
const requestFacts=facts=>facts.requestFacts??facts;
const scalarChanges=[
 ['turn',f=>{requestFacts(f).currentTurnRevision='fixture-turn-changed';}],
 ['brief',f=>{requestFacts(f).currentBriefDigest='f'.repeat(64);}],
 ['session',f=>{requestFacts(f).sessionRef='fixture-session-changed';}],
 ...['worldRef','connectionRef','connectionIncarnationRef','selectionRevision'].map(field=>
  ['localContext.'+field,f=>{requestFacts(f).currentContext[field]='fixture-context-changed';}]),
];
function assertOwnedRefusal(response,row) {
 assert.equal(response.contractVersion,row.request.contractVersion);
 assert.equal(response.requestId,row.request.requestId);
 assert.equal(response.result,null);
 assert.ok(doc.operationErrors[row.operation].own.some(c=>isDeepStrictEqual(c.value,response.error)),
  'refusal must retain a complete documented correlated error, not infer a new tuple');
}
for(const operation of ['ValidateBuildProposal','ValidateRegionProposal'])for(const readAt of [1,2])
 for(const [label,edit] of scalarChanges)test(`v5 ${operation} ${label} invalidation at read${readAt}`,async()=>{
  const row=example(operation==='ValidateBuildProposal'?'build-success':'region-success');
  const changed=structuredClone(row.facts);edit(changed);assertShape(row.factsType,changed);
  const api=await runtime();
  let reads=0,invalid=true;
  const {painter}=register(api,{facts:row.facts,read:async(body,actualOperation)=>{
   assert.deepEqual(body,row.request);assert.equal(actualOperation,operation);
   return structuredClone(invalid&&++reads===readAt?changed:row.facts);
  }});
  assertOwnedRefusal(await painter.call(operation,row.request),row);assert.equal(reads,readAt);
  invalid=false;assert.deepEqual(await painter.call(operation,row.request),row.expected);
 });
function rebindContext(context){
 context.referenceBriefDigest=v5Digest('reference-brief',context.referenceBrief);
 context.intent.referenceBriefDigest=context.referenceBriefDigest;
 context.intentDigest=v5Digest('intent',context.intent);
 context.safetyProfileDigest=v5Digest('safety-profile',context.safetyProfile);
}
const fullContextChanges=[
 ['turn',c=>{c.turnRevision='fixture-turn-changed';c.referenceBrief.turnRevision=c.turnRevision;c.intent.confirmedIntent.confirmedTurnRevision=c.turnRevision;}],
 ['brief',c=>{c.referenceBrief.briefRevision='fixture-brief-changed';}],
 ['media',c=>{c.referenceBrief.media=[{attachmentRef:'fixture-media-change',storedBytesDigest:'e'.repeat(64),projectionVariantId:null,projectionBytesDigest:null,mediaType:'image/png',bytes:1,width:1,height:1}];}],
 ['siteRules',c=>{c.intent.confirmedIntent.siteRules.hazardPolicy.forbidLiquid=false;c.referenceBrief.controls.siteRules.hazardPolicy.forbidLiquid=false;c.safetyProfile.hazardPolicy.forbidLiquid=false;}],
 ['placement',c=>{
  const i=c.regionInspection;
  const placement={profileVersion:'placement-proposal/v1',worldRef:c.worldRef,
   source:{inspectionId:i.inspectionId,anchorKind:i.anchorKind,worldRevision:c.targetFacts.worldRevision,targetFactsDigest:c.targetFactsDigest,frameDigest:c.targetFacts.frameDigest},
   target:{kind:'EXACT_CELLS',cells:structuredClone(c.targetFacts.knownEmptyCells)}};
  c.intent.confirmedIntent.placement=placement;c.referenceBrief.controls.placement=structuredClone(placement);
 }],
];
for(const lane of ['sourceContext','currentContext'])for(const readAt of [1,2])
 for(const [label,edit] of fullContextChanges)test(`v5 Build full ${lane}.${label} differs at read${readAt}`,async()=>{
  const row=example('build-success'),changed=structuredClone(row.facts);
  edit(changed[lane]);rebindContext(changed[lane]);assertShape(row.factsType,changed);
  const api=await runtime();
  let reads=0,invalid=true;
  const {painter}=register(api,{facts:row.facts,read:async()=>structuredClone(invalid&&++reads===readAt?changed:row.facts)});
  assertOwnedRefusal(await painter.call(row.operation,row.request),row);assert.equal(reads,readAt);
  invalid=false;assert.deepEqual(await painter.call(row.operation,row.request),row.expected);
 });
