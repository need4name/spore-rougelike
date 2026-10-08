// Content audit: counts content per habitat so gaps stay visible.
// Run with: node tools/audit.js
global.window = global; global.G = {};
['parts', 'world', 'events'].forEach((f) => require(`../js/data/${f}.js`));

const count = (list, test) => list.filter(test).length;
const creatureParts = G.PARTS.filter((p) => p.stage === 'creature');
const evos = G.EVOLUTIONS.filter((e) => e.stage !== 'cell');
const events = G.EVENTS.filter((e) => e.stage !== 'cell');
const grasp = (p) => (p.tags || []).includes('grasp');
const LAND_WORDS = /\b(tree|trees|grass|ground|nest|burrow|paws?|legs|walk|run|cave|mud|plains?|leaves|fruit)\b/i;

const rows = [
  ['Body slots', G.SLOTS.land.length, G.SLOTS.sea.length],
  ['Parts only for this habitat', count(creatureParts, (p) => p.habitat === 'land'), count(creatureParts, (p) => p.habitat === 'sea')],
  ['Grasping parts (needed for tools)', count(creatureParts, (p) => grasp(p) && p.habitat !== 'sea'), count(creatureParts, (p) => grasp(p) && p.habitat !== 'land')],
  ['Evolutions only for this habitat', count(evos, (e) => e.habitat === 'land'), count(evos, (e) => e.habitat === 'sea')],
  ['Events only for this habitat', count(events, (e) => e.habitat === 'land'), count(events, (e) => e.habitat === 'sea')],
  ['Endings', ...['land', 'sea'].map((h) => G.EVENTS.filter((e) => e.finale && e.habitat === h).reduce((n, e) => n + count(e.options, (o) => (o.success || o.result || {}).legacy), 0))],
];
console.log('                                     Land  Sea');
rows.forEach(([name, land, sea]) => console.log(`${name.padEnd(36)} ${String(land).padStart(4)} ${String(sea).padStart(4)}${sea < land * 0.8 ? '  <- sea behind' : ''}`));
const worded = events.filter((e) => !e.habitat && LAND_WORDS.test(JSON.stringify(e)));
console.log(`\nShared events written with land words: ${worded.length} of ${count(events, (e) => !e.habitat)}`);
console.log(worded.map((e) => e.id).join(', '));
