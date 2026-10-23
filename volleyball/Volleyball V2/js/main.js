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
        // The break between sets is a natural point for a CrazyGames midgame
        // ad. Not online (it would freeze the friend's game) or in the demo.
        if (self.cfg.online || self.cfg.human === -1) next(); else SR.cg.midgame(next);
      });
    } else {
      rally.startServe();
    }
  };

  var canvas, ctx, last = 0, acc = 0;

  function resize() {
    var vw = window.innerWidth, vh = window.innerHeight;
    SR.render.setView(vw, vh);
    var s = Math.min(vw / SR.render.W, vh / SR.render.H);
    var dpr = window.devicePixelRatio || 1;
    canvas.style.width = Math.floor(SR.render.W * s) + 'px';
    canvas.style.height = Math.floor(SR.render.H * s) + 'px';
    canvas.width = Math.floor(SR.render.W * s * dpr);
    canvas.height = Math.floor(SR.render.H * s * dpr);
    SR.render.scale = s * dpr;
    // Pause button sits on the canvas corner: top right in landscape,
    // bottom right in portrait where the scoreboard fills the top.
    var cw = SR.render.W * s, ch = SR.render.H * s, left = (vw - cw) / 2, top = (vh - ch) / 2;
    var hud = document.getElementById('hud');
    hud.style.left = (left + cw - 56) + 'px';
    hud.style.top = (SR.render.portrait ? top + ch - 56 : top + 12) + 'px';
    hud.style.right = 'auto';
  }

  function step(ts) {
    var dt = last ? Math.min(document.hidden ? 0.25 : 0.05, (ts - last) / 1000) : 0;
    last = ts;
    var g = SR.game;
    // Hit-stop freeze on big hits; skipped online so the match never stalls.
    if (SR.fx.hitStop > 0) { SR.fx.hitStop -= dt; if (!(g && g.cfg.online)) dt = 0; }
    if (g && !g.paused) {
      acc += dt * (g.rally.loopScale || g.rally.timeScale) * (SR.speed || 1);
      var n = 0;
      while (acc >= STEP && n < 4000) { g.rally.update(STEP); acc -= STEP; n++; }
    }
    if (SR.net) SR.net.tick();
    // Report play starting/stopping to CrazyGames (only sends on a change).
    SR.cg.syncGameplay();
    if (!document.hidden) SR.render.draw(ctx, g);
  }

  function frame(ts) {
    step(ts);
    window.requestAnimationFrame(frame);
  }

  // A hidden tab stops animation frames. When hosting online, keep the match
  // running on a timer so the friend's game doesn't freeze.
  setInterval(function () {
    var g = SR.game;
    if (!document.hidden || !g || g.cfg.online !== 'host') return;
    step(performance.now());
  }, 50);

  function boot() {
    SR.cg.loadingStart();
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
    // CrazyGames wants new players to land straight in a match: the first
    // visit skips the menu and starts a quick match.
    if (SR.ui.current() === 'scr-menu' && !SR.save.data.stats.matches) SR.ui.quickStart();
    SR.cg.onSettingsChange(function () { SR.audio.setMuted(SR.cg.muted()); SR.ui.refresh(); });
    // Signing in to CrazyGames swaps in that account's saved progress.
    SR.cg.onAuthChange(function () { setTimeout(function () { SR.save.load(); SR.i18n.init(); SR.ui.refresh(); }, 300); });
    window.requestAnimationFrame(frame);
    SR.cg.loadingStop();
  }

  // Start the CrazyGames SDK first (it preloads the player's cloud save), then the game.
  window.addEventListener('load', function () {
    SR.cg.init().then(boot, boot);
  });
})();
