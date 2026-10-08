// Stats, synergies, traits, archetypes, origin worlds and the unlock shop.
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
  maxHealth: 'max Health',
  foodPerTurn: 'food per turn',
  healthPerTurn: 'Health per turn',
  dnaPerTurn: 'DNA per turn',
  forageBonus: 'food from foraging',
  huntBonus: 'food from hunting',
  exploreBonus: 'DNA from exploring',
  upkeep: 'food eaten per turn',
  damageReduce: 'damage taken',
};

// Synergies. Having 2 or 3 parts with the same keyword unlocks a bonus.
// Tier 3 adds to tier 2.
G.KEYWORDS = {
  venom: {
    name: 'Venom', color: '#b98cf2',
    tiers: { 2: { mods: { str: 2 }, desc: '+2 Strength' }, 3: { mods: { huntBonus: 2 }, desc: 'Hunts bring back +2 food' } },
  },
  armor: {
    name: 'Armor', color: '#a9b6bd',
    tiers: { 2: { mods: { tou: 2 }, desc: '+2 Toughness' }, 3: { mods: { damageReduce: 1 }, desc: 'Take 1 less damage from everything' } },
  },
  swift: {
    name: 'Swift', color: '#f2c14e',
    tiers: { 2: { mods: { spd: 2 }, desc: '+2 Speed' }, 3: { mods: { exploreBonus: 2 }, desc: 'Exploring finds +2 DNA' } },
  },
  glow: {
    name: 'Glow', color: '#6fe0d4',
    tiers: { 2: { mods: { cha: 2 }, desc: '+2 Charm' }, 3: { mods: { dnaPerTurn: 1 }, desc: '+1 DNA every turn' } },
  },
  symbiont: {
    name: 'Symbiont', color: '#8fd16a',
    tiers: { 2: { mods: { foodPerTurn: 1 }, desc: '+1 food every turn' }, 3: { mods: { healthPerTurn: 1 }, desc: 'Heal 1 Health every turn' } },
  },
};

// Traits are gained from events and stay for the whole run, across stages.
G.TRAITS = {
  cautious: { name: 'Cautious', mods: { tou: 1, spd: -1 }, desc: 'Survives by never taking chances.' },
  curious: { name: 'Curious', mods: { cun: 1 }, desc: 'Pokes at everything new.' },
  aggressive: { name: 'Aggressive', mods: { str: 1, cha: -1 }, desc: 'Starts fights and usually finishes them.' },
  gentle: { name: 'Gentle', mods: { cha: 1, str: -1 }, desc: 'Other species trust you.' },
  feared: { name: 'Feared', mods: { str: 1, cha: -1 }, desc: 'Your reputation arrives before you do.' },
  resilient: { name: 'Resilient', mods: { maxHealth: 2 }, desc: 'Hard to kill.' },
  scavenger: { name: 'Scavenger', mods: { forageBonus: 1 }, desc: 'Nothing goes to waste.' },
  dazzling: { name: 'Dazzling', mods: { cha: 1 }, desc: 'Light shows confuse friend and foe.' },
  endosymbiont: { name: 'Endosymbiont', mods: { foodPerTurn: 1 }, desc: 'Something you swallowed now lives inside you and helps.' },
  colonial: { name: 'Colonial', mods: { maxHealth: 2, spd: -1 }, desc: 'Many cells living as one.' },
  social: { name: 'Social', mods: { cha: 1 }, desc: 'Prefers company.' },
  toxic_affinity: { name: 'Toxic Affinity', mods: { tou: 1 }, desc: 'Poison barely bothers you.' },
  scarred: { name: 'Scarred', mods: { tou: 1, cha: -1 }, desc: 'Survived something terrible.' },
  hoarder: { name: 'Hoarder', mods: { foodPerTurn: 1, spd: -1 }, desc: 'Always keeps something stashed.' },
  meek: { name: 'Meek', mods: { cha: 1, str: -1 }, desc: 'Avoids trouble by bowing low.' },
  tool_user: { name: 'Tool User', mods: { cun: 2 }, desc: 'Holds a stick and knows what to do with it.' },
  pack_hunter: { name: 'Pack Hunter', mods: { huntBonus: 1, cha: 1 }, desc: 'Hunts together, eats together.' },
  migratory: { name: 'Migratory', mods: { spd: 1 }, desc: 'Always moving to greener ground.' },
  // Heritage traits, gained when leaving the Cell stage (like Spore's consequence traits).
  predator_lineage: { name: 'Predator Lineage', mods: { str: 1, huntBonus: 1 }, desc: 'Descended from hunters.', heritage: true },
  grazer_lineage: { name: 'Grazer Lineage', mods: { tou: 1, forageBonus: 1 }, desc: 'Descended from grazers.', heritage: true },
  adaptable_lineage: { name: 'Adaptable Lineage', mods: { cun: 1, spd: 1 }, desc: 'Descended from opportunists.', heritage: true },
  // Cell finale traits
  land_pioneer: { name: 'Land Pioneer', mods: { spd: 1, exploreBonus: 1 }, desc: 'First of your kind to feel sand.' },
  deep_giant: { name: 'Deep Giant', mods: { maxHealth: 3 }, desc: 'Grew huge in the dark before leaving it.' },
  apex_cell: { name: 'Apex Devourer', mods: { str: 2 }, desc: 'Ate every rival in the sea.' },
};

