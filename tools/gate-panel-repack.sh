#!/usr/bin/env bash
# Panel repack gate (test environment only; nothing here is committed):
# archive <commit> twice -> "before" keeps the committed panel tar; "after" is
# repinned to <tarball> and the panel's bundled Painter repacked -> panel/web
# tests, no contracts vendor copy anywhere, engine outputs equal before/after,
# then the repacked panel is itself packed, installed and compared again.
#   tools/gate-panel-repack.sh <commit> <contracts.tgz> <sha256> <version> <run-dir>
# <run-dir> is wiped first; keep earlier evidence elsewhere.
set -u
commit=${1:?commit}; tarball=${2:?contracts tarball}; want_sha=${3:?sha256}; version=${4:?version}; run=${5:?run dir}
src=$(cd "$(dirname "$0")/.." && pwd)
rm -rf "$run"; mkdir -p "$run/evidence" "$run/before" "$run/after" "$run/pack" "$run/consumer" "$run/npm-cache"
ev=$run/evidence; c=(--cache "$run/npm-cache" --no-audit --no-fund)
note() { echo "$1=$2" >> "$ev/exit.txt"; }
got_sha=$(shasum -a 256 "$tarball" | cut -d' ' -f1)
[ "$got_sha" = "$want_sha" ] || { echo "tarball sha $got_sha != $want_sha"; exit 2; }
git -C "$src" archive "$commit" | tar -x -C "$run/before"
git -C "$src" archive "$commit" | tar -x -C "$run/after"

(cd "$run/before/image-material-panel" && npm ci "${c[@]}" > "$ev/before-panel-ci.log" 2>&1); note before-panel-ci $?
(cd "$run/before" && node tools/panel-engine-receipt.mjs image-material-panel/engine.mjs "$ev/engine-before.json" > "$ev/engine-before.log" 2>&1); note engine-before $?

cd "$run/after"
node tools/repin-contracts.mjs --spec "file:$tarball" --version "$version" > "$ev/repin.log" 2>&1; note repin $?
npm install "${c[@]}" > "$ev/install.log" 2>&1; note install $?
tools/repack-panel-painter.sh "$run/pack" "$run/npm-cache" > "$ev/repack.json" 2> "$ev/repack.err"; note repack $?
(cd image-material-web && npm ci "${c[@]}" > "$ev/web-ci.log" 2>&1); note web-ci $?
node --test test/image-material-panel.test.mjs test/image-web.test.mjs test/validate-web.test.mjs > "$ev/panel-web-tests.log" 2>&1; note panel-web-tests $?
node -e '
const fs=require("fs"),m="image-material-panel/node_modules/";
const p=JSON.parse(fs.readFileSync(m+"hanaworlds-building-exterior-painter/package.json","utf8"));
const k=JSON.parse(fs.readFileSync(m+"hanaworlds-contracts/package.json","utf8"));
const r={painter:p.version,painterContractsDep:p.dependencies["hanaworlds-contracts"],painterHasVendor:fs.existsSync(m+"hanaworlds-building-exterior-painter/vendor"),contracts:k.version};
console.log(JSON.stringify(r));process.exit(!r.painterHasVendor&&r.contracts===process.argv[1]?0:1);' "$version" > "$ev/panel-installed.json" 2>&1; note panel-installed $?
node tools/panel-engine-receipt.mjs image-material-panel/engine.mjs "$ev/engine-after.json" > "$ev/engine-after.log" 2>&1; note engine-after $?

panelTar=$(cd image-material-panel && npm pack "${c[@]}" --pack-destination "$run/pack" 2> "$ev/panel-pack.err" | tail -1); note panel-pack $?
tar -tzf "$run/pack/$panelTar" > "$ev/panel-tar-entries.txt"
grep -E '^package/node_modules/(hanaworlds-building-exterior-painter|hanaworlds-contracts)/package\.json$' "$ev/panel-tar-entries.txt" > "$ev/panel-tar-bundled.txt"
! grep -q 'hanaworlds-contracts/dist/local/index.mjs' <(grep '/vendor/' "$ev/panel-tar-entries.txt"); note panel-tar-no-vendor-contracts $?
[ "$(wc -l < "$ev/panel-tar-bundled.txt")" -eq 2 ]; note panel-tar-bundles-painter-and-contracts $?
(cd "$run/consumer" && echo '{"name":"panel-gate-consumer","private":true}' > package.json \
  && npm install "${c[@]}" --legacy-peer-deps "$run/pack/$panelTar" > "$ev/consumer-install.log" 2>&1); note consumer-install $?
node tools/panel-engine-receipt.mjs "$run/consumer/node_modules/hanaworlds-painter-image-material-panel/engine.mjs" "$ev/engine-installed.json" > "$ev/engine-installed.log" 2>&1; note engine-installed $?
node -e '
const fs=require("fs"),rows=f=>JSON.stringify(JSON.parse(fs.readFileSync(f,"utf8")).rows);
const [b,a,i]=process.argv.slice(1).map(rows);process.exit(b===a&&b===i?0:1);' "$ev/engine-before.json" "$ev/engine-after.json" "$ev/engine-installed.json"; note engine-outputs-equal $?
shasum -a 256 "$run/pack/"*.tgz > "$ev/pack-sha256.txt"
cat "$ev/exit.txt"
