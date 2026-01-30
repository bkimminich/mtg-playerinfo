const { request } = require('../utils/httpClient');
const cheerio = require('cheerio');

class MeleeFetcher {
  async fetchById(username) {
    const url = `https://melee.gg/Profile/Index/${username}`;
    try {
      const { data } = await request(url);
      return this.parseHtml(data, url, username);
    } catch (error) {
      console.error(`Error fetching Melee profile ${username}:`, error.message);
      return null;
    }
  }

  parseHtml(html, url, username) {
    const $ = cheerio.load(html);
    const name = $('span[style*="font-size: xx-large"]').first().text().trim() || username;
    const photo = $('img.m-auto').attr('src');
    
    const data = {
      source: 'Melee',
      url,
      name,
      photo: photo ? (photo.startsWith('http') ? photo : `https://melee.gg${photo}`) : null,
      details: {
        username
      }
    };

    return data;
  }
}

module.exports = MeleeFetcher;
