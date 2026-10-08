// Game rules: runs, turns, checks, drafts, merging, eras, the Mind tree and saved progress.
window.G = window.G || {};

(function () {
  const SAVE_META = 'primordia.meta.v1';
  const SAVE_RUN = 'primordia.run.v2';

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
      codex: { events: [], parts: [], legacies: [] },
      stats: { runs: 0, wins: 0, extinctions: 0, bestDna: 0 },
    };
  }
  function mergeMeta(saved) {
    const m = freshMeta();
    if (!saved) return m;
    m.genes = saved.genes || 0;
    m.boons = saved.boons || {};
    m.maxHostility = saved.maxHostility || 0;
    ['archetypes', 'origins', 'packs'].forEach((k) => {
      const list = (saved.unlocked && saved.unlocked[k]) || [];
      list.forEach((id) => { if (!m.unlocked[k].includes(id)) m.unlocked[k].push(id); });
    });
    ['events', 'parts', 'legacies'].forEach((k) => { m.codex[k] = (saved.codex && saved.codex[k]) || []; });
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
  // Slots available right now (cell slots marked `multi` wait for multicellularity).
  G.slotsFor = (run) => G.SLOTS[run.plan].filter((s) => !s.multi || run.multicellular);
  G.slotName = (run, slotId) => (G.SLOTS[run.plan].find((s) => s.id === slotId) || { name: slotId }).name;

  // Every part id on the body, merged halves included.
  G.partIds = (run) => {
    const out = [];
    Object.values(run.parts).forEach((s) => { if (s) { out.push(s.id); if (s.merged) out.push(s.merged); } });
    return out;
  };

  G.canMerge = (run) => run.stage === 'creature' || run.multicellular;

  // Display name of what fills a slot, e.g. "Venomous Fangs" for Fangs merged with Venom Fangs.
  G.slotLabel = (slot) => {
    if (!slot) return '';
    const base = G.PART[slot.id];
    if (!slot.merged) return base.name;
    return `${G.PART[slot.merged].adj} ${base.name}`;
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
    const allies = run.species.filter((s) => G.speciesStatus(s) === 'allied').length;
    if (allies) list.push({ foodPerTurn: allies });
    if (run.instinct === 'hide') list.push({ damageReduce: 1 });
    if (run.hostility >= 2) list.push({ upkeep: 1 });
    if (run.hostility >= 4) list.push({ maxPop: -2 });
    return list;
  }

  G.mod = (run, key) => modSources(run).reduce((s, m) => s + ((m && m[key]) || 0), 0);
  // Cells start a little sturdier so early checks are not hopeless.
  G.stat = (run, key) => Math.max(0, (run.stage === 'cell' ? 2 : 1) + G.mod(run, key));
  G.maxPop = (run) => Math.max(3, run.baseMaxPop + G.mod(run, 'maxPop'));
  G.foodCap = (run) => Math.max(4, run.baseFoodCap + G.mod(run, 'foodCap'));
  G.upkeep = (run) => Math.max(1, Math.ceil(run.pop / 2) + G.mod(run, 'upkeep'));
  G.growthCost = (run) => Math.max(1, G.GROWTH_COST + (run.instinct === 'breed' ? -1 : 0) + G.mod(run, 'growthCost'));

  // Food gathered each turn, with a breakdown for the UI.
  G.income = function (run) {
    const diet = G.diet(run);
    const parts = [{ label: 'Scraps', v: 1 }];
    if (run.instinct === 'forage') parts.push({ label: 'Foraging', v: 2 + G.mod(run, 'forageBonus') + (diet === 'herb' ? 1 : diet === 'carn' ? -1 : 0) });
    if (run.instinct === 'hunt') parts.push({ label: 'Hunting', v: 2 + G.mod(run, 'huntBonus') + (diet === 'carn' ? 1 : diet === 'herb' ? -1 : 0) });
    if (run.instinct === 'explore' || run.instinct === 'hide') parts.push({ label: G.INSTINCT[run.instinct].name, v: -1 });
    const fpt = G.mod(run, 'foodPerTurn');
    if (fpt) parts.push({ label: 'Helpers and allies', v: fpt });
    const total = Math.max(0, parts.reduce((s, p) => s + p.v, 0));
    return { total, parts };
  };

  G.dnaPerTurn = (run) => Math.max(1, 1 + G.mod(run, 'dnaPerTurn') + (run.instinct === 'explore' ? 1 + G.mod(run, 'exploreBonus') : 0));
  G.insightPerTurn = (run) => (run.mind ? 1 + Math.floor(G.stat(run, 'cun') / 3) + G.mod(run, 'insightPerTurn') : 0);

  // Checks get harder in later eras and the longer you linger in one (up to +2).
  G.difficulty = (run, base) => base + (run.era - 1) + Math.min(2, Math.floor((run.eraTurn - 1) / 6)) + run.hostility;
  G.chance = (run, stat, base) => clamp(50 + (G.stat(run, stat) - G.difficulty(run, base)) * 12, 5, 95);

  G.speciesStatus = (s) => (s.opinion >= 50 ? 'allied' : s.opinion <= -50 ? 'hostile' : s.opinion >= 15 ? 'friendly' : s.opinion <= -15 ? 'wary' : 'neutral');

  G.partPool = function (run) {
    const packs = G.meta.unlocked.packs;
    const slots = G.slotsFor(run).map((s) => s.id);
    return G.PARTS.filter((p) => p.stage === run.stage
      && slots.includes(p.slot)
      && (run.stage === 'cell' || !p.habitat || p.habitat === run.habitat)
      && (!p.pack || packs.includes(p.pack)));
  };

  function sub(text, run, speciesIdx) {
    const s = speciesIdx != null && speciesIdx >= 0 ? run.species[speciesIdx] : null;
    return String(text || '').replace(/\{them\}/g, s ? s.name : 'others');
  }
  G.sub = sub;

  function log(run, text) {
    const st = G.STAGES[run.stage];
    run.log.unshift({ when: `${st.turnName} ${run.stageTurn}`, text });
    if (run.log.length > 80) run.log.length = 80;
  }

  function noteParts(run) { G.partIds(run).forEach((pid) => addUnique(G.meta.codex.parts, pid)); }

  // ---------- Species ----------
  function makeSpecies(world, roles) {
    const names = G.SPECIES_NAMES[world];
    const used = new Set();
    return roles.map((role) => {
      let name;
      do { name = pick(names.first) + pick(names.last); } while (used.has(name));
      used.add(name);
      const opinion = { predator: -35, prey: -10, rival: -5, neighbor: 10 }[role] + Math.round(rand() * 20) - 10;
      const diet = role === 'predator' ? 'carn' : role === 'prey' ? 'herb' : pick(['herb', 'carn', 'omni']);
      return { name, role, diet, opinion, hue: Math.floor(rand() * 360), size: role === 'predator' ? 1.4 : role === 'prey' ? 0.7 : 1, seed: Math.floor(rand() * 1000) };
    });
  }

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
      phase: 'event', event: null, scene: null, draft: null, lastTurn: null, legacy: null, result: null, lastEvent: null,
    };
    Object.entries(arch.start.cell).forEach(([slot, id]) => { run.parts[slot] = { id, merged: null }; });
    run.pop = Math.min(run.pop, G.maxPop(run));
    log(run, `Life stirs in the ${G.ORIGIN[originId].name}. A new ${arch.name} lineage begins.`);
    run.notices.push(`You share these waters with the ${run.species.map((s) => s.name).join(', ')}.`);
    G.meta.stats.runs += 1;
    noteParts(run);
    G.run = run;
    drawEvent(run);
    save();
    return run;
  };

  function endRun(run, victory, cause) {
    const base = Math.floor(run.totalDna / 3);
    const progress = (run.multicellular ? 5 : 0) + (run.stage === 'creature' ? 10 : 0) + (run.era >= 2 ? 5 : 0) + (run.era >= 3 ? 10 : 0);
    const winBonus = victory ? 40 : 0;
    const mult = 1 + 0.25 * run.hostility;
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
    run.result = { victory, cause, genes, breakdown: { base, progress, winBonus, mult } };
    run.phase = 'end';
    log(run, victory ? `${G.LEGACIES[run.legacy].name}: the age of tribes begins.` : `Extinction. ${cause}`);
    save();
  }

  G.endRunEarly = function () {
    if (G.run && G.run.phase !== 'end') endRun(G.run, false, 'You ended this lineage.');
  };

  // ---------- Effects ----------
  function gainDna(run, n) {
    const amount = n > 0 ? Math.round(n * G.ORIGIN[run.origin].dnaMult) : n;
    run.dna = Math.max(0, run.dna + amount);
    if (amount > 0) run.totalDna += amount;
    return amount;
  }

  // Later eras are more dangerous: the Age of Giants and beyond hit 1 harder.
  function damage(run, n) {
    const dmg = Math.max(1, n + (run.era >= 2 ? 1 : 0) - G.mod(run, 'damageReduce'));
    run.pop -= dmg;
    return dmg;
  }

  function grow(run, n) {
    const before = run.pop;
    run.pop = Math.min(G.maxPop(run), run.pop + n);
    return run.pop - before;
  }

  // Put a part on the body: fill an empty slot, merge with what is there, or replace it.
  function installPart(run, part, mode) {
    const slot = run.parts[part.slot];
    let text;
    if (!slot) {
      run.parts[part.slot] = { id: part.id, merged: null };
      text = `${part.name} grows in your ${G.slotName(run, part.slot).toLowerCase()} slot`;
    } else if (mode === 'merge' && !slot.merged && G.canMerge(run)) {
      const before = G.slotLabel(slot);
      slot.merged = part.id;
      text = `${before} merges with ${part.name}: ${G.slotLabel(slot)}`;
    } else {
      const before = G.slotLabel(slot);
      run.parts[part.slot] = { id: part.id, merged: null };
      text = `${part.name} replaces ${before}`;
    }
    addUnique(G.meta.codex.parts, part.id);
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
    if (eff.legacy) run.legacy = eff.legacy;
    if (eff.setback != null) {
      if (run.stage === 'cell' && eff.setback) {
        run.dna = Math.max(0, run.dna - eff.setback);
        lines.push({ t: `−${eff.setback} DNA: you must grow more before trying again`, bad: true });
      }
      run.finaleRetryAt = run.turn + 3;
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

  // ---------- Events ----------
  function speciesFor(run, role) {
    if (!role) return null;
    const idx = run.species.map((s, i) => i).filter((i) => {
      const s = run.species[i];
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
    else if (req.innovation && !run.innovations.includes(req.innovation)) reason = `Needs the ${G.INNOVATION[req.innovation].name} innovation`;
    else if (req.food && run.food < req.food) reason = `Needs ${req.food} Food`;
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
    const lines = applyEffects(run, res, sp);
    run.scene = {
      title: sub(ev.title, run, sp),
      label: sub(opt.label, run, sp),
      text: sub(res && res.text, run, sp),
      lines, success,
      anim: sceneAnim(res, opt, success),
      species: sp,
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
    if (run.pop <= 0) { endRun(run, false, 'Your lineage died out.'); return; }
    if (sc.milestone) {
      run.milestonesDone.push(sc.milestone);
      applyMilestone(run, sc.milestone);
      nextStep(run);
    } else if (sc.finale && sc.won) {
      if (run.stage === 'cell') evolve(run, sc.habitat);
      else endRun(run, true);
    } else {
      endTurn(run);
    }
    save();
  };

  function applyMilestone(run, id) {
    if (id === 'multicellularity') {
      run.multicellular = true;
      run.notices.push('You are multicellular. Two new body slots are open, and new mutations can now merge with old ones instead of replacing them.');
    }
    if (id === 'age_of_giants') {
      run.era = 2; run.eraTurn = 1;
      const apex = makeSpecies(run.habitat, ['predator'])[0];
      apex.size = 2; apex.opinion = -45;
      run.species.push(apex);
      run.notices.push(`The Age of Giants begins. A huge new predator, the ${apex.name}, has arrived.`);
    }
    if (id === 'spark_of_mind') {
      run.era = 3; run.eraTurn = 1; run.mind = true;
      run.notices.push('Your kind has begun to think. Choose what fascinates them, and Insight will flow into it each turn.');
    }
  }

  // ---------- Turn end ----------
  function endTurn(run) {
    const lines = [];
    const inc = G.income(run);
    const up = G.upkeep(run);
    run.food += inc.total - up;
    lines.push({ t: `Food +${inc.total} gathered, −${up} eaten` });
    if (run.food < 0) {
      const starve = -run.food;
      run.food = 0;
      run.pop -= starve;
      lines.push({ t: `Starving: −${starve} Population`, bad: true });
    } else {
      const cost = G.growthCost(run);
      if (run.food >= cost && run.pop < G.maxPop(run)) {
        run.food -= cost; run.pop += 1;
        lines.push({ t: `+1 Population (used ${cost} spare Food)`, good: true });
      }
    }
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
    if (run.pop <= 0) { endRun(run, false, 'Your lineage starved.'); return; }
    const st = G.STAGES[run.stage];
    run.lastTurn = { title: `${st.turnName} ${run.stageTurn}`, lines };
    run.turn += 1; run.stageTurn += 1; run.eraTurn += 1;
    researchProgress(run);
    nextStep(run);
  }

  // ---------- Mind tree ----------
  G.innovationAvailable = function (run, inv) {
    if (run.innovations.includes(inv.id)) return { ok: false, reason: 'Done' };
    if (inv.tier > 1) {
      const prev = run.innovations.filter((id) => G.INNOVATION[id].tier === inv.tier - 1).length;
      if (prev < 2) return { ok: false, reason: `Needs 2 tier ${inv.tier - 1} innovations` };
    }
    if (inv.req === 'grasp' && !G.hasTag(run, 'grasp')) return { ok: false, reason: 'Needs a part that can grasp' };
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
    if (run.phase === 'mind') nextStep(run);
    save();
  };

  function needsFascination(run) {
    return run.mind && !run.fascination && G.INNOVATIONS.some((i) => G.innovationAvailable(run, i).ok);
  }

  // Decide what comes next: a mutation draft, a milestone, a choice of fascination, the finale, or an event.
  function nextStep(run) {
    const st = G.STAGES[run.stage];
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
    drawEvent(run);
  }

  // ---------- Mutation drafts ----------
  function draftOptions(run) {
    const n = G.meta.boons.choice ? 4 : 3;
    const boost = G.ORIGIN[run.origin].boostKeyword;
    const have = G.partIds(run);
    const empty = G.slotsFor(run).filter((s) => !run.parts[s.id]).map((s) => s.id);
    let pool = G.partPool(run).filter((p) => !have.includes(p.id));
    const out = [];
    while (out.length < n && pool.length) {
      const p = weightedPick(pool, (x) => (x.rarity || 2)
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

  G.pickDraft = function (pid, mode) {
    const run = G.run;
    if (!run || run.phase !== 'draft' || !run.draft.options.includes(pid)) return;
    const text = installPart(run, G.PART[pid], mode);
    log(run, `Mutation: ${text}.`);
    run.draftsTaken += 1;
    run.draft = null;
    run.scene = { title: 'Mutation', label: text, text: '', lines: [], anim: 'mutate', mutation: true };
    run.phase = 'mutated';
    save();
  };

  G.continueMutation = function () {
    const run = G.run;
    if (!run || run.phase !== 'mutated') return;
    nextStep(run);
    save();
  };

  G.skipDraft = function () {
    const run = G.run;
    if (!run || run.phase !== 'draft') return;
    run.food += 3;
    run.notices.push('You skipped a mutation and gained 3 Food.');
    run.draftsTaken += 1;
    run.draft = null;
    nextStep(run);
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
    if (!run || !G.INSTINCT[id]) return;
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
    run.dna = 3 * (G.meta.boons.memory || 0);
    run.draftsTaken = 0;
    run.finaleRetryAt = 0;
    run.parts = {};
    Object.entries(G.ARCHETYPE[run.archetype].start[run.habitat]).forEach(([slot, id]) => { run.parts[slot] = { id, merged: null }; });
    run.species = makeSpecies(run.habitat, ['predator', 'prey', 'rival', 'neighbor']);
    run.pop = G.maxPop(run);
    run.lastEvent = null;
    run.lastTurn = null;
    noteParts(run);
    run.evolved = { heritage, cellParts };
    log(run, `Your lineage ${run.habitat === 'land' ? 'leaves the water for the land' : 'claims the open sea'}. It carries the ${G.TRAITS[heritage].name} trait.`);
    run.phase = 'evolved';
  }

  G.continueEvolved = function () {
    const run = G.run;
    if (!run || run.phase !== 'evolved') return;
    nextStep(run);
    save();
  };

  // ---------- Unlock shop ----------
  G.boonLevel = (id) => G.meta.boons[id] || 0;
  G.boonCost = (b) => b.costs[G.boonLevel(b.id)];

  G.buy = function (kind, id) {
    const m = G.meta;
    let cost;
    if (kind === 'boon') {
      const b = G.BOONS.find((x) => x.id === id);
      cost = b && G.boonCost(b);
      if (cost == null || m.genes < cost) return false;
      m.boons[id] = G.boonLevel(id) + 1;
    } else {
      const list = { archetypes: G.ARCHETYPES, origins: G.ORIGINS, packs: G.PACKS }[kind];
      const item = list && list.find((x) => x.id === id);
      if (!item || m.unlocked[kind].includes(id) || m.genes < item.cost) return false;
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
