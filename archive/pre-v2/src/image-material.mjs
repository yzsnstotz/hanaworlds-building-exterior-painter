import measuredPalette from './material-palette.json' with {type:'json'};
import {validateType,validateStaticMaterials,digestValue,canonicalJSON,compareUTF16,deepFreeze} from '#contracts';
import {offeredMaterials} from './planner.mjs';
import {decodeRaster,dominantColour,sha256,ImageMaterialError,IMAGE_LIMITS} from './pixels.mjs';
const palette=deepFreeze(measuredPalette);
export {ImageMaterialError} from './pixels.mjs';
export const IMAGE_MATERIAL_TOOL=deepFreeze({name:'MatchImageMaterials',method:'matchImageMaterials',
 input:'Host actual imageBytes:Uint8Array + current public Catalogue; no URLs, paths or model colour fields',
 output:'dominant colour and material hint only; existing ValidateBuildProposal remains mandatory',
 limits:IMAGE_LIMITS,paletteSource:palette.source,modelCalls:0,worldWrites:0,
 dominantRule:'16x16x16 sRGB bins, alpha-byte weight; equal weight lowest packed bin; winning-bin linear-light mean',
 distanceRule:'Euclidean Oklab; exact distance tie UTF16 nodeName then smallest allowed param2',
 currentWorldTextureBinding:'UNKNOWN; supplied Catalogue legality is checked, measured source palette is explicitly labelled'});
export async function matchImageMaterials({imageBytes,catalogue:input}={}) {
  const catalogue=validateType('Catalogue',input);
  const decoded=await decodeRaster(imageBytes),dominant=dominantColour(decoded.data);
  const index=new Map(palette.entries.map(e=>[e.nodeName,e]));
  const legal=offeredMaterials(catalogue);
  const candidates=legal.filter(m=>index.has(m.nodeName)).sort((a,b)=>compareUTF16(a.nodeName,b.nodeName));
  let best=null,bestDistance=Infinity;
  for(const candidate of candidates){
    const entry=index.get(candidate.nodeName),param2=Math.min(...candidate.allowedParam2);
    const material={nodeName:candidate.nodeName,param2};
    validateStaticMaterials({hint:material},catalogue);
    const distance=entry.oklab.reduce((s,c,i)=>s+(c-dominant.oklab[i])**2,0);
    if(distance<bestDistance){bestDistance=distance;best={material,entry};}
  }
  if(!best)throw new ImageMaterialError('NO_LEGAL_MATERIAL','No static legal Catalogue material has a measured colour in this index; unknown stays unknown.');
  return deepFreeze({image:decoded.image,dominant,material:best.material,
    match:{rgb:best.entry.rgb,distance:Math.sqrt(bestDistance),texture:best.entry.texture,textureSha256:best.entry.textureSha256},
    catalogueDigest:digestValue('catalogue',catalogue).sha256,
    palette:{sha256:sha256(Buffer.from(canonicalJSON(palette))),source:palette.source,
      indexedLegalMaterials:candidates.length,legalMaterialsWithUnknownColour:legal.length-candidates.length},
    modelCalls:0,worldWrites:0});
}
