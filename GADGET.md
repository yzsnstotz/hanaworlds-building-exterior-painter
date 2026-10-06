# HanaWorlds Building Exterior Painter 0.3.1 · local world

The plugin implements `painter/v4.ValidateBuildProposal` and retains image
`CreateBuildPlan`. Both emit `BUILD/V3` plans (image planning can clarify).
Painter never compiles, decides a transaction, reads or writes the world.
Canvas decides transactions, Brush compiles purely, Adapter transports.

## Public entry and host facts

`hanaworldsPainterV2PictureBlocks.call('ValidateBuildProposal', request, {signal})`
accepts the root API's strict `ValidateBuildProposalRequest`. Only `proposal`
contains model geometry. Workshop supplies the confirmed brief and bounded
context; understanding/clarification belong to the skill. This entry calls no
LLM or attachment service and reuses the existing pure geometry and BUILD code.

Host binds the internal `hanaworldsPainterLocalFacts.read(request, operation,
{signal})` port. For ValidateBuildProposal return public
`BuildProposalProviderFacts` `{sourceContext,currentContext,requestFacts}`.
For CreateBuildPlan return public `LocalRequestFacts`. Workshop's source context
must be captured before generation; the host reads current turn, brief, actual
transport incarnation and Canvas world selection from their owning services.
No permissions, actors, grants or INSPECT facts are read. Never manufacture a
current connection incarnation or copy request fields as alleged live facts.
No provider facts are accepted from model requests or call options.

Painter runs the public current-context/proposal checks before planning and
re-reads them after awaits before release, including its existing plan receipt
cache. Cancellation, changed world/incarnation/selection/brief and provider
replacement reject stale output. Missing host facts are CAPABILITY_UNAVAILABLE;
no default grant or context exists. Request-shape, geometry, bounds, material,
body and hazard errors are typed no-mutation outcomes. Coverage,
BODY_CLEARANCE, HAZARD and required entrance witnesses use the new digest domain.
PROTECTION and protected clearance are absent.

Receipts are ephemeral plan receipts, never durable transaction history. A public
RETURN_STORED instruction requires an existing stored receipt and never triggers
replanning. Workshop/Canvas own durable confirmed state and transaction storage.
Host must bind this business port when assembling the new peer set; a component
fixture gate does not prove that full Host integration.

## Pinned bytes and settings

The whole published 20-file contracts0.4.0 package is vendored unmodified:
source `8cfb18f8e13aa33d7a942f230ec6117914322cdd`, npm tar SHA256
`d7b22e76de5e161abe7525596df608b3f00445fb4237808941cb5ef8328e9bc4`.
Root API only; no `/v4` binding or prior wire compatibility. Regenerate/check:
`node tools/vendor-contracts.mjs [--check] --package <final0.4.0.tgz>`.
VENDOR.json records per-file SHA256. Never edit generated vendor bytes.

Config/describe retain modelProvider `openai-codex`, modelId `gpt-5.6-luna` and
read-only geometry invariants. Only the image path uses that route; image+text
and a capable resolved model remain required. Image planning and optional fixed
orchestration remain available; this component gate does not freeze them.
The service/class names remain stable; their requests now accept only new wires.

## Evidence

`npm test` / `npm run test:local-world` run the normal proposal and core new
boundaries. `tools/gate-local-world.sh` archives a committed source, checks vendor,
builds, tests, packs, installs in an independent consumer and loads the installed
plugin in actual fixed Cordis. External business facts are public fixtures.
Real model, full DSH Host, GUI/world/Undo are NOT_RUN. This never grants product
PASS, TO_TEST or owner ACCEPTED. Prior route/admission and unchanged geometry
gates are reused. Old test files/tools remain unchanged in source/Git, runnable
at 8e96b57441a697f79a2cda17e8acb6538814630e with their protected old artifact;
old permission, replay/concurrency and expanded negative matrices are deferred,
not current npm-test requirements. Historical report/evidence remain protected.

## One image material tool (0.3.1)

The registered Painter service exposes `matchImageMaterials({imageBytes, catalogue})`
and root exports `matchImageMaterials`, `IMAGE_MATERIAL_TOOL`, `ImageMaterialError`.
This is an own-plugin computation method, not a new frozen painter/v4 operation.
Host binds one skill tool `MatchImageMaterials` using this public descriptor:
resolve the actual attachment bytes for the current brief and obtain the current
public Catalogue, then call the method. Do not accept model-provided RGB/palette
facts, URLs or local file paths. Host must correlate the result to that brief
before using it. Workshop download/attachment and full Host binding are external.

The tool accepts only non-empty Uint8Array PNG/JPEG/WebP raster bytes, at most
32MiB and 16,777,216 pixels, one frame. sharp0.35.3 decodes oriented sRGB RGBA,
without resize. Dominant colour uses 16 bins per channel, alpha-byte weight,
largest-weight bin and lowest packed bin on a tie. Its representative RGB is the
winning-bin alpha-weighted linear-light mean. Oklab distance uses the original
picture-blocks palette transform; exact distance ties use UTF16 node name then
smallest legal param2. Results are immutable and contain actual image dimensions,
format/SHA, dominant colour, Catalogue digest, palette digest/provenance, selected
material RGB/texture SHA/distance and count of legal materials with unknown colour.
The returned `{nodeName,param2}` is a material hint for existing proposal.materials;
ValidateBuildProposal/Brush/Canvas remain mandatory. No BUILD/world transaction
is produced here, and neither old CreateBuildPlan nor any model is called.

The original picture-blocks palette-data.ts at db87d6f8 has **63** actual rows,
despite an old comment saying64. `tools/build-material-palette.mjs` remeasured all
63 actual VoxeLibre0.92.3 textures in linear light, preserving existing node/texture
associations and per-texture hashes. It does not guess RGB from names. This index
is explicitly measured from that source; public Catalogue has no texture/RGB
fields and cannot prove that today's world uses those same textures. Colours for
other games/nodes remain UNKNOWN. There is no default invented colour/palette,
no new special-block whitelist, and static legality uses existing offeredMaterials
and validateStaticMaterials. Subsequent geometry/safety checks still apply.

Missing bytes -> IMAGE_REQUIRED; unsupported/corrupt decode -> IMAGE_DECODE_FAILED;
all-transparent -> NO_VISIBLE_PIXELS; no indexed static legal material ->
NO_LEGAL_MATERIAL. No fallback model, forced material or world write occurs.
`npm run test:image-material` requires PAINTER_IMAGE_TEXTURE pointing at actual
protected default_stone.png bytes. `tools/gate-image-material.sh` archives the
exact commit, executes only these5 affected tests, packs/installs independently,
and runs the new method in actual fixed Cordis with external public Catalogue
fixtures. Historical text/geometry/route/admission gates are not rerun.
