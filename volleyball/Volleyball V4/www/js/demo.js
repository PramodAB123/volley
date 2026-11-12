// How to play: a hands-on tutorial on the real engine. In Try it mode (the
// default) the rally freezes at each call, the court dims except for the spot
// to tap, a finger shows where, and one short line says what to do; the step
// moves on as soon as you get it right. Watch mode plays the same scenes by
// itself. rally.script fixes the dice so every scene plays out as planned
// (see the `script` checks in rally.js).
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var D = SR.demo = { active: false };
  var game = null, rally = null, from = 'help';
  var ch = 0, bi = 0, started = false, bt = 0, waitT = 0, retries = 0, playing = true;
  var mode = 'try', calls = [], nudged = 0, waiting = false, finished = false;
  var ptr = { x: 0, y: 0, a: 0, tapAt: -9, seen: false }, spec = null;

  // ---- helpers for chapter scripts ----------------------------------------

  function prompt(name) { return function (r) { return r.ui.prompt === name; }; }
  function dead(r) { return r.state === 'dead'; }
  function inPlay(r) { return r.state === 'rally'; }
  function their(r) { return r.lastOffense && r.lastOffense.type === 'attack' && r.lastOffense.team === 1; }

  function smooth(k) { return k * k * (3 - 2 * k); }
  // Point along a path of [x, y] world spots, eased between stops.
  function along(pts, k) {
    var n = pts.length - 1, s = Math.min(n - 1e-6, Math.max(0, k) * n), i = Math.floor(s), f = smooth(s - i);
    return { x: pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, y: pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f };
  }
  function aimAt(r) { return { w: [r.ui.aim.x, r.ui.aim.y] }; }
  function sweep(pts) { return function (r, k) { r.setAim(along(pts, k)); }; }
  // Calls you made since the current beat began (Try it mode).
  function called(kind, arg) { return calls.some(function (c) { return c[0] === kind && (arg === undefined || c[1] === arg); }); }
  function powerReady(lo, hi) { return function (r) { return r.ui.power >= lo && r.ui.power <= hi; }; }

  // The CPU's serve in the scenes where you receive: an easy ball to your passer.
  var EASY_SERVE = [3.2, 4.4, 0.45];
  // Your serve straight at their passer, so they can set up an attack.
  var SERVE_TO_PASSER = [[13.5, 4.5], [15.0, 3.6], [15.6, 4.6]];

  function tapSpot(x, y, say, youSay) {
    return { wait: prompt('target'), slow: 0.05, say: say, aim: { w: [x, y] }, dur: 2.2, act: function (r) { r.pickTarget({ x: x, y: y }, false); },
      you: function (r) { return called('target') || !!r.ui.attackTarget; }, youSay: youSay };
  }

  // ---- the chapters ---------------------------------------------------------
  // Each beat: say = the one short line (both modes), you = Try it: the step is
  // done when this returns true, youSay = what to do, youWrong = after a wrong
  // call, win = the success line on the last beat. aim = where the finger and
  // the spotlight go ({ w: [x, y] } court spot, { zone: 1 } their whole court,
  // { head: i } a hitter's number, { btn: id } a block button).

  var THEIR_COURT = { zone: 1 };

  var CH = [
    {
      name: 'Serve', icon: 'serve',
      server: 0, script: { noDig: 1 },
      beats: [
        { wait: prompt('serve'), say: 'Aim your serve at their court', aim: aimAt, dur: 3,
          during: sweep([[13.5, 4.5], [15.6, 2.4], [15.2, 7.0], [12.6, 4.8]]),
          you: function (r) { return !!r.toss || r.state !== 'serve'; }, youAim: THEIR_COURT, youSlow: 1,
          youSay: 'Tap their court to serve' },
        { say: 'Serve!', aim: aimAt, dur: 1.2, ready: powerReady(0.56, 0.7), act: function (r) { r.humanServe(); }, youSkip: true },
        { wait: dead, say: 'Ace!', win: 'Ace!', dur: 2.2, end: true }
      ]
    },
    {
      name: 'Set', icon: 'set',
      server: 1, script: { cpuServe: EASY_SERVE, noDig: 1 },
      beats: [
        { wait: inPlay, slow: 0.6, say: 'Your team passes it up', dur: 1.2 },
        { wait: prompt('hitter'), slow: 0.05, say: 'Pick a hitter', aim: { head: 0 }, dur: 2, act: function (r) { r.pickHitterIndex(0); },
          you: function () { return called('hitter'); }, youSay: 'Tap a number to set that hitter' },
        tapSpot(13.4, 4.5, 'Aim the spike', 'Tap where to spike'),
        { wait: dead, say: 'Kill!', win: 'Kill!', dur: 2, end: true }
      ]
    },
    {
      name: 'Spike', icon: 'spike',
      server: 1, script: { cpuServe: EASY_SERVE, noDig: 1 },
      beats: [
        { wait: prompt('hitter'), fast: 2, slow: 0.08, say: 'Set hitter 3', aim: { head: 2 }, dur: 1.4, act: function (r) { r.pickHitterIndex(2); },
          you: function () { return called('hitter'); }, youSay: 'Tap hitter 3', youWrong: 'Tap number 3' },
        tapSpot(16.2, 7.6, 'Hit the open corner', 'Tap the open corner'),
        { wait: dead, say: 'Corner kill!', win: 'Corner kill!', dur: 2, end: true }
      ]
    },
    {
      name: 'Block', icon: 'block',
      server: 0, script: { cpuHitter: 'right', block: 'stuff' },
      beats: [
        { wait: prompt('serve'), say: 'You serve, they attack', aim: aimAt, dur: 1.4, during: sweep(SERVE_TO_PASSER), act: function (r) { r.humanServe(); } },
        { wait: prompt('block'), slow: 0.05, say: 'Block left', aim: { btn: 'left' }, dur: 2, act: function (r) { r.pickBlock('left'); },
          you: function () { return called('block', 'left'); }, youSay: 'Tap LEFT to block', youWrong: 'The set goes left: tap LEFT' },
        { slow: 0.3, say: 'Wall up!', dur: 1.2 },
        { wait: dead, say: 'Stuff block!', win: 'Stuff block!', dur: 2.2, end: true }
      ]
    },
    {
      name: 'Read', icon: 'read',
      server: 0, script: { cpuHitter: 'left', cpuAim: [2.2, 4.3] },
      beats: [
        { wait: prompt('serve'), say: 'Serve again', aim: aimAt, dur: 1.2, during: sweep(SERVE_TO_PASSER), act: function (r) { r.humanServe(); } },
        { wait: prompt('block'), slow: 0.05, say: 'Not sure? Read it', aim: { btn: 'read' }, dur: 2, act: function (r) { r.pickBlock('read'); },
          you: function () { return called('block', 'read'); }, youSay: 'Not sure? Tap READ', youWrong: 'Tap READ' },
        { wait: their, slow: 0.12, say: 'Dig!', aim: { w: [2.2, 4.3] }, dur: 1.4 },
        { wait: prompt('hitter'), enter: function (r) { r.script.noDig = 1; }, slow: 0.5, say: 'Your setter picks', dur: 1 },
        tapSpot(13.4, 4.5, 'Aim the spike', 'Tap where to spike'),
        { wait: dead, say: 'Point!', win: 'Point!', dur: 2.2, end: true }
      ]
    }
  ];

  // ---- staging --------------------------------------------------------------

  function clearFx() {
    var fx = SR.fx;
    fx.parts.length = 0; fx.rings.length = 0; fx.marks.length = 0;
    if (fx.clearElem) fx.clearElem();
    fx.shake = fx.hitStop = fx.punch = fx.cheer = fx.flash = 0;
  }

  function stage(c) {
    var m = game.match;
    if (Math.max(m.score[0], m.score[1]) >= 12) m.score = [0, 0];
    m.rot = [0, 0];
    rally.banner = null; rally.timer = null; rally.loopScale = 1;
    rally.script = c.script ? JSON.parse(JSON.stringify(c.script)) : null;
    clearFx();
    if (c.stage === 'idle') {
      rally.flight = null; rally.bounce = null; rally.toss = null;
      rally.state = 'idle'; rally.clearPrompts();
      rally.all().forEach(function (p) { p.lock = false; p.act = null; p.jumpAt = -9; p.contactAt = 0; p.delayUntil = 0; });
      rally.formation(0, 'base'); rally.formation(1, 'base'); rally.snap();
      rally.ball = { x: 5.4, y: 4.5, z: 0.11 };
      m.server = 0;
    } else {
      m.server = c.server;
      rally.startServe({ snap: true });
    }
  }

  function go(i, again) {
    ch = Math.max(0, Math.min(CH.length - 1, i));
    bi = 0; started = false; bt = 0; waitT = 0; spec = null; waiting = false; finished = false;
    stage(CH[ch]);
    panel();
    if (again) say('Let’s try that again', 'bad');
  }

  // ---- director ---------------------------------------------------------------

  D.tick = function (dt) {
    if (!game || SR.game !== game) { if (D.active) D.stop(true); return; }
    if (!playing || finished) return;
    var c = CH[ch], b = c.beats[bi];
    if (!b) { rally.loopScale = 1; return; }
    if (!started) {
      if (mode === 'try' && b.youSkip) { bi++; return; }
      if (b.wait && !b.wait(rally)) {
        rally.loopScale = b.fast || 1;
        waitT += dt;
        // Off script (the rally ended early or stalled): replay the scene.
        if ((rally.state === 'dead' && b.wait !== dead && rally.stateT > 0.4) || waitT > 16) {
          if (retries++ < 2) go(ch, true); else next();
        }
        return;
      }
      started = true; bt = 0; waitT = 0; calls = []; nudged = 0;
      if (b.enter) b.enter(rally);
      rally.loopScale = b.slow || 1;
      spec = b.aim || null;
      if (yours(b)) {
        // Freeze the moment until you make the call.
        rally.loopScale = b.youSlow || (b.slow < 1 ? 0.015 : 1);
        if (b.youAim !== undefined) spec = b.youAim;
        waiting = true;
        say(b.youSay || b.say, 'you');
      } else if (b.end) {
        say(b.win || b.say, 'win');
        SR.audio.play('reward');
        markDone(ch);
      } else say(b.say, 'info');
    }
    if (yours(b)) {
      if (!b.you(rally)) {
        if (calls.length > nudged) { nudged = calls.length; if (b.youWrong) say(b.youWrong, 'bad'); }
        return;
      }
      waiting = false;
      SR.audio.play('emote');
      if (b.end) { retries = 0; next(); return; }
      bi++; started = false; waitT = 0; spec = null;
      if (!c.beats[bi]) rally.loopScale = 1;
      return;
    }
    bt += dt;
    if (b.during) b.during(rally, Math.min(1, bt / b.dur));
    if (bt < b.dur) return;
    if (b.ready && !b.ready(rally) && bt < b.dur + 3) return;
    if (b.act) { b.act(rally); ptr.tapAt = performance.now() / 1000; }
    if (b.end) { retries = 0; next(); return; }
    bi++; started = false; waitT = 0;
    if (!c.beats[bi]) { rally.loopScale = 1; spec = null; }
  };

  function yours(b) { return mode === 'try' && !!b.you; }

  function next() {
    if (ch < CH.length - 1) go(ch + 1); else finish();
  }

  function finish() {
    finished = true; waiting = false; spec = null;
    if (rally) rally.loopScale = 1;
    markDone(CH.length - 1);
    $('demo').classList.add('done');
    $('demo-end').classList.remove('hidden');
    SR.audio.play('reward');
    var q = $('demo-quick'); if (q) try { q.focus({ preventScroll: true }); } catch (e) { /* old WebView */ }
  }

  // ---- on-court hints ----------------------------------------------------------

  // Where the hint points: a screen spot, plus a shape to light up.
  function resolve(s, v) {
    if (!s) return null;
    if (typeof s === 'function') s = s(rally);
    if (!s) return null;
    if (s.zone) {
      var L = SR.COURT.L, W = SR.COURT.W, N = SR.COURT.NET_X;
      var poly = [[N, 0], [L, 0], [L, W], [N, W]].map(function (c) { var q = v.proj(c[0], c[1], 0); return [q.x + v.panX, q.y]; });
      var m = v.proj((N + L) / 2, W / 2, 0);
      return { x: m.x + v.panX, y: m.y, poly: poly };
    }
    if (s.w) { var q = v.proj(s.w[0], s.w[1], 0); return { x: q.x + v.panX, y: q.y, r: 54 }; }
    if (s.btn) {
      var b = v.buttons.find(function (o) { return o.id === s.btn; });
      return b ? { x: b.x + b.w / 2, y: b.y + b.h / 2, rect: [b.x - 6, b.y - 6, b.w + 12, b.h + 12] } : null;
    }
    if (s.head !== undefined) {
      var h = rally.ui.hitters[s.head], hd = h && v.heads.find(function (o) { return o.p === h.p; });
      return hd ? { x: hd.x, y: hd.y - 4, r: 44 } : null;
    }
    return null;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // Dim the court except the spot to tap.
  function spotlight(ctx, v, t, a, now) {
    var pulse = 1 + 0.06 * Math.sin(now * 5);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.rect(0, 0, v.W, v.H);
    if (t.poly) { ctx.moveTo(t.poly[0][0], t.poly[0][1]); for (var i = t.poly.length - 1; i > 0; i--) ctx.lineTo(t.poly[i][0], t.poly[i][1]); ctx.closePath(); }
    else if (t.rect) { var R = t.rect; ctx.moveTo(R[0], R[1]); ctx.lineTo(R[0], R[1] + R[3]); ctx.lineTo(R[0] + R[2], R[1] + R[3]); ctx.lineTo(R[0] + R[2], R[1]); ctx.closePath(); }
    else { ctx.moveTo(t.x + t.r * pulse, t.y); ctx.arc(t.x, t.y, t.r * pulse, 0, Math.PI * 2, true); }
    ctx.fillStyle = 'rgba(4, 8, 18, 0.55)';
    ctx.fill('evenodd');
    // A bright pulsing outline round the lit area.
    ctx.beginPath();
    if (t.poly) { ctx.moveTo(t.poly[0][0], t.poly[0][1]); t.poly.forEach(function (p) { ctx.lineTo(p[0], p[1]); }); ctx.closePath(); }
    else if (t.rect) roundRect(ctx, t.rect[0], t.rect[1], t.rect[2], t.rect[3], 14);
    else ctx.arc(t.x, t.y, t.r * pulse, 0, Math.PI * 2);
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255, 210, 63, ' + (0.65 + 0.35 * Math.sin(now * 5)) + ')';
    ctx.shadowColor = '#ffd23f'; ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.restore();
  }

  // A cartoon hand that taps the spot, with ripples on every tap.
  function hand(ctx, x, y, a, now, press) {
    var cyc = (now * 1.1) % 1, down = cyc < 0.18 ? cyc / 0.18 : cyc < 0.36 ? 1 - (cyc - 0.18) / 0.18 : 0;
    if (press) down = 1;
    for (var k = 0; k < 2; k++) {
      var e = ((now * 1.1) + k * 0.5) % 1;
      ctx.beginPath(); ctx.arc(x, y, 8 + 36 * e, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.7 * (1 - e) * a) + ')'; ctx.lineWidth = 3; ctx.stroke();
    }
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x + 6, y + 8 - 10 * (1 - down));
    ctx.rotate(-0.35);
    ctx.scale(1 - 0.08 * down, 1 - 0.08 * down);
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    ctx.beginPath();
    // index finger, then the fist with a thumb
    roundRect(ctx, -7, -2, 14, 36, 7);
    ctx.moveTo(-9, 22);
    ctx.bezierCurveTo(-9, 18, -4, 17, 4, 18);
    ctx.lineTo(18, 19); ctx.bezierCurveTo(26, 20, 27, 26, 26, 33);
    ctx.lineTo(24, 44); ctx.bezierCurveTo(23, 50, 18, 53, 11, 53);
    ctx.lineTo(1, 53); ctx.bezierCurveTo(-6, 53, -9, 48, -10, 42);
    ctx.lineTo(-17, 30); ctx.bezierCurveTo(-19, 26, -14, 22, -10, 26);
    ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill('nonzero');
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#0b1220'; ctx.lineJoin = 'round';
    ctx.beginPath(); roundRect(ctx, -7, -2, 14, 36, 7); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(7, 18); ctx.lineTo(18, 19); ctx.bezierCurveTo(26, 20, 27, 26, 26, 33);
    ctx.lineTo(24, 44); ctx.bezierCurveTo(23, 50, 18, 53, 11, 53);
    ctx.lineTo(1, 53); ctx.bezierCurveTo(-6, 53, -9, 48, -10, 42);
    ctx.lineTo(-17, 30); ctx.bezierCurveTo(-19, 26, -14, 22, -10, 26); ctx.lineTo(-7, 30);
    ctx.stroke();
    ctx.restore();
  }

  D.draw = function (ctx, v) {
    var now = performance.now() / 1000, t = resolve(spec, v), coach = mode === 'try' && waiting;
    if (t) {
      if (!ptr.seen) { ptr.x = t.x + 60; ptr.y = t.y + 80; ptr.seen = true; }
      var k = Math.min(1, 0.18 * (playing ? 1 : 0.6));
      ptr.x += (t.x - ptr.x) * k; ptr.y += (t.y - ptr.y) * k;
      ptr.a = Math.min(1, ptr.a + 0.08);
    } else {
      ptr.a = Math.max(0, ptr.a - 0.08);
      if (ptr.a === 0) ptr.seen = false;
    }
    if (coach && t) { spotlight(ctx, v, t, ptr.a, now); hand(ctx, ptr.x, ptr.y, ptr.a, now, false); return; }
    var tap = now - ptr.tapAt;
    if (tap < 0.6) {
      var e = tap / 0.6;
      ctx.beginPath(); ctx.arc(ptr.x, ptr.y, 10 + 34 * e, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,210,63,' + (1 - e) + ')'; ctx.lineWidth = 4 * (1 - e) + 1; ctx.stroke();
    }
    // Watch mode: the hand glides to each call and taps it.
    if (ptr.a > 0 && mode === 'watch' && t) hand(ctx, ptr.x, ptr.y, ptr.a * 0.95, 0.5, tap < 0.2);
  };

  // ---- coach card ---------------------------------------------------------------

  var ICON = {
    serve: '<svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="4.2"/><path d="M5 21c1.5-4 4-6 7-6s5.5 2 7 6" fill="none"/></svg>',
    set: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5.5" r="3.3"/><path d="M6 20l3-7M18 20l-3-7M8.5 12.5c1-1.7 2.2-2.5 3.5-2.5s2.5.8 3.5 2.5" fill="none"/></svg>',
    spike: '<svg viewBox="0 0 24 24"><path d="M13 2L5 13h6l-1 9 8-12h-6z"/></svg>',
    block: '<svg viewBox="0 0 24 24"><path d="M4 4h4v16H4zM10 4h4v16h-4zM16 4h4v16h-4z"/></svg>',
    read: '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none"/><circle cx="12" cy="12" r="3.2"/></svg>'
  };
  var MOOD = {
    you: '<svg viewBox="0 0 24 24"><path d="M9 11V4.5a1.5 1.5 0 0 1 3 0V10l5.2 1.2c1 .2 1.7 1.2 1.6 2.2l-.6 5.1A2.6 2.6 0 0 1 15.6 21h-4.4c-.8 0-1.6-.4-2.1-1L5 15.2a1.5 1.5 0 0 1 2.2-2L9 15z"/></svg>',
    win: '<svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5" fill="none"/></svg>',
    bad: '<svg viewBox="0 0 24 24"><path d="M12 3v11M12 18.5v.5" fill="none"/></svg>',
    info: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'
  };

  function say(text, mood) {
    if (!text) return;
    var card = $('demo-card');
    mood = mood || 'info';
    $('demo-now').textContent = text;
    $('demo-ico').innerHTML = MOOD[mood];
    card.className = 'tut-card ' + mood;
    void card.offsetWidth; card.classList.add('pop');
  }

  function markDone(i) {
    var b = document.querySelectorAll('#demo-chapters button')[i];
    if (b) { b.classList.add('done'); b.classList.remove('on'); }
  }

  function panel() {
    $('demo').classList.remove('done');
    $('demo-end').classList.add('hidden');
    $('demo-bar').style.width = (ch / CH.length * 100) + '%';
    document.querySelectorAll('#demo-chapters button').forEach(function (b, i) {
      b.classList.toggle('on', i === ch); b.classList.toggle('done', i < ch);
      if (i === ch) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    $('demo-next').innerHTML = ch < CH.length - 1 ? 'Skip<span aria-hidden="true"> ›</span>' : 'Finish<span aria-hidden="true"> ›</span>';
    say(CH[ch].name, 'info');
  }

  function setPlaying(on) {
    playing = on;
    if (game) game.paused = !on;
    var b = $('demo-play');
    b.innerHTML = on ? '❚❚' : '▶';
    b.setAttribute('aria-label', on ? 'Pause' : 'Play');
  }

  // The coach card sits in a slim strip along the bottom (on the right on wide screens).
  D.layout = function (vw, vh) {
    var el = $('demo'), side = vw / vh >= 1.25 && vw >= 640;
    el.classList.toggle('side', side); el.classList.toggle('bottom', !side);
    if (side) {
      var w = Math.round(Math.min(320, Math.max(240, vw * 0.26)));
      el.style.width = w + 'px'; el.style.height = '';
      return { w: vw - w, h: vh };
    }
    var h = Math.round(Math.min(168, Math.max(136, vh * 0.18)));
    el.style.height = h + 'px'; el.style.width = '';
    el.classList.toggle('narrow', vw < 340);
    return { w: vw, h: vh - h };
  };

  function setMode(m) {
    mode = m === 'watch' ? 'watch' : 'try';
    D.tryMode = mode === 'try';
    $('demo').classList.toggle('watch', mode === 'watch');
    var t = $('demo-mode');
    if (t) { t.textContent = mode === 'watch' ? 'Let me try' : 'Watch'; t.setAttribute('aria-label', mode === 'watch' ? 'Switch to Try it mode' : 'Watch the demo play itself'); }
  }

  // at: the chapter to begin with (the skill tiles on the help screen).
  D.start = function (origin, m, at) {
    from = origin || 'help';
    setMode(m);
    SR.ui.show(null);
    $('hud').classList.add('hidden');
    $('demo').classList.remove('hidden');
    var away = SR.TEAMS[1];
    game = SR.game = new SR.Game({ home: SR.TEAMS[0], away: away, format: SR.formatId(15, 1), difficulty: 'normal', human: 0, demo: true, mode: 'demo' });
    rally = game.rally;
    // Note the calls you make so Try it mode knows when a step is done.
    [['pickHitter', 'hitter'], ['pickTarget', 'target'], ['pickBlock', 'block']].forEach(function (f) {
      var orig = rally[f[0]];
      rally[f[0]] = function (a) { if (rally.ui.prompt) calls.push([f[1], typeof a === 'object' && a && a.idx === undefined ? 'spot' : a]); return orig.apply(this, arguments); };
    });
    D.active = true;
    retries = 0;
    setPlaying(true);
    SR.resize();
    go(at || 0);
  };

  // quiet: the match was replaced elsewhere, so just tidy up.
  D.stop = function (quiet) {
    D.active = false; waiting = false; finished = false;
    $('demo').classList.add('hidden');
    if (rally) rally.loopScale = 1;
    if (SR.game === game) SR.game = null;
    game = null; rally = null; spec = null;
    clearFx();
    SR.resize();
    if (!quiet) SR.ui.show(from === 'menu' ? 'scr-menu' : 'scr-help');
  };

  function init() {
    var list = $('demo-chapters');
    list.innerHTML = CH.map(function (c, i) {
      return '<li><button type="button" aria-label="Step ' + (i + 1) + ': ' + c.name + '"><span class="ts-ico" aria-hidden="true">' + ICON[c.icon] + '</span><small>' + c.name + '</small></button></li>';
    }).join('');
    list.querySelectorAll('button').forEach(function (b, i) {
      b.addEventListener('click', function () { SR.audio.play('click'); retries = 0; go(i); setPlaying(true); });
    });
    function on(id, fn) { var el = $(id); if (el) el.addEventListener('click', function () { SR.audio.play('click'); fn(); }); }
    on('demo-next', function () { retries = 0; next(); setPlaying(true); });
    on('demo-play', function () { setPlaying(!playing); });
    on('demo-replay', function () { retries = 0; go(ch); setPlaying(true); });
    on('demo-exit', function () { D.stop(); });
    on('demo-again', function () { retries = 0; go(0); setPlaying(true); });
    on('demo-done', function () { D.stop(); });
    on('demo-mode', function () { setMode(mode === 'watch' ? 'try' : 'watch'); retries = 0; go(ch); setPlaying(true); });
    on('demo-quick', function () { D.stop(true); SR.ui.show('scr-menu'); $('btn-quick').click(); });
    // Watch mode: tapping the court pauses and resumes.
    $('game').addEventListener('pointerup', function () { if (D.active && mode === 'watch' && !finished) setPlaying(!playing); });
    window.addEventListener('keydown', function (e) {
      if (!D.active) return;
      var t = e.target && e.target.tagName;
      if (e.key === 'ArrowRight') { next(); setPlaying(true); }
      else if (e.key === 'ArrowLeft') { go(ch - 1); setPlaying(true); }
      else if (e.key === ' ' && t !== 'BUTTON' && mode === 'watch') setPlaying(!playing);
      else if (e.key === 'Escape') D.stop();
      else return;
      e.preventDefault();
    });
    on('btn-demo', function () { D.start('help', 'try'); });
    on('btn-demo-watch', function () { D.start('help', 'watch'); });
    // Skill tiles on the help screen start the tutorial at that skill.
    document.querySelectorAll('[data-demo-at]').forEach(function (b) {
      b.addEventListener('click', function () { SR.audio.play('click'); D.start('help', 'try', +b.getAttribute('data-demo-at')); });
    });
  }

  window.addEventListener('load', init);
})();
