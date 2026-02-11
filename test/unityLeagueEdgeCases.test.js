const test = require('node:test')
const assert = require('node:assert/strict')
const UnityLeagueFetcher = require('../src/fetchers/unityLeague')

test('UnityLeagueFetcher: parseHtml ignores non-player_profile images', () => {
  const fetcher = new UnityLeagueFetcher()
  const html = `
    <html>
      <h1 class="d-inline">Test Player</h1>
      <div class="card-body">
        <img class="img-fluid" src="https://unityleague.gg/media/default_avatar.jpg" />
      </div>
    </html>
  `

  const result = fetcher.parseHtml(html, 'http://test.com')

  assert.equal(result.photo, null, 'Should not use non-player_profile images')
  assert.equal(result.name, 'Test Player')
})

test('UnityLeagueFetcher: parseHtml handles missing country data gracefully', () => {
  const fetcher = new UnityLeagueFetcher()
  const html = `
    <html>
      <h1 class="d-inline">Test Player</h1>
      <dt class="small text-muted">Country:</dt>
      <dd></dd>
    </html>
  `

  const result = fetcher.parseHtml(html, 'http://test.com')

  assert.ok(result, 'Should return result even with missing country')
  assert.equal(result.name, 'Test Player')
  assert.equal(result.country, '', 'Country should be empty string')
})

test('UnityLeagueFetcher: parseHtml handles country text without flag icon', () => {
  const fetcher = new UnityLeagueFetcher()
  const html = `
    <html>
      <h1 class="d-inline">Test Player</h1>
      <dt class="small text-muted">Country:</dt>
      <dd>Germany</dd>
    </html>
  `

  const result = fetcher.parseHtml(html, 'http://test.com')

  assert.equal(result.country, 'Germany', 'Should use text when no flag icon')
})

test('UnityLeagueFetcher: parseHtml handles missing bio element', () => {
  const fetcher = new UnityLeagueFetcher()
  const html = `
    <html>
      <h1 class="d-inline">Test Player</h1>
    </html>
  `

  const result = fetcher.parseHtml(html, 'http://test.com')

  assert.ok(!result.bio, 'Bio should be undefined when element missing')
})

test('UnityLeagueFetcher: parseHtml extracts country from header flag', () => {
  const fetcher = new UnityLeagueFetcher()
  const html = `
    <html>
      <h1 class="d-inline">Test Player</h1>
      <div class="card-body">
        <i class="fi fi-us"></i>
      </div>
    </html>
  `

  const result = fetcher.parseHtml(html, 'http://test.com')

  assert.equal(result.country, 'us', 'Should extract country code from header flag')
})

test('UnityLeagueFetcher: parseHtml handles missing ranking table', () => {
  const fetcher = new UnityLeagueFetcher()
  const html = `
    <html>
      <h1 class="d-inline">Test Player</h1>
    </html>
  `

  const result = fetcher.parseHtml(html, 'http://test.com')

  assert.ok(result, 'Should handle missing ranking table')
  assert.ok(!result['rank germany'], 'Should not have rank data')
})

test('UnityLeagueFetcher: parseHtml extracts ranking data with special characters', () => {
  const fetcher = new UnityLeagueFetcher()
  const html = `
    <html>
      <h1 class="d-inline">Test Player</h1>
      <table class="table-sm">
        <thead>
          <tr>
            <th>Germany</th>
            <th>Europe</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>#42</td>
            <td>1st</td>
          </tr>
        </tbody>
      </table>
    </html>
  `

  const result = fetcher.parseHtml(html, 'http://test.com')

  assert.equal(result['rank germany'], '42', 'Should extract numeric value from #42')
  assert.equal(result['rank europe'], '1', 'Should extract numeric value from 1st')
})
