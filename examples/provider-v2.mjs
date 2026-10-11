// Published v2 contract fixtures are example data, never live world evidence.
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { ExteriorPainterV2, buildMessages } from '../src/index.mjs';
import { contractFixture, contracts } from '../src/contract-package.mjs';
import { mockFacts } from './mock-facts.mjs';
const main=contractFixture('main'),region=contractFixture('region').proposalRequest;
const regionFacts={currentContext:region.localContext,sessionRef:region.sessionRef,currentTurnRevision:region.turnRevision,
 currentBriefDigest:region.referenceBriefDigest,requestState:'ACTIVE',replay:'NEW',priorRequestDigest:null};
const mock=mockFacts({buildFacts:main.facts,regionFacts});
const painter=new ExteriorPainterV2({localFacts:mock.port});
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
const hint=await painter.matchImageMaterials({imageBytes,catalogue:main.request.catalogue,
 materialColours:[{...material,rgb:[180,20,20]}]});
assert.equal(hint.match.distance,0);
console.log(JSON.stringify({build:build.result.build.contractVersion,region:regionBuild.result.build.contractVersion,
 material:hint.material,mockReads:mock.state.reads,modelCalls:0,worldWrites:0},null,2));
