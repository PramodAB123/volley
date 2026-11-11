// Trophy art. Every league, every tournament and every special award has its
// own trophy picture (img/trophies/tNN.webp, cut out of the trophy sheet, all
// on the same 288 x 300 canvas with the plinth on the bottom edge so they
// line up on a shelf).
//   SR.trophyImg(kind, i, cls) -> <img> for 'league' | 'cup' | 'special'
//   SR.trophyArt(kind, i)      -> the same, sized for the Stats cabinet
//   SR.SPECIAL_TROPHIES        -> special awards; n(data) says how often won
(function () {
  // Which picture goes with which prize.
  var LEAGUES = [3, 19, 15, 16, 6];        // Rookie laurel, City stadium, National rocks, Pro peaks, Legends star shield
  var CUPS = [21, 12, 1, 20, 5, 14];       // Beach sun, Blossom ring, Desert gold cup, Frost crystals, Neon glass, Champions wings
  var SPECIAL = [7, 17, 8, 11, 2, 18, 4, 13, 9, 10];

  function file(n) { return 'img/trophies/t' + (n < 10 ? '0' : '') + n + '.webp'; }
  function num(kind, i) {
    var list = kind === 'league' ? LEAGUES : kind === 'cup' ? CUPS : SPECIAL;
    return list[i] || list[0];
  }

  SR.trophyFile = function (kind, i) { return file(num(kind, i)); };
  SR.trophyImg = function (kind, i, cls) {
    return '<img class="tr-img ' + (cls || '') + '" src="' + file(num(kind, i)) + '" alt="" draggable="false" decoding="async">';
  };
  SR.trophyArt = function (kind, i) { return SR.trophyImg(kind, i, 'tr-svg'); };

  function all(list) { for (var i = 0; i < list.length; i++) if (!list[i]) return 0; return list.length ? 1 : 0; }
  SR.SPECIAL_TROPHIES = [
    { id: 'crown', name: 'Career Crown', how: 'Win all 21 Career islands', n: function (d) { return d.career && d.career.unlocked >= SR.CAREER.length ? 1 : 0; } },
    { id: 'unbeaten', name: 'Unbeaten Shield', how: 'Win a league without losing a match', n: function (d) { return d.trophies.unbeaten || 0; } },
    { id: 'flame', name: 'Challenge Flame', how: 'Win the daily challenge 7 days in a row', n: function (d) { return d.challenge && (d.challenge.best || 0) >= 7 ? 1 : 0; } },
    { id: 'star', name: 'Rising Star', how: 'Reach level 10', n: function (d) { return d.profile.level >= 10 ? 1 : 0; } },
    { id: 'wins', name: 'Century Trophy', how: 'Win 100 matches', n: function (d) { return d.stats.wins >= 100 ? 1 : 0; } },
    { id: 'streak', name: 'Hot Streak', how: 'Win 10 matches in a row', n: function (d) { return d.stats.best >= 10 ? 1 : 0; } },
    { id: 'kills', name: 'Spike Master', how: 'Score 500 kills', n: function (d) { return d.stats.kills >= 500 ? 1 : 0; } },
    { id: 'aces', name: 'Ace Machine', how: 'Serve 100 aces', n: function (d) { return d.stats.aces >= 100 ? 1 : 0; } },
    { id: 'blocks', name: 'The Wall', how: 'Make 100 blocks', n: function (d) { return d.stats.blocks >= 100 ? 1 : 0; } },
    { id: 'slam', name: 'Grand Slam', how: 'Win every league and every tournament', n: function (d) { return all(d.trophies.lw) && all(d.trophies.cw) ? 1 : 0; } }
  ];
})();
