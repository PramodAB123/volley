// Menus and modes: quick match, league, tournament, shop, stats, settings.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var current = null, mode = 'quick', pickStep = 0, pickedHome = null;

  function show(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.toggle('hidden', s.id !== id); });
    current = id;
    $('hud').classList.toggle('hidden', id !== null);
    SR.cg.syncGameplay();
  }

  function save() { SR.save.write(); refreshStars(); }
  function data() { return SR.save.data; }
  function team(id) { return SR.teamById(id); }

  function refreshStars() {
    document.querySelectorAll('[data-stars]').forEach(function (el) { el.textContent = data().stars; });
  }

  function chip(t) {
    return '<span class="chip" style="background:' + t.color + '"></span>';
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }

  // ---- no match behind the menus ------------------------------------------

  // Menus sit on the cover art (see #app.menu-bg in style.css), not a match.
  function stopMatch() {
    SR.game = null;
  }

  // ---- team select --------------------------------------------------------

  function openTeams(m) {
    mode = m; pickStep = 0; pickedHome = null;
    renderTeams();
    show('scr-teams');
  }

  function renderTeams() {
    var title = mode === 'quick' ? (pickStep === 0 ? 'Choose your team' : 'Choose your opponent') :
      (mode === 'league' ? 'League: choose your team' : 'Tournament: choose your team');
    $('teams-title').textContent = SR.t(title);
    teamCards($('team-grid'), pickStep === 1 && pickedHome ? pickedHome.id : null, pickTeam);
    rulesPicker($('team-rules'));
  }

  // Points-per-set and number-of-sets choices, saved as the match format.
  function rulesPicker(box) {
    var s = data().settings, f0 = SR.formatOf(s.format), f = SR.formatOf(SR.formatId(f0.points, f0.sets));
    function group(name, opts, cur, fmt) {
      name = SR.t(name);
      return '<div class="rule"><span class="rule-name">' + name + '</span><div class="seg" role="radiogroup" aria-label="' + name + '">' +
        opts.map(function (o) { return '<button type="button" role="radio" aria-checked="' + (o === cur) + '" class="' + (o === cur ? 'on' : '') + '" data-v="' + o + '">' + fmt(o) + '</button>'; }).join('') + '</div></div>';
    }
    box.innerHTML = group('Points per set', SR.POINT_OPTIONS, f.points, String) +
      group('Sets', SR.SET_OPTIONS, f.sets, function (n) { return n === 1 ? '1' : SR.t('Best of {n}', { n: n }); }) +
      '<p class="rule-sum muted small">' + SR.formatLabel(f) + '</p>';
    box.querySelectorAll('.rule').forEach(function (r, gi) {
      r.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          var v = +b.getAttribute('data-v'), cur = SR.formatOf(data().settings.format);
          data().settings.format = gi === 0 ? SR.formatId(v, cur.sets) : SR.formatId(cur.points, v);
          save();
          SR.audio.play('click');
          rulesPicker(box);
        });
      });
    });
  }

  // Fill `grid` with a card per team (skipping `skipId`); onPick(team) on click.
  function teamCards(grid, skipId, onPick) {
    grid.innerHTML = '';
    SR.TEAMS.forEach(function (t) {
      if (t.id === skipId) return;
      var b = document.createElement('button');
      b.className = 'team-card';
      var pw = SR.teamPower(t);
      b.innerHTML = '<span class="jersey" style="background:' + t.color + ';color:' + t.trim + '">' + t.short + '</span>' +
        '<span class="tname">' + t.name + '</span>' +
        '<span class="tstats">' + SR.t('ATK') + ' ' + t.r.attack + ' · ' + SR.t('BLK') + ' ' + t.r.block + ' · ' + SR.t('PASS') + ' ' + t.r.pass + ' · ' + SR.t('SRV') + ' ' + t.r.serve + '</span>' +
        '<span class="meter"><span style="width:' + Math.round((pw - 60) / 30 * 100) + '%"></span></span>';
      b.addEventListener('click', function () { onPick(t); });
      grid.appendChild(b);
    });
  }

  function pickTeam(t) {
    SR.audio.play('click');
    if (mode === 'quick') {
      if (pickStep === 0) { pickedHome = t; pickStep = 1; renderTeams(); return; }
      startMatch(pickedHome, t);
      return;
    }
    data().settings.team = t.id;
    if (mode === 'league') newLeague(t.id);
    else newCup(t.id);
  }

  // ---- matches ------------------------------------------------------------

  function startMatch(home, away) {
    var s = data().settings;
    show(null);
    SR.game = new SR.Game({ home: home, away: away, format: s.format, difficulty: s.difficulty, human: 0, mode: mode, onEnd: finishMatch });
  }

  function finishMatch(game) {
    var m = game.match, won = m.winner === 0, st = data().stats, stars = 0;
    st.matches++;
    if (won) st.wins++;
    m.history.forEach(function (s) { st.points += s[0]; });
    st.aces += m.stats[0].aces; st.kills += m.stats[0].kills; st.blocks += m.stats[0].blocks;
    var notes = [];
    var result = { winner: m.winner, sets: m.sets.slice(), scores: m.history.slice() };

    if (mode === 'quick') { if (won) stars += SR.STARS.quickWin; }
    else if (mode === 'league') { var r = leagueRecord(result); stars += r.stars; notes = r.notes; }
    else if (mode === 'cup') { var c = cupRecord(result); stars += c.stars; notes = c.notes; }
    data().stars += stars;
    save();

    $('result-title').textContent = SR.t(won ? 'Victory!' : 'Defeat');
    $('result-title').className = won ? 'win' : 'loss';
    $('result-sub').textContent = m.teams[0].name + ' ' + m.sets[0] + ' - ' + m.sets[1] + ' ' + m.teams[1].name;
    $('result-sets').textContent = m.history.map(function (s) { return s[0] + '-' + s[1]; }).join('   ');
    $('result-stats').textContent = SR.t('Aces {a} · Kills {k} · Blocks {b} · Errors {e}', { a: m.stats[0].aces, k: m.stats[0].kills, b: m.stats[0].blocks, e: m.stats[0].errors });
    $('result-stars').textContent = stars ? SR.t(stars > 1 ? '+{n} stars' : '+{n} star', { n: stars }) : SR.t('No stars this time');
    $('result-notes').textContent = notes.join(' ');
    onlineButtons(false);
    // End of a match is a natural break for a midgame ad (CrazyGames spaces
    // them out; if none plays, the result shows straight away).
    SR.cg.midgame(function () {
      stopMatch();
      show('scr-result');
    });
  }

  // ---- league -------------------------------------------------------------

  function newLeague(myId) {
    var others = shuffle(SR.TEAMS.map(function (t) { return t.id; }).filter(function (id) { return id !== myId; })).slice(0, 5);
    var ids = [myId].concat(others), rounds = [];
    var rot = ids.slice(1);
    for (var r = 0; r < 5; r++) {
      var arr = [ids[0]].concat(rot), pairs = [];
      for (var i = 0; i < 3; i++) pairs.push([arr[i], arr[5 - i]]);
      rounds.push(pairs);
      rot.unshift(rot.pop());
    }
    var table = {};
    ids.forEach(function (id) { table[id] = { p: 0, w: 0, l: 0, sw: 0, sl: 0, pts: 0 }; });
    data().league = { me: myId, teams: ids, rounds: rounds, round: 0, table: table, log: [], done: false };
    save();
    openLeague();
  }

  function addResult(table, a, b, res) {
    var ta = table[a], tb = table[b];
    ta.p++; tb.p++;
    ta.sw += res.sets[0]; ta.sl += res.sets[1]; tb.sw += res.sets[1]; tb.sl += res.sets[0];
    if (res.winner === 0) { ta.w++; tb.l++; ta.pts += 3; } else { tb.w++; ta.l++; tb.pts += 3; }
  }

  function standings(L) {
    return L.teams.slice().sort(function (a, b) {
      var x = L.table[a], y = L.table[b];
      return (y.pts - x.pts) || ((y.sw - y.sl) - (x.sw - x.sl)) || (y.sw - x.sw);
    });
  }

  function myFixture(L) {
    if (L.done) return null;
    var pair = L.rounds[L.round].find(function (p) { return p[0] === L.me || p[1] === L.me; });
    return pair[0] === L.me ? pair[1] : pair[0];
  }

  function leagueRecord(res) {
    var L = data().league, out = { stars: 0, notes: [] };
    if (!L) return out;
    var opp = myFixture(L);
    addResult(L.table, L.me, opp, res);
    L.log.unshift(team(L.me).short + ' ' + res.sets[0] + '-' + res.sets[1] + ' ' + team(opp).short);
    if (res.winner === 0) out.stars += SR.STARS.leagueWin;
    L.rounds[L.round].forEach(function (p) {
      if (p[0] === L.me || p[1] === L.me) return;
      var r = SR.simMatch(team(p[0]), team(p[1]), data().settings.format);
      addResult(L.table, p[0], p[1], r);
      L.log.unshift(team(p[0]).short + ' ' + r.sets[0] + '-' + r.sets[1] + ' ' + team(p[1]).short);
    });
    L.round++;
    if (L.round >= L.rounds.length) {
      L.done = true;
      var top = standings(L)[0];
      if (top === L.me) { SR.cg.happytime(); out.stars += SR.STARS.leagueTitle; out.notes.push(SR.t('League champions! +{n} bonus stars.', { n: SR.STARS.leagueTitle })); }
      else out.notes.push(SR.t('League finished. {team} took the title.', { team: team(top).name }));
    }
    return out;
  }

  function openLeague() {
    var L = data().league;
    if (!L) { openTeams('league'); return; }
    mode = 'league';
    var rows = standings(L).map(function (id, i) {
      var t = L.table[id], tm = team(id);
      return '<tr class="' + (id === L.me ? 'me' : '') + '"><td>' + (i + 1) + '</td><td>' + chip(tm) + tm.name + '</td><td>' + t.p + '</td><td>' + t.w + '</td><td>' + t.l + '</td><td>' + t.sw + ':' + t.sl + '</td><td><b>' + t.pts + '</b></td></tr>';
    }).join('');
    $('league-table').innerHTML = '<thead><tr><th>#</th>' + ['Team', 'P', 'W', 'L', 'Sets', 'Pts'].map(function (h) { return '<th>' + SR.t(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody>';
    var opp = myFixture(L);
    $('league-next').textContent = L.done ? SR.t('Season complete.') : SR.t('Round {r} of 5: {a} vs {b}', { r: L.round + 1, a: team(L.me).name, b: team(opp).name });
    $('league-log').textContent = L.log.slice(0, 6).join('  ·  ');
    $('btn-league-play').classList.toggle('hidden', L.done);
    $('btn-league-new').classList.toggle('hidden', !L.done);
    show('scr-league');
  }

  // ---- tournament ---------------------------------------------------------

  function newCup(myId) {
    var others = shuffle(SR.TEAMS.map(function (t) { return t.id; }).filter(function (id) { return id !== myId; }));
    var ids = shuffle([myId].concat(others.slice(0, 7))), qf = [];
    for (var i = 0; i < 8; i += 2) qf.push({ a: ids[i], b: ids[i + 1], w: null, score: '' });
    data().tournament = { me: myId, rounds: [qf], round: 0, out: false, champion: null };
    save();
    openCup();
  }

  function cupMyMatch(T) {
    if (T.champion) return null;
    return T.rounds[T.round].find(function (m) { return m.a === T.me || m.b === T.me; }) || null;
  }

  function advanceCup(T) {
    var cur = T.rounds[T.round];
    cur.forEach(function (m) {
      if (m.w) return;
      var r = SR.simMatch(team(m.a), team(m.b), data().settings.format);
      m.w = r.winner === 0 ? m.a : m.b;
      m.score = r.sets[0] + '-' + r.sets[1];
    });
    if (cur.length === 1) { T.champion = cur[0].w; return; }
    var next = [];
    for (var i = 0; i < cur.length; i += 2) next.push({ a: cur[i].w, b: cur[i + 1].w, w: null, score: '' });
    T.rounds.push(next);
    T.round++;
  }

  function cupRecord(res) {
    var T = data().tournament, out = { stars: 0, notes: [] };
    if (!T) return out;
    var m = cupMyMatch(T);
    var meA = m.a === T.me, opp = meA ? m.b : m.a;
    m.w = res.winner === 0 ? T.me : opp;
    m.score = meA ? res.sets[0] + '-' + res.sets[1] : res.sets[1] + '-' + res.sets[0];
    if (res.winner === 0) out.stars += SR.STARS.cupWin;
    else T.out = true;
    advanceCup(T);
    while (T.out && !T.champion) advanceCup(T);
    if (T.champion === T.me) { SR.cg.happytime(); out.stars += SR.STARS.cupTitle; out.notes.push(SR.t('Cup winners! +{n} bonus stars.', { n: SR.STARS.cupTitle })); }
    else if (T.out) out.notes.push(SR.t(T.rounds.length === 3 && T.rounds[2][0].w && (T.rounds[2][0].a === T.me || T.rounds[2][0].b === T.me) ? 'Runners-up. {team} won the cup.' : 'Knocked out. {team} won the cup.', { team: team(T.champion).name }));
    return out;
  }

  function openCup() {
    var T = data().tournament;
    if (!T) { openTeams('cup'); return; }
    mode = 'cup';
    var names = ['Quarter-finals', 'Semi-finals', 'Final'].map(function (n) { return SR.t(n); });
    var html = '';
    for (var r = 0; r < 3; r++) {
      html += '<div class="round"><h3>' + names[r] + '</h3>';
      var ms = T.rounds[r];
      if (!ms) { html += '<div class="match tbd">' + SR.t('To be decided') + '</div>'; }
      else ms.forEach(function (m) {
        var line = function (id) {
          var t = team(id);
          var cls = (m.w ? (m.w === id ? 'won' : 'lost') : '') + (id === T.me ? ' me' : '');
          return '<div class="slot ' + cls + '">' + chip(t) + t.short + '</div>';
        };
        html += '<div class="match">' + line(m.a) + line(m.b) + (m.score ? '<div class="score">' + m.score + '</div>' : '') + '</div>';
      });
      html += '</div>';
    }
    $('cup-bracket').innerHTML = html;
    var mine = cupMyMatch(T);
    var msg;
    if (T.champion) msg = T.champion === T.me ? SR.t('You won the cup!') : SR.t('{team} won the cup.', { team: team(T.champion).name });
    else msg = SR.t('{round}: {a} vs {b}', { round: names[T.round], a: team(mine.a).name, b: team(mine.b).name });
    $('cup-next').textContent = msg;
    $('btn-cup-play').classList.toggle('hidden', !!T.champion);
    $('btn-cup-new').classList.toggle('hidden', !T.champion);
    show('scr-cup');
  }

  // ---- shop, stats, settings ----------------------------------------------

  // Rewarded video in the shop: an optional way to earn stars, offered at
  // most once every few minutes and hidden when ads can't play.
  var adReadyAt = 0, adNote = '';

  function renderShopAd() {
    var box = $('shop-ad'), btn = $('btn-ad-stars'), note = $('shop-ad-note');
    if (!SR.cg.ready || SR.cg.adsOff) { box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    btn.innerHTML = '<span class="ad-icon" aria-hidden="true">▶</span> ' + SR.t('Watch a video: +{n} ★', { n: SR.STARS.adReward });
    var wait = Math.ceil((adReadyAt - Date.now()) / 60000);
    if (SR.cg.adblock) {
      btn.classList.add('hidden');
      note.textContent = SR.t('Free-star videos are unavailable while an ad blocker is on. You can still earn stars by winning matches.');
    } else if (wait > 0) {
      btn.classList.add('hidden');
      note.textContent = adNote || SR.t('More free stars in {n} min.', { n: wait });
    } else {
      btn.classList.remove('hidden');
      note.textContent = adNote;
    }
  }

  function watchAdForStars() {
    if (!SR.cg.rewardedAvailable() || Date.now() < adReadyAt) return;
    adNote = '';
    SR.cg.rewarded(function () {
      data().stars += SR.STARS.adReward;
      save();
      adReadyAt = Date.now() + SR.AD_REWARD_COOLDOWN_MS;
      adNote = SR.t('Thanks for watching! +{n} stars added.', { n: SR.STARS.adReward });
      SR.audio.play('cheer');
      renderShop();
      var badge = document.querySelector('#scr-shop .stars-badge');
      if (badge) { badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop'); }
      setTimeout(function () { adNote = ''; if (current === 'scr-shop') renderShopAd(); }, 4000);
    }, function (err) {
      adNote = err && err.code === 'adblock' ? '' : SR.t('No video available right now. Please try again later.');
      renderShop();
    });
  }

  function renderShop() {
    renderShopAd();
    ['balls', 'courts'].forEach(function (kind) {
      var box = $('shop-' + kind), key = kind === 'balls' ? 'ball' : 'court';
      box.innerHTML = '';
      SR.SHOP[kind].forEach(function (it) {
        var owned = data().owned[kind].indexOf(it.id) >= 0, eq = data().equipped[key] === it.id;
        var b = document.createElement('button');
        b.className = 'shop-item' + (eq ? ' equipped' : '');
        var sw = kind === 'balls'
          ? '<span class="swatch ball" style="background:radial-gradient(circle at 35% 35%,' + it.main + ' 55%,' + it.stripe + ' 56%)"></span>'
          : '<span class="swatch" style="background:linear-gradient(135deg,' + it.court + ' 50%,' + it.floor + ' 50%);border-color:' + it.line + '"></span>';
        b.innerHTML = sw + '<span class="iname">' + SR.t(it.name) + '</span><span class="iprice">' +
          (eq ? SR.t('Equipped') : owned ? SR.t('Equip') : '★ ' + it.price) + '</span>';
        b.addEventListener('click', function () {
          if (!owned) {
            if (data().stars < it.price) { b.classList.add('shake'); setTimeout(function () { b.classList.remove('shake'); }, 400); return; }
            data().stars -= it.price;
            data().owned[kind].push(it.id);
          }
          data().equipped[key] = it.id;
          SR.audio.play('click');
          save();
          renderShop();
        });
        box.appendChild(b);
      });
    });
  }

  function renderStats() {
    var s = data().stats, pct = s.matches ? Math.round(s.wins / s.matches * 100) : 0;
    var rows = [['Matches', s.matches], ['Wins', s.wins + ' (' + pct + '%)'], ['Points won', s.points], ['Aces', s.aces], ['Kills', s.kills], ['Blocks', s.blocks], ['Stars', data().stars]];
    $('stats-list').innerHTML = rows.map(function (r) { return '<div class="stat"><span>' + SR.t(r[0]) + '</span><b>' + r[1] + '</b></div>'; }).join('');
  }

  function fillSettings() {
    var s = data().settings;
    var ids = [];
    SR.SET_OPTIONS.forEach(function (n) { SR.POINT_OPTIONS.forEach(function (pt) { ids.push(SR.formatId(pt, n)); }); });
    // Older saves used named formats; map them onto the same choices.
    var cf = SR.formatOf(s.format);
    s.format = SR.formatId(cf.points, cf.sets);
    $('set-format').innerHTML = ids.map(function (k) { return '<option value="' + k + '">' + SR.formatLabel(SR.formatOf(k)) + '</option>'; }).join('');
    $('set-diff').innerHTML = Object.keys(SR.DIFFICULTY).map(function (k) { return '<option value="' + k + '">' + SR.t(SR.DIFFICULTY[k].label) + '</option>'; }).join('');
    $('set-format').value = s.format;
    $('set-diff').value = s.difficulty;
    $('set-lang').innerHTML = '<option value="auto">' + SR.t('Automatic') + '</option>' +
      Object.keys(SR.LANGS).map(function (k) { return '<option value="' + k + '">' + SR.LANGS[k] + '</option>'; }).join('');
    $('set-lang').value = SR.LANGS[s.lang] ? s.lang : 'auto';
    $('set-sound').checked = !!s.sound && !SR.cg.settings.muteAudio;
    // CrazyGames' mute setting overrides the in-game sound toggle.
    $('set-sound').disabled = !!SR.cg.settings.muteAudio;
    $('sound-note').classList.toggle('hidden', !SR.cg.settings.muteAudio);
  }

  // ---- pause --------------------------------------------------------------

  function togglePause() {
    var g = SR.game;
    if (!g || g.cfg.human === -1 || SR.cg.busy) return;
    // Online the match keeps running for your friend; the menu just opens on top.
    if (g.cfg.online) { show(current === 'scr-pause' ? null : 'scr-pause'); return; }
    g.paused = !g.paused;
    if (g.paused) show('scr-pause'); else show(null);
  }

  function quitMatch() {
    if (SR.game && SR.game.cfg.online && SR.net) { SR.net.leave(); return; }
    stopMatch();
    show('scr-menu');
  }

  // Online results offer a rematch in the same room instead of Continue.
  function onlineButtons(on) {
    $('result-online').classList.toggle('hidden', !on);
    $('btn-result-ok').classList.toggle('hidden', on);
    $('btn-rematch').disabled = false;
  }

  // Result screen for an online match, from this player's side.
  function onlineResult(r) {
    var won = r.mySets > r.oppSets, st = data().stats, stars = won ? SR.STARS.quickWin : 0;
    mode = 'online';
    st.matches++;
    if (won) st.wins++;
    r.history.forEach(function (x) { st.points += x[0]; });
    st.aces += r.stats.aces; st.kills += r.stats.kills; st.blocks += r.stats.blocks;
    data().stars += stars;
    save();
    $('result-title').textContent = SR.t(won ? 'Victory!' : 'Defeat');
    $('result-title').className = won ? 'win' : 'loss';
    $('result-sub').textContent = r.me.name + ' ' + r.mySets + ' - ' + r.oppSets + ' ' + r.opp.name + ' ' + (r.oppName ? SR.t('(vs {name})', { name: r.oppName }) : SR.t('(online)'));
    $('result-sets').textContent = r.history.map(function (x) { return x[0] + '-' + x[1]; }).join('   ');
    $('result-stats').textContent = SR.t('Aces {a} · Kills {k} · Blocks {b} · Errors {e}', { a: r.stats.aces, k: r.stats.kills, b: r.stats.blocks, e: r.stats.errors });
    $('result-stars').textContent = stars ? SR.t('+{n} star', { n: stars }) : SR.t('No stars this time');
    $('result-notes').textContent = '';
    onlineButtons(true);
    SR.cg.midgame(function () {
      stopMatch();
      show('scr-result');
    });
  }

  // ---- wiring -------------------------------------------------------------

  function on(id, fn) { $(id).addEventListener('click', function () { SR.audio.play('click'); fn(); }); }

  SR.ui = {
    togglePause: togglePause,
    show: show,
    current: function () { return current; },
    stopMatch: stopMatch,
    teamCards: teamCards,
    rulesPicker: rulesPicker,
    onlineResult: onlineResult,
    // Redraw anything that shows saved data or SDK settings.
    refresh: function () {
      refreshStars();
      if (current === 'scr-settings') fillSettings();
      if (current === 'scr-shop') renderShop();
      if (current === 'scr-stats') renderStats();
      if (current === 'scr-league') openLeague();
      if (current === 'scr-cup') openCup();
    },
    init: function () {
      refreshStars();
      on('btn-quick', function () { openTeams('quick'); });
      on('btn-league', openLeague);
      on('btn-cup', openCup);
      on('btn-shop', function () { renderShop(); show('scr-shop'); });
      on('btn-stats', function () { renderStats(); show('scr-stats'); });
      on('btn-settings', function () { fillSettings(); show('scr-settings'); });
      on('btn-help', function () { show('scr-help'); });
      on('btn-online', function () { SR.net.openLobby(); });
      document.querySelectorAll('[data-back]').forEach(function (b) {
        b.addEventListener('click', function () { SR.audio.play('click'); show('scr-menu'); });
      });
      on('btn-league-play', function () { var L = data().league; startMatch(team(L.me), team(myFixture(L))); });
      on('btn-league-new', function () { data().league = null; save(); openTeams('league'); });
      on('btn-league-quit', function () { data().league = null; save(); show('scr-menu'); });
      on('btn-cup-play', function () { var T = data().tournament, m = cupMyMatch(T); startMatch(team(T.me), team(m.a === T.me ? m.b : m.a)); });
      on('btn-cup-new', function () { data().tournament = null; save(); openTeams('cup'); });
      on('btn-cup-quit', function () { data().tournament = null; save(); show('scr-menu'); });
      on('btn-result-ok', function () {
        if (mode === 'league') openLeague(); else if (mode === 'cup') openCup(); else show('scr-menu');
      });
      on('btn-rematch', function () { SR.net.rematch(); });
      on('btn-leave-room', function () { SR.net.leave(); });
      $('btn-ad-stars').addEventListener('click', watchAdForStars);
      on('btn-pause', togglePause);
      on('btn-resume', togglePause);
      on('btn-quit', function () { quitMatch(); });
      // Two-step reset: the first click arms the button, the second resets.
      var armed = false;
      on('btn-reset', function () {
        var b = $('btn-reset');
        if (!armed) { armed = true; b.textContent = SR.t('Click again to erase everything'); setTimeout(function () { armed = false; b.textContent = SR.t('Reset progress'); }, 3000); return; }
        armed = false; b.textContent = SR.t('Reset progress');
        SR.save.reset(); renderStats(); refreshStars();
      });
      $('set-format').addEventListener('change', function (e) { data().settings.format = e.target.value; save(); });
      $('set-diff').addEventListener('change', function (e) { data().settings.difficulty = e.target.value; save(); });
      $('set-lang').addEventListener('change', function (e) { SR.i18n.set(e.target.value); SR.ui.refresh(); fillSettings(); });
      $('set-sound').addEventListener('change', function (e) { data().settings.sound = e.target.checked; save(); });
      stopMatch();
      show('scr-menu');
    }
  };
})();
