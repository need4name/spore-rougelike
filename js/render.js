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
  function look(run) {
    const p = {}; let accent = null;
    Object.entries(run.parts).forEach(([slot, s]) => {
      if (!s) return;
      p[slot] = s.id;
      if (s.merged) {
        const kw = (G.PART[s.merged].keywords || [])[0];
        if (!accent) accent = kw ? G.KEYWORDS[kw].color : hsl(40, 80, 65);
      }
    });
    return { p, accent };
  }

  function sizeScale(run) {
    if (run.traits.includes('giant')) return 1.22;
    if (run.traits.includes('small_many')) return 0.8;
    return 1;
  }

  // ======================= CELL =======================
  function drawCell(run, cx, cy, R, t) {
    const hue = G.ARCHETYPE[run.archetype].color;
    const { p, accent } = look(run);
    const dark = hsl(hue, 45, 28);
    const plan = run.traits.includes('radial_plan') ? 'radial' : run.traits.includes('streamlined_plan') ? 'stream' : run.traits.includes('sessile_plan') ? 'sessile' : null;
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
    if (run.multicellular && plan === 'radial') {
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
    if (run.multicellular) {
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
  function drawLand(run, cx, ground, S, t) {
    const hue = G.ARCHETYPE[run.archetype].color;
    const { p, accent } = look(run);
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
    if (p.senses === 'big_eyes') { dot(ex, ey, hr * 0.42, '#fff'); dot(ex + hr * 0.1, ey, hr * 0.22, '#1c1414'); }
    else if (p.senses === 'glow_eyes') glow(GLOW, 14, () => dot(ex, ey, hr * 0.25, GLOW));
    else { dot(ex, ey, hr * 0.2, '#fff'); dot(ex + hr * 0.06, ey, hr * 0.11, '#1c1414'); }
    if (p.senses === 'tremor_whiskers' || p.senses === 'electroreceptors') for (let k = -1; k <= 1; k++) line(mx - 4, my - 4, mx + hr * 0.9, my - 4 + k * hr * 0.35, BONE, 1.2);
  }

  // ======================= SEA CREATURE =======================
  function drawSea(run, cx, cy, S, t) {
    const hue = G.ARCHETYPE[run.archetype].color;
    const { p, accent } = look(run);
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
    if (p.senses === 'big_eyes') { dot(hx, hy, er * 1.8, '#fff'); dot(hx + 2, hy, er, '#1c1414'); }
    else if (p.senses === 'glow_eyes') glow(GLOW, 14, () => dot(hx, hy, er * 1.2, GLOW));
    else { dot(hx, hy, er, '#fff'); dot(hx + 1, hy, er * 0.55, '#1c1414'); }
    if (p.senses === 'antennae') { wavy(hx, hy - er, S * 0.15, -Math.PI * 0.35, 4, t, dark, 2); }
    if (p.senses === 'electroreceptors' || p.senses === 'tremor_whiskers') for (let k = 0; k < 4; k++) dot(hx + 6 + k * 5, hy + 8, 1.5, BONE);
    if (p.senses === 'echolocation') { ctx.beginPath(); ctx.ellipse(hx - 4, hy - ry * 0.6, ry * 0.5, ry * 0.4, 0, 0, Math.PI * 2); ctx.fillStyle = light; ctx.fill(); }
    if (p.senses === 'horned_brow') tri(hx - 6, hy - er, hx + 2, hy - ry * 1.6, hx + 6, hy - er, BONE);
  }

  // ======================= OTHER SPECIES =======================
  function drawSpecies(run, s, x, y, k, t, alpha, faceLeft) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); if (faceLeft) ctx.scale(-1, 1);
    const col = hsl(s.hue, 45, 55); const dk = hsl(s.hue, 35, 28);
    const r = k * s.size;
    if (run.stage === 'cell') {
      ctx.beginPath(); for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.2) { const rr = r * (1 + 0.08 * Math.sin(4 * a + t * 2 + s.seed)); a === 0 ? ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = dk; ctx.lineWidth = 1.5; ctx.stroke();
      if (s.role === 'predator') { tri(r * 0.8, -r * 0.3, r * 1.3, 0, r * 0.8, r * 0.3, dk); for (let i = 0; i < 6; i++) { const a = i + 0.5; line(Math.cos(a) * r, Math.sin(a) * r, Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.3, dk, 1.5); } }
      else wavy(-r, 0, r * 1.2, Math.PI, r * 0.2, t, dk, 1.5, s.seed);
      dot(r * 0.4, -r * 0.2, r * 0.15, '#1c1414');
    } else if (run.habitat === 'sea') {
      ctx.beginPath(); ctx.ellipse(0, 0, r * 1.4, r * 0.55, 0, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
      tri(-r * 1.3, 0, -r * 2, -r * 0.6, -r * 2, r * 0.6, dk);
      tri(-r * 0.2, -r * 0.5, r * 0.2, -r * 1.1, r * 0.5, -r * 0.5, dk);
      dot(r * 0.9, -r * 0.1, r * 0.12, s.role === 'predator' ? '#e8604c' : '#1c1414');
      if (s.role === 'predator') for (let k2 = 0; k2 < 3; k2++) tri(r * 1.0 + k2 * 4, r * 0.2, r * 1.05 + k2 * 4, r * 0.4, r * 1.1 + k2 * 4, r * 0.2, BONE);
    } else {
      const legY = r * 0.5;
      for (let i = 0; i < 2; i++) { const lx = -r * 0.6 + i * r * 1.1; line(lx, legY, lx + Math.sin(t * 4 + i + s.seed) * 4, legY + r * 0.9, dk, Math.max(2, r * 0.18)); }
      ctx.beginPath(); ctx.ellipse(0, 0, r * 1.2, r * 0.65, 0, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
      dot(r * 1.2, -r * 0.5, r * 0.45, col);
      dot(r * 1.35, -r * 0.6, r * 0.1, s.role === 'predator' ? '#e8604c' : '#1c1414');
      if (s.role === 'predator') for (let i = 0; i < 4; i++) tri(-r * 0.6 + i * r * 0.35, -r * 0.55, -r * 0.5 + i * r * 0.35, -r * 1.0, -r * 0.4 + i * r * 0.35, -r * 0.55, dk);
      if (s.role === 'prey') { line(r * 1.3, -r * 0.9, r * 1.1, -r * 1.5, dk, 2); }
      line(-r * 1.1, -r * 0.1, -r * 1.7, -r * 0.4 + Math.sin(t * 3) * 3, col, Math.max(2, r * 0.2));
    }
    ctx.restore();
  }

  // ======================= BACKGROUNDS =======================
  function drawBackground(run, w, h, t) {
    const hue = G.ORIGIN[run.origin].hue;
    if (run.stage === 'cell' || run.habitat === 'sea') {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, hsl(hue, 45, run.stage === 'cell' ? 24 : 22)); g.addColorStop(1, hsl(hue + 10, 45, 8));
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.save(); ctx.globalAlpha = 0.08;
      for (let i = 0; i < 4; i++) { const x = ((i * 0.3 + 0.1) * w + Math.sin(t * 0.3 + i) * 20); tri(x, 0, x + w * 0.08, 0, x + w * 0.25, h, '#ffffff'); }
      ctx.restore();
      for (let i = 0; i < 26; i++) { const x = (i * 97.3 + t * (6 + (i % 5))) % w; const y = (i * 53.7 + Math.sin(t + i) * 10 + h) % h; dot(x, y, 1 + (i % 3) * 0.6, 'rgba(255,255,255,0.18)'); }
      if (run.habitat === 'sea') { ctx.fillStyle = hsl(hue, 25, 14); ctx.fillRect(0, h * 0.92, w, h * 0.08); for (let i = 0; i < 8; i++) wavy(i * w / 7, h * 0.92, h * 0.18, -Math.PI / 2, 5, t * 0.6, hsl(120, 35, 30, 0.7), 3, i); }
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, hsl(hue + 20, 40, 30)); g.addColorStop(0.7, hsl(hue + 30, 35, 18)); g.addColorStop(1, hsl(hue + 30, 30, 12));
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = hsl(hue + 40, 25, 16);
      ctx.beginPath(); ctx.moveTo(0, h * 0.62); for (let x = 0; x <= w; x += 20) ctx.lineTo(x, h * 0.62 - Math.sin(x * 0.01 + 1) * h * 0.08 - Math.sin(x * 0.023) * h * 0.04); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
      ctx.fillStyle = hsl(95, 25, 20); ctx.fillRect(0, h * 0.86, w, h * 0.14);
      for (let i = 0; i < 18; i++) { const x = (i * 71) % w; line(x, h * 0.86, x + Math.sin(t + i) * 2, h * 0.83, hsl(95, 35, 32), 2); }
    }
  }

  // Ambient wandering species in the background.
  function drawAmbient(run, w, h, t, S, skip) {
    run.species.forEach((s, i) => {
      if (i === skip) return;
      const speed = 0.04 + (s.seed % 7) * 0.006;
      const dir = s.seed % 2 ? 1 : -1;
      const u = ((t * speed + s.seed / 997) % 1 + 1) % 1;
      const x = dir > 0 ? -60 + u * (w + 120) : w + 60 - u * (w + 120);
      const y = run.stage === 'cell' || run.habitat === 'sea' ? h * (0.18 + ((s.seed % 60) / 100)) + Math.sin(t + s.seed) * 10 : h * 0.6 + (s.seed % 10);
      const k = run.stage === 'cell' || run.habitat === 'sea' ? S * 0.045 : S * 0.035;
      drawSpecies(run, s, x, y, k, t, 0.45, dir < 0);
    });
  }

  // Draw your organism centered at (cx, cy) inside a box of size S.
  function drawSelf(run, cx, cy, S, t) {
    if (run.stage === 'cell') drawCell(run, cx, cy, S * 0.24, t);
    else if (run.habitat === 'sea') drawSea(run, cx, cy, S * sizeScale(run), t);
    else drawLand(run, cx, cy + S * 0.36, S * sizeScale(run), t);
  }

  // ---------- Scene animations ----------
  const DUR = 1.6;
  function animTransform(anim, k) {
    // k goes 0 → 1 over the animation
    const e = Math.sin(Math.min(1, k) * Math.PI);
    switch (anim) {
      case 'attack': return { dx: e * 46, dy: 0, rot: e * 0.08, scale: 1 };
      case 'flee': return { dx: k < 0.5 ? k * 2 * 380 : (k - 1) * 2 * 380, dy: 0, rot: 0, scale: 1 };
      case 'hurt': return { dx: Math.sin(k * 50) * 7 * (1 - k), dy: 0, rot: 0, scale: 1 };
      case 'eat': return { dx: e * 10, dy: Math.sin(k * 30) * 3 * (1 - k), rot: 0, scale: 1 };
      case 'grow': return { dx: 0, dy: 0, rot: 0, scale: 0.85 + Math.min(1, k) * 0.15 };
      case 'social': return { dx: e * 14, dy: -Math.abs(Math.sin(k * 12)) * 6 * (1 - k), rot: 0, scale: 1 };
      case 'rest': return { dx: 0, dy: e * 4, rot: 0, scale: 1 - e * 0.03 };
      default: return { dx: 0, dy: 0, rot: 0, scale: 1 };
    }
  }

  function drawEffects(run, anim, k, cx, cy, S, sp, t) {
    if (k > 1.3) return;
    const a = Math.max(0, 1 - k);
    if (anim === 'hurt') { ctx.fillStyle = `rgba(232, 96, 76, ${0.25 * a})`; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); }
    if (anim === 'mutate') {
      for (let i = 0; i < 3; i++) { const r = S * (0.2 + (k + i * 0.2) * 0.5); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.strokeStyle = `rgba(143, 245, 232, ${a * 0.6})`; ctx.lineWidth = 3; ctx.stroke(); }
      for (let i = 0; i < 14; i++) { const ang = i * 0.45 + k * 2; const r = S * (0.15 + k * 0.45); dot(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, 2.5, `rgba(242, 193, 78, ${a})`); }
    }
    if (anim === 'eat') for (let i = 0; i < 10; i++) { const p = (k * 1.6 + i / 10) % 1; dot(cx + S * 0.45 * (1 - p), cy - S * 0.05 + Math.sin(i * 3) * S * 0.1 * (1 - p), 3, `rgba(147, 212, 110, ${a})`); }
    if (anim === 'social') for (let i = 0; i < 6; i++) { const p = (k + i / 6) % 1; heart(cx + S * 0.1 + Math.sin(i * 2) * S * 0.2, cy - S * 0.15 - p * S * 0.3, 6, `rgba(236, 122, 102, ${a * (1 - p)})`); }
    if (anim === 'rest') { ctx.font = `700 ${Math.round(S * 0.06)}px Grandstander, sans-serif`; ctx.fillStyle = `rgba(232, 239, 228, ${a * 0.8})`; ctx.fillText('z', cx + S * 0.2, cy - S * 0.2 - k * 20); ctx.fillText('z', cx + S * 0.26, cy - S * 0.3 - k * 26); }
    if (anim === 'attack' && sp != null && sp >= 0) { for (let i = 0; i < 8; i++) { const ang = i * 0.8; const r = S * 0.04 + k * S * 0.12; line(cx + S * 0.42 + Math.cos(ang) * r * 0.5, cy + Math.sin(ang) * r * 0.5, cx + S * 0.42 + Math.cos(ang) * r, cy + Math.sin(ang) * r, `rgba(242, 193, 78, ${a})`, 2); } }
  }
  function heart(x, y, r, color) {
    ctx.beginPath(); ctx.moveTo(x, y + r * 0.8);
    ctx.bezierCurveTo(x - r * 1.4, y - r * 0.2, x - r * 0.6, y - r * 1.3, x, y - r * 0.4);
    ctx.bezierCurveTo(x + r * 0.6, y - r * 1.3, x + r * 1.4, y - r * 0.2, x, y + r * 0.8);
    ctx.fillStyle = color; ctx.fill();
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

  // A still portrait for the top-bar button and character sheet.
  G.drawPortrait = function (canvas, run) {
    if (!canvas || !run) return;
    const { w, h } = fit(canvas);
    ctx.clearRect(0, 0, w, h);
    const S = Math.min(w, h) * (run.stage === 'cell' ? 1.15 : 1);
    const cx = run.stage === 'creature' && run.habitat === 'land' ? w * 0.42 : w * 0.5;
    drawSelf(run, cx, h * (run.stage === 'creature' && run.habitat === 'land' ? 0.42 : 0.5), S, 0.6);
  };

  let sceneFrame = null;
  // An animated scene: your organism, the species around it, and a reaction to the last event.
  G.playScene = function (canvas, run, anim, speciesIdx) {
    if (sceneFrame) cancelAnimationFrame(sceneFrame);
    if (!canvas || !run) return;
    const start = performance.now();
    function frame(now) {
      if (!canvas.isConnected) { sceneFrame = null; return; }
      const { w, h } = fit(canvas);
      const t = reduceMotion ? 0 : now / 1000;
      const k = reduceMotion ? 2 : (now - start) / 1000 / DUR;
      ctx.clearRect(0, 0, w, h);
      drawBackground(run, w, h, t);
      const S = Math.min(w * 0.75, h * 1.1);
      drawAmbient(run, w, h, t, S, speciesIdx);
      const cx = w * 0.45; const cy = h * 0.52;
      // The species this event was about stands opposite you.
      if (speciesIdx != null && speciesIdx >= 0 && run.species[speciesIdx]) {
        const s = run.species[speciesIdx];
        const kick = anim === 'attack' ? Math.max(0, Math.sin(Math.min(1, k) * Math.PI)) * 30 : 0;
        const k2 = run.stage === 'cell' || run.habitat === 'sea' ? S * 0.07 : S * 0.06;
        const sy = run.stage === 'cell' || run.habitat === 'sea' ? cy : h * 0.86 - k2 * s.size * 1.4;
        drawSpecies(run, s, w * 0.86 + kick, sy, k2, t, anim === 'attack' && k < 1 ? 1 - k * 0.3 : 0.9, true);
      }
      const tr = animTransform(anim, k);
      ctx.save();
      ctx.translate(cx + tr.dx, cy + tr.dy); ctx.rotate(tr.rot); ctx.scale(tr.scale, tr.scale); ctx.translate(-cx, -cy);
      drawSelf(run, cx, cy, S, t);
      ctx.restore();
      drawEffects(run, anim, k, cx, cy, S, speciesIdx, t);
      sceneFrame = reduceMotion ? null : requestAnimationFrame(frame);
    }
    sceneFrame = requestAnimationFrame(frame);
  };

  G.stopScene = function () { if (sceneFrame) cancelAnimationFrame(sceneFrame); sceneFrame = null; };
}());
