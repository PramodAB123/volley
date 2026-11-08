// Visual effects: particles, ground rings, screen shake, crowd excitement.
// The rally calls SR.fx.emit(); the renderer calls update() and draw().
//
// Shot elements: the ball in flight can carry an element that changes how its
// trail, hit and landing look.
//   fire     every Power spike (default)
//   thunder  the hardest spikes (strong hitter on a good set): a lightning
//            bolt strikes the ball at contact and again where it lands
//   ice      spikes with the Frost ball equipped
//   wind     hard jump serves, and spikes with the Jungle ball
// Elements are only looks; they never change the rally.
(function () {
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function few(n) { return Math.max(1, Math.round(n * (SR.lowFx ? 0.5 : 1))); }

  var THUNDER_AT = 0.82;           // spike power (0-1) that turns into thunder
  var BALL_ELEM = { frost: 'ice', jungle: 'wind' };
  var PAL = {
    fire:    ['#ffd23f', '#ff9b3d', '#ff5a1f', '#e8380d'],
    thunder: ['#ffffff', '#cfefff', '#6fd0ff', '#3f8cff'],
    ice:     ['#ffffff', '#e6f7ff', '#9fe0ff', '#5ab8f0'],
    wind:    ['#ffffff', '#e8fff4', '#b8f5dc', '#7fe0c0']
  };
  var CRACK = { fire: '#ff7a2b', thunder: '#7fdcff', ice: '#dff6ff', wind: '#c9fff0' };

  function ballElem() {
    try { return BALL_ELEM[SR.save.data.equipped.ball] || 'fire'; } catch (e) { return 'fire'; }
  }

  // Jagged lightning from a to b (world points), with a couple of side forks.
  function boltPath(a, b) {
    var segs = 11, pts = [], dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz), amp = 0.18 + len * 0.035;
    for (var i = 0; i <= segs; i++) {
      var t = i / segs, w = i === 0 || i === segs ? 0 : Math.sin(Math.PI * t) * amp;
      pts.push({ x: a.x + dx * t + rnd(-1, 1) * w * 0.6, y: a.y + dy * t + rnd(-1, 1) * w, z: a.z + dz * t + rnd(-0.3, 0.3) * w });
    }
    var forks = [];
    for (var f = 0; f < 2; f++) {
      var s = pts[2 + Math.floor(Math.random() * (segs - 5))], fk = [s], sx = rnd(-1, 1), sy = rnd(-1, 1);
      for (var j = 1; j <= 4; j++) {
        var lp = fk[j - 1];
        fk.push({ x: lp.x + sx * 0.25 + rnd(-0.15, 0.15), y: lp.y + sy * 0.35 + rnd(-0.2, 0.2), z: lp.z - len * 0.045 - rnd(0, 0.2) });
      }
      forks.push(fk);
    }
    return { pts: pts, forks: forks };
  }

  // Cracks spreading from an impact on the floor.
  function cracks(p, n, reach) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2 + rnd(-0.3, 0.3), l = rnd(0.5, 1) * reach, ray = [{ x: p.x, y: p.y }];
      for (var j = 1; j <= 3; j++) {
        a += rnd(-0.45, 0.45);
        var d = l * j / 3;
        ray.push({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d });
      }
      out.push(ray);
    }
    return out;
  }

  var fx = {
    parts: [],
    rings: [],
    marks: [],     // ball mark left on the floor where it landed
    bolts: [],     // lightning: { a, b, life, max, path, next }
    gusts: [],     // air rings around a wind ball: { x, y, z, dx, dy, dz, life, max, r }
    words: [],     // shot callouts like THUNDER SMASH, anchored in the world
    elem: null,    // element of the ball in flight
    elemT: 0,
    emitAcc: 0,
    shake: 0,
    hitStop: 0,
    punch: 0,      // brief camera push-in on big hits
    cheer: 0,
    flash: 0,
    flashColor: '#ffffff',
    PAL: PAL,

    burst: function (p, n, colors, speed, up, life, size, grav, kind) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, sp = rnd(0.3, 1) * speed;
        this.parts.push({
          x: p.x, y: p.y, z: p.z || 0,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: rnd(0.2, 1) * up,
          life: 0, max: rnd(0.6, 1) * life, color: colors[i % colors.length], size: rnd(0.6, 1.2) * size, grav: grav,
          k: kind, rot: Math.random() * 6.3
        });
      }
    },

    ring: function (p, color, maxR, life, delay) {
      this.rings.push({ x: p.x, y: p.y, r: 0.1, maxR: maxR, life: -(delay || 0), max: life, color: color });
    },

    bolt: function (to, life, color) {
      var a = { x: to.x + rnd(-1.6, 1.6), y: to.y + rnd(-1.2, 1.2), z: (to.z || 0) + 11 };
      var b = { x: to.x, y: to.y, z: to.z || 0 };
      this.bolts.push({ a: a, b: b, life: 0, max: life, color: color || '#6fd0ff', path: boltPath(a, b), next: 0.05 });
    },

    word: function (p, text, color) {
      this.words.length = 0;
      this.words.push({ x: p.x, y: p.y, z: (p.z || 0) + 0.6, text: text, color: color, life: 0, max: 0.85 });
    },

    setElem: function (el) { this.elem = el; this.elemT = 0; this.emitAcc = 0; },
    clearElem: function () {
      this.elem = null; this.bolts.length = 0; this.gusts.length = 0; this.words.length = 0;
    },

    // The burst of the element right where the ball is struck.
    strike: function (p, el, big) {
      var c = PAL[el], m = big ? 1 : 0.6;
      if (el === 'fire') {
        this.burst(p, few(16 * m), c, 4.5, 2.5, 0.4, 0.1, -1.5, 'glow');
        this.burst(p, few(10 * m), ['#fff7c2', '#ffd23f'], 7, 3, 0.3, 0.05, 4, 'spark');
        this.flash = 0.12; this.flashColor = '#ffd9a8';
      } else if (el === 'thunder') {
        this.bolt(p, 0.42);
        this.burst(p, few(26), c, 8, 4, 0.35, 0.05, 2, 'spark');
        this.burst(p, few(10), ['#cfefff', '#6fd0ff'], 3, 1.5, 0.35, 0.22, 0, 'glow');
        this.flash = 0.16; this.flashColor = '#d8f0ff';
        this.word(p, 'Thunder smash', '#6fd0ff');
      } else if (el === 'ice') {
        this.burst(p, few(18 * m), c, 4.5, 2.5, 0.6, 0.09, 5, 'shard');
        this.burst(p, few(8 * m), ['#e6f7ff', '#9fe0ff'], 2.5, 1.5, 0.4, 0.18, 0, 'glow');
        this.flash = 0.14; this.flashColor = '#e6f7ff';
      } else if (el === 'wind') {
        for (var g = 0; g < 3; g++) this.gusts.push({ x: p.x, y: p.y, z: p.z, dx: 1, dy: 0, dz: 0, life: -g * 0.06, max: 0.45, r: 0.5 + g * 0.25, flat: true });
        this.burst(p, few(16 * m), c, 6, 2, 0.4, 0.05, 1, 'spark');
        this.flash = 0.1; this.flashColor = '#efffff';
      }
    },

    // Big landing (kill or ace) of an element ball: its own impact.
    impact: function (p, el) {
      var c = PAL[el], g = { x: p.x, y: p.y, z: 0.05 };
      this.marks.push({ x: p.x, y: p.y, life: 0, max: 3.2, size: 1.6, cracks: cracks(p, el === 'ice' ? 8 : 7, el === 'thunder' ? 1.7 : 1.3), color: CRACK[el], el: el });
      if (el === 'fire') {
        this.ring(p, '#ff7a2b', 2.4, 0.6);
        this.ring(p, '#ffd23f', 1.4, 0.45, 0.05);
        this.burst(g, few(26), c, 2.2, 5, 0.75, 0.2, -1, 'glow');
        this.burst(g, few(14), ['#fff7c2', '#ffd23f', '#ff9b3d'], 6, 4, 0.45, 0.05, 6, 'spark');
        this.flash = Math.max(this.flash, 0.1); this.flashColor = '#ffb37a';
      } else if (el === 'thunder') {
        this.bolt(p, 0.5);
        this.ring(p, '#6fd0ff', 2.8, 0.55);
        this.ring(p, '#ffffff', 1.6, 0.4, 0.06);
        this.burst(g, few(28), c, 8, 5, 0.4, 0.05, 6, 'spark');
        this.burst(g, few(8), ['#cfefff', '#6fd0ff'], 1.5, 2, 0.4, 0.3, 0, 'glow');
        this.flash = Math.max(this.flash, 0.14); this.flashColor = '#cfe9ff';
        this.shake = Math.max(this.shake, 12);
      } else if (el === 'ice') {
        this.ring(p, '#bfe9ff', 2.2, 0.7);
        this.burst(g, few(22), c, 3.5, 5, 0.9, 0.11, 7, 'shard');
        this.burst(g, few(8), ['#e6f7ff', '#9fe0ff'], 1.8, 1, 0.6, 0.25, 0, 'glow');
        this.flash = Math.max(this.flash, 0.12); this.flashColor = '#e6f7ff';
      } else if (el === 'wind') {
        this.ring(p, '#ffffff', 2.6, 0.5);
        this.ring(p, '#b8f5dc', 1.9, 0.55, 0.08);
        this.ring(p, '#ffffff', 1.2, 0.5, 0.16);
        for (var i = 0; i < few(18); i++) {
          var a = Math.random() * Math.PI * 2, r = rnd(0.2, 0.6);
          this.parts.push({ x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, z: rnd(0.05, 0.5), vx: -Math.sin(a) * 4 + Math.cos(a) * 1.5, vy: Math.cos(a) * 4 + Math.sin(a) * 1.5, vz: rnd(1, 3),
            life: 0, max: rnd(0.4, 0.7), color: c[i % c.length], size: 0.05, grav: 2, k: 'spark' });
        }
      }
    },

    // While the ball flies, its element sheds embers, sparks, frost or air.
    // Called by the renderer every frame with the ball's position and velocity.
    trail: function (b, v, dt) {
      var el = this.elem;
      if (!el || dt <= 0) return;
      var rate = { fire: 70, thunder: 30, ice: 34, wind: 14 }[el] * (SR.lowFx ? 0.5 : 1);
      this.emitAcc += dt * rate;
      var c = PAL[el];
      while (this.emitAcc >= 1) {
        this.emitAcc -= 1;
        var j = Math.random() * 0.12;
        var p = { x: b.x - v.x * j * 0.1 + rnd(-0.08, 0.08), y: b.y - v.y * j * 0.1 + rnd(-0.08, 0.08), z: b.z - v.z * j * 0.1 + rnd(-0.08, 0.08) };
        if (el === 'fire') {
          this.parts.push({ x: p.x, y: p.y, z: p.z, vx: v.x * 0.08 + rnd(-0.6, 0.6), vy: v.y * 0.08 + rnd(-0.6, 0.6), vz: v.z * 0.08 + rnd(0.3, 1.2),
            life: 0, max: rnd(0.22, 0.4), color: c[Math.floor(Math.random() * 4)], size: rnd(0.1, 0.2), grav: -2.5, k: 'glow' });
        } else if (el === 'thunder') {
          var a = Math.random() * Math.PI * 2;
          this.parts.push({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4, vz: rnd(-3, 3),
            life: 0, max: rnd(0.1, 0.2), color: c[Math.floor(Math.random() * 3)], size: 0.04, grav: 0, k: 'spark' });
        } else if (el === 'ice') {
          this.parts.push({ x: p.x, y: p.y, z: p.z, vx: v.x * 0.05 + rnd(-0.5, 0.5), vy: v.y * 0.05 + rnd(-0.5, 0.5), vz: rnd(-0.2, 0.6),
            life: 0, max: rnd(0.45, 0.7), color: c[Math.floor(Math.random() * 4)], size: rnd(0.05, 0.08), grav: 3, k: 'shard', rot: Math.random() * 6.3 });
        } else if (el === 'wind') {
          var l = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
          this.gusts.push({ x: b.x, y: b.y, z: b.z, dx: v.x / l, dy: v.y / l, dz: v.z / l, life: 0, max: 0.4, r: 0.35 });
          if (this.gusts.length > 14) this.gusts.shift();
        }
      }
    },

    emit: function (name, d) {
      if (this.parts.length > 600) this.parts.splice(0, 200);
      var p = d && d.pos;
      if (name === 'touch') {
        this.setElem(null);
        this.burst(p, 8, ['#ffffff', '#fff3c4'], 1.6, 1.2, 0.35, 0.05, 4);
      } else if (name === 'set') {
        this.setElem(null);
        this.burst(p, 6, ['#ffffff'], 1.0, 1.0, 0.3, 0.04, 3);
      } else if (name === 'spike') {
        var pw = d.power === undefined ? 0.6 : d.power;
        var el = pw >= THUNDER_AT ? 'thunder' : ballElem();
        this.setElem(el);
        this.burst(p, 14, ['#fff7c2', '#ffffff'], 4, 2.5, 0.35, 0.05, 6);
        this.strike(p, el, true);
        this.shake = Math.max(this.shake, el === 'thunder' ? 8 : 4);
        this.hitStop = el === 'thunder' ? 0.1 : 0.06;
        this.punch = 1;
      } else if (name === 'block') {
        // The spike's element shatters on the hands.
        var be = this.elem || 'ice';
        this.setElem(null);
        this.burst(p, 16, ['#9fd4ff', '#ffffff', '#5aa9ff'], 4, 2.5, 0.5, 0.07, 6);
        this.burst(p, few(14), PAL[be], 4.5, 3, 0.55, 0.09, 6, be === 'fire' ? 'glow' : be === 'ice' ? 'shard' : 'spark');
        this.shake = Math.max(this.shake, 6);
        this.hitStop = 0.08;
        this.punch = Math.max(this.punch, 0.8);
      } else if (name === 'serve') {
        var sp = d.power || 0.5;
        this.setElem(sp > 0.7 ? 'wind' : null);
        this.burst(p, 8 + Math.round(sp * 14), sp > 0.7 ? ['#fff7c2', '#ffd23f', '#ffffff'] : ['#ffffff', '#ffe28a'], 1.6 + sp * 2.4, 1.6, 0.35, 0.05, 5);
        if (sp > 0.7) { this.strike(p, 'wind', false); this.shake = Math.max(this.shake, 3); this.punch = Math.max(this.punch, 0.5); }
      } else if (name === 'net') {
        this.setElem(null);
        this.burst(p, 12, ['#ffffff', '#cccccc'], 1.5, 0.6, 0.5, 0.05, 6);
      } else if (name === 'land') {
        var big = d.kind === 'kill' || d.kind === 'ace' || d.kind === 'block';
        var le = this.elem;
        this.setElem(null);
        // Line call: a scuff where the ball hit, tagged IN or OUT.
        var call = d.reason === 'in' ? 'IN' : d.reason === 'out' ? 'OUT' : null;
        this.marks.push({ x: p.x, y: p.y, life: 0, max: 3.2, size: 1, call: call });
        this.ring(p, big ? '#ffd23f' : '#ffffff', big ? 1.8 : 1.0, big ? 0.7 : 0.5);
        this.burst({ x: p.x, y: p.y, z: 0.05 }, big ? 24 : 12, ['#f6d2a8', '#e9b47c', '#ffffff'], big ? 3 : 1.8, big ? 2.2 : 1.2, 0.6, 0.06, 7);
        if (big && le && d.kind !== 'block') this.impact(p, le);
        if (big) { this.shake = Math.max(this.shake, 9); this.cheer = 2.2; this.punch = Math.max(this.punch, 0.6); }
        else this.cheer = Math.max(this.cheer, 1.2);
      } else if (name === 'confetti') {
        var cols = [d.color, '#ffffff', '#ffd23f', d.color, '#ff6b9a', '#6fe3ff'];
        for (var i = 0; i < 160; i++) {
          this.parts.push({
            x: rnd(0, 18), y: rnd(-1, 10), z: rnd(5, 9), vx: rnd(-0.6, 0.6), vy: rnd(-0.6, 0.6), vz: rnd(-0.5, 0.5),
            life: 0, max: rnd(2.2, 3.6), color: cols[i % cols.length], size: rnd(0.07, 0.12), grav: 1.4, flutter: Math.random() * 6
          });
        }
        this.cheer = 3;
      }
    },

    update: function (dt) {
      this.shake = Math.max(0, this.shake - dt * 30);
      this.punch = Math.max(0, this.punch - dt * 3.5);
      this.cheer = Math.max(0, this.cheer - dt);
      this.flash = Math.max(0, this.flash - dt);
      this.elemT += dt;
      var ps = this.parts;
      for (var i = ps.length - 1; i >= 0; i--) {
        var q = ps[i];
        q.life += dt;
        if (q.life > q.max) { ps.splice(i, 1); continue; }
        q.vz -= q.grav * dt;
        if (q.flutter !== undefined) { q.vx += Math.sin(q.life * 5 + q.flutter) * dt; q.vz = Math.max(q.vz, -1.2); }
        else if (q.k === 'glow') { q.vx *= 1 - Math.min(1, dt * 3); q.vy *= 1 - Math.min(1, dt * 3); }
        if (q.rot !== undefined) q.rot += dt * 9;
        q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
        if (q.z < 0) { q.z = 0; q.vz *= -0.3; q.vx *= 0.6; q.vy *= 0.6; }
      }
      for (var m = this.marks.length - 1; m >= 0; m--) {
        this.marks[m].life += dt;
        if (this.marks[m].life > this.marks[m].max) this.marks.splice(m, 1);
      }
      for (var j = this.rings.length - 1; j >= 0; j--) {
        var r = this.rings[j];
        r.life += dt;
        r.r = r.maxR * Math.max(0, Math.min(1, r.life / r.max * 1.3));
        if (r.life > r.max) this.rings.splice(j, 1);
      }
      for (var b = this.bolts.length - 1; b >= 0; b--) {
        var bo = this.bolts[b];
        bo.life += dt;
        // Lightning flickers: it re-forks a few times while it lasts.
        if (bo.life > bo.next) { bo.path = boltPath(bo.a, bo.b); bo.next = bo.life + 0.06; }
        if (bo.life > bo.max) this.bolts.splice(b, 1);
      }
      for (var g = this.gusts.length - 1; g >= 0; g--) {
        this.gusts[g].life += dt;
        if (this.gusts[g].life > this.gusts[g].max) this.gusts.splice(g, 1);
      }
      for (var w = this.words.length - 1; w >= 0; w--) {
        this.words[w].life += dt;
        if (this.words[w].life > this.words[w].max) this.words.splice(w, 1);
      }
    }
  };

  SR.fx = fx;
})();
