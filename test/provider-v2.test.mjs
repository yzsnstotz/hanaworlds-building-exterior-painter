import test from 'node:test';
import assert from 'node:assert/strict';
import { apply, Config, SERVICE, IMAGE_MATERIAL_TOOL, ExteriorPainterV2 } from '../src/index.mjs';
import { contractFixture, contracts } from '../src/contract-package.mjs';
import { planGeometry } from '../src/planner.mjs';
const fixture=contractFixture('main');
test('plugin registers painter and the named image material tool; configuration has no model route',()=>{
 const provided=new Map(),ctx={provide:(name,value)=>provided.set(name,value)};
 const painter=apply(ctx);assert.equal(provided.get(SERVICE),painter);
 const tool=provided.get('hanaworlds_image_material');assert.equal(tool.name,IMAGE_MATERIAL_TOOL.name);
 assert.equal(typeof tool.execute,'function');assert.deepEqual(Config({}),{});
 assert.deepEqual(painter.describe().operations,['ValidateBuildProposal','ValidateRegionProposal']);
});
test('archived CreateBuildPlan cannot call a model',async()=>{
 const forbidden=new Proxy({}, {get(){throw new Error('model accessed');}});
 const p=new ExteriorPainterV2({llm:forbidden,attachments:forbidden});
 await assert.rejects(p.call('CreateBuildPlan',fixture.request),e=>e.code==='UNSUPPORTED_OPERATION');
});
test('geometry and final effects retain only neutral material specs',()=>{
 const geometry=planGeometry(fixture.request);
 assert.deepEqual(geometry.effects,[{geometryProfile:'voxel-grid/v1',position:[0,1,3],materialRef:'fixture:stone',orientation:0}]);
 assert.doesNotMatch(JSON.stringify(geometry.effects),/nodeName|param2/);
});
test('replay is exact and current provider replacement refuses release',async()=>{
 let reads=0;const facts=structuredClone(fixture.facts);
 const p=new ExteriorPainterV2({localFacts:{async read(){reads++;return structuredClone(facts);}}});
 const response=await p.call('ValidateBuildProposal',fixture.request);
 assert.deepEqual(response,fixture.response);
 assert.deepEqual(await p.call('ValidateBuildProposal',JSON.stringify(fixture.request)),response);
 assert.equal(reads,4);
 const changed=structuredClone(fixture.request);changed.proposal.boxes.push(structuredClone(changed.proposal.boxes[0]));
 assert.equal((await p.call('ValidateBuildProposal',changed)).error.code,'REPLAY_MISMATCH');
 const q=new ExteriorPainterV2();q.localFacts={async read(){q.localFacts={read:async()=>structuredClone(facts)};return structuredClone(facts);}};
 assert.equal((await q.call('ValidateBuildProposal',fixture.request)).error.code,'CURRENT_WORLD_MISMATCH');
 contracts.validateBuildProposalResponse(fixture.request,response);
});
test('world-source refs and neutral tags work with renamed empty/material vocabulary and opaque extension',async()=>{
 const request=structuredClone(fixture.request),cat=request.catalogue;
 cat.materials={'opaque-empty':{...cat.materials.air,extension:{}},'opaque-wall':{...cat.materials['fixture:stone'],extension:{}}};
 cat.emptyMaterialRef='opaque-empty';request.proposal.materials.stone.materialRef='opaque-wall';
 request.targetFacts.occupiedCells[0].materialRef='opaque-wall';
 const digest=(kind,value)=>contracts.digestValue(kind,value).sha256;
 request.targetFacts.catalogueDigest=digest('catalogue',cat);
 request.targetFactsDigest=digest('target-facts',request.targetFacts);
 request.regionInspection.targetFacts=structuredClone(request.targetFacts);
 request.regionInspection.targetFactsDigest=request.targetFactsDigest;
 const facts=structuredClone(fixture.facts),ctx=Object.fromEntries(Object.keys(facts.sourceContext).map(k=>[k,structuredClone(request[k])]));
 facts.sourceContext=ctx;facts.currentContext=structuredClone(ctx);
 const p=new ExteriorPainterV2({localFacts:{read:async()=>structuredClone(facts)}});
 const response=await p.call('ValidateBuildProposal',request);
 assert.equal(response.error,null);assert.equal(response.result.build.materials.stone.materialRef,'opaque-wall');
 contracts.validateBuildProposalResponse(request,response);
});
