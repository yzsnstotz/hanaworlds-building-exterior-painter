// FIXTURE-only builders. Every identity, digest source, model answer and
// host service here is synthetic; none of it is runtime or product evidence.
import { createHash } from 'node:crypto';
import { digestValue, comparePosition } from '#contracts';

export const IMAGE_SHA = createHash('sha256').update('fixture-image-bytes').digest('hex');

const node = (over = {}) => ({ walkable: true, collisionBoxes: [[-0.5, -0.5, -0.5, 0.5, 0.5, 0.5]],
  liquidType: 'none', damagePerSecond: 0, lightSource: 0, param2Type: 'none', allowedParam2: [0],
  hasCallbacks: false, hasPersistentState: false, definitionRevision: 'fixture-def-1', unknownFields: [], ...over });

export function catalogue() {
  return { profileVersion: 'catalogue/v2', engineProfile: 'fixture-luanti-static', gameId: 'fixture-game',
    gameRevision: 'fixture-game-1', modRevisions: { 'fixture-mod': 'fixture-mod-1' },
    nodes: {
      air: node({ walkable: false, collisionBoxes: [] }),
      'fixture:stone': node(),
      'fixture:wood': node(),
      'fixture:chest': node({ hasCallbacks: true, hasPersistentState: true }),
      'fixture:lava': node({ liquidType: 'source', damagePerSecond: 4 }),
    } };
}

export const frame = () => ({ profileVersion: 'frame/v2', frameId: 'fixture-frame', origin: [0, 0, 0],
  axes: ['+X', '+Y', '+Z'], handedness: 'left', gridUnit: { name: 'node', metersPerGridUnit: 1 },
  transformRevision: 'fixture-transform-1' });

/** Inspected 4x3x4 region at [10,0,10]; one occupied cell and one unknown cell. */
export function targetFacts({ occupied = [[13, 0, 13]], unknown = [[13, 2, 13]], max = [13, 2, 13], portals = [] } = {}) {
  const min = [10, 0, 10];
  const all = [];
  for (let x = min[0]; x <= max[0]; x++) for (let y = min[1]; y <= max[1]; y++)
    for (let z = min[2]; z <= max[2]; z++) all.push([x, y, z]);
  const k = p => p.join(',');
  const blocked = new Set([...occupied, ...unknown].map(k));
  const coverage = { profileVersion: 'coverage/v2', sampledBounds: { min, max }, sampledPositions: all };
  return {
    profileVersion: 'target-facts/v2', source: 'INSPECTED', worldRef: 'fixture-world',
    objectRef: 'fixture-site', worldRevision: 'fixture-world-1', objectRevision: 'fixture-site-1',
    buildDigest: null, planRevision: null,
    catalogueDigest: digestValue('catalogue', catalogue()).sha256,
    frameDigest: digestValue('frame', frame()).sha256,
    sampledBounds: { min, max }, coverageDigest: digestValue('coverage', coverage).sha256,
    occupiedCells: occupied.map(position => ({ position, nodeName: 'fixture:stone', param2: 0 })),
    knownEmptyCells: all.filter(p => !blocked.has(k(p))).sort(comparePosition),
    unknownCells: unknown.map(position => ({ position, reason: 'UNLOADED' })),
    portals,
    usableVolume: unknown.length ? null : { emptyCellCount: all.length - occupied.length,
      physicalVolume: null, standingArea: null, unit: 'node' },
  };
}

export const safetyProfile = ({ entrance = false, unit = 'node' } = {}) => ({ profileVersion: 'safety-profile/v2',
  avatarDimensions: { width: 1, height: 2, depth: 1, unit }, connectivity: 6,
  requireProtectedClearance: true, requireBodyClearance: true, requireEntranceConnectivity: entrance,
  hazardPolicy: { forbidLiquid: true, maximumDamagePerSecond: 0 }, optionalLightRule: null });

export function brief({ media = true, text = '照这张图搭一个小木屋' } = {}) {
  return { contractVersion: 'ReferenceBrief/v2', sessionRef: 'fixture-session', turnRevision: 'fixture-turn-1',
    briefRevision: 'fixture-brief-1',
    media: media ? [{ attachmentRef: `sha256:${IMAGE_SHA}`, storedBytesDigest: IMAGE_SHA,
      projectionVariantId: null, projectionBytesDigest: null, mediaType: 'image/png', bytes: 2048,
      width: 64, height: 48 }] : [],
    text, controls: { purpose: 'small cabin', dimensions: null, entrancePortalRefs: [], styleText: null } };
}

/** A complete, digest-coherent CreateBuildPlanRequest. `patch` replaces fields
 * after digests are computed; `briefOptions`/`facts`/`kind` shape the inputs. */
