# License audit · hanaworlds-building-exterior-painter 0.8.0

| Name | Version | License | Source | Use |
|---|---|---|---|---|
| Painter source | 0.8.0 | MIT | this repository | C-painter provider and tool |
| hanaworlds-contracts | 2.0.0 (v2.0.0 tag, commit 3377ea81513d9a9446dccd4b626b4bfc183dc711) | MIT | https://github.com/yzsnstotz/hanaworlds-contracts | historical document schema and unchanged regression fixture attribution only; no SDK dependency or implementation compiled |
| @deepseek-ai/schemastery | 3.18.2 | MIT | https://github.com/deepseek-ai/deepseek-harness | plugin settings schema (D-3) |
| @deepseek-ai/cosmokit | 1.8.5 | MIT | https://github.com/deepseek-ai/deepseek-harness | schemastery transitive dependency |
| @standard-schema/spec | 1.1.0 | MIT | https://github.com/standard-schema/standard-schema | schemastery transitive dependency |
| sharp | 0.35.3 | Apache-2.0 | https://github.com/lovell/sharp | actual raster decoding; native libvips notices stay with dependency |
| color-diff | 1.4.0 | BSD-3-Clause | https://github.com/markusn/color-diff ; https://www.npmjs.com/package/color-diff | mature CIEDE2000 distance and RGB/Lab conversion for dominant image colour and validated ReadMaterialSources texture colours (D-16) |
| canonicalize | 5.1.0 | Apache-2.0 | https://github.com/erdtman/canonicalize | public contract digest/replay canonicalization |

The retired contract SDK is absent from every dependency section and the lock.
Painter compiles its own approved C-painter document projections and owned code
with esbuild 0.25.12 (MIT, https://github.com/evanw/esbuild). Historical schema
and fixture LICENSE/NOTICE attribution is retained; fixtures are excluded from
runtime builds and packed artifacts. `dist/build-source.json` records the
approved document SHA, contributing source hashes and generated output hashes.
acorn 8.15.0 (MIT, https://github.com/acornjs/acorn)
inspects packed module loading; pnpm 11.28.5 (MIT, https://github.com/pnpm/pnpm)
verifies isolated production installation under its default strict policy. These
tools, plus node 24.13.1 (MIT, https://github.com/aredridel/node-bin-gen;
Node binary and its original notices from https://nodejs.org/) and its locked
installer node-bin-setup 1.1.4 (ISC, https://github.com/aredridel/node-bin-setup),
are development-only and are not distributed. Other runtime libraries
stay external normal dependencies, with their own licenses retained.
Exact platform/native dependencies are in the lock.
World sources own material colours and neutral tags (D-17). The sole image tool
consumes C-world-facts ReadMaterialSources material-sources/v2: opaque materialRef,
current connection, Catalogue, revision and texture bytes are admitted before
colour measurement. color-diff supplies the distance; no custom Oklab distance
or world-specific palette is used. No game texture or
measured game-specific palette is shipped in the runtime package.
The historical archive retains earlier source/provenance and is not packaged.
