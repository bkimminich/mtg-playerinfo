const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const PlayerInfoManager = require('../src/index');

function readFixture(name) {
  return fs.readFileSync(path.join(__dirname, 'data', name), 'utf8');
}

test('PlayerInfoManager.mergeData combines information from multiple fetchers', () => {
  const manager = new PlayerInfoManager();

  const meleeHtml = readFixture('melee.html');
  const unityHtml = readFixture('unityLeague.html');

  const meleeResult = manager.fetchers.melee.parseHtml(meleeHtml, 'https://melee.gg/Profile/Index/k0shiii', 'k0shiii');
  const unityResult = manager.fetchers.unity.parseHtml(unityHtml, 'https://unityleague.gg/player/16215/');

  const merged = manager.mergeData([unityResult, meleeResult]);
  assert.equal(merged.general.name, 'Björn Kimminich'); // from Unity
  assert.equal(merged.general.photo, 'https://unityleague.gg/media/player_profile/1000023225.jpg'); // from Unity
  assert.equal(merged.general.age, '45'); // from Unity
  assert.equal(merged.general.bio, 'Smugly held back on an Untimely Malfunction against a Storm player going off, being totally sure that you can redirect the summed-up damage of their Grapeshots back to their face with its "Change the target of target spell or ability with a single target" mode.'); // from Unity
  assert.equal(merged.general.hometown, 'Hamburg'); // from Unity
  assert.equal(merged.general.country, 'de'); // from Unity
  assert.equal(merged.general.team, 'Mull to Five'); // from Unity
  assert.equal(merged.general.pronouns, 'He/Him'); // from Melee
  assert.equal(merged.general.facebook, 'bjoern.kimminich'); // from Melee
  assert.equal(merged.general.twitch, 'koshiii'); // from Melee
  assert.equal(merged.general.youtube, '@BjörnKimminich'); // from Melee
  assert.equal(merged.general['win rate'], '49.60%'); // Combined/Calculated

  assert.ok(merged.sources['Unity League']);
  assert.ok(merged.sources['Melee']);
  assert.strictEqual(merged.sources['Unity League'].data.name, undefined);
  assert.strictEqual(merged.sources['Unity League'].data.photo, undefined);
  assert.strictEqual(merged.sources['Unity League'].data.age, undefined);
  assert.strictEqual(merged.sources['Unity League'].data.bio, undefined);
  assert.strictEqual(merged.sources['Unity League'].data.hometown, undefined);
  assert.strictEqual(merged.sources['Unity League'].data.country, undefined);
  assert.strictEqual(merged.sources['Unity League'].data.team, undefined);
  assert.strictEqual(merged.sources['Melee'].data.name, undefined);
  assert.equal(merged.sources['Melee'].data.bio, meleeResult.bio); // different from Unity which was seen first
  assert.strictEqual(merged.sources['Melee'].data.pronouns, undefined);
  assert.strictEqual(merged.sources['Melee'].data.facebook, undefined);
  assert.strictEqual(merged.sources['Melee'].data.twitch, undefined);
  assert.strictEqual(merged.sources['Melee'].data.youtube, undefined);
});
