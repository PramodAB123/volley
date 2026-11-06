// Side ads, desktop only (a mouse and a window at least 1200 x 620).
//
// AdSense policy: Google ads may only sit next to real publisher content, never
// on game, menu, loading, pause or result screens. So:
// - Home page (index.html): the two ads live inside the article content below
//   the game (#landing, the guides, modes and FAQ). That content is hidden
//   whenever a match, the demo or any menu other than the main menu is open,
//   and the game screen itself never has an ad beside or over it.
// - Guide and info pages (<body data-ads="page">): one ad on each side of the
//   article.
// Phones, tablets and small windows get no ads.
// Each ad is a fixed 300 x 600 when the text still has room between the two,
// and 160 x 600 otherwise. The left side reuses the "game right" unit until a
// separate unit is made in AdSense: paste its slot in SLOT_LEFT.
(function () {
  var CLIENT = 'ca-pub-1426010855335025';
  var SLOT_RIGHT = '9064309012'; // "game right" ad unit
  var SLOT_LEFT = '9064309012';  // swap for a "game left" unit's slot
  var MIN_W = 1200, MIN_H = 620;
  if (!SLOT_RIGHT && !SLOT_LEFT) return;

  var root = document.documentElement, filled = false, timer = 0;
  var desktop = !window.matchMedia || window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var page = document.body && document.body.getAttribute('data-ads') === 'page';
  // Width of the text column the ads sit beside.
  var TEXT_W = page ? 820 : 1080;

  function wide() {
    return desktop && window.innerWidth >= MIN_W && window.innerHeight >= MIN_H;
  }

  // Guide pages build their two rails here; the home page has them in #landing.
  function rails() {
    if (page && !document.getElementById('ad-rail-l')) {
      ['l', 'r'].forEach(function (s) {
        var a = document.createElement('aside');
        a.id = 'ad-rail-' + s;
        a.className = 'ad-rail ad-rail-' + s;
        a.setAttribute('aria-label', 'Advertisement');
        a.innerHTML = '<div class="ad-stick"></div>';
        document.body.appendChild(a);
      });
    }
  }

  function fill(id, slot, w) {
    var box = document.getElementById(id);
    var stick = box && box.querySelector('.ad-stick');
    if (!stick || !slot) return;
    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.cssText = 'display:inline-block;width:' + w + 'px;height:600px';
    ins.setAttribute('data-ad-client', CLIENT);
    ins.setAttribute('data-ad-slot', slot);
    stick.appendChild(ins);
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }

  // The rails' box is only on screen while its content is shown (on the home
  // page that is only while the main menu and the content under it are open).
  function contentShown() {
    var box = document.getElementById('ad-rail-r') || document.getElementById('ad-rail-l');
    return !!(box && box.offsetWidth > 0 && box.offsetHeight > 0);
  }

  function update() {
    var on = wide();
    root.classList.toggle('ad-rails', on);
    // AdSense cannot size an ad in a hidden box, so the units are only made
    // once the content they sit beside is visible.
    if (on && !filled) {
      rails();
      if (!contentShown()) return;
      filled = true;
      // The ad size is fixed once it is requested, so pick it from the window now.
      var w = window.innerWidth - 2 * 316 >= TEXT_W ? 300 : 160;
      root.style.setProperty('--rail', (w + 16) + 'px');
      fill('ad-rail-l', SLOT_LEFT, w); fill('ad-rail-r', SLOT_RIGHT, w);
    }
  }

  function start() {
    update();
    window.addEventListener('resize', update);
    // The home page's content shows and hides with the main menu; check now
    // and then until the ads have been made.
    if (!page) timer = setInterval(function () { if (filled) clearInterval(timer); else update(); }, 700);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
