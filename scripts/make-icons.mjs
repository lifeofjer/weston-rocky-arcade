#!/usr/bin/env node
// Pixel-art arcade mark → favicon.svg/.ico + apple/192/512 PNGs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodePng, encodeIco, nearestScale } from './png.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const C = {
  '.': [0x0b, 0x0b, 0x2a, 255],
  w: [0xff, 0xff, 0xff, 255],
  k: [0x11, 0x11, 0x14, 255],
  Y: [0xff, 0xd2, 0x1e, 255],
  O: [0xff, 0x8a, 0x1e, 255],
  R: [0xff, 0x40, 0x40, 255],
  g: [0x6a, 0x6e, 0x78, 255],
  d: [0x2a, 0x2c, 0x38, 255],
  s: [0xc8, 0xcc, 0xd2, 255],
  b: [0xe0, 0x20, 0x28, 255],
};

// 32×32 source. Checker top, glowing W&R, blocky joystick.
const MAP = [
  'wkwkwkwkwkwkwkwkwkwkwkwkwkwkwkwk',
  'kwkwkwkwkwkwkwkwkwkwkwkwkwkwkwkw',
  '................................',
  '................................',
  '................................',
  '................................',
  '..Y...Y......OO......YYYY.......',
  '..Y...Y.....O..O.....Y...Y......',
  '..Y.Y.Y.....O..O.....Y...Y......',
  '..Y.Y.Y......OO......YYYY.......',
  '..YY.YY.....O..O.....Y.Y........',
  '..Y...Y.....O..O.O...Y..Y.......',
  '..Y...Y......OO.O....Y...Y......',
  '................................',
  '................................',
  '..............bbbb..............',
  '.............bYYYYb.............',
  '..............bYYb..............',
  '...............gg...............',
  '...............gg...............',
  '...............gg...............',
  '.............dddddd.............',
  '............dYYYYYYd............',
  '............dssssssd............',
  '.............dddddd.............',
  '................................',
  '................................',
  '................................',
  'wkwkwkwkwkwkwkwkwkwkwkwkwkwkwkwk',
  'kwkwkwkwkwkwkwkwkwkwkwkwkwkwkwkw',
  '................................',
  '................................',
];

function paintMap(map) {
  const h = map.length, w = map[0].length;
  const rgba = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const col = C[map[y][x]] || C['.'];
      rgba.set(col, (y * w + x) * 4);
    }
  }
  // Red glow around yellow/orange pixels.
  const glow = Buffer.from(rgba);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = map[y][x];
      if (ch !== 'Y' && ch !== 'O') continue;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          if (map[ny][nx] !== '.') continue;
          const i = (ny * w + nx) * 4;
          glow[i] = Math.max(glow[i], 0xff);
          glow[i + 1] = Math.max(glow[i + 1], 0x30);
          glow[i + 2] = Math.max(glow[i + 2], 0x28);
        }
      }
    }
  }
  return { w, h, rgba: glow };
}

function svgFromMap(map, glowRgba) {
  const h = map.length, w = map[0].length;
  const rects = [];
  rects.push(`<rect width="${w}" height="${h}" fill="#0b0b2a"/>`);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const [r, g, b] = [glowRgba[i], glowRgba[i + 1], glowRgba[i + 2]];
      if (r === 0x0b && g === 0x0b && b === 0x2a) continue;
      const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
      rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${hex}"/>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" shape-rendering="crispEdges">
  ${rects.join('\n  ')}
</svg>
`;
}

const { w, h, rgba } = paintMap(MAP);
fs.writeFileSync(path.join(root, 'favicon.svg'), svgFromMap(MAP, rgba));

const sizes = { 16: null, 32: null, 48: null, 180: 'apple-touch-icon.png', 192: 'icon-192.png', 512: 'icon-512.png' };
const icoImgs = [];
for (const size of [16, 32, 48, 180, 192, 512]) {
  const scaled = size === w ? rgba : nearestScale(rgba, w, h, size, size);
  const png = encodePng(size, size, scaled);
  if (size <= 48) icoImgs.push({ w: size, h: size, png });
  const named = sizes[size];
  if (named) fs.writeFileSync(path.join(root, named), png);
}

fs.writeFileSync(path.join(root, 'favicon.ico'), encodeIco(icoImgs));

fs.writeFileSync(path.join(root, 'site.webmanifest'), JSON.stringify({
  name: 'Weston & Rocky Arcade',
  short_name: 'W&R Arcade',
  description: 'Free 3D car, train and crash games built by Weston and Rocky',
  start_url: '/',
  display: 'standalone',
  background_color: '#0b0b2a',
  theme_color: '#0b0b2a',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
}, null, 2) + '\n');

console.log('wrote favicon.svg favicon.ico apple-touch-icon.png icon-192.png icon-512.png site.webmanifest');
