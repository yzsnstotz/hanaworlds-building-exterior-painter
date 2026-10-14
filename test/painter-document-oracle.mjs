import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual, types } from 'node:util';

// Independent document oracle: it never imports the Painter or its validator.
export const documentPath = process.env.PAINTER_TEST_PACKAGE
  ? '/Users/yzliu/work/Docs/Projects/hana-world/contracts/C-painter.md'
  : new URL('../../contract-add/C-painter.md', import.meta.url);
export const documentText = readFileSync(documentPath, 'utf8');
const blocks = [...documentText.matchAll(/```json\n([\s\S]*?)\n```/g)];
assert.ok(blocks.length, 'The reviewed complete C-painter JSON body is required.');
export const documentJSON = blocks.at(-1)[1];
export const documentSHA = createHash('sha256').update(documentJSON).digest('hex');
assert.equal(documentSHA, 'f448ecd52e9e0c98b32a74709cce32a606a36e95e02774743689c6c2ac81d727', 'Use the complete Q247 whole-review candidate body.');
const baselineJSON = blocks.map(b=>b[1]).find(b=>createHash('sha256').update(b).digest('hex')==='774f645db6a02d44afd1352e116b792f89f3a2c7afe72f082d8b6b6fe9f8c8ad');
assert.ok(baselineJSON, 'Original complete D122 body must remain byte-for-byte.');
const q241JSON = blocks.map(b=>b[1]).find(b=>createHash('sha256').update(b).digest('hex')==='52fb910a4a0f688b65a7e66fad036c716415ee7c83634621059f6e33242827d0');
assert.ok(q241JSON, 'Complete D143/Q241 body must remain byte-for-byte.');
export const q241Doc = JSON.parse(q241JSON);
if (!process.env.PAINTER_TEST_PACKAGE) assert.equal(createHash('sha256').update(documentText.split('\n\n## Q247 三既有操作逐路径闭合')[0]).digest('hex'),'100848fe2b4b83ad34f18dcd1fe35c3bd27a8c716ced38999c9c11088c231ee9', 'All prior D122/D143 text, not just JSON, must remain byte-for-byte.');
export const baselineDoc = JSON.parse(baselineJSON);
export const doc = JSON.parse(documentJSON);
assert.equal(doc.format, 'c-painter-candidate/v3');
assert.equal(Object.keys(baselineDoc.definitions).length,145);
assert.deepEqual(doc.legacyDefinitions,baselineDoc.definitions);
assert.equal(Object.keys(doc.definitions).length,192);

function inspectRefs(value) {
  if (!value || typeof value !== 'object') return;
  if ('$ref' in value) {
    assert.match(value.$ref, /^#\/definitions\/[^/]+$/);
    assert.ok(Object.hasOwn(doc.definitions, value.$ref.slice(14)), `Unresolved ${value.$ref}`);
  }
  for (const child of Object.values(value)) inspectRefs(child);
}
inspectRefs(doc.definitions);

export function example(id) {
  const value = doc.examples.find(item => item.id === id);
  assert.ok(value, `Missing complete document example ${id}`);
  return structuredClone(value);
}

function unicodeScalar(value) {
  return !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value);
}

function strictJSON(value, path, ancestors = new Set()) {
  if (value === null || typeof value === 'boolean') return;
  if (typeof value === 'string') {
    assert.ok(unicodeScalar(value), `${path}: Unicode scalar string required`);
    return;
  }
  if (typeof value === 'number') {
    assert.ok(Number.isFinite(value), `${path}: finite number required`);
    return;
  }
  assert.equal(typeof value, 'object', `${path}: strict JSON value required`);
  assert.ok(!types.isProxy(value), `${path}: proxies are not JSON records`);
  assert.ok(!ancestors.has(value), `${path}: cyclic JSON value`);
  assert.ok(Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null, `${path}: plain JSON record required`);
  ancestors.add(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  assert.equal(Object.getOwnPropertySymbols(value).length, 0, `${path}: symbol keys are not JSON`);
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (Array.isArray(value) && key === 'length') continue;
    assert.ok(unicodeScalar(key), `${path}: Unicode scalar key required`);
    assert.ok('value' in descriptor && descriptor.enumerable, `${path}.${key}: enumerable data descriptor required`);
    strictJSON(descriptor.value, `${path}.${key}`, ancestors);
  }
  if (Array.isArray(value)) {
    assert.equal(Object.keys(descriptors).length, value.length + 1, `${path}: dense array without extra keys required`);
    for (let index = 0; index < value.length; index++) assert.ok(Object.hasOwn(descriptors, index), `${path}: sparse array`);
  }
  ancestors.delete(value);
}

