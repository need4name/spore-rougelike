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

// The Mind tree: a skill tree, like CK3 cultural innovations. After the Spark of Mind your
// lineage earns Insight every turn, which goes into the idea it is fascinated by.
//   col       column in the tree (0-5), for drawing branches
//   req       { innovation: [any of], diet, stat: ['cha', 6], trait: [any of], tag: 'grasp', tier3: 2 }
//   excludes  ideas that can never be learned alongside this one
G.INNOVATIONS = [
  { id: 'ambush_instinct', tier: 1, col: 0, name: 'Ambush Instinct', cost: 6, mods: { str: 1, huntBonus: 1 }, req: { diet: ['carn', 'omni'] }, excludes: ['gentle_grazing'], desc: 'Wait, watch, pounce. The mind of a hunter.' },
  { id: 'keen_memory', tier: 1, col: 1, name: 'Keen Memory', cost: 6, mods: { cun: 1, exploreBonus: 1 }, desc: 'Remember where food was, and where danger was.' },
  { id: 'problem_solving', tier: 1, col: 2, name: 'Problem Solving', cost: 6, mods: { cun: 2 }, req: { stat: ['cun', 6] }, desc: 'Figure out how to get the fruit down.' },
  { id: 'alarm_calls', tier: 1, col: 4, name: 'Alarm Calls', cost: 6, mods: { tou: 1, cha: 1 }, req: { stat: ['cha', 5] }, desc: 'A shout that means "run".' },
  { id: 'gentle_grazing', tier: 1, col: 5, name: 'Gentle Grazing', cost: 6, mods: { forageBonus: 1, cha: 1 }, req: { diet: ['herb', 'omni'] }, excludes: ['ambush_instinct'], desc: 'Patient minds, shaped by plants and peace.' },

  { id: 'pack_tactics', tier: 2, col: 0, name: 'Pack Tactics', cost: 10, mods: { str: 1, huntBonus: 2 }, req: { innovation: ['ambush_instinct'] }, excludes: ['herd_defense'], desc: 'Flank, chase, ambush, together.' },
  { id: 'teaching', tier: 2, col: 1, name: 'Teaching the Young', cost: 10, mods: { insightPerTurn: 1 }, req: { innovation: ['keen_memory'] }, desc: 'Each generation starts where the last one stopped.' },
  { id: 'food_caching', tier: 2, col: 2, name: 'Food Caching', cost: 10, mods: { foodCap: 5, foodPerTurn: 1 }, req: { innovation: ['problem_solving'] }, desc: 'Bury it now, eat it in winter.' },
  { id: 'lone_wanderers', tier: 2, col: 3, name: 'Lone Wanderers', cost: 10, mods: { spd: 2, exploreBonus: 2 }, req: { innovation: ['keen_memory', 'problem_solving'] }, excludes: ['grooming', 'vocal_language'], desc: 'Your kind keeps to itself and roams far.' },
  { id: 'grooming', tier: 2, col: 4, name: 'Social Grooming', cost: 10, mods: { cha: 1, growthCost: -1 }, req: { innovation: ['alarm_calls', 'gentle_grazing'] }, excludes: ['lone_wanderers'], desc: 'Bonds that hold a group together.' },
  { id: 'herd_defense', tier: 2, col: 5, name: 'Herd Defense', cost: 10, mods: { tou: 2, damageReduce: 1 }, req: { innovation: ['gentle_grazing', 'alarm_calls'] }, excludes: ['pack_tactics'], desc: 'Young in the middle, horns facing out.' },

  { id: 'war_bands', tier: 3, col: 0, name: 'War Bands', cost: 14, mods: { str: 3 }, req: { innovation: ['pack_tactics'], trait: ['aggressive', 'feared', 'territorial'] }, excludes: ['shared_ritual'], desc: 'Organized violence. Rivals learn to fear you.' },
  { id: 'symbolic_thought', tier: 3, col: 1, name: 'Symbolic Thought', cost: 14, mods: { cun: 2, insightPerTurn: 1 }, req: { innovation: ['teaching'] }, desc: 'This mark means that thing.' },
  { id: 'shelters', tier: 3, col: 2, name: 'Shelters', cost: 14, mods: { tou: 2, maxPop: 3 }, req: { innovation: ['food_caching', 'herd_defense', 'pack_tactics'] }, desc: 'Nests, dens and walls against the world.' },
  { id: 'stone_tools', tier: 3, col: 3, name: 'Tools', cost: 14, mods: { str: 2, forageBonus: 1 }, req: { innovation: ['food_caching', 'teaching', 'lone_wanderers'], tag: 'grasp' }, desc: 'A sharp edge changes everything.' },
  { id: 'vocal_language', tier: 3, col: 4, name: 'Vocal Language', cost: 14, mods: { cha: 2 }, req: { innovation: ['grooming'] }, excludes: ['lone_wanderers'], desc: 'Sounds with meanings. Lets you speak with other species.' },
  { id: 'shared_ritual', tier: 3, col: 5, name: 'Shared Ritual', cost: 14, mods: { cha: 2, dnaPerTurn: 1 }, req: { innovation: ['herd_defense', 'grooming'] }, excludes: ['war_bands'], desc: 'Dances and songs that everyone knows.' },

  { id: 'sapience', tier: 4, col: 2.5, name: 'Self-Awareness', cost: 22, mods: { cun: 1, cha: 1 }, req: { tier3: 2 }, desc: 'You know that you are. This leads to the end of the Creature stage.' },
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
  cilia: { land: 'padded_paws', sea: 'pectoral_fins' },
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
  stinging_cilia: { land: 'venom_barbs', sea: 'stinger_tail' },
  plated_eye: { land: 'horned_brow', sea: 'horned_brow' },
  fat_vacuole: { land: 'fat_hump', sea: 'blubber' },
  algae_chamber: { land: 'moss_garden', sea: 'kelp_garden' },
  stomach_chamber: { land: 'fat_hump', sea: 'fat_hump' },
  neuron_cluster: { land: 'grasping_fingers', sea: 'sea_tentacles' },
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
    id: 'drifter', name: 'Drifter', cost: 0, color: 190,
    desc: 'A balanced omnivore. Good for learning the ropes.',
    mods: {},
    start: {
      cell: { mouth: 'proboscis', motion: 'cilia' },
      land: { mouth: 'mandibles', senses: 'big_eyes' },
      sea: { mouth: 'mandibles', tail: 'fluke', senses: 'big_eyes' },
    },
  },
  {
    id: 'grazer', name: 'Grazer', cost: 0, color: 110,
    desc: 'A sturdy herbivore that rarely goes hungry.',
    mods: { maxPop: 2 },
    start: {
      cell: { mouth: 'filter_mouth', membrane: 'silica_shell' },
      land: { mouth: 'grinding_beak', skin: 'fur' },
      sea: { mouth: 'baleen', skin: 'blubber' },
    },
  },
  {
    id: 'predator', name: 'Predator', cost: 30, color: 8,
    desc: 'Fast and hungry. Hunting is how you eat.',
    mods: { str: 1 },
    start: {
      cell: { mouth: 'tiny_jaw', motion: 'flagellum' },
      land: { mouth: 'fangs', hands: 'sharp_claws', senses: 'antennae' },
      sea: { mouth: 'fangs', senses: 'electroreceptors' },
    },
  },
  {
    id: 'symbiote', name: 'Symbiote', cost: 50, needsEvo: 2, color: 150,
    desc: 'Lives alongside helpers that feed it. Slow but rarely starves.',
    mods: { cha: 1 },
    start: {
      cell: { mouth: 'chloroplasts', membrane: 'slime_coat' },
      land: { mouth: 'trunk', back: 'moss_garden', skin: 'lichen_hide' },
      sea: { mouth: 'baleen', back: 'kelp_garden', skin: 'cleaner_skin' },
    },
  },
  {
    id: 'parasite', name: 'Parasite', cost: 70, needsEvo: 5, color: 280,
    desc: 'Fragile, venomous and sneaky. High risk, high reward.',
    mods: { cun: 1, maxPop: -2 },
    start: {
      cell: { mouth: 'venom_stylet', motion: 'jet_vacuole' },
      land: { mouth: 'venom_fangs', skin: 'warning_skin' },
      sea: { mouth: 'venom_fangs', skin: 'warning_skin' },
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
  { id: 'deep', name: 'Abyssal Light', cost: 35, desc: 'Adds 10 Glow parts: lures, photophores and living light.' },
  { id: 'armored', name: 'Ironclad', cost: 35, desc: 'Adds 6 Armor parts: plates, carapaces and horned brows.' },
  { id: 'venom', name: 'Venom Glands', cost: 45, needsEvo: 1, desc: 'Adds 7 Venom parts: stylets, barbs, spurs and stingers.' },
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
    drafts: [4, 8, 12, 19, 24, 29, 34, 39],
    milestones: [{ at: 15, event: 'multicellularity' }],
    evolveAt: 44, finale: 'cell_finale',
  },
  creature: {
    name: 'Creature Stage', turnName: 'Generation',
    drafts: [5, 10, 15, 20, 28, 34, 40, 50, 56, 62, 70],
    milestones: [{ at: 18, event: 'age_of_giants' }, { at: 32, event: 'spark_of_mind' }],
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
G.legPlan = (n) => {
  if (n === 0) return { name: 'Serpent', desc: 'No legs at all. Slithers, hides in burrows and strikes from cover, but has no limb slots.', mods: { cun: 2, spd: 1, huntBonus: 1, str: -1 }, off: ['frontLimbs', 'hindLimbs', 'hands', 'feet'] };
  if (n === 1) return { name: 'Two legs', desc: 'Stands on its hind legs; the front pair is gone.', mods: { cun: 1, insightPerTurn: 1, tou: -1 }, off: ['frontLimbs', 'hands'] };
  if (n === 2) return { name: 'Four legs', desc: 'The classic body. No bonus, no cost.', mods: {} };
  if (n === 3) return { name: 'Six legs', desc: 'Stable and quick, but every leg needs feeding.', mods: { tou: 1, spd: 1, upkeep: 1 } };
  if (n <= 5) return { name: 'Many legs', desc: 'A long, segmented crawler. Fast and hard to topple, but hungry.', mods: { tou: 1, spd: 2, upkeep: 2, cha: -1 } };
  return { name: 'Centipede', desc: 'Dozens of legs. Terrifyingly fast and tough, but always hungry and hard to love.', mods: { tou: 2, spd: 3, upkeep: 3, cha: -2 } };
};
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
  ],
  shape: [
    { id: 'round', name: 'Round' },
    { id: 'slim', name: 'Slim' },
    { id: 'flat', name: 'Flat' },
    { id: 'pear', name: 'Pear' },
    { id: 'tall', name: 'Tall' },
    { id: 'hunched', name: 'Hunched', need: { stat: ['str', 5] }, why: 'Needs Strength 5' },
    { id: 'long', name: 'Long', need: { era: 2 }, why: 'Opens in the Age of Giants' },
  ],
  head: [
    { id: 'round', name: 'Round' },
    { id: 'snout', name: 'Long snout' },
    { id: 'flat', name: 'Flat' },
    { id: 'big', name: 'Big brain', need: { stat: ['cun', 6] }, why: 'Needs Cunning 6' },
    { id: 'crest', name: 'Crest', need: { keyword: 'armor' }, why: 'Needs an Armor part' },
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

// Real time: seconds per turn at each speed.
G.SPEEDS = [0, 2.4, 1.2, 0.6];

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
