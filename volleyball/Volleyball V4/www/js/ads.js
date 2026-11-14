// Rewarded ads through Google AdMob (@capacitor-community/admob).
// SR.ads.rewarded(placement) shows one rewarded video and resolves true only
// when the player watched it to the end (AdMob's reward event fired).
//
// Ads exist only in the Android app. In a browser SR.ads.available() is false
// and the result screen simply shows no ad buttons.
//
// On start the app asks Google's consent form when the law needs it (EEA, UK,
// Switzerland; set up under AdMob > Privacy & messaging), then preloads one ad
// so the button responds at once.
//
// A banner shows at the bottom of the result screen only (never in a match).
// The screen keeps that space free so the banner never covers a button.
// After every 3rd match a full-screen ad plays when the player taps a result
// button, and the tap goes through once the ad is closed.
(function () {
  SR.ADS = {
    appId: 'ca-app-pub-1426010855335025~7211404354', // also in AndroidManifest.xml
    rewardedId: 'ca-app-pub-1426010855335025/7295678184',
    // Banner at the bottom of the result screen ("Result banner" unit).
    bannerId: 'ca-app-pub-1426010855335025/9583910110',
    // Full-screen ad after every 3rd finished match, shown when the player
    // leaves the result screen (never during play), at most once a minute
    // and not right after a reward video.
    interstitialId: 'ca-app-pub-1426010855335025/8764818313',
    interstitialEvery: 3,
    interstitialGapMs: 60000,
    // Keep false for the Play release. To test on your own phone without
    // risk, add the phone under AdMob > Settings > Test devices instead.
    testing: false,
    loadTimeoutMs: 12000
  };

  var busy = false, ready = null, loaded = false, loading = null, privacyNeeded = false;

  function plugin() {
    var C = window.Capacitor;
    return C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.AdMob ? C.Plugins.AdMob : null;
  }

  // Start the SDK and gather consent once per launch. Resolves true when ads
  // may be requested.
  function start(A) {
    if (ready) return ready;
    ready = A.initialize({ initializeForTesting: SR.ADS.testing })
      .catch(function () { /* consent and loading still get a try */ })
      .then(function () { return A.requestConsentInfo({}); })
      .then(function (info) {
        if (info && info.status === 'REQUIRED' && info.isConsentFormAvailable) return A.showConsentForm();
        return info;
      })
      .then(function (info) {
        privacyNeeded = !!(info && info.privacyOptionsRequirementStatus === 'REQUIRED');
        showPrivacyRow();
        return !info || info.canRequestAds !== false;
      })
      .catch(function () { return true; });
    return ready;
  }

  function load(A) {
    if (loaded) return Promise.resolve();
    if (loading) return loading;
    loading = start(A).then(function (ok) {
      if (!ok) throw new Error('no consent');
      return A.prepareRewardVideoAd({ adId: SR.ADS.rewardedId, isTesting: SR.ADS.testing });
    }).then(function () { loaded = true; loading = null; }, function (e) { loading = null; throw e; });
    return loading;
  }

  function withTimeout(p, ms) {
    return new Promise(function (res, rej) {
      var t = setTimeout(function () { rej(new Error('timeout')); }, ms);
      p.then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); });
    });
  }

  // Small "Loading ad" veil while an ad that wasn't preloaded is fetched.
  function veil(on) {
    var el = document.getElementById('ad-wait');
    if (on && !el) {
      el = document.createElement('div');
      el.id = 'ad-wait'; el.className = 'ad-wait';
      el.setAttribute('role', 'status');
      el.innerHTML = '<span class="aw-spin" aria-hidden="true"></span><b>Loading ad…</b>';
      document.body.appendChild(el);
    } else if (!on && el && el.parentNode) el.parentNode.removeChild(el);
  }

  function toast(msg) {
    var el = document.createElement('div');
    el.className = 'ad-toast'; el.setAttribute('role', 'status'); el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.classList.add('out'); }, 2600);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 3000);
  }

  function show(A) {
    return new Promise(function (resolve) {
      var got = false, hs = [], done = false;
      function finish(ok) {
        if (done) return; done = true;
        hs.forEach(function (h) { Promise.resolve(h).then(function (x) { if (x && x.remove) x.remove(); }).catch(function () {}); });
        loaded = false;
        // Get the next one ready in the background.
        setTimeout(function () { load(A).catch(function () {}); }, 800);
        resolve(ok);
      }
      hs.push(A.addListener('onRewardedVideoAdReward', function () { got = true; }));
      hs.push(A.addListener('onRewardedVideoAdDismissed', function () { setTimeout(function () { finish(got); }, 150); }));
      hs.push(A.addListener('onRewardedVideoAdFailedToShow', function () { finish(false); }));
      // showRewardVideoAd resolves only when the reward is earned.
      A.showRewardVideoAd().then(function () { got = true; }, function () { finish(false); });
    });
  }

  // ---- result-screen banner ------------------------------------------------
  // introWant: the walk-on before a match also shows the banner (main.js).
  // pauseWant: the pause menu during your own match also shows it (not online,
  // where the match keeps running behind the menu).
  var bannerOn = false, bannerWant = false, introWant = false, pauseWant = false, bannerSeq = 0;
  function bannerSize(h) {
    var root = document.documentElement;
    root.style.setProperty('--banner-h', (h > 0 ? Math.ceil(h) : 0) + 'px');
    root.classList.toggle('has-banner', h > 0);
  }
  function bannerSync(A) {
    var want = (bannerWant || introWant || pauseWant) && !busy && !itShowing;
    if (want === bannerOn) return;
    bannerOn = want;
    var seq = ++bannerSeq;
    if (!want) { bannerSize(0); try { A.removeBanner().catch(function () {}); } catch (e) { /* ignore */ } return; }
    start(A).then(function (ok) {
      if (!ok || seq !== bannerSeq) return;
      // A fresh banner each time the result screen opens.
      return A.showBanner({ adId: SR.ADS.bannerId, adSize: 'ADAPTIVE_BANNER', position: 'BOTTOM_CENTER', margin: 0, isTesting: SR.ADS.testing });
    }).catch(function () { if (seq === bannerSeq) bannerSize(0); });
  }
  // ---- interstitial after every 3rd match ----------------------------------
  var itLoaded = false, itLoading = null, itShowing = false, itBypass = false, lastFull = 0, itMem = 0;
  function itCount(n) {
    try {
      if (n === undefined) return parseInt(localStorage.getItem('sr.itCount'), 10) || 0;
      localStorage.setItem('sr.itCount', String(n));
    } catch (e) { if (n === undefined) return itMem; }
    itMem = n || 0;
    return n;
  }
  function itLoad(A) {
    if (itLoaded) return Promise.resolve();
    if (itLoading) return itLoading;
    itLoading = start(A).then(function (ok) {
      if (!ok) throw new Error('no consent');
      return A.prepareInterstitial({ adId: SR.ADS.interstitialId, isTesting: SR.ADS.testing });
    }).then(function () { itLoaded = true; itLoading = null; }, function (e) { itLoading = null; throw e; });
    return itLoading;
  }
  function itDue() {
    return itLoaded && !busy && !itShowing && itCount() >= SR.ADS.interstitialEvery && Date.now() - lastFull >= SR.ADS.interstitialGapMs;
  }
  function itShow(A, then) {
    var hs = [], done = false;
    itShowing = true; itLoaded = false;
    bannerSync(A);
    function finish() {
      if (done) return; done = true;
      hs.forEach(function (h) { Promise.resolve(h).then(function (x) { if (x && x.remove) x.remove(); }).catch(function () {}); });
      itShowing = false; lastFull = Date.now(); itCount(0);
      setTimeout(function () { itLoad(A).catch(function () {}); }, 1500);
      then();
    }
    hs.push(A.addListener('interstitialAdDismissed', function () { setTimeout(finish, 150); }));
    hs.push(A.addListener('interstitialAdFailedToShow', finish));
    try { A.showInterstitial().catch(finish); } catch (e) { finish(); }
  }
  function itWatch(A, scr) {
    if (!A.prepareInterstitial) return;
    // Taps on Play again / Continue / Menu: play the ad first, then the tap.
    scr.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('.result-btns button') : null;
      if (!btn || itBypass || !itDue()) return;
      e.preventDefault(); e.stopImmediatePropagation();
      itShow(A, function () {
        itBypass = true;
        try { btn.click(); } finally { itBypass = false; }
        bannerSync(A);
      });
    }, true);
  }

  function bannerWatch(A) {
    var scr = document.getElementById('scr-result');
    if (!scr || !window.MutationObserver) return;
    var wasOpen = false;
    new MutationObserver(function () {
      var open = !scr.classList.contains('hidden');
      if (open && !wasOpen) {
        // One more finished match; get the full-screen ad ready when it's close.
        itCount(itCount() + 1);
        if (itCount() >= SR.ADS.interstitialEvery - 1 && A.prepareInterstitial) itLoad(A).catch(function () {});
      }
      wasOpen = open;
    }).observe(scr, { attributes: true, attributeFilter: ['class'] });
    itWatch(A, scr);
    if (!A.showBanner) return;
    A.addListener('bannerAdSizeChanged', function (sz) { bannerSize(bannerOn && sz ? sz.height : 0); });
    A.addListener('bannerAdFailedToLoad', function () { bannerSize(0); });
    new MutationObserver(function () {
      bannerWant = !scr.classList.contains('hidden');
      bannerSync(A);
    }).observe(scr, { attributes: true, attributeFilter: ['class'] });
    var ps = document.getElementById('scr-pause');
    if (ps) new MutationObserver(function () {
      pauseWant = !ps.classList.contains('hidden') && !!(SR.game && !SR.game.cfg.online);
      bannerSync(A);
    }).observe(ps, { attributes: true, attributeFilter: ['class'] });
  }

  function showPrivacyRow() {
    var b = document.getElementById('btn-ad-privacy');
    if (b) b.classList.toggle('hidden', !privacyNeeded);
  }

  SR.ads = {
    available: function () { return !!plugin(); },
    // Promise<boolean>: true = watched to the end, pay the reward.
    rewarded: function () {
      var A = plugin();
      if (!A || busy) return Promise.resolve(false);
      busy = true;
      bannerSync(A);
      var pre = loaded;
      if (!pre) veil(true);
      return withTimeout(load(A), SR.ADS.loadTimeoutMs)
        .then(function () { veil(false); return show(A); })
        .catch(function () {
          veil(false);
          toast(navigator.onLine === false ? 'Connect to the internet to watch an ad.' : 'No ad available right now. Please try again in a moment.');
          return false;
        })
        .then(function (ok) { busy = false; lastFull = Date.now(); bannerSync(A); return ok; });
    },
    // The banner during the walk-on before a match; off again as play starts.
    introBanner: function (on) {
      introWant = !!on;
      var A = plugin();
      if (A && A.showBanner) bannerSync(A);
    },
    // Settings > Ad privacy choices (only shown where the law asks for it).
    privacy: function () { var A = plugin(); if (A) A.showPrivacyOptionsForm().catch(function () {}); }
  };

  window.addEventListener('load', function () {
    var b = document.getElementById('btn-ad-privacy');
    if (b) b.addEventListener('click', function () { SR.audio.play('click'); SR.ads.privacy(); });
    var A = plugin();
    // After the start-up loader, so the consent form doesn't cover it.
    if (A) { bannerWatch(A); setTimeout(function () { load(A).catch(function () {}); }, 3000); }
  });
})();
