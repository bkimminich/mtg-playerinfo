const httpClient = require('../utils/httpClient')
const cheerio = require('cheerio')
const { extractHandle, getPlatformName } = require('../utils/socialMediaExtractor')

class MeleeFetcher {
  async fetchById (username) {
    const url = `https://melee.gg/Profile/Index/${username}`
    try {
      const { data } = await httpClient.request(url)
      return this.parseHtml(data, url, username)
    } catch (error) {
      console.error(`Error fetching Melee profile ${username}:`, error.message)
      return null
    }
  }

  parseHtml (html, url, username) {
    const $ = cheerio.load(html)
    const name = $('span[style*="font-size: xx-large"]').first().text().trim() || username
    const pronouns = $('.profile-details span.text-muted.mr-2').filter((i, el) => $(el).text().includes('/')).first().text().trim()
    const bio = $('.profile-details div[style*="max-width: 75%"]').first().text().trim()
    // FIXME Photos cannot be loaded with unauthenticated requests from Melee.gg
    // const photo = $('.profile-button-column img').first().attr('src') || $('img.m-auto').attr('src');

    const data = {
      source: 'Melee',
      url,
      name,
      pronouns: pronouns || null,
      bio: bio || null
      // photo: photo ? (photo.startsWith('http') ? photo : `https://melee.gg${photo}`) : null
    }

    $('.social-link').each((i, el) => {
      const href = $(el).attr('href')
      if (href) {
        const handle = extractHandle(href)
        const platform = getPlatformName(href)
        if (handle && platform) {
          data[platform] = handle
        }
      }
    })

    return data
  }
}

module.exports = MeleeFetcher
