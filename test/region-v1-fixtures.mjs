// FIXTURE: a flat inspected area built from the real contracts@0.4.2 public
// fixture (frame, evidence, Session, connection). World cells, catalogue nodes
// and Host facts are fixture data, never a real world read.
export function regionWorld(api, fixture, { unknown = [], chest = null, media = false } = {}) {
  const { digestValue, comparePosition } = api;
  const r = structuredClone(fixture.request);
  const nodes = r.catalogue.nodes;
  const base = nodes['fixture:stone'];
  nodes['fixture:dirt'] = { ...base };
  nodes['fixture:chest'] = { ...base, hasPersistentState: true, hasCallbacks: true };
  nodes['fixture:lava'] = { ...base, walkable: false, collisionBoxes: [], liquidType: 'source', damagePerSecond: 4 };
  // 4 x 3 x 4 area at world [0..3, 0..2, 3..6]: y0 stone, y1 dirt, y2 empty air.
  const min = [0, 0, 3], max = [3, 2, 6];
  const occupied = [], empty = [], unknownCells = [];
  const isUnknown = p => unknown.some(q => q.join() === p.join());
  for (let x = min[0]; x <= max[0]; x++) for (let y = min[1]; y <= max[1]; y++) for (let z = min[2]; z <= max[2]; z++) {
    const p = [x, y, z];
    if (isUnknown(p)) unknownCells.push({ position: p, reason: 'UNLOADED' });
    else if (chest && chest.join() === p.join()) occupied.push({ position: p, nodeName: 'fixture:chest', param2: 0 });
    else if (y === 0) occupied.push({ position: p, nodeName: 'fixture:stone', param2: 0 });
    else if (y === 1) occupied.push({ position: p, nodeName: 'fixture:dirt', param2: 0 });
    else empty.push(p);
  }
  const tf = r.targetFacts;
  tf.catalogueDigest = digestValue('catalogue', r.catalogue).sha256;
  tf.sampledBounds = { min, max };
  tf.occupiedCells = occupied.sort((a, b) => comparePosition(a.position, b.position));
  tf.knownEmptyCells = empty.sort(comparePosition);
  tf.unknownCells = unknownCells.sort((a, b) => comparePosition(a.position, b.position));
  // contracts rule: any unknown cell means usable volume is not known.
  tf.usableVolume = unknownCells.length ? null : { emptyCellCount: empty.length, physicalVolume: null, standingArea: null, unit: 'node' };
  const sampledPositions = [...tf.occupiedCells.map(c => c.position), ...tf.knownEmptyCells, ...tf.unknownCells.map(c => c.position)].sort(comparePosition);
  tf.coverageDigest = digestValue('coverage', { profileVersion: 'coverage/v2', sampledBounds: tf.sampledBounds, sampledPositions }).sha256;
  if (media) r.referenceBrief.media = [{ attachmentRef: 'fixture-attachment-1', storedBytesDigest: 'a'.repeat(64),
    projectionVariantId: null, projectionBytesDigest: null, mediaType: 'image/png', bytes: 1024, width: 16, height: 16 }];
  return rebind(api, r);
}

export function rebind(api, r) {
  const { digestValue } = api;
  r.referenceBriefDigest = digestValue('reference-brief', r.referenceBrief).sha256;
  r.intent.referenceBriefDigest = r.referenceBriefDigest;
  r.intentDigest = digestValue('intent', r.intent).sha256;
  r.targetFactsDigest = digestValue('target-facts', r.targetFacts).sha256;
  r.regionInspection.targetFacts = structuredClone(r.targetFacts);
  r.regionInspection.targetFactsDigest = r.targetFactsDigest;
  r.safetyProfileDigest = digestValue('safety-profile', r.safetyProfile).sha256;
  return r;
}

/** Region proposal local to sampledBounds.min; cells in x-fastest,y,z order. */
export function regionProposal({ min = [0, 0, 0], size = [4, 3, 4], palette, cells, version = '1.0.0',
  requires = ['palette-v1', 'air-carve', 'unspecified-skip'], axisOrder = 'x-fastest,y,z' }) {
  return { decision: 'BUILD_REGION', format: { protocol: 'hanaworlds-region-voxels', version, requires },
    region: { min, size, axisOrder, palette, cells } };
}

/** cells for a box of `size` from f(x,y,z) local to the region. */
export function cellsOf(size, f) {
  const cells = [];
  for (let z = 0; z < size[2]; z++) for (let y = 0; y < size[1]; y++) for (let x = 0; x < size[0]; x++) cells.push(f(x, y, z));
  return cells;
}

export function hostFacts(fixture, request) {
  const { requestId, proposal, ...context } = request;
  const facts = structuredClone(fixture.facts);
  facts.sourceContext = structuredClone(context);
  facts.currentContext = structuredClone(context);
  facts.requestFacts.currentBriefDigest = request.referenceBriefDigest;
  facts.requestFacts.currentTurnRevision = request.turnRevision;
  facts.requestFacts.sessionRef = request.sessionRef;
  facts.requestFacts.currentContext = structuredClone(request.localContext);
  return facts;
}
