const { request } = require('../utils/httpClient');

class MtgEloFetcher {
  async fetchById(id) {
    const url = `https://mtgeloproject.net/profile/${id}`;
    try {
      const { data: html } = await request(url, {
        maxRedirects: 10
      });

      const cheerio = require('cheerio');
      const $ = cheerio.load(html);
      const name = $('h1').first().text().trim();

      if (!name) return null;

      const details = { player_id: id };
      $('.profile-info-item').each((i, el) => {
        const label = $(el).find('.label').text().trim();
        const value = $(el).find('.value').text().trim();
        if (label && value) details[label] = value;
      });

      return {
        source: 'MTG Elo Project',
        url: url,
        name: name,
        details: details
      };
    } catch (error) {
      console.error(`Error fetching MTG Elo Project profile ${id}:`, error.message);
      return null;
    }
  }
}

module.exports = MtgEloFetcher;
