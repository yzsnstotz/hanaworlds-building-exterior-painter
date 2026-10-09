import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {root,contracts,contractPackage,fixture,pixels,makeFacts,hash} from './material-sources-fixtures.mjs';
import {ADMITTED_CONTRACTS} from '../tools/admitted-contracts.mjs';
const api=await import(pathToFileURL(resolve(root,'src/index.mjs')));
const forbidden=new Proxy({}, {get(){throw new Error('pure consumer accessed an external port');}});
function painter(){return new api.ExteriorPainterV2({llm:forbidden,attachments:forbidden,localFacts:forbidden});}
test('current-world public consumer measures actual pixels and supplied base:* texture bytes',async()=>{
 const p=painter();assert.equal(typeof p.matchCurrentImageMaterials,'function');
 assert.equal(typeof api.matchCurrentImageMaterials,'function');
 const red=await pixels(),blue=await pixels([0,0,255]);
 const facts=makeFacts([{name:'base:blue',bytes:blue},{name:'base:red',bytes:red}]);
 const r=await p.matchCurrentImageMaterials({imageBytes:red,...facts});
 assert.deepEqual(r.dominant.rgb,[255,0,0]);assert.deepEqual(r.material,{nodeName:'base:red',param2:0});
 assert.equal(r.match.distance,0);assert.equal(r.match.texture.bytesDigest,hash(red));
 assert.equal(r.sourceRevision,facts.materialSources.snapshot.sourceRevision);
 assert.equal(r.catalogueDigest,facts.materialSources.snapshot.catalogueDigest);
 assert.equal(r.sourceBasis,'SERVER_ASSET_ONLY');assert.equal(r.modelCalls,0);assert.equal(r.worldWrites,0);
 assert.ok(Object.isFrozen(r));assert.ok(Object.isFrozen(r.match.rgb));
 const imageTools=p.describe().tools.filter(t=>typeof t.method==='string');assert.equal(imageTools.length,1);assert.equal(imageTools[0].method,'matchCurrentImageMaterials');assert.ok(!p.describe().tools.some(t=>t.method==='matchImageMaterials'));
});
test('deterministic node/param2 ties and changed sourceRevision never reuse an old colour',async()=>{
 const p=painter();assert.equal(typeof p.matchCurrentImageMaterials,'function');
 const red=await pixels(),blue=await pixels([0,0,255]);
 const f=makeFacts([{name:'base:z',bytes:red},{name:'base:a',bytes:red,params:[3,1]}]);
 const a=await p.matchCurrentImageMaterials({imageBytes:red,...f});assert.deepEqual(a.material,{nodeName:'base:a',param2:1});
 assert.deepEqual(await p.matchCurrentImageMaterials({imageBytes:red,...f}),a);
 const changed=makeFacts([{name:'base:z',bytes:red},{name:'base:a',bytes:blue,params:[3,1]}]);
 const b=await p.matchCurrentImageMaterials({imageBytes:red,...changed});
 assert.equal(b.material.nodeName,'base:z');assert.notEqual(b.sourceRevision,a.sourceRevision);
 assert.equal(b.catalogueDigest,a.catalogueDigest);
 // Provider mutates its original bytes immediately after invocation: copied admission survives.
 const pending=p.matchCurrentImageMaterials({imageBytes:new Uint8Array(red),...changed});
 changed.materialSources.textures[0].bytes.fill(0);assert.deepEqual(await pending,b);
 await assert.rejects(p.matchCurrentImageMaterials({imageBytes:red,...changed}),e=>e.code==='NON_CANONICAL_AMBIGUITY');
});
test('fresh connection, Catalogue, source revision and typed bytes are mandatory',async()=>{
 const p=painter();assert.equal(typeof p.matchCurrentImageMaterials,'function');
 const imageBytes=await pixels(),f=makeFacts([{name:'base:red',bytes:imageBytes}]);
 await assert.rejects(p.matchCurrentImageMaterials({imageBytes,...f,currentConnection:{...f.currentConnection,connectionIncarnationRef:'other'}}),e=>e.code==='CURRENT_WORLD_MISMATCH');
 const catalogue=structuredClone(f.catalogue);catalogue.gameRevision='changed';
 await assert.rejects(p.matchCurrentImageMaterials({imageBytes,...f,catalogue}),e=>e.code==='CATALOGUE_MISMATCH');
 const wrong=structuredClone(f.materialSources);wrong.snapshot.sourceRevision='0'.repeat(64);
 await assert.rejects(p.matchCurrentImageMaterials({imageBytes,...f,materialSources:wrong}),e=>e.code==='NON_CANONICAL_AMBIGUITY');
 const json=structuredClone(f.materialSources);json.textures[0].bytes=[...json.textures[0].bytes];
 await assert.rejects(p.matchCurrentImageMaterials({imageBytes,...f,materialSources:json}),e=>!!e.code);
});
test('KNOWN texture cannot override static UNKNOWN; texture UNKNOWN has no fallback palette',async()=>{
 const p=painter();assert.equal(typeof p.matchCurrentImageMaterials,'function');const imageBytes=await pixels();
 const unknownStatic=makeFacts([{name:'base:unsafe',bytes:imageBytes,staticUnknown:true}]);
 assert.throws(()=>contracts.validateStaticMaterials({hint:{nodeName:'base:unsafe',param2:0}},unknownStatic.catalogue),e=>e.code==='UNSUPPORTED_MUTATION_SEMANTICS');
 await assert.rejects(p.matchCurrentImageMaterials({imageBytes,...unknownStatic}),e=>e.code==='MATERIAL_SOURCES_UNAVAILABLE');
 const unknownTexture=makeFacts([{name:'mcl_colorblocks:concrete_red',unknown:true}]);
 await assert.rejects(p.matchCurrentImageMaterials({imageBytes,...unknownTexture}),e=>e.code==='MATERIAL_SOURCES_UNAVAILABLE');
 const mixed=makeFacts([{name:'base:unsafe',bytes:imageBytes,staticUnknown:true},{name:'base:blue',bytes:await pixels([0,0,255])}]);
 const r=await p.matchCurrentImageMaterials({imageBytes,...mixed});assert.equal(r.material.nodeName,'base:blue');
 assert.equal(r.sources.staticIneligibleVariants,1);assert.equal(r.sources.measuredLegalVariants,1);
});
test('actual image and known texture decoding refuse corrupt or misdeclared pixels',async()=>{
 const p=painter();assert.equal(typeof p.matchCurrentImageMaterials,'function');const imageBytes=await pixels();
 const f=makeFacts([{name:'base:red',bytes:imageBytes}]);
 await assert.rejects(p.matchCurrentImageMaterials({...f}),e=>e.code==='IMAGE_REQUIRED');
 await assert.rejects(p.matchCurrentImageMaterials({imageBytes:Buffer.from('red.png'),...f}),e=>e.code==='IMAGE_DECODE_FAILED');
 const bad=makeFacts([{name:'base:bad',bytes:Buffer.from('bad.png')}]);
 await assert.rejects(p.matchCurrentImageMaterials({imageBytes,...bad}),e=>e.code==='MATERIAL_TEXTURE_UNAVAILABLE');
 const mismatch=makeFacts([{name:'base:bad',bytes:imageBytes,mediaType:'image/jpeg'}]);
 await assert.rejects(p.matchCurrentImageMaterials({imageBytes,...mismatch}),e=>e.code==='MATERIAL_TEXTURE_UNAVAILABLE');
});
test('actual preserved texture bytes are measured under explicit public fixture binding',async()=>{
 const p=painter();assert.equal(typeof p.matchCurrentImageMaterials,'function');
 const imageBytes=readFileSync(process.env.PAINTER_IMAGE_TEXTURE);
 const f=makeFacts([{name:'base:actual-texture-fixture',bytes:imageBytes}]);
 const r=await p.matchCurrentImageMaterials({imageBytes,...f});
 assert.equal(r.material.nodeName,'base:actual-texture-fixture');assert.equal(r.match.texture.bytesDigest,hash(imageBytes));
 assert.ok(r.match.rgb.every(c=>c>0&&c<255));assert.ok(!Object.hasOwn(r,'palette'));
});
test('resolved contracts handshake and media-bearing proposal contract are available',async()=>{
 assert.equal(typeof painter().matchCurrentImageMaterials,'function');
 assert.equal(api.contractHandshake.contracts,`${ADMITTED_CONTRACTS.name}@${contractPackage().version}`);
 assert.equal(contracts.checkContractsVersion(api.contractHandshake.contracts).result,'CONTRACTS_MAJOR_MATCH');
 assert.equal(contracts.checkContractHandshake(api.contractHandshake).result,'HANDSHAKE_VERSION_MATCH');
 const bytes=await pixels(),context=structuredClone(fixture.facts.sourceContext);
 context.referenceBrief.media=[{attachmentRef:'fixture-current-image',storedBytesDigest:hash(bytes),
  projectionVariantId:null,projectionBytesDigest:null,mediaType:'image/png',bytes:bytes.length,width:2,height:1}];
 context.referenceBriefDigest=contracts.digestValue('reference-brief',context.referenceBrief).sha256;
 context.intent.referenceBriefDigest=context.referenceBriefDigest;
 context.intentDigest=contracts.digestValue('intent',context.intent).sha256;
 assert.equal(contracts.validateType('BuildProposalContext',context).referenceBrief.media.length,1);
 assert.equal(contractPackage().name,ADMITTED_CONTRACTS.name);
});
