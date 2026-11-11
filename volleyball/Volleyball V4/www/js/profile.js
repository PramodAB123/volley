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
    var a = avatarById(prof().avatar), skin = a.skin, skinD = tone(skin.length === 7 ? skin : '#f2c7a5', -0.18), INK = '#1b1410';
    var jc = t.color, jd = tone(jc, -0.3), jl = tone(jc, 0.25), trim = t.trim, g = 'sp' + (++uid);
    var shorts = '#1d2440';
    return '<svg class="sp-svg" viewBox="0 0 220 240" aria-hidden="true"><defs>' +
      '<radialGradient id="' + g + 'g" cx=".62" cy=".3" r=".6"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".55"/><stop offset=".5" stop-color="#8a5cf0" stop-opacity=".18"/><stop offset="1" stop-color="#8a5cf0" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + g + 's" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".85"/></linearGradient>' +
      '<pattern id="' + g + 'n" width="11" height="11" patternUnits="userSpaceOnUse"><path d="M0 0h11v11" fill="none" stroke="rgba(230,238,255,.55)" stroke-width="1.2"/></pattern>' +
      '<radialGradient id="' + g + 'b" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff"/><stop offset=".75" stop-color="#e4ecff"/><stop offset="1" stop-color="#a9bde8"/></radialGradient></defs>' +
      '<circle cx="140" cy="80" r="110" fill="url(#' + g + 'g)"/>' +
      // speed lines behind the arm swing
      '<path d="M88 56c24-26 58-36 84-30" fill="none" stroke="url(#' + g + 's)" stroke-width="5" stroke-linecap="round" opacity=".7"/>' +
      '<path d="M96 70c22-20 46-28 68-26" fill="none" stroke="url(#' + g + 's)" stroke-width="3" stroke-linecap="round" opacity=".5"/>' +
      // legs, tucked back in the jump
      limb('M114 172 L96 198 L112 222', 13, skin) + limb('M136 170 L156 196 L136 214', 13, skinD) +
      '<path d="M104 219l16 1 2 7-19-1z" fill="#f4f4f4" stroke="' + INK + '" stroke-width="2"/><path d="M128 211l14 4-1 7-16-4z" fill="#f4f4f4" stroke="' + INK + '" stroke-width="2"/>' +
      // shorts
      '<path d="M101 154 L146 148 L152 178 L128 182 L124 170 L120 184 L98 182 Z" fill="' + shorts + '" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M100 176l21 2M128 176l23-3" stroke="' + trim + '" stroke-width="2.4"/>' +
      // off arm reaching up toward the ball
      limb('M104 106 L80 94 L66 70', 10, skinD) + '<path d="M60 64l4-8M66 62l2-9M72 64l1-8" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round"/>' +
      // torso (seen from behind, arched)
      '<path d="M98 104 C110 96 134 94 148 100 L144 128 C142 140 142 150 146 156 L100 160 C102 146 100 128 98 104 Z" fill="' + jc + '" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<path d="M101 112 C104 130 104 146 102 158 L112 158 C108 140 108 124 106 108 Z" fill="' + jd + '" opacity=".55"/>' +
      '<path d="M134 98 C140 112 142 132 140 154" fill="none" stroke="' + jl + '" stroke-width="4" opacity=".6"/>' +
      '<path d="M98 104 C110 96 134 94 148 100" fill="none" stroke="' + trim + '" stroke-width="3"/>' +
      '<text x="123" y="142" text-anchor="middle" font-size="30" font-weight="900" font-style="italic" fill="' + trim + '" stroke="' + INK + '" stroke-width="2" paint-order="stroke" font-family="system-ui, sans-serif">10</text>' +
      // hitting arm, high over the head
      limb('M142 104 L160 80 L172 54', 11, skin) +
      '<path d="M138 100 C146 96 152 98 154 106 L146 112 Z" fill="' + jc + '" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<path d="M98 108 C92 104 90 110 92 116 L102 116 Z" fill="' + jc + '" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<ellipse cx="174" cy="49" rx="7.5" ry="6" fill="' + skin + '" stroke="' + INK + '" stroke-width="2.2" transform="rotate(-30 174 49)"/>' +
      // head from behind: neck, ear, hair, headband
      '<rect x="116" y="90" width="14" height="14" rx="4" fill="' + skinD + '" stroke="' + INK + '" stroke-width="2.2"/>' +
      '<circle cx="124" cy="78" r="17" fill="' + skin + '" stroke="' + INK + '" stroke-width="2.4"/>' +
      '<ellipse cx="139" cy="80" rx="4" ry="5.5" fill="' + skin + '" stroke="' + INK + '" stroke-width="2"/>' +
      '<path d="M106 82c-4-12 2-24 12-27l-2-8 8 5 5-8 3 8 8-4-2 8c7 3 10 11 7 20-2-4-5-6-8-7l-2 8-4-7-5 7-3-8-5 7-2-7c-4 2-7 6-10 13z" fill="' + a.hair + '" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<path d="M107 77c10-5 24-6 34-2" fill="none" stroke="' + a.band + '" stroke-width="4" stroke-linecap="round"/>' +
      // ball with motion trail
      '<path d="M150 46l14-8M146 38l12-6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>' +
      '<g transform="translate(186 30)"><circle r="16" fill="url(#' + g + 'b)" stroke="#1b2440" stroke-width="2.4"/><path d="M-15 -4c9 0 17 4 23 13M-6 -14.5c6 5 8 12 7 22M14 -7c-9-2-17 1-23 8M-10 11c6-6 14-7 22-5" fill="none" stroke="#1b2440" stroke-width="2" stroke-linecap="round"/></g>' +
      // the net in front of the legs
      '<g><rect x="6" y="200" width="214" height="44" fill="url(#' + g + 'n)"/><rect x="6" y="196" width="214" height="7" rx="2" fill="#f4f6ff" stroke="#1b2440" stroke-width="1.5"/>' +
      '<rect x="6" y="196" width="214" height="44" fill="none"/></g>' +
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
    go('btn-home-demo', function () { if (SR.demo) SR.demo.start('menu', 'try'); });
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
