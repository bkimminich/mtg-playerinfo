const test = require('node:test')
const assert = require('node:assert/strict')
const TopdeckFetcher = require('../src/fetchers/topdeck')
const httpClient = require('../src/utils/httpClient')
const { readFixture, withMutedConsole } = require('../test_support/helpers')

test('TopdeckFetcher: parseHtml extracts info from fixture', () => {
  const html = readFixture('topdeck.html')
  const url = 'https://topdeck.gg/profile/@k0shiii'
  const fetcher = new TopdeckFetcher()

  const result = fetcher.parseHtml(html, url, '@k0shiii')

  assert.strictEqual(result.source, 'Topdeck')
  assert.strictEqual(result.name, 'Björn Kimminich')
  assert.strictEqual(result.photo, 'https://imagedelivery.net/kN_u_RUfFF6xsGMKYWhO1g/2a7b8d12-5924-4a58-5f9c-c0bf55766800/square')
  assert.strictEqual(result.twitter, 'bkimminich')
  assert.strictEqual(result.youtube, '@BjörnKimminich')
  assert.match(result.tournaments, /^\d+$/)
  assert.match(result.record, /^\d+-\d+-\d+$/)
})

test('TopdeckFetcher: parseHtml handles missing stats and different DOM shapes', () => {
  const fetcher = new TopdeckFetcher()
  const html = `
    <html>
      <body>
        <h1>Simple Name</h1>
        <div class="stats-container">
          <div class="stat">
            <div class="label">Win Rate</div>
            <div class="value">55%</div>
          </div>
        </div>
      </body>
    </html>
  `
  const result = fetcher.parseHtml(html, 'url', 'handle')
  assert.strictEqual(result.name, 'Simple Name')
  assert.strictEqual(result['win rate'], '55%')
})

test('TopdeckFetcher: fetchById and fetchStats integration', async (t) => {
  const fetcher = new TopdeckFetcher()

  await t.test('successful fetch with stats', async () => {
    const mockRequest = t.mock.method(httpClient, 'request')
    mockRequest.mock.mockImplementation(async (url) => {
      if (url.includes('/stats')) {
        return { data: { yearlyStats: { 2024: { overall: { totalTournaments: 5, wins: 3, losses: 1, draws: 1 } } } }, status: 200 }
      }
      return { data: '<html><h2>Test User</h2>const playerId = "abc123";</html>', status: 200 }
    })

    const result = await fetcher.fetchById('testuser')
    assert.strictEqual(result.name, '@testuser')
    assert.strictEqual(result.record, '3-1-1')
    assert.strictEqual(result['win rate'], '60.00%')
    mockRequest.mock.restore()
  })

  await t.test('fetch error handling', async () => {
    const mockRequest = t.mock.method(httpClient, 'request', () => { throw new Error('Boom') })
    await withMutedConsole(async () => {
      const result = await fetcher.fetchById('testuser')
      assert.strictEqual(result, null)
    })
    mockRequest.mock.restore()
  })

  await t.test('stats fetch error handling', async () => {
    const mockRequest = t.mock.method(httpClient, 'request')
    mockRequest.mock.mockImplementation(async (url) => {
      if (url.includes('/stats')) throw new Error('Stats Error')
      return { data: '<html>const playerId = "abc123";</html>', status: 200 }
    })

    await withMutedConsole(async () => {
      const result = await fetcher.fetchById('testuser')
      assert.ok(result)
      assert.ok(!result.record)
    })
    mockRequest.mock.restore()
  })
})
