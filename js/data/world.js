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
  territorial: { name: 'Territorial', mods: { str: 1, tou: 1, cha: -1 }, desc: 'This is yours. Everyone knows it.' },
  // Multicellular body plans
  radial_plan: { name: 'Radial Colony', mods: { tou: 1, maxPop: 2 }, desc: 'A ring of cells that faces every direction at once.' },
  streamlined_plan: { name: 'Streamlined Body', mods: { spd: 2 }, desc: 'A head end and a tail end. Built to go forward.' },
  sessile_plan: { name: 'Anchored Colony', mods: { foodPerTurn: 1, spd: -1 }, desc: 'Grows in place and lets the food come to it.' },
  // Heritage traits, gained when leaving the Cell stage (like Spore's consequence traits).
  predator_lineage: { name: 'Predator Lineage', mods: { str: 1, huntBonus: 1 }, desc: 'Descended from hunters.', heritage: true },
  grazer_lineage: { name: 'Grazer Lineage', mods: { tou: 1, forageBonus: 1 }, desc: 'Descended from grazers.', heritage: true },
  adaptable_lineage: { name: 'Adaptable Lineage', mods: { cun: 1, spd: 1 }, desc: 'Descended from opportunists.', heritage: true },
  // Habitat
  land_pioneer: { name: 'Land Pioneer', mods: { spd: 1, exploreBonus: 1 }, desc: 'First of your kind to breathe air.' },
  deep_dweller: { name: 'Deep Dweller', mods: { tou: 1, maxPop: 1 }, desc: 'Your kind chose the endless sea.' },
  // Size (Age of Giants)
  giant: { name: 'Giant', mods: { str: 2, tou: 2, maxPop: 2, spd: -1, upkeep: 2 }, desc: 'Enormous. Few things can hurt you, but you eat a lot.' },
  mid_sized: { name: 'Mid-sized', mods: { str: 1, tou: 1 }, desc: 'Big enough to fight, small enough to hide.' },
  small_many: { name: 'Small and Many', mods: { spd: 2, cun: 1, growthCost: -1, upkeep: -1 }, desc: 'Tiny, quick and everywhere.' },
  // Spark of Mind
  inquisitive: { name: 'Inquisitive Mind', mods: { insightPerTurn: 1 }, desc: 'Every question leads to another.' },
  cooperative: { name: 'Cooperative Mind', mods: { cha: 1, growthCost: -1 }, desc: 'Thinks in "we", not "I".' },
  calculating: { name: 'Calculating Mind', mods: { cun: 1, huntBonus: 1 }, desc: 'Plans three moves ahead.' },
};

// The Mind tree: like CK3 cultural innovations. After the Spark of Mind your lineage
// earns Insight every turn, which goes into the innovation you are fascinated by.
// A tier opens once you have 2 innovations from the tier before it.
G.INNOVATIONS = [
  { id: 'keen_memory', tier: 1, name: 'Keen Memory', cost: 4, mods: { cun: 1, exploreBonus: 1 }, desc: 'Remember where food was, and where danger was.' },
  { id: 'alarm_calls', tier: 1, name: 'Alarm Calls', cost: 4, mods: { tou: 1, cha: 1 }, desc: 'A shout that means "run".' },
  { id: 'problem_solving', tier: 1, name: 'Problem Solving', cost: 4, mods: { cun: 2 }, desc: 'Figure out how to get the fruit down.' },
  { id: 'grooming', tier: 1, name: 'Social Grooming', cost: 4, mods: { cha: 1, growthCost: -1 }, desc: 'Bonds that hold a group together.' },
  { id: 'teaching', tier: 2, name: 'Teaching the Young', cost: 7, mods: { insightPerTurn: 1 }, desc: 'Each generation starts where the last one stopped.' },
  { id: 'pack_tactics', tier: 2, name: 'Pack Tactics', cost: 7, mods: { str: 1, huntBonus: 1 }, desc: 'Flank, chase, ambush.' },
  { id: 'food_caching', tier: 2, name: 'Food Caching', cost: 7, mods: { foodCap: 5, foodPerTurn: 1 }, desc: 'Bury it now, eat it in winter.' },
  { id: 'vocal_language', tier: 2, name: 'Vocal Language', cost: 7, mods: { cha: 2 }, desc: 'Sounds with meanings. Lets you speak with other species.' },
  { id: 'stone_tools', tier: 3, name: 'Tools', cost: 10, mods: { str: 2, forageBonus: 1 }, req: 'grasp', desc: 'A sharp edge changes everything. Needs a part that can grasp.' },
  { id: 'shelters', tier: 3, name: 'Shelters', cost: 10, mods: { tou: 2, maxPop: 2 }, desc: 'Nests, dens and walls against the world.' },
  { id: 'symbolic_thought', tier: 3, name: 'Symbolic Thought', cost: 10, mods: { cun: 2, insightPerTurn: 1 }, desc: 'This mark means that thing.' },
  { id: 'shared_ritual', tier: 3, name: 'Shared Ritual', cost: 10, mods: { cha: 2, dnaPerTurn: 1 }, desc: 'Dances and songs that everyone knows.' },
  { id: 'sapience', tier: 4, name: 'Self-Awareness', cost: 14, mods: { cun: 1, cha: 1 }, desc: 'You know that you are. This leads to the end of the Creature stage.' },
];

