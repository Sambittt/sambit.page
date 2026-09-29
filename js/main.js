/**
 * sambit.page — Shared Client-Side Logic & Components
 * Handles Navigation, Cursor, Firebase Auth State & Page UI
 */

// ── 1. ACTIVE NAV LINK HIGHLIGHTING ─────────────────────────────────────
function initActiveNav() {
  const path = window.location.pathname.toLowerCase();
  const pageName = path.replace('.html', '').split('/').filter(Boolean).pop() || '';
  const navLinks = document.querySelectorAll('.nav-links a, #mob-menu a:not(.tool-link)');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href').toLowerCase();
    const isHome = (path === '/' || path.endsWith('/index.html') || path === '') && 
                   (href === '/' || href === '/index.html' || href === 'index.html');
    const hrefName = href.replace('.html', '').split('/').filter(Boolean).pop() || '';
    const isMatch = Boolean(pageName && hrefName && pageName === hrefName);
    
    if (isHome || isMatch) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Nav blur & border highlight on scroll
  const navEl = document.querySelector('nav');
  if (navEl) {
    window.addEventListener('scroll', () => {
      navEl.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });
  }
}

// ── 2. MOBILE MENU CONTROLLER ───────────────────────────────────────────
window.toggleMob = function() {
  const hmbg = document.getElementById('hmbg');
  const menu = document.getElementById('mob-menu');
  if (hmbg && menu) {
    hmbg.classList.toggle('open');
    menu.classList.toggle('open');
    document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
  }
};

window.closeMob = function() {
  const hmbg = document.getElementById('hmbg');
  const menu = document.getElementById('mob-menu');
  if (hmbg && menu) {
    hmbg.classList.remove('open');
    menu.classList.remove('open');
    document.body.style.overflow = '';
  }
};

// ── 3. LIVE UPTIME DISPLAY ──────────────────────────────────────────────
function initUptime() {
  const uptimeVal = document.getElementById('uptime-val');
  if (!uptimeVal) return;
  
  function update() {
    const d = new Date(), h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
    uptimeVal.textContent =
      `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} — system nominal`;
  }
  update();
  setInterval(update, 1000);
}

// ── 4. SCROLL REVEAL OBSERVER ───────────────────────────────────────────
function initScrollReveal() {
  const revealEls = document.querySelectorAll('.reveal, .sec-inner, .cert-card, .skill-card, .exp-card, .contact-card, .hl-card');
  if (!revealEls.length) return;

  revealEls.forEach(el => el.classList.add('reveal'));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  revealEls.forEach(el => observer.observe(el));
}

