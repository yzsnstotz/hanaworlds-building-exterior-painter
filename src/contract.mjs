// Painter-owned admission and correlation, compiled from C-painter's closed
// documented projections. No source acquisition or authorization is inferred.
import { createHash } from 'node:crypto';
import { types } from 'node:util';
import canonicalize from 'canonicalize';
import documentData from './painter-document-data.mjs';
const definitions=documentData.definitions;
export function deepFreeze(value){if(value&&typeof value==='object'&&!ArrayBuffer.isView(value)){for(const v of Object.values(value))deepFreeze(v);Object.freeze(value);}return value;}
export const contractHandshake=deepFreeze(structuredClone(documentData.handshakeObservation));
export class ContractError extends Error {
 constructor(code,phase,reason,carried){
  super(`${code}/${phase}/${reason}`);this.name='ContractError';
  const value=carried??{code,phase,retryability:phase==='decode'||phase==='replay'?'NEVER':'AFTER_NEW_FACTS',mutationState:'NONE',transactionRef:null,causeCode:null,reason};
  Object.assign(this,value);this.publicError=deepFreeze(structuredClone(value));
 }
}
const fail=(code,reason='INVALID_SHAPE',phase='validate')=>{throw new ContractError(code,phase,reason);};
export const publicError=error=>error.publicError;
export const compareUTF16=(a,b)=>a<b?-1:a>b?1:0;
export const comparePosition=(a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2];
const equal=(a,b)=>canonicalJSON(a)===canonicalJSON(b);
function unicode(value){for(let i=0;i<value.length;i++){const c=value.charCodeAt(i);if(c>=0xd800&&c<=0xdbff){const next=value.charCodeAt(++i);if(!(next>=0xdc00&&next<=0xdfff))fail('SCHEMA_INVALID','LONE_SURROGATE','decode');}else if(c>=0xdc00&&c<=0xdfff)fail('SCHEMA_INVALID','LONE_SURROGATE','decode');}}
// Snapshot data descriptors without invoking accessors, iterators or toJSON.
export function snapshotData(value,{bytes=false}={},active=new Set()){
 if(types.isProxy(value))fail('SCHEMA_INVALID','INVALID_SHAPE','decode');
 if(value===null||typeof value==='boolean')return value;
 if(typeof value==='string'){unicode(value);return value;}
 if(typeof value==='number'){if(!Number.isFinite(value))fail('SCHEMA_INVALID','INVALID_NUMBER','decode');return value;}
 if(bytes&&types.isUint8Array(value))return new Uint8Array(value);
 if(!value||typeof value!=='object'||active.has(value))fail('SCHEMA_INVALID','INVALID_SHAPE','decode');
 // The external RFC8785 serializer checks toJSON. Reject inherited hooks by
 // descriptor without reading them, before it receives any cloned container.
 if(Object.getOwnPropertyDescriptor(Object.prototype,'toJSON')||Object.getOwnPropertyDescriptor(Array.prototype,'toJSON'))fail('SCHEMA_INVALID','INVALID_SHAPE','decode');
 const array=Array.isArray(value);const proto=Object.getPrototypeOf(value);
 if(!array&&proto!==Object.prototype&&proto!==null)fail('SCHEMA_INVALID','INVALID_SHAPE','decode');
 active.add(value);const out=array?[]:{};
 for(const key of Reflect.ownKeys(value)){
  if(array&&key==='length')continue;
  if(typeof key!=='string')fail('SCHEMA_INVALID','INVALID_SHAPE','decode');unicode(key);
  const descriptor=Object.getOwnPropertyDescriptor(value,key);
  if(!Object.hasOwn(descriptor,'value')||!descriptor.enumerable)fail('SCHEMA_INVALID','INVALID_SHAPE','decode');
  Object.defineProperty(out,key,{value:snapshotData(descriptor.value,{bytes},active),enumerable:true,writable:true,configurable:true});
 }
 if(array&&(out.length!==value.length||Object.keys(out).length!==value.length))fail('SCHEMA_INVALID','INVALID_SHAPE','decode');
 active.delete(value);return out;
}
export function canonicalJSON(value){
 return canonicalize(snapshotData(value));
}
// Recursive-descent decoding retains duplicate decoded keys, which JSON.parse
// alone would erase, and rejects non-finite numbers and lone surrogates.
export function decodeRawJSON(bytes){
 let source;try{source=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{fail('SCHEMA_INVALID','INVALID_UTF8','decode');}
 let at=0;const ws=()=>{while(/[\x20\t\n\r]/.test(source[at]??'!'))at++;};
 const invalid=()=>fail('SCHEMA_INVALID','INVALID_SHAPE','decode');
 function string(){const start=at++;while(at<source.length){const c=source[at++];if(c==='"'){let s;try{s=JSON.parse(source.slice(start,at));}catch{invalid();}unicode(s);return s;}if(c==='\\')at++;}invalid();}
 function value(){ws();const c=source[at];if(c==='"')return string();
  if(c==='{'||c==='['){at++;const object=c==='{',out=object?{}:[],end=object?'}':']',keys=new Set();ws();if(source[at]===end){at++;return out;}
   while(true){ws();let k;if(object){if(source[at]!=='"')invalid();k=string();if(keys.has(k))fail('SCHEMA_INVALID','DUPLICATE_DECODED_KEY','decode');keys.add(k);ws();if(source[at++]!==':')invalid();}const v=value();if(object)Object.defineProperty(out,k,{value:v,enumerable:true,writable:true,configurable:true});else out.push(v);ws();if(source[at]===end){at++;return out;}if(source[at++]!==',')invalid();}
  }
  for(const [token,v]of [['true',true],['false',false],['null',null]])if(source.startsWith(token,at)){at+=token.length;return v;}
  const token=/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(source.slice(at));if(!token)invalid();at+=token[0].length;const n=Number(token[0]);if(!Number.isFinite(n))fail('SCHEMA_INVALID','INVALID_NUMBER','decode');return n;
 }
 const out=value();ws();if(at!==source.length)invalid();return out;
}
function schemaCheck(schema,value,path=[]){
 if(schema.$ref)return schemaCheck(definitions[schema.$ref.slice(14)],value,path);
 if(schema.anyOf||schema.oneOf){const errors=[];let count=0;for(const branch of schema.anyOf??schema.oneOf){try{schemaCheck(branch,value,path);count++;}catch(e){errors.push(e);}}
  if(count===1||count>0&&schema.anyOf)return;
  // Exact version branches are selected by their own markers before checking.
  if(value&&typeof value==='object'&&!Array.isArray(value)){
   for(const branch of schema.anyOf??schema.oneOf){const s=branch.$ref?definitions[branch.$ref.slice(14)]:branch;
    const marker=s?.properties?.contractVersion?.const;
    if(marker===value.contractVersion&&marker!==undefined)return schemaCheck(s,value,path);
   }
  }
  throw errors.find(e=>e.reason==='UNKNOWN_FIELD')??errors.find(e=>e.phase==='decode')??errors[0]??new ContractError('SCHEMA_INVALID','validate','INVALID_SHAPE');
 }
 const shape=()=>fail('SCHEMA_INVALID','INVALID_SHAPE');
 const geometry=()=>fail('SCHEMA_INVALID','INVALID_GEOMETRY');
 if(Object.hasOwn(schema,'const')&&!equal(value,schema.const)){
  if(path.at(-1)==='contractVersion'||path.at(-1)==='profileVersion')fail('UNSUPPORTED_VERSION','VERSION_UNSUPPORTED','decode');shape();
 }
 if(schema.enum&&!schema.enum.some(v=>equal(value,v)))shape();
 if(schema['x-in-process']&&value instanceof Uint8Array)return;
 if(schema.type){const good=schema.type==='null'?value===null:schema.type==='array'?Array.isArray(value):schema.type==='object'?value!==null&&typeof value==='object'&&!Array.isArray(value):schema.type==='integer'?Number.isSafeInteger(value):schema.type==='number'?typeof value==='number'&&Number.isFinite(value):typeof value===schema.type;if(!good){if(schema.type==='integer'&&path.some(k=>['origin','min','max','size','position'].includes(k)))geometry();shape();}}
 if(typeof value==='string'){
  if(schema.minLength!==undefined&&value.length<schema.minLength)shape();if(schema.pattern&&!new RegExp(schema.pattern).test(value))shape();
 }
 if(typeof value==='number'){
  if(schema.minimum!==undefined&&value<schema.minimum||schema.maximum!==undefined&&value>schema.maximum||schema.exclusiveMinimum!==undefined&&value<=schema.exclusiveMinimum)shape();
 }
 if(Array.isArray(value)){
  if(schema.minItems!==undefined&&value.length<schema.minItems||schema.maxItems!==undefined&&value.length>schema.maxItems)shape();
  if(schema.uniqueItems&&new Set(value.map(canonicalJSON)).size!==value.length)shape();
  for(let i=0;i<value.length;i++){const item=Array.isArray(schema.items)?schema.items[i]:schema.items;if(item)schemaCheck(item,value[i],[...path,i]);else if(schema.additionalItems===false)shape();}
 }
 if(value!==null&&typeof value==='object'&&!Array.isArray(value)&&!(value instanceof Uint8Array)){
  if(schema.minProperties!==undefined&&Object.keys(value).length<schema.minProperties)shape();
  for(const k of schema.required??[])if(!Object.hasOwn(value,k))fail('SCHEMA_INVALID','INVALID_SHAPE','decode');
  for(const k of Object.keys(value)){
   if(schema.propertyNames)schemaCheck(schema.propertyNames,k,path);
   if(schema.properties?.[k])schemaCheck(schema.properties[k],value[k],[...path,k]);
   else if(schema.additionalProperties===false)fail('UNKNOWN_REQUIRED_FIELD','UNKNOWN_FIELD','decode');
   else if(schema.additionalProperties&&typeof schema.additionalProperties==='object')schemaCheck(schema.additionalProperties,value[k],[...path,k]);
  }
 }
}
export function validateType(name,input){
 const value=snapshotData(input,{bytes:true});
 if(name==='Error')name='SourcePublicError';
 if(!definitions[name])throw new Error(`Undocumented Painter projection: ${name}`);
 schemaCheck(definitions[name],value);
 if(name==='Box'&&!value.min.every((v,i)=>v<=value.max[i]))fail('SCHEMA_INVALID','INVALID_GEOMETRY');
 if(name==='Catalogue'&&!Object.hasOwn(value.materials,value.emptyMaterialRef))fail('CATALOGUE_MISMATCH','CATALOGUE_UNRESOLVED');
 if(name==='RegionVoxelBlock')checkRegionBlock(value);
 if(name==='TargetFacts'&&value.source==='PLANNED'&&(value.objectRef===null||value.objectRevision===null||value.buildDigest===null||value.planRevision===null))fail('SCHEMA_INVALID');
 if(name==='TargetFacts'&&value.source==='REGION_INSPECTED'&&(value.objectRef!==null||value.objectRevision!==null||value.buildDigest!==null||value.planRevision!==null))fail('SCHEMA_INVALID');
 return deepFreeze(value);
}
export function digestValue(kind,input){
 const value=kind==='material-sources'?snapshotData(input):validateType(documentData.digest.projectionTypes[kind],input);
 const version=(kind==='intent'||kind==='reference-brief')&&value.contractVersion?.endsWith('/v6')?'v6':null;
 const domain=version?documentData.versionCompatibility.digestDomains[version][kind]:documentData.digest.prefixes[kind]+kind+documentData.digest.domainSuffix;
 const canonical=canonicalJSON(value);return {sha256:createHash('sha256').update(domain+canonical,'utf8').digest('hex'),canonical};
}
export function validateDigestBinding(kind,value,digest){if(digestValue(kind,value).sha256!==digest)fail('NON_CANONICAL_AMBIGUITY','PAYLOAD_CHANGED');return value;}
export function admitRequest(wire,operation,bytes){return validateRequest(wire,operation,decodeRawJSON(bytes));}
export function validateRequest(wire,operation,input){
 const data=snapshotData(input);if(data===null||typeof data!=='object'||Array.isArray(data))fail('SCHEMA_INVALID','INVALID_SHAPE','decode');
 if(data.contractVersion!==wire)fail('UNSUPPORTED_VERSION','VERSION_UNSUPPORTED','decode');
 const iv=data.intent?.contractVersion,bv=data.referenceBrief?.contractVersion;
 if(iv!==undefined&&bv!==undefined&&!((iv==='session/v5'&&bv==='ReferenceBrief/v5')||(iv==='session/v6'&&bv==='ReferenceBrief/v6')))fail('UNSUPPORTED_VERSION','VERSION_UNSUPPORTED','decode');
 const version=iv==='session/v6'?'V6':'V5';const body=validateType(operation+'Request'+version,data);
 if(operation==='ValidateBuildProposal')validateType('TargetFacts',body.targetFacts);
 if(operation==='ValidateRegionProposal'){
  checkRegionBlock(body.proposal.block);validateStaticMaterials(Object.fromEntries(body.proposal.block.palette.map((m,i)=>[i,m])),body.catalogue);
  if(body.referenceBrief.sessionRef!==body.sessionRef)fail('SCHEMA_INVALID');
  if(body.intent.intendedWorldRef!==body.worldRef)fail('CURRENT_WORLD_MISMATCH','REVISION_CHANGED');
  checkIntent(body,false);checkRegionBusiness(body);
 }
 return body;
}
export const validateRegionProposalRequest=input=>validateRequest('painter-region/v3','ValidateRegionProposal',input);
export function validateResponse(wire,operation,input){if(input.contractVersion!==wire)fail('UNSUPPORTED_VERSION','VERSION_UNSUPPORTED','decode');return validateType(operation+'Response',input);}
function responseFor(body,response,operation,kind){const result=validateResponse(body.contractVersion,operation,response);if(result.requestId!==body.requestId)fail('NON_CANONICAL_AMBIGUITY','PAYLOAD_CHANGED');if(result.result){if(result.result.invocationId!==body.invocationId||digestValue(kind,result.result.build).sha256!==result.result.buildDigest)fail('NON_CANONICAL_AMBIGUITY','PAYLOAD_CHANGED');}return result;}
export function validateBuildProposalResponse(body,response){
 const result=responseFor(body,response,'ValidateBuildProposal','build');
 if(result.result){
  const build=result.result.build,rules=body.intent.confirmedIntent.siteRules;
  for(const witness of build.witnesses.filter(w=>w.predicate==='ENTRANCE_CONNECTIVITY')){
   if(!equal(witness.facts.clearance,rules.entranceClearance)||witness.facts.portalRef!==null&&!body.intent.confirmedIntent.entrancePortalRefs.includes(witness.facts.portalRef))fail('TRANSACTION_CONFLICT','PAYLOAD_CHANGED');
  }
 }
 return result;
}
export const validateRegionProposalResponse=(body,response)=>responseFor(body,response,'ValidateRegionProposal','region-build');
export function validateStaticMaterials(materials,catalogue){
 const map=validateType('MaterialMap',materials);for(const spec of Object.values(map)){const tags=catalogue.materials[spec.materialRef];if(!tags)fail('CATALOGUE_MISMATCH','CATALOGUE_UNRESOLVED');if(tags.placeable!==true||!tags.orientations?.includes(spec.orientation))fail('UNSUPPORTED_MUTATION_SEMANTICS','REQUIRED_FACT_UNKNOWN');}return map;
}
export function safetyProfileFromConfirmedIntent(intent){const rules=intent.confirmedIntent?.siteRules??intent.siteRules;return validateType('SafetyProfile',{profileVersion:'safety-profile/v5',connectivity:6,requireBodyClearance:true,requireEntranceConnectivity:rules.requireEntranceConnectivity,hazardPolicy:rules.hazardPolicy,optionalLightRule:rules.optionalLightRule});}
export function requireSiteRuleChecks(safety,{entrance=false}={}){if(safety.optionalLightRule!==null||safety.requireEntranceConnectivity&&!entrance)fail('CAPABILITY_UNAVAILABLE','REQUIRED_FACT_UNKNOWN');}
export function confirmedPlacementOf(intent,brief){const a=intent.confirmedIntent.placement??null,b=brief.controls.placement??null;if(!equal(a,b))fail('INTENT_UNCONFIRMED','IDENTITY_UNVERIFIED');return a;}
export function requirePlacementSource(placement,inspection,worldRef){
 if(placement.worldRef!==worldRef)fail('CURRENT_WORLD_MISMATCH','SCOPE_DENIED');
 if(placement.source.frameDigest!==inspection.targetFacts.frameDigest)fail('INVALID_FRAME','PAYLOAD_CHANGED');
 if(placement.source.worldRevision!==inspection.targetFacts.worldRevision)fail('TARGET_FACTS_STALE','REVISION_CHANGED');
 if(placement.source.inspectionId!==inspection.inspectionId||placement.source.anchorKind!==inspection.anchorKind||placement.source.targetFactsDigest!==inspection.targetFactsDigest)fail('TARGET_FACTS_STALE','PAYLOAD_CHANGED');
 return placement;
}
function placementContains(placement,positions){if(!placement)return;
 const target=placement.target;
 if(target.kind==='EXACT_CELLS'){const actual=[...new Set(positions.map(p=>p.join(',')))].sort();const required=target.cells.map(p=>p.join(',')).sort();if(!equal(actual,required))fail('INTENT_UNCONFIRMED','INVALID_GEOMETRY');}
 else if(!positions.every(p=>p.every((v,i)=>v>=target.bounds.min[i]&&v<=target.bounds.max[i])))fail('INTENT_UNCONFIRMED','INVALID_GEOMETRY');
}
function checkIntent(body,build){
 const {intent,referenceBrief:brief}=body,confirmed=intent.confirmedIntent;
 if(confirmed.kind!=='BUILD_STRUCTURE'||confirmed.confirmedTurnRevision!==body.turnRevision||intent.intendedWorldRef!==body.worldRef||intent.referenceBriefDigest!==body.referenceBriefDigest||brief.sessionRef!==body.sessionRef||brief.turnRevision!==body.turnRevision||!brief.text.trim()||!confirmed.text.trim()||build&&intent.orderedTargetRefs.length!==0)fail('INTENT_UNCONFIRMED','REQUIRED_FACT_UNKNOWN');
 if(digestValue('intent',intent).sha256!==body.intentDigest||digestValue('reference-brief',brief).sha256!==body.referenceBriefDigest)fail(intent.contractVersion==='session/v5'?'NON_CANONICAL_AMBIGUITY':'INTENT_UNCONFIRMED',intent.contractVersion==='session/v5'?'PAYLOAD_CHANGED':build?'PAYLOAD_CHANGED':'REQUIRED_FACT_UNKNOWN');
 if(!equal(confirmed.siteRules,brief.controls.siteRules))fail('INTENT_UNCONFIRMED',build?'PAYLOAD_CHANGED':'REQUIRED_FACT_UNKNOWN');
 if(body.localContext.worldRef!==body.worldRef)fail('CURRENT_WORLD_MISMATCH','REVISION_CHANGED');
 if(intent.contractVersion==='session/v6')checkConfirmation(body,build);
 return confirmed;
}
function checkConfirmation(body,build){const carrier=body.confirmation,auth=carrier.authorization;
 if(!equal(carrier.intent,body.intent)||!equal(carrier.referenceBrief,body.referenceBrief)||carrier.intentDigest!==body.intentDigest||carrier.referenceBriefDigest!==body.referenceBriefDigest||auth.sessionRef!==body.sessionRef||auth.turnRevision!==body.turnRevision||!equal(auth.localContext,body.localContext)||!equal(auth.intent,body.intent.confirmedIntent))fail('INTENT_UNCONFIRMED',build?'PAYLOAD_CHANGED':'REQUIRED_FACT_UNKNOWN');
}
export function validateCurrentRequest(wire,operation,body,input){
 const facts=validateType('LocalRequestFacts',input);
 if(facts.requestState==='CANCELLED')fail('REQUEST_CANCELLED','REVISION_CHANGED');
 if(facts.requestState==='UNKNOWN')fail('REQUEST_NOT_ACTIVE','REQUIRED_FACT_UNKNOWN');
 if(!facts.currentContext||!equal(facts.currentContext,body.localContext))fail('CURRENT_WORLD_MISMATCH','REVISION_CHANGED');
 if(facts.currentTurnRevision!==body.turnRevision)fail('TURN_REVISION_MISMATCH','REVISION_CHANGED');
 if(facts.sessionRef!==body.sessionRef||facts.currentBriefDigest!==body.referenceBriefDigest||facts.requestState==='COMPLETED'||facts.replay!=='NEW'||facts.priorRequestDigest!==null)fail('TRANSACTION_CONFLICT','PAYLOAD_CHANGED');
 return {disposition:'PROCEED'};
}
export function validateBuildProposalContext(body,facts){
 checkIntent(body,true);
 if(body.intent.contractVersion==='session/v6')validateConfirmationFacts(body,facts,true);
 const context=Object.fromEntries(Object.entries(body).filter(([k])=>k!=='requestId'&&k!=='proposal'));
 if(!equal(context,facts.sourceContext)||!equal(context,facts.currentContext))fail(body.intent.contractVersion==='session/v6'?'CURRENT_WORLD_MISMATCH':'TARGET_FACTS_STALE','REVISION_CHANGED');
 const {targetFacts:target,catalogue,regionInspection:inspection}=body;
 validateRegionInspection(inspection);
 for(const[k,v,h]of [['target-facts',target,body.targetFactsDigest],['safety-profile',body.safetyProfile,body.safetyProfileDigest]])if(digestValue(k,v).sha256!==h)fail('TARGET_FACTS_STALE','REVISION_CHANGED');
 if(!equal(target,inspection.targetFacts)||body.targetFactsDigest!==inspection.targetFactsDigest||target.worldRef!==body.worldRef||target.catalogueDigest!==digestValue('catalogue',catalogue).sha256)fail('TARGET_FACTS_STALE','REVISION_CHANGED');
 if(body.safetyProfile.requireBodyClearance!==true)fail('CAPABILITY_UNAVAILABLE','POLICY_UNAVAILABLE');
 if(!equal(safetyProfileFromConfirmedIntent(body.intent),body.safetyProfile))fail('INTENT_UNCONFIRMED','PAYLOAD_CHANGED');
 if(body.intent.confirmedIntent.siteRules.requireEntranceConnectivity&&body.intent.confirmedIntent.siteRules.entranceClearance===null)fail('INTENT_UNCONFIRMED','REQUIRED_FACT_UNKNOWN');
 requireSiteRuleChecks(body.safetyProfile,{entrance:true});
 const materials=validateStaticMaterials(body.proposal.materials,catalogue);
 checkHazards(Object.values(materials),catalogue,body.safetyProfile.hazardPolicy);
 const placement=confirmedPlacementOf(body.intent,body.referenceBrief);if(placement){requirePlacementSource(placement,inspection,body.worldRef);const p=[];for(const box of body.proposal.boxes)for(let x=box.min[0];x<=box.max[0];x++)for(let y=box.min[1];y<=box.max[1];y++)for(let z=box.min[2];z<=box.max[2];z++)p.push([x+target.sampledBounds.min[0],y+target.sampledBounds.min[1],z+target.sampledBounds.min[2]]);placementContains(placement,p);}
 return body;
}
export function validateConfirmationFacts(body,facts,build){
 if(facts.currentConfirmation===null)fail('INTENT_UNCONFIRMED','REQUIRED_FACT_UNKNOWN');
 if(!equal(body.confirmation,facts.currentConfirmation))fail('INTENT_UNCONFIRMED',build?'PAYLOAD_CHANGED':'REQUIRED_FACT_UNKNOWN');
 const context=Object.fromEntries(Object.entries(body).filter(([k])=>k!=='requestId'&&k!=='proposal'));
 if(!equal(context,facts.sourceContext)||!equal(context,facts.currentContext))fail('CURRENT_WORLD_MISMATCH','REVISION_CHANGED');
}
export function validateRegionInspection(input){const value=validateType('RegionInspection',input);if(digestValue('frame',value.frame).sha256!==value.targetFacts.frameDigest||digestValue('target-facts',value.targetFacts).sha256!==value.targetFactsDigest)fail('TARGET_FACTS_STALE','REVISION_CHANGED');return value;}
function checkHazards(specs,catalogue,policy){for(const spec of specs){const t=catalogue.materials[spec.materialRef];if(t.liquid===null||t.hazardPerSecond===null)fail('UNSUPPORTED_MATERIAL','REQUIRED_FACT_UNKNOWN');if(policy.forbidLiquid&&t.liquid||t.hazardPerSecond>policy.maximumDamagePerSecond)fail('SAFETY_INVARIANT_FAILED','REQUIRED_FACT_UNKNOWN');}}
function checkRegionBusiness(body){
 if(digestValue('catalogue',body.catalogue).sha256!==body.catalogueDigest)fail('CATALOGUE_MISMATCH','CATALOGUE_UNRESOLVED');
 if(body.referenceBrief.sessionRef!==body.sessionRef)fail('SCHEMA_INVALID');
 if(body.intent.intendedWorldRef!==body.worldRef)fail('CURRENT_WORLD_MISMATCH','REVISION_CHANGED');
 const rules=body.intent.confirmedIntent.siteRules;requireSiteRuleChecks({optionalLightRule:rules.optionalLightRule,requireEntranceConnectivity:rules.requireEntranceConnectivity});
 checkHazards(body.proposal.block.palette,body.catalogue,rules.hazardPolicy);
 const placement=confirmedPlacementOf(body.intent,body.referenceBrief);
 if(placement){if(placement.worldRef!==body.worldRef)fail('CURRENT_WORLD_MISMATCH','SCOPE_DENIED');placementContains(placement,expandRegionBlock(body.proposal.block).effects.map(e=>e.position));}
}
export function regionBlockBox(block){const max=block.origin.map((v,i)=>v+block.size[i]-1);if(!max.every(Number.isSafeInteger))fail('SCHEMA_INVALID','INVALID_GEOMETRY');return {min:[...block.origin],max};}
function checkRegionBlock(block){
 regionBlockBox(block);const total=block.size.reduce((a,b)=>a*b,1);if(!Number.isSafeInteger(total))fail('SCHEMA_INVALID','INVALID_GEOMETRY');
 if(block.runs.reduce((sum,[n])=>sum+n,0)!==total)fail('SCHEMA_INVALID','INVALID_GEOMETRY');
 for(let i=0;i<block.runs.length;i++){const[n,index]=block.runs[i];if(!Number.isSafeInteger(n)||n<=0||index!==null&&(!Number.isSafeInteger(index)||index<0||index>=block.palette.length))fail('SCHEMA_INVALID','INVALID_GEOMETRY');if(i&&block.runs[i-1][1]===index)fail('SCHEMA_INVALID','INVALID_SHAPE');}
 for(let i=1;i<block.palette.length;i++){const a=block.palette[i-1],b=block.palette[i];if(compareUTF16(a.materialRef,b.materialRef)>0||a.materialRef===b.materialRef&&a.orientation>=b.orientation)fail('SCHEMA_INVALID','INVALID_SHAPE');}
}
export function expandRegionBlock(input){const block=validateType('RegionVoxelBlock',input);const effects=[],indices=[];let at=0;
 for(const[n,index]of block.runs){for(let j=0;j<n;j++,at++){indices.push(index===null?-1:index);if(index===null)continue;const x=at%block.size[0],y=Math.floor(at/block.size[0])%block.size[1],z=Math.floor(at/(block.size[0]*block.size[1]));effects.push({geometryProfile:block.geometryProfile,position:[block.origin[0]+x,block.origin[1]+y,block.origin[2]+z],...block.palette[index]});}}
 effects.sort((a,b)=>comparePosition(a.position,b.position));return {effects,declaredBounds:regionBlockBox(block),indices:Int32Array.from(indices),palette:block.palette};
}
export function validateWitnessCoherence({build,finalEffects,targetFacts,safetyProfile,catalogue}){
 const binding={finalEffectsDigest:digestValue('final-effects',finalEffects).sha256,targetFactsDigest:digestValue('target-facts',targetFacts).sha256,safetyProfileDigest:digestValue('safety-profile',safetyProfile).sha256};
 for(const witness of build.witnesses)for(const[k,v]of Object.entries(binding))if(witness[k]!==v)fail('SAFETY_INVARIANT_FAILED','PAYLOAD_CHANGED');
 checkHazards(finalEffects.effects,catalogue,safetyProfile.hazardPolicy);return build;
}
export function validateMaterialSources(input,catalogue,currentConnection){
 const admitted=validateType('MaterialSourcesInput',input),{snapshot,textures}=admitted;
 if(!equal(snapshot.connection,currentConnection))fail('CURRENT_WORLD_MISMATCH');
 if(snapshot.catalogueDigest!==digestValue('catalogue',catalogue).sha256||!equal(snapshot.engineRevisions,catalogue.engineRevisions))fail('CATALOGUE_MISMATCH');
 const {sourceRevision,...projection}=snapshot;
 if(digestValue('material-sources',projection).sha256!==sourceRevision)fail('NON_CANONICAL_AMBIGUITY');
 const needed=new Map();let previous=null;
 for(const row of snapshot.materials){const tags=catalogue.materials[row.materialRef];if(!tags||tags.definitionRevision!==row.definitionRevision)fail('CATALOGUE_MISMATCH');if(!tags.orientations?.includes(row.orientation))fail('UNSUPPORTED_MUTATION_SEMANTICS');
  if(previous&&(compareUTF16(previous.materialRef,row.materialRef)>0||previous.materialRef===row.materialRef&&previous.orientation>=row.orientation))fail('NON_CANONICAL_AMBIGUITY');previous=row;
  if(row.availability==='KNOWN')needed.set(row.texture.bytesDigest,row.texture);
 }
 if(textures.length!==needed.size)fail('SCHEMA_INVALID');const seen=new Set();
 for(const t of textures){const texture=needed.get(t.bytesDigest);if(!texture||seen.has(t.bytesDigest))fail('SCHEMA_INVALID');seen.add(t.bytesDigest);if(t.bytes.length!==texture.byteLength||createHash('sha256').update(t.bytes).digest('hex')!==t.bytesDigest)fail('NON_CANONICAL_AMBIGUITY');}
 return admitted;
}
// Local convenience helpers over Painter's documented geometry and bindings.
export const requirePlacementTarget=(placement,positions)=>{placementContains(placement,positions);return placement;};
export const confirmedPlacement=deepFreeze({namedFailures:[
 {failure:'PLACEMENT_BINDING_CHANGED',code:'INTENT_UNCONFIRMED',reason:'IDENTITY_UNVERIFIED'},
 {failure:'PLACEMENT_WORLD_CHANGED',code:'CURRENT_WORLD_MISMATCH',reason:'SCOPE_DENIED'},
 {failure:'PLACEMENT_FRAME_CHANGED',code:'INVALID_FRAME',reason:'PAYLOAD_CHANGED'},
 {failure:'PLACEMENT_REVISION_STALE',code:'TARGET_FACTS_STALE',reason:'REVISION_CHANGED'},
 {failure:'PLACEMENT_INSPECTION_CHANGED',code:'TARGET_FACTS_STALE',reason:'PAYLOAD_CHANGED'},
 {failure:'PLACEMENT_TARGET_MISMATCH',code:'INTENT_UNCONFIRMED',reason:'INVALID_GEOMETRY'},
]});
export function encodeRegionBlock({origin,size,palette,indices,geometryProfile='voxel-grid/v1'}){
 const sorted=palette.map((entry,index)=>({entry,index})).sort((a,b)=>compareUTF16(a.entry.materialRef,b.entry.materialRef)||a.entry.orientation-b.entry.orientation);
 const mapping=new Map(sorted.map((v,i)=>[v.index,i]));const runs=[];
 for(const raw of indices){const value=raw===-1||raw===null?null:mapping.get(raw);if(value===undefined)fail('SCHEMA_INVALID','INVALID_GEOMETRY');if(runs.length&&runs.at(-1)[1]===value)runs.at(-1)[0]++;else runs.push([1,value]);}
 return validateType('RegionVoxelBlock',{profileVersion:'region-voxels/v2',geometryProfile,origin,size,indexOrder:'X_FASTEST_THEN_Y_THEN_Z',palette:sorted.map(v=>v.entry),runs});
}
export function protocolRequirement(wire,capabilities=[],minor=0){const parsed=/^(.+)\/v(\d+)$/.exec(wire);if(!parsed)fail('UNSUPPORTED_VERSION','VERSION_UNSUPPORTED','decode');return {protocol:parsed[1],major:Number(parsed[2]),minor,capabilities};}
export function checkProtocolCompatibility(input,requirements){const handshake=validateType('ProtocolHandshake',input);for(const req of requirements){const actual=handshake.protocols.find(p=>p.protocol===req.protocol);if(!actual||actual.major!==req.major||actual.minor<req.minor)fail('UNSUPPORTED_VERSION','VERSION_UNSUPPORTED','decode');if(!req.capabilities.every(c=>handshake.capabilities.includes(c)))fail('CAPABILITY_UNAVAILABLE','REQUIRED_FACT_UNKNOWN');}return {result:'PROTOCOL_COMPATIBLE'};}
export function checkContractsVersion(version){if(!/^hanaworlds-contracts@2\./.test(version))fail('UNSUPPORTED_VERSION','VERSION_UNSUPPORTED','decode');return {result:'CONTRACTS_MAJOR_MATCH'};}
export function checkContractHandshake(input){if(!equal(input,contractHandshake))fail('UNSUPPORTED_VERSION','VERSION_UNSUPPORTED','decode');return {result:'HANDSHAKE_VERSION_MATCH'};}
export const checkBuildProposalHandshake=checkContractHandshake;
