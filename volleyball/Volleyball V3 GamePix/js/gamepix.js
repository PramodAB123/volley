// GamePix HTML5 SDK v3 (https://partners.gamepix.com/sdk/doc/javascript).
// Everything goes through SR.portal so the rest of the game never touches the
// SDK directly. If the SDK script didn't load every call is a safe no-op.
(function () {
  var LOADED_TIMEOUT_MS = 8000, AD_TIMEOUT_MS = 60000, AD_GAP_MS = 90000;

  var portal = {
    ready: false,          // SDK loaded and lifecycle.loaded() answered
    busy: false,           // an ad is being requested or shown
    adPlaying: false,
    adsOff: false,
    adblock: false,
    username: null,
    locale: null,
    settings: { muteAudio: false },
    instantMultiplayer: false
  };
  SR.portal = portal;

  var started = false, sdkPaused = false, lastAdAt = 0, wasPaused = false;

  function gp() { return window.GamePix || null; }

  function safe(fn) {
    var s = gp();
    if (!s) return undefined;
    try { return fn(s); } catch (e) { if (window.console) console.warn('GamePix SDK:', e); return undefined; }
  }

  // ---- pause / resume ----------------------------------------------------------

  // The SDK calls pause before every ad and resume after it (and the Player
  // may call them on its own). Both can repeat, so they only act on a change.
  function onPause() {
    if (sdkPaused) return;
    sdkPaused = true;
    portal.adPlaying = true;
    var g = SR.game;
    wasPaused = g ? g.paused : false;
    if (g) g.paused = true;
    blocker(true);
    if (SR.audio.setMuted) SR.audio.setMuted(true);
  }

  function onResume() {
    if (!sdkPaused) return;
    sdkPaused = false;
    portal.adPlaying = false;
    var g = SR.game;
    if (g && !portal.busy) g.paused = wasPaused;
    if (!portal.busy) blocker(false);
    if (SR.audio.setMuted) SR.audio.setMuted(portal.muted());
  }

  // Tab hidden, phone call, app switched: silence the game until it's back.
  document.addEventListener('visibilitychange', function () {
    if (SR.audio && SR.audio.setMuted) SR.audio.setMuted(document.hidden || portal.muted());
  });

  // ---- init ----------------------------------------------------------------------

  portal.init = function () {
    var s = gp();
    if (!s) return Promise.resolve(false);
    try {
      s.events.on('pause', onPause);
      s.events.on('resume', onResume);
    } catch (e) { /* ignore */ }
    portal.loading(10);
    return Promise.resolve(true);
  };

  portal.loading = function (pct) { safe(function (s) { s.lifecycle.loading(pct); }); };

  portal.loadingStart = function () { portal.loading(50); };

  // Game assets are ready: tell the Player to hide its loading screen.
  // Ads and gameplay signals only work after this.
  portal.loadingStop = function () {
    portal.loading(100);
    var p = safe(function (s) { return Promise.resolve(s.lifecycle.loaded()); });
    if (!p) return Promise.resolve(false);
    var timeout = new Promise(function (res) { setTimeout(function () { res('timeout'); }, LOADED_TIMEOUT_MS); });
    return Promise.race([p, timeout]).then(function () {
      portal.ready = true;
      // GamePix's language ('en' is also its default, so the browser decides then).
      var l = safe(function (s) { return s.lang(); });
      if (l && l !== 'en' && SR.i18n) { portal.locale = l; SR.i18n.init(); if (SR.ui.refresh) SR.ui.refresh(); }
      return true;
    }, function () { portal.ready = true; return true; });
  };

  portal.onSettingsChange = function () { /* no portal mute setting on GamePix */ };
  portal.onAuthChange = function () { /* no sign-in used */ };

  portal.muted = function () { return portal.adPlaying || document.hidden; };

  // ---- gameplay signals ------------------------------------------------------------

  // Called every frame; marks the start of real gameplay once.
  portal.syncGameplay = function () {
    if (started || !portal.ready) return;
    var g = SR.game;
    if (g && g.cfg.human !== -1 && !g.cfg.demo && !g.paused && SR.ui && SR.ui.current() === null) {
      started = true;
      safe(function (s) { s.lifecycle.gameStart(); });
    }
  };

  portal.happytime = function (type) {
    if (!portal.ready) return;
    safe(function (s) { s.happyMoment(type || 'title_won'); });
  };

  // ---- ads -----------------------------------------------------------------------

  function blocker(on) {
    var el = document.getElementById('ad-block');
    if (el) el.classList.toggle('hidden', !on);
  }

  // Runs one ad; the game is paused and input blocked until it's over.
  // done(ok) is called exactly once.
  function runAd(kind, done) {
    if (!portal.ready || portal.adsOff || portal.busy || !gp()) { done(false); return; }
    var g = SR.game, paused = g ? g.paused : false, finished = false;
    portal.busy = true;
    if (g) g.paused = true;
    blocker(true);

    function end(ok) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      onResume();
      portal.busy = false;
      portal.adPlaying = false;
      if (g && SR.game === g) g.paused = paused;
      blocker(false);
      if (SR.audio.setMuted) SR.audio.setMuted(portal.muted());
      done(ok);
    }

    // If the SDK never answers, don't leave the game frozen.
    var timer = setTimeout(function () { end(false); }, AD_TIMEOUT_MS);
    var p = safe(function (s) { return kind === 'reward' ? s.ads.reward() : s.ads.interstitial(); });
    if (!p || !p.then) { end(false); return; }
    p.then(function (r) { end(!!(r && r.success === true)); }, function () { end(false); });
  }

  // Interstitial at a natural break (between sets, after a match), at most
  // once every AD_GAP_MS. `next` always runs afterwards.
  portal.midgame = function (next) {
    if (!portal.ready || portal.adsOff || Date.now() - lastAdAt < AD_GAP_MS) { next(); return; }
    runAd('interstitial', function (ok) { if (ok) lastAdAt = Date.now(); next(); });
  };

  // Rewarded ad: onReward runs only when GamePix confirms the ad was watched.
  portal.rewarded = function (onReward, onFail) {
    runAd('reward', function (ok) { if (ok) onReward(); else if (onFail) onFail(null); });
  };

  portal.rewardedAvailable = function () { return portal.ready && !portal.adsOff && !!gp(); };

  // ---- saves ---------------------------------------------------------------------

  // GamePix syncs localStorage itself, so the game just uses localStorage.
  portal.storage = function () { return null; };
})();
