import Schema from '@deepseek-ai/schemastery';
import { ExteriorPainterV2, INVARIANTS } from './service.mjs';
import { IMAGE_MATERIAL_TOOL } from './image-material.mjs';
export { ExteriorPainterV2, INVARIANTS } from './service.mjs';
export { contractHandshake } from '#contracts';
export { PROPOSAL_OPERATION, PROPOSAL_WIRE } from './proposal.mjs';
export { REGION_PROPOSAL_TOOL, REGION_OPERATION, REGION_WIRE, REGION_CAPABILITY, admitRegionProposal,
 regionBuildPlan, protocolHandshake } from './region.mjs';
export { matchImageMaterials, IMAGE_MATERIAL_TOOL, ImageMaterialError } from './image-material.mjs';
export { matchCurrentImageMaterials } from './current-image-material.mjs';
export { PAINTER_ID, planGeometry, planEntrances, assembleBuild, boundRules, trustedFromRegion } from './planner.mjs';
export const name='hanaworlds-building-exterior-painter';
export const inject=[];
export const SERVICE='hanaworldsPainterV2PictureBlocks';
export const Config=Schema.object({}).description(`Building Exterior Painter. Fixed invariants: ${INVARIANTS.join(' ')}`);
export function apply(ctx) {
 const painter=new ExteriorPainterV2();
 Object.defineProperty(painter,'localFacts',{get:()=>typeof ctx.get==='function'
  ?ctx.get('hanaworldsPainterLocalFacts'):ctx.hanaworldsPainterLocalFacts,configurable:true});
 if(typeof ctx.provide==='function') {
  ctx.provide(SERVICE,painter);
  ctx.provide(IMAGE_MATERIAL_TOOL.name,Object.freeze({...IMAGE_MATERIAL_TOOL,execute:input=>painter.matchImageMaterials(input)}));
 }
 return painter;
}
export default {name,inject,Config,apply};
