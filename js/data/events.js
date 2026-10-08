// Event cards. One is drawn every turn after you pick an action.
//
// Event fields:
//   id, stage ('cell' | 'creature' | 'any'), title, text
//   weight     how often it shows up (default 1)
//   origins    list of origin ids where this event is 3x as likely
//   repeat     true = can happen more than once per run
//   rival      'any' | 'hostile' | 'allied' = picks a rival species, shown as {rival}
//   when       optional function(run) returning true when the event is allowed
//
// Option fields:
//   label, hint (short text shown under the button)
//   req        { diet: ['carn','omni'], keyword: ['venom', 2], trait: 'id', part: 'id', food: 3 }
//   check      { stat: 'spd', diff: 3 }  rolls against a stat, then uses success / fail
//   result     outcome when there is no check
//   success / fail / result: { text, health, food, dna, trait, loseTrait, opinion, randomPart, legacy }
window.G = window.G || {};

G.EVENTS = [
  // ================= CELL STAGE =================
  {
    id: 'larger_shadow', stage: 'cell', title: 'A Larger Shadow',
    text: 'Something ten times your size drifts overhead, its membrane rippling as it senses you.',
    options: [
      { label: 'Flee into the current', check: { stat: 'spd', diff: 3 }, success: { text: 'You dart away, faster than you knew you could be.', dna: 2 }, fail: { text: 'It catches part of you before you escape.', health: -2, dna: 1 } },
      { label: 'Hide in the sediment', check: { stat: 'cun', diff: 2 }, success: { text: 'You go still in the silt until it passes.', dna: 1, trait: 'cautious' }, fail: { text: 'It finds you anyway and takes a bite.', health: -2 } },
      { label: 'Raise your spikes', req: { keyword: ['armor', 1] }, result: { text: 'It recoils from your armor and leaves behind a torn scrap of itself. You eat it.', food: 3, trait: 'feared' } },
      { label: 'Let it swallow you, and survive inside', check: { stat: 'tou', diff: 4 }, hint: 'Risky', success: { text: 'You live inside the giant and slowly become part of it. Something new is born.', dna: 5, trait: 'endosymbiont' }, fail: { text: 'Its digestive juices are stronger than you are.', health: -3, dna: 1 } },
    ],
  },
  {
    id: 'warm_current', stage: 'cell', title: 'The Warm Current',
    text: 'A warm current rushes past, thick with strange molecules from somewhere far away.',
    options: [
      { label: 'Ride it', check: { stat: 'spd', diff: 2 }, success: { text: 'You travel farther than any of your ancestors.', dna: 3 }, fail: { text: 'You tumble out, dizzy and lost.', food: -1, dna: 1 } },
      { label: 'Stay and feed in its wake', result: { text: 'The current leaves plenty behind.', food: 2 } },
    ],
  },
  {
    id: 'algae_bloom', stage: 'cell', title: 'Algae Bloom',
    text: 'The water turns green. An algae bloom is spreading, and tiny grazers swarm to it.',
    options: [
      { label: 'Gorge on algae', req: { diet: ['herb', 'omni'] }, result: { text: 'You eat until you can barely move.', food: 4 } },
      { label: 'Hunt the grazers', req: { diet: ['carn', 'omni'] }, check: { stat: 'str', diff: 2 }, success: { text: 'The grazers are too busy eating to notice you.', food: 4, dna: 1 }, fail: { text: 'They scatter before you can catch one.', food: 1 } },
      { label: 'Study the bloom', result: { text: 'You learn the rhythm of the seasons.', dna: 1 } },
    ],
  },
  {
    id: 'strange_molecule', stage: 'cell', title: 'A Strange Molecule',
    text: 'A glittering chain of atoms you have never seen before floats nearby, humming with energy.',
    options: [
      { label: 'Absorb it', check: { stat: 'tou', diff: 3 }, success: { text: 'It rewrites part of you. You feel more.', dna: 4 }, fail: { text: 'It burns going in, but changes you all the same.', health: -2, dna: 2 } },
      { label: 'Probe it carefully', check: { stat: 'cun', diff: 3 }, success: { text: 'You learn its secrets without getting hurt.', dna: 3, trait: 'curious' }, fail: { text: 'It breaks apart in your grip.', dna: 1 } },
      { label: 'Leave it alone', result: { text: 'Some things are better left alone.' } },
    ],
  },
  {
    id: 'kin_cell', stage: 'cell', title: 'Kin',
    text: 'A cell almost exactly like you bumps into your membrane. It is not food. It might be family.',
    options: [
      { label: 'Merge with it', result: { text: 'Two become one, and one becomes stronger.', trait: 'colonial' } },
      { label: 'Cooperate', check: { stat: 'cha', diff: 2 }, success: { text: 'You hunt and feed side by side.', food: 2, trait: 'social' }, fail: { text: 'It drifts off, uninterested.', dna: 1 } },
      { label: 'Eat it', req: { diet: ['carn', 'omni'] }, check: { stat: 'str', diff: 2 }, success: { text: 'Family tastes much like everything else.', food: 4, trait: 'aggressive' }, fail: { text: 'It fights back hard.', health: -1 } },
    ],
  },
  {
    id: 'viral_ghost', stage: 'cell', title: 'Viral Ghost',
    text: 'A virus has latched onto you and is trying to slip its code into yours.',
    options: [
      { label: 'Fight it off', check: { stat: 'tou', diff: 3 }, success: { text: 'You destroy it and learn from it.', dna: 2, trait: 'resilient' }, fail: { text: 'It sickens you badly before it dies.', health: -2 } },
      { label: 'Let it rewrite you', hint: 'Random mutation', result: { text: 'You let the stranger edit you.', health: -1, randomPart: true } },
    ],
  },
  {
    id: 'sunlit_shallows', stage: 'cell', title: 'Sunlit Shallows',
    text: 'You drift up into bright, warm water. Sunlight pours through.',
    options: [
      { label: 'Bask and photosynthesize', req: { keyword: ['symbiont', 1] }, result: { text: 'Your passengers drink the light and feed you well.', food: 4, health: 1 } },
      { label: 'Dive back to the depths', result: { text: 'The deep holds more secrets.', dna: 2, food: -1 } },
      { label: 'Feed on what the sun brings', req: { diet: ['herb', 'omni'] }, result: { text: 'Fresh algae everywhere.', food: 2 } },
    ],
  },
  {
    id: 'toxic_plume', stage: 'cell', title: 'Toxic Plume', origins: ['toxic', 'vents'],
    text: 'A cloud of poison spreads through the water. Everything it touches stops moving.',
    options: [
      { label: 'Endure it', check: { stat: 'tou', diff: 3 }, success: { text: 'You survive what others could not.', dna: 3 }, fail: { text: 'The poison eats at you.', health: -2, dna: 1 } },
      { label: 'Flee', check: { stat: 'spd', diff: 2 }, success: { text: 'You outrun the cloud.', dna: 1 }, fail: { text: 'It catches the edge of you.', health: -1 } },
      { label: 'Absorb the toxins', req: { keyword: ['venom', 1] }, result: { text: 'Poison is just another meal to you.', dna: 3, trait: 'toxic_affinity' } },
    ],
  },
  {
    id: 'thermal_vent', stage: 'cell', title: 'Thermal Vent', origins: ['vents'],
    text: 'Black smoke pours from a crack in the seafloor. The water around it boils with chemical energy.',
    options: [
      { label: 'Feed on the chemicals', check: { stat: 'cun', diff: 2 }, success: { text: 'You find a way to eat stone-breath.', food: 3, dna: 2 }, fail: { text: 'You get too close and scald yourself.', health: -2 } },
      { label: 'Keep your distance', result: { text: 'You stay safe and learn nothing.', dna: 1 } },
    ],
  },
  {
    id: 'ice_crystal', stage: 'cell', title: 'Ice Crystal', origins: ['frozen'],
    text: 'An ice crystal forms around you, slowly closing in.',
    options: [
      { label: 'Shelter inside it', check: { stat: 'tou', diff: 2 }, success: { text: 'The ice keeps you safe from predators while you rest.', health: 2 }, fail: { text: 'The cold bites deep.', health: -1 } },
      { label: 'Break free', check: { stat: 'str', diff: 2 }, success: { text: 'You crack it open and grow stronger.', dna: 2 }, fail: { text: 'Exhausting work.', food: -2 } },
    ],
  },
  {
    id: 'rotifer_swarm', stage: 'cell', title: 'Rotifer Swarm',
    text: 'A swarm of rotifers, each one a spinning mouth, sweeps toward you.',
    options: [
      { label: 'Fight', check: { stat: 'str', diff: 3 }, success: { text: 'You eat the ones that try to eat you.', food: 4, dna: 1 }, fail: { text: 'They take their share of you.', health: -2 } },
      { label: 'Scatter', check: { stat: 'spd', diff: 3 }, success: { text: 'You slip between them.', dna: 1 }, fail: { text: 'Too slow.', health: -2 } },
      { label: 'Flash to confuse them', req: { keyword: ['glow', 1] }, result: { text: 'Your light sends them spinning the wrong way.', dna: 2, trait: 'dazzling' } },
    ],
  },
  {
    id: 'dead_giant', stage: 'cell', title: 'The Dead Giant',
    text: 'The body of an enormous cell is falling slowly to the seafloor.',
    options: [
      { label: 'Scavenge', result: { text: 'Plenty for everyone, and you got here first.', food: 3, trait: 'scavenger' } },
      { label: 'Study its insides', check: { stat: 'cun', diff: 2 }, success: { text: 'Its structure gives you ideas.', dna: 3 }, fail: { text: 'You learn nothing useful.', dna: 1 } },
    ],
  },
  {
    id: 'rival_strain', stage: 'cell', title: 'A Rival Strain',
    text: 'Another kind of cell is spreading quickly through your waters, eating everything you would eat.',
    options: [
      { label: 'Outcompete them', check: { stat: 'spd', diff: 3 }, success: { text: 'You get to the food first, every time.', food: 3, dna: 1 }, fail: { text: 'They are faster.', food: -2 } },
      { label: 'Wage war', check: { stat: 'str', diff: 3 }, success: { text: 'They are gone. The waters are yours.', dna: 3, trait: 'aggressive' }, fail: { text: 'A costly fight.', health: -2 } },
      { label: 'Share the waters', check: { stat: 'cha', diff: 2 }, success: { text: 'There is enough for both of you.', dna: 2, trait: 'social' }, fail: { text: 'They push you out anyway.', food: -1 } },
    ],
  },
  {
    id: 'lean_tide', stage: 'cell', title: 'Lean Tide', repeat: true, weight: 0.6,
    text: 'The tide goes out and takes the food with it.',
    options: [
      { label: 'Tighten your membrane and wait', result: { text: 'You make do with less.', food: -2 } },
      { label: 'Search the far waters', check: { stat: 'spd', diff: 2 }, success: { text: 'You find a fresh patch.', food: 1 }, fail: { text: 'Nothing out there either.', food: -2, health: -1 } },
    ],
  },
  {
    id: 'cell_finale', stage: 'cell', finale: true, title: 'The Edge of the Sea',
    text: 'Your lineage has grown complex. Light from the surface calls to you, and beyond it, the shore. This is the moment your descendants will remember.',
    options: [
      { label: 'Crawl onto the sand', check: { stat: 'spd', diff: 4 }, success: { text: 'You drag yourself out into the air. The land is yours to claim.', trait: 'land_pioneer', dna: 3 }, fail: { text: 'The sun nearly kills you, but some of you make it.', health: -3 } },
      { label: 'Grow huge in the depths first', check: { stat: 'tou', diff: 4 }, success: { text: 'You grow and grow, then rise out of the sea as a giant.', trait: 'deep_giant' }, fail: { text: 'You grow too fast and many of you die.', health: -3 } },
      { label: 'Devour every rival first', check: { stat: 'str', diff: 4 }, success: { text: 'Nothing in the sea can challenge you. You leave it empty behind you.', trait: 'apex_cell', food: 5 }, fail: { text: 'The last of your rivals fight back hard.', health: -3 } },
    ],
  },

  // ================= CREATURE STAGE =================
  {
    id: 'watering_hole', stage: 'creature', title: 'Stalker at the Watering Hole',
    text: 'A larger predator has started stalking your herd at the watering hole.',
    options: [
      { label: 'Stand and fight', check: { stat: 'str', diff: 4 }, success: { text: 'It limps away. Your young will remember this.', dna: 3, trait: 'aggressive' }, fail: { text: 'It drags one of you away.', health: -3 } },
      { label: 'Flee to the highlands', check: { stat: 'spd', diff: 3 }, success: { text: 'You find new water in the hills.', dna: 2, trait: 'migratory' }, fail: { text: 'It catches the slowest.', health: -2 } },
      { label: 'Play dead', req: { keyword: ['venom', 1] }, result: { text: 'It takes one bite of your poisoned skin and staggers off, sick.', dna: 3, trait: 'feared' } },
      { label: 'Lure it toward the {rival}', result: { text: 'The {rival} pay the price instead of you.', dna: 2, opinion: -30, trait: 'aggressive' } },
    ],
    rival: 'any',
  },
  {
    id: 'mating_season', stage: 'creature', title: 'Mating Season',
    text: 'The air is thick with calls and displays. Who gets to pass on their genes?',
    options: [
      { label: 'Put on a dazzling display', check: { stat: 'cha', diff: 3 }, success: { text: 'Your most beautiful have many young.', dna: 4, health: 2 }, fail: { text: 'Nobody is impressed.', dna: 1 } },
      { label: 'Fight for mates', check: { stat: 'str', diff: 3 }, success: { text: 'The strongest win, and the young are strong too.', dna: 3, trait: 'aggressive' }, fail: { text: 'Lots of injuries, few young.', health: -2 } },
      { label: 'Focus on feeding instead', result: { text: 'A quiet season.', food: 2 } },
    ],
  },
  {
    id: 'rival_herd', stage: 'creature', title: 'The {rival}', rival: 'any', repeat: true, weight: 1.2,
    text: 'You cross paths with the {rival}, a species that shares your valley.',
    options: [
      { label: 'Approach peacefully', check: { stat: 'cha', diff: 2 }, success: { text: 'They let you graze beside them.', opinion: 25, dna: 2 }, fail: { text: 'They hiss and back away.', opinion: -10 } },
      { label: 'Hunt their young', req: { diet: ['carn', 'omni'] }, check: { stat: 'str', diff: 3 }, success: { text: 'A good meal. They will not forgive this.', food: 5, opinion: -40 }, fail: { text: 'Their adults drive you off.', health: -2, opinion: -25 } },
      { label: 'Watch and learn', check: { stat: 'cun', diff: 2 }, success: { text: 'You learn where they find food.', dna: 2, food: 1 }, fail: { text: 'They notice you watching.', opinion: -5 } },
    ],
  },
  {
    id: 'drought', stage: 'creature', title: 'Drought',
    text: 'The rains have not come. The rivers are shrinking to puddles.',
    options: [
      { label: 'Migrate', check: { stat: 'spd', diff: 3 }, success: { text: 'You find a valley the drought has not reached.', food: 2, trait: 'migratory' }, fail: { text: 'The journey costs you.', health: -2, food: -2 } },
      { label: 'Dig for water', req: { part: 'digging_claws' }, result: { text: 'Your claws find water under the dry riverbed.', health: 2, dna: 2 } },
      { label: 'Endure it', check: { stat: 'tou', diff: 3 }, success: { text: 'You wait it out.', dna: 2 }, fail: { text: 'Not everyone survives.', health: -3 } },
    ],
  },
  {
    id: 'strange_fruit', stage: 'creature', title: 'Strange Fruit',
    text: 'A tree heavy with purple fruit. Nothing else seems to eat it.',
    options: [
      { label: 'Eat it', req: { diet: ['herb', 'omni'] }, check: { stat: 'tou', diff: 2 }, success: { text: 'Sweet, and strangely energizing.', food: 3, dna: 2 }, fail: { text: 'Now you know why nothing eats it.', health: -2 } },
      { label: 'Let the {rival} try it first', check: { stat: 'cun', diff: 3 }, success: { text: 'They eat it and are fine. Then you feast.', food: 3, opinion: -10 }, fail: { text: 'They see through the trick.', opinion: -20 } },
      { label: 'Leave it', result: { text: 'Better safe.' } },
    ],
    rival: 'any',
  },
  {
    id: 'nest_raiders', stage: 'creature', title: 'Nest Raiders',
    text: 'Small, fast scavengers are stealing from your nests at night.',
    options: [
      { label: 'Chase them down', check: { stat: 'spd', diff: 3 }, success: { text: 'They will not be back. They were tasty, too.', food: 2, dna: 1 }, fail: { text: 'They get away with plenty.', food: -2 } },
      { label: 'Poison the nest as a trap', req: { keyword: ['venom', 1] }, result: { text: 'They will not be back.', dna: 3 } },
      { label: 'Post guards', check: { stat: 'cun', diff: 2 }, success: { text: 'A watch rotation keeps everyone safe.', dna: 2, trait: 'cautious' }, fail: { text: 'The guards fall asleep.', food: -1 } },
    ],
  },
  {
    id: 'ancient_bones', stage: 'creature', title: 'Ancient Bones',
    text: 'Fossils in a cliff face. Something in you recognizes the shapes.',
    options: [
      { label: 'Linger and remember', result: { text: 'Your lineage remembers where it came from.', dna: 3 } },
      { label: 'Gnaw them for minerals', result: { text: 'Good for growing bones.', health: 1, food: 1 } },
    ],
  },
  {
    id: 'cleaner_birds', stage: 'creature', title: 'Cleaner Birds',
    text: 'Small birds land on your backs and start picking off parasites.',
    options: [
      { label: 'Let them stay', check: { stat: 'cha', diff: 2 }, success: { text: 'A partnership that will last generations.', health: 2, trait: 'hoarder' }, fail: { text: 'They peck too hard and you shake them off.' } },
      { label: 'Welcome them into your lichen', req: { keyword: ['symbiont', 1] }, result: { text: 'They nest in the lichen and keep you clean.', health: 3, dna: 2 } },
      { label: 'Eat them', req: { diet: ['carn', 'omni'] }, result: { text: 'They should have been more careful.', food: 2 } },
    ],
  },
  {
    id: 'alpha_challenge', stage: 'creature', title: 'The Alpha of the {rival}', rival: 'any',
    text: 'The largest of the {rival} stands in your path and roars a challenge.',
    options: [
      { label: 'Fight the alpha', check: { stat: 'str', diff: 4 }, success: { text: 'It yields. The {rival} now respect you.', dna: 4, opinion: 20, trait: 'feared' }, fail: { text: 'You are beaten badly.', health: -3, opinion: -10 } },
      { label: 'Bow low', result: { text: 'Peace, at the cost of pride.', opinion: 30, trait: 'meek' } },
      { label: 'Outmaneuver it', check: { stat: 'spd', diff: 3 }, success: { text: 'It tires itself out chasing you.', dna: 2 }, fail: { text: 'It catches you.', health: -2 } },
    ],
  },
  {
    id: 'plague', stage: 'creature', title: 'Plague',
    text: 'A sickness is spreading through your herd. Coughing, then stillness.',
    options: [
      { label: 'Isolate the sick', check: { stat: 'cun', diff: 3 }, success: { text: 'The sickness burns out.', dna: 2 }, fail: { text: 'Too late.', health: -3 } },
      { label: 'Ride it out', check: { stat: 'tou', diff: 3 }, success: { text: 'Survivors come out stronger.', trait: 'resilient' }, fail: { text: 'Many fall.', health: -3 } },
      { label: 'Eat bitter healing herbs', req: { diet: ['herb', 'omni'] }, result: { text: 'An old instinct saves you.', health: 1, dna: 1 } },
    ],
  },
  {
    id: 'night_hunters', stage: 'creature', title: 'Night Hunters',
    text: 'Eyes in the dark. Something is circling your herd.',
    options: [
      { label: 'Light up the night', req: { keyword: ['glow', 2] }, result: { text: 'Your glow reveals them, and they slink away.', dna: 3, trait: 'dazzling' } },
      { label: 'Huddle together', check: { stat: 'cha', diff: 3 }, success: { text: 'Strength in numbers.', trait: 'social', dna: 1 }, fail: { text: 'Panic. The herd scatters.', health: -2 } },
      { label: 'Fight in the dark', check: { stat: 'str', diff: 3 }, success: { text: 'You drive them off.', dna: 2 }, fail: { text: 'You cannot see what you are fighting.', health: -2 } },
    ],
  },
  {
    id: 'tar_pit', stage: 'creature', title: 'Tar Pit', rival: 'any',
    text: 'One of the {rival} is stuck in a tar pit, wailing.',
    options: [
      { label: 'Pull it free', check: { stat: 'str', diff: 2 }, success: { text: 'The {rival} will remember your kindness.', opinion: 40, trait: 'gentle' }, fail: { text: 'You nearly get stuck yourself.', health: -1, opinion: 10 } },
      { label: 'Eat it', req: { diet: ['carn', 'omni'] }, result: { text: 'An easy meal, and the {rival} saw everything.', food: 5, opinion: -30 } },
      { label: 'Walk on', result: { text: 'Not your problem.' } },
    ],
  },
  {
    id: 'wildfire', stage: 'creature', title: 'Wildfire',
    text: 'Lightning strikes dry grass. Within moments the plain is burning.',
    options: [
      { label: 'Run', check: { stat: 'spd', diff: 3 }, success: { text: 'You outrun the flames.', dna: 1 }, fail: { text: 'Not everyone makes it out.', health: -3 } },
      { label: 'Shelter in the river', check: { stat: 'tou', diff: 2 }, success: { text: 'The water keeps you safe.', dna: 1 }, fail: { text: 'The heat is still terrible.', health: -2 } },
      { label: 'Watch the flames', check: { stat: 'cun', diff: 4 }, hint: 'Risky', success: { text: 'You see how fire moves. One day this will matter.', dna: 4, trait: 'curious' }, fail: { text: 'You watched too long.', health: -3 } },
    ],
  },
  {
    id: 'curious_stick', stage: 'creature', title: 'A Curious Stick',
    text: 'One of your young picks up a stick and knocks fruit from a tree with it.',
    options: [
      { label: 'Encourage it', check: { stat: 'cun', diff: 4 }, success: { text: 'Soon everyone is doing it. Something has changed.', dna: 5, trait: 'tool_user' }, fail: { text: 'Nobody else gets it.', dna: 1 } },
      { label: 'Ignore it', result: { text: 'Just a stick.', food: 1 } },
    ],
  },
  {
    id: 'crowded_valley', stage: 'creature', title: 'Crowded Valley',
    when: (run) => run.health >= G.maxHealth(run) - 1,
    text: 'Your herd has grown. The valley can barely feed you all.',
    options: [
      { label: 'Split the herd', result: { text: 'A group heads off to start a new life elsewhere.', health: -2, dna: 4 } },
      { label: 'Claim more territory', check: { stat: 'str', diff: 3 }, success: { text: 'The valley grows to fit you.', food: 4 }, fail: { text: 'The neighbors push back.', health: -1 } },
    ],
  },
  {
    id: 'rival_raid', stage: 'creature', title: 'The {rival} Raid', rival: 'hostile', repeat: true, weight: 3,
    text: 'The {rival} have not forgotten. They charge into your territory at dawn.',
    options: [
      { label: 'Hold the line', check: { stat: 'tou', diff: 3 }, success: { text: 'They break against you and retreat.', dna: 2, opinion: 10 }, fail: { text: 'They trample your nests.', health: -3 } },
      { label: 'Counterattack', check: { stat: 'str', diff: 4 }, success: { text: 'You chase them out of the valley. They will think twice.', dna: 3, food: 3, opinion: 20 }, fail: { text: 'You chase them into an ambush.', health: -3, opinion: -10 } },
      { label: 'Offer food as tribute', req: { food: 3 }, result: { text: 'They take it and leave you in peace.', food: -3, opinion: 35 } },
    ],
  },
  {
    id: 'joint_hunt', stage: 'creature', title: 'A Joint Hunt', rival: 'allied', repeat: true, weight: 2,
    text: 'The {rival} have spotted a huge beast and want your help bringing it down.',
    options: [
      { label: 'Join the hunt', check: { stat: 'str', diff: 2 }, success: { text: 'A feast for both species.', food: 4, opinion: 10, trait: 'pack_hunter' }, fail: { text: 'The beast escapes. Nobody blames you.', health: -1 } },
      { label: 'Lead the hunt', check: { stat: 'cun', diff: 3 }, success: { text: 'Your plan works perfectly.', food: 4, dna: 2, opinion: 15 }, fail: { text: 'A bad plan, and the {rival} lose some of their own.', opinion: -20 } },
      { label: 'Decline politely', result: { text: 'They hunt without you.', opinion: -5 } },
    ],
  },
  {
    id: 'creature_finale', stage: 'creature', finale: true, title: 'The First Spark',
    text: 'Lightning splits an old tree, and it burns through the night. Your kind gathers around it, staring. Tomorrow, everything changes.',
    options: [
      { label: 'Seize the fire', check: { stat: 'cun', diff: 5 }, success: { text: 'You carry a burning branch back to your herd. You are now Firekeepers.', legacy: 'firekeepers' }, fail: { text: 'The fire takes more than it gives.', health: -3 } },
      { label: 'Gather every species under one sky', check: { stat: 'cha', diff: 5 }, success: { text: 'The {rival} and others join you around the flames. You are now the Unifiers.', legacy: 'unifiers' }, fail: { text: 'The gathering turns into a stampede.', health: -3 } },
      { label: 'Conquer the valley', check: { stat: 'str', diff: 5 }, success: { text: 'By morning, every rival has fled or bowed. You are now the Conquerors.', legacy: 'conquerors' }, fail: { text: 'A war with no winners.', health: -3 } },
    ],
    rival: 'any',
  },

  // ================= ANY STAGE =================
  {
    id: 'mutation_burst', stage: 'any', title: 'Mutation Burst', repeat: true, weight: 0.7,
    text: 'Cosmic radiation scrambles part of your genetic code.',
    options: [
      { label: 'Embrace the change', hint: 'Random mutation', result: { text: 'Something new grows.', randomPart: true } },
      { label: 'Repair the damage', check: { stat: 'tou', diff: 2 }, success: { text: 'Your code holds steady.', dna: 2 }, fail: { text: 'The repair is painful.', health: -1, dna: 1 } },
    ],
  },
  {
    id: 'quiet_time', stage: 'any', title: 'A Quiet Time', repeat: true, weight: 0.5,
    text: 'Nothing much happens. Your kind eats, rests and grows.',
    options: [
      { label: 'Rest', result: { text: 'A good rest.', health: 1 } },
      { label: 'Gather', result: { text: 'Something extra for later.', food: 1 } },
      { label: 'Wander', result: { text: 'New places, new ideas.', dna: 1 } },
    ],
  },
];

// Endings that a winning run can earn. Shown in the Codex.
G.LEGACIES = {
  firekeepers: { name: 'The Firekeepers', desc: 'Your tribe will begin with fire.' },
  unifiers: { name: 'The Unifiers', desc: 'Your tribe will begin with allies.' },
  conquerors: { name: 'The Conquerors', desc: 'Your tribe will begin feared and strong.' },
  survivors: { name: 'The Survivors', desc: 'Battered, but alive. Your tribe will begin.' },
};

G.EVENT = {};
G.EVENTS.forEach((e) => { G.EVENT[e.id] = e; });
