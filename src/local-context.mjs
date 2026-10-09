// Host-internal current business facts. No facts from model JSON or call options.
import { ContractError, validateType, validateCurrentRequest, validateBuildProposalContext } from '#contracts';
const fail = (code, reason) => { throw new ContractError(code, 'validate', reason); };
export async function readCurrentFacts(getLocalFacts, body, operation, signal, initial) {
  if (signal?.aborted) fail('REQUEST_CANCELLED', 'REVISION_CHANGED');
  const provider = getLocalFacts();
  if (typeof provider?.read !== 'function') fail('CAPABILITY_UNAVAILABLE', 'POLICY_UNAVAILABLE');
  if (initial && initial.provider !== provider) fail('CURRENT_WORLD_MISMATCH', 'REVISION_CHANGED');
  const observed = await provider.read(body, operation, { signal });
  if (signal?.aborted) fail('REQUEST_CANCELLED', 'REVISION_CHANGED');
  if (getLocalFacts() !== provider) fail('CURRENT_WORLD_MISMATCH', 'REVISION_CHANGED');
  const proposal = operation === 'ValidateBuildProposal';
  const facts = validateType(proposal ? 'BuildProposalProviderFacts' : 'LocalRequestFacts', observed);
  const admission = validateCurrentRequest('painter/v6', operation, body, proposal ? facts.requestFacts : facts);
  if (proposal) validateBuildProposalContext(body, facts);
  return { provider, facts, admission };
}
