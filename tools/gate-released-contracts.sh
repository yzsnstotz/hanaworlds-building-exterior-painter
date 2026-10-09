#!/usr/bin/env bash
# Released-contracts gate on a committed source (lock-driven installs; contracts by
# range, see tools/admitted-contracts.mjs): archive <commit> -> npm ci -> build and
# suites -> verify:contracts (range spec, npm ls, handshake; optional byte compare
# with <contracts.tgz>) -> dev page tests and paths -> Painter pack equals the
# committed panel tar -> installed Painter suites -> panel engine outputs equal
# <before-commit>'s panel, from source and from an installed panel tar.
#   tools/gate-released-contracts.sh <commit> <before-commit> <run-dir> [<contracts.tgz>]
# <run-dir> is wiped first; keep earlier evidence elsewhere.
set -u
commit=${1:?commit}; before=${2:?before commit}; run=${3:?run dir}; tarball=${4:-}
src=$(cd "$(dirname "$0")/.." && pwd)
cache=${HANAWORLDS_NPM_CACHE:-$HOME/.cache/hanaworlds-deps/npm}  # shared dependency cache (WORKER §3)
rm -rf "$run"; mkdir -p "$run/evidence" "$run/copy" "$run/before" "$run/pack" "$run/consumer" "$run/panel-consumer"
ev=$run/evidence; c=(--cache "$cache" --no-audit --no-fund)
note() { echo "$1=$2" >> "$ev/exit.txt"; }
git -C "$src" archive "$commit" | tar -x -C "$run/copy"
git -C "$src" archive "$before" | tar -x -C "$run/before"

(cd "$run/before/image-material-panel" && npm ci "${c[@]}" > "$ev/before-panel-ci.log" 2>&1); note before-panel-ci $?
(cd "$run/before" && node tools/panel-engine-receipt.mjs image-material-panel/engine.mjs "$ev/engine-before.json" > "$ev/engine-before.log" 2>&1); note engine-before $?

cd "$run/copy"
[ ! -e vendor ]; note no-vendor-dir $?
npm ci "${c[@]}" > "$ev/install.log" 2>&1; note install $?
for s in build test test:region test:image-material test:material-sources; do
  npm run -s "$s" > "$ev/$s.log" 2>&1; note "$s" $?
done
node tools/verify-contracts.mjs ${tarball:+--package "$tarball"} > "$ev/verify-contracts.json" 2>&1; note verify:contracts $?
for d in image-material-panel image-material-web; do
  (cd "$d" && npm ci "${c[@]}" > "$ev/install-$d.log" 2>&1); note "install-$d" $?
done
node --test test/validate-web.test.mjs test/image-web.test.mjs test/image-material-panel.test.mjs > "$ev/web-panel.log" 2>&1; note web-panel $?
node tools/web-paths-check.mjs "$ev/web-paths.json" > "$ev/web-paths.log" 2>&1; note web-paths $?

name=$(npm pack "${c[@]}" --pack-destination "$run/pack" 2> "$ev/pack.err" | tail -1); note pack $?
cmp "$run/pack/$name" "image-material-panel/vendor/$name"; note painter-pack-equals-panel-tar $?
! tar -tzf "$run/pack/$name" | grep -q '^package/vendor/'; note painter-pack-no-vendor $?
(cd "$run/consumer" && echo '{"name":"painter-gate-consumer","private":true}' > package.json \
  && npm install "${c[@]}" "$run/pack/$name" > "$ev/packed-install.log" 2>&1); note packed-install $?
installed=$run/consumer/node_modules/hanaworlds-building-exterior-painter
for t in local-world region-v1; do
  PAINTER_TEST_PACKAGE=$installed node --test "test/$t.test.mjs" > "$ev/packed-$t.log" 2>&1; note "packed-$t" $?
done
(cd "$installed" && node -e "import('./src/contract-package.mjs').then(m=>console.log(JSON.stringify({version:m.contractPackage().version,dir:m.contractPackageDir()})))") > "$ev/packed-resolve.json" 2>&1

node tools/panel-engine-receipt.mjs image-material-panel/engine.mjs "$ev/engine-after.json" > "$ev/engine-after.log" 2>&1; note engine-after $?
panelTar=$(cd image-material-panel && npm pack "${c[@]}" --pack-destination "$run/pack" 2> "$ev/panel-pack.err" | tail -1); note panel-pack $?
tar -tzf "$run/pack/$panelTar" > "$ev/panel-tar-entries.txt"
! grep -q '/vendor/hanaworlds-contracts/' "$ev/panel-tar-entries.txt"; note panel-tar-no-vendor-contracts $?
[ "$(grep -cE '^package/node_modules/(hanaworlds-building-exterior-painter|hanaworlds-contracts)/package\.json$' "$ev/panel-tar-entries.txt")" -eq 2 ]; note panel-tar-bundles-painter-and-contracts $?
(cd "$run/panel-consumer" && echo '{"name":"panel-gate-consumer","private":true}' > package.json \
  && npm install "${c[@]}" --legacy-peer-deps "$run/pack/$panelTar" > "$ev/panel-consumer-install.log" 2>&1); note panel-consumer-install $?
node tools/panel-engine-receipt.mjs "$run/panel-consumer/node_modules/hanaworlds-painter-image-material-panel/engine.mjs" "$ev/engine-installed.json" > "$ev/engine-installed.log" 2>&1; note engine-installed $?
node -e '
const fs=require("fs"),rows=f=>JSON.stringify(JSON.parse(fs.readFileSync(f,"utf8")).rows);
const [b,a,i]=process.argv.slice(1).map(rows);process.exit(b===a&&b===i?0:1);' "$ev/engine-before.json" "$ev/engine-after.json" "$ev/engine-installed.json"; note engine-outputs-equal $?
shasum -a 256 "$run/pack/"*.tgz image-material-panel/vendor/*.tgz > "$ev/pack-sha256.txt"
grep -h -E '^✖ [^f]' "$ev"/*.log | sort -u > "$ev/failing-tests.txt"
cat "$ev/exit.txt"
