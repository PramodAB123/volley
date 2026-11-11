// Save and load progress in localStorage. Every access is guarded so the
// game still runs when storage is blocked (private windows, previews).
(function () {
  var KEY = 'spikeRally.v1';

  function defaults() {
    return {
      stars: 0,
      owned: { balls: ['classic'], courts: ['maple'], kits: ['team'] },
      equipped: { ball: 'classic', court: 'maple', kit: 'team' },
      settings: { format: 'standard', difficulty: 'normal', sound: true, music: true, team: 'hawks' },
      stats: { matches: 0, wins: 0, points: 0, aces: 0, kills: 0, blocks: 0 },
      // The League screen's trophy cabinet; seasons = last finishes, newest first.
      trophies: { league: 0, unbeaten: 0, silver: 0, bronze: 0, cup: 0, seasons: [] },
      league: null,
      tournament: null,
      career: null,
      // League and Tournament maps: unlocked = highest open tier (index);
      // best[i] = best league finish (1 = champions) / furthest cup stage
      // (1 out in QF, 2 SF, 3 runner-up, 4 won).
      leagueMap: { unlocked: 0, best: [] },
      cupMap: { unlocked: 0, best: [] },
      daily: { streak: 0, last: null, week: 0 },
      // Daily challenge: day = day number of today's tries, last = last day won.
      challenge: { day: 0, done: false, tries: 0, streak: 0, last: 0, total: 0, best: 0 },
      // Custom team (js/custom.js): bought once for stars, then edited freely.
      custom: JSON.parse(JSON.stringify(SR.CUSTOM.base))
    };
  }

  function merge(base, extra) {
    if (!extra || typeof extra !== 'object') return base;
    Object.keys(base).forEach(function (k) {
      if (!(k in extra)) return;
      var b = base[k], e = extra[k];
      if (b && typeof b === 'object' && !Array.isArray(b) && e && typeof e === 'object') base[k] = merge(b, e);
      else base[k] = e;
    });
    return base;
  }

  // A save can be damaged or come from an older build (a cut-off cloud
  // write, a value edited by hand, an id that no longer exists). Anything the
  // menus can't use is put back to its default, and a League, Tournament or
  // Career that doesn't hold together is dropped, so a bad save never stops
  // the game from loading.
  function num(v, min) { v = Number(v); return isFinite(v) && v >= (min || 0) ? Math.floor(v) : (min || 0); }
  var customOn = false; // set by clean(): the custom team is a valid team only once unlocked
  function isTeam(id) { return typeof id === 'string' && ((id === 'custom' && customOn) || SR.TEAMS.some(function (t) { return t.id === id; })); }
  function shopHas(kind, id) { return !!(SR.SHOP[kind] && SR.SHOP[kind].some(function (x) { return x.id === id; })); }
  function obj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function teamList(a) { return Array.isArray(a) && a.length > 0 && a.every(isTeam); }

  function okLeague(L) {
    if (!obj(L) || !isTeam(L.me) || !teamList(L.teams) || L.teams.indexOf(L.me) < 0) return false;
    if (!Array.isArray(L.rounds) || !L.rounds.length || !obj(L.table)) return false;
    var pairsOk = L.rounds.every(function (r) {
      return Array.isArray(r) && r.some(function (p) { return Array.isArray(p) && (p[0] === L.me || p[1] === L.me); }) &&
        r.every(function (p) { return Array.isArray(p) && p.length === 2 && L.teams.indexOf(p[0]) >= 0 && L.teams.indexOf(p[1]) >= 0; });
    });
    if (!pairsOk) return false;
    var tableOk = L.teams.every(function (id) {
      var r = L.table[id];
      return obj(r) && ['p', 'w', 'l', 'sw', 'sl', 'pts'].every(function (k) { return typeof r[k] === 'number' && isFinite(r[k]); });
    });
    if (!tableOk) return false;
    L.round = Math.min(num(L.round), L.rounds.length);
    L.done = !!L.done || L.round >= L.rounds.length;
    if (!Array.isArray(L.log)) L.log = [];
    if (L.results != null && !Array.isArray(L.results)) delete L.results;
    return true;
  }

  function okCup(T) {
    if (!obj(T) || !isTeam(T.me) || !Array.isArray(T.rounds) || !T.rounds.length || T.rounds.length > 3) return false;
    var roundsOk = T.rounds.every(function (r, i) {
      return Array.isArray(r) && r.length === 4 >> i && r.every(function (m) {
        return obj(m) && isTeam(m.a) && isTeam(m.b) && (m.w == null || m.w === m.a || m.w === m.b);
      });
    });
    if (!roundsOk) return false;
    T.round = num(T.round);
    if (T.round !== T.rounds.length - 1) return false;
    if (T.champion != null && !isTeam(T.champion)) return false;
    // Still in it: your match this round must be there.
    if (!T.champion && !T.out && !T.rounds[T.round].some(function (m) { return m.a === T.me || m.b === T.me; })) return false;
    T.out = !!T.out;
    return true;
  }

  // The custom team: a bad name, colour or rating goes back to its default;
  // ratings that don't add up to the points budget are reset to even.
  function cleanCustom(c) {
    var C = SR.CUSTOM, b = defaults().custom, hex = /^#[0-9a-fA-F]{6}$/;
    if (!obj(c)) return b;
    c.unlocked = c.unlocked === true;
    c.name = SR.customName(c.name) || b.name;
    c.short = SR.customShort(c.short) || SR.customShort(c.name) || b.short;
    if (!hex.test(c.color)) c.color = b.color;
    if (!hex.test(c.trim)) c.trim = b.trim;
    if (!C.patterns.some(function (p) { return p[0] === c.pattern; })) c.pattern = b.pattern;
    var r = obj(c.r) ? c.r : {}, sum = 0, ok = true;
    C.stats.forEach(function (st) {
      var v = Number(r[st[0]]);
      if (!isFinite(v) || v < C.min || v > C.max) ok = false; else sum += Math.round(v);
    });
    if (!ok || sum > C.total) r = Object.assign({}, b.r);
    else C.stats.forEach(function (st) { r[st[0]] = Math.round(r[st[0]]); });
    c.r = {};
    C.stats.forEach(function (st) { c.r[st[0]] = r[st[0]]; });
    return c;
  }

  function clean(d) {
    var def = defaults();
    d.stars = num(d.stars);
    d.custom = cleanCustom(d.custom);
    customOn = d.custom.unlocked;
    ['owned', 'equipped', 'settings', 'stats', 'trophies', 'daily', 'challenge', 'leagueMap', 'cupMap'].forEach(function (k) { if (!obj(d[k])) d[k] = def[k]; });
    Object.keys(def.owned).forEach(function (kind) {
      var list = Array.isArray(d.owned[kind]) ? d.owned[kind].filter(function (id) { return typeof id === 'string'; }) : [];
      def.owned[kind].forEach(function (id) { if (list.indexOf(id) < 0) list.unshift(id); });
      d.owned[kind] = list;
    });
    [['ball', 'balls'], ['court', 'courts'], ['kit', 'kits']].forEach(function (e) {
      if (!(e[0] in def.equipped)) return;
      var id = d.equipped[e[0]];
      if (!shopHas(e[1], id) || d.owned[e[1]].indexOf(id) < 0) d.equipped[e[0]] = def.equipped[e[0]];
    });
    var s = d.settings;
    if (!isTeam(s.team)) s.team = def.settings.team;
    if (!SR.DIFFICULTY[s.difficulty]) s.difficulty = def.settings.difficulty;
    if (typeof s.format !== 'string' || (!SR.FORMATS[s.format] && SR.formatOf(s.format) === SR.FORMATS.standard)) s.format = def.settings.format;
    if (typeof s.sound !== 'boolean') s.sound = s.sound !== false && s.sound !== 'false';
    if (typeof s.music !== 'boolean') s.music = s.music !== false && s.music !== 'false';
    if ('lang' in def.settings && typeof s.lang !== 'string') s.lang = def.settings.lang;
    Object.keys(def.stats).forEach(function (k) { d.stats[k] = num(d.stats[k]); });
    Object.keys(def.trophies).forEach(function (k) { if (k !== 'seasons') d.trophies[k] = num(d.trophies[k]); });
    if (!Array.isArray(d.trophies.seasons)) d.trophies.seasons = [];
    d.trophies.seasons = d.trophies.seasons.filter(function (x) { return obj(x) && isTeam(x.team); }).slice(0, 8);
    if (d.league != null && !okLeague(d.league)) d.league = null;
    if (d.league && !(SR.LEAGUES && SR.LEAGUES[d.league.lid])) d.league.lid = 0;
    if (d.tournament && !(SR.CUPS && SR.CUPS[d.tournament.cid])) d.tournament.cid = 0;
    [['leagueMap', SR.LEAGUES], ['cupMap', SR.CUPS]].forEach(function (e) {
      var m = d[e[0]], n = e[1] ? e[1].length : 1;
      if (!obj(m)) m = d[e[0]] = { unlocked: 0, best: [] };
      m.unlocked = Math.min(num(m.unlocked), n - 1);
      m.best = Array.isArray(m.best) ? m.best.slice(0, n).map(function (v) { return num(v); }) : [];
    });
    // Saves from before the maps: a league or cup already won opens tier 2.
    if (d.trophies.league + d.trophies.silver > 0) d.leagueMap.unlocked = Math.max(d.leagueMap.unlocked, 1);
    if (d.trophies.cup > 0) d.cupMap.unlocked = Math.max(d.cupMap.unlocked, 1);
    if (d.tournament != null && !okCup(d.tournament)) d.tournament = null;
    if (d.career != null && !(obj(d.career) && isTeam(d.career.team))) d.career = null;
    if (d.career) d.career.unlocked = Math.min(num(d.career.unlocked), SR.CAREER ? SR.CAREER.length : 1e9);
    var ch = d.challenge;
    ['day', 'tries', 'streak', 'last', 'total', 'best'].forEach(function (k) { ch[k] = num(ch[k]); });
    ch.done = ch.done === true;
    var dl = d.daily;
    dl.streak = num(dl.streak); dl.week = num(dl.week);
    if (dl.last != null && !/^\d{4}-\d{2}-\d{2}$/.test(String(dl.last))) dl.last = null;
    if ('claimed' in def.daily && !Array.isArray(dl.claimed)) dl.claimed = [];
    return d;
  }

  SR.save = {
    data: defaults(),
    load: function () {
      var raw = null;
      try {
        raw = window.localStorage.getItem(KEY);
        if (raw) this.data = clean(merge(defaults(), JSON.parse(raw)));
      } catch (e) {
        // storage blocked: play without saves. A save that can't be read is
        // kept aside first (once), so the next write doesn't erase it for good.
        if (raw) {
          SR.oops('load save', e);
          try { if (!window.localStorage.getItem(KEY + '.unreadable')) window.localStorage.setItem(KEY + '.unreadable', raw); } catch (e2) { /* storage full */ }
        }
        this.data = defaults();
      }
      return this.data;
    },
    write: function () {
      try { window.localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* storage unavailable */ }
    },
    reset: function () {
      customOn = false;
      this.data = defaults();
      this.write();
    }
  };
})();
