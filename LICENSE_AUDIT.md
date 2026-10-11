# License audit · hanaworlds-building-exterior-painter 0.8.0

| Name | Version | License | Source | Use |
|---|---|---|---|---|
| Painter source | 0.8.0 | MIT | this repository | C-painter provider and tool |
| hanaworlds-contracts | 2.0.0 (v2.0.0 tag, commit 3377ea81513d9a9446dccd4b626b4bfc183dc711) | MIT | https://github.com/yzsnstotz/hanaworlds-contracts | strict types, errors, digests, safety and public fixtures |
| @deepseek-ai/schemastery | 3.18.2 | MIT | https://github.com/deepseek-ai/deepseek-harness | plugin settings schema (D-3) |
| @deepseek-ai/cosmokit | 1.8.5 | MIT | https://github.com/deepseek-ai/deepseek-harness | schemastery transitive dependency |
| @standard-schema/spec | 1.1.0 | MIT | https://github.com/standard-schema/standard-schema | schemastery transitive dependency |
| sharp | 0.35.3 | Apache-2.0 | https://github.com/lovell/sharp | actual raster decoding; native libvips notices stay with dependency |
| color-diff | 1.4.0 | BSD-3-Clause | https://github.com/markusn/color-diff ; https://www.npmjs.com/package/color-diff | mature CIEDE2000 distance and RGB/Lab conversion for dominant image colour and validated ReadMaterialSources texture colours (D-16) |
| canonicalize | 5.1.0 | Apache-2.0 | https://github.com/erdtman/canonicalize | public contract digest/replay canonicalization |

All external code is installed as a dependency, with its own license retained;
none is copied or relabeled. Exact platform/native dependencies are in the lock.
World sources own material colours and neutral tags (D-17). The sole image tool
consumes C-world-facts ReadMaterialSources material-sources/v2: opaque materialRef,
current connection, Catalogue, revision and texture bytes are admitted before
colour measurement. color-diff supplies the distance; no custom Oklab distance
or world-specific palette is used. No game texture or
measured game-specific palette is shipped in the runtime package.
The historical archive retains earlier source/provenance and is not packaged.
