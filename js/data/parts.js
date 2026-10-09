// Body parts. Each part fills one slot and is offered in mutation drafts.
//
// Fields:
//   id, name, desc
//   adj       adjective used when this part is merged into another ("Venomous Fangs")
//   stage     'cell' | 'creature'
//   slot      which slot it fills (see G.SLOTS)
//   habitat   creature parts only: 'land' or 'sea'; leave out for parts that work in both
//   diet      mouths only: 'herb' (herbivore), 'carn' (carnivore), 'omni'
//   keywords  synergy tags, see world.js
//   tags      special abilities, e.g. 'grasp' (can hold tools)
//   mods      stat changes, see README.md
//   pack      'base' parts are always in the draft pool; others need an unlock
//   rarity    1 = rare, 2 = uncommon, 3 = common (higher shows up more)
window.G = window.G || {};

// Body plans. Slots marked `multi` only open once the cell becomes multicellular.
G.SLOTS = {
  cell: [
    { id: 'mouth', name: 'Mouth' },
    { id: 'motion', name: 'Motion' },
    { id: 'membrane', name: 'Membrane' },
    { id: 'senses', name: 'Senses', multi: true },
    { id: 'organ', name: 'Organ', multi: true },
  ],
  land: [
    { id: 'mouth', name: 'Mouth' },
    { id: 'senses', name: 'Senses' },
    { id: 'frontLimbs', name: 'Front limbs' },
    { id: 'hands', name: 'Hands' },
    { id: 'hindLimbs', name: 'Hind limbs' },
    { id: 'feet', name: 'Feet' },
    { id: 'back', name: 'Back' },
    { id: 'skin', name: 'Skin' },
    { id: 'tail', name: 'Tail' },
  ],
  sea: [
    { id: 'mouth', name: 'Mouth' },
    { id: 'senses', name: 'Senses' },
    { id: 'frontLimbs', name: 'Front fins' },
    { id: 'hands', name: 'Arms' },
    { id: 'hindLimbs', name: 'Rear fins' },
    { id: 'feet', name: 'Underside' },
    { id: 'back', name: 'Dorsal' },
    { id: 'skin', name: 'Skin' },
    { id: 'tail', name: 'Tail' },
  ],
};

