// The released hanaworlds-contracts this Painter is pinned to: tag v0.5.3 at an
// exact commit (package.json dependency github:...#revision, package-lock resolved
// to the same commit). The version string alone is not an identity: an unreleased
// same-named 0.5.3 candidate existed. `npm run verify:contracts -- --package <tgz>`
// checks the lock revision and that the installed bytes equal the released pack.
export const ADMITTED_CONTRACTS = Object.freeze({
  name: 'hanaworlds-contracts', version: '0.5.3',
  origin: 'https://github.com/yzsnstotz/hanaworlds-contracts',
  tag: 'v0.5.3', tagObject: 'b3983bc5cde7791266758842a017458386d14283',
  revision: '3457493da209178f815d6950e323e1dc462e8d6c',
  packageSha256: '7f2b088b300426ea2536e08904780dc5df94eaf5e341e83cbff0cc3a42362241',
  packageBytes: 146045, packageFiles: 25,
});
