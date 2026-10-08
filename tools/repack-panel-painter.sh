#!/usr/bin/env bash
# Replace the image panel's bundled Painter tar with a fresh pack of this
# (already repinned) Painter source, keeping the panel's interface unchanged.
# Run from the Painter root after tools/repin-contracts.mjs and `npm install`:
#   tools/repack-panel-painter.sh <pack-dir> [npm-cache]
# Refuses a Painter pack that still carries vendor/hanaworlds-contracts. Only a
# Painter repinned to a released contracts tag may be committed this way.
set -eu
pack=${1:?pack dir}; cache=${2:-}
root=$(cd "$(dirname "$0")/.." && pwd)
cacheArg=(); [ -n "$cache" ] && cacheArg=(--cache "$cache")
mkdir -p "$pack"
cd "$root"
name=$(npm pack "${cacheArg[@]}" --pack-destination "$pack" | tail -1)
if tar -tzf "$pack/$name" | grep -q '^package/vendor/'; then echo "packed Painter still carries vendor/"; exit 3; fi
rm -f image-material-panel/vendor/hanaworlds-building-exterior-painter-*.tgz
cp "$pack/$name" "image-material-panel/vendor/$name"
node -e '
const fs=require("fs"),p="image-material-panel/package.json",j=JSON.parse(fs.readFileSync(p,"utf8"));
j.dependencies["hanaworlds-building-exterior-painter"]="file:vendor/"+process.argv[1];
fs.writeFileSync(p,JSON.stringify(j,null,2)+"\n");' "$name"
(cd image-material-panel && npm install "${cacheArg[@]}" --no-audit --no-fund >/dev/null)
echo "{\"painterTar\":\"image-material-panel/vendor/$name\",\"sha256\":\"$(shasum -a 256 "image-material-panel/vendor/$name" | cut -d' ' -f1)\"}"
