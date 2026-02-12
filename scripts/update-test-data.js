const fs = require('fs')
const path = require('path')
const { request } = require('../src/utils/httpClient')

const targets = [
  { id: '16215', url: 'https://unityleague.gg/player/16215/', file: 'unityLeague.html' },
  { id: '3irvwtmk', url: 'https://mtgeloproject.net/profile/3irvwtmk', file: 'mtgElo.html' },
  { id: 'k0shiii', url: 'https://melee.gg/Profile/Index/k0shiii', file: 'melee.html' },
  { id: 'k0shiii', url: 'https://topdeck.gg/profile/@k0shiii', file: 'topdeck.html' },
  { id: 'm4VSTJShiXR1PCSCWaM9TBY0rcg1', url: 'https://topdeck.gg/profile/m4VSTJShiXR1PCSCWaM9TBY0rcg1/stats', file: 'topdeck.json' },
  { id: 'e9d6fb9b-1f91-4063-8b28-0d46458d01a9/ZTATRXEQEJHUDOO52NWQCJGMQY', url: 'https://api.mtga.untapped.gg/api/v1/games/users/e9d6fb9b-1f91-4063-8b28-0d46458d01a9/players/ZTATRXEQEJHUDOO52NWQCJGMQY/?card_set=ECL', file: 'untapped.json' }
]

async function updateTestData () {
  for (const target of targets) {
    console.log(`Fetching ${target.url}...`)
    try {
      const { data } = await request(target.url, { maxRedirects: 10 })
      const filePath = path.join(__dirname, '..', 'test', 'data', target.file)
      fs.writeFileSync(filePath, data)
      console.log(`Updated ${filePath}`)
    } catch (error) {
      console.error(`Error updating ${target.file}:`, error.message)
      process.exit(1)
    }
  }
}

updateTestData()
