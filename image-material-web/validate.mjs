// Proposal validation for the local development page. Every sample and the
// whole environment (world, session, connection, Catalogue, host facts) is the
// vendored public contracts fixture; nothing here is a real world or model output.
// Validation itself is Painter's unchanged public ValidateBuildProposal entry.
import {readFileSync} from 'node:fs';
import {ExteriorPainterV2, PROPOSAL_OPERATION} from '../src/index.mjs';

const fixture=JSON.parse(readFileSync(new URL('../vendor/hanaworlds-contracts/fixtures/local/main.json',import.meta.url)));
const clone=structuredClone;
const derive=change=>()=>{const request=clone(fixture.request);change(request);return request;};

export const SAMPLES=Object.freeze([
 {id:'valid-stone',label:'合法：一格石头',note:'公开合约 fixture 原样提议：在已知空格放一格 fixture:stone。',build:derive(()=>{})},
 {id:'out-of-bounds',label:'不合法：超出可建范围',note:'把方块的 max.x 改成 2，伸出示例目标区域。',build:derive(r=>{r.proposal.boxes[0].max[0]=2;})},
 {id:'body-blocked',label:'不合法：挡住人物身体',note:'示例环境声明人物身体占在方块要放的位置。',build:derive(r=>{r.regionInspection.bodyOccupiedPositions=[[0,1,3]];})},
 {id:'bad-param2',label:'不合法：param2 超出范围',note:'把材质 param2 改成 256（合约只允许 0–255）。',build:derive(r=>{r.proposal.materials.stone.param2=256;})},
 {id:'unknown-material',label:'不合法：引用未声明材质',note:'方块引用材质名 missing，提议里没有声明它。',build:derive(r=>{r.proposal.boxes[0].materialRef='missing';})},
 {id:'extra-field',label:'不合法：多出合约外字段',note:'请求里多带一个 authorizationRef 字段。',build:derive(r=>{r.authorizationRef='old';})},
 {id:'duplicate-key',label:'不合法：同一项写了两次',note:'提议原文里 proposal 这一项出现了两次，含义不唯一。',build:()=>'{"requestId":"fixture","proposal":{},"proposal":{}}'},
]);

const REASONS={
 BUILD_INVALID:'建筑几何不成立：方块超出可建区域、落在非空格，或挡住了人物需要的空间。',
 SCHEMA_INVALID:'提议格式不合法：有字段的取值或形状不符合公开合约。',
 UNKNOWN_REQUIRED_FIELD:'请求里有合约不允许的多余字段，已拒绝。',
 UNSUPPORTED_MATERIAL:'提议引用了没有声明的材质，无法对应到示例方块目录。',
 CATALOGUE_MISMATCH:'材质不在示例方块目录允许的范围内。',
 NON_CANONICAL_AMBIGUITY:'提议里同一项写了两次，含义不唯一，已拒绝。',
};

export const ENVIRONMENT=Object.freeze({source:'FIXTURE',label:'示例环境 · 公开合约 fixture · 未绑定真实世界',worldRef:fixture.request.worldRef,sessionRef:fixture.request.sessionRef});
const ENV_FIELDS={environment:ENVIRONMENT.label,modelCalls:0,worldWrites:0};

export function listSamples(){return SAMPLES.map(({id,label,note,build})=>{
 const input=build();
 return {id,label,note,proposal:typeof input==='string'?input:JSON.stringify(input.proposal,null,1)};
});}

function summarize(build,buildDigest){
 const cells=build.operations.reduce((n,o)=>n+(o.max[0]-o.min[0]+1)*(o.max[1]-o.min[1]+1)*(o.max[2]-o.min[2]+1),0);
 return {documentId:build.documentId,operations:build.operations.length,cells,declaredBounds:build.declaredBounds,
  materials:Object.entries(build.materials).map(([ref,m])=>`${ref} → ${m.nodeName} · param2 ${m.param2}`),
  witnesses:build.witnesses.map(w=>w.predicate),buildDigest};
}
function rejection(sample,error){
 return {ok:true,sampleId:sample.id,verdict:'REJECTED',code:error.code,reason:error.reason,
  sentence:REASONS[error.code]??`Painter 拒绝了这个提议（${error.code}）。`,mutationState:error.mutationState};
}

/** One validation per click on a fresh Painter, so each result belongs only to that input. */
export async function validateSample(id){
 const sample=SAMPLES.find(s=>s.id===id);
 if(!sample)return null;
 const localFacts={read:async()=>clone(fixture.facts)};
 const painter=new ExteriorPainterV2({localFacts});
 let response;
 try{response=await painter.call(PROPOSAL_OPERATION,sample.build());}
 catch(error){if(!error.publicError)throw error;return {...rejection(sample,error.publicError),...ENV_FIELDS};}
 if(response.error)return {...rejection(sample,response.error),...ENV_FIELDS};
 return {ok:true,sampleId:sample.id,verdict:'ACCEPTED',sentence:'提议通过 Painter 校验，生成了 BUILD/V3 建筑计划（未写世界）。',
  summary:summarize(response.result.build,response.result.buildDigest),...ENV_FIELDS};
}
