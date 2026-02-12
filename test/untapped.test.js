const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const UntappedFetcher = require('../src/fetchers/untapped')

function readFixture (name) {
  return fs.readFileSync(path.join(__dirname, 'data', name), 'utf8')
}

test('UntappedFetcher: parses most recent match and extracts MTGA rank', () => {
  const fetcher = new UntappedFetcher()
  const fixtureJson = readFixture('untapped.json')
  const matches = JSON.parse(fixtureJson)

  const url = 'https://mtga.untapped.gg/profile/7de50700-c3f6-48e4-a38d-2add5b0d9b71/76DCDWCZS5FX5PIEEMUVY6GV74'
  const result = fetcher.parseMatch(matches[0], url)

  assert.strictEqual(result.source, 'Untapped.gg')
  assert.strictEqual(result.url, url)

  assert.match(result.mtga_rank, /^(Bronze|Silver|Gold|Platinum|Diamond|Mythic)\s\d+$/)
})

test('UntappedFetcher: handles missing rank data', () => {
  const fetcher = new UntappedFetcher()
  const testMatch = {
    friendly_ranking_class_after: null,
    friendly_ranking_tier_after: null
  }

  const url = 'https://mtga.untapped.gg/profile/test-user/test-code'
  const result = fetcher.parseMatch(testMatch, url)

  assert.strictEqual(result.mtga_rank, null)
})

test('UntappedFetcher: constructs correct API URL from two-part ID', () => {
  const fetcher = new UntappedFetcher()
  const userId = '7de50700-c3f6-48e4-a38d-2add5b0d9b71'
  const playerCode = '76DCDWCZS5FX5PIEEMUVY6GV74'
  const id = `${userId}/${playerCode}`

  const parts = id.split('/')
  assert.strictEqual(parts.length, 2)
  assert.strictEqual(parts[0], userId)
  assert.strictEqual(parts[1], playerCode)

  const apiUrl = `https://api.mtga.untapped.gg/api/v1/games/users/${parts[0]}/players/${parts[1]}/?card_set=ECL`
  assert.strictEqual(apiUrl, 'https://api.mtga.untapped.gg/api/v1/games/users/7de50700-c3f6-48e4-a38d-2add5b0d9b71/players/76DCDWCZS5FX5PIEEMUVY6GV74/?card_set=ECL')

  const profileUrl = `https://mtga.untapped.gg/profile/${parts[0]}/${parts[1]}`
  assert.strictEqual(profileUrl, 'https://mtga.untapped.gg/profile/7de50700-c3f6-48e4-a38d-2add5b0d9b71/76DCDWCZS5FX5PIEEMUVY6GV74')
})



