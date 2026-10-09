// painter/v4 provider for painterId "picture-blocks". Planning only: no world,
// Canvas, Adapter or Brush call exists in this module.
import { createHash } from 'node:crypto';
import canonicalize from 'canonicalize';
import {
  ContractError, publicError, admitRequest, validateRequest, validateBoundRequest, validateResponse,
  digestValue, decodeRawJSON, contractHandshake,
} from '#contracts';
import { PAINTER_ID, parseProposal, planGeometry, planEntrances, assembleBuild, trustedFromRegion,
  checkEntranceFacing } from './planner.mjs';
import { invokeModel, PainterHostError } from './model.mjs';
import { BuildProposalValidator, PROPOSAL_OPERATION } from './proposal.mjs';
import { readCurrentFacts } from './local-context.mjs';
import { matchImageMaterials } from './image-material.mjs';
import { matchCurrentImageMaterials, CURRENT_IMAGE_MATERIAL_TOOL } from './current-image-material.mjs';
import { RegionProposalValidator } from './region-proposal.mjs';
import { REGION_PROPOSAL_TOOL, REGION_OPERATION, protocolHandshake } from './region.mjs';

export const WIRE = 'painter/v4';
export const PACKAGE_VERSION = '0.4.2';
export const OPERATION = 'CreateBuildPlan';
const fail = (code, phase, reason) => { throw new ContractError(code, phase, reason); };
const sha = text => createHash('sha256').update(text).digest('hex');

/** Visible settings and invariants. Shown through the plugin's Config schema
 * and `describe()`; nothing else alters painter behaviour. */
export const DEFAULT_ROUTE = Object.freeze({ provider: 'openai-codex', model: 'gpt-5.6-luna' });
export const INVARIANTS = Object.freeze([
  'No world, Canvas, Adapter or Brush call; output is a BUILD/V3 plan or a ClarificationNeed only.',
  'CreateBuildPlan structure intent requires at least one bound user image and non-empty text; ValidateBuildProposal validates confirmed proposals with supplied current media facts and calls no model.',
  'CreateBuildPlan requires an image-capable model route; ValidateBuildProposal calls no model or attachment service.',
  'Written cells must be sampled known-empty target cells; occupied cells are never replaced and unknown cells are never written.',
  'When the safety profile requires entrance connectivity, every confirmed entrance portal must reach the enclosed interior by a six-neighbor path of cells with full avatar clearance, recomputed from bound facts; otherwise BUILD_INVALID.',
  'A first new building uses only the Canvas-relayed Adapter regionInspection: BUILD.coordinateFrame = regionInspection.frame and BODY_CLEARANCE witnesses carry regionInspection.evidence; the painter never inspects the world, chooses or relocates a placement.',
  'With a usable interior, a first building has its entrance on the footprint face whose outward normal is regionInspection.entranceFacing and on no other face; otherwise BUILD_INVALID.',
  'BODY_CLEARANCE witnesses require relayed inspection evidence; absent evidence or frame (INSPECTED facts carry none in painter/v4) is a typed TARGET_FACTS_INCOMPLETE rejection, never a default safe claim.',
  'PLANNED facts are rejected (TARGET_REQUIRED) because painter/v4 carries no proof of a real preceding plan.',
  'Same requestId with the same exact payload returns the original response after fresh current local facts; a changed payload is REPLAY_MISMATCH.',
  'A region proposal (decision BUILD_REGION) writes only specified cells that the bound inspection proves KNOWN; a null cell is never written and never means carve; carve is explicit air; unknown, unsampled or stateful replaced cells are rejected; same Host current facts as text/image proposals.',
  'Region protocol compatibility is protocol major (major 0 also needs the same minor) plus required capabilities; patch or package hash never decides it; a wrong major is UNSUPPORTED_VERSION.',
]);

// Painter-scoped codes for a carried projection whose digest does not match.
const BOUND = [
  ['intent', 'intentDigest', 'intent', 'INTENT_UNCONFIRMED'],
  ['referenceBrief', 'referenceBriefDigest', 'reference-brief', 'INTENT_UNCONFIRMED'],
  ['targetFacts', 'targetFactsDigest', 'target-facts', 'TARGET_FACTS_STALE'],
  ['safetyProfile', 'safetyProfileDigest', 'safety-profile', 'TARGET_FACTS_STALE'],
];

function recoverRequestId(raw) {
  try {
    const value = raw instanceof Uint8Array || typeof raw === 'string'
      ? decodeRawJSON(typeof raw === 'string' ? new TextEncoder().encode(raw) : raw) : raw;
    return typeof value?.requestId === 'string' && value.requestId.length > 0 ? value.requestId : null;
  } catch { return null; }
}

function errorEnvelope(requestId, error) {
  return { contractVersion: WIRE, requestId, result: null, error: publicError(error) };
}

