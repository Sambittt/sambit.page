/**
 * sambit.page — Universal Dynamic Theme Engine
 * Ensures 100% theme synchronisation across all pages, modals, login forms, 
 * tools, chatbot, matrix canvases, and cross-tab storage changes.
 */
(function () {
  'use strict';

  var PALETTES = {
    cyber: {
      name: 'CYBER',
      code: 'CYBER_01',
      background: '#030303',
      ink: '#f0ede6',
      warm: '#4ade80',
      cardBg: 'rgba(28, 36, 32, 0.75)',
      cardBorder: 'rgba(74, 222, 128, 0.28)',
      rgb: [74, 222, 128],
      swatch: '#4ade80'
    },
    night: {
      name: 'NIGHT',
      code: 'NIGHT_02',
      background: '#0a0806',
      ink: '#fce7c8',
      warm: '#f59e0b',
      cardBg: 'rgba(34, 28, 20, 0.75)',
      cardBorder: 'rgba(245, 158, 11, 0.28)',
      rgb: [245, 158, 11],
      swatch: '#f59e0b'
    },
    ember: {
      name: 'EMBER',
      code: 'EMBER_03',
      background: '#120503',
      ink: '#ffd5be',
      warm: '#ff5a1f',
      cardBg: 'rgba(36, 18, 14, 0.75)',
      cardBorder: 'rgba(255, 90, 31, 0.28)',
      rgb: [255, 90, 31],
      swatch: '#ff5a1f'
    },
    cobalt: {
      name: 'COBALT',
      code: 'COBALT_04',
      background: '#040b1c',
      ink: '#cfe0fc',
      warm: '#38bdf8',
      cardBg: 'rgba(16, 26, 46, 0.75)',
      cardBorder: 'rgba(56, 189, 248, 0.28)',
      rgb: [56, 189, 248],
      swatch: '#38bdf8'
    },
    matrix: {
      name: 'MATRIX',
      code: 'MATRIX_05',
      background: '#020b04',
      ink: '#c6f7cb',
      warm: '#22c55e',
      cardBg: 'rgba(14, 32, 18, 0.75)',
      cardBorder: 'rgba(34, 197, 94, 0.28)',
      rgb: [34, 197, 94],
      swatch: '#22c55e'
    },
    violet: {
      name: 'VIOLET',
      code: 'VIOLET_06',
      background: '#0d0418',
      ink: '#ecd3ff',
      warm: '#a855f7',
      cardBg: 'rgba(28, 16, 44, 0.75)',
      cardBorder: 'rgba(168, 85, 247, 0.28)',
      rgb: [168, 85, 247],
      swatch: '#a855f7'
    }
  };

  window.SAMBIT_PALETTES = PALETTES;

  function hexToRgb(hex) {
    var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || '').trim());
    if (!m) return [74, 222, 128];
    var h = m[1].length === 3 ? m[1].split('').map(function (c) { return c + c; }).join('') : m[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function applyTheme(key, persist) {
    var actualKey = (key && PALETTES[key]) ? key : 'cyber';
    var p = PALETTES[actualKey];
    var rgb = p.rgb || hexToRgb(p.warm);
    var bgRgb = hexToRgb(p.background);

    var doc = document.documentElement;
    if (doc) {
      doc.setAttribute('data-theme', actualKey);
      doc.style.setProperty('--green', p.warm);
      doc.style.setProperty('--accent', p.warm);
      doc.style.setProperty('--theme-color', p.warm);
      doc.style.setProperty('--green-rgb', rgb[0] + ', ' + rgb[1] + ', ' + rgb[2]);
      doc.style.setProperty('--green-glow', 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', 0.16)');
      doc.style.setProperty('--green-soft', 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', 0.06)');
      doc.style.setProperty('--glow', 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', 0.16)');
      doc.style.setProperty('--gg', 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', 0.10)');
      doc.style.setProperty('--border-hover', 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', 0.45)');
      doc.style.setProperty('--bg', p.background);
      doc.style.setProperty('--bg-rgb', bgRgb[0] + ', ' + bgRgb[1] + ', ' + bgRgb[2]);
    }

    if (document.body) {
      document.body.style.backgroundColor = p.background;
    }

    // Update <meta name="theme-color"> if present
    var metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', p.background);
    }

    // Update Hero Halftone Wordmark element if present on page
    var hero = document.getElementById('hero');
    if (hero) hero.style.backgroundColor = p.background;

    var hwfRoot = document.querySelector('.hwf-root');
    if (hwfRoot) {
      hwfRoot.style.setProperty('--hwf-bg', p.background);
      hwfRoot.style.setProperty('--hwf-ink', p.ink);
      hwfRoot.style.setProperty('--hwf-warm', p.warm);
    }

    // Update theme toggle UI elements
    var badge = document.getElementById('htt-active-badge');
    if (badge) badge.textContent = p.name;

    var swatch = document.getElementById('htt-active-swatch');
    if (swatch) {
      swatch.style.background = p.swatch;
      swatch.style.boxShadow = '0 0 10px ' + p.swatch;
    }

    var cols = document.querySelectorAll('.htb-col');
    cols.forEach(function (c) {
      c.classList.toggle('active', c.dataset.preset === actualKey);
    });

    // Update compact badge if present on subpages / login
    var loginBadge = document.getElementById('login-theme-badge');
    if (loginBadge) {
      loginBadge.textContent = p.name;
    }
    var loginSwatch = document.getElementById('login-theme-swatch');
    if (loginSwatch) {
      loginSwatch.style.background = p.swatch;
      loginSwatch.style.boxShadow = '0 0 8px ' + p.swatch;
    }

    // Sync Halftone Engine if initialized
    if (window.heroHalftoneInstance && window.heroHalftoneInstance.currentPreset !== actualKey) {
      window.heroHalftoneInstance.setPreset(actualKey);
    }

    // Sync 3D Skyline if initialized
    if (window.heroSkylineInstance && window.heroSkylineInstance.setPalette) {
      window.heroSkylineInstance.setPalette(actualKey);
    }

    if (persist) {
      try {
        localStorage.setItem('sambit_portfolio_theme', actualKey);
      } catch (e) {}
    }

    // Broadcast theme change event so any active matrix canvas or widget can adapt instantly
    try {
      window.dispatchEvent(new CustomEvent('sambitThemeChange', {
        detail: { key: actualKey, palette: p }
      }));
    } catch (e) {}
  }

  window.applySambitTheme = applyTheme;
  window.getSambitCurrentTheme = function () {
    try {
      var saved = localStorage.getItem('sambit_portfolio_theme');
      return (saved && PALETTES[saved]) ? saved : 'cyber';
    } catch (e) {
      return 'cyber';
    }
  };
  window.getSambitThemeColor = function () {
    var key = window.getSambitCurrentTheme();
    return (PALETTES[key] && PALETTES[key].warm) ? PALETTES[key].warm : '#4ade80';
  };

  // Immediate synchronous execution on load (prevents any flash of unstyled theme)
  var initialKey = window.getSambitCurrentTheme();
  applyTheme(initialKey, false);

  // Sync when DOM is ready (in case body was null during immediate head execution)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      applyTheme(initialKey, false);
    });
  }

  // Cross-tab theme synchronization
  window.addEventListener('storage', function (e) {
    if (e.key === 'sambit_portfolio_theme' && e.newValue) {
      applyTheme(e.newValue, false);
    }
  });
})();
