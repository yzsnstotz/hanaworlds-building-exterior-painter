#!/usr/bin/env bash
# Candidate contracts gate (test environment only; nothing here is committed):
# archive <commit> -> repin the copy to <tarball> -> install -> build, suites,
# verify:contracts --package -> pack/install Painter -> installed-package suites.
#   tools/gate-candidate-contracts.sh <commit> <contracts.tgz> <sha256> <version> <run-dir>
# <run-dir> is wiped first; keep earlier evidence elsewhere.
set -u
commit=${1:?commit}; tarball=${2:?contracts tarball}; want_sha=${3:?sha256}; version=${4:?version}; run=${5:?run dir}
src=$(cd "$(dirname "$0")/.." && pwd)
rm -rf "$run"; mkdir -p "$run/evidence" "$run/copy" "$run/consumer" "$run/npm-cache"
ev=$run/evidence
got_sha=$(shasum -a 256 "$tarball" | cut -d' ' -f1)
[ "$got_sha" = "$want_sha" ] || { echo "tarball sha $got_sha != $want_sha"; exit 2; }
git -C "$src" archive "$commit" | tar -x -C "$run/copy"
cd "$run/copy"
node tools/repin-contracts.mjs --spec "file:$tarball" --version "$version" > "$ev/repin.log" 2>&1; echo "repin=$?" >> "$ev/exit.txt"
npm install --cache "$run/npm-cache" --no-audit --no-fund > "$ev/install.log" 2>&1; echo "install=$?" >> "$ev/exit.txt"
for s in build test test:region test:image-material test:material-sources; do
  npm run -s "$s" > "$ev/$s.log" 2>&1; echo "$s=$?" >> "$ev/exit.txt"
done
node tools/verify-contracts.mjs --package "$tarball" > "$ev/verify-contracts.json" 2>&1; echo "verify:contracts=$?" >> "$ev/exit.txt"
for d in image-material-panel image-material-web; do
  (cd "$d" && npm ci --cache "$run/npm-cache" --no-audit --no-fund > "$ev/install-$d.log" 2>&1); echo "install-$d=$?" >> "$ev/exit.txt"
done
node --test test/validate-web.test.mjs test/image-web.test.mjs > "$ev/web.log" 2>&1; echo "web=$?" >> "$ev/exit.txt"
npm pack --cache "$run/npm-cache" --pack-destination "$run" > "$ev/pack.log" 2>&1; echo "pack=$?" >> "$ev/exit.txt"
packed=$(ls "$run"/hanaworlds-building-exterior-painter-*.tgz)
(cd "$run/consumer" && echo '{"name":"painter-gate-consumer","private":true}' > package.json \
  && npm install --cache "$run/npm-cache" --no-audit --no-fund "$packed" > "$ev/packed-install.log" 2>&1); echo "packed-install=$?" >> "$ev/exit.txt"
installed=$run/consumer/node_modules/hanaworlds-building-exterior-painter
for t in local-world region-v1; do
  PAINTER_TEST_PACKAGE=$installed node --test "test/$t.test.mjs" > "$ev/packed-$t.log" 2>&1; echo "packed-$t=$?" >> "$ev/exit.txt"
done
(cd "$installed" && node -e "import('./src/contract-package.mjs').then(m=>console.log(JSON.stringify({version:m.contractPackage().version,dir:m.contractPackageDir()})))") > "$ev/packed-resolve.json" 2>&1
grep -h -E '^✖ [^f]' "$ev"/*.log | sort -u > "$ev/failing-tests.txt"
cat "$ev/exit.txt"
