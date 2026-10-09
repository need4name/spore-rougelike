# Primordia: roadmap

The game grows in **themed updates**, like Minecraft's. Each update has one theme, a short list of what's in it, and a test checklist. After each one you play it, send feedback, and any fixes go into a small patch (6.1, 6.2…) before the next update starts.

**Done so far:** Updates 1–5 built the Cell and Creature stages: event cards, real-time map, drafts, merging, evolutions, Mind tree, flight, symmetry and body plans. **Update 6 (The Deep), Patch 6.1, Update 7 (Bloodlines) and Update 8 (Many Ways to Live) are out.** The sea now has more parts, evolutions and events than land; Update 12 brings land back level.

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
5. **The later stages would make it worse.** As first planned, Tribe meant huts and fire, and Civilization meant kings and castles. None of that works for whales, octopuses or ant colonies.

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
| 6 | **The Deep** ✅ | The sea catches up with land | Medium |
| 6.1 | Patch ✅ | Merging from the first cell draft, a shorter cell stage, a truer map | Small |
| 7 | **Bloodlines** ✅ | The roguelike core: harder first runs, an upgrade tree between runs (including second sockets), saved lineages | Large |
| 8 | **Many Ways to Live** ✅ | Every archetype gets a gimmick that changes how the whole run plays | Large |
| 9 | **The Creature Editor** | A full editor after the cell stage: limbs, heads, proportions, colors and patterns | Large |
| 10 | **The Living World** | A CK3-style Activities tab, a crowded world, extinctions and rising species | Large |
| 11 | **The World Map** | Biomes, and a world you see more of as your kind gets smarter | Large |
| 12 | Shells, Scales and Soft Bodies | Not every creature is a mammal | Medium |
| 13 | Other Minds | The five Paths of Mind in the Creature stage | Large |
| 14 | First Gatherings | **Society stage**, part 1: Tribe (land) and Pod (sea) | Large |
| 15 | Neighbours | Society stage, part 2: Hive, Den and Grove, plus rival societies | Large |
| 16 | Crowns | **Civilization stage**, part 1: land and sea nations | Large |
| 17 | Empires | Civilization stage, part 2: the other paths, wars, faiths, wonders | Large |
| 18 | The Final Polish | Balance, art, sound, tutorial, offline app, challenges and achievements | Large |

**Why this order.** The playtest after Update 6 showed that the foundations matter more than new content right now.

- **Bloodlines comes first.** It makes the game a real roguelike. Every later update is balanced around runs that get further as you upgrade, so the upgrade tree has to exist before them.
- **Many Ways to Live and the Creature Editor come next.** They make each run feel different, starting from the first minute.
- **The Living World and the World Map follow.** They make the world worth exploring.

The "not a mammal" and "Paths of Mind" updates now come after these, still before the Society stage.

## Where the latest playtest feedback went

| Feedback | Where |
|---|---|
| Archetypes all end up playing the same | Update 8 |
| The cell stage is too long with no merging | Patch 6.1 |
| Like Cyberpunk: one part per slot, but an upgrade lets a slot hold two | Update 7 (Twin sockets in the Evolution Tree) |
| A creature editor after the cell stage, with far more options | Update 9 |
| A CK3-style Activities tab: move, war, befriend, avoid | Update 10 |
| A more crowded world with more kinds of creature | Update 10 |
| Extinctions, with new species filling the gap | Update 10 |
| Size and population differences on the map | Patch 6.1 (bigger contrast), Update 10 (more) |
| A map that reflects the world: speed, friendships | Patch 6.1 (speed and closeness), Update 10 (between species) |
| Biomes, and seeing more of the world as you get smarter | Update 11 |
| Difficulty, and upgrades between runs | Update 7 |
| Saving a creature you're invested in | Update 7 (Fossil Record) |

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

## Patch 6.1 ✅

- Parts can merge from the very first cell draft.
- The cell stage is about 15% shorter.
- On the map, fast species dart about and slow ones plod.
- Friendly species settle near you; wary ones keep away.
- Sprite size and crowd size now follow real body size and population much more strongly.

## Update 7: Bloodlines ✅

*Every run leaves a mark, and every run gets further.*

