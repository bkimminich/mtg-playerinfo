const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const UnityLeagueFetcher = require('../src/fetchers/unityLeague')

function readFixture (name) {
  return fs.readFileSync(path.join(__dirname, 'data', name), 'utf8')
}

test('UnityLeagueFetcher: parseHtml extracts profile, photo, ranks and stats', () => {
  const html = readFixture('unityLeague.html')
  const url = 'https://unityleague.gg/player/16215/'
  const fetcher = new UnityLeagueFetcher()

  const result = fetcher.parseHtml(html, url)

  assert.ok(result, 'Should return a result object')
  assert.equal(result.source, 'Unity League')
  assert.equal(result.url, url)
  assert.equal(result.name, 'Björn Kimminich')
  assert.equal(result.photo, 'https://unityleague.gg/media/player_profile/1000023225.jpg')
  assert.equal(result.country, 'de')
  assert.match(result['rank germany'], /^\d+$/)
  assert.match(result['rank europe'], /^\d+$/)
  assert.match(result['rank points'], /^\d+$/)
  assert.match(result.record, /^\d+-\d+-\d+$/)
  assert.match(result['win rate'], /^\d+(\.\d+)?%$/)
})
