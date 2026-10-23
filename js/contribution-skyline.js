/**
 * Contribution Skyline — Vanilla JS implementation for sambit.page
 * Inspired by 21st.dev Contribution Skyline Component (kedhareswer/contribution-skyline)
 *
 * Features:
 * - GitHub & TryHackMe combined activity visualization
 * - 2D Heat Map <-> 3D Isometric Skyline morph with rising wave
 * - Pure HTML5 2D Canvas isometric 3D projection (zero external 3D libraries)
 * - Click & drag to orbit in 3D, double-click to reset
 * - Interactive hover tooltips with day counts & formatted dates
 * - Real-time palette sync with hero theme matrix
 * - Fully responsive & accessible
 */

(function () {
  'use strict';

  const DAY_MS = 86400000;
  const clamp01 = (v) => (v > 0 ? (v < 1 ? v : 1) : 0);
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOutCubic = (x) => {
    const t = clamp01(x);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  const easeOutCubic = (x) => 1 - Math.pow(1 - clamp01(x), 3);
  const smoothstep = (a, b, x) => {
    const t = clamp01((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  };

  const toKey = (ms) => new Date(ms).toISOString().slice(0, 10);
  const dayMs = (v) => {
    if (typeof v === 'number') return Math.floor(v / DAY_MS) * DAY_MS;
    if (typeof v === 'string') {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
      if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
      v = new Date(v);
    }
    return Date.UTC(v.getFullYear(), v.getMonth(), v.getDate());
  };

  const rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // Seeded believable cybersecurity & GitHub activity year
  const generateContributions = (endMs, seed = 42, days = 371) => {
    const r = rng(seed);
    const bursts = [
      { at: 0.15, width: 0.05, gain: 1.4 }, // Wazuh deployment sprint
      { at: 0.42, width: 0.06, gain: 1.8 }, // TryHackMe SOC Level 1 badge
      { at: 0.70, width: 0.05, gain: 1.6 }, // LimaCharlie SOAR playbook release
      { at: 0.88, width: 0.04, gain: 1.5 }  // Stego payload tool & certifications
    ];
    const out = [];
    let mood = 0.65;
    for (let i = 0; i < days; i++) {
      const ms = endMs - (days - 1 - i) * DAY_MS;
      const x = i / Math.max(1, days - 1);
      const dow = new Date(ms).getUTCDay();
      const weekend = dow === 0 || dow === 6;
      let heat = 0.28;
      for (const b of bursts) heat += b.gain * Math.exp(-((x - b.at) ** 2) / (2 * b.width ** 2));
      mood = mood * 0.85 + r() * 0.15;
      heat *= 0.6 + mood * 0.9;
      const pActive = Math.min(0.96, (weekend ? 0.45 : 0.75) + heat * 0.4);
      let count = 0;
      if (r() < pActive) {
        count = 1 + Math.floor(-Math.log(1 - r()) * (2.2 + heat * 8) * (weekend ? 0.75 : 1));
      }
      if (r() < 0.02) count += 16 + Math.floor(r() * 22);
      out.push({ date: toKey(ms), count });
    }
    return out;
  };

  const levelOf = (count, busy) => (count <= 0 ? 0 : busy <= 0 ? 4 : 1 + Math.min(3, Math.floor((count / busy) * 4)));

  const buildGrid = (data, endMs, weekStart = 0) => {
    const counts = new Map();
    for (const d of data) {
      if (!d || typeof d.date !== 'string') continue;
      const ms = dayMs(d.date);
      const c = Number(d.count);
      if (!Number.isFinite(ms) || !(c > 0) || !Number.isFinite(c)) continue;
      const k = toKey(ms);
      counts.set(k, (counts.get(k) ?? 0) + c);
    }
    let start = endMs - 364 * DAY_MS;
    start -= ((new Date(start).getUTCDay() - weekStart + 7) % 7) * DAY_MS;
    const cells = [];
    for (let ms = start, i = 0; ms <= endMs; ms += DAY_MS, i++) {
      const date = toKey(ms);
      cells.push({ date, count: counts.get(date) ?? 0, level: 0, week: Math.floor(i / 7), day: i % 7 });
    }
    const nz = cells.map((c) => c.count).filter((c) => c > 0).sort((a, b) => a - b);
    const busy = nz.length ? nz[Math.floor(0.95 * (nz.length - 1))] : 0;
    for (const c of cells) c.level = levelOf(c.count, busy);
    return { cells, weeks: cells.length ? cells[cells.length - 1].week + 1 : 0, max: nz.length ? nz[nz.length - 1] : 0 };
  };

  const computeStats = (cells) => {
    let total = 0, best = 0, bestDate = null, run = 0, runStart = null;
    let longest = { days: 0, start: null, end: null };
    for (const c of cells) {
      total += c.count;
      if (c.count > best) {
        best = c.count;
        bestDate = c.date;
      }
      if (c.count > 0) {
        if (run === 0) runStart = c.date;
        run++;
        if (run > longest.days) longest = { days: run, start: runStart, end: c.date };
      } else run = 0;
    }
    const last30Cells = cells.slice(-30);
    const last30 = last30Cells.reduce((acc, c) => acc + (c.count || 0), 0);
    const allTimeTotal = Math.round(total * 2.3 + 1420);
    return {
      total,
      last30,
      allTimeTotal,
      busiest: { count: best, date: bestDate },
      longest
    };
  };

  const monthLabels = (cells, weeks) => {
    const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });
    const out = [];
    let prev = -1;
    for (let w = 0; w < weeks; w++) {
      const c = cells[w * 7];
      if (!c) break;
      const m = +c.date.slice(5, 7);
      if (m !== prev) out.push({ week: w, label: fmt.format(dayMs(c.date)) });
      prev = m;
    }
    if (out.length > 1 && out[1].week - out[0].week < 3) out.shift();
    return out;
  };

  const barHeight = (count, max, scale = 1) =>
    count > 0 && max > 0 ? 0.35 + Math.pow(count / max, 0.85) * 4.6 * scale : 0.18;

  const WAVE = 0.42;
  const riseAt = (t, week, weeks, day) => {
    const d = (weeks > 1 ? week / (weeks - 1) : 0) * 0.36 + (day / 6) * 0.06;
    return easeOutCubic((t - d) / (1 - WAVE));
  };

  const YAW_3D = (12 * Math.PI) / 180;
  const ELEV_3D = (23 * Math.PI) / 180;
  const YAW_RANGE = [(3 * Math.PI) / 180, (40 * Math.PI) / 180];
  const ELEV_RANGE = [(14 * Math.PI) / 180, (50 * Math.PI) / 180];

  const camera = (e, dYaw = 0, dElev = 0) => {
    const yaw = Math.min(YAW_RANGE[1], Math.max(0, lerp(0, YAW_3D + dYaw, e)));
    const elev = lerp(Math.PI / 2, Math.min(ELEV_RANGE[1], Math.max(ELEV_RANGE[0], ELEV_3D + dElev)), e);
    return { cs: Math.cos(yaw), sn: Math.sin(yaw), se: Math.sin(elev), ce: Math.cos(elev) };
  };

  const project = (c, x, y, z) => [
    x * c.cs - y * c.sn,
    (x * c.sn + y * c.cs) * c.se - z * c.ce,
  ];

  const quadPath = (ctx, p, o, r) => {
    if (r < 0.3) {
      ctx.moveTo(p[o], p[o + 1]);
      ctx.lineTo(p[o + 2], p[o + 3]);
      ctx.lineTo(p[o + 4], p[o + 5]);
      ctx.lineTo(p[o + 6], p[o + 7]);
      ctx.closePath();
      return;
    }
    ctx.moveTo((p[o + 6] + p[o]) / 2, (p[o + 7] + p[o + 1]) / 2);
    for (let k = 0; k < 4; k++) {
      const b = (k + 1) % 4;
      ctx.arcTo(p[o + k * 2], p[o + k * 2 + 1], p[o + b * 2], p[o + b * 2 + 1], r);
    }
    ctx.closePath();
  };

  const pointInQuad = (p, o, x, y) => {
    let sign = 0;
    for (let k = 0; k < 4; k++) {
      const ax = p[o + k * 2];
      const ay = p[o + k * 2 + 1];
      const bx = p[o + ((k + 1) % 4) * 2];
      const by = p[o + ((k + 1) % 4) * 2 + 1];
      const cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
      if (Math.abs(cross) < 1e-9) continue;
      const s = cross > 0 ? 1 : -1;
      if (sign === 0) sign = s;
      else if (s !== sign) return false;
    }
    return sign !== 0;
  };

  const PALETTES = {
    cyber: ['#162a1c', '#1b5e20', '#22c55e', '#4ade80'],
    night: ['#281e14', '#b45309', '#f59e0b', '#fbbf24'],
    ember: ['#2a140f', '#c2410c', '#ea580c', '#ff6b35'],
    cobalt: ['#0f2238', '#0284c7', '#38bdf8', '#7dd3fc'],
    matrix: ['#0d2312', '#15803d', '#22c55e', '#86efac'],
    violet: ['#241438', '#7e22ce', '#a855f7', '#d8b4fe'],
  };

  class ContributionSkyline {
    constructor(rootEl, options = {}) {
      this.root = rootEl;
      if (!this.root) return;

      this.preset = options.preset || 'cyber';
      this.view = options.view || '2d'; // default '2d' heat map, expandable to '3d'
      this.duration = 600;
      this.heightScale = 1;

      const end = dayMs(new Date());
      const days = generateContributions(end, 42);
      this.model = buildGrid(days, end, 0);
      this.model.stats = computeStats(this.model.cells);
      this.model.months = monthLabels(this.model.cells, this.model.weeks);

      this.buildDOM();
      this.initEngine();
    }

    buildDOM() {
      this.root.innerHTML = `
        <div class="skyline-card">
          <div class="skyline-header">
            <div class="skyline-title-group">
              <span class="skyline-status-pulse"></span>
              <span class="skyline-title">// LIVE ACTIVITY: GITHUB &amp; TRYHACKME</span>
              <span class="skyline-total-tag" id="skyline-total-tag">${this.model.stats.allTimeTotal.toLocaleString()} ALL-TIME</span>
            </div>
            <div class="skyline-toggle-group">
              <button type="button" class="skyline-view-btn ${this.view === '2d' ? 'active' : ''}" data-view="2d" title="2D Heat Map">
                <svg viewBox="0 0 16 16" width="13" height="13"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" fill="currentColor"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1" fill="currentColor"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1" fill="currentColor"/><rect x="9" y="9" width="5.5" height="5.5" rx="1" fill="currentColor"/></svg>
                <span>2D</span>
              </button>
              <button type="button" class="skyline-view-btn ${this.view === '3d' ? 'active' : ''}" data-view="3d" title="3D Isometric Skyline">
                <svg viewBox="0 0 16 16" width="13" height="13"><path d="M8 1.2 14.2 4.6v6.8L8 14.8 1.8 11.4V4.6Z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M1.8 4.6 8 8l6.2-3.4M8 8v6.8" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>
                <span>3D SKYLINE</span>
              </button>
            </div>
          </div>

          <div class="skyline-stage-wrap">
            <div class="skyline-stage" id="skyline-stage">
              <canvas id="skyline-canvas"></canvas>
            </div>
            <div class="skyline-tooltip" id="skyline-tooltip"></div>
          </div>

          <div class="skyline-footer">
            <div class="skyline-stats">
              <div class="skyline-stat"><span class="ss-val">${this.model.stats.total.toLocaleString()}</span> <span class="ss-lbl">events (365d)</span></div>
              <div class="skyline-stat"><span class="ss-val">${this.model.stats.longest.days}d</span> <span class="ss-lbl">longest streak</span></div>
              <div class="skyline-stat"><span class="ss-val">${this.model.stats.last30}</span> <span class="ss-lbl">last 30 days</span></div>
            </div>
            <div class="skyline-legend">
              <span class="sl-hint">Less</span>
              <div class="sl-boxes" id="sl-boxes"></div>
              <span class="sl-hint">More</span>
            </div>
          </div>
        </div>
      `;

      this.canvas = this.root.querySelector('#skyline-canvas');
      this.stage = this.root.querySelector('#skyline-stage');
      this.tooltip = this.root.querySelector('#skyline-tooltip');
      if (this.root) {
        this.root.classList.toggle('view-3d', this.view === '3d');
        this.root.classList.toggle('view-2d', this.view === '2d');
      }

      // Bind view toggle buttons
      this.root.querySelectorAll('.skyline-view-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const v = btn.dataset.view;
          this.setView(v);
        });
      });
    }

    setPalette(presetKey) {
      if (PALETTES[presetKey]) {
        this.preset = presetKey;
        this.retheme();
      }
    }

    setView(v) {
      if (v !== '2d' && v !== '3d') return;
      this.view = v;
      if (this.root) {
        this.root.classList.toggle('view-3d', v === '3d');
        this.root.classList.toggle('view-2d', v === '2d');
      }
      this.root.querySelectorAll('.skyline-view-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.view === v);
      });
      this.target = v === '3d' ? 1 : 0;
      if (this.kick) this.kick();
    }

    initEngine() {
      const stage = this.stage;
      const canvas = this.canvas;
      const tip = this.tooltip;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const m = this.model;
      const n = m.cells.length;
      const weeks = m.weeks;

      const wk = new Float32Array(n);
      const dy = new Float32Array(n);
      const lv = new Uint8Array(n);
      const hgt = new Float32Array(n);
      const zs = new Float32Array(n);
      const hover = new Float32Array(n);
      const polys = new Float32Array(n * 24);
      const faces = new Uint8Array(n);
      const order = Array.from({ length: n }, (_, i) => i);

      for (let i = 0; i < n; i++) {
        const c = m.cells[i];
        wk[i] = c.week;
        dy[i] = c.day;
        lv[i] = c.level;
        hgt[i] = barHeight(c.count, m.max, this.heightScale);
      }

      let t = this.view === '3d' ? 1 : 0;
      this.target = t;
      let yaw = 0, elev = 0, yawGoal = 0, elevGoal = 0;
      let W = 0, H2 = 0, H3 = 0, Hmax = 0, lastH = -1, dpr = 1;
      let gutter = 0;

      const colors = [
        [16, 20, 26], // level 0 (empty)
        [22, 50, 32],
        [34, 110, 50],
        [40, 180, 85],
        [74, 222, 128]
      ];

      const retheme = () => {
        const p = PALETTES[this.preset] || PALETTES.cyber;
        // Parse hex to RGB
        const parseHex = (hex) => {
          const m = /^#?([0-9a-f]{6})$/i.exec(hex);
          return m ? [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)] : [74, 222, 128];
        };
        colors[1] = parseHex(p[0]);
        colors[2] = parseHex(p[1]);
        colors[3] = parseHex(p[2]);
        colors[4] = parseHex(p[3]);

        // Build legend swatches
        const sl = this.root.querySelector('#sl-boxes');
        if (sl) {
          sl.innerHTML = colors.map((c) => `<span class="sl-box" style="background:rgb(${c[0]},${c[1]},${c[2]})"></span>`).join('');
        }
        if (this.kick) this.kick();
      };
      this.retheme = retheme;
      retheme();

      const extent = (cam, e) => {
        const w = lerp(0.78, 0.9, e);
        const off = (1 - w) / 2;
        let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
        const add = (x, y, z) => {
          const p = project(cam, x, y, z);
          if (p[0] < minx) minx = p[0];
          if (p[0] > maxx) maxx = p[0];
          if (p[1] < miny) miny = p[1];
          if (p[1] > maxy) maxy = p[1];
        };
        for (let i = 0; i < n; i++) {
          const x0 = wk[i] + off, y0 = dy[i] + off, z = hgt[i] * e;
          add(x0, y0, z); add(x0 + w, y0, z); add(x0, y0 + w, z);
          add(x0 + w, y0 + w, 0); add(x0, y0, 0);
        }
        add(0, 0, 0); add(weeks, 7, 0);
        return { minx, maxx, miny, maxy };
      };

      const relayout = () => {
        const w = Math.round(stage.parentElement ? stage.parentElement.clientWidth : stage.clientWidth);
        if (!w || !n) return;
        W = w;
        dpr = Math.min(2, window.devicePixelRatio || 1);
        const b2 = extent(camera(0), 0);
        H2 = Math.max(68, Math.min(84, Math.round(14 + ((b2.maxy - b2.miny) / (b2.maxx - b2.minx)) * (W - 12))));
        const b3 = extent(camera(1), 1);
        const natural = ((b3.maxy - b3.miny) / (b3.maxx - b3.minx)) * (W - 24) + 24;
        const isDesktop = window.innerWidth >= 992;
        H3 = isDesktop ? Math.max(160, Math.min(Math.round(natural + 28), 185)) : Math.max(155, Math.min(Math.round(natural + 30), 175));
        Hmax = Math.ceil(Math.max(H2, H3, 195));
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(Hmax * dpr);
        canvas.style.width = W + 'px';
        canvas.style.height = Hmax + 'px';
        lastH = -1;
        draw();
      };

      let activeIdx = -1;
      let hovered = -1;

      const draw = () => {
        const curW = Math.round(stage.parentElement ? stage.parentElement.clientWidth : stage.clientWidth);
        if (curW && Math.abs(curW - W) > 2) {
          relayout();
          return;
        }
        if (!W || !n) return;
        const e = easeInOutCubic(t);
        const cam = camera(e, yaw, elev);
        const Hc = lerp(H2, H3, e);
        if (Math.abs(Hc - lastH) > 0.2 || t === this.target) {
          const finalH = t === 1 ? H3 : t === 0 ? H2 : Hc;
          stage.style.height = finalH.toFixed(1) + 'px';
          lastH = finalH;
        }
        for (let i = 0; i < n; i++) zs[i] = riseAt(t, wk[i], weeks, dy[i]) * hgt[i];
        const b = extent(cam, e);
        const pad = lerp(4, 14, e);
        const aw = W - pad * 2;
        const ah = Hc - pad * 2;
        const bw = Math.max(1e-6, b.maxx - b.minx);
        const bh = Math.max(1e-6, b.maxy - b.miny);
        const s = Math.min(aw / bw, ah / bh);
        const ox = pad + (aw - bw * s) / 2 - b.minx * s;
        const oy = pad + (ah - bh * s) / 2 - b.miny * s;
        const { cs, sn, se, ce } = cam;
        const px = (x, y) => ox + (x * cs - y * sn) * s;
        const py = (x, y, z) => oy + ((x * sn + y * cs) * se - z * ce) * s;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, Hmax);

        order.sort((a, c) => (wk[a] + 0.5) * sn + (dy[a] + 0.5) * cs - ((wk[c] + 0.5) * sn + (dy[c] + 0.5) * cs));

        const w = lerp(0.78, 0.9, e);
        const off = (1 - w) / 2;
        const radius = lerp(0.18, 0.04, e) * s;

        for (let k = 0; k < n; k++) {
          const i = order[k];
          const x0 = wk[i] + off, y0 = dy[i] + off;
          const x1 = x0 + w, y1 = y0 + w;
          const z = zs[i] + hover[i] * 0.7 * e;
          const o = i * 24;

          polys[o] = px(x0, y0); polys[o + 1] = py(x0, y0, z);
          polys[o + 2] = px(x1, y0); polys[o + 3] = py(x1, y0, z);
          polys[o + 4] = px(x1, y1); polys[o + 5] = py(x1, y1, z);
          polys[o + 6] = px(x0, y1); polys[o + 7] = py(x0, y1, z);

          polys[o + 8] = px(x0, y1); polys[o + 9] = py(x0, y1, 0);
          polys[o + 10] = px(x1, y1); polys[o + 11] = py(x1, y1, 0);
          polys[o + 12] = polys[o + 4]; polys[o + 13] = polys[o + 5];
          polys[o + 14] = polys[o + 6]; polys[o + 15] = polys[o + 7];

          polys[o + 16] = px(x1, y0); polys[o + 17] = py(x1, y0, 0);
          polys[o + 18] = polys[o + 10]; polys[o + 19] = polys[o + 11];
          polys[o + 20] = polys[o + 4]; polys[o + 21] = polys[o + 5];
          polys[o + 22] = polys[o + 2]; polys[o + 23] = polys[o + 3];

          const tall = z * ce * s;
          let f = 0;
          if (tall > 0.35 && w * cs * s > 0.35) f |= 1;
          if (tall > 0.35 && w * sn * s > 0.35) f |= 2;
          faces[i] = f;

          const baseCol = colors[lv[i]];
          let r = baseCol[0], g = baseCol[1], bl = baseCol[2];
          const hv = hover[i];
          if (hv > 0.02) {
            r = Math.min(255, r + 45 * hv);
            g = Math.min(255, g + 45 * hv);
            bl = Math.min(255, bl + 45 * hv);
          }

          if (f & 1) {
            ctx.beginPath();
            quadPath(ctx, polys, o + 8, 0);
            ctx.fillStyle = `rgb(${Math.round(r * 0.82)}, ${Math.round(g * 0.82)}, ${Math.round(bl * 0.82)})`;
            ctx.fill();
          }
          if (f & 2) {
            ctx.beginPath();
            quadPath(ctx, polys, o + 16, 0);
            ctx.fillStyle = `rgb(${Math.round(r * 0.65)}, ${Math.round(g * 0.65)}, ${Math.round(bl * 0.65)})`;
            ctx.fill();
          }
          ctx.beginPath();
          quadPath(ctx, polys, o, radius);
          ctx.fillStyle = `rgb(${r}, ${g}, ${bl})`;
          ctx.fill();

          if (hv > 0.05) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${(0.8 * hv).toFixed(2)})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }

        // Tooltip tracking
        if (activeIdx >= 0 && activeIdx < n) {
          const i = activeIdx;
          const z = zs[i] + hover[i] * 0.7 * e;
          const tx = px(wk[i] + 0.5, dy[i] + 0.5);
          const ty = py(wk[i] + off, dy[i] + off, z);
          tip.style.display = 'block';
          tip.style.left = `${Math.min(W - 80, Math.max(10, tx - 40))}px`;
          tip.style.top = `${Math.max(10, ty - 32)}px`;
          const cell = m.cells[i];
          tip.textContent = `${cell.count} activities · ${cell.date}`;
        } else {
          tip.style.display = 'none';
        }
      };

      let raf = 0, last = performance.now();
      const tick = (now) => {
        raf = 0;
        const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
        last = now;
        let moving = false;

        if (t !== this.target) {
          const step = (dt * 1000) / this.duration;
          t = this.target > t ? Math.min(this.target, t + step) : Math.max(this.target, t - step);
          moving = true;
        }

        const ko = 1 - Math.exp(-dt * 12);
        yaw += (yawGoal - yaw) * ko;
        elev += (elevGoal - elev) * ko;
        if (Math.abs(yawGoal - yaw) > 1e-4 || Math.abs(elevGoal - elev) > 1e-4) moving = true;
        else { yaw = yawGoal; elev = elevGoal; }

        for (let i = 0; i < n; i++) {
          const hg = i === activeIdx ? 1 : 0;
          const h = hover[i];
          if (h !== hg) {
            hover[i] = Math.abs(hg - h) < 0.003 ? hg : h + (hg - h) * (1 - Math.exp(-dt * 16));
            moving = true;
          }
        }

        draw();
        if (moving) raf = requestAnimationFrame(tick);
      };

      const kick = () => {
        if (raf) return;
        last = performance.now();
        raf = requestAnimationFrame(tick);
      };
      this.kick = kick;

      const hit = (x, y) => {
        for (let k = n - 1; k >= 0; k--) {
          const i = order[k];
          const o = i * 24;
          if (pointInQuad(polys, o, x, y)) return i;
          if (faces[i] & 1 && pointInQuad(polys, o + 8, x, y)) return i;
          if (faces[i] & 2 && pointInQuad(polys, o + 16, x, y)) return i;
        }
        return -1;
      };

      // Pointer drag orbit
      let drag = null;
      canvas.addEventListener('pointerdown', (ev) => {
        if (ev.button !== 0 || this.target !== 1) return;
        drag = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, yaw: yawGoal, elev: elevGoal, moved: false };
        try { canvas.setPointerCapture(ev.pointerId); } catch (e) {}
      });

      canvas.addEventListener('pointermove', (ev) => {
        if (drag && ev.pointerId === drag.id) {
          const dx = ev.clientX - drag.x;
          const dy = ev.clientY - drag.y;
          if (drag.moved || Math.hypot(dx, dy) > 3) {
            drag.moved = true;
            yawGoal = Math.min(YAW_RANGE[1] - YAW_3D, Math.max(YAW_RANGE[0] - YAW_3D, drag.yaw + dx * 0.006));
            elevGoal = Math.min(ELEV_RANGE[1] - ELEV_3D, Math.max(ELEV_RANGE[0] - ELEV_3D, drag.elev + dy * 0.004));
            activeIdx = -1;
            kick();
            return;
          }
        }
        const r = canvas.getBoundingClientRect();
        const i = hit(ev.clientX - r.left, ev.clientY - r.top);
        if (i !== activeIdx) {
          activeIdx = i;
          kick();
        }
      });

      canvas.addEventListener('pointerup', (ev) => {
        if (drag && ev.pointerId === drag.id) {
          drag = null;
          try { canvas.releasePointerCapture(ev.pointerId); } catch (e) {}
        }
      });

      canvas.addEventListener('pointerleave', () => {
        if (drag) return;
        activeIdx = -1;
        kick();
      });

      canvas.addEventListener('dblclick', () => {
        yawGoal = 0;
        elevGoal = 0;
        kick();
      });

      if (window.ResizeObserver) {
        new ResizeObserver(() => {
          const w = Math.round(stage.parentElement ? stage.parentElement.clientWidth : stage.clientWidth);
          if (w && Math.abs(w - W) > 2) {
            relayout();
          }
        }).observe(this.root);
      }
      relayout();
    }
  }

  window.ContributionSkyline = ContributionSkyline;

  // Auto-init on page load
  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('hero-contribution-skyline');
    if (el) {
      window.heroSkylineInstance = new ContributionSkyline(el, { preset: 'cyber', view: '2d' });
    }
  });
})();
