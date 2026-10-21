// Visual effects: particles, ground rings, screen shake, crowd excitement.
// The rally calls SR.fx.emit(); the renderer calls update() and draw().
(function () {
  function rnd(a, b) { return a + Math.random() * (b - a); }

  var fx = {
    parts: [],
    rings: [],
    marks: [],     // ball marks left on the floor where it landed or bounced
    shake: 0,
    hitStop: 0,
    punch: 0,      // brief camera push-in on big hits
    cheer: 0,
    flash: 0,
    flashColor: '#ffffff',

    burst: function (p, n, colors, speed, up, life, size, grav) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, sp = rnd(0.3, 1) * speed;
        this.parts.push({
          x: p.x, y: p.y, z: p.z || 0,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: rnd(0.2, 1) * up,
          life: 0, max: rnd(0.6, 1) * life, color: colors[i % colors.length], size: rnd(0.6, 1.2) * size, grav: grav
        });
      }
    },

    ring: function (p, color, maxR, life) {
      this.rings.push({ x: p.x, y: p.y, r: 0.1, maxR: maxR, life: 0, max: life, color: color });
    },

    emit: function (name, d) {
      if (this.parts.length > 600) this.parts.splice(0, 200);
      var p = d && d.pos;
      if (name === 'touch') {
        this.burst(p, 8, ['#ffffff', '#fff3c4'], 1.6, 1.2, 0.35, 0.05, 4);
      } else if (name === 'set') {
        this.burst(p, 6, ['#ffffff'], 1.0, 1.0, 0.3, 0.04, 3);
      } else if (name === 'spike') {
        var hard = d.shot === 'power' || d.shot === 'line' || d.shot === 'cross' || d.shot === 'tool';
        this.burst(p, hard ? 26 : 10, hard ? ['#fff7c2', '#ffd23f', '#ff9b3d', '#ffffff'] : ['#ffffff', '#bfe9ff'], hard ? 5 : 2, hard ? 3 : 1.5, 0.45, hard ? 0.07 : 0.05, 6);
        if (hard) { this.shake = Math.max(this.shake, 4); this.flash = 0.18; this.flashColor = '#fff4c8'; this.hitStop = 0.06; this.punch = 1; }
      } else if (name === 'block') {
        this.burst(p, 22, ['#9fd4ff', '#ffffff', '#5aa9ff'], 4, 2.5, 0.5, 0.07, 6);
        this.shake = Math.max(this.shake, 6);
        this.hitStop = 0.08;
        this.punch = Math.max(this.punch, 0.8);
      } else if (name === 'serve') {
        var pw = d.power || 0.5;
        this.burst(p, 8 + Math.round(pw * 14), pw > 0.7 ? ['#fff7c2', '#ffd23f', '#ffffff'] : ['#ffffff', '#ffe28a'], 1.6 + pw * 2.4, 1.6, 0.35, 0.05, 5);
        if (pw > 0.7) { this.shake = Math.max(this.shake, 3); this.punch = Math.max(this.punch, 0.5); }
      } else if (name === 'net') {
        this.burst(p, 12, ['#ffffff', '#cccccc'], 1.5, 0.6, 0.5, 0.05, 6);
      } else if (name === 'land') {
        var big = d.kind === 'kill' || d.kind === 'ace' || d.kind === 'block';
        // Line call: a scuff where the ball hit, tagged IN or OUT.
        var call = d.reason === 'in' ? 'IN' : d.reason === 'out' ? 'OUT' : null;
        this.marks.push({ x: p.x, y: p.y, life: 0, max: 3.2, size: 1, call: call });
        this.ring(p, big ? '#ffd23f' : '#ffffff', big ? 1.8 : 1.0, big ? 0.7 : 0.5);
        this.burst({ x: p.x, y: p.y, z: 0.05 }, big ? 24 : 12, ['#f6d2a8', '#e9b47c', '#ffffff'], big ? 3 : 1.8, big ? 2.2 : 1.2, 0.6, 0.06, 7);
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

    mark: function (x, y, size) {
      if (this.marks.length > 12) this.marks.shift();
      this.marks.push({ x: x, y: y, life: 0, max: 2.2, size: size, call: null });
    },

    update: function (dt) {
      this.shake = Math.max(0, this.shake - dt * 30);
      this.punch = Math.max(0, this.punch - dt * 3.5);
      this.cheer = Math.max(0, this.cheer - dt);
      this.flash = Math.max(0, this.flash - dt);
      var ps = this.parts;
      for (var i = ps.length - 1; i >= 0; i--) {
        var q = ps[i];
        q.life += dt;
        if (q.life > q.max) { ps.splice(i, 1); continue; }
        q.vz -= q.grav * dt;
        if (q.flutter !== undefined) { q.vx += Math.sin(q.life * 5 + q.flutter) * dt; q.vz = Math.max(q.vz, -1.2); }
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
        r.r = r.maxR * Math.min(1, r.life / r.max * 1.3);
        if (r.life > r.max) this.rings.splice(j, 1);
      }
    }
  };

  SR.fx = fx;
})();
