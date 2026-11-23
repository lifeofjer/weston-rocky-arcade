// Seasonal home-page theme for Weston & Rocky's Arcade.
// One place to control it:
//   THEME = 'auto'       date windows in America/Denver
//   THEME = 'christmas' | 'halloween' | 'july4'   force a look
//   THEME = 'none'       always the normal arcade (easy off-switch after holidays)
// URL always wins: ?theme=christmas|halloween|july4|none
(function () {
  if (typeof document === 'undefined') return;
  const THEME = 'auto';
  const VALID = new Set(['christmas', 'halloween', 'july4', 'none']);
  const WINDOWS = [
    { id: 'halloween', start: [10, 1], end: [10, 31] },
    { id: 'christmas', start: [11, 20], end: [12, 31] },
    { id: 'july4', start: [6, 20], end: [7, 10] },
  ];

  const PIX = {
    f: '#f0983c', s: '#a4521a', w: '#fff2df', e: '#66ee66', p: '#ff8fa8',
    r: '#c41e3a', o: '#ff7a18', Y: '#ffd21e', b: '#2b57c1', u: '#7b3bb0',
    g: '#2e8b4a', k: '#1a1a1a', n: '#f4f7ff',
  };

  const CAT = [
    '..f...f..',
    '.fffffff.',
    'fssfsfssf',
    'fe.fff.ef',
    'ff.wpw.ff',
    '.ffwwwff.',
    'ffsssssff',
    'f.fwwwf.s',
    'f.f...f.s',
    'w.w...w..',
  ];
  const HAT_XMAS = [
    '......w......',
    '.....wrr.....',
    '....wrrrr....',
    '...wrrrrrr...',
    '..wrrrrrrrr..',
    '.wwwwwwwwwww.',
  ];
  const HAT_HALLOWEEN = [
    '......g......',
    '....ooooo....',
    '...o.k.k.o...',
    '...o..w..o...',
    '....ooooo....',
  ];
  const HAT_JULY = [
    '......Y......',
    '.....YYY.....',
    'Y...YYYYY...Y',
    '.Y.YYYYYYY.Y.',
    '..YYY.Y.YYY..',
    '...Y.....Y...',
  ];

  function denverParts(date) {
    const o = {};
    for (const p of new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Denver', year: 'numeric', month: 'numeric', day: 'numeric',
    }).formatToParts(date || new Date())) {
      if (p.type !== 'literal') o[p.type] = Number(p.value);
    }
    return { y: o.year, m: o.month, d: o.day };
  }

  function inWindow(now, start, end) {
    const n = now.m * 100 + now.d;
    const a = start[0] * 100 + start[1];
    const b = end[0] * 100 + end[1];
    return a <= b ? (n >= a && n <= b) : (n >= a || n <= b);
  }

  function autoTheme(now) {
    for (const w of WINDOWS) {
      if (inWindow(now, w.start, w.end)) return w.id;
    }
    return '';
  }

  function resolveTheme() {
    let override = '';
    try {
      override = new URLSearchParams(location.search).get('theme') || '';
    } catch (e) {}
    override = String(override).toLowerCase();
    if (VALID.has(override)) return override === 'none' ? '' : override;
    const forced = String(THEME || 'auto').toLowerCase();
    if (forced === 'none') return '';
    if (VALID.has(forced) && forced !== 'none') return forced;
    return autoTheme(denverParts());
  }

  function daysUntil(month, day, now) {
    const n = Date.UTC(now.y, now.m - 1, now.d);
    const t = Date.UTC(now.y, month - 1, day);
    return Math.round((t - n) / 86400000);
  }

  function padCat(hat) {
    const catW = CAT[0].length;
    const hatW = hat[0].length;
    const w = Math.max(catW, hatW);
    const pad = (row) => {
      const extra = w - row.length;
      const left = Math.floor(extra / 2);
      return '.'.repeat(left) + row + '.'.repeat(extra - left);
    };
    return hat.map(pad).concat(CAT.map(pad));
  }

  function pixelSvg(map, scale) {
    const h = map.length;
    const w = map[0].length;
    let rects = '';
    for (let y = 0; y < h; y++) {
      const row = map[y];
      for (let x = 0; x < w; x++) {
        const fill = PIX[row[x]];
        if (!fill) continue;
        rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`;
      }
    }
    return `<svg class="arcade-mascot-svg" viewBox="0 0 ${w} ${h}" width="${w * scale}" height="${h * scale}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
  }

  function giftSvg() {
    return `<svg width="36" height="34" viewBox="0 0 18 17" shape-rendering="crispEdges" aria-hidden="true">
      <rect x="3" y="6" width="12" height="10" fill="#c41e3a"/>
      <rect x="3" y="6" width="12" height="3" fill="#e63946"/>
      <rect x="8" y="6" width="2" height="10" fill="#ffd21e"/>
      <rect x="3" y="10" width="12" height="1" fill="#ffd21e"/>
      <rect x="7" y="3" width="4" height="3" fill="#ffd21e"/>
      <rect x="5" y="4" width="2" height="2" fill="#2e8b4a"/>
      <rect x="11" y="4" width="2" height="2" fill="#2e8b4a"/>
    </svg>`;
  }

  function pumpkinSvg() {
    return `<svg width="40" height="36" viewBox="0 0 16 15" shape-rendering="crispEdges" aria-hidden="true">
      <rect x="7" y="0" width="2" height="3" fill="#2e8b4a"/>
      <rect x="2" y="3" width="12" height="10" fill="#ff7a18"/>
      <rect x="1" y="5" width="14" height="7" fill="#ff7a18"/>
      <rect x="3" y="4" width="2" height="2" fill="#1a1a1a"/>
      <rect x="11" y="4" width="2" height="2" fill="#1a1a1a"/>
      <rect x="5" y="9" width="6" height="2" fill="#1a1a1a"/>
      <rect x="4" y="8" width="2" height="2" fill="#1a1a1a"/>
      <rect x="10" y="8" width="2" height="2" fill="#1a1a1a"/>
      <rect x="4" y="13" width="8" height="1" fill="#e86810"/>
    </svg>`;
  }

  function batSvg() {
    return `<b><svg viewBox="0 0 16 8" width="44" height="22" shape-rendering="crispEdges" aria-hidden="true">
      <rect x="0" y="3" width="3" height="2" fill="#4a2a6a"/>
      <rect x="2" y="2" width="3" height="3" fill="#6a3a90"/>
      <rect x="5" y="1" width="6" height="5" fill="#2a1540"/>
      <rect x="11" y="2" width="3" height="3" fill="#6a3a90"/>
      <rect x="13" y="3" width="3" height="2" fill="#4a2a6a"/>
      <rect x="6" y="2" width="1" height="1" fill="#ffd21e"/>
      <rect x="9" y="2" width="1" height="1" fill="#ffd21e"/>
    </svg></b>`;
  }

  function reducedMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  function bannerCopy(theme, now) {
    if (theme === 'christmas') {
      const n = daysUntil(12, 25, now);
      let count = 'Merry Christmas!';
      if (n > 1) count = n + ' days until December 25';
      else if (n === 1) count = '1 day until December 25';
      else if (n === 0) count = "It's Christmas Day!";
      else count = 'Hope you had a Merry Christmas!';
      return { msg: 'Merry Christmas from Weston & Rocky!', count };
    }
    if (theme === 'halloween') {
      const n = daysUntil(10, 31, now);
      let count = 'Friendly spooky season at the arcade.';
      if (n > 1) count = n + ' days until Halloween';
      else if (n === 1) count = '1 day until Halloween';
      else if (n === 0) count = "It's Halloween!";
      return { msg: 'Happy Halloween from Weston & Rocky!', count };
    }
    if (theme === 'july4') {
      const n = daysUntil(7, 4, now);
      let count = 'Stars, stripes, and free play.';
      if (n > 1) count = n + ' days until the Fourth of July';
      else if (n === 1) count = '1 day until the Fourth of July';
      else if (n === 0) count = "It's the Fourth of July!";
      else count = 'Hope you had a great Fourth!';
      return { msg: 'Happy Fourth of July from Weston & Rocky!', count };
    }
    return { msg: '', count: '' };
  }

  function makeLights(theme) {
    const wrap = document.createElement('div');
    wrap.className = 'arcade-lights';
    wrap.setAttribute('aria-hidden', 'true');
    const colors = {
      christmas: ['#c41e3a', '#2e8b4a', '#ffd21e', '#3d7ea6'],
      halloween: ['#ff7a18', '#7b3bb0', '#2e8b4a', '#ffd21e'],
      july4: ['#c41e3a', '#f4f7ff', '#2b57c1'],
    }[theme];
    const n = Math.max(10, Math.min(26, Math.floor(window.innerWidth / 38)));
    const hangColors = ['#c41e3a', '#ffd21e', '#2e8b4a'];
    for (let i = 0; i < n; i++) {
      const b = document.createElement('span');
      b.className = 'arcade-bulb';
      b.style.setProperty('--bulb', colors[i % colors.length]);
      b.style.background = colors[i % colors.length];
      b.style.animationDelay = (i * 0.14) + 's';
      wrap.appendChild(b);
      if (theme === 'christmas' && i % 5 === 2) {
        const o = document.createElement('span');
        o.className = 'arcade-hang';
        o.style.background = hangColors[(i / 5 | 0) % hangColors.length];
        o.style.left = ((i + 0.5) / n * 100) + '%';
        wrap.appendChild(o);
      }
    }
    return wrap;
  }

  function makeBunting() {
    const wrap = document.createElement('div');
    wrap.className = 'arcade-bunting';
    wrap.setAttribute('aria-hidden', 'true');
    const colors = ['#c41e3a', '#f4f7ff', '#2b57c1'];
    const n = Math.max(16, Math.min(40, Math.floor(window.innerWidth / 18)));
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      p.className = 'arcade-pennant';
      p.style.background = colors[i % 3];
      wrap.appendChild(p);
    }
    return wrap;
  }

  function startSnow(quiet) {
    const canvas = document.createElement('canvas');
    canvas.className = 'arcade-snow';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    if (quiet) return canvas;
    const ctx = canvas.getContext('2d', { alpha: true });
    let flakes = [];
    let raf = 0;
    let w = 0;
    let h = 0;
    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = w < 640 ? 28 : w < 1100 ? 40 : 52;
      flakes = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        s: Math.random() < 0.35 ? 3 : 2,
        vy: 0.35 + Math.random() * 0.55,
        vx: (Math.random() - 0.5) * 0.25,
        ph: Math.random() * Math.PI * 2,
      }));
    }
    function tick() {
      if (document.hidden) {
        raf = requestAnimationFrame(tick);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#f7fbff';
      for (const f of flakes) {
        f.ph += 0.01;
        f.y += f.vy;
        f.x += f.vx + Math.sin(f.ph) * 0.15;
        if (f.y > h) { f.y = -4; f.x = Math.random() * w; }
        if (f.x > w) f.x = 0;
        if (f.x < 0) f.x = w;
        ctx.fillRect(f.x | 0, f.y | 0, f.s, f.s);
      }
      raf = requestAnimationFrame(tick);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });
    raf = requestAnimationFrame(tick);
    canvas._stop = () => cancelAnimationFrame(raf);
    return canvas;
  }

  function startFireworks(quiet) {
    const canvas = document.createElement('canvas');
    canvas.className = 'arcade-fx';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    if (quiet) return canvas;
    const ctx = canvas.getContext('2d', { alpha: true });
    const colors = ['#c41e3a', '#f4f7ff', '#2b57c1', '#ffd21e'];
    let parts = [];
    let raf = 0;
    let w = 0;
    let h = 0;
    let next = 0;
    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function burst() {
      const x = w * (0.12 + Math.random() * 0.76);
      const y = h * (0.08 + Math.random() * 0.32);
      const color = colors[(Math.random() * colors.length) | 0];
      const n = 22;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.2;
        const sp = 1.1 + Math.random() * 2.1;
        parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, color, s: Math.random() < 0.4 ? 4 : 3 });
      }
      if (parts.length > 70) parts = parts.slice(parts.length - 70);
    }
    function tick(t) {
      if (!document.hidden) {
        if (t >= next) {
          burst();
          next = t + 1400 + Math.random() * 900;
        }
        ctx.clearRect(0, 0, w, h);
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.012;
          p.life -= 0.012;
          if (p.life <= 0) { parts.splice(i, 1); continue; }
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x | 0, p.y | 0, p.s, p.s);
        }
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(tick);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });
    raf = requestAnimationFrame(tick);
    canvas._stop = () => cancelAnimationFrame(raf);
    return canvas;
  }

  function placeStars() {
    const field = document.createElement('div');
    field.className = 'arcade-star-field';
    field.setAttribute('aria-hidden', 'true');
    const spots = [
      [6, 8], [18, 22], [78, 10], [92, 18], [10, 36], [88, 34],
      [4, 70], [96, 68], [50, 6], [62, 16], [30, 12],
    ];
    spots.forEach(([x, y], i) => {
      const s = document.createElement('span');
      s.className = 'arcade-star';
      s.style.left = x + 'vw';
      s.style.top = y + 'vh';
      s.style.animationDelay = (i * 0.2) + 's';
      s.style.transform = 'scale(' + (0.7 + (i % 3) * 0.25) + ')';
      field.appendChild(s);
    });
    document.body.appendChild(field);
  }

  function placeBats() {
    const spots = [
      { left: '4%', top: '70px', delay: '0s' },
      { right: '6%', top: '90px', delay: '1.2s' },
      { left: '10%', top: '130px', delay: '2.4s' },
      { right: '12%', top: '54px', delay: '0.6s' },
    ];
    spots.forEach((sp) => {
      const el = document.createElement('div');
      el.className = 'arcade-bat';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = batSvg();
      Object.assign(el.style, sp);
      el.style.animationDelay = sp.delay;
      document.body.appendChild(el);
    });
  }

  function decorateCards(theme) {
    const beads = ['#c41e3a', '#2e8b4a', '#ffd21e'];
    document.querySelectorAll('a.card').forEach((card, i) => {
      if (card.querySelector('.arcade-card-deco')) return;
      const deco = document.createElement('span');
      deco.className = 'arcade-card-deco';
      deco.setAttribute('aria-hidden', 'true');
      if (theme === 'christmas') {
        deco.innerHTML = '<span class="snowcap"></span><span class="ornament"></span>';
        const bead = deco.querySelector('.ornament');
        if (bead) bead.style.setProperty('--bead', beads[i % beads.length]);
      }
      card.appendChild(deco);
    });
  }

  function enhanceHeader(theme) {
    const h1 = document.querySelector('h1');
    const sub = document.querySelector('.sub');
    if (!h1 || h1.closest('.arcade-hero')) return;
    const hero = document.createElement('div');
    hero.className = 'arcade-hero';
    const mascot = document.createElement('div');
    mascot.className = 'arcade-mascot';
    mascot.setAttribute('aria-hidden', 'true');
    const hat = theme === 'christmas' ? HAT_XMAS : theme === 'halloween' ? HAT_HALLOWEEN : HAT_JULY;
    mascot.innerHTML = pixelSvg(padCat(hat), 5);
    h1.parentNode.insertBefore(hero, h1);
    hero.appendChild(mascot);
    hero.appendChild(h1);
    if (sub) hero.appendChild(sub);
  }

  function injectBanner(theme, now) {
    const copy = bannerCopy(theme, now);
    const el = document.createElement('div');
    el.className = 'arcade-banner';
    el.setAttribute('role', 'status');
    el.innerHTML = `<div class="msg">${copy.msg}</div><div class="count">${copy.count}</div>`;
    const hero = document.querySelector('.arcade-hero');
    if (hero) hero.parentNode.insertBefore(el, hero);
    else {
      const h1 = document.querySelector('h1');
      if (h1) h1.parentNode.insertBefore(el, h1);
    }
  }

  function corners(theme) {
    if (theme === 'christmas') {
      [['bl', giftSvg()], ['br', giftSvg()]].forEach(([pos, html]) => {
        const el = document.createElement('div');
        el.className = 'arcade-corner ' + pos;
        el.setAttribute('aria-hidden', 'true');
        el.innerHTML = html;
        document.body.appendChild(el);
      });
    }
    if (theme === 'halloween') {
      [['bl', pumpkinSvg()], ['br', pumpkinSvg()], ['tl', pumpkinSvg()], ['tr', pumpkinSvg()]].forEach(([pos, html], i) => {
        const el = document.createElement('div');
        el.className = 'arcade-corner ' + pos;
        el.setAttribute('aria-hidden', 'true');
        el.innerHTML = html;
        if (i % 2) el.style.transform = 'scaleX(-1)';
        document.body.appendChild(el);
      });
    }
  }

  function boot() {
    if (!document.body || !document.body.classList.contains('arcade-home')) return;
    if (!document.querySelector('a.card') && !document.querySelector('h1')) return;
    const theme = resolveTheme();
    document.documentElement.dataset.arcadeTheme = theme || 'none';
    if (!theme) return;

    document.documentElement.classList.add('theme-' + theme);
    if (reducedMotion()) document.documentElement.classList.add('reduced-motion');

    const color = { christmas: '#07140e', halloween: '#14081c', july4: '#0a1028' }[theme];
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && color) meta.content = color;

    const now = denverParts();
    const firstCheck = document.querySelector('.check');
    if (theme === 'july4') {
      const bunting = makeBunting();
      if (firstCheck) firstCheck.after(bunting);
      else document.body.prepend(bunting);
    }
    const lights = makeLights(theme);
    const after = document.querySelector('.arcade-bunting') || firstCheck;
    if (after) after.after(lights);
    else document.body.prepend(lights);

    enhanceHeader(theme);
    injectBanner(theme, now);
    decorateCards(theme);
    corners(theme);

    const quiet = reducedMotion();
    if (theme === 'christmas') startSnow(quiet);
    if (theme === 'july4') {
      placeStars();
      startFireworks(quiet);
    }
    if (theme === 'halloween') placeBats();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

