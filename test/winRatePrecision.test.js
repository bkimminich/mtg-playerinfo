const test = require('node:test')
const assert = require('node:assert/strict')
const PlayerInfoManager = require('../src')

test('PlayerInfoManager: Win rate should be calculated from total of source W-L-D records', async () => {
  const manager = new PlayerInfoManager()

  const results = [
    {
      source: 'Source1',
      url: 'url1',
      record: '10-0-0',
      'win rate': '100.00%'
    },
    {
      source: 'Source2',
      url: 'url2',
      record: '0-90-10',
      'win rate': '0.00%'
    }
  ]

  const merged = manager.mergeData(results)
  assert.strictEqual(merged.general['win rate'], '9.09%', 'Win rate should be calculated from total records')
})
