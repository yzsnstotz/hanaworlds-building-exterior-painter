# HanaWorlds Building Exterior Painter 0.2.0 candidate (exterior-v4)

建筑外形画师 / P3 `picture-blocks` / 照片积木.

Status: `PARTIAL / SOURCE+FIXTURE` until independent review and admission. This
is not a release, deployment or user `ACCEPTED` receipt. Stage 1 product
composition (Workshop, Shell/Luanti entry, Canvas apply/readback, naming,
history) is a separate later checkpoint, and S1-02 product readiness is UNPROVEN.

## What it does

It takes one confirmed `painter/v3` `CreateBuildPlan` request for
`painterId: "picture-blocks"`. The request must carry an image and text bound by
`ReferenceBrief/v2`. The painter sends both together to the DSH host model route,
then returns one of three things:

- a `BUILD/V2` `BuildPlan`;
- a `ClarificationNeed` for the same Session turn;
- a typed painter/v3 error.

For a **first new building**, Workshop relays the Adapter-produced, Canvas-recorded
`regionInspection` (targetFacts `source: REGION_INSPECTED`, profile
`target-facts/v3`). The painter uses it as its only trusted input:

- `BUILD.coordinateFrame` = `regionInspection.frame`;
- the PROTECTION and BODY_CLEARANCE witnesses carry `regionInspection.evidence`.
  Their protected/body lists are the region lists restricted to the written
  positions; an overlap is refused;
- the entrance goes on the footprint face whose outward normal is
  `regionInspection.entranceFacing`.

It never mutates or inspects a world. It never chooses or relocates a placement:
every write must be a known-empty cell of the relayed footprint. It never calls
Canvas, an Adapter or Brush, owns no Session or media store, and does not perform
image-to-3D.

## Public host boundary

The package is a DSH (cordis) plugin. `package.json#dsh.bundle.patch` →
`cordis.patch.yml`; it exports `name`, `inject = []`, `Config` and `apply(ctx)`.

It provides `hanaworldsPainterV2PictureBlocks`, an `ExteriorPainterV2` with:

- `call('CreateBuildPlan', raw)`. `raw` is either UTF-8 bytes/string, which go
  through strict raw admission, or decoded pure JSON. The return value is
  validated by `hanaworlds-contracts` v4 `painter/v3` `response()`.
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
  Core references `{attachmentId: <media.attachmentRef>, mediaType, bytes,
  width, height}`. The attachment store owns media authorization and integrity.
  (0.1.0 additionally required `attachmentRef = "sha256:"+storedBytesDigest`.
  That was a worker-only rule and is removed in 0.2.0, because the approved
  painter/v3 chain uses a non-content-address ref.) The host adapter projects and reads them. The painter
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
   - A usable (use or path) cell is one whose whole avatar clearance box
     (ceil width × height × depth) is verified empty air in the final state,
     and air must satisfy the hazard policy. A non-air node is never empty,
     even if it is passable (for example `walkable: false` with no collision).
   - The interior is a cavity, following CONTRACT_RULES ("天空不冒充室内").
     Treat the confirmed entrance planes as temporarily sealed, then flood
     6-adjacently from usable cells through every cell that is not a proven
     collision. A proven collision is a final node with `walkable: true` or a
     non-empty `collisionBoxes`.
   - The flood passes through non-colliding non-air nodes (plants, vines,
     liquids) and through nodes whose collision is unknown, because sky and
     the outside leak through them.
   - A component counts as interior only if the flood never reaches an
     unknown or unsampled cell.
   - A roofless or leaking enclosure therefore has no interior. Every confirmed
     portal must reach usable interior cells by a six-neighbour usable path;
     otherwise the result is `BUILD_INVALID`.
   - No confirmed portal gives `INTENT_UNCONFIRMED`. A portal missing from the
     target facts gives `TARGET_FACTS_INCOMPLETE`.
   - Each portal produces an `ENTRANCE_CONNECTIVITY` witness. The HAZARD
     witness also covers every entrance use and path cell.
   - The clearance-only rule (no floor-support predicate) is the worker's
     engineering reading of the contract's x-rules.
