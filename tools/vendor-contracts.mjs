// Maintainer tool (network + npm; never runs at install or runtime).
//
//   node tools/vendor-contracts.mjs          re-vendor and rewrite VENDOR.json
//   node tools/vendor-contracts.mjs --check  verify only; exit 0 on exact match
//
// Downloads the pinned public source tarball of the admitted revision, packs it
// with npm (--ignore-scripts), refuses unless the pack SHA-256 and entry count
// equal the admitted values, then copies (or, with --check, compares) exactly
// VENDORED_FILES byte-for-byte from the pack's package/ directory.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADMITTED_CONTRACTS, VENDORED_FILES } from './admitted-contracts.mjs';

const check = process.argv.includes('--check');
const root = fileURLToPath(new URL('..', import.meta.url));
const vendor = join(root, 'vendor', 'hanaworlds-contracts');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const work = mkdtempSync(join(process.env.PAINTER_VERIFY_TMP ?? tmpdir(), 'painter-contracts-'));
try {
  const packageFlag = process.argv.indexOf('--package');
  let packagePath, packed;
  if (packageFlag !== -1) {
    packagePath = process.argv[packageFlag + 1];
    if (!packagePath) throw new Error('--package requires the admitted npm tarball');
    const entries = execFileSync('tar', ['-tzf', packagePath], { encoding: 'utf8' }).trim().split('\n');
    if (entries.some(p => !p.startsWith('package/') || p.includes('/../'))) throw new Error('unsafe pack path');
    packed = { filename: packagePath, entryCount: entries.length };
  } else {
    const response = await fetch(ADMITTED_CONTRACTS.sourceTarball);
    if (!response.ok) throw new Error(`download failed: HTTP ${response.status}`);
    writeFileSync(join(work, 'source.tar.gz'), Buffer.from(await response.arrayBuffer()));
    mkdirSync(join(work, 'source'));
    execFileSync('tar', ['-xzf', join(work, 'source.tar.gz'), '-C', join(work, 'source'), '--strip-components', '1']);
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    [packed] = JSON.parse(execFileSync(npm, ['pack', join(work, 'source'), '--ignore-scripts', '--pack-destination', work, '--json'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }));
    packagePath = join(work, packed.filename);
  }
  const packSha256 = sha(readFileSync(packagePath));
  if (packSha256 !== ADMITTED_CONTRACTS.sha256) throw new Error(`pack ${packSha256} != admitted ${ADMITTED_CONTRACTS.sha256}`);
  if (packed.entryCount !== ADMITTED_CONTRACTS.entries) throw new Error(`pack entries ${packed.entryCount} != admitted ${ADMITTED_CONTRACTS.entries}`);
  mkdirSync(join(work, 'x'));
  execFileSync('tar', ['-xzf', packagePath, '-C', join(work, 'x')]);
  const pkg = join(work, 'x', 'package');
  const files = Object.fromEntries(VENDORED_FILES.map(f => [f, sha(readFileSync(join(pkg, f)))]));
  const manifest = { ...ADMITTED_CONTRACTS, packSha256, packEntries: packed.entryCount,
    subset: 'unmodified bytes of the listed pack files; see tools/admitted-contracts.mjs', files };
  if (check) {
    const present = readdirSync(vendor, { recursive: true, withFileTypes: true }).filter(d => d.isFile())
      .map(d => relative(vendor, join(d.parentPath, d.name))).filter(f => f !== 'VENDOR.json').sort();
    const mismatched = VENDORED_FILES.filter(f => { try { return sha(readFileSync(join(vendor, f))) !== files[f]; } catch { return true; } });
    const extra = present.filter(f => !VENDORED_FILES.includes(f));
    const recorded = JSON.parse(readFileSync(join(vendor, 'VENDOR.json'), 'utf8'));
    const manifestMatches = JSON.stringify(recorded) === JSON.stringify(manifest);
    const report = { packSha256, packEntries: packed.entryCount, mismatched, extra, manifestMatches,
      match: mismatched.length === 0 && extra.length === 0 && manifestMatches };
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.match ? 0 : 1;
  } else {
    rmSync(vendor, { recursive: true, force: true });
    for (const f of VENDORED_FILES) { mkdirSync(dirname(join(vendor, f)), { recursive: true }); copyFileSync(join(pkg, f), join(vendor, f)); }
    writeFileSync(join(vendor, 'VENDOR.json'), JSON.stringify(manifest, null, 2) + '\n');
    console.log(JSON.stringify({ vendored: VENDORED_FILES.length, packSha256 }));
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
