const test = require('node:test')
const assert = require('node:assert/strict')
const MtgEloFetcher = require('../src/fetchers/mtgElo')
const httpClient = require('../src/utils/httpClient')
const { readFixture, withMutedConsole } = require('./helpers')

test('MtgEloFetcher: parseHtml extracts info from fixture', () => {
  const html = readFixture('mtgElo.html')
  const url = 'https://mtgeloproject.net/profile/7de50700'
  const fetcher = new MtgEloFetcher()

  const result = fetcher.parseHtml(html, url, '7de50700')

  assert.strictEqual(result.source, 'MTG Elo Project')
  assert.strictEqual(result.name, 'Bjoern Kimminich')
  assert.match(result.current_rating, /^\d+$/)
  assert.match(result.record, /^\d+-\d+-\d+$/)
  assert.match(result['win rate'], /^\d+(\.\d+)?%$/)
})

test('MtgEloFetcher: parseHtml handles missing astro-island and uses fallback selectors', () => {
  const fetcher = new MtgEloFetcher()
  const html = `
    <html>
      <body>
        <div class="text-[22pt]">Kimminich, Björn</div>
        <div class="text-[18pt]">Current rating: <span class="font-bold">1200</span></div>
        <div class="text-[18pt]">Record: 10-5</div>
      </body>
    </html>
  `
  const result = fetcher.parseHtml(html, 'url', 'id')
  assert.strictEqual(result.name, 'Björn Kimminich')
  assert.strictEqual(result.current_rating, '1200')
  assert.strictEqual(result.record, '10-5')
  assert.strictEqual(result['win rate'], '66.67%')
})

test('MtgEloFetcher: parseHtml handles malformed astro-island JSON', async () => {
  const fetcher = new MtgEloFetcher()
  const html = '<astro-island component-url="Profile" props="invalid-json"></astro-island>'

  await withMutedConsole(() => {
    const result = fetcher.parseHtml(html, 'url', 'id')
    assert.strictEqual(result, null)
  })
})

test('MtgEloFetcher: fetchById handles success and error scenarios', async (t) => {
  const fetcher = new MtgEloFetcher()

  await t.test('successful fetch', async () => {
    const mockRequest = t.mock.method(httpClient, 'request', async () => ({
      data: '<html><div class="text-[22pt]">Test User</div></html>',
      status: 200
    }))
    const result = await fetcher.fetchById('123')
    assert.strictEqual(result.name, 'Test User')
    mockRequest.mock.restore()
  })

  await t.test('network error', async () => {
    const mockRequest = t.mock.method(httpClient, 'request', () => { throw new Error('Network Error') })
    await withMutedConsole(async () => {
      const result = await fetcher.fetchById('123')
      assert.strictEqual(result, null)
    })
    mockRequest.mock.restore()
  })
})
