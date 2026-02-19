const test = require('node:test')
const assert = require('node:assert/strict')
const { extractHandle, getPlatformName } = require('../src/utils/socialMediaExtractor')

test('socialMediaExtractor: extractHandle extracts handle correctly', () => {
  assert.strictEqual(extractHandle('https://twitter.com/user'), 'user')
  assert.strictEqual(extractHandle('https://www.facebook.com/user/'), 'user')
  assert.strictEqual(extractHandle('https://twitch.tv/user'), 'user')
  assert.strictEqual(extractHandle('https://youtube.com/@user'), '@user')
  assert.strictEqual(extractHandle('https://instagram.com/user?query=1'), 'user')
})

test('socialMediaExtractor: extractHandle handles null/empty/invalid input', () => {
  assert.strictEqual(extractHandle(null), null)
  assert.strictEqual(extractHandle(''), null)
  assert.strictEqual(extractHandle('not-a-url'), null)
})

test('socialMediaExtractor: getPlatformName extracts platform name correctly', () => {
  assert.strictEqual(getPlatformName('https://twitter.com/user'), 'twitter')
  assert.strictEqual(getPlatformName('https://www.facebook.com/user'), 'facebook')
  assert.strictEqual(getPlatformName('https://twitch.tv/user'), 'twitch')
  assert.strictEqual(getPlatformName('https://youtube.com/@user'), 'youtube')
  assert.strictEqual(extractHandle('https://twitter.com/'), null)
})

test('socialMediaExtractor: getPlatformName handles null/empty/invalid input', () => {
  assert.strictEqual(getPlatformName(null), null)
  assert.strictEqual(getPlatformName(''), null)
  assert.strictEqual(getPlatformName('not-a-url'), null)
})
