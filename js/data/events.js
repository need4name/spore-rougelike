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
//   req        { diet: ['carn','omni'], keyword: ['venom', 2], trait, part, food, tag: 'grasp', innovation }
//   check      { stat: 'spd', diff: 3 }  rolls against a stat, then uses success / fail
//   result     outcome when there is no check
//   success / fail / result:
//     { text, pop, food, dna, insight, trait, loseTrait, opinion, randomPart, legacy, habitat, setback, anim }
//     anim: 'attack' | 'flee' | 'eat' | 'hurt' | 'mutate' | 'social' | 'rest' | 'grow' (picked automatically if left out)
window.G = window.G || {};

G.EVENTS = [
  // ======================= CELL STAGE =======================
  {
    id: 'larger_shadow', stage: 'cell', title: 'A Shadow Above', tags: ['danger'], species: 'predator',
    text: 'A {them} drifts over your colony, ten times your size. Its membrane ripples as it tastes the water for you.',
    options: [
      { label: 'Dart away', check: { stat: 'spd', diff: 3 }, success: { text: 'You scatter faster than it can follow.', dna: 2 }, fail: { text: 'It catches the slowest of you.', pop: -2, dna: 1 } },
      { label: 'Go still in the silt', check: { stat: 'cun', diff: 2 }, success: { text: 'It passes over without noticing.', dna: 1, trait: 'cautious', anim: 'rest' }, fail: { text: 'It finds you anyway.', pop: -2 } },
      { label: 'Bristle your spikes', req: { keyword: ['armor', 1] }, result: { text: 'It recoils from your armor and tears itself on the way. You eat the scraps.', food: 3, trait: 'feared', opinion: -20, anim: 'attack' } },
      { label: 'Let it swallow some of you', hint: 'Risky', check: { stat: 'tou', diff: 4 }, success: { text: 'The swallowed cells survive inside it, then take it over from within. Something new is born.', dna: 5, trait: 'endosymbiont', anim: 'mutate' }, fail: { text: 'Its digestive juices are stronger than you are.', pop: -3, dna: 1 } },
    ],
  },
  {
    id: 'warm_current', stage: 'cell', title: 'The Warm Current', tags: ['explore'],
    text: 'A warm current sweeps you up, thick with strange molecules from somewhere far away.',
    options: [
      { label: 'Ride it', check: { stat: 'spd', diff: 2 }, success: { text: 'You travel farther than any of your ancestors.', dna: 3, anim: 'flee' }, fail: { text: 'You tumble out, dizzy and scattered.', food: -2, dna: 1, anim: 'hurt' } },
      { label: 'Cling on and feed in its wake', result: { text: 'The current leaves plenty behind.', food: 3 } },
    ],
  },
  {
    id: 'algae_bloom', stage: 'cell', title: 'Algae Bloom', tags: ['food'], species: 'prey',
    text: 'The water around you turns green. An algae bloom is spreading, and swarms of {them} follow it.',
    options: [
      { label: 'Gorge on the algae', req: { diet: ['herb', 'omni'] }, result: { text: 'You eat until you can barely move.', food: 5 } },
      { label: 'Ambush the {them}', req: { diet: ['carn', 'omni'] }, check: { stat: 'str', diff: 2 }, success: { text: 'They are too busy eating to notice you.', food: 5, dna: 1 }, fail: { text: 'They scatter before you strike.', food: 1 } },
      { label: 'Let it wash over you', result: { text: 'You learn the rhythm of blooms and seasons.', dna: 1, anim: 'rest' } },
    ],
  },
  {
    id: 'strange_molecule', stage: 'cell', title: 'A Strange Molecule', tags: ['explore'],
    text: 'A glittering chain of atoms bumps against your membrane, humming with energy.',
    options: [
      { label: 'Let it in', check: { stat: 'tou', diff: 3 }, success: { text: 'It rewrites part of you. You feel more.', dna: 4, anim: 'mutate' }, fail: { text: 'It burns going in, but changes you all the same.', pop: -1, dna: 2 } },
      { label: 'Probe it carefully', check: { stat: 'cun', diff: 3 }, success: { text: 'You learn its secrets without getting hurt.', dna: 3, trait: 'curious' }, fail: { text: 'It falls apart in your grip.', dna: 1 } },
      { label: 'Push it away', result: { text: 'Some things are better left alone.', anim: 'rest' } },
    ],
  },
  {
    id: 'kin_cell', stage: 'cell', title: 'Kin', tags: ['social'], multi: false,
    text: 'A cell almost exactly like you presses against your membrane. It is not food. It might be family.',
    options: [
      { label: 'Fuse with it', result: { text: 'Two become one, and one becomes stronger.', pop: 2, anim: 'grow' } },
      { label: 'Cooperate', check: { stat: 'cha', diff: 2 }, success: { text: 'You feed side by side.', food: 2, trait: 'social' }, fail: { text: 'It drifts off, uninterested.', dna: 1 } },
      { label: 'Eat it', req: { diet: ['carn', 'omni'] }, check: { stat: 'str', diff: 2 }, success: { text: 'Family tastes much like everything else.', food: 4, trait: 'aggressive' }, fail: { text: 'It fights back hard.', pop: -1 } },
    ],
  },
  {
    id: 'viral_ghost', stage: 'cell', title: 'Viral Ghost', tags: ['danger'],
    text: 'A virus has latched onto you and is slipping its code into yours.',
    options: [
      { label: 'Fight it off', check: { stat: 'tou', diff: 3 }, success: { text: 'You destroy it and remember how.', dna: 2, trait: 'resilient' }, fail: { text: 'It sickens many of you before it dies.', pop: -2 } },
      { label: 'Let it rewrite you', hint: 'Random mutation', result: { text: 'You let the stranger edit you.', pop: -1, randomPart: true } },
    ],
  },
  {
    id: 'sunlit_shallows', stage: 'cell', title: 'Sunlit Shallows', tags: ['food'],
    text: 'An upwelling lifts you into bright, warm water. Sunlight pours through you.',
    options: [
      { label: 'Bask', req: { keyword: ['symbiont', 1] }, result: { text: 'Your passengers drink the light and feed you well.', food: 4, pop: 1 } },
      { label: 'Feed on what the sun grows', req: { diet: ['herb', 'omni'] }, result: { text: 'Fresh algae everywhere.', food: 3 } },
      { label: 'Sink back to the depths', result: { text: 'The deep holds more secrets.', dna: 2, food: -1 } },
    ],
  },
  {
    id: 'toxic_plume', stage: 'cell', title: 'Toxic Plume', origins: ['toxic', 'vents'], tags: ['danger'],
    text: 'A cloud of poison rolls toward you. Everything it touches stops moving.',
    options: [
      { label: 'Endure it', check: { stat: 'tou', diff: 3 }, success: { text: 'You survive what others cannot.', dna: 3 }, fail: { text: 'The poison eats at you.', pop: -2, dna: 1 } },
      { label: 'Flee', check: { stat: 'spd', diff: 2 }, success: { text: 'You outrun the cloud.', dna: 1 }, fail: { text: 'It catches the edge of you.', pop: -1 } },
      { label: 'Absorb the toxins', req: { keyword: ['venom', 1] }, result: { text: 'Poison is just another meal to you.', dna: 3, trait: 'toxic_affinity', anim: 'eat' } },
    ],
  },
  {
    id: 'thermal_vent', stage: 'cell', title: 'Thermal Vent', origins: ['vents'], tags: ['food', 'explore'],
    text: 'The seafloor cracks open beneath you. Black smoke pours out, and the water boils with chemical energy.',
    options: [
      { label: 'Feed on the chemicals', check: { stat: 'cun', diff: 2 }, success: { text: 'You learn to eat stone-breath.', food: 3, dna: 2 }, fail: { text: 'You get too close and scald yourself.', pop: -2 } },
      { label: 'Drift clear', result: { text: 'You stay safe and learn little.', dna: 1, anim: 'flee' } },
    ],
  },
  {
    id: 'ice_crystal', stage: 'cell', title: 'Ice Crystal', origins: ['frozen'], tags: ['danger'],
    text: 'The water freezes around you. An ice crystal slowly closes in.',
    options: [
      { label: 'Shelter inside it', check: { stat: 'tou', diff: 2 }, success: { text: 'The ice keeps predators away while you rest.', pop: 2, anim: 'rest' }, fail: { text: 'The cold bites deep.', pop: -1 } },
      { label: 'Break free', check: { stat: 'str', diff: 2 }, success: { text: 'You crack it open and grow stronger.', dna: 2, anim: 'attack' }, fail: { text: 'Exhausting work.', food: -2 } },
    ],
  },
  {
    id: 'rotifer_swarm', stage: 'cell', title: 'The Swarm', tags: ['danger', 'hunt'], species: 'predator',
    text: 'A swarm of {them} sweeps toward you, spinning mouths open.',
    options: [
      { label: 'Fight', check: { stat: 'str', diff: 3 }, success: { text: 'You eat the ones that try to eat you.', food: 4, dna: 1, opinion: -15 }, fail: { text: 'They take their share of you.', pop: -2 } },
      { label: 'Scatter', check: { stat: 'spd', diff: 3 }, success: { text: 'You slip between them.', dna: 1 }, fail: { text: 'Too slow.', pop: -2 } },
      { label: 'Flash to confuse them', req: { keyword: ['glow', 1] }, result: { text: 'Your light sends them spinning the wrong way.', dna: 2, trait: 'dazzling', anim: 'mutate' } },
    ],
  },
  {
    id: 'dead_giant', stage: 'cell', title: 'The Dead Giant', tags: ['food'],
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
    id: 'cell_division', stage: 'cell', title: 'Runaway Division', tags: ['social'],
    text: 'Conditions are perfect. Your cells begin dividing faster than ever.',
    options: [
      { label: 'Let it happen', check: { stat: 'tou', diff: 2 }, success: { text: 'The colony swells.', pop: 2, anim: 'grow' }, fail: { text: 'Too fast. Many come out wrong.', pop: -1, dna: 2, anim: 'mutate' } },
      { label: 'Divide carefully', result: { text: 'Slow and steady.', pop: 1, food: -1, anim: 'grow' } },
    ],
  },
  {
    id: 'colony_split', stage: 'cell', title: 'A Split Colony', tags: ['danger'], multi: true,
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
    id: 'lean_tide', stage: 'cell', title: 'Lean Tide', repeat: true, weight: 0.6, tags: ['food'],
    text: 'The tide goes out and takes the food with it.',
    options: [
      { label: 'Tighten your membrane and wait', result: { text: 'You make do with less.', food: -2, anim: 'rest' } },
      { label: 'Search far afield', check: { stat: 'spd', diff: 2 }, success: { text: 'You find a fresh patch.', food: 2, anim: 'flee' }, fail: { text: 'Nothing out there either.', food: -2, pop: -1 } },
    ],
  },

  // ----- Cell milestone and finale -----
  {
    id: 'multicellularity', stage: 'cell', milestone: true, title: 'Many Become One',
    text: 'Your cells have stopped drifting apart after dividing. They cling together, share food, and pass signals. You are no longer a cell. You are a colony, and soon a body.',
    options: [
      { label: 'Grow in a ring', hint: 'Radial Colony', result: { text: 'You face every direction at once.', trait: 'radial_plan', anim: 'grow' } },
      { label: 'Grow a head and a tail', hint: 'Streamlined Body', result: { text: 'You swim forward with purpose.', trait: 'streamlined_plan', anim: 'grow' } },
      { label: 'Anchor to a rock and grow', hint: 'Anchored Colony', result: { text: 'The current brings food to you.', trait: 'sessile_plan', anim: 'grow' } },
    ],
  },
  {
    id: 'cell_finale', stage: 'cell', finale: true, title: 'The Edge of the Sea',
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
    id: 'stalker', stage: 'creature', title: 'The Stalker', tags: ['danger'], species: 'predator',
    text: 'A {them} has started following your herd. Every night, one fewer of you comes home.',
    options: [
      { label: 'Turn and fight', check: { stat: 'str', diff: 4 }, success: { text: 'It flees, bleeding. Your young will remember this.', dna: 3, trait: 'aggressive', opinion: -20 }, fail: { text: 'It drags another one away.', pop: -3 } },
      { label: 'Move to new grounds', check: { stat: 'spd', diff: 3 }, success: { text: 'You leave it behind.', dna: 2, trait: 'migratory' }, fail: { text: 'It follows you.', pop: -2 } },
      { label: 'Let it bite something poisonous', req: { keyword: ['venom', 1] }, result: { text: 'It takes one bite of your poisoned skin and staggers away, sick.', dna: 3, trait: 'feared', opinion: -30, anim: 'attack' } },
      { label: 'Lead it toward another herd', req: { trait: 'aggressive' }, result: { text: 'Someone else pays the price this time.', dna: 2, anim: 'flee' } },
    ],
  },
  {
    id: 'mating_season', stage: 'creature', title: 'Mating Season', tags: ['social'],
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
      { label: 'Drive them off', check: { stat: 'str', diff: 3 }, success: { text: 'They will not come back soon.', food: 2, opinion: -30, anim: 'attack' }, fail: { text: 'They stand their ground.', pop: -1, opinion: -20 } },
      { label: 'Watch and learn', check: { stat: 'cun', diff: 2 }, success: { text: 'You learn where they find food.', dna: 2, food: 1 }, fail: { text: 'They notice you watching.', opinion: -5 } },
    ],
  },
  {
    id: 'prey_herd', stage: 'creature', title: 'A Herd of {them}', tags: ['hunt'], species: 'prey', repeat: true,
    text: 'A herd of {them} is passing through. Their young lag behind.',
    options: [
      { label: 'Hunt them', req: { diet: ['carn', 'omni'] }, check: { stat: 'str', diff: 3 }, success: { text: 'A good hunt.', food: 5, dna: 1, opinion: -10 }, fail: { text: 'The adults turn on you.', pop: -2 } },
      { label: 'Run one down', req: { diet: ['carn', 'omni'] }, check: { stat: 'spd', diff: 3 }, success: { text: 'It never had a chance.', food: 4, dna: 1, opinion: -10 }, fail: { text: 'They are faster than they look.', food: -1 } },
      { label: 'Follow them to good grazing', req: { diet: ['herb', 'omni'] }, result: { text: 'They know where the best food is.', food: 3 } },
      { label: 'Let them go', result: { text: 'They pass in peace.', opinion: 5, anim: 'rest' } },
    ],
  },
  {
    id: 'rival_contest', stage: 'creature', title: 'Contested Ground', tags: ['danger', 'food'], species: 'rival', repeat: true,
    text: 'The {them} want the same feeding grounds you do. They have started pushing in.',
    options: [
      { label: 'Defend your ground', check: { stat: 'tou', diff: 4 }, success: { text: 'They break against you and retreat.', dna: 2, trait: 'territorial', opinion: -15 }, fail: { text: 'They take the best of it.', food: -3 } },
      { label: 'Strike first', check: { stat: 'str', diff: 4 }, success: { text: 'You drive them from the valley.', dna: 3, food: 2, opinion: -30 }, fail: { text: 'Your attack falls apart.', pop: -2, opinion: -15 } },
      { label: 'Agree to share', check: { stat: 'cha', diff: 4 }, success: { text: 'An uneasy truce.', opinion: 30, dna: 1, anim: 'social' }, fail: { text: 'They take this as weakness.', food: -2, opinion: -10 } },
    ],
  },
  {
    id: 'drought', stage: 'creature', title: 'Drought', habitat: 'land', tags: ['food', 'danger'],
    text: 'The rains have not come. Your rivers shrink to puddles, and your young grow thin.',
    options: [
      { label: 'Migrate', check: { stat: 'spd', diff: 3 }, success: { text: 'You find a valley the drought has not reached.', food: 2, trait: 'migratory', anim: 'flee' }, fail: { text: 'The journey costs you.', pop: -2, food: -2 } },
      { label: 'Dig for water', req: { part: 'digging_forelegs' }, result: { text: 'Your forelegs find water under the riverbed.', pop: 1, dna: 2 } },
      { label: 'Endure it', check: { stat: 'tou', diff: 3 }, success: { text: 'You wait it out.', dna: 2, anim: 'rest' }, fail: { text: 'Not everyone survives.', pop: -3 } },
    ],
  },
  {
    id: 'strange_fruit', stage: 'creature', title: 'Strange Fruit', habitat: 'land', tags: ['food'], species: 'neighbor',
    text: 'A tree near your nests is heavy with purple fruit. You notice that nothing else eats it.',
    options: [
      { label: 'Eat it', req: { diet: ['herb', 'omni'] }, check: { stat: 'tou', diff: 2 }, success: { text: 'Sweet, and strangely energizing.', food: 3, dna: 2 }, fail: { text: 'Now you know why nothing eats it.', pop: -2 } },
      { label: 'Watch the {them} try it first', check: { stat: 'cun', diff: 3 }, success: { text: 'They eat it and are fine. Then you feast.', food: 3, opinion: -10 }, fail: { text: 'They see through it.', opinion: -15 } },
      { label: 'Leave it', result: { text: 'Better safe.', anim: 'rest' } },
    ],
  },
  {
    id: 'nest_raiders', stage: 'creature', title: 'Nest Raiders', tags: ['danger'], species: 'rival',
    text: 'Something has been stealing from your nests at night. You find {them} tracks.',
    options: [
      { label: 'Chase them down', check: { stat: 'spd', diff: 3 }, success: { text: 'They will not be back.', food: 2, opinion: -20, anim: 'attack' }, fail: { text: 'They get away with plenty.', food: -2 } },
      { label: 'Leave a poisoned trap', req: { keyword: ['venom', 1] }, result: { text: 'They will not be back.', dna: 3, opinion: -30 } },
      { label: 'Post guards', check: { stat: 'cun', diff: 2 }, success: { text: 'A watch rotation keeps everyone safe.', dna: 2, trait: 'cautious' }, fail: { text: 'The guards fall asleep.', food: -1 } },
    ],
  },
  {
    id: 'ancient_bones', stage: 'creature', title: 'Ancient Bones', tags: ['explore'],
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
      { label: 'Welcome them into your garden', req: { keyword: ['symbiont', 1] }, result: { text: 'They nest among your symbionts and keep you healthy.', pop: 3, dna: 2, opinion: 40, anim: 'social' } },
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
    id: 'plague', stage: 'creature', title: 'Sickness', tags: ['danger'],
    text: 'A sickness is spreading through your herd. Coughing, then stillness.',
    options: [
      { label: 'Keep the sick apart', check: { stat: 'cun', diff: 3 }, success: { text: 'The sickness burns out.', dna: 2 }, fail: { text: 'Too late.', pop: -3 } },
      { label: 'Ride it out', check: { stat: 'tou', diff: 3 }, success: { text: 'The survivors come out stronger.', trait: 'resilient', anim: 'grow' }, fail: { text: 'Many fall.', pop: -3 } },
      { label: 'Eat bitter medicine plants', req: { diet: ['herb', 'omni'] }, result: { text: 'An old instinct saves you.', pop: 1, dna: 1, anim: 'eat' } },
    ],
  },
  {
    id: 'night_hunters', stage: 'creature', title: 'Eyes in the Dark', tags: ['danger'], species: 'predator',
    text: 'At night, {them} circle your resting herd.',
    options: [
      { label: 'Light up the night', req: { keyword: ['glow', 2] }, result: { text: 'Your glow reveals them, and they slink away.', dna: 3, trait: 'dazzling', anim: 'mutate' } },
      { label: 'Huddle together', check: { stat: 'cha', diff: 3 }, success: { text: 'Strength in numbers.', trait: 'social', dna: 1, anim: 'social' }, fail: { text: 'Panic. The herd scatters.', pop: -2 } },
      { label: 'Fight in the dark', check: { stat: 'str', diff: 3 }, success: { text: 'You drive them off.', dna: 2, opinion: -15 }, fail: { text: 'You cannot see what you are fighting.', pop: -2 } },
    ],
  },
  {
    id: 'trapped_neighbor', stage: 'creature', title: 'Trapped', tags: ['social'], species: 'neighbor',
    text: 'One of the {them} is stuck fast and crying out. Its herd watches you.',
    options: [
      { label: 'Pull it free', check: { stat: 'str', diff: 2 }, success: { text: 'The {them} will remember your kindness.', opinion: 40, trait: 'gentle', anim: 'social' }, fail: { text: 'You nearly get stuck yourself.', pop: -1, opinion: 10 } },
      { label: 'Eat it', req: { diet: ['carn', 'omni'] }, result: { text: 'An easy meal, and the {them} saw everything.', food: 5, opinion: -40, anim: 'eat' } },
      { label: 'Walk on', result: { text: 'Not your problem.', anim: 'rest' } },
    ],
  },
  {
    id: 'crowded', stage: 'creature', title: 'Too Many Mouths', tags: ['food'],
    when: (run) => run.pop >= G.maxPop(run) - 1,
    text: 'Your kind has grown so numerous that the land can barely feed you all.',
    options: [
      { label: 'A group leaves to find new land', result: { text: 'They will become a new branch of the family tree.', pop: -2, dna: 4, anim: 'flee' } },
      { label: 'Push into new territory', check: { stat: 'str', diff: 3 }, success: { text: 'The territory grows to fit you.', food: 4, anim: 'attack' }, fail: { text: 'The neighbors push back.', pop: -1 } },
    ],
  },
  {
    id: 'hungry_winter', stage: 'creature', title: 'Hungry Season', tags: ['food'], species: 'rival', repeat: true, weight: 0.6,
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
    id: 'wildfire', stage: 'creature', habitat: 'land', title: 'Wildfire', tags: ['danger'],
    text: 'Lightning strikes the dry grass. Within moments, flames race toward your herd.',
    options: [
      { label: 'Run', check: { stat: 'spd', diff: 3 }, success: { text: 'You outrun the flames.', dna: 1 }, fail: { text: 'Not everyone makes it out.', pop: -3 } },
      { label: 'Shelter in the river', check: { stat: 'tou', diff: 2 }, success: { text: 'The water keeps you safe.', dna: 1, anim: 'rest' }, fail: { text: 'The heat is still terrible.', pop: -2 } },
      { label: 'Watch the flames', hint: 'Risky', check: { stat: 'cun', diff: 4 }, success: { text: 'You see how fire moves. One day this will matter.', dna: 3, insight: 2, trait: 'curious' }, fail: { text: 'You watched too long.', pop: -3 } },
    ],
  },
  {
    id: 'tall_trees', stage: 'creature', habitat: 'land', title: 'The Tall Forest', tags: ['explore', 'food'],
    text: 'Your herd reaches a forest where the best fruit hangs high above.',
    options: [
      { label: 'Climb', req: { tag: 'grasp' }, result: { text: 'You climb into a world of fruit and safety.', food: 4, dna: 2, anim: 'flee' } },
      { label: 'Knock it down', check: { stat: 'str', diff: 3 }, success: { text: 'Fruit rains down.', food: 4, anim: 'attack' }, fail: { text: 'All that effort for a few bruised fruit.', food: 1 } },
      { label: 'Glide from tree to tree', req: { part: 'wing_membranes' }, result: { text: 'You soar through the canopy.', food: 3, dna: 3, anim: 'flee' } },
    ],
  },
  {
    id: 'mud_flats', stage: 'creature', habitat: 'land', title: 'Sinking Mud', tags: ['danger'], species: 'any',
    text: 'The ground gives way. Your herd is stuck in deep mud, and the {them} are watching.',
    options: [
      { label: 'Haul yourselves out', check: { stat: 'str', diff: 3 }, success: { text: 'You drag yourselves free.', dna: 2 }, fail: { text: 'Some do not get out.', pop: -2 } },
      { label: 'Wade across with webbed feet', req: { part: 'webbed_feet' }, result: { text: 'Mud is easy for you.', dna: 2, food: 2 } },
      { label: 'Call to the {them} for help', check: { stat: 'cha', diff: 4 }, success: { text: 'They help pull you free.', opinion: 25, anim: 'social' }, fail: { text: 'They walk away.', pop: -2, opinion: -5 } },
    ],
  },
  {
    id: 'cave', stage: 'creature', habitat: 'land', title: 'The Cave', tags: ['explore'],
    text: 'A storm drives your herd into a deep cave. Something has lived here before.',
    options: [
      { label: 'Make it home', check: { stat: 'tou', diff: 3 }, success: { text: 'Warm and safe. Your young thrive here.', pop: 2, anim: 'rest' }, fail: { text: 'Its owner comes back.', pop: -2 } },
      { label: 'Explore deeper', check: { stat: 'cun', diff: 3 }, success: { text: 'You find strange crystals and an underground spring.', dna: 3, insight: 1, anim: 'flee' }, fail: { text: 'You get lost in the dark for days.', food: -3 } },
    ],
  },

  // ----- Sea only -----
  {
    id: 'kelp_forest', stage: 'creature', habitat: 'sea', title: 'Kelp Forest', tags: ['food'], species: 'prey',
    text: 'A swaying kelp forest rises around you, full of hiding {them}.',
    options: [
      { label: 'Graze the kelp', req: { diet: ['herb', 'omni'] }, result: { text: 'Endless food, swaying in the light.', food: 4 } },
      { label: 'Hunt in the shadows', req: { diet: ['carn', 'omni'] }, check: { stat: 'cun', diff: 3 }, success: { text: 'They never see you coming.', food: 5, opinion: -10 }, fail: { text: 'They vanish into the kelp.', food: 1 } },
      { label: 'Raise your young here', result: { text: 'A safe nursery.', pop: 1, anim: 'rest' } },
    ],
  },
  {
    id: 'whirlpool', stage: 'creature', habitat: 'sea', title: 'Whirlpool', tags: ['danger'],
    text: 'The tide turns violently and a whirlpool opens beneath your pod.',
    options: [
      { label: 'Swim against it', check: { stat: 'spd', diff: 3 }, success: { text: 'You break free.', dna: 2, anim: 'flee' }, fail: { text: 'It pulls some of you under.', pop: -2 } },
      { label: 'Ride it out together', check: { stat: 'tou', diff: 3 }, success: { text: 'You hold each other and spin out the far side.', dna: 1, trait: 'social' }, fail: { text: 'You are scattered.', pop: -2 } },
    ],
  },
  {
    id: 'whale_fall', stage: 'creature', habitat: 'sea', title: 'Whale Fall', tags: ['food'],
    text: 'Something huge has died and sunk to the seafloor near you. It will feed the deep for years.',
    options: [
      { label: 'Feast', result: { text: 'More food than you can eat.', food: 5, trait: 'scavenger', anim: 'eat' } },
      { label: 'Guard it from others', check: { stat: 'str', diff: 3 }, success: { text: 'It is yours alone.', food: 6, trait: 'territorial', anim: 'attack' }, fail: { text: 'Others drive you off.', food: 2 } },
    ],
  },
  {
    id: 'song', stage: 'creature', habitat: 'sea', title: 'A Song in the Water', tags: ['social', 'explore'], species: 'neighbor',
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
    text: 'A {them} the size of a hill has claimed your range. The ground shakes when it moves.',
    options: [
      { label: 'Stand your ground', check: { stat: 'tou', diff: 5 }, success: { text: 'It finds you too much trouble.', dna: 4, trait: 'territorial' }, fail: { text: 'It feeds on your herd for days.', pop: -3 } },
      { label: 'Gang up on it', check: { stat: 'str', diff: 5 }, success: { text: 'It falls. You feast for weeks.', food: 8, dna: 4, opinion: -40, trait: 'feared' }, fail: { text: 'It was not hungry enough to run.', pop: -4 } },
      { label: 'Stay out of its way', check: { stat: 'cun', diff: 3 }, success: { text: 'You learn its habits and avoid them.', dna: 2 }, fail: { text: 'You guess wrong.', pop: -2 } },
    ],
  },
  {
    id: 'great_migration', stage: 'creature', era: 2, title: 'The Great Migration', tags: ['explore', 'food'], species: 'prey',
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
    id: 'clever_young', stage: 'creature', era: 3, title: 'A Clever Youngster', tags: ['explore'],
    text: 'One of your young is solving puzzles nobody taught it: cracking shells with stones, moving logs to reach fruit.',
    options: [
      { label: 'Let the others copy it', check: { stat: 'cun', diff: 4 }, success: { text: 'Soon everyone is doing it.', insight: 4, dna: 2 }, fail: { text: 'The others do not get it.', insight: 1 } },
      { label: 'Make it a leader', check: { stat: 'cha', diff: 4 }, success: { text: 'The herd follows it, and grows wiser.', insight: 3, trait: 'social', anim: 'social' }, fail: { text: 'The old leaders push it out.', pop: -1 } },
    ],
  },
  {
    id: 'stick_tool', stage: 'creature', era: 3, title: 'A Curious Stick', tags: ['explore', 'food'],
    text: 'One of your kind picks up a stick and pokes it into an insect nest. It comes out covered in food.',
    options: [
      { label: 'Pass it on', req: { tag: 'grasp' }, result: { text: 'Soon everyone fishes for insects.', food: 3, insight: 3, anim: 'eat' } },
      { label: 'Just a stick', result: { text: 'It drops it and moves on.', food: 1, anim: 'rest' } },
    ],
  },
  {
    id: 'mourning', stage: 'creature', era: 3, title: 'Mourning', tags: ['social'],
    text: 'An old matriarch has died. The herd will not leave her body. They stand around her, silent.',
    options: [
      { label: 'Stay with her', result: { text: 'Something new is born in your kind: remembering those who are gone.', insight: 3, pop: -1, anim: 'rest' } },
      { label: 'Move on', result: { text: 'Life goes on.', food: 2, anim: 'flee' } },
    ],
  },
  {
    id: 'shared_signs', stage: 'creature', era: 3, title: 'Signs and Signals', tags: ['social'], species: 'neighbor',
    text: 'Your kind has begun to make the same sounds for the same things. Even the {them} seem to understand some of them.',
    options: [
      { label: 'Speak to the {them}', check: { stat: 'cha', diff: 5 }, success: { text: 'You understand each other, a little.', opinion: 40, insight: 3, anim: 'social' }, fail: { text: 'Confusion, then fear.', opinion: -15 } },
      { label: 'Keep the signs secret', check: { stat: 'cun', diff: 4 }, success: { text: 'A language only your kind knows.', insight: 3 }, fail: { text: 'The signs fade.', insight: 1 } },
    ],
  },
  {
    id: 'hostile_raid', stage: 'creature', title: 'The {them} Attack', tags: ['danger'], species: 'hostile', repeat: true, weight: 3,
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
      { label: 'Grow into giants', hint: 'Giant: +2 STR, +2 TOU, +2 max Pop, −1 SPD, eat 2 more', result: { text: 'Generation by generation, your kind grows. The ground shakes when you walk.', trait: 'giant', anim: 'grow' } },
      { label: 'Stay mid-sized', hint: 'Mid-sized: +1 STR, +1 TOU', result: { text: 'Big enough to fight, small enough to hide.', trait: 'mid_sized', anim: 'grow' } },
      { label: 'Stay small and many', hint: 'Small: +2 SPD, +1 CUN, grow faster, eat 1 less', result: { text: 'Your kind becomes quick, clever and everywhere.', trait: 'small_many', anim: 'flee' } },
    ],
  },
  {
    id: 'spark_of_mind', stage: 'creature', milestone: true, title: 'The Spark of Mind',
    text: 'Something has changed behind your eyes. Your kind has begun to wonder. Now you will earn Insight every turn and can research the Mind tree, like culture innovations.',
    options: [
      { label: 'Wonder about the world', hint: '+1 Insight per turn', result: { text: 'Every question leads to another.', trait: 'inquisitive', anim: 'mutate' } },
      { label: 'Wonder about each other', hint: '+1 CHA, grow faster', result: { text: 'You begin to think as "we".', trait: 'cooperative', anim: 'social' } },
      { label: 'Wonder how to win', hint: '+1 CUN, better hunts', result: { text: 'You begin to plan.', trait: 'calculating', anim: 'attack' } },
    ],
  },
  {
    id: 'creature_finale', stage: 'creature', finale: true, habitat: 'land', title: 'The First Tribe',
    text: 'Your kind knows itself now. Around you, the world waits. What you do next decides how your people begin.',
    options: [
      { label: 'Tame the fire', check: { stat: 'cun', diff: 5 }, success: { text: 'You carry a burning branch home. You are the Firekeepers.', legacy: 'firekeepers', anim: 'mutate' }, fail: { text: 'The fire takes more than it gives. Not yet.', pop: -3, setback: 0 } },
      { label: 'Unite the peoples of the valley', req: { innovation: 'vocal_language' }, check: { stat: 'cha', diff: 5 }, success: { text: 'Other species gather with yours under one sky. You are the Unifiers.', legacy: 'unifiers', anim: 'social' }, fail: { text: 'The gathering ends in a stampede. Not yet.', pop: -3, setback: 0 } },
      { label: 'Conquer the valley with tools', req: { innovation: 'stone_tools' }, check: { stat: 'str', diff: 5 }, success: { text: 'Armed with stone, nothing can stand against you. You are the Conquerors.', legacy: 'conquerors', anim: 'attack' }, fail: { text: 'A war with no winners. Not yet.', pop: -3, setback: 0 } },
    ],
  },
  {
    id: 'creature_finale_sea', stage: 'creature', finale: true, habitat: 'sea', title: 'The First Pod',
    text: 'Your kind knows itself now. The ocean is vast, and it is listening. What you do next decides how your people begin.',
    options: [
      { label: 'Sing the first song', check: { stat: 'cha', diff: 5 }, success: { text: 'A song that carries across whole oceans. You are the Deep Singers.', legacy: 'deep_singers', anim: 'social' }, fail: { text: 'The song falls apart. Not yet.', pop: -3, setback: 0 } },
      { label: 'Build a reef city', req: { innovation: 'shelters' }, check: { stat: 'cun', diff: 5 }, success: { text: 'You shape the coral into homes. You are the Reef Builders.', legacy: 'reef_builders', anim: 'grow' }, fail: { text: 'The reef crumbles. Not yet.', pop: -3, setback: 0 } },
      { label: 'Rule the currents', check: { stat: 'str', diff: 5 }, success: { text: 'Every creature in the sea knows your name. You are the Tide Lords.', legacy: 'tide_lords', anim: 'attack' }, fail: { text: 'The sea does not bow so easily. Not yet.', pop: -3, setback: 0 } },
    ],
  },

  // ======================= ANY STAGE =======================
  {
    id: 'mutation_burst', stage: 'any', title: 'Mutation Burst', repeat: true, weight: 0.6, tags: ['explore'],
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
];

// Endings that a winning run can earn. Shown in the Codex.
G.LEGACIES = {
  firekeepers: { name: 'The Firekeepers', desc: 'Your tribe will begin with fire.' },
  unifiers: { name: 'The Unifiers', desc: 'Your tribe will begin with allies.' },
  conquerors: { name: 'The Conquerors', desc: 'Your tribe will begin feared and armed.' },
  deep_singers: { name: 'The Deep Singers', desc: 'Your people will begin with a language that crosses oceans.' },
  reef_builders: { name: 'The Reef Builders', desc: 'Your people will begin with a city of coral.' },
  tide_lords: { name: 'The Tide Lords', desc: 'Your people will begin as masters of the sea.' },
};

G.EVENT = {};
G.EVENTS.forEach((e) => { G.EVENT[e.id] = e; });
