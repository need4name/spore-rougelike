// Event cards. One happens to your lineage every turn.
//
// Event fields:
//   id, stage ('cell' | 'creature' | 'any'), title, text
//   habitat    'land' | 'sea' (creature events only; leave out for both)
//   era        earliest era it can appear in (creature stage: 1, 2 or 3)
//   multi      true = only after multicellularity, false = only before it
//   tags       'food' | 'hunt' | 'social' | 'explore' | 'danger'; your Instinct makes matching events likelier
//   species    'predator' | 'prey' | 'rival' | 'neighbor' | 'any' | 'hostile' | 'allied'
//              picks a species in your world; {them} in the text is replaced with its name
//   weight     how often it shows up (default 1)
//   origins    list of origin ids where this event is 3x as likely
//   repeat     true = can happen more than once per run
//   when       optional function(run) returning true when the event is allowed
//
// Option fields:
//   label, hint (short text shown under the button)
//   req        { diet: ['carn','omni'], keyword: ['venom', 2], trait, part, anyPart, food, tag: 'grasp', innovation, zone, gimmick }
//   check      { stat: 'spd', diff: 3 }  rolls against a stat, then uses success / fail
//   result     outcome when there is no check
//   success / fail / result:
//     { text, pop, food, dna, insight, trait, loseTrait, opinion, randomPart, legacy, habitat, zone, setback, anim }
//     archetype gimmicks: partnerPop, hostPop, fed, drift, unmask, newHost, budGoes, budBack
//     living world: chain + chainIn (a follow-up event, marked chained: true), endActivity, warScore, nemesis
//   activity   only while that Activity is under way ('war', 'court', ...)
//   season     only in that season ('winter', 'bloom', ...)
//   biome      only in that biome (an id or a list of ids, see G.BIOMES); result `biome` moves you there
//   species    also 'target' (the Activity's target), 'nemesis', 'sworn', 'migrant'
//   zones      sea events only: list of home depths where it can happen (see G.SEA_ZONES)
//   Words in braces change with your body: {herd} {Herd} {nests} {cover} {home} {move} {depth}
//     anim: 'attack' | 'flee' | 'eat' | 'hurt' | 'mutate' | 'social' | 'rest' | 'grow' (picked automatically if left out)
window.G = window.G || {};

