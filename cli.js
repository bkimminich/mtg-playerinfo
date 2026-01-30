#!/usr/bin/env node
const { program } = require('commander');
const PlayerInfoManager = require('./src/index');

program
  .name('mtg-playerinfo')
  .description('CLI to pull MTG player data from various sources')
  .version('1.0.0');

program
  .option('--unity-id <id>', 'Unity League Player ID')
  .option('--mtgelo-id <id>', 'MTG Elo Project Player ID')
  .option('--melee-user <username>', 'Melee Username')
  .option('--topdeck-handle <handle>', 'Topdeck Handle')
  .action(async (options) => {
    if (!options.unityId && !options.mtgeloId && !options.meleeUser && !options.topdeckHandle) {
      console.error('Error: Please provide at least one search option (unity-id, mtgelo-id, melee-user, or topdeck-handle).');
      process.exit(1);
    }

    const manager = new PlayerInfoManager();
    try {
      const playerInfo = await manager.getPlayerInfo(options);
      console.log(JSON.stringify(playerInfo, null, 2));
    } catch (error) {
      console.error('An error occurred:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
