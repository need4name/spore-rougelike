// Game rules: runs, turns, checks, drafts, merging, eras, the Mind tree and saved progress.
window.G = window.G || {};

(function () {
  const SAVE_META = 'primordia.meta.v1';
  const SAVE_RUN = 'primordia.run.v3';

  // ---------- Saving ----------
  function store(key, value) {
    try {
      if (value == null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* storage blocked: progress lasts until the tab closes */ }
  }
  function load(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function freshMeta() {
    return {
      v: 1,
      genes: 0,
      unlocked: { archetypes: ['drifter', 'grazer'], origins: ['tidal'], packs: [] },
      boons: {},
      maxHostility: 0,
      codex: { events: [], parts: [], legacies: [], evolutions: [] },
      stats: { runs: 0, wins: 0, extinctions: 0, bestDna: 0 },
      fossils: [], history: [],
    };
  }
  function mergeMeta(saved) {
    const m = freshMeta();
    if (!saved) return m;
    m.genes = saved.genes || 0;
    m.boons = saved.boons || {};
    Object.keys(m.boons).forEach((id) => { if (!G.BOON[id]) delete m.boons[id]; else m.boons[id] = Math.min(m.boons[id], G.BOON[id].costs.length); });
    m.fossils = saved.fossils || [];
    m.history = saved.history || [];
    m.seenVersion = saved.seenVersion;
    m.maxHostility = saved.maxHostility || 0;
    ['archetypes', 'origins', 'packs'].forEach((k) => {
      const list = (saved.unlocked && saved.unlocked[k]) || [];
      list.forEach((id) => { if (!m.unlocked[k].includes(id)) m.unlocked[k].push(id); });
    });
    ['events', 'parts', 'legacies', 'evolutions'].forEach((k) => { m.codex[k] = (saved.codex && saved.codex[k]) || []; });
    Object.assign(m.stats, saved.stats || {});
    return m;
  }

  G.meta = mergeMeta(load(SAVE_META));
  G.run = load(SAVE_RUN);
  G.saveMeta = () => store(SAVE_META, G.meta);
  G.saveRun = () => store(SAVE_RUN, G.run);
  G.resetAll = () => { G.meta = freshMeta(); G.run = null; G.saveMeta(); G.saveRun(); };
  function save() { G.saveRun(); G.saveMeta(); }

  // ---------- Lookups and helpers ----------
  G.ARCHETYPE = {}; G.ARCHETYPES.forEach((a) => { G.ARCHETYPE[a.id] = a; });
  G.ORIGIN = {}; G.ORIGINS.forEach((o) => { G.ORIGIN[o.id] = o; });
  G.INSTINCT = {}; G.INSTINCTS.forEach((i) => { G.INSTINCT[i.id] = i; });
  G.INNOVATION = {}; G.INNOVATIONS.forEach((i) => { G.INNOVATION[i.id] = i; });

  // ---------- Archetype gimmicks: each archetype breaks one rule for the whole run ----------
  G.gimmick = (run) => (G.ARCHETYPE[run.archetype] && G.ARCHETYPE[run.archetype].gimmick) || null;
  const speciesNamed = (run, name) => (name ? run.species.find((s) => s.name === name && !s.extinct) || null : null);
  G.partnerOf = (run) => (G.gimmick(run) === 'symbiote' ? speciesNamed(run, run.partner) : null);
  G.hostOf = (run) => (G.gimmick(run) === 'parasite' ? speciesNamed(run, run.host) : null);
  G.mimicOf = (run) => (G.gimmick(run) === 'mimic' ? speciesNamed(run, run.mimic) : null);
  G.budsOf = (run) => run.species.filter((s) => s.bud && !s.extinct);
  G.GIMMICK_COST = 3; // DNA for gimmick actions (steal, jump, swap, mimic)
  G.HUNGER_LIMIT = 5;
  G.DRIFT_EVERY = 8;
  // Which Instincts this archetype may choose.
  G.instinctAllowed = (run, id) => {
    const g = G.gimmick(run);
    if (g === 'drifter') return { ok: false, why: 'The current decides your Instinct' };
    if (g === 'grazer' && id === 'hunt') return { ok: false, why: 'Grazers never hunt' };
    if (g === 'predator' && id === 'forage') return { ok: false, why: 'Predators only eat what they kill' };
    return { ok: true };
  };

  const rand = () => Math.random();
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  function weightedPick(items, weightOf) {
    const total = items.reduce((s, it) => s + weightOf(it), 0);
    let r = rand() * total;
    for (const it of items) { r -= weightOf(it); if (r <= 0) return it; }
    return items[items.length - 1];
  }
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function addUnique(list, id) { if (!list.includes(id)) { list.push(id); return true; } return false; }

  // ---------- Body ----------
  // ---------- Body plan: symmetry and segments ----------
  G.symmetry = (run) => (run.traits.includes('radial_plan') ? 'radial' : run.traits.includes('sessile_plan') ? 'colonial' : 'bilateral');
  G.segments = (run) => (run.segments != null ? run.segments : G.SYMMETRY[G.symmetry(run)].start);
  G.segmentPlan = (run) => {
    const sym = G.symmetry(run); const n = G.segments(run);
    return sym === 'radial' ? G.armPlan(n) : sym === 'colonial' ? G.podPlan(n) : G.legPlan(n, run.habitat);
  };
  // Slots this body plan has no use for (creature stage only).
  G.offSlots = (run) => {
    if (run.stage !== 'creature') return [];
    const off = (G.SYMMETRY[G.symmetry(run)].off || []).slice();
    (G.segmentPlan(run).off || []).forEach((x) => { if (!off.includes(x)) off.push(x); });
    return off.concat(off.map((x) => `${x}2`));
  };
  G.reshapeCost = (run) => (G.gimmick(run) === 'colony' ? Math.ceil(G.RESHAPE_COST / 2) : G.RESHAPE_COST);
  G.reshape = function (delta) {
    const run = G.run;
    if (!run || run.stage !== 'creature') return;
    const sym = G.SYMMETRY[G.symmetry(run)];
    const n = G.segments(run) + delta;
    const cost = G.reshapeCost(run);
    if (n < sym.min || n > sym.max || run.dna < cost) return;
    run.dna -= cost;
    run.segments = n;
    run.pop = Math.min(run.pop, G.maxPop(run));
    log(run, `Your body plan changed: ${G.segmentPlan(run).name}.`);
    G.saveRun();
  };

  // Home depth for sea creatures.
  G.SEA_ZONE = {}; G.SEA_ZONES.forEach((z) => { G.SEA_ZONE[z.id] = z; });
  G.zone = (run) => (run.zone && G.SEA_ZONE[run.zone] ? run.zone : 'reef');
  G.zoneState = (run, id) => {
    const z = G.SEA_ZONE[id];
    if (!z.need) return { ok: true };
    const counts = G.keywordCounts(run); const ids = G.partIds(run);
    const ok = z.need.any.some((x) => counts[x] > 0 || ids.some((pid) => pid === x || ((G.PART[pid].from || []).includes(x))));
    return ok ? { ok: true } : { ok: false, why: z.why };
  };
  G.setZone = function (id) {
    const run = G.run;
    if (!run || run.stage !== 'creature' || run.habitat !== 'sea' || !G.SEA_ZONE[id] || G.zone(run) === id) return;
    if (run.dna < G.MOVE_COST || !G.zoneState(run, id).ok) return;
    run.dna -= G.MOVE_COST;
    run.zone = id;
    log(run, `Your kind moved to ${G.SEA_ZONE[id].name}.`);
    G.saveRun();
  };

  // Relative body size (1 = an ordinary creature), and how it reads in real units.
  G.bodySize = (run) => {
    if (run.stage === 'cell') return run.multicellular ? 1.4 : 1;
    const base = { small: 0.45, mid: run.era >= 2 ? 1.25 : 1, giant: 2.8 }[G.sizeOf(run)];
    return base * (G.segments(run) >= 5 && G.symmetry(run) === 'bilateral' ? 1.2 : 1) * (G.symmetry(run) === 'colonial' ? 1.3 : 1);
  };
  G.sizeLabel = (size, stage) => (stage === 'cell' ? `${Math.round(size * 30)} µm` : size * 1.2 >= 1 ? `${(size * 1.2).toFixed(1)} m` : `${Math.round(size * 120)} cm`);

  // Slots available right now (cell slots marked `multi` wait for multicellularity).
  // Twin sockets: an Evolution Tree upgrade lets one slot hold a second part ("hands2").
  G.twinOwned = (slotId) => G.BOONS.some((b) => b.twin === slotId && G.boonLevel(b.id) > 0);
  G.baseSlot = (slotId) => String(slotId).replace(/2$/, '');
  G.allSlots = (run) => {
    const out = [];
    G.SLOTS[run.plan].forEach((s) => { out.push(s); if (G.twinOwned(s.id)) out.push({ id: `${s.id}2`, name: `${s.name} (2nd)`, multi: s.multi, twin: true, base: s.id }); });
    return out;
  };
  G.slotsFor = (run) => { const off = G.offSlots(run); return G.allSlots(run).filter((s) => (!s.multi || run.multicellular) && !off.includes(s.id)); };
  // The sockets a part can go into right now (one, or two with a Twin upgrade).
  G.socketsFor = (run, part) => G.slotsFor(run).filter((s) => G.baseSlot(s.id) === part.slot).map((s) => s.id);
  G.slotName = (run, slotId) => (G.allSlots(run).find((s) => s.id === slotId) || { name: slotId }).name;

  // Every part id on the body, merged halves included.
  G.partIds = (run) => {
    const out = [];
    const off = G.offSlots(run);
    Object.entries(run.parts).forEach(([slot, s]) => { if (s && !off.includes(slot)) { out.push(s.id); if (s.merged) out.push(s.merged); } });
    return out;
  };

  G.canMerge = () => true;

  // Display name of what fills a slot, e.g. "Venomous Fangs" for Fangs merged with Venom Fangs.
  G.slotLabel = (slot) => {
    if (!slot) return '';
    const base = G.PART[slot.id];
    if (!slot.merged) return base.name;
    return `${G.PART[slot.merged].adj} ${base.name}`;
  };

  // What the renderer needs to draw a body. Other species have the same shape.
  G.bodyOf = (run) => ({ stage: run.stage, habitat: run.habitat, multicellular: run.multicellular, parts: run.parts, symmetry: G.symmetry(run), segments: G.segments(run), off: G.offSlots(run), hue: (run.look && run.look.hue != null) ? run.look.hue : G.ARCHETYPE[run.archetype].color, traits: run.traits, look: G.effectiveLook(run) });

  // ---------- Appearance ----------
  G.lookOptionState = (run, opt) => {
    const n = opt.need;
    if (opt.only && run.habitat !== opt.only) return { ok: false, why: opt.why, hidden: true };
    if (!n) return { ok: true };
    if (run.stage !== 'creature') return { ok: false, why: opt.why };
    if (n.keyword && !(G.keywordCounts(run)[n.keyword] > 0)) return { ok: false, why: opt.why };
    if (n.era && run.era < n.era) return { ok: false, why: opt.why };
    if (n.habitat && run.habitat !== n.habitat) return { ok: false, why: opt.why };
    if (n.diet && G.diet(run) !== n.diet) return { ok: false, why: opt.why };
    if (n.stat && G.stat(run, n.stat[0]) < n.stat[1]) return { ok: false, why: opt.why };
    if (n.tag && !G.hasTag(run, n.tag)) return { ok: false, why: opt.why };
    return { ok: true };
  };
  // The look actually shown: choices that are no longer allowed fall back to the first option.
  G.effectiveLook = (run) => {
    const l = Object.assign({ pattern: 'plain', shape: 'round', neck: 'short', eyes: 'round', posture: 'four', head: 'round', fins: 'plain' }, run.look || {});
    Object.keys(G.APPEARANCE).forEach((k) => {
      const opt = G.APPEARANCE[k].find((o) => o.id === l[k]);
      if (!opt || !G.lookOptionState(run, opt).ok) l[k] = G.APPEARANCE[k][0].id;
    });
    if (G.hasTag(run, 'biped') && !(run.look && run.look.posture)) l.posture = 'two';
    return l;
  };
  G.setLook = (key, value) => {
    const run = G.run;
    if (!run) return;
    run.look = run.look || {};
    if (key === 'hue' || key === 'accent') run.look[key] = Number(value);
    else {
      const opt = (G.APPEARANCE[key] || []).find((o) => o.id === value);
      if (!opt || !G.lookOptionState(run, opt).ok) return;
      run.look[key] = value;
    }
    G.saveRun();
  };

  G.hasTag = (run, tag) => G.partIds(run).some((id) => (G.PART[id].tags || []).includes(tag));

  G.keywordCounts = function (run) {
    const counts = {};
    G.partIds(run).forEach((pid) => {
      (G.PART[pid].keywords || []).forEach((k) => { counts[k] = (counts[k] || 0) + 1; });
    });
    return counts;
  };

  G.activeSynergies = function (run) {
    const out = [];
    const counts = G.keywordCounts(run);
    Object.keys(counts).forEach((k) => {
      [2, 3].forEach((tier) => { if (counts[k] >= tier) out.push({ keyword: k, tier, mods: G.KEYWORDS[k].tiers[tier].mods }); });
    });
    return out;
  };

  G.diet = (run) => {
    const s = run.parts.mouth;
    if (!s) return 'omni';
    const a = G.PART[s.id].diet;
    const b = s.merged && G.PART[s.merged].diet;
    if (a && b && a !== b) return 'omni';
    return a || b || 'omni';
  };
  G.DIET_NAMES = { herb: 'Herbivore', carn: 'Carnivore', omni: 'Omnivore' };

  // ---------- Stats and modifiers ----------
  function modSources(run) {
    const list = [];
    list.push(G.ARCHETYPE[run.archetype].mods);
    list.push(G.ORIGIN[run.origin].mods);
    G.partIds(run).forEach((pid) => list.push(G.PART[pid].mods));
    run.traits.forEach((t) => { if (G.TRAITS[t]) list.push(G.TRAITS[t].mods); });
    run.innovations.forEach((i) => list.push(G.INNOVATION[i].mods));
    G.activeSynergies(run).forEach((s) => list.push(s.mods));
    const allies = run.species.filter((s) => !s.extinct && G.speciesStatus(s) === 'allied').length;
    if (allies) list.push({ foodPerTurn: allies });
    if (run.instinct === 'hide') list.push({ damageReduce: 1 });
    if (run.stage === 'creature') { list.push(G.SYMMETRY[G.symmetry(run)].mods); list.push(G.segmentPlan(run).mods); }
    if (run.stage === 'creature' && run.habitat === 'sea') list.push(G.SEA_ZONE[G.zone(run)].mods);
    // Symbiotes share a third of their partner's strengths.
    const partner = G.partnerOf(run);
    if (partner) { const m = {}; G.STATS.forEach((st) => { m[st.id] = Math.floor(G.speciesStat(partner, st.id) / 6); }); list.push(m); }
    G.BOONS.forEach((b) => { const lvl = G.boonLevel(b.id); if (b.mods && lvl) { const m = {}; Object.entries(b.mods).forEach(([k, v]) => { m[k] = v * lvl; }); list.push(m); } });
    if (run.hostility >= 2) list.push({ upkeep: 1 });
    if (run.hostility >= 4) list.push({ maxPop: -2 });
    return list;
  }

  G.mod = (run, key) => modSources(run).reduce((s, m) => s + ((m && m[key]) || 0), 0);
  // Cells start a little sturdier so early checks are not hopeless.
  G.stat = (run, key) => Math.max(0, (run.stage === 'cell' ? 2 : 1) + G.mod(run, key));
  // Event gains and losses are written for a herd of about 10.
  G.popScale = (run) => Math.max(1, G.maxPop(run) / 10);
  G.sizeOf = (run) => (run.traits.includes('giant') ? 'giant' : run.traits.includes('small_many') ? 'small' : 'mid');
  // Max Population grows with every milestone, then scales with body size:
  // small creatures live in big herds, giants in small ones.
  G.maxPop = (run) => {
    const base = run.baseMaxPop + (run.multicellular ? 2 : 0) + (run.stage === 'creature' ? 3 : 0) + (run.era - 1) * 3 + G.mod(run, 'maxPop');
    let max = Math.max(3, Math.round(base * G.SIZES[G.sizeOf(run)].popMult));
    const g = G.gimmick(run);
    if (g === 'grazer') max = Math.round(max * 1.6);
    // A parasite can never outgrow its host.
    if (g === 'parasite') { const h = G.hostOf(run); max = Math.min(max, h ? Math.max(3, Math.floor(h.pop * 0.6)) : 3); }
    return max;
  };
  G.foodCap = (run) => { const cap = Math.max(4, run.baseFoodCap + G.mod(run, 'foodCap')); return G.gimmick(run) === 'predator' ? Math.max(4, Math.floor(cap / 2)) : cap; };
  // Every member eats a share: mid-sized creatures 1 Food per 2 members, small per 3, giants per 1.5.
  G.upkeep = (run) => Math.max(1, Math.ceil(run.pop / G.SIZES[G.sizeOf(run)].eatDiv) + G.mod(run, 'upkeep'));
  G.growthCost = (run) => Math.max(1, G.GROWTH_COST + (run.instinct === 'breed' ? -1 : 0) + G.mod(run, 'growthCost'));

  // Food gathered each turn, with a breakdown for the UI.
  G.income = function (run) {
    const diet = G.diet(run);
    const g = G.gimmick(run);
    const parts = [{ label: 'Scraps', v: 1 }];
    // More members means more mouths, but also more gatherers.
    const crew = Math.floor(run.pop / 4);
    if (run.instinct === 'forage') parts.push({ label: 'Foraging', v: 2 + crew + G.mod(run, 'forageBonus') + (diet === 'herb' ? 1 : diet === 'carn' ? -1 : 0) });
    if (run.instinct === 'hunt') parts.push({ label: g === 'predator' ? 'Hunting (on a kill)' : 'Hunting', v: 2 + crew + G.mod(run, 'huntBonus') + (diet === 'carn' ? 1 : diet === 'herb' ? -1 : 0) + (g === 'predator' ? 1 : 0), hunt: true });
    if (G.hostOf(run)) parts.push({ label: 'Feeding on your host', v: run.stage === 'creature' ? 3 : 2 });
    const partner = G.partnerOf(run);
    if (g === 'symbiote' && run.partner && (!partner || partner.pop < partner.cap * 0.3)) parts.push({ label: 'Your partner is struggling', v: -2 });
    if (run.instinct === 'explore' || run.instinct === 'hide') parts.push({ label: G.INSTINCT[run.instinct].name, v: -1 });
    const fpt = G.mod(run, 'foodPerTurn');
    if (fpt) parts.push({ label: 'Helpers and allies', v: fpt });
    const total = Math.max(0, parts.reduce((s, p) => s + p.v, 0));
    return { total, parts };
  };

  // Grazers earn DNA from the size of the herd instead of from time.
  G.dnaPerTurn = (run) => Math.max(1, (G.gimmick(run) === 'grazer' ? Math.floor(run.pop / 6) : 1) + G.mod(run, 'dnaPerTurn') + (run.instinct === 'explore' ? 1 + G.mod(run, 'exploreBonus') : 0));
  G.insightPerTurn = (run) => (run.mind ? 1 + Math.floor(G.stat(run, 'cun') / 5) + G.mod(run, 'insightPerTurn') : 0);

  // Checks get harder as a creature, in later eras, and the longer you linger in one (up to +2).
  // Primordia is harsh: a fresh lineage struggles, and the Evolution Tree is how later runs get further.
  // Every failed finale attempt teaches you something: the next try is a little easier.
  // Finales have their own difficulty, so the extra harshness does not apply to them.
  const finaleEase = (run) => (run.phase === 'event' && run.event && G.EVENT[run.event.id] && G.EVENT[run.event.id].finale ? (run.finaleTries || 0) + G.HARSH : 0);
  // A Mimic disguised as the species in this event finds everything easier.
  const disguise = (run) => { const m = G.mimicOf(run); return m && run.phase === 'event' && run.event && run.event.species != null && run.species[run.event.species] === m ? 2 : 0; };
  G.difficulty = (run, base) => base + G.HARSH - finaleEase(run) - disguise(run) + (run.stage === 'creature' ? 0.5 + (run.era - 1) * 1.5 : 0) + Math.min(2, Math.floor((run.eraTurn - 1) / 6)) + run.hostility;
  G.chance = (run, stat, base) => clamp(50 + (G.stat(run, stat) - G.difficulty(run, base)) * 12, 5, 95);

  G.speciesStatus = (s) => (s.opinion >= 50 ? 'allied' : s.opinion <= -50 ? 'hostile' : s.opinion >= 15 ? 'friendly' : s.opinion <= -15 ? 'wary' : 'neutral');

  G.partPool = function (run) {
    const packs = G.meta.unlocked.packs;
    const slots = G.slotsFor(run).map((s) => s.id);
    const known = run.knownEvos || [];
    return G.PARTS.filter((p) => p.stage === run.stage && (!p.evolved || known.includes(p.id))
      && slots.includes(p.slot)
      && (run.stage === 'cell' || !p.habitat || p.habitat === run.habitat)
      && (!p.pack || packs.includes(p.pack))
      && !(G.gimmick(run) === 'grazer' && p.diet === 'carn'));
  };

  function sub(text, run, speciesIdx) {
    const s = speciesIdx != null && speciesIdx >= 0 ? run.species[speciesIdx] : null;
    const words = G.wordsFor(run);
    return String(text || '').replace(/\{them\}/g, s ? s.name : 'others').replace(/\{(\w+)\}/g, (m, k) => (words[k] != null ? words[k] : m));
  }
  G.sub = sub;
  // Words that change with your body, so shared events read right on land and at sea.
  G.wordsFor = (run) => {
    const sea = run.stage === 'cell' || run.habitat === 'sea';
    const herd = run.stage === 'cell' || (run.stage === 'creature' && G.symmetry(run) === 'colonial') ? 'colony' : sea ? 'school' : 'herd';
    const w = { herd, nests: sea ? 'egg beds' : 'nests', cover: sea ? 'weed' : 'grass', home: sea ? 'the water' : 'the land', move: sea ? 'swim' : 'walk', depth: run.habitat === 'sea' ? G.SEA_ZONE[G.zone(run)].name : 'the valley' };
    w.Herd = herd[0].toUpperCase() + herd.slice(1);
    return w;
  };

  function log(run, text) {
    const st = G.STAGES[run.stage];
    run.log.unshift({ when: `${st.turnName} ${run.stageTurn}`, text });
    if (run.log.length > 80) run.log.length = 80;
  }

  function noteParts(run) { G.partIds(run).forEach((pid) => addUnique(G.meta.codex.parts, pid)); }

  // ---------- Species ----------
  // Other species are built from the same parts as you, so they can be drawn and inspected.
  function makeBody(world, diet) {
    const plan = world === 'cell' ? 'cell' : world;
    const stage = world === 'cell' ? 'cell' : 'creature';
    const multicellular = world !== 'cell' || rand() < 0.4;
    const parts = {};
    G.SLOTS[plan].forEach((slot) => {
      if (slot.multi && !multicellular) return;
      if (slot.id !== 'mouth' && rand() > (stage === 'cell' ? 0.6 : 0.7)) return;
      let pool = G.PARTS.filter((p) => p.stage === stage && (!p.evolved || p.limbEvo) && !p.limbMod && p.slot === slot.id && (stage === 'cell' || !p.habitat || p.habitat === world));
      if (slot.id === 'mouth') pool = pool.filter((p) => (diet === 'omni' ? !!p.diet : p.diet === diet));
      if (!pool.length) return;
      const first = pick(pool);
      const second = stage === 'creature' && rand() < 0.2 ? pick(pool.filter((p) => p.id !== first.id)) : null;
      parts[slot.id] = { id: first.id, merged: second ? second.id : null };
    });
    // Some land species have wings.
    if (world === 'land' && rand() < 0.22) parts.frontLimbs = { id: 'feathered_wings', merged: null };
    const r = rand();
    const symmetry = r < 0.14 ? 'radial' : r < 0.26 ? 'colonial' : 'bilateral';
    const segments = symmetry === 'radial' ? 4 + Math.floor(rand() * 4) : symmetry === 'colonial' ? 2 + Math.floor(rand() * 4) : pick([0, 1, 2, 2, 2, 2, 3, 4, 6]);
    return { plan, stage, multicellular, parts, symmetry, segments };
  }

  // How big each kind of species' population can grow.
  const SPECIES_CAP = { prey: 30, neighbor: 18, rival: 16, predator: 8 };

  // Where a sea species lives: glowing ones deep down, hunters in open water, prey on the reef.
  function speciesZone(role, body) {
    const glows = Object.values(body.parts || {}).some((sl) => sl && [sl.id, sl.merged].some((id) => id && (G.PART[id].keywords || []).includes('glow')));
    if (glows) return pick(['twilight', 'abyss']);
    return pick({ predator: ['open', 'open', 'twilight'], prey: ['reef', 'shallows'], rival: ['reef', 'open', 'shallows'], neighbor: ['reef', 'shallows', 'twilight'] }[role]);
  }

  function makeSpecies(world, roles) {
    const names = G.SPECIES_NAMES[world];
    const used = new Set();
    return roles.map((role) => {
      let name;
      do { name = pick(names.first) + pick(names.last); } while (used.has(name));
      used.add(name);
      const opinion = { predator: -35, prey: -10, rival: -5, neighbor: 10 }[role] + Math.round(rand() * 20) - 10;
      const diet = role === 'predator' ? 'carn' : role === 'prey' ? 'herb' : pick(['herb', 'carn', 'omni']);
      const body = makeBody(world, diet);
      const cap = Math.round(SPECIES_CAP[role] * (world === 'cell' ? 1.5 : 1));
      const sizeBase = { predator: 1.5, prey: 0.6, rival: 1, neighbor: 0.9 }[role] * (world === 'cell' ? 1 : 0.6 + rand() * 0.9);
      const zone = world === 'sea' ? speciesZone(role, body) : undefined;
      return { name, role, diet, opinion, hue: Math.floor(rand() * 360), size: Math.round(sizeBase * 100) / 100, seed: Math.floor(rand() * 1000), world, cap, pop: Math.round(cap * (0.5 + rand() * 0.3)), zone, ...body };
    });
  }

  const ROLE_BONUS = { predator: { str: 2, spd: 1 }, prey: { spd: 2, cun: 1 }, rival: { str: 1, tou: 1 }, neighbor: { cha: 2 } };
  G.speciesStat = (s, key) => {
    let v = (s.stage === 'cell' ? 2 : 1) + ((ROLE_BONUS[s.role] || {})[key] || 0) + ((key === 'str' || key === 'tou') ? Math.round((s.size - 1) * 2) : 0);
    const off = G.speciesBody(s).off;
    Object.entries(s.parts || {}).filter(([k]) => !off.includes(k)).map(([, slot]) => slot).forEach((slot) => [slot.id, slot.merged].filter(Boolean).forEach((id) => { v += (G.PART[id].mods[key] || 0); }));
    return Math.max(0, v);
  };
  G.speciesBody = (s) => {
    const sym = s.symmetry || 'bilateral';
    const n = s.segments != null ? s.segments : 2;
    const off = s.stage === 'creature' ? (G.SYMMETRY[sym].off || []).concat(sym === 'bilateral' ? (G.legPlan(n).off || []) : []) : [];
    return { stage: s.stage, habitat: s.world === 'cell' ? null : s.world, multicellular: s.multicellular, parts: s.parts || {}, hue: s.hue, traits: s.size >= 2.5 ? ['giant'] : [], symmetry: sym, segments: n, off };
  };

  // ---------- Starting and ending runs ----------
  G.newRun = function (archetypeId, originId, hostility) {
    const arch = G.ARCHETYPE[archetypeId];
    const b = G.meta.boons;
    const run = {
      v: 2, archetype: archetypeId, origin: originId, hostility: hostility || 0,
      stage: 'cell', plan: 'cell', habitat: null, era: 1, eraTurn: 1, turn: 1, stageTurn: 1,
      baseMaxPop: G.BASE_POP + (b.hardy || 0),
      baseFoodCap: G.FOOD_CAP + 2 * (b.pantry || 0),
      pop: G.START_POP, food: G.BASE_FOOD + 3 * (b.pantry || 0),
      dna: 3 * (b.memory || 0), totalDna: 0, insight: 0,
      parts: {}, multicellular: false, mind: false, innovations: [], fascination: null,
      instinct: 'forage',
      traits: [], species: makeSpecies('cell', ['predator', 'prey', 'rival', 'neighbor']),
      seen: [], log: [], notices: [],
      draftsTaken: 0, milestonesDone: [], finaleRetryAt: 0,
      phase: 'map', event: null, scene: null, draft: null, lastTurn: null, legacy: null, result: null, lastEvent: null,
      quietTicks: 2, look: {}, knownEvos: G.meta.codex.evolutions.slice(),
    };
    Object.entries(arch.start.cell).forEach(([slot, id]) => { run.parts[slot] = { id, merged: null }; });
    setupGimmick(run);
    run.pop = Math.min(run.pop, G.maxPop(run));
    log(run, `Life stirs in the ${G.ORIGIN[originId].name}. A new ${arch.name} lineage begins.`);
    run.notices.push(`You share these waters with the ${run.species.map((s) => s.name).join(', ')}.`);
    G.meta.stats.runs += 1;
    noteParts(run);
    G.run = run;
    if (G.boonLevel('head_start')) startDraft(run);
    save();
    return run;
  };

  // Pick partners, hosts and starting Instincts for the archetype's gimmick.
  function setupGimmick(run) {
    const g = G.gimmick(run);
    const alive = run.species.filter((s) => !s.extinct);
    if (g === 'symbiote') {
      const p = alive.find((s) => s.role === 'neighbor') || alive.find((s) => s.role !== 'predator') || alive[0];
      if (p) { run.partner = p.name; p.opinion = 100; }
    }
    if (g === 'parasite') {
      const h = alive.filter((s) => s.role !== 'predator').sort((a, b) => b.pop - a.pop)[0] || alive[0];
      if (h) run.host = h.name;
    }
    if (g === 'drifter') { const d = G.diet(run); run.instinct = d === 'carn' ? 'hunt' : 'forage'; run.nextDrift = run.turn + G.DRIFT_EVERY; }
    if (g === 'predator') { run.instinct = 'hunt'; run.hunger = 0; if (run.stage === 'cell') run.food += 3; }
    if (g === 'mimic') run.mimic = null;
  }

  function endRun(run, victory, cause) {
    const base = Math.floor(run.totalDna / 3);
    const progress = (run.multicellular ? 5 : 0) + (run.stage === 'creature' ? 10 : 0) + (run.era >= 2 ? 5 : 0) + (run.era >= 3 ? 10 : 0);
    const winBonus = victory ? 40 : 0;
    const mult = (1 + 0.25 * run.hostility) * (run.revived ? G.REVIVE_MULT : 1);
    const genes = Math.round((base + progress + winBonus) * mult);
    const m = G.meta;
    m.genes += genes;
    if (victory) {
      m.stats.wins += 1;
      m.maxHostility = Math.max(m.maxHostility, Math.min(G.MAX_HOSTILITY, run.hostility + 1));
      if (run.legacy) addUnique(m.codex.legacies, run.legacy);
    } else {
      m.stats.extinctions += 1;
    }
    m.stats.bestDna = Math.max(m.stats.bestDna || 0, run.totalDna);
    run.result = { victory, cause, genes, breakdown: { base, progress, winBonus, mult, revived: !!run.revived } };
    m.history.unshift({ date: Date.now(), archetype: run.archetype, origin: run.origin, victory, cause: victory ? G.LEGACIES[run.legacy].name : cause, reached: G.reachedLabel(run), genes, turns: run.turn, revived: !!run.revived, body: G.bodyOf(run) });
    m.history = m.history.slice(0, 30);
    run.phase = 'end';
    log(run, victory ? `${G.LEGACIES[run.legacy].name}: the age of tribes begins.` : `Extinction. ${cause}`);
    save();
  }

  // Per-turn rules for hosts, partners, buds and the drifting current.
  function gimmickTurn(run, lines) {
    const g = G.gimmick(run);
    if (g === 'parasite') {
      const h = G.hostOf(run);
      if (h) {
        h.pop = Math.max(0, h.pop - Math.max(0.3, run.pop * 0.04));
        h.opinion = clamp(h.opinion - 2, -100, 100);
      } else {
        // The host is gone: most of you die with it, and the survivors find a new one.
        const lost = Math.ceil(run.pop / 2);
        run.pop -= lost;
        const next = run.species.filter((s) => !s.extinct).sort((a, b) => b.pop - a.pop)[0];
        run.host = next ? next.name : null;
        lines.push({ t: `Your host died out: −${lost} Population${next ? `. The survivors moved into the ${next.name}` : ''}`, bad: true });
        if (next) run.notices.push(`Your host died out. The survivors moved into the ${next.name}.`);
      }
    }
    if (g === 'symbiote' && run.partner && !G.partnerOf(run)) {
      const lost = Math.ceil(run.pop / 2);
      run.pop -= lost;
      const next = run.species.filter((s) => !s.extinct).sort((a, b) => b.opinion - a.opinion)[0];
      lines.push({ t: `Your partner died out: −${lost} Population`, bad: true });
      run.partner = next ? next.name : null;
      if (next) { next.opinion = Math.max(next.opinion, 60); run.notices.push(`Your partner died out, and half of you with it. The ${next.name} have become your new partners.`); }
    }
    if (g === 'colony' && run.pop >= G.maxPop(run) && run.food >= G.growthCost(run) * 2 && G.budsOf(run).length < 3 && run.pop >= 6) bud(run, lines);
  }

  // Part of a Colony splits off as a new, allied species with your body.
  function bud(run, lines) {
    const n = Math.ceil(run.pop / 3);
    run.pop -= n;
    run.food -= G.growthCost(run) * 2;
    const world = run.stage === 'cell' ? 'cell' : run.habitat;
    const names = G.SPECIES_NAMES[world];
    let name; let guard = 0;
    do { name = pick(names.first) + pick(names.last); } while (run.species.some((s) => s.name === name) && guard++ < 20);
    const body = G.bodyOf(run);
    const parts = {};
    Object.entries(run.parts).forEach(([k, v]) => { if (v && !k.endsWith('2')) parts[k] = { id: v.id, merged: v.merged }; });
    run.species.push({ name, role: 'neighbor', diet: G.diet(run), opinion: 100, hue: (body.hue + 25) % 360, size: G.bodySize(run), seed: Math.floor(rand() * 1000), world, cap: 14, pop: n,
      plan: run.plan, stage: run.stage, multicellular: run.multicellular, parts, symmetry: G.symmetry(run), segments: G.segments(run), zone: run.habitat === 'sea' ? G.zone(run) : undefined, bud: true });
    lines.push({ t: `${n} of you split off and founded the ${name}, your allies`, good: true });
    run.notices.push(`Part of your colony split off and founded the ${name}. They are your allies.`);
    log(run, `The ${name} budded off from your colony.`);
  }

  // The current carries a Drifter somewhere new.
  function drift(run) {
    run.nextDrift = run.turn + G.DRIFT_EVERY;
    // The current pushes you to forage or hunt, whichever suits your mouth best (omnivores get either).
    const diet = G.diet(run);
    run.instinct = diet === 'herb' ? 'forage' : diet === 'carn' ? 'hunt' : pick(['forage', 'hunt']);
    // You leave your worst enemy behind and meet someone new.
    const movable = run.species.filter((s) => !s.extinct && !s.bud).sort((a, b) => a.opinion - b.opinion);
    let met = null;
    if (movable.length) {
      const gone = movable[0];
      const fresh = makeSpecies(run.stage === 'cell' ? 'cell' : run.habitat, [gone.role])[0];
      run.species[run.species.indexOf(gone)] = fresh;
      met = fresh;
    }
    run.food += 1;
    run.notices.push(`The current carries you to new waters${met ? `, where you meet the ${met.name}` : ''}. It now pushes you to ${G.INSTINCT[run.instinct].name.toLowerCase()}.`);
    log(run, `The current carried your kind somewhere new.`);
    const source = met || pick(run.species.filter((s) => !s.extinct));
    if (source && rand() < 0.5) run.pendingSpecial = { name: source.name, source: 'absorb' };
  }

  // Drafts made from another species' parts (absorb, devour, steal, copy).
  function speciesDraftOptions(run, s) {
    const ids = [];
    Object.values(s.parts || {}).forEach((sl) => { if (sl) [sl.id, sl.merged].forEach((id) => { if (id && !ids.includes(id)) ids.push(id); }); });
    const have = G.partIds(run);
    const slots = G.slotsFor(run).map((x) => G.baseSlot(x.id));
    return ids.filter((id) => {
      const p = G.PART[id];
      return p && p.stage === run.stage && (run.stage === 'cell' || !p.habitat || p.habitat === run.habitat) && slots.includes(p.slot) && !have.includes(id)
        && !(G.gimmick(run) === 'grazer' && p.diet === 'carn');
    }).sort(() => rand() - 0.5).slice(0, 3);
  }
  function startSpecialDraft(run) {
    const sp = run.pendingSpecial;
    run.pendingSpecial = null;
    const s = run.species.find((x) => x.name === sp.name);
    const options = s ? speciesDraftOptions(run, s) : [];
    if (!options.length) { run.notices.push(`The ${sp.name} had nothing new for you: +${gainDna(run, 2)} DNA instead.`); return false; }
    run.draft = { options, rerolls: 0, source: sp.source, from: sp.name };
    run.phase = 'draft';
    return true;
  }
  // Gimmick actions from the sheets. Each costs a little DNA.
  function payGimmick(run) {
    if (!run || run.phase !== 'map' || run.dna < G.GIMMICK_COST) return false;
    run.dna -= G.GIMMICK_COST;
    return true;
  }
  G.stealFromHost = function () {
    const run = G.run; const h = G.hostOf(run);
    if (!h || !payGimmick(run)) return;
    h.opinion = clamp(h.opinion - 10, -100, 100);
    run.pendingSpecial = { name: h.name, source: 'steal' };
    nextStep(run, false); save();
  };
  G.jumpHost = function (name) {
    const run = G.run; const s = speciesNamed(run, name);
    if (G.gimmick(run) !== 'parasite' || !s || run.host === name || !payGimmick(run)) return;
    const lost = Math.ceil(run.pop / 4);
    run.pop = Math.max(1, run.pop - lost);
    run.host = name;
    s.opinion = clamp(s.opinion - 20, -100, 100);
    run.notices.push(`You jumped into a new host: the ${name}. ${lost} of you were lost on the way.`);
    log(run, `Your kind jumped into a new host, the ${name}.`);
    save();
  };
  G.mimicSpecies = function (name) {
    const run = G.run; const s = speciesNamed(run, name);
    if (G.gimmick(run) !== 'mimic' || !s || !payGimmick(run)) return;
    run.mimic = name;
    run.look = run.look || {};
    run.look.hue = s.hue;
    run.notices.push(`You now pass as one of the ${name}.`);
    log(run, `Your kind disguised itself as the ${name}.`);
    run.pendingSpecial = { name, source: 'copy' };
    nextStep(run, false); save();
  };
  // Swap a part with your partner: theirs comes to you, yours goes to them.
  G.swapWithPartner = function (slot) {
    const run = G.run; const p = G.partnerOf(run);
    if (!p || !p.parts[slot] || !payGimmick(run)) return;
    const theirs = p.parts[slot];
    const mine = run.parts[slot];
    if (mine) p.parts[slot] = { id: mine.id, merged: mine.merged }; else delete p.parts[slot];
    run.parts[slot] = { id: theirs.id, merged: theirs.merged };
    noteParts(run);
    run.notices.push(`You swapped parts with the ${p.name}: you now have ${G.slotLabel(run.parts[slot])}.`);
    run.pop = Math.min(run.pop, G.maxPop(run));
    save();
  };
  G.partnerSwaps = (run) => {
    const p = G.partnerOf(run);
    if (!p) return [];
    const slots = G.slotsFor(run).map((x) => x.id);
    return Object.entries(p.parts || {}).filter(([k, v]) => v && slots.includes(k) && G.PART[v.id] && G.PART[v.id].stage === run.stage).map(([k, v]) => ({ slot: k, part: v }));
  };

  // The Second Chance upgrade: once per run, a few survivors cling on.
  function secondChance(run) {
    if (!G.boonLevel('second_chance') || run.secondChanceUsed) return false;
    run.secondChanceUsed = true;
    run.pop = 3;
    run.notices.push('Second Chance: your kind should have died out, but a few survivors cling on.');
    log(run, 'A few survivors cling on against all odds.');
    return true;
  }

  G.endRunEarly = function () {
    if (G.run && G.run.phase !== 'end') endRun(G.run, false, 'You ended this lineage.');
  };

  // ---------- Effects ----------
  function gainDna(run, n) {
    const amount = n > 0 ? Math.round(n * G.ORIGIN[run.origin].dnaMult * (1 + 0.1 * G.boonLevel('rich_genes'))) : n;
    run.dna = Math.max(0, run.dna + amount);
    if (amount > 0) run.totalDna += amount;
    return amount;
  }

  // Later eras are more dangerous: the Age of Giants and beyond hit 1 harder.
  function damage(run, n) {
    // Event numbers are written for a herd of about 10, so they scale with your herd size.
    // Small creatures lose even more members to the same blow.
    const n2 = Math.max(1, n + (run.era >= 2 ? 1 : 0) - G.mod(run, 'damageReduce'));
    const scale = Math.max(1, Math.min(G.maxPop(run), run.pop) / 10);
    const dmg = Math.max(1, Math.ceil(n2 * scale * G.SIZES[G.sizeOf(run)].damageMult * (G.gimmick(run) === 'grazer' ? 1.5 : 1)));
    run.pop -= dmg;
    return dmg;
  }

  function grow(run, n) {
    const before = run.pop;
    run.pop = Math.min(G.maxPop(run), run.pop + Math.ceil(n * G.popScale(run)));
    return run.pop - before;
  }

  // What two parts become when merged, if anything.
  G.evolutionOf = (a, b) => G.RECIPE[G.recipeKey(a, b)] || null;
  G.evolutionKnown = (id) => G.meta.codex.evolutions.includes(id);

  // If a slot's two halves form a recipe, it evolves into a single new part.
  function tryEvolve(run, slotId) {
    const slot = run.parts[slotId];
    if (!slot || !slot.merged) return null;
    const evo = G.evolutionOf(slot.id, slot.merged);
    if (!evo) return null;
    run.parts[slotId] = { id: evo, merged: null };
    addUnique(G.meta.codex.parts, evo);
    const first = addUnique(G.meta.codex.evolutions, evo);
    if (first) { G.meta.genes += 5; run.notices.push(`New evolution discovered: ${G.PART[evo].name}. +5 Genetic Memory, and it is now in your Codex.`); }
    log(run, `Evolution: ${G.PART[evo].name}!`);
    run.lastEvolution = evo;
    return { id: evo, first };
  }

  // Put a part on the body: fill an empty slot, merge with what is there, or replace it.
  function installPart(run, part, mode, socket) {
    // Which socket: the one asked for, else the first empty one, else the main one.
    const sockets = G.socketsFor(run, part);
    const key = sockets.includes(socket) ? socket : (sockets.find((k) => !run.parts[k]) || part.slot);
    const slot = run.parts[key];
    let text;
    if (!slot) {
      run.parts[key] = { id: part.id, merged: null };
      text = `${part.name} grows in your ${G.slotName(run, key).toLowerCase()} slot`;
    } else if (mode === 'merge' && !slot.merged && G.canMerge(run)) {
      const before = G.slotLabel(slot);
      slot.merged = part.id;
      text = `${before} merges with ${part.name}: ${G.slotLabel(slot)}`;
    } else if (slot.merged && mode !== 'replace') {
      // A merged slot stays merged: the new part swaps out one half.
      const dropBase = mode === 'swapBase' || (mode !== 'swapMerged' && rand() < 0.5);
      const gone = G.PART[dropBase ? slot.id : slot.merged];
      const kept = dropBase ? slot.merged : slot.id;
      const before = G.slotLabel(slot);
      run.parts[key] = { id: kept, merged: part.id };
      text = `${part.name} takes the place of ${gone.name}: ${before} becomes ${G.slotLabel(run.parts[key])}`;
    } else {
      const before = G.slotLabel(slot);
      run.parts[key] = { id: part.id, merged: null };
      text = `${part.name} replaces ${before}`;
    }
    addUnique(G.meta.codex.parts, part.id);
    const before = run.parts[key] && run.parts[key].merged ? [G.PART[run.parts[key].id].name, G.PART[run.parts[key].merged].name] : null;
    const evo = tryEvolve(run, key);
    if (evo) text = `${before[0]} + ${before[1]} evolved into ${G.PART[evo.id].name}!`;
    run.pop = Math.min(run.pop, G.maxPop(run));
    return text;
  }

  function applyEffects(run, eff, speciesIdx) {
    const lines = [];
    if (!eff) return lines;
    if (eff.pop) {
      if (eff.pop < 0) lines.push({ t: `−${damage(run, -eff.pop)} Population`, bad: true });
      else { const g = grow(run, eff.pop); lines.push({ t: g ? `+${g} Population` : 'Population already at its limit' }); }
    }
    if (eff.food) {
      const before = run.food;
      run.food = Math.max(0, run.food + eff.food);
      const d = run.food - before;
      if (d) lines.push({ t: `${d > 0 ? '+' : '−'}${Math.abs(d)} Food`, bad: d < 0 });
    }
    if (eff.dna) lines.push({ t: `+${gainDna(run, eff.dna)} DNA`, good: true });
    if (eff.insight) {
      run.insight += eff.insight;
      lines.push({ t: `+${eff.insight} Insight`, good: true });
    }
    if (eff.trait) {
      if (addUnique(run.traits, eff.trait)) {
        lines.push({ t: `New trait: ${G.TRAITS[eff.trait].name}`, good: true });
        run.pop = Math.min(run.pop, G.maxPop(run));
      } else {
        lines.push({ t: `Already ${G.TRAITS[eff.trait].name}: +${gainDna(run, 1)} DNA` });
      }
    }
    if (eff.loseTrait && run.traits.includes(eff.loseTrait)) {
      run.traits = run.traits.filter((t) => t !== eff.loseTrait);
      lines.push({ t: `Lost trait: ${G.TRAITS[eff.loseTrait].name}`, bad: true });
    }
    if (eff.opinion && speciesIdx != null && speciesIdx >= 0 && run.species[speciesIdx]) {
      const s = run.species[speciesIdx];
      const before = G.speciesStatus(s);
      s.opinion = clamp(s.opinion + eff.opinion, -100, 100);
      const after = G.speciesStatus(s);
      lines.push({ t: `${s.name} opinion ${eff.opinion > 0 ? '+' : '−'}${Math.abs(eff.opinion)}`, bad: eff.opinion < 0 });
      if (before !== after && (after === 'allied' || after === 'hostile')) {
        lines.push({ t: `The ${s.name} are now ${after === 'allied' ? 'your allies' : 'hostile'}`, good: after === 'allied', bad: after === 'hostile' });
      }
    }
    if (eff.randomPart) {
      const ids = G.partIds(run);
      const options = G.partPool(run).filter((p) => !ids.includes(p.id));
      if (options.length) lines.push({ t: installPart(run, pick(options), 'merge'), good: true });
    }
    // Gimmick effects
    const partner = G.partnerOf(run); const host = G.hostOf(run);
    if (eff.partnerPop && partner) { partner.pop = Math.max(0, partner.pop + eff.partnerPop); lines.push({ t: `Your partners ${eff.partnerPop > 0 ? '+' : '−'}${Math.abs(eff.partnerPop)}`, bad: eff.partnerPop < 0 }); }
    if (eff.hostPop && host) { host.pop = Math.max(0, host.pop + eff.hostPop); host.opinion = clamp(host.opinion + (eff.hostPop < 0 ? -10 : 5), -100, 100); lines.push({ t: `Your host ${eff.hostPop > 0 ? '+' : '−'}${Math.abs(eff.hostPop)}`, bad: eff.hostPop > 0 }); }
    if (eff.fed) { run.hunger = 0; lines.push({ t: 'Your hunger is sated', good: true }); }
    if (eff.drift && G.gimmick(run) === 'drifter') { drift(run); lines.push({ t: 'The current carries you somewhere new', good: true }); }
    if (eff.unmask && run.mimic) { lines.push({ t: `You are no longer disguised as the ${run.mimic}` }); run.mimic = null; }
    if (eff.newHost && G.gimmick(run) === 'parasite') {
      const next = run.species.filter((x) => !x.extinct && x.name !== run.host).sort((a, b) => b.pop - a.pop)[0];
      if (next) { run.host = next.name; lines.push({ t: `New host: the ${next.name}`, good: true }); }
    }
    if (eff.budGoes) {
      const b = G.budsOf(run)[0];
      if (b) { b.bud = false; b.opinion = 20; lines.push({ t: `The ${b.name} go their own way` }); }
    }
    if (eff.budBack) {
      const b = G.budsOf(run)[0];
      if (b) { const back = Math.round(b.pop); b.extinct = true; b.pop = 0; lines.push({ t: `+${grow(run, back)} Population as the ${b.name} rejoin you`, good: true }); }
    }
    if (eff.zone && run.habitat === 'sea' && G.zone(run) !== eff.zone) {
      run.zone = eff.zone;
      lines.push({ t: `New home: ${G.SEA_ZONE[eff.zone].name}`, good: true });
    }
    if (eff.legacy) run.legacy = eff.legacy;
    if (eff.setback != null) {
      if (run.stage === 'cell' && eff.setback) {
        run.dna = Math.max(0, run.dna - eff.setback);
        lines.push({ t: `−${eff.setback} DNA: you must grow more before trying again`, bad: true });
      }
      run.finaleRetryAt = run.turn + 3;
      run.finaleTries = (run.finaleTries || 0) + 1;
      lines.push({ t: 'You can try again in 3 turns', bad: true });
    }
    return lines;
  }

  // Pick an animation for the scene from what happened.
  function sceneAnim(res, opt, success) {
    if (res && res.anim) return res.anim;
    if (res && res.pop < 0) return 'hurt';
    if (res && res.randomPart) return 'mutate';
    if (opt.check && success) {
      if (opt.check.stat === 'str') return 'attack';
      if (opt.check.stat === 'spd') return 'flee';
      if (opt.check.stat === 'cha') return 'social';
    }
    if (res && res.food > 0) return 'eat';
    if (res && (res.trait || res.insight)) return 'mutate';
    if (res && res.opinion > 0) return 'social';
    return 'rest';
  }

  // What the scene acts out, so the animation matches what happened.
  function sceneStory(run, ev, opt, res, success, sp) {
    const stat = opt.check && opt.check.stat;
    const pop = (res && res.pop) || 0;
    const food = (res && res.food) || 0;
    const op = (res && res.opinion) || 0;
    if (sp == null || sp < 0) return null;
    const role = run.species[sp].role;
    if (res && res.anim === 'social' && success !== false) return 'befriend';
    if (success === false) {
      if (stat === 'cha') return 'rebuffed';
      if (stat === 'spd' || pop < 0 || role === 'predator') return 'mauled';
      if (stat === 'str') return 'brawl_lose';
      return 'standoff';
    }
    if (food > 0 && (stat === 'str' || stat === 'spd' || stat === 'cun' || !stat) && op <= 0 && role !== 'neighbor' && !(ev.tags || []).includes('social')) return 'chase';
    if (stat === 'str' || (res && res.anim === 'attack')) return 'brawl_win';
    if (stat === 'spd' || (res && res.anim === 'flee')) return 'escape';
    if (op > 0 || stat === 'cha') return 'befriend';
    if (op < 0) return 'rebuffed';
    if (pop < 0) return 'mauled';
    return 'standoff';
  }

  // How your creature feels about what just happened, for its face.
  function sceneMood(res, opt, success) {
    if (res && res.mood) return res.mood;
    if (res && res.pop < 0) return success === false ? 'dizzy' : 'sad';
    if (success === false) return 'worried';
    const anim = sceneAnim(res, opt, success);
    return { attack: 'angry', flee: 'scared', eat: 'happy', social: 'love', rest: 'sleepy', mutate: 'surprised', grow: 'proud' }[anim] || 'happy';
  }

  // ---------- Events ----------
  function speciesFor(run, role) {
    if (!role) return null;
    const idx = run.species.map((s, i) => i).filter((i) => {
      const s = run.species[i];
      if (s.extinct) return false;
      const st = G.speciesStatus(s);
      if (role === 'any') return true;
      if (role === 'hostile' || role === 'allied') return st === role;
      return s.role === role;
    });
    return idx.length ? pick(idx) : -1;
  }

  function eventAllowed(run, e) {
    if (e.finale || e.milestone) return false;
    if (e.stage !== run.stage && e.stage !== 'any') return false;
    if (e.habitat && e.habitat !== run.habitat) return false;
    if (e.zones && !(run.habitat === 'sea' && e.zones.includes(G.zone(run)))) return false;
    if (e.era && run.era < e.era) return false;
    if (e.multi === true && !run.multicellular) return false;
    if (e.multi === false && run.multicellular) return false;
    if (!e.repeat && run.seen.includes(e.id)) return false;
    if (e.when && !e.when(run)) return false;
    if (e.species && speciesFor(run, e.species) === -1) return false;
    return true;
  }

  function eventWeight(run, e) {
    let w = e.weight || 1;
    if (e.origins && e.origins.includes(run.origin)) w *= 3;
    const focus = G.INSTINCT[run.instinct].tags;
    if ((e.tags || []).some((t) => focus.includes(t))) w *= 2.2;
    if (run.instinct === 'hide' && (e.tags || []).includes('danger')) w *= 0.5;
    if (!e.repeat) w *= 1.5; // prefer fresh events over repeatable ones
    return w;
  }

  function setEvent(run, ev) {
    const s = speciesFor(run, ev.species);
    run.event = { id: ev.id, species: s === -1 ? null : s };
    run.lastEvent = ev.id;
    run.phase = 'event';
  }

  function drawEvent(run) {
    let pool = G.EVENTS.filter((e) => eventAllowed(run, e));
    if (pool.length > 1) pool = pool.filter((e) => e.id !== run.lastEvent);
    const ev = pool.length ? weightedPick(pool, (e) => eventWeight(run, e)) : G.EVENT.quiet_time;
    setEvent(run, ev);
  }

  G.optionState = function (run, opt) {
    const req = opt.req || {};
    let reason = null;
    if (req.diet && !req.diet.includes(G.diet(run))) reason = `Needs a ${req.diet.map((d) => G.DIET_NAMES[d]).join(' or ')} mouth`;
    else if (req.keyword && (G.keywordCounts(run)[req.keyword[0]] || 0) < req.keyword[1]) reason = `Needs ${req.keyword[1]} ${G.KEYWORDS[req.keyword[0]].name} part${req.keyword[1] > 1 ? 's' : ''}`;
    else if (req.trait && !run.traits.includes(req.trait)) reason = `Needs the ${G.TRAITS[req.trait].name} trait`;
    else if (req.part && !G.partIds(run).includes(req.part)) reason = `Needs ${G.PART[req.part].name}`;
    else if (req.tag === 'grasp' && !G.hasTag(run, 'grasp')) reason = 'Needs a part that can grasp (hands, arms, tentacles, trunk)';
    else if (req.tag === 'flight' && !G.hasTag(run, 'flight')) reason = 'Needs wings that can fly';
    else if (req.innovation && !run.innovations.includes(req.innovation)) reason = `Needs the ${G.INNOVATION[req.innovation].name} innovation`;
    else if (req.symmetry && G.symmetry(run) !== req.symmetry) reason = `Needs ${G.SYMMETRY[req.symmetry].name.toLowerCase()} symmetry`;
    else if (req.serpent && !(run.stage === 'creature' && G.symmetry(run) === 'bilateral' && G.segments(run) === 0)) reason = 'Needs a legless, serpent body';
    else if (req.manyLegs && !(run.stage === 'creature' && G.symmetry(run) === 'bilateral' && G.segments(run) >= 4)) reason = 'Needs 4 or more pairs of legs';
    else if (req.size && G.sizeOf(run) !== req.size) reason = `Only for ${req.size} creatures`;
    else if (req.zone && !(run.habitat === 'sea' && G.zone(run) === req.zone)) reason = `Only in ${G.SEA_ZONE[req.zone].name}`;
    else if (req.anyPart && !req.anyPart.some((id) => G.partIds(run).some((pid) => pid === id || (G.PART[pid].from || []).includes(id)))) reason = `Needs ${req.anyPart.map((id) => G.PART[id].name).join(' or ')}`;
    else if (req.food && run.food < req.food) reason = `Needs ${req.food} Food`;
    else if (req.gimmick && G.gimmick(run) !== req.gimmick) reason = `Only for the ${G.ARCHETYPES.find((a) => a.gimmick === req.gimmick).name}`;
    else if (G.gimmick(run) === 'colony' && run.phase === 'event' && run.event && run.event.id === 'multicellularity' && opt.result && opt.result.trait !== 'sessile_plan') reason = 'A Colony always grows without symmetry';
    else if (G.gimmick(run) === 'grazer' && req.diet && !req.diet.some((d) => d !== 'carn')) reason = 'Grazers never hunt';
    const out = { ok: !reason, reason };
    if (opt.check) out.chance = G.chance(run, opt.check.stat, opt.check.diff);
    return out;
  };

  G.chooseOption = function (i) {
    const run = G.run;
    if (!run || run.phase !== 'event') return;
    const ev = G.EVENT[run.event.id];
    const opt = ev.options[i];
    if (!opt) return;
    const state = G.optionState(run, opt);
    if (!state.ok) return;
    let res = opt.result;
    let success = null;
    if (opt.check) {
      success = rand() * 100 < state.chance;
      res = success ? opt.success : opt.fail;
    }
    const sp = run.event.species;
    const popBefore = run.pop; const foodBefore = run.food;
    run.lastEvolution = null;
    const lines = applyEffects(run, res, sp);
    const story = sceneStory(run, ev, opt, res, success, sp);
    // Hunting or beating a species thins its numbers on the world map.
    if (sp != null && sp >= 0 && (story === 'chase' || story === 'brawl_win')) {
      const target = run.species[sp];
      const loss = Math.max(1, Math.round(target.cap * (story === 'chase' ? 0.12 : 0.06)));
      target.pop = Math.max(0, target.pop - loss);
      lines.push({ t: `The ${target.name} lose ${loss} of their number` });
      if (G.gimmick(run) === 'predator') {
        run.hunger = 0;
        if (rand() < 0.5) { run.pendingSpecial = { name: target.name, source: 'devour' }; lines.push({ t: `You can devour a part of the ${target.name}`, good: true }); }
      }
    }
    run.scene = {
      title: sub(ev.title, run, sp),
      label: sub(opt.label, run, sp),
      text: sub(res && res.text, run, sp),
      lines, success,
      anim: sceneAnim(res, opt, success),
      prop: ev.prop || null,
      mood: sceneMood(res, opt, success),
      species: sp,
      story, popDelta: run.pop - popBefore, foodDelta: run.food - foodBefore, evolved: run.lastEvolution,
      finale: !!ev.finale, milestone: ev.milestone ? ev.id : null,
      habitat: res && res.habitat, won: ev.finale && success !== false,
      stat: opt.check ? opt.check.stat : null, chance: state.chance,
    };
    addUnique(run.seen, ev.id);
    addUnique(G.meta.codex.events, ev.id);
    run.notices = [];
    log(run, `${run.scene.title}: ${run.scene.label}.${success === false ? ' It went badly.' : ''}`);
    run.phase = 'scene';
    save();
  };

  G.continueScene = function () {
    const run = G.run;
    if (!run || run.phase !== 'scene') return;
    const sc = run.scene;
    if (run.pop <= 0 && !secondChance(run)) { endRun(run, false, 'Your lineage died out.'); return; }
    if (sc.milestone) {
      run.milestonesDone.push(sc.milestone);
      applyMilestone(run, sc.milestone);
      nextStep(run, false);
      G.fossilize(run);
    } else if (sc.finale && sc.won) {
      if (run.stage === 'cell') evolve(run, sc.habitat);
      else endRun(run, true);
    } else {
      nextStep(run, false);
    }
    save();
  };

  function applyMilestone(run, id) {
    const beforeMax = G.maxPop(run);
    applyMilestoneInner(run, id);
    const afterMax = G.maxPop(run);
    if (afterMax !== beforeMax) run.notices.push(`Your ${run.stage === 'cell' ? 'colony' : run.habitat === 'sea' ? 'schools' : 'herds'} can now grow to ${afterMax} (was ${beforeMax}).`);
  }

  function applyMilestoneInner(run, id) {
    if (id === 'multicellularity') {
      run.multicellular = true;
      run.notices.push('You are multicellular. Two new body slots are open: Senses and Organ.');
    }
    if (id === 'age_of_giants') {
      run.era = 2; run.eraTurn = 1;
      const apex = makeSpecies(run.habitat, ['predator'])[0];
      apex.size = 3.2; apex.opinion = -45; apex.cap = 4; apex.pop = 3;
      run.species.push(apex);
      run.notices.push(`The Age of Giants begins. A huge new predator, the ${apex.name}, has arrived.`);
    }
    if (id === 'spark_of_mind') {
      run.era = 3; run.eraTurn = 1; run.mind = true;
      run.notices.push('Your kind has begun to think. Choose what fascinates them, and Insight will flow into it each turn.');
    }
  }

  // ---------- Time ----------
  // Time flows on the world map. Each tick is one Epoch or Generation: your lineage eats,
  // grows and evolves, the other species rise and fall, and sometimes an event happens.
  G.tick = function () {
    const run = G.run;
    if (!run || run.phase !== 'map') return;
    endTurn(run);
    if (run.phase === 'end') return;
    worldTick(run);
    if (G.gimmick(run) === 'drifter' && run.turn >= (run.nextDrift || 0)) drift(run);
    nextStep(run, true);
    save();
  };

  function worldTick(run) {
    const prey = run.species.filter((s) => !s.extinct && s.role === 'prey');
    run.species.forEach((s) => {
      if (s.extinct) return;
      s.pop += 0.14 * s.pop * (1 - s.pop / s.cap) + (rand() - 0.5) * s.cap * 0.04;
      if (s.role === 'predator') {
        const food = prey.reduce((a, p) => a + p.pop, 0);
        if (food < 4) s.pop -= s.pop * 0.08;
        prey.forEach((p) => { p.pop -= s.pop * 0.03; });
      }
      s.pop = Math.min(s.cap * 1.1, s.pop);
      if (s.pop < 0.6) {
        s.extinct = true; s.pop = 0;
        run.notices.push(`The ${s.name} have died out.`);
        log(run, `The ${s.name} went extinct.`);
      }
    });
    // Newcomers drift in when the world has room.
    const alive = run.species.filter((s) => !s.extinct).length;
    if (alive < 4 && rand() < 0.08) {
      const roles = ['prey', 'rival', 'neighbor', 'predator'];
      const n = makeSpecies(run.stage === 'cell' ? 'cell' : run.habitat, [pick(roles)])[0];
      n.pop = Math.max(2, Math.round(n.cap * 0.3));
      run.species.push(n);
      run.notices.push(`A new species has arrived: the ${n.name} (${G.ROLES[n.role].toLowerCase()}).`);
      log(run, `The ${n.name} arrived.`);
    }
  }

  function endTurn(run) {
    const lines = [];
    const inc = G.income(run);
    const up = G.upkeep(run);
    let gathered = inc.total;
    // Predators only eat on a kill.
    if (G.gimmick(run) === 'predator') {
      const hunt = inc.parts.find((p) => p.hunt);
      const best = Math.max(G.stat(run, 'str'), G.stat(run, 'spd'));
      const killChance = clamp(45 + (best - 2) * 8 + G.mod(run, 'huntBonus') * 4, 20, 92);
      if (hunt && rand() * 100 < killChance) {
        run.hunger = 0;
        lines.push({ t: 'A kill!', good: true });
        const prey = run.species.filter((s) => !s.extinct && s.role !== 'predator');
        if (prey.length && rand() < 0.25) { const v = pick(prey); run.pendingSpecial = { name: v.name, source: 'devour' }; }
      } else {
        if (hunt) gathered = Math.max(0, gathered - hunt.v);
        run.hunger = (run.hunger || 0) + 1;
        if (run.hunger >= G.HUNGER_LIMIT) lines.push({ t: `Starving for meat: −${damage(run, 1)} Population`, bad: true });
      }
    }
    run.food += gathered - up;
    lines.push({ t: `Food +${gathered} gathered, −${up} eaten` });
    gimmickTurn(run, lines);
    if (run.food < 0) {
      const starve = -run.food;
      run.food = 0;
      run.pop -= starve;
      lines.push({ t: `Starving: −${starve} Population`, bad: true });
    } else {
      // Spare Food becomes young: bigger herds can raise more at once.
      const cost = G.growthCost(run);
      let born = 0;
      while (run.food >= cost && run.pop < G.maxPop(run) && born < Math.ceil(G.popScale(run))) { run.food -= cost; run.pop += 1; born += 1; }
      if (born) lines.push({ t: `+${born} Population (used ${born * cost} spare Food)`, good: true });
    }
    // Predators and hostile species pick off your weakest. Toughness and Speed keep them at bay,
    // and the longer you linger in a stage, the hungrier the world gets.
    run.species.forEach((s) => {
      if (s.extinct || run.pop <= 0 || s.bud || s.name === run.partner) return;
      if (s === G.mimicOf(run) && rand() < 0.4) return;
      const hostile = G.speciesStatus(s) === 'hostile';
      if (s.role !== 'predator' && !hostile) return;
      const atk = G.speciesStat(s, 'str') + Math.floor(G.HARSH / 2) + (run.stage === 'creature' ? run.era - 1 : 0) + Math.min(3, Math.floor(run.stageTurn / 10));
      const def = G.stat(run, 'tou') + Math.floor(G.stat(run, 'spd') / 2);
      // The bigger the gap, the more often and harder they strike; even the strong are never quite safe.
      const gap = atk - def;
      const hit = clamp(G.PREDATION + 0.04 * gap + (hostile ? 0.1 : 0), 0.04, 0.45) * (run.instinct === 'hide' ? 0.5 : 1);
      if (rand() >= hit) return;
      const n = clamp(1 + Math.floor(gap / 3), 1, 3);
      lines.push({ t: `The ${s.name} hunted you: −${damage(run, n)} Population`, bad: true });
    });
    const regrow = G.mod(run, 'popPerTurn');
    if (regrow > 0 && run.pop > 0) { const g = grow(run, regrow); if (g) lines.push({ t: `+${g} Population from symbionts`, good: true }); }
    const cap = G.foodCap(run);
    if (run.food > cap) { lines.push({ t: `${run.food - cap} Food spoiled (storage ${cap})`, bad: true }); run.food = cap; }
    lines.push({ t: `+${gainDna(run, G.dnaPerTurn(run))} DNA`, good: true });
    if (run.mind) {
      const ins = G.insightPerTurn(run);
      run.insight += ins;
      lines.push({ t: `+${ins} Insight`, good: true });
    }
    run.pop = Math.min(run.pop, G.maxPop(run));
    if (run.pop <= 0 && !secondChance(run)) { endRun(run, false, 'Your lineage starved.'); return; }
    const st = G.STAGES[run.stage];
    run.lastTurn = { title: `${st.turnName} ${run.stageTurn}`, lines };
    run.turn += 1; run.stageTurn += 1; run.eraTurn += 1;
    researchProgress(run);
  }

  // ---------- Mind tree ----------
  G.innovationAvailable = function (run, inv) {
    if (run.innovations.includes(inv.id)) return { ok: false, reason: 'Known' };
    const blocker = run.innovations.find((id) => (inv.excludes || []).includes(id) || (G.INNOVATION[id].excludes || []).includes(inv.id));
    if (blocker) return { ok: false, blocked: true, reason: `Blocked by ${G.INNOVATION[blocker].name}` };
    const r = inv.req || {};
    if (r.tier3 && run.innovations.filter((id) => G.INNOVATION[id].tier === 3).length < r.tier3) return { ok: false, reason: `Needs ${r.tier3} ideas from the third row` };
    if (r.diet && !r.diet.includes(G.diet(run))) return { ok: false, reason: `Only for ${r.diet.map((d) => G.DIET_NAMES[d].toLowerCase()).join(' or ')}s` };
    if (r.stat && G.stat(run, r.stat[0]) < r.stat[1]) return { ok: false, reason: `Needs ${G.STATS.find((x) => x.id === r.stat[0]).name} ${r.stat[1]} (you have ${G.stat(run, r.stat[0])})` };
    if (r.innovation && !r.innovation.some((id) => run.innovations.includes(id))) return { ok: false, reason: `Needs ${r.innovation.map((id) => G.INNOVATION[id].name).join(' or ')}` };
    if (r.trait && !r.trait.some((t) => run.traits.includes(t))) return { ok: false, reason: `Needs a ${r.trait.map((t) => G.TRAITS[t].name).join(', ')} trait` };
    if (r.tag === 'grasp' && !G.hasTag(run, 'grasp')) return { ok: false, reason: 'Needs a part that can grasp' };
    return { ok: true };
  };

  function researchProgress(run) {
    if (!run.mind || !run.fascination) return;
    const inv = G.INNOVATION[run.fascination];
    if (run.insight >= inv.cost) {
      run.insight -= inv.cost;
      run.innovations.push(inv.id);
      run.fascination = null;
      run.notices.push(`Innovation: ${inv.name}. ${G.describeMods(inv.mods)}.`);
      log(run, `Your kind discovered ${inv.name}.`);
    }
  }

  G.setFascination = function (id) {
    const run = G.run;
    if (!run || !run.mind) return;
    const inv = G.INNOVATION[id];
    if (!inv || !G.innovationAvailable(run, inv).ok) return;
    run.fascination = id;
    researchProgress(run);
    if (run.phase === 'mind') nextStep(run, false);
    save();
  };

  function needsFascination(run) {
    return run.mind && !run.fascination && G.INNOVATIONS.some((i) => G.innovationAvailable(run, i).ok);
  }

  // Decide what comes next: a mutation draft, a milestone, a choice of fascination, the finale,
  // a random event (only when time has just passed), or back to the world map.
  // DNA goals for this stage, lowered by the Short Road upgrade.
  G.goals = (run) => {
    const st = G.STAGES[run.stage];
    const k = 1 - 0.08 * G.boonLevel('short_road');
    const f = (n) => Math.max(1, Math.round(n * k));
    return { drafts: st.drafts.map(f), milestones: st.milestones.map((m) => ({ ...m, at: f(m.at) })), evolveAt: st.evolveAt && f(st.evolveAt) };
  };

  function nextStep(run, allowEvent) {
    const st = G.goals(run);
    if (run.pendingSpecial && startSpecialDraft(run)) return;
    if (run.draftsTaken < st.drafts.length && run.dna >= st.drafts[run.draftsTaken]) { startDraft(run); return; }
    const ms = st.milestones.find((m) => run.dna >= m.at && !run.milestonesDone.includes(m.event));
    if (ms) { setEvent(run, G.EVENT[ms.event]); return; }
    if (needsFascination(run)) { run.phase = 'mind'; return; }
    const finaleReady = run.turn >= run.finaleRetryAt && (run.stage === 'cell' ? run.dna >= st.evolveAt : run.innovations.includes('sapience'));
    if (finaleReady) {
      const id = run.stage === 'cell' ? 'cell_finale' : run.habitat === 'sea' ? 'creature_finale_sea' : 'creature_finale';
      setEvent(run, G.EVENT[id]);
      return;
    }
    // Events pop up at random, more likely the longer it has been quiet.
    if (allowEvent && rand() < 0.38 + 0.2 * run.quietTicks) { run.quietTicks = 0; drawEvent(run); return; }
    if (allowEvent) run.quietTicks += 1;
    run.phase = 'map';
  }

  // ---------- Mutation drafts ----------
  function draftOptions(run) {
    const n = G.meta.boons.choice ? 4 : 3;
    const boost = G.ORIGIN[run.origin].boostKeyword;
    const have = G.partIds(run);
    const empty = G.slotsFor(run).filter((s) => !run.parts[s.id]).map((s) => G.baseSlot(s.id));
    let pool = G.partPool(run).filter((p) => !have.includes(p.id));
    const out = [];
    while (out.length < n && pool.length) {
      const p = weightedPick(pool, (x) => (x.evolved ? (x.limbEvo ? 2 : x.evolved === 2 ? 0.4 : 1) : (x.rarity || 2))
        * (boost && (x.keywords || []).includes(boost) ? 3 : 1)
        * (empty.includes(x.slot) ? 2 : 1));
      out.push(p.id);
      pool = pool.filter((x) => x.id !== p.id && (out.length >= 2 || x.slot !== p.slot));
    }
    return out;
  }

  function startDraft(run) {
    run.draft = { options: draftOptions(run), rerolls: G.meta.boons.reroll ? 1 : 0 };
    run.phase = 'draft';
  }

  G.pickDraft = function (pid, mode, socket) {
    const run = G.run;
    if (!run || run.phase !== 'draft' || !run.draft.options.includes(pid)) return;
    const text = installPart(run, G.PART[pid], mode, socket);
    log(run, `Mutation: ${text}.`);
    if (!run.draft.source) run.draftsTaken += 1;
    run.draft = null;
    run.scene = { title: 'Mutation', label: text, text: '', lines: [], anim: 'mutate', mood: run.lastEvolution ? 'proud' : 'surprised', mutation: true, evolved: run.lastEvolution };
    run.lastEvolution = null;
    run.phase = 'mutated';
    save();
  };

  G.continueMutation = function () {
    const run = G.run;
    if (!run || run.phase !== 'mutated') return;
    nextStep(run, false);
    save();
  };

  G.skipDraft = function () {
    const run = G.run;
    if (!run || run.phase !== 'draft') return;
    run.food += 3;
    run.notices.push('You skipped a mutation and gained 3 Food.');
    if (!run.draft.source) run.draftsTaken += 1;
    run.draft = null;
    nextStep(run, false);
    save();
  };

  G.rerollDraft = function () {
    const run = G.run;
    if (!run || run.phase !== 'draft' || run.draft.rerolls < 1) return;
    run.draft.rerolls -= 1;
    run.draft.options = draftOptions(run);
    G.saveRun();
  };

  // ---------- Instinct ----------
  G.setInstinct = function (id) {
    const run = G.run;
    if (!run || !G.INSTINCT[id] || !G.instinctAllowed(run, id).ok) return;
    run.instinct = id;
    G.saveRun();
  };

  // ---------- Evolution ----------
  function evolve(run, habitat) {
    const diet = G.diet(run);
    const heritage = diet === 'carn' ? 'predator_lineage' : diet === 'herb' ? 'grazer_lineage' : 'adaptable_lineage';
    const cellParts = Object.values(run.parts).map((s) => G.slotLabel(s));
    addUnique(run.traits, heritage);
    run.stage = 'creature';
    run.habitat = habitat || 'land';
    run.plan = run.habitat;
    run.era = 1; run.eraTurn = 1; run.stageTurn = 1;
    run.segments = G.SYMMETRY[G.symmetry(run)].start;
    run.dna = 3 * (G.meta.boons.memory || 0);
    run.draftsTaken = 0;
    run.finaleRetryAt = 0;
    // Only your mouth and your evolved parts grow into creature parts. Everything else is left behind.
    const cellSlots = Object.values(run.parts).filter(Boolean);
    run.parts = {};
    const carried = [];
    const left = [];
    cellSlots.forEach((cs) => {
      const p = G.PART[cs.id];
      const keep = p.slot === 'mouth' || p.evolved;
      const to = keep && G.CARRY[cs.id] && G.CARRY[cs.id][run.habitat];
      const toSlot = to && G.PART[to].slot;
      const sock = to && [toSlot, `${toSlot}2`].find((k) => !run.parts[k] && (k === toSlot || G.twinOwned(toSlot)));
      if (sock) {
        run.parts[sock] = { id: to, merged: null };
        carried.push({ from: G.PART[cs.id].name, to: G.PART[to].name });
      } else left.push(G.slotLabel(cs));
    });
    // The archetype fills in anything essential that is still missing.
    Object.entries(G.ARCHETYPE[run.archetype].start[run.habitat]).forEach(([slot, id]) => { if (!run.parts[slot]) run.parts[slot] = { id, merged: null }; });
    // Everyone starts with basic limbs, which grow into better ones by merging.
    const basic = run.habitat === 'sea' ? { frontLimbs: 'stubby_front_fins', hindLimbs: 'stubby_rear_fins' } : { frontLimbs: 'stubby_forelegs', hindLimbs: 'stubby_hindlegs' };
    Object.entries(basic).forEach(([slot, id]) => { if (!run.parts[slot]) run.parts[slot] = { id, merged: null }; });
    run.species = makeSpecies(run.habitat, ['predator', 'prey', 'rival', 'neighbor']);
    setupGimmick(run);
    run.pop = G.maxPop(run);
    run.lastEvent = null;
    run.lastTurn = null;
    run.quietTicks = 1;
    noteParts(run);
    run.evolved = { heritage, cellParts, carried, left };
    run.notices = [];
    log(run, `Your lineage ${run.habitat === 'land' ? 'leaves the water for the land' : 'claims the open sea'}. It carries the ${G.TRAITS[heritage].name} trait.`);
    run.phase = 'evolved';
  }

  G.continueEvolved = function () {
    const run = G.run;
    if (!run || run.phase !== 'evolved') return;
    nextStep(run, false);
    G.fossilize(run);
    save();
  };

  // ---------- Fossils and history ----------
  // How far a run got, in words.
  G.reachedLabel = (run) => {
    if (run.stage === 'cell') return run.multicellular ? 'Multicellular' : 'Single cell';
    if (run.mind) return 'Spark of Mind';
    if (run.era >= 2) return 'Age of Giants';
    return run.habitat === 'sea' ? 'Creature of the sea' : 'Creature of the land';
  };
  const reviveKey = (run) => (run.stage === 'cell' ? 'multicellular' : run.mind ? 'mind' : run.era >= 2 ? 'giants' : 'creature');
  G.amberSlots = () => 1 + G.boonLevel('amber');
  // Save a fossil of the run as it is now. Called after each milestone and each new stage.
  G.fossilize = function (run) {
    const m = G.meta;
    const snap = JSON.parse(JSON.stringify(run));
    snap.log = snap.log.slice(0, 25); snap.notices = []; snap.lastTurn = null;
    snap.phase = 'map'; snap.event = null; snap.scene = null; snap.draft = null; snap.evolved = null;
    const key = reviveKey(run);
    m.fossils.unshift({ id: `f${Date.now()}${Math.floor(rand() * 1000)}`, date: Date.now(), archetype: run.archetype, origin: run.origin, label: G.reachedLabel(run), key, turn: run.turn, amber: false, body: G.bodyOf(run), run: snap });
    const amber = m.fossils.filter((f) => f.amber);
    const loose = m.fossils.filter((f) => !f.amber).slice(0, G.FOSSIL_KEEP);
    m.fossils = m.fossils.filter((f) => amber.includes(f) || loose.includes(f));
    G.saveMeta();
  };
  G.setAmber = function (id, on) {
    const f = G.meta.fossils.find((x) => x.id === id);
    if (!f) return false;
    if (on && !f.amber && G.meta.fossils.filter((x) => x.amber).length >= G.amberSlots()) return false;
    f.amber = !!on;
    G.saveMeta();
    return true;
  };
  G.reviveCost = (f) => G.REVIVE_COST[f.key] || 20;
  // Start a new run from a fossil kept in amber.
  G.reviveFossil = function (id) {
    const m = G.meta;
    const f = m.fossils.find((x) => x.id === id);
    if (!f || !f.amber || m.genes < G.reviveCost(f)) return false;
    m.genes -= G.reviveCost(f);
    const run = JSON.parse(JSON.stringify(f.run));
    run.revived = true;
    run.knownEvos = m.codex.evolutions.slice();
    run.baseMaxPop = G.BASE_POP + G.boonLevel('hardy');
    run.baseFoodCap = G.FOOD_CAP + 2 * G.boonLevel('pantry');
    run.secondChanceUsed = false;
    run.result = null; run.phase = 'map'; run.notices = ['A fossil stirs. Your lineage lives again, from where it left off. (Revived lineages earn less Genetic Memory.)'];
    log(run, 'Revived from a fossil kept in amber.');
    m.stats.runs += 1;
    G.run = run;
    save();
    return true;
  };

  // ---------- Unlock shop ----------
  G.boonLevel = (id) => G.meta.boons[id] || 0;
  G.boonCost = (b) => b.costs[G.boonLevel(b.id)];
  G.boonOpen = (b) => (b.req || []).every((id) => G.boonLevel(id) > 0);

  G.buy = function (kind, id) {
    const m = G.meta;
    let cost;
    if (kind === 'boon') {
      const b = G.BOON[id];
      cost = b && G.boonCost(b);
      if (cost == null || m.genes < cost || !G.boonOpen(b)) return false;
      m.boons[id] = G.boonLevel(id) + 1;
    } else {
      const list = { archetypes: G.ARCHETYPES, origins: G.ORIGINS, packs: G.PACKS }[kind];
      const item = list && list.find((x) => x.id === id);
      if (!item || m.unlocked[kind].includes(id) || m.genes < item.cost) return false;
      if (item.needsEvo && m.codex.evolutions.length < item.needsEvo) return false;
      cost = item.cost;
      m.unlocked[kind].push(id);
    }
    m.genes -= cost;
    G.saveMeta();
    return true;
  };

  // Plain-language description of a set of modifiers, e.g. "+2 Strength, −1 Speed".
  G.describeMods = function (mods) {
    return Object.keys(mods || {}).filter((k) => mods[k]).map((k) => {
      const v = mods[k];
      if (k === 'damageReduce') return `−${v} damage taken`;
      if (k === 'growthCost') return `${v < 0 ? '−' : '+'}${Math.abs(v)} Food needed to grow`;
      return `${v > 0 ? '+' : '−'}${Math.abs(v)} ${G.MOD_LABELS[k] || k}`;
    }).join(', ');
  };
}());
