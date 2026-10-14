// C-painter v2 provider. Plans only from confirmed proposals and supplied facts.
import { ContractError, contractHandshake } from './contract.mjs';
import documentData from './painter-document-data.mjs';
import { IMAGE_LIMITS } from './pixels.mjs';
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
 constructor({localFacts,maxBytes,maxPixels,formats}={}) {
  this.localFacts=localFacts;
  this.imageLimits=Object.freeze({maxBytes:maxBytes??IMAGE_LIMITS.maxBytes,maxPixels:maxPixels??IMAGE_LIMITS.maxPixels,formats:Object.freeze([...(formats??IMAGE_LIMITS.formats)])});
  this.proposals=new BuildProposalValidator(()=>this.localFacts);
  this.regions=new RegionProposalValidator(()=>this.localFacts);
  Object.defineProperty(this,'contractHandshake',{value:contractHandshake,enumerable:true});
 }
 handshake(){return contractHandshake;}
 protocolHandshake(){return protocolHandshake(PACKAGE_VERSION);}
 matchCurrentImageMaterials(input){return matchCurrentImageMaterials(input,this.imageLimits);}
 describe(){return structuredClone(documentData.describeObservation);}
 async call(operation,raw,{signal}={}) {
  if(operation===PROPOSAL_OPERATION)return this.proposals.call(raw,{signal});
  if(operation===REGION_OPERATION)return this.regions.call(raw,{signal});
  throw new ContractError('UNSUPPORTED_OPERATION','validate','INVALID_SHAPE');
 }
}
