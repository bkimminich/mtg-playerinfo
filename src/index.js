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
    return this.mergeData(filteredResults, options.verbose);
  }

  mergeData(results, verbose = false) {
    const player = {
      general: {},
      sources: {}
    };

    const seenUrls = new Set();
    const firstSeenValues = {};

    const winRates = [];

    results.forEach(res => {
      if (seenUrls.has(res.url)) return;
      seenUrls.add(res.url);

      const generalProps = ['name', 'photo', 'age', 'bio', 'team', 'country', 'hometown', 'pronouns', 'facebook', 'twitch', 'youtube'];
      generalProps.forEach(prop => {
        if (res[prop]) {
          if (!player.general[prop]) {
            player.general[prop] = res[prop];
            firstSeenValues[prop] = res[prop];
            if (verbose) {
              console.log(`⬆️: Promoted '${prop}' from ${res.source} to general information: ${res[prop]}`);
            }
          } else if (verbose) {
            if (res[prop] === firstSeenValues[prop]) {
              console.log(`🆗: ${res.source} has the same '${prop}' as seen before: ${res[prop]}`);
            } else {
              console.log(`${prop === 'photo' ? '🆕': '🆚'}️: ${res.source} has different '${prop}' than seen before: ${res[prop]} (instead of ${firstSeenValues[prop]})`);
            }
          }
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
