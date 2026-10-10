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
  specialPerTurn: 'Fire or Song per turn',
  forageBonus: 'Food while Foraging',
  huntBonus: 'Food while Hunting',
  exploreBonus: 'DNA while Exploring',
  upkeep: 'Food eaten per turn',
  damageReduce: 'damage taken',
  foodCap: 'Food storage',
  growthCost: 'Food needed to grow',
};

// Synergies. Having 2 or 3 parts with the same keyword unlocks a bonus. Tier 3 adds to tier 2.
G.KEYWORDS = {
  venom: { name: 'Venom', color: '#b98cf2', tiers: { 2: { mods: { str: 2 }, desc: '+2 Strength' }, 3: { mods: { huntBonus: 2, damageReduce: 1 }, desc: 'Hunting gives +2 Food, and predators think twice (−1 damage taken)' } } },
  armor: { name: 'Armor', color: '#a9b6bd', tiers: { 2: { mods: { tou: 2 }, desc: '+2 Toughness' }, 3: { mods: { damageReduce: 1, maxPop: 2 }, desc: '−1 damage taken and +2 max Population' } } },
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
  small: { name: 'Small', popMult: 1.5, eatDiv: 3, damageMult: 1.5 },
  mid: { name: 'Mid-sized', popMult: 1, eatDiv: 2, damageMult: 1 },
  giant: { name: 'Giant', popMult: 0.65, eatDiv: 1.5, damageMult: 1 },
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
  { id: 'frozen', name: 'Frozen Sea', cost: 40, hue: 210, desc: 'Cold makes life tough and slow: +3 max Population, −1 Speed.', mods: { maxPop: 3, spd: -1 }, dnaMult: 1 },
  { id: 'toxic', name: 'Toxic Bloom', cost: 60, needsEvo: 4, hue: 290, desc: 'Poisoned water: −2 max Population, but Venom parts show up three times as often and +15% DNA.', mods: { maxPop: -2 }, dnaMult: 1.15, boostKeyword: 'venom' },
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
  { id: 'hardy', name: 'Hardy Ancestors', col: 0, tier: 1, costs: [8, 18, 35], desc: '+1 max Population per level.' },
  { id: 'pantry', name: 'Ancestral Pantry', col: 1, tier: 1, costs: [6, 15], desc: '+3 starting Food and +2 Food storage per level.' },
  { id: 'memory', name: 'Deep Memory', col: 2, tier: 1, costs: [8, 20], desc: 'Start each stage with +3 DNA per level.' },
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
  { id: 'twin_hands', name: 'Twin Hands', col: 4, tier: 4, req: ['twin_senses'], costs: [90], twin: 'hands', desc: 'A second Hands (or Arms) socket: claws and clever fingers.' },
  { id: 'twin_skin', name: 'Twin Skins', col: 5, tier: 4, req: ['twin_back'], costs: [80], twin: 'skin', desc: 'A second Skin socket: armor and camouflage.' },
];
G.BOON = {}; G.BOONS.forEach((b) => { G.BOON[b.id] = b; });

// Fossils: a snapshot at each milestone. Reviving one from amber costs Genetic Memory,
// and a revived run earns less, so fresh runs still matter.
G.REVIVE_COST = { multicellular: 12, creature: 25, giants: 35, mind: 45 };
G.REVIVE_MULT = 0.6;
G.FOSSIL_KEEP = 8; // recent fossils kept besides the ones in amber

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
  ],
  finish: [
    { id: 'matte', name: 'Matte' },
    { id: 'glossy', name: 'Glossy' },
    { id: 'glowing', name: 'Glowing edges', need: { keyword: 'glow' }, why: 'Needs a Glow part' },
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
  { id: 'eyeCount', name: 'Number of eyes', group: 'head', bodies: ['land', 'sea', 'serpent'], min: 1, max: 6, step: 1, def: 1 },
  { id: 'eyeSize', name: 'Eye size', group: 'head', bodies: ['land', 'sea', 'serpent'], min: 0.6, max: 1.8, step: 0.05, def: 1 },
  { id: 'jaw', name: 'Jaw size', group: 'head', bodies: ['land', 'serpent'], min: 0.6, max: 1.6, step: 0.05, def: 1 },
  { id: 'patScale', name: 'Pattern size', group: 'color', bodies: ALL_BODIES, min: 0.5, max: 2, step: 0.05, def: 1 },
  { id: 'patDensity', name: 'Pattern density', group: 'color', bodies: ALL_BODIES, min: 0.5, max: 2, step: 0.05, def: 1 },
];
G.SCULPT_BY_ID = {}; G.SCULPT.forEach((x) => { G.SCULPT_BY_ID[x.id] = x; });
G.COLOR_KEYS = ['hue', 'belly', 'accent', 'accent2']; // hue sliders, 0-359
G.EDITOR_COST = 2; // DNA to open the editor between milestones

