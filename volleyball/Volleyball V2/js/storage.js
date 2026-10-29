// Save and load progress. On CrazyGames this uses the SDK data module, so
// progress follows the player's CrazyGames account; elsewhere localStorage.
// Every access is guarded so the game still runs when storage is blocked.
(function () {
  var KEY = 'spikeRally.v1';

  function defaults() {
    return {
      stars: 0,
      owned: { balls: ['classic'], courts: ['maple'], kits: ['team'] },
      equipped: { ball: 'classic', court: 'maple', kit: 'team' },
      settings: { format: 'standard', difficulty: 'normal', sound: true, team: 'hawks', lang: 'auto' },
      stats: { matches: 0, wins: 0, points: 0, aces: 0, kills: 0, blocks: 0 },
      // The League screen's trophy cabinet; seasons = last finishes, newest first.
      trophies: { league: 0, unbeaten: 0, silver: 0, bronze: 0, cup: 0, seasons: [] },
      league: null,
      tournament: null,
      career: null,
      daily: { streak: 0, last: null, week: 0, claimed: [] }
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

  function local() {
    try { return window.localStorage; } catch (e) { return null; }
  }

  function store() { return (SR.cg && SR.cg.storage()) || local(); }

  // First run with the data module: bring over progress saved in this
  // browser before the SDK was added, so returning players keep it.
  function migrate(st) {
    var ls = local();
    if (!ls || st === ls) return;
    try {
      if (st.getItem(KEY) == null) {
        var old = ls.getItem(KEY);
        if (old) st.setItem(KEY, old);
      }
    } catch (e) { /* ignore */ }
  }

  SR.save = {
    data: defaults(),
    load: function () {
      try {
        var st = store();
        migrate(st);
        var raw = st && st.getItem(KEY);
        this.data = raw ? merge(defaults(), JSON.parse(raw)) : defaults();
      } catch (e) { this.data = defaults(); }
      return this.data;
    },
    write: function () {
      try { store().setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* storage unavailable */ }
    },
    reset: function () {
      this.data = defaults();
      this.write();
    }
  };
})();
