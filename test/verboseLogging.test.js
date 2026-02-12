const test = require('node:test')
const assert = require('node:assert/strict')
const PlayerInfoManager = require('../src')

test('PlayerInfoManager: verbose mode logs promoted properties', async () => {
  const manager = new PlayerInfoManager()

  const results = [
    {
      source: 'Source1',
      url: 'http://source1.com',
      name: 'Player Name'
    }
  ]

  let capturedLogs = []
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

  let capturedLogs = []
  const originalLog = console.log
  console.log = (msg) => { capturedLogs.push(msg) }

  try {
    const merged = manager.mergeData(results, true)
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

  let capturedLogs = []
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

  let capturedLogs = []
  const originalLog = console.log
  console.log = (msg) => { capturedLogs.push(msg) }

  try {
    const merged = manager.mergeData(results, true)
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

  let capturedLogs = []
  const originalLog = console.log
  console.log = (msg) => { capturedLogs.push(msg) }

  try {
    const merged = manager.mergeData(results, true)
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

  let capturedLogs = []
  const originalLog = console.log
  console.log = (msg) => { capturedLogs.push(msg) }

  try {
    const merged = manager.mergeData(results, false)
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

  let capturedLogs = []
  const originalLog = console.log
  console.log = (msg) => { capturedLogs.push(msg) }

  try {
    const merged = manager.mergeData(results, true)
    // Should have multiple promoted property logs
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

