(function () {
  const TEXT_CONTENT_KEY = 'sambitSiteTextContentOverridesV1';
  const IMAGE_CONTENT_KEY = 'sambitSiteImageContentOverridesV1';
  const AUTH_KEY = 'sambitAdminAuth';
  const TEXT_EDITABLE_SELECTOR = 'h1, h2, h3, p';
  const MANAGED_PAGES = [
    { file: 'index.html', label: 'Home' },
    { file: 'skills.html', label: 'Skills' },
    { file: 'notes.html', label: 'Notes' },
    { file: 'projects.html', label: 'Projects' },
    { file: 'certificates.html', label: 'Certificates' },
    { file: 'contact.html', label: 'Contact' }
  ];
  const MANAGED_IMAGE_FIELDS = {
    'index.html': [
      {
        key: 'profile-photo-src',
        selector: '.profile-photo',
        label: 'Profile photo source',
        attribute: 'src'
      }
    ]
  };

  function safeParse(value) {
    try {
      const data = JSON.parse(value);
      return data && typeof data === 'object' ? data : {};
    } catch (e) {
      return {};
    }
  }

  function readTextOverrides() {
    return safeParse(localStorage.getItem(TEXT_CONTENT_KEY));
  }

  function readImageOverrides() {
    return safeParse(localStorage.getItem(IMAGE_CONTENT_KEY));
  }

  function saveTextOverrides(next) {
    localStorage.setItem(TEXT_CONTENT_KEY, JSON.stringify(next));
  }

  function saveImageOverrides(next) {
    localStorage.setItem(IMAGE_CONTENT_KEY, JSON.stringify(next));
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

  function applyCurrentPageImageOverride() {
    const file = getCurrentManagedPageFile();
    if (!file) return;

    const imageFieldDefs = MANAGED_IMAGE_FIELDS[file];
    if (!Array.isArray(imageFieldDefs) || !imageFieldDefs.length) return;

    const imageOverrides = readImageOverrides();
    const pageOverrides = imageOverrides[file];
    if (!pageOverrides || typeof pageOverrides !== 'object') return;

    imageFieldDefs.forEach((fieldDef) => {
      const value = pageOverrides[fieldDef.key];
      if (typeof value !== 'string' || !value.trim()) return;
      const target = document.querySelector(fieldDef.selector);
      if (!target) return;
      target.setAttribute(fieldDef.attribute || 'src', value.trim());
    });
  }

  async function loadPageMainContent(file) {
    const response = await fetch('../' + file, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Could not load page source.');
    }

    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const main = doc.querySelector('main');
    return { content: main ? main.innerHTML.trim() : '' };
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

  function savePageImageField(file, key, value) {
    const overrides = readImageOverrides();
    if (!overrides[file] || typeof overrides[file] !== 'object') {
      overrides[file] = {};
    }
    overrides[file][key] = value;
    saveImageOverrides(overrides);
  }

  function resetPageImageField(file, key) {
    const overrides = readImageOverrides();
    if (!overrides[file] || typeof overrides[file] !== 'object') return;
    delete overrides[file][key];
    if (!Object.keys(overrides[file]).length) {
      delete overrides[file];
    }
    saveImageOverrides(overrides);
  }

  function logoutAdmin() {
    sessionStorage.removeItem(AUTH_KEY);
  }

  function initAdminPanel() {
    const select = document.getElementById('site-page-select');
    const openBtn = document.getElementById('site-open-btn');
    const logoutBtn = document.getElementById('site-logout-btn');
    const textStatus = document.getElementById('text-editor-status');
    const textList = document.getElementById('text-content-list');
    const textLoadBtn = document.getElementById('text-load-btn');
    const textSaveBtn = document.getElementById('text-save-btn');
    const textResetBtn = document.getElementById('text-reset-btn');
    const profileImageInput = document.getElementById('profile-image-url');
    const profileImageSaveBtn = document.getElementById('profile-image-save-btn');
    const profileImageResetBtn = document.getElementById('profile-image-reset-btn');
    const profileImageStatus = document.getElementById('profile-image-status');

    if (!select || !textStatus || !textList) return;
    if (!isAdminAuthenticated()) return;

    if (!select.options.length) {
      MANAGED_PAGES.forEach((page) => {
        const option = document.createElement('option');
        option.value = page.file;
        option.textContent = page.label + ' (' + page.file + ')';
        select.appendChild(option);
      });
    }

    async function loadSelectedTextFields() {
      try {
        textStatus.textContent = 'Loading content fields...';
        const result = await loadPageMainContent(select.value);
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<main>${result.content}</main>`, 'text/html');
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

        textStatus.textContent = 'Loaded heading and paragraph fields. Edit text and save.';
      } catch (error) {
        textStatus.textContent = error.message || 'Failed to load text fields.';
      }
    }

    function getProfileFieldDef() {
      const defs = MANAGED_IMAGE_FIELDS[select.value];
      return Array.isArray(defs) ? defs[0] : null;
    }

    function syncProfileImageUI() {
      if (!profileImageInput || !profileImageStatus) return;
      const fieldDef = getProfileFieldDef();
      if (!fieldDef) {
        profileImageInput.value = '';
        profileImageInput.disabled = true;
        if (profileImageSaveBtn) profileImageSaveBtn.disabled = true;
        if (profileImageResetBtn) profileImageResetBtn.disabled = true;
        profileImageStatus.textContent = 'Profile picture editing is only available for Home page.';
        return;
      }

      const pageOverrides = readImageOverrides()[select.value] || {};
      profileImageInput.disabled = false;
      if (profileImageSaveBtn) profileImageSaveBtn.disabled = false;
      if (profileImageResetBtn) profileImageResetBtn.disabled = false;
      profileImageInput.value = typeof pageOverrides[fieldDef.key] === 'string'
        ? pageOverrides[fieldDef.key]
        : '';
      profileImageStatus.textContent = 'Set a new image URL, then save.';
    }

    if (!select.dataset.bound) {
      select.dataset.bound = 'true';
      select.addEventListener('change', function () {
        loadSelectedTextFields();
        syncProfileImageUI();
      });
    }

    if (textLoadBtn && !textLoadBtn.dataset.bound) {
      textLoadBtn.dataset.bound = 'true';
      textLoadBtn.addEventListener('click', loadSelectedTextFields);
    }

    if (textSaveBtn && !textSaveBtn.dataset.bound) {
      textSaveBtn.dataset.bound = 'true';
      textSaveBtn.addEventListener('click', function () {
        const editableInputs = textList.querySelectorAll('[data-text-key]');
        if (!editableInputs.length) {
          textStatus.textContent = 'No fields loaded. Select a page and wait for fields to load.';
          return;
        }
        const payload = {};
        editableInputs.forEach((input) => {
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

    if (profileImageSaveBtn && profileImageInput && profileImageStatus && !profileImageSaveBtn.dataset.bound) {
      profileImageSaveBtn.dataset.bound = 'true';
      profileImageSaveBtn.addEventListener('click', function () {
        const fieldDef = getProfileFieldDef();
        if (!fieldDef) {
          profileImageStatus.textContent = 'Profile picture editing is only available for Home page.';
          return;
        }
        const value = profileImageInput.value.trim();
        if (!value) {
          profileImageStatus.textContent = 'Enter a valid image URL before saving.';
          return;
        }
        savePageImageField(select.value, fieldDef.key, value);
        profileImageStatus.textContent = 'Profile picture override saved.';
      });
    }

    if (profileImageResetBtn && profileImageStatus && !profileImageResetBtn.dataset.bound) {
      profileImageResetBtn.dataset.bound = 'true';
      profileImageResetBtn.addEventListener('click', function () {
        const fieldDef = getProfileFieldDef();
        if (!fieldDef) {
          profileImageStatus.textContent = 'Profile picture editing is only available for Home page.';
          return;
        }
        resetPageImageField(select.value, fieldDef.key);
        syncProfileImageUI();
        profileImageStatus.textContent = 'Profile picture override removed.';
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

    loadSelectedTextFields();
    syncProfileImageUI();
  }

  applyCurrentPageTextOverride();
  applyCurrentPageImageOverride();

  window.addEventListener('sambit-admin-unlocked', initAdminPanel);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminPanel);
  } else {
    initAdminPanel();
  }
})();