G.EVENTS = [
  // ======================= CELL STAGE =======================
  {
    id: 'larger_shadow', prop: 'shadow', stage: 'cell', title: 'A Shadow Above', tags: ['danger'], species: 'predator',
    text: 'A {them} drifts over your colony, ten times your size. Its membrane ripples as it tastes the water for you.',
    options: [
      { label: 'Dart away', check: { stat: 'spd', diff: 3 }, success: { text: 'You scatter faster than it can follow.', dna: 2 }, fail: { text: 'It catches the slowest of you.', pop: -2, dna: 1 } },
      { label: 'Go still in the silt', check: { stat: 'cun', diff: 2 }, success: { text: 'It passes over without noticing.', dna: 1, trait: 'cautious', anim: 'rest' }, fail: { text: 'It finds you anyway.', pop: -2 } },
      { label: 'Bristle your spikes', req: { keyword: ['armor', 1] }, result: { text: 'It recoils from your armor and tears itself on the way. You eat the scraps.', food: 3, trait: 'feared', opinion: -20, anim: 'attack' } },
      { label: 'Let it swallow some of you', hint: 'Risky', check: { stat: 'tou', diff: 4 }, success: { text: 'The swallowed cells survive inside it, then take it over from within. Something new is born.', dna: 5, trait: 'endosymbiont', anim: 'mutate' }, fail: { text: 'Its digestive juices are stronger than you are.', pop: -3, dna: 1 } },
    ],
  },
  {
    id: 'warm_current', prop: 'current', stage: 'cell', title: 'The Warm Current', tags: ['explore'],
    text: 'A warm current sweeps you up, thick with strange molecules from somewhere far away.',
    options: [
      { label: 'Ride it', check: { stat: 'spd', diff: 2 }, success: { text: 'You travel farther than any of your ancestors.', dna: 3, anim: 'flee' }, fail: { text: 'You tumble out, dizzy and scattered.', food: -2, dna: 1, anim: 'hurt' } },
      { label: 'Cling on and feed in its wake', result: { text: 'The current leaves plenty behind.', food: 3 } },
    ],
  },
  {
    id: 'algae_bloom', prop: 'bloom', stage: 'cell', title: 'Algae Bloom', tags: ['food'], species: 'prey',
    text: 'The water around you turns green. An algae bloom is spreading, and swarms of {them} follow it.',
    options: [
      { label: 'Gorge on the algae', req: { diet: ['herb', 'omni'] }, result: { text: 'You eat until you can barely move.', food: 5 } },
      { label: 'Ambush the {them}', req: { diet: ['carn', 'omni'] }, check: { stat: 'str', diff: 2 }, success: { text: 'They are too busy eating to notice you.', food: 5, dna: 1 }, fail: { text: 'They scatter before you strike.', food: 1 } },
      { label: 'Let it wash over you', result: { text: 'You learn the rhythm of blooms and seasons.', dna: 1, anim: 'rest' } },
    ],
  },
  {
    id: 'strange_molecule', prop: 'molecule', stage: 'cell', title: 'A Strange Molecule', tags: ['explore'],
    text: 'A glittering chain of atoms bumps against your membrane, humming with energy.',
    options: [
      { label: 'Let it in', check: { stat: 'tou', diff: 3 }, success: { text: 'It rewrites part of you. You feel more.', dna: 4, anim: 'mutate' }, fail: { text: 'It burns going in, but changes you all the same.', pop: -1, dna: 2 } },
      { label: 'Probe it carefully', check: { stat: 'cun', diff: 3 }, success: { text: 'You learn its secrets without getting hurt.', dna: 3, trait: 'curious' }, fail: { text: 'It falls apart in your grip.', dna: 1 } },
      { label: 'Push it away', result: { text: 'Some things are better left alone.', anim: 'rest' } },
    ],
  },
  {
    id: 'kin_cell', prop: 'bubbles', stage: 'cell', title: 'Kin', tags: ['social'], multi: false,
    text: 'A cell almost exactly like you presses against your membrane. It is not food. It might be family.',
    options: [
      { label: 'Fuse with it', result: { text: 'Two become one, and one becomes stronger.', pop: 2, anim: 'grow' } },
      { label: 'Cooperate', check: { stat: 'cha', diff: 2 }, success: { text: 'You feed side by side.', food: 2, trait: 'social' }, fail: { text: 'It drifts off, uninterested.', dna: 1 } },
      { label: 'Eat it', req: { diet: ['carn', 'omni'] }, check: { stat: 'str', diff: 2 }, success: { text: 'Family tastes much like everything else.', food: 4, trait: 'aggressive' }, fail: { text: 'It fights back hard.', pop: -1 } },
    ],
  },
  {
    id: 'viral_ghost', prop: 'virus', stage: 'cell', title: 'Viral Ghost', tags: ['danger'],
    text: 'A virus has latched onto you and is slipping its code into yours.',
    options: [
      { label: 'Fight it off', check: { stat: 'tou', diff: 3 }, success: { text: 'You destroy it and remember how.', dna: 2, trait: 'resilient' }, fail: { text: 'It sickens many of you before it dies.', pop: -2 } },
      { label: 'Let it rewrite you', hint: 'Random mutation', result: { text: 'You let the stranger edit you.', pop: -1, randomPart: true } },
    ],
  },
  {
    id: 'sunlit_shallows', prop: 'sun', stage: 'cell', title: 'Sunlit Shallows', tags: ['food'],
    text: 'An upwelling lifts you into bright, warm water. Sunlight pours through you.',
    options: [
      { label: 'Bask', req: { keyword: ['symbiont', 1] }, result: { text: 'Your passengers drink the light and feed you well.', food: 4, pop: 1 } },
      { label: 'Feed on what the sun grows', req: { diet: ['herb', 'omni'] }, result: { text: 'Fresh algae everywhere.', food: 3 } },
      { label: 'Sink back to the depths', result: { text: 'The deep holds more secrets.', dna: 2, food: -1 } },
    ],
  },
  {
    id: 'toxic_plume', prop: 'plume', stage: 'cell', title: 'Toxic Plume', origins: ['toxic', 'vents'], tags: ['danger'],
    text: 'A cloud of poison rolls toward you. Everything it touches stops moving.',
    options: [
      { label: 'Endure it', check: { stat: 'tou', diff: 3 }, success: { text: 'You survive what others cannot.', dna: 3 }, fail: { text: 'The poison eats at you.', pop: -2, dna: 1 } },
      { label: 'Flee', check: { stat: 'spd', diff: 2 }, success: { text: 'You outrun the cloud.', dna: 1 }, fail: { text: 'It catches the edge of you.', pop: -1 } },
      { label: 'Absorb the toxins', req: { keyword: ['venom', 1] }, result: { text: 'Poison is just another meal to you.', dna: 3, trait: 'toxic_affinity', anim: 'eat' } },
    ],
  },
  {
    id: 'thermal_vent', prop: 'vent', stage: 'cell', title: 'Thermal Vent', origins: ['vents'], tags: ['food', 'explore'],
    text: 'The seafloor cracks open beneath you. Black smoke pours out, and the water boils with chemical energy.',
    options: [
      { label: 'Feed on the chemicals', check: { stat: 'cun', diff: 2 }, success: { text: 'You learn to eat stone-breath.', food: 3, dna: 2 }, fail: { text: 'You get too close and scald yourself.', pop: -2 } },
      { label: 'Drift clear', result: { text: 'You stay safe and learn little.', dna: 1, anim: 'flee' } },
    ],
  },
  {
    id: 'ice_crystal', prop: 'ice', stage: 'cell', title: 'Ice Crystal', origins: ['frozen'], tags: ['danger'],
    text: 'The water freezes around you. An ice crystal slowly closes in.',
    options: [
      { label: 'Shelter inside it', check: { stat: 'tou', diff: 2 }, success: { text: 'The ice keeps predators away while you rest.', pop: 2, anim: 'rest' }, fail: { text: 'The cold bites deep.', pop: -1 } },
      { label: 'Break free', check: { stat: 'str', diff: 2 }, success: { text: 'You crack it open and grow stronger.', dna: 2, anim: 'attack' }, fail: { text: 'Exhausting work.', food: -2 } },
    ],
  },
  {
    id: 'rotifer_swarm', prop: 'swarm', stage: 'cell', title: 'The Swarm', tags: ['danger', 'hunt'], species: 'predator',
    text: 'A swarm of {them} sweeps toward you, spinning mouths open.',
    options: [
      { label: 'Fight', check: { stat: 'str', diff: 3 }, success: { text: 'You eat the ones that try to eat you.', food: 4, dna: 1, opinion: -15 }, fail: { text: 'They take their share of you.', pop: -2 } },
      { label: 'Scatter', check: { stat: 'spd', diff: 3 }, success: { text: 'You slip between them.', dna: 1 }, fail: { text: 'Too slow.', pop: -2 } },
      { label: 'Flash to confuse them', req: { keyword: ['glow', 1] }, result: { text: 'Your light sends them spinning the wrong way.', dna: 2, trait: 'dazzling', anim: 'mutate' } },
    ],
  },
  {
    id: 'dead_giant', prop: 'carcass', stage: 'cell', title: 'The Dead Giant', tags: ['food'],
    text: 'The body of an enormous cell sinks past you toward the seafloor.',
    options: [
      { label: 'Feast', result: { text: 'Plenty for everyone, and you got here first.', food: 4, trait: 'scavenger', anim: 'eat' } },
      { label: 'Study its insides', check: { stat: 'cun', diff: 2 }, success: { text: 'Its structure gives you ideas.', dna: 3 }, fail: { text: 'You learn nothing useful.', dna: 1 } },
    ],
  },
  {
    id: 'rival_strain', stage: 'cell', title: 'Crowded Waters', tags: ['food'], species: 'rival',
    text: 'The {them} are spreading through your waters, eating everything you would eat.',
    options: [
      { label: 'Outpace them to the food', check: { stat: 'spd', diff: 3 }, success: { text: 'You get there first, every time.', food: 3, dna: 1, opinion: -10 }, fail: { text: 'They are faster.', food: -2 } },
      { label: 'Wage war', check: { stat: 'str', diff: 3 }, success: { text: 'They retreat. The waters are yours.', dna: 3, trait: 'territorial', opinion: -30 }, fail: { text: 'A costly fight.', pop: -2, opinion: -10 } },
      { label: 'Share the waters', check: { stat: 'cha', diff: 2 }, success: { text: 'There is enough for both of you.', dna: 2, opinion: 30, trait: 'social' }, fail: { text: 'They push you out anyway.', food: -1 } },
    ],
  },
  {
    id: 'symbiont_offer', stage: 'cell', title: 'A Small Passenger', tags: ['social'], species: 'neighbor',
    text: 'A tiny {them} keeps bumping into you. It seems to want to live inside your membrane.',
    options: [
      { label: 'Let it in', check: { stat: 'cha', diff: 2 }, success: { text: 'It settles in and starts sharing its food.', trait: 'endosymbiont', opinion: 40, anim: 'social' }, fail: { text: 'It changes its mind.', opinion: 5 } },
      { label: 'Eat it', req: { diet: ['carn', 'omni'] }, result: { text: 'A small but tasty snack.', food: 2, opinion: -25 } },
      { label: 'Ignore it', result: { text: 'It drifts off.', anim: 'rest' } },
    ],
  },
  {
    id: 'prey_scatter', stage: 'cell', title: 'Easy Prey', tags: ['hunt'], species: 'prey',
    text: 'A cloud of {them} drifts right into your path, slow and unaware.',
    options: [
      { label: 'Feast', req: { diet: ['carn', 'omni'] }, check: { stat: 'spd', diff: 2 }, success: { text: 'You eat your fill.', food: 4, dna: 1 }, fail: { text: 'They scatter at the last moment.', food: 1 } },
      { label: 'Herd them toward your algae', req: { diet: ['herb'] }, result: { text: 'They graze nearby, and their waste feeds your algae.', food: 2, opinion: 10 } },
      { label: 'Let them pass', result: { text: 'Not today.', dna: 1 } },
    ],
  },
  {
    id: 'cell_division', prop: 'bubbles', stage: 'cell', title: 'Runaway Division', tags: ['social'],
    text: 'Conditions are perfect. Your cells begin dividing faster than ever.',
    options: [
      { label: 'Let it happen', check: { stat: 'tou', diff: 2 }, success: { text: 'The colony swells.', pop: 2, anim: 'grow' }, fail: { text: 'Too fast. Many come out wrong.', pop: -1, dna: 2, anim: 'mutate' } },
      { label: 'Divide carefully', result: { text: 'Slow and steady.', pop: 1, food: -1, anim: 'grow' } },
    ],
  },
  {
    id: 'colony_split', prop: 'current', stage: 'cell', title: 'A Split Colony', tags: ['danger'], multi: true,
    text: 'A current tears your colony in two. The halves drift apart.',
    options: [
      { label: 'Swim back together', check: { stat: 'spd', diff: 3 }, success: { text: 'You find each other again.', dna: 2 }, fail: { text: 'Half of you is lost to the current.', pop: -2 } },
      { label: 'Signal across the water', check: { stat: 'cha', diff: 3 }, success: { text: 'Chemical signals guide the lost half home.', dna: 2, trait: 'social' }, fail: { text: 'No answer comes.', pop: -2 } },
      { label: 'Let them go', result: { text: 'They will become something else.', pop: -1, dna: 3, anim: 'rest' } },
    ],
  },
  {
    id: 'specialization', stage: 'cell', title: 'Division of Labor', tags: ['explore'], multi: true,
    text: 'Some of your cells have started doing only one job. The colony feels like a body now.',
    options: [
      { label: 'Encourage it', hint: 'Random mutation', result: { text: 'A new kind of cell appears.', randomPart: true } },
      { label: 'Keep every cell flexible', result: { text: 'Adaptable, if not specialized.', dna: 3 } },
    ],
  },
  {
    id: 'lean_tide', prop: 'current', stage: 'cell', title: 'Lean Tide', repeat: true, weight: 0.6, tags: ['food'],
    text: 'The tide goes out and takes the food with it.',
    options: [
      { label: 'Tighten your membrane and wait', result: { text: 'You make do with less.', food: -2, anim: 'rest' } },
      { label: 'Search far afield', check: { stat: 'spd', diff: 2 }, success: { text: 'You find a fresh patch.', food: 2, anim: 'flee' }, fail: { text: 'Nothing out there either.', food: -2, pop: -1 } },
    ],
  },

  // ----- Cell milestone and finale -----
  {
    id: 'multicellularity', stage: 'cell', milestone: true, title: 'Many Become One',
    text: 'Your cells have stopped drifting apart after dividing. They cling together, share food, and pass signals. Now they must decide how to arrange themselves. This choice shapes every body your lineage will ever have.',
    options: [
      { label: 'Grow in a ring', hint: 'Radial symmetry: starfish and jellyfish. Sees all around, regrows, tough but slow.', result: { text: 'You face every direction at once.', trait: 'radial_plan', anim: 'grow' } },
      { label: 'Grow a head and a tail', hint: 'Bilateral symmetry: legs in pairs, from snakes to centipedes. Fast and flexible.', result: { text: 'You swim forward with purpose.', trait: 'streamlined_plan', anim: 'grow' } },
      { label: 'Grow however you like', hint: 'No symmetry: a sponge or slime mold. Huge, hardy colonies, but clumsy.', result: { text: 'You spread in every direction at once, a living carpet.', trait: 'sessile_plan', anim: 'grow' } },
    ],
  },
  {
    id: 'cell_finale', prop: 'shore', stage: 'cell', finale: true, title: 'The Edge of the Sea',
    text: 'Your colony has become a creature, small but complex. Above, light pours through the surface. Beyond it, the shore. Below, the open sea stretches out forever. Where will your descendants live?',
    options: [
      { label: 'Crawl onto the land', hint: 'Become a land creature', check: { stat: 'spd', diff: 2 }, success: { text: 'You drag yourself out into the air. The land is yours to claim.', habitat: 'land', trait: 'land_pioneer', anim: 'flee' }, fail: { text: 'The sun dries you out. You slide back into the water to try again another day.', pop: -2, setback: 4 } },
      { label: 'Haul out on the tidal flats', hint: 'Become a land creature', check: { stat: 'tou', diff: 2 }, success: { text: 'You survive the drying tides until your skin can bear the air.', habitat: 'land', trait: 'land_pioneer', anim: 'grow' }, fail: { text: 'The flats bake in the sun. Most of you do not make it back.', pop: -2, setback: 4 } },
      { label: 'Claim the open sea', hint: 'Stay a sea creature', check: { stat: 'str', diff: 2 }, success: { text: 'You leave the shallows behind and grow huge in the open water.', habitat: 'sea', trait: 'deep_dweller', anim: 'attack' }, fail: { text: 'The open sea is full of things bigger than you. You retreat to the shallows.', pop: -2, setback: 4 } },
      { label: 'Descend into the deep', hint: 'Stay a sea creature', check: { stat: 'cun', diff: 2 }, success: { text: 'You learn the ways of the dark water and make it home.', habitat: 'sea', trait: 'deep_dweller', anim: 'mutate' }, fail: { text: 'The pressure and dark are too much, for now.', pop: -2, setback: 4 } },
    ],
  },

  // ======================= CREATURE STAGE (both habitats) =======================
  {
    id: 'stalker', prop: 'night', stage: 'creature', title: 'The Stalker', tags: ['danger'], species: 'predator',
    text: 'A {them} has started following your herd. Every night, one fewer of you comes home.',
    options: [
      { label: 'Turn and fight', check: { stat: 'str', diff: 4 }, success: { text: 'It flees, bleeding. Your young will remember this.', dna: 3, trait: 'aggressive', opinion: -20 }, fail: { text: 'It drags another one away.', pop: -3 } },
      { label: 'Move to new grounds', check: { stat: 'spd', diff: 3 }, success: { text: 'You leave it behind.', dna: 2, trait: 'migratory' }, fail: { text: 'It follows you.', pop: -2 } },
      { label: 'Let it bite something poisonous', req: { keyword: ['venom', 1] }, result: { text: 'It takes one bite of your poisoned skin and staggers away, sick.', dna: 3, trait: 'feared', opinion: -30, anim: 'attack' } },
      { label: 'Lead it toward another herd', req: { trait: 'aggressive' }, result: { text: 'Someone else pays the price this time.', dna: 2, anim: 'flee' } },
      { label: 'Take to the sky', req: { tag: 'flight' }, result: { text: 'It snaps at empty air as your herd lifts away.', dna: 2, anim: 'flee', mood: 'proud' } },
    ],
  },
  {
    id: 'mating_season', prop: 'hearts', stage: 'creature', title: 'Mating Season', tags: ['social'],
    text: 'The season turns. Your kind is restless, calling and displaying.',
    options: [
      { label: 'Dazzling displays', check: { stat: 'cha', diff: 3 }, success: { text: 'The most beautiful have many young.', dna: 4, pop: 2, anim: 'social' }, fail: { text: 'Nobody is impressed.', dna: 1 } },
      { label: 'Fights for mates', check: { stat: 'str', diff: 3 }, success: { text: 'The strongest win, and the young are strong too.', dna: 3, pop: 1, trait: 'aggressive', anim: 'attack' }, fail: { text: 'Lots of injuries, few young.', pop: -2 } },
      { label: 'A quiet season', result: { text: 'Fewer young, but everyone eats well.', food: 2, anim: 'rest' } },
    ],
  },
  {
    id: 'meet_neighbors', stage: 'creature', title: 'The {them}', tags: ['social'], species: 'neighbor', repeat: true, weight: 1.2,
    text: 'A group of {them} wanders into your feeding grounds and stops to watch you.',
    options: [
      { label: 'Approach peacefully', check: { stat: 'cha', diff: 3 }, success: { text: 'They let you feed beside them.', opinion: 25, dna: 2, anim: 'social' }, fail: { text: 'They back away, wary.', opinion: -10 } },
      { label: 'Drive them off', check: { stat: 'str', diff: 3 }, success: { text: 'They will not come back soon.', food: 2, opinion: -30, anim: 'attack' }, fail: { text: 'They hold firm.', pop: -1, opinion: -20 } },
      { label: 'Watch and learn', check: { stat: 'cun', diff: 2 }, success: { text: 'You learn where they find food.', dna: 2, food: 1 }, fail: { text: 'They notice you watching.', opinion: -5 } },
    ],
  },
  {
    id: 'prey_herd', stage: 'creature', title: 'A {Herd} of {them}', tags: ['hunt'], species: 'prey', repeat: true,
    text: 'A {herd} of {them} is passing through. Their young lag behind.',
    options: [
      { label: 'Hunt them', req: { diet: ['carn', 'omni'] }, check: { stat: 'str', diff: 3 }, success: { text: 'A good hunt.', food: 5, dna: 1, opinion: -10 }, fail: { text: 'The adults turn on you.', pop: -2 } },
      { label: 'Chase one down', req: { diet: ['carn', 'omni'] }, check: { stat: 'spd', diff: 3 }, success: { text: 'It never had a chance.', food: 4, dna: 1, opinion: -10 }, fail: { text: 'They are faster than they look.', food: -1 } },
      { label: 'Follow them to good grazing', req: { diet: ['herb', 'omni'] }, result: { text: 'They know where the best food is.', food: 3 } },
      { label: 'Let them go', result: { text: 'They pass in peace.', opinion: 5, anim: 'rest' } },
    ],
  },
  {
    id: 'rival_contest', stage: 'creature', title: 'Contested Feeding Grounds', tags: ['danger', 'food'], species: 'rival', repeat: true,
    text: 'The {them} want the same feeding grounds you do. They have started pushing in.',
    options: [
      { label: 'Defend your feeding grounds', check: { stat: 'tou', diff: 4 }, success: { text: 'They break against you and retreat.', dna: 2, trait: 'territorial', opinion: -15 }, fail: { text: 'They take the best of it.', food: -3 } },
      { label: 'Strike first', check: { stat: 'str', diff: 4 }, success: { text: 'You drive them out of {depth}.', dna: 3, food: 2, opinion: -30 }, fail: { text: 'Your attack falls apart.', pop: -2, opinion: -15 } },
      { label: 'Agree to share', check: { stat: 'cha', diff: 4 }, success: { text: 'An uneasy truce.', opinion: 30, dna: 1, anim: 'social' }, fail: { text: 'They take this as weakness.', food: -2, opinion: -10 } },
    ],
  },
  {
    id: 'drought', prop: 'drought', stage: 'creature', title: 'Drought', habitat: 'land', tags: ['food', 'danger'],
    text: 'The rains have not come. Your rivers shrink to puddles, and your young grow thin.',
    options: [
      { label: 'Migrate', check: { stat: 'spd', diff: 3 }, success: { text: 'You find a valley the drought has not reached.', food: 2, trait: 'migratory', anim: 'flee' }, fail: { text: 'The journey costs you.', pop: -2, food: -2 } },
      { label: 'Dig for water', req: { part: 'digging_forelegs' }, result: { text: 'Your forelegs find water under the riverbed.', pop: 1, dna: 2 } },
      { label: 'Fly to a distant lake', req: { tag: 'flight' }, result: { text: 'From the air, you spot water days away on foot.', food: 3, dna: 2, anim: 'flee' } },
      { label: 'Endure it', check: { stat: 'tou', diff: 3 }, success: { text: 'You wait it out.', dna: 2, anim: 'rest' }, fail: { text: 'Not everyone survives.', pop: -3 } },
    ],
  },
  {
    id: 'strange_fruit', prop: 'fruit', stage: 'creature', title: 'Strange Fruit', habitat: 'land', tags: ['food'], species: 'neighbor',
    text: 'A tree near your nests is heavy with purple fruit. You notice that nothing else eats it.',
    options: [
      { label: 'Eat it', req: { diet: ['herb', 'omni'] }, check: { stat: 'tou', diff: 2 }, success: { text: 'Sweet, and strangely energizing.', food: 3, dna: 2 }, fail: { text: 'Now you know why nothing eats it.', pop: -2 } },
      { label: 'Watch the {them} try it first', check: { stat: 'cun', diff: 3 }, success: { text: 'They eat it and are fine. Then you feast.', food: 3, opinion: -10 }, fail: { text: 'They see through it.', opinion: -15 } },
      { label: 'Leave it', result: { text: 'Better safe.', anim: 'rest' } },
    ],
  },
  {
    id: 'nest_raiders', prop: 'nest', stage: 'creature', title: 'Raiders in the Night', tags: ['danger'], species: 'rival',
    text: 'Something has been stealing from your {nests} at night. You find traces of {them}.',
    options: [
      { label: 'Chase them down', check: { stat: 'spd', diff: 3 }, success: { text: 'They will not be back.', food: 2, opinion: -20, anim: 'attack' }, fail: { text: 'They get away with plenty.', food: -2 } },
      { label: 'Leave a poisoned trap', req: { keyword: ['venom', 1] }, result: { text: 'They will not be back.', dna: 3, opinion: -30 } },
      { label: 'Post guards', check: { stat: 'cun', diff: 2 }, success: { text: 'Taking turns on watch keeps everyone safe.', dna: 2, trait: 'cautious' }, fail: { text: 'The guards fall asleep.', food: -1 } },
    ],
  },
  {
    id: 'ancient_bones', prop: 'bones', stage: 'creature', title: 'Ancient Bones', tags: ['explore'],
    text: 'Fossils lie exposed after a storm. Something in you recognizes the shapes.',
    options: [
      { label: 'Linger and remember', result: { text: 'Your lineage remembers where it came from.', dna: 3, anim: 'rest' } },
      { label: 'Gnaw them for minerals', result: { text: 'Good for growing bones.', pop: 1, food: 1, anim: 'eat' } },
    ],
  },
  {
    id: 'cleaners', stage: 'creature', title: 'Little Helpers', tags: ['social'], species: 'neighbor',
    text: 'A swarm of tiny {them} has started picking parasites off your hide.',
    options: [
      { label: 'Let them stay', check: { stat: 'cha', diff: 2 }, success: { text: 'A partnership that will last generations.', pop: 2, opinion: 30, anim: 'social' }, fail: { text: 'They pick too hard. You shake them off.', opinion: -5 } },
      { label: 'Welcome them into your garden', req: { keyword: ['symbiont', 1] }, result: { text: 'They settle among your symbionts and keep you healthy.', pop: 3, dna: 2, opinion: 40, anim: 'social' } },
      { label: 'Eat them', req: { diet: ['carn', 'omni'] }, result: { text: 'They should have been more careful.', food: 2, opinion: -40 } },
    ],
  },
  {
    id: 'alpha_challenge', stage: 'creature', title: 'The Alpha', tags: ['danger', 'social'], species: 'rival',
    text: 'The largest of the {them} blocks your path and roars a challenge.',
    options: [
      { label: 'Fight the alpha', check: { stat: 'str', diff: 4 }, success: { text: 'It yields. The {them} now respect you.', dna: 4, opinion: 20, trait: 'feared' }, fail: { text: 'You are beaten badly.', pop: -3, opinion: -10 } },
      { label: 'Bow low', result: { text: 'Peace, at the cost of pride.', opinion: 30, trait: 'meek', anim: 'social' } },
      { label: 'Outmaneuver it', check: { stat: 'spd', diff: 3 }, success: { text: 'It tires itself out chasing you.', dna: 2 }, fail: { text: 'It catches you.', pop: -2 } },
    ],
  },
  {
    id: 'plague', prop: 'sickness', stage: 'creature', title: 'Sickness', tags: ['danger'],
    text: 'A sickness is spreading through your herd. Coughing, then stillness.',
    options: [
      { label: 'Keep the sick apart', check: { stat: 'cun', diff: 3 }, success: { text: 'The sickness burns out.', dna: 2 }, fail: { text: 'Too late.', pop: -3 } },
      { label: 'Ride it out', check: { stat: 'tou', diff: 3 }, success: { text: 'The survivors come out stronger.', trait: 'resilient', anim: 'grow' }, fail: { text: 'Many fall.', pop: -3 } },
      { label: 'Eat bitter medicine plants', req: { diet: ['herb', 'omni'] }, result: { text: 'An old instinct saves you.', pop: 1, dna: 1, anim: 'eat' } },
    ],
  },
  {
    id: 'night_hunters', prop: 'night', stage: 'creature', title: 'Eyes in the Dark', tags: ['danger'], species: 'predator',
    text: 'At night, {them} circle your resting herd.',
    options: [
      { label: 'Light up the night', req: { keyword: ['glow', 2] }, result: { text: 'Your glow reveals them, and they slink away.', dna: 3, trait: 'dazzling', anim: 'mutate' } },
      { label: 'Huddle together', check: { stat: 'cha', diff: 3 }, success: { text: 'Strength in numbers.', trait: 'social', dna: 1, anim: 'social' }, fail: { text: 'Panic. The herd scatters.', pop: -2 } },
      { label: 'Fight in the dark', check: { stat: 'str', diff: 3 }, success: { text: 'You drive them off.', dna: 2, opinion: -15 }, fail: { text: 'You cannot see what you are fighting.', pop: -2 } },
    ],
  },
  {
    id: 'trapped_neighbor', prop: 'tar', stage: 'creature', title: 'Trapped', tags: ['social'], species: 'neighbor',
    text: 'One of the {them} is stuck fast and crying out. The rest of its kind watch you.',
    options: [
      { label: 'Pull it free', check: { stat: 'str', diff: 2 }, success: { text: 'The {them} will remember your kindness.', opinion: 40, trait: 'gentle', anim: 'social' }, fail: { text: 'You nearly get stuck yourself.', pop: -1, opinion: 10 } },
      { label: 'Eat it', req: { diet: ['carn', 'omni'] }, result: { text: 'An easy meal, and the {them} saw everything.', food: 5, opinion: -40, anim: 'eat' } },
      { label: 'Move on', result: { text: 'Not your problem.', anim: 'rest' } },
    ],
  },
  {
    id: 'crowded', stage: 'creature', title: 'Too Many Mouths', tags: ['food'],
    when: (run) => run.pop >= G.maxPop(run) - 1,
    text: 'Your kind has grown so numerous that {home} around you can barely feed you all.',
    options: [
      { label: 'A group sets off to find a new home', result: { text: 'They will become a new branch of the family.', pop: -2, dna: 4, anim: 'flee' } },
      { label: 'Push into new territory', check: { stat: 'str', diff: 3 }, success: { text: 'The territory grows to fit you.', food: 4, anim: 'attack' }, fail: { text: 'The neighbors push back.', pop: -1 } },
    ],
  },
  {
    id: 'hungry_winter', prop: 'snow', stage: 'creature', title: 'Hungry Season', tags: ['food'], species: 'rival', repeat: true, weight: 0.6,
    text: 'The cold season comes early. Food is scarce everywhere.',
    options: [
      { label: 'Tighten your belts', result: { text: 'Everyone eats a little less.', food: -3, anim: 'rest' } },
      { label: 'Raid the {them} stores', check: { stat: 'cun', diff: 3 }, success: { text: 'You steal enough to get through.', food: 2, opinion: -20, anim: 'flee' }, fail: { text: 'You are caught in the act.', pop: -1, opinion: -20 } },
    ],
  },
  {
    id: 'mutation_spurt', stage: 'creature', title: 'An Odd Birth', tags: ['explore'],
    text: 'A youngster is born unlike any other. The herd gathers around it.',
    options: [
      { label: 'Protect it', hint: 'Random mutation', result: { text: 'It grows up and has young of its own. They are just like it.', randomPart: true } },
      { label: 'Leave it to fate', check: { stat: 'tou', diff: 3 }, success: { text: 'It survives, and so does its strength.', dna: 3, anim: 'grow' }, fail: { text: 'It does not survive.', dna: 1, anim: 'rest' } },
    ],
  },

  // ----- Land only -----
  // ---------- Shells, Scales and Soft Bodies ----------
  // ---------- Paths of Mind: signature events ----------
  {
    id: 'tool_borrowed_stick', prop: 'stick', stage: 'creature', title: 'The Borrowed Stick', tags: ['social', 'food'], species: 'neighbor',
    when: (run) => run.path === 'tool',
    text: 'One of the {them} watches your kind dig grubs with a stick. Then it picks up a stick of its own.',
    options: [
      { label: 'Teach it properly', check: { stat: 'cha', diff: 4 }, success: { text: 'Now two kinds use tools. They will remember who taught them.', opinion: 25, insight: 3, anim: 'social' }, fail: { text: 'It snaps the stick and wanders off.', opinion: -5 } },
      { label: 'Snatch the stick away', check: { stat: 'str', diff: 3 }, success: { text: 'Tools are yours alone.', insight: 2, opinion: -15, anim: 'attack' }, fail: { text: 'It hits you with it.', pop: -1, opinion: -10 } },
      { label: 'Let it work it out', result: { text: 'It never quite does. But it keeps trying.', insight: 1, anim: 'rest' } },
    ],
  },
  {
    id: 'tool_broken_edge', prop: 'bones', stage: 'creature', title: 'A Better Edge', tags: ['explore'],
    when: (run) => run.path === 'tool',
    text: 'A young one drops a stone and it splits clean, sharper than anything your kind has ever made.',
    options: [
      { label: 'Try to do it again', check: { stat: 'cun', diff: 4 }, success: { text: 'Again, and again. A new way of making things.', insight: 4, anim: 'mutate' }, fail: { text: 'Lots of broken stones and sore fingers.', food: -1, insight: 1 } },
      { label: 'Use this one carefully', result: { text: 'It is passed from hand to hand for generations.', insight: 2, dna: 1, anim: 'rest' } },
    ],
  },
  {
    id: 'song_duel', prop: 'notes', stage: 'creature', title: 'The Song Duel', tags: ['social'], species: 'rival',
    when: (run) => run.path === 'song',
    text: 'The {them} have started singing at the edge of your range: loud, long and clearly meant for you.',
    options: [
      { label: 'Out-sing them', check: { stat: 'cha', diff: 5 }, success: { text: 'Your song goes on long after theirs has faded. They leave.', insight: 3, opinion: 10, anim: 'social' }, fail: { text: 'They win, and every creature in the land heard it.', opinion: -10, food: -1 } },
      { label: 'Learn their song', check: { stat: 'cun', diff: 4 }, success: { text: 'Now you know two songs. They are oddly flattered.', insight: 4, opinion: 20 }, fail: { text: 'It comes out wrong. They take it as an insult.', opinion: -15 } },
      { label: 'Stay silent', result: { text: 'A song not sung is a song forgotten.', insight: -1, anim: 'rest' } },
    ],
  },
  {
    id: 'song_lost_verse', prop: 'notes', stage: 'creature', title: 'The Lost Verse', tags: ['danger'],
    when: (run) => run.path === 'song',
    text: 'The oldest singer has died, and with them a verse of the song that nobody else knew.',
    options: [
      { label: 'Piece it back together', check: { stat: 'cun', diff: 4 }, success: { text: 'Fragment by fragment, the verse returns.', insight: 3 }, fail: { text: 'It is gone. Something your kind once knew is lost.', insight: -3 } },
      { label: 'Write a new verse in its place', check: { stat: 'cha', diff: 3 }, success: { text: 'A new verse, about the singer who died.', insight: 2, trait: 'cooperative', anim: 'social' }, fail: { text: 'Nobody can agree on the words.', food: -1 } },
    ],
  },
  {
    id: 'many_color_talk', prop: 'night', stage: 'creature', title: 'Words of Color', tags: ['social'], species: 'any',
    when: (run) => run.path === 'many',
    text: 'One of your kind flickers a pattern at the {them}. To your surprise, they seem to understand it.',
    options: [
      { label: 'Teach them a few patterns', check: { stat: 'cha', diff: 4 }, success: { text: 'A shared language of color, small but real.', opinion: 25, insight: 3, anim: 'social' }, fail: { text: 'They take it as a threat display.', opinion: -15 } },
      { label: 'Use it to fool them', check: { stat: 'cun', diff: 4 }, success: { text: 'They believe the patterns. You eat well.', food: 3, insight: 2, opinion: -10 }, fail: { text: 'They see through you.', opinion: -15 } },
    ],
  },
  {
    id: 'many_crack_escape', prop: 'cave', stage: 'creature', title: 'Through the Crack', tags: ['danger'], species: 'predator',
    when: (run) => run.path === 'many',
    text: 'The {them} have cornered one of your cleverest. There is a crack in the rock, far too small, behind it.',
    options: [
      { label: 'Think your way through it', check: { stat: 'cun', diff: 3 }, success: { text: 'It pours itself through, then reaches back to teach the others.', insight: 3, anim: 'flee' }, fail: { text: 'Too slow, this time.', pop: -2 } },
      { label: 'Change color and vanish', check: { stat: 'cun', diff: 4 }, success: { text: 'The hunter stares straight at it and sees only rock.', insight: 2, dna: 2 }, fail: { text: 'The disguise slips.', pop: -2 } },
    ],
  },
  {
    id: 'swarm_split', prop: 'dust', stage: 'creature', title: 'The Colony Splits', tags: ['social'],
    when: (run) => run.path === 'swarm',
    text: 'A second queen has hatched. Half the colony follows her to the edge of your range.',
    options: [
      { label: 'Let them go and found a sister colony', result: { text: 'Two colonies, one mind across the distance.', insight: 3, pop: -2, anim: 'social' } },
      { label: 'Bring them back together', check: { stat: 'cha', diff: 4 }, success: { text: 'The colony stays one, larger than before.', insight: 2, pop: 1 }, fail: { text: 'A bitter split. Some are lost.', pop: -3 } },
    ],
  },
  {
    id: 'swarm_build', prop: 'dust', stage: 'creature', title: 'Building', tags: ['explore'],
    when: (run) => run.path === 'swarm',
    text: 'Without anyone deciding, the whole colony starts to build something huge.',
    options: [
      { label: 'Let it grow', check: { stat: 'tou', diff: 4 }, success: { text: 'A tower taller than any creature, full of cool tunnels.', insight: 3, trait: 'cautious', anim: 'grow' }, fail: { text: 'It collapses in the rain.', food: -2 } },
      { label: 'Build it near water', check: { stat: 'cun', diff: 4 }, success: { text: 'Cool, damp and safe. Perfect.', insight: 2, food: 2 }, fail: { text: 'The flood finds it first.', pop: -1, food: -1 } },
    ],
  },
  {
    id: 'garden_blight', prop: 'sickness', stage: 'creature', title: 'Blight', tags: ['danger', 'food'],
    when: (run) => run.path === 'garden',
    text: 'A gray rot is spreading through the crop your kind has tended for generations.',
    options: [
      { label: 'Burn out the sick patches', check: { stat: 'tou', diff: 4 }, success: { text: 'A hard season, but the crop survives.', food: -2, insight: 3 }, fail: { text: 'The rot spreads anyway.', food: -4 } },
      { label: 'Find a crop that resists it', check: { stat: 'cun', diff: 4 }, success: { text: 'A new strain, stronger than the old.', insight: 4, anim: 'mutate' }, fail: { text: 'Nothing resists it. Hunger follows.', food: -3, pop: -1 } },
      { label: 'Abandon the field', result: { text: 'Start again somewhere new.', food: -2, anim: 'rest' } },
    ],
  },
  {
    id: 'garden_tame', prop: 'pond', stage: 'creature', title: 'Willing Herds', tags: ['social', 'food'], species: 'prey',
    when: (run) => run.path === 'garden',
    text: 'The {them} have started gathering near your gardens, eating the scraps. They are getting tame.',
    options: [
      { label: 'Keep them, and keep them safe', check: { stat: 'cha', diff: 4 }, success: { text: 'Your first herd. They give food and ask for little.', food: 3, insight: 2, opinion: 30, anim: 'social' }, fail: { text: 'They panic and scatter.', opinion: -10 } },
      { label: 'Eat them', req: { diet: ['carn', 'omni'] }, result: { text: 'An easy meal, but they will not come back.', food: 4, opinion: -30, anim: 'eat' } },
    ],
  },
  // ---------- Eyes, arms and legs ----------
  {
    id: 'eyes_behind', prop: 'night', stage: 'creature', title: 'From Behind', tags: ['danger'], species: 'predator',
    text: 'The {them} have learned to creep up from behind, where your {herd} cannot see.',
    options: [
      { label: 'See them coming', req: { eyes: 3 }, result: { text: 'With eyes all around your head, there is no "behind". You are long gone before they pounce.', dna: 2, anim: 'flee' } },
      { label: 'Post lookouts', check: { stat: 'cun', diff: 4 }, success: { text: 'Taking turns facing backward works.', dna: 2 }, fail: { text: 'The lookouts look the wrong way.', pop: -2 } },
      { label: 'Run at the first sound', check: { stat: 'spd', diff: 4 }, success: { text: 'Away before they strike.', dna: 1, anim: 'flee' }, fail: { text: 'Not fast enough.', pop: -2 } },
    ],
  },
  {
    id: 'eye_blight', prop: 'sickness', stage: 'creature', title: 'Eye Blight', tags: ['danger'],
    when: (run) => G.eyeCount(run) >= 3,
    text: 'A crusty blight is spreading from eye to eye. The more eyes a body has, the worse it gets.',
    options: [
      { label: 'Close most of them for a while', check: { stat: 'tou', diff: 4 }, success: { text: 'Half-blind for a season, but the blight passes.', food: -2, dna: 2, anim: 'rest' }, fail: { text: 'It spreads anyway.', pop: -2, food: -1 } },
      { label: 'Wash them in the river', req: { food: 2 }, result: { text: 'Cold water and rest. Most recover.', food: -2, dna: 1, anim: 'rest' } },
      { label: 'Ignore it', result: { text: 'It hits your many-eyed young hardest.', pop: -2, anim: 'hurt' } },
    ],
  },
  {
    id: 'blinding_glare', prop: 'sun', stage: 'creature', title: 'The Glare', tags: ['danger', 'explore'],
    text: 'The sun blazes off the water and the white rocks. Everything is light.',
    options: [
      { label: 'Squint with few eyes', check: { stat: 'cun', diff: 3 }, success: { text: 'One or two eyes are easy to shade. You keep feeding.', food: 2 }, fail: { text: 'Dazzled, you wander into thorns.', pop: -1 } },
      { label: 'Use every eye at once', req: { eyes: 4 }, check: { stat: 'tou', diff: 5 }, success: { text: 'So many eyes catch every shadow. You spot hidden food.', food: 3, dna: 2 }, fail: { text: 'Too much light, through too many eyes. You are blind for days.', pop: -2, food: -2 } },
      { label: 'Hide until dusk', result: { text: 'A lost day, but a safe one.', food: -1, anim: 'rest' } },
    ],
  },
  {
    id: 'high_fruit', prop: 'tree', stage: 'creature', habitat: 'land', title: 'Out of Reach', tags: ['food'],
    text: 'The ripest fruit hangs just out of reach, and every year fewer of you can get to it.',
    options: [
      { label: 'Stand up and stretch', req: { upright: true }, result: { text: 'On two legs you simply reach up and pick it.', food: 3, dna: 1, anim: 'eat' } },
      { label: 'Pull the branch down with your hands', req: { arms: 1 }, result: { text: 'Hands make everything easier.', food: 3, dna: 2, anim: 'eat' } },
      { label: 'Jump for it', check: { stat: 'spd', diff: 4 }, success: { text: 'Snatched!', food: 2 }, fail: { text: 'You land in a heap.', pop: -1 } },
      { label: 'Wait for windfalls', result: { text: 'A few fall. Most rot.', food: 1, anim: 'rest' } },
    ],
  },
  {
    id: 'carry_the_young', prop: 'fire', stage: 'creature', habitat: 'land', title: 'Carry Them Out', tags: ['danger'],
    text: 'Smoke on the wind, and the young cannot run fast enough.',
    options: [
      { label: 'Scoop them up and run', req: { arms: 1 }, result: { text: 'Every parent carries a child. Nobody is left behind.', dna: 3, anim: 'flee' } },
      { label: 'Herd them along', check: { stat: 'cha', diff: 4 }, success: { text: 'Calls and nudges keep them moving.', dna: 2, anim: 'flee' }, fail: { text: 'Some are lost in the smoke.', pop: -3 } },
      { label: 'Outrun it', check: { stat: 'spd', diff: 5 }, success: { text: 'The fastest of you make it.', pop: -1, dna: 1, anim: 'flee' }, fail: { text: 'It catches the slow.', pop: -3 } },
    ],
  },
  {
    id: 'cliff_climb', prop: 'cave', stage: 'creature', habitat: 'land', title: 'The Cliff', tags: ['explore'],
    text: 'A sheer cliff. At the top, a ledge full of nests and berries no one else can reach.',
    options: [
      { label: 'Swarm up on many legs', req: { manyLegs: true }, result: { text: 'Dozens of feet find dozens of holds. Up you go.', food: 3, dna: 2, anim: 'flee' } },
      { label: 'Climb hand over hand', req: { arms: 1 }, check: { stat: 'str', diff: 3 }, success: { text: 'Strong arms haul you up.', food: 3, dna: 2 }, fail: { text: 'A hand slips.', pop: -1 } },
      { label: 'Scramble up', check: { stat: 'spd', diff: 5 }, success: { text: 'Somehow, you make it.', food: 2, dna: 1 }, fail: { text: 'A long fall.', pop: -2 } },
      { label: 'Leave it', result: { text: 'Some things are not worth falling for.', anim: 'rest' } },
    ],
  },
  {
    id: 'tangled_legs', prop: 'tree', stage: 'creature', habitat: 'land', title: 'Tangled', tags: ['danger'],
    when: (run) => G.symmetry(run) === 'bilateral' && G.segments(run) - G.armPairs(run) >= 4,
    text: 'So many legs, and the creepers here grab every one of them.',
    options: [
      { label: 'Cut yourselves free', check: { stat: 'str', diff: 4 }, success: { text: 'Snip, snip, snip, a hundred times.', dna: 2 }, fail: { text: 'Some are stuck for good.', pop: -2 } },
      { label: 'Move one leg at a time', check: { stat: 'cun', diff: 4 }, success: { text: 'Slow and careful. Everyone gets out.', food: -1, dna: 2, anim: 'rest' }, fail: { text: 'You tie yourselves in knots.', pop: -1, food: -2 } },
      { label: 'Go around the thicket', result: { text: 'A long detour on a lot of tired legs.', food: -2, anim: 'rest' } },
    ],
  },
  {
    id: 'two_legs_tall_grass', prop: 'dust', stage: 'creature', habitat: 'land', biome: ['plains', 'shore', 'swamp'], title: 'Tall Grass', tags: ['danger', 'explore'], species: 'predator',
    text: 'The grass is taller than your {herd}. Somewhere in it, the {them} are hunting.',
    options: [
      { label: 'Stand up and look over it', req: { upright: true }, result: { text: 'Up on two legs, you see them coming from far away.', dna: 3, anim: 'flee' } },
      { label: 'Lie low and still', check: { stat: 'cun', diff: 4 }, success: { text: 'They pass a few steps away.', dna: 2, anim: 'rest' }, fail: { text: 'They find you.', pop: -2 } },
      { label: 'Run for open ground', check: { stat: 'spd', diff: 4 }, success: { text: 'Out into the open, and away.', dna: 1, anim: 'flee' }, fail: { text: 'The grass slows you down.', pop: -2 } },
    ],
  },
  {
    id: 'arm_crawl_mud', prop: 'pond', stage: 'creature', habitat: 'land', title: 'Deep Mud', tags: ['explore'],
    when: (run) => G.armPairs(run) > 0,
    text: 'A wide bog of sucking mud lies between you and better feeding grounds.',
    options: [
      { label: 'Haul yourselves across by the arms', req: { arms: 1 }, check: { stat: 'str', diff: 3 }, success: { text: 'Grabbing roots and branches, you pull through.', food: 3, dna: 1 }, fail: { text: 'Exhausted, some sink.', pop: -1 } },
      { label: 'Wade', check: { stat: 'tou', diff: 4 }, success: { text: 'Muddy, but across.', food: 2 }, fail: { text: 'The mud wins.', pop: -2 } },
      { label: 'Stay where you are', result: { text: 'Better hungry than drowned.', food: -1, anim: 'rest' } },
    ],
  },
  {
    id: 'many_eyes_deep', prop: 'shadow', stage: 'creature', habitat: 'sea', title: 'Shapes Below', tags: ['danger'], species: 'predator',
    text: 'Something big rises from the dark water beneath your {herd}. The {them}.',
    options: [
      { label: 'Watch every direction at once', req: { eyes: 3 }, result: { text: 'Eyes above, below and behind. You scatter before it is close.', dna: 2, anim: 'flee' } },
      { label: 'Dive for the bottom', check: { stat: 'spd', diff: 4 }, success: { text: 'You hide in the rocks.', dna: 1, anim: 'flee' }, fail: { text: 'It takes the slowest.', pop: -2 } },
      { label: 'Ball up tight', check: { stat: 'cha', diff: 4 }, success: { text: 'A tight school confuses it.', dna: 2, anim: 'social' }, fail: { text: 'The ball breaks apart.', pop: -2 } },
    ],
  },
  {
    id: 'kelp_tangle', prop: 'kelp', stage: 'creature', habitat: 'sea', title: 'Caught in the Kelp', tags: ['danger'],
    text: 'A storm has wound the kelp into great knots, and some of your {herd} are caught inside.',
    options: [
      { label: 'Pull them free with your arms', req: { tag: 'grasp' }, result: { text: 'Arms and tentacles untangle every one.', dna: 2, anim: 'social' } },
      { label: 'Bite through the kelp', check: { stat: 'str', diff: 4 }, success: { text: 'Chewed free.', food: 1, dna: 1 }, fail: { text: 'Some stay trapped.', pop: -2 } },
      { label: 'Wait for the tide', result: { text: 'The tide loosens the knots, slowly.', food: -2, anim: 'rest' } },
    ],
  },
  {
    id: 'current_race', prop: 'current', stage: 'creature', habitat: 'sea', title: 'The Fast Current', tags: ['explore'],
    text: 'A strong current sweeps past, full of drifting food. Swimming into it takes strong fins.',
    options: [
      { label: 'Ride it on many fins', req: { manyLegs: true }, result: { text: 'All those fins hold you steady. You feast.', food: 4, anim: 'eat' } },
      { label: 'Dart in and out', check: { stat: 'spd', diff: 4 }, success: { text: 'In, grab, out.', food: 3 }, fail: { text: 'It sweeps some of you away.', pop: -1 } },
      { label: 'Feed at its edge', result: { text: 'Scraps, but safe.', food: 1, anim: 'eat' } },
    ],
  },
  {
    id: 'clutch_of_eggs', prop: 'nest', stage: 'creature', title: 'A Clutch of Eggs', tags: ['growth'],
    when: (run) => run.traits.includes('young_eggs'),
    text: 'Your {herd} have laid a great clutch of eggs. They are warm, still, and very tempting to everything that walks past.',
    options: [
      { label: 'Guard them day and night', check: { stat: 'tou', diff: 4 }, success: { text: 'Not one egg is lost. The hatchlings pour out.', pop: 3, anim: 'grow' }, fail: { text: 'Hungry mouths get past your guard.', pop: 1, food: -2 } },
      { label: 'Hide them well', check: { stat: 'cun', diff: 4 }, success: { text: 'Buried deep, they hatch in safety.', pop: 2, dna: 1, anim: 'grow' }, fail: { text: 'Something digs them up.', food: -1 } },
      { label: 'Carry them on your back', req: { anyPart: ['egg_sac'] }, result: { text: 'Wherever you go, the eggs go too. Every one hatches.', pop: 3, dna: 2, anim: 'grow' } },
      { label: 'Lay and leave', result: { text: 'Lay many, hope some live. A few do.', pop: 1, anim: 'rest' } },
    ],
  },
  {
    id: 'egg_thieves', prop: 'nest', stage: 'creature', title: 'Egg Thieves', tags: ['danger'], species: 'rival',
    when: (run) => run.traits.includes('young_eggs'),
    text: 'The {them} have learned that your eggs are easy food. Each night, more go missing.',
    options: [
      { label: 'Drive them away', check: { stat: 'str', diff: 4 }, success: { text: 'They learn that your nests bite back.', dna: 2, opinion: -20, anim: 'attack' }, fail: { text: 'They are bolder than you.', pop: -1, opinion: -10 } },
      { label: 'Lay twice as many', req: { food: 3 }, result: { text: 'They cannot eat them all.', food: -3, pop: 2, anim: 'grow' } },
      { label: 'Fake nests to fool them', check: { stat: 'cun', diff: 4 }, success: { text: 'They waste their nights on empty holes.', dna: 3, trait: 'cautious' }, fail: { text: 'They find the real ones.', pop: -2 } },
    ],
  },
  {
    id: 'carried_young', stage: 'creature', title: 'Heavy with Young', tags: ['growth'],
    when: (run) => run.traits.includes('young_live'),
    text: 'Many of your {herd} carry young inside them. They are slow, hungry and precious.',
    options: [
      { label: 'Rest and feed them', req: { food: 2 }, result: { text: 'Strong young are born, ready to follow within the hour.', food: -2, pop: 2, anim: 'rest' } },
      { label: 'Keep moving', check: { stat: 'spd', diff: 4 }, success: { text: 'You stay ahead of danger and the young are born safe.', pop: 1, dna: 2, anim: 'flee' }, fail: { text: 'The journey is too hard on them.', pop: -1 } },
      { label: 'Gather close around them', check: { stat: 'cha', diff: 3 }, success: { text: 'The whole group shields the mothers.', pop: 1, dna: 1, trait: 'social', anim: 'social' }, fail: { text: 'Squabbles break out instead.', food: -1 } },
    ],
  },
  {
    id: 'molting_season', prop: 'shore', stage: 'creature', title: 'Molting', tags: ['danger', 'growth'],
    when: (run) => run.traits.includes('skeleton_shell'),
    text: 'Your old shell has split down the back. You crawl out soft and pale, bigger than before, and helpless until the new one hardens.',
    options: [
      { label: 'Hide until you harden', check: { stat: 'cun', diff: 4 }, success: { text: 'Safe in a crevice, your new armor sets hard.', dna: 2, anim: 'rest' }, fail: { text: 'A hunter finds you while you are soft.', pop: -2 } },
      { label: 'Eat your old shell', result: { text: 'Nothing wasted. The minerals harden you faster.', food: 1, dna: 1, anim: 'eat' } },
      { label: 'Grow a thicker shell this time', req: { food: 3 }, result: { text: 'Your new shell is heavier than any before.', food: -3, trait: 'thick_skinned', anim: 'grow' } },
    ],
  },
  {
    id: 'shell_cracker', prop: 'bones', stage: 'creature', title: 'The Shell Cracker', tags: ['danger'], species: 'predator',
    when: (run) => run.traits.includes('skeleton_shell') || G.keywordCounts(run).armor >= 2,
    text: 'The {them} have learned a trick: they lift armored animals high and drop them onto the rocks.',
    options: [
      { label: 'Hold on tight', check: { stat: 'str', diff: 5 }, success: { text: 'They cannot lift you. They give up.', dna: 2, anim: 'attack' }, fail: { text: 'You hear the crack of shells on stone.', pop: -2 } },
      { label: 'Stay under cover', check: { stat: 'cun', diff: 4 }, success: { text: 'Under the bushes they cannot reach you.', dna: 2, anim: 'rest' }, fail: { text: 'They wait you out.', food: -2 } },
      { label: 'Grow too heavy to lift', req: { anyPart: ['snail_shell', 'carapace', 'segment_plates', 'chitin'] }, result: { text: 'Your armor is too heavy for them. They leave hungry.', dna: 3, opinion: -10, anim: 'rest' } },
    ],
  },
  {
    id: 'squeeze_through', prop: 'cave', stage: 'creature', title: 'Through the Crack', tags: ['explore', 'danger'], species: 'predator',
    when: (run) => run.traits.includes('skeleton_soft'),
    text: 'The {them} have cornered your {herd} against a cliff. There is only a thin crack in the rock behind you.',
    options: [
      { label: 'Squeeze through', check: { stat: 'cun', diff: 2 }, success: { text: 'With no bones to stop you, you flow through the crack like water. Beyond it is a hidden valley.', food: 3, dna: 2, anim: 'flee' }, fail: { text: 'Some of you are too slow.', pop: -1 } },
      { label: 'Fight', check: { stat: 'str', diff: 5 }, success: { text: 'They did not expect that.', dna: 2, opinion: -15, anim: 'attack' }, fail: { text: 'Soft bodies tear easily.', pop: -3 } },
    ],
  },
  {
    id: 'drying_out', prop: 'drought', stage: 'creature', habitat: 'land', title: 'Drying Out', tags: ['danger'],
    when: (run) => run.traits.includes('skeleton_soft') || G.partIds(run).includes('mucus_skin'),
    text: 'The sun is merciless. Your soft, wet bodies are losing water by the hour.',
    options: [
      { label: 'Burrow into the mud', check: { stat: 'str', diff: 3 }, success: { text: 'Cool and damp, you wait for rain.', dna: 2, anim: 'rest' }, fail: { text: 'The mud is baked hard.', pop: -2 } },
      { label: 'Only move at night', check: { stat: 'cun', diff: 3 }, success: { text: 'You become a creature of the dark.', dna: 2, trait: 'nocturnal' }, fail: { text: 'Dawn catches you in the open.', pop: -1 } },
      { label: 'Seal in your slime', req: { anyPart: ['mucus_skin', 'slime_skin'] }, result: { text: 'A crust of dried slime keeps the water in.', dna: 3, anim: 'rest' } },
    ],
  },
  {
    id: 'basking_stone', prop: 'sun', stage: 'creature', habitat: 'land', title: 'The Basking Stone', tags: ['food'],
    when: (run) => run.traits.includes('blood_cold'),
    text: 'A great flat stone soaks up the morning sun. Your cold bodies ache for its warmth.',
    options: [
      { label: 'Bask all morning', result: { text: 'Warm and quick, you hunt well all afternoon.', food: 2, anim: 'rest' } },
      { label: 'Bask, but keep watch', check: { stat: 'cun', diff: 3 }, success: { text: 'Warm and safe. A perfect day.', food: 2, dna: 2, anim: 'rest' }, fail: { text: 'A hunter finds you sleepy on the rock.', pop: -1 } },
      { label: 'Claim the stone for good', check: { stat: 'str', diff: 4 }, success: { text: 'It is your stone now. Nobody else basks here.', dna: 2, trait: 'territorial', anim: 'attack' }, fail: { text: 'Bigger baskers push you off.', food: -1 } },
    ],
  },
  {
    id: 'cold_snap', prop: 'snow', stage: 'creature', habitat: 'land', title: 'Cold Snap', tags: ['danger'],
    when: (run) => run.traits.includes('blood_cold'),
    text: 'Frost overnight. Your cold blood thickens and your legs barely move.',
    options: [
      { label: 'Sleep it off', result: { text: 'You wake slow but alive. The cold has cost you a day of feeding.', food: -2, anim: 'rest' } },
      { label: 'Dig below the frost', req: { anyPart: ['digging_claws', 'digging_forelegs'] }, result: { text: 'Underground, the earth is still warm.', dna: 2, anim: 'rest' } },
      { label: 'Huddle together', check: { stat: 'cha', diff: 3 }, success: { text: 'Shared warmth gets you all through.', dna: 2, anim: 'social' }, fail: { text: 'The ones on the outside freeze.', pop: -2 } },
    ],
  },
  {
    id: 'long_sleep', prop: 'cave', stage: 'creature', habitat: 'land', season: 'autumn', title: 'The Long Sleep', tags: ['food'],
    text: 'The days are short and the food is running out. A deep, dry cave smells safe.',
    options: [
      { label: 'Fatten up, then hibernate', req: { food: 3 }, result: { text: 'You sleep through the worst of winter.', food: -3, pop: 1, trait: 'hibernator', anim: 'rest' } },
      { label: 'Store food in the cave', check: { stat: 'cun', diff: 4 }, success: { text: 'A larder for the hard months.', food: 3, dna: 1, anim: 'eat' }, fail: { text: 'It rots before winter comes.', food: -1 } },
      { label: 'Stay awake and forage', check: { stat: 'tou', diff: 4 }, success: { text: 'Warm blood keeps you going.', food: 2, dna: 2 }, fail: { text: 'There is nothing to find.', pop: -1 } },
    ],
  },
  {
    id: 'hungry_furnace', prop: 'fruit', stage: 'creature', title: 'The Hungry Furnace', tags: ['food'],
    when: (run) => run.traits.includes('blood_warm'),
    text: 'Warm blood burns food like a fire burns wood. Your {herd} are always hungry.',
    options: [
      { label: 'Eat everything', req: { diet: ['omni', 'herb'] }, check: { stat: 'tou', diff: 3 }, success: { text: 'Bark, roots, beetles. It all goes in.', food: 3 }, fail: { text: 'Some of it should not have gone in.', pop: -1 } },
      { label: 'Hunt harder', req: { diet: ['carn', 'omni'] }, check: { stat: 'str', diff: 4 }, success: { text: 'A great kill feeds everyone.', food: 4, anim: 'attack' }, fail: { text: 'It gets away. You go to bed hungry.', food: -2 } },
      { label: 'Range further', check: { stat: 'spd', diff: 3 }, success: { text: 'New feeding grounds over the hill.', food: 3, dna: 1, anim: 'flee' }, fail: { text: 'Long walks, empty bellies.', food: -1 } },
    ],
  },
  {
    id: 'ant_mound', prop: 'dust', stage: 'creature', habitat: 'land', title: 'The Ant Mound', tags: ['food'],
    text: 'A mound taller than you, crawling with millions of biting insects. Inside, a feast.',
    options: [
      { label: 'Lick them up', req: { anyPart: ['sticky_tongue'] }, result: { text: 'Flick, flick, flick. Thousands of them.', food: 4, dna: 1, anim: 'eat' } },
      { label: 'Tear it open', req: { anyPart: ['digging_claws', 'digging_forelegs', 'sharp_claws'] }, result: { text: 'The mound spills open. A banquet.', food: 3, dna: 2, anim: 'attack' } },
      { label: 'Rush in and grab what you can', check: { stat: 'tou', diff: 4 }, success: { text: 'Bitten all over, but well fed.', food: 2 }, fail: { text: 'The swarm drives you off.', pop: -1 } },
      { label: 'Leave it alone', result: { text: 'Not worth the bites.', anim: 'rest' } },
    ],
  },
  {
    id: 'silk_lines', prop: 'tree', stage: 'creature', habitat: 'land', title: 'Silk in the Grass', tags: ['explore'],
    text: 'At dawn, the meadow shines with silver threads. Something has been spinning in the night.',
    options: [
      { label: 'Spin your own', req: { anyPart: ['spinneret'] }, result: { text: 'Your traps catch more than theirs.', food: 3, dna: 2, anim: 'eat' } },
      { label: 'Follow the threads', check: { stat: 'cun', diff: 4 }, success: { text: 'You find the spinner, and its stolen food.', food: 2, dna: 2 }, fail: { text: 'You blunder into a web.', pop: -1 } },
      { label: 'Tear them down', check: { stat: 'str', diff: 2 }, success: { text: 'You clear the meadow.', dna: 1, anim: 'attack' }, fail: { text: 'Sticky everywhere.', food: -1 } },
    ],
  },
  {
    id: 'showing_off_feathers', prop: 'hearts', stage: 'creature', habitat: 'land', title: 'A Fine Display', tags: ['social'],
    when: (run) => G.partIds(run).some((id) => ['down_feathers', 'tail_feathers', 'bright_plumage', 'true_plumage', 'display_tail', 'display_frill'].includes(id) || (G.PART[id].from || []).some((f) => ['down_feathers', 'bright_plumage'].includes(f))),
    text: 'Mating season. The young ones strut and fan and puff themselves up.',
    options: [
      { label: 'Dance', check: { stat: 'cha', diff: 3 }, success: { text: 'The finest display wins, and the next generation is finer still.', pop: 2, dna: 2, anim: 'social' }, fail: { text: 'Lots of strutting, few chicks.', pop: 1 } },
      { label: 'Fight for mates', check: { stat: 'str', diff: 4 }, success: { text: 'The strongest win.', pop: 1, trait: 'territorial', anim: 'attack' }, fail: { text: 'Torn feathers and bruised pride.', pop: -1 } },
      { label: 'Sing together', result: { text: 'A great chorus at dusk.', dna: 2, anim: 'social' } },
    ],
  },
  {
    id: 'canopy_climb', prop: 'tree', stage: 'creature', habitat: 'land', biome: ['jungle', 'plains'], title: 'The High Branches', tags: ['explore', 'food'],
    text: 'The best fruit hangs high in the trees, far above the ground.',
    options: [
      { label: 'Climb', req: { anyPart: ['gecko_feet', 'sticky_pads', 'perching_feet', 'gripping_pads_f', 'prehensile_tail'] }, result: { text: 'You walk straight up the trunk. The canopy is yours.', food: 3, dna: 2, anim: 'eat' } },
      { label: 'Shake the tree', check: { stat: 'str', diff: 4 }, success: { text: 'Fruit rains down.', food: 3, anim: 'eat' }, fail: { text: 'The tree does not move.', food: -1 } },
      { label: 'Wait for it to fall', result: { text: 'Some does. Most is eaten by birds.', food: 1, anim: 'rest' } },
    ],
  },
  {
    id: 'burrow_world', prop: 'cave', stage: 'creature', habitat: 'land', title: 'Under the Ground', tags: ['explore'],
    text: 'The ground here is soft and full of roots, grubs and old tunnels.',
    options: [
      { label: 'Dig a warren', req: { anyPart: ['digging_claws', 'digging_forelegs'] }, result: { text: 'A maze of tunnels, safe from everything above.', pop: 2, dna: 2, anim: 'grow' } },
      { label: 'Explore the old tunnels', check: { stat: 'cun', diff: 4 }, success: { text: 'You find a sleeping larder of grubs.', food: 3, dna: 1 }, fail: { text: 'Whatever dug these is still down here.', pop: -2, anim: 'hurt' } },
      { label: 'Root for grubs', req: { diet: ['herb', 'omni'] }, result: { text: 'Roots and grubs, crunchy and filling.', food: 2, anim: 'eat' } },
    ],
  },
  {
    id: 'stampede', prop: 'dust', stage: 'creature', habitat: 'land', biome: 'plains', title: 'Stampede', tags: ['danger'], species: 'any',
    text: 'The ground shakes. A great herd of {them} thunders across the plains toward you.',
    options: [
      { label: 'Run with them', check: { stat: 'spd', diff: 4 }, success: { text: 'You run in their shadow and are safe from hunters.', dna: 2, opinion: 10, anim: 'flee' }, fail: { text: 'Some of you are trampled.', pop: -2 } },
      { label: 'Roll into a ball', req: { anyPart: ['segment_plates', 'snail_shell', 'carapace'] }, result: { text: 'They thunder over you. You barely feel it.', dna: 3, anim: 'rest' } },
      { label: 'Stand firm', check: { stat: 'tou', diff: 5 }, success: { text: 'They part around you like water around a rock.', dna: 3 }, fail: { text: 'You are knocked flat.', pop: -3 } },
    ],
  },
  {
    id: 'rattling_warning', prop: 'night', stage: 'creature', habitat: 'land', title: 'A Warning in the Grass', tags: ['danger'], species: 'predator',
    text: 'The {them} are creeping closer through the tall grass. They have not seen you yet.',
    options: [
      { label: 'Rattle and hiss', req: { anyPart: ['rattle_tail', 'warning_skin'] }, result: { text: 'They stop dead, and back slowly away.', dna: 2, opinion: -5, anim: 'attack' } },
      { label: 'Freeze and blend in', check: { stat: 'cun', diff: 4 }, success: { text: 'They walk right past.', dna: 2, anim: 'rest' }, fail: { text: 'They spot you.', pop: -2 } },
      { label: 'Drop your tail and run', req: { anyPart: ['drop_tail'] }, result: { text: 'They chase the wriggling tail. You grow a new one.', dna: 2, anim: 'flee' } },
      { label: 'Run', check: { stat: 'spd', diff: 4 }, success: { text: 'Away into the grass.', dna: 1, anim: 'flee' }, fail: { text: 'Not fast enough.', pop: -2 } },
    ],
  },
  {
    id: 'swamp_leeches', prop: 'pond', stage: 'creature', habitat: 'land', biome: 'swamp', title: 'Leeches', tags: ['danger'],
    text: 'Every time your {herd} wade through the swamp, they come out covered in leeches.',
    options: [
      { label: 'Armor up', req: { keyword: ['armor', 1] }, result: { text: 'They cannot bite through.', dna: 2 } },
      { label: 'Pick them off each other', check: { stat: 'cha', diff: 3 }, success: { text: 'Grooming becomes a habit that binds you.', dna: 2, trait: 'social', anim: 'social' }, fail: { text: 'They drain you weak.', pop: -1 } },
      { label: 'Eat them', req: { diet: ['carn', 'omni'] }, result: { text: 'Who is feeding on whom now?', food: 2, anim: 'eat' } },
    ],
  },
  {
    id: 'shore_crabs', prop: 'shore', stage: 'creature', habitat: 'land', biome: 'shore', title: 'The Crab March', tags: ['food'],
    text: 'Once a year, millions of red crabs march out of the sea to lay their eggs.',
    options: [
      { label: 'Feast', req: { diet: ['carn', 'omni'] }, check: { stat: 'str', diff: 3 }, success: { text: 'Crunchy and plentiful.', food: 4, anim: 'eat' }, fail: { text: 'Pinched. Many times.', pop: -1, food: 1 } },
      { label: 'Steal their eggs', check: { stat: 'cun', diff: 3 }, success: { text: 'An easy meal.', food: 3, dna: 1, anim: 'eat' }, fail: { text: 'The crabs fight back.', food: -1 } },
      { label: 'Watch and learn', result: { text: 'Armor, claws, eggs. You learn a lot about shells.', dna: 3, anim: 'rest' } },
    ],
  },
  {
    id: 'wildfire', prop: 'fire', stage: 'creature', habitat: 'land', title: 'Wildfire', tags: ['danger'],
    text: 'Lightning strikes the dry grass. Within moments, flames race toward your herd.',
    options: [
      { label: 'Run', check: { stat: 'spd', diff: 3 }, success: { text: 'You outrun the flames.', dna: 1 }, fail: { text: 'Not everyone makes it out.', pop: -3 } },
      { label: 'Fly above the smoke', req: { tag: 'flight' }, result: { text: 'From above, you watch the fire roll past.', dna: 2, insight: 1, anim: 'flee' } },
      { label: 'Shelter in the river', check: { stat: 'tou', diff: 2 }, success: { text: 'The water keeps you safe.', dna: 1, anim: 'rest' }, fail: { text: 'The heat is still terrible.', pop: -2 } },
      { label: 'Watch the flames', hint: 'Risky', check: { stat: 'cun', diff: 4 }, success: { text: 'You see how fire moves. One day this will matter.', dna: 3, insight: 2, trait: 'curious' }, fail: { text: 'You watched too long.', pop: -3 } },
    ],
  },
  {
    id: 'tall_trees', prop: 'tree', stage: 'creature', habitat: 'land', title: 'The Tall Forest', tags: ['explore', 'food'],
    text: 'Your herd reaches a forest where the best fruit hangs high above.',
    options: [
      { label: 'Climb', req: { tag: 'grasp' }, result: { text: 'You climb into a world of fruit and safety.', food: 4, dna: 2, anim: 'flee' } },
      { label: 'Knock it down', check: { stat: 'str', diff: 3 }, success: { text: 'Fruit rains down.', food: 4, anim: 'attack' }, fail: { text: 'All that effort for a few bruised fruit.', food: 1 } },
      { label: 'Glide from tree to tree', req: { part: 'wing_membranes' }, result: { text: 'You soar through the canopy.', food: 3, dna: 3, anim: 'flee' } },
      { label: 'Fly to the treetops', req: { tag: 'flight' }, result: { text: 'The best fruit is yours.', food: 5, anim: 'eat' } },
    ],
  },
  {
    id: 'mud_flats', prop: 'tar', stage: 'creature', habitat: 'land', title: 'Sinking Mud', tags: ['danger'], species: 'any',
    text: 'The ground gives way. Your herd is stuck in deep mud, and the {them} are watching.',
    options: [
      { label: 'Haul yourselves out', check: { stat: 'str', diff: 3 }, success: { text: 'You drag yourselves free.', dna: 2 }, fail: { text: 'Some do not get out.', pop: -2 } },
      { label: 'Wade across with webbed feet', req: { part: 'webbed_feet' }, result: { text: 'Mud is easy for you.', dna: 2, food: 2 } },
      { label: 'Call to the {them} for help', check: { stat: 'cha', diff: 4 }, success: { text: 'They help pull you free.', opinion: 25, anim: 'social' }, fail: { text: 'They walk away.', pop: -2, opinion: -5 } },
    ],
  },
  {
    id: 'cave', prop: 'cave', stage: 'creature', habitat: 'land', title: 'The Cave', tags: ['explore'],
    text: 'A storm drives your herd into a deep cave. Something has lived here before.',
    options: [
      { label: 'Make it home', check: { stat: 'tou', diff: 3 }, success: { text: 'Warm and safe. Your young thrive here.', pop: 2, anim: 'rest' }, fail: { text: 'Its owner comes back.', pop: -2 } },
      { label: 'Explore deeper', check: { stat: 'cun', diff: 3 }, success: { text: 'You find strange crystals and an underground spring.', dna: 3, insight: 1, anim: 'flee' }, fail: { text: 'You get lost in the dark for days.', food: -3 } },
    ],
  },

  {
    id: 'cliff_nests', stage: 'creature', habitat: 'land', prop: 'tree', title: 'The High Cliffs', tags: ['explore', 'danger'], species: 'predator',
    text: 'Your herd reaches tall cliffs. Ledges high above would be safe from the {them}, if you could get there.',
    options: [
      { label: 'Fly up and nest on the ledges', req: { tag: 'flight' }, result: { text: 'Your young hatch where nothing can reach them.', pop: 2, dna: 2, trait: 'cautious', anim: 'grow' } },
      { label: 'Climb', req: { tag: 'grasp' }, check: { stat: 'str', diff: 3 }, success: { text: 'A hard climb, but worth it.', pop: 1, dna: 2 }, fail: { text: 'Some fall.', pop: -2 } },
      { label: 'Shelter at the bottom', check: { stat: 'tou', diff: 3 }, success: { text: 'The cliff guards your back.', dna: 1 }, fail: { text: 'The {them} corner you.', pop: -2 } },
    ],
  },
  {
    id: 'updraft', stage: 'creature', habitat: 'land', prop: 'dust', title: 'The Great Updraft', tags: ['explore'],
    text: 'Hot wind roars up the valley walls, strong enough to lift anything with wings.',
    options: [
      { label: 'Ride the wind', req: { tag: 'flight' }, result: { text: 'You soar higher than ever and see the whole world below.', dna: 4, insight: 2, anim: 'flee', mood: 'proud' } },
      { label: 'Spread your skin flaps', req: { part: 'wing_membranes' }, check: { stat: 'spd', diff: 3 }, success: { text: 'A long, wild glide.', dna: 3 }, fail: { text: 'A hard landing.', pop: -1 } },
      { label: 'Hunker down', result: { text: 'The dust storm passes.', anim: 'rest' } },
    ],
  },

  // ----- Sea only -----
  {
    id: 'kelp_forest', prop: 'kelp', stage: 'creature', habitat: 'sea', title: 'Kelp Forest', tags: ['food'], species: 'prey',
    text: 'A swaying kelp forest rises around you, full of hiding {them}.',
    options: [
      { label: 'Graze the kelp', req: { diet: ['herb', 'omni'] }, result: { text: 'Endless food, swaying in the light.', food: 4 } },
      { label: 'Hunt in the shadows', req: { diet: ['carn', 'omni'] }, check: { stat: 'cun', diff: 3 }, success: { text: 'They never see you coming.', food: 5, opinion: -10 }, fail: { text: 'They vanish into the kelp.', food: 1 } },
      { label: 'Raise your young here', result: { text: 'A safe nursery.', pop: 1, anim: 'rest' } },
    ],
  },
  {
    id: 'whirlpool', prop: 'whirlpool', stage: 'creature', habitat: 'sea', title: 'Whirlpool', tags: ['danger'],
    text: 'The tide turns violently and a whirlpool opens beneath your pod.',
    options: [
      { label: 'Swim against it', check: { stat: 'spd', diff: 3 }, success: { text: 'You break free.', dna: 2, anim: 'flee' }, fail: { text: 'It pulls some of you under.', pop: -2 } },
      { label: 'Ride it out together', check: { stat: 'tou', diff: 3 }, success: { text: 'You hold each other and spin out the far side.', dna: 1, trait: 'social' }, fail: { text: 'You are scattered.', pop: -2 } },
    ],
  },
  {
    id: 'whale_fall', prop: 'carcass', stage: 'creature', habitat: 'sea', title: 'Whale Fall', tags: ['food'],
    text: 'Something huge has died and sunk to the seafloor near you. It will feed the deep for years.',
    options: [
      { label: 'Feast', result: { text: 'More food than you can eat.', food: 5, trait: 'scavenger', anim: 'eat' } },
      { label: 'Guard it from others', check: { stat: 'str', diff: 3 }, success: { text: 'It is yours alone.', food: 6, trait: 'territorial', anim: 'attack' }, fail: { text: 'Others drive you off.', food: 2 } },
    ],
  },
  {
    id: 'song', prop: 'notes', stage: 'creature', habitat: 'sea', title: 'A Song in the Water', tags: ['social', 'explore'], species: 'neighbor',
    text: 'Low, long sounds roll through the water. The {them} are singing to each other.',
    options: [
      { label: 'Sing back', check: { stat: 'cha', diff: 3 }, success: { text: 'They answer. Something passes between you.', opinion: 30, dna: 2, insight: 1, anim: 'social' }, fail: { text: 'Your call falls flat.', opinion: -5 } },
      { label: 'Listen closely', check: { stat: 'cun', diff: 3 }, success: { text: 'You begin to hear patterns in it.', dna: 3, insight: 1 }, fail: { text: 'It is just noise to you.', dna: 1 } },
      { label: 'Follow the song to its source', result: { text: 'It leads to rich waters.', food: 3, anim: 'flee' } },
    ],
  },
  {
    id: 'shark_pack', stage: 'creature', habitat: 'sea', title: 'Blood in the Water', tags: ['danger'], species: 'predator',
    text: 'One of you is wounded. Within minutes, {them} begin to circle.',
    options: [
      { label: 'Form a tight ring', check: { stat: 'tou', diff: 4 }, success: { text: 'They cannot find a gap.', dna: 2, trait: 'social' }, fail: { text: 'They break through.', pop: -3 } },
      { label: 'Dive deep', check: { stat: 'spd', diff: 3 }, success: { text: 'You leave them in the dark.', dna: 2, anim: 'flee' }, fail: { text: 'They follow you down.', pop: -2 } },
      { label: 'Ink and flash', req: { keyword: ['glow', 1] }, result: { text: 'A burst of light blinds them.', dna: 3, anim: 'mutate' } },
    ],
  },
  {
    id: 'tide_pools', stage: 'creature', habitat: 'sea', title: 'The Tide Pools', tags: ['explore'],
    text: 'At low tide, some of your young are stranded in rock pools near the shore. They seem to be fine out of the water.',
    options: [
      { label: 'Let them explore the shore', check: { stat: 'tou', diff: 3 }, success: { text: 'They come back with strange new habits.', dna: 3, insight: 1, trait: 'curious' }, fail: { text: 'The sun takes them.', pop: -1 } },
      { label: 'Call them home', result: { text: 'The sea is your home.', pop: 1, anim: 'social' } },
    ],
  },

  // ----- Age of Giants (era 2+) -----
  {
    id: 'apex_hunter', stage: 'creature', era: 2, title: 'The Apex', tags: ['danger'], species: 'predator',
    text: 'A {them} as big as a hill has claimed your range. Everything goes quiet when it moves.',
    options: [
      { label: 'Hold firm', check: { stat: 'tou', diff: 5 }, success: { text: 'It finds you too much trouble.', dna: 4, trait: 'territorial' }, fail: { text: 'It feeds on your {herd} for days.', pop: -3 } },
      { label: 'Gang up on it', check: { stat: 'str', diff: 5 }, success: { text: 'It falls. You feast for weeks.', food: 8, dna: 4, opinion: -40, trait: 'feared' }, fail: { text: 'It was not hungry enough to give up.', pop: -4 } },
      { label: 'Stay out of its way', check: { stat: 'cun', diff: 3 }, success: { text: 'You learn its habits and avoid them.', dna: 2 }, fail: { text: 'You guess wrong.', pop: -2 } },
    ],
  },
  {
    id: 'great_migration', prop: 'dust', stage: 'creature', era: 2, title: 'The Great Migration', tags: ['explore', 'food'], species: 'prey',
    text: 'Countless {them} are on the move, heading across the world. Your herd watches them pass.',
    options: [
      { label: 'Join the migration', check: { stat: 'spd', diff: 4 }, success: { text: 'You travel the world and see wonders.', dna: 4, food: 3, trait: 'migratory', anim: 'flee' }, fail: { text: 'The long road takes its toll.', pop: -2 } },
      { label: 'Hunt the stragglers', req: { diet: ['carn', 'omni'] }, check: { stat: 'str', diff: 3 }, success: { text: 'The weak and old feed you well.', food: 6, opinion: -10 }, fail: { text: 'The herd protects its own.', pop: -1 } },
      { label: 'Stay home', result: { text: 'The grounds are quiet and full of food after they leave.', food: 3, anim: 'rest' } },
    ],
  },
  {
    id: 'new_arrivals', stage: 'creature', era: 2, title: 'Strangers', tags: ['social'], species: 'neighbor', repeat: true, weight: 0.8,
    text: 'The {them} have grown bolder. They follow you now, curious about what you do.',
    options: [
      { label: 'Teach them your tricks', check: { stat: 'cha', diff: 4 }, success: { text: 'They become like family.', opinion: 30, insight: 1, anim: 'social' }, fail: { text: 'They do not understand.', opinion: -5 } },
      { label: 'Use them as lookouts', check: { stat: 'cun', diff: 4 }, success: { text: 'They warn you of danger without knowing it.', dna: 2, trait: 'cautious' }, fail: { text: 'They wander off.', opinion: -5 } },
      { label: 'Chase them away', result: { text: 'They scatter.', opinion: -20, anim: 'attack' } },
    ],
  },

  // ----- Dawn of Mind (era 3) -----
  {
    id: 'clever_young', prop: 'stick', stage: 'creature', era: 3, title: 'A Clever Youngster', tags: ['explore'],
    text: 'One of your young is solving puzzles nobody taught it: cracking shells with stones, reaching food nobody else can get to.',
    options: [
      { label: 'Let the others copy it', check: { stat: 'cun', diff: 4 }, success: { text: 'Soon everyone is doing it.', insight: 4, dna: 2 }, fail: { text: 'The others do not get it.', insight: 1 } },
      { label: 'Make it a leader', check: { stat: 'cha', diff: 4 }, success: { text: 'The {herd} follows it, and grows wiser.', insight: 3, trait: 'social', anim: 'social' }, fail: { text: 'The old leaders push it out.', pop: -1 } },
    ],
  },
  {
    id: 'stick_tool', habitat: 'land', prop: 'stick', stage: 'creature', era: 3, title: 'A Curious Stick', tags: ['explore', 'food'],
    text: 'One of your kind picks up a stick and pokes it into an insect nest. It comes out covered in food.',
    options: [
      { label: 'Pass it on', req: { tag: 'grasp' }, result: { text: 'Soon everyone fishes for insects.', food: 3, insight: 3, anim: 'eat' } },
      { label: 'Just a stick', result: { text: 'It drops it and moves on.', food: 1, anim: 'rest' } },
    ],
  },
  {
    id: 'mourning', prop: 'bones', stage: 'creature', era: 3, title: 'Mourning', tags: ['social'],
    text: 'An old matriarch has died. The herd will not leave her body. They stand around her, silent.',
    options: [
      { label: 'Stay with her', result: { text: 'Something new is born in your kind: remembering those who are gone.', insight: 3, pop: -1, anim: 'rest' } },
      { label: 'Move on', result: { text: 'Life goes on.', food: 2, anim: 'flee' } },
    ],
  },
  {
    id: 'shared_signs', prop: 'notes', stage: 'creature', era: 3, title: 'Signs and Signals', tags: ['social'], species: 'neighbor',
    text: 'Your kind has begun to make the same sounds for the same things. Even the {them} seem to understand some of them.',
    options: [
      { label: 'Speak to the {them}', check: { stat: 'cha', diff: 5 }, success: { text: 'You understand each other, a little.', opinion: 40, insight: 3, anim: 'social' }, fail: { text: 'Confusion, then fear.', opinion: -15 } },
      { label: 'Keep the signs secret', check: { stat: 'cun', diff: 4 }, success: { text: 'A language only your kind knows.', insight: 3 }, fail: { text: 'The signs fade.', insight: 1 } },
    ],
  },
  {
    id: 'hostile_raid', prop: 'dust', stage: 'creature', title: 'The {them} Attack', tags: ['danger'], species: 'hostile', repeat: true, weight: 3,
    text: 'The {them} have not forgotten. They charge into your territory at dawn.',
    options: [
      { label: 'Hold the line', check: { stat: 'tou', diff: 4 }, success: { text: 'They break against you and retreat.', dna: 2, opinion: 10 }, fail: { text: 'They trample your nests.', pop: -3 } },
      { label: 'Counterattack', check: { stat: 'str', diff: 4 }, success: { text: 'You chase them far away. They will think twice.', dna: 3, food: 3, opinion: 20, anim: 'attack' }, fail: { text: 'You chase them into an ambush.', pop: -3, opinion: -10 } },
      { label: 'Offer food as tribute', req: { food: 4 }, result: { text: 'They take it and leave you in peace.', food: -4, opinion: 35, anim: 'social' } },
    ],
  },
  {
    id: 'joint_hunt', stage: 'creature', title: 'A Joint Hunt', tags: ['hunt', 'social'], species: 'allied', repeat: true, weight: 2,
    text: 'Your friends the {them} have found a huge beast and want your help bringing it down.',
    options: [
      { label: 'Join the hunt', check: { stat: 'str', diff: 3 }, success: { text: 'A feast for both species.', food: 5, opinion: 10, trait: 'pack_hunter', anim: 'attack' }, fail: { text: 'The beast escapes. Nobody blames you.', pop: -1 } },
      { label: 'Plan the hunt', check: { stat: 'cun', diff: 4 }, success: { text: 'Your plan works perfectly.', food: 5, dna: 2, insight: 1, opinion: 15 }, fail: { text: 'A bad plan. The {them} lose some of their own.', opinion: -20 } },
      { label: 'Decline politely', result: { text: 'They hunt without you.', opinion: -5, anim: 'rest' } },
    ],
  },

  // ----- Creature milestones and finale -----
  {
    id: 'the_frame', stage: 'creature', milestone: true, title: 'The Frame',
    text: 'Your body needs something to hold it together as it grows. Every lineage finds its own answer.',
    options: [
      { label: 'Bones on the inside', hint: 'Inner Skeleton: flexible, and only it can carry a giant', result: { text: 'A skeleton of bone grows inside you.', trait: 'skeleton_inner', anim: 'grow' } },
      { label: 'Armor on the outside', hint: 'Outer Shell: +2 TOU, −2 SPD. Cheap extra legs, but you must molt, and no giants on land', result: { text: 'A hard shell grows over you, like an insect or a crab.', trait: 'skeleton_shell', anim: 'grow' } },
      { label: 'No skeleton at all', hint: 'Soft Body: +2 CUN, −2 TOU, hunters strike less often', result: { text: 'You stay soft and boneless, like an octopus or a worm.', trait: 'skeleton_soft', anim: 'grow' } },
    ],
  },
  {
    id: 'the_young', stage: 'creature', milestone: true, title: 'The Next Generation',
    text: 'How will your kind bring new life into the world?',
    options: [
      { label: 'Give birth to live young', hint: 'Live Young: +1 TOU, +1 CHA, but at most 1 birth a turn', result: { text: 'Few babies, but well protected.', trait: 'young_live', anim: 'social' } },
      { label: 'Lay eggs', hint: 'Eggs: twice the births, +1 max Population, but eggs can be stolen', result: { text: 'Clutches of eggs, laid in hidden places.', trait: 'young_eggs', anim: 'grow' } },
      { label: 'Bud new members off your body', hint: 'Budding: +1 Population a turn, −1 CHA. Radial or no-symmetry bodies only', req: { budding: true }, result: { text: 'Little copies of you grow and break away.', trait: 'young_budding', anim: 'grow' } },
    ],
  },
  {
    id: 'the_blood', stage: 'creature', milestone: true, title: 'Warm or Cold',
    text: 'Some creatures make their own heat. Others borrow it from the sun.',
    options: [
      { label: 'Make your own heat', hint: 'Warm Blood: +1 SPD, cold seasons cost no food, but eat 1 more', result: { text: 'You burn warm from the inside.', trait: 'blood_warm', anim: 'grow' } },
      { label: 'Borrow heat from the world', hint: 'Cold Blood: eat 1 less, slow in the cold, quick in the heat', result: { text: 'You bask, and you save your strength.', trait: 'blood_cold', anim: 'rest' } },
    ],
  },
  {
    id: 'age_of_giants', stage: 'creature', milestone: true, title: 'The Age of Giants',
    text: 'The world has filled with life, and some of it has grown enormous. Every lineage faces the same question: grow huge, or stay small and many?',
    options: [
      { label: 'Grow into giants', hint: 'Giant: +2 STR, +2 TOU, +2 max Pop, −1 SPD, eat 2 more', result: { text: 'Generation by generation, your kind grows. Everything makes way for you.', trait: 'giant', anim: 'grow' } },
      { label: 'Stay mid-sized', hint: 'Mid-sized: +1 STR, +1 TOU', result: { text: 'Big enough to fight, small enough to hide.', trait: 'mid_sized', anim: 'grow' } },
      { label: 'Stay small and many', hint: 'Small: +2 SPD, +1 CUN, grow faster, eat 1 less', result: { text: 'Your kind becomes quick, clever and everywhere.', trait: 'small_many', anim: 'flee' } },
    ],
  },
  {
    id: 'spark_of_mind', prop: 'sparks', stage: 'creature', milestone: true, title: 'The Spark of Mind',
    text: 'Something has changed behind your eyes. Your kind has begun to wonder. Now you will earn Insight every turn and can research the Mind tree, like culture innovations.',
    options: [
      { label: 'Wonder about the world', hint: '+1 Insight per turn', result: { text: 'Every question leads to another.', trait: 'inquisitive', anim: 'mutate' } },
      { label: 'Wonder about each other', hint: '+1 CHA, grow faster', result: { text: 'You begin to think as "we".', trait: 'cooperative', anim: 'social' } },
      { label: 'Wonder how to win', hint: '+1 CUN, better hunts', result: { text: 'You begin to plan.', trait: 'calculating', anim: 'attack' } },
    ],
  },




  // ======================= MORE EVENTS =======================
  // ----- Cell -----
  {
    id: 'biofilm', stage: 'cell', prop: 'bloom', title: 'The Biofilm', tags: ['social'], species: 'neighbor',
    text: 'The {them} have spread into a slimy mat across a rock, thousands of them stuck together. There seems to be room for more.',
    options: [
      { label: 'Join the mat', check: { stat: 'cha', diff: 2 }, success: { text: 'Safe, warm and well fed among strangers.', pop: 2, opinion: 30, trait: 'social', anim: 'social' }, fail: { text: 'They squeeze you out.', opinion: -10 } },
      { label: 'Graze the edges', req: { diet: ['herb', 'omni', 'carn'] }, check: { stat: 'cun', diff: 2 }, success: { text: 'You nibble where they will not notice.', food: 3 }, fail: { text: 'They notice.', opinion: -20, food: 1 } },
      { label: 'Drift on', result: { text: 'Not your kind of crowd.', dna: 1, anim: 'flee' } },
    ],
  },
  {
    id: 'uv_storm', stage: 'cell', prop: 'sun', title: 'Burning Light', tags: ['danger'],
    text: 'The water above you thins and harsh light pours in. It burns, and it changes things.',
    options: [
      { label: 'Dive for shade', check: { stat: 'spd', diff: 2 }, success: { text: 'You reach the dark in time.', dna: 1, anim: 'flee' }, fail: { text: 'Too slow. Some of you are scorched.', pop: -2 } },
      { label: 'Soak it up', hint: 'Random mutation', check: { stat: 'tou', diff: 3 }, success: { text: 'The light rewrites you and you survive it.', randomPart: true, dna: 2 }, fail: { text: 'It rewrites you, and it hurts.', randomPart: true, pop: -2 } },
      { label: 'Feed your algae', req: { keyword: ['symbiont', 1] }, result: { text: 'Your passengers love it.', food: 4, anim: 'eat' } },
    ],
  },
  {
    id: 'sleeping_hunter', stage: 'cell', prop: 'ice', title: 'The Sleeping Hunter', tags: ['hunt'], species: 'predator',
    text: 'A {them} has walled itself into a hard cyst to wait out the cold. It cannot move.',
    options: [
      { label: 'Crack it open and eat it', req: { diet: ['carn', 'omni'] }, check: { stat: 'str', diff: 3 }, success: { text: 'Revenge tastes good.', food: 5, opinion: -30, anim: 'attack' }, fail: { text: 'The shell is too hard.', food: -1 } },
      { label: 'Lay your young beside it', result: { text: 'Nothing else will come near while it sleeps.', pop: 1, anim: 'grow' } },
      { label: 'Leave it be', result: { text: 'It will remember that you spared it.', opinion: 20, anim: 'rest' } },
    ],
  },
  {
    id: 'gene_swap', stage: 'cell', prop: 'molecule', title: 'Trading Genes', tags: ['social', 'explore'], species: 'neighbor',
    text: 'A {them} presses against your membrane and offers you a loop of its genes. It wants one of yours in return.',
    options: [
      { label: 'Trade', hint: 'Random mutation', result: { text: 'You come away with something new.', randomPart: true, opinion: 25 } },
      { label: 'Take without giving', check: { stat: 'cun', diff: 3 }, success: { text: 'A free gift.', randomPart: true, opinion: -30 }, fail: { text: 'It pulls away, offended.', opinion: -20 } },
      { label: 'Refuse', result: { text: 'Your genes are your own.', dna: 1, anim: 'rest' } },
    ],
  },
  {
    id: 'arm_lost', stage: 'any', prop: 'shadow', title: 'Torn Away', tags: ['danger'], species: 'predator',
    when: (run) => G.symmetry(run) === 'radial' && run.multicellular,
    text: 'A {them} tears off part of your body and swims away with it.',
    options: [
      { label: 'Regrow it', req: { symmetry: 'radial' }, result: { text: 'Bodies like yours grow back. The torn piece grows into a whole new one of you.', pop: 2, dna: 2, anim: 'grow', mood: 'proud' } },
      { label: 'Chase it', check: { stat: 'spd', diff: 4 }, success: { text: 'You take back what is yours.', food: 2, opinion: -15 }, fail: { text: 'It is gone.', pop: -1 } },
    ],
  },

  // ----- Creature (both habitats) -----
  {
    id: 'egg_thief', stage: 'creature', prop: 'nest', title: 'Egg Thief', tags: ['danger'], species: 'rival',
    text: 'A {them} is sneaking toward your {nests} while your {herd} feeds.',
    options: [
      { label: 'Chase it off', check: { stat: 'spd', diff: 3 }, success: { text: 'It drops the egg and runs.', dna: 1, opinion: -10 }, fail: { text: 'It gets away with two eggs.', pop: -1 } },
      { label: 'Lie in wait in the {cover}', req: { serpent: true }, result: { text: 'It never sees you coming. One strike and it is over.', food: 4, opinion: -25, anim: 'attack', mood: 'proud' } },
      { label: 'Guard the nests in shifts', check: { stat: 'cha', diff: 3 }, success: { text: 'Your {herd} works together.', trait: 'social' }, fail: { text: 'Nobody wants the night shift.', pop: -1 } },
    ],
  },
  {
    id: 'molting', stage: 'creature', title: 'Molting Season', tags: ['danger'], prop: 'bubbles',
    text: 'Your kind sheds its old skin. For a few days you are soft and helpless.',
    options: [
      { label: 'Hide until you harden', check: { stat: 'cun', diff: 3 }, success: { text: 'Nobody finds you.', dna: 2, anim: 'rest' }, fail: { text: 'A hunter finds you soft.', pop: -2 } },
      { label: 'Push through it', check: { stat: 'tou', diff: 3 }, success: { text: 'You come out tougher.', trait: 'resilient', anim: 'grow' }, fail: { text: 'Some do not make it.', pop: -2 } },
      { label: 'Shed in one long piece', req: { serpent: true }, result: { text: 'A clean, quick shed. The old skin even fools a predator.', dna: 3, anim: 'grow' } },
    ],
  },
  {
    id: 'stampede', stage: 'creature', prop: 'dust', title: 'Stampede', tags: ['danger'], species: 'prey',
    text: 'Something has panicked the {them}. Hundreds of them are rushing straight at you.',
    options: [
      { label: 'Go with the flow', check: { stat: 'spd', diff: 3 }, success: { text: 'You keep pace until they tire.', dna: 2, anim: 'flee' }, fail: { text: 'You are trampled.', pop: -3 } },
      { label: 'Scuttle aside on all your legs', req: { manyLegs: true }, result: { text: 'Dozens of legs carry you clear in a blink.', dna: 2, food: 3, anim: 'flee', mood: 'proud' } },
      { label: 'Hold firm', check: { stat: 'tou', diff: 4 }, success: { text: 'They part around you like water around a rock.', food: 4, trait: 'territorial' }, fail: { text: 'They do not part.', pop: -3 } },
    ],
  },
  {
    id: 'alliance_call', stage: 'creature', prop: 'notes', title: 'A Call for Allies', tags: ['social'], species: 'neighbor',
    text: 'The {them} are tired of losing young to predators. They ask your kind to stand with them.',
    options: [
      { label: 'Stand with them', result: { text: 'Two herds watching together see everything.', opinion: 40, anim: 'social' } },
      { label: 'Ask what they will give you', check: { stat: 'cun', diff: 3 }, success: { text: 'They bring you food as thanks.', opinion: 20, food: 4 }, fail: { text: 'They think you greedy.', opinion: -15 } },
      { label: 'Refuse', result: { text: 'Every herd for itself.', opinion: -20, anim: 'rest' } },
    ],
  },
  {
    id: 'scent_marking', stage: 'creature', title: 'Scent Lines', tags: ['social', 'danger'], species: 'rival', prop: 'dust',
    text: 'The {them} have marked a line of scent right through your feeding grounds.',
    options: [
      { label: 'Mark over it', check: { stat: 'cha', diff: 3 }, success: { text: 'Your scent wins. They back off.', food: 2, opinion: -10, trait: 'territorial' }, fail: { text: 'They ignore it.', food: -2 } },
      { label: 'Cross it anyway', check: { stat: 'str', diff: 3 }, success: { text: 'Nobody stops you.', food: 3, opinion: -20, anim: 'attack' }, fail: { text: 'They do stop you.', pop: -2, opinion: -20 } },
      { label: 'Agree to share', result: { text: 'An uneasy border.', opinion: 25, food: -1, anim: 'social' } },
    ],
  },
  {
    id: 'footprints', habitat: 'land', stage: 'creature', era: 2, prop: 'bones', title: 'Giant Footprints', tags: ['explore'],
    text: 'Footprints bigger than your whole herd lead off into the mist.',
    options: [
      { label: 'Follow them', check: { stat: 'cun', diff: 4 }, success: { text: 'They lead to a feeding ground the giants have trampled open.', food: 5, dna: 2 }, fail: { text: 'They lead to the giant.', pop: -2 } },
      { label: 'Go the other way', result: { text: 'Wise.', dna: 1, anim: 'flee' } },
      { label: 'Follow them, being huge yourself', req: { size: 'giant' }, result: { text: 'Another giant. You size each other up and part peacefully.', dna: 3, insight: 1, mood: 'proud' } },
    ],
  },
  {
    id: 'under_leaves', habitat: 'land', stage: 'creature', title: 'Under the Leaves', tags: ['food', 'danger'], species: 'predator',
    when: (run) => G.sizeOf(run) === 'small',
    text: 'A {them} prowls overhead. Your tiny kind is hiding in the leaf litter, where there is plenty to eat.',
    options: [
      { label: 'Feed quietly', check: { stat: 'cun', diff: 3 }, success: { text: 'You eat your fill right under its nose.', food: 4, anim: 'eat' }, fail: { text: 'It hears you.', pop: -2 } },
      { label: 'Scatter in every direction', result: { text: 'It cannot chase all of you.', pop: -1, dna: 2, anim: 'flee' } },
    ],
  },
  {
    id: 'budding', stage: 'creature', title: 'Budding Off', tags: ['social'],
    when: (run) => G.symmetry(run) === 'colonial',
    text: 'A great lump of your colony has started to pull away, growing its own will.',
    options: [
      { label: 'Let it go free', result: { text: 'It oozes off to start its own lineage. It will always be friendly to you.', pop: -2, dna: 4, anim: 'grow' } },
      { label: 'Hold yourself together', check: { stat: 'cha', diff: 3 }, success: { text: 'The colony stays one.', trait: 'social' }, fail: { text: 'It tears away anyway.', pop: -3 } },
    ],
  },
  {
    id: 'burrow', stage: 'creature', habitat: 'land', title: 'An Empty Burrow', tags: ['explore'], prop: 'cave',
    text: 'You find a long, winding burrow. Whatever dug it is gone.',
    options: [
      { label: 'Slither in and make it home', req: { serpent: true }, result: { text: 'A perfect fit. Your young are safe underground.', pop: 2, trait: 'cautious', anim: 'rest' } },
      { label: 'Dig it bigger', req: { part: 'digging_forelegs' }, result: { text: 'Now it fits your whole herd.', pop: 1, dna: 2 } },
      { label: 'Peer inside', check: { stat: 'cun', diff: 3 }, success: { text: 'Old food stores, still good.', food: 4 }, fail: { text: 'Something still lives here after all.', pop: -1 } },
    ],
  },
  {
    id: 'ancient_tree', stage: 'creature', habitat: 'land', prop: 'fruit', title: 'The Ancient Tree', tags: ['food', 'explore'],
    text: 'A tree older than any memory stands alone, heavy with strange fruit and humming with insects.',
    options: [
      { label: 'Climb it', req: { tag: 'grasp' }, result: { text: 'You eat at the top of the world.', food: 4, dna: 2, anim: 'eat' } },
      { label: 'Shake it', check: { stat: 'str', diff: 3 }, success: { text: 'Fruit everywhere.', food: 4, anim: 'attack' }, fail: { text: 'A swarm of angry insects.', pop: -1 } },
      { label: 'Wrap around the trunk and climb', req: { serpent: true }, result: { text: 'Coil by coil, you reach the top.', food: 4, dna: 1, anim: 'eat' } },
    ],
  },
  {
    id: 'salt_lick', stage: 'creature', habitat: 'land', title: 'The Salt Lick', tags: ['social', 'food'], species: 'any', prop: 'dust',
    text: 'Every species in the valley gathers at a crust of salt by the river, even the {them}. An uneasy truce holds.',
    options: [
      { label: 'Keep the truce', result: { text: 'You lick salt side by side with old enemies.', pop: 1, opinion: 15, anim: 'social' } },
      { label: 'Break the truce', check: { stat: 'str', diff: 4 }, success: { text: 'You take the salt and a meal besides.', food: 5, opinion: -40, trait: 'feared', anim: 'attack' }, fail: { text: 'Everyone turns on you.', pop: -3, opinion: -30 } },
    ],
  },
  {
    id: 'storm', stage: 'creature', habitat: 'land', prop: 'night', title: 'The Great Storm', tags: ['danger'],
    text: 'The sky turns black. Wind tears at the grass and lightning splits the night.',
    options: [
      { label: 'Huddle together', check: { stat: 'cha', diff: 3 }, success: { text: 'Warm and safe in a heap.', trait: 'social', anim: 'rest' }, fail: { text: 'The herd scatters in panic.', pop: -2 } },
      { label: 'Ride out the wind low to the ground', req: { serpent: true }, result: { text: 'The wind passes right over you.', dna: 2, anim: 'rest' } },
      { label: 'Shelter in the trees', check: { stat: 'cun', diff: 3 }, success: { text: 'Good thinking.', dna: 2 }, fail: { text: 'Lightning loves tall trees.', pop: -3 } },
    ],
  },

  // ----- Sea -----
  {
    id: 'coral_spawning', stage: 'creature', habitat: 'sea', prop: 'bubbles', title: 'The Spawning Moon', tags: ['social', 'food'],
    text: 'Under the full moon, the whole reef releases clouds of eggs at once. The water turns to snow.',
    options: [
      { label: 'Spawn with them', result: { text: 'A huge new generation.', pop: 3, anim: 'social' } },
      { label: 'Feast on the eggs', req: { diet: ['carn', 'omni'] }, result: { text: 'More food than you can eat.', food: 6, anim: 'eat' } },
    ],
  },
  {
    id: 'deep_trench', stage: 'creature', habitat: 'sea', prop: 'night', title: 'The Trench', tags: ['explore', 'danger'],
    text: 'The seafloor drops away into a trench so deep that no light reaches the bottom.',
    options: [
      { label: 'Dive', check: { stat: 'tou', diff: 4 }, success: { text: 'At the bottom: strange life, and stranger ideas.', dna: 4, insight: 2, trait: 'curious' }, fail: { text: 'The pressure is too much.', pop: -3 } },
      { label: 'Light the way', req: { keyword: ['glow', 1] }, result: { text: 'Your own glow guides you down and back.', dna: 4, anim: 'mutate' } },
      { label: 'Stay in the light', result: { text: 'Some things should stay hidden.', anim: 'rest' } },
    ],
  },
  {
    id: 'jelly_bloom', stage: 'creature', habitat: 'sea', prop: 'swarm', title: 'Jellyfish Bloom', tags: ['danger', 'food'],
    text: 'The water fills with drifting jellyfish, stinging everything that touches them.',
    options: [
      { label: 'Swim through', check: { stat: 'tou', diff: 3 }, success: { text: 'A few stings, nothing worse.', dna: 1 }, fail: { text: 'The stings add up.', pop: -2 } },
      { label: 'Drift among them as one of their own', req: { symmetry: 'radial' }, result: { text: 'They take you for kin. You feed in their shelter.', food: 4, dna: 2, anim: 'social' } },
      { label: 'Eat them', req: { diet: ['carn', 'omni'] }, check: { stat: 'tou', diff: 2 }, success: { text: 'Crunchy and plentiful.', food: 5, anim: 'eat' }, fail: { text: 'Mouthfuls of stings.', pop: -1, food: 2 } },
    ],
  },

  // ======================= ANY STAGE =======================
  {
    id: 'mutation_burst', prop: 'stars', stage: 'any', title: 'Mutation Burst', repeat: true, weight: 0.6, tags: ['explore'],
    text: 'Cosmic radiation scrambles part of your genetic code.',
    options: [
      { label: 'Embrace the change', hint: 'Random mutation', result: { text: 'Something new grows.', randomPart: true } },
      { label: 'Repair the damage', check: { stat: 'tou', diff: 2 }, success: { text: 'Your code holds steady.', dna: 2 }, fail: { text: 'The repair is painful.', pop: -1, dna: 1 } },
    ],
  },
  {
    id: 'quiet_time', stage: 'any', title: 'A Quiet Time', repeat: true, weight: 0.4,
    text: 'Nothing much happens. Your kind eats, rests and grows.',
    options: [
      { label: 'Rest', result: { text: 'A good rest.', pop: 1, anim: 'rest' } },
      { label: 'Gather', result: { text: 'Something extra for later.', food: 2, anim: 'eat' } },
      { label: 'Wander', result: { text: 'New places, new ideas.', dna: 1, anim: 'flee' } },
    ],
  },
  // ======================= THE DEEP (sea events) =======================
  {
    id: 'cleaning_station', stage: 'creature', habitat: 'sea', zones: ['reef'], prop: 'coral', title: 'The Cleaning Station', tags: ['social'], species: 'neighbor', repeat: true,
    text: 'On the reef there is a rock where tiny {them} clean anyone who waits politely. Today there is a queue.',
    options: [
      { label: 'Wait your turn', check: { stat: 'cha', diff: 3 }, success: { text: 'You leave spotless and healthy. The {them} remember good manners.', pop: 2, opinion: 20, anim: 'social' }, fail: { text: 'A grouper pushes in and you give up.', opinion: -5 } },
      { label: 'Eat the cleaners', req: { diet: ['carn', 'omni'] }, result: { text: 'Every creature on the reef saw that.', food: 3, opinion: -40, anim: 'eat' } },
      { label: 'Open your own station', req: { anyPart: ['cleaner_skin', 'anemone_crown'] }, result: { text: 'Now they queue for you.', food: 2, dna: 2, opinion: 25, trait: 'social', anim: 'social' } },
    ],
  },
  {
    id: 'empty_shell', stage: 'creature', habitat: 'sea', prop: 'bones', title: 'The Empty Shell', tags: ['explore'],
    text: 'A huge, empty shell lies on the sea floor. Whatever lived in it is long gone.',
    options: [
      { label: 'Carry it as armor', req: { tag: 'grasp' }, result: { text: 'You drag it everywhere. Hunters bounce off.', dna: 3, trait: 'resilient', mood: 'proud' } },
      { label: 'Hide inside it', check: { stat: 'cun', diff: 2 }, success: { text: 'A perfect den.', pop: 1, dna: 1, anim: 'rest' }, fail: { text: 'Something else already had the same idea.', pop: -1 } },
      { label: 'Leave it', result: { text: 'Just an old shell.', dna: 1, anim: 'rest' } },
    ],
  },
  {
    id: 'black_smokers', stage: 'creature', habitat: 'sea', zones: ['abyss'], prop: 'vent', title: 'The Black Smokers', tags: ['food', 'explore'],
    text: 'Chimneys of rock pour out black, boiling water. Around them, in the dark, is a garden of tube worms, crabs and slime.',
    options: [
      { label: 'Graze the slime mats', req: { diet: ['herb', 'omni'] }, result: { text: 'Food grown without sunlight. Strange and plentiful.', food: 4, anim: 'eat' } },
      { label: 'Hunt the tube worms', req: { diet: ['carn', 'omni'] }, check: { stat: 'spd', diff: 3 }, success: { text: 'They snap back into their tubes, but not fast enough.', food: 5 }, fail: { text: 'Every worm vanishes at once.', food: -1 } },
      { label: 'Study the heat', check: { stat: 'cun', diff: 4 }, success: { text: 'Warm water rises, cold water sinks, and life gathers where they meet.', dna: 4, trait: 'curious' }, fail: { text: 'You get too close and scald yourself.', pop: -1 } },
    ],
  },
  {
    id: 'marine_snow', stage: 'creature', habitat: 'sea', zones: ['twilight', 'abyss'], prop: 'snow', title: 'Marine Snow', tags: ['food'], repeat: true,
    text: 'Bits of dead things drift down from the bright water far above, like snow.',
    options: [
      { label: 'Sieve it from the water', req: { anyPart: ['baleen', 'feather_arms', 'krill_sieve', 'vacuum_maw', 'suction_mouth'] }, result: { text: 'A slow, steady feast.', food: 4, anim: 'eat' } },
      { label: 'Wait for it to settle', result: { text: 'Patience is how the deep eats.', food: 2, anim: 'rest' } },
      { label: 'Follow it up to its source', check: { stat: 'spd', diff: 3 }, success: { text: 'Richer water above.', food: 3, dna: 1 }, fail: { text: 'You meet what the snow was falling from.', pop: -2 } },
    ],
  },
  {
    id: 'great_rising', stage: 'creature', habitat: 'sea', zones: ['twilight'], prop: 'night', title: 'The Great Rising', tags: ['hunt', 'food'], species: 'prey',
    text: 'As night falls above, trillions of creatures rise from the dark to feed near the surface. The {them} are among them.',
    options: [
      { label: 'Rise with them', check: { stat: 'spd', diff: 3 }, success: { text: 'A night of feasting, back down before dawn.', food: 4, dna: 1 }, fail: { text: 'You are caught in the light at dawn.', pop: -2 } },
      { label: 'Lure them in the dark', req: { keyword: ['glow', 1] }, result: { text: 'They swim straight to your light.', food: 5, opinion: -15, anim: 'eat' } },
      { label: 'Stay down and wait', result: { text: 'The deep is safe, and a little hungry.', food: 1, anim: 'rest' } },
    ],
  },
  {
    id: 'storm_surge', stage: 'creature', habitat: 'sea', zones: ['shallows', 'reef'], prop: 'whirlpool', title: 'Storm Surge', tags: ['danger'],
    text: 'A storm churns the shallows. Waves smash the reef and drag everything loose out to sea.',
    options: [
      { label: 'Cling to the rocks', req: { anyPart: ['sucker_pads', 'tube_feet', 'walking_legs'] }, result: { text: 'You hold on. Everything else is swept away.', dna: 2, food: 2, mood: 'proud' } },
      { label: 'Dive deeper', check: { stat: 'spd', diff: 3 }, success: { text: 'Calm water below the storm.', dna: 1, anim: 'flee' }, fail: { text: 'The waves catch the slowest.', pop: -2 } },
      { label: 'Ride it out', check: { stat: 'tou', diff: 4 }, success: { text: 'Battered, but here.', dna: 2 }, fail: { text: 'The sea takes its share.', pop: -3 } },
    ],
  },
  {
    id: 'weed_raft', stage: 'creature', habitat: 'sea', zones: ['shallows', 'open'], prop: 'kelp', title: 'The Floating Forest', tags: ['explore'],
    text: 'A raft of floating seaweed the size of a field drifts past, full of hiding places and little creatures.',
    options: [
      { label: 'Ride it to new waters', check: { stat: 'cun', diff: 3 }, success: { text: 'Weeks later it drops you somewhere new and rich.', dna: 3, food: 2, trait: 'migratory' }, fail: { text: 'It drifts somewhere empty.', food: -2 } },
      { label: 'Hunt the hiders', req: { diet: ['carn', 'omni'] }, result: { text: 'The raft is a pantry.', food: 4, anim: 'eat' } },
      { label: 'Let it pass', result: { text: 'It drifts out of sight.', dna: 1, anim: 'rest' } },
    ],
  },
  {
    id: 'cornered', stage: 'creature', habitat: 'sea', prop: 'shadow', title: 'Cornered', tags: ['danger'], species: 'predator', repeat: true,
    text: 'One of the {them} has trapped part of your {herd} in a crack in the rocks. It waits outside.',
    options: [
      { label: 'Squirt ink and dash', req: { anyPart: ['ink_glands'] }, result: { text: 'A black cloud, and you are gone.', dna: 2, anim: 'flee', mood: 'proud' } },
      { label: 'Flash warning colors', req: { anyPart: ['color_skin', 'warning_skin'] }, check: { stat: 'cha', diff: 3 }, success: { text: 'It thinks you are poisonous and leaves.', dna: 2, opinion: -5 }, fail: { text: 'It is not fooled.', pop: -2 } },
      { label: 'Squeeze deeper into the crack', check: { stat: 'cun', diff: 3 }, success: { text: 'It gives up and leaves.', dna: 1, anim: 'rest' }, fail: { text: 'The crack ends sooner than you hoped.', pop: -2 } },
      { label: 'Fight your way out', check: { stat: 'str', diff: 4 }, success: { text: 'It did not expect that.', dna: 3, opinion: -20, anim: 'attack' }, fail: { text: 'It expected exactly that.', pop: -3 } },
    ],
  },
  {
    id: 'sponge_nose', stage: 'creature', habitat: 'sea', era: 3, prop: 'stick', title: 'A Sponge on the Nose', tags: ['explore', 'food'],
    text: 'One of your kind has put a sponge over its face so it can dig in sharp rubble for food without getting hurt.',
    options: [
      { label: 'Teach the young', check: { stat: 'cun', diff: 4 }, success: { text: 'Mothers teach daughters. The trick will last a thousand generations.', insight: 4, food: 2 }, fail: { text: 'The young would rather play.', insight: 1 } },
      { label: 'Laugh at it', result: { text: 'It digs alone, and eats well.', food: 1, anim: 'rest' } },
    ],
  },
  {
    id: 'stone_and_shell', stage: 'creature', habitat: 'sea', era: 2, prop: 'stick', title: 'Stone and Shell', tags: ['explore', 'food'],
    text: 'One of your kind is floating on its back, smashing a clam against a stone held on its belly.',
    options: [
      { label: 'Pass it on', req: { tag: 'grasp' }, result: { text: 'Soon every clam on the reef is in danger.', food: 3, insight: 3, anim: 'eat' } },
      { label: 'Steal its clam', result: { text: 'Easier than learning.', food: 1, anim: 'eat' } },
    ],
  },
  {
    id: 'giant_wake', stage: 'creature', habitat: 'sea', era: 2, prop: 'current', title: 'A Giant Wake', tags: ['explore'],
    text: 'The whole sea rocks. Something enormous has just swum past, and its wake is still spreading.',
    options: [
      { label: 'Follow the wake', check: { stat: 'cun', diff: 4 }, success: { text: 'It leads to the scraps of a giant meal.', food: 5, dna: 2 }, fail: { text: 'It leads to the giant.', pop: -2 } },
      { label: 'Swim the other way', result: { text: 'Wise.', dna: 1, anim: 'flee' } },
      { label: 'Follow it, being huge yourself', req: { size: 'giant' }, result: { text: 'Another giant. You circle each other and part peacefully.', dna: 3, insight: 1, mood: 'proud' } },
    ],
  },
  {
    id: 'in_the_sand', stage: 'creature', habitat: 'sea', title: 'Under the Sand', tags: ['food', 'danger'], species: 'predator',
    when: (run) => G.sizeOf(run) === 'small',
    text: 'One of the {them} cruises overhead. Your tiny kind is buried in the sand, where there is plenty to eat.',
    options: [
      { label: 'Feed without moving', check: { stat: 'cun', diff: 3 }, success: { text: 'You eat your fill right under its nose.', food: 4, anim: 'eat' }, fail: { text: 'It feels you move.', pop: -2 } },
      { label: 'Burst out in every direction', result: { text: 'It cannot chase all of you.', pop: -1, dna: 2, anim: 'flee' } },
    ],
  },
  {
    id: 'live_wires', stage: 'creature', habitat: 'sea', prop: 'sparks', title: 'Live Wires', tags: ['danger'], species: 'rival',
    text: 'The water tingles. The {them} have learned to make electricity, and they are stunning everything near your feeding grounds.',
    options: [
      { label: 'Shock it back', req: { anyPart: ['electric_organ'] }, result: { text: 'Two storms meet. It backs off with new respect.', dna: 3, opinion: 15, mood: 'proud' } },
      { label: 'Slip past in your slime', req: { anyPart: ['slime_skin'] }, result: { text: 'The shocks slide right off you.', food: 3, dna: 1 } },
      { label: 'Keep your distance', check: { stat: 'spd', diff: 3 }, success: { text: 'You find food elsewhere.', food: 1 }, fail: { text: 'You swim too close.', pop: -2 } },
    ],
  },
  {
    id: 'long_migration', stage: 'creature', habitat: 'sea', era: 2, prop: 'current', title: 'The Long Migration', tags: ['explore'],
    text: 'A great current runs across the whole ocean. Following it would take a lifetime, and lead somewhere new.',
    options: [
      { label: 'Follow it across the ocean', check: { stat: 'tou', diff: 4 }, success: { text: 'You reach rich water no one else knows about.', dna: 5, trait: 'migratory', anim: 'flee' }, fail: { text: 'The journey is longer than you are strong.', pop: -3 } },
      { label: 'Sing the route to your young', req: { anyPart: ['echolocation', 'sonar'] }, result: { text: 'A map made of song, passed down forever.', dna: 3, insight: 2, trait: 'migratory', anim: 'social' } },
      { label: 'Stay home', result: { text: 'Home is home.', food: 1, anim: 'rest' } },
    ],
  },
  {
    id: 'reef_bleaching', stage: 'creature', habitat: 'sea', zones: ['reef'], prop: 'bones', title: 'The Reef Turns White', tags: ['danger', 'food'],
    text: 'The water has grown too warm. The coral is turning white, and the reef is starving.',
    options: [
      { label: 'Leave for open water', result: { text: 'You leave the dying reef behind.', dna: 2, zone: 'open', anim: 'flee' } },
      { label: 'Tend the reef', req: { keyword: ['symbiont', 1] }, result: { text: 'Your helpers bring the coral back to life.', food: 3, dna: 3, mood: 'proud' } },
      { label: 'Wait for it to recover', check: { stat: 'tou', diff: 4 }, success: { text: 'The coral comes back, slowly.', dna: 2 }, fail: { text: 'Lean seasons.', pop: -2, food: -2 } },
    ],
  },
  {
    id: 'red_tide', stage: 'creature', habitat: 'sea', zones: ['shallows', 'reef', 'open'], prop: 'bloom', title: 'Red Tide', tags: ['danger'],
    text: 'A bloom of poisonous algae has turned the water red. Fish are floating belly-up.',
    options: [
      { label: 'Flee to deeper water', check: { stat: 'spd', diff: 3 }, success: { text: 'You outswim the tide.', dna: 1, anim: 'flee' }, fail: { text: 'Some of you swallow too much.', pop: -2 } },
      { label: 'Eat the poison', req: { keyword: ['venom', 1] }, result: { text: 'Your body is used to poison. The dead fish are a feast.', food: 5, trait: 'toxic_affinity', anim: 'eat' } },
      { label: 'Wait it out', check: { stat: 'tou', diff: 4 }, success: { text: 'Sick, but alive.', dna: 1 }, fail: { text: 'The tide stays for weeks.', pop: -3 } },
    ],
  },
  {
    id: 'echo_caves', stage: 'creature', habitat: 'sea', prop: 'cave', title: 'The Echo Caves', tags: ['explore'],
    text: 'A maze of underwater caves, pitch black. Something inside is calling back every sound you make.',
    options: [
      { label: 'Map it with sound', req: { anyPart: ['echolocation', 'sonar', 'lateral_line'] }, result: { text: 'You see every tunnel. One leads to a hidden lagoon.', dna: 4, food: 2, insight: 1, mood: 'proud' } },
      { label: 'Feel your way in', check: { stat: 'cun', diff: 4 }, success: { text: 'A safe den, deep inside.', dna: 3, pop: 1 }, fail: { text: 'Some of you never find the way out.', pop: -2 } },
      { label: 'Stay out', result: { text: 'Some places are better left alone.', dna: 1, anim: 'rest' } },
    ],
  },
  {
    id: 'deep_dive', stage: 'creature', habitat: 'sea', zones: ['open', 'twilight'], era: 2, prop: 'night', title: 'The Deep Dive', tags: ['explore', 'danger'],
    text: 'Below you the blue turns to black. Far down, something glows.',
    options: [
      { label: 'Dive all the way down', req: { anyPart: ['pressure_skin'] }, result: { text: 'Your skin holds. A new world opens in the abyss.', dna: 4, zone: 'abyss', mood: 'proud' } },
      { label: 'Try anyway', check: { stat: 'tou', diff: 5 }, success: { text: 'You make it down and back, and you know the way now.', dna: 5 }, fail: { text: 'The pressure is too much.', pop: -3 } },
      { label: 'Turn back', result: { text: 'Not today.', dna: 1, anim: 'rest' } },
    ],
  },
  {
    id: 'stinging_home', stage: 'creature', habitat: 'sea', zones: ['reef', 'shallows'], prop: 'coral', title: 'A Stinging Home', tags: ['social'],
    text: 'A big anemone waves its stinging arms at you. Small fish live safely inside it. Could you?',
    options: [
      { label: 'Move in', check: { stat: 'tou', diff: 3 }, success: { text: 'The stings stop hurting. Now nothing can reach you.', pop: 2, trait: 'cautious', anim: 'social' }, fail: { text: 'It stings, a lot.', pop: -1 } },
      { label: 'Carry one on your back', req: { anyPart: ['anemone_crown'] }, result: { text: 'A new friend rides along.', dna: 3, food: 1, mood: 'proud' } },
      { label: 'Eat it', req: { diet: ['carn', 'omni'] }, result: { text: 'Spicy.', food: 3, anim: 'eat' } },
    ],
  },
  {
    id: 'hatchlings', stage: 'creature', habitat: 'sea', zones: ['shallows'], prop: 'shore', title: 'Hatchlings', tags: ['hunt', 'social'], species: 'prey',
    text: 'Baby {them} have hatched on the beach and are racing for the sea in their hundreds.',
    options: [
      { label: 'Feast', req: { diet: ['carn', 'omni'] }, result: { text: 'Easy food, and plenty of it.', food: 5, opinion: -15, anim: 'eat' } },
      { label: 'Guard them to deep water', check: { stat: 'cha', diff: 3 }, success: { text: 'The {them} will not forget it.', opinion: 35, dna: 2, trait: 'gentle', anim: 'social' }, fail: { text: 'Most are eaten anyway.', opinion: 5 } },
      { label: 'Watch', result: { text: 'Some make it. Most do not.', dna: 1, anim: 'rest' } },
    ],
  },
  {
    id: 'lights_in_the_dark', stage: 'creature', habitat: 'sea', zones: ['twilight', 'abyss'], prop: 'stars', title: 'Lights in the Dark', tags: ['social'], species: 'neighbor',
    text: 'Blinking lights in the black water: the {them}, signaling to each other.',
    options: [
      { label: 'Flash back', req: { keyword: ['glow', 1] }, result: { text: 'You do not share words, but you share light. A friendship begins.', opinion: 35, dna: 2, trait: 'social', anim: 'social' } },
      { label: 'Approach slowly', check: { stat: 'cha', diff: 4 }, success: { text: 'They let you join their shoal.', opinion: 20, dna: 1 }, fail: { text: 'The lights go out all at once.', opinion: -10 } },
      { label: 'Hunt the lights', req: { diet: ['carn', 'omni'] }, check: { stat: 'cun', diff: 3 }, success: { text: 'Lights are easy to follow.', food: 4, opinion: -30 }, fail: { text: 'They switch off and vanish.', food: -1 } },
    ],
  },
  {
    id: 'color_talk', stage: 'creature', habitat: 'sea', era: 2, prop: 'sparks', title: 'Talking in Color', tags: ['social', 'explore'],
    when: (run) => G.partIds(run).some((id) => ['color_skin', 'color_storm', 'vanishing_skin'].includes(id)),
    text: 'Your kind has started flashing patterns at each other: stripes for danger, spots for food, waves for come here.',
    options: [
      { label: 'Build a language of color', check: { stat: 'cun', diff: 4 }, success: { text: 'You can tell each other anything without a sound.', insight: 4, dna: 2, trait: 'cooperative' }, fail: { text: 'Everyone flashes at once and nobody understands.', insight: 1 } },
      { label: 'Use it to fool others', result: { text: 'A flash of fake danger and the others scatter from the food.', food: 3, trait: 'calculating' } },
    ],
  },
  // ======================= ARCHETYPE GIMMICKS =======================
  {
    id: 'host_fights_back', stage: 'any', title: 'The Host Fights Back', tags: ['danger'], repeat: true,
    when: (run) => !!G.hostOf(run) && G.hostOf(run).opinion < -20,
    text: 'Your host has noticed you. Its body is hunting you from the inside.',
    options: [
      { label: 'Burrow deeper', check: { stat: 'cun', diff: 3 }, success: { text: 'It cannot find you in there.', dna: 2, anim: 'rest' }, fail: { text: 'It finds some of you.', pop: -2 } },
      { label: 'Drain it harder', result: { text: 'You feed until it can barely fight.', food: 4, hostPop: -4, anim: 'eat' } },
      { label: 'Jump to the biggest species nearby', check: { stat: 'spd', diff: 3 }, success: { text: 'You slip into a fresh host.', newHost: true, dna: 1, anim: 'flee' }, fail: { text: 'Few of you make it across.', pop: -3, newHost: true } },
    ],
  },
  {
    id: 'bigger_host', stage: 'any', title: 'A Bigger Host', tags: ['explore'],
    when: (run) => G.gimmick(run) === 'parasite',
    text: 'A big, healthy species passes close by. There is room for many more of you in there.',
    options: [
      { label: 'Jump in', check: { stat: 'spd', diff: 3 }, success: { text: 'A roomy new home.', newHost: true, dna: 2, anim: 'flee' }, fail: { text: 'You miss your chance and lose some of you trying.', pop: -2 } },
      { label: 'Stay where you are', result: { text: 'Better the host you know.', dna: 1, anim: 'rest' } },
    ],
  },
  {
    id: 'partner_sick', stage: 'any', title: 'Your Partner Is Sick', tags: ['social'], repeat: true,
    when: (run) => !!G.partnerOf(run),
    text: 'A sickness is spreading through your partners. Whatever happens to them happens to you.',
    options: [
      { label: 'Share your food', req: { food: 3 }, result: { text: 'You go hungry so they can recover.', food: -3, partnerPop: 4, anim: 'social' } },
      { label: 'Heal them with your symbionts', req: { keyword: ['symbiont', 1] }, result: { text: 'Your helpers cure them.', partnerPop: 5, dna: 2, mood: 'proud' } },
      { label: 'Wait it out', check: { stat: 'tou', diff: 3 }, success: { text: 'They pull through.', dna: 1 }, fail: { text: 'Many of them die, and you feel it.', partnerPop: -5, pop: -1 } },
    ],
  },
  {
    id: 'storm_current', stage: 'any', title: 'The Storm Current', tags: ['explore', 'danger'], repeat: true,
    when: (run) => G.gimmick(run) === 'drifter',
    text: 'A wild current grabs your kind and starts pulling you away, much faster than usual.',
    options: [
      { label: 'Let it carry you', check: { stat: 'tou', diff: 3 }, success: { text: 'You tumble somewhere new, battered but excited.', drift: true, dna: 2, anim: 'flee' }, fail: { text: 'The current tears some of you apart.', drift: true, pop: -2 } },
      { label: 'Fight it', check: { stat: 'str', diff: 4 }, success: { text: 'You hold on and stay put.', dna: 2, mood: 'proud' }, fail: { text: 'It takes you anyway, and some of you with it.', drift: true, pop: -3 } },
    ],
  },
  {
    id: 'lean_hunt', stage: 'any', title: 'The Lean Hunt', tags: ['hunt', 'danger'], repeat: true,
    when: (run) => G.gimmick(run) === 'predator' && (run.hunger || 0) >= 2,
    text: 'The prey has grown wary. Your kind is hungry and getting desperate.',
    options: [
      { label: 'Go after bigger game', check: { stat: 'str', diff: 4 }, success: { text: 'A huge kill. Everyone eats.', food: 6, fed: true, anim: 'attack' }, fail: { text: 'Bigger game fights back.', pop: -2 } },
      { label: 'Scavenge', result: { text: 'Old meat, but meat.', food: 2, fed: true, trait: 'scavenger', anim: 'eat' } },
      { label: 'Eat the weakest of your own', result: { text: 'A grim meal.', pop: -1, food: 3, fed: true, mood: 'sad' } },
    ],
  },
  {
    id: 'herd_panic', stage: 'any', title: 'Panic in the Herd', tags: ['danger', 'social'], repeat: true,
    when: (run) => G.gimmick(run) === 'grazer' && run.pop >= 10,
    text: 'Something spooks one of your kind, and in a heartbeat the whole {herd} is panicking.',
    options: [
      { label: 'Calm them', check: { stat: 'cha', diff: 3 }, success: { text: 'The panic fades as fast as it came.', dna: 2, trait: 'social' }, fail: { text: 'Some are trampled in the rush.', pop: -2 } },
      { label: 'Let it run its course', result: { text: 'You end up somewhere new, and a little smaller.', pop: -1, dna: 3, anim: 'flee' } },
    ],
  },
  {
    id: 'restless_offshoot', stage: 'any', title: 'A Restless Offshoot', tags: ['social'],
    when: (run) => G.budsOf(run).length > 0,
    text: 'One of the colonies that split off from you wants to go its own way.',
    options: [
      { label: 'Let it go', result: { text: 'It will always remember where it came from.', dna: 4, budGoes: true, anim: 'social' } },
      { label: 'Pull it back in', check: { stat: 'cha', diff: 3 }, success: { text: 'It rejoins you, and you are whole again.', budBack: true, anim: 'grow' }, fail: { text: 'It refuses and leaves anyway.', budGoes: true } },
    ],
  },
  {
    id: 'disguise_slips', stage: 'any', title: 'The Disguise Slips', tags: ['danger', 'social'], repeat: true,
    when: (run) => !!G.mimicOf(run),
    text: 'One of the creatures you are imitating looks at you a little too long.',
    options: [
      { label: 'Bluff', check: { stat: 'cha', diff: 4 }, success: { text: 'It shrugs and moves on.', dna: 2, mood: 'proud' }, fail: { text: 'It raises the alarm. Your disguise is ruined.', unmask: true, pop: -2 } },
      { label: 'Slip away', check: { stat: 'spd', diff: 3 }, success: { text: 'Gone before it can be sure.', dna: 1, anim: 'flee' }, fail: { text: 'It chases you off.', unmask: true, pop: -1 } },
      { label: 'Drop the disguise', result: { text: 'You were getting tired of it anyway.', unmask: true, dna: 2 } },
    ],
  },
  // ======================= THE LIVING WORLD =======================
  // ---- Activities ----
  {
    id: 'war_ambush', stage: 'any', activity: 'war', species: 'target', title: 'Ambush at the Border', tags: ['danger'], repeat: true,
    text: 'A band of {them} lies in wait where your territories meet.',
    options: [
      { label: 'Charge them', check: { stat: 'str', diff: 3 }, success: { text: 'They break and run.', warScore: 30, opinion: -10, anim: 'attack' }, fail: { text: 'It was a trap.', warScore: -25, pop: -2 } },
      { label: 'Go around them', check: { stat: 'cun', diff: 3 }, success: { text: 'You strike their home while they wait.', warScore: 25, food: 2 }, fail: { text: 'They see you coming.', warScore: -10 } },
      { label: 'Offer peace', check: { stat: 'cha', diff: 4 }, success: { text: 'Both sides are tired. The war ends.', endActivity: true, opinion: 30, anim: 'social' }, fail: { text: 'They laugh at you.', warScore: -10, opinion: -10 } },
    ],
  },
  {
    id: 'war_champions', stage: 'any', activity: 'war', species: 'target', title: 'Champions', tags: ['danger'],
    text: 'The biggest of the {them} steps forward, roaring a challenge.',
    options: [
      { label: 'Send your strongest', check: { stat: 'str', diff: 4 }, success: { text: 'Your champion wins. The {them} lose heart.', warScore: 40, dna: 2, mood: 'proud' }, fail: { text: 'Your champion falls.', warScore: -30, pop: -1 } },
      { label: 'Refuse the challenge', result: { text: 'No glory, no losses.', warScore: -5, anim: 'rest' } },
    ],
  },
  {
    id: 'court_gift', stage: 'any', activity: 'court', species: 'target', title: 'A Gift for the {them}', tags: ['social'], repeat: true,
    text: 'The {them} are watching to see what you bring.',
    options: [
      { label: 'Share your best food', req: { food: 3 }, result: { text: 'They accept, warmly.', food: -3, opinion: 25, anim: 'social' } },
      { label: 'Put on a display', check: { stat: 'cha', diff: 3 }, success: { text: 'They are charmed.', opinion: 20, mood: 'love' }, fail: { text: 'Awkward.', opinion: -5 } },
      { label: 'Groom their young', check: { stat: 'cun', diff: 2 }, success: { text: 'Trust grows.', opinion: 15, anim: 'social' }, fail: { text: 'The parents are not pleased.', opinion: -10 } },
    ],
  },
  {
    id: 'court_rival_suitor', stage: 'any', activity: 'court', species: 'target', title: 'A Rival Suitor', tags: ['social', 'danger'],
    text: 'Another species is courting the {them} too, and it does not like you.',
    options: [
      { label: 'Outshine them', check: { stat: 'cha', diff: 4 }, success: { text: 'The {them} choose you.', opinion: 25, dna: 2 }, fail: { text: 'The {them} drift toward your rival.', opinion: -15 } },
      { label: 'Drive the rival off', check: { stat: 'str', diff: 4 }, success: { text: 'The {them} are impressed, and a little scared.', opinion: 10 }, fail: { text: 'An ugly scene in front of the {them}.', pop: -1, opinion: -10 } },
    ],
  },
  {
    id: 'avoid_cornered', stage: 'any', activity: 'avoid', species: 'target', title: 'Nowhere Left to Hide', tags: ['danger'],
    text: 'Your long detour has led you straight into the {them}.',
    options: [
      { label: 'Freeze', check: { stat: 'cun', diff: 3 }, success: { text: 'They pass by without seeing you.', dna: 2, anim: 'rest' }, fail: { text: 'They see you.', pop: -2 } },
      { label: 'Run for it', check: { stat: 'spd', diff: 3 }, success: { text: 'Gone before they notice.', dna: 1, anim: 'flee' }, fail: { text: 'Some of you are caught.', pop: -2 } },
    ],
  },
  {
    id: 'hunt_stampede', stage: 'any', activity: 'hunt', species: 'target', title: 'The {them} Turn on You', tags: ['hunt', 'danger'],
    text: 'You have hunted the {them} too often. Today the whole herd turns and charges.',
    options: [
      { label: 'Stand and fight', check: { stat: 'str', diff: 4 }, success: { text: 'A feast, and a lesson for them.', food: 6, opinion: -15, anim: 'attack' }, fail: { text: 'They trample you.', pop: -3 } },
      { label: 'Scatter', check: { stat: 'spd', diff: 3 }, success: { text: 'You slip away.', anim: 'flee' }, fail: { text: 'Not everyone is fast enough.', pop: -2 } },
      { label: 'Stop hunting them', result: { text: 'You let the {them} be.', endActivity: true, opinion: 15, anim: 'rest' } },
    ],
  },
  {
    id: 'hunt_trail', stage: 'any', activity: 'hunt', species: 'target', title: 'A Fresh Trail', tags: ['hunt'], repeat: true,
    text: 'A trail of {them} tracks, still warm.',
    options: [
      { label: 'Follow it', check: { stat: 'cun', diff: 3 }, success: { text: 'It leads to a whole family.', food: 5, opinion: -8 }, fail: { text: 'The trail goes cold.', food: -1 } },
      { label: 'Set a trap', req: { tag: 'grasp' }, result: { text: 'Patience pays.', food: 4, insight: 1 } },
    ],
  },
  {
    id: 'migrate_river', stage: 'any', activity: 'migrate', title: 'The Crossing', tags: ['explore', 'danger'],
    text: 'Your migration reaches a wide, fast {crossing}. Something waits on the other side.',
    options: [
      { label: 'Cross together', check: { stat: 'tou', diff: 3 }, success: { text: 'Everyone makes it.', dna: 2 }, fail: { text: 'The current takes some of you.', pop: -2 } },
      { label: 'Search for a safer way', check: { stat: 'cun', diff: 3 }, success: { text: 'A shallow ford. Easy.', dna: 1 }, fail: { text: 'You lose days, and food.', food: -3 } },
    ],
  },
  {
    id: 'scout_discovery', stage: 'any', activity: 'scout', title: 'What the Scouts Saw', tags: ['explore'],
    text: 'One of your scouts comes back breathless, with news of something strange far away.',
    options: [
      { label: 'Go and see', check: { stat: 'spd', diff: 3 }, success: { text: 'A world full of new food.', food: 4, dna: 2 }, fail: { text: 'It was a long way for nothing.', food: -2 } },
      { label: 'Listen and remember', result: { text: 'The story is passed down.', dna: 2, insight: 1, anim: 'social' } },
    ],
  },
  // ---- Seasons ----
  {
    id: 'deep_winter', stage: 'creature', season: 'winter', title: 'Deep Winter', tags: ['food', 'danger'],
    text: 'Snow covers everything. Food is buried and the weak are struggling.',
    options: [
      { label: 'Huddle together', check: { stat: 'tou', diff: 3 }, success: { text: 'You keep each other warm.', trait: 'resilient', dna: 1, anim: 'rest' }, fail: { text: 'The cold takes the weakest.', pop: -2 } },
      { label: 'Dig for buried food', check: { stat: 'str', diff: 3 }, success: { text: 'Roots under the snow.', food: 4 }, fail: { text: 'Frozen solid.', food: -1 } },
      { label: 'Sleep through it', req: { trait: 'hoarder' }, result: { text: 'You wake in spring, thin but alive.', food: -2, dna: 2, anim: 'rest' } },
    ],
  },
  {
    id: 'spring_rush', stage: 'creature', season: 'spring', title: 'The Spring Rush', tags: ['social', 'food'],
    text: 'Everything is born at once. The world is full of young, yours and everyone else\'s.',
    options: [
      { label: 'Raise as many as you can', result: { text: 'A crowded, noisy spring.', pop: 2, food: -2, anim: 'grow' } },
      { label: 'Feast on the newborns of others', req: { diet: ['carn', 'omni'] }, result: { text: 'Easy pickings.', food: 5, anim: 'eat' } },
    ],
  },
  {
    id: 'bloom_feast', stage: 'creature', season: 'bloom', title: 'The Great Bloom', tags: ['food'],
    text: 'The water has turned thick and green with life. Every filter-feeder in the sea is gathering.',
    options: [
      { label: 'Gorge yourselves', result: { text: 'You have never been so full.', food: 5, anim: 'eat' } },
      { label: 'Hunt the feeders', req: { diet: ['carn', 'omni'] }, check: { stat: 'spd', diff: 3 }, success: { text: 'They are too busy eating to notice.', food: 6 }, fail: { text: 'They scatter.', food: 1 } },
    ],
  },
  {
    id: 'storm_season', stage: 'creature', season: 'storms', title: 'The Long Storm', tags: ['danger'],
    text: 'Storm after storm churns the sea. Nothing can feed in this.',
    options: [
      { label: 'Go deep and wait', check: { stat: 'tou', diff: 3 }, success: { text: 'Calm below.', dna: 1, anim: 'rest' }, fail: { text: 'The storm finds you even down here.', pop: -2 } },
      { label: 'Feed on what the storm stirs up', check: { stat: 'spd', diff: 3 }, success: { text: 'Stunned fish everywhere.', food: 4 }, fail: { text: 'The waves throw you about.', pop: -1 } },
    ],
  },
  // ---- Nemesis, sworn allies and migrants ----
  {
    id: 'nemesis_raid', stage: 'any', species: 'nemesis', title: 'The {them} Remember', tags: ['danger'], repeat: true,
    text: 'The {them} have never forgotten what passed between you. Tonight they come for revenge.',
    options: [
      { label: 'Meet them head on', check: { stat: 'str', diff: 4 }, success: { text: 'They are beaten back again.', dna: 3, opinion: -10, anim: 'attack' }, fail: { text: 'Their revenge is bloody.', pop: -3 } },
      { label: 'Hide your young', check: { stat: 'cun', diff: 3 }, success: { text: 'They find nothing.', dna: 1, anim: 'rest' }, fail: { text: 'They find some.', pop: -2 } },
      { label: 'Try to make peace', check: { stat: 'cha', diff: 5 }, success: { text: 'Old wounds begin to heal.', opinion: 40, anim: 'social' }, fail: { text: 'It is too late for that.', pop: -1, opinion: -5 } },
    ],
  },
  {
    id: 'sworn_gift', stage: 'any', species: 'sworn', title: 'Sworn Allies', tags: ['social'], repeat: true,
    text: 'The {them} arrive with food and news. Old friends look after each other.',
    options: [
      { label: 'Feast together', result: { text: 'A night to remember.', food: 4, opinion: 5, anim: 'social' } },
      { label: 'Learn from them', result: { text: 'They show you their tricks.', dna: 3, insight: 1, anim: 'social' } },
    ],
  },
  {
    id: 'passing_herd', stage: 'creature', species: 'migrant', title: 'The Passing Herd', tags: ['hunt', 'social'],
    text: 'The migrating {them} are passing right through your territory.',
    options: [
      { label: 'Pick off the stragglers', req: { diet: ['carn', 'omni'] }, check: { stat: 'spd', diff: 3 }, success: { text: 'Easy meat.', food: 5, opinion: -10 }, fail: { text: 'The herd closes ranks.', food: -1 } },
      { label: 'Travel with them a while', check: { stat: 'cha', diff: 3 }, success: { text: 'They show you places you never knew.', dna: 3, opinion: 15, anim: 'social' }, fail: { text: 'They do not want company.', opinion: -5 } },
      { label: 'Let them pass', result: { text: 'The ground shakes for a day, then they are gone.', dna: 1, anim: 'rest' } },
    ],
  },
  // ---- Story chains ----
  {
    id: 'strange_egg', stage: 'creature', title: 'A Strange Egg', tags: ['explore'],
    text: 'You find an egg, bigger than any of yours, lying alone. It is warm. Something inside moves.',
    options: [
      { label: 'Keep it warm', result: { text: 'You take turns keeping it warm. Something will hatch soon.', chain: 'strange_egg_hatch', chainIn: 4, anim: 'rest' } },
      { label: 'Eat it', req: { diet: ['carn', 'omni'] }, result: { text: 'A rich meal.', food: 4, anim: 'eat' } },
      { label: 'Leave it', result: { text: 'Not your problem.', anim: 'rest' } },
    ],
  },
  {
    id: 'strange_egg_hatch', stage: 'creature', chained: true, title: 'The Egg Hatches', tags: ['social'],
    text: 'The egg cracks open. The hatchling looks nothing like you, but it thinks you are its family.',
    options: [
      { label: 'Raise it as one of your own', result: { text: 'It grows up among you. One day it will repay you.', chain: 'strange_egg_grown', chainIn: 8, trait: 'gentle', anim: 'social' } },
      { label: 'Send it away', result: { text: 'It wanders off, looking back.', dna: 1, anim: 'rest' } },
    ],
  },
  {
    id: 'strange_egg_grown', stage: 'creature', chained: true, title: 'The Foundling Returns', tags: ['social'],
    text: 'The hatchling you raised is grown now, and huge. It has come back to you with others of its kind.',
    options: [
      { label: 'Welcome them', result: { text: 'They guard you as their own family. Something about them rubs off on you.', randomPart: true, pop: 2, anim: 'social', mood: 'love' } },
      { label: 'Ask them to teach you', result: { text: 'They show you their ways.', dna: 5, insight: 2, anim: 'social' } },
    ],
  },
  {
    id: 'plea_for_help', stage: 'any', species: 'neighbor', title: 'A Plea for Help', tags: ['social'],
    text: 'The {them} are starving. Their young are crying. They come to you, heads low.',
    options: [
      { label: 'Share what you have', req: { food: 4 }, result: { text: 'They will not forget this.', food: -4, opinion: 30, chain: 'plea_repaid', chainIn: 6, anim: 'social' } },
      { label: 'Turn them away', result: { text: 'They leave quietly.', opinion: -15, anim: 'rest' } },
    ],
  },
  {
    id: 'plea_repaid', stage: 'any', chained: true, title: 'A Debt Repaid', tags: ['social'],
    text: 'The {them} you once fed have come back. Times are good for them now, and they have not forgotten.',
    options: [
      { label: 'Accept their gifts', result: { text: 'Food, and friendship.', food: 6, opinion: 20, anim: 'social', mood: 'love' } },
      { label: 'Ask them to stand with you', result: { text: 'They swear to fight beside you.', opinion: 60, anim: 'social' } },
    ],
  },
  // ======================= THE WORLD MAP (biome events) =======================
  // ---- Cell stage: currents move multicellular cells between biomes ----
  {
    id: 'rising_bubbles', stage: 'cell', multi: true, title: 'Rising Bubbles', tags: ['explore'],
    when: (run) => G.biome(run).id !== 'surface',
    text: 'A stream of bubbles rises from the vent, carrying everything nearby up toward the light.',
    options: [
      { label: 'Ride them to the surface', result: { text: 'Sunlight! Food everywhere, and eyes everywhere too.', biome: 'surface', dna: 2, anim: 'flee' } },
      { label: 'Cling on and stay', check: { stat: 'tou', diff: 2 }, success: { text: 'You hold fast.', dna: 1, anim: 'rest' }, fail: { text: 'Some of you are swept away anyway.', pop: -1 } },
    ],
  },
  {
    id: 'sinking_silt', stage: 'cell', multi: true, title: 'Falling Silt', tags: ['explore', 'danger'],
    when: (run) => G.biome(run).id !== 'mud',
    text: 'A cloud of silt drifts down and buries you. Below is thick, quiet mud.',
    options: [
      { label: 'Settle into the mud', result: { text: 'Safe, slow and soft.', biome: 'mud', dna: 1, anim: 'rest' } },
      { label: 'Swim up out of it', check: { stat: 'spd', diff: 2 }, success: { text: 'Clear water again.', dna: 1 }, fail: { text: 'The silt smothers some of you.', pop: -1 } },
    ],
  },
  {
    id: 'back_to_the_vent', stage: 'cell', multi: true, title: 'The Warm Current', tags: ['explore'],
    when: (run) => G.biome(run).id !== 'vent',
    text: 'A warm current flows past, smelling of the vent you came from.',
    options: [
      { label: 'Follow it home', result: { text: 'Back to the warm, steady dark.', biome: 'vent', anim: 'rest' } },
      { label: 'Stay here', result: { text: 'This is home now.', dna: 1, anim: 'rest' } },
    ],
  },
  {
    id: 'sunburn', stage: 'cell', biome: 'surface', title: 'Too Much Sun', tags: ['danger'],
    text: 'The light that feeds you is burning you too.',
    options: [
      { label: 'Grow darker membranes', check: { stat: 'tou', diff: 2 }, success: { text: 'You darken and harden.', trait: 'resilient' }, fail: { text: 'The light kills the outer cells.', pop: -2 } },
      { label: 'Dive in the heat of the day', result: { text: 'You go down at noon and up at dusk.', food: -1, dna: 2 } },
    ],
  },
  // ---- Land ----
  {
    id: 'jungle_canopy', stage: 'creature', habitat: 'land', biome: 'jungle', title: 'The Canopy', tags: ['explore', 'food'],
    text: 'High above, the treetops are heavy with fruit, and something is moving between them.',
    options: [
      { label: 'Climb up', req: { tag: 'grasp' }, result: { text: 'A whole world in the treetops.', food: 5, dna: 2, anim: 'grow' } },
      { label: 'Wait for fruit to fall', result: { text: 'Patience, and bruised fruit.', food: 2, anim: 'rest' } },
      { label: 'Investigate the movement', check: { stat: 'cun', diff: 3 }, success: { text: 'A shy new species. You learn its ways.', dna: 3 }, fail: { text: 'It was a snake.', pop: -1 } },
    ],
  },
  {
    id: 'jungle_fever', stage: 'creature', habitat: 'land', biome: ['jungle', 'swamp'], prop: 'sickness', title: 'Swamp Fever', tags: ['danger'],
    text: 'Biting insects bring a fever that spreads through your kind.',
    options: [
      { label: 'Roll in mud', check: { stat: 'cun', diff: 3 }, success: { text: 'The insects cannot bite through it.', dna: 2 }, fail: { text: 'Too late for some.', pop: -2 } },
      { label: 'Tough it out', check: { stat: 'tou', diff: 4 }, success: { text: 'The survivors are stronger.', trait: 'resilient' }, fail: { text: 'The fever runs through you.', pop: -3 } },
      { label: 'Move to higher ground', result: { text: 'You leave the worst of it behind.', food: -2, anim: 'flee' } },
    ],
  },
  {
    id: 'desert_oasis', stage: 'creature', habitat: 'land', biome: 'desert', prop: 'pond', title: 'The Oasis', tags: ['food', 'social'], species: 'any',
    text: 'A pool of water among the dunes. Every creature for miles comes here, including the {them}.',
    options: [
      { label: 'Share the water', check: { stat: 'cha', diff: 3 }, success: { text: 'An uneasy peace at the water\'s edge.', food: 3, opinion: 20, anim: 'social' }, fail: { text: 'A scuffle at the water.', food: 1, opinion: -10 } },
      { label: 'Claim it', check: { stat: 'str', diff: 4 }, success: { text: 'The oasis is yours.', food: 5, opinion: -25, trait: 'territorial', anim: 'attack' }, fail: { text: 'You are driven off, thirsty.', pop: -2 } },
    ],
  },
  {
    id: 'sandstorm', stage: 'creature', habitat: 'land', biome: 'desert', prop: 'dust', title: 'Sandstorm', tags: ['danger'],
    text: 'A wall of sand rolls across the desert.',
    options: [
      { label: 'Burrow under the sand', check: { stat: 'cun', diff: 3 }, success: { text: 'You wait it out underground.', dna: 2, anim: 'rest' }, fail: { text: 'Some of you are buried for good.', pop: -2 } },
      { label: 'Huddle with your backs to it', check: { stat: 'tou', diff: 3 }, success: { text: 'Battered but fine.', dna: 1 }, fail: { text: 'The sand flays you.', pop: -2 } },
    ],
  },
  {
    id: 'tundra_blizzard', stage: 'creature', habitat: 'land', biome: 'tundra', prop: 'snow', title: 'Blizzard', tags: ['danger'],
    text: 'White, howling, endless. You cannot see your own tail.',
    options: [
      { label: 'Huddle together', check: { stat: 'tou', diff: 3 }, success: { text: 'Shared warmth gets you through.', trait: 'social', dna: 1 }, fail: { text: 'Some are lost in the white.', pop: -2 } },
      { label: 'Dig a snow den', req: { tag: 'grasp' }, result: { text: 'Warm and snug.', dna: 2, anim: 'rest' } },
    ],
  },
  {
    id: 'tundra_mammoth', stage: 'creature', habitat: 'land', biome: 'tundra', prop: 'carcass', title: 'Frozen in the Ice', tags: ['food'],
    text: 'Something huge died here long ago and froze. The thaw is uncovering it.',
    options: [
      { label: 'Dig it out', check: { stat: 'str', diff: 3 }, success: { text: 'A feast that keeps forever in the cold.', food: 8, anim: 'eat' }, fail: { text: 'The ice wins.', food: 1 } },
      { label: 'Study it', check: { stat: 'cun', diff: 3 }, success: { text: 'A creature from another age. You learn from its bones.', dna: 4 }, fail: { text: 'Just old bones.', dna: 1 } },
    ],
  },
  {
    id: 'swamp_sinkhole', stage: 'creature', habitat: 'land', biome: 'swamp', prop: 'tar', title: 'Sucking Mud', tags: ['danger'],
    text: 'The ground gives way. Some of you are sinking.',
    options: [
      { label: 'Pull them out', check: { stat: 'str', diff: 3 }, success: { text: 'Everyone gets out.', trait: 'gentle' }, fail: { text: 'The mud keeps some.', pop: -2 } },
      { label: 'Spread out and crawl', check: { stat: 'cun', diff: 3 }, success: { text: 'Light and wide, you float across.', dna: 2 }, fail: { text: 'Not light enough.', pop: -1 } },
    ],
  },
  {
    id: 'shore_waves', stage: 'creature', habitat: 'land', biome: 'shore', prop: 'shore', title: 'The Pull of the Sea', tags: ['explore'],
    text: 'Some of your kind keep wading into the waves and coming back fat with fish. The sea is calling.',
    options: [
      { label: 'Learn to fish', check: { stat: 'spd', diff: 3 }, success: { text: 'The shallows are full of food.', food: 4, dna: 2 }, fail: { text: 'The waves knock you about.', pop: -1 } },
      { label: 'Stay on dry land', result: { text: 'The land is home.', dna: 1, anim: 'rest' } },
    ],
  },
  // ---- Sea ----
  {
    id: 'kelp_maze', stage: 'creature', habitat: 'sea', biome: 'kelp', prop: 'kelp', title: 'Lost in the Kelp', tags: ['explore', 'danger'],
    text: 'The kelp grows so thick that your school is split up in the green maze.',
    options: [
      { label: 'Call to each other', check: { stat: 'cha', diff: 3 }, success: { text: 'Everyone finds their way back.', trait: 'social', dna: 1 }, fail: { text: 'Some never answer.', pop: -2 } },
      { label: 'Feast while you are here', result: { text: 'If you are lost anyway, at least you eat.', food: 4, pop: -1, anim: 'eat' } },
    ],
  },
  {
    id: 'polar_ice', stage: 'creature', habitat: 'sea', biome: 'polar', prop: 'ice', title: 'Under the Ice', tags: ['danger', 'explore'],
    text: 'The sea is freezing over above you. Soon there will be no way up.',
    options: [
      { label: 'Break through', check: { stat: 'str', diff: 4 }, success: { text: 'Air and light again.', dna: 2, anim: 'attack' }, fail: { text: 'The ice holds.', pop: -2 } },
      { label: 'Live under it', check: { stat: 'tou', diff: 3 }, success: { text: 'Dark, cold and safe from everything above.', trait: 'resilient', dna: 2 }, fail: { text: 'The cold is too much for some.', pop: -2 } },
    ],
  },
  {
    id: 'polar_krill', stage: 'creature', habitat: 'sea', biome: 'polar', prop: 'swarm', title: 'The Krill Swarm', tags: ['food'],
    text: 'The water turns pink: a krill swarm miles across.',
    options: [
      { label: 'Feed until you can feed no more', result: { text: 'The fattest season of your lives.', food: 6, anim: 'eat' } },
      { label: 'Follow the swarm', check: { stat: 'spd', diff: 3 }, success: { text: 'It leads you to rich new waters.', food: 3, dna: 3 }, fail: { text: 'It outpaces you.', food: 1 } },
    ],
  },
  {
    id: 'vent_eruption', stage: 'creature', habitat: 'sea', biome: 'vents', prop: 'vent', title: 'The Vents Erupt', tags: ['danger', 'explore'],
    text: 'The sea floor cracks and boiling water pours out. Strange chemicals cloud the water.',
    options: [
      { label: 'Flee the heat', check: { stat: 'spd', diff: 3 }, success: { text: 'You get clear.', dna: 1, anim: 'flee' }, fail: { text: 'Some are boiled.', pop: -2 } },
      { label: 'Bathe in the chemicals', check: { stat: 'tou', diff: 4 }, success: { text: 'Something in you changes.', randomPart: true, dna: 2, anim: 'mutate' }, fail: { text: 'Poisoned.', pop: -3 } },
    ],
  },
  {
    id: 'coast_tidepool', stage: 'creature', habitat: 'sea', biome: 'coast', prop: 'shore', title: 'Stranded', tags: ['explore', 'danger'],
    text: 'The tide goes out and leaves part of your school stranded on the rocks, gasping.',
    options: [
      { label: 'Wriggle back to the water', check: { stat: 'spd', diff: 3 }, success: { text: 'Everyone makes it back.', dna: 1, anim: 'flee' }, fail: { text: 'Not everyone.', pop: -2 } },
      { label: 'Hold your breath and explore', req: { anyPart: ['tide_lungs', 'lobe_fins', 'walking_legs'] }, result: { text: 'The land is strange, dry and full of food nobody else can reach.', food: 4, dna: 3, mood: 'surprised' } },
    ],
  },
];

