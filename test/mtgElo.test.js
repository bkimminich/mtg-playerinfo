const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const MtgEloFetcher = require('../src/fetchers/mtgElo');

function readFixture(name) {
  return fs.readFileSync(path.join(__dirname, 'data', name), 'utf8');
}

test('MtgEloFetcher.parseHtml extracts name and details including computed Win Rate', () => {
  const html = readFixture('mtgElo.html');
  const id = 'bjoern-kimminich';
  const url = `https://mtgeloproject.net/profile/${id}`;
  const fetcher = new MtgEloFetcher();

  const result = fetcher.parseHtml(html, url, id);

  assert.ok(result, 'Should return a result object');
  assert.equal(result.source, 'MTG Elo Project');
  assert.equal(result.url, url);
  assert.ok(result.name && result.name.length > 0);

  assert.ok(result.details);
  assert.equal(result.details.player_id, id);
  if (result.details.record) {
    assert.match(result.details.record, /^\d+-\d+(-\d+)?$/);
  }
  if (result.details['Win Rate']) {
    assert.match(result.details['Win Rate'], /^\d+(\.\d+)?%$/);
  }
});
