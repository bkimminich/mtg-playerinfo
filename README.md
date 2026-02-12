# MTG Player Info

![GitHub stars](https://img.shields.io/github/stars/bkimminich/mtg-playerinfo.svg?label=GitHub%20%E2%98%85&style=flat)
![node](https://img.shields.io/node/v/mtg-playerinfo.svg)
[![npm](https://img.shields.io/npm/dm/mtg-playerinfo.svg)](https://www.npmjs.com/package/mtg-playerinfo)
[![npm](https://img.shields.io/npm/dt/mtg-playerinfo.svg)](https://www.npmjs.com/package/mtg-playerinfo)
[![Coverage Status](https://coveralls.io/repos/github/bkimminich/mtg-playerinfo/badge.svg?branch=main)](https://coveralls.io/github/bkimminich/mtg-playerinfo?branch=main)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

A simple NPM module and CLI tool to pull Magic: The Gathering player data from various sources (Unity League, MTG Elo Project, Melee, and Topdeck).

## Installation

```bash
npm i -g mtg-playerinfo
```

## CLI Usage

```bash
mtg-playerinfo --unity-id 16215 --mtgelo-id 3irvwtmk --melee-user k0shiii --topdeck-handle k0shiii
```

or without previous installation

```bash
npx mtg-playerinfo --unity-id 16215 --mtgelo-id 3irvwtmk --melee-user k0shiii --topdeck-handle k0shiii
```

## Output Format

The tool returns a JSON object representing the player and their combined metadata. Redundant information like name, photo, country, age, and hometown is merged into a `general` section, while source-specific data is kept in the `sources` section.

### General meta-data and merging priority

General meta-data fields like `name`, `photo`, `age`, `country`, and `hometown` are extracted from the first source that provides them and placed in the `general` section. Merging follows a "first-come, first-served" approach based on the order of sources provided in the command line or processed by the manager. In the [CLI usage example](#cli-usage) above, the source priority is `Unity League` > `MTG Elo Project` > `Melee` > `Topdeck`.

> If you notice any inconsistencies or unexpected fields values, you can run the tool with the `-v` or `--verbose` flag to see the full list of extracted fields and if they were promoted to the `general` section or deviated from a previous source.

### Example output

```json
{
  "general": {
    "name": "Björn Kimminich",
    "photo": "https://unityleague.gg/media/player_profile/1000023225.jpg",
    "age": "45",
    "bio": "Smugly held back on an Untimely Malfunction against a Storm player going off, being totally sure that you can redirect the summed-up damage of their Grapeshots back to their face with its \"Change the target of target spell or ability with a single target\" mode.",
    "team": "Mull to Five",
    "country": "de",
    "hometown": "Hamburg",
    "pronouns": "He/Him",
    "facebook": "bjoern.kimminich",
    "twitch": "koshiii",
    "youtube": "@BjörnKimminich",
    "win rate": "42.49%"
  },
  "sources": {
    "Unity League": {
      "url": "https://unityleague.gg/player/16215/",
      "data": {
        "name": "Björn Kimminich",
        "photo": "https://unityleague.gg/media/player_profile/1000023225.jpg",
        "country": "de",
        "age": "45",
        "hometown": "Hamburg",
        "local organizer": "Mulligan TCG Shop",
        "team": "Mull to Five",
        "bio": "Smugly held back on an Untimely Malfunction against a Storm player going off, being totally sure that you can redirect the summed-up damage of their Grapeshots back to their face with its \"Change the target of target spell or ability with a single target\" mode.",
        "rank germany": "63",
        "rank europe": "547",
        "rank points": "304",
        "record": "45-43-5",
        "win rate": "50.2%"
      }
    },
    "MTG Elo Project": {
      "url": "https://mtgeloproject.net/profile/3irvwtmk",
      "data": {
        "name": "Bjoern Kimminich",
        "player_id": "3irvwtmk",
        "current_rating": "1466",
        "record": "9-12-1",
        "win rate": "40.91%"
      }
    },
    "Melee": {
      "url": "https://melee.gg/Profile/Index/k0shiii",
      "data": {
        "name": "Björn Kimminich",
        "pronouns": "He/Him",
        "bio": "Smugly held back on an Untimely Malfunction against a Storm player going off, being totally sure that you can redirect the summed-up damage of their Grapeshots back to their face.",
        "facebook": "bjoern.kimminich",
        "twitch": "koshiii",
        "youtube": "@BjörnKimminich"
      }
    },
    "Topdeck": {
      "url": "https://topdeck.gg/profile/@k0shiii",
      "data": {
        "name": "Björn Kimminich",
        "photo": "https://imagedelivery.net/kN_u_RUfFF6xsGMKYWhO1g/2a7b8d12-5924-4a58-5f9c-c0bf55766800/square",
        "tournaments": "2",
        "record": "4-6-1",
        "win rate": "36.36%",
        "conversion": "0%"
      }
    }
  }
}
```

## Supported Sources

The following sites are currently supported based on HTML scraping and/or API calls. In general, API calls are preferred over scraping due to their higher reliability and independence from site structure changes.

| Site            | Method                                                                          |
|-----------------|---------------------------------------------------------------------------------|
| Unity League    | ✅Scraping                                                                       |
| MTG Elo Project | ✅Scraping                                                                       |
| Topdeck         | ✅Scraping / ✅API                                                                |
| Melee           | ✅Scraping / 🚧API ([#1](https://github.com/bkimminich/mtg-playerinfo/issues/1)) |
| Untapped        | 🚧API                                                                           |

_Note: Some sites may have anti-bot protections that can lead to "Maximum number of redirects exceeded" or "403 Forbidden" errors depending on the execution environment._

## Contribution Guidelines

1. All PRs _should_ have a dedicated scope (e.g. not mixing code refactorings with delivering a new feature) and reasonable size.
2. Noise (e.g. unnecessary comments) generated by AI tools _must_ be removed before opening a PR.
3. All Git commits within a PR _must_ be [signed off](https://git-scm.com/docs/git-commit#Documentation/git-commit.txt--s) to indicate the contributor's agreement with the [Developer Certificate of Origin](https://developercertificate.org/).
4. Particularly low-effort contributions (e.g. incomplete typo fixes in a single file, trivial text changes, code formatting) or any forms of potential "contribution farming" _must not_ be submitted as PRs.

## Licensing

[![license](https://img.shields.io/github/license/juice-shop/juice-shop.svg)](LICENSE)

This program is free software: you can redistribute it and/or modify it under the terms of the [MIT license](LICENSE). MTG Player Info and any contributions are Copyright © by Bjoern Kimminich 2026.
