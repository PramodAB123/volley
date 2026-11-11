// Trophy art for the Stats screen's cabinet: one unique trophy per league
// (shields) and per cup (cups), plus special awards. SR.trophyArt(kind, i)
// returns an inline SVG; kind = 'league' | 'cup' | 'special'.
(function () {
  var uid = 0, INK = '#2a1606';

  function grad(id, stops, vertical) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (vertical ? 0 : 1) + '" y2="1">' +
      stops.map(function (c, i) { return '<stop offset="' + (i / (stops.length - 1)) + '" stop-color="' + c + '"/>'; }).join('') + '</linearGradient>';
  }
  function star(cx, cy, r, fill) {
    var pts = [];
    for (var k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; pts.push((cx + Math.cos(a) * rr).toFixed(1) + ',' + (cy + Math.sin(a) * rr).toFixed(1)); }
    return '<polygon points="' + pts.join(' ') + '" fill="' + fill + '"/>';
  }
  // A wooden plinth with a little name plate in the trophy's colour.
  function plinth(id, plate) {
    return '<path d="M18 82h44l4 10H14z" fill="url(#' + id + 'w)" stroke="' + INK + '" stroke-width="1.2"/>' +
      '<rect x="26" y="84.5" width="28" height="5" rx="1.2" fill="' + plate + '" stroke="' + INK + '" stroke-width=".8"/>';
  }
  function wood(id) { return grad(id + 'w', ['#6b4426', '#3a2212'], true); }
  // Shine sweep (animated in CSS when won).
  function shine(clip) { return '<g clip-path="url(#' + clip + ')"><rect class="tr-shine" x="-40" y="0" width="16" height="96" fill="#fff" opacity=".35" transform="skewX(-20)"/></g>'; }

  var SHIELD = 'M40 8l26 8v20c0 20-11 33-26 40C25 69 14 56 14 36V16z';
  var CUP = 'M20 10h40v14c0 14-9 24-20 24S20 38 20 24z';

  // League shields.
  var LEAGUES = [
    // Rookie: emerald shield, laurels and a sprout.
    function (id) {
      return '<defs>' + grad(id + 'g', ['#b7ffc9', '#3fb950', '#17692b']) + wood(id) + '<clipPath id="' + id + 'c"><path d="' + SHIELD + '"/></clipPath></defs>' +
        laurel('#7ed957', '#2f7d32') +
        '<path d="' + SHIELD + '" fill="url(#' + id + 'g)" stroke="' + INK + '" stroke-width="1.6"/>' +
        '<path d="M40 14l20 6v16c0 16-9 27-20 33-11-6-20-17-20-33V20z" fill="none" stroke="#eaffef" stroke-width="1.4" opacity=".7"/>' +
        '<path d="M40 58V36" stroke="#1f5e2a" stroke-width="3" stroke-linecap="round"/><path d="M40 42c-8 0-12-6-12-12 8 0 12 5 12 12zM40 38c6-1 11-6 11-12-7 0-11 5-11 12z" fill="#eaffef" stroke="#1f5e2a" stroke-width="1.2"/>' +
        shine(id + 'c') + '<path d="M40 76v6" stroke="' + INK + '" stroke-width="4"/>' + plinth(id, '#3fb950');
    },
    // City: sapphire plate with a night skyline and stars.
    function (id) {
      return '<defs>' + grad(id + 'g', ['#cfe6ff', '#2f8fe0', '#123f7a']) + wood(id) + '<clipPath id="' + id + 'c"><circle cx="40" cy="40" r="28"/></clipPath></defs>' +
        '<circle cx="40" cy="40" r="31" fill="#ffd23f" stroke="' + INK + '" stroke-width="1.4"/>' +
        '<circle cx="40" cy="40" r="28" fill="url(#' + id + 'g)" stroke="#b86e00" stroke-width="1"/>' +
        '<g clip-path="url(#' + id + 'c)"><path d="M12 68V50h6v-8h6v12h5V38h8v16h4V44h6v-6h7v14h5V46h7v22z" fill="#0b2346"/>' +
        '<g fill="#ffe680">' + [[22, 47], [33, 42], [33, 48], [50, 41], [50, 48], [57, 50]].map(function (p) { return '<rect x="' + p[0] + '" y="' + p[1] + '" width="2" height="2"/>'; }).join('') + '</g>' +
        star(28, 24, 3.4, '#fff8d6') + star(50, 20, 2.4, '#fff8d6') + star(58, 30, 1.8, '#fff8d6') + '<circle cx="22" cy="20" r="4" fill="#fff8d6" opacity=".9"/></g>' +
        shine(id + 'c') + '<path d="M40 71v11" stroke="' + INK + '" stroke-width="4"/>' + plinth(id, '#2f8fe0');
    },
    // National: orange shield with a big star and a flag ribbon.
    function (id) {
      return '<defs>' + grad(id + 'g', ['#ffe0b8', '#e07a2e', '#8a3c08']) + wood(id) + '<clipPath id="' + id + 'c"><path d="' + SHIELD + '"/></clipPath></defs>' +
        '<path d="' + SHIELD + '" fill="url(#' + id + 'g)" stroke="' + INK + '" stroke-width="1.6"/>' +
        '<g clip-path="url(#' + id + 'c)"><path d="M14 52h52v6H14zM14 62h52v6H14z" fill="#fff4e6" opacity=".55"/></g>' +
        star(40, 33, 13, '#fff8d6') + star(40, 33, 7, '#ffb347') +
        '<path d="M8 20l10-4 4 8-10 4zM72 20l-10-4-4 8 10 4z" fill="#c62828" stroke="' + INK + '" stroke-width="1"/>' +
        '<path d="M16 18c8 4 40 4 48 0l2 8c-10 5-42 5-52 0z" fill="#e5484d" stroke="' + INK + '" stroke-width="1.2"/>' +
        shine(id + 'c') + '<path d="M40 76v6" stroke="' + INK + '" stroke-width="4"/>' + plinth(id, '#e07a2e');
    },
    // Pro: amethyst shield with a lightning bolt and spikes.
    function (id) {
      return '<defs>' + grad(id + 'g', ['#e6d6ff', '#8a5cf0', '#3a1a8a']) + wood(id) + '<clipPath id="' + id + 'c"><path d="' + SHIELD + '"/></clipPath></defs>' +
        '<path d="M24 12l4-9 4 7 8-8 8 8 4-7 4 9z" fill="#c9b0ff" stroke="' + INK + '" stroke-width="1.2"/>' +
        '<path d="' + SHIELD + '" fill="url(#' + id + 'g)" stroke="' + INK + '" stroke-width="1.6"/>' +
        '<path d="M44 20L30 42h9l-5 18 16-24h-9z" fill="#ffe14d" stroke="#8a5a00" stroke-width="1.4" stroke-linejoin="round"/>' +
        '<path d="M18 30c4-2 6 0 8 2M62 30c-4-2-6 0-8 2" stroke="#e6d6ff" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
        shine(id + 'c') + '<path d="M40 76v6" stroke="' + INK + '" stroke-width="4"/>' + plinth(id, '#8a5cf0');
    },
    // Legends: golden shield with wings, a crown and three gems.
    function (id) {
      return '<defs>' + grad(id + 'g', ['#fff6c2', '#ffd23f', '#c27c00']) + wood(id) + '<clipPath id="' + id + 'c"><path d="' + SHIELD + '"/></clipPath></defs>' +
        wings('#fff3b0', '#c98a00') +
        '<path d="' + SHIELD + '" fill="url(#' + id + 'g)" stroke="' + INK + '" stroke-width="1.6"/>' +
        '<path d="M28 34l4-10 8 7 8-7 4 10z" fill="#fff8d6" stroke="#8a5a00" stroke-width="1.2"/>' +
        '<circle cx="32" cy="46" r="4" fill="#e5484d" stroke="#7a1010"/><circle cx="40" cy="50" r="4.6" fill="#2f8fe0" stroke="#0b3c7a"/><circle cx="48" cy="46" r="4" fill="#3fb950" stroke="#17692b"/>' +
        shine(id + 'c') + '<path d="M40 76v6" stroke="' + INK + '" stroke-width="4"/>' + plinth(id, '#ffd23f');
    }
  ];

  function laurel(light, dark) {
    var out = '';
    for (var k = 0; k < 5; k++) {
      var y = 60 - k * 10, x = 12 + k * 1.2;
      out += '<ellipse cx="' + x + '" cy="' + y + '" rx="3.4" ry="7" fill="' + light + '" stroke="' + dark + '" stroke-width="1" transform="rotate(' + (-30 + k * 8) + ' ' + x + ' ' + y + ')"/>';
      out += '<ellipse cx="' + (80 - x) + '" cy="' + y + '" rx="3.4" ry="7" fill="' + light + '" stroke="' + dark + '" stroke-width="1" transform="rotate(' + (30 - k * 8) + ' ' + (80 - x) + ' ' + y + ')"/>';
    }
    return out;
  }
  function wings(light, dark) {
    return '<path d="M16 26C6 22 2 30 3 40c4-3 7-4 11-4-4 3-6 7-6 12 4-3 7-5 10-5z" fill="' + light + '" stroke="' + dark + '" stroke-width="1.2"/>' +
      '<path d="M64 26c10-4 14 4 13 14-4-3-7-4-11-4 4 3 6 7 6 12-4-3-7-5-10-5z" fill="' + light + '" stroke="' + dark + '" stroke-width="1.2"/>';
  }

  // A cup body in colours c (light, mid, dark), with handles and a stem.
  function cupBody(id, c, handles) {
    return '<defs>' + grad(id + 'g', c) + wood(id) + '<clipPath id="' + id + 'c"><path d="' + CUP + '"/></clipPath></defs>' +
      (handles !== false ? '<path d="M20 14H10c0 10 5 16 12 17M60 14h10c0 10-5 16-12 17" fill="none" stroke="' + c[1] + '" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M20 14H10c0 10 5 16 12 17M60 14h10c0 10-5 16-12 17" fill="none" stroke="' + INK + '" stroke-width="1" stroke-linecap="round" opacity=".5"/>' : '') +
      '<path d="M35 47h10v12H35z" fill="' + c[2] + '" stroke="' + INK + '" stroke-width="1.2"/>' +
      '<path d="M26 59h28l4 8H22z" fill="url(#' + id + 'g)" stroke="' + INK + '" stroke-width="1.2"/>' +
      '<rect x="20" y="67" width="40" height="5" rx="1.5" fill="' + c[2] + '" stroke="' + INK + '" stroke-width="1"/>' +
      '<path d="' + CUP + '" fill="url(#' + id + 'g)" stroke="' + INK + '" stroke-width="1.6"/>' +
      '<path d="M26 14c0 10 2 18 7 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>';
  }
  function cupEnd(id, plate) { return shine(id + 'c') + '<path d="M40 72v10" stroke="' + INK + '" stroke-width="4"/>' + plinth(id, plate); }

  var CUPS = [
    // Beach: sunset cup with a sun and waves.
    function (id) {
      return cupBody(id, ['#fff0c2', '#ff8a3d', '#b4410a']) +
        '<g clip-path="url(#' + id + 'c)"><circle cx="40" cy="26" r="8" fill="#ffe14d"/>' +
        '<g stroke="#ffe14d" stroke-width="1.6" stroke-linecap="round">' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (k) { var a = k * Math.PI / 4; return '<path d="M' + (40 + Math.cos(a) * 11).toFixed(1) + ' ' + (26 + Math.sin(a) * 11).toFixed(1) + 'L' + (40 + Math.cos(a) * 14).toFixed(1) + ' ' + (26 + Math.sin(a) * 14).toFixed(1) + '"/>'; }).join('') + '</g>' +
        '<path d="M18 38c4-3 7-3 11 0s7 3 11 0 7-3 11 0 7 3 11 0v12H18z" fill="#2fb7d6" stroke="#fff" stroke-width="1.2"/></g>' + cupEnd(id, '#ff8a3d');
    },
    // Blossom: pink cup covered in sakura flowers.
    function (id) {
      return cupBody(id, ['#ffe3ee', '#ff6fa3', '#a8245a']) +
        '<g clip-path="url(#' + id + 'c)">' + flower(31, 22, 6) + flower(47, 30, 5) + flower(37, 38, 4) + '</g>' +
        flower(66, 8, 3.5) + flower(12, 40, 3) +
        '<ellipse cx="70" cy="30" rx="2" ry="1.2" fill="#ffb3cf" transform="rotate(30 70 30)"/><ellipse cx="9" cy="22" rx="2" ry="1.2" fill="#ffb3cf" transform="rotate(-20 9 22)"/>' + cupEnd(id, '#ff6fa3');
    },
    // Desert: a tall amphora in sand gold with pyramids and a cactus, no handles.
    function (id) {
      return '<defs>' + grad(id + 'g', ['#fff1cc', '#d99a3e', '#7a4a12']) + wood(id) + '<clipPath id="' + id + 'c"><path d="M30 6h20l-2 6c8 4 12 12 12 20 0 10-8 16-20 16S20 42 20 32c0-8 4-16 12-20z"/></clipPath></defs>' +
        '<path d="M22 20c-8 0-10 8-4 12M58 20c8 0 10 8 4 12" fill="none" stroke="#d99a3e" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M30 6h20l-2 6c8 4 12 12 12 20 0 10-8 16-20 16S20 42 20 32c0-8 4-16 12-20z" fill="url(#' + id + 'g)" stroke="' + INK + '" stroke-width="1.6"/>' +
        '<g clip-path="url(#' + id + 'c)"><path d="M20 44l10-14 10 14zM34 44l10-12 10 12z" fill="#b5651d" stroke="#5a2e08" stroke-width="1"/><circle cx="50" cy="20" r="4" fill="#fff3b0"/><path d="M20 44h40v6H20z" fill="#e0b070"/></g>' +
        '<path d="M35 48h10v11H35z" fill="#7a4a12" stroke="' + INK + '" stroke-width="1.2"/><path d="M26 59h28l4 8H22z" fill="url(#' + id + 'g)" stroke="' + INK + '" stroke-width="1.2"/><rect x="20" y="67" width="40" height="5" rx="1.5" fill="#7a4a12" stroke="' + INK + '"/>' +
        '<path d="M66 70V54M66 60c-4 0-4-4-4-6M66 58c4 0 4-4 4-6" stroke="#2f9e44" stroke-width="3" stroke-linecap="round" fill="none"/>' + cupEnd(id, '#d99a3e');
    },
    // Frost: faceted ice-crystal cup with a snowflake.
    function (id) {
      return cupBody(id, ['#ffffff', '#8fd3ff', '#2a6fb5']) +
        '<g clip-path="url(#' + id + 'c)"><path d="M20 10l14 38M60 10L46 48M40 10v40M20 24h40" stroke="#fff" stroke-width="1" opacity=".55"/>' +
        '<g stroke="#ffffff" stroke-width="2" stroke-linecap="round">' + [0, 1, 2].map(function (k) { var a = k * Math.PI / 3; return '<path d="M' + (40 - Math.cos(a) * 10).toFixed(1) + ' ' + (27 - Math.sin(a) * 10).toFixed(1) + 'L' + (40 + Math.cos(a) * 10).toFixed(1) + ' ' + (27 + Math.sin(a) * 10).toFixed(1) + '"/>'; }).join('') + '</g><circle cx="40" cy="27" r="2.4" fill="#fff"/></g>' +
        '<path d="M10 6l3 3M13 6l-3 3M68 40l3 3M71 40l-3 3" stroke="#cfefff" stroke-width="1.4"/>' + cupEnd(id, '#4fb6ff');
    },
    // Neon: dark cup outlined in glowing magenta and cyan.
    function (id) {
      return '<defs>' + grad(id + 'g', ['#3a0a4a', '#1a0626', '#0a0212']) + wood(id) + '<clipPath id="' + id + 'c"><path d="' + CUP + '"/></clipPath></defs>' +
        '<path d="M20 14H10c0 10 5 16 12 17M60 14h10c0 10-5 16-12 17" fill="none" stroke="#53f3ff" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="' + CUP + '" fill="url(#' + id + 'g)" stroke="#ff3bd4" stroke-width="5" opacity=".35"/>' +
        '<path d="' + CUP + '" fill="none" stroke="#ff3bd4" stroke-width="2.2"/>' +
        '<g clip-path="url(#' + id + 'c)"><path d="M20 20h40M20 30h40M20 40h40M30 10v40M40 10v40M50 10v40" stroke="#53f3ff" stroke-width=".8" opacity=".45"/></g>' +
        '<path d="M34 22l12 0-8 8h8l-12 10 4-8h-6z" fill="#ffe14d"/>' +
        '<path d="M35 47h10v12H35z" fill="#1a0626" stroke="#53f3ff" stroke-width="1.4"/><path d="M26 59h28l4 8H22z" fill="#1a0626" stroke="#ff3bd4" stroke-width="1.6"/><rect x="20" y="67" width="40" height="5" rx="1.5" fill="#1a0626" stroke="#53f3ff" stroke-width="1.2"/>' +
        cupEnd(id, '#e040fb');
    },
    // Champions: big gold cup with wings, a crown and a volleyball emblem.
    function (id) {
      return '<path d="M30 6l3-6 4 4 3-5 3 5 4-4 3 6z" fill="#ffd23f" stroke="' + INK + '" stroke-width="1"/>' +
        '<g transform="translate(0 -8)">' + wings('#fff3b0', '#c98a00') + '</g>' +
        cupBody(id, ['#fff6c2', '#ffc400', '#a86a00']) +
        '<circle cx="40" cy="27" r="9" fill="#fff8e1" stroke="#a86a00" stroke-width="1.4"/><path d="M31.5 25c5 0 9 2 12 8M36 18.6c3 3 4.5 8 3.5 13M48.6 24c-5-1-10 .5-13 5" fill="none" stroke="#c98a00" stroke-width="1.4" stroke-linecap="round"/>' +
        star(22, 46, 3, '#fff8d6') + star(58, 46, 3, '#fff8d6') + cupEnd(id, '#ffc400');
    }
  ];

  function flower(x, y, r) {
    var out = '';
    for (var k = 0; k < 5; k++) {
      var a = -Math.PI / 2 + k * Math.PI * 2 / 5, px = x + Math.cos(a) * r * 0.6, py = y + Math.sin(a) * r * 0.6;
      out += '<ellipse cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" rx="' + (r * 0.5).toFixed(1) + '" ry="' + (r * 0.62).toFixed(1) + '" fill="#fff0f6" stroke="#d94680" stroke-width=".6" transform="rotate(' + (k * 72) + ' ' + px.toFixed(1) + ' ' + py.toFixed(1) + ')"/>';
    }
    return out + '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 0.28).toFixed(1) + '" fill="#ffd23f"/>';
  }

  // Special awards: Career Crown, Unbeaten season, Challenge streak medal.
  var SPECIAL = [
    function (id) {
      return '<defs>' + grad(id + 'g', ['#fff6c2', '#ffd23f', '#b86e00']) + wood(id) + '<clipPath id="' + id + 'c"><path d="M12 56l-4-36 16 14 16-24 16 24 16-14-4 36z"/></clipPath></defs>' +
        '<path d="M12 56l-4-36 16 14 16-24 16 24 16-14-4 36z" fill="url(#' + id + 'g)" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<rect x="12" y="56" width="56" height="9" rx="2" fill="#c98a00" stroke="' + INK + '" stroke-width="1.2"/>' +
        '<circle cx="8" cy="20" r="3.4" fill="#fff8d6" stroke="' + INK + '"/><circle cx="40" cy="10" r="3.8" fill="#fff8d6" stroke="' + INK + '"/><circle cx="72" cy="20" r="3.4" fill="#fff8d6" stroke="' + INK + '"/>' +
        '<circle cx="26" cy="46" r="3.6" fill="#2fb7d6" stroke="#0b4a5a"/><circle cx="40" cy="44" r="4.4" fill="#e5484d" stroke="#7a1010"/><circle cx="54" cy="46" r="3.6" fill="#3fb950" stroke="#17692b"/>' +
        shine(id + 'c') + '<path d="M40 65v17" stroke="' + INK + '" stroke-width="4"/>' + plinth(id, '#1cc8d8');
    },
    function (id) {
      return '<defs>' + grad(id + 'g', ['#ffffff', '#c9d3e0', '#6d7a90']) + wood(id) + '<clipPath id="' + id + 'c"><path d="' + SHIELD + '"/></clipPath></defs>' +
        '<path d="' + SHIELD + '" fill="url(#' + id + 'g)" stroke="' + INK + '" stroke-width="1.6"/>' +
        '<path d="M28 40l8 8 16-18" fill="none" stroke="#2f9e44" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M10 58h60l-4 8H14z" fill="#e5484d" stroke="' + INK + '" stroke-width="1.2"/><text x="40" y="64.6" text-anchor="middle" font-size="6.5" font-weight="900" fill="#fff" font-family="system-ui, sans-serif">UNBEATEN</text>' +
        shine(id + 'c') + '<path d="M40 74v8" stroke="' + INK + '" stroke-width="4"/>' + plinth(id, '#c9d3e0');
    },
    function (id) {
      return '<defs>' + grad(id + 'g', ['#ffe6c2', '#ff7a1a', '#b4280a']) + wood(id) + '<clipPath id="' + id + 'c"><circle cx="40" cy="48" r="22"/></clipPath></defs>' +
        '<path d="M26 4h10l6 22h-10zM54 4H44l-6 22h10z" fill="#2f6fe0" stroke="' + INK + '" stroke-width="1.2"/>' +
        '<circle cx="40" cy="48" r="24" fill="#ffd23f" stroke="' + INK + '" stroke-width="1.4"/><circle cx="40" cy="48" r="22" fill="url(#' + id + 'g)"/>' +
        '<path d="M40 30c8 8 10 14 6 22 4-2 6-6 6-10 4 6 2 16-6 20-6 3-16 2-20-6-3-7 1-12 4-16 0 4 2 6 4 7-2-7 1-12 6-17z" fill="#ffe14d" stroke="#8a3c08" stroke-width="1.2"/>' +
        shine(id + 'c') + '<path d="M40 72v10" stroke="' + INK + '" stroke-width="4"/>' + plinth(id, '#ff7a1a');
    }
  ];

  SR.trophyArt = function (kind, i) {
    var list = kind === 'league' ? LEAGUES : kind === 'cup' ? CUPS : SPECIAL, f = list[i] || list[0], id = 'tr' + (++uid);
    return '<svg class="tr-svg" viewBox="0 0 80 96" aria-hidden="true">' + f(id) + '</svg>';
  };
  SR.SPECIAL_TROPHIES = [
    { id: 'crown', name: 'Career Crown', how: 'Win all 21 Career islands' },
    { id: 'unbeaten', name: 'Unbeaten Shield', how: 'Win a league without losing a match' },
    { id: 'flame', name: 'Challenge Flame', how: 'Win the daily challenge 7 days in a row' }
  ];
})();
