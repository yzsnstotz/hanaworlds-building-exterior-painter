// verify:contracts — the contracts package this Painter actually resolves is
// exactly the pinned one.
//   node tools/verify-contracts.mjs                    identity only
//   node tools/verify-contracts.mjs --package <tgz>    also byte-compare with a package tarball
// Identity: resolved package.json name/version == tools/admitted-contracts.mjs,
// the advertised ContractHandshake names that exact package, and the Painter
// service advertises the contracts handshake unchanged. When the pin records a
// released revision, the package.json dependency and the package-lock both name
// that exact commit (a source checkout; an installed Painter has no lock). With
// --package, the tarball is the admitted released pack (sha256) and every file of
// its package/ is present with identical bytes in the resolved package directory
// and no other file is (a vendor copy may add only VENDOR.json).
// Prints one JSON receipt; exit 0 only when every check holds.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contracts, contractPackage, contractPackageDir } from '../src/contract-package.mjs';
import { ExteriorPainterV2 } from '../src/index.mjs';
import { ADMITTED_CONTRACTS } from './admitted-contracts.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const files = dir => readdirSync(dir, { recursive: true, withFileTypes: true })
  .filter(d => d.isFile()).map(d => relative(dir, join(d.parentPath, d.name))).sort();
const arg = process.argv.indexOf('--package');
const tarball = arg > 0 ? resolve(process.argv[arg + 1] ?? '') : null;

const pkg = contractPackage(), dir = contractPackageDir();
const expected = `${ADMITTED_CONTRACTS.name}@${ADMITTED_CONTRACTS.version}`;
const forbidden = new Proxy({}, { get() { throw new Error('verify:contracts touched an external port'); } });
const advertised = new ExteriorPainterV2({ llm: forbidden, attachments: forbidden, localFacts: forbidden }).handshake();
const receipt = { pinned: expected, resolvedDir: dir, resolved: `${pkg.name}@${pkg.version}`,
  handshake: contracts.contractHandshake.contracts, checks: {} };
const check = (name, fn) => { try { fn(); receipt.checks[name] = 'PASS'; } catch (e) { receipt.checks[name] = `FAIL: ${e.message.split('\n')[0]}`; } };

check('resolved package is the pinned name/version', () => assert.equal(receipt.resolved, expected));
check('contracts handshake names the pinned package', () => assert.equal(receipt.handshake, expected));
check('Painter advertises the contracts handshake unchanged', () => assert.deepEqual(advertised, contracts.contractHandshake));
const rev = ADMITTED_CONTRACTS.revision, root = fileURLToPath(new URL('..', import.meta.url));
if (rev && existsSync(join(root, 'package-lock.json'))) {
  const own = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const locked = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8')).packages['node_modules/hanaworlds-contracts'];
  receipt.revision = { admitted: rev, tag: ADMITTED_CONTRACTS.tag, dependency: own.dependencies?.[ADMITTED_CONTRACTS.name] ?? null, lockResolved: locked?.resolved ?? null };
  check('package.json dependency pins the released revision', () => assert.ok(receipt.revision.dependency?.endsWith(`#${rev}`), receipt.revision.dependency));
  check('package-lock resolves the released revision', () => assert.ok(receipt.revision.lockResolved?.endsWith(`#${rev}`), receipt.revision.lockResolved));
}

if (tarball) {
  const bytes = readFileSync(tarball);
  receipt.package = { path: tarball, bytes: statSync(tarball).size, sha256: sha(bytes) };
  if (ADMITTED_CONTRACTS.packageSha256)
    check('tarball is the admitted released pack', () => assert.equal(receipt.package.sha256, ADMITTED_CONTRACTS.packageSha256));
  const unpacked = mkdtempSync(join(tmpdir(), 'painter-verify-contracts-'));
  try {
    execFileSync('tar', ['-xzf', tarball, '-C', unpacked]);
    const want = files(join(unpacked, 'package')), have = files(dir).filter(f => f !== 'VENDOR.json');
    const missing = want.filter(f => !have.includes(f)), extra = have.filter(f => !want.includes(f));
    const differ = want.filter(f => have.includes(f)
      && sha(readFileSync(join(unpacked, 'package', f))) !== sha(readFileSync(join(dir, f))));
    receipt.package.files = want.length;
    receipt.package.diff = { missing, extra, differ };
    check('resolved package bytes equal the tarball', () => assert.deepEqual({ missing, extra, differ },
      { missing: [], extra: [], differ: [] }));
  } finally {
    rmSync(unpacked, { recursive: true, force: true });
  }
}

receipt.result = Object.values(receipt.checks).every(v => v === 'PASS') ? 'PASS' : 'FAIL';
console.log(JSON.stringify(receipt, null, 2));
process.exitCode = receipt.result === 'PASS' ? 0 : 1;
