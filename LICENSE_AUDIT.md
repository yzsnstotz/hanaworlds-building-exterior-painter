# License audit · hanaworlds-building-exterior-painter 0.1.0

| Component | Version | License | Source | Use | Copied into this repo? |
|---|---|---|---|---|---|
| HanaWorlds Exterior Painter source (`src/`, `test/`) | 0.1.0 | MIT | this repository | plugin | original work |
| hanaworlds-contracts | 0.2.1 @ 5ecfce1b | MIT | github.com/yzsnstotz/hanaworlds-contracts | painter/v2, ReferenceBrief/v2, BUILD/V2 validation and digests | no (dependency) |
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
