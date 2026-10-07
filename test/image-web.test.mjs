import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createImageWebServer} from '../image-material-web/server.mjs';

const require=createRequire(new URL('../image-material-panel/package.json',import.meta.url));
const sharp=require('sharp');

test('standalone HTTP serves the original panel and accepts real image bytes',async t=>{
 const server=createImageWebServer();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>server.close(resolve)));
 const base=`http://127.0.0.1:${server.address().port}`;
 const page=await fetch(base+'/image');
 assert.equal(page.status,200);
 assert.match(await page.text(),/示例材质表/);
 const client=await fetch(base+'/client.cjs');
 assert.equal(await client.text(),await readFile(new URL('../image-material-panel/client.cjs',import.meta.url),'utf8'));
 const bytes=await sharp({create:{width:2,height:2,channels:3,background:{r:141,g:94,b:83}}}).png().toBuffer();
 const response=await fetch(base+'/api/image',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({imageBase64:bytes.toString('base64')})});
 assert.equal(response.status,200);
 const result=await response.json();
 assert.equal(result.ok,true);assert.equal(result.source,'SAMPLE');
 assert.equal(result.paletteLabel,'示例材质表');
 assert.equal(result.modelCalls,0);assert.equal(result.worldWrites,0);
 const rejected=await fetch(base+'/api/image',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://different.example'},body:'{}'});
 assert.equal(rejected.status,403);
});
