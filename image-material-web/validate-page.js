// Browser side of the proposal validation page: chooses a sample and shows the
// server's Painter verdict. No validation logic here.
const $=id=>document.getElementById(id);
let samples=[],selected=null,pending=0;

function text(tag,value,className){const node=document.createElement(tag);node.textContent=value;if(className)node.className=className;return node;}
function clearResult(){const result=$('result');result.className='';result.replaceChildren();}
function select(id){
 selected=samples.find(s=>s.id===id)??null;
 $('proposal').textContent=selected?selected.proposal:'—';
 $('validate').disabled=!selected;
 pending++;clearResult(); // a result always belongs to the sample shown above it
}
function show(value){
 const result=$('result');clearResult();
 if(!value.ok){result.className='failed';result.append(text('h2','无法校验'),text('p',`服务返回 ${value.code}。`));return;}
 const accepted=value.verdict==='ACCEPTED';
 result.className=accepted?'accepted':'rejected';
 const sample=samples.find(s=>s.id===value.sampleId);
 result.append(text('h2',accepted?'通过':'拒绝'),text('p',value.sentence));
 const rows=[['样例',sample?.label??value.sampleId],['环境',value.environment]];
 if(accepted){
  const s=value.summary;
  rows.push(['建筑文档',s.documentId],['操作数',String(s.operations)],['方块格数',String(s.cells)],
   ['范围',`${JSON.stringify(s.declaredBounds.min)} → ${JSON.stringify(s.declaredBounds.max)}`],
   ['材质',s.materials.join('；')],['安全见证',s.witnesses.join('、')],['计划摘要',s.buildDigest.slice(0,16)+'…']);
 } else rows.push(['错误码',`${value.code} · ${value.reason}`],['世界变化',value.mutationState==='NONE'?'无':value.mutationState]);
 rows.push(['模型调用 / 写世界',`${value.modelCalls} / ${value.worldWrites}`]);
 const list=document.createElement('dl');
 for(const [k,v] of rows)list.append(text('dt',k),text('dd',v));
 result.append(list);
}
async function validate(event){
 event.preventDefault();
 if(!selected)return;
 const ticket=++pending,button=$('validate');button.disabled=true;
 try{
  const response=await fetch('/api/validate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sampleId:selected.id})});
  const value=await response.json();
  if(ticket===pending)show(value);
 }catch(error){if(ticket===pending)show({ok:false,code:`NETWORK_ERROR: ${error.message}`});}
 finally{button.disabled=!selected;}
}
async function start(){
 $('form').addEventListener('submit',validate);
 const box=$('samples');
 try{
  const response=await fetch('/api/validate/samples');
  const value=await response.json();
  if(!value.ok)throw Error(value.code);
  samples=value.samples;
  if(value.environment)$('fixture-banner').dataset.environment=value.environment;
 }catch(error){box.textContent=`样例读取失败：${error.message}`;return;}
 box.replaceChildren(...samples.map(s=>{
  const label=document.createElement('label'),input=document.createElement('input'),body=document.createElement('span');
  input.type='radio';input.name='sample';input.value=s.id;input.addEventListener('change',()=>select(s.id));
  body.append(text('strong',s.label),text('small',s.note));label.append(input,body);return label;
 }));
 box.querySelector('input').checked=true;select(samples[0].id);
}
document.addEventListener('DOMContentLoaded',start);
