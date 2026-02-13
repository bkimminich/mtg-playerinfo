const { request } = require('../utils/httpClient')

class UntappedFetcher {
  async fetchById (id) {
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

      return this.parseMatches(matches, url)
    } catch (error) {
      console.error(`Error fetching Untapped profile ${id}:`, error.message)
      return null
    }
  }

  parseMatches (matches, url) {
    const data = {
      source: 'Untapped.gg',
      url,
      mtga_rank: {}
    }

    const constructedMatch = this.findMostRecentByFormat(matches, 2)
    const constructedRank = this.formatRank(constructedMatch)
    if (constructedRank) {
      data.mtga_rank.constructed = constructedRank
    }

    const limitedMatch = this.findMostRecentByFormat(matches, 1)
    const limitedRank = this.formatRank(limitedMatch)
    if (limitedRank) {
      data.mtga_rank.limited = limitedRank
    }

    return data
  }

  formatRank (match) {
    if (!match || !match.friendly_ranking_class_after) {
      return null
    }

    if (match.friendly_ranking_class_after === 'Mythic') {
      if (match.friendly_mythic_leaderboard_place_after !== null && match.friendly_mythic_leaderboard_place_after !== undefined) {
        return `Mythic #${match.friendly_mythic_leaderboard_place_after}`
      } else if (match.friendly_mythic_percentile_after !== null && match.friendly_mythic_percentile_after !== undefined) {
        return `Mythic ${Math.floor(match.friendly_mythic_percentile_after)}%`
      }
      return null
    }

    if (match.friendly_ranking_tier_after !== null && match.friendly_ranking_tier_after !== undefined) {
      return `${match.friendly_ranking_class_after} ${match.friendly_ranking_tier_after}`
    }

    return null
  }

  findMostRecentByFormat (matches, superFormat) {
    const filteredMatches = matches.filter(match => match.super_format === superFormat)
    if (filteredMatches.length === 0) {
      return null
    }
    return filteredMatches.reduce((latest, current) => {
      return (current.match_start > latest.match_start) ? current : latest
    })
  }
}

module.exports = UntappedFetcher
