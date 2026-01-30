# MTG Player Info Puller

A simple NPM module and CLI tool to pull Magic: The Gathering player data from various sources (Unity League, MTG Elo Project, Melee, and Topdeck).

## Installation

```bash
npm install
```

## CLI Usage

You can call the tool via `node cli.js` or after linking it with `npm link`.

### Exact identity
```bash
node cli.js --unity-id 16215 --mtgelo-id 3irvwtmk --melee-user k0shiii --topdeck-handle @k0shiii
```

## Output Format

The tool returns a JSON object representing the player and their combined metadata. Redundant information like Name, Photo, Country, Age, and Hometown is merged into a `general` section, while source-specific data is kept in the `sources` section.

### Deduplication and Merging Logic
- **Priority**: Merging follows a "first-come, first-served" approach based on the order of sources provided in the command line or processed by the manager. For instance, the first valid `photo` URL found will be used as the primary photo for the player profile.
- **Deduplication**: If multiple IDs point to the exact same profile URL, the profile is only processed once to avoid redundant data in the `sources` section.
- **General Metadata**: Fields like `Age`, `Country`, and `Hometown` are extracted from the first source that provides them and placed in the `general` section.

Example output:
```json
{
  "name": "Björn Kimminich",
  "photo": "https://unityleague.gg/media/player_profile/1000023225.jpg",
  "general": {
    "Age": "45",
    "Country": "de",
    "Hometown": "Hamburg"
  },
  "sources": {
    "Unity League": {
      "url": "https://unityleague.gg/player/16215/",
      "data": {
        "Local organizer": "Mulligan TCG Shop",
        "Rank Germany": "57",
        "Rank Europe": "567",
        "Rank Points": "274"
      }
    },
    "MTG Elo Project": {
      "url": "https://mtgeloproject.net/profile/3irvwtmk",
      "data": {
        "player_id": "3irvwtmk",
        "current_rating": "1466",
        "record": "9-12-1"
      }
    },
    "Melee": {
      "url": "https://melee.gg/Profile/Index/k0shiii",
      "data": {
        "username": "k0shiii"
      }
    },
    "Topdeck": {
      "url": "https://topdeck.gg/profile/@k0shiii",
      "data": {
        "handle": "@k0shiii"
      }
    }
  }
}
```

## Supported Sources

| Site            | Method   |
|-----------------|----------|
| Unity League    | Scraping |
| MTG Elo Project | Scraping |
| Melee           | Scraping |
| Topdeck         | Scraping |

Note: Some sites may have anti-bot protections that can lead to "Maximum number of redirects exceeded" or "403 Forbidden" errors depending on the execution environment.
