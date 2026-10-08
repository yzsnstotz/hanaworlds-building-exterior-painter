import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {matchPanelImage} from '../image-material-panel/engine.mjs';

const require=createRequire(import.meta.url);
const asset=(relative)=>readFileSync(new URL(relative,import.meta.url));
const assets=new Map([
 ['/image',['text/html; charset=utf-8',asset('./index.html')]],
 ['/web-host.js',['text/javascript; charset=utf-8',asset('./web-host.js')]],
 ['/client.cjs',['text/javascript; charset=utf-8',asset('../image-material-panel/client.cjs')]],
 ['/react.js',['text/javascript; charset=utf-8',readFileSync(new URL('./umd/react.production.min.js',pathToFileURL(require.resolve('react'))))]],
 ['/react-dom.js',['text/javascript; charset=utf-8',readFileSync(new URL('./umd/react-dom.production.min.js',pathToFileURL(require.resolve('react-dom'))))]],
]);
const maxJsonBytes=Math.ceil(33554432/3)*4+4096;
function json(response,status,value){response.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});response.end(JSON.stringify(value));}
function readBody(request){return new Promise((accept,reject)=>{
 const chunks=[];let size=0,failed=false;
 request.on('data',chunk=>{
  if(failed)return;size+=chunk.length;
  if(size>maxJsonBytes){failed=true;chunks.length=0;reject(Object.assign(Error('IMAGE_LIMIT_EXCEEDED'),{status:413}));return;}
  chunks.push(chunk);
 });
 request.on('end',()=>{if(!failed)accept(Buffer.concat(chunks).toString('utf8'));});
 request.on('error',reject);
});}

export function createImageWebServer(){return createServer(async(request,response)=>{
 try{
  const expectedHost=`127.0.0.1:${request.socket.localPort}`;
  // 127.0.0.1 and localhost both name this machine; anything else is refused (DNS rebinding).
  const okHosts=[expectedHost,expectedHost.replace(/^127\.0\.0\.1:/,'localhost:')];
  if(!okHosts.includes(request.headers.host))return json(response,403,{ok:false,code:'LOCAL_HOST_REQUIRED'});
  if(request.headers.origin&&!okHosts.map(h=>`http://${h}`).includes(request.headers.origin))return json(response,403,{ok:false,code:'SAME_ORIGIN_REQUIRED'});
  const path=new URL(request.url,`http://${expectedHost}`).pathname;
  if(request.method==='GET'&&path==='/'){
   response.writeHead(302,{Location:'/image'});return response.end();
  }
  if(request.method==='GET'&&assets.has(path)){
   const [type,bytes]=assets.get(path);
   response.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'"});
   return response.end(bytes);
  }
  // A copied link with trailing text still lands on the right page.
  if(request.method==='GET'&&!path.startsWith('/api/')){
   response.writeHead(302,{Location:path.startsWith('/validate')&&assets.has('/validate')?'/validate':'/image'});return response.end();
  }
  if(path!=='/api/image')return json(response,404,{ok:false,code:'NOT_FOUND'});
  if(request.method!=='POST')return json(response,405,{ok:false,code:'POST_REQUIRED'});
  if(!request.headers['content-type']?.startsWith('application/json'))return json(response,415,{ok:false,code:'JSON_REQUIRED'});
  let input;
  try{input=JSON.parse(await readBody(request));}catch(error){return json(response,error.status??400,{ok:false,code:error.status?'IMAGE_LIMIT_EXCEEDED':'INVALID_JSON'});}
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='imageBase64'))return json(response,400,{ok:false,code:'IMAGE_INPUT_REQUIRED'});
  // The local development page has no world binding. Reuse Painter via its existing UI engine.
  return json(response,200,await matchPanelImage({imageBase64:input.imageBase64}));
 }catch(error){
  console.error('Painter image web request failed:',error.message);
  if(!response.headersSent)json(response,500,{ok:false,code:'IMAGE_WEB_FAILED'});
  else response.end();
 }
});}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const server=createImageWebServer();
 server.on('error',error=>{console.error(error.message);process.exitCode=1;});
 server.listen(47603,'127.0.0.1',()=>console.log('Painter image page ready: http://127.0.0.1:47603/image · 示例材质表'));
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>server.close(()=>process.exit()));
}
