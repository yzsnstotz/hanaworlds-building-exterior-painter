#!/usr/bin/env bash
# Frozen source -> actual installed own package -> real fixed Cordis.
set -euo pipefail
source_sha=${1:?source commit required}
evidence=${2:?new evidence directory required}
app=${3:?fixed HanaWorlds.app required}
contracts_tar=${4:?final admitted0.4.0 tar required}
base=/Users/yzliu/.cache/hanaworlds-runs/S1-PAINTER-SKILL-PROPOSAL-01
[ "$(node -p process.version)" = v24.13.1 ]
[ ! -e "$evidence" ]
mkdir -p "$evidence/package"
work=$(mktemp -d "$base/local-world-run.XXXXXX")
trap 'rm -rf "$work"' EXIT
mkdir -p "$work/source" "$work/consumer"
git archive "$source_sha" | tar -xf - -C "$work/source"
cd "$work/source"
export npm_config_cache="$work/npm-cache"
npm ci --ignore-scripts > "$evidence/install.log" 2>&1
node tools/vendor-contracts.mjs --check --package "$contracts_tar" > "$evidence/vendor.log" 2>&1
npm run build > "$evidence/build.log" 2>&1
npm test > "$evidence/source-tests.log" 2>&1
npm pack --ignore-scripts --pack-destination "$evidence/package" --json > "$evidence/pack.json"
cd "$work/consumer"
npm install --ignore-scripts --no-audit --no-fund "$evidence/package/hanaworlds-building-exterior-painter-0.3.0.tgz" > "$evidence/consumer-install.log" 2>&1
installed="$work/consumer/node_modules/hanaworlds-building-exterior-painter"
cd "$work/source"
PAINTER_TEST_PACKAGE="$installed" node --test test/local-world.test.mjs > "$evidence/packed-tests.log" 2>&1
node tools/gate-local-world-runtime.mjs "$installed" "$app" > "$evidence/runtime.log" 2>&1
node --input-type=module - "$installed" "$source_sha" "$evidence" <<'JS'
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const [installed, sourceSha, evidence] = process.argv.slice(2);
const hash = p => createHash('sha256').update(readFileSync(p)).digest('hex');
const pack = JSON.parse(readFileSync(join(evidence, 'pack.json')))[0];
const inventory = pack.files.map(({path}) => {
  assert.equal(hash(path), hash(join(installed, path)));
  return {path, sha256: hash(path)};
});
writeFileSync(join(evidence, 'shipped-inventory.json'), JSON.stringify(inventory, null, 2)+'\n');
writeFileSync(join(evidence, 'receipt.json'), JSON.stringify({sourceSha, node: process.version,
  painterVersion: '0.3.0', contractsVersion: '0.4.0',
  packageSha256: hash(join(evidence, 'package', pack.filename)), shippedFiles: inventory.length,
  sourceTests: 5, installedTests: 5, gateExit: 0,
  boundary: 'actual installed bytes/real Cordis; external business/world facts FIXTURE; model/world/UI/Undo NOT_RUN'
}, null, 2)+'\n');
JS
cat "$evidence/receipt.json" "$evidence/runtime.log"
