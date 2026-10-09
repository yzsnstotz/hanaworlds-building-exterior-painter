# HanaWorlds Building Exterior Painter 0.6.1 · painter/v6 · painter-region/v3 region proposals

The plugin implements `painter/v6.ValidateBuildProposal` and retains image
`CreateBuildPlan`. Both emit `BUILD/V4` plans (image planning can clarify).
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
site-rule and hazard errors are typed no-mutation outcomes. Coverage,
BODY_CLEARANCE, HAZARD and required entrance witnesses use the new digest domain.
PROTECTION and protected clearance are absent.

## Site rules (contracts major 1)

Rules come only from the player-confirmed intent (`ConfirmedIntent.siteRules`,
skill-proposed): the carried SafetyProfile must equal
`safetyProfileFromConfirmedIntent(intent)` (otherwise INTENT_UNCONFIRMED), on the
proposal and the image path, before any model call.
- No player geometry is read: no `bodyOccupiedPositions`, no `avatarDimensions`, no
  early body-overlap check. Real bodies are checked inside the engine; BODY_CLEARANCE
  binds the written positions only.
- Entrance rules run only when the confirmed rules require an entrance, sized by the
  confirmed `entranceClearance` (a design value, not a body guarantee). A confirmed
  portal must exist in the bound facts (none is produced today → named
  TARGET_FACTS_INCOMPLETE). With no confirmed portal the entrance is the doorway on the
  `regionInspection.entranceFacing` side (no doorway on another face) and its
  ENTRANCE_CONNECTIVITY witness has `portalRef: null` and `clearance` = confirmed.
- Passage needs proven Catalogue facts (CONTRACT_RULES: a cavity/path forms only on
  facts that prove collision passability): an unknown (null) capability is never
  passable for `air` and never seals a cavity for other nodes. A refusal caused only
  by unknown capabilities (the same plan would pass with them resolved favourably) is
  `TARGET_FACTS_INCOMPLETE/REQUIRED_FACT_UNKNOWN`, naming the missing fact;
  `BUILD_INVALID` means the geometry fails regardless (0.5.3).
- Hazards are checked against the confirmed values; no enum, no default.
- A stated `optionalLightRule` is refused by capability name `painter/v6:light-rule`
  (CAPABILITY_UNAVAILABLE/REQUIRED_FACT_UNKNOWN) at Painter admission and again at
  the witness recheck before a BUILD is released; the same rules with no light rule
  plan normally.
- Region proposals (`painter-region/v3`): the contract refuses a required entrance
  (`painter-region/v3:entrance-rule`) and a light rule, and checks hazards per palette node.

## Confirmed placement (contracts 2.x, confirmed-placement/v1; 0.6.0, model input 0.6.1)

A placement shown to the player before confirmation is a contract `PlacementProposal`
(`Controls.placement` = `ConfirmedIntent.placement`, digest-bound by Workshop). Painter does
not make, choose, move or clip it; it only refuses a plan whose effects are not the confirmed
ones. `null` (nothing structured was confirmed) keeps the CURRENT_VIEW behaviour unchanged.
- ValidateBuildProposal: the contract request/context validators run on the fresh Host facts
  before planning and again before release (also on replay): the build must use exactly the
  placement's source inspection (World, frame, world revision, inspection id, facts digest) and
  the computed effect set must equal the exact cells (all and only) or lie inside the confirmed
  extent. Painter's released BUILD has the same operations and COVERAGE positions.
- CreateBuildPlan (model path): Painter applies the same public functions itself
  (`confirmedPlacementOf`, `requirePlacementSource` before any model call,
  `requirePlacementTarget` on the planned effects). Since 0.6.1 the model input carries the
  confirmed target as `confirmedPlacement` in the same local grid as `region` (exact `cells`
  or extent `bounds`, with its rule text), taken only from the contract value after the source
  check; without a confirmed placement the model input is byte-identical to 0.6.0. A model plan
  that still writes other cells is refused, never re-based.
- ValidateRegionProposal (`painter-region/v3`): the block's specified world cells are matched
  by the contract.
- Refusals are the contract's named failures (`confirmedPlacement.namedFailures`, e.g.
  `PLACEMENT_TARGET_MISMATCH` = INTENT_UNCONFIRMED/INVALID_GEOMETRY): a new proposal and a new
  human confirmation are needed. Known-empty, body, hazard, entrance and size/material rules are
  unchanged and still apply.