function accepts(schema, value, path) {
  try { validate(schema, value, path); return true; } catch (error) {
    if (error instanceof assert.AssertionError) return false;
    throw error;
  }
}

function validate(schema, value, path) {
  if (schema === true) return;
  assert.notEqual(schema, false, `${path}: rejected by schema`);
  if (schema.$ref) validate(doc.definitions[schema.$ref.slice(14)], value, path);
  if (schema.anyOf) assert.ok(schema.anyOf.some(branch => accepts(branch, value, path)), `${path}: no anyOf branch admits value`);
  if (schema.oneOf) assert.equal(schema.oneOf.filter(branch => accepts(branch, value, path)).length, 1, `${path}: exactly one oneOf branch required`);
  if (Object.hasOwn(schema, 'const')) assert.ok(isDeepStrictEqual(value, schema.const), `${path}: const mismatch`);
  if (schema.enum) assert.ok(schema.enum.some(item => isDeepStrictEqual(value, item)), `${path}: enum mismatch`);
  if (schema.type) {
    const matches = type => type === 'null' ? value === null
      : type === 'array' ? Array.isArray(value)
      : type === 'object' ? value !== null && typeof value === 'object' && !Array.isArray(value)
      : type === 'integer' ? Number.isSafeInteger(value)
      : type === 'number' ? typeof value === 'number' && Number.isFinite(value)
      : typeof value === type;
    assert.ok((Array.isArray(schema.type) ? schema.type : [schema.type]).some(matches), `${path}: expected ${schema.type}`);
  }
  if (typeof value === 'number') {
    if (Object.hasOwn(schema, 'minimum')) assert.ok(value >= schema.minimum, `${path}: minimum`);
    if (Object.hasOwn(schema, 'maximum')) assert.ok(value <= schema.maximum, `${path}: maximum`);
    if (Object.hasOwn(schema, 'exclusiveMinimum')) assert.ok(value > schema.exclusiveMinimum, `${path}: exclusiveMinimum`);
  }
  if (typeof value === 'string') {
    if (Object.hasOwn(schema, 'minLength')) assert.ok([...value].length >= schema.minLength, `${path}: minLength`);
    if (schema.pattern) assert.ok(new RegExp(schema.pattern, 'u').test(value), `${path}: pattern`);
  }
  if (Array.isArray(value)) {
    if (Object.hasOwn(schema, 'minItems')) assert.ok(value.length >= schema.minItems, `${path}: minItems`);
    if (Object.hasOwn(schema, 'maxItems')) assert.ok(value.length <= schema.maxItems, `${path}: maxItems`);
    if (schema.uniqueItems) for (let i = 0; i < value.length; i++) for (let j = 0; j < i; j++) assert.ok(!isDeepStrictEqual(value[i], value[j]), `${path}: uniqueItems`);
    if (Array.isArray(schema.items)) {
      for (let i = 0; i < value.length; i++) {
        if (i < schema.items.length) validate(schema.items[i], value[i], `${path}[${i}]`);
        else if (schema.additionalItems === false) assert.fail(`${path}: additionalItems`);
        else if (schema.additionalItems && typeof schema.additionalItems === 'object') validate(schema.additionalItems, value[i], `${path}[${i}]`);
      }
    } else if (schema.items) value.forEach((item, i) => validate(schema.items, item, `${path}[${i}]`));
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const keys = Object.keys(value);
    if (Object.hasOwn(schema, 'minProperties')) assert.ok(keys.length >= schema.minProperties, `${path}: minProperties`);
    for (const key of schema.required ?? []) assert.ok(Object.hasOwn(value, key), `${path}.${key}: required`);
    for (const key of keys) {
      if (schema.propertyNames) validate(schema.propertyNames, key, `${path}: key ${key}`);
      if (Object.hasOwn(schema.properties ?? {}, key)) validate(schema.properties[key], value[key], `${path}.${key}`);
      else if (schema.additionalProperties === false) assert.fail(`${path}.${key}: additionalProperties`);
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') validate(schema.additionalProperties, value[key], `${path}.${key}`);
    }
  }
}

// Byte lists stay encoded here; the caller restores actual Uint8Array inputs.
// x-* comments describe business rules, checked at public-entry suites separately.
export function assertShape(type, value) {
  assert.ok(Object.hasOwn(doc.definitions, type), `Unknown document definition ${type}`);
  strictJSON(value, type);
  validate(doc.definitions[type], value, type);
  return value;
}