// Starting kits. Each archetype sets the parts you begin each body plan with.
G.ARCHETYPES = [
  {
    id: 'drifter', name: 'Drifter', cost: 0, color: 190,
    desc: 'A balanced omnivore. Good for learning the ropes.',
    mods: {},
    start: {
      cell: { mouth: 'proboscis', motion: 'cilia' },
      land: { mouth: 'mandibles', hindLimbs: 'runner_legs', senses: 'big_eyes' },
      sea: { mouth: 'mandibles', tail: 'fluke', senses: 'big_eyes' },
    },
  },
  {
    id: 'grazer', name: 'Grazer', cost: 0, color: 110,
    desc: 'A sturdy herbivore that rarely goes hungry.',
    mods: { maxPop: 2 },
    start: {
      cell: { mouth: 'filter_mouth', membrane: 'silica_shell' },
      land: { mouth: 'grinding_beak', hindLimbs: 'pillar_legs', skin: 'fur' },
      sea: { mouth: 'baleen', frontLimbs: 'front_flippers', skin: 'blubber' },
    },
  },
  {
    id: 'predator', name: 'Predator', cost: 30, color: 8,
    desc: 'Fast and hungry. Hunting is how you eat.',
    mods: { str: 1 },
    start: {
      cell: { mouth: 'tiny_jaw', motion: 'flagellum' },
      land: { mouth: 'fangs', hands: 'sharp_claws', senses: 'antennae' },
      sea: { mouth: 'fangs', frontLimbs: 'pectoral_fins', senses: 'electroreceptors' },
    },
  },
  {
    id: 'symbiote', name: 'Symbiote', cost: 50, color: 150,
    desc: 'Lives alongside helpers that feed it. Slow but rarely starves.',
    mods: { cha: 1 },
    start: {
      cell: { mouth: 'chloroplasts', membrane: 'slime_coat' },
      land: { mouth: 'trunk', back: 'moss_garden', skin: 'lichen_hide' },
      sea: { mouth: 'baleen', back: 'kelp_garden', skin: 'cleaner_skin' },
    },
  },
  {
    id: 'parasite', name: 'Parasite', cost: 70, color: 280,
    desc: 'Fragile, venomous and sneaky. High risk, high reward.',
    mods: { cun: 1, maxPop: -2 },
    start: {
      cell: { mouth: 'venom_stylet', motion: 'jet_vacuole' },
      land: { mouth: 'venom_fangs', frontLimbs: 'fore_tentacles', skin: 'warning_skin' },
      sea: { mouth: 'venom_fangs', hindLimbs: 'sea_tentacles', skin: 'warning_skin' },
    },
  },
];

// Home worlds. They change your stats, colors and which events show up.
G.ORIGINS = [
  { id: 'tidal', name: 'Tidal Pools', cost: 0, hue: 185, desc: 'Warm, shallow and forgiving. No modifiers.', mods: {}, dnaMult: 1 },
  { id: 'vents', name: 'Volcanic Vents', cost: 40, hue: 18, desc: 'Mutations come fast here: +25% DNA. Food is scarce: eat 1 more per turn.', mods: { upkeep: 1 }, dnaMult: 1.25 },
  { id: 'frozen', name: 'Frozen Sea', cost: 40, hue: 210, desc: 'Cold makes life tough and slow: +3 max Population, −1 Speed.', mods: { maxPop: 3, spd: -1 }, dnaMult: 1 },
  { id: 'toxic', name: 'Toxic Bloom', cost: 60, hue: 290, desc: 'Poisoned water: −2 max Population, but Venom parts show up three times as often and +15% DNA.', mods: { maxPop: -2 }, dnaMult: 1.15, boostKeyword: 'venom' },
];

// Mutation packs add parts to the draft pool.
G.PACKS = [
  { id: 'deep', name: 'Abyssal Light', cost: 35, desc: 'Adds 10 Glow parts: lures, photophores and living light.' },
  { id: 'armored', name: 'Ironclad', cost: 35, desc: 'Adds 6 Armor parts: plates, carapaces and horned brows.' },
  { id: 'venom', name: 'Venom Glands', cost: 45, desc: 'Adds 7 Venom parts: stylets, barbs, spurs and stingers.' },
];

// Permanent upgrades bought with Genetic Memory. Each level costs the next price.
G.BOONS = [
  { id: 'hardy', name: 'Hardy Ancestors', costs: [20, 40, 70], desc: '+1 max Population per level.' },
  { id: 'pantry', name: 'Ancestral Pantry', costs: [15, 30], desc: '+3 starting Food and +2 Food storage per level.' },
  { id: 'memory', name: 'Deep Memory', costs: [25, 50], desc: 'Start each stage with +3 DNA per level.' },
  { id: 'reroll', name: 'Second Chances', costs: [50], desc: 'Reroll each mutation draft once.' },
  { id: 'choice', name: 'Wider Gene Pool', costs: [80], desc: 'Mutation drafts offer 4 parts instead of 3.' },
];

// Stage pacing. DNA earned in a stage triggers drafts, milestones and finally the finale.
// Milestones are big events that change the rules (multicellularity, size, mind).
G.STAGES = {
  cell: {
    name: 'Cell Stage', turnName: 'Epoch',
    drafts: [4, 8, 13, 17],
    milestones: [{ at: 10, event: 'multicellularity' }],
    evolveAt: 21, finale: 'cell_finale',
  },
  creature: {
    name: 'Creature Stage', turnName: 'Generation',
    drafts: [5, 10, 15, 25, 30, 35, 46, 52, 58],
    milestones: [{ at: 20, event: 'age_of_giants' }, { at: 41, event: 'spark_of_mind' }],
    evolveAt: null, finale: 'creature_finale',
  },
};

// Eras of the Creature stage, shown in the top bar.
G.ERAS = { 1: 'First Steps', 2: 'Age of Giants', 3: 'Dawn of Mind' };

G.BASE_POP = 8;      // max Population
G.START_POP = 5;
G.BASE_FOOD = 5;
G.FOOD_CAP = 10;
G.GROWTH_COST = 3;   // spare Food needed for +1 Population
G.MAX_HOSTILITY = 5;

// Species names are built from these.
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
