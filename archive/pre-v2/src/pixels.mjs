import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {srgbChannelToLinear,linearToSrgb,rgbToOklab} from './colour.mjs';
export const IMAGE_LIMITS=Object.freeze({maxBytes:33554432,maxPixels:16777216,formats:Object.freeze(['png','jpeg','webp'])});
export class ImageMaterialError extends Error {
  constructor(code,message){super(message);this.name='ImageMaterialError';this.code=code;this.mutationState='NONE';}
}
const fail=(code,message)=>{throw new ImageMaterialError(code,message);};
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function decodeRaster(imageBytes) {
  if(!(imageBytes instanceof Uint8Array)||imageBytes.length===0)
    fail('IMAGE_REQUIRED','Actual non-empty image Uint8Array bytes are required.');
  if(imageBytes.length>IMAGE_LIMITS.maxBytes)fail('IMAGE_LIMIT_EXCEEDED','Image exceeds the visible maxBytes limit.');
  const bytes=Buffer.from(imageBytes); // immutable snapshot before decoding awaits
  const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg=bytes[0]===255&&bytes[1]===216;
  const webp=bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
  if(!png&&!jpeg&&!webp)fail('IMAGE_DECODE_FAILED','Only PNG/JPEG/WebP raster bytes are accepted.');
  try {
    const image=sharp(bytes,{failOn:'error',limitInputPixels:IMAGE_LIMITS.maxPixels});
    const meta=await image.metadata();
    if(!IMAGE_LIMITS.formats.includes(meta.format)||(meta.pages??1)!==1)
      fail('IMAGE_DECODE_FAILED','A single PNG/JPEG/WebP frame is required.');
    const {data,info}=await image.rotate().toColourspace('srgb').ensureAlpha().raw({depth:'uchar'}).toBuffer({resolveWithObject:true});
    if(info.channels!==4)fail('IMAGE_DECODE_FAILED','Decoded sRGB RGBA pixels are required.');
    return {data,image:{sha256:sha256(bytes),format:meta.format,width:info.width,height:info.height,pixels:info.width*info.height}};
  } catch(error) {
    if(error instanceof ImageMaterialError)throw error;
    fail('IMAGE_DECODE_FAILED','Raster decoding failed; no colour was inferred.');
  }
}
function colourFromSum(sum,weight) {
  if(weight===0)fail('NO_VISIBLE_PIXELS','No non-transparent pixels have a colour.');
  const floatingRgb=sum.map(v=>linearToSrgb(v/weight));
  return {rgb:floatingRgb.map(v=>Math.max(0,Math.min(255,Math.round(v)))),oklab:rgbToOklab(...floatingRgb),alphaWeight:weight};
}
// Reuses original palette_build.py's alpha-weighted LINEAR-light texture mean.
export function meanTextureColour(data) {
  const sum=[0,0,0];let weight=0;
  for(let i=0;i<data.length;i+=4){const a=data[i+3];weight+=a;
    for(let c=0;c<3;c++)sum[c]+=a*srgbChannelToLinear(data[i+c]);}
  return colourFromSum(sum,weight);
}
export function dominantColour(data) {
  const weights=new Float64Array(4096),sums=[new Float64Array(4096),new Float64Array(4096),new Float64Array(4096)];
  for(let i=0;i<data.length;i+=4){const a=data[i+3];if(a===0)continue;
    const bin=(data[i]>>4)*256+(data[i+1]>>4)*16+(data[i+2]>>4);weights[bin]+=a;
    for(let c=0;c<3;c++)sums[c][bin]+=a*srgbChannelToLinear(data[i+c]);}
  let winner=0;for(let bin=1;bin<4096;bin++)if(weights[bin]>weights[winner])winner=bin;
  return {...colourFromSum(sums.map(s=>s[winner]),weights[winner]),bin:winner};
}
