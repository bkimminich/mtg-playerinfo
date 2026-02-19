const test = require('node:test')
const assert = require('node:assert/strict')
const UnityLeagueFetcher = require('../src/fetchers/unityLeague')
const httpClient = require('../src/utils/httpClient')
const { readFixture, withMutedConsole } = require('../test_support/helpers')

test('UnityLeagueFetcher: parseHtml extracts info from fixture', () => {
  const html = readFixture('unityLeague.html')
  const url = 'https://unityleague.gg/player/koshiii/'
  const fetcher = new UnityLeagueFetcher()

  const result = fetcher.parseHtml(html, url)

  assert.strictEqual(result.source, 'Unity League')
  assert.strictEqual(result.name, 'Björn Kimminich')
  assert.strictEqual(result.photo, 'https://unityleague.gg/media/player_profile/1000023225.jpg')
  assert.strictEqual(result.country, 'de')
  assert.ok(result.bio.includes('Smugly held back'))
  assert.match(result.record, /^\d+-\d+-\d+$/)
  assert.match(result['win rate'], /^\d+(\.\d+)?%$/)
})

test('UnityLeagueFetcher: parseHtml handles edge cases in DOM', () => {
  const fetcher = new UnityLeagueFetcher()

  const cases = [
    {
      label: 'non-profile image',
      html: '<html><body><div class="card-body"><img class="img-fluid" src="/other.jpg"></div></body></html>',
      check: (res) => assert.strictEqual(res.photo, null)
    },
    {
      label: 'country from dd list',
      html: '<html><body><dt class="small text-muted">Country:</dt><dd><i class="fi fi-us"></i> United States</dd></body></html>',
      check: (res) => assert.strictEqual(res.country, 'us')
    },
    {
      label: 'no account header',
      html: '<html><body></body></html>',
      check: (res) => assert.strictEqual(res.name, '')
    }
  ]

  for (const { html, check } of cases) {
    const res = fetcher.parseHtml(html, 'url')
    check(res)
  }
})

test('UnityLeagueFetcher: fetchById handles success and error scenarios', async (t) => {
  const fetcher = new UnityLeagueFetcher()

  await t.test('successful fetch', async () => {
    const mockRequest = t.mock.method(httpClient, 'request', async () => ({
      data: '<html><h1 class="d-inline">Fetched User</h1></html>',
      status: 200
    }))
    const result = await fetcher.fetchById('koshiii')
    assert.strictEqual(result.name, 'Fetched User')
    mockRequest.mock.restore()
  })

  await t.test('network error', async () => {
    const mockRequest = t.mock.method(httpClient, 'request', () => { throw new Error('Network Error') })
    await withMutedConsole(async () => {
      const result = await fetcher.fetchById('koshiii')
      assert.strictEqual(result, null)
    })
    mockRequest.mock.restore()
  })
})
