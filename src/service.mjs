// C-painter v2 provider. Plans only from confirmed proposals and supplied facts.
import { ContractError, contractHandshake } from 'hanaworlds-contracts';
import { PAINTER_ID } from './planner.mjs';
import { BuildProposalValidator, PROPOSAL_OPERATION, PROPOSAL_WIRE } from './proposal.mjs';
import { matchCurrentImageMaterials, IMAGE_MATERIAL_TOOL } from './current-image-material.mjs';
import { RegionProposalValidator } from './region-proposal.mjs';
import { REGION_PROPOSAL_TOOL, REGION_OPERATION, protocolHandshake } from './region.mjs';
export const WIRE = PROPOSAL_WIRE;
export const PACKAGE_VERSION = '0.8.0';
export const INVARIANTS = Object.freeze([
 'Only confirmed proposals and current world-source facts become BUILD/V5 or region-build/v2 plans.',
 'Zero model calls and zero world writes; no Canvas, Adapter or Brush call.',
 'Opaque materialRef and neutral orientation come only from the supplied Catalogue.',
 'Per-cell writes require sampled known-empty cells. Region null cells remain UNSPECIFIED; carve uses the Catalogue emptyMaterialRef.',
 'Confirmed site rules, hazard tags, entrance clearance and placement are rechecked by the public contracts.',
 'Current Host facts are read before planning and before release, including replay.',
 'Image colours use sharp and CIEDE2000 over validated ReadMaterialSources texture bytes; missing facts are refused.',
]);
export class ExteriorPainterV2 {
 constructor({localFacts}={}) {
  this.localFacts=localFacts;
  this.proposals=new BuildProposalValidator(()=>this.localFacts);
  this.regions=new RegionProposalValidator(()=>this.localFacts);
  Object.defineProperty(this,'contractHandshake',{value:contractHandshake,enumerable:true});
 }
 handshake(){return contractHandshake;}
 protocolHandshake(){return protocolHandshake(PACKAGE_VERSION);}
 matchCurrentImageMaterials(input){return matchCurrentImageMaterials(input);}
 describe(){return {
  painterId:PAINTER_ID,wire:WIRE,operations:[PROPOSAL_OPERATION,REGION_OPERATION],
  consumes:['painter/v6','painter-region/v3','ReferenceBrief/v5'],factProfiles:['target-facts/v5','material-sources/v2'],
  emits:['BUILD/V5','region-build/v2'],settings:{},invariants:INVARIANTS,modelCalls:0,worldWrites:0,
  tools:[IMAGE_MATERIAL_TOOL,REGION_PROPOSAL_TOOL],services:{localFacts:!!this.localFacts},
 };}
 async call(operation,raw,{signal}={}) {
  if(operation===PROPOSAL_OPERATION)return this.proposals.call(raw,{signal});
  if(operation===REGION_OPERATION)return this.regions.call(raw,{signal});
  throw new ContractError('UNSUPPORTED_OPERATION','validate','INVALID_SHAPE');
 }
}
