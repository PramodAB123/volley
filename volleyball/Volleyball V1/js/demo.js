// How to play demo: short scripted rallies on the real engine. A director
// makes the coach's calls with an on-screen pointer while a caption panel
// explains each skill. rally.script fixes the dice so every scene plays out
// the way its caption says (see the `script` checks in rally.js).
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var D = SR.demo = { active: false };
  var game = null, rally = null, from = 'help';
  var ch = 0, bi = 0, started = false, bt = 0, waitT = 0, retries = 0, playing = true;
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
  function powerReady(lo, hi) { return function (r) { return r.ui.power >= lo && r.ui.power <= hi; }; }

  // The CPU's serve in the scenes where you receive: an easy ball to your passer.
  var EASY_SERVE = [3.2, 4.4, 0.45];
  // Your serve straight at their passer, so they can set up an attack.
  var SERVE_TO_PASSER = [[13.5, 4.5], [15.0, 3.6], [15.6, 4.6]];

  // A receive-and-attack scene: set hitter `h` (0 left, 1 middle, 2 right),
  // then the shot beats.
  function attackBeats(hSay, h, shotBeats, endSay) {
    return [
      { wait: prompt('hitter'), fast: 2, slow: 0.08, say: hSay, aim: { head: h }, dur: 1.5, act: function (r) { r.pickHitterIndex(h); } }
    ].concat(shotBeats, [{ wait: dead, say: endSay, dur: 2.4, end: true }]);
  }

  function pickShot(id, say) {
    return { wait: prompt('target'), slow: 0.05, say: say, aim: { btn: id }, dur: 2.4, act: function (r) { r.pickShot(id); } };
  }

  function tapSpot(x, y, say) {
    return { slow: 0.05, say: say, aim: { w: [x, y] }, dur: 2.2, act: function (r) { r.pickTarget({ x: x, y: y }, false); } };
  }

  // ---- the chapters ---------------------------------------------------------

  var CH = [
    {
      name: 'Coach', title: 'You are the coach',
      body: 'You coach the team on the near side of the net. Your players run, pass, set and jump by themselves. You make the four calls that decide each rally: the serve, the set, the attack and the block.',
      stage: 'idle',
      beats: [
        { say: 'This is your team, on the near side of the net.', aim: { w: [4.6, 4.5] }, dur: 3.2 },
        { say: 'This is the other team, across the net.', aim: { w: [13.4, 4.5] }, dur: 3.2 },
        { say: 'Next: each call, played out in a real rally.', dur: 2.4, end: true }
      ]
    },
    {
      name: 'Serve', title: 'Serve: aim and power',
      body: 'Aim anywhere on their court, then serve while the power bar swings. A harder serve is tougher to pass but less accurate. A serve into the gap between two passers can win the point outright.',
      keys: { pc: 'Move the mouse to aim, then click or press Space', touch: 'Tap the spot on their court to serve there' },
      server: 0, script: { noDig: 1 },
      beats: [
        { wait: prompt('serve'), say: 'Move the pointer over their court. The red ring shows where the serve will go.', aim: aimAt, dur: 3.6,
          during: sweep([[13.5, 4.5], [15.6, 2.4], [15.2, 7.0], [12.6, 4.8]]) },
        { say: 'The power bar on the left swings up and down. Serve when it is about two thirds full.', aim: aimAt, dur: 2.2,
          ready: powerReady(0.56, 0.7), act: function (r) { r.humanServe(); } },
        { wait: dead, say: 'Ace! The serve dropped into the gap between their passers.', dur: 2.8, end: true }
      ]
    },
    {
      name: 'Set', title: 'Set: pick your hitter',
      body: 'When your team passes, numbers appear over your front-row hitters. Pick one before your setter touches the ball, or the setter decides for you. Then, while the set is in the air, pick a shot and where it lands.',
      keys: { pc: 'Click a player or press 1 to 3', touch: 'Tap a numbered player' },
      server: 1, script: { cpuServe: EASY_SERVE, noDig: 1 },
      beats: [
        { wait: inPlay, slow: 0.6, say: 'They serve. Your players pass on their own, up to your setter.', dur: 1.4 },
        { wait: prompt('hitter'), slow: 0.05, say: 'Numbers pop up over your hitters. Pick number 1, your left-side hitter.', aim: { head: 0 }, dur: 3, act: function (r) { r.pickHitterIndex(0); } },
        pickShot('power', 'The set is up. Now pick a shot: Power is the fastest, hardest hit.'),
        tapSpot(13.4, 4.5, 'Tap where it should land: open floor, away from their defenders and off the lines.'),
        { wait: dead, say: 'Kill! A Power spike into open court.', dur: 2.4, end: true }
      ]
    },
    {
      name: 'Line', title: 'Shot: Line',
      body: 'Line aims itself straight down the sideline, past the outside edge of the block. Use it when the blockers leave the line open.',
      keys: { pc: 'Press 2 or click Line while the set is up', touch: 'Tap Line while the set is up' },
      server: 1, script: { cpuServe: EASY_SERVE, noDig: 1 },
      beats: attackBeats('Set your left-side hitter (1).', 0, [
        pickShot('line', 'Pick Line. No spot to tap: it aims itself down the sideline.'),
        { slow: 0.15, say: 'The ring shows where the shot is going.', dur: 1.2 }
      ], 'Straight down the line for the point.')
    },
    {
      name: 'Cross', title: 'Shot: Cross',
      body: 'Cross aims itself on a sharp diagonal across the court, away from a block that is guarding the line.',
      keys: { pc: 'Press 3 or click Cross while the set is up', touch: 'Tap Cross while the set is up' },
      server: 1, script: { cpuServe: EASY_SERVE, noDig: 1 },
      beats: attackBeats('Set your right-side hitter (3).', 2, [
        pickShot('cross', 'Pick Cross. It angles the ball across the court by itself.'),
        { slow: 0.15, say: 'Watch it cut back across the block.', dur: 1.2 }
      ], 'Cross-court kill.')
    },
    {
      name: 'Roll', title: 'Shot: Roll',
      body: 'Roll is a slow, high shot that floats over the block and drops into open space. Great when their defenders are playing deep.',
      keys: { pc: 'Press 4 or click Roll, then click a spot', touch: 'Tap Roll, then tap a spot' },
      server: 1, script: { cpuServe: EASY_SERVE, noDig: 1 },
      beats: attackBeats('Set your middle hitter (2) for a quick attack.', 1, [
        pickShot('roll', 'Pick Roll.'),
        tapSpot(13.2, 6.0, 'Tap the open space between their front and back rows.')
      ], 'It floats over the block and drops in.')
    },
    {
      name: 'Tip', title: 'Shot: Tip',
      body: 'Tip drops the ball just over the net while their defenders are back, waiting for a big spike. Shortcut: hold Shift while you click a spot (or long-press it on a phone) to tip there.',
      keys: { pc: 'Press 5, or Shift + click a spot', touch: 'Tap Tip then a spot, or long-press a spot' },
      server: 1, script: { cpuServe: EASY_SERVE, noDig: 1 },
      beats: attackBeats('Set your left-side hitter (1).', 0, [
        pickShot('tip', 'Pick Tip.'),
        tapSpot(11.1, 6.6, 'Tap just behind their blockers. The blue ring marks a tip.')
      ], 'A soft tip behind the block. Nobody home.')
    },
    {
      name: 'Tool', title: 'Shot: Tool',
      body: 'Tool hits hard off the blockers\' hands so the ball flies out of bounds. They touched it last, so the point is yours. Use it against a big block.',
      keys: { pc: 'Press 6 or click Tool while the set is up', touch: 'Tap Tool while the set is up' },
      server: 1, script: { cpuServe: EASY_SERVE, noDig: 1, block: 'out' },
      beats: attackBeats('Set your left-side hitter (1).', 0, [
        pickShot('tool', 'Pick Tool. It aims at the edge of the block by itself.'),
        { slow: 0.15, say: 'Aiming at their hands, not the floor.', dur: 1.2 }
      ], 'Off the block and out: your point.')
    },
    {
      name: 'Block', title: 'Block: commit to a side',
      body: 'When they pass, call your block before their setter sets. Commit Left, Middle or Right to stack all three blockers there. Guess right and the hitter meets a wall; guess wrong and the net is wide open.',
      keys: { pc: 'Press 1 to 3, or click a button or a B zone', touch: 'Tap Left, Middle or Right' },
      server: 0, script: { cpuHitter: 'right', cpuShot: 'power', block: 'stuff' },
      beats: [
        { wait: prompt('serve'), say: 'This time you serve and they attack.', aim: aimAt, dur: 1.6, during: sweep(SERVE_TO_PASSER), act: function (r) { r.humanServe(); } },
        { wait: prompt('block'), slow: 0.05, say: 'Their hitters glow orange. You expect the set to go to the hitter on your left: commit Left.', aim: { btn: 'left' }, dur: 3.2, act: function (r) { r.pickBlock('left'); } },
        { slow: 0.3, say: 'All three blockers slide over before the set.', dur: 1.6 },
        { wait: dead, say: 'Stuff block! You read it right.', dur: 2.6, end: true }
      ]
    },
    {
      name: 'Read', title: 'Read and dig',
      body: 'Not sure where the set is going? Read keeps your blockers home: two of them watch the set and jump with the hitter. If the spike gets past, your back row digs it. Make no call and your setter and hitter choose for you.',
      keys: { pc: 'Press 4 or click Read', touch: 'Tap Read' },
      server: 0, script: { cpuHitter: 'left', cpuShot: 'power', cpuAim: [2.2, 4.3] },
      beats: [
        { wait: prompt('serve'), say: 'You serve again.', aim: aimAt, dur: 1.4, during: sweep(SERVE_TO_PASSER), act: function (r) { r.humanServe(); } },
        { wait: prompt('block'), slow: 0.05, say: 'This time, pick Read to react to the set instead of guessing.', aim: { btn: 'read' }, dur: 2.8, act: function (r) { r.pickBlock('read'); } },
        { wait: their, slow: 0.12, say: 'The spike gets past the block, but your back row is already moving to dig it.', aim: { w: [2.2, 4.3] }, dur: 1.8 },
        { wait: prompt('hitter'), enter: function (r) { r.script.noDig = 1; }, slow: 0.5, say: 'No call this time: your setter picks the hitter and the shot.', dur: 1.2 },
        { wait: dead, say: 'Point! Dug, set and put away without a single call.', dur: 2.8, end: true }
      ]
    },
    {
      name: 'Scoring', title: 'Scoring and rules',
      body: '<ul><li>Rally scoring: every rally wins a point, whoever served.</li><li>Win each set by two. Before a match, choose 5, 11 or 15 points and 1, 3 or 5 sets.</li><li>Win a rally on their serve and you take the serve; your team rotates one spot.</li><li>Press P or Esc to pause. Wins earn stars to spend in the Shop.</li><li>Play online: create a room and send the code to a friend.</li></ul>',
      stage: 'idle', last: true,
      beats: [
        { say: 'The scoreboard: points in white, sets in gold. The small ball marks who serves.', aim: { board: true }, dur: 4 },
        { say: 'You are ready. Play a match, or watch any skill again.', dur: 0.1 }
      ]
    }
  ];

  // ---- staging --------------------------------------------------------------

  function clearFx() {
    var fx = SR.fx;
    fx.parts.length = 0; fx.rings.length = 0; fx.marks.length = 0;
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

  function go(i) {
    ch = Math.max(0, Math.min(CH.length - 1, i));
    bi = 0; started = false; bt = 0; waitT = 0; spec = null;
    stage(CH[ch]);
    panel();
  }

  // ---- director ---------------------------------------------------------------

  D.tick = function (dt) {
    if (!game || SR.game !== game) { if (D.active) D.stop(true); return; }
    if (!playing) return;
    var c = CH[ch], b = c.beats[bi];
    if (!b) { rally.loopScale = 1; return; }
    if (!started) {
      if (b.wait && !b.wait(rally)) {
        rally.loopScale = b.fast || 1;
        waitT += dt;
        // Off script (the rally ended early or stalled): replay the scene.
        if ((rally.state === 'dead' && b.wait !== dead && rally.stateT > 0.4) || waitT > 16) {
          if (retries++ < 2) go(ch); else next();
        }
        return;
      }
      started = true; bt = 0; waitT = 0;
      if (b.enter) b.enter(rally);
      rally.loopScale = b.slow || 1;
      spec = b.aim || null;
      say(b.say);
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

  function next() {
    if (ch < CH.length - 1) go(ch + 1);
  }

  // ---- pointer ----------------------------------------------------------------

  function resolve(s, v) {
    if (!s) return null;
    if (typeof s === 'function') s = s(rally);
    if (!s) return null;
    if (s.w) { var q = v.proj(s.w[0], s.w[1], 0); return { x: q.x + v.panX, y: q.y }; }
    if (s.btn) {
      var b = v.buttons.find(function (o) { return o.id === s.btn; });
      return b ? { x: b.x + b.w / 2, y: b.y + b.h / 2 } : null;
    }
    if (s.head !== undefined) {
      var h = rally.ui.hitters[s.head], hd = h && v.heads.find(function (o) { return o.p === h.p; });
      return hd ? { x: hd.x, y: hd.y - 30 } : null;
    }
    if (s.board) { var k = Math.min(v.portrait ? 1.25 : 1, (v.W - 20) / 500); return { x: v.W / 2 - 62 * k, y: 10 + 40 * k }; }
    return null;
  }

  D.draw = function (ctx, v) {
    var now = performance.now() / 1000, t = resolve(spec, v);
    if (t) {
      if (!ptr.seen) { ptr.x = t.x + 60; ptr.y = t.y + 80; ptr.seen = true; }
      var k = Math.min(1, 0.16 * (playing ? 1 : 0.6));
      ptr.x += (t.x - ptr.x) * k; ptr.y += (t.y - ptr.y) * k;
      ptr.a = Math.min(1, ptr.a + 0.08);
    } else {
      ptr.a = Math.max(0, ptr.a - 0.06);
      if (ptr.a === 0) ptr.seen = false;
    }
    var tap = now - ptr.tapAt;
    if (tap < 0.6) {
      var e = tap / 0.6;
      ctx.beginPath(); ctx.arc(ptr.x, ptr.y, 10 + 34 * e, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,210,63,' + (1 - e) + ')'; ctx.lineWidth = 4 * (1 - e) + 1; ctx.stroke();
    }
    if (ptr.a <= 0) return;
    var press = tap < 0.18 ? 0.85 : 1;
    ctx.save();
    ctx.globalAlpha = ptr.a;
    ctx.translate(ptr.x, ptr.y); ctx.scale(press, press);
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2;
    if (SR.touch) {
      // A fingertip: soft disc with a bright core.
      ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
    } else {
      // A mouse arrow with its tip on the target.
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(0, 26); ctx.lineTo(6.5, 20); ctx.lineTo(11, 30); ctx.lineTo(15, 28); ctx.lineTo(10.5, 18.5); ctx.lineTo(19, 18.5);
      ctx.closePath();
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.shadowBlur = 0; ctx.lineWidth = 2; ctx.strokeStyle = '#0b1220'; ctx.lineJoin = 'round'; ctx.stroke();
    }
    ctx.restore();
  };

  // ---- caption panel ------------------------------------------------------------

  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }

  function say(text) {
    if (!text) return;
    var el = $('demo-now');
    el.textContent = text;
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  }

  function panel() {
    var c = CH[ch];
    $('demo-count').textContent = (ch + 1) + ' / ' + CH.length;
    $('demo-title').textContent = c.title;
    $('demo-body').innerHTML = c.body.charAt(0) === '<' ? c.body : '<p>' + esc(c.body) + '</p>';
    var k = c.keys;
    $('demo-keys').innerHTML = k ? '<span><b>PC</b>' + esc(k.pc) + '</span><span><b>Phone</b>' + esc(k.touch) + '</span>' : '';
    $('demo-keys').classList.toggle('hidden', !k);
    $('demo-now').textContent = '';
    $('demo-bar').style.width = ((ch + 1) / CH.length * 100) + '%';
    $('demo-prev').disabled = ch === 0;
    $('demo-next').classList.toggle('hidden', !!c.last);
    $('demo-end').classList.toggle('hidden', !c.last);
    document.querySelectorAll('#demo-chapters button').forEach(function (b, i) {
      b.classList.toggle('on', i === ch); b.classList.toggle('done', i < ch);
      if (i === ch) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    // On a phone the chapter chips scroll sideways: keep the current one in view.
    var list = $('demo-chapters'), cur = list.querySelector('button.on');
    if (cur && list.scrollWidth > list.clientWidth) {
      list.scrollLeft += cur.getBoundingClientRect().left - list.getBoundingClientRect().left - (list.clientWidth - cur.offsetWidth) / 2;
    }
    $('demo').classList.toggle('last', !!c.last);
    $('demo-scroll').scrollTop = 0;
  }

  function setPlaying(on) {
    playing = on;
    if (game) game.paused = !on;
    var b = $('demo-play');
    b.innerHTML = on ? '❚❚<span class="lbl"> Pause</span>' : '▶<span class="lbl"> Play</span>';
    b.setAttribute('aria-label', on ? 'Pause' : 'Play');
  }

  // Captions take a strip on the right on wide screens, at the bottom otherwise.
  D.layout = function (vw, vh) {
    var el = $('demo'), side = vw / vh >= 1.25 && vw >= 640;
    el.classList.toggle('side', side); el.classList.toggle('bottom', !side);
    if (side) {
      var w = Math.round(Math.min(380, Math.max(260, vw * 0.3)));
      el.style.width = w + 'px'; el.style.height = '';
      el.classList.toggle('narrow', w < 320);
      return { w: vw - w, h: vh };
    }
    var h = Math.round(Math.min(310, Math.max(220, vh * 0.36)));
    el.style.height = h + 'px'; el.style.width = '';
    el.classList.toggle('narrow', vw < 340);
    return { w: vw, h: vh - h };
  };

  D.start = function (origin) {
    from = origin || 'help';
    SR.ui.show(null);
    $('hud').classList.add('hidden');
    $('demo').classList.remove('hidden');
    var away = SR.TEAMS[1];
    game = SR.game = new SR.Game({ home: SR.TEAMS[0], away: away, format: SR.formatId(15, 1), difficulty: 'normal', human: 0, demo: true, mode: 'demo' });
    rally = game.rally;
    D.active = true;
    retries = 0;
    setPlaying(true);
    SR.resize();
    go(0);
  };

  // quiet: the match was replaced elsewhere (e.g. an online invite), so just tidy up.
  D.stop = function (quiet) {
    D.active = false;
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
      return '<li><button type="button" title="' + c.title + '"><span>' + (i + 1) + '</span>' + c.name + '</button></li>';
    }).join('');
    list.querySelectorAll('button').forEach(function (b, i) {
      b.addEventListener('click', function () { SR.audio.play('click'); retries = 0; go(i); setPlaying(true); });
    });
    function on(id, fn) { $(id).addEventListener('click', function () { SR.audio.play('click'); fn(); }); }
    on('demo-prev', function () { retries = 0; go(ch - 1); setPlaying(true); });
    on('demo-next', function () { retries = 0; go(ch + 1); setPlaying(true); });
    on('demo-play', function () { setPlaying(!playing); });
    on('demo-replay', function () { retries = 0; go(ch); setPlaying(true); });
    on('demo-exit', function () { D.stop(); });
    on('demo-again', function () { retries = 0; go(0); setPlaying(true); });
    on('demo-quick', function () { D.stop(true); SR.ui.show('scr-menu'); $('btn-quick').click(); });
    on('demo-help', function () { D.stop(true); SR.ui.show('scr-help'); });
    // Tapping the court pauses and resumes.
    $('game').addEventListener('pointerup', function () { if (D.active) setPlaying(!playing); });
    window.addEventListener('keydown', function (e) {
      if (!D.active) return;
      var t = e.target && e.target.tagName;
      if (e.key === 'ArrowRight') { go(ch + 1); setPlaying(true); }
      else if (e.key === 'ArrowLeft') { go(ch - 1); setPlaying(true); }
      else if (e.key === ' ' && t !== 'BUTTON') setPlaying(!playing);
      else if (e.key === 'Escape') D.stop();
      else return;
      e.preventDefault();
    });
    ['btn-demo', 'btn-demo-2'].forEach(function (id) { if ($(id)) on(id, function () { D.start('help'); }); });
  }

  window.addEventListener('load', init);
})();
