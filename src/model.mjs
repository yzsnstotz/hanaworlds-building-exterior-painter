// The only model path: the DSH host `llm` service with durable `attachments`
// image references. The painter never reads, encodes or logs image bytes.
import { randomUUID } from 'node:crypto';
import { describeRegion, offeredMaterials } from './planner.mjs';

export const PLUGIN_NAME = 'hanaworlds-building-exterior-painter';

/** Host-capability failure outside the painter/v4 response envelope. The
 * frozen CreateBuildPlan failure list has no model/capability code, so this is
 * raised to the caller instead of being disguised as a domain result. */
export class PainterHostError extends Error {
  constructor(code, reason, detail = null) {
    super(`${code}/${reason}`);
    this.name = 'PainterHostError';
    this.publicError = Object.freeze({ code, phase: 'validate', retryability: 'AFTER_NEW_FACTS',
      mutationState: 'NONE', transactionRef: null, causeCode: null, reason });
    this.hostCode = detail; // stable host failure code only, never message text
  }
}

const SYSTEM = [
  'You are the HanaWorlds Building Exterior Painter ("picture-blocks", 照片积木).',
  'You turn ONE confirmed user request, made of reference image(s) plus text, into the exterior',
  'block structure of a building inside a fixed empty region of a voxel world.',
  'Rules:',
  '- Use the image(s) AND the text together. Never ignore either one.',
  '- Coordinates are local integer grid cells: x and z horizontal, y up, origin [0,0,0] at the',
  '  region minimum corner. Every box must stay inside the region and must not touch a blocked cell.',
  '- Use only the offered materials, with an offered param2 value.',
  '- Boxes are applied in order; a later box overwrites earlier cells (use this to cut openings',
  '  with "air" only if "air" is offered).',
  '- If entrance.required is true, leave a walk-through opening at every listed portal cell into an',
  '  enclosed interior large enough for avatarCells (x,y,z), e.g. by cutting it with "air".',
  '- If firstBuilding is set, the region is the exact free footprint chosen for this new building; build',
  '  inside it only. If the building has a walkable interior, put its only entrance on the side whose outward',
  '  direction is firstBuilding.entranceFacing (e.g. "-Z" = the side at local z = 0), facing the player.',
  '- If the image, the text, or their combination does not determine the structure well enough,',
  '  do not guess: ask ONE short question in the user\'s language.',
  'Answer with exactly one JSON object and nothing else, in one of these two forms:',
  '{"decision":"BUILD","materials":{"<materialRef>":{"nodeName":"<offered nodeName>","param2":<int>}},',
  ' "boxes":[{"min":[x,y,z],"max":[x,y,z],"materialRef":"<materialRef>"}]}',
  '{"decision":"CLARIFY","clarification":{"code":"AMBIGUOUS_INTENT"|"AMBIGUOUS_GEOMETRY","question":"<question>"}}',
].join('\n');

/** Exact model-visible text for one request. Image bytes are separate blocks. */
export function promptText(request) {
  const { referenceBrief: brief, intent } = request;
  const region = describeRegion(request.targetFacts);
  const facts = {
    request: brief.text,
    confirmedIntent: intent.confirmedIntent.text,
    purpose: brief.controls.purpose,
    styleText: brief.controls.styleText,
    region: { size: region.size, blockedCells: region.occupied.map(c => c.position),
      unknownCells: region.unknown },
    offeredMaterials: offeredMaterials(request.catalogue),
    imageCount: brief.media.length,
    entrance: request.safetyProfile.requireEntranceConnectivity ? {
      required: true,
      avatarCells: ['width', 'height', 'depth'].map(k => Math.ceil(request.safetyProfile.avatarDimensions[k])),
      portals: request.targetFacts.portals
        .filter(x => intent.confirmedIntent.entrancePortalRefs.includes(x.portalRef))
        .map(x => ({ portalRef: x.portalRef, cells: x.positions.map(p => p.map((v, i) => v - request.targetFacts.sampledBounds.min[i])) })),
    } : { required: false },
    firstBuilding: request.regionInspection ? {
      // The footprint is chosen by Adapter/Canvas; it is never moved by the painter.
      footprintIsFixed: true,
      entranceFacing: request.regionInspection.entranceFacing,
    } : null,
  };
  return `Confirmed request facts (JSON):\n${JSON.stringify(facts)}`;
}