- **Harder first runs.** A brand-new lineage should usually die in the cell stage or early in the creature stage. Reaching the creature finale takes a few runs' worth of upgrades. The test bots will check this: a bot with no upgrades should rarely win, and a fully upgraded one should win most of the time.
- **The Evolution Tree.** A big upgrade tree bought with Genetic Memory between runs, laid out like the Mind tree:
  - +1 to a stat
  - More DNA per turn
  - Lower DNA goals for milestones
  - Extra Population and Food storage
  - An extra draft choice, and rerolls
  - Starting parts
  - Unlocking body-part families
  - **Twin sockets** (see below)
- **Twin sockets, like Cyberpunk's cyberware perks.** Normally every slot holds one part (merged or not). Each "Twin" upgrade in the Evolution Tree lets **one specific slot** hold a second part, for example:
  - **Twin Hands:** claws and grasping fingers.
  - **Twin Senses:** big eyes and echolocation.
  - **Twin Back:** a shell and a garden.
  - **Twin Mouth:** fangs and a filter.

  The second socket works like the first: it merges and evolves on its own, so you can have two specialisms in one area. Twin upgrades are expensive, and later ones need earlier ones first.
- **The Fossil Record.** Every milestone saves a fossil of your lineage: its body, traits and Mind. Long runs are never lost:
  - Your favourite fossils can be kept **in amber**.
  - A new run can be started from any amber fossil, at the stage it was saved.
  - Reviving a fossil costs Genetic Memory, and the run earns a little less, so starting fresh still matters.
- **A gallery** of every lineage you've played: portrait, how far it got, how it ended and what it unlocked.

**You'll test:** whether your first run feels short but fair, whether every run gets you further, and whether the upgrades feel worth buying.

## Update 8: Many Ways to Live ✅

*Every archetype breaks a rule.*

Each archetype gets a gimmick that changes the whole run, not just its first few minutes:

| Archetype | Gimmick |
|---|---|
| **Drifter** | Goes where the current takes it. It can't pick an Instinct. Instead, the current carries it to new places, new species and new events every few turns. It can absorb a part from any species it meets. |
| **Grazer** | Lives as a vast herd. Population is huge, but it can never hunt. DNA comes from the size of the herd, not from time. Danger hits it hardest. |
| **Predator** | You are what you eat. There's no foraging: food only comes from hunting, and it spoils fast. Each kill can offer a part from the species you ate. |
| **Symbiote** | Two bodies, one life. You live joined to a partner species: you share stats, can swap parts between you, and suffer if the partner dies. |
| **Parasite** | Lives inside a host species on the map. Your Population is capped by the host's, and you steal its parts. You must jump to a new host before yours dies out, and hosts fight back. |
| **New: Colony** | Starts with no symmetry. Every member of the colony is a module you can reshape, and it splits into new colonies instead of growing. |
| **New: Mimic** | Copies the looks and some parts of species it meets, and can pass as one of them in events. |

Each gimmick has its own display (a hunger clock for the Predator, a host bar for the Parasite, a current map for the Drifter) and its own events.

**You'll test:** one run with each archetype. Do they feel like different games?

## Update 9: The Creature Editor

*Build exactly the creature you imagine.*

- **The editor opens when you leave the cell stage,** and again at each milestone. Between milestones you can open it for a small DNA cost.
- **Shape:**
  - Body length, height and thickness
  - Neck length
  - Spine curve
- **Limbs:** length, thickness and where each pair attaches along the body. Legs can sit far apart or bunched together.
- **Head:**
  - Size and shape
  - Where it sits: on a long neck, low and forward, or tucked into the body
  - How many eyes, and where they go
  - Jaw size
- **Twin sockets:** see both parts on the creature and move them around.
- **Colors and patterns, greatly expanded:**
  - Colors: base, belly, two pattern colors, and glowing or shiny accents
  - Patterns: stripes, spots, rings, rosettes, tiger, patches, countershading, gradient and iridescent
  - Each pattern has scale, density and placement settings
- **Rival species** get the same variety when they're generated, so the world looks far more varied.

**You'll test:** whether you can make a creature that looks like the one in your head.

## Update 10: The Living World

*The world remembers you, and it has a history.*

- **Activities (like CK3):** a tab of long actions that play out over several turns, each with its own events and outcomes:
  - **Migrate** to new territory
  - **War** on a species, with a front line and a war score
  - **Court** a species until it becomes an ally
  - **Avoid** a species: hide and stay out of its way
  - **Hunt** a particular prey species
  - **Scout**
- **A crowded world:** 8 to 12 species at once, with far more varied bodies, sizes and body plans. Herds of different species mix and compete on the map.
- **Niches, extinctions and successors:**
  - Every species fills a niche: big grazer, small grazer, apex predator, scavenger, filter feeder and so on.
  - When a species dies out, its niche opens. A survivor evolves to fill it, or newcomers migrate in.
  - A world history tracks the eras ("The Age of the Mossstalkers"), like watching empires rise and fall in CK3.
