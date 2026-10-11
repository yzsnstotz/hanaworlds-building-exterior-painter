import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { ExteriorPainterV2, IMAGE_MATERIAL_TOOL } from '../src/index.mjs';
import { contractFixture } from '../src/contract-package.mjs';
const forbidden = new Proxy({}, {get(){throw new Error('tool touched model/world');}});
const painter = () => new ExteriorPainterV2({llm:forbidden,attachments:forbidden,localFacts:forbidden});
function facts() {
 const catalogue=structuredClone(contractFixture('main').request.catalogue);
 const tags=catalogue.materials['fixture:stone'];
 catalogue.emptyMaterialRef='empty-ref';
 catalogue.materials={'empty-ref':catalogue.materials.air,'mat-a':structuredClone(tags),'mat-z':structuredClone(tags)};
 return {catalogue,materialColours:[{materialRef:'mat-z',orientation:0,rgb:[255,0,0]},{materialRef:'mat-a',orientation:0,rgb:[0,0,255]}]};
}
async function image(format='png',rgb=[255,0,0]) {
 return sharp(Buffer.from([...rgb,255,...rgb,255]),{raw:{width:2,height:1,channels:4}})[format]().toBuffer();
}
test('registered hanaworlds_image_material matches supplied opaque material colours without model/world',async()=>{
 const p=painter(),r=await p.matchImageMaterials({imageBytes:await image(),...facts()});
 assert.deepEqual(r.dominant.rgb,[255,0,0]); assert.deepEqual(r.material,{materialRef:'mat-z',orientation:0});
 assert.equal(r.match.distance,0); assert.equal(r.match.algorithm,'CIEDE2000');
 assert.equal(r.modelCalls,0); assert.equal(r.worldWrites,0); assert.ok(Object.isFrozen(r.match.rgb));
 assert.equal(IMAGE_MATERIAL_TOOL.name,'hanaworlds_image_material');
 assert.equal(p.describe().tools.filter(t=>t.name===IMAGE_MATERIAL_TOOL.name).length,1);
 assert.doesNotMatch(JSON.stringify(r),/nodeName|param2|mcl_/);
});
test('source colours are snapshotted before await and ties use materialRef then neutral orientation',async()=>{
 const p=painter(),f=facts();f.catalogue.materials['mat-a'].orientations=[1,3];
 f.materialColours=[{materialRef:'mat-z',orientation:0,rgb:[255,0,0]},
  {materialRef:'mat-a',orientation:3,rgb:[255,0,0]},{materialRef:'mat-a',orientation:1,rgb:[255,0,0]}];
 const imageBytes=await image(),pending=p.matchImageMaterials({imageBytes,...f});
 f.materialColours[2].rgb.fill(0);
 assert.deepEqual((await pending).material,{materialRef:'mat-a',orientation:1});
 const a=await p.matchImageMaterials({imageBytes,...f});
 assert.deepEqual(await p.matchImageMaterials({imageBytes,...f,materialColours:[...f.materialColours].reverse()}),a);
});
test('PNG/JPEG/WebP decode actual pixels; transparent bins and equal weights are deterministic',async()=>{
 for(const format of ['png','jpeg','webp']){
  const r=await painter().matchImageMaterials({imageBytes:await image(format),...facts()});
  assert.equal(r.image.format,format);assert.equal(r.material.materialRef,'mat-z');
 }
 const imageBytes=await sharp(Buffer.from([255,0,0,0,255,0,0,255,0,0,255,255]),{raw:{width:3,height:1,channels:4}}).png().toBuffer();
 const r=await painter().matchImageMaterials({imageBytes,...facts()});assert.deepEqual(r.dominant.rgb,[0,0,255]);
});
test('missing colours, malformed RGB, unknown or non-placeable materials refuse without guessing',async()=>{
 const imageBytes=await image(),p=painter();
 for(const materialColours of [undefined,[],[{materialRef:'mat-a',orientation:0,rgb:new Array(3)}],[{materialRef:'mat-a',orientation:0,rgb:[256,0,0]}],
  [{materialRef:'missing',orientation:0,rgb:[255,0,0]}]])
  await assert.rejects(p.matchImageMaterials({imageBytes,...facts(),materialColours}),e=>e.code==='CAPABILITY_UNAVAILABLE'||e.code==='CATALOGUE_MISMATCH');
 const f=facts();for(const tags of Object.values(f.catalogue.materials))tags.placeable=false;
 await assert.rejects(p.matchImageMaterials({imageBytes,...f}),e=>e.code==='CAPABILITY_UNAVAILABLE');
});
test('missing, corrupt and transparent image bytes refuse',async()=>{
 for(const imageBytes of [undefined,Buffer.alloc(0),'https://invalid/image.png'])
  await assert.rejects(painter().matchImageMaterials({imageBytes,...facts()}),e=>e.code==='IMAGE_REQUIRED');
 await assert.rejects(painter().matchImageMaterials({imageBytes:Buffer.from('bad'),...facts()}),e=>e.code==='IMAGE_DECODE_FAILED');
 const imageBytes=await sharp(Buffer.from([255,0,0,0]),{raw:{width:1,height:1,channels:4}}).png().toBuffer();
 await assert.rejects(painter().matchImageMaterials({imageBytes,...facts()}),e=>e.code==='NO_VISIBLE_PIXELS');
});
test('CIEDE2000 picks the perceptual closest material when raw RGB distance would choose another',async()=>{
 const f=facts();f.materialColours=[{materialRef:'mat-a',orientation:0,rgb:[200,100,80]},
  {materialRef:'mat-z',orientation:0,rgb:[220,210,10]}];
 const r=await painter().matchImageMaterials({imageBytes:await image('png',[20,180,50]),...f});
 assert.equal(r.material.materialRef,'mat-z');assert.ok(Math.abs(r.match.distance-27.697882715408277)<1e-9);
});
