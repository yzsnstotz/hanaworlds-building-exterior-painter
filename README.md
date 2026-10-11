# HanaWorlds Building Exterior Painter

C-painter v2 provider: validates confirmed text/image building proposals, calculates
geometry/materials and returns a BUILD plan. It calls no model and writes no world.

`promptText(context)` and `buildMessages(context)` in `src/model.mjs` are pure
skill-facing helpers. Their input is the published `BuildProposalContext`, before
a proposal exists. They carry the world-source Frame (axes, origin, handedness,
grid unit and revision), geometry profile, neutral material tags, legal
orientations and `emptyMaterialRef`. Opaque material extensions are excluded.
Proposal coordinates are component-wise offsets from the inspection's sampled
minimum, matching the validator's translation; no up/horizontal axis is inferred.
Confirmed placement and entrance rules stay bound to that inspection. Image
attachment references become message data only. Skills own model calls and media
resolution; the helpers do not reinstate the archived CreateBuildPlan service.

Contracts are published as an exact tag:
`git+https://github.com/yzsnstotz/hanaworlds-contracts.git#v2.0.0`.
The lock records the release commit; `verify:contracts` checks the tag, installed
version, lock, npm dependency identity and unchanged public handshake.

```sh
npm ci
npm run verify:contracts && npm test
npm run build
node examples/provider-v2.mjs
```

The default suite includes local-world, confirmed placement, site rules,
image-material, material-sources, region-v1 (now the v2 contract shapes) and plugin
provider tests. All image inputs are self-contained fixtures; no asset path or
external model is required. These checks demonstrate component behavior, not a
live-world or owner acceptance result.

## Proposal provider

`apply(ctx)` registers `hanaworldsPainterV2PictureBlocks` and the tool
`hanaworlds_image_material` as Cordis services via `ctx.provide`. Settings use
`@deepseek-ai/schemastery`; `Config({})` is empty because there is no model route.
The tool service exposes the descriptor and `execute(input)`.

```js
const painter = ctx.get('hanaworldsPainterV2PictureBlocks')
const response = await painter.call('ValidateBuildProposal', request, { signal })
const region = await painter.call('ValidateRegionProposal', regionRequest, { signal })
const hint = await ctx.get('hanaworlds_image_material').execute({
  imageBytes, catalogue, currentConnection, materialSources,
})
```

| Operation | Input | Output |
|---|---|---|
| ValidateBuildProposal | painter/v6 ValidateBuildProposalRequest | ValidateBuildProposalResponse with BUILD/V5 or typed refusal |
| ValidateRegionProposal | painter-region/v3 ValidateRegionProposalRequest | ValidateRegionProposalResponse with region-build/v2 or typed refusal |
| hanaworlds_image_material | Uint8Array image + fresh Catalogue + currentConnection + ReadMaterialSources `{snapshot, textures}` | dominant RGB and nearest legal opaque `{materialRef, orientation}` with sourceRevision |

Workshop carries confirmed intent, target facts and the world-source Catalogue.
Painter treats material refs as opaque and reads only neutral tags: passable,
liquid, hazardPerSecond, placeable and orientations. The Catalogue declares
`emptyMaterialRef`; there is no hard-coded empty material or game index.

Host supplies `hanaworldsPainterLocalFacts.read(request, operation, {signal})`.
For build validation it returns BuildProposalProviderFacts; for region validation
it returns LocalRequestFacts. Painter reads current facts before planning and
again before releasing a result or replay. Exact payload replay is preserved;
changed payload, stale facts, cancellation or provider replacement is refused.
No successful receipt is retained after a late refusal.

Per-cell writes require sampled known-empty cells and use the supplied inspection
frame/evidence. Confirmed placement and site rules bind the final effects; hazards
and entrance connectivity are checked from neutral tags. Region proposals retain
region-voxels/v2 blocks unchanged, including materialRef/orientation palette rows;
null runs are UNSPECIFIED and only explicit emptyMaterialRef entries carve.
Loading, world protection, transactions and Undo remain downstream duties.

Public errors retain mutationState NONE and transactionRef null. Contract failures
include SCHEMA_INVALID, INTENT_UNCONFIRMED, TARGET_FACTS_STALE,
SAFETY_INVARIANT_FAILED, CAPABILITY_UNAVAILABLE and named geometry/material/current-context refusals.
The five card-required refusals are tested through object, JSON string and byte
requests with the published v2 response schema; no error is renamed or flattened.
Missing local facts raises CAPABILITY_UNAVAILABLE. Unsupported CreateBuildPlan
raises UNSUPPORTED_OPERATION. The public contract defines the exact error fields.

## Image material tool

`matchCurrentImageMaterials` is the sole image matching entry point and backs
the registered tool. Host supplies the C-world-facts `ReadMaterialSources`
response as `materialSources: {snapshot, textures}` (material-sources/v2), a fresh
Catalogue and `currentConnection: {worldRef, connectionRef, connectionIncarnationRef}`.
The published validator admits connection, Catalogue digest, engine revisions,
sourceRevision, opaque materialRef/orientation, definition revisions and the
typed texture bytes' digests/lengths before decoding. Materials must also pass
the Catalogue's static legality checks. Host owns source reads and live currentness;
Painter consumes the supplied facts without calling a peer. No colour is inferred
from a material name, and no direct RGB-only or built-in palette input remains.

sharp 0.35.3 decodes actual PNG/JPEG/WebP bytes. The dominant colour uses
alpha-weighted 16-bin sRGB channels and a linear-light mean. color-diff 1.4.0
provides CIEDE2000; ties use UTF16 materialRef then numeric neutral orientation.
Source texture colours use an alpha-weighted linear-light mean. Inputs are copied
before decoding awaits. Missing legal colour candidates raise
CAPABILITY_UNAVAILABLE; image errors preserve IMAGE_REQUIRED, IMAGE_DECODE_FAILED,
IMAGE_LIMIT_EXCEEDED or NO_VISIBLE_PIXELS. Every result records zero modelCalls
and worldWrites and is a hint requiring proposal validation.

UNKNOWN or non-placeable materials receive no fallback. Corrupt eligible textures raise
MATERIAL_TEXTURE_UNAVAILABLE. No cross-call colour cache exists. Host must recheck
live selection, provider and media association before using a hint.

`examples/provider-v2.mjs` demonstrates both operations and image matching using
published fixtures and a minimal `readMaterialSources` mock with authored texture
bytes. `examples/mock-facts.mjs` supplies a minimal mutable in-process
facts port for testing stale/cancelled states; it never establishes live facts.

Historical panels, web pages, gates, acceptance documents and the self-invoked
LLM CreateBuildPlan provider are retained in `archive/pre-v2/`, excluded from the
package and active tests. Use commit 0950e39 for their runnable historical checkout.
