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

    let totalWins = 0;
    let totalLosses = 0;
    let totalDraws = 0;
    let hasRecord = false;

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

        const recordStr = res.details.Record || res.details.record;
        if (recordStr && typeof recordStr === 'string' && recordStr.includes('-')) {
          const [w, l, d] = recordStr.split('-').map(Number);
          if (!isNaN(w) && !isNaN(l)) {
            totalWins += w;
            totalLosses += l;
            totalDraws += isNaN(d) ? 0 : d;
            hasRecord = true;
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

    if (hasRecord) {
      player.general['Total Record'] = `${totalWins}-${totalLosses}-${totalDraws}`;
      const totalGames = totalWins + totalLosses + totalDraws;
      if (totalGames > 0) {
        player.general['Total Win Rate'] = ((totalWins / totalGames) * 100).toFixed(2) + '%';
      } else {
        player.general['Total Win Rate'] = '0.00%';
      }
    }

    return player;
  }
}

module.exports = PlayerInfoManager;
