const { request } = require('../utils/httpClient')
const cheerio = require('cheerio')

class TopdeckFetcher {
  async fetchById (handle) {
    const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`
    const url = `https://topdeck.gg/profile/${cleanHandle}`
    try {
      const { data } = await request(url)
      const playerInfo = this.parseHtml(data, url, cleanHandle)

      // Try to fetch stats via XHR if internal ID is found
      const internalIdMatch = data.match(/https:\/\/topdeck\.gg\/profile\/([a-zA-Z0-9]+)\/stats/) || data.match(/const playerId = "([a-zA-Z0-9]+)";/)
      const internalId = internalIdMatch ? internalIdMatch[1] : null

      if (internalId) {
        try {
          const statsUrl = `https://topdeck.gg/profile/${internalId}/stats`
          const statsResponse = await request(statsUrl)
          const statsJson = statsResponse.data
          const stats = typeof statsJson === 'string' ? JSON.parse(statsJson) : statsJson

          if (stats) {
            if (stats.yearlyStats) {
              let totalTournaments = 0
              let wins = 0
              let losses = 0
              let draws = 0

              Object.values(stats.yearlyStats).forEach(yearData => {
                if (yearData.overall) {
                  totalTournaments += yearData.overall.totalTournaments || 0
                  wins += yearData.overall.wins || 0
                  losses += yearData.overall.losses || 0
                  draws += yearData.overall.draws || 0
                }
              })

              if (totalTournaments > 0) {
                playerInfo.tournaments = totalTournaments.toString()
                playerInfo.record = `${wins}-${losses}-${draws}`
                playerInfo['win rate'] = ((wins / (wins + losses + draws)) * 100).toFixed(2) + '%'
              }
            } else {
              playerInfo.tournaments = stats.totalTournaments || playerInfo.tournaments || '0'
              playerInfo.record = stats.overallRecord || playerInfo.record || '0-0-0'
              playerInfo['win rate'] = stats.overallWinRate || playerInfo['win rate'] || '0.00%'
              playerInfo.conversion = stats.conversionRate || playerInfo.conversion || '0.00%'
            }
          }
        } catch (statsError) {
          console.error(`Error fetching Topdeck stats for ${handle}:`, statsError.message)
        }
      }

      return playerInfo
    } catch (error) {
      console.error(`Error fetching Topdeck profile ${handle}:`, error.message)
      return null
    }
  }

  parseHtml (html, url, handle) {
    const $ = cheerio.load(html)
    const name = $('h2.text-white.fw-bold.mb-1').first().text().trim() || $('h1').first().text().trim() || handle
    const photo = $('img.rounded-circle.shadow-lg').first().attr('src') || $('img[src*="avatar"], img[src*="profile"]').first().attr('src')

    const data = {
      source: 'Topdeck',
      url,
      name,
      photo: photo ? (photo.startsWith('http') ? photo : `https://topdeck.gg${photo}`) : null
    }

    const statsMap = {
      totalTournaments: 'tournaments',
      overallRecord: 'record',
      overallWinRate: 'win rate',
      conversionRate: 'conversion'
    }

    Object.entries(statsMap).forEach(([id, label]) => {
      const val = $(`#${id}`).text().trim()
      if (val) {
        data[label] = val
      }
    })

    const currentStats = Object.keys(data).filter(k => Object.values(statsMap).includes(k))
    if (currentStats.length <= 1) {
      $('.stats-container, .player-stats').each((i, el) => {
        $(el).find('.stat').each((j, statEl) => {
          const label = $(statEl).find('.label').text().trim().toLowerCase()
          const value = $(statEl).find('.value').text().trim()
          if (label && value) {
            data[label] = value
          }
        })
      })
    }

    return data
  }
}

module.exports = TopdeckFetcher
