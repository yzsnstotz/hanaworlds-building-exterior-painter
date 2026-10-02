// The vendored Contracts subset must be exactly the admitted 0.3.0 pack bytes
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

test('vendored hanaworlds-contracts files match VENDOR.json digests of admitted pack 47a2e5cc', async () => {
  const manifest = JSON.parse(await readFile(join(root, 'VENDOR.json'), 'utf8'));
  assert.equal(manifest.version, '0.3.0');
  assert.equal(manifest.revision, 'e82735780bdfd4ea8e662781455040a6e5306121');
  assert.equal(manifest.packSha256, '47a2e5cc77590fb471ffedde715682564e169a0d88dbc5005b71d8d542b38f5c');
  assert.equal(manifest.sha256, ADMITTED_CONTRACTS.sha256);
  const seen = {};
  for await (const path of walk(root)) {
    const rel = relative(root, path);
    if (rel === 'VENDOR.json') continue;
    seen[rel] = createHash('sha256').update(await readFile(path)).digest('hex');
  }
  assert.deepEqual(Object.keys(seen).sort(), [...VENDORED_FILES].sort());
  assert.deepEqual(seen, manifest.files);
  assert.equal(version, '0.3.0');
  assert.ok(wireVersions.includes('painter/v3'));
});
