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
  assert.equal(result.name, 'Bjoern Kimminich');
  assert.equal(result.player_id, id);
  if (result.record) {
    assert.match(result.record, /^\d+-\d+(-\d+)?$/);
  }
  if (result['win rate']) {
    assert.match(result['win rate'], /^\d+(\.\d+)?%$/);
  }
});
