// Q228 review-phase aggregate: no automatic SDK wrapping, build, pack or install.
import test from 'node:test';
import assert from 'node:assert/strict';
import { doc, assertOwnSource } from './painter-review-harness.mjs';
import { baselineDoc, assertShape } from './painter-document-oracle.mjs';
import './painter-registration-review.mjs';
import './painter-proposals-review.mjs';
import './painter-helpers-review.mjs';
import './painter-source-errors-review.mjs';
import './painter-budgets-review.mjs';
import './painter-admission-review.mjs';
import './painter-currentness-review.mjs';

test('document admission retains complete D122 closure and real gates',()=>{
 assert.equal(Object.keys(baselineDoc.definitions).length,145);
 assert.deepEqual(doc.legacyDefinitions,baselineDoc.definitions);
 assert.equal(Object.keys(doc.definitions).length,192);
 assert.equal(doc.contractRevision.major,3);
 assert.equal(doc.contractRevision.status,'APPEND_READY');
 assert.equal(doc.consumption.authorizationClosed,false);
 assert.equal(doc.v3Direction.authorizationClosed,false);
 assert.equal(doc.v3Direction.sourceLegalityComplete,false);
 assert.equal(doc.v3Direction.consumerMigrationComplete,false);
 assert.deepEqual(doc.authorizationEvidence,[]);
 assert.deepEqual(doc.registrationIO.apply.provides,doc.consumption.registeredServices);
 for(const row of doc.examples){
  if(row.requestAdmitted)assertShape(row.requestType,row.request);
  if(row.expected)assertShape(row.responseType,row.expected);
  if(row.facts!==null && row.factsType!==null)assertShape(row.factsType,row.facts);
 }
 for(const row of doc.helpers){assertShape(row.requestType,row.request);assertShape(row.responseType,row.expected);}
 for(const row of doc.sourceErrorCases){
  assertShape(row.schemaType,row.originalPublicError);
  assertShape(row.operation+'Request',row.request);
  assertShape(row.operation+'Response',row.expectedResponse);
  assertShape(row.operation+'Response',row.recoveryExpected);
  assertShape(row.factsType,row.facts);
  assert.deepEqual(row.expectedResponse.error,row.originalPublicError);
 }
});
test('source migration removes retired SDK from production and development supply',assertOwnSource);
