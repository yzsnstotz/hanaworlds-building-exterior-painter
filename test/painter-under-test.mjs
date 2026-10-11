import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = process.env.PAINTER_TEST_PACKAGE;
export const Painter = await import(root ? pathToFileURL(resolve(root, 'dist/index.mjs')).href : '../src/index.mjs');
