const test = require('node:test')
const assert = require('node:assert/strict')
const UntappedFetcher = require('../src/fetchers/untapped')
const httpClient = require('../src/utils/httpClient')
const { readFixture, withMutedConsole } = require('../test_support/helpers')

test('UntappedFetcher: parseMatches extracts MTGA rank from fixture', () => {
  const fetcher = new UntappedFetcher()
  const fixtureJson = readFixture('untapped.json')
  const matches = JSON.parse(fixtureJson)

  const url = 'https://mtga.untapped.gg/profile/7de50700-c3f6-48e4-a38d-2add5b0d9b71/76DCDWCZS5FX5PIEEMUVY6GV74'
  const result = fetcher.parseMatches(matches, url)

  assert.strictEqual(result.source, 'Untapped.gg')
  assert.strictEqual(result.url, url)
  assert.strictEqual(typeof result.mtga_rank, 'object')

  const rankRegex = /^(Bronze|Silver|Gold|Platinum|Diamond|Mythic)(\s\d+|\s#\d+|\s\d+(\.\d+)?%)$/
  if (result.mtga_rank.constructed) {
    assert.match(result.mtga_rank.constructed, rankRegex)
  }
  if (result.mtga_rank.limited) {
    assert.match(result.mtga_rank.limited, rankRegex)
  }
})

test('UntappedFetcher: formats Mythic rank correctly', () => {
  const fetcher = new UntappedFetcher()
  const testCases = [
    {
      label: 'leaderboard place',
      match: { super_format: 2, friendly_ranking_class_after: 'Mythic', friendly_mythic_leaderboard_place_after: 123, match_start: 1000 },
      expected: 'Mythic #123'
    },
    {
      label: 'percentile',
      match: { super_format: 1, friendly_ranking_class_after: 'Mythic', friendly_mythic_percentile_after: 98.789, match_start: 2000 },
      expected: 'Mythic 98%'
    }
  ]

  for (const { label, match, expected } of testCases) {
    const result = fetcher.parseMatches([match], 'url')
    const rank = match.super_format === 2 ? result.mtga_rank.constructed : result.mtga_rank.limited
    assert.strictEqual(rank, expected, `Failed for ${label}`)
  }
})

test('UntappedFetcher: handles missing or incomplete rank data', () => {
  const fetcher = new UntappedFetcher()
  const cases = [
    { label: 'null class', match: { super_format: 2, friendly_ranking_class_after: null } },
    { label: 'Mythic no data', match: { super_format: 2, friendly_ranking_class_after: 'Mythic', friendly_mythic_leaderboard_place_after: null, friendly_mythic_percentile_after: null } },
    { label: 'missing tier', match: { super_format: 2, friendly_ranking_class_after: 'Gold', friendly_ranking_tier_after: null } }
  ]

  for (const { label, match } of cases) {
    const result = fetcher.parseMatches([match], 'url')
    assert.ok(!result.mtga_rank.constructed, `Should not have rank for ${label}`)
  }
})

test('UntappedFetcher: findMostRecentByFormat picks latest match', () => {
  const fetcher = new UntappedFetcher()
  const testMatches = [
    { super_format: 2, friendly_ranking_class_after: 'Gold', friendly_ranking_tier_after: 4, match_start: 1000 },
    { super_format: 2, friendly_ranking_class_after: 'Gold', friendly_ranking_tier_after: 1, match_start: 5000 },
    { super_format: 2, friendly_ranking_class_after: 'Gold', friendly_ranking_tier_after: 2, match_start: 3000 }
  ]

  const result = fetcher.parseMatches(testMatches, 'url')
  assert.strictEqual(result.mtga_rank.constructed, 'Gold 1')
})

test('UntappedFetcher: fetchById handles various ID and response scenarios', async (t) => {
  const fetcher = new UntappedFetcher()

  await t.test('invalid ID format', async () => {
    await withMutedConsole(async () => {
      const result = await fetcher.fetchById('invalid-id')
      assert.strictEqual(result, null)
    })
  })

  await t.test('network error', async () => {
    const mockRequest = t.mock.method(httpClient, 'request', () => { throw new Error('Network Error') })
    await withMutedConsole(async () => {
      const result = await fetcher.fetchById('user/code')
      assert.strictEqual(result, null)
    })
    mockRequest.mock.restore()
  })

  await t.test('empty matches array', async () => {
    const mockRequest = t.mock.method(httpClient, 'request', async () => ({ data: [] }))
    await withMutedConsole(async () => {
      const result = await fetcher.fetchById('user/code')
      assert.strictEqual(result, null)
    })
    mockRequest.mock.restore()
  })

  await t.test('non-array data', async () => {
    const mockRequest = t.mock.method(httpClient, 'request', async () => ({ data: {} }))
    await withMutedConsole(async () => {
      const result = await fetcher.fetchById('user/code')
      assert.strictEqual(result, null)
    })
    mockRequest.mock.restore()
  })
})
