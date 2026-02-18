const test = require('node:test')
const assert = require('node:assert/strict')

const UntappedFetcher = require('../src/fetchers/untapped')

test('UntappedFetcher: parseMatches handles matches with no Constructed format', () => {
  const fetcher = new UntappedFetcher()
  const testMatches = [
    {
      super_format: 1,
      friendly_ranking_class_after: 'Gold',
      friendly_ranking_tier_after: 3,
      match_start: 1000
    }
  ]

  const url = 'https://mtga.untapped.gg/profile/test-user/test-code'
  const result = fetcher.parseMatches(testMatches, url)

  assert.equal(result.source, 'Untapped.gg')
  assert.ok(!result.mtga_rank.constructed, 'Should not have constructed rank')
  assert.equal(result.mtga_rank.limited, 'Gold 3', 'Should have limited rank')
})

test('UntappedFetcher: parseMatches handles matches with no Limited format', () => {
  const fetcher = new UntappedFetcher()
  const testMatches = [
    {
      super_format: 2,
      friendly_ranking_class_after: 'Platinum',
      friendly_ranking_tier_after: 2,
      match_start: 1000
    }
  ]

  const url = 'https://mtga.untapped.gg/profile/test-user/test-code'
  const result = fetcher.parseMatches(testMatches, url)

  assert.equal(result.source, 'Untapped.gg')
  assert.equal(result.mtga_rank.constructed, 'Platinum 2', 'Should have constructed rank')
  assert.ok(!result.mtga_rank.limited, 'Should not have limited rank')
})

test('UntappedFetcher: formatRank returns null when ranking_class_after is null', () => {
  const fetcher = new UntappedFetcher()
  const testMatches = [
    {
      super_format: 2,
      friendly_ranking_class_after: null,
      friendly_ranking_tier_after: 1,
      match_start: 1000
    }
  ]

  const url = 'https://mtga.untapped.gg/profile/test-user/test-code'
  const result = fetcher.parseMatches(testMatches, url)

  assert.ok(!result.mtga_rank.constructed, 'Should not have constructed rank when ranking_class_after is null')
})

test('UntappedFetcher: formatRank returns null for Mythic with no leaderboard or percentile data', () => {
  const fetcher = new UntappedFetcher()
  const testMatches = [
    {
      super_format: 2,
      friendly_ranking_class_after: 'Mythic',
      friendly_ranking_tier_after: null,
      friendly_mythic_leaderboard_place_after: null,
      friendly_mythic_percentile_after: null,
      match_start: 1000
    }
  ]

  const url = 'https://mtga.untapped.gg/profile/test-user/test-code'
  const result = fetcher.parseMatches(testMatches, url)

  assert.ok(!result.mtga_rank.constructed, 'Should not have constructed rank for Mythic with no placement data')
})

test('UntappedFetcher: findMostRecentByFormat returns null when no matches for format exist', () => {
  const fetcher = new UntappedFetcher()
  const testMatches = [
    {
      super_format: 1,
      friendly_ranking_class_after: 'Gold',
      friendly_ranking_tier_after: 1,
      match_start: 1000
    }
  ]

  const url = 'https://mtga.untapped.gg/profile/test-user/test-code'
  const result = fetcher.parseMatches(testMatches, url)

  assert.ok(!result.mtga_rank.constructed, 'Should not have constructed rank when no Constructed matches exist')
  assert.equal(result.mtga_rank.limited, 'Gold 1', 'Should have limited rank')
})

test('UntappedFetcher: parseMatches handles empty matches array', () => {
  const fetcher = new UntappedFetcher()
  const testMatches = []

  const url = 'https://mtga.untapped.gg/profile/test-user/test-code'
  const result = fetcher.parseMatches(testMatches, url)

  assert.equal(result.source, 'Untapped.gg')
  assert.equal(result.url, url)
  assert.deepStrictEqual(result.mtga_rank, {}, 'Should have empty mtga_rank object')
})
