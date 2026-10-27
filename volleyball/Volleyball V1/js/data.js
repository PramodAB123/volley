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

// Running stride: half the distance a foot travels per step at a given speed
// (m/s). The gait's phase advances so a planted foot never slides.
SR.strideFor = function (speed) { return Math.max(0.12, Math.min(0.42, 0.1 + 0.055 * speed)); };

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
    { id: 'night', name: 'Night',  price: 8, floor: '#1b1530', court: '#2b2150', zone: '#352866', line: '#53f3ff', wall: '#09060f', seat: '#6b3fd1', riser: '#120c22', glow: true },
    // Themed courts with floor art (motifs in render.js).
    { id: 'galaxy', name: 'Galaxy',       price: 10, motif: 'galaxy', floor: '#05040f', court: '#1a1446', zone: '#221a5c', line: '#c7b8ff', wall: '#020108', seat: '#7c5cff', riser: '#0a0820', accent: '#ff4fd8', glow: true },
    { id: 'lava',   name: 'Lava Pit',     price: 12, motif: 'lava',   floor: '#1a0a06', court: '#3a1a12', zone: '#4a2016', line: '#ffb347', wall: '#0c0402', seat: '#ff5a1f', riser: '#200c06', accent: '#ff5a1f', glow: true },
    { id: 'candy',  name: 'Candy Land',   price: 15, motif: 'candy',  floor: '#ffc2e0', court: '#7cc6f5', zone: '#6ab8ea', line: '#ffffff', wall: '#3a1030', seat: '#ff5fa2', riser: '#2a0c22', accent: '#ff5fa2' },
    { id: 'arcade', name: 'Retro Arcade', price: 20, motif: 'pixels', floor: '#101018', court: '#24245a', zone: '#2c2c70', line: '#7dff6b', wall: '#05050a', seat: '#ff4d6d', riser: '#0c0c18', accent: '#ffd23f', glow: true }
  ]
};

// League and tournament venues: every team has a home arena with its own
// floor art (motif, drawn in render.js) and colours. League rounds are played
// at the opponent's arena and the last round at yours; the tournament final
// is at Champions Court. Quick matches use the court equipped in the Shop.
SR.ARENAS = {
  hawks:   { id: 'a-hawks',   name: 'Harbor Dome',     motif: 'waves',    floor: '#123a5c', court: '#2a6fb5', zone: '#245f9c', line: '#ffffff', wall: '#06121f', seat: '#2f6fe0', riser: '#0a1a2c', accent: '#8fd3ff' },
  lions:   { id: 'a-lions',   name: 'Copper Den',      motif: 'sunburst', floor: '#5a2e12', court: '#d9822b', zone: '#c46f1f', line: '#fff4e0', wall: '#1f1006', seat: '#d9822b', riser: '#2a1608', accent: '#ffcf7a' },
  wolves:  { id: 'a-wolves',  name: 'Frost Arena',     motif: 'frost',    floor: '#b9d3e6', court: '#5e95c4', zone: '#5389b8', line: '#ffffff', wall: '#0d1a2b', seat: '#9fb7cf', riser: '#162638', accent: '#ffffff' },
  rays:    { id: 'a-rays',    name: 'Sunset Beach',    motif: 'sunset',   floor: '#2f8796', court: '#e2b66c', zone: '#d6a65a', line: '#ffffff', wall: '#2a0f2e', seat: '#e5484d', riser: '#2b1230', accent: '#ff8a5c' },
  owls:    { id: 'a-owls',    name: 'Moonlight Hall',  motif: 'stars',    floor: '#1c1438', court: '#4b3a8c', zone: '#55449c', line: '#f1ecff', wall: '#07051a', seat: '#7c5cd6', riser: '#120c26', accent: '#fff3b0', glow: true },
  sharks:  { id: 'a-sharks',  name: 'Coral Reef',      motif: 'reef',     floor: '#0b5a63', court: '#12a594', zone: '#0f9283', line: '#e6fffb', wall: '#03242a', seat: '#ff7f6b', riser: '#06353b', accent: '#ff9e80' },
  falcons: { id: 'a-falcons', name: 'Storm Hangar',    motif: 'storm',    floor: '#2a2c33', court: '#3d4048', zone: '#474b55', line: '#ffd23f', wall: '#0b0c10', seat: '#e0b100', riser: '#17181d', accent: '#ffd23f' },
  tigers:  { id: 'a-tigers',  name: 'Jade Temple',     motif: 'stripes',  floor: '#0f3d26', court: '#2f9e44', zone: '#278a3b', line: '#fffbe6', wall: '#06180f', seat: '#e0a800', riser: '#0b2617', accent: '#ffd75e' },
  // Free courts to pick on the Quick match screen (SR.QUICK_COURTS).
  neon:    { id: 'q-neon',    name: 'Neon Grid',       motif: 'grid',     floor: '#0a0620', court: '#140b3a', zone: '#1b1050', line: '#ff3bd4', wall: '#04020c', seat: '#ff3bd4', riser: '#0c0620', accent: '#3bf0ff', glow: true },
  blossom: { id: 'q-blossom', name: 'Cherry Blossom',  motif: 'petals',   floor: '#4a2e26', court: '#e89bb0', zone: '#de8ba2', line: '#ffffff', wall: '#1e0f14', seat: '#ff8fb1', riser: '#2a1612', accent: '#ffc9d8' },
  dunes:   { id: 'q-dunes',   name: 'Desert Dunes',    motif: 'dunes',    floor: '#c98a4b', court: '#d9a25e', zone: '#cd9350', line: '#ffffff', wall: '#2a1408', seat: '#e07a2e', riser: '#3a1e0c', accent: '#8a4a1c' },
  street:  { id: 'q-street',  name: 'Street Park',     motif: 'street',   floor: '#3a3f47', court: '#3f7fbf', zone: '#3570aa', line: '#ffffff', wall: '#0e1116', seat: '#ffd23f', riser: '#1a1d22', accent: '#ffd23f' },
  final:   { id: 'a-final',   name: 'Champions Court', motif: 'gold',     floor: '#0d1633', court: '#1c2f6b', zone: '#22397f', line: '#ffd75e', wall: '#04081a', seat: '#e0a800', riser: '#0a1230', accent: '#ffd75e', glow: true }
};

