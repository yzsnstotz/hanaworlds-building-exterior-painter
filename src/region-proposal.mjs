// painter-region/v2 on the same Painter service and the same Host business
// port as text/image proposals: current facts are read before planning and
// again before release; same exact replay rule; no model, media fetch,
// compiler or world call.
import { ContractError, publicError, validateResponse, validateType, validateCurrentRequest,
  validateRegionProposalResponse, decodeRawJSON, admitRequest, canonicalJSON } from '#contracts';
import { admitRegionProposal, regionBuildPlan, REGION_WIRE, REGION_OPERATION } from './region.mjs';

const fail = (code, reason) => { throw new ContractError(code, 'validate', reason); };
const envelope = (id, error) => validateResponse(REGION_WIRE, REGION_OPERATION,
  { contractVersion: REGION_WIRE, requestId: id, result: null, error: publicError(error) });
function requestId(raw) {
  try {
    const decoded = typeof raw === 'string' || raw instanceof Uint8Array
      ? decodeRawJSON(typeof raw === 'string' ? new TextEncoder().encode(raw) : raw) : raw;
    return typeof decoded?.requestId === 'string' && decoded.requestId.length ? decoded.requestId : null;
  } catch { return null; }
}

export class RegionProposalValidator {
  constructor(getLocalFacts) { this.getLocalFacts = getLocalFacts; this.receipts = new Map(); }
  // Host reads current turn, brief and actual transport/selection from their
  // owning services and returns public LocalRequestFacts.
  async fresh(body, signal, initial) {
    if (signal?.aborted) fail('REQUEST_CANCELLED', 'REVISION_CHANGED');
    const provider = this.getLocalFacts();
    if (typeof provider?.read !== 'function') fail('CAPABILITY_UNAVAILABLE', 'POLICY_UNAVAILABLE');
    if (initial && initial.provider !== provider) fail('CURRENT_WORLD_MISMATCH', 'REVISION_CHANGED');
    const observed = await provider.read(body, REGION_OPERATION, { signal });
    if (signal?.aborted) fail('REQUEST_CANCELLED', 'REVISION_CHANGED');
    if (this.getLocalFacts() !== provider) fail('CURRENT_WORLD_MISMATCH', 'REVISION_CHANGED');
    const facts = validateType('LocalRequestFacts', observed);
    return { provider, facts, admission: validateCurrentRequest(REGION_WIRE, REGION_OPERATION, body, facts) };
  }
  async call(raw, { signal } = {}) {
    let body;
    try {
      body = admitRegionProposal(typeof raw === 'string' || raw instanceof Uint8Array
        ? admitRequest(REGION_WIRE, REGION_OPERATION, typeof raw === 'string' ? new TextEncoder().encode(raw) : raw) : raw);
    } catch (error) {
      const id = requestId(raw);
      if (id === null || !(error instanceof ContractError)) throw error;
      return envelope(id, error);
    }
    try {
      const initial = await this.fresh(body, signal);
      const identity = canonicalJSON(body);
      const key = `${canonicalJSON(body.localContext)}\u0000${body.sessionRef}\u0000${body.requestId}`;
      const prior = this.receipts.get(key);
      if (prior) {
        if (prior.identity !== identity) throw new ContractError('REPLAY_MISMATCH', 'replay', 'PAYLOAD_CHANGED');
        const response = await prior.response;
        await this.fresh(body, signal, initial);
        return structuredClone(validateRegionProposalResponse(body, response));
      }
      if (initial.admission.disposition === 'RETURN_STORED')
        throw new ContractError('REQUEST_NOT_ACTIVE', 'validate', 'REQUIRED_FACT_UNKNOWN');
      // Ephemeral planning receipt; never a durable world transaction or write.
      const record = { identity };
      record.response = (async () => {
        const response = { contractVersion: REGION_WIRE, requestId: body.requestId, result: regionBuildPlan(body), error: null };
        await this.fresh(body, signal, initial);
        return validateRegionProposalResponse(body, response);
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
