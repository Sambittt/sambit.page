(function () {
  const CONTENT_KEY = 'sambitSiteContentOverridesV1';
  const AUTH_KEY = 'sambitAdminAuth';
  const MANAGED_PAGES = [
    { file: 'index.html', label: 'Home' },
    { file: 'skills.html', label: 'Skills' },
    { file: 'notes.html', label: 'Notes' },
    { file: 'projects.html', label: 'Projects' },
    { file: 'certificates.html', label: 'Certificates' },
    { file: 'contact.html', label: 'Contact' }
  ];

  function safeParse(value) {
    try {
      const data = JSON.parse(value);
      return data && typeof data === 'object' ? data : {};
    } catch (e) {
      return {};
    }
  }

  function readOverrides() {
    return safeParse(localStorage.getItem(CONTENT_KEY));
  }

  function saveOverrides(next) {
    localStorage.setItem(CONTENT_KEY, JSON.stringify(next));
  }

  function isAdminAuthenticated() {
    return sessionStorage.getItem(AUTH_KEY) === 'ok';
  }

  function getCurrentManagedPageFile() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/sambitlogin/')) return null;

    const file = path.endsWith('/') ? 'index.html' : path.split('/').pop() || 'index.html';
    const isManaged = MANAGED_PAGES.some((page) => page.file === file);
    return isManaged ? file : null;
  }

  function applyCurrentPageOverride() {
    const file = getCurrentManagedPageFile();
    if (!file) return;

    const overrides = readOverrides();
    const html = overrides[file];
    if (typeof html !== 'string') return;

    const main = document.querySelector('main');
    if (!main) return;

    main.innerHTML = html;
  }

  async function loadPageMainContent(file) {
    const overrides = readOverrides();
    if (typeof overrides[file] === 'string') {
      return { html: overrides[file], source: 'saved' };
    }

    const response = await fetch('../' + file, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Could not load page source.');
    }

    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const main = doc.querySelector('main');
    return { html: main ? main.innerHTML.trim() : '', source: 'live' };
  }

  function savePageMainContent(file, html) {
    const overrides = readOverrides();
    overrides[file] = html;
    saveOverrides(overrides);
  }

  function resetPageMainContent(file) {
    const overrides = readOverrides();
    delete overrides[file];
    saveOverrides(overrides);
  }

  function logoutAdmin() {
    sessionStorage.removeItem(AUTH_KEY);
  }

  function initAdminPanel() {
    const select = document.getElementById('site-page-select');
    const editor = document.getElementById('site-page-editor');
    const status = document.getElementById('site-editor-status');
    const loadBtn = document.getElementById('site-load-btn');
    const saveBtn = document.getElementById('site-save-btn');
    const resetBtn = document.getElementById('site-reset-btn');
    const openBtn = document.getElementById('site-open-btn');
    const logoutBtn = document.getElementById('site-logout-btn');

    if (!select || !editor || !status) return;
    if (!isAdminAuthenticated()) return;

    if (!select.options.length) {
      MANAGED_PAGES.forEach((page) => {
        const option = document.createElement('option');
        option.value = page.file;
        option.textContent = page.label + ' (' + page.file + ')';
        select.appendChild(option);
      });
    }

    async function loadSelectedPage() {
      try {
        status.textContent = 'Loading page content...';
        const result = await loadPageMainContent(select.value);
        editor.value = result.html;
        status.textContent = result.source === 'saved'
          ? 'Loaded your saved override.'
          : 'Loaded current website content.';
      } catch (error) {
        status.textContent = error.message || 'Failed to load page content.';
      }
    }

    if (!select.dataset.bound) {
      select.dataset.bound = 'true';
      select.addEventListener('change', loadSelectedPage);
    }

    if (loadBtn && !loadBtn.dataset.bound) {
      loadBtn.dataset.bound = 'true';
      loadBtn.addEventListener('click', loadSelectedPage);
    }

    if (saveBtn && !saveBtn.dataset.bound) {
      saveBtn.dataset.bound = 'true';
      saveBtn.addEventListener('click', function () {
        savePageMainContent(select.value, editor.value.trim());
        status.textContent = 'Saved. Refresh/open page to see changes.';
      });
    }

    if (resetBtn && !resetBtn.dataset.bound) {
      resetBtn.dataset.bound = 'true';
      resetBtn.addEventListener('click', function () {
        resetPageMainContent(select.value);
        status.textContent = 'Saved override removed for this page.';
        loadSelectedPage();
      });
    }

    if (openBtn && !openBtn.dataset.bound) {
      openBtn.dataset.bound = 'true';
      openBtn.addEventListener('click', function () {
        window.open('../' + select.value, '_blank', 'noopener');
      });
    }

    if (logoutBtn && !logoutBtn.dataset.bound) {
      logoutBtn.dataset.bound = 'true';
      logoutBtn.addEventListener('click', function () {
        logoutAdmin();
        window.location.reload();
      });
    }

    loadSelectedPage();
  }

  applyCurrentPageOverride();

  window.addEventListener('sambit-admin-unlocked', initAdminPanel);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminPanel);
  } else {
    initAdminPanel();
  }
})();