G.PARTS = [
  // ================= CELL =================
  // Mouth
  { id: 'filter_mouth', name: 'Filter Mouth', adj: 'Filtering', stage: 'cell', slot: 'mouth', diet: 'herb', mods: { forageBonus: 1 }, rarity: 3, desc: 'Strains drifting algae. Herbivore.' },
  { id: 'tiny_jaw', name: 'Tiny Jaw', adj: 'Snapping', stage: 'cell', slot: 'mouth', diet: 'carn', mods: { str: 1, huntBonus: 1 }, rarity: 3, desc: 'Snaps up smaller cells. Carnivore.' },
  { id: 'proboscis', name: 'Proboscis', adj: 'Probing', stage: 'cell', slot: 'mouth', diet: 'omni', mods: { cun: 1 }, rarity: 3, desc: 'Probes for anything edible. Omnivore.' },
  { id: 'engulfing_maw', name: 'Engulfing Maw', adj: 'Engulfing', stage: 'cell', slot: 'mouth', diet: 'carn', mods: { str: 2 }, rarity: 2, desc: 'Swallows prey whole. Carnivore.' },
  { id: 'chloroplasts', name: 'Chloroplasts', adj: 'Photosynthetic', stage: 'cell', slot: 'mouth', diet: 'herb', keywords: ['symbiont'], mods: { foodPerTurn: 1 }, rarity: 2, desc: 'Captured algae make food from sunlight. Herbivore.' },
  { id: 'venom_stylet', name: 'Venom Stylet', adj: 'Venomous', stage: 'cell', slot: 'mouth', diet: 'carn', keywords: ['venom'], mods: { str: 1 }, pack: 'venom', rarity: 2, desc: 'A needle that dissolves prey from inside. Carnivore.' },
  { id: 'lure_mouth', name: 'Lantern Mouth', adj: 'Lantern', stage: 'cell', slot: 'mouth', diet: 'carn', keywords: ['glow'], mods: { huntBonus: 2 }, pack: 'deep', rarity: 2, desc: 'A glowing gullet that draws prey in. Carnivore.' },

  // Motion
  { id: 'flagellum', name: 'Flagellum', adj: 'Whipping', stage: 'cell', slot: 'motion', keywords: ['swift'], mods: { spd: 2 }, rarity: 3, desc: 'A whipping tail.' },
  { id: 'cilia', name: 'Cilia', adj: 'Ciliated', stage: 'cell', slot: 'motion', mods: { spd: 1, cun: 1 }, rarity: 3, desc: 'Thousands of tiny oars.' },
  { id: 'jet_vacuole', name: 'Jet Vacuole', adj: 'Jetting', stage: 'cell', slot: 'motion', keywords: ['swift'], mods: { spd: 3, tou: -1 }, rarity: 2, desc: 'Squirts water for bursts of speed.' },
  { id: 'drift_sail', name: 'Drift Sail', adj: 'Drifting', stage: 'cell', slot: 'motion', keywords: ['symbiont'], mods: { spd: -1, forageBonus: 1, foodPerTurn: 1 }, rarity: 2, desc: 'Rides currents and catches drifting food.' },
  { id: 'pseudopods', name: 'Pseudopods', adj: 'Crawling', stage: 'cell', slot: 'motion', mods: { str: 1, tou: 1 }, rarity: 3, desc: 'Creeps along the seafloor on soft feet.' },
  { id: 'lumen_flagellum', name: 'Lumen Flagellum', adj: 'Shimmering', stage: 'cell', slot: 'motion', keywords: ['swift', 'glow'], mods: { spd: 1, cha: 1 }, pack: 'deep', rarity: 2, desc: 'A tail that leaves a trail of light.' },

  // Membrane
  { id: 'spikes', name: 'Spikes', adj: 'Spiked', stage: 'cell', slot: 'membrane', keywords: ['armor'], mods: { str: 1, tou: 1 }, rarity: 3, desc: 'Sharp silica points.' },
  { id: 'silica_shell', name: 'Silica Shell', adj: 'Shelled', stage: 'cell', slot: 'membrane', keywords: ['armor'], mods: { tou: 2, spd: -1 }, rarity: 3, desc: 'A glassy outer case.' },
  { id: 'toxin_sac', name: 'Toxin Sac', adj: 'Toxic', stage: 'cell', slot: 'membrane', keywords: ['venom'], mods: { tou: 1 }, rarity: 2, desc: 'Anything that eats you regrets it.' },
  { id: 'slime_coat', name: 'Slime Coat', adj: 'Slimy', stage: 'cell', slot: 'membrane', keywords: ['symbiont'], mods: { tou: 1, cha: 1 }, rarity: 3, desc: 'Sticky mucus that friendly bacteria live in.' },
  { id: 'photophores', name: 'Photophores', adj: 'Flashing', stage: 'cell', slot: 'membrane', keywords: ['glow'], mods: { cha: 2 }, pack: 'deep', rarity: 2, desc: 'Flashing lights that startle predators.' },
  { id: 'plated_wall', name: 'Plated Wall', adj: 'Plated', stage: 'cell', slot: 'membrane', keywords: ['armor'], mods: { tou: 3, spd: -1 }, pack: 'armored', rarity: 2, desc: 'Overlapping protein plates.' },

  // Senses (multicellular)
  { id: 'eyespot', name: 'Eyespot', adj: 'Sighted', stage: 'cell', slot: 'senses', mods: { cun: 1 }, rarity: 3, desc: 'Tells light from dark.' },
  { id: 'chemoreceptor', name: 'Chemoreceptors', adj: 'Tasting', stage: 'cell', slot: 'senses', mods: { cun: 1, huntBonus: 1 }, rarity: 3, desc: 'Tastes prey in the water.' },
  { id: 'magnetosome', name: 'Magnetosome', adj: 'Magnetic', stage: 'cell', slot: 'senses', mods: { cun: 1, exploreBonus: 1 }, rarity: 2, desc: 'Feels the pull of the planet and never gets lost.' },
  { id: 'glow_lure', name: 'Glow Lure', adj: 'Luring', stage: 'cell', slot: 'senses', keywords: ['glow'], mods: { cha: 1, huntBonus: 1 }, pack: 'deep', rarity: 2, desc: 'A dangling light on a stalk.' },
  { id: 'stinging_cilia', name: 'Stinging Cilia', adj: 'Stinging', stage: 'cell', slot: 'senses', keywords: ['venom'], mods: { str: 1 }, pack: 'venom', rarity: 2, desc: 'Feelers that sting on contact.' },
  { id: 'plated_eye', name: 'Armored Eye', adj: 'Armored', stage: 'cell', slot: 'senses', keywords: ['armor'], mods: { cun: 1, tou: 1 }, pack: 'armored', rarity: 2, desc: 'An eyespot behind a clear plate.' },

  // Organ (multicellular)
  { id: 'fat_vacuole', name: 'Fat Vacuole', adj: 'Plump', stage: 'cell', slot: 'organ', mods: { maxPop: 2 }, rarity: 3, desc: 'Stores energy so more of you survive.' },
  { id: 'algae_chamber', name: 'Algae Chamber', adj: 'Verdant', stage: 'cell', slot: 'organ', keywords: ['symbiont'], mods: { foodPerTurn: 1 }, rarity: 2, desc: 'A pocket of farmed algae.' },
  { id: 'stomach_chamber', name: 'Stomach Chamber', adj: 'Gluttonous', stage: 'cell', slot: 'organ', mods: { foodCap: 4, forageBonus: 1 }, rarity: 3, desc: 'Holds a big meal for later.' },
  { id: 'neuron_cluster', name: 'Neuron Cluster', adj: 'Clever', stage: 'cell', slot: 'organ', mods: { cun: 2 }, rarity: 2, desc: 'The first tangle of nerves. Something like thought.' },
  { id: 'toxin_gland', name: 'Toxin Gland', adj: 'Poisonous', stage: 'cell', slot: 'organ', keywords: ['venom'], mods: { str: 1, tou: 1 }, rarity: 2, desc: 'Brews poison for spines and stings.' },
  { id: 'photocyte_cluster', name: 'Photocyte Cluster', adj: 'Luminous', stage: 'cell', slot: 'organ', keywords: ['glow'], mods: { cha: 2 }, pack: 'deep', rarity: 2, desc: 'Cells that glow on command.' },
  { id: 'calcium_core', name: 'Calcium Core', adj: 'Dense', stage: 'cell', slot: 'organ', keywords: ['armor'], mods: { tou: 2, maxPop: 1, spd: -1 }, pack: 'armored', rarity: 2, desc: 'A hard skeleton at your center.' },

  // ================= CREATURE =================
  // Mouth
  { id: 'grinding_beak', name: 'Grinding Beak', adj: 'Beaked', stage: 'creature', slot: 'mouth', diet: 'herb', mods: { forageBonus: 2 }, rarity: 3, desc: 'Crushes seeds and tough plants. Herbivore.' },
  { id: 'fangs', name: 'Fangs', adj: 'Fanged', stage: 'creature', slot: 'mouth', diet: 'carn', mods: { str: 2 }, rarity: 3, desc: 'Built for tearing. Carnivore.' },
  { id: 'mandibles', name: 'Mandibles', adj: 'Pincered', stage: 'creature', slot: 'mouth', diet: 'omni', mods: { str: 1, cun: 1 }, rarity: 3, desc: 'Pincers that handle anything. Omnivore.' },
  { id: 'crushing_jaws', name: 'Crushing Jaws', adj: 'Crushing', stage: 'creature', slot: 'mouth', diet: 'carn', mods: { str: 1, tou: 1 }, rarity: 2, desc: 'Cracks shells and bones. Carnivore.' },
  { id: 'trunk', name: 'Trunk', adj: 'Trunked', stage: 'creature', slot: 'mouth', habitat: 'land', diet: 'omni', tags: ['grasp'], mods: { cun: 1, cha: 1 }, rarity: 2, desc: 'A flexible nose that can grab things. Omnivore.' },
  { id: 'baleen', name: 'Baleen', adj: 'Sieving', stage: 'creature', slot: 'mouth', habitat: 'sea', diet: 'herb', mods: { forageBonus: 2, maxPop: 1 }, rarity: 3, desc: 'Sieves clouds of tiny life from the water. Herbivore.' },
  { id: 'venom_fangs', name: 'Venom Fangs', adj: 'Venomous', stage: 'creature', slot: 'mouth', diet: 'carn', keywords: ['venom'], mods: { str: 2 }, pack: 'venom', rarity: 2, desc: 'One bite is enough. Carnivore.' },
  { id: 'lure_jaw', name: 'Angler Jaw', adj: 'Angler', stage: 'creature', slot: 'mouth', diet: 'carn', keywords: ['glow'], mods: { huntBonus: 2 }, pack: 'deep', rarity: 2, desc: 'A glowing lure above a waiting mouth. Carnivore.' },

  // Senses
  { id: 'big_eyes', name: 'Big Eyes', adj: 'Wide-eyed', stage: 'creature', slot: 'senses', mods: { cun: 2 }, rarity: 3, desc: 'Sharp sight, even at dusk.' },
  { id: 'antennae', name: 'Antennae', adj: 'Feeling', stage: 'creature', slot: 'senses', mods: { cun: 1, huntBonus: 1 }, rarity: 3, desc: 'Smell and feel the surroundings.' },
  { id: 'great_ears', name: 'Great Ears', adj: 'Listening', stage: 'creature', slot: 'senses', habitat: 'land', mods: { cun: 1, spd: 1 }, rarity: 3, desc: 'Hear danger long before it arrives.' },
  { id: 'tremor_whiskers', name: 'Tremor Whiskers', adj: 'Whiskered', stage: 'creature', slot: 'senses', mods: { cun: 2 }, rarity: 2, desc: 'Feel the smallest vibrations.' },
  { id: 'electroreceptors', name: 'Electroreceptors', adj: 'Electric', stage: 'creature', slot: 'senses', habitat: 'sea', mods: { cun: 1, huntBonus: 1 }, rarity: 3, desc: 'Sense the heartbeat of hidden prey.' },
  { id: 'echolocation', name: 'Echolocation', adj: 'Echoing', stage: 'creature', slot: 'senses', habitat: 'sea', mods: { cun: 2, cha: 1 }, rarity: 1, desc: 'See with sound. Also good for talking.' },
  { id: 'glow_eyes', name: 'Glow Eyes', adj: 'Glowing', stage: 'creature', slot: 'senses', keywords: ['glow'], mods: { cun: 1, cha: 1 }, pack: 'deep', rarity: 2, desc: 'Eyes that shine back in the dark.' },
  { id: 'horned_brow', name: 'Horned Brow', adj: 'Horned', stage: 'creature', slot: 'senses', keywords: ['armor'], mods: { cun: 1, tou: 1 }, pack: 'armored', rarity: 2, desc: 'Eyes set deep under a bony ridge.' },

  // Basic limbs. Every creature starts with these; merging them with limb mutations
  // grows the advanced limbs below (which are locked until you first create them).
  { id: 'stubby_forelegs', name: 'Stubby Forelegs', adj: 'Stubby', stage: 'creature', slot: 'frontLimbs', habitat: 'land', mods: { spd: 1 }, rarity: 3, desc: 'Short, simple legs. Merge them with limb mutations to grow something better.' },
  { id: 'stubby_hindlegs', name: 'Stubby Hind Legs', adj: 'Stubby', stage: 'creature', slot: 'hindLimbs', habitat: 'land', mods: { spd: 1 }, rarity: 3, desc: 'Short, simple legs. Merge them with limb mutations to grow something better.' },
  { id: 'stubby_front_fins', name: 'Stubby Fins', adj: 'Stubby', stage: 'creature', slot: 'frontLimbs', habitat: 'sea', mods: { spd: 1 }, rarity: 3, desc: 'Simple fins. Merge them with fin mutations to grow something better.' },
  { id: 'stubby_rear_fins', name: 'Stubby Rear Fins', adj: 'Stubby', stage: 'creature', slot: 'hindLimbs', habitat: 'sea', mods: { spd: 1 }, rarity: 3, desc: 'Simple rear fins. Merge them with fin mutations to grow something better.' },
  // Limb mutations: small on their own, but they reshape basic limbs when merged.
  { id: 'long_bones_f', name: 'Long Bones', adj: 'Long', stage: 'creature', slot: 'frontLimbs', habitat: 'land', limbMod: 'long', mods: { spd: 1 }, rarity: 3, desc: 'Longer limb bones. Merge with Stubby Forelegs.' },
  { id: 'thick_muscle_f', name: 'Thick Muscle', adj: 'Muscled', stage: 'creature', slot: 'frontLimbs', habitat: 'land', limbMod: 'muscle', mods: { str: 1 }, rarity: 3, desc: 'Bulging muscle. Merge with Stubby Forelegs.' },
  { id: 'gripping_pads_f', name: 'Gripping Pads', adj: 'Gripping', stage: 'creature', slot: 'frontLimbs', habitat: 'land', limbMod: 'grip', mods: { cun: 1 }, rarity: 3, desc: 'Grippy skin on the inside of the limb. Merge with Stubby Forelegs.' },
  { id: 'bony_plates_f', name: 'Bony Plates', adj: 'Plated', stage: 'creature', slot: 'frontLimbs', habitat: 'land', limbMod: 'plates', mods: { tou: 1 }, rarity: 3, desc: 'Armor along the limb. Merge with Stubby Forelegs.' },
  { id: 'skin_flaps_f', name: 'Skin Flaps', adj: 'Flapped', stage: 'creature', slot: 'frontLimbs', habitat: 'land', limbMod: 'flaps', mods: { spd: 1 }, rarity: 2, desc: 'Loose skin between limb and body. Merge with Stubby Forelegs.' },
  { id: 'boneless_f', name: 'Soft Bones', adj: 'Boneless', stage: 'creature', slot: 'frontLimbs', limbMod: 'soft', mods: { cun: 1 }, rarity: 2, desc: 'Bones that bend like rope. Merge with basic front limbs.' },
  { id: 'flight_feathers', name: 'Flight Feathers', adj: 'Feathered', stage: 'creature', slot: 'frontLimbs', habitat: 'land', limbMod: 'feathers', mods: { spd: 1, cha: 1 }, rarity: 2, desc: 'Long, stiff feathers. Merge with Wing Membranes to fly.' },
  { id: 'long_bones_h', name: 'Long Bones', adj: 'Long', stage: 'creature', slot: 'hindLimbs', habitat: 'land', limbMod: 'long', mods: { spd: 1 }, rarity: 3, desc: 'Longer limb bones. Merge with Stubby Hind Legs.' },
  { id: 'thick_muscle_h', name: 'Thick Muscle', adj: 'Muscled', stage: 'creature', slot: 'hindLimbs', habitat: 'land', limbMod: 'muscle', mods: { str: 1 }, rarity: 3, desc: 'Bulging muscle. Merge with Stubby Hind Legs.' },
  { id: 'bony_plates_h', name: 'Bony Plates', adj: 'Plated', stage: 'creature', slot: 'hindLimbs', habitat: 'land', limbMod: 'plates', mods: { tou: 1 }, rarity: 3, desc: 'Armor along the limb. Merge with Stubby Hind Legs.' },
  { id: 'springy_tendons_h', name: 'Springy Tendons', adj: 'Springy', stage: 'creature', slot: 'hindLimbs', habitat: 'land', limbMod: 'spring', mods: { spd: 1 }, rarity: 2, desc: 'Tendons like catapults. Merge with Stubby Hind Legs.' },
  { id: 'balance_h', name: 'Balance Organ', adj: 'Balanced', stage: 'creature', slot: 'hindLimbs', habitat: 'land', limbMod: 'balance', mods: { cun: 1 }, rarity: 2, desc: 'A keen sense of balance. Merge with Stubby Hind Legs to stand upright.' },
  { id: 'long_rays_sf', name: 'Long Fin Rays', adj: 'Long-rayed', stage: 'creature', slot: 'frontLimbs', habitat: 'sea', limbMod: 'long', mods: { spd: 1 }, rarity: 3, desc: 'Longer fin spines. Merge with Stubby Fins.' },
  { id: 'thick_muscle_sf', name: 'Thick Muscle', adj: 'Muscled', stage: 'creature', slot: 'frontLimbs', habitat: 'sea', limbMod: 'muscle', mods: { str: 1 }, rarity: 3, desc: 'Bulging muscle. Merge with Stubby Fins.' },
  { id: 'bony_plates_sf', name: 'Bony Plates', adj: 'Plated', stage: 'creature', slot: 'frontLimbs', habitat: 'sea', limbMod: 'plates', mods: { tou: 1 }, rarity: 3, desc: 'Armor along the fin. Merge with Stubby Fins.' },
  { id: 'long_rays_sh', name: 'Long Fin Rays', adj: 'Long-rayed', stage: 'creature', slot: 'hindLimbs', habitat: 'sea', limbMod: 'long', mods: { spd: 1 }, rarity: 3, desc: 'Longer fin spines. Merge with Stubby Rear Fins.' },
  { id: 'thick_muscle_sh', name: 'Thick Muscle', adj: 'Muscled', stage: 'creature', slot: 'hindLimbs', habitat: 'sea', limbMod: 'muscle', mods: { str: 1 }, rarity: 3, desc: 'Bulging muscle. Merge with Stubby Rear Fins.' },
  { id: 'boneless_sh', name: 'Soft Bones', adj: 'Boneless', stage: 'creature', slot: 'hindLimbs', habitat: 'sea', limbMod: 'soft', mods: { cun: 1 }, rarity: 2, desc: 'Bones that bend like rope. Merge with Stubby Rear Fins.' },

  // Front limbs
  { id: 'slender_forelegs', name: 'Slender Forelegs', adj: 'Slender', stage: 'creature', slot: 'frontLimbs', habitat: 'land', keywords: ['swift'], mods: { spd: 2 }, rarity: 3, desc: 'Long and light.' },
  { id: 'digging_forelegs', name: 'Digging Forelegs', adj: 'Burrowing', stage: 'creature', slot: 'frontLimbs', habitat: 'land', mods: { str: 1, forageBonus: 1 }, rarity: 3, desc: 'Short, strong and good at moving earth.' },
  { id: 'grasping_arms', name: 'Grasping Arms', adj: 'Grasping', stage: 'creature', slot: 'frontLimbs', habitat: 'land', tags: ['grasp'], mods: { str: 1, cun: 1 }, rarity: 2, desc: 'Arms that can reach and hold.' },
  { id: 'pillar_forelegs', name: 'Pillar Forelegs', adj: 'Pillared', stage: 'creature', slot: 'frontLimbs', habitat: 'land', keywords: ['armor'], mods: { tou: 2, spd: -1 }, rarity: 3, desc: 'Thick columns that carry great weight.' },
  { id: 'wing_membranes', name: 'Wing Membranes', adj: 'Winged', stage: 'creature', slot: 'frontLimbs', habitat: 'land', keywords: ['swift'], mods: { spd: 2, cun: 1 }, rarity: 1, desc: 'Skin stretched between long fingers. Glides between trees.' },
  { id: 'fore_tentacles', name: 'Fore-tentacles', adj: 'Tentacled', stage: 'creature', slot: 'frontLimbs', tags: ['grasp'], mods: { str: 1, cun: 1 }, rarity: 2, desc: 'Boneless arms that coil around anything.' },
  { id: 'pectoral_fins', name: 'Pectoral Fins', adj: 'Finned', stage: 'creature', slot: 'frontLimbs', habitat: 'sea', keywords: ['swift'], mods: { spd: 2 }, rarity: 3, desc: 'Steer and turn in an instant.' },
  { id: 'front_flippers', name: 'Front Flippers', adj: 'Flippered', stage: 'creature', slot: 'frontLimbs', habitat: 'sea', mods: { spd: 1, tou: 1 }, rarity: 3, desc: 'Broad paddles. Can haul out onto rocks.' },
  { id: 'armored_fins', name: 'Armored Fins', adj: 'Bony', stage: 'creature', slot: 'frontLimbs', habitat: 'sea', keywords: ['armor'], mods: { tou: 2 }, pack: 'armored', rarity: 2, desc: 'Fins edged with bone.' },

  // Hands (land only)
  { id: 'sharp_claws', name: 'Sharp Claws', adj: 'Clawed', stage: 'creature', slot: 'hands', habitat: 'land', mods: { str: 1, huntBonus: 1 }, rarity: 3, desc: 'Hooked claws for gripping prey.' },
  { id: 'hooked_talons', name: 'Hooked Talons', adj: 'Taloned', stage: 'creature', slot: 'hands', habitat: 'land', mods: { str: 2 }, rarity: 2, desc: 'Grip prey and never let go.' },
  { id: 'grasping_fingers', name: 'Grasping Fingers', adj: 'Dextrous', stage: 'creature', slot: 'hands', habitat: 'land', tags: ['grasp'], mods: { cun: 1, insightPerTurn: 1 }, rarity: 2, desc: 'Fingers that can pick up, turn over and wonder.' },
  { id: 'front_hooves', name: 'Front Hooves', adj: 'Hoofed', stage: 'creature', slot: 'hands', habitat: 'land', mods: { spd: 1, tou: 1 }, rarity: 3, desc: 'Hard and fast.' },
  { id: 'soft_pads', name: 'Soft Pads', adj: 'Padded', stage: 'creature', slot: 'hands', habitat: 'land', mods: { cun: 1, spd: 1 }, rarity: 3, desc: 'Silent steps.' },
  { id: 'venom_barbs', name: 'Venom Barbs', adj: 'Barbed', stage: 'creature', slot: 'hands', habitat: 'land', keywords: ['venom'], mods: { str: 1 }, pack: 'venom', rarity: 2, desc: 'Poisoned hooks on each wrist.' },

  // Hind limbs
  { id: 'runner_legs', name: 'Runner Legs', adj: 'Running', stage: 'creature', slot: 'hindLimbs', habitat: 'land', keywords: ['swift'], mods: { spd: 2 }, rarity: 3, desc: 'Long and springy.' },
  { id: 'powerful_haunches', name: 'Powerful Haunches', adj: 'Muscled', stage: 'creature', slot: 'hindLimbs', habitat: 'land', mods: { str: 1, spd: 1 }, rarity: 3, desc: 'For pouncing and kicking.' },
  { id: 'pillar_legs', name: 'Pillar Legs', adj: 'Sturdy', stage: 'creature', slot: 'hindLimbs', habitat: 'land', keywords: ['armor'], mods: { tou: 2, spd: -1 }, rarity: 3, desc: 'Slow, sturdy and hard to knock over.' },
  { id: 'hopping_legs', name: 'Hopping Legs', adj: 'Leaping', stage: 'creature', slot: 'hindLimbs', habitat: 'land', keywords: ['swift'], mods: { spd: 2, cun: 1 }, rarity: 1, desc: 'Bound across the plains in great leaps.' },
  { id: 'upright_legs', name: 'Upright Legs', adj: 'Upright', stage: 'creature', slot: 'hindLimbs', habitat: 'land', tags: ['biped'], mods: { cun: 1, insightPerTurn: 1 }, rarity: 2, desc: 'Stand on two legs. Your front limbs are free to do other things.' },
  { id: 'pelvic_fins', name: 'Pelvic Fins', adj: 'Gliding', stage: 'creature', slot: 'hindLimbs', habitat: 'sea', keywords: ['swift'], mods: { spd: 1, cun: 1 }, rarity: 3, desc: 'Keep you steady in any current.' },
  { id: 'rear_flippers', name: 'Rear Flippers', adj: 'Paddling', stage: 'creature', slot: 'hindLimbs', habitat: 'sea', mods: { spd: 1, tou: 1 }, rarity: 3, desc: 'Powerful paddles.' },
  { id: 'sea_tentacles', name: 'Trailing Tentacles', adj: 'Trailing', stage: 'creature', slot: 'hindLimbs', habitat: 'sea', tags: ['grasp'], mods: { str: 1, cun: 1 }, rarity: 2, desc: 'Long arms that drag along the reef, feeling and holding.' },

  // Feet (land only)
  { id: 'hooves', name: 'Hooves', adj: 'Hoofed', stage: 'creature', slot: 'feet', habitat: 'land', mods: { spd: 1, tou: 1 }, rarity: 3, desc: 'Built for running on hard ground.' },
  { id: 'padded_paws', name: 'Padded Paws', adj: 'Pawed', stage: 'creature', slot: 'feet', habitat: 'land', mods: { cun: 1, spd: 1 }, rarity: 3, desc: 'Sneak up on anything.' },
  { id: 'raptor_talons', name: 'Raptor Talons', adj: 'Raptor', stage: 'creature', slot: 'feet', habitat: 'land', mods: { str: 2 }, rarity: 2, desc: 'A sickle claw on each foot.' },
  { id: 'webbed_feet', name: 'Webbed Feet', adj: 'Webbed', stage: 'creature', slot: 'feet', habitat: 'land', mods: { spd: 1, forageBonus: 1 }, rarity: 3, desc: 'At home in mud and shallow water.' },
  { id: 'heavy_feet', name: 'Heavy Feet', adj: 'Stomping', stage: 'creature', slot: 'feet', habitat: 'land', keywords: ['armor'], mods: { tou: 1, str: 1 }, rarity: 2, desc: 'The ground shakes when you walk.' },
  { id: 'venom_spurs', name: 'Venom Spurs', adj: 'Spurred', stage: 'creature', slot: 'feet', habitat: 'land', keywords: ['venom'], mods: { str: 1, tou: 1 }, pack: 'venom', rarity: 2, desc: 'A poisoned spike on each heel.' },

  // Back
  { id: 'back_spines', name: 'Back Spines', adj: 'Spined', stage: 'creature', slot: 'back', keywords: ['armor'], mods: { str: 1, tou: 1 }, rarity: 3, desc: 'A row of bony spikes.' },
  { id: 'display_frill', name: 'Display Frill', adj: 'Frilled', stage: 'creature', slot: 'back', mods: { cha: 2 }, rarity: 3, desc: 'A colorful fan for showing off.' },
  { id: 'moss_garden', name: 'Moss Garden', adj: 'Mossy', stage: 'creature', slot: 'back', habitat: 'land', keywords: ['symbiont'], mods: { foodPerTurn: 1 }, rarity: 2, desc: 'A living snack bar you carry around.' },
  { id: 'kelp_garden', name: 'Kelp Garden', adj: 'Kelped', stage: 'creature', slot: 'back', habitat: 'sea', keywords: ['symbiont'], mods: { foodPerTurn: 1 }, rarity: 2, desc: 'Kelp and little fish live on your back.' },
  { id: 'fat_hump', name: 'Fat Hump', adj: 'Humped', stage: 'creature', slot: 'back', mods: { maxPop: 2, foodCap: 3, spd: -1 }, rarity: 2, desc: 'Stores energy for hard times.' },
  { id: 'dorsal_fin', name: 'Dorsal Fin', adj: 'Sail-finned', stage: 'creature', slot: 'back', habitat: 'sea', keywords: ['swift'], mods: { spd: 1, cha: 1 }, rarity: 3, desc: 'A tall fin that cuts the water.' },
  { id: 'carapace', name: 'Carapace', adj: 'Shelled', stage: 'creature', slot: 'back', keywords: ['armor'], mods: { tou: 3, spd: -1 }, pack: 'armored', rarity: 2, desc: 'A domed shell.' },
  { id: 'venom_quills', name: 'Venom Quills', adj: 'Quilled', stage: 'creature', slot: 'back', keywords: ['venom'], mods: { str: 1, tou: 1 }, pack: 'venom', rarity: 2, desc: 'Barbed and poisoned.' },
  { id: 'lumen_sail', name: 'Lumen Sail', adj: 'Lumen', stage: 'creature', slot: 'back', keywords: ['glow'], mods: { cha: 2 }, pack: 'deep', rarity: 2, desc: 'A sail that glows in pulses.' },

  // Skin
  { id: 'fur', name: 'Thick Fur', adj: 'Furred', stage: 'creature', slot: 'skin', habitat: 'land', mods: { tou: 1, maxPop: 1 }, rarity: 3, desc: 'Warm and shaggy.' },
  { id: 'scales', name: 'Scales', adj: 'Scaled', stage: 'creature', slot: 'skin', keywords: ['armor'], mods: { tou: 2 }, rarity: 3, desc: 'Overlapping armor.' },
  { id: 'lichen_hide', name: 'Lichen Hide', adj: 'Lichened', stage: 'creature', slot: 'skin', habitat: 'land', keywords: ['symbiont'], mods: { tou: 1, cha: 1 }, rarity: 2, desc: 'Lichen grows on you and keeps you healthy.' },
  { id: 'bright_plumage', name: 'Bright Plumage', adj: 'Feathered', stage: 'creature', slot: 'skin', habitat: 'land', mods: { cha: 2 }, rarity: 3, desc: 'Feathers in every color.' },
  { id: 'blubber', name: 'Blubber', adj: 'Blubbery', stage: 'creature', slot: 'skin', habitat: 'sea', mods: { maxPop: 1, tou: 1, foodCap: 2 }, rarity: 3, desc: 'Thick fat against the cold deep.' },
  { id: 'cleaner_skin', name: 'Cleaner Skin', adj: 'Clean', stage: 'creature', slot: 'skin', habitat: 'sea', keywords: ['symbiont'], mods: { tou: 1, cha: 1 }, rarity: 2, desc: 'Little shrimp live on you and keep you clean.' },
  { id: 'warning_skin', name: 'Warning Skin', adj: 'Spotted', stage: 'creature', slot: 'skin', keywords: ['venom'], mods: { tou: 1 }, rarity: 2, desc: 'Bright spots that say "do not eat".' },
  { id: 'swift_scales', name: 'Streamlined Scales', adj: 'Streamlined', stage: 'creature', slot: 'skin', keywords: ['swift'], mods: { spd: 1, tou: 1 }, rarity: 2, desc: 'Smooth and fast.' },
  { id: 'biolume_skin', name: 'Biolume Skin', adj: 'Biolume', stage: 'creature', slot: 'skin', keywords: ['glow'], mods: { cha: 2 }, pack: 'deep', rarity: 2, desc: 'Patterns of living light.' },

  // Tail
  { id: 'club_tail', name: 'Club Tail', adj: 'Clubbed', stage: 'creature', slot: 'tail', habitat: 'land', keywords: ['armor'], mods: { str: 1, tou: 1 }, rarity: 2, desc: 'A bony club that breaks legs.' },
  { id: 'balancing_tail', name: 'Balancing Tail', adj: 'Balanced', stage: 'creature', slot: 'tail', habitat: 'land', mods: { spd: 1, cun: 1 }, rarity: 3, desc: 'Keeps you steady at speed.' },
  { id: 'prehensile_tail', name: 'Prehensile Tail', adj: 'Curling', stage: 'creature', slot: 'tail', tags: ['grasp'], mods: { cun: 1, str: 1 }, rarity: 2, desc: 'A tail that grips like a hand.' },
  { id: 'display_tail', name: 'Display Tail', adj: 'Plumed', stage: 'creature', slot: 'tail', mods: { cha: 2 }, rarity: 3, desc: 'Long, bright and impossible to ignore.' },
  { id: 'fluke', name: 'Fluke', adj: 'Fluked', stage: 'creature', slot: 'tail', habitat: 'sea', keywords: ['swift'], mods: { spd: 2 }, rarity: 3, desc: 'A powerful tail for long journeys.' },
  { id: 'stinger_tail', name: 'Stinger Tail', adj: 'Stinging', stage: 'creature', slot: 'tail', keywords: ['venom'], mods: { str: 1 }, pack: 'venom', rarity: 2, desc: 'Arches over your back, ready to strike.' },
  { id: 'glow_tail', name: 'Glow Tail', adj: 'Glimmering', stage: 'creature', slot: 'tail', keywords: ['glow'], mods: { cha: 1, spd: 1 }, pack: 'deep', rarity: 2, desc: 'A lantern at the end of you.' },

  // ================= THE DEEP (sea only) =================
  // Mouth
  { id: 'coral_beak', name: 'Parrot Beak', adj: 'Beaked', stage: 'creature', slot: 'mouth', habitat: 'sea', diet: 'herb', mods: { forageBonus: 1, str: 1 }, rarity: 3, desc: 'Fused teeth that scrape algae off coral. Herbivore.' },
  { id: 'suction_mouth', name: 'Suction Mouth', adj: 'Slurping', stage: 'creature', slot: 'mouth', habitat: 'sea', diet: 'omni', mods: { forageBonus: 1, cun: 1 }, rarity: 3, desc: 'Snaps open and sucks in whatever is near. Omnivore.' },
  { id: 'cookie_cutter', name: 'Cookie-cutter Jaw', adj: 'Biting', stage: 'creature', slot: 'mouth', habitat: 'sea', diet: 'carn', mods: { str: 1, huntBonus: 1 }, rarity: 2, desc: 'Bites a neat round plug out of animals far bigger than you. Carnivore.' },
  { id: 'hidden_beak', name: 'Hidden Beak', adj: 'Beaked', stage: 'creature', slot: 'mouth', habitat: 'sea', diet: 'carn', mods: { str: 1, cun: 1 }, rarity: 2, desc: 'A hard parrot-like beak tucked away under soft flesh. Carnivore.' },
  // Senses
  { id: 'lateral_line', name: 'Lateral Line', adj: 'Rippling', stage: 'creature', slot: 'senses', habitat: 'sea', mods: { spd: 1, cun: 1 }, rarity: 3, desc: 'Feels every ripple in the water, even in the dark.' },
  { id: 'mantis_eyes', name: 'Mantis Eyes', adj: 'Rainbow-eyed', stage: 'creature', slot: 'senses', habitat: 'sea', mods: { cun: 2, huntBonus: 1 }, rarity: 1, desc: 'Eyes on stalks that see colors no one else can.' },
  { id: 'barbels', name: 'Barbels', adj: 'Whiskered', stage: 'creature', slot: 'senses', habitat: 'sea', mods: { cun: 1, forageBonus: 1 }, rarity: 3, desc: 'Fleshy whiskers that taste the mud for food.' },
  // Front and rear fin mutations (merge with stubby fins)
  { id: 'wide_webbing_sf', name: 'Wide Webbing', adj: 'Webbed', stage: 'creature', slot: 'frontLimbs', habitat: 'sea', mods: { spd: 1 }, rarity: 2, limbMod: true, desc: 'Broad, thin fins. Merge with Stubby Fins.' },
  { id: 'lobe_bones_sf', name: 'Lobe Bones', adj: 'Lobed', stage: 'creature', slot: 'frontLimbs', habitat: 'sea', mods: { tou: 1 }, rarity: 2, limbMod: true, desc: 'Fleshy fins with real bones inside. Merge with Stubby Fins.' },
  { id: 'spiny_rays_sh', name: 'Spiny Rays', adj: 'Spiny', stage: 'creature', slot: 'hindLimbs', habitat: 'sea', mods: { tou: 1 }, rarity: 2, limbMod: true, desc: 'Fin rays sharpened into spines. Merge with Stubby Rear Fins.' },
  // Advanced fins grown from the mutations above (locked until first created)
  { id: 'gliding_fins', name: 'Gliding Fins', adj: 'Gliding', stage: 'creature', slot: 'frontLimbs', habitat: 'sea', keywords: ['swift'], mods: { spd: 3, exploreBonus: 1 }, rarity: 2, desc: 'Leap out of the water and glide over the waves, like a flying fish.' },
  { id: 'lobe_fins', name: 'Lobe Fins', adj: 'Lobe-finned', stage: 'creature', slot: 'frontLimbs', habitat: 'sea', mods: { str: 1, tou: 1, cun: 1 }, rarity: 2, desc: 'Fins with bones and muscle. They prop you up on the sea floor, and one day they could walk.' },
  { id: 'lionfish_fins', name: 'Lionfish Fins', adj: 'Lionfish', stage: 'creature', slot: 'hindLimbs', habitat: 'sea', keywords: ['venom'], mods: { str: 1, tou: 1, cha: 1 }, rarity: 2, desc: 'A fan of striped, venomous spines.' },
  // Arms (the sea's hands)
  { id: 'pincers', name: 'Pincers', adj: 'Pincered', stage: 'creature', slot: 'hands', habitat: 'sea', tags: ['grasp'], mods: { str: 1, tou: 1 }, rarity: 3, desc: 'Crab claws that grab, pinch and carry.' },
  { id: 'feeding_arms', name: 'Feeding Arms', adj: 'Reaching', stage: 'creature', slot: 'hands', habitat: 'sea', tags: ['grasp'], mods: { cun: 1, forageBonus: 1 }, rarity: 3, desc: 'Two long arms that shoot out and grab dinner.' },
  { id: 'sucker_arms', name: 'Sucker Arms', adj: 'Suckered', stage: 'creature', slot: 'hands', habitat: 'sea', tags: ['grasp'], mods: { cun: 1, str: 1 }, rarity: 2, desc: 'Soft arms lined with suckers that can open shells.' },
  { id: 'smasher_club', name: 'Smasher Club', adj: 'Smashing', stage: 'creature', slot: 'hands', habitat: 'sea', mods: { str: 2 }, rarity: 2, desc: 'A folded club that punches faster than a bullet.' },
  { id: 'feather_arms', name: 'Feather Arms', adj: 'Feathery', stage: 'creature', slot: 'hands', habitat: 'sea', mods: { forageBonus: 2 }, rarity: 3, desc: 'Feathery arms that comb food out of the current.' },
  { id: 'stinging_arms', name: 'Stinging Arms', adj: 'Stinging', stage: 'creature', slot: 'hands', habitat: 'sea', keywords: ['venom'], mods: { str: 1, huntBonus: 1 }, pack: 'venom', rarity: 2, desc: 'Arms covered in tiny harpoons of venom.' },
  // Underside
  { id: 'walking_legs', name: 'Walking Legs', adj: 'Scuttling', stage: 'creature', slot: 'feet', habitat: 'sea', mods: { spd: 1, tou: 1 }, rarity: 3, desc: 'Jointed legs for walking the sea floor.' },
  { id: 'sucker_pads', name: 'Sucker Pads', adj: 'Clinging', stage: 'creature', slot: 'feet', habitat: 'sea', mods: { tou: 2 }, rarity: 3, desc: 'Cling to rocks while storms rage above.' },
  { id: 'tube_feet', name: 'Tube Feet', adj: 'Creeping', stage: 'creature', slot: 'feet', habitat: 'sea', mods: { tou: 1, cun: 1 }, rarity: 3, desc: 'Hundreds of tiny feet, like a starfish. Slow but unstoppable.' },
  { id: 'crawling_fins', name: 'Crawling Fins', adj: 'Crawling', stage: 'creature', slot: 'feet', habitat: 'sea', mods: { spd: 1, forageBonus: 1 }, rarity: 3, desc: 'Stubby fins for shuffling along the bottom.' },
  { id: 'belly_lights', name: 'Belly Lights', adj: 'Lantern-bellied', stage: 'creature', slot: 'feet', habitat: 'sea', keywords: ['glow'], mods: { cun: 1, cha: 1 }, pack: 'deep', rarity: 2, desc: 'Glowing dots that hide your shadow from hunters below.' },
  { id: 'belly_plate', name: 'Belly Plate', adj: 'Plated', stage: 'creature', slot: 'feet', habitat: 'sea', keywords: ['armor'], mods: { tou: 2 }, pack: 'armored', rarity: 2, desc: 'A hard shield underneath.' },
  // Dorsal
  { id: 'spiral_shell', name: 'Spiral Shell', adj: 'Shelled', stage: 'creature', slot: 'back', habitat: 'sea', keywords: ['armor'], mods: { tou: 2, cun: 1, spd: -1 }, rarity: 2, desc: 'A coiled shell full of air chambers, like a nautilus.' },
  { id: 'sail_fin', name: 'Sail Fin', adj: 'Sailed', stage: 'creature', slot: 'back', habitat: 'sea', keywords: ['swift'], mods: { spd: 2 }, rarity: 3, desc: 'A tall fin that folds down for bursts of speed.' },
  { id: 'anemone_crown', name: 'Anemone Crown', adj: 'Crowned', stage: 'creature', slot: 'back', habitat: 'sea', keywords: ['symbiont'], mods: { tou: 1, cha: 1 }, rarity: 2, desc: 'Anemones ride on your back and sting anything that comes close.' },
  { id: 'angler_rod', name: 'Angler Rod', adj: 'Luring', stage: 'creature', slot: 'back', habitat: 'sea', keywords: ['glow'], mods: { huntBonus: 2 }, pack: 'deep', rarity: 2, desc: 'A glowing bait dangling over your head.' },
  // Skin
  { id: 'color_skin', name: 'Color-changing Skin', adj: 'Shifting', stage: 'creature', slot: 'skin', habitat: 'sea', mods: { cun: 2, cha: 1 }, rarity: 2, desc: 'Waves of color ripple over you. Hide, dazzle or talk.' },
  { id: 'ink_glands', name: 'Ink Glands', adj: 'Inky', stage: 'creature', slot: 'skin', habitat: 'sea', mods: { spd: 1, damageReduce: 1 }, rarity: 2, desc: 'A cloud of ink, and you are gone.' },
  { id: 'electric_organ', name: 'Electric Organ', adj: 'Electric', stage: 'creature', slot: 'skin', habitat: 'sea', mods: { str: 2, huntBonus: 1 }, rarity: 1, desc: 'Muscles that make lightning.' },
  { id: 'slime_skin', name: 'Slime Skin', adj: 'Slimy', stage: 'creature', slot: 'skin', habitat: 'sea', mods: { tou: 1, spd: 1 }, rarity: 3, desc: 'Slippery as a hagfish. Nothing can hold you.' },
  { id: 'pressure_skin', name: 'Pressure Skin', adj: 'Deep', stage: 'creature', slot: 'skin', habitat: 'sea', mods: { tou: 1, cun: 1 }, rarity: 3, desc: 'Soft, tough skin built for the crushing deep.' },
  // Tail
  { id: 'jet_siphon', name: 'Jet Siphon', adj: 'Jetting', stage: 'creature', slot: 'tail', habitat: 'sea', keywords: ['swift'], mods: { spd: 3, tou: -1 }, rarity: 2, desc: 'Squirt water and shoot backwards like a squid.' },
  { id: 'thresher_tail', name: 'Thresher Tail', adj: 'Whipping', stage: 'creature', slot: 'tail', habitat: 'sea', mods: { huntBonus: 2 }, rarity: 2, desc: 'A long whip that stuns whole schools of fish.' },
  { id: 'paddle_tail', name: 'Paddle Tail', adj: 'Paddling', stage: 'creature', slot: 'tail', habitat: 'sea', mods: { spd: 1, tou: 1 }, rarity: 3, desc: 'Flat as an oar, like a sea snake.' },
];

