// Pure P3 picture-blocks planning: a validated model proposal plus bound facts
// becomes BUILD/V3 geometry. Nothing here reads a world, a Session or a model.
import {
  ContractError, decodeRawJSON, digestValue, validateType, validateStaticMaterials,
  comparePosition, compareUTF16, validateWitnessCoherence,
} from '#contracts';

export const PAINTER_ID = 'picture-blocks';
const fail = (code, phase, reason) => { throw new ContractError(code, phase, reason); };
const key = position => position.join(',');
const isPosition = value => Array.isArray(value) && value.length === 3 && value.every(Number.isSafeInteger);
const exact = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value, k));

/** Local-frame view of the inspected or planned target: its size in grid cells
 * and every sampled cell that a new structure must not occupy. */
export function describeRegion(targetFacts) {
  const { min, max } = targetFacts.sampledBounds;
  const size = max.map((v, i) => v - min[i] + 1);
  const local = p => p.map((v, i) => v - min[i]);
  return {
    size,
    occupied: targetFacts.occupiedCells.map(c => ({ position: local(c.position), nodeName: c.nodeName })),
    unknown: targetFacts.unknownCells.map(c => local(c.position)),
  };
}

/** Catalogue nodes a structure may use: the static mutable subset admitted by
 * validateStaticMaterials. Unknown or stateful definitions are never offered. */
export function offeredMaterials(catalogue) {
  return Object.keys(catalogue.nodes).sort(compareUTF16).filter(name => {
    const c = catalogue.nodes[name];
    return c.hasCallbacks === false && c.hasPersistentState === false &&
      Array.isArray(c.allowedParam2) && c.allowedParam2.length > 0 && c.definitionRevision !== null;
  }).map(name => ({ nodeName: name, allowedParam2: [...catalogue.nodes[name].allowedParam2],
    walkable: catalogue.nodes[name].walkable }));
}

/** Strictly parse the model's text answer. The answer is one JSON object,
 * optionally inside a single ```json fence; anything else is BUILD_INVALID. */