// ── 5. CUSTOM GREEN CURSOR ──────────────────────────────────────────────
function initCursor() {
  if (!window.matchMedia('(pointer:fine)').matches) return;
  
  const dot = document.getElementById('cur-dot');
  const ring = document.getElementById('cur-ring');
  if (!dot || !ring) return;

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;
  let raf;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(calc(-50% + ${mx}px), calc(-50% + ${my}px))`;
  });

  function lerp(a, b, t) { return a + (b - a) * t; }
  function loop() {
    rx = lerp(rx, mx, 0.14);
    ry = lerp(ry, my, 0.14);
    ring.style.transform = `translate(calc(-50% + ${rx}px), calc(-50% + ${ry}px))`;
    raf = requestAnimationFrame(loop);
  }
  loop();

  // Ring expand on hoverable elements
  const hoverSelector = 'a, button, .btn-pri, .btn-sec, .nav-tool, .skill-card, .exp-card, .cert-card, .contact-card, .hl-card, .pfp-hover-target';
  document.querySelectorAll(hoverSelector).forEach(el => {
    el.addEventListener('mouseenter', () => {
      ring.style.width = '46px';
      ring.style.height = '46px';
      ring.style.borderColor = 'rgba(74, 222, 128, 0.85)';
      ring.style.background = 'rgba(74, 222, 128, 0.07)';
    });
    el.addEventListener('mouseleave', () => {
      ring.style.width = '';
      ring.style.height = '';
      ring.style.borderColor = '';
      ring.style.background = '';
    });
  });

  document.addEventListener('mousedown', () => document.body.classList.add('cur-click'));
  document.addEventListener('mouseup', () => document.body.classList.remove('cur-click'));
  document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });
}

// ── 6. FIREBASE AUTHENTICATION UI INTEGRATION ───────────────────────────
async function initFirebaseAuth() {
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js");
    const { getAuth, onAuthStateChanged, signOut } = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js");

    const firebaseConfig = {
      apiKey: "AIzaSyAvwVd19ucMaKp_WsYDSVU0hzu5asHhS1k",
      authDomain: "sambit-portfolio.firebaseapp.com",
      projectId: "sambit-portfolio",
      storageBucket: "sambit-portfolio.firebasestorage.app",
      messagingSenderId: "98909249081",
      appId: "1:98909249081:web:00bdbda2f0ed56a2c177e8"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    const DEFAULT_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" fill="#4ade80"/></svg>`;

    onAuthStateChanged(auth, user => {
      const loginBtn = document.getElementById('nav-login-btn');
      const avatarWrap = document.getElementById('nav-avatar-wrap');
      const mobLoginLink = document.getElementById('mob-login-link');
      const mobUserCard = document.getElementById('mob-user-card');

      if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (avatarWrap) avatarWrap.style.display = 'block';

        const inner = document.getElementById('nav-avatar-inner');
        if (inner) {
          inner.innerHTML = user.photoURL 
            ? `<img src="${user.photoURL}" alt="${user.displayName || 'User'}">`
            : `<span class="nav-avatar-default">${DEFAULT_SVG}</span>`;
        }

        const dropName = document.getElementById('drop-name');
        const dropEmail = document.getElementById('drop-email');
        if (dropName) dropName.textContent = user.displayName || 'User';
        if (dropEmail) dropEmail.textContent = user.email || '';

        const dropSignOut = document.getElementById('drop-signout-btn');
        if (dropSignOut) {
          dropSignOut.onclick = async () => {
            await signOut(auth);
            const drop = document.getElementById('avatar-dropdown');
            if (drop) drop.classList.remove('open');
          };
        }

        if (mobLoginLink) mobLoginLink.style.display = 'none';
        if (mobUserCard) mobUserCard.classList.add('visible');

        const mobAvatar = document.getElementById('mob-avatar-lg');
        if (mobAvatar) {
          mobAvatar.innerHTML = user.photoURL 
            ? `<img src="${user.photoURL}" alt="avatar">` 
            : DEFAULT_SVG;
        }

        const mobName = document.getElementById('mob-user-name');
        const mobEmail = document.getElementById('mob-user-email');
        if (mobName) mobName.textContent = user.displayName || 'User';
        if (mobEmail) mobEmail.textContent = user.email || '';

        const mobSignOut = document.getElementById('mob-signout-btn');
        if (mobSignOut) {
          mobSignOut.onclick = async () => {
            await signOut(auth);
            closeMob();
          };
        }
      } else {
        if (loginBtn) loginBtn.style.display = '';
        if (avatarWrap) avatarWrap.style.display = 'none';
        if (mobLoginLink) mobLoginLink.style.display = '';
        if (mobUserCard) mobUserCard.classList.remove('visible');
      }
    });

    // Avatar menu toggle
    window.toggleAvatarMenu = function() {
      const drop = document.getElementById('avatar-dropdown');
      if (drop) drop.classList.toggle('open');
    };

    document.addEventListener('click', e => {
      const wrap = document.getElementById('nav-avatar-wrap');
      const drop = document.getElementById('avatar-dropdown');
      if (wrap && drop && !wrap.contains(e.target)) {
        drop.classList.remove('open');
      }
    });
  } catch (err) {
    console.warn("Firebase Auth init skipped or failed:", err);
  }
}

// ── DOM READY BOOTSTRAP ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initActiveNav();
  initUptime();
  initScrollReveal();
  initCursor();
  initFirebaseAuth();
});
