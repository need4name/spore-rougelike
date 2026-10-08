# Primordia

*(working title)*

An evolution roguelike for phone, tablet and computer, played in the browser. Guide one lineage from a single cell to the dawn of a thinking people, on land or in the sea, through event cards (in the style of Crusader Kings 3), mutation drafts, merged body parts and a Mind tree. Every run earns Genetic Memory that unlocks new archetypes, home worlds, part packs and permanent boosts.

**Prototype scope:** the Cell and Creature stages. Tribe, Civilization and Space are planned as themed updates (see [docs/ROADMAP.md](docs/ROADMAP.md)).

## Playing it

- **On this computer:** double-click `index.html`. It opens in your browser and needs no installs.
- **On iPhone/iPad:** host it (below), open the link in Safari, then tap Share and **Add to Home Screen**. It then opens full-screen like an app.
- Progress saves automatically in the browser you play in.

## Hosting it for free (GitHub Pages)

1. On GitHub, open this repository, then **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, pick `main` and `/ (root)`, then **Save**.
3. After a minute the game is live at `https://<your-username>.github.io/spore-rougelike/`.

Every change merged into `main` updates the live game automatically.

## How the code is organized

There is no build step. Every file is plain HTML, CSS or JavaScript.

| File | What's in it |
|---|---|
| `js/data/events.js` | Every event card and its choices. **Most new content goes here.** |
| `js/data/parts.js` | Body parts offered in mutation drafts. |
| `js/data/world.js` | Stats, synergy keywords, traits, archetypes, home worlds, unlocks, stage pacing. |
| `js/game.js` | The rules: turns, dice checks, drafts, evolution, saving. |
| `js/render.js` | Draws your creature from its parts. |
| `js/ui.js` | The screens and buttons. |
| `css/style.css` | The look. |
| `tools/audit.js` | Counts land vs sea content so gaps stay visible (`node tools/audit.js`). |

### Modifier keys (used by parts, traits, synergies, innovations, archetypes and worlds)

`str` `tou` `spd` `cun` `cha` (the five stats), `maxPop`, `foodPerTurn`, `popPerTurn`, `dnaPerTurn`, `insightPerTurn`, `forageBonus`, `huntBonus`, `exploreBonus`, `upkeep` (extra Food eaten per turn), `damageReduce`, `foodCap`, `growthCost`.

### Balance knobs

- Check odds: `G.chance` in `js/game.js`, which is 50% + 12% for each point your stat is above the difficulty, between 5% and 95%.
- Difficulty: `G.difficulty`, which adds +1 per era, +1 for every 6 turns spent in an era (up to +2), and the Hostility level.
- Food: `G.income`, `G.upkeep` (half your Population, rounded up), `G.GROWTH_COST` and `G.FOOD_CAP` in `js/data/world.js`.
- Stage length, draft points and milestones: `G.STAGES` in `js/data/world.js`.

In a simulation of 150 runs by a careful bot, a run lasted about 50 turns (about 15 in the Cell stage). With starting unlocks the bot won about 90% of runs, and about 60% at Hostility 2. Players who take risks will lose more often.
