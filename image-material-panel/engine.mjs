// Same-origin UI adapter only. All pixel and matching algorithms live in Painter 0.6.0 (unchanged since 0.4.0).
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {matchImageMaterials,matchCurrentImageMaterials} from 'hanaworlds-building-exterior-painter';
const require=createRequire(import.meta.url);
const painterEntry=pathToFileURL(require.resolve('hanaworlds-building-exterior-painter'));
const palette=JSON.parse(readFileSync(new URL('./material-palette.json',painterEntry)));
const limits={maxBytes:33554432}; // existing Painter input limit, unchanged
const sampleNode={walkable:true,collisionBoxes:[[-0.5,-0.5,-0.5,0.5,0.5,0.5]],liquidType:'none',damagePerSecond:0,lightSource:0,param2Type:'none',allowedParam2:[0],hasCallbacks:false,hasPersistentState:false,definitionRevision:'sample-static-node-1',unknownFields:[]};
const sampleCatalogue={profileVersion:'catalogue/v2',engineProfile:'SAMPLE_ONLY',gameId:'sample-voxelibre-palette',gameRevision:palette.source.revision,modRevisions:{sample:'sample-static-capabilities-1'},nodes:Object.fromEntries(palette.entries.map(e=>[e.nodeName,structuredClone(sampleNode)]))};
const reasons={
 IMAGE_REQUIRED:'请选择一张 PNG、JPEG 或 WebP 图片。',
 IMAGE_DECODE_FAILED:'无法读取这张图片，请选择有效的单帧 PNG、JPEG 或 WebP 文件。',
 IMAGE_LIMIT_EXCEEDED:'图片超过 Painter 的 32 MiB 或 16777216 像素限制。',
 NO_VISIBLE_PIXELS:'图片完全透明，没有可识别的颜色。',
 MATERIAL_SOURCES_UNAVAILABLE:'当前世界尚未提供可用的合法材质与纹理。',
 CURRENT_WORLD_MISMATCH:'当前世界已变化，请重新选择图片。',
 HOST_MATERIAL_CONTEXT_UNAVAILABLE:'Host 的当前世界材质读取入口不可用。',
 SESSION_CHANGED:'当前会话已变化，请重新选择图片。',
 MATERIAL_SOURCES_SUPPLIER_REPLACED:'当前材质来源已变化，请重新选择图片。',
};
function fail(code){throw Object.assign(Error(code),{code});}
function imageBytes(base64){
 if(typeof base64!=='string'||!base64.length)fail('IMAGE_REQUIRED');
 if(base64.length>Math.ceil(limits.maxBytes/3)*4)fail('IMAGE_LIMIT_EXCEEDED');
 if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64))fail('IMAGE_DECODE_FAILED');
 const bytes=Buffer.from(base64,'base64');
 if(bytes.toString('base64')!==base64)fail('IMAGE_DECODE_FAILED');
 return new Uint8Array(bytes);
}
const same=(a,b)=>a&&b&&['worldRef','connectionRef','connectionIncarnationRef','selectionRevision'].every(k=>a[k]===b[k]);
export async function matchPanelImage({imageBase64,session,get,check=async()=>{}}){
 try{
  const bytes=imageBytes(imageBase64);let hint,source,paletteLabel;
  if(session){
   const business=get('hanaworldsSkillBusiness');
   if(typeof business?.bound!=='function')fail('HOST_MATERIAL_CONTEXT_UNAVAILABLE');
   await check();
   if(await business.bound(session)){
    const catalogues=get('hanaworldsCatalogue');
    if(typeof business.local!=='function'||typeof business.materialSources!=='function'||typeof catalogues?.read!=='function')fail('HOST_MATERIAL_CONTEXT_UNAVAILABLE');
    const local=await business.local(session,check);
    const catalogue=await catalogues.read(local.worldRef);
    const current=await business.materialSources(session,{worldRef:local.worldRef,catalogue},check);
    hint=await matchCurrentImageMaterials({imageBytes:bytes,materialSources:current.sources,catalogue:current.catalogue,currentConnection:current.connection});
    await check();
    if(get('hanaworldsSkillBusiness')!==business||get('hanaworldsCatalogue')!==catalogues)fail('MATERIAL_SOURCES_SUPPLIER_REPLACED');
    if(!same(local,await business.local(session,check)))fail('CURRENT_WORLD_MISMATCH');
    // Re-read through the same Host boundary after asynchronous decode; no private provider access.
    const fresh=await business.materialSources(session,{worldRef:local.worldRef,catalogue},check);
    if(fresh.sources.snapshot.sourceRevision!==current.sources.snapshot.sourceRevision)fail('MATERIAL_SOURCES_SUPPLIER_REPLACED');
    source='CURRENT_WORLD';paletteLabel='当前世界材质';
   }
  }
  if(!hint){hint=await matchImageMaterials({imageBytes:bytes,catalogue:sampleCatalogue});source='SAMPLE';paletteLabel='示例材质表';}
  await check();
  return {ok:true,...hint,source,paletteLabel};
 }catch(error){
  const code=typeof error?.code==='string'?error.code:typeof error?.message==='string'?error.message.split(':')[0]:'IMAGE_MATERIAL_FAILED';
  return {ok:false,code,reason:reasons[code]??`无法完成材质匹配（${code}）。`};
 }
}
