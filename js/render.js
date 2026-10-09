// Draws your organism and its world on a canvas.
// G.drawPortrait draws a still portrait; G.playScene animates a scene that reacts to the last event.
window.G = window.G || {};

(function () {
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const VENOM = '#b98cf2';
  const GLOW = '#8ff5e8';
  const PLANT = '#7fcf5f';
  const BONE = '#efe6d2';
  const SHELL = '#a9b6bd';
  let ctx = null;
  let FACE = null;
  let NO_SHADOW = false; // the death scene flips bodies over, so their ground shadow must go // where the last drawn body's eye and mouth are, for expressions

  const hsl = (h, s, l, a) => `hsla(${h}, ${s}%, ${l}%, ${a == null ? 1 : a})`;
  function glow(color, blur, fn) { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur; fn(); ctx.restore(); }
  function dot(x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }
  function line(x1, y1, x2, y2, color, w) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke();
  }
  function wavy(x, y, len, dir, amp, t, color, w, phase) {
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let i = 1; i <= 20; i++) {
      const d = (i / 20) * len;
      const off = Math.sin(i * 0.6 + t * 4 + (phase || 0)) * amp * (i / 20);
      ctx.lineTo(x + Math.cos(dir) * d - Math.sin(dir) * off, y + Math.sin(dir) * d + Math.cos(dir) * off);
    }
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke();
  }
  function tri(x1, y1, x2, y2, x3, y3, fill) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }

  // Which base part is in each slot, plus the accent color from merged parts.
  // Which parts to draw. Merged and evolved parts draw ALL their ingredients, layered,
  // so every combination looks different. E holds each slot's evolution tier.
  function look(b) {
    const p = {}; let accent = null; const H = new Set(); const E = {};
    const add = (id) => { if (!id || H.has(id)) return; H.add(id); const part = G.PART[id]; if (part && part.from) part.from.forEach(add); };
    Object.entries(b.parts || {}).forEach(([slot, s]) => {
      if (!s || (b.off && b.off.includes(slot))) return;
      const part = G.PART[s.id];
      p[slot] = part.looks || s.id;
      add(s.id); add(s.merged);
      if (part.evolved || (s.merged && G.PART[s.merged].evolved)) E[slot] = Math.max(part.evolved || 0, (s.merged && G.PART[s.merged].evolved) || 0) + (part.evolved && s.merged ? 1 : 0);
      const tint = s.merged || (part.from && part.from[1]);
      if (tint && !accent) {
        const kw = (G.PART[tint].keywords || part.keywords || [])[0];
        accent = kw ? G.KEYWORDS[kw].color : hsl(40, 80, 65);
      }
    });
    p.__H = H; p.__E = E;
    return { p, accent, L: b.look || {}, H, E };
  }

  // A body's frame: inner bones, an outer shell, or soft with no skeleton at all.
  function skel(b) {
    if (b.skeleton) return b.skeleton;
    const tr = (b.traits || []).find((id) => id.startsWith('skeleton_'));
    return tr ? tr.slice(9) : 'inner';
  }

  // Body patterns from the appearance editor, drawn inside a clipped body shape.
  // Body patterns from the editor, drawn inside a clipped body shape centred on 0,0.
  // Pattern size and density scale every pattern; a second pattern color mixes in.
  const prand = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  function pattern(L, rx, ry, S, hue, t) {
    const a1 = L.accent != null ? L.accent : hue + 40;
    const a2 = L.accent2 != null ? L.accent2 : a1 + 30;
    const col = hsl(a1, 55, 40, 0.6); const col2 = hsl(a2, 60, 55, 0.7);
    const sc = L.patScale || 1; const dn = L.patDensity || 1;
    const n = (k) => Math.max(1, Math.round(k * dn));
    switch (L.pattern) {
      case 'spots': for (let i = 0; i < n(7); i++) dot((prand(i) * 2 - 1) * rx * 0.85, (prand(i + 50) * 2 - 1) * ry * 0.75, S * (0.022 + prand(i + 9) * 0.014) * sc, i % 3 === 2 ? col2 : col); break;
      case 'stripes': { const k = n(7); for (let i = 0; i < k; i++) { const x = -rx + ((i + 0.5) / k) * rx * 2; ctx.beginPath(); ctx.moveTo(x, -ry); ctx.quadraticCurveTo(x + rx * 0.12, 0, x, ry); ctx.strokeStyle = i % 2 ? col2 : col; ctx.lineWidth = S * 0.022 * sc; ctx.stroke(); } break; }
      case 'bands': { const k = n(5); for (let i = 0; i < k; i++) { ctx.fillStyle = i % 2 ? col2 : col; ctx.fillRect(-rx + ((i + 0.5) / k) * rx * 2 - S * 0.02 * sc, -ry, S * 0.04 * sc, ry * 2); } break; }
      case 'glowspots': glow(GLOW, 8, () => { for (let i = 0; i < n(7); i++) dot((prand(i + 3) * 2 - 1) * rx * 0.8, (prand(i + 70) * 2 - 1) * ry * 0.5, S * (0.012 + 0.004 * Math.sin(t * 3 + i)) * sc, GLOW); }); break;
      case 'rings': for (let i = 0; i < n(6); i++) { const x = (prand(i + 5) * 2 - 1) * rx * 0.8; const y = (prand(i + 25) * 2 - 1) * ry * 0.65; const r = S * (0.028 + prand(i) * 0.012) * sc; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.strokeStyle = col; ctx.lineWidth = r * 0.45; ctx.stroke(); dot(x, y, r * 0.45, col2); } break;
      case 'rosettes': for (let i = 0; i < n(9); i++) { const x = (prand(i + 11) * 2 - 1) * rx * 0.85; const y = (prand(i + 41) * 2 - 1) * ry * 0.7; const r = S * 0.025 * sc; dot(x, y, r * 0.8, col2); for (let k = 0; k < 4; k++) { const a = k * 1.6 + i; dot(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.35, hsl(a1, 50, 22, 0.8)); } } break;
      case 'tiger': { const k = n(6); for (let i = 0; i < k; i++) { const x = -rx * 0.9 + ((i + 0.5) / k) * rx * 1.8; const len = ry * (1.1 + prand(i) * 0.6); ctx.beginPath(); ctx.moveTo(x - S * 0.02 * sc, -ry); ctx.lineTo(x + S * 0.03 * sc, -ry + len * 0.5); ctx.lineTo(x - S * 0.005, -ry + len); ctx.lineTo(x + S * 0.01 * sc, -ry); ctx.closePath(); ctx.fillStyle = hsl(a1, 40, 15, 0.75); ctx.fill(); } break; }
      case 'patches': for (let i = 0; i < n(6); i++) { const x = -rx * 0.8 + ((i + prand(i + 17) * 0.6) / n(6)) * rx * 1.7; const y = (prand(i + 33) * 2 - 1) * ry * 0.5; ctx.beginPath(); ctx.ellipse(x, y, rx * 0.22 * sc * (0.7 + prand(i + 2) * 0.6), ry * 0.35 * sc, prand(i + 4) * 3, 0, Math.PI * 2); ctx.fillStyle = i % 2 ? col2 : col; ctx.fill(); } break;
      case 'countershade': { const g = ctx.createLinearGradient(0, -ry, 0, ry); g.addColorStop(0, hsl(a1, 45, 30, 0.75)); g.addColorStop(0.45 / sc, hsl(a1, 45, 30, 0.3)); g.addColorStop(Math.min(1, 0.55 / sc + 0.1), 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(-rx, -ry, rx * 2, ry * 2); break; }
      case 'gradient': { const g = ctx.createLinearGradient(-rx, 0, rx, 0); g.addColorStop(0, hsl(a1, 60, 50, 0.75)); g.addColorStop(1, hsl(a2, 60, 55, 0.75)); ctx.fillStyle = g; ctx.fillRect(-rx, -ry, rx * 2, ry * 2); break; }
      case 'iridescent': { const k = n(6); for (let i = 0; i < k; i++) { const x = -rx + ((i + ((t * 0.3) % 1)) / k) * rx * 2; ctx.fillStyle = hsl((a1 + i * 50 + t * 40) % 360, 80, 65, 0.3); ctx.fillRect(x, -ry, rx * 2 / k * sc, ry * 2); } break; }
      default: break;
    }
  }
  // Glossy highlights and glowing edges from the editor's finish setting.
  function finish(L, x, y, rx, ry) {
    if (L.finish === 'glossy') { ctx.beginPath(); ctx.ellipse(x - rx * 0.2, y - ry * 0.5, rx * 0.45, ry * 0.18, -0.15, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.32)'; ctx.fill(); }
    if (L.finish === 'glowing') glow(hsl(L.accent != null ? L.accent : 175, 85, 65), 14, () => { ctx.beginPath(); ctx.ellipse(x, y, rx * 1.01, ry * 1.01, 0, 0, Math.PI * 2); ctx.strokeStyle = hsl(L.accent != null ? L.accent : 175, 85, 70, 0.8); ctx.lineWidth = 2.5; ctx.stroke(); });
  }
  const bellyCol = (L, hue) => (L.belly != null ? hsl(L.belly, 45, 72) : null);

  function sizeScale(b) {
    if (b.traits.includes('giant')) return 1.22;
    if (b.traits.includes('small_many')) return 0.8;
    return 1;
  }

  // ======================= CELL =======================
  function drawCell(b, cx, cy, R, t) {
    const hue = b.hue;
    const { p, accent, H, E } = look(b);
    const dark = hsl(hue, 45, 28);
    const plan = b.traits.includes('radial_plan') ? 'radial' : b.traits.includes('streamlined_plan') ? 'stream' : b.traits.includes('sessile_plan') ? 'sessile' : null;
    const sx = plan === 'stream' ? 1.35 : 1;
    const sy = plan === 'stream' ? 0.78 : 1;
    const rad = (a) => R * (1 + 0.04 * Math.sin(3 * a + t * 1.5) + 0.03 * Math.sin(5 * a - t));
    const at = (a, k) => [cx + Math.cos(a) * rad(a) * (k || 1) * sx, cy + Math.sin(a) * rad(a) * (k || 1) * sy];

    if (plan === 'sessile') {
      ctx.beginPath(); ctx.moveTo(cx - R * 0.15, cy + R * 0.8); ctx.quadraticCurveTo(cx - R * 0.3, cy + R * 1.6, cx - R * 0.1, cy + R * 2.2);
      ctx.lineTo(cx + R * 0.15, cy + R * 2.2); ctx.quadraticCurveTo(cx, cy + R * 1.6, cx + R * 0.15, cy + R * 0.8); ctx.fillStyle = dark; ctx.fill();
    }
    // Behind the body
    if (H.has('slime_coat')) {
      ctx.beginPath(); for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.1) { const [x, y] = at(a, 1.22); a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.fillStyle = hsl(100, 50, 60, 0.18); ctx.fill();
    }
    if (H.has('spikes')) {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + 0.2;
        const [x1, y1] = at(a - 0.08); const [x2, y2] = at(a + 0.08); const [x3, y3] = at(a, 1.35);
        tri(x1, y1, x3, y3, x2, y2, BONE);
      }
    }
    if (E.motion) for (let k = 0; k < 1 + E.motion; k++) { const ang = Math.PI + (k % 2 ? 0.55 : -0.55) * (1 + Math.floor(k / 2) * 0.5); const [x, y] = at(ang); wavy(x, y, R * 1.1, ang, R * 0.2, t, accent || dark, R * 0.06, k); }
    if (H.has('flagellum') || H.has('lumen_flagellum')) {
      const [x, y] = at(Math.PI);
      wavy(x, y, R * 1.3, Math.PI, R * 0.25, t, dark, R * 0.07);
      if (H.has('lumen_flagellum')) glow(GLOW, 10, () => { for (let i = 1; i < 5; i++) dot(x - R * 0.28 * i, y + Math.sin(i * 1.3 + t * 4) * R * 0.06 * i, R * 0.045, GLOW); });
    }
    if (H.has('jet_vacuole')) { const [x, y] = at(Math.PI, 0.95); dot(x - R * 0.12, y, R * 0.24, hsl(hue, 40, 45)); dot(x - R * 0.3, y, R * 0.1, hsl(hue, 30, 20)); }
    if (H.has('drift_sail')) {
      ctx.beginPath(); ctx.moveTo(cx - R * 0.5, cy - R * 0.8); ctx.quadraticCurveTo(cx - R * 0.2, cy - R * 1.9, cx + R * 0.4, cy - R * 0.9);
      ctx.fillStyle = hsl(hue + 30, 60, 70, 0.55); ctx.fill();
    }
    if (H.has('pseudopods')) {
      for (let i = 0; i < 4; i++) { const a = Math.PI * 0.3 + i * 0.4; const [x, y] = at(a, 1.05); dot(x, y, R * (0.2 + 0.04 * Math.sin(t * 2 + i)), hsl(hue, 50, 52)); }
    }
    if (H.has('proboscis')) { const [x, y] = at(0); line(x - 4, y, x + R * 0.7, y + Math.sin(t * 2) * 4, dark, R * 0.1); }
    if (H.has('venom_stylet')) { const [x, y] = at(0); line(x - 4, y, x + R * 0.8, y, VENOM, R * 0.05); }
    if (H.has('glow_lure')) {
      const [x, y] = at(-Math.PI / 3);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + R * 0.3, y - R * 0.9, x + R * 0.8, y - R * 0.5);
      ctx.strokeStyle = dark; ctx.lineWidth = R * 0.04; ctx.stroke();
      glow(GLOW, 18, () => dot(x + R * 0.8, y - R * 0.5 + Math.sin(t * 3) * 2, R * 0.09, GLOW));
    }
    if (H.has('chemoreceptor')) {
      const [x1, y1] = at(-0.5); const [x2, y2] = at(-0.25);
      wavy(x1, y1, R * 0.6, -0.9, 4, t, dark, R * 0.03); wavy(x2, y2, R * 0.6, -0.4, 4, t, dark, R * 0.03, 2);
    }

    // Colony cells (multicellular)
    if (b.multicellular && plan === 'radial') {
      for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + t * 0.2; dot(cx + Math.cos(a) * R * 0.95, cy + Math.sin(a) * R * 0.95, R * 0.42, hsl(hue, 50, 50)); }
    }

    // Body
    ctx.beginPath(); for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.06) { const [x, y] = at(a); a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.closePath();
    const grad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R * 1.3);
    grad.addColorStop(0, hsl(hue, 65, 72)); grad.addColorStop(1, hsl(hue, 55, 52));
    ctx.fillStyle = grad; ctx.fill();
    const hard = H.has('silica_shell') || H.has('plated_wall');
    ctx.lineWidth = R * (hard ? 0.11 : 0.045); ctx.strokeStyle = hard ? SHELL : (accent || dark); ctx.stroke();
    if (H.has('plated_wall')) for (let i = 0; i < 8; i++) { const [x1, y1] = at((i / 8) * Math.PI * 2, 0.88); const [x2, y2] = at((i / 8) * Math.PI * 2, 1.04); line(x1, y1, x2, y2, SHELL, R * 0.045); }

    // Inside: nucleus or a cluster of cells
    if (b.multicellular) {
      ctx.save(); ctx.beginPath(); for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.1) { const [x, y] = at(a, 0.98); a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.clip();
      for (let i = 0; i < 14; i++) { const a = i * 2.4; const r = R * 0.75 * Math.sqrt((i + 0.5) / 14); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r * sx, cy + Math.sin(a) * r * sy, R * 0.22, 0, Math.PI * 2); ctx.strokeStyle = hsl(hue, 40, 40, 0.5); ctx.lineWidth = 1.2; ctx.stroke(); }
      ctx.restore();
    } else {
      dot(cx - R * 0.15, cy + R * 0.05, R * 0.3, hsl(hue, 40, 40, 0.8));
      dot(cx - R * 0.2, cy, R * 0.12, hsl(hue, 40, 25, 0.8));
    }
    if (H.has('chloroplasts') || H.has('algae_chamber')) {
      [[0.3, -0.4], [0.45, 0.3], [-0.5, -0.35], [-0.45, 0.45], [0.1, 0.55]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.ellipse(cx + dx * R, cy + dy * R, R * 0.1, R * 0.06, dx * 3, 0, Math.PI * 2); ctx.fillStyle = PLANT; ctx.fill(); });
    }
    if (H.has('toxin_sac') || H.has('toxin_gland')) { dot(cx + R * 0.2, cy + R * 0.4, R * 0.14, VENOM); dot(cx + R * 0.38, cy + R * 0.2, R * 0.09, VENOM); }
    if (H.has('fat_vacuole')) dot(cx - R * 0.35, cy - R * 0.3, R * 0.22, hsl(48, 80, 70, 0.85));
    if (H.has('stomach_chamber')) { ctx.beginPath(); ctx.ellipse(cx + R * 0.1, cy + R * 0.25, R * 0.35, R * 0.22, 0, 0, Math.PI * 2); ctx.fillStyle = hsl(hue, 40, 22, 0.7); ctx.fill(); }
    if (H.has('neuron_cluster')) { for (let i = 0; i < 6; i++) { const a = i * 1.05; line(cx, cy - R * 0.1, cx + Math.cos(a) * R * 0.45, cy - R * 0.1 + Math.sin(a) * R * 0.45, hsl(50, 90, 75), 1.5); } dot(cx, cy - R * 0.1, R * 0.08, hsl(50, 90, 80)); }
    if (H.has('calcium_core')) dot(cx, cy, R * 0.2, BONE);
    if (H.has('photophores') || H.has('photocyte_cluster')) {
      glow(GLOW, 12, () => { for (let i = 0; i < 9; i++) { const [x, y] = at((i / 9) * Math.PI * 2 + 0.3, 0.86); dot(x, y, R * 0.04 * (1 + 0.4 * Math.sin(t * 3 + i)), GLOW); } });
    }
    if (H.has('magnetosome')) for (let i = 0; i < 5; i++) dot(cx - R * 0.4 + i * R * 0.12, cy + R * 0.5, R * 0.035, '#1c1414');
    // Evolved cell parts reshape the whole cell.
    if (E.membrane) { ctx.beginPath(); for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.08) { const [x, y] = at(a, 1.14 + 0.05 * Math.sin(a * 9 + t)); a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.strokeStyle = accent || SHELL; ctx.lineWidth = R * 0.06 * E.membrane; ctx.stroke(); }
    if (E.organ) glow(accent || GLOW, 20, () => dot(cx + R * 0.05, cy - R * 0.05, R * (0.16 + 0.04 * Math.sin(t * 3)), accent || GLOW));
    if (E.senses) for (let k = 0; k < 2 + E.senses; k++) { const [x, y] = at(-0.9 + k * 0.35, 0.72); dot(x, y, R * 0.07, '#1c1414'); dot(x + 1, y - 1, R * 0.025, '#fff'); }
    if (E.mouth) for (let k = -3; k <= 3; k++) { const [x1, y1] = at(k * 0.12, 0.98); const [x2, y2] = at(k * 0.12, 1.18); tri(x1 - 2, y1, x2, y2, x1 + 2, y1, BONE); }

    // Front
    if (H.has('filter_mouth')) { const [x, y] = at(0); for (let i = -2; i <= 2; i++) line(x - 2, y + i * R * 0.08, x + R * 0.18, y + i * R * 0.1, dark, R * 0.03); }
    if (H.has('tiny_jaw') || H.has('engulfing_maw')) {
      const [x, y] = at(0);
      const big = H.has('engulfing_maw') ? 1.8 : 1;
      const open = (0.12 + Math.abs(Math.sin(t * 2)) * 0.08) * big;
      tri(x - R * 0.25 * big, y, x + 4, y - R * open * 1.5, x + 4, y + R * open * 1.5, hsl(hue, 40, 18));
      line(x, y - R * open * 1.4, x + R * 0.12, y - R * open * 0.4, BONE, R * 0.05);
      line(x, y + R * open * 1.4, x + R * 0.12, y + R * open * 0.4, BONE, R * 0.05);
    }
    if (H.has('lure_mouth')) { const [x, y] = at(0); glow(GLOW, 16, () => dot(x - R * 0.08, y, R * 0.14, GLOW)); }
    { const [fx, fy] = at(-0.45, 0.68); FACE = { x: fx, y: fy, r: R * 0.12, mx: fx + R * 0.12, my: fy + R * 0.36, top: cy - R * 1.05, skin: hsl(hue, 60, 66), s: R * 2.2 }; }
    if (H.has('eyespot') || H.has('plated_eye') || !p.senses || H.has('magnetosome') || H.has('chemoreceptor')) {
      const [x, y] = at(-0.45, 0.68);
      dot(x, y, R * 0.12, '#1c1414'); dot(x + R * 0.03, y - R * 0.03, R * 0.04, '#fff');
      if (H.has('plated_eye')) { ctx.beginPath(); ctx.arc(x, y, R * 0.17, 0, Math.PI * 2); ctx.strokeStyle = SHELL; ctx.lineWidth = R * 0.05; ctx.stroke(); }
    }
    if (H.has('stinging_cilia')) for (let i = -3; i <= 3; i++) { const a = i * 0.14; const [x1, y1] = at(a); const [x2, y2] = at(a, 1.25); line(x1, y1, x2, y2, VENOM, R * 0.03); }
    if (H.has('cilia')) {
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        const [x1, y1] = at(a); const [x2, y2] = at(a + 0.05 * Math.sin(t * 6 + i), 1.12 + 0.04 * Math.sin(t * 6 + i));
        line(x1, y1, x2, y2, dark, R * 0.02);
      }
    }
  }

  // ======================= LAND CREATURE =======================
  function drawLand(b, cx, ground, S, t) {
    const hue = b.hue;
    const { p, accent, L, H, E } = look(b);
    const nSeg = b.segments != null ? b.segments : 2;
    // Some limb pairs can be arms. Old bodies used the "on two legs" posture for one pair of arms.
    const legacyArms = nSeg === 2 && (b.look ? L.posture === 'two' : H.has('upright_legs')) ? 1 : 0;
    const arms = Math.max(0, Math.min(nSeg, b.armPairs != null ? b.armPairs : legacyArms));
    const legPairs = nSeg - arms;
    const biped = legPairs === 1; // stands upright on one pair
    const crawler = legPairs === 0; // no legs: hauls itself along on its arms
    // Long bones and evolved limbs make taller creatures; stubby legs make squat ones.
    const longLegs = (H.has('long_bones_h') ? 1.15 : 1) * (E.hindLimbs ? 1.18 + 0.12 * (E.hindLimbs - 1) : 1) * (p.hindLimbs === 'stubby_hindlegs' && !E.hindLimbs ? 0.75 : 1);
    const legLen = S * (H.has('pillar_legs') ? 0.17 : biped ? 0.26 : 0.21) * longLegs * (L.legLen || 1);
    const armLenK = L.armLen || 1;
    const legThick = L.legThick || 1;
    const flying = H.has('feathered_wings') || H.has('true_wings') || H.has('insect_wings');
    const frame = skel(b);
    const SHAPES = { slim: [0.9, 0.82], long: [1.25, 0.92], flat: [1.12, 0.72], tall: [0.88, 1.28], pear: [1, 1.05], hunched: [0.95, 1.1] };
    const [shapeX, shapeY] = SHAPES[L.shape] || [1, 1];
    // Extra leg pairs stretch the body into a segmented crawler.
    const segLen = nSeg >= 3 ? 1 + 0.2 * (nSeg - 2) : 1;
    const rx = S * (biped ? 0.17 : 0.27) * shapeX * segLen / Math.sqrt(segLen) * (L.bodyLen || 1); const ry = S * (biped ? 0.24 : 0.15) * shapeY / Math.sqrt(segLen) * (L.bodyHeight || 1);
    // Where the legs join the body (body frame, before any tilt).
    let hindX; let frontX;
    if (crawler) { hindX = []; frontX = []; }
    else if (biped) { hindX = [cx]; frontX = []; }
    else if (arms) { hindX = Array.from({ length: legPairs }, (_, i) => cx - rx * 0.72 + (i / Math.max(1, legPairs - 1)) * rx * 1.0); frontX = []; }
    else if (nSeg >= 3) {
      // One pair of legs per segment, spread along the body.
      const xs = Array.from({ length: nSeg }, (_, i) => cx - rx * 0.72 + (i / (nSeg - 1)) * rx * 1.4);
      frontX = p.frontLimbs ? [xs[xs.length - 1]] : [];
      hindX = p.frontLimbs ? xs.slice(0, -1) : xs;
    } else {
      hindX = [cx - rx * 0.6].concat(E.hindLimbs >= 2 ? [cx - rx * 0.05] : []);
      frontX = [cx + rx * 0.5].concat(E.frontLimbs >= 2 ? [cx + rx * 0.1] : []);
    }
    // The editor moves legs closer together or apart, and toward the head or tail,
    // but never so far that the body would float with nothing under it.
    const spread = L.legSpread || 1; const shift = (L.legShift || 0) * rx;
    const clampX = (x, lo, hi) => Math.max(cx + lo * rx, Math.min(cx + hi * rx, x));
    if (biped) hindX = hindX.map((x) => clampX(x + shift * 0.3, -0.15, 0.15));
    else {
      hindX = hindX.map((x) => cx + (x - cx) * spread + shift);
      frontX = frontX.map((x) => cx + (x - cx) * spread + shift);
      if (hindX.length) { const lo = Math.min(...hindX); if (lo > cx - rx * 0.35) hindX = hindX.map((x) => x - (lo - (cx - rx * 0.35))); }
      if (frontX.length) { const hi = Math.max(...frontX); if (hi < cx + rx * 0.35) frontX = frontX.map((x) => x + (cx + rx * 0.35 - hi)); }
    }
    // Arms: where they join, and whether they are long enough to walk on (knuckle-walking).
    const armReach = S * 0.2 * armLenK;
    const knuckle = biped && arms > 0 && armLenK >= 1.35 && !flying;
    // The body tilts to match its limbs: long hind legs tip it forward, long front legs lift the head.
    let tilt = (L.spine || 0) * 0.22;
    if (biped) tilt += knuckle ? 0.5 : -0.15;
    else if (!crawler && arms) tilt -= 0.1;
    let frontLen = legLen;
    if (!biped && !crawler && !arms && frontX.length && hindX.length) {
      frontLen = legLen * armLenK;
      const span = Math.max(rx * 0.6, Math.max(...frontX) - Math.min(...hindX));
      tilt += Math.max(-0.45, Math.min(0.45, Math.asin(Math.max(-0.9, Math.min(0.9, (legLen - frontLen) / span)))));
    }
    const sinT = Math.sin(tilt); const cosT = Math.cos(tilt);
    const dxh = hindX.length ? Math.min(...hindX) - cx : 0;
    const bob = Math.sin(t * 1.6) * 1.5;
    const cy = crawler ? ground - ry * 0.95 + bob * 0.5
      : biped ? ground - legLen - ry * 0.8 + bob
      : ground - legLen - ry * 0.8 - dxh * sinT + bob;
    // Body frame → screen, and drawing inside the tilted body frame.
    const R = (x, y) => [cx + (x - cx) * cosT - (y - cy) * sinT, cy + (x - cx) * sinT + (y - cy) * cosT];
    const inBody = (fn) => { ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt); ctx.translate(-cx, -cy); fn(); ctx.restore(); };
    const body = hsl(hue, 50, 55); const dark = hsl(hue, 40, 30); const light = hsl(hue, 60, 70);
    const wob = frame === 'soft' ? 1 + Math.sin(t * 3.2) * 0.05 : 1;
    // Neck length is a slider; the old "long neck" option counts as most of the way.
    const neck = Math.max(L.neck === 'long' ? 0.8 : 0, L.neckLen || 0);
    const longNeck = neck > 0.5;
    const pos = L.headPos || 'neck';
    let hx = biped ? cx + rx * 0.4 : cx + rx * 0.95 + neck * S * 0.08;
    let hy = biped ? cy - ry * 1.15 : cy - ry * 0.6 - neck * S * 0.2;
    if (crawler) { hx = cx + rx * 1.05 + neck * S * 0.06; hy = cy - ry * 0.35 - neck * S * 0.12; }
    if (pos === 'forward' && !biped) { hx += S * 0.06; hy = cy + ry * 0.05 - neck * S * 0.05; }
    if (pos === 'high') { hy -= S * 0.06; hx -= S * 0.02; }
    if (pos === 'tucked') { hx = biped ? cx + rx * 0.55 : cx + rx * 0.9; hy = biped ? cy - ry * 0.85 : cy - ry * 0.25; }
    const neckBase = R(biped ? cx + rx * 0.2 : cx + rx * 0.6, biped ? cy - ry * 0.7 : cy - ry * 0.4);
    [hx, hy] = R(hx, hy);
    const hr = S * 0.1 * (E.mouth ? 1.15 + 0.1 * E.mouth : 1) * (E.senses ? 1.05 : 1) * (L.headSize || 1);

    if (!NO_SHADOW) { ctx.beginPath(); ctx.ellipse(cx + rx * 0.2, ground + 2, rx * 1.3, S * 0.025, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill(); }

    // Wings (far side) for flyers, flapping.
    const flap = Math.sin(t * 9) * 0.45;
    function wing(near) {
      if (H.has('insect_wings')) {
        const sx = cx + rx * 0.1; const sy = cy - ry * 0.7; const buzz = Math.sin(t * 40) * 0.25;
        [0, 1].forEach((k) => {
          ctx.save(); ctx.translate(sx - k * rx * 0.3, sy); ctx.rotate(-2.2 + k * 0.35 + buzz + (near ? 0.15 : -0.15)); ctx.scale(L.wingSize || 1, L.wingSize || 1);
          ctx.beginPath(); ctx.ellipse(S * 0.2, 0, S * 0.22, S * 0.06, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(220,240,255,${near ? 0.45 : 0.25})`; ctx.fill(); ctx.strokeStyle = hsl(hue, 30, 30, 0.7); ctx.lineWidth = 1; ctx.stroke();
          for (let v = 1; v < 4; v++) line(0, 0, S * 0.1 * v, (v - 2) * S * 0.02, hsl(hue, 30, 30, 0.5), 0.8);
          ctx.restore();
        });
        return;
      }
      const sx = cx + rx * 0.15; const sy = cy - ry * 0.6;
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(-0.5 + flap * (near ? 1 : 0.8)); if (!near) ctx.scale(0.85, 0.85); ctx.scale(L.wingSize || 1, L.wingSize || 1);
      const span = S * (H.has('true_wings') ? 0.62 : 0.55);
      if (H.has('feathered_wings')) {
        for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(-span * (0.25 + i * 0.1), -span * 0.12 + i * 4, span * 0.24, S * 0.035, -0.25 + i * 0.06, 0, Math.PI * 2); ctx.fillStyle = hsl(hue + (near ? 0 : 0) + i * 8, 55, near ? 62 - i * 2 : 45); ctx.fill(); }
      }
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-span * 0.5, -span * 0.55, -span, -span * 0.2);
      for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(-span * (0.85 - i * 0.22), span * 0.02, -span * (0.75 - i * 0.22), -span * 0.12);
      ctx.closePath(); ctx.fillStyle = H.has('feathered_wings') ? hsl(hue + 20, 50, near ? 70 : 50, 0.9) : hsl(hue, 45, near ? 62 : 42, 0.85); ctx.fill();
      if (H.has('true_wings')) for (let i = 0; i < 4; i++) line(0, 0, -span * (0.3 + i * 0.22), -span * (0.45 - i * 0.12), dark, 2);
      ctx.restore();
    }
    if (flying) inBody(() => wing(false));

    // Tail, back parts and the body itself all live in the tilted body frame.
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt); ctx.translate(-cx, -cy);
    // Tail
    if (p.tail) {
      const tx = cx - rx * 0.85; const ty = biped ? cy + ry * 0.5 : cy - ry * 0.2;
      const tk = L.tailSize || 1; ctx.save(); ctx.translate(tx, ty); ctx.scale(tk, tk); ctx.translate(-tx, -ty);
      const tEnd = [cx - rx * (biped ? 2.2 : 1.8), ty - ry * (biped ? -0.3 : 1.0) - Math.sin(t * 2) * 5];
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(cx - rx * 1.5, ty - ry * 0.1, tEnd[0], tEnd[1]);
      ctx.strokeStyle = body; ctx.lineWidth = S * (H.has('club_tail') ? 0.06 : 0.045); ctx.lineCap = 'round'; ctx.stroke();
      if (E.tail) for (let k = 1; k <= E.tail; k++) { const fx = tEnd[0] + 8 * k; const fy = tEnd[1] + 22 * k; ctx.beginPath(); ctx.moveTo(cx - rx * 1.2, ty - ry * 0.3); ctx.quadraticCurveTo(cx - rx * 1.5, ty + ry * 0.4 * k, fx, fy); ctx.strokeStyle = body; ctx.lineWidth = S * 0.035; ctx.stroke(); dot(fx, fy, S * 0.025, accent || body); }
      if (H.has('club_tail')) dot(tEnd[0], tEnd[1], S * 0.05, SHELL);
      if (H.has('display_tail')) ['#f2c14e', '#e46a5c', '#6fd3c7'].forEach((c, i) => { ctx.beginPath(); ctx.ellipse(tEnd[0] - i * 6, tEnd[1] - i * 8, S * 0.025, S * 0.09, -0.6 + i * 0.3, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); });
      if (H.has('stinger_tail')) { tri(tEnd[0], tEnd[1], tEnd[0] + 12, tEnd[1] - 4, tEnd[0] + 4, tEnd[1] + 8, VENOM); }
      if (H.has('glow_tail')) glow(GLOW, 16, () => dot(tEnd[0], tEnd[1], S * 0.03, GLOW));
      if (H.has('prehensile_tail')) { ctx.beginPath(); ctx.arc(tEnd[0], tEnd[1] + 6, 7, Math.PI, Math.PI * 2.6); ctx.strokeStyle = body; ctx.lineWidth = S * 0.03; ctx.stroke(); }
      if (H.has('drop_tail')) for (let k = 1; k <= 3; k++) { const u = k / 4; dot(tx + (tEnd[0] - tx) * u, ty + (tEnd[1] - ty) * u - Math.sin(u * Math.PI) * ry * 0.15, S * 0.024, k % 2 ? dark : light); }
      if (H.has('rattle_tail')) { const sh = Math.sin(t * 30) * 2; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(tEnd[0] - k * 6 + sh, tEnd[1] - k * 2, S * 0.022, S * 0.016, 0.3, 0, Math.PI * 2); ctx.fillStyle = k % 2 ? '#c9b38a' : '#a8916a'; ctx.fill(); } }
      if (H.has('tail_feathers')) for (let k = -2; k <= 2; k++) { ctx.save(); ctx.translate(tEnd[0], tEnd[1]); ctx.rotate(Math.PI + k * 0.28 - 0.2); ctx.beginPath(); ctx.ellipse(S * 0.08, 0, S * 0.09, S * 0.022, 0, 0, Math.PI * 2); ctx.fillStyle = hsl(hue + 20 + k * 12, 55, 60); ctx.fill(); line(0, 0, S * 0.16, 0, hsl(hue, 30, 35), 1); ctx.restore(); }
      if (H.has('spinneret')) { ctx.beginPath(); ctx.moveTo(tEnd[0], tEnd[1]); ctx.quadraticCurveTo(tEnd[0] - S * 0.05, tEnd[1] + S * 0.1, tEnd[0] - S * 0.02 + Math.sin(t) * 4, ground); ctx.strokeStyle = 'rgba(240,240,250,0.7)'; ctx.lineWidth = 1; ctx.stroke(); }
      if (H.has('web_weaver')) { const wx = tEnd[0] - S * 0.12; const wy = tEnd[1] + S * 0.04; ctx.strokeStyle = 'rgba(240,240,250,0.45)'; ctx.lineWidth = 0.8; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(a) * S * 0.12, wy + Math.sin(a) * S * 0.12); ctx.stroke(); } for (let r = 1; r <= 3; r++) { ctx.beginPath(); for (let k = 0; k <= 8; k++) { const a = k * Math.PI / 4; ctx.lineTo(wx + Math.cos(a) * S * 0.04 * r, wy + Math.sin(a) * S * 0.04 * r); } ctx.stroke(); } }
      ctx.restore();
    }

    // Back parts behind body (sized by the editor's back part slider, from the top of the back)
    const backTopX = cx - rx * 0.1; const backTopY = cy - ry * 0.85;
    const bk = L.backSize || 1;
    const backScale = () => { ctx.save(); ctx.translate(backTopX, cy - ry * 0.6); ctx.scale(bk, bk); ctx.translate(-backTopX, -(cy - ry * 0.6)); };
    backScale();
    if (H.has('display_frill') || H.has('lumen_sail')) {
      const isGlow = H.has('lumen_sail');
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI * 0.85 + i * 0.12;
        const draw = () => {
          ctx.beginPath(); ctx.moveTo(backTopX, backTopY + ry * 0.3);
          ctx.lineTo(backTopX + Math.cos(a) * S * 0.3, backTopY + Math.sin(a) * S * 0.3);
          ctx.lineTo(backTopX + Math.cos(a + 0.12) * S * 0.3, backTopY + Math.sin(a + 0.12) * S * 0.3);
          ctx.closePath(); ctx.fillStyle = isGlow ? hsl(175, 80, 70, 0.4 + 0.25 * Math.sin(t * 2 + i)) : hsl(hue + 140 + i * 12, 70, 60); ctx.fill();
        };
        isGlow ? glow(GLOW, 14, draw) : draw();
      }
    }
    if (H.has('fat_hump')) { ctx.beginPath(); ctx.ellipse(backTopX, cy - ry * 0.8, rx * 0.5, ry * 0.7, 0, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill(); }
    if (H.has('carapace')) {
      ctx.beginPath(); ctx.ellipse(cx - rx * 0.05, cy - ry * 0.15, rx * 1.05, ry * 1.25, 0, Math.PI, 0); ctx.fillStyle = SHELL; ctx.fill();
      for (let i = 1; i < 5; i++) { const x = cx - rx + (i / 5) * rx * 2; line(x, cy - ry * 0.2, x - (x - cx) * 0.2, cy - ry * 1.3, '#7f8c93', S * 0.01); }
    }
    if (H.has('egg_sac')) for (let k = 0; k < 7; k++) { const ex = cx - rx * 0.45 + (k % 4) * rx * 0.2 + (k > 3 ? rx * 0.1 : 0); const ey = cy - ry * (k > 3 ? 1.25 : 0.95); dot(ex, ey, S * 0.03, '#f1ead2'); dot(ex - 2, ey - 2, S * 0.01, 'rgba(255,255,255,0.8)'); }

    ctx.restore();
    ctx.restore();

    // Limbs
    function leg(x, top, len, kind, foot, col, swing, front) {
      const gy = top + len;
      const ev = front ? E.frontLimbs : E.hindLimbs;
      const muscle = (H.has(front ? 'thick_muscle_f' : 'thick_muscle_h') ? 1.5 : 1) * legThick;
      if (kind === 'pillar_legs' || kind === 'pillar_forelegs') { ctx.fillStyle = col; ctx.fillRect(x - S * 0.035 * muscle, top, S * 0.07 * muscle, len); }
      else if (kind === 'fore_tentacles' || H.has(front ? 'boneless_f' : '__none')) { wavy(x, top, len + S * 0.02, Math.PI / 2, S * 0.04, t, col, S * 0.03 * muscle, front ? 2 : 0); if (kind === 'fore_tentacles') return; }
      else if (kind === 'stubby_forelegs' || kind === 'stubby_hindlegs') { line(x, top, x + swing * 0.5, gy - 3, col, S * 0.05 * muscle); }
      else if (kind === 'jointed_legs' || kind === 'insect_wings') {
        // Thin armored legs that bend twice, like a beetle's.
        const k1 = [x + S * 0.06, top - len * 0.15]; const k2 = [x + S * 0.09 + swing, top + len * 0.5];
        ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(k1[0], k1[1]); ctx.lineTo(k2[0], k2[1]); ctx.lineTo(x + S * 0.05 + swing, gy);
        ctx.strokeStyle = col; ctx.lineWidth = S * 0.016 * muscle; ctx.lineJoin = 'round'; ctx.stroke();
        dot(k1[0], k1[1], S * 0.012, SHELL); dot(k2[0], k2[1], S * 0.012, SHELL);
        drawFoot(x + S * 0.05 + swing, gy, foot, col, 1); return;
      } else if (kind === 'jumping_legs') {
        // A grasshopper's folded leg: the knee rises high above the body.
        const knee = [x + rx * 0.3, Math.min(top - len * 0.55, cy - ry * 0.95)]; const heel = [x - S * 0.1 + swing, gy - len * 0.15];
        ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(knee[0], knee[1]); ctx.strokeStyle = col; ctx.lineWidth = S * 0.05 * muscle; ctx.lineCap = 'round'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(knee[0], knee[1]); ctx.lineTo(heel[0], heel[1]); ctx.lineTo(heel[0] + S * 0.05, gy); ctx.lineWidth = S * 0.015 * muscle; ctx.stroke();
        for (let i = 1; i < 4; i++) { const u = i / 4; const px = knee[0] + (heel[0] - knee[0]) * u; const py = knee[1] + (heel[1] - knee[1]) * u; line(px, py, px + 4, py - 3, BONE, 1); }
        drawFoot(heel[0] + S * 0.05, gy, foot, col, 1); return;
      }
      else {
        const thick = (kind === 'digging_forelegs' || kind === 'powerful_haunches' ? 0.035 : kind === 'grasping_arms' ? 0.026 : 0.022) * muscle * (ev ? 1.35 : 1);
        const kx = x + (kind === 'runner_legs' || kind === 'hopping_legs' ? -S * 0.05 : S * 0.03) + swing;
        ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(kx, top + len * 0.5); ctx.lineTo(x + swing, gy);
        ctx.strokeStyle = col; ctx.lineWidth = S * thick; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
      }
      // Limb mutations show on the limb itself.
      if (H.has(front ? 'bony_plates_f' : 'bony_plates_h')) for (let i = 0; i < 3; i++) { ctx.fillStyle = SHELL; ctx.fillRect(x - S * 0.03 + swing * (i / 3), top + len * (0.15 + i * 0.25), S * 0.06, S * 0.025); }
      if (H.has(front ? 'thick_muscle_f' : 'thick_muscle_h')) dot(x + swing * 0.3, top + len * 0.25, S * 0.035, col);
      if (front && H.has('skin_flaps_f') && !flying) tri(x, top, x - S * 0.18, top + len * 0.15, x - S * 0.02, top + len * 0.7, hsl(hue, 45, 60, 0.55));
      if (front && H.has('flight_feathers') && !flying) for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(x - S * 0.05 - i * 6, top + len * 0.3 + i * 4, S * 0.05, S * 0.012, -0.5, 0, Math.PI * 2); ctx.fillStyle = hsl(hue + 30 + i * 15, 60, 62); ctx.fill(); }
      if (front && H.has('gripping_pads_f')) dot(x + swing + 4, gy - 4, S * 0.018, '#f3b3a6');
      if (H.has(front ? 'chitin_joints_f' : 'chitin_joints_h')) for (let i = 1; i < 4; i++) dot(x + swing * (i / 4) + (i === 2 ? S * 0.02 : 0), top + len * i / 4, S * 0.013, SHELL);
      if (!front && H.has('springy_tendons_h')) { ctx.beginPath(); for (let i = 0; i <= 6; i++) ctx.lineTo(x - 6 + (i % 2) * 10, top + len * (0.2 + i * 0.1)); ctx.strokeStyle = BONE; ctx.lineWidth = 1.5; ctx.stroke(); }
      drawFoot(x + swing, gy, foot, col, (front ? E.hands : E.feet) ? 1.8 : 1);
    }
    function drawFoot(x, y, foot, col, big) {
      if (!foot) return;
      ctx.save(); ctx.translate(x, y); ctx.scale(big || 1, big || 1); ctx.translate(-x, -y);
      drawFootInner(x, y, foot, col);
      ctx.restore();
    }
    function drawFootInner(x, y, foot, col) {
      if (foot === 'hooves' || foot === 'front_hooves') { ctx.fillStyle = '#3b2f2a'; ctx.fillRect(x - 5, y - 5, 10, 6); }
      else if (foot === 'sharp_claws' || foot === 'raptor_talons' || foot === 'hooked_talons' || foot === 'venom_barbs' || foot === 'venom_spurs') {
        const c = foot.startsWith('venom') ? VENOM : BONE;
        for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x + k * 4 - 2, y - 3); ctx.quadraticCurveTo(x + k * 4 + 7, y - 2, x + k * 4 + 7, y + 3); ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.stroke(); }
      } else if (foot === 'webbed_feet') { tri(x - 4, y, x + 12, y - 1, x + 10, y + 3, col); }
      else if (foot === 'heavy_feet') { ctx.fillStyle = col; ctx.fillRect(x - 8, y - 6, 16, 7); }
      else if (foot === 'grasping_fingers') { for (let k = -1; k <= 1; k++) line(x, y - 2, x + 6 + k, y + 4 + k * 3, col, 2); }
      else if (foot === 'land_pincers' || foot === 'crusher_claws') {
        const big = foot === 'crusher_claws' ? 1.5 : 1; const open = 0.35 + Math.sin(t * 3) * 0.15;
        ctx.save(); ctx.translate(x, y - 4);
        ctx.beginPath(); ctx.ellipse(8 * big, -3 * big, 9 * big, 4 * big, -open, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
        ctx.beginPath(); ctx.ellipse(8 * big, 3 * big, 8 * big, 3 * big, open, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      } else if (foot === 'raptorial_arms' || foot === 'mantis_scythes') {
        const big = foot === 'mantis_scythes' ? 1.5 : 1;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 6 * big, y - 14 * big); ctx.quadraticCurveTo(x + 14 * big, y - 12 * big, x + 12 * big, y - 2 * big); ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.stroke();
        for (let k = 1; k <= 3; k++) line(x + 2 * k * big, y - 4 * k * big, x + 2 * k * big + 4, y - 4 * k * big + 2, BONE, 1);
      } else if (foot === 'sticky_pads' || foot === 'gecko_feet' || foot === 'wall_walkers') { for (let k = -1; k <= 2; k++) { line(x, y - 2, x + 3 + k * 4, y + 1, col, 1.8); dot(x + 3 + k * 4, y + 1, 2.4, '#f3b3a6'); } }
      else if (foot === 'digging_claws') { for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x + k * 4 - 3, y - 4); ctx.quadraticCurveTo(x + k * 4 + 10, y - 3, x + k * 4 + 9, y + 4); ctx.strokeStyle = BONE; ctx.lineWidth = 3; ctx.stroke(); } }
      else if (foot === 'perching_feet') { for (let k = 0; k < 3; k++) line(x, y - 1, x + 8, y - 3 + k * 3, '#c79a4a', 1.6); line(x, y - 1, x - 6, y + 1, '#c79a4a', 1.6); }
      else dot(x + 2, y - 1, 4, col);
    }
    const backCol = hsl(hue, 35, 25);
    // far side
    // Legs hang from where they join the tilted body and always reach the ground.
    const plant = (x, front, dx, col, swing, kind, foot) => { const [ax, ay] = R(x + dx, cy + ry * 0.5); leg(ax, ay, Math.max(S * 0.03, ground - ay), kind, foot, col, swing, front); };
    hindX.forEach((x, i) => p.hindLimbs && plant(x, false, -S * 0.02, backCol, Math.sin(t * 2 + i) * 3, p.hindLimbs, p.feet));
    frontX.forEach((x) => p.frontLimbs && !H.has('wing_membranes') && plant(x, true, -S * 0.02, backCol, Math.sin(t * 2 + 1) * 3, p.frontLimbs, p.hands));
    // Arms: from the shoulders, hanging free, planted as knuckles, or pulling a legless body along.
    const shoulder = (k) => (biped ? [cx + rx * 0.5, cy - ry * (0.45 - k * 0.28)] : crawler ? [cx + rx * (0.65 - k * 0.3), cy + ry * 0.3] : [cx + rx * (0.72 - k * 0.2), cy - ry * 0.05]);
    const drawArms = (near) => {
      if (!arms || !p.frontLimbs) return;
      for (let k = 0; k < arms; k++) {
        const [bx, by] = shoulder(k); const [sx, sy] = R(bx + (near ? S * 0.02 : -S * 0.02), by);
        const col = near ? dark : backCol; const sw = Math.sin(t * 1.5 + k + (near ? 0 : 1)) * 4;
        if (H.has('wing_membranes')) { if (near) tri(sx, sy, sx - S * 0.3, sy + S * 0.05, sx - S * 0.05, sy + S * 0.25, hsl(hue, 50, 65, 0.5)); continue; }
        if (knuckle || crawler) leg(sx, sy, Math.max(S * 0.03, ground - sy), p.frontLimbs, p.hands, col, sw * 0.5, true);
        else leg(sx, sy, armReach, p.frontLimbs, p.hands, col, sw, true);
      }
    };
    drawArms(false);

    // Body
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt); ctx.translate(-cx, -cy);
    if (L.shape === 'pear') { ctx.beginPath(); ctx.ellipse(cx - rx * 0.45, cy + ry * 0.15, rx * 0.6, ry * 1.05, 0, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill(); }
    if (L.shape === 'hunched') { ctx.beginPath(); ctx.ellipse(cx - rx * 0.05, cy - ry * 0.55, rx * 0.6, ry * 0.75, 0, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill(); }
    ctx.save(); ctx.translate(cx, cy); ctx.scale(2 - wob, wob);
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    const grad = ctx.createLinearGradient(0, -ry, 0, ry); grad.addColorStop(0, light); grad.addColorStop(0.55, body); grad.addColorStop(1, bellyCol(L, hue) || body);
    ctx.fillStyle = grad; ctx.fill();
    ctx.clip();
    if (accent) { ctx.globalAlpha = 0.45; for (let i = -3; i <= 3; i++) line(-rx + i * rx * 0.35, -ry, -rx + i * rx * 0.35 + rx * 0.3, ry, accent, S * 0.008); ctx.globalAlpha = 1; }
    pattern(L, rx, ry, S, hue, t);
    if (nSeg >= 4) for (let i = 1; i < nSeg; i++) { const x = -rx + (i / nSeg) * rx * 2; ctx.beginPath(); ctx.moveTo(x, -ry); ctx.quadraticCurveTo(x + rx * 0.06, 0, x, ry); ctx.strokeStyle = dark; ctx.lineWidth = 1.5; ctx.stroke(); }
    if (H.has('scales') || H.has('swift_scales')) {
      for (let y = -ry; y < ry; y += S * 0.03) for (let x = -rx; x < rx; x += S * 0.04) {
        const off = (Math.round(y / (S * 0.03)) % 2) * S * 0.02;
        ctx.beginPath(); ctx.arc(x + off, y, S * 0.018, 0, Math.PI); ctx.strokeStyle = hsl(hue, 40, 40, 0.6); ctx.lineWidth = 1.2; ctx.stroke();
      }
    }
    if (H.has('lichen_hide') || H.has('moss_garden')) [[-0.5, -0.5], [0.1, -0.7], [0.5, -0.3], [-0.2, 0.2], [-0.7, 0.1]].forEach(([dx, dy], i) => dot(dx * rx, dy * ry, S * (0.025 + (i % 2) * 0.012), PLANT));
    if (H.has('warning_skin')) [[-0.5, -0.3], [0, -0.5], [0.45, -0.1], [-0.15, 0.25], [-0.75, 0.2]].forEach(([dx, dy]) => { dot(dx * rx, dy * ry, S * 0.028, '#f2c14e'); dot(dx * rx, dy * ry, S * 0.012, '#1c1414'); });
    if (H.has('biolume_skin')) glow(GLOW, 10, () => { for (let i = 0; i < 9; i++) dot(-rx * 0.8 + i * rx * 0.2, Math.sin(i) * ry * 0.4, S * 0.01 * (1.2 + 0.5 * Math.sin(t * 3 + i)), GLOW); });
    if (H.has('bright_plumage')) for (let i = 0; i < 6; i++) dot(-rx * 0.7 + i * rx * 0.28, -ry * 0.2 + (i % 2) * ry * 0.3, S * 0.03, hsl(hue + 120 + i * 30, 70, 60));
    if (H.has('mottled_skin')) for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(-rx * 0.85 + prand(i) * rx * 1.7, -ry * 0.8 + prand(i + 9) * ry * 1.4, S * (0.025 + prand(i + 3) * 0.03), S * (0.018 + prand(i + 5) * 0.02), prand(i + 7) * 3, 0, Math.PI * 2); ctx.fillStyle = i % 2 ? hsl(hue + 30, 30, 32, 0.6) : hsl(90, 25, 38, 0.55); ctx.fill(); }
    if (H.has('down_feathers')) for (let y = -ry; y < ry * 0.7; y += S * 0.035) for (let x = -rx; x < rx; x += S * 0.045) { ctx.beginPath(); ctx.arc(x + (Math.round(y / (S * 0.035)) % 2) * S * 0.022, y, S * 0.024, 0, Math.PI); ctx.fillStyle = hsl(hue + 15, 35, 72, 0.35); ctx.fill(); }
    if (H.has('chitin')) { for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * rx * 0.28, -ry); ctx.quadraticCurveTo(i * rx * 0.28 + rx * 0.05, 0, i * rx * 0.28, ry); ctx.strokeStyle = hsl(hue, 30, 22, 0.7); ctx.lineWidth = 2; ctx.stroke(); } ctx.beginPath(); ctx.ellipse(-rx * 0.15, -ry * 0.5, rx * 0.55, ry * 0.15, -0.1, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fill(); }
    if (H.has('mucus_skin')) { ctx.beginPath(); ctx.ellipse(-rx * 0.2, -ry * 0.45, rx * 0.5, ry * 0.16, -0.1, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill(); for (let i = 0; i < 5; i++) dot(-rx * 0.6 + i * rx * 0.3, -ry * 0.1 + (i % 2) * ry * 0.3, S * 0.008, 'rgba(255,255,255,0.6)'); }
    if (frame === 'shell') for (let i = 1; i < 6; i++) { const x = -rx + (i / 6) * rx * 2; ctx.beginPath(); ctx.moveTo(x, -ry); ctx.quadraticCurveTo(x + rx * 0.08, 0, x, ry); ctx.strokeStyle = hsl(hue, 30, 25, 0.55); ctx.lineWidth = 2; ctx.stroke(); }
    finish(L, 0, 0, rx, ry);
    ctx.restore();
    if (frame === 'shell') { ctx.save(); ctx.translate(cx, cy); ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.strokeStyle = hsl(hue, 35, 22); ctx.lineWidth = Math.max(2, S * 0.012); ctx.stroke(); ctx.restore(); }
    if (H.has('exoskeleton')) { ctx.beginPath(); ctx.ellipse(cx, cy, rx * 1.01, ry * 1.01, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.strokeStyle = SHELL; ctx.lineWidth = 3; ctx.stroke(); }
    if (E.skin) glow(accent || GLOW, 14, () => { ctx.beginPath(); ctx.ellipse(cx, cy, rx * 1.02, ry * 1.02, 0, 0, Math.PI * 2); ctx.strokeStyle = accent || GLOW; ctx.lineWidth = 3; ctx.stroke(); });
    backScale();
    if (E.back) for (let i = 0; i < 5 + E.back * 2; i++) {
      const a = Math.PI * 1.1 + i * (0.8 / (5 + E.back * 2)); const x = cx + Math.cos(a) * rx * 1.02; const y = cy + Math.sin(a) * ry * 1.02;
      tri(x - 7, y + 3, x - 2, y - S * (0.11 + 0.03 * E.back) * (0.7 + 0.3 * Math.sin(i * 1.7)), x + 7, y + 3, accent || BONE);
    }
    ctx.restore();
    if (H.has('fur')) for (let a = Math.PI * 1.05; a < Math.PI * 1.95; a += 0.09) { const x = cx + Math.cos(a) * rx; const y = cy + Math.sin(a) * ry; line(x, y, x + Math.cos(a) * 6, y + Math.sin(a) * 9, dark, 2); }
    backScale();
    if (H.has('back_spines') || H.has('venom_quills')) {
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * 1.15 + i * 0.11; const x = cx + Math.cos(a) * rx; const y = cy + Math.sin(a) * ry;
        if (H.has('venom_quills')) line(x, y, x - S * 0.05, y - S * 0.11, VENOM, S * 0.008);
        else tri(x - 6, y + 2, x, y - S * 0.07, x + 6, y + 2, BONE);
      }
    }
    if (H.has('moss_garden')) for (let i = 0; i < 6; i++) dot(cx - rx * 0.6 + i * rx * 0.22, cy - ry * 0.95 + Math.abs(i - 2.5) * 3, S * 0.025, PLANT);
    if (H.has('segment_plates')) for (let i = 0; i < 6; i++) { const x = cx - rx * 0.75 + i * rx * 0.3; ctx.beginPath(); ctx.ellipse(x, cy - ry * 0.35, rx * 0.2, ry * 0.75, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.lineTo(x, cy - ry * 0.35); ctx.closePath(); ctx.fillStyle = hsl(hue, 22, 48 - (i % 2) * 6); ctx.fill(); ctx.strokeStyle = hsl(hue, 25, 25); ctx.lineWidth = 1.2; ctx.stroke(); }
    if (H.has('snail_shell')) {
      const big = H.has('citadel_shell') ? 1.3 : 1; const sx0 = biped ? cx - rx * 0.75 : cx - rx * 0.1; const sy0 = biped ? cy - ry * 0.15 : cy - ry * 0.95; const R0 = (biped ? Math.min(ry * 0.75, rx * 1.1) : ry * 1.15) * big;
      dot(sx0, sy0, R0, '#e3cfa6'); ctx.beginPath();
      for (let a = 0; a < Math.PI * 5; a += 0.2) { const r = R0 * (1 - a / (Math.PI * 5.5)); ctx.lineTo(sx0 + Math.cos(a) * r, sy0 + Math.sin(a) * r); }
      ctx.strokeStyle = '#8f6a43'; ctx.lineWidth = 2.2; ctx.stroke();
      if (H.has('citadel_shell')) for (let k = 0; k < 6; k++) { const a = Math.PI * 1.1 + k * 0.17; tri(sx0 + Math.cos(a) * R0 * 0.95 - 4, sy0 + Math.sin(a) * R0 * 0.95, sx0 + Math.cos(a) * R0 * 1.3, sy0 + Math.sin(a) * R0 * 1.3, sx0 + Math.cos(a) * R0 * 0.95 + 4, sy0 + Math.sin(a) * R0 * 0.95, SHELL); }
    }
    if (H.has('rolling_armor')) for (let i = 0; i < 6; i++) { const x = cx - rx * 0.75 + i * rx * 0.3; tri(x - 4, cy - ry * 1.05, x, cy - ry * 1.6, x + 4, cy - ry * 1.05, BONE); }
    ctx.restore();
    ctx.restore();

    // Near side legs
    hindX.forEach((x, i) => p.hindLimbs && plant(x, false, S * 0.03, dark, Math.sin(t * 2 + i + 1) * 3, p.hindLimbs, p.feet));
    frontX.forEach((x) => {
      if (H.has('wing_membranes')) { inBody(() => tri(x, cy - ry * 0.2, x - S * 0.35, cy - ry * 1.6, x - S * 0.1, cy + ry * 0.2, hsl(hue, 50, 65, 0.5))); plant(x, true, S * 0.03, dark, 0, 'slender_forelegs', p.hands); }
      else if (p.frontLimbs) plant(x, true, S * 0.03, dark, Math.sin(t * 2 + 2) * 3, p.frontLimbs, p.hands);
    });
    drawArms(true);

    if (flying) inBody(() => wing(true));

    // Neck and head
    if (pos !== 'tucked') { ctx.beginPath(); ctx.moveTo(neckBase[0], neckBase[1]); ctx.lineTo(hx, hy);
      ctx.strokeStyle = body; ctx.lineWidth = S * (longNeck ? 0.075 : 0.09) * Math.max(0.8, Math.min(1.3, L.headSize || 1)); ctx.lineCap = 'round'; ctx.stroke(); }
    // The head mostly stays level as the body tilts, plus the editor's head angle.
    const headAngle = (L.headTilt || 0) - tilt * 0.6;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(headAngle); ctx.translate(-hx, -hy);
    drawHead(p, hx, hy, hr, hue, body, dark, t, S, L);
    ctx.restore();
    if (FACE && headAngle) {
      const rot = (x, y) => [hx + (x - hx) * Math.cos(headAngle) - (y - hy) * Math.sin(headAngle), hy + (x - hx) * Math.sin(headAngle) + (y - hy) * Math.cos(headAngle)];
      [FACE.x, FACE.y] = rot(FACE.x, FACE.y); [FACE.mx, FACE.my] = rot(FACE.mx, FACE.my); FACE.top = rot(FACE.x, FACE.top)[1];
    }
  }

  function drawHead(p, hx, hy, hr, hue, body, dark, t, S, L) {
    L = L || {};
    const H = p.__H; const E = p.__E;
    if (H.has('great_ears')) [-0.5, -0.1].forEach((dx) => tri(hx + dx * hr - 6, hy - hr * 0.6, hx + dx * hr - 14, hy - hr * 2, hx + dx * hr + 8, hy - hr * 0.7, dark));
    if (L.head === 'snout') { ctx.beginPath(); ctx.ellipse(hx + hr * 0.7, hy + hr * 0.15, hr * 0.95, hr * 0.5, 0.1, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill(); }
    if (L.head === 'big') dot(hx - hr * 0.15, hy - hr * 0.45, hr * 0.95, body);
    if (L.head === 'crest') tri(hx - hr * 0.9, hy - hr * 0.2, hx - hr * 0.3, hy - hr * 2, hx + hr * 0.3, hy - hr * 0.6, dark);
    if (L.head === 'flat') { ctx.beginPath(); ctx.ellipse(hx, hy + hr * 0.15, hr * 1.3, hr * 0.7, 0, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill(); }
    else dot(hx, hy, hr, body);
    if (H.has('horned_brow')) [0.1, -0.3].forEach((dx) => { ctx.beginPath(); ctx.moveTo(hx + dx * hr - 5, hy - hr * 0.7); ctx.quadraticCurveTo(hx + dx * hr - 10, hy - hr * 2, hx + dx * hr + 12, hy - hr * 2.1); ctx.lineTo(hx + dx * hr + 5, hy - hr * 0.8); ctx.fillStyle = BONE; ctx.fill(); });
    if (H.has('antennae')) { wavy(hx - hr * 0.2, hy - hr * 0.8, hr * 1.6, -Math.PI * 0.6, 4, t, dark, 2); wavy(hx + hr * 0.2, hy - hr * 0.8, hr * 1.6, -Math.PI * 0.35, 4, t, dark, 2, 1.5); }
    const mx = hx + hr * 0.9; const my = hy + hr * 0.25;
    const m = p.mouth;
    // A bigger jaw: a heavier lower jaw under the mouth.
    const jaw = L.jaw || 1;
    if (jaw > 1.05) { ctx.beginPath(); ctx.ellipse(hx + hr * 0.45, hy + hr * 0.55, hr * 0.6 * jaw, hr * 0.32 * jaw, 0.15, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill(); line(hx + hr * 0.1, hy + hr * 0.45, hx + hr * (0.6 + 0.4 * jaw), hy + hr * 0.4, dark, 2); }
    ctx.save(); ctx.translate(mx, my); ctx.scale(jaw, jaw); ctx.translate(-mx, -my);
    if (H.has('grinding_beak')) tri(mx - 6, my - hr * 0.35, mx + hr * 0.7, my, mx - 6, my + hr * 0.3, '#e0b04c');
    if (H.has('seed_beak')) { tri(mx - 8, my - hr * 0.4, mx + hr * 0.5, my - hr * 0.02, mx - 8, my, '#d9a441'); tri(mx - 8, my, mx + hr * 0.42, my + hr * 0.02, mx - 8, my + hr * 0.3, '#b9862f'); }
    if (H.has('hooked_beak')) { const big = H.has('raptor_beak') ? 1.25 : 1; ctx.beginPath(); ctx.moveTo(mx - 8, my - hr * 0.4 * big); ctx.quadraticCurveTo(mx + hr * 0.9 * big, my - hr * 0.45 * big, mx + hr * 0.75 * big, my + hr * 0.3 * big); ctx.lineTo(mx + hr * 0.45 * big, my + hr * 0.05); ctx.lineTo(mx - 8, my + hr * 0.2); ctx.closePath(); ctx.fillStyle = '#e8b84a'; ctx.fill(); ctx.strokeStyle = '#7a5a20'; ctx.lineWidth = 1.2; ctx.stroke(); }
    if (H.has('sticky_tongue')) { const out = Math.max(0, Math.sin(t * 1.7)) ** 6 * hr * (H.has('harpoon_tongue') ? 2.6 : 1.6); if (out > 1) { line(mx - 2, my + 2, mx + out, my + 2 + out * 0.1, '#e57a8a', 2.5); dot(mx + out, my + 2 + out * 0.1, 3.5, '#e57a8a'); } }
    if (H.has('fangs') || H.has('venom_fangs') || H.has('lure_jaw') || H.has('crushing_jaws')) {
      line(mx - hr * 0.5, my, mx + 2, my, hsl(hue, 30, 15), 3);
      const c = H.has('venom_fangs') ? VENOM : BONE;
      [0, 1].forEach((k) => tri(mx - hr * 0.3 + k * 8, my, mx - hr * 0.25 + k * 8, my + hr * (H.has('crushing_jaws') ? 0.25 : 0.4), mx - hr * 0.15 + k * 8, my, c));
    }
    if (H.has('lure_jaw')) { ctx.beginPath(); ctx.moveTo(hx, hy - hr); ctx.quadraticCurveTo(hx + hr * 1.5, hy - hr * 2.4, hx + hr * 2, hy - hr * 0.8); ctx.strokeStyle = dark; ctx.lineWidth = 2; ctx.stroke(); glow(GLOW, 18, () => dot(hx + hr * 2, hy - hr * 0.8 + Math.sin(t * 3) * 3, S * 0.022, GLOW)); }
    if (H.has('mandibles')) [-1, 1].forEach((s) => { ctx.beginPath(); ctx.moveTo(mx - 4, my + s * 3); ctx.quadraticCurveTo(mx + hr * 0.6, my + s * hr * 0.5, mx + hr * 0.5, my + s); ctx.strokeStyle = dark; ctx.lineWidth = 4; ctx.stroke(); });
    if (H.has('trunk')) { ctx.beginPath(); ctx.moveTo(mx - 4, my - 2); ctx.quadraticCurveTo(mx + hr * 1.1, my + hr * 0.3, mx + hr * 0.6 + Math.sin(t * 1.5) * 4, my + hr * 1.6); ctx.strokeStyle = body; ctx.lineWidth = S * 0.035; ctx.lineCap = 'round'; ctx.stroke(); }
    if (H.has('baleen')) for (let k = 0; k < 5; k++) line(mx - hr * 0.5 + k * 4, my - 2, mx - hr * 0.5 + k * 4, my + hr * 0.4, BONE, 1.5);
    ctx.restore();
    const ex = hx + hr * 0.25; const ey = hy - hr * 0.25;
    const huge = H.has('big_eyes') || L.eyes === 'huge';
    const es = L.eyeSize || 1;
    FACE = { x: ex, y: ey, r: hr * (huge ? 0.42 : 0.22) * es, mx: hx + hr * 0.5, my: hy + hr * 0.55, top: hy - hr * 1.15, skin: body, s: S * 0.5 };
    if (H.has('compound_eyes')) { const cr = hr * (H.has('mosaic_eyes') ? 0.5 : 0.38) * es; dot(ex, ey, cr, '#2c2238'); for (let k = 0; k < 9; k++) { const a = k * 2.4; const r = cr * 0.6 * Math.sqrt((k + 0.5) / 9); dot(ex + Math.cos(a) * r, ey + Math.sin(a) * r, cr * 0.16, hsl(160 + k * 20, 50, 45, 0.8)); } dot(ex - cr * 0.35, ey - cr * 0.4, cr * 0.18, 'rgba(255,255,255,0.7)'); }
    else if (huge) { dot(ex, ey, hr * 0.42 * es, '#fff'); dot(ex + hr * 0.1, ey, hr * 0.22 * es, '#1c1414'); dot(ex + hr * 0.18, ey - hr * 0.1, hr * 0.07 * es, '#fff'); }
    else if (H.has('glow_eyes')) glow(GLOW, 14, () => dot(ex, ey, hr * 0.25 * es, GLOW));
    else { dot(ex, ey, hr * 0.2 * es, '#fff'); dot(ex + hr * 0.06, ey, hr * 0.11 * es, '#1c1414'); }
    // Extra eyes from the editor, around the back and top of the head.
    for (let k = 1; k < Math.min(6, L.eyeCount || 1); k++) { const a = -3.0 + (k - 1) * 0.42; const ax = hx + Math.cos(a) * hr * 0.72; const ay = hy + Math.sin(a) * hr * 0.72; dot(ax, ay, hr * 0.15 * es, '#fff'); dot(ax + 1, ay, hr * 0.08 * es, '#1c1414'); }
    if (H.has('tremor_whiskers') || H.has('electroreceptors')) for (let k = -1; k <= 1; k++) line(mx - 4, my - 4, mx + hr * 0.9, my - 4 + k * hr * 0.35, BONE, 1.2);
    if (H.has('heat_pits')) for (let k = 0; k < 3; k++) dot(mx - hr * 0.35 + k * 4, my - hr * 0.22, 1.8, hsl(hue, 40, 18));
    if (H.has('heat_sight')) glow('#ff7a4a', 8, () => { for (let k = 0; k < 3; k++) dot(mx - hr * 0.35 + k * 4, my - hr * 0.22, 1.4, '#ff9a5a'); });
    const er = FACE.r;
    if (E && E.senses) for (let k = 0; k < Math.min(3, E.senses + 1); k++) { const ax = hx - hr * 0.35 + k * hr * 0.3; const ay = hy - hr * 0.75 - (k % 2) * hr * 0.15; dot(ax, ay, hr * 0.13, '#fff'); dot(ax + 1, ay, hr * 0.07, '#1c1414'); }
    if (E && E.mouth) for (let k = 0; k < 4; k++) tri(mx - hr * 0.55 + k * 6, my + 2, mx - hr * 0.5 + k * 6, my - hr * 0.3, mx - hr * 0.45 + k * 6, my + 2, BONE);
    if (L.eyes === 'sleepy') { ctx.beginPath(); ctx.arc(ex, ey, er * 1.05, Math.PI, Math.PI * 2); ctx.fillStyle = body; ctx.fill(); }
    if (L.eyes === 'fierce') line(ex - er * 1.3, ey - er * 1.5, ex + er * 1.2, ey - er * 0.6, dark, Math.max(2, er * 0.45));
  }

  // ======================= SEA CREATURE =======================
  function drawSea(b, cx, cy, S, t) {
    const hue = b.hue;
    const { p, accent, L, H, E } = look(b);
    const body = hsl(hue, 50, 55); const dark = hsl(hue, 40, 30); const light = hsl(hue, 60, 72);
    const SEA_SHAPES = { long: [1.2, 1], slim: [0.95, 0.8], round: [1, b.look ? 1.12 : 1], torpedo: [1.12, 0.82], ray: [0.85, 0.55], puffer: [0.72, 1.7], deep: [0.78, 1.7] };
    const [sx, sy] = SEA_SHAPES[L.shape] || [1, 1];
    const rx = S * 0.33 * sx * (L.bodyLen || 1); const ry = S * 0.13 * sy * (L.bodyHeight || 1);
    const y0 = cy + Math.sin(t * 1.4) * 3;
    const tailX = cx - rx * 0.95;
    const sw = Math.sin(t * 3) * 0.25;

    // Tail
    ctx.save(); ctx.translate(tailX, y0); ctx.rotate(sw * 0.4); ctx.scale(L.tailSize || 1, L.tailSize || 1);
    if (H.has('thresher_tail') || H.has('whip_lash')) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-S * 0.2, -S * 0.05, -S * 0.42, -S * 0.2 + sw * 20); ctx.quadraticCurveTo(-S * 0.2, -S * 0.01, 0, S * 0.03); ctx.fillStyle = dark; ctx.fill(); tri(0, 0, -S * 0.1, S * 0.08, -S * 0.06, 0, dark); }
    if (H.has('paddle_tail') || H.has('whip_lash')) { ctx.beginPath(); ctx.ellipse(-S * 0.1, 0, S * 0.12, S * 0.07, 0, 0, Math.PI * 2); ctx.fillStyle = dark; ctx.fill(); }
    if (H.has('jet_siphon') || H.has('jet_drive')) { ctx.beginPath(); ctx.ellipse(-S * 0.03, S * 0.03, S * 0.06, S * 0.03, 0, 0, Math.PI * 2); ctx.fillStyle = hsl(hue, 40, 40); ctx.fill(); for (let k = 0; k < 4; k++) { const ph = (t * 1.5 + k * 0.25) % 1; ctx.beginPath(); ctx.arc(-S * (0.1 + ph * 0.25), S * 0.03 + Math.sin(k * 3) * 6, 2 + ph * 4, 0, Math.PI * 2); ctx.strokeStyle = `rgba(220,245,255,${0.7 * (1 - ph)})`; ctx.lineWidth = 1.2; ctx.stroke(); } }
    if (H.has('fluke') || (!p.tail && !H.has('jet_siphon'))) { tri(0, 0, -S * 0.2, -S * 0.12, -S * 0.12, 0, dark); tri(0, 0, -S * 0.2, S * 0.12, -S * 0.12, 0, dark); }
    if (E.tail) for (let k = 1; k <= E.tail + 1; k++) tri(0, 0, -S * (0.24 + 0.04 * k), (k % 2 ? -1 : 1) * S * (0.06 + 0.05 * k), -S * 0.14, 0, accent || dark);
    else if (H.has('stinger_tail')) { line(0, 0, -S * 0.22, -S * 0.05, body, S * 0.03); tri(-S * 0.22, -S * 0.05, -S * 0.28, -S * 0.1, -S * 0.27, 0, VENOM); }
    else if (H.has('display_tail')) for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(-S * 0.12, i * 8, S * 0.12, S * 0.02, i * 0.2, 0, Math.PI * 2); ctx.fillStyle = hsl(hue + 140 + i * 20, 70, 60); ctx.fill(); }
    else if (H.has('glow_tail')) { line(0, 0, -S * 0.18, 0, body, S * 0.03); glow(GLOW, 16, () => dot(-S * 0.2, 0, S * 0.03, GLOW)); }
    else if (H.has('prehensile_tail') || H.has('seahorse_tail')) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-S * 0.15, S * 0.05, -S * 0.15, S * 0.12); ctx.arc(-S * 0.12, S * 0.12, S * 0.03, Math.PI, Math.PI * 2.5); ctx.strokeStyle = body; ctx.lineWidth = S * 0.025; ctx.stroke(); }
    ctx.restore();

    // Ray wings sit behind the body
    if (L.shape === 'ray') { const flap = Math.sin(t * 2.2) * ry * 1.2; ctx.beginPath(); ctx.moveTo(cx + rx * 0.9, y0); ctx.quadraticCurveTo(cx - rx * 0.1, y0 - ry * 6 - flap, cx - rx * 0.7, y0); ctx.quadraticCurveTo(cx - rx * 0.1, y0 + ry * 6 + flap, cx + rx * 0.9, y0); ctx.fillStyle = hsl(hue, 50, 62); ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = 1.5; ctx.stroke(); }
    if (L.fins === 'flowing') for (let k = -1; k <= 1; k += 2) wavy(cx - rx * 0.2, y0 + k * ry * 0.7, S * 0.22, Math.PI - k * 0.5, 5, t, hsl(hue, 55, 62, 0.7), S * 0.03, k);
    // Sail fin, angler rod and arms behind the body (the dorsal ones sized by the editor)
    const dk = L.backSize || 1; ctx.save(); ctx.translate(cx, y0 - ry * 0.8); ctx.scale(dk, dk); ctx.translate(-cx, -(y0 - ry * 0.8));
    if (H.has('sail_fin') || H.has('great_sail')) { const tall = H.has('great_sail') ? 3.6 : 2.8; ctx.beginPath(); ctx.moveTo(cx - rx * 0.6, y0 - ry * 0.8); ctx.quadraticCurveTo(cx - rx * 0.3, y0 - ry * tall, cx + rx * 0.4, y0 - ry * (tall - 0.4)); ctx.lineTo(cx + rx * 0.4, y0 - ry * 0.8); ctx.closePath(); ctx.fillStyle = hsl(hue + 200, 55, 45, 0.85); ctx.fill(); for (let i = 0; i < 7; i++) line(cx - rx * 0.5 + i * rx * 0.14, y0 - ry * 0.8, cx - rx * 0.45 + i * rx * 0.14, y0 - ry * (tall - 0.6), dark, 1.2); }
    if (H.has('angler_rod')) { const tx = cx + rx * 1.2; const ty = y0 - ry * 1.6 + Math.sin(t * 2) * 4; ctx.beginPath(); ctx.moveTo(cx + rx * 0.3, y0 - ry * 0.8); ctx.quadraticCurveTo(cx + rx * 0.7, y0 - ry * 3.2, tx, ty); ctx.strokeStyle = dark; ctx.lineWidth = 2; ctx.stroke(); glow(GLOW, 18, () => dot(tx, ty, S * 0.025, GLOW)); }
    if (H.has('feeding_arms') || H.has('clever_arms') || H.has('death_veil')) for (let k = 0; k < 2; k++) { const len = S * (0.32 + k * 0.05); wavy(cx + rx * 0.8, y0 + ry * 0.4, len, 0.25 + k * 0.25, 4, t, dark, S * 0.014, k + 3); dot(cx + rx * 0.8 + Math.cos(0.25 + k * 0.25) * len, y0 + ry * 0.4 + Math.sin(0.25 + k * 0.25) * len, S * 0.022, hsl(hue, 40, 40)); }
    if (H.has('stinging_arms') || H.has('death_veil')) for (let k = 0; k < 6; k++) wavy(cx + rx * 0.2 - k * rx * 0.15, y0 + ry * 0.8, S * 0.3, Math.PI / 2 + 0.2, 5, t, hsl(280, 60, 72, 0.8), 1.5, k);
    if (H.has('feather_arms') || H.has('sorting_claws')) for (let k = 0; k < 3; k++) { const ax = cx + rx * 0.75; const ay = y0 + ry * 0.3; const a = -0.3 + k * 0.4 + Math.sin(t * 2 + k) * 0.1; const ex = ax + Math.cos(a) * S * 0.2; const ey = ay + Math.sin(a) * S * 0.2; line(ax, ay, ex, ey, dark, 2); for (let j = 1; j <= 5; j++) { const fx = ax + (ex - ax) * j / 6; const fy = ay + (ey - ay) * j / 6; line(fx, fy, fx + 4, fy - 6, light, 1.2); line(fx, fy, fx + 4, fy + 6, light, 1.2); } }

    // Dorsal
    if (H.has('dorsal_fin')) tri(cx - rx * 0.3, y0 - ry * 0.85, cx - rx * 0.05, y0 - ry * 2.2, cx + rx * 0.25, y0 - ry * 0.85, dark);
    if (H.has('display_frill') || H.has('lumen_sail')) {
      const isGlow = H.has('lumen_sail');
      for (let i = 0; i < 6; i++) { const draw = () => tri(cx - rx * 0.5 + i * rx * 0.18, y0 - ry * 0.8, cx - rx * 0.42 + i * rx * 0.18, y0 - ry * 2, cx - rx * 0.34 + i * rx * 0.18, y0 - ry * 0.8, isGlow ? hsl(175, 80, 70, 0.5) : hsl(hue + 140 + i * 15, 70, 60)); isGlow ? glow(GLOW, 12, draw) : draw(); }
    }
    if (H.has('carapace')) { ctx.beginPath(); ctx.ellipse(cx, y0 - ry * 0.2, rx * 0.8, ry * 1.25, 0, Math.PI, 0); ctx.fillStyle = SHELL; ctx.fill(); }
    if (H.has('fat_hump')) { ctx.beginPath(); ctx.ellipse(cx - rx * 0.1, y0 - ry * 0.8, rx * 0.4, ry * 0.6, 0, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill(); }
    if (H.has('egg_sac')) for (let k = 0; k < 6; k++) dot(cx - rx * 0.4 + (k % 3) * rx * 0.2 + (k > 2 ? rx * 0.1 : 0), y0 - ry * (k > 2 ? 1.25 : 0.95), S * 0.028, '#f1ead2');
    if (H.has('segment_plates')) for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(cx - rx * 0.7 + i * rx * 0.28, y0 - ry * 0.2, rx * 0.17, ry * 0.85, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.fillStyle = hsl(hue, 22, 48 - (i % 2) * 6); ctx.fill(); }
    if (H.has('kelp_garden')) for (let i = 0; i < 5; i++) wavy(cx - rx * 0.5 + i * rx * 0.2, y0 - ry * 0.8, S * 0.12, -Math.PI / 2, 4, t, PLANT, 3, i);
    if (H.has('back_spines') || H.has('venom_quills')) for (let i = 0; i < 6; i++) { const x = cx - rx * 0.6 + i * rx * 0.22; H.has('venom_quills') ? line(x, y0 - ry * 0.8, x - 6, y0 - ry * 1.9, VENOM, 2) : tri(x - 5, y0 - ry * 0.8, x, y0 - ry * 1.6, x + 5, y0 - ry * 0.8, BONE); }
    ctx.restore();

    // Hind fins / tentacles (far)
    if (H.has('sea_tentacles')) for (let i = 0; i < 4; i++) wavy(cx - rx * 0.2 + i * 10, y0 + ry * 0.7, S * 0.25, Math.PI / 2 + 0.3, S * 0.04, t, dark, S * 0.018, i);

    // Body
    ctx.save();
    ctx.beginPath(); ctx.ellipse(cx, y0, rx, ry, 0, 0, Math.PI * 2);
    const grad = ctx.createLinearGradient(cx, y0 - ry, cx, y0 + ry); grad.addColorStop(0, body); grad.addColorStop(1, bellyCol(L, hue) || light);
    ctx.fillStyle = grad; ctx.fill(); ctx.clip();
    if (accent) { ctx.globalAlpha = 0.45; for (let i = -3; i <= 3; i++) line(cx + i * rx * 0.3, y0 - ry, cx + i * rx * 0.3 + rx * 0.2, y0 + ry, accent, S * 0.008); ctx.globalAlpha = 1; }
    ctx.save(); ctx.translate(cx, y0); pattern(L, rx, ry, S, hue, t); ctx.restore();
    if (H.has('scales') || H.has('swift_scales')) for (let y = y0 - ry; y < y0 + ry; y += S * 0.03) for (let x = cx - rx; x < cx + rx; x += S * 0.04) { ctx.beginPath(); ctx.arc(x + ((Math.round((y - y0) / (S * 0.03)) % 2) * S * 0.02), y, S * 0.018, 0, Math.PI); ctx.strokeStyle = hsl(hue, 40, 40, 0.6); ctx.lineWidth = 1.2; ctx.stroke(); }
    if (H.has('chitin')) for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(cx + i * rx * 0.28, y0 - ry); ctx.quadraticCurveTo(cx + i * rx * 0.28 + rx * 0.05, y0, cx + i * rx * 0.28, y0 + ry); ctx.strokeStyle = hsl(hue, 30, 22, 0.7); ctx.lineWidth = 2; ctx.stroke(); }
    if (skel(b) === 'shell') for (let i = 1; i < 6; i++) { const x = cx - rx + (i / 6) * rx * 2; ctx.beginPath(); ctx.moveTo(x, y0 - ry); ctx.quadraticCurveTo(x + rx * 0.06, y0, x, y0 + ry); ctx.strokeStyle = hsl(hue, 30, 25, 0.45); ctx.lineWidth = 2; ctx.stroke(); }
    if (H.has('warning_skin')) [[-0.5, -0.3], [0, -0.4], [0.4, 0], [-0.2, 0.3]].forEach(([dx, dy]) => { dot(cx + dx * rx, y0 + dy * ry, S * 0.025, '#f2c14e'); dot(cx + dx * rx, y0 + dy * ry, S * 0.01, '#1c1414'); });
    if (H.has('biolume_skin')) glow(GLOW, 10, () => { for (let i = 0; i < 9; i++) dot(cx - rx * 0.8 + i * rx * 0.2, y0 + Math.sin(i) * ry * 0.4, S * 0.01 * (1.2 + 0.5 * Math.sin(t * 3 + i)), GLOW); });
    if (H.has('cleaner_skin')) for (let i = 0; i < 5; i++) dot(cx - rx * 0.6 + i * rx * 0.3, y0 + ry * 0.3, S * 0.012, '#f6a6a0');
    finish(L, cx, y0, rx, ry);
    ctx.restore();
    if (H.has('blubber')) { ctx.beginPath(); ctx.ellipse(cx, y0, rx * 1.03, ry * 1.08, 0, 0, Math.PI * 2); ctx.strokeStyle = hsl(hue, 30, 80, 0.6); ctx.lineWidth = 3; ctx.stroke(); }
    if (L.shape === 'puffer') for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; tri(cx + Math.cos(a - 0.08) * rx, y0 + Math.sin(a - 0.08) * ry, cx + Math.cos(a) * rx * 1.18, y0 + Math.sin(a) * ry * 1.14, cx + Math.cos(a + 0.08) * rx, y0 + Math.sin(a + 0.08) * ry, BONE); }
    if (L.fins === 'spiky') for (let k = 0; k < 5; k++) { const x = cx - rx * 0.4 + k * rx * 0.18; tri(x - 4, y0 - ry * 0.9, x + 2, y0 - ry * 1.5, x + 5, y0 - ry * 0.9, dark); }
    if (L.fins === 'sharp') { tri(cx - rx * 0.1, y0 - ry * 0.9, cx - rx * 0.35, y0 - ry * 1.9, cx + rx * 0.2, y0 - ry * 0.9, dark); tri(cx - rx * 0.2, y0 + ry * 0.9, cx - rx * 0.4, y0 + ry * 1.5, cx, y0 + ry * 0.9, dark); }
    // Deep-sea skins
    if (H.has('color_skin') || H.has('color_storm')) { ctx.save(); ctx.beginPath(); ctx.ellipse(cx, y0, rx, ry, 0, 0, Math.PI * 2); ctx.clip(); for (let i = -4; i <= 4; i++) { const x = cx + i * rx * 0.25 + ((t * 30) % (rx * 0.25)); ctx.fillStyle = hsl(hue + 60 * Math.sin(t * 2 + i), 70, 60, 0.35); ctx.fillRect(x, y0 - ry, rx * 0.12, ry * 2); } ctx.restore(); }
    if (H.has('electric_organ') || H.has('storm_body')) glow('#f6f08a', 10, () => { for (let k = 0; k < 3; k++) { const x0 = cx - rx * 0.6 + k * rx * 0.5; const flick = Math.sin(t * 13 + k * 2) > 0.2; if (!flick) continue; ctx.beginPath(); ctx.moveTo(x0, y0 - ry * 1.3); ctx.lineTo(x0 + 6, y0 - ry * 1.05); ctx.lineTo(x0 - 2, y0 - ry * 0.95); ctx.lineTo(x0 + 5, y0 - ry * 0.65); ctx.strokeStyle = '#f6f08a'; ctx.lineWidth = 2; ctx.stroke(); } });
    if (H.has('slime_skin')) { ctx.beginPath(); ctx.ellipse(cx - rx * 0.2, y0 - ry * 0.45, rx * 0.45, ry * 0.18, -0.1, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill(); for (let k = 0; k < 3; k++) drop(cx - rx * 0.4 + k * rx * 0.4, y0 + ry * 0.95 + ((t * 10 + k * 7) % 12), 3, 'rgba(200,240,220,0.6)'); }
    if (H.has('pressure_skin')) for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(cx - rx * 0.5 + k * rx * 0.3, y0, ry * 0.6, -0.6, 0.6); ctx.strokeStyle = hsl(hue, 30, 30, 0.5); ctx.lineWidth = 1.5; ctx.stroke(); }
    if (H.has('ink_glands') || H.has('vanishing_skin')) for (let k = 0; k < 4; k++) { const ph = ((t * 0.6 + k * 0.25) % 1); dot(cx - rx * (1 + ph * 0.8), y0 + ry * 0.3 + Math.sin(k * 2) * ry * 0.4, S * (0.02 + ph * 0.04), `rgba(20,16,30,${0.6 * (1 - ph)})`); }
    if (H.has('lateral_line') || H.has('ripple_sense')) for (let k = 0; k < 12; k++) dot(cx - rx * 0.8 + k * rx * 0.14, y0 + Math.sin(k * 0.5) * ry * 0.08, 1.4, hsl(hue, 40, 28));
    // Shells and crowns on the back
    if (H.has('spiral_shell') || H.has('nautilus_shell')) { const sx0 = cx - rx * 0.15; const sy0 = y0 - ry * 0.9; const R0 = ry * (H.has('nautilus_shell') ? 1.35 : 1.05); dot(sx0, sy0, R0, '#e9d8b8'); ctx.beginPath(); for (let a = 0; a < Math.PI * 5; a += 0.2) { const r = R0 * (1 - a / (Math.PI * 5.5)); ctx.lineTo(sx0 + Math.cos(a) * r, sy0 + Math.sin(a) * r); } ctx.strokeStyle = '#a67c52'; ctx.lineWidth = 2; ctx.stroke(); for (let k = 0; k < 5; k++) { const a = k * 1.2; line(sx0 + Math.cos(a) * R0 * 0.3, sy0 + Math.sin(a) * R0 * 0.3, sx0 + Math.cos(a) * R0, sy0 + Math.sin(a) * R0, '#c49a6c', 1.5); } }
    if (H.has('anemone_crown') || H.has('living_reef')) for (let k = 0; k < 4; k++) { const ax = cx - rx * 0.45 + k * rx * 0.3; const ay = y0 - ry * 0.85; for (let j = -2; j <= 2; j++) wavy(ax, ay, S * 0.07, -Math.PI / 2 + j * 0.3, 2, t, hsl(330 + k * 15, 70, 70), 2.2, j + k); dot(ax, ay, 3, hsl(330, 50, 50)); }
    if (H.has('living_reef')) for (let k = 0; k < 3; k++) dot(cx - rx * 0.3 + k * rx * 0.3 + Math.sin(t + k) * 6, y0 - ry * 2 - Math.cos(t * 1.3 + k) * 5, S * 0.015, hsl(40 + k * 60, 80, 60));
    // Underside
    if (H.has('walking_legs') || H.has('reef_walkers')) for (let k = 0; k < 4; k++) { const lx = cx - rx * 0.5 + k * rx * 0.3; const step = Math.sin(t * 5 + k * 1.5) * 4; ctx.beginPath(); ctx.moveTo(lx, y0 + ry * 0.8); ctx.lineTo(lx + 6 + step, y0 + ry * 1.5); ctx.lineTo(lx + 2 + step, y0 + ry * 2.2); ctx.strokeStyle = dark; ctx.lineWidth = 2.5; ctx.stroke(); }
    if (H.has('sucker_pads') || H.has('thousand_feet') || H.has('reef_walkers')) for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(cx - rx * 0.6 + k * rx * 0.24, y0 + ry * 0.93, 4, 2.5, 0, 0, Math.PI * 2); ctx.fillStyle = hsl(hue, 30, 78); ctx.fill(); }
    if (H.has('tube_feet') || H.has('thousand_feet')) for (let k = 0; k < 16; k++) { const lx = cx - rx * 0.7 + k * rx * 0.09; line(lx, y0 + ry * 0.85, lx + Math.sin(t * 4 + k) * 2, y0 + ry * 1.25, hsl(hue, 45, 70), 1.5); }
    if (H.has('crawling_fins')) for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.ellipse(cx - rx * 0.2 + k * rx * 0.45, y0 + ry * 1.1, rx * 0.1, ry * 0.3, 0.3 + Math.sin(t * 3 + k) * 0.2, 0, Math.PI * 2); ctx.fillStyle = dark; ctx.fill(); }
    if (H.has('belly_plate') || H.has('lantern_plate')) { ctx.beginPath(); ctx.ellipse(cx, y0 + ry * 0.55, rx * 0.75, ry * 0.45, 0, 0, Math.PI); ctx.fillStyle = SHELL; ctx.fill(); }
    if (H.has('belly_lights') || H.has('lantern_plate')) glow(GLOW, 10, () => { for (let k = 0; k < 7; k++) dot(cx - rx * 0.6 + k * rx * 0.2, y0 + ry * 0.8, S * 0.01 * (1.2 + 0.4 * Math.sin(t * 3 + k)), GLOW); });

    // Fins (near)
    const finSwing = Math.sin(t * 2.5) * 0.3;
    const fin = (x, y, kind, len) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(0.6 + finSwing);
      if (kind === 'pectoral_fins' || kind === 'pelvic_fins') tri(0, 0, -len * 0.3, len, len * 0.2, len * 0.7, dark);
      else if (kind === 'front_flippers' || kind === 'rear_flippers') { ctx.beginPath(); ctx.ellipse(0, len * 0.5, len * 0.22, len * 0.55, 0, 0, Math.PI * 2); ctx.fillStyle = dark; ctx.fill(); }
      else if (kind === 'armored_fins') { tri(0, 0, -len * 0.3, len, len * 0.2, len * 0.7, SHELL); }
      else if (kind === 'gliding_fins') { ctx.rotate(-0.9); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-len * 1.2, len * 0.4, -len * 2.2, len * 0.1); ctx.quadraticCurveTo(-len * 1.2, len * 0.9, 0, len * 0.25); ctx.fillStyle = hsl(hue, 50, 70, 0.8); ctx.fill(); for (let k = 1; k <= 4; k++) line(0, len * 0.1, -len * 0.5 * k, len * (0.15 + 0.08 * k), dark, 1); }
      else if (kind === 'lobe_fins') { ctx.beginPath(); ctx.ellipse(0, len * 0.4, len * 0.2, len * 0.5, 0, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = 1.5; ctx.stroke(); line(0, 0, 0, len * 0.7, BONE, 2); tri(-len * 0.2, len * 0.8, 0, len * 1.15, len * 0.2, len * 0.8, dark); }
      else if (kind === 'lionfish_fins') { for (let k = -3; k <= 3; k++) { const a = k * 0.25; const ex = Math.sin(a) * len * 1.5; const ey = Math.cos(a) * len * 1.5; line(0, 0, ex, ey, k % 2 ? '#f3e9dc' : '#c0392b', 2.5); } ctx.globalAlpha = 0.35; tri(-len * 1.1, len * 1.1, 0, 0, len * 1.1, len * 1.1, '#c0392b'); ctx.globalAlpha = 1; }
      else if (kind === 'stubby_front_fins' || kind === 'stubby_rear_fins') { ctx.beginPath(); ctx.ellipse(0, len * 0.3, len * 0.18, len * 0.32, 0, 0, Math.PI * 2); ctx.fillStyle = dark; ctx.fill(); }
      else if (kind === 'fore_tentacles') { ctx.restore(); wavy(x, y, len * 1.3, Math.PI / 2 - 0.3, 6, t, dark, S * 0.02); return; }
      ctx.restore();
    };
    const nSegSea = b.segments != null ? b.segments : 2;
    for (let i = 2; i < nSegSea; i++) if (p.hindLimbs || p.frontLimbs) fin(cx + rx * (0.25 - (i - 1) * (0.7 / Math.max(1, nSegSea - 1))), y0 + ry * 0.6, p.frontLimbs || p.hindLimbs, S * 0.1);
    if (p.frontLimbs) fin(cx + rx * 0.35, y0 + ry * 0.5, p.frontLimbs, S * 0.15 * (E.frontLimbs ? 1.4 : 1) * (L.legLen || 1));
    if (p.hindLimbs && !H.has('sea_tentacles')) fin(cx - rx * 0.45, y0 + ry * 0.6, p.hindLimbs, S * 0.1 * (E.hindLimbs ? 1.4 : 1));
    if (E.frontLimbs >= 2) fin(cx + rx * 0.05, y0 + ry * 0.7, p.frontLimbs, S * 0.12);
    if (E.back && !['spiral_shell', 'sail_fin', 'anemone_crown', 'angler_rod', 'carapace'].some((id) => H.has(id))) tri(cx - rx * 0.5, y0 - ry * 0.85, cx - rx * 0.2, y0 - ry * (2.6 + 0.4 * E.back), cx + rx * 0.1, y0 - ry * 0.85, accent || dark);
    if (E.skin) glow(accent || GLOW, 14, () => { ctx.beginPath(); ctx.ellipse(cx, y0, rx * 1.02, ry * 1.04, 0, 0, Math.PI * 2); ctx.strokeStyle = accent || GLOW; ctx.lineWidth = 3; ctx.stroke(); });

    // Head end
    const hx = cx + rx * 0.72; const hy = y0 - ry * 0.1;
    const m = p.mouth; const mx = cx + rx * 0.98; const my = y0 + ry * 0.15;
    if (H.has('fangs') || H.has('venom_fangs') || H.has('crushing_jaws') || H.has('lure_jaw') || H.has('mandibles')) {
      line(mx - rx * 0.25, my, mx, my, hsl(hue, 30, 15), 3);
      const c = H.has('venom_fangs') ? VENOM : BONE;
      [0, 1, 2].forEach((k) => tri(mx - rx * 0.2 + k * 7, my, mx - rx * 0.18 + k * 7, my + 7, mx - rx * 0.14 + k * 7, my, c));
    }
    const er = S * 0.022 * (L.eyeSize || 1) * (L.headSize || 1);
    for (let k = 1; k < Math.min(6, L.eyeCount || 1); k++) { const ax = hx - er * (2.5 + k * 2.2); const ay = hy - er * (k % 2 ? 1.2 : -0.4); dot(ax, ay, er * 0.75, '#fff'); dot(ax + 1, ay, er * 0.4, '#1c1414'); }
    // Head shapes
    if (L.head === 'sword') { tri(mx - 4, my - ry * 0.35, mx + S * 0.3, my - ry * 0.25, mx - 4, my - ry * 0.05, BONE); }
    if (L.head === 'hammer') { ctx.beginPath(); ctx.ellipse(hx + rx * 0.08, hy, S * 0.025, ry * 1.3, 0, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill(); dot(hx + rx * 0.08, hy - ry * 1.2, S * 0.014, '#fff'); dot(hx + rx * 0.08, hy + ry * 1.2, S * 0.014, '#fff'); dot(hx + rx * 0.1, hy - ry * 1.2, S * 0.007, '#1c1414'); dot(hx + rx * 0.1, hy + ry * 1.2, S * 0.007, '#1c1414'); }
    if (L.head === 'snout') { ctx.beginPath(); ctx.ellipse(mx + rx * 0.08, my - ry * 0.1, rx * 0.22, ry * 0.3, 0, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill(); }
    if (L.head === 'big') { ctx.beginPath(); ctx.ellipse(hx - rx * 0.05, y0 - ry * 0.55, rx * 0.3, ry * 0.75, 0, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill(); }
    if (L.head === 'crest') tri(hx - rx * 0.2, y0 - ry * 0.8, hx - rx * 0.05, y0 - ry * 2, hx + rx * 0.1, y0 - ry * 0.8, dark);
    // Deep-sea mouths
    if (H.has('coral_beak') || H.has('reef_grinder')) { tri(mx - rx * 0.12, my - ry * 0.35, mx + rx * 0.12, my - ry * 0.05, mx - rx * 0.12, my + ry * 0.05, '#e6d3a3'); tri(mx - rx * 0.12, my + ry * 0.05, mx + rx * 0.1, my + ry * 0.12, mx - rx * 0.12, my + ry * 0.3, '#d4bf8a'); }
    if (H.has('sucker_lips')) { ctx.beginPath(); ctx.ellipse(mx + 2, my, ry * 0.12, ry * 0.22, 0, 0, Math.PI * 2); ctx.fillStyle = hsl(hue, 45, 70); ctx.fill(); ctx.strokeStyle = hsl(hue, 30, 25); ctx.lineWidth = 2; ctx.stroke(); }
    if (H.has('suction_mouth') || H.has('vacuum_maw')) { const open = 1 + Math.sin(t * 3) * 0.25; ctx.beginPath(); ctx.ellipse(mx + 2, my, ry * 0.25 * open, ry * 0.32 * open, 0, 0, Math.PI * 2); ctx.fillStyle = hsl(hue, 30, 18); ctx.fill(); ctx.strokeStyle = hsl(hue, 45, 65); ctx.lineWidth = 3; ctx.stroke(); }
    if (H.has('cookie_cutter') || H.has('shark_jaws')) { ctx.beginPath(); ctx.arc(mx - 4, my + 2, ry * 0.3, 0.2, Math.PI - 0.2); ctx.strokeStyle = hsl(hue, 30, 15); ctx.lineWidth = 3; ctx.stroke(); for (let k = 0; k < 5; k++) { const a = 0.4 + k * 0.55; tri(mx - 4 + Math.cos(a) * ry * 0.3 - 2, my + 2 + Math.sin(a) * ry * 0.3, mx - 4 + Math.cos(a) * ry * 0.18, my + 2 + Math.sin(a) * ry * 0.18, mx - 4 + Math.cos(a) * ry * 0.3 + 2, my + 2 + Math.sin(a) * ry * 0.3, BONE); } }
    if (H.has('hidden_beak') || H.has('shell_cracker')) { tri(mx - 6, my + ry * 0.2, mx + 6, my + ry * 0.35, mx - 4, my + ry * 0.55, '#3a2a2a'); }
    // Deep-sea senses
    if (H.has('mantis_eyes') || H.has('rainbow_eyes')) for (let k = 0; k < 2; k++) { const ex = hx - k * 8 + 4; const ey = hy - ry * (1.2 + k * 0.2) + Math.sin(t * 2 + k) * 2; line(hx - k * 6, hy - ry * 0.4, ex, ey, dark, 2); ctx.beginPath(); ctx.ellipse(ex, ey, er * 1.2, er * 0.8, 0.3, 0, Math.PI * 2); const g2 = ctx.createLinearGradient(ex - er, ey, ex + er, ey); g2.addColorStop(0, '#e74c3c'); g2.addColorStop(0.5, '#f1c40f'); g2.addColorStop(1, '#2ecc71'); ctx.fillStyle = g2; ctx.fill(); line(ex - er, ey, ex + er, ey, '#1c1414', 1.2); }
    if (H.has('barbels')) for (let k = 0; k < 3; k++) wavy(mx - 4 - k * 3, my + 3, S * 0.09, Math.PI / 2 + 0.4 - k * 0.3, 3, t, dark, 1.5, k);
    // Arms in front (pincers, clubs, suckers)
    if (H.has('pincers') || H.has('smasher_claws') || H.has('sorting_claws') || H.has('builders_arms')) for (let k = 0; k < 2; k++) { const ax = mx - rx * 0.1 - k * rx * 0.12; const ay = my + ry * (0.9 + k * 0.2); const big = H.has('smasher_claws') ? 1.3 : 1; line(cx + rx * 0.5, y0 + ry * 0.6, ax, ay, dark, 3); const open = 0.35 + Math.sin(t * 3 + k) * 0.2; ctx.save(); ctx.translate(ax, ay); ctx.beginPath(); ctx.ellipse(S * 0.03 * big, -S * 0.012, S * 0.04 * big, S * 0.016 * big, -open, 0, Math.PI * 2); ctx.fillStyle = hsl(hue + 10, 55, 45); ctx.fill(); ctx.beginPath(); ctx.ellipse(S * 0.03 * big, S * 0.012, S * 0.035 * big, S * 0.012 * big, open, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    if (H.has('smasher_club') || H.has('smasher_claws')) { const punch = Math.max(0, Math.sin(t * 2.5)) ** 8 * S * 0.08; line(cx + rx * 0.55, y0 + ry * 0.7, mx + punch - 6, my + ry * 0.6, dark, 4); dot(mx + punch - 4, my + ry * 0.6, S * 0.025, hsl(hue + 30, 60, 55)); }
    if (H.has('sucker_arms') || H.has('clever_arms') || H.has('builders_arms') || H.has('clasper_fins')) for (let k = 0; k < (H.has('clasper_fins') && !H.has('sucker_arms') ? 2 : 4); k++) { const a = Math.PI / 2 - 0.9 + k * 0.25; const ax = cx + rx * 0.55 + k * 4; const ay = y0 + ry * 0.7; ctx.beginPath(); ctx.moveTo(ax, ay); const ex = ax + Math.cos(a) * S * 0.2; const ey = ay + Math.sin(a) * S * 0.2; const cx2 = ax + Math.cos(a) * S * 0.12 + Math.sin(t * 2 + k) * 8; ctx.quadraticCurveTo(cx2, ay + Math.sin(a) * S * 0.08, ex, ey); ctx.strokeStyle = body; ctx.lineWidth = S * 0.022 * (1 - k * 0.1); ctx.lineCap = 'round'; ctx.stroke(); ctx.lineCap = 'butt'; for (let j = 1; j <= 3; j++) dot(ax + (ex - ax) * j / 4, ay + (ey - ay) * j / 4 + 2, 1.6, hsl(hue, 30, 85)); }
    if (H.has('baleen') || H.has('grinding_beak')) for (let k = 0; k < 6; k++) line(mx - rx * 0.25 + k * 5, my - 2, mx - rx * 0.25 + k * 5, my + 6, BONE, 1.5);
    if (H.has('lure_jaw')) { ctx.beginPath(); ctx.moveTo(hx, y0 - ry); ctx.quadraticCurveTo(hx + rx * 0.4, y0 - ry * 3, hx + rx * 0.6, y0 - ry * 1.4); ctx.strokeStyle = dark; ctx.lineWidth = 2; ctx.stroke(); glow(GLOW, 18, () => dot(hx + rx * 0.6, y0 - ry * 1.4 + Math.sin(t * 3) * 3, S * 0.022, GLOW)); }
    FACE = { x: hx, y: hy, r: er * (H.has('big_eyes') ? 1.8 : 1.1), mx: hx + er * 2, my: hy + ry * 0.55, top: y0 - ry * 1.3, skin: body, s: S * 0.5 };
    if (E.senses) for (let k = 0; k < 1 + E.senses; k++) { dot(hx - er * (3 + k * 2.4), hy - er * (0.6 + (k % 2)), er * 0.8, '#fff'); dot(hx - er * (3 + k * 2.4) + 1, hy - er * (0.6 + (k % 2)), er * 0.45, '#1c1414'); }
    if (E.mouth) for (let k = 0; k < 5; k++) tri(mx - rx * 0.3 + k * 6, my - 1, mx - rx * 0.28 + k * 6, my + 9, mx - rx * 0.26 + k * 6, my - 1, BONE);
    if (H.has('compound_eyes')) { dot(hx, hy, er * 1.6, '#2c2238'); for (let k = 0; k < 7; k++) { const a = k * 2.4; dot(hx + Math.cos(a) * er * 0.8, hy + Math.sin(a) * er * 0.8, er * 0.3, hsl(160 + k * 20, 50, 45, 0.8)); } }
    else if (H.has('big_eyes')) { dot(hx, hy, er * 1.8, '#fff'); dot(hx + 2, hy, er, '#1c1414'); }
    else if (H.has('glow_eyes')) glow(GLOW, 14, () => dot(hx, hy, er * 1.2, GLOW));
    else { dot(hx, hy, er, '#fff'); dot(hx + 1, hy, er * 0.55, '#1c1414'); }
    if (H.has('antennae')) { wavy(hx, hy - er, S * 0.15, -Math.PI * 0.35, 4, t, dark, 2); }
    if (H.has('electroreceptors') || H.has('tremor_whiskers')) for (let k = 0; k < 4; k++) dot(hx + 6 + k * 5, hy + 8, 1.5, BONE);
    if (H.has('echolocation')) { ctx.beginPath(); ctx.ellipse(hx - 4, hy - ry * 0.6, ry * 0.5, ry * 0.4, 0, 0, Math.PI * 2); ctx.fillStyle = light; ctx.fill(); }
    if (H.has('horned_brow')) tri(hx - 6, hy - er, hx + 2, hy - ry * 1.6, hx + 6, hy - er, BONE);
  }

  // ======================= OTHER BODY PLANS =======================
  // Radial: a starfish on land, a jellyfish at sea. Arms = segments.
  function drawRadial(b, cx, cy, S, t) {
    const { p, accent, L, H, E } = look(b);
    const hue = b.hue; const body = hsl(hue, 50, 55); const dark = hsl(hue, 40, 30); const light = hsl(hue, 60, 72);
    const n = b.segments || 5;
    const R = S * (b.habitat === 'sea' ? 0.13 : 0.1) * (L.bodyLen || 1);
    const armLen = S * (b.habitat === 'sea' ? 0.24 : 0.36) * (L.legLen || 1) * (H.has('long_bones_f') || E.frontLimbs ? 1.25 : 1) * (H.has('stubby_forelegs') && !E.frontLimbs ? 0.85 : 1);
    if (b.habitat === 'sea') {
      // Jellyfish: a pulsing bell with trailing tentacles.
      const pulse = 1 + Math.sin(t * 3) * 0.06;
      const by = cy - S * 0.08;
      for (let i = 0; i < n * 2; i++) { const x = cx - R * 1.1 + (i / (n * 2 - 1)) * R * 2.2; wavy(x, by + R * 0.3, armLen * (1.1 + (i % 3) * 0.25), Math.PI / 2, S * 0.025, t, i % 2 ? dark : (accent || light), S * 0.012, i); }
      ctx.beginPath(); ctx.ellipse(cx, by, R * 1.4 * pulse, R * 1.1 / pulse, 0, Math.PI, 0); ctx.closePath();
      const g = ctx.createRadialGradient(cx, by - R * 0.6, R * 0.2, cx, by, R * 1.5); g.addColorStop(0, light); g.addColorStop(1, hsl(hue, 55, 50, 0.85));
      ctx.fillStyle = g; ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.ellipse(cx, by, R * 1.4 * pulse, R * 1.1 / pulse, 0, Math.PI, 0); ctx.clip(); ctx.translate(cx, by - R * 0.5); pattern(L, R * 1.4, R, S, hue, t); ctx.restore();
      if (H.has('back_spines') || E.back) for (let i = 0; i < 7; i++) { const a = Math.PI + (i + 0.5) * (Math.PI / 7); tri(cx + Math.cos(a) * R * 1.35 - 4, by + Math.sin(a) * R * 1.05, cx + Math.cos(a) * R * 1.75, by + Math.sin(a) * R * 1.45, cx + Math.cos(a) * R * 1.35 + 4, by + Math.sin(a) * R * 1.05, accent || BONE); }
      if (H.has('biolume_skin') || H.has('glow_eyes') || accent) glow(accent || GLOW, 12, () => { for (let i = 0; i < 6; i++) dot(cx - R + i * R * 0.4, by - R * 0.15, S * 0.008, accent || GLOW); });
      const eyes = 2 + (E.senses ? 2 : 0);
      for (let i = 0; i < eyes; i++) { const ex = cx - R * 0.45 + i * (R * 0.9 / Math.max(1, eyes - 1)); dot(ex, by - R * 0.45, R * 0.13, '#fff'); dot(ex + 1, by - R * 0.45, R * 0.07, '#1c1414'); }
      FACE = { x: cx + R * 0.15, y: by - R * 0.45, r: R * 0.13, mx: cx, my: by - R * 0.1, top: by - R * 1.2, skin: body, s: S * 0.5 };
      return;
    }
    // Starfish: arms radiating from a raised center, seen at an angle.
    const tilt = 0.62;
    const spin = t * 0.15;
    const ground = cy + S * 0.3;
    const ccy = ground - R * 0.6;
    ctx.beginPath(); ctx.ellipse(cx, ground, R * 2.4, R * 0.4, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
    const arms = Array.from({ length: n }, (_, i) => spin + (i / n) * Math.PI * 2).sort((a1, a2) => Math.sin(a1) - Math.sin(a2));
    arms.forEach((a, i) => {
      const curl = Math.sin(t * 2 + i) * 0.08;
      const ex = cx + Math.cos(a + curl) * armLen; const ey = ccy + Math.sin(a + curl) * armLen * tilt + R * 0.3;
      const wd = R * Math.min(0.75, 2.6 / n);
      const nx = -Math.sin(a) * wd; const ny = Math.cos(a) * wd * tilt;
      ctx.beginPath(); ctx.moveTo(cx + nx, ccy + ny); ctx.quadraticCurveTo((cx + ex) / 2 + nx * 0.7, (ccy + ey) / 2 + ny * 0.7 - R * 0.15, ex, ey);
      ctx.quadraticCurveTo((cx + ex) / 2 - nx * 0.7, (ccy + ey) / 2 - ny * 0.7 - R * 0.15, cx - nx, ccy - ny); ctx.closePath();
      ctx.fillStyle = Math.sin(a) < 0 ? hsl(hue, 45, 45) : body; ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = 1.5; ctx.stroke();
      for (let k = 1; k <= 3; k++) dot(cx + (ex - cx) * (0.3 + k * 0.17), ccy + (ey - ccy) * (0.3 + k * 0.17), wd * 0.18, light);
      if (H.has('back_spines') || H.has('venom_quills') || E.back) for (let k = 1; k <= 3; k++) { const x = cx + (ex - cx) * k / 4; const y = ccy + (ey - ccy) * k / 4; tri(x - 3, y, x, y - R * 0.35, x + 3, y, H.has('venom_quills') ? VENOM : (accent || BONE)); }
      if (H.has('bony_plates_f') || H.has('scales') || H.has('carapace')) for (let k = 1; k <= 2; k++) dot(cx + (ex - cx) * k / 3, ccy + (ey - ccy) * k / 3 - 2, R * 0.12, SHELL);
      if (p.hands) for (let k = -1; k <= 1; k++) line(ex, ey, ex + Math.cos(a + k * 0.5) * R * 0.3, ey + Math.sin(a + k * 0.5) * R * 0.3 * tilt, BONE, 2);
      if (H.has('fore_tentacles') || H.has('boneless_f')) wavy(ex, ey, R * 0.8, a, 4, t, dark, 2, i);
    });
    ctx.beginPath(); ctx.ellipse(cx, ccy, R, R * 0.75, 0, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(cx - R * 0.3, ccy - R * 0.3, 1, cx, ccy, R * 1.2); g.addColorStop(0, light); g.addColorStop(1, body);
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, ccy, R, R * 0.75, 0, 0, Math.PI * 2); ctx.clip(); ctx.translate(cx, ccy); pattern(L, R, R * 0.75, S, hue, t); ctx.restore();
    if (E.skin || H.has('biolume_skin')) glow(accent || GLOW, 12, () => { ctx.beginPath(); ctx.ellipse(cx, ccy, R * 1.05, R * 0.8, 0, 0, Math.PI * 2); ctx.strokeStyle = accent || GLOW; ctx.lineWidth = 2; ctx.stroke(); });
    const eyes = Math.min(8, 2 + (E.senses ? 3 : 0) + (H.has('big_eyes') ? 1 : 0));
    for (let i = 0; i < eyes; i++) { const a = Math.PI * 1.1 + (i / Math.max(1, eyes - 1)) * Math.PI * 0.8; const ex = cx + Math.cos(a) * R * 0.55; const ey = ccy + Math.sin(a) * R * 0.4; dot(ex, ey, R * 0.14, '#fff'); dot(ex + 1, ey, R * 0.07, '#1c1414'); }
    if (H.has('fangs') || H.has('venom_fangs') || H.has('crushing_jaws') || H.has('mandibles')) for (let k = -2; k <= 2; k++) tri(cx + k * 5 - 2, ccy + R * 0.3, cx + k * 5, ccy + R * 0.55, cx + k * 5 + 2, ccy + R * 0.3, H.has('venom_fangs') ? VENOM : BONE);
    FACE = { x: cx + R * 0.1, y: ccy - R * 0.3, r: R * 0.14, mx: cx, my: ccy + R * 0.25, top: ccy - R * 0.9, skin: body, s: S * 0.5 };
  }

  // No symmetry: an oozing colony on pseudopods.
  function drawColonial(b, cx, cy, S, t) {
    const { p, accent, L, H, E } = look(b);
    const hue = b.hue; const body = hsl(hue, 45, 52); const dark = hsl(hue, 40, 30); const light = hsl(hue, 55, 68);
    const n = b.segments || 3;
    const ground = cy + S * 0.3;
    const R = S * 0.17 * Math.sqrt((L.bodyLen || 1) * (L.bodyHeight || 1));
    const by = ground - R * 0.85;
    ctx.beginPath(); ctx.ellipse(cx, ground, R * 1.8, R * 0.3, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
    for (let i = 0; i < n; i++) { const x = cx - R * 1.1 + (i / Math.max(1, n - 1)) * R * 2.2; const reach = Math.sin(t * 2.5 + i * 1.3) * R * 0.15; ctx.beginPath(); ctx.ellipse(x + reach, ground - R * 0.18, R * 0.3 * (L.legLen || 1), R * 0.22 * (L.legLen || 1), 0, 0, Math.PI * 2); ctx.fillStyle = dark; ctx.fill(); }
    const lumps = [[0, 0, 1], [-0.65, 0.15, 0.6], [0.6, 0.2, 0.62], [-0.25, -0.55, 0.55], [0.35, -0.45, 0.5], [0.85, -0.2, 0.38], [-0.85, -0.25, 0.4]];
    lumps.forEach(([dx, dy, r], i) => { const wob = 1 + Math.sin(t * 2 + i * 1.7) * 0.05; dot(cx + dx * R, by + dy * R, r * R * wob, i % 2 ? body : light); });
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, by, R * 1.2, R * 0.9, 0, 0, Math.PI * 2); ctx.clip(); ctx.translate(cx, by); pattern(L, R * 1.2, R * 0.9, S, hue, t); ctx.restore();
    if (H.has('moss_garden') || H.has('lichen_hide') || H.has('kelp_garden')) for (let i = 0; i < 6; i++) dot(cx - R + i * R * 0.4, by - R * 0.7 + (i % 2) * 6, S * 0.02, PLANT);
    if (H.has('back_spines') || H.has('venom_quills') || E.back) for (let i = 0; i < 6; i++) { const x = cx - R * 0.8 + i * R * 0.32; tri(x - 4, by - R * 0.6, x, by - R * 1.05, x + 4, by - R * 0.6, H.has('venom_quills') ? VENOM : (accent || BONE)); }
    if (E.skin || accent) glow(accent || GLOW, 10, () => { for (let i = 0; i < 8; i++) dot(cx - R + (i * 37 % 20) / 10 * R, by - R * 0.4 + ((i * 53) % 10) / 10 * R * 0.8, S * 0.008, accent || GLOW); });
    const eyes = 3 + (E.senses ? 3 : 0);
    const spots = [[0.3, -0.35], [-0.35, -0.2], [0.65, 0], [-0.7, 0.05], [0.05, -0.65], [0.45, 0.3]];
    for (let i = 0; i < Math.min(eyes, spots.length); i++) { const [dx, dy] = spots[i]; dot(cx + dx * R, by + dy * R, R * 0.11, '#fff'); dot(cx + dx * R + 1, by + dy * R, R * 0.06, '#1c1414'); }
    if (p.mouth) { ctx.beginPath(); ctx.ellipse(cx + R * 0.35, by + R * 0.25, R * 0.2, R * 0.1, 0, 0, Math.PI * 2); ctx.fillStyle = hsl(hue, 30, 18); ctx.fill(); }
    FACE = { x: cx + R * 0.3, y: by - R * 0.35, r: R * 0.11, mx: cx + R * 0.35, my: by + R * 0.25, top: by - R, skin: body, s: S * 0.5 };
  }

  // No legs: a snake on land, an eel at sea.
  function drawSerpent(b, cx, cy, S, t) {
    const { p, accent, L, H, E } = look(b);
    const hue = b.hue; const body = hsl(hue, 50, 55); const dark = hsl(hue, 40, 30);
    const sea = b.habitat === 'sea';
    const ground = sea ? cy + S * 0.05 : cy + S * 0.3;
    const len = S * 0.62 * (L.bodyLen || 1); const thick = S * 0.065 * (L.bodyHeight || 1);
    const pts = [];
    for (let i = 0; i <= 30; i++) { const u = i / 30; pts.push([cx - len / 2 + u * len, ground - thick * 0.6 - Math.sin(u * Math.PI * 2.4 - t * 3) * S * 0.06 * (1 + (L.spine || 0) * 0.8) * (0.4 + u * 0.6) * (sea ? 1.4 : 1)]); }
    if (!sea) { ctx.beginPath(); ctx.ellipse(cx, ground, len * 0.55, S * 0.025, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill(); }
    for (let i = 0; i < pts.length; i++) {
      const u = i / (pts.length - 1); const w = thick * (0.35 + 0.65 * Math.sin(Math.min(1, u * 1.3) * Math.PI * 0.5));
      dot(pts[i][0], pts[i][1], w, i % 2 ? body : hsl(hue, 52, 58));
      if (L.pattern === 'stripes' && i % 3 === 0) line(pts[i][0], pts[i][1] - w, pts[i][0], pts[i][1] + w, hsl(L.accent != null ? L.accent : hue + 40, 55, 40), 3);
      if ((L.pattern === 'spots' || H.has('warning_skin')) && i % 4 === 2) dot(pts[i][0], pts[i][1] - w * 0.3, w * 0.35, H.has('warning_skin') ? '#f2c14e' : hsl(L.accent != null ? L.accent : hue + 40, 55, 40));
      if ((H.has('back_spines') || H.has('venom_quills') || E.back) && i % 3 === 1 && u > 0.15 && u < 0.9) tri(pts[i][0] - 4, pts[i][1] - w * 0.8, pts[i][0], pts[i][1] - w * 1.9, pts[i][0] + 4, pts[i][1] - w * 0.8, H.has('venom_quills') ? VENOM : (accent || BONE));
      if ((H.has('scales') || H.has('swift_scales')) && i % 2 === 0) { ctx.beginPath(); ctx.arc(pts[i][0], pts[i][1], w * 0.6, 0, Math.PI); ctx.strokeStyle = hsl(hue, 40, 40, 0.6); ctx.lineWidth = 1.2; ctx.stroke(); }
      if (H.has('mottled_skin') && i % 3 === 1) dot(pts[i][0] + 2, pts[i][1] - w * 0.2, w * 0.45, i % 2 ? hsl(hue + 30, 30, 32, 0.6) : hsl(90, 25, 38, 0.55));
      if ((H.has('chitin') || H.has('segment_plates') || skel(b) === 'shell') && i % 3 === 0) line(pts[i][0], pts[i][1] - w, pts[i][0], pts[i][1] + w, hsl(hue, 30, 25, 0.6), 1.5);
      if (H.has('mucus_skin') && i % 4 === 0) dot(pts[i][0] - w * 0.2, pts[i][1] - w * 0.5, w * 0.22, 'rgba(255,255,255,0.45)');
      if (H.has('down_feathers') && i % 2 === 0) { ctx.beginPath(); ctx.arc(pts[i][0], pts[i][1] - w * 0.2, w * 0.7, Math.PI * 1.1, Math.PI * 1.9); ctx.strokeStyle = hsl(hue + 15, 35, 75, 0.6); ctx.lineWidth = 2; ctx.stroke(); }
    }
    if (H.has('snail_shell')) {
      const mid = pts[12]; const R0 = thick * (H.has('citadel_shell') ? 2.6 : 2.1); const sx0 = mid[0]; const sy0 = mid[1] - R0 * 0.85;
      dot(sx0, sy0, R0, '#e3cfa6'); ctx.beginPath();
      for (let a = 0; a < Math.PI * 5; a += 0.2) { const r = R0 * (1 - a / (Math.PI * 5.5)); ctx.lineTo(sx0 + Math.cos(a) * r, sy0 + Math.sin(a) * r); }
      ctx.strokeStyle = '#8f6a43'; ctx.lineWidth = 2.2; ctx.stroke();
    }
    if (H.has('egg_sac')) for (let k = 0; k < 6; k++) { const q = pts[8 + k * 2]; dot(q[0], q[1] - thick * 1.1, thick * 0.4, '#f1ead2'); }
    if (E.skin) glow(accent || GLOW, 12, () => { for (let i = 0; i < pts.length; i += 3) dot(pts[i][0], pts[i][1], 2, accent || GLOW); });
    const tail = pts[0];
    if (H.has('stinger_tail')) tri(tail[0], tail[1], tail[0] - 14, tail[1] - 6, tail[0] - 4, tail[1] + 8, VENOM);
    if (H.has('club_tail')) dot(tail[0], tail[1], thick * 0.9, SHELL);
    if (H.has('rattle_tail')) { const sh = Math.sin(t * 30) * 2; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(tail[0] - k * 6 + sh, tail[1] - k * 2, thick * 0.45, thick * 0.35, 0.3, 0, Math.PI * 2); ctx.fillStyle = k % 2 ? '#c9b38a' : '#a8916a'; ctx.fill(); } }
    if (H.has('tail_feathers')) for (let k = -2; k <= 2; k++) { ctx.save(); ctx.translate(tail[0], tail[1]); ctx.rotate(Math.PI + k * 0.28); ctx.beginPath(); ctx.ellipse(S * 0.07, 0, S * 0.08, S * 0.02, 0, 0, Math.PI * 2); ctx.fillStyle = hsl(hue + 20 + k * 12, 55, 60); ctx.fill(); ctx.restore(); }
    if (H.has('spinneret')) line(tail[0], tail[1], tail[0] - S * 0.05, ground, 'rgba(240,240,250,0.7)', 1);
    if (H.has('fluke')) { tri(tail[0], tail[1], tail[0] - S * 0.1, tail[1] - S * 0.07, tail[0] - S * 0.06, tail[1], dark); tri(tail[0], tail[1], tail[0] - S * 0.1, tail[1] + S * 0.07, tail[0] - S * 0.06, tail[1], dark); }
    if (sea && p.back) for (let i = 6; i < 26; i++) tri(pts[i][0] - 3, pts[i][1] - thick * 0.8, pts[i][0], pts[i][1] - thick * 1.6, pts[i][0] + 3, pts[i][1] - thick * 0.8, hsl(hue, 40, 38, 0.85));
    const head = pts[pts.length - 1];
    drawHead(p, head[0] + thick * 0.4, head[1] - thick * 0.2, S * 0.085 * (L.headSize || 1), hue, body, dark, t, S, L);
  }

  // ======================= BODIES =======================
  // Draw a body (yours or another species') centered at (cx, cy) inside a box of size S.
  function drawBody(b, cx, cy, S, t) {
    FACE = null;
    const sym = b.stage === 'creature' ? (b.symmetry || 'bilateral') : null;
    if (b.stage === 'cell') drawCell(b, cx, cy, S * 0.24, t);
    else if (sym === 'radial') drawRadial(b, cx, cy, S * sizeScale(b), t);
    else if (sym === 'colonial') drawColonial(b, cx, cy, S * sizeScale(b), t);
    else if (b.segments === 0) drawSerpent(b, cx, cy, S * sizeScale(b), t);
    else if (b.habitat === 'sea') drawSea(b, cx, cy, S * sizeScale(b), t);
    else drawLand(b, cx, cy + S * 0.36, S * sizeScale(b), t);
  }

  // A smaller copy of a body, optionally mirrored and faded.
  function drawMini(b, x, y, S, t, alpha, flip) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
    drawBody(b, 0, 0, S, t);
    ctx.restore();
  }

  // ======================= FACES =======================
  function star(x, y, r, color) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  }
  function drop(x, y, r, color) {
    ctx.beginPath(); ctx.moveTo(x, y - r * 1.8); ctx.quadraticCurveTo(x + r * 1.1, y - r * 0.2, x, y + r); ctx.quadraticCurveTo(x - r * 1.1, y - r * 0.2, x, y - r * 1.8);
    ctx.fillStyle = color; ctx.fill();
  }

  // Cartoon expressions drawn over the last body's eye and mouth.
  function drawFace(mood, t) {
    const f = FACE;
    if (!f || !mood) return;
    const r = Math.max(3.5, f.r);
    const ink = '#1c1414';
    const lw = Math.max(1.6, r * 0.28);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // Eyes
    if (mood === 'sleepy') {
      dot(f.x, f.y, r * 1.08, f.skin);
      ctx.beginPath(); ctx.arc(f.x, f.y - r * 0.2, r * 0.8, 0.15 * Math.PI, 0.85 * Math.PI); ctx.strokeStyle = ink; ctx.lineWidth = lw; ctx.stroke();
    }
    if (mood === 'dizzy') {
      dot(f.x, f.y, r * 1.08, '#fff');
      ctx.beginPath(); for (let a = 0; a < Math.PI * 4; a += 0.3) { const rr = (a / (Math.PI * 4)) * r * 0.95; ctx.lineTo(f.x + Math.cos(a + t * 6) * rr, f.y + Math.sin(a + t * 6) * rr); }
      ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.2, lw * 0.6); ctx.stroke();
    }
    if (mood === 'love') { dot(f.x, f.y, r * 1.05, '#fff'); heart(f.x, f.y + r * 0.1, r * 0.8, '#e8604c'); }
    if (mood === 'dead') { dot(f.x, f.y, r * 1.1, f.skin); line(f.x - r * 0.75, f.y - r * 0.75, f.x + r * 0.75, f.y + r * 0.75, ink, lw); line(f.x - r * 0.75, f.y + r * 0.75, f.x + r * 0.75, f.y - r * 0.75, ink, lw); }
    if (mood === 'scared' || mood === 'surprised') { dot(f.x, f.y, r * 1.15, '#fff'); dot(f.x + r * 0.15, f.y, r * 0.35, ink); }
    // Brows
    const by = f.y - r * 1.7; const bw = r * 1.1;
    if (mood === 'angry' || mood === 'proud') line(f.x - bw, by - r * 0.45, f.x + bw, by + r * (mood === 'angry' ? 0.45 : -0.1), ink, lw);
    if (mood === 'worried' || mood === 'sad' || mood === 'scared') line(f.x - bw, by + r * 0.4, f.x + bw, by - r * 0.45, ink, lw);
    if (mood === 'surprised') { ctx.beginPath(); ctx.arc(f.x, by + r * 0.6, bw, 1.15 * Math.PI, 1.85 * Math.PI); ctx.strokeStyle = ink; ctx.lineWidth = lw; ctx.stroke(); }
    // Mouth
    const mw = Math.max(4, r * 1.2);
    ctx.strokeStyle = ink; ctx.lineWidth = lw;
    ctx.beginPath();
    if (mood === 'happy' || mood === 'love' || mood === 'proud') ctx.arc(f.mx, f.my - mw * 0.55, mw, 0.18 * Math.PI, 0.82 * Math.PI);
    else if (mood === 'sad' || mood === 'worried') ctx.arc(f.mx, f.my + mw * 0.75, mw * 0.85, 1.22 * Math.PI, 1.78 * Math.PI);
    else if (mood === 'surprised' || mood === 'scared') ctx.ellipse(f.mx, f.my, mw * 0.35, mw * 0.5, 0, 0, Math.PI * 2);
    else if (mood === 'angry') { ctx.moveTo(f.mx - mw, f.my); for (let i = 1; i <= 6; i++) ctx.lineTo(f.mx - mw + (i * mw) / 3, f.my + (i % 2 ? -mw * 0.25 : mw * 0.15)); }
    else if (mood === 'dizzy') { ctx.moveTo(f.mx - mw, f.my); for (let i = 1; i <= 8; i++) ctx.lineTo(f.mx - mw + (i * mw) / 4, f.my + Math.sin(i * 1.7 + t * 8) * mw * 0.2); }
    else if (mood === 'sleepy' || mood === 'dead') { ctx.moveTo(f.mx - mw * 0.4, f.my); ctx.lineTo(f.mx + mw * 0.4, f.my); }
    ctx.stroke();
    // Extras
    if (mood === 'worried' || mood === 'scared') {
      for (let i = 0; i < 2; i++) { const fall = ((t * 1.4 + i * 0.5) % 1); drop(f.x - r * (2.2 + i * 1.4), f.top + fall * r * 5, r * 0.55, `rgba(159, 216, 255, ${1 - fall})`); }
    }
    if (mood === 'sad') {
      for (let i = 0; i < 3; i++) { const fall = ((t * 1.1 + i / 3) % 1); drop(f.x + r * 0.2, f.y + r * 1.1 + fall * r * 6, r * 0.4, `rgba(159, 216, 255, ${1 - fall})`); }
    }
    if (mood === 'love' || mood === 'happy') { ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.ellipse(f.x - r * 0.4, f.y + r * 1.5, r * 0.8, r * 0.45, 0, 0, Math.PI * 2); ctx.fillStyle = '#ff8f8f'; ctx.fill(); ctx.globalAlpha = 1; }
    if (mood === 'dizzy') for (let i = 0; i < 3; i++) { const a = t * 3 + i * 2.1; star(f.x + Math.cos(a) * r * 3, f.top - r * 0.5 + Math.sin(a) * r * 0.9, r * 0.7, '#f2c14e'); }
    if (mood === 'angry') {
      const vx = f.x - r * 2; const vy = f.top;
      [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sy]) => { ctx.beginPath(); ctx.arc(vx + sx * r * 0.7, vy + sy * r * 0.7, r * 0.5, 0, Math.PI * 0.6); ctx.strokeStyle = '#e8604c'; ctx.lineWidth = lw * 0.9; ctx.stroke(); });
    }
    if (mood === 'surprised') comic('!', f.x - r * 1.5, f.top - r * 1.5, r * 3.2, 1, '#f2c14e');
    if (mood === 'sleepy') { comic('z', f.x + r * 2, f.top - r * 0.5 - (t * 10) % 12, r * 2, 0.9, '#e8efe4'); comic('Z', f.x + r * 3.2, f.top - r * 2 - (t * 10) % 12, r * 2.6, 0.9, '#e8efe4'); }
    if (mood === 'proud') star(f.x + r * 2.2, f.y - r * 1.8, r * (0.6 + 0.2 * Math.sin(t * 6)), '#fff6c8');
    ctx.restore();
  }

  function heart(x, y, r, color) {
    ctx.beginPath(); ctx.moveTo(x, y + r * 0.8);
    ctx.bezierCurveTo(x - r * 1.4, y - r * 0.2, x - r * 0.6, y - r * 1.3, x, y - r * 0.4);
    ctx.bezierCurveTo(x + r * 0.6, y - r * 1.3, x + r * 1.4, y - r * 0.2, x, y + r * 0.8);
    ctx.fillStyle = color; ctx.fill();
  }

  // Comic-book words: "CHOMP!", "BONK!".
  function comic(text, x, y, size, alpha, color, rot) {
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, alpha)); ctx.translate(x, y); ctx.rotate(rot || 0);
    ctx.font = `700 ${Math.round(size)}px Grandstander, 'Trebuchet MS', sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(2, size * 0.16); ctx.strokeStyle = '#1c1414'; ctx.lineJoin = 'round'; ctx.strokeText(text, 0, 0);
    ctx.fillStyle = color; ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  // ======================= BACKGROUNDS =======================
  function drawBackground(run, w, h, t) {
    const hue = G.ORIGIN[run.origin].hue;
    if (run.stage === 'cell' || run.habitat === 'sea') {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, hsl(hue, 45, run.stage === 'cell' ? 24 : 22)); g.addColorStop(1, hsl(hue + 10, 45, 8));
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.save(); ctx.globalAlpha = 0.07;
      for (let i = 0; i < 4; i++) { const x = (i * 0.3 + 0.1) * w + Math.sin(t * 0.3 + i) * 20; tri(x, 0, x + w * 0.08, 0, x + w * 0.25, h, '#ffffff'); }
      ctx.restore();
      for (let i = 0; i < 26; i++) { const x = (i * 97.3 + t * (6 + (i % 5))) % w; const y = (i * 53.7 + Math.sin(t + i) * 10 + h) % h; dot(x, y, 1 + (i % 3) * 0.6, 'rgba(255,255,255,0.16)'); }
      if (run.habitat === 'sea') { ctx.fillStyle = hsl(hue, 25, 14); ctx.fillRect(0, h * 0.92, w, h * 0.08); for (let i = 0; i < 8; i++) wavy(i * w / 7, h * 0.92, h * 0.18, -Math.PI / 2, 5, t * 0.6, hsl(120, 35, 30, 0.7), 3, i); }
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, hsl(hue + 20, 40, 32)); g.addColorStop(0.7, hsl(hue + 30, 35, 18)); g.addColorStop(1, hsl(hue + 30, 30, 12));
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 3; i++) { const cx = ((i * 0.37 + 0.1) * w + t * 6) % (w + 120) - 60; dot(cx, h * (0.12 + i * 0.06), 16, 'rgba(255,255,255,0.08)'); dot(cx + 18, h * (0.12 + i * 0.06) + 4, 13, 'rgba(255,255,255,0.08)'); }
      ctx.fillStyle = hsl(hue + 40, 25, 16);
      ctx.beginPath(); ctx.moveTo(0, h * 0.62); for (let x = 0; x <= w; x += 20) ctx.lineTo(x, h * 0.62 - Math.sin(x * 0.01 + 1) * h * 0.08 - Math.sin(x * 0.023) * h * 0.04); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
      ctx.fillStyle = hsl(95, 25, 20); ctx.fillRect(0, h * 0.86, w, h * 0.14);
      for (let i = 0; i < 18; i++) { const x = (i * 71) % w; line(x, h * 0.86, x + Math.sin(t + i) * 2, h * 0.83, hsl(95, 35, 32), 2); }
    }
  }

  // Other species wandering past in the background.
  function drawAmbient(run, w, h, t, S, skip) {
    const wet = run.stage === 'cell' || run.habitat === 'sea';
    run.species.forEach((s, i) => {
      if (i === skip) return;
      const speed = 0.035 + (s.seed % 7) * 0.006;
      const dir = s.seed % 2 ? 1 : -1;
      const u = ((t * speed + s.seed / 997) % 1 + 1) % 1;
      const x = dir > 0 ? -80 + u * (w + 160) : w + 80 - u * (w + 160);
      const k = S * (wet ? 0.3 : 0.26) * Math.min(1.6, s.size);
      const y = wet ? h * (0.2 + ((s.seed % 50) / 100)) + Math.sin(t + s.seed) * 10 : h * 0.66 - k * 0.1;
      drawMini(G.speciesBody(s), x, y, k, t, 0.42, dir < 0);
    });
  }

  // Your herd, school or colony: more members on screen as Population grows.
  function drawHerd(run, cx, cy, S, t, w, h) {
    const small = G.sizeOf(run) === 'small';
    const n = Math.max(0, Math.min(small ? 10 : 6, Math.floor(run.pop / (small ? 2 : 3))));
    const b = G.bodyOf(run);
    const wet = run.stage === 'cell' || run.habitat === 'sea';
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1;
      const row = Math.floor(i / 2);
      const k = S * (wet ? 0.3 : 0.32) * (small ? 0.8 : 1);
      const x = cx + side * (S * 0.5 + row * S * 0.2) + Math.sin(t * 0.7 + i) * 6;
      const y = wet ? cy + (i % 3 - 1) * S * 0.22 + Math.sin(t + i * 1.7) * 6 : cy + S * 0.36 - k * 0.42 - S * 0.06 - row * 4;
      drawMini(b, x, y, k, t + i, 0.45, false);
    }
  }

  // ======================= PROPS =======================
  // Pieces of the world that an event is about. 'back' draws behind your creature, 'front' over it.
  function drawProp(prop, layer, P) {
    const { w, h, cx, cy, S, k, t, success, anim, ground } = P;
    const p = Math.min(1, k);
    const back = layer === 'back';
    switch (prop) {
      case 'shadow': if (back) { const x = w * 1.3 - ((t * 0.06) % 1.8) * w; ctx.beginPath(); ctx.ellipse(x, h * 0.16, S * 0.7, S * 0.28, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill(); glow('#ffb36b', 10, () => { dot(x - S * 0.45, h * 0.13, 5, '#ffb36b'); dot(x - S * 0.32, h * 0.12, 5, '#ffb36b'); }); } break;
      case 'current': for (let i = 0; i < (back ? 10 : 4); i++) { const y = h * (0.12 + i * (back ? 0.08 : 0.2)); const x = ((t * 140 + i * 97) % (w + 240)) - 120; line(x, y, x + 90, y + Math.sin(t + i) * 4, `rgba(255,255,255,${back ? 0.12 : 0.22})`, back ? 2 : 3); } break;
      case 'bloom': if (back) for (let i = 0; i < 70; i++) dot((i * 53 + t * 8) % w, (i * 37 + Math.sin(t + i) * 8) % h, 2 + (i % 3), `rgba(127, 207, 95, ${0.25 + (i % 4) * 0.08})`); break;
      case 'bubbles': if (!back) for (let i = 0; i < 14; i++) { const ph = (t * 0.25 + i / 14) % 1; ctx.beginPath(); ctx.arc(cx + Math.sin(i * 3.1) * S * 0.6, h * (1 - ph), 3 + (i % 4) * 2, 0, Math.PI * 2); ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - ph)})`; ctx.lineWidth = 1.5; ctx.stroke(); } break;
      case 'molecule': if (!back) {
        const absorb = success !== false && (anim === 'mutate' || anim === 'eat');
        const q = absorb ? Math.min(1, k * 1.1) : 0;
        const mx = cx + S * 0.5 * (1 - q); const my = cy - S * 0.3 * (1 - q);
        glow('#fff3a6', 14, () => { for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + t; const x = mx + Math.cos(a) * 12 * (1 - q * 0.8); const y = my + Math.sin(a) * 12 * (1 - q * 0.8); dot(x, y, 4, i % 2 ? '#f2c14e' : '#8ff5e8'); } });
      } break;
      case 'virus': if (!back) for (let i = 0; i < 4; i++) {
        const popped = success && k > 0.5;
        const a = t * 1.5 + i * Math.PI / 2; const r = S * 0.34;
        const x = cx + Math.cos(a) * r; const y = cy + Math.sin(a) * r * 0.7;
        if (popped) { const q = Math.min(1, (k - 0.5) * 3); for (let j = 0; j < 6; j++) { const b = j; line(x + Math.cos(b) * 6 * q, y + Math.sin(b) * 6 * q, x + Math.cos(b) * 14 * q, y + Math.sin(b) * 14 * q, `rgba(160, 230, 90, ${1 - q})`, 2); } continue; }
        for (let j = 0; j < 8; j++) { const b = j * Math.PI / 4 + t; line(x, y, x + Math.cos(b) * 11, y + Math.sin(b) * 11, '#5c8a2e', 2); dot(x + Math.cos(b) * 11, y + Math.sin(b) * 11, 2, '#a3e05a'); }
        dot(x, y, 7, '#7cbf3a'); dot(x - 2, y - 2, 2, '#1c1414'); dot(x + 3, y - 2, 2, '#1c1414');
      } break;
      case 'sun': if (back) { const g = ctx.createRadialGradient(w * 0.85, h * 0.05, 5, w * 0.85, h * 0.05, S * 0.9); g.addColorStop(0, 'rgba(255, 230, 140, 0.55)'); g.addColorStop(1, 'rgba(255, 230, 140, 0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + t * 0.2; line(w * 0.85 + Math.cos(a) * 30, h * 0.05 + Math.sin(a) * 30, w * 0.85 + Math.cos(a) * 60, h * 0.05 + Math.sin(a) * 60, 'rgba(255,230,140,0.4)', 4); } } break;
      case 'plume': for (let i = 0; i < (back ? 7 : 3); i++) { const x = ((t * 22 + i * 110) % (w + 240)) - 120; const y = h * (0.25 + (i % 4) * 0.15); dot(x, y, 28 + (i % 3) * 16, `rgba(170, 90, 210, ${back ? 0.22 : 0.15})`); } break;
      case 'vent': if (back) { const bx = w * 0.12; ctx.fillStyle = '#2a1d1a'; ctx.beginPath(); ctx.moveTo(bx - 30, h); ctx.lineTo(bx - 12, h * 0.62); ctx.lineTo(bx + 12, h * 0.62); ctx.lineTo(bx + 30, h); ctx.fill(); for (let i = 0; i < 10; i++) { const ph = (t * 0.35 + i / 10) % 1; dot(bx + Math.sin(ph * 6 + i) * 10 * ph, h * 0.62 - ph * h * 0.65, 8 + ph * 28, `rgba(30, 24, 22, ${0.6 * (1 - ph)})`); } glow('#ff7a3d', 20, () => dot(bx, h * 0.63, 6, '#ff7a3d')); } break;
      case 'ice':
        if (back) { for (let i = 0; i < 9; i++) tri(i * w / 8, 0, i * w / 8 + 14, 0, i * w / 8 + 7, 22 + (i % 3) * 10, 'rgba(200, 240, 255, 0.6)'); break; }
        if (anim === 'attack' && success) {
          for (let i = 0; i < 12; i++) { const a = i * 0.52; const d = p * S * 0.9; const x = cx + Math.cos(a) * d; const y = cy + Math.sin(a) * d + p * p * 120; ctx.save(); ctx.translate(x, y); ctx.rotate(p * 8 + i); tri(-8, -6, 10, 0, -4, 9, `rgba(200, 240, 255, ${1 - p})`); ctx.restore(); }
          if (k < 0.25) comic('CRACK!', cx, cy - S * 0.42, S * 0.11, 1 - k * 4, '#c8f0ff', -0.1);
        } else {
          ctx.save(); ctx.globalAlpha = 0.42; ctx.fillStyle = '#bfe9ff'; ctx.strokeStyle = '#eafaff'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(cx - S * 0.42, cy - S * 0.3); ctx.lineTo(cx + S * 0.15, cy - S * 0.38); ctx.lineTo(cx + S * 0.45, cy - S * 0.1); ctx.lineTo(cx + S * 0.38, cy + S * 0.36); ctx.lineTo(cx - S * 0.3, cy + S * 0.38); ctx.lineTo(cx - S * 0.46, cy + S * 0.05); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 0.9; ctx.stroke();
          ctx.globalAlpha = 0.7; line(cx - S * 0.3, cy - S * 0.2, cx - S * 0.18, cy - S * 0.3, '#ffffff', 4); line(cx - S * 0.32, cy - S * 0.1, cx - S * 0.26, cy - S * 0.15, '#ffffff', 3);
          ctx.restore();
        }
        break;
      case 'swarm': if (!back) for (let i = 0; i < 18; i++) { const scatter = anim === 'attack' && success ? p * S * 0.8 : 0; const a = t * 2.2 + i * 0.7; const r = S * (0.33 + 0.08 * Math.sin(i)) + scatter; const x = cx + Math.cos(a) * r; const y = cy + Math.sin(a) * r * 0.75; dot(x, y, 5, '#c9566b'); for (let j = 0; j < 3; j++) { const b = j * 2.1 + t * 8; line(x, y, x + Math.cos(b) * 8, y + Math.sin(b) * 8, '#7a2c3d', 1.5); } } break;
      case 'carcass': if (back) { const x = w * 0.8; const y = (ground || h * 0.85); ctx.beginPath(); ctx.ellipse(x, y - S * 0.08, S * 0.32, S * 0.13, 0, Math.PI, 0); ctx.fillStyle = '#6d6a72'; ctx.fill(); for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x - S * 0.18 + i * S * 0.09, y - S * 0.08, S * 0.06, Math.PI, 0); ctx.strokeStyle = '#d9d2c2'; ctx.lineWidth = 3; ctx.stroke(); } comic('x', x + S * 0.22, y - S * 0.15, S * 0.06, 0.8, '#1c1414'); } break;
      case 'shore': if (back) { ctx.fillStyle = '#c9a66b'; ctx.beginPath(); ctx.moveTo(w * 0.55, h); ctx.quadraticCurveTo(w * 0.8, h * 0.62, w, h * 0.5); ctx.lineTo(w, h); ctx.fill(); drawProp('sun', 'back', P); } break;
      case 'night':
        if (back) { ctx.fillStyle = 'rgba(5, 10, 30, 0.5)'; ctx.fillRect(0, 0, w, h); glow('#fff7d6', 24, () => dot(w * 0.15, h * 0.12, 16, '#fff7d6')); dot(w * 0.15 + 7, h * 0.12 - 4, 14, 'rgba(5,10,30,0.85)'); }
        else for (let i = 0; i < 3; i++) { const blink = Math.sin(t * 2 + i * 2) > -0.9; if (!blink) continue; const x = [w * 0.08, w * 0.92, w * 0.7][i]; const y = h * [0.78, 0.7, 0.86][i]; glow('#ff5a3c', 8, () => { dot(x, y, 3, '#ff5a3c'); dot(x + 10, y, 3, '#ff5a3c'); }); }
        break;
      case 'drought': if (back) { const y0 = ground || h * 0.86; for (let i = 0; i < 9; i++) { const x = i * w / 8; ctx.beginPath(); ctx.moveTo(x, y0 + 4); ctx.lineTo(x + 12, y0 + 12); ctx.lineTo(x + 6, y0 + 22); ctx.lineTo(x + 18, y0 + 30); ctx.strokeStyle = 'rgba(30,20,10,0.6)'; ctx.lineWidth = 2; ctx.stroke(); } const g = ctx.createRadialGradient(w * 0.8, h * 0.1, 5, w * 0.8, h * 0.1, S); g.addColorStop(0, 'rgba(255, 170, 80, 0.5)'); g.addColorStop(1, 'rgba(255,170,80,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); } break;
      case 'fruit':
        if (back) { const tx = w * 0.12; line(tx, h * 0.9, tx, h * 0.3, '#5a3b24', 16); dot(tx, h * 0.25, S * 0.25, '#2f6b3a'); dot(tx + 30, h * 0.3, S * 0.18, '#2f6b3a'); for (let i = 0; i < 6; i++) dot(tx - 40 + i * 18, h * (0.22 + (i % 3) * 0.06), 7, '#8e44ad'); break; }
        if (anim === 'eat') for (let i = 0; i < 3; i++) { const q = Math.min(1, Math.max(0, k * 1.4 - i * 0.25)); dot(w * 0.12 + (cx + S * 0.25 - w * 0.12) * q, h * 0.25 + (cy - h * 0.25) * q - Math.sin(q * Math.PI) * 30, 7, '#8e44ad'); }
        if (anim === 'hurt' && FACE) { const q = Math.min(1, k * 2); dot(cx, h * 0.05 + (cy - S * 0.3 - h * 0.05) * q, 8, '#8e44ad'); if (q >= 1 && k < 1) comic('BONK!', cx, cy - S * 0.45, S * 0.1, 1.2 - k, '#f2c14e', 0.15); }
        break;
      case 'nest': if (back) { const x = cx - S * 0.55; const y = (ground || cy + S * 0.36) - 6; ctx.beginPath(); ctx.ellipse(x, y, 30, 10, 0, 0, Math.PI * 2); ctx.fillStyle = '#6b4a2b'; ctx.fill(); const eggs = anim === 'hurt' || success === false ? 1 : 3; for (let i = 0; i < eggs; i++) { ctx.beginPath(); ctx.ellipse(x - 12 + i * 12, y - 8, 7, 9, 0, 0, Math.PI * 2); ctx.fillStyle = '#f3ead2'; ctx.fill(); } } break;
      case 'bones': if (back) { const x = w * 0.78; const y = (ground || h * 0.86) - 4; line(x - 40, y, x + 30, y, '#e6dcc6', 4); for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x - 28 + i * 12, y, 10, Math.PI, 0); ctx.strokeStyle = '#e6dcc6'; ctx.lineWidth = 3; ctx.stroke(); } dot(x + 38, y - 4, 9, '#e6dcc6'); dot(x + 40, y - 6, 2.5, '#1c1414'); } break;
      case 'sickness': if (!back) for (let i = 0; i < 8; i++) { const ph = (t * 0.3 + i / 8) % 1; dot(cx + Math.sin(i * 2.3) * S * 0.4, cy + S * 0.2 - ph * S * 0.6, 10 + ph * 14, `rgba(140, 200, 70, ${0.35 * (1 - ph)})`); } break;
      case 'tar': if (!back) {
        const y = (ground || cy + S * 0.36);
        ctx.beginPath(); ctx.ellipse(cx, y - 4, S * 0.48, S * 0.11, 0, 0, Math.PI * 2); ctx.fillStyle = '#21160f'; ctx.fill();
        for (let i = 0; i < 4; i++) { const ph = (t * 0.6 + i / 4) % 1; ctx.beginPath(); ctx.arc(cx - S * 0.3 + i * S * 0.2, y - 6 - ph * 6, 3 + ph * 5, Math.PI, 0); ctx.strokeStyle = `rgba(90,70,50,${1 - ph})`; ctx.lineWidth = 2; ctx.stroke(); }
      } break;
      case 'snow': for (let i = 0; i < (back ? 40 : 14); i++) { const x = (i * 47 + Math.sin(t + i) * 20) % w; const y = (i * 29 + t * (back ? 30 : 50)) % h; dot(x, y, back ? 2 : 3, 'rgba(255,255,255,0.8)'); } if (back) { ctx.fillStyle = 'rgba(240,248,255,0.5)'; ctx.fillRect(0, h * 0.86, w, 8); } break;
      case 'fire': if (back) { const base = ground || h * 0.86; glow('#ff7a1a', 30, () => { for (let i = 0; i < 9; i++) { const x = i * w * 0.07; const fh = S * (0.25 + 0.12 * Math.sin(t * 9 + i * 2)); tri(x - 18, base, x, base - fh, x + 18, base, i % 2 ? '#ff7a1a' : '#ffb21a'); tri(x - 8, base, x, base - fh * 0.55, x + 8, base, '#fff1a6'); } }); for (let i = 0; i < 8; i++) { const ph = (t * 0.3 + i / 8) % 1; dot(i * w * 0.07, base - S * 0.3 - ph * h * 0.6, 10 + ph * 26, `rgba(40,30,30,${0.4 * (1 - ph)})`); } } break;
      case 'tree': if (back) { const tx = w * 0.1; line(tx, h * 0.9, tx, 0, '#4d3420', 26); dot(tx + 10, h * 0.05, S * 0.3, '#244f2e'); dot(tx + 60, h * 0.12, S * 0.22, '#2f6b3a'); for (let i = 0; i < 5; i++) dot(tx + 20 + i * 12, h * (0.08 + (i % 2) * 0.08), 6, '#e0a83a'); } break;
      case 'cave': if (back) { ctx.save(); ctx.fillStyle = '#120d0c'; ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.moveTo(w * 0.1, h); ctx.quadraticCurveTo(w * 0.1, h * 0.1, w * 0.5, h * 0.08); ctx.quadraticCurveTo(w * 0.9, h * 0.1, w * 0.9, h); ctx.fill('evenodd'); ctx.restore(); for (let i = 0; i < 6; i++) tri(w * (0.15 + i * 0.13), h * 0.1, w * (0.18 + i * 0.13), h * (0.2 + (i % 2) * 0.06), w * (0.21 + i * 0.13), h * 0.1, '#2a201c'); } break;
      case 'kelp': for (let i = 0; i < (back ? 9 : 3); i++) { const x = back ? i * w / 8 : [w * 0.04, w * 0.96, w * 0.86][i]; wavy(x, h, h * (back ? 0.8 : 0.5), -Math.PI / 2, 10, t * 0.8, back ? 'rgba(70, 120, 60, 0.6)' : 'rgba(90, 150, 70, 0.9)', back ? 8 : 12, i); } break;
      case 'whirlpool': if (back) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(-t * 2); for (let j = 0; j < 4; j++) { ctx.beginPath(); for (let a = 0; a < Math.PI * 5; a += 0.2) { const r = a * S * 0.05; ctx.lineTo(Math.cos(a + j * Math.PI / 2) * r, Math.sin(a + j * Math.PI / 2) * r * 0.6); } ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 3; ctx.stroke(); } ctx.restore(); } break;
      case 'notes': if (!back) for (let i = 0; i < 6; i++) { const ph = (t * 0.25 + i / 6) % 1; comic(i % 2 ? '♪' : '♫', cx + Math.sin(i * 2 + t) * S * 0.45, cy - ph * S * 0.6, S * 0.07, 1 - ph, '#f2e6a6'); } break;
      case 'dust': if (back) for (let i = 0; i < 10; i++) { const x = ((t * 80 + i * 70) % (w + 200)) - 100; dot(x, (ground || h * 0.86) - 10 - (i % 3) * 8, 14 + (i % 4) * 6, 'rgba(180, 150, 110, 0.25)'); } break;
      case 'stick': if (!back) { const x = cx + S * 0.38; const y = cy + S * 0.05; line(x, y + S * 0.25, x + S * 0.12, y - S * 0.15, '#7a5230', 5); if (anim === 'eat') for (let i = 0; i < 3; i++) dot(x + S * 0.1, y - S * 0.1 + i * 6, 2.5, '#1c1414'); } break;
      case 'sparks': if (!back) for (let i = 0; i < 12; i++) { const a = t * 1.5 + i * 0.52; const r = S * (0.25 + 0.1 * Math.sin(t * 2 + i)); star(cx + Math.cos(a) * r, cy - S * 0.15 + Math.sin(a) * r * 0.5, 4, `rgba(242, 193, 78, ${0.5 + 0.5 * Math.sin(t * 4 + i)})`); } break;
      case 'stars': if (back) for (let i = 0; i < 6; i++) { const ph = (t * 0.5 + i / 6) % 1; const x = w * (i / 6) + ph * w * 0.3; line(x, ph * h, x + 20, ph * h + 30, `rgba(220, 200, 255, ${0.5 * (1 - ph)})`, 2); star(x, ph * h, 3, 'rgba(255,255,255,0.7)'); } break;
      case 'hearts': if (!back) for (let i = 0; i < 6; i++) { const ph = (t * 0.3 + i / 6) % 1; heart(cx + Math.sin(i * 2.4) * S * 0.5, cy + S * 0.2 - ph * S * 0.7, 6 + (i % 3) * 2, `rgba(236, 122, 102, ${1 - ph})`); } break;
      default: break;
    }
  }

  // ======================= ANIMATION =======================
  const DUR = 1.6;
  let P_SKIP_WORDS = false; // a prop shouting its own word ("CRACK!", "BONK!") silences the generic one
  const VARIANTS = { attack: 3, flee: 3, hurt: 3, eat: 2, social: 2, rest: 2, grow: 1, mutate: 2 };
  const WORDS = {
    attack: ['CHOMP!', 'POW!', 'WHAM!'], hurt: ['OUCH!', 'OOF!', 'YIKES!'], eat: ['MUNCH', 'GULP!'],
    flee: ['ZOOM!', 'BOING!', 'EEK!'], social: ['HI!', 'YAY!'], mutate: ['WOAH!', 'ZAP!'], grow: ['BOING!'], rest: ['', ''],
  };

  // Make every move bigger, and add anticipation: a crouch (and a lean back) before the action.
  function exaggerate(T, anim, windup) {
    const X = { dx: T.dx * 1.4, dy: T.dy * 1.4, rot: T.rot * 1.3, sx: 1 + (T.sx - 1) * 1.6, sy: 1 + (T.sy - 1) * 1.6 };
    if (windup < 1) {
      const e = Math.sin(windup * Math.PI * 0.5);
      X.sy *= 1 - 0.18 * e; X.sx *= 1 + 0.12 * e;
      if (anim === 'attack' || anim === 'flee') { X.dx -= 16 * e; X.rot -= 0.08 * e; }
      if (anim === 'mutate' || anim === 'grow') X.dx += Math.sin(windup * 70) * 3;
    }
    return X;
  }

  // The odds of a check: green for success, red for failure, and a needle that swings, slows and lands.
  function oddsBar(sc, w, h, pos, alpha) {
    const x0 = w * 0.14; const x1 = w * 0.86; const y = h * 0.08; const bh = Math.max(10, h * 0.035);
    const split = x0 + (x1 - x0) * (sc.chance / 100);
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = 'rgba(12, 26, 29, 0.75)'; ctx.fillRect(x0 - 6, y - 6, x1 - x0 + 12, bh + 12);
    ctx.fillStyle = '#5fae4e'; ctx.fillRect(x0, y, split - x0, bh);
    ctx.fillStyle = '#c4553f'; ctx.fillRect(split, y, x1 - split, bh);
    const target = sc.success ? sc.chance * 0.5 / 100 : (sc.chance + (100 - sc.chance) * 0.5) / 100;
    const nx = x0 + (x1 - x0) * Math.max(0, Math.min(1, pos === 1 ? target : pos));
    tri(nx - 8, y - 12, nx + 8, y - 12, nx, y + 2, '#f2ecd8'); line(nx, y, nx, y + bh, '#f2ecd8', 3);
    const stat = (G.STATS.find((x) => x.id === sc.stat) || {}).short || '';
    ctx.font = `700 ${Math.round(Math.max(11, bh * 0.9))}px 'Atkinson Hyperlegible', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#e8efe4'; ctx.fillText(`${stat} check · ${sc.chance}%`, w / 2, y + bh + 8);
    ctx.restore();
  }

  // Before a check resolves: the needle swings back and forth, slowing, while you tremble.
  function suspenseFrame(run, me, sc, w, h, t, el, dur) {
    ctx.clearRect(0, 0, w, h);
    drawBackground(run, w, h, t);
    const S = Math.min(w * 0.72, h * 1.05);
    const cx = w * 0.45; const cy = h * 0.5;
    drawAmbient(run, w, h, t, S, sc.species);
    drawHerd(run, cx, cy, S, t, w, h);
    const land = run.stage === 'creature' && run.habitat === 'land';
    const pivotY = land ? cy + S * 0.36 : cy;
    const settle = dur - 0.35; const p = Math.min(1, el / settle);
    const tremble = Math.sin(el * 55) * 2.5 * (0.4 + p);
    ctx.save(); ctx.translate(cx + tremble, pivotY); ctx.scale(1 + 0.03 * p, 1 - 0.05 * p); ctx.translate(-cx, -pivotY);
    const f = fitBody(me, S, cx, cy, { x0: 4, y0: h * 0.03, x1: w - 4, y1: h - 4 });
    drawBody(me, f.x, f.y, f.S, t);
    drawFace(p > 0.6 ? 'scared' : 'worried', t);
    ctx.restore();
    const target = sc.success ? sc.chance * 0.5 / 100 : (sc.chance + (100 - sc.chance) * 0.5) / 100;
    const amp = 0.55 * Math.pow(1 - p, 1.4);
    const pos = el >= settle ? target : target + amp * Math.sin(el * (16 - 9 * p));
    oddsBar(sc, w, h, Math.max(0, Math.min(1, pos)), 1);
    if (el >= settle) { const q = Math.min(1, (el - settle) / 0.15); comic(sc.success ? 'YES!' : 'NO!', w * 0.5, h * 0.24, S * 0.1 * (0.6 + 0.6 * q), 1, sc.success ? '#8fd16a' : '#ef7d6b', -0.08); }
    else if (Math.floor(el * 4) % 2 === 0) comic('...', cx + S * 0.3, cy - S * 0.42, S * 0.07, 0.8, '#e8efe4');
  }

  // Squash, stretch, hop and spin. Returns an offset and scale for this moment.
  function animTransform(anim, v, k, w) {
    const p = Math.min(1, k);
    const e = Math.sin(p * Math.PI);
    const T = { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1 };
    switch (anim) {
      case 'attack':
        if (v === 0) { T.dx = e * 55; T.sx = 1 + 0.18 * e; T.sy = 1 - 0.12 * e; }
        if (v === 1) { T.dx = e * 50; T.dy = -Math.max(0, Math.sin(p * Math.PI * 2)) * 45; T.sy = 1 + 0.1 * Math.sin(p * Math.PI * 2); }
        if (v === 2) { T.dx = e * 40; T.rot = p * Math.PI * 2; }
        break;
      case 'flee':
        if (v === 0) { T.dx = p < 0.45 ? (p / 0.45) * w : -w * (1 - (p - 0.45) / 0.55); T.sx = 1.15; T.sy = 0.9; }
        if (v === 1) { T.dx = e * 110; T.dy = -Math.abs(Math.sin(p * Math.PI * 4)) * 30 * (1 - p * 0.5); T.sy = 1 + 0.12 * Math.sin(p * Math.PI * 8); }
        if (v === 2) { if (p < 0.35) { T.dx = Math.sin(k * 60) * 3; T.sx = 1.1; T.sy = 0.85; } else { const q = (p - 0.35) / 0.65; T.dx = q < 0.5 ? q * 2 * w : -w * (1 - (q - 0.5) * 2); } }
        break;
      case 'hurt':
        if (v === 0) { const squash = p < 0.2 ? p / 0.2 : Math.max(0, 1 - (p - 0.2) * 1.6) * Math.cos((p - 0.2) * 18); T.sy = 1 - 0.45 * squash; T.sx = 1 + 0.35 * squash; }
        if (v === 1) { T.dx = Math.sin(k * 50) * 9 * (1 - p); }
        if (v === 2) { T.dx = -e * 45; T.rot = -e * 0.7; }
        break;
      case 'eat':
        if (v === 0) { const m = Math.sin(k * 26) * (1 - p * 0.6); T.sx = 1 - m * 0.06; T.sy = 1 + m * 0.07; }
        if (v === 1) { const s = 1 + 0.22 * e; T.sx = s; T.sy = s; }
        break;
      case 'social':
        if (v === 0) { T.dy = -Math.abs(Math.sin(k * 12)) * 16 * (1 - p * 0.5); T.rot = Math.sin(k * 12) * 0.08; }
        if (v === 1) { T.rot = Math.sin(k * 20) * 0.16 * (1 - p * 0.7); T.dx = e * 18; }
        break;
      case 'rest':
        if (v === 1) { T.sx = 1 - 0.06 * e; T.sy = 1 - 0.1 * e; T.rot = 0.06 * e; }
        else { T.sy = 1 - 0.04 * e; }
        break;
      case 'grow': { const s = 1 - 0.35 * Math.exp(-5 * p) * Math.cos(p * 16); T.sx = s; T.sy = s; break; }
      case 'mutate': { const j = Math.sin(k * 18) * Math.exp(-2.5 * p); T.sx = 1 + 0.18 * j; T.sy = 1 - 0.18 * j; break; }
      default: break;
    }
    return T;
  }

  function drawEffects(anim, v, k, cx, cy, S, w, h, hasTarget, ground) {
    const p = Math.min(1, k);
    const a = Math.max(0, 1 - k);
    if (anim === 'hurt' && k < 1) { ctx.fillStyle = `rgba(232, 96, 76, ${0.22 * a})`; ctx.fillRect(0, 0, w, h); }
    if (anim === 'hurt' && v !== 1 && FACE) for (let i = 0; i < 3; i++) { const ang = k * 4 + i * 2.1; star(cx + Math.cos(ang) * S * 0.2, cy - S * 0.38 + Math.sin(ang) * 8, 6, `rgba(242, 193, 78, ${Math.min(1, a * 2)})`); }
    if (anim === 'mutate') {
      for (let i = 0; i < 3; i++) { const r = S * (0.2 + (p + i * 0.2) * 0.5); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.strokeStyle = `rgba(143, 245, 232, ${a * 0.6})`; ctx.lineWidth = 3; ctx.stroke(); }
      for (let i = 0; i < 14; i++) { const ang = i * 0.45 + k * 2; const r = S * (0.15 + p * 0.45); star(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, 4, `rgba(242, 193, 78, ${a})`); }
    }
    if (anim === 'eat') for (let i = 0; i < 10; i++) { const q = (k * 1.6 + i / 10) % 1; dot(cx + S * 0.45 * (1 - q), cy - S * 0.05 + Math.sin(i * 3) * S * 0.1 * (1 - q), 3, `rgba(147, 212, 110, ${a})`); }
    if (anim === 'social') for (let i = 0; i < 6; i++) { const q = (k + i / 6) % 1; heart(cx + S * 0.1 + Math.sin(i * 2) * S * 0.2, cy - S * 0.15 - q * S * 0.3, 6, `rgba(236, 122, 102, ${a * (1 - q)})`); }
    if (anim === 'attack' && hasTarget) for (let i = 0; i < 8; i++) { const ang = i * 0.8; const r = S * 0.04 + p * S * 0.12; line(cx + S * 0.42 + Math.cos(ang) * r * 0.5, cy + Math.sin(ang) * r * 0.5, cx + S * 0.42 + Math.cos(ang) * r, cy + Math.sin(ang) * r, `rgba(242, 193, 78, ${a})`, 2); }
    if (anim === 'flee' && k < 1) { for (let i = 0; i < 5; i++) line(cx - S * 0.5 - i * 6, cy - S * 0.2 + i * S * 0.1, cx - S * 0.9 - i * 6, cy - S * 0.2 + i * S * 0.1, `rgba(255,255,255,${0.35 * a})`, 2); if (ground) for (let i = 0; i < 4; i++) dot(cx - S * 0.4 - i * 18, ground - 6 - (i % 2) * 6, 8 + i * 3, `rgba(200, 180, 140, ${0.35 * a})`); }
    const words = P_SKIP_WORDS ? null : WORDS[anim];
    if (words && words[v % words.length] && k > 0.2 && k < 1.4) {
      const q = Math.min(1, (k - 0.2) * 5);
      const pop = q < 1 ? 0.5 + q * 0.7 : 1.2 - Math.min(0.2, (k - 0.4) * 0.5);
      comic(words[v % words.length], cx + S * 0.32, cy - S * 0.42, S * 0.095 * pop, Math.min(1, (1.4 - k) * 2), anim === 'hurt' ? '#ef7d6b' : '#f2c14e', -0.12);
    }
  }

  // ---------- Canvas plumbing ----------
  function fit(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth; const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h };
  }

  // A still portrait of a body (yours, via a run, or another species).
  G.drawPortrait = function (canvas, subject) {
    if (!canvas || !subject) return;
    const b = subject.archetype ? G.bodyOf(subject) : subject;
    const { w, h } = fit(canvas);
    ctx.clearRect(0, 0, w, h);
    const land = b.stage === 'creature' && b.habitat !== 'sea';
    const S = Math.min(w, h) * (b.stage === 'cell' ? 1.15 : land ? 0.95 : 1.1) / sizeScale(b);
    const f = b.stage === 'cell' ? { S: S, x: w * 0.5, y: h * 0.5 } : fitBody(b, S * (land ? 0.92 : 1), land ? w * 0.42 : w * 0.5, h * (land ? 0.45 : 0.5), { x0: w * 0.04, y0: h * 0.04, x1: w * 0.96, y1: h * 0.96 });
    drawBody(b, f.x, f.y, f.S, 0.6);
  };

  let sceneFrame = null;
  function hash(str) { let x = 0; for (let i = 0; i < str.length; i++) x = (x * 31 + str.charCodeAt(i)) | 0; return Math.abs(x); }
  const ease = (x) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));

  function ghost(x, y, r, alpha) {
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.arc(x, y, r, Math.PI, 0); ctx.lineTo(x + r, y + r * 1.2);
    for (let i = 0; i < 4; i++) ctx.lineTo(x + r - (i + 0.5) * (r / 2), y + r * (i % 2 ? 1.2 : 0.9));
    ctx.lineTo(x - r, y + r * 1.2); ctx.closePath(); ctx.fillStyle = '#eef6ff'; ctx.fill();
    dot(x - r * 0.35, y - r * 0.1, r * 0.15, '#1c1414'); dot(x + r * 0.35, y - r * 0.1, r * 0.15, '#1c1414');
    ctx.restore();
  }
  function foodIcon(x, y, r, meat, alpha) {
    ctx.save(); ctx.globalAlpha = alpha;
    if (meat) { line(x - r, y + r, x + r * 0.2, y - r * 0.2, '#efe6d2', r * 0.5); dot(x + r * 0.3, y - r * 0.3, r * 0.8, '#c0533f'); }
    else { ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.55, -0.6, 0, Math.PI * 2); ctx.fillStyle = '#93d46e'; ctx.fill(); line(x - r * 0.8, y + r * 0.5, x + r * 0.6, y - r * 0.4, '#4f8a35', 1.5); }
    ctx.restore();
  }

  // Story choreography: where you and the other species move, and how they feel.
  function storyFrame(story, k, w, S) {
    const p = Math.min(1, k);
    const you = { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1 };
    const them = { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, alpha: 1, turn: false };
    let youMood = null; let themMood = 'surprised'; let word = null; let wordAt = null;
    const gap = w * 0.38;
    switch (story) {
      case 'chase': {
        them.dx = Math.min(p, 0.72) * w * 0.2; them.dy = -Math.abs(Math.sin(p * Math.PI * 6)) * 10;
        you.dx = ease(p / 0.72) * (gap * 0.75 + w * 0.14);
        if (p > 0.72) { const q = (p - 0.72) / 0.28; them.sx = them.sy = Math.max(0, 1 - q); you.sy = 1 + Math.sin(q * 20) * 0.08; }
        if (k > 1.1) you.dx *= Math.max(0, 1 - (k - 1.1) * 1.2);
        youMood = p > 0.72 ? 'happy' : 'angry'; themMood = 'scared';
        word = 'CHOMP!'; wordAt = 0.72; break;
      }
      case 'brawl_win': {
        const hit = 0.4;
        you.dx = p < hit ? ease(p / hit) * gap * 0.55 : gap * 0.55 * (1 - ease((p - hit) / 0.6));
        if (p > hit) { const q = (p - hit) / (1 - hit); them.dx = q * w * 0.35; them.rot = q * 4; them.dy = -Math.sin(q * Math.PI) * 50; }
        if (k > 1.2) them.alpha = Math.max(0, 1 - (k - 1.2) * 2);
        youMood = p > hit ? 'proud' : 'angry'; themMood = p > hit ? 'dizzy' : 'angry';
        word = 'POW!'; wordAt = hit; break;
      }
      case 'brawl_lose': {
        const hit = 0.4;
        them.dx = p < hit ? -ease(p / hit) * gap * 0.55 : -gap * 0.55 * (1 - ease((p - hit) / 0.6));
        if (p > hit) { const q = Math.min(1, (p - hit) / 0.3); you.dx = -q * w * 0.08; you.sy = 1 - 0.4 * Math.max(0, 1 - (p - hit) * 1.4); you.sx = 1 + 0.3 * Math.max(0, 1 - (p - hit) * 1.4); }
        youMood = p > hit ? 'dizzy' : 'worried'; themMood = p > hit ? 'proud' : 'angry';
        word = 'WHAM!'; wordAt = hit; break;
      }
      case 'mauled': {
        const hit = 0.45;
        const q = p < hit ? ease(p / hit) : 1 - ease((p - hit) / 0.55);
        them.dx = -q * gap * 0.75; them.dy = -Math.sin(Math.min(1, p / hit) * Math.PI) * 60 * (p < hit ? 1 : 0);
        if (p > hit) you.dx = Math.sin(k * 50) * 8 * Math.max(0, 1 - (p - hit) * 2);
        youMood = p > hit ? 'sad' : 'scared'; themMood = 'angry';
        word = 'CHOMP!'; wordAt = hit; break;
      }
      case 'escape': {
        you.dx = p < 0.35 ? -ease(p / 0.35) * w * 0.7 : p < 0.75 ? -w * 0.7 : -w * 0.7 * (1 - ease((p - 0.75) / 0.25));
        them.dx = -ease(Math.min(1, p / 0.5)) * gap * 0.75;
        youMood = p < 0.75 ? 'scared' : 'proud'; themMood = 'surprised';
        word = '?'; wordAt = 0.5; break;
      }
      case 'befriend': {
        you.dx = ease(p) * gap * 0.25; them.dx = -ease(p) * gap * 0.25;
        you.dy = -Math.abs(Math.sin(k * 10)) * 12; them.dy = -Math.abs(Math.sin(k * 10 + 1)) * 12;
        youMood = 'love'; themMood = 'love'; word = 'YAY!'; wordAt = 0.6; break;
      }
      case 'rebuffed': {
        you.dx = (p < 0.5 ? ease(p / 0.5) : 1 - ease((p - 0.5) / 0.5)) * gap * 0.3;
        them.turn = p > 0.35;
        youMood = p > 0.4 ? 'sad' : 'happy'; themMood = 'angry'; word = 'HMPH!'; wordAt = 0.4; break;
      }
      default: {
        you.rot = Math.sin(k * 3) * 0.03; them.rot = -Math.sin(k * 3) * 0.03;
        youMood = 'worried'; themMood = 'angry'; word = '...'; wordAt = 0.3; break;
      }
    }
    return { you, them, youMood, themMood, word, wordAt };
  }

  // An animated scene: your herd, the species around you, the event's props and what happened.
  G.playScene = function (canvas, run, sc) {
    if (sceneFrame) cancelAnimationFrame(sceneFrame);
    if (!canvas || !run) return;
    const anim = sc.anim || 'rest';
    const v = hash(`${sc.title || ''}${sc.label || ''}${run.turn}`) % (VARIANTS[anim] || 1);
    const start = performance.now();
    const me = G.bodyOf(run);
    const sp = sc.species != null && sc.species >= 0 ? run.species[sc.species] : null;
    const story = sp ? sc.story : null;
    const babies = Math.min(5, Math.max(0, sc.popDelta || 0));
    const ghosts = Math.min(5, Math.max(0, -(sc.popDelta || 0)));
    const food = sc.foodDelta || 0;
    const dying = sc.title === 'end';
    // Tension: a check first swings a needle across the odds while your creature sweats it out.
    const SUSPENSE = !reduceMotion && sc.chance != null && sc.success != null && sc.stat ? 1.7 : 0;
    // Timing: a wind-up before the action, and a freeze-frame with screen shake on impact.
    const ANT = anim === 'hurt' || anim === 'rest' ? 0 : 0.22;
    const IMPACT = anim === 'attack' ? 0.42 : anim === 'hurt' ? 0.06 : null;
    const STOP = 0.09;
    function frame(now) {
      if (!canvas.isConnected) { sceneFrame = null; return; }
      if (dying) { deathFrame(canvas, run, me, reduceMotion ? 6 : (now - start) / 1000, reduceMotion ? 0 : now / 1000); sceneFrame = reduceMotion ? null : requestAnimationFrame(frame); return; }
      const { w, h } = fit(canvas);
      const t = reduceMotion ? 0 : now / 1000;
      const el = (now - start) / 1000;
      if (SUSPENSE && el < SUSPENSE) { suspenseFrame(run, me, sc, w, h, t, el, SUSPENSE); sceneFrame = requestAnimationFrame(frame); return; }
      const kRaw = reduceMotion ? 2 : (el - SUSPENSE) / DUR;
      const windup = ANT && kRaw < ANT ? kRaw / ANT : 1;
      let k = Math.max(0, kRaw - ANT);
      if (IMPACT != null && k > IMPACT) k = k < IMPACT + STOP ? IMPACT : k - STOP;
      const sinceHit = IMPACT != null && sc.success !== false ? Math.max(-1, kRaw - ANT - IMPACT) : -1;
      const shakeAmt = sinceHit >= 0 && sinceHit < 0.4 ? (1 - sinceHit / 0.4) * (anim === 'hurt' ? 10 : 7) : 0;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      if (shakeAmt) ctx.translate((Math.random() - 0.5) * shakeAmt * 2, (Math.random() - 0.5) * shakeAmt * 2);
      drawBackground(run, w, h, t);
      const S = Math.min(w * 0.72, h * 1.05);
      const cx = w * (story ? 0.36 : 0.45); const cy = h * 0.5;
      const land = run.stage === 'creature' && run.habitat === 'land';
      const ground = land ? cy + S * 0.36 : null;
      const P = { w, h, cx, cy, S, k, t, success: sc.success, anim, ground };
      P_SKIP_WORDS = !!story || !!sc.evolved || (sc.prop === 'ice' && anim === 'attack' && sc.success) || (sc.prop === 'fruit' && anim === 'hurt');
      if (sc.prop) drawProp(sc.prop, 'back', P);
      drawAmbient(run, w, h, t, S, sc.species);
      drawHerd(run, cx, cy, S, t, w, h);
      const st = story ? storyFrame(story, k, w, S) : null;
      // The other species, acting out its side of the story.
      if (sp) {
        const ks = S * (land ? 0.5 : 0.55) * Math.min(1.5, sp.size);
        const baseX = w * (story ? 0.8 : 0.86);
        const sy = land ? ground - ks * 0.36 : cy;
        const T = st ? st.them : { dx: anim === 'attack' && sc.success ? Math.max(0, Math.sin(Math.min(1, k) * Math.PI)) * 40 : 0, dy: 0, rot: 0, sx: 1, sy: 1, alpha: 1 };
        if (T.alpha > 0.02 && T.sx > 0.02) {
          ctx.save(); ctx.globalAlpha = T.alpha;
          const pivot = land ? ground : sy;
          ctx.translate(baseX + T.dx, pivot + T.dy); ctx.rotate(T.rot); ctx.scale((T.turn ? 1 : -1) * T.sx, T.sy); ctx.translate(0, sy - pivot);
          drawBody(G.speciesBody(sp), 0, 0, ks, t);
          drawFace(st ? st.themMood : (anim === 'attack' && sc.success ? 'dizzy' : anim === 'social' ? 'love' : sc.success === false ? 'angry' : 'surprised'), t);
          ctx.restore();
        }
        if (story === 'chase' && k > 0.95) drawProp('bones', 'back', { ...P, ground: land ? ground : cy + S * 0.25, w: (baseX + w * 0.2) / 0.78 });
      }
      // You: bigger moves, plus a crouch before you spring.
      const T = st ? st.you : exaggerate(animTransform(anim, v, k, w), anim, windup);
      if (!st && (anim === 'flee' || anim === 'attack') && windup >= 1 && k > 0.03 && k < 0.6) for (let i = 0; i < 5; i++) { const ly = cy - S * 0.2 + i * S * 0.1; const lx = cx + T.dx - S * 0.45 - (i % 2) * S * 0.12; line(lx - S * 0.3, ly, lx, ly, `rgba(255,255,255,${0.45 * Math.sin(k / 0.6 * Math.PI)})`, 2.5); }
      const sink = sc.prop === 'tar' && (sc.success === false || anim === 'hurt') ? Math.min(1, k) * S * 0.12 : 0;
      const spin = sc.prop === 'whirlpool' && anim === 'hurt' && k < 1 ? k * Math.PI * 4 : 0;
      const pivotY = land ? ground : cy;
      ctx.save();
      ctx.translate(cx + T.dx, pivotY + T.dy + sink); ctx.rotate(T.rot + spin); ctx.scale(T.sx, T.sy); ctx.translate(-cx, -pivotY);
      const fm = fitBody(me, S, cx, cy, { x0: 4, y0: h * 0.03, x1: w - 4, y1: h - 4 });
      drawBody(me, fm.x, fm.y, fm.S, t);
      drawFace((st && st.youMood) || sc.mood, t);
      ctx.restore();
      if (sc.prop) drawProp(sc.prop, 'front', P);
      if (st && st.word && k > st.wordAt && k < st.wordAt + 0.9) {
        const q = Math.min(1, (k - st.wordAt) * 6);
        const wx = story === 'escape' || story === 'rebuffed' ? w * 0.8 : cx + (story === 'mauled' || story === 'brawl_lose' ? 0 : S * 0.45);
        comic(st.word, wx, cy - S * 0.42, S * 0.1 * (0.6 + q * 0.5), Math.min(1, (st.wordAt + 0.9 - k) * 3), story === 'mauled' || story === 'brawl_lose' ? '#ef7d6b' : '#f2c14e', -0.12);
      }
      if (!st) drawEffects(anim, v, k, cx, cy, S, w, h, !!sp, ground);
      // Your herd grows or shrinks.
      for (let i = 0; i < babies; i++) { const q = Math.min(1, Math.max(0, k * 1.5 - 0.3 - i * 0.12)); if (q <= 0) continue; const bx = cx - S * 0.35 - i * S * 0.12; const by = (land ? ground - S * 0.08 : cy + S * 0.25); ctx.save(); ctx.translate(bx, by); const sc2 = Math.min(1, q * 1.3) * (1 + 0.15 * Math.sin(q * 12) * (1 - q)); ctx.scale(sc2, sc2); drawBody(me, 0, -S * 0.05, S * 0.28, t + i); ctx.restore(); if (q < 1) star(bx, by - S * 0.18, 5 * (1 - q) + 2, '#f2c14e'); }
      if (babies && k > 0.4 && k < 2) comic(`+${sc.popDelta}`, cx - S * 0.45, (land ? ground : cy) - S * 0.35, S * 0.08, Math.min(1, (2 - k)), '#8fd16a');
      for (let i = 0; i < ghosts; i++) { const q = Math.max(0, k - 0.4 - i * 0.1); if (q <= 0 || q > 1.6) continue; ghost(cx - S * 0.3 + i * S * 0.15 + Math.sin(q * 6 + i) * 6, cy - q * S * 0.45, S * 0.045, Math.max(0, 1 - q / 1.6)); }
      if (ghosts && k > 0.5 && k < 2.2) comic(`${sc.popDelta}`, cx - S * 0.45, cy - S * 0.42, S * 0.08, Math.min(1, (2.2 - k)), '#ef7d6b');
      // Food flies in, or away.
      if (food) for (let i = 0; i < Math.min(5, Math.abs(food)); i++) {
        const q = Math.min(1, Math.max(0, k * 1.3 - 0.35 - i * 0.08)); if (q <= 0 || q >= 1) continue;
        const fx = food > 0 ? w * 0.9 + (cx + S * 0.25 - w * 0.9) * q : cx + S * 0.2 + q * w * 0.3;
        const fy = food > 0 ? cy - S * 0.1 - Math.sin(q * Math.PI) * S * 0.3 : cy - q * S * 0.5;
        foodIcon(fx, fy, 7, G.diet(run) === 'carn', food > 0 ? 1 : 1 - q);
      }
      // A new evolution gets a big moment.
      if (sc.evolved && k < 2.5) {
        const q = Math.min(1, k / 0.6);
        for (let i = 0; i < 16; i++) { const a2 = i * Math.PI / 8 + k; line(cx + Math.cos(a2) * S * 0.2 * q, cy + Math.sin(a2) * S * 0.2 * q, cx + Math.cos(a2) * S * 0.55 * q, cy + Math.sin(a2) * S * 0.55 * q, hsl((i * 40 + k * 200) % 360, 90, 70, Math.max(0, 0.6 - k * 0.2)), 3); }
        comic('EVOLVED!', w * 0.5, h * 0.14, S * 0.11 * (0.7 + 0.3 * q), Math.min(1, (2.5 - k) * 1.5), '#f2c14e', -0.06);
      }
      if (SUSPENSE && kRaw < 0.9) oddsBar(sc, w, h, 1, 1 - kRaw / 0.9);
      ctx.restore();
      sceneFrame = reduceMotion ? null : requestAnimationFrame(frame);
    }
    sceneFrame = requestAnimationFrame(frame);
  };

  // Extinction: the last of your kind shudders and falls, the color drains away,
  // its spirit rises, and the earth (or the seabed) closes over it as a fossil.
  function deathFrame(canvas, run, me, s, t) {
    const { w, h } = fit(canvas);
    ctx.clearRect(0, 0, w, h);
    drawBackground(run, w, h, s < 1 ? t : 0);
    const S = Math.min(w * 0.72, h * 1.05);
    const cx = w * 0.45; const cy = h * 0.48;
    const land = run.stage === 'creature' && run.habitat === 'land';
    const ground = land ? cy + S * 0.36 : h * 0.86;
    const clamp01 = (x) => Math.max(0, Math.min(1, x));
    const fall = clamp01((s - 0.7) / 0.9); const ease = 1 - (1 - fall) ** 3;
    const drain = clamp01(s / 2.2);
    const bury = clamp01((s - 2.6) / 1.6);
    // The world darkens.
    ctx.fillStyle = `rgba(6, 10, 14, ${0.5 * drain})`; ctx.fillRect(0, 0, w, h);
    // The body: a shudder, then it rolls belly-up and comes to rest on the ground (or sinks to the seabed).
    const shake = s < 0.7 ? Math.sin(s * 70) * 5 * (1 - s / 0.7) : 0;
    const restY = ground - S * (land ? 0.16 : 0.1);
    const pose = (q) => { ctx.translate(cx + shake * (1 - q), cy + (restY - cy) * q); ctx.rotate(q * Math.PI); ctx.translate(-cx, -cy); };
    ctx.save();
    ctx.filter = `grayscale(${drain}) brightness(${1 - 0.35 * drain})`;
    pose(ease);
    NO_SHADOW = true;
    drawBody(me, cx, cy, S, s < 0.7 ? t : 0);
    drawFace(s < 0.7 ? 'scared' : 'dead', 0);
    ctx.restore(); ctx.filter = 'none';
    // Its spirit rises and fades.
    const g = clamp01((s - 1.3) / 2.4);
    if (g > 0 && g < 1) ghost(cx + Math.sin(g * 7) * S * 0.04, restY - S * 0.25 - g * S * 0.5, S * 0.07, Math.sin(g * Math.PI) * 0.85);
    // Dust or marine snow settles over it, layer by layer, until only a fossil is left.
    if (bury > 0) {
      const top = ground + S * 0.05 - S * (land ? 0.68 : 0.5) * bury;
      const cols = land ? ['#3d2f25', '#4a3a2c', '#57442f', '#3a2c22'] : ['#1d2b33', '#22333c', '#283b45', '#1a2830'];
      for (let i = 0; i < 4; i++) {
        const y0 = top + (h - top) * (i / 4);
        ctx.fillStyle = cols[i];
        ctx.beginPath(); ctx.moveTo(0, y0);
        for (let x = 0; x <= w + 1; x += w / 8) ctx.lineTo(x, y0 + Math.sin(x * 0.02 + i * 2) * 4);
        ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
      }
      // The fossil: a pale stone print of the body, pressed into the rock where it fell.
      const fa = clamp01((s - 3.6) / 1.2);
      if (fa > 0) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, top + 8, w, h); ctx.clip();
        ctx.globalAlpha = 0.45 * fa; ctx.filter = 'grayscale(1) sepia(0.4) brightness(1.8) contrast(0.5)';
        pose(1); drawBody(me, cx, cy, S, 0);
        ctx.restore(); ctx.filter = 'none';
      }
    }
    NO_SHADOW = false;
    for (let i = 0; i < 24; i++) { const ph = ((s * 0.12) + i / 24) % 1; dot((i * 61) % w + Math.sin(s + i) * 6, ph * h, 1.5 + (i % 3), `rgba(220, 220, 210, ${0.35 * drain * (1 - ph)})`); }
    // A slow vignette, and the word.
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${0.7 * drain})`);
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
    const wa = clamp01((s - 1.6) / 0.8);
    if (wa > 0) comic('EXTINCT', w * 0.5, h * 0.17, S * 0.13 * (1.25 - 0.25 * wa), wa, '#ef7d6b', -0.04);
  }

  // ======================= SPRITES =======================
  // Bodies drawn once to an offscreen canvas, so the world map can show many creatures cheaply.
  // How far a body actually reaches (drawn once offscreen at S = 100, anchored at 0,0), so big or
  // oddly shaped bodies can be framed to fit instead of spilling out of their box.
  const extentCache = new Map();
  const bodyKey = (b) => JSON.stringify([b.stage, b.habitat, b.multicellular, b.parts, b.hue, b.traits, b.look, b.symmetry, b.segments, b.armPairs, b.skeleton, b.off]);
  function bodyExtent(b) {
    const key = bodyKey(b);
    let e = extentCache.get(key);
    if (e) return e;
    const c = document.createElement('canvas'); c.width = 400; c.height = 400;
    const prev = ctx; const prevFace = FACE;
    ctx = c.getContext('2d'); ctx.translate(200, 230);
    try { drawBody(b, 0, 0, 100, 0.6); } catch (err) { /* measure what we can */ }
    ctx = prev; FACE = prevFace;
    const data = c.getContext('2d').getImageData(0, 0, 400, 400).data;
    let x0 = 400; let y0 = 400; let x1 = 0; let y1 = 0;
    for (let y = 0; y < 400; y += 2) for (let x = 0; x < 400; x += 2) if (data[(y * 400 + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    e = x1 > x0 ? { minX: x0 - 200, maxX: x1 - 200, minY: y0 - 230, maxY: y1 - 230 } : { minX: -50, maxX: 50, minY: -50, maxY: 40 };
    extentCache.set(key, e);
    if (extentCache.size > 80) extentCache.delete(extentCache.keys().next().value);
    return e;
  }
  // Shrink (never grow) a body drawn at size S anchored at (ax, ay) so it fits inside the box.
  // Land bodies keep their feet where they were; the result is { S, x, y } to pass to drawBody.
  function fitBody(b, S, ax, ay, box) {
    const e = bodyExtent(b); const u = S / 100;
    const land = b.stage === 'creature' && b.habitat !== 'sea' && b.symmetry !== 'radial' && b.symmetry !== 'colonial';
    let k = 1;
    k = Math.min(k, (box.x1 - box.x0) / Math.max(1, (e.maxX - e.minX) * u));
    if (land) { const feet = ay + 36 * u; k = Math.min(k, (feet - box.y0) / Math.max(1, (36 - e.minY) * u)); }
    else k = Math.min(k, (box.y1 - box.y0) / Math.max(1, (e.maxY - e.minY) * u));
    k = Math.max(0.35, Math.min(1, k));
    const S2 = S * k; const u2 = S2 / 100;
    // Keep it horizontally inside the box.
    let x = ax; const left = x + e.minX * u2; const right = x + e.maxX * u2;
    if (right > box.x1) x -= right - box.x1; if (x + e.minX * u2 < box.x0) x += box.x0 - (x + e.minX * u2);
    let y = land ? ay + 36 * (u - u2) : ay;
    if (!land) { const top = y + e.minY * u2; const bot = y + e.maxY * u2; if (top < box.y0) y += box.y0 - top; else if (bot > box.y1) y -= bot - box.y1; }
    return { S: S2, x, y };
  }

  const spriteCache = new Map();
  function spriteFor(b) {
    const key = bodyKey(b);
    let c = spriteCache.get(key);
    if (c) return c;
    c = document.createElement('canvas');
    const size = 160;
    c.width = size; c.height = size;
    const prev = ctx;
    ctx = c.getContext('2d');
    const land = b.stage === 'creature' && b.habitat !== 'sea';
    const f = fitBody(b, (size * (land ? 0.82 : 0.9)) / sizeScale(b), size * (land ? 0.44 : 0.5), size * (land ? 0.46 : 0.5), { x0: 2, y0: 2, x1: size - 2, y1: size - 2 });
    drawBody(b, f.x, f.y, f.S, 0.6);
    ctx = prev;
    spriteCache.set(key, c);
    if (spriteCache.size > 60) spriteCache.delete(spriteCache.keys().next().value);
    return c;
  }

  // ======================= WORLD MAP =======================
  // Herds roam a side-on diorama. Each herd shows its population as a crowd, scaled by body size.
  const herds = new Map();
  let mapFrame = null;
  let mapHits = [];

  // Sprites scale with real body size, so giants tower over small herds.
  const realSize = (run, s) => (s ? s.size : G.bodySize(run));
  function herdScale(run, s) {
    return Math.max(0.35, Math.min(2.6, Math.pow(realSize(run, s), 0.85)));
  }

  // Each herd has a home territory spread across the map, and wanders around it.
  function behaviour(run, key, s, h) {
    const you = herds.get('you');
    const others = [...herds.entries()].filter(([k]) => k !== key);
    let tx = h.hx + (Math.random() - 0.5) * 0.3; let ty = h.hy + (Math.random() - 0.5) * 0.35;
    const zb = zoneBox(run, s);
    if (zb) { tx = zb.x[0] + Math.random() * (zb.x[1] - zb.x[0]); ty = zb.y[0] + Math.random() * (zb.y[1] - zb.y[0]); }
    // A parasite travels inside its host.
    const host = !s && G.hostOf(run);
    if (host && herds.get(host.name)) { const hh = herds.get(host.name); tx = hh.x + (Math.random() - 0.5) * 0.06; ty = hh.y + (Math.random() - 0.5) * 0.06; }
    if (s) {
      const st = G.speciesStatus(s);
      if (st === 'hostile' && you && Math.random() < 0.6) { tx = you.x + 0.08; ty = you.y; }
      else if ((st === 'allied' || st === 'friendly') && you && Math.random() < (st === 'allied' ? 0.75 : 0.5)) { tx = you.x + (Math.random() - 0.5) * 0.22; ty = you.y + (Math.random() - 0.5) * 0.22; }
      else if (st === 'wary' && you && Math.hypot(you.x - h.x, you.y - h.y) < 0.35) { tx = h.x + (h.x > you.x ? 0.3 : -0.3); ty = h.y + (h.y > you.y ? 0.2 : -0.2); }
      else if (s.role === 'predator' && Math.random() < 0.35) {
        const prey = others.filter(([k2]) => { const t2 = run.species.find((x) => x.name === k2); return t2 && t2.role === 'prey' && !t2.extinct; });
        if (prey.length) { const target = prey[Math.floor(Math.random() * prey.length)][1]; tx = target.x; ty = target.y; }
      } else if (s.role === 'prey') {
        const pred = others.find(([k2]) => { const t2 = run.species.find((x) => x.name === k2); return t2 && t2.role === 'predator' && !t2.extinct; });
        if (pred && Math.hypot(pred[1].x - h.x, pred[1].y - h.y) < 0.25) { tx = h.x + (h.x > pred[1].x ? 0.3 : -0.3); }
        else if (Math.random() < 0.35) {
          // Plant-eaters graze together.
          const mates = others.filter(([k2]) => { const t2 = run.species.find((x) => x.name === k2 && !x.extinct); return t2 && t2 !== s && (t2.role === 'prey' || t2.role === 'neighbor') && t2.niche !== s.niche; });
          if (mates.length) { const m = mates[Math.floor(Math.random() * mates.length)][1]; tx = m.x + (Math.random() - 0.5) * 0.15; ty = m.y + (Math.random() - 0.5) * 0.15; }
        }
      }
      // Species that share a niche are rivals and keep apart.
      const rival = others.find(([k2]) => { const t2 = run.species.find((x) => x.name === k2 && !x.extinct); return t2 && t2 !== s && t2.niche && t2.niche === s.niche; });
      if (rival && Math.hypot(rival[1].x - tx, rival[1].y - ty) < 0.2) { tx += tx > rival[1].x ? 0.2 : -0.2; }
      // Migrants cross the whole map.
      if (s.migrant) { tx = h.x < 0.5 ? 0.92 : 0.08; ty = h.y + (Math.random() - 0.5) * 0.2; }
      // Your Activity pulls its target toward or away from you.
      const act = run.activity;
      if (act && act.target === s.name && you) {
        if (act.id === 'war' || act.id === 'court') { tx = you.x + (Math.random() - 0.5) * 0.15; ty = you.y + (Math.random() - 0.5) * 0.15; }
      }
    } else {
      // Your own herd follows your Activity.
      const act = run.activity;
      const th = act && act.target && herds.get(act.target);
      if (th && (act.id === 'hunt' || act.id === 'war')) { tx = th.x + (Math.random() - 0.5) * 0.1; ty = th.y + (Math.random() - 0.5) * 0.1; }
      if (th && act.id === 'avoid') { tx = th.x > 0.5 ? 0.12 : 0.88; ty = th.y > 0.5 ? 0.15 : 0.85; }
      if (act && (act.id === 'migrate' || act.id === 'scout')) { tx = Math.random() < 0.5 ? 0.1 : 0.9; ty = Math.random(); }
    }
    h.tx = Math.max(0.06, Math.min(0.94, tx)); h.ty = Math.max(0, Math.min(1, ty));
  }

  // Home territories: spread evenly so herds never all bunch together.
  // Sea creatures keep to their home depth (see G.SEA_ZONES).
  const isSeaMap = (run) => run.stage === 'creature' && run.habitat === 'sea';
  function zoneBox(run, s) {
    if (!isSeaMap(run)) return null;
    return G.SEA_ZONE[s ? (s.zone || 'open') : G.zone(run)];
  }
  // The sea floor, in map units: a shallow reef shelf, a steep drop, then the abyss.
  function seabed(x) {
    if (x < 0.33) return 0.36 + Math.sin(x * 40) * 0.006;
    if (x < 0.58) return 0.36 + ((x - 0.33) / 0.25) * 0.57;
    return 0.93 + Math.sin(x * 31) * 0.01;
  }
  function homeFor(i, key, run, s) {
    const zb = run && zoneBox(run, s);
    if (zb) { const fx = key === 'you' ? 0.5 : ((i * 0.618 + 0.2) % 1); const fy = key === 'you' ? 0.5 : ((i * 0.381 + 0.3) % 1); return [zb.x[0] + fx * (zb.x[1] - zb.x[0]), zb.y[0] + fy * (zb.y[1] - zb.y[0])]; }
    if (key === 'you') return [0.45, 0.6];
    // Friends settle near you; wary and hostile species keep to the far edges.
    const st = s ? G.speciesStatus(s) : 'neutral';
    if (st === 'allied' || st === 'friendly') return [0.45 + (((i * 0.618) % 1) - 0.5) * 0.35, 0.6 + (((i * 0.381) % 1) - 0.5) * 0.3];
    if (st === 'wary' || st === 'hostile') return [i % 2 ? 0.1 + ((i * 0.27) % 0.12) : 0.8 + ((i * 0.27) % 0.12), 0.1 + ((i * 0.381) % 1) * 0.3];
    const hx = 0.12 + ((i * 0.618 + 0.11) % 1) * 0.76;
    const hy = 0.08 + ((i * 0.381 + 0.25) % 1) * 0.84;
    return [hx, hy];
  }

  // Scenery for the map: trees, rocks and ponds on land; kelp, coral and rocks at sea.
  let scenery = null; let sceneryKey = '';
  function makeScenery(run) {
    const biome = G.biome ? G.biome(run).id : '';
    const key = `${run.stage}-${run.habitat}-${run.origin}-${run.archetype}-${biome}`;
    if (key === sceneryKey) return scenery;
    let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const items = [];
    if (run.stage === 'cell') { for (let i = 0; i < 6; i++) items.push({ kind: 'blob', x: rnd(), y: rnd(), r: 0.5 + rnd() }); }
    else if (run.habitat === 'sea') {
      // Reef shelf, the drop-off and the abyss floor.
      for (let i = 0; i < 5; i++) { const x = rnd() * 0.32; items.push({ kind: 'kelp', x, y: seabed(x), r: 0.6 + rnd() * 0.5 }); }
      for (let i = 0; i < 8; i++) { const x = rnd() * 0.33; items.push({ kind: 'coral', x, y: seabed(x) + 0.003, r: 0.5 + rnd() * 0.5, hue: Math.floor(rnd() * 360) }); }
      for (let i = 0; i < 4; i++) { const x = 0.36 + rnd() * 0.2; items.push({ kind: 'rock', x, y: seabed(x) + 0.01, r: 0.5 + rnd() * 0.5 }); }
      for (let i = 0; i < 3; i++) { const x = 0.66 + i * 0.12 + rnd() * 0.04; items.push({ kind: 'seavent', x, y: seabed(x) + 0.01, r: 0.7 + rnd() * 0.4 }); items.push({ kind: 'worms', x: x + 0.035, y: seabed(x + 0.035) + 0.012, r: 0.6 }); }
    } else {
      // Each land biome has its own scenery mix: [kind, count].
      const mix = {
        plains: [['tree', 6], ['bush', 7], ['rock', 5], ['pond', 1]],
        jungle: [['tree', 16], ['bush', 10], ['pond', 1]],
        desert: [['cactus', 8], ['rock', 8], ['dune', 4]],
        tundra: [['pine', 7], ['snowmound', 8], ['rock', 4]],
        swamp: [['reed', 12], ['pond', 4], ['tree', 4]],
        shore: [['rock', 6], ['bush', 4], ['shell', 6]],
      }[biome] || [['tree', 9], ['bush', 7], ['rock', 5], ['pond', 1]];
      mix.forEach(([kind, n]) => { for (let i = 0; i < n; i++) items.push({ kind, x: rnd(), y: kind === 'pond' ? 0.3 + rnd() * 0.5 : rnd(), r: (kind === 'pond' ? 0.8 : 0.6) + rnd() * 0.6 }); });
    }
    scenery = items; sceneryKey = key;
    return items;
  }

  function drawScenery(it, x, y, k, t) {
    switch (it.kind) {
      case 'tree': line(x, y, x, y - k * 1.1, '#4d3420', k * 0.16); dot(x, y - k * 1.25, k * 0.55, '#2f5f37'); dot(x - k * 0.3, y - k * 1.05, k * 0.38, '#36703f'); dot(x + k * 0.32, y - k * 1.1, k * 0.36, '#295533'); break;
      case 'bush': dot(x, y - k * 0.2, k * 0.3, '#3b7a44'); dot(x + k * 0.25, y - k * 0.15, k * 0.24, '#346d3c'); dot(x - k * 0.22, y - k * 0.12, k * 0.22, '#40854a'); break;
      case 'rock': ctx.beginPath(); ctx.ellipse(x, y - k * 0.15, k * 0.4, k * 0.25, 0, Math.PI, 0); ctx.fillStyle = '#6b6f72'; ctx.fill(); ctx.beginPath(); ctx.ellipse(x - k * 0.1, y - k * 0.25, k * 0.15, k * 0.08, 0, Math.PI, 0); ctx.fillStyle = '#878b8e'; ctx.fill(); break;
      case 'pond': ctx.beginPath(); ctx.ellipse(x, y, k * 1.6, k * 0.45, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(80, 150, 190, 0.75)'; ctx.fill(); ctx.beginPath(); ctx.ellipse(x - k * 0.4, y - k * 0.1, k * 0.5, k * 0.08, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill(); break;
      case 'kelp': for (let i = 0; i < 3; i++) wavy(x + i * k * 0.2, y, k * 2, -Math.PI / 2, k * 0.15, t * 0.7, 'rgba(80, 140, 70, 0.8)', k * 0.12, i + x * 10); break;
      case 'coral': for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + i * k * 0.2, y - k * 0.5, x + i * k * 0.35, y - k * (0.8 - Math.abs(i) * 0.12)); ctx.strokeStyle = hsl(it.hue, 65, 60); ctx.lineWidth = k * 0.1; ctx.lineCap = 'round'; ctx.stroke(); } break;
      case 'blob': dot(x, y, k * 0.3, 'rgba(255,255,255,0.05)'); break;
      case 'cactus': ctx.fillStyle = '#4f8a4a'; ctx.fillRect(x - k * 0.08, y - k * 0.9, k * 0.16, k * 0.9); ctx.fillRect(x - k * 0.3, y - k * 0.6, k * 0.12, k * 0.3); ctx.fillRect(x - k * 0.3, y - k * 0.6, k * 0.25, k * 0.1); ctx.fillRect(x + k * 0.18, y - k * 0.75, k * 0.12, k * 0.35); ctx.fillRect(x + k * 0.06, y - k * 0.5, k * 0.24, k * 0.1); break;
      case 'dune': ctx.beginPath(); ctx.ellipse(x, y, k * 1.4, k * 0.35, 0, Math.PI, 0); ctx.fillStyle = 'rgba(214, 178, 110, 0.6)'; ctx.fill(); break;
      case 'pine': tri(x - k * 0.35, y - k * 0.2, x, y - k * 1.3, x + k * 0.35, y - k * 0.2, '#2d5a45'); tri(x - k * 0.25, y - k * 0.7, x, y - k * 1.5, x + k * 0.25, y - k * 0.7, '#e8f1f5'); line(x, y, x, y - k * 0.2, '#4d3420', k * 0.1); break;
      case 'snowmound': ctx.beginPath(); ctx.ellipse(x, y, k * 0.6, k * 0.25, 0, Math.PI, 0); ctx.fillStyle = '#eef4f7'; ctx.fill(); break;
      case 'reed': for (let i = -2; i <= 2; i++) { line(x + i * k * 0.06, y, x + i * k * 0.1 + Math.sin(t + i + x) * 2, y - k * (0.8 + (i % 2) * 0.2), '#6f7f3a', 2); dot(x + i * k * 0.1 + Math.sin(t + i + x) * 2, y - k * (0.8 + (i % 2) * 0.2), k * 0.05, '#7a4b2a'); } break;
      case 'shell': ctx.beginPath(); ctx.arc(x, y, k * 0.12, Math.PI, 0); ctx.fillStyle = '#f1dcc2'; ctx.fill(); break;
      case 'seavent': {
        ctx.beginPath(); ctx.moveTo(x - k * 0.3, y); ctx.lineTo(x - k * 0.12, y - k * 0.9); ctx.lineTo(x + k * 0.12, y - k * 0.9); ctx.lineTo(x + k * 0.3, y); ctx.closePath(); ctx.fillStyle = '#2b2522'; ctx.fill();
        for (let i = 0; i < 5; i++) { const ph = (t * 0.4 + i * 0.2 + x) % 1; dot(x + Math.sin(ph * 6 + i) * k * 0.15 * (1 + ph), y - k * (0.9 + ph * 1.6), k * (0.08 + ph * 0.18), `rgba(40,36,40,${0.7 * (1 - ph)})`); }
        glow('#ff8a3d', 10, () => dot(x, y - k * 0.9, k * 0.07, '#ff8a3d'));
        break;
      }
      case 'worms': for (let i = -2; i <= 2; i++) { const wx = x + i * k * 0.08; line(wx, y, wx + Math.sin(t + i) * 2, y - k * (0.3 + (i % 2) * 0.1), '#e8e0d0', k * 0.05); dot(wx + Math.sin(t + i) * 2, y - k * (0.3 + (i % 2) * 0.1), k * 0.05, '#e04a4a'); } break;
      default: break;
    }
  }

  // A side-on slice of ocean: light at the top, the reef shelf, the drop-off and the abyss.
  function drawDepthBackground(run, w, h, t) {
    const region = G.biome(run).id;
    const hue = G.ORIGIN[run.origin].hue + ({ polar: 15, vents: -25, kelp: -30, coast: -10 }[region] || 0);
    const top = h * 0.05; const bottom = h * 0.98; const Y = (u) => top + u * (bottom - top);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, hsl(hue + 5, 55, 46)); g.addColorStop(0.22, hsl(hue + 15, 55, 32)); g.addColorStop(0.5, hsl(hue + 35, 55, 17)); g.addColorStop(0.75, hsl(hue + 45, 55, 9)); g.addColorStop(1, hsl(hue + 50, 50, 4));
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // Surface and sunbeams
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.moveTo(0, top); for (let x = 0; x <= w; x += 12) ctx.lineTo(x, top + Math.sin(x * 0.05 + t * 1.5) * 2); ctx.lineTo(w, 0); ctx.lineTo(0, 0); ctx.fill();
    for (let i = 0; i < 5; i++) { const bx = ((i * 0.23 + 0.05) * w + Math.sin(t * 0.3 + i) * 20); ctx.beginPath(); ctx.moveTo(bx, top); ctx.lineTo(bx + 30, top); ctx.lineTo(bx + 90, h * 0.5); ctx.lineTo(bx + 40, h * 0.5); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,230,0.05)'; ctx.fill(); }
    // Marine snow and deep glows
    for (let i = 0; i < 40; i++) { const x = (i * 83.7) % w; const y = (i * 61.3 + t * 8) % h; dot(x, y, 1.1, `rgba(255,255,255,${y > h * 0.4 ? 0.25 : 0.1})`); }
    glow(GLOW, 8, () => { for (let i = 0; i < 9; i++) { const x = w * (0.55 + ((i * 0.37) % 0.42)); const y = Y(0.5 + ((i * 0.29) % 0.38)); if (Math.sin(t * 2 + i * 1.7) > 0.3) dot(x, y, 1.6, GLOW); } });
    // Sea floor
    ctx.beginPath(); ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 6) ctx.lineTo(x, Y(seabed(x / w)));
    ctx.lineTo(w, h); ctx.closePath();
    const sg = ctx.createLinearGradient(0, Y(0.35), 0, h); sg.addColorStop(0, hsl(40, 35, 48)); sg.addColorStop(0.3, hsl(30, 20, 22)); sg.addColorStop(1, hsl(240, 15, 7));
    ctx.fillStyle = sg; ctx.fill();
    // Regional touches: ice floes at the poles, smoking vents, forests of kelp.
    if (region === 'polar') for (let i = 0; i < 6; i++) { const x = ((i * 0.19 + 0.03) * w + Math.sin(t * 0.2 + i) * 6); ctx.fillStyle = 'rgba(235, 245, 250, 0.85)'; ctx.fillRect(x, top - 4, w * 0.12, 10 + (i % 3) * 4); }
    if (region === 'kelp') for (let i = 0; i < 14; i++) { const x = (i / 14) * w + 10; wavy(x, Y(seabed(x / w)), (Y(seabed(x / w)) - top) * 0.7, -Math.PI / 2, 8, t * 0.6, 'rgba(70, 130, 60, 0.45)', 4, i); }
    if (region === 'vents') for (let i = 0; i < 4; i++) { const x = w * (0.2 + i * 0.2); for (let k = 0; k < 5; k++) { const ph = (t * 0.3 + k * 0.2 + i * 0.13) % 1; dot(x + Math.sin(ph * 6) * 8, Y(seabed(x / w)) - ph * h * 0.4, 6 + ph * 14, `rgba(30,26,30,${0.5 * (1 - ph)})`); } }
    // Depth labels, with your home picked out
    const home = G.zone(run);
    ctx.font = "700 10px 'Atkinson Hyperlegible', sans-serif"; ctx.textBaseline = 'top';
    G.SEA_ZONES.forEach((z) => {
      const mine = z.id === home;
      ctx.textAlign = z.id === 'reef' ? 'left' : 'right';
      ctx.fillStyle = mine ? 'rgba(242, 181, 68, 0.9)' : 'rgba(232, 239, 228, 0.35)';
      ctx.fillText(z.name.toUpperCase() + (mine ? ' · HOME' : ''), z.id === 'reef' ? 8 : w - 8, Y(z.y[0]) - 14);
    });
  }

  function drawMapBackground(run, w, h, t) {
    const hue = G.ORIGIN[run.origin].hue;
    if (run.stage === 'creature' && run.habitat === 'land') {
      const g = ctx.createLinearGradient(0, 0, 0, h * 0.24);
      g.addColorStop(0, hsl(hue + 20, 45, 34)); g.addColorStop(1, hsl(hue + 30, 40, 24));
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h * 0.24);
      for (let i = 0; i < 3; i++) { const cx = ((i * 0.37 + 0.1) * w + t * 6) % (w + 120) - 60; dot(cx, h * (0.05 + i * 0.03), 14, 'rgba(255,255,255,0.08)'); dot(cx + 16, h * (0.05 + i * 0.03) + 3, 11, 'rgba(255,255,255,0.08)'); }
      ctx.fillStyle = hsl(hue + 40, 22, 20);
      ctx.beginPath(); ctx.moveTo(0, h * 0.24); for (let x = 0; x <= w; x += 16) ctx.lineTo(x, h * 0.24 - Math.abs(Math.sin(x * 0.012 + 1)) * h * 0.07 - Math.sin(x * 0.031) * h * 0.02); ctx.lineTo(w, h * 0.26); ctx.lineTo(0, h * 0.26); ctx.fill();
      // Ground colour by biome: [hue, saturation, lightness].
      const bio = G.biome(run).id;
      const [gh, gs, gl] = { plains: [95, 22, 19], jungle: [120, 30, 14], desert: [40, 35, 38], tundra: [200, 12, 62], swamp: [80, 22, 15], shore: [42, 30, 40] }[bio] || [95, 22, 19];
      const gg = ctx.createLinearGradient(0, h * 0.24, 0, h);
      gg.addColorStop(0, hsl(gh, gs, gl)); gg.addColorStop(1, hsl(gh, gs + 6, gl + 7));
      ctx.fillStyle = gg; ctx.fillRect(0, h * 0.24, w, h * 0.76);
      if (bio === 'shore') { ctx.fillStyle = 'rgba(80, 150, 190, 0.75)'; ctx.beginPath(); ctx.moveTo(0, h); for (let x = 0; x <= w; x += 10) ctx.lineTo(x, h * 0.8 + Math.sin(x * 0.03 + t * 1.5) * 6); ctx.lineTo(w, h); ctx.fill(); }
      if (bio !== 'desert' && bio !== 'tundra') for (let i = 0; i < 60; i++) { const x = (i * 97.3) % w; const y = h * 0.27 + ((i * 53.1) % (h * 0.72)); line(x, y, x + Math.sin(t + i) * 1.5, y - 5 - (y / h) * 5, hsl(gh, gs + 8, gl + 13), 1.5); }
      if (bio === 'tundra') for (let i = 0; i < 40; i++) { const x = ((i * 53.7) + t * 20) % w; const y = ((i * 91.1) + t * 35) % h; dot(x, y, 1.5, 'rgba(255,255,255,0.7)'); }
    } else if (isSeaMap(run)) { drawDepthBackground(run, w, h, t); return; }
    else drawBackground(run, w, h, t);
    const o = run.origin;
    const P = { w, h, cx: w / 2, cy: h / 2, S: Math.min(w, h), k: 2, t, ground: h * 0.95 };
    if (o === 'vents') drawProp('vent', 'back', P);
    if (o === 'frozen') drawProp('snow', 'back', P);
    if (o === 'toxic') drawProp('plume', 'back', P);
  }

  // Seasons and weather tint the world and fill the air: spring showers and petals, summer haze,
  // falling leaves, winter snow; at sea plankton blooms, storms with rain and lightning, and ice.
  function drawWeather(run, w, h, t, top, land, seaMap) {
    const se = G.season && G.season(run);
    const biome = G.biomeMatters(run) ? G.biome(run).id : null;
    const id = se ? se.id : null;
    const tint = (c) => { ctx.fillStyle = c; ctx.fillRect(0, 0, w, h); };
    const fall = (n, speed, drift, draw) => { for (let i = 0; i < n; i++) { const r1 = prand(i + 3); const r2 = prand(i + 41); const y = ((t * speed * (0.6 + r2 * 0.6) + r1 * h) % (h + 20)) - 10; const x = ((r2 * w + Math.sin(t * 0.7 + i) * drift + t * drift * 0.3) % (w + 20) + w + 20) % (w + 20) - 10; draw(x, y, i); } };
    if (land) {
      if (id === 'spring') { tint('rgba(150, 220, 140, 0.06)'); fall(26, 210, 6, (x, y) => line(x, y, x - 2, y + 9, 'rgba(200, 225, 255, 0.45)', 1.2)); fall(8, 25, 30, (x, y, i) => dot(x, y, 2.4, i % 2 ? 'rgba(255, 190, 215, 0.85)' : 'rgba(255, 255, 255, 0.8)')); }
      if (id === 'summer') { tint('rgba(255, 210, 120, 0.08)'); const g = ctx.createRadialGradient(w * 0.85, 0, 4, w * 0.85, 0, h * 0.5); g.addColorStop(0, 'rgba(255, 230, 150, 0.35)'); g.addColorStop(1, 'rgba(255, 230, 150, 0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) { ctx.beginPath(); for (let x = 0; x <= w; x += 12) ctx.lineTo(x, top + h * 0.1 * i + Math.sin(x * 0.05 + t * 2 + i) * 2); ctx.strokeStyle = 'rgba(255, 240, 200, 0.07)'; ctx.lineWidth = 3; ctx.stroke(); } }
      if (id === 'autumn') { tint('rgba(220, 120, 40, 0.09)'); fall(18, 30, 40, (x, y, i) => { ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2 + i); ctx.beginPath(); ctx.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2); ctx.fillStyle = ['#d9822b', '#b5451b', '#e8b33a'][i % 3]; ctx.fill(); ctx.restore(); }); }
      if (id === 'winter' || biome === 'tundra') {
        tint('rgba(190, 215, 255, 0.10)');
        ctx.fillStyle = 'rgba(245, 250, 255, 0.22)'; ctx.fillRect(0, top, w, h - top);
        for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.ellipse(prand(i + 7) * w, top + prand(i + 19) * (h - top), 18 + prand(i) * 26, 4, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill(); }
        fall(id === 'winter' ? 40 : 18, 40, 20, (x, y, i) => dot(x, y, 1.5 + (i % 3) * 0.7, 'rgba(255,255,255,0.85)'));
      }
      if (biome === 'desert' && id !== 'winter') for (let i = 0; i < 3; i++) { ctx.beginPath(); for (let x = 0; x <= w; x += 10) ctx.lineTo(x, top + 20 + i * 30 + Math.sin(x * 0.04 + t * 3 + i * 2) * 3); ctx.strokeStyle = 'rgba(255, 220, 160, 0.08)'; ctx.lineWidth = 4; ctx.stroke(); }
    } else if (run.stage === 'creature') {
      if (id === 'bloom') { tint('rgba(110, 200, 90, 0.10)'); fall(40, 6, 12, (x, y, i) => dot(x, y, 1.2 + (i % 3) * 0.6, 'rgba(160, 230, 120, 0.55)')); }
      if (id === 'storms') {
        tint('rgba(10, 20, 35, 0.22)');
        for (let i = 0; i < 3; i++) { ctx.beginPath(); for (let x = 0; x <= w; x += 8) ctx.lineTo(x, h * 0.02 + i * 5 + Math.sin(x * 0.03 + t * 4 + i) * 6); ctx.strokeStyle = 'rgba(220, 235, 255, 0.35)'; ctx.lineWidth = 2; ctx.stroke(); }
        fall(30, 260, 4, (x, y) => line(x, y, x - 3, y + 12, 'rgba(200, 220, 255, 0.25)', 1));
        if (Math.sin(t * 0.9) > 0.985) tint('rgba(230, 240, 255, 0.35)');
      }
      if (id === 'cold' || biome === 'polar') {
        tint('rgba(170, 210, 255, 0.10)');
        for (let i = 0; i < 6; i++) { const x = ((prand(i + 2) * w + t * 6) % (w + 80)) - 40; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 50, 0); ctx.lineTo(x + 40, 12 + (i % 2) * 6); ctx.lineTo(x + 8, 10); ctx.closePath(); ctx.fillStyle = 'rgba(240, 250, 255, 0.75)'; ctx.fill(); }
        fall(22, 12, 8, (x, y) => dot(x, y, 1.3, 'rgba(255,255,255,0.6)'));
      }
      if (id === 'calm') tint('rgba(120, 200, 255, 0.04)');
    }
  }

  G.startMap = function (canvas, onTap) {
    if (mapFrame) cancelAnimationFrame(mapFrame);
    let last = performance.now();
    canvas.onclick = (e) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left; const y = e.clientY - r.top;
      let best = null; let bd = 1e9;
      mapHits.forEach((hit) => { const d = Math.hypot(hit.x - x, hit.y - y); if (d < hit.r && d < bd) { bd = d; best = hit; } });
      if (best && onTap) onTap(best.key);
    };
    function frame(now) {
      const run = G.run;
      if (!canvas.isConnected || !run) { mapFrame = null; return; }
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      const { w, h } = fit(canvas);
      const t = reduceMotion ? 0 : now / 1000;
      ctx.clearRect(0, 0, w, h);
      drawMapBackground(run, w, h, t);
      const wet = run.stage === 'cell' || run.habitat === 'sea';
      const land = !wet;
      const seaMap = isSeaMap(run);
      const top = land ? h * 0.3 : seaMap ? h * 0.05 : h * 0.12; const bottom = seaMap ? h * 0.98 : h * 0.93;
      const base = Math.min(w, h) * 0.12;
      const flies = (b2) => b2.stage === 'creature' && ['feathered_wings', 'true_wings', 'insect_wings'].some((id) => Object.values(b2.parts || {}).some((sl) => sl && (sl.id === id || sl.merged === id)));
      // Keep the herd list in sync with the world.
      const live = [{ key: 'you', s: null, pop: run.pop, body: G.bodyOf(run) }].concat(run.species.filter((s) => !s.extinct).map((s) => ({ key: s.name, s, pop: s.pop, body: G.speciesBody(s) })));
      [...herds.keys()].forEach((k) => { if (!live.find((l) => l.key === k)) herds.delete(k); });
      live.forEach((l, i) => {
        let hd = herds.get(l.key);
        if (!hd) { const [hx0, hy0] = homeFor(i, l.key, run, l.s); hd = { x: hx0, y: hy0, hx: hx0, hy: hy0, dir: 1 }; herds.set(l.key, hd); behaviour(run, l.key, l.s, hd); }
        // A parasite rides inside its host's herd.
        const hostNow = l.key === 'you' && G.hostOf(run);
        const hostHerd = hostNow && herds.get(hostNow.name);
        if (hostHerd) { hd.x = hostHerd.x + 0.02; hd.y = hostHerd.y + 0.01; hd.tx = hd.x; hd.ty = hd.y; hd.dir = hostHerd.dir; return; }
        const zid = seaMap ? (l.s ? l.s.zone : G.zone(run)) : null;
        if (hd.zone !== zid) { hd.zone = zid; behaviour(run, l.key, l.s, hd); }
        // Fast species dart about; slow ones plod.
        const spdStat = l.s ? G.speciesStat(l.s, 'spd') : G.stat(run, 'spd');
        const speed = Math.max(0.008, Math.min(0.09, 0.006 + spdStat * 0.007)) * (reduceMotion ? 0 : 1) * (flies(l.body) ? 1.6 : 1);
        const dx = hd.tx - hd.x; const dy = hd.ty - hd.y;
        const d = Math.hypot(dx, dy * 0.5);
        if (d < 0.02) behaviour(run, l.key, l.s, hd);
        else { hd.x += (dx / d) * speed * dt; hd.y += (dy / d) * speed * dt * 0.5; if (Math.abs(dx) > 0.01) hd.dir = dx > 0 ? 1 : -1; }
      });
      // Draw scenery and herds together, far to near.
      const depthOf = (y) => (land ? 0.55 + 0.45 * y : seaMap ? 0.85 : 0.7 + 0.3 * y);
      const drawables = makeScenery(run).map((it) => ({ y: it.y, draw: () => { const k = base * depthOf(it.y) * it.r; drawScenery(it, it.x * w, top + it.y * (bottom - top), k, t); } }));
      mapHits = [];
      const labelBoxes = []; const labelDraws = [];
      live.forEach((l) => {
        const hd = herds.get(l.key);
        drawables.push({ y: hd.y, draw: () => {
          const depth = depthOf(hd.y);
          const size = base * depth * herdScale(run, l.s);
          const pop = Math.max(0, Math.round(l.pop));
          const icons = Math.max(1, pop <= 16 ? pop : Math.min(32, Math.round(16 + (pop - 16) / 3)));
          const hx = hd.x * w; const groundY = top + hd.y * (bottom - top);
          const air = flies(l.body) ? h * 0.16 + Math.sin(t * 1.3 + hd.hx * 9) * 8 : 0;
          const hy = groundY - air;
          const spr = spriteFor(l.body);
          const spread = size * (0.35 + Math.sqrt(icons) * 0.32);
          for (let i = 0; i < icons; i++) {
            const ang = i * 2.399; const rad = spread * Math.sqrt((i + 0.5) / icons);
            const bob = Math.sin(t * (air ? 9 : 6) + i * 1.7) * size * (air ? 0.08 : 0.03);
            const mx = hx + Math.cos(ang) * rad + Math.sin(t * 0.8 + i) * size * 0.08;
            const my = hy + Math.sin(ang) * rad * 0.35 + bob;
            if (air) { ctx.beginPath(); ctx.ellipse(mx, groundY + Math.sin(ang) * rad * 0.35, size * 0.25, size * 0.06, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fill(); }
            ctx.save(); ctx.translate(mx, my); if (hd.dir < 0) ctx.scale(-1, 1);
            ctx.drawImage(spr, -size / 2, -size / 2, size, size);
            ctx.restore();
          }
          const bond = !l.s ? '' : l.s.name === run.partner && G.gimmick(run) === 'symbiote' ? '♥ ' : l.s.name === run.host && G.gimmick(run) === 'parasite' ? 'Host · ' : l.s.bud ? '✦ ' : l.s.name === run.mimic && G.gimmick(run) === 'mimic' ? '🎭 ' : '';
          const label = `${bond}${l.key === 'you' ? 'You' : l.key} · ${pop}${run.stage === 'cell' ? '' : ` · ${G.sizeLabel(realSize(run, l.s), run.stage)}`}`;
          ctx.font = `700 ${Math.round(Math.max(10, 11 * depth))}px 'Atkinson Hyperlegible', sans-serif`;
          const tw = ctx.measureText(label).width + 12;
          const lx = Math.max(tw / 2 + 4, Math.min(w - tw / 2 - 4, hx));
          let ly = hy - spread * 0.35 - size * 0.55;
          // Labels step aside when they would overlap another herd's label.
          for (let k = 0; k < 5 && labelBoxes.some((bx) => Math.abs(bx.x - lx) < (bx.w + tw) / 2 && Math.abs(bx.y - ly) < 18); k++) ly -= 19;
          labelBoxes.push({ x: lx, y: ly, w: tw });
          const st = l.s ? G.speciesStatus(l.s) : 'you';
          const font = ctx.font;
          // Labels go on top of everything, after all herds are drawn.
          labelDraws.push(() => {
            ctx.font = font;
            ctx.fillStyle = l.key === 'you' ? 'rgba(242, 181, 68, 0.95)' : st === 'hostile' ? 'rgba(239, 125, 107, 0.9)' : st === 'allied' ? 'rgba(143, 209, 106, 0.9)' : 'rgba(12, 26, 29, 0.78)';
            ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(lx - tw / 2, ly - 9, tw, 18, 9); else ctx.rect(lx - tw / 2, ly - 9, tw, 18); ctx.fill();
            ctx.fillStyle = l.key === 'you' || st === 'hostile' || st === 'allied' ? '#1c1414' : '#e8efe4';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, lx, ly + 1);
          });
          mapHits.push({ key: l.key, x: hx, y: hy, r: Math.max(44, spread + size * 0.4) });
        } });
      });
      drawables.sort((p1, p2) => p1.y - p2.y).forEach((d2) => d2.draw());
      drawWeather(run, w, h, t, top, land, seaMap);
      labelDraws.forEach((d2) => d2());
      mapFrame = requestAnimationFrame(frame);
    }
    mapFrame = requestAnimationFrame(frame);
  };
  G.resetMap = function () { herds.clear(); };

  // ======================= FULL-SCREEN VIEWER =======================
  let viewFrame = null;
  G.playViewer = function (canvas, b, run) {
    if (viewFrame) cancelAnimationFrame(viewFrame);
    const start = performance.now();
    const moods = ['happy', 'proud', 'love', 'surprised', 'sleepy', 'angry'];
    const anims = ['social', 'grow', 'eat', 'mutate', 'rest', 'attack'];
    function frame(now) {
      if (!canvas.isConnected) { viewFrame = null; return; }
      const { w, h } = fit(canvas);
      const t = reduceMotion ? 0 : now / 1000;
      const el = (now - start) / 1000;
      const cycle = Math.floor(el / 3) % anims.length;
      const k = (el % 3) / DUR;
      ctx.clearRect(0, 0, w, h);
      if (run) drawBackground(Object.assign({}, run, { stage: b.stage, habitat: b.habitat }), w, h, t);
      const land = b.stage === 'creature' && b.habitat !== 'sea';
      const S = Math.min(w * 0.85, h * 0.95) / sizeScale(b);
      const cx = w * (land ? 0.45 : 0.5); const cy = h * (land ? 0.4 : 0.5);
      const T = animTransform(anims[cycle], 0, k, w * 0.2);
      const pivotY = land ? cy + S * sizeScale(b) * 0.36 : cy;
      ctx.save(); ctx.translate(cx + T.dx * 0.4, pivotY + T.dy); ctx.rotate(T.rot); ctx.scale(T.sx, T.sy); ctx.translate(-cx, -pivotY);
      const f = fitBody(b, S, cx, cy, { x0: w * 0.03, y0: h * 0.04, x1: w * 0.97, y1: h * 0.97 });
      drawBody(b, f.x, f.y, f.S, t);
      drawFace(moods[cycle], t);
      ctx.restore();
      viewFrame = reduceMotion ? null : requestAnimationFrame(frame);
    }
    viewFrame = requestAnimationFrame(frame);
  };

  // The editor's live preview: redraws your creature every frame, so slider changes show at once.
  let editFrame = null;
  G.playEditor = function (canvas) {
    if (editFrame) cancelAnimationFrame(editFrame);
    function frame(now) {
      const run = G.run;
      if (!canvas.isConnected || !run) { editFrame = null; return; }
      const { w, h } = fit(canvas);
      const t = reduceMotion ? 0.6 : now / 1000;
      ctx.clearRect(0, 0, w, h);
      drawBackground(run, w, h, t);
      const b = G.bodyOf(run);
      const land = b.habitat !== 'sea';
      const S = Math.min(w * 0.8, h * 1.05) / sizeScale(b);
      const f = fitBody(b, S, w * (land ? 0.45 : 0.5), h * (land ? 0.36 : 0.5), { x0: w * 0.03, y0: h * 0.04, x1: w * 0.97, y1: h * 0.97 });
      drawBody(b, f.x, f.y, f.S, t);
      drawFace('happy', t);
      editFrame = requestAnimationFrame(frame);
    }
    editFrame = requestAnimationFrame(frame);
  };

  G.stopScene = function () { if (sceneFrame) cancelAnimationFrame(sceneFrame); sceneFrame = null; };
}());
