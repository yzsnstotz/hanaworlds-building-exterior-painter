// The vendored Contracts subset must be exactly the admitted 0.3.10 pack bytes
// recorded in VENDOR.json (re-verified from public git by tools/vendor-contracts.mjs --check).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { version, wireVersions } from '#contracts';
import { ADMITTED_CONTRACTS, VENDORED_FILES } from '../tools/admitted-contracts.mjs';

const root = fileURLToPath(new URL('../vendor/hanaworlds-contracts/', import.meta.url));
async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path); else yield path;
  }
}

test('vendored hanaworlds-contracts files match VENDOR.json digests of admitted pack 8624bd02', async () => {
  const manifest = JSON.parse(await readFile(join(root, 'VENDOR.json'), 'utf8'));
  assert.equal(manifest.version, '0.3.10');
  assert.equal(manifest.revision, 'e66800964726b951a300eb9377b74c318641417f');
  assert.equal(manifest.packSha256, '8624bd026815fcdafc5248b21d8bc611baa0569b7b492b66905d2d015a496ce1');
  assert.equal(manifest.sha256, ADMITTED_CONTRACTS.sha256);
  const seen = {};
  for await (const path of walk(root)) {
    const rel = relative(root, path);
    if (rel === 'VENDOR.json') continue;
    seen[rel] = createHash('sha256').update(await readFile(path)).digest('hex');
  }
  assert.deepEqual(Object.keys(seen).sort(), [...VENDORED_FILES].sort());
  assert.deepEqual(seen, manifest.files);
  assert.equal(version, '0.3.10');
  assert.ok(wireVersions.includes('painter/v3'));
});
