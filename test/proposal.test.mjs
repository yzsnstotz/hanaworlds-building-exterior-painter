// Actual Painter entry; Host/Workshop/Adapter provenance and world are fixtures.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { digestValue, validateBuildProposalResponse, checkBuildProposalHandshake } from '#contracts';
import { regionRequest, hutAnswer } from './region-fixtures.mjs';
const root = process.env.PAINTER_TEST_PACKAGE ?? resolve(new URL('..', import.meta.url).pathname);
const { ExteriorPainterV2 } = await import(pathToFileURL(resolve(root, 'src/index.mjs')));
const fixture = JSON.parse(readFileSync(resolve(root, 'vendor/hanaworlds-contracts/fixtures/v4/proposal/text-build-proposal.json')));
const clone = structuredClone;
const op = 'ValidateBuildProposal';
function context(request) { const {requestId, proposal, ...rest} = request; return rest; }
function setup(request = clone(fixture.request), changes) {
 const state = { calls: 0, facts: clone(fixture.facts) };
 state.facts.sourceContext = clone(context(request)); state.facts.currentContext = clone(context(request));
 const authority = { async verify(body, action) { assert.equal(action, op); state.calls++; if (changes) await changes(state, body); return clone(state.facts); } };
 const forbidden = new Proxy({}, { get() { throw new Error('proposal entry accessed model/media'); } });
 const painter = new ExteriorPainterV2({ authority, llm: forbidden, attachments: forbidden });
 return {request, state, authority, painter};
}
async function reject(f, code, raw = f.request, options) {
 const response = await f.painter.call(op, raw, options);
 assert.equal(response.result, null); assert.equal(response.error.code, code);
 assert.equal(response.error.mutationState, 'NONE'); assert.equal(response.error.transactionRef, null);
 return response;
}
function bindBrief(r) {r.referenceBriefDigest=digestValue('reference-brief',r.referenceBrief).sha256;r.intent.referenceBriefDigest=r.referenceBriefDigest;r.intentDigest=digestValue('intent',r.intent).sha256;}
function bindTarget(r) {r.targetFactsDigest=digestValue('target-facts',r.targetFacts).sha256;r.regionInspection.targetFacts=clone(r.targetFacts);r.regionInspection.targetFactsDigest=r.targetFactsDigest;}

