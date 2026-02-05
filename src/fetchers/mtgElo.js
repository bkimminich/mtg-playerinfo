const { request } = require('../utils/httpClient');

class MtgEloFetcher {
  async fetchById(id) {
    const url = `https://mtgeloproject.net/profile/${id}`;
    try {
      const { data: html } = await request(url, {
        maxRedirects: 10
      });

      return this.parseHtml(html, url, id);
    } catch (error) {
      console.error(`Error fetching MTG Elo Project profile ${id}:`, error.message);
      return null;
    }
  }

  parseHtml(html, url, id) {
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);

    let name = '';
    let currentRating = '';
    let record = '';

    const astroIsland = $('astro-island[component-url*="Profile"]');
    if (astroIsland.length > 0) {
      try {
        const props = JSON.parse(astroIsland.attr('props'));
        const info = props.info[1];
        name = `${info.first_name[1]} ${info.last_name[1]}`;
        currentRating = Math.round(info.current_rating[1]).toString();
        const r = info.record[1];
        record = `${r[0][1]}-${r[1][1]}-${r[2][1]}`;
      } catch (e) {
        console.error('Error parsing MTG Elo props:', e.message);
      }
    }

    if (!name) {
      name = $('.text-\\[22pt\\]').text().trim();
      if (name.includes(',')) {
        const parts = name.split(',').map(s => s.trim());
        name = `${parts[1]} ${parts[0]}`;
      }
    }

    if (!currentRating) {
      currentRating = $('.text-\\[18pt\\]:contains("Current rating")').find('.font-bold').text().trim();
    }

    if (!record) {
      const recordText = $('.text-\\[18pt\\]:contains("Record")').text();
      record = recordText.replace('Record:', '').trim();
    }

    if (!name) return null;

    const details = {
      player_id: id,
      current_rating: currentRating,
      record: record
    };

    if (record && record.includes('-')) {
      const [w, l, d] = record.split('-').map(Number);
      if (!isNaN(w) && !isNaN(l)) {
        const wins = w;
        const losses = l;
        const draws = isNaN(d) ? 0 : d;
        const total = wins + losses + draws;
        if (total > 0) {
          details['Win Rate'] = ((wins / total) * 100).toFixed(2) + '%';
        }
      }
    }

    return {
      source: 'MTG Elo Project',
      url: url,
      name: name,
      details: details
    };
  }
}

module.exports = MtgEloFetcher;
