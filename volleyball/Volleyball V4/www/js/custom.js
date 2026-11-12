// Custom team: your own club with its name, short code, jersey colours,
// pattern and skill points. Unlocked once for SR.CUSTOM.price diamonds from
// the home screen, the team picker or the Shop, then levelled up with coins
// (more skill points, higher caps). Every purchase asks Yes / No first
// (SR.confirmBuy, also used by the Shop). Offline modes only.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var C = SR.CUSTOM;
  function data() { return SR.save.data; }
  function cfg() { return data().custom; }
  function unlocked() { return !!cfg().unlocked; }
  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // ---- Yes / No dialog ----------------------------------------------------

  // ask({ title, text, art, yes, no, onYes, onNo }) shows a small dialog over
  // the current screen. Without `no` it is a plain notice with one button.
  var dlg = null, lastFocus = null;
  function ask(o) {
    var box = $('confirm');
    if (!box) { if (o.onYes) o.onYes(); return; }
    dlg = o;
    lastFocus = document.activeElement;
    $('confirm-art').innerHTML = o.art || '';
    $('confirm-art').classList.toggle('hidden', !o.art);
    $('confirm-title').textContent = o.title;
    $('confirm-text').innerHTML = o.text || '';
    $('confirm-yes').textContent = o.yes || 'Yes';
    $('confirm-no').textContent = o.no || 'No';
    $('confirm-no').classList.toggle('hidden', o.no === false);
    box.classList.remove('hidden');
    setTimeout(function () { $(o.no === false ? 'confirm-yes' : 'confirm-no').focus(); }, 30);
  }
  function close(yes) {
    var o = dlg;
    if (!o) return;
    dlg = null;
    $('confirm').classList.add('hidden');
    try { if (lastFocus && lastFocus.focus) lastFocus.focus(); } catch (e) { /* element gone */ }
    if (yes && o.onYes) o.onYes(); else if (!yes && o.onNo) o.onNo();
  }

  // A purchase: Yes / No with the price and what is left after it, or a
  // notice when there isn't enough. o.coins = priced in coins (default:
  // diamonds). onBuy runs after the price is taken (saved by the caller).
  function confirmBuy(o) {
    var coin = !!o.coins, key = coin ? 'coins' : 'stars', have = data()[key], art = o.art || '';
    var ic = coin ? SR.COIN : SR.GEM, cls = coin ? 'cf-coin' : 'cf-star', f = SR.fmtNum;
    var money = function (n) { return '<b class="' + cls + '">' + ic + ' ' + f(n) + '</b>'; };
    SR.audio.play('click');
    if (have < o.price) {
      ask({ title: coin ? 'Not enough coins' : 'Not enough diamonds', art: art, no: false, yes: 'OK',
        text: '<b>' + esc(o.name) + '</b> costs ' + money(o.price) + '. You have ' + money(have) + ', so you need <b>' + f(o.price - have) + ' more</b>.<br><span class="muted small">' +
          (coin ? 'Every match you play earns coins, and more when you win.' : 'Win matches, level up, play the daily challenge and open your daily gift to earn diamonds. You can also swap coins for diamonds in the Shop.') + '</span>' });
      return;
    }
    ask({ title: (o.verb || 'Buy') + ' ' + o.name + '?', art: art, yes: o.yes || 'Yes, buy', no: 'No',
      text: 'This costs ' + money(o.price) + '.' + (o.what ? ' ' + o.what : '') +
        '<span class="cf-bal"><span>You have ' + money(have) + '</span><span>After buying ' + money(have - o.price) + '</span></span>',
      onYes: function () {
        if (data()[key] < o.price) return;
        data()[key] -= o.price;
        o.onBuy();
      } });
  }

  // ---- art ----------------------------------------------------------------

  function shield(t, cls) {
    var pat = t.pattern === 'stripes' ? '<path d="M9.5 0h3v34h-3zM19.5 0h3v34h-3z"/>' : t.pattern === 'hoops' ? '<path d="M0 12h32v5H0z"/>' : '<path d="M16 0h16v34H16z"/>';
    var id = 'ctc-' + (cls || 'x');
    return '<svg class="' + (cls || 'ct-shield') + '" viewBox="0 0 32 34" aria-hidden="true"><defs><clipPath id="' + id + '"><path d="M16 2l13 4.5V15c0 8.5-5.6 14.5-13 17C8.6 29.5 3 23.5 3 15V6.5z"/></clipPath></defs>' +
      '<path d="M16 2l13 4.5V15c0 8.5-5.6 14.5-13 17C8.6 29.5 3 23.5 3 15V6.5z" fill="' + t.color + '"/>' +
      '<g clip-path="url(#' + id + ')" fill="' + t.trim + '" opacity=".9">' + pat + '</g>' +
      '<path d="M16 2l13 4.5V15c0 8.5-5.6 14.5-13 17C8.6 29.5 3 23.5 3 15V6.5z" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.4"/>' +
      '<text x="16" y="20.5" text-anchor="middle" font-size="8.5" font-weight="900" fill="#fff" stroke="rgba(0,0,0,.55)" stroke-width="1.6" paint-order="stroke">' + esc(t.short) + '</text></svg>';
  }
  // A locked custom team: a dashed shield with a plus.
  var BLANK = '<svg class="ct-shield" viewBox="0 0 32 34" aria-hidden="true"><path d="M16 2l13 4.5V15c0 8.5-5.6 14.5-13 17C8.6 29.5 3 23.5 3 15V6.5z" fill="rgba(127,140,160,.15)" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2.6 2"/><path d="M16 11v12M10 17h12" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
  var LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none"/></svg>';
  var PEN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';

  function power(r) { return SR.teamPower({ r: r }); }
  function meter(r) { return Math.max(4, Math.min(100, Math.round((power(r) - 60) / 30 * 100))); }

  // ---- unlocking ----------------------------------------------------------

  // Buy the custom team (Yes / No), then open the builder. `back` is where
  // the builder returns to.
  function unlock(back) {
    confirmBuy({
      name: 'Custom team', price: C.price, art: BLANK,
      what: 'Make your own club: name, short name, jersey colours, pattern and skill points. Edit it any time for free.',
      onBuy: function () {
        cfg().unlocked = true;
        SR.ui.save();
        SR.audio.play('reward');
        open(back, true);
      }
    });
  }

  // ---- the card on the team picker -----------------------------------------

  // The first card on "Choose your team": buy it, or pick it and edit it.
  function card(onPick) {
    var el = document.createElement('div');
    var t = SR.customTeam();
    el.className = 'team-card ct-card' + (t ? '' : ' locked');
    if (!t) {
      el.innerHTML = '<button type="button" class="ct-main">' +
        '<span class="ct-crest">' + BLANK + '</span>' +
        '<span class="ct-txt"><span class="tname">Custom team</span><span class="tstats">Your own name, colours and skill points</span></span>' +
        '<span class="ct-price"><span class="ct-lock">' + LOCK + '</span>Unlock <b>' + SR.GEM + ' ' + C.price + '</b></span></button>';
      el.querySelector('.ct-main').addEventListener('click', function () { unlock(teamsBack); });
      return el;
    }
    el.innerHTML = '<button type="button" class="ct-main">' +
      '<span class="ct-crest">' + shield(t, 'ct-shield') + '</span>' +
      '<span class="ct-txt"><span class="tname">' + esc(t.name) + ' <em class="ct-tag">Custom</em></span>' +
      '<span class="tstats">ATK ' + t.r.attack + ' · BLK ' + t.r.block + ' · PASS ' + t.r.pass + ' · SRV ' + t.r.serve + ' · SPD ' + t.r.speed + '</span>' +
      '<span class="meter"><span style="width:' + meter(t.r) + '%"></span></span></span></button>' +
      '<button type="button" class="ct-edit" aria-label="Edit custom team">' + PEN + '<span>Edit</span></button>';
    el.querySelector('.ct-main').addEventListener('click', function () { onPick(SR.customTeam()); });
    el.querySelector('.ct-edit').addEventListener('click', function () { SR.audio.play('click'); open(teamsBack); });
    return el;
  }
  function teamsBack() { SR.ui.teams(); }

  // ---- the Shop section ---------------------------------------------------

  function shopCard(box) {
    if (!box) return;
    var t = SR.customTeam(), mine = t && data().settings.team === 'custom';
    box.innerHTML = '<div class="ct-shop' + (t ? '' : ' locked') + '">' +
      '<span class="ct-crest big">' + (t ? shield(t, 'ct-shield') : BLANK) + '</span>' +
      '<span class="ct-txt"><b>' + (t ? esc(t.name) : 'Custom team') + '</b>' +
      '<span class="muted small">' + (t ? (mine ? 'Your team. ' : '') + 'Level ' + (SR.customCaps(cfg().lvl).lvl + 1) + '. Change the name, colours and skill points any time, and upgrade it with coins.' : 'Build your own club and play it in every offline mode. Upgrade it with coins.') + '</span></span>' +
      '<button type="button" class="btn ' + (t ? 'ghost' : 'primary') + ' ct-shop-btn">' + (t ? PEN + ' Customise' : LOCK + ' Unlock ' + SR.GEM + ' ' + C.price) + '</button></div>';
    box.querySelector('.ct-shop-btn').addEventListener('click', function () {
      if (t) { SR.audio.play('click'); open(shopBack); } else unlock(shopBack);
    });
  }
  function shopBack() { SR.ui.renderShop(); SR.ui.show('scr-shop'); }

  // ---- the builder --------------------------------------------------------

  var draft = null, saved = '', backTo = null, fresh = false;

  function open(back, isNew) {
    if (!unlocked()) return;
    backTo = back || function () { SR.ui.show('scr-menu'); };
    fresh = !!isNew;
    draft = JSON.parse(JSON.stringify(cfg()));
    saved = JSON.stringify(draft);
    $('ct-name').value = draft.name;
    $('ct-short').value = draft.short;
    if (draft.short !== SR.customShort(draft.name)) $('ct-short').dataset.manual = '1'; else delete $('ct-short').dataset.manual;
    $('ct-new').classList.toggle('hidden', !fresh);
    render();
    SR.ui.show('scr-custom');
  }

  function cap() { return SR.customCaps(cfg().lvl); }
  function left() { return cap().total - C.stats.reduce(function (s, st) { return s + draft.r[st[0]]; }, 0); }

  function render() {
    var t = { id: 'custom', name: draft.name, short: draft.short, color: draft.color, trim: draft.trim, pattern: draft.pattern };
    $('ct-preview').innerHTML = '<span class="ct-big-jersey">' + SR.daily.jersey(t, 'ct-jersey') + '<b style="color:' + draft.trim + '">' + 7 + '</b></span>' +
      '<span class="ct-big-crest">' + shield(t, 'ct-shield-big') + '</span>' +
      '<span class="ct-pv-name">' + esc(draft.name || 'My Club') + '</span>' +
      '<span class="ct-pv-short">' + esc(draft.short) + '</span>' +
      '<span class="ct-pv-pow"><small>Team power</small><span class="meter"><span style="width:' + meter(draft.r) + '%"></span></span></span>';
    swatches($('ct-colors'), C.colors, 'color');
    swatches($('ct-trims'), C.trims, 'trim');
    $('ct-pattern').innerHTML = C.patterns.map(function (p) {
      return '<button type="button" role="radio" aria-checked="' + (p[0] === draft.pattern) + '" class="' + (p[0] === draft.pattern ? 'on' : '') + '" data-v="' + p[0] + '">' + p[1] + '</button>';
    }).join('');
    $('ct-pattern').querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { draft.pattern = b.getAttribute('data-v'); SR.audio.play('click'); render(); });
    });
    renderStats();
    var clash = SR.colorGap(draft.color, draft.trim) < 70;
    $('ct-warn').classList.toggle('hidden', !clash);
  }

  function swatches(box, list, key) {
    var cur = draft[key], custom = list.indexOf(cur) < 0;
    box.innerHTML = list.map(function (c) {
      return '<button type="button" role="radio" aria-checked="' + (c === cur) + '" aria-label="Colour ' + c + '" class="ct-sw' + (c === cur ? ' on' : '') + '" style="--c:' + c + '" data-v="' + c + '"></button>';
    }).join('') +
      '<label class="ct-sw ct-pick' + (custom ? ' on' : '') + '" style="--c:' + (custom ? cur : 'transparent') + '" title="Any colour"><input type="color" value="' + cur + '" aria-label="Pick any colour"><span aria-hidden="true">+</span></label>';
    box.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { draft[key] = b.getAttribute('data-v'); SR.audio.play('click'); render(); });
    });
    var inp = box.querySelector('input');
    inp.addEventListener('input', function () { if (/^#[0-9a-fA-F]{6}$/.test(inp.value)) { draft[key] = inp.value.toLowerCase(); render(); } });
  }

  function renderStats() {
    var free = left(), mx = cap().max;
    upgradeBox();
    $('ct-left').textContent = free + ' point' + (free === 1 ? '' : 's') + ' left';
    $('ct-left').classList.toggle('zero', free === 0);
    $('ct-stats').innerHTML = C.stats.map(function (st) {
      var v = draft.r[st[0]];
      return '<div class="ct-stat"><span class="ct-sn">' + st[1] + '</span>' +
        '<button type="button" class="ct-pm" data-k="' + st[0] + '" data-d="-1" aria-label="Less ' + st[1] + '"' + (v - C.step < C.min ? ' disabled' : '') + '>−</button>' +
        '<span class="ct-bar"><i style="width:' + Math.round((v - C.min) / (C.max + C.levels - C.min) * 100) + '%"></i><u style="left:' + Math.round((mx - C.min) / (C.max + C.levels - C.min) * 100) + '%"></u></span>' +
        '<b class="ct-sv">' + v + '</b>' +
        '<button type="button" class="ct-pm" data-k="' + st[0] + '" data-d="1" aria-label="More ' + st[1] + '"' + (v + C.step > mx || free < C.step ? ' disabled' : '') + '>+</button></div>';
    }).join('');
    $('ct-stats').querySelectorAll('.ct-pm').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-k'), d = +b.getAttribute('data-d') * C.step, v = draft.r[k] + d;
        if (v < C.min || v > cap().max || (d > 0 && left() < d)) return;
        draft.r[k] = v;
        SR.audio.play('click');
        render();
      });
    });
  }

  // Team level: coins buy more skill points and a higher cap for every skill.
  function upgradeBox() {
    var box = $('ct-upgrade');
    if (!box) return;
    var cp = cap(), lv = cp.lvl, full = lv >= C.levels, cost = C.upgradeCost(lv), pips = '';
    for (var i = 0; i < C.levels; i++) pips += '<i class="' + (i < lv ? 'on' : '') + '"></i>';
    box.innerHTML = '<div class="ug-head"><b>Team level ' + (lv + 1) + '</b><span class="ug-pips" aria-label="Level ' + (lv + 1) + ' of ' + (C.levels + 1) + '">' + pips + '</span></div>' +
      '<p class="muted small">' + (full ? 'Max level! Every skill can reach ' + cp.max + '.' : 'Next level: +' + C.perLevel + ' skill points to share and every skill can go to ' + (cp.max + 1) + '.') + '</p>' +
      (full ? '' : '<button id="btn-ct-upgrade" type="button" class="btn ug-btn">Upgrade for ' + SR.COIN + ' <b>' + SR.fmtNum(cost) + '</b></button>');
    var b = $('btn-ct-upgrade');
    if (b) b.addEventListener('click', function () {
      confirmBuy({ name: 'Team level ' + (lv + 2), verb: 'Get', yes: 'Yes, upgrade', price: cost, coins: true, art: shield(draftTeam(), 'ct-shield'),
        what: 'You get ' + C.perLevel + ' more skill points to share out.',
        onBuy: function () {
          cfg().lvl = lv + 1;
          draft.lvl = lv + 1;
          var sv = JSON.parse(saved); sv.lvl = lv + 1; saved = JSON.stringify(sv);
          SR.ui.save();
          SR.audio.play('reward');
          render();
          var e = $('ct-left');
          if (e) { e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); }
        } });
    });
  }
  function draftTeam() { return { id: 'custom', name: draft.name, short: draft.short, color: draft.color, trim: draft.trim, pattern: draft.pattern }; }

  function readText() {
    var n = SR.customName($('ct-name').value);
    draft.name = n || 'My Club';
    var s = SR.customShort($('ct-short').value);
    draft.short = s || SR.customShort(draft.name) || 'MYC';
  }

  function saveTeam() {
    readText();
    var c = cfg();
    ['name', 'short', 'color', 'trim', 'pattern'].forEach(function (k) { c[k] = draft[k]; });
    // Upgrades are bought (and saved) at once, so the draft never undoes them.
    draft.lvl = c.lvl;
    c.r = Object.assign({}, draft.r);
    data().settings.team = 'custom';
    SR.ui.save();
    SR.audio.play('reward');
    var go = backTo; draft = null;
    go();
  }

  function leave() {
    if (!draft) return;
    readText();
    draft.lvl = cfg().lvl;
    if (JSON.stringify(draft) === saved) { var go = backTo; draft = null; SR.audio.play('click'); go(); return; }
    ask({ title: 'Leave without saving?', text: 'Your changes to <b>' + esc(draft.name) + '</b> will be lost.', yes: 'Yes, leave', no: 'No, keep editing',
      onYes: function () { var g = backTo; draft = null; g(); } });
  }

  function init() {
    var box = $('confirm');
    if (box) {
      $('confirm-yes').addEventListener('click', function () { close(true); });
      $('confirm-no').addEventListener('click', function () { SR.audio.play('click'); close(false); });
      box.addEventListener('click', function (e) { if (e.target === box && dlg) { if (dlg.no === false) close(true); else close(false); } });
      document.addEventListener('keydown', function (e) {
        if (!dlg) return;
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (dlg.no === false) close(true); else close(false); }
      }, true);
    }
    if (!$('scr-custom')) return;
    $('ct-name').addEventListener('input', function () {
      if (!draft) return; // the builder isn't open
      draft.name = SR.customName($('ct-name').value) || 'My Club';
      // Keep the short name following the name until it's typed by hand.
      if (!$('ct-short').dataset.manual) { draft.short = SR.customShort(draft.name) || draft.short; $('ct-short').value = draft.short; }
      render();
    });
    $('ct-short').addEventListener('input', function () {
      if (!draft) return;
      $('ct-short').value = $('ct-short').value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
      $('ct-short').dataset.manual = '1';
      var s = SR.customShort($('ct-short').value);
      if (s) { draft.short = s; render(); }
    });
    $('ct-short').addEventListener('blur', function () { if (draft) $('ct-short').value = draft.short; });
    $('btn-custom-save').addEventListener('click', saveTeam);
    $('btn-custom-back').addEventListener('click', leave);
    $('btn-custom-cancel').addEventListener('click', leave);
  }

  SR.confirmBuy = confirmBuy;
  SR.custom = {
    init: init,
    card: card,
    shopCard: shopCard,
    open: function (back) { open(back); },
    unlock: unlock,
    shield: shield,
    blank: function () { return BLANK; },
    // The home screen's "My team" strip.
    fromHome: function () {
      var back = function () { SR.ui.show('scr-menu'); };
      if (unlocked()) open(back); else unlock(back);
    },
    ask: ask,
    isOpen: function () { return !!dlg; }
  };
})();