// Real time: seconds per turn at each speed.
G.SPEEDS = [0, 2.4, 1.2, 0.6];

G.PREDATION = 0.34; // base chance per turn that each predator strikes
G.HARSH = 6;        // extra difficulty on every check; the Evolution Tree pays it back
G.BASE_POP = 8;      // max Population
G.START_POP = 4;
G.BASE_FOOD = 5;
G.FOOD_CAP = 10;
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
    { id: 'plains', name: 'Open Plains', x: 50, y: 50, next: ['jungle', 'desert', 'tundra', 'swamp', 'shore'], mods: {}, desc: 'Grass to the horizon. No surprises.' },
    { id: 'jungle', name: 'Jungle', x: 22, y: 28, next: ['plains', 'swamp'], mods: { cun: 1, forageBonus: 1, spd: -1 }, desc: 'Thick, hot and full of food, and of things hiding in the leaves.' },
    { id: 'desert', name: 'Desert', x: 78, y: 26, next: ['plains', 'tundra'], mods: { tou: 1, foodPerTurn: -1 }, desc: 'Scorching days, freezing nights, and little to eat. What lives here is tough.' },
    { id: 'tundra', name: 'Tundra', x: 80, y: 70, next: ['plains', 'desert'], mods: { maxPop: 2, foodPerTurn: -1, spd: -1 }, desc: 'Cold, wide and lean. Herds grow big to keep warm.' },
    { id: 'swamp', name: 'Swamp', x: 20, y: 70, next: ['plains', 'jungle', 'shore'], mods: { forageBonus: 1, tou: -1 }, desc: 'Rich, wet and sickly.' },
    { id: 'shore', name: 'Shore', x: 50, y: 88, next: ['plains', 'swamp'], mods: { forageBonus: 1, huntBonus: 1 }, desc: 'Where the land meets the sea. From here you could return to the water.', crossing: true },
  ],
  sea: [
    { id: 'warm', name: 'Warm Seas', x: 50, y: 50, next: ['kelp', 'polar', 'vents', 'coast'], mods: {}, desc: 'Blue water as far as you can see.' },
    { id: 'kelp', name: 'Kelp Forest', x: 22, y: 28, next: ['warm', 'coast'], mods: { forageBonus: 2, spd: -1 }, desc: 'Swaying forests full of food and hiding places.' },
    { id: 'polar', name: 'Polar Sea', x: 78, y: 26, next: ['warm', 'vents'], mods: { maxPop: 3, tou: 1, foodPerTurn: -1 }, desc: 'Icy water under floating ice. Big, tough life.' },
    { id: 'vents', name: 'Vent Fields', x: 80, y: 70, next: ['warm', 'polar'], mods: { dnaPerTurn: 1, foodPerTurn: -1 }, desc: 'Smoking vents on the sea floor. Strange chemistry speeds up change.' },
    { id: 'coast', name: 'Coast', x: 25, y: 80, next: ['warm', 'kelp'], mods: { huntBonus: 1, forageBonus: 1 }, desc: 'Tide pools and beaches. From here you could crawl onto land.', crossing: true },
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
G.VERSION = '14';
G.WHATS_NEW = {
  title: 'Update 14: First Fires',
  items: [
    'The Tribe stage. Toolmakers and Singers no longer end at their Creature ending: they become a people. Toolmakers become a Tribe on land or a Shell Clan at sea; Singers become a Choir on land or a Pod at sea.',
    'Your Creature ending is now a checkpoint. It pays out its Genetic Memory straight away, so you keep it even if your people die out.',
    'Ideas replace DNA. Each goal brings a Discovery, 1 of 3, from your Path, your home and what your body can do (hands, voice, glow, venom, armor, wings, eyes, speed). The right pairs combine into greater discoveries.',
    'Leaders. Your people have a leader with two traits. Leaders grow old and die, and then you choose the next one from three.',
    'Fire and Song. Toolmakers keep Fire (or Vent-heat at sea): it warms you through the cold, keeps hunters away, and crafts gear. Singers keep Song: it makes you charming and clever, but if many die at once, verses are lost, and discoveries with them.',
    'New Activities: Tame a species, Revere one as your totem, hold a Ceremony, Craft gear (Toolmakers) or Teach the songs (Singers).',
    'Strangers: your old nemesis, or a rival, learns to think too, and its band remembers how you treated it.',
    'Your starting archetype still matters: each temperament has its own Tribe rule (hunters hunt better, bonders tame faster, takers steal knowledge, wanderers learn on the road).',
    'The Founding: choose to Settle, Roam or Conquer. 12 Tribe endings to find.',
    'Stage Select: start a new run at the beginning of any Tribe you have founded, for free.',
    'Other Paths (Many Minds, Swarm, Garden) still end at their Creature ending until Update 15.',
  ],
};

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
  { id: 'discoveries', title: 'Discoveries', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'draft' && run.stage === 'tribe',
    text: 'Learn a discovery, or combine it with one you know. Combining keeps only the result, but the result is stronger. New combinations go in your Codex and earn Genetic Memory.' },
  { id: 'succession', title: 'Leaders', when: (run, ui) => ui.screen === 'game' && run && run.phase === 'event' && run.event.id === 'succession',
    text: 'Each candidate has two traits that change your stats while they lead. Leaders grow old, so the choice comes round again.' },
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
  milestones: [{ at: 0, event: 'first_{path}' }, { at: 34, event: 'strangers' }, { at: 70, event: 'elders' }],
  evolveAt: 120,
};
G.TRIBE_PATHS = ['tool', 'song'];

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
    desc: 'Singers remember in songs. Your Song is your people\'s memory: it makes you charming and clever, but when many of you die at once, verses are lost, and with them, discoveries (Activities: Teach the songs).',
  },
};

