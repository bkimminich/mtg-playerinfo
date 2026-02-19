const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const PlayerInfoManager = require('../src')

function readFixture (name) {
  return fs.readFileSync(path.join(__dirname, 'data', name), 'utf8')
}

const fixtures = {
  unityLeague: readFixture('unityLeague.html'),
  mtgElo: readFixture('mtgElo.html'),
  melee: readFixture('melee.html'),
  topdeck: readFixture('topdeck.html')
}

function createMockedManager () {
  const manager = new PlayerInfoManager()

  manager.fetchers.unity.fetchById = async function (id) {
    const url = `https://unityleague.gg/player/${id}/`
    return this.parseHtml(fixtures.unityLeague, url)
  }

  manager.fetchers.mtgelo.fetchById = async function (id) {
    const url = `https://mtgeloproject.net/profile/${id}`
    return this.parseHtml(fixtures.mtgElo, url, id)
  }

  manager.fetchers.melee.fetchById = async function (username) {
    const url = `https://melee.gg/Profile/Index/${username}`
    return this.parseHtml(fixtures.melee, url, username)
  }

  manager.fetchers.topdeck.fetchById = async function (handle) {
    const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`
    const url = `https://topdeck.gg/profile/${cleanHandle}`
    return this.parseHtml(fixtures.topdeck, url, cleanHandle)
  }

  return manager
}

test('PlayerInfoManager: getPlayerInfo with all four sources merges data correctly', async () => {
  const manager = createMockedManager()

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  })

  assert.ok(result.general, 'Result should have general property')
  assert.ok(result.sources, 'Result should have sources property')
  assert.ok(result.sources['Unity League'], 'Should have Unity League source')
  assert.ok(result.sources['MTG Elo Project'], 'Should have MTG Elo Project source')
  assert.ok(result.sources.Melee, 'Should have Melee source')
  assert.ok(result.sources.Topdeck, 'Should have Topdeck source')
})

test('PlayerInfoManager: name property takes priority from Unity League over MTG Elo', async () => {
  const manager = createMockedManager()

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  })

  assert.equal(result.general.name, 'Björn Kimminich', 'Name should come from Unity League')
})

test('PlayerInfoManager: photo property takes priority from Unity League over Topdeck', async () => {
  const manager = createMockedManager()

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  })

  assert.equal(result.general.photo, 'https://unityleague.gg/media/player_profile/1000023225.jpg',
    'Photo should come from Unity League')
})

test('PlayerInfoManager: country property comes from Unity League', async () => {
  const manager = createMockedManager()

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  })

  // Only Unity League provides country
  assert.equal(result.general.country, 'de', 'Country should come from Unity League')
})

test('PlayerInfoManager: bio property takes priority from Unity League over Melee', async () => {
  const manager = createMockedManager()

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  })

  assert.ok(result.general.bio, 'Bio should be present')
  assert.ok(result.general.bio.includes('Untimely Malfunction'), 'Bio should contain text from Unity League and Melee profile')
  assert.ok(result.general.bio.includes('Change the target of target spell or ability with a single target'),
    'Bio should contain text from only Unity League profile')
})

test('PlayerInfoManager: pronouns property comes from Melee', async () => {
  const manager = createMockedManager()

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  })

  assert.equal(result.general.pronouns, 'He/Him', 'Pronouns should come from Melee')
})

test('PlayerInfoManager: social links (facebook, twitch, youtube) come from Melee', async () => {
  const manager = createMockedManager()

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  })

  assert.equal(result.general.facebook, 'bjoern.kimminich', 'Facebook should come from Melee')
  assert.equal(result.general.twitch, 'koshiii', 'Twitch should come from Melee')
  assert.equal(result.general.youtube, '@BjörnKimminich', 'YouTube should come from Melee')
})

test('PlayerInfoManager: win rate is averaged across all sources', async () => {
  const manager = createMockedManager()

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  })

  assert.ok(result.general['win rate'], 'Win rate should be present')
  assert.match(result.general['win rate'], /^\d+(\.\d+)?%$/, 'Win rate should be a percentage')
  // TODO Calculate that the win rate is actually the average of all available source win rates
})

test('PlayerInfoManager: team property comes from Unity League', async () => {
  const manager = createMockedManager()

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  })

  assert.equal(result.general.team, 'Mull to Five', 'Team should come from Unity League')
})

test('PlayerInfoManager: hometown property comes from Unity League', async () => {
  const manager = createMockedManager()

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  })

  assert.equal(result.general.hometown, 'Hamburg', 'Hometown should come from Unity League')
})

test('PlayerInfoManager: age property comes from Unity League', async () => {
  const manager = createMockedManager()

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  })

  assert.equal(result.general.age, '45', 'Age should come from Unity League')
})