// Endings that a winning run can earn. Shown in the Codex.
// Creature-stage endings. The ten main ones come from your Path of Mind and your habitat; each is
// named by your temperament (70 in all), and decides what kind of people you become next.
// The older endings stay so past lineages in your history still have names.
const L = (o) => o;
G.LEGACIES = {
  firekeepers: L({ name: 'The Firekeepers', path: 'tool', habitat: 'land', desc: 'A Tribe around the first fires.',
    flavor: { hunter: 'The Spear-Bearers', herd: 'The Firekeepers', bond: 'The Hearth-Kin', taker: 'The Ember Thieves', many: 'The Kiln-Builders', mask: 'The Smoke-Walkers', wanderer: 'The Torch-Carriers' } }),
  shell_smiths: L({ name: 'The Shell Smiths', path: 'tool', habitat: 'sea', desc: 'A Shell Clan of tool-users, warmed by the vents.',
    flavor: { hunter: 'The Harpooners', herd: 'The Shell Smiths', bond: 'The Sponge-Glove Clan', taker: 'The Pearl Thieves', many: 'The Vent Forgers', mask: 'The Ink Smiths', wanderer: 'The Tide Tinkers' } }),
  great_chorus: L({ name: 'The Great Chorus', path: 'song', habitat: 'land', desc: 'A Choir whose songs carry its memory.',
    flavor: { hunter: 'The Howling Pack', herd: 'The Great Chorus', bond: 'The Unifiers', taker: 'The Mockingbirds', many: 'The Thousand Voices', mask: 'The Echo-Callers', wanderer: 'The Wind Singers' } }),
  deep_singers: L({ name: 'The Deep Singers', path: 'song', habitat: 'sea', desc: 'A Pod whose songs cross whole oceans.',
    flavor: { hunter: 'The Hunting Choir', herd: 'The Deep Singers', bond: 'The Harmony Pods', taker: 'The Siren Pods', many: 'The Ocean Chorus', mask: 'The Mimic Choir', wanderer: 'The Migration Song' } }),
  hidden_dens: L({ name: 'The Hidden Dens', path: 'many', habitat: 'land', desc: 'A Den of clever climbers who speak in color.',
    flavor: { hunter: 'The Shadow Dens', herd: 'The Watchful Dens', bond: 'The Twined Dens', taker: 'The Nest Thieves', many: 'The Hundred Eyes', mask: 'The Thousand Faces', wanderer: 'The Canopy Drifters' } }),
  deep_dens: L({ name: 'The Deep Dens', path: 'many', habitat: 'sea', desc: 'A Den of deep-sea minds who speak in light.',
    flavor: { hunter: 'The Lantern Court', herd: 'The Glimmer Dens', bond: 'The Reef Whisperers', taker: 'The Ink Court', many: 'The Chromatic Council', mask: 'The Changing Ones', wanderer: 'The Current Readers' } }),
  great_mound: L({ name: 'The Great Mound', path: 'swarm', habitat: 'land', desc: 'A Hive whose mound never stops growing.',
    flavor: { hunter: 'The Army Hive', herd: 'The Great Mound', bond: 'The Aphid Shepherds', taker: 'The Slaver Hive', many: 'The Endless Hive', mask: 'The Hidden Nest', wanderer: 'The Marching Column' } }),
  reef_builders: L({ name: 'The Reef Builders', path: 'swarm', habitat: 'sea', desc: 'A living Reef-colony that thinks as one.',
    flavor: { hunter: 'The Stinging Reef', herd: 'The Reef Builders', bond: 'The Coral Union', taker: 'The Siphon Host', many: 'The Living Reef', mask: 'The False Reef', wanderer: 'The Drifting Colony' } }),
  grove_keepers: L({ name: 'The Grove Keepers', path: 'garden', habitat: 'land', desc: 'A Grove of fungus farmers.',
    flavor: { hunter: 'The Trap Gardeners', herd: 'The Grove Keepers', bond: 'The Fungus Partners', taker: 'The Blight Lords', many: 'The Leafcutter Nation', mask: 'The Bloom Masks', wanderer: 'The Seed Scatterers' } }),
  kelp_shepherds: L({ name: 'The Kelp Shepherds', path: 'garden', habitat: 'sea', desc: 'A Kelp Garden tended by many hands.',
    flavor: { hunter: 'The Kelp Hunters', herd: 'The Kelp Shepherds', bond: 'The Algae Kin', taker: 'The Tide Reapers', many: 'The Polyp Meadows', mask: 'The Drifting Gardens', wanderer: 'The Current Sowers' } }),
  // Older endings (before Update 13).
  unifiers: L({ name: 'The Unifiers', old: true, desc: 'Your tribe will begin with allies.' }),
  conquerors: L({ name: 'The Conquerors', old: true, desc: 'Your tribe will begin feared and armed.' }),
  wanderers: L({ name: 'The Wanderers', old: true, desc: 'Your tribes will begin scattered across the whole world.' }),
  tide_lords: L({ name: 'The Tide Lords', old: true, desc: 'Your people will begin as masters of the sea.' }),
  vent_keepers: L({ name: 'The Vent Keepers', old: true, desc: 'Your people will begin with the warmth of the deep vents, the sea\'s own fire.' }),
};
G.ENDINGS = Object.keys(G.LEGACIES).filter((id) => !G.LEGACIES[id].old);
G.ENDING_FOR = {};
G.ENDINGS.forEach((id) => { const l = G.LEGACIES[id]; (G.ENDING_FOR[l.path] = G.ENDING_FOR[l.path] || {})[l.habitat] = id; });

