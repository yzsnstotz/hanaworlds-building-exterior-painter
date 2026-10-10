# License audit · hanaworlds-building-exterior-painter 0.7.0

| Component | Version | License | Source | Use | Copied into this repo? |
|---|---|---|---|---|---|
| HanaWorlds Exterior Painter source (`src/`, `test/`, `tools/`) | 0.7.0 | MIT | this repository | plugin | original work |
| hanaworlds-contracts | ^1.1.0-rc.1 (released tags; lock resolves 1.1.0-rc.1 @ a1e6790f) | MIT (own LICENSE/NOTICE preserved; canonicalize external Apache-2.0 dependency) | github.com/yzsnstotz/hanaworlds-contracts | root painter/v5, painter-region/v2, ReferenceBrief/v4, confirmed-placement/v1 functions (incl. validateCreateBuildPlanRequest/Response), BUILD/V4, SiteRules/safetyProfileFromConfirmedIntent, region-voxels/v1 validation, digests and ProtocolHandshake; public fixtures main, skill-site-rules and confirmed-placement in tests | no: external dependency by semver range on released tags; verify:contracts checks the range and handshake |
| canonicalize | 5.1.0 | Apache-2.0 | npm / github.com/erdtman/canonicalize | JCS for replay identity | no (dependency) |
| @deepseek-ai/schemastery | 3.18.2 | MIT | npm / github.com/deepseek-ai/deepseek-harness | visible DSH Config schema | no (dependency) |
| @deepseek-ai/cosmokit | 1.8.5 | MIT | npm / deepseek-harness | transitive | no |
| @standard-schema/spec | 1.1.0 | MIT | npm / standard-schema | transitive | no |

Runtime host services (`llm`, `attachments`) come from the user's DSH installation
(@deepseek-ai/dsh-llm and @deepseek-ai/dsh-attachment, MIT). The model provider
plugin (e.g. dsh-coding-subscription-oauth 0.8.5, Apache-2.0 + NOTICE) is installed
separately by the user. Neither is bundled, copied or modified.

Old P3 / structure-painter source was not copied. No third-party code is presented
as MIT. No incompatibility found.

| sharp | 0.35.3 | Apache-2.0 | github.com/lovell/sharp | raster decode only | external dependency, not copied |

Sharp native prebuilt packages and their bundled libvips/dependency notices remain
external dependencies. Exact platform packages and SPDX metadata are retained in
package-lock.json and the installed gate license inventory. No game texture image
is shipped in this npm package: the measured numeric index and source associations
come from HanaWorlds-owned prior picture-blocks code, with source/texture hashes.
The actual texture input is preserved only as a labelled verification input/E.