/** Durable Core attachment reference for one brief media binding. */
export function attachmentRef(media) {
  return { attachmentId: media.attachmentRef, mediaType: media.mediaType, bytes: media.bytes,
    width: media.width, height: media.height };
}

export function buildMessages(request) {
  const content = [{ type: 'text', text: promptText(request) },
    ...request.referenceBrief.media.map(m => ({ type: 'image', attachment: attachmentRef(m) }))];
  const source = { kind: 'plugin', plugin: PLUGIN_NAME };
  return {
    system: SYSTEM,
    messages: [Object.freeze({ id: randomUUID(), role: 'user', content, source })],
  };
}

const attachmentFailures = new Map([
  ['ATTACHMENT_NOT_FOUND', 'MEDIA_NOT_REFERENCED'], ['INVALID_ATTACHMENT_REF', 'MEDIA_NOT_REFERENCED'],
  ['ATTACHMENT_CORRUPT', 'MEDIA_CORRUPT'], ['ATTACHMENT_READ_FAILED', 'MEDIA_CORRUPT'],
]);

/**
 * Call the configured host route once. Requires a route whose resolved model
 * accepts image input: a text-only route would replace the image with a
 * placeholder, which would silently drop the required image.
 */
export async function invokeModel({ llm, attachments, route, request, signal }) {
  if (!llm || typeof llm.stream !== 'function' || typeof llm.resolveModelInfo !== 'function')
    throw new PainterHostError('MODEL_UNAVAILABLE', 'POLICY_UNAVAILABLE', 'LLM_SERVICE_ABSENT');
  if (!attachments) throw new PainterHostError('MODEL_UNAVAILABLE', 'POLICY_UNAVAILABLE', 'ATTACHMENT_SERVICE_ABSENT');
  let info;
  try { info = await llm.resolveModelInfo(route.provider, route.model, signal); }
  catch (error) {
    throw new PainterHostError('MODEL_UNAVAILABLE', 'POLICY_UNAVAILABLE',
      typeof error?.code === 'string' ? error.code : 'MODEL_RESOLUTION_FAILED');
  }
  if (!Array.isArray(info?.inputModalities) || !info.inputModalities.includes('image'))
    throw new PainterHostError('MODEL_UNAVAILABLE', 'POLICY_UNAVAILABLE', 'ROUTE_NOT_IMAGE_CAPABLE');
  const { system, messages } = buildMessages(request);
  const texts = new Map();
  const order = [];
  let finish = null;
  for await (const chunk of llm.stream({ provider: route.provider, model: route.model,
    system, messages, signal })) {
    if (chunk.type === 'block-start' && chunk.blockType === 'text' && !texts.has(chunk.index)) {
      texts.set(chunk.index, ''); order.push(chunk.index);
    } else if (chunk.type === 'text-delta') {
      if (!texts.has(chunk.index)) { texts.set(chunk.index, ''); order.push(chunk.index); }
      texts.set(chunk.index, texts.get(chunk.index) + chunk.text);
    } else if (chunk.type === 'block-end' && chunk.block?.type === 'text') {
      if (!texts.has(chunk.index)) order.push(chunk.index);
      texts.set(chunk.index, chunk.block.text);
    } else if (chunk.type === 'finish') finish = chunk.reason;
  }
  if (finish && finish.kind !== 'stop') {
    const code = finish.failure?.code;
    const media = attachmentFailures.get(code);
    if (media) return { mediaFailure: media };
    throw new PainterHostError('MODEL_REQUEST_FAILED', 'POLICY_UNAVAILABLE',
      typeof code === 'string' ? code : `FINISH_${String(finish.kind).toUpperCase()}`);
  }
  return { text: order.map(i => texts.get(i)).join(''), modelInfo: { provider: route.provider, model: route.model } };
}
