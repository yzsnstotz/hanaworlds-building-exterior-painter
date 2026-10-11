// Pure current-world texture consumer. No peer reads, palette fallback or cache.
import {diff,rgbaToLab} from 'color-diff';
import {validateType,validateMaterialSources,validateStaticMaterials,ContractError,deepFreeze} from '#contracts';
import {decodeRaster,dominantColour,meanTextureColour,ImageMaterialError} from './pixels.mjs';

export async function matchCurrentImageMaterials({imageBytes,materialSources,catalogue:input,currentConnection}={}) {
 // Capture and validate all public facts synchronously before any decoding await.
 const catalogue=validateType('Catalogue',input);
 const admitted=validateMaterialSources(materialSources,catalogue,currentConnection);
 const {snapshot,textures}=admitted;
 const blobs=new Map(textures.map(t=>[t.bytesDigest,t.bytes]));
 const candidates=[];let unknownVariants=0,staticIneligibleVariants=0;
 for(const row of snapshot.materials){
  if(row.availability!=='KNOWN'){unknownVariants++;continue;}
  const material={materialRef:row.materialRef,orientation:row.orientation};
  try{validateStaticMaterials({hint:material},catalogue);}
  catch(error){
   if(!(error instanceof ContractError)||error.code!=='UNSUPPORTED_MUTATION_SEMANTICS')throw error;
   staticIneligibleVariants++;continue;
  }
  candidates.push({material,texture:row.texture});
 }
 const decoded=await decodeRaster(imageBytes),dominant=dominantColour(decoded.data);
 if(candidates.length===0)throw new ImageMaterialError('CAPABILITY_UNAVAILABLE',
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
  const lab=([R,G,B])=>rgbaToLab({R,G,B});
  const distance=diff(lab(colour.rgb),lab(dominant.rgb));
  // Contract admission already enforces sorted unique materialRef/orientation rows.
  if(distance<bestDistance){bestDistance=distance;best={...candidate,colour};}
 }
 return deepFreeze({image:decoded.image,dominant,material:best.material,
  match:{rgb:best.colour.rgb,lab:best.colour.lab,distance:bestDistance,algorithm:'CIEDE2000',texture:best.texture},
  sourceRevision:snapshot.sourceRevision,catalogueDigest:snapshot.catalogueDigest,connection:snapshot.connection,
  engineRevisions:snapshot.engineRevisions,sourceBasis:snapshot.sourceBasis,
  sources:{unknownVariants,staticIneligibleVariants,measuredLegalVariants:candidates.length,measuredTextures:measured.size},
  modelCalls:0,worldWrites:0});
}
