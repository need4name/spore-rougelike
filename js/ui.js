// Screens and buttons. Everything is redrawn from the current state after each tap.
window.G = window.G || {};

(function () {
  const app = document.getElementById('app');
  G.ui = { screen: 'title', setup: null, confirmAbandon: false, confirmReset: false, tab: 'body' };

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const ICON = {
    health: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 14.2S1.5 10.4 1.5 5.8A3.3 3.3 0 0 1 8 4.3a3.3 3.3 0 0 1 6.5 1.5c0 4.6-6.5 8.4-6.5 8.4z"/></svg>',
    food: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M2.5 13.5C2.5 6.8 6.8 2.5 13.5 2.5c0 6.7-4.3 11-11 11z"/><path d="M2.5 13.5 9 7" stroke="var(--bg)" stroke-width="1.3" fill="none"/></svg>',
    dna: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4.5 1.5c0 4.5 7 4.5 7 6.5s-7 2-7 6.5M11.5 1.5c0 4.5-7 4.5-7 6.5s7 2 7 6.5"/><path d="M6 4h4M6 12h4" stroke-width="1.2"/></g></svg>',
    gene: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 1.2 13.8 8 8 14.8 2.2 8z"/><path fill="var(--bg)" opacity=".35" d="M8 1.2 13.8 8H2.2z"/></svg>',
  };

  const listJoin = (a) => (a.length > 1 ? `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}` : a.join(''));
  const statName = (id) => G.STATS.find((s) => s.id === id).short;

  function render() {
    const s = G.ui.screen;
    let html = '';
    if (s === 'title') html = titleScreen();
    else if (s === 'setup') html = setupScreen();
    else if (s === 'unlocks') html = unlocksScreen();
    else if (s === 'codex') html = codexScreen();
    else if (s === 'game') html = G.run ? gameScreen(G.run) : titleScreen();
    app.innerHTML = html;
    app.dataset.screen = s;
    const cv = app.querySelector('canvas.organism');
    if (cv && G.run) G.drawOrganism(cv, G.run);
  }
  G.render = render;

  function go(screen) {
    G.ui.screen = screen;
    G.ui.confirmAbandon = false;
    G.ui.confirmReset = false;
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
          <p class="lede">Guide one lineage from a single cell to the first spark of fire. Every choice shapes its body and its story. When it goes extinct, its genetic memory makes the next one stronger.</p>
        </div>
        <div class="menu">
          ${live ? `<button class="btn primary" data-act="continue">Continue lineage <small>${esc(G.STAGES[G.run.stage].name)}, ${esc(G.STAGES[G.run.stage].turnName)} ${G.run.stageTurn}</small></button>` : ''}
          <button class="btn ${live ? '' : 'primary'}" data-act="setup">New lineage</button>
          <button class="btn" data-act="go" data-arg="unlocks">Unlocks <span class="gene-count">${ICON.gene} ${m.genes}</span></button>
          <button class="btn" data-act="go" data-arg="codex">Codex of Life</button>
        </div>
        <dl class="record">
          <div><dt>Lineages</dt><dd>${m.stats.runs}</dd></div>
          <div><dt>Reached the spark</dt><dd>${m.stats.wins}</dd></div>
          <div><dt>Most DNA</dt><dd>${m.stats.bestDna || 0}</dd></div>
        </dl>
        <details class="howto">
          <summary>How to play</summary>
          <ol>
            <li>Each turn, pick an action: gather food, hunt, rest, explore, or (later) befriend other species.</li>
            <li>Then an event happens. Choose how to respond. Some choices roll against a stat and show your chance of success. Some only appear if your body has the right parts or traits.</li>
            <li>Each turn your lineage eats food. Run out and you starve.</li>
            <li>DNA fills your evolution bar. At each marker you choose a new body part. Three parts with the same keyword (Venom, Armor, Swift, Glow, Symbiont) unlock big bonuses.</li>
            <li>Fill the bar to face the stage finale and evolve: Cell, then Creature, then the first spark of fire.</li>
            <li>Every run earns Genetic Memory, win or lose. Spend it on new archetypes, home worlds, part packs and permanent boosts.</li>
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
        <p class="note">Harder worlds give more Genetic Memory (+25% per level). Level 2 and up: +1 food eaten. Level 4 and up: −2 max Health. Every level makes checks harder.</p>
        <div class="segmented">${Array.from({ length: m.maxHostility + 1 }, (_, i) => `<button class="seg ${st.hostility === i ? 'selected' : ''}" data-act="pick-hostility" data-arg="${i}" aria-pressed="${st.hostility === i}">${i}</button>`).join('')}</div>
      </section>` : '';
    return `
      <main class="setup">
        <header class="screen-head"><button class="btn ghost" data-act="go" data-arg="title">Back</button><h1>New lineage</h1></header>
        <section class="setup-group">
          <h2>Archetype</h2>
          <div class="choices">${G.ARCHETYPES.map((a) => card('archetype', a, st.archetype === a.id, m.unlocked.archetypes.includes(a.id))).join('')}</div>
        </section>
        <section class="setup-group">
          <h2>Home world</h2>
          <div class="choices">${G.ORIGINS.map((o) => card('origin', o, st.origin === o.id, m.unlocked.origins.includes(o.id))).join('')}</div>
        </section>
        ${hostility}
        <div class="sticky-cta"><button class="btn primary wide" data-act="begin">Begin in the ${esc(G.ORIGIN[st.origin].name)}</button></div>
      </main>`;
  }

  // ---------- Game ----------
  function resources(run) {
    const max = G.maxHealth(run);
    const up = G.upkeep(run);
    const st = G.STAGES[run.stage];
    const pct = Math.min(100, (run.dna / st.evolveAt) * 100);
    const nextDraft = st.drafts[run.draftsTaken];
    const ticks = st.drafts.map((d, i) => `<span class="tick ${i < run.draftsTaken ? 'done' : ''}" style="left:${(d / st.evolveAt) * 100}%"></span>`).join('');
    const lowFood = run.food < up;
    return `
      <header class="hud">
        <div class="hud-top">
          <div class="stage-name"><strong>${esc(st.name)}</strong><span>${esc(st.turnName)} ${run.stageTurn}${run.hostility ? ` · Hostility ${run.hostility}` : ''}</span></div>
          <button class="btn ghost small" data-act="go" data-arg="title">Menu</button>
        </div>
        <div class="res-row">
          <div class="res health ${run.health <= 3 ? 'warn' : ''}" title="Health. At 0 your lineage goes extinct.">${ICON.health}<b>${run.health}</b><span>/ ${max}</span></div>
          <div class="res food ${lowFood ? 'warn' : ''}" title="Food. You eat ${up} per turn.">${ICON.food}<b>${run.food}</b><span>−${up}/turn</span></div>
          <div class="res dna" title="DNA earned this stage.">${ICON.dna}<b>${run.dna}</b><span>/ ${st.evolveAt}</span></div>
        </div>
        <div class="evo-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${st.evolveAt}" aria-valuenow="${run.dna}" aria-label="Evolution progress">
          <span class="fill" style="width:${pct}%"></span>${ticks}
        </div>
        <p class="evo-note">${nextDraft != null && run.draftsTaken < st.drafts.length ? `Next mutation at ${nextDraft} DNA.` : ''} Evolve at ${st.evolveAt} DNA.</p>
      </header>`;
  }

  function statRow(run) {
    return `<div class="stats">${G.STATS.map((s) => `<div class="stat" title="${s.name}"><span>${s.short}</span><b>${G.stat(run, s.id)}</b></div>`).join('')}</div>`;
  }

  function synergyChips(run) {
    const counts = G.keywordCounts(run);
    const keys = Object.keys(counts);
    if (!keys.length) return '<p class="empty">No keywords yet. Collect matching parts to unlock bonuses.</p>';
    return `<ul class="synergies">${keys.map((k) => {
      const kw = G.KEYWORDS[k]; const n = counts[k];
      const t2 = n >= 2; const t3 = n >= 3;
      return `<li class="syn ${t2 ? 'on' : ''}" style="--kw:${kw.color}">
        <span class="syn-name">${kw.name} <b>${n}</b></span>
        <span class="syn-tier ${t2 ? 'on' : ''}">2: ${esc(kw.tiers[2].desc)}</span>
        <span class="syn-tier ${t3 ? 'on' : ''}">3: ${esc(kw.tiers[3].desc)}</span>
      </li>`;
    }).join('')}</ul>`;
  }

  function partsList(run) {
    return `<ul class="parts">${G.SLOTS[run.stage].map((slot) => {
      const p = G.PART[run.parts[slot.id]];
      return `<li><span class="slot">${slot.name}</span>${p ? `<span class="pname">${esc(p.name)}${kwTags(p)}</span><span class="pmods">${esc(G.describeMods(p.mods))}${p.diet ? ` · ${G.DIET_NAMES[p.diet]}` : ''}</span>` : '<span class="pname muted">Empty</span>'}</li>`;
    }).join('')}</ul>`;
  }

  function kwTags(p) {
    return (p.keywords || []).map((k) => `<span class="kw" style="--kw:${G.KEYWORDS[k].color}">${G.KEYWORDS[k].name}</span>`).join('');
  }

  function traitList(run) {
    if (!run.traits.length) return '<p class="empty">No traits yet. Events will shape who your lineage becomes.</p>';
    return `<ul class="traits">${run.traits.map((t) => {
      const tr = G.TRAITS[t];
      return `<li><strong>${esc(tr.name)}</strong><span>${esc(G.describeMods(tr.mods))}</span><em>${esc(tr.desc)}</em></li>`;
    }).join('')}</ul>`;
  }

  function rivalList(run) {
    if (!run.rivals.length) return '';
    return `<ul class="rivals">${run.rivals.map((r) => {
      const s = G.rivalStatus(r);
      const pct = (r.opinion + 100) / 2;
      return `<li class="rival ${s}">
        <span class="rival-name"><span class="swatch" style="--h:${r.hue}"></span>${esc(r.name)}<small>${G.DIET_NAMES[r.diet]}</small></span>
        <span class="opinion"><span class="opinion-bar"><span style="left:${pct}%"></span></span><span class="status">${s[0].toUpperCase() + s.slice(1)} ${r.opinion > 0 ? '+' : ''}${r.opinion}</span></span>
      </li>`;
    }).join('')}</ul><p class="note">Allies give +1 food per turn. Hostile species raid you.</p>`;
  }

  function chronicle(run) {
    return `<ol class="log">${run.log.map((e) => `<li><span class="when">${esc(e.when)}</span>${esc(e.text)}</li>`).join('')}</ol>`;
  }

  function lines(list) {
    if (!list || !list.length) return '';
    return `<ul class="effects">${list.map((l) => `<li class="${l.bad ? 'bad' : l.good ? 'good' : ''}">${esc(l.t)}</li>`).join('')}</ul>`;
  }

  function banner(run) {
    const b = run.banner;
    if (!b) return '';
    const tag = b.success === true ? '<span class="pill good">Success</span>' : b.success === false ? '<span class="pill bad">Failed</span>' : '';
    return `<div class="banner"><div class="banner-head"><strong>${esc(b.title)}</strong>${tag}</div>${lines(b.lines)}</div>`;
  }

  function chanceTag(stat, chance) {
    const cls = chance >= 70 ? 'good' : chance <= 35 ? 'bad' : '';
    return `<span class="chance ${cls}">${statName(stat)} check · ${chance}%</span>`;
  }

  function actionCard(run) {
    const st = G.STAGES[run.stage];
    return `
      <div class="card">
        <p class="eyebrow">${esc(st.turnName)} ${run.stageTurn}</p>
        <h2>What does your lineage do?</h2>
        <div class="options">
          ${G.actionsFor(run).map((a) => `
            <button class="option" data-act="action" data-arg="${a.id}">
              <span class="opt-label">${esc(a.name)}</span>
              <span class="opt-meta">${a.check ? chanceTag(a.check.stat, a.chance) : ''}<span>${esc(a.desc)}</span></span>
            </button>`).join('')}
        </div>
      </div>`;
  }

  function reqTag(opt) {
    const r = opt.req;
    if (!r) return '';
    if (r.keyword) return `<span class="kw" style="--kw:${G.KEYWORDS[r.keyword[0]].color}">${G.KEYWORDS[r.keyword[0]].name}</span>`;
    if (r.diet) return `<span class="kw">${r.diet.map((d) => G.DIET_NAMES[d]).join(' / ')}</span>`;
    if (r.part) return `<span class="kw">${esc(G.PART[r.part].name)}</span>`;
    if (r.trait) return `<span class="kw">${esc(G.TRAITS[r.trait].name)}</span>`;
    if (r.food) return `<span class="kw">Costs ${r.food} Food</span>`;
    return '';
  }

  function eventCard(run) {
    const ev = G.EVENT[run.event.id];
    const ri = run.event.rival;
    return `
      <div class="card event ${ev.finale ? 'finale' : ''}">
        <p class="eyebrow">${ev.finale ? 'Stage finale' : 'Event'}</p>
        <h2>${esc(G.sub(ev.title, run, ri))}</h2>
        <p class="event-text">${esc(G.sub(ev.text, run, ri))}</p>
        <div class="options">
          ${ev.options.map((o, i) => {
            const s = G.optionState(run, o);
            return `
            <button class="option ${s.ok ? '' : 'locked'}" ${s.ok ? `data-act="option" data-arg="${i}"` : 'disabled'}>
              <span class="opt-label">${reqTag(o)}${esc(G.sub(o.label, run, ri))}</span>
              <span class="opt-meta">${s.ok ? `${o.check ? chanceTag(o.check.stat, s.chance) : '<span class="chance sure">Certain</span>'}${o.hint ? `<span>${esc(o.hint)}</span>` : ''}` : `<span class="reason">${esc(s.reason)}</span>`}</span>
            </button>`;
          }).join('')}
        </div>
      </div>`;
  }

  function outcomeCard(run) {
    const o = run.outcome;
    const tag = o.success === true ? '<span class="pill good">Success</span>' : o.success === false ? '<span class="pill bad">Failed</span>' : '';
    const dying = run.health <= 0;
    let cta = 'Continue';
    if (dying) cta = 'See what remains';
    else if (o.finale) cta = run.stage === 'cell' ? 'Leave the water' : 'Begin the age of tribes';
    return `
      <div class="card outcome">
        <p class="eyebrow">${esc(o.title)}</p>
        <h2>${esc(o.label)} ${tag}</h2>
        <p class="event-text">${esc(o.text)}</p>
        ${o.stat ? `<p class="note">${statName(o.stat)} check at ${o.chance}%.</p>` : ''}
        ${lines(o.lines)}
        <button class="btn primary wide" data-act="continue-outcome">${cta}</button>
      </div>`;
  }

  function draftCard(run) {
    const d = run.draft;
    const counts = G.keywordCounts(run);
    return `
      <div class="card draft">
        <p class="eyebrow">Mutation</p>
        <h2>Choose a new part</h2>
        <p class="note">A new part replaces whatever is in that slot.</p>
        <div class="options">
          ${d.options.map((pid) => {
            const p = G.PART[pid];
            const old = G.PART[run.parts[p.slot]];
            const slotName = G.SLOTS[run.stage].find((s) => s.id === p.slot).name;
            const syn = (p.keywords || []).map((k) => {
              const have = (counts[k] || 0) - (old && (old.keywords || []).includes(k) ? 1 : 0) + 1;
              return have >= 2 ? `<span class="syn-hint" style="--kw:${G.KEYWORDS[k].color}">${G.KEYWORDS[k].name} ${have}: ${esc(G.KEYWORDS[k].tiers[Math.min(3, have)].desc)}</span>` : '';
            }).join('');
            return `
            <button class="option part-option" data-act="draft" data-arg="${pid}">
              <span class="opt-slot">${slotName}${old ? ` · replaces ${esc(old.name)}` : ' · empty slot'}</span>
              <span class="opt-label">${esc(p.name)}${kwTags(p)}</span>
              <span class="opt-meta"><span>${esc(G.describeMods(p.mods))}${p.diet ? ` · ${G.DIET_NAMES[p.diet]}` : ''}</span></span>
              <span class="opt-desc">${esc(p.desc)}</span>
              ${syn}
            </button>`;
          }).join('')}
        </div>
        <div class="row">
          ${d.rerolls > 0 ? `<button class="btn" data-act="reroll">Reroll (${d.rerolls})</button>` : ''}
          <button class="btn ghost" data-act="skip-draft">Skip for +2 Food</button>
        </div>
      </div>`;
  }

  function evolvedCard(run) {
    const e = run.evolved;
    const tr = G.TRAITS[e.heritage];
    return `
      <div class="card finale">
        <p class="eyebrow">Creature Stage</p>
        <h2>Your lineage walks on land</h2>
        <p class="event-text">Generations pass. Your ancestors' ${esc(listJoin(e.cellParts).toLowerCase())} become something new. Your herd steps into a valley already full of life.</p>
        <div class="callout"><strong>Heritage: ${esc(tr.name)}</strong><span>${esc(G.describeMods(tr.mods))}. ${esc(tr.desc)}</span></div>
        <p class="note">Your traits came with you. Your body starts fresh, and new mutations appear as you earn DNA. Food runs out faster on land: you eat ${G.upkeep(run)} per turn.</p>
        <h3>Neighbors</h3>
        ${rivalList(run)}
        <button class="btn primary wide" data-act="continue-evolved">Enter the valley</button>
      </div>`;
  }

  function endCard(run) {
    const r = run.result;
    const leg = run.legacy && G.LEGACIES[run.legacy];
    const b = r.breakdown;
    return `
      <div class="card end ${r.victory ? 'finale' : ''}">
        <p class="eyebrow">${r.victory ? 'Prototype complete' : 'Extinction'}</p>
        <h2>${r.victory ? esc(leg.name) : 'Your lineage is gone'}</h2>
        <p class="event-text">${r.victory ? `${esc(leg.desc)} The Tribe stage is coming in a future update.` : `${esc(r.cause)} It lasted ${run.turn} turns and reached the ${esc(G.STAGES[run.stage].name)}.`}</p>
        <div class="callout gene">
          <strong>${ICON.gene} +${r.genes} Genetic Memory</strong>
          <span>${b.base} from DNA collected${b.stageBonus ? ` · +${b.stageBonus} for reaching land` : ''}${b.winBonus ? ` · +${b.winBonus} for the spark` : ''}${b.mult > 1 ? ` · ×${b.mult} hostility` : ''}</span>
        </div>
        <div class="row">
          <button class="btn primary" data-act="setup">New lineage</button>
          <button class="btn" data-act="go" data-arg="unlocks">Spend memory</button>
        </div>
      </div>`;
  }

  function playCard(run) {
    switch (run.phase) {
      case 'action': return banner(run) + actionCard(run);
      case 'event': return banner(run) + eventCard(run);
      case 'outcome': return outcomeCard(run);
      case 'draft': return banner(run) + draftCard(run);
      case 'evolved': return evolvedCard(run);
      case 'end': return endCard(run);
      default: return '';
    }
  }

  function gameScreen(run) {
    const arch = G.ARCHETYPE[run.archetype];
    const tab = G.ui.tab;
    const tabs = [['body', 'Body'], ['traits', 'Traits'], ...(run.rivals.length ? [['rivals', 'Neighbors']] : []), ['log', 'Chronicle']];
    const activeTab = tabs.some((t) => t[0] === tab) ? tab : 'body';
    const panel = {
      body: () => `${partsList(run)}<h3>Synergies</h3>${synergyChips(run)}`,
      traits: () => traitList(run),
      rivals: () => rivalList(run),
      log: () => chronicle(run),
    }[activeTab]();
    return `
      <div class="game">
        ${resources(run)}
        <section class="organism">
          <div class="stage-view" style="--h:${G.ORIGIN[run.origin].hue}">
            <canvas class="organism" aria-label="Your ${esc(arch.name)}"></canvas>
            <span class="diet">${G.DIET_NAMES[G.diet(run)]} ${esc(arch.name)}</span>
          </div>
          ${statRow(run)}
        </section>
        <section class="play">${playCard(run)}</section>
        <section class="details">
          <div class="tabs" role="tablist">${tabs.map(([id, label]) => `<button role="tab" class="tab ${id === activeTab ? 'on' : ''}" aria-selected="${id === activeTab}" data-act="tab" data-arg="${id}">${label}</button>`).join('')}</div>
          <div class="tab-panel">${panel}</div>
          ${run.phase !== 'end' ? `<div class="abandon">${G.ui.confirmAbandon
            ? '<span>End this lineage? You keep Genetic Memory for DNA earned so far.</span><button class="btn small danger" data-act="abandon-yes">End it</button><button class="btn small ghost" data-act="abandon-no">Keep going</button>'
            : '<button class="btn small ghost" data-act="abandon">End this lineage</button>'}</div>` : ''}
        </section>
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
    const group = (stage) => `<ul class="codex-grid">${G.PARTS.filter((p) => p.stage === stage).map((p) => c.parts.includes(p.id)
      ? `<li><strong>${esc(p.name)}</strong>${kwTags(p)}<span>${esc(G.describeMods(p.mods))}</span></li>`
      : '<li class="unknown"><strong>???</strong></li>').join('')}</ul>`;
    return `
      <main class="codex">
        <header class="screen-head"><button class="btn ghost" data-act="go" data-arg="title">Back</button><h1>Codex of Life</h1></header>
        <section><h2>Endings <span class="count">${c.legacies.length} / ${legacies.length}</span></h2>
          <ul class="codex-grid">${legacies.map((id) => c.legacies.includes(id) ? `<li><strong>${esc(G.LEGACIES[id].name)}</strong><span>${esc(G.LEGACIES[id].desc)}</span></li>` : '<li class="unknown"><strong>???</strong></li>').join('')}</ul>
        </section>
        <section><h2>Events <span class="count">${seenEvents} / ${events.length}</span></h2>
          <ul class="codex-grid">${events.map((e) => c.events.includes(e.id) ? `<li><strong>${esc(e.title.replace(/\{rival\}/g, 'Rivals'))}</strong><span>${e.stage === 'any' ? 'Any stage' : G.STAGES[e.stage].name}</span></li>` : '<li class="unknown"><strong>???</strong></li>').join('')}</ul>
        </section>
        <section><h2>Cell parts <span class="count">${seenParts} / ${G.PARTS.length} parts found</span></h2>${group('cell')}</section>
        <section><h2>Creature parts</h2>${group('creature')}</section>
      </main>`;
  }

  // ---------- Input ----------
  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const act = el.dataset.act;
    const arg = el.dataset.arg;
    const run = G.run;
    switch (act) {
      case 'go': go(arg); return;
      case 'continue': G.ui.tab = 'body'; go('game'); return;
      case 'setup':
        G.ui.setup = G.ui.setup || { archetype: 'drifter', origin: 'tidal', hostility: 0 };
        if (!G.meta.unlocked.archetypes.includes(G.ui.setup.archetype)) G.ui.setup.archetype = 'drifter';
        if (!G.meta.unlocked.origins.includes(G.ui.setup.origin)) G.ui.setup.origin = 'tidal';
        G.ui.setup.hostility = Math.min(G.ui.setup.hostility, G.meta.maxHostility);
        go('setup'); return;
      case 'pick-archetype': G.ui.setup.archetype = arg; break;
      case 'pick-origin': G.ui.setup.origin = arg; break;
      case 'pick-hostility': G.ui.setup.hostility = Number(arg); break;
      case 'begin': G.newRun(G.ui.setup.archetype, G.ui.setup.origin, G.ui.setup.hostility); G.ui.tab = 'body'; go('game'); return;
      case 'action': G.doAction(arg); break;
      case 'option': G.chooseOption(Number(arg)); break;
      case 'continue-outcome': G.continueOutcome(); break;
      case 'draft': G.pickDraft(arg); break;
      case 'reroll': G.rerollDraft(); break;
      case 'skip-draft': G.skipDraft(); break;
      case 'continue-evolved': G.continueEvolved(); break;
      case 'tab': G.ui.tab = arg; render(); return;
      case 'abandon': G.ui.confirmAbandon = true; break;
      case 'abandon-no': G.ui.confirmAbandon = false; break;
      case 'abandon-yes':
        if (run) { G.endRunEarly(); }
        G.ui.confirmAbandon = false; break;
      case 'buy': G.buy(el.dataset.kind, arg); break;
      case 'reset': G.ui.confirmReset = true; break;
      case 'reset-no': G.ui.confirmReset = false; break;
      case 'reset-yes': G.resetAll(); go('title'); return;
      default: return;
    }
    render();
    // After each choice, bring the play card into view under the resource bar.
    if (['action', 'option', 'continue-outcome', 'draft', 'skip-draft', 'continue-evolved'].includes(act)) {
      const play = app.querySelector('.play');
      const hud = app.querySelector('.hud');
      if (play) {
        const hudH = hud && getComputedStyle(hud).position === 'sticky' ? hud.offsetHeight : 0;
        const top = play.getBoundingClientRect().top;
        if (top < hudH || top > window.innerHeight * 0.6) window.scrollTo(0, window.scrollY + top - hudH - 8);
      }
    }
  });

  render();
}());
