// Side ad rails: one AdSense unit left and one right of the game, on desktop
// only (a mouse and a window at least 1200 x 620). Phones, tablets and small
// windows get no ad, so the game keeps the full screen. Nothing covers the court.
// Each ad is a fixed 300 x 600 on very wide screens (when the court still
// fits wide between them) and 160 x 600 otherwise. The left side reuses the "game right" unit until a
// separate "game left" unit is made in AdSense: paste its slot in SLOT_LEFT.
(function () {
  var CLIENT = 'ca-pub-1426010855335025';
  var SLOT_RIGHT = '9064309012'; // "game right" ad unit
  var SLOT_LEFT = '9064309012';  // swap for a "game left" unit's slot
  var MIN_W = 1200, MIN_H = 620;
  if (!SLOT_RIGHT && !SLOT_LEFT) return;

  var root = document.documentElement, filled = false, on = null;
  var desktop = !window.matchMedia || window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function fill(id, slot, w) {
    var box = document.getElementById(id);
    if (!box || !slot) return;
    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.cssText = 'display:inline-block;width:' + w + 'px;height:600px';
    ins.setAttribute('data-ad-client', CLIENT);
    ins.setAttribute('data-ad-slot', slot);
    box.appendChild(ins);
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }

  function update() {
    var wide = desktop && window.innerWidth >= MIN_W && window.innerHeight >= MIN_H;
    if (wide === on) return;
    on = wide;
    // AdSense cannot size an ad in a hidden box, so the unit is only created
    // once the rail is visible.
    if (wide && !filled) {
      filled = true;
      // The ad size is fixed once it is requested, so pick it from the window now.
      // 300 wide only when the game still keeps a wide court between the two ads.
      var w = (window.innerWidth - 632) / window.innerHeight >= 1.4 ? 300 : 160;
      root.style.setProperty('--rail', (w + 16) + 'px');
      fill('ad-rail-l', SLOT_LEFT, w); fill('ad-rail-r', SLOT_RIGHT, w);
    }
    root.classList.toggle('ad-rails', wide);
    if (window.SR && SR.resize) { try { SR.resize(); } catch (e) {} }
  }

  update();
  window.addEventListener('resize', update);
  window.addEventListener('load', update);
})();
