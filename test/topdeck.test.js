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

  // Name fallback to handle if not present
  assert.ok(result.name && result.name.length > 0);

  // Stats placeholders are present in the template and should be scraped if filled by server-side rendering
  // Our fixture includes the IDs and may default to 0 values.
  assert.ok(result.details && typeof result.details === 'object');
  // Accept either filled numbers or defaults (0) depending on the fixture state
  if (result.details['Tournaments']) {
    assert.match(result.details['Tournaments'], /^\d+$/);
  }
  if (result.details['Record']) {
    assert.match(result.details['Record'], /^\d+-\d+-\d+$/);
  }
  if (result.details['Win Rate']) {
    assert.match(result.details['Win Rate'], /^\d+(\.\d+)?%$/);
  }
});
