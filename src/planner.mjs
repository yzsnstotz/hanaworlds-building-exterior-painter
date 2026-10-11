// Pure P3 picture-blocks planning: a validated proposal plus bound facts
// becomes BUILD/V5 geometry. Nothing here reads a world, a Session or a model.
// Materials are opaque world-source refs with a neutral orientation; every
// capability (passable, liquid, hazard) is read from the bound Catalogue tags.
import {
  ContractError, digestValue, validateType, validateStaticMaterials,
  comparePosition, compareUTF16, validateWitnessCoherence, canonicalJSON,
  safetyProfileFromConfirmedIntent, requireSiteRuleChecks,
} from 'hanaworlds-contracts';

export const PAINTER_ID = 'building-exterior';
const fail = (code, phase, reason) => { throw new ContractError(code, phase, reason); };
const key = position => position.join(',');

function* cellsOf(box) {
  for (let x = box.min[0]; x <= box.max[0]; x++)
    for (let y = box.min[1]; y <= box.max[1]; y++)
      for (let z = box.min[2]; z <= box.max[2]; z++) yield [x, y, z];
}

/**
 * Validate a contract-admitted BuildProposal against the bound catalogue and
 * target facts and return world-frame operations plus exact final effects.
 * Every written cell must be a sampled known-empty cell: a new exterior never
 * replaces existing occupancy and never writes an unknown cell.
 */
export function planGeometry({ proposal, catalogue, targetFacts }) {
  const { min: origin, max: limit } = targetFacts.sampledBounds;
  let materials;
  try { materials = validateStaticMaterials(proposal.materials, catalogue); }
  catch (error) {
    if (error instanceof ContractError &&
        ['CATALOGUE_MISMATCH', 'UNSUPPORTED_MUTATION_SEMANTICS'].includes(error.code))
      fail('UNSUPPORTED_MATERIAL', 'validate', error.reason);
    fail('BUILD_INVALID', 'validate', 'INVALID_SHAPE');
  }
  const operations = proposal.boxes.map(box => {
    if (!Object.hasOwn(materials, box.materialRef)) fail('UNSUPPORTED_MATERIAL', 'validate', 'CATALOGUE_UNRESOLVED');
    const min = box.min.map((v, i) => v + origin[i]);
    const max = box.max.map((v, i) => v + origin[i]);
    if (!min.every((v, i) => v <= max[i]) || !min.every((v, i) => v >= origin[i]) ||
        !max.every((v, i) => v <= limit[i]) || ![...min, ...max].every(Number.isSafeInteger))
      fail('BUILD_INVALID', 'validate', 'INVALID_GEOMETRY');
    return { op: 'set_box', min, max, materialRef: box.materialRef };
  });
  const empty = new Set(targetFacts.knownEmptyCells.map(key));
  const occupied = new Set(targetFacts.occupiedCells.map(c => key(c.position)));
  const final = new Map();
  for (const op of operations) for (const cell of cellsOf(op)) {
    const k = key(cell);
    if (occupied.has(k)) fail('BUILD_INVALID', 'validate', 'INVALID_GEOMETRY');
    if (!empty.has(k)) fail('TARGET_FACTS_INCOMPLETE', 'validate', 'REQUIRED_FACT_UNKNOWN');
    const spec = materials[op.materialRef];
    final.set(k, { geometryProfile: targetFacts.geometryProfile, position: cell,
      materialRef: spec.materialRef, orientation: spec.orientation }); // last writer wins
  }
  const effects = [...final.values()].sort((a, b) => comparePosition(a.position, b.position));
  const declaredBounds = {
    min: [0, 1, 2].map(a => Math.min(...operations.map(op => op.min[a]))),
    max: [0, 1, 2].map(a => Math.max(...operations.map(op => op.max[a]))),
  };
  return { materials, operations, effects, declaredBounds };
}

/** Whether a final-state material can be part of an entrance clearance box: its
 * world-source tags say passable, and its liquid/hazard tags are known and within
 * the bound hazard policy. Any unknown (null) tag is not passable. */
function passable(tags, hazardPolicy) {
  return !!tags && tags.passable === true && tags.liquid !== null && tags.hazardPerSecond !== null &&
    (!hazardPolicy.forbidLiquid || tags.liquid === false) &&
    tags.hazardPerSecond <= hazardPolicy.maximumDamagePerSecond;
}

