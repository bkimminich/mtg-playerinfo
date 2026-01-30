const { request } = require('../utils/httpClient');
const cheerio = require('cheerio');

class TopdeckFetcher {
  async fetchById(handle) {
    const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
    const url = `https://topdeck.gg/profile/${cleanHandle}`;
    try {
      const { data } = await request(url);
      const playerInfo = this.parseHtml(data, url, cleanHandle);

      // Try to fetch stats via XHR if internal ID is found
      const internalIdMatch = data.match(/https:\/\/topdeck\.gg\/profile\/([a-zA-Z0-9]+)\/stats/);
      const internalId = internalIdMatch ? internalIdMatch[1] : null;

      if (internalId) {
        try {
          const statsUrl = `https://topdeck.gg/profile/${internalId}/stats`;
          const statsResponse = await request(statsUrl);
          const statsJson = statsResponse.data;
          const stats = typeof statsJson === 'string' ? JSON.parse(statsJson) : statsJson;

          if (stats) {
            playerInfo.details['Tournaments'] = stats.totalTournaments || playerInfo.details['Tournaments'] || '0';
            playerInfo.details['Record'] = stats.overallRecord || playerInfo.details['Record'] || '0-0-0';
            playerInfo.details['Win Rate'] = stats.overallWinRate || playerInfo.details['Win Rate'] || '0.00%';
            playerInfo.details['Conversion'] = stats.conversionRate || playerInfo.details['Conversion'] || '0.00%';
          }
        } catch (statsError) {
          console.error(`Error fetching Topdeck stats for ${handle}:`, statsError.message);
        }
      }

      return playerInfo;
    } catch (error) {
      console.error(`Error fetching Topdeck profile ${handle}:`, error.message);
      return null;
    }
  }

  parseHtml(html, url, handle) {
    const $ = cheerio.load(html);
    const name = $('h2.text-white.fw-bold.mb-1').first().text().trim() || $('h1').first().text().trim() || handle;
    const photo = $('img.rounded-circle.shadow-lg').first().attr('src') || $('img[src*="avatar"], img[src*="profile"]').first().attr('src');

    const data = {
      source: 'Topdeck',
      url,
      name,
      photo: photo ? (photo.startsWith('http') ? photo : `https://topdeck.gg${photo}`) : null,
      details: {
        handle
      }
    };

    const statsMap = {
      'totalTournaments': 'Tournaments',
      'overallRecord': 'Record',
      'overallWinRate': 'Win Rate',
      'conversionRate': 'Conversion'
    };

    Object.entries(statsMap).forEach(([id, label]) => {
      const val = $(`#${id}`).text().trim();
      if (val) {
        data.details[label] = val;
      }
    });

    if (Object.keys(data.details).length === 1) {
      $('.stats-container, .player-stats').each((i, el) => {
        $(el).find('.stat').each((j, statEl) => {
          const label = $(statEl).find('.label').text().trim();
          const value = $(statEl).find('.value').text().trim();
          if (label && value) {
            data.details[label] = value;
          }
        });
      });
    }

    return data;
  }
}

module.exports = TopdeckFetcher;
