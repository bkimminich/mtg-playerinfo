const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { mock } = require('node:test')

const httpClient = require('../src/utils/httpClient')
const TopdeckFetcher = require('../src/fetchers/topdeck')

function readFixture (name) {
  return fs.readFileSync(path.join(__dirname, 'data', name), 'utf8')
}

test('TopdeckFetcher: parseHtml extracts stats from DOM when available', () => {
  const html = readFixture('topdeck.html')
  const handle = '@k0shiii'
  const url = `https://topdeck.gg/profile/${handle}`
  const fetcher = new TopdeckFetcher()

  const result = fetcher.parseHtml(html, url, handle)

  assert.ok(result, 'Should return a result object')
  assert.equal(result.source, 'Topdeck')
  assert.equal(result.url, url)
  assert.equal(result.name, 'Björn Kimminich')
  assert.equal(result.pronouns, 'He/Him', 'Should extract pronouns from badge')
  assert.equal(result.twitter, 'bkimminich', 'Should extract Twitter handle')
  assert.equal(result.youtube, '@BjörnKimminich', 'Should extract YouTube handle')
})

test('TopdeckFetcher: fetchStats updates playerInfo with data from stats JSON', async () => {
  const statsJson = readFixture('topdeck.json')
  const internalId = 'm4VSTJShiXR1PCSCWaM9TBY0rcg1'
  const fetcher = new TopdeckFetcher()
  const playerInfo = { source: 'Topdeck' }

  mock.method(httpClient, 'request', async (url) => {
    if (url.endsWith(`/profile/${internalId}/stats`)) {
      return { data: statsJson }
    }
    throw new Error(`Unexpected URL: ${url}`)
  })

  await fetcher.fetchStats(internalId, playerInfo)

  assert.match(playerInfo.tournaments, /^\d+$/)
  assert.match(playerInfo.record, /^\d+-\d+-\d+$/)
  assert.match(playerInfo['win rate'], /^\d+(\.\d+)?%$/)
})
