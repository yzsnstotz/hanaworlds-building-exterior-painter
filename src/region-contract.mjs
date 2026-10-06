// The one binding point for the public contracts region v1 port.
// Vendored hanaworlds-contracts@0.4.2 defines no region v1 wire, so there is
// no default port: a region proposal is refused with CAPABILITY_UNAVAILABLE and
// describe() reports why. When the real contracts region v1 package is vendored,
// this module exposes its port; nothing else in Painter changes.
export const regionContract = null;
export const REGION_CONTRACT_STATUS = Object.freeze({
  available: false,
  reason: 'hanaworlds-contracts@0.4.2 has no region v1 wire; needs the contracts region v1 package (S1-CONTRACT-REGION-V1-01).',
});
