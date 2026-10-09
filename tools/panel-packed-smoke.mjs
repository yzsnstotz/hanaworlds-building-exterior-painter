// SOURCE/FIXTURE: isolated npm tar installation and actual public Cordis/Gateway.
// No product profile, renderer, model, Adapter or world is used by this check.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const stage=resolve(process.argv[2]),receiptPath=resolve(process.argv[3]);
const require=createRequire(join(stage,'package.json'));
const load=async name=>import(pathToFileURL(require.resolve(name)));
const {Context}=await load('@deepseek-ai/cordis');
const {TypertRegistry}=await load('@deepseek-ai/dsh-typert-registry');
const {TypertGatewayService}=await load('@deepseek-ai/dsh-api-gateway');
const {remoteMethods}=await load('@deepseek-ai/dsh-typert-protocol');
const panel=await load('hanaworlds-painter-image-material-panel');
const panelRequire=createRequire(require.resolve('hanaworlds-painter-image-material-panel'));
const sharp=(await import(pathToFileURL(panelRequire.resolve('sharp')))).default;
const ctx=new Context();
new TypertRegistry(ctx);
const gateway=new TypertGatewayService(ctx,{websocketHeartbeatIntervalMs:2000,streamInboxBytes:262144});
const session={id:'fixture-session'};
ctx.provide('sessions',{get:id=>id===session.id?session:undefined});
ctx.provide('hanaworldsSkillBusiness',{bound:async()=>false});
ctx.typert.lookups.register('session',{parameter:'session',wire:'sessionId',hostTypeSymbol:'@deepseek-ai/dsh-session#Session',wireTypeSymbol:'@deepseek-ai/dsh-session/types#SessionId',resolve:id=>id===session.id?session:undefined});
const fiber=ctx.plugin(panel.default);
await fiber.await();
const service=ctx.get(panel.SERVICE);
assert.deepEqual(remoteMethods(service).map(x=>x.method),['sampleImage','sessionImage']);
const rows=[];
const peer={kind:'operator',id:'fixture-peer'}; // only a direct in-process caller fact
const samples=[['red',[141,94,83]],['green',[75,94,37]],['snow',[222,230,235]],['red-repeat',[141,94,83]]];
for(const [name,rgb] of samples){
 const bytes=await sharp(Buffer.from([...rgb,255,...rgb,255]),{raw:{width:2,height:1,channels:4}}).png().toBuffer();
 const output=await gateway.invoke({namespace:panel.SERVICE,method:'sampleImage',args:{imageBase64:bytes.toString('base64')},peer});
 assert.equal(output.ok,true);assert.equal(output.source,'SAMPLE');assert.equal(output.paletteLabel,'示例材质表');assert.equal(output.worldWrites,0);assert.equal(output.modelCalls,0);
 rows.push({name,inputSha256:createHash('sha256').update(bytes).digest('hex'),output});
}
assert.equal(new Set(rows.slice(0,3).map(x=>x.output.material.nodeName)).size,3);
assert.deepEqual(rows[0].output,rows[3].output);
const nonImage=await gateway.invoke({namespace:panel.SERVICE,method:'sampleImage',args:{imageBase64:Buffer.from('not an image').toString('base64')},peer});
assert.equal(nonImage.ok,false);assert.equal(nonImage.code,'IMAGE_DECODE_FAILED');
const sessionResult=await gateway.invoke({namespace:panel.SERVICE,method:'sessionImage',args:{sessionId:session.id,imageBase64:Buffer.from('not an image').toString('base64')},peer});
assert.equal(sessionResult.ok,false);assert.equal(sessionResult.code,'IMAGE_DECODE_FAILED');
const sessionBytes=await sharp(Buffer.from([141,94,83,255,141,94,83,255]),{raw:{width:2,height:1,channels:4}}).png().toBuffer();
const sessionImage=await gateway.invoke({namespace:panel.SERVICE,method:'sessionImage',args:{sessionId:session.id,imageBase64:sessionBytes.toString('base64')},peer});
assert.deepEqual(sessionImage,rows[0].output);
const receipt={evidence:'SOURCE/FIXTURE_PUBLIC_CORDIS_GATEWAY',productProfileTouched:false,realUi:'NOT_RUN',stage,peer:'FIXTURE in-process caller',session:'FIXTURE lookup/unbound Host state',panelVersion:'0.1.4',methods:remoteMethods(service),rows,nonImage,sessionResult,sessionImage,modelCalls:0,worldWrites:0};
writeFileSync(receiptPath,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({panelVersion:receipt.panelVersion,methods:receipt.methods.map(x=>x.method),differentMaterials:rows.slice(0,3).map(x=>x.output.material.nodeName),repeatEqual:true,nonImage:nonImage.code,sessionLookup:sessionResult.code,realUi:receipt.realUi,receiptPath}));
await fiber.dispose();
assert.equal(ctx.get(panel.SERVICE),undefined);
