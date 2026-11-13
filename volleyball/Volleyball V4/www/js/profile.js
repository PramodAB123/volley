// The player: name and avatar (asked on first launch), level and XP.
// Also draws the home screen's top bar, the spiker on the title and the
// "My team" strip, and hands out XP and coins after every match.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  function data() { return SR.save.data; }
  function prof() { return data().profile; }
  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var uid = 0;

  // ---- art ------------------------------------------------------------------

  function avatarById(id) { return SR.AVATARS.find(function (a) { return a.id === id; }) || SR.AVATARS[0]; }

  // A round cartoon portrait: gradient backdrop, jersey collar, face, hair, headband.
  function avatar(id) {
    var a = avatarById(id), g = 'av' + (++uid), INK = '#1b1410', hair = '';
    if (a.style === 'spiky') hair = '<path d="M17 30c-2-9 3-17 10-19l-1-6 6 4 4-6 3 6 6-3-1 7c6 3 9 9 8 17-4-6-9-9-17-9s-14 3-18 9z" fill="' + a.hair + '" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/>';
    else if (a.style === 'afro') hair = '<path d="M14 32c-5-12 3-25 18-25s23 13 18 25c-3-6-9-10-18-10s-15 4-18 10z" fill="' + a.hair + '" stroke="' + INK + '" stroke-width="1.6"/><circle cx="17" cy="20" r="6" fill="' + a.hair + '"/><circle cx="47" cy="20" r="6" fill="' + a.hair + '"/>';
    else if (a.style === 'ponytail') hair = '<path d="M46 22c8 4 9 14 5 22-1-7-3-12-7-15z" fill="' + a.hair + '" stroke="' + INK + '" stroke-width="1.4"/><path d="M17 31c-1-11 6-19 15-19s16 8 15 19c-3-5-8-8-15-8s-12 3-15 8z" fill="' + a.hair + '" stroke="' + INK + '" stroke-width="1.6"/>';
    else if (a.style === 'buzz') hair = '<path d="M18 29c0-9 6-15 14-15s14 6 14 15c-4-4-8-6-14-6s-10 2-14 6z" fill="' + a.hair + '" stroke="' + INK + '" stroke-width="1.4" opacity=".92"/>';
    else if (a.style === 'swoop') hair = '<path d="M16 31c-1-12 7-20 18-19 8 1 13 7 13 14-6-7-16-6-21-2-3 2-7 4-10 7z" fill="' + a.hair + '" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/>';
    else hair = '<circle cx="32" cy="10" r="6" fill="' + a.hair + '" stroke="' + INK + '" stroke-width="1.4"/><path d="M17 30c-1-10 6-17 15-17s16 7 15 17c-3-5-8-7-15-7s-12 2-15 7z" fill="' + a.hair + '" stroke="' + INK + '" stroke-width="1.6"/>';
    return '<svg class="av-svg" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + a.bg[0] + '"/><stop offset="1" stop-color="' + a.bg[1] + '"/></linearGradient>' +
      '<clipPath id="' + g + 'c"><circle cx="32" cy="32" r="30"/></clipPath></defs>' +
      '<circle cx="32" cy="32" r="30" fill="url(#' + g + ')"/>' +
      '<g clip-path="url(#' + g + 'c)">' +
      '<path d="M8 66c2-12 11-18 24-18s22 6 24 18z" fill="#1d2b55" stroke="' + INK + '" stroke-width="1.6"/><path d="M25 49l7 7 7-7" fill="none" stroke="' + a.band + '" stroke-width="2.4"/>' +
      '<rect x="27" y="40" width="10" height="10" rx="3" fill="' + a.skin + '" stroke="' + INK + '" stroke-width="1.4"/>' +
      '<ellipse cx="18" cy="32" rx="3" ry="4" fill="' + a.skin + '" stroke="' + INK + '" stroke-width="1.4"/><ellipse cx="46" cy="32" rx="3" ry="4" fill="' + a.skin + '" stroke="' + INK + '" stroke-width="1.4"/>' +
      '<ellipse cx="32" cy="31" rx="14" ry="15" fill="' + a.skin + '" stroke="' + INK + '" stroke-width="1.6"/>' + hair +
      '<path d="M18 26.5c8-3 20-3 28 0" fill="none" stroke="' + a.band + '" stroke-width="3.4" stroke-linecap="round"/>' +
      '<path d="M23.5 31.5c1.5-1.4 3.5-1.4 5 0M35.5 31.5c1.5-1.4 3.5-1.4 5 0" fill="none" stroke="' + INK + '" stroke-width="1.5" stroke-linecap="round"/>' +
      '<ellipse cx="26" cy="34.5" rx="1.9" ry="2.4" fill="' + INK + '"/><ellipse cx="38" cy="34.5" rx="1.9" ry="2.4" fill="' + INK + '"/><circle cx="26.7" cy="33.7" r=".7" fill="#fff"/><circle cx="38.7" cy="33.7" r=".7" fill="#fff"/>' +
      '<path d="M27 40c2.6 2.6 7.4 2.6 10 0" fill="none" stroke="' + INK + '" stroke-width="1.6" stroke-linecap="round"/>' +
      '<ellipse cx="22" cy="39" rx="2.6" ry="1.5" fill="#ff6b6b" opacity=".35"/><ellipse cx="42" cy="39" rx="2.6" ry="1.5" fill="#ff6b6b" opacity=".35"/>' +
      '</g><circle cx="32" cy="32" r="30" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="2.4"/></svg>';
  }

  // The spiker beside the title, in your team's colours, hitting the ball over the net.
  function tone(hex, k) {
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    var f = function (c) { return Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k); };
    return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
  }
  function limb(d, w, col) {
    return '<path d="' + d + '" fill="none" stroke="#1b1410" stroke-width="' + (w + 4) + '" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  // The hero spiker on the title banner: tapered, shaded limbs, no ink outline,
  // a rim of floodlight on the lit side. Team colours, avatar skin and hair.
  // Catmull-Rom through points [x, y, width]; returns { body: closed outline path, rim: right/lit edge path }.
  function limbPath(pts) {
    var c = [], i, t, k;
    for (i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
      for (k = 0; k < 10; k++) {
        t = k / 10; var t2 = t * t, t3 = t2 * t;
        var f = function (a, b, cc, d) { return 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3); };
        c.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1]), p1[2] + (p2[2] - p1[2]) * t]);
      }
    }
    c.push(pts[pts.length - 1].slice());
    var L = [], R = [];
    for (i = 0; i < c.length; i++) {
      var a = c[Math.max(i - 1, 0)], b = c[Math.min(i + 1, c.length - 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / d, ny = dx / d, w = c[i][2] / 2;
      L.push([c[i][0] + nx * w, c[i][1] + ny * w]); R.push([c[i][0] - nx * w, c[i][1] - ny * w]);
    }
    function fmt(p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }
    function cap(p, q, ctr) {   // half circle from p to q around ctr, bulging away from the limb
      var out = [], a0 = Math.atan2(p[1] - ctr[1], p[0] - ctr[0]), r = ctr[2] / 2, j, dir = ctr.dir;
      for (j = 1; j < 8; j++) { var a = a0 + dir * Math.PI * j / 8; out.push([ctr[0] + Math.cos(a) * r, ctr[1] + Math.sin(a) * r]); }
      return out;
    }
    var e = c[c.length - 1], s0 = c[0];
    function side(p, ctr, nxt) { // which way round the cap goes: away from the next sample
      var a = Math.atan2(p[1] - ctr[1], p[0] - ctr[0]) + Math.PI / 2, tx = Math.cos(a), ty = Math.sin(a);
      return (tx * (ctr[0] - nxt[0]) + ty * (ctr[1] - nxt[1])) > 0 ? 1 : -1;
    }
    e.dir = side(L[L.length - 1], e, c[c.length - 2]); s0.dir = side(R[0], s0, c[1]);
    var pts2 = L.concat(cap(L[L.length - 1], R[R.length - 1], e), R.slice().reverse(), cap(R[0], L[0], s0));
    var body = 'M' + pts2.map(fmt).join('L') + 'Z';
    return { body: body, L: 'M' + L.map(fmt).join('L'), R: 'M' + R.map(fmt).join('L') };
  }
  function spiker(t) {
    var a = avatarById(prof().avatar);
    var o = { id: 'sp' + (++uid), skin: a.skin.length === 7 ? a.skin : '#f2c7a5', hair: a.hair, color: t.color, trim: t.trim };
    var g = o.id, skin = o.skin, skinD = tone(skin, -0.34), skinL = tone(skin, 0.22), hair = o.hair;
    var jc = o.color, jd = tone(jc, -0.5), jl = tone(jc, 0.3), trim = o.trim, rim = 'rgba(205,225,255,.95)';
    function limb(pts, fill, lit, side, from) {
      var p = limbPath(pts), r = limbPath(pts.slice(from || 0));
      return '<path d="' + p.body + '" fill="' + fill + '"/>' + (lit ? '<path d="' + r[side || 'R'] + '" fill="none" stroke="' + lit + '" stroke-width="1.2" stroke-linecap="round" opacity=".75"/>' : '');
    }
    var sk = 'url(#' + g + 'k)', skd = 'url(#' + g + 'kd)';
    // Pose: airborne, back arched, hitting arm cocked high, off arm pointing at the ball, knees bent behind.
    var legB = limb([[124, 148, 22], [114, 172, 17], [106, 192, 13.5], [116, 210, 10.5], [128, 224, 8]], skd);
    var legF = limb([[140, 148, 23], [150, 172, 18.5], [157, 192, 14.5], [169, 206, 11], [182, 216, 8]], sk, rim, 'R', 1);
    var armOff = limb([[106, 94, 15], [97, 78, 11.5], [91, 62, 9.5], [86, 46, 8], [83, 33, 6.5]], skd);
    var armHit = limb([[162, 92, 15], [168, 72, 12.5], [175, 54, 10.5], [173, 38, 9], [168, 25, 7.5]], sk, rim, 'R', 1);
    // an open hand: palm plus four fingers and a thumb, drawn as small tapered strokes
    function hand(x, y, ang, fill) {
      var out = '<g transform="translate(' + x + ' ' + y + ') rotate(' + ang + ')"><ellipse cx="0" cy="-5" rx="5.4" ry="6.6" fill="' + fill + '"/>', f = [[-3.6, 9.5], [-1.2, 11.5], [1.3, 11.5], [3.7, 9.8]];
      for (var q = 0; q < f.length; q++) out += '<path d="M' + f[q][0] + ' -8 L' + (f[q][0] * 1.25) + ' ' + (-8 - f[q][1]) + '" stroke="' + fill + '" stroke-width="2.5" stroke-linecap="round"/>';
      return out + '<path d="M-4.5 -3 L-9 -8" stroke="' + fill + '" stroke-width="2.6" stroke-linecap="round"/></g>';
    }
    return '<svg class="sp-svg" viewBox="58 -18 186 200" preserveAspectRatio="xMaxYMax meet" aria-hidden="true"><defs>' +
      '<linearGradient id="' + g + 'k" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + skinD + '"/><stop offset=".55" stop-color="' + skin + '"/><stop offset="1" stop-color="' + skinL + '"/></linearGradient>' +
      '<linearGradient id="' + g + 'kd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + tone(skin, -0.5) + '"/><stop offset="1" stop-color="' + skinD + '"/></linearGradient>' +
      '<linearGradient id="' + g + 'j" x1="0" y1="0" x2="1" y2=".25"><stop offset="0" stop-color="' + jd + '"/><stop offset=".55" stop-color="' + jc + '"/><stop offset=".9" stop-color="' + jl + '"/></linearGradient>' +
      '<linearGradient id="' + g + 'sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#05070f"/><stop offset=".7" stop-color="#1a1f36"/><stop offset="1" stop-color="#2c3352"/></linearGradient>' +
      '<radialGradient id="' + g + 'b" cx=".65" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#f3f0e6"/><stop offset="1" stop-color="#9aa3c0"/></radialGradient>' +
      '<radialGradient id="' + g + 'bg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".75"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + g + 'h" cx=".7" cy=".25" r=".9"><stop offset="0" stop-color="' + tone(hair.length === 7 ? hair : '#2a2233', 0.18) + '"/><stop offset="1" stop-color="' + hair + '"/></radialGradient>' +
      '<linearGradient id="' + g + 'tr" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<pattern id="' + g + 'n" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M0 0h9v9" fill="none" stroke="rgba(230,238,255,.45)" stroke-width="1"/></pattern></defs>' +
      // net behind, lower right
      '<rect x="150" y="214" width="110" height="40" fill="url(#' + g + 'n)"/><rect x="150" y="210" width="110" height="5" rx="1.5" fill="#eef2ff"/>' +
      // ball: glow, motion trail, panels
      '<circle cx="212" cy="14" r="26" fill="url(#' + g + 'bg)"/>' +
      '<path d="M196 24 C176 34 160 44 150 58" fill="none" stroke="url(#' + g + 'tr)" stroke-width="7" stroke-linecap="round" opacity=".45"/>' +
      '<g transform="translate(212 14) rotate(-20)"><circle r="12" fill="url(#' + g + 'b)"/>' +
      '<path d="M-11.5 -3 C-4 -2 3 3 6 10.5 M-4 -11.3 C0 -5 1 3 -1 11.8 M11 -5 C4 -6 -3 -3 -8 3.5" fill="none" stroke="#2f4fa8" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>' +
      '<path d="M3 -11.5 C8 -9 11 -5 11.8 0" fill="none" stroke="#f2b51e" stroke-width="2.4" stroke-linecap="round"/></g>' +
      // far side first: back leg, off arm
      legB +
      '<path d="M117 222 L131 219 C135 219 137 222 136 226 L121 229 C117 229 115 225 117 222 Z" fill="#cfd5e6"/><path d="M118 227 L136 224" stroke="#5b6480" stroke-width="2.2"/>' +
      '<rect x="100" y="185" width="14" height="11" rx="5" transform="rotate(30 107 190)" fill="#1b1f33"/>' +
      armOff + hand(83, 32, -12, skinD) +
      // shorts
      '<path d="M114 140 C126 146 142 146 154 138 L162 168 C150 176 134 178 122 174 L118 182 C110 180 104 176 102 170 Z" fill="url(#' + g + 'sh)"/>' +
      '<path d="M154 140 L161 167" stroke="' + trim + '" stroke-width="2.6" opacity=".9"/>' +
      // front leg + shoe + knee pad
      legF +
      '<path d="M174 214 L188 210 C193 209 196 213 194 217 L180 222 C175 223 172 218 174 214 Z" fill="#f4f6fb"/><path d="M175 220 L194 214" stroke="#5b6480" stroke-width="2.4"/><path d="M183 211 l4 -1" stroke="' + trim + '" stroke-width="2"/>' +
      '<rect x="148" y="184" width="16" height="12" rx="5.5" transform="rotate(-38 156 190)" fill="#22273f"/><path d="M151 186 l9 -6" stroke="rgba(255,255,255,.18)" stroke-width="2" stroke-linecap="round"/>' +
      // torso (back view, twisting into the swing)
      '<path d="M99 94 C105 82 126 77 140 79 C157 78 169 84 172 96 C170 114 162 132 156 144 C142 152 126 152 112 146 C106 128 97 110 99 94 Z" fill="url(#' + g + 'j)"/>' +
      '<path d="M112 146 C106 128 97 110 99 94 C104 86 112 82 120 81 C116 100 116 124 122 149 Z" fill="' + jd + '" opacity=".55"/>' +
      '<path d="M131 86 C134 104 136 124 134 146" fill="none" stroke="' + jd + '" stroke-width="1.6" opacity=".55"/>' +
      '<path d="M118 118 C126 122 140 122 150 116" fill="none" stroke="' + jd + '" stroke-width="1.4" opacity=".45"/>' +
      '<path d="M170 98 C168 116 161 132 155 143" fill="none" stroke="' + rim + '" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M158 83 C166 92 166 114 158 138" fill="none" stroke="' + trim + '" stroke-width="3.4" opacity=".9"/>' +
      '<text x="136" y="130" text-anchor="middle" transform="rotate(-4 136 120)" font-size="27" font-weight="800" fill="' + trim + '" font-family="Arial Black, Arial, sans-serif" letter-spacing="-1" opacity=".95">10</text>' +
      '<path d="M120 84 C128 90 142 90 150 82" fill="none" stroke="' + trim + '" stroke-width="2.6" stroke-linecap="round"/>' +
      // sleeves
      '<path d="M154 82 C166 80 176 88 178 98 L166 106 C162 100 156 94 150 91 Z" fill="' + jc + '"/><path d="M178 98 L166 106" stroke="' + trim + '" stroke-width="2.6"/>' +
      '<path d="M97 98 C97 88 104 83 114 83 L116 95 C110 97 104 101 100 106 Z" fill="' + jd + '"/>' +
      // hitting arm on top, hand cocked open
      armHit + hand(167, 25, -22, skin) +
      // neck, head from behind (ear and jaw only), short hair
      '<path d="M126 70 L124 84 C130 88 140 88 144 82 L142 68 Z" fill="' + skinD + '"/>' +
      '<ellipse cx="134" cy="58" rx="13.5" ry="15" fill="url(#' + g + 'k)"/>' +
          '<ellipse cx="146" cy="60" rx="3" ry="4.5" fill="' + skinD + '"/>' +
      '<path d="M120.5 67 C115 52 121 38 134 37.5 C145 37 151.5 44 150.5 53 C148 53 145.5 56 144.5 61 C143 67 140.5 72 136 74.5 C129.5 76 124 73 120.5 67 Z" fill="url(#' + g + 'h)"/>' +
      '<path d="M124 70 C128 73 133 74 137 73" fill="none" stroke="' + tone(hair.length === 7 ? hair : '#2a2233', -0.4) + '" stroke-width="1.2" opacity=".6"/>' +
      '<path d="M126 43 C132 40 140 40 145 44" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M147.5 50 C150 54 150 62 147.5 68" fill="none" stroke="' + rim + '" stroke-width="1.4" stroke-linecap="round"/>' +
      '</svg>';
  }

  // ---- levels -----------------------------------------------------------------

  // Add XP; every level reached pays its reward (diamonds and coins).
  // Returns the levels reached, with their rewards, oldest first.
  function addXp(n) {
    var p = prof(), ups = [];
    p.xp += Math.max(0, Math.round(n));
    p.total += Math.max(0, Math.round(n));
    while (p.xp >= SR.XP.need(p.level) && p.level < 999) {
      p.xp -= SR.XP.need(p.level);
      p.level++;
      var r = SR.XP.reward(p.level);
      data().stars += r.gems;
      data().coins += r.coins;
      ups.push({ level: p.level, gems: r.gems, coins: r.coins });
    }
    return ups;
  }

  // XP and coins for a finished match (my = the player's side's stats).
  function matchLoot(my, won, mode) {
    var X = SR.XP, Cn = SR.COINS, extra = mode !== 'quick' ? 1 : 0;
    var xp = X.play + (won ? X.win : 0) + my.kills * X.kill + my.aces * X.ace + my.blocks * X.block + extra * X.mode;
    var coins = Cn.play + (won ? Cn.win : 0) + my.kills * Cn.kill + my.aces * Cn.ace + my.blocks * Cn.block + extra * Cn.mode;
    return { xp: xp, coins: coins };
  }

  // ---- home screen ------------------------------------------------------------

  function refresh() {
    var p = prof(), need = SR.XP.need(p.level);
    if ($('h-avatar')) $('h-avatar').innerHTML = avatar(p.avatar);
    if ($('h-name')) $('h-name').textContent = p.name || 'Player';
    if ($('h-level')) $('h-level').textContent = p.level;
    if ($('h-xpbar')) $('h-xpbar').style.width = Math.round(p.xp / need * 100) + '%';
    if ($('h-xp')) $('h-xp').textContent = SR.fmtNum(p.xp) + ' / ' + SR.fmtNum(need) + ' XP';
    document.querySelectorAll('[data-coins]').forEach(function (el) { el.textContent = SR.fmtNum(data().coins); });
    var t = SR.teamById(data().settings.team);
    var k = SR.kitTeam ? SR.kitTeam(t) : t;
    var key = k.color + k.trim + p.avatar;
    if ($('h-art') && !$('h-art').classList.contains('h-photo') && $('h-art').dataset.k !== key) { $('h-art').dataset.k = key; $('h-art').innerHTML = spiker(k); }
    teamStrip();
    settingsCard();
  }

  // "My team": unlock the custom team for diamonds, then edit and upgrade it.
  var LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none"/></svg>';
  function teamStrip() {
    var el = $('btn-team');
    if (!el || !SR.custom) return;
    var c = data().custom, t = SR.customTeam(), C = SR.CUSTOM;
    if (!t) {
      el.className = 'strip team-strip locked';
      el.innerHTML = '<span class="ts-crest">' + SR.custom.blank() + '</span>' +
        '<span class="dt-txt"><b>Customise your team</b><small>Your own club. Upgrade it with coins.</small></span>' +
        '<span class="ts-btn">' + LOCK + '<span class="ts-word">Unlock</span> ' + SR.GEM + ' ' + C.price + '</span>';
      return;
    }
    var cap = SR.customCaps(c.lvl), pw = Math.round(SR.teamPower(t));
    el.className = 'strip team-strip';
    el.innerHTML = '<span class="ts-crest">' + SR.custom.shield(t, 'ct-shield') + '</span>' +
      '<span class="dt-txt"><b>' + esc(t.name) + ' <em class="ts-lvl">Lv ' + (cap.lvl + 1) + '</em></b><small>Power ' + pw + (cap.lvl < C.levels ? ' · Upgrade for ' + SR.COIN + ' ' + SR.fmtNum(C.upgradeCost(cap.lvl)) : ' · Max level') + '</small></span>' +
      '<span class="ts-btn">Customise</span>';
  }

  function settingsCard() {
    var el = $('set-profile');
    if (!el) return;
    var p = prof();
    el.innerHTML = '<span class="avatar big">' + avatar(p.avatar) + '</span><span class="sp-who"><b>' + esc(p.name || 'Player') + '</b><small>Level ' + p.level + ' · ' + SR.fmtNum(p.total) + ' XP in total</small></span>' +
      '<button id="btn-edit-profile" class="btn" type="button">Edit</button>';
    $('btn-edit-profile').addEventListener('click', function () { SR.audio.play('click'); ask(false); });
  }

  // ---- name dialog ------------------------------------------------------------

  var pick = null, first = false, open = false, after = null;
  function ask(isFirst, then) {
    var box = $('name-dlg');
    if (!box) return;
    first = !!isFirst; after = then || null;
    pick = prof().avatar;
    $('name-title').textContent = first ? 'Welcome to Spike Rally!' : 'Your profile';
    $('name-sub').textContent = first ? 'What should we call you, coach? Pick a look too.' : 'Change your name or your look.';
    $('name-ok').textContent = first ? 'Let’s play!' : 'Save';
    $('name-cancel').classList.toggle('hidden', first);
    $('name-input').value = prof().name || '';
    $('name-err').classList.add('hidden');
    avatars();
    box.classList.remove('hidden');
    open = true;
    // On phones the keyboard would cover the dialog straight away; focus only on PC.
    if (!SR.touch) setTimeout(function () { $('name-input').focus(); }, 60);
  }
  function avatars() {
    $('name-avatars').innerHTML = SR.AVATARS.map(function (a) {
      return '<button type="button" role="radio" aria-checked="' + (a.id === pick) + '" class="nd-av' + (a.id === pick ? ' on' : '') + '" data-v="' + a.id + '" aria-label="Avatar ' + a.id.slice(1) + '">' + avatar(a.id) + '</button>';
    }).join('');
    $('name-avatars').querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { pick = b.getAttribute('data-v'); SR.audio.play('click'); avatars(); });
    });
  }
  function done() {
    var n = SR.playerName($('name-input').value);
    if (n.replace(/[^0-9A-Za-zÀ-￿]/g, '').length < 2) {
      $('name-err').classList.remove('hidden');
      $('name-input').focus();
      return;
    }
    prof().name = n;
    prof().avatar = pick;
    SR.ui.save();
    SR.audio.play('reward');
    close();
  }
  function close() {
    $('name-dlg').classList.add('hidden');
    open = false;
    try { $('name-input').blur(); } catch (e) { /* gone */ }
    refresh();
    var a = after; after = null;
    if (a) a();
    else if (SR.ui.current() === 'scr-menu' && SR.daily) SR.daily.onMenu();
  }

  // A new player goes from the name dialog straight into the training.
  function firstTraining() {
    var d = SR.save.data;
    if (d.trained || !SR.demo || (d.stats && d.stats.matches > 0)) { if (SR.ui.current() === 'scr-menu' && SR.daily) SR.daily.onMenu(); return; }
    d.trained = true;
    SR.ui.save();
    SR.demo.start('menu', 'try', 0, true);
  }

  function init() {
    if (!$('name-dlg')) return;
    $('name-ok').addEventListener('click', done);
    $('name-cancel').addEventListener('click', function () { SR.audio.play('click'); close(); });
    $('name-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); done(); } });
    $('name-input').addEventListener('input', function () { $('name-err').classList.add('hidden'); });
    var go = function (id, fn) { var b = $(id); if (b) b.addEventListener('click', function () { SR.audio.play('click'); fn(); }); };
    go('btn-profile', function () { ask(false); });
    go('btn-coins', function () { SR.ui.openShop('shop-exchange'); });
    go('btn-gems', function () { SR.ui.openShop('shop-exchange'); });
    go('btn-team', function () { SR.ui.openTeam(); });
    go('btn-nav-team', function () { SR.ui.openTeam(); });
    go('btn-home-menu', function () { var m = document.getElementById('scr-menu'); if (m) m.scrollTop = 0; });
    go('btn-home-demo', function () { SR.ui.show('scr-help'); var h = document.querySelector('#scr-help .panel'); if (h) h.scrollTop = 0; });
    refresh();
    // First launch: ask the name before anything else.
    if (!prof().name && !/[?&]demo/.test(location.search)) ask(true, firstTraining);
  }

  SR.profile = {
    init: init,
    firstTraining: firstTraining,
    refresh: refresh,
    avatar: avatar,
    addXp: addXp,
    matchLoot: matchLoot,
    ask: ask,
    isOpen: function () { return open; },
    // Android Back: closes the dialog unless the name is still missing.
    back: function () { if (first) return; close(); }
  };
})();
