// Mouse, touch and keyboard, mapped to court coordinates.
(function () {
  var canvas;

  function logical(e) {
    var rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width * SR.render.W, y: (e.clientY - rect.top) / rect.height * SR.render.H };
  }

  function active() {
    var g = SR.game;
    // The How to play demo takes your calls only in its Try it mode.
    return g && !g.paused && g.cfg.human !== -1 && (!g.cfg.demo || SR.demo.tryMode) ? g : null;
  }

  function onMove(e) {
    var g = active();
    if (!g) return;
    var s = logical(e), pt = SR.render.unproject(s.x, s.y);
    if (!pt) return;
    g.hover = pt;
    if (g.rally.ui.prompt === 'serve') g.rally.setAim(pt);
  }

  function onDown(e) {
    onMove(e);
  }

  function onUp(e) {
    var g = active();
    if (!g) return;
    var s = logical(e), pt = SR.render.unproject(s.x, s.y), rally = g.rally, ui = rally.ui;
    var btn = SR.render.buttons.find(function (b) { return s.x >= b.x && s.x <= b.x + b.w && s.y >= b.y && s.y <= b.y + b.h; });
    if (btn) {
      if (btn.kind === 'block') rally.pickBlock(btn.id);
      return;
    }
    if (ui.prompt === 'block' && pt) {
      var Z = SR.render.BLOCK_ZONES;
      Object.keys(Z).forEach(function (id) { if (pt.x > 7 && pt.x < 9 && pt.y >= Z[id][0] && pt.y < Z[id][1]) rally.pickBlock(id); });
      return;
    }
    if (ui.prompt === 'serve') {
      if (pt) rally.setAim(pt);
      rally.humanServe();
    } else if (ui.prompt === 'hitter') {
      var best = null, bd = 70;
      SR.render.heads.forEach(function (h) {
        if (!ui.hitters.some(function (o) { return o.p === h.p; })) return;
        var d = Math.hypot(h.x - s.x, h.y - s.y);
        if (d < bd) { bd = d; best = h.p; }
      });
      if (!best && pt) {
        var md = 2.5;
        ui.hitters.forEach(function (o) { var d = Math.hypot(o.p.x - pt.x, o.p.y - pt.y); if (d < md) { md = d; best = o.p; } });
      }
      if (best) rally.pickHitter(best);
    } else if (ui.prompt === 'target') {
      if (pt && pt.x > SR.COURT.NET_X) rally.pickTarget(pt, false);
    }
  }

  function onKey(e, down) {
    var g = SR.game;
    if (!g) return;
    if (!down || g.cfg.human === -1) return;
    if (g.cfg.demo && (!SR.demo.tryMode || e.key === 'p' || e.key === 'P' || e.key === 'Escape')) return; // demo.js has its own keys
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { SR.ui.togglePause(); e.preventDefault(); return; }
    if (g.paused) return;
    var rally = g.rally;
    if (e.key === ' ' && rally.ui.prompt === 'serve') { rally.humanServe(); e.preventDefault(); }
    var n = /^[1-6]$/.test(e.key) ? Number(e.key) - 1 : -1;
    if (n < 0) return;
    if (rally.ui.prompt === 'hitter') rally.pickHitterIndex(n);
    else if (rally.ui.prompt === 'block') { var ids = ['left', 'middle', 'right', 'read']; if (ids[n]) rally.pickBlock(ids[n]); }
  }

  SR.input = {
    init: function (cv) {
      canvas = cv;
      cv.addEventListener('pointermove', onMove);
      cv.addEventListener('pointerdown', onDown);
      cv.addEventListener('pointerup', onUp);
      cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      window.addEventListener('keydown', function (e) { onKey(e, true); });
      window.addEventListener('keyup', function (e) { onKey(e, false); });
    }
  };
})();
