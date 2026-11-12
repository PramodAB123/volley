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
(function () {
  SR.ADS = {
    appId: 'ca-app-pub-1426010855335025~7211404354', // also in AndroidManifest.xml
    rewardedId: 'ca-app-pub-1426010855335025/7295678184',
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
      var pre = loaded;
      if (!pre) veil(true);
      return withTimeout(load(A), SR.ADS.loadTimeoutMs)
        .then(function () { veil(false); return show(A); })
        .catch(function () {
          veil(false);
          toast(navigator.onLine === false ? 'Connect to the internet to watch an ad.' : 'No ad available right now. Please try again in a moment.');
          return false;
        })
        .then(function (ok) { busy = false; return ok; });
    },
    // Settings > Ad privacy choices (only shown where the law asks for it).
    privacy: function () { var A = plugin(); if (A) A.showPrivacyOptionsForm().catch(function () {}); }
  };

  window.addEventListener('load', function () {
    var b = document.getElementById('btn-ad-privacy');
    if (b) b.addEventListener('click', function () { SR.audio.play('click'); SR.ads.privacy(); });
    var A = plugin();
    // After the start-up loader, so the consent form doesn't cover it.
    if (A) setTimeout(function () { load(A).catch(function () {}); }, 3000);
  });
})();
