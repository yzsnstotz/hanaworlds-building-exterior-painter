import {TypertRemoteService,Remote} from '@deepseek-ai/dsh-typert-protocol';
import {matchPanelImage} from './engine.mjs';
export const name='hanaworlds-painter-image-material-panel';
export const inject=['typertGateway','sessions'];
export const SERVICE='hanaworldsImageMaterialPanel';
const initializers=[];
export class ImageMaterialPanel extends TypertRemoteService {
 constructor(ctx){super(ctx,SERVICE);for(const init of initializers)init.call(this);}
 sampleImage(imageBase64){return matchPanelImage({imageBase64,session:null,get:()=>null});}
 sessionImage(session,imageBase64){
  const ctx=this.ctx;
  const check=async()=>{
   ctx.invocation?.signal?.throwIfAborted();
   if(ctx.sessions.get(session.id)!==session)throw Object.assign(Error('SESSION_CHANGED'),{code:'SESSION_CHANGED'});
  };
  return matchPanelImage({imageBase64,session,get:key=>ctx.get(key),check});
 }
}
// Invoke the public stage-3 decorator API from plain JavaScript, without forged descriptors.
for(const method of ['sampleImage','sessionImage'])Remote(undefined,{kind:'method',name:method,static:false,private:false,addInitializer:fn=>initializers.push(fn)});
export function apply(ctx){return new ImageMaterialPanel(ctx);}
export default {name,inject,apply};
