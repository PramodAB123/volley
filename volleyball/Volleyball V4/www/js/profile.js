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
  function spiker(t) {
    var a = avatarById(prof().avatar);
    var o = { id: 'sp' + (++uid), skin: a.skin.length === 7 ? a.skin : '#f2c7a5', hair: a.hair, color: t.color, trim: t.trim };
    var INK = '#141022', skin = o.skin, skinD = tone(skin, -0.2), hair = o.hair, hairL = tone(hair.length === 7 ? hair : '#2a2233', 0.28);
    var jc = o.color, jd = tone(jc, -0.38), jl = tone(jc, 0.22), trim = o.trim, g = o.id;
    var st = ' stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"';
    return '<svg class="sp-svg" viewBox="0 -34 244 284" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><defs>' +
      '<linearGradient id="' + g + 's" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".8"/></linearGradient>' +
      '<linearGradient id="' + g + 'j" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + jl + '"/><stop offset=".5" stop-color="' + jc + '"/><stop offset="1" stop-color="' + jd + '"/></linearGradient>' +
      '<linearGradient id="' + g + 'r" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<pattern id="' + g + 'n" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 0h10v10" fill="none" stroke="rgba(230,238,255,.5)" stroke-width="1.1"/></pattern></defs>' +
      // swing trail behind the hitting arm
      '<path d="M150 60 C170 22 206 8 232 14" fill="none" stroke="url(#' + g + 's)" stroke-width="7" stroke-linecap="round" opacity=".55"/>' +
      '<path d="M160 74 C180 40 208 28 230 32" fill="none" stroke="url(#' + g + 's)" stroke-width="3.5" stroke-linecap="round" opacity=".4"/>' +
      '<g opacity=".9"><rect x="150" y="206" width="110" height="50" fill="url(#' + g + 'n)"/><rect x="150" y="202" width="110" height="6" rx="2" fill="#f4f6ff" stroke="#1b2440" stroke-width="1.5"/></g>' +
      // far (left) arm, stretched forward for balance
      '<g transform="rotate(-9 140 200)">' +
      '<path d="M96 132 C78 126 60 116 44 100 L30 84 C26 78 34 70 40 76 L58 92 C72 102 88 108 104 112 Z" fill="' + skinD + '"' + st + '/>' +
      '<path d="M32 86 L18 76 M34 80 L22 66 M39 76 L32 62 M45 78 L44 64" fill="none" stroke="' + INK + '" stroke-width="7.5" stroke-linecap="round"/>' +
      '<path d="M32 86 L18 76 M34 80 L22 66 M39 76 L32 62 M45 78 L44 64" fill="none" stroke="' + skinD + '" stroke-width="4" stroke-linecap="round"/>' +
      // shorts (cut off by the banner edge)
      '<path d="M112 214 C130 222 156 220 176 208 L192 270 L100 270 Z" fill="#161a33"' + st + '/>' +
      '<path d="M172 212 L186 270" stroke="' + trim + '" stroke-width="5"/>' +
      // torso: back view, twisted into the swing
      '<path d="M90 124 C102 108 124 100 140 102 C158 98 178 102 190 114 C192 144 186 178 176 210 C156 222 130 224 112 216 C104 188 94 156 90 124 Z" fill="url(#' + g + 'j)"' + st + '/>' +
      '<path d="M90 124 C96 158 104 190 112 216 C118 219 124 220 130 221 C120 190 112 150 108 112 C101 115 95 119 90 124 Z" fill="' + jd + '" opacity=".6"/>' +
      '<path d="M176 108 C182 140 178 180 166 215" fill="none" stroke="' + trim + '" stroke-width="6" opacity=".95"/>' +
      '<path d="M118 150 C128 158 146 158 160 150" fill="none" stroke="' + jd + '" stroke-width="2.5" opacity=".7" stroke-linecap="round"/>' +
      '<path d="M138 104 C140 130 140 170 136 220" fill="none" stroke="' + jd + '" stroke-width="2" opacity=".45"/>' +
      '<text x="142" y="184" text-anchor="middle" transform="rotate(-6 142 180) skewX(-8)" font-size="40" font-weight="900" font-style="italic" fill="#fff" stroke="' + INK + '" stroke-width="3" paint-order="stroke" font-family="system-ui, sans-serif">10</text>' +
      // collar
      '<path d="M118 106 C128 114 146 114 156 102" fill="none" stroke="' + trim + '" stroke-width="5" stroke-linecap="round"/>' +
      // neck
      '<path d="M124 92 L122 108 C130 114 144 112 150 104 L148 88 Z" fill="' + skinD + '"' + st + '/>' +
      // hitting arm: elbow high, hand cocked back
      '<path d="M162 112 C176 96 190 82 204 70 C212 62 212 46 206 30 C204 22 216 18 220 26 C228 46 228 66 218 80 C206 96 194 112 184 128 Z" fill="' + skin + '"' + st + '/>' +
      '<path d="M196 84 C204 76 210 68 212 58" fill="none" stroke="' + skinD + '" stroke-width="3" stroke-linecap="round" opacity=".8"/>' +
      '<path d="M203 32 C196 26 194 16 198 8 L196 -6 C196 -11 203 -11 204 -6 L205 2 L207 -10 C208 -15 215 -14 214 -9 L213 3 L217 -7 C219 -12 225 -10 224 -5 L221 6 L225 0 C228 -4 233 -1 231 3 L226 14 C228 22 226 28 221 31 Z" fill="' + skin + '"' + st + '/>' +
      // sleeves
      '<path d="M154 104 C166 98 180 100 190 110 C192 118 190 126 186 132 C176 128 166 124 158 122 Z" fill="' + jc + '"' + st + '/>' +
      '<path d="M186 132 C190 126 192 118 190 110" fill="none" stroke="' + trim + '" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M90 126 C94 116 104 110 114 110 C116 118 114 128 108 136 C100 136 94 132 90 126 Z" fill="' + jd + '"' + st + '/>' +
      // head: turned toward the ball, seen from behind
      '<path d="M98 66 C96 86 104 100 120 102 C138 104 152 92 152 72 C152 54 140 44 124 44 C108 44 100 52 98 66 Z" fill="' + skin + '"' + st + '/>' +
      '<path d="M100 78 C98 80 96 84 98 88 L102 88" fill="' + skin + '"' + st + '/>' +
      '<path d="M102 66 L115 70" fill="none" stroke="' + INK + '" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M106 74 C108 72 111 72 112 75 C111 78 108 78 106 77 Z" fill="' + INK + '"/>' +
      '<path d="M104 90 C108 92 112 92 115 90" fill="none" stroke="' + INK + '" stroke-width="2" stroke-linecap="round"/>' +
      '<ellipse cx="129" cy="80" rx="4" ry="6" fill="' + skinD + '" stroke="' + INK + '" stroke-width="2"/>' +
      // hair: swept back in spikes
      '<path d="M104 62 C100 50 104 38 114 34 L110 24 L124 30 L128 16 L138 28 L152 20 L152 34 L168 34 L160 46 L174 56 L160 62 L166 78 L154 76 L152 92 L142 84 C138 78 136 70 136 62 C130 66 124 66 118 60 C114 62 108 62 104 62 Z" fill="' + hair + '"' + st + '/>' +
      '<path d="M122 36 C130 34 140 36 146 42 M132 50 C140 48 148 52 152 60" fill="none" stroke="' + hairL + '" stroke-width="3" stroke-linecap="round" opacity=".8"/>' +
      '</g>' +
      // rim light from the floodlights (off)
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
    if ($('h-art') && $('h-art').dataset.k !== key) { $('h-art').dataset.k = key; $('h-art').innerHTML = spiker(k); }
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
    go('btn-team', function () { SR.custom.fromHome(); });
    go('btn-home-menu', function () { var m = document.getElementById('scr-menu'); if (m) m.scrollTop = 0; });
    go('btn-home-demo', function () { SR.ui.show('scr-help'); var h = document.querySelector('#scr-help .panel'); if (h) h.scrollTop = 0; });
    refresh();
    // First launch: ask the name before anything else.
    if (!prof().name && !/[?&]demo/.test(location.search)) ask(true);
  }

  SR.profile = {
    init: init,
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