Tests: `npm run test:confirmed-placement` (public `fixtures/confirmed-placement` per-cell and
region cases through the real service, plus Painter-local re-sourced extent, retained-context,
replay, stale-confirmation and CreateBuildPlan cases).

Tests: `npm run test:site-rules` (public `fixtures/skill-site-rules` cases applied to
`fixtures/main` with rebound digests, plus a Painter-local hut region).

Receipts are ephemeral plan receipts, never durable transaction history. A public
RETURN_STORED instruction requires an existing stored receipt and never triggers
replanning. Workshop/Canvas own durable confirmed state and transaction storage.
Host must bind this business port when assembling the new peer set; a component
fixture gate does not prove that full Host integration.

## Pinned bytes and settings

Contracts are released hanaworlds-contracts tags by range, no vendor copy and no
commit pin: dependency `git+https://github.com/yzsnstotz/hanaworlds-contracts.git#semver:^2.0.0-rc.1`
(candidate v2.0.0-rc.1, confirmed-placement/v1; after the formal v2.0.0 only the range becomes `^2.0.0`; npm
resolves the highest matching tag and package-lock records the resolved commit). The advertised
ContractHandshake is the resolved package's own; peers compare its major only.
Code, tests, fixtures and the dev page reach it only through the package.json
`#contracts` imports (`src/contract-package.mjs`); the range lives in
`tools/admitted-contracts.mjs`. Check: `npm run verify:contracts [-- --package <tgz>]`
(range spec, `npm ls` satisfaction, handshake; optional byte equality). Raise the
floor only when Painter starts using a field from a newer release.
Root API only; no prior wire (painter/v5, painter-region/v2, contracts 1.x) compatibility.

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

## Current-world image material consumer (0.3.2)

The service `hanaworldsPainterV2PictureBlocks` and root export expose:

```js
const hint = await painter.matchCurrentImageMaterials({
  imageBytes,       // actual Uint8Array for the Host-verified brief attachment
  materialSources,  // contracts MaterialSources (unchanged in 0.5.0) {snapshot, textures}
  catalogue,        // fresh public Catalogue matching that source
  currentConnection: {worldRef, connectionRef, connectionIncarnationRef},
})
// hint.material = {nodeName, param2}; use in the existing proposal materials.
```

`describe().tools` advertises exactly one current tool,
`CURRENT_IMAGE_MATERIAL_TOOL` (`MatchCurrentImageMaterials`). This is an own pure
method, not an added painter/v5 wire operation. Host reads public NativeFacts,
checks current selection/provider/Catalogue, and calls this method with actual
media bytes. The consumer itself rereads no peer, file, path, URL, model or world.
It synchronously validates Catalogue and calls `validateMaterialSources` before
any await, acquiring validated copies of the texture bytes. Connection has the
three contract fields above; selectionRevision belongs to Host and is not passed
as an extra MaterialSourceConnection field. Host must recheck its live selection,
brief, provider identities and Catalogue after this await before releasing the
hint. Matching cannot prove that supplied facts are still live or that an
attachment belongs to a Session; those remain public supplier/Host duties.

Only KNOWN source rows which pass `validateStaticMaterials` are candidates.
KNOWN does not fill missing callbacks/state/param2 facts. UNKNOWN rows and
static-ineligible variants are counted in `hint.sources` and never get a colour.
No static index, base:* alias or default colour is consulted. Missing legal
candidates throws `ImageMaterialError` with code `MATERIAL_SOURCES_UNAVAILABLE`.
Corrupt/transparent/over-limit or mediaType-mismatched eligible texture bytes
throw `MATERIAL_TEXTURE_UNAVAILABLE`; no partial colour or fallback hint is
returned. Input image errors retain IMAGE_REQUIRED/IMAGE_DECODE_FAILED/
IMAGE_LIMIT_EXCEEDED/NO_VISIBLE_PIXELS. Contract errors retain their precise
world/Catalogue/sourceRevision/byte integrity code.

Image decoding, dominant bins, Oklab transform and limits reuse the existing
pixel functions below. Each simple uniform texture uses the existing alpha
weighted linear-light mean. Distance is Euclidean Oklab, exact ties use contract
UTF16 node order then numeric param2 order. Per-call duplicate texture digests
are measured once within the validated sourceRevision; there is no cross-call
cache. Changing source bytes/revision cannot reuse a historical colour.