// The Spark of Mind: choose your Path. Paths your body can't support are shown locked.
(function () {
  const pathOptions = () => G.PATHS.map((p) => ({
    label: `${p.icon} ${p.name}`, hint: p.desc, req: { path: p.id },
    result: { text: `Your kind begins to think as ${p.name} do. This is your path now, for good.`, path: p.id, anim: 'mutate' },
  }));
  const spark = G.EVENTS.find((e) => e.id === 'spark_of_mind');
  spark.text = 'Something has changed behind your eyes. Your kind has begun to wonder, but how it thinks depends on what it is. Choose your Path of Mind. It will shape your people for the rest of this lineage.';
  spark.options = pathOptions();
  // For lineages that reached the Spark before paths existed.
  G.EVENTS.push({ id: 'path_choice', stage: 'creature', chained: true, prop: 'sparks', title: 'How Your Kind Thinks', text: 'Your kind has been thinking for a while now, but in no settled way. It is time to choose your Path of Mind.', options: pathOptions() });

  // One finale for each Path, on land and at sea. Every option reaches the same ending by a different road.
  const F = {
    tool: {
      land: { title: 'The First Fire', prop: 'fire', text: 'Lightning has struck the dry grass. Your kind does not run. It watches, and it reaches for a burning branch.',
        options: [['Carry the fire home', 'cun', 'Your clever hands carry the flame without dropping it.'], ['Guard it through the night', 'tou', 'You shield it from wind and rain until dawn.'], ['Bring the whole tribe to see', 'cha', 'Everyone gathers in its warm light.']] },
      sea: { title: 'The Vent Forge', prop: 'vent', text: 'At the edge of a hot vent, a shell left too close glows and softens. Your kind sees it, and understands.',
        options: [['Shape the softened shell', 'cun', 'The first blade that is truly made, not found.'], ['Hold it in the heat', 'tou', 'You bear the scalding water until the shape is right.'], ['Teach the others', 'cha', 'By the next tide, everyone can do it.']] },
    },
    song: {
      land: { title: 'The Great Song', prop: 'notes', text: 'At dusk, one voice begins a song that holds everything your kind has ever learned.',
        options: [['Join in, every voice', 'cha', 'The song swells across the whole valley.'], ['Remember every word', 'cun', 'Not one verse is lost.'], ['Sing it at the far edge of the land', 'spd', 'Your song reaches places your feet have never been.']] },
      sea: { title: 'The Ocean Song', prop: 'notes', text: 'A song begins in the deep, slow and enormous, and the whole ocean seems to listen.',
        options: [['Answer it, all together', 'cha', 'Your voices carry across whole oceans.'], ['Remember every note', 'cun', 'It will be sung again in a thousand years.'], ['Carry it across the open sea', 'spd', 'Your song swims farther than any of you.']] },
    },
    many: {
      land: { title: 'The Shared Den', prop: 'cave', text: 'Your kind has always lived alone. Tonight, one by one, they come to the same den, and speak in color.',
        options: [['Speak in ripples of color', 'cha', 'Whole stories pass in a flicker.'], ['Solve the puzzle of the den', 'cun', 'Together you open what none of you could alone.'], ['Hide the den from every hunter', 'tou', 'No one will ever find it.']] },
      sea: { title: 'The Deep Court', prop: 'night', text: 'In the dark, lights begin to answer one another. Solitary minds are learning to meet.',
        options: [['Speak in living light', 'cha', 'The dark fills with glowing words.'], ['Out-think the dark', 'cun', 'Each mind adds to the others.'], ['Hold the deep against all comers', 'tou', 'The deep is yours.']] },
    },
    swarm: {
      land: { title: 'The Waking Hive', prop: 'dust', text: 'The mound hums. For the first time, the whole colony thinks one thought at once.',
        options: [['Raise the great mound', 'tou', 'It rises higher than the trees.'], ['Think as one', 'cun', 'A thousand bodies, one mind.'], ['Swarm across the land', 'str', 'Nothing can stand against the column.']] },
      sea: { title: 'The Waking Reef', prop: 'coral', text: 'The reef pulses with a slow, shared rhythm. The colony has become a mind.',
        options: [['Grow the reef outward', 'tou', 'It spreads farther than any reef before it.'], ['Think as one', 'cun', 'Every polyp knows what the others know.'], ['Sting everything that comes close', 'str', 'The reef defends itself.']] },
    },
    garden: {
      land: { title: 'The First Harvest', prop: 'fruit', text: 'The fungus you have tended for generations is finally ready. Enough to feed everyone, and more.',
        options: [['Bring in the harvest', 'tou', 'A feast, and seed for next year.'], ['Plan the next planting', 'cun', 'You will never go hungry again.'], ['Share it with the other species', 'cha', 'Even your rivals come to eat.']] },
      sea: { title: 'The First Kelp Fields', prop: 'kelp', text: 'The kelp you planted has grown into a forest you shaped yourselves.',
        options: [['Bring in the harvest', 'tou', 'The sea has never been so generous.'], ['Plan the next fields', 'cun', 'Rows of kelp stretch into the distance.'], ['Share it with the other species', 'cha', 'Even sharks drift in to rest.']] },
    },
  };
  Object.entries(F).forEach(([path, byHab]) => Object.entries(byHab).forEach(([hab, f]) => {
    const ending = G.ENDING_FOR[path][hab];
    G.EVENTS.push({ id: `finale_${path}_${hab}`, stage: 'creature', finale: true, habitat: hab, prop: f.prop, title: f.title, text: f.text,
      options: f.options.map(([label, stat, win]) => ({ label, check: { stat, diff: 5 }, success: { text: `${win} Your people are born.`, legacy: ending, anim: stat === 'cha' ? 'social' : stat === 'str' ? 'attack' : 'mutate' }, fail: { text: 'Not yet. Your kind is not ready.', pop: -3, setback: 0 } })) });
  }));
}());

