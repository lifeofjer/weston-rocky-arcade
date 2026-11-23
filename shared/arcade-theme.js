// Shared arcade seasonal theme.
// Christmas window: Nov 20 – Dec 31 in America/Denver.
// Override with ?theme=christmas (force on) or ?theme=none (force off).

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
  if (v === 'none' || v === 'off' || v === 'normal' || v === 'default' || v === 'no') return THEME_NONE;
  return null;
}

export function denverParts(now) {
  const d = now instanceof Date ? now : new Date(now || Date.now());
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: ZONE,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const parts = { year: 0, month: 0, day: 0 };
    for (const p of fmt.formatToParts(d)) {
      if (p.type === 'year') parts.year = +p.value;
      else if (p.type === 'month') parts.month = +p.value;
      else if (p.type === 'day') parts.day = +p.value;
    }
    if (parts.year) return parts;
  } catch (e) {}
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function inChristmasWindow(now) {
  const p = denverParts(now);
  if (p.month === 11 && p.day >= 20) return true;
  if (p.month === 12) return true;
  return false;
}

export function christmasSeasonYear(now) {
  return denverParts(now).year || new Date().getFullYear();
}

export function resolveArcadeTheme(opts) {
  opts = opts || {};
  const override = parseOverride(searchFrom(opts));
  const seasonal = inChristmasWindow(opts.now);
  const theme = override || (seasonal ? THEME_CHRISTMAS : THEME_NONE);
  return {
    theme,
    override,
    seasonal,
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
  window.arcadeTheme = getTheme();
}
