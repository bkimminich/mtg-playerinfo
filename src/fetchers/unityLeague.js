const { request } = require('../utils/httpClient');
const cheerio = require('cheerio');

class UnityLeagueFetcher {
  async fetchById(id) {
    const url = `https://unityleague.gg/player/${id}/`;
    try {
      const { data } = await request(url);
      return this.parseHtml(data, url);
    } catch (error) {
      console.error(`Error fetching Unity League player ${id}:`, error.message);
      return null;
    }
  }

  parseHtml(html, url) {
    const $ = cheerio.load(html);
    const name = $('h1.d-inline').text().trim();
    let photo = $('.card-body img.img-fluid').first().attr('src');
    if (photo && !photo.includes('player_profile')) {
      photo = null;
    }

    const data = {
      source: 'Unity League',
      url,
      name,
      photo: photo ? (photo.startsWith('http') ? photo : `https://unityleague.gg${photo}`) : null,
      details: {}
    };

    const headerFlag = $('.card-body i.fi').first();
    if (headerFlag.length > 0) {
      const classes = headerFlag.attr('class').split(' ');
      const countryClass = classes.find(c => c.startsWith('fi-'));
      if (countryClass) {
        data.details.Country = countryClass.replace('fi-', '');
      }
    }

    $('dt.small.text-muted').each((i, el) => {
      const key = $(el).text().trim().replace(/:$/, '');
      const dd = $(el).next('dd');
      let value = dd.text().trim();

      if (key === 'Country') {
        const flagIcon = dd.find('i.fi');
        if (flagIcon.length > 0) {
          const classes = flagIcon.attr('class').split(' ');
          const countryClass = classes.find(c => c.startsWith('fi-'));
          if (countryClass) {
            value = countryClass.replace('fi-', '');
          }
        }
      }

      data.details[key] = value;
    });

    const bioElement = $('.card-body > small.mt-2').first();
    if (bioElement.length > 0) {
      data.details.Bio = bioElement.text().trim();
    }

    const rankingTable = $('table.table-sm').first();
    if (rankingTable.length) {
      const headers = rankingTable.find('th').map((i, el) => $(el).text().trim()).get();
      const values = rankingTable.find('tbody td').map((i, el) => $(el).text().trim()).get();

      headers.forEach((header, i) => {
        if (header && values[i]) {
          let val = values[i];
          if (val.startsWith('#')) {
            val = val.substring(1);
          }
          data.details[`Rank ${header}`] = val;
        }
      });
    }

    // Extract tournament record and win rate
    const overallRow = $('table.table tr').filter((i, el) => {
      return $(el).find('td').first().text().trim() === 'Overall';
    });

    if (overallRow.length > 0) {
      const cells = overallRow.find('td');
      if (cells.length >= 3) {
        const record = $(cells[1]).text().trim().replace(/\s+/g, '');
        const winRate = $(cells[2]).text().trim();
        data.details.Record = record;
        data.details['Win Rate'] = winRate;
      }
    }

    return data;
  }
}

module.exports = UnityLeagueFetcher;
