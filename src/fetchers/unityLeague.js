const httpClient = require('../utils/httpClient')
const cheerio = require('cheerio')

class UnityLeagueFetcher {
  async fetchById (id) {
    const url = `https://unityleague.gg/player/${id}/`
    try {
      const { data } = await httpClient.request(url)
      return this.parseHtml(data, url)
    } catch (error) {
      console.error(`Error fetching Unity League player ${id}:`, error.message)
      return null
    }
  }

  parseHtml (html, url) {
    const $ = cheerio.load(html)
    const name = $('h1.d-inline').text().trim()
    let photo = $('.card-body img.img-fluid').first().attr('src')
    if (photo && !photo.includes('player_profile')) {
      photo = null
    }

    const data = {
      source: 'Unity League',
      url,
      name,
      photo: photo ? (photo.startsWith('http') ? photo : `https://unityleague.gg${photo}`) : null
    }

    const headerFlag = $('.card-body i.fi').first()
    if (headerFlag.length > 0) {
      const classes = headerFlag.attr('class').split(' ')
      const countryClass = classes.find(c => c.startsWith('fi-'))
      if (countryClass) {
        data.country = countryClass.replace('fi-', '')
      }
    }

    $('dt.small.text-muted').each((i, el) => {
      const key = $(el).text().trim().replace(/:$/, '').toLowerCase()
      const dd = $(el).next('dd')
      let value = dd.text().trim()

      if (key === 'country') {
        const flagIcon = dd.find('i.fi')
        if (flagIcon.length > 0) {
          const classes = flagIcon.attr('class').split(' ')
          const countryClass = classes.find(c => c.startsWith('fi-'))
          if (countryClass) {
            value = countryClass.replace('fi-', '')
          }
        }
      }

      data[key] = value
    })

    const bioElement = $('.card-body > small.mt-2').first()
    if (bioElement.length > 0) {
      data.bio = bioElement.text().trim()
    }

    const rankingTable = $('table.table-sm').first()
    if (rankingTable.length) {
      const headers = rankingTable.find('th').map((i, el) => $(el).text().trim()).get()
      const values = rankingTable.find('tbody td').map((i, el) => $(el).text().trim()).get()

      headers.forEach((header, i) => {
        if (header && values[i]) {
          let val = values[i]
          val = val.replace(/\D/g, '') // remove non-numeric characters to support #23->23, 1st->1, and 42nd->42 etc.
          if (val) {
            data[`rank ${header.toLowerCase()}`] = val
          }
        }
      })
    }

    // Extract tournament record and win rate
    const overallRow = $('table.table tr').filter((i, el) => {
      return $(el).find('td').first().text().trim() === 'Overall'
    })

    if (overallRow.length > 0) {
      const cells = overallRow.find('td')
      if (cells.length >= 3) {
        const record = $(cells[1]).text().trim().replace(/\s+/g, '')
        const winRate = $(cells[2]).text().trim()
        data.record = record
        data['win rate'] = winRate
      }
    }

    return data
  }
}

module.exports = UnityLeagueFetcher