// ---------- Tribe stage (Update 14) ----------
// Words in braces change with your people: {band} (tribe, clan, choir, pod), {resource} (Fire, Vent-heat, Song),
// {keeper}, {camp}, {leader}, and {cand0}..{cand2} for leader candidates.
G.EVENTS.push(
  // ----- Milestones -----
  {
    id: 'first_tool', stage: 'tribe', milestone: true, path: 'tool', prop: 'fire', title: 'The Keeping of the Flame',
    text: 'Your people have carried their {resource} this far, but it will not keep itself. Someone must tend it, day and night, or it goes out. Who will be the first {keeper}?',
    options: [
      { label: 'The oldest, who remembers how', hint: 'Steady', result: { text: 'Old hands feed it slowly. It has never burned so evenly.', specialOn: true, special: 1, dna: 1, anim: 'rest' } },
      { label: 'The youngest, who will keep it longest', hint: 'More {resource} to start', result: { text: 'The child sits by it all night, eyes wide. By morning it is a blaze.', specialOn: true, special: 3, anim: 'grow' } },
      { label: '{leader}, so everyone sees who leads', hint: 'Your leader becomes Keeper-born', result: { text: 'The flame and the leader become one idea. Nobody argues with either.', specialOn: true, leaderTrait: 'keen', anim: 'social' } },
    ],
  },
  {
    id: 'first_song', stage: 'tribe', milestone: true, path: 'song', prop: 'notes', title: 'The First Song',
    text: 'Your {band} has always sung, but now the songs hold things: where water is, who died, which plants heal. If nobody keeps them, they will drift apart. Who will be the first {keeper}?',
    options: [
      { label: 'The one with the strongest voice', hint: 'More Song to start', result: { text: 'Every verse rings out clear across the {camp}.', specialOn: true, special: 3, anim: 'social' } },
      { label: 'The one who forgets nothing', hint: '+2 Ideas', result: { text: 'Not one word is lost. New verses come easier now.', specialOn: true, dna: 2, anim: 'mutate' } },
      { label: '{leader}, so the song and the leader are one', hint: 'Your leader becomes Keeper-born', result: { text: 'Now when the leader sings, everyone joins in.', specialOn: true, leaderTrait: 'keen', anim: 'social' } },
    ],
  },
  {
    id: 'strangers', stage: 'tribe', milestone: true, prop: 'shadow', title: 'Strangers',
    text: 'Shapes watch your {camp} from a distance. They are not animals. They move together, they signal to each other, and one of them is holding something. Another kind has learned to think.',
    options: [
      { label: 'Go out to meet them', check: { stat: 'cha', diff: 4 }, success: { text: 'Signs, gestures, a shared meal. An uneasy peace.', band: true, bandOpinion: 30, anim: 'social' }, fail: { text: 'Something you did offended them deeply.', band: true, bandOpinion: -20 } },
      { label: 'Show them your strength', check: { stat: 'str', diff: 4 }, success: { text: 'They see how many you are, and keep their distance.', band: true, bandOpinion: -10, dna: 2, anim: 'attack' }, fail: { text: 'They are not impressed. They are angry.', band: true, bandOpinion: -30, pop: -1 } },
      { label: 'Watch them in secret', check: { stat: 'cun', diff: 4 }, success: { text: 'You learn how they hunt, where they sleep and what they fear.', band: true, dna: 3, anim: 'mutate' }, fail: { text: 'They spot you watching. That is never a good start.', band: true, bandOpinion: -15 } },
    ],
  },
  {
    id: 'elders', stage: 'tribe', milestone: true, prop: 'stars', title: 'The Council of Elders',
    text: 'The oldest of your {band} now gather each night to decide things together. It is the first time your people have been governed by more than one voice. What should the elders care about most?',
    options: [
      { label: 'Remembering', hint: 'A new discovery', result: { text: 'They piece together what each of them knows, and something new comes of it.', discovery: true, anim: 'mutate' } },
      { label: 'Teaching the young', hint: '+4 Ideas', result: { text: 'The children learn faster than their parents did.', dna: 4, anim: 'grow' } },
      { label: 'Advising {leader}', hint: 'Your leader becomes Wise', result: { text: 'The leader listens. Mostly.', leaderTrait: 'wise', anim: 'social' } },
    ],
  },
  {
    id: 'succession', stage: 'tribe', chained: true, prop: 'stars', title: 'A New Leader',
    text: 'Your leader is gone, and your {band} gathers to choose another. Three step forward.',
    options: [
      { label: '{cand0}', result: { text: 'The {band} follows a new voice.', leaderPick: 0, anim: 'social' } },
      { label: '{cand1}', result: { text: 'The {band} follows a new voice.', leaderPick: 1, anim: 'social' } },
      { label: '{cand2}', result: { text: 'The {band} follows a new voice.', leaderPick: 2, anim: 'social' } },
    ],
  },

  // ----- Any people -----
  {
    id: 't_long_winter', stage: 'tribe', prop: 'snow', title: 'The Long Cold', tags: ['danger', 'food'],
    text: 'The cold has lasted longer than anyone remembers. Stores are running low, and the youngest are weak.',
    options: [
      { label: 'Ration everything', check: { stat: 'tou', diff: 4 }, success: { text: 'Hungry, but alive. Every one of you.', food: -2, anim: 'rest' }, fail: { text: 'Not everyone makes it to the thaw.', food: -2, pop: -2 } },
      { label: 'Send hunters out into it', check: { stat: 'str', diff: 4 }, success: { text: 'They come back dragging meat through the snow.', food: 4, anim: 'attack' }, fail: { text: 'Not all the hunters come back.', pop: -2 } },
      { label: 'Huddle around the {resource}', hint: 'Needs 3 {resource}', req: { special: 3 }, result: { text: 'You burn through your stores of {resource}, but nobody freezes.', special: -3, anim: 'rest' } },
    ],
  },
  {
    id: 't_sickness', stage: 'tribe', prop: 'sickness', title: 'The Coughing Sickness', tags: ['danger'],
    text: 'A sickness spreads through the {camp}. One by one, your people start to cough.',
    options: [
      { label: 'Keep the sick apart', check: { stat: 'cun', diff: 4 }, success: { text: 'It burns out before it reaches everyone.', pop: -1, dna: 2, anim: 'rest' }, fail: { text: 'You were too late. It is everywhere.', pop: -3 } },
      { label: 'Care for them together', check: { stat: 'cha', diff: 4 }, success: { text: 'Nobody is left alone. Nearly everyone recovers.', pop: -1, anim: 'social' }, fail: { text: 'The carers catch it too.', pop: -3 } },
      { label: 'Move the whole {camp}', result: { text: 'You leave the sickness behind, and a good deal of food with it.', food: -3, anim: 'rest' } },
    ],
  },
  {
    id: 't_quarrel', stage: 'tribe', prop: 'hearts', title: 'A Quarrel', tags: ['social'],
    text: 'Two families have fallen out over a hunting spot, and now nobody will sit with anyone else.',
    options: [
      { label: '{leader} settles it', check: { stat: 'cha', diff: 4 }, success: { text: 'A fair judgement. Both sides grumble, which means it was fair.', dna: 2, anim: 'social' }, fail: { text: 'One family leaves the {band} for good.', pop: -2 } },
      { label: 'Let them fight it out', check: { stat: 'str', diff: 3 }, success: { text: 'Bruises, then laughter. It is over.', anim: 'attack' }, fail: { text: 'It goes too far.', pop: -1, food: -1 } },
      { label: 'Find a new spot for one of them', check: { stat: 'spd', diff: 3 }, success: { text: 'The new spot turns out to be better.', food: 2, anim: 'grow' }, fail: { text: 'There is no better spot.', food: -1 } },
    ],
  },
  {
    id: 't_twins', stage: 'tribe', prop: 'nest', title: 'A Season of Births', tags: ['food'],
    text: 'More young are born this season than ever before. The {camp} is loud with them.',
    options: [
      { label: 'Raise them all', hint: '+2 members, −3 Food', result: { text: 'Every one of them is fed, somehow.', pop: 2, food: -3, anim: 'grow' } },
      { label: 'Raise them to be thinkers', hint: '+3 Ideas, −2 Food', result: { text: 'They grow up asking why.', dna: 3, food: -2, anim: 'mutate' } },
    ],
  },
  {
    id: 't_stargazer', stage: 'tribe', prop: 'stars', title: 'The Stargazer', tags: ['explore'],
    text: 'One of your people stays up every night, watching the lights in the sky. They say the lights move in patterns.',
    options: [
      { label: 'Listen to them', check: { stat: 'cun', diff: 4 }, success: { text: 'They can tell when the cold will come. That is worth a great deal.', discovery: true, anim: 'mutate' }, fail: { text: 'The patterns turn out to be wishful thinking.', dna: 1 } },
      { label: 'Tell them to sleep', result: { text: 'They sleep. The lights keep moving.', food: 1, anim: 'rest' } },
    ],
  },
  {
    id: 't_great_hunt', stage: 'tribe', prop: 'carcass', title: 'The Great Hunt', tags: ['hunt', 'food'], species: 'predator',
    text: 'The {them} have been taking your people. The hunters want to go after them, all together.',
    options: [
      { label: 'Hunt them down', check: { stat: 'str', diff: 5 }, success: { text: 'You bring back a trophy that will be talked about for generations.', food: 4, opinion: -30, dna: 2, anim: 'attack' }, fail: { text: 'The hunters become the hunted.', pop: -3, opinion: -10 } },
      { label: 'Set a trap', check: { stat: 'cun', diff: 4 }, success: { text: 'Patient and clever. It works.', food: 3, opinion: -20, anim: 'mutate' }, fail: { text: 'The trap catches nothing but your own foot.', pop: -1 } },
      { label: 'Leave them be', result: { text: 'Some battles are not worth fighting.', anim: 'rest' } },
    ],
  },
  {
    id: 't_orphan_beast', stage: 'tribe', prop: 'nest', title: 'The Orphan', tags: ['social'], species: 'wild',
    text: 'A young {them} has been left behind by its kind. It follows your people around the {camp}.',
    options: [
      { label: 'Raise it as one of your own', check: { stat: 'cha', diff: 4 }, success: { text: 'It grows up thinking it is one of you. When it returns to its kind, they follow it back.', tame: true, anim: 'social' }, fail: { text: 'It runs off the moment it is grown.', opinion: 10 } },
      { label: 'Eat it', result: { text: 'Food is food.', food: 2, opinion: -15, anim: 'attack' } },
    ],
  },
  {
    id: 't_sacred_beast', stage: 'tribe', prop: 'sun', title: 'The White One', tags: ['explore'], species: 'any',
    when: (run) => !run.totem,
    text: 'A pale {them}, white from nose to tail, has been seen near the {camp}. Your people say it is a sign.',
    options: [
      { label: 'Make it your totem', hint: 'The {them} become your totem', result: { text: 'Its kind will be honoured by your people for as long as they last.', totem: true, opinion: 30, anim: 'social' } },
      { label: 'Hunt it for its pelt', check: { stat: 'spd', diff: 4 }, success: { text: 'A white pelt, worn by your leader.', leaderTrait: 'brave', opinion: -20, anim: 'attack' }, fail: { text: 'It vanishes. Some say it was never there.', opinion: -5 } },
    ],
  },
  {
    id: 't_fool', stage: 'tribe', prop: 'hearts', title: 'The Fool', tags: ['social'],
    text: 'One of your people does everything wrong, loudly, and everyone laughs. They have started doing it on purpose.',
    options: [
      { label: 'Laugh along', hint: '+1 Charm for a while', result: { text: 'A people that can laugh at itself can survive anything.', trait: 'cooperative', anim: 'social' } },
      { label: 'Ask them what they think', check: { stat: 'cun', diff: 3 }, success: { text: 'Under the jokes, a sharp mind. They have ideas nobody else dared to say.', dna: 3, anim: 'mutate' }, fail: { text: 'More jokes. Good ones, though.', dna: 1 } },
    ],
  },
  {
    id: 't_old_bones', stage: 'tribe', prop: 'bones', title: 'The Old Bones', tags: ['explore'],
    text: 'Digging near the {camp}, your people find huge old bones, shaped a little like their own.',
    options: [
      { label: 'Bury them properly', result: { text: 'Whoever they were, they are remembered now.', trait: 'cooperative', dna: 1, anim: 'rest' } },
      { label: 'Study them', check: { stat: 'cun', diff: 4 }, success: { text: 'Your people begin to understand where they came from.', dna: 4, anim: 'mutate' }, fail: { text: 'Bones are bones.', dna: 1 } },
      { label: 'Make them into tools', check: { stat: 'str', diff: 3 }, success: { text: 'Strong, sharp and a little unsettling.', food: 2, anim: 'attack' }, fail: { text: 'They crumble.', anim: 'rest' } },
    ],
  },
  {
    id: 't_raiders', stage: 'tribe', prop: 'shadow', title: 'Raiders in the Night', tags: ['danger', 'social'], species: 'band', repeat: true,
    text: 'The {them} have raided your food stores in the night.',
    options: [
      { label: 'Raid them back', check: { stat: 'str', diff: 5 }, success: { text: 'You take back what was yours, and some of theirs.', food: 4, opinion: -20, anim: 'attack' }, fail: { text: 'They were ready for you.', pop: -2, opinion: -10 } },
      { label: 'Set a guard', check: { stat: 'tou', diff: 4 }, success: { text: 'The next time they come, they find you waiting.', opinion: -5, anim: 'rest' }, fail: { text: 'They come again. And again.', food: -3 } },
      { label: 'Offer to share', check: { stat: 'cha', diff: 5 }, success: { text: 'They are hungry too. A shared store is a safer store.', food: -2, opinion: 30, anim: 'social' }, fail: { text: 'They take the offer, and everything else.', food: -4 } },
    ],
  },
  {
    id: 't_band_marriage', stage: 'tribe', prop: 'hearts', title: 'Across the Line', tags: ['social'], species: 'band',
    when: (run) => run.species.some((s) => s.band && s.opinion >= 0),
    text: 'One of your young and one of the {them} have been meeting in secret. They want to live together.',
    options: [
      { label: 'Bless the match', check: { stat: 'cha', diff: 4 }, success: { text: 'A feast for both peoples. Something new begins.', opinion: 35, dna: 2, anim: 'social' }, fail: { text: 'The {them} refuse. There is shouting.', opinion: -15 } },
      { label: 'Forbid it', result: { text: 'They obey. Mostly.', opinion: -10, anim: 'rest' } },
      { label: 'Take them in, both', result: { text: 'One more voice in your {band}, and the {them} feel robbed.', pop: 1, opinion: -20, anim: 'grow' } },
    ],
  },
  {
    id: 't_band_trade', stage: 'tribe', prop: 'fruit', title: 'The First Trade', tags: ['social', 'food'], species: 'band',
    when: (run) => run.species.some((s) => s.band && s.opinion >= 10),
    text: 'The {them} come to your {camp} with things to offer, and they want something back.',
    options: [
      { label: 'Trade food for knowledge', hint: '−3 Food, a discovery', result: { text: 'They show you something your people never thought of.', food: -3, discovery: true, opinion: 15, anim: 'social' } },
      { label: 'Trade knowledge for food', hint: '+4 Food', result: { text: 'They leave delighted. Your stores are full.', food: 4, opinion: 10, anim: 'grow' } },
      { label: 'Drive a hard bargain', check: { stat: 'cun', diff: 5 }, success: { text: 'You get both, for very little.', food: 3, dna: 2, opinion: -5, anim: 'mutate' }, fail: { text: 'They feel cheated, and say so.', opinion: -20 } },
    ],
  },
  {
    id: 't_band_war', stage: 'tribe', prop: 'shadow', title: 'War Paint', tags: ['danger'], species: 'band',
    when: (run) => run.species.some((s) => s.band && s.opinion < -20),
    text: 'The {them} have painted themselves for war. They are coming.',
    options: [
      { label: 'Meet them in battle', check: { stat: 'str', diff: 6 }, success: { text: 'They break and run. They will not try that again soon.', opinion: -20, dna: 3, food: 2, anim: 'attack' }, fail: { text: 'A terrible day.', pop: -4 } },
      { label: 'Hold the {camp}', check: { stat: 'tou', diff: 5 }, success: { text: 'They cannot get in. In the end, they go home.', opinion: -5, anim: 'rest' }, fail: { text: 'They get in.', pop: -3, food: -2 } },
      { label: 'Sue for peace', check: { stat: 'cha', diff: 6 }, success: { text: 'Somehow, words win. The paint washes off.', opinion: 40, anim: 'social' }, fail: { text: 'They laugh, and attack.', pop: -3, opinion: -10 } },
    ],
  },
  {
    id: 't_tamed_trouble', stage: 'tribe', prop: 'nest', title: 'Restless Beasts', tags: ['food'], species: 'tamed',
    text: 'The {them} that live with your people are restless. Some have wandered off.',
    options: [
      { label: 'Round them up', check: { stat: 'spd', diff: 4 }, success: { text: 'Every one of them, back home by dusk.', anim: 'grow' }, fail: { text: 'Most of them come back. Some never do.', food: -2 } },
      { label: 'Let them go a while', result: { text: 'They come back on their own, fatter than before.', food: 2, anim: 'rest' } },
    ],
  },
  {
    id: 't_totem_omen', stage: 'tribe', prop: 'sun', title: 'The Totem Speaks', tags: ['explore'], species: 'totem',
    text: 'A {them}, your totem, has walked right into the middle of your {camp} and lain down. Everyone is staring.',
    options: [
      { label: 'Read it as a good sign', check: { stat: 'cha', diff: 3 }, success: { text: 'Your people are full of courage for days.', dna: 2, food: 1, anim: 'social' }, fail: { text: 'Nobody can agree what it means.', dna: 1 } },
      { label: 'Read it as a warning', result: { text: 'You move your stores somewhere safer. A storm comes that night.', food: 1, anim: 'rest' } },
    ],
  },
  {
    id: 't_new_idea', stage: 'tribe', prop: 'sparks', title: 'A Strange Idea', tags: ['explore'],
    text: 'Somebody has an idea so strange that half the {band} thinks they are mad.',
    options: [
      { label: 'Let them try it', check: { stat: 'cun', diff: 5 }, success: { text: 'It works. Of course it works. Everyone always believed in them.', discovery: true, anim: 'mutate' }, fail: { text: 'It does not work, very loudly.', food: -1, pop: -1 } },
      { label: 'Talk them out of it', result: { text: 'Safer. Duller.', dna: 1, anim: 'rest' } },
    ],
  },
  {
    id: 't_leader_age', stage: 'tribe', prop: 'stars', title: 'The Leader Grows Old', tags: ['social'],
    when: (run) => run.leader && run.turn - run.leader.since >= 10,
    text: '{leader} is slowing down. Some of the young say it is time for someone new.',
    options: [
      { label: 'Stand by {leader}', check: { stat: 'cha', diff: 4 }, success: { text: 'The old leader has one last good year in them, and teaches everything they know.', dna: 3, anim: 'social' }, fail: { text: 'The young split off and leave.', pop: -2 } },
      { label: 'Let {leader} step down', hint: 'Choose a new leader', result: { text: '{leader} steps aside with dignity.', leaderDies: true, anim: 'rest' } },
    ],
  },
  {
    id: 't_leader_dream', stage: 'tribe', prop: 'night', title: 'The Leader\'s Dream', tags: ['explore'],
    when: (run) => !!run.leader,
    text: '{leader} wakes from a dream, shaking. They say the {band} must move toward the rising sun.',
    options: [
      { label: 'Follow the dream', check: { stat: 'spd', diff: 4 }, success: { text: 'There is good land there. Maybe the dream was real.', food: 4, anim: 'grow' }, fail: { text: 'There is nothing there but a long walk back.', food: -2 } },
      { label: 'Stay put', result: { text: '{leader} sulks for days.', anim: 'rest' } },
    ],
  },
  {
    id: 't_challenge', stage: 'tribe', prop: 'bones', title: 'The Challenger', tags: ['social', 'danger'],
    when: (run) => !!run.leader,
    text: 'A strong young one has challenged {leader} for the right to lead.',
    options: [
      { label: '{leader} accepts', check: { stat: 'str', diff: 5 }, success: { text: 'The old leader wins, and is more respected than ever.', leaderTrait: 'brave', anim: 'attack' }, fail: { text: 'The old leader loses, and does not get up.', leaderDies: true } },
      { label: 'Let the {band} decide', check: { stat: 'cha', diff: 4 }, success: { text: 'The {band} chooses {leader}. The challenger accepts it.', dna: 2, anim: 'social' }, fail: { text: 'The {band} chooses the challenger.', leaderDies: true } },
    ],
  },
  {
    id: 't_feast', stage: 'tribe', prop: 'fruit', title: 'The Feast', tags: ['food', 'social'],
    when: (run) => run.food >= 6,
    text: 'The stores are full. Somebody says it is time for a feast.',
    options: [
      { label: 'Feast!', hint: '−4 Food', result: { text: 'Singing, dancing and far too much food. Nobody forgets this night.', food: -4, special: 2, dna: 2, anim: 'social' } },
      { label: 'Save it for hard times', result: { text: 'Hard times always come.', anim: 'rest' } },
    ],
  },
  {
    id: 't_lost_child', stage: 'tribe', prop: 'night', title: 'Lost', tags: ['explore', 'danger'],
    text: 'A child has wandered off and night is falling.',
    options: [
      { label: 'Everyone searches', check: { stat: 'spd', diff: 4 }, success: { text: 'Found, cold and scared, but fine. And they found a new place to forage, too.', food: 2, anim: 'grow' }, fail: { text: 'Found by morning, but someone else was hurt looking.', pop: -1 } },
      { label: 'Follow the tracks', check: { stat: 'cun', diff: 4 }, success: { text: 'Every broken stem leads you closer. Found.', dna: 2, anim: 'mutate' }, fail: { text: 'The tracks vanish at the water.', pop: -1 } },
    ],
  },
  {
    id: 't_painted_cave', stage: 'tribe', habitat: 'land', prop: 'cave', title: 'The Painted Wall', tags: ['explore'],
    text: 'Someone has pressed their hand, dipped in ash and red clay, against the wall of a cave. Now everyone wants to.',
    options: [
      { label: 'Paint the hunt', hint: '+3 Ideas', result: { text: 'The first story told without words.', dna: 3, anim: 'mutate' } },
      { label: 'Paint the {leader}', hint: 'Your leader becomes Kind', result: { text: 'Everyone loves it. Especially the leader.', leaderTrait: 'kind', anim: 'social' } },
    ],
  },
  {
    id: 't_flood', stage: 'tribe', habitat: 'land', prop: 'pond', title: 'The Flood', tags: ['danger'],
    text: 'The river has burst its banks and the water is rising toward the {camp}.',
    options: [
      { label: 'Run for high ground', check: { stat: 'spd', diff: 4 }, success: { text: 'Everyone makes it. Not everything does.', food: -2, anim: 'rest' }, fail: { text: 'The water was faster.', pop: -3 } },
      { label: 'Build a wall of earth', check: { stat: 'str', diff: 5 }, success: { text: 'It holds. Your people have never felt so strong.', dna: 3, anim: 'attack' }, fail: { text: 'It breaks.', pop: -2, food: -2 } },
    ],
  },
  {
    id: 't_honey', stage: 'tribe', habitat: 'land', prop: 'swarm', title: 'The Honey Tree', tags: ['food'],
    text: 'A hollow tree hums with stinging insects, and it drips with something sweet.',
    options: [
      { label: 'Smoke them out', hint: 'Needs 2 {resource}', req: { special: 2 }, result: { text: 'Sweet, sticky and only a few stings.', special: -2, food: 5, anim: 'grow' } },
      { label: 'Just grab it', check: { stat: 'tou', diff: 4 }, success: { text: 'Worth every sting.', food: 4, anim: 'attack' }, fail: { text: 'Not worth the stings.', pop: -1 } },
      { label: 'Leave it', result: { text: 'Sensible. Sad.', anim: 'rest' } },
    ],
  },
  {
    id: 't_grass_fire', stage: 'tribe', habitat: 'land', prop: 'fire', title: 'Wildfire', tags: ['danger'],
    text: 'Fire is racing across the grassland toward you, faster than anything can run.',
    options: [
      { label: 'Burn a firebreak', req: { ownPath: 'tool' }, check: { stat: 'cun', diff: 4 }, success: { text: 'You fight fire with fire, and win.', dna: 3, special: 2, anim: 'mutate' }, fail: { text: 'Your fire joins the other.', pop: -2, food: -2 } },
      { label: 'Run for the river', check: { stat: 'spd', diff: 5 }, success: { text: 'You wait it out in the water. The land is black, but you are alive.', food: -2, anim: 'rest' }, fail: { text: 'Not everyone reaches the water.', pop: -3 } },
    ],
  },
  {
    id: 't_storm_sea', stage: 'tribe', habitat: 'sea', prop: 'whirlpool', title: 'The Great Storm', tags: ['danger'],
    text: 'The surface boils. Even down here, the water is wild and full of sand.',
    options: [
      { label: 'Dive deep and wait', check: { stat: 'tou', diff: 4 }, success: { text: 'Cold and dark, but calm. Everyone comes back up.', food: -1, anim: 'rest' }, fail: { text: 'Some are swept away.', pop: -3 } },
      { label: 'Shelter in the {camp}', check: { stat: 'cun', diff: 4 }, success: { text: 'You chose the spot well. It holds.', dna: 2, anim: 'rest' }, fail: { text: 'It collapses.', pop: -2, food: -2 } },
    ],
  },
  {
    id: 't_whale_fall', stage: 'tribe', habitat: 'sea', prop: 'carcass', title: 'The Whale Fall', tags: ['food', 'explore'],
    text: 'Something enormous has died and sunk to the sea floor. It will feed everything for miles, for years.',
    options: [
      { label: 'Claim it for your {band}', check: { stat: 'str', diff: 4 }, success: { text: 'It is yours. Others will have to ask.', food: 6, anim: 'attack' }, fail: { text: 'Bigger things got there first.', pop: -1 } },
      { label: 'Share it with everyone', result: { text: 'Every kind in the deep remembers who shared.', food: 3, dna: 2, anim: 'social' } },
    ],
  },
  {
    id: 't_shipwreck', stage: 'tribe', habitat: 'sea', prop: 'bones', title: 'The Sunken Forest', tags: ['explore'],
    text: 'A whole drowned forest lies on the sea floor, its trunks gone hard and strange.',
    options: [
      { label: 'Explore it', check: { stat: 'spd', diff: 4 }, success: { text: 'Hidden corners full of food and odd shapes to learn from.', food: 2, dna: 2, anim: 'grow' }, fail: { text: 'It is a maze. Some of you get lost.', pop: -1 } },
      { label: 'Make it your {camp}', check: { stat: 'tou', diff: 4 }, success: { text: 'Safe walls, ready-made.', trait: 'cooperative', anim: 'rest' }, fail: { text: 'It is already someone else\'s home.', pop: -1 } },
    ],
  },
  {
    id: 't_red_tide', stage: 'tribe', habitat: 'sea', prop: 'bloom', title: 'Red Water', tags: ['danger', 'food'],
    text: 'The water has turned red and bitter. Fish float belly-up all around the {camp}.',
    options: [
      { label: 'Move away from it', check: { stat: 'spd', diff: 4 }, success: { text: 'You outswim the red water.', food: -1, anim: 'rest' }, fail: { text: 'It catches up with the slowest.', pop: -2 } },
      { label: 'Eat what you stored', result: { text: 'You live off your stores until the water clears.', food: -4, anim: 'rest' } },
    ],
  },

  // ----- Toolmakers -----
  {
    id: 't_tool_spear', stage: 'tribe', path: 'tool', prop: 'stick', title: 'The Long Point', tags: ['hunt'],
    text: 'A sharp stone tied to a long stick. Now your hunters can strike from out of reach.',
    options: [
      { label: 'Make spears for everyone', hint: '−2 {resource}, +1 gear', req: { special: 2 }, result: { text: 'Every hunter carries one now.', special: -2, gear: 1, anim: 'attack' } },
      { label: 'Keep it for the best hunters', result: { text: 'They bring back more meat than ever.', food: 3, anim: 'attack' } },
    ],
  },
  {
    id: 't_tool_fire_out', stage: 'tribe', path: 'tool', prop: 'night', title: 'The Fire Goes Out', tags: ['danger'],
    when: (run) => (run.special || 0) >= 2,
    text: 'Rain all night, and the {keeper} fell asleep. In the morning, the {resource} is cold.',
    options: [
      { label: 'Make it again from nothing', check: { stat: 'cun', diff: 5 }, success: { text: 'Two sticks, hours of work, and then smoke. You can make it whenever you want now.', special: 1, dna: 3, anim: 'mutate' }, fail: { text: 'Nothing. You must wait for lightning.', special: -4 } },
      { label: 'Beg embers from the strangers', req: { band: true }, check: { stat: 'cha', diff: 4 }, success: { text: 'They give you a coal, wrapped in leaves.', special: -1, anim: 'social' }, fail: { text: 'They laugh at you.', special: -4 } },
      { label: 'Punish the {keeper}', result: { text: 'It does not bring the fire back.', special: -4, anim: 'attack' } },
    ],
  },
  {
    id: 't_tool_cooking', stage: 'tribe', path: 'tool', prop: 'fire', title: 'Cooked', tags: ['food'],
    text: 'A piece of meat fell into the {resource}. Someone ate it anyway. Now everyone wants theirs that way.',
    options: [
      { label: 'Cook everything', hint: '−1 {resource}, +1 member', result: { text: 'Food goes further, and fewer people get sick.', special: -1, food: 2, pop: 1, anim: 'grow' } },
      { label: 'Only for feasts', result: { text: 'Something to look forward to.', dna: 1, food: 1, anim: 'rest' } },
    ],
  },
  {
    id: 't_tool_knapper', stage: 'tribe', path: 'tool', prop: 'bones', title: 'The Master Knapper', tags: ['explore'],
    text: 'One of your people makes blades so fine they can split a hair. Others want to learn.',
    options: [
      { label: 'Let them teach', check: { stat: 'cun', diff: 4 }, success: { text: 'Soon every hand in the {band} can do it.', gear: 1, dna: 2, anim: 'mutate' }, fail: { text: 'The secret is hard to pass on.', dna: 1 } },
      { label: 'Make them leader', hint: 'New leader: Clever', result: { text: 'A maker, not a fighter, leads you now.', leaderTrait: 'clever', anim: 'social' } },
    ],
  },
  {
    id: 't_tool_trap', stage: 'tribe', path: 'tool', prop: 'stick', title: 'The Snare', tags: ['hunt', 'food'], species: 'wild',
    text: 'A loop of twisted fibre catches a {them} by the leg. It works while you sleep.',
    options: [
      { label: 'Set snares everywhere', hint: '+4 Food', result: { text: 'Meat every morning. The {them} learn to fear your people.', food: 4, opinion: -15, anim: 'attack' } },
      { label: 'Use them to catch the {them} alive', check: { stat: 'cha', diff: 4 }, success: { text: 'Caught gently, fed and kept. They stop trying to leave.', tame: true, anim: 'social' }, fail: { text: 'They chew through and flee.', opinion: -10 } },
    ],
  },
  {
    id: 't_tool_beast_fire', stage: 'tribe', path: 'tool', prop: 'fire', title: 'Eyes in the Dark', tags: ['danger'], species: 'predator',
    text: 'At night, the eyes of the {them} glow at the edge of your {resource}-light.',
    options: [
      { label: 'Throw burning branches', hint: 'Needs 3 {resource}', req: { special: 3 }, result: { text: 'They have never seen anything like it. They do not come back.', special: -2, opinion: -15, dna: 2, anim: 'attack' } },
      { label: 'Build the {resource} higher', check: { stat: 'tou', diff: 4 }, success: { text: 'They wait all night and slink away at dawn.', special: -1, anim: 'rest' }, fail: { text: 'One gets in.', pop: -2 } },
    ],
  },
  {
    id: 't_tool_raft', stage: 'tribe', path: 'tool', habitat: 'land', prop: 'shore', title: 'Something That Floats', tags: ['explore'],
    text: 'Logs lashed together carry a child across the river, laughing.',
    options: [
      { label: 'Build more', check: { stat: 'cun', diff: 4 }, success: { text: 'Now the river is a road, not a wall.', discovery: true, anim: 'mutate' }, fail: { text: 'It sinks. The child is fine.', dna: 1 } },
      { label: 'Too dangerous', result: { text: 'The river stays where it is.', anim: 'rest' } },
    ],
  },
  {
    id: 't_tool_vent_glass', stage: 'tribe', path: 'tool', habitat: 'sea', prop: 'vent', title: 'Vent Glass', tags: ['explore'],
    text: 'Near the hottest vent, sand has melted into a black glass sharper than any shell.',
    options: [
      { label: 'Gather it carefully', check: { stat: 'tou', diff: 4 }, success: { text: 'Burned fins, but the finest blades in the deep.', gear: 1, anim: 'attack' }, fail: { text: 'Too hot.', pop: -1 } },
      { label: 'Study how it forms', check: { stat: 'cun', diff: 4 }, success: { text: 'Your {keeper} can make it now.', special: 3, dna: 2, anim: 'mutate' }, fail: { text: 'It keeps its secrets.', dna: 1 } },
    ],
  },

  // ----- Singers -----
  {
    id: 't_song_echo', stage: 'tribe', path: 'song', prop: 'cave', title: 'The Echo', tags: ['explore'],
    text: 'In a hollow place, your song comes back to you, changed. It sounds like a second choir answering.',
    options: [
      { label: 'Sing with the echo', hint: '+3 Song', result: { text: 'Harmony, for the first time.', special: 3, anim: 'social' } },
      { label: 'Listen to how it changes', check: { stat: 'cun', diff: 4 }, success: { text: 'The echo tells you how big the space is, and what is in it.', discovery: true, anim: 'mutate' }, fail: { text: 'It is just an echo.', dna: 1 } },
    ],
  },
  {
    id: 't_song_rival_voice', stage: 'tribe', path: 'song', prop: 'notes', title: 'A Rival Voice', tags: ['social'],
    text: 'A young singer has made a new song, and the young ones love it. The {keeper} says it is noise.',
    options: [
      { label: 'Side with the old song', result: { text: 'The old ways hold. The young sulk.', special: 2, anim: 'rest' } },
      { label: 'Side with the new song', check: { stat: 'cha', diff: 4 }, success: { text: 'The new song spreads. Even the {keeper} hums it, eventually.', dna: 3, anim: 'social' }, fail: { text: 'The {band} splits into two camps.', pop: -1, special: -2 } },
      { label: 'Weave them together', check: { stat: 'cun', diff: 5 }, success: { text: 'A song with old roots and new branches.', special: 3, dna: 2, anim: 'mutate' }, fail: { text: 'It pleases nobody.', special: -1 } },
    ],
  },
  {
    id: 't_song_lullaby', stage: 'tribe', path: 'song', prop: 'night', title: 'The Lullaby', tags: ['social'],
    text: 'A mother sings a song so gentle that the whole {camp} falls asleep, even the guards.',
    options: [
      { label: 'Teach it to everyone', hint: '+1 member', result: { text: 'Children sleep, parents rest, and more of them grow up strong.', pop: 1, special: 1, anim: 'rest' } },
      { label: 'Sing it to the beasts', check: { stat: 'cha', diff: 5 }, success: { text: 'Even the wild ones lie down to listen.', dna: 2, anim: 'social' }, fail: { text: 'The beasts are not impressed.', anim: 'rest' } },
    ],
  },
  {
    id: 't_song_map', stage: 'tribe', path: 'song', prop: 'stars', title: 'The Song of the Way', tags: ['explore'],
    text: 'An old song lists every landmark on the way to the far feeding grounds. Nobody has made the trip in generations.',
    options: [
      { label: 'Follow the song', check: { stat: 'spd', diff: 4 }, success: { text: 'Every landmark is where the song says it is. The feeding grounds are rich.', food: 5, anim: 'grow' }, fail: { text: 'One verse was wrong.', pop: -1, food: -1 } },
      { label: 'Add a verse of your own', hint: '+2 Song, +1 Idea', result: { text: 'The song grows.', special: 2, dna: 1, anim: 'mutate' } },
    ],
  },
  {
    id: 't_song_silence', stage: 'tribe', path: 'song', prop: 'shadow', title: 'The Silence', tags: ['danger'], species: 'predator',
    text: 'The {them} hunt by sound. Every time you sing, more of them come.',
    options: [
      { label: 'Stop singing for a season', result: { text: 'The {them} lose interest. So do your people.', special: -4, anim: 'rest' } },
      { label: 'Sing louder, all together', check: { stat: 'cha', diff: 5 }, success: { text: 'A wall of sound. The {them} flee from it.', special: 2, opinion: -15, anim: 'social' }, fail: { text: 'They come anyway.', pop: -3 } },
      { label: 'Sing somewhere else to lure them', check: { stat: 'spd', diff: 4 }, success: { text: 'They chase a song with nobody in it.', dna: 2, anim: 'mutate' }, fail: { text: 'The lure is caught.', pop: -1 } },
    ],
  },
  {
    id: 't_song_beast_song', stage: 'tribe', path: 'song', prop: 'notes', title: 'They Sing Back', tags: ['social'], species: 'wild',
    text: 'When your people sing, the {them} answer: a call, the same every time.',
    options: [
      { label: 'Learn their call', check: { stat: 'cha', diff: 4 }, success: { text: 'You call, and they come. They trust you now.', tame: true, anim: 'social' }, fail: { text: 'You call wrong. They flee.', opinion: -10 } },
      { label: 'Put their call in your song', hint: '+2 Song', result: { text: 'A new verse with an animal voice in it.', special: 2, opinion: 10, anim: 'social' } },
    ],
  },
  {
    id: 't_song_hum', stage: 'tribe', path: 'song', habitat: 'land', prop: 'tree', title: 'The Humming Hill', tags: ['explore'],
    text: 'When the wind blows over a certain hill, the rocks hum a note your people have never heard.',
    options: [
      { label: 'Sing there every night', hint: '+3 Song', result: { text: 'Your songs sound older there, and truer.', special: 3, anim: 'social' } },
      { label: 'Find out why', check: { stat: 'cun', diff: 4 }, success: { text: 'Hollow stones. You can make them hum yourselves now.', discovery: true, anim: 'mutate' }, fail: { text: 'The hill keeps its secret.', dna: 1 } },
    ],
  },
  {
    id: 't_song_deep_voice', stage: 'tribe', path: 'song', habitat: 'sea', prop: 'whirlpool', title: 'The Deep Voice', tags: ['explore'],
    text: 'Far below, something sings in a voice so low it can be felt more than heard. It sings your song back to you, slowly.',
    options: [
      { label: 'Answer it', check: { stat: 'cha', diff: 5 }, success: { text: 'Whatever it is, it knows you now. Your songs carry farther.', special: 4, dna: 2, anim: 'social' }, fail: { text: 'It falls silent and never sings again.', special: -2 } },
      { label: 'Swim away quietly', result: { text: 'Some things are better left alone.', anim: 'rest' } },
    ],
  },
);

