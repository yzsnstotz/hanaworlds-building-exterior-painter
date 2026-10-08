// The released hanaworlds-contracts this Painter is pinned to: tag v0.5.4 at an
// exact commit (package.json dependency github:...#revision, package-lock resolved
// to the same commit). The version string alone is not an identity: an unreleased
// same-named candidate existed (0.5.3 stage A; 0.5.4-rc.1 has its own bytes). `npm run verify:contracts -- --package <tgz>`
// checks the lock revision and that the installed bytes equal the released pack.
export const ADMITTED_CONTRACTS = Object.freeze({
  name: 'hanaworlds-contracts', version: '0.5.4',
  origin: 'https://github.com/yzsnstotz/hanaworlds-contracts',
  tag: 'v0.5.4', tagObject: 'b3721db855ffe08dfa524e6eea6a5da4eed4c220',
  revision: '85687fc3811e4c8ee6e69410d46d8026e19d2c75',
  packageSha256: 'b920097dee8bf57ef44cc9ca964829e568b14c9e1b15a77bf4599f69391062ec',
  packageBytes: 157837, packageFiles: 26,
});
