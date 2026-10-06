// Pure region v1 proposal validation: a skill-confirmed voxel block + palette
// becomes a region BUILD for Brush. Nothing here reads a world, a Session or a
// model, and nothing writes: Canvas decides the transaction, Adapter transports.
import { ContractError, decodeRawJSON, digestValue, validateStaticMaterials, comparePosition } from '#contracts';

const fail = (code, reason, phase = 'validate') => { throw new ContractError(code, phase, reason); };
const key = position => position.join(',');
const isPosition = value => Array.isArray(value) && value.length === 3 && value.every(Number.isSafeInteger);
const exact = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value, k));

export const REGION_DECISION = 'BUILD_REGION';
export const REGION_PROTOCOL = 'hanaworlds-region-voxels';
/** Supported protocol major and the capabilities this Painter implements. */
export const REGION_SUPPORT = Object.freeze({ protocol: REGION_PROTOCOL, version: '1.0.0',
  capabilities: Object.freeze(['palette-v1', 'air-carve', 'unspecified-skip']) });
/** Capabilities a region contract implementation must offer before Painter consumes it. */
export const REGION_CONTRACT_REQUIRES = Object.freeze(['palette-v1', 'air-carve', 'unspecified-skip']);
/** Luanti VoxelArea / schematic order: x varies fastest, then y, then z.
 * index = x + sizeX * (y + sizeY * z), all region-local. */
export const REGION_AXIS_ORDER = 'x-fastest,y,z';
/** The engine's air node: the only carve material. Any other node is a fill. */
export const CARVE_NODE = 'air';

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
function parseVersion(text) {
  const m = typeof text === 'string' ? SEMVER.exec(text) : null;
  if (!m) fail('UNSUPPORTED_VERSION', 'VERSION_UNSUPPORTED', 'decode');
  return m.slice(1).map(Number);
}

/**
 * Protocol-major compatibility: same protocol, same major, and for major 0 the
 * same minor (0.x is not unconditionally compatible). Patch and package hashes
 * never decide compatibility. Every required capability must be supported.
 */
export function checkRegionCompatibility({ protocol, version, requires }, support = REGION_SUPPORT) {
  if (protocol !== support.protocol) fail('UNSUPPORTED_VERSION', 'VERSION_UNSUPPORTED', 'decode');
  const [major, minor] = parseVersion(version);
  const [supportedMajor, supportedMinor] = parseVersion(support.version);
  if (major !== supportedMajor || (major === 0 && minor !== supportedMinor))
    fail('UNSUPPORTED_VERSION', 'VERSION_UNSUPPORTED', 'decode');
  if (!Array.isArray(requires) || !requires.every(c => support.capabilities.includes(c)))
    fail('CAPABILITY_UNAVAILABLE', 'POLICY_UNAVAILABLE');
  return Object.freeze({ protocol, version, major });
}

/** A region contract port is consumable only for a compatible major offering
 * every capability this Painter relies on. */
export function checkRegionContract(port) {
  if (!port || typeof port !== 'object' || !port.regionProtocol)
    fail('CAPABILITY_UNAVAILABLE', 'POLICY_UNAVAILABLE');
  const { protocol, version, capabilities } = port.regionProtocol;
  checkRegionCompatibility({ protocol, version, requires: [...REGION_CONTRACT_REQUIRES] },
    { protocol: REGION_PROTOCOL, version: REGION_SUPPORT.version, capabilities: capabilities ?? [] });
  for (const fn of ['validateRegionRequest', 'validateRegionContext', 'regionBuildDigest', 'validateRegionResponse'])
    if (typeof port[fn] !== 'function') fail('CAPABILITY_UNAVAILABLE', 'POLICY_UNAVAILABLE');
  return port;
}

/** Whether a decoded request carries a region proposal (routing only). */
export function isRegionRequest(raw) {
  try {
    const value = typeof raw === 'string' || raw instanceof Uint8Array
      ? decodeRawJSON(typeof raw === 'string' ? new TextEncoder().encode(raw) : raw) : raw;
    return value?.proposal?.decision === REGION_DECISION;
  } catch { return false; }
}

/** Strict shape of a region v1 proposal. Unknown fields, non-integer
 * coordinates, wrong cell count or ambiguous palette are rejected. */
