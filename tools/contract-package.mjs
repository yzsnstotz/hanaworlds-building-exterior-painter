// Historical test data is owned locally; no contract package is installed or loaded.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as owned from '../src/contract.mjs';
import documentData from '../src/painter-document-data.mjs';
// Old test-only coverage input helper is not a new public Painter operation/type.
// Its byte domain is checked against the unchanged main fixture's coverageDigest.
const coverageDigest=value=>{
 if(value?.profileVersion!=='coverage/v2'||Object.keys(value).sort().join(',')!=='profileVersion,sampledBounds,sampledPositions')throw new TypeError('Historical coverage input required');
 owned.validateType('Box',value.sampledBounds);owned.validateType('Positions',value.sampledPositions);
 return {sha256:createHash('sha256').update(documentData.digest.prefixes['target-facts']+'coverage|'+owned.canonicalJSON(value)).digest('hex')};
};
export const contracts=Object.freeze({...owned,digestValue:(kind,value)=>kind==='coverage'?coverageDigest(value):owned.digestValue(kind,value)});
export const contractFixture=name=>JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`,import.meta.url),'utf8'));
// Retain the old advertised wire provenance, not an installed dependency identity.
export const contractPackage=()=>({name:'hanaworlds-contracts',version:'2.0.0'});
