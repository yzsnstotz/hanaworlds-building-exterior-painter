#!/usr/bin/env bash
# Frozen-commit gate: archive -> lock install -> exact vendor check -> build ->
# source tests -> pack -> independent install -> installed tests -> real Cordis.
set -euo pipefail
source_sha=${1:?full source commit}
evidence=${2:?fresh evidence directory}
app=${3:?fixed HanaWorlds.app for Cordis}
contracts=${4:?contracts package tarball the vendor must equal}
base=/Users/yzliu/.cache/hanaworlds-runs/S1-PAINTER-REGION-VALIDATE-01
[ "$(node -p process.version)" = v24.13.1 ]
[ ! -e "$evidence" ]
mkdir -p "$evidence/package"
work=$(mktemp -d "$base/region-run.XXXXXX")
mkdir -p "$work/source" "$work/consumer"
git archive "$source_sha" | tar -xf - -C "$work/source"
export npm_config_cache="$work/npm-cache"
cd "$work/source"
version=$(node -p "require('./package.json').version")
npm ci --ignore-scripts --no-audit --no-fund > "$evidence/install.log" 2>&1
node tools/vendor-contracts.mjs --check --package "$contracts" > "$evidence/vendor.log" 2>&1
npm run build > "$evidence/build.log" 2>&1
# Affected: region (new), text channel (shared service), describe() tool list and vendored 0.5.0 handshake.
node --test test/region-v1.test.mjs > "$evidence/source-region.log" 2>&1
node --test test/local-world.test.mjs > "$evidence/source-text.log" 2>&1
node --test --test-name-pattern='current-world public consumer|exact vendored 0.5.0 handshake' test/material-sources.test.mjs > "$evidence/source-describe.log" 2>&1
npm pack --ignore-scripts --pack-destination "$evidence/package" --json > "$evidence/pack.json"
cd "$work/consumer"
npm install --ignore-scripts --no-audit --no-fund "$evidence/package/hanaworlds-building-exterior-painter-$version.tgz" > "$evidence/consumer-install.log" 2>&1
installed="$work/consumer/node_modules/hanaworlds-building-exterior-painter"
cd "$work/source"
PAINTER_TEST_PACKAGE="$installed" node --test test/region-v1.test.mjs > "$evidence/packed-region.log" 2>&1
PAINTER_TEST_PACKAGE="$installed" node --test test/local-world.test.mjs > "$evidence/packed-text.log" 2>&1
PAINTER_TEST_PACKAGE="$installed" node --test --test-name-pattern='current-world public consumer|exact vendored 0.5.0 handshake' test/material-sources.test.mjs > "$evidence/packed-describe.log" 2>&1
node tools/gate-region-validate-runtime.mjs "$installed" "$app" "$evidence" > "$evidence/runtime.log" 2>&1
node --input-type=module - "$installed" "$source_sha" "$evidence" "$work" "$version" "$contracts" <<'JS'
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const [installed,sourceSha,evidence,temporaryBuild,version,contracts]=process.argv.slice(2);
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const count=f=>{const m=/ℹ pass (\d+)[\s\S]*ℹ fail (\d+)/.exec(readFileSync(join(evidence,f),'utf8'));assert.ok(m);assert.equal(m[2],'0');return Number(m[1]);};
const tests=Object.fromEntries(['source-region','source-text','source-describe','packed-region','packed-text','packed-describe'].map(n=>[n,count(n+'.log')]));
const pack=JSON.parse(readFileSync(join(evidence,'pack.json')))[0];
const inventory=pack.files.map(({path})=>{assert.equal(hash(path),hash(join(installed,path)));return {path,sha256:hash(path)};});
writeFileSync(join(evidence,'shipped-inventory.json'),JSON.stringify(inventory,null,2)+'\n');
const lock=JSON.parse(readFileSync('package-lock.json'));
writeFileSync(join(evidence,'dependency-licenses.json'),JSON.stringify(Object.entries(lock.packages).map(([path,p])=>({path,version:p.version,license:p.license??'UNKNOWN',integrity:p.integrity??null})),null,2)+'\n');
writeFileSync(join(evidence,'receipt.json'),JSON.stringify({sourceSha,painterVersion:version,contractsPackage:contracts,contractsSha256:hash(contracts),
 node:process.version,packageSha256:hash(join(evidence,'package',pack.filename)),shippedFiles:inventory.length,tests,gateExit:0,temporaryBuild,
 boundary:'real installed package/real Cordis/vendored real contracts 0.5.0; contract region scenario and Host facts FIXTURE; peer Brush/Canvas/Adapter, App/model/world/Undo/UI NOT_RUN'},null,2)+'\n');
JS
cat "$evidence/receipt.json"
