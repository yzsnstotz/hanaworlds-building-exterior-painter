import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
const root=process.env.PAINTER_TEST_PACKAGE??resolve(new URL('..',import.meta.url).pathname);
const {ExteriorPainterV2}=await import(pathToFileURL(resolve(root,'src/index.mjs')));
import {base,catalogueFixture,imageFixture} from './image-material-fixtures.mjs';
const forbidden=new Proxy({}, {get(){throw new Error('material tool accessed model/world port');}});
const painter=()=>new ExteriorPainterV2({llm:forbidden,attachments:forbidden,localFacts:forbidden});
test('one pure tool reads real PNG pixels and suggests a currently legal indexed material',async()=>{
 const p=painter();assert.equal(typeof p.matchImageMaterials,'function');
 const imageBytes=await imageFixture(),catalogue=catalogueFixture();
 const r=await p.matchImageMaterials({imageBytes,catalogue});
 assert.deepEqual(r.dominant.rgb,[255,0,0]);
 assert.deepEqual(r.material,{nodeName:'mcl_colorblocks:concrete_red',param2:0});
 assert.equal(r.image.width,2);assert.equal(r.image.height,2);
 assert.equal(r.modelCalls,0);assert.equal(r.worldWrites,0);
 assert.ok(Object.isFrozen(r.palette.source));assert.ok(Object.isFrozen(r.match.rgb));
 assert.equal(p.describe().tools.filter(t=>t.name==='MatchImageMaterials').length,1);
});
test('same bytes/palette/catalogue are deterministic; changed pixels change the suggestion',async()=>{
 const p=painter(),imageBytes=await imageFixture(),catalogue=catalogueFixture();
 const a=await p.matchImageMaterials({imageBytes,catalogue});
 const reversed={...catalogue,nodes:Object.fromEntries(Object.entries(catalogue.nodes).reverse())};
 assert.deepEqual(await p.matchImageMaterials({imageBytes,catalogue:reversed}),a);
 assert.deepEqual(await p.matchImageMaterials({imageBytes,catalogue}),a);
 const blue=await p.matchImageMaterials({imageBytes:await imageFixture('png',[0,0,255]),catalogue});
 assert.equal(blue.material.nodeName,'mcl_colorblocks:concrete_blue');
});
test('PNG/JPEG/WebP decode their actual bytes; alpha and equal-weight bin tie are explicit',async()=>{
 const p=painter(),catalogue=catalogueFixture();
 for(const format of ['jpeg','webp']) {
  const r=await p.matchImageMaterials({imageBytes:await imageFixture(format),catalogue});
  assert.equal(r.image.format,format);assert.equal(r.material.nodeName,'mcl_colorblocks:concrete_red');
 }
 const raw=Buffer.from([255,0,0,0,255,0,0,255,0,0,255,255]);
 const bytes=await sharp(raw,{raw:{width:3,height:1,channels:4}}).png().toBuffer();
 const r=await p.matchImageMaterials({imageBytes:bytes,catalogue});
 assert.deepEqual(r.dominant.rgb,[0,0,255]);assert.equal(r.dominant.alphaWeight,255);
});
test('missing/undecodable images and absence of a legal indexed material reject',async()=>{
 const p=painter(),catalogue=catalogueFixture(),imageBytes=await imageFixture();
 for(const bytes of [undefined,Buffer.alloc(0),'https://example.invalid/red.png'])
  await assert.rejects(p.matchImageMaterials({imageBytes:bytes,catalogue}),e=>e.code==='IMAGE_REQUIRED');
 await assert.rejects(p.matchImageMaterials({imageBytes:Buffer.from('red.png'),catalogue}),e=>e.code==='IMAGE_DECODE_FAILED');
 const bad=catalogueFixture();for(const node of Object.values(bad.nodes))node.hasCallbacks=true;
 await assert.rejects(p.matchImageMaterials({imageBytes,catalogue:bad}),e=>e.code==='NO_LEGAL_MATERIAL');
 await assert.rejects(p.matchImageMaterials({imageBytes,catalogue:base}),e=>e.code==='NO_LEGAL_MATERIAL');
});
test('actual installed VoxeLibre texture bytes use the preserved measured index',async()=>{
 const asset=process.env.PAINTER_IMAGE_TEXTURE;
 assert.ok(asset,'gate supplies the actual protected texture input');
 const p=painter(),catalogue={...base,nodes:{'mcl_core:stone':structuredClone(base.nodes['fixture:stone'])}};
 const r=await p.matchImageMaterials({imageBytes:readFileSync(asset),catalogue});
 assert.equal(r.material.nodeName,'mcl_core:stone');assert.ok(r.dominant.rgb.every(c=>c>0&&c<255));
 assert.equal(r.palette.source.gameVersion,'0.92.3');assert.equal(r.palette.source.entries,63);
 assert.equal(r.match.textureSha256,r.image.sha256);
});
