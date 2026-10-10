# Primordia: roadmap

The game grows in **themed updates**, like Minecraft's. Each update has one theme, a short list of what's in it, and a test checklist. After each one you play it, send feedback, and any fixes go into a small patch (6.1, 6.2…) before the next update starts.

**Done so far:** Updates 1–5 built the Cell and Creature stages: event cards, real-time map, drafts, merging, evolutions, Mind tree, flight, symmetry and body plans. **Update 6 (The Deep), Patch 6.1, Update 7 (Bloodlines), Update 8 (Many Ways to Live), Update 9 (The Creature Editor), Update 10 (The Living World) Update 11 (The World Map) and Update 12 (Shells, Scales and Soft Bodies) are out.** Land and sea are now level: 37 events each and 15 grasping parts each, with land slightly ahead on parts and evolutions.

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

| Path | Inspired by | On land | In the sea | Needs | Strengths | Becomes (Tribe → Society → Empire) |
|---|---|---|---|---|---|---|
| **Toolmakers** | Apes, crows, sea otters | Ape-like, crow-like | Otters, crabs with shells | A grasping part (hands, trunk, beak, pincers, tentacles) | Tools, then fire on land or vent-forging under water | Tribe or Shell Clan → Hearthlands → Kingdom or Forge-cities |
| **Singers** | Whales, dolphins, songbirds, wolves | Songbirds, howlers | Whales, dolphins | A voice, echolocation or display parts | Memory carried in songs, huge range, friendship and diplomacy | Choir or Pod → Song-circles → Song-nation |
| **Many Minds** | Octopuses, cuttlefish | Soft climbers | Octopuses, cuttlefish | A soft or radial body, color-changing skin | A brain in every arm, camouflage, speaking in color, fast learning | Den → Den Network → Shifting Cities |
| **The Swarm** | Ants, bees, termites, coral | Ant- and termite-like | Coral, siphonophores | No symmetry, small size or a strongly social lineage | Huge numbers that share one mind, giant buildings | Hive or Reef-colony → Hive-cities → Hive Dominion |
| **Gardeners** | Leafcutter ants, farming fish, fungi | Fungus farmers | Kelp and algae farmers | Symbiont parts or a plant diet | Farming other species, living technology | Grove or Kelp Garden → Garden League → Living Empire |

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
| 9 | **The Creature Editor** ✅ | A full editor after the cell stage: limbs, heads, proportions, colors and patterns | Large |
| 10 | **The Living World** ✅ | A CK3-style Activities tab, a crowded world, extinctions and rising species | Large |
| 11 | **The World Map** ✅ | Biomes, and a world you see more of as your kind gets smarter | Large |
| 12 | **Shells, Scales and Soft Bodies** ✅ | Not every creature is a mammal | Medium |
| 12.1 | Patch ✅ | Comparing mutations, tips, a death scene, an editor fix | Small |
| 12.2 | Patch ✅ | Arms, self-balancing bodies, tension in checks, seasons on the map, Gene Affinities | Medium |
| 13 | **Other Minds** ✅ | The Mind tree rebuilt: roots from your start, Paths of Mind, 10 endings | Large |
| 14 | **First Fires** ✅ | **Tribe stage**, part 1: Toolmakers (Tribe, Shell Clan) and Singers (Choir, Pod) | Large |
| 15 | **Many Kinds** ✅ | Tribe stage, part 2: Den, Hive, Reef-colony, Grove and Kelp Garden; Ancestral Wisdom | Large |
| 16 | Peoples | **Society stage**, part 1: settlements, council, traditions, neighbours | Large |
| 17 | Faith and Neighbours | Society stage, part 2: the other kinds, faiths, diplomacy, society endings | Large |
| 18 | Crowns | **Empire stage**, part 1: the world as a realm, dynasty, land and sea technology | Large |
| 19 | Empires | Empire stage, part 2: the other kinds, rival empires, wonders, grand endings, New Game+ | Large |
| 20 | The Final Polish | Balance, art, sound, settings, offline app, challenges and achievements | Large |

**The full plan for Updates 13–19 is in [LATER_STAGES.md](LATER_STAGES.md):** how your start, your Path of Mind and your ending flow into the Tribe, Society and Empire stages.

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

## Update 9: The Creature Editor ✅

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

## Update 10: The Living World ✅

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

## Update 11: The World Map ✅

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

## Update 12: Shells, Scales and Soft Bodies ✅

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

**What shipped:** three foundation milestones (Frame, Young, Blood); 29 new parts (beaks, sticky tongue, compound eyes, heat pits, jointed and jumping legs, pincers, mantis arms, gecko feet, digging claws, snail shell, segment plates, egg sac, chitin, feathers, mottled and mucus skin, spinnerets, rattles, drop-off tails, and three sea grips); 17 new evolutions (Raptor Beak, Insect Wings, Mantis Scythes, Citadel Shell, Exoskeleton, Web Weaver, Gripping Hands and more); 20 new events; rival species built as bugs, snails, slugs, birds, lizards, crabs and sea slugs. Soft bodies regrowing lost parts is left for a later update.

