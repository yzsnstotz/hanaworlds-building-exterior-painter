#!/usr/bin/env bash
# New-entry gate only. Actual Cordis and installed Painter; provider/business facts fixture.
set -euo pipefail
source_sha=${1:?source commit required}
evidence=${2:?new evidence directory required}
app=${3:?fixed HanaWorlds.app required}
contracts_tar=${4:?admitted0.3.10 tar required}
base=/Users/yzliu/.cache/hanaworlds-runs/S1-PAINTER-SKILL-PROPOSAL-01
[ "$(node -p process.version)" = v24.13.1 ]
[ ! -e "$evidence" ]
mkdir -p "$evidence"
work=$(mktemp -d "$base/proposal-run.XXXXXX")
trap 'rm -rf "$work"' EXIT
mkdir -p "$work/source" "$work/consumer" "$evidence/package"
git archive "$source_sha" | tar -xf - -C "$work/source"
cd "$work/source"
export npm_config_cache="$work/npm-cache"
npm ci --ignore-scripts > "$evidence/install.log" 2>&1
node tools/vendor-contracts.mjs --check --package "$contracts_tar" > "$evidence/vendor.log" 2>&1
npm run build > "$evidence/build.log" 2>&1
npm run test:proposal > "$evidence/source-tests.log" 2>&1
npm pack --ignore-scripts --pack-destination "$evidence/package" --json > "$evidence/pack.json"
cd "$work/consumer"
npm install --ignore-scripts --no-audit --no-fund "$evidence/package/hanaworlds-building-exterior-painter-0.2.2.tgz" > "$evidence/consumer-install.log" 2>&1
installed="$work/consumer/node_modules/hanaworlds-building-exterior-painter"
cd "$work/source"
PAINTER_TEST_PACKAGE="$installed" node --test test/proposal.test.mjs > "$evidence/packed-tests.log" 2>&1
node tools/gate-proposal-runtime.mjs "$installed" "$app" > "$evidence/runtime.log" 2>&1
# Per-file shipped source -> installed comparison and metadata, no source substitutions.
node --input-type=module - "$installed" "$source_sha" "$evidence" <<'JS'
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
const [installed,sourceSha,evidence]=process.argv.slice(2), hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const pack=JSON.parse(readFileSync(resolve(evidence,'pack.json')))[0];
const paths=pack.files.map(p=>p.path);
const inventory=paths.map(p=>{const rel=p.startsWith(process.cwd())?p.slice(process.cwd().length+1):p;assert.equal(hash(p),hash(join(installed,rel)));return {path:rel,sha256:hash(p)};});
writeFileSync(resolve(evidence,'shipped-inventory.json'),JSON.stringify(inventory,null,2)+'\n');
writeFileSync(resolve(evidence,'receipt.json'),JSON.stringify({sourceSha,installed,node:process.version,painterVersion:'0.2.2',contractsVersion:'0.3.10',packageSha256:hash(join(evidence,'package/hanaworlds-building-exterior-painter-0.2.2.tgz')),shippedFiles:inventory.length,gateExit:0,boundary:'actual installed bytes/real Cordis; authority/world/media facts FIXTURE; real model/world/UI/Undo NOT_RUN'},null,2)+'\n');
JS
cat "$evidence/vendor.log" "$evidence/build.log" "$evidence/source-tests.log" "$evidence/packed-tests.log" "$evidence/runtime.log" "$evidence/receipt.json"
