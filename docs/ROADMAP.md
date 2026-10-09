# Primordia: roadmap

The game grows in **themed updates**, like Minecraft's. Each update has one theme, a short list of what's in it, and a test checklist. After each one you play it, send feedback, and any fixes go into a small patch (6.1, 6.2…) before the next update starts.

**Done so far:** Updates 1–5 built the Cell and Creature stages: event cards, real-time map, drafts, merging, evolutions, Mind tree, flight, symmetry and body plans. **Update 6 (The Deep) is out.** The sea now has more parts, evolutions and events than land; Update 7 brings land back level.

---

## The big problem: everything turns into a mammal

Playtesting showed that every run drifts towards a furry, four-legged, hand-using land mammal. Sea life has less depth and no real road to intelligence. The content backs this up (`node tools/audit.js` prints these numbers):

| | Land | Sea |
|---|---|---|
| Body slots | 9 | 7 |
| Parts only for this habitat | 64 | 29 (11 of them are basic fin pieces) |
| Grasping parts (needed for tools) | 12 | 3 |
| Evolutions only for this habitat | 31 | 13 |
| Events only for this habitat | 13 | 10 |
| Endings | 4 | 3 |

The causes go deeper than the numbers:

1. **The sea has no hands.** Land creatures have a Hands slot and Feet slot; sea creatures don't. Tools need a grasping part, so the sea is nearly locked out of the tool path.
2. **There is only one kind of mind, and it's a primate's.** The Mind tree is grooming, food caching, shelters, stone tools and fire. Every route to a "thinking" ending runs through hands.
3. **The default body is a mammal.** Everyone has an inside skeleton, gives birth to live young, is warm-blooded and lives in a herd. Neck and posture looks exist only on land.
4. **The shared events are written for land.** 17 of the 37 events that both habitats can get talk about the ground, nests, trees or running.
5. **The later stages would make it worse.** As first planned, Tribe meant huts and fire, Civilization meant kings and castles, and Space meant rockets. None of that works for whales, octopuses or ant colonies.

## The fix: four design rules

1. **There are many kinds of mind.** Intelligence isn't one thing. The game will have five **Paths of Mind** (below), and every kind of body, on land or in the sea, has at least two it can take.
2. **No stage ships land-only.** Every new stage arrives with a land and a sea version, built to the same depth, in the same update.
3. **The body decides, not the habitat.** Skeleton, young and blood become real choices, so a lineage can be insect-like, reptile-like, bird-like or octopus-like as easily as mammal-like.
4. **Fairness is measured.** Before an update ships, `tools/audit.js` must show the sea at no less than 80% of land on every count, and the test bots must win at similar rates on every path.

## The five Paths of Mind

At the Spark of Mind milestone you choose how your kind thinks, much like choosing symmetry when you became multicellular. Which paths are open depends on your body. Each path has its own Mind tree, its own events and endings, and its own version of every later stage.

| Path | Inspired by | On land | In the sea | Needs | Strengths | Becomes |
|---|---|---|---|---|---|---|
| **Toolmakers** | Apes, crows, sea otters | Ape-like, crow-like | Otters, crabs with shells | A grasping part (hands, trunk, beak, pincers, tentacles) | Tools, then fire on land or vent-forging under water | Tribe → Kingdoms |
| **Singers** | Whales, dolphins, songbirds, wolves | Songbirds, howlers | Whales, dolphins | A voice, echolocation or display parts | Memory carried in songs, huge range, friendship and diplomacy | Pod or Choir → Song-nations |
| **Many Minds** | Octopuses, cuttlefish | Soft climbers | Octopuses, cuttlefish | A soft or radial body, color-changing skin | A brain in every arm, camouflage, speaking in color, fast learning | Den network → Shifting cities |
| **The Swarm** | Ants, bees, termites, coral | Ant- and termite-like | Coral, siphonophores | No symmetry, small size or a strongly social lineage | Huge numbers that share one mind, giant buildings | Hive → Hive empire |
| **Gardeners** | Leafcutter ants, farming fish, fungi | Fungus farmers | Kelp and algae farmers | Symbiont parts or a plant diet | Farming other species, living technology | Grove or Garden → Living empire |

**What replaces fire under water?** Sea paths get their own breakthroughs instead: heat from deep-sea vents, electricity (like electric eels), living light, chemistry and venom, and shaping coral as it grows. Sea civilizations get a different technology tree, not a land tree with the words changed.

