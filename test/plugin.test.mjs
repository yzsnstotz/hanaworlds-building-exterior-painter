// FIXTURE: DSH plugin entry shape, visible configuration and import boundary.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import plugin, { apply, Config, SERVICE, name, inject } from '../src/index.mjs';
import * as F from './fixtures.mjs';

function fakeContext(services = {}) {
  const provided = new Map();
  const reads = [];
  return { provided, reads,
    get(serviceName) { reads.push(serviceName); return services[serviceName]; },
    provide(serviceName, value) { provided.set(serviceName, value); } };
}

test('plugin default export matches cordis plugin shape', () => {
  assert.equal(plugin.name, 'hanaworlds-building-exterior-painter');
  assert.equal(name, plugin.name);
  assert.deepEqual(inject, []);
  assert.equal(typeof plugin.apply, 'function');
  assert.equal(plugin.Config, Config);
});

test('Config declares every setting with its visible default', () => {
  assert.deepEqual(Config({}), { modelProvider: 'codex-oauth', modelId: 'gpt-5.6-luna' });
  const json = JSON.stringify(Config.toJSON());
  assert.match(json, /must accept image input/);
  assert.match(json, /Fixed invariants/);
});

test('apply provides the painter service and resolves host services per call', async () => {
  const services = {};
  const ctx = fakeContext(services);
  const painter = apply(ctx, Config({ modelId: 'gpt-5.6-luna' }));
  assert.equal(ctx.provided.get(SERVICE), painter);
  assert.equal(painter.describe().services.llm, false);
  services.hanaworldsAuthority = F.authority();
  services.llm = F.llm();
  services.attachments = F.attachments();
  const response = await painter.call('CreateBuildPlan', F.request());
  assert.equal(response.error.code, 'TARGET_FACTS_INCOMPLETE');
  assert.deepEqual([...new Set(ctx.reads)].sort(), ['attachments', 'hanaworldsAuthority', 'llm']);
  assert.equal(painter.describe().worldWrites, 0);
});

test('source imports only the contracts package, canonicalize, schemastery and node:crypto', async () => {
  const dir = new URL('../src/', import.meta.url);
  const allowed = new Set(['hanaworlds-contracts', 'canonicalize', '@deepseek-ai/schemastery', 'node:crypto',
    './planner.mjs', './model.mjs', './service.mjs']);
  for (const file of await readdir(dir)) {
    const source = await readFile(new URL(file, dir), 'utf8');
    for (const [, spec] of source.matchAll(/(?:import|export)[^'"]*from\s+'([^']+)'/g))
      assert.ok(allowed.has(spec), `${file} imports ${spec}`);
    assert.doesNotMatch(source, /hanaworldsCanvas|WorldAdapter|hanaworlds-brush|writeFile|child_process/, file);
  }
});