export class ExteriorPainterV2 {
  /**
   * @param {object} deps
   * @param {object|undefined} deps.localFacts host `hanaworldsPainterLocalFacts` internal business port
   * @param {object|undefined} deps.llm host `llm` service
   * @param {object|undefined} deps.attachments host `attachments` service
   * @param {{provider: string, model: string}} deps.route model route
   */
  constructor({ localFacts, llm, attachments, route = DEFAULT_ROUTE } = {}) {
    this.localFacts = localFacts;
    this.llm = llm;
    this.attachments = attachments;
    this.route = Object.freeze({ provider: route.provider, model: route.model });
    this.proposals = new BuildProposalValidator(() => this.localFacts);
    this.regions = new RegionProposalValidator(() => this.localFacts);
    this.receipts = new Map(); // invocation receipts only; no world or Session state
    // ContractHandshake advertised before any request (CONTRACT_RULES "Compatibility
    // (rc.7)"): exactly the pinned admitted contracts advertisement, never
    // a painter-synthesized set. Consumers check it with checkContractHandshake.
    Object.defineProperty(this, 'contractHandshake', { value: contractHandshake, enumerable: true });
  }

  /** The ContractHandshake this image provider advertises (pinned contracts package). */
  handshake() { return contractHandshake; }
  matchImageMaterials(input) { return matchImageMaterials(input); }
  matchCurrentImageMaterials(input) { return matchCurrentImageMaterials(input); }

  describe() {
    return {
      painterId: PAINTER_ID, wire: WIRE, operations: [OPERATION, PROPOSAL_OPERATION, REGION_OPERATION],
      consumes: ['painter/v4', 'ReferenceBrief/v3'], factProfiles: ['target-facts/v4'], emits: ['BUILD/V3', 'ClarificationNeed'],
      settings: { modelProvider: this.route.provider, modelId: this.route.model },
      settingDefaults: { modelProvider: DEFAULT_ROUTE.provider, modelId: DEFAULT_ROUTE.model },
      invariants: INVARIANTS, worldWrites: 0,
      tools: [CURRENT_IMAGE_MATERIAL_TOOL, REGION_PROPOSAL_TOOL],
      services: { localFacts: !!this.localFacts, llm: !!this.llm, attachments: !!this.attachments },
    };
  }

  /**
   * Admit one CreateBuildPlan request (raw bytes or decoded pure JSON) and
   * return the contract-validated response: an envelope or ClarificationNeed.
   * Host capability failures throw PainterHostError.
   */
  /** ProtocolHandshake (protocol major + capabilities); version is provenance only. */
  protocolHandshake() { return protocolHandshake(PACKAGE_VERSION); }