test('PlayerInfoManager: each source contains its own player profile URL', async () => {
  const manager = createMockedManager()

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  })

  assert.equal(result.sources['Unity League'].url, 'https://unityleague.gg/player/16215/',
    'Unity League URL should be correct')
  assert.equal(result.sources['MTG Elo Project'].url, 'https://mtgeloproject.net/profile/3irvwtmk',
    'MTG Elo Project URL should be correct')
  assert.equal(result.sources.Melee.url, 'https://melee.gg/Profile/Index/k0shiii',
    'Melee URL should be correct')
  assert.equal(result.sources.Topdeck.url, 'https://topdeck.gg/profile/@k0shiii',
    'Topdeck URL should be correct')
})

test('PlayerInfoManager: each source contains its specific data in the sources object', async () => {
  const manager = createMockedManager()

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  })

  assert.match(result.sources['Unity League'].data['rank germany'], /^\d+$/,
    'Unity League should have rank germany')
  assert.match(result.sources['Unity League'].data['rank europe'], /^\d+$/,
    'Unity League should have rank europe')
  assert.match(result.sources['Unity League'].data['rank points'], /^\d+$/,
    'Unity League should have rank points')

  assert.ok(result.sources['MTG Elo Project'].data.player_id,
    'MTG Elo should have player_id')
  assert.ok(result.sources['MTG Elo Project'].data.current_rating,
    'MTG Elo should have current_rating')

  assert.equal(result.sources.Melee.data.name, 'Björn Kimminich',
    'Melee should have name')

  assert.equal(result.sources.Topdeck.data.name, 'Björn Kimminich',
    'Topdeck should have name')
})

test('PlayerInfoManager: priority order verification - Unity League > MTG Elo > Melee > Topdeck', async () => {
  const manager = createMockedManager()

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  })

  assert.equal(result.general.name, 'Björn Kimminich',
    'Name should use Unity League spelling "Björn Kimminich", not MTG Elo spelling "Bjoern Kimminich"')

  assert.ok(result.general.photo.includes('unityleague.gg'),
    'Photo should come from Unity League, not Topdeck')
})

test('PlayerInfoManager: with subset of sources - only Unity and Melee', async () => {
  const manager = createMockedManager()

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    meleeUser: 'k0shiii'
  })

  assert.equal(Object.keys(result.sources).length, 2, 'Should have exactly 2 sources')
  assert.ok(result.sources['Unity League'], 'Should have Unity League')
  assert.ok(result.sources.Melee, 'Should have Melee')
  assert.ok(!result.sources['MTG Elo Project'], 'Should not have MTG Elo Project')
  assert.ok(!result.sources.Topdeck, 'Should not have Topdeck')
})

test('PlayerInfoManager: with only Topdeck source', async () => {
  const manager = createMockedManager()

  const result = await manager.getPlayerInfo({
    topdeckHandle: 'k0shiii'
  })

  assert.equal(Object.keys(result.sources).length, 1, 'Should have exactly 1 source')
  assert.ok(result.sources.Topdeck, 'Should have Topdeck')

  assert.equal(result.general.name, 'Björn Kimminich', 'Name should come from Topdeck')
  assert.ok(result.general.photo, 'Photo should be present from Topdeck')
})

test('PlayerInfoManager: with sources in different order (Melee first, then Unity)', async () => {
  const manager = createMockedManager()

  const result = await manager.getPlayerInfo({
    meleeUser: 'k0shiii',
    unityId: '16215'
  }, ['melee', 'unity'])

  assert.equal(result.general.name, 'Björn Kimminich', 'Name should use Melee version')
  assert.ok(result.general.photo.includes('unityleague.gg'),
    'Photo should come from Unity League as Melee does not return one')
  assert.ok(result.general.bio.includes('Untimely Malfunction'), 'Bio should contain text from Unity League and Melee profile')
  assert.ok(!result.general.bio.includes('Change the target of target spell or ability with a single target'),
    'Bio should not contain text from only Unity League profile')
})

// --- Consolidated subtest clusters from edgeCases.test.js, verboseLogging.test.js, winRatePrecision.test.js ---

test.describe('PlayerInfoManager: Edge Cases', () => {
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
})

