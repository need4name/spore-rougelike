// Stats, synergies, traits, instincts, the Mind tree, archetypes, worlds and unlocks.
window.G = window.G || {};

G.STATS = [
  { id: 'str', name: 'Strength', short: 'STR' },
  { id: 'tou', name: 'Toughness', short: 'TOU' },
  { id: 'spd', name: 'Speed', short: 'SPD' },
  { id: 'cun', name: 'Cunning', short: 'CUN' },
  { id: 'cha', name: 'Charm', short: 'CHA' },
];

// Human-readable names for every modifier key, used to describe parts and traits.
G.MOD_LABELS = {
  str: 'Strength', tou: 'Toughness', spd: 'Speed', cun: 'Cunning', cha: 'Charm',
  maxPop: 'max Population',
  foodPerTurn: 'Food per turn',
  popPerTurn: 'Population regrowth per turn',
  dnaPerTurn: 'DNA per turn',
  insightPerTurn: 'Insight per turn',
  ideasPerTurn: 'Ideas per turn',
  discoveryCost: 'discovery cost',
  influencePerTurn: 'Influence (Learning) per turn',
  specialPerTurn: 'of your people\'s resource per turn',
  forageBonus: 'Food while Foraging',
  huntBonus: 'Food while Hunting',
  exploreBonus: 'DNA (Ideas, Influence, Learning) while Exploring',
  upkeep: 'Food eaten per turn',
  damageReduce: 'damage taken',
  foodCap: 'Food storage',
  growthCost: 'Food needed to grow',
};

// Synergies. Having 2 or 3 parts with the same keyword unlocks a bonus. Tier 3 adds to tier 2.
G.KEYWORDS = {
  venom: { name: 'Venom', color: '#b98cf2', tiers: { 2: { mods: { str: 2 }, desc: '+2 Strength' }, 3: { mods: { huntBonus: 2, damageReduce: 1 }, desc: 'Hunting gives +2 Food, and predators think twice (−1 damage taken)' } } },
  armor: { name: 'Armor', color: '#a9b6bd', tiers: { 2: { mods: { tou: 2 }, desc: '+2 Toughness' }, 3: { mods: { damageReduce: 1, maxPop: 2 }, desc: '−1 damage taken and more max Population' } } },
  swift: { name: 'Swift', color: '#f2c14e', tiers: { 2: { mods: { spd: 2 }, desc: '+2 Speed' }, 3: { mods: { exploreBonus: 2, dnaPerTurn: 1 }, desc: '+1 DNA every turn, +2 more while Exploring' } } },
  glow: { name: 'Glow', color: '#6fe0d4', tiers: { 2: { mods: { cha: 2 }, desc: '+2 Charm' }, 3: { mods: { dnaPerTurn: 1, cun: 1 }, desc: '+1 DNA every turn and +1 Cunning' } } },
  symbiont: { name: 'Symbiont', color: '#8fd16a', tiers: { 2: { mods: { foodPerTurn: 1 }, desc: '+1 Food every turn' }, 3: { mods: { popPerTurn: 1 }, desc: 'Regrow 1 Population every turn' } } },
};

// Instincts are your lineage's focus, like a lifestyle focus in CK3.
// They decide how you feed yourself and which kinds of events find you.
G.INSTINCTS = [
  { id: 'forage', name: 'Forage', desc: 'Gather plants and drifting food. Herbivores do best.', tags: ['food'] },
  { id: 'hunt', name: 'Hunt', desc: 'Chase down prey. Carnivores do best. Hunting events find you more often.', tags: ['hunt'] },
  { id: 'breed', name: 'Breed', desc: 'Raise more young: Population grows from 2 spare Food instead of 3. Mating events find you.', tags: ['social'] },
  { id: 'explore', name: 'Explore', desc: 'Wander far: +1 DNA per turn (more with some parts), but −1 Food. Discoveries find you.', tags: ['explore'] },
  { id: 'hide', name: 'Lie low', desc: 'Take 1 less damage from everything and meet fewer dangers, but −1 Food.', tags: [] },
];

// Traits are gained from events and stay for the whole run, across stages.
G.TRAITS = {
  cautious: { name: 'Cautious', mods: { tou: 1, spd: -1 }, desc: 'Survives by never taking chances.' },
  curious: { name: 'Curious', mods: { cun: 1 }, desc: 'Pokes at everything new.' },
  aggressive: { name: 'Aggressive', mods: { str: 1, cha: -1 }, desc: 'Starts fights and usually finishes them.' },
  gentle: { name: 'Gentle', mods: { cha: 1, str: -1 }, desc: 'Other species trust you.' },
  feared: { name: 'Feared', mods: { str: 1, cha: -1 }, desc: 'Your reputation arrives before you do.' },
  resilient: { name: 'Resilient', mods: { maxPop: 2 }, desc: 'Hard to kill.' },
  scavenger: { name: 'Scavenger', mods: { forageBonus: 1 }, desc: 'Nothing goes to waste.' },
  dazzling: { name: 'Dazzling', mods: { cha: 1 }, desc: 'Light shows confuse friend and foe.' },
  endosymbiont: { name: 'Endosymbiont', mods: { foodPerTurn: 1 }, desc: 'Something you swallowed now lives inside you and helps.' },
  social: { name: 'Social', mods: { cha: 1 }, desc: 'Prefers company.' },
  toxic_affinity: { name: 'Toxic Affinity', mods: { tou: 1 }, desc: 'Poison barely bothers you.' },
  scarred: { name: 'Scarred', mods: { tou: 1, cha: -1 }, desc: 'Survived something terrible.' },
  hoarder: { name: 'Hoarder', mods: { foodCap: 4 }, desc: 'Always keeps something stashed.' },
  meek: { name: 'Meek', mods: { cha: 1, str: -1 }, desc: 'Avoids trouble by bowing low.' },
  pack_hunter: { name: 'Pack Hunter', mods: { huntBonus: 1, cha: 1 }, desc: 'Hunts together, eats together.' },
  migratory: { name: 'Migratory', mods: { spd: 1 }, desc: 'Always moving to greener ground.' },
  fertile: { name: 'Fertile', mods: { growthCost: -1 }, desc: 'Young come easily.' },
  thick_skinned: { name: 'Thick-shelled', mods: { tou: 2, spd: -1 }, desc: 'Each molt grows a heavier shell.' },
  nocturnal: { name: 'Nocturnal', mods: { cun: 1, damageReduce: 1 }, desc: 'Comes out only after dark.' },
  hibernator: { name: 'Hibernator', mods: { upkeep: -1, spd: -1 }, desc: 'Sleeps through the hungry months.' },
  territorial: { name: 'Territorial', mods: { str: 1, tou: 1, cha: -1 }, desc: 'This is yours. Everyone knows it.' },
  // Multicellular body plans
  // Symmetry, chosen when you become multicellular. It decides your body plan for good.
  radial_plan: { name: 'Radial Symmetry', mods: { tou: 1, maxPop: 2 }, desc: 'A body built around a center, like a starfish or jellyfish.' },
  streamlined_plan: { name: 'Bilateral Symmetry', mods: { spd: 2 }, desc: 'A left and a right, a head and a tail. Built to go forward.' },
  sessile_plan: { name: 'No Symmetry', mods: { foodPerTurn: 1, spd: -1 }, desc: 'A shapeless colony, like a sponge or slime mold.' },
  // Heritage traits, gained when leaving the Cell stage (like Spore's consequence traits).
  predator_lineage: { name: 'Predator Lineage', mods: { str: 1, huntBonus: 1 }, desc: 'Descended from hunters.', heritage: true },
  grazer_lineage: { name: 'Grazer Lineage', mods: { tou: 1, forageBonus: 1 }, desc: 'Descended from grazers.', heritage: true },
  adaptable_lineage: { name: 'Adaptable Lineage', mods: { cun: 1, spd: 1 }, desc: 'Descended from opportunists.', heritage: true },
  // Habitat
  land_pioneer: { name: 'Land Pioneer', mods: { spd: 1, exploreBonus: 1 }, desc: 'First of your kind to breathe air.' },
  deep_dweller: { name: 'Deep Dweller', mods: { tou: 1, maxPop: 1 }, desc: 'Your kind chose the endless sea.' },
  // Size (Age of Giants)
  // Size changes how big your herd can be and how much each member eats (see G.SIZES).
  // Body foundations, chosen at the start of the creature stage.
  skeleton_inner: { name: 'Inner Skeleton', foundation: 'skeleton', mods: {}, desc: 'Bones on the inside. Flexible, and the only frame that can carry a giant.' },
  skeleton_shell: { name: 'Outer Shell', foundation: 'skeleton', mods: { tou: 2, spd: -2 }, desc: 'Armor on the outside, like insects and crabs. Extra legs come cheap, but you must molt to grow, and you can never be a giant on land.' },
  skeleton_soft: { name: 'Soft Body', foundation: 'skeleton', mods: { cun: 2, tou: -2 }, desc: 'No bones at all, like octopuses and worms. You squeeze through gaps and hunters often miss you, but you are fragile.' },
  young_live: { name: 'Live Young', foundation: 'young', mods: { tou: 1, cha: 1 }, desc: 'Few babies, kept close and safe. No more than one is born each turn.' },
  young_eggs: { name: 'Eggs', foundation: 'young', mods: { maxPop: 1 }, desc: 'Big clutches: your numbers boom, twice as many hatch each turn, but eggs can be stolen.' },
  young_budding: { name: 'Budding', foundation: 'young', mods: { popPerTurn: 1, cha: -1 }, desc: 'New members bud off your body. Steady growth, but no family ties.' },
  blood_warm: { name: 'Warm Blood', foundation: 'blood', mods: { spd: 1, upkeep: 1 }, desc: 'Active in any weather, and cold seasons cost you no food, but you eat more.' },
  blood_cold: { name: 'Cold Blood', foundation: 'blood', mods: { upkeep: -1 }, desc: 'You eat less, but you are sluggish in the cold (−2 Speed, −1 Food in cold seasons and cold places) and quick in the heat (+1 Speed).' },
  giant: { name: 'Giant', mods: { str: 3, tou: 3, damageReduce: 1, spd: -1 }, desc: 'Enormous. Few things can hurt you, but your herds are small and hungry.' },
  mid_sized: { name: 'Mid-sized', mods: { str: 1, tou: 1, maxPop: 2 }, desc: 'Big enough to fight, small enough to hide.' },
  small_many: { name: 'Small and Many', mods: { spd: 2, cun: 1, growthCost: -1 }, desc: 'Tiny, quick and everywhere: huge herds, but every danger takes more of you.' },
  // Spark of Mind
  inquisitive: { name: 'Inquisitive Mind', mods: { insightPerTurn: 1 }, desc: 'Every question leads to another.' },
  cooperative: { name: 'Cooperative Mind', mods: { cha: 1, growthCost: -1 }, desc: 'Thinks in "we", not "I".' },
  calculating: { name: 'Calculating Mind', mods: { cun: 1, huntBonus: 1 }, desc: 'Plans three moves ahead.' },
};

// Body size. It scales max Population, how many members share one Food,
// and how many members a blow kills.
G.SIZES = {
  small: { name: 'Small', popMult: 1.5, eatDiv: 3, damageMult: 1.3 },
  mid: { name: 'Mid-sized', popMult: 1, eatDiv: 2, damageMult: 1 },
  giant: { name: 'Giant', popMult: 0.65, eatDiv: 1.75, damageMult: 1 },
};

// ======================= THE MIND =======================
// At the Spark of Mind your kind chooses one of five Paths of Mind (only the ones its body and
// history allow), and from then on earns Insight every turn to research the Mind tree.
// The tree is built from pieces, and you only ever see your own:
//   tier 1  roots      from your starting cell (your temperament)
//   tier 2  trunk      from land or sea, plus one "home" idea from your biome (land) or depth (sea)
//   tier 3  path       your Path of Mind's first ideas
//   tier 4  path       your Path's deeper ideas
//   tier 5  capstone   your Path's awakening on land or at sea; researching it brings the finale
// Fields: group, temper / habitat / home / path decide who sees it; req { innovation: [any of], tag };
// excludes: ideas that can never be learned alongside it; vision: helps you see more of the world map.

// Your starting archetype is your people's temperament, at every stage of the game.
G.TEMPERAMENTS = {
  predator: { id: 'hunter', name: 'The Hunter', desc: 'Wired to wait, watch and pounce.', rule: 'Great hunts and raids; other bands fear you.' },
  grazer: { id: 'herd', name: 'The Herd', desc: 'Wired for numbers, watchfulness and safety.', rule: 'Strength in numbers; hard to wipe out.' },
  symbiote: { id: 'bond', name: 'The Bond', desc: 'Wired for trust between kinds.', rule: 'Your partner species joins your band.' },
  parasite: { id: 'taker', name: 'The Taker', desc: 'Wired to live off others.', rule: 'Tribute, theft and stolen discoveries.' },
  colony: { id: 'many', name: 'The Many', desc: 'Wired to work as one.', rule: 'Castes early, and great numbers.' },
  mimic: { id: 'mask', name: 'The Mask', desc: 'Wired to deceive and to watch.', rule: 'Spies, lies and disguises.' },
  drifter: { id: 'wanderer', name: 'The Wanderer', desc: 'Wired to roam and remember.', rule: 'You move camp and scout far.' },
};

// The five Paths of Mind. `open(run)` says whether your body and history allow it.
G.PATHS = [
  { id: 'tool', name: 'Toolmakers', icon: '🪨', desc: 'Hands that shape the world: tools, then fire on land or vent-forging under the sea.', becomes: { land: 'a Tribe around the first fires', sea: 'a Shell Clan of tool-users' }, resource: { land: 'Fire', sea: 'Vent-heat' },
    why: 'Needs a part that can grasp: hands, arms, tentacles, a trunk or pincers' },
  { id: 'song', name: 'Singers', icon: '🎵', desc: 'Memory carried in songs, voices that cross whole valleys or oceans, and a gift for friendship.', becomes: { land: 'a Choir of singers', sea: 'a Pod that sings across oceans' }, resource: { land: 'Song', sea: 'Song' },
    why: 'Needs a voice or display part (echolocation, frills, plumage, great ears, a display tail) or Charisma 5' },
  { id: 'many', name: 'Many Minds', icon: '🐙', desc: 'A brain in every arm: camouflage, speaking in color and learning by watching.', becomes: { land: 'a Den of clever climbers', sea: 'a Den of deep-sea minds' }, resource: { land: 'Light', sea: 'Light' },
    why: 'Needs a soft or radial body, color-changing skin, tentacles, or Cunning 7' },
  { id: 'swarm', name: 'The Swarm', icon: '🐜', desc: 'Huge numbers that share one mind and raise giant buildings.', becomes: { land: 'a Hive with a growing mound', sea: 'a living Reef-colony' }, resource: { land: 'Brood', sea: 'Brood' },
    why: 'Needs a shapeless or radial body, a small and numerous kind, eggs or budding, or the Colony archetype' },
  { id: 'garden', name: 'Gardeners', icon: '🌱', desc: 'Farming other living things, and technology that is grown, not built.', becomes: { land: 'a Grove of fungus farmers', sea: 'a Kelp Garden' }, resource: { land: 'Growth', sea: 'Growth' },
    why: 'Needs a plant diet, a symbiont part, a plant part, or the Symbiote archetype' },
];
G.SONG_PARTS = ['echolocation', 'display_frill', 'lumen_sail', 'display_tail', 'bright_plumage', 'true_plumage', 'tail_feathers', 'great_ears', 'sail_fin', 'great_sail', 'rattle_tail', 'color_skin', 'color_storm'];
G.MANY_PARTS = ['color_skin', 'color_storm', 'mottled_skin', 'kelp_camouflage', 'vanishing_skin', 'ink_glands', 'fore_tentacles', 'sea_tentacles', 'sucker_arms', 'clever_arms', 'boneless_f'];
G.GARDEN_PARTS = ['moss_garden', 'kelp_garden', 'lichen_hide', 'algae_chamber', 'vent_bacteria', 'living_reef', 'anemone_crown'];

const I = (o) => o;
G.INNOVATIONS = [
  // ----- Roots: your temperament -----
  I({ id: 'patience', group: 'root', temper: 'hunter', tier: 1, name: 'Patience', cost: 6, mods: { cun: 1, huntBonus: 1 }, desc: 'Wait. Wait. Now.' }),
  I({ id: 'reading_prey', group: 'root', temper: 'hunter', tier: 1, name: 'Reading Prey', cost: 6, mods: { cun: 1, spd: 1 }, desc: 'Know which one is weak before it knows itself.' }),
  I({ id: 'ambush', group: 'root', temper: 'hunter', tier: 1, name: 'Ambush', cost: 6, mods: { str: 1, huntBonus: 1 }, desc: 'Strike from where they never look.' }),
  I({ id: 'alarm_calls', group: 'root', temper: 'herd', tier: 1, name: 'Alarm Calls', cost: 6, mods: { tou: 1, cha: 1 }, desc: 'A shout that means "run".' }),
  I({ id: 'herd_memory', group: 'root', temper: 'herd', tier: 1, name: 'Herd Memory', cost: 6, mods: { cun: 1, exploreBonus: 1 }, vision: true, desc: 'The old ones remember where the water was in the last drought.' }),
  I({ id: 'safe_ground', group: 'root', temper: 'herd', tier: 1, name: 'Safe Ground', cost: 6, mods: { tou: 2 }, desc: 'Young in the middle, strongest on the outside.' }),
  I({ id: 'trust', group: 'root', temper: 'bond', tier: 1, name: 'Trust', cost: 6, mods: { cha: 2 }, desc: 'Another kind can be family.' }),
  I({ id: 'shared_signals', group: 'root', temper: 'bond', tier: 1, name: 'Shared Signals', cost: 6, mods: { cha: 1, cun: 1 }, desc: 'A sign your partners understand too.' }),
  I({ id: 'gifts', group: 'root', temper: 'bond', tier: 1, name: 'Gifts', cost: 6, mods: { cha: 1, foodPerTurn: 1 }, desc: 'Food given freely comes back twice.' }),
  I({ id: 'host_reading', group: 'root', temper: 'taker', tier: 1, name: 'Reading Hosts', cost: 6, mods: { cun: 1, cha: 1 }, desc: 'Know what they want, and give them just enough.' }),
  I({ id: 'exploiting', group: 'root', temper: 'taker', tier: 1, name: 'Exploiting', cost: 6, mods: { cun: 1, foodPerTurn: 1 }, desc: 'Why gather what someone else has gathered?' }),
  I({ id: 'plain_sight', group: 'root', temper: 'taker', tier: 1, name: 'Hiding in Plain Sight', cost: 6, mods: { cun: 2 }, desc: 'The best hiding place is right next to them.' }),
  I({ id: 'division_of_labor', group: 'root', temper: 'many', tier: 1, name: 'Division of Labor', cost: 6, mods: { tou: 1, foodPerTurn: 1 }, desc: 'Some gather, some guard, some breed.' }),
  I({ id: 'chemical_trails', group: 'root', temper: 'many', tier: 1, name: 'Chemical Trails', cost: 6, mods: { cun: 1, exploreBonus: 1 }, vision: true, desc: 'Follow the scent the others left.' }),
  I({ id: 'common_will', group: 'root', temper: 'many', tier: 1, name: 'The Common Will', cost: 6, mods: { maxPop: 2 }, desc: 'No one decides. Everyone knows.' }),
  I({ id: 'deception', group: 'root', temper: 'mask', tier: 1, name: 'Deception', cost: 6, mods: { cun: 2 }, desc: 'Look like one thing, be another.' }),
  I({ id: 'watching', group: 'root', temper: 'mask', tier: 1, name: 'Watching', cost: 6, mods: { cun: 1, exploreBonus: 1 }, vision: true, desc: 'Learn their habits before they learn yours.' }),
  I({ id: 'imitation', group: 'root', temper: 'mask', tier: 1, name: 'Imitation', cost: 6, mods: { cha: 1, cun: 1 }, desc: 'Do what they do, and they will think you are one of them.' }),
  I({ id: 'mental_maps', group: 'root', temper: 'wanderer', tier: 1, name: 'Mental Maps', cost: 6, mods: { cun: 1, exploreBonus: 1 }, vision: true, desc: 'Every path you ever walked, remembered.' }),
  I({ id: 'curiosity', group: 'root', temper: 'wanderer', tier: 1, name: 'Curiosity', cost: 6, mods: { insightPerTurn: 1 }, desc: 'What is over that hill?' }),
  I({ id: 'season_sense', group: 'root', temper: 'wanderer', tier: 1, name: 'Season Sense', cost: 6, mods: { foodCap: 3, foodPerTurn: 1 }, desc: 'Know when to leave before the food runs out.' }),

  // ----- Trunk: land or sea -----
  I({ id: 'fire_watching', group: 'trunk', habitat: 'land', tier: 2, name: 'Watching Fire', cost: 10, mods: { cun: 1, tou: 1 }, desc: 'Lightning-struck grass teaches respect, and curiosity.' }),
  I({ id: 'far_sight', group: 'trunk', habitat: 'land', tier: 2, name: 'Far Sight', cost: 10, mods: { cun: 1, exploreBonus: 1 }, vision: true, desc: 'Climb high and look out over the whole land.' }),
  I({ id: 'weather_sense', group: 'trunk', habitat: 'land', tier: 2, name: 'Weather Sense', cost: 10, mods: { foodCap: 4, forageBonus: 1 }, desc: 'Smell the rain a day before it comes.' }),
  I({ id: 'current_memory', group: 'trunk', habitat: 'sea', tier: 2, name: 'Current Memory', cost: 10, mods: { spd: 1, exploreBonus: 1 }, vision: true, desc: 'Every current is a road, and you know them all.' }),
  I({ id: 'depth_sense', group: 'trunk', habitat: 'sea', tier: 2, name: 'Depth Sense', cost: 10, mods: { tou: 1, cun: 1 }, desc: 'Feel how deep you are by the weight of the water.' }),
  I({ id: 'tide_reckoning', group: 'trunk', habitat: 'sea', tier: 2, name: 'Tide Reckoning', cost: 10, mods: { foodCap: 4, forageBonus: 1 }, desc: 'Know when the sea gives and when it takes.' }),
  // Home: one idea from where you live (land biome or sea depth). Known ones stay if you move.
  I({ id: 'open_country', group: 'home', home: 'plains', tier: 2, name: 'Open Country', cost: 10, mods: { spd: 1, cha: 1 }, desc: 'The plains teach you to see far and run together.' }),
  I({ id: 'canopy_minds', group: 'home', home: 'jungle', tier: 2, name: 'Canopy Minds', cost: 10, mods: { cun: 2 }, desc: 'A world of branches is a world of choices.' }),
  I({ id: 'water_memory', group: 'home', home: 'desert', tier: 2, name: 'Water Memory', cost: 10, mods: { tou: 1, foodCap: 3 }, desc: 'Remember every spring in the desert.' }),
  I({ id: 'long_winter', group: 'home', home: 'tundra', tier: 2, name: 'The Long Winter', cost: 10, mods: { tou: 2 }, desc: 'Plan for the cold, or die in it.' }),
  I({ id: 'mud_lore', group: 'home', home: 'swamp', tier: 2, name: 'Mud Lore', cost: 10, mods: { forageBonus: 2 }, desc: 'The swamp hides a feast, if you know where to dig.' }),
  I({ id: 'tidepool_lore', group: 'home', home: 'shore', tier: 2, name: 'Tidepool Lore', cost: 10, mods: { cun: 1, forageBonus: 1 }, desc: 'Between land and sea, everything is a puzzle.' }),
  I({ id: 'sunlit_minds', group: 'home', home: 'shallows', tier: 2, name: 'Sunlit Minds', cost: 10, mods: { cha: 1, forageBonus: 1 }, desc: 'Bright water, bright colors, many eyes watching.' }),
  I({ id: 'reef_lore', group: 'home', home: 'reef', tier: 2, name: 'Reef Lore', cost: 10, mods: { cun: 1, tou: 1 }, desc: 'Every crack in the reef has a story.' }),
  I({ id: 'open_water_minds', group: 'home', home: 'open', tier: 2, name: 'Open Water', cost: 10, mods: { spd: 2 }, desc: 'Nowhere to hide, so think fast.' }),
  I({ id: 'twilight_eyes', group: 'home', home: 'twilight', tier: 2, name: 'Twilight Eyes', cost: 10, mods: { cun: 2 }, desc: 'Half-light sharpens the mind.' }),
  I({ id: 'living_light', group: 'home', home: 'abyss', tier: 2, name: 'Living Light', cost: 10, mods: { cun: 1, cha: 1 }, desc: 'In the dark, a light is a word.' }),

  // ----- Toolmakers -----
  I({ id: 'first_tools', group: 'path', path: 'tool', tier: 3, name: 'First Tools', cost: 12, mods: { str: 1, forageBonus: 1 }, desc: 'A stick to dig, a stone to crack.' }),
  I({ id: 'teaching', group: 'path', path: 'tool', tier: 3, name: 'Teaching the Young', cost: 12, mods: { insightPerTurn: 1 }, desc: 'Each generation starts where the last one stopped.' }),
  I({ id: 'crafting', group: 'path', path: 'tool', tier: 4, name: { land: 'Shaped Stone', sea: 'Shell Craft' }, cost: 16, mods: { str: 2, tou: 1 }, req: { innovation: ['first_tools'] }, desc: 'Not just a tool: a tool made to be a tool.' }),
  I({ id: 'shelters', group: 'path', path: 'tool', tier: 4, name: 'Shelters', cost: 16, mods: { tou: 1, maxPop: 3 }, req: { innovation: ['first_tools', 'teaching'] }, desc: 'Walls against the world.' }),
  I({ id: 'tool_cap', group: 'cap', path: 'tool', tier: 5, name: { land: 'Taming Fire', sea: 'The Vent Forge' }, cost: 20, mods: { str: 1, cun: 1 }, req: { innovation: ['crafting', 'shelters'] }, desc: { land: 'Carry the fire home. This ends the Creature stage.', sea: 'Carry the heat of the vents. This ends the Creature stage.' } }),
  // ----- Singers -----
  I({ id: 'call_answer', group: 'path', path: 'song', tier: 3, name: 'Call and Answer', cost: 12, mods: { cha: 2 }, desc: 'One calls, and the whole group replies.' }),
  I({ id: 'long_memory', group: 'path', path: 'song', tier: 3, name: 'Long Memory', cost: 12, mods: { insightPerTurn: 1 }, desc: 'Songs remember what no single mind could.' }),
  I({ id: 'song_maps', group: 'path', path: 'song', tier: 4, name: 'Song-Maps', cost: 16, mods: { spd: 1, exploreBonus: 2 }, vision: true, req: { innovation: ['call_answer', 'long_memory'] }, desc: 'A song that is a map of the whole world.' }),
  I({ id: 'chorus', group: 'path', path: 'song', tier: 4, name: 'Chorus', cost: 16, mods: { cha: 2, tou: 1 }, req: { innovation: ['call_answer'] }, desc: 'Many voices, one song, one people.' }),
  I({ id: 'song_cap', group: 'cap', path: 'song', tier: 5, name: { land: 'The Great Song', sea: 'The Ocean Song' }, cost: 20, mods: { cha: 2 }, req: { innovation: ['song_maps', 'chorus'] }, desc: 'A song that holds everything your kind knows. This ends the Creature stage.' }),
  // ----- Many Minds -----
  I({ id: 'arm_brains', group: 'path', path: 'many', tier: 3, name: 'A Brain in Every Arm', cost: 12, mods: { cun: 2 }, desc: 'Every limb thinks for itself.' }),
  I({ id: 'color_talk', group: 'path', path: 'many', tier: 3, name: 'Color-Talk', cost: 12, mods: { cha: 2 }, desc: 'Ripples of color that say more than words.' }),
  I({ id: 'shapeshifting', group: 'path', path: 'many', tier: 4, name: 'Shapeshifting', cost: 16, mods: { cun: 1, damageReduce: 1 }, req: { innovation: ['arm_brains'] }, desc: 'Become a rock, a weed, a predator.' }),
  I({ id: 'watch_learn', group: 'path', path: 'many', tier: 4, name: 'Watch and Learn', cost: 16, mods: { cun: 1, insightPerTurn: 1 }, req: { innovation: ['arm_brains', 'color_talk'] }, desc: 'See it done once, and you can do it.' }),
  I({ id: 'many_cap', group: 'cap', path: 'many', tier: 5, name: 'Minds That Meet', cost: 20, mods: { cun: 2 }, req: { innovation: ['shapeshifting', 'watch_learn'] }, desc: 'Clever loners who choose to share their dens. This ends the Creature stage.' }),
  // ----- The Swarm -----
  I({ id: 'castes', group: 'path', path: 'swarm', tier: 3, name: 'Castes', cost: 12, mods: { maxPop: 3 }, desc: 'Workers, soldiers, breeders: each born to its task.' }),
  I({ id: 'pheromone_paths', group: 'path', path: 'swarm', tier: 3, name: 'Pheromone Paths', cost: 12, mods: { cun: 1, exploreBonus: 1 }, vision: true, desc: 'A road of scent that every member follows.' }),
  I({ id: 'great_mound', group: 'path', path: 'swarm', tier: 4, name: { land: 'The Great Mound', sea: 'The Living Reef' }, cost: 16, mods: { tou: 2, maxPop: 2 }, req: { innovation: ['castes'] }, desc: 'A home that grows with every generation.' }),
  I({ id: 'one_will', group: 'path', path: 'swarm', tier: 4, name: 'One Will', cost: 16, mods: { str: 1, tou: 1, damageReduce: 1 }, req: { innovation: ['castes', 'pheromone_paths'] }, desc: 'A thousand bodies move as one.' }),
  I({ id: 'swarm_cap', group: 'cap', path: 'swarm', tier: 5, name: 'The Hive Mind', cost: 20, mods: { tou: 1, cun: 1 }, req: { innovation: ['great_mound', 'one_will'] }, desc: 'Many bodies, one mind. This ends the Creature stage.' }),
  // ----- Gardeners -----
  I({ id: 'tending', group: 'path', path: 'garden', tier: 3, name: 'Tending', cost: 12, mods: { forageBonus: 2 }, desc: 'Pull the weeds, and the good plants grow.' }),
  I({ id: 'seed_memory', group: 'path', path: 'garden', tier: 3, name: 'Seed Memory', cost: 12, mods: { foodCap: 5, foodPerTurn: 1 }, desc: 'Remember where the good ones sprouted.' }),
  I({ id: 'herding', group: 'path', path: 'garden', tier: 4, name: 'Herding', cost: 16, mods: { foodPerTurn: 1, cha: 1 }, req: { innovation: ['tending', 'seed_memory'] }, desc: 'Keep other creatures, and they keep you.' }),
  I({ id: 'living_tools', group: 'path', path: 'garden', tier: 4, name: 'Living Tools', cost: 16, mods: { cun: 1, tou: 1, forageBonus: 1 }, req: { innovation: ['tending'] }, desc: 'Grow the thing you need instead of making it.' }),
  I({ id: 'garden_cap', group: 'cap', path: 'garden', tier: 5, name: { land: 'The First Harvest', sea: 'The First Kelp Fields' }, cost: 20, mods: { forageBonus: 1, cha: 1 }, req: { innovation: ['herding', 'living_tools'] }, desc: 'You no longer find food. You grow it. This ends the Creature stage.' }),
];

