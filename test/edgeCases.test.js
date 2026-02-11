const test = require('node:test')
const assert = require('node:assert/strict')
const PlayerInfoManager = require('../src')

test('PlayerInfoManager: getPlayerInfo handles all null results gracefully', async () => {
  const manager = new PlayerInfoManager()

  manager.fetchers.unity.fetchById = async () => null
  manager.fetchers.mtgelo.fetchById = async () => null
  manager.fetchers.melee.fetchById = async () => null
  manager.fetchers.topdeck.fetchById = async () => null

  const result = await manager.getPlayerInfo({
    unityId: '123',
    mtgeloId: '456',
    meleeUser: 'test',
    topdeckHandle: 'test'
  })

  assert.deepEqual(result.general, {}, 'General should be empty object')
  assert.deepEqual(result.sources, {}, 'Sources should be empty object')
  assert.ok(!result.general['win rate'], 'Should not have win rate with no valid results')
})

test('PlayerInfoManager: getPlayerInfo handles partial null results', async () => {
  const manager = new PlayerInfoManager()

  manager.fetchers.unity.fetchById = async () => ({
    source: 'Unity League',
    url: 'http://unity.test',
    name: 'Test Player'
  })
  manager.fetchers.mtgelo.fetchById = async () => null
  manager.fetchers.melee.fetchById = async () => null
  manager.fetchers.topdeck.fetchById = async () => null

  const result = await manager.getPlayerInfo({
    unityId: '123',
    mtgeloId: '456',
    meleeUser: 'test',
    topdeckHandle: 'test'
  })

  assert.equal(result.general.name, 'Test Player', 'Should have data from Unity League')
  assert.equal(Object.keys(result.sources).length, 1, 'Should have only one source')
  assert.ok(result.sources['Unity League'], 'Should have Unity League in sources')
})

test('PlayerInfoManager: mergeData handles records without draws (W-L format)', async () => {
  const manager = new PlayerInfoManager()

  const results = [
    {
      source: 'Test Source',
      url: 'http://test.com',
      name: 'Test Player',
      record: '10-5'
    }
  ]

  const merged = manager.mergeData(results, false)

  assert.equal(merged.general['win rate'], '66.67%', 'Should calculate win rate correctly for W-L format')
})

test('PlayerInfoManager: mergeData handles invalid win rate strings gracefully', async () => {
  const manager = new PlayerInfoManager()

  const results = [
    {
      source: 'Test1',
      url: 'http://test1.com',
      name: 'Test',
      winRate: 'invalid%'
    },
    {
      source: 'Test2',
      url: 'http://test2.com',
      name: 'Test',
      'win rate': 'N/A'
    },
    {
      source: 'Test3',
      url: 'http://test3.com',
      name: 'Test',
      record: '10-5-0'
    }
  ]

  const merged = manager.mergeData(results, false)

  // Should not crash, should calculate from record only
  assert.ok(merged, 'Should not crash on invalid win rate strings')
  assert.equal(merged.general['win rate'], '66.67%', 'Should calculate from valid record')
})

test('PlayerInfoManager: mergeData returns no win rate when insufficient data', async () => {
  const manager = new PlayerInfoManager()

  const results = [
    {
      source: 'Test',
      url: 'http://test.com',
      name: 'Test Player'
    }
  ]

  const merged = manager.mergeData(results, false)

  assert.ok(!merged.general['win rate'], 'Should not calculate win rate without data')
})

test('PlayerInfoManager: mergeData handles record with all zeros', async () => {
  const manager = new PlayerInfoManager()

  const results = [
    {
      source: 'Test',
      url: 'http://test.com',
      name: 'Test Player',
      record: '0-0-0'
    }
  ]

  const merged = manager.mergeData(results, false)

  assert.ok(!merged.general['win rate'], 'Should not calculate win rate when no games played')
})
