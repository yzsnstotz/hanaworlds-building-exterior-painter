// FIXTURE ONLY: a stand-in for the public contracts region v1 port, built from
// S1-CONTRACT-REGION-V1-01 CARD public shape on top of real contracts@0.4.2
// primitives. It is not the delivered contracts package; field names and the
// fixture request/build digests are replaced by the real port when it lands.
import { createHash } from 'node:crypto';

const WIRE = 'painter/v4', OP = 'ValidateBuildProposal';
// Placeholder only so 0.4.2 can check everything outside `proposal`.
const OUTER = { decision: 'BUILD', materials: { o: { nodeName: 'air', param2: 0 } },
  boxes: [{ min: [0, 0, 0], max: [0, 0, 0], materialRef: 'o' }] };

export function createRegionContractFixture(api, { version = '1.0.0', capabilities = ['palette-v1', 'air-carve', 'unspecified-skip'] } = {}) {
  const { ContractError, validateBoundRequest, validateType, validateResponse, validateDigestBinding,
    validateRegionInspection, digestValue, canonicalJSON, schemaBundle, deepFreeze } = api;
  const need = (ok, code, reason, phase = 'validate') => { if (!ok) throw new ContractError(code, phase, reason); };
  const same = (a, b) => canonicalJSON(a) === canonicalJSON(b);
  const exact = (v, keys) => v !== null && typeof v === 'object' && !Array.isArray(v) &&
    Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
  const sha = text => createHash('sha256').update(text).digest('hex');
  function outer(input) {
    need(input !== null && typeof input === 'object' && Object.hasOwn(input, 'proposal'), 'SCHEMA_INVALID', 'INVALID_SHAPE', 'decode');
    const { proposal, ...rest } = input;
    validateBoundRequest(WIRE, OP, { ...rest, proposal: OUTER });
    // fixture region proposal schema: exact keys, region v1 shapes
    need(exact(proposal, ['decision', 'format', 'region']) && proposal.decision === 'BUILD_REGION' &&
      exact(proposal.format, ['protocol', 'version', 'requires']) &&
      exact(proposal.region, ['min', 'size', 'axisOrder', 'palette', 'cells']), 'UNKNOWN_REQUIRED_FIELD', 'UNKNOWN_FIELD', 'decode');
    return deepFreeze(structuredClone(input));
  }
  const requestDigest = r => sha(`HanaWorlds|region-v1-FIXTURE|request|${WIRE}|${OP}|${canonicalJSON(r)}`);
  return Object.freeze({
    fixture: true,
    contracts: 'hanaworlds-contracts@region-v1-FIXTURE',
    regionProtocol: Object.freeze({ protocol: 'hanaworlds-region-voxels', version, capabilities: Object.freeze([...capabilities]) }),
    requestDigest,
    validateRegionRequest: outer,
    /** Same Session/world/connection/brief (with media) context rules as text proposals. */
    validateRegionContext(input, factsInput) {
      const request = outer(input);
      const facts = validateType('BuildProposalProviderFacts', factsInput);
      const rf = facts.requestFacts;
      need(request.sessionRef === rf.sessionRef, 'TRANSACTION_CONFLICT', 'PAYLOAD_CHANGED');
      need(same(request.localContext, rf.currentContext), 'CURRENT_WORLD_MISMATCH', 'REVISION_CHANGED');
      need(request.turnRevision === rf.currentTurnRevision, 'TURN_REVISION_MISMATCH', 'REVISION_CHANGED');
      need(request.referenceBriefDigest === rf.currentBriefDigest, 'TRANSACTION_CONFLICT', 'PAYLOAD_CHANGED');
      need(rf.requestState !== 'CANCELLED', 'REQUEST_CANCELLED', 'REVISION_CHANGED');
      need(rf.requestState !== 'UNKNOWN', 'REQUEST_NOT_ACTIVE', 'REQUIRED_FACT_UNKNOWN');
      const hash = requestDigest(request);
      need(rf.replay !== 'CONFLICT', 'TRANSACTION_CONFLICT', 'PAYLOAD_CHANGED');
      if (rf.replay === 'NEW') need(rf.priorRequestDigest === null && rf.requestState === 'ACTIVE', 'TRANSACTION_CONFLICT', 'PAYLOAD_CHANGED');
      else need(rf.priorRequestDigest === hash && rf.requestState === 'COMPLETED', 'TRANSACTION_CONFLICT', 'PAYLOAD_CHANGED');
      const { intent, referenceBrief: brief, targetFacts: tf } = request;
      need(intent.confirmedIntent.kind === 'BUILD_STRUCTURE' && intent.confirmedIntent.confirmedTurnRevision === request.turnRevision &&
        intent.intendedWorldRef === request.worldRef && intent.referenceBriefDigest === request.referenceBriefDigest &&
        brief.sessionRef === request.sessionRef && brief.turnRevision === request.turnRevision &&
        brief.text.trim().length > 0, 'INTENT_UNCONFIRMED', 'REQUIRED_FACT_UNKNOWN');
      need(tf.source === 'REGION_INSPECTED', 'TARGET_REQUIRED', 'REQUIRED_FACT_UNKNOWN');
      const ri = validateRegionInspection(request.regionInspection);
      need(tf.worldRef === request.worldRef && same(ri.targetFacts, tf) && ri.evidence.worldRef === request.worldRef &&
        ri.evidence.worldRevision === tf.worldRevision, 'TARGET_FACTS_STALE', 'REVISION_CHANGED');
      need(request.safetyProfile.requireBodyClearance, 'CAPABILITY_UNAVAILABLE', 'POLICY_UNAVAILABLE');
      const keys = Object.keys(schemaBundle.definitions.BuildProposalContext.properties);
      const context = Object.fromEntries(keys.map(k => [k, request[k]]));
      need(same(context, facts.sourceContext) && same(context, facts.currentContext), 'TARGET_FACTS_STALE', 'REVISION_CHANGED');
      return deepFreeze({ request, requestDigest: hash, disposition: rf.replay === 'NEW' ? 'EXECUTE' : 'RETURN_STORED' });
    },
    regionBuildDigest: build => sha(`HanaWorlds|region-v1-FIXTURE|build|${canonicalJSON(build)}`),
    validateRegionResponse(input, response) {
      const request = outer(input);
      if (response.error !== null) return validateResponse(WIRE, OP, response);
      need(exact(response, ['contractVersion', 'requestId', 'result', 'error']) && response.requestId === request.requestId &&
        response.result.invocationId === request.invocationId, 'TRANSACTION_CONFLICT', 'PAYLOAD_CHANGED');
      const { build, buildDigest } = response.result;
      need(buildDigest === sha(`HanaWorlds|region-v1-FIXTURE|build|${canonicalJSON(build)}`), 'TRANSACTION_CONFLICT', 'PAYLOAD_CHANGED');
      need(build.contractVersion === 'BUILD-REGION/v1' && same(build.coordinateFrame, request.regionInspection.frame) &&
        same(build.evidence, request.regionInspection.evidence) &&
        build.catalogueDigest === digestValue('catalogue', request.catalogue).sha256 &&
        build.targetFactsDigest === request.targetFactsDigest && build.safetyProfileDigest === request.safetyProfileDigest,
        'TARGET_FACTS_STALE', 'REVISION_CHANGED');
      validateDigestBinding('frame', build.coordinateFrame, request.targetFacts.frameDigest);
      return deepFreeze(structuredClone(response));
    },
  });
}
