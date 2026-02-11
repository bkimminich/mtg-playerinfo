const test = require('node:test')
const assert = require('node:assert/strict')
const MtgEloFetcher = require('../src/fetchers/mtgElo')

test('MtgEloFetcher: parseHtml returns null when no name found', () => {
  const fetcher = new MtgEloFetcher()
  const html = '<html><body></body></html>'

  const result = fetcher.parseHtml(html, 'http://test.com', 'test-id')

  assert.equal(result, null, 'Should return null when name cannot be extracted')
})

test('MtgEloFetcher: parseHtml handles invalid JSON in astro-island gracefully', () => {
  const fetcher = new MtgEloFetcher()
  const html = `
    <html>
      <astro-island component-url="Profile" props='invalid json'></astro-island>
      <div class="text-[22pt]">Fallback, Name</div>
      <div class="text-[18pt]">Current rating: <span class="font-bold">1500</span></div>
      <div class="text-[18pt]">Record: 10-5-2</div>
    </html>
  `

  const result = fetcher.parseHtml(html, 'http://test.com', 'test-id')

  assert.equal(result.name, 'Name Fallback', 'Should use fallback parsing with flipped name')
  assert.equal(result.current_rating, '1500')
  assert.equal(result.record, '10-5-2')
})

test('MtgEloFetcher: parseHtml uses fallback selectors when astro-island missing', () => {
  const fetcher = new MtgEloFetcher()
  const html = `
    <html>
      <div class="text-[22pt]">Smith, John</div>
      <div class="text-[18pt]">Current rating: <span class="font-bold">1600</span></div>
      <div class="text-[18pt]">Record: 20-10-5</div>
    </html>
  `

  const result = fetcher.parseHtml(html, 'http://test.com', 'test-id')

  assert.equal(result.name, 'John Smith', 'Should flip comma-separated name')
  assert.equal(result.current_rating, '1600')
  assert.equal(result.record, '20-10-5')
  assert.equal(result['win rate'], '57.14%', 'Should calculate win rate from record')
})

test('MtgEloFetcher: parseHtml calculates win rate correctly with draws', () => {
  const fetcher = new MtgEloFetcher()
  const html = `
    <html>
      <div class="text-[22pt]">Test Player</div>
      <div class="text-[18pt]">Record: 15-10-5</div>
    </html>
  `

  const result = fetcher.parseHtml(html, 'http://test.com', 'test-id')

  assert.equal(result.record, '15-10-5')
  assert.equal(result['win rate'], '50.00%')
})

test('MtgEloFetcher: parseHtml handles record without draws', () => {
  const fetcher = new MtgEloFetcher()
  const html = `
    <html>
      <div class="text-[22pt]">Test Player</div>
      <div class="text-[18pt]">Record: 12-8</div>
    </html>
  `

  const result = fetcher.parseHtml(html, 'http://test.com', 'test-id')

  assert.equal(result.record, '12-8')
  assert.equal(result['win rate'], '60.00%')
})

test('MtgEloFetcher: parseHtml handles name without comma', () => {
  const fetcher = new MtgEloFetcher()
  const html = `
    <html>
      <div class="text-[22pt]">SingleName</div>
      <div class="text-[18pt]">Record: 5-5-0</div>
    </html>
  `

  const result = fetcher.parseHtml(html, 'http://test.com', 'test-id')

  assert.equal(result.name, 'SingleName', 'Should handle single name without comma')
})
