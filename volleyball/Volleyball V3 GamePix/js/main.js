// Boot, the Game controller (one match) and the fixed-step loop.
(function () {
  var STEP = 1 / 120;

  SR.Game = function (cfg) {
    var boost = (SR.DIFFICULTY[cfg.difficulty] || SR.DIFFICULTY.normal).boost;
    this.cfg = cfg;
    this.match = new SR.Match(cfg.home, cfg.away, cfg.format, cfg.human === 0 ? boost : 0);
    this.rally = new SR.Rally(this.match, { human: cfg.human, onPoint: this.onPoint.bind(this) });
    this.paused = false;
    this.hover = null;
    this.shift = false;
    var rally = this.rally;
    rally.formation(0, 'base');
    rally.formation(1, 'base');
    rally.snap();
    if (cfg.demo) return; // the How to play demo stages its own rallies (demo.js)
    if (cfg.human !== -1) rally.say(SR.t('SET {n}', { n: 1 }), SR.t('{a} vs {b}', { a: cfg.home.name, b: cfg.away.name }), '#ffffff', 2);
    rally.wait(cfg.human !== -1 ? 1.4 : 0.4, function () { rally.startServe({ snap: true }); });
  };

  SR.Game.prototype.onPoint = function (winner, info) {
    var m = this.match, rally = this.rally, self = this;
    var st = m.stats[winner];
    if (info.kind === 'ace') st.aces++;
    else if (info.kind === 'kill') st.kills++;
    else if (info.kind === 'block') st.blocks++;
    else if (info.kind === 'error') m.stats[1 - winner].errors++;
    if (this.cfg.demo) { m.point(winner); return; }
    var res = m.point(winner);
    if (res.matchOver) {
      var t = m.teams[winner];
      rally.say(SR.t('{team} WIN', { team: t.short }), m.history.map(function (s) { return s[0] + '-' + s[1]; }).join('  '), t.color, 3);
      SR.audio.play('cheer');
      SR.fx.emit('confetti', { color: t.color });
      rally.wait(2.6, function () { if (self.cfg.onEnd) self.cfg.onEnd(self); });
    } else if (res.setOver) {
      var w = m.teams[res.setWinner], last = m.history[m.history.length - 1];
      rally.say(SR.t('SET {team}', { team: w.short }), last[0] + ' - ' + last[1], w.color, 2.2);
      SR.audio.play('cheer');
      SR.fx.emit('confetti', { color: w.color });
      rally.wait(2.0, function () {
        var next = function () {
          rally.say(SR.t('SET {n}', { n: m.setNo }), SR.t('to {n}', { n: m.target() }), '#ffffff', 1.6);
          rally.startServe();
        };
        // The break between sets is a natural point for an interstitial
        // ad. Not online (it would freeze the friend's game) or in the demo.
        if (self.cfg.online || self.cfg.human === -1) next(); else SR.portal.midgame(next);
      });
    } else {
      rally.startServe();
    }
  };

  var canvas, ctx, last = 0, acc = 0, lowRes = false, menuBg = false;

  // The match steps at a fixed 120 Hz but screens refresh at 60, 90, 144 Hz
  // and slow motion runs fewer steps per frame. Drawing the raw step leaves
  // motion uneven (judder), so each frame is drawn between the last two
  // steps: positions are saved before a step and blended at draw time.
  var prev = { rally: null, t: 0, ball: null, ps: [] };

  function saveStep(r) {
    var ps = r.all();
    prev.rally = r; prev.t = r.t;
    prev.ball = { x: r.ball.x, y: r.ball.y, z: r.ball.z };
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i], o = prev.ps[i] || (prev.ps[i] = {});
      o.x = p.x; o.y = p.y; o.z = p.z; o.yaw = p.yaw;
    }
  }

  function mix(a, b, k) { return a + (b - a) * k; }

  // Blend the drawn state toward the previous step; returns an undo function.
  function blend(r, k) {
    if (prev.rally !== r || k >= 1 || !prev.ball) return null;
    var ps = r.all(), keep = [], ball = r.ball, t = r.t, pb = prev.ball;
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i], o = prev.ps[i];
      keep.push(p.x, p.y, p.z, p.yaw);
      if (!o || Math.abs(p.x - o.x) + Math.abs(p.y - o.y) > 1) continue; // snapped into place: don't smear
      var dy = Math.atan2(Math.sin(p.yaw - o.yaw), Math.cos(p.yaw - o.yaw));
      p.x = mix(o.x, p.x, k); p.y = mix(o.y, p.y, k); p.z = mix(o.z, p.z, k); p.yaw = o.yaw + dy * k;
    }
    if (Math.abs(ball.x - pb.x) + Math.abs(ball.y - pb.y) + Math.abs(ball.z - pb.z) < 2) {
      r.ball = { x: mix(pb.x, ball.x, k), y: mix(pb.y, ball.y, k), z: mix(pb.z, ball.z, k) };
    }
    if (t > prev.t) r.t = mix(prev.t, t, k);
    return function () {
      for (var j = 0; j < ps.length; j++) {
        var q = ps[j];
        q.x = keep[j * 4]; q.y = keep[j * 4 + 1]; q.z = keep[j * 4 + 2]; q.yaw = keep[j * 4 + 3];
      }
      r.ball = ball; r.t = t;
    };
  }

  function resize() {
    var vw = window.innerWidth, vh = window.innerHeight;
    // The How to play demo keeps a strip (right or bottom) for its captions;
    // the court fits in what is left.
    var dm = SR.demo && SR.demo.active ? SR.demo.layout(vw, vh) : null, bw = dm ? dm.w : vw, bh = dm ? dm.h : vh;
    SR.render.setView(bw, bh);
    var s = Math.min(bw / SR.render.W, bh / SR.render.H);
    // Very sharp phone screens cost a lot of pixels for little gain: cap the
    // backing resolution, and lower it further if the device is struggling.
    var dpr = Math.min(window.devicePixelRatio || 1, SR.lowFx ? 1.25 : 2);
    lowRes = !!SR.lowFx;
    canvas.style.width = Math.floor(SR.render.W * s) + 'px';
    canvas.style.height = Math.floor(SR.render.H * s) + 'px';
    canvas.width = Math.floor(SR.render.W * s * dpr);
    canvas.height = Math.floor(SR.render.H * s * dpr);
    SR.render.scale = s * dpr;
    // Pause button sits on the canvas corner: top right in landscape,
    // bottom right in portrait where the scoreboard fills the top.
    var cw = SR.render.W * s, ch = SR.render.H * s, left = (bw - cw) / 2, top = (bh - ch) / 2;
    canvas.style.margin = dm ? '0 ' + (vw - bw) + 'px ' + (vh - bh) + 'px 0' : '';
    var hud = document.getElementById('hud');
    hud.style.left = (left + cw - 56) + 'px';
    hud.style.top = (SR.render.portrait ? top + ch - 56 : top + 12) + 'px';
    hud.style.right = 'auto';
  }

  function step(ts) {
    var dt = last ? Math.min(document.hidden ? 0.25 : 0.05, (ts - last) / 1000) : 0;
    last = ts;
    var g = SR.game;
    if (SR.demo && SR.demo.active) SR.demo.tick(dt);
    // Hit-stop freeze on big hits; skipped online so the match never stalls.
    if (SR.fx.hitStop > 0) { SR.fx.hitStop -= dt; if (!(g && g.cfg.online)) dt = 0; }
    if (g && !g.paused) {
      acc += dt * (g.rally.loopScale || g.rally.timeScale) * (SR.speed || 1);
      var n = 0;
      while (acc >= STEP && n < 4000) { saveStep(g.rally); g.rally.update(STEP); acc -= STEP; n++; }
    }
    if (SR.net) SR.net.tick();
    if (SR.lowFx && !lowRes) resize();
    // Tell GamePix when real gameplay first starts (sent once).
    SR.portal.syncGameplay();
    // No match (menus): show the cover art instead of the court.
    if (!g !== menuBg) { menuBg = !g; document.getElementById('app').classList.toggle('menu-bg', menuBg); }
    if (document.hidden || !g) return;
    var undo = g && !g.paused ? blend(g.rally, acc / STEP) : null;
    try { SR.render.draw(ctx, g); } finally { if (undo) undo(); }
  }

  function frame(ts) {
    step(ts);
    window.requestAnimationFrame(frame);
  }

  // A hidden tab stops animation frames. When hosting online, keep the match
  // running on a timer so the friend's game doesn't freeze. Browsers slow page
  // timers in hidden tabs to once a second, so the beat comes from a worker,
  // whose timers keep running; a plain timer is the fallback.
  function hiddenTick() {
    var g = SR.game;
    if (!document.hidden || !g || g.cfg.online !== 'host') return;
    step(performance.now());
  }
  try {
    var beat = new Worker(URL.createObjectURL(new Blob(['setInterval(function(){postMessage(0)},33)'], { type: 'text/javascript' })));
    beat.onmessage = hiddenTick;
  } catch (e) { setInterval(hiddenTick, 50); }

  SR.resize = function () { if (canvas) resize(); };

  function boot() {
    SR.portal.loadingStart();
    SR.save.load();
    SR.i18n.init();
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', function () { setTimeout(resize, 150); });
    SR.input.init(canvas);
    SR.ui.init();
    var q = new URLSearchParams(window.location.search);
    if (q.get('speed')) SR.speed = Number(q.get('speed')) || 1;
    if (SR.net) SR.net.init(q);
    // Every launch opens on a choice: the guided demo, or skip to the menu.
    // ?demo=1 (or ?demo=watch) goes straight into the demo.
    if (q.get('demo') !== null && SR.demo) SR.demo.start('menu', q.get('demo'));
    else SR.ui.show('scr-start');
    SR.portal.onSettingsChange(function () { SR.audio.setMuted(SR.portal.muted()); SR.ui.refresh(); });
    SR.portal.onAuthChange(function () { setTimeout(function () { SR.save.load(); SR.i18n.init(); SR.ui.refresh(); }, 300); });
    window.requestAnimationFrame(frame);
    SR.portal.loadingStop();
  }

  // Hook up the GamePix SDK (pause/resume, loading) first, then the game.
  window.addEventListener('load', function () {
    SR.portal.init().then(boot, boot);
  });
})();
