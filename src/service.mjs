// painter/v2 provider for painterId "picture-blocks". Planning only: no world,
// Canvas, Adapter or Brush call exists in this module.
import { createHash } from 'node:crypto';
import canonicalize from 'canonicalize';
import {
  ContractError, publicError, admitRequest, validateRequest, validateResponse,
  digestValue, decodeRawJSON,
} from 'hanaworlds-contracts';
import { PAINTER_ID, parseProposal, planGeometry, assembleBuild } from './planner.mjs';
import { invokeModel, PainterHostError } from './model.mjs';

export const WIRE = 'painter/v2';
export const OPERATION = 'CreateBuildPlan';
const fail = (code, phase, reason) => { throw new ContractError(code, phase, reason); };
const sha = text => createHash('sha256').update(text).digest('hex');

/** Visible settings and invariants. Shown through the plugin's Config schema
 * and `describe()`; nothing else alters painter behaviour. */
export const DEFAULT_ROUTE = Object.freeze({ provider: 'codex-oauth', model: 'gpt-5.6-luna' });
export const INVARIANTS = Object.freeze([
  'No world, Canvas, Adapter or Brush call; output is a BUILD/V2 plan or a ClarificationNeed only.',
  'Structure intent requires at least one bound user image and non-empty text.',
  'The model route must resolve to an image-capable model; a text-only route is refused, never degraded.',
  'Written cells must be sampled known-empty target cells; occupied cells are never replaced and unknown cells are never written.',
  'PROTECTION/BODY_CLEARANCE witnesses require provider-verified evidence; absent evidence is a typed TARGET_FACTS_INCOMPLETE rejection, never a default safe claim.',
  'Same requestId with the same exact payload returns the original response after current authorization; a changed payload is REPLAY_MISMATCH.',
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
   * @param {object|undefined} deps.authority host `hanaworldsAuthority` service
   * @param {object|undefined} deps.llm host `llm` service
   * @param {object|undefined} deps.attachments host `attachments` service
   * @param {{provider: string, model: string}} deps.route model route
   */
  constructor({ authority, llm, attachments, route = DEFAULT_ROUTE } = {}) {
    this.authority = authority;
    this.llm = llm;
    this.attachments = attachments;
    this.route = Object.freeze({ provider: route.provider, model: route.model });
    this.receipts = new Map(); // invocation receipts only; no world or Session state
  }

  describe() {
    return {
      painterId: PAINTER_ID, wire: WIRE, operations: [OPERATION],
      consumes: ['painter/v2', 'ReferenceBrief/v2'], emits: ['BUILD/V2', 'ClarificationNeed'],
      settings: { modelProvider: this.route.provider, modelId: this.route.model },
      settingDefaults: { modelProvider: DEFAULT_ROUTE.provider, modelId: DEFAULT_ROUTE.model },
      invariants: INVARIANTS, worldWrites: 0,
      services: { authority: !!this.authority, llm: !!this.llm, attachments: !!this.attachments },
    };
  }

  /**
   * Admit one CreateBuildPlan request (raw bytes or decoded pure JSON) and
   * return the contract-validated response: an envelope or ClarificationNeed.
   * Host capability failures throw PainterHostError.
   */
  async call(operation, raw, { signal } = {}) {
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
      const proof = await this.#authorize(body);
      const identity = sha(canonicalize(body));
      const replayKey = `${body.sessionRef}\u0000${body.requestId}`;
      const prior = this.receipts.get(replayKey);
      if (prior) {
        if (prior.identity !== identity) fail('REPLAY_MISMATCH', 'replay', 'PAYLOAD_CHANGED');
        return structuredClone(await prior.response);
      }
      // Domain outcomes (plan, clarification, typed rejection) are terminal and
      // replayed; a host capability failure is not recorded.
      const pending = this.#plan(body, proof, signal).catch(error => {
        if (error instanceof ContractError)
          return validateResponse(WIRE, OPERATION, errorEnvelope(body.requestId, error));
        throw error;
      });
      this.receipts.set(replayKey, { identity, response: pending });
      try { return structuredClone(await pending); }
      catch (error) { this.receipts.delete(replayKey); throw error; }
    } catch (error) {
      if (!(error instanceof ContractError)) throw error;
      return validateResponse(WIRE, OPERATION, errorEnvelope(body.requestId, error));
    }
  }

  async #authorize(body) {
    if (typeof this.authority?.verify !== 'function') fail('PERMISSION_DENIED', 'authorize', 'IDENTITY_UNVERIFIED');
    const proof = await this.authority.verify(body, OPERATION);
    if (!proof?.current) fail('AUTHORIZATION_REVOKED', 'authorize', 'GRANT_REVOKED');
    if (proof.actorRef !== body.actorRef || proof.sessionRef !== body.sessionRef ||
        proof.authorizationRef !== body.authorizationRef ||
        !Array.isArray(proof.allowedActions) || !proof.allowedActions.includes(OPERATION))
      fail('PERMISSION_DENIED', 'authorize', 'SCOPE_DENIED');
    return proof;
  }

  async #plan(body, proof, signal) {
    // Digest coherence of every carried projection before any provider query.
    for (const [field, digestField, kind, code] of BOUND)
      if (digestValue(kind, body[field]).sha256 !== body[digestField]) fail(code, 'validate', 'PAYLOAD_CHANGED');
    if (body.painterId !== PAINTER_ID) fail('PERMISSION_DENIED', 'authorize', 'OWNERSHIP_VIOLATION');
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
    for (const media of brief.media)
      if (media.attachmentRef !== `sha256:${media.storedBytesDigest}`)
        fail('IMAGE_REQUIRED', 'validate', 'MEDIA_CORRUPT');
    // catalogue facts and target source/revision
    if (targetFacts.catalogueDigest !== digestValue('catalogue', body.catalogue).sha256)
      fail('TARGET_FACTS_STALE', 'validate', 'REVISION_CHANGED');
    if (targetFacts.source === 'INSPECTED') {
      if (targetFacts.worldRef !== body.worldRef) fail('TARGET_REQUIRED', 'validate', 'SCOPE_DENIED');
      if (typeof proof.currentWorldRevision === 'string' && proof.currentWorldRevision !== targetFacts.worldRevision)
        fail('TARGET_FACTS_STALE', 'validate', 'REVISION_CHANGED');
    }
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
    // No public port supplies the target Frame or Adapter protection/body
    // evidence to painter/v2 (CONTRACT_GAP-EXT-01/02): typed rejection.
    const { build, buildDigest } = assembleBuild({ request: body, geometry,
      documentId: `exterior-${body.invocationId}`, trusted: null });
    return validateResponse(WIRE, OPERATION, { contractVersion: WIRE, requestId: body.requestId,
      result: { invocationId: body.invocationId, build, buildDigest }, error: null });
  }
}
