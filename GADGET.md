# HanaWorlds Building Exterior Painter 0.2.2 · controlled text proposal

The plugin retains the original image `CreateBuildPlan` path and adds public
`painter/v3.ValidateBuildProposal`. Both return plans; Painter never compiles,
commits, reads or writes the world. Canvas owns transactions, Brush compilation
and Adapter transport remain separate origins.

## Public entry

`hanaworldsPainterV2PictureBlocks.call('ValidateBuildProposal', request, {signal})`
accepts the strict public `ValidateBuildProposalRequest` from admitted contracts
0.3.10. Only `proposal` is model geometry: BUILD/materials/ordered local boxes.
The trusted caller assembles the confirmed brief/context and authentic facts;
model tools must not accept identities, grants, frame or witnesses from JSON.
Text media must be empty. Skill handles understanding and clarification.

The new entry reuses parseProposal, planGeometry, planEntrances,
checkEntranceFacing and assembleBuild. It invokes no llm or attachments service.
A valid response is the public BUILD plan envelope. Shape/digest/world/brief,
region bounds/materials/known-empty/protection/body/hazard and entrance errors
are typed NONE/null-transaction rejections. Unrecoverable malformed raw identity
raises a ContractError rather than inventing a requestId.

## Host provider obligation

The existing trusted `hanaworldsAuthority.verify(request, operation, {signal})`
port must return public `BuildProposalProviderFacts` for ValidateBuildProposal.
This is a provider-side host capability, not a model argument. Its implementation
must authenticate the exact Workshop service/invocation, capture source context
before generation, obtain the live Session/incarnation and original game grant,
INSPECT action and fresh current context from actual public providers. Returning
a coherent JSON object alone does not authenticate these facts.

Painter checks the public context helper initially and after awaits before result
or replay release. It also refuses local abort, authority replacement and changed
original binding/caller during one call. Full payload equality includes proposal
materials and ordered boxes. In-flight conflicting payloads cannot reserve the
same Session/incarnation/requestId. Receipts are in-memory plan receipts, not
world/transaction authorization or durable Workshop history. Caller must preserve
its durable confirmed context and independently validate results before applying.
No facts or permission are accepted from call options.

## Current advertisement and dependencies

The registered service exports exactly contracts0.3.10 ContractHandshake and
advertises both operations. Consumers of the new entry use the public
checkBuildProposalHandshake. This origin update does not repin other origins or
the parallel fixed default0.3.9 chain, and adds no old-peer/profile adapters.

The unmodified 30-file contracts import/profile/fixture/license subset is derived
from admitted source e66800964726b951a300eb9377b74c318641417f, actual npm tar
SHA256 8624bd026815fcdafc5248b21d8bc611baa0569b7b492b66905d2d015a496ce1
(1,031 package entries). Regenerate/check via
`node tools/vendor-contracts.mjs [--check] --package <admitted0.3.10.tgz>`.
VENDOR.json lists every copied byte's SHA. Never edit generated vendor files.

## Visible settings and retained capabilities

modelProvider defaults openai-codex, modelId gpt-5.6-luna. They affect only the
original image-model path; that path requires bound image+text and an image-capable
resolved route. Config and describe expose these settings and fixed invariants.
The text-proposal path uses no model route. Existing image planning, geometry,
clearance, entrance connectivity/face, materials and BUILD assembly remain.
Freeze fixed orchestration as optional only after the real skill closed loop;
this component fixture gate does not trigger that decision.

## Evidence and boundaries

`npm run test:proposal` exercises the new entry and affected current handshake
and vendor integrity. `tools/gate-proposal.sh` archives a committed source,
checks exact admitted vendor bytes, packs/installs a fresh package, then exercises
the installed entry and real Cordis provider lifecycle. Authority/LLM/media,
world and Workshop facts are fixtures. Actual model/DSH full Host/GUI/world writes
and Undo are NOT_RUN; current source/package/framework checks confer no product
PASS, TO_TEST or owner ACCEPTED. Prior route gate and admission are not rerun.
