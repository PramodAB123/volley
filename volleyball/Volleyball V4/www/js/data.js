// Static game data: court constants, teams, shop items, match formats.
window.SR = window.SR || {};
// A recovered error: the game keeps running, but it is still logged (once
// per message) so it shows up in the console and in error reports.
SR.oops = (function () {
  var seen = {};
  return function (where, e) {
    var msg = where + ': ' + (e && (e.stack || e.message) || e);
    if (seen[msg] || !window.console) return;
    seen[msg] = 1;
    console.error(msg);
  };
})();
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
  if (id === 'custom') { var c = SR.customTeam(); if (c) return c; }
  return SR.TEAMS.find(function (t) { return t.id === id; }) || SR.TEAMS[0];
};

// Custom team (js/custom.js): your own club, unlocked once for stars. Its
// id is 'custom'; it is never in SR.TEAMS, so it is never an opponent.
// Skill points: every rating starts at `min`, `total` is shared out between
// the five, none above `max`. The default (78 each) matches a top club.
SR.CUSTOM = {
  price: 40,
  min: 60, max: 90, total: 390, step: 2,
  stats: [['attack', 'Attack'], ['block', 'Block'], ['pass', 'Pass'], ['serve', 'Serve'], ['speed', 'Speed']],
  colors: ['#e5484d', '#ff6b35', '#f5a524', '#e0b100', '#7cc142', '#2f9e44', '#12a594', '#1fb6d6', '#2f6fe0', '#3b3fbf', '#7c5cd6', '#d9468f', '#607086', '#1f2633', '#f4f4f4'],
  trims: ['#ffffff', '#111827', '#ffd23f', '#ff6b35', '#e5484d', '#7cc4ff', '#3bf0a0'],
  patterns: [['stripes', 'Stripes'], ['hoops', 'Hoops'], ['split', 'Half']],
  // Team level (bought with coins): each level adds `perLevel` skill points
  // to share out and lets every skill go one point higher (max + level).
  levels: 10, perLevel: 5,
  upgradeCost: function (lvl) { return 300 + 200 * lvl; },
  base: { unlocked: false, lvl: 0, name: 'My Club', short: 'MYC', color: '#ff6b35', trim: '#ffffff', pattern: 'stripes', r: { attack: 78, block: 78, pass: 78, serve: 78, speed: 78 } }
};
// Names are shown inside menus, so only letters, digits, spaces and a few
// marks are kept. Short codes are 2-3 capital letters or digits.
// The Unicode letter class (\p{L}) is built at run time: written as a regex
// literal it is a syntax error on Android System WebView older than Chrome 64,
// which stopped this whole file (and so the game) from loading.
var NAME_JUNK = (function () {
  try { return new RegExp("[^\\p{L}\\p{N} .'\\-]", 'gu'); } catch (e) {
    return /[^A-Za-z0-9\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u0590-\u06FF\u0900-\u0DFF\u0E00-\u0E7F\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF .'\-]/g;
  }
})();
SR.customName = function (v) {
  return typeof v === 'string' ? v.replace(/<[^>]*>/g, '').replace(NAME_JUNK, '').replace(/\s+/g, ' ').trim().slice(0, 18).replace(/'/g, '\u2019') : '';
};
// The player's name (asked on first launch): same rules, up to 16 characters.
SR.playerName = function (v) {
  return typeof v === 'string' ? v.replace(/<[^>]*>/g, '').replace(NAME_JUNK, '').replace(/\s+/g, ' ').trim().slice(0, 16).replace(/'/g, '\u2019') : '';
};
SR.customShort = function (v) {
  if (typeof v !== 'string') return '';
  var s = v.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s.length >= 2 ? s.slice(0, 3) : '';
};
SR.customCaps = function (lvl) {
  var C = SR.CUSTOM, l = Math.max(0, Math.min(C.levels, Math.floor(Number(lvl) || 0)));
  return { lvl: l, max: C.max + l, total: C.total + l * C.perLevel };
};
SR.customTeam = function () {
  var c = SR.save && SR.save.data && SR.save.data.custom;
  if (!c || !c.unlocked) return null;
  return { id: 'custom', custom: true, name: c.name, short: c.short, color: c.color, trim: c.trim, pattern: c.pattern, r: Object.assign({}, c.r) };
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
  hard:   { label: 'Hard',   boost: 10 },
  // League and Tournament tiers only (not offered in Settings).
  pro:    { label: 'Pro',    boost: 5,  hidden: true },
  legend: { label: 'Legend', boost: 15, hidden: true }
};

SR.SHOP = {
  balls: [
    { id: 'classic', name: 'Classic',  price: 0, main: '#f4d03f', stripe: '#2453a6' },
    { id: 'sunset',  name: 'Sunset',   price: 18, main: '#ff8a3d', stripe: '#ffffff' },
    { id: 'neon',    name: 'Neon',     price: 30, main: '#b6ff3b', stripe: '#ff3bb0' },
    { id: 'mono',    name: 'Mono',     price: 48, main: '#f5f5f5', stripe: '#1d1d1d' },
    // Bought with coins (earned in every match) instead of diamonds.
    { id: 'aqua',    name: 'Aqua',     coins: 600, main: '#5ee7ff', stripe: '#1452a8' },
    { id: 'berry',   name: 'Berry',    coins: 900, main: '#d9468f', stripe: '#ffe14d' },
    { id: 'lime',    name: 'Lime',     coins: 1200, main: '#c6ff3b', stripe: '#1d6b2a' },
    // Daily reward balls: not for sale, only won on the reward calendar.
    { id: 'ember',   name: 'Ember',    daily: true, main: '#ff4d2e', stripe: '#ffd23f' },
    { id: 'frost',   name: 'Frost',    daily: true, main: '#c8ecff', stripe: '#2f6fe0' },
    { id: 'jungle',  name: 'Jungle',   daily: true, main: '#2f9e44', stripe: '#f4d03f' },
    { id: 'golden',  name: 'Golden',   daily: true, main: '#ffcf3a', stripe: '#b07a00' },
    { id: 'cosmic',  name: 'Cosmic',   daily: true, main: '#3a1f8f', stripe: '#ff4fd8' }
  ],
  // Jerseys your team wears in offline matches. 'team' keeps the club's own kit;
  // the rest come from the daily reward calendar.
  kits: [
    { id: 'team',     name: 'Club kit', price: 0 },
    { id: 'flame',    name: 'Flame',    daily: true, color: '#ff5a1f', trim: '#ffd23f', pattern: 'stripes' },
    { id: 'ice',      name: 'Ice',      daily: true, color: '#7fd4ff', trim: '#ffffff', pattern: 'hoops' },
    { id: 'midnight', name: 'Midnight', daily: true, color: '#1d1f33', trim: '#53f3ff', pattern: 'split' },
    { id: 'champion', name: 'Champion', daily: true, color: '#e0a800', trim: '#ffffff', pattern: 'stripes' },
    { id: 'royal',    name: 'Royal',    daily: true, color: '#5b2bd6', trim: '#ffd75e', pattern: 'hoops' },
    // Bought with coins.
    { id: 'ocean',    name: 'Ocean',    coins: 800, color: '#1fb6d6', trim: '#ffffff', pattern: 'hoops' },
    { id: 'forest',   name: 'Forest',   coins: 1100, color: '#1f6b3a', trim: '#c6ff3b', pattern: 'stripes' },
    { id: 'sunrise',  name: 'Sunrise',  coins: 1400, color: '#ff8a3d', trim: '#2a1a08', pattern: 'split' },
    { id: 'shadow',   name: 'Shadow',   coins: 1800, color: '#1f2633', trim: '#ff3bd4', pattern: 'stripes' }
  ],
  courts: [
    { id: 'maple', name: 'Arena',  price: 0, floor: '#2e7a4f', court: '#f28a3a', zone: '#ec7c2b', line: '#ffffff', wall: '#10261b', seat: '#ef7d2d', riser: '#173324' },
    { id: 'ocean', name: 'Ocean',  price: 18, floor: '#2d7a5a', court: '#2f6fa8', zone: '#285f94', line: '#ffffff', wall: '#0e1f33', seat: '#2f6fa8', riser: '#101c2c' },
    { id: 'clay',  name: 'Clay',   price: 30, floor: '#3f5d3a', court: '#b5583a', zone: '#a24b30', line: '#fff3e6', wall: '#2a160e', seat: '#b5583a', riser: '#26150e' },
    { id: 'night', name: 'Night',  price: 48, floor: '#1b1530', court: '#2b2150', zone: '#352866', line: '#53f3ff', wall: '#09060f', seat: '#6b3fd1', riser: '#120c22', glow: true },
    // Themed courts with floor art (motifs in render.js).
    { id: 'galaxy', name: 'Galaxy',       price: 60, motif: 'galaxy', floor: '#05040f', court: '#1a1446', zone: '#221a5c', line: '#c7b8ff', wall: '#020108', seat: '#7c5cff', riser: '#0a0820', accent: '#ff4fd8', glow: true },
    { id: 'lava',   name: 'Lava Pit',     price: 72, motif: 'lava',   floor: '#1a0a06', court: '#3a1a12', zone: '#4a2016', line: '#ffb347', wall: '#0c0402', seat: '#ff5a1f', riser: '#200c06', accent: '#ff5a1f', glow: true },
    { id: 'candy',  name: 'Candy Land',   price: 90, motif: 'candy',  floor: '#ffc2e0', court: '#7cc6f5', zone: '#6ab8ea', line: '#ffffff', wall: '#3a1030', seat: '#ff5fa2', riser: '#2a0c22', accent: '#ff5fa2' },
    { id: 'arcade', name: 'Retro Arcade', price: 120, motif: 'pixels', floor: '#101018', court: '#24245a', zone: '#2c2c70', line: '#7dff6b', wall: '#05050a', seat: '#ff4d6d', riser: '#0c0c18', accent: '#ffd23f', glow: true }
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

// Daily reward calendar (js/daily.js): one gift per calendar day, seven days a
// week. Day 3 gives a ball, day 5 a jersey and day 7 a chest of stars plus a
// legendary item. Each week moves on to the next items in the lists; an item
// you already own is paid out in stars instead.
SR.DAILY = {
  days: [{ stars: 3 }, { stars: 5 }, { item: 'ball' }, { stars: 8 }, { item: 'kit' }, { stars: 10 }, { stars: 25, item: 'legend' }],
  balls: ['ember', 'frost', 'jungle'],
  kits: ['flame', 'ice', 'midnight'],
  legends: [['balls', 'golden'], ['kits', 'champion'], ['balls', 'cosmic'], ['kits', 'royal']],
  owned: { ball: 6, kit: 8, legend: 15 },
  // Coins on top of each day's gift.
  coins: [50, 75, 100, 125, 150, 200, 500]
};

// The team you control, dressed in the jersey equipped in the Shop. Keeps the
// club kit when the jersey would look like the opponent's colours.
SR.kitTeam = function (t, opp) {
  var id = SR.save && SR.save.data.equipped.kit;
  var k = SR.SHOP.kits.find(function (x) { return x.id === id; });
  if (!k || !k.color || t.custom) return t; // a custom team wears its own colours
  if (opp && SR.colorGap(k.color, opp.color) < 90) return t;
  return Object.assign({}, t, { color: k.color, trim: k.trim, pattern: k.pattern });
};
SR.colorGap = function (a, b) {
  var p = function (h, i) { return parseInt(h.slice(1 + i * 2, 3 + i * 2), 16); };
  return Math.sqrt([0, 1, 2].reduce(function (s, i) { var d = p(a, i) - p(b, i); return s + d * d; }, 0));
};

// Daily challenge (js/challenge.js): one match a day with a goal on top of
// winning. Difficulty follows the weekday (week[0] = Sunday); n = the number
// the goal needs at each difficulty (a goal without n only uses diffs);
// one = the wording when n is 1.
// Win challenges on days in a row: every 7th day adds streakBonus stars.
SR.CHALLENGE = {
  week: ['hard', 'easy', 'normal', 'normal', 'easy', 'normal', 'hard'],
  stars: { easy: 4, normal: 6, hard: 10 },
  streakBonus: 10,
  format: 'p15s1',
  courts: ['maple', 'ocean', 'clay', 'street', 'dunes', 'blossom', 'tigers', 'falcons', 'sharks', 'night', 'neon', 'owls', 'rays', 'candy', 'wolves', 'hawks', 'lions', 'final'],
  goals: [
    { id: 'win',    text: 'Win the match', diffs: ['normal', 'hard'] },
    { id: 'kills',  text: 'Win with {n}+ kills', n: { easy: 9, normal: 8, hard: 7 } },
    { id: 'aces',   text: 'Win with {n}+ aces', one: 'Serve an ace and win', n: { easy: 2, normal: 1 } },
    { id: 'blocks', text: 'Win with {n}+ blocks', one: 'Make a block and win', n: { easy: 2, normal: 2, hard: 1 } },
    { id: 'errors', text: 'Win with {n} errors or fewer', n: { easy: 1, normal: 2, hard: 3 } },
    { id: 'hold',   text: 'Win and keep the rival under {n} points', n: { easy: 8, normal: 10, hard: 13 } },
    { id: 'clean',  text: 'Win 2-0 without losing a set', format: 'p11s3', diffs: ['easy', 'normal', 'hard'] }
  ]
};

// Currencies. Diamonds (stored as `stars`, the old name, so saves carry
// over) buy balls, courts and the custom team. Coins come from every match
// and buy coin items, team upgrades and diamonds.
SR.GEM = '<i class="gem" aria-hidden="true"></i>';
SR.COIN = '<i class="coin" aria-hidden="true"></i>';
SR.gems = function (n) { return '<span class="cur cur-gem">' + SR.GEM + '<b>' + n + '</b></span>'; };
SR.coinsHtml = function (n) { return '<span class="cur cur-coin">' + SR.COIN + '<b>' + SR.fmtNum(n) + '</b></span>'; };
SR.fmtNum = function (n) { n = Math.floor(Number(n) || 0); return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
// Coins for a match: something for playing, more for winning and for big plays.
SR.COINS = { play: 15, win: 35, kill: 1, ace: 3, block: 2, mode: 10, leagueTitle: 150, cupTitle: 200, challenge: 60, island: 30,
  exchange: [{ gems: 1, coins: 500 }, { gems: 5, coins: 2200 }, { gems: 12, coins: 4800 }] };
// Player level: XP from every match; need(L) XP to go from level L to L+1.
SR.XP = {
  play: 25, win: 35, kill: 2, ace: 4, block: 3, mode: 10,
  need: function (l) { return 100 + 40 * (l - 1); },
  // Reward for reaching level l.
  reward: function (l) { return { gems: l % 5 === 0 ? 5 : 2, coins: 100 + 20 * l }; }
};
SR.AVATARS = [
  { id: 'a1', skin: '#f2c7a5', hair: '#2b1d14', style: 'spiky', bg: ['#ff8a3d', '#d9468f'], band: '#ffd23f' },
  { id: 'a2', skin: '#c68a5c', hair: '#111827', style: 'afro', bg: ['#2f6fe0', '#12a594'], band: '#ffffff' },
  { id: 'a3', skin: '#f6d2b8', hair: '#e0a800', style: 'ponytail', bg: ['#7c5cd6', '#2f6fe0'], band: '#ff6b6b' },
  { id: 'a4', skin: '#8d5a3b', hair: '#1b1410', style: 'buzz', bg: ['#2f9e44', '#1fb6d6'], band: '#ff8a3d' },
  { id: 'a5', skin: '#efc19b', hair: '#b4412c', style: 'swoop', bg: ['#e5484d', '#ff8a3d'], band: '#7cc4ff' },
  { id: 'a6', skin: '#d9a77c', hair: '#3a2a6b', style: 'bun', bg: ['#d9468f', '#7c5cd6'], band: '#3bf0a0' }
];

// Skill packs (js/skills.js): bought once in the Shop, then switched on in
// one of your skill slots (2 to start, a 3rd for `slotPrice` diamonds). They
// only help the team you control in offline matches against the CPU, never the CPU, and the
// tutorial plays without them. Effects are applied in rally.js (R.skill).
SR.SKILLS = {
  slots: 2, maxSlots: 3, slotPrice: 60,
  // Win `smashStreak` points in a row to charge your special smash.
  smashStreak: 3,
  list: [
    { id: 'ace',     name: 'Ace Serve',     coins: 1000, color: '#38b6ff', text: 'Serves land closer to your aim, with half the serve faults.' },
    { id: 'power',   name: 'Power Spike',   coins: 1400, color: '#ff6b35', text: 'Harder, faster spikes that are tougher to dig.' },
    { id: 'feet',    name: 'Quick Feet',    coins: 1800, color: '#3bf0a0', text: 'Your players run faster and dive farther to save more balls.' },
    { id: 'wall',    name: 'Iron Wall',     price: 42,   color: '#9fb7cf', text: 'More blocks, and more of them are stuff blocks.' },
    { id: 'set',     name: 'Perfect Set',   price: 54,   color: '#ffd23f', text: 'Better passes and sets, and fewer spike errors.' },
    // Special smashes: only one can be on. Win `smashStreak` points in a row
    // to charge it; your next spike is that smash (elem = its look in fx.js).
    { id: 'fire',    name: 'Fire Smash',          price: 60, color: '#ff5a1f', special: true, elem: 'fire',    text: 'A blazing spike that burns through blocks: they can only slow it down.' },
    { id: 'water',   name: 'Water Splash Smash',  price: 66, color: '#2fa8ff', special: true, elem: 'water',   text: 'A tidal spike that soaks the floor. Defenders slip and their digs fly wild.' },
    { id: 'ice',     name: 'Ice Smash',           price: 72, color: '#9fe0ff', special: true, elem: 'ice',     text: 'A frozen spike that freezes the defence for a moment, so they react late.' },
    { id: 'wind',    name: 'Wind Smash',          price: 78, color: '#3bf0a0', special: true, elem: 'wind',    text: 'A cyclone spike that swerves away from defenders into open floor.' },
    { id: 'thunder', name: 'Thunder Smash',       price: 90, color: '#7c5cff', special: true, elem: 'thunder', text: 'The fastest spike in the game. Lightning carries it over every block.' }
  ]
};
SR.skillById = function (id) { return SR.SKILLS.list.find(function (k) { return k.id === id; }) || null; };

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

// Leagues: five tiers on a mountain climb (League map). Finish in the top two
// (promotion) to unlock the next league. teams = clubs in the table (one
// round per opponent); win / title = stars for a match win and the title;
// finale = court for the last round (null: your home court).
SR.LEAGUE_PROMOTE = 2;
SR.LEAGUES = [
  { id: 'rookie',   name: 'Rookie League',   place: 'Green Valley',        diff: 'easy',   teams: 6, win: 1, title: 3,  color: '#3fb950', finale: null },
  { id: 'city',     name: 'City League',     place: 'Metro Heights',       diff: 'normal', teams: 6, win: 1, title: 4,  color: '#2f8fe0', finale: null },
  { id: 'national', name: 'National League', place: 'Stone Ridge',         diff: 'normal', teams: 8, win: 2, title: 6,  color: '#e07a2e', finale: null },
  { id: 'pro',      name: 'Pro League',      place: 'Thunder Peaks',       diff: 'pro',    teams: 8, win: 2, title: 8,  color: '#8a5cf0', finale: null },
  { id: 'legends',  name: 'Legends League',  place: 'Summit of Champions', diff: 'hard',   teams: 8, win: 3, title: 12, color: '#e0a800', finale: 'final' }
];

// Tournaments: six cups on a world tour (Tournament map), eight teams each,
// the final on the cup's own court. Reach the final to unlock the next cup.
// Tournaments get harder round by round: added to the cup's CPU difficulty
// boost in the quarter-final, semi-final and final.
SR.CUP_RAMP = [0, 5, 10];
SR.CUP_RAMP_LABEL = ['Warm-up', 'Tougher', 'Toughest'];
SR.CUPS = [
  { id: 'beach',     name: 'Beach Cup',      place: 'Sunset Coast',   diff: 'easy',   final: 'rays',    win: 1, title: 5,  color: '#ff8a3d' },
  { id: 'blossom',   name: 'Blossom Cup',    place: 'Sakura Gardens', diff: 'normal', final: 'blossom', win: 1, title: 6,  color: '#ff6fa3' },
  { id: 'desert',    name: 'Desert Cup',     place: 'Golden Dunes',   diff: 'normal', final: 'dunes',   win: 2, title: 7,  color: '#d99a3e' },
  { id: 'frost',     name: 'Frost Cup',      place: 'Polar North',    diff: 'pro',    final: 'wolves',  win: 2, title: 8,  color: '#4fb6ff' },
  { id: 'neon',      name: 'Neon Night Cup', place: 'Neon City',      diff: 'pro',    final: 'neon',    win: 2, title: 10, color: '#e040fb' },
  { id: 'champions', name: 'Champions Cup',  place: 'Champions Court', diff: 'hard',  final: 'final',   win: 3, title: 15, color: '#ffc400' }
];
