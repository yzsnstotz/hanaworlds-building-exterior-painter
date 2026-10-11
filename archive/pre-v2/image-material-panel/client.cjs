window.__ModuleLoader__.load({id:'hanaworlds-painter-image-material-panel',factory:(require)=>{
 const React=require('react'),h=React.createElement,PANEL='hanaworlds-painter-image-material-panel';
 const css=`
 .hw-material{height:100%;overflow:auto;background:var(--background-color,#faf9f6);color:var(--text-color,#252a26);font:14px/1.6 system-ui;padding:36px;box-sizing:border-box}
 .hw-material-inner{max-width:760px;margin:0 auto}.hw-material-kicker{color:#68786c;font-size:12px;letter-spacing:.14em;margin:0 0 8px}.hw-material h1{font-size:30px;line-height:1.2;font-weight:650;margin:0 0 12px}
 .hw-material-intro{color:#6b706b;margin:0 0 26px}.hw-material-drop{border:1px dashed #97a89a;border-radius:14px;background:rgba(133,166,132,.06);padding:32px;text-align:center;cursor:pointer}.hw-material-drop:focus-visible{outline:3px solid #9ebc9d;outline-offset:3px}.hw-material-drop[data-drag=true]{background:#e6eee4;border-color:#547951}
 .hw-material-button{background:#355b3d;color:white;border:0;border-radius:8px;font:inherit;padding:9px 20px;cursor:pointer}.hw-material-button:disabled{opacity:.55;cursor:wait}.hw-material-small{font-size:12px;color:#777f75;margin:12px 0 0}.hw-material-error{background:#fff1ec;color:#913e27;border-radius:10px;padding:14px 18px;margin-top:20px}
 .hw-material-result{margin-top:26px;border:1px solid #dde4db;border-radius:14px;padding:22px}.hw-material-result-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:20px}.hw-material-badge{font-size:12px;background:#f5e9c9;color:#755c24;border-radius:20px;padding:4px 12px}.hw-material-badge.current{background:#e6eee4;color:#355b3d}.hw-material-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:24px}.hw-material-preview{width:100%;height:210px;object-fit:contain;background:repeating-conic-gradient(#eee 0% 25%,#fff 0% 50%) 50%/14px 14px;border-radius:9px}.hw-material-swatch{width:48px;height:48px;border-radius:8px;border:1px solid rgba(0,0,0,.12);flex-shrink:0}.hw-material-row{display:flex;gap:12px;align-items:center;margin:0 0 20px}.hw-material-label{font-size:12px;color:#777f75}.hw-material-value{font-weight:600;overflow-wrap:anywhere}.hw-material-note{font-size:12px;color:#777f75;margin-top:18px}.hw-material-status{margin-top:18px;color:#547951}@media(max-width:620px){.hw-material{padding:22px}.hw-material-grid{grid-template-columns:1fr}.hw-material-result-head{align-items:flex-start}}
 `;
 function Icon(){return h('svg',{viewBox:'0 0 24 24',width:20,height:20,fill:'none',stroke:'currentColor',strokeWidth:1.6,'aria-hidden':true},h('rect',{x:3,y:3,width:18,height:18,rx:4}),h('circle',{cx:8,cy:8,r:1.5}),h('path',{d:'m4 17 5-5 4 4 3-3 4 4'}));}
 const rgb=x=>`rgb(${x.join(',')})`;
 const hex=x=>'#'+x.map(c=>c.toString(16).padStart(2,'0')).join('').toUpperCase();
 function Panel({ctx}){
  const [state,setState]=React.useState({busy:false,error:'',result:null,url:null,filename:''});
  const [drag,setDrag]=React.useState(false);const input=React.useRef(null),generation=React.useRef(0),preview=React.useRef(null);
  React.useEffect(()=>()=>{generation.current++;if(preview.current)URL.revokeObjectURL(preview.current);},[]);
  async function choose(file){
   if(!file)return;const own=++generation.current;
   if(preview.current){URL.revokeObjectURL(preview.current);preview.current=null;}
   setState({busy:true,error:'',result:null,url:null,filename:file.name});
   try{
    if(file.size>33554432)throw Error('图片超过 Painter 的 32 MiB 限制。');
    // FileReader transports original bytes. No renderer colour inference or model call.
    const imageBase64=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=()=>reject(Error('无法读取该文件。'));r.readAsDataURL(file);});
    const sessionId=ctx.sessions.list.getSnapshot().current;
    const method=sessionId?'sessionImage':'sampleImage';
    const response=await ctx.connection.rpc.call('/api',`hanaworldsImageMaterialPanel/${method}`,{args:{imageBase64,...(sessionId?{sessionId}:{})}});
    if(own!==generation.current)return;
    if(ctx.sessions.list.getSnapshot().current!==sessionId)throw Error('当前会话已变化，请重新选择图片。');
    if(!response.ok)throw Error(`Host 未完成请求（${response.error?.code??'连接不可用'}）。`);
    const result=response.value;
    if(!result?.ok)throw Error(result?.reason??'无法完成材质匹配。');
    const url=URL.createObjectURL(file);preview.current=url;
    setState({busy:false,error:'',result,url,filename:file.name});
   }catch(error){if(own===generation.current)setState({busy:false,error:error.message||'无法完成材质匹配。',result:null,url:null,filename:file.name});}
  }
  function swatch(colour,label,value){return h('div',{className:'hw-material-row'},h('div',{className:'hw-material-swatch',style:{background:rgb(colour)},'aria-label':`${label} ${hex(colour)}`}),h('div',null,h('div',{className:'hw-material-label'},label),h('div',{className:'hw-material-value'},value),h('div',{className:'hw-material-label'},hex(colour))));}
  return h('section',{className:'hw-material','aria-label':'图片 → 材质'},h('style',null,css),h('div',{className:'hw-material-inner'},
   h('p',{className:'hw-material-kicker'},'PAINTER · 图片取色'),h('h1',null,'图片 → 材质'),h('p',{className:'hw-material-intro'},'放入一张图片，看看它的主色最接近哪种方块材质。'),
   h('div',{className:'hw-material-drop','data-drag':drag,role:'button',tabIndex:0,'aria-label':'拖入或选择图片',onClick:()=>input.current.click(),onKeyDown:e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();input.current.click();}},onDragOver:e=>{e.preventDefault();setDrag(true);},onDragLeave:()=>setDrag(false),onDrop:e=>{e.preventDefault();setDrag(false);choose(e.dataTransfer.files[0]);}},h('div',null,'把图片拖到这里'),h('p',{style:{margin:'8px 0 16px',color:'#777f75'}},'或从电脑选择一张'),h('button',{type:'button',className:'hw-material-button',disabled:state.busy,onClick:e=>{e.stopPropagation();input.current.click();}},state.busy?'正在匹配…':'选择图片'),h('p',{className:'hw-material-small'},'PNG / JPEG / WebP · 单帧 · 最大 32 MiB / 16777216 像素')),
   h('input',{ref:input,type:'file',accept:'.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp',style:{display:'none'},onChange:e=>{choose(e.target.files[0]);e.target.value='';}}),
   state.busy&&h('p',{role:'status',className:'hw-material-status'},'Host 正在用 Painter 读取像素并匹配材质…'),state.error&&h('p',{role:'alert',className:'hw-material-error'},state.error),
   state.result&&h('div',{className:'hw-material-result'},h('div',{className:'hw-material-result-head'},h('strong',null,state.filename),h('span',{className:`hw-material-badge ${state.result.source==='CURRENT_WORLD'?'current':''}`},state.result.paletteLabel)),h('div',{className:'hw-material-grid'},h('img',{className:'hw-material-preview',src:state.url,alt:`输入图片：${state.filename}`}),h('div',null,swatch(state.result.dominant.rgb,'图片主色',hex(state.result.dominant.rgb)),swatch(state.result.match.rgb,'最接近的合法材质',state.result.material.nodeName),h('div',{className:'hw-material-label'},`param2 = ${state.result.material.param2}`))),state.result.source==='SAMPLE'&&h('p',{className:'hw-material-note'},'示例材质表：VoxeLibre 已测纹理颜色与示例静态节点能力，不代表当前世界。'),state.result.source==='CURRENT_WORLD'&&h('p',{className:'hw-material-note'},'来自当前世界已验证的服务器材质与纹理。')),
   h('p',{className:'hw-material-note'},'同一图片与同一材质来源得到相同结果。此面板不调用模型，也不写入世界。')
  ));
 }
 function apply(ctx){ctx.slots.inject('main',()=>ctx.slots.register({name:'main',key:PANEL},()=>h(Panel,{ctx})));ctx.slots.inject('sidebar.panellist',()=>ctx.slots.register({name:'sidebar.panellist',id:PANEL,order:35,label:()=>'图片 → 材质'},Icon));}
 return {name:PANEL,inject:['slots','connection','sessions'],apply};
}});
