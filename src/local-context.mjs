// Host-internal current business facts for ValidateBuildProposal. No facts from
// model JSON or call options.
import { ContractError, validateType, validateCurrentRequest, validateBuildProposalContext } from 'hanaworlds-contracts';
const fail = (code, reason) => { throw new ContractError(code, 'validate', reason); };
const WIRE = 'painter/v6', OPERATION = 'ValidateBuildProposal';
export async function readCurrentFacts(getLocalFacts, body, signal, initial) {
  if (signal?.aborted) fail('REQUEST_CANCELLED', 'REVISION_CHANGED');
  const provider = getLocalFacts();
  if (typeof provider?.read !== 'function') fail('CAPABILITY_UNAVAILABLE', 'POLICY_UNAVAILABLE');
  if (initial && initial.provider !== provider) fail('CURRENT_WORLD_MISMATCH', 'REVISION_CHANGED');
  const observed = await readProviderFacts(provider, body, OPERATION, { signal });
  if (signal?.aborted) fail('REQUEST_CANCELLED', 'REVISION_CHANGED');
  if (getLocalFacts() !== provider) fail('CURRENT_WORLD_MISMATCH', 'REVISION_CHANGED');
  const facts = validateType('BuildProposalProviderFacts', observed);
  const admission = validateCurrentRequest(WIRE, OPERATION, body, facts.requestFacts);
  validateBuildProposalContext(body, facts);
  return { provider, facts, admission };
}

// A provider can compile its own SDK. Consume its validated public error data,
// without relying on a shared exception constructor or SDK singleton.
export async function readProviderFacts(provider, body, operation, options) {
  try { return await provider.read(body, operation, options); }
  catch (error) {
    const data = error && Object.getOwnPropertyDescriptor(error, 'publicError');
    if (!data || !Object.hasOwn(data, 'value')) throw error;
    let publicData;
    try { publicData = validateType('Error', data.value); } catch { throw error; }
    throw new ContractError(publicData.code, publicData.phase, publicData.reason, publicData);
  }
}
