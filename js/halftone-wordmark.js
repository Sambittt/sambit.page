/**
 * Halftone Wordmark Engine — Vanilla JS implementation for sambit.page
 * Inspired by 21st.dev Halftone Wordmark Component
 * 
 * Features:
 * - 2D Canvas rendering of portrait on left & wordmark on right bottom
 * - Dotted halftone portrait: complete outline & procedural body extension for right side
 * - Dynamic theme color matching for skin dots
 * - Seamless integration with 3D Contribution Skyline & expandable Theme Matrix
 * - Spring physics repulsion, click ripples, film grain overlay
 */

(function () {
  'use strict';

  function hwfHex(hex) {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || '').trim());
    if (!m) return null;
    const h = m[1].length === 3 ? m[1].split('').map(c => c + c).join('') : m[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function hwfRadius(coverage, gap) {
    const c = coverage < 0 ? 0 : coverage > 1 ? 1 : coverage;
    return Math.sqrt(c) * gap * 0.44;
  }

  function hwfStep(x, y, vx, vy, hx, hy, px, py, r) {
    const dx = x - px;
    const dy = y - py;
    const d2 = dx * dx + dy * dy;
    if (r > 0 && d2 < r * r) {
      const d = Math.sqrt(d2) + 0.001;
      const f = (1 - d / r) * 3.0;
      vx += (dx / d) * f;
      vy += (dy / d) * f;
    }
    // Fast, crisp spring physics: tension 0.22 & damping 0.68
    // Snaps dots back to original shape rapidly without sluggish water/jelly delay
    vx = (vx + (hx - x) * 0.22) * 0.68;
    vy = (vy + (hy - y) * 0.22) * 0.68;
    return [x + vx, y + vy, vx, vy];
  }

  function hwfWarmth(x, y, hx, hy, span) {
    const d = Math.hypot(x - hx, y - hy);
    return span > 0 ? Math.min(1, d / span) : 0;
  }

  const PALETTES = {
    cyber: {
      name: 'CYBER',
      code: 'CYBER_01',
      background: '#030303',
      ink: '#f0ede6',
      warm: '#4ade80',
      cardBg: 'rgba(28, 36, 32, 0.75)',
      cardBorder: 'rgba(74, 222, 128, 0.28)',
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
      swatch: '#a855f7'
    }
  };

  const SANS_STACK = '"Inter Tight", "Inter Variable", "Inter", "Helvetica Neue", Arial, system-ui, sans-serif';

  class HalftoneWordmark {
    constructor(rootEl, options = {}) {
      this.root = rootEl;
      if (!this.root) return;

      this.canvas = this.root.querySelector('canvas') || document.createElement('canvas');
      if (!this.canvas.parentElement) {
        this.canvas.setAttribute('aria-hidden', 'true');
        this.root.prepend(this.canvas);
      }

      this.ctx = this.canvas.getContext('2d');
      if (!this.ctx) return;

      const presetKey = this.root.dataset.preset || options.preset || 'cyber';
      const preset = PALETTES[presetKey] || PALETTES.cyber;
      this.currentPreset = presetKey;

      this.colors = {
        background: this.root.dataset.background || options.background || preset.background,
        ink: this.root.dataset.ink || options.ink || preset.ink,
        warm: this.root.dataset.warm || options.warm || preset.warm,
      };
      this.cardBorder = preset.cardBorder;

      this.wordmark = this.root.dataset.wordmark || options.wordmark || 'sambit';
      this.dotGap = Math.max(2.5, parseFloat(this.root.dataset.dotGap || options.dotGap || 3.8));
      this.radius = parseFloat(this.root.dataset.radius || options.radius || 95);
      this.grain = parseFloat(this.root.dataset.grain || options.grain || 0.40);
      this.interactive = this.root.dataset.interactive !== 'false' && options.interactive !== false;
      this.fontFamily = this.root.dataset.fontFamily || options.fontFamily || SANS_STACK;
      this.fontWeight = parseInt(this.root.dataset.fontWeight || options.fontWeight || 800, 10);

      this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.w = 0;
      this.h = 0;
      this.dpr = 1;
      this.px = -1e5;
      this.py = -1e5;
      this.raf = 0;
      this.visible = true;
      this.awake = true;
      this.ring = { x: 0, y: 0, t: -1 };
      this.dots = new Float32Array(0);
      this.count = 0;
      this.grainTile = null;
      this.cardBounds = null;

      this.inkRgb = hwfHex(this.colors.ink) || [240, 237, 230];
      this.warmRgb = hwfHex(this.colors.warm) || [74, 222, 128];

      this.imageSrc = this.root.dataset.image || options.image || '/assets/sambit_cutout.png';
      this.avatarImg = null;
      if (this.imageSrc) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = this.imageSrc;
        img.onload = () => {
          this.avatarImg = img;
          this.layout();
          this.wake();
        };
        if (img.complete && img.naturalWidth > 0) {
          this.avatarImg = img;
        }
      }

      this.init();
    }

    init() {
      this.layout = this.layout.bind(this);
      this.draw = this.draw.bind(this);
      this.loop = this.loop.bind(this);
      this.wake = this.wake.bind(this);
      this.onMove = this.onMove.bind(this);
      this.onLeave = this.onLeave.bind(this);
      this.onDown = this.onDown.bind(this);

      this.layout();
      this.draw(performance.now());
      this.wake();

      this.root.addEventListener('pointermove', this.onMove, { passive: true });
      this.root.addEventListener('pointerleave', this.onLeave, { passive: true });
      this.root.addEventListener('pointerdown', this.onDown, { passive: true });

      if (window.ResizeObserver) {
        this.ro = new ResizeObserver(() => {
          this.layout();
          this.wake();
        });
        this.ro.observe(this.root);
      }

      if (window.IntersectionObserver) {
        this.io = new IntersectionObserver((entries) => {
          this.visible = entries[0] ? entries[0].isIntersecting : true;
          if (this.visible) this.wake();
        });
        this.io.observe(this.root);
      }

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          this.layout();
          this.wake();
        });
      }

      setTimeout(() => {
        this.layout();
        this.wake();
      }, 100);
    }

    setPreset(key) {
      const p = PALETTES[key];
      if (!p) return;
      this.currentPreset = key;
      this.colors.background = p.background;
      this.colors.ink = p.ink;
      this.colors.warm = p.warm;
      this.cardBorder = p.cardBorder;
      this.inkRgb = hwfHex(p.ink) || [240, 237, 230];
      this.warmRgb = hwfHex(p.warm) || [74, 222, 128];

      // ── GLOBAL THEME APPLICATION: Entire website transforms to selected palette ──
      if (window.applySambitTheme) {
        window.applySambitTheme(key, true);
      } else {
        const doc = document.documentElement;
        const rgb = this.warmRgb;
        doc.style.setProperty('--green', p.warm);
        doc.style.setProperty('--green-rgb', `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`);
        doc.style.setProperty('--green-glow', `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.16)`);
        doc.style.setProperty('--green-soft', `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.06)`);
        doc.style.setProperty('--border-hover', `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.45)`);
        doc.style.setProperty('--bg', p.background);
        if (document.body) {
          document.body.style.backgroundColor = p.background;
        }
      }

      this.root.style.setProperty('--hwf-bg', p.background);
      this.root.style.setProperty('--hwf-ink', p.ink);
      this.root.style.setProperty('--hwf-warm', p.warm);

      const hero = document.getElementById('hero');
      if (hero) hero.style.backgroundColor = p.background;

      // Update badge and swatch in compact theme toggle button
      const badge = document.getElementById('htt-active-badge');
      if (badge) badge.textContent = p.name;

      const swatch = document.getElementById('htt-active-swatch');
      if (swatch) {
        swatch.style.background = p.swatch;
        swatch.style.boxShadow = `0 0 10px ${p.swatch}`;
      }

      // Update active theme buttons in dropdown
      const cols = document.querySelectorAll('.htb-col');
      cols.forEach(c => {
        c.classList.toggle('active', c.dataset.preset === key);
      });

      // Synchronize 3D Contribution Skyline palette
      if (window.heroSkylineInstance && window.heroSkylineInstance.setPalette) {
        window.heroSkylineInstance.setPalette(key);
      }

      // Persist across page reloads & visits
      try {
        localStorage.setItem('sambit_portfolio_theme', key);
      } catch (e) {}

      // Ripple shockwave
      this.ring = { x: this.w * 0.5, y: this.h * 0.5, t: performance.now() };
      this.wake();
    }

    toLocal(e) {
      const b = this.canvas.getBoundingClientRect();
      return [e.clientX - b.left, e.clientY - b.top];
    }

    onMove(e) {
      if (!this.interactive) return;
      const p = this.toLocal(e);
      this.px = p[0];
      this.py = p[1];
      this.wake();
    }

    onLeave() {
      this.px = -1e5;
      this.py = -1e5;
      this.wake();
    }

    onDown(e) {
      if (!this.interactive || this.reduced) return;
      if (e.target && e.target.closest && e.target.closest('a, button, input, .skyline-card')) return;
      const p = this.toLocal(e);
      this.ring = { x: p[0], y: p[1], t: performance.now() };
      this.wake();
    }

    layout() {
      const rect = this.root.getBoundingClientRect();
      this.w = Math.max(1, Math.round(rect.width));
      this.h = Math.max(1, Math.round(rect.height));
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(this.w * this.dpr);
      this.canvas.height = Math.round(this.h * this.dpr);

      const mask = document.createElement('canvas');
      mask.width = this.w;
      mask.height = this.h;
      const m = mask.getContext('2d', { willReadFrequently: true });
      if (!m) return;

      const gap = this.dotGap;
      const tmp = [];
      const isDesktop = this.w >= 992;

      let cardX = 0, cardY = 0, cardW = 0, cardH = 0;
      let drawW = 0, drawH = 0, drawX = 0, drawY = 0;
      let textX = 0, textY = 0;
      let wordTop = 0;
      const word = this.wordmark || 'sambit';

      if (isDesktop) {
        // ── 1. PHOTO ON THE LEFT:
        cardX = Math.round(this.w * 0.035);
        cardW = Math.min(Math.round(this.w * 0.28), 390);
        cardH = Math.min(Math.round(this.h * 0.80), 550);
        cardY = Math.round((this.h - cardH) / 2);
        this.cardBounds = { x: cardX, y: cardY, w: cardW, h: cardH };

        if (this.avatarImg) {
          const imgW = this.avatarImg.naturalWidth || 1018;
          const imgH = this.avatarImg.naturalHeight || 1024;
          const aspect = imgW / imgH;

          // Hair in cutout starts at y = 61 out of 1024 (~6% from image top)
          // Head center X in image is around 448 out of 1018 (~44% from image left)
          // Clean, aesthetic margin from card top:
          const topMargin = Math.max(18, Math.round(cardH * 0.04));

          // Scale portrait so hair starts near top and body fills down to card bottom:
          drawH = Math.round((cardH - topMargin + 10) / 0.94);
          drawW = Math.round(drawH * aspect);

          // Position hair top at cardY + topMargin (no excessive void at the top):
          drawY = Math.round(cardY + topMargin - (61 / 1024) * drawH);

          // Horizontally center Sambit's face:
          const cardCenterX = cardX + cardW * 0.5;
          drawX = Math.round(cardCenterX - 0.44 * drawW);

          m.drawImage(this.avatarImg, drawX, drawY, drawW, drawH);
        }

        // ── 2. NAME ON THE RIGHT (POSITIONED AT TOP):
        const rightAreaLeft = cardX + cardW + Math.round(this.w * 0.035);
        const rightAreaW = this.w - rightAreaLeft - Math.round(this.w * 0.035);

        // Wordmark sizing for crisp, prominent top placement:
        const availWordH = Math.min(this.h * 0.20, 135);

        m.font = this.fontWeight + ' 100px ' + this.fontFamily;
        const testMetrics = m.measureText(word);
        const testW = testMetrics.width || 1;
        const testAscent = testMetrics.actualBoundingBoxAscent || 72;
        const testDescent = testMetrics.actualBoundingBoxDescent || 18;
        const testH = testAscent + testDescent;

        const targetWordW = Math.min(rightAreaW * 0.94 - 60, 1050);
        const scaleW = (targetWordW / testW) * 100;
        const scaleH = (availWordH / testH) * 100;
        const fit = Math.max(46, Math.floor(Math.min(scaleW, scaleH)));

        m.font = this.fontWeight + ' ' + fit + 'px ' + this.fontFamily;
        const finalMetrics = m.measureText(word);
        const descent = (typeof finalMetrics.actualBoundingBoxDescent === 'number' && !isNaN(finalMetrics.actualBoundingBoxDescent))
          ? finalMetrics.actualBoundingBoxDescent
          : fit * 0.2;
        const ascent = (typeof finalMetrics.actualBoundingBoxAscent === 'number' && !isNaN(finalMetrics.actualBoundingBoxAscent))
          ? finalMetrics.actualBoundingBoxAscent
          : fit * 0.75;

        textX = rightAreaLeft;
        wordTop = Math.max(16, Math.round(cardY + 2));
        textY = Math.round(wordTop + ascent);
        const wordBottom = Math.round(wordTop + ascent + descent);
        const wordH = Math.round(ascent + descent);

        // Inform CSS of exact wordmark bounds so the role tag and dashboard align with it
        const wordHFromBottom = Math.round(this.h - wordTop);
        const heroEl = document.getElementById('hero');
        if (heroEl) {
          heroEl.style.setProperty('--hwf-word-h-bottom', `${wordHFromBottom}px`);
          heroEl.style.setProperty('--hwf-word-top', `${Math.round(wordTop)}px`);
          heroEl.style.setProperty('--hwf-word-bottom', `${Math.round(wordBottom)}px`);
          heroEl.style.setProperty('--hwf-word-h', `${Math.round(wordH)}px`);
          heroEl.style.setProperty('--hwf-word-left', `${Math.round(textX)}px`);

          const taglinesEl = document.getElementById('hero-taglines-wrap');
          const taglinesH = taglinesEl && taglinesEl.offsetHeight > 0 ? taglinesEl.offsetHeight : 78;
          heroEl.style.setProperty('--hwf-taglines-h', `${taglinesH}px`);
        }

        m.fillStyle = '#00ff00';
        m.textBaseline = 'alphabetic';
        m.fillText(word, textX, textY);

      } else {
        // ── MOBILE LAYOUT (Clean Vertical Stack Inside Self-Contained Canvas)
        const padX = Math.round(this.w * 0.04);
        cardW = Math.min(190, Math.round(this.w * 0.52));
        cardH = Math.min(180, Math.round(cardW * 0.95));
        cardX = Math.round((this.w - cardW) / 2);
        cardY = 4;
        this.cardBounds = { x: cardX, y: cardY, w: cardW, h: cardH };

        if (this.avatarImg) {
          const imgW = this.avatarImg.naturalWidth || 1018;
          const imgH = this.avatarImg.naturalHeight || 1024;
          const aspect = imgW / imgH;
          const dh = Math.round(cardH * 1.04);
          const dw = Math.round(dh * aspect);
          const dx = Math.round(cardX + (cardW - dw) / 2);
          const dy = Math.round(cardY + 8 - (61 / 1024) * dh);
          m.drawImage(this.avatarImg, dx, dy, dw, dh);
        }

        wordTop = cardY + cardH + 6;
        m.font = this.fontWeight + ' 100px ' + this.fontFamily;
        const testMetrics = m.measureText(word);
        const scaleW = ((this.w - padX * 2) * 0.85 / (testMetrics.width || 1)) * 100;
        const fit = Math.min(Math.round(scaleW), 38);

        m.font = this.fontWeight + ' ' + fit + 'px ' + this.fontFamily;
        const finalMetrics = m.measureText(word);
        const descent = (typeof finalMetrics.actualBoundingBoxDescent === 'number' && !isNaN(finalMetrics.actualBoundingBoxDescent))
          ? finalMetrics.actualBoundingBoxDescent
          : fit * 0.22;
        const ascent = (typeof finalMetrics.actualBoundingBoxAscent === 'number' && !isNaN(finalMetrics.actualBoundingBoxAscent))
          ? finalMetrics.actualBoundingBoxAscent
          : fit * 0.75;

        textX = Math.round((this.w - finalMetrics.width) / 2);
        textY = Math.round(wordTop + ascent);

        m.fillStyle = '#00ff00';
        m.textBaseline = 'alphabetic';
        m.fillText(word, textX, textY);

        const heroEl = document.getElementById('hero');
        if (heroEl) {
          heroEl.style.setProperty('--hwf-word-left', `${Math.round(textX)}px`);
          heroEl.style.setProperty('--hwf-word-top', `${Math.round(wordTop)}px`);
          heroEl.style.setProperty('--hwf-word-bottom', `${Math.round(wordTop + ascent + descent)}px`);
          heroEl.style.setProperty('--hero-card-left', `${cardX}px`);
          heroEl.style.setProperty('--hero-card-w', `${cardW}px`);
        }
      }

      // Card boundary clipping helper (ensures clean card frame)
      const inCard = (x, y) => {
        if (!this.cardBounds) return true;
        const { x: cx, y: cy, w: cw, h: ch } = this.cardBounds;
        if (x < cx + gap * 0.5 || x > cx + cw - gap * 0.5) return false;
        if (y < cy + gap * 0.5 || y > cy + ch - gap * 0.5) return false;
        const r = 16;
        if (x < cx + r && y < cy + r) {
          const dx = x - (cx + r), dy = y - (cy + r);
          if (dx * dx + dy * dy > r * r) return false;
        }
        if (x > cx + cw - r && y < cy + r) {
          const dx = x - (cx + cw - r), dy = y - (cy + r);
          if (dx * dx + dy * dy > r * r) return false;
        }
        if (x < cx + r && y > cy + ch - r) {
          const dx = x - (cx + r), dy = y - (cy + ch - r);
          if (dx * dx + dy * dy > r * r) return false;
        }
        if (x > cx + cw - r && y > cy + ch - r) {
          const dx = x - (cx + cw - r), dy = y - (cy + ch - r);
          if (dx * dx + dy * dy > r * r) return false;
        }
        return true;
      };

      // ── 3. TWO-PASS DOT SAMPLING WITH ISOLATED SPECK FILTER ──
      const imgData = m.getImageData(0, 0, this.w, this.h).data;
      const cols = Math.ceil(this.w / gap);
      const rows = Math.ceil(this.h / gap);

      // Grid of dot presence (1 = portrait, 2 = wordmark)
      const dotGrid = new Uint8Array(cols * rows);
      const candidates = [];

      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const hx = gx * gap + gap / 2;
          const hy = gy * gap + gap / 2;
          const px = Math.min(this.w - 1, Math.floor(hx));
          const py = Math.min(this.h - 1, Math.floor(hy));
          const idx = (py * this.w + px) * 4;
          const a = imgData[idx + 3];

          // Use a > 10 threshold for ultra-clean, complete silhouette outline
          if (a > 10) {
            const r = imgData[idx];
            const g = imgData[idx + 1];
            const b = imgData[idx + 2];
            const isWordmark = (g > 200 && r < 40 && b < 40);

            if (isWordmark) {
              let sum = 0;
              for (let sy = 0; sy < 3; sy++) {
                for (let sx = 0; sx < 3; sx++) {
                  const sxPos = Math.min(this.w - 1, Math.max(0, Math.floor(hx + (sx - 1) * (gap / 3))));
                  const syPos = Math.min(this.h - 1, Math.max(0, Math.floor(hy + (sy - 1) * (gap / 3))));
                  const sIdx = (syPos * this.w + sxPos) * 4;
                  if (imgData[sIdx + 1] > 200 && imgData[sIdx] < 40) {
                    sum += imgData[sIdx + 3];
                  }
                }
              }
              const cov = sum / (9 * 255);
              if (cov >= 0.12) {
                const rDot = hwfRadius(cov, gap);
                dotGrid[gy * cols + gx] = 2;
                candidates.push({ gx, gy, hx, hy, rDot, tone: 2, isWordmark: true });
              }
            } else {
              // PORTRAIT PHOTO: Only keep dots inside card bounds
              if (this.cardBounds && !inCard(hx, hy)) continue;

              const lum = r * 0.299 + g * 0.587 + b * 0.114;
              const toneFactor = Math.min(1, Math.max(0, (lum - 36) / 54));
              const cov = toneFactor < 0.25 ? 0.72 : 0.38 + toneFactor * 0.58;
              const rDot = hwfRadius(cov, gap);

              dotGrid[gy * cols + gx] = 1;
              candidates.push({ gx, gy, hx, hy, rDot, tone: toneFactor, isWordmark: false });
            }
          }
        }
      }

      // PASS 2: Stray / isolated speck elimination
      for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i];
        if (c.isWordmark) {
          tmp.push(c.hx, c.hy, 0, 0, c.hx, c.hy, c.rDot, c.tone);
        } else {
          let hasNeighbor = false;
          for (let ny = -1; ny <= 1; ny++) {
            for (let nx = -1; nx <= 1; nx++) {
              if (nx === 0 && ny === 0) continue;
              const cy = c.gy + ny, cx = c.gx + nx;
              if (cy >= 0 && cy < rows && cx >= 0 && cx < cols) {
                if (dotGrid[cy * cols + cx]) {
                  hasNeighbor = true;
                  break;
                }
              }
            }
            if (hasNeighbor) break;
          }
          if (hasNeighbor) {
            tmp.push(c.hx, c.hy, 0, 0, c.hx, c.hy, c.rDot, c.tone);
          }
        }
      }

      this.dots = new Float32Array(tmp);
      this.count = tmp.length / 8;

      // Print grain tile
      this.grainTile = document.createElement('canvas');
      this.grainTile.width = 256;
      this.grainTile.height = 256;
      const gr = this.grainTile.getContext('2d');
      if (gr) {
        const id = gr.createImageData(256, 256);
        for (let i = 0; i < id.data.length; i += 4) {
          const v = Math.random() * 255;
          id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
          id.data[i + 3] = Math.random() < 0.5 ? 0 : 255;
        }
        gr.putImageData(id, 0, 0);
      }
      this.awake = true;
    }

    draw(now) {
      const ctx = this.ctx;
      const dpr = this.dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = this.colors.background;
      ctx.fillRect(0, 0, this.w, this.h);

      // Draw backdrop card on left (desktop)
      if (this.cardBounds) {
        const { x, y, w, h } = this.cardBounds;
        const r = 16;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();

        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, 'rgba(42, 48, 58, 0.72)');
        grad.addColorStop(0.55, 'rgba(28, 32, 40, 0.82)');
        grad.addColorStop(1, 'rgba(16, 18, 24, 0.92)');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = this.cardBorder || 'rgba(74, 222, 128, 0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      const r = this.interactive && !this.reduced ? Math.max(0, this.radius) : 0;
      const ringAge = this.ring.t < 0 ? 1e9 : now - this.ring.t;
      const ringR = ringAge * 0.9;
      let moving = false;

      const ink = this.inkRgb;
      const warm = this.warmRgb;
      const count = this.count;
      const dots = this.dots;

      for (let i = 0; i < count; i++) {
        const j = i * 8;
        let x = dots[j];
        let y = dots[j + 1];
        let vx = dots[j + 2];
        let vy = dots[j + 3];
        const hx = dots[j + 4];
        const hy = dots[j + 5];
        const rad = dots[j + 6];
        const toneFactor = dots[j + 7];

        if (!this.reduced) {
          if (ringAge < 900) {
            const dx = hx - this.ring.x;
            const dy = hy - this.ring.y;
            const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
            const band = 1 - Math.min(1, Math.abs(d - ringR) / 28);
            if (band > 0) {
              const f = band * 3.4 * (1 - ringAge / 900);
              vx += (dx / d) * f;
              vy += (dy / d) * f;
            }
          }

          const s = hwfStep(x, y, vx, vy, hx, hy, this.px, this.py, r);
          x = s[0];
          y = s[1];
          vx = s[2];
          vy = s[3];

          if (Math.abs(vx) + Math.abs(vy) > 0.03 || Math.abs(x - hx) + Math.abs(y - hy) > 0.08) {
            moving = true;
          } else {
            x = hx;
            y = hy;
            vx = 0;
            vy = 0;
          }

          dots[j] = x;
          dots[j + 1] = y;
          dots[j + 2] = vx;
          dots[j + 3] = vy;
        }

        const k = hwfWarmth(x, y, hx, hy, 28);

        if (toneFactor >= 1.5) {
          // Wordmark dot
          ctx.fillStyle =
            k > 0.02
              ? 'rgb(' +
                Math.round(ink[0] + (warm[0] - ink[0]) * k) + ',' +
                Math.round(ink[1] + (warm[1] - ink[1]) * k) + ',' +
                Math.round(ink[2] + (warm[2] - ink[2]) * k) + ')'
              : this.colors.ink;
        } else {
          // Portrait dot: deep black for hair/shirt, theme ink for skin
          const baseR = Math.round(12 + toneFactor * (ink[0] - 12));
          const baseG = Math.round(12 + toneFactor * (ink[1] - 12));
          const baseB = Math.round(14 + toneFactor * (ink[2] - 14));

          if (k > 0.02) {
            ctx.fillStyle =
              'rgb(' +
              Math.round(baseR + (warm[0] - baseR) * k * 0.75) + ',' +
              Math.round(baseG + (warm[1] - baseG) * k * 0.75) + ',' +
              Math.round(baseB + (warm[2] - baseB) * k * 0.75) + ')';
          } else {
            ctx.fillStyle = 'rgb(' + baseR + ',' + baseG + ',' + baseB + ')';
          }
        }

        ctx.beginPath();
        ctx.arc(x, y, rad, 0, 6.2832);
        ctx.fill();
      }

      if (this.grainTile && this.grain > 0) {
        ctx.globalAlpha = Math.min(1, this.grain) * 0.07;
        ctx.globalCompositeOperation = 'overlay';
        const pattern = ctx.createPattern(this.grainTile, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, this.w, this.h);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }

      this.awake = moving || ringAge < 900 || this.px > -1e4;
    }

    loop(now) {
      this.raf = 0;
      if (!this.visible) return;
      this.draw(now);
      if (this.awake) this.raf = requestAnimationFrame(this.loop);
    }

    wake() {
      this.awake = true;
      if (!this.raf && this.visible) this.raf = requestAnimationFrame(this.loop);
    }

    destroy() {
      if (this.raf) cancelAnimationFrame(this.raf);
      if (this.ro) this.ro.disconnect();
      if (this.io) this.io.disconnect();
      this.root.removeEventListener('pointermove', this.onMove);
      this.root.removeEventListener('pointerleave', this.onLeave);
      this.root.removeEventListener('pointerdown', this.onDown);
    }
  }

  // Global theme switcher hook
  window.switchHeroTheme = function (presetName) {
    const el = document.querySelector('.hwf-root');
    if (el && el._hwfInstance) {
      el._hwfInstance.setPreset(presetName);
    }
  };

  // Auto-initialize on DOM ready
  function initHalftones() {
    document.querySelectorAll('.hwf-root').forEach((el) => {
      if (!el._hwfInstance) {
        el._hwfInstance = new HalftoneWordmark(el);
      }
    });

    // Wire up expandable theme toggle button
    const toggleBtn = document.getElementById('hero-theme-toggle-btn');
    const dropdownWrap = document.getElementById('hero-theme-wrapper');
    if (toggleBtn && dropdownWrap) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdownWrap.classList.toggle('is-open');
        toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      document.addEventListener('click', (e) => {
        if (!dropdownWrap.contains(e.target)) {
          dropdownWrap.classList.remove('is-open');
          toggleBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Attach click events to theme buttons
    document.querySelectorAll('.htb-col').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const preset = btn.dataset.preset;
        if (preset && window.switchHeroTheme) {
          window.switchHeroTheme(preset);
        }
      });
    });

    // Restore saved theme across the entire website
    try {
      const savedTheme = localStorage.getItem('sambit_portfolio_theme');
      if (savedTheme && PALETTES[savedTheme] && window.switchHeroTheme) {
        window.switchHeroTheme(savedTheme);
      }
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHalftones);
  } else {
    initHalftones();
  }

  window.HalftoneWordmark = HalftoneWordmark;
})();