// Leaders: a name and two traits. When a leader dies, you choose the next one.
G.LEADER_SYLLABLES = { a: ['A', 'Ka', 'Mo', 'Ri', 'Tu', 'Ne', 'Sha', 'Lo', 'Ve', 'Zu', 'Ori', 'Ema', 'Ush', 'Ilo', 'Bra'], b: ['sha', 'ro', 'na', 'ki', 'lu', 'ven', 'tor', 'ra', 'mi', 'dun', 'eth', 'ka', 'sel'] };
G.LEADER_TRAITS = {
  brave: { name: 'Brave', mods: { str: 1 } },
  wise: { name: 'Wise', mods: { ideasPerTurn: 1 } },
  kind: { name: 'Kind', mods: { cha: 1 } },
  sturdy: { name: 'Sturdy', mods: { tou: 1 } },
  quick: { name: 'Quick', mods: { spd: 1 } },
  clever: { name: 'Clever', mods: { cun: 1 } },
  cruel: { name: 'Cruel', mods: { str: 2, cha: -1 } },
  lazy: { name: 'Lazy', mods: { ideasPerTurn: -1, tou: 1 } },
  curious: { name: 'Curious', mods: { cun: 1, exploreBonus: 1 } },
  fearful: { name: 'Fearful', mods: { spd: 1, str: -1 } },
  generous: { name: 'Generous', mods: { cha: 1, foodPerTurn: -1, maxPop: 1 } },
  keen: { name: 'Keeper-born', mods: { specialPerTurn: 1 } },
};

// What each temperament (your starting archetype) adds in the Tribe stage.
G.TRIBE_TEMPER = {
  hunter: { mods: { str: 1, huntBonus: 2 }, rule: 'Hunts bring back half as much food again, and rival bands fear you.' },
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
];
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
};

// Activities only for the Tribe stage.
G.ACTIVITIES.push(
  { id: 'tame', name: 'Tame', target: 'species', stage: 'tribe', desc: 'Win a species\' trust, slowly, with Charm, until it lives alongside your people. Each tamed species gives 1 Food a turn and never attacks you.' },
  { id: 'revere', name: 'Revere', target: 'species', stage: 'tribe', turns: 2, desc: 'Make a species your totem: your people take on a little of its strength, and it grows friendlier. You can only have one totem.' },
  { id: 'ceremony', name: 'Ceremony', stage: 'tribe', turns: 2, desc: 'Gather everyone for two turns of dance and story (−1 Food a turn): +2 of your special resource and +1 Idea each turn. Needs 8 turns between ceremonies.' },
  { id: 'craft', name: 'Craft', stage: 'tribe', path: 'tool', turns: 2, desc: 'Spend 4 of your Fire or Vent-heat to craft gear for your people: each level of gear gives +1 Strength (and +1 Toughness every second level), up to 5.' },
  { id: 'teach', name: 'Teach the songs', stage: 'tribe', path: 'song', turns: 3, desc: 'Three turns of teaching (−1 Food a turn): +2 Song each turn, and the next time many of you die, no verses are lost.' },
);
