const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const MeleeFetcher = require('../src/fetchers/melee');

function readFixture(name) {
  return fs.readFileSync(path.join(__dirname, 'data', name), 'utf8');
}

test('MeleeFetcher.parseHtml extracts basic profile info', () => {
  const html = readFixture('melee.html');
  const url = 'https://melee.gg/Profile/Index/k0shiii';
  const username = 'k0shiii';
  const fetcher = new MeleeFetcher();

  const result = fetcher.parseHtml(html, url, username);

  assert.ok(result, 'Should return a result object');
  assert.equal(result.source, 'Melee');
  assert.equal(result.url, url);
  assert.equal(result.name, 'Björn Kimminich');
  assert.ok(result.details && typeof result.details === 'object');
  // FIXME Photo intentionally not asserted because Melee blocks unauthenticated photo access per implementation
});
