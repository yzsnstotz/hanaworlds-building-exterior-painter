// Published v2 contract fixtures are example data, never live world evidence.
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import { apply, buildMessages } from '../src/index.mjs';
import { contractFixture, contracts } from '../src/contract-package.mjs';
import { mockFacts } from './mock-facts.mjs';
const main=contractFixture('main'),region=contractFixture('region').proposalRequest;
const regionFacts={currentContext:region.localContext,sessionRef:region.sessionRef,currentTurnRevision:region.turnRevision,
 currentBriefDigest:region.referenceBriefDigest,requestState:'ACTIVE',replay:'NEW',priorRequestDigest:null};
const mock=mockFacts({buildFacts:main.facts,regionFacts});
// Minimal Cordis registry: both services are registered even without image facts.
const services=new Map([['hanaworldsPainterLocalFacts',mock.port]]);
const painter=apply({get:name=>services.get(name),provide:(name,value)=>services.set(name,value)});
const imageTool=services.get('hanaworlds_image_material');
// A skill can build its input from the published context before proposing boxes.
// These helpers neither invoke a model nor read attachments/world state.
const prompt=buildMessages(main.facts.sourceContext);
assert.equal(prompt.messages[0].content[0].type,'text');
assert.match(prompt.system,/materialRef/);
const build=await painter.call('ValidateBuildProposal',main.request);
const regionBuild=await painter.call('ValidateRegionProposal',region);
assert.equal(build.error,null);assert.equal(regionBuild.error,null);
contracts.validateBuildProposalResponse(main.request,build);contracts.validateRegionProposalResponse(region,regionBuild);
const material=main.request.proposal.materials.stone;
const imageBytes=await sharp(Buffer.from([180,20,20,255]),{raw:{width:1,height:1,channels:4}}).png().toBuffer();
// Minimal C-world-facts ReadMaterialSources mock: authored fixture bytes and
// opaque refs, never a live source read or a material-name colour heuristic.
const catalogue=main.request.catalogue;
const currentConnection={worldRef:'fixture-world',connectionRef:'fixture-connection',connectionIncarnationRef:'fixture-incarnation'};
const bytesDigest=createHash('sha256').update(imageBytes).digest('hex');
const projection={profileVersion:'material-sources/v2',connection:currentConnection,
 catalogueDigest:contracts.digestValue('catalogue',catalogue).sha256,
 engineRevisions:catalogue.engineRevisions,sourceBasis:'WORLD_SOURCE_ASSET_ONLY',
 materials:[{availability:'KNOWN',...material,definitionRevision:catalogue.materials[material.materialRef].definitionRevision,
  texture:{textureName:'fixture.png',sourceKind:'GAME',sourceRef:'fixture-game/textures/fixture.png',
   interpretation:'SIMPLE_UNIFORM_NODE_TILES',mediaType:'image/png',bytesDigest,byteLength:imageBytes.length}}]};
const mockSource={async readMaterialSources(worldRef){
 assert.equal(worldRef,currentConnection.worldRef);
 return {snapshot:{...structuredClone(projection),sourceRevision:contracts.digestValue('material-sources',projection).sha256},
  textures:[{bytesDigest,bytes:new Uint8Array(imageBytes)}]};
}};
const materialSources=await mockSource.readMaterialSources(currentConnection.worldRef);
contracts.validateMaterialSources(materialSources,catalogue,currentConnection);
await assert.rejects(imageTool.execute({imageBytes,catalogue,currentConnection}),
 error=>error.code==='CAPABILITY_UNAVAILABLE' && error.mutationState==='NONE');
const hint=await imageTool.execute({imageBytes,catalogue,currentConnection,materialSources});
assert.equal(hint.match.distance,0);
console.log(JSON.stringify({build:build.result.build.contractVersion,region:regionBuild.result.build.contractVersion,
 material:hint.material,mockReads:mock.state.reads,modelCalls:0,worldWrites:0},null,2));
