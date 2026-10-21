// Match rules: rally scoring, sets, side-out rotation, serve order.
(function () {
  SR.Match = function (teamA, teamB, formatId, cpuBoost) {
    this.format = SR.FORMATS[formatId] || SR.FORMATS.standard;
    this.teams = [teamA, teamB];
    // Effective ratings: the CPU side (index 1) gets the difficulty boost.
    this.ratings = [Object.assign({}, teamA.r), {}];
    var rb = this.ratings[1];
    Object.keys(teamB.r).forEach(function (k) { rb[k] = Math.max(35, Math.min(99, teamB.r[k] + (cpuBoost || 0))); });
    this.score = [0, 0];
    this.sets = [0, 0];
    this.setNo = 1;
    this.history = [];
    this.rot = [0, 0];
    this.server = Math.random() < 0.5 ? 0 : 1;
    this.firstServer = this.server;
    this.stats = [
      { aces: 0, kills: 0, blocks: 0, errors: 0 },
      { aces: 0, kills: 0, blocks: 0, errors: 0 }
    ];
    this.over = false;
    this.winner = -1;
  };

  SR.Match.prototype.setsToWin = function () {
    return Math.ceil(this.format.sets / 2);
  };

  SR.Match.prototype.target = function () {
    var f = this.format;
    return (f.sets > 1 && this.setNo === f.sets) ? f.last : f.points;
  };

  // Court position (1-6) of player idx on a team.
  SR.Match.prototype.posOf = function (team, idx) {
    return ((idx - this.rot[team]) % 6 + 6) % 6 + 1;
  };

  SR.Match.prototype.playerAt = function (team, pos) {
    for (var i = 0; i < 6; i++) if (this.posOf(team, i) === pos) return i;
    return 0;
  };

  // Award a rally. Returns what happened so the game can react.
  SR.Match.prototype.point = function (team) {
    var res = { sideOut: false, setOver: false, matchOver: false, setWinner: -1 };
    this.score[team]++;
    if (team !== this.server) {
      this.rot[team] = (this.rot[team] + 1) % 6;
      this.server = team;
      res.sideOut = true;
    }
    var a = this.score[team], b = this.score[1 - team];
    if (a >= this.target() && a - b >= 2) {
      res.setOver = true;
      res.setWinner = team;
      this.sets[team]++;
      this.history.push(this.score.slice());
      if (this.sets[team] >= this.setsToWin()) {
        res.matchOver = true;
        this.over = true;
        this.winner = team;
      } else {
        this.setNo++;
        this.score = [0, 0];
        // Serve alternates each set.
        this.server = (this.setNo % 2 === 1) ? this.firstServer : 1 - this.firstServer;
      }
    }
    return res;
  };

  // Quick off-screen result for CPU vs CPU fixtures in league and tournament.
  SR.simMatch = function (teamA, teamB, formatId) {
    var f = SR.FORMATS[formatId] || SR.FORMATS.standard, need = Math.ceil(f.sets / 2);
    var pa = SR.teamPower(teamA), pb = SR.teamPower(teamB);
    var pRally = 0.5 + (pa - pb) * 0.012;
    var sets = [0, 0], scores = [];
    var setNo = 1;
    while (sets[0] < need && sets[1] < need) {
      var tgt = (f.sets > 1 && setNo === f.sets) ? f.last : f.points, s = [0, 0];
      while (!((s[0] >= tgt || s[1] >= tgt) && Math.abs(s[0] - s[1]) >= 2)) s[Math.random() < pRally ? 0 : 1]++;
      sets[s[0] > s[1] ? 0 : 1]++;
      scores.push(s);
      setNo++;
    }
    return { winner: sets[0] > sets[1] ? 0 : 1, sets: sets, scores: scores };
  };
})();
