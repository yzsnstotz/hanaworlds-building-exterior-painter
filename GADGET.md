# HanaWorlds Building Exterior Painter 0.1.0 candidate

建筑外形画师 / P3 `picture-blocks` / 照片积木.

Status: `PARTIAL / SOURCE+FIXTURE`. This is not a release, deployment or user
`ACCEPTED` receipt. Stage 1 product composition (Shell and Luanti entry, Brush
compile, Canvas apply/readback, naming, history) is a separate later checkpoint.

## What it does

It takes one confirmed `painter/v2` `CreateBuildPlan` request for
`painterId: "picture-blocks"`. The request must carry an image and text bound by
`ReferenceBrief/v2`. The painter sends both together to the DSH host model route,
then returns one of three things:

- a `BUILD/V2` `BuildPlan`;
- a `ClarificationNeed` for the same Session turn;
- a typed painter/v2 error.

It never mutates a world. It never calls Canvas, an Adapter or Brush. It owns no
Session or media store, and it does not perform image-to-3D.

## Public host boundary

The package is a DSH (cordis) plugin. `package.json#dsh.bundle.patch` →
`cordis.patch.yml`; it exports `name`, `inject = []`, `Config` and `apply(ctx)`.

It provides `hanaworldsPainterV2PictureBlocks`, an `ExteriorPainterV2` with:

- `call('CreateBuildPlan', raw)`. `raw` is either UTF-8 bytes/string, which go
  through strict raw admission, or decoded pure JSON. The return value is
  validated by `hanaworlds-contracts/painter/v2` `response()`.
- `describe()`, which returns the painter id, ports, current and default
  settings, fixed invariants and which host services are present.

It consumes these host services. Each one is resolved at every call and is never
cached:

- `hanaworldsAuthority.verify(body, 'CreateBuildPlan')`. This is the same proof
  shape Canvas uses: `current`, the actor/session/authorization refs, and
  `allowedActions`. If `currentWorldRevision` is present it is also used to
  detect a stale target.
- `llm`, the DSH `LlmRuntime`. The painter calls
  `resolveModelInfo(provider, model)` and then a single `stream(...)` with one
  user message containing `[text, image…]` blocks.
- `attachments`, the DSH `AttachmentStore`. Images are passed only as durable
  Core references `{attachmentId: "sha256:<storedBytesDigest>", mediaType,
  bytes, width, height}`. The host adapter projects and reads them. The painter
  never reads, encodes or logs image bytes.

## Settings (visible in the DSH plugin settings through `Config`)

| Setting | Default | Effect |
|---|---|---|
| `modelProvider` | `codex-oauth` | DSH route used for image+text planning |
| `modelId` | `gpt-5.6-luna` | exact model on that route |

These defaults are the worker's choice, not a user decision. The user confirmed
`gpt-5.6-luna` for image understanding. On the DSH OAuth plugin, image input for
that model appears only on the `codex-oauth` route (pi-ai catalogue
`input: ["text","image"]`). The OpenCode Go entry for the same model id is
text-only. There are no other settings, caps, timeouts or retries.

## Fixed invariants (cannot be switched off; listed by `describe()` and in `Config`)

1. No world, Canvas, Adapter or Brush call. The output is a plan, a
   clarification or a typed error.
2. A structure intent requires at least one bound image and non-empty text.
   Without an image the result is `IMAGE_REQUIRED`; without text it is
   `INTENT_UNCONFIRMED`. In both cases the model is not called.
3. The route's resolved model must declare image input. A text-only route is
   refused (`PainterHostError MODEL_UNAVAILABLE/ROUTE_NOT_IMAGE_CAPABLE`). The
   painter never lets the host replace the image with a text placeholder.
4. Written cells must be sampled known-empty cells. An occupied cell is never
   replaced (`BUILD_INVALID`). An unknown or unsampled cell is never written
   (`TARGET_FACTS_INCOMPLETE`).
5. Only static catalogue materials are offered and accepted: no callbacks, no
   persistent state, and an allowed `param2`. Anything else is
   `UNSUPPORTED_MATERIAL`.
