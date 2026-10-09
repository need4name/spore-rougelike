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
    id: 'drifter', name: 'Drifter', cost: 0, color: 190, gimmick: 'drifter',
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
    id: 'grazer', name: 'Grazer', cost: 0, color: 110, gimmick: 'grazer',
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
    id: 'predator', name: 'Predator', cost: 30, color: 8, gimmick: 'predator',
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
    id: 'symbiote', name: 'Symbiote', cost: 50, needsEvo: 2, color: 150, gimmick: 'symbiote',
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
    id: 'parasite', name: 'Parasite', cost: 70, needsEvo: 5, color: 280, gimmick: 'parasite',
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
    id: 'colony', name: 'Colony', cost: 40, color: 40, gimmick: 'colony',
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
    id: 'mimic', name: 'Mimic', cost: 60, needsEvo: 3, color: 320, gimmick: 'mimic',
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
// At sea the same pairs are fins: same trade-offs, different names.
const SEA_LEG_NAMES = ['Eel', 'One fin pair', 'Two fin pairs', 'Three fin pairs', 'Many fins', 'Many fins', 'Fin fringe', 'Fin fringe', 'Fin fringe'];
const SEA_LEG_DESC = ['No fins at all. Wriggles through cracks and strikes from cover, but has no fin slots.', 'Only one pair of fins. Nimble and clever, but less sturdy.', 'The classic fish. No bonus, no cost.', 'Extra fins for steady swimming, but they need feeding.', 'Rows of fins rippling along the body. Fast and stable, but hungry.', 'Rows of fins rippling along the body. Fast and stable, but hungry.', 'A fringe of fins all along the body. Terrifyingly fast, always hungry.', 'A fringe of fins all along the body. Terrifyingly fast, always hungry.', 'A fringe of fins all along the body. Terrifyingly fast, always hungry.'];
G.legPlan = (n, habitat) => {
  const plan = landLegPlan(n);
  return habitat === 'sea' ? { ...plan, name: SEA_LEG_NAMES[n], desc: SEA_LEG_DESC[n] } : plan;
};
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
G.SCULPT = [
  { id: 'bodyLen', name: 'Body length', group: 'body', min: 0.7, max: 1.5, step: 0.05, def: 1 },
  { id: 'bodyHeight', name: 'Body height', group: 'body', min: 0.7, max: 1.5, step: 0.05, def: 1 },
  { id: 'spine', name: 'Back slope', group: 'body', min: -1, max: 1, step: 0.1, def: 0, ends: ['Head up', 'Head down'] },
  { id: 'neckLen', name: 'Neck length', group: 'body', min: 0, max: 1, step: 0.05, def: 0, only: 'land', cap: (run) => (run.era >= 2 ? 1 : 0.4), capWhy: 'Longer necks open in the Age of Giants' },
  { id: 'legLen', name: 'Limb length', group: 'limbs', min: 0.6, max: 1.6, step: 0.05, def: 1 },
  { id: 'legThick', name: 'Limb thickness', group: 'limbs', min: 0.6, max: 1.8, step: 0.05, def: 1 },
  { id: 'legSpread', name: 'Limb spacing', group: 'limbs', min: 0.5, max: 1.5, step: 0.05, def: 1, ends: ['Bunched', 'Far apart'] },
  { id: 'legShift', name: 'Limb position', group: 'limbs', min: -0.5, max: 0.5, step: 0.05, def: 0, ends: ['Toward the tail', 'Toward the head'] },
  { id: 'headSize', name: 'Head size', group: 'head', min: 0.7, max: 1.6, step: 0.05, def: 1 },
  { id: 'eyeCount', name: 'Number of eyes', group: 'head', min: 1, max: 6, step: 1, def: 1 },
  { id: 'eyeSize', name: 'Eye size', group: 'head', min: 0.6, max: 1.8, step: 0.05, def: 1 },
  { id: 'jaw', name: 'Jaw size', group: 'head', min: 0.6, max: 1.6, step: 0.05, def: 1 },
  { id: 'patScale', name: 'Pattern size', group: 'color', min: 0.5, max: 2, step: 0.05, def: 1 },
  { id: 'patDensity', name: 'Pattern density', group: 'color', min: 0.5, max: 2, step: 0.05, def: 1 },
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
G.VERSION = '11';
G.WHATS_NEW = {
  title: 'Update 11: The World Map',
  items: [
    'A new Map tab shows the biomes of your world. Fog hides what your kind does not know yet.',
    'Cells: a thermal vent, the sunlit surface and mud flats. Biomes only matter once you are multicellular, and only currents and storms move you.',
    'Land: open plains, jungle, desert, tundra, swamp and shore. Sea: warm seas, kelp forest, polar sea, vent fields and coast. Each has its own effects, scenery, events and parts.',
    'Early creatures migrate to a random neighbouring biome. At Cunning 6 or the Spark of Mind you can see your neighbours and choose. Keen Memory, Lone Wanderers or Symbolic Thought reveal the whole world.',
    'From the shore, return to the sea; from the coast, crawl onto land. It is a 5-turn journey, and you lose the parts that only worked in your old home.',
    '12 biome parts, like Winter Coat, Water Hump, Canopy Tail and Vent Gardens, only show up in their biome.',
  ],
};
