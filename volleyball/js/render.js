// Canvas renderer: a perspective camera behind team 0's end line that drifts
// with the ball. Reads game state only; never changes it.
(function () {
  var C = SR.COURT;
  var W = 960, H = 640;
  var FOC = 1250, CY = 290;
  var cam = { x: -16, y: 4.5, z: 17 }, look = { x: 9.8, y: 4.5, z: 0 };
  var f, r, u, camFollow = 4.5, lastNow = 0, spin = 0, trail = [], lastBall = null;

  function norm(v) { var l = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z); return { x: v.x / l, y: v.y / l, z: v.z / l }; }
  function cross(a, b) { return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }; }
  function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }

  function setCamera(followY) {
    look.y = 4.5 + (followY - 4.5) * 0.2;
    cam.y = 4.5 + (followY - 4.5) * 0.12;
    f = norm({ x: look.x - cam.x, y: look.y - cam.y, z: look.z - cam.z });
    r = norm(cross(f, { x: 0, y: 0, z: 1 }));
    u = cross(r, f);
  }
  setCamera(4.5);

  var panX = 0;

  function proj(x, y, z) {
    var v = { x: x - cam.x, y: y - cam.y, z: z - cam.z };
    var zc = dot(v, f);
    return { x: W / 2 + dot(v, r) / zc * FOC, y: CY - dot(v, u) / zc * FOC, s: FOC / zc, d: zc };
  }

  // Screen point -> point on the floor (z = 0).
  function unproject(sx, sy) {
    sx -= panX;
    var a = (sx - W / 2) / FOC, b = -(sy - CY) / FOC;
    var d = { x: f.x + r.x * a + u.x * b, y: f.y + r.y * a + u.y * b, z: f.z + r.z * a + u.z * b };
    if (d.z >= -1e-4) return null;
    var t = -cam.z / d.z;
    return { x: cam.x + d.x * t, y: cam.y + d.y * t };
  }

  function path(ctx, pts) {
    ctx.beginPath();
    pts.forEach(function (p, i) { var q = proj(p[0], p[1], p[2] || 0); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); });
    ctx.closePath();
  }

  function poly(ctx, pts, fill, stroke, lw) {
    path(ctx, pts);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
  }

  function line(ctx, a, b, color, lw) {
    var p = proj(a[0], a[1], a[2] || 0), q = proj(b[0], b[1], b[2] || 0);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
    ctx.strokeStyle = color; ctx.lineWidth = lw || 2; ctx.stroke();
  }

  function groundEllipse(ctx, x, y, rad, fill, stroke, lw) {
    ctx.beginPath();
    for (var i = 0; i <= 28; i++) {
      var a = i / 28 * Math.PI * 2, q = proj(x + Math.cos(a) * rad, y + Math.sin(a) * rad, 0);
      if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y);
    }
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
  }

  function roundRect(ctx, x, y, w, h, rad) {
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function hash(i) { var x = Math.sin(i * 127.1) * 43758.5453; return x - Math.floor(x); }

  // ---- arena --------------------------------------------------------------

  var FAN_SHIRTS = ['#e9e9e9', '#ff6b6b', '#ffd23f', '#6fb6ff', '#7ee0a0', '#c79bff', '#ff9b54', '#2b2b2b'];
  var FAN_SKIN = ['#f1c7a3', '#d9a37e', '#b97a55', '#8d5a3b', '#6a4329'];

  function seatRow(ctx, pts, seed, t, cheer, seat) {
    pts.forEach(function (pt, i) {
      var q = proj(pt[0], pt[1], pt[2]), s = q.s;
      if (q.x < -20 || q.x > W + 20 || q.y < -20 || q.y > H + 20) return;
      var w = Math.max(2, 0.42 * s), h = Math.max(2, 0.3 * s);
      ctx.fillStyle = seat;
      ctx.fillRect(q.x - w / 2, q.y - h / 2, w, h);
      var hv = hash(seed + i);
      if (hv < 0.78) {
        var hop = cheer > 0 ? Math.max(0, Math.sin(t * 9 + hv * 20)) * 0.18 * Math.min(1, cheer) : 0;
        var b = proj(pt[0], pt[1], pt[2] + 0.35 + hop), hd = proj(pt[0], pt[1], pt[2] + 0.62 + hop);
        ctx.fillStyle = FAN_SHIRTS[Math.floor(hv * 97) % FAN_SHIRTS.length];
        ctx.fillRect(b.x - w * 0.32, b.y - h * 0.5, w * 0.64, h * 1.1);
        ctx.fillStyle = FAN_SKIN[Math.floor(hv * 53) % FAN_SKIN.length];
        ctx.beginPath(); ctx.arc(hd.x, hd.y, Math.max(1.2, 0.11 * s), 0, Math.PI * 2); ctx.fill();
        if (cheer > 0.3 && hv < 0.4) {
          ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = Math.max(1, 0.05 * s);
          ctx.beginPath(); ctx.moveTo(hd.x - w * 0.3, hd.y); ctx.lineTo(hd.x - w * 0.45, hd.y - 0.3 * s);
          ctx.moveTo(hd.x + w * 0.3, hd.y); ctx.lineTo(hd.x + w * 0.45, hd.y - 0.3 * s); ctx.stroke();
        }
      }
    });
  }

  function drawStands(ctx, style, t, cheer) {
    var seat = style.seat || '#e8742a', riser = style.riser || '#1c2a22';
    // Far end stand
    poly(ctx, [[21.6, -7, 0], [21.6, 16, 0], [27, 16, 4.2], [27, -7, 4.2]], riser);
    for (var k = 4; k >= 0; k--) {
      var pts = [];
      for (var y = -6.5; y <= 15.5; y += 0.75) pts.push([22 + k * 1.05, y + (k % 2) * 0.37, 0.45 + k * 0.8]);
      seatRow(ctx, pts, 1000 + k * 50, t, cheer, seat);
    }
    // Side stands
    [1, -1].forEach(function (side) {
      var base = side === 1 ? 12.6 : -3.6;
      poly(ctx, [[-4, base, 0], [21.5, base, 0], [21.5, base + side * 5, 3.6], [-4, base + side * 5, 3.6]], riser);
      for (var k = 3; k >= 0; k--) {
        var pts = [];
        for (var x = 21; x >= -3.5; x -= 0.8) pts.push([x + (k % 2) * 0.4, base + side * (0.5 + k * 1.2), 0.45 + k * 0.85]);
        seatRow(ctx, pts, (side === 1 ? 3000 : 5000) + k * 60, t, cheer, seat);
      }
    });
  }

  function drawBoards(ctx, t) {
    // LED boards: far end shows scrolling text, sides show moving colour bands.
    var hgt = 0.9;
    path(ctx, [[20.8, -1.5, 0], [20.8, 10.5, 0], [20.8, 10.5, hgt], [20.8, -1.5, hgt]]);
    ctx.fillStyle = '#070b14'; ctx.fill();
    ctx.save(); ctx.clip();
    var c = proj(20.8, 4.5, hgt / 2), s = c.s;
    ctx.font = '900 ' + Math.round(0.62 * s) + 'px system-ui, sans-serif';
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    var msg = 'SPIKE RALLY   ★   PLAY HARD   ★   SIDE OUT   ★   ', tw = ctx.measureText(msg).width;
    var off = (t * 60) % tw;
    var hue = (t * 40) % 360;
    ctx.fillStyle = 'hsl(' + hue + ',90%,62%)';
    for (var k = -1; k < 3; k++) ctx.fillText(msg, c.x - 260 - off + k * tw, c.y);
    ctx.restore();
    [-1.8, 10.8].forEach(function (y, si) {
      for (var x = -2, i = 0; x < 20.5; x += 1.5, i++) {
        var on = Math.floor(t * 4 + i + si * 2) % 3;
        var col = on === 0 ? '#ffd23f' : on === 1 ? '#ff6b3d' : '#1e2a44';
        poly(ctx, [[x, y, 0], [x + 1.45, y, 0], [x + 1.45, y, hgt * 0.8], [x, y, hgt * 0.8]], col);
      }
    });
  }

  function drawArena(ctx, style, t, cheer) {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, style.wall); g.addColorStop(0.45, style.wall); g.addColorStop(1, '#000');
    ctx.fillStyle = g; ctx.fillRect(-80, 0, W + 160, H);
    // Ceiling lights
    for (var i = 0; i < 6; i++) {
      var lx = 120 + i * 144, lg = ctx.createRadialGradient(lx, 6, 0, lx, 6, 70);
      lg.addColorStop(0, 'rgba(255,255,235,0.35)'); lg.addColorStop(1, 'rgba(255,255,235,0)');
      ctx.fillStyle = lg; ctx.fillRect(lx - 70, 0, 140, 80);
    }
    drawStands(ctx, style, t, cheer);
    poly(ctx, [[-4, -3.5], [21.6, -3.5], [21.6, 12.6], [-4, 12.6]], style.floor);
    poly(ctx, [[0, 0], [18, 0], [18, 9], [0, 9]], style.court);
    poly(ctx, [[6, 0], [12, 0], [12, 9], [6, 9]], style.zone);
    // Floor sheen under the arena lights
    var c = proj(9, 4.5, 0), sg = ctx.createRadialGradient(c.x, c.y - 40, 10, c.x, c.y, 420);
    sg.addColorStop(0, 'rgba(255,255,255,0.16)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    path(ctx, [[0, 0], [18, 0], [18, 9], [0, 9]]); ctx.fillStyle = sg; ctx.fill();
    var lc = style.line;
    if (style.glow) { ctx.shadowColor = lc; ctx.shadowBlur = 10; }
    poly(ctx, [[0, 0], [18, 0], [18, 9], [0, 9]], null, lc, 3);
    line(ctx, [9, 0], [9, 9], lc, 3);
    line(ctx, [6, 0], [6, 9], lc, 2.2);
    line(ctx, [12, 0], [12, 9], lc, 2.2);
    ctx.shadowBlur = 0;
    // Net shadow on the floor
    poly(ctx, [[9.15, -0.5], [9.55, -0.5], [9.55, 9.5], [9.15, 9.5]], 'rgba(0,0,0,0.12)');
  }

  // The arena is static while the crowd is calm, so it is drawn once into an
  // offscreen canvas and copied each frame; cheering crowds are drawn live.
  var cache = { cv: null, key: '' };
  function arenaLayer(ctx, style, t, cheer) {
    if (cheer > 0 || typeof document === 'undefined') { drawArena(ctx, style, t, cheer); return; }
    var sc = SR.render.scale, key = style.id + '|' + sc, PAD = 70;
    if (cache.key !== key) {
      cache.cv = cache.cv || document.createElement('canvas');
      cache.cv.width = Math.ceil((W + PAD * 2) * sc); cache.cv.height = Math.ceil(H * sc);
      var c2 = cache.cv.getContext('2d');
      c2.setTransform(sc, 0, 0, sc, PAD * sc, 0);
      drawArena(c2, style, t, 0);
      cache.key = key;
    }
    ctx.drawImage(cache.cv, -PAD, 0, W + PAD * 2, H);
  }

  function drawNet(ctx) {
    var top = C.NET_H, bot = C.NET_H - 1;
    line(ctx, [9, -0.7, 0], [9, -0.7, top + 0.1], '#dfe5ee', 6);
    line(ctx, [9, 9.7, 0], [9, 9.7, top + 0.1], '#dfe5ee', 6);
    poly(ctx, [[9, -0.7, 0], [9, -0.7, 0.9], [9, -0.5, 0.9], [9, -0.5, 0]], '#e5484d');
    poly(ctx, [[9, 9.5, 0], [9, 9.5, 0.9], [9, 9.7, 0.9], [9, 9.7, 0]], '#e5484d');
    poly(ctx, [[9, -0.5, bot], [9, 9.5, bot], [9, 9.5, top], [9, -0.5, top]], 'rgba(15,15,20,0.32)');
    ctx.globalAlpha = 0.5;
    for (var y = -0.5; y <= 9.5; y += 0.2) line(ctx, [9, y, bot], [9, y, top], '#0b0b0b', 1);
    for (var z = bot; z <= top; z += 0.15) line(ctx, [9, -0.5, z], [9, 9.5, z], '#0b0b0b', 1);
    ctx.globalAlpha = 1;
    line(ctx, [9, -0.5, top], [9, 9.5, top], '#ffffff', 5);
    line(ctx, [9, -0.5, bot], [9, 9.5, bot], '#f4f4f4', 2);
    [0, 9].forEach(function (y) {
      for (var k = 0; k < 8; k++) line(ctx, [9, y, top - 0.1 + k * 0.1], [9, y, top + k * 0.1], k % 2 ? '#fff' : '#e5484d', 3);
    });
  }

  // ---- ball and effects ----------------------------------------------------

  function drawTrail(ctx, style) {
    for (var i = 0; i < trail.length; i++) {
      var tp = trail[i], q = proj(tp.x, tp.y, tp.z), k = (i + 1) / trail.length;
      ctx.globalAlpha = k * 0.35 * Math.min(1, tp.v / 12);
      ctx.fillStyle = tp.v > 16 ? '#ffb347' : style.main;
      ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(2, 0.2 * q.s) * (0.4 + k * 0.6), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawBall(ctx, b, style) {
    var hgt = b.z;
    groundEllipse(ctx, b.x, b.y, 0.15 + Math.min(0.25, hgt * 0.03), 'rgba(0,0,0,' + Math.max(0.1, 0.42 - hgt * 0.05) + ')');
    var q = proj(b.x, b.y, b.z), rad = Math.max(3, 0.21 * q.s);
    ctx.save();
    ctx.beginPath(); ctx.arc(q.x, q.y, rad, 0, Math.PI * 2);
    ctx.fillStyle = style.main; ctx.fill();
    ctx.clip();
    ctx.translate(q.x, q.y); ctx.rotate(spin);
    ctx.strokeStyle = style.stripe; ctx.lineWidth = rad * 0.42;
    ctx.beginPath(); ctx.arc(-rad * 0.95, 0, rad * 1.1, -0.9, 0.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(rad * 0.95, 0, rad * 1.1, Math.PI - 0.9, Math.PI + 0.9); ctx.stroke();
    ctx.restore();
    var hl = ctx.createRadialGradient(q.x - rad * 0.4, q.y - rad * 0.45, 0, q.x, q.y, rad);
    hl.addColorStop(0, 'rgba(255,255,255,0.55)'); hl.addColorStop(0.5, 'rgba(255,255,255,0)'); hl.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.beginPath(); ctx.arc(q.x, q.y, rad, 0, Math.PI * 2); ctx.fillStyle = hl; ctx.fill();
  }

  function drawFx(ctx, pass) {
    var fx = SR.fx;
    if (pass === 'ground') {
      fx.rings.forEach(function (r) {
        var a = 1 - r.life / r.max;
        groundEllipse(ctx, r.x, r.y, r.r, null, r.color, 3 * a + 1);
        ctx.globalAlpha = a * 0.25; groundEllipse(ctx, r.x, r.y, r.r * 0.9, r.color); ctx.globalAlpha = 1;
      });
      return;
    }
    fx.parts.forEach(function (p) {
      var q = proj(p.x, p.y, p.z), a = 1 - p.life / p.max;
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = p.color;
      var sz = Math.max(1.2, p.size * q.s);
      if (p.flutter !== undefined) { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(p.life * 6 + p.flutter); ctx.fillRect(-sz, -sz * 0.5, sz * 2, sz); ctx.restore(); }
      else { ctx.beginPath(); ctx.arc(q.x, q.y, sz, 0, Math.PI * 2); ctx.fill(); }
    });
    ctx.globalAlpha = 1;
  }

  function reticle(ctx, x, y, color, label, t) {
    var pulse = 0.5 + 0.5 * Math.sin(t * 7);
    ctx.globalAlpha = 0.35 + pulse * 0.2;
    groundEllipse(ctx, x, y, 0.75 + pulse * 0.08, color);
    ctx.globalAlpha = 1;
    groundEllipse(ctx, x, y, 0.75 + pulse * 0.08, null, color, 2.5);
    groundEllipse(ctx, x, y, 0.14, '#ffffff');
    if (label) {
      var q = proj(x, y, 0);
      ctx.font = '800 13px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.strokeText(label, q.x, q.y - 0.95 * q.s);
      ctx.fillStyle = '#fff'; ctx.fillText(label, q.x, q.y - 0.95 * q.s);
    }
  }

  // Block call zones on your side of the net (screen left, middle, right).
  var BLOCK_ZONES = { left: [6, 9], middle: [3, 6], right: [0, 3] };
  function drawBlockZones(ctx, active, t) {
    Object.keys(BLOCK_ZONES).forEach(function (id) {
      var z = BLOCK_ZONES[id], on = id === active;
      var pts = [[7.7, z[0] + 0.15], [8.85, z[0] + 0.15], [8.85, z[1] - 0.15], [7.7, z[1] - 0.15]];
      ctx.globalAlpha = on ? 0.55 + 0.15 * Math.sin(t * 8) : 0.28;
      poly(ctx, pts, on ? '#ffd23f' : '#ff7a59');
      ctx.globalAlpha = 1;
      poly(ctx, pts, null, on ? '#ffd23f' : 'rgba(255,255,255,0.5)', 2);
      var c = proj(8.27, (z[0] + z[1]) / 2, 0);
      ctx.font = '900 ' + Math.round(0.9 * c.s) + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = on ? '#3a2a00' : 'rgba(255,255,255,0.75)';
      ctx.fillText('B', c.x, c.y);
    });
  }

  // ---- HUD ----------------------------------------------------------------

  var lastScore = [0, 0], popAt = [-9, -9];

  function drawScoreboard(ctx, game) {
    var m = game.match, cx = W / 2, y0 = 10, w = 500, h = 52, now = performance.now() / 1000;
    roundRect(ctx, cx - w / 2, y0, w, h, 12);
    ctx.fillStyle = 'rgba(6,10,18,0.88)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.textBaseline = 'middle';
    for (var t = 0; t < 2; t++) {
      var team = m.teams[t], sign = t === 0 ? -1 : 1;
      var edgeX = cx + sign * (w / 2 - 10);
      // Team colour tab with jersey pattern hint
      ctx.fillStyle = team.color;
      roundRect(ctx, t === 0 ? edgeX : edgeX - 8, y0 + 9, 8, h - 18, 3); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '800 20px system-ui, sans-serif';
      ctx.textAlign = t === 0 ? 'left' : 'right';
      ctx.fillText(team.short, cx + sign * (w / 2 - 26), y0 + 21);
      ctx.font = '600 12px system-ui, sans-serif'; ctx.fillStyle = '#9fb0c8';
      ctx.fillText('rot ' + (m.rot[t] + 1), cx + sign * (w / 2 - 26), y0 + 39);
      // Sets box (gold) and points box (white)
      var sx = cx + sign * 118, px = cx + sign * 62;
      roundRect(ctx, sx - 15, y0 + 9, 30, h - 18, 6); ctx.fillStyle = '#f2c230'; ctx.fill();
      ctx.fillStyle = '#1b1300'; ctx.font = '800 20px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(String(m.sets[t]), sx, y0 + h / 2 + 1);
      // Point box pops and flashes in the team colour when the score goes up
      if (m.score[t] > lastScore[t]) popAt[t] = now;
      lastScore[t] = m.score[t];
      var pk = Math.max(0, 1 - (now - popAt[t]) / 0.45), sc = 1 + 0.35 * pk * pk;
      ctx.save(); ctx.translate(px, y0 + h / 2); ctx.scale(sc, sc);
      roundRect(ctx, -24, -h / 2 + 7, 48, h - 14, 7);
      ctx.fillStyle = pk > 0.5 ? team.color : '#ffffff'; ctx.fill();
      ctx.fillStyle = pk > 0.5 ? '#ffffff' : '#0d1424'; ctx.font = '900 26px system-ui, sans-serif';
      ctx.fillText(String(m.score[t]), 0, 1);
      ctx.restore();
      if (m.server === t) {
        var bx = cx + sign * 150;
        ctx.beginPath(); ctx.arc(bx, y0 + h / 2, 6, 0, Math.PI * 2);
        ctx.fillStyle = SR.render.ballStyle().main; ctx.fill();
        ctx.strokeStyle = SR.render.ballStyle().stripe; ctx.lineWidth = 2; ctx.stroke();
      }
    }
    ctx.font = '700 11px system-ui, sans-serif'; ctx.fillStyle = '#9fb0c8'; ctx.textAlign = 'center';
    ctx.fillText('SET ' + m.setNo, cx, y0 + 19);
    ctx.font = '600 10px system-ui, sans-serif';
    ctx.fillText('TO ' + m.target(), cx, y0 + 35);
  }

  function hint(ctx, text) {
    ctx.font = '600 15px system-ui, sans-serif';
    var w = ctx.measureText(text).width + 32;
    roundRect(ctx, W / 2 - w / 2, 70, w, 34, 17);
    ctx.fillStyle = 'rgba(6,10,18,0.8)'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, 87);
  }

  // A row of pill buttons along the bottom; returns their hit boxes.
  function buttonRow(ctx, items, active, kind) {
    var w = 104, h = 40, gap = 10, total = items.length * w + (items.length - 1) * gap, x0 = W / 2 - total / 2, y0 = H - 62, out = [];
    items.forEach(function (it, i) {
      var x = x0 + i * (w + gap), on = it.id === active;
      roundRect(ctx, x, y0, w, h, 12);
      ctx.fillStyle = on ? '#ffd23f' : 'rgba(6,10,18,0.85)'; ctx.fill();
      ctx.strokeStyle = on ? '#ffd23f' : 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = on ? '#111' : 'rgba(255,255,255,0.55)'; ctx.font = '700 11px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), x + 10, y0 + h / 2);
      ctx.fillStyle = on ? '#111' : '#fff'; ctx.font = '700 15px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(it.label, x + w / 2 + 6, y0 + h / 2);
      out.push({ x: x, y: y0, w: w, h: h, id: it.id, kind: kind });
    });
    return out;
  }

  // Segmented capsule power meter: green at the bottom to red at the top.
  function drawPower(ctx, power) {
    var x = 34, y0 = 300, w = 34, h = 250, n = 16, gap = 3, segH = (h - 16 - gap * (n - 1)) / n;
    roundRect(ctx, x, y0, w, h, 17); ctx.fillStyle = 'rgba(6,10,18,0.88)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.5; ctx.stroke();
    var lit = Math.round(power * n);
    for (var i = 0; i < n; i++) {
      var k = i / (n - 1), hue = 125 - k * 125;
      var yy = y0 + h - 8 - (i + 1) * segH - i * gap;
      roundRect(ctx, x + 6, yy, w - 12, segH, 3);
      ctx.fillStyle = i < lit ? 'hsl(' + hue + ',85%,52%)' : 'hsla(' + hue + ',40%,30%,0.45)';
      if (i < lit && i === lit - 1) { ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 12; }
      ctx.fill(); ctx.shadowBlur = 0;
    }
    ctx.fillStyle = '#fff'; ctx.font = '800 11px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('POWER', x + w / 2, y0 - 12);
  }

  function drawBanner(ctx, b) {
    var k = b.t / b.dur, a = k < 0.1 ? k / 0.1 : k > 0.78 ? (1 - k) / 0.22 : 1;
    var sc = k < 0.12 ? 0.5 + (k / 0.12) * 0.65 : k < 0.2 ? 1.15 - ((k - 0.12) / 0.08) * 0.15 : 1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    ctx.translate(W / 2, 205); ctx.scale(sc, sc); ctx.rotate(-0.04);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'italic 900 72px system-ui, sans-serif';
    ctx.shadowColor = b.color; ctx.shadowBlur = 28;
    ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText(b.text, 0, 0);
    var g = ctx.createLinearGradient(0, -36, 0, 36);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ffe7a0');
    ctx.fillStyle = g; ctx.fillText(b.text, 0, 0);
    ctx.shadowBlur = 0;
    if (b.sub) {
      ctx.font = '800 22px system-ui, sans-serif';
      ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.lineWidth = 5;
      ctx.strokeText(b.sub, 0, 50); ctx.fillStyle = b.color; ctx.fillText(b.sub, 0, 50);
    }
    ctx.restore();
  }

  function drawOverlay(ctx, rally) {
    var vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (rally && rally.timeScale < 1) {
      // Slow motion: cinematic bars and a cool tint.
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, 6); ctx.fillRect(0, H - 6, W, 6);
      ctx.fillStyle = 'rgba(60,120,255,0.07)'; ctx.fillRect(0, 0, W, H);
    }
    if (SR.fx.flash > 0) { ctx.globalAlpha = SR.fx.flash * 1.6; ctx.fillStyle = SR.fx.flashColor; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  SR.render = {
    W: W, H: H,
    proj: proj,
    unproject: unproject,
    BLOCK_ZONES: BLOCK_ZONES,
    ballStyle: function () {
      var id = SR.save.data.equipped.ball;
      return SR.SHOP.balls.find(function (b) { return b.id === id; }) || SR.SHOP.balls[0];
    },
    courtStyle: function () {
      var id = SR.save.data.equipped.court;
      return SR.SHOP.courts.find(function (c) { return c.id === id; }) || SR.SHOP.courts[0];
    },
    // Screen positions of player heads from the last frame, for click picking.
    heads: [],
    buttons: [],

    draw: function (ctx, game) {
      var now = performance.now() / 1000, dt = lastNow ? Math.min(0.05, now - lastNow) : 0;
      lastNow = now;
      var rally = game && game.rally, paused = game && game.paused;
      var simDt = paused ? 0 : dt * (rally ? rally.timeScale : 1) * (SR.speed || 1);
      SR.fx.update(Math.min(0.1, simDt));

      // The view pans gently toward the ball.
      if (rally) camFollow += (Math.max(-1, Math.min(10, rally.ball.y)) - camFollow) * Math.min(1, dt * 2);
      panX = (camFollow - 4.5) * 9;

      ctx.setTransform(SR.render.scale, 0, 0, SR.render.scale, 0, 0);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      var sh = SR.fx.shake;
      ctx.translate(panX + (sh > 0 ? (Math.random() - 0.5) * sh : 0), sh > 0 ? (Math.random() - 0.5) * sh : 0);
      var style = this.courtStyle();
      arenaLayer(ctx, style, now, SR.fx.cheer);
      drawBoards(ctx, now);
      this.heads = [];
      this.buttons = [];
      if (!rally) { drawOverlay(ctx, null); return; }
      var m = game.match, ui = rally.ui;

      // Ball trail and spin
      var b = rally.ball;
      if (lastBall && rally.state === 'rally' && simDt > 0) {
        var dd = Math.sqrt(Math.pow(b.x - lastBall.x, 2) + Math.pow(b.y - lastBall.y, 2) + Math.pow(b.z - lastBall.z, 2));
        spin += dd * 3;
        trail.push({ x: b.x, y: b.y, z: b.z, v: dd / simDt });
        if (trail.length > 12) trail.shift();
      } else if (rally.state !== 'rally') { trail.length = 0; }
      lastBall = { x: b.x, y: b.y, z: b.z };

      // Ground markers under everything else
      drawFx(ctx, 'ground');
      if (ui.prompt === 'block') drawBlockZones(ctx, ui.blockCall === 'read' ? null : ui.blockCall, now);
      if (ui.prompt === 'serve') reticle(ctx, ui.aim.x, ui.aim.y, '#ff4d3d', 'SERVE', now);
      var shotName = SR.SHOTS[ui.tip ? 'tip' : ui.shot].label.toUpperCase();
      if (ui.attackTarget && rally.state === 'rally') reticle(ctx, ui.attackTarget.x, ui.attackTarget.y, ui.tip || ui.shot === 'tip' ? '#36c5ff' : '#ff4d3d', shotName, now);
      if (ui.prompt === 'target' && game.hover && !ui.attackTarget && !SR.SHOTS[ui.shot].auto) reticle(ctx, game.hover.x, game.hover.y, game.shift ? '#36c5ff' : '#ff4d3d', null, now);

      var hitterSet = {};
      if (ui.prompt === 'hitter') ui.hitters.forEach(function (h, i) { hitterSet[h.p.idx] = i + 1; });

      // Depth-sort: far half, net, near half.
      var items = [];
      rally.all().forEach(function (p) { items.push({ k: 'p', o: p, d: proj(p.x, p.y, 0).d }); });
      items.push({ k: 'b', o: b, d: proj(b.x, b.y, 0).d - 0.01 });
      items.sort(function (a, c) { return c.d - a.d; });
      var netDrawn = false, self = this, ballStyle = this.ballStyle();
      items.forEach(function (it) {
        if (!netDrawn && it.o.x < C.NET_X) { drawNet(ctx); netDrawn = true; }
        if (it.k === 'p') {
          var p = it.o, hl = null;
          if (p.team === 0 && hitterSet[p.idx]) hl = (ui.hitterChoice === p) ? '#ffd23f' : '#ffffff';
          if (rally.server === p && rally.state === 'serve') hl = '#ffd23f';
          if (ui.prompt === 'block' && ui.blockThreats.indexOf(p) >= 0) hl = '#ff9b54';
          var head = SR.sprites.draw(ctx, p, m.teams[p.team], rally, proj, hl);
          self.heads.push({ p: p, x: head.x + panX, y: head.y });
          if (p.team === 0 && hitterSet[p.idx]) {
            var by = head.y - 30 + Math.sin(now * 6 + p.idx) * 3;
            ctx.beginPath(); ctx.arc(head.x, by, 13, 0, Math.PI * 2);
            ctx.fillStyle = ui.hitterChoice === p ? '#ffd23f' : 'rgba(255,255,255,0.95)'; ctx.fill();
            ctx.fillStyle = '#111'; ctx.font = '900 14px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(String(hitterSet[p.idx]), head.x, by + 1);
          }
        } else {
          drawTrail(ctx, ballStyle);
          drawBall(ctx, it.o, ballStyle);
        }
      });
      if (!netDrawn) drawNet(ctx);
      drawFx(ctx, 'air');

      ctx.setTransform(SR.render.scale, 0, 0, SR.render.scale, 0, 0);
      drawOverlay(ctx, rally);
      drawScoreboard(ctx, game);
      if (ui.prompt === 'serve') { drawPower(ctx, ui.power); hint(ctx, 'Aim on their court, click or tap to serve (Space)'); }
      else if (ui.prompt === 'hitter') hint(ctx, ui.hitterChoice ? 'Hitter chosen' : 'Pick your hitter: click a player or press 1-' + ui.hitters.length);
      else if (ui.prompt === 'target') {
        hint(ctx, ui.attackTarget ? shotName + ' locked in' : 'Pick a shot (1-6), then click where it goes. Line, Cross and Tool aim themselves');
        this.buttons = buttonRow(ctx, SR.SHOT_ORDER.map(function (id) { return { id: id, label: SR.SHOTS[id].label }; }), ui.tip ? 'tip' : ui.shot, 'shot');
      } else if (ui.prompt === 'block') {
        hint(ctx, 'Call the block (1-4 or tap a B zone): commit to a side, or Read the set');
        this.buttons = buttonRow(ctx, [{ id: 'left', label: 'Left' }, { id: 'middle', label: 'Middle' }, { id: 'right', label: 'Right' }, { id: 'read', label: 'Read' }], ui.blockCall, 'block');
      }
      if (rally.banner) drawBanner(ctx, rally.banner);
    },
    scale: 1
  };
})();
