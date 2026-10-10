// Deterministic public text proposal entry. No model, media, compiler or world service.
import { ContractError, publicError, admitRequest, validateRequest, validateResponse,
  decodeRawJSON, canonicalJSON,
  validateBuildProposalResponse } from '#contracts';
import { parseProposal, planGeometry, planEntrances, assembleBuild, trustedFromRegion } from './planner.mjs';
import { readCurrentFacts } from './local-context.mjs';
export const PROPOSAL_OPERATION = 'ValidateBuildProposal';
const WIRE = 'painter/v5';
const envelope = (id, error) => validateResponse(WIRE, PROPOSAL_OPERATION,
  { contractVersion: WIRE, requestId: id, result: null, error: publicError(error) });
function requestId(raw) {
  try {
    const decoded = typeof raw === 'string' || raw instanceof Uint8Array
      ? decodeRawJSON(typeof raw === 'string' ? new TextEncoder().encode(raw) : raw) : raw;
    return typeof decoded?.requestId === 'string' && decoded.requestId.length ? decoded.requestId : null;
  } catch { return null; }
}

export class BuildProposalValidator {
  constructor(getLocalFacts) { this.getLocalFacts = getLocalFacts; this.receipts = new Map(); }
  // Host reads source/current brief and actual current transport/selection.
  // Pure contract correlation cannot itself establish live world facts.
  async fresh(body, signal, initial) {
    return readCurrentFacts(this.getLocalFacts, body, PROPOSAL_OPERATION, signal, initial);
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
      const key = `${canonicalJSON(body.localContext)}\u0000${body.sessionRef}\u0000${body.requestId}`;
      const prior = this.receipts.get(key);
      if (prior) {
        if (prior.identity !== identity) throw new ContractError('REPLAY_MISMATCH', 'replay', 'PAYLOAD_CHANGED');
        const response = await prior.response;
        await this.fresh(body, signal, initial);
        return structuredClone(validateBuildProposalResponse(body, response));
      }
      if (initial.admission.disposition === 'RETURN_STORED')
        throw new ContractError('REQUEST_NOT_ACTIVE', 'validate', 'REQUIRED_FACT_UNKNOWN');
      // Ephemeral planning receipts; never a durable world transaction or write.
      const record = { identity };
      record.response = (async () => {
        let response;
        try {
          const proposal = parseProposal(canonicalJSON(body.proposal));
          const geometry = planGeometry({ proposal, catalogue: body.catalogue, targetFacts: body.targetFacts });
          // Entrance rules run only when the confirmed site rules require one.
          const entrances = planEntrances({ request: body, geometry, entranceFacing: body.regionInspection.entranceFacing });
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
