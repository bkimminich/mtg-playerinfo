const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const TopdeckFetcher = require('../src/fetchers/topdeck');

function readFixture(name) {
  return fs.readFileSync(path.join(__dirname, 'data', name), 'utf8');
}

test('TopdeckFetcher.parseHtml extracts stats from DOM when available', () => {
  const html = readFixture('topdeck.html');
  const handle = '@k0shiii';
  const url = `https://topdeck.gg/profile/${handle}`;
  const fetcher = new TopdeckFetcher();

  const result = fetcher.parseHtml(html, url, handle);

  assert.ok(result, 'Should return a result object');
  assert.equal(result.source, 'Topdeck');
  assert.equal(result.url, url);
  assert.equal(result.name, 'Björn Kimminich');
  if (result['tournaments']) {
    assert.match(result['tournaments'], /^\d+$/);
  }
  if (result['record']) {
    assert.match(result['record'], /^\d+-\d+-\d+$/);
  }
  if (result['win rate']) {
    assert.match(result['win rate'], /^\d+(\.\d+)?%$/);
  }
});
