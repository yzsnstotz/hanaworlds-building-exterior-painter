import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {pixels,makeFacts} from './material-sources-fixtures.mjs';
const entry=pathToFileURL(resolve('image-material-panel/engine.mjs'));
let panel;
test('panel engine is available',async()=>{
 await assert.doesNotReject(async()=>{panel=await import(entry);});
});
test('unbound images use labelled sample palette, vary by real pixels and repeat deterministically',async()=>{
 const {matchPanelImage}=panel;
 const red=await pixels([141,94,83]),green=await pixels([75,94,37]),snow=await pixels([222,230,235]);
 const outputs=[];
 for(const image of [red,green,snow,red]) outputs.push(await matchPanelImage({imageBase64:image.toString('base64'),session:null,get:()=>{throw Error('no peer reads for sample');}}));
 assert.equal(outputs[0].paletteLabel,'示例材质表');
 assert.equal(outputs[0].source,'SAMPLE');
 assert.deepEqual(outputs[0],outputs[3]);
 assert.equal(new Set(outputs.slice(0,3).map(x=>x.material.nodeName)).size,3);
 assert.deepEqual(outputs[0].dominant.rgb,[141,94,83]);
 assert.equal(outputs[0].modelCalls,0);assert.equal(outputs[0].worldWrites,0);
});
test('non-image bytes give one reason and do not return a material',async()=>{
 const out=await panel.matchPanelImage({imageBase64:Buffer.from('a plain text file').toString('base64'),session:null,get:()=>null});
 assert.equal(out.ok,false);assert.equal(out.code,'IMAGE_DECODE_FAILED');assert.match(out.reason,/PNG/);assert.equal(out.material,undefined);
});
test('bound world uses Host public material sources and has no sample fallback',async()=>{
 const red=await pixels([255,0,0]);const facts=makeFacts([{name:'base:red',bytes:red}]);
 const local={...facts.currentConnection,selectionRevision:'selection-1'};
 const business={bound:async()=>true,local:async()=>({...local}),materialSources:async()=>({local,connection:facts.currentConnection,catalogue:facts.catalogue,sources:facts.materialSources})};
 const catalogues={read:async()=>facts.catalogue};
 const get=name=>({hanaworldsSkillBusiness:business,hanaworldsCatalogue:catalogues})[name];
 const out=await panel.matchPanelImage({imageBase64:red.toString('base64'),session:{id:'fixture-session'},get,check:async()=>{}});
 assert.equal(out.source,'CURRENT_WORLD');assert.equal(out.material.nodeName,'base:red');assert.equal(out.paletteLabel,'当前世界材质');
 const broken={...business,materialSources:async()=>{throw Error('MATERIAL_SOURCES_UNAVAILABLE');}};
 const error=await panel.matchPanelImage({imageBase64:red.toString('base64'),session:{id:'fixture-session'},get:n=>n==='hanaworldsSkillBusiness'?broken:get(n),check:async()=>{}});
 assert.equal(error.ok,false);assert.equal(error.source,undefined);assert.equal(error.code,'MATERIAL_SOURCES_UNAVAILABLE');
});
test('selection changes during matching do not release a stale result',async()=>{
 const bytes=await pixels(),facts=makeFacts([{name:'base:red',bytes}]);let reads=0;
 const local={...facts.currentConnection,selectionRevision:'selection-1'};
 const business={bound:async()=>true,local:async()=>({...local,selectionRevision:++reads>1?'selection-2':'selection-1'}),materialSources:async()=>({local,connection:facts.currentConnection,catalogue:facts.catalogue,sources:facts.materialSources})};
 const catalogues={read:async()=>facts.catalogue};
 const out=await panel.matchPanelImage({imageBase64:bytes.toString('base64'),session:{id:'fixture-session'},get:n=>({hanaworldsSkillBusiness:business,hanaworldsCatalogue:catalogues})[n],check:async()=>{}});
 assert.equal(out.ok,false);assert.equal(out.code,'CURRENT_WORLD_MISMATCH');
});
