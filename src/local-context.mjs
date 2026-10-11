// Host-internal current business facts for ValidateBuildProposal. No facts from
// model JSON or call options.
import { ContractError, validateType, validateCurrentRequest, validateBuildProposalContext } from '#contracts';
const fail = (code, reason) => { throw new ContractError(code, 'validate', reason); };
const WIRE = 'painter/v6', OPERATION = 'ValidateBuildProposal';
export async function readCurrentFacts(getLocalFacts, body, signal, initial) {
  if (signal?.aborted) fail('REQUEST_CANCELLED', 'REVISION_CHANGED');
  const provider = getLocalFacts();
  if (typeof provider?.read !== 'function') fail('CAPABILITY_UNAVAILABLE', 'POLICY_UNAVAILABLE');
  if (initial && initial.provider !== provider) fail('CURRENT_WORLD_MISMATCH', 'REVISION_CHANGED');
  const observed = await provider.read(body, OPERATION, { signal });
  if (signal?.aborted) fail('REQUEST_CANCELLED', 'REVISION_CHANGED');
  if (getLocalFacts() !== provider) fail('CURRENT_WORLD_MISMATCH', 'REVISION_CHANGED');
  const facts = validateType('BuildProposalProviderFacts', observed);
  const admission = validateCurrentRequest(WIRE, OPERATION, body, facts.requestFacts);
  validateBuildProposalContext(body, facts);
  return { provider, facts, admission };
}