// ======================= UPDATE 17: THE MIND TREE, GROWN FROM YOUR CHOICES =======================
// New bands of the tree (shown as rows in this order: Roots, Home, Body, Memories, Path, Path,
// Awakening, Beyond the Gate):
//   body    from what your body is (talents, diet, size, foundations, symmetry): `when` says which
//   memory  grafted by what happened to your lineage (`when: { memory }`, see G.MEMORIES)
//   path    more Path ideas, with forks (`excludes`) and partial prerequisites (`req.some`, `req.n`)
//   beyond  Beyond the Gate: costly ideas that must be learned before your Awakening; their
//           `inherit` mods carry on into every later stage.
// `lean` is the idea's leaning: 'peace' (Peaceful), 'guard' (Territorial) or 'war' (Warmongering).
// `rule` is an awakening that changes how the game plays (see G.MIND_RULES).
G.MIND_RULES = {
  outwit: 'Strength checks can use your Cunning instead, if it is higher.',
  charm_wit: 'Charm checks can use your Cunning instead, if it is higher.',
  swift_strike: 'Strength checks can use your Speed instead, if it is higher.',
  reroll: 'Once per stage, a failed check is tried again.',
  hazard_sense: 'Disasters find you 40% less often.',
  know_foe: 'Checks against another species are 2 easier.',
  no_rot: 'Your stored meat rots half as fast.',
  last_refuge: 'When you are down to a quarter of your comfortable size, every loss is halved.',
  calm_presence: 'Wary and hostile species warm to you a little every turn.',
  insight_spark: 'Every check you pass brings +2 Insight.',
};
G.LEAN_NAMES = { peace: 'Peaceful', guard: 'Territorial', war: 'Warmongering' };
G.LEAN_ICONS = { peace: '🕊️', guard: '🛡️', war: '⚔️' };
// Leanings of the ideas that came before Update 17.
G.OLD_LEANS = {
  patience: 'guard', reading_prey: 'war', ambush: 'war', alarm_calls: 'guard', herd_memory: 'peace', safe_ground: 'guard', trust: 'peace', shared_signals: 'peace', gifts: 'peace',
  host_reading: 'guard', exploiting: 'war', plain_sight: 'guard', division_of_labor: 'guard', common_will: 'peace', deception: 'war', imitation: 'peace', season_sense: 'peace',
  fire_watching: 'guard', long_winter: 'guard', open_country: 'peace', first_tools: 'guard', crafting: 'war', shelters: 'guard', call_answer: 'peace', chorus: 'peace',
  shapeshifting: 'guard', castes: 'guard', one_will: 'war', great_mound: 'guard', tending: 'peace', herding: 'peace', living_tools: 'peace',
};
// What can happen to your lineage in the Creature stage, and the memory it leaves in the Mind.
G.MEMORIES = {
  mem_flood: 'You lived through a flood or a great storm.',
  mem_fire: 'You lived through a wildfire.',
  mem_cold: 'You lived through a killing cold.',
  mem_drought: 'You lived through a drought or a famine.',
  mem_plague: 'You lived through a sickness.',
  mem_quake: 'You lived through a stampede, a sandstorm or an eruption.',
  mem_victory: 'You beat another species in a fight.',
  mem_hunt: 'You ran another species down.',
  mem_flight: 'You escaped by running.',
  mem_friendship: 'You won another species over.',
  mem_near_end: 'You were almost wiped out.',
  mem_migration: 'You left your home for a new land.',
  mem_extinction: 'A species died out while you lived.',
  mem_ally: 'Another species became your ally.',
  mem_nemesis: 'Another species became your enemy.',
};
G.HAZARD_MEMORY = { flood: 'mem_flood', storm: 'mem_flood', fire: 'mem_fire', cold: 'mem_cold', drought: 'mem_drought', sickness: 'mem_plague', quake: 'mem_quake', dust: 'mem_quake' };
G.INNOVATIONS.push(
  // ----- Body branches: what your body is -----
  I({ id: 'deft_hands', group: 'body', when: { talent: 'hands' }, tier: 2, name: 'Deft Hands', cost: 10, mods: { cun: 1, forageBonus: 1 }, lean: 'peace', desc: 'Hands that untie, open and mend.' }),
  I({ id: 'grip_throw', group: 'body', when: { talent: 'hands' }, tier: 2, name: 'Grip and Throw', cost: 10, mods: { str: 1, huntBonus: 1 }, lean: 'war', desc: 'A stone thrown is a tooth that flies.' }),
  I({ id: 'mimic_calls', group: 'body', when: { talent: 'voice' }, tier: 2, name: 'Mimic Calls', cost: 10, mods: { cha: 1 }, rule: 'charm_wit', lean: 'peace', desc: 'Sound like a friend, and be treated like one.' }),
  I({ id: 'war_cry', group: 'body', when: { talent: 'voice' }, tier: 2, name: 'War Cry', cost: 10, mods: { str: 1, cha: 1 }, lean: 'war', desc: 'A sound that makes the bravest freeze.' }),
  I({ id: 'signal_lights', group: 'body', when: { talent: 'glow' }, tier: 2, name: 'Signal Lights', cost: 10, mods: { cha: 2 }, lean: 'peace', desc: 'Light that says "here, safe, come".' }),
  I({ id: 'lure_lights', group: 'body', when: { talent: 'glow' }, tier: 2, name: 'Lure Lights', cost: 10, mods: { huntBonus: 2 }, lean: 'war', desc: 'Light that says "come closer".' }),
  I({ id: 'warning_venom', group: 'body', when: { talent: 'venom' }, tier: 2, name: 'Warning Colors', cost: 10, mods: { tou: 1, cha: 1 }, excludes: ['killing_venom'], lean: 'guard', desc: 'Everyone knows not to touch you. Nobody has to learn the hard way.' }),
  I({ id: 'killing_venom', group: 'body', when: { talent: 'venom' }, tier: 2, name: 'Killing Venom', cost: 10, mods: { str: 2 }, lean: 'war', desc: 'One bite, and it is over.' }),
  I({ id: 'shell_wall', group: 'body', when: { talent: 'armor' }, tier: 2, name: 'Shell Wall', cost: 10, mods: { tou: 2 }, lean: 'guard', desc: 'Back to back, armour out. Nothing gets through.' }),
  I({ id: 'battering_ram', group: 'body', when: { talent: 'armor' }, tier: 2, name: 'Battering Ram', cost: 10, mods: { str: 1, tou: 1 }, lean: 'war', desc: 'Armour is a weapon too.' }),
  I({ id: 'sky_watch', group: 'body', when: { talent: 'wings' }, tier: 2, name: 'Sky Watch', cost: 10, mods: { exploreBonus: 1 }, vision: true, rule: 'hazard_sense', lean: 'guard', desc: 'From above, you see the storm before it comes.' }),
  I({ id: 'stoop', group: 'body', when: { talent: 'wings' }, tier: 2, name: 'The Stoop', cost: 10, mods: { huntBonus: 2 }, rule: 'swift_strike', lean: 'war', desc: 'Fold the wings, and fall like a stone.' }),
  I({ id: 'far_watchers', group: 'body', when: { talent: 'eyes' }, tier: 2, name: 'Far Watchers', cost: 10, mods: { cun: 1 }, vision: true, lean: 'guard', desc: 'Nothing moves on the horizon without your knowing.' }),
  I({ id: 'reading_eyes', group: 'body', when: { talent: 'eyes' }, tier: 2, name: 'Reading Eyes', cost: 10, mods: { cha: 1, cun: 1 }, lean: 'peace', desc: 'See what another creature feels before it acts.' }),
  I({ id: 'flight_instinct', group: 'body', when: { talent: 'speed' }, tier: 2, name: 'Flight Instinct', cost: 10, mods: { spd: 1 }, rule: 'last_refuge', lean: 'peace', desc: 'When it goes wrong, scatter, and live.' }),
  I({ id: 'run_down', group: 'body', when: { talent: 'speed' }, tier: 2, name: 'Run Them Down', cost: 10, mods: { spd: 1, huntBonus: 1 }, lean: 'war', desc: 'Nothing outruns you for long.' }),
  I({ id: 'living_partners', group: 'body', when: { keyword: 'symbiont' }, tier: 2, name: 'Living Partners', cost: 10, mods: { foodPerTurn: 1, cha: 1 }, lean: 'peace', desc: 'The life you carry looks after you, and you after it.' }),
  I({ id: 'grazing_lore', group: 'body', when: { diet: 'herb' }, tier: 2, name: 'Grazing Lore', cost: 10, mods: { forageBonus: 2 }, lean: 'peace', desc: 'Which leaves heal, which feed, which kill.' }),
  I({ id: 'blood_lore', group: 'body', when: { diet: 'carn' }, tier: 2, name: 'Meat That Keeps', cost: 10, mods: { huntBonus: 1 }, rule: 'no_rot', lean: 'war', desc: 'Bury it, dry it, guard it.' }),
  I({ id: 'take_anything', group: 'body', when: { diet: 'omni' }, tier: 2, name: 'Take Anything', cost: 10, mods: { forageBonus: 1, huntBonus: 1 }, lean: 'guard', desc: 'Whatever there is, you can eat.' }),
  I({ id: 'gentle_giants', group: 'body', when: { trait: 'giant' }, tier: 2, name: 'Gentle Giants', cost: 10, mods: { cha: 2 }, excludes: ['tyrants'], lean: 'peace', desc: 'So big that nothing needs to fear you, if you are kind.' }),
  I({ id: 'tyrants', group: 'body', when: { trait: 'giant' }, tier: 2, name: 'Tyrants', cost: 10, mods: { str: 2 }, rule: 'know_foe', lean: 'war', desc: 'So big that everything fears you, and should.' }),
  I({ id: 'numbers', group: 'body', when: { trait: 'small_many' }, tier: 2, name: 'Safety in Numbers', cost: 10, mods: { maxPop: 2 }, lean: 'guard', desc: 'There are always more of you.' }),
  I({ id: 'scatter', group: 'body', when: { trait: 'small_many' }, tier: 2, name: 'Scatter', cost: 10, mods: { spd: 1 }, rule: 'last_refuge', lean: 'peace', desc: 'A hundred directions at once. They cannot catch you all.' }),
  I({ id: 'balanced_body', group: 'body', when: { trait: 'mid_sized' }, tier: 2, name: 'Balanced Body', cost: 10, mods: { str: 1, spd: 1 }, lean: 'guard', desc: 'Not the biggest, not the fastest: always good enough.' }),
  I({ id: 'strong_frame', group: 'body', when: { trait: 'skeleton_inner' }, tier: 2, name: 'Strong Frame', cost: 10, mods: { str: 1, tou: 1 }, lean: 'guard', desc: 'Bones that carry you anywhere.' }),
  I({ id: 'living_fortress', group: 'body', when: { trait: 'skeleton_shell' }, tier: 2, name: 'Living Fortress', cost: 10, mods: { tou: 1, damageReduce: 1 }, lean: 'guard', desc: 'Your home is on your back, and it does not break.' }),
  I({ id: 'squeeze_through', group: 'body', when: { trait: 'skeleton_soft' }, tier: 2, name: 'Squeeze Through', cost: 10, mods: { spd: 1 }, rule: 'outwit', lean: 'peace', desc: 'Any crack is a door.' }),
  I({ id: 'long_childhood', group: 'body', when: { trait: 'young_live' }, tier: 2, name: 'Long Childhood', cost: 10, mods: { insightPerTurn: 1 }, lean: 'peace', desc: 'Young that stay long enough to learn everything.' }),
  I({ id: 'hidden_clutches', group: 'body', when: { trait: 'young_eggs' }, tier: 2, name: 'Hidden Clutches', cost: 10, mods: { maxPop: 2 }, lean: 'guard', desc: 'Eggs where no thief would ever look.' }),
  I({ id: 'many_selves', group: 'body', when: { trait: 'young_budding' }, tier: 2, name: 'Many Selves', cost: 10, mods: { popPerTurn: 1 }, lean: 'peace', desc: 'Every one of you is all of you.' }),
  I({ id: 'tireless', group: 'body', when: { trait: 'blood_warm' }, tier: 2, name: 'Tireless', cost: 10, mods: { spd: 1, exploreBonus: 1 }, lean: 'war', desc: 'Warm blood keeps going long after the cold ones stop.' }),
  I({ id: 'patient_blood', group: 'body', when: { trait: 'blood_cold' }, tier: 2, name: 'Patient Blood', cost: 10, mods: { cun: 1, foodCap: 3 }, lean: 'guard', desc: 'Lie still for days, and wait for the moment.' }),
  I({ id: 'all_sides', group: 'body', when: { sym: 'radial' }, tier: 2, name: 'Every Side a Front', cost: 10, mods: { cun: 1, tou: 1 }, lean: 'guard', desc: 'Nothing can come at you from behind.' }),
  I({ id: 'shared_body', group: 'body', when: { sym: 'colonial' }, tier: 2, name: 'One Body, Many Lives', cost: 10, mods: { tou: 1, maxPop: 2 }, lean: 'peace', desc: 'Lose a part, and the whole lives on.' }),

  // ----- Memories: what happened to your lineage -----
  I({ id: 'higher_ground', group: 'memory', when: { memory: 'mem_flood' }, tier: 2, name: 'Higher Ground', cost: 8, mods: { tou: 1 }, rule: 'hazard_sense', lean: 'guard', desc: 'When the sky darkens, you already know where to go.' }),
  I({ id: 'fire_memory', group: 'memory', when: { memory: 'mem_fire' }, tier: 2, name: 'What the Fire Took', cost: 8, mods: { cun: 1, tou: 1 }, lean: 'guard', desc: 'You remember the smell of smoke, and you run before anyone else.' }),
  I({ id: 'cold_memory', group: 'memory', when: { memory: 'mem_cold' }, tier: 2, name: 'The Year Without Summer', cost: 8, mods: { foodCap: 4, tou: 1 }, lean: 'guard', desc: 'Store, and store, and store again.' }),
  I({ id: 'hunger_memory', group: 'memory', when: { memory: 'mem_drought' }, tier: 2, name: 'Hunger Remembered', cost: 8, mods: { foodCap: 3, forageBonus: 1 }, lean: 'peace', desc: 'You never again let the larder run empty.' }),
  I({ id: 'fever_memory', group: 'memory', when: { memory: 'mem_plague' }, tier: 2, name: 'The Fever Years', cost: 8, mods: { tou: 2 }, lean: 'peace', desc: 'The ones who lived passed on something stronger.' }),
  I({ id: 'ground_memory', group: 'memory', when: { memory: 'mem_quake' }, tier: 2, name: 'When the Ground Moved', cost: 8, mods: { spd: 1, tou: 1 }, lean: 'guard', desc: 'Feel it in your feet, and be gone before it comes.' }),
  I({ id: 'victory_songs', group: 'memory', when: { memory: 'mem_victory' }, tier: 2, name: 'Remembered Victories', cost: 8, mods: { str: 1, cha: 1 }, lean: 'war', desc: 'Once, you won. You can win again.' }),
  I({ id: 'great_hunts', group: 'memory', when: { memory: 'mem_hunt' }, tier: 2, name: 'The Great Hunts', cost: 8, mods: { huntBonus: 2 }, lean: 'war', desc: 'Stories of the chase, told to every hungry young one.' }),
  I({ id: 'run_and_live', group: 'memory', when: { memory: 'mem_flight' }, tier: 2, name: 'Run and Live', cost: 8, mods: { spd: 1 }, rule: 'last_refuge', lean: 'peace', desc: 'Pride dies. Runners live.' }),
  I({ id: 'old_friends', group: 'memory', when: { memory: 'mem_friendship' }, tier: 2, name: 'Old Friends', cost: 8, mods: { cha: 2 }, lean: 'peace', desc: 'You remember who was kind, and you are kind back.' }),
  I({ id: 'the_few', group: 'memory', when: { memory: 'mem_near_end' }, tier: 2, name: 'The Few Who Lived', cost: 8, mods: { tou: 1 }, rule: 'reroll', lean: 'guard', desc: 'You came so close to the end that you will never let it happen again.' }),
  I({ id: 'long_walk', group: 'memory', when: { memory: 'mem_migration' }, tier: 2, name: 'The Long Walk', cost: 8, mods: { exploreBonus: 1, spd: 1 }, vision: true, lean: 'peace', desc: 'You know that there is always somewhere else.' }),
  I({ id: 'the_lost', group: 'memory', when: { memory: 'mem_extinction' }, tier: 2, name: 'Remember the Lost', cost: 8, mods: { insightPerTurn: 1 }, rule: 'insight_spark', lean: 'peace', desc: 'Whole kinds can vanish. You will not forget them, or how they fell.' }),
  I({ id: 'bonds_kinds', group: 'memory', when: { memory: 'mem_ally' }, tier: 2, name: 'Bonds Between Kinds', cost: 8, mods: { foodPerTurn: 1 }, rule: 'calm_presence', lean: 'peace', desc: 'Another kind stood with you. Others might too.' }),
  I({ id: 'know_enemy', group: 'memory', when: { memory: 'mem_nemesis' }, tier: 2, name: 'Know Your Enemy', cost: 8, mods: { cun: 1 }, rule: 'know_foe', lean: 'war', desc: 'Every hunt they made against you, remembered and understood.' }),

  // ----- Path forks and deeper ideas -----
  // Toolmakers
  I({ id: 'stone_points', group: 'path', path: 'tool', tier: 3, name: 'Stone Points', cost: 12, mods: { str: 2, huntBonus: 1 }, excludes: ['digging_sticks'], lean: 'war', desc: 'A sharp edge on the end of a stick.' }),
  I({ id: 'digging_sticks', group: 'path', path: 'tool', tier: 3, name: 'Digging Sticks', cost: 12, mods: { forageBonus: 2, foodCap: 3 }, lean: 'peace', desc: 'Roots, grubs and water, from under the ground.' }),
  I({ id: 'trade_tools', group: 'path', path: 'tool', tier: 4, name: 'Tools for Trade', cost: 16, mods: { cha: 2 }, rule: 'charm_wit', excludes: ['war_clubs'], req: { innovation: ['first_tools', 'digging_sticks'] }, lean: 'peace', desc: 'Make one more than you need, and give it away.' }),
  I({ id: 'war_clubs', group: 'path', path: 'tool', tier: 4, name: 'War Clubs', cost: 16, mods: { str: 2 }, rule: 'outwit', req: { innovation: ['first_tools', 'stone_points'] }, lean: 'war', desc: 'The first tool made only for hitting someone.' }),
  I({ id: 'tool_memory', group: 'path', path: 'tool', tier: 4, name: 'The Way It Is Done', cost: 16, mods: { insightPerTurn: 1, cun: 1 }, req: { some: ['first_tools', 'teaching', 'stone_points', 'digging_sticks'], n: 2 }, lean: 'guard', desc: 'Every tool has a right way to be made, and everyone knows it.' }),
  I({ id: 'tool_beyond_hearth', group: 'beyond', path: 'tool', tier: 6, name: { land: 'Keepers of the Flame', sea: 'Keepers of the Vent' }, cost: 34, mods: { cun: 1, tou: 1 }, inherit: { specialPerTurn: 1, discoveryCost: -10 }, req: { some: ['crafting', 'shelters', 'trade_tools', 'war_clubs', 'tool_memory'], n: 3 }, lean: 'guard', desc: 'Your people will be born knowing how to keep the heat alive.' }),
  I({ id: 'tool_beyond_edge', group: 'beyond', path: 'tool', tier: 6, name: 'The Sharpest Edge', cost: 34, mods: { str: 2 }, inherit: { str: 2, tou: 1 }, req: { some: ['crafting', 'war_clubs', 'stone_points'], n: 2 }, lean: 'war', desc: 'Edges so fine your people will carry the art for ever.' }),
  // Singers
  I({ id: 'lullabies', group: 'path', path: 'song', tier: 3, name: 'Lullabies', cost: 12, mods: { cha: 1, popPerTurn: 1 }, excludes: ['battle_hymns'], lean: 'peace', desc: 'A song that makes the young sleep, and the old remember.' }),
  I({ id: 'battle_hymns', group: 'path', path: 'song', tier: 3, name: 'Battle Hymns', cost: 12, mods: { str: 1, cha: 1 }, lean: 'war', desc: 'A song you can march to.' }),
  I({ id: 'songs_of_others', group: 'path', path: 'song', tier: 4, name: 'Songs of Other Kinds', cost: 16, mods: { cha: 2 }, rule: 'calm_presence', req: { innovation: ['call_answer', 'lullabies'] }, lean: 'peace', desc: 'Learn their songs, and sing them back.' }),
  I({ id: 'singing_borders', group: 'path', path: 'song', tier: 4, name: 'Singing the Borders', cost: 16, mods: { tou: 1, cha: 1 }, rule: 'know_foe', req: { innovation: ['battle_hymns', 'long_memory'] }, lean: 'guard', desc: 'Every border has a song, and everyone knows whose land it is.' }),
  I({ id: 'song_lineage', group: 'path', path: 'song', tier: 4, name: 'The Song of Us', cost: 16, mods: { insightPerTurn: 1, cha: 1 }, req: { some: ['call_answer', 'long_memory', 'lullabies', 'battle_hymns'], n: 2 }, lean: 'peace', desc: 'Every ancestor, named in one long song.' }),
  I({ id: 'song_beyond_echo', group: 'beyond', path: 'song', tier: 6, name: 'The Endless Echo', cost: 34, mods: { cha: 2 }, inherit: { cha: 2, specialPerTurn: 1 }, req: { some: ['song_maps', 'chorus', 'songs_of_others', 'singing_borders', 'song_lineage'], n: 3 }, lean: 'peace', desc: 'A song so old that your people will sing it without being taught.' }),
  I({ id: 'song_beyond_voice', group: 'beyond', path: 'song', tier: 6, name: 'The Voice That Commands', cost: 34, mods: { cha: 1, str: 1 }, inherit: { cha: 1, str: 1, ideasPerTurn: 1 }, req: { some: ['chorus', 'singing_borders', 'battle_hymns'], n: 2 }, lean: 'war', desc: 'One voice, and everyone obeys.' }),
  // Many Minds
  I({ id: 'ink_and_shadow', group: 'path', path: 'many', tier: 3, name: 'Ink and Shadow', cost: 12, mods: { cun: 1, spd: 1 }, excludes: ['lure_and_strike'], lean: 'peace', desc: 'Vanish in a cloud, and be somewhere else.' }),
  I({ id: 'lure_and_strike', group: 'path', path: 'many', tier: 3, name: 'Lure and Strike', cost: 12, mods: { huntBonus: 2 }, rule: 'outwit', lean: 'war', desc: 'Look like food. Then eat.' }),
  I({ id: 'puzzle_minds', group: 'path', path: 'many', tier: 4, name: 'Puzzle Minds', cost: 16, mods: { cun: 2 }, rule: 'insight_spark', req: { innovation: ['arm_brains', 'ink_and_shadow'] }, lean: 'peace', desc: 'Every lid can be opened, every knot untied.' }),
  I({ id: 'den_guard', group: 'path', path: 'many', tier: 4, name: 'The Guarded Den', cost: 16, mods: { tou: 1, cun: 1 }, rule: 'last_refuge', req: { some: ['arm_brains', 'color_talk', 'ink_and_shadow', 'lure_and_strike'], n: 2 }, lean: 'guard', desc: 'A den with one way in, and you watching it.' }),
  I({ id: 'many_beyond_mirror', group: 'beyond', path: 'many', tier: 6, name: 'Minds Like Mirrors', cost: 34, mods: { cun: 2 }, inherit: { cun: 2, ideasPerTurn: 1 }, req: { some: ['shapeshifting', 'watch_learn', 'puzzle_minds', 'den_guard'], n: 3 }, lean: 'peace', desc: 'Your people will learn anything they see done once.' }),
  I({ id: 'many_beyond_mask', group: 'beyond', path: 'many', tier: 6, name: 'A Thousand Masks', cost: 34, mods: { cun: 1, damageReduce: 1 }, inherit: { cun: 1, tou: 2 }, req: { some: ['shapeshifting', 'lure_and_strike', 'den_guard'], n: 2 }, lean: 'war', desc: 'Your people will be anyone they need to be.' }),
  // The Swarm
  I({ id: 'soldier_caste', group: 'path', path: 'swarm', tier: 3, name: 'Soldier Caste', cost: 12, mods: { str: 2 }, excludes: ['nurse_caste'], lean: 'war', desc: 'Born with jaws, born to fight.' }),
  I({ id: 'nurse_caste', group: 'path', path: 'swarm', tier: 3, name: 'Nurse Caste', cost: 12, mods: { popPerTurn: 1, tou: 1 }, lean: 'peace', desc: 'Born to feed, born to tend.' }),
  I({ id: 'raid_trails', group: 'path', path: 'swarm', tier: 4, name: 'Raid Trails', cost: 16, mods: { huntBonus: 2, str: 1 }, req: { innovation: ['soldier_caste', 'pheromone_paths'] }, lean: 'war', desc: 'A scent that means "take everything".' }),
  I({ id: 'brood_halls', group: 'path', path: 'swarm', tier: 4, name: 'Brood Halls', cost: 16, mods: { maxPop: 3 }, req: { some: ['castes', 'pheromone_paths', 'soldier_caste', 'nurse_caste'], n: 2 }, lean: 'guard', desc: 'Chambers deep and warm, full of the young.' }),
  I({ id: 'swarm_beyond_queen', group: 'beyond', path: 'swarm', tier: 6, name: 'The Undying Queen', cost: 34, mods: { tou: 2 }, inherit: { tou: 2, maxPop: 3 }, req: { some: ['great_mound', 'one_will', 'brood_halls', 'raid_trails'], n: 3 }, lean: 'guard', desc: 'Your people will never be without a queen.' }),
  I({ id: 'swarm_beyond_tide', group: 'beyond', path: 'swarm', tier: 6, name: 'The Living Tide', cost: 34, mods: { str: 2 }, inherit: { str: 2, huntBonus: 2 }, req: { some: ['one_will', 'raid_trails', 'soldier_caste'], n: 2 }, lean: 'war', desc: 'Your people will move as one flood.' }),
  // Gardeners
  I({ id: 'thorn_hedges', group: 'path', path: 'garden', tier: 3, name: 'Thorn Hedges', cost: 12, mods: { tou: 2 }, excludes: ['open_fields'], lean: 'guard', desc: 'Grow a wall, and keep them out.' }),
  I({ id: 'open_fields', group: 'path', path: 'garden', tier: 3, name: 'Open Fields', cost: 12, mods: { forageBonus: 1, cha: 1 }, lean: 'peace', desc: 'Plenty, for anyone who comes.' }),
  I({ id: 'poison_gardens', group: 'path', path: 'garden', tier: 4, name: 'Poison Gardens', cost: 16, mods: { str: 1, tou: 1 }, rule: 'know_foe', req: { innovation: ['thorn_hedges', 'living_tools'] }, lean: 'war', desc: 'Some of what you grow is not for eating.' }),
  I({ id: 'shared_harvest', group: 'path', path: 'garden', tier: 4, name: 'Shared Harvest', cost: 16, mods: { foodPerTurn: 1, cha: 1 }, rule: 'calm_presence', req: { some: ['tending', 'seed_memory', 'open_fields', 'thorn_hedges'], n: 2 }, lean: 'peace', desc: 'Feed your neighbours, and they will never raid you.' }),
  I({ id: 'garden_beyond_seed', group: 'beyond', path: 'garden', tier: 6, name: 'The Seed of Everything', cost: 34, mods: { forageBonus: 2 }, inherit: { foodPerTurn: 2, specialPerTurn: 1 }, req: { some: ['herding', 'living_tools', 'shared_harvest', 'poison_gardens'], n: 3 }, lean: 'peace', desc: 'Your people will know how to grow anything, anywhere.' }),
  I({ id: 'garden_beyond_wild', group: 'beyond', path: 'garden', tier: 6, name: 'The Tamed Wild', cost: 34, mods: { cha: 1, tou: 1 }, inherit: { cha: 1, tou: 1, foodPerTurn: 1 }, req: { some: ['herding', 'thorn_hedges', 'poison_gardens'], n: 2 }, lean: 'guard', desc: 'Your people will rule the green, and everything in it.' }),
);
G.INNOVATIONS.forEach((inv) => { if (!inv.lean && G.OLD_LEANS[inv.id]) inv.lean = G.OLD_LEANS[inv.id]; });

// What each cell part grows into when your lineage leaves the Cell stage.
G.CARRY = {
  filter_mouth: { land: 'grinding_beak', sea: 'baleen' },
  tiny_jaw: { land: 'fangs', sea: 'fangs' },
  proboscis: { land: 'trunk', sea: 'mandibles' },
  engulfing_maw: { land: 'crushing_jaws', sea: 'crushing_jaws' },
  chloroplasts: { land: 'moss_garden', sea: 'kelp_garden' },
  venom_stylet: { land: 'venom_fangs', sea: 'venom_fangs' },
  lure_mouth: { land: 'lure_jaw', sea: 'lure_jaw' },
  flagellum: { land: 'runner_legs', sea: 'fluke' },
  cilia: { land: 'padded_paws', sea: 'tube_feet' },
  jet_vacuole: { land: 'hopping_legs', sea: 'swift_scales' },
  drift_sail: { land: 'display_frill', sea: 'dorsal_fin' },
  pseudopods: { land: 'digging_forelegs', sea: 'front_flippers' },
  lumen_flagellum: { land: 'glow_tail', sea: 'glow_tail' },
  spikes: { land: 'back_spines', sea: 'back_spines' },
  silica_shell: { land: 'scales', sea: 'scales' },
  toxin_sac: { land: 'warning_skin', sea: 'warning_skin' },
  slime_coat: { land: 'lichen_hide', sea: 'cleaner_skin' },
  photophores: { land: 'biolume_skin', sea: 'biolume_skin' },
  plated_wall: { land: 'carapace', sea: 'carapace' },
  eyespot: { land: 'big_eyes', sea: 'big_eyes' },
  chemoreceptor: { land: 'antennae', sea: 'electroreceptors' },
  magnetosome: { land: 'great_ears', sea: 'echolocation' },
  glow_lure: { land: 'glow_eyes', sea: 'glow_eyes' },
  stinging_cilia: { land: 'venom_barbs', sea: 'stinging_arms' },
  plated_eye: { land: 'horned_brow', sea: 'horned_brow' },
  fat_vacuole: { land: 'fat_hump', sea: 'blubber' },
  algae_chamber: { land: 'moss_garden', sea: 'kelp_garden' },
  stomach_chamber: { land: 'fat_hump', sea: 'fat_hump' },
  neuron_cluster: { land: 'grasping_fingers', sea: 'sucker_arms' },
  toxin_gland: { land: 'venom_quills', sea: 'venom_quills' },
  photocyte_cluster: { land: 'lumen_sail', sea: 'lumen_sail' },
  calcium_core: { land: 'pillar_legs', sea: 'armored_fins' },
  // Evolved cell parts
  devourer_maw: { land: 'crushing_jaws', sea: 'crushing_jaws' },
  sun_sieve: { land: 'grinding_beak', sea: 'baleen' },
  venom_siphon: { land: 'venom_fangs', sea: 'venom_fangs' },
  abyssal_maw: { land: 'lure_jaw', sea: 'lure_jaw' },
  leviathan_maw: { land: 'sabre_venom_fangs', sea: 'sabre_venom_fangs' },
  twin_drive: { land: 'runner_legs', sea: 'fluke' },
  torpedo_drive: { land: 'hopping_legs', sea: 'fluke' },
  tide_walker: { land: 'digging_forelegs', sea: 'front_flippers' },
  aurora_tail: { land: 'glow_tail', sea: 'glow_tail' },
  hyperdrive: { land: 'sprinter_legs', sea: 'comet_fluke' },
  venom_spines: { land: 'venom_quills', sea: 'venom_quills' },
  glass_hedgehog: { land: 'back_spines', sea: 'back_spines' },
  glow_slime: { land: 'biolume_skin', sea: 'biolume_skin' },
  fortress_wall: { land: 'carapace', sea: 'carapace' },
  urchin_armor: { land: 'porcupine_back', sea: 'porcupine_back' },
  compound_sense: { land: 'antennae', sea: 'electroreceptors' },
  lantern_eye: { land: 'glow_eyes', sea: 'glow_eyes' },
  tracker_sense: { land: 'great_ears', sea: 'echolocation' },
  reserve_gut: { land: 'fat_hump', sea: 'blubber' },
  brain_seed: { land: 'grasping_fingers', sea: 'sea_tentacles' },
  dreaming_brain: { land: 'clever_claws', sea: 'echolocation' },
  sun_heart: { land: 'moss_garden', sea: 'kelp_garden' },
  venom_bone: { land: 'venom_spurs', sea: 'stinger_tail' },
};

