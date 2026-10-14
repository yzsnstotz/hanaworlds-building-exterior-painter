// Q241: Painter authors its own carrier projections; PM supplies candidate values, not source authority.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { doc } from './painter-review-harness.mjs';
import { assertShape } from './painter-document-oracle.mjs';
export const major=value=>Number(/\/v(\d+)$/.exec(value??'')?.[1]);
export const canonical=value=>Array.isArray(value)?'['+value.map(canonical).join(',')+']'
 :value!==null&&typeof value==='object'?'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}'
 :JSON.stringify(value);
export const v5Digest=(kind,value)=>createHash('sha256').update(Buffer.from(doc.digest.prefixes[kind]+kind+doc.digest.domainSuffix+canonical(value),'utf8')).digest('hex');

function branches(schema,seen=new Set()) {
 if(schema.$ref){
  assert.ok(!seen.has(schema.$ref),'version branch must not be a recursive placeholder');
  return branches(doc.definitions[schema.$ref.slice(14)],new Set([...seen,schema.$ref]));
 }
 if(schema.anyOf||schema.oneOf)return (schema.anyOf??schema.oneOf).flatMap(s=>branches(s,seen));
 return [schema];
}
for(const operation of ['ValidateBuildProposal','ValidateRegionProposal'])for(const field of ['intent','referenceBrief'])
 test(`document closure: ${operation} ${field} has complete v5 and v6 branches`,()=>{
  const variants=branches(doc.definitions[operation+'Request']).flatMap(s=>branches(s.properties[field]));
  for(const version of [5,6]){
   const matching=variants.filter(s=>major(s.properties?.contractVersion?.const)===version);
   assert.equal(matching.length,1,`OWNED_CONTRACT: ${operation}.${field} complete v${version} branch is required; do not relabel v5`);
   const branch=matching[0];
   assert.equal(branch.type,'object');assert.equal(branch.additionalProperties,false);
   assert.ok(branch.required.includes('contractVersion'));
   assert.ok(Object.keys(branch.properties).length>1,'a version marker alone is not a complete type');
  }
 });
for(const operation of ['ValidateBuildProposal','ValidateRegionProposal'])for(const version of [5,6])
 test(`document sample coverage: ${operation} v${version} complete success and refusal`,()=>{
  const rows=doc.examples.filter(r=>r.operation===operation&&major(r.request?.intent?.contractVersion)===version&&major(r.request?.referenceBrief?.contractVersion)===version);
  const success=rows.filter(r=>r.expected?.result!=null),refusal=rows.filter(r=>r.expected?.error!=null);
  assert.ok(success.length>0,`OWNED_CONTRACT: ${operation} v${version} full success request/facts/response missing`);
  assert.ok(refusal.length>0,`OWNED_CONTRACT: ${operation} v${version} full refusal and correlation missing`);
  for(const row of rows){
   if(row.requestAdmitted)assertShape(row.requestType,row.request);
   assertShape(row.responseType,row.expected);
   if(row.facts!=null)assertShape(row.factsType,row.facts);
   assert.equal(row.expected.requestId,row.request.requestId);
   assert.equal(row.expected.contractVersion,row.request.contractVersion);
   if(row.expected.result)assert.equal(row.expected.result.invocationId,row.request.invocationId);
  }
 });
test('retained v5 intent/brief canonical UTF8 byte domains match every admitted sample',()=>{
 assert.equal(doc.digest.algorithm,'RFC8785 canonical JSON + SHA256');
 for(const row of doc.examples.filter(r=>r.requestAdmitted&&r.operation!=='hanaworlds_image_material'&&major(r.request?.intent?.contractVersion)===5&&major(r.request?.referenceBrief?.contractVersion)===5)){
  assert.equal(major(row.request.intent.contractVersion),5);
  assert.equal(major(row.request.referenceBrief.contractVersion),5);
  assert.equal(v5Digest('reference-brief',row.request.referenceBrief),row.request.referenceBriefDigest);
  assert.equal(row.request.intent.referenceBriefDigest,row.request.referenceBriefDigest);
  assert.equal(v5Digest('intent',row.request.intent),row.request.intentDigest);
 }
});
test('document closure: Region facts can carry complete confirmed intent and brief',()=>{
 // Only traverse existing documented fields; add no guessed persistence port or property.
 const reached=new Set();
 const walk=s=>{if(!s||typeof s!=='object')return;
  if(s.$ref){const name=s.$ref.slice(14);if(reached.has(name))return;reached.add(name);walk(doc.definitions[name]);}
  for(const value of Object.values(s))if(typeof value==='object')walk(value);
 };
 walk(doc.definitions.RegionProposalProviderFactsV6);
 assert.ok(reached.has('IntentProjectionV6')&&reached.has('BriefProjectionV6')&&reached.has('ConfirmationCarrierV6'),
  'OWNED_CONTRACT: v6 Region facts must carry complete confirmation/intent/brief; legacy LocalRequestFacts stays unchanged');
});
