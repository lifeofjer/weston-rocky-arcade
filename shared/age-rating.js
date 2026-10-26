// Shared 6+ rating badge + one-time age gate for every arcade game.
// Future games: <script src="/shared/age-rating.js" defer></script>
// Room links: wrap auto-join with window.arcadeWhenReady(fn) so ?room=CODE
// still joins after YES (and not before).
(function () {
  const KEY = 'arcadeAge6plus';
  const waiters = [];

  window.ARCADE_AGE_KEY = KEY;
  window.arcadeAgeOk = localStorage.getItem(KEY) === 'yes';
  window.arcadeWhenReady = function (fn) {
    if (typeof fn !== 'function') return;
    if (window.arcadeAgeOk) fn();
    else waiters.push(fn);
  };

  const CSS = `
.age6-badge{display:inline-flex;flex-direction:column;width:52px;border:3px solid #111;background:#fff;box-shadow:3px 3px 0 #000;font-family:"Courier New",monospace;text-align:center;line-height:1;image-rendering:pixelated;user-select:none;pointer-events:none}
.age6-badge .n{display:block;background:#0b0b2a;color:#ffd21e;font-weight:bold;font-size:20px;padding:6px 2px 4px;text-shadow:0 0 8px #ff4040;letter-spacing:1px}
.age6-badge .l{display:block;background:#111;color:#fff;font-size:9px;letter-spacing:1px;padding:3px 0 2px}
a.card{position:relative}
a.card:not(.soon) .age6-badge{position:absolute;top:8px;right:8px;z-index:2}
.age6-hud{position:fixed;left:12px;bottom:12px;z-index:30;pointer-events:none}
#age6-gate{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(11,11,42,.92);font-family:"Courier New",monospace;color:#fff}
#age6-gate .box{width:min(440px,92vw);background:#1d1d48;border:4px solid #ffd21e;box-shadow:8px 8px 0 #000;padding:22px 18px 18px;text-align:center}
#age6-gate .age6-badge{margin:0 auto 12px}
#age6-gate h2{margin:0 0 8px;color:#ffd21e;font-size:clamp(20px,5vw,28px);letter-spacing:1px;text-shadow:3px 3px 0 #000,0 0 14px #ff4040}
#age6-gate p{margin:0 0 16px;color:#cde;font-size:14px}
#age6-gate .row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
#age6-gate button,#age6-gate .go{font-family:"Courier New",monospace;font-weight:bold;font-size:20px;padding:10px 22px;border:4px solid #111;box-shadow:4px 4px 0 #000;cursor:pointer;image-rendering:pixelated;text-decoration:none;display:inline-block}
#age6-yes,#age6-gate .go{background:#ffd21e;color:#111}
#age6-no{background:#3a3228;color:#fff}
#age6-yes:hover,#age6-no:hover,#age6-gate .go:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 #000}
#age6-gate .tiny{margin-top:14px;color:#556;font-size:11px}
.age6-tabby{margin:6px auto 12px;width:max-content;border-collapse:collapse;image-rendering:pixelated}
.age6-tabby td{width:6px;height:6px;padding:0;border:0}
`;

  function badge() {
    return '<div class="age6-badge" title="Rated 6+"><span class="n">6+</span><span class="l">RATED</span></div>';
  }

  function tabby() {
    // Blocky orange tabby, same palette as shared/tabby-cat.js (Cat City).
    const C = { '.':'#0b0b2a', f:'#f0983c', s:'#a4521a', w:'#fff2df', e:'#66ee66', p:'#ff8fa8' };
    const MAP = [
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
    const rows = MAP.map((row) => '<tr>' + [...row].map((ch) => `<td style="background:${C[ch] || C['.']}"></td>`).join('') + '</tr>').join('');
    return `<table class="age6-tabby" aria-hidden="true">${rows}</table>`;
  }

  function injectStyle() {
    if (document.getElementById('age6-css')) return;
    const s = document.createElement('style');
    s.id = 'age6-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function isHome() {
    const path = (location.pathname || '/').replace(/\/+$/, '') || '/';
    return path === '/' || path.endsWith('/index.html') || !!document.querySelector('a.card');
  }

  function stampCards() {
    document.querySelectorAll('a.card:not(.soon)').forEach((card) => {
      if (card.querySelector('.age6-badge')) return;
      card.insertAdjacentHTML('beforeend', badge());
    });
  }

  function mountHudBadge() {
    if (document.querySelector('.age6-hud')) return;
    const wrap = document.createElement('div');
    wrap.className = 'age6-hud';
    wrap.innerHTML = badge();
    document.body.appendChild(wrap);
  }

  function stopInput(e) {
    e.stopPropagation();
    if (e.type === 'keydown' || e.type === 'keyup') e.preventDefault();
  }

  function lockInput(on) {
    const types = ['keydown', 'keyup', 'pointerdown', 'pointerup', 'touchstart'];
    types.forEach((t) => {
      if (on) document.addEventListener(t, stopInput, true);
      else document.removeEventListener(t, stopInput, true);
    });
  }

  function flush() {
    const fns = waiters.splice(0);
    fns.forEach((fn) => { try { fn(); } catch (e) {} });
  }

  function showNo() {
    const gate = document.getElementById('age6-gate');
    if (!gate) return;
    gate.innerHTML = `<div class="box">
      ${tabby()}
      <h2>Come back when you're 6! 🐱</h2>
      <p>The orange tabby will save you a seat.</p>
      <div class="row"><a class="go" href="/">BACK TO ARCADE</a></div>
    </div>`;
  }

  function yes() {
    try { localStorage.setItem(KEY, 'yes'); } catch (e) {}
    window.arcadeAgeOk = true;
    lockInput(false);
    const gate = document.getElementById('age6-gate');
    if (gate) gate.remove();
    flush();
  }

  function showGate() {
    if (document.getElementById('age6-gate')) return;
    lockInput(true);
    const el = document.createElement('div');
    el.id = 'age6-gate';
    el.innerHTML = `<div class="box">
      ${badge()}
      <h2>ARE YOU 6 OR OLDER?</h2>
      <p>Weston says these games are rated 6+.</p>
      <div class="row">
        <button type="button" id="age6-yes">YES</button>
        <button type="button" id="age6-no">NO</button>
      </div>
      <div class="tiny">Asked once on this device</div>
    </div>`;
    document.body.appendChild(el);
    el.querySelector('#age6-yes').onclick = (e) => { e.stopPropagation(); yes(); };
    el.querySelector('#age6-no').onclick = (e) => { e.stopPropagation(); showNo(); };
  }

  function boot() {
    injectStyle();
    if (isHome()) {
      stampCards();
      return;
    }
    mountHudBadge();
    if (window.arcadeAgeOk) flush();
    else showGate();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