export function parseRegionProposal(value) {
  const shape = ok => { if (!ok) fail('BUILD_INVALID', 'INVALID_SHAPE'); };
  shape(exact(value, ['decision', 'format', 'region']) && value.decision === REGION_DECISION);
  const { format, region } = value;
  shape(exact(format, ['protocol', 'version', 'requires']) && typeof format.protocol === 'string' &&
    typeof format.version === 'string' && Array.isArray(format.requires) &&
    format.requires.every(c => typeof c === 'string' && c.length > 0) &&
    new Set(format.requires).size === format.requires.length);
  shape(exact(region, ['min', 'size', 'axisOrder', 'palette', 'cells']) && isPosition(region.min) &&
    Array.isArray(region.size) && region.size.length === 3 && region.size.every(n => Number.isSafeInteger(n) && n > 0) &&
    typeof region.axisOrder === 'string' && Array.isArray(region.palette) && region.palette.length > 0 &&
    Array.isArray(region.cells));
  for (const entry of region.palette)
    shape(exact(entry, ['nodeName', 'param2']) && typeof entry.nodeName === 'string' && entry.nodeName.length > 0 &&
      Number.isInteger(entry.param2) && entry.param2 >= 0 && entry.param2 <= 255);
  const specs = region.palette.map(e => `${e.nodeName}\u0000${e.param2}`);
  if (new Set(specs).size !== specs.length) fail('NON_CANONICAL_AMBIGUITY', 'INVALID_SHAPE');
  return { decision: REGION_DECISION, format, region };
}

/**
 * Validate a parsed region against the bound request facts. Every specified
 * cell must be a sampled KNOWN cell (empty or occupied); unspecified (null)
 * cells are never written and never mean carve; carve is explicit air.
 * Returns world-frame region, changed effects and counts.
 */
export function planRegion({ proposal, request }) {
  const { format, region } = proposal;
  checkRegionCompatibility(format);
  if (region.axisOrder !== REGION_AXIS_ORDER) fail('BUILD_INVALID', 'INVALID_SHAPE');
  const { catalogue, targetFacts: facts, safetyProfile: safety, regionInspection } = request;
  if (facts.source !== 'REGION_INSPECTED') fail('TARGET_REQUIRED', 'REQUIRED_FACT_UNKNOWN');
  if (facts.worldRef !== request.worldRef) fail('TARGET_FACTS_STALE', 'REVISION_CHANGED');
  if (facts.catalogueDigest !== digestValue('catalogue', catalogue).sha256) fail('TARGET_FACTS_STALE', 'REVISION_CHANGED');
  // Exact cell count; BigInt so an oversized declaration cannot overflow.
  const [sx, sy, sz] = region.size;
  if (BigInt(sx) * BigInt(sy) * BigInt(sz) !== BigInt(region.cells.length)) fail('BUILD_INVALID', 'INVALID_GEOMETRY');
  const bounds = facts.sampledBounds;
  const translate = (local, extra) => local.map((v, axis) => {
    const world = BigInt(v) + BigInt(extra[axis]) + BigInt(bounds.min[axis]);
    if (world < BigInt(bounds.min[axis]) || world > BigInt(bounds.max[axis])) fail('BUILD_INVALID', 'INVALID_GEOMETRY');
    return Number(world);
  });
  const min = translate(region.min, [0, 0, 0]);
  const max = translate(region.min, region.size.map(n => n - 1));
  // Palette legality: every entry is a static Catalogue node with an allowed
  // param2, carve included (air must itself be a known static node).
  const materials = Object.fromEntries(region.palette.map((e, i) => [`p${i}`, { nodeName: e.nodeName, param2: e.param2 }]));
  try { validateStaticMaterials(materials, catalogue); }
  catch (error) {
    if (error instanceof ContractError && ['CATALOGUE_MISMATCH', 'UNSUPPORTED_MUTATION_SEMANTICS'].includes(error.code))
      fail('UNSUPPORTED_MATERIAL', error.reason);
    fail('BUILD_INVALID', 'INVALID_SHAPE');
  }
  const carves = region.palette.some(e => e.nodeName === CARVE_NODE);
  if (carves && !format.requires.includes('air-carve')) fail('BUILD_INVALID', 'INVALID_SHAPE');
  for (const e of region.palette) {
    const c = catalogue.nodes[e.nodeName];
    if (c.liquidType === null || c.damagePerSecond === null) fail('UNSUPPORTED_MATERIAL', 'REQUIRED_FACT_UNKNOWN');
    if ((safety.hazardPolicy.forbidLiquid && c.liquidType !== 'none') ||
        c.damagePerSecond > safety.hazardPolicy.maximumDamagePerSecond)
      fail('SAFETY_INVARIANT_FAILED', 'REQUIRED_FACT_UNKNOWN');
  }
  const current = new Map(facts.knownEmptyCells.map(p => [key(p), { nodeName: CARVE_NODE, param2: 0, occupied: false }]));
  for (const c of facts.occupiedCells) current.set(key(c.position), { nodeName: c.nodeName, param2: c.param2, occupied: true });
  const body = new Set(regionInspection.bodyOccupiedPositions.map(key));
  const counts = { specified: 0, unspecified: 0, filled: 0, carved: 0, unchanged: 0 };
  const effects = [];
  const plane = sx * sy;
  for (let i = 0; i < region.cells.length; i++) {
    const cell = region.cells[i];
    if (cell === null) { counts.unspecified++; continue; }
    if (!Number.isInteger(cell) || cell < 0 || cell >= region.palette.length) fail('BUILD_INVALID', 'INVALID_SHAPE');
    counts.specified++;
    const position = [min[0] + (i % sx), min[1] + (Math.floor(i / sx) % sy), min[2] + Math.floor(i / plane)];
    const k = key(position);
    const before = current.get(k);
    // Unknown or unsampled: a loaded-and-verified region is still required.
    if (!before) fail('TARGET_FACTS_INCOMPLETE', 'REQUIRED_FACT_UNKNOWN');
    const spec = region.palette[cell];
    if (spec.nodeName !== CARVE_NODE && body.has(k)) fail('BUILD_INVALID', 'INVALID_GEOMETRY');
    if (before.nodeName === spec.nodeName && before.param2 === spec.param2) { counts.unchanged++; continue; }
    if (before.occupied) {
      // Replacing existing content: only a known static definition, so the
      // before state is fully restorable from node + param2.
      const existing = catalogue.nodes[before.nodeName];
      if (!existing || existing.hasCallbacks !== false || existing.hasPersistentState !== false ||
          existing.definitionRevision === null)
        fail('UNSUPPORTED_MUTATION_SEMANTICS', 'REQUIRED_FACT_UNKNOWN');
    }
    if (spec.nodeName === CARVE_NODE) counts.carved++; else counts.filled++;
    effects.push({ position, nodeName: spec.nodeName, param2: spec.param2 });
  }
  if (counts.specified === 0) fail('BUILD_INVALID', 'INVALID_GEOMETRY');
  effects.sort((a, b) => comparePosition(a.position, b.position));
  return { format, min, max, size: [...region.size], palette: region.palette.map(e => ({ ...e })),
    cells: [...region.cells], effects, counts };
}