**Keeping the size under control.** Five paths across three later stages is a lot of content. To stay manageable:

- The paths share one game engine, and only about a third of each path is unique: its Mind tree, its endings and a handful of signature events.
- Shared events adapt their words to your body ("your herd / pod / swarm", "you run / swim / ooze").
- Each later stage ships with two paths first (one land, one sea), and the other paths follow in that stage's second update.

---

## Overview

| # | Update | Theme | Size |
|---|---|---|---|
| 6 | **The Deep** | The sea catches up with land | Medium |
| 7 | **Shells, Scales and Soft Bodies** | Not every creature is a mammal | Medium |
| 8 | **Other Minds** | The five Paths of Mind in the Creature stage | Large |
| 9 | The Living World | Rival species that remember you, event chains, seasons | Medium |
| 10 | Wild Places | Biomes, and crawling between sea and land | Medium |
| 11 | Bloodlines | Roguelike depth: challenges, achievements, past lineages | Medium |
| 12 | First Gatherings | **Society stage**, part 1: Tribe (land) and Pod (sea) | Large |
| 13 | Neighbours | Society stage, part 2: Hive, Den and Grove, plus rival societies | Large |
| 14 | Crowns | **Civilization stage**, part 1: land and sea nations | Large |
| 15 | Empires | Civilization stage, part 2: the other paths, wars, faiths, wonders | Large |
| 16 | Lift-off | **Space stage**, part 1: leaving home, in very different ships | Large |
| 17 | The Galaxy | Space stage, part 2: aliens from your past runs, the true ending | Medium |
| 18 | The Final Polish | Balance, art, sound, tutorial, offline app | Large |

Updates 6–8 are new. They come first because everything later is built on them: the Society stage can't offer an octopus society until the Creature stage can make an octopus that thinks. This adds three updates before the Tribe stage, but it fixes the problem at the root instead of patching it in every later stage.

## Ground rules

- **One theme per update.** Ideas that don't fit go on the "waiting" list at the bottom.
- **Each update is playable on its own.** Nothing is left half-built between updates.
- **Polish comes last.** Balance tweaks, art and sound get a full pass in Update 18. Between updates we only fix what blocks testing or is clearly broken.
- **Saves.** Unlocks and the Codex always carry over. A run in progress may restart when a new stage arrives; the game will say so.
- **What's new.** From Update 6 on, the title screen shows a short "What's new" note.
- **Every update is tested on land and in the sea**, and with at least one creature that isn't bilateral.

---

## Update 6: The Deep ✅

*The sea catches up with land.*

- **Two new sea slots:**
  - **Arms**, the sea's hands: tentacles, pincers and feeding arms.
  - **Underside**: suckers, walking legs like a lobster's, and belly lights.

  The sea then has 9 slots, the same as land.
- **About 30 new sea parts and 15 new sea evolutions:** ink sacs, electric organs, jet siphons, gills, spiral shells, crab claws, beaks, lures, color-changing skin, pressure skin and more.
- **A sea map with depth:** sunlit shallows, the reef, open water, the twilight zone and the abyss with its vents. Each herd has a home depth, with its own scenery, light and props.
- **About 20 new sea events,** plus scenes and props for them.
- **The 17 land-worded shared events rewritten** so they read naturally in the sea, and group words that change with your body (herd, pod, school, swarm).
- **Sea looks:** body shapes (torpedo, flat like a ray, round like a puffer, long like an eel) and fin styles.
- **What's new** screen on the title page.

**You'll test:** play three sea runs in a row. Does the sea feel as deep as land now?

## Update 7: Shells, Scales and Soft Bodies

*Not every creature is a mammal.*

New body choices, each with real trade-offs:

- **Skeleton:**
  - **Inside bones:** the current default. Can grow giant.
  - **Outside shell:** insects and crabs. Armored, and many legs come cheap. Must molt, which is risky, and can't grow giant on land.
  - **No skeleton:** octopuses and worms. Squeezes through gaps, camouflages and regrows lost parts, but is fragile.
- **Young:**
  - **Live young:** few babies, but they're safe.
  - **Eggs:** big clutches mean booms and busts, and eggs can be stolen.
  - **Budding:** colonies and radial bodies split into new ones.
