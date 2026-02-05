const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const UnityLeagueFetcher = require('../src/fetchers/unityLeague');

function readFixture(name) {
  return fs.readFileSync(path.join(__dirname, 'data', name), 'utf8');
}

test('UnityLeagueFetcher.parseHtml extracts profile, photo, ranks and stats', () => {
  const html = readFixture('unityLeague.html');
  const url = 'https://unityleague.gg/player/16215/';
  const fetcher = new UnityLeagueFetcher();

  const result = fetcher.parseHtml(html, url);

  assert.ok(result, 'Should return a result object');
  assert.equal(result.source, 'Unity League');
  assert.equal(result.url, url);
  assert.equal(result.name, 'Björn Kimminich');

  // Photo
  assert.equal(result.photo, 'https://unityleague.gg/media/player_profile/1000023225.jpg');

  // Country from header flag
  assert.equal(result.details.Country, 'de');

  // Ranks from the table (numbers only per parser)
  assert.equal(result.details['Rank Germany'], '64');
  assert.equal(result.details['Rank Europe'], '562');
  assert.equal(result.details['Rank Points'], '292');

  // Overall record + win rate from the performance table
  assert.equal(result.details.Record, '42-41-5');
  assert.equal(result.details['Win Rate'], '49.6%');
});
