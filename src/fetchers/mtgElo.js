const httpClient = require('../utils/httpClient')

class MtgEloFetcher {
  async fetchById (id) {
    const url = `https://mtgeloproject.net/profile/${id}`
    try {
      const { data: html } = await httpClient.request(url, {
        maxRedirects: 10
      })

      const data = this.parseHtml(html, url, id)
      if (data) {
        await this.fetchEvents(id, data)
      }
      return data
    } catch (error) {
      console.error(`Error fetching MTG Elo Project profile ${id}:`, error.message)
      return null
    }
  }

  async fetchEvents (id, playerInfo) {
    // MTG Elo Project exposes per-tournament data via two JSON endpoints:
    //   /api/players/:id/events  -> { data: [{ code, name, date, format, ... }] }
    //   /api/players/:id/matches -> { <eventCode>: [{ result: "Won 2-0"|"Lost 0-2"|"Draw 1-1", ... }] }
    // Calling them directly is more stable than waiting for the JS-rendered HTML
    // (where W-L-D per tournament is computed client-side from these same payloads).
    try {
      const [eventsRes, matchesRes] = await Promise.all([
        httpClient.request(`https://mtgeloproject.net/api/players/${id}/events`),
        httpClient.request(`https://mtgeloproject.net/api/players/${id}/matches`)
      ])
      const eventsJson = typeof eventsRes.data === 'string' ? JSON.parse(eventsRes.data) : eventsRes.data
      const matchesJson = typeof matchesRes.data === 'string' ? JSON.parse(matchesRes.data) : matchesRes.data
      const events = this.buildEvents(eventsJson, matchesJson)
      if (events.length) {
        playerInfo.events = events
      }
    } catch (error) {
      console.error(`Error fetching MTG Elo Project events for ${id}:`, error.message)
    }
  }

  buildEvents (eventsJson, matchesJson) {
    const list = Array.isArray(eventsJson) ? eventsJson : (eventsJson && Array.isArray(eventsJson.data) ? eventsJson.data : [])
    const matchesByCode = matchesJson && typeof matchesJson === 'object' ? matchesJson : {}
    const events = []
    for (const ev of list) {
      if (!ev || !ev.code || !ev.date) continue
      const matches = matchesByCode[ev.code]
      if (!Array.isArray(matches)) continue
      let wins = 0
      let losses = 0
      let draws = 0
      for (const m of matches) {
        const r = String(m && m.result || '').trim()
        if (/^Won\b/i.test(r)) wins++
        else if (/^Lost\b/i.test(r)) losses++
        else if (/^Dr(ew|aw)\b/i.test(r)) draws++
      }
      if (wins + losses + draws === 0) continue
      events.push({
        source: 'MTG Elo Project',
        date: String(ev.date).slice(0, 10),
        name: ev.name || '',
        format: ev.format || null,
        wins,
        losses,
        draws
      })
    }
    return events
  }

  parseHtml (html, url, id) {
    const cheerio = require('cheerio')
    const $ = cheerio.load(html)

    let name = ''
    let currentRating = ''
    let record = ''

    const astroIsland = $('astro-island[component-url*="Profile"]')
    if (astroIsland.length > 0) {
      try {
        const props = JSON.parse(astroIsland.attr('props'))
        const info = props.info[1]
        name = `${info.first_name[1]} ${info.last_name[1]}`
        currentRating = Math.round(info.current_rating[1]).toString()
        const r = info.record[1]
        record = `${r[0][1]}-${r[1][1]}-${r[2][1]}`
      } catch (e) {
        console.error('Error parsing MTG Elo props:', e.message)
      }
    }

    if (!name) {
      name = $('.text-\\[22pt\\]').text().trim()
      if (name.includes(',')) {
        const parts = name.split(',').map(s => s.trim())
        name = `${parts[1]} ${parts[0]}`
      }
    }

    if (!currentRating) {
      currentRating = $('.text-\\[18pt\\]:contains("Current rating")').find('.font-bold').text().trim()
    }

    if (!record) {
      const recordText = $('.text-\\[18pt\\]:contains("Record")').text()
      record = recordText.replace('Record:', '').trim()
    }

    if (!name) return null

    const data = {
      source: 'MTG Elo Project',
      url,
      name,
      player_id: id,
      current_rating: currentRating,
      record
    }

    if (record && record.includes('-')) {
      const [w, l, d] = record.split('-').map(Number)
      if (!isNaN(w) && !isNaN(l)) {
        const wins = w
        const losses = l
        const draws = isNaN(d) ? 0 : d
        const total = wins + losses + draws
        if (total > 0) {
          data['win rate'] = ((wins / total) * 100).toFixed(2) + '%'
        }
      }
    }

    return data
  }
}

module.exports = MtgEloFetcher
