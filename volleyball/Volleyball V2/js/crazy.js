// CrazyGames HTML5 SDK v3 (https://docs.crazygames.com/sdk/intro/).
// Everything goes through SR.cg so the rest of the game never touches the SDK
// directly. Outside CrazyGames (or if the SDK script didn't load) every call
// is a safe no-op and the game behaves as before.
(function () {
  var INIT_TIMEOUT_MS = 5000, AD_START_TIMEOUT_MS = 12000;

  var cg = {
    ready: false,          // SDK loaded and initialised in a usable environment
    environment: 'none',   // 'local' | 'crazygames' | 'disabled' | 'none'
    busy: false,           // an ad is being requested or shown
    adPlaying: false,
    adsOff: false,         // ads unavailable this session (Basic Launch)
    adblock: false,
    username: null,
    settings: { muteAudio: false, disableChat: false },
    instantMultiplayer: false
  };
  SR.cg = cg;

  var playing = false, inRoom = false, settingsListeners = [], authListeners = [];

  function sdk() { return cg.ready ? window.CrazyGames.SDK : null; }

  function safe(fn) {
    var s = sdk();
    if (!s) return undefined;
    try { return fn(s); } catch (e) { if (window.console) console.warn('CrazyGames SDK:', e); return undefined; }
  }

  // ---- init ------------------------------------------------------------------

  cg.init = function () {
    var C = window.CrazyGames;
    if (!C || !C.SDK) return Promise.resolve(false);
    var timeout = new Promise(function (res) { setTimeout(function () { res('timeout'); }, INIT_TIMEOUT_MS); });
    var start;
    try { start = Promise.resolve(C.SDK.init()); } catch (e) { start = Promise.reject(e); }
    return Promise.race([start, timeout]).then(function (r) {
      if (r === 'timeout') return false;
      cg.environment = C.SDK.environment;
      cg.ready = cg.environment === 'local' || cg.environment === 'crazygames';
      if (!cg.ready) return false;
      afterInit(C.SDK);
      return true;
    }, function (e) {
      if (window.console) console.warn('CrazyGames SDK init failed:', e);
      return false;
    });
  };

  function afterInit(s) {
    try {
      var st = s.game.settings || {};
      cg.settings = { muteAudio: !!st.muteAudio, disableChat: !!st.disableChat };
      s.game.addSettingsChangeListener(function (ns) {
        cg.settings = { muteAudio: !!(ns && ns.muteAudio), disableChat: !!(ns && ns.disableChat) };
        settingsListeners.forEach(function (fn) { fn(cg.settings); });
      });
    } catch (e) { /* settings unavailable */ }
    try { cg.instantMultiplayer = !!s.game.isInstantMultiplayer; } catch (e) { /* ignore */ }
    try {
      s.ad.hasAdblock().then(function (b) { cg.adblock = !!b; }, function () { /* unknown */ });
    } catch (e) { /* ignore */ }
    // CrazyGames account: show the player's username online and reload saves on sign-in.
    try {
      if (s.user && s.user.isUserAccountAvailable) {
        refreshUser();
        s.user.addAuthListener(function () {
          refreshUser();
          authListeners.forEach(function (fn) { fn(); });
        });
      }
    } catch (e) { /* ignore */ }
  }

  function refreshUser() {
    safe(function (s) {
      return s.user.getUser().then(function (u) { cg.username = u && u.username ? String(u.username).slice(0, 24) : null; }, function () { /* guest */ });
    });
  }

  cg.onSettingsChange = function (fn) { settingsListeners.push(fn); };
  cg.onAuthChange = function (fn) { authListeners.push(fn); };

  // Sound is off during an ad, and whenever CrazyGames asks for it to be muted
  // (that setting wins over the in-game sound toggle).
  cg.muted = function () { return cg.adPlaying || !!cg.settings.muteAudio; };

  // ---- loading and gameplay events --------------------------------------------

  cg.loadingStart = function () { safe(function (s) { s.game.loadingStart(); }); };
  cg.loadingStop = function () { safe(function (s) { s.game.loadingStop(); }); };

  // Tell CrazyGames whether the player is in active play. Called whenever a
  // screen opens or closes, so it only reports real changes.
  cg.syncGameplay = function () {
    var g = SR.game;
    var on = !!(g && g.cfg.human !== -1 && !g.paused && !cg.busy && SR.ui && SR.ui.current() === null);
    if (on === playing) return;
    playing = on;
    safe(function (s) { if (on) s.game.gameplayStart(); else s.game.gameplayStop(); });
  };

  cg.happytime = function () { safe(function (s) { s.game.happytime(); }); };

  // ---- ads -------------------------------------------------------------------

  function blocker(on) {
    var el = document.getElementById('ad-block');
    if (el) el.classList.toggle('hidden', !on);
  }

  // Runs one ad of `type`. The game is paused and input blocked from the
  // request until the ad ends; audio is muted only while the ad actually plays.
  // done(ok, error) is called exactly once.
  function runAd(type, done) {
    if (!cg.ready || cg.adsOff || cg.busy) { done(false, null); return; }
    var g = SR.game, wasPaused = g ? g.paused : false, finished = false, startTimer = null;
    cg.busy = true;
    if (g) g.paused = true;
    blocker(true);
    cg.syncGameplay();

    function end(ok, err) {
      if (finished) return;
      finished = true;
      clearTimeout(startTimer);
      cg.adPlaying = false;
      if (SR.audio.setMuted) SR.audio.setMuted(cg.muted());
      cg.busy = false;
      if (g && SR.game === g) g.paused = wasPaused;
      blocker(false);
      if (err && err.code === 'adsDisabledBasicLaunch') cg.adsOff = true;
      if (err && err.code === 'adblock') cg.adblock = true;
      done(ok, err || null);
      cg.syncGameplay();
    }

    // If the SDK never answers, don't leave the game frozen.
    startTimer = setTimeout(function () { if (!cg.adPlaying) end(false, { code: 'other', message: 'no response' }); }, AD_START_TIMEOUT_MS);

    var res = safe(function (s) {
      s.ad.requestAd(type, {
        adStarted: function () {
          clearTimeout(startTimer);
          cg.adPlaying = true;
          if (SR.audio.setMuted) SR.audio.setMuted(true);
        },
        adFinished: function () { end(true, null); },
        adError: function (e) { end(false, e || { code: 'other' }); }
      });
      return true;
    });
    if (!res) end(false, { code: 'other' });
  }

  // Midgame ad at a natural break (between sets, after a match). The SDK
  // enforces the 3-minute spacing and answers early requests with adCooldown,
  // so this can be asked at every break. `next` always runs afterwards.
  cg.midgame = function (next) {
    if (!cg.ready || cg.adsOff) { next(); return; }
    runAd('midgame', function () { next(); });
  };

  // Rewarded ad: onReward runs only when the ad was watched to the end.
  cg.rewarded = function (onReward, onFail) {
    runAd('rewarded', function (ok, err) { if (ok) onReward(); else if (onFail) onFail(err); });
  };

  cg.rewardedAvailable = function () { return cg.ready && !cg.adsOff && !cg.adblock; };

  // ---- cloud saves -------------------------------------------------------------

  // The SDK data module has the same API as localStorage and keeps progress on
  // the player's CrazyGames account. Falls back to localStorage elsewhere.
  cg.storage = function () {
    var d = safe(function (s) { return s.data; });
    return d || null;
  };

  // ---- online rooms and invites --------------------------------------------------

  cg.inviteLink = function (params) { return safe(function (s) { return s.game.inviteLink(params); }) || null; };
  cg.inviteParam = function (name) { return safe(function (s) { return s.game.getInviteParam(name); }) || null; };

  cg.updateRoom = function (info) {
    inRoom = true;
    safe(function (s) { s.game.updateRoom(info); });
  };

  cg.leftRoom = function () {
    if (!inRoom) return;
    inRoom = false;
    safe(function (s) { s.game.leftRoom(); });
  };

  cg.onJoinRoom = function (fn) { safe(function (s) { s.game.addJoinRoomListener(fn); }); };
})();
