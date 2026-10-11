import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
// The actual boundary process packs a tgz and re-enters prepack. Only that
// live ancestor with an exclusive active receipt can terminate recursion.
function isBoundaryChild() {
 try {
  const receipt = JSON.parse(readFileSync(process.env.PAINTER_BOUNDARY_RECEIPT, 'utf8'));
  if (receipt.kind !== 'painter-boundary-pack/v1' || receipt.active !== true ||
      receipt.root !== resolve(new URL('..', import.meta.url).pathname) ||
      receipt.nonce !== process.env.PAINTER_BOUNDARY_NONCE || !Number.isInteger(receipt.parentPid)) return false;
  let pid = process.ppid;
  for (let n = 0; n < 8 && pid > 1; n++) {
   if (pid === receipt.parentPid) return true;
   pid = Number(execFileSync('ps', ['-o', 'ppid=', '-p', String(pid)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim());
  }
 } catch { /* A missing, stale or external marker is a normal full prepack. */ }
 return false;
}
execFileSync('npm', ['run', isBoundaryChild() ? 'build:runtime' : 'build'], { stdio: ['ignore', 2, 2] });