G.PART = {};
G.PARTS.forEach((p) => { G.PART[p.id] = p; });

// ======================= EVOLVED MUTATIONS =======================
// Merging the right two parts in one slot creates an evolved part (like Ball x Pit evolutions).
// Evolved parts never show up in drafts. They can merge again, and some tier 1 evolutions
// evolve a second time into tier 2 legendaries. Discovered recipes are kept in the Codex.
//   from   the two parts that combine (order does not matter)
//   tier   1 or 2
G.EVOLUTIONS = [
  // ----- Cell -----
  { id: 'devourer_maw', name: 'Devourer Maw', adj: 'Devouring', from: ['tiny_jaw', 'engulfing_maw'], stage: 'cell', slot: 'mouth', diet: 'carn', mods: { str: 4, huntBonus: 2 }, desc: 'A mouth that never stops. Carnivore.' },
  { id: 'sun_sieve', name: 'Sun Sieve', adj: 'Sunlit', from: ['filter_mouth', 'chloroplasts'], stage: 'cell', slot: 'mouth', diet: 'herb', keywords: ['symbiont'], mods: { foodPerTurn: 2, forageBonus: 1 }, desc: 'Strains food and makes it from light at once. Herbivore.' },
  { id: 'venom_siphon', name: 'Venom Siphon', adj: 'Siphoning', from: ['proboscis', 'venom_stylet'], stage: 'cell', slot: 'mouth', diet: 'omni', keywords: ['venom'], mods: { str: 2, cun: 2 }, desc: 'Inject, dissolve, drink. Omnivore.' },
  { id: 'abyssal_maw', name: 'Abyssal Maw', adj: 'Abyssal', from: ['tiny_jaw', 'lure_mouth'], stage: 'cell', slot: 'mouth', diet: 'carn', keywords: ['glow'], mods: { str: 2, huntBonus: 3 }, desc: 'A glowing trap with teeth. Carnivore.' },
  { id: 'twin_drive', name: 'Twin Drive', adj: 'Twin-driven', from: ['flagellum', 'cilia'], stage: 'cell', slot: 'motion', keywords: ['swift'], mods: { spd: 4, cun: 1 }, desc: 'Whip and oars working together.' },
  { id: 'torpedo_drive', name: 'Torpedo Drive', adj: 'Torpedo', from: ['flagellum', 'jet_vacuole'], stage: 'cell', slot: 'motion', keywords: ['swift'], mods: { spd: 6, tou: -1 }, desc: 'Nothing in the sea is faster.' },
  { id: 'tide_walker', name: 'Tide Walker', adj: 'Tide-walking', from: ['pseudopods', 'drift_sail'], stage: 'cell', slot: 'motion', keywords: ['symbiont'], mods: { str: 1, tou: 1, foodPerTurn: 1, forageBonus: 1 }, desc: 'Crawls the seafloor and sails the currents.' },
  { id: 'aurora_tail', name: 'Aurora Tail', adj: 'Aurora', from: ['cilia', 'lumen_flagellum'], stage: 'cell', slot: 'motion', keywords: ['swift', 'glow'], mods: { spd: 2, cha: 3 }, desc: 'A shimmering curtain of light.' },
  { id: 'venom_spines', name: 'Venom Spines', adj: 'Venom-spined', from: ['spikes', 'toxin_sac'], stage: 'cell', slot: 'membrane', keywords: ['venom', 'armor'], mods: { str: 2, tou: 2 }, desc: 'Every spike carries poison.' },
  { id: 'glass_hedgehog', name: 'Glass Hedgehog', adj: 'Glassy', from: ['spikes', 'silica_shell'], stage: 'cell', slot: 'membrane', keywords: ['armor'], mods: { str: 2, tou: 4, spd: -1 }, desc: 'A ball of glass needles.' },
  { id: 'glow_slime', name: 'Glow Slime', adj: 'Glowing', from: ['slime_coat', 'photophores'], stage: 'cell', slot: 'membrane', keywords: ['glow', 'symbiont'], mods: { tou: 1, cha: 4 }, desc: 'A coat of shining bacteria.' },
  { id: 'fortress_wall', name: 'Fortress Wall', adj: 'Fortified', from: ['silica_shell', 'plated_wall'], stage: 'cell', slot: 'membrane', keywords: ['armor'], mods: { tou: 6, spd: -2 }, desc: 'Layers on layers on layers.' },
  { id: 'compound_sense', name: 'Compound Sense', adj: 'Keen', from: ['eyespot', 'chemoreceptor'], stage: 'cell', slot: 'senses', mods: { cun: 3, huntBonus: 1 }, desc: 'See it and taste it at the same time.' },
  { id: 'lantern_eye', name: 'Lantern Eye', adj: 'Lantern-eyed', from: ['eyespot', 'glow_lure'], stage: 'cell', slot: 'senses', keywords: ['glow'], mods: { cun: 2, cha: 2, huntBonus: 1 }, desc: 'An eye that brings its own light.' },
  { id: 'tracker_sense', name: 'Tracker Sense', adj: 'Tracking', from: ['chemoreceptor', 'magnetosome'], stage: 'cell', slot: 'senses', mods: { cun: 3, exploreBonus: 2 }, desc: 'Follows any trail, anywhere.' },
  { id: 'reserve_gut', name: 'Reserve Gut', adj: 'Well-fed', from: ['fat_vacuole', 'stomach_chamber'], stage: 'cell', slot: 'organ', mods: { maxPop: 3, foodCap: 6 }, desc: 'Stores enough for the worst of times.' },
  { id: 'brain_seed', name: 'Brain Seed', adj: 'Thinking', from: ['neuron_cluster', 'fat_vacuole'], stage: 'cell', slot: 'organ', mods: { cun: 4, maxPop: 1 }, desc: 'Nerves wrapped in fat. The first brain.' },
  { id: 'sun_heart', name: 'Sun Heart', adj: 'Sun-hearted', from: ['algae_chamber', 'photocyte_cluster'], stage: 'cell', slot: 'organ', keywords: ['symbiont', 'glow'], mods: { foodPerTurn: 2, cha: 2 }, desc: 'Captured light at your core.' },
  { id: 'venom_bone', name: 'Venom Bone', adj: 'Venom-boned', from: ['toxin_gland', 'calcium_core'], stage: 'cell', slot: 'organ', keywords: ['venom', 'armor'], mods: { str: 2, tou: 3 }, desc: 'A poisoned skeleton.' },
  { id: 'urchin_armor', name: 'Urchin Armor', adj: 'Urchin', tier: 2, from: ['glass_hedgehog', 'toxin_sac'], stage: 'cell', slot: 'membrane', keywords: ['venom', 'armor'], mods: { str: 3, tou: 5, damageReduce: 1 }, desc: 'Legendary. Nothing dares to touch you.' },
  { id: 'leviathan_maw', name: 'Leviathan Maw', adj: 'Leviathan', tier: 2, from: ['devourer_maw', 'venom_stylet'], stage: 'cell', slot: 'mouth', diet: 'carn', keywords: ['venom'], mods: { str: 6, huntBonus: 3 }, desc: 'Legendary. It eats things bigger than itself. Carnivore.' },
  { id: 'hyperdrive', name: 'Hyperdrive', adj: 'Hyper', tier: 2, from: ['twin_drive', 'jet_vacuole'], stage: 'cell', slot: 'motion', keywords: ['swift'], mods: { spd: 7, cun: 1 }, desc: 'Legendary. A blur in the water.' },
  { id: 'dreaming_brain', name: 'Dreaming Brain', adj: 'Dreaming', tier: 2, from: ['brain_seed', 'photocyte_cluster'], stage: 'cell', slot: 'organ', keywords: ['glow'], mods: { cun: 5, cha: 2 }, desc: 'Legendary. It flickers with something like dreams.' },

  // ----- Creature -----
  { id: 'sabre_venom_fangs', name: 'Sabre Venom Fangs', adj: 'Sabre', from: ['fangs', 'venom_fangs'], stage: 'creature', slot: 'mouth', diet: 'carn', keywords: ['venom'], mods: { str: 5 }, desc: 'Long, hollow and full of poison. Carnivore.' },
  { id: 'bone_crusher', name: 'Bone Crusher', adj: 'Bone-crushing', from: ['fangs', 'crushing_jaws'], stage: 'creature', slot: 'mouth', diet: 'carn', mods: { str: 4, tou: 2 }, desc: 'Nothing is left behind. Carnivore.' },
  { id: 'forager_trunk', name: 'Forager Trunk', adj: 'Foraging', from: ['grinding_beak', 'trunk'], stage: 'creature', slot: 'mouth', habitat: 'land', diet: 'omni', tags: ['grasp'], mods: { forageBonus: 3, cun: 1 }, desc: 'Pulls up roots and cracks them. Omnivore.' },
  { id: 'krill_sieve', name: 'Krill Sieve', adj: 'Krill-sieving', from: ['baleen', 'grinding_beak'], stage: 'creature', slot: 'mouth', habitat: 'sea', diet: 'herb', mods: { forageBonus: 4, maxPop: 2 }, desc: 'Swallows whole clouds of life. Herbivore.' },
  { id: 'hunter_eyes', name: 'Hunter Eyes', adj: 'Hunting', from: ['big_eyes', 'antennae'], stage: 'creature', slot: 'senses', mods: { cun: 3, huntBonus: 2 }, desc: 'Nothing moves without you knowing.' },
  { id: 'sentinel_ears', name: 'Sentinel Ears', adj: 'Watchful', from: ['big_eyes', 'great_ears'], stage: 'creature', slot: 'senses', habitat: 'land', mods: { cun: 3, spd: 1, damageReduce: 1 }, desc: 'Always on guard.' },
  { id: 'sonar', name: 'Sonar', adj: 'Sonar', from: ['echolocation', 'electroreceptors'], stage: 'creature', slot: 'senses', habitat: 'sea', mods: { cun: 4, cha: 1, huntBonus: 1 }, desc: 'Sees the whole ocean in sound.' },
  { id: 'workers_arms', name: "Worker's Arms", adj: 'Working', from: ['grasping_arms', 'digging_forelegs'], stage: 'creature', slot: 'frontLimbs', habitat: 'land', tags: ['grasp'], mods: { str: 2, cun: 1, forageBonus: 2 }, desc: 'Strong, clever arms that build and dig.' },
  { id: 'true_wings', name: 'True Wings', adj: 'Flying', from: ['slender_forelegs', 'wing_membranes'], stage: 'creature', slot: 'frontLimbs', habitat: 'land', keywords: ['swift'], tags: ['flight'], mods: { spd: 5, cun: 1 }, desc: 'Not gliding any more. Flying.' },
  { id: 'feathered_wings', name: 'Feathered Wings', adj: 'Winged', from: ['wing_membranes', 'flight_feathers'], stage: 'creature', slot: 'frontLimbs', habitat: 'land', keywords: ['swift'], tags: ['flight'], mods: { spd: 4, cun: 1, exploreBonus: 1 }, desc: 'Real wings. Your kind takes to the sky.' },
  { id: 'octo_arms', name: 'Octo-arms', adj: 'Octo', from: ['fore_tentacles', 'grasping_arms'], stage: 'creature', slot: 'frontLimbs', habitat: 'land', tags: ['grasp'], mods: { str: 2, cun: 3 }, desc: 'Many arms, many uses.' },
  { id: 'wing_fins', name: 'Wing Fins', adj: 'Wing-finned', from: ['pectoral_fins', 'front_flippers'], stage: 'creature', slot: 'frontLimbs', habitat: 'sea', keywords: ['swift'], mods: { spd: 3, tou: 2 }, desc: 'You fly through the water.' },
  { id: 'clever_claws', name: 'Clever Claws', adj: 'Clever', from: ['grasping_fingers', 'sharp_claws'], stage: 'creature', slot: 'hands', habitat: 'land', tags: ['grasp'], mods: { str: 1, cun: 2, insightPerTurn: 1 }, desc: 'Claws that can also hold a stick.' },
  { id: 'reaper_claws', name: 'Reaper Claws', adj: 'Reaping', from: ['sharp_claws', 'hooked_talons'], stage: 'creature', slot: 'hands', habitat: 'land', mods: { str: 5 }, desc: 'Long, curved and terrible.' },
  { id: 'nimble_hands', name: 'Nimble Hands', adj: 'Nimble', from: ['soft_pads', 'grasping_fingers'], stage: 'creature', slot: 'hands', habitat: 'land', tags: ['grasp'], mods: { cun: 2, spd: 1, insightPerTurn: 1 }, desc: 'Quick, quiet, curious fingers.' },
  { id: 'sprinter_legs', name: 'Sprinter Legs', adj: 'Sprinting', from: ['runner_legs', 'powerful_haunches'], stage: 'creature', slot: 'hindLimbs', habitat: 'land', keywords: ['swift'], mods: { spd: 3, str: 2 }, desc: 'Explosive speed.' },
  { id: 'striding_legs', name: 'Striding Legs', adj: 'Striding', from: ['upright_legs', 'runner_legs'], stage: 'creature', slot: 'hindLimbs', habitat: 'land', keywords: ['swift'], tags: ['biped'], mods: { spd: 2, cun: 1, insightPerTurn: 1 }, desc: 'Walk tall and walk far.' },
  { id: 'titan_legs', name: 'Titan Legs', adj: 'Titanic', from: ['pillar_legs', 'powerful_haunches'], stage: 'creature', slot: 'hindLimbs', habitat: 'land', keywords: ['armor'], mods: { str: 2, tou: 4 }, desc: 'Legs like tree trunks.' },
  { id: 'twin_tail_fins', name: 'Twin Rear Fins', adj: 'Twin-finned', from: ['pelvic_fins', 'rear_flippers'], stage: 'creature', slot: 'hindLimbs', habitat: 'sea', keywords: ['swift'], mods: { spd: 3, tou: 1 }, desc: 'Steady and fast.' },
  { id: 'thunder_hooves', name: 'Thunder Hooves', adj: 'Thundering', from: ['hooves', 'heavy_feet'], stage: 'creature', slot: 'feet', habitat: 'land', keywords: ['armor'], mods: { tou: 2, str: 2, spd: 1 }, desc: 'The ground shakes for miles.' },
  { id: 'silent_killer', name: 'Silent Killer Paws', adj: 'Silent', from: ['padded_paws', 'raptor_talons'], stage: 'creature', slot: 'feet', habitat: 'land', mods: { str: 2, cun: 2, huntBonus: 1 }, desc: 'They never hear you coming.' },
  { id: 'fortress_shell', name: 'Fortress Shell', adj: 'Fortress', from: ['back_spines', 'carapace'], stage: 'creature', slot: 'back', keywords: ['armor'], mods: { tou: 6, str: 1, spd: -1 }, desc: 'A spiked dome nothing can break.' },
  { id: 'aurora_sail', name: 'Aurora Sail', adj: 'Aurora', from: ['display_frill', 'lumen_sail'], stage: 'creature', slot: 'back', keywords: ['glow'], mods: { cha: 5 }, desc: 'A sail of living color.' },
  { id: 'garden_hump', name: 'Garden Hump', adj: 'Gardened', from: ['moss_garden', 'fat_hump'], stage: 'creature', slot: 'back', habitat: 'land', keywords: ['symbiont'], mods: { foodPerTurn: 2, maxPop: 2 }, desc: 'A whole meadow on your back.' },
  { id: 'porcupine_back', name: 'Porcupine Back', adj: 'Porcupine', from: ['back_spines', 'venom_quills'], stage: 'creature', slot: 'back', keywords: ['venom', 'armor'], mods: { str: 2, tou: 3 }, desc: 'Touch it and regret it.' },
  { id: 'reef_back', name: 'Reef Back', adj: 'Reefed', from: ['dorsal_fin', 'kelp_garden'], stage: 'creature', slot: 'back', habitat: 'sea', keywords: ['symbiont', 'swift'], mods: { foodPerTurn: 1, spd: 1, cha: 1 }, desc: 'A swimming reef.' },
  { id: 'mirror_scales', name: 'Mirror Scales', adj: 'Mirrored', from: ['scales', 'swift_scales'], stage: 'creature', slot: 'skin', keywords: ['armor', 'swift'], mods: { tou: 3, spd: 2 }, desc: 'Hard, smooth and dazzling.' },
  { id: 'living_coat', name: 'Living Coat', adj: 'Living', from: ['fur', 'lichen_hide'], stage: 'creature', slot: 'skin', habitat: 'land', keywords: ['symbiont'], mods: { tou: 2, maxPop: 2, popPerTurn: 1 }, desc: 'Fur and lichen that heal you.' },
  { id: 'ocean_hide', name: 'Ocean Hide', adj: 'Ocean', from: ['blubber', 'cleaner_skin'], stage: 'creature', slot: 'skin', habitat: 'sea', keywords: ['symbiont'], mods: { tou: 2, maxPop: 2, cha: 1 }, desc: 'Thick, clean and full of friends.' },
  { id: 'neon_warning', name: 'Neon Warning', adj: 'Neon', from: ['warning_skin', 'biolume_skin'], stage: 'creature', slot: 'skin', keywords: ['venom', 'glow'], mods: { tou: 1, cha: 3 }, desc: 'Glowing spots that scream "poison".' },
  { id: 'mace_tail', name: 'Mace Tail', adj: 'Mace', from: ['club_tail', 'balancing_tail'], stage: 'creature', slot: 'tail', habitat: 'land', keywords: ['armor'], mods: { str: 3, spd: 1 }, desc: 'Swing it like a weapon.' },
  { id: 'climber_tail', name: 'Climber Tail', adj: 'Climbing', from: ['prehensile_tail', 'balancing_tail'], stage: 'creature', slot: 'tail', habitat: 'land', tags: ['grasp'], mods: { cun: 2, spd: 1, str: 1 }, desc: 'Swing through the trees.' },
  { id: 'comet_fluke', name: 'Comet Fluke', adj: 'Comet', from: ['fluke', 'glow_tail'], stage: 'creature', slot: 'tail', habitat: 'sea', keywords: ['swift', 'glow'], mods: { spd: 3, cha: 2 }, desc: 'You leave a trail of light.' },
  { id: 'scorpion_mace', name: 'Scorpion Mace', adj: 'Scorpion', from: ['stinger_tail', 'club_tail'], stage: 'creature', slot: 'tail', habitat: 'land', keywords: ['venom', 'armor'], mods: { str: 4, tou: 1 }, desc: 'Crush, then sting.' },
  { id: 'apex_jaws', name: 'Apex Jaws', adj: 'Apex', tier: 2, from: ['sabre_venom_fangs', 'crushing_jaws'], stage: 'creature', slot: 'mouth', diet: 'carn', keywords: ['venom'], mods: { str: 7, tou: 1 }, desc: 'Legendary. The top of every food chain. Carnivore.' },
  { id: 'dragon_back', name: 'Dragon Back', adj: 'Dragon', tier: 2, from: ['fortress_shell', 'venom_quills'], stage: 'creature', slot: 'back', keywords: ['venom', 'armor'], mods: { tou: 6, str: 3, damageReduce: 1 }, desc: 'Legendary. Armor, spikes and venom.' },
  { id: 'all_seeing_eyes', name: 'All-Seeing Eyes', adj: 'All-seeing', tier: 2, from: ['hunter_eyes', 'tremor_whiskers'], stage: 'creature', slot: 'senses', mods: { cun: 6, huntBonus: 2 }, desc: 'Legendary. Nothing escapes your notice.' },
  { id: 'masters_hands', name: "Maker's Hands", adj: "Maker's", tier: 2, habitat: 'land', from: ['clever_claws', 'soft_pads'], stage: 'creature', slot: 'hands', tags: ['grasp'], mods: { cun: 3, str: 2, insightPerTurn: 2 }, desc: 'Legendary. Hands that will one day build cities.' },
  { id: 'wind_legs', name: 'Wind Legs', adj: 'Wind-swift', tier: 2, habitat: 'land', from: ['sprinter_legs', 'hopping_legs'], stage: 'creature', slot: 'hindLimbs', keywords: ['swift'], mods: { spd: 6, str: 2 }, desc: 'Legendary. You outrun the wind.' },
  // ----- The Deep -----
  { id: 'shark_jaws', name: 'Shark Jaws', adj: 'Sharky', from: ['cookie_cutter', 'fangs'], stage: 'creature', slot: 'mouth', habitat: 'sea', diet: 'carn', mods: { str: 4, huntBonus: 1 }, desc: 'Rows of teeth that never run out. Carnivore.' },
  { id: 'shell_cracker', name: 'Shell-cracker Beak', adj: 'Cracking', from: ['hidden_beak', 'crushing_jaws'], stage: 'creature', slot: 'mouth', habitat: 'sea', diet: 'carn', mods: { str: 3, tou: 1, forageBonus: 1 }, desc: 'No shell is safe. Carnivore.' },
  { id: 'reef_grinder', name: 'Reef Grinder', adj: 'Grinding', from: ['coral_beak', 'grinding_beak'], stage: 'creature', slot: 'mouth', habitat: 'sea', diet: 'herb', mods: { forageBonus: 3, tou: 1 }, desc: 'Chews coral into sand. Herbivore.' },
  { id: 'vacuum_maw', name: 'Vacuum Maw', adj: 'Gulping', from: ['suction_mouth', 'baleen'], stage: 'creature', slot: 'mouth', habitat: 'sea', diet: 'omni', mods: { forageBonus: 3, cun: 1 }, desc: 'Inhales everything in front of it. Omnivore.' },
  { id: 'ripple_sense', name: 'Ripple Sense', adj: 'Feeling', from: ['lateral_line', 'electroreceptors'], stage: 'creature', slot: 'senses', habitat: 'sea', mods: { cun: 3, spd: 1, damageReduce: 1 }, desc: 'You feel a hunter coming long before it sees you.' },
  { id: 'rainbow_eyes', name: 'Rainbow Eyes', adj: 'Rainbow', from: ['mantis_eyes', 'big_eyes'], stage: 'creature', slot: 'senses', habitat: 'sea', mods: { cun: 4, huntBonus: 1 }, desc: 'Sixteen kinds of color. The world is brighter for you.' },
  { id: 'smasher_claws', name: 'Smasher Claws', adj: 'Smashing', from: ['pincers', 'smasher_club'], stage: 'creature', slot: 'hands', habitat: 'sea', tags: ['grasp'], mods: { str: 5 }, desc: 'Punch so fast the water boils, then grab what is left.' },
  { id: 'clever_arms', name: 'Clever Arms', adj: 'Clever', from: ['sucker_arms', 'feeding_arms'], stage: 'creature', slot: 'hands', habitat: 'sea', tags: ['grasp'], mods: { cun: 3, str: 1, insightPerTurn: 1 }, desc: 'Every arm has a little mind of its own.' },
  { id: 'sorting_claws', name: 'Sorting Claws', adj: 'Sorting', from: ['pincers', 'feather_arms'], stage: 'creature', slot: 'hands', habitat: 'sea', tags: ['grasp'], mods: { cun: 2, forageBonus: 2 }, desc: 'Pick, sort and carry. Nothing goes to waste.' },
  { id: 'death_veil', name: 'Death Veil', adj: 'Veiled', from: ['stinging_arms', 'feeding_arms'], stage: 'creature', slot: 'hands', habitat: 'sea', keywords: ['venom'], mods: { str: 3, huntBonus: 2 }, desc: 'A curtain of stinging arms. Swimming into it is the last mistake.' },
  { id: 'reef_walkers', name: 'Reef Walkers', adj: 'Striding', from: ['walking_legs', 'sucker_pads'], stage: 'creature', slot: 'feet', habitat: 'sea', mods: { spd: 1, tou: 2, forageBonus: 1 }, desc: 'Walk anywhere, cling to anything.' },
  { id: 'thousand_feet', name: 'Thousand Feet', adj: 'Thousand-footed', from: ['tube_feet', 'sucker_pads'], stage: 'creature', slot: 'feet', habitat: 'sea', mods: { tou: 3, cun: 1 }, desc: 'Grips anything and never lets go.' },
  { id: 'lantern_plate', name: 'Lantern Plate', adj: 'Lantern', from: ['belly_lights', 'belly_plate'], stage: 'creature', slot: 'feet', habitat: 'sea', keywords: ['glow', 'armor'], mods: { tou: 2, cha: 2 }, desc: 'Armored lights. Pretty and hard to bite.' },
  { id: 'nautilus_shell', name: 'Nautilus Shell', adj: 'Chambered', from: ['spiral_shell', 'carapace'], stage: 'creature', slot: 'back', habitat: 'sea', keywords: ['armor'], mods: { tou: 5, cun: 1 }, desc: 'Fill the chambers with air to rise, empty them to sink.' },
  { id: 'living_reef', name: 'Living Reef', adj: 'Reef', from: ['anemone_crown', 'kelp_garden'], stage: 'creature', slot: 'back', habitat: 'sea', keywords: ['symbiont'], mods: { foodPerTurn: 2, tou: 1, cha: 1 }, desc: 'A whole reef lives on you, and feeds you.' },
  { id: 'great_sail', name: 'Great Sail', adj: 'Great-sailed', from: ['sail_fin', 'dorsal_fin'], stage: 'creature', slot: 'back', habitat: 'sea', keywords: ['swift'], mods: { spd: 4, cha: 1 }, desc: 'The fastest thing in the sea.' },
  { id: 'color_storm', name: 'Color Storm', adj: 'Storming', from: ['color_skin', 'biolume_skin'], stage: 'creature', slot: 'skin', habitat: 'sea', keywords: ['glow'], mods: { cun: 3, cha: 3 }, desc: 'Waves of living color that speak, dazzle and hide.' },
  { id: 'storm_body', name: 'Storm Body', adj: 'Thundering', from: ['electric_organ', 'slime_skin'], stage: 'creature', slot: 'skin', habitat: 'sea', mods: { str: 4, huntBonus: 2 }, desc: 'Living lightning.' },
  { id: 'vanishing_skin', name: 'Vanishing Skin', adj: 'Vanishing', from: ['ink_glands', 'color_skin'], stage: 'creature', slot: 'skin', habitat: 'sea', mods: { cun: 2, spd: 1, damageReduce: 1 }, desc: 'Change color, squirt ink, and you were never there.' },
  { id: 'jet_drive', name: 'Jet Drive', adj: 'Jet-driven', from: ['jet_siphon', 'fluke'], stage: 'creature', slot: 'tail', habitat: 'sea', keywords: ['swift'], mods: { spd: 5 }, desc: 'Fins and jets together. A torpedo with eyes.' },
  { id: 'whip_lash', name: 'Whip Lash', adj: 'Lashing', from: ['thresher_tail', 'paddle_tail'], stage: 'creature', slot: 'tail', habitat: 'sea', mods: { str: 2, huntBonus: 2 }, desc: 'One crack and the school is stunned.' },
  { id: 'builders_arms', name: "Builder's Arms", adj: "Builder's", tier: 2, from: ['clever_arms', 'pincers'], stage: 'creature', slot: 'hands', habitat: 'sea', tags: ['grasp'], mods: { cun: 3, str: 2, insightPerTurn: 2 }, desc: 'Legendary. Arms that will one day build cities under the sea.' },
  { id: 'megalodon_jaws', name: 'Megalodon Jaws', adj: 'Megalodon', tier: 2, from: ['shark_jaws', 'bone_crusher'], stage: 'creature', slot: 'mouth', habitat: 'sea', diet: 'carn', mods: { str: 7, huntBonus: 1 }, desc: 'Legendary. The biggest bite there has ever been. Carnivore.' },
  { id: 'abyss_lantern', name: 'Abyss Lantern', adj: 'Abyssal', tier: 2, from: ['color_storm', 'neon_warning'], stage: 'creature', slot: 'skin', habitat: 'sea', keywords: ['glow', 'venom'], mods: { cun: 3, cha: 5 }, desc: 'Legendary. You are the brightest light in the dark.' },
];

