// Pure P3 picture-blocks planning: a validated model proposal plus bound facts
// becomes BUILD/V2 geometry. Nothing here reads a world, a Session or a model.
import {
  ContractError, decodeRawJSON, digestValue, validateType, validateStaticMaterials,
  comparePosition, compareUTF16,
} from 'hanaworlds-contracts';

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
    return name !== 'air' && c.hasCallbacks === false && c.hasPersistentState === false &&
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

/**
 * Assemble the complete BuildProjection. `trusted` must come from a public,
 * provider-verified source: the exact coordinate Frame whose digest equals
 * targetFacts.frameDigest and Adapter evidence for protection and body
 * occupancy. Missing trusted facts are a typed rejection, never a default.
 */
export function assembleBuild({ request, geometry, documentId, trusted }) {
  const { catalogue, targetFacts, safetyProfile } = request;
  if (!trusted?.frame || !trusted.evidence || !trusted.protection || !trusted.body)
    fail('TARGET_FACTS_INCOMPLETE', 'validate', 'REQUIRED_FACT_UNKNOWN');
  if (digestValue('frame', trusted.frame).sha256 !== targetFacts.frameDigest)
    fail('TARGET_FACTS_STALE', 'validate', 'REVISION_CHANGED');
  if (safetyProfile.requireEntranceConnectivity)
    fail('TARGET_FACTS_INCOMPLETE', 'validate', 'REQUIRED_FACT_UNKNOWN');
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
  if (trusted.protection.protectedPositions.some(p => written.has(key(p))))
    fail('PERMISSION_DENIED', 'authorize', 'SCOPE_DENIED');
  if (trusted.body.bodyOccupiedPositions.some(p => written.has(key(p))))
    fail('BUILD_INVALID', 'validate', 'INVALID_GEOMETRY');
  const hazardOk = geometry.effects.every(e => {
    const c = catalogue.nodes[e.nodeName];
    return c.liquidType !== null && c.damagePerSecond !== null &&
      (!safetyProfile.hazardPolicy.forbidLiquid || c.liquidType === 'none') &&
      c.damagePerSecond <= safetyProfile.hazardPolicy.maximumDamagePerSecond;
  });
  if (!hazardOk) fail('UNSUPPORTED_MATERIAL', 'validate', 'REQUIRED_FACT_UNKNOWN');
  const witnesses = [
    { witnessId: 'w1-coverage', predicate: 'COVERAGE', ...bound, facts: { evidence, positions } },
    { witnessId: 'w2-protection', predicate: 'PROTECTION', ...bound,
      // Protected cells intersecting the written set; non-empty already rejected.
      facts: { evidence, positions, protectedPositions: [] } },
    { witnessId: 'w3-body', predicate: 'BODY_CLEARANCE', ...bound,
      facts: { evidence, positions, bodyOccupiedPositions: trusted.body.bodyOccupiedPositions,
        avatarDimensions: safetyProfile.avatarDimensions } },
    { witnessId: 'w4-hazard', predicate: 'HAZARD', ...bound,
      facts: { evidence, positions, forbidLiquid: safetyProfile.hazardPolicy.forbidLiquid,
        maximumDamagePerSecond: safetyProfile.hazardPolicy.maximumDamagePerSecond } },
  ];
  const build = validateType('BuildProjection', {
    contractVersion: 'BUILD/V2', documentId, coordinateFrame: trusted.frame, catalogueDigest,
    targetFactsDigest: request.targetFactsDigest, safetyProfileDigest: request.safetyProfileDigest,
    materials: geometry.materials, operations: geometry.operations,
    declaredBounds: geometry.declaredBounds, witnesses,
  });
  return { build, buildDigest: digestValue('build', build).sha256, finalEffects };
}