7. First building (REGION_INSPECTED). The relayed `regionInspection` must be
   coherent with the request: same facts and digest, frame digest equal to
   `targetFacts.frameDigest`, same world. This is checked by contracts v4
   `validateBoundRequest`; a mismatch is `TARGET_FACTS_STALE/validate/REVISION_CHANGED`.
   The frame and evidence are copied unchanged, never defaulted.
   - REGION_INSPECTED facts without a `regionInspection` are
     `TARGET_FACTS_INCOMPLETE`.
   - A frame whose `transformRevision` is not the evidence revision, or
     evidence for another world revision, is `SCHEMA_INVALID`.
   - Interior on region facts is `TARGET_REQUIRED/validate/SCOPE_DENIED`.
   - Entrance facing (HW-A028, painter side): a doorway is a usable cell on a
     side face of the structure footprint, 4-adjacent to a usable cell strictly
     inside it. A structure with a usable interior must have a doorway on the
     `entranceFacing` face and none on any other side; otherwise
     `BUILD_INVALID`. A structure without a usable interior (for example a
     solid block) has no entrance. This definition is worker judgment; see
     CONTRACT_GAP-EXT-V4-02.
8. PROTECTION and BODY_CLEARANCE witnesses require provider-verified evidence.
   In painter/v3 only the region inspection supplies it. INSPECTED facts carry
   none, so they remain a typed `TARGET_FACTS_INCOMPLETE`.
9. PLANNED facts are `TARGET_REQUIRED/validate/REQUIRED_FACT_UNKNOWN`, because
   painter/v3 carries no proof of a real preceding plan (CONTRACT_GAP-EXT-V4-01).
   This matches the approved `INV-INITIAL-PLANNED`.
10. Replay: a request with the same `sessionRef + requestId` and the exact same
   payload returns the original domain response. Current authorization is
   checked first. A changed payload is `REPLAY_MISMATCH`. Host failures are not
   recorded, so they can be retried.

Validation order (contract `validationOrder`): raw decode with domain rules →
authorization → replay → painter-scoped digests → turn/intent confirmation →
media binding → catalogue → target source and revision → regionInspection
binding (`validateBoundRequest`, v4) → model → geometry/materials → entrance
rules → safety witnesses.

## Known gaps and observations (run-private evidence/CONTRACT_GAPS.md)

- **CONTRACT_GAP-EXT-V4-01.** A real preceding plan cannot be verified, so every
  PLANNED request is refused.
- **CONTRACT_GAP-EXT-V4-02.** There is no approved definition of "entrance" for
  a portal-less region footprint. The worker rule is described above.
  `requireEntranceConnectivity` on region facts stays `TARGET_FACTS_INCOMPLETE`.
- **Host errors.** The `CreateBuildPlan` failure codes contain no model or
  capability code. Host model failures are therefore raised as
  `PainterHostError` with a contract-shaped `publicError` and a stable
  `hostCode`, rather than disguised as a domain error.

The sealed 0.1.0 gaps EXT-01/02 (no trusted evidence or Frame) are closed for
first buildings by painter/v3 `regionInspection`.

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
refuses URL or git subdependencies (`ERR_PNPM_EXOTIC_SUBDEP`). The admitted
`hanaworlds-contracts@0.3.0` is pinned to public git `e827357` and pack
`47a2e5cc…8f5c` (923 entries) in `tools/admitted-contracts.mjs`.
`vendor/hanaworlds-contracts/` holds an unmodified subset of that pack: the
import closure of the `dist/v4` entries used here, license and notice files, and
three fixtures. Each file's sha256 is recorded in `VENDOR.json`.

- `npm test` checks the vendored bytes offline.
- `node tools/vendor-contracts.mjs --check` (network) re-downloads the pinned
  source, repacks it, requires `47a2e5cc`/923, and compares every vendored file.
- Imports go through package `imports`: `#contracts` → `dist/v4/index.mjs`,
  `#contracts/painter/v3`, `#contracts/BUILD/V2`.
- Admitted Brush 0.2.0 uses the same vendoring approach (it vendors the full
  pack).

## Install, rollback, residue

Install into an isolated DSH profile through the supported DSH plugin command
(pnpm underneath), from the public task branch:
`dsh plugin --profile <p> add github:yzsnstotz/hanaworlds-building-exterior-painter#<v4 commit>`.
Uninstall with `dsh plugin --profile <p> remove hanaworlds-building-exterior-painter`.

The painter keeps no files. Its only state is in-memory invocation receipts.
Uninstalling therefore leaves no painter residue in the profile and touches no
world, Session or media data. Rollback means removing `0.2.0` and restoring the
prior plugin set. Per ROLLBACK_AND_RECOVERY (rc.7 version pairing), the painter
rolls back together with the whole contracts@0.3.0 consumer set to the 0.2.1 set,
which pins the Exterior source to the sealed candidate `a3156fc`. Mixing a 0.2.1
and a 0.3.0 peer fails the ContractHandshake with `UNSUPPORTED_VERSION`.

## Licenses

HanaWorlds-owned source is MIT. Third-party licenses are kept as-is; see
`NOTICE` and `LICENSE_AUDIT.md`.
