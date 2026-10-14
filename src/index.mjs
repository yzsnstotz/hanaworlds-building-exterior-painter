import Schema from '@deepseek-ai/schemastery';
import { ExteriorPainterV2, INVARIANTS } from './service.mjs';
import { IMAGE_LIMITS } from './pixels.mjs';
import { IMAGE_MATERIAL_TOOL } from './current-image-material.mjs';
import { mountModelImageTool } from './model-image-tool.mjs';
export { ExteriorPainterV2, INVARIANTS } from './service.mjs';
export { contractHandshake } from './contract.mjs';
export { PROPOSAL_OPERATION, PROPOSAL_WIRE } from './proposal.mjs';
export { REGION_PROPOSAL_TOOL, REGION_OPERATION, REGION_WIRE, REGION_CAPABILITY, admitRegionProposal,
 regionBuildPlan, protocolHandshake } from './region.mjs';
export { matchCurrentImageMaterials, IMAGE_MATERIAL_TOOL, ImageMaterialError } from './current-image-material.mjs';
export { promptText, buildMessages } from './model.mjs';
export { PAINTER_ID, planGeometry, planEntrances, assembleBuild, boundRules, trustedFromRegion } from './planner.mjs';
export const name='hanaworlds-building-exterior-painter';
export const inject=[];
export const SERVICE='hanaworldsPainterV2PictureBlocks';
const SettingsSchema=Schema.object({
 maxBytes:Schema.number().min(1).step(1),
 maxPixels:Schema.number().min(1).step(1),
 formats:Schema.array(Schema.union(['png','jpeg','webp'])).min(1).role('list'),
}).description(`Building Exterior Painter. Visible image budgets default to ${JSON.stringify(IMAGE_LIMITS)}. Fixed invariants: ${INVARIANTS.join(' ')}`);
const validateSettings=settings=>{
 if(settings===null||typeof settings!=='object'||Array.isArray(settings)
  ||![Object.prototype,null].includes(Object.getPrototypeOf(settings)))throw new TypeError('Painter settings object required');
 for(const key of Object.keys(settings))if(!['maxBytes','maxPixels','formats'].includes(key))throw new TypeError('Unknown Painter setting');
 for(const key of ['maxBytes','maxPixels'])if(Object.hasOwn(settings,key)&&(!Number.isSafeInteger(settings[key])||settings[key]<=0))throw new TypeError('Positive safe integer image budget required');
 if(Object.hasOwn(settings,'formats')&&(!Array.isArray(settings.formats)||settings.formats.length===0||new Set(settings.formats).size!==settings.formats.length||!settings.formats.every(v=>IMAGE_LIMITS.formats.includes(v))))throw new TypeError('Unique supported raster formats required');
 return settings;
};
export const Config=Object.assign((settings={})=>validateSettings(settings),SettingsSchema);
export function apply(ctx,settings={}) {
 const painter=new ExteriorPainterV2(validateSettings(settings));
 Object.defineProperty(painter,'localFacts',{get:()=>typeof ctx.get==='function'
  ?ctx.get('hanaworldsPainterLocalFacts'):ctx.hanaworldsPainterLocalFacts,configurable:true});
 if(typeof ctx.provide==='function') {
  ctx.provide(SERVICE,painter);
  ctx.provide(IMAGE_MATERIAL_TOOL.name,Object.freeze({...IMAGE_MATERIAL_TOOL,limits:painter.imageLimits,execute:input=>painter.matchCurrentImageMaterials(input)}));
 }
 mountModelImageTool(ctx,painter);
 return painter;
}
export default {name,inject,Config,apply};