6. Entrance connectivity applies when the safety profile sets
   `requireEntranceConnectivity`. It is recomputed only from bound facts: the
   final state, the catalogue, the hazard policy and the actual avatar size
   (`unit: "node"`; any other unit is `TARGET_FACTS_INCOMPLETE`).
   - A usable cell is one whose whole avatar clearance box
     (ceil width × height × depth) is passable: `walkable: false`, no collision
     box, and within the hazard policy.
   - The interior is a cavity, following CONTRACT_RULES ("天空不冒充室内").
     Treat the confirmed entrance planes as temporarily sealed and find each
     6-connected group of passable cells. A group counts as interior only if
     none of its cells borders an open side. An open side is a cell outside the
     sampled facts (sky or outside the world) or an unknown cell. Occupied
     cells count as solid sides and are never passable.
   - A roofless or leaking enclosure therefore has no interior. Every confirmed
     portal must reach usable interior cells by a six-neighbour usable path;
     otherwise the result is `BUILD_INVALID`.
   - No confirmed portal gives `INTENT_UNCONFIRMED`. A portal missing from the
     target facts gives `TARGET_FACTS_INCOMPLETE`.
   - Each portal produces an `ENTRANCE_CONNECTIVITY` witness. The HAZARD
     witness also covers every entrance use and path cell.
   - The clearance-only rule (no floor-support predicate) is the worker's
     engineering reading of the contract's x-rules.
7. PROTECTION and BODY_CLEARANCE witnesses require provider-verified evidence.
   Missing evidence is a typed rejection, never a default "safe" claim.
8. Replay: a request with the same `sessionRef + requestId` and the exact same
   payload returns the original domain response. Current authorization is
   checked first. A changed payload is `REPLAY_MISMATCH`. Host failures are not
   recorded, so they can be retried.

Validation order (contract `validationOrder`): raw decode → authorization →
replay → digests → turn/intent confirmation → media binding → catalogue/target
source and revision → model → geometry/materials → safety witnesses.

## Known gaps, reported to the PM (run-private BLOCKER_REPORT.md)

- **CONTRACT_GAP-EXT-01.** `painter/v2` gives the painter no provider-verified
  protection or body-occupancy evidence (`EvidenceBinding`), but BUILD/V2
  requires PROTECTION and BODY_CLEARANCE witnesses that are "verified from
  trusted Adapter output".
- **CONTRACT_GAP-EXT-02.** `painter/v2` carries only `targetFacts.frameDigest`,
  but `BuildProjection.coordinateFrame` needs the full `Frame`.
- **EXT-03 (observation).** The `CreateBuildPlan` failure codes contain no
  model or capability code. Host model failures are therefore raised as
  `PainterHostError` with a contract-shaped `publicError` and a stable
  `hostCode`, rather than disguised as a domain error.

Because of EXT-01/02, a request that passes every validation up to geometry
currently ends in `TARGET_FACTS_INCOMPLETE / REQUIRED_FACT_UNKNOWN`. The
assembly code (`assembleBuild`) is complete. FIXTURE tests show that, given
trusted facts, its BUILD passes `validateType('BuildProjection')`,
`validateWitnessCoherence`, the painter/v2 response schema and the BUILD/V2
`BuildDocument` request schema. That is FIXTURE evidence only.

## Build, test, package

```sh
npm ci --ignore-scripts      # isolated HOME and npm cache
npm run build
npm test
npm pack --ignore-scripts
```

`private: true` guards against registry publication. The runtime dependencies
are registry packages only: `canonicalize@5.1.0` and
`@deepseek-ai/schemastery@3.18.2`. There are no `file:` paths and no sibling
checkouts.

Contracts supply is vendored. DSH installs plugins with pnpm 11, and pnpm 11
refuses URL or git subdependencies by default (`ERR_PNPM_EXOTIC_SUBDEP`). This
was observed when installing the earlier commit d31ad83 into a clean profile.
`hanaworlds-contracts` is not on a registry. The painter therefore imports an
unmodified subset of the admitted 0.2.1 bytes from `vendor/hanaworlds-contracts/`
through package `imports` (`#contracts`, `#contracts/painter/v2`,
`#contracts/BUILD/V2`). Every vendored file's sha256 is pinned in `VENDOR.json`
and checked by `npm test`. This is the worker's engineering choice and is
reported to the PM.

## Install, rollback, residue

Install into an isolated DSH profile through the supported DSH plugin command
(pnpm underneath), from the public task branch:
`dsh plugin --profile <p> add github:yzsnstotz/hanaworlds-building-exterior-painter#<commit>`.
Uninstall with `dsh plugin --profile <p> remove hanaworlds-building-exterior-painter`.

The painter keeps no files. Its only state is in-memory invocation receipts.
Uninstalling therefore leaves no painter residue in the profile and touches no
world, Session or media data. Rollback means removing `0.1.0` and restoring the
prior plugin set. This is the first version, so the prior set is "absent".

## Licenses

HanaWorlds-owned source is MIT. Third-party licenses are kept as-is; see
`NOTICE` and `LICENSE_AUDIT.md`.
