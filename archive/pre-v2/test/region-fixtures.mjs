// FIXTURE-only: the approved placement-region chain (contracts@0.3.0 vendored
// fixture, byte-identical to the batch context copy) plus synthetic,
// digest-coherent RegionInspection variants derived from it.
import { readFile } from 'node:fs/promises';
import { digestValue, comparePosition } from '#contracts';

export const chain = JSON.parse(await readFile(new URL('../vendor/hanaworlds-contracts/fixtures/v4/candidate/placement-region-chain-v4.json', import.meta.url), 'utf8'));
export const approved = chain.validCases.find(c => c.id === 'PLACE-LUANTI-INITIATOR-CHAIN').materializedChain;
export const invalid = id => chain.invalidCases.find(c => c.id === id);
export const clone = value => structuredClone(value);

/** Synthetic answer that reproduces the approved BUILD: one stone cell on the support. */
export const APPROVED_ANSWER = JSON.stringify({ decision: 'BUILD',
  materials: { stone: { nodeName: 'fixture:stone', param2: 0 } },
  boxes: [{ min: [0, 1, 0], max: [0, 1, 0], materialRef: 'stone' }] });

/** Authority proof for the approved chain request at its inspected world revision. */
export function chainAuthority(worldRevision = 'fixture-world-10') {
  return { verify: async (body, action) => ({ current: true, actorRef: body.actorRef, sessionRef: body.sessionRef,
    authorizationRef: body.authorizationRef, allowedActions: [action], authorRef: 'fixture-author',
    currentWorldRevision: worldRevision }) };
}

/**
 * A digest-coherent first-building request over a W x 3 x D footprint (plus a
 * stone support layer at y=0) at [0..W-1, 0..3, 0..D-1], built from the
 * approved request and its Adapter frame/evidence. Only targetFacts and the
 * digests that bind it change; protected/body lists can be supplied.
 */
export function regionRequest({ width = 5, depth = 5, entranceFacing = '-Z', protectedPositions = [],
  bodyOccupiedPositions = [], requireEntranceConnectivity = false } = {}) {
  const body = clone(approved.painterRequest);
  const ri = body.regionInspection;
  const min = [0, 0, 0], max = [width - 1, 3, depth - 1];
  const all = [];
  for (let x = 0; x <= max[0]; x++) for (let y = 0; y <= max[1]; y++) for (let z = 0; z <= max[2]; z++) all.push([x, y, z]);
  const coverage = { profileVersion: 'coverage/v2', sampledBounds: { min, max }, sampledPositions: all };
  const tf = { ...ri.targetFacts, sampledBounds: { min, max }, coverageDigest: digestValue('coverage', coverage).sha256,
    occupiedCells: all.filter(p => p[1] === 0).map(position => ({ position, nodeName: 'fixture:stone', param2: 0 })),
    knownEmptyCells: all.filter(p => p[1] > 0).sort(comparePosition), unknownCells: [],
    usableVolume: { emptyCellCount: all.filter(p => p[1] > 0).length, physicalVolume: null, standingArea: null, unit: 'node' } };
  const tfDigest = digestValue('target-facts', tf).sha256;
  body.targetFacts = tf; body.targetFactsDigest = tfDigest;
  body.regionInspection = { ...ri, targetFacts: tf, targetFactsDigest: tfDigest, entranceFacing,
    protectedPositions, bodyOccupiedPositions };
  if (requireEntranceConnectivity) {
    body.safetyProfile = { ...body.safetyProfile, requireEntranceConnectivity: true };
    body.safetyProfileDigest = digestValue('safety-profile', body.safetyProfile).sha256;
  }
  return body;
}

/** A roofed 5x5 hut on the support layer (walls y=1..2, roof y=3) with doors
 * on the given faces; each door is the 1x2 opening in the middle of that wall. */
export function hutAnswer(doors = ['-Z']) {
  const boxes = [
    { min: [0, 1, 0], max: [4, 2, 0], materialRef: 'wall' }, { min: [0, 1, 4], max: [4, 2, 4], materialRef: 'wall' },
    { min: [0, 1, 0], max: [0, 2, 4], materialRef: 'wall' }, { min: [4, 1, 0], max: [4, 2, 4], materialRef: 'wall' },
    { min: [0, 3, 0], max: [4, 3, 4], materialRef: 'wall' },
  ];
  const cell = { '-Z': [2, 0], '+Z': [2, 4], '-X': [0, 2], '+X': [4, 2] };
  for (const face of doors) { const [x, z] = cell[face]; boxes.push({ min: [x, 1, z], max: [x, 2, z], materialRef: 'gap' }); }
  return JSON.stringify({ decision: 'BUILD', materials: { wall: { nodeName: 'fixture:stone', param2: 0 },
    gap: { nodeName: 'air', param2: 0 } }, boxes });
}
