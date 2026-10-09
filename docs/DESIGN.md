# Primordia: design notes

## Pitch

Spore's arc from a single cell to a civilization, rebuilt for phones: no movement, just decisions. Time flows on a living world map like Crusader Kings 3 (pause and three speeds), and events pop up and happen *to* your lineage. Mutation drafts build a body, parts merge into hybrids, and the right pairs evolve (like Ball x Pit). Extinction ends the run, but Genetic Memory and the Codex carry over and unlock more variety.

## The run

| Stage | Turn unit | Phases | Status |
|---|---|---|---|
| Cell | Epoch | Single cell → **Many Become One** (multicellularity) → **The Edge of the Sea** (land or sea) | Playable |
| Creature | Generation | First Steps → **Age of Giants** (size choice) → **Spark of Mind** (Mind tree) → First Tribe / First Pod finale | Playable |
| Society, Civilization | — | — | Planned (Civilization is the final stage) |

**Time:** every tick (2.4 s at normal speed) is one Epoch or Generation: Food is gathered and eaten, Population grows, DNA and Insight arrive, and every other species grows, starves or is hunted. Drafts, milestones and finales pause time when DNA reaches them. Random events also pop up and pause time; after choosing, a scene acts out what happened.

**A failed finale is a real failure:** you lose Population (and some DNA in the Cell stage), then can try again 3 turns later.

## Resources

- **Population**: your health. At 0 you are extinct.
- **Food**: you gather Food every turn based on your Instinct and parts, and eat half your Population (rounded up). Spare Food grows Population by 1 (once per turn). Storage is capped, and extra Food spoils. So Food turns into Population, and a bigger Population eats more.
- **DNA**: drives drafts, milestones and finales.
- **Insight** (after the Spark of Mind, about halfway through the Creature stage; finishing the tree takes the other half): flows into the idea your kind is fascinated by in the Mind skill tree. Each idea branches from earlier ones, shown with lines. Innovations need the right diet, stats, traits or earlier ideas, and some rule others out (Ambush Instinct or Gentle Grazing; Pack Tactics or Herd Defense; War Bands or Shared Ritual; Lone Wanderers or a social path).

## Instinct (CK3-style focus)

Forage, Hunt, Breed, Explore or Lie low. Your Instinct sets your Food income and makes matching events more likely. You can change it at any time.

## Archetypes (each breaks one rule for the whole run)

| Archetype | Gimmick |
|---|---|
| Drifter | The current picks your Instinct (forage or hunt, by diet). Every 8 turns it carries you on: your worst enemy is replaced by a new species, and half the time you can absorb one of its parts. |
| Grazer | Max Population ×1.6; DNA per turn = Population ÷ 6; no hunting or meat-eating mouths; damage ×1.5. |
| Predator | No foraging; hunting only feeds you on a kill (a roll on your best of Strength and Speed). Food storage halved. 5 turns without a kill and you starve. Kills can let you devour a part. |
| Symbiote | Joined to a partner species (allied, never attacks). +⅙ of its stats; swap parts with it (3 DNA); −2 Food while it struggles; lose half your kind if it dies out (then a new partner). |
| Parasite | Lives inside a host: +2 Food (3 as a creature) from feeding; max Population ≤ 60% of the host's; drains and angers the host. Steal a part (3 DNA) or jump hosts (3 DNA, lose a quarter of your kind). If the host dies, half of you die too. |
| Colony | Always grows without symmetry. When full and well fed, a third splits off as an allied offshoot species (up to 3). Reshaping costs half. |
| Mimic | Disguise as any species (3 DNA): take its colors and copy a part. Checks involving it are 2 easier, and as a predator it attacks 40% less. |

Each archetype has a status chip in the top bar (Hunger, Host, Partner, Current, Herd DNA, Offshoots, Disguise) and its own events. Test bots, fresh: 25–45% reach the creature stage and 3–12% win, depending on archetype. Fully upgraded: 77–100% win.

## Builds

