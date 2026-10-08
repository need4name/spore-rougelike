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
    { id: 'hindLimbs', name: 'Rear fins' },
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
];

G.PART = {};
G.PARTS.forEach((p) => { G.PART[p.id] = p; });
