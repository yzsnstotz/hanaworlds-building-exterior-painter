// Test-only carrier of C-painter document values. Never supplies real authorization.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { doc, example } from './painter-document-oracle.mjs';
export { doc, example };
export const root = resolve(new URL('..', import.meta.url).pathname);
export function assertOwnSource() {
 const pkg=JSON.parse(readFileSync(resolve(root,'package.json')));
 for(const section of ['dependencies','devDependencies','peerDependencies','optionalDependencies'])
  assert.ok(!Object.hasOwn(pkg[section]??{},'hanaworlds-contracts'),
   'SOURCE_MIGRATION: Painter must own its documented projections; retired SDK remains in '+section);
 const lock=JSON.parse(readFileSync(resolve(root,'package-lock.json')));
 assert.ok(!Object.keys(lock.packages??{}).some(p=>/(^|\/)node_modules\/hanaworlds-contracts$/.test(p)),
  'SOURCE_MIGRATION: retired SDK remains in lock');
 for(const dir of ['src','tools']) for(const file of readdirSync(resolve(root,dir),{recursive:true}).filter(f=>/\.mjs$/.test(f))) {
  const body=readFileSync(resolve(root,dir,file),'utf8');
  assert.doesNotMatch(body,/(?:from\s*|import\s*\(|require\s*\(|import\.meta\.resolve\s*\()\s*['"]hanaworlds-contracts(?:\/|['"])/,
   'SOURCE_MIGRATION: production/build/verify must use owned document values: '+dir+'/'+file);
 }
}
export async function runtime() {
 assertOwnSource(); // Q228: meaningful source target RED before any import/install/pack prerequisite.
 const consumer=process.env.PAINTER_TEST_PACKAGE;
 if(consumer){
  const pkg=JSON.parse(readFileSync(resolve(consumer,'package.json')));
  assert.equal(pkg.name,doc.registrationIO.package);
  const entry=pkg.exports['.'];
  assert.equal(typeof entry,'string');
  return import(pathToFileURL(resolve(consumer,entry)).href);
 }
 return import('../src/index.mjs');
}
export function typed(input) {
 const copy=structuredClone(input);
 if(Array.isArray(copy?.imageBytes))copy.imageBytes=Uint8Array.from(copy.imageBytes);
 for(const t of copy?.materialSources?.textures??[])if(Array.isArray(t.bytes))t.bytes=Uint8Array.from(t.bytes);
 return copy;
}
export function register(api,{settings={},facts=null,read}={}) {
 const provided=new Map();
 const port=read?{read}:{async read(){return structuredClone(facts);}};
 const ctx={get:n=>provided.has(n)?provided.get(n):n==='hanaworldsPainterLocalFacts'&&facts!==null?port:undefined,
  provide:(n,v)=>{assert.ok(!provided.has(n),'duplicate registration');provided.set(n,v);}};
 const painter=api.apply(ctx,api.Config(settings));
 return {painter,tool:provided.get('hanaworlds_image_material'),provided,ctx,port};
}
export async function callExample(api,row,raw=row.request) {
 const {painter,tool}=register(api,{facts:row.facts});
 return row.operation==='hanaworlds_image_material'?tool.execute(typed(raw)):painter.call(row.operation,structuredClone(raw));
}
export function assertError(error,expected) {
 assert.deepEqual(Object.fromEntries(Object.keys(expected).map(k=>[k,error[k]])),expected);
}
export const encodings=request=>[structuredClone(request),JSON.stringify(request),new TextEncoder().encode(JSON.stringify(request))];
export function mutated(row) {
 const input=structuredClone(row.input);
 if(row.mutation.kind==='nonFinite'){
  let parent=input;for(const k of row.mutation.path.slice(0,-1))parent=parent[k];
  parent[row.mutation.path.at(-1)]=Infinity;
 }
 return input;
}
