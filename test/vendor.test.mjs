// The vendored Contracts subset must be the exact admitted 0.2.1 bytes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { version, wireVersions } from '#contracts';

const root = fileURLToPath(new URL('../vendor/hanaworlds-contracts/', import.meta.url));
async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path); else yield path;
  }
}

test('vendored hanaworlds-contracts files match VENDOR.json digests exactly', async () => {
  const manifest = JSON.parse(await readFile(join(root, 'VENDOR.json'), 'utf8'));
  assert.equal(manifest.version, '0.2.1');
  assert.equal(manifest.commit, '5ecfce1ba47530b42bba60a674bd16f7bc39c665');
  assert.equal(manifest.admittedArtifactSha256, 'd91b8950a07d6f5fb2a3b8b614c3157487e2e67e2b108a6599a2e05d0b452945');
  const seen = {};
  for await (const path of walk(root)) {
    const rel = relative(root, path);
    if (rel === 'VENDOR.json') continue;
    seen[rel] = createHash('sha256').update(await readFile(path)).digest('hex');
  }
  assert.deepEqual(seen, manifest.files);
  assert.equal(version, '0.2.1');
  assert.ok(wireVersions.includes('painter/v2'));
});