export function request({ patch = {}, briefOptions, facts, kind = 'BUILD_STRUCTURE', confirmedText,
  safety, entrancePortalRefs = [] } = {}) {
  const b = brief(briefOptions);
  const bDigest = digestValue('reference-brief', b).sha256;
  const intent = { contractVersion: 'session/v2', referenceBriefDigest: bDigest,
    confirmedIntent: { kind, text: confirmedText ?? b.text, purpose: 'small cabin', dimensions: null,
      entrancePortalRefs, confirmedTurnRevision: 'fixture-turn-1' },
    intendedWorldRef: 'fixture-world', orderedTargetRefs: ['fixture-site'] };
  const tf = facts ?? targetFacts();
  const sp = safety ?? safetyProfile();
  return { contractVersion: 'painter/v2', actorRef: 'fixture-actor', sessionRef: 'fixture-session',
    requestId: 'fixture-request-1', authorizationRef: 'fixture-auth', worldRef: 'fixture-world',
    turnRevision: 'fixture-turn-1', painterId: 'picture-blocks', invocationId: 'fixture-invocation-1',
    intent, intentDigest: digestValue('intent', intent).sha256, referenceBrief: b,
    referenceBriefDigest: bDigest, catalogue: catalogue(), targetFacts: tf,
    targetFactsDigest: digestValue('target-facts', tf).sha256, safetyProfile: sp,
    safetyProfileDigest: digestValue('safety-profile', sp).sha256, ...patch };
}

export function authority({ current = true, allowed = ['CreateBuildPlan'], worldRevision = 'fixture-world-1' } = {}) {
  const calls = [];
  const state = { current };
  return { calls, state, verify: async (body, action) => {
    calls.push(action);
    return { current: state.current, actorRef: body.actorRef, sessionRef: body.sessionRef,
      authorizationRef: body.authorizationRef, allowedActions: allowed, authorRef: 'fixture-author',
      currentWorldRevision: worldRevision };
  } };
}

export const CABIN = JSON.stringify({ decision: 'BUILD',
  materials: { wall: { nodeName: 'fixture:wood', param2: 0 }, floor: { nodeName: 'fixture:stone', param2: 0 } },
  boxes: [{ min: [0, 0, 0], max: [2, 0, 2], materialRef: 'floor' },
    { min: [0, 1, 0], max: [2, 1, 2], materialRef: 'wall' }] });

/** Synthetic host `llm` service; records every stream request. */
export function llm({ answers = [CABIN], modalities = ['text', 'image'], finish = { kind: 'stop' } } = {}) {
  const requests = [];
  const queue = [...answers];
  return { requests,
    resolveModelInfo: async (provider, model) => ({ provider, id: model, name: model, inputModalities: modalities }),
    async *stream(options) {
      requests.push(options);
      const text = queue.length > 1 ? queue.shift() : queue[0];
      yield { type: 'block-start', index: 0, blockType: 'text' };
      for (let i = 0; i < text.length; i += 7) yield { type: 'text-delta', index: 0, text: text.slice(i, i + 7) };
      yield { type: 'usage', usage: { inputTokens: 1, outputTokens: 1 } };
      yield { type: 'finish', reason: finish };
    } };
}

export const attachments = () => ({ fixture: true });

export function trustedFixtureFacts() {
  return { frame: frame(),
    evidence: { providerRef: 'FIXTURE-adapter', sourceRevision: 'fixture-evidence-1',
      worldRef: 'fixture-world', worldRevision: 'fixture-world-1' },
    protection: { protectedPositions: [] }, body: { bodyOccupiedPositions: [[0, 5, 0]] } };
}

/** 5x4x5 site at [10,0,10]: occupied ground layer y=0, empty above. Portal
 * "front" is the 1x2 south doorway plane [12,1..2,10]; entrance connectivity
 * required for a 1x2x1 avatar. */
export function entranceRequest({ refs = ['front'], portals = [{ portalRef: 'front', positions: [[12, 1, 10], [12, 2, 10]] }],
  unit = 'node', unknown = [] } = {}) {
  const ground = [];
  for (let x = 10; x <= 14; x++) for (let z = 10; z <= 14; z++) ground.push([x, 0, z]);
  return request({ facts: targetFacts({ occupied: ground, unknown, max: [14, 3, 14], portals }),
    safety: safetyProfile({ entrance: true, unit }), entrancePortalRefs: refs });
}

/** On the ground: four 2-high walls around a 3x3 interior, a roof at local
 * y=3 unless `roof` is false; `door` cuts the 1x2 portal plane. */
export function hut({ door = true, roof = true } = {}) {
  const boxes = [
    { min: [0, 1, 0], max: [4, 2, 0], materialRef: 'wall' }, { min: [0, 1, 4], max: [4, 2, 4], materialRef: 'wall' },
    { min: [0, 1, 0], max: [0, 2, 4], materialRef: 'wall' }, { min: [4, 1, 0], max: [4, 2, 4], materialRef: 'wall' },
  ];
  if (roof) boxes.push({ min: [0, 3, 0], max: [4, 3, 4], materialRef: 'wall' });
  if (door) boxes.push({ min: [2, 1, 0], max: [2, 2, 0], materialRef: 'gap' });
  return JSON.stringify({ decision: 'BUILD', materials: { wall: { nodeName: 'fixture:wood', param2: 0 },
    gap: { nodeName: 'air', param2: 0 } }, boxes });
}