SR.QUICK_COURTS = ['neon', 'blossom', 'dunes', 'street'];

// A court by id: a venue arena (SR.ARENAS key) or a Shop court. Online matches
// send this id so the friend sees the court the host picked.
SR.courtById = function (id) {
  return (id && (SR.ARENAS[id] || SR.SHOP.courts.find(function (c) { return c.id === id; }))) || null;
};

SR.STARS = { quickWin: 1, leagueWin: 1, leagueTitle: 3, cupWin: 1, cupTitle: 5, careerStage: 2, careerFinal: 5 };

// Career: every court in the game, one after another. Each stage is a court
// (an arena or a Shop court) and the team that plays there; beating them
// unlocks the next court. Arenas are defended by their home team. Opponents
// and difficulty get tougher along the way; Champions Court is the last stage.
SR.CAREER = [
  { court: 'maple',   opp: 'tigers',  diff: 'easy' },
  { court: 'ocean',   opp: 'falcons', diff: 'easy' },
  { court: 'clay',    opp: 'sharks',  diff: 'easy' },
  { court: 'street',  opp: 'tigers',  diff: 'normal' },
  { court: 'dunes',   opp: 'falcons', diff: 'normal' },
  { court: 'blossom', opp: 'sharks',  diff: 'normal' },
  { court: 'tigers',  opp: 'tigers',  diff: 'normal' },
  { court: 'falcons', opp: 'falcons', diff: 'normal' },
  { court: 'sharks',  opp: 'sharks',  diff: 'normal' },
  { court: 'night',   opp: 'owls',    diff: 'normal' },
  { court: 'neon',    opp: 'rays',    diff: 'normal' },
  { court: 'owls',    opp: 'owls',    diff: 'normal' },
  { court: 'rays',    opp: 'rays',    diff: 'normal' },
  { court: 'candy',   opp: 'wolves',  diff: 'normal' },
  { court: 'wolves',  opp: 'wolves',  diff: 'hard' },
  { court: 'galaxy',  opp: 'lions',   diff: 'hard' },
  { court: 'lions',   opp: 'lions',   diff: 'hard' },
  { court: 'lava',    opp: 'hawks',   diff: 'hard' },
  { court: 'hawks',   opp: 'hawks',   diff: 'hard' },
  { court: 'arcade',  opp: 'lions',   diff: 'hard' },
  { court: 'final',   opp: 'hawks',   diff: 'hard' }
];

// Every Career court sits on its own island. A new career deals out fresh
// names from these lists (first word + second word); the last island gets a
// grand one.
SR.ISLE_NAMES = {
  first: ['Coconut', 'Coral', 'Mango', 'Thunder', 'Seashell', 'Palm', 'Turtle', 'Volcano', 'Sunny', 'Pearl', 'Pirate', 'Breezy',
    'Starfish', 'Dolphin', 'Crystal', 'Tiki', 'Banana', 'Lighthouse', 'Hibiscus', 'Driftwood', 'Kraken', 'Moonlit', 'Sapphire',
    'Pineapple', 'Seagull', 'Treasure', 'Whale', 'Papaya', 'Sandy', 'Bamboo', 'Flamingo', 'Parrot', 'Sunset', 'Skull', 'Mermaid'],
  second: ['Isle', 'Island', 'Cay', 'Key', 'Atoll', 'Reef', 'Cove', 'Bay', 'Point', 'Rock', 'Shores', 'Lagoon', 'Peak', 'Harbor', 'Sands'],
  final: ['Golden Crown Atoll', 'Champions Isle', 'Royal Trophy Island', 'Grand Spike Atoll', 'Victory Peak Isle']
};
