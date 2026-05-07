const test = require('node:test')
const assert = require('node:assert/strict')
const MtgEloFetcher = require('../src/fetchers/mtgElo')
const httpClient = require('../src/utils/httpClient')
const { readFixture, withMutedConsole } = require('../test_utils/helpers')

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

test('MtgEloFetcher: buildEvents joins events with matches and tallies W-L-D from result strings', () => {
  const fetcher = new MtgEloFetcher()
  const events = JSON.parse(readFixture('mtgEloEvents.json'))
  const matches = JSON.parse(readFixture('mtgEloMatches.json'))

  const result = fetcher.buildEvents(events, matches)

  assert.strictEqual(result.length, 3)
  const byCode = (date) => result.find(e => e.date === date)

  // ssutr25 (2025-03-15): 5W-4L-0D
  assert.deepStrictEqual(
    { date: byCode('2025-03-15').date, w: byCode('2025-03-15').wins, l: byCode('2025-03-15').losses, d: byCode('2025-03-15').draws },
    { date: '2025-03-15', w: 5, l: 4, d: 0 }
  )
  // ssliv25 (2025-11-01): 1W-4L-0D
  assert.deepStrictEqual(
    { w: byCode('2025-11-01').wins, l: byCode('2025-11-01').losses, d: byCode('2025-11-01').draws },
    { w: 1, l: 4, d: 0 }
  )
  // sslyo26 (2026-01-10): 3W-4L-1D (one "Draw 1-1" round)
  assert.deepStrictEqual(
    { w: byCode('2026-01-10').wins, l: byCode('2026-01-10').losses, d: byCode('2026-01-10').draws },
    { w: 3, l: 4, d: 1 }
  )

  for (const ev of result) {
    assert.strictEqual(ev.source, 'MTG Elo Project')
    assert.match(ev.date, /^\d{4}-\d{2}-\d{2}$/)
    assert.ok(ev.name)
  }
})

test('MtgEloFetcher: buildEvents tolerates empty/malformed inputs', () => {
  const fetcher = new MtgEloFetcher()
  assert.deepStrictEqual(fetcher.buildEvents(null, null), [])
  assert.deepStrictEqual(fetcher.buildEvents({ data: [] }, {}), [])
  // event with no matching match list -> skipped
  assert.deepStrictEqual(
    fetcher.buildEvents({ data: [{ code: 'x', date: '2025-01-01', name: 'X' }] }, {}),
    []
  )
  // event with empty match list -> skipped (no W-L-D info)
  assert.deepStrictEqual(
    fetcher.buildEvents({ data: [{ code: 'x', date: '2025-01-01', name: 'X' }] }, { x: [] }),
    []
  )
})

test('MtgEloFetcher: fetchById populates events via API endpoints', async (t) => {
  const fetcher = new MtgEloFetcher()
  const events = JSON.parse(readFixture('mtgEloEvents.json'))
  const matches = JSON.parse(readFixture('mtgEloMatches.json'))

  const mockRequest = t.mock.method(httpClient, 'request', async (url) => {
    if (url.endsWith('/events')) return { data: events, status: 200 }
    if (url.endsWith('/matches')) return { data: matches, status: 200 }
    return { data: '<html><div class="text-[22pt]">Test User</div></html>', status: 200 }
  })
  const result = await fetcher.fetchById('3irvwtmk')
  mockRequest.mock.restore()

  assert.ok(Array.isArray(result.events))
  assert.strictEqual(result.events.length, 3)
  assert.ok(result.events.every(e => e.source === 'MTG Elo Project'))
})

test('MtgEloFetcher: fetchById handles success and error scenarios', async (t) => {
  const fetcher = new MtgEloFetcher()

  await t.test('successful fetch', async () => {
    const mockRequest = t.mock.method(httpClient, 'request', async (url) => {
      if (url.includes('/api/players/')) {
        return { data: url.endsWith('/events') ? { data: [] } : {}, status: 200 }
      }
      return { data: '<html><div class="text-[22pt]">Test User</div></html>', status: 200 }
    })
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
