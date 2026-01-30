# MTG Player Info Puller

A simple NPM module and CLI tool to pull Magic: The Gathering player data from various sources (Unity League, MTG Elo Project, Melee, and Topdeck).

## Installation

```bash
npm install
```

## CLI Usage

You can call the tool via `node cli.js` or after linking it with `npm link`.

### Fuzzy search by name(s) and aliases
```bash
node cli.js --name "Bjoern Kimminich" "Björn Kimminich"
```

### Exact identity
```bash
node cli.js --unity-id 16215 --mtgelo-id 3irvwtmk --melee-user k0shiii --topdeck-handle @k0shiii
```

### Combined
```bash
node cli.js --name "Bjoern Kimminich" --unity-id 16215
```

## Output Format

The tool returns a JSON object representing the player and their combined metadata. Redundant information like Name, Photo, Country, Age, and Hometown is merged into a `general` section, while source-specific data is kept in the `sources` section.

Example output:
```json
{
  "name": "Bjoern Kimminich",
  "photo": "https://unityleague.gg/media/player_profile/1000023225.jpg",
  "general": {
    "Age": "45",
    "Country": "Germany",
    "Hometown": "Hamburg"
  },
  "sources": {
    "Unity League": {
      "url": "https://unityleague.gg/player/16215/",
      "data": {
        "Rank Germany": "57",
        "Rank Europe": "567",
        "Points": "274"
      }
    },
    "MTG Elo Project": {
      "url": "https://mtgeloproject.net/profile/3irvwtmk",
      "data": {
        "current_elo": "1466"
      }
    }
  }
}
```

## Supported Sources

| Site            | Method   |
|-----------------|----------|
| Unity League    | Scraping |
| MTG Elo Project | API      |
| Melee           | Scraping |
| Topdeck         | Scraping |

Note: Some sites may have anti-bot protections that can lead to "Maximum number of redirects exceeded" or "403 Forbidden" errors depending on the execution environment.
