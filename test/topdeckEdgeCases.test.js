const test = require('node:test')
const assert = require('node:assert/strict')
const { mock } = require('node:test')
const httpClient = require('../src/utils/httpClient')
const TopdeckFetcher = require('../src/fetchers/topdeck')

test('TopdeckFetcher: fetchStats handles empty stats object by setting default values', async () => {
  const internalId = 'testId123'
  const fetcher = new TopdeckFetcher()
  const playerInfo = { source: 'Topdeck', name: 'Test Player' }

  mock.method(httpClient, 'request', async (url) => {
    if (url.endsWith(`/profile/${internalId}/stats`)) {
      return { data: '{}' }
    }
    throw new Error(`Unexpected URL: ${url}`)
  })

  await fetcher.fetchStats(internalId, playerInfo)

  assert.equal(playerInfo.source, 'Topdeck')
  assert.equal(playerInfo.name, 'Test Player')
  assert.equal(playerInfo.tournaments, '0', 'Should set tournaments to 0')
  assert.equal(playerInfo.record, '0-0-0', 'Should set record to 0-0-0')
  assert.equal(playerInfo['win rate'], '0.00%', 'Should set win rate to 0.00%')
})

test('TopdeckFetcher: fetchStats handles null stats data response', async () => {
  const internalId = 'testId456'
  const fetcher = new TopdeckFetcher()
  const playerInfo = { source: 'Topdeck', name: 'Test Player' }

  mock.method(httpClient, 'request', async (url) => {
    if (url.endsWith(`/profile/${internalId}/stats`)) {
      return { data: null }
    }
    throw new Error(`Unexpected URL: ${url}`)
  })

  await fetcher.fetchStats(internalId, playerInfo)

  assert.equal(playerInfo.source, 'Topdeck')
  assert.equal(playerInfo.name, 'Test Player')
})

test('TopdeckFetcher: parseHtml handles missing stats when HTML has no stats elements', () => {
  const fetcher = new TopdeckFetcher()
  const html = `
    <html>
      <body>
        <h2 class="text-white fw-bold mb-1">Test Player</h2>
        <img class="rounded-circle shadow-lg" src="/avatar.jpg" />
      </body>
    </html>
  `

  const result = fetcher.parseHtml(html, 'https://topdeck.gg/profile/@testplayer', '@testplayer')

  assert.equal(result.source, 'Topdeck')
  assert.equal(result.name, 'Test Player')
  assert.ok(!result.tournaments, 'Should not have tournaments when HTML has no stats')
  assert.ok(!result.record, 'Should not have record when HTML has no stats')
  assert.ok(!result['win rate'], 'Should not have win rate when HTML has no stats')
})
