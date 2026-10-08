// Body parts. Each part fills one slot and is offered in mutation drafts.
//
// Fields:
//   id, name, stage ('cell' | 'creature'), slot, desc
//   diet      mouths only: 'herb' (herbivore), 'carn' (carnivore), 'omni'
//   keywords  synergy tags, see keywords.js
//   mods      stat changes, see the list in README.md
//   pack      'base' parts are always in the draft pool; others need an unlock
//   rarity    1 = rare, 2 = uncommon, 3 = common (higher shows up more)
window.G = window.G || {};

G.SLOTS = {
  cell: [
    { id: 'mouth', name: 'Mouth' },
    { id: 'motion', name: 'Motion' },
    { id: 'defense', name: 'Defense' },
    { id: 'sense', name: 'Sense' },
  ],
  creature: [
    { id: 'mouth', name: 'Mouth' },
    { id: 'limbs', name: 'Limbs' },
    { id: 'back', name: 'Back' },
    { id: 'senses', name: 'Senses' },
    { id: 'skin', name: 'Skin' },
  ],
};

G.PARTS = [
  // ---------- Cell stage ----------
  // Mouths
  { id: 'filter_mouth', name: 'Filter Mouth', stage: 'cell', slot: 'mouth', diet: 'herb', mods: { forageBonus: 1 }, rarity: 3, desc: 'Strains drifting algae. Herbivore.' },
  { id: 'tiny_jaw', name: 'Tiny Jaw', stage: 'cell', slot: 'mouth', diet: 'carn', mods: { str: 1, huntBonus: 1 }, rarity: 3, desc: 'Snaps up smaller cells. Carnivore.' },
  { id: 'proboscis', name: 'Proboscis', stage: 'cell', slot: 'mouth', diet: 'omni', mods: { cun: 1 }, rarity: 3, desc: 'Probes for anything edible. Omnivore.' },
  { id: 'engulfing_maw', name: 'Engulfing Maw', stage: 'cell', slot: 'mouth', diet: 'carn', mods: { str: 2 }, rarity: 2, desc: 'Swallows prey whole. Carnivore.' },
  { id: 'chloroplasts', name: 'Chloroplasts', stage: 'cell', slot: 'mouth', diet: 'herb', keywords: ['symbiont'], mods: { foodPerTurn: 1, forageBonus: -1 }, rarity: 2, desc: 'Captured algae make food from sunlight. Herbivore.' },
  { id: 'venom_stylet', name: 'Venom Stylet', stage: 'cell', slot: 'mouth', diet: 'carn', keywords: ['venom'], mods: { str: 1 }, pack: 'venom', rarity: 2, desc: 'A needle that dissolves prey from inside. Carnivore.' },
  { id: 'lure_mouth', name: 'Lantern Mouth', stage: 'cell', slot: 'mouth', diet: 'carn', keywords: ['glow'], mods: { huntBonus: 2 }, pack: 'deep', rarity: 2, desc: 'A glowing gullet that draws prey in. Carnivore.' },

  // Motion
  { id: 'flagellum', name: 'Flagellum', stage: 'cell', slot: 'motion', keywords: ['swift'], mods: { spd: 2 }, rarity: 3, desc: 'A whipping tail.' },
  { id: 'cilia', name: 'Cilia', stage: 'cell', slot: 'motion', mods: { spd: 1, cun: 1 }, rarity: 3, desc: 'Thousands of tiny oars.' },
  { id: 'jet_vacuole', name: 'Jet Vacuole', stage: 'cell', slot: 'motion', keywords: ['swift'], mods: { spd: 3, tou: -1 }, rarity: 2, desc: 'Squirts water for bursts of speed.' },
  { id: 'drift_sail', name: 'Drift Sail', stage: 'cell', slot: 'motion', keywords: ['symbiont'], mods: { spd: -1, forageBonus: 1, foodPerTurn: 1 }, rarity: 2, desc: 'Rides currents and catches drifting food.' },
  { id: 'lumen_flagellum', name: 'Lumen Flagellum', stage: 'cell', slot: 'motion', keywords: ['swift', 'glow'], mods: { spd: 1, cha: 1 }, pack: 'deep', rarity: 2, desc: 'A tail that leaves a trail of light.' },

  // Defense
  { id: 'spikes', name: 'Spikes', stage: 'cell', slot: 'defense', keywords: ['armor'], mods: { str: 1, tou: 1 }, rarity: 3, desc: 'Sharp silica points.' },
  { id: 'silica_shell', name: 'Silica Shell', stage: 'cell', slot: 'defense', keywords: ['armor'], mods: { tou: 2, spd: -1 }, rarity: 3, desc: 'A glassy outer case.' },
  { id: 'toxin_sac', name: 'Toxin Sac', stage: 'cell', slot: 'defense', keywords: ['venom'], mods: { tou: 1 }, rarity: 2, desc: 'Anything that eats you regrets it.' },
  { id: 'slime_coat', name: 'Slime Coat', stage: 'cell', slot: 'defense', keywords: ['symbiont'], mods: { tou: 1, cha: 1 }, rarity: 3, desc: 'Sticky mucus that friendly bacteria live in.' },
  { id: 'photophores', name: 'Photophores', stage: 'cell', slot: 'defense', keywords: ['glow'], mods: { cha: 2 }, pack: 'deep', rarity: 2, desc: 'Flashing lights that startle predators.' },
  { id: 'plated_wall', name: 'Plated Wall', stage: 'cell', slot: 'defense', keywords: ['armor'], mods: { tou: 3, spd: -1 }, pack: 'armored', rarity: 2, desc: 'Overlapping protein plates.' },

  // Sense
  { id: 'eyespot', name: 'Eyespot', stage: 'cell', slot: 'sense', mods: { cun: 1 }, rarity: 3, desc: 'Tells light from dark.' },
  { id: 'chemoreceptor', name: 'Chemoreceptors', stage: 'cell', slot: 'sense', mods: { cun: 1, huntBonus: 1 }, rarity: 3, desc: 'Tastes prey in the water.' },
  { id: 'symbiotic_algae', name: 'Symbiotic Algae', stage: 'cell', slot: 'sense', keywords: ['symbiont'], mods: { foodPerTurn: 1 }, rarity: 2, desc: 'Passengers that pay their way in sugar.' },
  { id: 'glow_lure', name: 'Glow Lure', stage: 'cell', slot: 'sense', keywords: ['glow'], mods: { cha: 1, huntBonus: 1 }, pack: 'deep', rarity: 2, desc: 'A dangling light on a stalk.' },
  { id: 'stinging_cilia', name: 'Stinging Cilia', stage: 'cell', slot: 'sense', keywords: ['venom'], mods: { str: 1 }, pack: 'venom', rarity: 2, desc: 'Feelers that sting on contact.' },
  { id: 'plated_eye', name: 'Armored Eye', stage: 'cell', slot: 'sense', keywords: ['armor'], mods: { cun: 1, tou: 1 }, pack: 'armored', rarity: 2, desc: 'An eyespot behind a clear plate.' },

  // ---------- Creature stage ----------
  // Mouths
  { id: 'grinding_beak', name: 'Grinding Beak', stage: 'creature', slot: 'mouth', diet: 'herb', mods: { forageBonus: 2 }, rarity: 3, desc: 'Crushes seeds and tough leaves. Herbivore.' },
  { id: 'fangs', name: 'Fangs', stage: 'creature', slot: 'mouth', diet: 'carn', mods: { str: 2 }, rarity: 3, desc: 'Built for tearing. Carnivore.' },
  { id: 'mandibles', name: 'Mandibles', stage: 'creature', slot: 'mouth', diet: 'omni', mods: { str: 1, cun: 1 }, rarity: 3, desc: 'Pincers that handle anything. Omnivore.' },
  { id: 'trunk', name: 'Trunk', stage: 'creature', slot: 'mouth', diet: 'omni', mods: { cun: 1, cha: 1 }, rarity: 2, desc: 'A flexible nose that grabs food. Omnivore.' },
  { id: 'venom_fangs', name: 'Venom Fangs', stage: 'creature', slot: 'mouth', diet: 'carn', keywords: ['venom'], mods: { str: 2 }, pack: 'venom', rarity: 2, desc: 'One bite is enough. Carnivore.' },
  { id: 'lure_jaw', name: 'Angler Jaw', stage: 'creature', slot: 'mouth', diet: 'carn', keywords: ['glow'], mods: { huntBonus: 2 }, pack: 'deep', rarity: 2, desc: 'A glowing lure above a waiting mouth. Carnivore.' },

  // Limbs
  { id: 'runner_legs', name: 'Runner Legs', stage: 'creature', slot: 'limbs', keywords: ['swift'], mods: { spd: 2 }, rarity: 3, desc: 'Long and springy.' },
  { id: 'digging_claws', name: 'Digging Claws', stage: 'creature', slot: 'limbs', mods: { str: 1, forageBonus: 1 }, rarity: 3, desc: 'Good for roots, burrows and fights.' },
  { id: 'tentacles', name: 'Tentacles', stage: 'creature', slot: 'limbs', mods: { str: 1, cun: 1 }, rarity: 2, desc: 'Grasping limbs that can hold things.' },
  { id: 'gliding_membranes', name: 'Gliding Membranes', stage: 'creature', slot: 'limbs', keywords: ['swift'], mods: { spd: 2, cun: 1 }, rarity: 1, desc: 'Skin flaps for leaping between trees.' },
  { id: 'pillar_legs', name: 'Pillar Legs', stage: 'creature', slot: 'limbs', keywords: ['armor'], mods: { tou: 2, spd: -1 }, rarity: 3, desc: 'Slow, sturdy and hard to knock over.' },
  { id: 'hooked_talons', name: 'Hooked Talons', stage: 'creature', slot: 'limbs', mods: { str: 2 }, rarity: 2, desc: 'Grip prey and never let go.' },

  // Back
  { id: 'back_spines', name: 'Back Spines', stage: 'creature', slot: 'back', keywords: ['armor'], mods: { str: 1, tou: 1 }, rarity: 3, desc: 'A row of bony spikes.' },
  { id: 'display_frill', name: 'Display Frill', stage: 'creature', slot: 'back', mods: { cha: 2 }, rarity: 3, desc: 'A colorful fan for showing off.' },
  { id: 'moss_garden', name: 'Moss Garden', stage: 'creature', slot: 'back', keywords: ['symbiont'], mods: { foodPerTurn: 1 }, rarity: 2, desc: 'A living snack bar you carry around.' },
  { id: 'fat_hump', name: 'Fat Hump', stage: 'creature', slot: 'back', mods: { maxHealth: 2, spd: -1 }, rarity: 2, desc: 'Stores energy for hard times.' },
  { id: 'carapace', name: 'Carapace', stage: 'creature', slot: 'back', keywords: ['armor'], mods: { tou: 3, spd: -1 }, pack: 'armored', rarity: 2, desc: 'A domed shell.' },
  { id: 'venom_quills', name: 'Venom Quills', stage: 'creature', slot: 'back', keywords: ['venom'], mods: { str: 1, tou: 1 }, pack: 'venom', rarity: 2, desc: 'Barbed and poisoned.' },
  { id: 'lumen_sail', name: 'Lumen Sail', stage: 'creature', slot: 'back', keywords: ['glow'], mods: { cha: 2 }, pack: 'deep', rarity: 2, desc: 'A sail that glows in pulses.' },

  // Senses
  { id: 'big_eyes', name: 'Big Eyes', stage: 'creature', slot: 'senses', mods: { cun: 2 }, rarity: 3, desc: 'Sharp sight, even at dusk.' },
  { id: 'antennae', name: 'Antennae', stage: 'creature', slot: 'senses', mods: { cun: 1, huntBonus: 1 }, rarity: 3, desc: 'Smell and feel the air.' },
  { id: 'great_ears', name: 'Great Ears', stage: 'creature', slot: 'senses', mods: { cun: 1, spd: 1 }, rarity: 3, desc: 'Hear danger long before it arrives.' },
  { id: 'tremor_whiskers', name: 'Tremor Whiskers', stage: 'creature', slot: 'senses', mods: { cun: 2 }, rarity: 2, desc: 'Feel footsteps through the ground.' },
  { id: 'glow_eyes', name: 'Glow Eyes', stage: 'creature', slot: 'senses', keywords: ['glow'], mods: { cun: 1, cha: 1 }, pack: 'deep', rarity: 2, desc: 'Eyes that shine back in the dark.' },
  { id: 'horned_brow', name: 'Horned Brow', stage: 'creature', slot: 'senses', keywords: ['armor'], mods: { cun: 1, tou: 1 }, pack: 'armored', rarity: 2, desc: 'Eyes set deep under a bony ridge.' },

  // Skin
  { id: 'fur', name: 'Thick Fur', stage: 'creature', slot: 'skin', mods: { tou: 1, maxHealth: 1 }, rarity: 3, desc: 'Warm and shaggy.' },
  { id: 'scales', name: 'Scales', stage: 'creature', slot: 'skin', keywords: ['armor'], mods: { tou: 2 }, rarity: 3, desc: 'Overlapping armor.' },
  { id: 'lichen_hide', name: 'Lichen Hide', stage: 'creature', slot: 'skin', keywords: ['symbiont'], mods: { tou: 1, cha: 1 }, rarity: 2, desc: 'Lichen grows on you and keeps you healthy.' },
  { id: 'bright_plumage', name: 'Bright Plumage', stage: 'creature', slot: 'skin', mods: { cha: 2 }, rarity: 3, desc: 'Feathers in every color.' },
  { id: 'warning_skin', name: 'Warning Skin', stage: 'creature', slot: 'skin', keywords: ['venom'], mods: { tou: 1 }, rarity: 2, desc: 'Bright spots that say "do not eat".' },
  { id: 'biolume_skin', name: 'Biolume Skin', stage: 'creature', slot: 'skin', keywords: ['glow'], mods: { cha: 2 }, pack: 'deep', rarity: 2, desc: 'Patterns of living light.' },
  { id: 'swift_scales', name: 'Streamlined Scales', stage: 'creature', slot: 'skin', keywords: ['swift'], mods: { spd: 1, tou: 1 }, rarity: 2, desc: 'Smooth and fast.' },
];

G.PART = {};
G.PARTS.forEach((p) => { G.PART[p.id] = p; });
