// Boot, the Game controller (one match) and the fixed-step loop.
(function () {
  var STEP = 1 / 120;

  SR.Game = function (cfg) {
    // cfg.boost: extra CPU strength on top (tournament rounds get harder).
    var boost = (SR.DIFFICULTY[cfg.difficulty] || SR.DIFFICULTY.normal).boost + (Number(cfg.boost) || 0);
    this.cfg = cfg;
    this.match = new SR.Match(cfg.home, cfg.away, cfg.format, cfg.human === 0 ? boost : 0);
    this.rally = new SR.Rally(this.match, { human: cfg.human, demo: !!cfg.demo, onPoint: this.onPoint.bind(this) });
    this.paused = false;
    this.hover = null;
    this.shift = false;
    var rally = this.rally;
    rally.formation(0, 'base');
    rally.formation(1, 'base');
    rally.snap();
    if (cfg.demo) return; // the How to play demo stages its own rallies (demo.js)
    // League, tournament and Career matches open by naming the venue.
    var venue = cfg.venue && SR.courtById(cfg.venue);
    if (cfg.human !== -1) rally.say('SET 1', venue ? venue.name : cfg.home.name + ' vs ' + cfg.away.name, venue ? venue.accent || venue.line : '#ffffff', 2);
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
      rally.say(t.short + ' WIN', m.history.map(function (s) { return s[0] + '-' + s[1]; }).join('  '), t.color, 3);
      SR.audio.play('cheer');
      if (SR.music) SR.music.jingle(this.cfg.human === 0 && winner !== 0 ? 'lose' : 'win');
      SR.fx.emit('confetti', { color: t.color });
      rally.wait(2.6, function () { if (self.cfg.onEnd) self.cfg.onEnd(self); });
    } else if (res.setOver) {
      var w = m.teams[res.setWinner], last = m.history[m.history.length - 1];
      rally.say('SET ' + w.short, last[0] + ' - ' + last[1], w.color, 2.2);
      SR.audio.play('cheer');
      SR.fx.emit('confetti', { color: w.color });
      rally.wait(2.0, function () {
        rally.say('SET ' + m.setNo, 'to ' + m.target(), '#ffffff', 1.6);
        rally.startServe();
      });
    } else {
      rally.startServe();
    }
  };

  var canvas, ctx, last = 0, acc = 0, lowRes = false, lastRes = 1, menuBg = false;

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
    // A collapsed or hidden game frame can report 0x0; a 0-pixel canvas makes
    // drawImage throw, so everything is sized at least 1 pixel.
    // Measure the game area (#app), not the window.
    // On phones #app is padded by the safe area (camera cut-outs, rounded
    // corners), so the court is fitted inside that padding.
    var appEl = document.getElementById('app'), cs = window.getComputedStyle ? window.getComputedStyle(appEl) : null;
    var pl = cs ? parseFloat(cs.paddingLeft) || 0 : 0, pr = cs ? parseFloat(cs.paddingRight) || 0 : 0;
    var pt = cs ? parseFloat(cs.paddingTop) || 0 : 0, pb = cs ? parseFloat(cs.paddingBottom) || 0 : 0;
    var vw = Math.max(1, (appEl.clientWidth || window.innerWidth || 0) - pl - pr), vh = Math.max(1, (appEl.clientHeight || window.innerHeight || 0) - pt - pb);
    // The How to play demo keeps a strip (right or bottom) for its captions;
    // the court fits in what is left.
    var dm = SR.demo && SR.demo.active ? SR.demo.layout(vw, vh) : null, bw = dm ? dm.w : vw, bh = dm ? dm.h : vh;
    SR.render.setView(bw, bh);
    var s = Math.min(bw / SR.render.W, bh / SR.render.H);
    // Sharpness: draw at the screen's own pixel density (up to 3x), so
    // players and text are crisp instead of a blurry upscale. Only a very big
    // canvas (tablets, PC windows) is held to ~3.2 million pixels a frame.
    // When the device struggles, dynamic resolution (SR.resScale) lowers it a
    // little, but never below 2 canvas pixels per screen pixel on phones
    // (2026-11-12: going down to 1x is what made the players look blurred).
    var dev = window.devicePixelRatio || 1;
    // (A phone that is really struggling, SR.lowFx, may go to 1.5x.)
    // Settings > Sharp graphics off: a slow phone may go all the way to 1x.
    var sharpOn = !!(SR.save && SR.save.data && SR.save.data.settings && SR.save.data.settings.hd === true);
    // 2026-11-12 (2): 2.25x at most (the eye barely sees more on a phone, and
    // it costs much less to draw than 3x); 1.5x floor, 1.25x on a struggling phone.
    var dpr = Math.min(dev, 2.25), sharp = sharpOn ? Math.min(dev, SR.lowFx ? 1.25 : 1.5) : Math.min(dev, 1);
    var px = SR.render.W * s * SR.render.H * s, cap = 2.6e6;
    if (px * dpr * dpr > cap) dpr = Math.max(Math.min(sharp, 1.5), Math.sqrt(cap / px));
    if (SR.resScale && SR.resScale < 1) dpr = Math.max(Math.min(dpr, sharp), dpr * SR.resScale);
    lowRes = !!SR.lowFx; lastRes = SR.resScale || 1;
    // The CSS box and the backing store use the same rounded size, so the
    // canvas is shown without being stretched by a fraction of a pixel.
    var cssW = Math.max(1, Math.floor(SR.render.W * s)), cssH = Math.max(1, Math.floor(SR.render.H * s));
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width = Math.max(1, Math.round(cssW * dpr));
    canvas.height = Math.max(1, Math.round(cssH * dpr));
    SR.render.scale = canvas.width / SR.render.W;
    // Pause button sits on the canvas corner: top right in landscape,
    // bottom right in portrait where the scoreboard fills the top.
    var cw = SR.render.W * s, ch = SR.render.H * s, left = pl + (bw - cw) / 2, top = pt + (bh - ch) / 2;
    canvas.style.margin = dm ? '0 ' + (vw - bw) + 'px ' + (vh - bh) + 'px 0' : '';
    var hud = document.getElementById('hud');
    hud.style.left = (left + cw - 56) + 'px';
    hud.style.top = (SR.render.portrait ? top + ch - 56 : top + 12) + 'px';
    hud.style.right = 'auto';
    // The canvas box, for overlays laid out in CSS.
    var emo = document.getElementById('emotes'); if (emo) emo.classList.toggle('flat', SR.render.portrait);
    var app = document.getElementById('app').style;
    app.setProperty('--cv-l', left + 'px'); app.setProperty('--cv-t', top + 'px');
    app.setProperty('--cv-w', cw + 'px'); app.setProperty('--cv-h', ch + 'px');
  }

  function step(ts) {
    var dt = last ? Math.min(document.hidden ? 0.25 : 0.05, (ts - last) / 1000) : 0;
    last = ts;
    var g = SR.game;
    if (SR.demo && SR.demo.active) SR.demo.tick(dt);
    // Hit-stop on big hits: a brief slow-motion beat rather than a dead
    // freeze, so motion never visibly stops.
    // (Skipped online so the match never stalls for your friend.)
    if (SR.fx.hitStop > 0) { SR.fx.hitStop -= dt; if (!(g && g.cfg.online)) dt *= 0.6; }
    if (g && !g.paused) {
      acc += dt * (g.rally.loopScale || g.rally.timeScale) * (SR.speed || 1);
      var n = 0;
      while (acc >= STEP && n < 4000) { saveStep(g.rally); g.rally.update(STEP); acc -= STEP; n++; }
    }
    // Online: send/receive snapshots, keep the link alive.
    if (SR.net) { try { SR.net.tick(); } catch (e) { SR.oops && SR.oops('net', e); } }
    if ((SR.lowFx && !lowRes) || (SR.resScale || 1) !== lastRes) resize();
    // No match (menus): show the cover art instead of the court.
    if (!g !== menuBg) { menuBg = !g; document.getElementById('app').classList.toggle('menu-bg', menuBg); }
    if (SR.music) { try { SR.music.sync(g); } catch (e) { SR.oops && SR.oops('music', e); } }
    if (document.hidden || !g || canvas.width < 2 || canvas.height < 2) return;
    var undo = g && !g.paused ? blend(g.rally, acc / STEP) : null;
    try { SR.render.draw(ctx, g); } finally { if (undo) undo(); }
  }

  // The next frame is booked first, so one bad frame can't stop the game
  // loop for good (that froze the whole game). The error is still logged; a
  // match that fails frame after frame is ended and the menu shown instead.
  var fails = 0;
  function frame(ts) {
    window.requestAnimationFrame(frame);
    var t0 = performance.now();
    try { step(ts); fails = 0; SR.frameWork = performance.now() - t0; } catch (e) {
      SR.oops('frame', e);
      if (++fails < 30) return;
      fails = 0;
      try { if (SR.demo && SR.demo.active && SR.demo.stop) SR.demo.stop(); } catch (e2) { SR.oops('demo stop', e2); }
      if (SR.ui && SR.ui.quit) SR.ui.quit(); else SR.game = null;
    }
  }

  SR.resize = function () { if (canvas) resize(); };

  // When the host's app is in the background (a call, a notification pulled
  // down) animation frames stop. Keep an online match running on a timer so
  // the friend's game doesn't freeze; the app's WebView may still pause it.
  setInterval(function () {
    var g = SR.game;
    if (!document.hidden || !g || g.cfg.online !== 'host') return;
    try { step(performance.now()); } catch (e) { SR.oops('hidden tick', e); }
  }, 33);

  // The page's ?key=value options (URLSearchParams is missing on some old browsers).
  function query() {
    try { if (window.URLSearchParams) return new URLSearchParams(window.location.search); } catch (e) { /* fall through */ }
    var map = {};
    window.location.search.replace(/^\?/, '').split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('='), k = i < 0 ? kv : kv.slice(0, i), val = i < 0 ? '' : kv.slice(i + 1);
      try { k = decodeURIComponent(k); val = decodeURIComponent(val.replace(/\+/g, ' ')); } catch (e) { /* keep raw */ }
      if (!(k in map)) map[k] = val;
    });
    return { get: function (k) { return k in map ? map[k] : null; }, has: function (k) { return k in map; } };
  }

  // One optional part of start-up failing (demo, daily rewards...)
  // must not leave the player without a menu.
  function part(name, fn) { try { fn(); } catch (e) { SR.oops('boot ' + name, e); } }

  // Start once the page is parsed: waiting for 'load' also waited for every
  // image, which held the game back.
  function onReady(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  onReady(function () {
    SR.save.load();
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', function () { try { resize(); } catch (e) { SR.oops('resize', e); } });
    window.addEventListener('orientationchange', function () { setTimeout(SR.resize, 150); });
    SR.input.init(canvas);
    SR.ui.init();
    var q = query();
    if (q.get('speed')) SR.speed = Number(q.get('speed')) || 1;
    part('demo', function () { if (q.get('demo') !== null && SR.demo) SR.demo.start('menu', q.get('demo')); });
    part('custom', function () { if (SR.custom) SR.custom.init(); });
    part('daily', function () { if (SR.daily) SR.daily.init(q); });
    part('challenge', function () { if (SR.challenge) SR.challenge.init(); });
    part('profile', function () { if (SR.profile) SR.profile.init(); });
    part('android', function () { if (SR.app) SR.app.init(); });
    part('online', function () { if (SR.net) SR.net.init(q); });
    window.requestAnimationFrame(frame);
  });
})();
