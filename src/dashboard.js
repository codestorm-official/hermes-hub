export function renderDashboard(config) {
  const appName = escapeHtml(config.appName);
  const appUrl = escapeHtml(config.appUrl);
  const nodeEnv = escapeHtml(config.nodeEnv);
  const version = escapeHtml(config.version);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${appName} Hub</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #f5f7fa;
      --panel: #ffffff;
      --text: #142033;
      --muted: #5f6f86;
      --line: #dce3ec;
      --accent: #146c73;
      --accent-strong: #0b4f55;
      --danger: #a03b3b;
      --ok: #15785d;
      --warn: #9a5b05;
      --shadow: 0 18px 48px rgba(20, 32, 51, 0.08);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    body {
      min-height: 100vh;
      margin: 0;
      background:
        radial-gradient(circle at 16% 12%, rgba(20, 108, 115, 0.12), transparent 24rem),
        linear-gradient(135deg, #f5f7fa 0%, #edf4f4 54%, #f6f1e8 100%);
      color: var(--text);
    }

    button,
    input,
    textarea {
      font: inherit;
    }

    button {
      border: 0;
      border-radius: 8px;
      background: var(--accent);
      color: #fff;
      cursor: pointer;
      font-weight: 800;
      min-height: 42px;
      padding: 0 16px;
    }

    button.secondary {
      background: transparent;
      border: 1px solid var(--line);
      color: var(--text);
    }

    button.danger {
      background: transparent;
      border: 1px solid color-mix(in srgb, var(--danger) 40%, var(--line));
      color: var(--danger);
    }

    button:disabled {
      cursor: wait;
      opacity: 0.68;
    }

    input,
    textarea {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: color-mix(in srgb, var(--panel) 92%, transparent);
      color: var(--text);
      outline: 0;
      padding: 11px 12px;
    }

    textarea {
      min-height: 180px;
      resize: vertical;
      line-height: 1.55;
    }

    label {
      color: var(--muted);
      display: grid;
      font-size: 0.86rem;
      font-weight: 800;
      gap: 7px;
    }

    .shell {
      width: min(1180px, 100%);
      margin: 0 auto;
      padding: 24px;
    }

    header {
      display: grid;
      gap: 18px;
      margin-bottom: 22px;
    }

    .topbar {
      align-items: center;
      display: flex;
      gap: 16px;
      justify-content: space-between;
    }

    .brand {
      align-items: center;
      display: flex;
      gap: 14px;
      min-width: 0;
    }

    .mark {
      width: 46px;
      aspect-ratio: 1;
      border-radius: 8px;
      background: linear-gradient(135deg, var(--accent), #d89f48);
      color: white;
      display: grid;
      flex: 0 0 auto;
      font-size: 1.25rem;
      font-weight: 900;
      place-items: center;
    }

    h1,
    h2,
    h3,
    p {
      margin: 0;
    }

    h1 {
      font-size: clamp(1.7rem, 4vw, 2.6rem);
      letter-spacing: 0;
      line-height: 1.05;
    }

    .subtitle {
      color: var(--muted);
      font-size: 0.96rem;
      margin-top: 5px;
    }

    .status {
      align-items: center;
      color: var(--ok);
      display: flex;
      flex: 0 0 auto;
      font-weight: 900;
      gap: 9px;
    }

    .dot {
      width: 11px;
      aspect-ratio: 1;
      background: var(--ok);
      border-radius: 999px;
      box-shadow: 0 0 0 6px rgba(21, 120, 93, 0.12);
    }

    .stats {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .stat,
    .panel,
    .note {
      background: color-mix(in srgb, var(--panel) 92%, transparent);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
    }

    .stat {
      min-height: 94px;
      padding: 16px;
    }

    .stat span {
      color: var(--muted);
      display: block;
      font-size: 0.76rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .stat strong {
      display: block;
      font-size: 1.1rem;
      margin-top: 8px;
      overflow-wrap: anywhere;
    }

    main {
      display: grid;
      gap: 18px;
      grid-template-columns: minmax(320px, 0.82fr) minmax(0, 1.18fr);
    }

    .panel {
      padding: 18px;
    }

    .panel h2 {
      font-size: 1.08rem;
      letter-spacing: 0;
      margin-bottom: 14px;
    }

    form {
      display: grid;
      gap: 13px;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .toolbar {
      align-items: end;
      display: grid;
      gap: 10px;
      grid-template-columns: minmax(0, 1fr) auto;
      margin-bottom: 14px;
    }

    .tokenbar {
      align-items: end;
      display: grid;
      gap: 10px;
      grid-template-columns: minmax(0, 1fr) auto auto;
    }

    .message {
      border: 1px solid var(--line);
      border-radius: 8px;
      color: var(--muted);
      margin: 0 0 14px;
      padding: 11px 12px;
    }

    .message.warn {
      border-color: color-mix(in srgb, var(--warn) 42%, var(--line));
      color: var(--warn);
    }

    .notes {
      display: grid;
      gap: 12px;
    }

    .note {
      box-shadow: none;
      padding: 15px;
    }

    .note-head {
      align-items: start;
      display: flex;
      gap: 12px;
      justify-content: space-between;
    }

    .note h3 {
      font-size: 1rem;
      letter-spacing: 0;
      line-height: 1.3;
    }

    .note time,
    .note .source {
      color: var(--muted);
      display: block;
      font-size: 0.82rem;
      margin-top: 5px;
      overflow-wrap: anywhere;
    }

    .note p {
      color: var(--text);
      line-height: 1.55;
      margin-top: 12px;
      white-space: pre-wrap;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 12px;
    }

    .tag {
      background: color-mix(in srgb, var(--accent) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--accent) 24%, var(--line));
      border-radius: 999px;
      color: var(--accent-strong);
      font-size: 0.78rem;
      font-weight: 800;
      padding: 4px 9px;
    }

    .empty {
      color: var(--muted);
      padding: 24px 4px;
      text-align: center;
    }

    @media (max-width: 860px) {
      .shell {
        padding: 18px;
      }

      .topbar {
        align-items: start;
        display: grid;
      }

      .stats,
      main {
        grid-template-columns: 1fr;
      }

      .toolbar,
      .tokenbar {
        grid-template-columns: 1fr;
      }
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #101722;
        --panel: #172233;
        --text: #f5f8fc;
        --muted: #acb8c7;
        --line: #2e3b4f;
        --accent: #2fa8b1;
        --accent-strong: #9adfe4;
        --danger: #ff9b9b;
        --ok: #4bd19c;
        --warn: #e3ae61;
        --shadow: 0 18px 48px rgba(0, 0, 0, 0.26);
      }

      body {
        background:
          radial-gradient(circle at 16% 12%, rgba(47, 168, 177, 0.16), transparent 24rem),
          linear-gradient(135deg, #101722 0%, #172233 58%, #241e18 100%);
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <header>
      <div class="topbar">
        <div class="brand">
          <div class="mark" aria-hidden="true">H</div>
          <div>
            <h1>${appName} Hub</h1>
            <p class="subtitle">${appUrl}</p>
          </div>
        </div>
        <div class="status"><span class="dot" aria-hidden="true"></span><span id="service-status">Online</span></div>
      </div>
      <div class="stats" aria-label="Runtime summary">
        <div class="stat"><span>Environment</span><strong>${nodeEnv}</strong></div>
        <div class="stat"><span>Version</span><strong>${version}</strong></div>
        <div class="stat"><span>Notes</span><strong id="note-count">-</strong></div>
        <div class="stat"><span>Latest Note</span><strong id="latest-note">-</strong></div>
      </div>
    </header>

    <main>
      <section class="panel" aria-labelledby="capture-title">
        <h2 id="capture-title">Capture</h2>
        <div id="auth-message" class="message warn" hidden>Enter your Hermes token to use notes.</div>
        <form id="token-form" class="tokenbar" autocomplete="off" hidden>
          <label>Access token
            <input id="token-input" name="token" type="password" placeholder="HERMES_TOKEN">
          </label>
          <button type="submit">Save</button>
          <button type="button" class="secondary" id="clear-token">Clear</button>
        </form>
        <form id="note-form" autocomplete="off">
          <label>Title
            <input id="note-title" name="title" maxlength="120" placeholder="Quick thought, link, or task">
          </label>
          <label>Content
            <textarea id="note-content" name="content" required placeholder="Write the note here..."></textarea>
          </label>
          <label>Tags
            <input id="note-tags" name="tags" placeholder="idea, project, dokploy">
          </label>
          <label>Source
            <input id="note-source" name="source" placeholder="https://example.com or Telegram">
          </label>
          <div class="actions">
            <button id="save-note" type="submit">Save Note</button>
            <button type="reset" class="secondary">Reset</button>
          </div>
        </form>
      </section>

      <section class="panel" aria-labelledby="notes-title">
        <h2 id="notes-title">Notes</h2>
        <div class="toolbar">
          <label>Search
            <input id="search" type="search" placeholder="Search title, content, tags, source">
          </label>
          <button id="refresh" type="button" class="secondary">Refresh</button>
        </div>
        <div id="notice" class="message" hidden></div>
        <div id="notes" class="notes" aria-live="polite"></div>
      </section>
    </main>
  </div>

  <script>
    const state = {
      authRequired: false,
      token: localStorage.getItem('hermesToken') || '',
      notes: []
    };

    const els = {
      authMessage: document.querySelector('#auth-message'),
      clearToken: document.querySelector('#clear-token'),
      latestNote: document.querySelector('#latest-note'),
      noteCount: document.querySelector('#note-count'),
      noteForm: document.querySelector('#note-form'),
      notes: document.querySelector('#notes'),
      notice: document.querySelector('#notice'),
      refresh: document.querySelector('#refresh'),
      saveNote: document.querySelector('#save-note'),
      search: document.querySelector('#search'),
      serviceStatus: document.querySelector('#service-status'),
      tokenForm: document.querySelector('#token-form'),
      tokenInput: document.querySelector('#token-input')
    };

    els.tokenInput.value = state.token;
    els.noteForm.addEventListener('submit', saveNote);
    els.refresh.addEventListener('click', () => loadNotes());
    els.search.addEventListener('input', debounce(() => loadNotes(), 240));
    els.tokenForm.addEventListener('submit', saveToken);
    els.clearToken.addEventListener('click', clearToken);

    boot();

    async function boot() {
      try {
        const info = await api('/api/info');
        state.authRequired = info.notesAuthRequired;
        els.tokenForm.hidden = !state.authRequired;
        els.authMessage.hidden = !(state.authRequired && !state.token);
        await loadNotes();
      } catch (error) {
        els.serviceStatus.textContent = 'Offline';
        showNotice(error.message, true);
      }
    }

    async function loadNotes() {
      if (state.authRequired && !state.token) {
        renderNotes([]);
        return;
      }

      const query = els.search.value.trim();
      const response = await api('/api/notes' + (query ? '?query=' + encodeURIComponent(query) : ''));
      state.notes = response.notes || [];
      els.noteCount.textContent = response.stats?.noteCount ?? state.notes.length;
      els.latestNote.textContent = response.stats?.latestNoteAt ? formatDate(response.stats.latestNoteAt) : '-';
      renderNotes(state.notes);
    }

    async function saveNote(event) {
      event.preventDefault();

      const form = new FormData(els.noteForm);
      const payload = {
        title: form.get('title'),
        content: form.get('content'),
        tags: form.get('tags'),
        source: form.get('source')
      };

      els.saveNote.disabled = true;

      try {
        await api('/api/notes', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        els.noteForm.reset();
        showNotice('Note saved.');
        await loadNotes();
      } finally {
        els.saveNote.disabled = false;
      }
    }

    async function deleteNote(id) {
      await api('/api/notes/' + encodeURIComponent(id), { method: 'DELETE' });
      showNotice('Note deleted.');
      await loadNotes();
    }

    function saveToken(event) {
      event.preventDefault();
      state.token = els.tokenInput.value.trim();
      localStorage.setItem('hermesToken', state.token);
      els.authMessage.hidden = true;
      loadNotes().catch((error) => showNotice(error.message, true));
    }

    function clearToken() {
      state.token = '';
      els.tokenInput.value = '';
      localStorage.removeItem('hermesToken');
      els.authMessage.hidden = state.authRequired ? false : true;
      renderNotes([]);
    }

    async function api(path, options = {}) {
      const headers = {
        Accept: 'application/json',
        ...(options.headers || {})
      };

      if (options.body) {
        headers['Content-Type'] = 'application/json';
      }

      if (state.token) {
        headers.Authorization = 'Bearer ' + state.token;
      }

      const response = await fetch(path, { ...options, headers });
      const text = await response.text();
      const body = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(body.error || 'Request failed.');
      }

      return body;
    }

    function renderNotes(notes) {
      if (state.authRequired && !state.token) {
        els.notes.innerHTML = '<div class="empty">Notes are locked.</div>';
        return;
      }

      if (!notes.length) {
        els.notes.innerHTML = '<div class="empty">No notes yet.</div>';
        return;
      }

      els.notes.innerHTML = notes.map((note) => {
        const tags = Array.isArray(note.tags) ? note.tags : [];
        return '<article class="note">' +
          '<div class="note-head">' +
            '<div>' +
              '<h3>' + escapeHtml(note.title) + '</h3>' +
              '<time datetime="' + escapeHtml(note.createdAt) + '">' + formatDate(note.createdAt) + '</time>' +
              (note.source ? '<span class="source">' + escapeHtml(note.source) + '</span>' : '') +
            '</div>' +
            '<button type="button" class="danger" data-delete="' + escapeHtml(note.id) + '">Delete</button>' +
          '</div>' +
          (note.content ? '<p>' + escapeHtml(note.content) + '</p>' : '') +
          (tags.length ? '<div class="tags">' + tags.map((tag) => '<span class="tag">' + escapeHtml(tag) + '</span>').join('') + '</div>' : '') +
        '</article>';
      }).join('');

      els.notes.querySelectorAll('[data-delete]').forEach((button) => {
        button.addEventListener('click', () => {
          deleteNote(button.dataset.delete).catch((error) => showNotice(error.message, true));
        });
      });
    }

    function showNotice(message, isError = false) {
      els.notice.textContent = message;
      els.notice.hidden = false;
      els.notice.classList.toggle('warn', isError);

      if (!isError) {
        setTimeout(() => {
          els.notice.hidden = true;
        }, 2400);
      }
    }

    function formatDate(value) {
      if (!value) {
        return '-';
      }

      return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(value));
    }

    function escapeHtml(value) {
      return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    function debounce(callback, delay) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => callback(...args), delay);
      };
    }
  </script>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
