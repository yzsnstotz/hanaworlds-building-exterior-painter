import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {catalogueFixture,imageFixture,base} from '../test/image-material-fixtures.mjs';
const [installed,app,evidence,texture]=process.argv.slice(2),url=p=>pathToFileURL(resolve(p));
const pkg=await import(url(join(installed,'src/index.mjs')));
const sharpFile=createRequire(join(installed,'package.json')).resolve('sharp');
const {default:sharp}=await import(url(sharpFile));
const cordisFile=join(app,'Contents/Resources/hanaworlds-dsh/node_modules/@deepseek-ai/cordis/lib/index.js');
const {Context}=await import(url(cordisFile));
const ctx=new Context();let forbiddenCalls=0;
const forbidden=new Proxy({}, {get(){forbiddenCalls++;throw new Error('new material tool accessed model/legacy/world port');}});
for(const name of ['llm','attachments','hanaworldsPainterLocalFacts','world','canvas','adapter'])ctx.provide(name,forbidden);
const fiber=ctx.plugin(pkg.default,pkg.Config({})),results=[];
try {
 await fiber.await();const service=ctx.get(pkg.SERVICE);
 assert.equal(service.describe().tools[0].name,'MatchImageMaterials');
 service.call=()=>{throw new Error('legacy planner or proposal operation executed during pixel matching');};
 for(const format of ['png','jpeg','webp']) {
  const bytes=await imageFixture(format);writeFileSync(join(evidence,`authored-pixels.${format}`),bytes);
  const result=await service.matchImageMaterials({imageBytes:bytes,catalogue:catalogueFixture()});
  assert.equal(result.material.nodeName,'mcl_colorblocks:concrete_red');
  assert.deepEqual(await service.matchImageMaterials({imageBytes:bytes,catalogue:catalogueFixture()}),result);
  results.push({mediaSource:'AUTHORED_2x2_PIXEL_FIXTURE_ACTUAL_BYTES',format,result});
 }
 const bytes=readFileSync(texture),catalogue={...base,nodes:{'mcl_core:stone':structuredClone(base.nodes['fixture:stone'])}};
 const actual=await service.matchImageMaterials({imageBytes:bytes,catalogue});
 assert.equal(actual.match.textureSha256,actual.image.sha256);
 results.push({mediaSource:'ACTUAL_VOXELIBRE_0.92.3_TEXTURE',result:actual});
 await assert.rejects(service.matchImageMaterials({imageBytes:bytes,catalogue:base}),e=>e.code==='NO_LEGAL_MATERIAL');
 assert.equal(forbiddenCalls,0);
 const receipt={evidence:'REAL_OWN_INSTALLED_RASTER_AND_CORDIS_RUNTIME + FIXTURE_CURRENT_CATALOGUE_AND_HOST_MEDIA_BINDING',
  node:process.version,painterVersion:JSON.parse(readFileSync(join(installed,'package.json'))).version,
  sharpFile,sharpVersions:sharp.versions,cordisFile,cordisSha256:createHash('sha256').update(readFileSync(cordisFile)).digest('hex'),
  results,forbiddenCalls,modelCalls:0,worldWrites:0,legacyPlannerCalls:0,
  fullApp:'NOT_RUN',realModel:'NOT_RUN',realWorld:'NOT_RUN',undo:'NOT_RUN'};
 writeFileSync(join(evidence,'runtime-receipt.json'),JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify(receipt,null,2));
}finally{await fiber.dispose();}
assert.equal(ctx.get(pkg.SERVICE),undefined);
