// Rewarded ads. SR.ads.rewarded(placement) shows one rewarded video and
// resolves true only when the player watched it to the end.
//
// On the phone this uses the AdMob Capacitor plugin
// (@capacitor-community/admob) when it is installed. Until then (and in a
// browser) a built-in test ad stands in, so every reward button can be tried.
// Ad unit ids live in SR.ADS below: replace the Google test id with your own
// rewarded ad unit from the AdMob console before release.
(function () {
  SR.ADS = {
    // Google's public test rewarded unit. Swap for your own: ca-app-pub-XXXX/YYYY
    rewardedId: 'ca-app-pub-3940256099942544/5224354917',
    // true while testing: AdMob serves test ads (never click your own live ads).
    testing: true,
    // Seconds the stand-in test ad runs when the plugin is missing.
    mockSeconds: 5
  };

  var busy = false, inited = null, preloaded = false;

  function plugin() {
    var C = window.Capacitor;
    return C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.AdMob ? C.Plugins.AdMob : null;
  }

  function init(A) {
    if (!inited) inited = A.initialize({ initializeForTesting: SR.ADS.testing }).catch(function () { /* still try to show */ });
    return inited;
  }

  function prepare(A) {
    return init(A).then(function () { return A.prepareRewardVideoAd({ adId: SR.ADS.rewardedId, isTesting: SR.ADS.testing }); })
      .then(function () { preloaded = true; });
  }

  // The real ad through the plugin: rewarded only if the reward event fired.
  function native(A) {
    return new Promise(function (resolve) {
      var got = false, hs = [], done = false;
      function finish(ok) {
        if (done) return; done = true;
        hs.forEach(function (h) { try { Promise.resolve(h).then(function (x) { if (x && x.remove) x.remove(); }); } catch (e) { /* ignore */ } });
        preloaded = false;
        // Load the next one in the background.
        setTimeout(function () { prepare(A).catch(function () {}); }, 500);
        resolve(ok);
      }
      hs.push(A.addListener('onRewardedVideoAdReward', function () { got = true; }));
      hs.push(A.addListener('onRewardedVideoAdDismissed', function () { finish(got); }));
      hs.push(A.addListener('onRewardedVideoAdFailedToShow', function () { finish(false); }));
      (preloaded ? Promise.resolve() : prepare(A))
        .then(function () { return A.showRewardVideoAd(); })
        .then(function () { if (got) setTimeout(function () { finish(true); }, 300); })
        .catch(function () { finish(got); });
    });
  }

  // The stand-in: a full-screen "test ad" with a countdown. Closing early
  // gives nothing, like a real rewarded ad.
  function mock(placement) {
    return new Promise(function (resolve) {
      var n = SR.ADS.mockSeconds, el = document.createElement('div');
      el.className = 'ad-mock';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', 'Test ad');
      el.innerHTML = '<div class="am-top"><span class="am-tag">Test ad</span><span class="am-left">Reward in <b>' + n + '</b>s</span>' +
        '<button type="button" class="am-x" aria-label="Close ad">✕</button></div>' +
        '<div class="am-body"><div class="am-logo"></div><b>Your ad here</b><small>AdMob rewarded video · ' + placement + '</small>' +
        '<div class="am-bar"><i></i></div></div>';
      document.body.appendChild(el);
      var bar = el.querySelector('.am-bar i'), left = el.querySelector('.am-left'), t0 = Date.now(), done = false;
      bar.style.transitionDuration = n + 's';
      requestAnimationFrame(function () { requestAnimationFrame(function () { bar.style.width = '100%'; }); });
      var iv = setInterval(function () {
        var s = Math.max(0, n - Math.floor((Date.now() - t0) / 1000));
        if (s > 0) left.innerHTML = 'Reward in <b>' + s + '</b>s';
        else { left.innerHTML = '<b>Reward earned</b>'; el.classList.add('earned'); clearInterval(iv); }
      }, 200);
      function close() {
        if (done) return; done = true;
        clearInterval(iv);
        var ok = Date.now() - t0 >= n * 1000;
        el.classList.add('out');
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 250);
        resolve(ok);
      }
      el.querySelector('.am-x').addEventListener('click', close);
      SR.ads._closeMock = close;
    });
  }

  SR.ads = {
    // Promise<boolean>: true = watched to the end, pay the reward.
    rewarded: function (placement) {
      if (busy) return Promise.resolve(false);
      busy = true;
      var A = plugin();
      var p = A ? native(A) : mock(placement || 'reward');
      return p.then(function (ok) {
        busy = false;
        SR.ads._closeMock = null;
        return ok;
      });
    },
    // Android Back while the test ad is up closes it (no reward).
    closeMock: function () { if (SR.ads._closeMock) { SR.ads._closeMock(); return true; } return false; },
    native: function () { return !!plugin(); },
    _closeMock: null
  };

  // Load the first ad early on the phone so the button responds at once.
  window.addEventListener('load', function () {
    var A = plugin();
    if (A) setTimeout(function () { prepare(A).catch(function () {}); }, 3000);
  });
})();