// Advanced limbs are evolutions of basic limbs. They keep their own look.
G.LIMB_RECIPES = [
  ['slender_forelegs', 'stubby_forelegs', 'long_bones_f'],
  ['digging_forelegs', 'stubby_forelegs', 'thick_muscle_f'],
  ['grasping_arms', 'stubby_forelegs', 'gripping_pads_f'],
  ['pillar_forelegs', 'stubby_forelegs', 'bony_plates_f'],
  ['wing_membranes', 'stubby_forelegs', 'skin_flaps_f'],
  ['fore_tentacles', 'stubby_forelegs', 'boneless_f'],
  ['fore_tentacles', 'stubby_front_fins', 'boneless_f'],
  ['runner_legs', 'stubby_hindlegs', 'long_bones_h'],
  ['powerful_haunches', 'stubby_hindlegs', 'thick_muscle_h'],
  ['pillar_legs', 'stubby_hindlegs', 'bony_plates_h'],
  ['hopping_legs', 'stubby_hindlegs', 'springy_tendons_h'],
  ['upright_legs', 'stubby_hindlegs', 'balance_h'],
  ['pectoral_fins', 'stubby_front_fins', 'long_rays_sf'],
  ['front_flippers', 'stubby_front_fins', 'thick_muscle_sf'],
  ['armored_fins', 'stubby_front_fins', 'bony_plates_sf'],
  ['pelvic_fins', 'stubby_rear_fins', 'long_rays_sh'],
  ['rear_flippers', 'stubby_rear_fins', 'thick_muscle_sh'],
  ['sea_tentacles', 'stubby_rear_fins', 'boneless_sh'],
  ['gliding_fins', 'stubby_front_fins', 'wide_webbing_sf'],
  ['lobe_fins', 'stubby_front_fins', 'lobe_bones_sf'],
  ['lionfish_fins', 'stubby_rear_fins', 'spiny_rays_sh'],
];

G.RECIPE = {};
G.recipeKey = (a, b) => [a, b].sort().join('+');
G.LIMB_RECIPES.forEach(([id, a, b]) => {
  const part = G.PART[id];
  if (!part.from) { part.from = [a, b]; part.evolved = 1; part.limbEvo = true; part.looks = id; part.pack = undefined; G.EVOLUTIONS.push(part); }
  G.RECIPE[[a, b].sort().join('+')] = id;
});

G.EVOLUTIONS.filter((e) => !e.limbEvo).forEach((e) => {
  e.evolved = e.tier || 1;
  e.rarity = 0;
  // Draw it like its first ingredient, tinted by the second.
  e.looks = (G.PART[e.from[0]] && (G.PART[e.from[0]].looks || e.from[0])) || e.from[0];
  G.RECIPE[G.recipeKey(e.from[0], e.from[1])] = e.id;
  G.PARTS.push(e);
  G.PART[e.id] = e;
});
