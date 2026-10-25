// The home page below the game: screenshots, modes and FAQ under the main
// menu. The page only scrolls while the main menu is open; any match, the
// demo or another menu screen locks it back to the first screen, so wheel,
// touch, Space and the arrow keys never move the page during play.
(function () {
  var on = null;

  function wanted() {
    return !SR.game && !(SR.demo && SR.demo.active) && SR.ui && SR.ui.current() === 'scr-menu';
  }

  function top() {
    // Instant, so the game screen is in place before the first frame.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }

  SR.landing = {
    sync: function () {
      var want = wanted();
      if (want === on) return;
      on = want;
      if (!want) top();
      document.documentElement.classList.toggle('page-home', want);
      if (!want) top();
    }
  };

  window.addEventListener('load', function () {
    var page = document.getElementById('landing');
    if (!page) return;
    // Buttons down the page press the matching menu button at the top.
    page.addEventListener('click', function (e) {
      var b = e.target.closest('[data-go]');
      if (!b) return;
      var target = document.getElementById(b.getAttribute('data-go'));
      if (!target) return;
      top();
      target.click();
    });
    var more = document.getElementById('btn-more');
    if (more) more.addEventListener('click', function () { page.scrollIntoView({ behavior: 'smooth' }); });
    SR.landing.sync();
  });
})();