## Patch 12.1: Playtest fixes ✅

From the first playtest notes:

- **Compare mutations:** drafts show what each slot holds now (both halves of a merged part) and the exact stat and diet change of every choice. The Body tab lists each merged half's stats.
- **Editor soft-lock fixed:** the Done button sat under the phone status bar. The header now respects the safe area, and a second Done button sits at the bottom.
- **First-time tips:** each feature is explained once, the first time it shows up, in whichever run that happens. They are saved between runs, can be turned off, and can be reset from How to play.
- **Death scene:** the last of your kind falls (or sinks), its spirit rises, "EXTINCT", and the ground closes over it as a fossil.
- **Early Genetic Memory:** a lineage that dies as a cell earns at least 6, plus 1 per 4 turns survived, so the first upgrades are reachable before you can reach the Creature stage.
- **Still to do from the notes:** a wider animation pass (more scene variety for everything that has been added since Update 6) belongs with Update 18's polish, but the most important moment, death, is done now.

## Patch 12.2: Bodies that make sense ✅

From the second playtest notes:

- **Arms vs legs:** the Body plan sets how many limb pairs are arms (0 to all of them). One leg pair stands upright with hands free; more leg pairs make a centaur; no legs makes an arm-crawler. Replaces the old Posture option.
- **Self-balancing bodies:** front and hind limb lengths are separate sliders and tilt the body to match; long arms on an upright body knuckle-walk; a head angle slider; legs are kept under the body (no more floating backs); every back, skin and tail part follows the tilt.
- **Tails** are only drawn with a tail part.
- **Editor:** always free; big creatures are framed to fit (portraits, scenes, viewer and map sprites too); safe areas are guessed when the game runs in a frame on a phone.
- **Tension and emphasis:** checks show a swinging needle over the odds before the result is revealed; actions get a wind-up, bigger moves, freeze-frames and screen shake.
- **Seasons and weather** are drawn on the world map.
- **Eyes and limbs matter:** 12 events reward or punish many eyes, arms, standing upright and many legs (or fins).
- **Drifters** choose their Instinct on land and once the Mind awakens.
- **Gene Affinities:** a late-game shop (after the first win) that makes chosen families of mutations more common in drafts.

## Update 13: Other Minds ✅

*Intelligence comes in many shapes.*

- **The Mind tree rebuilt from pieces:**
  - **Roots** from your starting cell: your temperament (the Hunter, the Herd, the Bond, the Taker, the Many, the Mask, the Wanderer).
  - **A trunk** for land or sea, plus ideas from your biome or depth (the deep sea gives Living Light; the desert gives Water Memory).
  - **Branches** opened by your body: arms, many eyes, a voice, a soft body, a hive-like colony.
- **The Spark of Mind becomes a choice** of the 2–3 Paths of Mind your body and history allow. Paths you can't take are shown locked, with what you'd need.
- **Self-Awareness is replaced by capstones.** Each Path has one ending on land and one at sea (10 in all), and each ending gets a twist from your temperament. For example, a deep-sea predator on the Many Minds path becomes the Lantern Court.
- **The Codex of Endings:** a grid of your starts against every ending.
- **Radial and colonial bodies get a real road to intelligence** through Many Minds and the Swarm.
- **Test bots** check that every Path wins about as often as the others.

**You'll test:** whether a predator, a grazer and a symbiote think differently, not just the same tree in a new color.

**What shipped:**
- 21 root ideas (3 for each temperament), 6 land and sea ideas, 11 home ideas (one for each biome and depth), 20 Path ideas and 5 Awakenings.
- 10 Path finales and 70 named endings.
- The Codex of Endings.
- 10 signature events, two for each Path.
- Lineages that reached the Spark before this update choose a Path when they next play.

## Patch 13.1: A firmer footing ✅

From the playtest after Update 13, to make a solid platform for the Tribe stage:

- **The editor fits the body.** Tabs, sliders and their names depend on whether you are a land creature, a sea creature, a serpent, a radial body (starfish or jellyfish) or a shapeless colony. Tails, back parts and wings get size sliders when you have them.
- **Difficulty is shown for every start:**
  - **Gentle:** Drifter.
  - **Tricky:** Predator, Symbiote and Mimic.
  - **Hard:** Grazer, Parasite and Colony.
- **Hidden power.** A measure the player is never shown tracks how much of the Evolution Tree you have bought and how many lineages have won. It is fixed when a run starts, and the world quietly gets harsher to match it (up to +4 on every check, and predators up to 40% more aggressive). An upgraded player is never left with an easy game.
- **Small fixes:** tips darken the screen behind them; no "replace" line for merged parts; cell sizes spelled out; a simpler Drifter tip.