// ES module API for games (homepage IIFE above still boots .arcade-home).
export const ZONE = 'America/Denver';
export const THEME_NONE = 'none';
export const THEME_CHRISTMAS = 'christmas';

function searchFrom(opts) {
  if (opts && opts.search != null) return String(opts.search);
  try {
    if (typeof location !== 'undefined' && location.search) return location.search;
  } catch (e) {}
  return '';
}

function parseOverride(search) {
  const q = String(search || '');
  const m = /[?&]theme=([^&]+)/i.exec(q);
  if (!m) return null;
  const v = decodeURIComponent(m[1] || '').trim().toLowerCase();
  if (v === 'christmas' || v === 'xmas' || v === 'snow' || v === 'holiday') return THEME_CHRISTMAS;
  if (v === 'halloween') return 'halloween';
  if (v === 'july4' || v === 'july' || v === '4th') return 'july4';
  if (v === 'none' || v === 'off' || v === 'normal' || v === 'default' || v === 'no') return THEME_NONE;
  return null;
}

export function denverParts(now) {
  const d = now instanceof Date ? now : new Date(now || Date.now());
  const parts = { year: 0, month: 0, day: 0 };
  try {
    for (const p of new Intl.DateTimeFormat('en-US', {
      timeZone: ZONE, year: 'numeric', month: 'numeric', day: 'numeric',
    }).formatToParts(d)) {
      if (p.type === 'year') parts.year = +p.value;
      else if (p.type === 'month') parts.month = +p.value;
      else if (p.type === 'day') parts.day = +p.value;
    }
  } catch (e) {}
  if (!parts.year) {
    parts.year = d.getUTCFullYear();
    parts.month = d.getUTCMonth() + 1;
    parts.day = d.getUTCDate();
  }
  return { ...parts, y: parts.year, m: parts.month, d: parts.day };
}

