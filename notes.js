(function () {
  const KEY = 'sambitNotesDataV1';
  const AUTH_KEY = 'sambitAdminAuth';
  // Static-site limitation: this client-side hash only deters casual access and is not equivalent to server-side auth.
  const ADMIN_PASSWORD_HASH = '83c3e2d9db907699dd8e3073ef92aca2f21338ed0d88b2f970b071516bbd4910';
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_MS = 5 * 60 * 1000;
  const IDLE_TIMEOUT_MS = 20 * 60 * 1000;
  const ATTEMPT_COUNT_KEY = 'sambitAdminAttemptCount';
  const LOCKED_UNTIL_KEY = 'sambitAdminLockedUntil';
  const RANDOM_ID_LENGTH = 6;
  const defaults = [
    {
      id: 'seed-1',
      date: '2026-04-19',
      title: 'Learning Consistency',
      content: 'Short daily notes make progress visible and easier to review later.'
    }
  ];

  function safeParse(value) {
    try {
      const data = JSON.parse(value);
      return Array.isArray(data) ? data : null;
    } catch (e) {
      return null;
    }
  }

  function readNotes() {
    const stored = safeParse(localStorage.getItem(KEY));
    if (stored && stored.length) return stored;
    return defaults;
  }

  function saveNotes(notes) {
    localStorage.setItem(KEY, JSON.stringify(notes));
  }

  function normalizeNotes(notes) {
    return notes.map((note, index) => ({
      id: note.id || `legacy-${index}`,
      date: note.date || '',
      title: note.title || '',
      content: note.content || ''
    }));
  }

  function getLocalISODate() {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
  }

  function formatDate(dateValue) {
    if (!dateValue) return '';
    const d = new Date(dateValue + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return dateValue;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  }

  function buildNoteNode(note, showDelete, onDelete) {
    const article = document.createElement('article');
    article.className = 'list-item';

    const meta = document.createElement('p');
    meta.className = 'meta';
    meta.textContent = formatDate(note.date) + ' · Notes';

    const title = document.createElement('h3');
    title.textContent = note.title;

    const content = document.createElement('p');
    content.textContent = note.content;

    article.append(meta, title, content);

    if (showDelete) {
      const wrap = document.createElement('div');
      wrap.className = 'actions';
      const del = document.createElement('button');
      del.className = 'btn ghost';
      del.type = 'button';
      del.textContent = 'Delete note';
      del.addEventListener('click', onDelete);
      wrap.appendChild(del);
      article.appendChild(wrap);
    }

    return article;
  }

  function renderPublic() {
    const list = document.getElementById('notes-list');
    if (!list) return;
    const notes = normalizeNotes(readNotes());
    list.innerHTML = '';
    notes.forEach((note) => {
      list.appendChild(buildNoteNode(note, false));
    });
  }

  function renderAdmin() {
    const list = document.getElementById('admin-notes-list');
    if (!list) return;

    const refresh = () => {
      const notes = normalizeNotes(readNotes());
      list.innerHTML = '';
      notes.forEach((note) => {
        list.appendChild(buildNoteNode(note, true, function () {
          const latest = normalizeNotes(readNotes());
          const filtered = latest.filter((item) => item.id !== note.id);
          saveNotes(filtered);
          refresh();
          renderPublic();
        }));
      });
    };

    refresh();

    const form = document.getElementById('add-note-form');
    if (!form) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const date = document.getElementById('note-date').value;
      const title = document.getElementById('note-title').value.trim();
      const content = document.getElementById('note-content').value.trim();
      if (!date || !title || !content) return;

      const notes = normalizeNotes(readNotes());
      notes.unshift({
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 2 + RANDOM_ID_LENGTH)}`,
        date: date,
        title: title,
        content: content
      });
      saveNotes(notes);
      form.reset();
      const dateInputAfter = document.getElementById('note-date');
      if (dateInputAfter) dateInputAfter.value = getLocalISODate();
      refresh();
      renderPublic();
    });

    const dateInput = document.getElementById('note-date');
    if (dateInput && !dateInput.value) dateInput.value = getLocalISODate();
  }

  function initLoginGate() {
    const form = document.getElementById('login-form');
    if (!form) return;

    const gate = document.getElementById('login-gate');
    const panel = document.getElementById('admin-panel');
    const error = document.getElementById('login-error');
    let idleTimer = null;
    let idleBound = false;

    function now() {
      return Date.now();
    }

    function constantTimeEquals(a, b) {
      if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
      let mismatch = 0;
      for (let i = 0; i < a.length; i += 1) {
        mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
      }
      return mismatch === 0;
    }

    async function sha256Hex(value) {
      const bytes = new TextEncoder().encode(value);
      const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(hashBuffer))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    }

    async function verifyPassword(password) {
      if (!window.crypto || !window.crypto.subtle) return false;
      const hash = await sha256Hex(password.normalize('NFKC'));
      return constantTimeEquals(hash, ADMIN_PASSWORD_HASH);
    }

    function getLockedUntil() {
      const value = Number(sessionStorage.getItem(LOCKED_UNTIL_KEY) || '0');
      return Number.isFinite(value) ? value : 0;
    }

    function clearAttemptState() {
      sessionStorage.removeItem(ATTEMPT_COUNT_KEY);
      sessionStorage.removeItem(LOCKED_UNTIL_KEY);
    }

    function registerFailedAttempt() {
      const current = Number(sessionStorage.getItem(ATTEMPT_COUNT_KEY) || '0');
      const next = Number.isFinite(current) ? current + 1 : 1;
      if (next >= MAX_LOGIN_ATTEMPTS) {
        sessionStorage.setItem(LOCKED_UNTIL_KEY, String(now() + LOCKOUT_MS));
        sessionStorage.removeItem(ATTEMPT_COUNT_KEY);
        return MAX_LOGIN_ATTEMPTS;
      }
      sessionStorage.setItem(ATTEMPT_COUNT_KEY, String(next));
      return next;
    }

    function getLockoutMessage() {
      const lockedUntil = getLockedUntil();
      if (lockedUntil <= now()) return '';
      const remainingSec = Math.max(1, Math.ceil((lockedUntil - now()) / 1000));
      return `Too many attempts. Try again in ${remainingSec}s.`;
    }

    function scheduleIdleLogout() {
      if (idleTimer) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        sessionStorage.removeItem(AUTH_KEY);
        gate.classList.remove('hidden');
        panel.classList.add('hidden');
        error.textContent = 'Session expired due to inactivity. Please log in again.';
      }, IDLE_TIMEOUT_MS);
    }

    function bindIdleTracking() {
      if (idleBound) {
        scheduleIdleLogout();
        return;
      }
      idleBound = true;
      ['click', 'keydown', 'mousemove', 'touchstart'].forEach((eventName) => {
        document.addEventListener(eventName, scheduleIdleLogout, { passive: true });
      });
      scheduleIdleLogout();
    }

    function unlock() {
      gate.classList.add('hidden');
      panel.classList.remove('hidden');
      renderAdmin();
      window.dispatchEvent(new CustomEvent('sambit-admin-unlocked'));
      bindIdleTracking();
    }

    const lockoutMessage = getLockoutMessage();
    if (lockoutMessage) {
      error.textContent = lockoutMessage;
    }

    if (sessionStorage.getItem(AUTH_KEY) === 'ok') {
      unlock();
      return;
    }

    if (!window.crypto || !window.crypto.subtle) {
      error.textContent = 'Secure login is not supported in this browser.';
      return;
    }

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const lockedUntil = getLockedUntil();
      if (lockedUntil > now()) {
        error.textContent = getLockoutMessage();
        return;
      }
      if (lockedUntil) clearAttemptState();

      const passwordInput = document.getElementById('password');
      const password = passwordInput.value;
      const isValid = await verifyPassword(password);
      passwordInput.value = '';

      if (isValid) {
        sessionStorage.setItem(AUTH_KEY, 'ok');
        clearAttemptState();
        error.textContent = '';
        unlock();
        return;
      }
      const attempts = registerFailedAttempt();
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        error.textContent = getLockoutMessage();
        return;
      }
      const left = MAX_LOGIN_ATTEMPTS - attempts;
      error.textContent = `Wrong password. ${left} attempt${left === 1 ? '' : 's'} left.`;
    });
  }

  window.sambitNotes = {
    initPublicNotes: renderPublic,
    initAdminNotes: initLoginGate
  };
})();
