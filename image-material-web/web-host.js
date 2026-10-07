// Browser host for the unchanged same-origin App panel. No pixel computation here.
window.__ModuleLoader__={load(definition){
 const plugin=definition.factory(name=>{
  if(name==='react')return window.React;
  throw Error(`Unsupported local module: ${name}`);
 });
 let render;
 const ctx={
  sessions:{list:{getSnapshot:()=>({current:null})}},
  connection:{rpc:{async call(path,method,payload){
   if(path!=='/api'||method!=='hanaworldsImageMaterialPanel/sampleImage')throw Error('此开发网页仅提供示例材质表。');
   const response=await fetch('/api/image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload.args)});
   const result=await response.json();
   return {ok:response.ok,value:result,error:response.ok?undefined:{code:result.code}};
  }}},
  slots:{inject(_name,register){register();},register(options,component){if(options.name==='main')render=component;}},
 };
 plugin.apply(ctx);
 if(!render)throw Error('图片面板未注册。');
 window.ReactDOM.createRoot(document.getElementById('panel')).render(window.React.createElement(render));
}};