// Starting kits. Each archetype sets the parts you begin each body plan with.
G.ARCHETYPES = [
  {
    id: 'drifter', name: 'Drifter', cost: 0, color: 190, difficulty: 1, gimmick: 'drifter',
    desc: 'A balanced omnivore that goes where the current takes it.',
    rule: 'Carried by the current',
    ruleDesc: 'You cannot choose your Instinct: the current decides. Every 8 turns it carries you somewhere new: you leave your worst enemy behind, meet a new species, and may absorb one of its parts.',
    mods: { tou: 1 },
    start: {
      cell: { mouth: 'proboscis', motion: 'cilia' },
      land: { mouth: 'mandibles', senses: 'big_eyes' },
      sea: { mouth: 'mandibles', tail: 'fluke', senses: 'big_eyes' },
    },
  },
  {
    id: 'grazer', name: 'Grazer', cost: 0, color: 110, difficulty: 3, gimmick: 'grazer',
    desc: 'A sturdy plant-eater that lives as a vast herd.',
    rule: 'The vast herd',
    ruleDesc: 'Your herds grow 60% bigger, and DNA comes from the size of your herd instead of from time. You can never hunt or grow a meat-eating mouth, and every blow kills 50% more of you.',
    mods: { maxPop: 2 },
    start: {
      cell: { mouth: 'filter_mouth', membrane: 'silica_shell' },
      land: { mouth: 'grinding_beak', skin: 'fur' },
      sea: { mouth: 'baleen', skin: 'blubber' },
    },
  },
  {
    id: 'predator', name: 'Predator', cost: 30, color: 8, difficulty: 2, gimmick: 'predator',
    desc: 'Fast and hungry. Hunting is the only way you eat.',
    rule: 'You are what you eat',
    ruleDesc: 'No foraging: hunting only feeds you on a kill, and food spoils twice as fast. Go 5 turns without a kill and you starve. Every kill can let you devour a part from the species you ate.',
    mods: { str: 1 },
    start: {
      cell: { mouth: 'tiny_jaw', motion: 'flagellum' },
      land: { mouth: 'fangs', hands: 'sharp_claws', senses: 'antennae' },
      sea: { mouth: 'fangs', hands: 'smasher_club', senses: 'electroreceptors' },
    },
  },
  {
    id: 'symbiote', name: 'Symbiote', cost: 50, needsEvo: 2, color: 150, difficulty: 2, gimmick: 'symbiote',
    desc: 'Two bodies, one life.',
    rule: 'Two bodies, one life',
    ruleDesc: 'You live joined to a partner species. You share a sixth of its stats and can swap parts with it, but you suffer when it struggles, and lose half your kind if it dies out.',
    mods: { maxPop: -2, spd: -1 },
    start: {
      cell: { mouth: 'chloroplasts', membrane: 'slime_coat' },
      land: { mouth: 'trunk', back: 'moss_garden', skin: 'lichen_hide' },
      sea: { mouth: 'baleen', back: 'kelp_garden', skin: 'cleaner_skin' },
    },
  },
  {
    id: 'parasite', name: 'Parasite', cost: 70, needsEvo: 5, color: 280, difficulty: 3, gimmick: 'parasite',
    desc: 'Lives inside other species. High risk, high reward.',
    rule: 'Inside a host',
    ruleDesc: 'You live inside a host species and feed on it. Your Population can never outgrow your host, and you can steal its parts. Your host weakens and turns on you, so you must jump to a new one before it dies out.',
    mods: { cun: 1, maxPop: -2 },
    start: {
      cell: { mouth: 'venom_stylet', motion: 'jet_vacuole' },
      land: { mouth: 'venom_fangs', skin: 'warning_skin' },
      sea: { mouth: 'venom_fangs', skin: 'warning_skin' },
    },
  },
  {
    id: 'colony', name: 'Colony', cost: 40, color: 40, difficulty: 3, gimmick: 'colony',
    desc: 'A shapeless colony that spreads by splitting.',
    mods: { maxPop: 2, spd: -1 },
    rule: 'Spread by splitting',
    ruleDesc: 'You always grow without symmetry. When your colony is full and well fed, part of it splits off as an allied species on the map (up to 3), feeding and fighting beside you. Reshaping your body costs half as much.',
    start: {
      cell: { mouth: 'engulfing_maw', membrane: 'slime_coat' },
      land: { mouth: 'grinding_beak', back: 'moss_garden' },
      sea: { mouth: 'baleen', back: 'kelp_garden' },
    },
  },
  {
    id: 'mimic', name: 'Mimic', cost: 60, needsEvo: 3, color: 320, difficulty: 2, gimmick: 'mimic',
    desc: 'A master of disguise.',
    mods: { cha: 1 },
    rule: 'Pass as one of them',
    ruleDesc: 'Mimic any species you meet (3 DNA): you take on its colors and copy one of its parts. While disguised, every check involving that species is easier, and if it is a predator it rarely attacks you.',
    start: {
      cell: { mouth: 'proboscis', membrane: 'photophores' },
      land: { mouth: 'mandibles', skin: 'scales' },
      sea: { mouth: 'suction_mouth', skin: 'color_skin' },
    },
  },
];

// Home worlds. They change your stats, colors and which events show up.
G.ORIGINS = [
  { id: 'tidal', name: 'Tidal Pools', cost: 0, hue: 185, desc: 'Warm, shallow and forgiving. No modifiers.', mods: {}, dnaMult: 1 },
  { id: 'vents', name: 'Volcanic Vents', cost: 40, hue: 18, desc: 'Mutations come fast here: +25% DNA. Food is scarce: eat 1 more per turn.', mods: { upkeep: 1 }, dnaMult: 1.25 },
  { id: 'frozen', name: 'Frozen Sea', cost: 40, hue: 210, desc: 'Cold makes life tough and slow: bigger herds, −1 Speed.', mods: { maxPop: 3, spd: -1 }, dnaMult: 1 },
  { id: 'toxic', name: 'Toxic Bloom', cost: 60, needsEvo: 4, hue: 290, desc: 'Poisoned water: smaller herds, but Venom parts show up three times as often and +15% DNA.', mods: { maxPop: -2 }, dnaMult: 1.15, boostKeyword: 'venom' },
];

// Mutation packs add parts to the draft pool.
G.PACKS = [
  { id: 'deep', name: 'Abyssal Light', cost: 35, desc: 'Adds 12 Glow parts: lures, photophores and living light.' },
  { id: 'armored', name: 'Ironclad', cost: 35, desc: 'Adds 6 Armor parts: plates, carapaces and horned brows.' },
  { id: 'venom', name: 'Venom Glands', cost: 45, needsEvo: 1, desc: 'Adds 8 Venom parts: stylets, barbs, spurs, stingers and stinging arms.' },
];

// The Evolution Tree: permanent upgrades bought with Genetic Memory between runs.
// Laid out like the Mind tree: col 0-5, tier 1-4 (top to bottom).
//   costs  one price per level      req   nodes that must be bought first
//   mods   stat changes per level   twin  slot that gains a second socket
G.BOONS = [
  { id: 'hardy', name: 'Hardy Ancestors', col: 0, tier: 1, costs: [8, 18, 35], desc: '+10 max Population per level (more for small bodies, fewer for giants). Works at once, even mid-run.' },
  { id: 'pantry', name: 'Ancestral Pantry', col: 1, tier: 1, costs: [6, 15], desc: '+3 starting Food and +2 Food storage per level.' },
  { id: 'memory', name: 'Deep Memory', col: 2, tier: 1, costs: [8, 20], desc: 'Start the Cell and Creature stages with +3 DNA per level.' },
  { id: 'rich_genes', name: 'Rich Genes', col: 3, tier: 1, costs: [12, 28, 50], desc: '+10% DNA from everything, per level.' },
  { id: 'reroll', name: 'Second Look', col: 4, tier: 1, costs: [15], desc: 'Reroll each mutation draft once.' },
  { id: 'amber', name: 'Amber', col: 5, tier: 1, costs: [10, 25], desc: 'Keep one more fossil in amber per level (you start with room for one).' },
  { id: 'tough_cells', name: 'Tough Cells', col: 0, tier: 2, req: ['hardy'], costs: [20, 45], mods: { tou: 1 }, desc: '+1 Toughness per level, every run.' },
  { id: 'strong_cells', name: 'Strong Cells', col: 1, tier: 2, req: ['pantry'], costs: [20, 45], mods: { str: 1 }, desc: '+1 Strength per level, every run.' },
  { id: 'clever_cells', name: 'Clever Cells', col: 2, tier: 2, req: ['memory'], costs: [20, 45], mods: { cun: 1 }, desc: '+1 Cunning per level, every run.' },
  { id: 'bright_cells', name: 'Bright Cells', col: 3, tier: 2, req: ['rich_genes'], costs: [20, 45], mods: { cha: 1 }, desc: '+1 Charm per level, every run.' },
  { id: 'twin_mouth', name: 'Twin Mouths', col: 4, tier: 2, req: ['reroll'], costs: [40], twin: 'mouth', desc: 'A second Mouth socket: two ways to eat.' },
  { id: 'twin_organ', name: 'Twin Organs', col: 5, tier: 2, req: ['amber'], costs: [35], twin: 'organ', desc: 'A second Organ socket for multicellular cells.' },
  { id: 'second_chance', name: 'Second Chance', col: 0, tier: 3, req: ['tough_cells'], costs: [50], desc: 'Once per run, when your kind would go extinct, a few survivors cling on.' },
  { id: 'quick_cells', name: 'Quick Cells', col: 1, tier: 3, req: ['strong_cells'], costs: [30, 60], mods: { spd: 1 }, desc: '+1 Speed per level, every run.' },
  { id: 'short_road', name: 'Short Road', col: 2, tier: 3, req: ['clever_cells'], costs: [35, 70], desc: 'Every DNA goal (drafts, milestones, finales) is 8% lower per level.' },
  { id: 'choice', name: 'Wider Gene Pool', col: 3, tier: 3, req: ['bright_cells'], costs: [55], desc: 'Mutation drafts offer 4 parts instead of 3.' },
  { id: 'twin_senses', name: 'Twin Senses', col: 4, tier: 3, req: ['twin_mouth'], costs: [60], twin: 'senses', desc: 'A second Senses socket: eyes and echolocation, say.' },
  { id: 'twin_back', name: 'Twin Backs', col: 5, tier: 3, req: ['twin_organ'], costs: [60], twin: 'back', desc: 'A second Back (or Dorsal) socket: a shell and a garden.' },
  { id: 'ancestral_armor', name: 'Ancestral Armor', col: 0, tier: 4, req: ['second_chance'], costs: [80], mods: { damageReduce: 1 }, desc: 'Every blow kills one fewer of you, every run.' },
  { id: 'head_start', name: 'Head Start', col: 2, tier: 4, req: ['short_road'], costs: [70], desc: 'Every run begins with a free mutation draft.' },
  { id: 'deep_thought', name: 'Deep Thought', col: 1, tier: 4, req: ['quick_cells'], costs: [45, 90], mods: { insightPerTurn: 1 }, desc: '+1 Insight per turn per level once your kind has a Mind: reach further into the Mind tree.' },
  { id: 'old_paths', name: 'Old Paths', col: 3, tier: 4, req: ['choice'], costs: [50, 100], desc: 'Beyond-the-Gate ideas in the Mind tree cost 15% less per level.' },
  { id: 'twin_hands', name: 'Twin Hands', col: 4, tier: 4, req: ['twin_senses'], costs: [90], twin: 'hands', desc: 'A second Hands (or Arms) socket: claws and clever fingers.' },
  { id: 'twin_skin', name: 'Twin Skins', col: 5, tier: 4, req: ['twin_back'], costs: [80], twin: 'skin', desc: 'A second Skin socket: armor and camouflage.' },
];
G.BOON = {}; G.BOONS.forEach((b) => { G.BOON[b.id] = b; });

// Fossils: a snapshot at each milestone. Reviving one from amber costs Genetic Memory,
// and a revived run earns less, so fresh runs still matter.
G.REVIVE_COST = { multicellular: 12, creature: 25, giants: 35, mind: 45, tribe: 50, society: 60 };
G.REVIVE_MULT = 0.6;
G.FOSSIL_KEEP = 8; // recent fossils kept besides the ones in amber
// Complications: optional rules, switched on in Options, that make every new lineage harder for more
// Genetic Memory. Their bonuses add to Hostility's (+25% per level).
G.COMPLICATIONS = [
  { id: 'lean', name: 'Lean Times', bonus: 0.15, mods: { upkeep: 1 }, desc: 'Your kind eats 1 more Food every turn, in every stage.' },
  { id: 'fragile', name: 'Fragile', bonus: 0.1, mods: { tou: -1 }, desc: '−1 Toughness, in every stage.' },
  { id: 'small_herd', name: 'Small Herd', bonus: 0.1, mods: { maxPop: -2 }, desc: 'A smaller comfortable size (−20 Population, members or people), in every stage.' },
  { id: 'slow_genes', name: 'Slow Genes', bonus: 0.25, desc: 'Every goal (DNA, Ideas, Influence and the rest) is a quarter further away.' },
  { id: 'few_choices', name: 'Few Choices', bonus: 0.1, desc: 'Every draft offers one choice fewer.' },
  { id: 'blind', name: 'Blind Odds', bonus: 0.15, desc: 'Event answers no longer say how likely they are to work.' },
  { id: 'restless', name: 'Restless World', bonus: 0.1, desc: 'Events come more often, good and bad.' },
  { id: 'no_second', name: 'No Second Chances', bonus: 0.1, desc: 'The Second Chance upgrade does nothing.' },
];
G.COMPLICATION = {}; G.COMPLICATIONS.forEach((c) => { G.COMPLICATION[c.id] = c; });
// The Daily Run: one world a day, the same for everyone (archetype, home world, Hostility 1 and two
// complications, all drawn from the date), worth +25% Genetic Memory on top.
G.DAILY_BONUS = 0.25;
G.DAILY_HOSTILITY = 1;
// Lineage names: a start and an end, put together. You can always type your own.
G.LINEAGE_SYLLABLES = {
  a: ['Vel', 'Mor', 'Ash', 'Kel', 'Thri', 'Oon', 'Sab', 'Ly', 'Quor', 'Ren', 'Tal', 'Zhe', 'Bri', 'Cor', 'Ny', 'Esk', 'Ul', 'Wyn', 'Ira', 'Dra'],
  b: ['ith', 'ora', 'un', 'ax', 'elle', 'omo', 'ari', 'yx', 'ene', 'ul', 'avin', 'oth', 'ia', 'esk', 'umbra', 'en'],
};

// Stage pacing. DNA earned in a stage triggers drafts, milestones and finally the finale.
// Milestones are big events that change the rules (multicellularity, size, mind).
G.STAGES = {
  cell: {
    name: 'Cell Stage', turnName: 'Epoch',
    drafts: [4, 8, 12, 17, 22, 27, 32],
    milestones: [{ at: 14, event: 'multicellularity' }],
    evolveAt: 37, finale: 'cell_finale',
  },
  creature: {
    name: 'Creature Stage', turnName: 'Generation',
    drafts: [5, 10, 15, 20, 28, 34, 40, 50, 56, 62, 70],
    milestones: [{ at: 0, event: 'the_frame' }, { at: 8, event: 'the_young' }, { at: 13, event: 'the_blood' }, { at: 18, event: 'age_of_giants' }, { at: 32, event: 'spark_of_mind' }],
    evolveAt: null, finale: 'creature_finale',
  },
};

// Eras of the Creature stage, shown in the top bar.
G.ERAS = { 1: 'First Steps', 2: 'Age of Giants', 3: 'Dawn of Mind' };

// Body plans for the Creature stage. Symmetry is fixed; segments (leg pairs, arms or
// pseudopods) can be changed in the Body Plan tab for DNA.
//   off   slots this plan has no use for (parts there do nothing and are not drafted)
G.SYMMETRY = {
  bilateral: { name: 'Bilateral', desc: 'Head and tail, left and right. Legs come in pairs.', unit: 'leg pairs', min: 0, max: 8, start: 2, mods: {} },
  radial: { name: 'Radial', desc: 'Arms around a center, like a starfish or jellyfish. Sees in every direction and regrows lost arms, but slow and awkward.', unit: 'arms', min: 3, max: 8, start: 5, off: ['hindLimbs', 'feet', 'tail'], mods: { cun: 1, tou: 1, spd: -2, str: -1 } },
  colonial: { name: 'No symmetry', desc: 'A shapeless colony that oozes along on pseudopods. Huge, hardy colonies, but clumsy and dim.', unit: 'pseudopods', min: 2, max: 8, start: 3, off: ['hands', 'feet', 'tail'], mods: { maxPop: 3, cun: -2, cha: -1, spd: -1 } },
};
G.RESHAPE_COST = 4; // DNA per step in the Body Plan tab

// What each segment count does for bilateral creatures (leg pairs).
// At sea the same pairs are fins: same trade-offs, different names.
const SEA_LEG_NAMES = ['Eel', 'One fin pair', 'Two fin pairs', 'Three fin pairs', 'Many fins', 'Many fins', 'Fin fringe', 'Fin fringe', 'Fin fringe'];
const SEA_LEG_DESC = ['No fins at all. Wriggles through cracks and strikes from cover, but has no fin slots.', 'Only one pair of fins. Nimble and clever, but less sturdy.', 'The classic fish. No bonus, no cost.', 'Extra fins for steady swimming, but they need feeding.', 'Rows of fins rippling along the body. Fast and stable, but hungry.', 'Rows of fins rippling along the body. Fast and stable, but hungry.', 'A fringe of fins all along the body. Terrifyingly fast, always hungry.', 'A fringe of fins all along the body. Terrifyingly fast, always hungry.', 'A fringe of fins all along the body. Terrifyingly fast, always hungry.'];
G.legPlan = (n, habitat, arms) => {
  if (habitat === 'sea') return { ...landLegPlan(n), name: SEA_LEG_NAMES[n], desc: SEA_LEG_DESC[n] };
  return arms ? landArmPlan(n, arms) : landLegPlan(n);
};
// On land, some limb pairs can be arms: hands-free walkers, centaurs, or arm-crawlers with no legs at all.
function landArmPlan(n, arms) {
  const legs = n - arms;
  const add = (a, b) => { const o = { ...a }; Object.entries(b).forEach(([k, v]) => { o[k] = (o[k] || 0) + v; }); return o; };
  const armMods = { cun: 1, str: arms - 1, upkeep: arms - 1 };
  const word = (k, what) => `${k * 2} ${what}`;
  if (legs === 0) return { name: `Arm-crawler, ${word(arms, 'arms')}`, desc: 'No legs at all: it hauls itself along on its arms. Slow, but its hands are never idle.', mods: add(armMods, { spd: -2, str: 1 }), off: ['hindLimbs', 'feet'] };
  if (legs === 1) return { name: `Two legs and ${word(arms, 'arms')}`, desc: 'Stands upright on its hind legs with its hands free, like an ape. Long arms let it knuckle-walk.', mods: add(armMods, { insightPerTurn: 1 }) };
  const base = landLegPlan(legs);
  return { name: `${word(legs, 'legs')} and ${word(arms, 'arms')}`, desc: 'Walks on its legs and holds its front pairs up as arms, like a centaur or a mantis.', mods: add(add(base.mods, armMods), { upkeep: 1 }) };
}
function landLegPlan(n) {
  if (n === 0) return { name: 'Serpent', desc: 'No legs at all. Slithers, hides in burrows and strikes from cover, but has no limb slots.', mods: { cun: 2, spd: 1, huntBonus: 1, str: -1 }, off: ['frontLimbs', 'hindLimbs', 'hands', 'feet'] };
  if (n === 1) return { name: 'Two legs', desc: 'Stands on its hind legs; the front pair is gone.', mods: { cun: 1, insightPerTurn: 1, tou: -1 }, off: ['frontLimbs', 'hands'] };
  if (n === 2) return { name: 'Four legs', desc: 'The classic body. No bonus, no cost.', mods: {} };
  if (n === 3) return { name: 'Six legs', desc: 'Stable and quick, but every leg needs feeding.', mods: { tou: 1, spd: 1, upkeep: 1 } };
  if (n <= 5) return { name: 'Many legs', desc: 'A long, segmented crawler. Fast and hard to topple, but hungry.', mods: { tou: 1, spd: 2, upkeep: 2, cha: -1 } };
  return { name: 'Centipede', desc: 'Dozens of legs. Terrifyingly fast and tough, but always hungry and hard to love.', mods: { tou: 2, spd: 3, upkeep: 3, cha: -2 } };
}
G.armPlan = (n) => (n <= 4 ? { name: `${n} arms`, desc: 'Light and nimble for a radial creature.', mods: { spd: 1 } } : n === 5 ? { name: '5 arms', desc: 'The classic starfish.', mods: {} } : { name: `${n} arms`, desc: 'More arms to grab and hold, more mouths to feed.', mods: { str: 1, tou: 1, upkeep: n - 5 } });
G.podPlan = (n) => (n <= 3 ? { name: `${n} pseudopods`, desc: 'Slow and steady.', mods: {} } : { name: `${n} pseudopods`, desc: 'Oozes faster, eats more.', mods: { spd: Math.floor((n - 2) / 2), upkeep: Math.floor((n - 2) / 2) } });

// The appearance editor (Creature stage). Options with `need` unlock with progress.
G.APPEARANCE = {
  pattern: [
    { id: 'plain', name: 'Plain' },
    { id: 'spots', name: 'Spots' },
    { id: 'stripes', name: 'Stripes', need: { keyword: 'swift' }, why: 'Needs a Swift part' },
    { id: 'bands', name: 'Armor bands', need: { keyword: 'armor' }, why: 'Needs an Armor part' },
    { id: 'glowspots', name: 'Glow spots', need: { keyword: 'glow' }, why: 'Needs a Glow part' },
    { id: 'rings', name: 'Rings' },
    { id: 'patches', name: 'Patches' },
    { id: 'countershade', name: 'Countershading' },
    { id: 'gradient', name: 'Two-tone' },
    { id: 'rosettes', name: 'Rosettes', need: { stat: ['cun', 5] }, why: 'Needs Cunning 5' },
    { id: 'tiger', name: 'Tiger stripes', need: { stat: ['str', 5] }, why: 'Needs Strength 5' },
    { id: 'iridescent', name: 'Iridescent', need: { era: 2 }, why: 'Opens in the Age of Giants' },
    // The Creature Wardrobe: more patterns, some earned by playing (`earn`, see G.WARDROBE_EARN).
    { id: 'speckles', name: 'Speckles' },
    { id: 'dapple', name: 'Dapple' },
    { id: 'chevrons', name: 'Chevrons', earn: 'creature' },
    { id: 'scales', name: 'Scales', earn: 'giants' },
    { id: 'eyespots', name: 'Eyespots', earn: 'mind' },
    { id: 'marble', name: 'Marbled', earn: 'tribe' },
    { id: 'harlequin', name: 'Harlequin', earn: 'society' },
    { id: 'lightning', name: 'Lightning', earn: 'hostile_win' },
  ],
  finish: [
    { id: 'matte', name: 'Matte' },
    { id: 'glossy', name: 'Glossy' },
    { id: 'glowing', name: 'Glowing edges', need: { keyword: 'glow' }, why: 'Needs a Glow part' },
    { id: 'velvet', name: 'Velvet', earn: 'daily' },
    { id: 'pearl', name: 'Pearl', earn: 'evos15' },
    { id: 'sparkle', name: 'Sparkle', earn: 'lineages10' },
    { id: 'metallic', name: 'Metallic', earn: 'renaissance' },
  ],
  // Looks for the body plans that are not four-limbed land or fish bodies (`bodies` = editor body kinds).
  bell: [
    { id: 'dome', name: 'Dome', bodies: ['radial'], only: 'sea' },
    { id: 'tall', name: 'Tall bell', bodies: ['radial'], only: 'sea' },
    { id: 'saucer', name: 'Saucer', bodies: ['radial'], only: 'sea' },
    { id: 'frilled', name: 'Frilled', bodies: ['radial'], only: 'sea', earn: 'giants' },
  ],
  armStyle: [
    { id: 'tapered', name: 'Tapered', bodies: ['radial'], only: 'land' },
    { id: 'webbed', name: 'Webbed', bodies: ['radial'], only: 'land' },
    { id: 'curled', name: 'Curled tips', bodies: ['radial'], only: 'land' },
    { id: 'knobbly', name: 'Knobbly', bodies: ['radial'], only: 'land', earn: 'giants' },
  ],
  colony: [
    { id: 'lumpy', name: 'Lumpy', bodies: ['colonial'] },
    { id: 'bubbly', name: 'Bubbly', bodies: ['colonial'] },
    { id: 'crystal', name: 'Crystal', bodies: ['colonial'] },
    { id: 'stacked', name: 'Stacked', bodies: ['colonial'], earn: 'creature' },
  ],
  collar: [
    { id: 'none', name: 'None', bodies: ['land', 'serpent'] },
    { id: 'hood', name: 'Hood', bodies: ['land', 'serpent'] },
    { id: 'frill', name: 'Frill', bodies: ['land', 'serpent'] },
    { id: 'mane', name: 'Mane', bodies: ['land', 'serpent'], earn: 'tribe' },
    { id: 'crown', name: 'Spiked crown', bodies: ['land', 'serpent'], earn: 'colonial' },
  ],
  headPos: [
    { id: 'neck', name: 'On the neck' },
    { id: 'forward', name: 'Low and forward' },
    { id: 'high', name: 'Held high' },
    { id: 'tucked', name: 'Tucked in' },
  ],
  shape: [
    { id: 'round', name: 'Round' },
    { id: 'slim', name: 'Slim' },
    { id: 'flat', name: 'Flat', only: 'land' },
    { id: 'pear', name: 'Pear', only: 'land' },
    { id: 'tall', name: 'Tall', only: 'land' },
    { id: 'hunched', name: 'Hunched', only: 'land', need: { stat: ['str', 5] }, why: 'Needs Strength 5' },
    { id: 'torpedo', name: 'Torpedo', only: 'sea' },
    { id: 'deep', name: 'Deep-bodied', only: 'sea' },
    { id: 'ray', name: 'Ray wings', only: 'sea', need: { stat: ['spd', 5] }, why: 'Needs Speed 5' },
    { id: 'puffer', name: 'Puffer', only: 'sea', need: { stat: ['tou', 5] }, why: 'Needs Toughness 5' },
    { id: 'long', name: 'Long', need: { era: 2 }, why: 'Opens in the Age of Giants' },
  ],
  head: [
    { id: 'round', name: 'Round' },
    { id: 'snout', name: 'Long snout' },
    { id: 'flat', name: 'Flat' },
    { id: 'big', name: 'Big brain', need: { stat: ['cun', 6] }, why: 'Needs Cunning 6' },
    { id: 'crest', name: 'Crest', need: { keyword: 'armor' }, why: 'Needs an Armor part' },
    { id: 'hammer', name: 'Hammerhead', only: 'sea', need: { stat: ['cun', 5] }, why: 'Needs Cunning 5' },
    { id: 'sword', name: 'Sword nose', only: 'sea', need: { keyword: 'swift' }, why: 'Needs a Swift part' },
  ],
  fins: [
    { id: 'plain', name: 'Plain', only: 'sea' },
    { id: 'spiky', name: 'Spiky', only: 'sea' },
    { id: 'flowing', name: 'Flowing', only: 'sea', need: { stat: ['cha', 4] }, why: 'Needs Charm 4' },
    { id: 'sharp', name: 'Sharp', only: 'sea', need: { stat: ['spd', 5] }, why: 'Needs Speed 5' },
  ],
  neck: [
    { id: 'short', name: 'Short' },
    { id: 'long', name: 'Long', need: { era: 2, habitat: 'land' }, why: 'Land creatures, Age of Giants' },
  ],
  eyes: [
    { id: 'round', name: 'Round' },
    { id: 'sleepy', name: 'Sleepy' },
    { id: 'fierce', name: 'Fierce', need: { diet: 'carn' }, why: 'Carnivores only' },
    { id: 'huge', name: 'Huge', need: { stat: ['cun', 7] }, why: 'Needs Cunning 7' },
  ],
  posture: [
    { id: 'four', name: 'On all fours' },
    { id: 'two', name: 'On two legs', need: { tag: 'biped' }, why: 'Needs Upright or Striding Legs' },
  ],
};

// Sea creatures live at a home depth. Each zone has trade-offs, its own events and its own
// place on the map (x and y are fractions of the map, y from the surface down).
//   need  a part id or keyword needed to live there
G.SEA_ZONES = [
  { id: 'shallows', name: 'Sunlit Shallows', desc: 'Warm, bright and full of food, but there is nowhere to hide.', mods: { forageBonus: 2, damageReduce: -1 }, x: [0.06, 0.94], y: [0.07, 0.2] },
  { id: 'reef', name: 'The Reef', desc: 'Crowded, colorful and full of hiding places. Friends are easy to make.', mods: { cha: 1, tou: 1, spd: -1 }, x: [0.04, 0.3], y: [0.25, 0.33] },
  { id: 'open', name: 'Open Water', desc: 'Endless blue. The fast and the hungry hunt here.', mods: { spd: 1, huntBonus: 1, tou: -1 }, x: [0.42, 0.94], y: [0.27, 0.47] },
  { id: 'twilight', name: 'Twilight Zone', desc: 'Dim blue light. Every night its creatures rise to feed. Sharp senses rule.', mods: { cun: 1, forageBonus: -1 }, x: [0.6, 0.94], y: [0.53, 0.71], need: { any: ['glow', 'big_eyes', 'lateral_line', 'echolocation', 'electroreceptors', 'pressure_skin'] }, why: 'Needs a Glow part or sharp senses (Big Eyes, Lateral Line, Echolocation, Electroreceptors) or Pressure Skin' },
  { id: 'abyss', name: 'The Abyss', desc: 'Black, cold and crushing, with warm vents full of strange life. Few hunters ever come here.', mods: { cun: 1, tou: 1, damageReduce: 1, forageBonus: -2 }, x: [0.64, 0.95], y: [0.77, 0.89], need: { any: ['glow', 'pressure_skin'] }, why: 'Needs a Glow part or Pressure Skin' },
];
G.MOVE_COST = 3; // DNA to move to a new depth