test('new public operation produces coherent text BUILD without model/media access, raw/decoded and exact replay', async () => {
 const f=setup(); checkBuildProposalHandshake(f.painter.handshake());
 assert.ok(f.painter.describe().operations.includes(op));
 const response=await f.painter.call(op,f.request);
 assert.equal(response.error,null); validateBuildProposalResponse(f.request,response);
 assert.deepEqual(response.result.build.operations,[{op:'set_box',min:[0,1,3],max:[0,1,3],materialRef:'stone'}]);
 assert.equal(f.state.calls,2);
 const replay=await f.painter.call(op,JSON.stringify(f.request));
 assert.deepEqual(replay,response); assert.equal(f.state.calls,4);
});
for (const [name, mutate, code] of [
 ['wrong brief Session',r=>{r.referenceBrief.sessionRef='other';bindBrief(r);},'INTENT_UNCONFIRMED'],
 ['wrong confirmed turn',r=>{r.intent.confirmedIntent.confirmedTurnRevision='other';r.intentDigest=digestValue('intent',r.intent).sha256;},'INTENT_UNCONFIRMED'],
 ['wrong world',r=>r.worldRef='other','PERMISSION_DENIED'],
 ['out of bounds',r=>r.proposal.boxes[0].max[0]=2,'BUILD_INVALID'],
 ['bad param2',r=>r.proposal.materials.stone.param2=256,'SCHEMA_INVALID'],
 ['fractional geometry',r=>r.proposal.boxes[0].min[0]=0.5,'SCHEMA_INVALID'],
 ['occupied support',r=>{r.proposal.boxes[0].min[1]=0;r.proposal.boxes[0].max[1]=0;},'BUILD_INVALID'],
 ['unknown target',r=>{r.targetFacts.unknownCells=[{position:[0,1,3],reason:'UNLOADED'}];r.targetFacts.knownEmptyCells=[];r.targetFacts.usableVolume=null;bindTarget(r);},'TARGET_FACTS_INCOMPLETE'],
 ['protected target',r=>r.regionInspection.protectedPositions=[[0,1,3]],'PERMISSION_DENIED'],
 ['body target',r=>r.regionInspection.bodyOccupiedPositions=[[0,1,3]],'BUILD_INVALID'],
 ['proposal identity injection',r=>r.proposal.actorRef='forged','UNKNOWN_REQUIRED_FIELD'],
 ['unknown material',r=>r.proposal.boxes[0].materialRef='missing','UNSUPPORTED_MATERIAL'],
 ['weakened safety',r=>{r.safetyProfile.requireBodyClearance=false;r.safetyProfileDigest=digestValue('safety-profile',r.safetyProfile).sha256;},'CAPABILITY_UNAVAILABLE'],
]) test('new operation rejects '+name,async()=>{const r=clone(fixture.request);mutate(r);await reject(setup(r),code);});
for(const [field,value,code] of [
 ['grantStatus','REVOKED','AUTHORIZATION_REVOKED'],['grantStatus','UNKNOWN','CAPABILITY_UNAVAILABLE'],
 ['invocationStatus','CANCELLED','PERMISSION_DENIED'],['turnStatus','SUPERSEDED','INTENT_UNCONFIRMED'],
 ['callerServiceRef','other','PERMISSION_DENIED'],['liveSessionIncarnationRef','other','PERMISSION_DENIED'],
]) test('current authority refuses '+field+'='+value,async()=>{const f=setup();f.state.facts[field]=value;await reject(f,code);});
test('late grant revoked, cancellation, context drift and regrant refuse after await, no success receipt',async()=>{
 for(const [mutate,code] of [
 [s=>s.facts.grantStatus='REVOKED','AUTHORIZATION_REVOKED'],
 [s=>s.facts.invocationStatus='CANCELLED','PERMISSION_DENIED'],
 [s=>s.facts.currentContext.referenceBrief.briefRevision='new','TARGET_FACTS_STALE'],
 [s=>{s.facts.originalBinding.grantEpoch='new';s.facts.currentBinding.grantEpoch='new';},'PERMISSION_DENIED'],
 ]) {const f=setup(undefined,s=>{if(s.calls===2)mutate(s);});await reject(f,code);}
});
test('abort before call and while authority awaits refuses before releasing any BUILD',async()=>{
 const c=new AbortController();c.abort();await reject(setup(),'PERMISSION_DENIED',fixture.request,{signal:c.signal});
 const late=new AbortController();const f=setup(undefined,s=>{if(s.calls===2)late.abort();});await reject(f,'PERMISSION_DENIED',f.request,{signal:late.signal});
});
test('full proposal replay mismatch; replay remains freshly authorized after result',async()=>{
 const f=setup();await f.painter.call(op,f.request);
 const changed=clone(f.request);changed.proposal.materials.stone.nodeName='air';
 await reject(f,'REPLAY_MISMATCH',changed);
 f.state.facts.grantStatus='REVOKED';await reject(f,'AUTHORIZATION_REVOKED');
});
test('async authority service replacement refuses old provider facts',async()=>{
 const f=setup(undefined,s=>{if(s.calls===2)f.painter.authority={verify:async()=>clone(fixture.facts)};});
 await reject(f,'PERMISSION_DENIED');
});
test('missing provider refuses; model cannot pass providerFacts as request or call option',async()=>{
 const p=new ExteriorPainterV2();const response=await p.call(op,fixture.request,{providerFacts:fixture.facts});assert.equal(response.error.code,'PERMISSION_DENIED');
 await reject(setup(),'UNKNOWN_REQUIRED_FIELD',{...fixture.request,providerFacts:fixture.facts});
});
test('raw duplicate proposal key is a typed strict decoder refusal',async()=>{
 await assert.rejects(setup().painter.call(op,'{"requestId":"fixture","proposal":{},"proposal":{}}'),e=>e.code==='NON_CANONICAL_AMBIGUITY'&&e.publicError.mutationState==='NONE');
});
test('existing Painter hut geometry and entrance-facing remain enforced on text proposal',async()=>{
 for(const [doors,ok] of [[['-Z'],true],[['+Z'],false]]) {
 const r=regionRequest();r.referenceBrief.media=[];bindBrief(r);r.intent.orderedTargetRefs=[];r.intentDigest=digestValue('intent',r.intent).sha256;r.proposal=JSON.parse(hutAnswer(doors));
 const f=setup(r);const response=await f.painter.call(op,r);
 if(ok){assert.equal(response.error,null);validateBuildProposalResponse(r,response);}else assert.equal(response.error.code,'BUILD_INVALID');
 }
});

test('concurrent conflicting proposal cannot reserve an in-flight request twice',async()=>{
 let enter, release;
 const entered=new Promise(r=>enter=r), held=new Promise(r=>release=r);
 const f=setup(undefined,async s=>{if(s.calls===2){enter();await held;}});
 const first=f.painter.call(op,f.request);await entered;
 const conflict=clone(f.request);conflict.proposal.boxes.push(clone(conflict.proposal.boxes[0]));
 await reject(f,'REPLAY_MISMATCH',conflict);release();assert.equal((await first).error,null);
});
test('late rejection is not cached as a successful receipt; current retry recomputes',async()=>{
 const f=setup(undefined,s=>{if(s.calls===2)s.facts.grantStatus='REVOKED';});
 await reject(f,'AUTHORIZATION_REVOKED');f.state.facts.grantStatus='CURRENT';
 assert.equal((await f.painter.call(op,f.request)).error,null);
});
test('replay after await must recheck changed source context even when first check succeeded',async()=>{
 const f=setup();await f.painter.call(op,f.request);
 const old=f.authority.verify;f.authority.verify=async(...args)=>{const facts=await old(...args);if(f.state.calls===4)facts.sourceContext.referenceBrief.briefRevision='late-new';return facts;};
 await reject(f,'TARGET_FACTS_STALE');
});
