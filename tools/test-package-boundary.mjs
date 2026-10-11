import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { inspectTarball, inspectPackage, sha } from './package-boundary.mjs';
import { contractFixture, contracts } from './contract-package.mjs';
import { ADMITTED_CONTRACTS } from './admitted-contracts.mjs';
import { makeFacts, pixels } from '../test/material-sources-fixtures.mjs';
const root = resolve(new URL('..', import.meta.url).pathname);
const base = process.env.PAINTER_BOUNDARY_EVIDENCE ?? join(root, 'artifacts/package-boundary');
mkdirSync(base, { recursive: true });
const evidence = mkdtempSync(join(base, 'painter-boundary-'));
console.log(`Package boundary evidence: ${evidence}`);
const receiptPath = join(evidence, 'pack-parent.json');
const parent = { kind: 'painter-boundary-pack/v1', root, parentPid: process.pid, nonce: randomUUID(), active: true };
writeFileSync(receiptPath, JSON.stringify(parent), { flag: 'wx' });
let packed;
try {
 const packedProcess = spawnSync('npm', ['pack', '--json', '--pack-destination', evidence], { cwd: root,
  env: { ...process.env, PAINTER_BOUNDARY_RECEIPT: receiptPath, PAINTER_BOUNDARY_NONCE: parent.nonce }, encoding: 'utf8' });
 writeFileSync(join(evidence, 'pack.log'), packedProcess.stderr ?? '');
 assert.ifError(packedProcess.error); assert.equal(packedProcess.status, 0, packedProcess.stderr);
 packed = JSON.parse(packedProcess.stdout);
} finally { parent.active = false; writeFileSync(receiptPath, JSON.stringify(parent)); }
const tgz = join(evidence, packed[0].filename);
mkdirSync(join(evidence, 'unpacked'));
const inspected = inspectTarball(tgz, join(evidence, 'unpacked'));
writeFileSync(join(evidence, 'artifact-inspection.json'), JSON.stringify({ ...inspected, tarball: { path: tgz, sha256: sha(readFileSync(tgz)) } }, null, 2) + '\n');
// Provenance is checked against the actual admitted development input bytes,
// while the isolated production consumer below never sees this SDK.
assert.equal(inspected.provenance.generator.scriptSha256, sha(readFileSync(join(root, 'tools/build.mjs'))), 'build generator changed');
for (const input of inspected.provenance.inputs) assert.equal(sha(readFileSync(join(root, input.path))), input.sha256, `build input changed: ${input.path}`);
const pnpm = join(root, 'node_modules/pnpm/bin/pnpm.cjs');
assert.equal(JSON.parse(readFileSync(join(root, 'node_modules/pnpm/package.json'))).version, '11.28.5');
assert.match(process.version, /^v24\./, 'production gate requires target Node 24');
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(?:npm_config_|PNPM_|NODE_PATH$|NODE_OPTIONS$)/i.test(key)));
const run = (args, cwd, log) => {
 const result = spawnSync(process.execPath, [pnpm, ...args], { cwd, env: { ...env, XDG_CONFIG_HOME: join(cwd, 'empty-config') }, encoding: 'utf8' });
 writeFileSync(join(cwd, log), (result.stdout ?? '') + (result.stderr ?? ''));
 assert.ifError(result.error); return result;
};
function consumer(name, tarball) {
 const dir = join(evidence, name); mkdirSync(dir);
 writeFileSync(join(dir, 'package.json'), JSON.stringify({ private: true, type: 'module', dependencies: { [inspected.manifest.name]: `file:${tarball}` } }, null, 2));
 return dir;
}
const installed = consumer('production', tgz);
const policy = run(['config', 'list', '--json'], installed, 'policy.json'); assert.equal(policy.status, 0);
const config = JSON.parse(policy.stdout);
for (const key of ['blockExoticSubdeps', 'strictDepBuilds']) assert.notEqual(config[key] ?? config[key.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)], false, `${key} relaxed`);
for (const key of Object.keys(config)) assert.ok(!/allowBuilds|ignoreScripts|pnpmfile|override/i.test(key), `policy bypass ${key}`);
writeFileSync(join(installed, 'effective-policy.json'), JSON.stringify({ pnpm: '11.28.5', node: process.version, blockExoticSubdeps: config.blockExoticSubdeps ?? 'true (pnpm 11 default)', strictDepBuilds: config.strictDepBuilds ?? 'true (pnpm 11 default)', config }, null, 2));
const installation = run(['install', '--prod'], installed, 'install.log');
assert.equal(installation.status, 0, `normal production install failed:\n${installation.stdout}\n${installation.stderr}`);
const graph = run(['list', '--prod', '--depth', 'Infinity', '--json'], installed, 'production-graph.json'); assert.equal(graph.status, 0);
assert.doesNotMatch(readFileSync(join(installed, 'pnpm-lock.yaml'), 'utf8'), /hanaworlds-contracts/, 'production lock includes SDK');
assert.doesNotMatch(graph.stdout, /hanaworlds-contracts|esbuild|acorn|pnpm@/, 'development packages in production graph');
const bytes = await pixels(); const materialFacts = makeFacts([{ name: 'opaque-red', bytes }]);
const input = { packageName: inspected.manifest.name, entries: inspected.publicEntries,
 main: contractFixture('main'), region: contractFixture('region'),
 foreignError: new contracts.ContractError('CAPABILITY_UNAVAILABLE', 'validate', 'POLICY_UNAVAILABLE').publicError,
 imageInput: { ...materialFacts, imageBytes: [...bytes] } };
