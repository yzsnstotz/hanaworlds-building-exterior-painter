// Switch the contracts pin in one step (run in the package root, then `npm install`):
//   node tools/repin-contracts.mjs --spec <npm dependency spec> --version <x.y.z[-pre]> [--sha256 <pack sha256>] [--tag <tag> --tag-object <sha>] [--package <tgz>]
// Points the three package.json "#contracts" imports at the hanaworlds-contracts
// dependency <spec>, drops the vendor copy and "vendor" from "files", and sets the
// pinned identity in tools/admitted-contracts.mjs (version; revision from a
// `#<commit>` spec; package sha256, tag and tag object from their options; each
// cleared when not given, so no field keeps a previous pin's value; bytes and
// file count are read from --package). Only a released reference may be
// committed; a candidate tarball spec (file:...) is for an uncommitted test copy only.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const opt = name => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : undefined; };
const spec = opt('spec'), version = opt('version'), packageSha256 = opt('sha256') ?? '';
const tag = opt('tag') ?? '', tagObject = opt('tag-object') ?? '', tarball = opt('package');
const packageBytes = tarball ? statSync(tarball).size : 0;
const packageFiles = tarball ? execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' }).split('\n').filter(l => l && !l.endsWith('/')).length : 0;
const revision = /#([0-9a-f]{40})$/.exec(spec ?? '')?.[1] ?? '';
if (!spec || !version) throw new Error('usage: repin-contracts.mjs --spec <npm spec> --version <version>');
const root = new URL('..', import.meta.url);

const pkgPath = new URL('package.json', root), pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.imports = { ...pkg.imports,
  '#contracts': 'hanaworlds-contracts',
  '#contracts/fixtures/*': 'hanaworlds-contracts/fixtures/*',
  '#contracts/package.json': 'hanaworlds-contracts/package.json' };
pkg.files = pkg.files.filter(f => f !== 'vendor');
pkg.dependencies = Object.fromEntries(Object.entries({ ...pkg.dependencies, 'hanaworlds-contracts': spec })
  .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

rmSync(fileURLToPath(new URL('vendor/hanaworlds-contracts', root)), { recursive: true, force: true });
const vendor = fileURLToPath(new URL('vendor', root));
try { if (readdirSync(vendor).length === 0) rmSync(vendor, { recursive: true }); } catch (e) { if (e.code !== 'ENOENT') throw e; }

const admittedPath = new URL('tools/admitted-contracts.mjs', root), admitted = readFileSync(admittedPath, 'utf8');
const pinned = admitted.replace(/version: '[^']*'/, `version: '${version}'`)
  .replace(/revision: '[^']*'/, `revision: '${revision}'`).replace(/packageSha256: '[^']*'/, `packageSha256: '${packageSha256}'`)
  .replace(/tag: '[^']*'/, `tag: '${tag}'`).replace(/tagObject: '[^']*'/, `tagObject: '${tagObject}'`)
  .replace(/packageBytes: \d+/, `packageBytes: ${packageBytes}`).replace(/packageFiles: \d+/, `packageFiles: ${packageFiles}`);
if (pinned === admitted && !admitted.includes(`version: '${version}'`)) throw new Error('admitted version not found');
writeFileSync(admittedPath, pinned);
console.log(JSON.stringify({ spec, version, revision, packageSha256, tag, tagObject, packageBytes, packageFiles, imports: pkg.imports, files: pkg.files }));
