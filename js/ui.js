// Screens and buttons. Menus are redrawn from the current state after each tap. In a game,
// the world map stays mounted and only the parts that changed are redrawn.
window.G = window.G || {};

(function () {
  const app = document.getElementById('app');
  G.ui = { screen: 'title', setup: null, confirmAbandon: false, confirmReset: false, sheet: null, speed: 1, viewer: null };

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
    pause: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M4 3h3v10H4zM9 3h3v10H9z"/></svg>',
    play: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M4 2.5 13 8l-9 5.5z"/></svg>',
    expand: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  };

  // parts: redraw only these pieces of a mounted game ('top', 'hud', 'modal', 'sheet', 'viewer').
  function render(parts) {
    const s = G.ui.screen;
    const run = G.run;
    if (s === 'game' && run && parts && app.querySelector('.game')) { renderParts(run, parts); return; }
    let html = '';
    if (s === 'title') html = titleScreen();
    else if (s === 'setup') html = setupScreen();
    else if (s === 'unlocks') html = unlocksScreen();
    else if (s === 'codex') html = codexScreen();
    else if (s === 'game') html = run ? gameScreen(run) : titleScreen();
    if (G.stopScene) G.stopScene();
    app.innerHTML = html;
    app.dataset.screen = s;
    if (s === 'game' && run) {
      renderParts(run, ['top', 'hud', 'modal', 'sheet', 'viewer']);
      G.startMap(app.querySelector('canvas.map'), onMapTap);
    }
  }
  G.render = render;

  function renderParts(run, parts) {
    const put = (sel, html) => { const el = app.querySelector(sel); if (el) el.innerHTML = html; return el; };
    if (parts.includes('top')) paintPortraits(put('#tb', topBar(run)), run);
    if (parts.includes('hud')) put('#hud', mapHud(run));
    if (parts.includes('modal')) {
      if (G.stopScene) G.stopScene();
      const el = put('#modal', modal(run));
      paintPortraits(el, run);
      paintScene(el, run);
      if (el && el.firstElementChild) { const m = el.querySelector('.modal'); if (m) m.scrollTop = 0; }
    }
    if (parts.includes('sheet')) {
      const old = app.querySelector('.sheet-body');
      const scroll = old ? old.scrollTop : 0;
      const el = put('#sheet', sheet(run));
      paintPortraits(el, run);
      const nb = app.querySelector('.sheet-body');
      if (nb && G.ui.keepScroll) nb.scrollTop = scroll;
      G.ui.keepScroll = false;
    }
    if (parts.includes('viewer')) {
      const el = put('#viewer', viewer(run));
      const c = el && el.querySelector('canvas.viewer-canvas');
      if (c) G.playViewer(c, viewerBody(run), run);
    }
  }

  function paintPortraits(root, run) {
    if (!root) return;
    root.querySelectorAll('canvas.portrait').forEach((c) => {
      const idx = c.dataset.species;
      G.drawPortrait(c, idx != null ? G.speciesBody(run.species[Number(idx)]) : run);
    });
  }

  function paintScene(root, run) {
    const scene = root && root.querySelector('canvas.scene');
    if (!scene) return;
    let info;
    if (run.phase === 'scene') info = run.scene;
    else if (run.phase === 'mutated') info = { anim: 'mutate', mood: run.scene.mood || 'surprised', title: run.scene.label, evolved: run.scene.evolved };
    else if (run.phase === 'evolved') info = { anim: 'grow', mood: 'proud', title: 'evolved', prop: run.habitat === 'sea' ? 'bubbles' : null };
    else if (run.phase === 'end') info = run.result && run.result.victory ? { anim: 'social', mood: 'proud', title: 'win', prop: run.habitat === 'sea' ? 'notes' : 'sparks' } : { anim: 'rest', mood: 'sad', title: 'end' };
    else info = { anim: 'rest', mood: 'happy' };
    G.playScene(scene, run, info);
  }

  // Tapping a herd on the world map opens its sheet.
  function onMapTap(key) {
    const run = G.run;
    if (!run || run.phase !== 'map') return;
    if (key === 'you') { G.ui.sheet = 'body'; G.ui.speciesView = null; }
    else { const i = run.species.findIndex((s) => s.name === key); if (i < 0) return; G.ui.sheet = 'world'; G.ui.speciesView = i; }
    render(['sheet', 'hud']);
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
        ${G.WHATS_NEW ? `<details class="howto whatsnew" ${m.seenVersion !== G.VERSION ? 'open' : ''}>
          <summary>What's new · ${esc(G.WHATS_NEW.title)}</summary>
          <ul>${G.WHATS_NEW.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
        </details>` : ''}
        <details class="howto">
          <summary>How to play</summary>
          <ol>
            <li>Time flows on the world map. Use pause and the speed buttons, like in CK3. Events pop up at random and pause the game; choose how to respond. Buttons show your chance of success.</li>
            <li>Watch every species roam the map. Herd size shows population. Tap any herd, or your portrait (top left), to inspect it.</li>
            <li>Your <b>Instinct</b> (top right) decides how you find food and which events find you. Sea creatures also choose a home depth there, from the sunlit shallows down to the abyss.</li>
            <li>Each turn your Population eats Food. Spare Food grows your Population. Run out and you starve.</li>
            <li>DNA brings mutations. Later, mutations can <b>merge</b> with the part already in a slot. The right pairs <b>evolve</b> into powerful new parts. Creatures start with stubby limbs: merge them with limb mutations to grow legs, arms, wings and fins.</li>
            <li>Every evolution you discover is saved: in future runs it can turn up in mutation drafts. Discoveries also unlock archetypes and worlds.</li>
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
          <div class="tb-title"><strong>${esc(st.name)}</strong><span>${esc(st.turnName)} ${run.stageTurn}${esc(era)}</span><span class="tick-bar" aria-hidden="true"><span class="tick-fill"></span></span></div>
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
        <div class="tb-row2">${speedControls(run)}</div>
      </header>`;
  }

  // Time controls live in the top bar, well away from event buttons.
  function speedControls(run) {
    const speeds = [['0', ICON.pause, 'Pause'], ['1', `${ICON.play}`, 'Normal speed'], ['2', `${ICON.play}${ICON.play}`, 'Fast'], ['3', `${ICON.play}${ICON.play}${ICON.play}`, 'Fastest']];
    const live = run.phase === 'map';
    return `<div class="speeds ${live ? '' : 'held'}" role="group" aria-label="Game speed">${speeds.map(([v, ic, label]) => `<button class="speed ${String(G.ui.speed) === v ? 'on' : ''}" data-act="speed" data-arg="${v}" aria-label="${label}" aria-pressed="${String(G.ui.speed) === v}">${ic}</button>`).join('')}</div>`;
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
        <p class="eyebrow">${run.scene.evolved ? 'Evolution' : 'Mutation'}</p>
        <h2>${esc(run.scene.label)}</h2>
        ${run.scene.evolved ? `<div class="callout"><strong>${esc(G.PART[run.scene.evolved].name)}</strong><span>${esc(G.describeMods(G.PART[run.scene.evolved].mods))}. ${esc(G.PART[run.scene.evolved].desc)}</span></div>` : ''}
        <button class="btn primary wide" data-act="continue-mutation">Continue</button>
      </article>`;
  }

  function draftCard(run) {
    const d = run.draft;
    const counts = G.keywordCounts(run);
    const merging = G.canMerge(run);
    return `
      <article class="card draft">
        <p class="eyebrow">Mutation</p>
        <h2>Choose a new part</h2>
        <p class="note">${merging ? 'Grow it into an empty slot, merge it with the part already there (keeping both), or replace that part. The right pairs evolve into something new.' : 'It goes into its slot, replacing whatever is there. Once you are multicellular, parts can merge, and the right pairs evolve.'}</p>
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
            // Merging the right pair evolves it. Known recipes are named; unknown ones are a mystery.
            const evoHint = (other) => {
              const evo = G.evolutionOf(other, pid);
              if (!evo) return '';
              return G.evolutionKnown(evo) ? ` → EVOLVES: ${G.PART[evo].name}` : ' → ✨ something new?';
            };
            let buttons;
            if (!slot) buttons = `<button class="btn small primary" data-act="draft" data-arg="${pid}" data-mode="grow">Grow it</button>`;
            else if (slot.merged) {
              // A merged slot stays merged: choose which half the new part replaces.
              const h1 = evoHint(slot.merged); const h2 = evoHint(slot.id);
              buttons = `<button class="btn small primary ${h1 ? 'evo' : ''}" data-act="draft" data-arg="${pid}" data-mode="swapBase">Swap out ${esc(G.PART[slot.id].name)}${esc(h1)}</button>`
                + `<button class="btn small primary ${h2 ? 'evo' : ''}" data-act="draft" data-arg="${pid}" data-mode="swapMerged">Swap out ${esc(G.PART[slot.merged].name)}${esc(h2)}</button>`;
            } else {
              const h = evoHint(slot.id);
              buttons = `${canMergeHere ? `<button class="btn small primary ${h ? 'evo' : ''}" data-act="draft" data-arg="${pid}" data-mode="merge">Merge with ${esc(G.PART[slot.id].name)}${esc(h)}</button>` : ''}<button class="btn small ${canMergeHere ? '' : 'primary'}" data-act="draft" data-arg="${pid}" data-mode="replace">Replace ${esc(G.slotLabel(slot))}</button>`;
            }
            return `
            <div class="part-card">
              <span class="opt-slot">${esc(slotName)}${slot ? ` · now ${esc(G.slotLabel(slot))}` : ' · empty'}</span>
              <span class="opt-label">${esc(p.name)}${kwTags(p)}${p.evolved ? `<span class="kw unlocked">${p.evolved === 2 ? 'Legendary' : 'Unlocked'}</span>` : ''}</span>
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
      <article class="card finale">
        <p class="eyebrow">The Mind</p>
        <h2>What fascinates your kind?</h2>
        <p class="note">Insight flows into it each turn (${G.insightPerTurn(run)} per turn now). Some ideas depend on your diet, your nature and what you already know, and some rule others out.</p>
        ${mindTree(run)}
      </article>`;
  }

  // The Mind as a skill tree: rows are tiers, lines show which idea leads to which.
  function mindTree(run) {
    const sel = G.INNOVATION[G.ui.mindSel] || G.INNOVATION[run.fascination] || G.INNOVATIONS.find((i) => G.innovationAvailable(run, i).ok) || G.INNOVATIONS[0];
    const state = (inv) => {
      if (run.innovations.includes(inv.id)) return 'done';
      if (run.fascination === inv.id) return 'current';
      const av = G.innovationAvailable(run, inv);
      return av.ok ? 'open' : av.blocked ? 'blocked' : 'locked';
    };
    const X = (inv) => 9 + inv.col * 16.4;
    const Y = (inv) => 11 + (inv.tier - 1) * 26;
    const edges = [];
    G.INNOVATIONS.forEach((inv) => {
      const r = inv.req || {};
      const parents = r.tier3 ? G.INNOVATIONS.filter((i) => i.tier === 3) : (r.innovation || []).map((id) => G.INNOVATION[id]);
      parents.forEach((par) => {
        const known = run.innovations.includes(par.id);
        const cls = known && run.innovations.includes(inv.id) ? 'done' : known ? 'lit' : 'dim';
        edges.push(`<path class="edge ${cls}" d="M${X(par)} ${Y(par) + 5} C ${X(par)} ${Y(par) + 15}, ${X(inv)} ${Y(inv) - 15}, ${X(inv)} ${Y(inv) - 5}" vector-effect="non-scaling-stroke"/>`);
      });
    });
    const icon = { done: '✓', current: '◔', open: '', blocked: '✕', locked: '🔒' };
    return `
      <div class="skill-tree">
        <svg class="edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${edges.join('')}</svg>
        ${G.INNOVATIONS.map((inv) => {
          const st = state(inv);
          return `<button class="node ${st} ${sel.id === inv.id ? 'sel' : ''} ${inv.tier === 4 ? 'apex' : ''}" style="left:${X(inv)}%;top:${Y(inv)}%" data-act="mind-sel" data-arg="${inv.id}" aria-pressed="${sel.id === inv.id}" aria-label="${esc(inv.name)}"><span>${esc(inv.name)}</span>${icon[st] ? `<i aria-hidden="true">${icon[st]}</i>` : ''}</button>`;
        }).join('')}
      </div>
      ${mindDetail(run, sel, state(sel))}`;
  }

  function mindDetail(run, sel, st) {
    const av = G.innovationAvailable(run, sel);
    const excl = (sel.excludes || []).map((id) => G.INNOVATION[id].name);
    let action = '';
    if (st === 'open') action = `<button class="btn primary small" data-act="fascinate" data-arg="${sel.id}">Research (${sel.cost} Insight)</button>`;
    if (st === 'current') action = `<span class="note">Researching: ${run.insight} / ${sel.cost} Insight</span>`;
    if (st === 'done') action = '<span class="note good-text">Known</span>';
    return `
      <div class="inv-detail">
        <div class="inv-head"><strong>${esc(sel.name)}</strong><span>${ICON.insight} ${sel.cost}</span></div>
        <span class="inv-mods">${esc(G.describeMods(sel.mods))}</span>
        <span class="inv-desc">${esc(sel.desc)}</span>
        ${excl.length ? `<span class="inv-excl">Rules out: ${esc(excl.join(', '))}</span>` : ''}
        ${!av.ok && st !== 'done' ? `<span class="reason">${esc(av.reason)}</span>` : ''}
        <div class="row tight">${action}</div>
      </div>`;
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
        <p class="event-text">Generations pass. ${sea ? 'Your pod swims into waters' : 'Your herd steps into a valley'} already full of life: ${esc(listJoin(run.species.map((s) => `the ${s.name}`)))}.</p>
        <div class="callout"><strong>Heritage: ${esc(tr.name)}</strong><span>${esc(G.describeMods(tr.mods))}. ${esc(tr.desc)}</span></div>
        ${e.carried && e.carried.length ? `<div class="carried"><h3>What your cells became</h3><ul>${e.carried.map((c) => `<li><span>${esc(c.from)}</span><span class="arrow" aria-hidden="true">→</span><b>${esc(c.to)}</b></li>`).join('')}</ul><p class="note">Only your mouth and your evolved parts carry over.${e.left && e.left.length ? ` Left behind: ${esc(listJoin(e.left))}.` : ''}</p></div>` : ''}
        <p class="note">Your traits came with you. Your new body has ${G.slotsFor(run).length} slots, from ${sea ? 'fins to tail' : 'front limbs and hands to hind legs and feet'}, and mutations can merge from the start.</p>
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
        ${(() => { const fresh = G.meta.codex.evolutions.filter((id) => !(run.knownEvos || []).includes(id)); return fresh.length ? `<div class="callout"><strong>Unlocked for future runs</strong><span>${esc(listJoin(fresh.map((id) => G.PART[id].name)))} can now appear in mutation drafts.</span></div>` : ''; })()}
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

  function modal(run) {
    if (run.phase === 'map') return '';
    return `<div class="modal-backdrop"></div><div class="modal" role="dialog" aria-modal="true">${mainPanel(run)}</div>`;
  }

  // Over the world map: notices, what happened last turn, and the time controls.
  function mapHud(run) {
    const last = run.lastTurn ? run.lastTurn.lines.map((l) => `<span class="${l.bad ? 'bad' : l.good ? 'good' : ''}">${esc(l.t)}</span>`).join('') : '';
    return `
      <div class="toasts">${(run.notices || []).slice(-3).map((n, i) => `<button class="toast" data-act="dismiss" data-arg="${i}">${esc(n)}</button>`).join('')}</div>
      <div class="hud-bottom">
        ${last ? `<div class="ledger">${last}</div>` : '<div class="ledger hint">Tap any herd to look closer.</div>'}
      </div>`;
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
      <p class="size-line"><b>${G.SIZES[G.sizeOf(run)].name}</b> (${G.sizeLabel(G.bodySize(run), run.stage)}) · ${run.stage === 'cell' ? 'colony' : run.habitat === 'sea' ? 'schools' : 'herds'} of up to ${G.maxPop(run)} · 1 Food feeds ${G.SIZES[G.sizeOf(run)].eatDiv} members${G.sizeOf(run) === 'small' ? ' · each blow kills more of you' : ''}</p>
      <ul class="parts">${slots.map((slot) => {
        const locked = slot.multi && !run.multicellular;
        const s = run.parts[slot.id];
        if (locked) return `<li class="locked-slot"><span class="slot">${slot.name}</span><span class="pname muted">Opens when multicellular</span></li>`;
        if (G.offSlots(run).includes(slot.id)) return `<li class="locked-slot"><span class="slot">${slot.name}</span><span class="pname muted">Not part of your body plan (${esc(G.segmentPlan(run).name)}, ${esc(G.SYMMETRY[G.symmetry(run)].name)})</span></li>`;
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

  // Symmetry (fixed when multicellular) and segments (legs, arms or pseudopods, changed for DNA).
  function planTab(run) {
    const symId = G.symmetry(run);
    const sym = G.SYMMETRY[symId];
    const chosen = run.multicellular;
    const symCard = `<div class="plan-sym"><h3>Symmetry: ${chosen ? esc(sym.name) : 'not yet chosen'}</h3><p>${chosen ? esc(sym.desc) : 'You choose your symmetry when your cells become one body. It shapes the creature you grow into and cannot be changed afterwards.'}</p>${chosen && Object.keys(sym.mods).length ? `<p class="pmods">${esc(G.describeMods(sym.mods))}</p>` : ''}</div>`;
    if (run.stage !== 'creature') {
      return `${symCard}<p class="note">${Object.values(G.SYMMETRY).map((x) => `${x.name}: ${x.desc}`).map(esc).join('<br>')}</p>`;
    }
    const n = G.segments(run);
    const unit = symId === 'bilateral' && run.habitat === 'sea' ? 'fin pairs' : sym.unit;
    const planFor = (k) => (symId === 'radial' ? G.armPlan(k) : symId === 'colonial' ? G.podPlan(k) : G.legPlan(k, run.habitat));
    const cur = planFor(n);
    const canDown = n > sym.min && run.dna >= G.RESHAPE_COST;
    const canUp = n < sym.max && run.dna >= G.RESHAPE_COST;
    const off = G.offSlots(run);
    const ladder = [];
    for (let k = sym.min; k <= sym.max; k++) {
      const pl = planFor(k);
      ladder.push(`<li class="${k === n ? 'on' : ''}"><b>${k}</b><span><strong>${esc(pl.name)}</strong> ${esc(G.describeMods(pl.mods) || 'No bonus, no cost')}</span></li>`);
    }
    return `${symCard}
      <div class="plan-now">
        <button class="btn small" ${canDown ? 'data-act="reshape" data-arg="-1"' : 'disabled'} aria-label="Fewer ${esc(unit)}">−</button>
        <div><b>${n} ${esc(unit)}</b>${cur.name !== `${n} ${unit}` ? `<span>${esc(cur.name)}</span>` : ''}</div>
        <button class="btn small" ${canUp ? 'data-act="reshape" data-arg="1"' : 'disabled'} aria-label="More ${esc(unit)}">+</button>
      </div>
      <p class="plan-desc">${esc(cur.desc)}${Object.keys(cur.mods).length ? ` <span class="pmods">${esc(G.describeMods(cur.mods))}</span>` : ''}</p>
      <p class="note">Each change costs ${G.RESHAPE_COST} DNA (you have ${run.dna}).${off.length ? ` This body has no use for: ${off.map((id) => esc(G.slotName(run, id))).join(', ')}. Parts there are kept but do nothing.` : ''}</p>
      <ol class="plan-ladder">${ladder.join('')}</ol>
      <p class="size-line">Size: <b>${G.SIZES[G.sizeOf(run)].name}</b> · about ${G.sizeLabel(G.bodySize(run), run.stage)}</p>`;
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
      <p class="note">You can change your Instinct at any time. It takes effect at the end of the turn.</p>
      ${run.stage === 'creature' && run.habitat === 'sea' ? zonePicker(run) : ''}`;
  }

  // Sea creatures choose a home depth, each with trade-offs.
  function zonePicker(run) {
    const cur = G.zone(run);
    return `<h3>Home depth</h3>
      <div class="instincts">${G.SEA_ZONES.map((z) => {
        const st = G.zoneState(run, z.id);
        const here = z.id === cur;
        const can = !here && st.ok && run.dna >= G.MOVE_COST;
        return `<button class="choice ${here ? 'selected' : ''}" ${can ? `data-act="zone" data-arg="${z.id}"` : 'disabled'} aria-pressed="${here}">
          <span class="choice-head"><strong>${esc(z.name)}</strong>${here ? '<span class="kw">Home</span>' : ''}</span>
          <span class="choice-desc">${esc(z.desc)} <b>${esc(G.describeMods(z.mods))}</b></span>
          ${st.ok ? '' : `<span class="reason">${esc(st.why)}</span>`}
        </button>`;
      }).join('')}</div>
      <p class="note">Moving to a new depth costs ${G.MOVE_COST} DNA (you have ${run.dna}). Some events only happen at certain depths.</p>`;
  }

  function worldTab(run) {
    if (G.ui.speciesView != null && run.species[G.ui.speciesView]) return speciesSheet(run, G.ui.speciesView);
    return `<ul class="rivals">${run.species.map((s, i) => {
      if (s.extinct) return `<li class="extinct-row"><span>The ${esc(s.name)}</span><small>Extinct</small></li>`;
      const st = G.speciesStatus(s);
      const pct = (s.opinion + 100) / 2;
      return `<li><button class="rival ${st}" data-act="species" data-arg="${i}">
        <canvas class="portrait mini" data-species="${i}"></canvas>
        <span class="rival-info">
          <span class="rival-name">${esc(s.name)}<small>${G.ROLES[s.role]} · ${G.DIET_NAMES[s.diet]} · ${G.sizeLabel(s.size, run.stage)} · ${Math.round(s.pop)}</small></span>
          <span class="opinion"><span class="opinion-bar"><span style="left:${pct}%"></span></span><span class="status">${st[0].toUpperCase() + st.slice(1)} ${s.opinion > 0 ? '+' : ''}${s.opinion}</span></span>
        </span>
      </button></li>`;
    }).join('')}</ul><p class="note">Tap a species to see it up close. Allied species (+50) give +1 Food per turn. Hostile species (−50) attack you.</p>`;
  }

  function speciesPlan(s) {
    if (s.stage !== 'creature') return '';
    const sym = s.symmetry || 'bilateral'; const n = s.segments != null ? s.segments : 2;
    const pl = sym === 'radial' ? G.armPlan(n) : sym === 'colonial' ? G.podPlan(n) : G.legPlan(n, s.world);
    return ` · ${G.SYMMETRY[sym].name}, ${pl.name.toLowerCase()}`;
  }

  // Another species' sheet, like inspecting another ruler in CK3.
  function speciesSheet(run, i) {
    const s = run.species[i];
    const st = G.speciesStatus(s);
    const attitude = {
      allied: 'They count you as family. They share food and fight beside you.',
      friendly: 'They are warming to you.',
      neutral: 'They watch you, unsure.',
      wary: 'They keep their distance and their young close.',
      hostile: 'They want you gone and will attack when they can.',
    }[st];
    const roleText = { predator: 'They hunt creatures like you.', prey: 'They are what others eat.', rival: 'They want the same food and ground as you.', neighbor: 'They share your world and could become friends.' }[s.role];
    const off = G.speciesBody(s).off;
    const slots = G.SLOTS[s.plan].filter((sl) => s.parts[sl.id] && !off.includes(sl.id));
    return `
      <button class="btn ghost small" data-act="species-back">← All species</button>
      <div class="species-head">
        <button class="portrait-zoom" data-act="view" data-arg="${i}" aria-label="See the ${esc(s.name)} full screen"><canvas class="portrait big" data-species="${i}"></canvas><i>${ICON.expand}</i></button>
        <div><h2>The ${esc(s.name)}</h2><p class="note">${G.ROLES[s.role]} · ${G.DIET_NAMES[s.diet]} · ${s.size >= 2 ? 'Giant, ' : s.size < 0.6 ? 'Tiny, ' : ''}${G.sizeLabel(s.size, run.stage)}${speciesPlan(s)} · ${s.extinct ? 'Extinct' : `Population ${Math.round(s.pop)}`}</p></div>
      </div>
      <p>${esc(roleText)} ${esc(attitude)}</p>
      <div class="opinion big"><span class="opinion-bar"><span style="left:${(s.opinion + 100) / 2}%"></span></span><span class="status">${st[0].toUpperCase() + st.slice(1)} ${s.opinion > 0 ? '+' : ''}${s.opinion}</span></div>
      <h3>Compared with you</h3>
      <div class="compare">${G.STATS.map((k) => {
        const them = G.speciesStat(s, k.id); const you = G.stat(run, k.id);
        return `<div class="cmp"><span>${k.short}</span><b>${them}</b><small class="${them > you ? 'bad-text' : them < you ? 'good-text' : ''}">you ${you}</small></div>`;
      }).join('')}</div>
      <h3>Body</h3>
      <ul class="parts">${slots.map((sl) => {
        const slot = s.parts[sl.id];
        return `<li><span class="slot">${sl.name}</span><span class="pname">${esc(G.slotLabel(slot))}${[slot.id, slot.merged].filter(Boolean).map((id) => kwTags(G.PART[id])).join('')}</span><span class="pmods">${esc(G.PART[slot.id].desc)}</span></li>`;
      }).join('')}</ul>`;
  }

  function chronicleTab(run) {
    return `<ol class="log">${run.log.map((e) => `<li><span class="when">${esc(e.when)}</span>${esc(e.text)}</li>`).join('')}</ol>`;
  }

  function sheet(run) {
    const tab = G.ui.sheet;
    if (!tab) return '';
    const tabs = [['body', 'Body'], ['plan', 'Body plan'], ...(run.stage === 'creature' ? [['look', 'Look']] : []), ['traits', 'Traits'], ['instinct', 'Instinct'], ['world', 'World'], ...(run.mind ? [['mind', 'Mind']] : []), ['log', 'Chronicle']];
    const panel = { body: bodyTab, plan: planTab, look: lookTab, traits: traitsTab, instinct: instinctTab, world: worldTab, mind: (r) => `<p class="note">Insight: ${r.insight} (${G.insightPerTurn(r)} per turn)</p>${mindTree(r)}`, log: chronicleTab }[tab](run);
    const arch = G.ARCHETYPE[run.archetype];
    const where = run.stage === 'cell' ? 'Primordial sea' : run.habitat === 'sea' ? 'Open sea' : 'Land';
    return `
      <div class="sheet-backdrop" data-act="close-sheet"></div>
      <aside class="sheet" role="dialog" aria-modal="true" aria-label="Your lineage">
        <header class="sheet-head">
          <button class="portrait-zoom" data-act="view" data-arg="you" aria-label="See your creature full screen"><canvas class="portrait big"></canvas><i>${ICON.expand}</i></button>
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

  // The appearance editor. Some looks unlock with progress.
  function lookTab(run) {
    const L = G.effectiveLook(run);
    const hue = G.bodyOf(run).hue;
    const acc = run.look && run.look.accent != null ? run.look.accent : (hue + 40) % 360;
    const group = (key, title) => `
      <div class="look-group"><h3>${title}</h3><div class="chips">${G.APPEARANCE[key].filter((o) => !o.only || o.only === run.habitat).map((o) => {
        const st = G.lookOptionState(run, o);
        const on = L[key] === o.id;
        return `<button class="chip ${on ? 'on' : ''}" ${st.ok ? `data-act="look" data-kind="${key}" data-arg="${o.id}"` : 'disabled'} aria-pressed="${on}" title="${esc(st.ok ? o.name : o.why)}">${esc(o.name)}${st.ok ? '' : ' 🔒'}</button>`;
      }).join('')}</div>${G.APPEARANCE[key].some((o) => !G.lookOptionState(run, o).ok && !G.lookOptionState(run, o).hidden) ? `<p class="note">${esc(G.APPEARANCE[key].filter((o) => !G.lookOptionState(run, o).ok && !G.lookOptionState(run, o).hidden).map((o) => `${o.name}: ${o.why}`).join(' · '))}</p>` : ''}</div>`;
    return `
      <div class="look-preview"><canvas class="portrait huge"></canvas></div>
      <div class="look-group"><h3>Body color</h3><input id="look-hue" type="range" min="0" max="359" value="${hue}" data-look="hue" style="--h:${hue}" class="hue-slider" aria-label="Body color"></div>
      <div class="look-group"><h3>Pattern color</h3><input id="look-accent" type="range" min="0" max="359" value="${acc}" data-look="accent" style="--h:${acc}" class="hue-slider" aria-label="Pattern color"></div>
      ${group('pattern', 'Pattern')}${group('shape', 'Body shape')}${group('head', 'Head')}${run.habitat === 'sea' && G.symmetry(run) === 'bilateral' && G.segments(run) > 0 ? group('fins', 'Fins') : ''}${run.habitat === 'land' && G.symmetry(run) === 'bilateral' && G.segments(run) > 0 ? group('neck', 'Neck') + (G.segments(run) === 2 ? group('posture', 'Posture') : '') : ''}${group('eyes', 'Eyes')}
      <p class="note">Looks are just looks: they never change your stats.</p>`;
  }

  function viewerBody(run) {
    const v = G.ui.viewer;
    if (v == null) return null;
    return v === 'you' ? G.bodyOf(run) : G.speciesBody(run.species[Number(v)]);
  }

  function viewer(run) {
    const v = G.ui.viewer;
    if (v == null) return '';
    const name = v === 'you' ? `Your ${G.ARCHETYPE[run.archetype].name} lineage` : `The ${run.species[Number(v)].name}`;
    return `<div class="viewer" role="dialog" aria-modal="true" aria-label="${esc(name)}">
      <canvas class="viewer-canvas"></canvas>
      <div class="viewer-bar"><strong>${esc(name)}</strong><button class="btn small" data-act="close-view">${ICON.close} Close</button></div>
    </div>`;
  }

  function gameScreen() {
    return `
      <div class="game">
        <div id="tb"></div>
        <div class="world"><canvas class="map" aria-label="World map"></canvas><div id="hud" class="map-hud"></div><div id="modal"></div></div>
        <div id="sheet"></div>
        <div id="viewer"></div>
      </div>`;
  }

  // ---------- Unlocks ----------
  function unlocksScreen() {
    const m = G.meta;
    const item = (kind, it) => {
      const owned = m.unlocked[kind].includes(it.id);
      const gated = it.needsEvo && m.codex.evolutions.length < it.needsEvo;
      const afford = m.genes >= it.cost && !gated;
      return `<li class="shop-item ${owned ? 'owned' : ''}">
        <div><strong>${esc(it.name)}</strong><p>${esc(it.desc)}</p>${gated ? `<p class="gate">Discover ${it.needsEvo} evolutions to unlock (you have ${m.codex.evolutions.length}).</p>` : ''}</div>
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
    const evos = G.EVOLUTIONS;
    const evoCard = (e) => (c.evolutions.includes(e.id)
      ? `<li class="evo-known"><strong>${esc(e.name)}${e.evolved === 2 ? ' ★' : ''}</strong><span>${esc(G.PART[e.from[0]].name)} + ${esc(G.PART[e.from[1]].name)}</span><span>${esc(G.describeMods(e.mods))}</span></li>`
      : `<li class="unknown"><strong>???</strong><span>${e.evolved === 2 ? 'Legendary · ' : ''}${e.stage === 'cell' ? 'Cell' : 'Creature'} ${esc(G.SLOTS[e.stage === 'cell' ? 'cell' : (e.habitat || 'land')].find((sl) => sl.id === e.slot).name.toLowerCase())}</span></li>`);
    const group = (filter) => `<ul class="codex-grid">${G.PARTS.filter((p) => !p.evolved && filter(p)).map((p) => (c.parts.includes(p.id)
      ? `<li><strong>${esc(p.name)}</strong>${kwTags(p)}<span>${esc(G.describeMods(p.mods))}</span></li>`
      : '<li class="unknown"><strong>???</strong></li>')).join('')}</ul>`;
    return `
      <main class="codex">
        <header class="screen-head"><button class="btn ghost" data-act="go" data-arg="title">Back</button><h1>Codex of Life</h1></header>
        <section><h2>Endings <span class="count">${c.legacies.length} / ${legacies.length}</span></h2>
          <ul class="codex-grid">${legacies.map((id) => (c.legacies.includes(id) ? `<li><strong>${esc(G.LEGACIES[id].name)}</strong><span>${esc(G.LEGACIES[id].desc)}</span></li>` : '<li class="unknown"><strong>???</strong></li>')).join('')}</ul>
        </section>
        <section><h2>Evolutions <span class="count">${c.evolutions.length} / ${evos.length}</span></h2>
          <p class="note">Merge the right two parts to evolve them. Discoveries unlock new archetypes and worlds.</p>
          <ul class="codex-grid">${evos.map(evoCard).join('')}</ul>
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
    const run = G.run;
    let parts = null; // null = full redraw
    switch (act) {
      case 'go': go(arg); return;
      case 'continue': if (G.meta.seenVersion !== G.VERSION) { G.meta.seenVersion = G.VERSION; G.saveMeta(); } G.ui.sheet = null; G.ui.viewer = null; if (G.resetMap) G.resetMap(); go('game'); return;
      case 'setup':
        if (G.meta.seenVersion !== G.VERSION) { G.meta.seenVersion = G.VERSION; G.saveMeta(); }
        G.ui.setup = G.ui.setup || { archetype: 'drifter', origin: 'tidal', hostility: 0 };
        if (!G.meta.unlocked.archetypes.includes(G.ui.setup.archetype)) G.ui.setup.archetype = 'drifter';
        if (!G.meta.unlocked.origins.includes(G.ui.setup.origin)) G.ui.setup.origin = 'tidal';
        G.ui.setup.hostility = Math.min(G.ui.setup.hostility, G.meta.maxHostility);
        go('setup'); return;
      case 'pick-archetype': G.ui.setup.archetype = arg; break;
      case 'pick-origin': G.ui.setup.origin = arg; break;
      case 'pick-hostility': G.ui.setup.hostility = Number(arg); break;
      case 'begin': G.newRun(G.ui.setup.archetype, G.ui.setup.origin, G.ui.setup.hostility); if (G.resetMap) G.resetMap(); G.ui.speed = Math.max(1, G.ui.speed); go('game'); return;
      case 'option': G.chooseOption(Number(arg)); parts = ['top', 'hud', 'modal']; break;
      case 'continue-scene': G.continueScene(); parts = ['top', 'hud', 'modal']; break;
      case 'continue-mutation': G.continueMutation(); parts = ['top', 'hud', 'modal']; break;
      case 'draft': G.pickDraft(arg, el.dataset.mode); parts = ['top', 'hud', 'modal']; break;
      case 'reroll': G.rerollDraft(); parts = ['modal']; break;
      case 'skip-draft': G.skipDraft(); parts = ['top', 'hud', 'modal']; break;
      case 'fascinate': G.setFascination(arg); G.ui.mindSel = null; parts = ['top', 'modal', 'sheet']; break;
      case 'mind-sel': G.ui.mindSel = arg; G.ui.keepScroll = true; parts = run && run.phase === 'mind' && !G.ui.sheet ? ['modal'] : ['sheet']; break;
      case 'continue-evolved': G.continueEvolved(); parts = ['top', 'hud', 'modal']; break;
      case 'instinct': G.setInstinct(arg); G.ui.keepScroll = true; parts = ['top', 'sheet']; break;
      case 'zone': G.setZone(arg); G.ui.keepScroll = true; parts = ['top', 'sheet']; break;
      case 'reshape': G.reshape(Number(arg)); G.ui.keepScroll = true; parts = ['top', 'sheet']; break;
      case 'look': G.setLook(el.dataset.kind, arg); G.ui.keepScroll = true; parts = ['top', 'sheet']; break;
      case 'sheet': G.ui.sheet = arg; G.ui.confirmAbandon = false; G.ui.speciesView = null; parts = ['sheet']; break;
      case 'species': G.ui.speciesView = Number(arg); parts = ['sheet']; break;
      case 'species-back': G.ui.speciesView = null; parts = ['sheet']; break;
      case 'close-sheet': G.ui.sheet = null; G.ui.speciesView = null; parts = ['sheet']; break;
      case 'view': G.ui.viewer = arg; parts = ['viewer']; break;
      case 'close-view': G.ui.viewer = null; parts = ['viewer']; break;
      case 'speed': G.ui.speed = Number(arg); parts = ['top']; break;
      case 'dismiss': if (run) run.notices.splice(Math.max(0, run.notices.length - 3) + Number(arg), 1); parts = ['hud']; break;
      case 'abandon': G.ui.confirmAbandon = true; G.ui.keepScroll = true; parts = ['sheet']; break;
      case 'abandon-no': G.ui.confirmAbandon = false; G.ui.keepScroll = true; parts = ['sheet']; break;
      case 'abandon-yes': G.endRunEarly(); G.ui.confirmAbandon = false; G.ui.sheet = null; parts = ['top', 'hud', 'modal', 'sheet']; break;
      case 'buy': G.buy(el.dataset.kind, arg); break;
      case 'reset': G.ui.confirmReset = true; break;
      case 'reset-no': G.ui.confirmReset = false; break;
      case 'reset-yes': G.resetAll(); go('title'); return;
      default: return;
    }
    render(parts);
  });

  // Color sliders update the look live.
  app.addEventListener('input', (e) => {
    const el = e.target.closest('[data-look]');
    if (!el) return;
    G.setLook(el.dataset.look, el.value);
    el.style.setProperty('--h', el.value);
    const prev = app.querySelector('.look-preview canvas');
    if (prev) G.drawPortrait(prev, G.run);
    const top = app.querySelector('#tb canvas.portrait');
    if (top) G.drawPortrait(top, G.run);
  });

  // ---------- Time ----------
  // Like CK3: time runs on the map, events pause it, and the speed buttons control it.
  let acc = 0;
  let lastT = performance.now();
  function clock(now) {
    const dt = Math.min(0.25, (now - lastT) / 1000);
    lastT = now;
    const run = G.run;
    const running = G.ui.screen === 'game' && run && run.phase === 'map' && !G.ui.sheet && G.ui.viewer == null && G.ui.speed > 0;
    const per = G.SPEEDS[G.ui.speed] || 1;
    if (running) {
      acc += dt;
      if (acc >= per) {
        acc = 0;
        G.tick();
        render(G.run.phase === 'map' ? ['top', 'hud'] : ['top', 'hud', 'modal']);
      }
    }
    const fill = app.querySelector('.tick-fill');
    if (fill) fill.style.width = `${running ? Math.min(100, (acc / per) * 100) : 0}%`;
    requestAnimationFrame(clock);
  }
  requestAnimationFrame(clock);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && G.ui.viewer != null) { G.ui.viewer = null; render(['viewer']); return; }
    if (e.key === 'Escape' && G.ui.sheet) { G.ui.sheet = null; render(['sheet']); return; }
    if (e.key === ' ' && G.ui.screen === 'game' && G.run && G.run.phase === 'map' && !e.target.closest('input')) { e.preventDefault(); G.ui.speed = G.ui.speed ? 0 : 1; render(['top']); }
  });

  render();
}());
