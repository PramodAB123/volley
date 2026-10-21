// The rally: a state machine that moves players, flies the ball and makes
// every decision for the CPU (and for your team when you don't choose).
//
// Coordinates are world metres (see physics.js). Formation tables are written
// in a team's local frame: facing +x toward the net at x = 9, left side = high y.
// Team 1's local frame is team 0's rotated 180 degrees.
(function () {
  var C = SR.COURT, P = SR.phys;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function dist(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
  // Local <-> world is the same mapping both ways.
  function world(team, x, y) { return team === 0 ? { x: x, y: y } : { x: C.L - x, y: C.W - y }; }
  var local = world;

  // Formation slots by court position (1-6), team-local coordinates.
  var F = {
    base:    { 1: [2.6, 1.6], 2: [7.2, 1.6], 3: [7.2, 4.5], 4: [7.2, 7.4], 5: [2.6, 7.4], 6: [2.0, 4.5] },
    receive: { 1: [2.8, 1.8], 2: [6.4, 1.2], 3: [7.6, 4.5], 4: [5.0, 7.3], 5: [2.8, 7.1], 6: [2.3, 4.5] },
    defense: { 1: [2.3, 1.3], 2: [8.2, 1.6], 3: [8.2, 4.5], 4: [8.2, 7.4], 5: [2.3, 7.7], 6: [1.5, 4.5] },
    cover:   { 1: [3.6, 2.2], 5: [3.6, 6.8], 6: [3.0, 4.5] }
  };
  var APPROACH = { left: [5.6, 7.9], middle: [6.5, 4.7], right: [5.6, 1.1] };
  var HIT = { left: [8.1, 8.0], middle: [8.4, 4.0], right: [8.1, 1.0] };
  var SLOT_OF_POS = { 4: 'left', 3: 'middle', 2: 'right' };
  var SLOT_ORDER = { left: 0, middle: 1, right: 2 };
  var SET_SPOT = [8.2, 3.2];
  var SERVE_SPOT = [-0.9, 1.6];
  var REACT = 0.2, REACH = 0.8; // reaction time (s) and arm/lunge reach (m) for digs and passes

  SR.Rally = function (match, opts) {
    this.m = match;
    this.human = opts.human;          // 0 = you control team 0, 'both' = online, -1 = CPU plays both
    this.humans = [opts.human === 0 || opts.human === 'both', opts.human === 'both'];
    this.onPoint = opts.onPoint || function () {};
    this.t = 0;
    this.state = 'idle';
    this.stateT = 0;
    this.timeScale = 1;
    this.flight = null;
    this.bounce = null;
    this.ball = { x: 4, y: 4.5, z: 1 };
    this.banner = null;
    this.timer = null;
    this.touches = [0, 0];
    this.lastTouch = 0;
    this.lastOffense = null;
    // One set of prompts per team; `ui` is the local player's (team 0).
    this.uis = [0, 1].map(function (t) {
      return { prompt: null, aim: { x: t === 0 ? 13.5 : 4.5, y: 4.5 }, power: 0, hitters: [], hitterChoice: null, attackTarget: null, tip: false, shot: 'power', blockThreats: [], blockCall: 'read' };
    });
    this.ui = this.uis[0];
    this.commit = 'read';
    this.players = [[], []];
    for (var team = 0; team < 2; team++) {
      for (var i = 0; i < 6; i++) {
        var spd = match.ratings[team].speed;
        this.players[team].push({
          team: team, idx: i, role: SR.ROLES[i], num: SR.NUMBERS[i],
          x: 0, y: 0, z: 0, tx: 0, ty: 0, lock: false, jumpAt: -9, dive: 0,
          vx: 0, vy: 0, phase: 0, act: null, jumpKind: null, delayUntil: 0, face: team === 0 ? 1 : -1,
          yaw: team === 0 ? 0 : Math.PI, contactAt: 0, contactKind: null,
          speed: 4.2 + spd / 100 * 2.6
        });
      }
    }
  };

  var R = SR.Rally.prototype;

  R.all = function () { return this.players[0].concat(this.players[1]); };
  R.pos = function (p) { return this.m.posOf(p.team, p.idx); };
  R.isFront = function (p) { var q = this.pos(p); return q >= 2 && q <= 4; };
  R.setterOf = function (team) { return this.players[team][0]; };
  R.isHuman = function (team) { return !!this.humans[team]; };
  R.uiOf = function (team) { return this.uis[team || 0]; };
  R.clearPrompts = function () { this.uis.forEach(function (u) { u.prompt = null; }); };

  R.say = function (text, sub, color, dur) {
    this.banner = { text: text, sub: sub || '', color: color || '#ffffff', t: 0, dur: dur || 1.6 };
  };

  R.wait = function (sec, fn) { this.timer = { t: sec, fn: fn }; };

  R.fx = function (name, data) { if (SR.fx) SR.fx.emit(name, data); };

  R.act = function (p, type, dur) { p.act = { type: type, t: this.t, dur: dur }; };

  // ---- formations -------------------------------------------------------

  R.formation = function (team, phase) {
    var self = this, s = this.setterOf(team);
    this.players[team].forEach(function (p) {
      if (p.lock) return;
      var pos = self.pos(p), slot = null;
      if (phase === 'attack') {
        if (self.isFront(p)) slot = APPROACH[SLOT_OF_POS[pos]];
        else slot = F.cover[pos];
      } else if (phase === 'serve') {
        slot = pos === 1 ? SERVE_SPOT : F.base[pos];
      } else {
        slot = F[phase][pos];
        if (phase === 'receive' && p === s) slot = self.isFront(p) ? [7.8, 2.8] : [5.4, 0.7];
      }
      var w = world(team, slot[0], slot[1]);
      p.tx = w.x; p.ty = w.y;
    });
  };

  R.snap = function () {
    this.all().forEach(function (p) { p.x = p.tx; p.y = p.ty; p.z = 0; p.dive = 0; p.mvx = 0; p.mvy = 0; });
  };

  // ---- serve --------------------------------------------------------------

  R.startServe = function (opts) {
    var s = this.m.server;
    this.flight = null;
    this.bounce = null;
    this.touches = [0, 0];
    this.lastOffense = null;
    this.timeScale = 1;
    this.all().forEach(function (p) { p.lock = false; p.jumpAt = -9; p.jumpKind = null; p.act = null; p.delayUntil = 0; });
    this.setter = null;
    this.commit = 'read';
    this.formation(s, 'serve');
    this.formation(1 - s, 'receive');
    if (opts && opts.snap) this.snap();
    this.state = 'serve';
    this.stateT = 0;
    this.serveReady = false;
    this.toss = null;
    this.uis.forEach(function (u) { u.prompt = null; u.attackTarget = null; u.hitterChoice = null; });
    this.server = this.players[s][this.m.playerAt(s, 1)];
    this.all().forEach(function (p) { p.contactAt = 0; });
  };

  var TOSS_T = 0.8, TOSS_VZ = 6.05;

  // Start the serve: the server tosses the ball, steps in and jumps; the ball
  // is struck at the top of the jump (see update), then strike() sends it.
  R.serve = function (aim, power) {
    if (this.state !== 'serve' || this.toss) return;
    var s = this.m.server, p = this.server, dir = s === 0 ? 1 : -1;
    this.toss = { t0: this.t, aim: { x: aim.x, y: aim.y }, power: power, x0: p.x + dir * 0.35, y0: p.y };
    this.uis[s].prompt = null;
    p.jumpAt = this.t + TOSS_T - 0.2;
    p.jumpKind = 'serve';
    p.lock = true; p.tx = p.x + dir * 0.75; p.ty = p.y;
    SR.audio.play('set');
  };

  R.strike = function (aim, power) {
    var s = this.m.server, p = this.server, rt = this.m.ratings[s];
    var dir = s === 0 ? 1 : -1;
    this.toss = null;
    p.lock = false;
    var cp = { x: this.ball.x, y: this.ball.y, z: this.ball.z };
    var scatter = (0.3 + 1.0 * power) * (1.3 - rt.serve / 100);
    var tgt = { x: aim.x + gauss() * scatter, y: aim.y + gauss() * scatter, z: 0 };
    var T = 1.6 - 0.65 * power;
    var errChance = 0.03 + power * 0.1 * (1.3 - rt.serve / 100);
    if (Math.random() < errChance) {
      if (Math.random() < 0.5) { tgt = { x: C.NET_X + dir * 0.6, y: clamp(tgt.y, 0.5, 8.5), z: 1.0 }; }
      else tgt = this.pushOut(1 - s, tgt);
    } else {
      T = P.clearNet(cp, tgt, T, 0.15);
    }
    this.fx('serve', { pos: cp, power: power });
    this.launch(cp, tgt, T);
    this.state = 'rally';
    this.uis[s].prompt = null;
    this.lastTouch = s;
    this.lastOffense = { team: s, type: 'serve' };
    this.servePower = power;
    this.formation(s, 'defense');
    this.planReception(1 - s, 0);
    SR.audio.play('serve');
  };

  R.cpuServe = function () {
    var s = this.m.server, rt = this.m.ratings[s];
    var aim = world(1 - s, rnd(1.0, 7.0), rnd(0.8, 8.2));
    this.serve(aim, clamp(rnd(0.3, 0.85) * rt.serve / 80, 0.2, 1));
  };

  // Move a target point beyond the nearest boundary of a team's half.
  R.pushOut = function (team, tgt) {
    var l = local(team, tgt.x, tgt.y);
    var dBack = l.x, dRight = l.y, dLeft = C.W - l.y, m = Math.min(dBack, dRight, dLeft), d = rnd(0.4, 1.6);
    if (m === dBack) l.x = -d;
    else if (m === dRight) l.y = -d;
    else l.y = C.W + d;
    var w = world(team, l.x, l.y);
    return { x: w.x, y: w.y, z: 0 };
  };

  // ---- ball flight ------------------------------------------------------

  R.launch = function (p0, p1, T) {
    var v = P.solve(p0, p1, T);
    var f = { p0: { x: p0.x, y: p0.y, z: p0.z }, v: v, t: 0, events: [], landT: P.timeAtHeight(p0, v, 0) || T, netted: false };
    this.flight = f;
    this.ball = { x: p0.x, y: p0.y, z: p0.z };
    var tn = P.crossX(p0, v, C.NET_X);
    if (tn !== null && tn < f.landT) {
      var c = P.at(p0, v, tn);
      var self = this;
      // Ball meets the net (or the antenna area outside the posts counts as out on landing).
      if (c.z < C.NET_H && c.y > -0.3 && c.y < C.W + 0.3) this.at(tn, function () { self.netDrop(); });
    }
    return f;
  };

  R.at = function (t, fn) {
    if (this.flight) this.flight.events.push({ t: t, fn: fn, done: false });
  };

  R.netDrop = function () {
    var f = this.flight, b = this.ball, dir = f.v.x > 0 ? -1 : 1;
    var from = { x: C.NET_X + dir * 0.12, y: b.y, z: b.z };
    var tgt = { x: C.NET_X + dir * 0.7, y: clamp(b.y, 0.3, C.W - 0.3), z: 0 };
    this.launch(from, tgt, 0.45);
    this.flight.netted = true;
    this.fx('net', { pos: from });
    this.flight.events = [];
    SR.audio.play('block');
  };

  // Decide which player of `team` can play the current flight, and when.
  R.planReception = function (team, bonus) {
    var f = this.flight, self = this;
    if (!f) return;
    var L = P.at(f.p0, f.v, f.landT);
    var onSide = team === 0 ? L.x < C.NET_X : L.x > C.NET_X;
    if (!onSide) return;
    var out = L.x < -0.25 || L.x > C.L + 0.25 || L.y < -0.25 || L.y > C.W + 0.25;
    if (out && Math.random() > 0.06) return; // let it go
    var tc = P.timeAtHeight(f.p0, f.v, 1.0);
    if (tc === null || tc > f.landT - 0.04) tc = f.landT - 0.06;
    var pc = P.at(f.p0, f.v, tc);
    if ((team === 0) !== (pc.x < C.NET_X)) { tc = f.landT - 0.06; pc = P.at(f.p0, f.v, tc); }
    var best = null, bestArr = 1e9;
    this.players[team].forEach(function (p) {
      if (p === self.server && self.state === 'serve') return;
      var arr = REACT + Math.max(0, dist(p, pc) - REACH) / p.speed;
      if (arr < bestArr) { bestArr = arr; best = p; }
    });
    if (!best) return;
    var stretch = false;
    if (bestArr > tc + 0.02) {
      // Try a dive just before the ball hits the floor.
      var t2 = f.landT - 0.03, p2 = P.at(f.p0, f.v, t2), arr2 = REACT + Math.max(0, dist(best, p2) - REACH - 0.6) / best.speed;
      if (arr2 > t2 + 0.15) return; // nobody gets there
      tc = t2; pc = p2; stretch = true;
    }
    // Stand so the ball meets the forearm platform out in front, not the chest.
    // A dive is aimed so the ball lands on the outstretched arms.
    var fd = team === 0 ? 1 : -1, sx = pc.x - fd * 0.55, sy = pc.y;
    if (stretch) {
      var ddx = pc.x - best.x, ddy = pc.y - best.y, dl = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
      sx = pc.x - ddx / dl * 0.95; sy = pc.y - ddy / dl * 0.95;
    }
    best.lock = true; best.tx = sx; best.ty = sy;
    best.contactAt = this.t + tc - f.t; best.contactKind = stretch ? 'dive' : 'pass';
    best.contactPt = { x: pc.x, y: pc.y, z: pc.z };
    this.at(tc, function () { self.touch1(best, { stretch: stretch, bonus: bonus }); });
  };

  // ---- touches ------------------------------------------------------------

  R.touch1 = function (p, o) {
    if (this.state !== 'rally') return;
    var team = p.team, f = this.flight;
    var spd = P.speed(P.vel(f.v, f.t));
    var rating = this.m.ratings[team].pass;
    var serveHeat = (this.lastOffense && this.lastOffense.type === 'serve') ? this.servePower * 0.22 : 0;
    var q = clamp(0.28 + rating / 100 * 0.62 + rnd(-0.22, 0.22) - Math.max(0, spd - 11) * 0.022 - (o.stretch ? 0.2 : 0) + (o.bonus || 0) - serveHeat, 0, 1);
    p.lock = false;
    p.contactAt = 0;
    p.contactPt = { x: this.ball.x, y: this.ball.y, z: Math.max(0.3, this.ball.z) };
    p.dive = o.stretch ? 1 : 0;
    this.act(p, o.stretch ? 'dive' : 'pass', o.stretch ? 0.9 : 0.55);
    this.touches[team] = 1;
    this.touches[1 - team] = 0;
    this.lastTouch = team;
    var cp = { x: this.ball.x, y: this.ball.y, z: Math.max(0.3, this.ball.z) };
    SR.audio.play('pass');
    this.fx('touch', { pos: cp });

    if (q < (serveHeat > 0 ? 0.26 : 0.1)) { // shank out of play
      var l = local(team, cp.x, cp.y);
      var w = Math.random() < 0.5 ? world(team, rnd(-3, -1), l.y + rnd(-2, 2)) : world(team, rnd(1, 7), l.y < 4.5 ? rnd(-3, -1.2) : rnd(10.2, 12));
      this.launch(cp, { x: w.x, y: w.y, z: 0 }, 1.1);
      this.formation(team, 'defense');
      return;
    }
    if (q < 0.3 && Math.random() < 0.3) { this.freeBall(team, cp); return; }

    var e = 1 - q;
    var lx = clamp(SET_SPOT[0] + gauss() * e * 1.6, 3.5, 8.6), ly = clamp(SET_SPOT[1] + gauss() * e * 2.0, 0.5, 8.5);
    var tw = world(team, lx, ly), tgt = { x: tw.x, y: tw.y, z: 2.5 };
    var T = clamp(0.9 + dist(cp, tgt) * 0.06, 1.0, 1.6);
    this.launch(cp, tgt, T);

    // Setter: the real setter unless they made the pass or can't get there.
    var s = this.setterOf(team);
    if (s === p || 0.15 + dist(s, tgt) / s.speed > T) {
      var bestD = 1e9;
      this.players[team].forEach(function (c) {
        if (c === p) return;
        var d = dist(c, tgt);
        if (d < bestD) { bestD = d; s = c; }
      });
    }
    s.lock = true; s.tx = tgt.x; s.ty = tgt.y;
    this.setter = s;
    this.passQ = q;
    this.formation(team, 'attack');
    this.formation(1 - team, 'defense');
    var hitters = this.hitterOptions(team, s, q), ua = this.uis[team], ud = this.uis[1 - team];
    ua.hitters = hitters;
    if (this.isHuman(team)) { ua.prompt = 'hitter'; ua.hitterChoice = null; }
    // The defending side decides its block: you pick, the CPU sometimes guesses early.
    var def = 1 - team;
    this.commit = 'read';
    this.players[def].forEach(function (b) { b.jumpKind = null; });
    if (this.isHuman(def)) {
      ud.prompt = 'block';
      ud.blockCall = 'read';
      ud.blockThreats = hitters.map(function (h) { return h.p; });
      this.timeScale = 0.5;
    } else if (Math.random() < 0.22 && hitters.length) {
      this.commitBlock(def, hitters[Math.floor(Math.random() * hitters.length)].slot);
    }
    var self = this;
    this.at(T, function () { self.setBall(s); });
  };

  // Move the defending front row to the attacker's slot before the set.
  R.commitBlock = function (def, slot) {
    var self = this, att = 1 - def;
    this.commit = slot;
    var front = this.players[def].filter(function (b) { return self.isFront(b); });
    if (slot === 'read') { this.formation(def, 'defense'); return; }
    var hw = world(att, HIT[slot][0], HIT[slot][1]), hl = local(def, hw.x, hw.y);
    front.sort(function (a, b) { return local(def, a.x, a.y).y - local(def, b.x, b.y).y; });
    front.forEach(function (b, i) {
      var w = world(def, 8.55, clamp(hl.y + (i - (front.length - 1) / 2) * 0.6, 0.4, 8.6));
      b.tx = w.x; b.ty = w.y; b.jumpKind = 'block';
    });
  };

  R.hitterOptions = function (team, setter, q) {
    var self = this, list = [];
    this.players[team].forEach(function (p) {
      if (p === setter || !self.isFront(p)) return;
      list.push({ p: p, slot: SLOT_OF_POS[self.pos(p)] });
    });
    if (q < 0.42 && list.length > 1) list = list.filter(function (h) { return h.slot !== 'middle'; });
    list.sort(function (a, b) { return SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot]; });
    return list;
  };

  R.setBall = function (s) {
    if (this.state !== 'rally') return;
    var team = s.team, def = 1 - team, self = this;
    s.lock = false;
    this.act(s, 'set', 0.45);
    this.touches[team] = 2;
    this.lastTouch = team;
    this.lastOffense = null;
    var opts = this.hitterOptions(team, s, this.passQ);
    if (!opts.length) { this.freeBall(team, { x: this.ball.x, y: this.ball.y, z: this.ball.z }); return; }

    var pick = null;
    var ua = this.uis[team];
    if (this.isHuman(team) && ua.hitterChoice) {
      pick = opts.find(function (h) { return h.p === ua.hitterChoice; }) || null;
    }
    if (!pick) {
      var bestScore = -1e9, q = this.passQ;
      opts.forEach(function (h) {
        var hp = world(team, HIT[h.slot][0], HIT[h.slot][1]), near = 0;
        self.players[def].forEach(function (b) { if (self.isFront(b) && Math.abs(b.y - hp.y) < 1.5) near++; });
        var sc = Math.random() + (h.slot === 'left' ? 0.25 : 0) + (h.slot === 'middle' && q > 0.6 ? 0.2 : 0) - near * 0.25;
        if (sc > bestScore) { bestScore = sc; pick = h; }
      });
    }
    ua.prompt = null;
    var rt = this.m.ratings[team];
    var qs = clamp(0.35 + rt.pass / 100 * 0.4 + this.passQ * 0.25 + rnd(-0.15, 0.15), 0, 1);
    var e = 1 - qs, hx = clamp(HIT[pick.slot][0] + gauss() * e * 0.7, 6.5, 8.7), hy = clamp(HIT[pick.slot][1] + gauss() * e * 0.7, 0.3, 8.7);
    var hw = world(team, hx, hy), tgt = { x: hw.x, y: hw.y, z: 2.9 + rt.attack / 100 * 0.45 };
    var T = pick.slot === 'middle' ? 0.62 : 1.05;
    if (this.passQ < 0.45) T += 0.25;
    var cp = { x: this.ball.x, y: this.ball.y, z: this.ball.z };
    this.launch(cp, tgt, T);
    SR.audio.play('set');
    this.fx('set', { pos: cp });

    var h = pick.p;
    h.lock = true; h.tx = tgt.x; h.ty = tgt.y; h.jumpAt = this.t + T - 0.42; h.jumpKind = 'spike';
    this.hitter = h;
    this.setQ = qs;

    // Blockers: a correct early commit stacks the whole front row on the hitter,
    // a wrong one starts them late; otherwise the two nearest read and slide.
    var front = this.players[def].filter(function (b) { return self.isFront(b); });
    var hl = local(def, tgt.x, tgt.y), commit = this.commit;
    front.sort(function (a, b) {
      var la = local(def, a.x, a.y), lb = local(def, b.x, b.y);
      return Math.abs(la.y - hl.y) - Math.abs(lb.y - hl.y);
    });
    this.blockBonus = 1;
    var nBlock = front.length >= 2 ? 2 : front.length;
    if (commit !== 'read' && commit === pick.slot) { nBlock = front.length; this.blockBonus = 1.35; }
    var late = commit !== 'read' && commit !== pick.slot;
    var byOrder = front.slice().sort(function (a, b) { return local(def, a.x, a.y).y - local(def, b.x, b.y).y; });
    for (var i = 0; i < front.length; i++) {
      var b = front[i], by;
      if (i < nBlock) {
        if (nBlock === 3) by = hl.y + (byOrder.indexOf(b) - 1) * 0.6;
        else by = hl.y + (i === 0 ? 0 : (local(def, b.x, b.y).y > hl.y ? 0.55 : -0.55));
        by = clamp(by, 0.4, 8.6);
        b.jumpAt = this.t + T - 0.2;
        b.jumpKind = 'block';
      } else { by = local(def, b.x, b.y).y; b.jumpKind = null; }
      var bw = world(def, 8.55, by);
      b.tx = bw.x; b.ty = bw.y;
      if (late) b.delayUntil = this.t + 0.35;
    }
    if (this.isHuman(def)) this.uis[def].prompt = null;
    // Online both players see banners, so name the team that made the call.
    if (this.isHuman(def) && commit !== 'read') this.say(commit === pick.slot ? 'READ IT!' : 'WRONG GUESS', this.human === 'both' ? this.m.teams[def].name : '', commit === pick.slot ? '#ffd23f' : '#ff9e9e', 0.9);

    this.hitSlot = pick.slot;
    this.timeScale = 1;
    if (this.isHuman(team)) { ua.prompt = 'target'; ua.attackTarget = null; ua.tip = false; ua.shot = 'power'; this.timeScale = 0.35; }
    this.at(T, function () { self.attack(h); });
  };

  // Shot types. speed scales spike pace, block scales the chance of a block
  // touch, scatter scales aim error, err adds risk; auto shots aim themselves.
  SR.SHOTS = {
    power: { label: 'Power', speed: 1.0,  block: 1.0,  scatter: 1.0, err: 0 },
    line:  { label: 'Line',  speed: 0.95, block: 0.85, scatter: 0.8, err: 0.03, auto: true },
    cross: { label: 'Cross', speed: 0.95, block: 0.9,  scatter: 0.8, err: 0.01, auto: true },
    roll:  { label: 'Roll',  speed: 0.55, block: 0.6,  scatter: 0.6, err: -0.02, dig: 0.12 },
    tip:   { label: 'Tip',   speed: 0,    block: 0,    scatter: 0.4, err: -0.01, dig: 0.1 },
    tool:  { label: 'Tool',  speed: 0.9,  block: 1.3,  scatter: 0.7, err: 0.02, auto: true }
  };
  SR.SHOT_ORDER = ['power', 'line', 'cross', 'roll', 'tip', 'tool'];

  // Open spot on the defending court, farthest from defenders.
  R.openSpot = function (team) {
    var def = 1 - team, self = this, best = null, bestSc = -1e9;
    var spots = [[1.2, 1.0], [1.2, 8.0], [2.2, 0.7], [2.8, 8.3], [4.2, 2.8], [4.2, 6.2], [1.0, 4.5], [5.8, 1.2], [5.8, 7.8]];
    spots.forEach(function (s) {
      var w = world(def, s[0], s[1]), md = 1e9;
      self.players[def].forEach(function (p) { md = Math.min(md, dist(p, w)); });
      var sc = md + rnd(0, 1.2);
      if (sc > bestSc) { bestSc = sc; best = w; }
    });
    return best;
  };

  // Where a shot type goes when nobody clicked a spot.
  R.shotTarget = function (team, shot, from) {
    var def = 1 - team, l = local(def, from.x, from.y), lowSide = l.y < C.W / 2;
    if (Math.abs(l.y - C.W / 2) < 1.2) lowSide = Math.random() < 0.5;
    var w;
    if (shot === 'line') w = world(def, rnd(0.8, 2.2), lowSide ? rnd(0.6, 1.1) : rnd(7.9, 8.4));
    else if (shot === 'cross') w = world(def, rnd(1.2, 3.8), lowSide ? rnd(7.4, 8.3) : rnd(0.7, 1.6));
    else if (shot === 'tool') w = world(def, rnd(1.5, 4), lowSide ? rnd(0.7, 1.0) : rnd(8.0, 8.3));
    else if (shot === 'tip') w = world(def, rnd(6.3, 7.6), rnd(1.5, 7.5));
    else if (shot === 'roll') w = world(def, rnd(2.5, 4.5), rnd(2.5, 6.5));
    else w = this.openSpot(team);
    return w;
  };

  R.aiShot = function () {
    var r = Math.random();
    return r < 0.45 ? 'power' : r < 0.6 ? 'line' : r < 0.75 ? 'cross' : r < 0.85 ? 'roll' : r < 0.93 ? 'tip' : 'tool';
  };

  R.attack = function (h) {
    if (this.state !== 'rally') return;
    var team = h.team, def = 1 - team, rt = this.m.ratings[team], self = this;
    h.lock = false;
    this.timeScale = 1;
    var ua = this.uis[team];
    ua.prompt = null;
    var cp = { x: this.ball.x, y: this.ball.y, z: this.ball.z };
    var shot, aim;
    if (this.isHuman(team)) {
      shot = ua.tip ? 'tip' : (ua.shot || 'power');
      aim = ua.attackTarget || this.shotTarget(team, shot, cp);
    } else {
      shot = this.aiShot();
      aim = this.shotTarget(team, shot, cp);
    }
    var S = SR.SHOTS[shot], tip = shot === 'tip', qs = this.setQ;
    this.lastShot = shot;
    h.shotKind = shot;
    var tgt = { x: aim.x, y: aim.y, z: 0 };

    var l = local(def, tgt.x, tgt.y), edge = Math.min(l.x, l.y, C.W - l.y);
    var errChance = 0.04 + S.err + (1 - qs) * 0.1 - (rt.attack - 75) * 0.002 + (edge < 0.5 ? (0.5 - edge) * 0.3 : 0);
    var scatter = (0.2 + (1 - qs) * 0.8 + (1 - rt.attack / 100) * 0.6) * S.scatter;
    tgt.x += gauss() * scatter; tgt.y += gauss() * scatter;
    var netErr = false;
    if (Math.random() < errChance) {
      if (Math.random() < 0.5) { netErr = true; tgt = { x: C.NET_X + (def === 1 ? 0.6 : -0.6), y: clamp(cp.y + rnd(-1, 1), 0.3, 8.7), z: 0.9 }; }
      else tgt = this.pushOut(def, tgt);
    }
    var vs = (16 + rt.attack * 0.09) * (0.78 + 0.22 * qs) * (S.speed || 1);
    var d3 = Math.sqrt(Math.pow(tgt.x - cp.x, 2) + Math.pow(tgt.y - cp.y, 2) + Math.pow(tgt.z - cp.z, 2));
    var T = tip ? 0.95 : d3 / vs;
    if (!netErr) T = P.clearNet(cp, tgt, T, shot === 'roll' ? 0.5 : 0.12);
    this.launch(cp, tgt, T);
    this.lastTouch = team;
    this.lastOffense = { team: team, type: 'attack' };
    this.touches[def] = 0;
    this.formation(team, 'defense');
    SR.audio.play(tip || shot === 'roll' ? 'set' : 'spike');
    this.fx('spike', { pos: cp, shot: shot });
    if (netErr) return;

    if (!tip) {
      var f = this.flight, tn = P.crossX(f.p0, f.v, C.NET_X);
      if (tn !== null && tn < f.landT) {
        var cross = P.at(f.p0, f.v, tn), nb = 0;
        this.players[def].forEach(function (b) {
          if (self.isFront(b) && Math.abs(b.y - cross.y) < 0.9 && Math.abs(b.x - C.NET_X) < 1.2) nb++;
        });
        var rd = this.m.ratings[def];
        var pTouch = cross.z < 3.45 ? Math.min(0.85, nb * 0.22 * (rd.block / 75) * (1.15 - rt.attack / 200) * S.block * (this.blockBonus || 1)) : 0;
        if (Math.random() < pTouch) {
          var r = Math.random(), outcome;
          if (shot === 'tool') outcome = r < 0.75 ? 'out' : r < 0.88 ? 'soft' : 'stuff';
          else outcome = r < 0.28 ? 'stuff' : r < 0.78 ? 'soft' : 'out';
          this.at(tn, function () { self.blockResult(outcome, def, cross); });
          return;
        }
      }
    }
    this.planReception(def, S.dig || 0);
  };

  R.blockResult = function (outcome, def, cross) {
    if (this.state !== 'rally') return;
    var att = 1 - def, side = def === 1 ? 1 : -1; // side: +1 means the blockers' half is high x
    this.lastTouch = def;
    SR.audio.play('block');
    this.fx('block', { pos: cross });
    var from, tw;
    if (outcome === 'stuff') {
      var la = local(att, cross.x, cross.y);
      tw = world(att, rnd(5.5, 8.2), clamp(la.y + rnd(-1, 1), 0.3, 8.7));
      from = { x: C.NET_X - side * 0.15, y: cross.y, z: Math.max(2.5, cross.z) };
      this.launch(from, { x: tw.x, y: tw.y, z: 0 }, 0.42);
      this.lastOffense = { team: def, type: 'block' };
      this.touches[att] = 0;
      if (Math.random() < 0.35) this.planReception(att, -0.15); // block cover is rarely there in time
    } else if (outcome === 'soft') {
      tw = world(def, rnd(3, 6.5), rnd(1.5, 7.5));
      from = { x: C.NET_X + side * 0.15, y: cross.y, z: cross.z + 0.2 };
      this.launch(from, { x: tw.x, y: tw.y, z: 0 }, 1.25);
      this.touches[def] = 0;
      this.planReception(def, 0.25);
    } else {
      var wy = cross.y < C.W / 2 ? rnd(-3, -1.2) : rnd(10.2, 12);
      var wx = C.NET_X + side * rnd(1, 7);
      from = { x: cross.x, y: cross.y, z: cross.z };
      this.launch(from, { x: wx, y: wy, z: 0 }, 1.0);
    }
  };

  R.freeBall = function (team, from) {
    var opp = 1 - team, w = world(opp, rnd(2.5, 7), rnd(1.5, 7.5)), tgt = { x: w.x, y: w.y, z: 0 };
    var T = P.clearNet(from, tgt, 1.4, 0.4);
    this.launch(from, tgt, T);
    this.lastTouch = team;
    this.lastOffense = null;
    this.clearPrompts();
    this.formation(team, 'defense');
    this.formation(opp, 'defense');
    this.planReception(opp, 0.25);
  };

  // ---- end of rally -------------------------------------------------------

  R.land = function () {
    if (this.state !== 'rally') return;
    var b = this.ball, f = this.flight, winner, reason;
    var inside = b.x >= -0.05 && b.x <= C.L + 0.05 && b.y >= -0.05 && b.y <= C.W + 0.05;
    if (f && f.netted) { reason = 'net'; winner = b.x < C.NET_X ? 1 : 0; }
    else if (inside) { reason = 'in'; winner = b.x < C.NET_X ? 1 : 0; }
    else { reason = 'out'; winner = 1 - this.lastTouch; }
    var lo = this.lastOffense, kind;
    if (lo && lo.team === winner && reason !== 'net') kind = { serve: 'ace', attack: 'kill', block: 'block' }[lo.type];
    else kind = reason === 'in' ? 'point' : 'error';

    this.state = 'dead';
    this.stateT = 0;
    this.timeScale = 1;
    this.clearPrompts();
    var v = f ? P.vel(f.v, f.t) : { x: 0, y: 0, z: -3 };
    this.bounce = { x: b.x, y: b.y, z: 0, vx: v.x * 0.5, vy: v.y * 0.5, vz: Math.abs(v.z) * 0.45 };
    this.flight = null;
    this.all().forEach(function (p) { p.lock = false; });
    this.formation(0, 'base');
    this.formation(1, 'base');
    var me = this, t0 = this.t;
    // Winners jog together and celebrate on arrival; the others drop their heads.
    this.players[winner].forEach(function (p, i) {
      var a = i / 6 * Math.PI * 2, w = world(winner, 5.2 + Math.cos(a) * 0.95, 4.5 + Math.sin(a) * 0.95);
      p.tx = w.x; p.ty = w.y;
      p.act = { type: 'cheer', t: t0 + 0.35 + Math.random() * 0.15, dur: 1.0 };
    });
    this.players[1 - winner].forEach(function (p) { me.act(p, 'sad', 1.0 + Math.random() * 0.4); p.contactAt = 0; });

    var name = this.m.teams[winner].name, color = this.m.teams[winner].color;
    var label = { ace: 'ACE!', kill: 'KILL!', block: 'BLOCK!', point: 'POINT' }[kind] || (reason === 'net' ? 'NET' : 'OUT');
    this.say(label, name, color, 1.5);
    SR.audio.play('bounce');
    SR.audio.play('whistle');
    this.fx('land', { pos: { x: b.x, y: b.y }, kind: kind, reason: reason });
    var self = this, info = { winner: winner, reason: reason, kind: kind };
    this.wait(1.2, function () { self.onPoint(winner, info); });
  };

  // ---- player input -------------------------------------------------------

  // Each takes the team making the call; the local player is team 0.
  R.setAim = function (pt, team) {
    var u = this.uiOf(team);
    var lo = this.m.server === 0 ? C.NET_X + 0.3 : -1, hi = this.m.server === 0 ? C.L + 1 : C.NET_X - 0.3;
    u.aim = { x: clamp(pt.x, lo, hi), y: clamp(pt.y, -1, C.W + 1) };
  };

  // `power` lets an online player send the power they saw when they pressed.
  R.humanServe = function (team, power) {
    team = team || 0;
    if (this.state === 'serve' && this.serveReady && !this.toss && this.m.server === team && this.isHuman(team) && this.stateT - this.readyT > 0.2) {
      var u = this.uiOf(team);
      this.serve(u.aim, typeof power === 'number' ? clamp(power, 0, 1) : u.power);
    }
  };

  R.pickHitter = function (p, team) {
    var u = this.uiOf(team);
    if (u.prompt !== 'hitter') return;
    if (u.hitters.some(function (h) { return h.p === p; })) { u.hitterChoice = p; if (!team) SR.audio.play('click'); }
  };

  R.pickHitterIndex = function (i, team) {
    var h = this.uiOf(team).hitters[i];
    if (h) this.pickHitter(h.p, team);
  };

  R.pickShot = function (id, team) {
    var u = this.uiOf(team);
    if (u.prompt !== 'target' || !SR.SHOTS[id]) return;
    u.shot = id;
    u.tip = false;
    if (!team) SR.audio.play('click');
    if (SR.SHOTS[id].auto && this.hitter) {
      u.attackTarget = this.shotTarget(this.hitter.team, id, this.hitter);
      this.timeScale = 1;
    }
  };

  // Block call, named by screen side as seen from the caller's own end:
  // Left / Middle / Right / Read.
  R.pickBlock = function (id, team) {
    team = team || 0;
    var u = this.uiOf(team);
    if (u.prompt !== 'block') return;
    var slotFor = { left: 'right', middle: 'middle', right: 'left' };
    var slot = id === 'read' ? 'read' : slotFor[id];
    if (!slot) return;
    u.blockCall = id;
    this.commitBlock(team, slot);
    this.timeScale = 1;
    if (!team) SR.audio.play('click');
  };

  R.pickTarget = function (pt, tip, team) {
    var u = this.uiOf(team);
    if (u.prompt !== 'target') return;
    u.attackTarget = { x: pt.x, y: pt.y };
    u.tip = !!tip;
    if (tip) u.shot = 'tip';
    if (SR.SHOTS[u.shot].auto) u.shot = 'power';
    this.timeScale = 1;
    if (!team) SR.audio.play('click');
  };

  // ---- simulation step ----------------------------------------------------

  R.update = function (dt) {
    this.t += dt;
    this.stateT += dt;
    if (this.banner) { this.banner.t += dt; if (this.banner.t > this.banner.dur) this.banner = null; }
    if (this.timer) {
      this.timer.t -= dt;
      if (this.timer.t <= 0) { var fn = this.timer.fn; this.timer = null; fn(); }
    }
    this.movePlayers(dt);

    if (this.state === 'serve') {
      var sp = this.server, dir = sp.team === 0 ? 1 : -1, tz = this.toss;
      if (tz) {
        // Ball rises from the hand and drifts forward to meet the jumping server.
        var k = this.t - tz.t0, f = Math.min(1, k / TOSS_T);
        this.ball = { x: tz.x0 + dir * 0.45 * f, y: tz.y0, z: 1.3 + TOSS_VZ * k - 4.9 * k * k };
        if (k >= TOSS_T) this.strike(tz.aim, tz.power);
      } else {
        this.uis[this.m.server].power = this.serveReady ? (1 - Math.cos((this.stateT - this.readyT) * 3.4)) / 2 : 0;
        this.ball = { x: sp.x + dir * 0.35, y: sp.y, z: 1.15 + Math.abs(Math.sin(this.stateT * 4)) * 0.25 };
      }
      if (!this.serveReady && dist(sp, { x: sp.tx, y: sp.ty }) < 0.12) {
        this.serveReady = true;
        this.readyT = this.stateT;
        this.cpuServeAt = this.stateT + rnd(0.6, 1.1);
        if (this.isHuman(this.m.server)) this.uis[this.m.server].prompt = 'serve';
      }
      if (this.serveReady && !this.toss && !this.isHuman(this.m.server) && this.stateT > this.cpuServeAt) this.cpuServe();
      // Online, nobody can stall the match: an idle server serves after 15 s.
      if (this.serveReady && !this.toss && this.human === 'both' && this.stateT - this.readyT > 15) this.serve(this.uis[this.m.server].aim, 0.5);
    }

    var f = this.flight;
    if (f && this.state === 'rally') {
      f.t += dt;
      var b = P.at(f.p0, f.v, Math.min(f.t, f.landT));
      this.ball = b;
      for (var i = 0; i < f.events.length; i++) {
        var ev = f.events[i];
        if (!ev.done && f.t >= ev.t) {
          ev.done = true;
          ev.fn();
          if (this.flight !== f) break; // a new hit replaced this flight
        }
      }
      if (this.flight === f && f.t >= f.landT) this.land();
    }

    if (this.bounce) {
      var bo = this.bounce;
      bo.vz -= C.G * dt;
      bo.x += bo.vx * dt; bo.y += bo.vy * dt; bo.z += bo.vz * dt;
      if (bo.z < 0) { bo.z = 0; bo.vz = -bo.vz * 0.45; bo.vx *= 0.7; bo.vy *= 0.7; }
      this.ball = { x: bo.x, y: bo.y, z: bo.z };
    }
  };

  R.movePlayers = function (dt) {
    var t = this.t, self = this, ball = this.ball;
    this.all().forEach(function (p) {
      var dx = p.tx - p.x, dy = p.ty - p.y, d = Math.sqrt(dx * dx + dy * dy);
      var hurry = (self.state === 'serve' || self.state === 'dead') ? 1.45 : 1;
      var ox = p.x, oy = p.y;
      // Accelerate into a run and ease off on arrival instead of starting and
      // stopping at full speed.
      var vmax = p.speed * (p.lock ? 1.7 : hurry), acc = p.lock ? 24 : 12, dec = p.lock ? 16 : 7;
      // A receiver hustles hard enough to be set before the ball arrives.
      if (p.lock && p.contactAt > t + 0.02) { vmax = Math.min(11, Math.max(vmax, d / (p.contactAt - t - 0.02) * 1.2)); acc = 40; dec = 30; }
      var want = (t < p.delayUntil || d < 0.002) ? 0 : Math.min(vmax, Math.sqrt(2 * dec * d));
      var wx = d > 0.002 ? dx / d * want : 0, wy = d > 0.002 ? dy / d * want : 0;
      var mx = p.mvx || 0, my = p.mvy || 0, ex = wx - mx, ey = wy - my, el = Math.sqrt(ex * ex + ey * ey), dv = acc * dt;
      if (el > dv) { mx += ex / el * dv; my += ey / el * dv; } else { mx = wx; my = wy; }
      p.mvx = mx; p.mvy = my;
      var stx = mx * dt, sty = my * dt;
      if (stx * stx + sty * sty >= d * d && stx * dx + sty * dy > 0) { p.x = p.tx; p.y = p.ty; } else { p.x += stx; p.y += sty; }
      // Smoothed velocity drives the running animation.
      p.vx += ((p.x - ox) / dt - p.vx) * Math.min(1, dt * 12);
      p.vy += ((p.y - oy) / dt - p.vy) * Math.min(1, dt * 12);
      p.phase += Math.sqrt((p.x - ox) * (p.x - ox) + (p.y - oy) * (p.y - oy)) * 5.2;
      // Turn to track the ball (within 70 degrees of facing the net).
      var base = p.team === 0 ? 0 : Math.PI;
      want = base;
      var bdx = ball.x - p.x, bdy = ball.y - p.y;
      if (bdx * bdx + bdy * bdy > 0.4) {
        var off = Math.atan2(bdy, bdx) - base;
        off = Math.atan2(Math.sin(off), Math.cos(off));
        want = base + clamp(off, -1.2, 1.2);
      }
      var dy2 = Math.atan2(Math.sin(want - p.yaw), Math.cos(want - p.yaw));
      p.yaw += dy2 * Math.min(1, dt * 7);
      var jt = (t - p.jumpAt) / 0.75;
      p.z = (jt >= 0 && jt <= 1) ? 4 * 0.85 * jt * (1 - jt) : 0;
      if (p.dive > 0) p.dive = Math.max(0, p.dive - dt * 1.2);
    });
  };
})();