writeFileSync(join(installed, 'input.json'), JSON.stringify(input, (k, v) => v instanceof Uint8Array ? [...v] : v));
cpSync(join(root, 'tools/production-consumer.mjs'), join(installed, 'consumer.mjs'));
const runtime = spawnSync(process.execPath, ['consumer.mjs'], { cwd: installed, env, encoding: 'utf8' });
writeFileSync(join(installed, 'capabilities.log'), runtime.stdout + runtime.stderr);
assert.equal(runtime.status, 0, runtime.stdout + runtime.stderr);
// Retain original product gates against the installed bundle, using the dev SDK
// only as an independent fixture/oracle in the test process (separate evidence).
const original = spawnSync(process.execPath, ['--test', ... (await import('./package-boundary.mjs')).files(join(root, 'test')).filter(f => f.endsWith('.test.mjs')).map(f => `test/${f}`)], {
 cwd: root, env: { ...env, PAINTER_TEST_PACKAGE: join(installed, 'node_modules', inspected.manifest.name) }, encoding: 'utf8' });
writeFileSync(join(evidence, 'original-gates-installed.log'), original.stdout + original.stderr);
assert.equal(original.status, 0, original.stdout + original.stderr);
const negatives = [];
async function negative(name, mutate, pattern, exercise) {
 const dir = join(evidence, `negative-${name}`); mkdirSync(dir);
 cpSync(join(evidence, 'unpacked/package'), join(dir, 'package'), { recursive: true });
 const pkgDir = join(dir, 'package'); mutate(pkgDir);
 // A deliberately corrupt artifact is packed with the real npm pack command;
 // removing lifecycle scripts here prevents it being repaired by a rebuild.
 const manifest = JSON.parse(readFileSync(join(pkgDir, 'package.json'))); delete manifest.scripts;
 writeFileSync(join(pkgDir, 'package.json'), JSON.stringify(manifest, null, 2));
 const info = JSON.parse(execFileSync('npm', ['pack', '--json', '--pack-destination', dir], { cwd: pkgDir, env: { ...env, npm_config_cache: process.env.npm_config_cache }, encoding: 'utf8' }));
 const corrupt = join(dir, info[0].filename); mkdirSync(join(dir, 'inspection'));
 assert.throws(() => inspectTarball(corrupt, join(dir, 'inspection')), pattern, `${name} escaped boundary`);
 if (exercise) {
  const target = consumer(`negative-consumer-${name}`, corrupt);
  const result = run(['install', '--prod'], target, 'install.log');
  if (exercise === 'install') { assert.notEqual(result.status, 0); assert.match(result.stdout + result.stderr, /ERR_PNPM_EXOTIC_SUBDEP/); }
  else {
   assert.equal(result.status, 0, result.stdout + result.stderr);
   const loaded = spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(inspected.manifest.name)})`], { cwd: target, env, encoding: 'utf8' });
   writeFileSync(join(target, 'load.log'), loaded.stdout + loaded.stderr);
   assert.notEqual(loaded.status, 0, `${name} unexpectedly loaded`);
   assert.match(loaded.stderr, /ERR_MODULE_NOT_FOUND|ERR_PACKAGE_IMPORT_NOT_DEFINED/);
  }
 }
 negatives.push({ name, result: 'rejected', sha256: sha(readFileSync(corrupt)), exercised: exercise ?? 'tarball inspection' });
}
const editManifest = (dir, fn) => { const p = JSON.parse(readFileSync(join(dir, 'package.json'))); fn(p); writeFileSync(join(dir, 'package.json'), JSON.stringify(p)); };
const prepend = (dir, code) => writeFileSync(join(dir, 'dist/index.mjs'), code + readFileSync(join(dir, 'dist/index.mjs'), 'utf8'));
await negative('production-contract', d => editManifest(d, p => { p.dependencies[ADMITTED_CONTRACTS.name] = ADMITTED_CONTRACTS.spec; }), /production dependencies contains contracts/, 'install');
await negative('missing-local-bundle', d => prepend(d, "import './omitted.mjs';\n"), /local dependency missing/, 'load');
await negative('bare-value-contract', d => prepend(d, "import 'hanaworlds-contracts';\n"), /runtime contracts load/, 'load');
await negative('package-import-value', d => prepend(d, "await import('#contracts');\n"), /runtime contracts load/, 'load');
await negative('missing-canonicalize', d => editManifest(d, p => { delete p.dependencies.canonicalize; }), /undeclared external canonicalize/, 'load');
await negative('resolve-resource', d => prepend(d, "import.meta.resolve('hanaworlds-contracts/package.json');\n"), /import.meta/);
await negative('computed-meta-resolve', d => prepend(d, "const r=import.meta['res'+'olve']; r('hanaworlds-contracts/package.json');\n"), /import.meta/);
await negative('file-resource', d => prepend(d, "import {readFileSync} from 'node:fs';\nreadFileSync('/dev/schema.json');\n"), /filesystem|resource read/);
await negative('dynamic-value-load', d => prepend(d, "await import(process.env.SDK_PATH);\n"), /dynamic external resource (?:load|reference)/);
await negative('dynamic-require', d => prepend(d, "require(process.env.SDK_PATH);\n"), /dynamic external resource (?:load|reference)/);
await negative('aliased-resource', d => prepend(d, "const gb = process.getBuiltinModule; const fs = gb('fs'); const read = fs.readFileSync; read('/development/schema.json');\n"), /resource reference/);
await negative('destructured-resource', d => prepend(d, "const {getBuiltinModule: gb} = process; const fs = gb('fs'); const {readFileSync: read} = fs; read('/development/schema.json');\n"), /resource reference/);
await negative('split-resource-alias', d => prepend(d, "const p=process; const gb=p['get'+'BuiltinModule']; const fs=gb('fs'); const rd=fs['read'+'FileSync']; rd('/dev/schema.json');\n"), /resource reference/);
await negative('aliased-require', d => prepend(d, "const load = require; load('hanaworlds-contracts');\n"), /resource reference/);
await negative('stale-fixture', d => { mkdirSync(join(d, 'dist/fixtures')); writeFileSync(join(d, 'dist/fixtures/main.json'), '{}'); }, /artifact inventory/);
await negative('wrong-source', d => { const p = JSON.parse(readFileSync(join(d, 'dist/build-source.json'))); p.supply.commit = '0000000000000000000000000000000000000000'; writeFileSync(join(d, 'dist/build-source.json'), JSON.stringify(p)); }, /build source commit/);
writeFileSync(join(evidence, 'negative-receipts.json'), JSON.stringify(negatives, null, 2) + '\n');
writeFileSync(join(evidence, 'result.json'), JSON.stringify({ result: 'PASS', tgz, sha256: sha(readFileSync(tgz)), installed, publicEntries: inspected.publicEntries, negatives, node: process.version, pnpm: '11.28.5' }, null, 2) + '\n');
console.log(`PASS: real packed artifact, default-strict pnpm11 production install, isolated runtime capabilities, original gates and ${negatives.length} negatives. ${evidence}`);
