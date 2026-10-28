// Screens and buttons. Menus are redrawn from the current state after each tap. In a game,
// the world map stays mounted and only the parts that changed are redrawn.
window.G = window.G || {};

(function () {
  const app = document.getElementById('app');
  // Framed on a phone (e.g. an artifact viewer): the notch size isn't passed in, so guess it.
  try { if (window.self !== window.top && window.matchMedia('(pointer: coarse)').matches) document.documentElement.classList.add('notch-guess'); } catch (e) { document.documentElement.classList.add('notch-guess'); }
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

  // First-time tips float above everything and pause the game until dismissed.
  const tipEl = document.createElement('div'); tipEl.id = 'tip'; document.body.appendChild(tipEl);
  function renderTip() {
    if (G.ui.guideShown) { tipEl.innerHTML = ''; return; }
    if (!G.ui.tip) { const next = G.nextTutorial(G.run, G.ui); if (next) G.ui.tip = next.id; }
    const t = G.ui.tip && G.TUTORIAL[G.ui.tip];
    const text = t && (typeof t.text === 'function' ? t.text(G.run) : t.text);
    tipEl.innerHTML = t && text ? `<div class="tip-card" role="dialog" aria-label="Tip: ${esc(t.title)}">
        <p class="eyebrow">Tip</p><h3>${esc(t.title)}</h3><p>${esc(text)}</p>
        <div class="row tight"><button class="btn primary" data-tip="ok">Got it</button><button class="btn ghost small" data-tip="off">Turn off tips</button></div>
      </div>` : '';
    if (t && !text) { G.seeTutorial(t.id); G.ui.tip = null; }
  }
  tipEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tip]');
    if (!b) return;
    G.seeTutorial(G.ui.tip); G.ui.tip = null;
    if (b.dataset.tip === 'off') { G.meta.tipsOff = true; G.saveMeta(); }
    renderTip();
  });

  // ---------- The guide (First Steps) ----------
  // A small coach bubble that points at one thing at a time. It lights up its target and sits above or
  // below it. Steps that need reading stop the clock; steps that ask you to do something wait for you.
  const guideEl = document.createElement('div'); guideEl.id = 'guide'; document.body.appendChild(guideEl);
  G.guideHolding = () => { const g = G.ui.guideShown && G.GUIDE_STEP[G.ui.guideShown]; return !!(g && !G.guideDone(g.id) && G.guideOn() && (g.hold || g.pause)); };
  function renderGuide() {
    const g = G.guideStep(G.run, G.ui);
    document.querySelectorAll('.guide-target').forEach((el) => el.classList.remove('guide-target', 'guide-light'));
    G.ui.guideShown = g ? g.id : null;
    if (!g) { guideEl.innerHTML = ''; guideEl.dataset.step = ''; return; }
    const text = typeof g.text === 'function' ? g.text(G.run) : g.text;
    // Only rebuild the card when the step changes; the clock redraws the screen every turn.
    if (guideEl.dataset.step !== g.id) guideEl.innerHTML = `<div class="guide-card" role="dialog" aria-label="Guide: ${esc(g.title)}">
        <p class="eyebrow">Guide</p><h3>${esc(g.title)}</h3><p>${esc(text)}</p>
        <div class="row tight">${g.hold ? '<button class="btn primary small" data-guide="next">Next</button>' : ''}<button class="btn ghost small" data-guide="skip">Skip the guide</button></div>
      </div>`;
    guideEl.dataset.step = g.id;
    const target = g.target && Array.from(document.querySelectorAll(g.target)).find((el) => el.offsetParent !== null || el.getClientRects().length);
    const card = guideEl.firstElementChild;
    if (target) {
      target.classList.add('guide-target');
      if (g.light) target.classList.add('guide-light');
      const r = target.getBoundingClientRect();
      // Sit below a target in the top half of the screen, above one in the bottom half (or where the step says).
      const below = g.place ? g.place === 'bottom' : r.top + r.height / 2 < window.innerHeight / 2;
      guideEl.dataset.place = below ? 'below' : 'above';
      card.style.top = below ? `${Math.min(window.innerHeight - 160, r.bottom + 12)}px` : '';
      card.style.bottom = below ? '' : `${Math.max(12, window.innerHeight - r.top + 12)}px`;
      if (g.place === 'top') { card.style.top = 'calc(12px + var(--safe-top))'; card.style.bottom = ''; }
    } else { guideEl.dataset.place = 'center'; }
  }
  guideEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-guide]');
    if (!b) return;
    if (b.dataset.guide === 'skip') G.skipGuide(); else if (G.ui.guideShown) G.finishGuideStep(G.ui.guideShown);
    render(G.ui.screen === 'game' && app.querySelector('.game') ? ['top', 'hud'] : null);
  });
  window.addEventListener('resize', () => renderGuide());

  // parts: redraw only these pieces of a mounted game ('top', 'hud', 'modal', 'sheet', 'viewer').
  function render(parts) {
    renderInner(parts);
    renderGuide();
    renderTip();
    if (G.audio) G.audio.update();
  }
  function renderInner(parts) {
    const s = G.ui.screen;
    const run = G.run;
    if (s === 'game' && run && parts && app.querySelector('.game')) { renderParts(run, parts); return; }
    let html = '';
    if (s === 'title') html = titleScreen();
    else if (s === 'setup') html = setupScreen();
    else if (s === 'unlocks') html = unlocksScreen();
    else if (s === 'codex') html = codexScreen();
    else if (s === 'fossils') html = fossilScreen();
    else if (s === 'options') html = optionsScreen();
    else if (s === 'game') html = run ? gameScreen(run) : titleScreen();
    if (G.stopScene) G.stopScene();
    app.innerHTML = html;
    app.dataset.screen = s;
    // Portraits of fossils and past lineages.
    app.querySelectorAll('canvas[data-fossil]').forEach((c) => { const f = G.meta.fossils.find((x) => x.id === c.dataset.fossil); if (f) G.drawPortrait(c, f.body); });
    app.querySelectorAll('canvas[data-history]').forEach((c) => { const h = G.meta.history[Number(c.dataset.history)]; if (h && h.body) G.drawPortrait(c, h.body); });
    if (s === 'game' && run) {
      renderParts(run, ['top', 'hud', 'modal', 'sheet', 'viewer', 'editor']);
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
      const oldM = app.querySelector('#modal .modal'); const mScroll = oldM ? oldM.scrollTop : 0;
      const el = put('#modal', modal(run));
      paintPortraits(el, run);
      paintScene(el, run);
      // Tapping inside a modal (a tree node) keeps your place; a new card starts at the top.
      if (el && el.firstElementChild) { const m = el.querySelector('.modal'); if (m) m.scrollTop = G.ui.keepScroll ? mScroll : 0; }
      if (!parts.includes('sheet')) G.ui.keepScroll = false;
    }
    if (parts.includes('sheet')) {
      const old = app.querySelector('.sheet-body');
      const scroll = old ? old.scrollTop : 0;
      const el = put('#sheet', sheet(run));
      paintPortraits(el, run);
      if (el && run.book && run.book.origin) el.querySelectorAll('canvas.book-origin').forEach((c) => G.drawPortrait(c, run.book.origin.body));
      const nb = app.querySelector('.sheet-body');
      if (nb && G.ui.keepScroll) nb.scrollTop = scroll;
      G.ui.keepScroll = false;
    }
    if (parts.includes('editor')) {
      const old = app.querySelector('.editor-body');
      const scroll = old ? old.scrollTop : 0;
      const el = put('#editor', editor(run));
      const c = el && el.querySelector('canvas.editor-canvas');
      if (c) G.playEditor(c);
      const nb = app.querySelector('.editor-body');
      if (nb && G.ui.keepEditorScroll) nb.scrollTop = scroll;
      G.ui.keepEditorScroll = false;
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
    if (run.phase === 'scene') {
      info = run.scene;
      const wait = G.buildUp(info) * 1000;
      if (wait && G.ui.revealFor !== info) { G.ui.revealFor = info; G.ui.revealAt = Date.now() + wait; setTimeout(() => { if (G.run && G.run.scene === info) render(['top']); }, wait + 60); }
    }
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
    G.ui.confirmDel = null; G.ui.renaming = null; G.ui.saveMove = null; G.ui.confirmDaily = false; G.ui.dailyShared = false;
    if (screen === 'options' || screen === 'title') prepareSaveCode();
    G.ui.sheet = null;
    render();
    window.scrollTo(0, 0);
  }

  // ---------- Home-screen app ----------
  // On the hosted game (which has a manifest), suggest adding it to the home screen until it is, or until dismissed.
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); G.installPrompt = e; if (G.ui.screen === 'title') render(); });
  const standalone = () => (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const hosted = () => !!document.querySelector('link[rel="manifest"]');
  const ago = (t) => { const d = Math.floor((Date.now() - t) / 86400000); return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`; };
  // Keeping progress safe. In Safari on an iPhone, a site's saved data is deleted after 7 days of using Safari
  // without opening that site; a home-screen app keeps its own. So: in Safari with progress, say so plainly and
  // offer a backup; elsewhere, remind now and then to save a backup file that lives outside the browser.
  function installHint() {
    const m = G.meta; const o = m.options || {};
    const backupBtns = `<button class="btn small primary" ${G.ui.saveCode ? 'data-act="save-download"' : 'disabled'}>${G.ui.saveCode ? 'Save a backup file' : 'Preparing…'}</button><button class="btn small" ${G.ui.saveCode ? 'data-act="save-copy-title"' : 'disabled'}>${G.ui.titleCopied ? 'Copied ✓' : 'Copy save code'}</button>`;
    const hasProgress = m.stats.runs > 0 || m.genes > 0;
    if (!standalone() && hosted() && isIOS() && hasProgress && !G.ui.safetyHidden) {
      return `<div class="install-hint urgent">
        <p><b>⚠️ Keep your progress safe.</b> In Safari, iPhones delete a website's saved data after 7 days of using Safari without opening it. The <b>Home Screen app</b> keeps its own save, so play from there:</p>
        <ol><li>Save a backup file (or copy your save code) below.</li><li>Tap Share (the square with an arrow), then <b>Add to Home Screen</b>.</li><li>Open Primordia from your Home Screen, go to <b>Options</b>, and load the file (or tap <b>Paste from clipboard</b>).</li></ol>
        <div class="row tight wrap">${backupBtns}<button class="btn small ghost" data-act="safety-hide">Hide for now</button></div>
        ${m.lastBackupAt ? `<p class="note">Last backup: ${ago(m.lastBackupAt)}.</p>` : ''}
      </div>`;
    }
    // A gentle reminder in the app (or any browser) for players with progress worth keeping.
    const due = !m.lastBackupAt || Date.now() - m.lastBackupAt > 14 * 86400000;
    const snoozed = o.backupSnooze && Date.now() - o.backupSnooze < 7 * 86400000;
    if (m.stats.runs >= 3 && due && !snoozed) {
      return `<div class="install-hint">
        <p><b>Back up your progress.</b> ${m.lastBackupAt ? `Your last backup was ${ago(m.lastBackupAt)}.` : 'You have not made a backup yet.'} A backup file saved to Files or iCloud Drive keeps your progress even if this browser clears its data or you change phones.</p>
        <div class="row tight wrap">${backupBtns}<button class="btn small ghost" data-act="backup-snooze">Not now</button></div>
      </div>`;
    }
    if (standalone() || !hosted() || o.installHidden) return '';
    if (!isIOS() && !G.installPrompt) return '';
    return `<div class="install-hint">
        <p><b>Play it like an app.</b> ${isIOS() ? 'Tap Share (the square with an arrow), then <b>Add to Home Screen</b>.' : 'Install Primordia on this device.'} It opens full-screen, works without internet${isIOS() ? ', and keeps your save safe (Safari can delete it after a week away)' : ''}. Your progress here stays here: use <b>Options → Move your save</b> to take it with you.</p>
        <div class="row tight">${G.installPrompt ? '<button class="btn small primary" data-act="install">Install</button>' : ''}<button class="btn small ghost" data-act="install-hide">Not now</button></div>
      </div>`;
  }

  // ---------- The Daily Run ----------
  function dailyCard(live) {
    if (!G.dailyOpen()) return '';
    const key = G.dailyKey(); const d = G.dailySetup(key);
    const rec = G.dailyRecord(); const today = rec.days[key];
    const arch = G.ARCHETYPE[d.archetype]; const origin = G.ORIGIN[d.origin];
    const pct = Math.round((0.25 * d.hostility + G.compBonus(d.complications) + G.DAILY_BONUS) * 100);
    const playingIt = live && G.run.daily === key;
    const confirm = G.ui.confirmDaily;
    return `<section class="daily-card">
        <div class="daily-head"><strong>📅 Daily Run</strong><span>${esc(new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }))}</span></div>
        <p>${esc(arch.name)} in the ${esc(origin.name)} · Hostility ${d.hostility} · ${d.complications.map((id) => esc(G.COMPLICATION[id].name)).join(', ')} · <b>+${pct}% Genetic Memory</b></p>
        <p class="note">The same world for everyone today, even if you have not unlocked it yet.</p>
        ${today ? `<p class="note good-text">Your best today: ${esc(today.reached)}${today.victory ? ' (won)' : ''} in ${today.turns} turns.</p>` : ''}
        ${rec.streak > 1 && rec.last === key ? `<p class="note">🔥 ${rec.streak}-day streak</p>` : ''}
        <div class="row tight wrap">
          ${playingIt ? '' : confirm
            ? '<span class="note">This ends the lineage you are playing now.</span><button class="btn small danger" data-act="daily-yes">Play the Daily Run</button><button class="btn small ghost" data-act="daily-no">Cancel</button>'
            : `<button class="btn small primary" data-act="daily-start">${today ? 'Play it again' : 'Play today\'s run'}</button>`}
          ${today ? `<button class="btn small ghost" data-act="daily-share">${G.ui.dailyShared ? 'Copied ✓' : 'Share result'}</button>` : ''}
        </div>
      </section>`;
  }
  function dailyShareText() {
    const key = G.dailyKey(); const d = G.dailySetup(key); const rec = G.dailyRecord(); const t = rec.days[key];
    if (!t) return '';
    return [`Primordia Daily Run, ${new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`,
      `${G.ARCHETYPE[d.archetype].name} in the ${G.ORIGIN[d.origin].name} · ${d.complications.map((id) => G.COMPLICATION[id].name).join(', ')}`,
      `🧬 ${t.reached}${t.victory ? ' (won)' : ''} in ${t.turns} turns`,
      rec.streak > 1 && rec.last === key ? `🔥 ${rec.streak}-day streak` : ''].filter(Boolean).join('\n');
  }
  function beginDaily() {
    if (G.run && G.run.phase !== 'end') G.endRunEarly();
    G.startDaily(); G.ui.confirmDaily = false;
    if (G.resetMap) G.resetMap(); G.ui.speed = Math.max(1, G.ui.speed); go('game');
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
        ${G.storageFailed ? '<p class="save-warn">Your progress could not be saved on this device (its storage is full or blocked). Copy your save code in Options to keep it safe.</p>' : ''}
        ${G.restoredFromBackup ? '<p class="save-warn">Your save could not be read, so the game loaded its backup copy.</p>' : ''}
        ${installHint()}
        ${dailyCard(live)}
        <div class="menu">
          ${live ? `<button class="btn primary" data-act="continue">Continue ${G.run.lineage ? `the ${esc(G.run.lineage.name)}` : 'lineage'} <small>${esc(G.STAGES[G.run.stage].name)}, ${esc(G.STAGES[G.run.stage].turnName)} ${G.run.stageTurn}</small></button>` : ''}
          <button class="btn ${live ? '' : 'primary'}" data-act="setup">New lineage</button>
          <button class="btn" data-act="go" data-arg="unlocks">Evolution Tree and unlocks <span class="gene-count">${ICON.gene} ${m.genes}</span></button>
          <button class="btn" data-act="go" data-arg="fossils">Fossil Record${m.fossils.some((f) => f.amber) ? ` <small>${m.fossils.filter((f) => f.amber).length} in amber</small>` : ''}</button>
          <button class="btn" data-act="go" data-arg="codex">Codex of Life</button>
          <button class="btn ghost" data-act="go" data-arg="options">Options</button>
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
          <p class="note">Tips appear the first time each feature shows up. ${G.meta.tipsOff || G.meta.tips.length ? '<button class="btn small" data-act="tips-reset">Show all tips again</button>' : ''}</p>
          <ol>
            <li>Time flows on the world map. Use pause and the speed buttons, like in CK3. Events pop up at random and pause the game; choose how to respond. Buttons show your chance of success.</li>
            <li>Watch every species roam the map. Herd size shows population. Tap any herd, or your portrait (top left), to inspect it.</li>
            <li>Your <b>Instinct</b> (top right) decides how you find food and which events find you. Sea creatures also choose a home depth there, from the sunlit shallows down to the abyss.</li>
            <li>Each turn your Population eats Food. Spare Food grows your Population. Run out and you starve.</li>
            <li>DNA brings mutations. Mutations can <b>merge</b> with the part already in a slot. The right pairs <b>evolve</b> into powerful new parts. Creatures start with stubby limbs: merge them with limb mutations to grow legs, arms, wings and fins.</li>
            <li>Every evolution you discover is saved: in future runs it can turn up in mutation drafts. Discoveries also unlock archetypes and worlds.</li>
            <li>This is a roguelike: your first lineages will die young. Spend the Genetic Memory they earn on the <b>Evolution Tree</b> (stats, more DNA, lower DNA goals, Twin sockets that let a slot hold two parts) so every lineage gets further.</li>
            <li>The <b>Activities</b> tab lets your kind migrate, go to war, court, avoid or hunt a species, or scout. Each plays out over several turns.</li>
            <li>When you become a creature, the <b>Creature Editor</b> opens: shape your body, limbs, head, colors and patterns. Open it again from the Look tab whenever you like, for free.</li>
            <li>Each milestone leaves a fossil. Keep a favourite in amber in the <b>Fossil Record</b> and you can revive it later, so a build you love is never lost.</li>
            <li>Milestones change everything: becoming multicellular, leaving the sea (or not), the Age of Giants, and the Spark of Mind.</li>
            <li>Every run earns Genetic Memory, win or lose. Spend it on archetypes, home worlds, part packs and permanent boosts.</li>
          </ol>
        </details>
      </main>`;
  }

  // ---------- New run setup ----------
  // Stage Select: begin again at the start of a Tribe you have reached before. Free.
  function stageSelect() {
    const list = G.stageStarts();
    if (!list.length) return '';
    return `
      <details class="setup-group stage-select">
        <summary><h2>Stage Select <span class="count">${list.length}</span></h2></summary>
        <p class="note">Start in the Tribe, Society, Renaissance or Colonial Age, from a people you have founded before. It is free, and earlier endings are not paid out again.</p>
        <div class="choices">${list.map((x) => { const p = G.PATH[x.key.split('|')[0]]; return `
          <button class="choice" data-act="stage-start" data-arg="${esc(x.key)}">
            <span class="choice-head"><span class="swatch" style="--h:${x.body && x.body.hue != null ? x.body.hue : 200}"></span><strong>The ${esc(x.kind)}</strong>${x.lineage ? `<small class="muted">${esc(x.lineage.name)}</small>` : ''}</span>
            <span class="choice-desc">${x.stage === 'colonial' ? '👑 Colonial Age · ' : x.stage === 'renaissance' ? '📚 Renaissance · ' : x.stage === 'society' ? '🏛️ Society · ' : '🔥 Tribe · '}${p ? `${p.icon} ${esc(p.name)} · ` : ''}${esc(x.ending)} · ${esc(G.ARCHETYPE[x.archetype] ? G.ARCHETYPE[x.archetype].name : '')}</span>
          </button>`; }).join('')}</div>
      </details>`;
  }

  function setupScreen() {
    const m = G.meta;
    const st = G.ui.setup;
    // Compact cards: only what you own is listed (the rest waits in Unlocks); the chosen one shows its rule.
    const card = (kind, item, selected) => `
      <button class="choice compact ${selected ? 'selected' : ''}" data-act="pick-${kind}" data-arg="${item.id}" aria-pressed="${selected}">
        <span class="choice-head"><span class="swatch" style="--h:${item.color != null ? item.color : item.hue}"></span><strong>${esc(item.name)}</strong>${item.difficulty ? `<span class="choice-diff d${item.difficulty}">${'★'.repeat(item.difficulty)}${'☆'.repeat(3 - item.difficulty)}</span>` : ''}</span>
        <span class="choice-desc">${esc(item.desc)}</span>
        ${selected && item.rule ? `<span class="choice-rule"><b>${esc(item.rule)}.</b> ${esc(item.ruleDesc)}</span>` : ''}
      </button>`;
    const hostility = m.maxHostility > 0 ? `
      <section class="setup-group">
        <h2>Hostility</h2>
        <p class="note">Harder worlds give more Genetic Memory (+25% per level). Level 2 and up: eat 1 more Food. Level 4 and up: −20 max Population. Every level makes checks harder.</p>
        <div class="segmented">${Array.from({ length: m.maxHostility + 1 }, (_, i) => `<button class="seg ${st.hostility === i ? 'selected' : ''}" data-act="pick-hostility" data-arg="${i}" aria-pressed="${st.hostility === i}">${i}</button>`).join('')}</div>
      </section>` : '';
    return `
      <main class="setup">
        <header class="screen-head"><button class="btn ghost" data-act="go" data-arg="title">Back</button><h1>New lineage</h1></header>
        ${stageSelect()}
        <section class="setup-group"><h2>Archetype</h2><div class="choices">${G.ARCHETYPES.filter((a) => m.unlocked.archetypes.includes(a.id)).map((a) => card('archetype', a, st.archetype === a.id)).join('')}</div></section>
        ${m.unlocked.origins.length > 1 ? `<section class="setup-group"><h2>Home world</h2><div class="choices">${G.ORIGINS.filter((o) => m.unlocked.origins.includes(o.id)).map((o) => card('origin', o, st.origin === o.id)).join('')}</div></section>` : ''}
        ${hostility}
        ${G.chosenComplications().length ? `<section class="setup-group"><h2>Complications</h2><p class="note">${G.chosenComplications().map((id) => esc(G.COMPLICATION[id].name)).join(', ')}: <b>+${Math.round(G.compBonus(G.chosenComplications()) * 100)}% Genetic Memory</b>. <button class="btn small ghost" data-act="go" data-arg="options">Change in Options</button></p></section>` : ''}
        <section class="setup-group"><h2>Name</h2><div class="name-row"><input id="lineage-name" type="text" maxlength="${G.LINEAGE_NAME_MAX}" value="${esc(st.name || '')}" aria-label="Lineage name" autocomplete="off"><button class="btn small ghost" data-act="name-dice" aria-label="Pick another name">🎲</button></div><p class="note">Your lineage keeps this name in the Fossil Record, so you can tell your save points apart. You can change it later.</p></section>
        <div class="sticky-cta"><button class="btn primary wide" data-act="begin">Begin in the ${esc(G.ORIGIN[st.origin].name)}</button></div>
      </main>`;
  }

  // ---------- Game: top bar ----------
  function topBar(run) {
    const st = G.STAGES[run.stage];
    // While a scene builds up, the numbers hold still; they change once the outcome is shown.
    const sc0 = run.phase === 'scene' && run.scene;
    const held = sc0 && sc0.before && G.buildUp(sc0) && (G.ui.revealFor !== sc0 || Date.now() < (G.ui.revealAt || 0)) ? sc0.before : null;
    if (held) run = Object.assign(Object.create(Object.getPrototypeOf(run)), run, held);
    const max = G.maxPop(run);
    const inc = G.income(run);
    const up = G.upkeep(run);
    const net = inc.total - up;
    const goal = nextGoal(run);
    const pct = goal ? Math.min(100, (run.dna / goal.at) * 100) : 100;
    const fasc = run.fascination && G.INNOVATION[run.fascination];
    const gt = G.gateFor(run); const gateNow = gt && !goal && gt.reached && !gt.known ? gt : null;
    return `
      <header class="topbar">
        <button class="portrait-btn" data-act="sheet" data-arg="body" aria-label="Open your lineage"><canvas class="portrait"></canvas></button>
        <div class="tb-main">
          <div class="tb-title"><strong>${esc(st.name.replace(/ Stage$/, ''))}</strong><span ${G.biomeMatters(run) ? tappable('biome') : ''}>${esc(st.turnName)} ${run.stageTurn}${G.biomeMatters(run) ? ` · ${esc(G.biome(run).name)}` : ''}</span>${dietBadge(run)}${G.civ(run) ? dispBadge(run, true) : ''}</div>
          <div class="res-row">
            <span ${tappable('pop')} class="res pop ${run.pop <= 2 * G.POP_SCALE ? 'warn' : run.pop > max ? 'over' : ''}" title="${esc(`${G.people(run) ? 'Your people. At 0 they are gone.' : 'Population. At 0 your lineage is extinct.'} Comfortable size ${max}: past it, crowded members eat twice, young cost more and crowding sickness sets in. Absolute limit ${G.hardPop(run)}.`)}">${ICON.pop}<b>${run.pop}</b>${run.pop > max ? '<i class="neg">crowded</i>' : ''}</span>
            <span ${tappable('food')} class="res food ${net < 0 && run.food < -net * 2 ? 'warn' : ''}" title="${esc(`Food: ${G.DIET_NAMES[G.diet(run)]}s eat ${G.edible(run).join(' and ')}. Meat feeds 1.5 each but a fifth of it rots every turn; plants keep. Gathered ${inc.meat ? `${inc.meat} meat` : ''}${inc.meat && inc.plants ? ' and ' : ''}${inc.plants ? `${inc.plants} plants` : ''}, eaten ${up} per turn.`)}">${G.edible(run).map((k) => `<span class="fk">${k === 'meat' ? '🥩' : '🌿'}<b>${Math.max(0, run[k] == null ? run.food : run[k])}</b></span>`).join('')}<i class="${net < 0 ? 'neg' : ''}">${net >= 0 ? '+' : '−'}${Math.abs(net)}</i></span>
            ${tribeChips(run)}
            ${run.mind && run.stage === 'creature' ? `<span ${tappable('insight')} class="res insight" title="Insight toward ${fasc ? esc(G.innovationName(fasc, run)) : 'nothing yet'}">${ICON.insight}<b>${run.insight}</b>${fasc ? `/${G.innovationCost(run, fasc)}` : ''}</span>` : ''}
            ${gimmickChip(run)}
            ${run.activity ? `<span ${tappable('activity')} class="res gimmick" title="Your current Activity">${esc(G.ACTIVITY[run.activity.id].name)}${run.activity.target ? `: ${esc(run.activity.target)}` : ''}${run.activity.id === 'war' ? ` ${run.activity.score > 0 ? '+' : ''}${run.activity.score}` : ''}</span>` : ''}
          </div>
          <div class="evo" ${gateNow ? `data-act="sheet" data-arg="${gateNow.tab}" role="button" tabindex="0"` : tappable('progress')} title="${G.dnaWord(run)}">
            <span class="evo-label">${run.stage === 'colonial' ? '👑' : run.stage === 'renaissance' ? '📚' : run.stage === 'society' ? '🏛️' : run.stage === 'tribe' ? '💡' : ICON.dna}<b>${run.dna}</b>${goal ? ` / ${goal.at} · ${esc(goal.label)}` : gateNow ? ` · <span class="gate-cta">${esc(gateNow.verb)} ${esc(gateNow.name)} ›</span>` : ''}</span>
            <span class="evo-bar"><span class="fill" style="width:${pct}%"></span></span>
          </div>
        </div>
        <div class="tb-right"><button class="instinct-btn" data-act="sheet" data-arg="instinct"><span>Instinct</span><b>${esc(G.INSTINCT[run.instinct].name)}</b></button>${speedControls(run)}</div>
        ${explainPanel(run)}
      </header>`;
  }

  // ---------- Tap to explain (Patch 16.3.1) ----------
  // Every number in the top bar can be tapped: it opens a panel saying what it means and where it comes from.
  const sgn = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)}`;
  const xrow = (label, v, cls) => `<div class="xrow ${cls || ''}"><span>${esc(label)}</span><b class="${typeof v === 'number' ? (v < 0 ? 'neg' : v > 0 ? 'pos' : '') : ''}">${typeof v === 'number' ? sgn(v) : esc(v)}</b></div>`;
  const xtotal = (label, v) => `<div class="xrow total"><span>${esc(label)}</span><b>${typeof v === 'number' ? sgn(v) : esc(v)}</b></div>`;
  const xsrc = (run, key, scale) => G.modBreakdown(run, key).map((x) => xrow(x.src, Math.round(x.v * (scale || 1)))).join('');
  const tappable = (key) => `data-act="explain" data-arg="${key}" role="button" tabindex="0"`;
  function explainPanel(run) {
    const key = G.ui.explain; if (!key) return '';
    const k = G.people(run) ? G.kind(run) : null;
    const word = G.people(run) ? 'members' : 'Population';
    let title = ''; let body = '';
    if (key === 'pop') {
      const max = G.maxPop(run); const hard = G.hardPop(run); const over = Math.max(0, run.pop - max);
      const size = G.SIZES[G.sizeOf(run)]; const many = G.people(run) && run.path === 'many' ? 0.5 : 1; const graze = G.gimmick(run) === 'grazer' ? 1.6 : 1;
      const per = Math.round(size.popMult * many * graze * G.POP_SCALE * 10) / 10;
      title = G.people(run) ? 'Members' : 'Population';
      body = `<p>You are <b>${run.pop}</b>. Your comfortable size is <b>${max}</b> and you can never go above <b>${hard}</b>.</p>
        ${over ? `<p class="bad-note"><b>Crowded</b> by ${over}. Past your comfortable size, crowded members eat twice, young cost more, gains are halved, and crowding sickness takes a tenth of the excess every turn (about ${Math.ceil(over / 10)} now).</p>` : `<p>Spare Food raises young: a brood of about ${G.POP_SCALE} costs ${G.growthCost(run) + (G.people(run) ? G.TRIBE_CHILD_COST : 0)} Food.</p>`}
        <h4>Comfortable size</h4>
        ${G.civ(run) ? xrow(`Your ${G.socKind(run).settlement}s`, Math.round((4 + (run.settlements || []).reduce((t, x) => t + x.size * 5, 0)) * per)) : xrow('Your kind', Math.round((run.baseMaxPop + (run.multicellular ? 2 : 0) + (run.stage !== 'cell' ? 3 : 0) + (run.stage === 'tribe' ? 2 + 2 * G.boonLevel('w_blood') : 0) + (run.era - 1) * 3) * per))}
        ${xsrc(run, 'maxPop', per)}
        ${xtotal('Comfortable size', String(max))}
        <p class="note">Each +1 in a description is about ${Math.round(per)} ${word} for you: ${esc(size.name.toLowerCase())} creatures${many < 1 ? ', Many Minds (half)' : ''}${graze > 1 ? ', a Herd (60% more)' : ''}.</p>`;
    } else if (key === 'food') {
      const inc = G.income(run); const up = G.upkeep(run); const net = inc.total - up;
      const heads = G.heads(run); const exc = Math.max(0, run.pop - G.maxPop(run)) / G.POP_SCALE; const div = G.SIZES[G.sizeOf(run)].eatDiv;
      const eatAll = Math.ceil((heads + exc) / div); const eatBase = Math.ceil(heads / div);
      title = 'Food';
      body = `<p>${esc(G.DIET_NAMES[G.diet(run)])}s eat ${esc(G.edible(run).join(' and '))}. You have ${G.edible(run).map((f) => `<b>${Math.max(0, run[f] == null ? run.food : run[f])}</b> ${f}`).join(' and ')}, and can store up to ${G.foodCap(run)}.</p>
        <h4>Gathered each turn</h4>
        ${inc.parts.filter((x) => x.v).map((x) => xrow(x.label, x.v)).join('')}
        ${G.modBreakdown(run, 'foodPerTurn').length ? `<p class="note">“Helpers and allies” is: ${esc(G.modBreakdown(run, 'foodPerTurn').map((x) => `${x.src} ${sgn(x.v)}`).join(', '))}.</p>` : ''}
        ${xtotal('Gathered', inc.total)}
        <h4>Eaten each turn</h4>
        ${xrow(`${run.pop} ${word} (1 Food per ${div * G.POP_SCALE})`, -eatBase)}
        ${eatAll > eatBase ? xrow('Crowded members eat twice', -(eatAll - eatBase)) : ''}
        ${G.modBreakdown(run, 'upkeep').map((x) => xrow(x.src, -x.v)).join('')}
        ${xtotal('Eaten', -up)}
        ${xtotal('Each turn', net)}
        <p class="note">Meat feeds 1.5 each, but a fifth of it rots every turn; plants keep.${net < 0 ? ' Short of food, you lose members.' : ''}</p>`;
    } else if (key === 'progress') {
      const w = G.dnaWord(run); const goal = nextGoal(run);
      title = w;
      const per = G.dnaPerTurn(run);
      const srcKey = G.civ(run) ? 'influencePerTurn' : run.stage === 'tribe' ? 'ideasPerTurn' : 'dnaPerTurn';
      body = `<p>${run.stage === 'colonial' ? 'Prestige comes from your cities, your colonies and your Crown, and brings new technologies for your Crown tree.' : run.stage === 'renaissance' ? 'Learning comes from your cities, your scholars and your patrons, and brings new inventions for your Reason tree.' : run.stage === 'society' ? 'Influence comes from your settlements and brings new Traditions.' : run.stage === 'tribe' ? 'Ideas come from your people and bring new Discoveries.' : 'DNA comes with time and from events, and brings new mutations.'} You have <b>${run.dna}</b>${goal ? `; the next ${esc(goal.label)} comes at <b>${goal.at}</b>` : ''}.</p>
        <h4>Each turn</h4>
        ${run.stage === 'tribe' ? xrow('Base', 1) + (Math.floor(G.stat(run, 'cun') / 10) ? xrow('Cunning', Math.floor(G.stat(run, 'cun') / 10)) : '') + (run.instinct === 'explore' ? xrow('Exploring', 1 + Math.ceil(G.mod(run, 'exploreBonus') / 2)) : '') : G.civ(run) && run.instinct === 'explore' ? xrow('Exploring', 1 + Math.ceil(G.mod(run, 'exploreBonus') / 2)) : ''}
        ${xsrc(run, srcKey)}
        ${xtotal('Each turn', per)}
        <p class="note">Events give and take ${esc(w)} too.</p>`;
    } else if (key === 'special' && k) {
      const gain = G.specialGain(run); const use = G.specialUpkeep(run); const over = Math.max(0, (run.special || 0) - G.SPECIAL_SOFT);
      title = k.resource;
      body = `<p>${esc(G.sub(G.KINDS[run.path].desc, run))}</p>
        <p>You have <b>${run.special || 0}</b>. Discoveries cost ${esc(k.resource)}. Comfortable up to ${G.SPECIAL_SOFT} (gains past it are halved, and a tenth of the excess spoils each turn); never more than ${G.SPECIAL_HARD}.</p>
        <h4>Each turn</h4>
        ${xrow('Your people make', 2)}${G.civ(run) && Math.floor((run.settlements || []).reduce((t, x) => t + x.size, 0) / 6) ? xrow('Your settlements', Math.floor((run.settlements || []).reduce((t, x) => t + x.size, 0) / 6)) : ''}${G.scholarGain(run) ? xrow('Your scholars (surplus Learning)', G.scholarGain(run)) : ''}
        ${xsrc(run, 'specialPerTurn')}
        ${use ? xrow(G.civ(run) ? 'Your settlements use' : `${run.pop} members use`, -use) : ''}
        ${over ? xrow('Spoils (over the comfortable amount)', -Math.max(1, Math.round(over * 0.1))) : ''}
        ${xtotal('Each turn', gain - use - (over ? Math.max(1, Math.round(over * 0.1)) : 0))}
        <p class="note">Right now discoveries cost ${sgn(G.discoveryCostPct(run))}% of their base price.</p>`;
    } else if (key === 'leader') {
      const l = run.leader;
      title = G.people(run) ? `Your ${G.kind(run).leader ? G.kind(run).leader.toLowerCase() : 'leader'}` : 'Leader';
      if (!l) body = '<p>No one leads right now. A new leader is chosen soon.</p>';
      else {
        const bg = l.bg && G.LEADER_BACKGROUND[l.bg]; const amb = l.amb && G.AMBITIONS[l.amb]; const pr = G.ambitionProgress(run, l);
        const left = Math.max(0, l.life - (run.turn - l.since));
        body = `<p><b>${esc(G.leaderTitle ? G.leaderTitle(l) : l.name)}</b>. About ${left} more years of life.</p>
          <h4>While they lead</h4>
          ${bg ? xrow(`${bg.name}: ${G.sub(bg.text, run)}`, G.describeMods(bg.mods)) : ''}
          ${l.traits.map((t) => xrow(G.LEADER_TRAITS[t].name, G.describeMods(G.LEADER_TRAITS[t].mods))).join('')}
          ${amb ? `<h4>Ambition: ${esc(amb.name)}</h4><p>Wants to ${esc(G.sub(amb.want, run))}${pr ? ` (${pr.now} of ${pr.goal})` : ''}. If they manage it, your people keep <b>${esc(G.describeMods(amb.legacy))}</b> for good.</p>` : ''}
          <p class="note">These bonuses and penalties last only while they lead. Legacies stay. When they die, you choose again.</p>`;
      }
    } else if (key === 'season') {
      const se = G.season(run); title = se ? se.name : 'Season';
      body = se ? `<p>${esc(se.desc)}</p>${Object.keys(se.mods || {}).length ? xrow('While it lasts', G.describeMods(se.mods)) : ''}<p class="note">Seasons change every ${G.SEASON_LENGTH} turns.</p>` : '';
    } else if (key === 'biome') {
      const b = G.biome(run); title = b.name;
      body = `<p>${esc(b.rule || b.desc || '')}</p>${b.mods && Object.keys(b.mods).length ? xrow('While you live here', G.describeMods(b.mods)) : ''}${b.danger ? xrow('Hunters find you', `${Math.round(b.danger * 100)}% as often`) : ''}${(b.hazards || []).length ? xrow('Disasters', b.hazards.join(', ')) : ''}<p class="note">Open the World Map tab to compare biomes and migrate.</p>`;
    } else if (key === 'disposition') {
      const d = G.disposition(run); const l = G.leaning(run); title = `${G.LEAN_NAMES[d]}`;
      body = `<p>Your Disposition is the late-game twin of your diet: at the start your mouth decided what you could eat; now the leaning of everything your lineage has learned decides which futures are open.</p>
        <h4>Your leaning</h4>${['peace', 'guard', 'war'].map((k2) => xrow(`${G.LEAN_ICONS[k2]} ${G.LEAN_NAMES[k2]}`, String(l[k2]))).join('')}
        ${run.stage === 'society' ? `<h4>The Union</h4>${xrow('By force', d === 'peace' ? 'closed' : 'open')}${xrow('By trade', d === 'war' ? 'closed' : 'open')}${xrow('By faith', 'open')}` : ''}
        ${run.stage === 'colonial' ? `<h4>The Imperial Crown</h4>${xrow('One Crown', 'always open')}${xrow('A Commonwealth', d === 'war' ? 'closed' : 'open')}${xrow('An Empire of Iron', d === 'peace' ? 'closed' : 'open')}` : ''}
        ${run.stage === 'renaissance' ? `<h4>The Age of Sail</h4>${xrow('Discovery', 'always open')}${xrow('Trade', d === 'war' ? 'closed' : 'open')}${xrow('Conquest', d === 'peace' ? 'closed' : 'open')}` : ''}
        <p class="note">${run.disposition ? (run.stage === 'colonial' ? 'Fixed when the Imperial Crown was claimed.' : run.stage === 'renaissance' ? 'Fixed when your ships sailed.' : 'Fixed at the Union.') : run.stage === 'renaissance' ? `It was ${G.LEAN_NAMES[run.unionDisposition || d]} at the Union. In the new age it can shift again as you take up Reason ideas, until the Age of Sail fixes it.` : 'Territorial peoples keep every road open, like an omnivore. Your Disposition can still change as you adopt new ideas; it is fixed at the Union.'}</p>`;
    } else if (key === 'diet') {
      const d = G.diet(run); title = G.DIET_NAMES[d];
      const g = G.gimmick(run);
      body = `<p>${esc(G.DIET_NAMES[d])}s eat ${esc(G.edible(run).join(' and '))}. Your diet comes from your mouth: a plant-eating mouth makes you a Herbivore, a meat-eating one a Carnivore, and an omnivore mouth (or one of each, merged) an Omnivore.</p>
        <p>${g === 'grazer' ? 'As a Herd, you can never grow a meat-eating mouth.' : g === 'predator' ? 'As a Hunter, you can never grow a plant-only mouth.' : 'You can change diet at any time with a new mouth.'}</p>
        <p class="note">Only things your diet can use are offered to you.</p>`;
    } else if (key === 'gimmick') {
      title = G.ARCHETYPE[run.archetype].name; body = `<p>${esc(G.ARCHETYPE[run.archetype].ruleDesc || G.ARCHETYPE[run.archetype].rule || '')}</p>`;
    } else if (key === 'activity' && run.activity) {
      const a = G.ACTIVITY[run.activity.id]; title = a.name; body = `<p>${esc(G.sub ? G.sub(a.desc, run) : a.desc)}</p>${run.activity.target ? xrow('With', run.activity.target) : ''}${run.activity.turns ? xrow('Turns left', String(run.activity.turns)) : ''}`;
    } else if (key === 'insight') {
      const f = run.fascination && G.INNOVATION[run.fascination]; title = 'Insight';
      body = `<p>Insight builds toward the Mind tree idea your kind is fascinated by${f ? `: <b>${esc(G.innovationName(f, run))}</b> (${run.insight} of ${G.innovationCost(run, f)})` : '. Choose one in the Mind tab'}.</p>${xrow('Base', 1)}${Math.floor(G.stat(run, 'cun') / 5) ? xrow('Cunning', Math.floor(G.stat(run, 'cun') / 5)) : ''}${xsrc(run, 'insightPerTurn')}${xtotal('Each turn', G.insightPerTurn(run))}`;
    } else if (key === 'settlements') {
      title = `${G.socKind(run).settlement[0].toUpperCase()}${G.socKind(run).settlement.slice(1)}s`;
      body = `<p>You have ${run.settlements.length} of at most 8. Each one holds more people and earns Influence; found and build them from Activities.</p>${run.settlements.map((x) => xrow(x.name, `size ${x.size}`)).join('')}`;
    } else if (key === 'council') {
      title = 'Your council'; body = `<p>Councillors give their bonuses while their loyalty is above −30. Below −25 they may start plotting.</p>${(run.council || []).map((c) => xrow(`${G.COUNCIL_ROLES[c.role].name} ${c.name}`, c.loyalty)).join('')}`;
    }
    if (!title) return '';
    return `<div class="explain" role="dialog" aria-label="${esc(title)}"><div class="explain-head"><h3>${esc(title)}</h3><button class="btn ghost small icon" data-act="explain" data-arg="" aria-label="Close">${ICON.close}</button></div><div class="explain-body">${body}</div></div>`;
  }

  // Your Disposition (Update 19): the late-game parallel to your diet.
  function dispBadge(run, short) {
    const d = G.disposition(run);
    return `<b ${tappable('disposition')} class="diet-badge disp ${d}" title="${esc(G.LEAN_NAMES[d])}" aria-label="${esc(G.LEAN_NAMES[d])}">${G.LEAN_ICONS[d]}${short ? '' : ` ${esc(G.LEAN_NAMES[d])}`}</b>`;
  }
  // What your kind eats, impossible to miss.
  function dietBadge(run) {
    if (run.stage === 'cell' && !run.parts) return '';
    const d = G.diet(run);
    const icon = { herb: '🌿', carn: '🥩', omni: '🍽️' }[d] || '';
    return `<b ${tappable('diet')} class="diet-badge ${d}" title="${esc(`${G.DIET_NAMES[d]}: eats ${G.edible(run).join(' and ')}`)}">${icon} ${esc(G.DIET_NAMES[d])}</b>`;
  }
  // The Tribe stage at a glance: your special resource and your leader.
  function tribeChips(run) {
    if (!G.people(run)) return '';
    const k = G.kind(run);
    const sp = run.specialOn ? `<span ${tappable('special')} class="res gimmick ${(run.path === 'tool' || run.path === 'many') && (run.special || 0) < 3 ? 'warn' : run.path === 'garden' && (run.special || 0) >= 8 && run.turn >= (run.blightSafeUntil || 0) ? 'warn' : ''}" title="${esc(G.sub(G.KINDS[run.path].desc, run))}">${k.icon} ${esc(k.resource)} <b>${run.special || 0}</b><i class="${(run.special || 0) > G.SPECIAL_SOFT ? 'neg' : ''}">/${G.SPECIAL_SOFT}</i>${run.gear ? ` · Gear ${run.gear}` : ''}${run.mound ? ` · ${esc(k.camp[0].toUpperCase() + k.camp.slice(1))} ${run.mound}` : ''}</span>` : '';
    const age = run.leader ? Math.max(0, run.leader.life - (run.turn - run.leader.since)) : 0;
    const ld = `<span ${tappable('leader')} class="res gimmick ${run.leader && age <= 3 ? 'warn' : ''}" title="${run.leader ? esc(`Your leader. ${run.leader.traits.map((t) => `${G.LEADER_TRAITS[t].name}: ${G.describeMods(G.LEADER_TRAITS[t].mods)}`).join('. ')}.`) : 'No leader'}">👑 ${run.leader ? esc(run.leader.name) : 'None'}</span>`;
    const ldShow = !run.leader || age <= 3 ? ld : '';
    if (!G.civ(run)) return sp + ldShow;
    const sk = G.socKind(run);
    const restless = (run.council || []).filter((c) => c.loyalty < -10).length;
    const co = `<span ${tappable('council')} class="res gimmick ${run.plot != null || restless ? 'warn' : ''}" title="${esc(run.plot != null ? 'Someone on your council is plotting.' : restless ? 'Some of your council are restless.' : 'Your council is loyal.')}">⚖️ ${run.plot != null ? 'Plot!' : restless ? `${restless} restless` : 'Loyal'}</span>`;
    const cols = run.stage === 'colonial' ? run.colonies || [] : [];
    const hot = cols.some((c) => c.unrest >= 70);
    const colChip = cols.length ? `<span data-act="sheet" data-arg="society" role="button" tabindex="0" class="res gimmick ${hot ? 'warn' : ''}" title="${esc(hot ? 'A colony is close to rebellion.' : 'Your colonies across the sea.')}">⛵ ${cols.length}${hot ? ' restless' : ''}</span>` : '';
    return sp + ldShow + (run.plot != null || restless ? co : '') + colChip;
  }

  // The archetype's gimmick, at a glance.
  function gimmickChip(run) {
    const g = G.gimmick(run);
    let t = ''; let warn = false; let tip = G.ARCHETYPE[run.archetype].rule || '';
    if (g === 'predator') { const h = run.hunger || 0; t = `Hunger ${h}/${G.HUNGER_LIMIT}`; warn = h >= G.HUNGER_LIMIT - 1; tip = 'Turns since your last kill. At the limit you starve.'; }
    if (g === 'parasite') { const h = G.hostOf(run); t = h ? `Host: ${h.name} ${Math.round(h.pop * G.POP_SCALE)}` : 'No host'; warn = !h || h.pop < 6 || h.opinion <= -50; tip = 'Your Population can never outgrow your host.'; }
    if (g === 'symbiote') { const p = G.partnerOf(run); t = p ? `Partner: ${p.name} ${Math.round(p.pop * G.POP_SCALE)}` : 'No partner'; warn = !p || p.pop < p.cap * 0.3; }
    if (g === 'drifter') { const n = Math.max(0, (run.nextDrift || 0) - run.turn); const land = run.stage !== 'cell' && run.habitat === 'land'; t = `${land ? 'Wanderlust' : 'Current'}: ${n === 0 ? 'now' : `${n} turn${n === 1 ? '' : 's'}`}`; tip = land ? 'Turns until wanderlust carries you somewhere new.' : 'Turns until the current carries you somewhere new.'; }
    if (g === 'grazer') { t = `Herd DNA +${G.dnaPerTurn(run)}`; tip = 'Bigger herds earn more DNA.'; }
    if (g === 'colony') t = `Offshoots ${G.budsOf(run).length}/3`;
    if (g === 'mimic') { const m = G.mimicOf(run); t = m ? `Disguised: ${m.name}` : 'Undisguised'; }
    return t ? `<span ${tappable('gimmick')} class="res gimmick ${warn ? 'warn' : ''}" title="${esc(tip)}">${esc(t)}</span>` : '';
  }

  // Time controls live in the top bar, well away from event buttons.
  // Time: one play/pause button and one speed button (1×, 2×, 3×) that cycles.
  function speedControls(run) {
    const live = run.phase === 'map';
    const sp = G.ui.speed; const pace = sp || G.ui.lastSpeed || 1;
    return `<div class="speeds compact ${live ? '' : 'held'}" role="group" aria-label="Game speed">
      <button class="speed play ${sp ? '' : 'on'}" data-act="speed-toggle" aria-label="${sp ? 'Pause' : 'Play'}">${sp ? ICON.pause : ICON.play}</button>
      <button class="speed pace" data-act="speed-cycle" aria-label="Speed ${pace}×, tap to change">${pace}×</button>
    </div>`;
  }

  // The next thing DNA is working toward, for the progress bar.
  function nextGoal(run) {
    const st = G.goals(run);
    const goals = [];
    const tribe = run.stage === 'tribe'; const soc = run.stage === 'society'; const ren = run.stage === 'renaissance'; const col = run.stage === 'colonial';
    st.drafts.slice(run.draftsTaken).forEach((d) => goals.push({ at: d, label: col ? 'technology' : ren ? 'invention' : soc ? 'tradition' : tribe ? 'discovery' : 'mutation' }));
    st.milestones.map((m) => ({ at: m.at, id: m.event.replace('{path}', run.path) })).filter((m) => !run.milestonesDone.includes(m.id) && G.EVENT[m.id]).forEach((m) => goals.push({ at: m.at, label: G.EVENT[m.id].title }));
    if (st.evolveAt) goals.push({ at: st.evolveAt, label: col ? 'the Imperial Crown' : ren ? 'the Age of Sail' : soc ? 'the Union' : tribe ? 'the Founding' : 'the shore' });
    goals.sort((a, b) => a.at - b.at);
    return goals.find((g) => g.at > run.dna) || null;
  }

  // ---------- Game: main panel ----------
  function lines(list) {
    if (!list || !list.length) return '';
    return `<ul class="effects">${list.map((l) => `<li class="${l.bad ? 'bad' : l.good ? 'good' : ''}">${esc(l.t)}</li>`).join('')}</ul>`;
  }

  function chanceTag(stat, chance, foe) {
    // Blind Odds (a complication): only the stat being tested is shown.
    if (G.hasComp(G.run, 'blind')) return `<span class="chance">${statName(stat)} · ?</span>`;
    const cls = chance >= 70 ? 'good' : chance <= 35 ? 'bad' : '';
    if (!G.showNumbers()) return `<span class="chance ${cls}">${statName(stat)} · ${G.oddsWord(chance)}</span>`;
    return `<span class="chance ${cls}">${statName(stat)} · ${chance}%</span>${foe ? `<span class="vs">your ${foe.you} vs their ${foe.them}</span>` : ''}`;
  }

  // A mutation's icon, ringed in its keyword's color.
  function picon(id) {
    const p = G.PART[id]; if (!p) return '';
    const kw = (p.keywords || [])[0];
    return `<span class="picon" ${kw ? `style="--kw:${G.KEYWORDS[kw].color}"` : ''} aria-hidden="true">${G.partIcon(id)}</span>`;
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
          ${(() => { const shown = ev.options.map((o, i) => [o, i]).filter(([o]) => !G.optionState(run, o).hidden); return (shown.length ? shown : ev.options.map((o, i) => [o, i])); })().map(([o, i], _, all) => {
            const st = G.optionState(run, o);
            // "Certain" only matters next to a risky choice.
            const anyRisk = all.some(([x]) => x.check);
            return `
            <button class="option ${st.ok ? '' : 'locked'}" ${st.ok ? `data-act="option" data-arg="${i}"` : 'disabled'}>
              <span class="opt-label">${reqTag(o)}${esc(G.sub(o.label, run, sp))}</span>
              <span class="opt-meta">${st.ok ? `${o.check ? chanceTag(o.check.stat, st.chance, st.foe) : anyRisk ? '<span class="chance sure">Certain</span>' : ''}${o.hint ? `<span>${esc(G.sub(o.hint, run, sp))}</span>` : ''}` : `<span class="reason">${esc(st.reason)}</span>`}</span>
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
      <article class="card outcome ${G.buildUp(sc) ? 'suspense' : ''}" style="--reveal:${G.buildUp(sc)}s">
        <p class="eyebrow">${esc(sc.title)}</p>
        <h2>${esc(sc.label)} ${tag}</h2>
        ${sc.text ? `<p class="event-text">${esc(sc.text)}</p>` : ''}
        ${sc.stat ? `<p class="note reveal-late">${statName(sc.stat)} check: ${G.showNumbers() ? `${sc.chance}%` : G.oddsWord(sc.chance).toLowerCase()}.</p>` : ''}
        ${lines(sc.lines)}
        <button class="btn primary wide" data-act="continue-scene">${cta}</button>
      </article>`;
  }

  function mutatedCard(run) {
    return `
      <div class="scene-wrap"><canvas class="scene" aria-hidden="true"></canvas></div>
      <article class="card outcome">
        <p class="eyebrow">${run.scene.crown ? 'The Crown' : run.scene.reason ? 'Reason' : run.scene.tradition ? 'Tradition' : run.scene.discovery ? 'Discovery' : run.scene.evolved ? 'Evolution' : 'Mutation'}</p>
        ${run.scene.tradition ? `<div class="callout"><strong>${esc(G.TRADITION[run.scene.tradition].name)}</strong><span>${esc(G.describeMods(G.TRADITION[run.scene.tradition].mods))}. ${esc(G.TRADITION[run.scene.tradition].desc)}</span></div>` : ''}
        <h2>${esc(run.scene.label)}</h2>
        ${run.scene.crown ? `<div class="callout"><strong>${esc(G.loreName(G.CROWN_ID[run.scene.crown], run))}</strong><span>${esc(G.describeMods(G.CROWN_ID[run.scene.crown].mods))}. ${esc(G.CROWN_ID[run.scene.crown].desc)}</span></div>` : ''}
        ${run.scene.reason ? `<div class="callout"><strong>${esc(G.loreName(G.REASON_ID[run.scene.reason], run))}</strong><span>${esc(G.describeMods(G.REASON_ID[run.scene.reason].mods))}. ${esc(G.REASON_ID[run.scene.reason].desc)}</span></div>` : ''}
        ${run.scene.discovery ? `<div class="callout"><strong>${esc(G.DISCOVERY[run.scene.discovery].name)}</strong><span>${esc(G.describeMods(G.DISCOVERY[run.scene.discovery].mods))}. ${esc(G.DISCOVERY[run.scene.discovery].desc)}</span></div>` : ''}
        ${run.scene.evolved ? `<div class="callout"><strong>${picon(run.scene.evolved)}${esc(G.PART[run.scene.evolved].name)}</strong><span>${esc(G.describeMods(G.PART[run.scene.evolved].mods))}. ${esc(G.PART[run.scene.evolved].desc)}</span></div>` : ''}
        <button class="btn primary wide" data-act="continue-mutation">Continue</button>
      </article>`;
  }

  // Compare a new part with what a slot holds now: the slot's stats, and what each choice would change.
  const modsOf = (...ids) => {
    const out = {};
    ids.filter(Boolean).forEach((id) => Object.entries(G.PART[id].mods || {}).forEach(([k, v]) => { out[k] = (out[k] || 0) + v; }));
    return out;
  };
  function modDiff(after, before) {
    const keys = new Set([...Object.keys(after), ...Object.keys(before)]);
    const bits = [];
    keys.forEach((k) => {
      const v = (after[k] || 0) - (before[k] || 0);
      if (!v) return;
      const good = k === 'damageReduce' || k === 'growthCost' || k === 'upkeep' ? (k === 'damageReduce' ? v > 0 : v < 0) : v > 0;
      const text = k === 'damageReduce' ? `${v > 0 ? '−' : '+'}${Math.abs(v)} damage taken` : G.describeMods({ [k]: v });
      bits.push(`<span class="${good ? 'up' : 'down'}">${esc(text)}</span>`);
    });
    return `<span>${bits.length ? bits.join(', ') : '<span class="muted">no stat change</span>'}</span>`;
  }
  function compareBox(run, pid, socks) {
    const rows = socks.map((key) => {
      const sl = run.parts[key];
      const where = socks.length > 1 ? `${key.endsWith('2') ? '2nd' : '1st'} socket` : 'Now';
      if (!sl) return `<div class="cmp-now"><b>${where}</b> <span class="muted">empty</span></div><div class="cmp-row"><span>Grow it</span>${modDiff(modsOf(pid), {})}</div>`;
      const now = modsOf(sl.id, sl.merged);
      // A new mouth can change what you eat.
      const dietOf = (a, b) => { const da = a && G.PART[a].diet; const db = b && G.PART[b].diet; return da && db && da !== db ? 'omni' : da || db || 'omni'; };
      const dietNote = (a, b) => (key === 'mouth' && dietOf(a, b) !== dietOf(sl.id, sl.merged) ? ` <span class="diet">→ ${G.DIET_NAMES[dietOf(a, b)]}</span>` : '');
      const halves = sl.merged ? ` <span class="muted">(${esc(G.PART[sl.id].name)} + ${esc(G.PART[sl.merged].name)})</span>` : '';
      const result = (a, b) => {
        const evo = G.evolutionOf(a, b);
        if (evo && !G.evolutionKnown(evo)) return '<span class="up">evolves into something new</span>';
        if (evo) return `<span><span class="up">evolves into ${esc(G.PART[evo].name)}:</span> ${modDiff(modsOf(evo), now)}${dietNote(evo)}</span>`;
        return `<span>${modDiff(modsOf(a, b), now)}${dietNote(a, b)}</span>`;
      };
      const out = [`<div class="cmp-now"><b>${where}</b> ${esc(G.slotLabel(sl))}${halves}: ${esc(G.describeMods(now) || 'no stats')}</div>`];
      if (sl.merged) {
        out.push(`<div class="cmp-row"><span>Swap out ${esc(G.PART[sl.id].name)}</span>${result(sl.merged, pid)}</div>`);
        out.push(`<div class="cmp-row"><span>Swap out ${esc(G.PART[sl.merged].name)}</span>${result(sl.id, pid)}</div>`);
      } else if (G.canMerge(run)) out.push(`<div class="cmp-row"><span>Merge</span>${result(sl.id, pid)}</div>`);
      // A merged part can only have one half swapped out, so there is no "replace" for it.
      if (!sl.merged) out.push(`<div class="cmp-row"><span>Replace it</span><span>${modDiff(modsOf(pid), now)}${dietNote(pid)}</span></div>`);
      return out.join('');
    });
    return `<div class="part-compare">${rows.join('')}</div>`;
  }

  // ---------- Tribe stage ----------
  // A discovery's tags: which talent or Path it comes from.
  function discoveryTags(d) {
    return `${d.talent ? `<span class="kw">${esc(G.TALENT_NAMES[d.talent])}</span>` : ''}${d.path ? `<span class="kw">${esc(G.PATH[d.path].name)}</span>` : ''}${d.from ? '<span class="kw unlocked">Combined</span>' : ''}`;
  }
  // A new branch for the Lore tree (Update 18): choose one of three to graft on; learn it now if you can pay.
  function discoveryCard(run) {
    const d = run.draft;
    const k = G.kind(run); const have = run.special || 0;
    const inTree = (id) => G.DISCOVERY[id] && G.loreVisible(run, G.DISCOVERY[id]);
    return `
      <article class="card draft">
        <p class="eyebrow">The Lore tree</p>
        <h2>A new branch</h2>
        <p class="note">Your people's Ideas open a new branch of Lore. Choose one to add to your tree: learn it now for ${esc(k.resource)} (you have <b>${have}</b>), or keep it in the tree and learn it later from the Lore tab. Branches that pair with ones already in your tree open combinations.</p>
        <div class="draft-list">
          ${d.options.map((id) => {
            const x = G.DISCOVERY[id];
            const combos = G.DISCOVERIES.filter((c) => c.from && c.from.includes(id) && inTree(c.from.find((f) => f !== id)));
            const cost = G.discoveryCost(run, id);
            return `
            <div class="part-card ${cost > have ? 'cant' : ''}">
              <span class="opt-label">${esc(x.name)}${discoveryTags(x)}${x.lean ? `<span class="kw">${G.LEAN_ICONS[x.lean]}</span>` : ''}<span class="cost ${cost > have ? 'bad' : ''}">${k.icon} ${cost}</span></span>
              <span class="opt-meta"><span>${esc(G.describeMods(x.mods))}</span></span>
              <span class="opt-desc">${esc(x.desc)}</span>
              ${combos.length ? `<span class="opt-desc good-text">Opens: ${esc(combos.map((c) => `${c.name} (with ${G.DISCOVERY[c.from.find((f) => f !== id)].name})`).join(', '))}</span>` : ''}
              <div class="row tight">
                <button class="btn small primary" ${cost <= have ? `data-act="draft" data-arg="${id}" data-mode="learn"` : 'disabled'}>Add and learn it (${k.icon} ${cost})</button>
                <button class="btn small" data-act="hold-discovery" data-arg="${id}">Add to the tree</button>
              </div>
            </div>`;
          }).join('')}
        </div>
        <div class="row">
          ${d.rerolls > 0 ? `<button class="btn" data-act="reroll">Reroll (${d.rerolls})</button>` : ''}
          <button class="btn ghost" data-act="skip-draft">Skip for +3 Food</button>
        </div>
      </article>`;
  }
  function peopleTab(run) {
    const k = G.kind(run); const tm = G.temperament(run); const tt = G.TRIBE_TEMPER[tm.id];
    const l = run.leader;
    const talents = [...G.talents(run)];
    const tamed = run.species.filter((s) => s.tamed && !s.extinct);
    const band = run.species.find((s) => s.band && !s.extinct);
    return `
      <div class="callout"><strong>${k.icon} The ${esc(k.name)}</strong><span>${esc(G.sub(G.KINDS[run.path].desc, run))}</span></div>
      <h3>${esc(G.ruler(run))}</h3>
      ${l ? leaderCard(run, l, 'years') : '<p class="empty">No leader. One will be chosen soon.</p>'}
      ${lineOfLeaders(run)}
      <h3>${esc(k.resource)}</h3>
      <p class="note">${run.specialOn ? `${run.special || 0} (comfortable up to ${G.SPECIAL_SOFT}, never more than ${G.SPECIAL_HARD}). +${Math.max(0, 2 + G.mod(run, 'specialPerTurn'))} a turn, and your people use ${G.specialUpkeep(run)} (1 for every 200 of them). Discoveries, gear and other works all cost it. Past ${G.SPECIAL_SOFT}, gains are halved and a tenth of the excess is lost each turn.` : `Not yet. Your people will find it soon.`}${run.path === 'tool' ? ` ${G.firelit(run) ? 'Lit: it cancels cold seasons and keeps hunters away (−25% attacks).' : 'At 3 or more, it cancels cold seasons and keeps hunters away.'}${run.gear ? ` Gear level ${run.gear}.` : ''}` : run.path === 'song' ? ` Every 6 Song gives +1 Charm (up to 3), every 10 gives +1 Idea a turn, and at 6 or more bands sour on you half as fast.${run.songSafe ? ' The songs are learned by heart: the next great loss costs no verse.' : ''}` : ''}</p>
      ${kindPanel(run)}
      <h3>Your temperament: ${esc(tm.name)}</h3>
      <p class="note">${tt ? `${esc(tt.rule)} (${esc(G.describeMods(tt.mods))})` : ''}</p>
      <h3>Talents</h3>
      <p class="note">What your body lets your people do. Talents bring their own discoveries.</p>
      <div class="chips">${talents.length ? talents.map((t) => `<span class="chip on">${esc(G.TALENT_NAMES[t])}</span>`).join('') : '<span class="note">None yet: your body is plain. Shared discoveries still come.</span>'}</div>
      <h3>Wildlife</h3>
      <p class="note">${run.totem ? `Totem: the ${esc(run.totem)}. ` : 'No totem yet (Activities: Revere). '}${tamed.length ? `Tamed: ${esc(listJoin(tamed.map((s) => `the ${s.name}`)))}.` : 'Nothing tamed yet (Activities: Tame).'}</p>
      ${band ? `<h3>Strangers</h3><p class="note">The ${esc(band.name)}: opinion ${band.opinion}${band.nemesis ? ', and they remember the old feud' : ''}.</p>` : ''}`;
  }
  // A leader: background, traits, ambition and how close it is.
  function leaderCard(run, l, unit) {
    const bg = l.bg && G.LEADER_BACKGROUND[l.bg]; const amb = l.amb && G.AMBITIONS[l.amb]; const pr = G.ambitionProgress(run, l);
    const kind = G.kind(run); const sub = (x) => x.replace(/\{resource\}/g, kind ? kind.resource : 'resource');
    return `<div class="callout"><strong>👑 ${esc(G.leaderTitle(l))}</strong><span>${bg ? `${esc(sub(bg.text[0].toUpperCase() + bg.text.slice(1)))} (${esc(G.describeMods(bg.mods))}). ` : ''}${esc(l.traits.map((t) => `${G.LEADER_TRAITS[t].name}: ${G.describeMods(G.LEADER_TRAITS[t].mods)}`).join(' · '))}. ${l.heir ? 'Next in line for the throne.' : `Leading for ${run.turn - l.since} ${unit}; old age comes in about ${Math.max(0, l.life - (run.turn - l.since))}.`}</span>
      ${amb ? `<span><b>${esc(amb.name)}:</b> wants to ${esc(sub(amb.want))}. ${l.done ? '✅ Achieved: their legacy is yours for good.' : pr ? `Progress: ${Math.min(pr.now, pr.goal)} of ${pr.goal}.` : ''} Legacy: ${esc(G.describeMods(amb.legacy))}.</span>` : ''}</div>`;
  }
  function lineOfLeaders(run) {
    const leg = run.legacies || []; const past = run.rulers || [];
    if (!leg.length && !past.length) return '';
    return `${leg.length ? `<p class="note"><b>Legacies:</b> ${esc(leg.map((x) => `${x.name} the ${G.AMBITIONS[x.amb].name} (${G.describeMods(G.AMBITIONS[x.amb].legacy)})`).join(' · '))}</p>` : ''}
      ${past.length ? `<details class="rulers"><summary>The line of leaders (${past.length})</summary><ol>${past.slice().reverse().map((x) => `<li>${esc(x.title)}: ${x.years} ${G.civ(run) ? 'generations' : 'years'}, ${esc(x.how)}${x.done ? ` · ${esc(G.AMBITIONS[x.amb].name)} ✅` : ''}</li>`).join('')}</ol></details>` : ''}`;
  }
  // What only your kind has: castes and the great home, Blight, Light.
  function kindPanel(run) {
    if (run.path === 'swarm') {
      const ready = run.turn >= (run.casteReadyAt || 0);
      return `<h3>Castes</h3><p class="note">Your ${esc(G.ruler(run).toLowerCase())} decides what the next broods become.${ready ? '' : ` You can change again in ${run.casteReadyAt - run.turn} turns.`}</p>
        <div class="chips">${Object.entries(G.CASTES).map(([id, c]) => `<button class="chip ${run.caste === id ? 'on' : ''}" ${ready && run.caste !== id ? `data-act="caste" data-arg="${id}"` : 'disabled'} aria-pressed="${run.caste === id}" title="${esc(G.describeMods(c.mods))}">${esc(c.name)}</button>`).join('')}</div>
        <p class="note">${esc(G.CASTES[run.caste || 'workers'].name)}: ${esc(G.describeMods(G.CASTES[run.caste || 'workers'].mods))}. Your ${esc(G.kind(run).camp)} is level ${run.mound || 0} of 6. At 8 Brood or more, a new member hatches (for 6 Brood).</p>`;
    }
    if (run.path === 'garden') {
      const safe = Math.max(0, (run.blightSafeUntil || 0) - run.turn);
      return `<h3>The gardens</h3><p class="note">+${Math.min(4, Math.floor((run.special || 0) / 4))} Food a turn from Growth, and tamed species feed you twice as well. ${safe ? `Safe from Blight for ${safe} more turns.` : (run.special || 0) >= 8 ? 'At 8 Growth or more, Blight can strike. Tend the gardens to keep it away.' : 'Below 8 Growth, Blight cannot strike.'}</p>`;
    }
    if (run.path === 'many') return `<h3>Few, but brilliant</h3><p class="note">Your den is smaller than other peoples (half the members), but every one of you gets +2 Cunning. ${G.lightHidden(run) ? 'Your Light hides you: attacks are 25% rarer.' : 'At 3 Light or more, you hide: attacks are 25% rarer.'} Migrating costs nothing.</p>`;
    return '';
  }
  // ---------- The Book of the Lineage (Update 17) ----------
  // One page per stage: Origin (the cell), then a tree page for every stage after it. Finished pages
  // are frozen as they stood when their stage ended; the current one is live.
  const BOOK_PAGES = [
    { id: 'origin', name: 'Origin', stage: 'Cell' },
    { id: 'mind', name: 'Mind', stage: 'Creature' },
    { id: 'lore', name: 'Lore', stage: 'Tribe' },
    { id: 'law', name: 'Law', stage: 'Society' },
    { id: 'reason', name: 'Reason', stage: 'Renaissance' },
    { id: 'crown', name: 'Crown', stage: 'Colonial Age' },
    { id: 'legacy', name: 'Legacy', stage: 'the end', later: 'Update 22' },
  ];
  const STAGE_ORDER = ['cell', 'creature', 'tribe', 'society', 'renaissance', 'colonial'];
  const PAGE_STAGE = { origin: 'cell', mind: 'creature', lore: 'tribe', law: 'society', reason: 'renaissance', crown: 'colonial' };
  function bookTab(run) {
    const at = STAGE_ORDER.indexOf(run.stage);
    const reached = (pg) => PAGE_STAGE[pg.id] && STAGE_ORDER.indexOf(PAGE_STAGE[pg.id]) <= at;
    const open = BOOK_PAGES.filter(reached);
    const cur = open.find((pg) => pg.id === G.ui.bookPage) || open[open.length - 1];
    const nav = `<div class="book-nav" role="tablist">${BOOK_PAGES.map((pg) => {
      const ok = reached(pg);
      return `<button role="tab" class="book-tab ${pg.id === cur.id ? 'on' : ''} ${ok ? '' : 'future'}" ${ok ? `data-act="book-page" data-arg="${pg.id}"` : 'disabled'} title="${esc(`${pg.stage}${pg.later ? ` (coming in ${pg.later})` : ok ? '' : ' (not reached yet)'}`)}"><b>${esc(pg.name)}</b><small>${esc(pg.stage)}</small></button>`;
    }).join('')}</div>`;
    return `<p class="note">The Book of your lineage: one page for every stage you have lived through. Each tree page is grown from that stage's choices and kept as it stood when the stage ended.</p>${nav}<div class="book-page">${bookPage(run, cur.id)}</div>`;
  }
  function bookPage(run, id) {
    const b = run.book || {};
    if (id === 'origin') {
      const o = b.origin;
      if (!o) return '<h3>Origin</h3><p class="note">This lineage began before the Book was kept, so the story of its cell was not written down.</p>';
      return `<h3>Origin: the cell</h3>
        <div class="book-origin-row"><canvas class="book-origin" aria-hidden="true"></canvas>
        <p>A ${esc(G.ORIGIN[o.origin] ? G.ORIGIN[o.origin].name : '')} cell, ${esc((G.TEMPERAMENTS[o.archetype] || {}).name || '')} by temperament. For ${o.epochs} epochs it fed as a ${esc(G.DIET_NAMES[o.diet].toLowerCase())}${o.multicellular ? ', then learned to live as many' : ''}, and left the primordial sea for the ${o.habitat === 'sea' ? 'open sea' : 'land'}.</p></div>
        <h4>What it carried out of the sea</h4><p>${esc(o.parts.join(', ') || 'Nothing but itself')}</p>`;
    }
    if (id === 'mind') {
      const live = run.stage === 'creature';
      const page = live ? null : b.mind || { seen: (run.innovations || []).slice(), known: (run.innovations || []).slice(), leaning: G.leaning(run) };
      if (live && !run.mind) return `<h3>Mind</h3><p class="note">Your kind has not woken yet. When it does, its Mind tree will grow from your temperament, your home, your body and what has happened to you${(run.memories || []).length ? `. Already remembered: ${esc(run.memories.map((m) => G.MEMORIES[m]).join(' '))}` : ''}.</p>`;
      const known = page ? page.known.length : run.innovations.length; const seen = page ? page.seen.length : G.INNOVATIONS.filter((inv) => G.innovationVisible(run, inv)).length;
      return `<h3>Mind ${live ? '(growing)' : ''}</h3><p class="note">${known} of the ${seen} ideas your lineage could see${live ? ' so far' : ''}. ${live ? 'Research it from the Mind tab.' : 'Frozen as it stood at your Awakening.'}</p>${mindTree(run, page || { seen: G.INNOVATIONS.filter((inv) => G.innovationVisible(run, inv)).map((x) => x.id), known: run.innovations, leaning: G.leaning(run) })}`;
    }
    if (id === 'lore') {
      const live = run.stage === 'tribe';
      const lo = live ? null : (b.lore && b.lore.seen ? b.lore : { seen: (b.lore && b.lore.discoveries) || run.discoveries || [], known: (b.lore && b.lore.discoveries) || run.discoveries || [], leaning: G.leaning(run) });
      const rulers = live ? run.rulers || [] : (b.lore && b.lore.rulers) || [];
      return `<h3>Lore ${live ? '(growing)' : ''}</h3><p class="note">${live ? 'Learn it from the Lore tab.' : 'Frozen as it stood at your Founding.'}</p>${loreTree(run, lo)}
        ${rulers.length ? `<h4>The line of leaders</h4><p>${esc(rulers.map((x) => x.title || x.name).join(' → '))}</p>` : ''}`;
    }
    if (id === 'law') {
      const done = (run.traditions || []).includes('union_gate');
      return `<h3>Law ${done ? '' : '(growing)'}</h3><p class="note">${done ? 'Frozen as it stood at your Union.' : 'Adopt it from the Law tab.'}${run.faith ? ` Faith: ${esc(run.faith.name)}.` : ''} Disposition: ${G.LEAN_ICONS[G.disposition(run)]} ${esc(G.LEAN_NAMES[G.disposition(run)])}.</p>${lawTree(run, done && b.law ? b.law : null)}`;
    }
    if (id === 'crown') {
      const done = (run.crown || []).includes('crown_gate');
      const rulers = (b.crown && b.crown.rulers) || (run.rulers || []).slice(-8);
      return `<h3>Crown ${done ? '' : '(growing)'}</h3><p class="note">${done ? 'Frozen as it stood when the Imperial Crown was claimed.' : 'Take it up from the Crown tab.'} Disposition: ${G.LEAN_ICONS[G.disposition(run)]} ${esc(G.LEAN_NAMES[G.disposition(run)])}.</p>${crownTree(run, done && b.crown ? b.crown : null)}
        ${rulers.length ? `<h4>The dynasty</h4><p>${esc(rulers.map((x) => x.title || x.name).join(' → '))}</p>` : ''}`;
    }
    if (id === 'reason') {
      const done = (run.reason || []).includes('sail_gate');
      return `<h3>Reason ${done ? '' : '(growing)'}</h3><p class="note">${done ? 'Frozen as it stood when your ships sailed.' : 'Take it up from the Reason tab.'}${run.schism ? ` The Schism: ${esc(SCHISM_NAMES[run.schism])}.` : ''} Disposition: ${G.LEAN_ICONS[G.disposition(run)]} ${esc(G.LEAN_NAMES[G.disposition(run)])}.</p>${reasonTree(run, done && b.reason ? b.reason : null)}`;
    }
    return '';
  }

  // ---------- The Lore tree (Update 18) ----------
  const LORE_BANDS = [['trunk', 'Your people'], ['graft', 'Branches'], ['combo', 'Combined'], ['way', 'Leader'], ['legacy', 'Legacies'], ['deed', 'Deeds'], ['gate', 'Founding'], ['beyond', 'Beyond']];
  // Lay out tree nodes in bands of up to 4 per line; returns positions (x in %, y in px) and the height.
  function treeLayout(visible, bands, bandOf) {
    const PER = 4; const LINE = 74; const GAP = 16;
    const pos = {}; const labels = []; let y = 34;
    bands.forEach(([band, label]) => {
      const list = visible.filter((n) => bandOf(n) === band);
      if (!list.length) return;
      labels.push({ y, label });
      for (let i = 0; i < list.length; i += PER) {
        const row = list.slice(i, i + PER);
        row.forEach((n, j) => { pos[n.id] = { x: 14 + ((j + 0.5) / row.length) * 80, y }; });
        y += LINE;
      }
      y += GAP;
    });
    return { pos, labels, H: y };
  }
  function loreTree(run, page) {
    const known = (id) => (page ? page.known : run.discoveries || []).includes(id);
    const visible = page ? page.seen.map((id) => G.DISCOVERY[id]).filter(Boolean) : G.DISCOVERIES.filter((d) => G.loreVisible(run, d));
    const have = run.special || 0; const k = G.kind(run) || { icon: '', resource: '' };
    const live = !page && run.stage === 'tribe';
    const state = (d) => {
      if (known(d.id)) return 'done';
      if (!live) return 'locked';
      const av = G.loreAvailable(run, d);
      return av.ok ? (G.discoveryCost(run, d.id) <= have ? 'open' : 'cant') : 'locked';
    };
    const sel = (G.ui.loreSel && visible.find((d) => d.id === G.ui.loreSel)) || (live && visible.find((d) => state(d) === 'open')) || visible.find((d) => d.lore === 'gate') || visible[0];
    const { pos, labels, H } = treeLayout(visible, LORE_BANDS, (d) => d.lore);
    const edges = [];
    const edge = (pid, d) => {
      const a = pos[pid]; const b = pos[d.id]; if (!a || !b) return;
      const cls = known(pid) && known(d.id) ? 'done' : known(pid) ? 'lit' : 'dim';
      const ay = (a.y + 26) / H * 100; const by = (b.y - 26) / H * 100;
      edges.push(`<path class="edge ${cls}" d="M${a.x} ${ay} C ${a.x} ${ay + 5}, ${b.x} ${by - 5}, ${b.x} ${by}" vector-effect="non-scaling-stroke"/>`);
    };
    visible.forEach((d) => { (d.from || []).concat((d.req || {}).some || []).forEach((pid) => edge(pid, d)); });
    const icon = { done: '✓', open: '', cant: k.icon, locked: '🔒' };
    const lean = page ? page.leaning : G.leaning(run);
    return `
      <div class="mind-head">${leaningBar(lean)}</div>
      <div class="skill-tree mind-tree lore-tree" style="height:${H}px">
        <svg class="edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${edges.join('')}</svg>
        ${labels.map((l) => `<span class="tier-label" style="top:${l.y - 30}px">${l.label}</span>`).join('')}
        ${visible.map((d) => {
          const st = state(d); const name = G.loreName(d, run);
          return `<button class="node ${st === 'cant' ? 'open cant' : st} ${sel && sel.id === d.id ? 'sel' : ''} ${d.lore === 'gate' ? 'apex' : ''} ${d.lore === 'beyond' ? 'beyond' : ''} ${d.lean ? `lean-${d.lean}` : ''}" style="left:${pos[d.id].x}%;top:${pos[d.id].y}px" data-act="lore-sel" data-arg="${d.id}" aria-pressed="${sel && sel.id === d.id}" aria-label="${esc(name)}">${nodeName(name)}${icon[st] ? `<i aria-hidden="true">${icon[st]}</i>` : ''}${d.rule ? '<b class="rule-dot" aria-hidden="true">★</b>' : ''}</button>`;
        }).join('')}
      </div>
      ${sel ? loreDetail(run, sel, state(sel), live) : ''}`;
  }
  function loreDetail(run, d, st, live) {
    const k = G.kind(run) || { icon: '', resource: '' }; const cost = G.discoveryCost(run, d.id) || G.DISCOVERY_BASE[G.discoveryTier(d)];
    const av = live ? G.loreAvailable(run, d) : { ok: false };
    const where = { trunk: `Your people: ${G.PATH[run.path] ? G.PATH[run.path].name : ''}`, graft: 'A branch your people chose', combo: `Combined: ${(d.from || []).map((f) => G.DISCOVERY[f].name).join(' + ')}`, way: 'A Way, open while this leader leads (kept once learned)', legacy: 'A Legacy: grafted by a fulfilled ambition', deed: `A Deed: ${d.when ? G.DEEDS[d.when.deed] : ''}`, gate: `The Founding: ends the Tribe stage. Needs ${G.goals(run).evolveAt || 120} Ideas and ${G.foundingNeed()} Lore ideas known`, beyond: 'Beyond the Founding: learn before it; an Inheritance in the Society stage' }[d.lore];
    let action = '';
    if (st === 'done') action = '<span class="note good-text">Known</span>';
    else if (live && av.ok) action = `<button class="btn primary small" ${cost <= (run.special || 0) ? `data-act="learn-lore" data-arg="${d.id}"` : 'disabled'}>Learn it (${k.icon} ${cost})</button>${cost > (run.special || 0) ? `<span class="reason">Needs ${cost} ${esc(k.resource)} (you have ${run.special || 0})</span>` : ''}`;
    return `
      <div class="inv-detail">
        <div class="inv-head"><strong>${esc(G.loreName(d, run))}</strong><span>${k.icon} ${cost}</span></div>
        <span class="inv-where">${esc(where)}${d.lean ? ` · ${G.LEAN_ICONS[d.lean]} ${esc(G.LEAN_NAMES[d.lean])}` : ''}</span>
        <span class="inv-mods">${esc(G.describeMods(d.mods))}</span>
        ${d.rule ? `<span class="inv-rule">★ ${esc(G.MIND_RULES[d.rule])}</span>` : ''}
        ${d.inherit ? `<span class="inv-rule">Inheritance in the Society stage: ${esc(G.describeMods(d.inherit))}</span>` : ''}
        <span class="inv-desc">${esc(d.desc)}</span>
        ${live && !av.ok && st !== 'done' ? `<span class="reason">${esc(av.reason)}</span>` : ''}
        <div class="row tight">${action}</div>
      </div>`;
  }
  function discoveriesTab(run) {
    const seen = G.meta.codex.discoveries || [];
    const k = G.kind(run); const parts = G.discoveryCostParts(run); const pct = G.discoveryCostPct(run);
    const live = run.stage === 'tribe';
    const page = live ? null : (run.book && run.book.lore && run.book.lore.seen ? run.book.lore : { seen: run.discoveries || [], known: run.discoveries || [], leaning: G.leaning(run) });
    return `${live ? `<p class="note">Your Lore tree: ${G.loreKnown(run)} ideas known. It grows from your people's own discoveries, the branches you choose as Ideas come in, your leaders, their legacies and your deeds. Learning an idea costs ${esc(k.resource)} (you have <b>${run.special || 0}</b>), changed by ${pct > 0 ? '+' : pct < 0 ? '−' : ''}${Math.abs(pct)}% right now${parts.length ? ` (${esc(parts.map(([w, v]) => `${w}: ${v > 0 ? '+' : '−'}${Math.abs(v)}%`).join(', '))})` : ''}.</p>
      <p class="note"><b>The Founding</b> needs ${G.goals(run).evolveAt} Ideas (you have ${run.dna}) and ${G.foundingNeed()} Lore ideas (you have ${G.loreKnown(run)}). Ideas Beyond the Founding must be learned before it.</p>` : '<p class="note">Your Lore tree, as it stood at the Founding. Its ideas still work for your people.</p>'}
      ${loreTree(run, page)}
      <h3>Combinations found (all lineages)</h3>
      <p class="note">${esc(listJoin(G.DISCOVERIES.filter((x) => x.from && seen.includes(x.id)).map((x) => `${x.name} (${G.DISCOVERY[x.from[0]].name} + ${G.DISCOVERY[x.from[1]].name})`)) || 'None yet.')}</p>`;
  }


  // ---------- Society stage ----------
  // A new branch for the Law tree (Update 19): choose one of three to graft on; adopt it now if you can pay.
  function traditionCard(run) {
    const d = run.draft; const k = G.kind(run); const have = run.special || 0;
    return `
      <article class="card draft">
        <p class="eyebrow">The Law tree</p>
        <h2>A new branch of Law</h2>
        <p class="note">Your people's Influence opens a new branch of Law. Choose one to add to your tree: adopt it now for ${esc(k.resource)} (you have <b>${have}</b>), or keep it in the tree and adopt it later from the Law tab. Some laws come in opposed pairs: adopting one rules out the other.</p>
        <div class="draft-list">
          ${d.options.map((id) => { const t = G.TRADITION[id]; const cost = G.lawCost(run, id); return `
            <div class="part-card ${cost > have ? 'cant' : ''}">
              <span class="opt-label">${esc(t.name)}${traditionTags(t)}${t.lean ? `<span class="kw">${G.LEAN_ICONS[t.lean]}</span>` : ''}<span class="cost ${cost > have ? 'bad' : ''}">${k.icon} ${cost}</span></span>
              <span class="opt-meta"><span>${esc(G.describeMods(t.mods))}</span></span>
              <span class="opt-desc">${esc(t.desc)}${t.excl ? ` <i>Rules out ${esc(G.TRADITION[t.excl].name)}.</i>` : ''}</span>
              <div class="row tight">
                <button class="btn small primary" ${cost <= have ? `data-act="draft" data-arg="${id}" data-mode="learn"` : 'disabled'}>Add and adopt it (${k.icon} ${cost})</button>
                <button class="btn small" data-act="hold-discovery" data-arg="${id}">Add to the tree</button>
              </div>
            </div>`; }).join('')}
        </div>
        <div class="row">
          ${d.rerolls > 0 ? `<button class="btn" data-act="reroll">Reroll (${d.rerolls})</button>` : ''}
          <button class="btn ghost" data-act="skip-draft">Skip for +3 Food</button>
        </div>
      </article>`;
  }
  function traditionTags(t) {
    return `<span class="kw">${'I'.repeat(t.tier)}</span>${t.path ? `<span class="kw">${esc(G.PATH[t.path].name)}</span>` : ''}${t.society ? `<span class="kw">${esc(G.SOCIETY_TYPES[t.society].name)}</span>` : ''}`;
  }
  function loyaltyBar(v) {
    const pct = (v + 100) / 2;
    return `<span class="loyalty ${v < -25 ? 'bad' : v < 0 ? 'warn' : 'good'}" title="Loyalty ${v}"><span style="width:${pct}%"></span></span>`;
  }
  function societyTab(run) {
    const sk = G.socKind(run); const st = G.SOCIETY_TYPES[run.socType]; const k = G.kind(run);
    const l = run.leader;
    const nb = run.species.filter((x) => x.band && !x.extinct);
    return `
      <div class="callout"><strong>🏛️ The ${esc(sk.name)}: ${esc(st.name)}</strong><span>${esc(st.rule)} (${esc(G.describeMods(st.mods))})</span></div>
      <h3>${esc(G.ruler(run))}</h3>
      ${l ? leaderCard(run, l, 'generations') : '<p class="empty">No ruler. The council will choose one soon.</p>'}
      ${lineOfLeaders(run)}
      ${colonialSection(run)}
      <h3>${esc(sk.settlement[0].toUpperCase() + sk.settlement.slice(1))}s (${run.settlements.length} of 8)</h3>
      <p class="note">Each size lets your people grow bigger. Every 6 sizes in all earn +1 Influence a turn. Found new ones and build them up from Activities.</p>
      <div class="settlements">${run.settlements.map((x, i) => `<div class="settlement"><b>${i === 0 ? '⭐ ' : ''}${esc(x.name)}</b><span>${'■'.repeat(x.size)}${'□'.repeat(4 - x.size)}</span></div>`).join('')}</div>
      <h3>📜 ${esc(G.mythName(run))}</h3>
      <p class="note">The story your people tell about where they came from: +1 Charm.</p>
      ${run.faith ? `<h3>🕯️ ${esc(run.faith.name)}</h3><p class="note">${esc(G.FAITH_KINDS[run.faith.kind].desc)} Its ideas are in the Faith band of your Law tree.</p>` : ''}
      ${run.stage === 'renaissance' && run.schism ? `<h3>⛪ The Schism</h3><p class="note">${esc(SCHISM_NAMES[run.schism][0].toUpperCase() + SCHISM_NAMES[run.schism].slice(1))}. Its idea is in the Schism band of your Reason tree.</p>` : ''}
      <h3>${G.LEAN_ICONS[G.disposition(run)]} ${esc(G.LEAN_NAMES[G.disposition(run)])}</h3><p class="note">${run.disposition ? 'Your Disposition is fixed.' : `Your Disposition, from the leaning of every idea your lineage has learned. It decides ${run.stage === 'renaissance' ? 'what your ships can do in the Age of Sail' : 'how you can unite the region'}, and it can still change.`}</p>
      <h3>${esc(k.resource)}</h3>
      <p class="note">${run.specialOn ? `${run.special || 0} of ${G.SPECIAL_CAP}, +${Math.max(0, G.specialGain(run) + G.scholarGain(run) - G.specialUpkeep(run))} a turn. Building up a ${esc(sk.settlement)} uses 4 of it (or 6 Food).` : 'None.'}</p>
      <h3>Neighbours</h3>
      ${nb.length ? nb.map((b) => `<div class="callout"><strong>${b.nation && b.nationDisp ? `${G.LEAN_ICONS[b.nationDisp]} ` : ''}The ${esc(b.name)}${b.league ? ' · 🤝 league' : ''}${b.treaty ? ' · 📜 treaty' : ''}${b.married ? ' · 💍 marriage' : ''}</strong><span>Opinion ${b.opinion} · ${b.opinion >= 60 ? 'allies: they share food with you' : b.opinion >= 10 ? 'friendly: you can trade' : !b.treaty && b.opinion < (b.nation ? { war: 20, peace: -30 }[b.nationDisp] ?? G.SOC_RAID_BELOW : G.SOC_RAID_BELOW) ? 'hostile: they may raid you' : 'wary'}${b.nemesis ? ' · they remember the old feud' : ''}</span>${b.nation && b.nationDisp ? `<span>${esc(G.LEAN_NAMES[b.nationDisp])} nation, ${esc(NATION_DISP[b.nationDisp].split(': ')[1])}${b.nationDisp === 'war' && b.opinion < 0 && !b.treaty && !b.league ? '. They may invade.' : '.'}</span>` : ''}</div>`).join('') : '<p class="empty">No neighbours.</p>'}`;
  }
  function councilTab(run) {
    return `<p class="note">Your council governs with your ruler. Loyal councillors add their role and their trait; one whose loyalty falls below −30 gives nothing, and below −25 they may start plotting. Councillors grow more ambitious every generation.</p>
      ${run.council.map((c, i) => { const r = G.COUNCIL_ROLES[c.role]; return `<div class="callout ${run.plot === i ? 'warn' : ''}"><strong>${esc(r.name)}: ${esc(c.name)}${run.plot === i ? ' · plotting!' : ''}</strong><span>${esc(r.desc)} ${esc(G.describeMods(r.mods))}${c.traits.length ? `; ${esc(c.traits.map((t) => `${G.LEADER_TRAITS[t].name}: ${G.describeMods(G.LEADER_TRAITS[t].mods)}`).join(', '))}` : ''}${c.loyalty <= -30 ? ' (withheld: disloyal)' : ''}.</span>${loyaltyBar(c.loyalty)}</div>`; }).join('')}
      <p class="note">When your ruler dies, the council chooses the next one: any of the three, or an heir.</p>`;
  }
  // ---------- The Law tree (Update 19) ----------
  const LAW_BANDS = [['founding', 'Founding'], ['law', 'Laws'], ['council', 'Council'], ['faith', 'Faith'], ['culture', 'Culture'], ['neighbours', 'Neighbours'], ['gate', 'Union'], ['beyond', 'Beyond']];
  function lawTree(run, page) {
    const known = (id) => (page ? page.known : run.traditions || []).includes(id);
    const visible = page ? page.seen.map((id) => G.TRADITION[id]).filter(Boolean) : G.TRADITIONS.filter((t) => G.lawVisible(run, t));
    const have = run.special || 0; const k = G.kind(run) || { icon: '' };
    const live = !page && run.stage === 'society' && !(run.traditions || []).includes('union_gate');
    const state = (t) => {
      if (known(t.id)) return 'done';
      if (!live) return 'locked';
      const av = G.lawAvailable(run, t);
      return av.ok ? (G.lawCost(run, t.id) <= have ? 'open' : 'cant') : av.blocked ? 'blocked' : 'locked';
    };
    const sel = (G.ui.lawSel && visible.find((t) => t.id === G.ui.lawSel)) || (live && visible.find((t) => state(t) === 'open')) || visible.find((t) => t.law === 'gate') || visible[0];
    const { pos, labels, H } = treeLayout(visible, LAW_BANDS, (t) => t.law);
    const icon = { done: '✓', open: '', cant: k.icon, locked: '🔒', blocked: '✕' };
    const lean = page ? page.leaning : G.leaning(run);
    // Opposed laws are joined by a line.
    const edges = [];
    visible.forEach((t) => { if (t.excl && pos[t.id] && pos[t.excl] && t.id < t.excl) { const a = pos[t.id]; const b = pos[t.excl]; edges.push(`<path class="edge fork" d="M${a.x} ${a.y / H * 100} L ${b.x} ${b.y / H * 100}" vector-effect="non-scaling-stroke"/>`); } });
    return `
      <div class="mind-head">${leaningBar(lean)}</div>
      <div class="skill-tree mind-tree law-tree" style="height:${H}px">
        <svg class="edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${edges.join('')}</svg>
        ${labels.map((l) => `<span class="tier-label" style="top:${l.y - 30}px">${l.label}</span>`).join('')}
        ${visible.map((t) => { const st = state(t); return `<button class="node ${st === 'cant' ? 'open cant' : st} ${sel && sel.id === t.id ? 'sel' : ''} ${t.law === 'gate' ? 'apex' : ''} ${t.law === 'beyond' ? 'beyond' : ''} ${t.lean ? `lean-${t.lean}` : ''}" style="left:${pos[t.id].x}%;top:${pos[t.id].y}px" data-act="law-sel" data-arg="${t.id}" aria-pressed="${sel && sel.id === t.id}" aria-label="${esc(t.name)}">${nodeName(t.name)}${icon[st] ? `<i aria-hidden="true">${icon[st]}</i>` : ''}${t.rule || t.flag ? '<b class="rule-dot" aria-hidden="true">★</b>' : ''}</button>`; }).join('')}
      </div>
      ${sel ? lawDetail(run, sel, state(sel), live) : ''}`;
  }
  const FLAG_RULES = { peaceful: 'Neighbours sour on you more slowly.', open: 'Trade earns more.', closed: 'Raids land less often.', guests: 'Envoys and gifts work better.', messengers: 'Courting and gifts work better.', loyal: 'Your council stays loyal.', songSafe: 'No great loss costs you a discovery.' };
  function lawDetail(run, t, st, live) {
    const k = G.kind(run) || { icon: '', resource: '' }; const cost = G.lawCost(run, t.id);
    const av = live ? G.lawAvailable(run, t) : { ok: false };
    const where = { founding: `Founding: ${G.SOCIETY_TYPES[run.socType] ? G.SOCIETY_TYPES[run.socType].name : ''} people`, law: `A Law your people chose (tier ${'I'.repeat(t.tier || 1)})`, council: `Council: open while your ${t.role ? G.COUNCIL_ROLES[t.role].name : ''} is loyal (kept once adopted)`, faith: `Faith: ${run.faith ? run.faith.name : ''}`, culture: `Culture: ${t.when ? G.SOC_DEEDS[t.when.deed] : ''}`, neighbours: `Neighbours: ${t.when ? G.SOC_DEEDS[t.when.deed] : ''}`, gate: `The Union: ends the Society stage. Needs ${G.goals(run).evolveAt} Influence and ${G.unionNeed()} Law ideas`, beyond: `Beyond the Union (${G.LEAN_NAMES[t.disposition]} peoples only): adopt before it; an Inheritance in the next stage` }[t.law];
    let action = '';
    if (st === 'done') action = '<span class="note good-text">Adopted</span>';
    else if (live && av.ok) action = `<button class="btn primary small" ${cost <= (run.special || 0) ? `data-act="learn-law" data-arg="${t.id}"` : 'disabled'}>Adopt it (${k.icon} ${cost})</button>${cost > (run.special || 0) ? `<span class="reason">Needs ${cost} ${esc(k.resource)} (you have ${run.special || 0})</span>` : ''}`;
    return `
      <div class="inv-detail">
        <div class="inv-head"><strong>${esc(t.name)}</strong><span>${k.icon} ${cost}</span></div>
        <span class="inv-where">${esc(where)}${t.lean ? ` · ${G.LEAN_ICONS[t.lean]} ${esc(G.LEAN_NAMES[t.lean])}` : ''}</span>
        <span class="inv-mods">${esc(G.describeMods(t.mods))}</span>
        ${t.rule ? `<span class="inv-rule">★ ${esc(G.MIND_RULES[t.rule])}</span>` : ''}${t.flag && FLAG_RULES[t.flag] ? `<span class="inv-rule">★ ${esc(FLAG_RULES[t.flag])}</span>` : ''}
        ${t.inherit ? `<span class="inv-rule">Inheritance in the next stage: ${esc(G.describeMods(t.inherit))}</span>` : ''}
        <span class="inv-desc">${esc(t.desc)}</span>
        ${t.excl ? `<span class="inv-excl">Fork: rules out ${esc(G.TRADITION[t.excl].name)}</span>` : ''}
        ${live && !av.ok && st !== 'done' ? `<span class="reason">${esc(av.reason)}</span>` : ''}
        <div class="row tight">${action}</div>
      </div>`;
  }
  function traditionsTab(run) {
    const k = G.kind(run); const d = G.disposition(run);
    const done = (run.traditions || []).includes('union_gate');
    return `${done ? '' : `<p class="note">Your Law tree: ${G.lawKnown(run)} ideas adopted. It grows from your kind of society, the laws you choose as Influence comes in, your council, your faith, your deeds and how you deal with your neighbours. Adopting an idea costs ${esc(k.resource)} (you have <b>${run.special || 0}</b>).</p>
      <p class="note"><b>The Union</b> needs ${G.goals(run).evolveAt} Influence (you have ${run.dna}) and ${G.unionNeed()} Law ideas (you have ${G.lawKnown(run)}). Your Disposition, <b>${G.LEAN_ICONS[d]} ${esc(G.LEAN_NAMES[d])}</b>, decides how the region can be united.</p>`}
      ${lawTree(run, done && run.book && run.book.law ? run.book.law : null)}`;
  }
  // ---------- The Reason tree (Update 20) ----------
  const REASON_BANDS = [['inherit', 'Inheritance'], ['people', 'Your people'], ['invention', 'Inventions'], ['movement', 'Movements'], ['faith', 'The Schism'], ['deed', 'Deeds'], ['gate', 'Age of Sail'], ['beyond', 'Beyond']];
  const reasonName = (run, x) => G.loreName(x, run);
  function reasonTree(run, page) {
    const known = (id) => (page ? page.known : run.reason || []).includes(id);
    const visible = page ? page.seen.map((id) => G.REASON_ID[id]).filter(Boolean) : G.REASON.filter((x) => G.reasonVisible(run, x));
    const have = run.special || 0; const k = G.kind(run) || { icon: '' };
    const live = !page && run.stage === 'renaissance' && !(run.reason || []).includes('sail_gate');
    const state = (x) => {
      if (known(x.id)) return 'done';
      if (!live) return 'locked';
      const av = G.reasonAvailable(run, x);
      return av.ok ? (G.reasonCost(run, x.id) <= have ? 'open' : 'cant') : av.blocked ? 'blocked' : 'locked';
    };
    const sel = (G.ui.reasonSel && visible.find((x) => x.id === G.ui.reasonSel)) || (live && visible.find((x) => state(x) === 'open')) || visible.find((x) => x.band === 'gate') || visible[0];
    const { pos, labels, H } = treeLayout(visible, REASON_BANDS, (x) => x.band);
    const icon = { done: '✓', open: '', cant: k.icon, locked: '🔒', blocked: '✕' };
    const lean = page ? page.leaning : G.leaning(run);
    const edges = [];
    visible.forEach((x) => { if (x.excl && pos[x.id] && pos[x.excl] && x.id < x.excl) { const a = pos[x.id]; const b = pos[x.excl]; edges.push(`<path class="edge fork" d="M${a.x} ${a.y / H * 100} L ${b.x} ${b.y / H * 100}" vector-effect="non-scaling-stroke"/>`); } });
    return `
      <div class="mind-head">${leaningBar(lean)}</div>
      <div class="skill-tree mind-tree law-tree" style="height:${H}px">
        <svg class="edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${edges.join('')}</svg>
        ${labels.map((l) => `<span class="tier-label" style="top:${l.y - 30}px">${l.label}</span>`).join('')}
        ${visible.map((x) => { const st = state(x); const nm = reasonName(run, x); return `<button class="node ${st === 'cant' ? 'open cant' : st} ${sel && sel.id === x.id ? 'sel' : ''} ${x.band === 'gate' ? 'apex' : ''} ${x.band === 'beyond' ? 'beyond' : ''} ${x.lean ? `lean-${x.lean}` : ''}" style="left:${pos[x.id].x}%;top:${pos[x.id].y}px" data-act="reason-sel" data-arg="${x.id}" aria-pressed="${sel && sel.id === x.id}" aria-label="${esc(nm)}">${nodeName(nm)}${icon[st] ? `<i aria-hidden="true">${icon[st]}</i>` : ''}${x.rule ? '<b class="rule-dot" aria-hidden="true">★</b>' : ''}</button>`; }).join('')}
      </div>
      ${sel ? reasonDetail(run, sel, state(sel), live) : ''}`;
  }
  const SCHISM_NAMES = { reform: 'you reformed the faith', hold: 'you held to the old faith', tolerate: 'you tolerated every faith' };
  function reasonDetail(run, x, st, live) {
    const k = G.kind(run) || { icon: '', resource: '' }; const cost = G.reasonCost(run, x.id);
    const av = live ? G.reasonAvailable(run, x) : { ok: false };
    const where = {
      inherit: `Inheritance: ${G.societyEndingName(run) || 'how you united the region'}`,
      people: `Your people's own invention (tier ${'I'.repeat(x.tier || 1)})`,
      invention: `An invention your scholars found (tier ${'I'.repeat(x.tier || 1)})${x.disposition ? `; only for ${x.disposition.map((d) => G.LEAN_NAMES[d]).join(' or ')} nations` : ''}`,
      movement: 'A movement of art and thought',
      faith: `The Schism: ${SCHISM_NAMES[x.schism] || ''}`,
      deed: `Deed: ${x.when ? G.REN_DEEDS[x.when.deed] : ''}`,
      gate: `The Age of Sail: ends the Renaissance. Needs ${G.goals(run).evolveAt} Learning and ${G.sailNeed()} Reason ideas`,
      beyond: `Beyond the Age of Sail (${G.LEAN_NAMES[x.disposition]} nations only): learn it before you sail; an Inheritance in the next stage`,
    }[x.band];
    let action = '';
    if (st === 'done') action = '<span class="note good-text">Known</span>';
    else if (live && av.ok) action = `<button class="btn primary small" ${cost <= (run.special || 0) ? `data-act="learn-reason" data-arg="${x.id}"` : 'disabled'}>Take it up (${k.icon} ${cost})</button>${cost > (run.special || 0) ? `<span class="reason">Needs ${cost} ${esc(k.resource)} (you have ${run.special || 0})</span>` : ''}`;
    return `
      <div class="inv-detail">
        <div class="inv-head"><strong>${esc(reasonName(run, x))}</strong><span>${k.icon} ${cost}</span></div>
        <span class="inv-where">${esc(where)}${x.lean ? ` · ${G.LEAN_ICONS[x.lean]} ${esc(G.LEAN_NAMES[x.lean])}` : ''}</span>
        <span class="inv-mods">${esc(G.describeMods(x.mods))}</span>
        ${x.rule ? `<span class="inv-rule">★ ${esc(G.MIND_RULES[x.rule])}</span>` : ''}
        ${x.inherit ? `<span class="inv-rule">Inheritance in the next stage: ${esc(G.describeMods(x.inherit))}</span>` : ''}
        <span class="inv-desc">${esc(x.desc)}</span>
        ${x.excl ? `<span class="inv-excl">Fork: rules out ${esc(reasonName(run, G.REASON_ID[x.excl]))}</span>` : ''}
        ${live && !av.ok && st !== 'done' ? `<span class="reason">${esc(av.reason)}</span>` : ''}
        <div class="row tight">${action}</div>
      </div>`;
  }
  function reasonTab(run) {
    const k = G.kind(run); const d = G.disposition(run);
    const done = (run.reason || []).includes('sail_gate');
    return `${done ? '' : `<p class="note">Your Reason tree: ${G.reasonKnown(run)} ideas known. It grows from how you united the region, your people's own inventions, the inventions your Learning finds, the movements you back, the Schism and your deeds. Taking up an idea costs ${esc(k.resource)} (you have <b>${run.special || 0}</b>).</p>
      <p class="note"><b>The Age of Sail</b> needs ${G.goals(run).evolveAt} Learning (you have ${run.dna}) and ${G.sailNeed()} Reason ideas (you have ${G.reasonKnown(run)}). Your Disposition, <b>${G.LEAN_ICONS[d]} ${esc(G.LEAN_NAMES[d])}</b>, can still shift until then, and decides what your ships will do.</p>`}
      ${reasonTree(run, done && run.book && run.book.reason ? run.book.reason : null)}`;
  }
  function reasonCard(run) {
    const d = run.draft; const k = G.kind(run); const have = run.special || 0;
    return `
      <article class="card draft">
        <p class="eyebrow">The Reason tree</p>
        <h2>A new invention</h2>
        <p class="note">Your scholars' Learning opens a new branch of Reason. Choose one to add to your tree: take it up now for ${esc(k.resource)} (you have <b>${have}</b>), or keep it in the tree and take it up later from the Reason tab.</p>
        <div class="draft-list">
          ${d.options.map((id) => { const x = G.REASON_ID[id]; const cost = G.reasonCost(run, id); return `
            <div class="part-card ${cost > have ? 'cant' : ''}">
              <span class="opt-label">${esc(reasonName(run, x))}<span class="kw">${'I'.repeat(x.tier)}</span>${x.lean ? `<span class="kw">${G.LEAN_ICONS[x.lean]}</span>` : ''}<span class="cost ${cost > have ? 'bad' : ''}">${k.icon} ${cost}</span></span>
              <span class="opt-meta"><span>${esc(G.describeMods(x.mods))}</span></span>
              <span class="opt-desc">${esc(x.desc)}${x.disposition ? ` <i>Only for ${esc(x.disposition.map((v) => G.LEAN_NAMES[v]).join(' or '))} nations.</i>` : ''}</span>
              <div class="row tight">
                <button class="btn small primary" ${cost <= have ? `data-act="draft" data-arg="${id}" data-mode="learn"` : 'disabled'}>Add and take it up (${k.icon} ${cost})</button>
                <button class="btn small" data-act="hold-discovery" data-arg="${id}">Add to the tree</button>
              </div>
            </div>`; }).join('')}
        </div>
        <div class="row">
          ${d.rerolls > 0 ? `<button class="btn" data-act="reroll">Reroll (${d.rerolls})</button>` : ''}
          <button class="btn ghost" data-act="skip-draft">Skip for +3 Food</button>
        </div>
      </article>`;
  }
  const NATION_DISP = { peace: 'peaceful: they want trade and treaties', guard: 'territorial: they guard what is theirs', war: 'warlike: they mean to take what is yours' };
  function renaissanceEndCard(run, r) {
    const b = r.breakdown; const e = run.renaissanceEnding && G.RENAISSANCE_ENDINGS[run.renaissanceEnding];
    return `
      <div class="scene-wrap"><canvas class="scene" aria-hidden="true"></canvas></div>
      <article class="card end ${r.victory ? 'finale' : ''}">
        <p class="eyebrow">${r.victory ? 'Renaissance complete' : 'Your nation is gone'}</p>
        <h2>${r.victory && e ? esc(e.name) : `${esc(G.nationName(run))} has fallen`}</h2>
        <p class="event-text">${r.victory && e ? `${esc(e.desc)} ${esc(G.nationName(run))} sets sail under ${esc(run.leader ? G.leaderTitle(run.leader) : 'its council')}, after ${run.stageTurn} generation${run.stageTurn === 1 ? '' : 's'} and ${(run.reason || []).length} Reason ideas. The Colonial Age arrives in a later update.` : `${esc(r.cause)} Your nation lasted ${run.stageTurn} generations.`}${run.checkpointGenes ? ` (Earlier endings already earned +${run.checkpointGenes} Genetic Memory.)` : ''}</p>
        <div class="callout gene">
          <strong>${ICON.gene} +${r.genes} Genetic Memory</strong>
          <span>${b.base} from Learning${b.progress ? ` · +${b.progress} for your ideas and deeds` : ''}${b.winBonus ? ` · +${b.winBonus} for the Age of Sail` : ''}${b.firstEnding ? ` · +${b.firstEnding} for a new Renaissance ending` : ''}${b.mult > 1 ? ` · ×${b.mult}` : ''}</span>
        </div>
        <p class="note">You can start a new run from the dawn of ${esc(G.nationName(run))} with Stage Select, on the new lineage screen.</p>
        <div class="row">
          <button class="btn primary" data-act="setup">New lineage</button>
          <button class="btn" data-act="go" data-arg="unlocks">Evolution Tree</button>
          <button class="btn" data-act="go" data-arg="fossils">Fossil Record</button>
        </div>
      </article>`;
  }
  function patronageSection() {
    if (!G.patronageOpen()) return '<p class="note">Opens once one of your lineages reaches the Renaissance. Its upgrades only work in the Renaissance.</p>';
    return `<p class="note">Upgrades for the Renaissance: reach deeper into the Reason tree and set sail sooner.</p>${skillTree(G.PATRONAGE, G.ui.patSel, 'pat-sel', '')}`;
  }
  // ---------- The Crown tree (Update 21) ----------
  const CROWN_BANDS = [['inherit', 'Inheritance'], ['people', 'Your people'], ['tech', 'Technology'], ['law', 'Crown laws'], ['dynasty', 'Dynasty'], ['gate', 'The Crown'], ['beyond', 'Beyond']];
  function crownTree(run, page) {
    const known = (id) => (page ? page.known : run.crown || []).includes(id);
    const visible = page ? page.seen.map((id) => G.CROWN_ID[id]).filter(Boolean) : G.CROWN.filter((x) => G.crownVisible(run, x));
    const have = run.special || 0; const k = G.kind(run) || { icon: '' };
    const live = !page && run.stage === 'colonial' && !(run.crown || []).includes('crown_gate');
    const state = (x) => {
      if (known(x.id)) return 'done';
      if (!live) return 'locked';
      const av = G.crownAvailable(run, x);
      return av.ok ? (G.crownCost(run, x.id) <= have ? 'open' : 'cant') : av.blocked ? 'blocked' : 'locked';
    };
    const sel = (G.ui.crownSel && visible.find((x) => x.id === G.ui.crownSel)) || (live && visible.find((x) => state(x) === 'open')) || visible.find((x) => x.band === 'gate') || visible[0];
    const { pos, labels, H } = treeLayout(visible, CROWN_BANDS, (x) => x.band);
    const icon = { done: '✓', open: '', cant: k.icon, locked: '🔒', blocked: '✕' };
    const lean = page ? page.leaning : G.leaning(run);
    const edges = [];
    visible.forEach((x) => { if (x.excl && pos[x.id] && pos[x.excl] && x.id < x.excl) { const a = pos[x.id]; const b = pos[x.excl]; edges.push(`<path class="edge fork" d="M${a.x} ${a.y / H * 100} L ${b.x} ${b.y / H * 100}" vector-effect="non-scaling-stroke"/>`); } });
    return `
      <div class="mind-head">${leaningBar(lean)}</div>
      <div class="skill-tree mind-tree law-tree" style="height:${H}px">
        <svg class="edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${edges.join('')}</svg>
        ${labels.map((l) => `<span class="tier-label" style="top:${l.y - 30}px">${l.label}</span>`).join('')}
        ${visible.map((x) => { const st = state(x); const nm = G.loreName(x, run); return `<button class="node ${st === 'cant' ? 'open cant' : st} ${sel && sel.id === x.id ? 'sel' : ''} ${x.band === 'gate' ? 'apex' : ''} ${x.band === 'beyond' ? 'beyond' : ''} ${x.lean ? `lean-${x.lean}` : ''}" style="left:${pos[x.id].x}%;top:${pos[x.id].y}px" data-act="crown-sel" data-arg="${x.id}" aria-pressed="${sel && sel.id === x.id}" aria-label="${esc(nm)}">${nodeName(nm)}${icon[st] ? `<i aria-hidden="true">${icon[st]}</i>` : ''}${x.rule ? '<b class="rule-dot" aria-hidden="true">★</b>' : ''}</button>`; }).join('')}
      </div>
      ${sel ? crownDetail(run, sel, state(sel), live) : ''}`;
  }
  function crownDetail(run, x, st, live) {
    const k = G.kind(run) || { icon: '', resource: '' }; const cost = G.crownCost(run, x.id);
    const av = live ? G.crownAvailable(run, x) : { ok: false };
    const where = {
      inherit: `Inheritance: ${G.renaissanceEndingName(run) || 'the Age of Sail'}`,
      people: `Your people's own technology (tier ${'I'.repeat(x.tier || 1)})`,
      tech: `A technology your Prestige opened (tier ${'I'.repeat(x.tier || 1)})${x.disposition ? `; only for ${x.disposition.map((d) => G.LEAN_NAMES[d]).join(' or ')} crowns` : ''}`,
      law: 'A Crown law',
      dynasty: `Deed: ${x.when ? G.CROWN_DEEDS[x.when.deed] : ''}`,
      gate: `The Imperial Crown: ends the Colonial Age. Needs ${G.goals(run).evolveAt} Prestige and ${G.crownNeed()} Crown ideas`,
      beyond: `Beyond the Imperial Crown (${G.LEAN_NAMES[x.disposition]} crowns only): take it up before you claim the Crown; an Inheritance in the next stage`,
    }[x.band];
    let action = '';
    if (st === 'done') action = '<span class="note good-text">Known</span>';
    else if (live && av.ok) action = `<button class="btn primary small" ${cost <= (run.special || 0) ? `data-act="learn-crown" data-arg="${x.id}"` : 'disabled'}>Take it up (${k.icon} ${cost})</button>${cost > (run.special || 0) ? `<span class="reason">Needs ${cost} ${esc(k.resource)} (you have ${run.special || 0})</span>` : ''}`;
    return `
      <div class="inv-detail">
        <div class="inv-head"><strong>${esc(G.loreName(x, run))}</strong><span>${k.icon} ${cost}</span></div>
        <span class="inv-where">${esc(where)}${x.lean ? ` · ${G.LEAN_ICONS[x.lean]} ${esc(G.LEAN_NAMES[x.lean])}` : ''}</span>
        <span class="inv-mods">${esc(G.describeMods(x.mods))}</span>
        ${x.rule ? `<span class="inv-rule">★ ${esc(G.MIND_RULES[x.rule])}</span>` : ''}
        ${x.inherit ? `<span class="inv-rule">Inheritance in the next stage: ${esc(G.describeMods(x.inherit))}</span>` : ''}
        <span class="inv-desc">${esc(x.desc)}</span>
        ${x.excl ? `<span class="inv-excl">Fork: rules out ${esc(G.loreName(G.CROWN_ID[x.excl], run))}</span>` : ''}
        ${live && !av.ok && st !== 'done' ? `<span class="reason">${esc(av.reason)}</span>` : ''}
        <div class="row tight">${action}</div>
      </div>`;
  }
  function crownTab(run) {
    const k = G.kind(run); const d = G.disposition(run);
    const done = (run.crown || []).includes('crown_gate');
    return `${done ? '' : `<p class="note">Your Crown tree: ${G.crownKnown(run)} ideas known. It grows from how your ships met the world, your people's own technology, the technologies your Prestige opens, the Crown laws you choose and the deeds of your dynasty. Taking up an idea costs ${esc(k.resource)} (you have <b>${run.special || 0}</b>).</p>
      <p class="note"><b>The Imperial Crown</b> needs ${G.goals(run).evolveAt} Prestige (you have ${run.dna}) and ${G.crownNeed()} Crown ideas (you have ${G.crownKnown(run)}). Your Disposition, <b>${G.LEAN_ICONS[d]} ${esc(G.LEAN_NAMES[d])}</b>, can still shift until then, and decides what kind of crown it will be.</p>`}
      ${crownTree(run, done && run.book && run.book.crown ? run.book.crown : null)}`;
  }
  function crownCard(run) {
    const d = run.draft; const k = G.kind(run); const have = run.special || 0;
    return `
      <article class="card draft">
        <p class="eyebrow">The Crown tree</p>
        <h2>A new technology</h2>
        <p class="note">Your realm's Prestige opens a new branch of the Crown. Choose one to add to your tree: take it up now for ${esc(k.resource)} (you have <b>${have}</b>), or keep it in the tree for later.</p>
        <div class="draft-list">
          ${d.options.map((id) => { const x = G.CROWN_ID[id]; const cost = G.crownCost(run, id); return `
            <div class="part-card ${cost > have ? 'cant' : ''}">
              <span class="opt-label">${esc(G.loreName(x, run))}<span class="kw">${'I'.repeat(x.tier)}</span>${x.lean ? `<span class="kw">${G.LEAN_ICONS[x.lean]}</span>` : ''}<span class="cost ${cost > have ? 'bad' : ''}">${k.icon} ${cost}</span></span>
              <span class="opt-meta"><span>${esc(G.describeMods(x.mods))}</span></span>
              <span class="opt-desc">${esc(x.desc)}${x.disposition ? ` <i>Only for ${esc(x.disposition.map((v) => G.LEAN_NAMES[v]).join(' or '))} crowns.</i>` : ''}</span>
              <div class="row tight">
                <button class="btn small primary" ${cost <= have ? `data-act="draft" data-arg="${id}" data-mode="learn"` : 'disabled'}>Add and take it up (${k.icon} ${cost})</button>
                <button class="btn small" data-act="hold-discovery" data-arg="${id}">Add to the tree</button>
              </div>
            </div>`; }).join('')}
        </div>
        <div class="row">
          ${d.rerolls > 0 ? `<button class="btn" data-act="reroll">Reroll (${d.rerolls})</button>` : ''}
          <button class="btn ghost" data-act="skip-draft">Skip for +3 Food</button>
        </div>
      </article>`;
  }
  // Colonies and the heir, shown in the Realm tab.
  function colonialSection(run) {
    if (run.stage !== 'colonial') return '';
    const cols = run.colonies || [];
    const how = { settle: 'settled', trade: 'a trading colony', conquer: 'conquered' };
    return `
      <h3>👑 The heir</h3>
      ${run.heir ? leaderCard(run, run.heir, 'generations') : '<p class="empty">No heir yet.</p>'}
      <p class="note">${G.mindRule(run, 'heir_sure') ? 'Primogeniture: your heir inherits without a crisis.' : G.mindRule(run, 'heir_chosen') ? 'Elective Crown: the council chooses the best of the family, who takes the throne with an extra good trait.' : 'When your ruler dies, the heir takes the throne, and the council grumbles. A Crown law can settle this.'}</p>
      <h3>⛵ Colonies (${cols.length} of 6)</h3>
      <p class="note">Each colony adds Food and Prestige as it grows. Restless colonies rebel at 100 unrest and break away: royal tours, Colonial Councils and Garrisons keep them calm.</p>
      ${cols.length ? cols.map((c) => `<div class="callout ${c.unrest >= 70 ? 'warn' : ''}"><strong>${esc(c.name)} · ${'■'.repeat(c.size)}${'□'.repeat(4 - c.size)}</strong><span>${esc(how[c.how] || 'settled')}${c.from ? ` (once the ${esc(c.from)})` : ''} · unrest ${Math.round(c.unrest)}${c.unrest >= 70 ? ': close to rebellion' : ''}</span>${loyaltyBar(100 - 2 * Math.round(c.unrest))}</div>`).join('') : '<p class="empty">No colonies yet. Found one from Activities.</p>'}`;
  }
  function colonialEndCard(run, r) {
    const b = r.breakdown; const e = run.colonialEnding && G.COLONIAL_ENDINGS[run.colonialEnding];
    return `
      <div class="scene-wrap"><canvas class="scene" aria-hidden="true"></canvas></div>
      <article class="card end ${r.victory ? 'finale' : ''}">
        <p class="eyebrow">${r.victory ? 'Colonial Age complete' : 'Your realm is gone'}</p>
        <h2>${r.victory && e ? esc(e.name) : `${esc(G.realmName(run))} has fallen`}</h2>
        <p class="event-text">${r.victory && e ? `${esc(e.desc)} ${esc(G.realmName(run))} is crowned under ${esc(run.leader ? G.leaderTitle(run.leader) : 'its council')}, after ${run.stageTurn} generation${run.stageTurn === 1 ? '' : 's'}, with ${(run.colonies || []).length} colonies. The age of Empires arrives in a later update.` : `${esc(r.cause)} Your realm lasted ${run.stageTurn} generations.`}${run.checkpointGenes ? ` (Earlier endings already earned +${run.checkpointGenes} Genetic Memory.)` : ''}</p>
        <div class="callout gene">
          <strong>${ICON.gene} +${r.genes} Genetic Memory</strong>
          <span>${b.base} from Prestige${b.progress ? ` · +${b.progress} for your ideas and colonies` : ''}${b.winBonus ? ` · +${b.winBonus} for the Imperial Crown` : ''}${b.firstEnding ? ` · +${b.firstEnding} for a new Colonial ending` : ''}${b.mult > 1 ? ` · ×${b.mult}` : ''}</span>
        </div>
        <p class="note">You can start a new run from the coronation of ${esc(G.realmName(run))} with Stage Select, on the new lineage screen.</p>
        <div class="row">
          <button class="btn primary" data-act="setup">New lineage</button>
          <button class="btn" data-act="go" data-arg="unlocks">Evolution Tree</button>
          <button class="btn" data-act="go" data-arg="fossils">Fossil Record</button>
        </div>
      </article>`;
  }
  function chartersSection() {
    if (!G.chartersOpen()) return '<p class="note">Opens once one of your lineages reaches the Colonial Age. Its upgrades only work in the Colonial Age.</p>';
    return `<p class="note">Upgrades for the Colonial Age: a richer Crown tree, calmer colonies and an easier road to the Imperial Crown.</p>${skillTree(G.CHARTERS, G.ui.chSel, 'ch-sel', '')}`;
  }
  function societyEndCard(run, r) {
    const b = r.breakdown; const sk = G.socKind(run);
    const e = run.societyEnding && G.SOCIETY_ENDINGS[run.path][run.habitat === 'sea' ? 'sea' : 'land'][run.societyEnding];
    return `
      <div class="scene-wrap"><canvas class="scene" aria-hidden="true"></canvas></div>
      <article class="card end ${r.victory ? 'finale' : ''}">
        <p class="eyebrow">${r.victory ? 'Society stage complete' : 'Your people are gone'}</p>
        <h2>${r.victory && e ? esc(e.name) : `The ${esc(sk.name)} have fallen`}</h2>
        <p class="event-text">${r.victory && e ? `${esc(e.desc)} United under ${esc(run.leader ? G.leaderTitle(run.leader) : 'the council')}, after ${run.stageTurn} generation${run.stageTurn === 1 ? '' : 's'}, with ${run.settlements.length} ${esc(sk.settlement)}s and ${(run.traditions || []).length} traditions. The Empire stage arrives in a later update.` : `${esc(r.cause)} Your people lasted ${run.stageTurn} generations as the ${esc(sk.name)}.`}${run.checkpointGenes ? ` (Earlier endings already earned +${run.checkpointGenes} Genetic Memory.)` : ''}</p>
        <div class="callout gene">
          <strong>${ICON.gene} +${r.genes} Genetic Memory</strong>
          <span>${b.base} from Influence${b.progress ? ` · +${b.progress} for your ${esc(sk.settlement)}s and traditions` : ''}${b.winBonus ? ` · +${b.winBonus} for the Union` : ''}${b.firstEnding ? ` · +${b.firstEnding} for a new Society ending` : ''}${b.mult > 1 ? ` · ×${b.mult}` : ''}</span>
        </div>
        <p class="note">You can start a new run from the beginning of the ${esc(sk.name)} with Stage Select, on the new lineage screen.</p>
        <div class="row">
          <button class="btn primary" data-act="setup">New lineage</button>
          <button class="btn" data-act="go" data-arg="unlocks">Evolution Tree</button>
          <button class="btn" data-act="go" data-arg="fossils">Fossil Record</button>
        </div>
      </article>`;
  }

  function draftCard(run) {
    if (run.stage === 'colonial') return crownCard(run);
    if (run.stage === 'renaissance') return reasonCard(run);
    if (run.stage === 'society') return traditionCard(run);
    if (run.stage === 'tribe') return discoveryCard(run);
    const d = run.draft;
    const counts = G.keywordCounts(run);
    const merging = G.canMerge(run);
    return `
      <article class="card draft">
        <p class="eyebrow">${d.source ? { absorb: 'Absorb', devour: 'Devour', steal: 'Steal', copy: 'Copy' }[d.source] : 'Mutation'}</p>
        <h2>${d.source ? esc({ absorb: `Absorb a part from the ${d.from}`, devour: `You are what you eat: the ${d.from}`, steal: `Steal a part from your host, the ${d.from}`, copy: `Copy a part from the ${d.from}` }[d.source]) : 'Choose a new part'}</h2>
        <p class="note">Grow it into an empty slot, merge it with the part already there (keeping both), or replace that part. The right pairs evolve into something new.</p>
        <div class="draft-list">
          ${d.options.map((pid) => {
            const p = G.PART[pid];
            const slot = run.parts[p.slot];
            const slotName = G.slotName(run, p.slot);
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
            // One set of buttons per socket (two with a Twin upgrade).
            const socks = G.socketsFor(run, p);
            const socketButtons = (key) => {
              const sl = run.parts[key];
              const tag = socks.length > 1 ? `data-socket="${key}"` : '';
              const where = socks.length > 1 ? `${key.endsWith('2') ? '2nd' : '1st'} socket: ` : '';
              if (!sl) return `<button class="btn small primary" data-act="draft" data-arg="${pid}" data-mode="grow" ${tag}>${where}Grow it</button>`;
              if (sl.merged) {
                // A merged slot stays merged: choose which half the new part replaces.
                const h1 = evoHint(sl.merged); const h2 = evoHint(sl.id);
                return `<button class="btn small primary ${h1 ? 'evo' : ''}" data-act="draft" data-arg="${pid}" data-mode="swapBase" ${tag}>${where}Swap out ${esc(G.PART[sl.id].name)}${esc(h1)}</button>`
                  + `<button class="btn small primary ${h2 ? 'evo' : ''}" data-act="draft" data-arg="${pid}" data-mode="swapMerged" ${tag}>${where}Swap out ${esc(G.PART[sl.merged].name)}${esc(h2)}</button>`;
              }
              const h = evoHint(sl.id);
              return `${merging ? `<button class="btn small primary ${h ? 'evo' : ''}" data-act="draft" data-arg="${pid}" data-mode="merge" ${tag}>${where}Merge with ${esc(G.PART[sl.id].name)}${esc(h)}</button>` : ''}<button class="btn small" data-act="draft" data-arg="${pid}" data-mode="replace" ${tag}>${where}Replace ${esc(G.slotLabel(sl))}</button>`;
            };
            const buttons = socks.map(socketButtons).join('');
            return `
            <div class="part-card">
              <span class="opt-slot">${esc(slotName)}${slot ? ` · now ${esc(G.slotLabel(slot))}` : ' · empty'}${socks.length > 1 ? ` · 2nd: ${run.parts[socks[1]] ? esc(G.slotLabel(run.parts[socks[1]])) : 'empty'}` : ''}</span>
              <span class="opt-label">${picon(pid)}${esc(p.name)}${kwTags(p)}${G.partNeeds(p, run.habitat) ? `<span class="kw plan">${esc(G.partNeeds(p, run.habitat))}</span>` : ''}${p.evolved ? `<span class="kw unlocked">${p.evolved === 2 ? 'Legendary' : 'Unlocked'}</span>` : ''}</span>
              <span class="opt-meta"><span>${esc(G.describeMods(p.mods))}${p.diet ? ` · ${G.DIET_NAMES[p.diet]}` : ''}${(p.tags || []).includes('grasp') ? ' · Can grasp' : ''}</span></span>
              <span class="opt-desc">${esc(p.desc)}</span>
              ${syn}
              ${G.showNumbers() ? compareBox(run, pid, socks) : ''}
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
        <p class="note">Insight flows into it each turn (${G.insightPerTurn(run)} per turn now). Your tree grows from your temperament, where you live and your Path of Mind.</p>
        ${mindTree(run)}
      </article>`;
  }

  // The Mind as a skill tree, built from this lineage's pieces (Update 17: the Mind tree grown from
  // your choices). Bands, top to bottom: Roots, Home, Body, Memories, Path, Path, Awakening, Beyond.
  const BANDS = [
    ['root', 'Roots'], ['home', 'Home'], ['body', 'Body'], ['memory', 'Memories'], ['path3', 'Path'], ['path4', 'Path'], ['cap', 'Awakening'], ['beyond', 'Beyond'],
  ];
  const bandOf = (inv) => (inv.group === 'trunk' || inv.group === 'home' ? 'home' : inv.group === 'path' ? `path${inv.tier}` : inv.group);
  function leaningBar(lean) {
    const tot = lean.peace + lean.guard + lean.war;
    if (!tot) return '<span class="lean-bar empty">No leaning yet</span>';
    // Ties go the way your Disposition does: Territorial first, then Warmongering.
    const best = Math.max(lean.peace, lean.guard, lean.war);
    const top = lean.guard === best ? 'guard' : lean.war === best ? 'war' : 'peace';
    return `<span class="lean-bar" title="Your leaning: ${esc(Object.entries(lean).map(([k, v]) => `${G.LEAN_NAMES[k]} ${v}`).join(', '))}">${['peace', 'guard', 'war'].map((k) => lean[k] ? `<i class="lean ${k}" style="flex:${lean[k]}">${G.LEAN_ICONS[k]} ${lean[k]}</i>` : '').join('')}</span><span class="lean-top">Leaning ${esc(G.LEAN_NAMES[top])}</span>`;
  }
  function mindHeader(run, page) {
    const tm = page ? G.TEMPERAMENTS[run.archetype] : G.temperament(run); const pth = run.path && G.PATH[run.path];
    const end = G.endingFor(run);
    return `<div class="mind-head">
        <span class="chip">${esc(tm ? tm.name : '')}</span>
        ${pth ? `<span class="chip path">${pth.icon} ${esc(pth.name)}</span>` : ''}
        ${leaningBar(page ? page.leaning : G.leaning(run))}
        ${end && !page ? `<span class="mind-goal">Leads to <b>${esc(G.endingName(run, end))}</b>: ${esc(G.LEGACIES[end].desc)}</span>` : ''}
      </div>`;
  }
  // page: a frozen page of the Book ({ seen, known }); without it, the live tree.
  // A node's name, shrunk to fit its box when it has a long word in it.
  function nodeName(name) {
    const long = Math.max(...String(name).split(/\s+/).map((w) => w.length));
    const words = String(name).split(/\s+/).length;
    return `<span class="${long >= 10 ? 'n-xs' : long >= 8 || words >= 4 ? 'n-s' : ''}">${esc(name)}</span>`;
  }
  function mindTree(run, page) {
    const known = (id) => (page ? page.known : run.innovations).includes(id);
    const visible = page ? page.seen.map((id) => G.INNOVATION[id]).filter(Boolean) : G.INNOVATIONS.filter((inv) => G.innovationVisible(run, inv));
    const sel = (G.ui.mindSel && visible.find((i) => i.id === G.ui.mindSel)) || (!page && run.fascination && G.INNOVATION[run.fascination]) || (!page && visible.find((i) => G.innovationAvailable(run, i).ok)) || visible[0];
    const state = (inv) => {
      if (known(inv.id)) return 'done';
      if (page) return 'locked';
      if (run.fascination === inv.id) return 'current';
      const av = G.innovationAvailable(run, inv);
      // Only what your Insight already covers glows; the rest of what's open waits quietly.
      return av.ok ? (G.innovationCost(run, inv) <= (run.insight || 0) ? 'open' : 'open cant') : av.blocked ? 'blocked' : 'locked';
    };
    // Lay out each band in lines of at most 4 nodes.
    const PER = 4; const LINE = 74; const GAP = 16;
    const pos = {}; const labels = []; let y = 34;
    BANDS.forEach(([band, label]) => {
      const list = visible.filter((inv) => bandOf(inv) === band);
      if (!list.length) return;
      labels.push({ y, label });
      for (let i = 0; i < list.length; i += PER) {
        const row = list.slice(i, i + PER);
        row.forEach((inv, j) => { pos[inv.id] = { x: 14 + ((j + 0.5) / row.length) * 80, y }; });
        y += LINE;
      }
      y += GAP;
    });
    const H = y;
    const edges = [];
    const edge = (par, inv) => {
      if (!pos[par.id] || !pos[inv.id]) return;
      const cls = known(par.id) && known(inv.id) ? 'done' : known(par.id) ? 'lit' : 'dim';
      const a = pos[par.id]; const b = pos[inv.id];
      const ay = (a.y + 26) / H * 100; const by = (b.y - 26) / H * 100;
      edges.push(`<path class="edge ${cls}" d="M${a.x} ${ay} C ${a.x} ${ay + 5}, ${b.x} ${by - 5}, ${b.x} ${by}" vector-effect="non-scaling-stroke"/>`);
    };
    visible.forEach((inv) => {
      const r = inv.req || {};
      const explicit = (r.innovation || []).concat(r.some || []).map((id) => G.INNOVATION[id]).filter((p) => p && pos[p.id]);
      // Path ideas open from any home, body or memory idea; home from any root: lines from the ones you know.
      const implicit = inv.tier === 3 ? visible.filter((p) => p.tier === 2 && known(p.id)) : inv.group === 'trunk' || inv.group === 'home' ? visible.filter((p) => p.tier === 1 && known(p.id)) : [];
      const near = (list) => list.slice().sort((p, q) => Math.abs(pos[p.id].x - pos[inv.id].x) - Math.abs(pos[q.id].x - pos[inv.id].x)).slice(0, 1);
      // "Any of these" ideas: lines from the ones you know, or just the nearest one, not a web from all of them.
      const lit = explicit.filter((p) => known(p.id));
      (lit.length ? lit : explicit.length ? near(explicit) : near(implicit)).forEach((par) => edge(par, inv));
    });
    const icon = { done: '✓', current: '◔', open: '', blocked: '✕', locked: '🔒' };
    const capKnown = visible.some((inv) => inv.group === 'cap' && known(inv.id));
    const beyondLeft = !page && !capKnown && visible.some((inv) => inv.group === 'beyond' && !known(inv.id));
    return `
      ${mindHeader(run, page)}
      ${beyondLeft ? '<p class="note beyond-note">Your Awakening ends the Creature stage. Ideas <b>Beyond the Gate</b> must be learned before it, and carry on into every stage after.</p>' : ''}
      <div class="skill-tree mind-tree" style="height:${H}px">
        <svg class="edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${edges.join('')}</svg>
        ${labels.map((l) => `<span class="tier-label" style="top:${l.y - 30}px">${l.label}</span>`).join('')}
        ${visible.map((inv) => {
          const st = state(inv); const name = G.innovationName(inv, run);
          return `<button class="node ${st} ${sel && sel.id === inv.id ? 'sel' : ''} ${inv.group === 'cap' ? 'apex' : ''} ${inv.group === 'beyond' ? 'beyond' : ''} ${inv.lean ? `lean-${inv.lean}` : ''}" style="left:${pos[inv.id].x}%;top:${pos[inv.id].y}px" data-act="mind-sel" data-arg="${inv.id}" aria-pressed="${sel && sel.id === inv.id}" aria-label="${esc(name)}">${nodeName(name)}${icon[st] ? `<i aria-hidden="true">${icon[st]}</i>` : ''}${inv.rule ? '<b class="rule-dot" aria-hidden="true">★</b>' : ''}</button>`;
        }).join('')}
      </div>
      ${sel ? mindDetail(run, sel, state(sel), page) : ''}`;
  }

  function mindDetail(run, sel, st, page) {
    const av = page ? { ok: false } : G.innovationAvailable(run, sel);
    const excl = (sel.excludes || []).map((id) => G.innovationName(G.INNOVATION[id], run)).concat(G.INNOVATIONS.filter((x) => (x.excludes || []).includes(sel.id)).map((x) => G.innovationName(x, run)));
    const cost = G.innovationCost(run, sel);
    let action = '';
    if (st === 'open' || st === 'open cant') action = `<button class="btn primary small" data-act="fascinate" data-arg="${sel.id}">Research (${cost} Insight)</button>${st === 'open cant' ? `<span class="note">You have ${run.insight || 0} Insight; it builds up each turn while you research.</span>` : ''}`;
    if (st === 'current') action = `<span class="note">Researching: ${run.insight} / ${cost} Insight</span>`;
    if (st === 'done') action = '<span class="note good-text">Known</span>';
    const memo = sel.group === 'memory' ? G.MEMORIES[sel.when.memory] : '';
    const where = { root: `Root: ${G.temperament(run).name}`, trunk: run.habitat === 'sea' ? 'Sea' : 'Land', home: 'Home', body: 'Body: grown from what you are', memory: `Memory: ${memo}`, path: run.path ? G.PATH[run.path].name : 'Path', cap: 'Awakening: ends the Creature stage', beyond: 'Beyond the Gate: learn before your Awakening; an Inheritance for every later stage' }[sel.group];
    return `
      <div class="inv-detail">
        <div class="inv-head"><strong>${esc(G.innovationName(sel, run))}</strong><span>${ICON.insight} ${cost}</span></div>
        <span class="inv-where">${esc(where)}${sel.lean ? ` · ${G.LEAN_ICONS[sel.lean]} ${esc(G.LEAN_NAMES[sel.lean])}` : ''}</span>
        <span class="inv-mods">${esc(G.describeMods(sel.mods))}${sel.vision ? ' · see more of the world map' : ''}</span>
        ${sel.rule ? `<span class="inv-rule">★ ${esc(G.MIND_RULES[sel.rule])}</span>` : ''}
        ${sel.inherit ? `<span class="inv-rule">Inheritance in every later stage: ${esc(G.describeMods(sel.inherit))}</span>` : ''}
        <span class="inv-desc">${esc(G.innovationDesc(sel, run))}</span>
        ${excl.length ? `<span class="inv-excl">Fork: rules out ${esc(excl.join(', '))}</span>` : ''}
        ${!page && !av.ok && st !== 'done' ? `<span class="reason">${esc(av.reason)}</span>` : ''}
        <div class="row tight">${action}</div>
      </div>`;
  }

  function evolvedCard(run) {
    const e = run.evolved;
    if (e && e.colonial) {
      const far = run.species.filter((x) => x.overseas && !x.extinct);
      return `
      <div class="scene-wrap"><canvas class="scene" aria-hidden="true"></canvas></div>
      <article class="card finale">
        <p class="eyebrow">The Colonial Age · ${esc(G.PATH[run.path].name)}</p>
        <h2>${esc(e.ending)}: ${esc(e.kind)}</h2>
        <p class="event-text">Your nation is a crown now, ruled by <b>${esc(run.leader ? G.leaderTitle(run.leader) : 'its council')}</b>, with <b>${esc(run.heir ? run.heir.name : 'no one')}</b> as heir. Across the sea, new peoples have seen your ships, and they will remember how you came.${run.checkpointGenes ? ` Your endings so far earned <b>+${run.checkpointGenes} Genetic Memory</b>, kept whatever happens next.` : ''}</p>
        ${far.map((b) => `<div class="callout"><strong>${G.LEAN_ICONS[b.nationDisp]} The ${esc(b.name)}</strong><span>Across the sea · ${esc(NATION_DISP[b.nationDisp])} (opinion ${b.opinion}).</span></div>`).join('')}
        <p class="note">Prestige replaces Learning. Each goal brings a technology for your new <b>Crown</b> tree; choose Crown laws, found colonies and keep them calm, trade or conquer across the sea, and keep your dynasty going. Reach ${G.goals(run).evolveAt} Prestige and ${G.crownNeed()} Crown ideas for the Imperial Crown.</p>
        <button class="btn primary wide" data-act="continue-evolved">Take the crown</button>
      </article>`;
    }
    if (e && e.renaissance) {
      const nb = run.species.filter((x) => x.nation && !x.extinct);
      return `
      <div class="scene-wrap"><canvas class="scene" aria-hidden="true"></canvas></div>
      <article class="card finale">
        <p class="eyebrow">The Renaissance · ${esc(G.PATH[run.path].name)}</p>
        <h2>${esc(e.ending)}: ${esc(e.kind)}</h2>
        <p class="event-text">The region is one nation now, ruled by <b>${esc(run.leader ? G.leaderTitle(run.leader) : 'its council')}</b>. Beyond its borders the old neighbours have become nations too, and they remember everything your lineage did to them.${run.checkpointGenes ? ` Your endings so far earned <b>+${run.checkpointGenes} Genetic Memory</b>, kept whatever happens next.` : ''}</p>
        ${nb.map((b) => `<div class="callout"><strong>${G.LEAN_ICONS[b.nationDisp]} The ${esc(b.name)}</strong><span>${esc(NATION_DISP[b.nationDisp])} (opinion ${b.opinion}${G.grudge(b) ? `, memory ${G.grudge(b) > 0 ? '+' : ''}${G.grudge(b)}` : ''}).</span></div>`).join('')}
        <p class="note">Learning replaces Influence. Each goal brings an invention for your new <b>Reason</b> tree; back patrons, send voyages, form leagues, and survive the Schism. Your Disposition can shift again until you reach ${G.goals(run).evolveAt} Learning and ${G.sailNeed()} Reason ideas for the Age of Sail: explore, trade or conquer.</p>
        <button class="btn primary wide" data-act="continue-evolved">Begin the new age</button>
      </article>`;
    }
    if (e && e.society) {
      const sk = G.socKind(run); const st = G.SOCIETY_TYPES[run.socType];
      return `
      <div class="scene-wrap"><canvas class="scene" aria-hidden="true"></canvas></div>
      <article class="card finale">
        <p class="eyebrow">Society Stage · ${esc(G.PATH[run.path].name)}</p>
        <h2>${esc(e.ending)}: the ${esc(sk.name)}</h2>
        <p class="event-text">Your ${esc(G.kind(run).band)} has become a people of ${run.settlements.length} ${esc(sk.settlement)}s, with ${esc(sk.capital)} at its heart, ruled by <b>${esc(G.leaderTitle(run.leader))}</b> and a council of three.${run.checkpointGenes ? ` Your endings so far earned <b>+${run.checkpointGenes} Genetic Memory</b>, kept whatever happens next.` : ''}</p>
        <div class="callout"><strong>${esc(st.name)} people</strong><span>${esc(st.rule)} (${esc(G.describeMods(st.mods))})</span></div>
        <div class="callout"><strong>📜 ${esc(G.mythName(run))}</strong><span>Your founding myth: +1 Charm.</span></div>
        <p class="note">Influence replaces Ideas. It comes from your ${esc(sk.settlement)}s, your Keeper and your traditions. Each goal brings a Tradition. Found and build ${esc(sk.settlement)}s to hold more people, keep your council loyal, and deal with ${run.species.filter((x) => x.band && !x.extinct).length} neighbour peoples. Reach ${G.goals(run).evolveAt} Influence for the Union: unite the region by force, by trade or by faith.</p>
        <button class="btn primary wide" data-act="continue-evolved">Rule your people</button>
      </article>`;
    }
    if (e && e.tribe) {
      const k = G.kind(run); const tt = G.TRIBE_TEMPER[G.temperament(run).id];
      return `
      <div class="scene-wrap"><canvas class="scene" aria-hidden="true"></canvas></div>
      <article class="card finale">
        <p class="eyebrow">Tribe Stage · ${esc(G.PATH[run.path].name)}</p>
        <h2>${esc(e.ending)}: the ${esc(k.name)} is born</h2>
        <p class="event-text">Your kind is no longer a ${run.habitat === 'sea' ? 'school' : 'herd'}. It is a people, with a name for itself and a leader: <b>${esc(G.leaderTitle(run.leader))}</b>.${run.checkpointGenes ? ` Your Creature ending earned <b>+${run.checkpointGenes} Genetic Memory</b>, kept whatever happens next.` : ''}</p>
        <div class="callout"><strong>${k.icon} ${esc(k.resource)}</strong><span>${esc(G.sub(G.KINDS[run.path].desc, run))}</span></div>
        ${tt ? `<div class="callout"><strong>${esc(G.temperament(run).name)}</strong><span>${esc(tt.rule)}</span></div>` : ''}
        <p class="note">Ideas replace DNA. Each goal brings a Discovery instead of a mutation, from your Path, your home and what your body can do. Reach ${G.goals(run).evolveAt} Ideas for the Founding, where your people choose to Settle, Roam or Conquer. Your body no longer changes.</p>
        <button class="btn primary wide" data-act="continue-evolved">Lead your people</button>
      </article>`;
    }
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
    if (run.stage === 'colonial') return colonialEndCard(run, r);
    if (run.stage === 'renaissance') return renaissanceEndCard(run, r);
    if (run.stage === 'society') return societyEndCard(run, r);
    if (run.stage === 'tribe') return tribeEndCard(run, r);
    const leg = run.legacy && G.LEGACIES[run.legacy];
    const b = r.breakdown;
    return `
      <div class="scene-wrap"><canvas class="scene" aria-hidden="true"></canvas></div>
      <article class="card end ${r.victory ? 'finale' : ''}">
        <p class="eyebrow">${r.victory ? 'Prototype complete' : 'Extinction'}</p>
        <h2>${r.victory ? esc(G.endingName(run)) : 'Your lineage is gone'}</h2>
        <p class="event-text">${r.victory ? `${leg.path ? `${esc(G.PATH[leg.path].name)} · ${esc(G.temperament(run).name)}. ` : ''}Your people will become ${esc(leg.desc.replace(/\.$/, '').replace(/^A /, 'a '))}. ${leg.path ? esc(G.temperament(run).rule) : ''} ${G.TRIBE_PATHS.includes(leg.path) ? '' : ` The Tribe stage for ${esc(G.PATH[leg.path] ? G.PATH[leg.path].name : 'your kind')} arrives in Update 15.`}` : `${esc(r.cause)} It lasted ${run.turn} turns and reached the ${esc(G.STAGES[run.stage].name)}${run.stage === 'creature' ? ` (${esc(G.ERAS[run.era])})` : ''}.`}</p>
        ${(() => { const fresh = G.meta.codex.evolutions.filter((id) => !(run.knownEvos || []).includes(id)); return fresh.length ? `<div class="callout"><strong>Unlocked for future runs</strong><span>${esc(listJoin(fresh.map((id) => G.PART[id].name)))} can now appear in mutation drafts.</span></div>` : ''; })()}
        <div class="callout gene">
          <strong>${ICON.gene} +${r.genes} Genetic Memory</strong>
          <span>${b.base} from DNA collected${b.survival ? ` · +${b.survival} for surviving ${run.turn} turns` : ''}${b.progress ? ` · +${b.progress} for milestones reached` : ''}${b.winBonus ? ` · +${b.winBonus} for becoming a people` : ''}${b.firstEnding ? ` · +${b.firstEnding} for a new ending in the Codex` : ''}${b.revived ? ` · ×${G.REVIVE_MULT} revived` : ''}${b.mult > 1 && !b.revived ? ` · ×${b.mult} hostility` : ''}</span>
        </div>
        ${G.meta.fossils.some((f) => f.run && f.run.turn <= run.turn && !f.amber) ? '<p class="note">This lineage left fossils at its milestones. Keep a favourite in amber from the Fossil Record to revive it later.</p>' : ''}
        <div class="row">
          <button class="btn primary" data-act="setup">New lineage</button>
          <button class="btn" data-act="go" data-arg="unlocks">Evolution Tree</button>
          <button class="btn" data-act="go" data-arg="fossils">Fossil Record</button>
        </div>
      </article>`;
  }

  function tribeEndCard(run, r) {
    const b = r.breakdown; const k = G.kind(run);
    const e = run.tribeEnding && G.TRIBE_ENDINGS[run.path][run.habitat === 'sea' ? 'sea' : 'land'][run.tribeEnding];
    return `
      <div class="scene-wrap"><canvas class="scene" aria-hidden="true"></canvas></div>
      <article class="card end ${r.victory ? 'finale' : ''}">
        <p class="eyebrow">${r.victory ? 'Tribe stage complete' : 'Your people are gone'}</p>
        <h2>${r.victory && e ? esc(e.name) : `The ${esc(k.name)} is no more`}</h2>
        <p class="event-text">${r.victory && e ? `${esc(e.desc)} ${run.leader ? `Founded under ${esc(G.leaderTitle(run.leader))}, after` : 'Founded after'} ${run.stageTurn} years and ${(run.discoveries || []).length} discoveries.${G.SOCIETY_PATHS.includes(run.path) ? '' : ` The Society stage for ${esc(G.PATH[run.path].name)} arrives in a later update.`}` : `${esc(r.cause)} Your people lasted ${run.stageTurn} years as a ${esc(k.band)}.`}${run.checkpointGenes ? ` (Your Creature ending already earned +${run.checkpointGenes} Genetic Memory.)` : ''}</p>
        <div class="callout gene">
          <strong>${ICON.gene} +${r.genes} Genetic Memory</strong>
          <span>${b.base} from Ideas${b.progress ? ` · +${b.progress} for your people's growth` : ''}${b.winBonus ? ` · +${b.winBonus} for the Founding` : ''}${b.firstEnding ? ` · +${b.firstEnding} for a new Tribe ending` : ''}${b.mult > 1 ? ` · ×${b.mult}` : ''}</span>
        </div>
        <p class="note">You can start a new run from the beginning of this ${esc(k.name)} with Stage Select, on the new lineage screen.</p>
        <div class="row">
          <button class="btn primary" data-act="setup">New lineage</button>
          <button class="btn" data-act="go" data-arg="unlocks">Evolution Tree</button>
          <button class="btn" data-act="go" data-arg="fossils">Fossil Record</button>
        </div>
      </article>`;
  }

  function modal(run) {
    if (run.phase === 'map') return '';
    return `<div class="modal-backdrop"></div><div class="modal" role="dialog" aria-modal="true">${mainPanel(run)}</div>`;
  }

  // Over the world map: notices, what happened last turn, and the time controls.
  function mapHud(run) {
    return `
      <div class="toasts">${(run.notices || []).length ? `<button class="toast" data-act="dismiss" data-arg="${run.notices.length - 1}">${esc(run.notices[run.notices.length - 1])}${run.notices.length > 1 ? ` <small>(+${run.notices.length - 1} more)</small>` : ''}</button>` : ''}</div>
      <div class="hud-bottom">
        ${run.turn <= 2 ? '<div class="ledger hint">Tap any herd to look closer.</div>' : ''}
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
    const slots = G.allSlots(run);
    return `
      <div class="stats">${G.STATS.map((s) => `<div class="stat" title="${s.name}"><span>${s.short}</span><b>${G.stat(run, s.id)}</b></div>`).join('')}</div>
      <p class="size-line"><b>${G.SIZES[G.sizeOf(run)].name}</b> (${G.sizeLabel(G.bodySize(run), run.stage)}) · ${run.stage === 'cell' ? 'colony' : run.habitat === 'sea' ? 'schools' : 'herds'} of up to ${G.maxPop(run)} · 1 Food feeds ${Math.round(G.SIZES[G.sizeOf(run)].eatDiv * G.POP_SCALE)} members (meat feeds half as many again)${G.sizeOf(run) === 'small' ? ' · each blow kills more of you' : ''}</p>
      <ul class="parts">${slots.map((slot) => {
        const locked = slot.multi && !run.multicellular;
        const s = run.parts[slot.id];
        if (locked) return `<li class="locked-slot"><span class="slot">${slot.name}</span><span class="pname muted">Opens when multicellular</span></li>`;
        if (G.offSlots(run).includes(slot.id)) return `<li class="locked-slot"><span class="slot">${slot.name}</span><span class="pname muted">Not part of your body plan (${esc(G.segmentPlan(run).name)}, ${esc(G.SYMMETRY[G.symmetry(run)].name)})</span></li>`;
        if (!s) return `<li><span class="slot">${slot.name}</span><span class="pname muted">Empty</span></li>`;
        const ids = [s.id].concat(s.merged ? [s.merged] : []);
        const mods = {};
        ids.forEach((id) => Object.entries(G.PART[id].mods).forEach(([k, v]) => { mods[k] = (mods[k] || 0) + v; }));
        return `<li><span class="slot">${slot.name}</span><span class="pname">${ids.map((id) => picon(id)).join('')}${esc(G.slotLabel(s))}${ids.filter((id) => !G.partFits(run, G.PART[id])).map((id) => `<span class="kw dormant">${esc(G.PART[id].name)} dormant: needs ${esc(G.partNeeds(G.PART[id], run.habitat).toLowerCase())}</span>`).join('')}${ids.map((id) => kwTags(G.PART[id])).join('')}</span><span class="pmods">${esc(G.describeMods(mods))}${slot.id === 'mouth' ? ` · ${G.DIET_NAMES[G.diet(run)]}` : ''}</span>${s.merged ? `<span class="pmods halves">${ids.map((id) => `${esc(G.PART[id].name)}: ${esc(G.describeMods(G.PART[id].mods) || 'no stats')}`).join(' · ')}</span>` : ''}</li>`;
      }).join('')}</ul>
      ${partnerSection(run)}
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
    // The mutations this body plan opens (and that other plans would).
    const gated = G.PARTS.filter((p) => (p.sym || p.legs || p.arms) && p.stage === run.stage && (run.stage === 'cell' || !p.habitat || p.habitat === run.habitat) && (!p.evolved || (run.knownEvos || []).includes(p.id)));
    const fits = gated.filter((p) => G.partFits(run, p));
    const opensCard = chosen ? `<div class="plan-opens"><h3>Your body plan opens</h3><p class="note">${fits.length ? fits.map((p) => `${picon(p.id)}${esc(p.name)}`).join(' · ') : 'Nothing special in this stage.'}</p>${gated.length > fits.length ? `<p class="note muted">Other body plans would open ${gated.length - fits.length} more.</p>` : ''}</div>` : '';
    if (run.stage !== 'creature') {
      return `${symCard}${opensCard}<p class="note">${Object.values(G.SYMMETRY).map((x) => `${x.name}: ${x.desc}`).map(esc).join('<br>')}</p>`;
    }
    // Skeleton, young and blood: chosen once each in the creature stage.
    const found = ['skeleton', 'young', 'blood'].map((f) => {
      const id = run.traits.find((t) => G.TRAITS[t] && G.TRAITS[t].foundation === f);
      const label = { skeleton: 'Frame', young: 'Young', blood: 'Blood' }[f];
      return id ? `<li><b>${label}</b><span><strong>${esc(G.TRAITS[id].name)}</strong> ${esc(G.TRAITS[id].desc)}${Object.keys(G.TRAITS[id].mods).length ? ` <span class="pmods">${esc(G.describeMods(G.TRAITS[id].mods))}</span>` : ''}</span></li>`
        : `<li class="muted"><b>${label}</b><span>Not yet chosen</span></li>`;
    });
    const foundCard = `<div class="plan-found"><h3>Foundations</h3><ul>${found.join('')}</ul></div>`;
    const n = G.segments(run);
    const unit = symId === 'bilateral' ? (run.habitat === 'sea' ? 'fin pairs' : 'limb pairs') : sym.unit;
    const planFor = (k) => (symId === 'radial' ? G.armPlan(k) : symId === 'colonial' ? G.podPlan(k) : G.legPlan(k, run.habitat, Math.min(G.armPairs(run), k)));
    const cur = planFor(n);
    const canDown = n > sym.min && run.dna >= G.reshapeCost(run);
    const canUp = n < sym.max && run.dna >= G.reshapeCost(run);
    const off = G.offSlots(run);
    const ladder = [];
    for (let k = sym.min; k <= sym.max; k++) {
      const pl = planFor(k);
      ladder.push(`<li class="${k === n ? 'on' : ''}"><b>${k}</b><span><strong>${esc(pl.name)}</strong> ${esc(G.describeMods(pl.mods) || 'No bonus, no cost')}</span></li>`);
    }
    return `${symCard}${opensCard}${foundCard}
      <div class="plan-now">
        <button class="btn small" ${canDown ? 'data-act="reshape" data-arg="-1"' : 'disabled'} aria-label="Fewer ${esc(unit)}">−</button>
        <div><b>${n} ${esc(unit)}</b>${cur.name !== `${n} ${unit}` ? `<span>${esc(cur.name)}</span>` : ''}</div>
        <button class="btn small" ${canUp ? 'data-act="reshape" data-arg="1"' : 'disabled'} aria-label="More ${esc(unit)}">+</button>
      </div>
      ${armsRow(run, n)}
      <p class="plan-desc">${esc(cur.desc)}${Object.keys(cur.mods).length ? ` <span class="pmods">${esc(G.describeMods(cur.mods))}</span>` : ''}</p>
      <p class="note">Each change costs ${G.reshapeCost(run)} DNA (you have ${run.dna}).${off.length ? ` This body has no use for: ${off.map((id) => esc(G.slotName(run, id))).join(', ')}. Parts there are kept but do nothing.` : ''}</p>
      <ol class="plan-ladder">${ladder.join('')}</ol>
      <p class="size-line">Size: <b>${G.SIZES[G.sizeOf(run)].name}</b> · about ${G.sizeLabel(G.bodySize(run), run.stage)}</p>`;
  }

  // On land, choose how many limb pairs are arms: a centipede could have ten arms and no legs.
  function armsRow(run, n) {
    if (run.habitat !== 'land' || G.symmetry(run) !== 'bilateral' || n < 1) return '';
    const arms = G.armPairs(run); const cost = G.reshapeCost(run);
    const canDown = arms > 0 && run.dna >= cost; const canUp = arms < n && run.dna >= cost;
    const legs = n - arms;
    return `<div class="plan-now arms">
        <button class="btn small" ${canDown ? 'data-act="arms" data-arg="-1"' : 'disabled'} aria-label="Fewer arms">−</button>
        <div><b>${arms * 2} arms</b><span>${legs ? `${legs * 2} legs` : 'no legs: crawls on its arms'}</span></div>
        <button class="btn small" ${canUp ? 'data-act="arms" data-arg="1"' : 'disabled'} aria-label="More arms">+</button>
      </div>`;
  }

  // Symbiotes can swap parts with their partner species.
  function partnerSection(run) {
    const p = G.partnerOf(run);
    if (!p) return '';
    const swaps = G.partnerSwaps(run);
    const can = run.dna >= G.GIMMICK_COST && run.phase === 'map';
    return `<h3>Your partner: the ${esc(p.name)}</h3>
      <p class="note">Swap a part: theirs comes to you, yours goes to them. ${G.GIMMICK_COST} DNA each.</p>
      ${swaps.length ? `<ul class="parts">${swaps.map(({ slot, part }) => `<li><span class="slot">${esc(G.slotName(run, slot))}</span><span class="pname">${esc(G.slotLabel(part))}</span><span class="pmods">${esc(G.describeMods(G.PART[part.id].mods))}</span><button class="btn small" ${can ? `data-act="swap" data-arg="${slot}"` : 'disabled'}>Swap</button></li>`).join('')}</ul>` : '<p class="empty">They have nothing you can use right now.</p>'}`;
  }

  function traitsTab(run) {
    const list = run.traits.map((t) => ({ name: G.TRAITS[t].name, mods: G.TRAITS[t].mods, desc: G.TRAITS[t].desc }))
      .concat(run.innovations.filter((i) => G.INNOVATION[i]).map((i) => ({ name: G.innovationName(G.INNOVATION[i], run), mods: G.INNOVATION[i].mods, desc: 'Idea' })));
    if (!list.length) return '<p class="empty">No traits yet. Events will shape who your lineage becomes.</p>';
    return `<ul class="traits">${list.map((tr) => `<li><strong>${esc(tr.name)}</strong><span>${esc(G.describeMods(tr.mods))}</span><em>${esc(tr.desc)}</em></li>`).join('')}</ul>`;
  }

  function instinctTab(run) {
    const inc = G.income(run);
    const up = G.upkeep(run);
    return `
      <div class="economy">
        <p><b>Each turn</b>: gather ${inc.total} Food (${inc.parts.map((p) => `${esc(p.label)} ${p.v >= 0 ? '+' : '−'}${Math.abs(p.v)}`).join(', ')}), eat ${up}.</p>
        <p>Spare Food raises young: each brood of about ${G.POP_SCALE} costs ${G.growthCost(run) + (G.people(run) ? G.TRIBE_CHILD_COST : 0)} Food. Your comfortable size is ${G.maxPop(run)}. You can grow past it, up to ${G.hardPop(run)}, but crowded members eat twice, broods cost more, and crowding sickness takes a tenth of the excess every turn. You can store up to ${G.foodCap(run)} Food; the rest spoils.</p>
        <p>${G.dnaWord(run)} per turn: ${G.dnaPerTurn(run)}.${run.mind ? ` Insight per turn: ${G.insightPerTurn(run)}.` : ''}</p>
      </div>
      <div class="instincts">${G.INSTINCTS.filter((ins) => !G.instinctAllowed(run, ins.id).hidden || run.instinct === ins.id).map((ins) => { const al = G.instinctAllowed(run, ins.id); return `
        <button class="choice ${run.instinct === ins.id ? 'selected' : ''}" ${al.ok ? `data-act="instinct" data-arg="${ins.id}"` : 'disabled'} aria-pressed="${run.instinct === ins.id}">
          <span class="choice-head"><strong>${esc(ins.name)}</strong></span>
          <span class="choice-desc">${esc(ins.desc)}</span>
          ${al.ok || run.instinct === ins.id ? '' : `<span class="reason">${esc(al.why)}</span>`}
        </button>`; }).join('')}</div>
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

  // Tags that mark a species' place in your story.
  function speciesTags(run, s) {
    const t = [];
    if (s.nemesis) t.push('<span class="tag bad">Nemesis</span>');
    if (s.sworn) t.push('<span class="tag good">Sworn ally</span>');
    if (s.migrant) t.push('<span class="tag">Passing through</span>');
    if (s.parent) t.push(`<span class="tag">Descended from the ${esc(s.parent)}</span>`);
    if (run.activity && run.activity.target === s.name) t.push(`<span class="tag act">${esc(G.ACTIVITY[run.activity.id].name)}</span>`);
    return t.join('');
  }

  function worldTab(run) {
    if (G.ui.speciesView != null && run.species[G.ui.speciesView]) return speciesSheet(run, G.ui.speciesView);
    const gone = run.species.filter((s) => s.extinct);
    const ages = (run.ages || []).filter((a) => a.stage === run.stage).slice().reverse();
    const season = G.season(run);
    return `${season ? `<p class="season-line"><b>${esc(season.name)}</b> · ${esc(season.desc)}</p>` : ''}
      <ul class="rivals">${run.species.map((s, i) => {
      if (s.extinct) return '';
      const st = G.speciesStatus(s);
      const pct = (s.opinion + 100) / 2;
      const niche = s.niche && G.NICHE[s.niche] ? G.NICHE[s.niche].name : G.ROLES[s.role];
      return `<li><button class="rival ${st}" data-act="species" data-arg="${i}">
        <canvas class="portrait mini" data-species="${i}"></canvas>
        <span class="rival-info">
          <span class="rival-name">${esc(s.name)}<small>${esc(niche)} · ${G.DIET_NAMES[s.diet]} · ${G.sizeLabel(s.size, run.stage)} · ${Math.round(s.pop * G.POP_SCALE)}</small></span>
          ${speciesTags(run, s) ? `<span class="tags">${speciesTags(run, s)}</span>` : ''}
          <span class="opinion"><span class="opinion-bar"><span style="left:${pct}%"></span></span><span class="status">${st[0].toUpperCase() + st.slice(1)} ${s.opinion > 0 ? '+' : ''}${s.opinion}</span></span>
        </span>
      </button></li>`;
    }).join('')}</ul>
      ${gone.length ? `<p class="note">Gone: ${gone.map((s) => `${esc(s.name)} (${s.left ? 'moved on' : 'died out'})`).join(', ')}.</p>` : ''}
      <p class="note">Tap a species to see it up close and to choose an Activity against it. Allies (+50) give +1 Food per turn. Hostile species (−50) attack you.</p>
      ${ages.length ? `<h3>World history</h3><ol class="ages">${ages.map((a, i) => `<li class="${i === 0 ? 'now' : ''} ${a.you ? 'you' : ''}"><b>${esc(a.label)}</b><span>from turn ${a.turn}${i === 0 ? ' · now' : ''}</span></li>`).join('')}</ol>` : ''}`;
  }

  // The world map: biomes you know of, linked by the routes between them. Fog hides the rest.
  function mapTab(run) {
    const here = G.biome(run);
    const list = G.biomeList(run);
    const vis = G.visibleBiomes(run).map((b) => b.id);
    const v = G.vision(run);
    const migrating = run.activity && run.activity.id === 'migrate';
    const canMigrate = G.activityState(run, 'migrate').ok && !migrating;
    const edges = [];
    list.forEach((b) => b.next.forEach((n) => {
      if (n < b.id) return;
      const o = list.find((x) => x.id === n);
      const shown = vis.includes(b.id) && vis.includes(n);
      edges.push(`<line x1="${b.x}" y1="${b.y}" x2="${o.x}" y2="${o.y}" class="route ${shown ? '' : 'fog'}" vector-effect="non-scaling-stroke"/>`);
    }));
    const nodes = list.map((b) => {
      const known = vis.includes(b.id);
      const isHere = b.id === here.id;
      const dest = migrating && run.activity.dest === b.id;
      const reachable = here.next.includes(b.id);
      return `<button class="biome-node ${known ? '' : 'fog'} ${isHere ? 'here' : ''} ${dest ? 'dest' : ''}" style="left:${b.x}%;top:${b.y}%" data-act="biome-sel" data-arg="${b.id}" ${known ? '' : 'disabled'} aria-label="${esc(known ? b.name : 'Unknown')}"><span>${known ? esc(b.name) : '?'}</span>${isHere ? '<i>You</i>' : ''}${reachable && known && !isHere && v >= 1 ? '<i class="go">→</i>' : ''}</button>`;
    }).join('');
    const sel = list.find((b) => b.id === G.ui.biomeSel && vis.includes(b.id)) || here;
    const selReach = here.next.includes(sel.id);
    let action = '';
    if (sel.id !== here.id && selReach && v >= 1) action = `<button class="btn primary small" ${canMigrate ? `data-act="act-start" data-arg="migrate" data-dest="${sel.id}"` : 'disabled'}>Migrate here (4 turns)</button>`;
    if (sel.id === here.id && here.crossing && run.stage === 'creature') { const st = G.activityState(run, 'cross'); action = `<button class="btn primary small" ${st.ok && !(run.activity && run.activity.id === 'cross') ? 'data-act="act-start" data-arg="cross"' : 'disabled'}>${run.habitat === 'land' ? 'Return to the sea' : 'Crawl onto land'} (5 turns)</button>`; }
    const visionText = run.stage === 'cell'
      ? (run.multicellular ? 'Cells cannot travel on purpose: only currents, bubbles and storms move you.' : 'Your single cells live by the vent, and nowhere else matters yet.')
      : ['You only know your own biome. Migrating takes you somewhere at random. (Reach Cunning 6 or the Spark of Mind to see further.)', 'You can see the biomes next to yours and choose where to migrate. (Keen Memory, Lone Wanderers or Symbolic Thought reveal the whole world.)', 'You know the whole world.'][v];
    return `
      <div class="world-map"><svg class="routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${edges.join('')}</svg>${nodes}</div>
      <div class="inv-detail">
        <div class="inv-head"><strong>${esc(sel.name)}${sel.id === here.id ? ' · home' : ''}</strong></div>
        <span class="inv-desc">${esc(sel.desc)}</span>
        ${sel.rule ? `<span class="inv-desc"><b>${esc(sel.rule)}</b>${sel.danger && sel.danger !== 1 ? ` (attacks ×${sel.danger})` : ''}${sel.hazards ? ` Common disasters: ${esc(sel.hazards.join(', '))}.` : ''}</span>` : ''}
        ${Object.keys(sel.mods).length ? `<span class="inv-mods">${esc(G.describeMods(sel.mods))}${G.biomeMatters(run) ? '' : ' (once you are multicellular)'}</span>` : ''}
        ${action}
        ${migrating ? `<span class="note">Migrating${run.activity.dest ? ` to the ${esc(list.find((b) => b.id === run.activity.dest).name)}` : ' somewhere new'}: ${run.activity.turns} of 4 turns.</span>` : ''}
      </div>
      <p class="note">${esc(visionText)}</p>`;
  }

  // Activities: long actions, like CK3's.
  function activitiesTab(run) {
    const act = run.activity;
    const t = G.activityTarget(run);
    let current = '<p class="empty">Your kind is not busy with anything. Pick an Activity below.</p>';
    if (act) {
      const a = G.ACTIVITY[act.id];
      let progress = '';
      if (a.turns) progress = `<span class="act-bar"><span style="width:${Math.min(100, (act.turns / a.turns) * 100)}%"></span></span><small>${act.turns} of ${a.turns} turns</small>`;
      if (act.id === 'war') progress = `<span class="war-bar"><span style="left:${(act.score + 100) / 2}%"></span></span><small>War score ${act.score > 0 ? '+' : ''}${act.score}: +100 wins, −100 loses</small>`;
      if (act.id === 'court' && t) progress = `<span class="act-bar"><span style="width:${Math.max(0, Math.min(100, ((t.opinion + 100) / 160) * 100))}%"></span></span><small>Opinion ${t.opinion} of 60 · turn ${act.turns} of 12</small>`;
      if (act.id === 'tame') progress = `<span class="act-bar"><span style="width:${Math.min(100, (act.score / 3) * 100)}%"></span></span><small>Trust ${act.score} of 3 · turn ${act.turns} of 10</small>`;
      if (act.id === 'avoid' || act.id === 'hunt') progress = `<small>${act.turns} turn${act.turns === 1 ? '' : 's'} so far · until you stop</small>`;
      current = `<div class="act-current"><strong>${esc(a.name)}${t ? `: the ${esc(t.name)}` : ''}</strong>${progress}<button class="btn small ghost" data-act="act-stop">Stop</button></div>`;
    }
    const alive = run.species.filter((s) => !s.extinct);
    // This stage's own Activities come first.
    const list = G.ACTIVITIES.filter((a) => !G.activityState(run, a.id).hidden).sort((a, b) => (b.stage === run.stage) - (a.stage === run.stage)).map((a) => {
      const picking = G.ui.actPick === a.id;
      const plain = !a.target && G.activityState(run, a.id).ok;
      return `<div class="act-card ${picking ? 'open' : ''}">
        <div class="act-head"><strong>${esc(a.name)}</strong>${a.target
          ? `<button class="btn small" data-act="act-pick" data-arg="${picking ? '' : a.id}">${picking ? 'Cancel' : 'Choose a species'}</button>`
          : `<button class="btn small primary" ${plain ? `data-act="act-start" data-arg="${a.id}"` : 'disabled'}>Start</button>`}</div>
        <p class="note">${esc(a.desc)}</p>
        ${!a.target && !plain ? `<span class="reason">${esc(G.activityState(run, a.id).why)}</span>` : ''}
        ${picking ? `<div class="chips">${alive.map((s) => { const st2 = G.activityState(run, a.id, s.name); return `<button class="chip" ${st2.ok ? `data-act="act-start" data-arg="${a.id}" data-target="${esc(s.name)}"` : 'disabled'} title="${esc(st2.ok ? s.name : st2.why)}">${esc(s.name)}</button>`; }).join('')}</div>` : ''}
      </div>`;
    }).join('');
    return `<h3>Now</h3>${current}<h3>Activities</h3><p class="note">One at a time. Starting a new one ends the old one. Each plays out over several turns, with its own events.</p>${list}`;
  }

  // How this species is tied to you by your archetype's gimmick.
  function speciesBond(run, s) {
    const tags = [];
    if (s.name === run.partner && G.gimmick(run) === 'symbiote') tags.push('Your partner: you share a sixth of its stats');
    if (s.name === run.host && G.gimmick(run) === 'parasite') tags.push('Your host: you live inside it');
    if (s.bud) tags.push('Split off from your colony');
    if (s.name === run.mimic && G.gimmick(run) === 'mimic') tags.push('You are disguised as one of them');
    return tags.length ? `<p class="bond">${tags.map(esc).join(' · ')}</p>` : '';
  }
  function speciesActions(run, s) {
    if (s.extinct || run.phase !== 'map') return '';
    const g = G.gimmick(run);
    const can = run.dna >= G.GIMMICK_COST;
    const btn = (act, label, arg) => `<button class="btn small ${can ? 'primary' : ''}" ${can ? `data-act="${act}" data-arg="${esc(arg || '')}"` : 'disabled'}>${label} (${G.GIMMICK_COST} DNA)</button>`;
    let out = '';
    if (g === 'parasite') out = s.name === run.host ? btn('steal', 'Steal one of its parts') : btn('jump', 'Jump into it as your new host', s.name);
    if (g === 'mimic' && s.name !== run.mimic) out = btn('mimic', 'Mimic them', s.name);
    return out ? `<div class="row tight gimmick-actions">${out}</div>` : '';
  }

  function speciesPlan(s) {
    if (s.stage !== 'creature') return '';
    const sym = s.symmetry || 'bilateral'; const n = s.segments != null ? s.segments : 2;
    const pl = sym === 'radial' ? G.armPlan(n) : sym === 'colonial' ? G.podPlan(n) : G.legPlan(n, s.world);
    const found = [{ inner: 'inner skeleton', shell: 'outer shell', soft: 'soft body' }[s.skeleton], { live: 'live young', eggs: 'lays eggs', budding: 'buds' }[s.young], s.blood && `${s.blood} blood`].filter(Boolean);
    return ` · ${G.SYMMETRY[sym].name}, ${pl.name.toLowerCase()}${found.length ? ` · ${found.join(', ')}` : ''}`;
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
        <div><h2>The ${esc(s.name)}</h2><p class="note">${G.ROLES[s.role]} · ${G.DIET_NAMES[s.diet]} · ${s.size >= 2 ? 'Giant, ' : s.size < 0.6 ? 'Tiny, ' : ''}${G.sizeLabel(s.size, run.stage)}${speciesPlan(s)} · ${s.extinct ? 'Extinct' : `Population ${Math.round(s.pop * G.POP_SCALE)}`}</p></div>
      </div>
      ${speciesBond(run, s)}
      <p>${esc(roleText)} ${esc(attitude)}</p>
      ${speciesActions(run, s)}
      ${!s.extinct && run.phase !== 'end' ? `<div class="row tight">${['war', 'court', 'avoid', 'hunt'].map((id) => { const st2 = G.activityState(run, id, s.name); const on = run.activity && run.activity.id === id && run.activity.target === s.name; return `<button class="btn small ${on ? 'primary' : ''}" ${st2.ok && !on ? `data-act="act-start" data-arg="${id}" data-target="${esc(s.name)}"` : 'disabled'} title="${esc(st2.ok ? G.ACTIVITY[id].desc : st2.why)}">${on ? '✓ ' : ''}${esc(G.ACTIVITY[id].name)}</button>`; }).join('')}</div>` : ''}
      ${speciesTags(run, s) ? `<p class="tags">${speciesTags(run, s)}</p>` : ''}
      <div class="opinion big"><span class="opinion-bar"><span style="left:${(s.opinion + 100) / 2}%"></span></span><span class="status">${st[0].toUpperCase() + st.slice(1)} ${s.opinion > 0 ? '+' : ''}${s.opinion}</span></div>
      ${s.history && Object.keys(s.history).length ? `<p class="note kin-memory"><b>They remember:</b> your lineage ${esc(listJoin(Object.entries(s.history).map(([k, n]) => `${G.KIND_MEMORY[k] || k} them${n > 1 ? ` ${n} times` : ''}`.replace('were attacked by them', 'was attacked by them'))))}.${s.band && s.from ? ` (Their ancestors, the ${esc(s.from)}, remembered it too.)` : ''}</p>` : ''}
      <h3>Compared with you</h3>
      <div class="compare">${G.STATS.map((k) => {
        // Their evolved stats: what you are really up against (Fair Fights).
        const them = G.foeStat(run, s, k.id); const you = G.stat(run, k.id);
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
    const tribe = G.people(run);
    const tabs = run.stage === 'colonial'
      ? [['society', 'Realm'], ['council', 'Council'], ['crown', 'Crown'], ['book', 'Book'], ['reason', 'Reason'], ['laws', 'Law'], ['found', 'Lore'], ['body', 'Body'], ['traits', 'Traits'], ['instinct', 'Instinct'], ['acts', 'Activities'], ['world', 'World'], ['map', 'Map'], ['log', 'Chronicle']]
      : run.stage === 'renaissance'
      ? [['society', 'Nation'], ['council', 'Council'], ['reason', 'Reason'], ['book', 'Book'], ['laws', 'Law'], ['found', 'Lore'], ['body', 'Body'], ['traits', 'Traits'], ['instinct', 'Instinct'], ['acts', 'Activities'], ['world', 'World'], ['map', 'Map'], ['log', 'Chronicle']]
      : run.stage === 'society'
      ? [['society', 'Society'], ['council', 'Council'], ['laws', 'Law'], ['book', 'Book'], ['found', 'Lore'], ['body', 'Body'], ['traits', 'Traits'], ['instinct', 'Instinct'], ['acts', 'Activities'], ['world', 'World'], ['map', 'Map'], ['log', 'Chronicle']]
      : tribe
      ? [['people', 'People'], ['found', 'Lore'], ['book', 'Book'], ['body', 'Body'], ['traits', 'Traits'], ['instinct', 'Instinct'], ['acts', 'Activities'], ['world', 'World'], ['map', 'Map'], ['log', 'Chronicle']]
      : [['body', 'Body'], ['plan', 'Body plan'], ...(run.stage === 'creature' ? [['look', 'Look']] : []), ['traits', 'Traits'], ['instinct', 'Instinct'], ['acts', 'Activities'], ['world', 'World'], ['map', 'Map'], ...(run.mind ? [['mind', 'Mind']] : []), ...(run.stage !== 'cell' ? [['book', 'Book']] : []), ['log', 'Chronicle']];
    const panels = { body: bodyTab, plan: planTab, look: lookTab, traits: traitsTab, instinct: instinctTab, acts: activitiesTab, world: worldTab, map: mapTab, mind: (r) => `<p class="note">Insight: ${r.insight} (${G.insightPerTurn(r)} per turn)</p>${mindTree(r)}`, log: chronicleTab, people: peopleTab, found: discoveriesTab, society: societyTab, council: councilTab, laws: traditionsTab, reason: reasonTab, crown: crownTab, book: bookTab };
    const panel = (tabs.some(([id]) => id === tab) ? panels[tab] : panels[tabs[0][0]])(run);
    const arch = G.ARCHETYPE[run.archetype];
    const where = run.stage === 'cell' ? 'Primordial sea' : run.habitat === 'sea' ? 'Open sea' : 'Land';
    return `
      <div class="sheet-backdrop" data-act="close-sheet"></div>
      <aside class="sheet" role="dialog" aria-modal="true" aria-label="Your lineage">
        <header class="sheet-head">
          <button class="portrait-zoom" data-act="view" data-arg="you" aria-label="See your creature full screen"><canvas class="portrait big"></canvas><i>${ICON.expand}</i></button>
          <div><h2>${run.stage === 'colonial' ? esc(G.realmName(run)) : run.stage === 'renaissance' ? esc(G.nationName(run)) : run.stage === 'society' ? `The ${esc(G.socKind(run).name)}` : tribe ? `The ${esc(G.kind(run).name)}` : `${esc(arch.name)} lineage`}</h2><p class="note">${run.daily ? `📅 Daily run · ` : ''}${run.lineage ? `${esc(run.lineage.name)} · ` : ''}${dietBadge(run)} ${where} · ${esc(G.ORIGIN[run.origin].name)}${(run.complications || []).length ? `<br><span class="muted">Complications: ${run.complications.map((id) => esc((G.COMPLICATION[id] || {}).name || id)).join(', ')}</span>` : ''}</p></div>
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
  // A chip group for one appearance option list (locked options show why).
  function lookGroup(run, key, title) {
    const L = G.effectiveLook(run);
    const list = G.APPEARANCE[key].filter((o) => !o.only || o.only === run.habitat);
    const locked = list.filter((o) => !G.lookOptionState(run, o).ok);
    return `
      <div class="look-group"><h3>${title}</h3><div class="chips">${list.map((o) => {
        const st = G.lookOptionState(run, o);
        const on = L[key] === o.id;
        return `<button class="chip ${on ? 'on' : ''}" ${st.ok ? `data-act="look" data-kind="${key}" data-arg="${o.id}"` : 'disabled'} aria-pressed="${on}" title="${esc(st.ok ? o.name : o.why)}">${esc(o.name)}${st.ok ? '' : ' 🔒'}</button>`;
      }).join('')}</div>${locked.length ? `<p class="note">${esc(locked.map((o) => `${o.name}: ${o.why}`).join(' · '))}</p>` : ''}</div>`;
  }
  // A slider for one sculpt value.
  function sculptSlider(run, sl) {
    const L = G.effectiveLook(run);
    const v = L[sl.id] != null ? L[sl.id] : sl.def;
    const max = G.sculptMax(run, sl);
    const shown = sl.step >= 1 ? v : `${Math.round(v * 100)}%`;
    return `<div class="sculpt"><label for="sc-${sl.id}"><span>${esc(sl.name)}</span><output data-out="${sl.id}">${sl.ends ? '' : shown}</output></label>
      <input id="sc-${sl.id}" type="range" min="${sl.min}" max="${max}" step="${sl.step}" value="${Math.min(v, max)}" data-look="${sl.id}">
      ${sl.ends ? `<div class="ends"><span>${esc(sl.ends[0])}</span><span>${esc(sl.ends[1])}</span></div>` : ''}
      ${max < sl.max ? `<p class="note">${esc(sl.capWhy)}</p>` : ''}</div>`;
  }
  function hueSlider(run, key, title, def) {
    const v = run.look && run.look[key] != null ? run.look[key] : def;
    return `<div class="look-group"><h3>${title}</h3><input type="range" min="0" max="359" value="${v}" data-look="${key}" style="--h:${v}" class="hue-slider" aria-label="${title}"></div>`;
  }

  // The Look tab: a preview and the way into the Creature Editor.
  function lookTab(run) {
    const can = run.phase === 'map';
    return `
      <div class="look-preview"><canvas class="portrait huge"></canvas></div>
      <button class="btn primary wide" ${can ? 'data-act="editor-open"' : 'disabled'}>Open the Creature Editor</button>
      <p class="note">Change your body's proportions, limbs, head, colors and patterns as often as you like, for free. Looks never change your stats. How many legs and arms you have is part of your Body plan.</p>`;
  }

  // The Creature Editor: a live preview, with tabs and sliders that fit the kind of body you have.
  function editor(run) {
    if (!G.ui.editor || !run || run.stage !== 'creature') return '';
    const kind = G.editorBody(run);
    const sea = run.habitat === 'sea';
    const labelKey = kind === 'radial' && sea ? 'radialSea' : kind;
    const sliders = (group) => G.SCULPT.filter((sl) => sl.group === group && sl.bodies.includes(kind) && (!sl.part || G.hasVisiblePart(run, sl.part)))
      .map((sl) => sculptSlider(run, { ...sl, name: (sl.labels && (sl.labels[labelKey] || sl.labels[kind])) || sl.name, ends: (sl.endsBy && sl.endsBy[kind]) || sl.ends })).join('');
    const hue = G.bodyOf(run).hue;
    const panels = {
      body: () => `${kind === 'land' || kind === 'sea' ? lookGroup(run, 'shape', 'Body shape') : ''}${sliders('body')}${kind === 'colonial' ? sliders('limbs') : ''}`,
      limbs: () => `${sliders('limbs')}${kind === 'sea' ? lookGroup(run, 'fins', 'Fins') : ''}`,
      head: () => `${lookGroup(run, 'head', 'Head shape')}${kind === 'land' ? lookGroup(run, 'headPos', 'Head position') : ''}${sliders('head')}${lookGroup(run, 'eyes', 'Eye style')}`,
      color: () => `${hueSlider(run, 'hue', 'Body color', hue)}${hueSlider(run, 'belly', 'Belly color', hue)}${hueSlider(run, 'accent', 'Pattern color', (hue + 40) % 360)}${hueSlider(run, 'accent2', 'Second pattern color', (hue + 70) % 360)}${lookGroup(run, 'pattern', 'Pattern')}${sliders('color')}${lookGroup(run, 'finish', 'Finish')}`,
    };
    const TABS = {
      land: [['body', 'Body'], ['limbs', 'Limbs'], ['head', 'Head'], ['color', 'Colors']],
      sea: [['body', 'Body'], ['limbs', 'Fins'], ['head', 'Head'], ['color', 'Colors']],
      serpent: [['body', 'Body'], ['head', 'Head'], ['color', 'Colors']],
      radial: [['body', sea ? 'Bell' : 'Disc'], ['limbs', sea ? 'Tentacles' : 'Arms'], ['color', 'Colors']],
      colonial: [['body', 'Body'], ['color', 'Colors']],
    };
    const tabs = TABS[kind];
    const tab = tabs.some(([id]) => id === G.ui.editorTab) ? G.ui.editorTab : 'body';
    return `<div class="editor" role="dialog" aria-modal="true" aria-label="Creature Editor">
      <header class="editor-head"><h2>Creature Editor</h2><button class="btn small" data-act="editor-random" data-arg="all" aria-label="Randomise everything">🎲 All</button><button class="btn small primary" data-act="editor-done">Done</button></header>
      <div class="editor-preview"><canvas class="editor-canvas"></canvas></div>
      <div class="tabs" role="tablist">${tabs.map(([id, label]) => `<button role="tab" class="tab ${id === tab ? 'on' : ''}" aria-selected="${id === tab}" data-act="editor-tab" data-arg="${id}">${label}</button>`).join('')}</div>
      <div class="editor-body"><button class="btn small ghost dice" data-act="editor-random" data-arg="${tab}">🎲 Randomise ${esc(tabs.find(([id]) => id === tab)[1].toLowerCase())}</button>${panels[tab]()}<p class="note">Looks never change your stats. Some options open as your creature grows.</p></div>
      <div class="editor-foot"><button class="btn primary wide" data-act="editor-done">Done</button></div>
    </div>`;
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
        <div id="editor"></div>
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

    return `
      <main class="shop">
        <header class="screen-head"><button class="btn ghost" data-act="go" data-arg="title">Back</button><h1>Evolution</h1><span class="gene-count big">${ICON.gene} ${m.genes}</span></header>
        <p class="note">Genetic Memory is earned from every lineage, even ones that go extinct. Spend it on the Evolution Tree to make every later run stronger and get further.</p>
        <section><h2>Evolution Tree</h2>${evolutionTree()}</section>
        <section><h2>Ancestral Wisdom</h2>${wisdomSection()}</section>
        <section><h2>Heritage</h2>${heritageSection()}</section>
        <section><h2>Patronage</h2>${patronageSection()}</section>
        <section><h2>Charters</h2>${chartersSection()}</section>
        <section><h2>Gene Affinities</h2>${affinitySection()}</section>
        <section><h2>Archetypes</h2><ul class="shop-list">${G.ARCHETYPES.filter((a) => a.cost).map((a) => item('archetypes', a)).join('')}</ul></section>
        <section><h2>Home worlds</h2><ul class="shop-list">${G.ORIGINS.filter((o) => o.cost).map((o) => item('origins', o)).join('')}</ul></section>
        <section><h2>Mutation packs</h2><ul class="shop-list">${G.PACKS.map((p) => item('packs', p)).join('')}</ul></section>
        <section class="reset">${G.ui.confirmReset
          ? '<span>Erase all progress, unlocks and the current lineage?</span><button class="btn small danger" data-act="reset-yes">Erase everything</button><button class="btn small ghost" data-act="reset-no">Cancel</button>'
          : '<button class="btn small ghost" data-act="reset">Reset all progress</button>'}</section>
      </main>`;
  }

  // Gene Affinities: make a favourite family of mutations more common in drafts.
  function affinitySection() {
    const m = G.meta;
    if (!G.affinityOpen()) return '<p class="note">Opens after your first lineage becomes a people. Then you can make the mutations you love (wings, venom, armor and more) turn up more often.</p>';
    return `<p class="note">Each level makes that family of mutations turn up more often in drafts (×2, ×3, ×4).</p><ul class="shop-list">${G.AFFINITIES.map((a) => {
      const lvl = G.affinityLevel(a.id); const cost = G.AFFINITY_COSTS[lvl];
      const afford = cost != null && m.genes >= cost;
      return `<li class="shop-item ${cost == null ? 'owned' : ''}"><div><strong>${esc(a.name)} ${'●'.repeat(lvl)}${'○'.repeat(G.AFFINITY_COSTS.length - lvl)}</strong><p>${esc(a.desc)}</p></div>
        ${cost == null ? '<span class="owned-tag">Max</span>' : `<button class="btn small ${afford ? 'primary' : ''}" ${afford ? `data-act="affinity" data-arg="${a.id}"` : 'disabled'}>${ICON.gene} ${cost}</button>`}</li>`;
    }).join('')}</ul>`;
  }

  // The Evolution Tree, drawn like the Mind tree.
  function evolutionTree() { return skillTree(G.BOONS, G.ui.treeSel, 'tree-sel', ''); }
  // Ancestral Wisdom: the Tribe stage's tree, built the same way.
  function heritageSection() {
    if (!G.heritageOpen()) return '<p class="note">Opens once one of your lineages becomes a Society. Its upgrades only work in the Society stage.</p>';
    return `<p class="note">Upgrades for the Society stage: reach deeper into the Law tree and unite your region more easily.</p>${skillTree(G.HERITAGE, G.ui.herSel, 'her-sel', '')}`;
  }
  function wisdomSection() {
    if (!G.wisdomOpen()) return '<p class="note">Opens once one of your lineages becomes a people (reaches the Tribe stage). Its upgrades only work in the Tribe stage.</p>';
    return `<p class="note">Upgrades for the Tribe stage. A people's first Tribe is hard; these make every later one easier.</p>${skillTree(G.WISDOM, G.ui.wisSel, 'wis-sel', '')}`;
  }
  // Upgrades that give a stage its starting bonus can't reach back into a stage that has already begun.
  const START_BONUS = { tribe: ['w_stories', 'w_keepers', 'w_ways', 'w_deeds', 'w_choosing', 'w_long'], society: ['h_records', 'h_cities', 'h_faith', 'h_council', 'h_envoys'], renaissance: ['p_libraries', 'p_wealth', 'p_masters', 'p_envoys'] };
  function startNote(b) {
    const run = G.run; if (!run || run.phase === 'end') return '';
    const stage = Object.keys(START_BONUS).find((k) => START_BONUS[k].includes(b.id));
    if (!stage || run.stage !== stage) return '';
    return `<span class="note">Your current ${esc(G.STAGES[stage].name.replace(/ Stage$/, ''))} has already begun: this works from the next one.</span>`;
  }
  function skillTree(LIST, selId, act, extra) {
    const m = G.meta;
    const sel = G.BOON[selId] && LIST.includes(G.BOON[selId]) ? G.BOON[selId] : (LIST.find((b) => G.boonOpen(b) && G.boonCost(b) != null) || LIST[0]);
    const tiers = Math.max(...LIST.map((b) => b.tier));
    const state = (b) => {
      const lvl = G.boonLevel(b.id);
      if (G.boonCost(b) == null) return 'done';
      if (!G.boonOpen(b)) return 'locked';
      return (lvl ? 'current' : 'open') + (G.boonCost(b) > m.genes ? ' cant' : '');
    };
    const X = (b) => 9 + b.col * 16.4;
    const Y = (b) => (tiers > 2 ? 11 + (b.tier - 1) * 26 : 22 + (b.tier - 1) * 56);
    const edges = [];
    LIST.forEach((b) => (b.req || []).forEach((rid) => {
      const par = G.BOON[rid];
      const cls = G.boonLevel(par.id) && G.boonLevel(b.id) ? 'done' : G.boonLevel(par.id) ? 'lit' : 'dim';
      edges.push(`<path class="edge ${cls}" d="M${X(par)} ${Y(par) + 5} C ${X(par)} ${Y(par) + 15}, ${X(b)} ${Y(b) - 15}, ${X(b)} ${Y(b) - 5}" vector-effect="non-scaling-stroke"/>`);
    }));
    const icon = { done: '✓', current: '', open: '', locked: '🔒' };
    const st = state(sel);
    const lvl = G.boonLevel(sel.id);
    const cost = G.boonCost(sel);
    const afford = cost != null && m.genes >= cost && G.boonOpen(sel);
    return `
      <div class="skill-tree evo-tree ${extra}">
        <svg class="edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${edges.join('')}</svg>
        ${LIST.map((b) => {
          const s2 = state(b); const l2 = G.boonLevel(b.id);
          return `<button class="node ${s2} ${sel.id === b.id ? 'sel' : ''} ${b.twin ? 'twin' : ''}" style="left:${X(b)}%;top:${Y(b)}%" data-act="${act}" data-arg="${b.id}" aria-pressed="${sel.id === b.id}" aria-label="${esc(b.name)}">${nodeName(b.name)}${b.costs.length > 1 && l2 ? `<i aria-hidden="true">${l2}/${b.costs.length}</i>` : icon[s2] ? `<i aria-hidden="true">${icon[s2]}</i>` : ''}</button>`;
        }).join('')}
      </div>
      <div class="inv-detail">
        <div class="inv-head"><strong>${esc(sel.name)}${sel.costs.length > 1 ? ` · level ${lvl}/${sel.costs.length}` : ''}</strong>${cost != null ? `<span>${ICON.gene} ${cost}</span>` : ''}</div>
        <span class="inv-desc">${esc(sel.desc)}</span>
        ${startNote(sel)}
        ${sel.twin ? '<span class="inv-mods">Twin socket: this slot can hold a second part, which merges and evolves on its own.</span>' : ''}
        ${st === 'locked' ? `<span class="reason">Needs ${esc((sel.req || []).map((id) => G.BOON[id].name).join(' and '))} first</span>` : ''}
        ${st === 'done' ? '<span class="note good-text">Fully evolved</span>' : `<button class="btn primary small" ${afford ? `data-act="buy" data-kind="boon" data-arg="${sel.id}"` : 'disabled'}>${lvl ? 'Upgrade' : 'Evolve'} (${ICON.gene} ${cost})</button>`}
      </div>`;
  }

  // ---------- Options (Patch 20.2) ----------
  function optionsScreen() {
    const o = G.meta.options;
    const toggle = (key, on, title, desc) => `<button class="choice opt-toggle ${on ? 'on' : ''}" data-act="opt" data-arg="${key}" aria-pressed="${on}"><span class="choice-head"><strong>${esc(title)}</strong><span class="switch" aria-hidden="true"><i></i></span></span><span class="choice-desc">${esc(desc)}</span></button>`;
    return `
      <main class="screen options-screen">
        <header class="screen-head"><button class="btn ghost" data-act="go" data-arg="title">Back</button><h1>Options</h1></header>
        <section><h2>Information</h2><div class="choices">
          ${toggle('numbers', o.numbers, 'Detailed numbers', 'Show exact odds as percentages, your stat against theirs, and what each mutation would change in every slot. Off: odds are shown in words, like "Likely".')}
          ${toggle('tips', !G.meta.tipsOff, 'Tips', 'Short tips the first time you meet something new.')}
          ${toggle('guide', G.meta.guide.on, 'Guide', 'A guide that walks you through your first lineage, one thing at a time.')}
        </div><div class="row tight">${G.meta.tips.length ? '<button class="btn small ghost" data-act="tips-reset">Show all tips again</button>' : ''}<button class="btn small ghost" data-act="guide-replay">Replay the guide from the start</button></div></section>
        <section><h2>Colours</h2><div class="theme-row">${Object.entries(G.THEMES).map(([id, name]) => `<button class="theme-swatch ${o.theme === id ? 'on' : ''}" data-theme-swatch="${id}" data-act="opt-theme" data-arg="${id}" aria-pressed="${o.theme === id}"><span></span>${esc(name)}</button>`).join('')}</div></section>
        <section><h2>Sound</h2><div class="choices">
          ${toggle('sound', o.sound !== false, 'Sound', 'Sounds of each place, soft music, and effects for events, mutations and endings. On an iPhone it follows the silent switch.')}
        </div>${o.sound !== false ? `<div class="vol-row"><label for="vol-sfx">Effects</label><input id="vol-sfx" type="range" min="0" max="1" step="0.05" value="${o.sfxVol != null ? o.sfxVol : 0.7}" data-vol="sfxVol"></div>
          <div class="vol-row"><label for="vol-amb">Ambience and music</label><input id="vol-amb" type="range" min="0" max="1" step="0.05" value="${o.ambVol != null ? o.ambVol : 0.5}" data-vol="ambVol"></div>` : ''}</section>
        ${complicationsSection(toggle)}
        ${saveSection()}
      </main>`;
  }
  // Complications: optional rules for new lineages, each worth more Genetic Memory.
  function complicationsSection(toggle) {
    const on = G.chosenComplications();
    const pct = Math.round(G.compBonus(on) * 100);
    return `<section><h2>Complications</h2>
      <p class="note">Optional rules that make every <b>new</b> lineage harder, for more Genetic Memory. The lineage you are playing keeps the rules it began with.${on.length ? ` Now: <b>+${pct}% Genetic Memory</b>.` : ''}</p>
      <div class="choices">${G.COMPLICATIONS.map((c) => toggle(`comp:${c.id}`, on.includes(c.id), `${c.name} (+${Math.round(c.bonus * 100)}%)`, c.desc)).join('')}</div>
    </section>`;
  }
  // Move a save between Safari and the home-screen app (or another device): copy a code here, paste it there.
  // The code is made when Options opens, so the Copy tap can put it on the clipboard straight away (iPhones only
  // allow copying during the tap itself).
  function prepareSaveCode() {
    G.ui.saveCode = null; G.ui.titleCopied = false;
    G.exportSave().then((c) => { G.ui.saveCode = c; if (G.ui.screen === 'options' || G.ui.screen === 'title') render(); });
  }
  function saveSection() {
    const u = G.ui.saveMove || {};
    const code = G.ui.saveCode;
    const size = code ? `${Math.max(1, Math.round(code.length / 1000))}k letters` : '';
    return `<section class="save-move"><h2>Move your save</h2>
      <p class="note">On an iPhone, Safari and the home-screen app keep separate saves. To move your progress: tap <b>Copy save code</b> here, open the other one, go to Options, and tap <b>Paste from clipboard</b>.</p>
      <div class="row tight wrap">
        <button class="btn small primary" ${code ? 'data-act="save-copy"' : 'disabled'}>${!code ? 'Preparing…' : u.copied ? 'Copied ✓' : 'Copy save code'}</button>
        <button class="btn small" data-act="save-paste-clip">Paste from clipboard</button>
      </div>
      ${u.copied ? `<p class="note good-text">Your save code is on the clipboard (${size}, starting with ${esc(code.slice(0, 11))}).</p>` : ''}
      ${u.show ? `<textarea class="save-code" id="save-out" rows="4" aria-label="Your save code">${esc(code || '')}</textarea><p class="note">Copying did not work here. Tap the box, choose Select All, then Copy.</p>` : ''}
      ${u.paste ? `<textarea class="save-code" id="save-paste" rows="4" placeholder="Paste the save code here" aria-label="Save code to load"></textarea>
        <p class="note warn-text">Loading a save replaces all progress here, including the lineage you are playing.</p>
        <div class="row tight wrap"><button class="btn small danger" data-act="save-load">Replace my progress with this save</button><button class="btn small ghost" data-act="save-paste-close">Cancel</button></div>` : ''}
      ${u.error ? `<p class="note bad-text">${esc(u.error)}</p>` : ''}
      <p class="note">${G.meta.lastBackupAt ? `Last backup: ${ago(G.meta.lastBackupAt)}.` : 'No backup made yet.'} ${G.persisted ? 'This device has agreed to keep your save.' : standalone() ? '' : isIOS() && hosted() ? '<b>In Safari your save can be deleted after 7 days of Safari use without opening the game. The Home Screen app keeps its save.</b>' : ''}</p>
      ${G.previousSave() ? `<p class="note">You loaded a save on ${esc(new Date(G.previousSave().at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }))}. <button class="btn small ghost" data-act="save-undo">Undo it: go back to the progress you had before</button></p>` : ''}
      <details class="save-more"><summary>Other ways</summary>
        <div class="row tight wrap"><button class="btn small ghost" data-act="save-paste-open">Paste by hand</button><button class="btn small ghost" ${code ? 'data-act="save-download"' : 'disabled'}>Save as a file</button><label class="btn small ghost file-btn">Load a file<input type="file" accept=".txt,text/plain" data-save-file hidden></label></div>
        <p class="note">A save file is also a backup. On an iPhone, "Save as a file" opens the Share menu: choose Save to Files.</p>
      </details>
    </section>`;
  }
  // Show the paste box with this text in it, ready to confirm.
  function showPasted(text, error) {
    G.ui.saveMove = { paste: true, error: error || null };
    render();
    const t = app.querySelector('#save-paste');
    if (t) t.value = text || '';
  }
  function loadSaveCode(code) {
    G.importSave(code).then((err) => { if (err) showPasted(code, err); else location.reload(); });
  }
  G.applyTheme = () => { document.documentElement.dataset.theme = (G.meta && G.meta.options && G.meta.options.theme) || 'tide'; };
  G.applyTheme();

  // ---------- Fossil Record ----------
  // Fossils are grouped by lineage. Each lineage has a name you can change; each fossil is one save point you can
  // keep in amber, revive from, or delete.
  function fossilScreen() {
    const m = G.meta;
    const amberCount = m.fossils.filter((f) => f.amber).length;
    const slots = G.amberSlots();
    const full = amberCount >= slots;
    const when = (t) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    const archName = (id) => (G.ARCHETYPE[id] ? G.ARCHETYPE[id].name : 'Unknown');
    const detailOf = (f) => f.detail != null ? f.detail : f.run ? G.fossilDetail(f.run) : '';
    const fossil = (f) => {
      const cost = G.reviveCost(f);
      const del = G.ui.confirmDel === f.id;
      return `<li class="fossil ${f.amber ? 'amber' : ''}">
        <canvas class="portrait" data-fossil="${f.id}"></canvas>
        <div class="fossil-info">
          <strong>${f.amber ? '<span class="amber-tag">In amber</span> ' : ''}${esc(f.label)}</strong>
          ${detailOf(f) ? `<span>${esc(detailOf(f))}</span>` : ''}
          <span>Turn ${f.turn} · ${when(f.date)}</span>
          <div class="row tight wrap">
            ${f.amber
              ? `<button class="btn small primary" ${m.genes >= cost ? `data-act="revive" data-arg="${f.id}"` : 'disabled'}>Continue from here (${ICON.gene} ${cost})</button><button class="btn small ghost" data-act="amber-off" data-arg="${f.id}">Release</button>`
              : `<button class="btn small" ${full ? 'disabled' : `data-act="amber-on" data-arg="${f.id}"`}>${full ? 'Amber full' : 'Keep in amber'}</button>`}
            ${del
              ? `<button class="btn small danger" data-act="fossil-del-yes" data-arg="${f.id}">Delete for good</button><button class="btn small ghost" data-act="fossil-del-no">Cancel</button>`
              : `<button class="btn small ghost" data-act="fossil-del" data-arg="${f.id}">Delete</button>`}
          </div>
        </div>
      </li>`;
    };
    // Group by lineage, newest lineage first; within a lineage, the furthest point comes first.
    const groups = [];
    m.fossils.forEach((f) => {
      const id = (f.lineage && f.lineage.id) || f.id;
      let g = groups.find((x) => x.id === id);
      if (!g) { g = { id, name: (f.lineage && f.lineage.name) || `${archName(f.archetype)} lineage`, archetype: f.archetype, origin: f.origin, list: [] }; groups.push(g); }
      g.list.push(f);
    });
    groups.forEach((g) => g.list.sort((a, b) => b.turn - a.turn || b.date - a.date));
    const live = G.run && G.run.phase !== 'end';
    const liveId = live && G.run.lineage ? G.run.lineage.id : null;
    const head = (g) => G.ui.renaming === g.id
      ? `<form class="rename-row" data-form="rename" data-arg="${esc(g.id)}"><input id="rename-input" type="text" maxlength="${G.LINEAGE_NAME_MAX}" value="${esc(g.name)}" aria-label="Lineage name" autocomplete="off"><button class="btn small primary" type="submit">Save</button><button class="btn small ghost" type="button" data-act="rename-cancel">Cancel</button></form>`
      : `<div class="lineage-head"><h3>${esc(g.name)}${g.id === liveId ? ' <small class="live-tag">playing now</small>' : ''}</h3><button class="btn small ghost" data-act="rename-start" data-arg="${esc(g.id)}">Rename</button></div>`;
    const group = (g) => `
      <section class="lineage-card">
        ${head(g)}
        <p class="note">${esc(archName(g.archetype))}${G.ORIGIN[g.origin] ? ` · ${esc(G.ORIGIN[g.origin].name)}` : ''} · ${g.list.length} fossil${g.list.length === 1 ? '' : 's'}</p>
        <ul class="fossil-list">${g.list.map(fossil).join('')}</ul>
      </section>`;
    const hist = (h, i) => `<li class="fossil ${h.victory ? 'won' : ''}">
        <canvas class="portrait" data-history="${i}"></canvas>
        <div class="fossil-info">
          <strong>${esc(h.lineage && h.lineage.name ? h.lineage.name : `${archName(h.archetype)} lineage`)}${h.revived ? ' (revived)' : ''}</strong>
          <span>${esc(archName(h.archetype))} · Reached: ${esc(h.reached)} · ${h.turns} turn${h.turns === 1 ? '' : 's'} · ${when(h.date)}</span>
          <span class="${h.victory ? 'good-text' : 'muted'}">${esc(h.cause)} · +${h.genes} Genetic Memory</span>
        </div>
      </li>`;
    return `
      <main class="shop">
        <header class="screen-head"><button class="btn ghost" data-act="go" data-arg="title">Back</button><h1>Fossil Record</h1><span class="gene-count big">${ICON.gene} ${m.genes}</span></header>
        <p class="note">Every milestone leaves a fossil: a save point you can come back to. Keep the ones you want in amber, then <b>Continue from here</b> to play that lineage again from that moment. Amber: <b>${amberCount}/${slots}</b> used${full ? '. To keep another, release or delete one in amber first' : ''}. The Amber upgrade gives more room. Continued lineages earn ${Math.round(G.REVIVE_MULT * 100)}% Genetic Memory.${live ? ' Continuing ends the lineage you are playing now.' : ''}</p>
        <section><h2>Fossils</h2>${groups.length ? groups.map(group).join('') : '<p class="empty">No fossils yet. Reach a milestone, like becoming multicellular, to leave one.</p>'}</section>
        <section><h2>Past lineages</h2>${m.history.length ? `<ul class="fossil-list">${m.history.map(hist).join('')}</ul>` : '<p class="empty">No finished lineages yet.</p>'}</section>
      </main>`;
  }

  // ---------- Codex ----------
  function codexScreen() {
    const c = G.meta.codex;
    const events = G.EVENTS;
    const seenEvents = events.filter((e) => c.events.includes(e.id)).length;
    const seenParts = G.PARTS.filter((p) => c.parts.includes(p.id)).length;
    const evos = G.EVOLUTIONS;
    const evoCard = (e) => (c.evolutions.includes(e.id)
      ? `<li class="evo-known"><strong>${picon(e.id)}${esc(e.name)}${e.evolved === 2 ? ' ★' : ''}</strong><span>${esc(G.PART[e.from[0]].name)} + ${esc(G.PART[e.from[1]].name)}</span><span>${esc(G.describeMods(e.mods))}</span></li>`
      : `<li class="unknown"><strong>???</strong><span>${e.evolved === 2 ? 'Legendary · ' : ''}${e.stage === 'cell' ? 'Cell' : 'Creature'} ${esc(G.SLOTS[e.stage === 'cell' ? 'cell' : (e.habitat || 'land')].find((sl) => sl.id === e.slot).name.toLowerCase())}</span></li>`);
    const group = (filter) => `<ul class="codex-grid">${G.PARTS.filter((p) => !p.evolved && filter(p)).map((p) => (c.parts.includes(p.id)
      ? `<li><strong>${picon(p.id)}${esc(p.name)}</strong>${kwTags(p)}<span>${esc(G.describeMods(p.mods))}</span></li>`
      : '<li class="unknown"><strong>???</strong></li>')).join('')}</ul>`;
    return `
      <main class="codex">
        <header class="screen-head"><button class="btn ghost" data-act="go" data-arg="title">Back</button><h1>Codex of Life</h1></header>
        <section><h2>Codex of Endings <span class="count">${(c.endings || []).length} / ${G.ENDINGS.length * G.ARCHETYPES.length}</span></h2>
          <p class="note">Each Path of Mind has an ending on land and one at sea, and every starting archetype gives it a different name. A new square is worth +10 Genetic Memory.</p>
          <ul class="ending-grid">${G.ENDINGS.map((id) => { const l = G.LEGACIES[id]; const pth = G.PATH[l.path];
            return `<li><strong>${pth.icon} ${esc(pth.name)} · ${l.habitat === 'sea' ? 'Sea' : 'Land'}</strong><span class="note">${esc(l.desc)}</span><ul>${G.ARCHETYPES.map((a) => { const tm = G.TEMPERAMENTS[a.id]; const got = (c.endings || []).includes(`${id}|${tm.id}`);
              return `<li class="${got ? 'got' : ''}"><span>${esc(a.name)}</span><b>${got ? esc(l.flavor[tm.id]) : '???'}</b></li>`; }).join('')}</ul></li>`; }).join('')}</ul>
        </section>
        <section><h2>Tribe endings <span class="count">${(c.tribeEndings || []).length} / 12</span></h2>
          <p class="note">How each kind of people can found itself: Settle, Roam or Conquer. A new one is worth +10 Genetic Memory.</p>
          <ul class="codex-grid">${Object.entries(G.TRIBE_ENDINGS).flatMap(([path, byHab]) => Object.entries(byHab).flatMap(([hab, ends]) => Object.entries(ends).map(([road, e]) => { const got = (c.tribeEndings || []).includes(`${path}|${hab}|${road}`); const k = G.KINDS[path][hab];
            return got ? `<li><strong>${esc(e.name)}</strong><span>${k.icon} ${esc(k.name)} · ${esc(road[0].toUpperCase() + road.slice(1))}</span><span>${esc(e.desc)}</span></li>` : `<li class="unknown"><strong>???</strong><span>${k.icon} ${esc(k.name)} · ${esc(road[0].toUpperCase() + road.slice(1))}</span></li>`; }))).join('')}</ul>
        </section>
        <section><h2>Society endings <span class="count">${(c.societyEndings || []).length} / ${Object.values(G.SOCIETY_ENDINGS).reduce((t, byHab) => t + Object.values(byHab).reduce((u, ends) => u + Object.keys(ends).length, 0), 0)}</span></h2>
          <p class="note">How each society can unite its region: by force, by trade or by faith. A new one is worth +10 Genetic Memory.</p>
          <ul class="codex-grid">${Object.entries(G.SOCIETY_ENDINGS).flatMap(([path, byHab]) => Object.entries(byHab).flatMap(([hab, ends]) => Object.entries(ends).map(([road, e]) => { const got = (c.societyEndings || []).includes(`${path}|${hab}|${road}`); const sk = G.SOCIETY_KINDS[path][hab]; const rn = { conquest: 'Conquest', trade: 'Trade', faith: 'Faith' }[road];
            return got ? `<li><strong>${esc(e.name)}</strong><span>${esc(sk.name)} · ${rn}</span><span>${esc(e.desc)}</span></li>` : `<li class="unknown"><strong>???</strong><span>${esc(sk.name)} · ${rn}</span></li>`; }))).join('')}</ul>
        </section>
        <section><h2>Colonial endings <span class="count">${(c.colonialEndings || []).length} / ${Object.keys(G.PATH).length * 3}</span></h2>
          <p class="note">How each kind of realm can wear the Imperial Crown: as a commonwealth, as one crown, or as an empire of iron. A new one is worth +10 Genetic Memory.</p>
          <ul class="codex-grid">${Object.keys(G.PATH).flatMap((path) => Object.entries(G.COLONIAL_ENDINGS).map(([road, e]) => { const got = (c.colonialEndings || []).includes(`${path}|${road}`); const p = G.PATH[path];
            return got ? `<li><strong>${esc(e.name)}</strong><span>${p.icon} ${esc(p.name)}</span><span>${esc(e.desc)}</span></li>` : `<li class="unknown"><strong>???</strong><span>${p.icon} ${esc(p.name)}</span></li>`; })).join('')}</ul>
        </section>
        <section><h2>Renaissance endings <span class="count">${(c.renaissanceEndings || []).length} / ${Object.keys(G.PATH).length * 3}</span></h2>
          <p class="note">How each kind of nation can use the Age of Sail: to explore, to trade or to conquer. A new one is worth +10 Genetic Memory.</p>
          <ul class="codex-grid">${Object.keys(G.PATH).flatMap((path) => Object.entries(G.RENAISSANCE_ENDINGS).map(([road, e]) => { const got = (c.renaissanceEndings || []).includes(`${path}|${road}`); const p = G.PATH[path];
            return got ? `<li><strong>${esc(e.name)}</strong><span>${p.icon} ${esc(p.name)}</span><span>${esc(e.desc)}</span></li>` : `<li class="unknown"><strong>???</strong><span>${p.icon} ${esc(p.name)} · ${esc(road[0].toUpperCase() + road.slice(1))}</span></li>`; })).join('')}</ul>
        </section>
        <section><h2>Traditions <span class="count">${G.TRADITIONS.filter((t) => (c.traditions || []).includes(t.id)).length} / ${G.TRADITIONS.length}</span></h2>
          <ul class="codex-grid">${G.TRADITIONS.map((t) => ((c.traditions || []).includes(t.id) ? `<li><strong>${esc(t.name)}</strong>${traditionTags(t)}<span>${esc(G.describeMods(t.mods))}</span></li>` : '<li class="unknown"><strong>???</strong></li>')).join('')}</ul>
        </section>
        <section><h2>Discoveries <span class="count">${G.DISCOVERIES.filter((d) => (c.discoveries || []).includes(d.id)).length} / ${G.DISCOVERIES.length}</span></h2>
          <ul class="codex-grid">${G.DISCOVERIES.map((d) => ((c.discoveries || []).includes(d.id) ? `<li><strong>${esc(d.name)}</strong>${discoveryTags(d)}<span>${esc(G.describeMods(d.mods))}</span>${d.from ? `<span>${esc(G.DISCOVERY[d.from[0]].name)} + ${esc(G.DISCOVERY[d.from[1]].name)}</span>` : ''}</li>` : `<li class="unknown"><strong>???</strong>${d.from ? '<span>Combined</span>' : ''}</li>`)).join('')}</ul>
        </section>
        <section><h2>Evolutions <span class="count">${c.evolutions.length} / ${evos.length}</span></h2>
          <p class="note">Merge the right two parts to evolve them. Discoveries unlock new archetypes and worlds.</p>
          <ul class="codex-grid">${evos.map(evoCard).join('')}</ul>
        </section>
        <section><h2>Events <span class="count">${seenEvents} / ${events.length}</span></h2>
          <ul class="codex-grid">${events.map((e) => (c.events.includes(e.id) ? `<li><strong>${esc(e.title.replace(/\{them\}/g, 'Others'))}</strong><span>${e.stage === 'any' ? 'Any stage' : [].concat(e.stage).map((x) => G.STAGES[x].name).join(' · ')}${e.habitat ? ` · ${e.habitat === 'sea' ? 'Sea' : 'Land'}` : ''}</span></li>` : '<li class="unknown"><strong>???</strong></li>')).join('')}</ul>
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
    if (G.audio && el.matches('.btn, .option, .choice, .tab, .seg')) G.audio.tap();
    const act = el.dataset.act;
    const arg = el.dataset.arg;
    const run = G.run;
    let parts = null; // null = full redraw
    switch (act) {
      case 'go': go(arg); return;
      case 'opt': if (arg === 'tips') G.meta.tipsOff = !G.meta.tipsOff; else if (arg === 'guide') G.meta.guide.on = !G.meta.guide.on;
        else if (arg.startsWith('comp:')) { const id = arg.slice(5); const list = G.chosenComplications(); G.meta.options.complications = list.includes(id) ? list.filter((x) => x !== id) : list.concat(id); }
        else G.meta.options[arg] = !G.meta.options[arg];
        G.saveMeta(); if (arg === 'sound' && G.audio) G.audio.settingsChanged(); break;
      case 'guide-replay': G.replayGuide(); break;
      case 'save-copy': {
        const code = G.ui.saveCode; if (!code) return;
        const ok = () => { G.markBackedUp(); G.ui.saveMove = { copied: true }; render(); };
        // Older iPhones and some embedded pages refuse the clipboard; then copy through a hidden box, and if even
        // that fails, show the code to copy by hand.
        const byHand = () => { G.ui.saveMove = { show: true }; render(); const t = app.querySelector('#save-out'); if (t) { t.focus(); t.setSelectionRange(0, t.value.length); } };
        const oldWay = () => {
          const t = document.createElement('textarea'); t.value = code; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px';
          document.body.appendChild(t); t.focus(); t.setSelectionRange(0, code.length);
          let done = false; try { done = document.execCommand('copy'); } catch (e) { done = false; }
          t.remove(); if (done) ok(); else byHand();
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(ok, oldWay); else oldWay();
        return;
      }
      case 'save-paste-clip':
        if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then((t) => { if (!t) { showPasted('', 'The clipboard is empty. Copy your save code first.'); return; } showPasted(t); G.importSave(t).then((err) => { if (err) showPasted(t, err); }); }, () => showPasted('', 'This browser would not let the game read the clipboard. Paste the code into the box instead (tap the box, then Paste).'));
        else showPasted('', 'Paste the code into the box (tap the box, then Paste).');
        return;
      case 'save-paste-open': showPasted(''); { const t = app.querySelector('#save-paste'); if (t) t.focus(); } return;
      case 'save-paste-close': G.ui.saveMove = null; break;
      case 'daily-start': if (G.run && G.run.phase !== 'end') { G.ui.confirmDaily = true; break; } beginDaily(); return;
      case 'daily-yes': beginDaily(); return;
      case 'daily-no': G.ui.confirmDaily = false; break;
      case 'daily-share': {
        const text = dailyShareText();
        const done = () => { G.ui.dailyShared = true; render(); };
        if (navigator.share) { navigator.share({ text }).then(done, () => {}); return; }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => {});
        return;
      }
      case 'save-undo': if (G.restorePreviousSave()) location.reload(); return;
      case 'save-load': { const t = app.querySelector('#save-paste'); loadSaveCode(t ? t.value : ''); return; }
      case 'save-download': {
        const code = G.ui.saveCode; if (!code) return;
        const name = `primordia-save-${new Date().toISOString().slice(0, 10)}.txt`;
        const file = typeof File === 'function' ? new File([code], name, { type: 'text/plain' }) : null;
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: 'Primordia save' }).then(() => { G.markBackedUp(); render(); }, () => {}); return; }
        G.markBackedUp();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
        a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        return;
      }
      case 'install': if (G.installPrompt) { G.installPrompt.prompt(); G.installPrompt = null; } return;
      case 'safety-hide': G.ui.safetyHidden = true; break;
      case 'backup-snooze': G.meta.options.backupSnooze = Date.now(); G.saveMeta(); break;
      case 'save-copy-title': {
        const code = G.ui.saveCode; if (!code) return;
        const ok = () => { G.markBackedUp(); G.ui.titleCopied = true; render(); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(ok, () => go('options')); else go('options');
        return;
      }
      case 'install-hide': G.meta.options.installHidden = true; G.saveMeta(); break;
      case 'opt-theme': G.meta.options.theme = arg; G.saveMeta(); G.applyTheme(); break;
      case 'affinity': G.buyAffinity(arg); break;
      case 'tips-reset': G.meta.tips = []; G.meta.tipsOff = false; G.saveMeta(); break;
      case 'continue': if (G.meta.seenVersion !== G.VERSION) { G.meta.seenVersion = G.VERSION; G.saveMeta(); } G.ui.sheet = null; G.ui.viewer = null; if (G.resetMap) G.resetMap(); go('game'); return;
      case 'setup':
        if (G.meta.seenVersion !== G.VERSION) { G.meta.seenVersion = G.VERSION; G.saveMeta(); }
        G.ui.setup = G.ui.setup || { archetype: 'drifter', origin: 'tidal', hostility: 0 };
        if (!G.ui.setup.name) G.ui.setup.name = G.randomLineageName();
        if (!G.meta.unlocked.archetypes.includes(G.ui.setup.archetype)) G.ui.setup.archetype = 'drifter';
        if (!G.meta.unlocked.origins.includes(G.ui.setup.origin)) G.ui.setup.origin = 'tidal';
        G.ui.setup.hostility = Math.min(G.ui.setup.hostility, G.meta.maxHostility);
        go('setup'); return;
      case 'pick-archetype': G.ui.setup.archetype = arg; break;
      case 'pick-origin': G.ui.setup.origin = arg; break;
      case 'pick-hostility': G.ui.setup.hostility = Number(arg); break;
      case 'stage-start': if (G.startFromStage(arg)) { if (G.resetMap) G.resetMap(); G.ui.speed = Math.max(1, G.ui.speed); go('game'); } return;
      case 'begin': G.newRun(G.ui.setup.archetype, G.ui.setup.origin, G.ui.setup.hostility, G.ui.setup.name); G.ui.setup.name = null; if (G.resetMap) G.resetMap(); G.ui.speed = G.guideOn() && !G.guideDone('g_play') ? 0 : Math.max(1, G.ui.speed); go('game'); return;
      case 'option': G.chooseOption(Number(arg)); parts = ['top', 'hud', 'modal']; break;
      case 'continue-scene': G.continueScene(); parts = ['top', 'hud', 'modal']; autoEditor(parts); break;
      case 'continue-mutation': G.continueMutation(); parts = ['top', 'hud', 'modal']; break;
      case 'draft': G.pickDraft(arg, el.dataset.mode, el.dataset.socket); parts = ['top', 'hud', 'modal']; break;
      case 'reroll': G.rerollDraft(); parts = ['modal']; break;
      case 'skip-draft': G.skipDraft(); parts = ['top', 'hud', 'modal']; break;
      case 'hold-discovery': G.holdDiscovery(arg); parts = ['top', 'hud', 'modal']; break;
      case 'learn-held': G.ui.sheet = null; G.learnHeld(arg); parts = ['top', 'hud', 'modal', 'sheet']; break;
      case 'learn-lore': G.ui.sheet = null; G.learnLore(arg); parts = ['top', 'hud', 'modal', 'sheet']; break;
      case 'lore-sel': G.ui.loreSel = arg; G.ui.keepScroll = true; parts = ['sheet']; break;
      case 'law-sel': G.ui.lawSel = arg; G.ui.keepScroll = true; parts = ['sheet']; break;
      case 'reason-sel': G.ui.reasonSel = arg; G.ui.keepScroll = true; parts = ['sheet']; break;
      case 'crown-sel': G.ui.crownSel = arg; G.ui.keepScroll = true; parts = ['sheet']; break;
      case 'learn-crown': G.ui.sheet = null; G.learnCrown(arg); parts = ['top', 'hud', 'modal', 'sheet']; break;
      case 'learn-reason': G.ui.sheet = null; G.learnReason(arg); parts = ['top', 'hud', 'modal', 'sheet']; break;
      case 'learn-law': G.ui.sheet = null; G.learnLaw(arg); parts = ['top', 'hud', 'modal', 'sheet']; break;
      case 'fascinate': G.setFascination(arg); G.ui.mindSel = null; parts = ['top', 'modal', 'sheet']; break;
      case 'book-page': G.ui.bookPage = arg; G.ui.mindSel = null; G.ui.keepScroll = true; parts = ['sheet']; break;
      case 'mind-sel': G.ui.mindSel = arg; G.ui.keepScroll = true; parts = run && run.phase === 'mind' && !G.ui.sheet ? ['modal'] : ['sheet']; break;
      case 'continue-evolved': G.continueEvolved(); parts = ['top', 'hud', 'modal']; autoEditor(parts); break;
      case 'editor-open': if (G.startEditing()) { G.ui.editor = true; G.ui.editorTab = 'body'; G.ui.sheet = null; } parts = ['top', 'sheet', 'editor']; break;
      case 'editor-done': G.ui.editor = false; parts = ['top', 'editor', 'sheet']; break;
      case 'editor-tab': G.ui.editorTab = arg; parts = ['editor']; break;
      case 'instinct': G.setInstinct(arg); G.ui.keepScroll = true; parts = ['top', 'sheet']; break;
      case 'zone': G.setZone(arg); G.ui.keepScroll = true; parts = ['top', 'sheet']; break;
      case 'steal': G.stealFromHost(); G.ui.sheet = null; G.ui.speciesView = null; parts = ['top', 'hud', 'modal', 'sheet']; break;
      case 'jump': G.jumpHost(arg); G.ui.keepScroll = true; parts = ['top', 'sheet']; break;
      case 'mimic': G.mimicSpecies(arg); G.ui.sheet = null; G.ui.speciesView = null; parts = ['top', 'hud', 'modal', 'sheet']; break;
      case 'swap': G.swapWithPartner(arg); G.ui.keepScroll = true; parts = ['top', 'sheet']; break;
      case 'act-pick': G.ui.actPick = arg || null; G.ui.keepScroll = true; parts = ['sheet']; break;
      case 'biome-sel': G.ui.biomeSel = arg; G.ui.keepScroll = true; parts = ['sheet']; break;
      case 'act-start': G.startActivity(arg, el.dataset.target || null, el.dataset.dest || null); G.ui.actPick = null; G.ui.keepScroll = true; parts = ['top', 'sheet']; break;
      case 'act-stop': G.stopActivity(); G.ui.keepScroll = true; parts = ['top', 'sheet']; break;
      case 'reshape': G.reshape(Number(arg)); G.ui.keepScroll = true; parts = ['top', 'sheet']; break;
      case 'arms': G.setArms(Number(arg)); G.ui.keepScroll = true; parts = ['top', 'sheet']; break;
      case 'editor-random': G.randomiseLook(arg === 'all' ? null : arg); G.ui.keepEditorScroll = true; parts = ['top', 'editor']; break;
      case 'look': G.setLook(el.dataset.kind, arg); G.ui.keepScroll = true; G.ui.keepEditorScroll = true; parts = G.ui.editor ? ['top', 'editor'] : ['top', 'sheet']; break;
      case 'sheet': G.ui.sheet = arg; G.ui.confirmAbandon = false; G.ui.speciesView = null; parts = ['sheet']; break;
      case 'species': G.ui.speciesView = Number(arg); parts = ['sheet']; break;
      case 'species-back': G.ui.speciesView = null; parts = ['sheet']; break;
      case 'close-sheet': G.ui.sheet = null; G.ui.speciesView = null; parts = ['sheet']; break;
      case 'view': G.ui.viewer = arg; parts = ['viewer']; break;
      case 'close-view': G.ui.viewer = null; parts = ['viewer']; break;
      case 'speed': G.ui.speed = Number(arg); if (G.ui.speed) G.ui.lastSpeed = G.ui.speed; parts = ['top']; break;
      case 'speed-toggle': G.ui.speed = G.ui.speed ? 0 : (G.ui.lastSpeed || 1); parts = ['top']; break;
      case 'speed-cycle': G.ui.lastSpeed = G.ui.speed ? (G.ui.speed % 3) + 1 : (G.ui.lastSpeed || 1); G.ui.speed = G.ui.lastSpeed; parts = ['top']; break;
      case 'explain': G.ui.explain = arg && G.ui.explain !== arg ? arg : null; parts = ['top']; break;
      case 'dismiss': if (run) run.notices.splice(Number(arg), 1); parts = ['hud']; break;
      case 'abandon': G.ui.confirmAbandon = true; G.ui.keepScroll = true; parts = ['sheet']; break;
      case 'abandon-no': G.ui.confirmAbandon = false; G.ui.keepScroll = true; parts = ['sheet']; break;
      case 'abandon-yes': G.endRunEarly(); G.ui.confirmAbandon = false; G.ui.sheet = null; parts = ['top', 'hud', 'modal', 'sheet']; break;
      case 'buy': G.buy(el.dataset.kind, arg); break;
      case 'tree-sel': G.ui.treeSel = arg; break;
      case 'wis-sel': G.ui.wisSel = arg; break;
      case 'her-sel': G.ui.herSel = arg; break;
      case 'pat-sel': G.ui.patSel = arg; break;
      case 'ch-sel': G.ui.chSel = arg; break;
      case 'caste': G.setCaste(arg); G.ui.keepScroll = true; parts = ['top', 'sheet']; break;
      case 'amber-on': G.setAmber(arg, true); break;
      case 'fossil-del': G.ui.confirmDel = arg; break;
      case 'fossil-del-no': G.ui.confirmDel = null; break;
      case 'fossil-del-yes': G.deleteFossil(arg); G.ui.confirmDel = null; break;
      case 'rename-start': G.ui.renaming = arg; render(); { const i = app.querySelector('#rename-input'); if (i) { i.focus(); i.select(); } } return;
      case 'rename-cancel': G.ui.renaming = null; break;
      case 'name-dice': G.ui.setup.name = G.randomLineageName(); break;
      case 'amber-off': G.setAmber(arg, false); break;
      case 'revive':
        if (G.run && G.run.phase !== 'end') G.endRunEarly();
        if (G.reviveFossil(arg)) { if (G.resetMap) G.resetMap(); G.ui.speed = Math.max(1, G.ui.speed); go('game'); return; }
        break;
      case 'reset': G.ui.confirmReset = true; break;
      case 'reset-no': G.ui.confirmReset = false; break;
      case 'reset-yes': G.resetAll(); go('title'); return;
      default: return;
    }
    render(parts);
  });

  // Color sliders update the look live.
  // The editor opens by itself (for free) after becoming a creature and after the big milestones.
  function autoEditor(parts) {
    const run = G.run;
    if (!run || !run.freeEdit || run.stage !== 'creature' || run.phase !== 'map') return;
    // The editor opens by itself once ever, to show it exists; after that it waits in the Look tab.
    if (G.meta.editorShown) { run.freeEdit = false; return; }
    if (G.startEditing()) { G.meta.editorShown = true; G.saveMeta(); G.ui.editor = true; G.ui.editorTab = 'body'; parts.push('editor'); run.notices.push('You can change how your creature looks at any time from the Look tab. It never changes your stats.'); }
  }

  app.addEventListener('change', (e) => {
    const el = e.target.closest('[data-save-file]');
    if (!el || !el.files || !el.files[0]) return;
    const r = new FileReader();
    r.onload = () => showPasted(String(r.result || ''));
    r.readAsText(el.files[0]);
  });
  app.addEventListener('submit', (e) => {
    const f = e.target.closest('form[data-form="rename"]');
    if (!f) return;
    e.preventDefault();
    const i = f.querySelector('input');
    if (i && G.renameLineage(f.dataset.arg, i.value)) G.ui.renaming = null;
    render();
  });
  app.addEventListener('input', (e) => {
    if (e.target.id === 'lineage-name' && G.ui.setup) { G.ui.setup.name = e.target.value; return; }
    if (e.target.dataset && e.target.dataset.vol) { G.meta.options[e.target.dataset.vol] = Number(e.target.value); G.saveMeta(); if (G.audio) { G.audio.settingsChanged(); if (e.target.dataset.vol === 'sfxVol') G.audio.play('soft'); } return; }
    const el = e.target.closest('[data-look]');
    if (!el) return;
    G.setLook(el.dataset.look, el.value);
    el.style.setProperty('--h', el.value);
    const out = app.querySelector(`output[data-out="${el.dataset.look}"]`);
    const sl = G.SCULPT_BY_ID[el.dataset.look];
    if (out && sl && !sl.ends) out.textContent = sl.step >= 1 ? el.value : `${Math.round(el.value * 100)}%`;
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
    const running = G.ui.screen === 'game' && run && run.phase === 'map' && !G.ui.sheet && G.ui.viewer == null && !G.ui.editor && !G.ui.tip && !G.guideHolding() && !G.ui.explain && G.ui.speed > 0;
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

  prepareSaveCode();
  render();
}());
// Build stamp: index.html checks that every file comes from the same release.
(window.PRIMORDIA_FILES = window.PRIMORDIA_FILES || {}).ui = '21.8';