  async call(operation, raw, { signal } = {}) {
    if (operation === PROPOSAL_OPERATION)
      return this.proposals.call(raw, { signal });
    if (operation === REGION_OPERATION) return this.regions.call(raw, { signal });
    if (operation !== OPERATION) fail('UNSUPPORTED_OPERATION', 'validate', 'INVALID_SHAPE');
    let body;
    try {
      body = raw instanceof Uint8Array || typeof raw === 'string'
        ? admitRequest(WIRE, OPERATION, typeof raw === 'string' ? new TextEncoder().encode(raw) : raw)
        : validateRequest(WIRE, OPERATION, raw);
    } catch (error) {
      // Without an admitted requestId there is no response identity to answer;
      // the typed public error is raised to the caller instead.
      const requestId = recoverRequestId(raw);
      if (requestId === null || !(error instanceof ContractError)) throw error;
      return validateResponse(WIRE, OPERATION, errorEnvelope(requestId, error));
    }
    try {
      const initial = await readCurrentFacts(() => this.localFacts, body, OPERATION, signal);
      const identity = sha(canonicalize(body));
      const replayKey = `${body.localContext.connectionIncarnationRef}\u0000${body.sessionRef}\u0000${body.requestId}`;
      const prior = this.receipts.get(replayKey);
      if (prior) {
        if (prior.identity !== identity) fail('REPLAY_MISMATCH', 'replay', 'PAYLOAD_CHANGED');
        const response = await prior.response;
        await readCurrentFacts(() => this.localFacts, body, OPERATION, signal, initial);
        return structuredClone(response);
      }
      if (initial.admission.disposition === 'RETURN_STORED') fail('REQUEST_NOT_ACTIVE', 'validate', 'REQUIRED_FACT_UNKNOWN');
      // Domain outcomes (plan, clarification, typed rejection) are terminal and
      // replayed; a host capability failure is not recorded.
      const pending = this.#plan(body, signal).catch(error => {
        if (error instanceof ContractError)
          return validateResponse(WIRE, OPERATION, errorEnvelope(body.requestId, error));
        throw error;
      });
      this.receipts.set(replayKey, { identity, response: pending });
      try {
        const response = await pending;
        await readCurrentFacts(() => this.localFacts, body, OPERATION, signal, initial);
        return structuredClone(response);
      }
      catch (error) { this.receipts.delete(replayKey); throw error; }
    } catch (error) {
      if (!(error instanceof ContractError)) throw error;
      return validateResponse(WIRE, OPERATION, errorEnvelope(body.requestId, error));
    }
  }

  async #plan(body, signal) {
    // Painter-scoped digest coherence of every carried projection before any
    // provider query (the generic contract codes are not painter/v4 failure codes).
    for (const [field, digestField, kind, code] of BOUND)
      if (digestValue(kind, body[field]).sha256 !== body[digestField]) fail(code, 'validate', 'PAYLOAD_CHANGED');
    if (body.painterId !== PAINTER_ID) fail('UNSUPPORTED_OPERATION', 'validate', 'INVALID_SHAPE');
    const { intent, referenceBrief: brief, targetFacts } = body;
    const confirmed = intent.confirmedIntent;
    // turn/intent confirmation
    if (confirmed.kind !== 'BUILD_STRUCTURE' || confirmed.confirmedTurnRevision !== body.turnRevision ||
        intent.intendedWorldRef !== body.worldRef || !confirmed.text.trim())
      fail('INTENT_UNCONFIRMED', 'validate', 'REQUIRED_FACT_UNKNOWN');
    // media binding: the structure path requires image plus text in the same turn
    if (intent.referenceBriefDigest !== body.referenceBriefDigest ||
        brief.sessionRef !== body.sessionRef || brief.turnRevision !== body.turnRevision)
      fail('INTENT_UNCONFIRMED', 'validate', 'PAYLOAD_CHANGED');
    if (brief.media.length === 0) fail('IMAGE_REQUIRED', 'validate', 'MEDIA_NOT_REFERENCED');
    if (!brief.text.trim()) fail('INTENT_UNCONFIRMED', 'validate', 'REQUIRED_FACT_UNKNOWN');
    // catalogue facts and target source/revision
    if (targetFacts.catalogueDigest !== digestValue('catalogue', body.catalogue).sha256)
      fail('TARGET_FACTS_STALE', 'validate', 'REVISION_CHANGED');
    if (targetFacts.source === 'PLANNED')
      fail('TARGET_REQUIRED', 'validate', 'REQUIRED_FACT_UNKNOWN');
    if (targetFacts.worldRef !== body.worldRef)
      fail(targetFacts.source === 'REGION_INSPECTED' ? 'TARGET_FACTS_STALE' : 'TARGET_REQUIRED', 'validate',
        targetFacts.source === 'REGION_INSPECTED' ? 'REVISION_CHANGED' : 'SCOPE_DENIED');
    // regionInspection binding (REGION_INSPECTED only): contracts v4 coherence of
    // the relayed RegionInspection with the request facts, digest and frame.
    validateBoundRequest(WIRE, OPERATION, body);
    const region = body.regionInspection;
    const trusted = region === null ? null : trustedFromRegion(region);
    if (targetFacts.knownEmptyCells.length === 0) fail('TARGET_FACTS_INCOMPLETE', 'validate', 'REQUIRED_FACT_UNKNOWN');

    const answer = await invokeModel({ llm: this.llm, attachments: this.attachments,
      route: this.route, request: body, signal });
    if (answer.mediaFailure) fail('IMAGE_REQUIRED', 'validate', answer.mediaFailure);
    const proposal = parseProposal(answer.text);
    if (proposal.decision === 'CLARIFY') {
      return validateResponse(WIRE, OPERATION, {
        sessionRef: body.sessionRef, turnRevision: body.turnRevision, invocationId: body.invocationId,
        clarificationId: `clarify-${sha(`${body.invocationId}\u0000${proposal.code}\u0000${proposal.question}`).slice(0, 32)}`,
        code: proposal.code, question: proposal.question,
      });
    }
    const geometry = planGeometry({ proposal, catalogue: body.catalogue, targetFacts });
    // Entrance rules depend only on bound facts, so they are decided now.
    const entrances = planEntrances({ request: body, geometry });
    if (region !== null) checkEntranceFacing({ request: body, geometry, entranceFacing: region.entranceFacing });
    // Only REGION_INSPECTED facts carry trusted frame/evidence in painter/v4;
    // any other source is a typed rejection at assembly.
    const { build, buildDigest } = assembleBuild({ request: body, geometry,
      documentId: `exterior-${body.invocationId}`, trusted, entrances });
    return validateResponse(WIRE, OPERATION, { contractVersion: WIRE, requestId: body.requestId,
      result: { invocationId: body.invocationId, build, buildDigest }, error: null });
  }
}
