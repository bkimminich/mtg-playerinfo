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

  async searchByName(name) {
    const parts = name.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');

    if (!lastName) {
      return [];
    }

    const url = `https://mtgeloproject.net/api/search/${encodeURIComponent(lastName)}/${encodeURIComponent(firstName)}`;
    try {
      const { data: rawData } = await request(url, {
        maxRedirects: 10,
        headers: {
          'Accept': 'application/json'
        }
      });
      const data = JSON.parse(rawData);
      if (data && data.hits) {
        return data.hits.map(hit => ({
          source: 'MTG Elo Project',
          url: `https://mtgeloproject.net/profile/${hit.player_id}`,
          name: `${hit.first_name} ${hit.last_name}`,
          details: {
            player_id: hit.player_id,
            current_elo: hit.current_elo,
            last_event: hit.last_event
          }
        }));
      }
      return [];
    } catch (error) {
      console.error(`Error searching MTG Elo Project for ${name}:`, error.message);
      return [];
    }
  }
}

module.exports = MtgEloFetcher;
