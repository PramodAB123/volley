// Menus and modes: quick match, career, league, tournament, shop, stats, settings.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var current = null, mode = 'quick', pickStep = 0, pickedHome = null;

  function show(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.toggle('hidden', s.id !== id); });
    current = id;
    $('hud').classList.toggle('hidden', id !== null);
    SR.cg.syncGameplay();
  }

  function save() { SR.save.write(); refreshStars(); refreshCareer(); }
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
      ({ league: 'League: choose your team', cup: 'Tournament: choose your team', career: 'Career: choose your team' })[mode];
    $('teams-title').textContent = SR.t(title);
    teamCards($('team-grid'), pickStep === 1 && pickedHome ? pickedHome.id : null, pickTeam);
    rulesPicker($('team-rules'));
    courtPicker($('team-courts'));
  }

  // Quick match only: play on your Shop court or one of the free themed courts.
  function courtPicker(box) {
    if (mode !== 'quick') { box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    var cur = data().settings.quickCourt || 'mine', mine = SR.render.courtStyle();
    var opts = [{ id: 'mine', a: mine, name: SR.t('My court') }].concat(SR.QUICK_COURTS.map(function (id) { return { id: id, a: SR.ARENAS[id], name: SR.t(SR.ARENAS[id].name) }; }));
    box.innerHTML = '<span class="rule-name">' + SR.t('Court') + '</span><div class="court-pick" role="radiogroup" aria-label="' + SR.t('Court') + '">' +
      opts.map(function (o) {
        return '<button type="button" role="radio" aria-checked="' + (o.id === cur) + '" class="' + (o.id === cur ? 'on' : '') + '" data-v="' + o.id + '">' + courtSwatch(o.a) + '<span>' + o.name + '</span></button>';
      }).join('') + '</div>';
    box.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        data().settings.quickCourt = b.getAttribute('data-v');
        save();
        SR.audio.play('click');
        courtPicker(box);
      });
    });
  }

  // A small picture of a court: floor, court, net, and its floor art if it has one.
  function courtSwatch(a) {
    return '<span class="venue-swatch' + (a.motif ? ' v-' + a.motif : '') + '" style="--vc:' + a.court + ';--vf:' + a.floor + ';--va:' + (a.accent || a.line) + ';--vl:' + a.line + '" aria-hidden="true"><i></i></span>';
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
    if (mode === 'career') careerTeam(t.id);
    else if (mode === 'league') newLeague(t.id);
    else newCup(t.id);
  }

  // ---- matches ------------------------------------------------------------

  function startMatch(home, away, venue, difficulty) {
    var s = data().settings;
    show(null);
    if (mode === 'quick' && SR.ARENAS[s.quickCourt]) venue = s.quickCourt;
    SR.game = new SR.Game({ home: home, away: away, format: s.format, difficulty: difficulty || s.difficulty, human: 0, mode: mode, venue: venue || null, onEnd: finishMatch });
  }

  // ---- venues -------------------------------------------------------------

  // League rounds are played at the opponent's arena, the last round at yours.
  function leagueVenue(L) {
    return L.round === L.rounds.length - 1 ? L.me : myFixture(L);
  }

  // Tournament: the opponent's arena, and Champions Court for the final.
  function cupVenue(T, m) {
    return T.round === 2 ? 'final' : (m.a === T.me ? m.b : m.a);
  }

  // A small card naming the next venue, with a swatch of its court.
  function venueCard(el, id, me) {
    var a = id && SR.ARENAS[id];
    if (!a) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    var host = id === 'final' ? SR.t('Tournament final') : id === me ? SR.t('Your home court') : SR.t('Home of the {team}', { team: team(id).name });
    el.innerHTML = courtSwatch(a) +
      '<span class="venue-text"><small>' + SR.t('Venue') + '</small><b>' + a.name + '</b><span>' + host + '</span></span>';
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
    else if (mode === 'career') { var k = careerRecord(won); stars += k.stars; notes = k.notes; }
    data().stars += stars;
    save();

    $('result-title').textContent = SR.t(won ? 'Victory!' : 'Defeat');
    $('result-title').className = won ? 'win' : 'loss';
    $('result-sub').textContent = m.teams[0].name + ' ' + m.sets[0] + ' - ' + m.sets[1] + ' ' + m.teams[1].name;
    $('result-sets').textContent = m.history.map(function (s) { return s[0] + '-' + s[1]; }).join('   ');
    $('result-stats').textContent = SR.t('Aces {a} · Kills {k} · Blocks {b} · Errors {e}', { a: m.stats[0].aces, k: m.stats[0].kills, b: m.stats[0].blocks, e: m.stats[0].errors });
    $('result-stars').textContent = stars ? SR.t(stars > 1 ? '+{n} stars' : '+{n} star', { n: stars }) : SR.t('No stars this time');
    $('result-notes').textContent = notes.join(' ');
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
    venueCard($('league-venue'), L.done ? null : leagueVenue(L), L.me);
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

  // The bracket: eight crests on a lit arena, lines from each match to the
  // next, your road in gold, and the trophy waiting in the middle.
  var CUP_ROUNDS = ['Quarter-finals', 'Semi-finals', 'Final'], CUP_ONE = ['Quarter-final', 'Semi-final', 'Final'];
  function cupName(r, one) { return SR.t((one ? CUP_ONE : CUP_ROUNDS)[r]); }
  var TROPHY = '<svg class="cup-trophy" viewBox="0 0 64 64" aria-hidden="true">' +
    '<path d="M18 6h28v14c0 9-6 16-14 16s-14-7-14-16z" fill="url(#cup-gold)"/><path d="M18 11H9c0 9 4 14 11 15M46 11h9c0 9-4 14-11 15" fill="none" stroke="url(#cup-gold)" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M29 36h6v9h-6z" fill="#e8a400"/><path d="M21 47h22l3 9H18z" fill="url(#cup-gold)"/><rect x="16" y="55" width="32" height="5" rx="2" fill="#b86e00"/>' +
    '<path d="M24 10c0 7 1 13 5 18" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".55"/><path d="M32 13l1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z" fill="#fff8d6" opacity=".9"/></svg>';

  // A team crest: a shield in the team colour with its kit pattern and code.
  function crest(t) {
    if (!t) return '<span class="crest tbd"><svg viewBox="0 0 32 34" aria-hidden="true"><path d="M16 2l13 4.5V15c0 8.5-5.6 14.5-13 17C8.6 29.5 3 23.5 3 15V6.5z"/><text x="16" y="21">?</text></svg></span>';
    var pat = t.pattern === 'stripes' ? '<path d="M9.5 0h3v34h-3zM19.5 0h3v34h-3z"/>' : t.pattern === 'hoops' ? '<path d="M0 12h32v5H0z"/>' : '<path d="M16 0h16v34H16z"/>';
    return '<span class="crest" style="--tc:' + t.color + ';--tt:' + t.trim + '"><svg viewBox="0 0 32 34" aria-hidden="true">' +
      '<path class="cr-b" d="M16 2l13 4.5V15c0 8.5-5.6 14.5-13 17C8.6 29.5 3 23.5 3 15V6.5z"/>' +
      '<g class="cr-p" clip-path="url(#cup-shield)">' + pat + '</g>' +
      '<path class="cr-s" d="M16 2l13 4.5V15c0 8.5-5.6 14.5-13 17C8.6 29.5 3 23.5 3 15V6.5z"/>' +
      '<text x="16" y="20.5">' + t.short + '</text></svg></span>';
  }

  function cupRow(T, m, side) {
    var id = m && m[side];
    if (!id) return '<div class="cr tbd">' + crest(null) + '<span class="cn"><b>' + SR.t('To be decided') + '</b><b class="abbr">—</b></span><span class="cs"></span></div>';
    var t = team(id), sc = m.score ? m.score.split('-')[side === 'a' ? 0 : 1] : '';
    var cls = (m.w ? (m.w === id ? ' win' : ' lose') : '') + (id === T.me ? ' me' : '');
    return '<div class="cr' + cls + '">' + crest(t) + '<span class="cn"><b>' + t.name + '</b><b class="abbr">' + t.short + '</b></span><span class="cs">' + sc + '</span></div>';
  }

  function cupCard(T, r, i) {
    var m = T.rounds[r] && T.rounds[r][i];
    var mine = m && (m.a === T.me || m.b === T.me);
    var state = !m ? 'tbd' : m.w ? 'done' : mine && !T.champion ? 'next' : 'wait';
    return '<div class="cm ' + state + (mine ? ' mine' : '') + '" data-r="' + r + '" data-i="' + i + '">' +
      (state === 'next' ? '<span class="cm-tag">' + SR.t('Your match') + '</span>' : '') +
      cupRow(T, m, 'a') + cupRow(T, m, 'b') + '</div>';
  }

  function cupLayout() {
    var w = $('cup-scroll').clientWidth || 800;
    // Folded wide but short on room: team codes instead of full names.
    return w >= 980 ? 'wide' : w >= 820 ? 'wide codes' : w >= 520 ? 'mid' : 'tight';
  }

  function openCup() {
    var T = data().tournament;
    if (!T) { openTeams('cup'); return; }
    mode = 'cup';
    show('scr-cup');
    renderCup();
  }

  function renderCup() {
    var T = data().tournament, me = team(T.me), lay = cupLayout(), champ = T.champion && team(T.champion);
    var rnd = T.champion ? 3 : T.round;
    // Columns: wide screens fold the bracket in two around the trophy.
    var cols = lay.indexOf('wide') === 0 ?
      [[0, [0, 1]], [1, [0]], [2, [0]], [1, [1]], [0, [2, 3]]] :
      [[0, [0, 1, 2, 3]], [1, [0, 1]], [2, [0]]];
    var html = '';
    cols.forEach(function (c) {
      var r = c[0], fin = r === 2;
      html += '<div class="cup-colw' + (fin ? ' fin' : '') + (r === rnd ? ' now' : r < rnd ? ' past' : '') + '"><h3>' + cupName(r) + '</h3><div class="cup-col">';
      if (fin) {
        html += '<div class="cup-final">' +
          '<div class="cup-prize' + (champ ? ' won' : '') + '">' + TROPHY + (champ ? '<span class="cup-champ">' + crest(champ) + '<b>' + champ.name + '</b></span>' : '<span class="cup-court">' + SR.t('Champions Court') + '</span>') + '</div>' +
          cupCard(T, 2, 0) + '</div>';
      } else c[1].forEach(function (i) { html += cupCard(T, r, i); });
      html += '</div></div>';
    });
    var box = $('cup-bracket');
    box.className = 'cup-bracket ' + lay;
    box.innerHTML = '<svg class="cup-lines" aria-hidden="true"></svg>' + html;

    // Header: your team, where you are, and the road to the cup.
    var lost = -1;
    T.rounds.forEach(function (ms, r) { ms.forEach(function (m) { if (m.w && m.w !== T.me && (m.a === T.me || m.b === T.me)) lost = r; }); });
    $('cup-sub').innerHTML = chip(me) + me.name + ' · ' + SR.t(T.champion === T.me ? 'Champions!' : lost === 2 ? 'Runners-up' : lost === 1 ? 'Out in the semi-finals' : lost === 0 ? 'Out in the quarter-finals' : CUP_ROUNDS[T.round]);
    $('cup-steps').innerHTML = CUP_ROUNDS.map(function (n, r) {
      var st = lost === r ? 'out' : r < rnd && (lost < 0 || r < lost) ? 'done' : r === rnd ? 'now' : '';
      return '<li class="' + st + '"><span>' + (st === 'done' ? '✓' : st === 'out' ? '✕' : r + 1) + '</span>' + cupName(r, true) + '</li>';
    }).join('') + '<li class="' + (T.champion === T.me ? 'done gold' : '') + '"><span>🏆</span>' + SR.t('Cup') + '</li>';

    // Bottom: the next match with its venue, or how the cup ended.
    var nx = $('cup-next'), mine = cupMyMatch(T);
    $('scr-cup').classList.toggle('cup-won', T.champion === T.me);
    $('btn-cup-quit').classList.toggle('hidden', !mine);
    cupConfetti(T.champion === T.me);
    if (mine) {
      var opp = team(mine.a === T.me ? mine.b : mine.a), vid = cupVenue(T, mine), a = SR.ARENAS[vid];
      var host = vid === 'final' ? SR.t('Tournament final') : vid === T.me ? SR.t('Your home court') : SR.t('Home of the {team}', { team: team(vid).name });
      nx.className = 'cup-next';
      nx.innerHTML = '<div class="cup-vs"><span class="cv me">' + crest(me) + '<b>' + me.short + '</b></span><span class="cv-x">VS</span><span class="cv">' + crest(opp) + '<b>' + opp.short + '</b></span></div>' +
        '<span class="cpick-thumb">' + thumbImg(vid) + '</span>' +
        '<span class="venue-text"><small>' + SR.t('{round} · vs {team}', { round: cupName(T.round, true), team: opp.name }) + '</small><b>' + (a ? SR.t(a.name) : '') + '</b><span>' + host + ' · <i class="cwin">' + SR.t('Win ★ {n}', { n: SR.STARS.cupWin }) + (T.round === 2 ? ' + ' + SR.STARS.cupTitle : '') + '</i></span></span>' +
        '<button id="btn-cup-play" type="button" class="btn primary">' + SR.t('Play match') + '</button>';
      on('btn-cup-play', function () { startMatch(me, opp, vid); });
      thumbQueue.push(vid);
      setTimeout(pumpThumbs, 0);
    } else {
      var won = T.champion === T.me;
      nx.className = 'cup-next over' + (won ? ' won' : '');
      nx.innerHTML = '<span class="cup-end-ico">' + (won ? TROPHY : crest(champ)) + '</span>' +
        '<span class="venue-text"><small>' + SR.t(won ? 'Cup winners' : lost === 2 ? 'Runners-up' : 'Knocked out') + '</small><b>' + (won ? SR.t('You lifted the cup!') : SR.t('{team} won the cup.', { team: champ.name })) + '</b><span>' +
        (won ? SR.t('{team} beat everyone · ★ +{n} bonus', { team: me.name, n: SR.STARS.cupTitle }) : SR.t('Better luck next time. Try again?')) + '</span></span>' +
        '<button id="btn-cup-new" type="button" class="btn primary">' + SR.t('New tournament') + '</button>';
      on('btn-cup-new', function () { data().tournament = null; save(); openTeams('cup'); });
    }
    drawCupLines();
  }

  // Paper confetti falling over the arena when you win the cup.
  function cupConfetti(on) {
    var box = document.querySelector('#scr-cup .cup-confetti');
    if (!on) { if (box) box.remove(); return; }
    if (box) return;
    box = document.createElement('div');
    box.className = 'cup-confetti';
    box.setAttribute('aria-hidden', 'true');
    var cols = ['#ffd23f', '#ff9f1c', '#4d8bff', '#ff4f9a', '#3bf0a0', '#ffffff'], html = '';
    for (var i = 0; i < 46; i++) {
      html += '<b style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[i % cols.length] +
        ';animation-duration:' + (4 + Math.random() * 4).toFixed(2) + 's,' + (1 + Math.random()).toFixed(2) + 's;animation-delay:-' + (Math.random() * 8).toFixed(2) + 's,0s;width:' + (6 + Math.random() * 6).toFixed(0) + 'px"></b>';
    }
    box.innerHTML = html;
    document.querySelector('#scr-cup .cup-arena').appendChild(box);
  }

  // Elbow lines from each match to the one its winner goes to.
  function drawCupLines() {
    var box = $('cup-bracket'), svg = box && box.querySelector('.cup-lines'), T = data().tournament;
    if (!svg || !T) return;
    var o = box.getBoundingClientRect(), d = { todo: '', done: '', me: '' };
    svg.setAttribute('width', box.scrollWidth); svg.setAttribute('height', box.scrollHeight);
    box.querySelectorAll('.cm').forEach(function (el) {
      var r = +el.getAttribute('data-r'), i = +el.getAttribute('data-i');
      if (r === 2) return;
      var to = box.querySelector('.cm[data-r="' + (r + 1) + '"][data-i="' + (i >> 1) + '"]');
      if (!to) return;
      var a = el.getBoundingClientRect(), b = to.getBoundingClientRect(), right = b.left > a.left;
      var x1 = (right ? a.right : a.left) - o.left, y1 = a.top + a.height / 2 - o.top;
      var x2 = (right ? b.left : b.right) - o.left, y2 = b.top + b.height / 2 - o.top, mx = (x1 + x2) / 2;
      var m = T.rounds[r] && T.rounds[r][i], k = !m || !m.w ? 'todo' : m.w === T.me ? 'me' : 'done';
      d[k] += 'M' + x1 + ' ' + y1 + 'H' + mx + 'V' + y2 + 'H' + x2;
    });
    svg.innerHTML = '<path class="todo" d="' + d.todo + '"/><path class="done" d="' + d.done + '"/><path class="me" d="' + d.me + '"/>';
  }

  // ---- career -------------------------------------------------------------

  // One court after another (SR.CAREER), each on an island in a sea map.
  // data().career.unlocked is the stage you are on: every stage before it is
  // beaten, every stage after it locked (and hidden in fog).
  var careerPick = -1, justUnlocked = -1, thumbs = {}, thumbQueue = [];
  var LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><rect x="4" y="10" width="16" height="11" rx="2.5" fill="currentColor"/><circle cx="12" cy="15.5" r="1.8" fill="#0b1220"/></svg>';
  // Shapes the islands and the sea around them reuse.
  var SEA_DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    '<symbol id="sr-palm" viewBox="0 0 40 50" overflow="visible"><path d="M20 48 C22 36 19 26 23 15" fill="none" stroke="#8a5a2b" stroke-width="3.6" stroke-linecap="round"/>' +
    '<g fill="#2f9e44"><path d="M23 15 C14 8 6 10 1 17 C9 13 16 14 23 15Z"/><path d="M23 15 C30 6 38 7 42 13 C35 10 29 12 23 15Z"/><path d="M23 15 C18 4 11 1 5 3 C12 5 18 9 23 15Z"/><path d="M23 15 C27 3 34 0 39 2 C33 5 27 9 23 15Z"/><path d="M23 15 C22 7 25 1 30 -2 C27 5 25 9 23 15Z"/></g>' +
    '<circle cx="22" cy="16.5" r="1.8" fill="#6b3f1d"/><circle cx="25" cy="16" r="1.7" fill="#6b3f1d"/></symbol>' +
    '<symbol id="sr-boat" viewBox="0 0 40 36" overflow="visible"><path d="M4 26 H36 L31 33 H9 Z" fill="#b5542e"/><path d="M4 26 H36" stroke="#7a3518" stroke-width="1.5"/><path d="M20 4 V26" stroke="#5a3a1a" stroke-width="2"/>' +
    '<path d="M21 5 L34 23 H21 Z" fill="#fff"/><path d="M19 8 L9 23 H19 Z" fill="#ffd23f"/><path d="M20 4 L27 6 L20 8 Z" fill="#e5484d"/></symbol>' +
    '<symbol id="sr-gull" viewBox="0 0 20 8" overflow="visible"><path d="M1 6 Q5 0 10 5 Q15 0 19 6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></symbol>' +
    '<symbol id="sr-wave" viewBox="0 0 30 8" overflow="visible"><path d="M1 5 Q5 1 9 5 T17 5 T25 5" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="2" stroke-linecap="round"/></symbol>' +
    '<symbol id="sr-whale" viewBox="0 0 40 24" overflow="visible"><path d="M20 22 C18 14 20 9 24 6 C22 3 17 2 13 3 C17 0 23 0 26 4 C29 0 35 0 39 3 C35 2 30 3 28 6 C32 9 33 14 30 22" fill="#2a4e7a"/></symbol>' +
    '</defs></svg>';

  function careerCourt(i) { return SR.courtById(SR.CAREER[i].court); }

  // The team you face at a stage; if that's your own team, the closest match.
  function careerOpp(i) {
    var me = data().career.team, id = SR.CAREER[i].opp;
    if (id !== me) return team(id);
    var p = SR.teamPower(team(id));
    return SR.TEAMS.filter(function (t) { return t.id !== me; })
      .sort(function (a, b) { return Math.abs(SR.teamPower(a) - p) - Math.abs(SR.teamPower(b) - p); })[0];
  }

  function careerReward(i) { return i === SR.CAREER.length - 1 ? SR.STARS.careerFinal : SR.STARS.careerStage; }

  // Island names are dealt out at random once per career and then kept.
  function careerIsles(C) {
    var n = SR.CAREER.length, N = SR.ISLE_NAMES;
    if (C.isles && C.isles.length === n) return C.isles;
    var first = shuffle(N.first.slice()), names = [];
    for (var i = 0; i < n - 1; i++) {
      var a = first[i % first.length], b;
      do { b = N.second[Math.floor(Math.random() * N.second.length)]; } while (a === 'Sunset' && b === 'Sands');
      names.push(a + ' ' + b);
    }
    names.push(N.final[Math.floor(Math.random() * N.final.length)]);
    C.isles = names;
    SR.save.write();
    return names;
  }

  // Repeatable random numbers, so each island keeps its shape.
  function seeded(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // A smooth closed outline through `radii` (one per direction) around cx, cy.
  function blob(radii, cx, cy, rx, ry) {
    var n = radii.length, p = radii.map(function (r, i) {
      var a = i / n * Math.PI * 2;
      return [cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r];
    });
    var d = 'M' + p[0][0].toFixed(1) + ' ' + p[0][1].toFixed(1);
    for (var i = 0; i < n; i++) {
      var p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
      d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
        (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d + 'Z';
  }

  // An island 300 x 200: shallows, foam, sand, grass, palms and rocks.
  // Locked islands get muted colours and the shadow is a plain shape, not a
  // CSS filter: twenty filtered islands made phones drop parts of the map
  // while scrolling (seen on CrazyGames mobile).
  function islandSvg(i, final, w, h, locked) {
    w = w || 300; h = h || 200;
    var rnd = seeded(i * 7919 + 17), radii = [];
    for (var k = 0; k < 9; k++) radii.push(0.86 + rnd() * 0.24);
    var cx = w / 2, cy = h / 2 + 4, sx = w / 300, sy = h / 200;
    var sand = locked ? '#d9d3c3' : final ? '#ffe39a' : '#f3d9a0', grass = locked ? '#8ea58c' : final ? '#7cc45a' : '#5cb85c';
    var out = '<svg class="cisland" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true">' +
      '<path d="' + blob(radii, cx, cy + 6 * sy, 128 * sx, 82 * sy) + '" fill="#003c5c" opacity="0.28"/>' +
      '<path d="' + blob(radii, cx, cy, 148 * sx, 96 * sy) + '" fill="' + (locked ? '#b4d3dc' : '#8fe6f0') + '" opacity="0.55"/>' +
      '<path d="' + blob(radii, cx, cy, 134 * sx, 86 * sy) + '" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="2.5" stroke-dasharray="7 9" class="cfoam"/>' +
      '<path d="' + blob(radii, cx, cy + 5, 126 * sx, 80 * sy) + '" fill="' + (locked ? '#aaa392' : '#c9a86a') + '"/>' +
      '<path d="' + blob(radii, cx, cy, 126 * sx, 80 * sy) + '" fill="' + sand + '"/>' +
      '<path d="' + blob(radii.slice().reverse(), cx, cy - 2, 104 * sx, 62 * sy) + '" fill="' + (locked ? '#6d826b' : '#3e8e41') + '"/>' +
      '<path d="' + blob(radii.slice().reverse(), cx, cy - 6, 102 * sx, 58 * sy) + '" fill="' + grass + '"/>';
    // Palms and rocks round the edge, clear of the court picture in the middle.
    var spots = [[0.1, 0.45], [0.14, 0.7], [0.86, 0.42], [0.9, 0.68], [0.2, 0.2], [0.8, 0.2]];
    spots.forEach(function (sp, k) {
      if (rnd() < (k < 4 ? 0.3 : 0.55)) return;
      var x = sp[0] * w + (rnd() - 0.5) * 10, y = sp[1] * h + (rnd() - 0.5) * 8, sc = 0.75 + rnd() * 0.4;
      out += '<use href="#sr-palm" x="' + (x - 20 * sc).toFixed(1) + '" y="' + (y - 46 * sc).toFixed(1) + '" width="' + (40 * sc).toFixed(1) + '" height="' + (50 * sc).toFixed(1) + '"/>';
    });
    for (var r = 0; r < 3; r++) {
      var rx = (rnd() < 0.5 ? 0.16 + rnd() * 0.1 : 0.74 + rnd() * 0.1) * w, ry = (0.78 + rnd() * 0.08) * h;
      out += '<ellipse cx="' + rx.toFixed(1) + '" cy="' + ry.toFixed(1) + '" rx="' + (4 + rnd() * 4).toFixed(1) + '" ry="3" fill="#8d8f98"/>';
    }
    if (final) out += '<path d="M' + (w * 0.88) + ' ' + (h * 0.62) + ' V' + (h * 0.3) + '" stroke="#5a3a1a" stroke-width="2.5"/><path d="M' + (w * 0.88) + ' ' + (h * 0.3) + ' l18 6 l-18 6 Z" fill="#ffd23f"/>';
    return out + '</svg>';
  }

  // Little things in the open sea beside the islands.
  function seaDecor(i, x, y, amp) {
    var rnd = seeded(i * 104729 + 3), side = x > 50 ? -1 : 1, out = '';
    var dx = 50 + side * (amp + 12 + rnd() * 8), dy = y + (rnd() - 0.5) * 60;
    var pick = rnd();
    if (pick < 0.32) out += '<div class="cdecor islet" style="left:' + dx + '%;top:' + dy + 'px">' + islandSvg(i + 50, false, 110, 74) + '</div>';
    else if (pick < 0.5) out += '<svg class="cdecor boat" style="left:' + dx + '%;top:' + dy + 'px" viewBox="0 0 40 36"><use href="#sr-boat"/></svg>';
    else if (pick < 0.64) out += '<svg class="cdecor whale" style="left:' + dx + '%;top:' + dy + 'px" viewBox="0 0 40 24"><use href="#sr-whale"/></svg>';
    else out += '<div class="cdecor rocks" style="left:' + dx + '%;top:' + dy + 'px"><i></i><i></i><i></i></div>';
    for (var k = 0; k < 2; k++) out += '<svg class="cdecor wave" style="left:' + (8 + rnd() * 84) + '%;top:' + (y + (rnd() - 0.5) * 160) + 'px" viewBox="0 0 30 8"><use href="#sr-wave"/></svg>';
    if (rnd() < 0.35) out += '<svg class="cdecor gull" style="left:' + (15 + rnd() * 70) + '%;top:' + (y - 70 + rnd() * 40) + 'px" viewBox="0 0 20 8"><use href="#sr-gull"/></svg>';
    return out;
  }

  // Menu button: how far you are.
  function refreshCareer() {
    var el = $('career-prog'), C = data().career, n = SR.CAREER.length, done = C ? Math.min(C.unlocked, n) : 0;
    if (el) el.textContent = C ? (done >= n ? SR.t('All {n} islands won', { n: n }) : SR.t('Island {i} of {n}', { i: done + 1, n: n })) : SR.t('New: {n} islands to win', { n: n });
    var bar = $('career-prog-bar');
    if (bar) bar.style.width = Math.round(done / n * 100) + '%';
  }

  function openCareer() {
    var C = data().career;
    if (!C) { openTeams('career'); return; }
    mode = 'career';
    if (careerPick < 0) careerPick = C.unlocked;
    careerPick = Math.min(careerPick, C.unlocked, SR.CAREER.length - 1);
    show('scr-career');
    renderCareer();
    // Bring the island you are on (or the one you just unlocked) into view.
    var node = $('career-map').querySelector('[data-i="' + careerPick + '"]'), sc = $('career-scroll');
    if (node) sc.scrollTop = parseFloat(node.style.top) - sc.clientHeight / 2;
  }

  function careerTeam(id) {
    var C = data().career;
    if (C) C.team = id; else data().career = { team: id, unlocked: 0 };
    careerPick = data().career.unlocked;
    save();
    openCareer();
  }

  // Court pictures are drawn a few at a time so the screen opens at once.
  function thumbImg(id) {
    return thumbs[id] ? '<img alt="" src="' + thumbs[id] + '">' : '<img alt="" data-court="' + id + '">';
  }
  function pumpThumbs() {
    var id = thumbQueue.shift();
    if (!id) return;
    if (!thumbs[id]) {
      try { thumbs[id] = SR.render.courtThumb(SR.courtById(id), 320).toDataURL('image/jpeg', 0.82); } catch (e) { thumbs[id] = ''; }
    }
    document.querySelectorAll('img[data-court="' + id + '"]').forEach(function (im) { if (thumbs[id]) im.src = thumbs[id]; im.removeAttribute('data-court'); });
    if (thumbQueue.length) setTimeout(pumpThumbs, 0);
  }

  function renderCareer() {
    var C = data().career, n = SR.CAREER.length, me = team(C.team), done = Math.min(C.unlocked, n), isles = careerIsles(C);
    $('career-sub').innerHTML = chip(me) + me.name + ' · ' + (done >= n ? SR.t('Every island won! Replay any court.') : SR.t('Island {i} of {n}', { i: done + 1, n: n }));
    $('career-bar').style.width = Math.round(done / n * 100) + '%';

    // A winding sea route, island 1 at the top and the final island at the bottom.
    var map = $('career-map'), mw = map.clientWidth || 600, s = mw < 560 || window.innerHeight < 520 ? 0.7 : 1;
    var ROW = Math.round(205 * s), TOP = Math.round(130 * s), pts = [], html = '', decor = '';
    var amp = Math.max(6, Math.min(27, (mw / 2 - 150 * s) / mw * 100));
    SR.CAREER.forEach(function (st, i) {
      var x = 50 + amp * Math.sin(i * 1.26), y = TOP + i * ROW, a = careerCourt(i), aname = SR.t(a.name), fin = i === n - 1;
      var state = i < C.unlocked ? 'done' : i === C.unlocked ? 'open' : 'locked';
      pts.push([x, y]);
      decor += seaDecor(i, x, y, amp);
      html += '<button type="button" class="cnode ' + state + (i === careerPick ? ' sel' : '') + (i === justUnlocked ? ' unlocking' : '') + (fin ? ' final' : '') +
        '" data-i="' + i + '" style="left:' + x + '%;top:' + y + 'px;--s:' + s + '" aria-label="' + isles[i] + ', ' + aname + (state === 'locked' ? ', ' + SR.t('locked') : state === 'done' ? ', ' + SR.t('won') : '') + '">' +
        islandSvg(i, fin, 0, 0, state === 'locked' && i !== justUnlocked) + '<span class="cfog"></span>' +
        '<span class="csign">' + (fin ? '🏆 ' : '') + isles[i] + '</span>' +
        '<span class="cthumb">' + thumbImg(st.court) + '<span class="clock">' + LOCK + '</span>' +
        (state === 'done' ? '<span class="ccheck">✓</span>' : '') + (state === 'open' ? '<span class="cplay">' + SR.t('PLAY') + '</span>' : '') + '</span>' +
        '<span class="cnum">' + (i + 1) + '</span>' +
        '<span class="cname">' + aname + '</span>' +
        (state === 'open' ? '<svg class="cboat" viewBox="0 0 40 36" aria-hidden="true"><use href="#sr-boat"/></svg>' : '') + '</button>';
    });
    var h = TOP + (n - 1) * ROW + Math.round(150 * s);
    function seg(from, to) {
      var d = '';
      for (var i = from; i < to; i++) {
        var p = pts[i], q = pts[i + 1];
        d += (i === from ? 'M' + p[0] + ' ' + p[1] : '') + ' C' + p[0] + ' ' + (p[1] + ROW / 2) + ' ' + q[0] + ' ' + (q[1] - ROW / 2) + ' ' + q[0] + ' ' + q[1];
      }
      return d;
    }
    var reach = Math.min(C.unlocked, n - 1);
    map.style.height = h + 'px';
    map.innerHTML = SEA_DEFS + decor + '<svg class="cpath" viewBox="0 0 100 ' + h + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<path class="todo" d="' + seg(0, n - 1) + '"/>' + (reach > 0 ? '<path class="done-sh" d="' + seg(0, reach) + '"/><path class="done" d="' + seg(0, reach) + '"/>' : '') + '</svg>' + html;
    map.querySelectorAll('.cnode').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = +b.getAttribute('data-i');
        SR.audio.play('click');
        if (i > C.unlocked) {
          b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
        } else {
          careerPick = i;
          map.querySelectorAll('.cnode').forEach(function (o) { o.classList.toggle('sel', o === b); });
        }
        careerInfo(i);
      });
    });
    careerInfo(careerPick);
    justUnlocked = -1;
    thumbQueue = SR.CAREER.map(function (st) { return st.court; }).filter(function (id) { return !thumbs[id]; });
    if (thumbQueue.length) setTimeout(pumpThumbs, 0);
  }

  // The card under the map: the selected island, who plays there, and Play.
  function careerInfo(i) {
    var C = data().career, a = careerCourt(i), st = SR.CAREER[i], opp = careerOpp(i), locked = i > C.unlocked, isles = careerIsles(C);
    var what = locked ? SR.t('Locked · win on {isle} to sail here', { isle: isles[i - 1] }) :
      i < C.unlocked ? SR.t('Won · replay for ★ {n}', { n: SR.STARS.quickWin }) : (i < SR.CAREER.length - 1 ? SR.t('Win to unlock {isle}', { isle: isles[i + 1] }) : SR.t('Win the final island')) + ' · ★ ' + careerReward(i);
    $('career-pick').innerHTML = '<span class="cpick-thumb">' + thumbImg(st.court) + '</span>' +
      '<span class="venue-text"><small>' + SR.t('Island {n}', { n: i + 1 }) + ' · ' + isles[i] + '</small><b>' + SR.t(a.name) + '</b>' +
      '<span>' + SR.t('vs') + ' ' + chip(opp) + opp.name + ' · ' + SR.t(SR.DIFFICULTY[st.diff].label) + '</span><span class="cwhat">' + what + '</span></span>' +
      '<button id="btn-career-play" type="button" class="btn primary"' + (locked ? ' disabled' : '') + '>' + SR.t(locked ? 'Locked' : 'Play match') + '</button>';
    $('career-pick').classList.toggle('locked', locked);
    if (!locked) on('btn-career-play', function () { startMatch(team(C.team), opp, st.court, st.diff); });
  }

  function careerRecord(won) {
    var C = data().career, out = { stars: 0, notes: [] }, i = careerPick, n = SR.CAREER.length;
    if (!C) return out;
    var first = i === C.unlocked, isles = careerIsles(C);
    if (won && first) {
      out.stars += careerReward(i);
      C.unlocked = i + 1;
      if (i + 1 < n) { justUnlocked = careerPick = i + 1; out.notes.push(SR.t('New island unlocked: {isle} ({court})!', { isle: isles[i + 1], court: SR.t(careerCourt(i + 1).name) })); }
      else { SR.cg.happytime(); out.notes.push(SR.t('Career complete! You won every island.')); }
    } else if (won) out.stars += SR.STARS.quickWin;
    else if (first && i + 1 < n) out.notes.push(SR.t('Win on {isle} to unlock {next}.', { isle: isles[i], next: isles[i + 1] }));
    return out;
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
          : it.motif ? courtSwatch(it) : '<span class="swatch" style="background:linear-gradient(135deg,' + it.court + ' 50%,' + it.floor + ' 50%);border-color:' + it.line + '"></span>';
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
    intro: function () { show('scr-intro'); $('btn-intro-watch').focus({ preventScroll: true }); },
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
      refreshCareer();
      if (current === 'scr-career') { if (data().career) renderCareer(); else show('scr-menu'); }
    },
    init: function () {
      refreshStars();
      refreshCareer();
      on('btn-quick', function () { openTeams('quick'); });
      on('btn-career', openCareer);
      on('btn-career-team', function () { openTeams('career'); });
      var careerArmed = false;
      on('btn-career-reset', function () {
        var b = $('btn-career-reset');
        if (!careerArmed) { careerArmed = true; b.textContent = SR.t('Click again to restart'); setTimeout(function () { careerArmed = false; b.textContent = SR.t('Restart career'); }, 3000); return; }
        careerArmed = false; b.textContent = SR.t('Restart career');
        data().career = null; careerPick = 0; save(); openTeams('career');
      });
      on('btn-league', openLeague);
      on('btn-cup', openCup);
      on('btn-shop', function () { renderShop(); show('scr-shop'); });
      on('btn-stats', function () { renderStats(); show('scr-stats'); });
      on('btn-settings', function () { fillSettings(); show('scr-settings'); });
      on('btn-help', function () { show('scr-help'); });
      on('btn-online', function () { SR.net.openLobby(); });
      // The opening choice: watch the How to play demo, or skip to the menu.
      on('btn-intro-watch', function () { SR.demo.start('menu', 'watch'); });
      on('btn-intro-skip', function () { show('scr-menu'); });
      document.addEventListener('keydown', function (e) {
        if (current !== 'scr-intro') return;
        if (e.key === 'Escape') { e.preventDefault(); $('btn-intro-skip').click(); }
      });
      document.querySelectorAll('[data-back]').forEach(function (b) {
        b.addEventListener('click', function () { SR.audio.play('click'); show('scr-menu'); });
      });
      on('btn-league-play', function () { var L = data().league; startMatch(team(L.me), team(myFixture(L)), leagueVenue(L)); });
      on('btn-league-new', function () { data().league = null; save(); openTeams('league'); });
      on('btn-league-quit', function () { data().league = null; save(); show('scr-menu'); });
      var cupArmed = false;
      on('btn-cup-quit', function () {
        var b = $('btn-cup-quit');
        if (!cupArmed) { cupArmed = true; b.textContent = SR.t('Click again to abandon'); setTimeout(function () { cupArmed = false; b.textContent = SR.t('Abandon tournament'); }, 3000); return; }
        cupArmed = false; b.textContent = SR.t('Abandon tournament');
        data().tournament = null; save(); show('scr-menu');
      });
      on('btn-result-ok', function () {
        if (mode === 'league') openLeague(); else if (mode === 'cup') openCup(); else if (mode === 'career') openCareer(); else show('scr-menu');
      });
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
        SR.save.reset(); renderStats(); refreshStars(); refreshCareer();
      });
      // The map's curve depends on its width.
      var lastW = 0;
      window.addEventListener('resize', function () {
        var w = $('career-map').clientWidth;
        if (current === 'scr-career' && w !== lastW) { lastW = w; renderCareer(); }
        if (current === 'scr-cup') renderCup();
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
