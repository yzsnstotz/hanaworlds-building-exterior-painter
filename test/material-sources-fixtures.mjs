// Authored public peer facts, never product-game evidence.
import sharp from 'sharp';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
export const root=process.env.PAINTER_TEST_PACKAGE??resolve(new URL('..',import.meta.url).pathname);
const pinned=await import(pathToFileURL(resolve(root,'src/contract-package.mjs')));
export const contracts=pinned.contracts;
export const contractPackage=pinned.contractPackage;
export const fixture=pinned.contractFixture('main');
export const connection={worldRef:'fixture-world',connectionRef:'local-connection',connectionIncarnationRef:'socket-open-1'};
export const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function pixels(rgb=[255,0,0]) {
 return sharp(Buffer.from([...rgb,255,...rgb,255]),{raw:{width:2,height:1,channels:4}}).png().toBuffer();
}
export function makeFacts(rows) {
 const catalogue=structuredClone(fixture.request.catalogue);catalogue.materials={[catalogue.emptyMaterialRef]:structuredClone(fixture.request.catalogue.materials[fixture.request.catalogue.emptyMaterialRef])};
 const materials=[],blobs=new Map();
 for(const r of rows){
  const node=catalogue.materials[r.name]??structuredClone(fixture.request.catalogue.materials['fixture:stone']);
  node.orientations=[...(r.params??[0])].sort((a,b)=>a-b);
  if(r.staticUnknown){node.placeable=null;node.unknownFields=['placeable'];}
  catalogue.materials[r.name]=node;
  for(const orientation of node.orientations){
   if(r.unknown){materials.push({availability:'UNKNOWN',materialRef:r.name,orientation,definitionRevision:node.definitionRevision,texture:null,reason:'MISSING_TEXTURE'});continue;}
   const bytesDigest=hash(r.bytes);blobs.set(bytesDigest,new Uint8Array(r.bytes));
   materials.push({availability:'KNOWN',materialRef:r.name,orientation,definitionRevision:node.definitionRevision,
    texture:{textureName:'fixture.png',sourceKind:'GAME',sourceRef:'fixture-game/textures/fixture.png',
     interpretation:'SIMPLE_UNIFORM_NODE_TILES',mediaType:r.mediaType??'image/png',bytesDigest,byteLength:r.bytes.length}});
  }
 }
 materials.sort((a,b)=>contracts.compareUTF16(a.materialRef,b.materialRef)||a.orientation-b.orientation);
 const projection={profileVersion:'material-sources/v2',connection:{...connection},
  catalogueDigest:contracts.digestValue('catalogue',catalogue).sha256,engineRevisions:catalogue.engineRevisions,sourceBasis:'WORLD_SOURCE_ASSET_ONLY',materials};
 const materialSources={snapshot:{...projection,sourceRevision:contracts.digestValue('material-sources',projection).sha256},
  textures:[...blobs].map(([bytesDigest,bytes])=>({bytesDigest,bytes}))};
 // Validate our fixture, so tests cannot blame invalid authored source facts.
 contracts.validateMaterialSources(materialSources,catalogue,connection);
 return {catalogue,materialSources,currentConnection:{...connection}};
}
