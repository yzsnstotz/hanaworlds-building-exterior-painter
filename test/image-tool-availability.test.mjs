import test from 'node:test';
import assert from 'node:assert/strict';
import { Painter as runtime } from './painter-under-test.mjs';
const {apply, matchCurrentImageMaterials, ImageMaterialError} = runtime;
import {makeFacts, pixels} from './material-sources-fixtures.mjs';

function registeredTool() {
 const provided=new Map();
 const painter=apply({provide:(name,value)=>provided.set(name,value),
  get(){throw new Error('image tool read a peer service');}});
 const tool=provided.get('hanaworlds_image_material');
 assert.ok(Object.isFrozen(tool));
 return {painter,tool};
}
const unavailable=error=>error instanceof ImageMaterialError
 && error.code==='CAPABILITY_UNAVAILABLE' && error.mutationState==='NONE';

test('registered image tool refuses an absent source, then uses supplied facts without caching them',async()=>{
 const {tool}=registeredTool();
 await assert.rejects(tool.execute(),unavailable);
 const imageBytes=await pixels(),facts=makeFacts([{name:'opaque-wall',bytes:imageBytes}]);
 const {materialSources,...withoutSource}=facts;
 for(const input of [{imageBytes,...withoutSource},
  {imageBytes,...withoutSource,materialSources:undefined},
  {imageBytes,...withoutSource,materialSources:null}]) {
  await assert.rejects(tool.execute(input),unavailable);
 }
 const result=await tool.execute({imageBytes,...facts});
 assert.deepEqual(result.material,{materialRef:'opaque-wall',orientation:0});
 assert.equal(result.match.distance,0);
 assert.equal(result.modelCalls,0);assert.equal(result.worldWrites,0);
 await assert.rejects(tool.execute({imageBytes,...withoutSource}),unavailable);
});

test('direct consumer and painter method expose the same absent-source capability refusal',async()=>{
 const {painter}=registeredTool();
 await assert.rejects(matchCurrentImageMaterials(),unavailable);
 await assert.rejects(painter.matchCurrentImageMaterials({materialSources:null}),unavailable);
});

test('no legal source candidate refuses capability before image decoding',async()=>{
 const {tool}=registeredTool();
 const texture=await pixels();
 for(const facts of [makeFacts([]),makeFacts([{name:'opaque-unknown',unknown:true}]),
  makeFacts([{name:'opaque-unsafe',bytes:texture,staticUnknown:true}])]) {
  await assert.rejects(tool.execute({...facts,imageBytes:Buffer.from('invalid image')}),unavailable);
 }
});

test('supplied malformed or stale sources retain their published contract refusal',async()=>{
 const {tool}=registeredTool();
 const imageBytes=await pixels(),facts=makeFacts([{name:'opaque-wall',bytes:imageBytes}]);
 for(const materialSources of [{},false,{snapshot:facts.materialSources.snapshot}]) {
  await assert.rejects(tool.execute({imageBytes,...facts,materialSources}),error=>error.code==='SCHEMA_INVALID');
 }
 await assert.rejects(tool.execute({imageBytes,...facts,
  currentConnection:{...facts.currentConnection,connectionIncarnationRef:'changed'}}),
  error=>error.code==='CURRENT_WORLD_MISMATCH');
});
