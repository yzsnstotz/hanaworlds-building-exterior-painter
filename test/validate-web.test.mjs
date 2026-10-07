import test from 'node:test';
import assert from 'node:assert/strict';
import {createImageWebServer} from '../image-material-web/server.mjs';

test('standalone HTTP validates labelled fixture proposals through Painter and keeps /image',async t=>{
 const server=createImageWebServer();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>server.close(resolve)));
 const base=`http://127.0.0.1:${server.address().port}`;
 const page=await fetch(base+'/validate');
 assert.equal(page.status,200);
 assert.match(await page.text(),/示例数据 · 示例环境/);
 assert.equal((await fetch(base+'/image')).status,200);
 const list=await (await fetch(base+'/api/validate/samples')).json();
 assert.equal(list.ok,true);assert.match(list.environment,/fixture/);
 const call=sampleId=>fetch(base+'/api/validate',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({sampleId})}).then(r=>r.json());
 const expected={'valid-stone':'ACCEPTED','out-of-bounds':'BUILD_INVALID','body-blocked':'BUILD_INVALID','bad-param2':'SCHEMA_INVALID',
  'unknown-material':'UNSUPPORTED_MATERIAL','extra-field':'UNKNOWN_REQUIRED_FIELD','duplicate-key':'NON_CANONICAL_AMBIGUITY'};
 assert.deepEqual(list.samples.map(s=>s.id),Object.keys(expected));
 // rejected → valid again: each verdict belongs only to the current sample
 for(const id of [...Object.keys(expected),'valid-stone']){
  const result=await call(id);
  assert.equal(result.sampleId,id);assert.equal(result.modelCalls,0);assert.equal(result.worldWrites,0);
  if(expected[id]==='ACCEPTED'){
   assert.equal(result.verdict,'ACCEPTED');
   assert.equal(result.summary.operations,1);assert.equal(result.summary.cells,1);
   assert.deepEqual(result.summary.witnesses,['COVERAGE','BODY_CLEARANCE','HAZARD']);
  } else {
   assert.equal(result.verdict,'REJECTED');assert.equal(result.code,expected[id]);
   assert.equal(result.mutationState,'NONE');assert.ok(result.sentence.length>0);
  }
 }
 const unknown=await fetch(base+'/api/validate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sampleId:'nope'})});
 assert.equal(unknown.status,404);
 const foreign=await fetch(base+'/api/validate',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://different.example'},body:'{}'});
 assert.equal(foreign.status,403);
});