## Update 14: First Fires (Tribe stage, part 1)

*Your creatures become a band.*

- **The Tribe stage engine:** your members in your home biome, a named leader with two traits who grows old and is replaced (you choose from three), and Discoveries that you draft and combine the way you did with parts. Ideas replace DNA.
- **Four kinds:** Toolmakers become the **Tribe** (land) or **Shell Clan** (sea) and keep **Fire** (or Vent-heat): warmth, protection and gear. Singers become the **Choir** (land) or **Pod** (sea) and keep **Song**: charm and ideas, but verses (and discoveries) are lost when many die.
- **Your Creature ending is a checkpoint:** its Genetic Memory is paid at once.
- **Your body becomes your talents:** hands, voice, glow, venom, armor, wings, eyes and speed open their own discoveries. 51 discoveries, with combinations.
- **Species from your Creature world become wildlife** to hunt, tame or revere as totems. New Activities: Tame, Revere, Ceremony, Craft and Teach the songs.
- **Strangers:** your nemesis or a rival learns to think and becomes a rival band that remembers you.
- **Temperaments** each get a Tribe rule.
- **~55 Tribe events**, three milestones and four Founding finales.
- **Three endings** for each kind (Settle, Roam, Conquer), 12 in all, and **Stage Select** to start a run at the beginning of a Tribe you have founded, for free.

**You'll test:** whether the Tribe and the Pod feel equally deep and clearly different.

## Update 15: Many Kinds (Tribe stage, part 2)

- The **Den** (Many Minds: Light, few but brilliant, watch and learn), the **Hive** and **Reef-colony** (Swarm: a Queen, castes, Brood and a growing home), and the **Grove** and **Kelp Garden** (Gardeners: Growth, farming, and Blight).
- **Rival bands:** a second band arrives later; each band has its own kind, and bands can feud.
- **Ancestral Wisdom:** a 12-node Tribe-stage tree on the Evolution screen. The Tribe stage is now harder, so a first attempt usually fails.
- 79 discoveries, ~85 Tribe events, 30 Tribe endings.

## Update 16: Peoples (Society stage, part 1)

*You are not the only people.*

- **The Society stage engine:** 3–8 settlements in a region, a ruler and a council of three, and **Traditions and Laws** (a culture tree whose first node is your founding myth).
- **Toolmakers and Singers** on land and at sea.
- **Neighbour peoples** of any kind, with gifts, trade, alliances, raids and wars.

## Update 17: Faith and Neighbours (Society stage, part 2)

- **The other kinds** of society.
- **Faiths built from your own history:** your ancestor, your ending, your nemesis species.
- **Society endings:** unite your region by Conquest, Trade, Faith or a Wonder. How you win decides your kind of empire.
- **Heritage:** the Society-stage tab of the Evolution screen.

## Update 18: Crowns (Empire stage, part 1)

*The most Crusader Kings 3 part of the game.*

- **The world as a realm:** the World Map divided into provinces, with land and sea realms.
- **A dynasty:** ruler, heirs, spouse, rivals, inheritance laws, vassals, and a council that schemes.
- **Technology:** fire, then metal, then engines on land; vents, then electricity, then living light, then coral-shaping at sea. Your kind of people changes it again.
- **The first two kinds** of empire.

## Update 19: Empires (Empire stage, part 2)

- **The other kinds** of empire, and **rival empires** descended from lineages in your Fossil Record.
- **Wars, treaties, betrayals, faiths that spread and split, wonders and disasters.**
- **Grand endings** for each kind, which unlock **New Game+**. There are also a few dead ends that still earn Genetic Memory.
- **Legacy:** the Empire-stage tab of the Evolution screen.

## Update 20: The Final Polish

*Everything we've been saving for the end.*

- **Balance pass** across every stage and path, using the test bots and your notes.
- **Art pass:** better drawings, animations and scenes.
- **Sound and music:** ambient sounds for land, sea and each stage.
- **Offline app:** installs to your home screen and works without internet.
- **Settings:** text size, reduced motion and color-blind palettes.
- **Performance** on older phones.
- **Challenge runs, achievements and a daily run.**

**You'll test:** the whole game, from start to finish, with fresh eyes.

---

## Scrapped

- **The Space stage** (was Updates 18–19). The game now ends with the Empire stage. Its best ideas moved: the true ending and New Game+ go to Update 19, and past lineages returning as rivals go to Updates 10 and 19.
- **Mixing Paths of Mind.** Paths are fixed for the whole run, to make replaying with a different path worthwhile.
- **A single Society stage followed by Civilization.** This is now three stages: Tribe, Society and Empire (see [LATER_STAGES.md](LATER_STAGES.md)).

## Ideas waiting for a home

- Sharing a creature as an image or a link.
- A creature-naming screen.
- Hybrid symmetry (for example, a radial creature with a bilateral head).
