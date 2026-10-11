// Pure tool over image bytes and world-source material colours. No world-specific index.
import { diff, rgbaToLab } from 'color-diff';
import { validateType, validateStaticMaterials, digestValue, compareUTF16, deepFreeze, ContractError } from '#contracts';
import { decodeRaster, dominantColour, ImageMaterialError, IMAGE_LIMITS } from './pixels.mjs';
export { ImageMaterialError } from './pixels.mjs';
export const IMAGE_MATERIAL_TOOL=deepFreeze({
 name:'hanaworlds_image_material',method:'matchImageMaterials',
 input:'imageBytes: Uint8Array + fresh Catalogue + materialColours: [{materialRef, orientation, rgb:[R,G,B]}] from world source',
 output:'dominant colour and nearest legal materialRef/orientation; proposal validation remains mandatory',
 limits:IMAGE_LIMITS,distanceRule:'CIEDE2000 (color-diff 1.4.0); exact ties UTF16 materialRef then numeric orientation',
 dominantRule:'16x16x16 sRGB bins, alpha-byte weight; equal weight lowest packed bin; winning-bin linear-light mean',
 modelCalls:0,worldWrites:0,
});
const unavailable=message=>{throw new ImageMaterialError('CAPABILITY_UNAVAILABLE',message);};
const lab=([R,G,B])=>rgbaToLab({R,G,B});
export async function matchImageMaterials({imageBytes,catalogue:input,materialColours}={}) {
 // Copy all supplied colours and legal material facts before any await.
 const catalogue=validateType('Catalogue',input);
 if(!Array.isArray(materialColours)||materialColours.length===0)unavailable('World-source material colours are required.');
 const colours=structuredClone(materialColours),candidates=[],seen=new Map();let staticIneligibleVariants=0;
 for(const row of colours){
  if(!row || typeof row!=='object' || Object.keys(row).length!==3 ||
   !['materialRef','orientation','rgb'].every(k=>Object.hasOwn(row,k)) ||
   !Array.isArray(row.rgb)||row.rgb.length!==3||!([0,1,2].every(i=>Object.hasOwn(row.rgb,i)&&Number.isFinite(row.rgb[i])&&row.rgb[i]>=0&&row.rgb[i]<=255)))
   unavailable('World-source colours must be explicit sRGB triples bound to neutral MaterialSpec values.');
  const material=validateType('MaterialSpec',{materialRef:row.materialRef,orientation:row.orientation});
  const id=JSON.stringify([material.materialRef,material.orientation]);
  if(seen.has(id))unavailable('A material orientation has duplicate colour facts.');seen.set(id,true);
  try{validateStaticMaterials({hint:material},catalogue);}
  catch(error){
   if(!(error instanceof ContractError)||error.code!=='UNSUPPORTED_MUTATION_SEMANTICS')throw error;
   staticIneligibleVariants++;continue;
  }
  candidates.push({material,rgb:row.rgb});
 }
 candidates.sort((a,b)=>compareUTF16(a.material.materialRef,b.material.materialRef)||a.material.orientation-b.material.orientation);
 if(candidates.length===0)unavailable('No supplied colour belongs to a proven placeable material orientation.');
 const decoded=await decodeRaster(imageBytes),dominant=dominantColour(decoded.data),dominantLab=lab(dominant.rgb);
 let best=null,bestDistance=Infinity;
 for(const candidate of candidates){
  const distance=diff(dominantLab,lab(candidate.rgb));
  if(distance<bestDistance){bestDistance=distance;best=candidate;}
 }
 return deepFreeze({image:decoded.image,dominant,material:{...best.material},
  match:{rgb:best.rgb,distance:bestDistance,algorithm:'CIEDE2000'},
  catalogueDigest:digestValue('catalogue',catalogue).sha256,
  sources:{suppliedColours:colours.length,measuredLegalVariants:candidates.length,staticIneligibleVariants},
  modelCalls:0,worldWrites:0});
}
