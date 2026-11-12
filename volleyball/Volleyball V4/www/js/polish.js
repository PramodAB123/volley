// Small UI pieces added with the 2026-11-12 redesign: the Difficulty segmented
// control and the How to play row in Settings, and the Stats tabs.
(function () {
  var $ = function (id) { return document.getElementById(id); };

  // Difficulty: one button per option of the (hidden) select, which ui.js fills
  // and listens to, so saving works exactly as before.
  function diffSeg() {
    var sel = $('set-diff'), seg = $('set-diff-seg');
    if (!sel || !seg) return;
    seg.innerHTML = Array.prototype.map.call(sel.options, function (o) {
      var on = o.value === sel.value;
      return '<button type="button" role="radio" data-v="' + o.value + '" aria-checked="' + on + '" class="' + (on ? 'on' : '') + '">' + o.textContent + '</button>';
    }).join('');
    seg.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        if (sel.value === b.getAttribute('data-v')) return;
        SR.audio.play('click');
        sel.value = b.getAttribute('data-v');
        sel.dispatchEvent(new Event('change'));
        diffSeg();
      });
    });
  }

  // Stats: Overview / Trophies tabs. Opening Stats always starts on Overview.
  function statsTab(id) {
    document.querySelectorAll('.st-tabs [role=tab]').forEach(function (t) {
      var on = t.id === id;
      t.classList.toggle('on', on); t.setAttribute('aria-selected', on);
      var pane = $(t.getAttribute('data-pane')); if (pane) pane.classList.toggle('hidden', !on);
    });
    var pn = document.querySelector('#scr-stats .panel'); if (pn) pn.scrollTop = 0;
  }

  function init() {
    document.querySelectorAll('.st-tabs [role=tab]').forEach(function (t) {
      t.addEventListener('click', function () { if (t.classList.contains('on')) return; SR.audio.play('click'); statsTab(t.id); });
    });
    var sb = $('btn-stats');
    if (sb) sb.addEventListener('click', function () { statsTab('st-tab-ov'); });
    var st = $('btn-settings');
    if (st) st.addEventListener('click', function () { setTimeout(diffSeg, 0); });
    var help = $('btn-set-help');
    if (help) help.addEventListener('click', function () { SR.audio.play('click'); SR.ui.show('scr-help'); var h = document.querySelector('#scr-help .panel'); if (h) h.scrollTop = 0; });
    diffSeg();
  }

  window.addEventListener('load', init);
})();
