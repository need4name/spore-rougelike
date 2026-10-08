// Draws your organism on a canvas. Every part has a look, so drafts visibly change it.
window.G = window.G || {};

(function () {
  let canvas = null;
  let ctx = null;
  let frame = null;
  let current = null;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const VENOM = '#b98cf2';
  const GLOW = '#8ff5e8';
  const PLANT = '#7fcf5f';
  const BONE = '#efe6d2';
  const SHELL = '#a9b6bd';

  function hsl(h, s, l, a) { return `hsla(${h}, ${s}%, ${l}%, ${a == null ? 1 : a})`; }

  function glow(color, blur, fn) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    fn();
    ctx.restore();
  }

  function dot(x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }

  function line(x1, y1, x2, y2, color, w) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke();
  }

  function wavy(x, y, len, dir, amp, t, color, w, phase) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let i = 1; i <= 24; i++) {
      const d = (i / 24) * len;
      const off = Math.sin(i * 0.55 + t * 4 + (phase || 0)) * amp * (i / 24);
      ctx.lineTo(x + Math.cos(dir) * d - Math.sin(dir) * off, y + Math.sin(dir) * d + Math.cos(dir) * off);
    }
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke();
  }

  // ---------- Cell ----------
  function drawCell(run, w, h, t) {
    const hue = G.ARCHETYPE[run.archetype].color;
    const S = Math.min(w, h);
    const R = S * 0.27;
    const cx = w * 0.5 + S * 0.03;
    const cy = h * 0.52 + Math.sin(t * 1.3) * 2;
    const p = run.parts;
    const body = hsl(hue, 55, 58);
    const dark = hsl(hue, 45, 30);

    const rad = (a) => R * (1 + 0.04 * Math.sin(3 * a + t * 1.5) + 0.03 * Math.sin(5 * a - t));
    const at = (a, k) => [cx + Math.cos(a) * rad(a) * (k || 1), cy + Math.sin(a) * rad(a) * (k || 1)];

    // Behind the body
    if (p.defense === 'slime_coat') {
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.1) { const [x, y] = at(a, 1.22); a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.fillStyle = hsl(100, 50, 60, 0.18); ctx.fill();
    }
    if (p.defense === 'spikes') {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + 0.2;
        const [x1, y1] = at(a - 0.08); const [x2, y2] = at(a + 0.08); const [x3, y3] = at(a, 1.35);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x3, y3); ctx.lineTo(x2, y2); ctx.fillStyle = BONE; ctx.fill();
      }
    }
    if (p.motion === 'flagellum' || p.motion === 'lumen_flagellum') {
      const [x, y] = at(Math.PI);
      wavy(x, y, R * 1.3, Math.PI, R * 0.25, t, dark, S * 0.018);
      if (p.motion === 'lumen_flagellum') {
        glow(GLOW, 10, () => { for (let i = 1; i < 5; i++) dot(x - R * 0.28 * i, y + Math.sin(i * 1.3 + t * 4) * R * 0.06 * i, S * 0.012, GLOW); });
      }
    }
    if (p.motion === 'jet_vacuole') {
      const [x, y] = at(Math.PI, 0.95);
      dot(x - R * 0.12, y, R * 0.24, hsl(hue, 40, 45));
      dot(x - R * 0.3, y, R * 0.1, hsl(hue, 30, 20));
    }
    if (p.motion === 'drift_sail') {
      ctx.beginPath(); ctx.moveTo(cx - R * 0.5, cy - R * 0.8); ctx.quadraticCurveTo(cx - R * 0.2, cy - R * 1.9, cx + R * 0.4, cy - R * 0.9);
      ctx.fillStyle = hsl(hue + 30, 60, 70, 0.55); ctx.fill();
    }
    if (p.mouth === 'proboscis') {
      const [x, y] = at(0);
      line(x - 4, y, x + R * 0.7, y + Math.sin(t * 2) * 4, dark, S * 0.03);
    }
    if (p.mouth === 'venom_stylet') {
      const [x, y] = at(0);
      line(x - 4, y, x + R * 0.8, y, VENOM, S * 0.012);
    }
    if (p.sense === 'glow_lure') {
      const [x, y] = at(-Math.PI / 3);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + R * 0.3, y - R * 0.9, x + R * 0.8, y - R * 0.5);
      ctx.strokeStyle = dark; ctx.lineWidth = S * 0.01; ctx.stroke();
      glow(GLOW, 18, () => dot(x + R * 0.8, y - R * 0.5 + Math.sin(t * 3) * 2, S * 0.025, GLOW));
    }
    if (p.sense === 'chemoreceptor') {
      const [x1, y1] = at(-0.5); const [x2, y2] = at(-0.25);
      wavy(x1, y1, R * 0.6, -0.9, 4, t, dark, S * 0.008);
      wavy(x2, y2, R * 0.6, -0.4, 4, t, dark, S * 0.008, 2);
    }

    // Body
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.06) { const [x, y] = at(a); a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.closePath();
    const grad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R * 1.1);
    grad.addColorStop(0, hsl(hue, 65, 72)); grad.addColorStop(1, body);
    ctx.fillStyle = grad; ctx.fill();
    ctx.lineWidth = S * (p.defense === 'silica_shell' || p.defense === 'plated_wall' ? 0.03 : 0.012);
    ctx.strokeStyle = p.defense === 'silica_shell' || p.defense === 'plated_wall' ? SHELL : dark;
    ctx.stroke();
    if (p.defense === 'plated_wall') {
      for (let i = 0; i < 8; i++) { const [x1, y1] = at((i / 8) * Math.PI * 2, 0.88); const [x2, y2] = at((i / 8) * Math.PI * 2, 1.04); line(x1, y1, x2, y2, SHELL, S * 0.012); }
    }

    // Inside
    dot(cx - R * 0.15, cy + R * 0.05, R * 0.3, hsl(hue, 40, 40, 0.8));
    dot(cx - R * 0.2, cy, R * 0.12, hsl(hue, 40, 25, 0.8));
    if (p.mouth === 'chloroplasts' || p.sense === 'symbiotic_algae') {
      [[0.3, -0.4], [0.45, 0.3], [-0.5, -0.35], [-0.45, 0.45], [0.1, 0.55]].forEach(([dx, dy]) => {
        ctx.beginPath(); ctx.ellipse(cx + dx * R, cy + dy * R, R * 0.1, R * 0.06, dx * 3, 0, Math.PI * 2); ctx.fillStyle = PLANT; ctx.fill();
      });
    }
    if (p.defense === 'toxin_sac') { dot(cx + R * 0.2, cy + R * 0.4, R * 0.14, VENOM); dot(cx + R * 0.38, cy + R * 0.2, R * 0.09, VENOM); }
    if (p.defense === 'photophores') {
      glow(GLOW, 12, () => { for (let i = 0; i < 9; i++) { const [x, y] = at((i / 9) * Math.PI * 2 + 0.3, 0.88); dot(x, y, S * 0.01 * (1 + 0.4 * Math.sin(t * 3 + i)), GLOW); } });
    }

    // Front
    if (p.mouth === 'filter_mouth') {
      const [x, y] = at(0);
      for (let i = -2; i <= 2; i++) line(x - 2, y + i * R * 0.08, x + R * 0.18, y + i * R * 0.1, dark, S * 0.008);
    }
    if (p.mouth === 'tiny_jaw' || p.mouth === 'engulfing_maw') {
      const [x, y] = at(0);
      const big = p.mouth === 'engulfing_maw' ? 1.8 : 1;
      const open = (0.12 + Math.abs(Math.sin(t * 2)) * 0.08) * big;
      ctx.beginPath(); ctx.moveTo(x - R * 0.25 * big, y); ctx.lineTo(x + 4, y - R * open * 1.5); ctx.lineTo(x + 4, y + R * open * 1.5); ctx.closePath();
      ctx.fillStyle = hsl(hue, 40, 18); ctx.fill();
      line(x, y - R * open * 1.4, x + R * 0.12, y - R * open * 0.4, BONE, S * 0.012);
      line(x, y + R * open * 1.4, x + R * 0.12, y + R * open * 0.4, BONE, S * 0.012);
    }
    if (p.mouth === 'lure_mouth') {
      const [x, y] = at(0);
      glow(GLOW, 16, () => dot(x - R * 0.08, y, R * 0.14, GLOW));
    }
    if (p.sense === 'eyespot' || p.sense === 'plated_eye' || !p.sense) {
      const [x, y] = at(-0.45, 0.68);
      dot(x, y, R * 0.12, '#1c1414'); dot(x + R * 0.03, y - R * 0.03, R * 0.04, '#fff');
      if (p.sense === 'plated_eye') { ctx.beginPath(); ctx.arc(x, y, R * 0.17, 0, Math.PI * 2); ctx.strokeStyle = SHELL; ctx.lineWidth = S * 0.012; ctx.stroke(); }
    }
    if (p.sense === 'stinging_cilia') {
      for (let i = -3; i <= 3; i++) { const a = i * 0.14; const [x1, y1] = at(a); const [x2, y2] = at(a, 1.25); line(x1, y1, x2, y2, VENOM, S * 0.008); }
    }
    if (p.motion === 'cilia') {
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        const [x1, y1] = at(a); const k = 1.12 + 0.04 * Math.sin(t * 6 + i);
        const [x2, y2] = at(a + 0.05 * Math.sin(t * 5 + i), k);
        line(x1, y1, x2, y2, dark, S * 0.005);
      }
    }
  }

  // ---------- Creature ----------
  function drawCreature(run, w, h, t) {
    const hue = G.ARCHETYPE[run.archetype].color;
    const S = Math.min(w, h);
    const p = run.parts;
    const ground = h * 0.86;
    const legLen = p.limbs ? S * (p.limbs === 'pillar_legs' ? 0.16 : 0.2) : 0;
    const rx = S * 0.27; const ry = S * 0.15;
    const cx = w * 0.46;
    const cy = ground - legLen - ry * (p.limbs ? 0.8 : 1) + Math.sin(t * 1.6) * 1.5;
    const hx = cx + rx * 0.95; const hy = cy - ry * 0.6; const hr = S * 0.11;
    const body = hsl(hue, 50, 55);
    const dark = hsl(hue, 40, 30);
    const light = hsl(hue, 60, 70);

    // Ground shadow
    ctx.beginPath(); ctx.ellipse(cx + rx * 0.2, ground + 2, rx * 1.2, S * 0.025, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();

    // Tail
    ctx.beginPath(); ctx.moveTo(cx - rx * 0.85, cy - ry * 0.2);
    ctx.quadraticCurveTo(cx - rx * 1.5, cy - ry * (0.6 + 0.2 * Math.sin(t * 2)), cx - rx * 1.7, cy - ry * 1.1 - Math.sin(t * 2) * 5);
    ctx.strokeStyle = body; ctx.lineWidth = S * 0.05; ctx.lineCap = 'round'; ctx.stroke();
    if (p.skin === 'bright_plumage') {
      ['#f2c14e', '#e46a5c', '#6fd3c7'].forEach((c, i) => {
        ctx.beginPath(); ctx.ellipse(cx - rx * 1.7 - i * 6, cy - ry * 1.3 - i * 10, S * 0.025, S * 0.09, -0.6 + i * 0.3, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill();
      });
    }

    // Back parts (behind body)
    if (p.back === 'display_frill' || p.back === 'lumen_sail') {
      const isGlow = p.back === 'lumen_sail';
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI * 0.85 + i * 0.12;
        const draw = () => {
          ctx.beginPath(); ctx.moveTo(cx - rx * 0.2, cy - ry * 0.5);
          ctx.lineTo(cx - rx * 0.2 + Math.cos(a) * S * 0.32, cy - ry * 0.5 + Math.sin(a) * S * 0.32);
          ctx.lineTo(cx - rx * 0.2 + Math.cos(a + 0.12) * S * 0.32, cy - ry * 0.5 + Math.sin(a + 0.12) * S * 0.32);
          ctx.closePath();
          ctx.fillStyle = isGlow ? hsl(175, 80, 70, 0.4 + 0.25 * Math.sin(t * 2 + i)) : hsl(hue + 140 + i * 12, 70, 60);
          ctx.fill();
        };
        isGlow ? glow(GLOW, 14, draw) : draw();
      }
    }
    if (p.back === 'fat_hump') { ctx.beginPath(); ctx.ellipse(cx - rx * 0.1, cy - ry * 0.8, rx * 0.5, ry * 0.7, 0, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill(); }
    if (p.back === 'carapace') {
      ctx.beginPath(); ctx.ellipse(cx - rx * 0.05, cy - ry * 0.15, rx * 1.02, ry * 1.25, 0, Math.PI, 0); ctx.fillStyle = SHELL; ctx.fill();
      for (let i = 1; i < 5; i++) { const x = cx - rx + (i / 5) * rx * 2; line(x, cy - ry * 0.2, x - (x - cx) * 0.2, cy - ry * 1.3, '#7f8c93', S * 0.01); }
    }

    // Limbs (back pair, then front pair after body)
    const legX = [cx - rx * 0.55, cx + rx * 0.5];
    function legs(front) {
      if (!p.limbs) return;
      legX.forEach((lx0, i) => {
        const lx = lx0 + (front ? S * 0.04 : -S * 0.02);
        const swing = Math.sin(t * 2 + i + (front ? 1 : 0)) * 3;
        const top = cy + ry * 0.5;
        const col = front ? dark : hsl(hue, 35, 25);
        if (p.limbs === 'pillar_legs') { ctx.fillStyle = col; ctx.fillRect(lx - S * 0.035, top, S * 0.07, ground - top); }
        else if (p.limbs === 'tentacles') { wavy(lx, top, ground - top + S * 0.03, Math.PI / 2, S * 0.04, t, col, S * 0.03, i + (front ? 2 : 0)); }
        else {
          const kneeX = lx + (p.limbs === 'runner_legs' ? S * 0.05 : S * 0.02) + swing;
          const kneeY = top + (ground - top) * 0.5;
          ctx.beginPath(); ctx.moveTo(lx, top); ctx.lineTo(kneeX, kneeY); ctx.lineTo(lx + swing, ground);
          ctx.strokeStyle = col; ctx.lineWidth = S * (p.limbs === 'runner_legs' ? 0.022 : 0.03); ctx.lineJoin = 'round'; ctx.stroke();
          if (p.limbs === 'digging_claws' || p.limbs === 'hooked_talons') {
            for (let k = 0; k < 3; k++) {
              const fx = lx + swing + k * S * 0.012;
              ctx.beginPath(); ctx.moveTo(fx, ground - 3);
              ctx.quadraticCurveTo(fx + S * 0.03, ground - 2, fx + S * 0.03, ground + (p.limbs === 'hooked_talons' ? 4 : 0));
              ctx.strokeStyle = BONE; ctx.lineWidth = S * 0.008; ctx.stroke();
            }
          }
        }
      });
      if (front && p.limbs === 'gliding_membranes') {
        ctx.beginPath(); ctx.moveTo(legX[0], cy + ry * 0.4); ctx.lineTo(legX[1], cy + ry * 0.4); ctx.lineTo(legX[1] + 6, ground - legLen * 0.3); ctx.lineTo(legX[0] - 6, ground - legLen * 0.3); ctx.closePath();
        ctx.fillStyle = hsl(hue, 50, 65, 0.45); ctx.fill();
      }
    }
    legs(false);

    // Body
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    const grad = ctx.createLinearGradient(cx, cy - ry, cx, cy + ry);
    grad.addColorStop(0, light); grad.addColorStop(1, body);
    ctx.fillStyle = grad; ctx.fill();

    // Skin
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
    if (p.skin === 'scales' || p.skin === 'swift_scales') {
      for (let y = cy - ry; y < cy + ry; y += S * 0.03) {
        for (let x = cx - rx; x < cx + rx; x += S * 0.04) {
          const off = (Math.round((y - cy) / (S * 0.03)) % 2) * S * 0.02;
          ctx.beginPath(); ctx.arc(x + off, y, S * 0.018, 0, Math.PI); ctx.strokeStyle = hsl(hue, 40, 40, 0.6); ctx.lineWidth = 1.2; ctx.stroke();
        }
      }
      if (p.skin === 'swift_scales') for (let i = 0; i < 3; i++) line(cx - rx, cy - ry * 0.3 + i * ry * 0.3, cx + rx, cy - ry * 0.5 + i * ry * 0.3, hsl(hue, 70, 75, 0.7), S * 0.01);
    }
    if (p.skin === 'lichen_hide' || p.back === 'moss_garden') {
      [[-0.5, -0.5], [0.1, -0.7], [0.5, -0.3], [-0.2, 0.2], [-0.7, 0.1]].forEach(([dx, dy], i) => dot(cx + dx * rx, cy + dy * ry, S * (0.025 + (i % 2) * 0.012), PLANT));
    }
    if (p.skin === 'warning_skin') {
      [[-0.5, -0.3], [0, -0.5], [0.45, -0.1], [-0.15, 0.25], [-0.75, 0.2]].forEach(([dx, dy]) => { dot(cx + dx * rx, cy + dy * ry, S * 0.028, '#f2c14e'); dot(cx + dx * rx, cy + dy * ry, S * 0.012, '#1c1414'); });
    }
    if (p.skin === 'biolume_skin') {
      glow(GLOW, 10, () => { for (let i = 0; i < 9; i++) dot(cx - rx * 0.8 + i * rx * 0.2, cy + Math.sin(i) * ry * 0.4, S * 0.01 * (1.2 + 0.5 * Math.sin(t * 3 + i)), GLOW); });
    }
    ctx.restore();
    if (p.skin === 'fur') {
      for (let a = Math.PI * 1.05; a < Math.PI * 1.95; a += 0.09) {
        const x = cx + Math.cos(a) * rx; const y = cy + Math.sin(a) * ry;
        line(x, y, x + Math.cos(a) * 6, y + Math.sin(a) * 9, dark, 2);
      }
    }

    // Back parts on top of body
    if (p.back === 'back_spines' || p.back === 'venom_quills') {
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * 1.15 + i * 0.11;
        const x = cx + Math.cos(a) * rx; const y = cy + Math.sin(a) * ry;
        if (p.back === 'venom_quills') line(x, y, x - S * 0.05, y - S * 0.11, VENOM, S * 0.008);
        else { ctx.beginPath(); ctx.moveTo(x - 6, y + 2); ctx.lineTo(x, y - S * 0.07); ctx.lineTo(x + 6, y + 2); ctx.fillStyle = BONE; ctx.fill(); }
      }
    }
    if (p.back === 'moss_garden') {
      for (let i = 0; i < 6; i++) dot(cx - rx * 0.6 + i * rx * 0.22, cy - ry * 0.95 + Math.abs(i - 2.5) * 3, S * 0.025, PLANT);
    }

    legs(true);

    // Neck and head
    ctx.beginPath(); ctx.moveTo(cx + rx * 0.6, cy - ry * 0.4); ctx.lineTo(hx, hy);
    ctx.strokeStyle = body; ctx.lineWidth = S * 0.1; ctx.lineCap = 'round'; ctx.stroke();
    if (p.senses === 'great_ears') {
      [[-0.5, 0], [-0.1, 0.2]].forEach(([dx]) => {
        ctx.beginPath(); ctx.moveTo(hx + dx * hr - 6, hy - hr * 0.6); ctx.lineTo(hx + dx * hr - 14, hy - hr * 2); ctx.lineTo(hx + dx * hr + 8, hy - hr * 0.7); ctx.closePath();
        ctx.fillStyle = dark; ctx.fill();
      });
    }
    dot(hx, hy, hr, body);
    if (p.senses === 'horned_brow') {
      [[0.1], [-0.3]].forEach(([dx]) => {
        ctx.beginPath(); ctx.moveTo(hx + dx * hr - 5, hy - hr * 0.7); ctx.quadraticCurveTo(hx + dx * hr - 10, hy - hr * 2, hx + dx * hr + 12, hy - hr * 2.1);
        ctx.lineTo(hx + dx * hr + 5, hy - hr * 0.8); ctx.fillStyle = BONE; ctx.fill();
      });
    }
    if (p.senses === 'antennae') {
      wavy(hx - hr * 0.2, hy - hr * 0.8, hr * 1.6, -Math.PI * 0.6, 4, t, dark, 2);
      wavy(hx + hr * 0.2, hy - hr * 0.8, hr * 1.6, -Math.PI * 0.35, 4, t, dark, 2, 1.5);
    }

    // Mouth
    const mx = hx + hr * 0.9; const my = hy + hr * 0.25;
    if (p.mouth === 'grinding_beak') { ctx.beginPath(); ctx.moveTo(mx - 6, my - hr * 0.35); ctx.lineTo(mx + hr * 0.7, my); ctx.lineTo(mx - 6, my + hr * 0.3); ctx.fillStyle = '#e0b04c'; ctx.fill(); }
    if (p.mouth === 'fangs' || p.mouth === 'venom_fangs' || p.mouth === 'lure_jaw') {
      line(mx - hr * 0.5, my, mx + 2, my, hsl(hue, 30, 15), 3);
      const c = p.mouth === 'venom_fangs' ? VENOM : BONE;
      [0, 1].forEach((k) => { ctx.beginPath(); ctx.moveTo(mx - hr * 0.3 + k * 8, my); ctx.lineTo(mx - hr * 0.25 + k * 8, my + hr * 0.4); ctx.lineTo(mx - hr * 0.15 + k * 8, my); ctx.fillStyle = c; ctx.fill(); });
    }
    if (p.mouth === 'lure_jaw') {
      ctx.beginPath(); ctx.moveTo(hx, hy - hr); ctx.quadraticCurveTo(hx + hr * 1.5, hy - hr * 2.4, hx + hr * 2, hy - hr * 0.8);
      ctx.strokeStyle = dark; ctx.lineWidth = 2; ctx.stroke();
      glow(GLOW, 18, () => dot(hx + hr * 2, hy - hr * 0.8 + Math.sin(t * 3) * 3, S * 0.022, GLOW));
    }
    if (p.mouth === 'mandibles') {
      [-1, 1].forEach((s) => { ctx.beginPath(); ctx.moveTo(mx - 4, my + s * 3); ctx.quadraticCurveTo(mx + hr * 0.6, my + s * hr * 0.5, mx + hr * 0.5, my + s * 1); ctx.strokeStyle = dark; ctx.lineWidth = 4; ctx.stroke(); });
    }
    if (p.mouth === 'trunk') {
      ctx.beginPath(); ctx.moveTo(mx - 4, my - 2); ctx.quadraticCurveTo(mx + hr * 1.1, my + hr * 0.3, mx + hr * 0.6 + Math.sin(t * 1.5) * 4, my + hr * 1.6);
      ctx.strokeStyle = body; ctx.lineWidth = S * 0.035; ctx.lineCap = 'round'; ctx.stroke();
    }

    // Eyes
    const ex = hx + hr * 0.25; const ey = hy - hr * 0.25;
    if (p.senses === 'big_eyes') { dot(ex, ey, hr * 0.42, '#fff'); dot(ex + hr * 0.1, ey, hr * 0.22, '#1c1414'); }
    else if (p.senses === 'glow_eyes') glow(GLOW, 14, () => { dot(ex, ey, hr * 0.25, GLOW); });
    else { dot(ex, ey, hr * 0.2, '#fff'); dot(ex + hr * 0.06, ey, hr * 0.11, '#1c1414'); }
    if (p.senses === 'tremor_whiskers') {
      for (let k = -1; k <= 1; k++) line(mx - 4, my - 4, mx + hr * 0.9, my - 4 + k * hr * 0.35, BONE, 1.2);
    }
  }

  function loop(ts) {
    if (!canvas || !current || !canvas.isConnected) { frame = null; return; }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth; const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const t = reduceMotion ? 0 : ts / 1000;
    if (current.stage === 'cell') drawCell(current, w, h, t);
    else drawCreature(current, w, h, t);
    frame = reduceMotion ? null : requestAnimationFrame(loop);
  }

  // Attach the renderer to a canvas and draw this run's organism.
  G.drawOrganism = function (el, run) {
    canvas = el; current = run;
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(loop);
  };
}());
