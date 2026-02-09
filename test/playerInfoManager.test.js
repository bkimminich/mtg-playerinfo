const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PlayerInfoManager = require('../src/index');

function readFixture(name) {
  return fs.readFileSync(path.join(__dirname, 'data', name), 'utf8');
}

const fixtures = {
  unityLeague: readFixture('unityLeague.html'),
  mtgElo: readFixture('mtgElo.html'),
  melee: readFixture('melee.html'),
  topdeck: readFixture('topdeck.html')
};

function createMockedManager() {
  const manager = new PlayerInfoManager();

  manager.fetchers.unity.fetchById = async function(id) {
    const url = `https://unityleague.gg/player/${id}/`;
    return this.parseHtml(fixtures.unityLeague, url);
  };

  manager.fetchers.mtgelo.fetchById = async function(id) {
    const url = `https://mtgeloproject.net/profile/${id}`;
    return this.parseHtml(fixtures.mtgElo, url, id);
  };

  manager.fetchers.melee.fetchById = async function(username) {
    const url = `https://melee.gg/Profile/Index/${username}`;
    return this.parseHtml(fixtures.melee, url, username);
  };

  manager.fetchers.topdeck.fetchById = async function(handle) {
    const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
    const url = `https://topdeck.gg/profile/${cleanHandle}`;
    return this.parseHtml(fixtures.topdeck, url, cleanHandle);
  };

  return manager;
}

test('PlayerInfoManager: getPlayerInfo with all four sources merges data correctly', async () => {
  const manager = createMockedManager();

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  });

  assert.ok(result.general, 'Result should have general property');
  assert.ok(result.sources, 'Result should have sources property');
  assert.ok(result.sources['Unity League'], 'Should have Unity League source');
  assert.ok(result.sources['MTG Elo Project'], 'Should have MTG Elo Project source');
  assert.ok(result.sources['Melee'], 'Should have Melee source');
  assert.ok(result.sources['Topdeck'], 'Should have Topdeck source');
});

test('PlayerInfoManager: name property takes priority from Unity League over MTG Elo', async () => {
  const manager = createMockedManager();

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  });

  assert.equal(result.general.name, 'Björn Kimminich', 'Name should come from Unity League');
});

test('PlayerInfoManager: photo property takes priority from Unity League over Topdeck', async () => {
  const manager = createMockedManager();

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  });

  assert.equal(result.general.photo, 'https://unityleague.gg/media/player_profile/1000023225.jpg',
    'Photo should come from Unity League');
});

test('PlayerInfoManager: country property comes from Unity League', async () => {
  const manager = createMockedManager();

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  });

  // Only Unity League provides country
  assert.equal(result.general.country, 'de', 'Country should come from Unity League');
});

test('PlayerInfoManager: bio property takes priority from Unity League over Melee', async () => {
  const manager = createMockedManager();

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  });

  assert.ok(result.general.bio, 'Bio should be present');
  assert.ok(result.general.bio.includes('Untimely Malfunction'), 'Bio should contain text from Unity League and Melee profile');
  assert.ok(result.general.bio.includes('Change the target of target spell or ability with a single target'),
    'Bio should contain text from only Unity League profile');
});

test('PlayerInfoManager: pronouns property comes from Melee', async () => {
  const manager = createMockedManager();

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  });

  assert.equal(result.general.pronouns, 'He/Him', 'Pronouns should come from Melee');
});

test('PlayerInfoManager: social links (facebook, twitch, youtube) come from Melee', async () => {
  const manager = createMockedManager();

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  });

  assert.equal(result.general.facebook, 'bjoern.kimminich', 'Facebook should come from Melee');
  assert.equal(result.general.twitch, 'koshiii', 'Twitch should come from Melee');
  assert.equal(result.general.youtube, '@BjörnKimminich', 'YouTube should come from Melee');
});

test('PlayerInfoManager: win rate is averaged across all sources', async () => {
  const manager = createMockedManager();

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  });

  assert.ok(result.general['win rate'], 'Win rate should be present');
  assert.match(result.general['win rate'], /^\d+(\.\d+)?%$/, 'Win rate should be a percentage');
  // TODO Calculate that the win rate is actually the average of all available source win rates
});

test('PlayerInfoManager: team property comes from Unity League', async () => {
  const manager = createMockedManager();

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  });

  assert.equal(result.general.team, 'Mull to Five', 'Team should come from Unity League');
});

