// Verify exact released-tag dependency, lock and installed identity plus the unchanged handshake.
// Optional --package <tgz> byte-compares the resolved contracts package.
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
const advertised = new ExteriorPainterV2({ localFacts: forbidden }).handshake();
const receipt = { release: `${ADMITTED_CONTRACTS.name}@${ADMITTED_CONTRACTS.version}`, resolvedDir: dir, resolved,
  handshake: contracts.contractHandshake.contracts, checks: {} };
const check = (name, fn) => { try { fn(); receipt.checks[name] = 'PASS'; } catch (e) { receipt.checks[name] = `FAIL: ${e.message.split('\n')[0]}`; } };

check('resolved package is hanaworlds-contracts', () => assert.equal(pkg.name, ADMITTED_CONTRACTS.name));
check('resolved version is the baseline release', () => assert.equal(pkg.version, ADMITTED_CONTRACTS.version));
check('contracts handshake names the resolved package', () => assert.equal(receipt.handshake, resolved));
check('contracts version decides by major (checkContractsVersion)', () => assert.equal(contracts.checkContractsVersion(receipt.handshake).result, 'CONTRACTS_MAJOR_MATCH'));
check('contracts accept their own handshake', () => contracts.checkContractHandshake(contracts.contractHandshake));
check('Painter advertises the contracts handshake unchanged', () => assert.deepEqual(advertised, contracts.contractHandshake));
const root = fileURLToPath(new URL('..', import.meta.url));
if (existsSync(join(root, 'package-lock.json'))) {
  const own = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const locked = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8')).packages['node_modules/hanaworlds-contracts'];
  receipt.dependency = { spec: own.dependencies?.[ADMITTED_CONTRACTS.name] ?? null, lockVersion: locked?.version ?? null, lockResolved: locked?.resolved ?? null };
  check('package.json dependency is the exact released tag', () => assert.equal(receipt.dependency.spec, ADMITTED_CONTRACTS.spec));
  const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
  check('lock root dependency is the exact released tag', () => assert.equal(lock.packages[''].dependencies[ADMITTED_CONTRACTS.name], ADMITTED_CONTRACTS.spec));
  check('lock commit matches the published release tag', () => {
    const refs = execFileSync('git', ['ls-remote', '--tags', `${ADMITTED_CONTRACTS.origin}.git`,
      `refs/tags/v${ADMITTED_CONTRACTS.version}`, `refs/tags/v${ADMITTED_CONTRACTS.version}^{}`],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim().split('\n').map(line => line.split(/\s+/));
    const tag = refs.find(([, ref]) => ref.endsWith('^{}')) ?? refs.find(([, ref]) => ref === `refs/tags/v${ADMITTED_CONTRACTS.version}`);
    assert.ok(tag, 'published release tag missing');
    receipt.releaseCommit = tag[0];
    assert.equal(receipt.dependency.lockResolved?.split('#').at(-1), tag[0]);
  });
  check('package-lock version is the resolved package', () => assert.equal(receipt.dependency.lockVersion, pkg.version));
  check('npm ls: resolved package satisfies the release spec', () => {
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
