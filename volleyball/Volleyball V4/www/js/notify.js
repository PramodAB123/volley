// Daily reminders (2026-11-13): a phone notification when the next daily
// reward (and the new daily challenge) is ready.
// - Uses the Capacitor Local Notifications plugin: the notifications are
//   scheduled on the phone itself, no server and no data leaves the phone.
// - Settings > Daily reminders turns them on and off (settings.notify, on by
//   default). Android 13+ asks the player's permission the first time: right
//   after their first daily reward is claimed, or when they switch it on.
// - Every time the app starts, goes to the background or a reward is claimed,
//   the next 7 reminders are worked out again: none for a day whose reward was
//   already claimed, 10:00 on the following days, and 19:00 today if today's
//   reward is still waiting.
(function () {
  var IDS = [7101, 7102, 7103, 7104, 7105, 7106, 7107, 7108];
  var asked = false;

  function plugin() {
    var C = window.Capacitor;
    return C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.LocalNotifications || null;
  }
  function settings() { return SR.save && SR.save.data && SR.save.data.settings; }
  function wanted() { var s = settings(); return !!s && s.notify !== false; }
  function quiet(p) { return p && p.then ? p.then(null, function () { return null; }) : Promise.resolve(null); }
  function t(s) { return SR.t ? SR.t(s) : s; }

  // 'granted', 'denied', 'prompt' (not asked yet) or null (not on a phone)
  function permission() {
    var LN = plugin();
    if (!LN || !LN.checkPermissions) return Promise.resolve(null);
    return quiet(LN.checkPermissions()).then(function (r) { return r && r.display || null; });
  }
  function ask() {
    var LN = plugin();
    if (!LN || !LN.requestPermissions) return Promise.resolve(null);
    asked = true;
    return quiet(LN.requestPermissions()).then(function (r) { return r && r.display || null; });
  }

  var BODIES = [
    'Your daily reward is ready. Claim it before the streak breaks!',
    'New day, new reward: diamonds and coins are waiting.',
    'A fresh daily challenge and your next reward are ready.'
  ];

  function at(day, hour) {
    var d = new Date();
    d.setDate(d.getDate() + day);
    d.setHours(hour, 0, 0, 0);
    return d;
  }

  function plan() {
    var st = SR.daily && SR.daily.state ? SR.daily.state() : { ready: true }, now = Date.now(), list = [];
    // Today: only if the reward is still waiting and the evening is ahead.
    if (st.ready && at(0, 19).getTime() > now + 30 * 60000) list.push(at(0, 19));
    for (var day = 1; day <= 7 && list.length < IDS.length; day++) list.push(at(day, 10));
    return list.map(function (when, i) {
      return {
        id: IDS[i],
        title: t('Spike Rally'),
        body: t(BODIES[(when.getDate() + i) % BODIES.length]),
        schedule: { at: when, allowWhileIdle: true },
        smallIcon: 'ic_stat_notify',
        iconColor: '#FFB020',
        autoCancel: true,
        // A reminder does not need to ring to the second. Without this the
        // plugin opens Android's "Alarms & reminders" settings page on every
        // schedule (the exact-alarm permission is removed in the manifest).
        isExactNotification: false
      };
    });
  }

  function cancelAll(LN) {
    return quiet(LN.cancel({ notifications: IDS.map(function (id) { return { id: id }; }) }));
  }

  var busy = null;
  // Work the reminders out again. Never throws, never asks for permission.
  function refresh() {
    var LN = plugin();
    if (!LN) return Promise.resolve();
    if (busy) return busy;
    busy = cancelAll(LN).then(function () {
      if (!wanted()) return null;
      return permission().then(function (p) {
        if (p !== 'granted') return null;
        return quiet(LN.schedule({ notifications: plan() }));
      });
    }).then(function () { busy = null; }, function () { busy = null; });
    return busy;
  }

  // The Settings switch shows "on" only when reminders can really arrive.
  function showSwitch() {
    var el = document.getElementById('set-notify');
    if (!el) return;
    if (!plugin()) { el.checked = wanted(); return; }
    permission().then(function (p) { el.checked = wanted() && p !== 'denied'; });
  }

  function save() { if (SR.ui && SR.ui.save) SR.ui.save(); else if (SR.save) SR.save.write(); }

  function onSwitch(e) {
    var s = settings(), on = e.target.checked;
    if (!s) return;
    s.notify = on;
    save();
    if (!on) { refresh(); return; }
    permission().then(function (p) {
      if (p === 'granted' || p === null) return p;
      return ask();
    }).then(function (p) {
      if (p === 'denied') {
        // Android won't show the question again: point to the phone's settings.
        e.target.checked = false;
        s.notify = false;
        save();
        var hint = document.getElementById('set-notify-hint');
        if (hint) hint.classList.remove('hidden');
      }
      refresh();
    });
  }

  SR.notify = {
    refresh: refresh,
    // After the first claimed daily reward: the right moment to ask once.
    claimed: function () {
      if (!wanted() || asked) { refresh(); return; }
      permission().then(function (p) { return p === 'prompt' || p === 'prompt-with-rationale' ? ask() : p; }).then(refresh);
    },
    init: function () {
      var el = document.getElementById('set-notify');
      if (el) el.addEventListener('change', onSwitch);
      var bs = document.getElementById('btn-settings');
      if (bs) bs.addEventListener('click', function () { setTimeout(showSwitch, 0); });
      showSwitch();
      var C = window.Capacitor, App = C && C.Plugins && C.Plugins.App;
      if (App && App.addListener) {
        try {
          App.addListener('pause', function () { refresh(); });
          App.addListener('resume', function () { showSwitch(); refresh(); });
        } catch (err) { /* ignore */ }
      }
      // Tapping a reminder opens the app on the home screen, where the daily
      // reward calendar opens by itself when a gift is waiting.
      var LN = plugin();
      if (LN && LN.addListener) {
        try {
          LN.addListener('localNotificationActionPerformed', function () {
            if (SR.daily && SR.daily.state().ready && SR.ui && SR.ui.current() === 'scr-menu' && !SR.game && !(SR.profile && SR.profile.isOpen())) SR.daily.open();
          });
        } catch (err2) { /* ignore */ }
      }
      setTimeout(refresh, 4000);
    }
  };
})();
