const test = require('node:test')
const assert = require('node:assert/strict')
const { dedupeEvents, isSameEvent, nameSimilarity } = require('../src/utils/eventDedup')
const UnityLeagueFetcher = require('../src/fetchers/unityLeague')
const { readFixture } = require('../test_utils/helpers')

test('nameSimilarity: partial match between Unity and Topdeck event names', () => {
  const score = nameSimilarity('Premodern Weekly', 'Untap Altona Premodern Weekly 18.03')
  assert.ok(score >= 0.5, `expected >= 0.5, got ${score}`)
})

test('isSameEvent: same date + same record + partial name match -> duplicate', () => {
  const a = { date: '2026-03-18', name: 'Premodern Weekly', wins: 3, losses: 0, draws: 1 }
  const b = { date: '2026-03-18', name: 'Untap Altona Premodern Weekly 18.03', wins: 3, losses: 0, draws: 1 }
  assert.strictEqual(isSameEvent(a, b), true)
})

test('isSameEvent: same date but different record -> not a duplicate', () => {
  const a = { date: '2026-03-18', name: 'Premodern Weekly', wins: 3, losses: 0, draws: 1 }
  const b = { date: '2026-03-18', name: 'Premodern Weekly', wins: 2, losses: 1, draws: 1 }
  assert.strictEqual(isSameEvent(a, b), false)
})

test('isSameEvent: same record but different date -> not a duplicate', () => {
  const a = { date: '2026-03-18', name: 'Premodern Weekly', wins: 3, losses: 0, draws: 1 }
  const b = { date: '2026-03-11', name: 'Premodern Weekly', wins: 3, losses: 0, draws: 1 }
  assert.strictEqual(isSameEvent(a, b), false)
})

test('isSameEvent: same date + same record but unrelated names -> not a duplicate', () => {
  const a = { date: '2026-03-18', name: 'Premodern Weekly', wins: 3, losses: 0, draws: 1 }
  const b = { date: '2026-03-18', name: 'Modern Showdown', wins: 3, losses: 0, draws: 1 }
  assert.strictEqual(isSameEvent(a, b), false)
})

test('UnityLeagueFetcher: parseHtml emits normalized events array from fixture', () => {
  const html = readFixture('unityLeague.html')
  const fetcher = new UnityLeagueFetcher()
  const result = fetcher.parseHtml(html, 'https://unityleague.gg/player/16215/')

  assert.ok(Array.isArray(result.events), 'expected events array')
  assert.ok(result.events.length > 0, 'expected non-empty events array')
  for (const e of result.events) {
    assert.match(e.date, /^\d{4}-\d{2}-\d{2}$/, `bad date: ${e.date}`)
    assert.strictEqual(typeof e.wins, 'number')
    assert.strictEqual(typeof e.losses, 'number')
    assert.strictEqual(typeof e.draws, 'number')
    assert.ok(e.name, 'expected event name')
  }

  // Two known duplicates exist with Topdeck data: 2026-03-18/3-0-1 and 2026-03-11/3-1-0
  const has0318 = result.events.some(e => e.date === '2026-03-18' && e.wins === 3 && e.losses === 0 && e.draws === 1)
  const has0311 = result.events.some(e => e.date === '2026-03-11' && e.wins === 3 && e.losses === 1 && e.draws === 0)
  assert.ok(has0318, 'expected 2026-03-18 3-0-1 event')
  assert.ok(has0311, 'expected 2026-03-11 3-1-0 event')
})

test('dedupeEvents: collapses two known UnityLeague/Topdeck duplicates from fixtures', () => {
  const html = readFixture('unityLeague.html')
  const fetcher = new UnityLeagueFetcher()
  const ulResult = fetcher.parseHtml(html, 'url')

  const td = JSON.parse(readFixture('topdeck.json'))
  const tdEvents = []
  Object.values(td.gameFormats || {}).forEach(arr => {
    arr.forEach(e => {
      const m = String(e.record).match(/^(\d+)-(\d+)-(\d+)$/)
      if (!m) return
      tdEvents.push({
        source: 'Topdeck',
        date: String(e.date).slice(0, 10),
        name: e.name,
        format: e.rawFormat,
        wins: parseInt(m[1], 10),
        losses: parseInt(m[2], 10),
        draws: parseInt(m[3], 10)
      })
    })
  })

  const merged = [...ulResult.events, ...tdEvents]
  const unique = dedupeEvents(merged)
  assert.strictEqual(merged.length - unique.length, 2, `expected exactly 2 duplicates removed, got ${merged.length - unique.length}`)
})
