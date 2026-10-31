// Daily reward calendar: a 7-day strip of gifts (SR.DAILY in data.js). One gift
// can be claimed per calendar day; skipping a day starts the streak again
// from Day 1. Opens by itself the first time the home menu shows while a gift
// is waiting. Saved with the rest of the progress (CrazyGames data module).
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var won = null, timer = 0, autoPending = false;

  function data() { return SR.save.data; }
  function daily() {
    var d = data().daily;
    if (!d || typeof d !== 'object') d = data().daily = { streak: 0, last: null, week: 0, claimed: [] };
    if (!Array.isArray(d.claimed)) d.claimed = [];
    return d;
  }

  // Local calendar day as 'YYYY-MM-DD' and as a day number for differences.
  function dayKey(t) {
    var d = t || new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function dayNum(key) {
    var p = String(key).split('-');
    return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 864e5);
  }

  // Where the calendar stands today. index is the day (0-6) that is ready or,
  // once claimed, the day claimed today. broken: a streak was lost.
  function state() {
    var d = daily(), gap = d.last ? dayNum(dayKey()) - dayNum(d.last) : Infinity;
    if (gap <= 0) return { ready: false, index: (d.streak - 1 + 7) % 7, done: d.streak > 0 ? (d.streak - 1) % 7 + 1 : 0 };
    if (gap === 1) { var i = d.streak % 7; return { ready: true, index: i, done: i }; }
    return { ready: true, index: 0, done: 0, broken: d.streak > 0 };
  }

  function owns(kind, id) { return (data().owned[kind] || []).indexOf(id) >= 0; }
  function item(kind, id) { return SR.SHOP[kind].find(function (x) { return x.id === id; }); }

  // The first item of a list not owned yet, starting at this week's turn.
  function nextItem(list, kind, week) {
    for (var k = 0; k < list.length; k++) {
      var e = list[(week + k) % list.length], kd = kind || e[0], id = kind ? e : e[1];
      if (!owns(kd, id)) return { kind: kd, id: id };
    }
    return null;
  }

  // What day i of the current week gives: stars, and maybe an item. A day
  // already claimed this week shows what it actually gave.
  function reward(i) {
    var def = SR.DAILY.days[i], d = daily(), week = d.week, out = { stars: def.stars || 0, item: null };
    var got = i < state().done && d.claimed[i];
    if (got) return { stars: got.stars, item: got.item || null };
    if (def.item) {
      var it = def.item === 'ball' ? nextItem(SR.DAILY.balls, 'balls', week)
        : def.item === 'kit' ? nextItem(SR.DAILY.kits, 'kits', week)
        : nextItem(SR.DAILY.legends, null, week);
      if (it) out.item = it; else out.stars += SR.DAILY.owned[def.item];
    }
    return out;
  }

  // "Ember ball", "Flame jersey" in the player's language.
  function itemName(it) {
    return SR.t(it.kind === 'balls' ? '{name} ball' : '{name} jersey', { name: SR.t(item(it.kind, it.id).name) });
  }

  // ---- art ------------------------------------------------------------------

  var jn = 0;
  function jersey(k, cls) {
    // Each drawing needs its own clip id (and ids can't hold spaces).
    var cid = 'jc-' + String(k.id || 'x').replace(/\W+/g, '') + '-' + (++jn);
    var pat = k.pattern === 'stripes' ? '<path d="M17 10h4v40h-4zM27 10h4v40h-4zM37 10h4v40h-4z" fill="' + k.trim + '"/>'
      : k.pattern === 'hoops' ? '<path d="M6 24h48v5H6zM6 35h48v5H6z" fill="' + k.trim + '"/>'
      : '<path d="M30 6h24v48H30z" fill="' + k.trim + '" opacity=".55"/>';
    return '<svg class="' + (cls || 'jersey-art') + '" viewBox="0 0 60 56" aria-hidden="true"><defs><clipPath id="' + cid + '">' +
      '<path d="M19 4l-13 7-5 14 9 4 2-6v29h36V23l2 6 9-4-5-14-13-7c-1 4-5 7-11 7s-10-3-11-7z"/></clipPath></defs>' +
      '<g clip-path="url(#' + cid + ')"><rect width="60" height="56" fill="' + k.color + '"/>' + pat + '</g>' +
      '<path d="M19 4l-13 7-5 14 9 4 2-6v29h36V23l2 6 9-4-5-14-13-7c-1 4-5 7-11 7s-10-3-11-7z" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/>' +
      '<path d="M19 4c1 4 5 7 11 7s10-3 11-7" fill="none" stroke="' + k.trim + '" stroke-width="2.4"/></svg>';
  }

  function ball(b) {
    return '<span class="ball-art" style="--m:' + b.main + ';--s:' + b.stripe + '"></span>';
  }

  function coins(n) {
    var c = n >= 10 ? 3 : n >= 5 ? 2 : 1, h = '';
    for (var i = 0; i < c; i++) h += '<i style="--i:' + i + '">★</i>';
    return '<span class="coin-art c' + c + '">' + h + '</span>';
  }

  var CHEST = '<svg class="chest-art" viewBox="0 0 64 56" aria-hidden="true">' +
    '<path d="M6 24h52v26a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" fill="#b5651d"/><path d="M6 24h52v6H6z" fill="#8a4a12"/>' +
    '<path d="M6 24C6 12 14 6 32 6s26 6 26 18z" fill="#d9822b"/><path d="M14 10v14M50 10v14" stroke="#ffd23f" stroke-width="4"/>' +
    '<path d="M6 24h52M14 24v29M50 24v29" stroke="#ffd23f" stroke-width="4" fill="none"/>' +
    '<rect x="26" y="20" width="12" height="14" rx="2" fill="#ffd23f" stroke="#8a4a12" stroke-width="1.5"/><circle cx="32" cy="27" r="2.2" fill="#8a4a12"/></svg>';

  function art(r, i) {
    if (i === 6) return CHEST;
    if (r.item) return r.item.kind === 'balls' ? ball(item('balls', r.item.id)) : jersey(item('kits', r.item.id), 'jersey-art');
    return coins(r.stars);
  }

  function prizeText(r) {
    var star = r.stars ? SR.t('+{n} stars', { n: r.stars }) : '';
    if (!r.item) return SR.t('You got {prize}.', { prize: star });
    return star ? SR.t('You got {stars} and the {item}.', { stars: star, item: itemName(r.item) }) : SR.t('You got the {item}.', { item: itemName(r.item) });
  }

  // ---- screen ---------------------------------------------------------------

  function render() {
    var s = state(), list = $('daily-strip'), streak = s.done;
    $('daily-sub').textContent = streak ? SR.t(streak > 1 ? 'Streak: {n} days. Keep it going!' : 'Streak: {n} day. Keep it going!', { n: streak }) : SR.t('Come back every day for a bigger gift.');
    $('daily-note').classList.toggle('hidden', !s.broken);
    $('daily-note').textContent = SR.t('You missed a day, so the streak started again at Day 1.');
    list.innerHTML = SR.DAILY.days.map(function (def, i) {
      var r = reward(i), st = i < s.done ? 'done' : (s.ready && i === s.index) ? 'today' : 'locked';
      var extra = i === 6 && r.item ? '<span class="dd-plus">+ ' + itemName(r.item) + '</span>' : '';
      var what = i === 6 || !r.item ? '+' + r.stars + ' ★' : itemName(r.item);
      return '<li class="dday ' + st + (i === 6 ? ' big' : '') + (r.item && i !== 6 ? ' item' : '') + '" style="--d:' + i + '">' +
        (i === 6 ? '<span class="dd-sh" aria-hidden="true"><i></i></span>' : '') +
        '<span class="dd-day">' + SR.t('Day {n}', { n: i + 1 }) + '</span>' +
        '<span class="dd-art">' + art(r, i) + '</span>' +
        '<span class="dd-what">' + (i === 6 ? '<b>' + SR.t('Mega chest') + '</b>' : '') + what + '</span>' + extra +
        (st === 'done' ? '<span class="dd-check" aria-label="' + SR.t('Claimed') + '">✓</span>' : '') +
        '</li>';
    }).join('');
    $('btn-daily-claim').classList.toggle('hidden', !s.ready);
    $('btn-daily-claim').textContent = SR.t('Claim Day {n}', { n: s.index + 1 });
    $('daily-next').classList.toggle('hidden', s.ready);
    tick();
    refreshDot();
  }

  // Countdown to local midnight, when the next gift opens.
  function tick() {
    var s = state();
    if (s.ready) return;
    var now = new Date(), mid = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    var ms = mid - now, h = Math.floor(ms / 36e5), m = Math.floor(ms % 36e5 / 6e4);
    var left = '<b>' + (h ? h + 'h ' : '') + m + 'm</b>';
    $('daily-next').innerHTML = s.index === 6 ? SR.t('Week complete! A new week opens in {time}', { time: left }) : SR.t('Day {n} opens in {time}', { n: s.index + 2, time: left });
  }

  // A one-line reminder of the calendar on the home and result screens:
  // today's gift while it waits, then tomorrow's, as a reason to come back.
  function shortPrize(r) {
    var p = [];
    if (r.stars) p.push('+' + r.stars + ' ★');
    if (r.item) p.push(itemName(r.item));
    return p.join(' + ');
  }
  var GIFT = '<span class="dt-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3.5" y="9" width="17" height="11.5" rx="2"/><path d="M2.5 9h19v-3h-19zM12 6v14.5"/>' +
    '<path d="M12 6c-1.6-3.4-6-3.6-5.4-.9C6.9 6.3 9.6 6.1 12 6zM12 6c1.6-3.4 6-3.6 5.4-.9-.3 1.2-3 1-5.4.9z"/></svg></span>';
  function teaser(el) {
    if (!el) return;
    var s = state(), i = s.ready ? s.index : daily().streak % 7;
    var title = s.ready ? SR.t('Day {n} gift ready', { n: i + 1 }) : SR.t('Tomorrow: Day {n} gift', { n: i + 1 });
    var sub = (i === 6 ? SR.t('Mega chest') + ' · ' : '') + shortPrize(reward(i)) + ' · ' + SR.t(s.ready ? 'Tap to claim' : 'Come back to keep your streak');
    el.innerHTML = GIFT + '<span class="dt-txt"><b>' + title + '</b><small>' + sub + '</small></span><span class="dt-go" aria-hidden="true">›</span>';
    el.classList.toggle('ready', !!s.ready);
    el.classList.remove('hidden');
  }

  function refreshDot() {
    var b = $('btn-daily');
    teaser($('home-daily'));
    teaser($('result-daily'));
    if (!b) return;
    b.classList.toggle('ready', state().ready);
    b.title = SR.t('Daily rewards');
  }

  function claim() {
    var s = state();
    if (!s.ready) return;
    var d = daily(), r = reward(s.index);
    data().stars += r.stars;
    if (r.item && !owns(r.item.kind, r.item.id)) data().owned[r.item.kind].push(r.item.id);
    if (s.index === 0) d.claimed = [];
    d.claimed[s.index] = { stars: r.stars, item: r.item };
    d.streak = s.index + 1;
    if (s.index === 6) d.week++;
    d.last = dayKey();
    SR.ui.save();
    SR.audio.play('reward');
    won = r;
    render();
    // Reveal the prize on top of the calendar.
    var box = $('daily-won');
    $('daily-won-art').innerHTML = s.index === 6 && r.item ? CHEST + '<span class="won-item">' + art({ item: r.item }, 0) + '</span>' : art(r, s.index);
    $('daily-won-title').textContent = s.index === 6 ? SR.t('Mega chest!') : SR.t('Day {n} reward', { n: s.index + 1 });
    $('daily-won-text').textContent = prizeText(r);
    $('btn-daily-equip').classList.toggle('hidden', !r.item);
    box.classList.remove('hidden');
    box.classList.toggle('mega', s.index === 6);
    var cell = $('daily-strip').children[s.index];
    if (cell) cell.classList.add('just');
    $('btn-daily-ok').focus({ preventScroll: true });
  }

  function equip() {
    if (!won || !won.item) return close();
    data().equipped[won.item.kind === 'balls' ? 'ball' : 'kit'] = won.item.id;
    SR.ui.save();
    close();
  }

  var back = 'scr-menu';
  function open() {
    var cur = SR.ui.current();
    autoPending = false;
    back = cur && cur !== 'scr-daily' ? cur : 'scr-menu';
    won = null;
    $('daily-won').classList.add('hidden');
    render();
    SR.ui.show('scr-daily');
    clearInterval(timer);
    timer = setInterval(function () { if (SR.ui.current() === 'scr-daily') tick(); else clearInterval(timer); }, 20000);
  }

  function close() {
    clearInterval(timer);
    $('daily-won').classList.add('hidden');
    if (back === 'scr-shop' && SR.ui.renderShop) SR.ui.renderShop();
    SR.ui.show(back);
  }

  function on(id, fn) { $(id).addEventListener('click', function () { SR.audio.play('click'); fn(); }); }

  SR.daily = {
    open: open,
    teaser: teaser,
    jersey: jersey,
    state: state,
    // Saved data changed (CrazyGames sign-in) or the language did.
    refresh: function () {
      refreshDot();
      if (SR.ui.current() === 'scr-daily' && $('daily-won').classList.contains('hidden')) render();
    },
    // The home menu just opened: show the calendar once if a gift is waiting.
    onMenu: function () {
      // A brand-new player goes straight to their first match; the calendar
      // waits until they come back to the menu after it.
      if (!autoPending || !state().ready || !data().stats.matches) return;
      autoPending = false;
      setTimeout(function () { if (SR.ui.current() === 'scr-menu' && !SR.game) open(); }, 600);
    },
    init: function (q) {
      on('btn-daily', open);
      on('home-daily', open);
      on('result-daily', open);
      on('btn-daily-x', close);
      on('btn-daily-ok', close);
      on('btn-daily-equip', equip);
      $('btn-daily-claim').addEventListener('click', claim);
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && SR.ui.current() === 'scr-daily') { e.preventDefault(); close(); }
      });
      refreshDot();
      // The red dot also lights up when the game stays open past midnight.
      setInterval(refreshDot, 60000);
      // Not for the how-to-play demo link; otherwise the calendar opens the
      // first time a player who has finished a match reaches the home menu.
      autoPending = !(q && q.get('demo') !== null);
      if (SR.ui.current() === 'scr-menu') SR.daily.onMenu();
    }
  };
})();
