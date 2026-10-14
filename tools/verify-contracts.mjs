// Verify the owned projections against the complete published document, not a retired SDK.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import data from '../src/painter-document-data.mjs';
import {ADMITTED_DOCUMENT} from './admitted-contracts.mjs';
const sha=v=>createHash('sha256').update(v).digest('hex');
const body=[...readFileSync('/Users/yzliu/work/Docs/Projects/hana-world/contracts/C-painter.md','utf8').matchAll(/```json\n([\s\S]*?)\n```/g)].at(-1)[1];
assert.equal(sha(body),ADMITTED_DOCUMENT.documentSHA256,'approved complete document bytes');
const doc=JSON.parse(body);
for(const key of Object.keys(data).filter(k=>!['registrationIO','documentSHA256'].includes(k)))assert.deepEqual(data[key],doc[key],key);
assert.deepEqual(data.registrationIO,Object.fromEntries(Object.entries(doc.registrationIO).filter(([k])=>k!=='helpers')));
assert.equal(data.documentSHA256,sha(body));assert.equal(Object.keys(data.definitions).length,192);
function refs(v){if(!v||typeof v!=='object')return;if(v.$ref){assert.match(v.$ref,/^#\/definitions\/[^/]+$/);assert.ok(data.definitions[v.$ref.slice(14)]);}for(const child of Object.values(v))refs(child);}refs(data.definitions);
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url))),lock=JSON.parse(readFileSync(new URL('../package-lock.json',import.meta.url)));
for(const section of ['dependencies','devDependencies','peerDependencies','optionalDependencies'])assert.ok(!Object.hasOwn(pkg[section]??{},'hanaworlds-contracts'));
assert.ok(!Object.keys(lock.packages).some(k=>/(^|\/)node_modules\/hanaworlds-contracts$/.test(k)));
console.log(JSON.stringify({result:'PASS',source:'C-painter/v3 owned projections',documentSHA256:sha(body),definitions:192,retiredPackage:false}));
