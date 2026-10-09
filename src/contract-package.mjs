// The one place Painter locates its resolved hanaworlds-contracts package.
// Code, tests, the dev page and tools resolve the API, the public fixtures and
// the package identity through package.json "imports" (#contracts...), so a
// range change touches only package.json and tools/admitted-contracts.mjs.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as contracts from '#contracts';

const readJSON = specifier => JSON.parse(readFileSync(fileURLToPath(import.meta.resolve(specifier)), 'utf8'));

export { contracts };
/** Public contract fixture by name, e.g. 'main' or 'region'. */
export const contractFixture = name => readJSON(`#contracts/fixtures/${name}`);
/** package.json of the contracts package this Painter actually resolves. */
export const contractPackage = () => readJSON('#contracts/package.json');
/** Directory of the resolved contracts package (for byte-identity checks). */
export const contractPackageDir = () => fileURLToPath(new URL('.', import.meta.resolve('#contracts/package.json')));