test('PlayerInfoManager: hometown property comes from Unity League', async () => {
  const manager = createMockedManager();

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  });

  assert.equal(result.general.hometown, 'Hamburg', 'Hometown should come from Unity League');
});

test('PlayerInfoManager: age property comes from Unity League', async () => {
  const manager = createMockedManager();

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  });

  assert.equal(result.general.age, '45', 'Age should come from Unity League');
});

test('PlayerInfoManager: each source contains its own player profile URL', async () => {
  const manager = createMockedManager();

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  });

  assert.equal(result.sources['Unity League'].url, 'https://unityleague.gg/player/16215/',
    'Unity League URL should be correct');
  assert.equal(result.sources['MTG Elo Project'].url, 'https://mtgeloproject.net/profile/3irvwtmk',
    'MTG Elo Project URL should be correct');
  assert.equal(result.sources['Melee'].url, 'https://melee.gg/Profile/Index/k0shiii',
    'Melee URL should be correct');
  assert.equal(result.sources['Topdeck'].url, 'https://topdeck.gg/profile/@k0shiii',
    'Topdeck URL should be correct');
});

test('PlayerInfoManager: each source contains its specific data in the sources object', async () => {
  const manager = createMockedManager();

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  });

  assert.equal(result.sources['Unity League'].data['rank germany'], '64',
    'Unity League should have rank germany');
  assert.equal(result.sources['Unity League'].data['rank europe'], '563',
    'Unity League should have rank europe');
  assert.equal(result.sources['Unity League'].data['rank points'], '292',
    'Unity League should have rank points');

  assert.ok(result.sources['MTG Elo Project'].data.player_id,
    'MTG Elo should have player_id');
  assert.ok(result.sources['MTG Elo Project'].data.current_rating,
    'MTG Elo should have current_rating');

  assert.equal(result.sources['Melee'].data.name, 'Björn Kimminich',
    'Melee should have name');

  assert.equal(result.sources['Topdeck'].data.name, 'Björn Kimminich',
    'Topdeck should have name');
});

test('PlayerInfoManager: priority order verification - Unity League > MTG Elo > Melee > Topdeck', async () => {
  const manager = createMockedManager();

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    mtgeloId: '3irvwtmk',
    meleeUser: 'k0shiii',
    topdeckHandle: 'k0shiii'
  });

  assert.equal(result.general.name, 'Björn Kimminich',
    'Name should use Unity League version (priority 1), not MTG Elo version "Bjoern Kimminich"');

  assert.ok(result.general.photo.includes('unityleague.gg'),
    'Photo should come from Unity League, not Topdeck');
});

test('PlayerInfoManager: with subset of sources - only Unity and Melee', async () => {
  const manager = createMockedManager();

  const result = await manager.getPlayerInfo({
    unityId: '16215',
    meleeUser: 'k0shiii'
  });

  assert.equal(Object.keys(result.sources).length, 2, 'Should have exactly 2 sources');
  assert.ok(result.sources['Unity League'], 'Should have Unity League');
  assert.ok(result.sources['Melee'], 'Should have Melee');
  assert.ok(!result.sources['MTG Elo Project'], 'Should not have MTG Elo Project');
  assert.ok(!result.sources['Topdeck'], 'Should not have Topdeck');
});

test('PlayerInfoManager: with only Topdeck source', async () => {
  const manager = createMockedManager();

  const result = await manager.getPlayerInfo({
    topdeckHandle: 'k0shiii'
  });

  assert.equal(Object.keys(result.sources).length, 1, 'Should have exactly 1 source');
  assert.ok(result.sources['Topdeck'], 'Should have Topdeck');

  assert.equal(result.general.name, 'Björn Kimminich', 'Name should come from Topdeck');
  assert.ok(result.general.photo, 'Photo should be present from Topdeck');
});

test('PlayerInfoManager: with sources in different order (Melee first, then Unity)', async () => {
  const manager = createMockedManager();

  const result = await manager.getPlayerInfo({
    meleeUser: 'k0shiii',
    unityId: '16215'
  });

  assert.equal(result.general.name, 'Björn Kimminich', 'Name should use Melee version');
  assert.ok(result.general.photo.includes('unityleague.gg'),
    'Photo should come from Unity League as Melee does not return one');
  assert.ok(result.general.bio.includes('Untimely Malfunction'), 'Bio should contain text from Unity League and Melee profile');
  assert.ok(!result.general.bio.includes('Change the target of target spell or ability with a single target'),
      'Bio should not contain text from only Unity League profile');

});



















