function normName (s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function tokenSet (s) {
  return new Set(normName(s).split(' ').filter(t => t.length > 2))
}

function nameSimilarity (a, b) {
  const A = tokenSet(a)
  const B = tokenSet(b)
  if (!A.size || !B.size) return 0
  let n = 0
  A.forEach(t => { if (B.has(t)) n++ })
  return n / Math.min(A.size, B.size)
}

function isSameEvent (a, b, threshold = 0.34) {
  if (!a || !b) return false
  if (a.date !== b.date) return false
  if (a.wins !== b.wins || a.losses !== b.losses || a.draws !== b.draws) return false
  return nameSimilarity(a.name, b.name) >= threshold
}

function dedupeEvents (events, threshold = 0.34) {
  const kept = []
  for (const e of events || []) {
    if (!kept.some(k => isSameEvent(k, e, threshold))) kept.push(e)
  }
  return kept
}

module.exports = { dedupeEvents, isSameEvent, nameSimilarity, normName }
