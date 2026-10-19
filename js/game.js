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
      codex: { events: [], parts: [], legacies: [], evolutions: [], endings: [], discoveries: [], tribeEndings: [], societyEndings: [], traditions: [], renaissanceEndings: [], reason: [] },
      stats: { runs: 0, wins: 0, extinctions: 0, bestDna: 0, creatures: 0 },
      fossils: [], history: [], tips: [], tipsOff: false, affinity: {}, stageStarts: [],
      options: { numbers: false, theme: 'tide' },
    };
  }
  // Odds in words; the exact numbers are an option (Options: Detailed numbers).
  G.oddsWord = (c) => (c >= 90 ? 'Almost certain' : c >= 70 ? 'Very likely' : c >= 55 ? 'Likely' : c >= 45 ? 'Even odds' : c >= 30 ? 'Unlikely' : c >= 12 ? 'Very unlikely' : 'Almost hopeless');
  G.showNumbers = () => !!(G.meta && G.meta.options && G.meta.options.numbers);
  G.THEMES = { tide: 'Tide', ember: 'Ember', kelp: 'Kelp', dusk: 'Dusk' };
  function mergeMeta(saved) {
    const m = freshMeta();
    if (!saved) return m;
    m.genes = saved.genes || 0;
    m.boons = saved.boons || {};
    Object.keys(m.boons).forEach((id) => { if (!G.BOON[id]) delete m.boons[id]; else m.boons[id] = Math.min(m.boons[id], G.BOON[id].costs.length); });
    m.fossils = saved.fossils || [];
    m.stageStarts = saved.stageStarts || [];
    m.history = saved.history || [];
    m.seenVersion = saved.seenVersion;
    // Players from before tips existed have already learned the basics.
    m.affinity = saved.affinity || {};
    m.tips = saved.tips || ((saved.stats && saved.stats.runs >= 3) ? ['welcome', 'event', 'draft', 'instinct', 'arch_drifter', 'arch_grazer'] : []);
    m.tipsOff = !!saved.tipsOff;
    // Players who have already reached the Creature stage have seen the editor.
    m.editorShown = saved.editorShown != null ? !!saved.editorShown : !!(saved.history || []).some((h) => h.reached && !/^(Single cell|Multicellular)/.test(h.reached));
    m.options = Object.assign(m.options, saved.options || {});
    m.maxHostility = saved.maxHostility || 0;
    ['archetypes', 'origins', 'packs'].forEach((k) => {
      const list = (saved.unlocked && saved.unlocked[k]) || [];
      list.forEach((id) => { if (!m.unlocked[k].includes(id)) m.unlocked[k].push(id); });
    });
    ['events', 'parts', 'legacies', 'evolutions', 'endings', 'discoveries', 'tribeEndings', 'societyEndings', 'traditions', 'renaissanceEndings', 'reason'].forEach((k) => { m.codex[k] = (saved.codex && saved.codex[k]) || []; });
    Object.assign(m.stats, saved.stats || {});
    // Saves from before the beginner's grace: count the lineages that already left the cell stage.
    if (!saved.stats || saved.stats.creatures == null) m.stats.creatures = (saved.history || []).filter((h) => h.reached && !/^(Single cell|Multicellular)/.test(h.reached)).length + (m.stats.wins || 0);
    return m;
  }

  // Ancestral Wisdom shares the Evolution Tree's storage (but not its hidden power).
  G.WISDOM.forEach((w) => { G.BOON[w.id] = w; });
  G.HERITAGE.forEach((w) => { G.BOON[w.id] = w; });
  G.PATRONAGE.forEach((w) => { G.BOON[w.id] = w; });
  G.meta = mergeMeta(load(SAVE_META));
  G.run = load(SAVE_RUN);
  // Patch 15.1 counts Population in individuals (×10). Older runs and fossils are converted when loaded.
  G.migratePop = (run) => { if (run && !run.popV) { run.pop = Math.round(run.pop * G.POP_SCALE); run.popV = 2; } return run; };
  G.migratePop(G.run);
  // Ideas from before Update 13 no longer exist.
  if (G.run && G.run.innovations) { const ids = new Set(G.INNOVATIONS.map((i) => i.id)); G.run.innovations = G.run.innovations.filter((id) => ids.has(id)); if (G.run.fascination && !ids.has(G.run.fascination)) G.run.fascination = null; }
  // Update 18: discoveries held for later become branches of the Lore tree.
  if (G.run && G.run.held && G.run.held.length) { G.run.grafts = (G.run.grafts || []).concat(G.run.held); G.run.held = []; }
  G.saveMeta = () => store(SAVE_META, G.meta);
  G.saveRun = () => store(SAVE_RUN, G.run);
  G.resetAll = () => { G.meta = freshMeta(); G.run = null; G.saveMeta(); G.saveRun(); };
  function save() { G.saveRun(); G.saveMeta(); }

  // The next first-time tip to show, if any.
  G.nextTutorial = (run, ui) => {
    if (G.meta.tipsOff || ui.editor) return null;
    return G.TUTORIALS.find((t) => !G.meta.tips.includes(t.id) && (() => { try { return t.when(run, ui); } catch (e) { return false; } })()) || null;
  };
  G.seeTutorial = (id) => { if (id && !G.meta.tips.includes(id)) G.meta.tips.push(id); G.saveMeta(); };

  // ---------- Lookups and helpers ----------
  G.ARCHETYPE = {}; G.ARCHETYPES.forEach((a) => { G.ARCHETYPE[a.id] = a; });
  G.ORIGIN = {}; G.ORIGINS.forEach((o) => { G.ORIGIN[o.id] = o; });
  G.INSTINCT = {}; G.INSTINCTS.forEach((i) => { G.INSTINCT[i.id] = i; });
  G.INNOVATION = {}; G.INNOVATIONS.forEach((i) => { G.INNOVATION[i.id] = i; });

  // ---------- Archetype gimmicks: each archetype breaks one rule for the whole run ----------
  // The Tribe and Society stages: you are a people now, not a lineage.
  G.people = (run) => !!run && (run.stage === 'tribe' || G.civ(run));
  // A civilisation: the Society stage and the Renaissance after it share settlements, a council and neighbours.
  G.civ = (run) => !!run && (run.stage === 'society' || run.stage === 'renaissance');
  G.gimmick = (run) => (run && !G.people(run) && G.ARCHETYPE[run.archetype] && G.ARCHETYPE[run.archetype].gimmick) || null;
  const speciesNamed = (run, name) => (name ? run.species.find((s) => s.name === name && !s.extinct) || null : null);
  G.partnerOf = (run) => (G.gimmick(run) === 'symbiote' ? speciesNamed(run, run.partner) : null);
  G.hostOf = (run) => (G.gimmick(run) === 'parasite' ? speciesNamed(run, run.host) : null);
  G.mimicOf = (run) => (G.gimmick(run) === 'mimic' ? speciesNamed(run, run.mimic) : null);
  G.budsOf = (run) => run.species.filter((s) => s.bud && !s.extinct);
  G.GIMMICK_COST = 3; // DNA for gimmick actions (steal, jump, swap, mimic)
  G.HUNGER_LIMIT = 5;
  G.DRIFT_EVERY = 8;
  // Drifters are pushed by the current while they live in water; on land it becomes wanderlust,
  // and once the Mind awakens they choose for themselves.
  G.drifterFree = (run) => !!run.mind || (run.stage !== 'cell' && run.habitat === 'land');
  // Which Instincts this archetype may choose.
  // Things your kind can't use right now are not offered: no hunting ideas for a herbivore, no foraging ones for a
  // Predator. Your diet can change (an omnivore mouth bridges the two), and what is hidden comes back when it does;
  // omnivores see everything. Only the starting archetype locks things for good (Grazers never hunt, Predators never forage).
  G.useless = (run, x) => {
    if (!run || !x) return false;
    const d = G.diet(run); const g = G.gimmick(run); const m = x.mods || {};
    const diets = x.diet || (x.req && x.req.diet);
    if (g === 'grazer' && diets && diets.every((y) => y === 'carn')) return true;
    if (g === 'predator' && diets && diets.every((y) => y === 'herb')) return true;
    if (diets && d !== 'omni' && !diets.includes(d) && !diets.includes('omni')) return true;
    if ((m.huntBonus || 0) > 0 && (d === 'herb' || g === 'grazer')) return true;
    if ((m.forageBonus || 0) > 0 && g === 'predator') return true;
    return false;
  };
  G.instinctAllowed = (run, id) => {
    const g = G.gimmick(run);
    if (id === 'hunt' && G.diet(run) === 'herb' && run.stage !== 'cell') return { ok: false, hidden: true, why: 'Herbivores do not hunt' };
    if (g === 'drifter' && !G.drifterFree(run)) return { ok: false, why: 'The current decides your Instinct (until you reach land or your kind can think)' };
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
  // How many limb pairs are arms (land, bilateral only). Old saves used the "On two legs" posture.
  // Which kind of body the editor and renderer are dealing with.
  G.editorBody = (run) => {
    const sym = G.symmetry(run);
    if (sym === 'radial' || sym === 'colonial') return sym;
    if (G.segments(run) === 0) return 'serpent';
    return run.habitat === 'sea' ? 'sea' : 'land';
  };
  // Does this body show a part the editor can resize?
  G.hasVisiblePart = (run, kind) => {
    const off = G.offSlots(run);
    if (kind === 'wings') return ['feathered_wings', 'true_wings', 'insect_wings'].some((id) => G.partIds(run).includes(id) || G.partIds(run).some((pid) => (G.PART[pid].from || []).includes(id)));
    return !!run.parts[kind] && !off.includes(kind);
  };
  // Eyes come only from eye mutations: no eye part, no eyes. The best one you own sets how many.
  G.EYES = { eyespot: 1, plated_eye: 1, compound_sense: 1, lantern_eye: 1, big_eyes: 2, glow_eyes: 2, night_eyes: 2, mantis_eyes: 2, rainbow_eyes: 2, hunter_eyes: 2, sentinel_ears: 2, compound_eyes: 4, mosaic_eyes: 4, all_seeing_eyes: 6, ring_of_eyes: 6, seeking_front: 1 };
  G.eyesFrom = (ids) => { let n = 0; const seen = new Set(); const walk = (id) => { if (!id || seen.has(id)) return; seen.add(id); n = Math.max(n, G.EYES[id] || 0); ((G.PART[id] || {}).from || []).forEach(walk); }; ids.forEach(walk); return n; };
  G.eyeCount = (run) => G.eyesFrom(G.partIds(run));
  G.armPairs = (run) => {
    if (run.stage === 'cell' || run.habitat !== 'land' || G.symmetry(run) !== 'bilateral') return 0;
    const n = G.segments(run);
    const legacy = n === 2 && run.look && run.look.posture === 'two' ? 1 : 0;
    return Math.max(0, Math.min(n, run.armPairs != null ? run.armPairs : legacy));
  };
  G.segmentPlan = (run) => {
    const sym = G.symmetry(run); const n = G.segments(run);
    return sym === 'radial' ? G.armPlan(n) : sym === 'colonial' ? G.podPlan(n) : G.legPlan(n, run.habitat, G.armPairs(run));
  };
  // Slots this body plan has no use for (creature stage only).
  G.offSlots = (run) => {
    if (run.stage === 'cell') return [];
    const off = (G.SYMMETRY[G.symmetry(run)].off || []).slice();
    (G.segmentPlan(run).off || []).forEach((x) => { if (!off.includes(x)) off.push(x); });
    return off.concat(off.map((x) => `${x}2`));
  };
  G.reshapeCost = (run) => (G.gimmick(run) === 'colony' || run.traits.includes('skeleton_shell') ? Math.ceil(G.RESHAPE_COST / 2) : G.RESHAPE_COST);
  G.reshape = function (delta) {
    const run = G.run;
    if (!run || run.stage !== 'creature') return;
    const sym = G.SYMMETRY[G.symmetry(run)];
    const n = G.segments(run) + delta;
    const cost = G.reshapeCost(run);
    if (n < sym.min || n > sym.max || run.dna < cost) return;
    const arms = G.armPairs(run);
    run.dna -= cost;
    run.segments = n;
    run.armPairs = Math.min(arms, n);
    run.pop = Math.min(run.pop, G.hardPop(run));
    log(run, `Your body plan changed: ${G.segmentPlan(run).name}.`);
    G.saveRun();
  };
  // Turn a pair of legs into arms, or back.
  G.setArms = function (delta) {
    const run = G.run;
    if (!run || run.stage !== 'creature' || run.habitat !== 'land' || G.symmetry(run) !== 'bilateral') return;
    const arms = G.armPairs(run) + delta; const cost = G.reshapeCost(run);
    if (arms < 0 || arms > G.segments(run) || run.dna < cost) return;
    run.dna -= cost;
    run.armPairs = arms;
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
  G.sizeLabel = (size, stage) => (stage === 'cell' ? `${Math.round(size * 30)} micrometres` : size * 1.2 >= 1 ? `${(size * 1.2).toFixed(1)} m` : `${Math.round(size * 120)} cm`);

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
    // Parts that need another body plan lie dormant: they stay, but do nothing until it fits again.
    Object.entries(run.parts).forEach(([slot, s]) => { if (s && !off.includes(slot)) { [s.id, s.merged].forEach((id) => { if (id && G.partFits(run, G.PART[id])) out.push(id); }); } });
    return out;
  };
  // Does this part suit your body plan (symmetry, leg pairs, arm pairs)?
  G.partFits = (run, p) => {
    if (!p || (!p.sym && !p.legs && !p.arms)) return true;
    if (run.stage === 'cell' && !run.multicellular) return false;
    const sym = G.symmetry(run);
    if (p.sym && sym !== p.sym) return false;
    const arms = G.armPairs(run); const legs = G.segments(run) - arms;
    if (p.legs && (sym !== 'bilateral' || legs < p.legs[0] || legs > p.legs[1])) return false;
    if (p.arms && arms < p.arms) return false;
    return true;
  };
  // In words: what body plan a part needs.
  G.partNeeds = (p, habitat) => {
    if (!p || (!p.sym && !p.legs && !p.arms)) return '';
    const unit = habitat === 'sea' ? 'fins' : 'legs';
    if (p.arms) return p.arms > 1 ? `${p.arms} pairs of arms` : 'A pair of arms';
    if (p.legs) { const [a, b] = p.legs; return a === 0 && b === 0 ? `No ${unit}` : a === b ? `${a} pair${a > 1 ? 's' : ''} of ${unit}` : `${a}+ pairs of ${unit}`; }
    return { radial: 'Radial', bilateral: 'Bilateral', colonial: 'No symmetry' }[p.sym];
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
  G.bodyOf = (run) => ({ stage: G.people(run) ? 'creature' : run.stage, habitat: run.habitat, multicellular: run.multicellular, parts: run.parts, symmetry: G.symmetry(run), segments: G.segments(run), armPairs: G.armPairs(run), off: G.offSlots(run), hue: (run.look && run.look.hue != null) ? run.look.hue : G.ARCHETYPE[run.archetype].color, traits: run.traits, look: G.effectiveLook(run) });

  // ---------- Appearance ----------
  G.lookOptionState = (run, opt) => {
    const n = opt.need;
    if (opt.only && run.habitat !== opt.only) return { ok: false, why: opt.why, hidden: true };
    if (!n) return { ok: true };
    if (run.stage === 'cell') return { ok: false, why: opt.why };
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
    const l = Object.assign({ pattern: 'plain', shape: 'round', neck: 'short', eyes: 'round', posture: 'four', head: 'round', fins: 'plain', headPos: 'neck', finish: 'matte' }, run.look || {});
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
    if (G.COLOR_KEYS.includes(key)) run.look[key] = clamp(Math.round(Number(value)), 0, 359);
    else if (G.SCULPT_BY_ID[key]) {
      const sl = G.SCULPT_BY_ID[key];
      run.look[key] = clamp(Number(value), sl.min, G.sculptMax(run, sl));
    } else {
      const opt = (G.APPEARANCE[key] || []).find((o) => o.id === value);
      if (!opt || !G.lookOptionState(run, opt).ok) return;
      run.look[key] = value;
    }
    G.saveRun();
  };

  // The highest a slider can go right now (some open later in the run).
  G.sculptMax = (run, sl) => (sl.cap ? Math.min(sl.max, sl.cap(run)) : sl.max);
  // The editor's dice: a random look for one tab (or everything), using only options you have unlocked.
  G.EDITOR_TAB_KEYS = { body: { groups: ['shape'], sculpt: ['body'] }, limbs: { groups: ['fins'], sculpt: ['limbs'] }, head: { groups: ['head', 'headPos', 'eyes'], sculpt: ['head'] }, color: { groups: ['pattern', 'finish'], sculpt: ['color'], colors: true } };
  G.randomiseLook = function (tab) {
    const run = G.run;
    if (!run || run.stage === 'cell') return;
    const kind = G.editorBody(run);
    run.look = run.look || {};
    const tabs = tab && G.EDITOR_TAB_KEYS[tab] ? [tab] : Object.keys(G.EDITOR_TAB_KEYS);
    tabs.forEach((id) => {
      const T = G.EDITOR_TAB_KEYS[id];
      T.groups.forEach((key) => {
        const opts = (G.APPEARANCE[key] || []).filter((o) => (!o.only || o.only === run.habitat) && G.lookOptionState(run, o).ok);
        if (opts.length) run.look[key] = pick(opts).id;
      });
      G.SCULPT.filter((sl) => T.sculpt.includes(sl.group) && sl.bodies.includes(kind) && (!sl.part || G.hasVisiblePart(run, sl.part))).forEach((sl) => {
        const max = G.sculptMax(run, sl); const steps = Math.round((max - sl.min) / sl.step);
        run.look[sl.id] = Math.round((sl.min + Math.floor(rand() * (steps + 1)) * sl.step) * 100) / 100;
      });
      if (T.colors) { const h = Math.floor(rand() * 360); run.look.hue = h; run.look.belly = (h + 20 + Math.floor(rand() * 40)) % 360; run.look.accent = (h + 40 + Math.floor(rand() * 200)) % 360; run.look.accent2 = (run.look.accent + 30 + Math.floor(rand() * 90)) % 360; }
    });
    G.saveRun();
  };

  // The Creature Editor opens for free when you become a creature and after the Age of Giants and the Spark of Mind;
  // in between it costs a little DNA.
  G.editorCost = () => 0; // the editor is always free: looks never change stats
  G.startEditing = function () {
    const run = G.run;
    if (!run || run.stage !== 'creature' || run.phase !== 'map') return false;
    const cost = G.editorCost(run);
    if (run.dna < cost) return false;
    run.dna -= cost;
    run.freeEdit = false;
    G.saveRun();
    return true;
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
  // ---------- Two foods (Patch 15.1) ----------
  // Meat and plants are kept apart. Herbivores eat only plants, carnivores only meat, omnivores either.
  // Meat is richer (each one feeds 1.5) but a fifth of stored meat rots every turn; plants keep.
  G.MEAT_NOURISH = 1.5; G.MEAT_ROT = 0.2;
  G.edible = (run) => { const d = G.diet(run); return d === 'carn' ? ['meat'] : d === 'herb' ? ['plants'] : ['meat', 'plants']; };
  G.prefFood = (run) => (G.diet(run) === 'carn' ? 'meat' : 'plants');
  // The food you can eat, as one number (kept in run.food for everything that only needs a total).
  G.syncFood = (run) => {
    if (run.meat == null || run.plants == null) { const f = Math.max(0, run.food || 0); run.meat = G.diet(run) === 'carn' ? f : 0; run.plants = G.diet(run) === 'carn' ? 0 : f; }
    run.food = G.edible(run).reduce((t, k) => t + run[k], 0);
    return run.food;
  };
  // Gains go to the food named, if you can eat it; otherwise to the food you eat.
  G.addFood = (run, n, kind) => {
    G.syncFood(run);
    if (n < 0) return -G.spendFood(run, -n);
    const k = kind && G.edible(run).includes(kind) ? kind : G.prefFood(run);
    run[k] += n; G.syncFood(run); return n;
  };
  // Costs come out of meat first (it would only rot), then plants.
  G.spendFood = (run, n) => {
    G.syncFood(run);
    let left = n;
    G.edible(run).forEach((k) => { const take = Math.min(run[k], left); run[k] -= take; left -= take; });
    G.syncFood(run); return n - left;
  };
  // Eating: meat feeds 1.5. Returns what could not be eaten (the hunger left over).
  function eatFood(run, need) {
    G.syncFood(run);
    let left = need;
    if (G.edible(run).includes('meat') && left > 0) { const m = Math.min(run.meat, Math.ceil(left / G.MEAT_NOURISH)); run.meat -= m; left -= m * G.MEAT_NOURISH; }
    if (G.edible(run).includes('plants') && left > 0) { const pl = Math.min(run.plants, Math.ceil(left)); run.plants -= pl; left -= pl; }
    G.syncFood(run);
    return Math.max(0, Math.ceil(left - 1e-9));
  }
  let curFoodKind = null; // what kind of food the event being resolved gives
  // A small icon for every mutation, from what it is (its name and id), then its slot.
  G.ICON_RULES = [
    [/eye|sight|sense_|vision/, '👁️'], [/\bwings?\b|feather/, '🪽'], [/shell|carapace|plate|armor|scale/, '🐚'], [/spine|quill|spike/, '🦔'], [/tentacle|octo/, '🐙'],
    [/claw|pincer|scythe|talon/, '🦀'], [/horn|brow/, '🦏'], [/glow|lantern|lure|biolum|light|photophore/, '✨'], [/barbel|antenna|whisker|feeler/, '〰️'], [/venom|sting|toxin|poison|\bbarbs?\b/, '☠️'], [/\bears?\b|echo|sonar|hearing/, '👂'],
    [/fang|jaw|teeth|tooth|maw|beak|bite|cutter|grinder|mandible/, '🦷'], [/filter|baleen|sucker|suction|\blips?\b|tongue|trunk|proboscis|sieve/, '👄'], [/gill|bubble/, '🫧'],
    [/lung|breath/, '🫁'], [/\bheart|blood/, '🫀'], [/hoof|hooves/, '🐴'], [/\bfins?\b|flipper|\brays?\b|fluke/, '🐟'], [/tail/, '🦎'], [/hand|finger|arm|grip|grasp/, '✋'], [/leg|haunch|tendon|bone|stride|sprint|knee/, '🦵'],
    [/foot|feet|pad|toe/, '🐾'], [/flagell|cilia|whip|propel/, '🌀'], [/membrane|wall|skin|hide|fur|coat|camo/, '🧬'], [/garden|moss|kelp|algae|plant|chloro|photocyte|sun sieve/, '🌿'], [/fat|store|stomach|gut|organ/, '🫃'],
    [/brain|mind|neuron|nerve/, '🧠'], [/electric|shock/, '⚡'], [/heat|thermal/, '🔥'], [/magnet/, '🧲'], [/egg|brood|pouch/, '🥚'], [/web|silk/, '🕸️'],
  ];
  G.SLOT_ICONS = { mouth: '👄', senses: '👃', skin: '🧬', back: '🦴', organ: '🫀', membrane: '🫧', tail: '🦎', frontLimbs: '🦵', hindLimbs: '🦵', hands: '✋', feet: '🐾', underside: '⬇️', motility: '🌀', arms: '✋' };
  G.partIcon = (id) => {
    const p = G.PART[id]; if (!p) return '❔';
    if (p.icon) return p.icon;
    const text = `${p.id} ${p.name}`.toLowerCase();
    const r = G.ICON_RULES.find(([re]) => re.test(text));
    return r ? r[1] : G.SLOT_ICONS[G.baseSlot ? G.baseSlot(p.slot) : p.slot] || '🧬';
  };

  // ---------- Stats and modifiers ----------
  // Every source of a modifier, each labelled with where it comes from (for the tap-to-explain panels).
  const tag = (m, src) => (m ? Object.assign({}, m, { src }) : m);
  function modSources(run) {
    const list = [];
    list.push(tag(G.ARCHETYPE[run.archetype].mods, `Archetype: ${G.ARCHETYPE[run.archetype].name}`));
    list.push(tag(G.ORIGIN[run.origin].mods, `Origin: ${G.ORIGIN[run.origin].name}`));
    G.partIds(run).forEach((pid) => list.push(tag(G.PART[pid].mods, G.PART[pid].name)));
    run.traits.forEach((t) => { if (G.TRAITS[t]) list.push(tag(G.TRAITS[t].mods, G.TRAITS[t].name)); });
    run.innovations.forEach((i) => { if (G.INNOVATION[i]) list.push(tag(G.INNOVATION[i].mods, `Mind: ${G.innovationName(G.INNOVATION[i], run)}`)); });
    // Beyond-the-Gate ideas carry on into every later stage as Inheritances.
    if (run.stage !== 'cell' && run.stage !== 'creature') run.innovations.forEach((i) => { const inv = G.INNOVATION[i]; if (inv && inv.inherit) list.push(tag(inv.inherit, `Inheritance: ${G.innovationName(inv, run)}`)); });
    G.activeSynergies(run).forEach((s) => list.push(tag(s.mods, `${G.KEYWORDS[s.keyword].name} set (${s.tier})`)));
    const allies = run.species.filter((s) => !s.extinct && G.speciesStatus(s) === 'allied').length;
    if (allies) list.push(tag({ foodPerTurn: allies }, 'Allied species'));
    if (run.instinct === 'hide') list.push(tag({ damageReduce: 1 }, 'Hiding'));
    if (run.stage !== 'cell') { list.push(tag(G.SYMMETRY[G.symmetry(run)].mods, G.SYMMETRY[G.symmetry(run)].name)); list.push(tag(G.segmentPlan(run).mods, 'Body plan')); }
    if (run.stage !== 'cell' && run.habitat === 'sea') list.push(tag(G.SEA_ZONE[G.zone(run)].mods, `Zone: ${G.SEA_ZONE[G.zone(run)].name}`));
    if (G.people(run)) tribeMods(run).forEach((m) => list.push(m.src ? m : tag(m, 'Your people')));
    if (G.civ(run)) societyMods(run).forEach((m) => list.push(m.src ? m : tag(m, 'Your society')));
    if (run.stage === 'renaissance') renaissanceMods(run).forEach((m) => list.push(m));
    const season = G.season(run);
    // Warm blood shrugs off the food cost of cold seasons.
    const warm = run.traits.includes('blood_warm') || G.firelit(run);
    if (season) list.push(tag(warm && (season.mods.foodPerTurn || 0) < 0 ? { ...season.mods, foodPerTurn: 0 } : season.mods, `Season: ${season.name}`));
    if (G.biomeMatters(run)) { list.push(tag(G.biome(run).mods, `Biome: ${G.biome(run).name}`)); if (G.biome(run).cold && run.traits.includes('blood_cold') && !['tundra', 'polar'].includes(G.biome(run).id)) list.push(tag({ spd: -2, foodPerTurn: -1 }, 'Cold blood in a cold land')); }
    if (run.traits.includes('blood_cold')) {
      const cold = (season && ['winter', 'cold'].includes(season.id)) || ['tundra', 'polar'].includes(G.biome(run).id);
      const hot = (season && ['summer', 'bloom'].includes(season.id)) || ['desert', 'vents'].includes(G.biome(run).id);
      if (cold && !G.firelit(run)) list.push(tag({ spd: -2, foodPerTurn: -1 }, 'Cold blood in the cold'));
      else if (hot) list.push(tag({ spd: 1 }, 'Cold blood in the heat'));
    }
    // Symbiotes share a third of their partner's strengths.
    const partner = G.partnerOf(run);
    if (partner) { const m = {}; G.STATS.forEach((st) => { m[st.id] = Math.floor(G.speciesStat(partner, st.id) / 6); }); list.push(tag(m, `Partner: ${partner.name}`)); }
    G.BOONS.forEach((b) => { const lvl = G.boonLevel(b.id); if (b.mods && lvl) { const m = {}; Object.entries(b.mods).forEach(([k, v]) => { m[k] = v * lvl; }); list.push(tag(m, `Evolution Tree: ${b.name}`)); } });
    if (run.hostility >= 2) list.push(tag({ upkeep: 1 }, 'A hostile world'));
    if (run.hostility >= 4) list.push(tag({ maxPop: -2 }, 'A hostile world'));
    return list;
  }
  // Where a modifier comes from: [{ src, v }], biggest first, sources added together.
  G.modBreakdown = (run, key) => {
    const by = new Map();
    modSources(run).forEach((m) => { const v = (m && m[key]) || 0; if (v) by.set(m.src || 'Other', (by.get(m.src || 'Other') || 0) + v); });
    return [...by.entries()].map(([src, v]) => ({ src, v })).sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
  };

  G.mod = (run, key) => modSources(run).reduce((s, m) => s + ((m && m[key]) || 0), 0);
  // Cells start a little sturdier so early checks are not hopeless.
  G.stat = (run, key) => Math.max(0, (run.stage === 'cell' ? 2 : 1) + G.mod(run, key));
  // Event gains and losses are written for a herd of about 10.
  G.popScale = (run) => Math.max(G.POP_SCALE, G.maxPop(run) / 10);
  // Your maximum is a soft cap: you can grow past it, up to half as many again (the hard cap),
  // but crowded members eat twice, young cost more, and crowding sickness takes a tenth of the excess every turn.
  G.HARD_CAP = 1.5;
  G.hardPop = (run) => Math.round(G.maxPop(run) * G.HARD_CAP);
  G.crowding = (run) => Math.max(0, (run.pop - G.maxPop(run)) / G.maxPop(run));
  // How much of a gain actually lands: everything up to the soft cap, half of the rest, never past the hard cap.
  const capGain = (run, n) => { if (n <= 0) return 0; const soft = Math.max(0, G.maxPop(run) - run.pop); const under = Math.min(n, soft); return Math.max(0, Math.min(G.hardPop(run) - run.pop, under + Math.floor((n - under) / 2))); };
  G.capGain = capGain;
  // Your numbers in 'heads': the units events, upkeep and births are written in.
  G.heads = (run) => run.pop / G.POP_SCALE;
  G.sizeOf = (run) => (run.traits.includes('giant') ? 'giant' : run.traits.includes('small_many') ? 'small' : 'mid');
  // Max Population grows with every milestone, then scales with body size:
  // small creatures live in big herds, giants in small ones.
  G.maxPop = (run) => {
    // A society's size is its settlements.
    const base = G.civ(run) ? 4 + G.boonLevel('hardy') + (run.settlements || []).reduce((t, x) => t + x.size * 5, 0) + G.mod(run, 'maxPop')
      : G.BASE_POP + G.boonLevel('hardy') + (run.multicellular ? 2 : 0) + (run.stage !== 'cell' ? 3 : 0) + (run.stage === 'tribe' ? 2 : 0) + (run.era - 1) * 3 + G.mod(run, 'maxPop');
    // Kept unrounded until the end, so every +1 counts whatever your size.
    let max = Math.max(3, (base + (run.stage === 'tribe' ? 2 * G.boonLevel('w_blood') : 0)) * G.SIZES[G.sizeOf(run)].popMult);
    // Many Minds are few, but each one is brilliant.
    if (G.people(run) && run.path === 'many') max = Math.max(3, max * 0.5);
    const g = G.gimmick(run);
    if (g === 'grazer') max *= 1.6;
    // A parasite can never outgrow its host.
    if (g === 'parasite') { const h = G.hostOf(run); max = Math.min(max, h ? Math.max(3, Math.floor(h.pop * 0.6)) : 3); }
    return Math.round(max * G.POP_SCALE);
  };
  G.foodCap = (run) => { const cap = Math.max(4, G.FOOD_CAP + 2 * G.boonLevel('pantry') + G.mod(run, 'foodCap')); return G.gimmick(run) === 'predator' ? Math.max(4, Math.floor(cap / 2)) : cap; };
  // Every member eats a share: mid-sized creatures 1 Food per 2 members, small per 3, giants per 1.5.
  G.upkeep = (run) => Math.max(1, Math.ceil((G.heads(run) + Math.max(0, run.pop - G.maxPop(run)) / G.POP_SCALE) / G.SIZES[G.sizeOf(run)].eatDiv) + G.mod(run, 'upkeep'));
  G.growthCost = (run) => Math.max(1, G.GROWTH_COST + (run.instinct === 'breed' ? -1 : 0) + G.mod(run, 'growthCost'));

  // Food gathered each turn, with a breakdown for the UI.
  G.income = function (run) {
    const diet = G.diet(run);
    const g = G.gimmick(run);
    const pref = G.prefFood(run);
    const parts = [{ label: 'Scraps', v: 1, kind: pref }];
    // More members means more mouths, but also more gatherers.
    const crew = Math.floor(G.heads(run) / 4);
    // Foraging brings plants and hunting brings meat; a carnivore forages carrion and a herbivore's raids bring plants.
    if (run.instinct === 'forage') parts.push({ label: diet === 'carn' ? 'Scavenging' : 'Foraging', v: 2 + crew + G.mod(run, 'forageBonus') + (diet === 'herb' ? 1 : diet === 'carn' ? -1 : 0), kind: diet === 'carn' ? 'meat' : 'plants' });
    if (run.instinct === 'hunt') parts.push({ label: g === 'predator' ? 'Hunting (on a kill)' : 'Hunting', v: 2 + crew + G.mod(run, 'huntBonus') + (diet === 'carn' ? 1 : diet === 'herb' ? -1 : 0) + (g === 'predator' ? 1 : 0), hunt: true, kind: diet === 'herb' ? 'plants' : 'meat' });
    if (run.bonusFood && run.turn < run.bonusFood.until) parts.push({ label: 'Hidden feeding ground', v: run.bonusFood.v, kind: pref });
    if (G.hostOf(run)) parts.push({ label: 'Feeding on your host', v: run.stage !== 'cell' ? 3 : 2, kind: pref });
    const partner = G.partnerOf(run);
    if (g === 'symbiote' && run.partner && (!partner || partner.pop < partner.cap * 0.3)) parts.push({ label: 'Your partner is struggling', v: -2, kind: pref });
    if (run.instinct === 'explore' || run.instinct === 'hide') parts.push({ label: G.INSTINCT[run.instinct].name, v: -1, kind: pref });
    // A society's settlements farm, fish and herd.
    if (G.civ(run)) parts.push({ label: `${G.socKind(run).settlement[0].toUpperCase()}${G.socKind(run).settlement.slice(1)}s`, v: (run.settlements || []).length, kind: pref });
    const fpt = G.mod(run, 'foodPerTurn');
    const gathered = Math.max(0, parts.reduce((s, p) => s + p.v, 0));
    if (fpt) parts.push({ label: 'Helpers and allies', v: fpt, kind: pref });
    // Bad seasons and instincts can stop your gathering, but they never cancel food your helpers bring.
    const total = Math.max(0, gathered + fpt);
    const meat = Math.max(0, parts.filter((p) => p.kind === 'meat').reduce((s, p) => s + p.v, 0));
    return { total, parts, meat: Math.min(meat, total), plants: Math.max(0, total - Math.min(meat, total)) };
  };

  // Grazers earn DNA from the size of the herd instead of from time.
  G.dnaPerTurn = (run) => (G.civ(run) ? G.influencePerTurn(run) : run.stage === 'tribe' ? G.ideasPerTurn(run) : Math.max(1, (G.gimmick(run) === 'grazer' ? Math.floor(G.heads(run) / 6) : 1) + G.mod(run, 'dnaPerTurn') + (run.instinct === 'explore' ? 1 + G.mod(run, 'exploreBonus') : 0)));
  G.insightPerTurn = (run) => (run.mind ? 1 + Math.floor(G.stat(run, 'cun') / 5) + G.mod(run, 'insightPerTurn') : 0);

  // Checks get harder as a creature, in later eras, and the longer you linger in one (up to +2).
  // Primordia is harsh: a fresh lineage struggles, and the Evolution Tree is how later runs get further.
  // Every failed finale attempt teaches you something: the next try is a little easier.
  // Finales have their own difficulty, so the extra harshness does not apply to them.
  // A hidden measure of how strong the player has become between runs (Evolution Tree and wins),
  // fixed when a run starts. The world quietly grows harsher to match it, so an upgraded player is
  // never left with an easy game. It is never shown to the player.
  G.power = () => {
    const m = G.meta;
    let spent = 0; let total = 0;
    G.BOONS.forEach((b) => { b.costs.forEach((c, i) => { total += c; if (i < G.boonLevel(b.id)) spent += c; }); });
    return Math.min(1, 0.75 * (total ? spent / total : 0) + 0.25 * Math.min(1, (m.stats.wins || 0) / 8));
  };
  // Beginner's grace: the cell stage is gentler until a lineage has reached the Creature stage
  // (2 easier until the first time, 1 easier until the third).
  G.beginnerGrace = (run) => { if (!run || run.stage !== 'cell' || run.revived) return 0; const n = (G.meta && G.meta.stats.creatures) || 0; return n < 1 ? 2 : n < 3 ? 1 : 0; };
  G.harsh = (run) => G.HARSH - G.beginnerGrace(run) + Math.round(4 * (run.power || 0));
  // A new stage is hard: your first Tribe should usually fail. Ancestral Wisdom pays it back.
  G.TRIBE_HARSH = 7;
  G.SOC_HARSH = 6; // Society's own events are harder already; its danger is the council, the neighbours and the crowds
  G.BAND_SOUR = 2; // opinion a band loses each year, unless you are allies
  G.RAID_BELOW = 20;
  G.REN_HARSH = 8;
  G.INVASION = 0.12; // base chance a warlike nation that hates you invades each generation
  G.NATION_SOUR = { peace: 1, guard: 2, war: 4 }; // nations compete: how fast each kind sours on you, unless you are in a league
  G.SOC_RAID_BELOW = 0; // neighbour peoples only raid when they truly hate you
  G.TRIBE_THREAT = 3; // see predation
  G.TRIBE_CHILD_COST = 2;
  G.TRIBE_HIT_CAP = 0.7; // the most often a hunter or band can strike in a year
  G.TRIBE_BLOW = 2; // extra members lost to every strike
  G.TRIBE_GRACE = 5; // years before the wild keeps pace and strikes harder // bands raid you while their opinion is below this
  const finaleEase = (run) => (run.phase === 'event' && run.event && G.EVENT[run.event.id] && G.EVENT[run.event.id].finale ? (run.finaleTries || 0) + G.harsh(run) : 0);
  // A Mimic disguised as the species in this event finds everything easier.
  const disguise = (run) => { const m = G.mimicOf(run); return m && run.phase === 'event' && run.event && run.event.species != null && run.species[run.event.species] === m ? 2 : 0; };
  G.difficulty = (run, base) => base + G.harsh(run) - finaleEase(run) - disguise(run) + (run.stage !== 'cell' ? 0.5 + (run.era - 1) * 1.5 + (G.people(run) ? (G.civ(run) ? (run.stage === 'renaissance' ? G.REN_HARSH : G.SOC_HARSH) : G.TRIBE_HARSH - G.boonLevel('w_elders')) - (finaleEase(run) ? (run.stage === 'tribe' ? 2 * G.boonLevel('w_founding') : 0) + (run.stage === 'society' ? G.boonLevel('h_union') : run.stage === 'renaissance' ? G.boonLevel('p_sail') : 0) : 0) : 0) : 0) + Math.min(2, Math.floor((run.eraTurn - 1) / 6)) + run.hostility;
  // Odds follow a gentle S-curve scaled to the check, so risky options are real choices at every stage:
  // equal to the difficulty is 50%, a few points short is still a gamble, and only big gaps get near 5% or 95%.
  // ---------- Fair Fights (Patch 16.4) ----------
  // The wild evolves too: every species gains an edge that keeps pace with the world's difficulty
  // (era, stage, how long you linger, how strong your lineage has become), so its stats sit in the
  // same range as yours. A check against a species uses its evolved stat: an even (6) check is a
  // coin flip when your stat equals theirs, and every point either way shifts the odds.
  const AVG_FOE = (run) => (run.stage === 'cell' ? 3.5 : 5);
  G.wildEdge = (run) => Math.max(0, Math.round(G.difficulty(run, 0) + 6 - AVG_FOE(run)));
  G.foeStat = (run, s, stat) => G.speciesStat(s, stat) + G.wildEdge(run);
  // The species an event's check is against, if any (finales are against the world).
  G.checkFoe = (run) => {
    if (!run || run.phase !== 'event' || !run.event || run.event.species == null) return null;
    const ev = G.EVENT[run.event.id]; if (!ev || ev.finale) return null;
    const s = run.species[run.event.species];
    return s && !s.extinct ? s : null;
  };
  G.chance = (run, stat, base) => {
    const foe = G.checkFoe(run);
    const d = foe ? G.foeStat(run, foe, stat) + (base - 6) - (G.mindRule(run, 'know_foe') ? 2 : 0) : G.difficulty(run, base);
    return clamp(Math.round(50 + 45 * Math.tanh((G.checkStat(run, stat) - d) / (3 + 0.3 * Math.max(0, d)))), 5, 95);
  };

  G.speciesStatus = (s) => (s.opinion >= 50 ? 'allied' : s.opinion <= -50 ? 'hostile' : s.opinion >= 15 ? 'friendly' : s.opinion <= -15 ? 'wary' : 'neutral');

  G.partPool = function (run) {
    const packs = G.meta.unlocked.packs;
    const slots = G.slotsFor(run).map((s) => s.id);
    const known = run.knownEvos || [];
    return G.PARTS.filter((p) => p.stage === run.stage && (!p.evolved || known.includes(p.id))
      && slots.includes(p.slot)
      && (run.stage === 'cell' || !p.habitat || p.habitat === run.habitat)
      && (!p.pack || packs.includes(p.pack))
      && !(G.gimmick(run) === 'grazer' && p.diet === 'carn')
      && !(G.gimmick(run) === 'predator' && p.diet === 'herb')
      // A mouth for the opposite diet is never offered directly, but omnivore mouths always are: they bridge the two,
      // so any lineage (bar a Grazer or a Predator) can change its diet step by step. With Twin Mouths, the second socket can hold either.
      && !(p.slot === 'mouth' && p.diet && p.diet !== 'omni' && G.diet(run) !== 'omni' && p.diet !== G.diet(run) && !G.boonLevel('twin_mouth'))
      && (!p.biome || p.biome === G.biome(run).id)
      && G.partFits(run, p));
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
    const herd = run.stage === 'cell' || (run.stage !== 'cell' && G.symmetry(run) === 'colonial') ? 'colony' : sea ? 'school' : 'herd';
    const w = { herd, nests: sea ? 'egg beds' : 'nests', cover: sea ? 'weed' : 'grass', home: sea ? 'the water' : 'the land', move: sea ? 'swim' : 'walk', crossing: sea ? 'current' : 'river', depth: run.habitat === 'sea' ? G.SEA_ZONE[G.zone(run)].name : 'the valley' };
    if (G.people(run) && G.kind(run)) {
      // In the Tribe stage, your herd is a people.
      const k = G.kind(run); const cap = (x) => x[0].toUpperCase() + x.slice(1);
      Object.assign(w, { herd: k.band, band: k.band, Band: cap(k.band), resource: k.resource, keeper: k.keeper, camp: k.camp,
        leader: run.leader ? run.leader.name : 'the eldest', ruler: k.leader ? k.leader.toLowerCase() : 'leader', Ruler: k.leader || 'Leader' });
      (run.candidates || []).forEach((c, i) => { w[`cand${i}`] = G.leaderTitle(c); w[`cand${i}h`] = G.leaderPitch(run, c); });
      for (let i = (run.candidates || []).length; i < 4; i++) { w[`cand${i}`] = 'Another candidate'; w[`cand${i}h`] = ''; }
      w.Herd = w.Band;
      if (G.civ(run)) {
        const sk = G.socKind(run);
        Object.assign(w, { ruler: 'ruler', Ruler: 'Ruler', people: sk.name, settlement: sk.settlement, settlements: `${sk.settlement}s`, capital: sk.capital, herd: 'people', Herd: 'People' });
        (run.candidates || []).forEach((c, i) => { w[`cand${i}`] = `${c.role ? `${G.COUNCIL_ROLES[c.role].name} ` : 'The heir, '}${G.leaderTitle(c)}`; w[`cand${i}h`] = G.leaderPitch(run, c); });
        for (let i = (run.candidates || []).length; i < 4; i++) { w[`cand${i}`] = 'The heir'; w[`cand${i}h`] = ''; }
        const pl = run.plot != null && run.council && run.council[run.plot];
        w.plotter = pl ? `${G.COUNCIL_ROLES[pl.role].name} ${pl.name}` : 'a councillor';
        w.myth = G.mythName(run);
        w.nation = G.nationName(run); w.faith = run.faith ? run.faith.name : 'the old faith';
      }
      return w;
    }
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

  // Some species grow into a familiar shape: armored bugs, birds, slugs, crabs.
  function bodyKit(world, diet, body) {
    const P = body.parts; const set = (slot, id) => { if (G.PART[id]) P[slot] = { id, merged: null }; };
    if (world === 'land') {
      if (body.skeleton === 'shell' && rand() < 0.55) { // a bug
        body.segments = pick([3, 3, 4, 6]); set('frontLimbs', 'jointed_legs'); set('senses', 'compound_eyes'); set('skin', 'chitin');
        if (rand() < 0.3) set('hindLimbs', 'jumping_legs');
        if (rand() < 0.25) set('frontLimbs', 'insect_wings');
        if (diet !== 'herb' && rand() < 0.5) set('hands', pick(['land_pincers', 'raptorial_arms']));
        if (rand() < 0.3) set('tail', pick(['spinneret', 'stinger_tail']));
      } else if (body.skeleton === 'shell' && rand() < 0.5) { // a snail or woodlouse
        body.segments = pick([0, 4, 6]); set('back', pick(['snail_shell', 'segment_plates']));
      } else if (body.skeleton === 'soft' && rand() < 0.6) { // a slug
        body.segments = 0; set('skin', 'mucus_skin'); if (rand() < 0.5) set('senses', 'antennae');
      } else if (body.blood === 'warm' && rand() < 0.3) { // a bird
        body.segments = 1; set('frontLimbs', 'feathered_wings'); set('skin', 'down_feathers'); set('feet', 'perching_feet');
        set('mouth', diet === 'carn' ? 'hooked_beak' : diet === 'herb' ? 'seed_beak' : pick(['hooked_beak', 'seed_beak']));
        if (rand() < 0.5) set('tail', 'tail_feathers');
      } else if (body.blood === 'cold' && rand() < 0.3) { // a lizard
        set('skin', pick(['scales', 'mottled_skin'])); set('feet', 'gecko_feet'); set('tail', pick(['drop_tail', 'rattle_tail']));
        if (diet !== 'herb') set('mouth', 'sticky_tongue');
      }
    } else if (body.skeleton === 'shell' && rand() < 0.5) { // a crab or shrimp
      body.segments = pick([3, 4]); set('hands', 'pincers'); set('back', pick(['carapace', 'segment_plates'])); if (rand() < 0.5) set('senses', 'compound_eyes');
    } else if (body.skeleton === 'soft' && rand() < 0.4) { // a sea slug
      body.segments = 0; set('skin', pick(['slime_skin', 'warning_skin'])); set('tail', 'seahorse_tail');
    }
    // A few land species walk on some pairs and hold others up as arms.
    if (world === 'land' && body.segments >= 2 && rand() < 0.2) body.armPairs = 1;
    // A mouth must still match the diet.
    if (P.mouth && G.PART[P.mouth.id].diet && diet !== 'omni' && G.PART[P.mouth.id].diet !== diet) P.mouth.id = G.PARTS.find((p) => p.slot === 'mouth' && p.stage === 'creature' && p.diet === diet && (!p.habitat || p.habitat === world) && !p.evolved).id;
  }

  // How big each kind of species' population can grow.
  const SPECIES_CAP = { prey: 30, neighbor: 18, rival: 16, predator: 8 };

  // Rival species get the same variety as the editor: random proportions, heads and patterns.
  function randomLook(world) {
    const r = (lo, hi) => Math.round((lo + rand() * (hi - lo)) * 100) / 100;
    const opts = (key) => G.APPEARANCE[key].filter((o) => !o.only || o.only === world).map((o) => o.id);
    const hue = Math.floor(rand() * 360);
    return {
      pattern: pick(opts('pattern').filter((id) => id !== 'glowspots' && id !== 'bands')),
      shape: pick(opts('shape')), head: pick(opts('head')), eyes: pick(['round', 'sleepy', 'fierce', 'round']),
      headPos: world === 'land' ? pick(['neck', 'neck', 'forward', 'high', 'tucked']) : 'neck', finish: pick(['matte', 'matte', 'glossy']),
      fins: world === 'sea' ? pick(['plain', 'spiky', 'flowing', 'sharp']) : undefined,
      accent: (hue + 120 + Math.floor(rand() * 120)) % 360, accent2: Math.floor(rand() * 360), belly: (hue + (rand() < 0.5 ? 0 : 40)) % 360,
      bodyLen: r(0.8, 1.35), bodyHeight: r(0.8, 1.3), spine: r(-0.5, 0.5), neckLen: world === 'land' ? r(0, 0.8) : 0,
      legLen: r(0.7, 1.45), legThick: r(0.7, 1.5), legSpread: r(0.7, 1.3), legShift: r(-0.3, 0.3),
      headSize: r(0.8, 1.4), eyeCount: pick([1, 1, 1, 2, 3, 4]), eyeSize: r(0.7, 1.5), jaw: r(0.7, 1.4),
      patScale: r(0.6, 1.6), patDensity: r(0.6, 1.6),
    };
  }

  // Where a sea species lives: glowing ones deep down, hunters in open water, prey on the reef.
  function speciesZone(role, body) {
    const glows = Object.values(body.parts || {}).some((sl) => sl && [sl.id, sl.merged].some((id) => id && (G.PART[id].keywords || []).includes('glow')));
    if (glows) return pick(['twilight', 'abyss']);
    return pick({ predator: ['open', 'open', 'twilight'], prey: ['reef', 'shallows'], rival: ['reef', 'open', 'shallows'], neighbor: ['reef', 'shallows', 'twilight'] }[role]);
  }

  G.NICHE = {}; G.NICHES.forEach((n) => { G.NICHE[n.id] = n; });
  const nicheForRole = (role) => pick(G.NICHES.filter((n) => n.role === role)).id;
  function uniqueName(world, taken) {
    const names = G.SPECIES_NAMES[world];
    let name; let guard = 0;
    do { name = pick(names.first) + pick(names.last); } while (taken.has(name) && guard++ < 50);
    taken.add(name);
    return name;
  }
  // One species filling a niche.
  function makeOne(world, nicheId, taken) {
    const niche = G.NICHE[nicheId];
    const role = niche.role;
    const name = uniqueName(world, taken);
    const opinion = { predator: -35, prey: -10, rival: -5, neighbor: 10 }[role] + Math.round(rand() * 20) - 10;
    const diet = niche.diet === 'omni' ? pick(['herb', 'carn', 'omni']) : niche.diet;
    const body = makeBody(world, diet);
    const cap = Math.round(niche.cap * (world === 'cell' ? 1.5 : 1));
    const size = world === 'cell' ? { predator: 1.5, prey: 0.6, rival: 1, neighbor: 0.9 }[role] * (0.7 + rand() * 0.6) : niche.size[0] + rand() * (niche.size[1] - niche.size[0]);
    const zone = world === 'sea' ? speciesZone(role, body) : undefined;
    body.look = world === 'cell' ? null : randomLook(world);
    if (world !== 'cell') { body.skeleton = pick(['inner', 'inner', 'shell', 'soft']); body.young = pick(['live', 'eggs', 'eggs']); body.blood = pick(['warm', 'cold']); }
    if (world !== 'cell' && body.symmetry === 'bilateral') bodyKit(world, diet, body);
    return { name, role, niche: nicheId, diet, opinion, hue: Math.floor(rand() * 360), size: Math.round(size * 100) / 100, seed: Math.floor(rand() * 1000), world, cap, pop: Math.round(cap * (0.5 + rand() * 0.3)), zone, ...body };
  }
  const takenNames = (run) => new Set(run ? run.species.map((x) => x.name) : []);
  function makeSpecies(world, roles, run) {
    const taken = takenNames(run);
    return roles.map((role) => makeOne(world, nicheForRole(role), taken));
  }
  // A whole new world, one species per starting niche.
  function makeWorld(world) {
    const taken = new Set();
    return G.WORLD_NICHES[world === 'cell' ? 'cell' : 'creature'].map((n) => makeOne(world, n, taken));
  }

  const ROLE_BONUS = { predator: { str: 2, spd: 1 }, prey: { spd: 2, cun: 1 }, rival: { str: 1, tou: 1 }, neighbor: { cha: 2 } };
  G.speciesStat = (s, key) => {
    let v = (s.stage === 'cell' ? 2 : 1) + ((ROLE_BONUS[s.role] || {})[key] || 0) + ((key === 'str' || key === 'tou') ? Math.round((s.size - 1) * 2) : 0)
      + (s.skeleton === 'shell' && key === 'tou' ? 2 : 0) + (s.skeleton === 'soft' && key === 'cun' ? 1 : 0);
    const off = G.speciesBody(s).off;
    Object.entries(s.parts || {}).filter(([k]) => !off.includes(k)).map(([, slot]) => slot).forEach((slot) => [slot.id, slot.merged].filter(Boolean).forEach((id) => { v += (G.PART[id].mods[key] || 0); }));
    return Math.max(0, v);
  };
  G.speciesBody = (s) => {
    const sym = s.symmetry || 'bilateral';
    const n = s.segments != null ? s.segments : 2;
    const arms = s.world === 'land' && sym === 'bilateral' ? Math.min(n, s.armPairs != null ? s.armPairs : (n === 2 && s.look && s.look.posture === 'two' ? 1 : 0)) : 0;
    const off = s.stage === 'creature' ? (G.SYMMETRY[sym].off || []).concat(sym === 'bilateral' ? (G.legPlan(n, s.world, arms).off || []) : []) : [];
    return { stage: s.stage, habitat: s.world === 'cell' ? null : s.world, multicellular: s.multicellular, parts: s.parts || {}, hue: s.hue, traits: s.size >= 2.5 ? ['giant'] : [], symmetry: sym, segments: n, armPairs: arms, skeleton: s.skeleton, off, look: s.look || null };
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
      pop: G.START_POP * G.POP_SCALE, food: G.BASE_FOOD + 3 * (b.pantry || 0),
      power: G.power(),
      dna: 3 * (b.memory || 0), totalDna: 0, insight: 0,
      parts: {}, multicellular: false, mind: false, innovations: [], fascination: null,
      instinct: 'forage',
      traits: [], species: makeWorld('cell'), ages: [], chains: [], openNiches: [], activity: null, biome: 'vent', seenBiomes: ['vent'],
      seen: [], log: [], notices: [],
      draftsTaken: 0, milestonesDone: [], finaleRetryAt: 0, popV: 2,
      phase: 'map', event: null, scene: null, draft: null, lastTurn: null, legacy: null, result: null, lastEvent: null,
      quietTicks: 2, look: {}, knownEvos: G.meta.codex.evolutions.slice(),
    };
    Object.entries(arch.start.cell).forEach(([slot, id]) => { run.parts[slot] = { id, merged: null }; });
    setupGimmick(run);
    run.pop = Math.min(run.pop, G.hardPop(run));
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
    if (g === 'predator') { run.instinct = 'hunt'; run.hunger = 0; if (run.stage === 'cell') G.addFood(run, 3, 'meat'); }
    if (g === 'mimic') run.mimic = null;
  }

  // What a stage pays out in Genetic Memory. Earlier stages' endings were paid at their checkpoints.
  function stageReward(run, victory) {
    const base = Math.floor(run.totalDna / 3);
    const tribe = run.stage === 'tribe'; const soc = G.civ(run);
    const hab = run.habitat === 'sea' ? 'sea' : 'land';
    const progress = run.stage === 'renaissance' ? 5 + Math.min(15, (run.reason || []).length + (run.renDeeds || []).length) : soc ? 5 + Math.min(15, (run.settlements || []).length * 2 + (run.traditions || []).length) : tribe ? 5 + Math.min(10, (run.discoveries || []).length * 2) : (run.multicellular ? 5 : 0) + (run.stage === 'creature' ? 10 : 0) + (run.era >= 2 ? 5 : 0) + (run.era >= 3 ? 10 : 0);
    // Later endings are worth less than a Creature ending, which has already been paid out.
    const winBonus = victory ? (tribe || soc ? 25 : 40) : 0;
    // Each new ending in the Codex is worth a bonus.
    const ren = run.stage === 'renaissance';
    const endKey = victory && (ren ? (run.renaissanceEnding ? `${run.path}|${run.renaissanceEnding}` : null) : soc ? (run.societyEnding ? `${run.path}|${hab}|${run.societyEnding}` : null) : tribe ? (run.tribeEnding ? `${run.path}|${hab}|${run.tribeEnding}` : null)
      : run.legacy && !G.LEGACIES[run.legacy].old ? `${run.legacy}|${G.temperament(run).id}` : null);
    const codexList = ren ? 'renaissanceEndings' : soc ? 'societyEndings' : tribe ? 'tribeEndings' : 'endings';
    const firstEnding = endKey && !(G.meta.codex[codexList] || []).includes(endKey) ? 10 : 0;
    const mult = (1 + 0.25 * run.hostility) * (run.revived ? G.REVIVE_MULT : 1);
    return { base, progress, winBonus, firstEnding, mult, endKey, codexList, tribe, soc };
  }
  function endRun(run, victory, cause) {
    const { base, progress, winBonus, firstEnding, endKey, codexList, tribe, soc } = stageReward(run, victory);
    // Lineages that die as cells still learn something: 1 per 4 turns survived, and never less
    // than 6 in all, so early runs can afford the first upgrades.
    const survival = run.stage === 'cell' ? Math.max(Math.floor(run.turn / 4), 6 - base - progress - winBonus, 0) : 0;
    const mult = (1 + 0.25 * run.hostility) * (run.revived ? G.REVIVE_MULT : 1);
    const genes = Math.round((base + progress + winBonus + survival + firstEnding) * mult);
    const m = G.meta;
    m.genes += genes;
    if (victory) {
      m.stats.wins += 1;
      m.maxHostility = Math.max(m.maxHostility, Math.min(G.MAX_HOSTILITY, run.hostility + 1));
      if (run.legacy && !tribe && !soc) addUnique(m.codex.legacies, run.legacy);
      if (endKey) addUnique(m.codex[codexList] = m.codex[codexList] || [], endKey);
    } else {
      m.stats.extinctions += 1;
    }
    m.stats.bestDna = Math.max(m.stats.bestDna || 0, run.totalDna);
    run.result = { victory, cause, genes, breakdown: { base, progress, winBonus, survival, firstEnding, mult, revived: !!run.revived } };
    m.history.unshift({ date: Date.now(), archetype: run.archetype, origin: run.origin, victory, cause: victory ? (soc ? G.civEndingName(run) : tribe ? G.tribeEndingName(run) : G.endingName(run)) : cause, reached: G.reachedLabel(run), genes, turns: run.turn, revived: !!run.revived, body: G.bodyOf(run) });
    m.history = m.history.slice(0, 30);
    run.phase = 'end';
    log(run, victory ? (run.stage === 'renaissance' ? `${G.renaissanceEndingName(run)}: ${G.nationName(run)} sets sail.` : soc ? `${G.societyEndingName(run)}: your people unite the region.` : tribe ? `${G.tribeEndingName(run)}: your ${G.kind(run).band} becomes a people.` : `${G.endingName(run)}: your people are born.`) : `${tribe || soc ? 'Your people are gone.' : 'Extinction.'} ${cause}`);
    save();
  }

  // Per-turn rules for hosts, partners, buds and the drifting current.
  function gimmickTurn(run, lines) {
    const g = G.gimmick(run);
    if (g === 'parasite') {
      const h = G.hostOf(run);
      if (h) {
        h.pop = Math.max(0, h.pop - Math.max(0.3, G.heads(run) * 0.04));
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
    if (g === 'colony' && run.pop >= G.maxPop(run) && run.food >= G.growthCost(run) * 2 && G.budsOf(run).length < 3 && G.heads(run) >= 6) bud(run, lines);
  }

  // Part of a Colony splits off as a new, allied species with your body.
  function bud(run, lines) {
    const n = Math.ceil(run.pop / 3);
    run.pop -= n;
    G.spendFood(run, G.growthCost(run) * 2);
    const heads = Math.max(1, Math.round(n / G.POP_SCALE));
    const world = run.stage === 'cell' ? 'cell' : run.habitat;
    const names = G.SPECIES_NAMES[world];
    let name; let guard = 0;
    do { name = pick(names.first) + pick(names.last); } while (run.species.some((s) => s.name === name) && guard++ < 20);
    const body = G.bodyOf(run);
    const parts = {};
    Object.entries(run.parts).forEach(([k, v]) => { if (v && !k.endsWith('2')) parts[k] = { id: v.id, merged: v.merged }; });
    run.species.push({ name, role: 'neighbor', diet: G.diet(run), opinion: 100, hue: (body.hue + 25) % 360, size: G.bodySize(run), seed: Math.floor(rand() * 1000), world, cap: 14, pop: heads,
      plan: run.plan, stage: run.stage, multicellular: run.multicellular, parts, symmetry: G.symmetry(run), segments: G.segments(run), zone: run.habitat === 'sea' ? G.zone(run) : undefined, bud: true, look: run.stage === 'creature' ? G.effectiveLook(run) : null });
    lines.push({ t: `${n} of you split off and founded the ${name}, your allies`, good: true });
    run.notices.push(`Part of your colony split off and founded the ${name}. They are your allies.`);
    log(run, `The ${name} budded off from your colony.`);
  }

  // The current carries a Drifter somewhere new.
  function drift(run) {
    run.nextDrift = run.turn + G.DRIFT_EVERY;
    // The current pushes you to forage or hunt, whichever suits your mouth best (omnivores get either).
    const free = G.drifterFree(run);
    const diet = G.diet(run);
    if (!free) run.instinct = diet === 'herb' ? 'forage' : diet === 'carn' ? 'hunt' : pick(['forage', 'hunt']);
    // You leave your worst enemy behind and meet someone new.
    const movable = run.species.filter((s) => !s.extinct && !s.bud).sort((a, b) => a.opinion - b.opinion);
    let met = null;
    if (movable.length) {
      const gone = movable[0];
      const fresh = makeOne(run.stage === 'cell' ? 'cell' : run.habitat, gone.niche || nicheForRole(gone.role), takenNames(run));
      run.species[run.species.indexOf(gone)] = fresh;
      met = fresh;
    }
    G.addFood(run, 1);
    const land = run.stage !== 'cell' && run.habitat === 'land';
    run.notices.push(land ? `Wanderlust carries your herds to new ground${met ? `, where you meet the ${met.name}` : ''}.`
      : `The current carries you to new waters${met ? `, where you meet the ${met.name}` : ''}.${free ? '' : ` It now pushes you to ${G.INSTINCT[run.instinct].name.toLowerCase()}.`}`);
    log(run, land ? 'Wanderlust carried your kind somewhere new.' : 'The current carried your kind somewhere new.');
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
        && G.partFits(run, p)
        && !(G.gimmick(run) === 'grazer' && p.diet === 'carn')
        && !(G.gimmick(run) === 'predator' && p.diet === 'herb')
        // Omnivore mouths are always on offer: they bridge the two diets.
        && !(p.slot === 'mouth' && p.diet && p.diet !== 'omni' && G.diet(run) !== 'omni' && p.diet !== G.diet(run) && !G.boonLevel('twin_mouth'));
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
    run.pop = Math.min(run.pop, G.hardPop(run));
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
    if (run.stage === 'tribe' && G.boonLevel('w_stand') && !run.lastStandUsed) {
      run.lastStandUsed = true; run.pop = 3 * G.POP_SCALE;
      run.notices.push('Last Stand: your people should have died out, but a few hold on.');
      log(run, 'A few of your people held on against all odds.');
      return true;
    }
    if (!G.boonLevel('second_chance') || run.secondChanceUsed) return false;
    run.secondChanceUsed = true;
    run.pop = 3 * G.POP_SCALE;
    run.notices.push('Second Chance: your kind should have died out, but a few survivors cling on.');
    log(run, 'A few survivors cling on against all odds.');
    return true;
  }

  G.endRunEarly = function () {
    if (G.run && G.run.phase !== 'end') endRun(G.run, false, 'You ended this lineage.');
  };

  // ---------- Effects ----------
  function gainDna(run, n) {
    // Rich Genes and your home world boost DNA, not a people's Ideas.
    let amount = n;
    if (n > 0 && !G.people(run)) { const exact = n * G.ORIGIN[run.origin].dnaMult * (1 + 0.1 * G.boonLevel('rich_genes')) + (run.dnaFrac || 0); amount = Math.floor(exact); run.dnaFrac = exact - amount; }
    run.dna = Math.max(0, run.dna + amount);
    if (amount > 0) run.totalDna += amount;
    return amount;
  }

  // Later eras are more dangerous: the Age of Giants and beyond hit 1 harder.
  function damage(run, n) {
    // Event numbers are written for a herd of about 10, so they scale with your herd size.
    // Small creatures lose even more members to the same blow.
    const molting = run.moltUntil && run.turn <= run.moltUntil ? 2 : 0;
    const raw = n + (run.era >= 2 ? 1 : 0) - G.mod(run, 'damageReduce') + molting;
    const n2 = Math.max(1, raw); const spare = Math.max(0, Math.min(3, 1 - raw)) * 0.2;
    // Never less than one 'head' per point of damage, however small the herd: small herds are fragile.
    // Worked out in whole heads (rounded up), then counted out in individuals, give or take a few.
    const scale = Math.max(1, Math.min(G.maxPop(run), run.pop) / G.POP_SCALE / 10);
    const heads = Math.ceil(n2 * scale * G.SIZES[G.sizeOf(run)].damageMult * (G.gimmick(run) === 'grazer' ? 1.5 : 1));
    let dmg = Math.max(1, Math.round(heads * G.POP_SCALE * (0.85 + rand() * 0.3) * (1 - spare)));
    // Last refuge: down to a quarter of your comfortable size, every loss is halved.
    if (G.mindRule(run, 'last_refuge') && run.pop < G.maxPop(run) * 0.25) dmg = Math.max(1, Math.round(dmg / 2));
    run.pop -= dmg;
    if (G.people(run)) songLoss(run, dmg / G.POP_SCALE);
    return dmg;
  }

  function grow(run, n) {
    const before = run.pop;
    run.pop += capGain(run, Math.ceil(n * G.popScale(run)));
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
    run.pop = Math.min(run.pop, G.hardPop(run));
    return text;
  }

  function applyEffects(run, eff, speciesIdx) {
    const lines = [];
    if (!eff) return lines;
    if (eff.pop) {
      if (eff.pop < 0) lines.push({ t: `−${damage(run, -eff.pop)} ${G.people(run) ? G.popWord(run) : 'Population'}`, bad: true });
      else { const g = grow(run, eff.pop); lines.push({ t: g ? `+${g} ${G.people(run) ? G.popWord(run) : 'Population'}` : 'Already at the limit' }); }
    }
    // Shares of your Population: of what you have now, or of your maximum.
    if (eff.popPct) { const n = Math.round(run.pop * Math.abs(eff.popPct)); if (eff.popPct < 0) { run.pop -= n; lines.push({ t: `−${n} ${G.popWord(run)} (${Math.round(-eff.popPct * 100)}% of your number)`, bad: true }); } else { const g = capGain(run, n); run.pop += g; if (g) lines.push({ t: `+${g} ${G.popWord(run)} (${Math.round(eff.popPct * 100)}% of your number)`, good: true }); } }
    if (eff.popFlat) { const word = G.popWord(run); if (eff.popFlat < 0) { const n = Math.min(run.pop, -eff.popFlat); run.pop -= n; lines.push({ t: `−${n} ${word}`, bad: true }); } else { const g = capGain(run, eff.popFlat); run.pop += g; if (g) lines.push({ t: `+${g} ${word}`, good: true }); } }
    if (eff.popMaxPct) { const n = Math.round(G.maxPop(run) * Math.abs(eff.popMaxPct)); if (eff.popMaxPct < 0) { run.pop -= n; lines.push({ t: `−${n} ${G.popWord(run)} (${Math.round(-eff.popMaxPct * 100)}% of your maximum)`, bad: true }); } else { const g = capGain(run, n); run.pop += g; if (g) lines.push({ t: `+${g} ${G.popWord(run)} (${Math.round(eff.popMaxPct * 100)}% of your maximum)`, good: true }); } }
    if (eff.food) {
      const before = G.syncFood(run);
      if (eff.food > 0) G.addFood(run, eff.food, eff.foodKind || curFoodKind); else G.spendFood(run, -eff.food);
      const d = run.food - before;
      if (d) lines.push({ t: `${d > 0 ? '+' : '−'}${Math.abs(d)} Food`, bad: d < 0 });
    }
    if (eff.dna) lines.push({ t: `+${gainDna(run, eff.dna)} ${G.dnaWord(run)}`, good: true });
    if (eff.tame && speciesIdx != null && speciesIdx >= 0 && run.species[speciesIdx] && !run.species[speciesIdx].band) { const sp = run.species[speciesIdx]; sp.tamed = true; sp.opinion = 100; G.remember(sp, 'tamed'); G.addDeed(run, 'deed_tamed'); lines.push({ t: `The ${sp.name} are tamed`, good: true }); }
    if (eff.totem && speciesIdx != null && speciesIdx >= 0 && run.species[speciesIdx]) { run.totem = run.species[speciesIdx].name; G.remember(run.species[speciesIdx], 'revered'); G.addDeed(run, 'deed_totem'); lines.push({ t: `The ${run.totem} are your totem`, good: true }); }
    if (eff.insight) {
      const before = run.insight;
      run.insight = Math.max(0, run.insight + eff.insight);
      const d = run.insight - before;
      if (d) lines.push({ t: `${d > 0 ? '+' : '−'}${Math.abs(d)} Insight`, good: d > 0, bad: d < 0 });
    }
    if (eff.trait) {
      if (addUnique(run.traits, eff.trait)) {
        lines.push({ t: `New trait: ${G.TRAITS[eff.trait].name}`, good: true });
        run.pop = Math.min(run.pop, G.hardPop(run));
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
      if (s.opinion <= -90 && !s.nemesis) { s.nemesis = true; lines.push({ t: `The ${s.name} are now your nemesis`, bad: true }); }
      if (s.opinion >= 90 && !s.sworn) { s.sworn = true; lines.push({ t: `The ${s.name} are now your sworn allies`, good: true }); }
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
    if (eff.drift && G.gimmick(run) === 'drifter') { drift(run); lines.push({ t: run.habitat === 'land' && run.stage !== 'cell' ? 'Wanderlust carries you somewhere new' : 'The current carries you somewhere new', good: true }); }
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
    if (eff.biome && G.biomeMatters(run) && G.biome(run).id !== eff.biome) { moveBiome(run, eff.biome, run.stage === 'cell'); lines.push({ t: `New home: the ${G.biome(run).name}`, good: true }); }
    if (eff.zone && run.habitat === 'sea' && G.zone(run) !== eff.zone) {
      run.zone = eff.zone;
      lines.push({ t: `New home: ${G.SEA_ZONE[eff.zone].name}`, good: true });
    }
    if (eff.chain) (run.chains = run.chains || []).push({ id: eff.chain, at: run.turn + (eff.chainIn || 4), species: speciesIdx != null && speciesIdx >= 0 && run.species[speciesIdx] ? run.species[speciesIdx].name : null });
    if (eff.endActivity && run.activity) { lines.push({ t: `${G.ACTIVITY[run.activity.id].name} is over` }); run.activity = null; }
    if (eff.warScore && run.activity && run.activity.id === 'war') { run.activity.score = clamp(run.activity.score + eff.warScore, -100, 100); lines.push({ t: `War score ${eff.warScore > 0 ? '+' : '−'}${Math.abs(eff.warScore)}`, good: eff.warScore > 0, bad: eff.warScore < 0 }); }
    if (eff.nemesis && speciesIdx != null && speciesIdx >= 0 && run.species[speciesIdx]) run.species[speciesIdx].nemesis = true;
    if (eff.legacy) run.legacy = eff.legacy;
    if (eff.tribeEnding) run.tribeEnding = eff.tribeEnding;
    if (eff.societyEnding) run.societyEnding = eff.societyEnding;
    if (eff.renaissanceEnding) run.renaissanceEnding = eff.renaissanceEnding;
    if (eff.schism) { run.schism = eff.schism; lines.push({ t: `The Schism: ${G.REASON.find((x) => x.schism === eff.schism).name} joins your Reason tree`, good: true }); }
    if (eff.renDeed) G.addRenDeed(run, eff.renDeed);
    // Lasting changes to a society, from what it has lived through.
    if (eff.mods) { run.socBoons = (run.socBoons || []).concat([eff.mods]); lines.push({ t: G.describeMods(eff.mods), good: true }); }
    if (eff.loyalty && run.council) { run.council.forEach((c) => { c.loyalty = clamp(c.loyalty + eff.loyalty, -100, 100); }); lines.push({ t: `Your council ${eff.loyalty > 0 ? 'warms to' : 'cools on'} your ruler`, good: eff.loyalty > 0, bad: eff.loyalty < 0 }); }
    if (eff.plotEnds && run.plot != null && run.council && run.council[run.plot]) {
      const c = run.council[run.plot];
      if (eff.plotEnds === 'dismiss') { run.council[run.plot] = newCouncillor(run, c.role); lines.push({ t: `${c.name} is gone; ${run.council[run.plot].name} is the new ${G.COUNCIL_ROLES[c.role].name}`, good: true }); }
      if (eff.plotEnds !== 'coup') G.addSocDeed(run, 'sd_plot_crushed');
      if (eff.plotEnds === 'appease') { c.loyalty = 20; lines.push({ t: `${c.name} is satisfied, for now`, good: true }); }
      if (eff.plotEnds === 'coup') { const lost = Math.round(run.pop * 0.1); run.pop -= lost; lines.push({ t: `${c.name} has seized power! −${lost} people in the fighting`, bad: true }); run.council.forEach((x) => { x.loyalty = clamp(x.loyalty - 10, -100, 100); }); log(run, `${c.name} overthrew ${G.leaderTitle(run.leader)}.`); endReign(run, run.leader, 'overthrown'); run.leader = { name: c.name, traits: c.traits.concat(['cruel']).slice(0, 2), bg: c.bg, amb: 'conquer', since: run.turn, life: 14 + Math.floor(rand() * 10) }; startReign(run, run.leader); run.council[run.plot] = newCouncillor(run, c.role); }
      run.plot = null;
    }
    if (eff.settlementLoss && run.settlements && run.settlements.length > 1) { const st = run.settlements.slice().sort((x, y) => x.size - y.size)[0]; if (st.size > 1) { st.size -= 1; lines.push({ t: `${st.name} shrinks`, bad: true }); } else { run.settlements = run.settlements.filter((x) => x !== st); lines.push({ t: `${st.name} is abandoned`, bad: true }); } run.pop = Math.min(run.pop, G.hardPop(run)); }
    if (eff.settlementGrow && run.settlements) { const st = run.settlements.slice().sort((x, y) => x.size - y.size)[0]; if (st && st.size < 4) { st.size += 1; lines.push({ t: `${st.name} grows`, good: true }); } }
    if (eff.newSettlement && run.settlements && run.settlements.length < 8) { const name = settlementName(run); run.settlements.push({ name, size: 1 }); lines.push({ t: `A new ${G.socKind(run).settlement}: ${name}`, good: true }); }
    if (eff.neighbourOpinion) { run.species.filter((x) => x.band && !x.extinct).forEach((b) => { b.opinion = clamp(b.opinion + eff.neighbourOpinion, -100, 100); }); lines.push({ t: `Every neighbour people ${eff.neighbourOpinion > 0 ? 'likes' : 'dislikes'} you more`, good: eff.neighbourOpinion > 0, bad: eff.neighbourOpinion < 0 }); }
    if (eff.tradition) { const opts = traditionOptions(run); if (opts.length) { const d = pick(opts); run.traditions.push(d); addUnique(G.meta.codex.traditions = G.meta.codex.traditions || [], d); lines.push({ t: `Tradition: ${G.TRADITION[d].name}`, good: true }); } }
    if (eff.mound) { const m0 = run.mound || 0; run.mound = clamp(m0 + eff.mound, 0, 6); if (run.mound !== m0) lines.push({ t: `Your ${G.kind(run).camp} grows to level ${run.mound}`, good: true }); }
    if (eff.gear) { const g0 = run.gear || 0; run.gear = clamp(g0 + eff.gear, 0, 5); if (run.gear !== g0) lines.push({ t: `Gear level ${run.gear}`, good: run.gear > g0, bad: run.gear < g0 }); }
    if (eff.costMod) { run.costMods = (run.costMods || []).filter((x) => run.turn < x.until).concat([{ pct: eff.costMod.pct, until: run.turn + (eff.costMod.turns || 10), why: (eff.costMod.why || 'Recent events').replace(/\{resource\}/g, G.kind(run) ? G.kind(run).resource : 'resource') }]); lines.push({ t: `Discoveries cost ${Math.abs(eff.costMod.pct)}% ${eff.costMod.pct < 0 ? 'less' : 'more'} for ${eff.costMod.turns || 10} turns`, good: eff.costMod.pct < 0, bad: eff.costMod.pct > 0 }); }
    if (eff.special) { const before = run.special || 0; run.special = clamp(before + eff.special, 0, G.SPECIAL_HARD); const d = run.special - before; if (d) lines.push({ t: `${d > 0 ? '+' : '−'}${Math.abs(d)} ${G.kind(run).resource}`, good: d > 0, bad: d < 0 }); }
    if (eff.specialOn && !run.specialOn) { run.specialOn = true; run.special = Math.max(run.special || 0, 2); lines.push({ t: `Your people now have ${G.kind(run).resource}`, good: true }); }
    if (eff.band2) { const b = makeBand(run, true); if (b) lines.push({ t: `Another band: the ${b.name}`, bad: b.opinion < 0 }); }
    if (eff.band) { const b = makeBand(run); if (b) lines.push({ t: `A rival ${G.kind(run).band}: the ${b.name}`, bad: b.opinion < 0 }); }
    if (eff.bandOpinion) { const b = run.species.filter((x) => x.band && !x.extinct).pop(); if (b) { b.opinion = clamp(b.opinion + eff.bandOpinion, -100, 100); lines.push({ t: `The ${b.name} ${eff.bandOpinion > 0 ? 'like' : 'dislike'} you ${eff.bandOpinion > 0 ? 'more' : 'more'}`, good: eff.bandOpinion > 0, bad: eff.bandOpinion < 0 }); } }
    if (eff.leaderPick != null && run.candidates && run.candidates[eff.leaderPick]) { const cand = run.candidates[eff.leaderPick]; if (cand.role && run.council) { const i = run.council.findIndex((c) => c.name === cand.name); if (i >= 0) run.council[i] = newCouncillor(run, cand.role); } if (run.leader) endReign(run, run.leader, 'stepped down');
      run.leader = { name: cand.name, traits: cand.traits.length > 1 ? cand.traits : cand.traits.concat([pick(Object.keys(G.LEADER_TRAITS).filter((x) => !cand.traits.includes(x)))]), bg: cand.bg, amb: cand.amb || pick(Object.keys(G.AMBITIONS)), queen: cand.queen, since: run.turn, life: cand.life || 18 }; startReign(run, run.leader); run.candidates = null; lines.push({ t: `New leader: ${G.leaderTitle(run.leader)}`, good: true }); log(run, `${G.leaderTitle(run.leader)} became leader.`); }
    if (eff.leaderTrait && run.leader && !run.leader.traits.includes(eff.leaderTrait)) { run.leader.traits.push(eff.leaderTrait); lines.push({ t: `${run.leader.name} is now ${G.LEADER_TRAITS[eff.leaderTrait].name}`, good: true }); }
    if (eff.leaderDies && run.leader) { endReign(run, run.leader, 'died'); lines.push({ t: `${run.leader.name} has died`, bad: true }); log(run, `${G.leaderTitle(run.leader)} died.`); run.leader = null; run.needLeader = true; }
    if (eff.discovery) { const opts = discoveryOptions(run); if (opts.length) { const d = pick(opts); run.discoveries.push(d); addUnique(G.meta.codex.discoveries = G.meta.codex.discoveries || [], d); lines.push({ t: `Discovery: ${G.DISCOVERY[d].name}`, good: true }); } }
    if (eff.forget && run.discoveries && run.discoveries.length) { const d = pick(run.discoveries); run.discoveries = run.discoveries.filter((x) => x !== d); lines.push({ t: `Forgotten: ${G.DISCOVERY[d].name}`, bad: true }); }
    if (eff.path && !run.path) {
      run.path = eff.path;
      lines.push({ t: `Path of Mind: ${G.PATH[eff.path].name}`, good: true });
      log(run, `Your kind chose its Path of Mind: ${G.PATH[eff.path].name}.`);
    }
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
    if (res && popLoss(res)) return 'hurt';
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
  const popLoss = (res) => (res.pop || 0) < 0 || (res.popPct || 0) < 0 || (res.popFlat || 0) < 0 || (res.popMaxPct || 0) < 0;
  function sceneStory(run, ev, opt, res, success, sp) {
    const stat = opt.check && opt.check.stat;
    const pop = res && popLoss(res) ? -1 : (res && res.pop) || 0;
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

  // Natural disasters get their own scene: the flood rises, the storm closes in, the sickness drifts through.
  G.HAZARD_OF = {
    flood: ['t_flood', 's_flood', 't_swarm_flood', 'storm_surge', 'shore_waves'],
    storm: ['storm', 'storm_season', 'storm_current', 't_storm_sea', 's_great_storm', 'whirlpool'],
    cold: ['cold_snap', 'deep_winter', 'hungry_winter', 'tundra_blizzard', 'polar_ice', 't_long_winter', 'ice_crystal', 's_cut_off'],
    sickness: ['viral_ghost', 'plague', 'garden_blight', 'eye_blight', 'partner_sick', 'jungle_fever', 't_sickness', 't_garden_blight', 'pct_sickness', 's_plague', 'toxic_plume', 'red_tide', 't_red_tide'],
    drought: ['drought', 'drying_out', 'uv_storm', 's_famine', 'lean_tide'],
    fire: ['wildfire', 't_grass_fire', 'tool_s_fire_spreads', 'carry_the_young'],
    dust: ['sandstorm', 'stampede', 'pct_stampede', 'hunt_stampede'],
    quake: ['vent_eruption', 'black_smokers'],
  };
  const HAZARD = {}; Object.entries(G.HAZARD_OF).forEach(([k, ids]) => ids.forEach((id) => { HAZARD[id] = k; }));
  function hazardOf(ev, sp) {
    if (sp != null && sp >= 0) return null;
    return ev.hazard || HAZARD[ev.id] || null;
  }
  // How your creature feels about what just happened, for its face.
  function sceneMood(res, opt, success, hazard) {
    if (res && res.mood) return res.mood;
    if (hazard) return res && popLoss(res) ? (success === false ? 'scared' : 'sad') : success === false ? 'worried' : 'happy';
    if (res && popLoss(res)) return success === false ? 'dizzy' : 'sad';
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
      if (role === 'target') return run.activity && run.activity.target === s.name;
      if (role === 'nemesis') return !!s.nemesis;
      if (role === 'sworn') return !!s.sworn || s.opinion >= 90;
      if (role === 'migrant') return !!s.migrant;
      if (role === 'band') return !!s.band;
      if (role === 'tamed') return !!s.tamed;
      if (role === 'wild') return !s.band && !s.tamed && s.role !== 'predator';
      if (role === 'totem') return run.totem === s.name;
      if (run.activity && run.activity.id === 'avoid' && run.activity.target === s.name && rand() < 0.7) return false;
      return s.role === role;
    });
    return idx.length ? pick(idx) : -1;
  }

  function eventAllowed(run, e) {
    if (e.finale || e.milestone) return false;
    if (e.stage !== 'any' && ![].concat(e.stage).includes(run.stage) && !(run.stage === 'renaissance' && [].concat(e.stage).includes('society'))) return false;
    if (e.habitat && e.habitat !== run.habitat) return false;
    if (e.zones && !(run.habitat === 'sea' && e.zones.includes(G.zone(run)))) return false;
    if (e.chained) return false;
    if (e.path && e.path !== run.path) return false;
    if (e.biome && !(G.biomeMatters(run) && [].concat(e.biome).includes(G.biome(run).id))) return false;
    if (e.activity && !(run.activity && run.activity.id === e.activity)) return false;
    if (e.season && !(G.season(run) && G.season(run).id === e.season)) return false;
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
    if (e.activity || e.season || e.biome) w *= 2.5; // what you are doing right now drives the story
    // Where you live decides which disasters come: blizzards in the tundra, fevers in the swamp, never a drought at sea.
    const hz = HAZARD[e.id];
    if (hz && G.biomeMatters(run)) w *= (G.biome(run).hazards || []).includes(hz) ? 3 : 0.35;
    if (hz && G.mindRule(run, 'hazard_sense')) w *= 0.6;
    return w;
  }

  function setEvent(run, ev, forced) {
    const s = forced != null ? forced : speciesFor(run, ev.species);
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
    else if (req.serpent && !(run.stage !== 'cell' && G.symmetry(run) === 'bilateral' && G.segments(run) === 0)) reason = 'Needs a legless, serpent body';
    else if (req.manyLegs && !(run.stage !== 'cell' && G.symmetry(run) === 'bilateral' && G.segments(run) - G.armPairs(run) >= 4)) reason = run.habitat === 'sea' ? 'Needs 4 or more pairs of fins' : 'Needs 4 or more pairs of legs';
    else if (req.eyes && G.eyeCount(run) < req.eyes) reason = `Needs ${req.eyes} or more eyes (from eye mutations)`;
    else if (req.arms && G.armPairs(run) < req.arms) reason = 'Needs arms (turn a pair of legs into arms in the Body plan)';
    else if (req.upright && !(run.stage !== 'cell' && G.symmetry(run) === 'bilateral' && G.segments(run) - G.armPairs(run) === 1)) reason = 'Needs to stand on two legs';
    else if (req.size && G.sizeOf(run) !== req.size) reason = `Only for ${req.size} creatures`;
    else if (req.zone && !(run.habitat === 'sea' && G.zone(run) === req.zone)) reason = `Only in ${G.SEA_ZONE[req.zone].name}`;
    else if (req.anyPart && !req.anyPart.some((id) => G.partIds(run).some((pid) => pid === id || (G.PART[pid].from || []).includes(id)))) reason = `Needs ${req.anyPart.map((id) => G.PART[id].name).join(' or ')}`;
    else if (req.food && run.food < req.food) reason = `Needs ${req.food} Food`;
    else if (req.budding && !['radial', 'colonial'].includes(G.symmetry(run))) reason = 'Only radial or no-symmetry bodies can bud';
    else if (req.path && !G.pathState(run, req.path).ok) reason = G.pathState(run, req.path).reason;
    else if (req.special && (run.special || 0) < req.special) reason = `Needs ${req.special} ${G.kind(run) ? G.kind(run).resource : ''}`;
    else if (req.band && !run.species.some((x) => x.band && !x.extinct)) reason = 'Needs a rival band nearby';
    else if (req.cand != null && !(run.candidates && run.candidates[req.cand])) reason = 'A fourth candidate needs Wise Choosing (Ancestral Wisdom)';
    else if (req.socType && run.socType !== req.socType) reason = `Only for ${G.SOCIETY_TYPES[req.socType].name} peoples`;
    else if (req.settlements && (run.settlements || []).length < req.settlements) reason = `Needs ${req.settlements} ${G.socKind(run) ? G.socKind(run).settlement : 'settlement'}s`;
    else if (req.neighbour && !run.species.some((x) => x.band && !x.extinct && x.opinion >= req.neighbour)) reason = `Needs a neighbour people with opinion ${req.neighbour} or more`;
    else if (req.ownPath && run.path !== req.ownPath) reason = `Only for ${G.PATH[req.ownPath].name}`;
    else if (req.disposition && !req.disposition.includes(G.disposition(run))) reason = `Not for a ${G.LEAN_NAMES[G.disposition(run)]} people`;
    else if (opt.result && opt.result.trait === 'giant' && run.traits.includes('skeleton_shell') && run.habitat === 'land') reason = 'An outer shell cannot carry a giant on land';
    else if (req.gimmick && G.gimmick(run) !== req.gimmick) reason = `Only for the ${G.ARCHETYPES.find((a) => a.gimmick === req.gimmick).name}`;
    else if (G.gimmick(run) === 'colony' && run.phase === 'event' && run.event && run.event.id === 'multicellularity' && opt.result && opt.result.trait !== 'sessile_plan') reason = 'A Colony always grows without symmetry';
    else if (G.gimmick(run) === 'grazer' && req.diet && !req.diet.some((d) => d !== 'carn')) reason = 'Grazers never hunt';
    const out = { ok: !reason, reason };
    // Options your kind can never take (wrong diet, wrong archetype) are not shown at all.
    if (reason && ((req.diet && G.useless(run, { diet: req.diet })) || (req.gimmick && G.gimmick(run) !== req.gimmick) || (req.disposition && !req.disposition.includes(G.disposition(run))))) out.hidden = true;
    if (opt.check) { out.chance = G.chance(run, opt.check.stat, opt.check.diff); const foe = G.checkFoe(run); if (foe) out.foe = { name: foe.name, them: G.foeStat(run, foe, opt.check.stat) + (opt.check.diff - 6) - (G.mindRule(run, 'know_foe') ? 2 : 0), you: G.checkStat(run, opt.check.stat) }; }
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
    let rerolled = false;
    if (opt.check) {
      success = rand() * 100 < state.chance;
      // An awakening (The Few Who Lived): once per stage, a failed check is tried again.
      if (!success && G.mindRule(run, 'reroll') && !(run.rerolls || {})[run.stage]) { run.rerolls = Object.assign({}, run.rerolls, { [run.stage]: true }); rerolled = true; success = rand() * 100 < state.chance; }
      res = success ? opt.success : opt.fail;
    }
    const sp = run.event.species;
    // Food from a hunt or a carcass is meat; from fruit, blooms and kelp it is plants; otherwise what you eat.
    curFoodKind = (ev.tags || []).includes('hunt') || ['carcass', 'bones'].includes(ev.prop) ? 'meat' : ['fruit', 'bloom', 'kelp', 'tree', 'pond'].includes(ev.prop) ? 'plants' : null;
    const popBefore = run.pop; const foodBefore = G.syncFood(run); const dnaBefore = run.dna;
    run.lastEvolution = null;
    const lines = applyEffects(run, res, sp);
    const story = sceneStory(run, ev, opt, res, success, sp);
    if (rerolled) lines.unshift({ t: `Second chance: it went wrong, and you tried again${success ? ', and it worked' : ''}`, good: success });
    if (success && opt.check && run.mind && G.mindRule(run, 'insight_spark')) { run.insight += 2; lines.push({ t: '+2 Insight', good: true }); }
    // What happened here may become a memory in the Mind tree.
    const hz0 = hazardOf(ev, sp);
    if (hz0 && G.HAZARD_MEMORY[hz0]) G.addMemory(run, G.HAZARD_MEMORY[hz0]);
    if (story === 'brawl_win') G.addMemory(run, 'mem_victory');
    // The Memory of Kinds: every species remembers what your lineage did to it.
    const foe0 = sp != null && sp >= 0 ? run.species[sp] : null;
    if (foe0) { if (story === 'chase') G.remember(foe0, 'hunted'); else if (story === 'brawl_win' || story === 'brawl_lose') G.remember(foe0, 'fought'); else if (success !== false && sceneAnim(res, opt, success) === 'social') G.remember(foe0, 'befriended'); }
    if (story === 'chase' && sp != null && sp >= 0) G.addMemory(run, 'mem_hunt');
    const anim0 = sceneAnim(res, opt, success);
    if (success !== false && anim0 === 'flee') G.addMemory(run, 'mem_flight');
    if (success !== false && anim0 === 'social' && sp != null && sp >= 0) G.addMemory(run, 'mem_friendship');
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
      mood: sceneMood(res, opt, success, hazardOf(ev, sp)),
      hazard: hazardOf(ev, sp),
      species: sp,
      story, popDelta: run.pop - popBefore, foodDelta: run.food - foodBefore, evolved: run.lastEvolution, before: { pop: popBefore, food: foodBefore, dna: dnaBefore },
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
    if (run.pop <= 0 && !secondChance(run)) { endRun(run, false, G.people(run) ? 'Your people are gone.' : 'Your lineage died out.'); return; }
    if (sc.milestone) {
      run.milestonesDone.push(sc.milestone);
      applyMilestone(run, sc.milestone);
      nextStep(run, false);
      G.fossilize(run);
    } else if (sc.finale && sc.won) {
      if (run.stage === 'cell') evolve(run, sc.habitat);
      else if (run.stage === 'creature' && G.TRIBE_PATHS.includes(run.path)) becomeTribe(run);
      else if (run.stage === 'tribe' && G.SOCIETY_PATHS.includes(run.path)) becomeSociety(run);
      else if (run.stage === 'society') becomeRenaissance(run);
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
    if (afterMax !== beforeMax) run.notices.push(`Your ${run.stage === 'cell' ? 'colony' : G.people(run) ? 'people' : run.habitat === 'sea' ? 'schools' : 'herds'} can now grow to ${afterMax} (was ${beforeMax}).`);
  }

  function applyMilestoneInner(run, id) {
    if (run.stage === 'creature' && (id === 'age_of_giants' || id === 'spark_of_mind')) run.freeEdit = true;
    if (id === 'multicellularity') {
      run.multicellular = true;
      run.notices.push('You are multicellular. Two new body slots are open: Senses and Organ.');
    }
    if (id === 'age_of_giants') {
      run.era = 2; run.eraTurn = 1;
      const apex = makeOne(run.habitat, 'apex', takenNames(run));
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

  // The world turns: species grow, compete with others in their niche, hunt, evolve and die out.
  // Empty niches are filled by descendants of survivors or by newcomers, and ages rise and fall.
  function worldTick(run) {
    const world = run.stage === 'cell' ? 'cell' : run.habitat;
    const alive = () => run.species.filter((s) => !s.extinct);
    const prey = alive().filter((s) => s.role === 'prey');
    alive().forEach((s) => {
      // Species in the same niche share its room to grow.
      const crowd = alive().filter((o) => o.niche && o.niche === s.niche).reduce((a, o) => a + o.pop, 0) || s.pop;
      s.pop += 0.14 * s.pop * (1 - crowd / s.cap) + (rand() - 0.5) * s.cap * 0.04;
      if (s.role === 'predator') {
        const food = prey.reduce((a, p) => a + p.pop, 0);
        if (food < 4) s.pop -= s.pop * 0.08;
        prey.forEach((p) => { p.pop -= s.pop * 0.03 / Math.max(1, prey.length / 2); });
      }
      s.pop = Math.min(s.cap * 1.1, s.pop);
      if (s.pop < 0.6) {
        s.extinct = true; s.pop = 0;
        run.notices.push(`The ${s.name} have died out. Their place in the world is empty.`);
        log(run, `The ${s.name} went extinct.`);
        if (!s.left && !s.bud) (run.openNiches = run.openNiches || []).push({ niche: s.niche || nicheForRole(s.role), at: run.turn + 3 + Math.floor(rand() * 4), was: s.name });
      }
    });
    // Migrating herds move on after a few turns.
    alive().forEach((s) => {
      if (s.migrant && run.turn >= s.leaveAt && s.name !== run.host && s.name !== run.partner) {
        s.extinct = true; s.left = true; s.pop = 0;
        run.notices.push(`The ${s.name} have moved on.`);
        log(run, `The ${s.name} migrated away.`);
      }
    });
    // Empty niches fill up: a survivor evolves into the gap, or newcomers arrive.
    const due = (run.openNiches || []).filter((o) => run.turn >= o.at);
    run.openNiches = (run.openNiches || []).filter((o) => run.turn < o.at);
    due.forEach((o) => {
      if (alive().length >= 12) return;
      const parents = alive().filter((x) => !x.bud && !x.migrant && x.world === world);
      const child = makeOne(world, o.niche, takenNames(run));
      child.pop = Math.max(2, Math.round(child.cap * 0.35));
      if (parents.length && rand() < 0.55) {
        const parent = pick(parents);
        child.parts = JSON.parse(JSON.stringify(parent.parts || {}));
        child.symmetry = parent.symmetry; child.segments = parent.segments; child.multicellular = parent.multicellular;
        child.hue = (parent.hue + 20 + Math.floor(rand() * 40)) % 360;
        if (parent.look && child.look) child.look = { ...parent.look, bodyLen: child.look.bodyLen, headSize: child.look.headSize, pattern: child.look.pattern };
        mutateSpecies(child);
        child.parent = parent.name;
        run.notices.push(`The ${child.name} evolved from the ${parent.name} and took the place of the ${o.was} (${G.NICHE[o.niche].name.toLowerCase()}).`);
        log(run, `The ${child.name} evolved from the ${parent.name} to fill the ${o.was}' niche.`);
      } else {
        run.notices.push(`The ${child.name} arrived to fill the niche left by the ${o.was} (${G.NICHE[o.niche].name.toLowerCase()}).`);
        log(run, `The ${child.name} moved into the ${o.was}' old niche.`);
      }
      run.species.push(child);
    });
    // Species keep evolving too.
    if (rand() < 0.05) {
      const s = pick(alive().filter((x) => !x.bud));
      if (s) { const what = mutateSpecies(s); if (what) log(run, `The ${s.name} evolved ${what}.`); }
    }
    // Migrating herds pass through now and then (creature stage).
    if (run.stage !== 'cell' && !alive().some((x) => x.migrant) && alive().length < 12 && rand() < 0.05) {
      const m = makeOne(world, pick(['big_grazer', 'small_grazer', 'browser']), takenNames(run));
      m.migrant = true; m.leaveAt = run.turn + 5; m.pop = Math.round(m.cap * 0.8); m.opinion = 0;
      run.species.push(m);
      run.notices.push(`A migrating herd of ${m.name} is passing through. They will move on in 5 turns.`);
      log(run, `The ${m.name} passed through on their migration.`);
    }
    // A world that has emptied out fills again.
    if (alive().length < 4 && rand() < 0.1) {
      const n = makeOne(world, pick(G.NICHES).id, takenNames(run));
      n.pop = Math.max(2, Math.round(n.cap * 0.3));
      run.species.push(n);
      run.notices.push(`A new species has arrived: the ${n.name} (${G.ROLES[n.role].toLowerCase()}).`);
      log(run, `The ${n.name} arrived.`);
    }
    updateAge(run);
  }

  // Give a species a new part (and a nudge in size). Returns a short description.
  function mutateSpecies(s) {
    const stage = s.stage || (s.world === 'cell' ? 'cell' : 'creature');
    const plan = s.world === 'cell' ? 'cell' : s.world;
    const slots = G.SLOTS[plan].filter((sl) => (!sl.multi || s.multicellular) && sl.id !== 'mouth');
    const slot = pick(slots);
    if (!slot) return '';
    const pool = G.PARTS.filter((p) => p.stage === stage && (!p.evolved || p.limbEvo) && !p.limbMod && p.slot === slot.id && (stage === 'cell' || !p.habitat || p.habitat === s.world));
    if (!pool.length) return '';
    const part = pick(pool);
    s.parts = s.parts || {};
    s.parts[slot.id] = { id: part.id, merged: null };
    if (s.niche && stage === 'creature') { const n = G.NICHE[s.niche]; s.size = Math.round(clamp(s.size * (0.9 + rand() * 0.2), n.size[0], n.size[1]) * 100) / 100; }
    return part.name.toLowerCase();
  }

  // The age is named after whoever dominates the world: most numerous and biggest.
  function updateAge(run) {
    if (run.turn % 4 !== 0) return;
    const yours = G.heads(run) * G.bodySize(run);
    let best = { name: 'your kind', you: true, v: yours };
    run.species.filter((s) => !s.extinct && !s.migrant).forEach((s) => { const v = s.pop * s.size * (s.role === 'predator' ? 1.4 : 1); if (v > best.v) best = { name: s.name, you: false, v }; });
    run.ages = run.ages || [];
    const cur = run.ages[run.ages.length - 1];
    if (cur && cur.name === best.name && cur.stage === run.stage) { run.ageRival = null; return; }
    // A new age needs its rising power to stay on top for two checks in a row.
    if (cur && cur.stage === run.stage) {
      if (!run.ageRival || run.ageRival !== best.name) { run.ageRival = best.name; return; }
      run.ageRival = null;
    }
    const label = best.you ? 'The Age of Your Kind' : `The Age of the ${best.name}`;
    run.ages.push({ turn: run.turn, stage: run.stage, name: best.name, you: best.you, label });
    run.ages = run.ages.slice(-20);
    if (cur) {
      run.notices.push(`A new age dawns: ${label}.`);
      log(run, `${label} began.`);
    }
  }

  // Seasons turn in the creature stage.
  G.season = (run) => {
    if (run.stage === 'cell') return null;
    const list = G.SEASONS[run.habitat];
    return list[Math.floor((run.stageTurn - 1) / G.SEASON_LENGTH) % list.length];
  };

  // ---------- Biomes and the world map ----------
  G.biomeWorld = (run) => (run.stage === 'cell' ? 'cell' : run.habitat);
  G.biomeList = (run) => G.BIOMES[G.biomeWorld(run)];
  G.biome = (run) => { const list = G.biomeList(run); return list.find((b) => b.id === run.biome) || list.find((b) => b.id === G.HOME_BIOME[G.biomeWorld(run)]); };
  // Biomes only start to matter once your cells cling together.
  G.biomeMatters = (run) => run.stage !== 'cell' || run.multicellular;
  // How much of the world you can see: 0 = only your biome, 1 = its neighbours (and you choose
  // where to migrate), 2 = the whole world.
  G.vision = (run) => {
    if (run.stage === 'cell') return 0;
    if (run.innovations.some((i) => G.INNOVATION[i] && G.INNOVATION[i].vision)) return 2;
    if (run.mind || G.stat(run, 'cun') >= 6) return 1;
    return 0;
  };
  G.visibleBiomes = (run) => {
    const here = G.biome(run);
    const v = G.vision(run);
    const seen = run.seenBiomes || [];
    return G.biomeList(run).filter((b) => b.id === here.id || seen.includes(b.id) || v >= 2 || (v >= 1 && here.next.includes(b.id)));
  };
  // Move your kind to another biome: most neighbours there are new.
  function moveBiome(run, id, keepSpecies) {
    const b = G.biomeList(run).find((x) => x.id === id);
    if (!b) return;
    run.biome = id;
    if (run.stage === 'tribe') G.addDeed(run, 'deed_migrate');
    run.seenBiomes = run.seenBiomes || [];
    if (!run.seenBiomes.includes(id)) run.seenBiomes.push(id);
    if (!keepSpecies) {
      const world = run.stage === 'cell' ? 'cell' : run.habitat;
      const bound = (s) => s.name === run.partner || s.name === run.host || s.bud || s.nemesis;
      run.species.forEach((s) => { if (!s.extinct && !bound(s)) { s.extinct = true; s.left = true; s.pop = 0; } });
      const fresh = makeWorld(world).filter((n) => !run.species.some((x) => x.name === n.name));
      run.species.push(...fresh.slice(0, run.stage === 'cell' ? 5 : 8));
    }
    run.notices.push(`Your kind has reached the ${b.name}. ${b.desc}`);
    log(run, `Your kind settled in the ${b.name}.`);
  }
  // Crawl onto land, or return to the sea, from the shore.
  function crossHabitat(run) {
    const to = run.habitat === 'land' ? 'sea' : 'land';
    const lost = [];
    Object.keys(run.parts).forEach((k) => {
      const sl = run.parts[k];
      if (!sl) return;
      const ok = (id) => { const p = G.PART[id]; return p && (!p.habitat || p.habitat === to); };
      if (!ok(sl.id) && sl.merged && ok(sl.merged)) run.parts[k] = { id: sl.merged, merged: null };
      else if (!ok(sl.id)) { if (!sl.id.startsWith('stubby')) lost.push(G.slotLabel(sl)); delete run.parts[k]; }
      else if (sl.merged && !ok(sl.merged)) { lost.push(G.PART[sl.merged].name); sl.merged = null; }
    });
    run.habitat = to; run.plan = to;
    const basic = to === 'sea' ? { frontLimbs: 'stubby_front_fins', hindLimbs: 'stubby_rear_fins' } : { frontLimbs: 'stubby_forelegs', hindLimbs: 'stubby_hindlegs' };
    Object.entries(basic).forEach(([k, id]) => { if (!run.parts[k]) run.parts[k] = { id, merged: null }; });
    // Everyone needs a mouth: your archetype's own grows in if yours could not come along.
    if (!run.parts.mouth) run.parts.mouth = { id: G.ARCHETYPE[run.archetype].start[to].mouth, merged: null };
    if (to === 'sea') run.zone = 'shallows';
    run.biome = to === 'sea' ? 'coast' : 'shore';
    run.seenBiomes = [run.biome];
    run.species = makeWorld(to);
    setupGimmick(run);
    addUnique(run.traits, to === 'land' ? 'land_pioneer' : 'deep_dweller');
    run.freeEdit = true;
    run.pop = Math.max(1, Math.min(run.pop, G.hardPop(run)));
    noteParts(run);
    const text = to === 'land' ? 'Your kind has crawled out onto the land for good.' : 'Your kind has returned to the sea.';
    run.notices.push(`${text}${lost.length ? ` Left behind: ${lost.join(', ')}.` : ''} New parts can now grow.`);
    log(run, text);
  }

  // ---------- Activities ----------
  G.ACTIVITY = {}; G.ACTIVITIES.forEach((a) => { G.ACTIVITY[a.id] = a; });
  G.activityTarget = (run) => (run.activity && run.activity.target ? run.species.find((s) => s.name === run.activity.target && !s.extinct) || null : null);
  // Can this activity start now (and against this species)?
  G.activityState = (run, id, target) => {
    const a = G.ACTIVITY[id];
    if (!a || run.phase === 'end') return { ok: false, why: '' };
    if (a.stage && ![].concat(a.stage).includes(run.stage) && !(run.stage === 'renaissance' && [].concat(a.stage).includes('society'))) return { ok: false, hidden: true, why: '' };
    if (a.path && a.path !== run.path) return { ok: false, hidden: true, why: '' };
    if (id === 'cross' && G.people(run)) return { ok: false, hidden: true, why: '' };
    if (id === 'hunt' && (G.diet(run) === 'herb' || G.gimmick(run) === 'grazer')) return { ok: false, hidden: true, why: '' };
    if (a.target) {
      const s = target && run.species.find((x) => x.name === target && !x.extinct);
      if (!s) return { ok: false, why: 'Choose a species' };
      if ((id === 'war' || id === 'hunt') && (s.name === run.partner || s.bud)) return { ok: false, why: 'Not your own partners or offshoots' };
      if (id === 'hunt' && G.gimmick(run) === 'grazer') return { ok: false, why: 'Grazers never hunt' };
      if (id === 'hunt' && G.diet(run) === 'herb') return { ok: false, why: 'Herbivores do not hunt' };
      if (id === 'court' && G.speciesStatus(s) === 'allied') return { ok: false, why: 'They are already your allies' };
    }
    if (id === 'migrate' && G.gimmick(run) === 'parasite') return { ok: false, why: 'A parasite goes where its host goes' };
    if (id === 'migrate' && run.stage === 'cell') return { ok: false, why: 'Cells cannot choose where to go; only currents and storms move them' };
    const tribeWhy = tribeActivityState(run, id, target);
    if (tribeWhy) return { ok: false, why: tribeWhy };
    if (id === 'cross' && !(run.stage === 'creature' && G.biome(run).crossing)) return { ok: false, why: run.habitat === 'land' ? 'Only from the Shore' : 'Only from the Coast' };
    if (id === 'war' && run.turn < (run.warReadyAt || 0)) return { ok: false, why: `Your kind is tired of war: ready in ${run.warReadyAt - run.turn} turns` };
    if (id === 'scout' && run.turn < (run.scoutReadyAt || 0)) return { ok: false, why: `Your scouts need rest: ready in ${run.scoutReadyAt - run.turn} turns` };
    if (id === 'migrate' && run.turn < (run.migrateReadyAt || 0)) return { ok: false, why: `Too soon to move again: ready in ${run.migrateReadyAt - run.turn} turns` };
    return { ok: true };
  };
  G.startActivity = function (id, target, dest) {
    const run = G.run;
    if (!run || !G.activityState(run, id, target).ok) return;
    run.activity = { id, target: target || null, turns: 0, score: 0, dest: id === 'migrate' && G.vision(run) >= 1 && G.biome(run).next.includes(dest) ? dest : null };
    const a = G.ACTIVITY[id];
    run.notices.push(`Activity begun: ${a.name}${target ? ` (the ${target})` : ''}.`);
    log(run, `${G.people(run) ? "Your people" : "Your kind"} began to ${a.name.toLowerCase()}${target ? `: the ${target}` : ''}.`);
    G.saveRun();
  };
  G.stopActivity = function () {
    const run = G.run;
    if (!run || !run.activity) return;
    log(run, `Your kind gave up: ${G.ACTIVITY[run.activity.id].name}.`);
    run.activity = null;
    G.saveRun();
  };
  function finishActivity(run, text, good) {
    run.notices.push(text);
    log(run, text);
    run.activity = null;
    return { t: text, good, bad: !good };
  }
  // One turn of the current activity.
  function activityTurn(run, lines) {
    const act = run.activity;
    if (!act) return;
    const a = G.ACTIVITY[act.id];
    act.turns += 1;
    const t = G.activityTarget(run);
    if (a.target && !t) { lines.push(finishActivity(run, `The ${act.target} are gone. ${a.name} is over.`, true)); return; }
    if (a.stage && [].concat(a.stage).some((x) => x === 'tribe' || x === 'society' || x === 'renaissance')) { tribeActivityTurn(run, act, t, lines); return; }
    if (act.id === 'migrate') {
      G.spendFood(run, 1);
      // Wanderer peoples move camp a turn faster, and learn on the way.
      const wander = G.people(run) && G.temperament(run).id === 'wanderer';
      const roam = G.civ(run) && run.socType === 'roam';
      // Many Minds have no fixed home: moving costs them nothing.
      if (G.people(run) && run.path === 'many') G.addFood(run, 1);
      if (act.turns >= a.turns - (wander || roam ? 1 : 0)) {
        if (roam) { gainDna(run, 3); lines.push({ t: 'Roaming peoples learn on the road: +3 Influence', good: true }); }
        if (wander) { gainDna(run, 3); lines.push({ t: 'The road taught your people something: +3 Ideas', good: true }); }
        // Without the wits to choose, you end up wherever the road leads.
        const dest = act.dest || pick(G.biome(run).next);
        moveBiome(run, dest);
        G.addFood(run, 3, 'plants'); gainDna(run, 3);
        run.migrateReadyAt = run.turn + 10;
        lines.push(finishActivity(run, `You reached the ${G.biome(run).name}: +3 Food and +3 ${G.dnaWord(run)}.`, true));
      } else lines.push({ t: `Migrating (${act.turns}/${a.turns}): −1 Food` });
    }
    if (act.id === 'war') {
      const power = (x) => x;
      const mine = power(G.stat(run, 'str') + Math.floor(G.stat(run, 'tou') / 2) + Math.floor(G.heads(run) / 5));
      const theirs = power(G.speciesStat(t, 'str') + Math.floor(G.speciesStat(t, 'tou') / 2) + Math.floor(t.pop / 8));
      const delta = Math.round(16 + (mine - theirs) * 5 + (rand() - 0.5) * 34);
      act.score = clamp(act.score + delta, -100, 100);
      t.pop = Math.max(0, t.pop - t.cap * 0.05);
      t.opinion = clamp(t.opinion - 6, -100, 100);
      G.spendFood(run, 1);
      lines.push({ t: `War with the ${t.name}: ${delta >= 0 ? '+' : '−'}${Math.abs(delta)} (score ${act.score})`, good: delta > 0, bad: delta < 0 });
      if (rand() < (delta < 0 ? 0.4 : 0.15)) lines.push({ t: `War dead: −${damage(run, 1)} Population`, bad: true });
      if (act.score >= 100) {
        t.pop = Math.max(0.5, t.pop * 0.35); t.opinion = -100; t.nemesis = true;
        G.addFood(run, 6, 'meat'); gainDna(run, 5); addUnique(run.traits, 'feared'); run.warReadyAt = run.turn + 8;
        // Takers carry off what the beaten band knew.
        if (G.civ(run) && run.socType === 'conquer') { gainDna(run, 4); lines.push({ t: 'Warlike peoples gain from every victory: +4 Influence', good: true }); }
        if (t.band) { run.bandWins = (run.bandWins || 0) + 1; G.addDeed(run, 'deed_war'); G.addSocDeed(run, 'sd_war_epic'); G.addRenDeed(run, 'rd_war'); }
        G.remember(t, 'warred');
        if (t.band && G.people(run) && G.temperament(run).id === 'taker') { const opts = discoveryOptions(run); if (opts.length) { const d = pick(opts); run.discoveries.push(d); addUnique(G.meta.codex.discoveries, d); lines.push({ t: `You took their knowledge: ${G.DISCOVERY[d].name}`, good: true }); } }
        lines.push(finishActivity(run, `Victory! The ${t.name} are broken and their territory is yours: +6 Food, +5 ${G.dnaWord(run)}. They will not forget.`, true));
      } else if (act.score <= -100) {
        t.opinion = -100; t.nemesis = true; addUnique(run.traits, 'scarred');
        lines.push({ t: `Defeat: −${damage(run, 2)} Population`, bad: true });
        run.warReadyAt = run.turn + 8;
        lines.push(finishActivity(run, `Defeat. The ${t.name} drove you back.`, false));
      }
    }
    if (act.id === 'court') {
      // Mask peoples win others over with Cunning.
      const wooing = G.people(run) && G.temperament(run).id === 'mask' ? Math.max(G.stat(run, 'cha'), G.stat(run, 'cun')) : G.stat(run, 'cha');
      // Another thinking people is harder to win over than an animal.
      const chance = clamp(42 + (wooing - 2) * 8 + (run.stage === 'tribe' ? 15 * G.boonLevel('w_kin') : 0) + (G.hasFlag(run, 'messengers') ? 15 : 0) - (t.band ? 15 : 0), 15, 95);
      const gain = t.band ? 7 : 12;
      if (rand() * 100 < chance) { t.opinion = clamp(t.opinion + gain, -100, 100); lines.push({ t: `Courting the ${t.name}: opinion +${gain}`, good: true }); }
      else { t.opinion = clamp(t.opinion - 2, -100, 100); lines.push({ t: `The ${t.name} were not impressed: opinion −2` }); }
      if (t.opinion >= 60) { if (t.opinion >= 90) t.sworn = true; gainDna(run, 3); lines.push(finishActivity(run, `The ${t.name} are now your allies. +3 DNA.`, true)); }
      else if (act.turns >= 12) lines.push(finishActivity(run, `The ${t.name} will not be won over, for now.`, false));
    }
    if (act.id === 'cross') {
      G.spendFood(run, 1);
      if (act.turns >= a.turns) {
        const lost = Math.ceil(run.pop / 4);
        run.pop = Math.max(1, run.pop - lost);
        run.activity = null;
        crossHabitat(run);
        lines.push({ t: `The crossing cost ${lost} of your kind`, bad: true });
        return;
      }
      lines.push({ t: `${run.habitat === 'land' ? 'Returning to the sea' : 'Crawling onto land'} (${act.turns}/${a.turns}): −1 Food` });
    }
    if (act.id === 'avoid') { G.spendFood(run, 2); lines.push({ t: `Keeping away from the ${t.name}: −2 Food` }); }
    if (act.id === 'hunt') {
      const chance = clamp(45 + (Math.max(G.stat(run, 'str'), G.stat(run, 'spd')) - G.speciesStat(t, 'spd')) * 8 + G.mod(run, 'huntBonus') * 4, 10, 90);
      if (rand() * 100 < chance) {
        const food = Math.round((2 + Math.floor(G.heads(run) / 8)) * (G.people(run) && G.temperament(run).id === 'hunter' ? 1.5 : 1));
        G.addFood(run, food, 'meat'); t.pop = Math.max(0, t.pop - t.cap * 0.08); t.opinion = clamp(t.opinion - 6, -100, 100);
        if (G.gimmick(run) === 'predator') { run.hunger = 0; if (rand() < 0.15) run.pendingSpecial = { name: t.name, source: 'devour' }; }
        lines.push({ t: `You hunted the ${t.name}: +${food} Food`, good: true });
      } else if (G.speciesStat(t, 'str') > G.stat(run, 'tou') && rand() < 0.5) lines.push({ t: `The ${t.name} fought back: −${damage(run, 1)} Population`, bad: true });
      else lines.push({ t: `The ${t.name} got away` });
    }
    if (act.id === 'scout') {
      G.spendFood(run, 1);
      lines.push({ t: `Scouting (${act.turns}/${a.turns}): −1 Food` });
      if (act.turns >= a.turns) {
        run.scoutReadyAt = run.turn + 12;
        const r = rand();
        if (r < 0.35) { run.bonusFood = { v: 2, until: run.turn + 10 }; lines.push(finishActivity(run, 'Your scouts found a hidden feeding ground: +2 Food a turn for 10 turns.', true)); }
        else if (r < 0.7) { const s = pick(run.species.filter((x) => !x.extinct)); if (s) run.pendingSpecial = { name: s.name, source: 'absorb' }; lines.push(finishActivity(run, `Your scouts studied the ${s ? s.name : 'world'} up close. You may borrow one of their parts.`, true)); }
        else { gainDna(run, 3); if (run.mind) run.insight += 2; lines.push(finishActivity(run, `Your scouts came back full of stories: +3 DNA${run.mind ? ', +2 Insight' : ''}.`, true)); }
      }
    }
  }

  function endTurn(run) {
    if (G.instinctAllowed(run, run.instinct).hidden) run.instinct = 'forage';
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
    // Gathered food goes into its own store; then everyone eats, meat first.
    const meatIn = Math.min(gathered, inc.meat); const plantsIn = gathered - meatIn;
    G.addFood(run, meatIn, 'meat'); G.addFood(run, plantsIn, 'plants');
    const hungry = eatFood(run, up);
    lines.push({ t: `Food +${gathered} gathered (${meatIn ? `${meatIn} meat` : ''}${meatIn && plantsIn ? ', ' : ''}${plantsIn ? `${plantsIn} plants` : ''}${!gathered ? 'nothing' : ''}), ${up} eaten` });
    gimmickTurn(run, lines);
    activityTurn(run, lines);
    // A shell has to be shed to grow: every 12 turns you are soft for 2 turns.
    if (run.traits.includes('skeleton_shell') && run.stageTurn % 12 === 0) { run.moltUntil = run.turn + 2; lines.push({ t: 'Molting: your new shell is soft for 2 turns', bad: true }); }
    const season = G.season(run);
    if (season && run.seasonId !== season.id) { if (run.seasonId) run.notices.push(`${season.name}: ${season.desc}`); run.seasonId = season.id; }
    if (hungry > 0) {
      const starve = hungry;
      const starved = Math.min(run.pop, starve * G.POP_SCALE);
      run.pop -= starved;
      lines.push({ t: `Starving: −${starved} ${G.popWord(run)}`, bad: true });
    } else {
      // Spare Food becomes young: bigger herds can raise more at once.
      // A people raises its young slowly: one a year, and each costs more.
      const tribe = G.people(run);
      const cost = G.growthCost(run) + (tribe ? G.TRIBE_CHILD_COST : 0);
      let born = 0;
      // Each brood costs spare Food and adds about ten young (a few more or fewer).
      // A society raises young in every settlement.
      const birthCap = G.civ(run) ? run.settlements.length : tribe || run.traits.includes('young_live') ? 1 : Math.ceil(G.popScale(run) / G.POP_SCALE) * (run.traits.includes('young_eggs') ? 2 : 1);
      let broods = 0;
      // Past your soft cap, every brood costs more Food: up to twice as much at the hard cap.
      const broodCost = () => Math.ceil(cost * (1 + 2 * G.crowding(run)));
      let spent = 0;
      while (G.syncFood(run) >= broodCost() && run.pop < G.hardPop(run) && broods < birthCap) { const c = broodCost(); G.spendFood(run, c); spent += c; const n = Math.min(G.hardPop(run) - run.pop, Math.round(G.POP_SCALE * (0.8 + rand() * 0.4))); run.pop += n; born += n; broods += 1; }
      if (born) lines.push({ t: `+${born} ${tribe ? G.popWord(run) : 'Population'} (used ${spent} spare Food)`, good: true });
      // Crowding sickness: a tenth of everyone past the soft cap, every turn.
      const over = run.pop - G.maxPop(run);
      if (over > 0) { const sick = Math.max(1, Math.round(over * 0.1)); run.pop -= sick; lines.push({ t: `Overcrowding: −${sick} ${tribe ? G.popWord(run) : 'Population'} (you are past your comfortable size of ${G.maxPop(run)})`, bad: true }); }
    }
    // Predators and hostile species pick off your weakest. Toughness and Speed keep them at bay,
    // and the longer you linger in a stage, the hungrier the world gets.
    const hunters = run.species.filter((x) => !x.extinct && (x.role === 'predator' || G.speciesStatus(x) === 'hostile')).length;
    const crowdEase = 1 / Math.sqrt(Math.max(1, hunters));
    run.species.forEach((s) => {
      if (s.extinct || run.pop <= 0 || s.bud || s.name === run.partner) return;
      if (run.activity && run.activity.id === 'avoid' && run.activity.target === s.name && rand() < 0.7) return;
      if (s === G.mimicOf(run) && rand() < 0.4) return;
      const hostile = G.speciesStatus(s) === 'hostile';
      // A rival band that dislikes you raids you, even before it turns openly hostile.
      const raider = s.band && !s.treaty && s.opinion < (G.civ(run) ? (s.nationDisp === 'war' ? 20 : s.nationDisp === 'peace' ? -30 : G.SOC_RAID_BELOW) : G.RAID_BELOW);
      if (s.role !== 'predator' && !hostile && !raider) return;
      if (s.tamed) return;
      // A thinking band keeps up with you: its strength is never far below your own, and grows with the years.
      const bandAtk = s.band ? Math.max(0, G.stat(run, 'str') - 3 - G.speciesStat(s, 'str')) + 2 + Math.floor(run.stageTurn / 8) - (G.temperament(run).id === 'hunter' ? 2 : 0) : 0;
      // In the Tribe stage the wild grows more dangerous with the years.
      const yearsAtk = G.people(run) ? Math.floor(run.stageTurn / 8) : 0;
      // ...and its hunters keep pace with a strong people: never more than G.TRIBE_THREAT below your defence.
      const def0 = G.stat(run, 'tou') + Math.floor(G.stat(run, 'spd') / 2);
      const paceAtk = G.people(run) && run.stageTurn > G.TRIBE_GRACE && !s.band && G.TRIBE_THREAT != null ? Math.max(0, def0 - G.TRIBE_THREAT - Math.floor(G.harsh(run) / 2) - G.speciesStat(s, 'str')) : 0;
      const atk = G.speciesStat(s, 'str') + bandAtk + yearsAtk + paceAtk + Math.floor(G.harsh(run) / 2) + (run.stage !== 'cell' ? run.era - 1 : 0) + Math.min(3, Math.floor(run.stageTurn / 10));
      const def = G.stat(run, 'tou') + Math.floor(G.stat(run, 'spd') / 2);
      // The bigger the gap, the more often and harder they strike; even the strong are never quite safe.
      const gap = atk - def;
      const hit = clamp(G.PREDATION + 0.04 * gap + (hostile ? 0.1 : 0), 0.04, run.stage === 'tribe' ? G.TRIBE_HIT_CAP : G.people(run) ? 0.6 : 0.45) * (run.instinct === 'hide' ? 0.5 : 1) * (1 + 0.4 * (run.power || 0));
      if (rand() >= hit * crowdEase * (G.biomeMatters(run) ? G.biome(run).danger || 1 : 1) * (s.nemesis ? 1.5 : 1) * (run.traits.includes('skeleton_soft') ? 0.8 : 1) * G.campShield(run)) return;
      const n = clamp(1 + Math.floor(gap / 3), 1, s.band ? 4 : 3) + (G.people(run) && run.stageTurn > G.TRIBE_GRACE ? (run.stage === 'tribe' ? G.TRIBE_BLOW : run.stage === 'renaissance' && s.band ? 2 : 1) : 0);
      if (s.band) G.addDeed(run, 'deed_raid'); G.remember(s, 'attacked');
      lines.push({ t: s.band ? `The ${s.name} raided your ${G.civ(run) ? G.socKind(run).settlement : G.kind(run).camp}: −${damage(run, n)} ${G.popWord(run)}` : `The ${s.name} hunted you: −${damage(run, n)} ${G.popWord(run)}`, bad: true });
    });
    const regrow = G.mod(run, 'popPerTurn');
    if (regrow > 0 && run.pop > 0) { const g = grow(run, regrow); if (g) lines.push({ t: `+${g} ${G.popWord(run)} regrown`, good: true }); }
    const cap = G.foodCap(run);
    // Meat rots; and there is only so much room to store food.
    G.syncFood(run);
    const rot = Math.floor(run.meat * G.MEAT_ROT * (G.mindRule(run, 'no_rot') ? 0.5 : 1));
    if (rot) { run.meat -= rot; lines.push({ t: `${rot} meat rotted`, bad: true }); }
    const stored = run.meat + run.plants;
    if (stored > cap) { let over = stored - cap; const m = Math.min(run.meat, over); run.meat -= m; over -= m; run.plants -= over; lines.push({ t: `${stored - cap} Food spoiled (storage ${cap})`, bad: true }); }
    G.syncFood(run);
    lines.push({ t: `+${gainDna(run, G.dnaPerTurn(run))} ${G.dnaWord(run)}`, good: true });
    if (G.people(run)) tribeTurn(run, lines);
    if (G.civ(run)) societyTurn(run, lines);
    if (run.stage === 'creature') {
      // Memories from the state of the world.
      if (run.pop < G.maxPop(run) * 0.15) G.addMemory(run, 'mem_near_end');
      if (G.biomeMatters(run) && run.biome && run.biome !== G.HOME_BIOME[run.habitat]) G.addMemory(run, 'mem_migration');
      if (run.species.some((x) => x.extinct && !x.left && !x.bud)) G.addMemory(run, 'mem_extinction');
      if (run.species.some((x) => !x.extinct && G.speciesStatus(x) === 'allied')) G.addMemory(run, 'mem_ally');
      if (run.species.some((x) => !x.extinct && G.speciesStatus(x) === 'hostile')) G.addMemory(run, 'mem_nemesis');
    }
    // An awakening (Bonds Between Kinds and others): wary and hostile species warm to you a little.
    if (G.mindRule(run, 'calm_presence')) run.species.forEach((x) => { if (!x.extinct && x.opinion < 0) x.opinion += 1; });
    if (run.mind && run.stage === 'creature') {
      const ins = G.insightPerTurn(run);
      run.insight += ins;
      lines.push({ t: `+${ins} Insight`, good: true });
    }
    run.pop = Math.min(run.pop, G.hardPop(run));
    if (run.pop <= 0 && run.conquered) { endRun(run, false, `The ${run.conquered} took your last ${G.socKind(run).settlement}. Your nation is no more.`); return; }
    if (run.pop <= 0 && !secondChance(run)) { endRun(run, false, hungry > 0 ? (G.people(run) ? 'Your people starved.' : 'Your lineage starved.') : (G.people(run) ? 'Raids and hunters wiped your people out.' : 'Hunted to extinction.')); return; }
    const st = G.STAGES[run.stage];
    run.lastTurn = { title: `${st.turnName} ${run.stageTurn}`, lines };
    run.turn += 1; run.stageTurn += 1; run.eraTurn += 1;
    researchProgress(run);
  }

  // ---------- Paths of Mind ----------
  G.PATH = {}; G.PATHS.forEach((p) => { G.PATH[p.id] = p; });
  G.temperament = (run) => G.TEMPERAMENTS[run.archetype] || G.TEMPERAMENTS.drifter;
  const hasAnyPart = (run, list) => G.partIds(run).some((id) => list.includes(id) || (G.PART[id].from || []).some((f) => list.includes(f)));
  // Which Paths your body and history allow on their own.
  const PATH_TEST = {
    tool: (run) => G.hasTag(run, 'grasp') || G.armPairs(run) > 0,
    song: (run) => hasAnyPart(run, G.SONG_PARTS) || G.stat(run, 'cha') >= 5,
    many: (run) => run.traits.includes('skeleton_soft') || G.symmetry(run) === 'radial' || hasAnyPart(run, G.MANY_PARTS) || G.stat(run, 'cun') >= 7,
    swarm: (run) => ['colonial', 'radial'].includes(G.symmetry(run)) || run.traits.includes('small_many') || run.traits.includes('young_eggs') || run.traits.includes('young_budding') || run.archetype === 'colony',
    garden: (run) => G.diet(run) === 'herb' || (G.keywordCounts(run).symbiont || 0) > 0 || hasAnyPart(run, G.GARDEN_PARTS) || run.archetype === 'symbiote',
  };
  // Every body can take at least two Paths: if fewer are open, the nearest ones open too.
  G.openPaths = (run) => {
    const open = G.PATHS.filter((p) => PATH_TEST[p.id](run)).map((p) => p.id);
    ['song', 'swarm', 'garden', 'many', 'tool'].forEach((id) => { if (open.length < 2 && !open.includes(id)) open.push(id); });
    return open;
  };
  G.pathState = (run, id) => (G.openPaths(run).includes(id) ? { ok: true } : { ok: false, reason: G.PATH[id].why });
  // The ending your Path leads to here, named by your temperament.
  G.endingFor = (run) => (run.path ? G.ENDING_FOR[run.path][run.habitat === 'sea' ? 'sea' : 'land'] : null);
  G.endingName = (run, legacy) => {
    const l = G.LEGACIES[legacy || run.legacy];
    if (!l) return '';
    return (l.flavor && l.flavor[G.temperament(run).id]) || l.name;
  };
  const nameIn = (v, run) => (v && typeof v === 'object' ? v[run.habitat === 'sea' ? 'sea' : 'land'] : v);
  G.innovationName = (inv, run) => nameIn(inv.name, run);
  G.innovationDesc = (inv, run) => nameIn(inv.desc, run);
  // Which parts of the Mind tree this lineage can see.
  // An idea shows only if this lineage could ever reach it: the ideas it needs must be in the tree too,
  // and not ruled out by a fork you already took.
  G.innovationVisible = (run, inv, depth = 0) => {
    if (run.innovations.includes(inv.id)) return true;
    if (!innovationInTree(run, inv)) return false;
    const r = inv.req || {};
    const reachable = (id) => {
      const p = G.INNOVATION[id]; if (!p) return false;
      if (run.innovations.includes(id)) return true;
      const blocked = run.innovations.some((k) => (p.excludes || []).includes(k) || ((G.INNOVATION[k] || {}).excludes || []).includes(id));
      return !blocked && depth < 6 && G.innovationVisible(run, p, depth + 1);
    };
    if (r.innovation && !r.innovation.some(reachable)) return false;
    if (r.some && r.some.filter(reachable).length < (r.n || 1)) return false;
    return true;
  };
  function innovationInTree(run, inv) {
    if (G.useless(run, inv)) return false;
    const hab = run.habitat === 'sea' ? 'sea' : 'land';
    if (inv.group === 'root') return inv.temper === G.temperament(run).id;
    if (inv.group === 'trunk') return inv.habitat === hab;
    if (inv.group === 'home') return hab === 'land' ? G.biome(run).id === inv.home : G.zone(run) === inv.home;
    if (inv.group === 'body') return G.bodyBranch(run, inv.when || {});
    if (inv.group === 'memory') return (run.memories || []).includes((inv.when || {}).memory);
    return inv.path === run.path;
  }
  // Body branches of the Mind tree: does your body have what this idea grows from?
  G.bodyBranch = (run, w) => {
    if (w.talent) return G.talents(run).has(w.talent);
    if (w.keyword) return !!G.keywordCounts(run)[w.keyword];
    if (w.diet) return G.diet(run) === w.diet;
    if (w.trait) return run.traits.includes(w.trait);
    if (w.sym) return run.stage !== 'cell' && G.symmetry(run) === w.sym;
    return false;
  };
  // What an idea costs: Beyond-the-Gate ideas are cheaper with Old Paths (Evolution Tree).
  G.innovationCost = (run, inv) => Math.max(1, Math.round(inv.cost * (inv.group === 'beyond' ? 1 - 0.15 * G.boonLevel('old_paths') : 1)));
  // Awakenings: does your Mind know an idea with this rule?
  G.mindRule = (run, id) => !!run && ((run.innovations || []).some((i) => G.INNOVATION[i] && G.INNOVATION[i].rule === id) || (G.people(run) && (run.discoveries || []).some((i) => G.DISCOVERY[i] && G.DISCOVERY[i].rule === id)) || (G.civ(run) && (run.traditions || []).some((i) => G.TRADITION[i] && G.TRADITION[i].rule === id)) || (run.stage === 'renaissance' && (run.reason || []).some((i) => G.REASON_ID[i] && G.REASON_ID[i].rule === id)));
  // The stat a check really uses: some awakenings let one stat stand in for another.
  const SWAPS = { outwit: ['str', 'cun'], charm_wit: ['cha', 'cun'], swift_strike: ['str', 'spd'] };
  G.checkStat = (run, stat) => {
    let v = G.stat(run, stat);
    Object.entries(SWAPS).forEach(([rule, [from, to]]) => { if (from === stat && G.mindRule(run, rule)) v = Math.max(v, G.stat(run, to)); });
    return v;
  };
  // Your leaning: Peaceful, Territorial or Warmongering, from the ideas your lineage has learned.
  G.leaning = (run) => {
    const out = { peace: 0, guard: 0, war: 0 };
    (run.innovations || []).forEach((id) => { const inv = G.INNOVATION[id]; if (inv && inv.lean) out[inv.lean] += 1; });
    (run.discoveries || []).forEach((id) => { const d = G.DISCOVERY[id]; if (d && d.lean) out[d.lean] += 1; });
    (run.traditions || []).forEach((id) => { const t = G.TRADITION[id]; if (t && t.lean) out[t.lean] += 1; });
    (run.reason || []).forEach((id) => { const t = G.REASON_ID[id]; if (t && t.lean) out[t.lean] += 1; });
    return out;
  };
  // The Memory of Kinds: what your lineage has done to each species, kept for good. Their descendants
  // (rival bands, neighbour peoples) start with the grudge or the debt.
  G.KIND_MEMORY = { hunted: 'hunted', fought: 'fought', attacked: 'were attacked by', warred: 'went to war with', befriended: 'befriended', tamed: 'tamed', revered: 'revered', treaty: 'signed a treaty with', married: 'married into', betrayed: 'betrayed' };
  G.remember = (s, what) => { if (!s) return; s.history = s.history || {}; s.history[what] = (s.history[what] || 0) + 1; };
  G.grudge = (s) => { const h = (s && s.history) || {}; return clamp(-4 * ((h.hunted || 0) + (h.fought || 0) + 2 * (h.warred || 0) + 5 * (h.betrayed || 0)) + 5 * ((h.befriended || 0) + 2 * (h.tamed || 0) + 2 * (h.revered || 0) + 2 * (h.treaty || 0) + 2 * (h.married || 0)), -40, 30); };
  // Memories: what happened to your lineage in the Creature stage grafts new ideas onto the Mind tree.
  G.addMemory = (run, id) => {
    if (!run || run.stage !== 'creature' || !G.MEMORIES[id]) return;
    run.memories = run.memories || [];
    if (run.memories.includes(id)) return;
    run.memories.push(id);
    const inv = G.INNOVATIONS.find((x) => x.group === 'memory' && x.when.memory === id);
    if (inv) run.notices.push(`A memory: ${G.MEMORIES[id]} ${run.mind ? `Your Mind tree grows a new idea: ${G.innovationName(inv, run)}.` : 'It will shape your Mind, when it wakes.'}`);
  };

  // ---------- The Tribe stage ----------
  // A people's resource (Fire, Song, Light, Brood, Growth) has a soft cap and a hard cap, like Population.
  G.SPECIAL_SOFT = 20; G.SPECIAL_HARD = 30;
  G.SPECIAL_CAP = G.SPECIAL_HARD;
  // A Society's resource comes from its settlements and is used up by their number, not by every member (Update 19).
  G.specialUpkeep = (run) => (G.civ(run) ? Math.floor((run.settlements || []).length / 4) : Math.floor(G.heads(run) / 20));
  // In the Renaissance, Learning past what the Age of Sail needs pays for scholars: +1 resource per 25 surplus, at most 4.
  G.scholarGain = (run) => (run.stage === 'renaissance' && G.goals(run).evolveAt ? clamp(Math.floor((run.dna - G.goals(run).evolveAt) / 25), 0, 4) : 0);
  G.specialGain = (run) => Math.max(0, 2 + G.mod(run, 'specialPerTurn') + (G.civ(run) ? Math.floor((run.settlements || []).reduce((t, x) => t + x.size, 0) / 6) : 0));
  function addSpecial(run, n) {
    const cur = run.special || 0;
    if (n >= 0) { const under = Math.min(n, Math.max(0, G.SPECIAL_SOFT - cur)); run.special = Math.min(G.SPECIAL_HARD, cur + under + Math.floor((n - under) / 2)); }
    else run.special = Math.max(0, cur + n);
    return run.special - cur;
  }
  G.addSpecial = addSpecial;
  // What a discovery costs: more for advanced ones, then changed by a percentage (always rounded to whole numbers)
  // from your Cunning, your leader, how many you are, your discoveries, and events.
  G.DISCOVERY_BASE = { plain: 5, habitat: 6, talent: 6, path: 8, combined: 12, way: 8, legacy: 8, deed: 8, gate: 12, beyond: 22 };
  G.discoveryTier = (d) => (['way', 'legacy', 'deed', 'gate', 'beyond'].includes(d.lore) ? d.lore : d.from ? 'combined' : d.path ? 'path' : d.talent ? 'talent' : d.habitat ? 'habitat' : 'plain');
  G.discoveryCostParts = (run) => {
    const parts = [];
    const cun = G.stat(run, 'cun'); const c = clamp((10 - cun) * 2, -30, 20); if (c) parts.push([`Cunning ${cun}`, c]);
    const big = -Math.min(20, Math.floor(Math.max(0, run.pop - 100) / 100) * 5); if (big) parts.push([`${run.pop} ${G.popWord(run)}`, big]);
    const m = G.mod(run, 'discoveryCost'); if (m) parts.push(['Leader, legacies and discoveries', m]);
    const lw = G.boonLevel('w_lore'); if (lw) parts.push(['Ancestral Wisdom: Lorekeepers', -10 * lw]);
    (run.costMods || []).forEach((x) => { if (run.turn < x.until) parts.push([x.why, x.pct]); });
    return parts;
  };
  G.discoveryCostPct = (run) => clamp(G.discoveryCostParts(run).reduce((t, x) => t + x[1], 0), -60, 100);
  // Halves round down, so a 10% discount is never rounded away on a small price.
  const costRound = (x) => Math.max(1, Math.floor(x + 0.4));
  G.discoveryCost = (run, id) => {
    const d = G.DISCOVERY[id]; if (!d) return 0;
    if (run.stage !== 'tribe') return 0;
    const anc = d.lore === 'beyond' ? 1 - 0.15 * G.boonLevel('w_ancestors') : 1;
    return costRound(G.DISCOVERY_BASE[G.discoveryTier(d)] * (1 + G.discoveryCostPct(run) / 100) * anc);
  };
  G.kind = (run) => G.KINDS[run.path] && G.KINDS[run.path][run.habitat === 'sea' ? 'sea' : 'land'];
  // Fire (or vent-heat) is lit once your Toolmakers have at least 3: it warms you through the cold and keeps hunters away.
  G.firelit = (run) => G.people(run) && run.path === 'tool' && (run.special || 0) >= 3;
  // Many Minds hide in their Light once they have 3.
  G.lightHidden = (run) => G.people(run) && run.path === 'many' && (run.special || 0) >= 3;
  // How much less often hunters and raiders reach your camp.
  G.campShield = (run) => (G.firelit(run) ? 0.75 : 1) * (G.lightHidden(run) ? 0.75 : 1) * (run.stage === 'tribe' ? 1 - 0.15 * G.boonLevel('w_watch') : 1) * (G.hasFlag(run, 'closed') ? 0.8 : 1)
    // Gardeners' tamed animals guard the gardens.
    * (G.people(run) && run.path === 'garden' ? 1 - 0.1 * Math.min(3, run.species.filter((x) => x.tamed && !x.extinct).length) : 1);
  G.wisdomOpen = () => G.stageStarts().length > 0 || (G.meta.codex.tribeEndings || []).length > 0;
  G.patronageOpen = () => G.stageStarts().some((x) => x.stage === 'renaissance') || (G.meta.codex.renaissanceEndings || []).length > 0;
  G.heritageOpen = () => G.stageStarts().some((x) => x.stage === 'society') || (G.meta.codex.societyEndings || []).length > 0;
  G.ruler = (run) => (G.civ(run) ? 'Ruler' : (G.kind(run) && G.kind(run).leader) || 'Leader');
  // What your body lets your people do.
  G.talents = (run) => {
    const t = new Set(); const kw = G.keywordCounts(run); const ids = G.partIds(run);
    const has = (list) => ids.some((id) => list.includes(id) || (G.PART[id].from || []).some((f) => list.includes(f)));
    if (G.hasTag(run, 'grasp') || G.armPairs(run) > 0) t.add('hands');
    if (has(G.SONG_PARTS) || G.stat(run, 'cha') >= 5) t.add('voice');
    if (kw.glow) t.add('glow');
    if (kw.venom) t.add('venom');
    if (kw.armor) t.add('armor');
    if (G.hasTag(run, 'flight')) t.add('wings');
    if (G.eyeCount(run) >= 3 || has(['big_eyes', 'compound_eyes'])) t.add('eyes');
    if (kw.swift) t.add('speed');
    return t;
  };
  G.TALENT_NAMES = { hands: 'Hands', voice: 'Voice', glow: 'Glow', venom: 'Venom', armor: 'Armor', wings: 'Wings', eyes: 'Many eyes', speed: 'Speed' };
  G.leaderTitle = (l) => (l ? `${l.queen ? 'Queen ' : ''}${l.name} the ${l.traits.map((t) => G.LEADER_TRAITS[t].name).join(' and ')}` : 'No one');
  function newLeader(run) {
    const A = G.LEADER_SYLLABLES;
    const traits = []; const keys = Object.keys(G.LEADER_TRAITS);
    while (traits.length < 2) { const t = pick(keys); if (!traits.includes(t)) traits.push(t); }
    const queen = run.path === 'swarm';
    const bg = pick(G.LEADER_BACKGROUNDS); const amb = pick(Object.keys(G.AMBITIONS));
    return { name: pick(A.a) + pick(A.b), traits, bg: bg.id, amb, since: run.turn, life: Math.max(8, 14 + Math.floor(rand() * 12) + (queen ? 8 : 0) + 5 * G.boonLevel('w_choosing') + 5 * G.boonLevel('w_long') + (bg.life || 0)), queen };
  }
  // What a candidate brings, in one line: where they come from, what they want, and what they'd change.
  G.leaderPitch = (run, c) => {
    if (!c) return '';
    const bg = c.bg && G.LEADER_BACKGROUND[c.bg]; const amb = c.amb && G.AMBITIONS[c.amb];
    const mods = {}; (c.traits || []).forEach((t) => Object.entries(G.LEADER_TRAITS[t].mods).forEach(([k, v]) => { mods[k] = (mods[k] || 0) + v; }));
    if (bg) Object.entries(bg.mods).forEach(([k, v]) => { mods[k] = (mods[k] || 0) + v; });
    const kind = G.kind(run);
    const sub = (x) => x.replace(/\{resource\}/g, kind ? kind.resource : 'resource');
    return `${bg ? `${sub(bg.text[0].toUpperCase() + bg.text.slice(1))}. ` : ''}${amb ? `Wants to ${sub(amb.want)} (legacy: ${G.describeMods(amb.legacy)}). ` : ''}${G.describeMods(mods)}`;
  };
  // A leader's ambition: the record of where things stood when they took power, and whether it is done.
  function startReign(run, l) {
    if (!l) return;
    l.since = run.turn;
    l.start = { disc: (run.discoveries || []).length, pop: run.pop, wins: run.bandWins || 0, tamed: run.species.filter((x) => x.tamed && !x.extinct).length };
  }
  G.ambitionProgress = (run, l) => {
    if (!l || !l.amb || !l.start) return null;
    const s = l.start;
    switch (l.amb) {
      case 'conquer': return { now: (run.bandWins || 0) - s.wins, goal: 1 };
      case 'learn': return { now: (run.discoveries || []).length - s.disc, goal: 3 };
      case 'grow': return { now: run.pop, goal: Math.round(s.pop * 1.5) };
      case 'befriend': return { now: Math.max(0, ...run.species.filter((x) => x.band && !x.extinct).map((x) => x.opinion), 0), goal: 50 };
      case 'keep': return { now: run.special || 0, goal: 20 };
      case 'tame': return { now: run.species.filter((x) => x.tamed && !x.extinct).length - s.tamed, goal: 1 };
      default: return null;
    }
  };
  // A leader leaves the stage: into the line of leaders, with their legacy if they earned one.
  function endReign(run, l, how) {
    if (!l) return;
    run.rulers = (run.rulers || []).concat([{ name: l.name, title: G.leaderTitle(l), years: Math.max(0, run.turn - (l.since || run.turn)), amb: l.amb, done: !!l.done, how }]).slice(-20);
  }
  // Everything the Tribe stage adds to your stats.
  function tribeMods(run) {
    const list = [];
    const tm = G.TRIBE_TEMPER[G.temperament(run).id]; if (tm) list.push(tag(tm.mods, 'Temperament'));
    if (run.leader) { run.leader.traits.forEach((t) => list.push(tag(G.LEADER_TRAITS[t].mods, `Leader: ${G.LEADER_TRAITS[t].name}`))); if (run.leader.bg && G.LEADER_BACKGROUND[run.leader.bg]) list.push(tag(G.LEADER_BACKGROUND[run.leader.bg].mods, `Leader: ${G.LEADER_BACKGROUND[run.leader.bg].name}`)); }
    // Legacies of leaders who achieved what they set out to do.
    (run.legacies || []).forEach((x) => { if (G.AMBITIONS[x.amb]) list.push(tag(G.AMBITIONS[x.amb].legacy, `Legacy: ${x.name} the ${G.AMBITIONS[x.amb].name}`)); });
    (run.discoveries || []).forEach((d) => { if (G.DISCOVERY[d]) list.push(tag(G.DISCOVERY[d].mods, G.loreName(G.DISCOVERY[d], run))); });
    if (run.stage === 'tribe') G.WISDOM.forEach((w) => { const lvl = G.boonLevel(w.id); if (w.mods && lvl && w.id !== 'w_hardy') { const m = {}; Object.entries(w.mods).forEach(([k, v]) => { m[k] = v * lvl; }); list.push(tag(m, `Ancestral Wisdom: ${w.name}`)); } });
    if (run.gear) list.push(tag({ str: run.gear, tou: Math.floor(run.gear / 2) }, `Gear ${run.gear}`));
    const totem = run.totem && run.species.find((x) => x.name === run.totem && !x.extinct);
    if (totem) { const best = G.STATS.map((x) => x.id).sort((a, b) => G.speciesStat(totem, b) - G.speciesStat(totem, a))[0]; list.push(tag({ [best]: 1 }, `Totem: ${totem.name}`)); }
    const tamed = run.species.filter((x) => x.tamed && !x.extinct).length;
    if (tamed) list.push(tag({ foodPerTurn: Math.min(3, tamed) }, 'Tamed species'));
    if (run.path === 'song') list.push({ cha: Math.min(3, Math.floor((run.special || 0) / 6)), ideasPerTurn: Math.min(2, Math.floor((run.special || 0) / 10)) });
    if (run.path === 'many') list.push({ cun: 2 });
    if (run.path === 'swarm') { list.push(tag(G.CASTES[run.caste || 'workers'].mods, `Caste: ${G.CASTES[run.caste || 'workers'].name}`)); if (run.mound) list.push(tag({ maxPop: 2 * run.mound, tou: Math.floor(run.mound / 2) }, `Home level ${run.mound}`)); }
    // Gardeners: Growth feeds you, and tamed species feed you twice as well.
    if (run.path === 'garden') list.push(tag({ foodPerTurn: Math.min(4, Math.floor((run.special || 0) / 4)) + Math.min(3, tamed) }, 'Gardens'));
    const hardy = run.stage === 'tribe' ? G.boonLevel('w_hardy') : 0; if (hardy) list.push(tag({ tou: hardy }, 'Ancestral Wisdom: Hardy Folk'));
    return list;
  }
  G.ideasPerTurn = (run) => Math.max(1, 1 + G.mod(run, 'ideasPerTurn') + G.mod(run, 'dnaPerTurn') + Math.floor(G.stat(run, 'cun') / 10) + (run.instinct === 'explore' ? 1 + Math.ceil(G.mod(run, 'exploreBonus') / 2) : 0));
  // Each people stage ends with a Gate idea in its own tree. Once its Learning/Ideas/Influence goal is met,
  // the player has to take the Gate up from that tab.
  const GATES = {
    tribe: { id: 'founding_gate', tab: 'found', tabName: 'Lore', verb: 'Learn', name: 'the Founding', list: (run) => run.discoveries, avail: (run) => G.loreAvailable(run, G.DISCOVERY.founding_gate) },
    society: { id: 'union_gate', tab: 'laws', tabName: 'Law', verb: 'Adopt', name: 'the Union', list: (run) => run.traditions, avail: (run) => G.lawAvailable(run, G.TRADITION.union_gate) },
    renaissance: { id: 'sail_gate', tab: 'reason', tabName: 'Reason', verb: 'Take up', name: 'the Age of Sail', list: (run) => run.reason, avail: (run) => G.reasonAvailable(run, G.REASON_ID.sail_gate) },
  };
  G.gateFor = (run) => {
    const g = run && GATES[run.stage]; if (!g) return null;
    const goal = G.goals(run).evolveAt;
    return { ...g, known: (g.list(run) || []).includes(g.id), reached: !!goal && run.dna >= goal, avail: g.avail(run) };
  };
  // One turn of tribe life: the special resource, and the leader growing old.
  function tribeTurn(run, lines) {
    const gate = G.gateFor(run);
    if (gate && gate.reached && !gate.known && run.gateNoticed !== run.stage) {
      run.gateNoticed = run.stage;
      run.notices.push(`Your people are ready for ${gate.name}. ${gate.verb} it in the ${gate.tabName} tab${gate.avail.ok ? '' : ` once you can (${gate.avail.reason.replace(/^Needs/, 'it needs')})`}.`);
    }
    if (run.stage === 'tribe') {
      if (run.species.some((x) => x.band && !x.extinct && x.opinion >= 50)) G.addDeed(run, 'deed_peace');
      if (run.pop < G.maxPop(run) * 0.2) G.addDeed(run, 'deed_near_end');
    }
    if (run.specialOn && G.kind(run)) {
      // Your people make their resource, and use it: the more of them, the more it takes to keep going.
      const gain = G.specialGain(run) + G.scholarGain(run);
      const use = G.specialUpkeep(run);
      const before = run.special || 0;
      addSpecial(run, gain - use);
      // Past the soft cap it is hard to keep: a tenth of the excess is lost every turn.
      const over = (run.special || 0) - G.SPECIAL_SOFT;
      if (over > 0) run.special -= Math.max(1, Math.round(over * 0.1));
      const d = (run.special || 0) - before;
      lines.push({ t: `${d >= 0 ? '+' : '−'}${Math.abs(d)} ${G.kind(run).resource}${use ? ` (your people used ${use})` : ''}`, good: d > 0, bad: d < 0 });
      if (before > 0 && run.special === 0) { lines.push({ t: `Your ${G.kind(run).resource} has run out!`, bad: true }); run.notices.push(`Your ${G.kind(run).resource} has run out. Without it, your people cannot learn anything new, and they are weaker.`); }
    }
    // A leader's ambition, achieved. (Leaders from older saves start keeping score now.)
    if (run.leader && !run.leader.start) { if (!run.leader.amb) run.leader.amb = pick(Object.keys(G.AMBITIONS)); startReign(run, run.leader); }
    const L0 = run.leader; const prog = G.ambitionProgress(run, L0);
    if (L0 && prog && !L0.done && prog.now >= prog.goal) {
      L0.done = true; run.legacies = (run.legacies || []).concat([{ name: L0.name, amb: L0.amb }]);
      const A0 = G.AMBITIONS[L0.amb];
      lines.push({ t: `${L0.name} the ${A0.name} achieved their ambition: ${G.describeMods(A0.legacy)} for good`, good: true });
      run.notices.push(`${G.leaderTitle(L0)} achieved their ambition. Their legacy stays with your people: ${G.describeMods(A0.legacy)}.`);
      log(run, `${G.leaderTitle(L0)} achieved their ambition (${A0.name}).`);
    }
    // The Swarm: brood hatches into new members.
    // (Update 18: it waits until there is plenty, and the colony saves its brood while the Founding is within reach.)
    const saving = run.stage === 'tribe' && G.DISCOVERY.founding_gate && G.loreAvailable(run, G.DISCOVERY.founding_gate).ok;
    if (run.path === 'swarm' && !saving && (run.special || 0) >= 14 && run.pop < G.maxPop(run)) { run.special -= 6; const n = Math.min(G.hardPop(run) - run.pop, G.POP_SCALE); run.pop += n; lines.push({ t: `Brood hatched: +${n} members`, good: true }); }
    // Gardeners: the bigger the garden, the likelier Blight.
    if (run.path === 'garden' && (run.special || 0) >= 8 && run.turn >= (run.blightSafeUntil || 0) && rand() < 0.03 + 0.01 * (run.special - 8)) {
      const lost = Math.ceil(run.special / 2); run.special -= lost; G.spendFood(run, 3);
      lines.push({ t: `Blight! −${lost} Growth, −3 Food`, bad: true });
      run.notices.push('Blight has struck your gardens. Tending them keeps it away for a while.');
      log(run, 'Blight struck the gardens.');
    }
    // Bands compete for the same land: unless you are allies, they slowly sour on you.
    // Even allies need tending: friendship with another people never lasts on its own.
    run.species.forEach((x) => { if (x.band && !x.extinct) x.opinion = Math.max(-100, x.opinion - (run.stage === 'renaissance' && x.nationDisp ? (x.league ? 0 : G.NATION_SOUR[x.nationDisp] - (G.hasFlag(run, 'peaceful') ? 1 : 0)) : G.civ(run) ? (G.hasFlag(run, 'peaceful') || (run.path === 'song' && (run.special || 0) >= 6) ? 0 : 1) : run.path === 'song' && (run.special || 0) >= 6 ? 1 : G.BAND_SOUR)); });
    if (run.stage === 'renaissance') nationsTurn(run, lines);
    if (run.leader && run.turn - run.leader.since >= run.leader.life) {
      endReign(run, run.leader, 'died of old age');
      lines.push({ t: `${run.leader.name}, your leader, has died of old age`, bad: true });
      log(run, `${G.leaderTitle(run.leader)} died of old age.`);
      run.leader = null; run.needLeader = true;
    }
  }
  // Singers: when many die at once, verses are lost, and with them, discoveries.
  function songLoss(run, dmg) {
    if (run.path !== 'song' || dmg < 3) return; // dmg is in heads
    if (G.hasFlag(run, 'songSafe')) return;
    if (run.songSafe) { run.songSafe = false; run.notices.push('Your teaching held: no verses were lost.'); return; }
    run.special = Math.max(0, (run.special || 0) - Math.round(dmg));
    const known = run.discoveries || [];
    if (known.length && run.special < known.length * 2) {
      const d = pick(known);
      run.discoveries = known.filter((x) => x !== d);
      run.notices.push(`Too many singers died. The verse of ${G.DISCOVERY[d].name} is lost, and with it the discovery.`);
      log(run, `The song of ${G.DISCOVERY[d].name} was forgotten.`);
    }
  }
  // A rival band: your old nemesis (or a rival) has learned to think too.
  function makeBand(run, second, limit) {
    const bands = run.species.filter((x) => x.band && !x.extinct);
    if (bands.length >= (limit || (second ? 2 : 1))) return null;
    const alive = run.species.filter((x) => !x.extinct && !x.tamed && !x.band && !bands.some((b) => b.from === x.name));
    const src = (!second && alive.find((x) => x.nemesis)) || alive.filter((x) => x.role === 'rival' || x.role === 'predator').sort((a, b) => a.opinion - b.opinion)[0] || alive.sort((a, b) => b.pop - a.pop)[0];
    if (!src) return null;
    // Each band thinks in its own way: a hive, a choir, a den...
    const kindPath = pick(G.TRIBE_PATHS.filter((pth) => !bands.some((b) => b.kindPath === pth)));
    const word = G.KINDS[kindPath][run.habitat === 'sea' ? 'sea' : 'land'].band;
    const b = JSON.parse(JSON.stringify(src));
    b.name = `${src.name.replace(/s$/, '')} ${word[0].toUpperCase()}${word.slice(1)}`;
    b.band = true; b.role = 'rival'; b.cap = 14; b.pop = 10; b.size = Math.max(src.size, 0.9); b.from = src.name; b.kindPath = kindPath;
    b.opinion = clamp(src.opinion - (src.nemesis ? 30 : 0) + 20 * G.boonLevel('w_peace') + Math.round(G.grudge(src) / 2), -100, 100); b.history = Object.assign({}, src.history); b.nemesis = !!src.nemesis; b.tamed = false; b.extinct = false;
    b.hue = (src.hue + 30) % 360;
    run.species.push(b);
    run.notices.push(`${second ? 'More strangers' : 'Strangers'}: the ${b.name}, ${G.PATH[kindPath].name.toLowerCase()} descended from the ${src.name}.${src.nemesis ? ' They remember the old feud.' : ''}`);
    log(run, `The ${b.name} appeared: ${src.name} who learned to think.`);
    return b;
  }
  // ---------- The Lore tree (Update 18) ----------
  G.loreName = (d, run) => (d.name && typeof d.name === 'object' ? d.name[run.path] || d.name[run.habitat === 'sea' ? 'sea' : 'land'] || Object.values(d.name)[0] : d.name);
  const loreFits = (run, d) => (!d.path || d.path === run.path) && (!d.habitat || d.habitat === (run.habitat === 'sea' ? 'sea' : 'land')) && (!d.talent || G.talents(run).has(d.talent)) && !G.useless(run, d);
  // A Lore idea that needs "n of these" shows only if enough of them could still be in your tree.
  G.loreVisible = (run, d) => {
    if ((run.discoveries || []).includes(d.id)) return true;
    if (!loreVisibleBase(run, d)) return false;
    const r = d.req || {};
    return !r.some || r.some.filter((id) => G.DISCOVERY[id] && loreVisibleBase(run, G.DISCOVERY[id])).length >= (r.n || 1);
  };
  const loreVisibleBase = (run, d) => {
    if ((run.discoveries || []).includes(d.id)) return true;
    if (!loreFits(run, d)) return false;
    switch (d.lore) {
      case 'trunk': return true;
      case 'graft': return (run.grafts || []).includes(d.id);
      case 'combo': return d.from.every((f) => G.DISCOVERY[f] && G.loreVisible(run, G.DISCOVERY[f]));
      case 'way': return !!run.leader && run.leader.bg === d.when.bg;
      case 'legacy': return (run.legacies || []).some((x) => x.amb === d.when.amb);
      case 'deed': return (run.deeds || []).includes(d.when.deed);
      case 'gate': return true;
      case 'beyond': return true;
      default: return false;
    }
  };
  G.loreKnown = (run) => (run.discoveries || []).filter((id) => G.DISCOVERY[id] && G.DISCOVERY[id].lore !== 'gate').length;
  G.foundingNeed = () => Math.max(3, G.FOUNDING_NEED - 2 * G.boonLevel('w_stone'));
  // Can this Lore idea be learned now (ignoring its cost)?
  G.loreAvailable = (run, d) => {
    if ((run.discoveries || []).includes(d.id)) return { ok: false, reason: 'Known' };
    if (!G.loreVisible(run, d)) return { ok: false, hidden: true, reason: 'Not in your tree' };
    if (d.lore === 'combo') { const miss = d.from.filter((f) => !run.discoveries.includes(f)); if (miss.length) return { ok: false, reason: `Needs ${miss.map((f) => G.DISCOVERY[f].name).join(' and ')}` }; }
    if (d.lore === 'gate') {
      const need = G.foundingNeed(); const have = G.loreKnown(run); const ideas = G.goals(run).evolveAt;
      if (run.dna < ideas) return { ok: false, reason: `Needs ${ideas} Ideas (you have ${run.dna})` };
      if (have < need) return { ok: false, reason: `Needs ${need} Lore ideas known (you have ${have})` };
    }
    const r = d.req || {};
    if (r.known && G.loreKnown(run) < r.known) return { ok: false, reason: `Needs ${r.known} Lore ideas known (you have ${G.loreKnown(run)})` };
    if (r.some) { const have = r.some.filter((id) => run.discoveries.includes(id)).length; if (have < r.n) return { ok: false, reason: `Needs ${r.n} of: ${r.some.filter((id) => G.DISCOVERY[id]).map((id) => G.loreName(G.DISCOVERY[id], run)).join(', ')} (you have ${have})` }; }
    if (d.lore === 'beyond' && run.discoveries.includes('founding_gate')) return { ok: false, reason: 'Too late: your people have already been founded' };
    return { ok: true };
  };
  // Learn a Lore idea now, paying its cost.
  // Learning from a tree tab while something else waits on screen (a draft, an event, a scene):
  // the idea is learned quietly and whatever was waiting stays where it was.
  function holdScreen(run) { return run.phase === 'map' ? null : { phase: run.phase, draft: run.draft, scene: run.scene }; }
  function resumeScreen(run, held, name) { if (!held) return; Object.assign(run, held); run.notices.push(`Learned: ${name}.`); save(); }
  G.learnLore = function (id) {
    const run = G.run; const d = G.DISCOVERY[id];
    if (!run || run.stage !== 'tribe' || run.phase === 'end' || !d || !G.loreAvailable(run, d).ok) return;
    const cost = G.discoveryCost(run, id);
    if (cost > (run.special || 0)) return;
    const held = holdScreen(run);
    run.special -= cost;
    run.draft = { options: [id], source: 'lore' };
    learnDiscovery(run, id, null);
    resumeScreen(run, held, G.loreName(d, run));
  };
  // Deeds: what your people did grafts new ideas onto the Lore tree.
  G.addDeed = (run, id) => {
    if (!run || run.stage !== 'tribe' || !G.DEEDS[id]) return;
    run.deeds = run.deeds || [];
    if (run.deeds.includes(id)) return;
    run.deeds.push(id);
    const d = G.DISCOVERIES.find((x) => x.lore === 'deed' && x.when.deed === id);
    if (d) run.notices.push(`A deed remembered: ${G.DEEDS[id]} Your Lore tree grows a new idea: ${d.name}.`);
  };
  G.discoveryCombo = (a, b) => { const r = G.DISCOVERIES.find((d) => d.from && ((d.from[0] === a && d.from[1] === b) || (d.from[0] === b && d.from[1] === a))); return r ? r.id : null; };
  // Discoveries on offer: 1 of 3 (or 4), from your Path, your home and your body's talents.
  function discoveryOptions(run) {
    const talents = G.talents(run); const hab = run.habitat === 'sea' ? 'sea' : 'land';
    const known = run.discoveries || [];
    const usedUp = new Set(known.concat(G.DISCOVERIES.filter((d) => d.from && known.includes(d.id)).flatMap((d) => d.from)));
    let pool = G.DISCOVERIES.filter((d) => d.lore === 'graft' && !usedUp.has(d.id) && (!d.path || d.path === run.path) && (!d.habitat || d.habitat === hab) && (!d.talent || talents.has(d.talent)) && !G.useless(run, d) && !(run.grafts || []).includes(d.id));
    const n = (G.meta.boons.choice ? 4 : 3) + G.boonLevel('w_graft'); const out = [];
    while (out.length < n && pool.length) {
      const d = weightedPick(pool, (x) => (x.talent ? 1.6 : 1) * (x.path ? 1.4 : 1) * (known.concat(run.grafts || []).some((k) => G.discoveryCombo(k, x.id)) ? 1.8 : 1));
      out.push(d.id); pool = pool.filter((x) => x.id !== d.id);
    }
    return out;
  }
  // Keep a discovery you can't afford yet, to learn it later from the Discoveries tab (up to 3).
  G.holdDiscovery = function (pid) {
    const run = G.run;
    if (!run || run.phase !== 'draft' || !G.people(run) || !run.draft.options.includes(pid)) return;
    if (run.stage === 'renaissance') { run.reasonGrafts = run.reasonGrafts || []; addUnique(run.reasonGrafts, pid); } else if (run.stage === 'society') { run.lawGrafts = run.lawGrafts || []; addUnique(run.lawGrafts, pid); } else { run.grafts = run.grafts || []; addUnique(run.grafts, pid); }
    if (!run.draft.source) run.draftsTaken += 1;
    log(run, run.stage === 'renaissance' ? `A new branch of Reason: ${G.loreName(G.REASON_ID[pid], run)}, to take up when your nation can.` : run.stage === 'society' ? `A new branch of Law: ${G.TRADITION[pid].name}, to adopt when your people can.` : `A new branch of Lore: ${G.DISCOVERY[pid].name}, to learn when your people can.`);
    run.draft = null;
    nextStep(run, false);
    save();
  };
  G.learnHeld = (pid) => G.learnLore(pid);
  function learnDiscovery(run, id, combineWith) {
    const d = G.DISCOVERY[id];
    let text = `Your people discovered ${G.loreName(d, run)}`;
    const combo = combineWith && run.discoveries.includes(combineWith) && G.discoveryCombo(combineWith, id);
    let evolved = null;
    if (combo) {
      run.discoveries.push(combo);
      const first = !(G.meta.codex.discoveries || []).includes(combo);
      addUnique(G.meta.codex.discoveries = G.meta.codex.discoveries || [], combo);
      if (first) { G.meta.genes += 3; run.notices.push(`New combination: ${G.DISCOVERY[combo].name}. +3 Genetic Memory, and it is now in your Codex.`); }
      text = `${G.DISCOVERY[combineWith].name} + ${d.name} became ${G.DISCOVERY[combo].name}!`;
      evolved = combo;
    } else run.discoveries.push(id);
    if (d.from && !(G.meta.codex.discoveries || []).includes(id)) { G.meta.genes += 3; run.notices.push(`New combination: ${d.name}. +3 Genetic Memory, and it is now in your Codex.`); text = `${G.DISCOVERY[d.from[0]].name} + ${G.DISCOVERY[d.from[1]].name} became ${d.name}`; evolved = id; }
    if (run.grafts) run.grafts = run.grafts.filter((x) => x !== id);
    addUnique(G.meta.codex.discoveries = G.meta.codex.discoveries || [], id);
    log(run, `Discovery: ${text}.`);
    if (!run.draft.source) run.draftsTaken += 1;
    run.draft = null;
    run.scene = { title: 'Discovery', label: text, text: '', lines: [], anim: 'mutate', mood: evolved ? 'proud' : 'surprised', mutation: true, discovery: evolved || id };
    run.phase = 'mutated';
    save();
  }
  // Extra rules for Activities in the Tribe stage. Returns why not, or null.
  function tribeActivityState(run, id, target) {
    const s = target && run.species.find((x) => x.name === target && !x.extinct);
    if (id === 'tame') { if (!s) return null; if (s.role === 'predator' || s.band) return 'Only gentler species can be tamed'; if (s.tamed) return 'Already tamed'; }
    if (id === 'revere' && s && run.totem === s.name) return 'Already your totem';
    if (id === 'revere' && s && s.band) return 'Not a rival band';
    if (id === 'craft' && (run.special || 0) < 4) return `Needs 4 ${G.kind(run).resource}`;
    if (id === 'craft' && (run.gear || 0) >= 5) return 'Your gear is as good as it gets';
    if (id === 'ceremony' && run.turn < (run.ceremonyReadyAt || 0)) return `Ready in ${run.ceremonyReadyAt - run.turn} turns`;
    if (id === 'raise' && (run.special || 0) < 5) return 'Needs 5 Brood';
    if (id === 'raise' && (run.mound || 0) >= 6) return `Your ${G.kind(run).camp} is as big as it can be`;
    if (id === 'watch' && s && s.tamed) return 'Watch something wilder';
    if ((id === 'craft' || id === 'teach' || id === 'ceremony' || id === 'raise' || id === 'tend') && !run.specialOn && run.stage === 'tribe') return `Your people have no ${G.kind(run).resource} yet`;
    if (id === 'found' && (run.settlements || []).length >= 8) return 'Your region is full (8 settlements)';
    if (id === 'found' && run.food < 6) return 'Needs 6 Food';
    if (id === 'found' && run.pop < G.maxPop(run) * 0.5) return 'Needs your people at half their maximum or more';
    if (id === 'build' && !(run.settlements || []).some((x) => x.size < 4)) return 'Every settlement is as big as it gets';
    if ((id === 'gift' || id === 'trade' || id === 'raid' || id === 'treaty' || id === 'marry') && s && !s.band) return 'Only neighbour peoples';
    if (id === 'treaty' && s && s.treaty) return 'You already have a treaty';
    if (id === 'patronize' && (run.special || 0) < 5) return `Needs 5 ${G.kind(run).resource}`;
    if (id === 'voyage' && run.food < 4) return 'Needs 4 Food';
    if (id === 'league' && s && !s.band) return 'Only nations';
    if (id === 'league' && s && s.league) return 'Already in a league with you';
    if (id === 'league' && s && s.opinion < 60) return 'They need to be your ally (opinion 60)';
    if (id === 'treaty' && s && s.opinion < 40) return 'They need to like you more (opinion 40)';
    if (id === 'marry' && s && s.married) return 'Already bound by marriage';
    if (id === 'marry' && s && s.opinion < 25) return 'They need to like you more (opinion 25)';
    if (id === 'gift' && run.food < 3) return 'Needs 3 Food';
    if (id === 'trade' && s && s.opinion < 10) return 'They need to like you first (opinion 10)';
    return null;
  }
  function tribeActivityTurn(run, act, t, lines) {
    const a = G.ACTIVITY[act.id];
    if (['found', 'build', 'gift', 'trade', 'raid', 'treaty', 'marry', 'patronize', 'voyage', 'league'].includes(act.id)) { societyActivityTurn(run, act, t, lines); return; }
    if (act.id === 'tame') {
      const bonus = (G.temperament(run).id === 'bond' ? 20 : 0) + 15 * G.boonLevel('w_kin');
      const chance = clamp(35 + (G.stat(run, 'cha') - 3) * 8 + bonus, 15, 95);
      if (rand() * 100 < chance) { act.score += 1; t.opinion = clamp(t.opinion + 10, -100, 100); lines.push({ t: `Taming the ${t.name} (${act.score}/3)`, good: true }); }
      else lines.push({ t: `The ${t.name} shy away` });
      if (act.score >= 3) { t.tamed = true; t.opinion = 100; G.remember(t, 'tamed'); G.addDeed(run, 'deed_tamed'); lines.push(finishActivity(run, `The ${t.name} now live alongside your people. +1 Food a turn.`, true)); }
      else if (act.turns >= 10) lines.push(finishActivity(run, `The ${t.name} will not be tamed, for now.`, false));
    }
    if (act.id === 'revere' && act.turns >= a.turns) { run.totem = t.name; G.remember(t, 'revered'); G.addDeed(run, 'deed_totem'); t.opinion = clamp(t.opinion + 40, -100, 100); lines.push(finishActivity(run, `The ${t.name} are now your totem.`, true)); }
    if (act.id === 'ceremony') {
      G.spendFood(run, 1); run.special = (addSpecial(run, 2), run.special); gainDna(run, 1);
      lines.push({ t: `Ceremony: +2 ${G.kind(run).resource}, +1 Idea, −1 Food`, good: true });
      if (act.turns >= a.turns) { run.ceremonyReadyAt = run.turn + 8; G.addDeed(run, 'deed_ceremony'); lines.push(finishActivity(run, 'The ceremony ends. Everyone feels closer.', true)); }
    }
    if (act.id === 'craft' && act.turns >= a.turns) { run.special -= 4; run.gear = (run.gear || 0) + 1; lines.push(finishActivity(run, `New gear for your people (level ${run.gear}).`, true)); }
    if (act.id === 'teach') {
      G.spendFood(run, 1); run.special = (addSpecial(run, 2), run.special);
      lines.push({ t: `Teaching: +2 Song, −1 Food`, good: true });
      if (act.turns >= a.turns) { run.songSafe = true; lines.push(finishActivity(run, 'The songs are learned by heart. The next great loss will not cost a verse.', true)); }
    }
    if (act.id === 'watch') {
      lines.push({ t: `Watching the ${t.name} (${act.turns}/${a.turns})` });
      if (act.turns >= a.turns) {
        if (t.band) {
          const opts = discoveryOptions(run);
          if (opts.length) { const d = pick(opts); run.discoveries.push(d); addUnique(G.meta.codex.discoveries, d); lines.push(finishActivity(run, `By watching the ${t.name}, your people learned ${G.DISCOVERY[d].name}.`, true)); } else lines.push(finishActivity(run, `The ${t.name} know nothing you do not.`, false));
        } else { gainDna(run, 2); run.special = (addSpecial(run, 3), run.special); lines.push(finishActivity(run, `Watching the ${t.name} taught your people something: +2 Ideas, +3 Light.`, true)); }
      }
    }
    if (act.id === 'raise' && act.turns >= a.turns) { run.special -= 5; run.mound = (run.mound || 0) + 1; lines.push(finishActivity(run, `Your ${G.kind(run).camp} grows (level ${run.mound}): more room for everyone.`, true)); }
    if (act.id === 'tend') {
      G.spendFood(run, 1); run.special = (addSpecial(run, 2), run.special);
      lines.push({ t: 'Tending the gardens: +2 Growth, −1 Food', good: true });
      if (act.turns >= a.turns) { run.blightSafeUntil = run.turn + 12; lines.push(finishActivity(run, 'The gardens are weeded and healthy. Blight cannot strike for 12 turns.', true)); }
    }
  }
  function societyActivityTurn(run, act, t, lines) {
    const a = G.ACTIVITY[act.id];
    if (act.id === 'found') {
      lines.push({ t: `Settlers on the road (${act.turns}/${a.turns})` });
      if (act.turns >= a.turns) {
        const settlers = Math.round(run.pop * 0.2); run.pop -= settlers; G.spendFood(run, 6);
        const name = settlementName(run); run.settlements.push({ name, size: 1 });
        G.addSocDeed(run, 'sd_new_settlement');
        lines.push(finishActivity(run, `${settlers} settlers founded ${name}, a new ${G.socKind(run).settlement}.`, true));
      }
    }
    if (act.id === 'build' && act.turns >= a.turns - (run.socType === 'settle' ? 1 : 0)) {
      const st = run.settlements.slice().sort((x, y) => x.size - y.size)[0];
      if ((run.special || 0) >= 4) run.special -= 4; else G.spendFood(run, 6);
      st.size += 1;
      if (st.size >= 4) G.addSocDeed(run, 'sd_great_works');
      lines.push(finishActivity(run, `${st.name} has grown (size ${st.size}).`, true));
    }
    if (act.id === 'gift' && act.turns >= a.turns) {
      G.spendFood(run, 3); const g = 15 + (G.hasFlag(run, 'messengers') ? 5 : 0) + (G.hasFlag(run, 'guests') ? 5 : 0);
      t.opinion = clamp(t.opinion + g, -100, 100);
      lines.push(finishActivity(run, `The ${t.name} accept your gifts: opinion +${g}.`, true));
    }
    if (act.id === 'trade') {
      if (t.opinion < 0) { lines.push(finishActivity(run, `The ${t.name} will no longer trade with you.`, false)); return; }
      G.addFood(run, 1 + (G.hasFlag(run, 'open') ? 1 : 0)); gainDna(run, 1); t.opinion = clamp(t.opinion + 1, -100, 100); G.addSocDeed(run, 'sd_market');
      lines.push({ t: `Trading with the ${t.name}: +${1 + (G.hasFlag(run, 'open') ? 1 : 0)} Food, +1 Influence`, good: true });
    }
    if (act.id === 'raid' && act.turns >= a.turns) {
      const win = G.stat(run, 'str') + rand() * 6 > G.speciesStat(t, 'str') + Math.floor(G.harsh(run) / 2) + rand() * 6;
      t.opinion = clamp(t.opinion - 25, -100, 100);
      // Breaking a treaty: every people hears of it, and nobody forgets.
      if (t.treaty) { t.treaty = false; t.opinion = clamp(t.opinion - 35, -100, 100); G.remember(t, 'betrayed'); run.species.forEach((x) => { if (x.band && !x.extinct && x !== t) x.opinion = clamp(x.opinion - 15, -100, 100); }); G.addSocDeed(run, 'sd_betrayal'); lines.push({ t: `You broke your treaty with the ${t.name}. Every people in the region heard of it.`, bad: true }); }
      if (win) { G.addSocDeed(run, 'sd_war_epic'); G.addRenDeed(run, 'rd_war'); }
      if (win) { run.bandWins = (run.bandWins || 0) + 1; G.addFood(run, 5, 'meat'); gainDna(run, run.socType === 'conquer' ? 5 : 2); t.pop = Math.max(0, t.pop - t.cap * 0.1); lines.push(finishActivity(run, `The raid on the ${t.name} brought back food and glory.`, true)); }
      else lines.push(finishActivity(run, `The raid on the ${t.name} failed: −${damage(run, 2)} people.`, false));
    }
    if (act.id === 'patronize') {
      if (act.turns === 1) run.special = Math.max(0, (run.special || 0) - 5);
      gainDna(run, 2); lines.push({ t: 'Your patrons pay for genius: +2 Learning', good: true });
      if (act.turns >= a.turns) { G.addRenDeed(run, 'rd_patron'); lines.push(finishActivity(run, 'A generation of artists and thinkers, paid for by your nation.', true)); }
    }
    if (act.id === 'voyage' && act.turns >= a.turns) {
      G.spendFood(run, 4); gainDna(run, 6); G.addRenDeed(run, 'rd_voyage');
      lines.push(finishActivity(run, 'Your ships come back from beyond the known coasts: +6 Learning.', true));
    }
    if (act.id === 'league' && act.turns >= a.turns) {
      t.league = true; t.treaty = true; t.opinion = clamp(t.opinion + 10, -100, 100); G.remember(t, 'treaty'); G.addRenDeed(run, 'rd_league');
      lines.push(finishActivity(run, `The ${t.name} join your league.`, true));
    }
    if (act.id === 'treaty' && act.turns >= a.turns) {
      t.treaty = true; t.opinion = clamp(t.opinion + 10, -100, 100); G.remember(t, 'treaty'); G.addSocDeed(run, 'sd_treaty');
      lines.push(finishActivity(run, `A treaty with the ${t.name}: neither people will ever raid the other.`, true));
    }
    if (act.id === 'marry' && act.turns >= a.turns) {
      t.married = true; t.opinion = clamp(t.opinion + 25, -100, 100); G.remember(t, 'married'); G.addSocDeed(run, 'sd_marriage');
      run.species.forEach((x) => { if (x.band && !x.extinct && x !== t && x.opinion > 0) x.opinion = clamp(x.opinion + 5, -100, 100); });
      lines.push(finishActivity(run, `A marriage binds your ruling family to the ${t.name}: opinion +25.`, true));
    }
  }
  // Ancestral Wisdom that every Tribe starts with.
  function tribeStart(run) {
    run.dna = 0; run.totalDna = 0; run.draftsTaken = 0; run.finaleRetryAt = 0; run.finaleTries = 0;
    run.discoveries = []; run.special = 3 * G.boonLevel('w_keepers'); run.specialOn = false; run.gear = 0; run.mound = 0; run.totem = null;
    run.caste = 'workers'; run.blightSafeUntil = 0; run.lastStandUsed = false; run.songSafe = false;
    if (G.boonLevel('w_stories')) gainDna(run, 6 * G.boonLevel('w_stories'));
    if (G.boonLevel('w_ways')) { const opts = discoveryOptions(run); if (opts.length) run.discoveries.push(pick(opts)); }
    run.grafts = []; run.deeds = [];
    if (G.boonLevel('w_deeds')) G.addDeed(run, pick(Object.keys(G.DEEDS).filter((k) => k !== 'deed_near_end')));
  }
  G.setCaste = function (id) {
    const run = G.run;
    if (!run || run.stage !== 'tribe' || run.path !== 'swarm' || !G.CASTES[id] || run.caste === id) return;
    if (run.turn < (run.casteReadyAt || 0)) return;
    run.caste = id; run.casteReadyAt = run.turn + 6;
    log(run, `The ${G.ruler(run).toLowerCase()} raised a brood of ${G.CASTES[id].name.toLowerCase()}.`);
    G.saveRun();
  };
  // Your kind becomes a people: the Creature stage's ending is a checkpoint, and the Tribe stage begins.
  // A tree page of the Book, frozen as it stood when its stage ended.
  G.freezeMind = (run) => ({ seen: G.INNOVATIONS.filter((inv) => G.innovationVisible(run, inv)).map((inv) => inv.id), known: run.innovations.slice(), path: run.path, habitat: run.habitat, temper: G.temperament(run).id, leaning: G.leaning(run), memories: (run.memories || []).slice() });
  function becomeTribe(run) {
    run.book = run.book || {};
    run.book.mind = G.freezeMind(run);
    checkpoint(run);
    const hab = run.habitat === 'sea' ? 'sea' : 'land';
    run.stage = 'tribe'; run.stageTurn = 1; run.eraTurn = 1;
    tribeStart(run);
    run.leader = newLeader(run); startReign(run, run.leader); run.needLeader = false;
    run.activity = null; run.chains = []; run.fascination = null; run.hunger = 0;
    run.pop = G.maxPop(run);
    run.evolved = { tribe: true, kind: G.kind(run).name, ending: G.endingName(run) };
    run.notices = [];
    log(run, `${G.endingName(run)}: your kind becomes a ${G.kind(run).band}, led by ${G.leaderTitle(run.leader)}.`);
    run.phase = 'evolved';
    saveStageStart(run);
  }
  // Stage Select: the start of each Tribe you have reached is kept, one per kind, so a new run can begin there.
  function saveStageStart(run) {
    const m = G.meta; const key = `${run.path}|${run.habitat === 'sea' ? 'sea' : 'land'}${G.civ(run) ? `|${run.stage}` : ''}`;
    const snap = JSON.parse(JSON.stringify(run));
    snap.log = snap.log.slice(0, 25); snap.notices = []; snap.lastTurn = null; snap.event = null; snap.scene = null; snap.draft = null; snap.result = null;
    m.stageStarts = (m.stageStarts || []).filter((x) => x.key !== key);
    m.stageStarts.unshift({ key, stage: run.stage, date: Date.now(), archetype: run.archetype, ending: run.stage === 'renaissance' ? G.societyEndingName(run) : run.stage === 'society' ? G.tribeEndingName(run) : G.endingName(run), kind: run.stage === 'society' ? G.socKind(run).name : G.kind(run).name, body: G.bodyOf(run), run: snap });
    G.saveMeta();
  }
  G.stageStarts = () => G.meta.stageStarts || [];
  G.startFromStage = function (key) {
    const m = G.meta; const st = G.stageStarts().find((x) => x.key === key);
    if (!st) return false;
    const run = G.migratePop(JSON.parse(JSON.stringify(st.run)));
    run.fromStage = true; run.checkpointGenes = 0;
    run.knownEvos = m.codex.evolutions.slice();
    run.baseMaxPop = G.BASE_POP + G.boonLevel('hardy');
    run.baseFoodCap = G.FOOD_CAP + 2 * G.boonLevel('pantry');
    run.secondChanceUsed = false; run.power = G.power();
    run.result = null; run.phase = 'evolved';
    if (run.stage === 'renaissance') renaissanceStart(run); else if (run.stage === 'society') societyStart(run); else tribeStart(run);
    run.notices = [`Stage Select: your ${st.kind} begins again, from ${st.ending}.`];
    m.stats.runs += 1;
    G.run = run;
    save();
    return true;
  };
  // Reaching a Creature ending pays out like a win, even if the Tribe stage then goes badly.
  function checkpoint(run) {
    const m = G.meta;
    const base = Math.floor(run.totalDna / 3);
    const progress = (run.multicellular ? 5 : 0) + 10 + (run.era >= 2 ? 5 : 0) + (run.era >= 3 ? 10 : 0);
    const endKey = run.legacy && !G.LEGACIES[run.legacy].old ? `${run.legacy}|${G.temperament(run).id}` : null;
    const firstEnding = endKey && !(m.codex.endings || []).includes(endKey) ? 10 : 0;
    const mult = (1 + 0.25 * run.hostility) * (run.revived ? G.REVIVE_MULT : 1);
    const genes = Math.round((base + progress + 40 + firstEnding) * mult);
    m.genes += genes; m.stats.wins += 1;
    m.maxHostility = Math.max(m.maxHostility, Math.min(G.MAX_HOSTILITY, run.hostility + 1));
    if (run.legacy) addUnique(m.codex.legacies, run.legacy);
    if (endKey) addUnique(m.codex.endings = m.codex.endings || [], endKey);
    run.checkpointGenes = genes;
    run.notices.push(`${G.endingName(run)}: +${genes} Genetic Memory, kept whatever happens next.`);
    G.saveMeta();
  }
  // ---------- The Society stage (Update 16) ----------
  G.popWord = (run) => (G.civ(run) ? 'people' : run.stage === 'tribe' ? 'members' : 'Population');
  G.dnaWord = (run) => (run.stage === 'renaissance' ? 'Learning' : run.stage === 'society' ? 'Influence' : run.stage === 'tribe' ? 'Ideas' : 'DNA');
  G.socKind = (run) => G.SOCIETY_KINDS[run.path] && G.SOCIETY_KINDS[run.path][run.habitat === 'sea' ? 'sea' : 'land'];
  G.hasFlag = (run, flag) => G.civ(run) && (run.traditions || []).some((id) => G.TRADITION[id] && G.TRADITION[id].flag === flag);
  G.mythName = (run) => run.myth || 'The First Days';
  G.renaissanceEndingName = (run) => { const e = run.renaissanceEnding && G.RENAISSANCE_ENDINGS[run.renaissanceEnding]; return e ? e.name : ''; };
  G.civEndingName = (run) => (run.stage === 'renaissance' ? G.renaissanceEndingName(run) : G.societyEndingName(run));
  G.societyEndingName = (run) => { const e = run.societyEnding && G.SOCIETY_ENDINGS[run.path] && G.SOCIETY_ENDINGS[run.path][run.habitat === 'sea' ? 'sea' : 'land'][run.societyEnding]; return e ? e.name : ''; };
  function settlementName(run) {
    const A = G.SETTLEMENT_SYLLABLES; let n; let guard = 0;
    do { n = pick(A.a) + pick(A.b); } while ((run.settlements || []).some((x) => x.name === n) && guard++ < 30);
    return n;
  }
  function newCouncillor(run, role) {
    const l = newLeader(run);
    return { name: l.name, traits: l.traits.slice(0, 1), role, loyalty: 10 + Math.floor(rand() * 30) + 15 * G.boonLevel('h_council') };
  }
  // Everything the Society stage adds: your kind of society, your traditions, your council and your founding myth.
  function societyMods(run) {
    const list = [];
    const st = G.SOCIETY_TYPES[run.socType]; if (st) list.push(tag(st.mods, st.name));
    list.push(tag({ cha: 1 }, 'Founding myth'));
    (run.socBoons || []).forEach((m) => list.push(m));
    (run.traditions || []).forEach((id) => { if (G.TRADITION[id]) list.push(tag(G.TRADITION[id].mods, G.TRADITION[id].name)); });
    (run.discoveries || []).forEach((id) => { const d = G.DISCOVERY[id]; if (d && d.inherit) list.push(tag(d.inherit, `Inheritance: ${G.loreName(d, run)}`)); });
    if (run.stage === 'society') G.HERITAGE.forEach((h) => { const lvl = G.boonLevel(h.id); if (h.mods && lvl) { const m = {}; Object.entries(h.mods).forEach(([k, v]) => { m[k] = v * lvl; }); list.push(tag(m, `Heritage: ${h.name}`)); } });
    // A councillor who has turned against the ruler gives nothing.
    (run.council || []).forEach((c) => { if (c.loyalty > -30) { list.push(tag(G.COUNCIL_ROLES[c.role].mods, `Council: ${G.COUNCIL_ROLES[c.role].name}`)); c.traits.forEach((t) => list.push(tag(G.LEADER_TRAITS[t].mods, `Council: ${c.name}`))); } });
    // Allies share their food.
    const allies = run.species.filter((x) => x.band && !x.extinct && x.opinion >= 60).length;
    if (allies) list.push(tag({ foodPerTurn: Math.min(2, allies) }, 'Allied peoples'));
    return list;
  }
  G.influencePerTurn = (run) => Math.max(1, Math.floor((run.settlements || []).reduce((t, x) => t + x.size, 0) / 6) + G.mod(run, 'influencePerTurn') + G.mod(run, 'dnaPerTurn') + Math.trunc(G.mod(run, 'ideasPerTurn') / 2) + (run.instinct === 'explore' ? 1 + Math.ceil(G.mod(run, 'exploreBonus') / 2) : 0));
  // One generation of society: the council's loyalty shifts, and grudges may become plots.
  function societyTurn(run, lines) {
    if ((run.council || []).length && run.council.every((c) => c.loyalty >= 40)) G.addSocDeed(run, 'sd_golden_age');
    if (run.species.some((x) => x.band && !x.extinct && x.opinion >= 60)) G.addSocDeed(run, 'sd_ally');
    const ruler = run.leader;
    (run.council || []).forEach((c, i) => {
      // Councillors grow more ambitious every generation, unless something holds them.
      const pull = -1 - (rand() < 0.5 ? 1 : 0) + (ruler && ruler.traits.includes('kind') ? 1 : 0) + (ruler && ruler.traits.includes('cruel') ? -1 : 0) + (G.hasFlag(run, 'loyal') ? 1 : 0);
      c.loyalty = clamp(c.loyalty + pull + Math.round((rand() - 0.5) * 6), -100, 100);
      if (c.loyalty < -25 && run.plot == null && rand() < 0.3) { run.plot = i; run.notices.push(`${G.COUNCIL_ROLES[c.role].name} ${c.name} is plotting against your ruler.`); }
    });
  }
  // Traditions on offer: 1 of 3 (or 4). Tiers open as you learn more; a chosen tradition locks out its opposite.
  // ---------- The Law tree (Update 19) ----------
  // Your Disposition: Peaceful, Territorial or Warmongering, from your leaning; fixed at the Union.
  G.disposition = (run) => {
    if (run.disposition) return run.disposition;
    const l = G.leaning(run);
    const best = Math.max(l.peace, l.guard, l.war);
    if (!best) return 'guard';
    return l.guard === best ? 'guard' : l.war === best ? 'war' : 'peace';
  };
  const lawFits = (run, t) => (!t.path || t.path === run.path) && (!t.habitat || t.habitat === (run.habitat === 'sea' ? 'sea' : 'land')) && (!t.society || t.society === run.socType);
  G.lawVisible = (run, t) => {
    if ((run.traditions || []).includes(t.id)) return true;
    if (!lawFits(run, t)) return false;
    switch (t.law) {
      case 'founding': return true;
      case 'law': return (run.lawGrafts || []).includes(t.id);
      case 'council': return (run.council || []).some((c) => c.role === t.role && c.loyalty > -30);
      case 'faith': return !!run.faith && (!t.faith || t.faith === run.faith.kind);
      case 'culture': case 'neighbours': return (run.socDeeds || []).includes(t.when.deed);
      case 'gate': return true;
      case 'beyond': return t.disposition === G.disposition(run);
      default: return false;
    }
  };
  G.lawKnown = (run) => (run.traditions || []).filter((id) => G.TRADITION[id] && G.TRADITION[id].law !== 'gate').length;
  G.unionNeed = () => Math.max(4, G.UNION_NEED - 2 * G.boonLevel('h_union'));
  G.lawAvailable = (run, t) => {
    const known = run.traditions || [];
    if (known.includes(t.id)) return { ok: false, reason: 'Known' };
    if (!G.lawVisible(run, t)) return { ok: false, hidden: true, reason: 'Not in your tree' };
    const blocker = known.find((id) => t.excl === id || (G.TRADITION[id] && G.TRADITION[id].excl === t.id));
    if (blocker) return { ok: false, blocked: true, reason: `Ruled out by ${G.TRADITION[blocker].name}` };
    const n = G.lawKnown(run);
    if (t.law === 'law' && t.tier === 2 && n < 2) return { ok: false, reason: 'Needs 2 Law ideas known first' };
    if (t.law === 'law' && t.tier === 3 && n < 4) return { ok: false, reason: 'Needs 4 Law ideas known first' };
    if (t.law === 'faith' && t.tier === 2 && !known.some((id) => G.TRADITION[id] && G.TRADITION[id].law === 'faith')) return { ok: false, reason: 'Needs one faith idea first' };
    if (t.law === 'gate') {
      const goal = G.goals(run).evolveAt;
      if (run.dna < goal) return { ok: false, reason: `Needs ${goal} Influence (you have ${run.dna})` };
      if (n < G.unionNeed()) return { ok: false, reason: `Needs ${G.unionNeed()} Law ideas known (you have ${n})` };
    }
    const r = t.req || {};
    if (r.known && n < r.known) return { ok: false, reason: `Needs ${r.known} Law ideas known (you have ${n})` };
    if (t.law === 'beyond' && known.includes('union_gate')) return { ok: false, reason: 'Too late: the region is already one' };
    return { ok: true };
  };
  const LAW_BASE = { founding: 6, council: 8, faith: 8, culture: 10, neighbours: 10, gate: 15, beyond: 26 };
  G.lawCost = (run, id) => {
    const t = G.TRADITION[id]; if (!t || run.stage !== 'society') return 0;
    const base = t.law === 'law' ? [0, 6, 9, 12][t.tier] || 9 : (LAW_BASE[t.law] || 7) + (t.law === 'faith' && t.tier === 2 ? 2 : 0);
    const pct = clamp(G.discoveryCostPct(run) + 10 * G.boonLevel('w_lore') - 10 * G.boonLevel('h_law'), -60, 100);
    // Every law your people already hold makes the next one harder to agree on (+6% each).
    const agree = t.law === 'gate' ? 1 : 1 + 0.06 * G.lawKnown(run);
    return costRound(base * (1 + pct / 100) * agree * (t.law === 'beyond' ? 1 - 0.15 * G.boonLevel('h_beyond') : 1));
  };
  G.learnLaw = function (id) {
    const run = G.run; const t = G.TRADITION[id];
    if (!run || run.stage !== 'society' || run.phase === 'end' || !t || !G.lawAvailable(run, t).ok) return;
    const cost = G.lawCost(run, id);
    if (cost > (run.special || 0)) return;
    const held = holdScreen(run);
    run.special -= cost;
    run.draft = { options: [id], source: 'law' };
    learnTradition(run, id);
    resumeScreen(run, held, t.name);
  };
  // Deeds of a Society: they graft Culture and Neighbours ideas onto the Law tree.
  G.addSocDeed = (run, id) => {
    if (!run || run.stage !== 'society' || !G.SOC_DEEDS[id]) return;
    run.socDeeds = run.socDeeds || [];
    if (run.socDeeds.includes(id)) return;
    run.socDeeds.push(id);
    const t = G.TRADITIONS.find((x) => x.when && x.when.deed === id);
    if (t) run.notices.push(`A deed remembered: ${G.SOC_DEEDS[id]} Your Law tree grows a new idea: ${t.name}.`);
  };
  // A faith built from your history: your totem, the enemy you never forgave, or what your kind once was.
  function makeFaith(run) {
    const totem = run.totem && run.species.find((x) => x.name === run.totem);
    if (totem) return { kind: 'totem', of: totem.name, name: G.FAITH_KINDS.totem.name(totem.name) };
    const foe = run.species.filter((x) => x.nemesis || G.grudge(x) <= -20).sort((a, b) => G.grudge(a) - G.grudge(b))[0];
    if (foe) return { kind: 'nemesis', of: foe.from || foe.name, name: G.FAITH_KINDS.nemesis.name(foe.from || foe.name) };
    const of = `the ${G.ARCHETYPE[run.archetype].name.replace(/^The /, '')}s`;
    return { kind: 'ancestor', of, name: G.FAITH_KINDS.ancestor.name(of) };
  }
  // ---------- The Renaissance and its Reason tree (Update 20) ----------
  G.nationName = (run) => { const n = G.NATION_NAMES[run.path] && G.NATION_NAMES[run.path][run.habitat === 'sea' ? 'sea' : 'land']; return n || 'the Nation'; };
  const reasonFits = (run, x) => !x.path || x.path === run.path;
  G.reasonVisible = (run, x) => {
    if ((run.reason || []).includes(x.id)) return true;
    if (!reasonFits(run, x)) return false;
    switch (x.band) {
      case 'inherit': return x.road === run.societyEnding;
      case 'people': return true;
      case 'invention': return (run.reasonGrafts || []).includes(x.id) && (!x.disposition || x.disposition.includes(G.disposition(run)));
      case 'movement': return true;
      case 'faith': return !!run.schism && x.schism === run.schism;
      case 'deed': return (run.renDeeds || []).includes(x.when.deed);
      case 'gate': return true;
      case 'beyond': return x.disposition === G.disposition(run);
      default: return false;
    }
  };
  G.reasonKnown = (run) => (run.reason || []).filter((id) => G.REASON_ID[id] && G.REASON_ID[id].band !== 'gate').length;
  G.sailNeed = () => Math.max(5, G.SAIL_NEED - 2 * G.boonLevel('p_sail'));
  G.reasonAvailable = (run, x) => {
    const known = run.reason || [];
    if (known.includes(x.id)) return { ok: false, reason: 'Known' };
    if (!G.reasonVisible(run, x)) return { ok: false, hidden: true, reason: 'Not in your tree' };
    const blocker = known.find((id) => x.excl === id || (G.REASON_ID[id] && G.REASON_ID[id].excl === x.id));
    if (blocker) return { ok: false, blocked: true, reason: `Ruled out by ${G.loreName(G.REASON_ID[blocker], run)}` };
    const n = G.reasonKnown(run);
    if (x.tier === 2 && x.band !== 'deed' && x.band !== 'faith' && n < 2) return { ok: false, reason: 'Needs 2 Reason ideas known first' };
    if (x.tier === 3 && x.band === 'invention' && n < 5) return { ok: false, reason: 'Needs 5 Reason ideas known first' };
    if (x.band === 'gate') {
      const goal = G.goals(run).evolveAt;
      if (run.dna < goal) return { ok: false, reason: `Needs ${goal} Learning (you have ${run.dna})` };
      if (n < G.sailNeed()) return { ok: false, reason: `Needs ${G.sailNeed()} Reason ideas known (you have ${n})` };
    }
    const r = x.req || {};
    if (r.known && n < r.known) return { ok: false, reason: `Needs ${r.known} Reason ideas known (you have ${n})` };
    if (x.band === 'beyond' && known.includes('sail_gate')) return { ok: false, reason: 'Too late: your ships have already sailed' };
    return { ok: true };
  };
  const REASON_BASE = { inherit: 6, people: 7, movement: 8, faith: 8, deed: 10, gate: 16, beyond: 28 };
  G.reasonCost = (run, id) => {
    const x = G.REASON_ID[id]; if (!x || run.stage !== 'renaissance') return 0;
    const base = x.band === 'invention' ? [0, 7, 10, 13][x.tier] || 10 : (REASON_BASE[x.band] || 9) + (x.band === 'people' && x.tier === 2 ? 3 : 0);
    const pct = clamp(G.discoveryCostPct(run) + 10 * G.boonLevel('w_lore') - 10 * G.boonLevel('p_reason'), -60, 100);
    const agree = x.band === 'gate' ? 1 : 1 + 0.08 * G.reasonKnown(run);
    return costRound(base * (1 + pct / 100) * agree * (x.band === 'beyond' ? 1 - 0.15 * G.boonLevel('p_beyond') : 1));
  };
  function learnReason(run, id) {
    const x = G.REASON_ID[id];
    addUnique(run.reason = run.reason || [], id);
    if (run.reasonGrafts) run.reasonGrafts = run.reasonGrafts.filter((y) => y !== id);
    addUnique(G.meta.codex.reason = G.meta.codex.reason || [], id);
    log(run, `Reason: ${G.loreName(x, run)}.${x.excl ? ` (${G.loreName(G.REASON_ID[x.excl], run)} is no longer possible.)` : ''}`);
    if (id === 'sail_gate') { run.disposition = G.disposition(run); run.book = run.book || {}; run.book.reason = { seen: G.REASON.filter((y) => G.reasonVisible(run, y)).map((y) => y.id), known: run.reason.slice(), leaning: G.leaning(run), disposition: run.disposition }; }
    if (!run.draft || !run.draft.source) run.draftsTaken += 1;
    run.draft = null;
    run.scene = { title: 'Reason', label: `Your nation takes up ${G.loreName(x, run)}`, text: '', lines: [], anim: 'mutate', mood: 'proud', mutation: true, reason: id };
    run.phase = 'mutated';
    save();
  }
  G.learnReason = function (id) {
    const run = G.run; const x = G.REASON_ID[id];
    if (!run || run.stage !== 'renaissance' || run.phase === 'end' || !x || !G.reasonAvailable(run, x).ok) return;
    const cost = G.reasonCost(run, id);
    if (cost > (run.special || 0)) return;
    const held = holdScreen(run);
    run.special -= cost;
    run.draft = { options: [id], source: 'reason' };
    learnReason(run, id);
    resumeScreen(run, held, G.loreName(x, run));
  };
  function reasonOptions(run) {
    const known = run.reason || []; const n = known.length;
    let pool = G.REASON.filter((x) => x.band === 'invention' && !known.includes(x.id) && !(run.reasonGrafts || []).includes(x.id) && (!x.disposition || x.disposition.includes(G.disposition(run))) && (x.tier === 1 || (x.tier === 2 && n >= 2) || (x.tier === 3 && n >= 5)));
    const out = []; const k = (G.meta.boons.choice ? 4 : 3) + G.boonLevel('p_branches');
    while (out.length < k && pool.length) { const x = weightedPick(pool, (y) => (y.tier > 1 ? 1.3 : 1) * (y.disposition ? 1.5 : 1)); out.push(x.id); pool = pool.filter((y) => y.id !== x.id); }
    return out;
  }
  G.addRenDeed = (run, id) => {
    if (!run || run.stage !== 'renaissance' || !G.REN_DEEDS[id]) return;
    run.renDeeds = run.renDeeds || [];
    if (run.renDeeds.includes(id)) return;
    run.renDeeds.push(id);
    const x = G.REASON.find((y) => y.when && y.when.deed === id);
    if (x) run.notices.push(`A deed remembered: ${G.REN_DEEDS[id]} Your Reason tree grows a new idea: ${G.loreName(x, run)}.`);
  };
  function renaissanceMods(run) {
    const list = [];
    (run.reason || []).forEach((id) => { const x = G.REASON_ID[id]; if (x) list.push(tag(x.mods, `Reason: ${G.loreName(x, run)}`)); });
    (run.traditions || []).forEach((id) => { const t = G.TRADITION[id]; if (t && t.inherit) list.push(tag(t.inherit, `Inheritance: ${t.name}`)); });
    G.PATRONAGE.forEach((h) => { const lvl = G.boonLevel(h.id); if (h.mods && lvl) { const m = {}; Object.entries(h.mods).forEach(([k, v]) => { m[k] = v * lvl; }); list.push(tag(m, `Patronage: ${h.name}`)); } });
    return list;
  }
  // Neighbour peoples become nations: each takes a Disposition from what it remembers of you.
  function makeNations(run) {
    // Stage Select restarts from a saved dawn, where the nations already exist.
    run.species.filter((x) => x.band && !x.extinct && !x.nation).forEach((b) => {
      b.nation = true;
      // New nations, new ambitions: old friendships count for half.
      b.opinion = Math.round(b.opinion / 2) - 10;
      const mine = run.disposition || G.disposition(run);
      const g = G.grudge(b) + b.opinion + (mine === 'war' ? -15 : mine === 'peace' ? 5 : 0);
      b.nationDisp = g >= 20 ? 'peace' : g <= -5 ? 'war' : 'guard';
      b.pop = Math.max(b.pop, 18); b.cap = Math.max(b.cap, 26);
      b.opinion = clamp(b.opinion + 15 * G.boonLevel('p_envoys'), -100, 100);
    });
  }
  // Nations change their minds, and warlike nations invade: a share of your people, not a handful.
  function nationsTurn(run, lines) {
    const allies = run.species.filter((x) => x.nation && !x.extinct && x.league).length;
    run.species.filter((x) => x.nation && !x.extinct).forEach((b) => {
      const was = b.nationDisp;
      if (b.opinion <= -25 && b.nationDisp !== 'war') b.nationDisp = b.nationDisp === 'peace' ? 'guard' : 'war';
      else if (b.opinion >= 45 && b.nationDisp === 'war') b.nationDisp = 'guard';
      else if (b.opinion >= 70 && b.nationDisp === 'guard') b.nationDisp = 'peace';
      if (b.nationDisp !== was) { b.opinion = clamp(b.opinion + (b.nationDisp === 'war' ? 0 : 10), -100, 100); lines.push({ t: `The ${b.name} are now ${G.LEAN_NAMES[b.nationDisp].toLowerCase()}`, bad: b.nationDisp === 'war' }); log(run, `The ${b.name} became ${G.LEAN_NAMES[b.nationDisp].toLowerCase()}.`); }
      if (b.nationDisp !== 'war' || b.treaty || b.league || b.opinion >= 0 || run.pop <= 0) return;
      // Their armies keep pace with the age; yours are your Strength and Toughness, and your league.
      const atk = G.speciesStat(b, 'str') + G.wildEdge(run) + Math.floor(run.stageTurn / 6);
      const def = G.stat(run, 'str') + Math.floor(G.stat(run, 'tou') / 2) + G.mod(run, 'damageReduce');
      if (rand() >= clamp(G.INVASION + 0.02 * (atk - def) + run.stageTurn / 120, 0.04, 0.45)) return;
      G.remember(b, 'attacked');
      const hold = clamp(0.55 + 0.06 * (def - atk) + 0.15 * allies, 0.1, 0.9);
      if (rand() < hold) {
        b.opinion = clamp(b.opinion + 10, -100, 100); gainDna(run, 3); G.addRenDeed(run, 'rd_war');
        lines.push({ t: `War! The ${b.name} invade, and your armies drive them back${allies ? ', with your league beside you' : ''} (+3 Learning)`, good: true });
        log(run, `The ${b.name} invaded and were driven back.`);
        return;
      }
      const n = Math.max(1, Math.round(run.pop * 0.1)); run.pop -= n;
      const list = run.settlements || [];
      const city = list.length > 1 ? list.slice(1).sort((p, q) => p.size - q.size)[0] : list[0];
      if (city) run.settlements = list.filter((x) => x !== city);
      lines.push({ t: `War! The ${b.name} invade and take ${city ? city.name : 'your land'}: −${n} ${G.popWord(run)}${run.settlements.length ? `, ${run.settlements.length} ${G.socKind(run).settlement}${run.settlements.length === 1 ? '' : 's'} left` : ''}`, bad: true });
      log(run, `The ${b.name} invaded and took ${city ? city.name : 'your land'}.`);
      if (!run.settlements.length) { run.conquered = b.name; run.pop = 0; }
    });
  }
  function renaissanceStart(run) {
    run.dna = 0; run.totalDna = 0; run.draftsTaken = 0; run.finaleRetryAt = 0; run.finaleTries = 0;
    run.reason = []; run.reasonGrafts = []; run.renDeeds = []; run.schism = null; run.plot = null;
    run.specialOn = true;
    if (G.boonLevel('p_libraries')) gainDna(run, 10 * G.boonLevel('p_libraries'));
    if (G.boonLevel('p_wealth') && !run.fromStage) run.special = Math.min(G.SPECIAL_HARD, (run.special || 0) + 6 * G.boonLevel('p_wealth'));
    if (G.boonLevel('p_masters')) { const opts = reasonOptions(run); if (opts.length) run.reason.push(pick(opts)); }
    makeNations(run);
    // The Union fixed who you were; the new age lets that shift again until the ships sail.
    if (run.disposition) { run.unionDisposition = run.disposition; run.disposition = null; }
  }
  function becomeRenaissance(run) {
    stageCheckpoint(run);
    run.stage = 'renaissance'; run.stageTurn = 1; run.eraTurn = 1;
    renaissanceStart(run);
    run.needLeader = !run.leader; run.activity = null; run.chains = [];
    if (run.food < 10) G.addFood(run, 10 - run.food);
    run.evolved = { renaissance: true, kind: G.nationName(run), ending: G.societyEndingName(run) };
    run.notices = [];
    log(run, `${G.societyEndingName(run)}: the region becomes ${G.nationName(run)}, and a new age begins.`);
    run.phase = 'evolved';
    saveStageStart(run);
  }
  function traditionOptions(run) {
    const known = run.traditions || []; const hab = run.habitat === 'sea' ? 'sea' : 'land';
    const locked = new Set(known.map((id) => G.TRADITION[id] && G.TRADITION[id].excl).filter(Boolean));
    const n = known.length;
    let pool = G.TRADITIONS.filter((t) => t.law === 'law' && !known.includes(t.id) && !(run.lawGrafts || []).includes(t.id) && !locked.has(t.id) && (t.tier === 1 || (t.tier === 2 && n >= 2) || (t.tier === 3 && n >= 4))
      && (!t.path || t.path === run.path) && (!t.habitat || t.habitat === hab) && (!t.society || t.society === run.socType));
    const out = []; const k = (G.meta.boons.choice ? 4 : 3) + G.boonLevel('h_branches');
    while (out.length < k && pool.length) { const t = weightedPick(pool, (x) => (x.path ? 1.5 : 1) * (x.tier > 1 ? 1.3 : 1)); out.push(t.id); pool = pool.filter((x) => x.id !== t.id); }
    return out;
  }
  function learnTradition(run, id) {
    const t = G.TRADITION[id];
    if (!run.traditions.includes(id)) run.traditions.push(id);
    addUnique(G.meta.codex.traditions = G.meta.codex.traditions || [], id);
    log(run, `Law: ${t.name}.${t.excl ? ` (${G.TRADITION[t.excl].name} is no longer possible.)` : ''}`);
    if (run.lawGrafts) run.lawGrafts = run.lawGrafts.filter((x) => x !== id);
    if (id === 'union_gate') { run.disposition = G.disposition(run); run.book = run.book || {}; run.book.law = { seen: G.TRADITIONS.filter((x) => G.lawVisible(run, x)).map((x) => x.id), known: run.traditions.slice(), leaning: G.leaning(run), disposition: run.disposition, faith: run.faith }; }
    if (!run.draft.source) run.draftsTaken += 1;
    run.draft = null;
    run.scene = { title: 'Tradition', label: `Your people adopt ${t.name}`, text: '', lines: [], anim: 'social', mood: 'proud', mutation: true, tradition: id };
    run.phase = 'mutated';
    save();
  }
  // The Founding has been paid out; the Society stage begins.
  function stageCheckpoint(run) {
    const r = stageReward(run, true); const m = G.meta;
    const genes = Math.round((r.base + r.progress + r.winBonus + r.firstEnding) * r.mult);
    m.genes += genes; m.stats.wins += 1;
    if (r.endKey) addUnique(m.codex[r.codexList] = m.codex[r.codexList] || [], r.endKey);
    run.checkpointGenes = (run.checkpointGenes || 0) + genes;
    run.notices.push(`${run.stage === 'society' ? G.societyEndingName(run) : G.tribeEndingName(run)}: +${genes} Genetic Memory, kept whatever happens next.`);
    G.saveMeta();
  }
  function societyStart(run) {
    run.dna = 0; run.totalDna = 0; run.draftsTaken = 0; run.finaleRetryAt = 0; run.finaleTries = 0;
    run.traditions = []; run.socBoons = []; run.plot = null; run.lastStandUsed = false;
    run.lawGrafts = []; run.socDeeds = []; run.disposition = null;
    run.specialOn = true; // a Society always has its people's resource: it pays for Law
    run.faith = makeFaith(run);
    if (G.boonLevel('h_records')) gainDna(run, 8 * G.boonLevel('h_records'));
    if (G.boonLevel('h_faith')) { const first = G.TRADITIONS.find((t) => t.law === 'faith' && t.faith === run.faith.kind && t.tier === 1); if (first) run.traditions.push(first.id); }
    const st = G.SOCIETY_TYPES[run.socType] || G.SOCIETY_TYPES.settle;
    run.settlements = Array.from({ length: st.start + G.boonLevel('h_cities') }, (_, i) => ({ name: i === 0 ? G.socKind(run).capital.replace(/^the /, 'The ') : settlementName(run), size: i === 0 ? 2 : 1 }));
    run.council = ['steward', 'marshal', 'keeper'].map((r) => newCouncillor(run, r));
    // Old rivals become neighbour peoples, with their grudges; new peoples join them until there are three.
    // Grudges soften a little in the generations it takes to become a society.
    run.species.filter((x) => x.band && !x.extinct).forEach((b) => { b.pop = Math.max(b.pop, 14); b.cap = Math.max(b.cap, 20); b.opinion = Math.max(b.opinion, b.nemesis ? -40 : -20); });
    for (let i = 0; i < 3; i++) { const b = makeBand(run, true, 3); if (b) { b.pop = 14; b.cap = 20; b.opinion = clamp(Math.round((rand() - 0.5) * 30), -100, 100); } }
    if (G.boonLevel('h_envoys') && !run.fromStage) run.species.forEach((x) => { if (x.band && !x.extinct) x.opinion = clamp(x.opinion + 15 * G.boonLevel('h_envoys'), -100, 100); });
  }
  function becomeSociety(run) {
    run.book = run.book || {};
    // Until the Lore tree arrives (Update 18), the Tribe's page is its discoveries and its leaders.
    run.book.lore = { discoveries: (run.discoveries || []).slice(), rulers: (run.rulers || []).slice(), legacies: (run.legacies || []).slice(), path: run.path,
      seen: G.DISCOVERIES.filter((d) => G.loreVisible(run, d)).map((d) => d.id), known: (run.discoveries || []).slice(), leaning: G.leaning(run) };
    stageCheckpoint(run);
    run.socType = run.tribeEnding || 'settle';
    run.myth = `The Myth of ${G.endingName(run).replace(/^The /, '')}`;
    run.stage = 'society'; run.stageTurn = 1; run.eraTurn = 1;
    societyStart(run);
    if (!run.leader) run.leader = newLeader(run);
    startReign(run, run.leader);
    run.needLeader = false; run.activity = null; run.chains = [];
    run.pop = G.maxPop(run);
    // The whole people brings its stores into the new settlements.
    if (run.food < 10) G.addFood(run, 10 - run.food);
    run.evolved = { society: true, kind: G.socKind(run).name, ending: G.tribeEndingName(run) };
    run.notices = [];
    log(run, `${G.tribeEndingName(run)}: your ${G.kind(run).band} becomes the ${G.socKind(run).name}, a ${G.SOCIETY_TYPES[run.socType].name.toLowerCase()} people.`);
    run.phase = 'evolved';
    saveStageStart(run);
  }
  G.tribeEndingName = (run) => { const e = run.tribeEnding && G.TRIBE_ENDINGS[run.path] && G.TRIBE_ENDINGS[run.path][run.habitat === 'sea' ? 'sea' : 'land'][run.tribeEnding]; return e ? e.name : ''; };

  // ---------- Mind tree ----------
  G.innovationAvailable = function (run, inv) {
    if (run.innovations.includes(inv.id)) return { ok: false, reason: 'Known' };
    if (!G.innovationVisible(run, inv)) return { ok: false, hidden: true, reason: 'Not on your path' };
    if (G.useless(run, inv)) return { ok: false, hidden: true, reason: 'Of no use to your kind' };
    const knownTier = (t) => run.innovations.some((id) => G.INNOVATION[id] && G.INNOVATION[id].tier === t);
    if (inv.tier === 2 && !knownTier(1)) return { ok: false, reason: 'Needs one of your root ideas first' };
    if (inv.tier === 3 && !knownTier(2)) return { ok: false, reason: 'Needs a home, body or memory idea first' };
    const blocker = run.innovations.find((id) => (inv.excludes || []).includes(id) || (G.INNOVATION[id].excludes || []).includes(inv.id));
    if (blocker) return { ok: false, blocked: true, reason: `Blocked by ${G.INNOVATION[blocker].name}` };
    const r = inv.req || {};
    if (r.tier3 && run.innovations.filter((id) => G.INNOVATION[id].tier === 3).length < r.tier3) return { ok: false, reason: `Needs ${r.tier3} ideas from the third row` };
    if (r.diet && !r.diet.includes(G.diet(run))) return { ok: false, reason: `Only for ${r.diet.map((d) => G.DIET_NAMES[d].toLowerCase()).join(' or ')}s` };
    if (r.stat && G.stat(run, r.stat[0]) < r.stat[1]) return { ok: false, reason: `Needs ${G.STATS.find((x) => x.id === r.stat[0]).name} ${r.stat[1]} (you have ${G.stat(run, r.stat[0])})` };
    if (r.innovation && !r.innovation.some((id) => run.innovations.includes(id))) return { ok: false, reason: `Needs ${r.innovation.map((id) => G.innovationName(G.INNOVATION[id], run)).join(' or ')}` };
    if (r.some) { const have = r.some.filter((id) => run.innovations.includes(id)).length; if (have < r.n) return { ok: false, reason: `Needs ${r.n} of: ${r.some.map((id) => G.innovationName(G.INNOVATION[id], run)).join(', ')} (you have ${have})` }; }
    if (r.trait && !r.trait.some((t) => run.traits.includes(t))) return { ok: false, reason: `Needs a ${r.trait.map((t) => G.TRAITS[t].name).join(', ')} trait` };
    if (r.tag === 'grasp' && !G.hasTag(run, 'grasp')) return { ok: false, reason: 'Needs a part that can grasp' };
    return { ok: true };
  };

  function researchProgress(run) {
    if (!run.mind || !run.fascination) return;
    const inv = G.INNOVATION[run.fascination];
    const cost = G.innovationCost(run, inv);
    if (run.insight >= cost) {
      run.insight -= cost;
      run.innovations.push(inv.id);
      run.fascination = null;
      run.notices.push(`Idea: ${G.innovationName(inv, run)}. ${G.describeMods(inv.mods)}.`);
      log(run, `Your kind discovered ${G.innovationName(inv, run)}.`);
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
    return run.stage === 'creature' && run.mind && !run.fascination && G.INNOVATIONS.some((i) => G.innovationAvailable(run, i).ok);
  }

  // Decide what comes next: a mutation draft, a milestone, a choice of fascination, the finale,
  // a random event (only when time has just passed), or back to the world map.
  // DNA goals for this stage, lowered by the Short Road upgrade.
  G.goals = (run) => {
    const st = G.STAGES[run.stage];
    const k = 1 - 0.08 * G.boonLevel('short_road');
    // A Tribe's first milestone comes straight away; everywhere else goals need at least 1.
    const f = (n) => (n > 0 || !G.people(run) ? Math.max(1, Math.round(n * k)) : 0);
    return { drafts: st.drafts.map(f), milestones: st.milestones.map((m) => ({ ...m, at: f(m.at) })), evolveAt: st.evolveAt && f(st.evolveAt) };
  };

  function nextStep(run, allowEvent) {
    const st = G.goals(run);
    if (run.pendingSpecial && startSpecialDraft(run)) return;
    if (run.draftsTaken < st.drafts.length && run.dna >= st.drafts[run.draftsTaken]) { startDraft(run); return; }
    const ms = st.milestones.find((m) => run.dna >= m.at && !run.milestonesDone.includes(m.event.replace('{path}', run.path)));
    if (ms) { setEvent(run, G.EVENT[ms.event.replace('{path}', run.path)]); return; }
    // A leader has died: choose the next one.
    if (run.stage === 'tribe' && run.needLeader) { run.candidates = Array.from({ length: G.boonLevel('w_choosing') ? 4 : 3 }, () => newLeader(run)); run.needLeader = false; setEvent(run, G.EVENT.succession); return; }
    // In a society, the council chooses from among themselves, or an heir.
    if (G.civ(run) && run.needLeader) { run.candidates = run.council.map((c) => ({ ...c, since: run.turn, life: 14 + Math.floor(rand() * 12) })).concat([newLeader(run)]); run.needLeader = false; setEvent(run, G.EVENT.soc_succession); return; }
    if (G.civ(run) && run.plot != null && run.council[run.plot]) { setEvent(run, G.EVENT.council_plot); return; }
    // Lineages that reached the Spark before Paths existed choose one now.
    if (run.stage === 'creature' && run.mind && !run.path) { setEvent(run, G.EVENT.path_choice); return; }
    if (needsFascination(run)) { run.phase = 'mind'; return; }
    const finaleReady = run.turn >= run.finaleRetryAt && (run.stage === 'creature' ? !!run.path && run.innovations.includes(`${run.path}_cap`) : run.stage === 'tribe' ? run.discoveries.includes('founding_gate') : run.stage === 'renaissance' ? (run.reason || []).includes('sail_gate') : run.stage === 'society' ? run.traditions.includes('union_gate') : run.dna >= st.evolveAt);
    if (finaleReady) {
      const hab = run.habitat === 'sea' ? 'sea' : 'land';
      const id = run.stage === 'cell' ? 'cell_finale' : run.stage === 'renaissance' ? 'sail_finale' : run.stage === 'society' ? `union_${run.path}_${hab}` : run.stage === 'tribe' ? `founding_${run.path}_${hab}` : `finale_${run.path}_${hab}`;
      setEvent(run, G.EVENT[id]);
      return;
    }
    // Story chains: a follow-up event comes due.
    const chain = allowEvent && (run.chains || []).find((c) => run.turn >= c.at);
    if (chain) {
      run.chains = run.chains.filter((c) => c !== chain);
      const idx = chain.species ? run.species.findIndex((x) => x.name === chain.species && !x.extinct) : -1;
      if (!chain.species || idx >= 0) { run.quietTicks = 0; setEvent(run, G.EVENT[chain.id], idx >= 0 ? idx : null); return; }
    }
    // Events pop up at random, more likely the longer it has been quiet.
    if (allowEvent && rand() < 0.38 + 0.2 * run.quietTicks) { run.quietTicks = 0; drawEvent(run); return; }
    if (allowEvent) run.quietTicks += 1;
    run.phase = 'map';
  }

  // ---------- Mutation drafts ----------
  function draftOptions(run) {
    if (run.stage === 'renaissance') return reasonOptions(run);
    if (run.stage === 'society') return traditionOptions(run);
    if (run.stage === 'tribe') return discoveryOptions(run);
    const n = G.meta.boons.choice ? 4 : 3;
    const boost = G.ORIGIN[run.origin].boostKeyword;
    const have = G.partIds(run);
    const empty = G.slotsFor(run).filter((s) => !run.parts[s.id]).map((s) => G.baseSlot(s.id));
    let pool = G.partPool(run).filter((p) => !have.includes(p.id));
    const out = [];
    while (out.length < n && pool.length) {
      const p = weightedPick(pool, (x) => (x.evolved ? (x.limbEvo ? 2 : x.evolved === 2 ? 0.4 : 1) : (x.rarity || 2))
        * (boost && (x.keywords || []).includes(boost) ? 3 : 1)
        * (empty.includes(x.slot) ? 2 : 1)
        * (x.biome ? 3 : 1)
        * G.affinityWeight(x));
      out.push(p.id);
      pool = pool.filter((x) => x.id !== p.id && (out.length >= 2 || x.slot !== p.slot));
    }
    return out;
  }

  function startDraft(run) {
    const options = draftOptions(run);
    // Nothing left to offer (every branch already in the Lore tree): the goal passes with a little food.
    if (!options.length) { run.draftsTaken += 1; G.addFood(run, 3); run.notices.push(run.stage === 'tribe' ? 'Every branch your people could find is already in your Lore tree: +3 Food instead.' : 'Nothing new to choose: +3 Food instead.'); nextStep(run, false); return; }
    run.draft = { options, rerolls: G.meta.boons.reroll ? 1 : 0 };
    run.phase = 'draft';
  }

  G.pickDraft = function (pid, mode, socket) {
    const run = G.run;
    if (!run || run.phase !== 'draft' || !run.draft.options.includes(pid)) return;
    if (run.stage === 'renaissance') {
      run.reasonGrafts = run.reasonGrafts || []; addUnique(run.reasonGrafts, pid);
      const cost = G.reasonCost(run, pid);
      if (mode !== 'learn' || cost > (run.special || 0)) { G.holdDiscovery(pid); return; }
      run.special -= cost;
      learnReason(run, pid);
      return;
    }
    if (G.civ(run)) {
      run.lawGrafts = run.lawGrafts || []; addUnique(run.lawGrafts, pid);
      const cost = G.lawCost(run, pid);
      if (mode !== 'learn' || cost > (run.special || 0)) { G.holdDiscovery(pid); return; }
      run.special -= cost;
      learnTradition(run, pid);
      return;
    }
    if (run.stage === 'tribe') {
      // Knowledge costs your people's resource: you can only learn what you can pay for.
      // Every choice grafts a new branch onto the Lore tree; learning it now costs your people's resource.
      run.grafts = run.grafts || []; addUnique(run.grafts, pid);
      const cost = G.discoveryCost(run, pid);
      if (mode !== 'learn' || cost > (run.special || 0)) { G.holdDiscovery(pid); return; }
      run.special -= cost;
      learnDiscovery(run, pid, null);
      return;
    }
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
    G.addFood(run, 3);
    run.notices.push(`You skipped a ${run.stage === 'renaissance' ? 'invention' : run.stage === 'society' ? 'tradition' : run.stage === 'tribe' ? 'discovery' : 'mutation'} and gained 3 Food.`);
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
    // The Book of the Lineage: the Origin page, the story of your cell.
    run.book = run.book || {};
    run.book.origin = { parts: cellParts, diet, multicellular: !!run.multicellular, epochs: run.stageTurn, body: JSON.parse(JSON.stringify(G.bodyOf(run))), symmetry: run.symmetry || null, habitat: habitat || 'land', origin: run.origin, archetype: run.archetype };
    addUnique(run.traits, heritage);
    run.stage = 'creature';
    G.meta.stats.creatures = (G.meta.stats.creatures || 0) + 1; G.saveMeta();
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
    run.species = makeWorld(run.habitat);
    run.openNiches = []; run.chains = []; run.activity = null;
    run.biome = G.HOME_BIOME[run.habitat]; run.seenBiomes = [run.biome];
    setupGimmick(run);
    run.pop = G.maxPop(run);
    run.lastEvent = null;
    run.lastTurn = null;
    run.quietTicks = 1;
    noteParts(run);
    run.evolved = { heritage, cellParts, carried, left };
    run.freeEdit = true;
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
    if (run.stage === 'renaissance') return `Renaissance: ${G.nationName(run)}`;
    if (run.stage === 'society') return `Society stage: ${G.socKind(run).name}`;
    if (run.stage === 'tribe') return `Tribe stage: ${G.kind(run).name}`;
    if (run.stage === 'cell') return run.multicellular ? 'Multicellular' : 'Single cell';
    if (run.mind) return 'Spark of Mind';
    if (run.era >= 2) return 'Age of Giants';
    return run.habitat === 'sea' ? 'Creature of the sea' : 'Creature of the land';
  };
  const reviveKey = (run) => (G.civ(run) ? 'society' : run.stage === 'tribe' ? 'tribe' : run.stage === 'cell' ? 'multicellular' : run.mind ? 'mind' : run.era >= 2 ? 'giants' : 'creature');
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
    const run = G.migratePop(JSON.parse(JSON.stringify(f.run)));
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

  // Gene Affinities: favoured mutation families turn up more often.
  G.affinityLevel = (id) => (G.meta.affinity && G.meta.affinity[id]) || 0;
  G.affinityOpen = () => G.meta.stats.wins >= 1;
  G.affinityWeight = (part) => 1 + G.AFFINITIES.reduce((sum, a) => sum + (G.affinityLevel(a.id) && a.match(part) ? G.affinityLevel(a.id) : 0), 0);
  G.buyAffinity = function (id) {
    const m = G.meta; const lvl = G.affinityLevel(id); const cost = G.AFFINITY_COSTS[lvl];
    if (!G.AFFINITY[id] || cost == null || m.genes < cost || !G.affinityOpen()) return false;
    m.genes -= cost; m.affinity[id] = lvl + 1; G.saveMeta();
    return true;
  };
  G.buy = function (kind, id) {
    const m = G.meta;
    let cost;
    if (kind === 'boon') {
      const b = G.BOON[id];
      if (b && id.startsWith('w_') && !G.wisdomOpen()) return false;
      if (b && id.startsWith('h_') && !G.heritageOpen()) return false;
      if (b && id.startsWith('p_') && !G.patronageOpen()) return false;
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
      if (k === 'discoveryCost') return `${v < 0 ? '−' : '+'}${Math.abs(v)}% discovery cost`;
      if (k === 'growthCost') return `${v < 0 ? '−' : '+'}${Math.abs(v)} Food needed to grow`;
      // Max Population is stored in 'heads' but shown as individuals, scaled for your size (and halved for Many Minds).
      if (k === 'popPerTurn') { const r = G.run; const n = r ? Math.ceil(Math.abs(v) * G.popScale(r)) : Math.abs(v) * G.POP_SCALE; return `${v > 0 ? '+' : '−'}${n} ${G.popWord(r || {})} regrown per turn`; }
      if (k === 'foodCap' && G.run && G.gimmick(G.run) === 'predator') return `${v > 0 ? '+' : '−'}${Math.max(1, Math.floor(Math.abs(v) / 2))} ${G.MOD_LABELS[k]} (halved for a Predator)`;
      if (k === 'maxPop' && G.run && G.gimmick(G.run) === 'parasite') return `${v > 0 ? '+' : '−'}${Math.abs(v) * G.POP_SCALE} ${G.MOD_LABELS[k]} (never more than your host allows)`;
      if (k === 'maxPop') { const r = G.run; const mult = r ? G.SIZES[G.sizeOf(r)].popMult * (G.people(r) && r.path === 'many' ? 0.5 : 1) * (G.gimmick(r) === 'grazer' ? 1.6 : 1) : 1; const n = Math.max(1, Math.round(Math.abs(v) * mult * G.POP_SCALE)); return `${v > 0 ? '+' : '−'}${n} ${G.MOD_LABELS[k]}`; }
      return `${v > 0 ? '+' : '−'}${Math.abs(v)} ${G.MOD_LABELS[k] || k}`;
    }).join(', ');
  };
}());
// Build stamp: index.html checks that every file comes from the same release.
(window.PRIMORDIA_FILES = window.PRIMORDIA_FILES || {}).game = '20.2';
