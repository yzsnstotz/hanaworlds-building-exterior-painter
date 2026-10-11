// Minimal in-process C-painter facts stand-in. No peer imports and no world access.
import { validateType } from 'hanaworlds-contracts';
export function mockFacts({buildFacts,regionFacts}) {
 const state={buildFacts:structuredClone(buildFacts),regionFacts:structuredClone(regionFacts),reads:0};
 const port={async read(body,operation){
  state.reads++;
  if(operation==='ValidateBuildProposal')return structuredClone(validateType('BuildProposalProviderFacts',state.buildFacts));
  if(operation==='ValidateRegionProposal')return structuredClone(validateType('LocalRequestFacts',state.regionFacts));
  throw new Error(`Unsupported mock operation: ${operation}`);
 }};
 return {state,port};
}
