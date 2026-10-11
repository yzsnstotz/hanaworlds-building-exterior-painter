import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { Painter as api } from './painter-under-test.mjs';
import {pixels,makeFacts} from './material-sources-fixtures.mjs';
const forbidden = new Proxy({}, {get(){throw new Error('tool touched model/world');}});
const painter = () => new api.ExteriorPainterV2({llm:forbidden,attachments:forbidden,localFacts:forbidden});
async function facts() {
 return makeFacts([{name:'mat-z',bytes:await pixels()}, {name:'mat-a',bytes:await pixels([0,0,255])}]);
}
async function image(format='png',rgb=[255,0,0]) {
 return sharp(Buffer.from([...rgb,255,...rgb,255]),{raw:{width:2,height:1,channels:4}})[format]().toBuffer();
}
test('registered hanaworlds_image_material consumes ReadMaterialSources opaque refs without model/world',async()=>{
 const provided=new Map();
 const p=api.apply({provide:(name,value)=>provided.set(name,value),get:()=>forbidden});
 const tool=provided.get('hanaworlds_image_material');
 const r=await tool.execute({imageBytes:await image(),...await facts()});
 assert.deepEqual(r.dominant.rgb,[255,0,0]); assert.deepEqual(r.material,{materialRef:'mat-z',orientation:0});
 assert.equal(r.match.distance,0); assert.equal(r.match.algorithm,'CIEDE2000');
 assert.equal(r.modelCalls,0); assert.equal(r.worldWrites,0); assert.ok(Object.isFrozen(r.match.rgb));
 assert.equal(tool.method,'matchCurrentImageMaterials');
 assert.equal(p.describe().tools.filter(t=>t.name===api.IMAGE_MATERIAL_TOOL.name).length,1);
 assert.doesNotMatch(JSON.stringify(r),/nodeName|param2|mcl_/);
});
test('legacy matchImageMaterials export and RGB-only entry point are removed',async()=>{
 const p=painter();
 assert.equal(Object.hasOwn(api,'matchImageMaterials'),false);
 assert.equal(typeof p.matchImageMaterials,'undefined');
 const provided=new Map();api.apply({provide:(name,value)=>provided.set(name,value)});
 await assert.rejects(provided.get('hanaworlds_image_material').execute({imageBytes:await image(),
  catalogue:(await facts()).catalogue,materialColours:[{materialRef:'mat-z',orientation:0,rgb:[255,0,0]}]}),e=>!!e.code);
});
test('source colours are snapshotted before await and ties use materialRef then neutral orientation',async()=>{
 const imageBytes=await image(),p=painter();
 const f=makeFacts([{name:'mat-z',bytes:imageBytes},{name:'mat-a',bytes:imageBytes,params:[3,1]}]);
 const expected=await p.matchCurrentImageMaterials({imageBytes,...f});
 const pending=p.matchCurrentImageMaterials({imageBytes,...f});
 f.materialSources.textures[0].bytes.fill(0);
 const r=await pending;
 assert.deepEqual(r.material,{materialRef:'mat-a',orientation:1});
 assert.deepEqual(r,expected);assert.equal(r.sources.measuredTextures,1);
});
test('PNG/JPEG/WebP decode actual pixels; transparent bins and equal weights are deterministic',async()=>{
 for(const format of ['png','jpeg','webp']){
  const r=await painter().matchCurrentImageMaterials({imageBytes:await image(format),...await facts()});
  assert.equal(r.image.format,format);assert.equal(r.material.materialRef,'mat-z');
 }
 const imageBytes=await sharp(Buffer.from([255,0,0,0,255,0,0,255,0,0,255,255]),{raw:{width:3,height:1,channels:4}}).png().toBuffer();
 const r=await painter().matchCurrentImageMaterials({imageBytes,...await facts()});assert.deepEqual(r.dominant.rgb,[0,0,255]);
});
test('missing source or connection and non-placeable materials refuse without guessing',async()=>{
 const imageBytes=await image(),p=painter(),f=await facts();
 await assert.rejects(p.matchCurrentImageMaterials({imageBytes,catalogue:f.catalogue,currentConnection:f.currentConnection}),e=>!!e.code);
 await assert.rejects(p.matchCurrentImageMaterials({imageBytes,catalogue:f.catalogue,materialSources:f.materialSources}),e=>!!e.code);
 const unknown=makeFacts([{name:'opaque-unknown',unknown:true}]);
 await assert.rejects(p.matchCurrentImageMaterials({imageBytes,...unknown}),e=>e.code==='CAPABILITY_UNAVAILABLE');
 const unsafe=makeFacts([{name:'opaque-unsafe',bytes:imageBytes,staticUnknown:true}]);
 await assert.rejects(p.matchCurrentImageMaterials({imageBytes,...unsafe}),e=>e.code==='CAPABILITY_UNAVAILABLE');
});
test('missing, corrupt and transparent image bytes refuse',async()=>{
 const f=await facts();
 for(const imageBytes of [undefined,Buffer.alloc(0),'https://invalid/image.png'])
  await assert.rejects(painter().matchCurrentImageMaterials({imageBytes,...f}),e=>e.code==='IMAGE_REQUIRED');
 await assert.rejects(painter().matchCurrentImageMaterials({imageBytes:Buffer.from('bad'),...f}),e=>e.code==='IMAGE_DECODE_FAILED');
 const imageBytes=await sharp(Buffer.from([255,0,0,0]),{raw:{width:1,height:1,channels:4}}).png().toBuffer();
 await assert.rejects(painter().matchCurrentImageMaterials({imageBytes,...f}),e=>e.code==='NO_VISIBLE_PIXELS');
});
test('CIEDE2000 picks the perceptual closest source material when raw RGB distance would choose another',async()=>{
 const f=makeFacts([{name:'mat-a',bytes:await pixels([200,100,80])},
  {name:'mat-z',bytes:await pixels([220,210,10])}]);
 const r=await painter().matchCurrentImageMaterials({imageBytes:await image('png',[20,180,50]),...f});
 assert.equal(r.material.materialRef,'mat-z');assert.ok(Math.abs(r.match.distance-27.697882715408277)<1e-9);
});
