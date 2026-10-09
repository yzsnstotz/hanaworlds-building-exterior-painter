// painter-region/v2 ValidateRegionProposal: a skill-confirmed region-voxels/v1
// block becomes a RegionBuildProjection for Brush. Pure: nothing here reads a
// world, a Session or a model, and nothing writes. Block decoding (origin/size
// overflow, axis order, canonical runs, explicit air carve, null = UNSPECIFIED)
// and palette legality are the public contract's; Painter adds the business
// coherence of intent, brief (with media), world and connection.
import { ContractError, validateRegionProposalRequest, regionBlockBox, digestValue, validateType } from '#contracts';

const fail = (code, reason) => { throw new ContractError(code, 'validate', reason); };
export const REGION_WIRE = 'painter-region/v2';
export const REGION_OPERATION = 'ValidateRegionProposal';
export const REGION_CAPABILITY = 'painter-region/v2:validate-region-proposal';

/** Contract admission plus Painter coherence; returns the frozen request. */
export function admitRegionProposal(input) {
  const request = validateRegionProposalRequest(input);
  const { intent, referenceBrief: brief } = request;
  const confirmed = intent.confirmedIntent;
  if (confirmed.kind !== 'BUILD_STRUCTURE' || confirmed.confirmedTurnRevision !== request.turnRevision ||
      intent.intendedWorldRef !== request.worldRef || intent.referenceBriefDigest !== request.referenceBriefDigest ||
      brief.sessionRef !== request.sessionRef || brief.turnRevision !== request.turnRevision ||
      !brief.text.trim() || !confirmed.text.trim())
    fail('INTENT_UNCONFIRMED', 'REQUIRED_FACT_UNKNOWN');
  if (request.localContext.worldRef !== request.worldRef) fail('CURRENT_WORLD_MISMATCH', 'REVISION_CHANGED');
  return request;
}

/** RegionBuildPlan: the proposal block unchanged, bound to world and Catalogue. */
export function regionBuildPlan(request) {
  const build = validateType('RegionBuildProjection', {
    contractVersion: 'region-build/v1', documentId: `region-${request.invocationId}`, coordinateSpace: 'WORLD_NODE',
    worldRef: request.worldRef, catalogueDigest: request.catalogueDigest, block: request.proposal.block,
    declaredBounds: regionBlockBox(request.proposal.block),
  });
  return { invocationId: request.invocationId, build, buildDigest: digestValue('region-build', build).sha256 };
}

/** Painter's ProtocolHandshake: protocol majors and capability ids implemented.
 * Package version is provenance only; consumers decide by major + capability. */
export function protocolHandshake(packageVersion) {
  return validateType('ProtocolHandshake', {
    profileVersion: 'protocol-handshake/v1', component: 'hanaworlds-building-exterior-painter',
    protocols: [{ protocol: 'painter', major: 5, minor: 0 }, { protocol: 'painter-region', major: 2, minor: 0 }],
    capabilities: [REGION_CAPABILITY],
    provenance: { packageName: 'hanaworlds-building-exterior-painter', packageVersion, sourceRevision: null, artifactDigest: null },
  });
}

/** Self-description for the skill. Choosing region vs per-box proposals is the
 * skill's decision; Painter sets no size threshold. */
export const REGION_PROPOSAL_TOOL = Object.freeze({
  name: 'ValidateRegionProposal',
  operation: REGION_OPERATION,
  wire: REGION_WIRE,
  capability: REGION_CAPABILITY,
  inputType: 'RegionProposal',
  purpose: 'Batch fill or carve one region-voxels/v1 block (terrain, levelling, digging, large volumes); returns the block unchanged as a region BUILD for Brush, Canvas then commits it as one transaction with one whole-region Undo.',
  typicalScale: 'Many cells changing together, from hundreds to very large areas. Small structures and single-cell touch-ups usually use the per-box ValidateBuildProposal path.',
  scaleUnit: 'cells',
  preconditions: Object.freeze([
    'Block in world node coordinates, X_FASTEST_THEN_Y_THEN_Z, canonical runs; null = UNSPECIFIED (never written, never carve); carve is explicit air param2 0.',
    'Every palette entry (air included) is a known static node with an allowed param2 in the current Catalogue.',
    'Same Session, turn, confirmed intent, reference brief (including verified image media), world and connection as the current Host facts.',
    'Whether cells are loaded and known is checked by Adapter/Canvas before writing (unknown is refused there), not by Painter.',
  ]),
  emits: 'RegionBuildPlan (region-build/v1); no world, Canvas, Adapter or Brush call',
  modelCalls: 0, worldWrites: 0,
});