export function inChristmasWindow(now) {
  const p = denverParts(now);
  return (p.month === 11 && p.day >= 20) || p.month === 12;
}

export function christmasSeasonYear(now) {
  return denverParts(now).year || new Date().getFullYear();
}

function autoSeason(now) {
  const p = denverParts(now);
  const n = p.month * 100 + p.day;
  if (n >= 1001 && n <= 1031) return 'halloween';
  if ((p.month === 11 && p.day >= 20) || p.month === 12) return THEME_CHRISTMAS;
  if (n >= 620 && n <= 710) return 'july4';
  return '';
}

export function resolveArcadeTheme(opts) {
  opts = opts || {};
  const override = parseOverride(searchFrom(opts));
  const auto = autoSeason(opts.now);
  const theme = override != null ? override : (auto || THEME_NONE);
  return {
    theme: theme === THEME_NONE ? 'none' : theme,
    override,
    seasonal: auto === THEME_CHRISTMAS,
    zone: ZONE,
    christmas: theme === THEME_CHRISTMAS,
    year: christmasSeasonYear(opts.now),
    denver: denverParts(opts.now),
  };
}

export function getTheme(opts) {
  return resolveArcadeTheme(opts).theme;
}

export function isChristmas(opts) {
  return resolveArcadeTheme(opts).christmas;
}

const api = {
  ZONE, THEME_NONE, THEME_CHRISTMAS,
  denverParts, inChristmasWindow, christmasSeasonYear,
  resolveArcadeTheme, getTheme, isChristmas,
};

if (typeof window !== 'undefined') {
  window.ArcadeTheme = api;
  window.arcadeIsChristmas = isChristmas;
}
