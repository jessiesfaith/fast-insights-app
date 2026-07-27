/* FAST Insights — private-preview login guard + 20-minute idle timeout for
   STATIC pages (the React app uses src/lib/auth.tsx with the same keys).
   Include as the first script in <head> on any static page that should
   require the login at /login. Redirects immediately if not signed in, and
   again after 20 minutes with no tracked activity. Port of Scout Quest's
   assets/sq-idle.js. Exposes window.FIIdle for testing. */
(function () {
  'use strict';
  var IDLE_MS = 20 * 60 * 1000;
  var CHECK_MS = 30 * 1000;
  var ACTIVITY_KEY = 'fi_last_activity';
  var AUTHED_KEY = 'fi_authed';

  function isAuthed() {
    try { return localStorage.getItem(AUTHED_KEY) === '1'; } catch (e) { return false; }
  }
  function touch() {
    try { localStorage.setItem(ACTIVITY_KEY, String(Date.now())); } catch (e) {}
  }
  function goToLogin(reason) {
    try {
      localStorage.removeItem(AUTHED_KEY);
      localStorage.removeItem('fi_email');
    } catch (e) {}
    var here = encodeURIComponent(location.pathname + location.search);
    location.replace('/login?reason=' + reason + '&from=' + here);
  }
  function check() {
    if (!isAuthed()) { goToLogin('required'); return; }
    var last = parseInt(localStorage.getItem(ACTIVITY_KEY) || '0', 10) || Date.now();
    if (Date.now() - last > IDLE_MS) { goToLogin('idle'); return; }
    var btn = document.getElementById('fi-signout-btn');
    if (btn) avoidCornerCollision(btn);
  }
  function signOut() {
    try {
      localStorage.removeItem(AUTHED_KEY);
      localStorage.removeItem('fi_email');
    } catch (e) {}
    location.href = '/login';
  }

  // If the page already has its own fixed control in the top-right corner,
  // push the sign-out button below the lowest one instead of overlapping it.
  function avoidCornerCollision(btn) {
    try {
      btn.style.top = '12px'; // reset first — this re-runs periodically
      var zone = 90, margin = 8, pushBelow = null;
      var kids = document.body.children;
      for (var i = 0; i < kids.length; i++) {
        var el = kids[i];
        if (el === btn) continue;
        if (getComputedStyle(el).position !== 'fixed') continue;
        var r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        var distFromRight = window.innerWidth - r.right;
        if (r.top > zone || distFromRight > zone || distFromRight < -zone) continue;
        if (pushBelow === null || r.bottom > pushBelow) pushBelow = r.bottom;
      }
      if (pushBelow !== null) btn.style.top = (pushBelow + margin) + 'px';
    } catch (e) {}
  }

  // Small floating "Sign out" control, injected here (not per-page) so every
  // gated static page gets one consistently. Self-contained inline styles.
  function injectSignOutButton() {
    if (document.getElementById('fi-signout-btn')) return;
    var btn = document.createElement('button');
    btn.id = 'fi-signout-btn';
    btn.type = 'button';
    btn.textContent = 'Sign out';
    btn.setAttribute('aria-label', 'Sign out of the FAST Insights private preview');
    btn.style.cssText = 'position:fixed;top:12px;right:12px;z-index:2147483647;'
      + 'background:#161618;color:#fafaf7;border:1px solid #3a3a3e;border-radius:999px;'
      + 'padding:7px 14px;font:600 12px/1.2 -apple-system,Segoe UI,Roboto,Arial,sans-serif;'
      + 'cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.35);opacity:.8;transition:opacity .15s ease;';
    btn.addEventListener('mouseenter', function () { btn.style.opacity = '1'; });
    btn.addEventListener('mouseleave', function () { btn.style.opacity = '.8'; });
    btn.addEventListener('click', signOut);
    document.body.appendChild(btn);
    avoidCornerCollision(btn);
  }

  if (!isAuthed()) {
    goToLogin('required');
  } else {
    touch();
    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(function (ev) {
      document.addEventListener(ev, touch, { passive: true });
    });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') check();
    });
    setInterval(check, CHECK_MS);
    if (document.body) injectSignOutButton();
    else document.addEventListener('DOMContentLoaded', injectSignOutButton);
  }

  window.FIIdle = { instance: { check: check, touch: touch, isAuthed: isAuthed, signOut: signOut } };
})();
