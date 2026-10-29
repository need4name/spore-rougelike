// Sound: every sound is made here with the Web Audio API, so there are no files to download and it works offline.
// Ambience (a bed of sound and a few soft notes) follows where your lineage lives; short effects mark events,
// mutations, successes, failures and endings. Phones only allow sound after the first tap, so nothing plays
// until then. On iPhones the sound mixes with other audio and respects the silent switch.
window.G = window.G || {};

G.audio = (function () {
  let ctx = null; let master = null; let sfxBus = null; let ambBus = null; let noiseBuf = null;
  let scape = null; let scapeNodes = []; let timers = []; let unlocked = false;

  const opts = () => (G.meta && G.meta.options) || {};
  const soundOn = () => opts().sound !== false;
  const sfxVol = () => (opts().sfxVol != null ? opts().sfxVol : 0.7);
  const ambVol = () => (opts().ambVol != null ? opts().ambVol : 0.5);

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch (e) { /* older Safari */ }
    try { ctx = new AC(); } catch (e) { return null; }
    master = ctx.createGain(); master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    ambBus = ctx.createGain(); ambBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    applyVolumes();
    return ctx;
  }
  function applyVolumes() {
    if (!ctx) return;
    const t = ctx.currentTime;
    master.gain.setTargetAtTime(soundOn() ? 1 : 0, t, 0.05);
    sfxBus.gain.setTargetAtTime(0.5 * sfxVol(), t, 0.05);
    ambBus.gain.setTargetAtTime(0.35 * ambVol(), t, 0.3);
  }

  // ---------- Building blocks ----------
  // A note with a soft attack and an exponential fade.
  function tone(freq, dur, o) {
    o = o || {};
    if (!ctx) return;
    const t = ctx.currentTime + (o.at || 0);
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide || dur));
    const peak = o.gain != null ? o.gain : 0.3;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + (o.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let out = g;
    if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; g.connect(f); out = f; }
    osc.connect(g); out.connect(o.dest || sfxBus);
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  // A burst of filtered noise (splashes, crackles, wind gusts, thuds).
  function noise(dur, o) {
    o = o || {};
    if (!ctx) return;
    const t = ctx.currentTime + (o.at || 0);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = o.filter || 'bandpass'; f.frequency.setValueAtTime(o.freq || 1000, t); f.Q.value = o.q || 1;
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain != null ? o.gain : 0.2, t + (o.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(o.dest || sfxBus);
    src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  // ---------- Effects ----------
  const SFX = {
    tap: () => tone(1400, 0.05, { type: 'triangle', gain: 0.05 }),
    event: () => { tone(midi(76), 0.5, { gain: 0.12, attack: 0.02 }); tone(midi(83), 0.7, { gain: 0.09, at: 0.08, attack: 0.02 }); },
    danger: () => { tone(70, 0.6, { type: 'sine', to: 45, gain: 0.35 }); noise(0.3, { freq: 200, filter: 'lowpass', gain: 0.15 }); tone(midi(57), 0.8, { type: 'triangle', gain: 0.07, at: 0.15, lp: 900 }); },
    success: () => [72, 76, 79].forEach((n, i) => tone(midi(n), 0.45, { type: 'triangle', gain: 0.12, at: i * 0.07, lp: 3000 })),
    fail: () => { tone(midi(62), 0.4, { type: 'triangle', gain: 0.12, lp: 1200 }); tone(midi(58), 0.6, { type: 'triangle', gain: 0.12, at: 0.14, lp: 900 }); },
    draft: () => [84, 88, 91, 96].forEach((n, i) => tone(midi(n), 0.3, { gain: 0.05, at: i * 0.05 })),
    mutate: () => { tone(220, 0.6, { to: 660, glide: 0.5, type: 'sine', gain: 0.14 }); noise(0.5, { freq: 800, to: 3000, q: 4, gain: 0.05 }); },
    evolve: () => [60, 64, 67, 72, 76].forEach((n, i) => tone(midi(n), 0.9, { type: 'triangle', gain: 0.1, at: i * 0.09, lp: 2500 })),
    fanfare: () => { [60, 64, 67].forEach((n) => tone(midi(n), 1.6, { type: 'triangle', gain: 0.09, attack: 0.05, lp: 2200 })); [72, 76, 79, 84].forEach((n, i) => tone(midi(n), 0.9, { type: 'triangle', gain: 0.08, at: 0.25 + i * 0.12, lp: 3000 })); },
    extinct: () => { [64, 60, 57, 52].forEach((n, i) => tone(midi(n), 1.2, { type: 'triangle', gain: 0.1, at: i * 0.32, lp: 1000 })); noise(2.4, { freq: 300, to: 120, filter: 'lowpass', gain: 0.05, attack: 0.4 }); },
    soft: () => tone(midi(79), 0.35, { gain: 0.06 }),
  };
  function play(name) {
    if (!unlocked || !soundOn() || !ensure() || !SFX[name]) return;
    try { SFX[name](); } catch (e) { /* never let sound break the game */ }
  }

  // ---------- Ambience ----------
  // Each place has a bed of sound, a soft pad and a scale its music notes come from.
  const SCAPES = {
    title: { pad: [45, 52], wave: 'sine', lp: 600, scale: [69, 72, 74, 76, 79, 81], every: [3, 6], pluck: 'sine' },
    cell: { pad: [45, 57], wave: 'sine', lp: 500, bed: { freq: 300, filter: 'lowpass', gain: 0.05 }, scale: [69, 72, 74, 76, 79, 81, 84], every: [2.5, 5], pluck: 'sine', extra: 'bubbles' },
    sea: { pad: [38, 45], wave: 'sine', lp: 400, bed: { freq: 380, filter: 'lowpass', gain: 0.12, swell: 0.12 }, scale: [62, 64, 65, 67, 69, 72, 74], every: [3, 7], pluck: 'sine', extra: 'whale' },
    land: { pad: [43, 50], wave: 'triangle', lp: 500, bed: { freq: 900, filter: 'bandpass', gain: 0.06, swell: 0.3, q: 0.6 }, scale: [67, 69, 71, 74, 76, 79], every: [2.5, 6], pluck: 'triangle', extra: 'birds' },
    tribe: { pad: [40, 47], wave: 'triangle', lp: 450, bed: { freq: 2500, filter: 'highpass', gain: 0.012 }, scale: [64, 67, 69, 71, 74, 76], every: [3, 6], pluck: 'triangle', extra: 'fire' },
    civ: { pad: [48, 52, 55, 59], wave: 'triangle', lp: 700, bed: { freq: 700, filter: 'bandpass', gain: 0.025, q: 0.4 }, scale: [60, 64, 67, 69, 71, 72, 76, 79], every: [2, 4.5], pluck: 'triangle', extra: 'bells' },
  };
  G.audioScape = (run, screen) => {
    if (screen !== 'game' || !run) return 'title';
    if (run.stage === 'cell') return 'cell';
    if (run.stage === 'creature') return run.habitat === 'sea' ? 'sea' : 'land';
    if (run.stage === 'tribe') return 'tribe';
    return 'civ';
  };
  function stopScape() {
    timers.forEach(clearTimeout); timers = [];
    const t = ctx ? ctx.currentTime : 0;
    scapeNodes.forEach((n) => { try { if (n.gain) n.gain.setTargetAtTime(0.0001, t, 0.6); if (n.stop) n.stop(t + 3); } catch (e) { /* already stopped */ } });
    scapeNodes = [];
  }
  const later = (sec, fn) => { timers.push(setTimeout(fn, sec * 1000)); };
  function startScape(name) {
    const s = SCAPES[name]; if (!s || !ctx) return;
    const t = ctx.currentTime;
    // The pad: a few slow, slightly detuned notes behind a low-pass filter.
    const padGain = ctx.createGain(); padGain.gain.setValueAtTime(0.0001, t); padGain.gain.exponentialRampToValueAtTime(0.12, t + 4);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = s.lp; padGain.connect(lp); lp.connect(ambBus);
    scapeNodes.push(padGain);
    s.pad.forEach((n, i) => [0, 4].forEach((cents) => {
      const o = ctx.createOscillator(); o.type = s.wave; o.frequency.value = midi(n); o.detune.value = cents + i;
      const g = ctx.createGain(); g.gain.value = 0.5 / s.pad.length; o.connect(g); g.connect(padGain); o.start(t); scapeNodes.push(o);
    }));
    // The bed: filtered noise, swelling slowly like waves or wind.
    if (s.bed) {
      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = s.bed.filter; f.frequency.value = s.bed.freq; f.Q.value = s.bed.q || 0.8;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(s.bed.gain, t + 4);
      src.connect(f); f.connect(g); g.connect(ambBus); src.start(t); scapeNodes.push(src, g);
      if (s.bed.swell) {
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.08 + Math.random() * 0.05;
        const depth = ctx.createGain(); depth.gain.value = s.bed.freq * s.bed.swell * 3;
        lfo.connect(depth); depth.connect(f.frequency); lfo.start(t); scapeNodes.push(lfo);
      }
    }
    // Music: now and then a soft note (sometimes two) from the place's scale.
    const note = () => {
      if (scape !== name) return;
      const n = s.scale[Math.floor(Math.random() * s.scale.length)];
      tone(midi(n), 2.2, { type: s.pluck, gain: 0.07, attack: 0.03, lp: 2200, dest: ambBus });
      if (Math.random() < 0.35) tone(midi(s.scale[Math.floor(Math.random() * s.scale.length)]), 2.4, { type: s.pluck, gain: 0.05, attack: 0.03, at: 0.3, lp: 2000, dest: ambBus });
      later(s.every[0] + Math.random() * (s.every[1] - s.every[0]), note);
    };
    later(1.5, note);
    // Little sounds of the place.
    const extra = () => {
      if (scape !== name) return;
      const e = s.extra;
      if (e === 'bubbles') { for (let i = 0; i < 1 + Math.floor(Math.random() * 3); i++) tone(300 + Math.random() * 500, 0.12, { to: 900 + Math.random() * 600, glide: 0.1, gain: 0.03, at: i * 0.09, dest: ambBus }); later(1 + Math.random() * 3, extra); }
      else if (e === 'whale') { tone(midi(50 + Math.floor(Math.random() * 6)), 3, { to: midi(55 + Math.floor(Math.random() * 6)), glide: 2.5, gain: 0.03, attack: 0.8, lp: 600, dest: ambBus }); later(14 + Math.random() * 20, extra); }
      else if (e === 'birds') { const f = 2500 + Math.random() * 1500; for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) tone(f, 0.08, { to: f * 1.3, glide: 0.06, gain: 0.02, at: i * 0.12, dest: ambBus }); later(4 + Math.random() * 8, extra); }
      else if (e === 'fire') { for (let i = 0; i < 2 + Math.floor(Math.random() * 4); i++) noise(0.03, { freq: 3000 + Math.random() * 3000, q: 2, gain: 0.04, at: Math.random() * 0.6, dest: ambBus }); if (Math.random() < 0.25) tone(65, 0.5, { to: 50, gain: 0.08, dest: ambBus }); later(0.6 + Math.random() * 1.2, extra); }
      else if (e === 'bells') { tone(midi(84 + [0, 3, 5, 7][Math.floor(Math.random() * 4)]), 1.6, { gain: 0.02, dest: ambBus }); later(8 + Math.random() * 12, extra); }
    };
    if (s.extra) later(2, extra);
  }
  function setScape(name) {
    if (!unlocked || !ctx) return;
    if (!soundOn() || ambVol() <= 0) name = null;
    if (name === scape) return;
    stopScape(); scape = name;
    if (name) startScape(name);
  }

  // Phones need a tap before any sound; the first one starts it all.
  function unlock() {
    if (unlocked) return;
    if (!soundOn()) return;
    if (!ensure()) return;
    unlocked = true;
    if (ctx.state === 'suspended') ctx.resume();
    update();
  }
  ['pointerdown', 'touchend', 'keydown'].forEach((ev) => document.addEventListener(ev, unlock, { passive: true }));
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (unlocked && soundOn()) ctx.resume(); });

  // ---------- What the screen is doing ----------
  // Called after every redraw: picks the ambience, and plays an effect when the game moves into a new moment.
  let last = { phase: null, screen: null, key: null };
  function update() {
    const run = G.run; const screen = G.ui && G.ui.screen;
    if (unlocked) setScape(G.audioScape(run, screen));
    const phase = screen === 'game' && run ? run.phase : null;
    const key = phase === 'event' && run.event ? `e:${run.event.id}:${run.turn}` : phase === 'scene' && run.scene ? `s:${run.scene.label || run.scene.title}:${run.turn}` : phase === 'draft' ? `d:${run.draftsTaken}:${run.turn}` : `${phase}:${run && run.stage}`;
    if (key !== last.key && phase && last.screen === 'game') {
      if (phase === 'event') { const ev = G.EVENT[run.event.id]; play(ev && ((ev.tags || []).includes('danger') || ev.finale) ? 'danger' : 'event'); }
      else if (phase === 'scene') { const sc = run.scene; play(sc.success === true ? 'success' : sc.success === false ? 'fail' : sc.mutation ? 'mutate' : 'soft'); }
      else if (phase === 'draft') play('draft');
      else if (phase === 'mutated') play('evolve');
      else if (phase === 'evolved') play('fanfare');
      else if (phase === 'end' && run.result) play(run.result.victory ? 'fanfare' : 'extinct');
    }
    last = { phase, screen, key };
  }

  return {
    update, play,
    settingsChanged() { if (soundOn()) unlock(); applyVolumes(); if (unlocked) setScape(soundOn() ? G.audioScape(G.run, G.ui && G.ui.screen) : null); },
    tap() { play('tap'); },
    state: () => ({ unlocked, scape, ctx: ctx ? ctx.state : null, lastKey: last.key }),
  };
}());
// Build stamp: index.html checks that every file comes from the same release.
(window.PRIMORDIA_FILES = window.PRIMORDIA_FILES || {}).audio = '21.10';
