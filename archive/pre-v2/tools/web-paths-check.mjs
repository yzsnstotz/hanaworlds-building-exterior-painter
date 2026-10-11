// SOURCE/FIXTURE: the dev page server on an ephemeral 127.0.0.1 port (never a
// registered service port) answers 127.0.0.1 and localhost, query strings and
// trailing link text, and still refuses other hosts and origins.
//   node tools/web-paths-check.mjs [out.json]
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { writeFileSync } from 'node:fs';
import { createImageWebServer } from '../image-material-web/server.mjs';

const server = createImageWebServer();
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const port = server.address().port;
const get = (path, host, origin) => new Promise((ok, fail) => {
  const headers = { host }; if (origin) headers.origin = origin;
  request({ host: '127.0.0.1', port, path, headers }, res => {
    let body = ''; res.on('data', d => { body += d; });
    res.on('end', () => ok({ status: res.statusCode, location: res.headers.location ?? null, code: /"code":"([A-Z_]+)"/.exec(body)?.[1] ?? null }));
  }).on('error', fail).end();
});
const cases = [
  ['127 /validate', '/validate', `127.0.0.1:${port}`, null, { status: 200 }],
  ['127 /image', '/image', `127.0.0.1:${port}`, null, { status: 200 }],
  ['localhost /validate', '/validate', `localhost:${port}`, null, { status: 200 }],
  ['localhost /image', '/image', `localhost:${port}`, null, { status: 200 }],
  ['query /validate?x=1', '/validate?x=1&y=2', `127.0.0.1:${port}`, null, { status: 200 }],
  ['query /image?from=chat', '/image?from=chat', `localhost:${port}`, null, { status: 200 }],
  ['trailing text after /validate', '/validate%E3%80%82%E8%AF%B7%E6%89%93%E5%BC%80', `127.0.0.1:${port}`, null, { status: 302, location: '/validate' }],
  ['trailing text after /image', '/image)', `localhost:${port}`, null, { status: 302, location: '/image' }],
  ['root redirects to /image', '/', `127.0.0.1:${port}`, null, { status: 302, location: '/image' }],
  ['localhost same origin', '/validate', `localhost:${port}`, `http://localhost:${port}`, { status: 200 }],
  ['other host refused', '/validate', `evil.example:${port}`, null, { status: 403, code: 'LOCAL_HOST_REQUIRED' }],
  ['other origin refused', '/validate', `127.0.0.1:${port}`, 'http://evil.example', { status: 403, code: 'SAME_ORIGIN_REQUIRED' }],
];
const rows = [];
try {
  for (const [name, path, host, origin, want] of cases) {
    const got = await get(path, host, origin);
    rows.push({ name, path, host, origin, got });
    for (const [k, v] of Object.entries(want)) assert.equal(got[k], v, `${name}: ${k}`);
  }
} finally {
  await new Promise(ok => server.close(ok));
}
const receipt = { evidence: 'SOURCE/FIXTURE ephemeral 127.0.0.1 port', port, rows, result: 'PASS' };
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ result: 'PASS', cases: rows.length }));