- **Blood:**
  - **Warm:** active all year, but eats more.
  - **Cold:** eats less, but is sluggish in the cold. This ties in with seasons in Update 9.

Alongside the choices:

- **New part families:** compound eyes, beaks, feathers, shells, segment plates, suckers and egg sacs.
- **Matching looks:** shells, segmented bodies, compound eyes, beaks, crests and frills.
- **Events** for molting, egg-laying, nests and clutches, basking and hibernating.
- **Rival species** use the new bodies too, so the map fills with insects, reptiles, birds and octopuses, not just mammals.

**You'll test:** whether you can build something that is clearly an insect, a reptile, a bird or an octopus, and whether each feels different to play.

## Update 8: Other Minds

*Intelligence comes in many shapes.*

- **The Spark of Mind becomes a choice** of the five Paths of Mind. Paths your body can't support are shown locked, with what you'd need.
- **A Mind tree for each path.** The current tree becomes the Toolmakers' tree.
- **Signature events for each path:**
  - Singers: song-duels, long migrations.
  - Many Minds: color-talk, escaping through a crack.
  - Swarm: the colony splits, building a mound.
  - Gardeners: a blight hits your crop.
- **Creature-stage endings for every path,** on land and in the sea (about 12 in total, up from 7).
- **Radial and colonial bodies get a real road to intelligence** through Many Minds and the Swarm.
- **Test bots** check that every path wins about as often as the others.

**You'll test:** one run on each path. Does each feel like a different kind of mind, not the same tree in a new color?

## Update 9: The Living World

*The world remembers you.*

- **Event chains:** stories that unfold over several events. For example, a wounded predator returns stronger, or a friendly species asks for help and repays it later.
- **Nemesis and ally species:** a species you've hurt or helped gets a name and keeps showing up in events about you.
- **Species that evolve:** other species gain parts, change size and move territory during the run.
- **Seasons and weather:**
  - On land: winters, droughts and floods.
  - In the sea: plankton blooms, cold currents and storms.

  Each comes with matching events. Cold-blooded creatures feel them most.
- **Migrations:** herds and schools cross the map, and some events only happen while they're passing.

**You'll test:** whether stories feel connected rather than random, and whether the map feels alive on land and in the sea.

## Update 10: Wild Places

*Different worlds play differently.*

- **Biomes:** land regions (tundra, desert, swamp, jungle) and sea regions (reef, kelp forest, ice shelf, the vents), each with its own scenery, food, events and parts.
- **Moving regions:** migrate partway through a run, with risks along the way.
- **Between sea and land:** sea creatures can crawl onto land, and land creatures can return to the water, as whales did. It costs you something, and it opens up new parts.
- **New home worlds** to unlock, built around the biomes.

**You'll test:** whether different regions make you build different creatures.

## Update 11: Bloodlines

*Every run leaves a mark.*

- **Challenge runs:** modifiers you can turn on for a bigger reward. For example: no carnivores, sea only, no hands, or permanent winter.
- **Achievements**, each with an unlock. For example, "Reach the Spark of Mind on every path" unlocks a new archetype.
- **Fossil record:** a gallery of every lineage you've played, with its portrait, path, how it ended and what it unlocked.
- **Past lineages in the world:** creatures from your earlier runs sometimes appear as rival species.
- **Daily run:** the same world and seed for everyone each day.
- **More archetypes and boons,** including sea and non-mammal starts.

**You'll test:** whether you want to play "just one more run", and whether unlocks feel worth chasing.

## Update 12: First Gatherings (Society stage, part 1)

*Your creatures become a people.*

- **A new Society stage** follows the Creature stage. Your path and ending decide which kind of society you become. This update brings two:
  - **Tribe** (Toolmakers, land): a village of huts and fires. Your old Creature-stage species become animals you hunt, herd or befriend.
  - **Pod** (Singers, sea): a roaming pod with songkeepers, migration routes and whale-falls to feed on. Its memory is carried in songs instead of tools.
- **Resources:** Population, Food and DNA become Members, Food and **Ideas**.
- **Discoveries replace body-part drafts.** The Tribe gets spears, baskets and fire. The Pod gets song-maps, hunting spirals and shared memory. Some discoveries combine into better ones, as parts evolve.
- **A named leader** with traits: a chief for the Tribe, an elder singer for the Pod. When the leader dies, someone else takes over.
- **About 25 events for each society** and a finale for each.
- **Stage select:** once you've reached a stage, a new run can start there with a lineage you've already played.

