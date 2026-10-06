// Deterministic public text proposal entry. No model, media, compiler or world service.
import { ContractError, publicError, admitRequest, validateRequest, validateResponse,
  validateType, decodeRawJSON, canonicalJSON, validateBuildProposalContext,
  validateBuildProposalResponse } from '#contracts';
import { parseProposal, planGeometry, planEntrances, checkEntranceFacing, assembleBuild,
  trustedFromRegion } from './planner.mjs';
export const PROPOSAL_OPERATION = 'ValidateBuildProposal';
const WIRE = 'painter/v3';
const denied = () => { throw new ContractError('PERMISSION_DENIED', 'authorize', 'IDENTITY_UNVERIFIED'); };
const envelope = (id, error) => validateResponse(WIRE, PROPOSAL_OPERATION,
  { contractVersion: WIRE, requestId: id, result: null, error: publicError(error) });
const scope = facts => canonicalJSON({ binding: facts.originalBinding,
  callerServiceRef: facts.callerServiceRef, expectedCallerServiceRef: facts.expectedCallerServiceRef });
function requestId(raw) {
  try {
    const decoded = typeof raw === 'string' || raw instanceof Uint8Array
      ? decodeRawJSON(typeof raw === 'string' ? new TextEncoder().encode(raw) : raw) : raw;
    return typeof decoded?.requestId === 'string' && decoded.requestId.length ? decoded.requestId : null;
  } catch { return null; }
}

export class BuildProposalValidator {
  constructor(getAuthority) { this.getAuthority = getAuthority; this.receipts = new Map(); }
  // Existing host hanaworldsAuthority.verify port; for this operation it must
  // return public BuildProposalProviderFacts captured by authenticated providers.
  // These observations never come from call options or model JSON. The host is
  // responsible for real Session/grant/caller provenance; pure equality is not authentication.
  async fresh(body, signal, initial) {
    if (signal?.aborted) denied();
    const authority = this.getAuthority();
    if (typeof authority?.verify !== 'function' || (initial && initial.authority !== authority)) denied();
    const observed = await authority.verify(body, PROPOSAL_OPERATION, { signal });
    if (signal?.aborted || this.getAuthority() !== authority) denied();
    const facts = validateType('BuildProposalProviderFacts', observed);
    validateBuildProposalContext(body, facts);
    if (initial && scope(facts) !== initial.scope) denied();
    return { authority, facts, scope: scope(facts) };
  }
  async call(raw, { signal } = {}) {
    let body;
    try {
      body = typeof raw === 'string' || raw instanceof Uint8Array
        ? admitRequest(WIRE, PROPOSAL_OPERATION, typeof raw === 'string' ? new TextEncoder().encode(raw) : raw)
        : validateRequest(WIRE, PROPOSAL_OPERATION, raw);
    } catch (error) {
      const id = requestId(raw);
      if (id === null || !(error instanceof ContractError)) throw error;
      return envelope(id, error);
    }
    try {
      const initial = await this.fresh(body, signal);
      const identity = canonicalJSON(body); // equality of whole payload, no private wire digest
      const key = `${initial.facts.liveSessionIncarnationRef}\u0000${body.sessionRef}\u0000${body.requestId}`;
      const prior = this.receipts.get(key);
      if (prior) {
        if (prior.identity !== identity) throw new ContractError('REPLAY_MISMATCH', 'replay', 'PAYLOAD_CHANGED');
        if (prior.scope !== initial.scope || prior.authority !== initial.authority) denied();
        const response = await prior.response;
        await this.fresh(body, signal, initial);
        return structuredClone(validateBuildProposalResponse(body, response));
      }
      // Reserve before asynchronous final authorization so concurrent conflicting
      // payloads cannot both own the same request identity. Receipts confer no writes.
      const record = { identity, scope: initial.scope, authority: initial.authority };
      record.response = (async () => {
        let response;
        try {
          const proposal = parseProposal(canonicalJSON(body.proposal));
          const geometry = planGeometry({ proposal, catalogue: body.catalogue, targetFacts: body.targetFacts });
          const entrances = planEntrances({ request: body, geometry });
          checkEntranceFacing({ request: body, geometry, entranceFacing: body.regionInspection.entranceFacing });
          const { build, buildDigest } = assembleBuild({ request: body, geometry,
            documentId: `exterior-${body.invocationId}`, trusted: trustedFromRegion(body.regionInspection), entrances });
          response = { contractVersion: WIRE, requestId: body.requestId,
            result: { invocationId: body.invocationId, build, buildDigest }, error: null };
        } catch (error) {
          if (!(error instanceof ContractError)) throw error;
          response = envelope(body.requestId, error);
        }
        await this.fresh(body, signal, initial);
        return validateBuildProposalResponse(body, response);
      })();
      this.receipts.set(key, record);
      try { return structuredClone(await record.response); }
      catch (error) {
        if (this.receipts.get(key) === record) this.receipts.delete(key);
        throw error;
      }
    } catch (error) {
      if (!(error instanceof ContractError)) throw error;
      return envelope(body.requestId, error);
    }
  }
}
