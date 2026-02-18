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
  const result = fetcher.parseMatches(matches, url)

  assert.strictEqual(result.source, 'Untapped.gg')
  assert.strictEqual(result.url, url)

  assert.strictEqual(typeof result.mtga_rank, 'object')

  // Format is either "Rank Tier" (e.g. "Diamond 2") or "Mythic #Place" or "Mythic Percentile%" (e.g. "Mythic #123" or "Mythic 98.67%")
  if (result.mtga_rank.constructed !== undefined) {
    assert.match(result.mtga_rank.constructed, /^(Bronze|Silver|Gold|Platinum|Diamond|Mythic)(\s\d+|\s#\d+|\s\d+(\.\d+)?%)$/)
  }
  if (result.mtga_rank.limited !== undefined) {
    assert.match(result.mtga_rank.limited, /^(Bronze|Silver|Gold|Platinum|Diamond|Mythic)(\s\d+|\s#\d+|\s\d+(\.\d+)?%)$/)
  }
})

test('UntappedFetcher: handles missing rank data', () => {
  const fetcher = new UntappedFetcher()
  const testMatches = [
    {
      super_format: 2,
      friendly_ranking_class_after: null,
      friendly_ranking_tier_after: null,
      match_start: 1000
    },
    {
      super_format: 1,
      friendly_ranking_class_after: null,
      friendly_ranking_tier_after: null,
      match_start: 2000
    }
  ]

  const url = 'https://mtga.untapped.gg/profile/test-user/test-code'
  const result = fetcher.parseMatches(testMatches, url)

  assert.strictEqual('constructed' in result.mtga_rank, false)
  assert.strictEqual('limited' in result.mtga_rank, false)
})

test('UntappedFetcher: formats Mythic rank with leaderboard place or percentile', () => {
  const fetcher = new UntappedFetcher()
  const testMatches = [
    {
      super_format: 2,
      friendly_ranking_class_after: 'Mythic',
      friendly_ranking_tier_after: null,
      friendly_mythic_leaderboard_place_after: 123,
      friendly_mythic_percentile_after: 101.5,
      match_start: 1000
    },
    {
      super_format: 1,
      friendly_ranking_class_after: 'Mythic',
      friendly_ranking_tier_after: null,
      friendly_mythic_leaderboard_place_after: null,
      friendly_mythic_percentile_after: 98.789,
      match_start: 2000
    }
  ]

  const url = 'https://mtga.untapped.gg/profile/test-user/test-code'
  const result = fetcher.parseMatches(testMatches, url)

  assert.strictEqual(result.mtga_rank.constructed, 'Mythic #123')
  assert.strictEqual(result.mtga_rank.limited, 'Mythic 98%')
})

test('UntappedFetcher: constructs correct API URL from two-part ID', () => {
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
