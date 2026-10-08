// Switch the contracts pin in one step (run in the package root, then `npm install`):
//   node tools/repin-contracts.mjs --spec <npm dependency spec> --version <x.y.z[-pre]>
// Points the three package.json "#contracts" imports at the hanaworlds-contracts
// dependency <spec>, drops the vendor copy and "vendor" from "files", and sets the
// pinned version in tools/admitted-contracts.mjs. Only a released reference may be
// committed; a candidate tarball spec (file:...) is for an uncommitted test copy only.
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const opt = name => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : undefined; };
const spec = opt('spec'), version = opt('version');
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

const admittedPath = new URL('tools/admitted-contracts.mjs', root), admitted = readFileSync(admittedPath, 'utf8');
const pinned = admitted.replace(/version: '[^']*'/, `version: '${version}'`);
if (pinned === admitted && !admitted.includes(`version: '${version}'`)) throw new Error('admitted version not found');
writeFileSync(admittedPath, pinned);
console.log(JSON.stringify({ spec, version, imports: pkg.imports, files: pkg.files }));