// The Creature Editor's sliders. Values are multipliers (1 = normal) unless noted.
//   group  which editor tab     cap  optional function(run) giving a lower maximum, with capWhy
// Sculpt sliders. Each body type gets its own set (`bodies`) and its own words (`labels`):
// land, sea, serpent (no limbs), radial (starfish or jellyfish) and colonial (a shapeless blob).
// `part` sliders only show when you have that kind of visible part.
const ALL_BODIES = ['land', 'sea', 'serpent', 'radial', 'colonial'];
G.SCULPT = [
  { id: 'bodyLen', name: 'Body length', group: 'body', bodies: ALL_BODIES, min: 0.7, max: 1.5, step: 0.05, def: 1, labels: { serpent: 'Length', radial: 'Disc size', radialSea: 'Bell size', colonial: 'Width' } },
  { id: 'bodyHeight', name: 'Body height', group: 'body', bodies: ['land', 'sea', 'serpent', 'colonial'], min: 0.7, max: 1.5, step: 0.05, def: 1, labels: { serpent: 'Thickness', colonial: 'Height' } },
  { id: 'spine', name: 'Back slope', group: 'body', bodies: ['land', 'serpent'], min: -1, max: 1, step: 0.1, def: 0, ends: ['Head up', 'Head down'], labels: { serpent: 'Slither' }, endsBy: { serpent: ['Gentle', 'Wild'] } },
  { id: 'neckLen', name: 'Neck length', group: 'body', bodies: ['land'], min: 0, max: 1, step: 0.05, def: 0, only: 'land', cap: (run) => (run.era >= 2 ? 1 : 0.4), capWhy: 'Longer necks open in the Age of Giants' },
  { id: 'tailSize', name: 'Tail size', group: 'body', bodies: ['land', 'sea'], part: 'tail', min: 0.6, max: 1.6, step: 0.05, def: 1 },
  { id: 'backSize', name: 'Back part size', group: 'body', bodies: ['land', 'sea'], part: 'back', min: 0.6, max: 1.6, step: 0.05, def: 1, labels: { sea: 'Dorsal size' } },
  { id: 'wingSize', name: 'Wing size', group: 'body', bodies: ['land'], part: 'wings', min: 0.7, max: 1.5, step: 0.05, def: 1 },
  { id: 'legLen', name: 'Hind limb length', group: 'limbs', bodies: ['land', 'sea', 'radial', 'colonial'], min: 0.6, max: 1.6, step: 0.05, def: 1, labels: { sea: 'Fin size', radial: 'Arm length', radialSea: 'Tentacle length', colonial: 'Pseudopod size' } },
  { id: 'armLen', name: 'Front limb length', group: 'limbs', bodies: ['land'], only: 'land', min: 0.6, max: 1.8, step: 0.05, def: 1, ends: ['Short (leans back)', 'Long (leans forward)'] },
  { id: 'legThick', name: 'Limb thickness', group: 'limbs', bodies: ['land'], min: 0.6, max: 1.8, step: 0.05, def: 1 },
  { id: 'legSpread', name: 'Limb spacing', group: 'limbs', bodies: ['land'], min: 0.5, max: 1.5, step: 0.05, def: 1, ends: ['Bunched', 'Far apart'] },
  { id: 'legShift', name: 'Limb position', group: 'limbs', bodies: ['land'], min: -0.5, max: 0.5, step: 0.05, def: 0, ends: ['Toward the tail', 'Toward the head'] },
  { id: 'headTilt', name: 'Head angle', group: 'head', bodies: ['land'], only: 'land', min: -0.6, max: 0.6, step: 0.05, def: 0, ends: ['Nose up', 'Nose down'] },
  { id: 'headSize', name: 'Head size', group: 'head', bodies: ['land', 'sea', 'serpent'], min: 0.7, max: 1.6, step: 0.05, def: 1 },
  { id: 'eyeSize', name: 'Eye size', group: 'head', bodies: ['land', 'sea', 'serpent'], min: 0.6, max: 1.8, step: 0.05, def: 1 },
  { id: 'jaw', name: 'Jaw size', group: 'head', bodies: ['land', 'serpent'], min: 0.6, max: 1.6, step: 0.05, def: 1 },
  { id: 'patScale', name: 'Pattern size', group: 'color', bodies: ALL_BODIES, min: 0.5, max: 2, step: 0.05, def: 1 },
  { id: 'patDensity', name: 'Pattern density', group: 'color', bodies: ALL_BODIES, min: 0.5, max: 2, step: 0.05, def: 1 },
];
G.SCULPT_BY_ID = {}; G.SCULPT.forEach((x) => { G.SCULPT_BY_ID[x.id] = x; });
G.COLOR_KEYS = ['hue', 'belly', 'accent', 'accent2']; // hue sliders, 0-359

// ======================= RIVALS =======================
// How your Rival adapts at each of your milestones: an answer to how you have been treating it.
G.RIVAL_ADAPT = {
  armored: { name: 'Thick hide', mods: { tou: 2 }, why: 'because you keep fighting them' },
  fierce: { name: 'Bigger weapons', mods: { str: 2 }, why: 'because you keep fighting them' },
  swift: { name: 'Faster', mods: { spd: 2 }, why: 'because you keep outrunning them' },
  wary: { name: 'Wary', mods: { cun: 2 }, why: 'because you keep outwitting them' },
  charming: { name: 'Winning ways', mods: { cha: 2 }, why: 'because your friendliness taught them how' },
  many: { name: 'Many more of them', mods: {}, desc: 'more numerous', why: 'because you have left them alone to grow' },
};
// The four ways a rivalry can end (and 'gone', when they die out on their own).
G.RIVAL_ENDINGS = {
  destroyed: { name: 'Rival destroyed', desc: 'You wiped them out.' },
  peace: { name: 'Peace with your rival', desc: 'The old feud is over.' },
  absorbed: { name: 'Rival absorbed', desc: 'They became part of you, and you kept their strength.' },
  released: { name: 'Rival let go', desc: 'You let the feud go, and they left for other lands.' },
  gone: { name: 'Rival gone', desc: 'They died out before you could settle it.' },
};

// ======================= THE CREATURE WARDROBE =======================
// Looks earned by playing. Each earns once, for every lineage after. `test` reads your lasting progress.
G.WARDROBE_EARN = {
  creature: { text: 'Reach the Creature stage', test: (m) => (m.stats.creatures || 0) >= 1 },
  giants: { text: 'Reach the Age of Giants', mark: true },
  mind: { text: 'Reach the Spark of Mind', mark: true },
  tribe: { text: 'Found a Tribe', mark: true },
  society: { text: 'Reach the Society stage', mark: true },
  renaissance: { text: 'Reach the Renaissance', mark: true },
  colonial: { text: 'Reach the Colonial Age', mark: true },
  hostile_win: { text: 'Win a lineage at Hostility 2 or higher', mark: true },
  daily: { text: 'Finish a Daily Run', mark: true },
  complicated: { text: 'Finish a lineage with 3 or more complications', mark: true },
  evos15: { text: 'Discover 15 evolutions', test: (m) => (m.codex.evolutions || []).length >= 15 },
  lineages10: { text: 'Play 10 lineages', test: (m) => m.stats.runs >= 10 },
};
// Colour sets: body, belly, pattern and second pattern colours in one tap. Most open by visiting a biome.
G.PALETTES = [
  { id: 'tide', name: 'Tide', h: [195, 185, 45, 20] },
  { id: 'ember', name: 'Ember', h: [12, 35, 50, 0] },
  { id: 'moss', name: 'Moss', h: [100, 70, 40, 140] },
  { id: 'dusk', name: 'Dusk', h: [265, 290, 330, 40] },
  { id: 'jungle', name: 'Jungle', h: [130, 60, 50, 290], biome: 'jungle' },
  { id: 'desert', name: 'Desert sand', h: [35, 48, 15, 195], biome: 'desert' },
  { id: 'tundra', name: 'Tundra', h: [205, 215, 185, 350], biome: 'tundra' },
  { id: 'swamp', name: 'Swamp', h: [78, 55, 28, 115], biome: 'swamp' },
  { id: 'shore', name: 'Shore', h: [40, 30, 190, 10], biome: 'shore' },
  { id: 'reef', name: 'Coral reef', h: [350, 20, 170, 50], biome: 'warm' },
  { id: 'kelp', name: 'Kelp forest', h: [88, 50, 30, 160], biome: 'kelp' },
  { id: 'polar', name: 'Polar sea', h: [195, 210, 175, 230], biome: 'polar' },
  { id: 'vents', name: 'Vent fire', h: [15, 45, 280, 330], biome: 'vents' },
  { id: 'royal', name: 'Royal', h: [272, 285, 45, 350], earn: 'society' },
  { id: 'gold', name: 'Gold leaf', h: [45, 40, 18, 0], earn: 'colonial' },
];
G.PALETTE = {}; G.PALETTES.forEach((x) => { G.PALETTE[x.id] = x; });
G.SAVED_LOOKS_MAX = 12;
// Look keys every body can share; the rest only carry over between bodies of the same kind.
G.UNIVERSAL_LOOK_KEYS = ['hue', 'belly', 'accent', 'accent2', 'pattern', 'finish', 'patScale', 'patDensity', 'eyes'];
G.EDITOR_COST = 2; // DNA to open the editor between milestones

// Real time: seconds per turn at each speed.
G.SPEEDS = [0, 2.4, 1.2, 0.6];

G.PREDATION = 0.34; // base chance per turn that each predator strikes
G.HARSH = 6;        // extra difficulty on every check; the Evolution Tree pays it back
G.BASE_POP = 8;      // max Population
G.START_POP = 4;
G.BASE_FOOD = 5;
G.FOOD_CAP = 10;
G.POP_SCALE = 10;   // Population is counted in individuals: about ten for every 'head' events are written for
G.GROWTH_COST = 3;   // spare Food needed for +1 Population
G.MAX_HOSTILITY = 5;

// Species names are built from these.
// Every species fills a niche. When one dies out, its niche opens and something new fills it.
//   size: range of body sizes (1 = ordinary)   cap: how big its population can grow
G.NICHES = [
  { id: 'apex', name: 'Apex predator', role: 'predator', diet: 'carn', size: [1.6, 2.4], cap: 6 },
  { id: 'hunter', name: 'Small hunter', role: 'predator', diet: 'carn', size: [0.6, 1.1], cap: 12 },
  { id: 'big_grazer', name: 'Big grazer', role: 'prey', diet: 'herb', size: [1.3, 2.2], cap: 14 },
  { id: 'small_grazer', name: 'Small grazer', role: 'prey', diet: 'herb', size: [0.35, 0.7], cap: 34 },
  { id: 'scavenger', name: 'Scavenger', role: 'rival', diet: 'omni', size: [0.6, 1.1], cap: 16 },
  { id: 'forager', name: 'Forager', role: 'rival', diet: 'omni', size: [0.8, 1.3], cap: 16 },
  { id: 'browser', name: 'Browser', role: 'neighbor', diet: 'herb', size: [0.7, 1.4], cap: 18 },
  { id: 'gentle_giant', name: 'Gentle giant', role: 'neighbor', diet: 'herb', size: [1.6, 2.6], cap: 8 },
];
// Which niches a new world starts with.
G.WORLD_NICHES = {
  cell: ['hunter', 'small_grazer', 'big_grazer', 'scavenger', 'forager', 'browser'],
  creature: ['apex', 'hunter', 'big_grazer', 'small_grazer', 'small_grazer', 'scavenger', 'forager', 'browser', 'gentle_giant'],
};

// Biomes: regions of the world map. Each has its own effects, scenery, events and parts.
// x, y place it on the world map (0-100); next lists the biomes you can migrate to from it.
// Cell biomes only matter once you are multicellular, and you only move between them by events.
G.BIOMES = {
  cell: [
    { id: 'vent', name: 'Thermal Vent', x: 50, y: 70, next: ['surface', 'mud'], mods: {}, desc: 'Warm, steady and dark. Nothing changes here.' },
    { id: 'surface', name: 'Sunlit Surface', x: 50, y: 20, next: ['vent', 'mud'], mods: { forageBonus: 2, damageReduce: -1 }, desc: 'Bright and full of food, but everything can see you.' },
    { id: 'mud', name: 'Mud Flats', x: 18, y: 55, next: ['vent', 'surface'], mods: { tou: 1, spd: -1 }, desc: 'Thick, safe mud. Slow going.' },
  ],
  land: [
    { id: 'plains', name: 'Open Plains', x: 50, y: 50, next: ['jungle', 'desert', 'tundra', 'swamp', 'shore'], mods: { spd: 1 }, danger: 1.15, hazards: ['dust', 'fire'], rule: 'Nowhere to hide: hunters find you a little more often, but the open ground suits the fast.', desc: 'Grass to the horizon. No surprises.' },
    { id: 'jungle', name: 'Jungle', x: 22, y: 28, next: ['plains', 'swamp'], mods: { cun: 1, forageBonus: 2, spd: -1 }, danger: 1.35, hazards: ['sickness', 'flood'], rule: 'Food everywhere, and hunters hidden in the leaves: attacks are a third more common, and fevers spread.', desc: 'Thick, hot and full of food, and of things hiding in the leaves.' },
    { id: 'desert', name: 'Desert', x: 78, y: 26, next: ['plains', 'tundra'], mods: { tou: 1, spd: 1, foodPerTurn: -2 }, danger: 0.7, hazards: ['drought', 'dust'], rule: 'Little to eat (−2 Food a turn) and droughts and sandstorms, but few hunters can live here.', desc: 'Scorching days, freezing nights, and little to eat. What lives here is tough.' },
    { id: 'tundra', name: 'Tundra', x: 80, y: 70, next: ['plains', 'desert'], mods: { maxPop: 4, foodPerTurn: -1, spd: -1 }, danger: 0.85, hazards: ['cold'], cold: true, rule: 'Herds grow big to keep warm, but blizzards come often, and cold blood struggles here.', desc: 'Cold, wide and lean. Herds grow big to keep warm.' },
    { id: 'swamp', name: 'Swamp', x: 20, y: 70, next: ['plains', 'jungle', 'shore'], mods: { forageBonus: 2, tou: -1 }, danger: 1.1, hazards: ['sickness', 'flood'], rule: 'Rich in food, but sickness and floods come three times as often.', desc: 'Rich, wet and sickly.' },
    { id: 'shore', name: 'Shore', x: 50, y: 88, next: ['plains', 'swamp'], mods: { forageBonus: 1, huntBonus: 1 }, danger: 1, hazards: ['flood', 'storm'], rule: 'Food from both land and sea, but storms and surges roll in from the water.', desc: 'Where the land meets the sea. From here you could return to the water.', crossing: true },
  ],
  sea: [
    { id: 'warm', name: 'Warm Seas', x: 50, y: 50, next: ['kelp', 'polar', 'vents', 'coast'], mods: {}, danger: 1, hazards: ['storm'], rule: 'The open blue: nothing in your favour, nothing against you.', desc: 'Blue water as far as you can see.' },
    { id: 'kelp', name: 'Kelp Forest', x: 22, y: 28, next: ['warm', 'coast'], mods: { forageBonus: 2, spd: -1 }, danger: 0.7, hazards: ['sickness'], rule: 'Hiding places everywhere: hunters find you far less often.', desc: 'Swaying forests full of food and hiding places.' },
    { id: 'polar', name: 'Polar Sea', x: 78, y: 26, next: ['warm', 'vents'], mods: { maxPop: 4, tou: 1, foodPerTurn: -1 }, danger: 0.9, hazards: ['cold', 'storm'], cold: true, rule: 'Big, tough life under the ice, but the cold bites, and cold blood struggles here.', desc: 'Icy water under floating ice. Big, tough life.' },
    { id: 'vents', name: 'Vent Fields', x: 80, y: 70, next: ['warm', 'polar'], mods: { dnaPerTurn: 2, foodPerTurn: -1 }, danger: 1, hazards: ['quake', 'sickness'], rule: 'Strange chemistry speeds up change (+2 DNA a turn), but the vents erupt and poison the water.', desc: 'Smoking vents on the sea floor. Strange chemistry speeds up change.' },
    { id: 'coast', name: 'Coast', x: 25, y: 80, next: ['warm', 'kelp'], mods: { huntBonus: 1, forageBonus: 1 }, danger: 1.1, hazards: ['flood', 'storm'], rule: 'Rich tide pools, but waves and storms batter the shore.', desc: 'Tide pools and beaches. From here you could crawl onto land.', crossing: true },
  ],
};
G.HOME_BIOME = { cell: 'vent', land: 'plains', sea: 'warm' };

// Seasons turn every 6 turns in the creature stage (the cell stage lives by a steady vent).
G.SEASONS = {
  land: [
    { id: 'spring', name: 'Spring', mods: { popPerTurn: 1 }, desc: 'Young everywhere: +1 Population per turn.' },
    { id: 'summer', name: 'Summer', mods: { forageBonus: 1 }, desc: 'Plenty: +1 Food while foraging.' },
    { id: 'autumn', name: 'Autumn', mods: { huntBonus: 1 }, desc: 'Fat prey: +1 Food while hunting.' },
    { id: 'winter', name: 'Winter', mods: { foodPerTurn: -2 }, desc: 'Lean times: −2 Food per turn.' },
  ],
  sea: [
    { id: 'bloom', name: 'Plankton bloom', mods: { forageBonus: 2 }, desc: 'The water turns green with food: +2 Food while foraging.' },
    { id: 'calm', name: 'Calm seas', mods: {}, desc: 'Nothing special.' },
    { id: 'storms', name: 'Storm season', mods: { spd: -1, huntBonus: 1 }, desc: 'Rough water: −1 Speed, but stunned prey: +1 Food while hunting.' },
    { id: 'cold', name: 'Cold currents', mods: { foodPerTurn: -1, tou: 1 }, desc: 'Cold and lean: −1 Food per turn, +1 Toughness.' },
  ],
};
G.SEASON_LENGTH = 6;

// Activities: long actions that play out over several turns, like CK3's.
//   target: 'species' needs a species to aim at   turns: fixed length (null = until done or stopped)
G.ACTIVITIES = [
  { id: 'migrate', name: 'Migrate', turns: 4, desc: 'Lead your kind to a neighbouring biome (see the Map tab). Costs 1 Food a turn on the road; when you arrive, most neighbours are new, and you find food and DNA. Only a clever kind (Cunning 6, or the Spark of Mind) can choose where it goes. You can move again after 10 turns.' },
  { id: 'war', name: 'Go to war', target: 'species', desc: 'Fight a species for its territory. Each turn your armies clash and the war score moves. Win and they are crushed; lose and you are.' },
  { id: 'court', name: 'Court', target: 'species', desc: 'Win a species over, turn by turn, with Charm, until they become your allies.' },
  { id: 'avoid', name: 'Avoid', target: 'species', desc: 'Keep out of a species\' way. While you avoid them they rarely attack you, but taking the long way round costs 2 Food a turn.' },
  { id: 'hunt', name: 'Hunt them', target: 'species', desc: 'Make one species your prey. Each turn you hunt them for food; big or fast prey can hurt you.' },
  { id: 'cross', name: 'Cross over', turns: 5, desc: 'From the Shore, return to the sea; from the Coast, crawl onto land. A 5-turn journey (−1 Food a turn) that costs a quarter of your kind. Parts that only work in your old home are lost, and new ones can grow.' },
  { id: 'scout', name: 'Scout', turns: 3, desc: 'Send scouts far and wide for 3 turns (−1 Food a turn). They always come back with something: a feeding ground, a part to borrow, or DNA. Scouts need 12 turns of rest afterwards.' },
];

G.SPECIES_NAMES = {
  cell: {
    first: ['Glimmer', 'Hook', 'Spiral', 'Murk', 'Vesicle', 'Thread', 'Bloom', 'Pip', 'Coil', 'Silt', 'Fizz', 'Wisp'],
    last: ['spores', 'jaws', 'lings', 'motes', 'whips', 'drifters', 'globs', 'rods', 'blebs', 'sparks'],
  },
  land: {
    first: ['Moss', 'Stripe', 'Bramble', 'Tusk', 'Gloom', 'Pebble', 'Thorn', 'Dusk', 'Reed', 'Ember', 'Frost', 'Mud', 'Bark', 'Ash'],
    last: ['backs', 'snouts', 'hoppers', 'maws', 'gliders', 'stalkers', 'trotters', 'crests', 'waddlers', 'horns', 'tails', 'skulkers'],
  },
  sea: {
    first: ['Reef', 'Kelp', 'Brine', 'Coral', 'Tide', 'Abyss', 'Pearl', 'Shoal', 'Foam', 'Murk', 'Salt', 'Drift'],
    last: ['fins', 'jaws', 'gliders', 'rays', 'eels', 'shells', 'singers', 'lurkers', 'swimmers', 'maws', 'crawlers', 'flukes'],
  },
};

// The roles other species play. Events look for a species with a matching role.
G.ROLES = {
  predator: 'Predator',
  prey: 'Prey',
  rival: 'Rival',
  neighbor: 'Neighbor',
};

// The "What's new" note on the title screen. Update it with every release.
G.VERSION = '21.11';
G.WHATS_NEW = {
  title: 'Patch 21.11: Rivals',
  items: [
    'Every lineage now meets a Rival: one named species that sets itself against you at the start of the Creature stage (or earlier, if a species comes to hate you). It is marked ⚔️ on the map and shown at the top of the World tab.',
    'It grows a level at each of your milestones and adapts to how you treat it: fight it and it grows a thick hide or bigger weapons, outrun it and it gets faster, outwit it and it grows wary, befriend it and it learns winning ways, leave it alone and it multiplies. Its checks use its own stats, so those adaptations matter.',
    'It follows you from stage to stage: the beast becomes a rival band, then a neighbour people, then a nation. It raids you, challenges you, spies on you, lures your young away, and sometimes offers a truce (which you can betray).',
    'End it your way from the Decisions tab: destroy it, make peace, absorb it (and keep half its strengths for good), or let the old feud go. If a rival outlives your lineage, it may come back in your next one. The Codex records how your rivalries ended.',
    'A new Decisions tab (tap your portrait): big moves you choose to make yourself, whenever you meet what they need, like Crusader Kings\' decisions. 37 of them across every stage: Seek new waters, Engulf a rival strain, Claim a territory, Dig a den, Challenge the apex predator, Split the tribe, Call a gathering of the bands, Move the capital, Outlaw the old ways, Found a great academy, Build a royal navy and more.',
    'Each decision shows what it needs (ticked when you have it) and what it costs, then opens its own event where you choose how it goes. Some are one-time choices, some can be repeated after a while.',
    'Many leave lasting effects for the rest of the stage, listed at the bottom of the tab and in the explanations of your numbers. A badge on the tab shows how many you can take right now.',
    'Eight new patterns (Speckles, Dapple, Chevrons, Scales, Eyespots, Marbled, Harlequin, Lightning) and four new finishes (Velvet, Pearl, Sparkle, Metallic).',
    'Every body plan gets its own looks: jellyfish bells (dome, tall, saucer, frilled), starfish arms (webbed, curled, knobbly), colony styles (bubbly, crystal, stacked), and collars for land creatures and serpents (hood, frill, mane, spiked crown). Serpents now show every pattern.',
    'Colour sets: four colours in one tap, from Tide to Coral Reef. Most open by visiting a biome.',
    'Looks to earn: many new looks open by playing (reaching a stage, winning on Hostility 2, finishing a Daily Run and more), for every lineage after. The Wardrobe tab in the Creature Editor lists them all and how to earn each.',
    'Saved looks: save a design in the Wardrobe tab, wear it again later, or mark it "For new lineages" so each new creature wears it from birth.',
    'Primordia has sound. Each place has its own ambience and soft music: bubbles in the first sea, swells and distant whale song in the ocean, wind and birds on land, a crackling fire for the Tribe, and bells once your people build towns.',
    'Effects mark the moments: a chime for an event (a deep drum when it is dangerous), notes for success and failure, a shimmer for mutations and discoveries, a fanfare for new stages and endings, and a falling tune for extinction.',
    'Options has a Sound switch and separate volumes for effects and for ambience and music. On an iPhone it follows the silent switch and plays alongside your own music. Sound starts after your first tap.',
    'In Safari, iPhones delete a website\'s saved data after 7 days of using Safari without opening it. The Home Screen app keeps its own save. If you play in Safari, the title screen now says so and walks you through moving to the Home Screen app, with a backup button.',
    'Backups: "Save a backup file" (to Files or iCloud Drive) keeps your progress even if the browser clears its data or you change phones. The game remembers your last backup and reminds you every two weeks or so.',
    'The game now asks the browser to keep its storage for good, where the browser allows it.',
    'The Daily Run (title screen, once you have reached the Creature stage): one world a day, the same for everyone, with its own archetype, home world and two complications, even ones you have not unlocked. +25% Genetic Memory on top, your best result of the day, a streak, and a Share button.',
    'Complications (Options): eight optional rules that make new lineages harder for more Genetic Memory: Lean Times, Fragile, Small Herd, Slow Genes, Few Choices, Blind Odds, Restless World and No Second Chances.',
    'Safer saves: the game keeps a backup copy of your progress (made when it opens and after every lineage) and uses it if your save is ever damaged; it warns you if your phone will not store your progress; and loading a save code can be undone from Options.',
    'Moving your save works properly now. Save codes are squeezed to about a twentieth of their old size, so they copy and paste in one go on a phone, and they end in :END so a cut-off code is spotted at once.',
    'In the other copy of the game (Safari or the home-screen app), tap Paste from clipboard in Options: no need to paste by hand. Spaces or words pasted around the code are ignored, and if something is wrong it says exactly what.',
    'Save as a file opens the Share menu on an iPhone (choose Save to Files). Older save codes still load.',
    'Add Primordia to your Home Screen (in Safari: Share, then Add to Home Screen). It opens full-screen with its own icon, and works without internet once it has been opened once.',
    'Updates arrive on their own: whenever you have a connection, the app loads the newest version.',
    'Move your save (Options): on an iPhone, Safari and the home-screen app keep separate saves. Copy your save code in one and paste it into the other, or save it as a file.',
    'Patch 21.3: a guide for your first lineage (replay it from Options).',
  ],
};

