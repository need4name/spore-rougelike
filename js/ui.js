// Screens and buttons. Everything is redrawn from the current state after each tap.
window.G = window.G || {};

(function () {
  const app = document.getElementById('app');
  G.ui = { screen: 'title', setup: null, confirmAbandon: false, confirmReset: false, sheet: null };

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const listJoin = (a) => (a.length > 1 ? `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}` : a.join(''));
  const statName = (id) => G.STATS.find((s) => s.id === id).short;

  const ICON = {
    pop: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><circle cx="5.5" cy="5" r="2.4" fill="currentColor"/><circle cx="11" cy="6" r="2" fill="currentColor"/><path fill="currentColor" d="M1.5 13.5c0-2.6 1.8-4.5 4-4.5s4 1.9 4 4.5zM8.5 13.5c.2-1.9 1.3-3.4 2.6-3.4 1.6 0 3 1.5 3 3.4z"/></svg>',
    food: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M2.5 13.5C2.5 6.8 6.8 2.5 13.5 2.5c0 6.7-4.3 11-11 11z"/><path d="M2.5 13.5 9 7" stroke="var(--bg)" stroke-width="1.3" fill="none"/></svg>',
    dna: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4.5 1.5c0 4.5 7 4.5 7 6.5s-7 2-7 6.5M11.5 1.5c0 4.5-7 4.5-7 6.5s7 2 7 6.5"/><path d="M6 4h4M6 12h4" stroke-width="1.2"/></g></svg>',
    insight: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 1.5a4.6 4.6 0 0 0-2.7 8.3c.5.4.7.9.7 1.4v.3h4v-.3c0-.5.2-1 .7-1.4A4.6 4.6 0 0 0 8 1.5zM6 12.5h4v1a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z"/></svg>',
    gene: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 1.2 13.8 8 8 14.8 2.2 8z"/><path fill="var(--bg)" opacity=".35" d="M8 1.2 13.8 8H2.2z"/></svg>',
    close: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  };

  function render() {
    const s = G.ui.screen;
    let html = '';
    if (s === 'title') html = titleScreen();
    else if (s === 'setup') html = setupScreen();
    else if (s === 'unlocks') html = unlocksScreen();
    else if (s === 'codex') html = codexScreen();
    else if (s === 'game') html = G.run ? gameScreen(G.run) : titleScreen();
    if (G.stopScene) G.stopScene();
    app.innerHTML = html;
    app.dataset.screen = s;
    if (s === 'game' && G.run) paintCanvases(G.run);
  }
  G.render = render;

  function paintCanvases(run) {
    app.querySelectorAll('canvas.portrait').forEach((c) => G.drawPortrait(c, run));
    const scene = app.querySelector('canvas.scene');
    if (scene) {
      const sc = run.scene || {};
      const anim = ['scene', 'mutated'].includes(run.phase) ? sc.anim : run.phase === 'evolved' ? 'grow' : 'rest';
      G.playScene(scene, run, anim, run.phase === 'scene' ? sc.species : null);
    }
  }

  function go(screen) {
    G.ui.screen = screen;
    G.ui.confirmAbandon = false;
    G.ui.confirmReset = false;
    G.ui.sheet = null;
    render();
    window.scrollTo(0, 0);
  }

  // ---------- Title ----------
  function titleScreen() {
    const m = G.meta;
    const live = G.run && G.run.phase !== 'end';
    return `
      <main class="title-screen">
        <div class="title-mark">
          <p class="eyebrow">An evolution roguelike</p>
          <h1>Primordia</h1>
          <p class="lede">Guide one lineage from a single cell to the first spark of a people. Events shape its body, its mind and its story. When it goes extinct, its genetic memory makes the next one stronger.</p>
        </div>
        <div class="menu">
          ${live ? `<button class="btn primary" data-act="continue">Continue lineage <small>${esc(G.STAGES[G.run.stage].name)}, ${esc(G.STAGES[G.run.stage].turnName)} ${G.run.stageTurn}</small></button>` : ''}
          <button class="btn ${live ? '' : 'primary'}" data-act="setup">New lineage</button>
          <button class="btn" data-act="go" data-arg="unlocks">Unlocks <span class="gene-count">${ICON.gene} ${m.genes}</span></button>
          <button class="btn" data-act="go" data-arg="codex">Codex of Life</button>
        </div>
        <dl class="record">
          <div><dt>Lineages</dt><dd>${m.stats.runs}</dd></div>
          <div><dt>Became a people</dt><dd>${m.stats.wins}</dd></div>
          <div><dt>Most DNA</dt><dd>${m.stats.bestDna || 0}</dd></div>
        </dl>
        <details class="howto">
          <summary>How to play</summary>
          <ol>
            <li>Every turn, something happens to your lineage. Choose how to respond. Buttons show your chance of success, and some choices need the right parts or traits.</li>
            <li>Tap your creature's portrait (top left) to see its body, traits, the species around you and more.</li>
            <li>Your <b>Instinct</b> (top right) decides how you find food and which events find you.</li>
            <li>Each turn your Population eats Food. Spare Food grows your Population. Run out and you starve.</li>
            <li>DNA brings mutations. Later, mutations can <b>merge</b> with the part already in a slot instead of replacing it.</li>
            <li>Milestones change everything: becoming multicellular, leaving the sea (or not), the Age of Giants, and the Spark of Mind.</li>
            <li>Every run earns Genetic Memory, win or lose. Spend it on archetypes, home worlds, part packs and permanent boosts.</li>
          </ol>
        </details>
      </main>`;
  }

  // ---------- New run setup ----------
  function setupScreen() {
    const m = G.meta;
    const st = G.ui.setup;
    const card = (kind, item, selected, unlocked) => `
      <button class="choice ${selected ? 'selected' : ''}" ${unlocked ? `data-act="pick-${kind}" data-arg="${item.id}"` : 'disabled'} aria-pressed="${selected}">
        <span class="choice-head"><span class="swatch" style="--h:${item.color != null ? item.color : item.hue}"></span><strong>${esc(item.name)}</strong>${unlocked ? '' : `<span class="lock">${ICON.gene} ${item.cost} in Unlocks</span>`}</span>
        <span class="choice-desc">${esc(item.desc)}</span>
      </button>`;
    const hostility = m.maxHostility > 0 ? `
      <section class="setup-group">
        <h2>Hostility</h2>
        <p class="note">Harder worlds give more Genetic Memory (+25% per level). Level 2 and up: eat 1 more Food. Level 4 and up: −2 max Population. Every level makes checks harder.</p>
        <div class="segmented">${Array.from({ length: m.maxHostility + 1 }, (_, i) => `<button class="seg ${st.hostility === i ? 'selected' : ''}" data-act="pick-hostility" data-arg="${i}" aria-pressed="${st.hostility === i}">${i}</button>`).join('')}</div>
      </section>` : '';
    return `
      <main class="setup">
        <header class="screen-head"><button class="btn ghost" data-act="go" data-arg="title">Back</button><h1>New lineage</h1></header>
        <section class="setup-group"><h2>Archetype</h2><div class="choices">${G.ARCHETYPES.map((a) => card('archetype', a, st.archetype === a.id, m.unlocked.archetypes.includes(a.id))).join('')}</div></section>
        <section class="setup-group"><h2>Home world</h2><div class="choices">${G.ORIGINS.map((o) => card('origin', o, st.origin === o.id, m.unlocked.origins.includes(o.id))).join('')}</div></section>
        ${hostility}
        <div class="sticky-cta"><button class="btn primary wide" data-act="begin">Begin in the ${esc(G.ORIGIN[st.origin].name)}</button></div>
      </main>`;
  }

  // ---------- Game: top bar ----------
  function topBar(run) {
    const st = G.STAGES[run.stage];
    const max = G.maxPop(run);
    const inc = G.income(run);
    const up = G.upkeep(run);
    const net = inc.total - up;
    const goal = nextGoal(run);
    const pct = goal ? Math.min(100, (run.dna / goal.at) * 100) : 100;
    const era = run.stage === 'creature' ? ` · ${G.ERAS[run.era]}` : run.multicellular ? ' · Multicellular' : '';
    const fasc = run.fascination && G.INNOVATION[run.fascination];
    return `
      <header class="topbar">
        <button class="portrait-btn" data-act="sheet" data-arg="body" aria-label="Open your lineage"><canvas class="portrait"></canvas></button>
        <div class="tb-main">
          <div class="tb-title"><strong>${esc(st.name)}</strong><span>${esc(st.turnName)} ${run.stageTurn}${esc(era)}</span></div>
          <div class="res-row">
            <span class="res pop ${run.pop <= 2 ? 'warn' : ''}" title="Population. At 0 your lineage is extinct.">${ICON.pop}<b>${run.pop}</b>/${max}</span>
            <span class="res food ${net < 0 && run.food < -net * 2 ? 'warn' : ''}" title="Food. Gathered ${inc.total}, eaten ${up} per turn.">${ICON.food}<b>${run.food}</b><i class="${net < 0 ? 'neg' : ''}">${net >= 0 ? '+' : '−'}${Math.abs(net)}</i></span>
            ${run.mind ? `<span class="res insight" title="Insight toward ${fasc ? fasc.name : 'nothing yet'}">${ICON.insight}<b>${run.insight}</b>${fasc ? `/${fasc.cost}` : ''}</span>` : ''}
          </div>
          <div class="evo" title="DNA">
            <span class="evo-label">${ICON.dna}<b>${run.dna}</b>${goal ? ` / ${goal.at} · ${esc(goal.label)}` : ''}</span>
            <span class="evo-bar"><span class="fill" style="width:${pct}%"></span></span>
          </div>
        </div>
        <button class="instinct-btn" data-act="sheet" data-arg="instinct"><span>Instinct</span><b>${esc(G.INSTINCT[run.instinct].name)}</b></button>
      </header>`;
  }

  // The next thing DNA is working toward, for the progress bar.
  function nextGoal(run) {
    const st = G.STAGES[run.stage];
    const goals = [];
    st.drafts.slice(run.draftsTaken).forEach((d) => goals.push({ at: d, label: 'mutation' }));
    st.milestones.filter((m) => !run.milestonesDone.includes(m.event)).forEach((m) => goals.push({ at: m.at, label: G.EVENT[m.event].title }));
    if (st.evolveAt) goals.push({ at: st.evolveAt, label: 'the shore' });
    goals.sort((a, b) => a.at - b.at);
    return goals.find((g) => g.at > run.dna) || null;
  }

  // ---------- Game: main panel ----------
  function lines(list) {
    if (!list || !list.length) return '';
    return `<ul class="effects">${list.map((l) => `<li class="${l.bad ? 'bad' : l.good ? 'good' : ''}">${esc(l.t)}</li>`).join('')}</ul>`;
  }

  function chanceTag(stat, chance) {
    const cls = chance >= 70 ? 'good' : chance <= 35 ? 'bad' : '';
    return `<span class="chance ${cls}">${statName(stat)} · ${chance}%</span>`;
  }

  function reqTag(opt) {
    const r = opt.req;
    if (!r) return '';
    if (r.keyword) return `<span class="kw" style="--kw:${G.KEYWORDS[r.keyword[0]].color}">${G.KEYWORDS[r.keyword[0]].name}</span>`;
    if (r.diet) return `<span class="kw">${r.diet.map((d) => G.DIET_NAMES[d]).join(' / ')}</span>`;
    if (r.part) return `<span class="kw">${esc(G.PART[r.part].name)}</span>`;
    if (r.trait) return `<span class="kw">${esc(G.TRAITS[r.trait].name)}</span>`;
    if (r.tag === 'grasp') return '<span class="kw">Grasp</span>';
    if (r.innovation) return `<span class="kw">${esc(G.INNOVATION[r.innovation].name)}</span>`;
    if (r.food) return `<span class="kw">Costs ${r.food} Food</span>`;
    return '';
  }

  function recap(run) {
    const bits = [];
    (run.notices || []).forEach((n) => bits.push(`<p class="notice">${esc(n)}</p>`));
    if (run.lastTurn) bits.push(`<details class="recap"><summary>${esc(run.lastTurn.title)} passed</summary>${lines(run.lastTurn.lines)}</details>`);
    return bits.join('');
  }

  function eventCard(run) {
    const ev = G.EVENT[run.event.id];
    const sp = run.event.species;
    const s = sp != null ? run.species[sp] : null;
    const kind = ev.finale ? 'Finale' : ev.milestone ? 'Milestone' : 'Event';
    return `
      ${recap(run)}
      <article class="card event ${ev.finale || ev.milestone ? 'finale' : ''}">
        <p class="eyebrow">${kind}${s ? ` · <span class="sp-tag" style="--h:${s.hue}">${esc(s.name)}, ${G.ROLES[s.role].toLowerCase()}</span>` : ''}</p>
        <h2>${esc(G.sub(ev.title, run, sp))}</h2>
        <p class="event-text">${esc(G.sub(ev.text, run, sp))}</p>
        <div class="options">
          ${ev.options.map((o, i) => {
            const st = G.optionState(run, o);
            return `
            <button class="option ${st.ok ? '' : 'locked'}" ${st.ok ? `data-act="option" data-arg="${i}"` : 'disabled'}>
              <span class="opt-label">${reqTag(o)}${esc(G.sub(o.label, run, sp))}</span>
              <span class="opt-meta">${st.ok ? `${o.check ? chanceTag(o.check.stat, st.chance) : '<span class="chance sure">Certain</span>'}${o.hint ? `<span>${esc(o.hint)}</span>` : ''}` : `<span class="reason">${esc(st.reason)}</span>`}</span>
            </button>`;
          }).join('')}
        </div>
      </article>`;
  }

  function sceneCard(run) {
    const sc = run.scene;
    const tag = sc.success === true ? '<span class="pill good">Success</span>' : sc.success === false ? '<span class="pill bad">Failed</span>' : '';
    let cta = 'Continue';
    if (run.pop <= 0) cta = 'See what remains';
    else if (sc.finale && sc.won) cta = run.stage === 'cell' ? (sc.habitat === 'sea' ? 'Into the open sea' : 'Onto the land') : 'Begin the age of peoples';
    return `
      <div class="scene-wrap"><canvas class="scene" aria-hidden="true"></canvas></div>
      <article class="card outcome">
        <p class="eyebrow">${esc(sc.title)}</p>
        <h2>${esc(sc.label)} ${tag}</h2>
        ${sc.text ? `<p class="event-text">${esc(sc.text)}</p>` : ''}
        ${sc.stat ? `<p class="note">${statName(sc.stat)} check at ${sc.chance}%.</p>` : ''}
        ${lines(sc.lines)}
        <button class="btn primary wide" data-act="continue-scene">${cta}</button>
      </article>`;
  }

  function mutatedCard(run) {
    return `
      <div class="scene-wrap"><canvas class="scene" aria-hidden="true"></canvas></div>
      <article class="card outcome">
        <p class="eyebrow">Mutation</p>
        <h2>${esc(run.scene.label)}</h2>
        <button class="btn primary wide" data-act="continue-mutation">Continue</button>
      </article>`;
  }

  function draftCard(run) {
    const d = run.draft;
    const counts = G.keywordCounts(run);
    const merging = G.canMerge(run);
    return `
      ${recap(run)}
      <article class="card draft">
        <p class="eyebrow">Mutation</p>
        <h2>Choose a new part</h2>
        <p class="note">${merging ? 'Grow it into an empty slot, merge it with the part already there (keeping both), or replace that part.' : 'It goes into its slot, replacing whatever is there. Once you are multicellular, parts can merge instead.'}</p>
        <div class="draft-list">
          ${d.options.map((pid) => {
            const p = G.PART[pid];
            const slot = run.parts[p.slot];
            const slotName = G.slotName(run, p.slot);
            const canMergeHere = merging && slot && !slot.merged;
            const syn = (p.keywords || []).map((k) => {
              const have = (counts[k] || 0) + 1;
              return have >= 2 ? `<span class="syn-hint" style="--kw:${G.KEYWORDS[k].color}">${G.KEYWORDS[k].name} ${have}: ${esc(G.KEYWORDS[k].tiers[Math.min(3, have)].desc)}</span>` : '';
            }).join('');
            const buttons = !slot
              ? `<button class="btn small primary" data-act="draft" data-arg="${pid}" data-mode="grow">Grow it</button>`
              : `${canMergeHere ? `<button class="btn small primary" data-act="draft" data-arg="${pid}" data-mode="merge">Merge: ${esc(p.adj)} ${esc(G.PART[slot.id].name)}</button>` : ''}<button class="btn small ${canMergeHere ? '' : 'primary'}" data-act="draft" data-arg="${pid}" data-mode="replace">Replace ${esc(G.slotLabel(slot))}</button>`;
            return `
            <div class="part-card">
              <span class="opt-slot">${esc(slotName)}${slot ? ` · now ${esc(G.slotLabel(slot))}` : ' · empty'}</span>
              <span class="opt-label">${esc(p.name)}${kwTags(p)}</span>
              <span class="opt-meta"><span>${esc(G.describeMods(p.mods))}${p.diet ? ` · ${G.DIET_NAMES[p.diet]}` : ''}${(p.tags || []).includes('grasp') ? ' · Can grasp' : ''}</span></span>
              <span class="opt-desc">${esc(p.desc)}</span>
              ${syn}
              <div class="row tight">${buttons}</div>
            </div>`;
          }).join('')}
        </div>
        <div class="row">
          ${d.rerolls > 0 ? `<button class="btn" data-act="reroll">Reroll (${d.rerolls})</button>` : ''}
          <button class="btn ghost" data-act="skip-draft">Skip for +3 Food</button>
        </div>
      </article>`;
  }

  function mindCard(run) {
    return `
      ${recap(run)}
      <article class="card finale">
        <p class="eyebrow">The Mind</p>
        <h2>What fascinates your kind?</h2>
        <p class="note">Insight flows into this each turn (${G.insightPerTurn(run)} per turn now). Two innovations in a tier open the next tier. Self-Awareness ends the Creature stage.</p>
        ${mindTree(run, true)}
      </article>`;
  }

  function mindTree(run, choosing) {
    const tiers = [1, 2, 3, 4];
    return `<div class="mind-tree">${tiers.map((tier) => `
      <section class="tier"><h3>Tier ${tier}</h3><div class="inv-list">
        ${G.INNOVATIONS.filter((i) => i.tier === tier).map((inv) => {
          const done = run.innovations.includes(inv.id);
          const av = G.innovationAvailable(run, inv);
          const current = run.fascination === inv.id;
          const clickable = !done && av.ok && !current;
          return `<button class="inv ${done ? 'done' : ''} ${current ? 'current' : ''}" ${clickable ? `data-act="fascinate" data-arg="${inv.id}"` : 'disabled'}>
            <span class="inv-head"><strong>${esc(inv.name)}</strong><span>${done ? 'Known' : current ? `Researching ${run.insight}/${inv.cost}` : `${ICON.insight} ${inv.cost}`}</span></span>
            <span class="inv-mods">${esc(G.describeMods(inv.mods))}</span>
            <span class="inv-desc">${esc(inv.desc)}</span>
            ${!done && !av.ok ? `<span class="reason">${esc(av.reason)}</span>` : ''}
          </button>`;
        }).join('')}
      </div></section>`).join('')}</div>${choosing ? '' : ''}`;
  }

  function evolvedCard(run) {
    const e = run.evolved;
    const tr = G.TRAITS[e.heritage];
    const sea = run.habitat === 'sea';
    return `
      <div class="scene-wrap"><canvas class="scene" aria-hidden="true"></canvas></div>
      <article class="card finale">
        <p class="eyebrow">Creature Stage · ${sea ? 'Sea' : 'Land'}</p>
        <h2>${sea ? 'Your lineage rules the open sea' : 'Your lineage walks on land'}</h2>
        <p class="event-text">Generations pass. Your ancestors' ${esc(listJoin(e.cellParts).toLowerCase())} become something new. ${sea ? 'Your pod swims into waters' : 'Your herd steps into a valley'} already full of life: ${esc(listJoin(run.species.map((s) => `the ${s.name}`)))}.</p>
        <div class="callout"><strong>Heritage: ${esc(tr.name)}</strong><span>${esc(G.describeMods(tr.mods))}. ${esc(tr.desc)}</span></div>
        <p class="note">Your traits came with you. Your new body has ${G.slotsFor(run).length} slots, from ${sea ? 'fins to tail' : 'front limbs and hands to hind legs and feet'}. Mutations can merge from the start.</p>
        <button class="btn primary wide" data-act="continue-evolved">${sea ? 'Swim on' : 'Enter the valley'}</button>
      </article>`;
  }

  function endCard(run) {
    const r = run.result;
    const leg = run.legacy && G.LEGACIES[run.legacy];
    const b = r.breakdown;
    return `
      <div class="scene-wrap"><canvas class="scene" aria-hidden="true"></canvas></div>
      <article class="card end ${r.victory ? 'finale' : ''}">
        <p class="eyebrow">${r.victory ? 'Prototype complete' : 'Extinction'}</p>
        <h2>${r.victory ? esc(leg.name) : 'Your lineage is gone'}</h2>
        <p class="event-text">${r.victory ? `${esc(leg.desc)} The Tribe stage is coming in a future update.` : `${esc(r.cause)} It lasted ${run.turn} turns and reached the ${esc(G.STAGES[run.stage].name)}${run.stage === 'creature' ? ` (${esc(G.ERAS[run.era])})` : ''}.`}</p>
        <div class="callout gene">
          <strong>${ICON.gene} +${r.genes} Genetic Memory</strong>
          <span>${b.base} from DNA collected${b.progress ? ` · +${b.progress} for milestones reached` : ''}${b.winBonus ? ` · +${b.winBonus} for becoming a people` : ''}${b.mult > 1 ? ` · ×${b.mult} hostility` : ''}</span>
        </div>
        <div class="row">
          <button class="btn primary" data-act="setup">New lineage</button>
          <button class="btn" data-act="go" data-arg="unlocks">Spend memory</button>
        </div>
      </article>`;
  }

  function mainPanel(run) {
    switch (run.phase) {
      case 'event': return eventCard(run);
      case 'scene': return sceneCard(run);
      case 'mutated': return mutatedCard(run);
      case 'draft': return draftCard(run);
      case 'mind': return mindCard(run);
      case 'evolved': return evolvedCard(run);
      case 'end': return endCard(run);
      default: return '';
    }
  }

  // ---------- Character sheet ----------
  function kwTags(p) {
    return (p.keywords || []).map((k) => `<span class="kw" style="--kw:${G.KEYWORDS[k].color}">${G.KEYWORDS[k].name}</span>`).join('');
  }

  function bodyTab(run) {
    const counts = G.keywordCounts(run);
    const slots = G.SLOTS[run.plan];
    return `
      <div class="stats">${G.STATS.map((s) => `<div class="stat" title="${s.name}"><span>${s.short}</span><b>${G.stat(run, s.id)}</b></div>`).join('')}</div>
      <ul class="parts">${slots.map((slot) => {
        const locked = slot.multi && !run.multicellular;
        const s = run.parts[slot.id];
        if (locked) return `<li class="locked-slot"><span class="slot">${slot.name}</span><span class="pname muted">Opens when multicellular</span></li>`;
        if (!s) return `<li><span class="slot">${slot.name}</span><span class="pname muted">Empty</span></li>`;
        const ids = [s.id].concat(s.merged ? [s.merged] : []);
        const mods = {};
        ids.forEach((id) => Object.entries(G.PART[id].mods).forEach(([k, v]) => { mods[k] = (mods[k] || 0) + v; }));
        return `<li><span class="slot">${slot.name}</span><span class="pname">${esc(G.slotLabel(s))}${ids.map((id) => kwTags(G.PART[id])).join('')}</span><span class="pmods">${esc(G.describeMods(mods))}${slot.id === 'mouth' ? ` · ${G.DIET_NAMES[G.diet(run)]}` : ''}${s.merged ? ` · merged from ${esc(G.PART[s.id].name)} and ${esc(G.PART[s.merged].name)}` : ''}</span></li>`;
      }).join('')}</ul>
      <h3>Synergies</h3>
      ${Object.keys(counts).length ? `<ul class="synergies">${Object.keys(counts).map((k) => {
        const kw = G.KEYWORDS[k]; const n = counts[k];
        return `<li class="syn ${n >= 2 ? 'on' : ''}" style="--kw:${kw.color}"><span class="syn-name">${kw.name} <b>${n}</b></span><span class="syn-tier ${n >= 2 ? 'on' : ''}">2: ${esc(kw.tiers[2].desc)}</span><span class="syn-tier ${n >= 3 ? 'on' : ''}">3: ${esc(kw.tiers[3].desc)}</span></li>`;
      }).join('')}</ul>` : '<p class="empty">No keywords yet. Collect parts with matching keywords (Venom, Armor, Swift, Glow, Symbiont) to unlock bonuses.</p>'}`;
  }

  function traitsTab(run) {
    const list = run.traits.map((t) => ({ name: G.TRAITS[t].name, mods: G.TRAITS[t].mods, desc: G.TRAITS[t].desc }))
      .concat(run.innovations.map((i) => ({ name: G.INNOVATION[i].name, mods: G.INNOVATION[i].mods, desc: 'Innovation' })));
    if (!list.length) return '<p class="empty">No traits yet. Events will shape who your lineage becomes.</p>';
    return `<ul class="traits">${list.map((tr) => `<li><strong>${esc(tr.name)}</strong><span>${esc(G.describeMods(tr.mods))}</span><em>${esc(tr.desc)}</em></li>`).join('')}</ul>`;
  }

  function instinctTab(run) {
    const inc = G.income(run);
    const up = G.upkeep(run);
    return `
      <div class="economy">
        <p><b>Each turn</b>: gather ${inc.total} Food (${inc.parts.map((p) => `${esc(p.label)} ${p.v >= 0 ? '+' : '−'}${Math.abs(p.v)}`).join(', ')}), eat ${up} (half your Population, rounded up).</p>
        <p>Spare Food grows your Population by 1 for every ${G.growthCost(run)} Food, once per turn. You can store up to ${G.foodCap(run)} Food; the rest spoils.</p>
        <p>DNA per turn: ${G.dnaPerTurn(run)}.${run.mind ? ` Insight per turn: ${G.insightPerTurn(run)}.` : ''}</p>
      </div>
      <div class="instincts">${G.INSTINCTS.map((ins) => `
        <button class="choice ${run.instinct === ins.id ? 'selected' : ''}" data-act="instinct" data-arg="${ins.id}" aria-pressed="${run.instinct === ins.id}">
          <span class="choice-head"><strong>${esc(ins.name)}</strong></span>
          <span class="choice-desc">${esc(ins.desc)}</span>
        </button>`).join('')}</div>
      <p class="note">You can change your Instinct at any time. It takes effect at the end of the turn.</p>`;
  }

  function worldTab(run) {
    return `<ul class="rivals">${run.species.map((s) => {
      const st = G.speciesStatus(s);
      const pct = (s.opinion + 100) / 2;
      return `<li class="rival ${st}">
        <span class="rival-name"><span class="swatch" style="--h:${s.hue}"></span>${esc(s.name)}<small>${G.ROLES[s.role]} · ${G.DIET_NAMES[s.diet]}</small></span>
        <span class="opinion"><span class="opinion-bar"><span style="left:${pct}%"></span></span><span class="status">${st[0].toUpperCase() + st.slice(1)} ${s.opinion > 0 ? '+' : ''}${s.opinion}</span></span>
      </li>`;
    }).join('')}</ul><p class="note">Allied species (+50) give +1 Food per turn. Hostile species (−50) attack you.</p>`;
  }

  function chronicleTab(run) {
    return `<ol class="log">${run.log.map((e) => `<li><span class="when">${esc(e.when)}</span>${esc(e.text)}</li>`).join('')}</ol>`;
  }

  function sheet(run) {
    const tab = G.ui.sheet;
    if (!tab) return '';
    const tabs = [['body', 'Body'], ['traits', 'Traits'], ['instinct', 'Instinct'], ['world', 'World'], ...(run.mind ? [['mind', 'Mind']] : []), ['log', 'Chronicle']];
    const panel = { body: bodyTab, traits: traitsTab, instinct: instinctTab, world: worldTab, mind: (r) => mindTree(r, false), log: chronicleTab }[tab](run);
    const arch = G.ARCHETYPE[run.archetype];
    const where = run.stage === 'cell' ? 'Primordial sea' : run.habitat === 'sea' ? 'Open sea' : 'Land';
    return `
      <div class="sheet-backdrop" data-act="close-sheet"></div>
      <aside class="sheet" role="dialog" aria-modal="true" aria-label="Your lineage">
        <header class="sheet-head">
          <canvas class="portrait big"></canvas>
          <div><h2>${esc(arch.name)} lineage</h2><p class="note">${G.DIET_NAMES[G.diet(run)]} · ${where} · ${esc(G.ORIGIN[run.origin].name)}</p></div>
          <button class="btn ghost small icon" data-act="close-sheet" aria-label="Close">${ICON.close}</button>
        </header>
        <div class="tabs" role="tablist">${tabs.map(([id, label]) => `<button role="tab" class="tab ${id === tab ? 'on' : ''}" aria-selected="${id === tab}" data-act="sheet" data-arg="${id}">${label}</button>`).join('')}</div>
        <div class="sheet-body">${panel}
          ${run.phase !== 'end' ? `<div class="abandon">${G.ui.confirmAbandon
            ? '<span>End this lineage? You keep Genetic Memory for what you achieved.</span><button class="btn small danger" data-act="abandon-yes">End it</button><button class="btn small ghost" data-act="abandon-no">Keep going</button>'
            : '<button class="btn small ghost" data-act="abandon">End this lineage</button>'}</div>` : ''}
        </div>
      </aside>`;
  }

  function gameScreen(run) {
    return `
      <div class="game">
        ${topBar(run)}
        <main class="main-panel">${mainPanel(run)}</main>
        ${sheet(run)}
      </div>`;
  }

  // ---------- Unlocks ----------
  function unlocksScreen() {
    const m = G.meta;
    const item = (kind, it) => {
      const owned = m.unlocked[kind].includes(it.id);
      const afford = m.genes >= it.cost;
      return `<li class="shop-item ${owned ? 'owned' : ''}">
        <div><strong>${esc(it.name)}</strong><p>${esc(it.desc)}</p></div>
        ${owned ? '<span class="owned-tag">Unlocked</span>' : `<button class="btn small ${afford ? 'primary' : ''}" ${afford ? `data-act="buy" data-kind="${kind}" data-arg="${it.id}"` : 'disabled'}>${ICON.gene} ${it.cost}</button>`}
      </li>`;
    };
    const boon = (b) => {
      const lvl = G.boonLevel(b.id);
      const cost = G.boonCost(b);
      const maxed = cost == null;
      const afford = !maxed && m.genes >= cost;
      return `<li class="shop-item ${maxed ? 'owned' : ''}">
        <div><strong>${esc(b.name)} <span class="lvl">${lvl}/${b.costs.length}</span></strong><p>${esc(b.desc)}</p></div>
        ${maxed ? '<span class="owned-tag">Maxed</span>' : `<button class="btn small ${afford ? 'primary' : ''}" ${afford ? `data-act="buy" data-kind="boon" data-arg="${b.id}"` : 'disabled'}>${ICON.gene} ${cost}</button>`}
      </li>`;
    };
    return `
      <main class="shop">
        <header class="screen-head"><button class="btn ghost" data-act="go" data-arg="title">Back</button><h1>Unlocks</h1><span class="gene-count big">${ICON.gene} ${m.genes}</span></header>
        <p class="note">Genetic Memory is earned from every lineage, even ones that go extinct.</p>
        <section><h2>Archetypes</h2><ul class="shop-list">${G.ARCHETYPES.filter((a) => a.cost).map((a) => item('archetypes', a)).join('')}</ul></section>
        <section><h2>Home worlds</h2><ul class="shop-list">${G.ORIGINS.filter((o) => o.cost).map((o) => item('origins', o)).join('')}</ul></section>
        <section><h2>Mutation packs</h2><ul class="shop-list">${G.PACKS.map((p) => item('packs', p)).join('')}</ul></section>
        <section><h2>Ancestral boons</h2><ul class="shop-list">${G.BOONS.map(boon).join('')}</ul></section>
        <section class="reset">${G.ui.confirmReset
          ? '<span>Erase all progress, unlocks and the current lineage?</span><button class="btn small danger" data-act="reset-yes">Erase everything</button><button class="btn small ghost" data-act="reset-no">Cancel</button>'
          : '<button class="btn small ghost" data-act="reset">Reset all progress</button>'}</section>
      </main>`;
  }

  // ---------- Codex ----------
  function codexScreen() {
    const c = G.meta.codex;
    const events = G.EVENTS;
    const seenEvents = events.filter((e) => c.events.includes(e.id)).length;
    const seenParts = G.PARTS.filter((p) => c.parts.includes(p.id)).length;
    const legacies = Object.keys(G.LEGACIES);
    const group = (filter) => `<ul class="codex-grid">${G.PARTS.filter(filter).map((p) => (c.parts.includes(p.id)
      ? `<li><strong>${esc(p.name)}</strong>${kwTags(p)}<span>${esc(G.describeMods(p.mods))}</span></li>`
      : '<li class="unknown"><strong>???</strong></li>')).join('')}</ul>`;
    return `
      <main class="codex">
        <header class="screen-head"><button class="btn ghost" data-act="go" data-arg="title">Back</button><h1>Codex of Life</h1></header>
        <section><h2>Endings <span class="count">${c.legacies.length} / ${legacies.length}</span></h2>
          <ul class="codex-grid">${legacies.map((id) => (c.legacies.includes(id) ? `<li><strong>${esc(G.LEGACIES[id].name)}</strong><span>${esc(G.LEGACIES[id].desc)}</span></li>` : '<li class="unknown"><strong>???</strong></li>')).join('')}</ul>
        </section>
        <section><h2>Events <span class="count">${seenEvents} / ${events.length}</span></h2>
          <ul class="codex-grid">${events.map((e) => (c.events.includes(e.id) ? `<li><strong>${esc(e.title.replace(/\{them\}/g, 'Others'))}</strong><span>${e.stage === 'any' ? 'Any stage' : G.STAGES[e.stage].name}${e.habitat ? ` · ${e.habitat === 'sea' ? 'Sea' : 'Land'}` : ''}</span></li>` : '<li class="unknown"><strong>???</strong></li>')).join('')}</ul>
        </section>
        <section><h2>Cell parts <span class="count">${seenParts} / ${G.PARTS.length} parts found</span></h2>${group((p) => p.stage === 'cell')}</section>
        <section><h2>Land creature parts</h2>${group((p) => p.stage === 'creature' && p.habitat !== 'sea')}</section>
        <section><h2>Sea creature parts</h2>${group((p) => p.stage === 'creature' && p.habitat !== 'land')}</section>
      </main>`;
  }

  // ---------- Input ----------
  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const act = el.dataset.act;
    const arg = el.dataset.arg;
    let toTop = false;
    switch (act) {
      case 'go': go(arg); return;
      case 'continue': go('game'); return;
      case 'setup':
        G.ui.setup = G.ui.setup || { archetype: 'drifter', origin: 'tidal', hostility: 0 };
        if (!G.meta.unlocked.archetypes.includes(G.ui.setup.archetype)) G.ui.setup.archetype = 'drifter';
        if (!G.meta.unlocked.origins.includes(G.ui.setup.origin)) G.ui.setup.origin = 'tidal';
        G.ui.setup.hostility = Math.min(G.ui.setup.hostility, G.meta.maxHostility);
        go('setup'); return;
      case 'pick-archetype': G.ui.setup.archetype = arg; break;
      case 'pick-origin': G.ui.setup.origin = arg; break;
      case 'pick-hostility': G.ui.setup.hostility = Number(arg); break;
      case 'begin': G.newRun(G.ui.setup.archetype, G.ui.setup.origin, G.ui.setup.hostility); go('game'); return;
      case 'option': G.chooseOption(Number(arg)); toTop = true; break;
      case 'continue-scene': G.continueScene(); toTop = true; break;
      case 'continue-mutation': G.continueMutation(); toTop = true; break;
      case 'draft': G.pickDraft(arg, el.dataset.mode); toTop = true; break;
      case 'reroll': G.rerollDraft(); break;
      case 'skip-draft': G.skipDraft(); toTop = true; break;
      case 'fascinate': G.setFascination(arg); toTop = !G.ui.sheet; break;
      case 'continue-evolved': G.continueEvolved(); toTop = true; break;
      case 'instinct': G.setInstinct(arg); break;
      case 'sheet': G.ui.sheet = arg; G.ui.confirmAbandon = false; break;
      case 'close-sheet': G.ui.sheet = null; break;
      case 'abandon': G.ui.confirmAbandon = true; break;
      case 'abandon-no': G.ui.confirmAbandon = false; break;
      case 'abandon-yes': G.endRunEarly(); G.ui.confirmAbandon = false; G.ui.sheet = null; toTop = true; break;
      case 'buy': G.buy(el.dataset.kind, arg); break;
      case 'reset': G.ui.confirmReset = true; break;
      case 'reset-no': G.ui.confirmReset = false; break;
      case 'reset-yes': G.resetAll(); go('title'); return;
      default: return;
    }
    const sheetScroll = app.querySelector('.sheet-body') ? app.querySelector('.sheet-body').scrollTop : 0;
    render();
    if (toTop) window.scrollTo(0, 0);
    else if (G.ui.sheet && act !== 'sheet') { const sb = app.querySelector('.sheet-body'); if (sb) sb.scrollTop = sheetScroll; }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && G.ui.sheet) { G.ui.sheet = null; render(); }
  });

  render();
}());
