import sharp from 'sharp';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=process.env.PAINTER_TEST_PACKAGE??resolve(new URL('..',import.meta.url).pathname);
export const base=JSON.parse(readFileSync(resolve(root,'vendor/hanaworlds-contracts/fixtures/local/main.json'))).request.catalogue;
export function catalogueFixture(){return {...base,nodes:{
 'mcl_colorblocks:concrete_red':structuredClone(base.nodes['fixture:stone']),
 'mcl_colorblocks:concrete_blue':structuredClone(base.nodes['fixture:stone']),
}};}
export async function imageFixture(format='png',rgb=[255,0,0]) {
 const raw=Buffer.from([...rgb,255,...rgb,255,...rgb,255,0,0,255,255]);
 return sharp(raw,{raw:{width:2,height:2,channels:4}})[format]().toBuffer();
}
