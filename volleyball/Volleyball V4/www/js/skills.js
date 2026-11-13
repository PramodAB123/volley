// Skill packs: bought once in the Shop (coins or diamonds), then switched on
// in a skill slot. Two slots to start, a third can be bought. Special smashes
// (Fire, Water Splash, Ice, Wind, Thunder) charge after points in a row and
// only one of them can be on. The packs (SR.SKILLS in data.js) only help the
// team you control against the CPU; rally.js applies them (R.skill, R.special).
(function () {
  function $(id) { return document.getElementById(id); }
  function data() { return SR.save.data; }
  function sk() { return data().skills; }

  var ICONS = {
    ace: '<circle cx="24" cy="24" r="11" fill="#fff"/><path d="M15 20c6 3 12 3 18 0M15 28c6-3 12-3 18 0" stroke="#1d6fd6" stroke-width="2.4" fill="none"/><circle cx="24" cy="24" r="17" fill="none" stroke="#fff" stroke-width="2.2" stroke-dasharray="4 4"/>',
    power: '<circle cx="28" cy="24" r="10" fill="#fff"/><path d="M28 14v20M19 20c6 2 12 2 18 0" stroke="#e8590c" stroke-width="2.2" fill="none"/><path d="M5 17h10M3 24h11M5 31h10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>',
    feet: '<path d="M8 30c0-4 3-6 7-7l7-8c2 3 6 5 10 5 5 0 8 3 8 7v3H8z" fill="#fff"/><path d="M8 33h32" stroke="#0f7a55" stroke-width="3"/><path d="M4 18h8M2 24h7" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>',
    wall: '<path d="M7 12h34v24H7z" fill="#fff"/><path d="M7 20h34M7 28h34M18 12v8M30 12v8M12 20v8M24 20v8M36 20v8M18 28v8M30 28v8" stroke="#55657a" stroke-width="2"/>',
    set: '<path d="M24 7l5 10.5 11.5 1.6-8.3 8 2 11.4L24 33l-10.2 5.5 2-11.4-8.3-8L19 17.5z" fill="#fff"/><circle cx="24" cy="24" r="4" fill="#e0a800"/>',
    fire: '<path d="M24 5c2 7 10 10 10 20a10 10 0 0 1-20 0c0-5 3-8 4-11 1 3 3 5 5 5-2-5-1-10 1-14z" fill="#ffd23f"/><path d="M24 22c1 4 5 5 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9z" fill="#fff"/>',
    water: '<path d="M4 30c5-5 9-5 13 0s9 5 13 0 9-5 14 0v8H4z" fill="#fff"/><path d="M24 6c5 7 8 11 8 15a8 8 0 0 1-16 0c0-4 3-8 8-15z" fill="#bfeaff"/><circle cx="21" cy="21" r="2" fill="#fff"/>',
    ice: '<g stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M24 6v36M8.4 15l31.2 18M8.4 33l31.2-18"/><path d="M19 9l5 4 5-4M19 39l5-4 5 4M9 21l6-1 1-6M39 27l-6 1-1 6M9 27l6 1 1 6M39 21l-6-1-1-6" fill="none" stroke-width="2.2"/></g>',
    wind: '<path d="M5 18h24a6 6 0 1 0-6-6M5 26h32a6 6 0 1 1-6 6M5 34h14" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>',
    thunder: '<path d="M27 4L11 27h11l-4 17 18-25H25z" fill="#ffe14d" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>',
    slot: '<rect x="9" y="9" width="30" height="30" rx="8" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="5 4"/><path d="M24 17v14M17 24h14" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>'
  };

  function icon(k, cls) {
    var c = k ? k.color : '#ffd23f', id = k ? k.id : 'slot';
    return '<span class="sk-ico' + (cls ? ' ' + cls : '') + '" style="--sk:' + c + '"><svg viewBox="0 0 48 48" aria-hidden="true">' + ICONS[id] + '</svg></span>';
  }

  function owns(id) { return sk().owned.indexOf(id) >= 0; }
  function isOn(id) { return sk().on.indexOf(id) >= 0; }

  // The packs switched on right now (only owned ones, at most the slots).
  function active() {
    try { return sk().on.filter(function (id) { return owns(id) && SR.skillById(id); }).slice(0, sk().slots); } catch (e) { return []; }
  }

  var note = '';

  // Switch a pack on. A special smash swaps out the other one; when the slots
  // are full the player turns one off first. Returns true when it is on.
  function turnOn(id) {
    var k = SR.skillById(id), on = sk().on;
    if (!k || !owns(id) || isOn(id)) return isOn(id);
    if (k.special) {
      var other = on.filter(function (x) { var o = SR.skillById(x); return o && o.special; })[0];
      if (other) { on.splice(on.indexOf(other), 1, id); note = k.name + ' replaces ' + SR.skillById(other).name + '. Only one special smash can be on.'; return true; }
    }
    if (on.length >= sk().slots) { note = 'All ' + sk().slots + ' slots are in use. Turn a pack off first.'; return false; }
    on.push(id);
    note = '';
    return true;
  }

  function turnOff(id) { var on = sk().on, i = on.indexOf(id); if (i >= 0) on.splice(i, 1); note = ''; }

  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); setTimeout(function () { el.classList.remove('shake'); }, 400); }

  // which: 'skills' | 'smashes' | undefined (both).
  function shopCard(box, which) {
    if (!box) return;
    var S = SR.SKILLS, used = active().length, slots = sk().slots;
    var dots = '';
    for (var i = 0; i < slots; i++) dots += '<i class="' + (i < used ? 'full' : '') + '"></i>';
    var html = '<div class="sk-head"><span class="sk-slots">' + dots + '</span><span><b>' + used + ' of ' + slots + ' slots on.</b> ' +
      'Skills help only your team. Special smashes charge after ' + S.smashStreak + ' points in a row, and one can be on at a time.</span></div>' +
      (note ? '<p class="sk-note">' + esc(note) + '</p>' : '');
    var groups = [['Skills', S.list.filter(function (k) { return !k.special; })], ['Special smashes', S.list.filter(function (k) { return k.special; })]];
    if (which === 'skills') groups = [groups[0]]; else if (which === 'smashes') groups = [groups[1]];
    groups.forEach(function (g) {
      html += (which ? '' : '<h4 class="sk-sub">' + g[0] + '</h4>') + '<div class="sk-list">';
      g[1].forEach(function (k) {
        var have = owns(k.id), on = have && isOn(k.id), coin = !!k.coins;
        var btn = !have ? '<span class="sk-btn buy ' + (coin ? 'p-coin' : 'p-gem') + '">' + (coin ? SR.COIN : SR.GEM) + ' ' + SR.fmtNum(coin ? k.coins : k.price) + '</span>'
          : on ? '<span class="sk-btn on">On</span>' : '<span class="sk-btn off">Turn on</span>';
        html += '<button type="button" class="sk-card' + (have ? ' owned' : ' locked') + (on ? ' active' : '') + (k.special ? ' special' : '') + '" data-sk="' + k.id + '">' +
          icon(k) + '<span class="sk-txt"><b>' + esc(k.name) + (have ? '' : ' <i class="sk-lock" aria-label="Locked"></i>') + '</b><span>' + esc(k.text) + '</span></span>' + btn + '</button>';
      });
      html += '</div>';
    });
    if (slots < S.maxSlots && which !== 'smashes') {
      html += '<button type="button" class="sk-card slot-card" data-sk="_slot">' + icon(null) + '<span class="sk-txt"><b>Extra skill slot</b><span>Have ' + (slots + 1) + ' packs on at once.</span></span>' +
        '<span class="sk-btn buy p-gem">' + SR.GEM + ' ' + S.slotPrice + '</span></button>';
    }
    box.innerHTML = html;
    Array.prototype.forEach.call(box.querySelectorAll('[data-sk]'), function (b) {
      b.addEventListener('click', function () { tap(b, b.getAttribute('data-sk')); });
    });
  }

  function refresh() { SR.ui.save(); if (SR.ui.renderShop) SR.ui.renderShop(); }

  function tap(b, id) {
    var S = SR.SKILLS;
    if (id === '_slot') {
      if (data().stars < S.slotPrice) shake(b);
      SR.confirmBuy({ name: 'an extra skill slot', price: S.slotPrice, art: icon(null, 'big'), what: 'You can then have ' + (sk().slots + 1) + ' skill packs on at once.',
        onBuy: function () { sk().slots = Math.min(S.maxSlots, sk().slots + 1); note = ''; SR.audio.play('reward'); refresh(); } });
      return;
    }
    var k = SR.skillById(id);
    if (!k) return;
    if (!owns(id)) {
      var coin = !!k.coins, price = coin ? k.coins : k.price;
      if (data()[coin ? 'coins' : 'stars'] < price) shake(b);
      SR.confirmBuy({ name: k.name, price: price, coins: coin, art: icon(k, 'big'), what: k.text + ' It is switched on if you have a free slot.',
        onBuy: function () {
          sk().owned.push(id);
          turnOn(id);
          SR.audio.play('reward');
          refresh();
        } });
      return;
    }
    if (isOn(id)) { turnOff(id); SR.audio.play('click'); refresh(); return; }
    if (turnOn(id)) { SR.audio.play('click'); refresh(); }
    else { SR.audio.play('click'); refresh(); var nb = document.querySelector('.sk-card[data-sk="' + id + '"]'); if (nb) shake(nb); }
  }

  SR.skills = { active: active, owns: owns, isOn: isOn, turnOn: turnOn, turnOff: turnOff, shopCard: shopCard, icon: icon };
})();
