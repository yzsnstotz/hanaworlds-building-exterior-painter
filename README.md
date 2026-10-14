# HanaWorlds Building Exterior Painter

C-painter v3 provider: validates confirmed text/image building proposals, calculates
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

The runtime owns the 192 projections from the complete C-painter v3 document
approved in D-148. `verify:contracts` checks the full reviewed document SHA and
all compiled projection bytes. Neither development nor production installs a
contract SDK. The runtime compiles owned validators/schema and records actual
source/output hashes plus the document identity in `dist/build-source.json`.
Normal settings, sharp, color-diff and canonicalize stay external dependencies.
Host/Cordis/React are never bundled. Historical schema/fixture notices remain
attributed; regression input JSON is development-only and excluded from packing.

The only public runtime export remains the root package. Public input/output
shapes are documented in C-painter; consumers do not need a contract package.
Both coherent session/v5 + ReferenceBrief/v5 and session/v6 + ReferenceBrief/v6
are accepted. Mixed pairs and the wrong digest byte domain are refused. V6
confirmation, complete retained/current contexts and currentConfirmation travel
through the existing caller-supplied facts seam; Painter does not acquire a new
source service, storage permission, model route or world writer.

```sh
npm ci
npm run verify:contracts && npm test
npm run build
npm run test:package-boundary
npm pack
npm run example
```

Development installs include the exact Node 24.13.1 binary as a devDependency;
normal npm scripts select it through npm's local executable PATH. The project
`.npmrc` uses the standard `${HOME}/.npm` global user cache for installation and
packing, without modifying user configuration. No shell runtime alias or manual
cache export is needed. Node is excluded from the production dependency graph.

The default suite includes local-world, confirmed placement, site rules,
image-material, material-sources, region-v1 (the retained original wire shapes) and plugin
provider tests. All image inputs are self-contained fixtures; no asset path or
external model is required. These checks demonstrate component behavior, not a
live-world or owner acceptance result.

`build`, `prepack` and `test` all include the real-tarball boundary gate. It checks
all packed runtime artifacts and export targets, then installs the actual tgz in
a fresh consumer using Node 24 and pnpm 11.28.5 defaults. It loads every public
runtime entry, validates both proposal operations, registers the image tool and
decodes actual images using sharp/CIEDE2000 without a runtime SDK. All locked full-value tests and original component
gates also run against the installed artifact with retained development fixtures. Negative tgz cases must actually fail installation, loading or inspection.
No dependency policy relaxation, approval whitelist or ignored install scripts
is used. Receipts and fresh consumers default to a unique OS temporary directory outside
the source tree. `PAINTER_BOUNDARY_EVIDENCE` can choose another directory outside
development trees; consumers must never inherit a development `node_modules`.
The nested pack performs the normal source verification/rebuild; an exclusive active receipt with a nonce, exact workspace and live parent ancestry
terminates only the repeated boundary gate. An externally set legacy marker never
skips the gate. Exact artifact inventory rejects leftover fixture/source files. Corrupt negative
packages have no lifecycle build because rebuilding would repair the injected fault.

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

The region tool describes `origin`/`size` as current-world grid coordinates under
`geometryProfile: voxel-grid/v1`. Each palette row is `{materialRef, orientation}`;
carve selects the Catalogue's `emptyMaterialRef` with a source-declared orientation.
The published projection retains its `WORLD_NODE` coordinate-space wire value.
The provider example supplies opaque region refs and nonzero orientations, with
a minimal local-facts mock; it exercises fill, explicit carve and UNSPECIFIED cells.

Owned planning errors retain mutationState NONE and transactionRef null.
The exact documented carried source errors retain all seven fields including
UNKNOWN/transaction/cause/retry/phase; unrecognized or opaque errors retain the
original exception identity. Own error branches do not grant source permissions. Contract failures
include SCHEMA_INVALID, INTENT_UNCONFIRMED, TARGET_FACTS_STALE,
SAFETY_INVARIANT_FAILED, CAPABILITY_UNAVAILABLE and named geometry/material/current-context refusals.
The five card-required refusals are tested through object, JSON string and byte
requests with the published v3 response projection; no error is renamed or flattened.
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
before decoding awaits. An omitted, undefined or null `materialSources`, or a
validated source with no legal colour candidates, raises CAPABILITY_UNAVAILABLE
before image decoding. The tool remains registered without a source, and each
call must supply current facts; a previous call never supplies a fallback.
Supplied malformed or stale source facts retain their published contract errors.
With eligible source materials, image errors preserve IMAGE_REQUIRED, IMAGE_DECODE_FAILED,
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

## Image budgets

`Config({})` retains maxBytes=33554432, maxPixels=16777216 and
formats=['png','jpeg','webp']. Optional maxBytes/maxPixels are positive safe
integers; formats is a nonempty unique subset of those formats. Settings affect
only one Painter instance and its registered image tool. Main images and KNOWN
textures use the same effective budget; visible tool limits show those values.
Actual typed byte inputs are copied before asynchronous sharp decoding. Missing
sources, unknown keys and malformed/stale facts are rejected with the complete
original documented errors. No missing colour or world-specific palette is inferred.

Component and installed-artifact evidence does not claim persistent human
confirmation, independent source readback, live-world/UI or owner acceptance.
Those existing product gates remain separate.
