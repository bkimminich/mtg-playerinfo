const UnityLeagueFetcher = require('./fetchers/unityLeague');
const MtgEloFetcher = require('./fetchers/mtgElo');
const MeleeFetcher = require('./fetchers/melee');
const TopdeckFetcher = require('./fetchers/topdeck');

class PlayerInfoManager {
  constructor() {
    this.fetchers = {
      unity: new UnityLeagueFetcher(),
      mtgelo: new MtgEloFetcher(),
      melee: new MeleeFetcher(),
      topdeck: new TopdeckFetcher()
    };
  }

  async getPlayerInfo(options) {
    const results = [];

    if (options.unityId) results.push(await this.fetchers.unity.fetchById(options.unityId));
    if (options.mtgeloId) results.push(await this.fetchers.mtgelo.fetchById(options.mtgeloId));
    if (options.meleeUser) results.push(await this.fetchers.melee.fetchById(options.meleeUser));
    if (options.topdeckHandle) results.push(await this.fetchers.topdeck.fetchById(options.topdeckHandle));

    const filteredResults = results.filter(r => r !== null);
    return this.mergeData(filteredResults);
  }

  mergeData(results) {
    const player = {
      name: null,
      photo: null,
      general: {},
      sources: {}
    };

    const seenUrls = new Set();

    const winRates = [];

    results.forEach(res => {
      if (seenUrls.has(res.url)) return;
      seenUrls.add(res.url);

      if (!player.name && res.name) player.name = res.name;
      if (!player.photo && res.photo) player.photo = res.photo;

      if (res.details) {
        if (res.details.Age && !player.general.Age) player.general.Age = res.details.Age;
        if (res.details.Bio && !player.general.Bio) player.general.Bio = res.details.Bio;
        if (res.details.Team && !player.general.Team) player.general.Team = res.details.Team;
        if (res.details.Country && !player.general.Country) player.general.Country = res.details.Country;
        if (res.details.Hometown && !player.general.Hometown) player.general.Hometown = res.details.Hometown;

        const winRateStr = res.details['Win Rate'] || res.details.winRate;
        if (winRateStr && typeof winRateStr === 'string') {
          const winRate = parseFloat(winRateStr.replace('%', ''));
          if (!isNaN(winRate)) {
            winRates.push(winRate);
          }
        }
      }

      const sourceData = { ...res.details };
      if (res.source === 'Unity League') {
        delete sourceData.Age;
        delete sourceData.Bio;
        delete sourceData.Hometown;
        delete sourceData.Team;
        delete sourceData.Country;
      }

      player.sources[res.source] = {
        url: res.url,
        data: sourceData
      };
    });

    if (winRates.length > 0) {
      const avgWinRate = winRates.reduce((a, b) => a + b, 0) / winRates.length;
      player.general['Win Rate'] = avgWinRate.toFixed(2) + '%';
    }

    return player;
  }
}

module.exports = PlayerInfoManager;
