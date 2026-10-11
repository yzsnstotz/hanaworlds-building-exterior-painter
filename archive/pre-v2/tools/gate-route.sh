#!/usr/bin/env bash
# Route-only gate. Node24.13.1/npm11.8; real Cordis, all business facts are fixtures.
set -euo pipefail
source_sha=${1:?source commit required}
evidence=${2:?new evidence directory required}
app=${3:?fixed HanaWorlds.app required}
contracts_tar=${4:?admitted contracts0.3.9 tar required}
base=/Users/yzliu/.cache/hanaworlds-runs/S1-PAINTER-SKILL-PROPOSAL-01
[ "$(node -p process.version)" = v24.13.1 ]
[ ! -e "$evidence" ]
mkdir -p "$evidence"
work=$(mktemp -d "$base/route-run.XXXXXX")
trap 'rm -rf "$work"' EXIT
mkdir -p "$work/source" "$work/contracts" "$work/consumer" "$evidence/package"
git archive "$source_sha" | tar -xf - -C "$work/source"
actual_contract_sha=$(shasum -a 256 "$contracts_tar" | cut -d ' ' -f 1)
[ "$actual_contract_sha" = 324ef459c78a4eb249939f4828128b87ff897d134b48d9cf8cbe6e69a6f4bbdc ]
tar -xzf "$contracts_tar" -C "$work/contracts"
cd "$work/source"
export npm_config_cache="$work/npm-cache"
npm ci --ignore-scripts > "$evidence/install.log" 2>&1
npm run build > "$evidence/build.log" 2>&1
npm test > "$evidence/tests.log" 2>&1
npm pack --ignore-scripts --pack-destination "$evidence/package" --json > "$evidence/pack.json"
cd "$work/consumer"
npm install --ignore-scripts --no-audit --no-fund "$evidence/package/hanaworlds-building-exterior-painter-0.2.1.tgz" > "$evidence/consumer-install.log" 2>&1
cd "$work/source"
node tools/gate-route.mjs "$work/consumer/node_modules/hanaworlds-building-exterior-painter" "$app" "$work/contracts/package" > "$evidence/runtime.log" 2>&1
cat "$evidence/build.log" "$evidence/tests.log" "$evidence/runtime.log"
shasum -a 256 "$evidence/package/hanaworlds-building-exterior-painter-0.2.1.tgz" > "$evidence/package.sha256"
printf '%s\n' "$source_sha" > "$evidence/source.sha"
