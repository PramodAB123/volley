// Background music, composed and synthesised at runtime with Web Audio (no
// audio files, so nothing extra to download). Two loops:
//   menu   relaxed, sunny synth-pop in C major, 100 bpm
//   match  driving sports anthem in A minor, 126 bpm; between points it drops
//          to drums + bass behind a closed filter, during a rally the full
//          band kicks in, and the hook comes in on long rallies
// plus short jingles for winning and losing a match. A small look-ahead
// scheduler books notes ~0.15 s ahead on the audio clock, so timing stays tight
// even when frames drop.
(function () {
  var ctx = null, bus = null, filt = null, comp = null, noiseBuf = null;
  var track = null, want = null, step = 0, nextT = 0, timer = null, fade = 0, energy = 0, duck = 1;
  var VOL = 0.42, lastFq = 18000;

  function freq(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function enabled() { var s = SR.save && SR.save.data.settings; return !s || s.music !== false; }

  function setup() {
    if (bus) return true;
    ctx = SR.audio && SR.audio.ctx ? SR.audio.ctx() : null;
    if (!ctx) return false;
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.2;
    filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 18000; filt.Q.value = 0.7;
    bus = ctx.createGain(); bus.gain.value = 0;
    filt.connect(bus); bus.connect(comp); comp.connect(ctx.destination);
    var n = ctx.sampleRate, b = ctx.createBuffer(1, n, n), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    noiseBuf = b;
    return true;
  }

  // ---- instruments ---------------------------------------------------------
  function env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function osc(type, f, t, dur, vol, a, out, detune, cut) {
    var o = ctx.createOscillator(), g = ctx.createGain(), dest = out || filt;
    o.type = type; o.frequency.setValueAtTime(f, t); if (detune) o.detune.value = detune;
    if (cut) { var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut; o.connect(lp); lp.connect(g); }
    else o.connect(g);
    g.connect(dest); env(g, t, a || 0.005, vol, dur);
    o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function noise(t, dur, vol, type, f, q) {
    var s = ctx.createBufferSource(), bf = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; bf.type = type; bf.frequency.value = f; if (q) bf.Q.value = q;
    s.connect(bf); bf.connect(g); g.connect(filt); env(g, t, 0.002, vol, dur);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  var I = {
    kick: function (t, v) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      o.connect(g); g.connect(filt); env(g, t, 0.002, 0.9 * v, 0.32); o.start(t); o.stop(t + 0.36);
    },
    snare: function (t, v) { noise(t, 0.18, 0.35 * v, 'bandpass', 1900, 0.8); osc('triangle', 190, t, 0.09, 0.25 * v, 0.002); },
    clap: function (t, v) { for (var i = 0; i < 3; i++) noise(t + i * 0.011, 0.14, 0.28 * v, 'bandpass', 1500, 1.2); },
    hat: function (t, v, open) { noise(t, open ? 0.22 : 0.045, (open ? 0.12 : 0.1) * v, 'highpass', 8000); },
    rim: function (t, v) { osc('square', 820, t, 0.03, 0.06 * v, 0.001, null, 0, 2500); },
    bass: function (t, m, dur, v) { osc('sawtooth', freq(m), t, dur, 0.22 * v, 0.006, null, 0, 700); osc('sine', freq(m - 12), t, dur, 0.25 * v, 0.006); },
    pluck: function (t, m, v) { osc('triangle', freq(m), t, 0.28, 0.12 * v, 0.003); osc('square', freq(m), t, 0.12, 0.03 * v, 0.002, null, 0, 2200); },
    pad: function (t, ms, dur, v) { ms.forEach(function (m) { osc('sawtooth', freq(m), t, dur, 0.028 * v, 0.25, null, -7, 1400); osc('sawtooth', freq(m), t, dur, 0.028 * v, 0.25, null, 7, 1400); }); },
    lead: function (t, m, dur, v) { osc('square', freq(m), t, dur, 0.07 * v, 0.01, null, 0, 3200); osc('triangle', freq(m + 12), t, dur, 0.04 * v, 0.01); },
    bell: function (t, m, dur, v) { osc('sine', freq(m), t, dur, 0.12 * v, 0.003); osc('sine', freq(m + 19), t, dur * 0.5, 0.03 * v, 0.003); }
  };

  // ---- songs -----------------------------------------------------------------
  // Chords as MIDI notes; one chord per bar. Melodies: [16th step in a 2-bar
  // phrase, MIDI note, length in 16ths].
  var SONGS = {
    menu: {
      bpm: 100,
      chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]],          // C  Am  F  G
      roots: [36, 33, 29, 31],
      hook: [[0, 76, 2], [2, 79, 2], [4, 81, 3], [8, 79, 2], [10, 76, 2], [12, 74, 4], [16, 72, 2], [18, 74, 2], [20, 76, 4], [26, 74, 2], [28, 72, 4]],
      bar: function (b, st, t, s16, phrase) {
        var c = this.chords[b % 4], r = this.roots[b % 4], full = phrase % 4 !== 0;
        if (st === 0) I.pad(t, c, s16 * 16, 1);
        // Gentle beat: kick on 1 and the "and" of 2, rim on 2 and 4, swung hats.
        if (st === 0 || st === 6 || (st === 10 && full)) I.kick(t, 0.55);
        if (st === 4 || st === 12) I.rim(t, 1);
        if (st % 2 === 0) I.hat(t + (st % 4 === 2 ? s16 * 0.18 : 0), st % 4 === 2 ? 0.6 : 0.4);
        if (st % 4 === 0 || st === 14) I.bass(t, r + (st === 8 ? 7 : 0) + 12, s16 * 1.6, 0.8);
        // Arpeggio climbing through the chord.
        if (st % 2 === 0) { var arp = [c[0], c[1], c[2], c[1] + 12, c[2], c[1], c[0] + 12, c[2]]; I.pluck(t, arp[(st / 2) % 8] + 12, full ? 0.9 : 0.6); }
        if (full) this.hook.forEach(function (h) { if (h[0] === (b % 2) * 16 + st) I.bell(t, h[1], s16 * h[2] * 1.4, 0.9); });
      }
    },
    match: {
      bpm: 126,
      chords: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]],           // Am F  C  G
      roots: [33, 29, 36, 31],
      hook: [[0, 69, 2], [2, 72, 2], [4, 76, 2], [6, 74, 1], [7, 72, 1], [8, 74, 3], [12, 72, 2], [14, 71, 2],
             [16, 72, 2], [18, 69, 2], [20, 67, 2], [22, 69, 4], [28, 76, 2], [30, 79, 2]],
      bar: function (b, st, t, s16, phrase, e) {
        var c = this.chords[b % 4], r = this.roots[b % 4];
        // Between points (e low): kick pulse + bass. In a rally: the full band.
        if (st % 4 === 0) I.kick(t, 0.55 + 0.4 * e);
        if (e > 0.5 && (st === 4 || st === 12)) I.clap(t, 1);
        if (e <= 0.5 && st === 12) I.rim(t, 1);
        if (e > 0.3) I.hat(t, st % 4 === 2 ? 0.9 : 0.45, st % 4 === 2 && e > 0.7);
        else if (st % 4 === 2) I.hat(t, 0.5);
        // Octave-jumping bass on 8ths.
        if (st % 2 === 0) I.bass(t, r + (st % 4 === 2 ? 12 : 0) + 12, s16 * 1.7, 0.7 + 0.3 * e);
        if (st === 0) I.pad(t, c, s16 * 16, 0.6 + 0.6 * e);
        if (e > 0.5 && st % 2 === 1) I.pluck(t, c[(st >> 1) % 3] + 24, 0.45);
        // The hook comes in once the rally gets going.
        if (e > 0.85) this.hook.forEach(function (h) { if (h[0] === (b % 2) * 16 + st) I.lead(t, h[1], s16 * h[2] * 0.95, 1); });
        // Drum fill into every 4th bar.
        if (b % 4 === 3 && st >= 12 && e > 0.5) I.snare(t, 0.5 + (st - 12) * 0.15);
      }
    }
  };

  function tick() {
    if (!ctx || !track) return;
    var song = SONGS[track], s16 = 60 / song.bpm / 4;
    if (nextT < ctx.currentTime - 0.4) nextT = ctx.currentTime + 0.05; // after a stall, don't play catch-up
    while (nextT < ctx.currentTime + 0.25) {
      var b = Math.floor(step / 16), st = step % 16;
      try { song.bar(b, st, nextT, s16, Math.floor(b / 4), energy); } catch (e) { /* skip a broken note */ }
      step++; nextT += s16;
    }
  }

  function level() {
    if (!bus) return;
    var v = enabled() && want ? VOL * duck : 0;
    bus.gain.setTargetAtTime(v, ctx.currentTime, 0.25);
  }

  function start(name) {
    if (!setup()) return;
    if (track === name) return;
    track = name; step = 0; nextT = ctx.currentTime + 0.1;
    if (!timer) timer = setInterval(tick, 50);
  }

  // Jingles for the end of a match.
  function jingle(kind) {
    if (!setup() || !enabled()) return;
    var t = ctx.currentTime + 0.05, notes;
    if (kind === 'win') {
      notes = [[0, 72, 0.12], [0.12, 76, 0.12], [0.24, 79, 0.12], [0.36, 84, 0.5], [0.62, 83, 0.12], [0.74, 84, 0.7]];
      I.kick(t, 0.8); I.kick(t + 0.36, 0.8); I.clap(t + 0.36, 1);
      [[60, 64, 67], [65, 69, 72]].forEach(function (ch, i) { I.pad(t + i * 0.36, ch, 0.9, 1.4); });
    } else {
      notes = [[0, 67, 0.22], [0.24, 66, 0.22], [0.48, 65, 0.22], [0.72, 64, 0.8]];
    }
    notes.forEach(function (n) { I.lead(t + n[0], n[1], n[2], 1.2); });
    // Let the jingle through over a quieter loop for a moment.
    bus.gain.cancelScheduledValues(ctx.currentTime);
    bus.gain.setTargetAtTime(VOL * 0.25 * (enabled() ? 1 : 0), ctx.currentTime, 0.05);
    setTimeout(level, 1800);
  }

  SR.music = {
    // Called every frame by the game loop with what's on screen.
    sync: function (g) {
      if (!started || !setup()) return;
      var name = g ? 'match' : 'menu', r = g && g.rally, on = !!(r && r.state === 'rally');
      // Energy: low between points, high in a rally, full (with the hook) once a rally runs long.
      if (r) { if (!on) r._musT = null; else if (r._musT == null) r._musT = r.t; }
      var target = !r ? 0 : on ? (r.t - r._musT > 3 ? 1 : 0.75) : 0.2;
      energy += (target - energy) * 0.05;
      var nd = g && g.paused ? 0.35 : 1;
      if (want !== name || nd !== duck) { want = name; duck = nd; start(name); level(); }
      var fq = 400 + 17600 * Math.pow(Math.min(1, energy + (name === 'menu' ? 1 : 0.15)), 2);
      if (Math.abs(fq - lastFq) > lastFq * 0.03) { lastFq = fq; filt.frequency.setTargetAtTime(fq, ctx.currentTime, 0.2); }
    },
    jingle: jingle,
    // For recording previews: also send the music to another node.
    tap: function (node) { if (setup()) comp.connect(node); },
    refresh: level,
    // The browser only allows sound after the player touches the page.
    unlock: function () { started = true; if (setup()) { ctx.resume && ctx.resume().then(null, function () {}); level(); } }
  };
  var started = false;
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, function () { if (!started) SR.music.unlock(); }, { passive: true });
  });
  // Quiet in background tabs.
  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    try { if (document.hidden) ctx.suspend().then(null, function () {}); else ctx.resume().then(null, function () {}); } catch (e) { /* ignore */ }
  });
})();