// ======================= UPDATE 20: THE RENAISSANCE =======================
// After the Union, your people become a nation among nations. Learning replaces Influence; each goal
// brings a new branch of the Reason tree, paid for with your people's resource like the Lore and the Law.
G.STAGES.renaissance = {
  name: 'Renaissance', turnName: 'Generation',
  drafts: [8, 20, 34, 50, 68, 90, 115, 142, 170, 200],
  milestones: [{ at: 0, event: 'renaissance_dawn' }, { at: 60, event: 'the_schism' }, { at: 125, event: 'the_great_fair' }],
  evolveAt: 250,
};
// Your nation's name, from your kind of society.
G.NATION_NAMES = {
  tool: { land: 'the Hearth Republics', sea: 'the Forge Leagues' },
  song: { land: 'the Choir Nations', sea: 'the Singing Commonwealth' },
  many: { land: 'the Lantern Principalities', sea: 'the Abyssal Courts' },
  swarm: { land: 'the Hive Dominions', sea: 'the Coral Crowns' },
  garden: { land: 'the Green Confederacy', sea: 'the Kelp Commonwealth' },
};
// The Age of Sail: how your nation sets out to meet the wider world (Update 21 carries it on).
G.RENAISSANCE_ENDINGS = {
  explore: { name: 'The Age of Discovery', desc: 'Your ships go further than anyone has ever gone, to see what is there.' },
  trade: { name: 'The Merchant Seas', desc: 'Your ships carry goods to every shore, and bring back fortunes.' },
  conquer: { name: 'The Iron Fleets', desc: 'Your ships carry armies, and every new shore is a prize.' },
};
G.REN_DEEDS = {
  rd_patron: 'You backed a patron of the arts and sciences.',
  rd_voyage: 'Your people sailed beyond the known coasts.',
  rd_league: 'You formed a league with a friendly nation.',
  rd_war: 'Your nation won a war.',
  rd_masterpiece: 'A city of yours became a wonder of the age.',
  rd_plague: 'Your nation lived through a great plague.',
};
G.SAIL_NEED = 13; // Reason ideas your nation must know before the Age of Sail
// The Reason tree. Bands: Inheritance (from how you united the region), Your people (your kind's own
// inventions), Inventions (grafted: each Learning goal lets you choose one of three; some need a
// Disposition), Movements (forks: arts and ideas that rule each other out), Faith (the Schism), Deeds,
// the Age of Sail (the Gate) and Beyond (one per Disposition).
G.REASON = [
  // ----- Inheritance: how you united the region -----
  { id: 'ri_conquest', band: 'inherit', road: 'conquest', name: 'The Conqueror\'s Peace', tier: 1, mods: { str: 2, influencePerTurn: 1 }, lean: 'war', desc: 'Everyone remembers how the region was won.' },
  { id: 'ri_trade', band: 'inherit', road: 'trade', name: 'The Old Markets', tier: 1, mods: { foodPerTurn: 2, influencePerTurn: 1 }, lean: 'peace', desc: 'The roads of the Union are roads of trade.' },
  { id: 'ri_faith', band: 'inherit', road: 'faith', name: 'The Faithful Union', tier: 1, mods: { cha: 2, influencePerTurn: 1 }, lean: 'guard', desc: 'One faith holds the nation together.' },
  // ----- Your people: each kind's own inventions -----
  { id: 'rp_tool_press', band: 'people', path: 'tool', name: { land: 'The Printing Press', sea: 'The Shell Press' }, tier: 1, mods: { influencePerTurn: 1, cun: 1 }, desc: 'A hundred copies of anything, in a day.' },
  { id: 'rp_tool_clock', band: 'people', path: 'tool', name: 'Clockwork', tier: 2, mods: { cun: 2 }, desc: 'Gears that keep time better than the sun.' },
  { id: 'rp_song_notation', band: 'people', path: 'song', name: 'Notation', tier: 1, mods: { influencePerTurn: 1, cha: 1 }, desc: 'Songs written down, so they are never lost.' },
  { id: 'rp_song_opera', band: 'people', path: 'song', name: 'Opera', tier: 2, mods: { cha: 2 }, desc: 'A story told entirely in song, for a whole city at once.' },
  { id: 'rp_many_optics', band: 'people', path: 'many', name: 'Optics', tier: 1, mods: { influencePerTurn: 1, cun: 1 }, desc: 'Lenses that bend the light your kind has always spoken in.' },
  { id: 'rp_many_cipher', band: 'people', path: 'many', name: 'Ciphers', tier: 2, mods: { cun: 2 }, desc: 'Colour-talk that only your own can read.' },
  { id: 'rp_swarm_vaults', band: 'people', path: 'swarm', name: 'Grand Vaults', tier: 1, mods: { maxPop: 3, influencePerTurn: 1 }, desc: 'Chambers so vast that a city lives inside one mound.' },
  { id: 'rp_swarm_order', band: 'people', path: 'swarm', name: 'The Perfect Order', tier: 2, mods: { tou: 2 }, desc: 'Every member, the right task, at the right time.' },
  { id: 'rp_garden_botany', band: 'people', path: 'garden', name: 'Botany', tier: 1, mods: { foodPerTurn: 1, influencePerTurn: 1 }, desc: 'Every plant named, drawn and understood.' },
  { id: 'rp_garden_graft', band: 'people', path: 'garden', name: 'Grafting', tier: 2, mods: { foodPerTurn: 2 }, desc: 'Two plants, one tree, the best of both.' },
  // ----- Inventions: grafted by Learning -----
  { id: 'rv_universities', band: 'invention', name: 'Universities', tier: 1, mods: { influencePerTurn: 1, cun: 1 }, desc: 'Places where learning is the only work.' },
  { id: 'rv_medicine', band: 'invention', name: 'Medicine', tier: 1, mods: { popPerTurn: 1, tou: 1 }, lean: 'peace', desc: 'Fevers broken, wounds closed, lives saved.' },
  { id: 'rv_cartography', band: 'invention', name: 'Cartography', tier: 1, mods: { exploreBonus: 2, spd: 1 }, desc: 'The whole region on one sheet.' },
  { id: 'rv_banking', band: 'invention', name: 'Banking', tier: 1, mods: { foodPerTurn: 1, influencePerTurn: 1 }, lean: 'peace', desc: 'Promises that can be traded like goods.' },
  { id: 'rv_steel', band: 'invention', name: 'Steel', tier: 1, mods: { str: 2 }, lean: 'war', desc: 'Harder, sharper, and it does not break.' },
  { id: 'rv_engineering', band: 'invention', name: 'Engineering', tier: 1, mods: { maxPop: 3, tou: 1 }, lean: 'guard', desc: 'Bridges, aqueducts, and walls that stand.' },
  { id: 'rv_astronomy', band: 'invention', name: 'Astronomy', tier: 2, mods: { cun: 2 }, desc: 'The sky, measured.' },
  { id: 'rv_anatomy', band: 'invention', name: 'Anatomy', tier: 2, mods: { popPerTurn: 1, cun: 1 }, desc: 'Look inside, and understand.' },
  { id: 'rv_perspective', band: 'invention', name: 'Perspective', tier: 2, mods: { cha: 2 }, lean: 'peace', desc: 'Paintings so real you could walk into them.' },
  { id: 'rv_shipwrights', band: 'invention', name: 'Shipwrights', tier: 2, mods: { exploreBonus: 2, foodPerTurn: 1 }, desc: 'Hulls that cross open water.' },
  { id: 'rv_fortresses', band: 'invention', name: 'Star Forts', tier: 2, mods: { tou: 2, damageReduce: 1 }, lean: 'guard', disposition: ['guard', 'war'], desc: 'Walls shaped so no wall can be climbed.' },
  { id: 'rv_firepowder', band: 'invention', name: { tool: 'Black Powder', song: 'Thunder Drums', many: 'Flash Ink', swarm: 'Acid Swarms', garden: 'Spore Clouds' }, tier: 3, mods: { str: 3 }, lean: 'war', disposition: ['war'], desc: 'A new and terrible way to fight.' },
  { id: 'rv_navigation', band: 'invention', name: 'Navigation', tier: 3, mods: { exploreBonus: 2, cun: 1 }, desc: 'Find your way anywhere, by the stars.' },
  { id: 'rv_exchange', band: 'invention', name: 'The Exchange', tier: 3, mods: { foodPerTurn: 2, influencePerTurn: 1 }, lean: 'peace', disposition: ['peace', 'guard'], desc: 'A hall where the whole world\'s goods are bought and sold.' },
  { id: 'rv_academies', band: 'invention', name: 'Academies', tier: 3, mods: { influencePerTurn: 2 }, desc: 'Learning that pays for itself.' },
  // ----- Movements: arts and ideas that rule each other out -----
  { id: 'rm_humanism', band: 'movement', name: 'Humanism', tier: 1, excl: 'rm_dogma', mods: { cun: 1, cha: 1 }, lean: 'peace', desc: 'Your people, not the gods, at the centre of everything.' },
  { id: 'rm_dogma', band: 'movement', name: 'Dogma', tier: 1, excl: 'rm_humanism', mods: { tou: 1, influencePerTurn: 1 }, lean: 'guard', desc: 'The old answers are the right ones.' },
  { id: 'rm_patronage', band: 'movement', name: 'Great Patrons', tier: 2, excl: 'rm_guilds', mods: { cha: 2 }, desc: 'The rich pay for genius, and show it off.' },
  { id: 'rm_guilds', band: 'movement', name: 'The Guilds', tier: 2, excl: 'rm_patronage', mods: { tou: 1, foodPerTurn: 1 }, lean: 'guard', desc: 'Every craft has its masters, and its rules.' },
  { id: 'rm_open_seas', band: 'movement', name: 'Open Seas', tier: 2, excl: 'rm_closed_ports', mods: { exploreBonus: 2, cha: 1 }, lean: 'peace', desc: 'Every ship welcome in every port.' },
  { id: 'rm_closed_ports', band: 'movement', name: 'Closed Ports', tier: 2, excl: 'rm_open_seas', mods: { tou: 1, str: 1 }, lean: 'war', desc: 'Our harbours, our rules, our guns.' },
  // ----- Faith: the Schism -----
  { id: 'rf_reformed', band: 'faith', schism: 'reform', name: 'The Reformed Faith', tier: 2, excl: 'rf_orthodox', mods: { cun: 1, influencePerTurn: 1 }, lean: 'peace', desc: 'The faith, made new for a new age.' },
  { id: 'rf_orthodox', band: 'faith', schism: 'hold', name: 'The True Faith', tier: 2, excl: 'rf_reformed', mods: { tou: 1, cha: 1 }, lean: 'guard', desc: 'Nothing changes. That is the point.' },
  { id: 'rf_tolerance', band: 'faith', schism: 'tolerate', name: 'Tolerance', tier: 2, mods: { cha: 2 }, rule: 'calm_presence', lean: 'peace', desc: 'Believe what you like, as long as you let others do the same.' },
  // ----- Deeds -----
  { id: 'rd_salons', band: 'deed', when: { deed: 'rd_patron' }, name: 'The Salons', tier: 2, mods: { influencePerTurn: 1, cha: 1 }, lean: 'peace', desc: 'Where artists, thinkers and the rich meet.' },
  { id: 'rd_new_worlds', band: 'deed', when: { deed: 'rd_voyage' }, name: 'Tales of New Shores', tier: 2, mods: { exploreBonus: 2, cun: 1 }, desc: 'Sailors\' stories of lands beyond the sea.' },
  { id: 'rd_the_league', band: 'deed', when: { deed: 'rd_league' }, name: 'The League', tier: 2, mods: { cha: 1, tou: 1 }, rule: 'calm_presence', lean: 'peace', desc: 'Nations that stand together.' },
  { id: 'rd_war_college', band: 'deed', when: { deed: 'rd_war' }, name: 'The War College', tier: 2, mods: { str: 2 }, rule: 'know_foe', lean: 'war', desc: 'Every war studied, so the next is won faster.' },
  { id: 'rd_wonder', band: 'deed', when: { deed: 'rd_masterpiece' }, name: 'A Wonder of the Age', tier: 2, mods: { influencePerTurn: 2 }, lean: 'guard', desc: 'People cross the world to see it.' },
  { id: 'rd_quarantine', band: 'deed', when: { deed: 'rd_plague' }, name: 'Quarantine', tier: 2, mods: { tou: 2 }, rule: 'last_refuge', lean: 'guard', desc: 'Never again will one sick city kill a nation.' },
  // ----- The Age of Sail: the Gate -----
  { id: 'sail_gate', band: 'gate', name: 'The Age of Sail', tier: 3, mods: { exploreBonus: 1 }, desc: 'Ships that can cross any sea. How you use them depends on your Disposition. This ends the Renaissance.' },
  // ----- Beyond: one per Disposition; they carry into the Colonial Age -----
  { id: 'rb_peace', band: 'beyond', disposition: 'peace', name: 'The Republic of Letters', tier: 3, mods: { cha: 2, influencePerTurn: 1 }, inherit: { cha: 2, cun: 1 }, req: { known: 12 }, lean: 'peace', desc: 'Thinkers of every nation, writing to each other.' },
  { id: 'rb_guard', band: 'beyond', disposition: 'guard', name: 'The Balance of Power', tier: 3, mods: { tou: 2, influencePerTurn: 1 }, inherit: { tou: 2, cun: 1 }, req: { known: 12 }, lean: 'guard', desc: 'No nation may rise too high: you see to it.' },
  { id: 'rb_war', band: 'beyond', disposition: 'war', name: 'The Standing Army', tier: 3, mods: { str: 2, influencePerTurn: 1 }, inherit: { str: 2, tou: 1 }, req: { known: 12 }, lean: 'war', desc: 'Soldiers who never go home, because there is always a war.' },
];
G.REASON_ID = {}; G.REASON.forEach((x) => { G.REASON_ID[x.id] = x; });
G.ACTIVITIES.push(
  { id: 'patronize', name: 'Back a patron', stage: 'renaissance', turns: 3, desc: 'Spend 5 of your people\'s resource on artists and thinkers: +2 Learning a turn while it lasts.' },
  { id: 'voyage', name: 'Send a voyage', stage: 'renaissance', turns: 3, desc: 'Ships sail beyond the known coasts (−4 Food): they come back with stories and +6 Learning.' },
  { id: 'league', name: 'Form a league', target: 'species', stage: 'renaissance', turns: 2, desc: 'A nation that is your ally (opinion 60 or more) joins you in a league: neither of you stands alone.' },
);
// Patronage: the Renaissance's own tree on the Evolution screen. Opens once you reach a Renaissance.
G.PATRONAGE = [
  { id: 'p_libraries', name: 'Old Libraries', col: 0, tier: 1, costs: [25, 55], desc: 'Every Renaissance begins with +10 Learning per level.' },
  { id: 'p_reason', name: 'Natural Philosophers', col: 1, tier: 1, costs: [30, 60, 100], desc: 'Reason ideas cost 10% less per level.' },
  { id: 'p_wealth', name: 'Old Fortunes', col: 2, tier: 1, costs: [25, 55], desc: 'Start every Renaissance with +6 of your people\'s resource per level.' },
  { id: 'p_envoys', name: 'Ambassadors', col: 3, tier: 1, costs: [25, 55], desc: 'Nations start 15 friendlier per level.' },
  { id: 'p_walls', name: 'Bastions', col: 4, tier: 1, costs: [30, 60], mods: { damageReduce: 1 }, desc: 'Raids kill one fewer per level in the Renaissance.' },
  { id: 'p_cun', name: 'Scholars', col: 5, tier: 1, costs: [30, 60], mods: { cun: 1 }, desc: '+1 Cunning per level in the Renaissance.' },
  { id: 'p_branches', name: 'Many Inventions', col: 0, tier: 2, req: ['p_libraries'], costs: [60], desc: 'Every new branch of Reason offers one more choice.' },
  { id: 'p_sail', name: 'Charts of the Ancients', col: 1, tier: 2, req: ['p_reason'], costs: [60, 120], desc: 'The Age of Sail needs two fewer Reason ideas per level, and its checks are 1 easier per level.' },
  { id: 'p_cha', name: 'Courtiers', col: 2, tier: 2, req: ['p_wealth'], costs: [45, 90], mods: { cha: 1 }, desc: '+1 Charm per level in the Renaissance.' },
  { id: 'p_str', name: 'Condottieri', col: 3, tier: 2, req: ['p_envoys'], costs: [45, 90], mods: { str: 1 }, desc: '+1 Strength per level in the Renaissance.' },
  { id: 'p_masters', name: 'Old Masters', col: 4, tier: 2, req: ['p_walls'], costs: [70], desc: 'Every Renaissance begins with one invention already known.' },
  { id: 'p_beyond', name: 'Visionaries', col: 5, tier: 2, req: ['p_cun'], costs: [70, 140], desc: 'Ideas Beyond the Age of Sail cost 15% less per level.' },
];

// ======================= UPDATE 21: THE COLONIAL AGE =======================
// After the Age of Sail, your nation becomes a crowned realm with lands across the sea. Prestige replaces
// Learning; each goal brings a new technology for the Crown tree. Your ruler founds a dynasty: heirs
// inherit by the law you choose, and colonies grow, trade, and can rebel.
G.STAGES.colonial = {
  name: 'Colonial Age', turnName: 'Generation',
  drafts: [8, 22, 38, 56, 78, 102, 130, 160, 192, 226, 262],
  milestones: [{ at: 0, event: 'colonial_dawn' }, { at: 70, event: 'the_succession' }, { at: 145, event: 'the_great_rebellion' }],
  evolveAt: 300,
};
// Your realm's name, from your kind of people.
G.REALM_NAMES = {
  tool: { land: 'the Hearth Crown', sea: 'the Forge Realm' },
  song: { land: 'the Song Throne', sea: 'the Tide Throne' },
  many: { land: 'the Shifting Crown', sea: 'the Lantern Realm' },
  swarm: { land: 'the Great Hive', sea: 'the Coral Throne' },
  garden: { land: 'the Living Crown', sea: 'the Kelp Throne' },
};
// Lands across the sea: names for colonies, built from two parts.
G.COLONY_SYLLABLES = { a: ['New ', 'Far ', 'Port ', 'Cape ', 'Isle of ', 'Fort ', 'Bay of ', 'Saint '], b: ['Amber', 'Thorn', 'Haven', 'Mire', 'Gale', 'Coral', 'Ember', 'Dusk', 'Spire', 'Wren', 'Salt', 'Morrow'] };
// The Imperial Crown: the Colonial Age's endings, one road for each Disposition.
G.COLONIAL_ENDINGS = {
  federation: { name: 'A Commonwealth of Shores', desc: 'Your colonies become partners, not possessions: a family of free lands under one crown.' },
  dominion: { name: 'The Crown of Many Lands', desc: 'One throne, many peoples, held together by law, roads and ships.' },
  conquest: { name: 'The Iron Empire', desc: 'Every shore your ships touched now flies your flag, whether it wanted to or not.' },
};
G.CROWN_DEEDS = {
  cd_colony: 'You founded your first colony across the sea.',
  cd_heir: 'An heir came to the throne without a war.',
  cd_marriage: 'Your dynasty married into another royal house.',
  cd_rebellion: 'You ended a rebellion in your colonies.',
  cd_trade: 'Your merchants built a trading post overseas.',
  cd_war: 'You won a war across the sea.',
};
G.CROWN_NEED = 13; // Crown ideas your realm must hold before the Imperial Crown
// The Crown tree: the Colonial Age's own tree.
//   inherit: one idea for how your ships met the world (the Age of Sail)
//   people: your kind of people's own technology (two each; land and sea names)
//   tech: technologies grafted by Prestige drafts (tiers I-III; some only for some Dispositions)
//   law: Crown laws that rule each other out (succession, rule, trade, the navy)
//   dynasty: ideas grafted by the deeds of your dynasty and your colonies
//   gate: the Imperial Crown; beyond: one per Disposition, carried into the age of empires
G.CROWN = [
  // ----- Inheritance: the Age of Sail -----
  { id: 'ci_explore', band: 'inherit', road: 'explore', name: 'The Great Charts', tier: 1, mods: { cun: 2, exploreBonus: 2 }, lean: 'peace', desc: 'You went to see what was there, and you wrote it all down.' },
  { id: 'ci_trade', band: 'inherit', road: 'trade', name: 'The Merchant Fleets', tier: 1, mods: { cha: 1, foodPerTurn: 2 }, lean: 'peace', desc: 'Every shore is a market.' },
  { id: 'ci_conquer', band: 'inherit', road: 'conquer', name: 'The Admiralty', tier: 1, mods: { str: 2, damageReduce: 1 }, lean: 'war', desc: 'Ships of the line, and the men to sail them.' },
  // ----- Your people: technology changed by your kind -----
  { id: 'cp_tool_engines', band: 'people', path: 'tool', name: { land: 'Steam Engines', sea: 'Vent Dynamos' }, tier: 1, mods: { influencePerTurn: 1, str: 1 }, desc: 'Fire made to work: wheels turn by themselves.' },
  { id: 'cp_tool_rails', band: 'people', path: 'tool', name: { land: 'Railways', sea: 'Cable Roads' }, tier: 2, mods: { foodPerTurn: 2, spd: 1 }, desc: 'The whole realm, a day apart.' },
  { id: 'cp_song_telegraph', band: 'people', path: 'song', name: 'Song-Wires', tier: 1, mods: { influencePerTurn: 1, cha: 1 }, desc: 'A song sung in the capital is heard in every colony by nightfall.' },
  { id: 'cp_song_halls', band: 'people', path: 'song', name: 'Concert Halls', tier: 2, mods: { cha: 2 }, desc: 'Every colony gets a hall, and every hall the same songs.' },
  { id: 'cp_many_light', band: 'people', path: 'many', name: 'Living Light', tier: 1, mods: { influencePerTurn: 1, cun: 1 }, desc: 'Cities that glow, and signals that cross a sea in an instant.' },
  { id: 'cp_many_bureau', band: 'people', path: 'many', name: 'The Cipher Bureau', tier: 2, mods: { cun: 2 }, desc: 'Every secret in the world, read before breakfast.' },
  { id: 'cp_swarm_factories', band: 'people', path: 'swarm', name: 'Living Factories', tier: 1, mods: { influencePerTurn: 1, tou: 1 }, desc: 'Workers bred for one task each, and a mound that never stops making.' },
  { id: 'cp_swarm_mound', band: 'people', path: 'swarm', name: { land: 'The Great Mound', sea: 'The Great Reef' }, tier: 2, mods: { maxPop: 4 }, desc: 'A home the size of a mountain.' },
  { id: 'cp_garden_ships', band: 'people', path: 'garden', name: 'Grown Ships', tier: 1, mods: { influencePerTurn: 1, exploreBonus: 2 }, desc: 'Hulls grown from seed, that heal their own leaks.' },
  { id: 'cp_garden_medicine', band: 'people', path: 'garden', name: 'Spore Medicine', tier: 2, mods: { popPerTurn: 1, tou: 1 }, desc: 'A cure for every fever, grown in a jar.' },
  // ----- Technology: grafted by Prestige -----
  { id: 'ct_steam', band: 'tech', name: 'Steamships', tier: 1, mods: { exploreBonus: 2, spd: 1 }, desc: 'Ships that sail against the wind.' },
  { id: 'ct_telegraph', band: 'tech', name: 'The Telegraph', tier: 1, mods: { influencePerTurn: 1, cun: 1 }, desc: 'News in minutes, not months.' },
  { id: 'ct_vaccines', band: 'tech', name: 'Vaccines', tier: 1, mods: { popPerTurn: 1, tou: 1 }, lean: 'peace', desc: 'Plagues that never come.' },
  { id: 'ct_canals', band: 'tech', name: 'Great Canals', tier: 1, mods: { foodPerTurn: 2 }, lean: 'guard', desc: 'A new sea road, dug by hand.' },
  { id: 'ct_rifles', band: 'tech', name: { tool: 'Rifles', song: 'War Horns', many: 'Lightning Ink', swarm: 'Soldier Castes', garden: 'Thorn Walls' }, tier: 1, mods: { str: 2 }, lean: 'war', desc: 'A new and better way to win.' },
  { id: 'ct_press', band: 'tech', name: 'Newspapers', tier: 2, mods: { cha: 2 }, desc: 'Everyone reads the same news, and believes it.' },
  { id: 'ct_factories', band: 'tech', name: 'Factories', tier: 2, mods: { influencePerTurn: 1, maxPop: 3 }, desc: 'Towns that make more in a day than villages did in a year.' },
  { id: 'ct_companies', band: 'tech', name: 'Chartered Companies', tier: 2, mods: { foodPerTurn: 1, influencePerTurn: 1 }, lean: 'peace', disposition: ['peace', 'guard'], desc: 'Merchants with their own ships, and their own flags.' },
  { id: 'ct_ironclads', band: 'tech', name: 'Ironclads', tier: 2, mods: { tou: 2, damageReduce: 1 }, lean: 'guard', disposition: ['guard', 'war'], desc: 'Ships that shrug off cannon.' },
  { id: 'ct_electricity', band: 'tech', name: 'Electricity', tier: 3, mods: { influencePerTurn: 2 }, desc: 'Light without fire, and power without muscle.' },
  { id: 'ct_world_fair', band: 'tech', name: 'The World\'s Fair', tier: 3, mods: { cha: 2, influencePerTurn: 1 }, lean: 'peace', disposition: ['peace'], desc: 'Every people on earth, in one great hall.' },
  { id: 'ct_dreadnoughts', band: 'tech', name: 'Dreadnoughts', tier: 3, mods: { str: 3 }, lean: 'war', disposition: ['war'], desc: 'One ship that outguns a fleet.' },
  { id: 'ct_steel_cities', band: 'tech', name: 'Cities of Steel', tier: 3, mods: { maxPop: 4, tou: 1 }, desc: 'Towers that touch the clouds.' },
  // ----- Crown laws: forks -----
  { id: 'cl_primogeniture', band: 'law', name: 'Primogeniture', tier: 1, excl: 'cl_elective', mods: { tou: 1, influencePerTurn: 1 }, lean: 'guard', rule: 'heir_sure', desc: 'The eldest inherits, always. No arguments, no wars.' },
  { id: 'cl_elective', band: 'law', name: 'Elective Crown', tier: 1, excl: 'cl_primogeniture', mods: { cha: 1, cun: 1 }, lean: 'peace', rule: 'heir_chosen', desc: 'The council chooses the best of the family.' },
  { id: 'cl_direct', band: 'law', name: 'Direct Rule', tier: 2, excl: 'cl_councils', mods: { str: 1, influencePerTurn: 1 }, lean: 'war', desc: 'Governors from the capital, and soldiers to back them.' },
  { id: 'cl_councils', band: 'law', name: 'Colonial Councils', tier: 2, excl: 'cl_direct', mods: { cha: 1, foodPerTurn: 1 }, lean: 'peace', rule: 'calm_colonies', desc: 'Each colony governs itself, mostly.' },
  { id: 'cl_free_trade', band: 'law', name: 'Free Trade', tier: 2, excl: 'cl_mercantile', mods: { foodPerTurn: 2 }, lean: 'peace', desc: 'Every port open to every ship.' },
  { id: 'cl_mercantile', band: 'law', name: 'The Navigation Acts', tier: 2, excl: 'cl_free_trade', mods: { influencePerTurn: 1, str: 1 }, lean: 'guard', desc: 'Our colonies trade with us, and only with us.' },
  // ----- Dynasty and colonies: deeds -----
  { id: 'cd_first_shore', band: 'dynasty', when: { deed: 'cd_colony' }, name: 'The First Shore', tier: 2, mods: { exploreBonus: 2, influencePerTurn: 1 }, desc: 'Where your people first stepped onto a new land.' },
  { id: 'cd_long_line', band: 'dynasty', when: { deed: 'cd_heir' }, name: 'The Long Line', tier: 2, mods: { cha: 1, tou: 1 }, lean: 'guard', desc: 'A family that has ruled for longer than anyone remembers.' },
  { id: 'cd_royal_cousins', band: 'dynasty', when: { deed: 'cd_marriage' }, name: 'Royal Cousins', tier: 2, mods: { cha: 2 }, lean: 'peace', desc: 'Half the thrones of the world are family now.' },
  { id: 'cd_garrisons', band: 'dynasty', when: { deed: 'cd_rebellion' }, name: 'Garrisons', tier: 2, mods: { tou: 2 }, lean: 'war', rule: 'calm_colonies', desc: 'Never again will a colony rise.' },
  { id: 'cd_trading_houses', band: 'dynasty', when: { deed: 'cd_trade' }, name: 'Trading Houses', tier: 2, mods: { foodPerTurn: 2 }, lean: 'peace', desc: 'Families of merchants in every port.' },
  { id: 'cd_war_office', band: 'dynasty', when: { deed: 'cd_war' }, name: 'The War Office', tier: 2, mods: { str: 2 }, lean: 'war', rule: 'know_foe', desc: 'Every war planned years before it starts.' },
  // ----- The Imperial Crown: the Gate -----
  { id: 'crown_gate', band: 'gate', name: 'The Imperial Crown', tier: 3, mods: { cha: 1 }, desc: 'A crown for a realm that spans the sea. How it rules depends on your Disposition. This ends the Colonial Age.' },
  // ----- Beyond: one per Disposition; carried into the age of empires -----
  { id: 'cb_peace', band: 'beyond', disposition: 'peace', name: 'The Commonwealth', tier: 3, mods: { cha: 2, influencePerTurn: 1 }, inherit: { cha: 2, foodPerTurn: 1 }, req: { known: 12 }, lean: 'peace', desc: 'Free peoples who choose the same crown.' },
  { id: 'cb_guard', band: 'beyond', disposition: 'guard', name: 'The Concert of Crowns', tier: 3, mods: { tou: 2, influencePerTurn: 1 }, inherit: { tou: 2, cun: 1 }, req: { known: 12 }, lean: 'guard', desc: 'The great crowns agree: no one of them will rule them all.' },
  { id: 'cb_war', band: 'beyond', disposition: 'war', name: 'The Grand Army', tier: 3, mods: { str: 2, influencePerTurn: 1 }, inherit: { str: 2, tou: 1 }, req: { known: 12 }, lean: 'war', desc: 'An army that marches across continents.' },
];
G.CROWN_ID = {}; G.CROWN.forEach((x) => { G.CROWN_ID[x.id] = x; });
G.MIND_RULES.heir_sure = 'Your heirs inherit without a crisis.';
G.MIND_RULES.heir_chosen = 'When a ruler dies, the council chooses the best heir: your new ruler gets an extra good trait.';
G.MIND_RULES.calm_colonies = 'Your colonies grow restless more slowly.';
G.ACTIVITIES.push(
  { id: 'colonize', name: 'Found a colony', stage: 'colonial', turns: 3, desc: 'Ships, settlers and supplies cross the sea (−8 Food, −6 of your people\'s resource): a new colony, which adds Prestige every turn.' },
  { id: 'trade_post', name: 'Build a trading post', target: 'species', stage: 'colonial', turns: 3, desc: 'A people across the sea who like you (opinion 10 or more) let your merchants settle: +1 resource a turn, and they like you more.' },
  { id: 'subjugate', name: 'Conquer a people', target: 'species', stage: 'colonial', turns: 4, desc: 'War across the sea: if your armies win, their land becomes a restless colony.' },
  { id: 'royal_tour', name: 'A royal tour', stage: 'colonial', turns: 2, desc: 'Your ruler visits the colonies: every colony grows calmer.' },
);
// Charters: the Colonial Age's own tree on the Evolution screen. Opens once you reach the Colonial Age.
G.CHARTERS = [
  { id: 'c_prestige', name: 'Old Glory', col: 0, tier: 1, costs: [30, 65], desc: 'Every Colonial Age begins with +10 Prestige per level.' },
  { id: 'c_crown', name: 'Royal Academies', col: 1, tier: 1, costs: [35, 70, 110], desc: 'Crown ideas cost 10% less per level.' },
  { id: 'c_fleet', name: 'The Old Fleet', col: 2, tier: 1, costs: [30, 65], desc: 'Every Colonial Age begins with one colony per level.' },
  { id: 'c_heirs', name: 'Royal Nurseries', col: 3, tier: 1, costs: [30, 65], desc: 'Your heirs are born with one extra good trait per level.' },
  { id: 'c_calm', name: 'Loyal Governors', col: 4, tier: 1, costs: [35, 70], desc: 'Colonies grow restless a third more slowly per level.' },
  { id: 'c_tou', name: 'Fortified Ports', col: 5, tier: 1, costs: [35, 70], mods: { tou: 1 }, desc: '+1 Toughness per level in the Colonial Age.' },
  { id: 'c_branches', name: 'Many Technologies', col: 0, tier: 2, req: ['c_prestige'], costs: [70], desc: 'Every new branch of the Crown tree offers one more choice.' },
  { id: 'c_gate', name: 'Ancient Regalia', col: 1, tier: 2, req: ['c_crown'], costs: [70, 130], desc: 'The Imperial Crown needs two fewer Crown ideas per level, and its checks are 1 easier per level.' },
  { id: 'c_cha', name: 'Court Splendour', col: 2, tier: 2, req: ['c_fleet'], costs: [50, 100], mods: { cha: 1 }, desc: '+1 Charm per level in the Colonial Age.' },
  { id: 'c_str', name: 'Marines', col: 3, tier: 2, req: ['c_heirs'], costs: [50, 100], mods: { str: 1 }, desc: '+1 Strength per level in the Colonial Age.' },
  { id: 'c_tech', name: 'Inventors\' Guild', col: 4, tier: 2, req: ['c_calm'], costs: [80], desc: 'Every Colonial Age begins with one technology already known.' },
  { id: 'c_beyond', name: 'Imperial Dreams', col: 5, tier: 2, req: ['c_tou'], costs: [80, 150], desc: 'Ideas Beyond the Imperial Crown cost 15% less per level.' },
];

