// Original image capability's native channel. Host identity and source reads
// remain with the current Workshop; Painter consumes only its public projection.
import {types,isDeepStrictEqual} from 'node:util';
import {ContractError,snapshotData,validateType,validateOwnedProjection,deepFreeze,canonicalJSON} from './contract.mjs';
import {ImageMaterialError,IMAGE_MATERIAL_TOOL} from './current-image-material.mjs';
import document from './image-tool-document-data.mjs';

const shape=()=>{throw new ContractError('SCHEMA_INVALID','decode','INVALID_SHAPE');};
function modelRequest(raw) {
 if(types.isProxy(raw)||raw===null||typeof raw!=='object'||Array.isArray(raw)
  ||![Object.prototype,null].includes(Object.getPrototypeOf(raw)))shape();
 const request={};
 for(const key of Reflect.ownKeys(raw)) {
  if(typeof key!=='string')shape();
  const descriptor=Object.getOwnPropertyDescriptor(raw,key);
  if(!descriptor.enumerable||!Object.hasOwn(descriptor,'value'))shape();
  if(key!=='attachmentRef')throw new ContractError('UNKNOWN_REQUIRED_FIELD','decode','UNKNOWN_FIELD');
  if(typeof descriptor.value!=='string'||descriptor.value.length===0)shape();
  request.attachmentRef=snapshotData(descriptor.value);
 }
 if(!Object.hasOwn(request,'attachmentRef'))shape();
 return Object.freeze(request);
}
function unavailable() {
 throw new ImageMaterialError('CAPABILITY_UNAVAILABLE','Current Workshop image supply is unavailable.');
}
const typedInput=p=>({imageBytes:p.imageBytes,catalogue:p.catalogue.facts.catalogue,
 currentConnection:p.catalogue.facts.connection,
 materialSources:{snapshot:p.materialSources.facts.snapshot,textures:p.materialSources.textures}});

function definition(ctx,painter) {
 const schemas=deepFreeze({parameters:structuredClone(document.parameters),output:structuredClone(document.outputSchema)});
 return Object.freeze({
  name:IMAGE_MATERIAL_TOOL.name,
  description:`Match a current human image attachment to the closest legal material. Pass only attachmentRef; current Host facts authorize the read. Visible image budgets: ${JSON.stringify(painter.imageLimits)}. CIEDE2000; zero model calls and world writes. The returned hint still requires proposal validation.`,
  parameters:schemas.parameters,
  output:Object.freeze({schema:schemas.output,render:(_args,value)=>[{type:'text',text:canonicalJSON(value)}]}),
  async execute(raw,exec) {
   const request=modelRequest(raw);
   if(!exec||typeof exec!=='object'||!exec.agent||!(exec.signal instanceof AbortSignal))shape();
   const checkCancellation=()=>exec.signal.throwIfAborted();
   checkCancellation();
   const provider=ctx.get('hanaworldsWorkshop');
   const method=provider?.readMaterialSourcesProjection;
   if(typeof method!=='function')unavailable();
   const checkProvider=()=>{
    if(ctx.get('hanaworldsWorkshop')!==provider||provider.readMaterialSourcesProjection!==method)unavailable();
   };
   const read=async()=>{
    checkCancellation();checkProvider();
    // Never clone exec/Agent/Session, rebuild permissions or flatten exceptions.
    const observed=await Reflect.apply(method,provider,[request,exec]);
    checkCancellation();checkProvider();
    return deepFreeze(snapshotData(observed,{bytes:true}));
   };
   const before=deepFreeze(validateOwnedProjection('MaterialSourcesProjection',await read(),document.definitions));
   const matched=await painter.matchCurrentImageMaterials(typedInput(before));
   checkCancellation();checkProvider();
   // Native open dictionaries cannot express Revision constraints. The original
   // full schema, including every dynamic key/value, remains the release gate.
   const result=deepFreeze(validateType('ImageMaterialResult',matched));
   const after=await read();
   if(!isDeepStrictEqual(before,after))throw new ContractError('CURRENT_WORLD_MISMATCH','validate','INVALID_SHAPE');
   return result;
  },
 });
}

export function mountModelImageTool(ctx,painter) {
 // Keep original root injection/typed-only loading. The native child's required
 // registry is tracked by Cordis; its registration is automatically disposed.
 if(typeof ctx.plugin==='function')ctx.plugin({
  name:'hanaworlds-building-exterior-painter-native',inject:['tools'],
  apply(nativeCtx){nativeCtx.tools.register(definition(nativeCtx,painter));},
 });
}
