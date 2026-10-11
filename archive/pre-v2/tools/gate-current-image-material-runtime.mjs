import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {pixels,makeFacts,hash} from '../test/material-sources-fixtures.mjs';
const [installed,app,evidence,texture]=process.argv.slice(2),url=p=>pathToFileURL(resolve(p));
const pkg=await import(url(join(installed,'src/index.mjs')));
const sharpFile=createRequire(join(installed,'package.json')).resolve('sharp');
const {default:sharp}=await import(url(sharpFile));
const cordisFile=join(app,'Contents/Resources/hanaworlds-dsh/node_modules/@deepseek-ai/cordis/lib/index.js');
const {Context}=await import(url(cordisFile));
const ctx=new Context();let forbiddenCalls=0,legacyPlannerCalls=0;
const forbidden=new Proxy({}, {get(target,key){if(typeof key==='symbol')return Reflect.get(target,key);forbiddenCalls++;throw new Error('pure tool accessed an external port');}});
for(const name of ['llm','attachments','hanaworldsPainterLocalFacts','world','canvas','adapter'])ctx.provide(name,forbidden);
const fiber=ctx.plugin(pkg.default,pkg.Config({})),results=[];
try{
 await fiber.await();const service=ctx.get(pkg.SERVICE);
 assert.equal(service.describe().tools[0].method,'matchCurrentImageMaterials');
 assert.equal(service.handshake().contracts,'hanaworlds-contracts@0.4.2');
 service.call=()=>{legacyPlannerCalls++;throw new Error('planner or proposal invoked during pure matching');};
 const red=await pixels(),blue=await pixels([0,0,255]);
 writeFileSync(join(evidence,'authored-red.png'),red);writeFileSync(join(evidence,'authored-blue.png'),blue);
 const facts=makeFacts([{name:'base:blue',bytes:blue},{name:'base:red',bytes:red}]);
 const result=await service.matchCurrentImageMaterials({imageBytes:red,...facts});
 assert.deepEqual(result.material,{nodeName:'base:red',param2:0});
 assert.deepEqual(await service.matchCurrentImageMaterials({imageBytes:red,...facts}),result);
 results.push({mediaSource:'AUTHORED_ACTUAL_PNG_PIXELS',publicSourceBinding:'FIXTURE',result});
 const bytes=readFileSync(texture),real=makeFacts([{name:'base:actual-texture-fixture',bytes}]);
 const actual=await service.matchCurrentImageMaterials({imageBytes:bytes,...real});
 assert.equal(actual.match.texture.bytesDigest,actual.image.sha256);
 results.push({mediaSource:'ACTUAL_PRESERVED_VOXELIBRE_0.92.3_TEXTURE_BYTES',publicSourceBinding:'FIXTURE_NOT_CURRENT_GAME',result:actual});
 const unknown=makeFacts([{name:'base:static-unknown',bytes,staticUnknown:true}]);
 await assert.rejects(service.matchCurrentImageMaterials({imageBytes:bytes,...unknown}),e=>e.code==='MATERIAL_SOURCES_UNAVAILABLE');
 assert.equal(forbiddenCalls,0);assert.equal(legacyPlannerCalls,0);
 const receipt={evidence:'REAL_OWN_INSTALLED_PIXEL_AND_CORDIS_RUNTIME; PUBLIC_MATERIAL_SOURCES/CATALOGUE/HOST_BINDING_FIXTURE',
  node:process.version,painterVersion:JSON.parse(readFileSync(join(installed,'package.json'))).version,
  sharpFile,sharpVersions:sharp.versions,cordisFile,cordisSha256:hash(readFileSync(cordisFile)),results,
  forbiddenCalls,legacyPlannerCalls,modelCalls:0,worldWrites:0,
  currentProductGame:'UNKNOWN',fullApp:'NOT_RUN',realModel:'NOT_RUN',realWorld:'NOT_RUN',undo:'NOT_RUN',realUI:'NOT_RUN'};
 writeFileSync(join(evidence,'runtime-receipt.json'),JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify(receipt,null,2));
}finally{await fiber.dispose();}
assert.equal(ctx.get(pkg.SERVICE),undefined);
