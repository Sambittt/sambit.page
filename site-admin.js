(function () {
  const CONTENT_KEY = 'sambitSiteContentOverridesV1';
  const TEXT_CONTENT_KEY = 'sambitSiteTextContentOverridesV1';
  const AUTH_KEY = 'sambitAdminAuth';
  const TEXT_EDITABLE_SELECTOR = 'h1, h2, h3, p, li, .eyebrow, .tag, .profile-caption, .card-link, .btn';
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

  function readTextOverrides() {
    return safeParse(localStorage.getItem(TEXT_CONTENT_KEY));
  }

  function saveTextOverrides(next) {
    localStorage.setItem(TEXT_CONTENT_KEY, JSON.stringify(next));
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

  function collectEditableTextFields(main) {
    if (!main) return [];
    const items = Array.from(main.querySelectorAll(TEXT_EDITABLE_SELECTOR))
      .map((element, index) => {
        const text = element.textContent.trim();
        if (!text) return null;
        return {
          key: `field-${index}`,
          label: `${element.tagName.toLowerCase()} #${index + 1}`,
          text: text,
          element: element
        };
      })
      .filter(Boolean);
    return items;
  }

  function applyCurrentPageTextOverride() {
    const file = getCurrentManagedPageFile();
    if (!file) return;

    const textOverrides = readTextOverrides();
    const pageTextOverrides = textOverrides[file];
    if (!pageTextOverrides || typeof pageTextOverrides !== 'object') return;

    const main = document.querySelector('main');
    if (!main) return;

    collectEditableTextFields(main).forEach((field) => {
      if (typeof pageTextOverrides[field.key] === 'string') {
        field.element.textContent = pageTextOverrides[field.key];
      }
    });
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

  function savePageTextContent(file, data) {
    const overrides = readTextOverrides();
    overrides[file] = data;
    saveTextOverrides(overrides);
  }

  function resetPageTextContent(file) {
    const overrides = readTextOverrides();
    delete overrides[file];
    saveTextOverrides(overrides);
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
    const textStatus = document.getElementById('text-editor-status');
    const textList = document.getElementById('text-content-list');
    const textLoadBtn = document.getElementById('text-load-btn');
    const textSaveBtn = document.getElementById('text-save-btn');
    const textResetBtn = document.getElementById('text-reset-btn');

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

    async function loadSelectedTextFields() {
      if (!textList || !textStatus) return;
      try {
        textStatus.textContent = 'Loading content fields...';
        const result = await loadPageMainContent(select.value);
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<main>${result.html}</main>`, 'text/html');
        const fields = collectEditableTextFields(doc.querySelector('main'));
        const pageOverrides = readTextOverrides()[select.value] || {};
        textList.innerHTML = '';

        if (!fields.length) {
          textStatus.textContent = 'No editable text fields found for this page.';
          return;
        }

        fields.forEach((field) => {
          const wrap = document.createElement('label');
          const title = document.createElement('span');
          title.textContent = field.label;
          const input = field.text.length > 110
            ? document.createElement('textarea')
            : document.createElement('input');
          if (input.tagName === 'INPUT') input.type = 'text';
          input.value = typeof pageOverrides[field.key] === 'string'
            ? pageOverrides[field.key]
            : field.text;
          input.setAttribute('data-text-key', field.key);
          wrap.append(title, input);
          textList.appendChild(wrap);
        });

        textStatus.textContent = 'Loaded text fields. Edit plain text and save.';
      } catch (error) {
        textStatus.textContent = error.message || 'Failed to load text fields.';
      }
    }

    if (!select.dataset.bound) {
      select.dataset.bound = 'true';
      select.addEventListener('change', function () {
        loadSelectedPage();
        loadSelectedTextFields();
      });
    }

    if (loadBtn && !loadBtn.dataset.bound) {
      loadBtn.dataset.bound = 'true';
      loadBtn.addEventListener('click', loadSelectedPage);
    }

    if (textLoadBtn && !textLoadBtn.dataset.bound) {
      textLoadBtn.dataset.bound = 'true';
      textLoadBtn.addEventListener('click', loadSelectedTextFields);
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

    if (textSaveBtn && !textSaveBtn.dataset.bound) {
      textSaveBtn.dataset.bound = 'true';
      textSaveBtn.addEventListener('click', function () {
        if (!textList || !textStatus) return;
        const payload = {};
        textList.querySelectorAll('[data-text-key]').forEach((input) => {
          payload[input.getAttribute('data-text-key')] = input.value.trim();
        });
        savePageTextContent(select.value, payload);
        textStatus.textContent = 'Saved text-only changes. Refresh/open page to see updates.';
      });
    }

    if (textResetBtn && !textResetBtn.dataset.bound) {
      textResetBtn.dataset.bound = 'true';
      textResetBtn.addEventListener('click', function () {
        resetPageTextContent(select.value);
        textStatus.textContent = 'Text-only overrides removed for this page.';
        loadSelectedTextFields();
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
    loadSelectedTextFields();
  }

  applyCurrentPageOverride();
  applyCurrentPageTextOverride();

  window.addEventListener('sambit-admin-unlocked', initAdminPanel);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminPanel);
  } else {
    initAdminPanel();
  }
})();
