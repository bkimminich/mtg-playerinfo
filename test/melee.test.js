const test = require('node:test')
const assert = require('node:assert/strict')
const MeleeFetcher = require('../src/fetchers/melee')
const httpClient = require('../src/utils/httpClient')
const { readFixture, withMutedConsole } = require('../test_utils/helpers')

test('MeleeFetcher: parseHtml extracts info from fixture', () => {
  const html = readFixture('melee.html')
  const url = 'https://melee.gg/Profile/Index/k0shiii'
  const username = 'k0shiii'
  const fetcher = new MeleeFetcher()

  const result = fetcher.parseHtml(html, url, username)

  assert.strictEqual(result.source, 'Melee')
  assert.strictEqual(result.url, url)
  assert.strictEqual(result.name, 'Björn Kimminich')
  assert.strictEqual(result.pronouns, 'He/Him')
  assert.ok(result.bio.includes('Smugly held back'))
  assert.strictEqual(result.facebook, 'bjoern.kimminich')
  assert.strictEqual(result.twitch, 'koshiii')
  assert.strictEqual(result.youtube, '@BjörnKimminich')
})

test('MeleeFetcher: parseHtml handles minimal/missing data', () => {
  const fetcher = new MeleeFetcher()

  const result = fetcher.parseHtml('<html><body></body></html>', 'url', 'fallback')
  assert.strictEqual(result.name, 'fallback')
  assert.strictEqual(result.pronouns, null)
  assert.strictEqual(result.bio, null)
})

test('MeleeFetcher: parseHtml extracts social links correctly', () => {
  const fetcher = new MeleeFetcher()
  const html = `
    <a class="social-link" href="https://twitter.com/testuser">Twitter</a>
    <a class="social-link" href="not-a-url">Invalid</a>
  `
  const result = fetcher.parseHtml(html, 'url', 'user')
  assert.strictEqual(result.twitter, 'testuser')
  assert.ok(!result.facebook)
})

test('MeleeFetcher: fetchById handles success and error scenarios', async (t) => {
  const fetcher = new MeleeFetcher()

  await t.test('successful fetch', async () => {
    const mockRequest = t.mock.method(httpClient, 'request', async () => ({
      data: '<html><span style="font-size: xx-large">Fetched Name</span></html>',
      status: 200
    }))
    const result = await fetcher.fetchById('user')
    assert.strictEqual(result.name, 'Fetched Name')
    mockRequest.mock.restore()
  })

  await t.test('network error', async () => {
    const mockRequest = t.mock.method(httpClient, 'request', () => { throw new Error('Network Error') })
    await withMutedConsole(async () => {
      const result = await fetcher.fetchById('user')
      assert.strictEqual(result, null)
    })
    mockRequest.mock.restore()
  })
})
