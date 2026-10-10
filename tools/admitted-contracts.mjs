// The hanaworlds-contracts range this Painter depends on: package.json
// dependency git+https://github.com/yzsnstotz/hanaworlds-contracts.git#semver:<range>, resolved by npm
// against the released tags (package-lock records the resolved commit). No commit
// or pack-SHA pin: peers compare the contracts major only. Major 1, candidate
// v1.1.0-rc.1 (additive minor; after the formal v1.1.0 only the range becomes `^1.1.0`):
// painter/v5, painter-region/v2, ReferenceBrief/v4, BUILD/V4, SafetyProfile v4 derived only
// from the player-confirmed SiteRules, an optional confirmed structured placement
// (confirmed-placement/v1) matched against the final effect set, no player geometry.
// `npm run verify:contracts` checks the spec, that npm resolves inside the range,
// and that the advertised handshake is the resolved package's own.
export const ADMITTED_CONTRACTS = Object.freeze({
  name: 'hanaworlds-contracts', range: '^1.1.0-rc.1',
  origin: 'https://github.com/yzsnstotz/hanaworlds-contracts',
  spec: 'git+https://github.com/yzsnstotz/hanaworlds-contracts.git#semver:^1.1.0-rc.1',
});