export function parseProposal(text) {
  if (typeof text !== 'string') fail('BUILD_INVALID', 'validate', 'INVALID_SHAPE');
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*\n([\s\S]*?)\n```$/.exec(trimmed);
  const body = fenced ? fenced[1] : trimmed;
  let value;
  try { value = decodeRawJSON(new TextEncoder().encode(body)); }
  catch { fail('BUILD_INVALID', 'validate', 'INVALID_SHAPE'); }
  if (exact(value, ['decision', 'clarification'])) {
    if (value.decision !== 'CLARIFY' || !exact(value.clarification, ['code', 'question']) ||
        !['AMBIGUOUS_INTENT', 'AMBIGUOUS_GEOMETRY', 'IMAGE_REQUIRED'].includes(value.clarification.code) ||
        typeof value.clarification.question !== 'string' || !value.clarification.question.trim())
      fail('BUILD_INVALID', 'validate', 'INVALID_SHAPE');
    return { decision: 'CLARIFY', code: value.clarification.code, question: value.clarification.question.trim() };
  }
  if (!exact(value, ['decision', 'materials', 'boxes']) || value.decision !== 'BUILD' ||
      value.materials === null || typeof value.materials !== 'object' || Array.isArray(value.materials) ||
      !Array.isArray(value.boxes) || value.boxes.length === 0)
    fail('BUILD_INVALID', 'validate', 'INVALID_SHAPE');
  for (const [ref, spec] of Object.entries(value.materials))
    if (!ref || !exact(spec, ['nodeName', 'param2']) || typeof spec.nodeName !== 'string' ||
        !Number.isInteger(spec.param2) || spec.param2 < 0 || spec.param2 > 255)
      fail('BUILD_INVALID', 'validate', 'INVALID_SHAPE');
  for (const box of value.boxes)
    if (!exact(box, ['min', 'max', 'materialRef']) || !isPosition(box.min) || !isPosition(box.max) ||
        typeof box.materialRef !== 'string')
      fail('BUILD_INVALID', 'validate', 'INVALID_SHAPE');
  return { decision: 'BUILD', materials: value.materials, boxes: value.boxes };
}

function* cellsOf(box) {
  for (let x = box.min[0]; x <= box.max[0]; x++)
    for (let y = box.min[1]; y <= box.max[1]; y++)
      for (let z = box.min[2]; z <= box.max[2]; z++) yield [x, y, z];
}

/**
 * Validate a BUILD proposal against the bound catalogue and target facts and
 * return world-frame operations plus exact final effects. Every written cell
 * must be a sampled known-empty cell: a new exterior never replaces existing
 * occupancy and never writes an unknown cell.
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
    final.set(k, { position: cell, nodeName: spec.nodeName, param2: spec.param2 }); // last writer wins
  }
  const effects = [...final.values()].sort((a, b) => comparePosition(a.position, b.position));
  const declaredBounds = {
    min: [0, 1, 2].map(a => Math.min(...operations.map(op => op.min[a]))),
    max: [0, 1, 2].map(a => Math.max(...operations.map(op => op.max[a]))),
  };
  return { materials, operations, effects, declaredBounds };
}

/** Whether a final-state node lets the avatar occupy its cell: explicitly
 * non-walkable, no collision box and within the bound hazard policy. Any
 * unknown (null) capability is not passable. */
function passable(capability, hazardPolicy) {
  return !!capability && capability.walkable === false && Array.isArray(capability.collisionBoxes) &&
    capability.collisionBoxes.length === 0 && capability.liquidType !== null && capability.damagePerSecond !== null &&
    (!hazardPolicy.forbidLiquid || capability.liquidType === 'none') &&
    capability.damagePerSecond <= hazardPolicy.maximumDamagePerSecond;
}

/**
 * The rule inputs the entrance and clearance checks read, bound from the
 * request in this one place. Contracts ^0.5.6 carry them on SafetyProfile
 * (requireEntranceConnectivity, avatarDimensions, hazardPolicy) and the
 * confirmed intent (entrancePortalRefs).
 */
export function boundRules(request) {
  const { safetyProfile, intent } = request;
  return {
    requireEntrance: safetyProfile.requireEntranceConnectivity,
    clearance: safetyProfile.avatarDimensions,
    portalRefs: intent.confirmedIntent.entrancePortalRefs,
    hazardPolicy: safetyProfile.hazardPolicy,
  };
}

/** Grid cells a clearance box spans, ceil per axis; only node units are known. */
function clearanceSpan(clearance) {
  if (clearance?.unit !== 'node') fail('TARGET_FACTS_INCOMPLETE', 'validate', 'REQUIRED_FACT_UNKNOWN');
  return [Math.ceil(clearance.width), Math.ceil(clearance.height), Math.ceil(clearance.depth)];
}

/** Final-state cells whose whole clearance box (anchored at the minimum
 * corner) is `empty`; key -> position. */
function usableCells(finalNode, span, empty) {
  const usable = new Map();
  for (const k of finalNode.keys()) {
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
 * capabilities, the bound hazard policy and the actual avatar dimensions. A
 * usable position is a sampled cell whose whole avatar clearance box
 * (ceil(width) x ceil(height) x ceil(depth) grid cells, anchored at its
 * minimum corner) is verified empty air that the hazard policy allows. The declared use
 * space is the usable cells of an enclosed cavity (see below). Each confirmed
 * entrance portal must reach it by a six-neighbor path over usable positions. Returns [] when the safety profile does not
 * require entrance connectivity.
 */
export function planEntrances({ request, geometry }) {
  const { catalogue, targetFacts } = request;
  const rules = boundRules(request);
  if (!rules.requireEntrance) return [];
  const refs = rules.portalRefs;
  if (refs.length === 0) fail('INTENT_UNCONFIRMED', 'validate', 'REQUIRED_FACT_UNKNOWN');
  const span = clearanceSpan(rules.clearance);
  // Final state of every sampled known cell: empty cells are 'air', occupied
  // cells keep their node, written effects replace either. Unknown and
  // unsampled cells are absent.
  const finalNode = new Map(targetFacts.knownEmptyCells.map(p => [key(p), 'air']));
  for (const c of targetFacts.occupiedCells) finalNode.set(key(c.position), c.nodeName);
  for (const e of geometry.effects) finalNode.set(key(e.position), e.nodeName);
  // Use and path cells must be verified EMPTY and passable ("walkable=false
  // plants are not empty"): final node 'air' whose catalogue capability passes.
  const empty = k => finalNode.get(k) === 'air' && passable(catalogue.nodes.air, rules.hazardPolicy);
  // Only a proven collision seals a cavity side. A non-colliding non-air node
  // (plant, vine, liquid) or a node with unknown collision lets sky through.
  const blocks = k => {
    const c = catalogue.nodes[finalNode.get(k)];
    return !!c && (c.walkable === true || (Array.isArray(c.collisionBoxes) && c.collisionBoxes.length > 0));
  };
  const usable = usableCells(finalNode, span, empty);
  const steps = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const portals = refs.map(portalRef => {
    const portal = targetFacts.portals.find(x => x.portalRef === portalRef);
    if (!portal) fail('TARGET_FACTS_INCOMPLETE', 'validate', 'REQUIRED_FACT_UNKNOWN');
    return portal;
  });
  // Cavity (CONTRACT_RULES §TargetFacts): with the confirmed entrance planes
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
        if (!finalNode.has(n)) { enclosed = false; continue; } // unknown or outside the sampled facts
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
    const starts = portal.positions.map(key).filter(k => usable.has(k));
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

/**
 * The trusted assembleBuild input for a first new building: exactly the
 * Adapter-produced RegionInspection relayed by Canvas (painter/v4). Nothing is
 * defaulted; a missing part is a typed rejection.
 */
export function trustedFromRegion(regionInspection) {
  const ri = regionInspection;
  if (!ri?.frame || !ri.evidence || !Array.isArray(ri.bodyOccupiedPositions))
    fail('TARGET_FACTS_INCOMPLETE', 'validate', 'REQUIRED_FACT_UNKNOWN');
  return { frame: ri.frame, evidence: ri.evidence,
    body: { bodyOccupiedPositions: ri.bodyOccupiedPositions } };
}

const HORIZONTAL_FACES = new Set(['+X', '-X', '+Z', '-Z']);

/**
 * HW-A028 painter side: a first building's entrance faces the anchor player.
 * A doorway is a usable cell (full avatar clearance over verified empty air,
 * the same rule as planEntrances) on a side face of the structure's footprint
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
  const finalNode = new Map(targetFacts.knownEmptyCells.map(p => [key(p), 'air']));
  for (const e of geometry.effects) finalNode.set(key(e.position), e.nodeName);
  const empty = k => finalNode.get(k) === 'air' && passable(catalogue.nodes.air, rules.hazardPolicy);
  const usable = new Set(usableCells(finalNode, span, empty).keys());
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
 * targetFacts.frameDigest and Adapter evidence for body
 * occupancy (painter/v4: trustedFromRegion). Missing trusted facts are a typed
 * rejection, never a default.
 */
export function assembleBuild({ request, geometry, documentId, trusted, entrances = planEntrances({ request, geometry }) }) {
  const { catalogue, targetFacts, safetyProfile } = request;
  if (!trusted?.frame || !trusted.evidence || !trusted.body)
    fail('TARGET_FACTS_INCOMPLETE', 'validate', 'REQUIRED_FACT_UNKNOWN');
  if (digestValue('frame', trusted.frame).sha256 !== targetFacts.frameDigest)
    fail('TARGET_FACTS_STALE', 'validate', 'REVISION_CHANGED');
  const catalogueDigest = digestValue('catalogue', catalogue).sha256;
  const finalEffects = { profileVersion: 'final-effects/v2', frameDigest: targetFacts.frameDigest,
    catalogueDigest, effects: geometry.effects };
  const bound = {
    finalEffectsDigest: digestValue('final-effects', finalEffects).sha256,
    targetFactsDigest: request.targetFactsDigest,
    safetyProfileDigest: request.safetyProfileDigest,
  };
  const positions = geometry.effects.map(e => e.position);
  const written = new Set(positions.map(key));
  const evidence = trusted.evidence;
  const restrict = list => list.filter(p => written.has(key(p)));
  if (trusted.body.bodyOccupiedPositions.some(p => written.has(key(p))))
    fail('BUILD_INVALID', 'validate', 'INVALID_GEOMETRY');
  const hazardOk = geometry.effects.every(e => {
    const c = catalogue.nodes[e.nodeName];
    return c.liquidType !== null && c.damagePerSecond !== null &&
      (!safetyProfile.hazardPolicy.forbidLiquid || c.liquidType === 'none') &&
      c.damagePerSecond <= safetyProfile.hazardPolicy.maximumDamagePerSecond;
  });
  if (!hazardOk) fail('UNSUPPORTED_MATERIAL', 'validate', 'REQUIRED_FACT_UNKNOWN');
  const hazardCells = new Map(positions.map(p => [key(p), p]));
  for (const entrance of entrances) for (const p of entrance.usablePositions) hazardCells.set(key(p), p);
  const hazardPositions = [...hazardCells.values()].sort(comparePosition);
  const witnesses = [
    { witnessId: 'w1', predicate: 'COVERAGE', ...bound, facts: { evidence, positions } },
    // Body overlap was rejected; the restricted occupancy list is empty.
    { witnessId: 'w3', predicate: 'BODY_CLEARANCE', ...bound,
      facts: { evidence, positions, bodyOccupiedPositions: restrict(trusted.body.bodyOccupiedPositions),
        avatarDimensions: safetyProfile.avatarDimensions } },
    // Hazard is recomputed at every written cell and every entrance use/path cell.
    { witnessId: 'w4', predicate: 'HAZARD', ...bound,
      facts: { evidence, positions: hazardPositions, forbidLiquid: safetyProfile.hazardPolicy.forbidLiquid,
        maximumDamagePerSecond: safetyProfile.hazardPolicy.maximumDamagePerSecond } },
    ...entrances.map(entrance => ({ witnessId: `w5-${entrance.portalRef}`,
      predicate: 'ENTRANCE_CONNECTIVITY', ...bound,
      facts: { evidence, portalRef: entrance.portalRef, usablePositions: entrance.usablePositions,
        path: entrance.path, avatarDimensions: safetyProfile.avatarDimensions } })),
  ].sort((a, b) => compareUTF16(a.witnessId, b.witnessId));
  const build = validateType('BuildProjection', {
    contractVersion: 'BUILD/V3', documentId, coordinateFrame: trusted.frame, catalogueDigest,
    targetFactsDigest: request.targetFactsDigest, safetyProfileDigest: request.safetyProfileDigest,
    materials: geometry.materials, operations: geometry.operations,
    declaredBounds: geometry.declaredBounds, witnesses,
  });
  validateWitnessCoherence({ build, finalEffects, targetFacts, safetyProfile, catalogue });
  return { build, buildDigest: digestValue('build', build).sha256, finalEffects };
}
