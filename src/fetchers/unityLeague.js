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
    if (photo && photo.includes('vertical.svg')) {
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
        data.details.Country = countryClass.replace('fi-', '').toUpperCase();
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
            value = countryClass.replace('fi-', '').toUpperCase();
          }
        }
      }

      data.details[key] = value;
    });

    const rankingTable = $('table.table-sm').first();
    if (rankingTable.length) {
      const headers = rankingTable.find('th').map((i, el) => $(el).text().trim()).get();
      const values = rankingTable.find('tbody td').map((i, el) => $(el).text().trim()).get();

      headers.forEach((header, i) => {
        if (header && values[i]) {
          data.details[`Rank ${header}`] = values[i];
        }
      });
    }

    return data;
  }
}

module.exports = UnityLeagueFetcher;