- **Slots.** Cell has Mouth, Motion and Membrane, plus Senses and Organ once multicellular. Land creatures have Mouth, Senses, Front limbs, Hands, Hind limbs, Feet, Back, Skin and Tail. Sea creatures have Mouth, Senses, Front fins, Arms (pincers, tentacles, clubs: the sea's hands), Rear fins, Underside (walking legs, suckers, belly lights), Dorsal, Skin and Tail.
- **Merging.** From the very first draft, a new part can merge with the one in its slot, keeping both sets of stats and keywords ("Venomous Fangs"). A slot holds at most two parts. A new part on a merged slot (from a draft or a random mutation) swaps out only one half, so a merged part stays merged.
- **Evolutions.** 125 recipes (Ball x Pit style): merging the right two parts in a slot evolves them into one stronger part, which can merge again. Some tier 1 evolutions evolve again into tier 2 legendaries. Drafts name known recipes and hint at unknown ones. Discoveries are saved in the Codex (+5 Genetic Memory each) and gate unlocks: Venom Glands (1), Symbiote (2), Toxic Bloom (4), Parasite (5).
- **Carry-over.** When you leave the Cell stage, only your mouth and your evolved parts grow into creature parts. Everything else is left behind; the archetype fills essential empty slots.
- **Basic limbs.** Every creature starts with Stubby Forelegs and Hind Legs (or Stubby Fins at sea). Limb mutations (Long Bones, Thick Muscle, Gripping Pads, Bony Plates, Skin Flaps, Soft Bones, Springy Tendons, Balance Organ, Long Fin Rays) merge with them to grow every advanced limb: runner legs, haunches, pillars, hoppers, upright legs, arms, wings, tentacles, fins and flippers.
- **Flight.** Stubby Forelegs + Skin Flaps → Wing Membranes; + Flight Feathers → Feathered Wings (or Slender Forelegs + Wing Membranes → True Wings). Flyers soar above the map and unlock flight choices in events.
- **Roguelike unlocks.** Evolved parts (including advanced limbs) never appear in drafts until you have created them by merging. Once discovered, they can turn up in drafts in every later run (legendaries rarely). The end screen lists what a run unlocked.
- **Visual variety.** Merged and evolved parts draw every ingredient layered together. Evolved slots reshape the body: bigger heads with extra teeth, extra eyes, longer and thicker limbs (a third pair for tier 2), bigger claws, a crest of spikes, glowing skin, forked tails.
- **Symmetry.** Becoming multicellular means choosing a symmetry for good. **Bilateral** (head and tail, legs in pairs, +2 Speed). **Radial** (starfish on land, jellyfish at sea): +Cunning and Toughness but slow and weak, with no hind limbs, feet or tail. **No symmetry** (an oozing colony on pseudopods): big colonies and Food, but dim, clumsy and charmless, with no hands, feet or tail.
- **Body plan.** In the Creature stage the Body plan tab changes your number of leg pairs, arms or pseudopods for 4 DNA a step. Bilateral: 0 pairs is a **Serpent** (snake or eel; stealthy hunter, but loses every limb slot), 1 pair stands on two legs (+Insight), 2 is the classic four legs, 3 is six legs, and up to 8 pairs makes a **Centipede** (very fast and tough, but always hungry and unloved). Radial: 3 to 8 arms; Colonial: 2 to 8 pseudopods. More segments mean more Food eaten each turn. Slots a body plan doesn't use are greyed out; parts there are kept but do nothing, and drafts skip them. Some events need a body plan (serpents slither into burrows, radial creatures regrow lost arms, colonies bud).
- **The Creature Editor.** A full-screen editor with a live animated preview opens when you become a creature and after the Age of Giants and the Spark of Mind (free), or from the Look tab for 2 DNA. Tabs:
  - **Body:** shape, length, height, back slope, neck length (long necks need the Age of Giants), posture.
  - **Limbs/Fins:** length, thickness, spacing, position; fin styles at sea.
  - **Head:** shape, position (neck, forward, high, tucked), size, 1–6 eyes, eye size, jaw size, eye style.
  - **Colors:** body, belly and two pattern colors; 12 patterns (plain, spots, stripes, armor bands, glow spots, rings, patches, countershading, two-tone, rosettes, tiger, iridescent) with size and density; matte, glossy or glowing finish.

  Some options unlock with progress (`need` in `G.APPEARANCE`, `cap` in `G.SCULPT`). Looks never change stats. Rival species get random looks from the same system.
- **Foundations.** Three one-time choices in the Creature stage, shown in the Body plan tab and on every species sheet:
  - **Frame** (at the start of the stage): **Inner Skeleton** (the only frame that can grow giant on land); **Outer Shell** (+2 Toughness, half-price body plan changes, −2 Speed, and every 12 turns you molt: 2 turns of taking extra damage); **Soft Body** (+2 Cunning, hunters strike 20% less often, but −2 Toughness).
  - **Young** (8 turns in): **Live Young** (+1 Toughness and Charisma, but only 1 birth a turn); **Eggs** (+1 max Population and twice the births, but eggs get stolen); **Budding** (radial and colonial bodies only: steady births, less Charisma).
  - **Blood** (13 turns in): **Warm** (+1 Speed and no hungry seasons, but more Food eaten); **Cold** (less Food eaten, but −2 Speed and −1 Food in winter, cold seas, tundra and polar waters; +1 Speed in summer, blooms, desert and vents).

  Each choice unlocks its own events (molting, clutches, egg thieves, basking stones, cold snaps, drying out, squeezing through cracks). Rival species get random foundations too, and many grow into a matching shape: armored bugs with jointed legs and compound eyes, snails and woodlice, slugs, birds with beaks and feathers, lizards with sticky tongues, crabs and sea slugs.
- **Size.** Every creature has a real size (centimeters to meters) shown on its map label, its sheet and the Body tab. Small creatures live in herds 1.5× bigger and eat less each, but every blow kills more of them. Giants live in small herds, eat a lot and shrug off damage. Max Population also grows with each milestone. Event gains and losses scale with herd size.
- **Keywords:** Venom, Armor, Swift, Glow and Symbiont. Two parts give a stat bonus; three give a stronger bonus.
- **Tags:** grasping parts (hands, arms, tentacles, trunk, prehensile tail) unlock tool events and the Tools innovation. Upright legs free the hands and boost Insight.
- **Traits** come from events and milestones and last the whole run. Your diet when leaving the Cell stage gives a heritage trait.

## The world

**The sea has depth.** Sea creatures choose a home depth in the Instinct tab (3 DNA to move): Sunlit Shallows (lots of food, nowhere to hide), The Reef (friends and shelter, slow), Open Water (fast hunters), the Twilight Zone (sharp senses; needs a Glow part, sharp senses or Pressure Skin) and The Abyss (safe but hungry; needs a Glow part or Pressure Skin). The sea map is a side-on slice of ocean with every herd at its home depth, and some events only happen at certain depths.


The map gives every herd a home territory spread across it, with scenery (trees, bushes, rocks and a pond on land; kelp, coral and rocks at sea). Flyers soar above the ground with shadows beneath. Every stage has named species with roles (predator, prey, rival, neighbor), an opinion of you and a population. Other species have their own symmetry and body plan too (starfish, jellyfish, snakes, centipedes, colonies). Their herds roam the world map: crowd size shows population, sprite size scales with real body size, and each label reads name · population · size. Predators chase prey, hostile species drift toward you, allies stay close. Populations rise and fall each tick; species can go extinct and newcomers arrive. Tap a herd (or a species in the World tab) to see its sheet, and tap its portrait to view it full screen. Hunting or beating a species thins its numbers.

## The World Map

- **Biomes** (`G.BIOMES`):
  - **Cell:** Thermal Vent (home), Sunlit Surface, Mud Flats.
  - **Land:** Open Plains (home), Jungle, Desert, Tundra, Swamp, Shore.
  - **Sea:** Warm Seas (home), Kelp Forest, Polar Sea, Vent Fields, Coast. Your home depth still applies within each sea region.

  Each biome has stat effects, its own scenery and ground colour, events (`biome:` in events.js) and parts (`biome:` in parts.js, drafted only there, 3× as often). Biomes only matter once you are multicellular.
- **Vision and travel** (`G.vision`):

  | Vision | When | What you see | How you move |
  |---|---|---|---|
  | 0 | Cell stage | Your own biome | Only by events (rising bubbles, falling silt, the warm current) |
  | 0 | Early creature | Your own biome | Migrate to a random neighbour |
  | 1 | Cunning 6 or the Spark of Mind | Neighbours too | Choose your destination on the Map tab |
  | 2 | Keen Memory, Lone Wanderers or Symbolic Thought | The whole world | Choose your destination |

  Arriving somewhere new replaces most of your neighbours. Partners, hosts, offshoots and nemeses follow you.
- **Crossing over.** The Shore (land) and the Coast (sea) allow the Cross over activity: 5 turns and a quarter of your kind. Parts that only work in the old habitat are lost, basic limbs and a mouth are filled in, the world is new, and the editor opens.

## The Living World

- **Niches.** Every species fills a niche (`G.NICHES`: apex predator, small hunter, big grazer, small grazer, scavenger, forager, browser, gentle giant). The cell stage starts with 6 species and the creature stage with 9. Species in the same niche share its room to grow.
- **Extinction and successors.** When a species dies out, its niche opens. 3–6 turns later, a survivor's descendant evolves into it (inheriting its body, with a mutation) or newcomers arrive. Species also keep mutating. Migrating herds pass through for 5 turns.
- **Ages.** Every 4 turns the dominant species (population × size, predators count extra), or your kind, names the age. A new power must stay on top for two checks in a row. The World tab shows the history.
- **Seasons** (creature stage, 6 turns each; `G.SEASONS`) change food and stats and have their own events.
- **Activities** (`G.ACTIVITIES`), one at a time:

  | Activity | Effect |
  |---|---|
  | Migrate | 4 turns at −1 Food; arrive among 3 new neighbours with +3 Food and +3 DNA. 10-turn rest. |
  | War | War score moves each turn with strength and numbers; ±100 ends it. Victory crushes them; defeat costs Population. Either way they become your nemesis. 8-turn rest. |
  | Court | A Charm roll each turn; allies at opinion 60. |
  | Avoid | −2 Food a turn; they attack 70% less. |
  | Hunt them | A hunt roll each turn: food, but big or fast prey fights back. |
  | Scout | 3 turns at −1 Food, then a feeding ground, a part to borrow, or DNA. 12-turn rest. |

  Activity events (`activity:` in events.js) only happen while that Activity is under way.
- **Nemesis and sworn allies.** Opinion −90 (or a war) makes a nemesis, which raids you and hunts you more often. Opinion +90 makes a sworn ally, which brings gifts.
- **Story chains.** An event result with `chain` schedules a follow-up event (`chained: true`) a few turns later, for example the Strange Egg and the Plea for Help.
- **Predators share the hunt.** Each predator's chance to strike shrinks with the number of predators, so a crowded world isn't automatically deadlier.

## Scenes

After every choice, a scene acts out what happened. When another species is involved, both sides play a story: you chase and eat prey, win or lose a brawl, get mauled, escape while the predator looks confused, befriend them, or get snubbed. Babies pop into your herd when it grows; ghosts float up when it shrinks; food flies in or away. Props come from the event (ice, fire, fruit, tar, whirlpools, viruses and more), with cartoon faces and comic words.

## Between runs

- **Genetic Memory per run:** DNA collected ÷ 3 (plus, for a lineage that dies as a cell, 1 per 4 turns survived and at least 6 in total), +5/+10/+5/+10 for each stage milestone, +40 for winning; ×1.25 per hostility level, ×0.6 for a revived fossil.
- **First-time tips:** `G.TUTORIALS` in world.js. Each has a `when(run, ui)` condition and shows once, the first time it holds, in any run; seen ids are saved in `meta.tips`. Tips pause time and never show while the Creature Editor is open.

**It's a roguelike.** Every check is harder by `G.HARSH` (6; finales are exempt). Predators and hostile species attack every turn: the chance (`G.PREDATION` 0.34 plus 0.04 per point of gap) and the size of each strike grow with the gap between their Strength and your Toughness plus half your Speed. A fresh lineage usually dies in the cell stage. Upgrades in the Evolution Tree pay the harshness back, so each run gets further. Test bots: a fresh bot reaches the creature stage about 25% of the time and rarely wins; a fully upgraded bot wins about 88%. In whole campaigns, bots win about 4% of first runs and 40–60% by runs 12–15.

- **Evolution Tree** (22 nodes in 6 columns, about 1,300 Genetic Memory to complete): Hardy Ancestors, Ancestral Pantry, Deep Memory, Rich Genes (+10% DNA), Second Look (reroll), Amber; +1 stat nodes; Second Chance (survive extinction once per run); Short Road (DNA goals −8% per level); Wider Gene Pool; Ancestral Armor; Head Start (a free draft); and the **Twin sockets**.
- **Twin sockets.** Normally every slot holds one part (merged or not). A Twin upgrade (Mouth, Organ, Senses, Back, Hands, Skin) lets that one slot hold a second part ("hands2"), which merges and evolves on its own.
- **Fossil Record.** Every milestone and new stage saves a fossil (a snapshot of the run). Keep up to 1–3 in amber; reviving one costs 12–45 Genetic Memory and the run earns 60%. A gallery lists the last 30 lineages.
- **Finales** get 1 easier per failed attempt.

- **Genetic Memory** = DNA ÷ 3 + milestone bonuses + 40 for winning, × Hostility bonus.
- **Unlocks:** archetypes, home worlds, mutation packs, ancestral boons and Hostility 1–5.
- **Codex of Life:** every event, part and ending found.
- **Endings:** Firekeepers, Unifiers, Conquerors and Wanderers (land); Deep Singers, Reef Builders, Tide Lords, Shell Smiths (tools) and Vent Keepers (the sea's fire) (sea).
- **Shared words:** events use {herd}, {nests}, {cover}, {home}, {move} and {depth}, which change with your body, so one event reads right on land and at sea.

## Next steps

See [ROADMAP.md](ROADMAP.md) for the themed updates planned from here.
