// Menus and modes: quick match, career, league, tournament, shop, stats, settings.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var current = null, mode = 'quick';

  function show(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.toggle('hidden', s.id !== id); });
    current = id;
    $('hud').classList.toggle('hidden', id !== null);
    // The home screen has its own full-screen background.
    $('app').classList.toggle('at-home', id === 'scr-menu');
    // These screens cover everything, so the animated cover art behind them is switched off (it cost frames while scrolling).
    $('app').classList.toggle('full-scr', id === 'scr-lmap' || id === 'scr-cmap' || id === 'scr-league' || id === 'scr-cup' || id === 'scr-career');
    if (id === 'scr-menu' && SR.profile) SR.profile.refresh();
    if (id === 'scr-menu' && SR.daily) SR.daily.onMenu();
    if (id === 'scr-menu' && SR.challenge) SR.challenge.teaser();
  }

  function save() { SR.save.write(); refreshStars(); refreshCareer(); }
  function data() { return SR.save.data; }
  function team(id) { return SR.teamById(id); }

  // Diamonds (saved as `stars`) and coins on every badge.
  function refreshStars() {
    document.querySelectorAll('[data-stars]').forEach(function (el) { el.textContent = SR.fmtNum(data().stars); });
    document.querySelectorAll('[data-coins]').forEach(function (el) { el.textContent = SR.fmtNum(data().coins); });
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
    mode = m;
    renderTeams();
    show('scr-teams');
  }

  function renderTeams() {
    var title = mode === 'quick' ? 'Choose your team' :
      ({ league: SR.LEAGUES[pendingTier.league].name, cup: SR.CUPS[pendingTier.cup].name, career: 'Career' })[mode] + ': choose your team';
    $('teams-title').textContent = title;
    teamCards($('team-grid'), null, pickTeam, true);
    rulesPicker($('team-rules'));
    courtPicker($('team-courts'));
  }

  // Quick match: play on your Shop court or one of the free themed courts.
  // Online (key 'onlineCourt'), the host also gets every Shop court they own.
  function courtPicker(box, key) {
    key = key || 'quickCourt';
    if (key === 'quickCourt' && mode !== 'quick') { box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    var cur = data().settings[key] || 'mine', mine = SR.render.courtStyle();
    var opts = [{ id: 'mine', a: mine, name: 'My court' }].concat(SR.QUICK_COURTS.map(function (id) { return { id: id, a: SR.ARENAS[id], name: SR.ARENAS[id].name }; }));
    if (key === 'onlineCourt') {
      SR.SHOP.courts.forEach(function (c) { if (c.id !== mine.id && data().owned.courts.indexOf(c.id) >= 0) opts.push({ id: c.id, a: c, name: c.name }); });
      if (!opts.some(function (o) { return o.id === cur; })) cur = 'mine';
    }
    box.innerHTML = '<span class="rule-name">Court</span><div class="court-pick" role="radiogroup" aria-label="Court">' +
      opts.map(function (o) {
        return '<button type="button" role="radio" aria-checked="' + (o.id === cur) + '" class="' + (o.id === cur ? 'on' : '') + '" data-v="' + o.id + '">' + courtSwatch(o.a) + '<span>' + o.name + '</span></button>';
      }).join('') + '</div>';
    box.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        data().settings[key] = b.getAttribute('data-v');
        save();
        SR.audio.play('click');
        courtPicker(box, key);
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
      return '<div class="rule"><span class="rule-name">' + name + '</span><div class="seg" role="radiogroup" aria-label="' + name + '">' +
        opts.map(function (o) { return '<button type="button" role="radio" aria-checked="' + (o === cur) + '" class="' + (o === cur ? 'on' : '') + '" data-v="' + o + '">' + fmt(o) + '</button>'; }).join('') + '</div></div>';
    }
    box.innerHTML = group('Points per set', SR.POINT_OPTIONS, f.points, String) +
      group('Sets', SR.SET_OPTIONS, f.sets, function (n) { return n === 1 ? '1' : 'Best of ' + n; }) +
      '<p class="rule-sum muted small">' + f.label + '</p>';
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
  // withCustom: the Custom team card goes first (offline team picker only).
  function teamCards(grid, skipId, onPick, withCustom) {
    grid.innerHTML = '';
    if (withCustom && SR.custom) grid.appendChild(SR.custom.card(onPick));
    SR.TEAMS.forEach(function (t) {
      if (t.id === skipId) return;
      var b = document.createElement('button');
      b.className = 'team-card';
      var pw = SR.teamPower(t);
      b.innerHTML = '<span class="jersey" style="background:' + t.color + ';color:' + t.trim + '">' + t.short + '</span>' +
        '<span class="tname">' + t.name + '</span>' +
        '<span class="tstats">ATK ' + t.r.attack + ' · BLK ' + t.r.block + ' · PASS ' + t.r.pass + ' · SRV ' + t.r.serve + '</span>' +
        '<span class="meter"><span style="width:' + Math.round((pw - 60) / 30 * 100) + '%"></span></span>';
      b.addEventListener('click', function () { onPick(t); });
      grid.appendChild(b);
    });
  }

  function pickTeam(t) {
    SR.audio.play('click');
    if (mode === 'quick') {
      // Your team only: the opponent is picked at random.
      data().settings.team = t.id;
      save();
      startMatch(t, randomTeam(t));
      return;
    }
    data().settings.team = t.id;
    if (mode === 'career') careerTeam(t.id);
    else if (mode === 'league') newLeague(t.id);
    else newCup(t.id);
  }

  // ---- matches ------------------------------------------------------------

  function startMatch(home, away, venue, difficulty, format, boost) {
    var s = data().settings;
    show(null);
    if (mode === 'quick') { lastQuick = { home: home, away: away }; if (SR.ARENAS[s.quickCourt]) venue = s.quickCourt; }
    home = SR.kitTeam(home, away);
    // A custom team that looks like the opponent swaps its jersey and trim.
    if (home.custom && SR.colorGap(home.color, away.color) < 90 && SR.colorGap(home.trim, away.color) >= 90) home = Object.assign({}, home, { color: home.trim, trim: home.color });
    SR.game = new SR.Game({ home: home, away: away, format: format || s.format, difficulty: difficulty || s.difficulty, boost: boost || 0, human: 0, mode: mode, venue: venue || null, hustle: bigMatch(), onEnd: finishMatch });
  }
  // Big matches, where receivers chase every serve and dive to rescue it:
  // the top two leagues and tournaments, a league's last round and a tournament final.
  function bigMatch() {
    var L = data().league, T = data().tournament;
    if (mode === 'league' && L) return (L.lid || 0) >= SR.LEAGUES.length - 2 || L.round === L.rounds.length - 1;
    if (mode === 'cup' && T) return (T.cid || 0) >= SR.CUPS.length - 2 || T.round === 2;
    return false;
  }

  // Quick match: Random starts at once with two random teams; Choose team
  // picks only your team (opponent random). A player's very first match is a
  // single set, so they reach a result quickly.
  var lastQuick = null;
  function randomTeam(not) {
    var list = SR.TEAMS.filter(function (t) { return !not || t.id !== not.id; });
    return list[Math.floor(Math.random() * list.length)];
  }
  function quickRandom() {
    var me = randomTeam(null);
    mode = 'quick';
    startMatch(me, randomTeam(me), null, null, data().stats.matches ? null : SR.formatId(15, 1));
  }

  // The result screen's main button: the next match in the same mode.
  var resultNext = null;
  function nextAction(won, prevPick) {
    if (mode === 'quick' && lastQuick) {
      var q = lastQuick;
      return { label: 'Play again', go: function () { startMatch(q.home, q.away); } };
    }
    if (mode === 'league' && data().league && !data().league.done) {
      return { label: 'Next match', go: function () { openLeague(); var b = $('btn-league-play'); if (b) b.click(); } };
    }
    if (mode === 'cup' && data().tournament && cupMyMatch(data().tournament)) {
      return { label: 'Next match', go: function () { openCup(); var b = $('btn-cup-play'); if (b) b.click(); } };
    }
    if (mode === 'daily' && SR.challenge) {
      return SR.challenge.done() && won ? null : { label: 'Try again', go: SR.challenge.play };
    }
    if (mode === 'career' && data().career) {
      return { label: !won ? 'Try again' : careerPick !== prevPick ? 'Next island' : 'Play again',
        go: function () { openCareer(); var b = $('btn-career-play'); if (b && !b.disabled) b.click(); } };
    }
    return null;
  }

  function resultButtons(next) {
    resultNext = next;
    $('btn-result-next').classList.toggle('hidden', !next);
    if (next) $('btn-result-next').textContent = next.label;
    $('btn-result-ok').textContent = mode === 'quick' ? 'Menu' : 'Continue';
    $('btn-result-ok').classList.toggle('primary', !next);
    $('btn-result-ok').classList.toggle('ghost', !!next);
    if (SR.daily) SR.daily.teaser($('result-daily'));
  }

  // ---- venues -------------------------------------------------------------

  // League rounds are played at the opponent's arena, the last round at yours.
  // A league with a finale court (Legends) plays its last round there.
  // A custom team has no arena: its home is the court equipped in the Shop.
  function leagueVenue(L) {
    var v = L.round === L.rounds.length - 1 ? (curLeague().finale || L.me) : myFixture(L);
    return v === 'custom' ? data().equipped.court : v;
  }

  // Tournament: the opponent's arena, and Champions Court for the final.
  // Each cup has its own court for the final (SR.CUPS[].final).
  function cupVenue(T, m) {
    return T.round === 2 ? curCup().final : (m.a === T.me ? m.b : m.a);
  }

  // A small card naming the next venue, with a swatch of its court.
  function venueCard(el, id, me) {
    var a = id && SR.ARENAS[id];
    if (!a) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    var host = id === 'final' ? 'Tournament final' : id === me ? 'Your home court' : 'Home of the ' + team(id).name;
    el.innerHTML = courtSwatch(a) +
      '<span class="venue-text"><small>Venue</small><b>' + a.name + '</b><span>' + host + '</span></span>';
  }

  function finishMatch(game) {
    var m = game.match, won = m.winner === 0, st = data().stats, stars = 0, coins = 0, my = m.stats[0];
    st.matches++;
    if (won) st.wins++;
    m.history.forEach(function (s) { st.points += s[0]; if (s[0] > s[1]) st.sets++; });
    st.aces += my.aces; st.kills += my.kills; st.blocks += my.blocks; st.errors += my.errors || 0;
    st.streak = won ? st.streak + 1 : 0;
    st.best = Math.max(st.best, st.streak);
    var t0 = m.teams[0], tid = t0.custom ? 'custom' : SR.TEAMS.some(function (t) { return t.id === t0.id; }) ? t0.id : null;
    if (tid) { var bt = st.byTeam[tid] = st.byTeam[tid] || { m: 0, w: 0 }; bt.m++; if (won) bt.w++; }
    var notes = [], prevPick = careerPick;
    var result = { winner: m.winner, sets: m.sets.slice(), scores: m.history.slice() };

    if (mode === 'quick') { if (won) stars += SR.STARS.quickWin; }
    else if (mode === 'league') { var r = leagueRecord(result); stars += r.stars; coins += r.coins || 0; notes = r.notes; }
    else if (mode === 'cup') {
      // Kept so a lost tournament match can be replayed after a rewarded ad.
      var cupSnap = data().tournament ? JSON.stringify({ t: data().tournament, map: data().cupMap }) : null, cupRound = data().tournament ? data().tournament.round : 0;
      var c = cupRecord(result); stars += c.stars; coins += c.coins || 0; notes = c.notes;
    }
    else if (mode === 'career') { var k = careerRecord(won); stars += k.stars; coins += k.coins || 0; notes = k.notes; }
    else if (mode === 'daily' && SR.challenge) { var dc = SR.challenge.record(m, won); stars += dc.stars; if (dc.stars) coins += SR.COINS.challenge; notes = dc.notes; }
    // Every match pays coins and XP; XP can level you up (more diamonds and coins).
    var loot = SR.profile.matchLoot(my, won, mode), pf = data().profile, before = { level: pf.level, xp: pf.xp };
    coins += loot.coins;
    data().stars += stars;
    data().coins += coins;
    var ups = SR.profile.addXp(loot.xp);
    save();

    $('result-title').textContent = won ? 'Victory!' : 'Defeat';
    $('result-title').className = won ? 'win' : 'loss';
    $('result-title').parentNode.classList.toggle('lost', !won);
    $('result-sub').textContent = m.teams[0].name + ' ' + m.sets[0] + ' - ' + m.sets[1] + ' ' + m.teams[1].name;
    $('result-sets').textContent = m.history.map(function (s) { return s[0] + '-' + s[1]; }).join('   ');
    $('result-stats').textContent = 'Aces ' + my.aces + ' · Kills ' + my.kills + ' · Blocks ' + my.blocks + ' · Errors ' + my.errors;
    resultLoot(stars, coins, loot.xp, before, ups);
    $('result-notes').textContent = notes.join(' ');
    resultButtons(nextAction(won, prevPick));
    var T1 = data().tournament, again = null;
    if (mode === 'cup' && !won && cupSnap && T1 && T1.out && T1.champion !== T1.me && JSON.parse(cupSnap).t.rm !== cupRound) {
      again = { snap: cupSnap, round: cupRound };
    }
    resultAds(stars, coins, again);
    stopMatch();
    show('scr-result');
  }

  // ---- rewarded ads on the result screen -----------------------------------
  // Collect the match rewards, or watch an ad to get them twice. After a lost
  // tournament match, an ad can also replay that match (once per round).
  var AD_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="3.5"/><path d="M10 9.2v5.6l4.8-2.8z" class="ad-tri"/></svg>';
  function resultAds(stars, coins, again) {
    var el = $('result-ad');
    if (!el) return;
    // No ads outside the Android app: rewards are simply paid once.
    if (!SR.ads || !SR.ads.available()) { el.innerHTML = ''; el.classList.add('hidden'); return; }
    var html = '';
    if (again) {
      html += '<button type="button" class="ad-offer rematch" id="ad-rematch">' + AD_ICON +
        '<span><b>Rematch</b><small>Watch an ad to replay the ' + CUP_ONE[again.round] + '</small></span><i class="ad-badge">AD</i></button>';
    }
    if (stars || coins) {
      html += '<div class="ad-pair">' +
        '<button type="button" class="ad-collect" id="ad-collect">Collect</button>' +
        '<button type="button" class="ad-offer double" id="ad-double">' + AD_ICON + '<span><b>2x rewards</b><small>' +
        (stars ? SR.GEM + ' ' + stars * 2 + ' &nbsp;' : '') + SR.COIN + ' ' + SR.fmtNum(coins * 2) + '</small></span><i class="ad-badge">AD</i></button></div>';
    }
    el.innerHTML = html;
    el.classList.toggle('hidden', !html);
    var dbl = $('ad-double'), col = $('ad-collect'), rm = $('ad-rematch');
    function settle(msg, win) {
      var pair = el.querySelector('.ad-pair');
      if (pair) pair.outerHTML = '<p class="ad-done' + (win ? ' win' : '') + '">' + msg + '</p>';
    }
    if (col) col.addEventListener('click', function () { SR.audio.play('click'); settle('\u2713 Rewards collected'); });
    if (dbl) dbl.addEventListener('click', function () {
      SR.audio.play('click');
      dbl.disabled = true; if (col) col.disabled = true;
      SR.ads.rewarded('double').then(function (ok) {
        if (!ok) { dbl.disabled = false; if (col) col.disabled = false; return; }
        data().stars += stars; data().coins += coins; save(); refreshStars();
        SR.audio.play('reward');
        $('result-stars').querySelectorAll('.gem-loot b, .coin-loot b').forEach(function (b) {
          var gem = b.parentNode.classList.contains('gem-loot');
          b.textContent = '+' + (gem ? stars * 2 : SR.fmtNum(coins * 2));
          b.parentNode.classList.add('doubled');
        });
        settle('Rewards doubled!', true);
      });
    });
    if (rm) rm.addEventListener('click', function () {
      SR.audio.play('click');
      rm.disabled = true;
      SR.ads.rewarded('rematch').then(function (ok) {
        if (!ok) { rm.disabled = false; return; }
        var s = JSON.parse(again.snap);
        s.t.rm = again.round; // one rematch per round
        data().tournament = s.t; data().cupMap = s.map; save();
        openCup(); var b = $('btn-cup-play'); if (b) b.click();
      });
    });
  }

  // Result screen: what the match paid, and the XP bar filling up (with a
  // banner for every level reached).
  function resultLoot(stars, coins, xp, before, ups) {
    $('result-stars').innerHTML = (stars ? '<span class="loot gem-loot">' + SR.GEM + '<b>+' + stars + '</b></span>' : '') +
      '<span class="loot coin-loot">' + SR.COIN + '<b>+' + SR.fmtNum(coins) + '</b></span>' +
      '<span class="loot xp-loot"><em>XP</em><b>+' + xp + '</b></span>';
    var pf = data().profile, need = SR.XP.need(pf.level), lvUp = ups.length > 0;
    var from = lvUp ? 0 : Math.round(before.xp / need * 100), to = Math.round(pf.xp / need * 100);
    $('result-xp').innerHTML = '<div class="rx-row"><span class="rx-lv">Lv. ' + pf.level + '</span><span class="xp-bar big"><i style="width:' + from + '%"></i></span><span class="rx-num">' + SR.fmtNum(pf.xp) + ' / ' + SR.fmtNum(need) + '</span></div>' +
      ups.map(function (u) { return '<div class="rx-up"><b>Level up! Level ' + u.level + '</b><span>' + SR.GEM + ' +' + u.gems + ' · ' + SR.COIN + ' +' + SR.fmtNum(u.coins) + '</span></div>'; }).join('');
    var bar = $('result-xp').querySelector('.xp-bar i');
    setTimeout(function () { if (bar) bar.style.width = to + '%'; }, 350);
    if (lvUp) setTimeout(function () { SR.audio.play('reward'); }, 500);
  }

  // ---- league -------------------------------------------------------------

  // A season of the league picked on the League map: every club plays every
  // other once (circle method), one round per opponent.
  function newLeague(myId) {
    var lid = pendingTier.league, size = SR.LEAGUES[lid].teams;
    var others = shuffle(SR.TEAMS.map(function (t) { return t.id; }).filter(function (id) { return id !== myId; })).slice(0, size - 1);
    var ids = [myId].concat(others), rounds = [];
    var rot = ids.slice(1);
    for (var r = 0; r < size - 1; r++) {
      var arr = [ids[0]].concat(rot), pairs = [];
      for (var i = 0; i < size / 2; i++) pairs.push([arr[i], arr[size - 1 - i]]);
      rounds.push(pairs);
      rot.unshift(rot.pop());
    }
    var table = {};
    ids.forEach(function (id) { table[id] = { p: 0, w: 0, l: 0, sw: 0, sl: 0, pts: 0 }; });
    data().league = { lid: lid, me: myId, teams: ids, rounds: rounds, round: 0, table: table, log: [], done: false };
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
    var LG = curLeague(), opp = myFixture(L);
    addResult(L.table, L.me, opp, res);
    var rd = [{ a: L.me, b: opp, w: res.winner === 0 ? L.me : opp, sa: res.sets[0], sb: res.sets[1] }];
    L.log.unshift(team(L.me).short + ' ' + res.sets[0] + '-' + res.sets[1] + ' ' + team(opp).short);
    if (res.winner === 0) out.stars += LG.win;
    L.rounds[L.round].forEach(function (p) {
      if (p[0] === L.me || p[1] === L.me) return;
      var r = SR.simMatch(team(p[0]), team(p[1]), data().settings.format);
      addResult(L.table, p[0], p[1], r);
      rd.push({ a: p[0], b: p[1], w: r.winner === 0 ? p[0] : p[1], sa: r.sets[0], sb: r.sets[1] });
      L.log.unshift(team(p[0]).short + ' ' + r.sets[0] + '-' + r.sets[1] + ' ' + team(p[1]).short);
    });
    (L.results = L.results || [])[L.round] = rd;
    L.round++;
    if (L.round >= L.rounds.length) {
      L.done = true;
      var order = standings(L), top = order[0], pos = order.indexOf(L.me) + 1, T = trophies();
      if (pos === 1) { T.league++; T.lw[L.lid || 0] = (T.lw[L.lid || 0] || 0) + 1; out.coins = SR.COINS.leagueTitle; }
      if (pos === 1 && L.table[L.me].w === L.rounds.length) T.unbeaten++;
      if (pos === 2) T.silver++;
      if (pos === 3) T.bronze++;
      T.seasons.unshift({ team: L.me, pos: pos, pts: L.table[L.me].pts });
      T.seasons.length = Math.min(T.seasons.length, 8);
      if (top === L.me) { out.stars += LG.title; out.notes.push(LG.name + ' champions! +' + LG.title + ' bonus diamonds and ' + SR.COINS.leagueTitle + ' coins.'); }
      else out.notes.push(LG.name + ' finished. ' + team(top).name + ' took the title.');
      // The League map: best finish here, and promotion opens the next league.
      var P = data().leagueMap, li = L.lid || 0, up = SR.LEAGUES[li + 1];
      if (!P.best[li] || pos < P.best[li]) P.best[li] = pos;
      if (pos <= SR.LEAGUE_PROMOTE && up && P.unlocked <= li) {
        P.unlocked = li + 1;
        wJust.league = wPick.league = li + 1;
        out.notes.push('Promoted! The ' + up.name + ' is now open.');
      }
    }
    return out;
  }

  // The League screen: a trophy hall. The table on the left with crests,
  // medals and form; on the right the Shield on its plinth (a podium once
  // the season ends), this round's fixtures and your trophy cabinet.
  var LG_GOLD = '#ffd23f';
  function lgTrophy(kind, cls) {
    // Real trophy pictures: the current league's own trophy, a cup, the Career Crown and the Unbeaten Shield.
    if (kind === 'shield') return SR.trophyImg('league', (data().league && data().league.lid) || 0, 'lg-t ' + (cls || ''));
    if (kind === 'cup') return SR.trophyImg('cup', (data().tournament && data().tournament.cid) || 0, 'lg-t ' + (cls || ''));
    if (kind === 'crown') return SR.trophyImg('special', 0, 'lg-t ' + (cls || ''));
    if (kind === 'unbeaten') return SR.trophyImg('special', 1, 'lg-t ' + (cls || ''));
    var c = '<svg class="lg-t ' + (cls || '') + '" viewBox="0 0 64 72" aria-hidden="true">', ball =
      '<circle cx="32" cy="27" r="9" fill="#fff8e1"/><path d="M23.5 24c5 1 10 5 12 11M28 18.6c3 3 4.5 8 3.5 13M40.8 25c-5 0-10.5 2.5-13.5 8" fill="none" stroke="#c98a00" stroke-width="1.6" stroke-linecap="round"/>';
    if (kind === 'shield') return c +
      '<rect x="12" y="62" width="40" height="8" rx="2" fill="url(#lg-wood)"/><rect x="16" y="58" width="32" height="5" rx="1.5" fill="#3a2414"/><path d="M27 46h10l2 12H25z" fill="url(#lg-gold)"/>' +
      '<circle cx="32" cy="27" r="23" fill="url(#lg-gold)"/><circle cx="32" cy="27" r="23" fill="none" stroke="#b86e00" stroke-width="1.5"/><circle cx="32" cy="27" r="17" fill="none" stroke="#fff3b0" stroke-width="1.4" stroke-dasharray="2 3"/>' + ball +
      '<path d="M15 14a20 20 0 0 1 10-8" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".6"/></svg>';
    if (kind === 'cup') return c +
      '<g transform="translate(0 6)"><path d="M18 6h28v14c0 9-6 16-14 16s-14-7-14-16z" fill="url(#lg-gold)"/><path d="M18 11H9c0 9 4 14 11 15M46 11h9c0 9-4 14-11 15" fill="none" stroke="url(#lg-gold)" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M29 36h6v9h-6z" fill="#e8a400"/><path d="M21 47h22l3 9H18z" fill="url(#lg-gold)"/><rect x="16" y="55" width="32" height="5" rx="2" fill="#b86e00"/><path d="M24 10c0 7 1 13 5 18" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".55"/></g></svg>';
    if (kind === 'crown') return c +
      '<path d="M10 52 L8 22 L21 34 L32 14 L43 34 L56 22 L54 52 Z" fill="url(#lg-gold)" stroke="#b86e00" stroke-width="1.5" stroke-linejoin="round"/><rect x="10" y="52" width="44" height="9" rx="2" fill="#e8a400"/>' +
      '<circle cx="32" cy="56.5" r="3" fill="#e5484d"/><circle cx="20" cy="56.5" r="2.4" fill="#4d8bff"/><circle cx="44" cy="56.5" r="2.4" fill="#3bd16f"/><circle cx="8" cy="22" r="3" fill="#fff3b0"/><circle cx="32" cy="14" r="3" fill="#fff3b0"/><circle cx="56" cy="22" r="3" fill="#fff3b0"/></svg>';
    // Medals on a ribbon: unbeaten (gold star), runner-up (silver), third (bronze).
    var g = kind === 'silver' ? 'lg-silver' : kind === 'bronze' ? 'lg-bronze' : 'lg-gold', mark = kind === 'unbeaten' ?
      '<path d="M32 33l3.5 7.2 7.9 1.1-5.7 5.6 1.3 7.9-7-3.7-7 3.7 1.3-7.9-5.7-5.6 7.9-1.1z" fill="#fff8e1"/>' :
      '<text x="32" y="52" text-anchor="middle" font-size="16" font-weight="900" font-family="system-ui,sans-serif" fill="rgba(0,0,0,.45)">' + (kind === 'silver' ? '2' : '3') + '</text>';
    return c + '<path d="M20 2h10l6 24h-10zM44 2H34l-6 24h10z" fill="' + (kind === 'unbeaten' ? '#e5484d' : kind === 'silver' ? '#4d8bff' : '#2f9e44') + '"/><path d="M30 2h4l-2 8z" fill="rgba(255,255,255,.35)"/>' +
      '<circle cx="32" cy="45" r="19" fill="url(#' + g + ')"/><circle cx="32" cy="45" r="14" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.4"/>' + mark + '</svg>';
  }

  function trophies() { return data().trophies; }

  function leagueOrdinal(n) { return n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'); }

  // Last results of a team, oldest first (W / L), from the saved rounds.
  function leagueForm(L, id) {
    var out = [];
    (L.results || []).forEach(function (rd) {
      rd.forEach(function (m) { if (m.a === id || m.b === id) out.push(m.w === id ? 'w' : 'l'); });
    });
    return out;
  }

  function openLeague() {
    var L = data().league;
    if (!L) { openWorld('league'); return; }
    mode = 'league';
    show('scr-league');
    $('league-scroll').scrollTop = 0;
    renderLeague();
  }

  function renderLeague() {
    var L = data().league, LG = curLeague(), me = team(L.me), order = standings(L), pos = order.indexOf(L.me) + 1, top = order[0];
    $('league-title').textContent = LG.name;
    var n = L.rounds.length, champ = L.done && top === L.me, wide = ($('league-scroll').clientWidth || 800) >= 860;
    var maxPts = n * 3, played = L.round, results = L.results || [];

    // Header: your team, your place, and the five rounds as pills.
    var lead = L.table[top].pts - L.table[L.me].pts;
    $('league-sub').innerHTML = chip(me) + me.name + ' · ' + (L.done ? (champ ? 'Champions!' : 'Finished ' + leagueOrdinal(pos)) :
      leagueOrdinal(pos) + ' place' + (pos === 1 ? (played ? ', top of the table' : '') : lead ? ', ' + lead + ' pt' + (lead === 1 ? '' : 's') + ' behind' : ', level on points'));
    var mine = leagueForm(L, L.me);
    $('league-steps').innerHTML = L.rounds.map(function (r, i) {
      var f = mine[i], st = i < played ? (f === 'w' ? 'done' : f === 'l' ? 'out' : 'done') : i === played && !L.done ? 'now' : '';
      return '<li class="' + st + '"><span>' + (st === 'done' ? '✓' : st === 'out' ? '✕' : i + 1) + '</span>Round ' + (i + 1) + '</li>';
    }).join('') + '<li class="' + (champ ? 'done gold' : '') + '"><span>🏆</span>Trophy</li>';

    // The table.
    var rows = order.map(function (id, i) {
      var t = L.table[id], tm = team(id), form = leagueForm(L, id).slice(-5), dots = '';
      for (var k = 0; k < 5; k++) dots += '<i class="' + (form[k] || '') + '"></i>';
      var medal = i < 3 && played ? ' m' + (i + 1) : '';
      return '<div class="lr' + (id === L.me ? ' me' : '') + medal + '" style="--pp:' + Math.round(t.pts / maxPts * 100) + '%">' +
        '<span class="lp">' + (i === 0 && played ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18L2 7l5.5 4.5L12 4l4.5 7.5L22 7l-1 11z" fill="currentColor"/></svg>' : '') + '<b>' + (i + 1) + '</b></span>' +
        crest(tm, 'lg-shield') + '<span class="ln"><b>' + tm.name + '</b><b class="abbr">' + tm.short + '</b>' + (id === L.me ? '<em>You</em>' : '') + '</span>' +
        '<span class="lf">' + dots + '</span><span class="lc">' + t.p + '</span><span class="lc">' + t.w + '</span><span class="lc">' + t.l + '</span>' +
        '<span class="lc ls">' + t.sw + ':' + t.sl + '</span><span class="lpts">' + t.pts + '</span></div>';
    }).join('');
    var table = '<div class="lg-card lg-table"><h3>Standings <small>Win = 3 pts</small></h3>' +
      '<div class="lr lh"><span class="lp">#</span><span class="ln">Team</span><span class="lf">Form</span><span class="lc">P</span><span class="lc">W</span><span class="lc">L</span><span class="lc ls">Sets</span><span class="lpts">Pts</span></div>' +
      rows + '</div>';

    // The prize: the Shield under a spotlight, or the final podium.
    var stage;
    if (L.done) {
      var pod = [order[1], order[0], order[2]].map(function (id, k) {
        var place = [2, 1, 3][k], tm = team(id);
        return '<div class="lg-pod p' + place + (id === L.me ? ' me' : '') + '">' + (place === 1 ? lgTrophy('shield', 'lg-pod-t') : lgTrophy(place === 2 ? 'silver' : 'bronze', 'lg-pod-m')) +
          crest(tm, 'lg-shield') + '<b>' + tm.short + '</b><span class="lg-block"><i>' + place + '</i><small>' + L.table[id].pts + ' pts</small></span></div>';
      }).join('');
      stage = '<div class="lg-card lg-stage over' + (champ ? ' won' : '') + '"><h3>' + (champ ? 'Champions!' : 'Final podium') + '</h3><div class="lg-podium">' + pod + '</div>' +
        '<p class="lg-cap">' + (champ ? me.name + ' lift the ' + LG.name + ' Trophy · ' + SR.GEM + ' +' + LG.title : team(top).name + ' took the trophy. You finished ' + leagueOrdinal(pos) + '.') + '</p></div>';
    } else {
      var left = n - played, gap = lead, can = gap <= left * 3;
      stage = '<div class="lg-card lg-stage"><h3>Season prize</h3><div class="lg-plinth">' + lgTrophy('shield', 'lg-big') + '</div>' +
        '<b class="lg-prize">' + LG.name + ' Trophy</b><p class="lg-cap">Finish top after ' + n + ' rounds · ' + SR.GEM + ' +' + LG.title + ' bonus' +
        (SR.LEAGUES[(L.lid || 0) + 1] ? ' · Top ' + SR.LEAGUE_PROMOTE + ' go up to the ' + SR.LEAGUES[(L.lid || 0) + 1].name : '') + '</p>' +
        '<p class="lg-race ' + (pos === 1 ? 'up' : can ? 'on' : 'off') + '">' + (pos === 1 ? (played ? 'You hold the trophy. Keep it!' : 'Every team starts on 0 pts.') : can ? (lead ? lead + ' pt' + (lead === 1 ? '' : 's') + ' to catch ' : 'Level on points with ') + team(top).name : 'The Shield is out of reach this season') + '</p></div>';
    }

    // This round's three matches, or the last round's results.
    var fx = '', fr = L.done ? n - 1 : played, res = results[fr] || [];
    L.rounds[fr].forEach(function (p) {
      var r = res.find(function (m) { return m.a === p[0] || m.b === p[0]; }), A = team(p[0]), B = team(p[1]);
      var mineM = p[0] === L.me || p[1] === L.me;
      fx += '<div class="lfx' + (mineM ? ' me' : '') + (r ? ' played' : '') + '">' + crest(A, 'lg-shield') + '<b class="' + (r && r.w === p[0] ? 'w' : '') + '">' + A.short + '</b>' +
        '<span class="lfx-s">' + (r ? r.sa + ' – ' + r.sb : mineM ? 'You' : 'vs') + '</span><b class="' + (r && r.w === p[1] ? 'w' : '') + '">' + B.short + '</b>' + crest(B, 'lg-shield') + '</div>';
    });
    var round = '<div class="lg-card lg-round"><h3>Round ' + (fr + 1) + ' <small>' + (L.done ? 'Final results' : 'Fixtures') + '</small></h3>' + fx +
      (played && !L.done ? '<p class="lg-last">Last round: ' + (results[played - 1] || []).map(function (m) { return team(m.a).short + ' ' + m.sa + '-' + m.sb + ' ' + team(m.b).short; }).join(' · ') + '</p>' : '') + '</div>';

    // The trophy cabinet: everything you have won, empty plinths for the rest.
    var T = trophies(), C = data().career, crown = C && C.unlocked >= SR.CAREER.length ? 1 : 0;
    var items = [['shield', 'League Trophy', T.league, 'Win a league'], ['unbeaten', 'Unbeaten', T.unbeaten, 'Win all ' + n + ' rounds'],
      ['silver', 'Runner-up', T.silver, 'Finish 2nd'], ['bronze', 'Third place', T.bronze, 'Finish 3rd'],
      ['cup', 'Tournament Cup', T.cup, 'Win a tournament'], ['crown', 'Career Crown', crown, 'Win all Career islands']];
    var shelf = items.map(function (it) {
      return '<div class="lg-item' + (it[2] ? ' got' : '') + '" title="' + it[1] + (it[2] ? '' : ': ' + it[3]) + '">' + lgTrophy(it[0]) +
        (it[2] > 1 ? '<em>×' + it[2] + '</em>' : '') + '<b>' + it[1] + '</b><small>' + (it[2] ? (it[2] > 1 ? it[2] + ' won' : 'Won') : it[3]) + '</small></div>';
    }).join('');
    var hist = T.seasons.slice(0, 5).map(function (s) {
      return '<span class="lg-hs p' + Math.min(s.pos, 4) + '">' + chip(team(s.team)) + leagueOrdinal(s.pos) + ' · ' + s.pts + ' pts</span>';
    }).join('');
    var cab = '<div class="lg-card lg-cab"><h3>Trophy cabinet <small>' + items.filter(function (it) { return it[2]; }).length + ' / ' + items.length + '</small></h3>' +
      '<div class="lg-shelf">' + shelf + '</div>' + (hist ? '<div class="lg-hist"><small>Past seasons</small>' + hist + '</div>' : '') + '</div>';

    var box = $('league-board');
    box.className = 'lg-board ' + (wide ? 'wide' : 'narrow');
    box.innerHTML = wide ? '<div class="lg-col">' + table + round + '</div><div class="lg-col">' + stage + cab + '</div>' : stage + table + round + cab;

    // Bottom: the next match and its venue, or the season's end.
    var nx = $('league-next'), opp = myFixture(L);
    $('scr-league').classList.toggle('lg-won', champ);
    $('btn-league-quit').classList.toggle('hidden', L.done);
    hallConfetti('#scr-league .lg-hall', champ);
    if (!L.done) {
      var o = team(opp), vid = leagueVenue(L), a = SR.courtById(vid);
      var host = vid === L.me || (L.me === 'custom' && !SR.ARENAS[vid]) ? 'Your home court' : SR.ARENAS[vid] && !SR.TEAMS.some(function (t) { return t.id === vid; }) ? 'League finale' : 'Home of the ' + team(vid).name;
      nx.className = 'cup-next';
      nx.innerHTML = '<div class="cup-vs"><span class="cv me">' + crest(me, 'lg-shield') + '<b>' + me.short + '</b></span><span class="cv-x">VS</span><span class="cv">' + crest(o, 'lg-shield') + '<b>' + o.short + '</b></span></div>' +
        '<span class="cpick-thumb">' + thumbImg(vid) + '</span>' +
        '<span class="venue-text"><small>Round ' + (played + 1) + ' of ' + n + ' · vs ' + o.name + '</small><b>' + (a ? a.name : '') + '</b><span>' + host + ' · <i class="cwin">Win ' + SR.GEM + ' ' + LG.win + (played === n - 1 ? ' · Title ' + SR.GEM + ' +' + LG.title : '') + '</i></span></span>' +
        '<button id="btn-league-play" type="button" class="btn primary">Play</button>';
      on('btn-league-play', function () { startMatch(me, o, vid, LG.diff); });
      thumbQueue.push(vid);
      setTimeout(pumpThumbs, 0);
    } else {
      var lid = L.lid || 0, up = pos <= SR.LEAGUE_PROMOTE && SR.LEAGUES[lid + 1];
      nx.className = 'cup-next over' + (champ ? ' won' : '');
      nx.innerHTML = '<span class="cup-end-ico">' + (champ ? lgTrophy('shield', 'cup-trophy') : pos <= 3 ? lgTrophy(pos === 2 ? 'silver' : 'bronze', 'cup-trophy') : crest(team(top), 'lg-shield')) + '</span>' +
        '<span class="venue-text"><small>Season complete' + (up ? ' · Promoted!' : '') + '</small><b>' + (champ ? 'You won the ' + LG.name + '!' : 'You finished ' + leagueOrdinal(pos)) + '</b><span>' +
        (champ ? me.name + ' · ' + L.table[L.me].pts + ' pts · ' + SR.GEM + ' +' + LG.title + ' bonus.' : team(top).name + ' won with ' + L.table[top].pts + ' pts.') +
        (up ? ' The ' + up.name + ' is open.' : champ ? '' : ' Top ' + SR.LEAGUE_PROMOTE + ' go up. Go again?') + '</span></span>' +
        (up ? '<button id="btn-league-up" type="button" class="btn primary">Next league</button>' : '<button id="btn-league-new" type="button" class="btn primary">' + (champ ? 'New season' : 'Try again') + '</button>');
      if (up) on('btn-league-up', function () { wPick.league = lid + 1; openWorld('league'); });
      else on('btn-league-new', function () { pendingTier.league = lid; data().league = null; save(); openTeams('league'); });
    }
  }

  // ---- tournament ---------------------------------------------------------

  function newCup(myId) {
    var others = shuffle(SR.TEAMS.map(function (t) { return t.id; }).filter(function (id) { return id !== myId; }));
    var ids = shuffle([myId].concat(others.slice(0, 7))), qf = [];
    for (var i = 0; i < 8; i += 2) qf.push({ a: ids[i], b: ids[i + 1], w: null, score: '' });
    data().tournament = { cid: pendingTier.cup, me: myId, rounds: [qf], round: 0, out: false, champion: null };
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
    var CP = curCup(), m = cupMyMatch(T);
    var meA = m.a === T.me, opp = meA ? m.b : m.a;
    m.w = res.winner === 0 ? T.me : opp;
    m.score = meA ? res.sets[0] + '-' + res.sets[1] : res.sets[1] + '-' + res.sets[0];
    if (res.winner === 0) out.stars += CP.win;
    else T.out = true;
    advanceCup(T);
    while (T.out && !T.champion) advanceCup(T);
    if (T.champion === T.me) {
      var TR = trophies(), ci0 = T.cid || 0;
      TR.cup++; TR.cw[ci0] = (TR.cw[ci0] || 0) + 1;
      out.stars += CP.title; out.coins = SR.COINS.cupTitle;
      out.notes.push(CP.name + ' winners! +' + CP.title + ' bonus diamonds and ' + SR.COINS.cupTitle + ' coins.');
    }
    else if (T.out) out.notes.push((T.rounds.length === 3 && T.rounds[2][0].w && (T.rounds[2][0].a === T.me || T.rounds[2][0].b === T.me) ? 'Runners-up. ' : 'Knocked out. ') + team(T.champion).name + ' won the ' + CP.name + '.');
    if (T.champion) {
      // The Tournament map: furthest stage here; reaching the final opens the next cup.
      var stage = T.champion === T.me ? 4 : 0, P = data().cupMap, ci = T.cid || 0, up = SR.CUPS[ci + 1];
      T.rounds.forEach(function (ms, r) { ms.forEach(function (x) { if ((x.a === T.me || x.b === T.me) && x.w && x.w !== T.me) stage = r + 1; }); });
      if (stage > (P.best[ci] || 0)) P.best[ci] = stage;
      if (stage >= 3 && up && P.unlocked <= ci) {
        P.unlocked = ci + 1;
        wJust.cup = wPick.cup = ci + 1;
        out.notes.push('New cup unlocked: the ' + up.name + '!');
      }
    }
    return out;
  }

  // The bracket: eight crests on a lit arena, lines from each match to the
  // next, your road in gold, and the trophy waiting in the middle.
  var CUP_ROUNDS = ['Quarter-finals', 'Semi-finals', 'Final'], CUP_ONE = ['Quarter-final', 'Semi-final', 'Final'];
  function cupTrophy() { return SR.trophyImg('cup', (data().tournament && data().tournament.cid) || 0, 'cup-trophy'); }
  var TROPHY = '<svg class="cup-trophy" viewBox="0 0 64 64" aria-hidden="true">' +
    '<path d="M18 6h28v14c0 9-6 16-14 16s-14-7-14-16z" fill="url(#cup-gold)"/><path d="M18 11H9c0 9 4 14 11 15M46 11h9c0 9-4 14-11 15" fill="none" stroke="url(#cup-gold)" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M29 36h6v9h-6z" fill="#e8a400"/><path d="M21 47h22l3 9H18z" fill="url(#cup-gold)"/><rect x="16" y="55" width="32" height="5" rx="2" fill="#b86e00"/>' +
    '<path d="M24 10c0 7 1 13 5 18" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".55"/><path d="M32 13l1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z" fill="#fff8d6" opacity=".9"/></svg>';

  // A team crest: a shield in the team colour with its kit pattern and code.
  function crest(t, clip) {
    if (!t) return '<span class="crest tbd"><svg viewBox="0 0 32 34" aria-hidden="true"><path d="M16 2l13 4.5V15c0 8.5-5.6 14.5-13 17C8.6 29.5 3 23.5 3 15V6.5z"/><text x="16" y="21">?</text></svg></span>';
    var pat = t.pattern === 'stripes' ? '<path d="M9.5 0h3v34h-3zM19.5 0h3v34h-3z"/>' : t.pattern === 'hoops' ? '<path d="M0 12h32v5H0z"/>' : '<path d="M16 0h16v34H16z"/>';
    return '<span class="crest" style="--tc:' + t.color + ';--tt:' + t.trim + '"><svg viewBox="0 0 32 34" aria-hidden="true">' +
      '<path class="cr-b" d="M16 2l13 4.5V15c0 8.5-5.6 14.5-13 17C8.6 29.5 3 23.5 3 15V6.5z"/>' +
      '<g class="cr-p" clip-path="url(#' + (clip || 'cup-shield') + ')">' + pat + '</g>' +
      '<path class="cr-s" d="M16 2l13 4.5V15c0 8.5-5.6 14.5-13 17C8.6 29.5 3 23.5 3 15V6.5z"/>' +
      '<text x="16" y="20.5">' + t.short + '</text></svg></span>';
  }

  function cupRow(T, m, side) {
    var id = m && m[side];
    if (!id) return '<div class="cr tbd">' + crest(null) + '<span class="cn"><b>To be decided</b><b class="abbr">TBD</b></span><span class="cs"></span></div>';
    var t = team(id), sc = m.score ? m.score.split('-')[side === 'a' ? 0 : 1] : '';
    var cls = (m.w ? (m.w === id ? ' win' : ' lose') : '') + (id === T.me ? ' me' : '');
    return '<div class="cr' + cls + '">' + crest(t) + '<span class="cn"><b>' + t.name + '</b><b class="abbr">' + t.short + '</b></span><span class="cs">' + sc + '</span></div>';
  }

  function cupCard(T, r, i) {
    var m = T.rounds[r] && T.rounds[r][i];
    var mine = m && (m.a === T.me || m.b === T.me);
    var state = !m ? 'tbd' : m.w ? 'done' : mine && !T.champion ? 'next' : 'wait';
    return '<div class="cm ' + state + (mine ? ' mine' : '') + '" data-r="' + r + '" data-i="' + i + '">' +
      (state === 'next' ? '<span class="cm-tag">Your match</span>' : '') +
      cupRow(T, m, 'a') + cupRow(T, m, 'b') + '</div>';
  }

  function cupLayout() {
    var w = $('cup-scroll').clientWidth || 800;
    // Folded wide but short on room: team codes instead of full names.
    return w >= 980 ? 'wide' : w >= 820 ? 'wide codes' : w >= 520 ? 'mid' : 'tight';
  }

  function openCup() {
    var T = data().tournament;
    if (!T) { openWorld('cup'); return; }
    mode = 'cup';
    show('scr-cup');
    renderCup();
  }

  function renderCup() {
    var T = data().tournament, CP = curCup(), me = team(T.me), lay = cupLayout(), champ = T.champion && team(T.champion);
    $('cup-title').textContent = CP.name;
    var rnd = T.champion ? 3 : T.round;
    // Columns: wide screens fold the bracket in two around the trophy.
    var cols = lay.indexOf('wide') === 0 ?
      [[0, [0, 1]], [1, [0]], [2, [0]], [1, [1]], [0, [2, 3]]] :
      [[0, [0, 1, 2, 3]], [1, [0, 1]], [2, [0]]];
    var html = '';
    cols.forEach(function (c) {
      var r = c[0], fin = r === 2;
      html += '<div class="cup-colw' + (fin ? ' fin' : '') + (r === rnd ? ' now' : r < rnd ? ' past' : '') + '"><h3>' + CUP_ROUNDS[r] + '</h3><div class="cup-col">';
      if (fin) {
        html += '<div class="cup-final">' +
          '<div class="cup-prize' + (champ ? ' won' : '') + '">' + cupTrophy() + (champ ? '<span class="cup-champ">' + crest(champ) + '<b>' + champ.name + '</b></span>' : '<span class="cup-court">' + SR.courtById(CP.final).name + '</span>') + '</div>' +
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
    $('cup-sub').innerHTML = chip(me) + me.name + ' · ' + (T.champion === T.me ? 'Champions!' : lost >= 0 ? (lost === 2 ? 'Runners-up' : 'Out in the ' + CUP_ROUNDS[lost].toLowerCase()) : CUP_ROUNDS[T.round]);
    $('cup-steps').innerHTML = CUP_ROUNDS.map(function (n, r) {
      var st = lost === r ? 'out' : r < rnd && (lost < 0 || r < lost) ? 'done' : r === rnd ? 'now' : '';
      return '<li class="' + st + '"><span>' + (st === 'done' ? '✓' : st === 'out' ? '✕' : r + 1) + '</span>' + CUP_ONE[r] + '</li>';
    }).join('') + '<li class="' + (T.champion === T.me ? 'done gold' : '') + '"><span>🏆</span>Cup</li>';

    // Bottom: the next match with its venue, or how the cup ended.
    var nx = $('cup-next'), mine = cupMyMatch(T);
    $('scr-cup').classList.toggle('cup-won', T.champion === T.me);
    $('btn-cup-quit').classList.toggle('hidden', !mine);
    hallConfetti('#scr-cup .cup-arena', T.champion === T.me);
    if (mine) {
      var opp = team(mine.a === T.me ? mine.b : mine.a), vid = cupVenue(T, mine), a = SR.ARENAS[vid];
      var host = T.round === 2 ? CP.name + ' final' : vid === T.me ? 'Your home court' : 'Home of the ' + team(vid).name;
      nx.className = 'cup-next';
      nx.innerHTML = '<div class="cup-vs"><span class="cv me">' + crest(me) + '<b>' + me.short + '</b></span><span class="cv-x">VS</span><span class="cv">' + crest(opp) + '<b>' + opp.short + '</b></span></div>' +
        '<span class="cpick-thumb">' + thumbImg(vid) + '</span>' +
        '<span class="venue-text"><small>' + CUP_ONE[T.round] + ' · vs ' + opp.name + ' · <i class="cup-ramp r' + T.round + '">' + SR.CUP_RAMP_LABEL[T.round] + '</i></small><b>' + (a ? a.name : '') + '</b><span>' + host + ' · <i class="cwin">Win ' + SR.GEM + ' ' + CP.win + (T.round === 2 ? ' + ' + CP.title : '') + '</i></span></span>' +
        '<button id="btn-cup-play" type="button" class="btn primary">Play</button>';
      on('btn-cup-play', function () { startMatch(me, opp, vid, CP.diff, null, SR.CUP_RAMP[T.round] || 0); });
      thumbQueue.push(vid);
      setTimeout(pumpThumbs, 0);
    } else {
      var won = T.champion === T.me, cid = T.cid || 0, upC = (won || lost === 2) && SR.CUPS[cid + 1];
      nx.className = 'cup-next over' + (won ? ' won' : '');
      nx.innerHTML = '<span class="cup-end-ico">' + (won ? cupTrophy() : crest(champ)) + '</span>' +
        '<span class="venue-text"><small>' + (won ? 'Cup winners' : lost === 2 ? 'Runners-up' : 'Knocked out') + '</small><b>' + (won ? 'You lifted the ' + CP.name + '!' : champ.name + ' won the cup') + '</b><span>' +
        (won ? me.name + ' beat everyone · ' + SR.GEM + ' +' + CP.title + ' bonus' : 'Better luck next time.') + (upC ? ' The ' + upC.name + ' is open.' : won ? '' : ' Reach the final to unlock the next cup.') + '</span></span>' +
        (upC ? '<button id="btn-cup-up" type="button" class="btn primary">Next cup</button>' : '<button id="btn-cup-new" type="button" class="btn primary">' + (won ? 'Play again' : 'Try again') + '</button>');
      if (upC) on('btn-cup-up', function () { wPick.cup = cid + 1; openWorld('cup'); });
      else on('btn-cup-new', function () { pendingTier.cup = cid; data().tournament = null; save(); openTeams('cup'); });
    }
    drawCupLines();
  }

  // Paper confetti falling over the arena when you win the cup or the league.
  function hallConfetti(sel, on) {
    var host = document.querySelector(sel), box = host.querySelector('.cup-confetti');
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
    host.appendChild(box);
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
  function islandSvg(i, final, w, h) {
    w = w || 300; h = h || 200;
    var rnd = seeded(i * 7919 + 17), radii = [];
    for (var k = 0; k < 9; k++) radii.push(0.86 + rnd() * 0.24);
    var cx = w / 2, cy = h / 2 + 4, sx = w / 300, sy = h / 200;
    var sand = final ? '#ffe39a' : '#f3d9a0', grass = final ? '#7cc45a' : '#5cb85c';
    var out = '<svg class="cisland" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true">' +
      '<path d="' + blob(radii, cx, cy, 148 * sx, 96 * sy) + '" fill="#8fe6f0" opacity="0.55"/>' +
      '<path d="' + blob(radii, cx, cy, 134 * sx, 86 * sy) + '" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="2.5" stroke-dasharray="7 9" class="cfoam"/>' +
      '<path d="' + blob(radii, cx, cy + 5, 126 * sx, 80 * sy) + '" fill="#c9a86a"/>' +
      '<path d="' + blob(radii, cx, cy, 126 * sx, 80 * sy) + '" fill="' + sand + '"/>' +
      '<path d="' + blob(radii.slice().reverse(), cx, cy - 2, 104 * sx, 62 * sy) + '" fill="#3e8e41"/>' +
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
    if (el) el.textContent = C ? (done >= n ? 'All ' + n + ' islands won' : 'Island ' + (done + 1) + ' of ' + n) : 'New: ' + n + ' islands to win';
    var bar = $('career-prog-bar');
    if (bar) bar.style.width = Math.round(done / n * 100) + '%';
    // The League, Tournament and Shop tiles show where you are too.
    var L = data().league, T = data().tournament, tr = data().trophies;
    var LM = data().leagueMap, CM = data().cupMap, nl = SR.LEAGUES.length, nc = SR.CUPS.length;
    if ($('league-prog')) $('league-prog').textContent = L && !L.done ? curLeague().name.replace(' League', '') + ' · Round ' + (L.round + 1) + '/' + L.rounds.length :
      LM.unlocked || tr.league ? (LM.unlocked + 1) + ' / ' + nl + ' leagues open' : nl + ' leagues to climb';
    if ($('cup-prog')) $('cup-prog').textContent = T && !T.champion ? curCup().name.replace(' Cup', '') + ' · ' + CUP_ONE[T.round] :
      CM.unlocked || tr.cup ? (CM.unlocked + 1) + ' / ' + nc + ' cups open' : nc + ' cups to win';
    if ($('shop-prog')) $('shop-prog').textContent = 'Skills, balls, courts and more';
    if ($('career-new')) $('career-new').classList.toggle('hidden', !!C);
    if ($('career-prog') && !C) $('career-prog').textContent = 'Conquer ' + n + ' islands';
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
    $('career-sub').innerHTML = chip(me) + me.name + ' · ' + (done >= n ? 'Every island won! Replay any court.' : 'Island ' + (done + 1) + ' of ' + n);
    $('career-bar').style.width = Math.round(done / n * 100) + '%';

    // A winding sea route, island 1 at the top and the final island at the bottom.
    var map = $('career-map'), mw = map.clientWidth || 600, s = mw < 560 || window.innerHeight < 520 ? 0.7 : 1;
    var ROW = Math.round(205 * s), TOP = Math.round(130 * s), pts = [], html = '', decor = '';
    var amp = Math.max(6, Math.min(27, (mw / 2 - 150 * s) / mw * 100));
    SR.CAREER.forEach(function (st, i) {
      var x = 50 + amp * Math.sin(i * 1.26), y = TOP + i * ROW, a = careerCourt(i), fin = i === n - 1;
      var state = i < C.unlocked ? 'done' : i === C.unlocked ? 'open' : 'locked';
      pts.push([x, y]);
      decor += seaDecor(i, x, y, amp);
      html += '<button type="button" class="cnode ' + state + (i === careerPick ? ' sel' : '') + (i === justUnlocked ? ' unlocking' : '') + (fin ? ' final' : '') +
        '" data-i="' + i + '" style="left:' + x + '%;top:' + y + 'px;--s:' + s + '" aria-label="' + isles[i] + ', ' + a.name + (state === 'locked' ? ', locked' : state === 'done' ? ', won' : '') + '">' +
        islandSvg(i, fin) + '<span class="cfog"></span>' +
        '<span class="csign">' + (fin ? '🏆 ' : '') + isles[i] + '</span>' +
        '<span class="cthumb">' + thumbImg(st.court) + '<span class="clock">' + LOCK + '</span>' +
        (state === 'done' ? '<span class="ccheck">✓</span>' : '') + (state === 'open' ? '<span class="cplay">PLAY</span>' : '') + '</span>' +
        '<span class="cnum">' + (i + 1) + '</span>' +
        '<span class="cname">' + a.name + '</span>' +
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
      '<path class="todo" d="' + seg(0, n - 1) + '"/>' + (reach > 0 ? '<path class="done" d="' + seg(0, reach) + '"/>' : '') + '</svg>' + html;
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
    var what = locked ? 'Locked · win on ' + isles[i - 1] + ' to sail here' :
      i < C.unlocked ? 'Won · replay for ' + SR.GEM + ' ' + SR.STARS.quickWin : (i < SR.CAREER.length - 1 ? 'Win to unlock ' + isles[i + 1] : 'Win the final island') + ' · ' + SR.GEM + ' ' + careerReward(i);
    $('career-pick').innerHTML = '<span class="cpick-thumb">' + thumbImg(st.court) + '</span>' +
      '<span class="venue-text"><small>Island ' + (i + 1) + ' · ' + isles[i] + '</small><b>' + a.name + '</b>' +
      '<span>vs ' + chip(opp) + opp.name + ' · ' + SR.DIFFICULTY[st.diff].label + '</span><span class="cwhat">' + what + '</span></span>' +
      '<button id="btn-career-play" type="button" class="btn primary"' + (locked ? ' disabled' : '') + '>' + (locked ? 'Locked' : 'Play') + '</button>';
    $('career-pick').classList.toggle('locked', locked);
    if (!locked) on('btn-career-play', function () { startMatch(team(C.team), opp, st.court, st.diff); });
  }

  function careerRecord(won) {
    var C = data().career, out = { stars: 0, notes: [] }, i = careerPick, n = SR.CAREER.length;
    if (!C) return out;
    var first = i === C.unlocked, isles = careerIsles(C);
    if (won && first) {
      out.stars += careerReward(i);
      out.coins = SR.COINS.island;
      C.unlocked = i + 1;
      if (i + 1 < n) { justUnlocked = careerPick = i + 1; out.notes.push('New island unlocked: ' + isles[i + 1] + ' (' + careerCourt(i + 1).name + ')!'); }
      else out.notes.push('Career complete! You won every island.');
    } else if (won) out.stars += SR.STARS.quickWin;
    else if (first && i + 1 < n) out.notes.push('Win on ' + isles[i] + ' to unlock ' + isles[i + 1] + '.');
    return out;
  }

  // ---- league and tournament maps -----------------------------------------

  // League map: five leagues up a mountain, the Rookie League in the valley
  // and the Legends League on the summit; the top two of a season go up.
  // Tournament map: six cups on a night-time world tour; reaching a cup's
  // final opens the next one. Progress lives in data().leagueMap / cupMap.
  var pendingTier = { league: 0, cup: 0 }, wPick = { league: -1, cup: -1 }, wJust = { league: -1, cup: -1 };
  var wLastW = { league: 0, cup: 0 }, wArmed = -1, gid = 0;
  var ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  var CUP_STAGE = ['', 'Quarter-finals', 'Semi-finals', 'Runners-up', 'Winners'];

  function wList(kind) { return kind === 'league' ? SR.LEAGUES : SR.CUPS; }
  function wProg(kind) { return data()[kind === 'league' ? 'leagueMap' : 'cupMap']; }
  function curLeague() { var L = data().league; return SR.LEAGUES[(L && L.lid) || 0] || SR.LEAGUES[0]; }
  function curCup() { var T = data().tournament; return SR.CUPS[(T && T.cid) || 0] || SR.CUPS[0]; }
  function wWon(kind, i) { return wProg(kind).best[i] === (kind === 'league' ? 1 : 4); }

  // The season or cup still being played, as its tier index, or -1.
  function wActive(kind) {
    if (kind === 'league') { var L = data().league; return L && !L.done ? (L.lid || 0) : -1; }
    var T = data().tournament;
    return T && cupMyMatch(T) ? (T.cid || 0) : -1;
  }

  // A colour mixed towards white (k > 0) or black (k < 0).
  function shade(hex, k) {
    var v = parseInt(hex.slice(1), 16), to = k < 0 ? 0 : 255, a = Math.abs(k);
    var c = [v >> 16, (v >> 8) & 255, v & 255].map(function (x) { return Math.round(x + (to - x) * a); });
    return 'rgb(' + c.join(',') + ')';
  }

  function starPts(cx, cy, r) {
    var p = [];
    for (var k = 0; k < 10; k++) {
      var a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r;
      p.push((cx + Math.cos(a) * rr).toFixed(1) + ',' + (cy + Math.sin(a) * rr).toFixed(1));
    }
    return p.join(' ');
  }

  // A league badge: a shield in the league colour, one star per tier, a ball
  // and the tier number on a ribbon.
  function lgBadge(i, cls) {
    var c = SR.LEAGUES[i].color, id = 'wg' + (++gid), stars = '';
    for (var k = 0; k <= i; k++) stars += '<polygon points="' + starPts(40 + (k - i / 2) * 10.5, 23, 4.4) + '" fill="#fff8d6"/>';
    var sh = 'M40 3 L75 13 V42 C75 65 59 81 40 88 C21 81 5 65 5 42 V13 Z';
    return '<svg class="wb-svg ' + (cls || '') + '" viewBox="0 0 80 94" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + shade(c, 0.45) + '"/><stop offset=".5" stop-color="' + c + '"/><stop offset="1" stop-color="' + shade(c, -0.4) + '"/></linearGradient></defs>' +
      '<path d="' + sh + '" fill="' + shade(c, -0.6) + '" transform="translate(0 4)"/>' +
      '<path d="' + sh + '" fill="url(#' + id + ')" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M40 10 L68 18 V42 C68 60 55 73 40 79 C25 73 12 60 12 42 V18 Z" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="1.5"/>' + stars +
      '<circle cx="40" cy="48" r="13" fill="#fff"/><path d="M29 44c6 1 12 6 14 13M34 37.5c3.6 3.6 5.4 9.6 4.2 15.6M51 45c-6 0-12.6 3-16 9.6" fill="none" stroke="' + shade(c, -0.3) + '" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M10 64h60l-5 7.5 5 7.5H10l5-7.5z" fill="' + shade(c, -0.5) + '" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<text x="40" y="75.5" text-anchor="middle" font-size="10.5" font-weight="900" font-family="system-ui,sans-serif" fill="#fff" letter-spacing="1">' + ROMAN[i] + '</text></svg>';
  }

  // A cup medallion: a ring in the cup colour around a gold trophy.
  function cupBadge(i, cls) {
    var c = SR.CUPS[i].color, id = 'wg' + (++gid), gold = 'wg' + (++gid);
    return '<svg class="wb-svg ' + (cls || '') + '" viewBox="0 0 80 80" aria-hidden="true"><defs>' +
      '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + shade(c, 0.5) + '"/><stop offset=".5" stop-color="' + c + '"/><stop offset="1" stop-color="' + shade(c, -0.45) + '"/></linearGradient>' +
      '<linearGradient id="' + gold + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".45" stop-color="#ffd23f"/><stop offset="1" stop-color="#e08a00"/></linearGradient></defs>' +
      '<circle cx="40" cy="43" r="37" fill="' + shade(c, -0.65) + '"/>' +
      '<circle cx="40" cy="40" r="37" fill="url(#' + id + ')" stroke="#fff" stroke-width="3"/>' +
      '<circle cx="40" cy="40" r="28" fill="' + shade(c, -0.6) + '"/><circle cx="40" cy="40" r="28" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1.2" stroke-dasharray="2 3"/>' +
      '<g transform="translate(21 19) scale(.6)"><path d="M18 6h28v14c0 9-6 16-14 16s-14-7-14-16z" fill="url(#' + gold + ')"/><path d="M18 11H9c0 9 4 14 11 15M46 11h9c0 9-4 14-11 15" fill="none" stroke="url(#' + gold + ')" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M29 36h6v9h-6z" fill="#e8a400"/><path d="M21 47h22l3 9H18z" fill="url(#' + gold + ')"/><rect x="16" y="55" width="32" height="5" rx="2" fill="#b86e00"/><path d="M24 10c0 7 1 13 5 18" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".55"/></g>' +
      '<text x="40" y="76" text-anchor="middle" font-size="7.5" font-weight="900" font-family="system-ui,sans-serif" fill="#fff" letter-spacing="1">' + ROMAN[i] + '</text></svg>';
  }

  // Ground under a league: a plateau that gets rockier and snowier higher up,
  // with a little stadium on it and pines round the edge.
  var LG_GROUND = [['#67c25a', '#3f8f3a'], ['#58b052', '#367d35'], ['#8fa35a', '#5f6e38'], ['#8d939e', '#5b616c'], ['#eef4fa', '#a9b8c8']];
  function lgGround(i, pre) {
    var rnd = seeded(i * 3571 + 9), radii = [], g = LG_GROUND[Math.min(i, LG_GROUND.length - 1)], c = SR.LEAGUES[i].color;
    for (var k = 0; k < 9; k++) radii.push(0.88 + rnd() * 0.2);
    var out = '<svg class="wground" viewBox="0 0 260 210" aria-hidden="true">' +
      '<ellipse cx="130" cy="168" rx="122" ry="26" fill="rgba(0,0,0,.18)"/>' +
      '<path d="' + blob(radii, 130, 150, 118, 40) + '" fill="' + g[1] + '"/>' +
      '<path d="' + blob(radii, 130, 140, 118, 40) + '" fill="' + g[0] + '"/>' +
      // The stadium: a bowl of seats in the league colour and a court inside.
      '<ellipse cx="130" cy="140" rx="64" ry="20" fill="' + shade(c, -0.45) + '"/><ellipse cx="130" cy="137" rx="60" ry="17" fill="' + c + '"/>' +
      '<ellipse cx="130" cy="138" rx="46" ry="11" fill="' + shade(c, -0.25) + '"/><path d="M100 138 L114 131 H146 L160 138 L146 145 H114 Z" fill="#f28a3a" stroke="#fff" stroke-width="1.2"/>' +
      '<path d="M130 131 V145" stroke="#fff" stroke-width="1.6"/>';
    [[22, 132], [38, 156], [238, 130], [224, 156], [64, 118], [196, 118]].forEach(function (sp, k) {
      if (rnd() < 0.3) return;
      var sc = 0.8 + rnd() * 0.4;
      out += '<use href="#' + pre + '-pine" x="' + (sp[0] - 9 * sc).toFixed(1) + '" y="' + (sp[1] - 26 * sc).toFixed(1) + '" width="' + (18 * sc).toFixed(1) + '" height="' + (28 * sc).toFixed(1) + '"/>';
    });
    if (i === SR.LEAGUES.length - 1) out += '<path d="M226 128 V92" stroke="#5a3a1a" stroke-width="2.5"/><path d="M226 92 l20 6 l-20 6 Z" fill="#ffd23f"/>';
    return out + '</svg>';
  }

  // Ground under a cup: a patch of land at night with city lights and a pin.
  function cupGround(i) {
    var rnd = seeded(i * 6151 + 5), radii = [], c = SR.CUPS[i].color, lights = '';
    for (var k = 0; k < 9; k++) radii.push(0.8 + rnd() * 0.3);
    for (var l = 0; l < 16; l++) {
      var a = rnd() * Math.PI * 2, d = 0.3 + rnd() * 0.6;
      lights += '<circle cx="' + (130 + Math.cos(a) * 95 * d).toFixed(1) + '" cy="' + (148 + Math.sin(a) * 26 * d).toFixed(1) + '" r="' + (1 + rnd() * 1.4).toFixed(1) + '" fill="' + (l % 3 ? '#ffe08a' : shade(c, 0.4)) + '"/>';
    }
    return '<svg class="wground" viewBox="0 0 260 210" aria-hidden="true">' +
      '<path d="' + blob(radii, 130, 150, 124, 40) + '" fill="#163f52"/>' +
      '<path d="' + blob(radii, 130, 146, 120, 37) + '" fill="#1f5a6e" stroke="rgba(120,220,255,.35)" stroke-width="1.5"/>' + lights +
      '<ellipse class="wring" cx="130" cy="150" rx="40" ry="10" fill="none" stroke="' + c + '" stroke-width="2.5"/>' +
      '<ellipse cx="130" cy="150" rx="22" ry="5.5" fill="' + c + '" opacity=".55"/></svg>';
  }

  // Shapes the maps reuse, with ids of their own per map.
  function wDefs(pre) {
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
      '<symbol id="' + pre + '-pine" viewBox="0 0 18 28" overflow="visible"><path d="M8 24h2v4H8z" fill="#6b4423"/><path d="M9 0 L17 12 H13 L18 20 H0 L5 12 H1 Z" fill="#2c6e3a"/></symbol>' +
      '<symbol id="' + pre + '-spine" viewBox="0 0 18 28" overflow="visible"><path d="M8 24h2v4H8z" fill="#6b4423"/><path d="M9 0 L17 12 H13 L18 20 H0 L5 12 H1 Z" fill="#2f5e48"/><path d="M9 0 L12.5 5.2 H10.5 L13 9 H5 L7.5 5.2 H5.5 Z" fill="#f2f7fc"/></symbol>' +
      '<symbol id="' + pre + '-bird" viewBox="0 0 20 8" overflow="visible"><path d="M1 6 Q5 0 10 5 Q15 0 19 6" fill="none" stroke="#24405e" stroke-width="1.6" stroke-linecap="round"/></symbol>' +
      '<symbol id="' + pre + '-plane" viewBox="0 0 40 40" overflow="visible"><path d="M20 2 C22 2 23 4 23 7 V15 L37 23 V27 L23 22.5 V31 L28 35 V38 L20 36 L12 38 V35 L17 31 V22.5 L3 27 V23 L17 15 V7 C17 4 18 2 20 2Z" fill="#f4f7ff" stroke="#9fb3d1" stroke-width="1"/></symbol>' +
      '</defs></svg>';
  }

  // Scenery between the stops: pines, clouds and birds on the mountain;
  // faint coastlines, stars and planes on the world tour.
  function wDecor(kind, i, x, y, amp, pre) {
    var rnd = seeded(i * 92821 + (kind === 'league' ? 11 : 29)), side = x > 50 ? -1 : 1, out = '';
    var dx = 50 + side * (amp + 14 + rnd() * 10), dy = y + (rnd() - 0.5) * 70;
    if (kind === 'league') {
      var sn = i >= 3 ? pre + '-spine' : pre + '-pine', trees = '';
      for (var t = 0; t < 4; t++) trees += '<use href="#' + sn + '" x="' + (t * 13 + rnd() * 5).toFixed(1) + '" y="' + (rnd() * 8).toFixed(1) + '" width="18" height="28"/>';
      out += '<svg class="cdecor wpines" style="left:' + dx + '%;top:' + dy + 'px" viewBox="0 0 64 38">' + trees + '</svg>';
      out += '<i class="cdecor wcloud" style="left:' + (10 + rnd() * 80) + '%;top:' + (y - 90 + rnd() * 50) + 'px;--w:' + Math.round(70 + rnd() * 60) + 'px"></i>';
      if (rnd() < 0.5) out += '<div class="cdecor rocks" style="left:' + (50 - side * (amp + 18)) + '%;top:' + (y + 70) + 'px"><i></i><i></i><i></i></div>';
      if (rnd() < 0.5) out += '<svg class="cdecor gull" style="left:' + (15 + rnd() * 70) + '%;top:' + (y - 100 + rnd() * 30) + 'px" viewBox="0 0 20 8"><use href="#' + pre + '-bird"/></svg>';
    } else {
      var radii = [];
      for (var k = 0; k < 9; k++) radii.push(0.7 + rnd() * 0.5);
      var w = Math.round(150 + rnd() * 120), h = Math.round(w * 0.55);
      out += '<svg class="cdecor wcoast" style="left:' + dx + '%;top:' + dy + 'px;width:' + w + 'px;height:' + h + 'px" viewBox="0 0 200 110"><path d="' + blob(radii, 100, 55, 96, 50) + '"/></svg>';
      for (var st = 0; st < 5; st++) out += '<i class="cdecor wstar" style="left:' + (rnd() * 100).toFixed(1) + '%;top:' + (y - 110 + rnd() * 220).toFixed(0) + 'px;animation-delay:-' + (rnd() * 3).toFixed(2) + 's"></i>';
      if (rnd() < 0.45) out += '<svg class="cdecor wjet" style="left:' + (12 + rnd() * 76) + '%;top:' + (y - 95 + rnd() * 30) + 'px;transform:translate(-50%,-50%) rotate(' + Math.round(60 + rnd() * 60) + 'deg)" viewBox="0 0 40 40"><use href="#' + pre + '-plane"/></svg>';
    }
    return out;
  }

  function openWorld(kind) {
    var list = wList(kind), P = wProg(kind), act = wActive(kind), scr = kind === 'league' ? 'scr-lmap' : 'scr-cmap';
    if (wPick[kind] < 0) wPick[kind] = act >= 0 ? act : P.unlocked;
    wPick[kind] = Math.max(0, Math.min(wPick[kind], list.length - 1));
    wArmed = -1;
    show(scr);
    renderWorld(kind);
    var pre = kind === 'league' ? 'lmap' : 'cmap', node = $(pre + '-map').querySelector('[data-i="' + wPick[kind] + '"]'), sc = $(pre + '-scroll');
    if (node) sc.scrollTop = parseFloat(node.style.top) - sc.clientHeight / 2;
  }

  function renderWorld(kind) {
    var isL = kind === 'league', list = wList(kind), n = list.length, P = wProg(kind), act = wActive(kind), pre = isL ? 'lmap' : 'cmap';
    var won = list.filter(function (x, i) { return wWon(kind, i); }).length;
    $(pre + '-sub').textContent = (P.unlocked + 1) + ' of ' + n + (isL ? ' leagues' : ' cups') + ' open · ' + won + (won === 1 ? ' title' : ' titles') + ' won';
    $(pre + '-bar').style.width = Math.round((P.unlocked + (wWon(kind, n - 1) ? 1 : 0)) / n * 100) + '%';

    // The route: leagues climb from the bottom up, cups fly from the top down.
    var map = $(pre + '-map'), mw = map.clientWidth || 600, s = mw < 560 || window.innerHeight < 520 ? 0.78 : 1;
    var ROW = Math.round(240 * s), TOP = Math.round(150 * s), amp = Math.max(6, Math.min(24, (mw / 2 - 140 * s) / mw * 100));
    var h = TOP + (n - 1) * ROW + Math.round(160 * s), pts = [], html = '', decor = '';
    var L = data().league, T = data().tournament, here = act >= 0 ? act : P.unlocked;
    list.forEach(function (it, i) {
      var row = isL ? n - 1 - i : i, x = 50 + amp * Math.sin(i * 1.35 + (isL ? 0.5 : 0)), y = TOP + row * ROW;
      var best = P.best[i] || 0, state = i > P.unlocked ? 'locked' : i === act ? 'active' : wWon(kind, i) ? 'done' : i === P.unlocked ? 'open' : 'played';
      var tag = state === 'locked' ? 'Locked' : state === 'active' ? (isL ? 'Round ' + (L.round + 1) + ' of ' + L.rounds.length : CUP_ONE[T.round]) :
        state === 'done' ? (isL ? '✓ Champions' : '✓ Cup won') : best ? 'Best: ' + (isL ? leagueOrdinal(best) : CUP_STAGE[best]) : 'PLAY';
      pts.push([x, y]);
      decor += wDecor(kind, i, x, y, amp, pre);
      html += '<button type="button" class="wnode ' + state + (i === wPick[kind] ? ' sel' : '') + (i === wJust[kind] ? ' unlocking' : '') + (i === n - 1 ? ' final' : '') +
        '" data-i="' + i + '" style="left:' + x + '%;top:' + y + 'px;--s:' + s + ';--wc:' + it.color + '" aria-label="' + it.name + ', ' + tag + '">' +
        (isL ? lgGround(i, pre) : cupGround(i)) + '<span class="cfog"></span>' +
        '<span class="wbadge">' + (isL ? lgBadge(i) : cupBadge(i)) + '<span class="clock">' + LOCK + '</span></span>' +
        '<span class="wname">' + it.name + '</span><span class="wtag">' + tag + '</span>' +
        (i === here && state !== 'locked' ? (isL ? '<span class="wflag" style="--fc:' + team(L && !L.done ? L.me : data().settings.team).color + '" aria-hidden="true"></span>' :
          '<svg class="wplane" viewBox="0 0 40 40" aria-hidden="true"><use href="#' + pre + '-plane"/></svg>') : '') + '</button>';
    });
    function seg(a, b) {
      var d = '';
      for (var i = a; i < b; i++) {
        var p = pts[i], q = pts[i + 1], dy = (q[1] - p[1]) / 2;
        d += (i === a ? 'M' + p[0] + ' ' + p[1] : '') + ' C' + p[0] + ' ' + (p[1] + dy) + ' ' + q[0] + ' ' + (q[1] - dy) + ' ' + q[0] + ' ' + q[1];
      }
      return d;
    }
    var reach = Math.min(P.unlocked, n - 1), all = seg(0, n - 1);
    map.style.height = h + 'px';
    map.innerHTML = wDefs(pre) + (isL ? '<div class="wpeaks" aria-hidden="true"></div>' : '') + decor +
      '<svg class="cpath wpath" viewBox="0 0 100 ' + h + '" preserveAspectRatio="none" aria-hidden="true">' +
      (isL ? '<path class="road" d="' + all + '"/>' : '') + '<path class="todo" d="' + all + '"/>' + (reach > 0 ? '<path class="done" d="' + seg(0, reach) + '"/>' : '') + '</svg>' + html;
    map.querySelectorAll('.wnode').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = +b.getAttribute('data-i');
        SR.audio.play('click');
        if (i > P.unlocked) { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); }
        wPick[kind] = i;
        wArmed = -1;
        map.querySelectorAll('.wnode').forEach(function (o) { o.classList.toggle('sel', o === b); });
        worldInfo(kind, i);
      });
    });
    worldInfo(kind, wPick[kind]);
    wJust[kind] = -1;
  }

  // The card under the map: the picked league or cup, its prizes, and Play.
  function worldInfo(kind, i) {
    var isL = kind === 'league', list = wList(kind), it = list[i], n = list.length, P = wProg(kind), act = wActive(kind), pre = isL ? 'lmap' : 'cmap';
    var locked = i > P.unlocked, best = P.best[i] || 0, prev = list[i - 1], next = list[i + 1], diff = SR.DIFFICULTY[it.diff].label;
    var info = isL ? it.teams + ' teams · ' + (it.teams - 1) + ' rounds · ' + diff : '8 teams · knockout · ' + diff + ' · Final: ' + SR.courtById(it.final).name;
    var what = locked ? 'Locked · ' + (isL ? 'finish top ' + SR.LEAGUE_PROMOTE + ' in the ' + prev.name : 'reach the final of the ' + prev.name) + ' to open' :
      'Win ' + SR.GEM + ' ' + it.win + ' · Title ' + SR.GEM + ' +' + it.title + (best ? ' · Best: ' + (isL ? leagueOrdinal(best) : CUP_STAGE[best]) : '') +
      (next && i === P.unlocked && act !== i ? ' · ' + (isL ? 'Top ' + SR.LEAGUE_PROMOTE + ' opens ' : 'Final opens ') + next.name : '');
    var warn = !locked && act >= 0 && act !== i ? '<span class="wwarn">Starting here ends your ' + list[act].name + (isL ? ' season' : ' run') + '</span>' : '';
    var label = locked ? 'Locked' : act === i ? 'Continue' : 'Play';
    var box = $(pre + '-pick');
    box.innerHTML = (isL ? '<span class="wpick-badge wpick-prize">' + SR.trophyImg(kind, i) + '</span>' : '<span class="cpick-thumb">' + thumbImg(it.final) + '<span class="cpick-prize">' + SR.trophyImg(kind, i) + '</span></span>') +
      '<span class="venue-text"><small>' + (isL ? 'League ' : 'Cup ') + (i + 1) + ' of ' + n + ' · ' + it.place + '</small><b>' + it.name + '</b>' +
      '<span>' + info + '</span><span class="cwhat">' + what + '</span>' + warn + '</span>' +
      '<button id="btn-' + pre + '-play" type="button" class="btn primary"' + (locked ? ' disabled' : '') + '>' + label + '</button>';
    box.classList.toggle('locked', locked);
    if (!isL) { thumbQueue.push(it.final); setTimeout(pumpThumbs, 0); }
    if (locked) return;
    on('btn-' + pre + '-play', function () {
      if (act === i) { if (isL) openLeague(); else openCup(); return; }
      if (act >= 0 && wArmed !== i) { wArmed = i; $('btn-' + pre + '-play').textContent = 'Tap again'; return; }
      wArmed = -1;
      pendingTier[kind] = i;
      openTeams(kind);
    });
  }


  // ---- shop, stats, settings ----------------------------------------------

  function renderShop() {
    // 2026-11-13: skills, special smashes, jerseys and the custom team live on
    // the Team screen; the Shop keeps balls, courts and the diamond swap.
    renderTeamHub();
    ['balls', 'courts', 'kits'].forEach(function (kind) {
      var box = $(kind === 'kits' ? 'team-kits' : 'shop-' + kind), key = { balls: 'ball', courts: 'court', kits: 'kit' }[kind];
      if (!box) return;
      box.innerHTML = '';
      SR.SHOP[kind].forEach(function (it) {
        var owned = data().owned[kind].indexOf(it.id) >= 0, eq = data().equipped[key] === it.id, coin = !!it.coins;
        var price = coin ? it.coins : it.price;
        var b = document.createElement('button');
        b.className = 'shop-item' + (eq ? ' equipped' : '') + (it.daily && !owned ? ' gift' : '') + (coin && !owned ? ' coin-item' : '');
        var sw = kind === 'balls'
          ? '<span class="swatch ball" style="background:radial-gradient(circle at 35% 35%,' + it.main + ' 55%,' + it.stripe + ' 56%)"></span>'
          : kind === 'kits' ? SR.daily.jersey(it.color ? it : team(data().settings.team), 'swatch kit')
          : it.motif ? courtSwatch(it) : '<span class="swatch" style="background:linear-gradient(135deg,' + it.court + ' 50%,' + it.floor + ' 50%);border-color:' + it.line + '"></span>';
        b.innerHTML = sw + '<span class="iname">' + it.name + '</span><span class="iprice">' +
          (eq ? 'Equipped' : owned ? 'Equip' : it.daily ? 'Daily reward' : (coin ? SR.COIN : SR.GEM) + ' ' + SR.fmtNum(price)) + '</span>';
        b.addEventListener('click', function () {
          if (!owned && it.daily) { SR.audio.play('click'); SR.daily.open(); return; }
          if (!owned) {
            if (data()[coin ? 'coins' : 'stars'] < price) { b.classList.add('shake'); setTimeout(function () { b.classList.remove('shake'); }, 400); }
            // Ask Yes / No before spending; buying equips it.
            var noun = { balls: ' ball', courts: ' court', kits: ' jersey' }[kind];
            SR.confirmBuy({ name: it.name + noun, price: price, coins: coin, art: sw, what: 'It is equipped as soon as you buy it.',
              onBuy: function () {
                data().owned[kind].push(it.id);
                data().equipped[key] = it.id;
                SR.audio.play('reward');
                save();
                renderShop();
              } });
            return;
          }
          data().equipped[key] = it.id;
          SR.audio.play('click');
          save();
          renderShop();
        });
        box.appendChild(b);
      });
    });
    // Coins for diamonds.
    var ex = $('shop-exchange');
    if (ex) {
      ex.innerHTML = '';
      SR.COINS.exchange.forEach(function (pk, i) {
        var b = document.createElement('button');
        b.className = 'shop-item ex-item' + (i === SR.COINS.exchange.length - 1 ? ' best' : '');
        var art = '<span class="ex-art">' + SR.GEM + (pk.gems >= 5 ? SR.GEM : '') + (pk.gems >= 12 ? SR.GEM : '') + '</span>';
        b.innerHTML = art + '<span class="iname">' + pk.gems + ' diamond' + (pk.gems > 1 ? 's' : '') + '</span><span class="iprice">' + SR.COIN + ' ' + SR.fmtNum(pk.coins) + '</span>' +
          (i ? '<span class="ex-tag">' + (i === 1 ? 'Save 12%' : 'Best deal') + '</span>' : '');
        b.addEventListener('click', function () {
          SR.confirmBuy({ name: pk.gems + ' diamond' + (pk.gems > 1 ? 's' : ''), verb: 'Get', yes: 'Yes, swap', price: pk.coins, coins: true, art: art,
            what: 'Your coins become diamonds.',
            onBuy: function () { data().stars += pk.gems; SR.audio.play('reward'); save(); renderShop(); } });
        });
        ex.appendChild(b);
      });
    }
  }

  // ---- Team screen (bottom bar Team tab) -------------------------------------
  // Your club in one place: the team card on top, then tabs for Skills,
  // Special smashes, Jerseys and the Custom team.
  var teamTab = 'skills';
  function myTeam() {
    var id = data().settings.team, ct = SR.customTeam && SR.customTeam();
    return id === 'custom' && ct ? ct : team(id) || SR.TEAMS[0];
  }
  function renderTeamHub() {
    var hero = $('tm-hero');
    if (!hero) return;
    var sk = data().skills || { owned: [], on: [], slots: 1 }, list = SR.SKILLS ? SR.SKILLS.list : [];
    var skillsOwned = list.filter(function (k) { return !k.special && sk.owned.indexOf(k.id) >= 0; }).length;
    var smashOwned = list.filter(function (k) { return k.special && sk.owned.indexOf(k.id) >= 0; }).length;
    // The team card shows only the custom team: unlock it, or edit it.
    var ct = SR.customTeam && SR.customTeam(), back = function () { openTeam(); };
    if (ct) {
      var lv = SR.customCaps(data().custom.lvl).lvl + 1, mine = data().settings.team === 'custom';
      hero.className = 'tm-hero';
      hero.innerHTML = '<span class="tm-kit">' + (SR.daily ? SR.daily.jersey(ct, 'tm-jersey') : '') + '</span>' +
        '<span class="tm-id"><small>Custom team</small><b>' + esc(ct.name) + '</b>' +
        '<span class="tm-chips"><i>Lv. ' + lv + '</i>' + (mine ? '<i class="tm-on">Playing</i>' : '') + '</span>' +
        '<span class="tm-stats">ATK ' + ct.r.attack + ' · BLK ' + ct.r.block + ' · PASS ' + ct.r.pass + ' · SRV ' + ct.r.serve + ' · SPD ' + ct.r.speed + '</span></span>' +
        '<button type="button" class="tm-act">Edit team</button>';
    } else {
      hero.className = 'tm-hero locked';
      hero.innerHTML = '<span class="tm-kit">' + (SR.custom ? SR.custom.blank() : '') + '</span>' +
        '<span class="tm-id"><small>Custom team</small><b>Your own club</b>' +
        '<span class="tm-stats">Pick the name, colours and skill points, then upgrade it with coins.</span></span>' +
        '<button type="button" class="tm-act gold">Unlock ' + SR.GEM + ' ' + SR.CUSTOM.price + '</button>';
    }
    hero.querySelector('.tm-act').addEventListener('click', function () {
      if (!SR.custom) return;
      if (ct) { SR.audio.play('click'); SR.custom.open(back); } else SR.custom.unlock(back);
    });
    var counts = { skills: skillsOwned + '/' + list.filter(function (k) { return !k.special; }).length,
      smashes: smashOwned + '/' + list.filter(function (k) { return k.special; }).length,
      kits: data().owned.kits.length + '/' + SR.SHOP.kits.length };
    document.querySelectorAll('#tm-tabs [data-tab]').forEach(function (b) {
      var k = b.getAttribute('data-tab'), on = k === teamTab;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on);
      var c = b.querySelector('em'); if (c) c.textContent = counts[k] || '';
    });
    ['skills', 'smashes', 'kits'].forEach(function (k) { $('tm-p-' + k).classList.toggle('hidden', k !== teamTab); });
    if (SR.skills) { SR.skills.shopCard($('team-skills'), 'skills'); SR.skills.shopCard($('team-smashes'), 'smashes'); }
  }
  function openTeam(tab) {
    if (tab) teamTab = tab;
    renderShop();
    show('scr-myteam');
  }

  // The Shop, opened from the home screen's coin / diamond counters, can
  // scroll straight to a section.
  function openShop(scrollTo) {
    renderShop();
    show('scr-shop');
    var p = document.querySelector('#scr-shop .panel'), el = scrollTo && $(scrollTo);
    if (p) p.scrollTop = 0;
    if (p && el) setTimeout(function () { p.scrollTop = Math.max(0, el.offsetTop - 90); }, 30);
  }

  // ---- stats ----------------------------------------------------------------

  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function renderStats() {
    var s = data().stats, pct = s.matches ? Math.round(s.wins / s.matches * 100) : 0, pf = data().profile, need = SR.XP.need(pf.level);
    $('stats-profile').innerHTML = '<span class="avatar big">' + SR.profile.avatar(pf.avatar) + '</span>' +
      '<span class="sp-who"><b>' + esc(pf.name || 'Player') + '</b><span class="h-lvl"><em>Lv. ' + pf.level + '</em><span class="xp-bar"><i style="width:' + Math.round(pf.xp / need * 100) + '%"></i></span></span>' +
      '<small>' + SR.fmtNum(pf.xp) + ' / ' + SR.fmtNum(need) + ' XP<span class="sp-tot"> · ' + SR.fmtNum(pf.total) + ' XP in total</span></small></span>' +
      '<span class="st-cur">' + SR.gems(data().stars) + SR.coinsHtml(data().coins) + '</span>';
    // Win-rate ring with the match record beside it.
    $('stats-hero').innerHTML = '<div class="sh-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="r-bg" cx="60" cy="60" r="50"/>' +
      (pct ? '<circle class="r-fg" cx="60" cy="60" r="50" pathLength="100" stroke-dasharray="' + pct + ' 100"/>' : '') + '</svg>' +
      '<span class="sh-mid"><b>' + pct + '%</b><small>Win rate</small></span></div>' +
      '<div class="sh-rec">' + [['Matches', s.matches, ''], ['Wins', s.wins, 'w'], ['Losses', Math.max(0, s.matches - s.wins), 'l'], ['Best streak', s.best, 'r']].map(function (r) {
        return '<div class="sh-row ' + r[2] + '"><span>' + r[0] + '</span><b>' + SR.fmtNum(r[1]) + '</b></div>';
      }).join('') + '</div>';
    var IC = {
      s: '<rect x="4" y="13" width="16" height="6" rx="2"/><rect x="6" y="5" width="12" height="6" rx="2"/>',
      p: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.8"/>',
      k: '<path d="M13.5 2.5L5.5 13.5h6l-1.5 8 8.5-11.5h-6z"/>',
      a: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
      b: '<path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11M10 10V5a1.5 1.5 0 0 1 3 0v5M13 10V6a1.5 1.5 0 0 1 3 0v6M16 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5a6 6 0 0 1-5-2.7L4 14.5a1.5 1.5 0 0 1 2.4-1.8L7 13.5"/>',
      v: '<path d="M4 20h16"/><path d="M7 16.5v-5M12 16.5V7M17 16.5v-8"/>'
    };
    var rows = [['Sets won', s.sets, 's'], ['Points won', SR.fmtNum(s.points), 'p'], ['Kills', s.kills, 'k'],
      ['Aces', s.aces, 'a'], ['Blocks', s.blocks, 'b'], ['Per match', s.matches ? Math.round(s.points / s.matches) : 0, 'v']];
    $('stats-list').innerHTML = rows.map(function (r) {
      return '<div class="st-tile st-' + r[2] + '"><span class="st-ic"><svg viewBox="0 0 24 24" aria-hidden="true">' + IC[r[2]] + '</svg></span><b>' + r[1] + '</b><small>' + r[0] + '</small></div>';
    }).join('');
    // Matches with each team you have played as.
    var bt = s.byTeam || {}, ids = Object.keys(bt).filter(function (id) { return bt[id].m > 0 && (id !== 'custom' || SR.customTeam()); });
    ids.sort(function (a, b) { return bt[b].m - bt[a].m; });
    $('stats-teams').innerHTML = ids.length ? ids.map(function (id) {
      var t = team(id), r = bt[id], wp = Math.round(r.w / r.m * 100);
      return '<div class="tm-row"><span class="jersey" style="background:' + t.color + ';color:' + t.trim + '">' + esc(t.short) + '</span>' +
        '<span class="tm-txt"><b>' + esc(t.name) + '</b><small>' + r.m + ' played · ' + r.w + ' won</small></span>' +
        '<span class="tm-pct' + (wp >= 50 ? ' up' : '') + '">' + wp + '%</span>' +
        '<span class="tm-bar"><i style="width:' + wp + '%;background:' + t.color + '"></i></span></div>';
    }).join('') : '<p class="st-empty">Play a match to see stats for each team you use.</p>';
    renderTrophies();
  }

  // The trophy cabinet: one trophy for each league and cup, lit up once won.
  function renderTrophies() {
    var T = trophies(), C = data().career, ch = data().challenge, won = 0, total = 0;
    function tile(art, name, sub, n, place) {
      total++;
      if (n) won++;
      return '<div class="trophy' + (n ? ' won' : ' locked') + '"><span class="tr-art">' + art + (n ? '' : '<span class="tr-lock" aria-hidden="true"></span>') + (n > 1 ? '<em class="tr-x">×' + n + '</em>' : '') + '</span>' +
        '<b>' + name + '</b><small>' + (n ? (place ? place + ' · ' : '') + 'Won ' + (n === 1 ? 'once' : n + ' times') : sub) + '</small></div>';
    }
    var lg = SR.LEAGUES.map(function (L, i) { return tile(SR.trophyArt('league', i), L.name + ' Trophy', 'Win the ' + L.name, T.lw[i] || 0, L.place); }).join('');
    var cp = SR.CUPS.map(function (c, i) { return tile(SR.trophyArt('cup', i), c.name, 'Win the ' + c.name, T.cw[i] || 0, c.place); }).join('');
    var sp = SR.SPECIAL_TROPHIES.map(function (d, i) { return tile(SR.trophyArt('special', i), d.name, d.how, d.n(data()), ''); }).join('');
    var medals = '<div class="tr-medals">' + [['g', 'Titles', T.league], ['s', '2nd', T.silver], ['b', '3rd', T.bronze], ['c', 'Cups', T.cup]].map(function (m) {
      return '<span class="md md-' + m[0] + '"><i></i><b>' + m[2] + '</b><small>' + m[1] + '</small></span>';
    }).join('') + '</div>';
    $('stats-trophies').innerHTML = medals +
      '<h4>Leagues</h4><div class="trophy-grid">' + lg + '</div>' +
      '<h4>Tournaments</h4><div class="trophy-grid">' + cp + '</div>' +
      '<h4>Special</h4><div class="trophy-grid">' + sp + '</div>';
    $('trophy-count').textContent = won + ' / ' + total;
  }

  function fillSettings() {
    var s = data().settings;
    var ids = [];
    SR.SET_OPTIONS.forEach(function (n) { SR.POINT_OPTIONS.forEach(function (pt) { ids.push(SR.formatId(pt, n)); }); });
    // Older saves used named formats; map them onto the same choices.
    var cf = SR.formatOf(s.format);
    s.format = SR.formatId(cf.points, cf.sets);
    $('set-format').innerHTML = ids.map(function (k) { return '<option value="' + k + '">' + SR.formatOf(k).label + '</option>'; }).join('');
    $('set-diff').innerHTML = Object.keys(SR.DIFFICULTY).filter(function (k) { return !SR.DIFFICULTY[k].hidden; }).map(function (k) { return '<option value="' + k + '">' + SR.DIFFICULTY[k].label + '</option>'; }).join('');
    $('set-format').value = s.format;
    $('set-diff').value = s.difficulty;
    $('set-sound').checked = !!s.sound;
    $('set-music').checked = s.music !== false;
    if ($('set-sharp')) $('set-sharp').checked = s.hd === true;
    if (SR.profile) SR.profile.refresh();
  }

  // ---- pause --------------------------------------------------------------

  function togglePause() {
    var g = SR.game;
    if (!g || g.cfg.human === -1) return;
    // Online the match keeps running for your friend; the menu just opens on top.
    if (g.cfg.online) { show(current === 'scr-pause' ? null : 'scr-pause'); return; }
    g.paused = !g.paused;
    if (g.paused) show('scr-pause'); else show(null);
  }

  function quitMatch() {
    if (SR.game && SR.game.cfg.online && SR.net) { quitOnline(); return; }
    stopMatch();
    show('scr-menu');
  }

  // Result screen for an online match, from this player's side (2026-11-12:
  // the app's own result look). The match pays XP and coins like a quick
  // match (a reward ad can double those, never the stake); the coin stake is
  // shown on its own line: the winner gets both stakes.
  function onlineResult(r) {
    var won = r.mySets > r.oppSets, st = data().stats, stars = won ? SR.STARS.quickWin : 0, my = r.stats || {};
    mode = 'online';
    st.matches++;
    if (won) st.wins++;
    st.streak = won ? st.streak + 1 : 0;
    st.best = Math.max(st.best, st.streak);
    r.history.forEach(function (x) { st.points += x[0]; if (x[0] > x[1]) st.sets++; });
    st.aces += my.aces || 0; st.kills += my.kills || 0; st.blocks += my.blocks || 0; st.errors += my.errors || 0;
    st.online = st.online || { m: 0, w: 0 };
    st.online.m++; if (won) st.online.w++;
    var loot = SR.profile.matchLoot({ kills: my.kills || 0, aces: my.aces || 0, blocks: my.blocks || 0 }, won, 'quick');
    var pf = data().profile, before = { level: pf.level, xp: pf.xp }, coins = loot.coins;
    data().stars += stars;
    data().coins += coins;
    var ups = SR.profile.addXp(loot.xp);
    save();
    var who = r.friend ? ' vs ' + r.friend : '';
    $('result-title').textContent = won ? 'Victory!' : 'Defeat';
    $('result-title').className = won ? 'win' : 'loss';
    $('result-title').parentNode.classList.toggle('lost', !won);
    $('result-sub').textContent = r.me.name + ' ' + r.mySets + ' - ' + r.oppSets + ' ' + r.opp.name + ' · Online' + who;
    $('result-sets').textContent = r.history.map(function (x) { return x[0] + '-' + x[1]; }).join('   ');
    $('result-stats').textContent = 'Aces ' + (my.aces || 0) + ' · Kills ' + (my.kills || 0) + ' · Blocks ' + (my.blocks || 0) + ' · Errors ' + (my.errors || 0);
    resultLoot(stars, coins, loot.xp, before, ups);
    var note = '';
    if (r.stake) {
      note = won ? 'Stake won: ' + SR.fmtNum(r.coinsWon || r.stake * 2) + ' coins (yours back + your friend\'s ' + SR.fmtNum(r.stake) + ').'
        : 'Stake lost: ' + SR.fmtNum(r.stake) + ' coins went to ' + (r.friend || 'your friend') + '.';
      var box = $('result-stars');
      box.insertAdjacentHTML('afterbegin', '<span class="loot stake-loot' + (won ? '' : ' lost') + '">' + SR.COIN + '<b>' + (won ? '+' + SR.fmtNum(r.coinsWon || r.stake * 2) : '-' + SR.fmtNum(r.stake)) + '</b><small>stake</small></span>');
    }
    $('result-notes').textContent = note;
    resultButtons({ label: 'Play online again', go: function () { if (SR.net) SR.net.openLobby(); } });
    resultAds(stars, coins, null);
    stopMatch();
    refreshStars();
    show('scr-result');
  }

  // Leaving an online match with coins at stake: ask first.
  function quitOnline() {
    var n = SR.net, stake = n && n.held && n.stake;
    if (!stake || !SR.custom || !SR.custom.ask) { n.leave(); return; }
    SR.custom.ask({ title: 'Leave the match?', yes: 'Leave', no: 'Keep playing',
      text: 'Your friend wins and you lose your <b class="cf-coin">' + SR.COIN + ' ' + SR.fmtNum(stake) + '</b> stake.',
      onYes: function () { n.leave(); } });
  }

  // ---- wiring -------------------------------------------------------------

  function on(id, fn) { $(id).addEventListener('click', function () { SR.audio.play('click'); fn(); }); }

  SR.ui = {
    togglePause: togglePause,
    show: show,
    current: function () { return current; },
    stopMatch: stopMatch,
    quit: quitMatch,
    teamCards: teamCards,
    rulesPicker: rulesPicker,
    courtPicker: courtPicker,
    courtSwatch: courtSwatch,
    onlineResult: onlineResult,
    refreshStars: refreshStars,
    save: save,
    renderShop: renderShop,
    openShop: openShop,
    openTeam: openTeam,
    // Back to "Choose your team" in the same mode (the custom team builder).
    teams: function () { renderTeams(); show('scr-teams'); },
    // Start a match in a given mode (the daily challenge uses 'daily').
    play: function (m, home, away, venue, difficulty, format) { mode = m; startMatch(home, away, venue, difficulty, format); },
    init: function () {
      refreshStars();
      refreshCareer();
      on('btn-quick', function () { show('scr-quick'); });
      on('btn-quick-random', quickRandom);
      on('btn-quick-choose', function () { openTeams('quick'); });
      on('btn-career', openCareer);
      on('btn-online', function () { if (SR.net) SR.net.openLobby(); });
      on('btn-career-team', function () { openTeams('career'); });
      var careerArmed = false;
      on('btn-career-reset', function () {
        var b = $('btn-career-reset');
        if (!careerArmed) { careerArmed = true; b.textContent = 'Click again to restart'; b.classList.add('armed'); setTimeout(function () { careerArmed = false; b.textContent = 'Restart career'; b.classList.remove('armed'); }, 3000); return; }
        careerArmed = false; b.textContent = 'Restart career'; b.classList.remove('armed');
        data().career = null; careerPick = 0; save(); openTeams('career');
      });
      on('btn-league', function () { openWorld('league'); });
      on('btn-cup', function () { openWorld('cup'); });
      on('btn-league-back', function () { openWorld('league'); });
      on('btn-cup-back', function () { openWorld('cup'); });
      on('btn-shop', function () { openShop(); });
      on('btn-shop-team', function () { openTeam(); });
      document.querySelectorAll('#tm-tabs [data-tab]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (teamTab === b.getAttribute('data-tab')) return;
          SR.audio.play('click'); teamTab = b.getAttribute('data-tab'); renderTeamHub();
          var p = document.querySelector('#scr-myteam .panel'), tb = $('tm-tabs');
          if (p && tb && p.scrollTop > tb.offsetTop - 10) p.scrollTop = tb.offsetTop - 10;
        });
      });
      on('btn-stats', function () { renderStats(); show('scr-stats'); });
      on('btn-settings', function () { fillSettings(); show('scr-settings'); });
      on('btn-privacy', function () { show('scr-privacy'); var p = document.querySelector('#scr-privacy .panel'); if (p) p.scrollTop = 0; });
      on('btn-privacy-back', function () { show('scr-settings'); });
      document.querySelectorAll('[data-back]').forEach(function (b) {
        b.addEventListener('click', function () { SR.audio.play('click'); show('scr-menu'); });
      });
      var leagueArmed = false;
      on('btn-league-quit', function () {
        var b = $('btn-league-quit');
        if (!leagueArmed) { leagueArmed = true; b.textContent = 'Click again to abandon'; b.classList.add('armed'); setTimeout(function () { leagueArmed = false; b.textContent = 'Abandon league'; b.classList.remove('armed'); }, 3000); return; }
        leagueArmed = false; b.textContent = 'Abandon league'; b.classList.remove('armed');
        data().league = null; save(); openWorld('league');
      });
      var cupArmed = false;
      on('btn-cup-quit', function () {
        var b = $('btn-cup-quit');
        if (!cupArmed) { cupArmed = true; b.textContent = 'Click again to abandon'; b.classList.add('armed'); setTimeout(function () { cupArmed = false; b.textContent = 'Abandon tournament'; b.classList.remove('armed'); }, 3000); return; }
        cupArmed = false; b.textContent = 'Abandon tournament'; b.classList.remove('armed');
        data().tournament = null; save(); openWorld('cup');
      });
      on('btn-result-next', function () { if (resultNext) resultNext.go(); });
      on('btn-result-ok', function () {
        if (mode === 'league') openLeague(); else if (mode === 'cup') openCup(); else if (mode === 'career') openCareer(); else if (mode === 'daily' && SR.challenge) SR.challenge.open(); else show('scr-menu');
      });
      on('btn-pause', togglePause);
      on('btn-resume', togglePause);
      on('btn-quit', function () { quitMatch(); });
      // Two-step reset: the first click arms the button, the second resets.
      var armed = false;
      on('btn-reset', function () {
        var b = $('btn-reset');
        if (!armed) { armed = true; b.textContent = 'Tap again to erase everything'; b.classList.add('armed'); setTimeout(function () { armed = false; b.textContent = 'Reset progress'; b.classList.remove('armed'); }, 3000); return; }
        armed = false; b.textContent = 'Reset progress'; b.classList.remove('armed');
        SR.save.reset(); renderStats(); refreshStars(); refreshCareer();
        // Back to the very first launch: ask the name again.
        if (SR.profile) SR.profile.ask(true);
      });
      // The map's curve depends on its width.
      var lastW = 0;
      window.addEventListener('resize', function () {
        var w = $('career-map').clientWidth;
        if (current === 'scr-career' && w !== lastW) { lastW = w; renderCareer(); }
        if (current === 'scr-cup') renderCup();
        if (current === 'scr-lmap' || current === 'scr-cmap') {
          var k = current === 'scr-lmap' ? 'league' : 'cup', mw = $(current === 'scr-lmap' ? 'lmap-map' : 'cmap-map').clientWidth;
          if (mw !== wLastW[k]) { wLastW[k] = mw; renderWorld(k); }
        }
        if (current === 'scr-league') renderLeague();
      });
      $('set-format').addEventListener('change', function (e) { data().settings.format = e.target.value; save(); });
      $('set-diff').addEventListener('change', function (e) { data().settings.difficulty = e.target.value; save(); });
      $('set-sound').addEventListener('change', function (e) { data().settings.sound = e.target.checked; save(); });
      $('set-music').addEventListener('change', function (e) { data().settings.music = e.target.checked; save(); if (SR.music) SR.music.refresh(); });
      // Sharp graphics: off lets a slow phone drop to a lower, smoother resolution.
      if ($('set-sharp')) $('set-sharp').addEventListener('change', function (e) { data().settings.hd = e.target.checked; save(); SR.resScale = 1; if (SR.resize) SR.resize(); });
      stopMatch();
      show('scr-menu');
    }
  };
})();
