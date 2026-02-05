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
      general: {},
      sources: {}
    };

    const seenUrls = new Set();

    const winRates = [];

    results.forEach(res => {
      if (seenUrls.has(res.url)) return;
      seenUrls.add(res.url);

      const generalProps = ['name', 'photo', 'age', 'bio', 'team', 'country', 'hometown', 'pronouns', 'facebook', 'twitch', 'youtube'];
      generalProps.forEach(prop => {
        if (res[prop] && !player.general[prop]) {
          player.general[prop] = res[prop];
        }
      });

      const winRateStr = res['win rate'] || res.winRate;
      if (winRateStr && typeof winRateStr === 'string') {
        const winRate = parseFloat(winRateStr.replace('%', ''));
        if (!isNaN(winRate)) {
          winRates.push(winRate);
        }
      }

      const sourceData = { ...res };
      delete sourceData.source;
      delete sourceData.url;
      delete sourceData.name;
      delete sourceData.photo;

      generalProps.forEach(prop => {
        if (player.general[prop] === res[prop]) {
          delete sourceData[prop];
        }
      });

      player.sources[res.source] = {
        url: res.url,
        data: sourceData
      };
    });

    if (winRates.length > 0) {
      const avgWinRate = winRates.reduce((a, b) => a + b, 0) / winRates.length;
      player.general['win rate'] = avgWinRate.toFixed(2) + '%';
    }

    return player;
  }
}

module.exports = PlayerInfoManager;
