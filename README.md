# HanaWorlds Building Exterior Painter

建筑外形画师 / P3 `picture-blocks` (照片积木) for HanaWorlds Stage 1. It is a DSH
plugin that validates confirmed text proposals through `painter/v4` and returns
`BUILD/V3` plans. It also retains image-plus-text planning and clarification.
Both paths consume Canvas-relayed `regionInspection`; neither mutates a world.

See [GADGET.md](GADGET.md) for the host boundary, settings, invariants, known
contract gaps, and the install and rollback steps. Licensing: MIT for
HanaWorlds-owned source; see [NOTICE](NOTICE) and
[LICENSE_AUDIT.md](LICENSE_AUDIT.md).

One pure `MatchImageMaterials` tool also decodes real PNG/JPEG/WebP bytes and
suggests the nearest indexed legal block material. It calls no model and writes
no world; see GADGET.md for measured palette provenance and current-world limits.
