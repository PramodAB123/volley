// Save and load progress in localStorage. Every access is guarded so the
// game still runs when storage is blocked (private windows, previews).
(function () {
  var KEY = 'spikeRally.v1';

  function defaults() {
    return {
      stars: 0,
      owned: { balls: ['classic'], courts: ['maple'], kits: ['team'] },
      equipped: { ball: 'classic', court: 'maple', kit: 'team' },
      settings: { format: 'standard', difficulty: 'normal', sound: true, team: 'hawks' },
      stats: { matches: 0, wins: 0, points: 0, aces: 0, kills: 0, blocks: 0 },
      // The League screen's trophy cabinet; seasons = last finishes, newest first.
      trophies: { league: 0, unbeaten: 0, silver: 0, bronze: 0, cup: 0, seasons: [] },
      league: null,
      tournament: null,
      career: null,
      daily: { streak: 0, last: null, week: 0 }
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

  SR.save = {
    data: defaults(),
    load: function () {
      try {
        var raw = window.localStorage.getItem(KEY);
        if (raw) this.data = merge(defaults(), JSON.parse(raw));
      } catch (e) { this.data = defaults(); }
      return this.data;
    },
    write: function () {
      try { window.localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* storage unavailable */ }
    },
    reset: function () {
      this.data = defaults();
      this.write();
    }
  };
})();
