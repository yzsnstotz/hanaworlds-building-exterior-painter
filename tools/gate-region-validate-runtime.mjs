// Real Cordis (from the fixed App) loads the independently installed Painter.
// FIXTURE boundary: contracts region v1 port, Host current-facts business port,
// inspected world cells/catalogue. llm/attachments/world/canvas/adapter/brush are
// forbidden ports; any access fails the gate.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { createRegionContractFixture } from '../test/region-contract-fixture.mjs';
import { regionWorld, regionProposal, cellsOf, hostFacts } from '../test/region-v1-fixtures.mjs';
const [installed, app, evidence] = process.argv.slice(2), url = p => pathToFileURL(resolve(p));
const hash = b => createHash('sha256').update(b).digest('hex');
const pkg = await import(url(join(installed, 'src/index.mjs')));
const api = await import(url(join(installed, 'vendor/hanaworlds-contracts/dist/local/index.mjs')));
const fixture = JSON.parse(readFileSync(join(installed, 'vendor/hanaworlds-contracts/fixtures/local/main.json')));
const cordisFile = join(app, 'Contents/Resources/hanaworlds-dsh/node_modules/@deepseek-ai/cordis/lib/index.js');
const { Context } = await import(url(cordisFile));
const op = 'ValidateBuildProposal';
const ctx = new Context(); let forbiddenCalls = 0, reads = 0, facts = null;
const forbidden = new Proxy({}, { get(t, k) { if (typeof k === 'symbol') return Reflect.get(t, k); forbiddenCalls++; throw new Error('region entry accessed a forbidden port'); } });
for (const name of ['llm', 'attachments', 'world', 'canvas', 'adapter', 'brush']) ctx.provide(name, forbidden);
ctx.provide('hanaworldsPainterLocalFacts', { async read(body, operation) { assert.equal(operation, op); reads++; return structuredClone(facts); } });
const fiber = ctx.plugin(pkg.default, pkg.Config({})), results = [];
const STONE = { nodeName: 'fixture:stone', param2: 0 }, AIR = { nodeName: 'air', param2: 0 };
let serial = 0;
const make = (proposal, world) => { const r = regionWorld(api, fixture, world); r.proposal = proposal; r.requestId = `region-gate-${++serial}`; facts = hostFacts(fixture, r); return r; };
try {
  await fiber.await(); const service = ctx.get(pkg.SERVICE);
  // 1. As shipped (vendored contracts@0.4.2, no region port): refused, self-described.
  const fill = regionProposal({ palette: [STONE], cells: cellsOf([4, 3, 4], (x, y) => (y === 2 && x < 2 ? 0 : null)) });
  const none = await service.call(op, make(fill));
  assert.equal(none.error.code, 'CAPABILITY_UNAVAILABLE'); assert.equal(reads, 0);
  const shipped = service.describe().tools.find(t => t.name === 'BuildRegionProposal').availability;
  assert.equal(shipped.available, false);
  results.push({ case: 'shipped-no-region-port', error: none.error, availability: shipped });
  // 2. Explicit FIXTURE contracts region v1 port.
  service.regionContract = createRegionContractFixture(api);
  const filled = await service.call(op, JSON.stringify(make(fill)));
  assert.equal(filled.error, null); assert.deepEqual(filled.result.build.summary, { specified: 8, unspecified: 40, filled: 8, carved: 0, unchanged: 0 });
  results.push({ case: 'fill', buildDigest: filled.result.buildDigest, summary: filled.result.build.summary });
  const carve = regionProposal({ palette: [AIR], cells: cellsOf([4, 3, 4], (x, y, z) => (x === 0 && z === 0 ? 0 : null)) });
  const carved = await service.call(op, make(carve));
  assert.equal(carved.error, null); assert.deepEqual(carved.result.build.summary, { specified: 3, unspecified: 45, filled: 0, carved: 2, unchanged: 1 });
  results.push({ case: 'carve', buildDigest: carved.result.buildDigest, summary: carved.result.build.summary });
  const image = await service.call(op, make(fill, { media: true }));
  assert.equal(image.error, null);
  results.push({ case: 'fill-with-verified-image-media-brief', buildDigest: image.result.buildDigest });
  const minor = structuredClone(fill); minor.format.version = '1.9.4';
  assert.equal((await service.call(op, make(minor))).error, null);
  const major = structuredClone(fill); major.format.version = '2.0.0';
  const wrong = await service.call(op, make(major)); assert.equal(wrong.error.code, 'UNSUPPORTED_VERSION');
  const unknown = await service.call(op, make(regionProposal({ palette: [STONE], cells: cellsOf([4, 3, 4], (x, y, z) => (x === 3 && y === 2 && z === 3 ? 0 : null)) }), { unknown: [[3, 2, 6]] }));
  assert.equal(unknown.error.code, 'TARGET_FACTS_INCOMPLETE');
  results.push({ case: 'compat-and-rejections', sameMajorMinor: 'ACCEPTED', wrongMajor: wrong.error, unknownCell: unknown.error });
  service.regionContract = createRegionContractFixture(api, { version: '2.0.0' });
  const port2 = await service.call(op, make(fill)); assert.equal(port2.error.code, 'UNSUPPORTED_VERSION');
  results.push({ case: 'wrong-major-contract-port', error: port2.error });
  // 3. Text proposal on the same channel: exact public fixture response unchanged.
  facts = structuredClone(fixture.facts);
  const text = await service.call(op, structuredClone(fixture.request));
  assert.equal(api.canonicalJSON(text), api.canonicalJSON(fixture.response));
  results.push({ case: 'text-proposal-unchanged', buildDigest: text.result.buildDigest });
  assert.equal(forbiddenCalls, 0);
  const receipt = { evidence: 'REAL_OWN_INSTALLED_PACKAGE_IN_REAL_CORDIS; CONTRACTS_REGION_V1_PORT/HOST_FACTS/WORLD_CELLS/CATALOGUE_FIXTURE',
    node: process.version, painterVersion: JSON.parse(readFileSync(join(installed, 'package.json'))).version,
    contractsVendored: service.handshake().contracts, cordisFile, cordisSha256: hash(readFileSync(cordisFile)), results,
    hostFactReads: reads, forbiddenCalls, modelCalls: 0, worldWrites: 0,
    realContractsRegionV1: 'NOT_RUN (not delivered)', fullApp: 'NOT_RUN', realModel: 'NOT_RUN', realWorld: 'NOT_RUN', undo: 'NOT_RUN', realUI: 'NOT_RUN' };
  writeFileSync(join(evidence, 'runtime-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify(receipt, null, 2));
} finally { await fiber.dispose(); }
assert.equal(ctx.get(pkg.SERVICE), undefined);
