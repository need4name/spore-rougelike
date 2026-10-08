// Game rules: runs, turns, checks, drafts, evolution and saved progress.
window.G = window.G || {};

(function () {
  const SAVE_META = 'primordia.meta.v1';
  const SAVE_RUN = 'primordia.run.v1';

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

  // ---------- Lookups and helpers ----------
  G.ARCHETYPE = {}; G.ARCHETYPES.forEach((a) => { G.ARCHETYPE[a.id] = a; });
  G.ORIGIN = {}; G.ORIGINS.forEach((o) => { G.ORIGIN[o.id] = o; });

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

  // ---------- Stats and modifiers ----------
  G.keywordCounts = function (run) {
    const counts = {};
    Object.values(run.parts).forEach((pid) => {
      const p = G.PART[pid];
      (p && p.keywords || []).forEach((k) => { counts[k] = (counts[k] || 0) + 1; });
    });
    return counts;
  };

  G.activeSynergies = function (run) {
    const out = [];
    const counts = G.keywordCounts(run);
    Object.keys(counts).forEach((k) => {
      const kw = G.KEYWORDS[k];
      [2, 3].forEach((tier) => { if (counts[k] >= tier) out.push({ keyword: k, tier, mods: kw.tiers[tier].mods }); });
    });
    return out;
  };

  function modSources(run) {
    const list = [];
    list.push(G.ARCHETYPE[run.archetype].mods);
    list.push(G.ORIGIN[run.origin].mods);
    Object.values(run.parts).forEach((pid) => { if (G.PART[pid]) list.push(G.PART[pid].mods); });
    run.traits.forEach((t) => { if (G.TRAITS[t]) list.push(G.TRAITS[t].mods); });
    G.activeSynergies(run).forEach((s) => list.push(s.mods));
    const allies = run.rivals.filter((r) => G.rivalStatus(r) === 'allied').length;
    if (allies) list.push({ foodPerTurn: allies });
    if (run.hostility >= 2) list.push({ upkeep: 1 });
    if (run.hostility >= 4) list.push({ maxHealth: -2 });
    return list;
  }

  G.mod = (run, key) => modSources(run).reduce((s, m) => s + ((m && m[key]) || 0), 0);
  G.stat = (run, key) => Math.max(0, 1 + G.mod(run, key));
  G.maxHealth = (run) => Math.max(3, run.baseMax + G.mod(run, 'maxHealth'));
  G.upkeep = (run) => Math.max(0, G.STAGES[run.stage].upkeep + G.mod(run, 'upkeep'));
  G.diet = (run) => { const m = G.PART[run.parts.mouth]; return (m && m.diet) || 'omni'; };
  G.DIET_NAMES = { herb: 'Herbivore', carn: 'Carnivore', omni: 'Omnivore' };

  // Checks get harder the longer you stay in a stage (up to +3), so stalling is risky.
  G.difficulty = (run, base) => base + Math.min(3, Math.floor((run.stageTurn - 1) / 4)) + run.hostility;
  G.chance = (run, stat, base) => clamp(50 + (G.stat(run, stat) - G.difficulty(run, base)) * 12, 5, 95);

  G.rivalStatus = (r) => (r.opinion >= 50 ? 'allied' : r.opinion <= -50 ? 'hostile' : r.opinion >= 15 ? 'friendly' : r.opinion <= -15 ? 'wary' : 'neutral');

  G.partPool = function (run) {
    const packs = G.meta.unlocked.packs;
    return G.PARTS.filter((p) => p.stage === run.stage && (!p.pack || packs.includes(p.pack)));
  };

  function sub(text, run, rivalIdx) {
    const r = rivalIdx != null ? run.rivals[rivalIdx] : null;
    return String(text || '').replace(/\{rival\}/g, r ? r.name : 'rivals');
  }
  G.sub = sub;

  function log(run, text) {
    const st = G.STAGES[run.stage];
    run.log.unshift({ when: `${st.turnName} ${run.stageTurn}`, stage: run.stage, text });
    if (run.log.length > 60) run.log.length = 60;
  }

  function noteParts(run) {
    let changed = false;
    Object.values(run.parts).forEach((pid) => { if (addUnique(G.meta.codex.parts, pid)) changed = true; });
    return changed;
  }

  // ---------- Rivals ----------
  function makeRivals(n) {
    const used = new Set();
    const out = [];
    while (out.length < n) {
      const name = pick(G.RIVAL_NAMES.first) + pick(G.RIVAL_NAMES.last);
      if (used.has(name)) continue;
      used.add(name);
      out.push({ name, diet: pick(['herb', 'carn', 'omni']), opinion: Math.round(rand() * 30) - 10, hue: Math.floor(rand() * 360) });
    }
    return out;
  }

  // ---------- Starting and ending runs ----------
  G.newRun = function (archetypeId, originId, hostility) {
    const arch = G.ARCHETYPE[archetypeId];
    const b = G.meta.boons;
    const run = {
      archetype: archetypeId, origin: originId, hostility: hostility || 0,
      stage: 'cell', turn: 1, stageTurn: 1,
      baseMax: G.BASE_HEALTH + (b.hardy || 0),
      health: 0, food: G.BASE_FOOD + 2 * (b.pantry || 0),
      dna: 3 * (b.memory || 0), totalDna: 0,
      parts: Object.assign({}, arch.start.cell),
      traits: [], rivals: [], seen: [], log: [],
      draftsTaken: 0, phase: 'action',
      banner: null, event: null, outcome: null, draft: null, legacy: null, result: null, lastEvent: null,
    };
    run.health = G.maxHealth(run);
    log(run, `Life stirs in the ${G.ORIGIN[originId].name}. A new ${arch.name} lineage begins.`);
    run.banner = { title: 'A new lineage', lines: [{ t: 'Pick an action. Every turn ends with an event.' }] };
    G.meta.stats.runs += 1;
    noteParts(run);
    G.run = run;
    G.saveMeta();
    G.saveRun();
    return run;
  };

  G.abandonRun = function () { G.run = null; G.saveRun(); };

  G.endRunEarly = function () {
    if (G.run && G.run.phase !== 'end') endRun(G.run, false, 'You ended this lineage.');
  };

  function endRun(run, victory, cause) {
    const reachedCreature = run.stage === 'creature';
    const base = Math.floor(run.totalDna / 2);
    const stageBonus = reachedCreature ? 10 : 0;
    const winBonus = victory ? 30 : 0;
    const mult = 1 + 0.25 * run.hostility;
    const genes = Math.round((base + stageBonus + winBonus) * mult);
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
    run.result = { victory, cause, genes, breakdown: { base, stageBonus, winBonus, mult } };
    run.phase = 'end';
    log(run, victory ? `${G.LEGACIES[run.legacy].name}: the age of tribes begins.` : `Extinction. ${cause}`);
    G.saveMeta();
    G.saveRun();
  }

  // ---------- Effects ----------
  function gainDna(run, n) {
    const amount = n > 0 ? Math.round(n * G.ORIGIN[run.origin].dnaMult) : n;
    run.dna = Math.max(0, run.dna + amount);
    if (amount > 0) run.totalDna += amount;
    return amount;
  }

  function damage(run, n) {
    const dmg = Math.max(1, n - G.mod(run, 'damageReduce'));
    run.health -= dmg;
    return dmg;
  }

  function heal(run, n) {
    const before = run.health;
    run.health = Math.min(G.maxHealth(run), run.health + n);
    return run.health - before;
  }

  function installPart(run, part) {
    const old = run.parts[part.slot];
    run.parts[part.slot] = part.id;
    addUnique(G.meta.codex.parts, part.id);
    // A part that lowers max Health should not leave you above the new max.
    run.health = Math.min(run.health, G.maxHealth(run));
    return old ? G.PART[old] : null;
  }

  function applyEffects(run, eff, rivalIdx) {
    const lines = [];
    if (!eff) return lines;
    if (eff.health) {
      if (eff.health < 0) lines.push({ t: `−${damage(run, -eff.health)} Health`, bad: true });
      else { const h = heal(run, eff.health); lines.push({ t: h ? `+${h} Health` : 'Health already full' }); }
    }
    if (eff.food) {
      const before = run.food;
      run.food = Math.max(0, run.food + eff.food);
      const d = run.food - before;
      if (d) lines.push({ t: `${d > 0 ? '+' : '−'}${Math.abs(d)} Food`, bad: d < 0 });
    }
    if (eff.dna) { const d = gainDna(run, eff.dna); lines.push({ t: `+${d} DNA`, good: true }); }
    if (eff.trait) {
      if (addUnique(run.traits, eff.trait)) {
        lines.push({ t: `New trait: ${G.TRAITS[eff.trait].name}`, good: true });
        run.health = Math.min(run.health, G.maxHealth(run));
      } else {
        lines.push({ t: `Already ${G.TRAITS[eff.trait].name}: +${gainDna(run, 1)} DNA` });
      }
    }
    if (eff.loseTrait && run.traits.includes(eff.loseTrait)) {
      run.traits = run.traits.filter((t) => t !== eff.loseTrait);
      lines.push({ t: `Lost trait: ${G.TRAITS[eff.loseTrait].name}`, bad: true });
    }
    if (eff.opinion && rivalIdx != null && run.rivals[rivalIdx]) {
      const r = run.rivals[rivalIdx];
      const before = G.rivalStatus(r);
      r.opinion = clamp(r.opinion + eff.opinion, -100, 100);
      const after = G.rivalStatus(r);
      lines.push({ t: `${r.name} opinion ${eff.opinion > 0 ? '+' : '−'}${Math.abs(eff.opinion)}`, bad: eff.opinion < 0 });
      if (before !== after && (after === 'allied' || after === 'hostile')) {
        lines.push({ t: `The ${r.name} are now ${after === 'allied' ? 'your allies' : 'hostile'}`, good: after === 'allied', bad: after === 'hostile' });
      }
    }
    if (eff.randomPart) {
      const options = G.partPool(run).filter((p) => run.parts[p.slot] !== p.id);
      if (options.length) {
        const p = pick(options);
        const old = installPart(run, p);
        lines.push({ t: `Mutation: ${p.name}${old ? ` replaces ${old.name}` : ''}`, good: true });
      }
    }
    if (eff.legacy) run.legacy = eff.legacy;
    return lines;
  }

  // ---------- Actions ----------
  G.actionsFor = function (run) {
    const diet = G.diet(run);
    const cell = run.stage === 'cell';
    const forage = Math.max(1, 2 + G.mod(run, 'forageBonus') + (diet === 'herb' ? 1 : diet === 'carn' ? -1 : 0));
    const huntBase = diet === 'herb' ? 4 : 2;
    const huntFood = 3 + G.mod(run, 'huntBonus') + (diet === 'carn' ? 1 : 0);
    const exploreDna = 3 + G.mod(run, 'exploreBonus');
    const list = [
      { id: 'forage', name: cell ? 'Filter and graze' : 'Forage', desc: `+${forage} Food`, food: forage },
      { id: 'hunt', name: cell ? 'Engulf prey' : 'Hunt', desc: `+${huntFood} Food and +1 DNA, or −1 Health`, check: { stat: 'str', diff: huntBase }, food: huntFood },
      { id: 'rest', name: cell ? 'Divide and heal' : 'Nest', desc: '+2 Health' },
      { id: 'explore', name: cell ? 'Drift into the unknown' : 'Explore', desc: `+${exploreDna} DNA, or +1 DNA`, check: { stat: 'cun', diff: 3 }, dna: exploreDna },
    ];
    if (!cell && run.rivals.length) {
      const target = socialTarget(run);
      list.push({ id: 'socialize', name: `Befriend the ${run.rivals[target].name}`, desc: 'Opinion +20 and +1 DNA, or opinion −5', check: { stat: 'cha', diff: 2 }, target });
    }
    list.forEach((a) => { if (a.check) a.chance = G.chance(run, a.check.stat, a.check.diff); });
    return list;
  };

  // Befriending targets the rival you get on with worst, so you can mend fences.
  function socialTarget(run) {
    let best = 0;
    run.rivals.forEach((r, i) => { if (r.opinion < run.rivals[best].opinion) best = i; });
    return best;
  }

  G.doAction = function (id) {
    const run = G.run;
    if (!run || run.phase !== 'action') return;
    const a = G.actionsFor(run).find((x) => x.id === id);
    if (!a) return;
    let success = null;
    let lines = [];
    if (a.check) success = rand() * 100 < a.chance;
    if (id === 'forage') lines = applyEffects(run, { food: a.food });
    if (id === 'hunt') lines = success ? applyEffects(run, { food: a.food, dna: 1 }) : applyEffects(run, { health: -1 });
    if (id === 'rest') lines = applyEffects(run, { health: 2 });
    if (id === 'explore') lines = applyEffects(run, { dna: success ? a.dna : 1 });
    if (id === 'socialize') lines = success ? applyEffects(run, { opinion: 20, dna: 1 }, a.target) : applyEffects(run, { opinion: -5 }, a.target);
    run.banner = { title: a.name, success, lines };
    if (run.health <= 0) { endRun(run, false, 'Your lineage died out.'); return; }
    drawEvent(run);
    G.saveRun();
    G.saveMeta();
  };

  // ---------- Events ----------
  function rivalFor(run, ev) {
    if (!ev.rival) return null;
    const idx = run.rivals.map((r, i) => i).filter((i) => {
      const s = G.rivalStatus(run.rivals[i]);
      return ev.rival === 'any' || s === ev.rival;
    });
    return idx.length ? pick(idx) : -1;
  }

  function drawEvent(run) {
    let pool = G.EVENTS.filter((e) => !e.finale
      && (e.stage === run.stage || e.stage === 'any')
      && (e.repeat || !run.seen.includes(e.id))
      && (!e.when || e.when(run))
      && rivalFor(run, e) !== -1);
    if (pool.length > 1) pool = pool.filter((e) => e.id !== run.lastEvent);
    const ev = pool.length ? weightedPick(pool, (e) => (e.weight || 1) * (e.origins && e.origins.includes(run.origin) ? 3 : 1)) : G.EVENT.quiet_time;
    run.event = { id: ev.id, rival: rivalFor(run, ev) };
    run.lastEvent = ev.id;
    run.phase = 'event';
  }

  G.optionState = function (run, opt) {
    const req = opt.req || {};
    let reason = null;
    if (req.diet && !req.diet.includes(G.diet(run))) reason = `Needs a ${req.diet.map((d) => G.DIET_NAMES[d]).join(' or ')} mouth`;
    else if (req.keyword && (G.keywordCounts(run)[req.keyword[0]] || 0) < req.keyword[1]) reason = `Needs ${req.keyword[1]} ${G.KEYWORDS[req.keyword[0]].name} part${req.keyword[1] > 1 ? 's' : ''}`;
    else if (req.trait && !run.traits.includes(req.trait)) reason = `Needs the ${G.TRAITS[req.trait].name} trait`;
    else if (req.part && !Object.values(run.parts).includes(req.part)) reason = `Needs ${G.PART[req.part].name}`;
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
    const rivalIdx = run.event.rival;
    const lines = applyEffects(run, res, rivalIdx);
    if (ev.finale && run.stage === 'creature' && !run.legacy) run.legacy = 'survivors';
    run.outcome = {
      title: sub(ev.title, run, rivalIdx),
      label: sub(opt.label, run, rivalIdx),
      text: sub(res && res.text, run, rivalIdx),
      lines, success, finale: !!ev.finale,
      stat: opt.check ? opt.check.stat : null, chance: state.chance,
    };
    addUnique(run.seen, ev.id);
    addUnique(G.meta.codex.events, ev.id);
    log(run, `${run.outcome.title}: ${run.outcome.label}.${success === false ? ' It went badly.' : ''}`);
    run.phase = 'outcome';
    G.saveRun();
    G.saveMeta();
  };

  G.continueOutcome = function () {
    const run = G.run;
    if (!run || run.phase !== 'outcome') return;
    if (run.health <= 0) { endRun(run, false, 'Your lineage died out.'); return; }
    if (run.outcome.finale) {
      if (run.stage === 'cell') evolve(run);
      else endRun(run, true);
      G.saveRun();
      return;
    }
    endTurn(run);
    G.saveRun();
  };

  // ---------- Turn end ----------
  function endTurn(run) {
    const lines = [];
    const st = G.STAGES[run.stage];
    const fpt = G.mod(run, 'foodPerTurn');
    if (fpt > 0) { run.food += fpt; lines.push({ t: `+${fpt} Food from helpers and allies` }); }
    const hpt = G.mod(run, 'healthPerTurn');
    if (hpt > 0) { const h = heal(run, hpt); if (h) lines.push({ t: `+${h} Health from symbionts` }); }
    // Evolution never stops: every turn adds at least 1 DNA.
    const dpt = 1 + G.mod(run, 'dnaPerTurn');
    lines.push({ t: `+${gainDna(run, dpt)} DNA from passing time`, good: true });
    const up = G.upkeep(run);
    run.food -= up;
    lines.push({ t: `−${up} Food eaten` });
    if (run.food < 0) {
      const starve = -run.food;
      run.food = 0;
      run.health -= starve;
      lines.push({ t: `Starving: −${starve} Health`, bad: true });
    }
    run.health = Math.min(run.health, G.maxHealth(run));
    if (run.health <= 0) { endRun(run, false, 'Your lineage starved.'); return; }
    run.banner = { title: `End of ${st.turnName} ${run.stageTurn}`, lines };
    run.turn += 1;
    run.stageTurn += 1;
    nextStep(run);
  }

  // Decide what comes next: a mutation draft, the stage finale, or a new turn.
  function nextStep(run) {
    const st = G.STAGES[run.stage];
    if (run.draftsTaken < st.drafts.length && run.dna >= st.drafts[run.draftsTaken]) { startDraft(run); return; }
    if (run.dna >= st.evolveAt) {
      const ev = G.EVENT[st.finale];
      run.event = { id: ev.id, rival: rivalFor(run, ev) };
      if (run.event.rival === -1) run.event.rival = null;
      run.phase = 'event';
      return;
    }
    run.phase = 'action';
  }

  // ---------- Mutation drafts ----------
  function draftOptions(run) {
    const n = G.meta.boons.choice ? 4 : 3;
    const boost = G.ORIGIN[run.origin].boostKeyword;
    let pool = G.partPool(run).filter((p) => run.parts[p.slot] !== p.id);
    const out = [];
    while (out.length < n && pool.length) {
      const p = weightedPick(pool, (x) => (x.rarity || 2) * (boost && (x.keywords || []).includes(boost) ? 3 : 1));
      out.push(p.id);
      pool = pool.filter((x) => x.id !== p.id);
    }
    return out;
  }

  function startDraft(run) {
    run.draft = { options: draftOptions(run), rerolls: G.meta.boons.reroll ? 1 : 0 };
    run.phase = 'draft';
  }

  G.pickDraft = function (pid) {
    const run = G.run;
    if (!run || run.phase !== 'draft' || !run.draft.options.includes(pid)) return;
    const p = G.PART[pid];
    const old = installPart(run, p);
    log(run, `Mutation: grew ${p.name}${old ? ` in place of ${old.name}` : ''}.`);
    run.banner = { title: 'Mutation', lines: [{ t: `${p.name}${old ? ` replaces ${old.name}` : ` fills your ${p.slot} slot`}`, good: true }] };
    run.draftsTaken += 1;
    run.draft = null;
    nextStep(run);
    G.saveRun();
    G.saveMeta();
  };

  G.skipDraft = function () {
    const run = G.run;
    if (!run || run.phase !== 'draft') return;
    run.food += 2;
    run.banner = { title: 'Mutation skipped', lines: [{ t: '+2 Food' }] };
    run.draftsTaken += 1;
    run.draft = null;
    nextStep(run);
    G.saveRun();
  };

  G.rerollDraft = function () {
    const run = G.run;
    if (!run || run.phase !== 'draft' || run.draft.rerolls < 1) return;
    run.draft.rerolls -= 1;
    run.draft.options = draftOptions(run);
    G.saveRun();
  };

  // ---------- Evolution ----------
  function evolve(run) {
    const diet = G.diet(run);
    const heritage = diet === 'carn' ? 'predator_lineage' : diet === 'herb' ? 'grazer_lineage' : 'adaptable_lineage';
    const cellParts = Object.values(run.parts).map((id) => G.PART[id].name);
    addUnique(run.traits, heritage);
    run.stage = 'creature';
    run.stageTurn = 1;
    run.dna = 3 * (G.meta.boons.memory || 0);
    run.draftsTaken = 0;
    run.parts = Object.assign({}, G.ARCHETYPE[run.archetype].start.creature);
    run.rivals = makeRivals(3);
    run.health = G.maxHealth(run);
    run.lastEvent = null;
    noteParts(run);
    run.evolved = { heritage, cellParts };
    run.banner = { title: 'A new world', lines: [{ t: 'Your herd is fully healed.' }] };
    log(run, `Your lineage leaves the water. It carries the ${G.TRAITS[heritage].name} trait.`);
    run.phase = 'evolved';
    G.saveMeta();
  }

  G.continueEvolved = function () {
    const run = G.run;
    if (!run || run.phase !== 'evolved') return;
    run.phase = 'action';
    G.saveRun();
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
      // For upkeep and damage, lower is better, so word them plainly.
      if (k === 'damageReduce') return `−${v} damage taken`;
      return `${v > 0 ? '+' : '−'}${Math.abs(v)} ${G.MOD_LABELS[k] || k}`;
    }).join(', ');
  };
}());
