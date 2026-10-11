import { build, version as esbuildVersion } from 'esbuild';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { sha, files } from './package-boundary.mjs';
import { ADMITTED_CONTRACTS } from './admitted-contracts.mjs';
import { contractPackageDir } from './contract-package.mjs';
const root = resolve(new URL('..', import.meta.url).pathname);
execFileSync(process.execPath, ['tools/verify-contracts.mjs'], { cwd: root, stdio: 'inherit' });
// Retain every original syntax gate and extend it to new runtime modules.
for (const f of files(join(root, 'src')).filter(f => f.endsWith('.mjs'))) execFileSync(process.execPath, ['--check', join('src', f)], { cwd: root });
const pkg = JSON.parse(readFileSync(join(root, 'package.json')));
const externals = [...new Set(['dependencies', 'peerDependencies', 'optionalDependencies'].flatMap(k => Object.keys(pkg[k] ?? {})))];
assert.equal(esbuildVersion, pkg.devDependencies.esbuild, 'exact build tool');
// Only the admitted SDK is compiled. Host/Cordis/settings/native libraries stay external.
const result = await build({ absWorkingDir: root, entryPoints: ['src/index.mjs'], outfile: 'dist/index.mjs',
 bundle: true, treeShaking: true, platform: 'node', format: 'esm', target: 'node24',
 external: [...externals, '@deepseek-ai/host', 'cordis', 'react', 'react-dom'],
 legalComments: 'inline', metafile: true, write: true });
const contribution = new Map();
for (const output of Object.values(result.metafile.outputs)) for (const [path, info] of Object.entries(output.inputs)) contribution.set(path, (contribution.get(path) ?? 0) + info.bytesInOutput);
const inputs = Object.keys(result.metafile.inputs).filter(path => contribution.get(path) > 0).sort()
 .map(path => ({ path, sha256: sha(readFileSync(join(root, path))), bytesInOutput: contribution.get(path) }));
const outputs = Object.fromEntries(Object.keys(result.metafile.outputs).sort().map(path => [path, sha(readFileSync(join(root, path)))]));
mkdirSync(join(root, 'dist/licenses'), { recursive: true });
for (const name of ['LICENSE', 'NOTICE']) copyFileSync(join(contractPackageDir(), name), join(root, 'dist/licenses', `contracts-${name}`));
writeFileSync(join(root, 'dist/build-source.json'), JSON.stringify({ format: 1, supply: ADMITTED_CONTRACTS,
 generator: { name: 'esbuild', scriptSha256: sha(readFileSync(join(root, 'tools/build.mjs'))), version: esbuildVersion, target: 'node24', external: externals.sort() }, inputs, outputs }, null, 2) + '\n');
console.log(`Compiled painter runtime: ${inputs.length} contributing inputs, SHA256 ${outputs['dist/index.mjs']}`);