/**
 * The player-confirmed site rules every check reads, bound from the request in
 * this one place. Their only source is the confirmed intent: the carried
 * SafetyProfile must be exactly the one derived from it. A stated light rule
 * is refused by capability name (no light check exists); a required entrance
 * needs the confirmed design clearance. No player body or avatar size is read.
 */
export function boundRules(request) {
  const { safetyProfile, intent } = request;
  if (canonicalJSON(safetyProfile) !== canonicalJSON(safetyProfileFromConfirmedIntent(intent)))
    fail('INTENT_UNCONFIRMED', 'validate', 'PAYLOAD_CHANGED');
  const rules = intent.confirmedIntent.siteRules;
  requireSiteRuleChecks(rules, { entrance: true });
  if (rules.requireEntranceConnectivity && rules.entranceClearance === null)
    fail('INTENT_UNCONFIRMED', 'validate', 'REQUIRED_FACT_UNKNOWN');
  return {
    requireEntrance: rules.requireEntranceConnectivity,
    clearance: rules.entranceClearance,
    portalRefs: intent.confirmedIntent.entrancePortalRefs,
    hazardPolicy: rules.hazardPolicy,
  };
}

/** Grid cells a confirmed ClearanceCells box spans (whole nodes). */
function clearanceSpan(clearance) {
  if (clearance?.unit !== 'node') fail('TARGET_FACTS_INCOMPLETE', 'validate', 'REQUIRED_FACT_UNKNOWN');
  return [clearance.width, clearance.height, clearance.depth];
}

/** Final-state cells whose whole clearance box (anchored at the minimum
 * corner) is `empty`; key -> position. */
function usableCells(finalMaterial, span, empty) {
  const usable = new Map();
  for (const k of finalMaterial.keys()) {
    const p = k.split(',').map(Number);
    let clear = true;
    for (let dx = 0; clear && dx < span[0]; dx++) for (let dy = 0; clear && dy < span[1]; dy++)
      for (let dz = 0; clear && dz < span[2]; dz++) clear = empty(key([p[0] + dx, p[1] + dy, p[2] + dz]));
    if (clear) usable.set(k, p);
  }
  return usable;
}

/**
 * ENTRANCE_CONNECTIVITY for a new exterior, recomputed only from bound facts:
 * the final state (written effects over sampled known cells), catalogue
 * capabilities, the confirmed hazard policy and the confirmed design
 * clearance (ClearanceCells; a building design value, not a body guarantee). A
 * usable position is a sampled cell whose whole clearance box (anchored at its
 * minimum corner) is verified empty material that the hazard policy allows. The
 * declared use space is the usable cells of an enclosed cavity (see below).
 * Entrances: each confirmed portal, or, with no confirmed portal, the doorway on
 * the `entranceFacing` side (portalRef null; see checkEntranceFacing). Each
 * must reach the use space by a six-neighbor path over usable positions.
 * Returns [] and checks nothing when the confirmed rules require no entrance.
 * Passage needs proven facts: an unknown capability is never passable (empty material) and
 * never seals a cavity (other materials). A refusal that only unknown capabilities
 * cause is TARGET_FACTS_INCOMPLETE/REQUIRED_FACT_UNKNOWN; BUILD_INVALID means the
 * geometry fails even with every unknown resolved in its favour.
 */
export function planEntrances(args) {
  try { return entrancesFrom(args); }
  catch (error) {
    if (!(error instanceof ContractError) || error.code !== 'BUILD_INVALID') throw error;
    // Tell a missing fact from invalid geometry: if the same plan would pass with
    // every unknown Catalogue capability resolved in the entrance's favour, the
    // refusal is caused by facts nobody supplied, not by the building. This only
    // chooses the refusal; nothing is ever planned or released on assumed facts.
    let resolvable = true;
    try { entrancesFrom({ ...args, request: { ...args.request, catalogue: favourableCatalogue(args.request.catalogue) } }); }
    catch (probe) { if (!(probe instanceof ContractError)) throw probe; resolvable = false; }
    if (resolvable) fail('TARGET_FACTS_INCOMPLETE', 'validate', 'REQUIRED_FACT_UNKNOWN');
    throw error;
  }
}

/** The bound Catalogue with each unknown (null) tag resolved in the entrance's
 * favour: the empty material passable and harmless, every other material
 * blocking. Known values are kept. Used only by planEntrances to attribute a refusal. */
