#!/usr/bin/env bash
# Replace the image panel's bundled Painter tar with a fresh pack of this
# (already repinned) Painter source, keeping the panel's interface unchanged.
# Run from the Painter root after `npm install`:
#   tools/repack-panel-painter.sh <pack-dir> [npm-cache]
# Refuses a Painter pack that still carries vendor/hanaworlds-contracts. Only a
# Painter depending on released contracts by range may be committed this way.
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
# Same name/version as before: install by explicit file spec so the lockfile takes the
# new integrity (a lock-driven install would serve the old bytes from the npm cache).
# npm install also rewrites package.json (adds a duplicate bundleDependencies key);
# keep the panel manifest exactly as written above, only the lock follows npm.
cp image-material-panel/package.json "$pack/panel-package.json"
(cd image-material-panel && npm install "${cacheArg[@]}" --no-audit --no-fund "file:vendor/$name" >/dev/null)
cp "$pack/panel-package.json" image-material-panel/package.json
node -e '
const fs=require("fs"),crypto=require("crypto"),[tar]=process.argv.slice(1);
const want="sha512-"+crypto.createHash("sha512").update(fs.readFileSync(tar)).digest("base64");
const lock=JSON.parse(fs.readFileSync("image-material-panel/package-lock.json","utf8"));
const got=lock.packages["node_modules/hanaworlds-building-exterior-painter"].integrity;
if(got!==want){console.error("panel lock integrity "+got+" != new tar "+want);process.exit(4);}
if(fs.existsSync("image-material-panel/node_modules/hanaworlds-building-exterior-painter/vendor")){console.error("installed Painter still has vendor/");process.exit(5);}' "image-material-panel/vendor/$name"
echo "{\"painterTar\":\"image-material-panel/vendor/$name\",\"sha256\":\"$(shasum -a 256 "image-material-panel/vendor/$name" | cut -d' ' -f1)\"}"
