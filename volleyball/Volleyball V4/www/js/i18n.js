// Languages (2026-11-13).
// English is written in the game itself. Every other language is a word list
// in js/lang/<code>.js (SR.LANG_DATA[code] = { 'English text': 'translation' })
// that is loaded at start-up, behind the loader, so nothing flashes in English.
//
// How the text gets translated without touching every screen's code:
// - page text: every text node and the aria-label / title / placeholder
//   attributes are looked up when they appear or change (MutationObserver);
// - match text drawn on the canvas (SET 1, ACE!, the scoreboard...) goes
//   through the same lookup inside fillText / measureText.
// Numbers are matched as '#', so 'Claim Day 3' uses the entry 'Claim Day #'
// and the 3 is put back in. Team names, player names and anything without an
// entry stay as they are.
// Changing the language saves it and reloads the app (behind the loader).
(function () {
  var KEY = 'spikeRally.v1';
  // [code, name in its own language, English name]
  SR.LANGS = [
    ['en', 'English', 'English'],
    ['es', 'Español', 'Spanish'],
    ['fr', 'Français', 'French'],
    ['de', 'Deutsch', 'German'],
    ['it', 'Italiano', 'Italian'],
    ['pt', 'Português (Brasil)', 'Portuguese'],
    ['pl', 'Polski', 'Polish'],
    ['ja', '日本語', 'Japanese'],
    ['ko', '한국어', 'Korean'],
    ['zh-Hans', '简体中文', 'Chinese (Simplified)'],
    ['zh-Hant', '繁體中文', 'Chinese (Traditional)'],
    ['vi', 'Tiếng Việt', 'Vietnamese'],
    ['th', 'ไทย', 'Thai'],
    ['id', 'Bahasa Indonesia', 'Indonesian'],
    ['km', 'ខ្មែរ', 'Khmer'],
    ['fa', 'فارسی', 'Persian']
  ];
  SR.LANG_DATA = SR.LANG_DATA || {};

  function known(code) { for (var i = 0; i < SR.LANGS.length; i++) if (SR.LANGS[i][0] === code) return code; return null; }

  // The phone's language, mapped onto the list (zh-TW / zh-HK -> Traditional).
  function fromDevice() {
    var list = [];
    try { list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en']); } catch (e) { list = ['en']; }
    for (var i = 0; i < list.length; i++) {
      var l = String(list[i] || '').toLowerCase();
      if (l.indexOf('zh') === 0) return /hant|tw|hk|mo/.test(l) ? 'zh-Hant' : 'zh-Hans';
      var base = l.split('-')[0];
      if (base === 'in') base = 'id';
      if (base === 'fil' || base === 'tl') return 'en';
      if (known(base)) return base;
    }
    return 'en';
  }

  function saved() {
    try { var d = JSON.parse(localStorage.getItem(KEY) || 'null'); return d && d.settings && typeof d.settings.lang === 'string' ? d.settings.lang : 'auto'; } catch (e) { return 'auto'; }
  }

  var choice = saved(), lang = choice !== 'auto' && known(choice) ? choice : fromDevice();
  var dict = null, cache = {}, collect = null;
  try { if (window.__i18nCollect || /[?&]i18n=collect/.test(location.search)) { collect = {}; window.__i18nKeys = collect; } } catch (e) { /* ignore */ }

  var NUM = /\d+(?:[.,:]\d+)*/g;
  // Names stay in English and are matched as '@': teams, courts and arenas,
  // Career islands, and the player's own names.
  var namesRe = null, namesSig = '';
  function esc(x) { return x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function names() {
    var d = SR.save && SR.save.data, own = [];
    if (d && d.profile && d.profile.name) own.push(d.profile.name);
    if (d && d.custom && d.custom.unlocked) { if (d.custom.name) own.push(d.custom.name); if (d.custom.short) own.push(d.custom.short); }
    var sig = own.join('|') + '|' + (SR.TEAMS ? SR.TEAMS.length : 0) + (document.readyState === 'loading' ? 'L' : '');
    if (namesRe && sig === namesSig) return namesRe;
    namesSig = sig;
    var list = own.slice();
    (SR.TEAMS || []).forEach(function (t) { list.push(t.name, t.short); });
    var A = SR.ARENAS || {};
    Object.keys(A).forEach(function (k) { if (A[k].name) list.push(A[k].name); });
    ((SR.SHOP && SR.SHOP.courts) || []).forEach(function (c) { if (c.name) list.push(c.name); });
    var I = SR.ISLE_NAMES;
    if (I) list = list.concat(I.final);
    // ('Night' is also part of the Neon Night Cup's name)
    list = list.filter(function (x) { return x && /[A-Za-z]/.test(x) && x !== 'Night'; });
    list.sort(function (a, b) { return b.length - a.length; });
    var parts = list.map(esc);
    if (I) parts.unshift('(?:' + I.first.join('|') + ') (?:' + I.second.join('|') + ')');
    namesRe = parts.length ? new RegExp('(^|[^A-Za-z])(' + parts.join('|') + ')(?![A-Za-z])', 'g') : null;
    return namesRe;
  }
  // 'English text' -> { k: lookup key, v: [names...], n: [numbers...] }
  function keyOf(flat) {
    var re = names(), nm = [];
    var k = re ? flat.replace(re, function (m, pre, name) { nm.push(name); return pre + '@'; }) : flat;
    var nums = k.match(NUM) || [];
    return { k: k.replace(NUM, '#'), v: nm, n: nums };
  }
  // Look a text up; returns null when there is nothing to change.
  function tr(s) {
    if (!s) return null;
    var core = s.replace(/^\s+|\s+$/g, '');
    if (!core || core.length > 600 || !/[A-Za-z]/.test(core)) return null;
    if (!dict && !collect) return null;
    if (dict && cache.hasOwnProperty(s)) return cache[s];
    var flat = core.replace(/\s+/g, ' '), K = keyOf(flat), out = null;
    if (collect) { if (K.k.replace(/[@#\s\W]/g, '')) collect[K.k] = 1; if (!dict) return null; }
    var v = dict[K.k];
    if (typeof v === 'string' && v) {
      var n = 0, a = 0;
      v = v.replace(/[#@]/g, function (c) { if (c === '#') return n < K.n.length ? K.n[n++] : '#'; return a < K.v.length ? K.v[a++] : '@'; });
      out = s.slice(0, s.indexOf(core.charAt(0))) + v + (/\s$/.test(s) ? ' ' : '');
    }
    if (Object.keys(cache).length > 4000) cache = {};
    cache[s] = out;
    return out;
  }
  SR.t = function (s) { var r = tr(s); return r === null ? s : r; };

  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, SELECT: 0, NOSCRIPT: 1 };
  function skip(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentNode) {
      if (SKIP[e.tagName] === 1 || e.hasAttribute('data-no-i18n')) return true;
    }
    return false;
  }
  var ATTRS = ['aria-label', 'title', 'placeholder', 'data-name'];
  function doText(node) {
    if (!node.parentNode || skip(node.parentNode)) return;
    var r = tr(node.data);
    if (r !== null && r !== node.data) node.data = r;
  }
  function doEl(el) {
    if (skip(el)) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var a = el.getAttribute(ATTRS[i]);
      if (a) { var r = tr(a); if (r !== null && r !== a) el.setAttribute(ATTRS[i], r); }
    }
  }
  function walk(root) {
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1 || skip(root)) return;
    doEl(root);
    var all = root.getElementsByTagName('*');
    for (var i = 0; i < all.length; i++) doEl(all[i]);
    var w = document.createTreeWalker(root, 4, null, false), n, list = [];
    while ((n = w.nextNode())) list.push(n);
    for (var j = 0; j < list.length; j++) doText(list[j]);
  }

  var observing = false;
  function observe() {
    if (observing || !window.MutationObserver || !document.body) return;
    observing = true;
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === 'characterData') doText(m.target);
        else if (m.type === 'attributes') { if (m.target.nodeType === 1) doEl(m.target); }
        else for (var j = 0; j < m.addedNodes.length; j++) walk(m.addedNodes[j]);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  // Canvas text (the match): same lookup, so measured width and drawn text agree.
  function patchCanvas() {
    var P = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
    if (!P || P.__i18n) return;
    P.__i18n = true;
    ['fillText', 'strokeText', 'measureText'].forEach(function (name) {
      var orig = P[name];
      if (!orig) return;
      P[name] = function (text) {
        if (typeof text === 'string' && (dict || collect)) {
          var r = tr(text);
          if (r !== null) { var args = Array.prototype.slice.call(arguments); args[0] = r; return orig.apply(this, args); }
        }
        return orig.apply(this, arguments);
      };
    });
  }

  function apply() {
    var root = document.documentElement;
    root.setAttribute('lang', lang);
    root.setAttribute('data-lang', lang);
    patchCanvas();
    var go = function () { if (document.body) { walk(document.body); observe(); } };
    if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
    if (document.title) { var t = tr(document.title); if (t) document.title = t; }
  }

  SR.i18n = {
    lang: function () { return lang; },
    choice: function () { return choice; },
    device: fromDevice,
    // Save the choice ('auto' = the phone's language) and restart the app in it.
    set: function (code) {
      if (code !== 'auto' && !known(code)) return;
      try {
        if (SR.save && SR.save.data) { SR.save.data.settings.lang = code; SR.save.write ? SR.save.write() : SR.save.save(); }
        else { var d = JSON.parse(localStorage.getItem(KEY) || '{}'); d.settings = d.settings || {}; d.settings.lang = code; localStorage.setItem(KEY, JSON.stringify(d)); }
      } catch (e) { /* ignore */ }
      try { location.reload(); } catch (e2) { /* ignore */ }
    },
    t: SR.t,
    translateNow: function (el) { walk(el || document.body); }
  };

  // Settings > Language: 'Automatic' follows the phone; the others are listed
  // in their own language. Picking one restarts the app in it.
  function fillSelect() {
    var sel = document.getElementById('set-lang');
    if (!sel) return null;
    var dev = fromDevice(), devName = '';
    SR.LANGS.forEach(function (l) { if (l[0] === dev) devName = l[1]; });
    var opts = [['auto', SR.t('Automatic (phone language)') + (devName ? ' · ' + devName : '')]].concat(SR.LANGS.map(function (l) { return [l[0], l[1]]; }));
    sel.innerHTML = '';
    opts.forEach(function (o) { var op = document.createElement('option'); op.value = o[0]; op.textContent = o[1]; sel.appendChild(op); });
    sel.value = choice;
    return sel;
  }
  function bindSelect() {
    var sel = fillSelect();
    if (sel) sel.addEventListener('change', function () { if (sel.value !== choice) SR.i18n.set(sel.value); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindSelect); else bindSelect();

  if (collect) { patchCanvas(); var c = function () { walk(document.body); observe(); }; if (document.body) c(); else document.addEventListener('DOMContentLoaded', c); }

  // English needs no list. Others load their list now; the page's load event
  // (which the start-up loader waits for) waits for it too.
  if (lang !== 'en') {
    var sc = document.createElement('script');
    sc.src = 'js/lang/' + lang + '.js';
    sc.onload = function () { dict = SR.LANG_DATA[lang] || null; if (dict) { apply(); fillSelect(); } };
    sc.onerror = function () { lang = 'en'; };
    (document.head || document.documentElement).appendChild(sc);
  } else document.documentElement.setAttribute('lang', 'en');
})();
