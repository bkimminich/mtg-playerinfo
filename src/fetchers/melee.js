const { request } = require('../utils/httpClient')
const cheerio = require('cheerio')

class MeleeFetcher {
  async fetchById (username) {
    const url = `https://melee.gg/Profile/Index/${username}`
    try {
      const { data } = await request(url)
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
        try {
          const urlObj = new URL(href)
          const platform = urlObj.hostname.replace('www.', '').split('.')[0]
          let handle = urlObj.pathname.split('/').filter(Boolean).pop()
          if (handle) {
            handle = decodeURIComponent(handle)
            const label = platform.charAt(0).toLowerCase() + platform.slice(1)
            data[label] = handle
          }
        } catch (e) {
          console.log('Invalid URL in social link ' + href + ': ' + e.message)
        }
      }
    })

    return data
  }
}

module.exports = MeleeFetcher