// Founding: the Tribe stage's finale. Each option leads to one of three endings: Settle, Roam or Conquer.
(function () {
  const F = {
    tool: {
      land: { title: 'The Founding Fire', prop: 'fire', text: 'Your {band} is strong now, and the {resource} has never gone out. The elders say it is time to decide what your people will become.' },
      sea: { title: 'The Founding Vent', prop: 'vent', text: 'Your {band} has grown around the warm vents. The elders say it is time to decide what your people will become.' },
    },
    song: {
      land: { title: 'The Founding Song', prop: 'notes', text: 'Your {band} knows a song for everything now. The elders say there is one song left to write: what your people will become.' },
      sea: { title: 'The Founding Song', prop: 'notes', text: 'Your {band} sings across whole oceans now. The elders say there is one song left to write: what your people will become.' },
    },
  };
  const ROADS = [['settle', 'tou', 'Stay and build'], ['roam', 'spd', 'Keep moving'], ['conquer', 'str', 'Rule the others']];
  Object.entries(F).forEach(([path, byHab]) => Object.entries(byHab).forEach(([hab, f]) => {
    G.EVENTS.push({ id: `founding_${path}_${hab}`, stage: 'tribe', finale: true, habitat: hab, path, prop: f.prop, title: f.title, text: f.text,
      options: ROADS.map(([road, stat, verb]) => { const e = G.TRIBE_ENDINGS[path][hab][road]; return { label: `${verb}: ${e.name}`, hint: e.desc, check: { stat, diff: 5 },
        success: { text: `${e.desc} Your ${hab === 'sea' && path === 'tool' ? 'clan' : '{band}'} becomes a people.`, tribeEnding: road, anim: stat === 'str' ? 'attack' : stat === 'spd' ? 'grow' : 'social' },
        fail: { text: 'Not yet. Your people are not ready to agree.', pop: -3, setback: 0 } }; }) });
  }));
}());

G.EVENT = {};
G.EVENTS.forEach((e) => { G.EVENT[e.id] = e; });
