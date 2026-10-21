// Static game data: court constants, teams, shop items, match formats.
window.SR = window.SR || {};
// Touch-first devices get tap wording and no keyboard hints.
SR.touch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

SR.COURT = {
  L: 18,        // court length (m)
  W: 9,         // court width (m)
  NET_X: 9,     // net position along length
  NET_H: 2.43,  // men's net height
  ATTACK: 3,    // attack line distance from net
  G: 9.8
};

// Roles in rotation order: index i starts in position i + 1.
SR.ROLES = ['S', 'OH', 'MB', 'OP', 'OH', 'MB'];
SR.NUMBERS = [3, 7, 12, 9, 14, 5];
SR.ROLE_TAGS = ['S', 'OH1', 'MB1', 'OP', 'OH2', 'MB2'];
SR.ROLE_COLORS = { S: '#ff6b6b', OH: '#7cc4ff', MB: '#4ee6d8', OP: '#f4f4f4' };

// Fictional teams. Ratings are 0-100.
SR.TEAMS = [
  { id: 'hawks',   name: 'Harbor Hawks',   short: 'HAW', color: '#2f6fe0', trim: '#ffffff', pattern: 'stripes', r: { serve: 78, pass: 80, attack: 82, block: 74, speed: 78 } },
  { id: 'lions',   name: 'Copper Lions',   short: 'LIO', color: '#d9822b', trim: '#2a1a08', pattern: 'hoops', r: { serve: 82, pass: 72, attack: 86, block: 76, speed: 72 } },
  { id: 'wolves',  name: 'North Wolves',   short: 'WOL', color: '#607086', trim: '#e9eef5', pattern: 'split', r: { serve: 72, pass: 84, attack: 76, block: 80, speed: 80 } },
  { id: 'rays',    name: 'Sunset Rays',    short: 'RAY', color: '#e5484d', trim: '#ffe4e4', pattern: 'stripes', r: { serve: 76, pass: 76, attack: 80, block: 70, speed: 84 } },
  { id: 'owls',    name: 'Iron Owls',      short: 'OWL', color: '#7c5cd6', trim: '#f1ecff', pattern: 'hoops', r: { serve: 70, pass: 78, attack: 74, block: 86, speed: 70 } },
  { id: 'sharks',  name: 'Coral Sharks',   short: 'SHA', color: '#12a594', trim: '#e6fffb', pattern: 'split', r: { serve: 74, pass: 70, attack: 78, block: 72, speed: 76 } },
  { id: 'falcons', name: 'Storm Falcons',  short: 'FAL', color: '#e0b100', trim: '#2b2300', pattern: 'stripes', r: { serve: 68, pass: 74, attack: 72, block: 70, speed: 82 } },
  { id: 'tigers',  name: 'Jade Tigers',    short: 'TIG', color: '#2f9e44', trim: '#eaffee', pattern: 'hoops', r: { serve: 66, pass: 68, attack: 70, block: 68, speed: 74 } }
];

SR.teamById = function (id) {
  return SR.TEAMS.find(function (t) { return t.id === id; }) || SR.TEAMS[0];
};

SR.teamPower = function (t) {
  var r = t.r;
  return (r.serve + r.pass + r.attack * 1.3 + r.block + r.speed) / 5.3;
};

SR.FORMATS = {
  short:    { label: 'Short (1 set to 15)',          sets: 1, points: 15, last: 15 },
  standard: { label: 'Standard (best of 3 to 15)',   sets: 3, points: 15, last: 15 },
  full:     { label: 'Full (best of 5 to 25)',       sets: 5, points: 25, last: 15 }
};

// Custom match rules: points per set and number of sets, stored as ids like
// 'p11s3'. Every set, including a deciding one, is played to the same score.
SR.POINT_OPTIONS = [5, 11, 15];
SR.SET_OPTIONS = [1, 3, 5];
SR.formatId = function (points, sets) { return 'p' + points + 's' + sets; };
SR.formatOf = function (id) {
  if (SR.FORMATS[id]) return SR.FORMATS[id];
  var m = /^p(\d+)s(\d)$/.exec(id || '');
  if (!m) return SR.FORMATS.standard;
  var points = +m[1], sets = +m[2];
  if (SR.POINT_OPTIONS.indexOf(points) < 0 || SR.SET_OPTIONS.indexOf(sets) < 0) return SR.FORMATS.standard;
  return { sets: sets, points: points, last: points,
    label: (sets === 1 ? '1 set to ' + points : 'Best of ' + sets + ', sets to ' + points) };
};

// Added to every CPU rating.
SR.DIFFICULTY = {
  easy:   { label: 'Easy',   boost: -14 },
  normal: { label: 'Normal', boost: 0 },
  hard:   { label: 'Hard',   boost: 10 }
};

SR.SHOP = {
  balls: [
    { id: 'classic', name: 'Classic',  price: 0, main: '#f4d03f', stripe: '#2453a6' },
    { id: 'sunset',  name: 'Sunset',   price: 3, main: '#ff8a3d', stripe: '#ffffff' },
    { id: 'neon',    name: 'Neon',     price: 5, main: '#b6ff3b', stripe: '#ff3bb0' },
    { id: 'mono',    name: 'Mono',     price: 8, main: '#f5f5f5', stripe: '#1d1d1d' }
  ],
  courts: [
    { id: 'maple', name: 'Arena',  price: 0, floor: '#2e7a4f', court: '#f28a3a', zone: '#ec7c2b', line: '#ffffff', wall: '#10261b', seat: '#ef7d2d', riser: '#173324' },
    { id: 'ocean', name: 'Ocean',  price: 3, floor: '#2d7a5a', court: '#2f6fa8', zone: '#285f94', line: '#ffffff', wall: '#0e1f33', seat: '#2f6fa8', riser: '#101c2c' },
    { id: 'clay',  name: 'Clay',   price: 5, floor: '#3f5d3a', court: '#b5583a', zone: '#a24b30', line: '#fff3e6', wall: '#2a160e', seat: '#b5583a', riser: '#26150e' },
    { id: 'night', name: 'Night',  price: 8, floor: '#1b1530', court: '#2b2150', zone: '#352866', line: '#53f3ff', wall: '#09060f', seat: '#6b3fd1', riser: '#120c22', glow: true }
  ]
};

SR.STARS = { quickWin: 1, leagueWin: 1, leagueTitle: 3, cupWin: 1, cupTitle: 5 };
