const { request } = require('../utils/httpClient');
const cheerio = require('cheerio');

class TopdeckFetcher {
  async fetchById(handle) {
    const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
    const url = `https://topdeck.gg/profile/${cleanHandle}`;
    try {
      const { data } = await request(url);
      return this.parseHtml(data, url, cleanHandle);
    } catch (error) {
      console.error(`Error fetching Topdeck profile ${handle}:`, error.message);
      return null;
    }
  }

  parseHtml(html, url, handle) {
    const $ = cheerio.load(html);
    const name = $('h1').first().text().trim() || handle;
    const photo = $('img[src*="avatar"], img[src*="profile"]').first().attr('src');

    const data = {
      source: 'Topdeck',
      url,
      name,
      photo: photo ? (photo.startsWith('http') ? photo : `https://topdeck.gg${photo}`) : null,
      details: {
        handle
      }
    };

    $('.stats-container, .player-stats').each((i, el) => {
       $(el).find('.stat').each((j, statEl) => {
          const label = $(statEl).find('.label').text().trim();
          const value = $(statEl).find('.value').text().trim();
          if (label && value) {
            data.details[label] = value;
          }
       });
    });

    return data;
  }
}

module.exports = TopdeckFetcher;
