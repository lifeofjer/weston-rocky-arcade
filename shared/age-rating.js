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
.age6-badge{display:inline-flex;flex-direction:column;width:46px;border:3px solid #111;background:#fff;box-shadow:3px 3px 0 #000;font-family:"Courier New",monospace;text-align:center;line-height:1;image-rendering:pixelated;user-select:none}
.age6-badge .n{background:#0b0b2a;color:#ffd21e;font-weight:bold;font-size:18px;padding:5px 2px 3px;text-shadow:0 0 8px #ff4040;letter-spacing:1px}
.age6-badge .l{background:#111;color:#fff;font-size:8px;letter-spacing:1px;padding:3px 0 2px}
a.card{position:relative}
a.card:not(.soon) .age6-badge{position:absolute;top:8px;right:8px;z-index:2}
.age6-hud{position:fixed;left:10px;bottom:10px;z-index:30;pointer-events:none}
#age6-gate{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(11,11,42,.92);font-family:"Courier New",monospace;color:#fff}
#age6-gate .box{width:min(420px,92vw);background:#1d1d48;border:4px solid #ffd21e;box-shadow:8px 8px 0 #000;padding:22px 18px 18px;text-align:center}
#age6-gate h2{margin:0 0 8px;color:#ffd21e;font-size:clamp(20px,5vw,28px);letter-spacing:1px;text-shadow:3px 3px 0 #000,0 0 14px #ff4040}
#age6-gate p{margin:0 0 16px;color:#cde;font-size:14px}
#age6-gate .row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
#age6-gate button{font-family:"Courier New",monospace;font-weight:bold;font-size:20px;padding:10px 22px;border:4px solid #111;box-shadow:4px 4px 0 #000;cursor:pointer;image-rendering:pixelated}
#age6-yes{background:#ffd21e;color:#111}
#age6-no{background:#3a3228;color:#fff}
#age6-yes:hover,#age6-no:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 #000}
#age6-gate .tiny{margin-top:14px;color:#556;font-size:11px}
.age6-tabby{width:92px;height:78px;margin:8px auto 14px;position:relative;image-rendering:pixelated}
.age6-tabby i{position:absolute;display:block}
.age6-tabby .ear{width:12px;height:14px;background:#f0983c;top:0}
.age6-tabby .ear.l{left:22px;clip-path:polygon(50% 0,100% 100%,0 100%)}
.age6-tabby .ear.r{right:22px;clip-path:polygon(50% 0,100% 100%,0 100%)}
.age6-tabby .head{width:36px;height:28px;background:#f0983c;left:28px;top:12px}
.age6-tabby .stripe-h{width:8px;height:4px;background:#a4521a;top:14px}
.age6-tabby .eye{width:7px;height:7px;background:#66ee66;top:22px;box-shadow:0 0 4px #226622}
.age6-tabby .eye.l{left:34px}
.age6-tabby .eye.r{right:34px}
.age6-tabby .muzzle{width:18px;height:8px;background:#fff2df;left:37px;top:32px}
.age6-tabby .nose{width:6px;height:4px;background:#ff8fa8;left:43px;top:30px}
.age6-tabby .body{width:44px;height:28px;background:#f0983c;left:24px;top:38px}
.age6-tabby .str{width:44px;height:5px;background:#a4521a;left:24px}
.age6-tabby .belly{width:22px;height:10px;background:#fff2df;left:35px;top:52px}
.age6-tabby .leg{width:8px;height:14px;background:#f0983c;top:62px}
.age6-tabby .paw{width:9px;height:5px;background:#fff2df;top:73px}
.age6-tabby .tail{width:8px;height:26px;background:#f0983c;left:66px;top:40px;transform:rotate(38deg);transform-origin:bottom center}
.age6-tabby .tail-s{width:8px;height:5px;background:#a4521a;left:72px;top:42px;transform:rotate(38deg)}
`;

  function badge() {
    return '<div class="age6-badge" title="Rated 6+"><span class="n">6+</span><span class="l">RATED</span></div>';
  }

  function tabby() {
    return `<div class="age6-tabby" aria-hidden="true">
      <i class="ear l"></i><i class="ear r"></i>
      <i class="head"></i>
      <i class="stripe-h" style="left:32px"></i><i class="stripe-h" style="left:42px"></i><i class="stripe-h" style="left:52px"></i>
      <i class="eye l"></i><i class="eye r"></i>
      <i class="muzzle"></i><i class="nose"></i>
      <i class="body"></i>
      <i class="str" style="top:42px"></i><i class="str" style="top:50px"></i>
      <i class="belly"></i>
      <i class="leg" style="left:28px"></i><i class="leg" style="left:40px"></i><i class="leg" style="left:52px"></i><i class="leg" style="left:64px"></i>
      <i class="paw" style="left:27px"></i><i class="paw" style="left:39px"></i><i class="paw" style="left:51px"></i><i class="paw" style="left:63px"></i>
      <i class="tail"></i><i class="tail-s"></i>
    </div>`;
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
      <div class="row"><a href="/" style="font-family:'Courier New',monospace;font-weight:bold;font-size:16px;padding:10px 18px;border:4px solid #111;background:#ffd21e;color:#111;text-decoration:none;box-shadow:4px 4px 0 #000">BACK TO ARCADE</a></div>
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
