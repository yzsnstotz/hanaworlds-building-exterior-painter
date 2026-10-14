// Test-only JSON-schema contract substitute, not a runtime Tools implementation.
// Checked against deepseek-ai/deepseek-harness commit
// 571902028a75c64c1d767f4ae5fd099485f0ddf0, json-schema.ts:73-402 and
// index.ts:1071-1095. Covers JSON-valued schemas used by this plugin.
export const NATIVE_SCHEMA_SOURCE_SHA='13deffdfd34539e23706b0fde235991da45b2f07c5c18dbbf3ca734c1da0c788';
const constraints=new Set(['type','oneOf','properties','required','additionalProperties','items','enum','const']);
const annotations=new Set(['description','title','default','examples']);
const types=['object','array','string','number','integer','boolean','null'];
const tails=['properties','required','additionalProperties','items','enum','const'];
const has=(o,k)=>Object.hasOwn(o,k);
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)
 &&[Object.prototype,null].includes(Object.getPrototypeOf(v))
 &&Reflect.ownKeys(v).every(k=>typeof k==='string'&&Object.getOwnPropertyDescriptor(v,k).enumerable
  &&has(Object.getOwnPropertyDescriptor(v,k),'value'));
const array=v=>Array.isArray(v)&&Object.getPrototypeOf(v)===Array.prototype
 &&Reflect.ownKeys(v).length===v.length+1&&Array.from({length:v.length},(_,i)=>has(v,i)).every(Boolean);
const scalar=(type,v)=>type==='null'?v===null:type==='number'||type==='integer'
 ?typeof v==='number'&&Number.isFinite(v)&&!Object.is(v,-0)&&(type!=='integer'||Number.isInteger(v))
 :typeof v===type;
function json(v,active=new Set()) {
 if(v===null||typeof v==='string'||typeof v==='boolean')return true;
 if(typeof v==='number')return Number.isFinite(v)&&!Object.is(v,-0);
 if(!record(v)&&!array(v)||active.has(v))return false;
 active.add(v);const okay=Object.values(v).every(x=>json(x,active));active.delete(v);return okay;
}
export function assertSupportedNativeSchema(root) {
 const violations=[],active=new Set();
 const visit=(node,path)=>{
  const bad=message=>violations.push(path+': '+message);
  if(!record(node)){bad('schema object required');return;}
  if(active.has(node)){bad('circular schema');return;}
  active.add(node);
  for(const key of Object.keys(node)) {
   if(constraints.has(key))continue;
   if(annotations.has(key)){if(!json(node[key]))bad(key+' annotation must be lossless JSON');}
   else bad(key+' is unsupported');
  }
  for(const key of ['title','description'])if(has(node,key)&&typeof node[key]!=='string')bad(key+' must be string');
  const typed=has(node,'type'),union=has(node,'oneOf');
  if(typed&&union)bad('type and oneOf are exclusive');
  else if(!typed&&!union){for(const key of tails)if(has(node,key))bad(key+' requires type or oneOf');}
  else if(union){
   if(!array(node.oneOf)||node.oneOf.length<2)bad('oneOf needs at least two schemas');
   else node.oneOf.forEach((child,i)=>visit(child,path+'.oneOf['+i+']'));
   for(const key of tails)if(has(node,key))bad(key+' is unsupported beside oneOf');
  } else if(!types.includes(node.type))bad('single supported type string required');
  else {
   const allowed={properties:['object'],required:['object'],additionalProperties:['object'],items:['array'],
    enum:['string','number','integer','boolean','null'],const:['string','number','integer','boolean','null']};
   for(const [key,scope] of Object.entries(allowed))if(has(node,key)&&!scope.includes(node.type))bad(key+' on wrong type');
   if(node.type==='object'){
    if(has(node,'properties')){
     if(!record(node.properties))bad('properties must be schema map');
     else for(const [key,child] of Object.entries(node.properties))visit(child,path+'.properties.'+key);
    }
    if(has(node,'required')){
     if(!array(node.required)||node.required.some(k=>typeof k!=='string'))bad('required must be string array');
     else for(const key of node.required)if(!record(node.properties)||!has(node.properties,key))bad('required key not declared: '+key);
    }
    if(has(node,'additionalProperties')&&typeof node.additionalProperties!=='boolean')bad('additionalProperties must be boolean');
   } else if(node.type==='array'){
    if(has(node,'items'))visit(node.items,path+'.items');
   } else {
    const enumeration=has(node,'enum')&&array(node.enum)&&node.enum.length>0&&node.enum.every(v=>scalar(node.type,v));
    if(has(node,'enum')&&!enumeration)bad('enum must contain matching scalars');
    if(has(node,'const')){
     if(!scalar(node.type,node.const))bad('const has wrong scalar type');
     else if(enumeration&&!node.enum.includes(node.const))bad('const not in enum');
    }
   }
  }
  active.delete(node);
 };
 visit(root,'schema');
 if(violations.length){const error=new Error('unsupported JSON schema: '+violations.join('; '));
  error.name='JsonSchemaError';error.code='UNSUPPORTED_SCHEMA';error.violations=violations;throw error;}
}
export function assertNativeRegistrationSchemas(definition) {
 if(!definition.output||typeof definition.output.render!=='function'
  ||has(definition.output,'presentationMeta')&&typeof definition.output.presentationMeta!=='function')
  throw new TypeError('Mandatory canonical output declaration required');
 assertSupportedNativeSchema(definition.output.schema);
 // Raw authors own parameter validation; this card additionally gates the
 // complete model input schema, instead of assuming output registration did it.
 assertSupportedNativeSchema(definition.parameters);
 if(definition.parameters.type!=='object')throw new TypeError('Object-root model parameters required');
 if(has(definition,'timeoutMs')&&(!Number.isFinite(definition.timeoutMs)||definition.timeoutMs<=0))
  throw new TypeError('Positive finite timeout required');
}