function favourableCatalogue(catalogue) {
  return { ...catalogue, materials: Object.fromEntries(Object.entries(catalogue.materials).map(([ref, t]) => [ref,
    ref === catalogue.emptyMaterialRef
      ? { ...t, passable: t.passable ?? true, liquid: t.liquid ?? false, hazardPerSecond: t.hazardPerSecond ?? 0 }
      : { ...t, passable: t.passable ?? false }])) };
}

function entrancesFrom({ request, geometry, entranceFacing = null }) {
  const { catalogue, targetFacts } = request;
  const rules = boundRules(request);
  if (!rules.requireEntrance) return [];
  const refs = rules.portalRefs;
  const span = clearanceSpan(rules.clearance);
  // Final state of every sampled known cell: empty cells hold the Catalogue's
  // emptyMaterialRef, occupied cells keep their material, written effects
  // replace either. Unknown and unsampled cells are absent.
  const emptyRef = catalogue.emptyMaterialRef;
  const finalMaterial = new Map(targetFacts.knownEmptyCells.map(p => [key(p), emptyRef]));
  for (const c of targetFacts.occupiedCells) finalMaterial.set(key(c.position), c.materialRef);
  for (const e of geometry.effects) finalMaterial.set(key(e.position), e.materialRef);
  // Use and path cells must be verified EMPTY and passable (a passable plant is
  // not empty): final material is the empty material and its tags pass.
  const empty = k => finalMaterial.get(k) === emptyRef && passable(catalogue.materials[emptyRef], rules.hazardPolicy);
  // Only a proven non-passable material seals a cavity side. A passable
  // non-empty material (plant, vine, liquid) or an unknown tag lets sky through.
  const blocks = k => catalogue.materials[finalMaterial.get(k)]?.passable === false;
  const usable = usableCells(finalMaterial, span, empty);
  const steps = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  // A confirmed portal must exist in the bound facts (no portal producer today
  // means a named refusal). Without one, the entrance is the doorway on the
  // entranceFacing side; its clearance boxes are the entrance plane.
  const portals = refs.length > 0 ? refs.map(portalRef => {
    const portal = targetFacts.portals.find(x => x.portalRef === portalRef);
    if (!portal) fail('TARGET_FACTS_INCOMPLETE', 'validate', 'REQUIRED_FACT_UNKNOWN');
    return portal;
  }) : [doorwayEntrance({ request, geometry, entranceFacing, span })];
  // Cavity (CONTRACT_RULES §TargetFacts): with the entrance planes
  // temporarily sealed, flood every non-blocking cell 6-adjacently. A
  // component is interior only if it never reaches an unknown or unsampled
  // cell (sky, outside world) and is bounded only by proven collision.
  const sealed = new Set(portals.flatMap(x => x.positions.map(key)));
  const cavity = new Set();
  const visited = new Set();
  for (const start of usable.keys()) {
    if (visited.has(start) || sealed.has(start)) continue;
    const component = [start];
    visited.add(start);
    let enclosed = true;
    for (let i = 0; i < component.length; i++) {
      const p = component[i].split(',').map(Number);
      for (const d of steps) {
        const n = key([p[0] + d[0], p[1] + d[1], p[2] + d[2]]);
        if (sealed.has(n) || visited.has(n)) continue;
        if (!finalMaterial.has(n)) { enclosed = false; continue; } // unknown or outside the sampled facts
        if (blocks(n)) continue;
        visited.add(n); component.push(n);
      }
    }
    if (enclosed) for (const k of component) cavity.add(k);
  }
  const useSpace = new Set([...usable.keys()].filter(k => cavity.has(k)));
  if (useSpace.size === 0) fail('BUILD_INVALID', 'validate', 'INVALID_GEOMETRY');
  const usablePositions = [...usable.values()].sort(comparePosition);
  return portals.map(({ portalRef, ...portal }) => {
    const starts = (portal.starts ?? portal.positions).map(key).filter(k => usable.has(k));
    const previous = new Map(starts.map(k => [k, null]));
    const queue = [...starts];
    let goal = null;
    while (queue.length && goal === null) {
      const k = queue.shift();
      if (useSpace.has(k)) { goal = k; break; }
      const p = usable.get(k);
      for (const d of steps) {
        const n = key([p[0] + d[0], p[1] + d[1], p[2] + d[2]]);
        if (usable.has(n) && !previous.has(n)) { previous.set(n, k); queue.push(n); }
      }
    }
    if (goal === null) fail('BUILD_INVALID', 'validate', 'INVALID_GEOMETRY');
    const path = [];
    for (let k = goal; k !== null; k = previous.get(k)) path.unshift(usable.get(k));
    return { portalRef, usablePositions, path };
  });
}

