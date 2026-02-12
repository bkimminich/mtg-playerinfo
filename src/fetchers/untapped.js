const { request } = require('../utils/httpClient')

class UntappedFetcher {
  async fetchById (id) {
    // Split the two-part ID
    const parts = id.split('/')
    if (parts.length !== 2) {
      console.error('Untapped ID must be in format "userId/playerCode"')
      return null
    }

    const userId = parts[0]
    const playerCode = parts[1]
    const url = `https://mtga.untapped.gg/profile/${userId}/${playerCode}`
    const apiUrl = `https://api.mtga.untapped.gg/api/v1/games/users/${userId}/players/${playerCode}/?card_set=ECL`

    try {
      const { data } = await request(apiUrl)
      const matches = typeof data === 'string' ? JSON.parse(data) : data

      if (!Array.isArray(matches) || matches.length === 0) {
        console.warn(`No matches found for Untapped player ${id}`)
        return null
      }

      const mostRecentMatch = matches.reduce((latest, current) => {
        return (current.match_start > latest.match_start) ? current : latest
      })

      return this.parseMatch(mostRecentMatch, url)
    } catch (error) {
      console.error(`Error fetching Untapped profile ${id}:`, error.message)
      return null
    }
  }

  parseMatch (match, url) {
    const data = {
      source: 'Untapped.gg',
      url,
      mtga_rank: null
    }

    if (match.friendly_ranking_class_after && match.friendly_ranking_tier_after !== null && match.friendly_ranking_tier_after !== undefined) {
      data.mtga_rank = `${match.friendly_ranking_class_after} ${match.friendly_ranking_tier_after}`
    }

    return data
  }
}

module.exports = UntappedFetcher