// First-time tips. Each shows once, the first time its feature appears, whatever run that is.
// Checked in order; the first unseen one whose condition holds is shown.
G.TUTORIALS = [
  { id: 'welcome', title: 'Your lineage begins', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'map',
    text: 'Time flows on this map while the game runs. Pause or speed up with the buttons at the top. Your Population (top left) eats Food every turn; spare Food grows more of you. Tap any herd to look closer.' },
  // One tip per archetype, the first time you play it.
  ...G.ARCHETYPES.map((a) => ({ id: `arch_${a.id}`, title: `The ${a.name}`, when: (run, ui) => ui.screen === 'game' && run && run.phase === 'map' && run.archetype === a.id && run.turn >= 3,
    text: `Every archetype breaks one rule. ${a.ruleDesc}` })),
  { id: 'event', title: 'Events', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'event' && !G.EVENT[run.event.id].milestone && !G.EVENT[run.event.id].finale,
    text: 'Events pause time. Each answer shows the stat it tests and your chance of success, or "Certain". Some answers need a part, a diet or a trait; locked ones say what they need.' },
  { id: 'draft', title: 'Mutations', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'draft',
    text: 'DNA brings a new part. Grow it into an empty slot, merge it with the part already there (keeping both), or replace that part. The grey box under each part compares it with what you have now. The right pairs evolve into something stronger.' },
  { id: 'instinct', title: 'Instinct', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'map' && run.turn >= 4,
    text: 'Your Instinct (top right) decides what your kind does each turn: forage, hunt, explore or hide. It changes how you find food and which events find you.' },
  { id: 'multicellular', title: 'Many cells, one body', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'map' && run.stage === 'cell' && run.multicellular,
    text: 'You are multicellular. Two new slots are open (Senses and Organ), your symmetry is fixed for good, and the world around you now matters: some places are richer or harsher than others.' },
  { id: 'creature', title: 'The Creature stage', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'map' && run.stage === 'creature',
    text: 'You have a real body now. The Body plan tab changes your number of legs or fins. The Look tab opens the Creature Editor. The Activities tab lets you migrate, go to war, court, hunt or scout.' },
  { id: 'tribe', title: 'The Tribe stage', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'map' && run.stage === 'tribe',
    text: 'Your kind is a people now. Population is now your members, and Ideas replace DNA: each goal brings a Discovery. Your body no longer changes, but what it can do decides which discoveries come. The People tab shows your leader, your Fire or Song, and your talents. Reach the Founding to choose your people\'s future.' },
  { id: 'decisions', title: 'Decisions', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'map' && !ui.sheet && G.decisionsReady(run) > 0,
    text: 'You can make a Decision: a big move you choose to make yourself, like claiming a territory or splitting the tribe. Tap your portrait, then the Decisions tab. Each one lists what it needs and what it costs.' },
  { id: 'crowding', title: 'Crowded', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'map' && run.pop > G.maxPop(run),
    text: 'You have grown past your comfortable size. You can keep going, up to half as many again, but crowded members eat twice, young cost more and crowding sickness takes a tenth of the excess every turn.' },
  { id: 'biomes', title: 'Biomes', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'map' && run.stage === 'creature' && run.biome && run.biome !== G.HOME_BIOME[run.habitat],
    text: 'Every biome has its own rules: how often hunters find you, which disasters come, and what it gives and takes. Tap a biome on the World Map tab to see them before you migrate.' },
  { id: 'society', title: 'The Society stage', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'map' && run.stage === 'society',
    text: 'Your people live in many settlements now. Influence replaces Ideas, and each goal brings a Tradition. Found and build settlements from Activities to grow bigger and earn more. The Society tab shows your settlements and neighbours; the Council tab shows who might turn against your ruler.' },
  { id: 'council', title: 'Your council', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'map' && G.civ(run) && (run.council || []).some((c) => c.loyalty < 0),
    text: 'One of your councillors is losing faith in your ruler. Below −25 loyalty they may start plotting, and below −30 they stop helping. Feasts, honours and kind rulers keep them loyal; some traditions do too.' },
  { id: 'traditions', title: 'The Law tree', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'draft' && run.stage === 'society',
    text: 'Your Society has its own tree: the Law tree. Each new branch of Law you choose is added to it; adopt it now with your people\'s resource, or later from the Law tab. Some laws come in opposed pairs. Your council, your faith, your deeds and your neighbours add ideas of their own, and the Union needs enough Influence and Law. Your Disposition badge shows how you can unite the region.' },
  { id: 'renaissance', title: 'The Renaissance', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'map' && run.stage === 'renaissance',
    text: 'Your people are one nation now, among other nations. Learning replaces Influence, and each goal brings an invention for your Reason tree. The Nation tab shows how each neighbour nation feels about you: peaceful 🕊️, territorial 🛡️ or warlike ⚔️. Back patrons, send voyages and form leagues from Activities.' },
  { id: 'reason', title: 'The Reason tree', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'draft' && run.stage === 'renaissance',
    text: 'The Renaissance has its own tree: the Reason tree. Choose an invention to add; take it up now with your people\'s resource, or later from the Reason tab. Movements come in opposed pairs, the Schism adds a faith idea, and your deeds add more. The Age of Sail needs enough Learning and Reason. Your Disposition can still shift until then, and it decides what your ships will do.' },
  { id: 'colonial', title: 'The Colonial Age', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'map' && run.stage === 'colonial',
    text: 'Your nation is a crown with lands across the sea. Prestige replaces Learning, and each goal brings a technology for your Crown tree. Found colonies from Activities: they bring Food and Prestige, but grow restless and can rebel. Your heir waits in the Realm tab; a Crown law decides how they inherit.' },
  { id: 'crown', title: 'The Crown tree', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'draft' && run.stage === 'colonial',
    text: 'The Colonial Age has its own tree: the Crown tree. Choose a technology to add; take it up now with your people\'s resource, or later from the Crown tab. Crown laws come in opposed pairs, and the deeds of your dynasty add more. The Imperial Crown needs enough Prestige and Crown ideas, and your Disposition decides what kind of crown it will be.' },
  { id: 'unrest', title: 'Restless colonies', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'map' && run.stage === 'colonial' && (run.colonies || []).some((c) => c.unrest >= 60),
    text: 'One of your colonies is close to rebellion. At 100 unrest it breaks away for good. A royal tour (Activities) calms every colony; Colonial Councils and Garrisons in the Crown tree keep them calm for longer.' },
  { id: 'nation_war', title: 'War', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'map' && run.stage === 'renaissance' && run.species.some((x) => x.nation && !x.extinct && x.nationDisp === 'war' && x.opinion < 0 && !x.treaty),
    text: 'A warlike nation that dislikes you can invade. Your Strength and Toughness decide whether your armies hold; a league ally helps. Lose a battle and they take a city, and if they take your last one, your nation falls. Gifts, treaties and leagues keep them away; found new cities from Activities.' },
  { id: 'kind_many', title: 'Many Minds', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'map' && run.stage === 'tribe' && run.path === 'many',
    text: 'Your den is small, but every member is clever. Keep 3 Light or more and you are hidden: hunters and raiders find you far less often. Watch and learn copies discoveries from rival bands.' },
  { id: 'kind_swarm', title: 'The Swarm', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'map' && run.stage === 'tribe' && run.path === 'swarm',
    text: 'You have a Queen instead of a leader. Choose your castes in the People tab, let Brood hatch into new members, and spend Brood to grow your home.' },
  { id: 'kind_garden', title: 'Gardeners', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'map' && run.stage === 'tribe' && run.path === 'garden',
    text: 'Growth feeds you, and tamed species feed you twice as well. But big gardens attract Blight: Tend the gardens now and then to keep it away.' },
  { id: 'discoveries', title: 'Discoveries', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'draft' && run.stage === 'tribe',
    text: 'Your people have their own tree now: the Lore tree. Each new branch you choose is added to it; learn it now with your Fire, Song or other resource, or later from the Lore tab. Two branches that belong together open a combination. Leaders, their ambitions and your deeds add branches of their own, and the Founding (which ends the Tribe stage) needs enough Ideas and Lore.' },
  { id: 'succession', title: 'Leaders', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'event' && run.event.id === 'succession',
    text: 'Each candidate has a background and two traits that change your people while they lead, and an ambition. A leader opens their own Way in the Lore tree while they lead, and one who fulfils their ambition grafts a whole branch of Legacies for good. Leaders grow old, so the choice comes round again.' },
  { id: 'mind_grown', title: 'A tree grown from your choices', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'map' && run.stage === 'creature' && run.mind && run.innovations.length >= 2,
    text: 'Your Mind tree grows new branches from your body and from what happens to you: lived through a flood, beaten a rival, made a friend. Ideas marked ★ change the rules. Your Awakening ends the stage, so learn any Beyond-the-Gate ideas you want before it: they carry on into every stage after. The Book tab keeps every page.' },
  { id: 'paths', title: 'Paths of Mind', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'event' && ['spark_of_mind', 'path_choice'].includes(run.event.id),
    text: 'How your kind thinks depends on what it is. Your body and history open some Paths and lock others (locked ones say what they need). Your Path is fixed for this lineage and decides which ending, and which kind of people, you can become.' },
  { id: 'foundations', title: 'Foundations', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'event' && ['the_frame', 'the_young', 'the_blood'].includes(run.event.id),
    text: 'Some choices shape your whole kind: your frame, how you have young, and your blood. Each has real costs as well as strengths, and you can only choose once. They show in the Body plan tab.' },
  { id: 'seasons', title: 'Seasons', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'map' && run.stage === 'creature' && run.stageTurn > G.SEASON_LENGTH,
    text: 'The seasons have turned. Each season changes food and speed for a while (see the chip under your Population). Warm blood shrugs off winter; cold blood slows down in it.' },
  { id: 'species', title: 'Other species', when: (run, ui) => ui.screen === 'game' && run && ui.speciesView != null,
    text: 'Every species has needs and an opinion of you, from hostile to allied. Compare your stats before you pick a fight. The buttons start an Activity aimed at them.' },
  { id: 'giants', title: 'The Age of Giants', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'map' && run.era >= 2,
    text: 'The world has grown dangerous: every blow hurts more, and a huge new predator has arrived. Keep your herd fed and your armor up until your kind finds the Spark of Mind.' },
  { id: 'mind', title: 'The Mind', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'mind',
    text: 'Your kind can think. Pick an idea to research, and Insight flows into it each turn. Your tree grows from your starting cell (roots), where you live (land, sea and home) and your Path of Mind. Research the Awakening at the top of your Path to try to become a people.' },
  { id: 'extinct', title: 'Extinction is not the end', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'end' && run.result && !run.result.victory,
    text: 'Every lineage earns Genetic Memory, win or lose. Spend it on the Evolution Tree to make the next one stronger. The evolutions you discovered can appear in future drafts, and your fossils wait in the Fossil Record.' },
  { id: 'tree', title: 'The Evolution Tree', when: (run, ui) => ui.screen === 'unlocks',
    text: 'Spend Genetic Memory on lasting upgrades: more Population, Food and DNA, better stats, lower DNA goals, and Twin sockets that let one slot hold two parts. Lower rows open once the row above is bought.' },
  { id: 'fossils', title: 'Fossils', when: (run, ui) => ui.screen === 'fossils',
    text: 'Each milestone leaves a fossil. Keep your favourites in amber, and you can revive one later to play on from that moment (it earns a little less Genetic Memory).' },
];
G.TUTORIAL = {}; G.TUTORIALS.forEach((t) => { G.TUTORIAL[t.id] = t; });

// ======================= FIRST STEPS: THE GUIDE =======================
// A guided first run. Each step points at one thing on screen. "hold" steps stop the clock and wait for
// "Next"; the others wait for you to do the thing they ask (done), and "pause" ones stop the clock meanwhile. Steps run in order: a step only shows
// once every step it comes after is done. "tips" names the first-time tips the step replaces.
const onMap = (run, ui) => ui.screen === 'game' && run && run.phase === 'map' && !ui.sheet && !ui.editor && ui.viewer == null;
G.GUIDE = [
  { id: 'g_hello', hold: true, tips: ['welcome'], when: (run, ui) => onMap(run, ui) && run.stage === 'cell',
    title: 'Welcome to Primordia',
    text: (run) => `This is your lineage, the ${G.lineageName(run)}: a few cells in a warm sea, marked "You" on the map. The clock is stopped while I show you around. Your first goal is to survive and grow until you become multicellular.` },
  { id: 'g_pop', hold: true, after: 'g_hello', target: '.res.pop', when: onMap,
    title: 'Population',
    text: 'This is how many of you there are. If it ever reaches 0, your lineage is extinct. You can tap any number up here to see where it comes from.' },
  { id: 'g_food', hold: true, after: 'g_pop', target: '.res.food', when: onMap,
    title: 'Food',
    text: 'Your cells eat every turn. The small number is what you gain or lose each turn. Spare Food grows more of you; running out shrinks you.' },
  { id: 'g_dna', hold: true, after: 'g_food', target: '.evo', when: onMap,
    title: 'DNA',
    text: 'You earn DNA every turn. When the bar fills, you get a mutation: a new part for your body.' },
  { id: 'g_instinct_auto', hold: true, after: 'g_dna', target: '.instinct-btn', tips: ['instinct'], when: (run, ui) => onMap(run, ui) && G.gimmick(run) === 'drifter',
    title: 'Instinct',
    text: 'Your Instinct is what your cells spend each turn doing: foraging, hunting, exploring or hiding. You are a Drifter, so the current chooses for you. Other kinds of life choose for themselves.' },
  { id: 'g_instinct', pause: true, after: 'g_dna', target: '.instinct-btn', tips: ['instinct'], when: (run, ui) => onMap(run, ui) && G.gimmick(run) !== 'drifter',
    done: (run, ui) => ui.sheet === 'instinct',
    title: 'Instinct',
    text: 'Your Instinct is what your cells spend each turn doing. Tap it.' },
  { id: 'g_instinct_pick', after: 'g_instinct', target: '.sheet .instincts', when: (run, ui) => ui.sheet === 'instinct', done: (run, ui) => !ui.sheet,
    title: 'Pick one',
    text: 'Forage finds plants, Hunt finds meat, Explore finds new things, Hide keeps you safe. Tap one, then close this with ✕.' },
  { id: 'g_play', after: ['g_dna'], target: '.speeds .play', when: (run, ui) => onMap(run, ui) && ['g_instinct_auto', 'g_instinct_pick'].some((x) => G.guideDone(x)),
    done: (run, ui) => ui.speed > 0 || run.phase !== 'map',
    title: 'Start the clock',
    text: 'Press play. Time runs on the map until something happens; then it stops so you can choose. The button next to it changes the speed.' },
  { id: 'g_event', tips: ['event'], after: 'g_play', target: '#modal .options', light: true, place: 'top', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'event' && !G.EVENT[run.event.id].finale,
    done: (run) => run.phase !== 'event',
    title: 'Something happened',
    text: 'Read the story, then pick an answer. Each says how likely it is to work. Answers you cannot take say what they need.' },
  { id: 'g_draft', tips: ['draft'], after: 'g_play', target: '#modal', light: true, place: 'top', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'draft' && run.stage === 'cell',
    done: (run) => run.phase !== 'draft',
    title: 'A mutation',
    text: 'Pick one new part. "Grow it" puts it in an empty slot. The grey box shows how it compares with what you have. Some pairs of parts evolve into something better.' },
  { id: 'g_body', pause: true, after: 'g_draft', target: '.portrait-btn', when: onMap,
    done: (run, ui) => !!ui.sheet,
    title: 'Your body',
    text: 'Tap your portrait to see your body, your stats and your parts.' },
  { id: 'g_tabs', hold: true, after: 'g_body', target: '.sheet .tabs', when: (run, ui) => ui.screen === 'game' && !!ui.sheet,
    title: 'Everything about your lineage',
    text: 'These tabs show your body, traits, Instinct, Activities, the world and your story so far. Close this with ✕ when you are done.' },
  { id: 'g_loop', hold: true, after: 'g_tabs', target: '.evo', when: onMap,
    title: 'That is the loop',
    text: 'Grow, answer events and take mutations. Keep your Population fed and your DNA coming. Tap any other herd on the map to see who they are and what they want. Good luck!' },
  { id: 'g_multi', hold: true, tips: ['multicellular'], after: 'g_loop', target: '.portrait-btn', when: (run, ui) => onMap(run, ui) && run.stage === 'cell' && run.multicellular,
    title: 'Many cells, one body',
    text: 'You are multicellular! Two new slots are open (Senses and an Organ), and where you live now matters. Keep evolving: the next goal takes you out of the cell stage for good.' },
  { id: 'g_creature', hold: true, tips: ['creature'], when: (run, ui) => onMap(run, ui) && run.stage === 'creature',
    title: 'A real creature',
    target: '.portrait-btn',
    text: 'You have a real body now. Open your portrait: the Body plan tab changes your legs or fins, the Look tab changes how you look, and Activities lets you migrate, hunt, court or fight. Other species now have opinions of you.' },
  { id: 'g_end', hold: true, tips: ['extinct'], target: '[data-act="go"][data-arg="unlocks"]', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'end' && run.result && !run.result.victory,
    title: 'Extinction is not the end',
    text: 'Every lineage earns Genetic Memory, even one that dies out. Spend it in the Evolution Tree to make the next lineage stronger. Most players get a creature within their first few lineages.' },
  { id: 'g_tree', hold: true, tips: ['tree'], when: (run, ui) => ui.screen === 'unlocks',
    title: 'The Evolution Tree',
    text: 'Buy upgrades that last for every future lineage: more Population and Food, better stats, cheaper goals. Lower rows open once you own the one above. Then start a New lineage from the title screen.' },
];
G.GUIDE_STEP = {}; G.GUIDE.forEach((g) => { G.GUIDE_STEP[g.id] = g; });
G.GUIDE_TIPS = new Set(G.GUIDE.flatMap((g) => g.tips || []));

// Gene Affinities (late game): spend Genetic Memory to make a family of mutations turn up more
// often in drafts. Each level doubles, triples, then quadruples the family's draft weight.
G.FLIGHT_PARTS = ['skin_flaps_f', 'flight_feathers', 'wing_membranes', 'feathered_wings', 'true_wings', 'insect_wings', 'gliding_fins', 'down_feathers', 'tail_feathers'];
G.AFFINITIES = [
  { id: 'flight', name: 'Wings', desc: 'Flaps, feathers and every kind of wing.', match: (p) => (p.tags || []).includes('flight') || G.FLIGHT_PARTS.includes(p.id) },
  { id: 'venom', name: 'Venom', desc: 'Venomous fangs, stings, quills and glands.', match: (p) => (p.keywords || []).includes('venom') },
  { id: 'armor', name: 'Armor', desc: 'Plates, shells, scales and spines.', match: (p) => (p.keywords || []).includes('armor') },
  { id: 'swift', name: 'Speed', desc: 'Fast legs, fins and tails.', match: (p) => (p.keywords || []).includes('swift') },
  { id: 'glow', name: 'Glow', desc: 'Lights, lures and shining skin.', match: (p) => (p.keywords || []).includes('glow') },
  { id: 'grasp', name: 'Hands', desc: 'Anything that can grab: hands, arms, tentacles and trunks.', match: (p) => (p.tags || []).includes('grasp') },
  { id: 'senses', name: 'Senses', desc: 'Eyes, ears, whiskers and stranger senses.', match: (p) => p.slot === 'senses' },
  { id: 'limbs', name: 'Limbs', desc: 'The limb mutations that grow legs, arms and fins.', match: (p) => !!p.limbMod || !!p.limbEvo },
];
G.AFFINITY_COSTS = [30, 60, 100];
G.AFFINITY = {}; G.AFFINITIES.forEach((a) => { G.AFFINITY[a.id] = a; });

// How hard each start is (shown on the setup screen). Harder starts are meant for later, not avoided.
G.DIFFICULTY_NAMES = { 1: 'Gentle', 2: 'Tricky', 3: 'Hard' };

// ======================= THE TRIBE STAGE =======================
// Your kind has become a people: a band of a few dozen members with a named leader.
// Ideas replace DNA; Discoveries replace parts; Members replace Population.
// Update 14 brings the Toolmakers (a Tribe on land, a Shell Clan at sea) and the Singers
// (a Choir on land, a Pod at sea). The other Paths follow in Update 15.
G.STAGES.tribe = {
  name: 'Tribe Stage', turnName: 'Year',
  drafts: [5, 13, 22, 32, 43, 55, 68, 82, 97, 112],
  milestones: [{ at: 0, event: 'first_{path}' }, { at: 34, event: 'strangers' }, { at: 70, event: 'elders' }, { at: 88, event: 'more_strangers' }],
  evolveAt: 120,
};
G.TRIBE_PATHS = ['tool', 'song', 'many', 'swarm', 'garden'];

// Each kind of people: its name, its special resource and the keepers who tend it.
G.KINDS = {
  tool: {
    land: { name: 'Tribe', band: 'tribe', resource: 'Fire', icon: '🔥', keeper: 'firekeeper', camp: 'camp', first: 'First Fire' },
    sea: { name: 'Shell Clan', band: 'clan', resource: 'Vent-heat', icon: '♨️', keeper: 'heat-keeper', camp: 'den', first: 'The Warm Vent' },
    desc: 'Toolmakers craft. Your {resource} warms you through the cold and keeps hunters away, and you can spend it to craft gear for your people (Activities: Craft).',
  },
  song: {
    land: { name: 'Choir', band: 'choir', resource: 'Song', icon: '🎵', keeper: 'songkeeper', camp: 'roost', first: 'First Song' },
    sea: { name: 'Pod', band: 'pod', resource: 'Song', icon: '🎵', keeper: 'songkeeper', camp: 'gathering', first: 'First Song' },
    desc: 'Singers remember in songs. Your Song is your people\'s memory: it makes you charming and clever, and at 6 or more rival bands sour on you half as fast, but when many of you die at once, verses are lost, and with them, discoveries (Activities: Teach the songs).',
  },
  many: {
    land: { name: 'Den', band: 'den', resource: 'Light', icon: '✨', keeper: 'lightkeeper', camp: 'lair', first: 'First Light' },
    sea: { name: 'Deep Den', band: 'den', resource: 'Light', icon: '✨', keeper: 'lightkeeper', camp: 'lair', first: 'First Light' },
    desc: 'Many Minds are few, but each one is brilliant. Your Light is color and glow: at 3 or more it hides you (attacks are rarer). You learn by watching others (Activities: Watch and learn), and moving your lair costs nothing.',
  },
  swarm: {
    land: { name: 'Hive', band: 'hive', resource: 'Brood', icon: '🥚', keeper: 'nurse', camp: 'mound', first: 'First Queen', leader: 'Queen' },
    sea: { name: 'Reef-colony', band: 'colony', resource: 'Brood', icon: '🥚', keeper: 'nurse', camp: 'reef', first: 'First Queen', leader: 'Queen' },
    desc: 'The Swarm has a Queen, not a leader, and castes, not individuals (choose them in the People tab). Brood hatches into new members, and your one great building keeps growing (Activities: Grow your home).',
  },
  garden: {
    land: { name: 'Grove', band: 'grove', resource: 'Growth', icon: '🌱', keeper: 'gardener', camp: 'grove', first: 'First Harvest' },
    sea: { name: 'Kelp Garden', band: 'garden', resource: 'Growth', icon: '🌱', keeper: 'gardener', camp: 'garden', first: 'First Harvest' },
    desc: 'Gardeners farm. Every 4 Growth feeds you 1 Food a turn, and tamed species feed you twice as well and guard your gardens. But the more you grow, the likelier Blight becomes (Activities: Tend the gardens keeps it away).',
  },
};

// The Swarm's castes: chosen in the People tab.
G.CASTES = {
  workers: { name: 'Workers', mods: { foodPerTurn: 2, forageBonus: 1 }, desc: 'More food.' },
  soldiers: { name: 'Soldiers', mods: { str: 2, tou: 1 }, desc: 'Stronger and tougher.' },
  nurses: { name: 'Nurses', mods: { maxPop: 3, specialPerTurn: 1 }, desc: 'More members and more Brood.' },
};

// Leaders: a name and two traits. When a leader dies, you choose the next one.
G.LEADER_SYLLABLES = { a: ['A', 'Ka', 'Mo', 'Ri', 'Tu', 'Ne', 'Sha', 'Lo', 'Ve', 'Zu', 'Ori', 'Ema', 'Ush', 'Ilo', 'Bra'], b: ['sha', 'ro', 'na', 'ki', 'lu', 'ven', 'tor', 'ra', 'mi', 'dun', 'eth', 'ka', 'sel'] };
G.LEADER_TRAITS = {
  brave: { name: 'Brave', mods: { str: 1 } },
  wise: { name: 'Wise', mods: { ideasPerTurn: 1, discoveryCost: -15 } },
  kind: { name: 'Kind', mods: { cha: 1 } },
  sturdy: { name: 'Sturdy', mods: { tou: 1 } },
  quick: { name: 'Quick', mods: { spd: 1 } },
  clever: { name: 'Clever', mods: { cun: 1, discoveryCost: -10 } },
  cruel: { name: 'Cruel', mods: { str: 2, cha: -1 } },
  lazy: { name: 'Lazy', mods: { ideasPerTurn: -1, tou: 1, discoveryCost: 15 } },
  curious: { name: 'Curious', mods: { cun: 1, exploreBonus: 1, discoveryCost: -5 } },
  fearful: { name: 'Fearful', mods: { spd: 1, str: -1 } },
  generous: { name: 'Generous', mods: { cha: 1, foodPerTurn: -1, maxPop: 1 } },
  keen: { name: 'Keeper-born', mods: { specialPerTurn: 1, discoveryCost: -10 } },
};
// Every leader wants something. Achieve it during their rule and they leave a legacy your people keep for good,
// into the Society stage and beyond.
G.AMBITIONS = {
  conquer: { name: 'Conqueror', want: 'win a war or a raid against a rival people', legacy: { str: 1, tou: 1 } },
  learn: { name: 'Sage', want: 'make 3 discoveries', legacy: { discoveryCost: -10, ideasPerTurn: 1 } },
  grow: { name: 'Builder', want: 'grow your people by half', legacy: { maxPop: 3 } },
  befriend: { name: 'Peacemaker', want: 'win the friendship of a rival people (opinion 50 or more)', legacy: { cha: 2 } },
  keep: { name: 'Keeper', want: 'gather {resource} to 20', legacy: { specialPerTurn: 1 } },
  tame: { name: 'Tamer', want: 'tame a wild species', legacy: { foodPerTurn: 1, cha: 1 } },
};
// Where each leader comes from, and what that gives while they rule.
G.LEADER_BACKGROUNDS = [
  { id: 'hunter', name: 'Hunter', text: 'the best hunter of their generation', mods: { str: 1 } },
  { id: 'keeper', name: 'Keeper-raised', text: 'raised beside the {resource}', mods: { specialPerTurn: 1 } },
  { id: 'elder', name: 'Elder', text: 'the oldest still standing', mods: { cun: 1, discoveryCost: -10 }, life: -6 },
  { id: 'child', name: 'Heir', text: "the last leader's child", mods: { cha: 1 } },
  { id: 'stranger', name: 'Stranger', text: 'a stranger who joined as a child', mods: { spd: 1, exploreBonus: 1 } },
  { id: 'healer', name: 'Healer', text: 'a healer', mods: { popPerTurn: 1 } },
  { id: 'young', name: 'Young', text: 'young and untested', mods: { ideasPerTurn: 1 }, life: 8 },
];
G.LEADER_BACKGROUND = {}; G.LEADER_BACKGROUNDS.forEach((x) => { G.LEADER_BACKGROUND[x.id] = x; });

// What each temperament (your starting archetype) adds in the Tribe stage.
G.TRIBE_TEMPER = {
  hunter: { mods: { str: 1, huntBonus: 2 }, rule: 'Hunts bring back 2 more Food, and rival bands fear you.' },
  herd: { mods: { maxPop: 3, tou: 1 }, rule: 'Bigger and harder to wipe out.' },
  bond: { mods: { cha: 2 }, rule: 'Taming other species is much easier.' },
  taker: { mods: { cun: 1, foodPerTurn: 1 }, rule: 'Beat a rival band and you steal one of their discoveries.' },
  many: { mods: { maxPop: 4, growthCost: -1 }, rule: 'Great numbers, quickly grown.' },
  mask: { mods: { cun: 2 }, rule: 'You win others over with Cunning instead of Charm.' },
  wanderer: { mods: { spd: 1, exploreBonus: 2 }, rule: 'Moving camp is quicker and always teaches you something.' },
};