/** The unconfirmed-portal entrance: the doorway cells on the entranceFacing
 * side plus their clearance boxes as the sealed plane. No doorway is BUILD_INVALID. */
function doorwayEntrance({ request, geometry, entranceFacing, span }) {
  const doorways = checkEntranceFacing({ request, geometry, entranceFacing });
  if (doorways.length === 0) fail('BUILD_INVALID', 'validate', 'INVALID_GEOMETRY');
  const plane = new Map();
  for (const p of doorways)
    for (let dx = 0; dx < span[0]; dx++) for (let dy = 0; dy < span[1]; dy++) for (let dz = 0; dz < span[2]; dz++) {
      const c = [p[0] + dx, p[1] + dy, p[2] + dz];
      plane.set(key(c), c);
    }
  return { portalRef: null, positions: [...plane.values()].sort(comparePosition), starts: doorways };
}

/**
 * The trusted assembleBuild input for a first new building: the frame and
 * evidence of the Adapter-produced RegionInspection relayed by Canvas
 * (painter/v6). It carries no player geometry: real bodies are checked inside
 * the engine. Nothing is defaulted; a missing part is a typed rejection.
 */
export function trustedFromRegion(regionInspection) {
  const ri = regionInspection;
  if (!ri?.frame || !ri.evidence) fail('TARGET_FACTS_INCOMPLETE', 'validate', 'REQUIRED_FACT_UNKNOWN');
  return { frame: ri.frame, evidence: ri.evidence };
}

const HORIZONTAL_FACES = new Set(['+X', '-X', '+Z', '-Z']);

/**
 * HW-A028 painter side: a first building's entrance faces the anchor player.
 * Run only when the confirmed rules require an entrance and no portal is
 * confirmed (planEntrances). A doorway is a usable cell (full confirmed
 * clearance over verified empty material, the same rule as planEntrances) on a side face of the structure's footprint
 * that is 6-adjacent to a usable cell strictly inside the footprint. When the
 * structure has a usable interior, it must have a doorway on the face whose
 * outward normal is `entranceFacing`, and no doorway on any other side face.
 * A structure without a usable interior (e.g. a solid block) has no entrance.
 * Returns the doorway cells (sorted).
 */
export function checkEntranceFacing({ request, geometry, entranceFacing }) {
  if (!HORIZONTAL_FACES.has(entranceFacing)) fail('TARGET_FACTS_INCOMPLETE', 'validate', 'REQUIRED_FACT_UNKNOWN');
  const { catalogue, targetFacts } = request;
  const rules = boundRules(request);
  const span = clearanceSpan(rules.clearance);
  const emptyRef = catalogue.emptyMaterialRef;
  const finalMaterial = new Map(targetFacts.knownEmptyCells.map(p => [key(p), emptyRef]));
  for (const e of geometry.effects) finalMaterial.set(key(e.position), e.materialRef);
  const empty = k => finalMaterial.get(k) === emptyRef && passable(catalogue.materials[emptyRef], rules.hazardPolicy);
  const usable = new Set(usableCells(finalMaterial, span, empty).keys());
  const { min, max } = geometry.declaredBounds;
  const inY = p => p[1] >= min[1] && p[1] <= max[1];
  const strictlyInside = p => inY(p) && p[0] > min[0] && p[0] < max[0] && p[2] > min[2] && p[2] < max[2];
  const faceOf = p => {
    if (!inY(p) || p[0] < min[0] || p[0] > max[0] || p[2] < min[2] || p[2] > max[2] || strictlyInside(p)) return null;
    if (p[2] === min[2]) return '-Z';
    if (p[2] === max[2]) return '+Z';
    return p[0] === min[0] ? '-X' : '+X';
  };
  const interior = [...usable].map(k => k.split(',').map(Number)).filter(strictlyInside);
  if (interior.length === 0) return [];
  const interiorKeys = new Set(interior.map(key));
  const steps = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
  const doorways = [...usable].map(k => k.split(',').map(Number)).filter(p => faceOf(p) !== null &&
    steps.some(d => interiorKeys.has(key([p[0] + d[0], p[1], p[2] + d[2]]))));
  if (!doorways.some(p => faceOf(p) === entranceFacing) || doorways.some(p => faceOf(p) !== entranceFacing))
    fail('BUILD_INVALID', 'validate', 'INVALID_GEOMETRY');
  return doorways.sort(comparePosition);
}

