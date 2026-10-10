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
      codex: { events: [], parts: [], legacies: [], evolutions: [], endings: [], discoveries: [], tribeEndings: [] },
      stats: { runs: 0, wins: 0, extinctions: 0, bestDna: 0 },
      fossils: [], history: [], tips: [], tipsOff: false, affinity: {}, stageStarts: [],
    };
  }
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
    m.maxHostility = saved.maxHostility || 0;
    ['archetypes', 'origins', 'packs'].forEach((k) => {
      const list = (saved.unlocked && saved.unlocked[k]) || [];
      list.forEach((id) => { if (!m.unlocked[k].includes(id)) m.unlocked[k].push(id); });
    });
    ['events', 'parts', 'legacies', 'evolutions', 'endings', 'discoveries', 'tribeEndings'].forEach((k) => { m.codex[k] = (saved.codex && saved.codex[k]) || []; });
    Object.assign(m.stats, saved.stats || {});
    return m;
  }

  G.meta = mergeMeta(load(SAVE_META));
  G.run = load(SAVE_RUN);
  // Ideas from before Update 13 no longer exist.
  if (G.run && G.run.innovations) { const ids = new Set(G.INNOVATIONS.map((i) => i.id)); G.run.innovations = G.run.innovations.filter((id) => ids.has(id)); if (G.run.fascination && !ids.has(G.run.fascination)) G.run.fascination = null; }
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
  G.gimmick = (run) => (run && run.stage !== 'tribe' && G.ARCHETYPE[run.archetype] && G.ARCHETYPE[run.archetype].gimmick) || null;
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
  G.instinctAllowed = (run, id) => {
    const g = G.gimmick(run);
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
  G.eyeCount = (run) => (run.stage !== 'cell' && run.look && run.look.eyeCount) || 1;
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
    run.pop = Math.min(run.pop, G.maxPop(run));
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
  G.bodyOf = (run) => ({ stage: run.stage === 'tribe' ? 'creature' : run.stage, habitat: run.habitat, multicellular: run.multicellular, parts: run.parts, symmetry: G.symmetry(run), segments: G.segments(run), armPairs: G.armPairs(run), off: G.offSlots(run), hue: (run.look && run.look.hue != null) ? run.look.hue : G.ARCHETYPE[run.archetype].color, traits: run.traits, look: G.effectiveLook(run) });

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

  // ---------- Stats and modifiers ----------
  function modSources(run) {
    const list = [];
    list.push(G.ARCHETYPE[run.archetype].mods);
    list.push(G.ORIGIN[run.origin].mods);
    G.partIds(run).forEach((pid) => list.push(G.PART[pid].mods));
    run.traits.forEach((t) => { if (G.TRAITS[t]) list.push(G.TRAITS[t].mods); });
    run.innovations.forEach((i) => { if (G.INNOVATION[i]) list.push(G.INNOVATION[i].mods); });
    G.activeSynergies(run).forEach((s) => list.push(s.mods));
    const allies = run.species.filter((s) => !s.extinct && G.speciesStatus(s) === 'allied').length;
    if (allies) list.push({ foodPerTurn: allies });
    if (run.instinct === 'hide') list.push({ damageReduce: 1 });
    if (run.stage !== 'cell') { list.push(G.SYMMETRY[G.symmetry(run)].mods); list.push(G.segmentPlan(run).mods); }
    if (run.stage !== 'cell' && run.habitat === 'sea') list.push(G.SEA_ZONE[G.zone(run)].mods);
    if (run.stage === 'tribe') tribeMods(run).forEach((m) => list.push(m));
    const season = G.season(run);
    // Warm blood shrugs off the food cost of cold seasons.
    const warm = run.traits.includes('blood_warm') || G.firelit(run);
    if (season) list.push(warm && (season.mods.foodPerTurn || 0) < 0 ? { ...season.mods, foodPerTurn: 0 } : season.mods);
    if (G.biomeMatters(run)) list.push(G.biome(run).mods);
    if (run.traits.includes('blood_cold')) {
      const cold = (season && ['winter', 'cold'].includes(season.id)) || ['tundra', 'polar'].includes(G.biome(run).id);
      const hot = (season && ['summer', 'bloom'].includes(season.id)) || ['desert', 'vents'].includes(G.biome(run).id);
      if (cold && !G.firelit(run)) list.push({ spd: -2, foodPerTurn: -1 });
      else if (hot) list.push({ spd: 1 });
    }
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
    const base = run.baseMaxPop + (run.multicellular ? 2 : 0) + (run.stage !== 'cell' ? 3 : 0) + (run.stage === 'tribe' ? 2 : 0) + (run.era - 1) * 3 + G.mod(run, 'maxPop');
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
    if (run.bonusFood && run.turn < run.bonusFood.until) parts.push({ label: 'Hidden feeding ground', v: run.bonusFood.v });
    if (G.hostOf(run)) parts.push({ label: 'Feeding on your host', v: run.stage !== 'cell' ? 3 : 2 });
    const partner = G.partnerOf(run);
    if (g === 'symbiote' && run.partner && (!partner || partner.pop < partner.cap * 0.3)) parts.push({ label: 'Your partner is struggling', v: -2 });
    if (run.instinct === 'explore' || run.instinct === 'hide') parts.push({ label: G.INSTINCT[run.instinct].name, v: -1 });
    const fpt = G.mod(run, 'foodPerTurn');
    if (fpt) parts.push({ label: 'Helpers and allies', v: fpt });
    const total = Math.max(0, parts.reduce((s, p) => s + p.v, 0));
    return { total, parts };
  };

  // Grazers earn DNA from the size of the herd instead of from time.
  G.dnaPerTurn = (run) => (run.stage === 'tribe' ? G.ideasPerTurn(run) : Math.max(1, (G.gimmick(run) === 'grazer' ? Math.floor(run.pop / 6) : 1) + G.mod(run, 'dnaPerTurn') + (run.instinct === 'explore' ? 1 + G.mod(run, 'exploreBonus') : 0)));
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
  G.harsh = (run) => G.HARSH + Math.round(4 * (run.power || 0));
  const finaleEase = (run) => (run.phase === 'event' && run.event && G.EVENT[run.event.id] && G.EVENT[run.event.id].finale ? (run.finaleTries || 0) + G.harsh(run) : 0);
  // A Mimic disguised as the species in this event finds everything easier.
  const disguise = (run) => { const m = G.mimicOf(run); return m && run.phase === 'event' && run.event && run.event.species != null && run.species[run.event.species] === m ? 2 : 0; };
  G.difficulty = (run, base) => base + G.harsh(run) - finaleEase(run) - disguise(run) + (run.stage !== 'cell' ? 0.5 + (run.era - 1) * 1.5 + (run.stage === 'tribe' ? 2 : 0) : 0) + Math.min(2, Math.floor((run.eraTurn - 1) / 6)) + run.hostility;
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
      && !(G.gimmick(run) === 'grazer' && p.diet === 'carn')
      && (!p.biome || p.biome === G.biome(run).id));
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
    if (run.stage === 'tribe' && G.kind(run)) {
      // In the Tribe stage, your herd is a people.
      const k = G.kind(run); const cap = (x) => x[0].toUpperCase() + x.slice(1);
      Object.assign(w, { herd: k.band, band: k.band, Band: cap(k.band), resource: k.resource, keeper: k.keeper, camp: k.camp,
        leader: run.leader ? run.leader.name : 'the eldest' });
      (run.candidates || []).forEach((c, i) => { w[`cand${i}`] = G.leaderTitle(c); });
      w.Herd = w.Band;
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
      pop: G.START_POP, food: G.BASE_FOOD + 3 * (b.pantry || 0),
      power: G.power(),
      dna: 3 * (b.memory || 0), totalDna: 0, insight: 0,
      parts: {}, multicellular: false, mind: false, innovations: [], fascination: null,
      instinct: 'forage',
      traits: [], species: makeWorld('cell'), ages: [], chains: [], openNiches: [], activity: null, biome: 'vent', seenBiomes: ['vent'],
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
    const tribe = run.stage === 'tribe';
    // In the Tribe stage the Creature ending has already been paid out (see checkpoint), so only the new stage counts.
    const progress = tribe ? 5 + Math.min(10, (run.discoveries || []).length * 2) : (run.multicellular ? 5 : 0) + (run.stage === 'creature' ? 10 : 0) + (run.era >= 2 ? 5 : 0) + (run.era >= 3 ? 10 : 0);
    const winBonus = victory ? 40 : 0;
    // Each new square in the Codex of Endings (a start against an ending) is worth a bonus.
    const endKey = victory && (tribe ? (run.tribeEnding ? `${run.path}|${run.habitat === 'sea' ? 'sea' : 'land'}|${run.tribeEnding}` : null)
      : run.legacy && !G.LEGACIES[run.legacy].old ? `${run.legacy}|${G.temperament(run).id}` : null);
    const codexList = tribe ? 'tribeEndings' : 'endings';
    const firstEnding = endKey && !(G.meta.codex[codexList] || []).includes(endKey) ? 10 : 0;
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
      if (run.legacy && !tribe) addUnique(m.codex.legacies, run.legacy);
      if (endKey) addUnique(m.codex[codexList] = m.codex[codexList] || [], endKey);
    } else {
      m.stats.extinctions += 1;
    }
    m.stats.bestDna = Math.max(m.stats.bestDna || 0, run.totalDna);
    run.result = { victory, cause, genes, breakdown: { base, progress, winBonus, survival, firstEnding, mult, revived: !!run.revived } };
    m.history.unshift({ date: Date.now(), archetype: run.archetype, origin: run.origin, victory, cause: victory ? (tribe ? G.tribeEndingName(run) : G.endingName(run)) : cause, reached: G.reachedLabel(run), genes, turns: run.turn, revived: !!run.revived, body: G.bodyOf(run) });
    m.history = m.history.slice(0, 30);
    run.phase = 'end';
    log(run, victory ? (tribe ? `${G.tribeEndingName(run)}: your ${G.kind(run).band} becomes a people.` : `${G.endingName(run)}: your people are born.`) : `${tribe ? 'Your people are gone.' : 'Extinction.'} ${cause}`);
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
    run.food += 1;
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
    // Rich Genes and your home world boost DNA, not a people's Ideas.
    const amount = n > 0 && run.stage !== 'tribe' ? Math.round(n * G.ORIGIN[run.origin].dnaMult * (1 + 0.1 * G.boonLevel('rich_genes'))) : n;
    run.dna = Math.max(0, run.dna + amount);
    if (amount > 0) run.totalDna += amount;
    return amount;
  }

  // Later eras are more dangerous: the Age of Giants and beyond hit 1 harder.
  function damage(run, n) {
    // Event numbers are written for a herd of about 10, so they scale with your herd size.
    // Small creatures lose even more members to the same blow.
    const molting = run.moltUntil && run.turn <= run.moltUntil ? 2 : 0;
    const n2 = Math.max(1, n + (run.era >= 2 ? 1 : 0) - G.mod(run, 'damageReduce') + molting);
    const scale = Math.max(1, Math.min(G.maxPop(run), run.pop) / 10);
    const dmg = Math.max(1, Math.ceil(n2 * scale * G.SIZES[G.sizeOf(run)].damageMult * (G.gimmick(run) === 'grazer' ? 1.5 : 1)));
    run.pop -= dmg;
    if (run.stage === 'tribe') songLoss(run, dmg);
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
    if (eff.dna) lines.push({ t: `+${gainDna(run, eff.dna)} ${run.stage === 'tribe' ? 'Ideas' : 'DNA'}`, good: true });
    if (eff.tame && speciesIdx != null && speciesIdx >= 0 && run.species[speciesIdx] && !run.species[speciesIdx].band) { const sp = run.species[speciesIdx]; sp.tamed = true; sp.opinion = 100; lines.push({ t: `The ${sp.name} are tamed`, good: true }); }
    if (eff.totem && speciesIdx != null && speciesIdx >= 0 && run.species[speciesIdx]) { run.totem = run.species[speciesIdx].name; lines.push({ t: `The ${run.totem} are your totem`, good: true }); }
    if (eff.insight) {
      const before = run.insight;
      run.insight = Math.max(0, run.insight + eff.insight);
      const d = run.insight - before;
      if (d) lines.push({ t: `${d > 0 ? '+' : '−'}${Math.abs(d)} Insight`, good: d > 0, bad: d < 0 });
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
    if (eff.gear) { const g0 = run.gear || 0; run.gear = clamp(g0 + eff.gear, 0, 5); if (run.gear !== g0) lines.push({ t: `Gear level ${run.gear}`, good: run.gear > g0, bad: run.gear < g0 }); }
    if (eff.special) { const before = run.special || 0; run.special = clamp(before + eff.special, 0, G.SPECIAL_CAP); const d = run.special - before; if (d) lines.push({ t: `${d > 0 ? '+' : '−'}${Math.abs(d)} ${G.kind(run).resource}`, good: d > 0, bad: d < 0 }); }
    if (eff.specialOn && !run.specialOn) { run.specialOn = true; run.special = Math.max(run.special || 0, 2); lines.push({ t: `Your people now have ${G.kind(run).resource}`, good: true }); }
    if (eff.band) { const b = makeBand(run); if (b) lines.push({ t: `A rival ${G.kind(run).band}: the ${b.name}`, bad: b.opinion < 0 }); }
    if (eff.bandOpinion) { const b = run.species.find((x) => x.band && !x.extinct); if (b) { b.opinion = clamp(b.opinion + eff.bandOpinion, -100, 100); lines.push({ t: `The ${b.name} ${eff.bandOpinion > 0 ? 'like' : 'dislike'} you ${eff.bandOpinion > 0 ? 'more' : 'more'}`, good: eff.bandOpinion > 0, bad: eff.bandOpinion < 0 }); } }
    if (eff.leaderPick != null && run.candidates && run.candidates[eff.leaderPick]) { run.leader = run.candidates[eff.leaderPick]; run.candidates = null; lines.push({ t: `New leader: ${G.leaderTitle(run.leader)}`, good: true }); log(run, `${G.leaderTitle(run.leader)} became leader.`); }
    if (eff.leaderTrait && run.leader && !run.leader.traits.includes(eff.leaderTrait)) { run.leader.traits.push(eff.leaderTrait); lines.push({ t: `${run.leader.name} is now ${G.LEADER_TRAITS[eff.leaderTrait].name}`, good: true }); }
    if (eff.leaderDies && run.leader) { lines.push({ t: `${run.leader.name} has died`, bad: true }); log(run, `${G.leaderTitle(run.leader)} died.`); run.leader = null; run.needLeader = true; }
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
    if (e.stage !== 'any' && ![].concat(e.stage).includes(run.stage)) return false;
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
    else if (req.eyes && G.eyeCount(run) < req.eyes) reason = `Needs ${req.eyes} or more eyes (set them in the Creature Editor)`;
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
    else if (req.ownPath && run.path !== req.ownPath) reason = `Only for ${G.PATH[req.ownPath].name}`;
    else if (opt.result && opt.result.trait === 'giant' && run.traits.includes('skeleton_shell') && run.habitat === 'land') reason = 'An outer shell cannot carry a giant on land';
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
      else if (run.stage === 'creature' && G.TRIBE_PATHS.includes(run.path)) becomeTribe(run);
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
    const yours = run.pop * G.bodySize(run);
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
    run.pop = Math.max(1, Math.min(run.pop, G.maxPop(run)));
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
    if (a.stage && a.stage !== run.stage) return { ok: false, hidden: true, why: '' };
    if (a.path && a.path !== run.path) return { ok: false, hidden: true, why: '' };
    if (id === 'cross' && run.stage === 'tribe') return { ok: false, hidden: true, why: '' };
    if (a.target) {
      const s = target && run.species.find((x) => x.name === target && !x.extinct);
      if (!s) return { ok: false, why: 'Choose a species' };
      if ((id === 'war' || id === 'hunt') && (s.name === run.partner || s.bud)) return { ok: false, why: 'Not your own partners or offshoots' };
      if (id === 'hunt' && G.gimmick(run) === 'grazer') return { ok: false, why: 'Grazers never hunt' };
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
    log(run, `Your kind began to ${a.name.toLowerCase()}${target ? `: the ${target}` : ''}.`);
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
    if (a.stage === 'tribe') { tribeActivityTurn(run, act, t, lines); return; }
    if (act.id === 'migrate') {
      run.food = Math.max(0, run.food - 1);
      // Wanderer peoples move camp a turn faster, and learn on the way.
      const wander = run.stage === 'tribe' && G.temperament(run).id === 'wanderer';
      if (act.turns >= a.turns - (wander ? 1 : 0)) {
        if (wander) { gainDna(run, 3); lines.push({ t: 'The road taught your people something: +3 Ideas', good: true }); }
        // Without the wits to choose, you end up wherever the road leads.
        const dest = act.dest || pick(G.biome(run).next);
        moveBiome(run, dest);
        run.food += 3; gainDna(run, 3);
        run.migrateReadyAt = run.turn + 10;
        lines.push(finishActivity(run, `You reached the ${G.biome(run).name}: +3 Food and +3 ${run.stage === 'tribe' ? 'Ideas' : 'DNA'}.`, true));
      } else lines.push({ t: `Migrating (${act.turns}/${a.turns}): −1 Food` });
    }
    if (act.id === 'war') {
      const power = (x) => x;
      const mine = power(G.stat(run, 'str') + Math.floor(G.stat(run, 'tou') / 2) + Math.floor(run.pop / 5));
      const theirs = power(G.speciesStat(t, 'str') + Math.floor(G.speciesStat(t, 'tou') / 2) + Math.floor(t.pop / 8));
      const delta = Math.round(16 + (mine - theirs) * 5 + (rand() - 0.5) * 34);
      act.score = clamp(act.score + delta, -100, 100);
      t.pop = Math.max(0, t.pop - t.cap * 0.05);
      t.opinion = clamp(t.opinion - 6, -100, 100);
      run.food = Math.max(0, run.food - 1);
      lines.push({ t: `War with the ${t.name}: ${delta >= 0 ? '+' : '−'}${Math.abs(delta)} (score ${act.score})`, good: delta > 0, bad: delta < 0 });
      if (rand() < (delta < 0 ? 0.4 : 0.15)) lines.push({ t: `War dead: −${damage(run, 1)} Population`, bad: true });
      if (act.score >= 100) {
        t.pop = Math.max(0.5, t.pop * 0.35); t.opinion = -100; t.nemesis = true;
        run.food += 6; gainDna(run, 5); addUnique(run.traits, 'feared'); run.warReadyAt = run.turn + 8;
        // Takers carry off what the beaten band knew.
        if (t.band && run.stage === 'tribe' && G.temperament(run).id === 'taker') { const opts = discoveryOptions(run); if (opts.length) { const d = pick(opts); run.discoveries.push(d); addUnique(G.meta.codex.discoveries, d); lines.push({ t: `You took their knowledge: ${G.DISCOVERY[d].name}`, good: true }); } }
        lines.push(finishActivity(run, `Victory! The ${t.name} are broken and their territory is yours: +6 Food, +5 ${run.stage === 'tribe' ? 'Ideas' : 'DNA'}. They will not forget.`, true));
      } else if (act.score <= -100) {
        t.opinion = -100; t.nemesis = true; addUnique(run.traits, 'scarred');
        lines.push({ t: `Defeat: −${damage(run, 2)} Population`, bad: true });
        run.warReadyAt = run.turn + 8;
        lines.push(finishActivity(run, `Defeat. The ${t.name} drove you back.`, false));
      }
    }
    if (act.id === 'court') {
      // Mask peoples win others over with Cunning.
      const wooing = run.stage === 'tribe' && G.temperament(run).id === 'mask' ? Math.max(G.stat(run, 'cha'), G.stat(run, 'cun')) : G.stat(run, 'cha');
      const chance = clamp(42 + (wooing - 2) * 8, 15, 90);
      if (rand() * 100 < chance) { t.opinion = clamp(t.opinion + 12, -100, 100); lines.push({ t: `Courting the ${t.name}: opinion +12`, good: true }); }
      else { t.opinion = clamp(t.opinion - 2, -100, 100); lines.push({ t: `The ${t.name} were not impressed: opinion −2` }); }
      if (t.opinion >= 60) { if (t.opinion >= 90) t.sworn = true; gainDna(run, 3); lines.push(finishActivity(run, `The ${t.name} are now your allies. +3 DNA.`, true)); }
      else if (act.turns >= 12) lines.push(finishActivity(run, `The ${t.name} will not be won over, for now.`, false));
    }
    if (act.id === 'cross') {
      run.food = Math.max(0, run.food - 1);
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
    if (act.id === 'avoid') { run.food = Math.max(0, run.food - 2); lines.push({ t: `Keeping away from the ${t.name}: −2 Food` }); }
    if (act.id === 'hunt') {
      const chance = clamp(45 + (Math.max(G.stat(run, 'str'), G.stat(run, 'spd')) - G.speciesStat(t, 'spd')) * 8 + G.mod(run, 'huntBonus') * 4, 10, 90);
      if (rand() * 100 < chance) {
        const food = Math.round((2 + Math.floor(run.pop / 8)) * (run.stage === 'tribe' && G.temperament(run).id === 'hunter' ? 1.5 : 1));
        run.food += food; t.pop = Math.max(0, t.pop - t.cap * 0.08); t.opinion = clamp(t.opinion - 6, -100, 100);
        if (G.gimmick(run) === 'predator') { run.hunger = 0; if (rand() < 0.15) run.pendingSpecial = { name: t.name, source: 'devour' }; }
        lines.push({ t: `You hunted the ${t.name}: +${food} Food`, good: true });
      } else if (G.speciesStat(t, 'str') > G.stat(run, 'tou') && rand() < 0.5) lines.push({ t: `The ${t.name} fought back: −${damage(run, 1)} Population`, bad: true });
      else lines.push({ t: `The ${t.name} got away` });
    }
    if (act.id === 'scout') {
      run.food = Math.max(0, run.food - 1);
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
    activityTurn(run, lines);
    // A shell has to be shed to grow: every 12 turns you are soft for 2 turns.
    if (run.traits.includes('skeleton_shell') && run.stageTurn % 12 === 0) { run.moltUntil = run.turn + 2; lines.push({ t: 'Molting: your new shell is soft for 2 turns', bad: true }); }
    const season = G.season(run);
    if (season && run.seasonId !== season.id) { if (run.seasonId) run.notices.push(`${season.name}: ${season.desc}`); run.seasonId = season.id; }
    if (run.food < 0) {
      const starve = -run.food;
      run.food = 0;
      run.pop -= starve;
      lines.push({ t: `Starving: −${starve} Population`, bad: true });
    } else {
      // Spare Food becomes young: bigger herds can raise more at once.
      const cost = G.growthCost(run);
      let born = 0;
      const birthCap = run.traits.includes('young_live') ? 1 : Math.ceil(G.popScale(run)) * (run.traits.includes('young_eggs') ? 2 : 1);
      while (run.food >= cost && run.pop < G.maxPop(run) && born < birthCap) { run.food -= cost; run.pop += 1; born += 1; }
      if (born) lines.push({ t: `+${born} Population (used ${born * cost} spare Food)`, good: true });
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
      const raider = s.band && s.opinion < 0;
      if (s.role !== 'predator' && !hostile && !raider) return;
      if (s.tamed) return;
      const bandAtk = s.band ? 2 + Math.floor(run.stageTurn / 8) - (G.temperament(run).id === 'hunter' ? 2 : 0) : 0;
      const atk = G.speciesStat(s, 'str') + bandAtk + Math.floor(G.harsh(run) / 2) + (run.stage !== 'cell' ? run.era - 1 : 0) + Math.min(3, Math.floor(run.stageTurn / 10));
      const def = G.stat(run, 'tou') + Math.floor(G.stat(run, 'spd') / 2);
      // The bigger the gap, the more often and harder they strike; even the strong are never quite safe.
      const gap = atk - def;
      const hit = clamp(G.PREDATION + 0.04 * gap + (hostile ? 0.1 : 0), 0.04, 0.45) * (run.instinct === 'hide' ? 0.5 : 1) * (1 + 0.4 * (run.power || 0));
      if (rand() >= hit * crowdEase * (s.nemesis ? 1.5 : 1) * (run.traits.includes('skeleton_soft') ? 0.8 : 1) * (G.firelit(run) ? 0.75 : 1)) return;
      const n = clamp(1 + Math.floor(gap / 3), 1, 3);
      lines.push({ t: s.band ? `The ${s.name} raided your ${G.kind(run).camp}: −${damage(run, n)} members` : `The ${s.name} hunted you: −${damage(run, n)} ${run.stage === 'tribe' ? 'members' : 'Population'}`, bad: true });
    });
    const regrow = G.mod(run, 'popPerTurn');
    if (regrow > 0 && run.pop > 0) { const g = grow(run, regrow); if (g) lines.push({ t: `+${g} Population from symbionts`, good: true }); }
    const cap = G.foodCap(run);
    if (run.food > cap) { lines.push({ t: `${run.food - cap} Food spoiled (storage ${cap})`, bad: true }); run.food = cap; }
    lines.push({ t: `+${gainDna(run, G.dnaPerTurn(run))} ${run.stage === 'tribe' ? 'Ideas' : 'DNA'}`, good: true });
    if (run.stage === 'tribe') tribeTurn(run, lines);
    if (run.mind && run.stage === 'creature') {
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
  G.innovationVisible = (run, inv) => {
    if (run.innovations.includes(inv.id)) return true;
    const hab = run.habitat === 'sea' ? 'sea' : 'land';
    if (inv.group === 'root') return inv.temper === G.temperament(run).id;
    if (inv.group === 'trunk') return inv.habitat === hab;
    if (inv.group === 'home') return hab === 'land' ? G.biome(run).id === inv.home : G.zone(run) === inv.home;
    return inv.path === run.path;
  };

  // ---------- The Tribe stage ----------
  G.SPECIAL_CAP = 20;
  G.kind = (run) => G.KINDS[run.path] && G.KINDS[run.path][run.habitat === 'sea' ? 'sea' : 'land'];
  // Fire (or vent-heat) is lit once your Toolmakers have at least 3: it warms you through the cold and keeps hunters away.
  G.firelit = (run) => run.stage === 'tribe' && run.path === 'tool' && (run.special || 0) >= 3;
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
  G.leaderTitle = (l) => (l ? `${l.name} the ${l.traits.map((t) => G.LEADER_TRAITS[t].name).join(' and ')}` : 'No one');
  function newLeader(run) {
    const A = G.LEADER_SYLLABLES;
    const traits = []; const keys = Object.keys(G.LEADER_TRAITS);
    while (traits.length < 2) { const t = pick(keys); if (!traits.includes(t)) traits.push(t); }
    return { name: pick(A.a) + pick(A.b), traits, since: run.turn, life: 14 + Math.floor(rand() * 12) };
  }
  // Everything the Tribe stage adds to your stats.
  function tribeMods(run) {
    const list = [];
    const tm = G.TRIBE_TEMPER[G.temperament(run).id]; if (tm) list.push(tm.mods);
    if (run.leader) run.leader.traits.forEach((t) => list.push(G.LEADER_TRAITS[t].mods));
    (run.discoveries || []).forEach((d) => list.push(G.DISCOVERY[d].mods));
    if (run.gear) list.push({ str: run.gear, tou: Math.floor(run.gear / 2) });
    const totem = run.totem && run.species.find((x) => x.name === run.totem && !x.extinct);
    if (totem) { const best = G.STATS.map((x) => x.id).sort((a, b) => G.speciesStat(totem, b) - G.speciesStat(totem, a))[0]; list.push({ [best]: 1 }); }
    const tamed = run.species.filter((x) => x.tamed && !x.extinct).length;
    if (tamed) list.push({ foodPerTurn: Math.min(3, tamed) });
    if (run.path === 'song') list.push({ cha: Math.min(3, Math.floor((run.special || 0) / 6)), ideasPerTurn: Math.min(2, Math.floor((run.special || 0) / 10)) });
    return list;
  }
  G.ideasPerTurn = (run) => Math.max(1, 1 + G.mod(run, 'ideasPerTurn') + Math.floor(G.stat(run, 'cun') / 10) + (run.instinct === 'explore' ? 1 + Math.floor(G.mod(run, 'exploreBonus') / 2) : 0));
  // One turn of tribe life: the special resource, and the leader growing old.
  function tribeTurn(run, lines) {
    if (run.specialOn) {
      const gain = Math.max(0, 1 + G.mod(run, 'specialPerTurn'));
      const before = run.special || 0;
      run.special = Math.min(G.SPECIAL_CAP, before + gain);
      if (run.special > before) lines.push({ t: `+${run.special - before} ${G.kind(run).resource}`, good: true });
    }
    // Bands compete for the same land: unless you are allies, they slowly sour on you.
    run.species.forEach((x) => { if (x.band && !x.extinct && x.opinion < 60) x.opinion = Math.max(-100, x.opinion - 1); });
    if (run.leader && run.turn - run.leader.since >= run.leader.life) {
      lines.push({ t: `${run.leader.name}, your leader, has died of old age`, bad: true });
      log(run, `${G.leaderTitle(run.leader)} died of old age.`);
      run.leader = null; run.needLeader = true;
    }
  }
  // Singers: when many die at once, verses are lost, and with them, discoveries.
  function songLoss(run, dmg) {
    if (run.path !== 'song' || dmg < 3) return;
    if (run.songSafe) { run.songSafe = false; run.notices.push('Your teaching held: no verses were lost.'); return; }
    run.special = Math.max(0, (run.special || 0) - dmg);
    const known = run.discoveries || [];
    if (known.length && run.special < known.length * 2) {
      const d = pick(known);
      run.discoveries = known.filter((x) => x !== d);
      run.notices.push(`Too many singers died. The verse of ${G.DISCOVERY[d].name} is lost, and with it the discovery.`);
      log(run, `The song of ${G.DISCOVERY[d].name} was forgotten.`);
    }
  }
  // A rival band: your old nemesis (or a rival) has learned to think too.
  function makeBand(run) {
    if (run.species.some((x) => x.band && !x.extinct)) return null;
    const alive = run.species.filter((x) => !x.extinct && !x.tamed);
    const src = alive.find((x) => x.nemesis) || alive.filter((x) => x.role === 'rival' || x.role === 'predator').sort((a, b) => a.opinion - b.opinion)[0] || alive[0];
    if (!src) return null;
    const word = G.kind(run).band;
    const b = JSON.parse(JSON.stringify(src));
    b.name = `${src.name.replace(/s$/, '')} ${word[0].toUpperCase()}${word.slice(1)}`;
    b.band = true; b.role = 'rival'; b.cap = 14; b.pop = 10; b.size = Math.max(src.size, 0.9);
    b.opinion = clamp(src.opinion - (src.nemesis ? 30 : 0), -100, 60); b.nemesis = !!src.nemesis; b.tamed = false; b.extinct = false;
    b.hue = (src.hue + 30) % 360;
    run.species.push(b);
    run.notices.push(`Strangers: the ${b.name}, a band of ${src.name} who have learned to think.${src.nemesis ? ' They remember the old feud.' : ''}`);
    log(run, `The ${b.name} appeared: ${src.name} who learned to think.`);
    return b;
  }
  G.discoveryCombo = (a, b) => { const r = G.DISCOVERIES.find((d) => d.from && ((d.from[0] === a && d.from[1] === b) || (d.from[0] === b && d.from[1] === a))); return r ? r.id : null; };
  // Discoveries on offer: 1 of 3 (or 4), from your Path, your home and your body's talents.
  function discoveryOptions(run) {
    const talents = G.talents(run); const hab = run.habitat === 'sea' ? 'sea' : 'land';
    const known = run.discoveries || [];
    const usedUp = new Set(known.concat(G.DISCOVERIES.filter((d) => d.from && known.includes(d.id)).flatMap((d) => d.from)));
    let pool = G.DISCOVERIES.filter((d) => !d.from && !usedUp.has(d.id) && (!d.path || d.path === run.path) && (!d.habitat || d.habitat === hab) && (!d.talent || talents.has(d.talent)));
    const n = G.meta.boons.choice ? 4 : 3; const out = [];
    while (out.length < n && pool.length) {
      const d = weightedPick(pool, (x) => (x.talent ? 1.6 : 1) * (x.path ? 1.4 : 1) * (known.some((k) => G.discoveryCombo(k, x.id)) ? 1.8 : 1));
      out.push(d.id); pool = pool.filter((x) => x.id !== d.id);
    }
    return out;
  }
  function learnDiscovery(run, id, combineWith) {
    const d = G.DISCOVERY[id];
    let text = `Your people discovered ${d.name}`;
    const combo = combineWith && run.discoveries.includes(combineWith) && G.discoveryCombo(combineWith, id);
    let evolved = null;
    if (combo) {
      run.discoveries = run.discoveries.filter((x) => x !== combineWith);
      run.discoveries.push(combo);
      const first = !(G.meta.codex.discoveries || []).includes(combo);
      addUnique(G.meta.codex.discoveries = G.meta.codex.discoveries || [], combo);
      if (first) { G.meta.genes += 3; run.notices.push(`New combination: ${G.DISCOVERY[combo].name}. +3 Genetic Memory, and it is now in your Codex.`); }
      text = `${G.DISCOVERY[combineWith].name} + ${d.name} became ${G.DISCOVERY[combo].name}!`;
      evolved = combo;
    } else run.discoveries.push(id);
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
    if (id === 'craft' && (run.special || 0) < 4) return `Needs 4 ${G.kind(run).resource}`;
    if (id === 'craft' && (run.gear || 0) >= 5) return 'Your gear is as good as it gets';
    if (id === 'ceremony' && run.turn < (run.ceremonyReadyAt || 0)) return `Ready in ${run.ceremonyReadyAt - run.turn} turns`;
    if ((id === 'craft' || id === 'teach' || id === 'ceremony') && !run.specialOn) return `Your people have no ${G.kind(run).resource} yet`;
    return null;
  }
  function tribeActivityTurn(run, act, t, lines) {
    const a = G.ACTIVITY[act.id];
    if (act.id === 'tame') {
      const bonus = G.temperament(run).id === 'bond' ? 20 : 0;
      const chance = clamp(35 + (G.stat(run, 'cha') - 3) * 8 + bonus, 15, 90);
      if (rand() * 100 < chance) { act.score += 1; t.opinion = clamp(t.opinion + 10, -100, 100); lines.push({ t: `Taming the ${t.name} (${act.score}/3)`, good: true }); }
      else lines.push({ t: `The ${t.name} shy away` });
      if (act.score >= 3) { t.tamed = true; t.opinion = 100; lines.push(finishActivity(run, `The ${t.name} now live alongside your people. +1 Food a turn.`, true)); }
      else if (act.turns >= 10) lines.push(finishActivity(run, `The ${t.name} will not be tamed, for now.`, false));
    }
    if (act.id === 'revere' && act.turns >= a.turns) { run.totem = t.name; t.opinion = clamp(t.opinion + 40, -100, 100); lines.push(finishActivity(run, `The ${t.name} are now your totem.`, true)); }
    if (act.id === 'ceremony') {
      run.food = Math.max(0, run.food - 1); run.special = Math.min(G.SPECIAL_CAP, (run.special || 0) + 2); gainDna(run, 1);
      lines.push({ t: `Ceremony: +2 ${G.kind(run).resource}, +1 Idea, −1 Food`, good: true });
      if (act.turns >= a.turns) { run.ceremonyReadyAt = run.turn + 8; lines.push(finishActivity(run, 'The ceremony ends. Everyone feels closer.', true)); }
    }
    if (act.id === 'craft' && act.turns >= a.turns) { run.special -= 4; run.gear = (run.gear || 0) + 1; lines.push(finishActivity(run, `New gear for your people (level ${run.gear}).`, true)); }
    if (act.id === 'teach') {
      run.food = Math.max(0, run.food - 1); run.special = Math.min(G.SPECIAL_CAP, (run.special || 0) + 2);
      lines.push({ t: `Teaching: +2 Song, −1 Food`, good: true });
      if (act.turns >= a.turns) { run.songSafe = true; lines.push(finishActivity(run, 'The songs are learned by heart. The next great loss will not cost a verse.', true)); }
    }
  }
  // Your kind becomes a people: the Creature stage's ending is a checkpoint, and the Tribe stage begins.
  function becomeTribe(run) {
    checkpoint(run);
    const hab = run.habitat === 'sea' ? 'sea' : 'land';
    run.stage = 'tribe'; run.stageTurn = 1; run.eraTurn = 1;
    run.dna = 0; run.totalDna = 0; run.draftsTaken = 0; run.finaleRetryAt = 0; run.finaleTries = 0;
    run.discoveries = []; run.special = 0; run.specialOn = false; run.gear = 0; run.totem = null;
    run.leader = newLeader(run); run.needLeader = false;
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
    const m = G.meta; const key = `${run.path}|${run.habitat === 'sea' ? 'sea' : 'land'}`;
    const snap = JSON.parse(JSON.stringify(run));
    snap.log = snap.log.slice(0, 25); snap.notices = []; snap.lastTurn = null; snap.event = null; snap.scene = null; snap.draft = null; snap.result = null;
    m.stageStarts = (m.stageStarts || []).filter((x) => x.key !== key);
    m.stageStarts.unshift({ key, date: Date.now(), archetype: run.archetype, ending: G.endingName(run), kind: G.kind(run).name, body: G.bodyOf(run), run: snap });
    G.saveMeta();
  }
  G.stageStarts = () => G.meta.stageStarts || [];
  G.startFromStage = function (key) {
    const m = G.meta; const st = G.stageStarts().find((x) => x.key === key);
    if (!st) return false;
    const run = JSON.parse(JSON.stringify(st.run));
    run.fromStage = true; run.checkpointGenes = 0;
    run.knownEvos = m.codex.evolutions.slice();
    run.baseMaxPop = G.BASE_POP + G.boonLevel('hardy');
    run.baseFoodCap = G.FOOD_CAP + 2 * G.boonLevel('pantry');
    run.secondChanceUsed = false; run.power = G.power();
    run.result = null; run.phase = 'evolved';
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
  G.tribeEndingName = (run) => { const e = run.tribeEnding && G.TRIBE_ENDINGS[run.path] && G.TRIBE_ENDINGS[run.path][run.habitat === 'sea' ? 'sea' : 'land'][run.tribeEnding]; return e ? e.name : ''; };

  // ---------- Mind tree ----------
  G.innovationAvailable = function (run, inv) {
    if (run.innovations.includes(inv.id)) return { ok: false, reason: 'Known' };
    if (!G.innovationVisible(run, inv)) return { ok: false, hidden: true, reason: 'Not on your path' };
    const knownTier = (t) => run.innovations.some((id) => G.INNOVATION[id] && G.INNOVATION[id].tier === t);
    if (inv.tier === 2 && !knownTier(1)) return { ok: false, reason: 'Needs one of your root ideas first' };
    if (inv.tier === 3 && !knownTier(2)) return { ok: false, reason: 'Needs a land, sea or home idea first' };
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
    const f = (n) => (n > 0 || run.stage !== 'tribe' ? Math.max(1, Math.round(n * k)) : 0);
    return { drafts: st.drafts.map(f), milestones: st.milestones.map((m) => ({ ...m, at: f(m.at) })), evolveAt: st.evolveAt && f(st.evolveAt) };
  };

  function nextStep(run, allowEvent) {
    const st = G.goals(run);
    if (run.pendingSpecial && startSpecialDraft(run)) return;
    if (run.draftsTaken < st.drafts.length && run.dna >= st.drafts[run.draftsTaken]) { startDraft(run); return; }
    const ms = st.milestones.find((m) => run.dna >= m.at && !run.milestonesDone.includes(m.event.replace('{path}', run.path)));
    if (ms) { setEvent(run, G.EVENT[ms.event.replace('{path}', run.path)]); return; }
    // A leader has died: choose the next one.
    if (run.stage === 'tribe' && run.needLeader) { run.candidates = [newLeader(run), newLeader(run), newLeader(run)]; run.needLeader = false; setEvent(run, G.EVENT.succession); return; }
    // Lineages that reached the Spark before Paths existed choose one now.
    if (run.stage === 'creature' && run.mind && !run.path) { setEvent(run, G.EVENT.path_choice); return; }
    if (needsFascination(run)) { run.phase = 'mind'; return; }
    const finaleReady = run.turn >= run.finaleRetryAt && (run.stage === 'creature' ? !!run.path && run.innovations.includes(`${run.path}_cap`) : run.dna >= st.evolveAt);
    if (finaleReady) {
      const hab = run.habitat === 'sea' ? 'sea' : 'land';
      const id = run.stage === 'cell' ? 'cell_finale' : run.stage === 'tribe' ? `founding_${run.path}_${hab}` : `finale_${run.path}_${hab}`;
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
    run.draft = { options: draftOptions(run), rerolls: G.meta.boons.reroll ? 1 : 0 };
    run.phase = 'draft';
  }

  G.pickDraft = function (pid, mode, socket) {
    const run = G.run;
    if (!run || run.phase !== 'draft' || !run.draft.options.includes(pid)) return;
    if (run.stage === 'tribe') { learnDiscovery(run, pid, mode === 'combine' ? socket : null); return; }
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
    run.notices.push(`You skipped a ${run.stage === 'tribe' ? 'discovery' : 'mutation'} and gained 3 Food.`);
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
    if (run.stage === 'tribe') return `Tribe stage: ${G.kind(run).name}`;
    if (run.stage === 'cell') return run.multicellular ? 'Multicellular' : 'Single cell';
    if (run.mind) return 'Spark of Mind';
    if (run.era >= 2) return 'Age of Giants';
    return run.habitat === 'sea' ? 'Creature of the sea' : 'Creature of the land';
  };
  const reviveKey = (run) => (run.stage === 'tribe' ? 'tribe' : run.stage === 'cell' ? 'multicellular' : run.mind ? 'mind' : run.era >= 2 ? 'giants' : 'creature');
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
