// Custom team: your own club with its name, short code, jersey colours,
// pattern and skill points. Unlocked once for SR.CUSTOM.price stars from the
// team picker or the Shop. Every star purchase asks Yes / No first
// (SR.confirmBuy, also used by the Shop). Offline modes only. Every string
// goes through SR.t (js/i18n.js).
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var C = SR.CUSTOM, t_ = function (k, v) { return SR.t(k, v); };
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
    $('confirm-yes').textContent = o.yes || t_('Yes');
    $('confirm-no').textContent = o.no || t_('No');
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

  // A star purchase: Yes / No with the price and what is left after it, or a
  // notice when there aren't enough stars. onBuy runs after the stars are
  // taken (and saved by the caller).
  function confirmBuy(o) {
    var have = data().stars, art = o.art || '';
    SR.audio.play('click');
    if (have < o.price) {
      ask({ title: t_('Not enough stars'), art: art, no: false, yes: t_('OK'),
        text: t_('{item} costs {price}. You have {have}, so you need {n} more.', { item: '<b>' + esc(o.name) + '</b>', price: '<b class="cf-star">★ ' + o.price + '</b>', have: '<b class="cf-star">★ ' + have + '</b>', n: '<b>' + (o.price - have) + '</b>' }) +
          '<br><span class="muted small">' + t_('Win matches, play the daily challenge and open your daily gift to earn stars.') + '</span>' });
      return;
    }
    ask({ title: t_('Buy {item}?', { item: o.name }), art: art, yes: t_('Yes, buy'), no: t_('No'),
      text: t_('This costs {price}.', { price: '<b class="cf-star">★ ' + o.price + '</b>' }) + (o.what ? ' ' + o.what : '') +
        '<span class="cf-bal"><span>' + t_('You have {n}', { n: '<b>★ ' + have + '</b>' }) + '</span><span>' + t_('After buying {n}', { n: '<b>★ ' + (have - o.price) + '</b>' }) + '</span></span>',
      onYes: function () {
        if (data().stars < o.price) return;
        data().stars -= o.price;
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
      name: t_('Custom team'), price: C.price, art: BLANK,
      what: t_('Make your own club: name, short name, jersey colours, pattern and skill points. Edit it any time for free.'),
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
        '<span class="ct-txt"><span class="tname">' + t_('Custom team') + '</span><span class="tstats">' + t_('Your own name, colours and skill points') + '</span></span>' +
        '<span class="ct-price"><span class="ct-lock">' + LOCK + '</span>' + t_('Unlock') + ' <b>★ ' + C.price + '</b></span></button>';
      el.querySelector('.ct-main').addEventListener('click', function () { unlock(teamsBack); });
      return el;
    }
    el.innerHTML = '<button type="button" class="ct-main">' +
      '<span class="ct-crest">' + shield(t, 'ct-shield') + '</span>' +
      '<span class="ct-txt"><span class="tname">' + esc(t.name) + ' <em class="ct-tag">' + t_('Custom') + '</em></span>' +
      '<span class="tstats">' + t_('ATK') + ' ' + t.r.attack + ' · ' + t_('BLK') + ' ' + t.r.block + ' · ' + t_('PASS') + ' ' + t.r.pass + ' · ' + t_('SRV') + ' ' + t.r.serve + ' · ' + t_('SPD') + ' ' + t.r.speed + '</span>' +
      '<span class="meter"><span style="width:' + meter(t.r) + '%"></span></span></span></button>' +
      '<button type="button" class="ct-edit" aria-label="' + t_('Edit custom team') + '">' + PEN + '<span>' + t_('Edit') + '</span></button>';
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
      '<span class="ct-txt"><b>' + (t ? esc(t.name) : t_('Custom team')) + '</b>' +
      '<span class="muted small">' + (t ? (mine ? t_('Your team.') + ' ' : '') + t_('Change the name, colours and skill points any time.') : t_('Build your own club and play it in every mode.')) + '</span></span>' +
      '<button type="button" class="btn ' + (t ? 'ghost' : 'primary') + ' ct-shop-btn">' + (t ? PEN + ' ' + t_('Edit team') : LOCK + ' ' + t_('Unlock') + ' ★ ' + C.price) + '</button></div>';
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

  function left() { return C.total - C.stats.reduce(function (s, st) { return s + draft.r[st[0]]; }, 0); }

  function render() {
    var t = { id: 'custom', name: draft.name, short: draft.short, color: draft.color, trim: draft.trim, pattern: draft.pattern };
    $('ct-preview').innerHTML = '<span class="ct-big-jersey">' + SR.daily.jersey(t, 'ct-jersey') + '<b style="color:' + draft.trim + '">' + 7 + '</b></span>' +
      '<span class="ct-big-crest">' + shield(t, 'ct-shield-big') + '</span>' +
      '<span class="ct-pv-name">' + esc(draft.name || 'My Club') + '</span>' +
      '<span class="ct-pv-short">' + esc(draft.short) + '</span>' +
      '<span class="ct-pv-pow"><small>' + t_('Team power') + '</small><span class="meter"><span style="width:' + meter(draft.r) + '%"></span></span></span>';
    swatches($('ct-colors'), C.colors, 'color');
    swatches($('ct-trims'), C.trims, 'trim');
    $('ct-pattern').innerHTML = C.patterns.map(function (p) {
      return '<button type="button" role="radio" aria-checked="' + (p[0] === draft.pattern) + '" class="' + (p[0] === draft.pattern ? 'on' : '') + '" data-v="' + p[0] + '">' + t_(p[1]) + '</button>';
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
      return '<button type="button" role="radio" aria-checked="' + (c === cur) + '" aria-label="' + t_('Colour') + ' ' + c + '" class="ct-sw' + (c === cur ? ' on' : '') + '" style="--c:' + c + '" data-v="' + c + '"></button>';
    }).join('') +
      '<label class="ct-sw ct-pick' + (custom ? ' on' : '') + '" style="--c:' + (custom ? cur : 'transparent') + '" title="' + t_('Any colour') + '"><input type="color" value="' + cur + '" aria-label="' + t_('Any colour') + '"><span aria-hidden="true">+</span></label>';
    box.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { draft[key] = b.getAttribute('data-v'); SR.audio.play('click'); render(); });
    });
    var inp = box.querySelector('input');
    inp.addEventListener('input', function () { if (/^#[0-9a-fA-F]{6}$/.test(inp.value)) { draft[key] = inp.value.toLowerCase(); render(); } });
  }

  function renderStats() {
    var free = left();
    $('ct-left').textContent = free === 1 ? t_('1 point left') : t_('{n} points left', { n: free });
    $('ct-left').classList.toggle('zero', free === 0);
    $('ct-stats').innerHTML = C.stats.map(function (st) {
      var v = draft.r[st[0]];
      var nm = t_(st[1]);
      return '<div class="ct-stat"><span class="ct-sn">' + nm + '</span>' +
        '<button type="button" class="ct-pm" data-k="' + st[0] + '" data-d="-1" aria-label="' + t_('Less') + ' ' + nm + '"' + (v - C.step < C.min ? ' disabled' : '') + '>−</button>' +
        '<span class="ct-bar"><i style="width:' + Math.round((v - C.min) / (C.max - C.min) * 100) + '%"></i></span>' +
        '<b class="ct-sv">' + v + '</b>' +
        '<button type="button" class="ct-pm" data-k="' + st[0] + '" data-d="1" aria-label="' + t_('More') + ' ' + nm + '"' + (v + C.step > C.max || free < C.step ? ' disabled' : '') + '>+</button></div>';
    }).join('');
    $('ct-stats').querySelectorAll('.ct-pm').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-k'), d = +b.getAttribute('data-d') * C.step, v = draft.r[k] + d;
        if (v < C.min || v > C.max || (d > 0 && left() < d)) return;
        draft.r[k] = v;
        SR.audio.play('click');
        render();
      });
    });
  }

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
    if (JSON.stringify(draft) === saved) { var go = backTo; draft = null; SR.audio.play('click'); go(); return; }
    ask({ title: t_('Leave without saving?'), text: t_('Your changes to {team} will be lost.', { team: '<b>' + esc(draft.name) + '</b>' }), yes: t_('Yes, leave'), no: t_('No, keep editing'),
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
      draft.name = SR.customName($('ct-name').value) || 'My Club';
      // Keep the short name following the name until it's typed by hand.
      if (!$('ct-short').dataset.manual) { draft.short = SR.customShort(draft.name) || draft.short; $('ct-short').value = draft.short; }
      render();
    });
    $('ct-short').addEventListener('input', function () {
      $('ct-short').value = $('ct-short').value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
      $('ct-short').dataset.manual = '1';
      var s = SR.customShort($('ct-short').value);
      if (s) { draft.short = s; render(); }
    });
    $('ct-short').addEventListener('blur', function () { $('ct-short').value = draft.short; });
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
    ask: ask,
    isOpen: function () { return !!dlg; }
  };
})();