- **A truer map:** species that like each other gather together, and rivals keep apart. Prey herds bunch up and flee, and predators patrol.
- **Event chains, nemesis and ally species, species that evolve, seasons and migrations** (planned before as "The Living World").

**You'll test:** whether the world feels alive without you, and whether Activities give you enough to do between events.

## Update 11: The World Map

*The world grows as your mind does.*

- **A world map of biomes:**
  - On land: tundra, desert, swamp, jungle and plains.
  - In the sea: reef, kelp forest, ice shelf and the vents.

  Each biome has its own species, food, events and parts.
- **What you can see and do depends on your stage:**

  | Stage | Biomes | What you see | How you move |
  |---|---|---|---|
  | **Cell** | Always lives by a thermal vent; biomes have no effect | Just the vent | You don't |
  | **Multicellular** | Biomes start to matter, and you can rise to the sea surface | Only your own biome | Only by random events |
  | **Early creature** | Biomes matter | Only your own biome | You can choose to migrate, but you don't choose where you end up |
  | **Smarter creature** (a Mind idea such as Navigation) | Biomes matter | Neighbouring biomes appear on the map | You choose where to go |
  | **Later** | Biomes matter | Several biomes at once, then the whole world | You choose where to go |
- **Between sea and land:** crawling out, or going back to the water, becomes a journey on the world map.
- **New home worlds** built around the biomes.

**You'll test:** whether exploring the world feels like a reward for getting smarter.

## Update 12: Shells, Scales and Soft Bodies

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
  - **Cold:** eats less, but is sluggish in the cold. This ties in with seasons in Update 10.

Alongside the choices:

- **New part families:** compound eyes, beaks, feathers, shells, segment plates, suckers and egg sacs.
- **Matching looks:** shells, segmented bodies, compound eyes, beaks, crests and frills.
- **Events** for molting, egg-laying, nests and clutches, basking and hibernating.
- **Rival species** use the new bodies too, so the map fills with insects, reptiles, birds and octopuses, not just mammals.

**You'll test:** whether you can build something that is clearly an insect, a reptile, a bird or an octopus, and whether each feels different to play.

## Update 13: Other Minds

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

## Update 14: First Gatherings (Society stage, part 1)

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

## Update 15: Neighbours (Society stage, part 2)

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

## Update 16: Crowns (Civilization stage, part 1)

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

## Update 17: Empires (Civilization stage, part 2)

*The whole world, one way or another.*

- **Civilizations for the other paths:**
  - **Hive empires:** the queen's lineage and huge buildings.
  - **Den networks:** cities that change shape.
  - **Living empires:** grown technology.
- **Rival nations** of any kind, plus wars, treaties and betrayals.
- **Faiths** that spread, split and clash.
- **Wonders and disasters:** plague, famine, rebellion and the sea turning to acid.
- **The true endings.** Civilization is the final stage. Each path has its own grand ending, which unlocks **New Game+**: a new world that starts with echoes of your old ones. There are also a few "dead end" endings that still earn Genetic Memory.
- **Rival nations descended from your past lineages:** creatures from your Fossil Record can appear as rival civilizations.

**You'll test:** whether the late game stays tense, and whether every path's civilization holds up.

## Update 18: The Final Polish

*Everything we've been saving for the end.*

- **Balance pass** across every stage and path, using the test bots and your notes.
- **Art pass:** better drawings, animations and scenes.
- **Sound and music:** ambient sounds for land, sea and each stage.
- **Tutorial:** a gentle first run that teaches the game as you play it.
- **Offline app:** installs to your home screen and works without internet.
- **Settings:** text size, reduced motion and color-blind palettes.
- **Performance** on older phones.

- **Challenge runs, achievements and a daily run** (moved here from Bloodlines).

**You'll test:** the whole game, from start to finish, with fresh eyes.

---

## Scrapped

- **The Space stage** (was Updates 18–19). The game now ends with the Civilization stage. Its best ideas moved: the true ending and New Game+ go to Update 17, and past lineages returning as rivals go to Updates 10 and 17.

## Ideas waiting for a home

- Sharing a creature as an image or a link.
- A creature-naming screen.
- Hybrid symmetry (for example, a radial creature with a bilateral head).
- Mixing two Paths of Mind late in a run.
