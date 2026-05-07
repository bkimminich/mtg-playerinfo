const UnityLeagueFetcher = require('./fetchers/unityLeague')
const MtgEloFetcher = require('./fetchers/mtgElo')
const MeleeFetcher = require('./fetchers/melee')
const TopdeckFetcher = require('./fetchers/topdeck')
const UntappedFetcher = require('./fetchers/untapped')
const { dedupeEvents } = require('./utils/eventDedup')

class PlayerInfoManager {
  constructor () {
    this.fetchers = {
      unity: new UnityLeagueFetcher(),
      mtgelo: new MtgEloFetcher(),
      melee: new MeleeFetcher(),
      topdeck: new TopdeckFetcher(),
      untapped: new UntappedFetcher()
    }
  }

  async getPlayerInfo (options, priorityOrder = []) {
    const fetcherMap = {
      unity: { option: 'unityId', fetcher: this.fetchers.unity },
      mtgelo: { option: 'mtgeloId', fetcher: this.fetchers.mtgelo },
      melee: { option: 'meleeUser', fetcher: this.fetchers.melee },
      topdeck: { option: 'topdeckHandle', fetcher: this.fetchers.topdeck },
      untapped: { option: 'untappedId', fetcher: this.fetchers.untapped }
    }

    // Default order if no priority specified
    const defaultOrder = ['unity', 'mtgelo', 'melee', 'topdeck', 'untapped']
    const order = priorityOrder.length > 0 ? priorityOrder : defaultOrder

    const results = []

    for (const source of order) {
      const config = fetcherMap[source]
      if (config && options[config.option]) {
        const result = await config.fetcher.fetchById(options[config.option])
        results.push(result)
      }
    }

    const filteredResults = results.filter(r => r !== null)
    return this.mergeData(filteredResults, options.verbose)
  }

  mergeData (results, verbose = false) {
    const player = {
      general: {},
      sources: {}
    }

    const seenUrls = new Set()
    const firstSeenValues = {}

    const winRates = []
    let totalWins = 0
    let totalLosses = 0
    let totalDraws = 0

    results.forEach(res => {
      if (seenUrls.has(res.url)) return
      seenUrls.add(res.url)

      const generalProps = ['name', 'photo', 'age', 'bio', 'team', 'country', 'hometown', 'pronouns', 'facebook', 'twitch', 'youtube', 'mtga_rank']
      generalProps.forEach(prop => {
        if (res[prop]) {
          if (!player.general[prop]) {
            player.general[prop] = res[prop]
            firstSeenValues[prop] = res[prop]
            if (verbose) {
              console.log(`⬆️: Promoted '${prop}' from ${res.source} to general information: ${res[prop]}`)
            }
          } else if (verbose) {
            if (res[prop] === firstSeenValues[prop]) {
              console.log(`🆗: ${res.source} has the same '${prop}' as seen before: ${res[prop]}`)
            } else {
              console.log(`${prop === 'photo' ? '🆕' : '🆚'}️: ${res.source} has different '${prop}' than seen before: ${res[prop]} (instead of ${firstSeenValues[prop]})`)
            }
          }
        }
      })

      const winRateStr = res['win rate'] || res.winRate
      if (winRateStr && typeof winRateStr === 'string') {
        const winRate = parseFloat(winRateStr.replace('%', ''))
        if (!isNaN(winRate)) {
          winRates.push(winRate)
        }
      }

      // Aggregate record only used for sources that don't expose per-event data;
      // sources with `events` contribute via the deduped union below.
      if (!Array.isArray(res.events) && res.record && typeof res.record === 'string' && res.record.includes('-')) {
        const parts = res.record.split('-').map(Number)
        if (parts.length >= 2 && parts.every(p => !isNaN(p))) {
          totalWins += parts[0]
          totalLosses += parts[1]
          totalDraws += parts[2] || 0
        }
      }

      const sourceData = { ...res }
      delete sourceData.source
      delete sourceData.url
      delete sourceData.events

      player.sources[res.source] = {
        url: res.url,
        data: sourceData
      }
    })

    // Cross-source dedup of per-event data (currently UnityLeague + Topdeck).
    // Same date + same W-L-D + at least partial name match collapses to one event.
    const allEvents = results.flatMap(r => Array.isArray(r.events) ? r.events : [])
    if (allEvents.length > 0) {
      const uniqueEvents = dedupeEvents(allEvents)
      uniqueEvents.forEach(e => {
        totalWins += e.wins
        totalLosses += e.losses
        totalDraws += e.draws
      })
      if (verbose) {
        const removed = allEvents.length - uniqueEvents.length
        if (removed > 0) {
          // Group dropped events by their kept counterpart so the log shows which event
          // (and from which source) was kept and which duplicate(s) were removed.
          const { isSameEvent } = require('./utils/eventDedup')
          const groups = uniqueEvents.map(k => ({ kept: k, dups: [] }))
          for (const e of allEvents) {
            const g = groups.find(gr => gr.kept === e) || groups.find(gr => isSameEvent(gr.kept, e))
            if (g && g.kept !== e) g.dups.push(e)
          }
          const details = groups
            .filter(g => g.dups.length > 0)
            .map(g => `"${g.kept.name}" [${g.kept.source}] (duplicates: ${g.dups.map(d => `"${d.name}" [${d.source}]`).join(', ')})`)
            .join('; ')
          console.log(`🧹: Removed ${removed} duplicate event(s) across sources for global win rate (${details})`)
        }
      }
    }

    const totalGames = totalWins + totalLosses + totalDraws
    if (totalGames > 0) {
      const overall = (totalWins / totalGames) * 100
      player.general['win rate'] = overall.toFixed(2) + '%'
    } else if (winRates.length > 0) {
      const avgWinRate = winRates.reduce((a, b) => a + b, 0) / winRates.length
      player.general['win rate'] = avgWinRate.toFixed(2) + '%'
    }

    return player
  }
}

module.exports = PlayerInfoManager
