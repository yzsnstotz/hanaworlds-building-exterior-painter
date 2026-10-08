// The released hanaworlds-contracts this Painter is pinned to: tag v0.5.3 at an
// exact commit (package.json dependency github:...#revision, package-lock resolved
// to the same commit). The version string alone is not an identity: an unreleased
// same-named 0.5.3 candidate existed. `npm run verify:contracts -- --package <tgz>`
// checks the lock revision and that the installed bytes equal the released pack.
export const ADMITTED_CONTRACTS = Object.freeze({
  name: 'hanaworlds-contracts', version: '0.5.4-rc.1',
  origin: 'https://github.com/yzsnstotz/hanaworlds-contracts',
  tag: 'v0.5.4-rc.1', tagObject: 'f2600bd84bbc6b53ae9b52a0baadeb5c1c8336ef',
  revision: '0beeff5774db476c0128683ca6107a28bdcdcbee',
  packageSha256: '51902797a167a222d812c344871bb1c0774ae775fb0026d70381edd4c08f17ed',
  packageBytes: 146045, packageFiles: 25,
});
