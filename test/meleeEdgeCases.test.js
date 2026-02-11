const test = require('node:test')
const assert = require('node:assert/strict')
const MeleeFetcher = require('../src/fetchers/melee')

test('MeleeFetcher: parseHtml uses username when name not found in HTML', () => {
  const fetcher = new MeleeFetcher()
  const html = '<html><body></body></html>'

  const result = fetcher.parseHtml(html, 'http://test.com', 'fallbackname')

  assert.equal(result.name, 'fallbackname', 'Should use username as fallback')
  assert.equal(result.source, 'Melee')
  assert.equal(result.url, 'http://test.com')
})

test('MeleeFetcher: parseHtml handles invalid social link URLs gracefully', () => {
  const fetcher = new MeleeFetcher()
  const html = `
    <html>
      <body>
        <span style="font-size: xx-large">Test Name</span>
        <a class="social-link" href="not-a-valid-url">Invalid</a>
        <a class="social-link" href="https://twitter.com/validuser">Valid</a>
      </body>
    </html>
  `

  const result = fetcher.parseHtml(html, 'http://test.com', 'testuser')

  assert.equal(result.name, 'Test Name')
  assert.equal(result.twitter, 'validuser', 'Should parse valid URL')
  // Should not crash on invalid URL
})

test('MeleeFetcher: parseHtml extracts multiple social links correctly', () => {
  const fetcher = new MeleeFetcher()
  const html = `
    <html>
      <body>
        <span style="font-size: xx-large">Test Player</span>
        <a class="social-link" href="https://twitter.com/testtwitter">Twitter</a>
        <a class="social-link" href="https://www.facebook.com/testfacebook">Facebook</a>
        <a class="social-link" href="https://twitch.tv/testtwitch">Twitch</a>
      </body>
    </html>
  `

  const result = fetcher.parseHtml(html, 'http://test.com', 'testuser')

  assert.equal(result.twitter, 'testtwitter')
  assert.equal(result.facebook, 'testfacebook')
  assert.equal(result.twitch, 'testtwitch')
})