/**
 * Assemble the region BUILD. Frame and evidence are exactly the relayed
 * Adapter inspection; nothing is defaulted.
 */
export function assembleRegionBuild({ request, plan, documentId }) {
  const ri = request.regionInspection;
  if (!ri?.frame || !ri.evidence) fail('TARGET_FACTS_INCOMPLETE', 'REQUIRED_FACT_UNKNOWN');
  if (digestValue('frame', ri.frame).sha256 !== request.targetFacts.frameDigest) fail('TARGET_FACTS_STALE', 'REVISION_CHANGED');
  const catalogueDigest = digestValue('catalogue', request.catalogue).sha256;
  const finalEffects = { profileVersion: 'final-effects/v2', frameDigest: request.targetFacts.frameDigest,
    catalogueDigest, effects: plan.effects };
  return {
    contractVersion: 'BUILD-REGION/v1', documentId, coordinateFrame: ri.frame, catalogueDigest,
    targetFactsDigest: request.targetFactsDigest, safetyProfileDigest: request.safetyProfileDigest,
    evidence: ri.evidence,
    format: { protocol: plan.format.protocol, version: plan.format.version },
    region: { min: plan.min, size: plan.size, axisOrder: REGION_AXIS_ORDER, palette: plan.palette, cells: plan.cells },
    declaredBounds: { min: plan.min, max: plan.max },
    summary: { ...plan.counts },
    finalEffectsDigest: digestValue('final-effects', finalEffects).sha256,
  };
}

/** Self-description for the skill: what each write path is for, typical use
 * and preconditions. Choosing between them is the skill's job; Painter sets no
 * size threshold. */
export const REGION_PROPOSAL_TOOL = Object.freeze({
  name: 'BuildRegionProposal',
  operation: 'ValidateBuildProposal',
  proposalDecision: REGION_DECISION,
  purpose: 'Batch fill or carve a box-shaped region (terrain shaping, large volumes) as one region BUILD; Canvas commits it as one transaction with one whole-region Undo.',
  typicalUse: 'Areas where many cells change together (levelling, digging, filling a volume). For small structures or single-cell adjustments the per-box proposal (decision BUILD) is the usual choice.',
  preconditions: Object.freeze([
    'A current REGION_INSPECTED Adapter inspection covering every specified cell as KNOWN (empty or occupied); unknown or unsampled cells are rejected.',
    'Palette entries are static Catalogue nodes with allowed param2; carving is explicit nodeName "air" and requires format.requires to include "air-carve".',
    'Replaced existing nodes must be known static definitions (no callbacks or persistent state).',
    'Same Session / world / connection / reference brief (including verified image media) as the text proposal path.',
  ]),
  input: Object.freeze({ decision: REGION_DECISION,
    format: '{protocol:"hanaworlds-region-voxels", version:"1.x.y", requires:[capabilities]}',
    region: `{min:[x,y,z] local to targetFacts.sampledBounds.min, size:[sx,sy,sz], axisOrder:"${REGION_AXIS_ORDER}", palette:[{nodeName,param2}], cells:[paletteIndex|null]}`,
    unspecified: 'null cell = not written (never carve)' }),
  compatibility: 'Same protocol major (major 0 also needs same minor) and all required capabilities; patch and package hashes do not decide compatibility.',
  emits: 'region BUILD for Brush; no world, Canvas or Adapter call',
  modelCalls: 0, worldWrites: 0,
});