/**
 * Assemble the complete BuildProjection. `trusted` must come from a public,
 * provider-verified source: the exact coordinate Frame whose digest equals
 * targetFacts.frameDigest and Adapter evidence (painter/v6: trustedFromRegion).
 * Missing trusted facts are a typed rejection, never a default.
 */
export function assembleBuild({ request, geometry, documentId, trusted,
  entrances = planEntrances({ request, geometry, entranceFacing: request.regionInspection?.entranceFacing ?? null }) }) {
  const { catalogue, targetFacts, safetyProfile } = request;
  const rules = boundRules(request);
  if (!trusted?.frame || !trusted.evidence)
    fail('TARGET_FACTS_INCOMPLETE', 'validate', 'REQUIRED_FACT_UNKNOWN');
  if (digestValue('frame', trusted.frame).sha256 !== targetFacts.frameDigest)
    fail('TARGET_FACTS_STALE', 'validate', 'REVISION_CHANGED');
  const catalogueDigest = digestValue('catalogue', catalogue).sha256;
  const finalEffects = { profileVersion: 'final-effects/v3', frameDigest: targetFacts.frameDigest,
    catalogueDigest, effects: geometry.effects };
  const bound = {
    finalEffectsDigest: digestValue('final-effects', finalEffects).sha256,
    targetFactsDigest: request.targetFactsDigest,
    safetyProfileDigest: request.safetyProfileDigest,
  };
  const positions = geometry.effects.map(e => e.position);
  const written = new Set(positions.map(key));
  const evidence = trusted.evidence;
  const hazardOk = geometry.effects.every(e => {
    const t = catalogue.materials[e.materialRef];
    return t.liquid !== null && t.hazardPerSecond !== null &&
      (!rules.hazardPolicy.forbidLiquid || t.liquid === false) &&
      t.hazardPerSecond <= rules.hazardPolicy.maximumDamagePerSecond;
  });
  if (!hazardOk) fail('UNSUPPORTED_MATERIAL', 'validate', 'REQUIRED_FACT_UNKNOWN');
  const hazardCells = new Map(positions.map(p => [key(p), p]));
  for (const entrance of entrances) for (const p of entrance.usablePositions) hazardCells.set(key(p), p);
  const hazardPositions = [...hazardCells.values()].sort(comparePosition);
  const witnesses = [
    { witnessId: 'w1', predicate: 'COVERAGE', ...bound, facts: { evidence, positions } },
    // Binds the covered positions only; real bodies are checked inside the engine.
    { witnessId: 'w3', predicate: 'BODY_CLEARANCE', ...bound, facts: { evidence, positions } },
    // Hazard is recomputed at every written cell and every entrance use/path cell.
    { witnessId: 'w4', predicate: 'HAZARD', ...bound,
      facts: { evidence, positions: hazardPositions, forbidLiquid: rules.hazardPolicy.forbidLiquid,
        maximumDamagePerSecond: rules.hazardPolicy.maximumDamagePerSecond } },
    ...entrances.map(entrance => ({ witnessId: `w5-${entrance.portalRef ?? 'doorway'}`,
      predicate: 'ENTRANCE_CONNECTIVITY', ...bound,
      facts: { evidence, portalRef: entrance.portalRef, usablePositions: entrance.usablePositions,
        path: entrance.path, clearance: rules.clearance } })),
  ].sort((a, b) => compareUTF16(a.witnessId, b.witnessId));
  const build = validateType('BuildProjection', {
    contractVersion: 'BUILD/V5', geometryProfile: targetFacts.geometryProfile, documentId, coordinateFrame: trusted.frame, catalogueDigest,
    targetFactsDigest: request.targetFactsDigest, safetyProfileDigest: request.safetyProfileDigest,
    materials: geometry.materials, operations: geometry.operations,
    declaredBounds: geometry.declaredBounds, witnesses,
  });
  // Witness recheck: a stated light rule stays refused by name here too.
  requireSiteRuleChecks(safetyProfile, { entrance: true });
  validateWitnessCoherence({ build, finalEffects, targetFacts, safetyProfile, catalogue });
  return { build, buildDigest: digestValue('build', build).sha256, finalEffects };
}