**You'll test:** whether the Tribe and the Pod feel equally deep and clearly different, while still feeling like the same game.

## Update 13: Neighbours (Society stage, part 2)

*You are not the only people.*

- **Three more societies:**
  - **Hive** (Swarm): a queen, castes and a mound that keeps growing.
  - **Den** (Many Minds): clever loners linked by color-signals.
  - **Grove** (Gardeners): farms of fungi or kelp tended together.
- **Rival societies** on the map, each with its own leader and opinion of you, of any kind. A Tribe can meet a Hive.
- **Diplomacy:** trade, gifts, joining families, raids and alliances, with a flavor for each kind of society.
- **Culture trees** for every society. Choices exclude each other, for example warlike or peaceful.
- **Society endings** that lead into the Civilization stage.

**You'll test:** whether each society plays differently, and whether dealing with neighbours is the interesting part.

## Update 14: Crowns (Civilization stage, part 1)

*The most Crusader Kings 3 part of the game.*

- **A regional map** of settlements you found and grow:
  - On land: cities.
  - In the sea: reef-cities and vent-colonies.
- **A ruler and a dynasty:** your ruler has traits, a family, heirs and rivals, and succession can go wrong. For a Pod, the ruler is a line of songkeepers.
- **A council:** advisors who give advice, scheme and sometimes betray you.
- **Three ways to grow,** as in Spore: military, trade or faith.
- **Two technology trees:** fire and metal on land; vents, electricity, living light and coral-shaping in the sea.
- **About 30 events for each of land and sea,** many built around characters.

**You'll test:** whether your ruler feels like a person, and whether a sea civilization feels truly different from a land one.

## Update 15: Empires (Civilization stage, part 2)

*The whole world, one way or another.*

- **Civilizations for the other paths:**
  - **Hive empires:** the queen's lineage and huge buildings.
  - **Den networks:** cities that change shape.
  - **Living empires:** grown technology.
- **Rival nations** of any kind, plus wars, treaties and betrayals.
- **Faiths** that spread, split and clash.
- **Wonders and disasters:** plague, famine, rebellion and the sea turning to acid.
- **Civilization endings** that lead into the Space stage, plus a few "dead end" endings that still earn Genetic Memory.

**You'll test:** whether the late game stays tense, and whether every path's civilization holds up.

## Update 16: Lift-off (Space stage, part 1)

*Leave home, each in its own way.*

Each path leaves its world differently:

- **Toolmakers:** rockets.
- **Singers and sea civilizations:** ships filled with water, carrying a piece of their ocean.
- **Swarm:** seed-ships that grow a new hive wherever they land.
- **Gardeners:** grown, living ships.
- **Many Minds:** ships that change shape.

The stage itself:

- **A star map** with planets to scan, settle or reshape. Water worlds and ice moons matter as much as rocky planets.
- **Space events:** strange signals, derelict ships, living planets.

**You'll test:** whether space feels like a new frontier, and whether your path still shapes how you play.

## Update 17: The Galaxy (Space stage, part 2)

*Everyone you've ever been is out there.*

- **Aliens from your past runs:** lineages from your fossil record show up as alien empires, with the bodies and paths you gave them.
- **Galactic diplomacy:** alliances, wars and trade between empires.
- **The true ending:** reach the galactic core. Beating it unlocks **New Game+**, where a new world starts with echoes of your old ones.

**You'll test:** whether meeting your old creatures is a fun surprise, and whether the ending feels big enough.

## Update 18: The Final Polish

*Everything we've been saving for the end.*

- **Balance pass** across every stage and path, using the test bots and your notes.
- **Art pass:** better drawings, animations and scenes.
- **Sound and music:** ambient sounds for land, sea and each stage.
- **Tutorial:** a gentle first run that teaches the game as you play it.
- **Offline app:** installs to your home screen and works without internet.
- **Settings:** text size, reduced motion and color-blind palettes.
- **Performance** on older phones.

**You'll test:** the whole game, from start to finish, with fresh eyes.

---

## Ideas waiting for a home

- Sharing a creature as an image or a link.
- A creature-naming screen.
- Hybrid symmetry (for example, a radial creature with a bilateral head).
- Mixing two Paths of Mind late in a run.
