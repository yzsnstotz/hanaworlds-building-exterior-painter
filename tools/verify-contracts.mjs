// Verify the owned projections against the complete published document, not a retired SDK.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import data from '../src/painter-document-data.mjs';
import modelData from '../src/image-tool-document-data.mjs';
import {ADMITTED_DOCUMENT,ADMITTED_MODEL_IMAGE_DOCUMENT} from './admitted-contracts.mjs';
const sha=v=>createHash('sha256').update(v).digest('hex');
const formalText=readFileSync('/Users/yzliu/work/Docs/Projects/hana-world/contracts/C-painter.md','utf8');
const body=[...formalText.matchAll(/```json\n([\s\S]*?)\n```/g)].at(-1)[1];
assert.equal(sha(body),ADMITTED_DOCUMENT.documentSHA256,'approved complete document bytes');
const doc=JSON.parse(body);
for(const key of Object.keys(data).filter(k=>!['registrationIO','documentSHA256'].includes(k)))assert.deepEqual(data[key],doc[key],key);
assert.deepEqual(data.registrationIO,Object.fromEntries(Object.entries(doc.registrationIO).filter(([k])=>k!=='helpers')));
assert.equal(data.documentSHA256,sha(body));assert.equal(Object.keys(data.definitions).length,192);
function refs(v){if(!v||typeof v!=='object')return;if(v.$ref){assert.match(v.$ref,/^#\/definitions\/[^/]+$/);assert.ok(data.definitions[v.$ref.slice(14)]);}for(const child of Object.values(v))refs(child);}refs(data.definitions);
const modelBody=[...formalText.matchAll(/```json title=Q278ModelImageSupplement\n([\s\S]*?)\n```/g)].at(-1)?.[1];
assert.ok(modelBody,'complete formally published model supplement required');
assert.equal(sha(modelBody),ADMITTED_MODEL_IMAGE_DOCUMENT.documentSHA256,'D186 complete model document bytes');
assert.equal(modelData.documentSHA256,sha(modelBody));
const modelDocument=JSON.parse(modelBody);
for(const key of ['definitions','parameters','outputSchema'])assert.deepEqual(modelData[key],modelDocument[key],key);
assert.equal(Object.keys(modelData.definitions).length,88);
function modelRefs(v){if(!v||typeof v!=='object')return;if(v.$ref)assert.ok(modelData.definitions[v.$ref.slice(14)]);for(const child of Object.values(v))modelRefs(child);}modelRefs(modelData.definitions);
// This checked test-only substitute is not bundled into the runtime. Keep the
// actual build/pack gate checking complete raw schemas, including D183 negatives.
const {assertNativeRegistrationSchemas}=await import('../test/native-schema-contract.mjs');
assertNativeRegistrationSchemas({parameters:modelData.parameters,output:{schema:modelData.outputSchema,render:()=>[]}});
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url))),lock=JSON.parse(readFileSync(new URL('../package-lock.json',import.meta.url)));
for(const section of ['dependencies','devDependencies','peerDependencies','optionalDependencies'])assert.ok(!Object.hasOwn(pkg[section]??{},'hanaworlds-contracts'));
assert.ok(!Object.keys(lock.packages).some(k=>/(^|\/)node_modules\/hanaworlds-contracts$/.test(k)));
console.log(JSON.stringify({result:'PASS',source:'C-painter/v3 owned projections',documentSHA256:sha(body),definitions:192,
 modelDocumentSHA256:sha(modelBody),modelDefinitions:88,retiredPackage:false}));
