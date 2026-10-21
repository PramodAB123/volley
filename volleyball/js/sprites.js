// Jointed player figures. Each frame a pose is built in the player's local
// frame (f = toward the net, s = their left, z = up), joints are placed with
// two-bone IK for knees and elbows, then projected through the camera.
(function () {
  var SKIN = ['#f1c7a3', '#d9a37e', '#b97a55', '#8d5a3b', '#6a4329', '#e8b48f'];
  var HAIR = ['#2a1d14', '#4a2f1d', '#151515', '#6b4423', '#1a1a1a', '#8a5a2b'];
  var THIGH = 0.48, SHIN = 0.47, UPPER = 0.3, FORE = 0.28;

  function v(f, s, z) { return { f: f, s: s, z: z }; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }

  // Joint between a and b for a two-bone limb, bent toward dir.
  function ik(a, b, l1, l2, dir) {
    var df = b.f - a.f, ds = b.s - a.s, dz = b.z - a.z, d = Math.sqrt(df * df + ds * ds + dz * dz) || 1e-4;
    var reach = l1 + l2;
    if (d > reach * 0.999) { var k = reach * 0.999 / d; b = v(a.f + df * k, a.s + ds * k, a.z + dz * k); d = reach * 0.999; df *= k; ds *= k; dz *= k; }
    var x = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
    var ux = df / d, uy = ds / d, uz = dz / d;
    // Remove the part of dir along the limb, then normalise.
    var dp = dir.f * ux + dir.s * uy + dir.z * uz, pf = dir.f - dp * ux, ps = dir.s - dp * uy, pz = dir.z - dp * uz;
    var pl = Math.sqrt(pf * pf + ps * ps + pz * pz) || 1;
    return { joint: v(a.f + ux * x + pf / pl * h, a.s + uy * x + ps / pl * h, a.z + uz * x + pz / pl * h), end: b };
  }

  function lerp(a, b, k) { return a + (b - a) * k; }
  function lv(a, b, k) { return v(lerp(a.f, b.f, k), lerp(a.s, b.s, k), lerp(a.z, b.z, k)); }
  function ease(k) { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); }

  // Interpolate a list of keyframes [{t, ...vectors/numbers}] at time x.
  function keys(list, x) {
    var i = 0;
    while (i < list.length - 2 && x > list[i + 1].t) i++;
    var A = list[i], B = list[i + 1], k = ease((x - A.t) / (B.t - A.t)), out = {};
    Object.keys(A).forEach(function (n) {
      if (n === 't') return;
      out[n] = typeof A[n] === 'number' ? lerp(A[n], B[n], k) : lv(A[n], B[n], k);
    });
    return out;
  }

  // World point -> this player's local frame.
  function toLocal(p, w) {
    var dx = w.x - p.x, dy = w.y - p.y, c = Math.cos(p.yaw), sn = Math.sin(p.yaw);
    return v(dx * c + dy * sn, -dx * sn + dy * c, w.z - p.z);
  }

  // Where the forearm platform should meet the ball, kept within arm's reach.
  function platform(p, lo) {
    var c = p.contactPt ? toLocal(p, p.contactPt) : v(0.55, 0, 0.85);
    return v(clamp(c.f, 0.32, 0.72), clamp(c.s, -0.42, 0.42), clamp(c.z, lo, 1.15));
  }

  // Build the pose: returns local joint positions.
  function pose(p, rally) {
    var t = rally.t, inAir = p.z > 0.05;
    var hipZ = 0.88, lean = 0.04, side = 0.12, twist = 0, headF = 0, plat = null, platK = 0;
    var footL = v(0.05, 0.24, 0), footR = v(-0.02, -0.24, 0);
    var handL = v(0.32, 0.2, 1.0), handR = v(0.32, -0.2, 1.0);
    var elbowDir = v(-0.2, 1, -1), kneeDir = v(1, 0, 0.1);
    var act = p.act && t >= p.act.t && t - p.act.t < p.act.dur ? p.act : null;
    var a = act ? (t - act.t) / act.dur : 0;
    var jt = clamp((t - p.jumpAt) / 0.75, 0, 1);
    var speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    var cy = Math.cos(p.yaw), sy = Math.sin(p.yaw);
    var toContact = p.contactAt ? p.contactAt - t : 99;
    var sinceLand = t - p.jumpAt - 0.75;
    var defending = rally.state === 'serve' ? (rally.server && rally.server.team !== p.team) : rally.lastTouch !== p.team;
    var K;

    if (act && act.type === 'dive') {
      // Lunge with arms out, slide on the floor, then push back up.
      var reach = platform(p, 0.25);
      K = keys([
        { t: 0, hip: 0.5, lean: 0.48, fL: v(-0.45, 0.28, 0), fR: v(-0.3, -0.24, 0), h: reach },
        { t: 0.3, hip: 0.32, lean: 0.53, fL: v(-0.7, 0.26, 0.05), fR: v(-0.62, -0.2, 0.08), h: v(1.0, 0, 0.3) },
        { t: 0.7, hip: 0.35, lean: 0.4, fL: v(-0.5, 0.3, 0), fR: v(-0.4, -0.26, 0), h: v(0.7, 0, 0.18) },
        { t: 1, hip: 0.72, lean: 0.2, fL: v(0.05, 0.26, 0), fR: v(-0.05, -0.26, 0), h: v(0.4, 0, 0.8) }
      ], a);
      hipZ = K.hip; lean = K.lean; footL = K.fL; footR = K.fR;
      handL = v(K.h.f, K.h.s + 0.05, K.h.z); handR = v(K.h.f, K.h.s - 0.05, K.h.z);
      elbowDir = v(0, 1, -0.3);
    } else if (act && act.type === 'pass') {
      // Forearms meet the ball, legs extend to lift it, arms hold the angle, then relax.
      var cpt = platform(p, 0.5), lift = ease(a / 0.35), relax = ease((a - 0.55) / 0.45);
      hipZ = lerp(0.66 - Math.max(0, 0.85 - cpt.z) * 0.4, 0.84, lift); lean = lerp(0.28, 0.14, lift);
      footL = v(0.16, 0.32, 0); footR = v(-0.1, -0.32, 0);
      plat = v(cpt.f + lift * 0.1, cpt.s * (1 - lift * 0.5), cpt.z + lift * 0.3); platK = 1 - relax;
      handL = v(0.32, 0.2, 1.0); handR = v(0.32, -0.2, 1.0);
      elbowDir = v(0, 1, -0.2);
      twist = -cpt.s * 0.35 * (1 - relax);
    } else if (inAir && p.jumpKind === 'block') {
      // Arms shoot up, then press over the net at the top of the jump.
      var press = Math.sin(Math.PI * jt);
      hipZ = 0.95; lean = 0.04 + press * 0.06;
      footL = v(0.02, 0.17, 0.06 + press * 0.08); footR = v(0.02, -0.17, 0.06 + press * 0.08);
      var up = ease(jt / 0.25);
      handL = v(0.15 + press * 0.16, 0.2 - up * 0.03, lerp(1.62, 2.38, up)); handR = v(0.15 + press * 0.16, -0.2 + up * 0.03, lerp(1.62, 2.38, up));
      elbowDir = v(-0.3, 1, 0);
    } else if (inAir && (p.jumpKind === 'spike' || p.jumpKind === 'serve')) {
      // Continuous arm swing: both arms up, bow back, strike high, follow through.
      var tc = p.jumpKind === 'serve' ? 0.27 : 0.56;
      K = keys([
        { t: 0, lean: 0.02, hR: v(0.3, -0.24, 1.9), hL: v(0.3, 0.24, 1.95), fL: v(0, 0.16, 0.04), fR: v(0, -0.16, 0.04), el: v(-0.5, -1, 0) },
        { t: Math.max(0.06, tc - 0.22), lean: -0.13, hR: v(-0.32, -0.3, 1.92), hL: v(0.36, 0.17, 2.18), fL: v(-0.2, 0.15, 0.28), fR: v(-0.3, -0.12, 0.36), el: v(-1, -0.4, 0.7) },
        { t: tc, lean: 0.06, hR: v(0.24, -0.12, 2.4), hL: v(0.16, 0.25, 1.36), fL: v(-0.12, 0.16, 0.2), fR: v(-0.16, -0.14, 0.22), el: v(-0.5, -1, 0) },
        { t: tc + 0.17, lean: 0.2, hR: v(0.46, 0.02, 1.14), hL: v(0.06, 0.27, 1.08), fL: v(0.02, 0.18, 0.1), fR: v(0, -0.18, 0.1), el: v(0, -1, -0.4) },
        { t: 1, lean: 0.12, hR: v(0.28, -0.24, 0.98), hL: v(0.28, 0.24, 0.98), fL: v(0.08, 0.2, 0), fR: v(0.06, -0.2, 0), el: v(-0.2, -1, -0.6) }
      ], jt);
      hipZ = 0.92; lean = K.lean; handR = K.hR; handL = K.hL; footL = K.fL; footR = K.fR; elbowDir = v(K.el.f, -K.el.s, K.el.z);
      twist = jt < tc ? -0.12 : 0.1;
      // Follow-through depends on the shot: a tip is a soft push with the arm
      // staying up, a roll shot a short brushing swing, a power shot the full arc.
      if (jt > tc && (p.shotKind === 'tip' || p.shotKind === 'roll')) {
        var fk = ease((jt - tc) / 0.25), soft = p.shotKind === 'tip';
        handR = lv(v(0.24, -0.12, 2.4), soft ? v(0.42, -0.08, 2.2) : v(0.5, -0.04, 1.72), fk);
        if (jt > tc + 0.3) handR = lv(handR, v(0.28, -0.24, 0.98), ease((jt - tc - 0.3) / 0.25));
        lean = lerp(0.06, soft ? 0.08 : 0.13, fk);
        twist = soft ? 0 : 0.05;
      }
    } else if ((act && act.type === 'set') || (rally.setter === p && p.lock)) {
      // Hands form a window above the forehead, then push up and out.
      var push = act ? Math.sin(Math.PI * clamp(a / 0.6, 0, 1)) : 0;
      hipZ = act ? 0.84 + push * 0.1 : 0.82; lean = -0.02;
      footL = v(0.1, 0.2, 0); footR = v(-0.08, -0.2, 0);
      handL = v(0.14 + push * 0.04, 0.12, 2.0 + push * 0.22); handR = v(0.14 + push * 0.04, -0.12, 2.0 + push * 0.22);
      elbowDir = v(0.2, 1, -0.2);
    } else if (toContact < 0.5 && toContact > -0.05) {
      // Reading the ball: drop into a staggered stance and bring the platform to it.
      var kk = ease(1 - toContact / 0.5);
      if (p.contactKind === 'dive') {
        var rd = platform(p, 0.3);
        hipZ = 0.8 - kk * 0.3; lean = 0.15 + kk * 0.33;
        footL = v(-0.3 * kk, 0.28, 0); footR = v(0.1 - 0.35 * kk, -0.22, 0);
        handL = lv(v(0.4, 0.14, 0.9), v(rd.f, rd.s + 0.05, rd.z), kk); handR = lv(v(0.4, -0.14, 0.9), v(rd.f, rd.s - 0.05, rd.z), kk);
        elbowDir = v(0, 1, -0.3);
      } else {
        var pp = platform(p, 0.5);
        hipZ = 0.82 - kk * (0.13 + Math.max(0, 0.85 - pp.z) * 0.4); lean = 0.1 + kk * 0.18;
        // Step toward the ball side with the near foot.
        var stepS = clamp(pp.s, -0.25, 0.25) * kk;
        footL = v(0.14, 0.32 + Math.max(0, stepS), 0); footR = v(-0.08, -0.32 + Math.min(0, stepS), 0);
        handL = v(0.36, 0.2, 0.95); handR = v(0.36, -0.2, 0.95); plat = pp; platK = kk;
        elbowDir = v(0, 1, -0.2);
        twist = -pp.s * 0.35 * kk;
      }
    } else if (sinceLand > 0 && sinceLand < 0.32 && (p.jumpKind === 'spike' || p.jumpKind === 'block' || p.jumpKind === 'serve')) {
      // Soft landing: knees absorb, then rise back to ready.
      var lk = Math.sin(Math.PI * clamp(sinceLand / 0.32, 0, 1) * 0.5 + Math.PI * 0.5);
      hipZ = 0.86 - lk * 0.24; lean = 0.08 + lk * 0.14;
      footL = v(0.08, 0.26, 0); footR = v(-0.06, -0.26, 0);
      handL = v(0.28, 0.32, 0.92 + lk * 0.12); handR = v(0.28, -0.32, 0.92 + lk * 0.12);
    } else if (act && act.type === 'sad') {
      var droop = ease(a / 0.3);
      hipZ = 0.9; lean = 0.03 + droop * 0.06; headF = droop * 0.05;
      handL = v(-0.02, 0.27, 0.98); handR = v(-0.02, -0.27, 0.98);
      elbowDir = v(-0.4, 1, 0.1);
    } else if (act && act.type === 'cheer') {
      var bob = Math.abs(Math.sin(a * Math.PI * 3));
      hipZ = 0.86 + bob * 0.1; lean = -0.03;
      handL = v(0.05 + bob * 0.05, 0.36, 2.0 + bob * 0.15); handR = v(0.05 + bob * 0.05, -0.36, 2.0 + bob * 0.15);
      elbowDir = v(0, 1, 0);
    } else if ((p.jumpKind === 'spike' || p.jumpKind === 'serve') && p.jumpAt > t && p.jumpAt - t < (p.jumpKind === 'serve' ? 0.6 : 0.42)) {
      // Approach: last two steps, arms swing back as the knees load, then drive up.
      var k = ease(1 - (p.jumpAt - t) / 0.42), back = Math.sin(Math.PI * k * 0.9);
      hipZ = 0.88 - k * 0.24; lean = 0.12 + k * 0.2;
      footL = v(0.22 * k, 0.2, 0); footR = v(-0.1 + 0.15 * k, -0.2, 0);
      handL = v(0.2 - 0.6 * back, 0.28, 0.95 - back * 0.05); handR = v(0.2 - 0.65 * back, -0.28, 0.95 - back * 0.05);
      elbowDir = v(-0.2, 1, -0.2);
      if (p.jumpKind === 'serve') {
        // Toss: the left arm lifts the ball high, then both arms swing for the jump.
        var tk = clamp(1 - (p.jumpAt - t) / 0.6, 0, 1), lift = Math.sin(Math.PI * clamp(tk / 0.55, 0, 1));
        handL = lv(handL, v(0.38, 0.08, 2.15), lift);
        if (tk < 0.45) { handR = v(-0.05, -0.3, 1.0); hipZ = 0.88; lean = 0.05; footL = v(0.15 * tk, 0.2, 0); footR = v(-0.05, -0.2, 0); }
      }
    } else if (rally.state === 'serve' && rally.server === p) {
      var toss = Math.abs(Math.sin(rally.stateT * 4));
      hipZ = 0.9;
      handL = v(0.35, 0.05, 1.12 + toss * 0.25); handR = v(-0.12, -0.28, 1.45);
      elbowDir = v(-0.5, -1, -0.2);
    } else if (speed > 0.6) {
      var phs = p.phase, sn = Math.sin(phs), cs = Math.cos(phs);
      var stride = Math.min(0.44, 0.085 * speed), run = clamp((speed - 0.6) / 3, 0, 1);
      // Legs swing along the running direction, expressed in the local frame.
      var mf = (p.vx * cy + p.vy * sy) / speed, ms = (-p.vx * sy + p.vy * cy) / speed;
      // Lifted foot swings through high with the heel tucked; planted foot pushes back.
      var liftL = Math.max(0, cs) * (0.1 + 0.12 * run), liftR = Math.max(0, -cs) * (0.1 + 0.12 * run);
      footL = v(mf * stride * sn - liftL * 0.3 * mf, 0.12 + ms * stride * sn, liftL);
      footR = v(-mf * stride * sn - liftR * 0.3 * mf, -0.12 - ms * stride * sn, liftR);
      hipZ = 0.92 - Math.abs(cs) * 0.035 * (0.5 + run); lean = 0.05 + mf * (0.06 + 0.08 * run);
      // Arms swing opposite to the legs with bent elbows; shoulders counter-rotate.
      var sw = 0.28 * sn * Math.max(0.3, Math.abs(mf));
      handL = v(0.16 - sw, 0.24, 1.05 + Math.max(0, -sn) * 0.08); handR = v(0.16 + sw, -0.24, 1.05 + Math.max(0, sn) * 0.08);
      elbowDir = v(-1, 0.4, -0.6);
      twist = -sn * 0.12 * mf;
      // Side shuffles stay low with arms ready instead of a full sprint.
      if (Math.abs(ms) > 0.7) {
        hipZ = 0.8 - Math.abs(sn) * 0.02; handL = v(0.32, 0.22, 0.98); handR = v(0.32, -0.22, 0.98); lean = 0.1; twist = 0;
        footL = v(0.04, 0.24 + ms * 0.12 * sn, Math.max(0, cs) * 0.06); footR = v(-0.02, -0.24 + ms * 0.12 * sn, Math.max(0, -cs) * 0.06);
      }
    } else {
      // Ready stance, lower and wider when the ball is coming our way.
      var sway = Math.sin(t * 2.2 + p.idx) * 0.015, low = defending && rally.state !== 'dead' ? 1 : 0;
      hipZ = 0.84 - low * 0.08 + sway; lean = 0.04 + low * 0.1;
      if (low) { footL = v(0.08, 0.3, 0); footR = v(-0.04, -0.3, 0); handL = v(0.36, 0.22, 0.92); handR = v(0.36, -0.22, 0.92); }
      // Weight shifts from foot to foot so nobody stands frozen.
      var shift = Math.sin(t * 1.6 + p.idx * 1.3) * 0.02;
      footL.z += Math.max(0, -shift) * 0.4; footR.z += Math.max(0, shift) * 0.4;
      if (rally.state === 'rally' && p.jumpKind === 'block') { handL = v(0.15, 0.24, 1.62); handR = v(0.15, -0.24, 1.62); elbowDir = v(-0.2, 1, -0.6); }
    }

    // Keep the torso a fixed length however far the player leans.
    lean = clamp(lean, -0.3, 0.53);
    var TORSO = 0.55, shZ = hipZ + Math.sqrt(TORSO * TORSO - lean * lean);
    var ct = Math.cos(twist), st = Math.sin(twist);
    var j = {};
    // Hips turn a little with the shoulders, the shoulders counter-rotate.
    j.hipL = v(-side * st * 0.5, side * ct, hipZ); j.hipR = v(side * st * 0.5, -side * ct, hipZ);
    j.shL = v(lean - 0.2 * st, 0.2 * ct, shZ); j.shR = v(lean + 0.2 * st, -0.2 * ct, shZ);
    // Forearm platform: both arms straight, hands together, pointing at the ball.
    if (plat && platK > 0) {
      var mc = v(lean, 0, shZ), df = plat.f - mc.f, ds = plat.s - mc.s, dz = plat.z - mc.z, dl = Math.sqrt(df * df + ds * ds + dz * dz) || 1;
      var arm = (UPPER + FORE) * 0.97, pk = ease(platK);
      var pt = v(mc.f + df / dl * arm, mc.s + ds / dl * arm, mc.z + dz / dl * arm);
      handL = lv(handL, v(pt.f, pt.s + 0.04, pt.z), pk); handR = lv(handR, v(pt.f, pt.s - 0.04, pt.z), pk);
      elbowDir = v(-0.2, 1, 0);
    }
    j.neck = v(lean * 1.05, 0, shZ + 0.07);
    j.head = v(lean * 1.12 + headF, 0, shZ + 0.23 - headF);
    var lL = ik(j.hipL, footL, THIGH, SHIN, v(kneeDir.f, 0.15, kneeDir.z)), lR = ik(j.hipR, footR, THIGH, SHIN, v(kneeDir.f, -0.15, kneeDir.z));
    j.kneeL = lL.joint; j.footL = lL.end; j.kneeR = lR.joint; j.footR = lR.end;
    var eL = ik(j.shL, handL, UPPER, FORE, elbowDir), eR = ik(j.shR, handR, UPPER, FORE, v(elbowDir.f, -elbowDir.s, elbowDir.z));
    j.elbowL = eL.joint; j.handL = eL.end; j.elbowR = eR.joint; j.handR = eR.end;
    j._w = (act && (act.type === 'pass' || act.type === 'dive' || act.type === 'set')) || toContact < 0.5 ? 28
      : inAir ? 34 : speed > 0.6 ? 42 : 14;
    return j;
  }

  function darken(hex, k) {
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return 'rgb(' + Math.round(r * k) + ',' + Math.round(g * k) + ',' + Math.round(b * k) + ')';
  }

  function seg(ctx, a, b, w, color) {
    ctx.strokeStyle = color; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  function along(a, b, k) { return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }; }

  SR.sprites = {
    draw: function (ctx, p, team, rally, proj, hl) {
      var j = pose(p, rally), S = {}, w = j._w;
      delete j._w;
      // Each joint follows its target on a critically damped spring, so poses
      // flow into each other with natural ease-in and ease-out.
      var dtp = rally.t - (p._jt || 0);
      if (!p._j || dtp < 0 || dtp > 0.5) {
        p._j = {}; p._jv = {};
        Object.keys(j).forEach(function (k) { p._j[k] = v(j[k].f, j[k].s, j[k].z); p._jv[k] = v(0, 0, 0); });
      } else if (dtp > 0) {
        var n = Math.ceil(dtp / (1 / 240)), h = dtp / n;
        Object.keys(j).forEach(function (k) {
          var x = p._j[k], vel = p._jv[k], g = j[k];
          if (!x) { p._j[k] = v(g.f, g.s, g.z); p._jv[k] = v(0, 0, 0); return; }
          for (var i = 0; i < n; i++) {
            vel.f += (w * w * (g.f - x.f) - 2 * w * vel.f) * h; x.f += vel.f * h;
            vel.s += (w * w * (g.s - x.s) - 2 * w * vel.s) * h; x.s += vel.s * h;
            vel.z += (w * w * (g.z - x.z) - 2 * w * vel.z) * h; x.z += vel.z * h;
          }
        });
      }
      p._jt = rally.t;
      // Limb lengths stay exact: re-solve knees and elbows from the smoothed ends.
      var J = p._j;
      j = {};
      Object.keys(J).forEach(function (k) { j[k] = v(J[k].f, J[k].s, J[k].z); });
      function resolve(root, mid, end, l1, l2, bias) {
        var hint = v(j[mid].f - (j[root].f + j[end].f) / 2 + bias.f * 0.05, j[mid].s - (j[root].s + j[end].s) / 2 + bias.s * 0.05, j[mid].z - (j[root].z + j[end].z) / 2 + bias.z * 0.05);
        var r = ik(j[root], j[end], l1, l2, hint);
        j[mid] = r.joint; j[end] = r.end;
      }
      resolve('hipL', 'kneeL', 'footL', THIGH, SHIN, v(1, 0.15, 0));
      resolve('hipR', 'kneeR', 'footR', THIGH, SHIN, v(1, -0.15, 0));
      resolve('shL', 'elbowL', 'handL', UPPER, FORE, v(0, 1, -1));
      resolve('shR', 'elbowR', 'handR', UPPER, FORE, v(0, -1, -1));
      var cy = Math.cos(p.yaw), sy = Math.sin(p.yaw);
      Object.keys(j).forEach(function (k) {
        var q = j[k];
        S[k] = proj(p.x + q.f * cy - q.s * sy, p.y + q.f * sy + q.s * cy, p.z + q.z);
      });
      var s = proj(p.x, p.y, p.z).s;
      var skin = SKIN[(p.idx * 2 + p.team) % SKIN.length], hair = HAIR[(p.idx + p.team * 3) % HAIR.length];
      var shorts = darken(team.color, 0.35), jersey = team.color, shade = darken(team.color, 0.78);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';

      // Shadow stretches with height so jumps read clearly.
      var gs = proj(p.x, p.y, 0), shR = Math.max(3, (0.34 + p.z * 0.1) * gs.s);
      ctx.fillStyle = 'rgba(0,0,0,' + Math.max(0.12, 0.32 - p.z * 0.12) + ')';
      ctx.beginPath(); ctx.ellipse(gs.x, gs.y, shR, shR * 0.38, 0, 0, Math.PI * 2); ctx.fill();
      if (hl) { ctx.strokeStyle = hl; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(gs.x, gs.y, shR * 1.6, shR * 0.62, 0, 0, Math.PI * 2); ctx.stroke(); }

      var wThigh = Math.max(2, 0.15 * s), wShin = Math.max(1.6, 0.115 * s), wUp = Math.max(1.5, 0.1 * s), wFore = Math.max(1.3, 0.085 * s);
      function leg(side) {
        var hip = S['hip' + side], knee = S['knee' + side], foot = S['foot' + side];
        seg(ctx, hip, knee, wThigh, skin);
        seg(ctx, knee, foot, wShin, skin);
        seg(ctx, along(knee, foot, 0.62), foot, wShin * 1.05, '#f2f2f2');        // sock
        seg(ctx, along(hip, knee, 0.82), along(knee, foot, 0.14), wThigh * 1.12, '#22262e'); // knee pad
        ctx.fillStyle = '#e9edf2';                                                     // shoe
        ctx.beginPath(); ctx.ellipse(foot.x, foot.y, wShin * 0.85, wShin * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      }
      function arm(side) {
        var sh = S['sh' + side], el = S['elbow' + side], hd = S['hand' + side];
        seg(ctx, sh, el, wUp, skin);
        seg(ctx, el, hd, wFore, skin);
        seg(ctx, sh, along(sh, el, 0.45), wUp * 1.35, shade); // sleeve
        ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(hd.x, hd.y, wFore * 0.7, 0, Math.PI * 2); ctx.fill();
      }
      // Far side first.
      var leftFar = S.shL.d > S.shR.d;
      var far = leftFar ? 'L' : 'R', near = leftFar ? 'R' : 'L';
      leg(far); leg(near);
      // Shorts
      ctx.fillStyle = shorts;
      ctx.beginPath();
      var hl1 = S.hipL, hr1 = S.hipR, tl = along(S.hipL, S.kneeL, 0.42), tr = along(S.hipR, S.kneeR, 0.42);
      ctx.moveTo(hl1.x, hl1.y); ctx.lineTo(hr1.x, hr1.y); ctx.lineTo(tr.x, tr.y); ctx.lineTo(tl.x, tl.y); ctx.closePath(); ctx.fill();
      seg(ctx, hl1, tl, wThigh * 1.2, shorts); seg(ctx, hr1, tr, wThigh * 1.2, shorts);
      // Arm hidden behind the torso
      var armBehind = S['sh' + far].d > S.neck.d + 0.02;
      if (armBehind) arm(far);
      // Torso
      ctx.fillStyle = jersey;
      ctx.beginPath();
      ctx.moveTo(S.shL.x, S.shL.y); ctx.lineTo(S.shR.x, S.shR.y);
      ctx.lineTo(S.hipR.x, S.hipR.y); ctx.lineTo(S.hipL.x, S.hipL.y); ctx.closePath(); ctx.fill();
      seg(ctx, S.shL, S.shR, wUp * 1.4, jersey);
      seg(ctx, along(S.shL, S.hipL, 0.1), S.hipL, wUp * 0.9, jersey);
      seg(ctx, along(S.shR, S.hipR, 0.1), S.hipR, wUp * 0.9, jersey);
      seg(ctx, S.hipL, S.hipR, wUp * 0.6, shade);
      // Jersey pattern, clipped to the torso.
      if (team.pattern && s > 9) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(S.shL.x, S.shL.y); ctx.lineTo(S.shR.x, S.shR.y); ctx.lineTo(S.hipR.x, S.hipR.y); ctx.lineTo(S.hipL.x, S.hipL.y); ctx.closePath();
        ctx.clip();
        ctx.globalAlpha = 0.55;
        var bw = Math.max(1.5, 0.06 * s), i2;
        if (team.pattern === 'stripes') {
          for (i2 = -3; i2 <= 3; i2 += 2) seg(ctx, along(S.shR, S.shL, 0.5 + i2 * 0.1), along(S.hipR, S.hipL, 0.5 + i2 * 0.1), bw, team.trim);
        } else if (team.pattern === 'hoops') {
          for (i2 = 1; i2 <= 3; i2++) seg(ctx, along(S.shL, S.hipL, i2 * 0.25), along(S.shR, S.hipR, i2 * 0.25), bw * 1.2, team.trim);
        } else {
          ctx.fillStyle = shade; ctx.globalAlpha = 0.8;
          ctx.beginPath(); var m1 = along(S.shL, S.shR, 0.5), m2 = along(S.hipL, S.hipR, 0.5);
          ctx.moveTo(m1.x, m1.y); ctx.lineTo(S.shR.x, S.shR.y); ctx.lineTo(S.hipR.x, S.hipR.y); ctx.lineTo(m2.x, m2.y); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
      if (s > 13) {
        ctx.fillStyle = team.trim; ctx.font = '800 ' + Math.round(0.22 * s) + 'px system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        var cx = (S.shL.x + S.shR.x + S.hipL.x + S.hipR.x) / 4, cy = (S.shL.y + S.shR.y + S.hipL.y + S.hipR.y) / 4;
        ctx.fillText(String(p.num), cx, cy);
      }
      // Neck and head; the near team shows the back of the head.
      seg(ctx, S.neck, along(S.neck, S.head, 0.5), wUp * 1.1, skin);
      var hr = Math.max(2.5, 0.115 * s), hd = S.head;
      ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(hd.x, hd.y, hr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hair; ctx.beginPath();
      if (Math.cos(p.yaw) > 0) ctx.arc(hd.x, hd.y - hr * 0.05, hr * 1.02, Math.PI * 0.9, Math.PI * 2.1);
      else ctx.arc(hd.x, hd.y - hr * 0.25, hr * 0.98, Math.PI * 1.05, Math.PI * 1.95);
      ctx.fill();
      if (!armBehind) arm(far);
      arm(near);
      // Role tag beside the head, coloured by position.
      if (s > 9) {
        var tag = SR.ROLE_TAGS[p.idx], col = SR.ROLE_COLORS[tag.replace(/[0-9]/g, '')] || '#fff';
        ctx.font = '800 ' + Math.max(9, Math.round(0.2 * s)) + 'px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.strokeText(tag, hd.x + hr * 1.5, hd.y - hr * 0.6); ctx.fillStyle = col; ctx.fillText(tag, hd.x + hr * 1.5, hd.y - hr * 0.6);
      }
      return { x: hd.x, y: hd.y };
    }
  };
})();
