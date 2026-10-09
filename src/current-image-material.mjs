// Pure current-world texture consumer. No peer reads, palette fallback or cache.
import {validateType,validateMaterialSources,validateStaticMaterials,ContractError,deepFreeze} from '#contracts';
import {decodeRaster,dominantColour,meanTextureColour,ImageMaterialError,IMAGE_LIMITS} from './pixels.mjs';

export const CURRENT_IMAGE_MATERIAL_TOOL=deepFreeze({name:'MatchCurrentImageMaterials',method:'matchCurrentImageMaterials',
 input:'actual imageBytes:Uint8Array + MaterialSources + fresh Catalogue + currentConnection:MaterialSourceConnection',
 output:'dominant colour + legal material hint + sourceRevision + Catalogue/connection binding; proposal validation remains mandatory',
 limits:IMAGE_LIMITS,sourceBasis:'SERVER_ASSET_ONLY',modelCalls:0,worldWrites:0,
 dominantRule:'16x16x16 sRGB bins, alpha-byte weight; equal weight lowest packed bin; winning-bin linear-light mean',
 textureRule:'alpha-weighted linear-light mean from validated KNOWN simple uniform texture bytes',
 distanceRule:'Euclidean Oklab; exact distance tie UTF16 nodeName then numeric param2',
 unknownRule:'KNOWN texture never overrides static UNKNOWN; no measured palette fallback',
 freshnessRule:'validateMaterialSources copies bytes before await; no cross-call cache; Host rechecks selection and providers after await'});

export async function matchCurrentImageMaterials({imageBytes,materialSources,catalogue:input,currentConnection}={}) {
 // Capture and validate all public facts synchronously before any decoding await.
 const catalogue=validateType('Catalogue',input);
 const admitted=validateMaterialSources(materialSources,catalogue,currentConnection);
 const {snapshot,textures}=admitted;
 const blobs=new Map(textures.map(t=>[t.bytesDigest,t.bytes]));
 const candidates=[];let unknownVariants=0,staticIneligibleVariants=0;
 for(const row of snapshot.materials){
  if(row.availability!=='KNOWN'){unknownVariants++;continue;}
  const material={nodeName:row.nodeName,param2:row.param2};
  try{validateStaticMaterials({hint:material},catalogue);}
  catch(error){
   if(!(error instanceof ContractError)||error.code!=='UNSUPPORTED_MUTATION_SEMANTICS')throw error;
   staticIneligibleVariants++;continue;
  }
  candidates.push({material,texture:row.texture});
 }
 const decoded=await decodeRaster(imageBytes),dominant=dominantColour(decoded.data);
 if(candidates.length===0)throw new ImageMaterialError('MATERIAL_SOURCES_UNAVAILABLE',
  `No KNOWN static-legal texture variant in current source ${snapshot.sourceRevision}; ${unknownVariants} texture UNKNOWN, ${staticIneligibleVariants} static-ineligible. Unknown facts remain unknown.`);
 // Only per-invocation deduplication, owned by this validated sourceRevision.
 const measured=new Map();let best=null,bestDistance=Infinity;
 for(const candidate of candidates){
  const texture=candidate.texture;let colour=measured.get(texture.bytesDigest);
  if(!colour){
   try{
    const raster=await decodeRaster(blobs.get(texture.bytesDigest));
    if(`image/${raster.image.format}`!==texture.mediaType)throw new ImageMaterialError('IMAGE_DECODE_FAILED','Texture format does not match declared mediaType.');
    colour=meanTextureColour(raster.data);measured.set(texture.bytesDigest,colour);
   }catch(error){
    if(!(error instanceof ImageMaterialError))throw error;
    throw new ImageMaterialError('MATERIAL_TEXTURE_UNAVAILABLE',
     `Current source ${snapshot.sourceRevision} texture ${texture.bytesDigest} cannot be measured (${error.code}); no colour was inferred.`);
   }
  }
  const distance=colour.oklab.reduce((s,c,i)=>s+(c-dominant.oklab[i])**2,0);
  // Contract admission already enforces sorted unique nodeName/param2 rows.
  if(distance<bestDistance){bestDistance=distance;best={...candidate,colour};}
 }
 return deepFreeze({image:decoded.image,dominant,material:best.material,
  match:{rgb:best.colour.rgb,oklab:best.colour.oklab,distance:Math.sqrt(bestDistance),texture:best.texture},
  sourceRevision:snapshot.sourceRevision,catalogueDigest:snapshot.catalogueDigest,connection:snapshot.connection,
  gameId:snapshot.gameId,gameRevision:snapshot.gameRevision,sourceBasis:snapshot.sourceBasis,
  sources:{unknownVariants,staticIneligibleVariants,measuredLegalVariants:candidates.length,measuredTextures:measured.size},
  modelCalls:0,worldWrites:0});
}
