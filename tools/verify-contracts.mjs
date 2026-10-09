// verify:contracts — the contracts package this Painter resolves is a release
// inside the declared range and is advertised unchanged.
//   node tools/verify-contracts.mjs                    identity only
//   node tools/verify-contracts.mjs --package <tgz>    also byte-compare with a package tarball
// Identity: in a source checkout the package.json dependency is the range spec in
// tools/admitted-contracts.mjs (no commit pin) and `npm ls` reports the resolved
// package as satisfying it (npm's own semver); the contracts handshake names the
// resolved package and passes the package's own same-major predicate
// (checkContractsVersion) and checkContractHandshake; the
// Painter service advertises it unchanged. With --package, every file of the
// tarball's package/ is present with identical bytes in the resolved package
// directory and no other file is.
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
const resolved = `${pkg.name}@${pkg.version}`;
const forbidden = new Proxy({}, { get() { throw new Error('verify:contracts touched an external port'); } });
const advertised = new ExteriorPainterV2({ llm: forbidden, attachments: forbidden, localFacts: forbidden }).handshake();
const receipt = { range: `${ADMITTED_CONTRACTS.name}@${ADMITTED_CONTRACTS.range}`, resolvedDir: dir, resolved,
  handshake: contracts.contractHandshake.contracts, checks: {} };
const check = (name, fn) => { try { fn(); receipt.checks[name] = 'PASS'; } catch (e) { receipt.checks[name] = `FAIL: ${e.message.split('\n')[0]}`; } };

check('resolved package is hanaworlds-contracts', () => assert.equal(pkg.name, ADMITTED_CONTRACTS.name));
check('contracts handshake names the resolved package', () => assert.equal(receipt.handshake, resolved));
check('contracts version decides by major (checkContractsVersion)', () => assert.equal(contracts.checkContractsVersion(receipt.handshake).result, 'CONTRACTS_MAJOR_MATCH'));
check('contracts accept their own handshake', () => contracts.checkContractHandshake(contracts.contractHandshake));
check('Painter advertises the contracts handshake unchanged', () => assert.deepEqual(advertised, contracts.contractHandshake));
const root = fileURLToPath(new URL('..', import.meta.url));
if (existsSync(join(root, 'package-lock.json'))) {
  const own = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const locked = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8')).packages['node_modules/hanaworlds-contracts'];
  receipt.dependency = { spec: own.dependencies?.[ADMITTED_CONTRACTS.name] ?? null, lockVersion: locked?.version ?? null, lockResolved: locked?.resolved ?? null };
  check('package.json dependency is the range spec (no commit pin)', () => assert.equal(receipt.dependency.spec, ADMITTED_CONTRACTS.spec));
  check('package-lock version is the resolved package', () => assert.equal(receipt.dependency.lockVersion, pkg.version));
  check('npm ls: resolved package satisfies the range', () => {
    let out;
    try { out = execFileSync('npm', ['ls', ADMITTED_CONTRACTS.name, '--json'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (e) { out = e.stdout; receipt.npmLs = JSON.parse(out || '{}'); throw new Error(`npm ls exit ${e.status}`); }
    const dep = JSON.parse(out).dependencies?.[ADMITTED_CONTRACTS.name];
    receipt.npmLs = dep;
    assert.ok(dep && !dep.invalid && !dep.missing && dep.version === pkg.version, JSON.stringify(dep));
  });
}

if (tarball) {
  const bytes = readFileSync(tarball);
  receipt.package = { path: tarball, bytes: statSync(tarball).size, sha256: sha(bytes) };
  const unpacked = mkdtempSync(join(tmpdir(), 'painter-verify-contracts-'));
  try {
    execFileSync('tar', ['-xzf', tarball, '-C', unpacked]);
    const want = files(join(unpacked, 'package')), have = files(dir);
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
