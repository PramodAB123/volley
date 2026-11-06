// Right-side ad rail: one AdSense unit to the right of the game, on desktop
// only (a mouse and a window at least 1200 x 620). Phones, tablets and small
// windows get no ad, so the game keeps the full screen. Nothing covers the court.
// The "game right" unit is shown at a fixed 300 x 600 on wide screens
// (1500 px and up) and 160 x 600 below that.
(function () {
  var CLIENT = 'ca-pub-1426010855335025';
  var SLOT_RIGHT = '9064309012'; // "game right" ad unit
  var MIN_W = 1200, MIN_H = 620;
  if (!SLOT_RIGHT) return;

  var root = document.documentElement, filled = false, on = null;
  var desktop = !window.matchMedia || window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function fill() {
    var box = document.getElementById('ad-rail-r');
    if (!box) return;
    // The ad size is fixed once it is requested, so pick it from the window now.
    var w = window.innerWidth >= 1500 ? 300 : 160;
    root.style.setProperty('--rail', (w + 16) + 'px');
    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.cssText = 'display:inline-block;width:' + w + 'px;height:600px';
    ins.setAttribute('data-ad-client', CLIENT);
    ins.setAttribute('data-ad-slot', SLOT_RIGHT);
    box.appendChild(ins);
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }

  function update() {
    var wide = desktop && window.innerWidth >= MIN_W && window.innerHeight >= MIN_H;
    if (wide === on) return;
    on = wide;
    // AdSense cannot size an ad in a hidden box, so the unit is only created
    // once the rail is visible.
    if (wide && !filled) { filled = true; fill(); }
    root.classList.toggle('ad-rails', wide);
    if (window.SR && SR.resize) { try { SR.resize(); } catch (e) {} }
  }

  update();
  window.addEventListener('resize', update);
  window.addEventListener('load', update);
})();
