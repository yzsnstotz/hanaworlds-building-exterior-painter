import test from 'node:test';
import assert from 'node:assert/strict';
import { runtime,register,doc,example,typed,assertError } from './painter-review-harness.mjs';
test('public root, registration and Config match document values',async()=>{
 const api=await runtime();
 assert.deepEqual(Object.keys(api).sort(),[...doc.exports].sort());
 assert.deepEqual(api.Config({}),{});
 for(const settings of [{maxBytes:91},{maxPixels:1},{formats:['jpeg']},{maxBytes:91,maxPixels:1,formats:['jpeg']}])
  assert.deepEqual(api.Config(settings),settings);
 const {painter,tool,provided,ctx}=register(api,{facts:example('build-success').facts});
 assert.deepEqual([...provided.keys()],doc.registrationIO.apply.provides);
 assert.equal(ctx.get(api.SERVICE),painter);
 assert.equal(ctx.get('hanaworlds_image_material'),tool);
 assert.equal(tool.name,'hanaworlds_image_material');
 assert.equal(typeof tool.execute,'function');
 assert.deepEqual(painter.handshake(),doc.handshakeObservation);
 assert.deepEqual(api.contractHandshake,doc.handshakeObservation);
 assert.deepEqual(painter.describe(),doc.describeObservation);
 assert.deepEqual(painter.protocolHandshake(),doc.helpers.find(x=>x.operation==='protocolHandshake').expected);
 assert.deepEqual(api.default,{name:api.name,inject:api.inject,Config:api.Config,apply:api.apply});
 const row=example('image-missing-source');
 await assert.rejects(tool.execute(typed(row.request)),e=>{assertError(e,row.expectedError);return true;});
 await assert.rejects(painter.call('CreateBuildPlan',example('build-success').request),e=>e.code==='UNSUPPORTED_OPERATION');
});
test('Config refuses unknown, null, empty and unsafe budget settings',async()=>{
 const api=await runtime();
 for(const settings of [{maxBytes:0},{maxPixels:-1},{maxBytes:Infinity},{maxPixels:1.5},{formats:[]},{formats:['png','png']},{formats:['gif']},{formats:null},{extra:true}])
  assert.throws(()=>api.Config(settings),JSON.stringify(settings));
});
