// Tiny Web Audio sound effects, generated at runtime (no sample files).
(function () {
  var ctx = null;

  function ac() {
    if (!ctx) {
      var A = window.AudioContext || window.webkitAudioContext;
      if (!A) return null;
      ctx = new A();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, slide) {
    var c = ac();
    if (!c) return;
    var o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(vol || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(dur, vol, hp) {
    var c = ac();
    if (!c) return;
    var n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = buf; f.type = 'highpass'; f.frequency.value = hp || 800; g.gain.value = vol || 0.2;
    s.connect(f); f.connect(g); g.connect(c.destination);
    s.start();
  }

  var SOUNDS = {
    pass:    function () { tone(320, 0.08, 'triangle', 0.25, 200); },
    set:     function () { tone(520, 0.07, 'triangle', 0.18, 380); },
    spike:   function () { noise(0.12, 0.35, 600); tone(160, 0.12, 'square', 0.12, 70); },
    serve:   function () { noise(0.09, 0.25, 900); tone(240, 0.1, 'triangle', 0.15, 140); },
    block:   function () { noise(0.1, 0.3, 300); tone(110, 0.15, 'square', 0.15, 60); },
    bounce:  function () { tone(140, 0.12, 'sine', 0.3, 60); },
    whistle: function () { tone(2100, 0.25, 'sine', 0.12, 1900); },
    cheer:   function () { noise(0.9, 0.12, 1500); },
    click:   function () { tone(880, 0.04, 'square', 0.06); }
  };

  SR.audio = {
    play: function (name) {
      if (!SR.save.data.settings.sound || (SR.cg && SR.cg.muted()) || !SOUNDS[name]) return;
      try { SOUNDS[name](); } catch (e) { /* audio unavailable */ }
    },
    // Silence anything still ringing (an ad starting, or CrazyGames muting).
    setMuted: function (on) {
      if (!ctx) return;
      try { if (on) ctx.suspend(); else ctx.resume(); } catch (e) { /* ignore */ }
    }
  };
})();
