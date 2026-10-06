// Region v1 on the same ValidateBuildProposal channel as text/image proposals:
// same Host current-facts reads before and after, same replay rule, no model,
// media fetch, compiler or world call. Region wire admission and context
// coherence come from the region contract port (contracts region v1).
import { ContractError, publicError, validateResponse, validateType, decodeRawJSON, canonicalJSON } from '#contracts';
import { parseRegionProposal, planRegion, assembleRegionBuild, checkRegionContract } from './region.mjs';

const WIRE = 'painter/v4';
const OPERATION = 'ValidateBuildProposal';
const fail = (code, reason) => { throw new ContractError(code, 'validate', reason); };
const envelope = (id, error) => validateResponse(WIRE, OPERATION,
  { contractVersion: WIRE, requestId: id, result: null, error: publicError(error) });
function requestId(raw) {
  try {
    const decoded = typeof raw === 'string' || raw instanceof Uint8Array
      ? decodeRawJSON(typeof raw === 'string' ? new TextEncoder().encode(raw) : raw) : raw;
    return typeof decoded?.requestId === 'string' && decoded.requestId.length ? decoded.requestId : null;
  } catch { return null; }
}

export class RegionProposalValidator {
  constructor(getLocalFacts, getContract) {
    this.getLocalFacts = getLocalFacts; this.getContract = getContract; this.receipts = new Map();
  }
  async fresh(contract, body, signal, initial) {
    if (signal?.aborted) fail('REQUEST_CANCELLED', 'REVISION_CHANGED');
    const provider = this.getLocalFacts();
    if (typeof provider?.read !== 'function') fail('CAPABILITY_UNAVAILABLE', 'POLICY_UNAVAILABLE');
    if (initial && initial.provider !== provider) fail('CURRENT_WORLD_MISMATCH', 'REVISION_CHANGED');
    const observed = await provider.read(body, OPERATION, { signal });
    if (signal?.aborted) fail('REQUEST_CANCELLED', 'REVISION_CHANGED');
    if (this.getLocalFacts() !== provider) fail('CURRENT_WORLD_MISMATCH', 'REVISION_CHANGED');
    const facts = validateType('BuildProposalProviderFacts', observed);
    const admission = contract.validateRegionContext(body, facts);
    return { provider, facts, admission };
  }
  async call(raw, { signal } = {}) {
    let contract, body;
    try {
      contract = checkRegionContract(this.getContract());
      body = contract.validateRegionRequest(typeof raw === 'string' || raw instanceof Uint8Array
        ? decodeRawJSON(typeof raw === 'string' ? new TextEncoder().encode(raw) : raw) : raw);
    } catch (error) {
      const id = requestId(raw);
      if (id === null || !(error instanceof ContractError)) throw error;
      return envelope(id, error);
    }
    try {
      const initial = await this.fresh(contract, body, signal);
      const identity = canonicalJSON(body);
      const key = `${canonicalJSON(body.localContext)}\u0000${body.sessionRef}\u0000${body.requestId}`;
      const prior = this.receipts.get(key);
      if (prior) {
        if (prior.identity !== identity) throw new ContractError('REPLAY_MISMATCH', 'replay', 'PAYLOAD_CHANGED');
        const response = await prior.response;
        await this.fresh(contract, body, signal, initial);
        return structuredClone(contract.validateRegionResponse(body, response));
      }
      if (initial.admission.disposition === 'RETURN_STORED')
        throw new ContractError('REQUEST_NOT_ACTIVE', 'validate', 'REQUIRED_FACT_UNKNOWN');
      const record = { identity };
      record.response = (async () => {
        let response;
        try {
          const proposal = parseRegionProposal(body.proposal);
          const plan = planRegion({ proposal, request: body });
          const build = assembleRegionBuild({ request: body, plan, documentId: `region-${body.invocationId}` });
          response = { contractVersion: WIRE, requestId: body.requestId,
            result: { invocationId: body.invocationId, build, buildDigest: contract.regionBuildDigest(build) }, error: null };
        } catch (error) {
          if (!(error instanceof ContractError)) throw error;
          response = envelope(body.requestId, error);
        }
        await this.fresh(contract, body, signal, initial);
        return contract.validateRegionResponse(body, response);
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
