// The hanaworlds-contracts range this Painter depends on: package.json
// dependency git+https://github.com/yzsnstotz/hanaworlds-contracts.git#semver:<range>, resolved by npm
// against the released tags (package-lock records the resolved commit). No commit
// or pack-SHA pin: peers compare the contracts major only. Major 2, candidate
// v2.0.0-rc.1 (confirmed-placement/v1; after the formal v2.0.0 only the range becomes
// `^2.0.0`): painter/v6, painter-region/v3, ReferenceBrief/v5, BUILD/V4, SafetyProfile v4
// derived only from the player-confirmed SiteRules, a confirmed structured placement
// matched against the final effect set, no player geometry.
// `npm run verify:contracts` checks the spec, that npm resolves inside the range,
// and that the advertised handshake is the resolved package's own.
export const ADMITTED_CONTRACTS = Object.freeze({
  name: 'hanaworlds-contracts', range: '^2.0.0-rc.1',
  origin: 'https://github.com/yzsnstotz/hanaworlds-contracts',
  spec: 'git+https://github.com/yzsnstotz/hanaworlds-contracts.git#semver:^2.0.0-rc.1',
});
