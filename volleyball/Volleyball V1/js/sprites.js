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

  // One foot's place in the running cycle at phase ph (same timing as
  // sin/cos of ph): pos runs -1..1 along the stride, lift 0..1. The swing
  // (cos ph > 0) eases forward through the air; the stance slides back
  // linearly, which matches the body's ground speed so the foot doesn't skate.
  function gait(ph) {
    var q = (ph + Math.PI / 2) / (2 * Math.PI);
    q -= Math.floor(q);
    if (q < 0.5) { var u = q * 2; return { pos: -1 + 2 * ease(u), lift: Math.sin(Math.PI * u) }; }
    return { pos: 3 - 4 * q, lift: 0 };
  }

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
    var hipZ = 0.88, lean = 0.04, side = 0.12, twist = 0, headF = 0, plat = null, platK = 0, tilt = 0, hipTw = null;
    var footL = v(0.05, 0.24, 0), footR = v(-0.02, -0.24, 0);
    var handL = v(0.32, 0.2, 1.0), handR = v(0.32, -0.2, 1.0);
    var elbowDir = v(-0.2, 1, -1), kneeDir = v(1, 0, 0.1);
    var plantFeet = false;
    var act = p.act && t >= p.act.t && t - p.act.t < p.act.dur ? p.act : null;
    var a = act ? (t - act.t) / act.dur : 0;
    var jt = clamp((t - p.jumpAt) / 0.75, 0, 1);
    var speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    var cy = Math.cos(p.yaw), sy = Math.sin(p.yaw);
    var toContact = p.contactAt ? p.contactAt - t : 99;
    var sinceLand = t - p.jumpAt - 0.75;
    var defending = rally.state === 'serve' ? (rally.server && rally.server.team !== p.team) : rally.lastTouch !== p.team;
    // Time since the other team hit the ball (for the split step), and how fast it's coming.
    var fl = rally.state === 'rally' ? rally.flight : null;
    var sinceHit = fl && ((fl.p0.x < SR.COURT.NET_X ? 0 : 1) !== p.team) ? fl.t : 99;
    var incoming = fl ? Math.sqrt(fl.v.x * fl.v.x + fl.v.y * fl.v.y) : 0;
    var K, legsRun = false;
    // Running legs: each foot spends half the cycle planted, sliding back under
    // the body at exactly the running speed so it stays put on the floor, and
    // half swinging forward through a high arc with the heel tucked.
    function runFeet() {
      var stride = SR.strideFor(speed), run = clamp((speed - 0.6) / 3, 0, 1), lh = 0.1 + 0.12 * run;
      var mf = (p.vx * cy + p.vy * sy) / speed, ms = (-p.vx * sy + p.vy * cy) / speed;
      var gL = gait(p.phase), gR = gait(p.phase + Math.PI);
      footL = v(mf * stride * gL.pos - gL.lift * lh * 0.3 * mf, 0.12 + ms * stride * gL.pos, gL.lift * lh);
      footR = v(mf * stride * gR.pos - gR.lift * lh * 0.3 * mf, -0.12 + ms * stride * gR.pos, gR.lift * lh);
      plantFeet = true;
    }

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
      // Drop the shoulder on the ball side so the platform faces the setter.
      tilt = clamp(cpt.s * 1.4, -0.45, 0.45) * (1 - relax);
      // Plant the near foot wider when the ball is off to one side.
      if (cpt.s > 0.15) footL = v(0.16, 0.42, 0); else if (cpt.s < -0.15) footR = v(-0.1, -0.42, 0);
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
        { t: tc, lean: 0.06, hR: v(0.12, -0.16, 2.12), hL: v(0.16, 0.25, 1.36), fL: v(-0.12, 0.16, 0.2), fR: v(-0.16, -0.14, 0.22), el: v(-0.5, -1, 0) },
        { t: tc + 0.17, lean: 0.2, hR: v(0.46, 0.02, 1.14), hL: v(0.06, 0.27, 1.08), fL: v(0.02, 0.18, 0.1), fR: v(0, -0.18, 0.1), el: v(0, -1, -0.4) },
        { t: 1, lean: 0.12, hR: v(0.28, -0.24, 0.98), hL: v(0.28, 0.24, 0.98), fL: v(0.08, 0.2, 0), fR: v(0.06, -0.2, 0), el: v(-0.2, -1, -0.6) }
      ], jt);
      hipZ = 0.92; lean = K.lean; handR = K.hR; handL = K.hL; footL = K.fL; footR = K.fR; elbowDir = v(K.el.f, -K.el.s, K.el.z);
      twist = jt < tc ? -0.12 : 0.1;
      // Follow-through depends on the shot: a tip is a soft push with the arm
      // staying up, a roll shot a short brushing swing, a power shot the full arc.
      if (jt > tc && (p.shotKind === 'tip' || p.shotKind === 'roll')) {
        var fk = ease((jt - tc) / 0.25), soft = p.shotKind === 'tip';
        handR = lv(v(0.12, -0.16, 2.12), soft ? v(0.4, -0.1, 2.0) : v(0.5, -0.04, 1.72), fk);
        if (jt > tc + 0.3) handR = lv(handR, v(0.28, -0.24, 0.98), ease((jt - tc - 0.3) / 0.25));
        lean = lerp(0.06, soft ? 0.08 : 0.13, fk);
        twist = soft ? 0 : 0.05;
      }
    } else if ((act && act.type === 'set') || (rally.setter === p && p.lock)) {
      // Hands form a window above the forehead, then push up and out.
      var push = act ? Math.sin(Math.PI * clamp(a / 0.6, 0, 1)) : 0;
      // Up on the toes with the hands making a window right where the ball drops.
      hipZ = act ? 0.95 + push * 0.04 : 0.93; lean = -0.02;
      footL = v(0.1, 0.2, 0.04); footR = v(-0.08, -0.2, 0.04);
      legsRun = !act;
      handL = v(0.15 + push * 0.04, 0.1, 2.05 + push * 0.08); handR = v(0.15 + push * 0.04, -0.1, 2.05 + push * 0.08);
      elbowDir = v(0.2, 1, -0.2);
    } else if (toContact < 0.65 && toContact > -0.05) {
      // Reading the ball: drop into a staggered stance and bring the platform to it.
      var kk = ease(1 - toContact / 0.65), dig = clamp((incoming - 9) / 8, 0, 1);
      legsRun = toContact > 0.3;
      if (p.contactKind === 'dive') {
        var rd = platform(p, 0.3);
        hipZ = 0.8 - kk * 0.3; lean = 0.15 + kk * 0.33;
        footL = v(-0.3 * kk, 0.28, 0); footR = v(0.1 - 0.35 * kk, -0.22, 0);
        handL = lv(v(0.4, 0.14, 0.9), v(rd.f, rd.s + 0.05, rd.z), kk); handR = lv(v(0.4, -0.14, 0.9), v(rd.f, rd.s - 0.05, rd.z), kk);
        elbowDir = v(0, 1, -0.3);
      } else {
        var pp = platform(p, 0.5);
        hipZ = 0.82 - kk * (0.13 + dig * 0.1 + Math.max(0, 0.85 - pp.z) * 0.4); lean = 0.1 + kk * (0.18 + dig * 0.08);
        // Step toward the ball side with the near foot.
        var stepS = clamp(pp.s, -0.25, 0.25) * kk;
        footL = v(0.14, 0.32 + Math.max(0, stepS), 0); footR = v(-0.08, -0.32 + Math.min(0, stepS), 0);
        handL = v(0.36, 0.2, 0.95); handR = v(0.36, -0.2, 0.95); plat = pp; platK = ease((kk - 0.25) / 0.6);
        elbowDir = v(0, 1, -0.2);
        twist = -pp.s * 0.35 * kk;
        tilt = clamp(pp.s * 1.4, -0.45, 0.45) * kk;
      }
    } else if (sinceLand > 0 && sinceLand < 0.32 && (p.jumpKind === 'spike' || p.jumpKind === 'block' || p.jumpKind === 'serve')) {
      // Soft landing: knees absorb, then rise back to ready.
      var lk = Math.sin(Math.PI * clamp(sinceLand / 0.32, 0, 1) * 0.5 + Math.PI * 0.5);
      hipZ = 0.86 - lk * 0.24; lean = 0.08 + lk * 0.14;
      footL = v(0.08, 0.26, 0); footR = v(-0.06, -0.26, 0);
      handL = v(0.28, 0.32, 0.92 + lk * 0.12); handR = v(0.28, -0.32, 0.92 + lk * 0.12);
    } else if (act && act.type === 'sad') {
      var droop = ease(a / 0.3);
      legsRun = true;
      hipZ = 0.9; lean = 0.03 + droop * 0.06; headF = droop * 0.05;
      handL = v(-0.02, 0.27, 0.98); handR = v(-0.02, -0.27, 0.98);
      elbowDir = v(-0.4, 1, 0.1);
    } else if (act && act.type === 'cheer') {
      var bob = Math.abs(Math.sin(a * Math.PI * 3));
      legsRun = true;
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
      legsRun = true;
      hipZ = 0.9;
      handL = v(0.35, 0.05, 1.12 + toss * 0.25); handR = v(-0.12, -0.28, 1.45);
      elbowDir = v(-0.5, -1, -0.2);
    } else if (speed > 0.6) {
      var phs = p.phase, sn = Math.sin(phs), cs = Math.cos(phs);
      var stride = SR.strideFor(speed), run = clamp((speed - 0.6) / 3, 0, 1);
      // Legs swing along the running direction, expressed in the local frame.
      var mf = (p.vx * cy + p.vy * sy) / speed, ms = (-p.vx * sy + p.vy * cy) / speed;
      runFeet();
      hipZ = 0.92 - Math.abs(cs) * 0.035 * (0.5 + run); lean = 0.05 + mf * (0.06 + 0.08 * run);
      // Arms swing opposite to the legs with bent elbows; shoulders counter-rotate.
      var sw = 0.28 * sn * Math.max(0.3, Math.abs(mf));
      handL = v(0.16 - sw, 0.24, 1.05 + Math.max(0, -sn) * 0.08); handR = v(0.16 + sw, -0.24, 1.05 + Math.max(0, sn) * 0.08);
      elbowDir = v(-1, 0.4, -0.6);
      twist = -sn * 0.12 * mf;
      // The pelvis swings with the legs, against the shoulders.
      hipTw = sn * 0.16 * mf;
      // Hustling to a ball: stay low with the arms ready to form the platform.
      if (p.lock && toContact < 1.4 && toContact > 0 && rally.setter !== p) {
        hipZ -= 0.07; lean += 0.05; twist *= 0.3;
        handL = v(0.3, 0.16, 0.9 + Math.max(0, -sn) * 0.03); handR = v(0.3, -0.16, 0.9 + Math.max(0, sn) * 0.03); elbowDir = v(-0.3, 1, -0.4);
      }
      // Side shuffles stay low with arms ready instead of a full sprint.
      if (Math.abs(ms) > 0.7) {
        hipZ = 0.8 - Math.abs(sn) * 0.02; handL = v(0.32, 0.22, 0.98); handR = v(0.32, -0.22, 0.98); lean = 0.1; twist = 0;
        // Shuffle steps: feet stay planted while the body slides over them, then hop across low.
        var sL = gait(phs), sR = gait(phs + Math.PI);
        footL = v(0.04, 0.26 + ms * stride * 0.8 * sL.pos, sL.lift * 0.06); footR = v(-0.02, -0.26 + ms * stride * 0.8 * sR.pos, sR.lift * 0.06);
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
      // Split step: a small hop as the other team hits, landing wide and low.
      else if (sinceHit < 0.42) {
        var sk = sinceHit / 0.42, hop = sk < 0.45 ? Math.sin(Math.PI * sk / 0.45) * 0.07 : 0, sink = sk >= 0.45 ? Math.sin(Math.PI * (sk - 0.45) / 0.55) * 0.08 : 0;
        hipZ += hop - sink; footL = v(0.08, 0.33, hop); footR = v(-0.04, -0.33, hop);
        handL = v(0.36, 0.24, 0.92 + hop); handR = v(0.36, -0.24, 0.92 + hop);
        lean = 0.14;
      }
    }

    // Upper-body poses (setting, celebrating, reading the ball) still run on
    // planted feet while the player is moving, instead of gliding in a stance.
    if (legsRun && !inAir && speed > 1.2) { runFeet(); hipZ = Math.min(hipZ, 0.92); }

    // Keep the torso a fixed length however far the player leans.
    lean = clamp(lean, -0.3, 0.53);
    var TORSO = 0.55, shZ = hipZ + Math.sqrt(TORSO * TORSO - lean * lean);
    var ct = Math.cos(twist), st = Math.sin(twist);
    var j = {};
    // Hips turn a little with the shoulders, the shoulders counter-rotate.
    var hTw = hipTw === null ? twist * 0.5 : hipTw, hc = Math.cos(hTw), hs = Math.sin(hTw);
    j.hipL = v(-side * hs, side * hc, hipZ); j.hipR = v(side * hs, -side * hc, hipZ);
    j.shL = v(lean - 0.2 * st, 0.2 * ct, shZ - tilt * 0.2); j.shR = v(lean + 0.2 * st, -0.2 * ct, shZ + tilt * 0.2);
    // Shoulders lift when reaching overhead, adding a little reach.
    if (handL.z > shZ + 0.35) j.shL.z += 0.06;
    if (handR.z > shZ + 0.35) j.shR.z += 0.06;
    // Forearm platform: both arms straight, hands together, pointing at the ball.
    if (plat && platK > 0) {
      var mc = v(lean, 0, shZ - tilt * 0.05), df = plat.f - mc.f, ds = plat.s - mc.s, dz = plat.z - mc.z, dl = Math.sqrt(df * df + ds * ds + dz * dz) || 1;
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
    j._w = (act && (act.type === 'pass' || act.type === 'dive' || act.type === 'set')) || toContact < 0.65 ? 28 : sinceHit < 0.42 ? 30
      : inAir ? 60 : speed > 0.6 ? 42 : 14;
    // Planted feet follow tightly; a loose spring would let them skate.
    j._wf = plantFeet ? 120 : j._w;
    return j;
  }

  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function tone(hex, k) {
    // k < 1 darkens, k > 1 mixes toward white.
    var c = rgb(hex), f = function (x) { return Math.round(k <= 1 ? x * k : x + (255 - x) * (k - 1)); };
    return 'rgb(' + f(c[0]) + ',' + f(c[1]) + ',' + f(c[2]) + ')';
  }
  function along(a, b, k) { return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }; }

  // Light comes from the upper left of the screen.
  var LX = -0.6, LY = -0.8;

  // A tapered, rounded limb segment with a shaded edge and a soft highlight.
  function limb(ctx, a, b, w0, w1, base, dark, light) {
    var dx = b.x - a.x, dy = b.y - a.y, l = Math.sqrt(dx * dx + dy * dy) || 1e-3, nx = -dy / l, ny = dx / l;
    var r0 = w0 / 2, r1 = w1 / 2, ang = Math.atan2(dy, dx);
    function shape(g) {
      ctx.beginPath();
      ctx.moveTo(a.x + nx * (r0 + g), a.y + ny * (r0 + g));
      ctx.lineTo(b.x + nx * (r1 + g), b.y + ny * (r1 + g));
      ctx.arc(b.x, b.y, r1 + g, ang + Math.PI / 2, ang - Math.PI / 2, true);
      ctx.lineTo(a.x - nx * (r0 + g), a.y - ny * (r0 + g));
      ctx.arc(a.x, a.y, r0 + g, ang - Math.PI / 2, ang + Math.PI / 2, true);
      ctx.closePath();
    }
    if (w0 > 3.5) { shape(0.5); ctx.fillStyle = dark; ctx.fill(); shape(-0.2); }
    else shape(0);
    ctx.fillStyle = base; ctx.fill();
    // Highlight on the side facing the light.
    var side = nx * LX + ny * LY > 0 ? 1 : -1, hk = 0.38;
    if (w1 > 2.2) {
      ctx.strokeStyle = light; ctx.lineWidth = Math.max(0.8, Math.min(w0, w1) * 0.28);
      ctx.beginPath();
      ctx.moveTo(a.x + nx * side * r0 * hk + dx * 0.1, a.y + ny * side * r0 * hk + dy * 0.1);
      ctx.lineTo(b.x + nx * side * r1 * hk - dx * 0.12, b.y + ny * side * r1 * hk - dy * 0.12);
      ctx.stroke();
    }
  }

  // Pose, smoothing and world positions for one player, once per frame.
  function prepare(p, rally) {
    if (p._prepT === rally.t && p._W) return p._W;
    var j = pose(p, rally), w0 = j._w, wf = j._wf;
    delete j._w; delete j._wf;
    // Each joint follows its target on a critically damped spring, so poses
    // flow into each other with natural ease-in and ease-out.
    var dtp = rally.t - (p._jt || 0);
    if (!p._j || dtp < 0 || dtp > 0.5) {
      p._j = {}; p._jv = {};
      Object.keys(j).forEach(function (k) { p._j[k] = v(j[k].f, j[k].s, j[k].z); p._jv[k] = v(0, 0, 0); });
    } else if (dtp > 0) {
      var n = Math.ceil(dtp / (1 / 240)), h = dtp / n;
      Object.keys(j).forEach(function (k) {
        var x = p._j[k], vel = p._jv[k], g = j[k], w = k === 'footL' || k === 'footR' ? wf : w0;
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
    // Toes: the shoe points forward from the ankle, rolling down when the
    // foot is lifted behind (heel up) and flat when planted.
    ['L', 'R'].forEach(function (sd) {
      var ft = j['foot' + sd], kn = j['knee' + sd], up = clamp(ft.z * 2.5, 0, 1);
      var fx = ft.f - kn.f, len = 0.15;
      var pitch = up * (fx < 0 ? 0.9 : 0.35);
      j['toe' + sd] = v(ft.f + Math.cos(pitch) * len, ft.s + (sd === 'L' ? 0.01 : -0.01), Math.max(0, ft.z - Math.sin(pitch) * len));
    });
    // Pelvis centre for the shorts and the cast shadow.
    var cy = Math.cos(p.yaw), sy = Math.sin(p.yaw), W = {};
    Object.keys(j).forEach(function (k) {
      var q = j[k];
      W[k] = { x: p.x + q.f * cy - q.s * sy, y: p.y + q.f * sy + q.s * cy, z: p.z + q.z };
    });
    p._W = W; p._prepT = rally.t;
    return W;
  }

  // Where a point at height z casts its shadow on the floor.
  var SHX = -0.42, SHY = 0.32;
  function shadowPt(proj, w) { return proj(w.x + w.z * SHX, w.y + w.z * SHY, 0); }

  var shadowCanvas = null;

  SR.sprites = {
    prepare: prepare,

    // Long soft shadows for every player, drawn as one layer so overlapping
    // limbs don't stack up into dark blotches.
    shadows: function (ctx, players, rally, proj) {
      var cv = ctx.canvas, direct = !!SR.lowFx;
      if (direct) {
        // Slow device: draw straight onto the court (overlaps darken a little).
        ctx.save(); ctx.globalAlpha = 0.22; ctx.lineCap = 'round'; ctx.strokeStyle = '#000'; ctx.fillStyle = '#000';
        players.forEach(function (p) {
          var W = prepare(p, rally), s = proj(p.x, p.y, 0).s, S = {};
          Object.keys(W).forEach(function (k) { S[k] = shadowPt(proj, W[k]); });
          ctx.lineWidth = Math.max(1, 0.13 * s); ctx.beginPath();
          [['hipL', 'kneeL'], ['kneeL', 'footL'], ['hipR', 'kneeR'], ['kneeR', 'footR'], ['shL', 'elbowL'], ['elbowL', 'handL'], ['shR', 'elbowR'], ['elbowR', 'handR'], ['neck', 'head'], ['neck', 'hipL'], ['neck', 'hipR']].forEach(function (sg) {
            ctx.moveTo(S[sg[0]].x, S[sg[0]].y); ctx.lineTo(S[sg[1]].x, S[sg[1]].y);
          });
          ctx.stroke();
        });
        ctx.restore();
        return;
      }
      if (!shadowCanvas) shadowCanvas = document.createElement('canvas');
      // Half resolution: cheaper, and the upscale softens the edges.
      var sw = Math.ceil(cv.width / 2), shh = Math.ceil(cv.height / 2);
      if (shadowCanvas.width !== sw || shadowCanvas.height !== shh) { shadowCanvas.width = sw; shadowCanvas.height = shh; }
      else if (shadowCanvas._dirty) { var c0 = shadowCanvas.getContext('2d'); c0.setTransform(1, 0, 0, 1, 0, 0); c0.clearRect(0, 0, sw, shh); }
      shadowCanvas._dirty = true;
      var sc = shadowCanvas.getContext('2d');
      var mt = ctx.getTransform(), bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
      sc.setTransform(mt.a / 2, mt.b / 2, mt.c / 2, mt.d / 2, mt.e / 2, mt.f / 2);
      sc.lineCap = 'round'; sc.lineJoin = 'round';
      sc.strokeStyle = '#000'; sc.fillStyle = '#000';
      players.forEach(function (p) {
        var W = prepare(p, rally), s = proj(p.x, p.y, 0).s, S = {};
        Object.keys(W).forEach(function (k) {
          var q = S[k] = shadowPt(proj, W[k]);
          if (q.x < bx0) bx0 = q.x; if (q.x > bx1) bx1 = q.x; if (q.y < by0) by0 = q.y; if (q.y > by1) by1 = q.y;
        });
        function sg(a, b, w) { sc.lineWidth = Math.max(1, w * s); sc.beginPath(); sc.moveTo(S[a].x, S[a].y); sc.lineTo(S[b].x, S[b].y); sc.stroke(); }
        sg('hipL', 'kneeL', 0.15); sg('kneeL', 'footL', 0.11); sg('hipR', 'kneeR', 0.15); sg('kneeR', 'footR', 0.11);
        sg('footL', 'toeL', 0.09); sg('footR', 'toeR', 0.09);
        sg('shL', 'elbowL', 0.09); sg('elbowL', 'handL', 0.075); sg('shR', 'elbowR', 0.09); sg('elbowR', 'handR', 0.075);
        sc.beginPath();
        sc.moveTo(S.shL.x, S.shL.y); sc.lineTo(S.shR.x, S.shR.y); sc.lineTo(S.hipR.x, S.hipR.y); sc.lineTo(S.hipL.x, S.hipL.y); sc.closePath();
        sc.fill(); sc.lineWidth = Math.max(1, 0.12 * s); sc.stroke();
        sg('neck', 'head', 0.1);
        sc.beginPath(); sc.arc(S.head.x, S.head.y, Math.max(1.5, 0.12 * s), 0, Math.PI * 2); sc.fill();
        // Contact shadow right under the feet.
        var g = proj(p.x, p.y, 0), r = Math.max(2, (0.3 + p.z * 0.05) * g.s);
        sc.beginPath(); sc.ellipse(g.x, g.y, r, r * 0.4, 0, 0, Math.PI * 2); sc.fill();
      });
      // Copy back only the area the shadows cover (in half-size pixels).
      var pad = 30, X0 = Math.max(0, Math.floor((mt.a * bx0 + mt.e - pad) / 2)), Y0 = Math.max(0, Math.floor((mt.d * by0 + mt.f - pad) / 2));
      var X1 = Math.min(sw, Math.ceil((mt.a * bx1 + mt.e + pad) / 2)), Y1 = Math.min(shh, Math.ceil((mt.d * by1 + mt.f + pad) / 2));
      if (X1 <= X0 || Y1 <= Y0) return;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 0.3;
      ctx.drawImage(shadowCanvas, X0, Y0, X1 - X0, Y1 - Y0, X0 * 2, Y0 * 2, (X1 - X0) * 2, (Y1 - Y0) * 2);
      ctx.restore();
      sc.setTransform(1, 0, 0, 1, 0, 0);
      sc.clearRect(X0, Y0, X1 - X0, Y1 - Y0);
      shadowCanvas._dirty = false;
    },

    draw: function (ctx, p, team, rally, proj, hl) {
      var W = prepare(p, rally), S = {};
      Object.keys(W).forEach(function (k) { S[k] = proj(W[k].x, W[k].y, W[k].z); });
      var s = proj(p.x, p.y, p.z).s;
      var skin = SKIN[(p.idx * 2 + p.team) % SKIN.length], hair = HAIR[(p.idx + p.team * 3) % HAIR.length];
      var skinD = tone(skin, 0.72), skinL = tone(skin, 1.35);
      var jersey = team.color, jerseyD = tone(team.color, 0.62), jerseyL = tone(team.color, 1.3);
      var shorts = tone(team.color, 0.32), shortsD = tone(team.color, 0.2), shortsL = tone(team.color, 0.5);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';

      if (hl) {
        var gs = proj(p.x, p.y, 0), shR = Math.max(3, 0.36 * gs.s);
        ctx.strokeStyle = hl; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(gs.x, gs.y, shR * 1.6, shR * 0.62, 0, 0, Math.PI * 2); ctx.stroke();
      }

      var wThigh = Math.max(2.2, 0.16 * s), wKnee = Math.max(1.8, 0.11 * s), wAnkle = Math.max(1.4, 0.075 * s);
      var wUp = Math.max(1.6, 0.1 * s), wElbow = Math.max(1.3, 0.075 * s), wWrist = Math.max(1.1, 0.06 * s);
      function leg(side) {
        var hip = S['hip' + side], knee = S['knee' + side], foot = S['foot' + side], toe = S['toe' + side];
        limb(ctx, hip, knee, wThigh, wKnee * 1.15, skin, skinD, skinL);
        limb(ctx, knee, foot, wKnee * 1.05, wAnkle, skin, skinD, skinL);
        limb(ctx, along(knee, foot, 0.62), foot, wAnkle * 1.25, wAnkle * 1.2, '#f4f4f4', '#b9bec6', '#ffffff');   // sock
        limb(ctx, along(hip, knee, 0.86), along(knee, foot, 0.12), wKnee * 1.5, wKnee * 1.4, '#2a2e36', '#14161b', '#4a505c'); // knee pad
        limb(ctx, foot, toe, wAnkle * 1.6, wAnkle * 1.3, '#eef1f5', '#8d96a3', '#ffffff');                     // shoe
        ctx.strokeStyle = team.color; ctx.lineWidth = Math.max(0.6, wAnkle * 0.35);
        ctx.beginPath(); var m0 = along(foot, toe, 0.2), m1 = along(foot, toe, 0.75); ctx.moveTo(m0.x, m0.y); ctx.lineTo(m1.x, m1.y); ctx.stroke();
      }
      function arm(side) {
        var sh = S['sh' + side], el = S['elbow' + side], hd = S['hand' + side];
        limb(ctx, sh, el, wUp, wElbow, skin, skinD, skinL);
        limb(ctx, el, hd, wElbow, wWrist, skin, skinD, skinL);
        limb(ctx, sh, along(sh, el, 0.42), wUp * 1.45, wUp * 1.3, jersey, jerseyD, jerseyL); // sleeve
        ctx.fillStyle = skinD; ctx.beginPath(); ctx.arc(hd.x, hd.y, wWrist * 0.85, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(hd.x, hd.y, wWrist * 0.7, 0, Math.PI * 2); ctx.fill();
      }
      // Far side first.
      var leftFar = S.shL.d > S.shR.d;
      var far = leftFar ? 'L' : 'R', near = leftFar ? 'R' : 'L';
      leg(far); leg(near);
      // Shorts: a rounded pelvis with short legs.
      var tl = along(S.hipL, S.kneeL, 0.4), tr = along(S.hipR, S.kneeR, 0.4);
      limb(ctx, S.hipL, tl, wThigh * 1.22, wThigh * 1.18, shorts, shortsD, shortsL);
      limb(ctx, S.hipR, tr, wThigh * 1.22, wThigh * 1.18, shorts, shortsD, shortsL);
      limb(ctx, S.hipL, S.hipR, wThigh * 1.15, wThigh * 1.15, shorts, shortsD, shortsL);
      // Arm hidden behind the torso
      var armBehind = S['sh' + far].d > S.neck.d + 0.02;
      if (armBehind) arm(far);
      // Torso: broad shoulders tapering to the waist, shaded across.
      var waistL = along(S.hipR, S.hipL, 0.92), waistR = along(S.hipL, S.hipR, 0.92);
      var cxs = (S.shL.x + S.shR.x) / 2, cys = (S.shL.y + S.shR.y) / 2, cxh = (S.hipL.x + S.hipR.x) / 2, cyh = (S.hipL.y + S.hipR.y) / 2;
      var gr = ctx.createLinearGradient(S.shL.x, S.shL.y, S.shR.x, S.shR.y);
      var lightOnL = (S.shL.x - S.shR.x) * LX + (S.shL.y - S.shR.y) * LY > 0;
      gr.addColorStop(0, lightOnL ? jerseyL : jerseyD); gr.addColorStop(0.45, jersey); gr.addColorStop(1, lightOnL ? jerseyD : jerseyL);
      function torsoPath(g) {
        var ox = (cxs - cxh), oy = (cys - cyh);
        ctx.beginPath();
        ctx.moveTo(S.shL.x, S.shL.y);
        ctx.quadraticCurveTo(cxs + (S.shL.x - cxs) * 0.2 - oy * 0.0, cys - wUp * 0.55 - g, S.shR.x, S.shR.y);
        ctx.quadraticCurveTo(S.shR.x + (waistR.x - S.shR.x) * 0.45 + (S.shR.x - cxs) * 0.12, S.shR.y + (waistR.y - S.shR.y) * 0.45 + (S.shR.y - cys) * 0.12, waistR.x, waistR.y);
        ctx.lineTo(waistL.x, waistL.y);
        ctx.quadraticCurveTo(S.shL.x + (waistL.x - S.shL.x) * 0.45 + (S.shL.x - cxs) * 0.12, S.shL.y + (waistL.y - S.shL.y) * 0.45 + (S.shL.y - cys) * 0.12, S.shL.x, S.shL.y);
        ctx.closePath();
        return ox;
      }
      ctx.lineWidth = Math.max(1, wUp * 0.5); ctx.strokeStyle = jerseyD;
      torsoPath(0); ctx.fillStyle = gr; ctx.fill(); ctx.stroke();
      limb(ctx, S.shL, S.shR, wUp * 1.25, wUp * 1.25, jersey, jerseyD, jerseyL);
      // Jersey pattern, clipped to the torso.
      if (team.pattern && s > 9) {
        ctx.save();
        torsoPath(0); ctx.clip();
        ctx.globalAlpha = 0.5;
        var bw = Math.max(1.5, 0.06 * s), i2;
        if (team.pattern === 'stripes') {
          for (i2 = -3; i2 <= 3; i2 += 2) { ctx.strokeStyle = team.trim; ctx.lineWidth = bw; ctx.beginPath(); var a1 = along(S.shR, S.shL, 0.5 + i2 * 0.1), a2 = along(S.hipR, S.hipL, 0.5 + i2 * 0.1); ctx.moveTo(a1.x, a1.y); ctx.lineTo(a2.x, a2.y); ctx.stroke(); }
        } else if (team.pattern === 'hoops') {
          for (i2 = 1; i2 <= 3; i2++) { ctx.strokeStyle = team.trim; ctx.lineWidth = bw * 1.2; ctx.beginPath(); var b1 = along(S.shL, S.hipL, i2 * 0.25), b2 = along(S.shR, S.hipR, i2 * 0.25); ctx.moveTo(b1.x, b1.y); ctx.lineTo(b2.x, b2.y); ctx.stroke(); }
        } else {
          ctx.fillStyle = jerseyD; ctx.globalAlpha = 0.6;
          ctx.beginPath(); var m1 = along(S.shL, S.shR, 0.5), m2 = along(S.hipL, S.hipR, 0.5);
          ctx.moveTo(m1.x, m1.y); ctx.lineTo(S.shR.x, S.shR.y); ctx.lineTo(S.hipR.x, S.hipR.y); ctx.lineTo(m2.x, m2.y); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
      if (s > 13) {
        ctx.fillStyle = team.trim; ctx.font = '800 ' + Math.round(0.2 * s) + 'px system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(p.num), (cxs * 0.55 + cxh * 0.45), (cys * 0.55 + cyh * 0.45));
      }
      // Neck and head; the near team shows the back of the head.
      limb(ctx, S.neck, along(S.neck, S.head, 0.55), wUp * 1.05, wUp * 0.95, skin, skinD, skinL);
      var hr = Math.max(2.5, 0.11 * s), hd = S.head;
      ctx.fillStyle = skinD; ctx.beginPath(); ctx.arc(hd.x, hd.y, hr + 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(hd.x, hd.y, hr, 0, Math.PI * 2); ctx.fill();
      var facing = Math.cos(p.yaw) > 0; // facing away from the camera
      ctx.fillStyle = hair; ctx.beginPath();
      if (facing) ctx.arc(hd.x, hd.y - hr * 0.05, hr * 1.04, Math.PI * 0.85, Math.PI * 2.15);
      else ctx.arc(hd.x, hd.y - hr * 0.3, hr * 0.98, Math.PI * 1.02, Math.PI * 1.98);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(hd.x - hr * 0.3, hd.y - hr * 0.55, hr * 0.35, 0, Math.PI * 2); ctx.fill();
      if (!armBehind) arm(far);
      arm(near);
      // Role tag beside the head, coloured by position.
      if (s > 9) {
        var tag = SR.ROLE_TAGS[p.idx], col = SR.ROLE_COLORS[tag.replace(/[0-9]/g, '')] || '#fff';
        ctx.font = '800 ' + Math.max(9, Math.round(0.18 * s)) + 'px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.strokeText(tag, hd.x + hr * 1.6, hd.y - hr * 0.6); ctx.fillStyle = col; ctx.fillText(tag, hd.x + hr * 1.6, hd.y - hr * 0.6);
      }
      return { x: hd.x, y: hd.y };
    }
  };
})();
