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
  {
    id: 'creature_finale', prop: 'fire', stage: 'creature', finale: true, habitat: 'land', title: 'The First Tribe',
    text: 'Your kind knows itself now. Around you, the world waits. What you do next decides how your people begin.',
    options: [
      { label: 'Tame the fire', req: { innovation: 'stone_tools' }, check: { stat: 'cun', diff: 5 }, success: { text: 'You carry a burning branch home. You are the Firekeepers.', legacy: 'firekeepers', anim: 'mutate' }, fail: { text: 'The fire takes more than it gives. Not yet.', pop: -3, setback: 0 } },
      { label: 'Unite the peoples of the valley', req: { innovation: 'vocal_language' }, check: { stat: 'cha', diff: 5 }, success: { text: 'Other species gather with yours under one sky. You are the Unifiers.', legacy: 'unifiers', anim: 'social' }, fail: { text: 'The gathering ends in a stampede. Not yet.', pop: -3, setback: 0 } },
      { label: 'Spread to every corner of the land', check: { stat: 'spd', diff: 5 }, success: { text: 'Your kind walks over every horizon and settles everywhere. You are the Wanderers.', legacy: 'wanderers', anim: 'flee' }, fail: { text: 'The far lands turn you back. Not yet.', pop: -3, setback: 0 } },
      { label: 'Conquer the valley with war bands', req: { innovation: 'war_bands' }, check: { stat: 'str', diff: 5 }, success: { text: 'Your war bands sweep the valley. Nothing can stand against you. You are the Conquerors.', legacy: 'conquerors', anim: 'attack' }, fail: { text: 'A war with no winners. Not yet.', pop: -3, setback: 0 } },
    ],
  },
  {
    id: 'creature_finale_sea', prop: 'notes', stage: 'creature', finale: true, habitat: 'sea', title: 'The First Pod',
    text: 'Your kind knows itself now. The ocean is vast, and it is listening. What you do next decides how your people begin.',
    options: [
      { label: 'Sing the first song', check: { stat: 'cha', diff: 5 }, success: { text: 'A song that carries across whole oceans. You are the Deep Singers.', legacy: 'deep_singers', anim: 'social' }, fail: { text: 'The song falls apart. Not yet.', pop: -3, setback: 0 } },
      { label: 'Build a reef city', req: { innovation: 'shelters' }, check: { stat: 'cun', diff: 5 }, success: { text: 'You shape the coral into homes. You are the Reef Builders.', legacy: 'reef_builders', anim: 'grow' }, fail: { text: 'The reef crumbles. Not yet.', pop: -3, setback: 0 } },
      { label: 'Rule the currents', check: { stat: 'str', diff: 5 }, success: { text: 'Every creature in the sea knows your name. You are the Tide Lords.', legacy: 'tide_lords', anim: 'attack' }, fail: { text: 'The sea does not bow so easily. Not yet.', pop: -3, setback: 0 } },
      { label: 'Shape shell and stone into tools', req: { innovation: 'stone_tools' }, check: { stat: 'cun', diff: 5 }, success: { text: 'Shell blades, stone hammers, sponge gloves. You are the Shell Smiths.', legacy: 'shell_smiths', anim: 'mutate' }, fail: { text: 'The shells crack in your grip. Not yet.', pop: -3, setback: 0 } },
      { label: 'Tame the heat of the vents', req: { zone: 'abyss' }, check: { stat: 'cun', diff: 5 }, success: { text: 'You learn to carry the deep warmth with you: the sea\'s own fire. You are the Vent Keepers.', legacy: 'vent_keepers', anim: 'mutate' }, fail: { text: 'The vent scalds you. Not yet.', pop: -3, setback: 0 } },
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
];

// Endings that a winning run can earn. Shown in the Codex.
G.LEGACIES = {
  firekeepers: { name: 'The Firekeepers', desc: 'Your tribe will begin with fire.' },
  unifiers: { name: 'The Unifiers', desc: 'Your tribe will begin with allies.' },
  conquerors: { name: 'The Conquerors', desc: 'Your tribe will begin feared and armed.' },
  wanderers: { name: 'The Wanderers', desc: 'Your tribes will begin scattered across the whole world.' },
  deep_singers: { name: 'The Deep Singers', desc: 'Your people will begin with a language that crosses oceans.' },
  reef_builders: { name: 'The Reef Builders', desc: 'Your people will begin with a city of coral.' },
  tide_lords: { name: 'The Tide Lords', desc: 'Your people will begin as masters of the sea.' },
  shell_smiths: { name: 'The Shell Smiths', desc: 'Your people will begin with tools of shell and stone.' },
  vent_keepers: { name: 'The Vent Keepers', desc: 'Your people will begin with the warmth of the deep vents, the sea\'s own fire.' },
};

G.EVENT = {};
G.EVENTS.forEach((e) => { G.EVENT[e.id] = e; });
