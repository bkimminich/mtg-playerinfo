const fs = require('fs')
const path = require('path')
const { request } = require('../src/utils/httpClient')

const targets = [
  { id: '16215', url: 'https://unityleague.gg/player/16215/', file: 'unityLeague.html' },
  { id: '3irvwtmk', url: 'https://mtgeloproject.net/profile/3irvwtmk', file: 'mtgElo.html' },
  { id: 'k0shiii', url: 'https://melee.gg/Profile/Index/k0shiii', file: 'melee.html' },
  { id: 'k0shiii', url: 'https://topdeck.gg/profile/@k0shiii', file: 'topdeck.html' },
  { id: 'm4VSTJShiXR1PCSCWaM9TBY0rcg1', url: 'https://topdeck.gg/profile/m4VSTJShiXR1PCSCWaM9TBY0rcg1/stats', file: 'topdeck.json' },
  { id: '7de50700-c3f6-48e4-a38d-2add5b0d9b71/76DCDWCZS5FX5PIEEMUVY6GV74', url: 'https://mtga.untapped.gg/profile/7de50700-c3f6-48e4-a38d-2add5b0d9b71/76DCDWCZS5FX5PIEEMUVY6GV74', file: 'untapped.html' }
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
