import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertSupportedNativeSchema,assertNativeRegistrationSchemas,NATIVE_SCHEMA_SOURCE_SHA} from './native-schema-contract.mjs';
const rejected=JSON.parse(readFileSync(new URL('./native-schema-cases.json',import.meta.url)));
const text=readFileSync(new URL('../../contract-add/C-painter.md',import.meta.url),'utf8');
const document=JSON.parse([...text.matchAll(/```json title=Q278ModelImageSupplement\n([\s\S]*?)\n```/g)].at(-1)[1]);
const definition=(output=document.outputSchema,parameters=document.parameters)=>({
 name:'hanaworlds_image_material',parameters,output:{schema:output,render:(_args,value)=>[{type:'text',text:JSON.stringify(value)}]},
 execute:async()=>{throw new Error('schema registration must not execute an image call');},
});
const unsupported=error=>error.code==='UNSUPPORTED_SCHEMA';

test('D183 old complete output cannot register, including the actual engineRevisions counterexample',()=>{
 assert.equal(rejected.sourceSHA256,NATIVE_SCHEMA_SOURCE_SHA);
 assert.deepEqual(rejected.rejectedCompleteOutputSchema.properties.engineRevisions,
  {type:'object',additionalProperties:{$ref:'#/definitions/Revision'}});
 assert.throws(()=>assertNativeRegistrationSchemas(definition(rejected.rejectedCompleteOutputSchema)),error=>
  unsupported(error)&&error.violations.some(v=>v.includes('engineRevisions')&&v.includes('additionalProperties')));
});
test('D183 refs and schema-valued dictionaries are independently refused at nested positions',()=>{
 for(const invalid of [{$ref:'#/definitions/Revision'},
  {type:'object',additionalProperties:{type:'string'}},
  {type:'array',items:{$ref:'#/definitions/Revision'}},
  {type:'object',properties:{nested:{type:'object',additionalProperties:{type:'string'}}}}]) {
  assert.throws(()=>assertSupportedNativeSchema(invalid),unsupported);
  assert.throws(()=>assertNativeRegistrationSchemas(definition(document.outputSchema,
   {type:'object',properties:{attachmentRef:invalid},required:['attachmentRef'],additionalProperties:false})),unsupported);
 }
});
test('D183 corrected complete input and output register without filtering fields or values',()=>{
 assert.doesNotThrow(()=>assertNativeRegistrationSchemas(definition()));
 assert.deepEqual(document.outputSchema.properties.engineRevisions,{type:'object',additionalProperties:true});
 assert.deepEqual(Object.keys(document.outputSchema.properties).sort(),
  Object.keys(rejected.rejectedCompleteOutputSchema.properties).sort());
 assert.deepEqual(document.outputSchema.required,rejected.rejectedCompleteOutputSchema.required);
 const repaired=structuredClone(rejected.rejectedCompleteOutputSchema);
 repaired.properties.engineRevisions={type:'object',additionalProperties:true};
 for(const [path,type] of [['image.format','string'],['match.algorithm','string'],
  ['match.texture.sourceKind','string'],['match.texture.interpretation','string'],
  ['match.texture.mediaType','string'],['sourceBasis','string'],['modelCalls','integer'],['worldWrites','integer']]) {
  let node=repaired;for(const key of path.split('.'))node=node.properties[key];node.type=type;
 }
 assert.deepEqual(document.outputSchema,repaired,'only dictionary projection/literal types change; all result fields and literals stay whole');
 assert.deepEqual(document.parameters,rejected.rejectedCompleteParameters);
});
test('checked substitute rejects unsupported keywords and malformed raw node combinations',()=>{
 for(const schema of [true,null,[],{type:['string','null']},{type:'object',required:['missing']},
  {type:'array',properties:{}},{type:'object',items:{type:'string'}},{type:'string',enum:[]},
  {type:'integer',const:1.5},{type:'number',const:-0},{type:'string',enum:['a'],const:'b'},
  {type:'object',additionalProperties:1},{type:'string',minLength:1},{type:'object',patternProperties:{}},
  {anyOf:[{type:'string'},{type:'null'}]},{type:'string',oneOf:[{type:'string'},{type:'null'}]},
  {oneOf:[{type:'string'}]},{oneOf:[{type:'string'},{type:'null'}],required:[]},
  {description:1},{examples:Infinity}])assert.throws(()=>assertSupportedNativeSchema(schema),unsupported);
 for(const schema of [{},{type:'object',additionalProperties:true},
  {type:'object',properties:{x:{type:'array',items:{type:'integer'}}},required:['x'],additionalProperties:false},
  {oneOf:[{type:'string'},{type:'null'}]}, {type:'number',enum:[1,2],const:2},
  {description:'annotation only',examples:{nested:['value',null]}}])
  assert.doesNotThrow(()=>assertSupportedNativeSchema(schema));
});
