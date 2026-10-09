// The hanaworlds-contracts range this Painter depends on: package.json
// dependency github:yzsnstotz/hanaworlds-contracts#semver:<range>, resolved by npm
// against the released tags (package-lock records the resolved commit). No commit
// or pack-SHA pin: peers compare the contracts major only. Floor 0.5.6: the first
// release whose checkContractsVersion / checkContractHandshake decide by major
// (0.5.4 carried painter/v4, painter-region/v1, ReferenceBrief/v3,
// MaterialSources and ProtocolHandshake but still compared the whole version).
// `npm run verify:contracts` checks the spec, that npm resolves inside the range,
// and that the advertised handshake is the resolved package's own.
export const ADMITTED_CONTRACTS = Object.freeze({
  name: 'hanaworlds-contracts', range: '^0.5.6',
  origin: 'https://github.com/yzsnstotz/hanaworlds-contracts',
  spec: 'github:yzsnstotz/hanaworlds-contracts#semver:^0.5.6',
});
