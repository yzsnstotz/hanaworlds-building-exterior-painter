// SOURCE/FIXTURE: deterministic image-panel engine outputs for fixed sample
// images, so two panel installs (e.g. the bundled Painter before and after a
// repack) can be compared byte-for-byte. Sample palette only; no session,
// world, model or Host.
//   node tools/panel-engine-receipt.mjs <panel engine.mjs> <out.json>
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const engine = resolve(process.argv[2]), out = resolve(process.argv[3]);
const panel = await import(pathToFileURL(engine));
const sharp = (await import(pathToFileURL(createRequire(engine).resolve('sharp')))).default;
const png = rgb => sharp(Buffer.from([...rgb, 255, ...rgb, 255]), { raw: { width: 2, height: 1, channels: 4 } }).png().toBuffer();
const noPeer = () => { throw new Error('sample path read a peer'); };
const samples = [['red', [141, 94, 83]], ['green', [75, 94, 37]], ['snow', [222, 230, 235]], ['black', [0, 0, 0]], ['white', [255, 255, 255]]];
const rows = [];
for (const [name, rgb] of samples)
  rows.push({ name, output: await panel.matchPanelImage({ imageBase64: (await png(rgb)).toString('base64'), session: null, get: noPeer }) });
rows.push({ name: 'non-image', output: await panel.matchPanelImage({ imageBase64: Buffer.from('a plain text file').toString('base64'), session: null, get: noPeer }) });
rows.push({ name: 'empty', output: await panel.matchPanelImage({ imageBase64: '', session: null, get: noPeer }) });
writeFileSync(out, JSON.stringify({ evidence: 'SOURCE/FIXTURE sample palette', engine, rows }, null, 2) + '\n');
console.log(JSON.stringify({ rows: rows.map(r => [r.name, r.output.material?.nodeName ?? r.output.code]) }));
