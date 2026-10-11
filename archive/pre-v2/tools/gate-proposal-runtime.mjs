// Real fixed Cordis loads installed bytes. All business/provider facts are fixtures.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [installed, app] = process.argv.slice(2);
const file=p=>pathToFileURL(resolve(p));
const pkg=await import(file(`${installed}/src/index.mjs`));
const cordisFile=`${app}/Contents/Resources/hanaworlds-dsh/node_modules/@deepseek-ai/cordis/lib/index.js`;
const {Context}=await import(file(cordisFile));
const fixture=JSON.parse(readFileSync(`${installed}/vendor/hanaworlds-contracts/fixtures/v4/proposal/text-build-proposal.json`));
const ctx=new Context();let calls=0, facts=structuredClone(fixture.facts);
ctx.provide('hanaworldsAuthority',{async verify(body,operation){assert.equal(operation,'ValidateBuildProposal');calls++;return structuredClone(facts);}});
// Deliberately omit LLM/attachments/world/compiler/apply providers.
const load=()=>ctx.plugin(pkg.default,pkg.Config({}));
let fiber=load();
try {
 await fiber.await();const service=ctx.get(pkg.SERVICE);
 assert.equal(service.handshake().contracts,'hanaworlds-contracts@0.3.10');
 assert.ok(service.describe().operations.includes('ValidateBuildProposal'));
 const result=await service.call('ValidateBuildProposal',fixture.request);
 assert.equal(result.error,null);assert.equal(result.result.build.operations[0].materialRef,'stone');
 facts.grantStatus='REVOKED';assert.equal((await service.call('ValidateBuildProposal',fixture.request)).error.code,'AUTHORIZATION_REVOKED');
 await fiber.dispose();assert.equal(ctx.get(pkg.SERVICE),undefined);
 facts=structuredClone(fixture.facts);fiber=load();await fiber.await();
 assert.equal((await ctx.get(pkg.SERVICE).call('ValidateBuildProposal',fixture.request)).error,null);
 console.log(JSON.stringify({evidence:'REAL_CORDIS_OWN_INSTALLED_PACKAGE + FIXTURE_HOST_FACTS',node:process.version,
 installed,version:JSON.parse(readFileSync(`${installed}/package.json`)).version,
 cordisFile,cordisSha256:createHash('sha256').update(readFileSync(cordisFile)).digest('hex'),
 authorityChecks:calls,success:true,revokedReplayRefused:true,disposeRemovedService:true,reenableNewService:true,
 modelCalls:0,worldWrites:0,fullDSHHost:'NOT_RUN',realModel:'NOT_RUN',realUI:'NOT_RUN',realWorld:'NOT_RUN',undo:'NOT_RUN'},null,2));
}finally{await fiber.dispose();}
assert.equal(ctx.get(pkg.SERVICE),undefined);