test.describe('PlayerInfoManager: Verbose Logging', () => {
  test('PlayerInfoManager: verbose mode logs promoted properties', async () => {
    const manager = new PlayerInfoManager()

    const results = [
      {
        source: 'Source1',
        url: 'http://source1.com',
        name: 'Player Name'
      }
    ]

    const capturedLogs = []
    const originalLog = console.log
    console.log = (msg) => { capturedLogs.push(msg) }

    try {
      const merged = manager.mergeData(results, true)
      assert.equal(merged.general.name, 'Player Name')
      assert.ok(capturedLogs.some(log => log.includes('⬆️') && log.includes('name') && log.includes('Source1')),
        'Should log property promotion with ⬆️ emoji')
    } finally {
      console.log = originalLog
    }
  })

  test('PlayerInfoManager: verbose mode logs matching property values', async () => {
    const manager = new PlayerInfoManager()

    const results = [
      {
        source: 'Source1',
        url: 'http://source1.com',
        name: 'Player Name',
        team: 'Team A'
      },
      {
        source: 'Source2',
        url: 'http://source2.com',
        name: 'Player Name',
        team: 'Team A'
      }
    ]

    const capturedLogs = []
    const originalLog = console.log
    console.log = (msg) => { capturedLogs.push(msg) }

    try {
      manager.mergeData(results, true)
      assert.ok(capturedLogs.some(log => log.includes('🆗') && log.includes('name') && log.includes('Source2')),
        'Should log matching property with 🆗 emoji')
      assert.ok(capturedLogs.some(log => log.includes('🆗') && log.includes('team') && log.includes('Source2')),
        'Should log matching team property with 🆗 emoji')
    } finally {
      console.log = originalLog
    }
  })

  test('PlayerInfoManager: verbose mode logs conflicting property values', async () => {
    const manager = new PlayerInfoManager()

    const results = [
      {
        source: 'Source1',
        url: 'http://source1.com',
        name: 'Alice'
      },
      {
        source: 'Source2',
        url: 'http://source2.com',
        name: 'Bob'
      }
    ]

    const capturedLogs = []
    const originalLog = console.log
    console.log = (msg) => { capturedLogs.push(msg) }

    try {
      const merged = manager.mergeData(results, true)
      assert.equal(merged.general.name, 'Alice', 'Should keep first value')
      assert.ok(capturedLogs.some(log => log.includes('🆚') && log.includes('name') && log.includes('Source2') && log.includes('Bob') && log.includes('Alice')),
        'Should log conflicting property with 🆚 emoji')
    } finally {
      console.log = originalLog
    }
  })

  test('PlayerInfoManager: verbose mode uses photo emoji for photo conflicts', async () => {
    const manager = new PlayerInfoManager()

    const results = [
      {
        source: 'Source1',
        url: 'http://source1.com',
        name: 'Player',
        photo: 'http://photo1.jpg'
      },
      {
        source: 'Source2',
        url: 'http://source2.com',
        name: 'Player',
        photo: 'http://photo2.jpg'
      }
    ]

    const capturedLogs = []
    const originalLog = console.log
    console.log = (msg) => { capturedLogs.push(msg) }

    try {
      manager.mergeData(results, true)
      assert.ok(capturedLogs.some(log => log.includes('🆕') && log.includes('photo')),
        'Should log photo conflict with 🆕 emoji instead of 🆚')
    } finally {
      console.log = originalLog
    }
  })

  test('PlayerInfoManager: verbose mode logs with null/undefined properties', async () => {
    const manager = new PlayerInfoManager()

    const results = [
      {
        source: 'Source1',
        url: 'http://source1.com',
        name: 'Player',
        bio: null,
        team: undefined
      },
      {
        source: 'Source2',
        url: 'http://source2.com',
        name: 'Player',
        bio: 'Test bio',
        team: 'Team A'
      }
    ]

    const capturedLogs = []
    const originalLog = console.log
    console.log = (msg) => { capturedLogs.push(msg) }

    try {
      manager.mergeData(results, true)
      assert.ok(capturedLogs.some(log => log.includes('⬆️') && log.includes('bio') && log.includes('Source2')),
        'Should promote bio from Source2 after Source1 had null')
      assert.ok(capturedLogs.some(log => log.includes('⬆️') && log.includes('team') && log.includes('Source2')),
        'Should promote team from Source2 after Source1 had undefined')
    } finally {
      console.log = originalLog
    }
  })

  test('PlayerInfoManager: verbose mode is false by default and logs nothing', async () => {
    const manager = new PlayerInfoManager()

    const results = [
      {
        source: 'Source1',
        url: 'http://source1.com',
        name: 'Player Name'
      }
    ]

    const capturedLogs = []
    const originalLog = console.log
    console.log = (msg) => { capturedLogs.push(msg) }

    try {
      manager.mergeData(results, false)
      assert.equal(capturedLogs.length, 0, 'Should not log when verbose is false')
    } finally {
      console.log = originalLog
    }
  })

  test('PlayerInfoManager: verbose mode logs each property separately', async () => {
    const manager = new PlayerInfoManager()

    const results = [
      {
        source: 'Source1',
        url: 'http://source1.com',
        name: 'Alice',
        team: 'Team A',
        bio: 'Bio 1',
        photo: 'photo1.jpg',
        pronouns: 'they/them'
      }
    ]

    const capturedLogs = []
    const originalLog = console.log
    console.log = (msg) => { capturedLogs.push(msg) }

    try {
      manager.mergeData(results, true)
      const promotedLogs = capturedLogs.filter(log => log.includes('⬆️'))
      assert.ok(promotedLogs.length >= 5, `Should log 5+ promoted properties, got ${promotedLogs.length}`)
      assert.ok(promotedLogs.some(log => log.includes('name')))
      assert.ok(promotedLogs.some(log => log.includes('team')))
      assert.ok(promotedLogs.some(log => log.includes('bio')))
      assert.ok(promotedLogs.some(log => log.includes('photo')))
      assert.ok(promotedLogs.some(log => log.includes('pronouns')))
    } finally {
      console.log = originalLog
    }
  })
})

test.describe('PlayerInfoManager: Win Rate Calculation', () => {
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
})
