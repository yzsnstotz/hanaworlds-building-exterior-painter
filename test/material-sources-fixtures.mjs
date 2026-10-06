// Authored public peer facts, never product-game evidence.
import sharp from 'sharp';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
export const root=process.env.PAINTER_TEST_PACKAGE??resolve(new URL('..',import.meta.url).pathname);
export const contracts=await import(pathToFileURL(resolve(root,'vendor/hanaworlds-contracts/dist/local/index.mjs')));
export const fixture=JSON.parse(readFileSync(resolve(root,'vendor/hanaworlds-contracts/fixtures/local/main.json')));
export const connection={worldRef:'fixture-world',connectionRef:'local-connection',connectionIncarnationRef:'socket-open-1'};
export const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function pixels(rgb=[255,0,0]) {
 return sharp(Buffer.from([...rgb,255,...rgb,255]),{raw:{width:2,height:1,channels:4}}).png().toBuffer();
}
export function makeFacts(rows) {
 const catalogue=structuredClone(fixture.request.catalogue);catalogue.nodes={};
 const materials=[],blobs=new Map();
 for(const r of rows){
  const node=catalogue.nodes[r.name]??structuredClone(fixture.request.catalogue.nodes['fixture:stone']);
  node.allowedParam2=[...(r.params??[0])].sort((a,b)=>a-b);
  if(r.staticUnknown){node.hasPersistentState=null;node.unknownFields=['hasPersistentState'];}
  catalogue.nodes[r.name]=node;
  for(const param2 of node.allowedParam2){
   if(r.unknown){materials.push({availability:'UNKNOWN',nodeName:r.name,param2,definitionRevision:node.definitionRevision,texture:null,reason:'MISSING_TEXTURE'});continue;}
   const bytesDigest=hash(r.bytes);blobs.set(bytesDigest,new Uint8Array(r.bytes));
   materials.push({availability:'KNOWN',nodeName:r.name,param2,definitionRevision:node.definitionRevision,
    texture:{textureName:'fixture.png',sourceKind:'GAME',sourceRef:'fixture-game/textures/fixture.png',
     interpretation:'SIMPLE_UNIFORM_NODE_TILES',mediaType:r.mediaType??'image/png',bytesDigest,byteLength:r.bytes.length}});
  }
 }
 materials.sort((a,b)=>contracts.compareUTF16(a.nodeName,b.nodeName)||a.param2-b.param2);
 const projection={profileVersion:'material-sources/v1',connection:{...connection},
  catalogueDigest:contracts.digestValue('catalogue',catalogue).sha256,gameId:catalogue.gameId,
  gameRevision:catalogue.gameRevision,sourceBasis:'SERVER_ASSET_ONLY',materials};
 const materialSources={snapshot:{...projection,sourceRevision:contracts.digestValue('material-sources',projection).sha256},
  textures:[...blobs].map(([bytesDigest,bytes])=>({bytesDigest,bytes}))};
 // Validate our fixture, so tests cannot blame invalid authored source facts.
 contracts.validateMaterialSources(materialSources,catalogue,connection);
 return {catalogue,materialSources,currentConnection:{...connection}};
}
