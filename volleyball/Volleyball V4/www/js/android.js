// Android app shell (Capacitor). Everything here is a no-op in a normal browser.
// - Hardware / gesture Back: closes the open screen, pauses a match, and only
//   leaves the app from the main menu.
// - The match pauses when the app goes to the background (call, home button).
(function () {
  var cap = window.Capacitor;
  var native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  var Plugins = (cap && cap.Plugins) || {};

  function quiet(p) { if (p && p.then) p.then(null, function (e) { SR.oops('app plugin', e); }); }
  function click(id) { var b = document.getElementById(id); if (b && b.offsetParent !== null) { b.click(); return true; } return false; }

  // A visible "back" control on the open screen, in the order a player would expect.
  function screenBack(scr) {
    var el = document.getElementById(scr);
    if (!el) return false;
    var b = el.querySelector('.career-back, .cup-back, .top-back, [data-back], #btn-privacy-back, #btn-daily-x, #btn-daily-ok, #btn-chal-x, #btn-result-ok, #btn-resume');
    if (b) { b.click(); return true; }
    return false;
  }

  var lastBack = 0;
  function onBack() {
    var ui = SR.ui, g = SR.game, cur = ui ? ui.current() : null;
    // A Yes / No dialog (star purchase, leave the team builder): Back says No.
    if (SR.custom && SR.custom.isOpen()) { if (!click('confirm-no')) click('confirm-yes'); return; }
    // How to play demo: Back closes it.
    if (SR.demo && SR.demo.active) { SR.demo.stop(); return; }
    // In a match with no menu open: pause. From the pause menu: resume.
    if (g && !g.cfg.demo && cur === null) { if (g.cfg.human !== -1) ui.togglePause(); return; }
    if (cur === 'scr-pause') { ui.togglePause(); return; }
    if (cur === 'scr-daily') { if (!click('btn-daily-ok')) click('btn-daily-x'); return; }
    if (cur && cur !== 'scr-menu') { if (!screenBack(cur)) ui.show('scr-menu'); return; }
    // Main menu: a second Back within 2 s leaves the app.
    var now = Date.now();
    if (now - lastBack < 2000) { if (Plugins.App) quiet(Plugins.App.exitApp()); return; }
    lastBack = now;
    toast('Press Back again to exit');
  }

  var toastEl = null, toastTimer = 0;
  function toast(text) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'app-toast';
      toastEl.setAttribute('role', 'status');
      document.getElementById('app').appendChild(toastEl);
    }
    toastEl.textContent = text;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('on'); }, 1800);
  }

  // Going to the background (home button, a call, the screen turning off) pauses the match.
  function pauseIfPlaying() {
    var g = SR.game, ui = SR.ui;
    if (!g || g.cfg.demo || g.cfg.human === -1 || g.paused || !ui || ui.current() !== null) return;
    ui.togglePause();
  }

  SR.app = {
    native: native,
    back: onBack,
    init: function () {
      if (native) document.documentElement.classList.add('native');
      document.addEventListener('visibilitychange', function () { if (document.hidden) pauseIfPlaying(); });
      if (!native) return;
      // No long-press menus or text selection inside the app.
      document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      var App = Plugins.App;
      if (App && App.addListener) {
        quiet(App.addListener('backButton', function () { try { onBack(); } catch (e) { SR.oops('back', e); } }));
        quiet(App.addListener('pause', function () { try { pauseIfPlaying(); if (SR.audio.sleep) SR.audio.sleep(true); } catch (e) { SR.oops('app pause', e); } }));
        // Back from the background: sound on again (the match stays paused) and
        // full screen again, in case Android brought the system bars back.
        quiet(App.addListener('resume', function () {
          try { if (SR.audio.sleep) SR.audio.sleep(false); } catch (e) { SR.oops('app resume', e); }
          if (Plugins.SystemBars && Plugins.SystemBars.hide) quiet(Plugins.SystemBars.hide());
        }));
        if (App.getInfo) App.getInfo().then(function (i) { var v = document.getElementById('app-version'); if (v && i && i.version) v.textContent = i.version; }, function () {});
      }
      // Full screen while playing; the bars come back with a swipe from the edge.
      if (Plugins.SystemBars && Plugins.SystemBars.hide) quiet(Plugins.SystemBars.hide());
    }
  };
})();