// Discoveries: drafted 1 of 3 like parts. Pairs combine into something better (`from`).
//   path      only for that Path of Mind (leave out for any)
//   habitat   only on land or at sea
//   talent    needs something in your body: hands, voice, glow, venom, armor, wings, eyes, speed
G.DISCOVERIES = [
  // ----- Anyone -----
  { id: 'shared_meals', name: 'Shared Meals', mods: { cha: 1, foodPerTurn: 1 }, desc: 'Everyone eats together.' },
  { id: 'night_watch', name: 'Night Watch', mods: { tou: 1, cun: 1 }, desc: 'Someone is always awake.' },
  { id: 'herb_lore', name: 'Herb Lore', mods: { popPerTurn: 1 }, desc: 'This leaf eases a fever; that one stops bleeding.' },
  { id: 'trail_signs', name: 'Trail Signs', mods: { spd: 1, exploreBonus: 1 }, desc: 'Marks that say "food this way".' },
  { id: 'storytelling', name: 'Storytelling', mods: { ideasPerTurn: 1 }, desc: 'Tales of the old days, told at night.' },
  { id: 'grief_rites', name: 'Grief Rites', mods: { cha: 1, tou: 1 }, desc: 'The dead are remembered together.' },
  // ----- From your body -----
  { id: 'stone_tools', name: 'Stone Tools', talent: 'hands', habitat: 'land', mods: { str: 1, forageBonus: 1 }, desc: 'A sharp edge, held in the hand.' },
  { id: 'shell_tools', name: 'Shell Tools', talent: 'hands', habitat: 'sea', mods: { str: 1, forageBonus: 1 }, desc: 'A shell to pry, a stone to crack.' },
  { id: 'baskets', name: 'Baskets', talent: 'hands', habitat: 'land', mods: { foodCap: 5 }, desc: 'Carry more than your arms can hold.' },
  { id: 'nets', name: 'Weed Nets', talent: 'hands', habitat: 'sea', mods: { foodCap: 5 }, desc: 'Woven weed holds the catch.' },
  { id: 'shelters', name: 'Shelters', talent: 'hands', mods: { maxPop: 2, tou: 1 }, desc: 'A roof against the weather.' },
  { id: 'spears', name: 'Spears', talent: 'hands', mods: { str: 2 }, desc: 'Reach farther than your teeth.' },
  { id: 'calls', name: 'Calls', talent: 'voice', mods: { cha: 1, cun: 1 }, desc: 'A sound for every danger and every friend.' },
  { id: 'drumming', name: 'Drumming', talent: 'voice', mods: { ideasPerTurn: 1 }, desc: 'Rhythms that carry ideas.' },
  { id: 'lure_lights', name: 'Lure-Lights', talent: 'glow', mods: { huntBonus: 2 }, desc: 'A light in the dark brings the curious close.' },
  { id: 'venom_darts', name: 'Venom Darts', talent: 'venom', mods: { str: 2 }, desc: 'A scratch is enough.' },
  { id: 'shell_shields', name: 'Shell Shields', talent: 'armor', mods: { tou: 2 }, desc: 'Old shells, carried in front.' },
  { id: 'sky_scouts', name: 'Sky Scouts', talent: 'wings', mods: { exploreBonus: 2, spd: 1 }, desc: 'Fliers who see the land from above.' },
  { id: 'lookouts', name: 'Lookouts', talent: 'eyes', mods: { tou: 1, cun: 1 }, desc: 'So many eyes, watching every way.' },
  { id: 'runners', name: 'Runners', talent: 'speed', mods: { spd: 2 }, desc: 'Messengers faster than any hunter.' },
  // ----- Toolmakers -----
  { id: 'fire_pit', name: 'Fire Pit', path: 'tool', habitat: 'land', mods: { specialPerTurn: 1, tou: 1 }, desc: 'A ring of stones keeps the fire alive.' },
  { id: 'vent_hearth', name: 'Vent Hearth', path: 'tool', habitat: 'sea', mods: { specialPerTurn: 1, tou: 1 }, desc: 'A sheltered nook beside the warm vent.' },
  { id: 'cooking', name: 'Cooking', path: 'tool', mods: { foodPerTurn: 1, popPerTurn: 1 }, desc: 'Cooked food goes further and makes you stronger.' },
  { id: 'knapping', name: 'Knapping', path: 'tool', mods: { str: 1, cun: 1 }, desc: 'The art of the perfect edge.' },
  { id: 'cloaks', name: 'Hide Cloaks', path: 'tool', habitat: 'land', mods: { tou: 2 }, desc: 'Warm against the winter.' },
  { id: 'kelp_wraps', name: 'Kelp Wraps', path: 'tool', habitat: 'sea', mods: { tou: 2 }, desc: 'Bound weed against cold and stings.' },
  { id: 'rafts', name: 'Rafts', path: 'tool', habitat: 'land', mods: { exploreBonus: 2 }, desc: 'Cross the river with everything you own.' },
  { id: 'shell_floats', name: 'Shell Floats', path: 'tool', habitat: 'sea', mods: { exploreBonus: 2 }, desc: 'Carry loads on the current.' },
  // ----- Singers -----
  { id: 'lullabies', name: 'Lullabies', path: 'song', mods: { growthCost: -1, cha: 1 }, desc: 'Songs for the young.' },
  { id: 'echo_maps', name: 'Echo Maps', path: 'song', mods: { exploreBonus: 2 }, desc: 'Sing, listen, and know the shape of the land or sea.' },
  { id: 'song_lines', name: 'Song-Lines', path: 'song', mods: { specialPerTurn: 1 }, desc: 'Every road has its verse.' },
  { id: 'chorus_hunts', name: 'Chorus Hunts', path: 'song', mods: { huntBonus: 2 }, desc: 'Drive the prey with song.' },
  { id: 'teaching_songs', name: 'Teaching Songs', path: 'song', mods: { ideasPerTurn: 1 }, desc: 'Everything worth knowing, set to a tune.' },
  { id: 'mourning_song', name: 'Mourning Song', path: 'song', mods: { cha: 1, tou: 1 }, desc: 'Sung for those who are gone.' },
  // ----- Many Minds -----
  { id: 'color_speech', name: 'Color Speech', path: 'many', mods: { cha: 1, cun: 1 }, desc: 'Whole sentences in a ripple of skin.' },
  { id: 'mimicry', name: 'Mimicry', path: 'many', mods: { cun: 2 }, desc: 'Look like a rock, a weed, or something with teeth.' },
  { id: 'puzzle_minds', name: 'Puzzle Minds', path: 'many', mods: { ideasPerTurn: 1 }, desc: 'Every lid, latch and knot, opened.' },
  { id: 'hidden_lairs', name: 'Hidden Lairs', path: 'many', mods: { tou: 1, damageReduce: 1 }, desc: 'A home nobody else can find.' },
  { id: 'climbing_paths', name: 'Climbing Paths', path: 'many', habitat: 'land', mods: { spd: 1, exploreBonus: 2 }, desc: 'Routes through the treetops.' },
  { id: 'ink_clouds', name: 'Ink Clouds', path: 'many', habitat: 'sea', mods: { spd: 1, tou: 1 }, desc: 'Vanish in a cloud of dark.' },
  // ----- The Swarm -----
  { id: 'tunnels', name: 'Tunnels', path: 'swarm', habitat: 'land', mods: { maxPop: 3, tou: 1 }, desc: 'Down and down, room for everyone.' },
  { id: 'coral_vaults', name: 'Coral Vaults', path: 'swarm', habitat: 'sea', mods: { maxPop: 3, tou: 1 }, desc: 'Chambers grown in living stone.' },
  { id: 'scent_trails', name: 'Scent Trails', path: 'swarm', mods: { forageBonus: 2 }, desc: 'Follow the scent to the food.' },
  { id: 'royal_jelly', name: 'Royal Jelly', path: 'swarm', mods: { specialPerTurn: 1 }, desc: 'Food fit for a queen, and her brood.' },
  { id: 'swarm_tactics', name: 'Swarm Tactics', path: 'swarm', mods: { str: 2 }, desc: 'Everywhere at once.' },
  { id: 'nurseries', name: 'Nurseries', path: 'swarm', mods: { popPerTurn: 1, growthCost: -1 }, desc: 'The young are raised by everyone.' },
  // ----- Gardeners -----
  { id: 'seed_saving', name: 'Seed Saving', path: 'garden', habitat: 'land', mods: { foodPerTurn: 1, foodCap: 3 }, desc: 'Keep the best for next year.' },
  { id: 'spore_beds', name: 'Spore Beds', path: 'garden', habitat: 'sea', mods: { foodPerTurn: 1, foodCap: 3 }, desc: 'Plant the reef with what you want to grow.' },
  { id: 'compost', name: 'Compost', path: 'garden', mods: { specialPerTurn: 1 }, desc: 'Nothing is wasted.' },
  { id: 'weeding', name: 'Weeding', path: 'garden', mods: { tou: 1, cun: 1 }, desc: 'Pull out the bad before it spreads.' },
  { id: 'living_fences', name: 'Living Fences', path: 'garden', mods: { tou: 2 }, desc: 'Thorns, or stinging weed, grown in a ring.' },
  { id: 'herding', name: 'Herding', path: 'garden', mods: { foodPerTurn: 1, cha: 1 }, desc: 'Other species, kept and cared for.' },
  // ----- Combinations -----
  { id: 'hafted_axes', name: 'Hafted Axes', from: ['stone_tools', 'spears'], mods: { str: 3, forageBonus: 1 }, desc: 'Stone, bound to wood.' },
  { id: 'shell_lances', name: 'Shell Lances', from: ['shell_tools', 'spears'], mods: { str: 3, forageBonus: 1 }, desc: 'A shell blade on a long stalk.' },
  { id: 'hardened_spears', name: 'Fire-Hardened Spears', from: ['spears', 'fire_pit'], mods: { str: 4 }, desc: 'Points made hard in the flames.' },
  { id: 'vent_blades', name: 'Vent-Tempered Blades', from: ['spears', 'vent_hearth'], mods: { str: 4 }, desc: 'Shell tempered in the heat of the deep.' },
  { id: 'longhouse', name: 'Longhouse', from: ['shelters', 'fire_pit'], mods: { maxPop: 5, tou: 1 }, desc: 'One great home around one great fire.' },
  { id: 'warm_den', name: 'Warm Den', from: ['shelters', 'vent_hearth'], mods: { maxPop: 5, tou: 1 }, desc: 'A home built around the vent.' },
  { id: 'food_stores', name: 'Food Stores', from: ['baskets', 'cooking'], mods: { foodCap: 8, foodPerTurn: 2 }, desc: 'Smoked, dried and saved for winter.' },
  { id: 'kelp_larders', name: 'Kelp Larders', from: ['nets', 'cooking'], mods: { foodCap: 8, foodPerTurn: 2 }, desc: 'Catch kept fresh in woven weed.' },
  { id: 'feasts', name: 'Feasts', from: ['shared_meals', 'cooking'], mods: { cha: 2, foodPerTurn: 2 }, desc: 'Food, fire and stories, all night long.' },
  { id: 'poison_spears', name: 'Poison Spears', from: ['venom_darts', 'spears'], mods: { str: 5 }, desc: 'Nothing survives a second strike.' },
  { id: 'sentinels', name: 'Sentinels', from: ['lookouts', 'night_watch'], mods: { tou: 2, damageReduce: 1 }, desc: 'Watchers who never sleep.' },
  { id: 'ancestor_tales', name: 'Ancestor Tales', from: ['storytelling', 'grief_rites'], mods: { ideasPerTurn: 2, cha: 1 }, desc: 'The dead still teach the living.' },
  { id: 'signal_drums', name: 'Signal Drums', from: ['calls', 'drumming'], mods: { cha: 2, exploreBonus: 1 }, desc: 'Messages across whole valleys.' },
  { id: 'great_routes', name: 'Great Routes', from: ['echo_maps', 'song_lines'], mods: { exploreBonus: 3, specialPerTurn: 1 }, desc: 'A song for every road in the world.' },
  { id: 'song_school', name: 'Song School', from: ['lullabies', 'teaching_songs'], mods: { ideasPerTurn: 2, growthCost: -1 }, desc: 'The young learn everything in song.' },
  { id: 'singing_lure', name: 'Singing Lure', from: ['chorus_hunts', 'lure_lights'], mods: { huntBonus: 4 }, desc: 'Prey come to the song, and the light.' },
  { id: 'herbal_healers', name: 'Healers', from: ['herb_lore', 'grief_rites'], mods: { popPerTurn: 2, cha: 1 }, desc: 'Some of your people know how to mend others.' },
  { id: 'living_paint', name: 'Living Paint', from: ['color_speech', 'mimicry'], mods: { cun: 3, cha: 1 }, desc: 'Your skin can say anything, or nothing at all.' },
  { id: 'lantern_lures', name: 'Lantern Lures', from: ['lure_lights', 'color_speech'], mods: { huntBonus: 4, cha: 1 }, desc: 'Lights that speak, and lights that lie.' },
  { id: 'vanishing', name: 'The Vanishing', from: ['hidden_lairs', 'mimicry'], mods: { damageReduce: 2, cun: 1 }, desc: 'Hunters never see you twice.' },
  { id: 'great_mound', name: 'Great Galleries', from: ['tunnels', 'nurseries'], mods: { maxPop: 6, popPerTurn: 1 }, desc: 'A city beneath the ground.' },
  { id: 'living_reef', name: 'Living Vaults', from: ['coral_vaults', 'nurseries'], mods: { maxPop: 6, popPerTurn: 1 }, desc: 'A city grown from coral.' },
  { id: 'army_columns', name: 'Army Columns', from: ['swarm_tactics', 'scent_trails'], mods: { str: 3, forageBonus: 2 }, desc: 'A river of bodies, going where it likes.' },
  { id: 'orchards', name: 'Orchards', from: ['seed_saving', 'compost'], mods: { foodPerTurn: 3, specialPerTurn: 1 }, desc: 'Trees planted for grandchildren.' },
  { id: 'kelp_fields', name: 'Kelp Fields', from: ['spore_beds', 'compost'], mods: { foodPerTurn: 3, specialPerTurn: 1 }, desc: 'Rows of kelp, as far as you can see.' },
  { id: 'herd_gardens', name: 'Pastures', from: ['herding', 'living_fences'], mods: { foodPerTurn: 2, tou: 2 }, desc: 'Fenced, fed and safe.' },
  { id: 'medicine_garden', name: 'Medicine Garden', from: ['herb_lore', 'weeding'], mods: { popPerTurn: 2, tou: 1 }, desc: 'Every cure, grown on purpose.' },
];
// ======================= UPDATE 18: THE LORE TREE =======================
// The Tribe stage's own tree. Discoveries are its ideas, paid for with your people's resource.
// Bands (rows): People (your kind's own discoveries, always there), Branches (grafted: each Ideas goal
// lets you choose one of three to add), Combinations (when both halves are in the tree), Leaders (a
// leader's Way, open while they lead), Legacies (grafted by a fulfilled ambition), Deeds (grafted by
// what your people did), the Founding (the Gate: ends the Tribe stage) and Beyond the Founding.
//   lore   trunk | graft | combo | way | legacy | deed | gate | beyond (set below for the old ones)
//   when   { bg } (a leader's background), { amb } (a fulfilled ambition), { deed }
//   req    { known: n } (Lore ideas known), { some, n }; `inherit` mods apply in the Society stage on
//   `lean` and `rule` work as in the Mind tree.
G.DEEDS = {
  deed_tamed: 'Your people tamed another species.',
  deed_totem: 'Your people chose a totem.',
  deed_war: 'Your people beat a rival band.',
  deed_peace: 'A rival band became your ally.',
  deed_raid: 'Your people lived through a raid.',
  deed_migrate: 'Your people moved to a new land.',
  deed_ceremony: 'Your people held a great ceremony.',
  deed_near_end: 'Your people were almost wiped out.',
};
G.FOUNDING_NEED = 8; // Lore ideas your people must know before the Founding
G.DISCOVERIES.push(
  // ----- Leaders: a leader's Way, open while they lead (kept once learned) -----
  { id: 'way_hunter', lore: 'way', when: { bg: 'hunter' }, name: "The Hunter's Way", mods: { str: 1, huntBonus: 2 }, lean: 'war', desc: 'Taught by the best hunter of a generation.' },
  { id: 'way_keeper', lore: 'way', when: { bg: 'keeper' }, name: "The Keeper's Way", mods: { specialPerTurn: 1, tou: 1 }, lean: 'guard', desc: 'The old keeper shows everyone how it is done.' },
  { id: 'way_elder', lore: 'way', when: { bg: 'elder' }, name: "The Elders' Way", mods: { cun: 1, ideasPerTurn: 1 }, lean: 'peace', desc: 'Listen to the old ones, and you will not repeat their mistakes.' },
  { id: 'way_heir', lore: 'way', when: { bg: 'child' }, name: 'The Line of Heirs', mods: { cha: 1, tou: 1 }, lean: 'guard', desc: 'Leadership passed from parent to child, and everyone knows who is next.' },
  { id: 'way_stranger', lore: 'way', when: { bg: 'stranger' }, name: "The Stranger's Roads", mods: { spd: 1, exploreBonus: 2 }, lean: 'peace', desc: 'A leader from outside knows the roads beyond.' },
  { id: 'way_healer', lore: 'way', when: { bg: 'healer' }, name: "The Healer's Way", mods: { popPerTurn: 1, tou: 1 }, lean: 'peace', desc: 'The sick are cared for, and more of them live.' },
  { id: 'way_young', lore: 'way', when: { bg: 'young' }, name: 'Young Blood', mods: { str: 1, spd: 1 }, lean: 'war', desc: 'A young leader, and a restless people.' },
  // ----- Legacies: grafted for good when a leader fulfils an ambition -----
  { id: 'leg_lodges', lore: 'legacy', when: { amb: 'conquer' }, name: 'Warrior Lodges', mods: { str: 2 }, lean: 'war', desc: 'Where the young learn to fight.' },
  { id: 'leg_tribute', lore: 'legacy', when: { amb: 'conquer' }, name: 'Tribute', mods: { foodPerTurn: 1 }, rule: 'know_foe', lean: 'war', desc: 'The beaten pay, every season.' },
  { id: 'leg_houses', lore: 'legacy', when: { amb: 'learn' }, name: 'Houses of Learning', mods: { ideasPerTurn: 1, cun: 1 }, lean: 'peace', desc: 'A place where everything known is taught.' },
  { id: 'leg_counsel', lore: 'legacy', when: { amb: 'learn' }, name: 'Wise Counsel', mods: { cun: 1 }, rule: 'reroll', lean: 'guard', desc: 'Before every choice, someone asks: what did the Sage say?' },
  { id: 'leg_hearths', lore: 'legacy', when: { amb: 'grow' }, name: 'Great Hearths', mods: { maxPop: 3 }, lean: 'guard', desc: 'Room for everyone around the fire.' },
  { id: 'leg_children', lore: 'legacy', when: { amb: 'grow' }, name: 'Many Children', mods: { popPerTurn: 1, growthCost: -1 }, lean: 'peace', desc: 'Every family a big one.' },
  { id: 'leg_councils', lore: 'legacy', when: { amb: 'befriend' }, name: 'Peace Councils', mods: { cha: 2 }, rule: 'calm_presence', lean: 'peace', desc: 'Every quarrel talked out, by the fire.' },
  { id: 'leg_gift_roads', lore: 'legacy', when: { amb: 'befriend' }, name: 'Gift Roads', mods: { foodPerTurn: 1, cha: 1 }, lean: 'peace', desc: 'Paths worn between peoples by gifts carried back and forth.' },
  { id: 'leg_lodge', lore: 'legacy', when: { amb: 'keep' }, name: "Keepers' Lodge", mods: { specialPerTurn: 1, tou: 1 }, lean: 'guard', desc: 'A house for the keepers and what they keep.' },
  { id: 'leg_stores', lore: 'legacy', when: { amb: 'keep' }, name: 'Sacred Stores', mods: { foodCap: 5, tou: 1 }, lean: 'guard', desc: 'What is kept for hard times is never touched in good ones.' },
  { id: 'leg_pens', lore: 'legacy', when: { amb: 'tame' }, name: 'Beast Pens', mods: { foodPerTurn: 1, tou: 1 }, lean: 'guard', desc: 'Tame animals, kept close and kept well.' },
  { id: 'leg_riders', lore: 'legacy', when: { amb: 'tame' }, name: 'Riders', mods: { spd: 2, str: 1 }, lean: 'war', desc: 'Why walk, when something stronger can carry you?' },
  // ----- Deeds: grafted by what your people did -----
  { id: 'deed_beasts', lore: 'deed', when: { deed: 'deed_tamed' }, name: 'Beasts of Burden', mods: { foodCap: 4, str: 1 }, lean: 'guard', desc: 'Tamed animals carry what your people cannot.' },
  { id: 'deed_spirit', lore: 'deed', when: { deed: 'deed_totem' }, name: 'Spirit Animal', mods: { cha: 1, tou: 1 }, lean: 'peace', desc: 'Your totem watches over every child.' },
  { id: 'deed_feast', lore: 'deed', when: { deed: 'deed_war' }, name: 'Victory Feast', mods: { str: 2 }, lean: 'war', desc: 'Every year, the day you won is remembered.' },
  { id: 'deed_pipe', lore: 'deed', when: { deed: 'deed_peace' }, name: 'The Peace Pipe', mods: { cha: 2 }, rule: 'calm_presence', lean: 'peace', desc: 'Old enemies, sitting at one fire.' },
  { id: 'deed_walls', lore: 'deed', when: { deed: 'deed_raid' }, name: 'Walls Remembered', mods: { tou: 2 }, rule: 'last_refuge', lean: 'guard', desc: 'They came once. You built walls so they never would again.' },
  { id: 'deed_wander', lore: 'deed', when: { deed: 'deed_migrate' }, name: 'The Wandering Years', mods: { exploreBonus: 2, spd: 1 }, lean: 'peace', desc: 'Stories of every land your people ever crossed.' },
  { id: 'deed_gathering', lore: 'deed', when: { deed: 'deed_ceremony' }, name: 'The Great Gathering', mods: { ideasPerTurn: 1, cha: 1 }, lean: 'peace', desc: 'Everyone, in one place, for one night.' },
  { id: 'deed_remnant', lore: 'deed', when: { deed: 'deed_near_end' }, name: 'The Remnant', mods: { tou: 1 }, rule: 'reroll', lean: 'guard', desc: 'So few were left. Never again.' },
  // ----- The Founding: the Gate of the Lore tree -----
  { id: 'founding_gate', lore: 'gate', name: { tool: 'The Founding Fire', song: 'The Founding Song', many: 'The Meeting of Minds', swarm: "The First Queen's Hall", garden: 'The First Fields' }, mods: { cha: 1 }, desc: 'Your people become something more than a band. This ends the Tribe stage.' },
  // ----- Beyond the Founding: learn them before it; they carry into the Society stage -----
  { id: 'lb_tool_flame', lore: 'beyond', path: 'tool', name: 'The Eternal Flame', mods: { specialPerTurn: 1 }, inherit: { influencePerTurn: 1, tou: 1 }, req: { known: 9 }, lean: 'guard', desc: 'A fire that has not gone out since the first one was lit.' },
  { id: 'lb_tool_edge', lore: 'beyond', path: 'tool', name: 'Masters of the Edge', mods: { str: 2 }, inherit: { str: 2 }, req: { known: 8, some: ['spears', 'knapping', 'hafted_axes', 'shell_lances', 'hardened_spears', 'vent_blades', 'poison_spears'], n: 2 }, lean: 'war', desc: 'Weapons no one else can make.' },
  { id: 'lb_song_founding', lore: 'beyond', path: 'song', name: 'The Song of Founding', mods: { cha: 2 }, inherit: { cha: 2, influencePerTurn: 1 }, req: { known: 9 }, lean: 'peace', desc: 'Every child will know it by heart.' },
  { id: 'lb_song_chants', lore: 'beyond', path: 'song', name: 'War Chants', mods: { str: 1, cha: 1 }, inherit: { str: 2 }, req: { known: 8, some: ['chorus_hunts', 'drumming', 'signal_drums', 'leg_lodges', 'deed_feast'], n: 2 }, lean: 'war', desc: 'A song that moves feet toward the enemy.' },
  { id: 'lb_many_council', lore: 'beyond', path: 'many', name: 'The Hidden Council', mods: { cun: 2 }, inherit: { cun: 2, influencePerTurn: 1 }, req: { known: 9 }, lean: 'peace', desc: 'Decisions made where no one can see.' },
  { id: 'lb_many_masks', lore: 'beyond', path: 'many', name: 'Masks of State', mods: { cun: 1, tou: 1 }, inherit: { cun: 1, tou: 2 }, req: { known: 8, some: ['mimicry', 'hidden_lairs', 'ink_clouds', 'way_stranger', 'deed_walls'], n: 2 }, lean: 'guard', desc: 'No one outside the den ever knows who leads it.' },
  { id: 'lb_swarm_brood', lore: 'beyond', path: 'swarm', name: 'The Endless Brood', mods: { maxPop: 3 }, inherit: { maxPop: 4 }, req: { known: 9 }, lean: 'guard', desc: 'There will always be more.' },
  { id: 'lb_swarm_march', lore: 'beyond', path: 'swarm', name: 'The Marching Hive', mods: { str: 2 }, inherit: { str: 2, tou: 1 }, req: { known: 8, some: ['swarm_tactics', 'leg_lodges', 'deed_feast', 'scent_trails'], n: 2 }, lean: 'war', desc: 'A hive that moves, and eats everything in its way.' },
  { id: 'lb_garden_covenant', lore: 'beyond', path: 'garden', name: 'The Green Covenant', mods: { foodPerTurn: 2 }, inherit: { foodPerTurn: 2, cha: 1 }, req: { known: 9 }, lean: 'peace', desc: 'Every living thing your people touch, cared for.' },
  { id: 'lb_garden_thorns', lore: 'beyond', path: 'garden', name: 'Thorn Kingdoms', mods: { tou: 2 }, inherit: { tou: 2, str: 1 }, req: { known: 8, some: ['living_fences', 'weeding', 'leg_stores', 'deed_walls'], n: 2 }, lean: 'guard', desc: 'Gardens no army can cross.' },
);
// The discoveries from before Update 18 take their place in the tree, and a leaning from what they do.
G.DISCOVERIES.forEach((d) => {
  if (!d.lore) d.lore = d.from ? 'combo' : d.path ? 'trunk' : 'graft';
  if (!d.lean && (d.lore === 'trunk' || d.lore === 'graft' || d.lore === 'combo')) {
    const m = d.mods || {};
    const war = (m.str || 0) + (m.huntBonus || 0) / 2; const peace = (m.cha || 0) + (m.foodPerTurn || 0) + (m.popPerTurn || 0) - (m.growthCost || 0); const guard = (m.tou || 0) + (m.damageReduce || 0) + (m.maxPop || 0) / 2 + (m.foodCap || 0) / 5;
    const best = Math.max(war, peace, guard);
    if (best > 0) d.lean = best === war ? 'war' : best === peace ? 'peace' : 'guard';
  }
});
G.DISCOVERY = {}; G.DISCOVERIES.forEach((d) => { G.DISCOVERY[d.id] = d; });

// How a Tribe stage ends: settle down, take to the road, or conquer. Named by kind.
G.TRIBE_ENDINGS = {
  tool: {
    land: { settle: { name: 'The First Village', desc: 'Huts around a fire that never goes out.' }, roam: { name: 'The Long Road', desc: 'A tribe that carries its fire across the world.' }, conquer: { name: 'The Spear-Lords', desc: 'Every band in the valley answers to you.' } },
    sea: { settle: { name: 'The Vent Village', desc: 'Dens of shell around the warm vents.' }, roam: { name: 'The Drifting Forge', desc: 'A clan that carries its heat on the currents.' }, conquer: { name: 'The Blade Reef', desc: 'Every clan in the deep answers to you.' } },
  },
  song: {
    land: { settle: { name: 'The Singing Hills', desc: 'A home where every stone has a song.' }, roam: { name: 'The Wandering Choir', desc: 'A people whose home is the song itself.' }, conquer: { name: 'The Howling Host', desc: 'Your song drowns out every other.' } },
    sea: { settle: { name: 'The Calving Grounds', desc: 'Warm waters where the songs are born.' }, roam: { name: 'The Great Migration', desc: 'A pod that sings its way around the world.' }, conquer: { name: 'The Thunder Pod', desc: 'The ocean falls silent when you sing.' } },
  },
  many: {
    land: { settle: { name: 'The Hidden City', desc: 'Lairs nobody has ever found, linked by secret paths.' }, roam: { name: 'The Shifting Lairs', desc: 'A den that is never in the same place twice.' }, conquer: { name: 'The Masked Court', desc: 'Every band obeys, and none of them knows who rules.' } },
    sea: { settle: { name: 'The Lantern Grottoes', desc: 'Caves in the deep, lit by a thousand living lights.' }, roam: { name: 'The Drifting Court', desc: 'A court that moves between the vent fields.' }, conquer: { name: 'The Ink Throne', desc: 'The deep answers to minds it cannot see.' } },
  },
  swarm: {
    land: { settle: { name: 'The Great Mound', desc: 'A mound taller than the trees, and still growing.' }, roam: { name: 'The Marching Hive', desc: 'A hive that moves like a river across the land.' }, conquer: { name: 'The Endless Column', desc: 'Nothing stands in the swarm\'s way.' } },
    sea: { settle: { name: 'The Reef-City', desc: 'A reef so vast it changes the tides.' }, roam: { name: 'The Drifting Reef', desc: 'A colony that rides the currents and seeds new reefs.' }, conquer: { name: 'The Stinging Wall', desc: 'Every reef in the sea belongs to one colony.' } },
  },
  garden: {
    land: { settle: { name: 'The Orchard Valley', desc: 'Every tree in the valley planted by your people.' }, roam: { name: 'The Seed-Walkers', desc: 'A people who plant a forest wherever they go.' }, conquer: { name: 'The Thorn Wardens', desc: 'Every grove in the land is yours to tend, or to burn.' } },
    sea: { settle: { name: 'The Kelp Commons', desc: 'Kelp forests tended by many kinds together.' }, roam: { name: 'The Seed Current', desc: 'A garden that drifts and plants the whole sea.' }, conquer: { name: 'The Weed Wall', desc: 'Your gardens choke every rival reef.' } },
  },
};

// Ancestral Wisdom: the Tribe stage's own tree on the Evolution screen. Opens once you have founded a Tribe.
// Stored with the Evolution Tree's levels (meta.boons), but kept out of its hidden power.
G.WISDOM = [
  { id: 'w_stories', name: 'Old Stories', col: 0, tier: 1, costs: [15, 35], desc: 'Every Tribe begins with +6 Ideas per level.' },
  { id: 'w_blood', name: 'Strong Blood', col: 1, tier: 1, costs: [15, 35, 60], desc: 'More members per level in the Tribe stage (+20 for a mid-sized people).' },
  { id: 'w_keepers', name: 'Born Keepers', col: 2, tier: 1, costs: [20, 45], desc: 'Start with +3 of your Fire, Song, Light, Brood or Growth per level.' },
  { id: 'w_elders', name: 'Elders\' Counsel', col: 3, tier: 1, costs: [25, 50, 80], desc: 'Every Tribe-stage check is 1 easier per level.' },
  { id: 'w_peace', name: 'Peacemakers', col: 4, tier: 1, costs: [20, 45], desc: 'Rival bands start 20 friendlier per level.' },
  { id: 'w_watch', name: 'Watchfires', col: 5, tier: 1, costs: [25, 55], desc: 'Hunters and raiders strike 15% less often per level.' },
  { id: 'w_choosing', name: 'Wise Choosing', col: 0, tier: 2, req: ['w_stories'], costs: [40], desc: 'Choose from 4 leader candidates, and leaders live 5 years longer.' },
  { id: 'w_hardy', name: 'Hardy Folk', col: 1, tier: 2, req: ['w_blood'], costs: [35, 70], mods: { tou: 1 }, desc: '+1 Toughness per level in the Tribe stage.' },
  { id: 'w_ways', name: 'Remembered Ways', col: 2, tier: 2, req: ['w_keepers'], costs: [50], desc: 'Every Tribe begins with one discovery already known.' },
  { id: 'w_founding', name: 'The Founders\' Path', col: 3, tier: 2, req: ['w_elders'], costs: [60], desc: 'The Founding is 2 easier.' },
  { id: 'w_kin', name: 'Kinship', col: 4, tier: 2, req: ['w_peace'], costs: [45], desc: 'Taming and courting succeed more often (+15%).' },
  { id: 'w_stand', name: 'Last Stand', col: 5, tier: 2, req: ['w_watch'], costs: [50], desc: 'Once per Tribe, when your people would die out, a few survive.' },
  // Update 18: reach deeper into the Lore tree.
  { id: 'w_lore', name: 'Lorekeepers', col: 0, tier: 3, req: ['w_choosing'], costs: [45, 90, 140], desc: 'Lore ideas cost 10% less per level.' },
  { id: 'w_strength', name: 'Strong Arms', col: 1, tier: 3, req: ['w_hardy'], costs: [40, 80], mods: { str: 1 }, desc: '+1 Strength per level in the Tribe stage.' },
  { id: 'w_graft', name: 'Many Branches', col: 2, tier: 3, req: ['w_ways'], costs: [60], desc: 'Every new branch of Lore offers one more choice.' },
  { id: 'w_stone', name: 'Founding Stones', col: 3, tier: 3, req: ['w_founding'], costs: [55, 110], desc: 'The Founding needs two fewer Lore ideas per level.' },
  { id: 'w_friends', name: 'Old Friends', col: 4, tier: 3, req: ['w_kin'], costs: [50], mods: { foodPerTurn: 1 }, desc: '+1 Food a turn in the Tribe stage, from the kinds that trust you.' },
  { id: 'w_walls', name: 'Palisades', col: 5, tier: 3, req: ['w_stand'], costs: [45, 90], mods: { damageReduce: 1 }, desc: 'Every raid or hunt kills one fewer per level in the Tribe stage.' },
  { id: 'w_ancestors', name: 'Voices of the Ancestors', col: 0, tier: 4, req: ['w_lore'], costs: [70, 140], desc: 'Ideas Beyond the Founding cost 15% less per level.' },
  { id: 'w_cunning', name: 'Sharp Minds', col: 1, tier: 4, req: ['w_strength'], costs: [60, 120], mods: { cun: 1 }, desc: '+1 Cunning per level in the Tribe stage.' },
  { id: 'w_long', name: 'Long Lives', col: 2, tier: 4, req: ['w_graft'], costs: [70], desc: 'Leaders live 5 years longer, with more time to fulfil their ambitions.' },
  { id: 'w_deeds', name: 'Remembered Deeds', col: 3, tier: 4, req: ['w_stone'], costs: [80], desc: 'Every Tribe begins with one deed already remembered in its Lore tree.' },
  { id: 'w_charm', name: 'Open Hands', col: 4, tier: 4, req: ['w_friends'], costs: [60, 120], mods: { cha: 1 }, desc: '+1 Charm per level in the Tribe stage.' },
  { id: 'w_fires', name: 'Undying Fires', col: 5, tier: 4, req: ['w_walls'], costs: [70, 140], mods: { specialPerTurn: 1 }, desc: '+1 Fire, Song, Light, Brood or Growth a turn per level.' },
];

