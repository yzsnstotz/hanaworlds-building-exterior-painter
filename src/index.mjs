// DSH host plugin entry for the HanaWorlds Building Exterior Painter
// (P3 picture-blocks / 照片积木 / 建筑外形画师).
import Schema from '@deepseek-ai/schemastery';
import { ExteriorPainterV2, DEFAULT_ROUTE, INVARIANTS } from './service.mjs';

export { ExteriorPainterV2, DEFAULT_ROUTE, INVARIANTS } from './service.mjs';
/** ContractHandshake this image provider advertises: the resolved contracts package's own (range in tools/admitted-contracts.mjs). */
export { contractHandshake } from '#contracts';
export { PROPOSAL_OPERATION } from './proposal.mjs';
export { REGION_PROPOSAL_TOOL, REGION_OPERATION, REGION_WIRE, REGION_CAPABILITY, admitRegionProposal,
  regionBuildPlan, protocolHandshake } from './region.mjs';
export { matchImageMaterials, IMAGE_MATERIAL_TOOL, ImageMaterialError } from './image-material.mjs';
export { matchCurrentImageMaterials, CURRENT_IMAGE_MATERIAL_TOOL } from './current-image-material.mjs';
export { PainterHostError, buildMessages, promptText } from './model.mjs';
export { PAINTER_ID, parseProposal, planGeometry, planEntrances, assembleBuild, offeredMaterials,
  boundRules, trustedFromRegion } from './planner.mjs';

export const name = 'hanaworlds-building-exterior-painter';
export const inject = [];
export const SERVICE = 'hanaworldsPainterV2PictureBlocks';

/** Every behaviour-changing setting is declared here so the host settings
 * surface shows it, with its default. There are no other settings. */
export const Config = Schema.object({
  modelProvider: Schema.string().default(DEFAULT_ROUTE.provider)
    .description('DSH model route (provider id) for image+text structure planning. The resolved model must accept image input; otherwise requests are refused.'),
  modelId: Schema.string().default(DEFAULT_ROUTE.model)
    .description('Exact model id on that route.'),
}).description(`Building Exterior Painter. Fixed invariants (not switchable): ${INVARIANTS.join(' ')}`);

function hostService(ctx, serviceName) {
  return typeof ctx.get === 'function' ? ctx.get(serviceName) : ctx[serviceName];
}

/** Host services are resolved at each call, so a later-registered or
 * changed business-facts/model/attachment provider is observed, never cached. */
export function apply(ctx, config = {}) {
  const route = { provider: config.modelProvider ?? DEFAULT_ROUTE.provider,
    model: config.modelId ?? DEFAULT_ROUTE.model };
  const painter = new ExteriorPainterV2({ route });
  for (const [field, serviceName] of [['localFacts', 'hanaworldsPainterLocalFacts'], ['llm', 'llm'],
    ['attachments', 'attachments']])
    Object.defineProperty(painter, field, { get: () => hostService(ctx, serviceName), configurable: true });
  if (typeof ctx.provide === 'function') ctx.provide(SERVICE, painter);
  return painter;
}

export default { name, inject, Config, apply };
