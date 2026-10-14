// Inspect the real tarball, including every runtime artifact, before installation.
import assert from 'node:assert/strict';
import { builtinModules } from 'node:module';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, realpathSync } from 'node:fs';
import { resolve, relative, dirname, join } from 'node:path';
import { parse } from 'acorn';
import { ADMITTED_CONTRACTS, ADMITTED_DOCUMENT } from './admitted-contracts.mjs';
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export const files = dir => readdirSync(dir, { recursive: true, withFileTypes: true }).filter(e => e.isFile())
 .map(e => relative(dir, join(e.parentPath, e.name))).sort();
const builtins = new Set(builtinModules.flatMap(n => [n, `node:${n}`]));
const strings = value => typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : [];
const walk = (node, fn) => { if (!node || typeof node !== 'object') return; if (node.type) fn(node);
 for (const [key, value] of Object.entries(node)) if (key !== 'start' && key !== 'end') {
  if (Array.isArray(value)) value.forEach(n => walk(n, fn)); else if (value && typeof value === 'object') walk(value, fn);
 }};
const member = n => n?.type === 'MemberExpression' ? n.computed ? n.property.value : n.property.name : null;
export function inspectPackage(dir) {
 const manifest = JSON.parse(readFileSync(join(dir, 'package.json'))), inventory = files(dir);
 for (const section of ['dependencies', 'peerDependencies', 'optionalDependencies', 'devDependencies']) {
  assert.ok(!Object.hasOwn(manifest[section] ?? {}, ADMITTED_CONTRACTS.name), `production ${section} contains contracts`);
  for (const spec of Object.values(manifest[section] ?? {})) assert.doesNotMatch(spec, /^(?:file:|link:|workspace:)|hanaworlds-contracts/, 'nonportable production dependency');
 }
 assert.ok(!manifest.devDependencies?.[ADMITTED_CONTRACTS.name], 'retired development supply');
 assert.equal(manifest.imports, undefined, 'production package imports must not resolve development supply');
 const declared = new Set(['dependencies', 'peerDependencies', 'optionalDependencies'].flatMap(k => Object.keys(manifest[k] ?? {})));
 const local = (from, spec) => {
  const path = resolve(from, spec), rel = relative(dir, path);
  assert.ok(!rel.startsWith('..') && !rel.includes('node_modules') && existsSync(path), `unpacked local dependency missing: ${spec}`);
  assert.ok(!relative(dir, realpathSync(path)).startsWith('..'), 'local dependency escapes package');
  return rel;
 };
 const entries = [...strings(manifest.exports), ...[manifest.main, manifest.module].filter(Boolean)];
 assert.ok(entries.length, 'no public runtime entry');
 const publicEntries = entries.flatMap(spec => {
  assert.ok(spec.startsWith('./'), 'public entry must be local');
  if (spec.includes('*')) {
   const [start, end] = spec.slice(2).split('*');
   const matches = inventory.filter(f => f.startsWith(start) && f.endsWith(end));
   assert.ok(matches.length, `unmatched export ${spec}`); return matches;
  }
  return [local(dir, spec)];
 });
 for (const target of [...strings(manifest.bin), ...strings(manifest.dsh)]) if (target.startsWith('./')) local(dir, target);
 assert.ok(inventory.every(f => !/^(?:src|tools|test|examples|fixtures|node_modules)\//.test(f)), 'development source/fixture leaked into package');
 const allowed = new Set(['package.json', 'README.md', 'GADGET.md', 'LICENSE', 'NOTICE', 'LICENSE_AUDIT.md', 'cordis.patch.yml', 'dist/index.mjs', 'dist/build-source.json', 'dist/licenses/contracts-LICENSE', 'dist/licenses/contracts-NOTICE']);
 const edges = {}, externals = new Set();
 for (const file of inventory.filter(f => /\.(?:[cm]?js)$/.test(f))) {
  const source = readFileSync(join(dir, file), 'utf8'); edges[file] = [];
  const load = spec => {
   assert.equal(typeof spec, 'string', `dynamic external resource load in ${file}`);
   assert.ok(!spec.startsWith('#') && !spec.includes('hanaworlds-contracts'), `runtime contracts load ${spec}`);
   if (spec.startsWith('.')) edges[file].push(local(dirname(join(dir, file)), spec));
   else if (builtins.has(spec)) assert.ok(['node:crypto', 'node:util', 'crypto', 'util'].includes(spec), 'dynamic filesystem/require resource loading');
   else {
    assert.ok(!spec.startsWith('/') && !spec.includes(':'), 'external resource loading');
    const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
    assert.ok(declared.has(name), `undeclared external ${spec}`); externals.add(spec);
   }
  };
  const forbiddenResource = /^(?:process|globalThis|require|__require|fetch|readFileSync|readFile|createRequire|getBuiltinModule|eval|Function)$/;
  walk(parse(source, { ecmaVersion: 'latest', sourceType: file.endsWith('.cjs') ? 'script' : 'module' }), n => {
   if (n.type === 'MetaProperty' && n.meta.name === 'import') assert.fail('import.meta runtime resource loading');
   // Reject references, not just calls: aliases and destructuring cannot hide a loader.
   if ((n.type === 'Identifier' && forbiddenResource.test(n.name)) || (n.type === 'MemberExpression' && forbiddenResource.test(member(n) ?? ''))) assert.fail('dynamic external resource reference');
   if (n.type === 'MemberExpression' && n.computed && ['process', 'globalThis'].includes(n.object?.name) && n.property.type !== 'Literal') assert.fail('dynamic external resource lookup');
   if (n.type === 'CallExpression' && member(n.callee) === 'get' && n.callee.object?.name === 'Reflect' && ['process', 'globalThis'].includes(n.arguments[0]?.name)) assert.fail('dynamic external resource lookup');
   if ((n.type === 'ImportDeclaration' || n.type.startsWith('Export')) && n.source) load(n.source.value);
   if (n.type === 'NewExpression' && n.callee.type === 'Identifier' && n.callee.name === 'Function') assert.fail('dynamic external resource read');
   if (n.type === 'ImportExpression') load(n.source.type === 'Literal' ? n.source.value : undefined);
   if (n.type === 'CallExpression' && ((n.callee.type === 'Identifier' && /^(?:require|__require)$/.test(n.callee.name)) || member(n.callee) === 'require')) load(n.arguments[0]?.type === 'Literal' ? n.arguments[0].value : undefined);
   if (n.type === 'MemberExpression' && member(n) === 'resolve' && n.object?.type === 'MetaProperty') assert.fail('import.meta.resolve runtime resource loading');
   if (n.type === 'CallExpression' && ((n.callee.type === 'Identifier' && /^(?:eval|Function|createRequire|readFileSync|readFile|fetch)$/.test(n.callee.name)) || /^(?:readFileSync|readFile|createRequire|getBuiltinModule)$/.test(member(n.callee) ?? ''))) assert.fail('dynamic external resource read');
  });
 }
 assert.deepEqual(inventory, [...allowed].sort(), 'unexpected or missing packed artifact inventory (source/fixture residue)');
 const seen = new Set(); const visit = file => { if (seen.has(file)) return; seen.add(file); for (const dep of edges[file] ?? []) visit(dep); };
 publicEntries.forEach(visit);
 const provenance = JSON.parse(readFileSync(join(dir, 'dist/build-source.json')));
 assert.equal(provenance.supply.name, ADMITTED_DOCUMENT.name, 'owned document identity');
 assert.equal(provenance.supply.commit, ADMITTED_DOCUMENT.commit, 'build source commit');
 assert.equal(provenance.supply.documentSHA256, ADMITTED_DOCUMENT.documentSHA256, 'owned document bytes');
 assert.ok(provenance.inputs.some(i => i.path === 'src/painter-document-data.mjs' && i.bytesInOutput > 0), 'owned projections not compiled');
 assert.ok(provenance.inputs.every(i => !i.path.includes('node_modules/hanaworlds-contracts/')), 'retired code compiled');
 assert.ok(provenance.inputs.every(i => !/fixtures\//.test(i.path)), 'development fixtures bundled');
 for (const [file, hash] of Object.entries(provenance.outputs)) assert.equal(sha(readFileSync(join(dir, file))), hash, `generated artifact digest ${file}`);
 assert.deepEqual(inventory.filter(f => /\.(?:[cm]?js)$/.test(f)), Object.keys(provenance.outputs).filter(f => /\.(?:[cm]?js)$/.test(f)).sort(), 'unrecorded runtime artifact');
 for (const file of ['dist/licenses/contracts-LICENSE', 'dist/licenses/contracts-NOTICE']) assert.ok(existsSync(join(dir, file)), 'compiled code notice missing');
 return { manifest, publicEntries: [...new Set(publicEntries)], reachable: [...seen].sort(), externals: [...externals].sort(), inventory, provenance };
}
export function inspectTarball(tgz, unpacked) {
 const names = execFileSync('tar', ['-tzf', tgz], { encoding: 'utf8' }).trim().split('\n');
 assert.ok(names.every(n => n.startsWith('package/') && !n.split('/').includes('..')), 'unsafe tarball path');
 execFileSync('tar', ['-xzf', tgz, '-C', unpacked]);
 return inspectPackage(join(unpacked, 'package'));
}
