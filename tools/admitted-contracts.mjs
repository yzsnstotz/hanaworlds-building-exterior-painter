// The hanaworlds-contracts range this Painter depends on: package.json
// dependency github:yzsnstotz/hanaworlds-contracts#semver:<range>, resolved by npm
// against the released tags (package-lock records the resolved commit). No commit
// or pack-SHA pin: peers compare the contracts major only. Major 1 (candidate
// floor 1.0.0-rc.1): painter/v5, painter-region/v2, ReferenceBrief/v4, BUILD/V4,
// SafetyProfile v4 derived only from the player-confirmed SiteRules, no player
// geometry. After the formal v1.0.0 release only the range becomes ^1.0.0.
// `npm run verify:contracts` checks the spec, that npm resolves inside the range,
// and that the advertised handshake is the resolved package's own.
export const ADMITTED_CONTRACTS = Object.freeze({
  name: 'hanaworlds-contracts', range: '^1.0.0-rc.1',
  origin: 'https://github.com/yzsnstotz/hanaworlds-contracts',
  spec: 'github:yzsnstotz/hanaworlds-contracts#semver:^1.0.0-rc.1',
});