// Activities only for the Tribe stage.
G.ACTIVITIES.push(
  { id: 'tame', name: 'Tame', target: 'species', stage: ['tribe', 'society'], desc: 'Win a species\' trust, slowly, with Charm, until it lives alongside your people. Each tamed species gives 1 Food a turn and never attacks you.' },
  { id: 'revere', name: 'Revere', target: 'species', stage: ['tribe', 'society'], turns: 2, desc: 'Make a species your totem: your people take on a little of its strength, and it grows friendlier. You can only have one totem.' },
  { id: 'ceremony', name: 'Ceremony', stage: ['tribe', 'society'], turns: 2, desc: 'Gather everyone for two turns of dance and story (−1 Food a turn): +2 of your special resource and +1 Idea each turn. Needs 8 turns between ceremonies.' },
  { id: 'craft', name: 'Craft', stage: ['tribe', 'society'], path: 'tool', turns: 2, desc: 'Spend 4 of your Fire or Vent-heat to craft gear for your people: each level of gear gives +1 Strength (and +1 Toughness every second level), up to 5.' },
  { id: 'teach', name: 'Teach the songs', stage: ['tribe', 'society'], path: 'song', turns: 3, desc: 'Three turns of teaching (−1 Food a turn): +2 Song each turn, and the next time many of you die, no verses are lost.' },
  { id: 'watch', name: 'Watch and learn', target: 'species', stage: 'tribe', path: 'many', turns: 3, desc: 'Spend three turns secretly watching a species. Watch a rival band and you copy one of its discoveries; watch any other species and you learn +2 Ideas and +3 Light.' },
  { id: 'raise', name: 'Grow your home', stage: 'tribe', path: 'swarm', turns: 2, desc: 'Spend 5 Brood to make your great building one level bigger (up to 6): +20 max members per level, and +1 Toughness every second level.' },
  { id: 'tend', name: 'Tend the gardens', stage: 'tribe', path: 'garden', turns: 3, desc: 'Three turns of weeding and planting (−1 Food a turn): +2 Growth each turn, and Blight cannot strike for 12 turns after.' },
);

// ---------- The Society stage (Update 16) ----------
G.STAGES.society = {
  name: 'Society Stage', turnName: 'Generation',
  drafts: [8, 20, 34, 50, 68, 88, 110, 135, 160],
  milestones: [{ at: 0, event: 'society_founded' }, { at: 45, event: 'the_council' }, { at: 95, event: 'neighbours_gather' }],
  evolveAt: 190,
};
G.SOCIETY_PATHS = ['tool', 'song', 'many', 'swarm', 'garden'];
// Your Founding decides what kind of society you become.
G.SOCIETY_TYPES = {
  settle: { name: 'Settled', mods: { foodPerTurn: 1, tou: 1 }, start: 4, rule: 'Settled peoples start with four settlements and grow them faster (Build up takes a turn less).' },
  roam: { name: 'Roaming', mods: { spd: 1, exploreBonus: 2 }, start: 2, rule: 'Roaming peoples start with two settlements, but migrating is quick and always pays Influence.' },
  conquer: { name: 'Warlike', mods: { str: 2 }, start: 3, rule: 'Warlike peoples hit harder, and every war won or raid made earns Influence.' },
};
G.SOCIETY_KINDS = {
  tool: {
    land: { name: 'Hearthlands', settlement: 'village', capital: 'the Great Hearth' },
    sea: { name: 'Vent Holds', settlement: 'hold', capital: 'the Deep Forge' },
  },
  song: {
    land: { name: 'Song-circles', settlement: 'circle', capital: 'the First Circle' },
    sea: { name: 'Pod League', settlement: 'calving ground', capital: 'the Singing Deep' },
  },
  // Update 19: the other three kinds of people reach the Society stage.
  many: {
    land: { name: 'Lantern Dens', settlement: 'den', capital: 'the Lantern Hollow' },
    sea: { name: 'Shadow Reefs', settlement: 'grotto', capital: 'the Glowing Deep' },
  },
  swarm: {
    land: { name: 'Mound Realm', settlement: 'mound', capital: 'the Queen\'s Mound' },
    sea: { name: 'Reef Dominion', settlement: 'reef', capital: 'the Mother Reef' },
  },
  garden: {
    land: { name: 'Grove Commons', settlement: 'grove', capital: 'the Elder Grove' },
    sea: { name: 'Kelp Realms', settlement: 'kelp bed', capital: 'the Great Kelp' },
  },
};
G.SETTLEMENT_SYLLABLES = { a: ['Ash', 'Brin', 'Cor', 'Del', 'Fen', 'Gar', 'Hal', 'Ir', 'Kel', 'Lor', 'Mar', 'Nor', 'Ost', 'Pel', 'Ros', 'Sar', 'Tor', 'Vel', 'Wen', 'Yar'], b: ['ford', 'hold', 'mere', 'stone', 'deep', 'fall', 'wick', 'reach', 'shore', 'hollow', 'ridge', 'well', 'brook', 'haven'] };
// The council: three advisers, each with a role and an opinion of your ruler.
G.COUNCIL_ROLES = {
  steward: { name: 'Steward', mods: { foodPerTurn: 1, foodCap: 3 }, desc: 'Keeps the stores.' },
  marshal: { name: 'Marshal', mods: { str: 1, tou: 1 }, desc: 'Leads the defence.' },
  keeper: { name: 'Keeper', mods: { influencePerTurn: 1 }, desc: 'Keeps the stories and the special resource.' },
};
// Traditions and Laws: your culture tree. Drafted 1 of 3, like discoveries. Some come in pairs that exclude each other.
// tier 1 is open at once; tier 2 needs 2 traditions, tier 3 needs 4.
G.TRADITIONS = [
  { id: 'war_bands', name: 'War Bands', tier: 1, excl: 'peace_vows', mods: { str: 2 }, desc: 'Every grown member can fight. Warlike.' },
  { id: 'peace_vows', name: 'Peace Vows', tier: 1, excl: 'war_bands', mods: { cha: 2 }, flag: 'peaceful', desc: 'Neighbours sour on you more slowly. Peaceful.' },
  { id: 'open_gates', name: 'Open Gates', tier: 1, excl: 'closed_gates', mods: { foodPerTurn: 1, cha: 1 }, flag: 'open', desc: 'Strangers welcome, and trade earns more. Open.' },
  { id: 'closed_gates', name: 'Closed Gates', tier: 1, excl: 'open_gates', mods: { tou: 2 }, flag: 'closed', desc: 'Walls and watchmen: raids land less often. Closed.' },
  { id: 'elder_rule', name: 'Rule of Elders', tier: 1, excl: 'young_blood', mods: { influencePerTurn: 1 }, desc: 'The old decide. Slow, but wise.' },
  { id: 'young_blood', name: 'Young Blood', tier: 1, excl: 'elder_rule', mods: { spd: 1, popPerTurn: 1 }, desc: 'The young decide. Fast, and fearless.' },
  { id: 'law_of_shares', name: 'Law of Shares', tier: 1, mods: { foodPerTurn: 2 }, desc: 'Every catch and every harvest is shared out.' },
  { id: 'old_ways', name: 'The Old Ways', tier: 2, excl: 'new_reason', mods: { cha: 1, influencePerTurn: 1 }, desc: 'Rites and omens guide every choice. Faith.' },
  { id: 'new_reason', name: 'Reason', tier: 2, excl: 'old_ways', mods: { cun: 2 }, desc: 'Why? How? Prove it. Reason.' },
  { id: 'law_of_guests', name: 'Law of Guests', tier: 2, mods: { cha: 1 }, flag: 'guests', desc: 'A guest is sacred: envoys always come back friendlier.' },
  { id: 'law_of_spear', name: 'Law of the Spear', tier: 2, mods: { str: 1, tou: 1 }, desc: 'Disputes end in a fight. Nobody starts many.' },
  { id: 'hearth_law', name: 'Hearth Law', tier: 2, excl: 'road_law', mods: { maxPop: 4 }, desc: 'Home is where the fire is: settlements hold more.' },
  { id: 'road_law', name: 'Road Law', tier: 2, excl: 'hearth_law', mods: { exploreBonus: 2, spd: 1 }, desc: 'Home is the road between settlements.' },
  { id: 'great_hall', name: 'The Great Hall', tier: 3, society: 'settle', mods: { maxPop: 4, influencePerTurn: 1 }, desc: 'One hall big enough for everyone. Settled peoples only.' },
  { id: 'caravan_law', name: 'Caravan Law', tier: 3, society: 'roam', mods: { foodPerTurn: 2, spd: 1 }, desc: 'Every settlement can be packed and moved. Roaming peoples only.' },
  { id: 'warrior_lodges', name: 'Warrior Lodges', tier: 3, society: 'conquer', mods: { str: 3 }, desc: 'Where the young learn to fight. Warlike peoples only.' },
  { id: 'councils_of_all', name: 'Council of All', tier: 3, mods: { cha: 2, influencePerTurn: 1 }, flag: 'loyal', desc: 'Everyone has a voice: the council stays loyal.' },
  // Toolmakers
  { id: 'kilns', name: 'Kilns', tier: 1, path: 'tool', habitat: 'land', mods: { foodCap: 6, tou: 1 }, desc: 'Fired clay: pots, walls, ovens.' },
  { id: 'vent_kilns', name: 'Vent Kilns', tier: 1, path: 'tool', habitat: 'sea', mods: { foodCap: 6, tou: 1 }, desc: 'Shells baked hard in the vents.' },
  { id: 'masonry', name: 'Masonry', tier: 2, path: 'tool', mods: { tou: 2, maxPop: 2 }, desc: 'Stone on stone, built to last.' },
  { id: 'smiths', name: 'Smiths', tier: 2, path: 'tool', mods: { str: 2, specialPerTurn: 1 }, desc: 'Keepers of the hottest fires.' },
  { id: 'roads', name: 'Roads', tier: 3, path: 'tool', habitat: 'land', mods: { spd: 1, influencePerTurn: 1 }, desc: 'Paths between every village.' },
  { id: 'harbours', name: 'Harbours', tier: 3, path: 'tool', habitat: 'sea', mods: { spd: 1, influencePerTurn: 1 }, desc: 'Sheltered water between every hold.' },
  // Singers
  { id: 'song_law', name: 'Song-Law', tier: 1, path: 'song', mods: { cha: 1, influencePerTurn: 1 }, desc: 'The law is a song everyone knows by heart.' },
  { id: 'messenger_songs', name: 'Messenger Songs', tier: 2, path: 'song', mods: { cha: 2 }, flag: 'messengers', desc: 'Songs carried between peoples: courting and gifts work better.' },
  { id: 'memory_halls', name: 'Halls of Memory', tier: 2, path: 'song', mods: { specialPerTurn: 1, cun: 1 }, flag: 'songSafe', desc: 'Every verse sung in many places: no great loss costs a discovery.' },
  { id: 'echo_roads', name: 'Echo Roads', tier: 3, path: 'song', habitat: 'land', mods: { exploreBonus: 2, influencePerTurn: 1 }, desc: 'Songs that map the whole region.' },
  // Many Minds, the Swarm and Gardeners (Update 19)
  { id: 'lantern_law', name: 'Lantern Law', tier: 1, path: 'many', mods: { cun: 1, influencePerTurn: 1 }, desc: 'Laws written in light, read by anyone.' },
  { id: 'hidden_ways', name: 'The Hidden Ways', tier: 2, path: 'many', mods: { cun: 1, damageReduce: 1 }, flag: 'closed', desc: 'Secret paths between every den: raids land less often.' },
  { id: 'queens_word', name: "The Queen's Word", tier: 1, path: 'swarm', mods: { tou: 1, influencePerTurn: 1 }, flag: 'loyal', desc: 'Nobody argues with the Queen: the council stays loyal.' },
  { id: 'brood_tithes', name: 'Brood Tithes', tier: 2, path: 'swarm', mods: { maxPop: 4, specialPerTurn: 1 }, desc: 'Every mound sends young to the capital.' },
  { id: 'grove_law', name: 'Grove Law', tier: 1, path: 'garden', mods: { foodPerTurn: 1, cha: 1 }, desc: 'Nothing grows without everyone agreeing.' },
  { id: 'seed_banks', name: 'Seed Banks', tier: 2, path: 'garden', mods: { foodCap: 8, foodPerTurn: 1 }, desc: 'Every kind of seed, kept safe for the bad years.' },
  { id: 'migration_songs', name: 'Migration Songs', tier: 3, path: 'song', habitat: 'sea', mods: { exploreBonus: 2, influencePerTurn: 1 }, desc: 'Every route around the ocean, sung.' },
];
// ======================= UPDATE 19: THE LAW TREE =======================
// The Society stage's own tree. Traditions are its ideas, paid for with your people's resource.
// Bands: Founding (your kind of society, always there), Laws (grafted: each Influence goal lets you choose
// one of three), Council (open while that councillor is loyal; kept once learned), Faith (from your
// faith, which is built from your history), Culture and Neighbours (grafted by deeds), the Union (the
// Gate: ends the Society stage) and Beyond the Union (one per Disposition).
//   law  founding | law | council | faith | culture | neighbours | gate | beyond (old traditions: law)
G.FAITH_KINDS = {
  totem: { name: (n) => `The Way of the ${n}`, desc: 'Your faith grew from the totem your people revered.' },
  nemesis: { name: (n) => `The Vigil Against the ${n}`, desc: 'Your faith grew from the enemy your lineage never forgave.' },
  ancestor: { name: (n) => `The Memory of ${n}`, desc: 'Your faith grew from the memory of what your kind once was.' },
};
G.SOC_DEEDS = {
  sd_great_works: 'A settlement grew as big as it can.',
  sd_new_settlement: 'Your people founded a new settlement.',
  sd_war_epic: 'Your people won a raid or a war.',
  sd_market: 'Your people traded with a neighbour.',
  sd_plot_crushed: 'A plot in the council was ended.',
  sd_golden_age: 'The whole council was loyal at once.',
  sd_treaty: 'You signed a treaty with a neighbour.',
  sd_marriage: 'A marriage bound you to a neighbour.',
  sd_ally: 'A neighbour became your ally.',
  sd_betrayal: 'You broke a treaty.',
};
G.UNION_NEED = 12; // Law ideas your people must know before the Union
G.TRADITIONS.push(
  // ----- Founding: your kind of society -----
  { id: 'lf_settle_fields', law: 'founding', society: 'settle', name: 'Fields and Walls', tier: 1, mods: { foodPerTurn: 1, tou: 1 }, lean: 'guard', desc: 'Settled peoples farm, and fence what they farm.' },
  { id: 'lf_settle_markets', law: 'founding', society: 'settle', name: 'Market Days', tier: 1, mods: { influencePerTurn: 1, cha: 1 }, lean: 'peace', desc: 'Once a season, everyone comes to trade.' },
  { id: 'lf_roam_roads', law: 'founding', society: 'roam', name: 'The Long Roads', tier: 1, mods: { spd: 1, exploreBonus: 2 }, lean: 'peace', desc: 'Every settlement a camp, every camp a road.' },
  { id: 'lf_roam_herds', law: 'founding', society: 'roam', name: 'Moving Herds', tier: 1, mods: { foodPerTurn: 2 }, lean: 'guard', desc: 'Your food walks with you.' },
  { id: 'lf_conquer_levies', law: 'founding', society: 'conquer', name: 'Levies', tier: 1, mods: { str: 2 }, lean: 'war', desc: 'Every settlement sends its share of warriors.' },
  { id: 'lf_conquer_tribute', law: 'founding', society: 'conquer', name: 'Tribute Rolls', tier: 1, mods: { influencePerTurn: 1, foodPerTurn: 1 }, lean: 'war', desc: 'The beaten pay, and the payments are written down.' },
  { id: 'lf_myth', law: 'founding', name: 'The Founding Myth', tier: 1, mods: { cha: 1, influencePerTurn: 1 }, desc: 'The story of how your people began, told at every hearth.' },
  // ----- Council: open while that councillor is loyal -----
  { id: 'lc_steward', law: 'council', role: 'steward', name: "The Steward's Ledger", tier: 1, mods: { foodCap: 6, foodPerTurn: 1 }, lean: 'guard', desc: 'Every store counted, every debt remembered.' },
  { id: 'lc_marshal', law: 'council', role: 'marshal', name: "The Marshal's Drill", tier: 1, mods: { str: 1, tou: 1 }, lean: 'war', desc: 'Every settlement ready to fight by morning.' },
  { id: 'lc_keeper', law: 'council', role: 'keeper', name: "The Keeper's Archive", tier: 1, mods: { specialPerTurn: 1, influencePerTurn: 1 }, lean: 'peace', desc: 'Everything your people know, kept in one place.' },
  // ----- Faith: built from your history -----
  { id: 'fa_totem_rites', law: 'faith', faith: 'totem', name: 'Totem Rites', tier: 1, mods: { cha: 1, tou: 1 }, lean: 'peace', desc: 'Dances in the shape of the totem, every season.' },
  { id: 'fa_totem_kin', law: 'faith', faith: 'totem', name: 'Kin of the Wild', tier: 2, mods: { foodPerTurn: 1, cha: 1 }, rule: 'calm_presence', lean: 'peace', desc: 'Every living thing is a cousin, and is treated like one.' },
  { id: 'fa_nemesis_vigil', law: 'faith', faith: 'nemesis', name: 'The Vigil', tier: 1, mods: { tou: 2 }, lean: 'guard', desc: 'Someone always watches for the old enemy.' },
  { id: 'fa_nemesis_crusade', law: 'faith', faith: 'nemesis', name: 'Holy War', tier: 2, mods: { str: 2 }, rule: 'know_foe', lean: 'war', desc: 'The old enemy will pay, and the faithful will make them.' },
  { id: 'fa_ancestor_shrines', law: 'faith', faith: 'ancestor', name: 'Ancestor Shrines', tier: 1, mods: { influencePerTurn: 1, cun: 1 }, lean: 'guard', desc: 'The first of your kind, remembered in every home.' },
  { id: 'fa_ancestor_return', law: 'faith', faith: 'ancestor', name: 'The Return', tier: 2, mods: { cun: 1, cha: 1 }, rule: 'reroll', lean: 'peace', desc: 'The ancestors are waiting to be born again, and they help.' },
  { id: 'fa_temples', law: 'faith', name: 'Temples', tier: 2, mods: { influencePerTurn: 1, cha: 1 }, desc: 'A house for the faith in every settlement.' },
  { id: 'fa_pilgrims', law: 'faith', name: 'Pilgrimage', tier: 2, mods: { exploreBonus: 1, influencePerTurn: 1 }, lean: 'peace', desc: 'Once in a life, everyone walks to the holy place.' },
  // ----- Culture: grafted by deeds -----
  { id: 'cu_great_works', law: 'culture', when: { deed: 'sd_great_works' }, name: 'Great Works', tier: 2, mods: { maxPop: 3, influencePerTurn: 1 }, lean: 'guard', desc: 'Buildings meant to outlast everyone who built them.' },
  { id: 'cu_founders', law: 'culture', when: { deed: 'sd_new_settlement' }, name: "Founders' Songs", tier: 2, mods: { cha: 1, popPerTurn: 1 }, lean: 'peace', desc: 'Every new settlement gets its own song.' },
  { id: 'cu_war_epics', law: 'culture', when: { deed: 'sd_war_epic' }, name: 'War Epics', tier: 2, mods: { str: 2 }, lean: 'war', desc: 'Long poems about the fight, sung to the young.' },
  { id: 'cu_markets', law: 'culture', when: { deed: 'sd_market' }, name: 'Coin and Count', tier: 2, mods: { foodPerTurn: 1, influencePerTurn: 1 }, lean: 'peace', desc: 'Trade so common it needs its own tokens.' },
  { id: 'cu_iron_law', law: 'culture', when: { deed: 'sd_plot_crushed' }, name: 'Iron Law', tier: 2, mods: { tou: 1 }, flag: 'loyal', lean: 'guard', desc: 'Plotters are remembered, and so is what happened to them.' },
  { id: 'cu_golden_age', law: 'culture', when: { deed: 'sd_golden_age' }, name: 'A Golden Age', tier: 2, mods: { cha: 1, cun: 1, influencePerTurn: 1 }, lean: 'peace', desc: 'Everyone agrees, and everything flourishes.' },
  // ----- Neighbours: grafted by how you dealt with other peoples -----
  { id: 'ne_treaty_stones', law: 'neighbours', when: { deed: 'sd_treaty' }, name: 'Treaty Stones', tier: 2, mods: { cha: 2 }, flag: 'peaceful', lean: 'peace', desc: 'Promises carved where everyone can see them.' },
  { id: 'ne_marriage', law: 'neighbours', when: { deed: 'sd_marriage' }, name: 'Marriage of Peoples', tier: 2, mods: { cha: 1, popPerTurn: 1 }, flag: 'guests', lean: 'peace', desc: 'Your ruling family and theirs are one family now.' },
  { id: 'ne_alliance', law: 'neighbours', when: { deed: 'sd_ally' }, name: 'Old Alliances', tier: 2, mods: { tou: 1, foodPerTurn: 1 }, lean: 'guard', desc: 'Friends who come when called.' },
  { id: 'ne_oathbreakers', law: 'neighbours', when: { deed: 'sd_betrayal' }, name: 'Oathbreakers', tier: 2, mods: { str: 2, cha: -1 }, rule: 'know_foe', lean: 'war', desc: 'Promises are tools. Everyone knows it now.' },
  // ----- The Union: the Gate of the Law tree -----
  { id: 'union_gate', law: 'gate', name: 'The Union', tier: 3, mods: { cha: 1 }, desc: 'Bring the whole region together: by force, by trade or by faith, as your Disposition allows. This ends the Society stage.' },
  // ----- Beyond the Union: one for each Disposition; they carry into the Renaissance -----
  { id: 'lb_peace_league', law: 'beyond', disposition: 'peace', name: 'The League of Peoples', tier: 3, mods: { cha: 2, influencePerTurn: 1 }, inherit: { cha: 2 }, req: { known: 11 }, lean: 'peace', desc: 'Every people in the region at one table, for good.' },
  { id: 'lb_guard_marches', law: 'beyond', disposition: 'guard', name: 'The Marches', tier: 3, mods: { tou: 2, influencePerTurn: 1 }, inherit: { tou: 2 }, req: { known: 11 }, lean: 'guard', desc: 'Borders so strong that no one tests them.' },
  { id: 'lb_war_host', law: 'beyond', disposition: 'war', name: 'The Great Host', tier: 3, mods: { str: 2, influencePerTurn: 1 }, inherit: { str: 2 }, req: { known: 11 }, lean: 'war', desc: 'An army that never goes home.' },
);
// Traditions from before Update 19 are the Laws band, with a leaning from what they do.
G.TRADITIONS.forEach((t) => {
  if (!t.law) t.law = 'law';
  if (!t.lean && t.law === 'law') {
    const m = t.mods || {};
    const war = (m.str || 0); const peace = (m.cha || 0) + (m.foodPerTurn || 0) + (m.popPerTurn || 0); const guard = (m.tou || 0) + (m.maxPop || 0) / 2 + (m.foodCap || 0) / 5 + (m.damageReduce || 0);
    const best = Math.max(war, peace, guard);
    if (t.id === 'war_bands') t.lean = 'war'; else if (t.id === 'peace_vows') t.lean = 'peace'; else if (best > 0) t.lean = best === war ? 'war' : best === peace ? 'peace' : 'guard';
  }
});
G.ACTIVITIES.push(
  { id: 'treaty', name: 'Sign a treaty', target: 'species', stage: 'society', turns: 2, desc: 'A neighbour people that likes you (opinion 40 or more) swears never to raid you, and you never to raid them. Breaking it will not be forgotten.' },
  { id: 'marry', name: 'Arrange a marriage', target: 'species', stage: 'society', turns: 2, desc: 'Marry into a neighbour people that does not hate you (opinion 25 or more): +25 opinion, and their friends become yours.' },
);
// Heritage: the Society stage's own tree on the Evolution screen. Opens once you have reached a Society.
G.HERITAGE = [
  { id: 'h_records', name: 'Old Records', col: 0, tier: 1, costs: [20, 45], desc: 'Every Society begins with +8 Influence per level.' },
  { id: 'h_cities', name: 'Old Cities', col: 1, tier: 1, costs: [25, 55], desc: 'Every Society begins with one more settlement per level.' },
  { id: 'h_law', name: 'Lawgivers', col: 2, tier: 1, costs: [25, 55, 90], desc: 'Law ideas cost 10% less per level.' },
  { id: 'h_council', name: 'Faithful Councils', col: 3, tier: 1, costs: [20, 45], desc: 'Councillors start 15 more loyal per level.' },
  { id: 'h_envoys', name: 'Envoys', col: 4, tier: 1, costs: [20, 45], desc: 'Neighbour peoples start 15 friendlier per level.' },
  { id: 'h_walls', name: 'City Walls', col: 5, tier: 1, costs: [25, 55], mods: { damageReduce: 1 }, desc: 'Raids kill one fewer per level in the Society stage.' },
  { id: 'h_charm', name: 'Diplomats', col: 0, tier: 2, req: ['h_records'], costs: [40, 80], mods: { cha: 1 }, desc: '+1 Charm per level in the Society stage.' },
  { id: 'h_str', name: 'Standing Armies', col: 1, tier: 2, req: ['h_cities'], costs: [40, 80], mods: { str: 1 }, desc: '+1 Strength per level in the Society stage.' },
  { id: 'h_branches', name: 'Many Laws', col: 2, tier: 2, req: ['h_law'], costs: [60], desc: 'Every new branch of Law offers one more choice.' },
  { id: 'h_union', name: 'Union Stones', col: 3, tier: 2, req: ['h_council'], costs: [55, 110], desc: 'The Union needs two fewer Law ideas per level, and its checks are 1 easier per level.' },
  { id: 'h_faith', name: 'Deep Faith', col: 4, tier: 2, req: ['h_envoys'], costs: [50], desc: 'Every Society begins with its two first faith ideas already open, and its first one known.' },
  { id: 'h_beyond', name: 'Old Empires', col: 5, tier: 2, req: ['h_walls'], costs: [70, 140], desc: 'Ideas Beyond the Union cost 15% less per level.' },
];
G.TRADITION = {}; G.TRADITIONS.forEach((t) => { G.TRADITION[t.id] = t; });
// How a Society stage ends (Update 16: three of the four; the Wonder comes in Update 17).
G.SOCIETY_ENDINGS = {
  tool: {
    land: { conquest: { name: 'The Hearth-Kingdom', desc: 'Every village in the region bows to one hearth.' }, trade: { name: 'The Market Towns', desc: 'Roads, markets, and a region bound by trade.' }, faith: { name: 'The Keepers of the Flame', desc: 'One fire, one faith, from the hills to the sea.' } },
    sea: { conquest: { name: 'The Forge-Lords', desc: 'Every hold in the deep answers to the Deep Forge.' }, trade: { name: 'The Current Markets', desc: 'Goods flow along the currents from hold to hold.' }, faith: { name: 'The Vent Faith', desc: 'The warm vents are holy, and so are their keepers.' } },
  },
  song: {
    land: { conquest: { name: 'The Howling Realm', desc: 'One song drowns out every other in the region.' }, trade: { name: 'The Song-Roads', desc: 'A league of circles, trading along the old songs.' }, faith: { name: 'The First Hymn', desc: 'A song so old and true that every people sings it.' } },
    sea: { conquest: { name: 'The Thunder League', desc: 'The ocean goes quiet when the League sings.' }, trade: { name: 'The Great Circuit', desc: 'Pods meet and trade at every calving ground.' }, faith: { name: 'The Deep Hymn', desc: 'The whole sea sings one song of the deep.' } },
  },
  many: {
    land: { conquest: { name: 'The Unseen Throne', desc: 'Every den in the region answers to a ruler no one has ever seen.' }, trade: { name: 'The Lantern Market', desc: 'Lights blink across the region at night: every one a deal being made.' }, faith: { name: 'The Order of Light', desc: 'One light, many dens, and a wisdom everyone follows.' } },
    sea: { conquest: { name: 'The Ink Dominion', desc: 'Every grotto in the deep obeys, though none could say why.' }, trade: { name: 'The Glow Exchange', desc: 'Colour-talk binds the deep in a web of bargains.' }, faith: { name: 'The Deep Light', desc: 'The glowing ones are listened to from shore to abyss.' } },
  },
  swarm: {
    land: { conquest: { name: 'The Devouring Realm', desc: 'One hive rules the land, and eats what it rules.' }, trade: { name: 'The Honey Roads', desc: 'Mounds trade along scent-roads across the region.' }, faith: { name: 'The One Queen', desc: 'Every mound in the region feels the same Queen\'s will.' } },
    sea: { conquest: { name: 'The Coral Empire', desc: 'The reefs grow together under one colony\'s will.' }, trade: { name: 'The Brood Tide', desc: 'Larvae drift on the currents, binding reefs in kinship and trade.' }, faith: { name: 'The Mother Reef', desc: 'All reefs are one reef, and every polyp knows it.' } },
  },
  garden: {
    land: { conquest: { name: 'The Thorn Throne', desc: 'Groves and wildwood alike bow to one green crown.' }, trade: { name: 'The Seed Exchange', desc: 'Every grove trades seeds, and every grove grows richer.' }, faith: { name: 'The Green Covenant', desc: 'A promise between every grove and every living thing.' } },
    sea: { conquest: { name: 'The Kelp Crown', desc: 'The kelp forests are one realm, ruled from the Great Kelp.' }, trade: { name: 'The Drift Markets', desc: 'Harvests carried on the currents from bed to bed.' }, faith: { name: 'The Tide Covenant', desc: 'The sea is a garden, and everyone tends it.' } },
  },
};
G.ACTIVITIES.push(
  { id: 'found', name: 'Found a settlement', stage: 'society', turns: 3, desc: 'Send settlers to found a new settlement (up to 8). Costs 6 Food and a fifth of your people, but every settlement holds more people and earns Influence.' },
  { id: 'build', name: 'Build up a settlement', stage: 'society', turns: 2, desc: 'Grow your smallest settlement one size (up to 4). Costs 4 of your special resource, or 6 Food if you have too little.' },
  { id: 'gift', name: 'Send gifts', target: 'species', stage: 'society', turns: 1, desc: 'Send 3 Food to a neighbour people: they like you a good deal more.' },
  { id: 'trade', name: 'Trade', target: 'species', stage: 'society', desc: 'Trade with a friendly neighbour people (opinion 10 or more): +1 Food and +1 Influence a turn, and they warm to you. Ends if they turn against you.' },
  { id: 'raid', name: 'Raid', target: 'species', stage: 'society', turns: 1, desc: 'Raid a neighbour people for food and Influence. Strength decides it, and they will not forget.' },
);
// Build stamp: index.html checks that every file comes from the same release.
(window.PRIMORDIA_FILES = window.PRIMORDIA_FILES || {}).world = '21.11';
