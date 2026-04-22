(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const THEME_KEY = 'sambitThemePreferenceV1';
  const root = document.documentElement;

  function updateActiveNavLink() {
    const path = window.location.pathname;
    const currentFile = path.endsWith('/') ? 'index.html' : path.split('/').pop();
    document.querySelectorAll('.nav-links a').forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (!href) return;
      const hrefFile = href.endsWith('/') ? 'index.html' : href.split('/').pop();
      if (hrefFile && hrefFile === currentFile) {
        link.classList.add('active');
      }
    });
  }

  function applyTheme(theme) {
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
      return;
    }
    root.removeAttribute('data-theme');
  }

  function initThemeToggle() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) applyTheme(savedTheme);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle';
    button.setAttribute('aria-label', 'Toggle theme');
    button.textContent = root.getAttribute('data-theme') === 'light' ? 'Dark mode' : 'Light mode';
    button.addEventListener('click', () => {
      const isLight = root.getAttribute('data-theme') === 'light';
      const nextTheme = isLight ? 'dark' : 'light';
      applyTheme(nextTheme);
      localStorage.setItem(THEME_KEY, nextTheme);
      button.textContent = nextTheme === 'light' ? 'Dark mode' : 'Light mode';
    });
    navLinks.appendChild(button);
  }

  function initScrollProgress() {
    const progress = document.createElement('div');
    progress.className = 'scroll-progress';
    document.body.prepend(progress);

    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const value = max > 0 ? (window.scrollY / max) * 100 : 0;
      progress.style.setProperty('--progress', `${Math.round(Math.max(0, Math.min(100, value)))}%`);
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
  }

  updateActiveNavLink();
  initThemeToggle();
  initScrollProgress();

  const revealTargets = Array.from(document.querySelectorAll('.hero, .card, .list-item'));
  revealTargets.forEach((el) => el.classList.add('reveal'));

  if (revealTargets.length && !reducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    revealTargets.forEach((el) => observer.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }

  if (reducedMotion) return;

  const interactiveCards = Array.from(document.querySelectorAll('.card, .hero'));

  interactiveCards.forEach((card) => {
    card.addEventListener('mousemove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const nx = x / rect.width;
      const ny = y / rect.height;
      const tiltX = (0.5 - ny) * 5;
      const tiltY = (nx - 0.5) * 7;

      card.style.setProperty('--mx', `${(nx * 100).toFixed(2)}%`);
      card.style.setProperty('--my', `${(ny * 100).toFixed(2)}%`);
      card.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
    });
  });
})();
