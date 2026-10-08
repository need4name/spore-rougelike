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
  let FACE = null; // where the last drawn body's eye and mouth are, for expressions

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
  function look(b) {
    const p = {}; let accent = null;
    Object.entries(b.parts || {}).forEach(([slot, s]) => {
      if (!s) return;
      p[slot] = s.id;
      if (s.merged) {
        const kw = (G.PART[s.merged].keywords || [])[0];
        if (!accent) accent = kw ? G.KEYWORDS[kw].color : hsl(40, 80, 65);
      }
    });
    return { p, accent };
  }

  function sizeScale(b) {
    if (b.traits.includes('giant')) return 1.22;
    if (b.traits.includes('small_many')) return 0.8;
    return 1;
  }

  // ======================= CELL =======================
  function drawCell(b, cx, cy, R, t) {
    const hue = b.hue;
    const { p, accent } = look(b);
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
    if (p.membrane === 'slime_coat') {
      ctx.beginPath(); for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.1) { const [x, y] = at(a, 1.22); a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.fillStyle = hsl(100, 50, 60, 0.18); ctx.fill();
    }
    if (p.membrane === 'spikes') {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + 0.2;
        const [x1, y1] = at(a - 0.08); const [x2, y2] = at(a + 0.08); const [x3, y3] = at(a, 1.35);
        tri(x1, y1, x3, y3, x2, y2, BONE);
      }
    }
    if (p.motion === 'flagellum' || p.motion === 'lumen_flagellum') {
      const [x, y] = at(Math.PI);
      wavy(x, y, R * 1.3, Math.PI, R * 0.25, t, dark, R * 0.07);
      if (p.motion === 'lumen_flagellum') glow(GLOW, 10, () => { for (let i = 1; i < 5; i++) dot(x - R * 0.28 * i, y + Math.sin(i * 1.3 + t * 4) * R * 0.06 * i, R * 0.045, GLOW); });
    }
    if (p.motion === 'jet_vacuole') { const [x, y] = at(Math.PI, 0.95); dot(x - R * 0.12, y, R * 0.24, hsl(hue, 40, 45)); dot(x - R * 0.3, y, R * 0.1, hsl(hue, 30, 20)); }
    if (p.motion === 'drift_sail') {
      ctx.beginPath(); ctx.moveTo(cx - R * 0.5, cy - R * 0.8); ctx.quadraticCurveTo(cx - R * 0.2, cy - R * 1.9, cx + R * 0.4, cy - R * 0.9);
      ctx.fillStyle = hsl(hue + 30, 60, 70, 0.55); ctx.fill();
    }
    if (p.motion === 'pseudopods') {
      for (let i = 0; i < 4; i++) { const a = Math.PI * 0.3 + i * 0.4; const [x, y] = at(a, 1.05); dot(x, y, R * (0.2 + 0.04 * Math.sin(t * 2 + i)), hsl(hue, 50, 52)); }
    }
    if (p.mouth === 'proboscis') { const [x, y] = at(0); line(x - 4, y, x + R * 0.7, y + Math.sin(t * 2) * 4, dark, R * 0.1); }
    if (p.mouth === 'venom_stylet') { const [x, y] = at(0); line(x - 4, y, x + R * 0.8, y, VENOM, R * 0.05); }
    if (p.senses === 'glow_lure') {
      const [x, y] = at(-Math.PI / 3);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + R * 0.3, y - R * 0.9, x + R * 0.8, y - R * 0.5);
      ctx.strokeStyle = dark; ctx.lineWidth = R * 0.04; ctx.stroke();
      glow(GLOW, 18, () => dot(x + R * 0.8, y - R * 0.5 + Math.sin(t * 3) * 2, R * 0.09, GLOW));
    }
    if (p.senses === 'chemoreceptor') {
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
    const hard = p.membrane === 'silica_shell' || p.membrane === 'plated_wall';
    ctx.lineWidth = R * (hard ? 0.11 : 0.045); ctx.strokeStyle = hard ? SHELL : (accent || dark); ctx.stroke();
    if (p.membrane === 'plated_wall') for (let i = 0; i < 8; i++) { const [x1, y1] = at((i / 8) * Math.PI * 2, 0.88); const [x2, y2] = at((i / 8) * Math.PI * 2, 1.04); line(x1, y1, x2, y2, SHELL, R * 0.045); }

    // Inside: nucleus or a cluster of cells
    if (b.multicellular) {
      ctx.save(); ctx.beginPath(); for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.1) { const [x, y] = at(a, 0.98); a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.clip();
      for (let i = 0; i < 14; i++) { const a = i * 2.4; const r = R * 0.75 * Math.sqrt((i + 0.5) / 14); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r * sx, cy + Math.sin(a) * r * sy, R * 0.22, 0, Math.PI * 2); ctx.strokeStyle = hsl(hue, 40, 40, 0.5); ctx.lineWidth = 1.2; ctx.stroke(); }
      ctx.restore();
    } else {
      dot(cx - R * 0.15, cy + R * 0.05, R * 0.3, hsl(hue, 40, 40, 0.8));
      dot(cx - R * 0.2, cy, R * 0.12, hsl(hue, 40, 25, 0.8));
    }
    if (p.mouth === 'chloroplasts' || p.organ === 'algae_chamber') {
      [[0.3, -0.4], [0.45, 0.3], [-0.5, -0.35], [-0.45, 0.45], [0.1, 0.55]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.ellipse(cx + dx * R, cy + dy * R, R * 0.1, R * 0.06, dx * 3, 0, Math.PI * 2); ctx.fillStyle = PLANT; ctx.fill(); });
    }
    if (p.membrane === 'toxin_sac' || p.organ === 'toxin_gland') { dot(cx + R * 0.2, cy + R * 0.4, R * 0.14, VENOM); dot(cx + R * 0.38, cy + R * 0.2, R * 0.09, VENOM); }
    if (p.organ === 'fat_vacuole') dot(cx - R * 0.35, cy - R * 0.3, R * 0.22, hsl(48, 80, 70, 0.85));
    if (p.organ === 'stomach_chamber') { ctx.beginPath(); ctx.ellipse(cx + R * 0.1, cy + R * 0.25, R * 0.35, R * 0.22, 0, 0, Math.PI * 2); ctx.fillStyle = hsl(hue, 40, 22, 0.7); ctx.fill(); }
    if (p.organ === 'neuron_cluster') { for (let i = 0; i < 6; i++) { const a = i * 1.05; line(cx, cy - R * 0.1, cx + Math.cos(a) * R * 0.45, cy - R * 0.1 + Math.sin(a) * R * 0.45, hsl(50, 90, 75), 1.5); } dot(cx, cy - R * 0.1, R * 0.08, hsl(50, 90, 80)); }
    if (p.organ === 'calcium_core') dot(cx, cy, R * 0.2, BONE);
    if (p.membrane === 'photophores' || p.organ === 'photocyte_cluster') {
      glow(GLOW, 12, () => { for (let i = 0; i < 9; i++) { const [x, y] = at((i / 9) * Math.PI * 2 + 0.3, 0.86); dot(x, y, R * 0.04 * (1 + 0.4 * Math.sin(t * 3 + i)), GLOW); } });
    }
    if (p.senses === 'magnetosome') for (let i = 0; i < 5; i++) dot(cx - R * 0.4 + i * R * 0.12, cy + R * 0.5, R * 0.035, '#1c1414');

    // Front
    if (p.mouth === 'filter_mouth') { const [x, y] = at(0); for (let i = -2; i <= 2; i++) line(x - 2, y + i * R * 0.08, x + R * 0.18, y + i * R * 0.1, dark, R * 0.03); }
    if (p.mouth === 'tiny_jaw' || p.mouth === 'engulfing_maw') {
      const [x, y] = at(0);
      const big = p.mouth === 'engulfing_maw' ? 1.8 : 1;
      const open = (0.12 + Math.abs(Math.sin(t * 2)) * 0.08) * big;
      tri(x - R * 0.25 * big, y, x + 4, y - R * open * 1.5, x + 4, y + R * open * 1.5, hsl(hue, 40, 18));
      line(x, y - R * open * 1.4, x + R * 0.12, y - R * open * 0.4, BONE, R * 0.05);
      line(x, y + R * open * 1.4, x + R * 0.12, y + R * open * 0.4, BONE, R * 0.05);
    }
    if (p.mouth === 'lure_mouth') { const [x, y] = at(0); glow(GLOW, 16, () => dot(x - R * 0.08, y, R * 0.14, GLOW)); }
    { const [fx, fy] = at(-0.45, 0.68); FACE = { x: fx, y: fy, r: R * 0.12, mx: fx + R * 0.12, my: fy + R * 0.36, top: cy - R * 1.05, skin: hsl(hue, 60, 66), s: R * 2.2 }; }
    if (p.senses === 'eyespot' || p.senses === 'plated_eye' || !p.senses || p.senses === 'magnetosome' || p.senses === 'chemoreceptor') {
      const [x, y] = at(-0.45, 0.68);
      dot(x, y, R * 0.12, '#1c1414'); dot(x + R * 0.03, y - R * 0.03, R * 0.04, '#fff');
      if (p.senses === 'plated_eye') { ctx.beginPath(); ctx.arc(x, y, R * 0.17, 0, Math.PI * 2); ctx.strokeStyle = SHELL; ctx.lineWidth = R * 0.05; ctx.stroke(); }
    }
    if (p.senses === 'stinging_cilia') for (let i = -3; i <= 3; i++) { const a = i * 0.14; const [x1, y1] = at(a); const [x2, y2] = at(a, 1.25); line(x1, y1, x2, y2, VENOM, R * 0.03); }
    if (p.motion === 'cilia') {
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
    const { p, accent } = look(b);
    const biped = p.hindLimbs === 'upright_legs';
    const legLen = S * (p.hindLimbs === 'pillar_legs' ? 0.17 : biped ? 0.26 : 0.21);
    const rx = S * (biped ? 0.17 : 0.27); const ry = S * (biped ? 0.24 : 0.15);
    const cy = ground - legLen - ry * 0.8 + Math.sin(t * 1.6) * 1.5;
    const body = hsl(hue, 50, 55); const dark = hsl(hue, 40, 30); const light = hsl(hue, 60, 70);
    const hx = biped ? cx + rx * 0.4 : cx + rx * 0.95;
    const hy = biped ? cy - ry * 1.15 : cy - ry * 0.6;
    const hr = S * 0.1;

    ctx.beginPath(); ctx.ellipse(cx + rx * 0.2, ground + 2, rx * 1.3, S * 0.025, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();

    // Tail
    const tx = cx - rx * 0.85; const ty = biped ? cy + ry * 0.5 : cy - ry * 0.2;
    const tEnd = [cx - rx * (biped ? 2.2 : 1.8), ty - ry * (biped ? -0.3 : 1.0) - Math.sin(t * 2) * 5];
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(cx - rx * 1.5, ty - ry * 0.1, tEnd[0], tEnd[1]);
    ctx.strokeStyle = body; ctx.lineWidth = S * (p.tail === 'club_tail' ? 0.06 : 0.045); ctx.lineCap = 'round'; ctx.stroke();
    if (p.tail === 'club_tail') dot(tEnd[0], tEnd[1], S * 0.05, SHELL);
    if (p.tail === 'display_tail') ['#f2c14e', '#e46a5c', '#6fd3c7'].forEach((c, i) => { ctx.beginPath(); ctx.ellipse(tEnd[0] - i * 6, tEnd[1] - i * 8, S * 0.025, S * 0.09, -0.6 + i * 0.3, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); });
    if (p.tail === 'stinger_tail') { tri(tEnd[0], tEnd[1], tEnd[0] + 12, tEnd[1] - 4, tEnd[0] + 4, tEnd[1] + 8, VENOM); }
    if (p.tail === 'glow_tail') glow(GLOW, 16, () => dot(tEnd[0], tEnd[1], S * 0.03, GLOW));
    if (p.tail === 'prehensile_tail') { ctx.beginPath(); ctx.arc(tEnd[0], tEnd[1] + 6, 7, Math.PI, Math.PI * 2.6); ctx.strokeStyle = body; ctx.lineWidth = S * 0.03; ctx.stroke(); }

    // Back parts behind body
    const backTopX = cx - rx * 0.1; const backTopY = cy - ry * 0.85;
    if (p.back === 'display_frill' || p.back === 'lumen_sail') {
      const isGlow = p.back === 'lumen_sail';
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
    if (p.back === 'fat_hump') { ctx.beginPath(); ctx.ellipse(backTopX, cy - ry * 0.8, rx * 0.5, ry * 0.7, 0, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill(); }
    if (p.back === 'carapace') {
      ctx.beginPath(); ctx.ellipse(cx - rx * 0.05, cy - ry * 0.15, rx * 1.05, ry * 1.25, 0, Math.PI, 0); ctx.fillStyle = SHELL; ctx.fill();
      for (let i = 1; i < 5; i++) { const x = cx - rx + (i / 5) * rx * 2; line(x, cy - ry * 0.2, x - (x - cx) * 0.2, cy - ry * 1.3, '#7f8c93', S * 0.01); }
    }

    // Limbs
    function leg(x, top, len, kind, foot, col, swing, front) {
      const gy = top + len;
      if (kind === 'pillar_legs' || kind === 'pillar_forelegs') { ctx.fillStyle = col; ctx.fillRect(x - S * 0.035, top, S * 0.07, len); }
      else if (kind === 'fore_tentacles') { wavy(x, top, len + S * 0.02, Math.PI / 2, S * 0.04, t, col, S * 0.03, front ? 2 : 0); return; }
      else {
        const thick = kind === 'digging_forelegs' || kind === 'powerful_haunches' ? 0.035 : kind === 'grasping_arms' ? 0.026 : 0.022;
        const kx = x + (kind === 'runner_legs' || kind === 'hopping_legs' ? -S * 0.05 : S * 0.03) + swing;
        ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(kx, top + len * 0.5); ctx.lineTo(x + swing, gy);
        ctx.strokeStyle = col; ctx.lineWidth = S * thick; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
      }
      drawFoot(x + swing, gy, foot, col);
    }
    function drawFoot(x, y, foot, col) {
      if (!foot) return;
      if (foot === 'hooves' || foot === 'front_hooves') { ctx.fillStyle = '#3b2f2a'; ctx.fillRect(x - 5, y - 5, 10, 6); }
      else if (foot === 'sharp_claws' || foot === 'raptor_talons' || foot === 'hooked_talons' || foot === 'venom_barbs' || foot === 'venom_spurs') {
        const c = foot.startsWith('venom') ? VENOM : BONE;
        for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x + k * 4 - 2, y - 3); ctx.quadraticCurveTo(x + k * 4 + 7, y - 2, x + k * 4 + 7, y + 3); ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.stroke(); }
      } else if (foot === 'webbed_feet') { tri(x - 4, y, x + 12, y - 1, x + 10, y + 3, col); }
      else if (foot === 'heavy_feet') { ctx.fillStyle = col; ctx.fillRect(x - 8, y - 6, 16, 7); }
      else if (foot === 'grasping_fingers') { for (let k = -1; k <= 1; k++) line(x, y - 2, x + 6 + k, y + 4 + k * 3, col, 2); }
      else dot(x + 2, y - 1, 4, col);
    }
    const backCol = hsl(hue, 35, 25);
    const hindX = biped ? [cx] : [cx - rx * 0.6];
    const frontX = biped ? [] : [cx + rx * 0.5];
    // far side
    hindX.forEach((x, i) => p.hindLimbs && leg(x - S * 0.02, cy + ry * 0.5, ground - cy - ry * 0.5, p.hindLimbs, p.feet, backCol, Math.sin(t * 2 + i) * 3, false));
    frontX.forEach((x) => p.frontLimbs && p.frontLimbs !== 'wing_membranes' && leg(x - S * 0.02, cy + ry * 0.5, ground - cy - ry * 0.5, p.frontLimbs, p.hands, backCol, Math.sin(t * 2 + 1) * 3, true));

    // Body
    ctx.save(); ctx.translate(cx, cy); if (biped) ctx.rotate(-0.15);
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    const grad = ctx.createLinearGradient(0, -ry, 0, ry); grad.addColorStop(0, light); grad.addColorStop(1, body);
    ctx.fillStyle = grad; ctx.fill();
    ctx.clip();
    if (accent) { ctx.globalAlpha = 0.45; for (let i = -3; i <= 3; i++) line(-rx + i * rx * 0.35, -ry, -rx + i * rx * 0.35 + rx * 0.3, ry, accent, S * 0.008); ctx.globalAlpha = 1; }
    if (p.skin === 'scales' || p.skin === 'swift_scales') {
      for (let y = -ry; y < ry; y += S * 0.03) for (let x = -rx; x < rx; x += S * 0.04) {
        const off = (Math.round(y / (S * 0.03)) % 2) * S * 0.02;
        ctx.beginPath(); ctx.arc(x + off, y, S * 0.018, 0, Math.PI); ctx.strokeStyle = hsl(hue, 40, 40, 0.6); ctx.lineWidth = 1.2; ctx.stroke();
      }
    }
    if (p.skin === 'lichen_hide' || p.back === 'moss_garden') [[-0.5, -0.5], [0.1, -0.7], [0.5, -0.3], [-0.2, 0.2], [-0.7, 0.1]].forEach(([dx, dy], i) => dot(dx * rx, dy * ry, S * (0.025 + (i % 2) * 0.012), PLANT));
    if (p.skin === 'warning_skin') [[-0.5, -0.3], [0, -0.5], [0.45, -0.1], [-0.15, 0.25], [-0.75, 0.2]].forEach(([dx, dy]) => { dot(dx * rx, dy * ry, S * 0.028, '#f2c14e'); dot(dx * rx, dy * ry, S * 0.012, '#1c1414'); });
    if (p.skin === 'biolume_skin') glow(GLOW, 10, () => { for (let i = 0; i < 9; i++) dot(-rx * 0.8 + i * rx * 0.2, Math.sin(i) * ry * 0.4, S * 0.01 * (1.2 + 0.5 * Math.sin(t * 3 + i)), GLOW); });
    if (p.skin === 'bright_plumage') for (let i = 0; i < 6; i++) dot(-rx * 0.7 + i * rx * 0.28, -ry * 0.2 + (i % 2) * ry * 0.3, S * 0.03, hsl(hue + 120 + i * 30, 70, 60));
    ctx.restore();
    if (p.skin === 'fur') for (let a = Math.PI * 1.05; a < Math.PI * 1.95; a += 0.09) { const x = cx + Math.cos(a) * rx; const y = cy + Math.sin(a) * ry; line(x, y, x + Math.cos(a) * 6, y + Math.sin(a) * 9, dark, 2); }
    if (p.back === 'back_spines' || p.back === 'venom_quills') {
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * 1.15 + i * 0.11; const x = cx + Math.cos(a) * rx; const y = cy + Math.sin(a) * ry;
        if (p.back === 'venom_quills') line(x, y, x - S * 0.05, y - S * 0.11, VENOM, S * 0.008);
        else tri(x - 6, y + 2, x, y - S * 0.07, x + 6, y + 2, BONE);
      }
    }
    if (p.back === 'moss_garden') for (let i = 0; i < 6; i++) dot(cx - rx * 0.6 + i * rx * 0.22, cy - ry * 0.95 + Math.abs(i - 2.5) * 3, S * 0.025, PLANT);

    // Near side legs
    hindX.forEach((x, i) => p.hindLimbs && leg(x + S * 0.03, cy + ry * 0.5, ground - cy - ry * 0.5, p.hindLimbs, p.feet, dark, Math.sin(t * 2 + i + 1) * 3, false));
    if (biped) {
      // Arms hang free from the shoulder
      const sx = cx + rx * 0.5; const sy = cy - ry * 0.45;
      if (p.frontLimbs === 'wing_membranes') { tri(sx, sy, sx - S * 0.3, sy + S * 0.05, sx - S * 0.05, sy + S * 0.25, hsl(hue, 50, 65, 0.5)); }
      else if (p.frontLimbs) leg(sx, sy, S * 0.2, p.frontLimbs, p.hands, dark, Math.sin(t * 1.5) * 4, true);
    } else {
      frontX.forEach((x) => {
        if (p.frontLimbs === 'wing_membranes') { tri(x, cy - ry * 0.2, x - S * 0.35, cy - ry * 1.6, x - S * 0.1, cy + ry * 0.2, hsl(hue, 50, 65, 0.5)); leg(x + S * 0.03, cy + ry * 0.5, ground - cy - ry * 0.5, 'slender_forelegs', p.hands, dark, 0, true); }
        else if (p.frontLimbs) leg(x + S * 0.03, cy + ry * 0.5, ground - cy - ry * 0.5, p.frontLimbs, p.hands, dark, Math.sin(t * 2 + 2) * 3, true);
      });
    }
    if (!p.hindLimbs && !p.frontLimbs) { /* a legless slug: body rests low */ }

    // Neck and head
    ctx.beginPath(); ctx.moveTo(biped ? cx + rx * 0.2 : cx + rx * 0.6, biped ? cy - ry * 0.7 : cy - ry * 0.4); ctx.lineTo(hx, hy);
    ctx.strokeStyle = body; ctx.lineWidth = S * 0.09; ctx.lineCap = 'round'; ctx.stroke();
    drawHead(p, hx, hy, hr, hue, body, dark, t, S);
  }

  function drawHead(p, hx, hy, hr, hue, body, dark, t, S) {
    if (p.senses === 'great_ears') [-0.5, -0.1].forEach((dx) => tri(hx + dx * hr - 6, hy - hr * 0.6, hx + dx * hr - 14, hy - hr * 2, hx + dx * hr + 8, hy - hr * 0.7, dark));
    dot(hx, hy, hr, body);
    if (p.senses === 'horned_brow') [0.1, -0.3].forEach((dx) => { ctx.beginPath(); ctx.moveTo(hx + dx * hr - 5, hy - hr * 0.7); ctx.quadraticCurveTo(hx + dx * hr - 10, hy - hr * 2, hx + dx * hr + 12, hy - hr * 2.1); ctx.lineTo(hx + dx * hr + 5, hy - hr * 0.8); ctx.fillStyle = BONE; ctx.fill(); });
    if (p.senses === 'antennae') { wavy(hx - hr * 0.2, hy - hr * 0.8, hr * 1.6, -Math.PI * 0.6, 4, t, dark, 2); wavy(hx + hr * 0.2, hy - hr * 0.8, hr * 1.6, -Math.PI * 0.35, 4, t, dark, 2, 1.5); }
    const mx = hx + hr * 0.9; const my = hy + hr * 0.25;
    const m = p.mouth;
    if (m === 'grinding_beak') tri(mx - 6, my - hr * 0.35, mx + hr * 0.7, my, mx - 6, my + hr * 0.3, '#e0b04c');
    if (m === 'fangs' || m === 'venom_fangs' || m === 'lure_jaw' || m === 'crushing_jaws') {
      line(mx - hr * 0.5, my, mx + 2, my, hsl(hue, 30, 15), 3);
      const c = m === 'venom_fangs' ? VENOM : BONE;
      [0, 1].forEach((k) => tri(mx - hr * 0.3 + k * 8, my, mx - hr * 0.25 + k * 8, my + hr * (m === 'crushing_jaws' ? 0.25 : 0.4), mx - hr * 0.15 + k * 8, my, c));
    }
    if (m === 'lure_jaw') { ctx.beginPath(); ctx.moveTo(hx, hy - hr); ctx.quadraticCurveTo(hx + hr * 1.5, hy - hr * 2.4, hx + hr * 2, hy - hr * 0.8); ctx.strokeStyle = dark; ctx.lineWidth = 2; ctx.stroke(); glow(GLOW, 18, () => dot(hx + hr * 2, hy - hr * 0.8 + Math.sin(t * 3) * 3, S * 0.022, GLOW)); }
    if (m === 'mandibles') [-1, 1].forEach((s) => { ctx.beginPath(); ctx.moveTo(mx - 4, my + s * 3); ctx.quadraticCurveTo(mx + hr * 0.6, my + s * hr * 0.5, mx + hr * 0.5, my + s); ctx.strokeStyle = dark; ctx.lineWidth = 4; ctx.stroke(); });
    if (m === 'trunk') { ctx.beginPath(); ctx.moveTo(mx - 4, my - 2); ctx.quadraticCurveTo(mx + hr * 1.1, my + hr * 0.3, mx + hr * 0.6 + Math.sin(t * 1.5) * 4, my + hr * 1.6); ctx.strokeStyle = body; ctx.lineWidth = S * 0.035; ctx.lineCap = 'round'; ctx.stroke(); }
    if (m === 'baleen') for (let k = 0; k < 5; k++) line(mx - hr * 0.5 + k * 4, my - 2, mx - hr * 0.5 + k * 4, my + hr * 0.4, BONE, 1.5);
    const ex = hx + hr * 0.25; const ey = hy - hr * 0.25;
    FACE = { x: ex, y: ey, r: hr * (p.senses === 'big_eyes' ? 0.42 : 0.22), mx: hx + hr * 0.5, my: hy + hr * 0.55, top: hy - hr * 1.15, skin: body, s: S * 0.5 };
    if (p.senses === 'big_eyes') { dot(ex, ey, hr * 0.42, '#fff'); dot(ex + hr * 0.1, ey, hr * 0.22, '#1c1414'); }
    else if (p.senses === 'glow_eyes') glow(GLOW, 14, () => dot(ex, ey, hr * 0.25, GLOW));
    else { dot(ex, ey, hr * 0.2, '#fff'); dot(ex + hr * 0.06, ey, hr * 0.11, '#1c1414'); }
    if (p.senses === 'tremor_whiskers' || p.senses === 'electroreceptors') for (let k = -1; k <= 1; k++) line(mx - 4, my - 4, mx + hr * 0.9, my - 4 + k * hr * 0.35, BONE, 1.2);
  }

  // ======================= SEA CREATURE =======================
  function drawSea(b, cx, cy, S, t) {
    const hue = b.hue;
    const { p, accent } = look(b);
    const body = hsl(hue, 50, 55); const dark = hsl(hue, 40, 30); const light = hsl(hue, 60, 72);
    const rx = S * 0.33; const ry = S * 0.13;
    const y0 = cy + Math.sin(t * 1.4) * 3;
    const tailX = cx - rx * 0.95;
    const sw = Math.sin(t * 3) * 0.25;

    // Tail
    ctx.save(); ctx.translate(tailX, y0); ctx.rotate(sw * 0.4);
    if (p.tail === 'fluke' || !p.tail) { tri(0, 0, -S * 0.2, -S * 0.12, -S * 0.12, 0, dark); tri(0, 0, -S * 0.2, S * 0.12, -S * 0.12, 0, dark); }
    else if (p.tail === 'stinger_tail') { line(0, 0, -S * 0.22, -S * 0.05, body, S * 0.03); tri(-S * 0.22, -S * 0.05, -S * 0.28, -S * 0.1, -S * 0.27, 0, VENOM); }
    else if (p.tail === 'display_tail') for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(-S * 0.12, i * 8, S * 0.12, S * 0.02, i * 0.2, 0, Math.PI * 2); ctx.fillStyle = hsl(hue + 140 + i * 20, 70, 60); ctx.fill(); }
    else if (p.tail === 'glow_tail') { line(0, 0, -S * 0.18, 0, body, S * 0.03); glow(GLOW, 16, () => dot(-S * 0.2, 0, S * 0.03, GLOW)); }
    else if (p.tail === 'prehensile_tail') { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-S * 0.15, S * 0.05, -S * 0.15, S * 0.12); ctx.arc(-S * 0.12, S * 0.12, S * 0.03, Math.PI, Math.PI * 2.5); ctx.strokeStyle = body; ctx.lineWidth = S * 0.025; ctx.stroke(); }
    ctx.restore();

    // Dorsal
    if (p.back === 'dorsal_fin') tri(cx - rx * 0.3, y0 - ry * 0.85, cx - rx * 0.05, y0 - ry * 2.2, cx + rx * 0.25, y0 - ry * 0.85, dark);
    if (p.back === 'display_frill' || p.back === 'lumen_sail') {
      const isGlow = p.back === 'lumen_sail';
      for (let i = 0; i < 6; i++) { const draw = () => tri(cx - rx * 0.5 + i * rx * 0.18, y0 - ry * 0.8, cx - rx * 0.42 + i * rx * 0.18, y0 - ry * 2, cx - rx * 0.34 + i * rx * 0.18, y0 - ry * 0.8, isGlow ? hsl(175, 80, 70, 0.5) : hsl(hue + 140 + i * 15, 70, 60)); isGlow ? glow(GLOW, 12, draw) : draw(); }
    }
    if (p.back === 'carapace') { ctx.beginPath(); ctx.ellipse(cx, y0 - ry * 0.2, rx * 0.8, ry * 1.25, 0, Math.PI, 0); ctx.fillStyle = SHELL; ctx.fill(); }
    if (p.back === 'fat_hump') { ctx.beginPath(); ctx.ellipse(cx - rx * 0.1, y0 - ry * 0.8, rx * 0.4, ry * 0.6, 0, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill(); }
    if (p.back === 'kelp_garden') for (let i = 0; i < 5; i++) wavy(cx - rx * 0.5 + i * rx * 0.2, y0 - ry * 0.8, S * 0.12, -Math.PI / 2, 4, t, PLANT, 3, i);
    if (p.back === 'back_spines' || p.back === 'venom_quills') for (let i = 0; i < 6; i++) { const x = cx - rx * 0.6 + i * rx * 0.22; p.back === 'venom_quills' ? line(x, y0 - ry * 0.8, x - 6, y0 - ry * 1.9, VENOM, 2) : tri(x - 5, y0 - ry * 0.8, x, y0 - ry * 1.6, x + 5, y0 - ry * 0.8, BONE); }

    // Hind fins / tentacles (far)
    if (p.hindLimbs === 'sea_tentacles') for (let i = 0; i < 4; i++) wavy(cx - rx * 0.2 + i * 10, y0 + ry * 0.7, S * 0.25, Math.PI / 2 + 0.3, S * 0.04, t, dark, S * 0.018, i);

    // Body
    ctx.save();
    ctx.beginPath(); ctx.ellipse(cx, y0, rx, ry, 0, 0, Math.PI * 2);
    const grad = ctx.createLinearGradient(cx, y0 - ry, cx, y0 + ry); grad.addColorStop(0, body); grad.addColorStop(1, light);
    ctx.fillStyle = grad; ctx.fill(); ctx.clip();
    if (accent) { ctx.globalAlpha = 0.45; for (let i = -3; i <= 3; i++) line(cx + i * rx * 0.3, y0 - ry, cx + i * rx * 0.3 + rx * 0.2, y0 + ry, accent, S * 0.008); ctx.globalAlpha = 1; }
    if (p.skin === 'scales' || p.skin === 'swift_scales') for (let y = y0 - ry; y < y0 + ry; y += S * 0.03) for (let x = cx - rx; x < cx + rx; x += S * 0.04) { ctx.beginPath(); ctx.arc(x + ((Math.round((y - y0) / (S * 0.03)) % 2) * S * 0.02), y, S * 0.018, 0, Math.PI); ctx.strokeStyle = hsl(hue, 40, 40, 0.6); ctx.lineWidth = 1.2; ctx.stroke(); }
    if (p.skin === 'warning_skin') [[-0.5, -0.3], [0, -0.4], [0.4, 0], [-0.2, 0.3]].forEach(([dx, dy]) => { dot(cx + dx * rx, y0 + dy * ry, S * 0.025, '#f2c14e'); dot(cx + dx * rx, y0 + dy * ry, S * 0.01, '#1c1414'); });
    if (p.skin === 'biolume_skin') glow(GLOW, 10, () => { for (let i = 0; i < 9; i++) dot(cx - rx * 0.8 + i * rx * 0.2, y0 + Math.sin(i) * ry * 0.4, S * 0.01 * (1.2 + 0.5 * Math.sin(t * 3 + i)), GLOW); });
    if (p.skin === 'cleaner_skin') for (let i = 0; i < 5; i++) dot(cx - rx * 0.6 + i * rx * 0.3, y0 + ry * 0.3, S * 0.012, '#f6a6a0');
    ctx.restore();
    if (p.skin === 'blubber') { ctx.beginPath(); ctx.ellipse(cx, y0, rx * 1.03, ry * 1.08, 0, 0, Math.PI * 2); ctx.strokeStyle = hsl(hue, 30, 80, 0.6); ctx.lineWidth = 3; ctx.stroke(); }

    // Fins (near)
    const finSwing = Math.sin(t * 2.5) * 0.3;
    const fin = (x, y, kind, len) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(0.6 + finSwing);
      if (kind === 'pectoral_fins' || kind === 'pelvic_fins') tri(0, 0, -len * 0.3, len, len * 0.2, len * 0.7, dark);
      else if (kind === 'front_flippers' || kind === 'rear_flippers') { ctx.beginPath(); ctx.ellipse(0, len * 0.5, len * 0.22, len * 0.55, 0, 0, Math.PI * 2); ctx.fillStyle = dark; ctx.fill(); }
      else if (kind === 'armored_fins') { tri(0, 0, -len * 0.3, len, len * 0.2, len * 0.7, SHELL); }
      else if (kind === 'fore_tentacles') { ctx.restore(); wavy(x, y, len * 1.3, Math.PI / 2 - 0.3, 6, t, dark, S * 0.02); return; }
      ctx.restore();
    };
    if (p.frontLimbs) fin(cx + rx * 0.35, y0 + ry * 0.5, p.frontLimbs, S * 0.15);
    if (p.hindLimbs && p.hindLimbs !== 'sea_tentacles') fin(cx - rx * 0.45, y0 + ry * 0.6, p.hindLimbs, S * 0.1);

    // Head end
    const hx = cx + rx * 0.72; const hy = y0 - ry * 0.1;
    const m = p.mouth; const mx = cx + rx * 0.98; const my = y0 + ry * 0.15;
    if (m === 'fangs' || m === 'venom_fangs' || m === 'crushing_jaws' || m === 'lure_jaw' || m === 'mandibles') {
      line(mx - rx * 0.25, my, mx, my, hsl(hue, 30, 15), 3);
      const c = m === 'venom_fangs' ? VENOM : BONE;
      [0, 1, 2].forEach((k) => tri(mx - rx * 0.2 + k * 7, my, mx - rx * 0.18 + k * 7, my + 7, mx - rx * 0.14 + k * 7, my, c));
    }
    if (m === 'baleen' || m === 'grinding_beak') for (let k = 0; k < 6; k++) line(mx - rx * 0.25 + k * 5, my - 2, mx - rx * 0.25 + k * 5, my + 6, BONE, 1.5);
    if (m === 'lure_jaw') { ctx.beginPath(); ctx.moveTo(hx, y0 - ry); ctx.quadraticCurveTo(hx + rx * 0.4, y0 - ry * 3, hx + rx * 0.6, y0 - ry * 1.4); ctx.strokeStyle = dark; ctx.lineWidth = 2; ctx.stroke(); glow(GLOW, 18, () => dot(hx + rx * 0.6, y0 - ry * 1.4 + Math.sin(t * 3) * 3, S * 0.022, GLOW)); }
    const er = S * 0.022;
    FACE = { x: hx, y: hy, r: er * (p.senses === 'big_eyes' ? 1.8 : 1.1), mx: hx + er * 2, my: hy + ry * 0.55, top: y0 - ry * 1.3, skin: body, s: S * 0.5 };
    if (p.senses === 'big_eyes') { dot(hx, hy, er * 1.8, '#fff'); dot(hx + 2, hy, er, '#1c1414'); }
    else if (p.senses === 'glow_eyes') glow(GLOW, 14, () => dot(hx, hy, er * 1.2, GLOW));
    else { dot(hx, hy, er, '#fff'); dot(hx + 1, hy, er * 0.55, '#1c1414'); }
    if (p.senses === 'antennae') { wavy(hx, hy - er, S * 0.15, -Math.PI * 0.35, 4, t, dark, 2); }
    if (p.senses === 'electroreceptors' || p.senses === 'tremor_whiskers') for (let k = 0; k < 4; k++) dot(hx + 6 + k * 5, hy + 8, 1.5, BONE);
    if (p.senses === 'echolocation') { ctx.beginPath(); ctx.ellipse(hx - 4, hy - ry * 0.6, ry * 0.5, ry * 0.4, 0, 0, Math.PI * 2); ctx.fillStyle = light; ctx.fill(); }
    if (p.senses === 'horned_brow') tri(hx - 6, hy - er, hx + 2, hy - ry * 1.6, hx + 6, hy - er, BONE);
  }

  // ======================= BODIES =======================
  // Draw a body (yours or another species') centered at (cx, cy) inside a box of size S.
  function drawBody(b, cx, cy, S, t) {
    FACE = null;
    if (b.stage === 'cell') drawCell(b, cx, cy, S * 0.24, t);
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
    else if (mood === 'sleepy') { ctx.moveTo(f.mx - mw * 0.4, f.my); ctx.lineTo(f.mx + mw * 0.4, f.my); }
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
    drawBody(b, land ? w * 0.42 : w * 0.5, h * (land ? 0.4 : 0.5), S, 0.6);
  };

  let sceneFrame = null;
  function hash(str) { let x = 0; for (let i = 0; i < str.length; i++) x = (x * 31 + str.charCodeAt(i)) | 0; return Math.abs(x); }

  // An animated scene: your herd, the species around you, the event's props and your reaction.
  G.playScene = function (canvas, run, sc) {
    if (sceneFrame) cancelAnimationFrame(sceneFrame);
    if (!canvas || !run) return;
    const anim = sc.anim || 'rest';
    const v = hash(`${sc.title || ''}${sc.label || ''}${run.turn}`) % (VARIANTS[anim] || 1);
    const start = performance.now();
    const me = G.bodyOf(run);
    function frame(now) {
      if (!canvas.isConnected) { sceneFrame = null; return; }
      const { w, h } = fit(canvas);
      const t = reduceMotion ? 0 : now / 1000;
      const k = reduceMotion ? 2 : (now - start) / 1000 / DUR;
      ctx.clearRect(0, 0, w, h);
      drawBackground(run, w, h, t);
      const S = Math.min(w * 0.72, h * 1.05);
      const cx = w * 0.45; const cy = h * 0.5;
      const land = run.stage === 'creature' && run.habitat === 'land';
      const ground = land ? cy + S * 0.36 : null;
      const P = { w, h, cx, cy, S, k, t, success: sc.success, anim, ground };
      P_SKIP_WORDS = (sc.prop === 'ice' && anim === 'attack' && sc.success) || (sc.prop === 'fruit' && anim === 'hurt');
      if (sc.prop) drawProp(sc.prop, 'back', P);
      drawAmbient(run, w, h, t, S, sc.species);
      drawHerd(run, cx, cy, S, t, w, h);
      // The species this event is about stands opposite you, with its own reaction.
      const sp = sc.species != null && sc.species >= 0 ? run.species[sc.species] : null;
      if (sp) {
        const kick = anim === 'attack' && sc.success ? Math.max(0, Math.sin(Math.min(1, k) * Math.PI)) * 40 : 0;
        const ks = S * (land ? 0.5 : 0.55) * Math.min(1.5, sp.size);
        const sy = land ? ground - ks * 0.36 : cy;
        ctx.save(); ctx.translate(w * 0.86 + kick, sy); ctx.scale(-1, 1);
        if (anim === 'attack' && sc.success && k < 1) ctx.rotate(-0.3 * Math.sin(Math.min(1, k) * Math.PI));
        drawBody(G.speciesBody(sp), 0, 0, ks, t);
        drawFace(anim === 'attack' && sc.success ? 'dizzy' : anim === 'social' ? 'love' : anim === 'hurt' || sc.success === false ? 'angry' : 'surprised', t);
        ctx.restore();
      }
      const T = animTransform(anim, v, k, w);
      const sink = sc.prop === 'tar' && (sc.success === false || anim === 'hurt') ? Math.min(1, k) * S * 0.12 : 0;
      const spin = sc.prop === 'whirlpool' && anim === 'hurt' && k < 1 ? k * Math.PI * 4 : 0;
      const pivotY = land ? ground : cy;
      ctx.save();
      ctx.translate(cx + T.dx, pivotY + T.dy + sink); ctx.rotate(T.rot + spin); ctx.scale(T.sx, T.sy); ctx.translate(-cx, -pivotY);
      drawBody(me, cx, cy, S, t);
      drawFace(sc.mood, t);
      ctx.restore();
      if (sc.prop) drawProp(sc.prop, 'front', P);
      drawEffects(anim, v, k, cx, cy, S, w, h, !!sp, ground);
      sceneFrame = reduceMotion ? null : requestAnimationFrame(frame);
    }
    sceneFrame = requestAnimationFrame(frame);
  };

  G.stopScene = function () { if (sceneFrame) cancelAnimationFrame(sceneFrame); sceneFrame = null; };
}());