// Starting kits. Each archetype sets the parts you begin each stage with.
G.ARCHETYPES = [
  {
    id: 'drifter', name: 'Drifter', cost: 0, color: 190,
    desc: 'A balanced omnivore. Good for learning the ropes.',
    mods: {},
    start: { cell: { mouth: 'proboscis', motion: 'cilia' }, creature: { mouth: 'mandibles', limbs: 'runner_legs', senses: 'big_eyes' } },
  },
  {
    id: 'grazer', name: 'Grazer', cost: 0, color: 110,
    desc: 'A sturdy herbivore that rarely goes hungry.',
    mods: { maxHealth: 2 },
    start: { cell: { mouth: 'filter_mouth', defense: 'silica_shell' }, creature: { mouth: 'grinding_beak', limbs: 'pillar_legs', skin: 'fur' } },
  },
  {
    id: 'predator', name: 'Predator', cost: 30, color: 8,
    desc: 'Fast and hungry. Hunting is how you eat.',
    mods: { str: 1 },
    start: { cell: { mouth: 'tiny_jaw', motion: 'flagellum' }, creature: { mouth: 'fangs', limbs: 'hooked_talons', senses: 'antennae' } },
  },
  {
    id: 'symbiote', name: 'Symbiote', cost: 50, color: 150,
    desc: 'Lives alongside helpers that feed it. Slow but never starves.',
    mods: { cha: 1 },
    start: { cell: { mouth: 'chloroplasts', sense: 'symbiotic_algae' }, creature: { mouth: 'trunk', back: 'moss_garden', skin: 'lichen_hide' } },
  },
  {
    id: 'parasite', name: 'Parasite', cost: 70, color: 280,
    desc: 'Fragile, venomous and sneaky. High risk, high reward.',
    mods: { cun: 1, maxHealth: -2 },
    start: { cell: { mouth: 'venom_stylet', motion: 'jet_vacuole' }, creature: { mouth: 'venom_fangs', limbs: 'tentacles', skin: 'warning_skin' } },
  },
];

// Home worlds. They change your stats, colors and which events show up.
G.ORIGINS = [
  {
    id: 'tidal', name: 'Tidal Pools', cost: 0, hue: 185,
    desc: 'Warm, shallow and forgiving. No modifiers.',
    mods: {}, dnaMult: 1,
  },
  {
    id: 'vents', name: 'Volcanic Vents', cost: 40, hue: 18,
    desc: 'Mutations come fast here: +25% DNA. Food is scarce: eat 1 more per turn.',
    mods: { upkeep: 1 }, dnaMult: 1.25,
  },
  {
    id: 'frozen', name: 'Frozen Sea', cost: 40, hue: 210,
    desc: 'Cold makes life tough and slow: +3 max Health, −1 Speed.',
    mods: { maxHealth: 3, spd: -1 }, dnaMult: 1,
  },
  {
    id: 'toxic', name: 'Toxic Bloom', cost: 60, hue: 290,
    desc: 'Poisoned water: −2 max Health, but Venom parts show up three times as often and +15% DNA.',
    mods: { maxHealth: -2 }, dnaMult: 1.15, boostKeyword: 'venom',
  },
];

// Mutation packs add parts to the draft pool.
G.PACKS = [
  { id: 'deep', name: 'Abyssal Light', cost: 35, desc: 'Adds 7 Glow parts: lures, photophores and living light.' },
  { id: 'armored', name: 'Ironclad', cost: 35, desc: 'Adds 5 Armor parts: plates, carapaces and horned brows.' },
  { id: 'venom', name: 'Venom Glands', cost: 45, desc: 'Adds 4 Venom parts: stylets, stinging cilia, fangs and quills.' },
];

// Permanent upgrades bought with Genetic Memory. Each level costs the next price.
G.BOONS = [
  { id: 'hardy', name: 'Hardy Ancestors', costs: [20, 40, 70], desc: '+1 starting max Health per level.' },
  { id: 'pantry', name: 'Ancestral Pantry', costs: [15, 30], desc: '+2 starting food per level.' },
  { id: 'memory', name: 'Deep Memory', costs: [25, 50], desc: 'Start each stage with +3 DNA per level.' },
  { id: 'reroll', name: 'Second Chances', costs: [50], desc: 'Reroll each mutation draft once.' },
  { id: 'choice', name: 'Wider Gene Pool', costs: [80], desc: 'Mutation drafts offer 4 parts instead of 3.' },
];

// Stage pacing. DNA earned in a stage triggers drafts and, finally, the stage finale.
G.STAGES = {
  cell: { name: 'Cell Stage', turnName: 'Epoch', drafts: [7, 14], evolveAt: 20, upkeep: 1, finale: 'cell_finale' },
  creature: { name: 'Creature Stage', turnName: 'Generation', drafts: [8, 16, 24, 32], evolveAt: 40, upkeep: 2, finale: 'creature_finale' },
};

G.BASE_HEALTH = 7;
G.BASE_FOOD = 5;
G.MAX_HOSTILITY = 5;

// Rival species names are built from these.
G.RIVAL_NAMES = {
  first: ['Moss', 'Stripe', 'Bramble', 'Tusk', 'Gloom', 'Pebble', 'Thorn', 'Dusk', 'Reed', 'Ember', 'Frost', 'Mud', 'Shell', 'Bark', 'Silt'],
  last: ['backs', 'snouts', 'hoppers', 'maws', 'gliders', 'stalkers', 'trotters', 'crests', 'waddlers', 'horns', 'tails', 'skulkers'],
};
