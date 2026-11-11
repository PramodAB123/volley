// Daily challenge: one special match a day, the same for everyone on that
// date (picked from SR.CHALLENGE in data.js with a seed made from the day).
// Each has a goal on top of winning (kills, aces, blocks, few errors, ...),
// a fixed opponent, court and difficulty. Beat it once for the stars; play
// it again as often as you like. Completing days in a row builds a streak.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var timer = 0, hudTimer = 0, back = 'scr-menu';

  // Translated in builds that have SR.t (CrazyGames / GamePix); plain English here.
  function T(s, v) {
    if (SR.t) return SR.t(s, v);
    return v ? s.replace(/\{(\w+)\}/g, function (m, k) { return k in v ? v[k] : m; }) : s;
  }

  function data() { return SR.save.data; }
  function dayKey(t) {
    var d = t || new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function dayNum(key) {
    var p = String(key).split('-');
    return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 864e5);
  }
  function today() { return dayNum(dayKey()); }

  // Saved progress; a new calendar day clears today's tries.
  function prog() {
    var c = data().challenge;
    if (!c || typeof c !== 'object') c = data().challenge = { day: 0, done: false, tries: 0, streak: 0, last: 0, total: 0, best: 0 };
    var t = today();
    if (c.day !== t) { c.day = t; c.done = false; c.tries = 0; }
    return c;
  }
  // Days in a row, still alive if the last one was today or yesterday.
  function streak() { var c = prog(); return c.last >= today() - 1 ? c.streak : 0; }

  // ---- today's challenge ----------------------------------------------------

  // Small seeded random numbers (mulberry32), so a date always gives the same challenge.
  function seeded(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function goalsFor(diff) {
    return SR.CHALLENGE.goals.filter(function (g) { return g.n ? diff in g.n : !g.diffs || g.diffs.indexOf(diff) >= 0; });
  }
  function myTeam() { return SR.teamById(data().settings.team) || SR.TEAMS[0]; }

  // The challenge for day number n. The goal is never the same as the day
  // before (looked at a few days back, which is plenty to keep it stable).
  function make(n, depth) {
    var r = seeded(n * 7919 + 104729), wd = new Date(n * 864e5).getUTCDay();
    var diff = SR.CHALLENGE.week[wd], pool = goalsFor(diff);
    var gi = Math.floor(r() * pool.length);
    if ((depth || 0) < 4 && pool.length > 1 && pool[gi].id === make(n - 1, (depth || 0) + 1).goal.id) gi = (gi + 1) % pool.length;
    var g = pool[gi];
    var me = myTeam(), opps = SR.TEAMS.filter(function (t) { return t.id !== me.id; });
    var courts = SR.CHALLENGE.courts;
    return {
      day: n, diff: diff, goal: g, need: g.n ? g.n[diff] : 0,
      format: g.format || SR.CHALLENGE.format,
      opp: opps[Math.floor(r() * opps.length)],
      court: courts[Math.floor(r() * courts.length)],
      stars: SR.CHALLENGE.stars[diff]
    };
  }
  var cache = null;
  function current() {
    var n = today(), me = data().settings.team;
    if (cache && cache.day === n && cache.me === me) return cache;
    cache = make(n);
    cache.me = me;
    return cache;
  }

  function goalText(c) { return c.need === 1 && c.goal.one ? T(c.goal.one) : T(c.goal.text, { n: c.need }); }

  // Live numbers for the goal, from the match so far (or the final score).
  function totals(m) {
    var opp = 0, mine = 0;
    m.history.forEach(function (s) { mine += s[0]; opp += s[1]; });
    if (!m.over) { mine += m.score[0]; opp += m.score[1]; }
    return { mine: mine, opp: opp, st: m.stats[0], setsLost: m.sets[1] };
  }
  // ok: the extra goal is met (or still can be for limits). line: HUD text.
  function check(c, m) {
    var t = totals(m), n = c.need, id = c.goal.id;
    if (id === 'kills' || id === 'aces' || id === 'blocks') {
      var have = t.st[id], name = id === 'kills' ? T('Kills') : id === 'aces' ? T('Aces') : T('Blocks');
      return { ok: have >= n, line: name + ' ' + Math.min(have, n) + '/' + n };
    }
    if (id === 'errors') return { ok: t.st.errors <= n, line: T('Errors') + ' ' + t.st.errors + '/' + n };
    if (id === 'hold') return { ok: t.opp < n, line: T('Rival points') + ' ' + t.opp + '/' + (n - 1) };
    if (id === 'clean') return { ok: t.setsLost === 0, line: T('Sets lost') + ' ' + t.setsLost };
    return { ok: true, line: T('Win the match') };
  }

  // ---- art --------------------------------------------------------------------

  var TARGET = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.2"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><path d="M15.5 8.5L21 3M17.5 3H21v3.5"/></svg>';
  function crest(t) {
    return '<span class="chal-crest" style="--c:' + t.color + '"><b>' + t.short + '</b></span>';
  }
  function diffPill(d) {
    return '<span class="chal-diff d-' + d + '">' + T(SR.DIFFICULTY[d].label) + '</span>';
  }
  function courtOf(c) { return (SR.courtById && SR.courtById(c.court)) || (SR.ARENAS && SR.ARENAS[c.court]) || null; }

  // ---- screen -----------------------------------------------------------------

  function dateLabel() {
    try { return new Date().toLocaleDateString(document.documentElement.lang || undefined, { weekday: 'long', month: 'long', day: 'numeric' }); }
    catch (e) { return dayKey(); }
  }

  function render() {
    var c = current(), p = prog(), me = myTeam(), a = courtOf(c), s = streak();
    $('chal-date').textContent = dateLabel();
    $('chal-card').innerHTML =
      '<span class="chal-big" aria-hidden="true">' + TARGET + '</span>' +
      '<div class="chal-goal"><small>' + T('Today\'s goal') + '</small><b>' + goalText(c) + '</b>' +
      '<span class="chal-tags">' + diffPill(c.diff) + '<span class="chal-prize">' + SR.GEM + ' +' + c.stars + ' · ' + SR.COIN + ' +' + SR.COINS.challenge + '</span></span></div>' +
      (p.done ? '<span class="chal-done" aria-label="' + T('Completed') + '">✓</span>' : '');
    $('chal-card').classList.toggle('done', p.done);
    $('chal-match').innerHTML =
      '<div class="chal-vs">' + crest(me) + '<span>' + me.name + '</span><i>' + T('vs') + '</i><span>' + c.opp.name + '</span>' + crest(c.opp) + '</div>' +
      '<div class="chal-where">' + (a && SR.ui.courtSwatch ? SR.ui.courtSwatch(a) : '') +
      '<span><b>' + (a ? a.name : '') + '</b><small>' + (SR.formatLabel ? SR.formatLabel(SR.formatOf(c.format)) : SR.formatOf(c.format).label) + '</small></span></div>';
    var play = $('btn-chal-play');
    play.textContent = p.done ? T('Play again') : p.tries ? T('Try again') : T('Play challenge');
    play.classList.toggle('ghost', p.done);
    play.classList.toggle('daily-claim', !p.done);
    var st = p.done ? T('Done! Come back tomorrow for a new challenge.')
      : p.tries ? T('Tries today: {n}. Keep going!', { n: p.tries }) : T('Beat it once today to win the diamonds.');
    $('chal-status').textContent = st;
    $('chal-streak').innerHTML = s ? '🔥 ' + T(s === 1 ? 'Streak: {n} day' : 'Streak: {n} days', { n: s }).replace(/(\d+)/, '<b>$1</b>') + ' · ' + T('every 7 days in a row: +{n} ', { n: SR.CHALLENGE.streakBonus }) + SR.GEM
      : T('Win challenges on days in a row: every 7 days gives +{n} ', { n: SR.CHALLENGE.streakBonus }) + SR.GEM;
    tick();
  }

  function tick() {
    var now = new Date(), mid = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    var ms = mid - now, h = Math.floor(ms / 36e5), m = Math.floor(ms % 36e5 / 6e4);
    var el = $('chal-next');
    if (el) el.innerHTML = T('New challenge in {t}', { t: '<b>' + (h ? h + 'h ' : '') + m + 'm</b>' });
    if (cache && cache.day !== today()) { cache = null; if (SR.ui.current() === 'scr-challenge') render(); }
  }

  // Home screen card: today's goal, and a tick once it is done.
  function teaser() {
    var el = $('home-chal');
    if (!el) return;
    var c = current(), p = prog();
    el.innerHTML = '<span class="ct-ico" aria-hidden="true">' + CLIP + '</span>' +
      '<span class="dt-txt"><b>' + T('Daily Challenge') + (p.done ? ' ✓' : '') + '</b><small>' + goalText(c) + ' <span class="cs-prize">' +
      (p.done ? T('Done for today') : SR.GEM + ' +' + c.stars) + '</span></small></span>' +
      '<span class="cs-prog"><i style="width:' + (p.done ? 100 : 0) + '%"></i><b>' + (p.done ? 1 : 0) + ' / 1</b></span><span class="dt-go" aria-hidden="true">›</span>';
    el.classList.toggle('ready', !p.done);
    el.classList.toggle('done', p.done);
    el.classList.remove('hidden');
  }
  var CLIP = '<svg viewBox="0 0 48 48"><rect x="9" y="8" width="30" height="36" rx="4" fill="#d9fbff" stroke="#0b5a63" stroke-width="2"/><rect x="17" y="4" width="14" height="8" rx="2.5" fill="#53e0f0" stroke="#0b5a63" stroke-width="2"/>' +
    '<path d="M16 27l6 6 11-12" fill="none" stroke="#12a594" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function open() {
    var cur = SR.ui.current();
    back = cur && cur !== 'scr-challenge' && cur !== 'scr-result' ? cur : 'scr-menu';
    render();
    SR.ui.show('scr-challenge');
    clearInterval(timer);
    timer = setInterval(function () { if (SR.ui.current() === 'scr-challenge') tick(); }, 20000);
  }
  function close() { clearInterval(timer); SR.ui.show(back); }

  // ---- the match ----------------------------------------------------------------

  function play() {
    var c = current();
    clearInterval(timer);
    SR.ui.play('daily', myTeam(), c.opp, c.court, c.diff, c.format);
    showHud(c);
  }

  // A small chip next to the pause button with the goal's live count.
  function showHud(c) {
    var el = $('goal-chip');
    if (!el) return;
    clearInterval(hudTimer);
    function upd() {
      var g = SR.game;
      if (!g || !g.cfg || g.cfg.mode !== 'daily') { el.classList.add('hidden'); clearInterval(hudTimer); return; }
      var r = check(c, g.match);
      el.innerHTML = TARGET + '<span>' + r.line + '</span>';
      el.classList.toggle('ok', c.goal.id !== 'win' && r.ok);
      el.classList.toggle('bad', !r.ok && (c.goal.id === 'errors' || c.goal.id === 'hold' || c.goal.id === 'clean'));
      el.classList.remove('hidden');
    }
    upd();
    hudTimer = setInterval(upd, 300);
  }

  // Called by finishMatch: stars won and a note for the result screen.
  function record(m, won) {
    var c = current(), p = prog(), r = check(c, m), out = { stars: 0, notes: [] };
    clearInterval(hudTimer);
    if ($('goal-chip')) $('goal-chip').classList.add('hidden');
    p.tries++;
    if (p.done) { out.notes.push(T('Daily challenge already done today.')); return out; }
    if (won && r.ok) {
      var t = today();
      p.streak = p.last === t - 1 ? p.streak + 1 : 1;
      p.last = t;
      p.done = true;
      p.total++;
      p.best = Math.max(p.best, p.streak);
      out.stars = c.stars;
      out.notes.push(T('Daily challenge complete!'));
      if (p.streak % 7 === 0) {
        out.stars += SR.CHALLENGE.streakBonus;
        out.notes.push(T('{n} days in a row: +{b} bonus diamonds!', { n: p.streak, b: SR.CHALLENGE.streakBonus }));
      }
      if (SR.audio) setTimeout(function () { SR.audio.play('reward'); }, 300);
    } else {
      out.notes.push(T('Challenge not done') + ' (' + (won ? r.line : T('you need to win')) + '). ' + T('Try again!'));
    }
    return out;
  }

  function on(id, fn) { var b = $(id); if (b) b.addEventListener('click', function () { SR.audio.play('click'); fn(); }); }

  SR.challenge = {
    open: open,
    play: play,
    record: record,
    teaser: teaser,
    current: current,
    forDay: function (n) { return make(n); },
    done: function () { return prog().done; },
    // Language or save changed (CrazyGames sign-in): redraw.
    refresh: function () { cache = null; teaser(); if (SR.ui.current() === 'scr-challenge') render(); },
    init: function () {
      on('home-chal', open);
      on('btn-chal-x', close);
      on('btn-chal-back', close);
      on('btn-chal-play', play);
      teaser();
      // Roll over to the new challenge if the game stays open past midnight.
      setInterval(function () { cache = cache && cache.day !== today() ? null : cache; teaser(); }, 60000);
    }
  };
})();