Frozen results include actual image hash/dimensions/format, dominant colour,
material, measured match RGB/Oklab/distance and its public texture provenance,
sourceRevision, catalogueDigest, connection, gameId/gameRevision, sourceBasis,
source counts and zero modelCalls/worldWrites. `SERVER_ASSET_ONLY` is the source
baseline; it does not promise client texture-pack appearance. No BUILD, geometry,
transaction, planner, model, renderer or write happens here. Original proposal
geometry source remains unchanged and downstream validation remains mandatory.

`npm run test:material-sources` runs only seven new affected tests.
`tools/gate-current-image-material.sh <full-source-sha> <fresh-E-dir> <fixed-App> <actual-texture>`
archives source, verifies the exact 0.4.2 vendor, builds, runs these tests,
packs/independently installs 0.3.2, repeats them and loads the actual installed
plugin in real Cordis. Public Catalogue/MaterialSources/Host media association
are explicit fixtures, including the binding of preserved real texture bytes.
Actual current product game, Host/App/model/world/Undo and REAL_UI are NOT_RUN.
Protected 0.3.0 text and 0.3.1 image artifacts/E are not overwritten or retested.

## Historical measured-index method (protected 0.3.1)

The registered Painter service exposes `matchImageMaterials({imageBytes, catalogue})`
and root exports `matchImageMaterials`, `IMAGE_MATERIAL_TOOL`, `ImageMaterialError`.
This is an own-plugin computation method, not a new frozen painter/v5 operation.
This retained historical method is not advertised by describe().tools in 0.3.2.
It must not be used as the current-world material consumer. Its old descriptor says:
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

## Region proposal: painter-region/v2 ValidateRegionProposal (0.4.0; v2 since 0.5.0)

Same service and same Host business port as text/image proposals:
`hanaworldsPainterV2PictureBlocks.call('ValidateRegionProposal', request, {signal})`
with the contract's strict `ValidateRegionProposalRequest` (raw bytes or
decoded JSON). The text/image path (`proposal.mjs`, `planner.mjs`,
`local-context.mjs`, image modules) is unchanged.

- Admission is the contract's `validateRegionProposalRequest`: region-voxels/v1
  block in world node coordinates, `X_FASTEST_THEN_Y_THEN_Z`, canonical runs,
  `null` = UNSPECIFIED (never written, never carve), carve only explicit
  `{nodeName:"air",param2:0}`, `ignore` and all-null refused, overflow-safe
  extent, and every palette entry (air included) a known static Catalogue node
  with an allowed param2. Intent/brief/Catalogue digests are bound.
- Painter adds: confirmed BUILD_STRUCTURE intent for this turn and world, brief
  of the same Session/turn, `localContext.worldRef === worldRef`.
- Host `hanaworldsPainterLocalFacts.read(request, 'ValidateRegionProposal',
  {signal})` returns public `LocalRequestFacts`; Painter applies
  `validateCurrentRequest('painter-region/v2', ...)` before planning and again
  before release, so a changed world, connection incarnation, selection, turn,
  brief (including verified image media) or cancellation refuses the result.
- Result: `RegionBuildPlan` whose `build` is `region-build/v1` with the proposal
  block unchanged, `declaredBounds = regionBlockBox(block)`, document
  `region-<invocationId>`, digest domain `region-build`; checked by
  `validateRegionProposalResponse`. Same requestId + same payload replays after
  fresh facts; a changed payload is REPLAY_MISMATCH.
- Not Painter's: whether cells are loaded/known (Adapter `ReadRegion` +
  `requireKnownRegion`), snapshot/extras restore, transaction and whole-region
  Undo (Canvas). No model, attachment, compiler or world call.

`protocolHandshake()` returns the contract `ProtocolHandshake`:
painter 4.0 and painter-region 1.0, capability
`painter-region/v2:validate-region-proposal`, package version as provenance
only. Consumers decide with `checkProtocolCompatibility` (same major, minor,
capabilities); a different patch or artifact digest is still compatible, a
wrong major or missing capability is refused. The exact-package
`handshake()`/ContractHandshake now advertises contracts@0.5.0; fixed K1/K2
candidates keep their own pinned 0.3.x/0.4.2 packages.

`describe().tools` self-describes `ValidateRegionProposal` (purpose, typical
scale in cells, preconditions). Choosing region vs per-box proposals is the
skill's decision; Painter sets no size threshold.
