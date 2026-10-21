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

  // Build the pose: returns local joint positions.
  function pose(p, rally) {
    var t = rally.t, inAir = p.z > 0.05;
    var hipZ = 0.88, lean = 0.04, side = 0.12;
    var footL = v(0.05, 0.24, 0), footR = v(-0.02, -0.24, 0);
    var handL = v(0.32, 0.2, 1.0), handR = v(0.32, -0.2, 1.0);
    var elbowDir = v(-0.2, 1, -1), kneeDir = v(1, 0, 0.1);
    var act = p.act && t - p.act.t < p.act.dur ? p.act : null;
    var a = act ? (t - act.t) / act.dur : 0;
    var jt = clamp((t - p.jumpAt) / 0.75, 0, 1);
    var speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    var cy = Math.cos(p.yaw), sy = Math.sin(p.yaw);
    var toContact = p.contactAt ? p.contactAt - t : 99;
    var sinceLand = t - p.jumpAt - 0.75;

    if (inAir && p.jumpKind === 'block') {
      hipZ = 0.95; lean = 0.06;
      footL = v(0.02, 0.17, 0.08); footR = v(0.02, -0.17, 0.08);
      handL = v(0.22, 0.17, 2.36); handR = v(0.22, -0.17, 2.36);
      elbowDir = v(-0.3, 1, 0);
    } else if (inAir && (p.jumpKind === 'spike' || p.jumpKind === 'serve')) {
      hipZ = 0.92;
      footL = v(-0.18, 0.15, 0.22); footR = v(-0.28, -0.12, 0.3);
      if (jt < 0.45) { lean = -0.12; handR = v(-0.28, -0.26, 1.95); handL = v(0.32, 0.2, 2.2); elbowDir = v(-1, -0.4, 0.6); }
      else if (jt < 0.62) { lean = 0.05; handR = v(0.22, -0.13, 2.36); handL = v(0.15, 0.22, 1.4); elbowDir = v(-0.5, -1, 0); }
      else { lean = 0.18; handR = v(0.45, -0.05, 1.2); handL = v(0.1, 0.24, 1.15); }
    } else if (act && act.type === 'dive') {
      hipZ = 0.42 + a * 0.1; lean = 0.6;
      footL = v(-0.55, 0.26, 0); footR = v(-0.45, -0.22, 0.05);
      handL = v(1.05, 0.08, 0.35); handR = v(1.05, -0.08, 0.35);
      elbowDir = v(0, 1, -0.3);
    } else if (act && act.type === 'pass') {
      hipZ = 0.7; lean = 0.24;
      footL = v(0.12, 0.32, 0); footR = v(-0.08, -0.32, 0);
      handL = v(0.55, 0.04, 0.82 + a * 0.1); handR = v(0.55, -0.04, 0.82 + a * 0.1);
      elbowDir = v(0, 1, -0.2);
    } else if ((act && act.type === 'set') || (rally.setter === p && p.lock)) {
      hipZ = act ? 0.9 + a * 0.05 : 0.84; lean = 0;
      footL = v(0.08, 0.2, 0); footR = v(-0.08, -0.2, 0);
      handL = v(0.12, 0.12, 2.02); handR = v(0.12, -0.12, 2.02);
      elbowDir = v(0.2, 1, -0.2);
    } else if (toContact < 0.45 && toContact > -0.05) {
      // Reading the ball: drop into the platform (or start the dive) before contact.
      var kk = clamp(1 - toContact / 0.45, 0, 1);
      if (p.contactKind === 'dive') {
        hipZ = 0.8 - kk * 0.35; lean = 0.15 + kk * 0.4;
        footL = v(-0.3 * kk, 0.28, 0); footR = v(0.1 - 0.35 * kk, -0.22, 0);
        handL = v(0.4 + 0.6 * kk, 0.1, 0.8 - 0.4 * kk); handR = v(0.4 + 0.6 * kk, -0.1, 0.8 - 0.4 * kk);
        elbowDir = v(0, 1, -0.3);
      } else {
        hipZ = 0.84 - kk * 0.15; lean = 0.1 + kk * 0.14;
        footL = v(0.12, 0.3, 0); footR = v(-0.06, -0.3, 0);
        handL = v(0.4 + kk * 0.15, 0.12 - kk * 0.08, 0.95 - kk * 0.12); handR = v(0.4 + kk * 0.15, -0.12 + kk * 0.08, 0.95 - kk * 0.12);
        elbowDir = v(0, 1, -0.2);
      }
    } else if (sinceLand > 0 && sinceLand < 0.28 && (p.jumpKind === 'spike' || p.jumpKind === 'block' || p.jumpKind === 'serve')) {
      // Soft landing: knees absorb, arms come down.
      var lk = 1 - sinceLand / 0.28;
      hipZ = 0.88 - lk * 0.22; lean = 0.08 + lk * 0.12;
      footL = v(0.05, 0.24, 0); footR = v(-0.05, -0.24, 0);
      handL = v(0.25, 0.3, 0.95 + lk * 0.2); handR = v(0.25, -0.3, 0.95 + lk * 0.2);
    } else if (act && act.type === 'sad') {
      hipZ = 0.9; lean = 0.05;
      handL = v(-0.02, 0.27, 0.98); handR = v(-0.02, -0.27, 0.98);
      elbowDir = v(-0.4, 1, 0.1);
    } else if (act && act.type === 'cheer') {
      var bob = Math.abs(Math.sin(a * Math.PI * 3));
      hipZ = 0.9 + bob * 0.06;
      handL = v(0.05, 0.36, 2.1); handR = v(0.05, -0.36, 2.1);
      elbowDir = v(0, 1, 0);
    } else if (p.jumpKind === 'spike' && p.jumpAt > t && p.jumpAt - t < 0.3) {
      // Last steps of the approach: arms swing back, knees load.
      var k = 1 - (p.jumpAt - t) / 0.3;
      hipZ = 0.88 - k * 0.2; lean = 0.15 + k * 0.15;
      footL = v(0.2, 0.2, 0); footR = v(0.05, -0.2, 0);
      handL = v(-0.35 * k + 0.2 * (1 - k), 0.26, 0.9); handR = v(-0.4 * k + 0.2 * (1 - k), -0.26, 0.9);
    } else if (rally.state === 'serve' && rally.server === p) {
      var toss = Math.abs(Math.sin(rally.stateT * 4));
      hipZ = 0.9;
      handL = v(0.35, 0.05, 1.12 + toss * 0.25); handR = v(-0.12, -0.28, 1.45);
      elbowDir = v(-0.5, -1, -0.2);
    } else if (speed > 0.6) {
      var ph = p.phase, sn = Math.sin(ph), cs = Math.cos(ph);
      var stride = Math.min(0.42, 0.08 * speed);
      // Legs swing along the running direction, expressed in the local frame.
      var mf = (p.vx * cy + p.vy * sy) / speed, ms = (-p.vx * sy + p.vy * cy) / speed;
      footL = v(mf * stride * sn, 0.12 + ms * stride * sn, Math.max(0, cs) * 0.16);
      footR = v(-mf * stride * sn, -0.12 - ms * stride * sn, Math.max(0, -cs) * 0.16);
      hipZ = 0.93 - Math.abs(sn) * 0.03; lean = 0.06 + mf * 0.08;
      handL = v(0.12 - 0.26 * sn * mf, 0.24, 1.02); handR = v(0.12 + 0.26 * sn * mf, -0.24, 1.02);
      // Side shuffles stay low with arms ready instead of a full sprint.
      if (Math.abs(ms) > 0.7) { hipZ = 0.82; handL = v(0.3, 0.22, 1.0); handR = v(0.3, -0.22, 1.0); lean = 0.08; }
    } else {
      // Ready stance: small sway so nobody stands frozen.
      var sway = Math.sin(t * 2.2 + p.idx) * 0.015;
      hipZ = 0.84 + sway;
      if (rally.state === 'rally' && p.jumpKind === 'block') { handL = v(0.15, 0.24, 1.62); handR = v(0.15, -0.24, 1.62); elbowDir = v(-0.2, 1, -0.6); }
    }

    var shZ = hipZ + 0.55;
    var j = {};
    j.hipL = v(0, side, hipZ); j.hipR = v(0, -side, hipZ);
    j.shL = v(lean, 0.2, shZ); j.shR = v(lean, -0.2, shZ);
    j.neck = v(lean * 1.05, 0, shZ + 0.07);
    j.head = v(lean * 1.12, 0, shZ + 0.23);
    var lL = ik(j.hipL, footL, THIGH, SHIN, kneeDir), lR = ik(j.hipR, footR, THIGH, SHIN, kneeDir);
    j.kneeL = lL.joint; j.footL = lL.end; j.kneeR = lR.joint; j.footR = lR.end;
    var eL = ik(j.shL, handL, UPPER, FORE, elbowDir), eR = ik(j.shR, handR, UPPER, FORE, v(elbowDir.f, -elbowDir.s, elbowDir.z));
    j.elbowL = eL.joint; j.handL = eL.end; j.elbowR = eR.joint; j.handR = eR.end;
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
      var j = pose(p, rally), S = {};
      // Blend toward the new pose so every transition is smooth.
      var dtp = rally.t - (p._jt || 0);
      if (p._j && dtp >= 0 && dtp < 0.3) {
        var kb = 1 - Math.exp(-dtp * 16);
        Object.keys(j).forEach(function (k) {
          var a0 = p._j[k], b0 = j[k];
          j[k] = v(a0.f + (b0.f - a0.f) * kb, a0.s + (b0.s - a0.s) * kb, a0.z + (b0.z - a0.z) * kb);
        });
      }
      p._j = j; p._jt = rally.t;
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
