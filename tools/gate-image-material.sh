#!/usr/bin/env bash
set -euo pipefail
source_sha=${1:?full source commit}
evidence=${2:?new evidence directory}
app=${3:?fixed HanaWorlds.app for Cordis}
texture=${4:?actual default_stone.png input}
base=/Users/yzliu/.cache/hanaworlds-runs/S1-PAINTER-IMAGE-MATERIAL-01
[ "$(node -p process.version)" = v24.13.1 ]
[ ! -e "$evidence" ]
mkdir -p "$evidence/package"
work=$(mktemp -d "$base/image-material-run.XXXXXX")
# Leave owned build directories for explicit post-gate inspection/cleanup receipt.
mkdir -p "$work/source" "$work/consumer"
git archive "$source_sha" | tar -xf - -C "$work/source"
cp "$texture" "$evidence/actual-default_stone.png"
export PAINTER_IMAGE_TEXTURE="$evidence/actual-default_stone.png"
export npm_config_cache="$work/npm-cache"
cd "$work/source"
npm ci --ignore-scripts --no-audit --no-fund > "$evidence/install.log" 2>&1
npm run build > "$evidence/build.log" 2>&1
npm run test:image-material > "$evidence/source-tests.log" 2>&1
npm pack --ignore-scripts --pack-destination "$evidence/package" --json > "$evidence/pack.json"
cd "$work/consumer"
npm install --ignore-scripts --no-audit --no-fund "$evidence/package/hanaworlds-building-exterior-painter-0.3.1.tgz" > "$evidence/consumer-install.log" 2>&1
installed="$work/consumer/node_modules/hanaworlds-building-exterior-painter"
cd "$work/source"
PAINTER_TEST_PACKAGE="$installed" node --test test/image-material.test.mjs > "$evidence/packed-tests.log" 2>&1
node tools/gate-image-material-runtime.mjs "$installed" "$app" "$evidence" "$PAINTER_IMAGE_TEXTURE" > "$evidence/runtime.log" 2>&1
node --input-type=module - "$installed" "$source_sha" "$evidence" "$work" <<'JS'
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const [installed,sourceSha,evidence,temporaryBuild]=process.argv.slice(2);
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const pack=JSON.parse(readFileSync(join(evidence,'pack.json')))[0];
const inventory=pack.files.map(({path})=>{assert.equal(hash(path),hash(join(installed,path)));return {path,sha256:hash(path)};});
writeFileSync(join(evidence,'shipped-inventory.json'),JSON.stringify(inventory,null,2)+'\n');
const lock=JSON.parse(readFileSync('package-lock.json'));
writeFileSync(join(evidence,'dependency-licenses.json'),JSON.stringify(Object.entries(lock.packages).map(([path,p])=>({path,version:p.version,license:p.license??'UNKNOWN',integrity:p.integrity??null})),null,2)+'\n');
writeFileSync(join(evidence,'receipt.json'),JSON.stringify({sourceSha,painterVersion:'0.3.1',
 contractsVersion:'0.4.0',node:process.version,packageSha256:hash(join(evidence,'package',pack.filename)),
 shippedFiles:inventory.length,sourceTests:5,installedTests:5,gateExit:0,temporaryBuild,
 boundary:'actual raster bytes/decoder/installed package/real Cordis; current Catalogue and Host media facts FIXTURE; App/model/world/Undo NOT_RUN'
},null,2)+'\n');
JS
cat "$evidence/receipt.json"
