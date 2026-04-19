(function () {
  const KEY = 'sambitNotesDataV1';
  const defaults = [
    {
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
    const notes = readNotes();
    list.innerHTML = '';
    notes.forEach((note) => {
      list.appendChild(buildNoteNode(note, false));
    });
  }

  function renderAdmin() {
    const list = document.getElementById('admin-notes-list');
    if (!list) return;

    const refresh = () => {
      const notes = readNotes();
      list.innerHTML = '';
      notes.forEach((note, index) => {
        list.appendChild(buildNoteNode(note, true, function () {
          const latest = readNotes();
          latest.splice(index, 1);
          saveNotes(latest);
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

      const notes = readNotes();
      notes.unshift({ date: date, title: title, content: content });
      saveNotes(notes);
      form.reset();
      document.getElementById('note-date').valueAsDate = new Date();
      refresh();
      renderPublic();
    });

    const dateInput = document.getElementById('note-date');
    if (dateInput && !dateInput.value) dateInput.valueAsDate = new Date();
  }

  function initLoginGate() {
    const form = document.getElementById('login-form');
    if (!form) return;

    const gate = document.getElementById('login-gate');
    const panel = document.getElementById('admin-panel');
    const error = document.getElementById('login-error');

    function unlock() {
      gate.classList.add('hidden');
      panel.classList.remove('hidden');
      renderAdmin();
    }

    if (sessionStorage.getItem('sambitAdminAuth') === 'ok') {
      unlock();
      return;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const password = document.getElementById('password').value;
      if (password === 'TAMLOML') {
        sessionStorage.setItem('sambitAdminAuth', 'ok');
        error.textContent = '';
        unlock();
        return;
      }
      error.textContent = 'Wrong password.';
    });
  }

  window.sambitNotes = {
    initPublicNotes: renderPublic,
    initAdminNotes: initLoginGate
  };
})();
