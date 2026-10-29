// Canvas renderer: a perspective camera behind team 0's end line that drifts
// with the ball. Reads game state only; never changes it.
(function () {
  var C = SR.COURT;
  var W = 960, H = 640;
  var FOC = 1250, CY = 290, PAN = 9, portrait = false, UI = 1;
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
    if (!(d.z < -1e-4)) return null; // above the horizon, or not a number
    var t = -cam.z / d.z, x = cam.x + d.x * t, y = cam.y + d.y * t;
    return isFinite(x) && isFinite(y) ? { x: x, y: y } : null;
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

  // ---- venue floor art (league and tournament arenas, see SR.ARENAS) -------

  // Points on a circle (or a star when r2 is given) around (cx, cy).
  function ring(cx, cy, r, n, r2, rot) {
    var pts = [];
    for (var i = 0; i < n; i++) {
      var a = (rot || 0) + i / n * Math.PI * 2, rr = r2 && i % 2 ? r2 : r;
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    return pts;
  }
  // Emblem coordinates as the camera sees them: u to the right, v up the screen.
  function em(cx, cy, pts, k) { return pts.map(function (p) { return [cx + p[1] * k, cy - p[0] * k]; }); }
  function alpha(ctx, a, fn) { ctx.save(); ctx.globalAlpha = a; fn(); ctx.restore(); }
  // Clip drawing to the floor around the court.
  function clipFreeZone(ctx) {
    ctx.save();
    ctx.beginPath();
    [[[-12, -3.5], [21.6, -3.5], [21.6, 12.6], [-12, 12.6]], [[0, 0], [18, 0], [18, 9], [0, 9]]].forEach(function (pts) {
      pts.forEach(function (p, i) { var q = proj(p[0], p[1], 0); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); });
      ctx.closePath();
    });
    ctx.clip('evenodd');
  }
  // One emblem in each back court, between the end line and the attack line.
  var EMBLEMS = [[3, 4.5], [15, 4.5]];

  // floor(ctx, style): art around the court; court(ctx, style, cx, cy): an emblem.
  var MOTIFS = {
    // Harbor Dome: rolling waves down both sidelines, wing chevrons on court.
    waves: {
      floor: function (ctx, st) {
        [-1, 1].forEach(function (side) {
          for (var k = 0; k < 4; k++) {
            var top = [], bot = [];
            for (var x = -12; x <= 21.6; x += 0.6) {
              var y = (side < 0 ? -0.5 : 9.5) + side * k * 0.8 + 0.22 * Math.sin(x * 0.75 + k * 1.3);
              top.push([x, y]); bot.unshift([x, y + side * 0.32]);
            }
            alpha(ctx, 0.3 - k * 0.05, function () { poly(ctx, top.concat(bot), st.accent); });
          }
        });
      },
      court: function (ctx, st, cx, cy) {
        for (var i = 0; i < 3; i++) {
          var o = 0.9 - i * 0.75;
          alpha(ctx, 0.2 - i * 0.04, function () {
            poly(ctx, em(cx, cy, [[0, o + 0.6], [2, o - 0.9], [2, o - 1.35], [0, o + 0.15], [-2, o - 1.35], [-2, o - 0.9]], 1), '#ffffff');
          });
        }
      }
    },
    // Copper Den: sun rays fanning out from centre court, a lion's-mane badge.
    sunburst: {
      floor: function (ctx, st) {
        alpha(ctx, 0.2, function () {
          for (var i = 0; i < 32; i += 2) {
            var a0 = i / 32 * Math.PI * 2, a1 = (i + 1) / 32 * Math.PI * 2;
            poly(ctx, [[9, 4.5], [9 + Math.cos(a0) * 20, 4.5 + Math.sin(a0) * 20], [9 + Math.cos(a1) * 20, 4.5 + Math.sin(a1) * 20]], st.accent);
          }
        });
      },
      court: function (ctx, st, cx, cy) {
        alpha(ctx, 0.24, function () { poly(ctx, ring(cx, cy, 2.05, 36, 1.55), st.accent); });
        poly(ctx, ring(cx, cy, 1.2, 32), st.court);
        alpha(ctx, 0.3, function () { poly(ctx, ring(cx, cy, 0.8, 32), null, st.accent, 3); });
      }
    },
    // Frost Arena: cracked-ice facets around the court, a snowflake on it.
    frost: {
      floor: function (ctx) {
        var n = 0;
        for (var x = -12; x < 21.6; x += 1.7) {
          for (var y = -3.6; y < 12.7; y += 1.7) {
            var j = function (dx, dy) { n++; return [x + dx + (hash(n) - 0.5) * 0.9, y + dy + (hash(n + 500) - 0.5) * 0.9]; };
            var a = j(0, 0), b = j(1.7, 0), c = j(1.7, 1.7), d = j(0, 1.7);
            alpha(ctx, 0.05 + hash(n * 3) * 0.22, function () { poly(ctx, [a, b, c], '#ffffff'); });
            alpha(ctx, 0.04 + hash(n * 7) * 0.16, function () { poly(ctx, [a, c, d], '#0d3a5c'); });
          }
        }
      },
      court: function (ctx, st, cx, cy) {
        alpha(ctx, 0.4, function () {
          for (var i = 0; i < 6; i++) {
            var a = i / 6 * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
            line(ctx, [cx, cy], [cx + ca * 2, cy + sa * 2], '#ffffff', 3);
            [0.8, 1.35].forEach(function (d) {
              [-1, 1].forEach(function (s) {
                var b = a + s * 0.7;
                line(ctx, [cx + ca * d, cy + sa * d], [cx + ca * d + Math.cos(b) * 0.55, cy + sa * d + Math.sin(b) * 0.55], '#ffffff', 2.2);
              });
            });
          }
        });
      }
    },
    // Sunset Beach: sunset-coloured stripes on the sand, a setting sun badge.
    sunset: {
      floor: function (ctx) {
        var cols = ['#ff7a59', '#ffb347', '#ffd56b', '#ff5f7e'];
        alpha(ctx, 0.32, function () {
          for (var i = 0, x = -12; x < 22; x += 1.6, i++) poly(ctx, [[x, -3.6], [x + 0.8, -3.6], [x + 6.8, 12.7], [x + 6, 12.7]], cols[i % 4]);
        });
      },
      court: function (ctx, st, cx, cy) {
        alpha(ctx, 0.3, function () {
          for (var i = 0; i < 14; i++) {
            var a = i / 14 * Math.PI * 2, b = a + 0.12;
            poly(ctx, [[cx + Math.cos(a) * 1.35, cy + Math.sin(a) * 1.35], [cx + Math.cos(a + 0.11) * 2.1, cy + Math.sin(a + 0.11) * 2.1], [cx + Math.cos(b + 0.11) * 1.35, cy + Math.sin(b + 0.11) * 1.35]], st.accent);
          }
        });
        alpha(ctx, 0.4, function () { poly(ctx, ring(cx, cy, 1.05, 32), st.accent); });
      }
    },
    // Moonlight Hall: a starry floor and a crescent moon.
    stars: {
      floor: function (ctx, st) {
        for (var i = 0; i < 170; i++) {
          var x = -12 + hash(i + 7) * 33.6, y = -3.5 + hash(i + 311) * 16.1, s = 0.08 + hash(i + 97) * 0.22;
          alpha(ctx, 0.35 + hash(i + 13) * 0.6, function () { poly(ctx, ring(x, y, s, 8, s * 0.3), st.accent); });
        }
      },
      court: function (ctx, st, cx, cy) {
        alpha(ctx, 0.28, function () { poly(ctx, ring(cx, cy, 1.8, 40), st.accent); });
        poly(ctx, ring(cx + 0.55, cy - 0.55, 1.55, 40), st.court);
        alpha(ctx, 0.35, function () { [[-1.6, 1.5], [1.4, -1.7], [-0.4, -2.1]].forEach(function (p) { poly(ctx, ring(cx + p[0], cy + p[1], 0.3, 8, 0.09), st.accent); }); });
      }
    },
    // Coral Reef: bubbles and coral by the sidelines, a shark fin on court.
    reef: {
      floor: function (ctx, st) {
        for (var i = 0; i < 26; i++) {
          var cx = -11 + hash(i + 40) * 32, cy = hash(i + 80) < 0.5 ? -3.2 + hash(i + 3) * 2.4 : 9.8 + hash(i + 3) * 2.4;
          alpha(ctx, 0.4, function () { poly(ctx, ring(cx, cy, 0.55 + hash(i) * 0.4, 14, 0.25), st.accent); });
        }
        for (var k = 0; k < 120; k++) {
          var x = -12 + hash(k + 900) * 33.6, y = -3.5 + hash(k + 1300) * 16.1;
          alpha(ctx, 0.45, function () { groundEllipse(ctx, x, y, 0.08 + hash(k + 50) * 0.3, null, '#c9fbff', 1.4); });
        }
      },
      court: function (ctx, st, cx, cy) {
        alpha(ctx, 0.2, function () {
          poly(ctx, em(cx, cy, [[-1.6, -0.6], [1.7, -0.6], [1.2, -0.2], [0.2, 0.4], [-0.4, 2], [-0.6, 0.6], [-1.1, -0.1]], 1), '#ffffff');
          var w = [];
          for (var u = -2; u <= 2.01; u += 0.25) w.push([u, -1.2 + 0.18 * Math.sin(u * 3.2)]);
          for (u = 2; u >= -2.01; u -= 0.25) w.push([u, -1.5 + 0.18 * Math.sin(u * 3.2)]);
          poly(ctx, em(cx, cy, w, 1), '#ffffff');
        });
      }
    },
    // Storm Hangar: lightning down the sidelines, hazard stripes at the ends.
    storm: {
      floor: function (ctx, st) {
        [-1.8, 10.8].forEach(function (y0) {
          var top = [], bot = [];
          for (var x = -11, i = 0; x <= 21; x += 1.6, i++) {
            var y = y0 + (i % 2 ? 0.55 : -0.55);
            top.push([x, y]); bot.unshift([x, y + 0.3]);
          }
          alpha(ctx, 0.6, function () { poly(ctx, top.concat(bot), st.accent); });
        });
        alpha(ctx, 0.45, function () {
          [[18.8, 21.6], [-3.4, -0.6]].forEach(function (r) {
            for (var y = -3.5; y < 12.6; y += 1.2) poly(ctx, [[r[0], y], [r[0], y + 0.6], [r[1], y + 1.4], [r[1], y + 0.8]], st.accent);
          });
        });
      },
      court: function (ctx, st, cx, cy) {
        alpha(ctx, 0.26, function () {
          poly(ctx, em(cx, cy, [[-0.3, 2.1], [0.9, 2.1], [0.2, 0.4], [1, 0.4], [-0.7, -2.2], [-0.1, -0.3], [-0.9, -0.3]], 1), st.accent);
        });
      }
    },
    // Jade Temple: tiger stripes clawing in from the edges, a temple diamond.
    stripes: {
      floor: function (ctx) {
        [[-3.6, 1], [12.7, -1]].forEach(function (e) {
          for (var i = 0, x = -11.5; x < 21.6; i++, x += 1.1 + hash(i + 70) * 0.7) {
            var len = 1.4 + hash(i + 30 + e[0]) * 1.6, y0 = e[0], s = e[1], bend = (hash(i + 11) - 0.5) * 0.8;
            alpha(ctx, 0.6, function () {
              poly(ctx, [[x, y0], [x + 0.75, y0], [x + 0.95 + bend, y0 + s * len * 0.55], [x + 0.55 + bend * 1.6, y0 + s * len], [x + 0.3 + bend, y0 + s * len * 0.55]], '#06140c');
            });
          }
        });
      },
      court: function (ctx, st, cx, cy) {
        alpha(ctx, 0.32, function () {
          [2.1, 1.45, 0.8].forEach(function (r) { poly(ctx, ring(cx, cy, r, 4), null, st.accent, 3); });
          poly(ctx, ring(cx, cy, 0.4, 4), st.accent);
        });
      }
    },
    // ---- Quick match courts ----
    // Neon Grid: a glowing grid on the floor, a neon triangle on court.
    grid: {
      floor: function (ctx, st) {
        ctx.save(); ctx.shadowColor = st.accent; ctx.shadowBlur = 6;
        alpha(ctx, 0.55, function () {
          for (var x = -12; x <= 21.6; x += 1.5) line(ctx, [x, -3.5], [x, 12.6], st.accent, 1.2);
          for (var y = -3.5; y <= 12.6; y += 1.5) line(ctx, [-12, y], [21.6, y], st.accent, 1.2);
        });
        ctx.restore();
      },
      court: function (ctx, st, cx, cy) {
        ctx.save(); ctx.shadowColor = st.line; ctx.shadowBlur = 10;
        alpha(ctx, 0.5, function () {
          poly(ctx, em(cx, cy, [[0, 1.9], [1.8, -1.2], [-1.8, -1.2]], 1), null, st.line, 3);
          poly(ctx, em(cx, cy, [[0, 1.1], [1.0, -0.6], [-1.0, -0.6]], 1), null, st.accent, 2);
        });
        ctx.restore();
      }
    },
    // Cherry Blossom: petals scattered round the court, a big flower on it.
    petals: {
      floor: function (ctx, st) {
        for (var i = 0; i < 110; i++) {
          var x = -12 + hash(i + 21) * 33.6, y = -3.5 + hash(i + 77) * 16.1, s = 0.12 + hash(i + 5) * 0.2, a = hash(i + 9) * 6.3;
          alpha(ctx, 0.5 + hash(i + 3) * 0.4, function () { poly(ctx, ring(x, y, s, 10, s * 0.45, a), hash(i + 1) < 0.6 ? st.accent : '#ffffff'); });
        }
      },
      court: function (ctx, st, cx, cy) {
        alpha(ctx, 0.3, function () {
          for (var k = 0; k < 5; k++) {
            var a = k / 5 * Math.PI * 2 - Math.PI / 2, px = cx + Math.cos(a) * 1.05, py = cy + Math.sin(a) * 1.05;
            poly(ctx, ring(px, py, 0.85, 20), '#ffffff');
          }
        });
        alpha(ctx, 0.45, function () { poly(ctx, ring(cx, cy, 0.45, 16), st.accent); });
      }
    },
    // Desert Dunes: rippled sand contours and a desert sun.
    dunes: {
      floor: function (ctx, st) {
        alpha(ctx, 0.45, function () {
          for (var k = 0; k < 14; k++) {
            var y0 = -3.4 + k * 1.2, pts = [];
            for (var x = -12; x <= 21.6; x += 0.6) pts.push([x, y0 + 0.35 * Math.sin(x * 0.45 + k * 0.9)]);
            ctx.beginPath();
            pts.forEach(function (p, i) { var q = proj(p[0], p[1], 0); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); });
            ctx.strokeStyle = st.accent; ctx.lineWidth = 2; ctx.stroke();
          }
        });
      },
      court: function (ctx, st, cx, cy) {
        alpha(ctx, 0.3, function () {
          poly(ctx, ring(cx + 0.5, cy, 1.1, 32), st.accent);
          for (var k = 0; k < 3; k++) {
            var w = [];
            for (var u = -2; u <= 2.01; u += 0.25) w.push([u, -0.6 - k * 0.55 + 0.2 * Math.sin(u * 2 + k)]);
            for (u = 2; u >= -2.01; u -= 0.25) w.push([u, -0.8 - k * 0.55 + 0.2 * Math.sin(u * 2 + k)]);
            poly(ctx, em(cx, cy, w, 1), st.accent);
          }
        });
      }
    },
    // Street Park: paint splats on the asphalt and a painted target.
    street: {
      floor: function (ctx) {
        var cols = ['#ff5a5f', '#ffd23f', '#3bf0a0', '#4d8bff', '#c77dff'];
        for (var i = 0; i < 34; i++) {
          var x = -11.5 + hash(i + 300) * 32.5, y = hash(i + 600) < 0.5 ? -3.2 + hash(i + 2) * 2.6 : 9.6 + hash(i + 2) * 2.6, r = 0.35 + hash(i + 8) * 0.5;
          alpha(ctx, 0.6, function () {
            poly(ctx, ring(x, y, r, 18, r * 0.62, hash(i) * 3), cols[i % 5]);
            poly(ctx, ring(x + r * 1.3, y + r * 0.4, r * 0.18, 10), cols[i % 5]);
          });
        }
        alpha(ctx, 0.5, function () {
          for (var x = -11; x < 21; x += 1.4) { line(ctx, [x, -1.7], [x + 0.7, -1.7], '#ffffff', 2); line(ctx, [x, 10.7], [x + 0.7, 10.7], '#ffffff', 2); }
        });
      },
      court: function (ctx, st, cx, cy) {
        var cols = ['#ffd23f', '#ff5a5f', '#ffffff'];
        [2, 1.35, 0.7].forEach(function (r, i) { alpha(ctx, 0.3, function () { poly(ctx, ring(cx, cy, r, 36), null, cols[i], 4); }); });
      }
    },
    // ---- Shop courts ----
    // Galaxy: stars and nebula clouds, a ringed planet.
    galaxy: {
      floor: function (ctx, st) {
        ['#7c5cff', '#ff4fd8', '#2fd3ff'].forEach(function (c, k) {
          for (var i = 0; i < 4; i++) {
            var x = -10 + hash(k * 10 + i + 40) * 30, y = hash(k * 10 + i + 90) < 0.5 ? -2 : 11;
            alpha(ctx, 0.14, function () { poly(ctx, ring(x, y, 2 + hash(i + k) * 1.5, 24), c); });
          }
        });
        for (var i = 0; i < 150; i++) {
          var x = -12 + hash(i + 501) * 33.6, y = -3.5 + hash(i + 811) * 16.1, s = 0.05 + hash(i + 31) * 0.16;
          alpha(ctx, 0.5 + hash(i + 17) * 0.5, function () { poly(ctx, ring(x, y, s, 8, s * 0.3), '#ffffff'); });
        }
      },
      court: function (ctx, st, cx, cy) {
        alpha(ctx, 0.3, function () { poly(ctx, ring(cx, cy, 1.1, 32), st.accent); });
        alpha(ctx, 0.45, function () {
          var pts = [];
          for (var i = 0; i < 40; i++) { var a = i / 40 * Math.PI * 2; pts.push([Math.cos(a) * 2.1, Math.sin(a) * 0.55]); }
          poly(ctx, em(cx, cy, pts.map(function (p) { var c = Math.cos(0.4), s = Math.sin(0.4); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; }), 1), null, st.line, 3);
        });
      }
    },
    // Lava Pit: glowing cracks in dark rock, a flame on court.
    lava: {
      floor: function (ctx, st) {
        ctx.save(); ctx.shadowColor = st.accent; ctx.shadowBlur = 8;
        for (var i = 0; i < 26; i++) {
          var x = -11 + hash(i + 70) * 31, y = hash(i + 140) < 0.5 ? -3.3 : 12.4, dir = y < 0 ? 1 : -1;
          ctx.beginPath();
          var q = proj(x, y, 0); ctx.moveTo(q.x, q.y);
          for (var k = 1; k < 6; k++) {
            x += (hash(i * 7 + k) - 0.5) * 1.4; y += dir * (0.4 + hash(i * 11 + k) * 0.4);
            q = proj(x, y, 0); ctx.lineTo(q.x, q.y);
          }
          ctx.strokeStyle = hash(i) < 0.5 ? st.accent : st.line; ctx.lineWidth = 2.4; ctx.stroke();
        }
        ctx.restore();
      },
      court: function (ctx, st, cx, cy) {
        alpha(ctx, 0.35, function () {
          poly(ctx, em(cx, cy, [[0, 2.1], [0.7, 0.7], [1.2, 1.1], [1.3, -0.4], [0.8, -1.4], [0, -1.7], [-0.8, -1.4], [-1.3, -0.4], [-1.0, 0.9], [-0.5, 0.4]], 1), st.accent);
          poly(ctx, em(cx, cy, [[0, 0.7], [0.5, -0.3], [0.3, -1.1], [0, -1.25], [-0.3, -1.1], [-0.5, -0.3]], 1), st.line);
        });
      }
    },
    // Candy Land: candy stripes, sprinkles and a lollipop.
    candy: {
      floor: function (ctx, st) {
        alpha(ctx, 0.45, function () {
          for (var x = -12; x < 22; x += 1.2) poly(ctx, [[x, -3.6], [x + 0.6, -3.6], [x - 2.6, 12.7], [x - 3.2, 12.7]], st.accent);
        });
        var cols = ['#ffd23f', '#3bd6ff', '#7dff6b', '#ffffff', '#b46bff'];
        for (var i = 0; i < 140; i++) {
          var x = -12 + hash(i + 401) * 33.6, y = -3.5 + hash(i + 733) * 16.1, a = hash(i + 61) * 3.1;
          line(ctx, [x, y], [x + Math.cos(a) * 0.3, y + Math.sin(a) * 0.3], cols[i % 5], 3);
        }
      },
      court: function (ctx, st, cx, cy) {
        alpha(ctx, 0.4, function () {
          poly(ctx, ring(cx, cy, 1.9, 40), '#ffffff');
          var pts = [];
          for (var t = 0; t < 4 * Math.PI; t += 0.15) pts.push([cx + Math.cos(t) * t * 0.14, cy + Math.sin(t) * t * 0.14]);
          ctx.beginPath();
          pts.forEach(function (p, i) { var q = proj(p[0], p[1], 0); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); });
          ctx.strokeStyle = st.accent; ctx.lineWidth = 6; ctx.stroke();
        });
      }
    },
    // Retro Arcade: falling-block pixels and a pixel invader.
    pixels: {
      floor: function (ctx) {
        var cols = ['#ff4d6d', '#ffd23f', '#3bf0a0', '#4d8bff', '#c77dff', '#ff9e3b'];
        for (var i = 0; i < 160; i++) {
          var x = -12 + Math.floor(hash(i + 900) * 56) * 0.6, y = -3.6 + Math.floor(hash(i + 1700) * 27) * 0.6;
          alpha(ctx, 0.55, function () { poly(ctx, [[x, y], [x + 0.55, y], [x + 0.55, y + 0.55], [x, y + 0.55]], cols[i % 6]); });
        }
      },
      court: function (ctx, st, cx, cy) {
        var art = ['..X.....X..', '...X...X...', '..XXXXXXX..', '.XX.XXX.XX.', 'XXXXXXXXXXX', 'X.XXXXXXX.X', 'X.X.....X.X', '...XX.XX...'], px = 0.36;
        alpha(ctx, 0.4, function () {
          art.forEach(function (row, r) {
            for (var c = 0; c < row.length; c++) if (row[c] === 'X') {
              var u = (c - 5) * px, v = (3.5 - r) * px;
              poly(ctx, em(cx, cy, [[u, v], [u + px, v], [u + px, v - px], [u, v - px]], 1), st.line);
            }
          });
        });
      }
    },
    // Champions Court: a gold checkerboard, a gold frame and a star.
    gold: {
      floor: function (ctx, st) {
        alpha(ctx, 0.1, function () {
          for (var x = -12, i = 0; x < 21.6; x += 1.2, i++) {
            for (var y = -3.6, j = 0; y < 12.6; y += 1.2, j++) if ((i + j) % 2) poly(ctx, [[x, y], [x + 1.2, y], [x + 1.2, y + 1.2], [x, y + 1.2]], st.accent);
          }
        });
        alpha(ctx, 0.7, function () {
          poly(ctx, [[-0.9, -0.9], [18.9, -0.9], [18.9, 9.9], [-0.9, 9.9]], null, st.accent, 3);
          poly(ctx, [[-1.3, -1.3], [19.3, -1.3], [19.3, 10.3], [-1.3, 10.3]], null, st.accent, 1.5);
        });
      },
      court: function (ctx, st, cx, cy) {
        alpha(ctx, 0.25, function () { poly(ctx, ring(cx, cy, 2, 10, 0.8, Math.PI), st.accent); });
        alpha(ctx, 0.3, function () { poly(ctx, ring(cx, cy, 2.25, 40), null, st.accent, 2); });
      }
    }
  };

  function drawBoards(ctx, t, style) {
    // LED boards: far end shows scrolling text, sides show moving colour bands.
    var hgt = 0.9;
    path(ctx, [[20.8, -1.5, 0], [20.8, 10.5, 0], [20.8, 10.5, hgt], [20.8, -1.5, hgt]]);
    ctx.fillStyle = '#070b14'; ctx.fill();
    ctx.save(); ctx.clip();
    var c = proj(20.8, 4.5, hgt / 2), s = c.s;
    ctx.font = '900 ' + Math.round(0.62 * s) + 'px system-ui, sans-serif';
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    var msg = style && style.motif ? SR.upper(SR.t(style.name)) + '   ★   SPIKE RALLY   ★   ' : 'SPIKE RALLY   ★   PLAY HARD   ★   SIDE OUT   ★   ', tw = ctx.measureText(msg).width;
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

  function drawBackdrop(ctx, style) {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, style.wall); g.addColorStop(0.45, style.wall); g.addColorStop(1, '#000');
    ctx.fillStyle = g; ctx.fillRect(-80, 0, W + 160, H);
    // Ceiling lights
    for (var i = 0; i < Math.ceil(W / 144); i++) {
      var lx = 120 + i * 144, lg = ctx.createRadialGradient(lx, 6, 0, lx, 6, 70);
      lg.addColorStop(0, 'rgba(255,255,235,0.35)'); lg.addColorStop(1, 'rgba(255,255,235,0)');
      ctx.fillStyle = lg; ctx.fillRect(lx - 70, 0, 140, 80);
    }
  }

  // bg: the wall and lights already drawn (a big gradient fill is slow to redo).
  // floor: the court and its floor art already drawn on a see-through layer.
  function drawArena(ctx, style, t, cheer, bg, floor) {
    if (bg) blit(ctx, bg);
    else drawBackdrop(ctx, style);
    drawStands(ctx, style, t, cheer);
    if (floor) blit(ctx, floor);
    else drawFloor(ctx, style);
  }

  function blit(ctx, cv) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(cv, 0, 0); ctx.restore(); }

  // The floor, court, venue art and lines. None of it moves, and some venue
  // art (glowing grids, star fields) is slow to draw, so it is drawn once.
  function drawFloor(ctx, style) {
    poly(ctx, [[-12, -3.5], [21.6, -3.5], [21.6, 12.6], [-12, 12.6]], style.floor);
    var motif = MOTIFS[style.motif];
    if (motif) { clipFreeZone(ctx); motif.floor(ctx, style); ctx.restore(); }
    poly(ctx, [[0, 0], [18, 0], [18, 9], [0, 9]], style.court);
    poly(ctx, [[6, 0], [12, 0], [12, 9], [6, 9]], style.zone);
    if (motif) EMBLEMS.forEach(function (e) { motif.court(ctx, style, e[0], e[1]); });
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

  // The arena is drawn into an offscreen canvas and copied each frame. A
  // cheering crowd refreshes that copy about 20 times a second instead of the
  // whole arena being redrawn every frame (the old cause of lag after points).
  // The wall and the floor have layers of their own, so a refresh only
  // redraws the crowd.
  var cache = { cv: null, bg: null, floor: null, key: '', at: 0, calm: true };
  function layer(cv, w, h, sc, PAD) {
    cv = cv || document.createElement('canvas');
    cv.width = w; cv.height = h;
    var c = cv.getContext('2d');
    c.setTransform(sc, 0, 0, sc, PAD * sc, 0);
    return cv;
  }
  function arenaLayer(ctx, style, t, cheer, zoomed) {
    if (typeof document === 'undefined') { drawArena(ctx, style, t, cheer); return; }
    if (SR.lowFx) cheer = 0;
    var sc = SR.render.scale, key = style.id + '|' + sc + '|' + W + 'x' + H, PAD = 70;
    var redraw = cache.key !== key || (cheer > 0 ? t - cache.at > 0.05 : !cache.calm);
    if (redraw) {
      if (cache.key !== key) {
        var cw = Math.max(1, Math.ceil((W + PAD * 2) * sc)), ch = Math.max(1, Math.ceil(H * sc));
        cache.cv = layer(cache.cv, cw, ch, sc, PAD);
        cache.bg = layer(cache.bg, cw, ch, sc, PAD);
        drawBackdrop(cache.bg.getContext('2d'), style);
        cache.floor = layer(cache.floor, cw, ch, sc, PAD);
        drawFloor(cache.floor.getContext('2d'), style);
      }
      var c2 = cache.cv.getContext('2d');
      c2.setTransform(sc, 0, 0, sc, PAD * sc, 0);
      drawArena(c2, style, t, cheer, cache.bg, cache.floor);
      cache.key = key; cache.at = t; cache.calm = !(cheer > 0);
    }
    if (zoomed) { ctx.drawImage(cache.cv, -PAD, 0, W + PAD * 2, H); return; }
    // Copy on whole device pixels with no scaling: a straight, cheap blit
    // instead of a filtered resample of the biggest image on screen.
    var m = ctx.getTransform();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cache.cv, Math.round(m.e - PAD * sc), Math.round(m.f));
    ctx.restore();
  }

  function drawNet(ctx) {
    var top = C.NET_H, bot = C.NET_H - 1;
    line(ctx, [9, -0.7, 0], [9, -0.7, top + 0.1], '#dfe5ee', 6);
    line(ctx, [9, 9.7, 0], [9, 9.7, top + 0.1], '#dfe5ee', 6);
    poly(ctx, [[9, -0.7, 0], [9, -0.7, 0.9], [9, -0.5, 0.9], [9, -0.5, 0]], '#e5484d');
    poly(ctx, [[9, 9.5, 0], [9, 9.5, 0.9], [9, 9.7, 0.9], [9, 9.7, 0]], '#e5484d');
    poly(ctx, [[9, -0.5, bot], [9, 9.5, bot], [9, 9.5, top], [9, -0.5, top]], 'rgba(15,15,20,0.32)');
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    for (var y = -0.5; y <= 9.5; y += 0.2) { var a0 = proj(9, y, bot), a1 = proj(9, y, top); ctx.moveTo(a0.x, a0.y); ctx.lineTo(a1.x, a1.y); }
    for (var z = bot; z <= top; z += 0.15) { var b0 = proj(9, -0.5, z), b1 = proj(9, 9.5, z); ctx.moveTo(b0.x, b0.y); ctx.lineTo(b1.x, b1.y); }
    ctx.strokeStyle = '#0b0b0b'; ctx.lineWidth = 1; ctx.stroke();
    ctx.globalAlpha = 1;
    line(ctx, [9, -0.5, top], [9, 9.5, top], '#ffffff', 5);
    line(ctx, [9, -0.5, bot], [9, 9.5, bot], '#f4f4f4', 2);
    [0, 9].forEach(function (y) {
      for (var k = 0; k < 8; k++) line(ctx, [9, y, top - 0.1 + k * 0.1], [9, y, top + k * 0.1], k % 2 ? '#fff' : '#e5484d', 3);
    });
  }

  // ---- ball and effects ----------------------------------------------------

  // Tapered streak behind the ball; hard hits burn orange and glow.
  function drawTrail(ctx, style) {
    if (trail.length < 2) return;
    ctx.lineCap = 'round';
    for (var i = 1; i < trail.length; i++) {
      var a = trail[i - 1], tp = trail[i], q0 = proj(a.x, a.y, a.z), q1 = proj(tp.x, tp.y, tp.z), k = i / trail.length;
      var fast = tp.v > 16, sp = Math.min(1, tp.v / 14);
      if (sp < 0.15) continue;
      ctx.globalAlpha = k * (fast ? 0.7 : 0.4) * sp;
      ctx.strokeStyle = fast ? (k > 0.7 ? '#fff1b8' : '#ff9a3c') : style.main;
      ctx.lineWidth = Math.max(1.5, 0.21 * q1.s * 2) * (0.15 + k * 0.85) * (fast ? 1 : 0.7);
      if (fast && k > 0.5 && !SR.lowFx) { ctx.shadowColor = '#ff8a2b'; ctx.shadowBlur = 12; }
      ctx.beginPath(); ctx.moveTo(q0.x, q0.y); ctx.lineTo(q1.x, q1.y); ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  var squashAt = -9, lastVel = null;
  var frameAvg = 0.016, slowFor = 0;

  function drawBall(ctx, b, style) {
    var hgt = b.z, nowS = performance.now() / 1000;
    groundEllipse(ctx, b.x, b.y, 0.15 + Math.min(0.25, hgt * 0.03), 'rgba(0,0,0,' + Math.max(0.1, 0.42 - hgt * 0.05) + ')');
    var q = proj(b.x, b.y, b.z), rad = Math.max(3, 0.21 * q.s);
    // A quick squash when the ball is struck, then it springs back round.
    var sq = Math.max(0, 1 - (nowS - squashAt) / 0.12), sx = 1 + 0.28 * sq, sy = 1 - 0.22 * sq;
    ctx.save();
    ctx.translate(q.x, q.y); ctx.scale(sx, sy);
    ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fillStyle = style.main; ctx.fill();
    ctx.clip();
    ctx.rotate(spin);
    ctx.strokeStyle = style.stripe; ctx.lineWidth = rad * 0.42;
    ctx.beginPath(); ctx.arc(-rad * 0.95, 0, rad * 1.1, -0.9, 0.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(rad * 0.95, 0, rad * 1.1, Math.PI - 0.9, Math.PI + 0.9); ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(q.x, q.y); ctx.scale(sx, sy);
    var hl = ctx.createRadialGradient(-rad * 0.4, -rad * 0.45, 0, 0, 0, rad);
    hl.addColorStop(0, 'rgba(255,255,255,0.55)'); hl.addColorStop(0.5, 'rgba(255,255,255,0)'); hl.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.PI * 2); ctx.fillStyle = hl; ctx.fill();
    ctx.restore();
  }

  function drawFx(ctx, pass) {
    var fx = SR.fx;
    if (pass === 'ground') {
      fx.marks.forEach(function (mk) {
        var a = 1 - Math.max(0, (mk.life - mk.max + 0.8) / 0.8), grow = Math.min(1, mk.life / 0.08);
        ctx.globalAlpha = 0.55 * a;
        groundEllipse(ctx, mk.x, mk.y, 0.2 * mk.size * grow, 'rgba(70,40,20,0.9)');
        groundEllipse(ctx, mk.x, mk.y, 0.3 * mk.size * grow, null, 'rgba(255,255,255,0.7)', 1.5);
        ctx.globalAlpha = 1;
        if (mk.call && mk.life > 0.15) {
          var q = proj(mk.x, mk.y, 0), pop = Math.min(1, (mk.life - 0.15) / 0.12), out = mk.call === 'OUT';
          ctx.globalAlpha = a;
          ctx.font = '900 ' + Math.round(Math.max(11, 0.5 * q.s) * (0.6 + 0.4 * pop)) + 'px system-ui, sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText(SR.t(mk.call), q.x, q.y - 0.6 * q.s);
          ctx.fillStyle = out ? '#ff5a4d' : '#5dff9b'; ctx.fillText(SR.t(mk.call), q.x, q.y - 0.6 * q.s);
          ctx.globalAlpha = 1;
        }
      });
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

  // Scoreboard scale: bigger on small screens, never wider than the canvas.
  function sbScale() { return Math.min(UI, (W - 20) / 500); }

  function drawScoreboard(ctx, game) {
    var k = sbScale();
    ctx.save(); ctx.translate(W / 2, 0); ctx.scale(k, k); ctx.translate(-W / 2, 0);
    drawScoreboardInner(ctx, game);
    ctx.restore();
  }

  function drawScoreboardInner(ctx, game) {
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
      ctx.fillText(SR.t('rot {n}', { n: m.rot[t] + 1 }), cx + sign * (w / 2 - 26), y0 + 39);
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
    ctx.fillText(SR.t('SET {n}', { n: m.setNo }), cx, y0 + 19);
    ctx.font = '600 10px system-ui, sans-serif';
    ctx.fillText(SR.t('TO {n}', { n: m.target() }), cx, y0 + 35);
  }

  // Instruction pill under the scoreboard; wraps onto extra lines on narrow screens.
  function hint(ctx, text) {
    var fs = Math.round(15 * UI), lh = fs + 7, maxW = W - 28;
    ctx.font = '600 ' + fs + 'px system-ui, sans-serif';
    var words = text.split(' '), lines = [], cur = '';
    words.forEach(function (wd) {
      var t = cur ? cur + ' ' + wd : wd;
      if (cur && ctx.measureText(t).width > maxW - 32) { lines.push(cur); cur = wd; } else cur = t;
    });
    lines.push(cur);
    var w = 0;
    lines.forEach(function (l) { w = Math.max(w, ctx.measureText(l).width); });
    w += 32;
    var h = lines.length * lh + 12, y = 10 + 52 * sbScale() + 8;
    roundRect(ctx, W / 2 - w / 2, y, w, h, Math.min(17, h / 2));
    ctx.fillStyle = 'rgba(6,10,18,0.8)'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    lines.forEach(function (l, i) { ctx.fillText(l, W / 2, y + 6 + lh * (i + 0.5)); });
  }

  // A row of pill buttons along the bottom; returns their hit boxes.
  function buttonRow(ctx, items, active, kind) {
    var gap = 10, w = 104 * UI, h = 40 * UI;
    var perRow = Math.max(1, Math.min(items.length, Math.floor((W - 20 + gap) / (w + gap))));
    var rows = Math.ceil(items.length / perRow);
    perRow = Math.ceil(items.length / rows);
    w = Math.min(w * 1.3, (W - 20 - gap * (perRow - 1)) / perRow);
    // Portrait keeps the bottom-right corner free for the pause button.
    var bottom = portrait ? H - 74 : H - 22, out = [];
    items.forEach(function (it, i) {
      var row = Math.floor(i / perRow), col = i % perRow, inRow = Math.min(perRow, items.length - row * perRow);
      var x0 = W / 2 - (inRow * w + (inRow - 1) * gap) / 2, y0 = bottom - (rows - row) * h - (rows - row - 1) * gap;
      var x = x0 + col * (w + gap), on = it.id === active;
      roundRect(ctx, x, y0, w, h, 12);
      ctx.fillStyle = on ? '#ffd23f' : 'rgba(6,10,18,0.85)'; ctx.fill();
      ctx.strokeStyle = on ? '#ffd23f' : 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = on ? '#111' : 'rgba(255,255,255,0.55)'; ctx.font = '700 ' + Math.round(11 * UI) + 'px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      if (!SR.touch) ctx.fillText(String(i + 1), x + 10, y0 + h / 2);
      ctx.fillStyle = on ? '#111' : '#fff'; ctx.font = '700 ' + Math.round(15 * UI) + 'px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(it.label, x + w / 2 + (SR.touch ? 0 : 6), y0 + h / 2);
      out.push({ x: x, y: y0, w: w, h: h, id: it.id, kind: kind });
    });
    return out;
  }

  // Segmented capsule power meter: green at the bottom to red at the top.
  function drawPower(ctx, power) {
    var x = portrait ? 14 : 34, y0 = portrait ? CY + 30 : 300, w = 34, h = 250, n = 16, gap = 3, segH = (h - 16 - gap * (n - 1)) / n;
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
    ctx.fillText(SR.t('POWER'), x + w / 2, y0 - 12);
  }

  function drawBanner(ctx, b) {
    var k = b.t / b.dur, a = k < 0.1 ? k / 0.1 : k > 0.78 ? (1 - k) / 0.22 : 1;
    var sc = k < 0.12 ? 0.5 + (k / 0.12) * 0.65 : k < 0.2 ? 1.15 - ((k - 0.12) / 0.08) * 0.15 : 1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    ctx.translate(W / 2, CY - 85); ctx.scale(sc, sc); ctx.rotate(-0.04);
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
      // Slow motion: cinematic bars and a cool tint that slide and fade in
      // with the slowdown, so it eases in and out instead of popping.
      var sm = Math.min(1, (1 - rally.timeScale) / 0.2), bh = 7 * sm;
      ctx.fillStyle = 'rgba(0,0,0,' + (0.55 * sm).toFixed(3) + ')'; ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh);
      ctx.fillStyle = 'rgba(60,120,255,' + (0.07 * sm).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H);
    }
    if (SR.fx.flash > 0) { ctx.globalAlpha = SR.fx.flash * 1.6; ctx.fillStyle = SR.fx.flashColor; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  SR.render = {
    W: W, H: H,
    portrait: false,
    // Pick a logical canvas size that suits the screen: wide for landscape,
    // tall for portrait phones, with the camera re-framed to keep the court in view.
    setView: function (vw, vh) {
      var a = vw / Math.max(1, vh);
      if (a >= 1.1) {
        portrait = false; H = 640; W = Math.round(Math.max(880, Math.min(1280, 640 * a)));
        FOC = 1250; CY = 290; PAN = 9; UI = vh < 520 ? 1.4 : 1;
      } else {
        portrait = true; W = 540; H = Math.round(Math.max(720, Math.min(1170, 540 / a)));
        FOC = 1180; CY = 300 + (H - 700) * 0.55; PAN = 4; UI = 1.25;
      }
      this.W = W; this.H = H; this.portrait = portrait;
    },
    proj: proj,
    unproject: unproject,
    BLOCK_ZONES: BLOCK_ZONES,
    ballStyle: function () {
      var id = SR.save.data.equipped.ball;
      return SR.SHOP.balls.find(function (b) { return b.id === id; }) || SR.SHOP.balls[0];
    },
    // A league or tournament match is played at its venue's arena.
    courtStyle: function (game) {
      var venue = game && game.cfg.venue && SR.courtById(game.cfg.venue);
      if (venue) return venue;
      var id = SR.save.data.equipped.court;
      return SR.SHOP.courts.find(function (c) { return c.id === id; }) || SR.SHOP.courts[0];
    },
    // A still picture of a court (wall, crowd and floor) `w` pixels wide, for
    // the Career map. It has a canvas of its own and the wide camera, so the
    // match's arena cache and the current view are left as they were.
    courtThumb: function (style, w) {
      var keep = [W, H, FOC, CY], sc = w / 960, cv = document.createElement('canvas');
      W = 960; H = 640; FOC = 1250; CY = 290;
      cv.width = Math.max(1, Math.round(W * sc)); cv.height = Math.max(1, Math.round(H * sc));
      var c = cv.getContext('2d');
      c.setTransform(sc, 0, 0, sc, 0, 0);
      drawBackdrop(c, style);
      drawStands(c, style, 0, 0);
      drawFloor(c, style);
      W = keep[0]; H = keep[1]; FOC = keep[2]; CY = keep[3];
      return cv;
    },
    // Screen positions of player heads from the last frame, for click picking.
    heads: [],
    buttons: [],

    draw: function (ctx, game) {
      var now = performance.now() / 1000, dt = lastNow ? Math.min(0.05, now - lastNow) : 0;
      lastNow = now;
      // If the device can't keep up, switch to cheaper effects for the session.
      if (dt > 0) { frameAvg += (dt - frameAvg) * 0.05; slowFor = frameAvg > 0.027 ? slowFor + dt : 0; if (slowFor > 3) SR.lowFx = true; }
      var rally = game && game.rally, paused = game && game.paused;
      var simDt = paused ? 0 : dt * (rally ? rally.timeScale : 1) * (SR.speed || 1);
      SR.fx.update(Math.min(0.1, simDt));

      // The view pans gently toward the ball.
      if (rally) camFollow += (Math.max(-1, Math.min(10, rally.ball.y)) - camFollow) * Math.min(1, dt * 2);
      panX = (camFollow - 4.5) * PAN;

      ctx.setTransform(SR.render.scale, 0, 0, SR.render.scale, 0, 0);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      var sh = SR.fx.shake;
      ctx.translate(panX + (sh > 0 ? (Math.random() - 0.5) * sh : 0), sh > 0 ? (Math.random() - 0.5) * sh : 0);
      // Camera push-in on big hits, eased out.
      var pk = SR.fx.punch, zm = 1 + 0.045 * pk * pk * (3 - 2 * pk);
      var zoomed = zm > 1.0005;
      if (zoomed) { var zc = proj(9, 4.5, 1); ctx.translate(zc.x, zc.y); ctx.scale(zm, zm); ctx.translate(-zc.x, -zc.y); }
      var style = this.courtStyle(game);
      arenaLayer(ctx, style, now, SR.fx.cheer, zoomed);
      drawBoards(ctx, now, style);
      this.heads = [];
      this.buttons = [];
      if (!rally) { drawOverlay(ctx, null); return; }
      var m = game.match, ui = rally.ui;

      // Ball trail and spin
      var b = rally.ball;
      if (lastBall && rally.state === 'rally' && simDt > 0) {
        var dd = Math.sqrt(Math.pow(b.x - lastBall.x, 2) + Math.pow(b.y - lastBall.y, 2) + Math.pow(b.z - lastBall.z, 2));
        spin += dd * 3;
        var vel = { x: (b.x - lastBall.x) / simDt, y: (b.y - lastBall.y) / simDt, z: (b.z - lastBall.z) / simDt };
        if (lastVel) {
          // A sharp change of direction means someone just hit the ball.
          var l0 = Math.hypot(lastVel.x, lastVel.y, lastVel.z), l1 = Math.hypot(vel.x, vel.y, vel.z);
          if (l0 > 2 && l1 > 2 && (lastVel.x * vel.x + lastVel.y * vel.y + lastVel.z * vel.z) / (l0 * l1) < 0.3) { squashAt = now; trail.length = 0; }
        }
        lastVel = vel;
        trail.push({ x: b.x, y: b.y, z: b.z, v: dd / simDt });
        if (trail.length > 16) trail.shift();
      } else if (rally.state !== 'rally') { trail.length = 0; lastVel = null; }
      lastBall = { x: b.x, y: b.y, z: b.z };

      // Ground markers under everything else
      drawFx(ctx, 'ground');
      if (ui.prompt === 'block') drawBlockZones(ctx, ui.blockCall === 'read' ? null : ui.blockCall, now);
      if (ui.prompt === 'serve') reticle(ctx, ui.aim.x, ui.aim.y, '#ff4d3d', SR.t('SERVE'), now);
      var shotName = SR.upper(SR.t(SR.SHOTS[ui.tip ? 'tip' : ui.shot].label));
      if (ui.attackTarget && rally.state === 'rally') reticle(ctx, ui.attackTarget.x, ui.attackTarget.y, ui.tip || ui.shot === 'tip' ? '#36c5ff' : '#ff4d3d', shotName, now);
      if (ui.prompt === 'target' && game.hover && !ui.attackTarget && !SR.SHOTS[ui.shot].auto) reticle(ctx, game.hover.x, game.hover.y, game.shift ? '#36c5ff' : '#ff4d3d', null, now);

      if (SR.sprites.shadows) SR.sprites.shadows(ctx, rally.all(), rally, proj);
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
      if (ui.prompt === 'serve') { drawPower(ctx, ui.power); hint(ctx, SR.t(SR.touch ? 'Tap their court to aim and serve' : 'Aim on their court, click or tap to serve (Space)')); }
      else if (ui.prompt === 'hitter') hint(ctx, ui.hitterChoice ? SR.t('Hitter chosen') : SR.touch ? SR.t('Tap a numbered player to set them') : SR.t('Pick your hitter: click a player or press 1-{n}', { n: ui.hitters.length }));
      else if (ui.prompt === 'target') {
        hint(ctx, ui.attackTarget ? SR.t('{shot} locked in', { shot: shotName }) : SR.t(SR.touch ? 'Pick a shot, then tap where it goes. Line, Cross and Tool aim themselves' : 'Pick a shot (1-6), then click where it goes. Line, Cross and Tool aim themselves'));
        this.buttons = buttonRow(ctx, SR.SHOT_ORDER.map(function (id) { return { id: id, label: SR.t(SR.SHOTS[id].label) }; }), ui.tip ? 'tip' : ui.shot, 'shot');
      } else if (ui.prompt === 'block') {
        hint(ctx, SR.t(SR.touch ? 'Call the block: commit to a side, or Read the set' : 'Call the block (1-4 or tap a B zone): commit to a side, or Read the set'));
        this.buttons = buttonRow(ctx, [{ id: 'left', label: SR.t('Left') }, { id: 'middle', label: SR.t('Middle') }, { id: 'right', label: SR.t('Right') }, { id: 'read', label: SR.t('Read') }], ui.blockCall, 'block');
      }
      if (rally.banner) drawBanner(ctx, rally.banner);
      // The How to play demo's pointer, drawn over everything.
      if (game.cfg.demo && SR.demo) SR.demo.draw(ctx, { proj: proj, panX: panX, W: W, H: H, buttons: this.buttons, heads: this.heads, portrait: portrait });
    },
    scale: 1
  };
})();
