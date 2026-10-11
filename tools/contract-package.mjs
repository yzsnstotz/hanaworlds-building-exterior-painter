// Development-only released SDK identity and fixture access. Never packaged.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as contracts from 'hanaworlds-contracts';

const readJSON = specifier => JSON.parse(readFileSync(fileURLToPath(import.meta.resolve(specifier)), 'utf8'));

export { contracts };
/** Public contract fixture by name, e.g. 'main' or 'region'. */
export const contractFixture = name => readJSON(`hanaworlds-contracts/fixtures/${name}`);
/** package.json of the contracts package this Painter actually resolves. */
export const contractPackage = () => readJSON('hanaworlds-contracts/package.json');
/** Directory of the resolved contracts package (for byte-identity checks). */
export const contractPackageDir = () => fileURLToPath(new URL('.', import.meta.resolve('hanaworlds-contracts/package.json')));
