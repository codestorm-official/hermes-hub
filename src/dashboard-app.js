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
      color-scheme: light;
      --bg: #f4f1ea;
      --surface: #fffdf8;
      --surface-soft: #f7f3ea;
      --sidebar: #20231f;
      --sidebar-soft: #2d302a;
      --text: #202624;
      --muted: #66736c;
      --line: #ddd6ca;
      --accent: #287d72;
      --accent-strong: #185d55;
      --accent-soft: #dfeee9;
      --gold: #c99435;
      --danger: #a54242;
      --ok: #287a55;
      --warn: #9a610a;
      --shadow: 0 18px 46px rgba(32, 38, 36, 0.08);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    body {
      min-height: 100vh;
      margin: 0;
      background:
        radial-gradient(circle at 86% 10%, rgba(40, 125, 114, 0.13), transparent 23rem),
        linear-gradient(135deg, #f4f1ea 0%, #edf4ef 48%, #f8f4ea 100%);
      color: var(--text);
    }

    button,
    input,
    select,
    textarea {
      font: inherit;
    }

    button {
      align-items: center;
      border: 0;
      border-radius: 8px;
      background: var(--accent);
      color: #fff;
      cursor: pointer;
      display: inline-flex;
      font-weight: 800;
      gap: 8px;
      justify-content: center;
      min-height: 40px;
      padding: 0 14px;
    }

    button.secondary {
      background: var(--surface);
      border: 1px solid var(--line);
      color: var(--text);
    }

    button.ghost {
      background: transparent;
      color: inherit;
    }

    button.danger {
      background: transparent;
      border: 1px solid color-mix(in srgb, var(--danger) 42%, var(--line));
      color: var(--danger);
    }

    button.logout-button {
      background: var(--danger);
      color: #fff;
      width: 100%;
    }

    button.icon-button {
      background: var(--surface);
      border: 1px solid var(--line);
      color: var(--text);
      flex: 0 0 44px;
      min-height: 42px;
      padding: 0;
    }

    button:disabled {
      cursor: wait;
      opacity: 0.66;
    }

    input,
    select,
    textarea {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      color: var(--text);
      outline: 0;
      padding: 10px 11px;
    }

    select {
      min-height: 42px;
    }

    textarea {
      min-height: 184px;
      resize: vertical;
      line-height: 1.55;
    }

    input:focus,
    select:focus,
    textarea:focus {
      border-color: color-mix(in srgb, var(--accent) 64%, var(--line));
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent);
    }

    label {
      color: var(--muted);
      display: grid;
      font-size: 0.84rem;
      font-weight: 800;
      gap: 7px;
    }

    h1,
    h2,
    h3,
    p {
      margin: 0;
    }

    .login-screen {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
    }

    .login-card {
      width: min(420px, 100%);
      background: color-mix(in srgb, var(--surface) 94%, transparent);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
      padding: 24px;
    }

    .login-brand {
      align-items: center;
      display: flex;
      gap: 12px;
      margin-bottom: 22px;
    }

    .mark {
      width: 42px;
      aspect-ratio: 1;
      border-radius: 8px;
      background: linear-gradient(135deg, var(--accent), var(--gold));
      color: white;
      display: grid;
      flex: 0 0 auto;
      font-size: 1.1rem;
      font-weight: 900;
      place-items: center;
    }

    .login-card form {
      display: grid;
      gap: 13px;
    }

    .app-shell {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 248px minmax(0, 1fr);
    }

    .sidebar {
      background: linear-gradient(180deg, var(--sidebar) 0%, #24261f 100%);
      color: #f9f4e7;
      display: flex;
      flex-direction: column;
      gap: 22px;
      min-height: 100vh;
      padding: 20px;
    }

    .sidebar-brand {
      align-items: center;
      display: flex;
      gap: 12px;
    }

    .sidebar-brand small,
    .sidebar-foot,
    .muted {
      color: var(--muted);
    }

    .sidebar-brand small {
      color: #bbb4a4;
      display: block;
      font-weight: 700;
      margin-top: 2px;
      overflow-wrap: anywhere;
    }

    .nav {
      display: grid;
      gap: 8px;
    }

    .nav-button {
      background: transparent;
      color: #e9e2d3;
      justify-content: flex-start;
      min-height: 42px;
      padding: 0 12px;
      text-align: left;
      width: 100%;
    }

    .nav-button[aria-current="page"] {
      background: #f5ebd0;
      color: #20231f;
    }

    .nav-icon {
      width: 22px;
      color: inherit;
      display: inline-grid;
      flex: 0 0 auto;
      font-weight: 900;
      place-items: center;
    }

    .sidebar-foot {
      display: grid;
      gap: 10px;
      margin-top: auto;
    }

    .workspace {
      min-width: 0;
      padding: 24px;
    }

    .topbar {
      align-items: start;
      display: flex;
      gap: 16px;
      justify-content: space-between;
      margin-bottom: 18px;
    }

    .topbar h1 {
      font-size: clamp(1.7rem, 4vw, 2.55rem);
      letter-spacing: 0;
      line-height: 1.05;
    }

    .subtitle {
      color: var(--muted);
      margin-top: 5px;
      overflow-wrap: anywhere;
    }

    .pill {
      align-items: center;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 999px;
      color: var(--muted);
      display: inline-flex;
      font-size: 0.82rem;
      font-weight: 800;
      gap: 8px;
      min-height: 34px;
      padding: 0 12px;
      white-space: nowrap;
    }

    .dot {
      width: 9px;
      aspect-ratio: 1;
      background: var(--ok);
      border-radius: 999px;
      box-shadow: 0 0 0 5px rgba(40, 122, 85, 0.12);
    }

    .stats {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      margin-bottom: 18px;
    }

    .stat,
    .panel,
    .note {
      background: color-mix(in srgb, var(--surface) 94%, transparent);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
    }

    .stat {
      min-height: 88px;
      padding: 15px;
    }

    .stat span {
      color: var(--muted);
      display: block;
      font-size: 0.72rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .stat strong {
      display: block;
      font-size: 1.02rem;
      margin-top: 8px;
      overflow-wrap: anywhere;
    }

    .view {
      display: grid;
      gap: 16px;
    }

    .view[hidden],
    .login-screen[hidden],
    .app-shell[hidden],
    [hidden] {
      display: none !important;
    }

    .panel {
      padding: 18px;
    }

    .panel-head {
      align-items: start;
      display: flex;
      gap: 12px;
      justify-content: space-between;
      margin-bottom: 15px;
    }

    .panel h2 {
      font-size: 1.04rem;
      letter-spacing: 0;
    }

    .panel p {
      color: var(--muted);
      line-height: 1.55;
      margin-top: 5px;
    }

    form,
    .form-grid {
      display: grid;
      gap: 13px;
    }

    .two-col {
      display: grid;
      gap: 13px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .action-row,
    .toolbar,
    .model-row {
      align-items: end;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .toolbar label,
    .model-row label {
      flex: 1 1 260px;
    }

    .message {
      border: 1px solid var(--line);
      border-radius: 8px;
      color: var(--muted);
      margin-bottom: 13px;
      padding: 10px 12px;
    }

    .message.warn {
      border-color: color-mix(in srgb, var(--warn) 42%, var(--line));
      color: var(--warn);
    }

    .message.ok {
      border-color: color-mix(in srgb, var(--ok) 38%, var(--line));
      color: var(--ok);
    }

    .answer {
      background: color-mix(in srgb, var(--accent) 8%, var(--surface));
      border: 1px solid color-mix(in srgb, var(--accent) 24%, var(--line));
      border-radius: 8px;
      line-height: 1.65;
      margin-top: 14px;
      padding: 15px;
      white-space: pre-wrap;
    }

    .sources,
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      margin-top: 12px;
    }

    .source-pill,
    .tag {
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 800;
      padding: 4px 9px;
    }

    .source-pill {
      border: 1px solid var(--line);
      color: var(--muted);
    }

    .tag {
      background: var(--accent-soft);
      border: 1px solid color-mix(in srgb, var(--accent) 22%, var(--line));
      color: var(--accent-strong);
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

    .note-actions {
      display: flex;
      flex: 0 0 auto;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
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
      line-height: 1.58;
      margin-top: 12px;
      white-space: pre-wrap;
    }

    .empty {
      color: var(--muted);
      padding: 28px 4px;
      text-align: center;
    }

    .checkline {
      align-items: center;
      color: var(--muted);
      display: flex;
      font-size: 0.86rem;
      font-weight: 800;
      gap: 9px;
    }

    .checkline input {
      width: auto;
    }

    .key-status {
      color: var(--muted);
      font-size: 0.84rem;
      font-weight: 800;
    }

    .secret-field {
      align-items: center;
      display: flex;
      gap: 8px;
    }

    .toast-stack {
      bottom: 18px;
      display: grid;
      gap: 10px;
      max-width: min(420px, calc(100vw - 32px));
      position: fixed;
      right: 18px;
      z-index: 20;
    }

    .toast {
      background: var(--surface);
      border: 1px solid var(--line);
      border-left: 5px solid var(--ok);
      border-radius: 8px;
      box-shadow: var(--shadow);
      color: var(--text);
      font-weight: 800;
      line-height: 1.45;
      padding: 12px 14px;
    }

    .toast.warn {
      border-left-color: var(--danger);
    }

    .modal-backdrop {
      align-items: center;
      background: rgba(32, 35, 31, 0.42);
      display: flex;
      inset: 0;
      justify-content: center;
      padding: 18px;
      position: fixed;
      z-index: 15;
    }

    .note-modal {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: 0 24px 70px rgba(32, 38, 36, 0.2);
      max-height: calc(100vh - 36px);
      overflow: auto;
      padding: 18px;
      width: min(720px, 100%);
    }

    .modal-head {
      align-items: start;
      display: flex;
      gap: 12px;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .detail-grid {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .detail-item {
      border-top: 1px solid var(--line);
      display: grid;
      gap: 4px;
      padding-top: 10px;
    }

    .detail-item.full {
      grid-column: 1 / -1;
    }

    .detail-item span {
      color: var(--muted);
      font-size: 0.76rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .detail-item strong,
    .detail-item div {
      overflow-wrap: anywhere;
    }

    .content-box {
      background: var(--surface-soft);
      border: 1px solid var(--line);
      border-radius: 8px;
      line-height: 1.58;
      padding: 12px;
      white-space: pre-wrap;
    }

    @media (max-width: 920px) {
      .app-shell {
        grid-template-columns: 1fr;
      }

      .sidebar {
        min-height: auto;
      }

      .nav {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .nav-button {
        justify-content: center;
      }

      .nav-button span:last-child {
        display: none;
      }

      .sidebar-foot {
        display: flex;
        justify-content: space-between;
      }

      .stats,
      .two-col,
      .detail-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 560px) {
      .workspace,
      .sidebar {
        padding: 16px;
      }

      .topbar {
        display: grid;
      }

      .stats {
        grid-template-columns: 1fr;
      }

      .action-row,
      .toolbar,
      .model-row {
        display: grid;
      }
    }
  </style>
</head>
<body>
  <section id="login-screen" class="login-screen" hidden>
    <div class="login-card">
      <div class="login-brand">
        <div class="mark" aria-hidden="true">H</div>
        <div>
          <h1>${appName} Hub</h1>
          <p class="muted">${appUrl}</p>
        </div>
      </div>
      <form id="login-form" autocomplete="off">
        <label>Hermes token
          <input id="login-token" type="password" placeholder="HERMES_TOKEN" autocomplete="current-password">
        </label>
        <button id="login-button" type="submit">Login</button>
      </form>
      <div id="login-error" class="message warn" hidden></div>
    </div>
  </section>

  <div id="app" class="app-shell" hidden>
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="mark" aria-hidden="true">H</div>
        <div>
          <strong>${appName} Hub</strong>
          <small>${appUrl}</small>
        </div>
      </div>

      <nav class="nav" aria-label="Main navigation">
        <button class="nav-button" type="button" data-view="ask" aria-current="page"><span class="nav-icon">💬</span><span>Ask</span></button>
        <button class="nav-button" type="button" data-view="capture"><span class="nav-icon">✍️</span><span>Capture</span></button>
        <button class="nav-button" type="button" data-view="notes"><span class="nav-icon">🗒️</span><span>Notes</span></button>
        <button class="nav-button" type="button" data-view="settings"><span class="nav-icon">⚙️</span><span>Settings</span></button>
      </nav>

      <div class="sidebar-foot">
        <button id="logout" class="logout-button" type="button">🚪 Logout</button>
      </div>
    </aside>

    <main class="workspace">
      <div class="topbar">
        <div>
          <h1 id="view-title">Ask Notes</h1>
          <p id="view-subtitle" class="subtitle">Ask your private notes with the configured LLM.</p>
        </div>
        <div class="pill"><span class="dot" aria-hidden="true"></span><span id="service-status">Online</span></div>
      </div>

      <section class="stats" aria-label="Runtime summary">
        <div class="stat"><span>Environment</span><strong>${nodeEnv}</strong></div>
        <div class="stat"><span>Version</span><strong>${version}</strong></div>
        <div class="stat"><span>Notes</span><strong id="note-count">-</strong></div>
        <div class="stat"><span>Model</span><strong id="model-stat">-</strong></div>
      </section>

      <section id="view-ask" class="view">
        <div class="panel">
          <div class="panel-head">
            <div>
              <h2>Ask Notes</h2>
              <p id="llm-status">Checking LLM settings...</p>
            </div>
            <button class="secondary" type="button" data-view-jump="settings">Settings</button>
          </div>
          <div id="ask-notice" class="message" hidden></div>
          <form id="ask-form" autocomplete="off">
            <label>Question
              <input id="ask-question" name="question" placeholder="Apa catatan saya tentang deploy minggu ini?">
            </label>
            <div class="action-row">
              <button id="ask-button" type="submit">Ask</button>
            </div>
          </form>
          <div id="answer" class="answer" hidden></div>
          <div id="sources" class="sources" hidden></div>
        </div>
      </section>

      <section id="view-capture" class="view" hidden>
        <div class="panel">
          <div class="panel-head">
            <div>
              <h2>Capture</h2>
              <p>Save notes, links, work logs, and small decisions.</p>
            </div>
          </div>
          <form id="note-form" autocomplete="off">
            <div class="two-col">
              <label>Title
                <input id="note-title" name="title" maxlength="120" placeholder="Quick thought, link, or task">
              </label>
              <label>Tags
                <input id="note-tags" name="tags" placeholder="idea, project, dokploy">
              </label>
            </div>
            <label>Content
              <textarea id="note-content" name="content" required placeholder="Write the note here..."></textarea>
            </label>
            <label>Source
              <input id="note-source" name="source" placeholder="https://example.com or Telegram">
            </label>
            <div class="action-row">
              <button id="save-note" type="submit">Save Note</button>
              <button type="reset" class="secondary">Reset</button>
            </div>
          </form>
        </div>
      </section>

      <section id="view-notes" class="view" hidden>
        <div class="panel">
          <div class="panel-head">
            <div>
              <h2>Notes</h2>
              <p id="latest-note">Latest note: -</p>
            </div>
            <button id="refresh" type="button" class="secondary">Refresh</button>
          </div>
          <div class="toolbar">
            <label>Search
              <input id="search" type="search" placeholder="Search title, content, tags, source">
            </label>
          </div>
          <div id="notice" class="message" hidden></div>
          <div id="notes" class="notes" aria-live="polite"></div>
        </div>
      </section>

      <section id="view-settings" class="view" hidden>
        <div class="panel">
          <div class="panel-head">
            <div>
              <h2>LLM Settings</h2>
              <p>Provider, model, and API key are stored on the server volume.</p>
            </div>
          </div>
          <div id="settings-notice" class="message" hidden></div>
          <form id="settings-form" autocomplete="off">
            <div class="two-col">
              <label>Provider
                <select id="llm-provider" name="provider">
                  <option value="">No LLM</option>
                  <option value="openai-compatible">OpenAI-compatible</option>
                  <option value="anthropic">Anthropic-compatible</option>
                  <option value="ollama">Ollama</option>
                </select>
              </label>
              <label>Max context notes
                <input id="llm-max-context" name="maxContextNotes" type="number" min="1" step="1" value="6">
              </label>
            </div>
            <label>Base URL
              <input id="llm-base-url" name="baseUrl" placeholder="https://api.openai.com/v1">
            </label>
            <label>API key
              <span class="secret-field">
                <input id="llm-api-key" name="apiKey" type="password" placeholder="Leave blank to keep saved key">
                <button id="toggle-api-key" class="icon-button" type="button" aria-label="Show API key" title="Show API key">👁️</button>
              </span>
            </label>
            <label class="checkline">
              <input id="llm-clear-key" name="clearApiKey" type="checkbox">
              Clear saved API key
            </label>
            <div class="key-status" id="key-status">No API key saved.</div>
            <div class="model-row">
              <label>Model
                <input id="llm-model" name="model" list="model-list" placeholder="Type a model name">
                <datalist id="model-list"></datalist>
              </label>
              <button id="load-models" type="button" class="secondary">Load Models</button>
            </div>
            <select id="model-select" hidden aria-label="Loaded models"></select>
            <div class="action-row">
              <button id="save-settings" type="submit">Save Settings</button>
            </div>
          </form>
        </div>
      </section>
    </main>
  </div>

  <div id="toast-stack" class="toast-stack" aria-live="polite" aria-atomic="true"></div>

  <section id="note-modal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="note-modal-title" hidden>
    <div class="note-modal">
      <div class="modal-head">
        <div>
          <h2 id="note-modal-title">Note Detail</h2>
          <p id="note-modal-subtitle" class="subtitle">Full note information.</p>
        </div>
        <button id="close-note-modal" class="secondary" type="button">Close</button>
      </div>
      <div id="note-modal-body" class="detail-grid"></div>
    </div>
  </section>

  <script>
    const SESSION_KEY = 'hermesToken';
    const viewMeta = {
      ask: {
        title: 'Ask Notes',
        subtitle: 'Ask your private notes with the configured LLM.'
      },
      capture: {
        title: 'Capture',
        subtitle: 'Save useful context while it is still fresh.'
      },
      notes: {
        title: 'Notes',
        subtitle: 'Search and manage your second-brain memory.'
      },
      settings: {
        title: 'Settings',
        subtitle: 'Configure the LLM provider used by Ask Notes.'
      }
    };
    const providerHints = {
      'openai-compatible': {
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4.1-mini or provider/model-name'
      },
      anthropic: {
        baseUrl: 'https://api.anthropic.com/v1',
        model: 'claude-sonnet-4-20250514 or compatible model'
      },
      ollama: {
        baseUrl: 'https://ollama.com/api or http://host.docker.internal:11434/api',
        model: 'llama3.1 or gpt-oss:120b'
      }
    };
    const state = {
      authRequired: false,
      llmConfigured: false,
      notes: [],
      settings: null,
      token: readSessionToken(),
      view: 'ask'
    };
    const els = {
      answer: document.querySelector('#answer'),
      app: document.querySelector('#app'),
      askButton: document.querySelector('#ask-button'),
      askForm: document.querySelector('#ask-form'),
      askNotice: document.querySelector('#ask-notice'),
      askQuestion: document.querySelector('#ask-question'),
      closeNoteModal: document.querySelector('#close-note-modal'),
      keyStatus: document.querySelector('#key-status'),
      latestNote: document.querySelector('#latest-note'),
      llmApiKey: document.querySelector('#llm-api-key'),
      llmBaseUrl: document.querySelector('#llm-base-url'),
      llmClearKey: document.querySelector('#llm-clear-key'),
      llmMaxContext: document.querySelector('#llm-max-context'),
      llmModel: document.querySelector('#llm-model'),
      llmProvider: document.querySelector('#llm-provider'),
      llmStatus: document.querySelector('#llm-status'),
      loadModels: document.querySelector('#load-models'),
      loginButton: document.querySelector('#login-button'),
      loginError: document.querySelector('#login-error'),
      loginForm: document.querySelector('#login-form'),
      loginScreen: document.querySelector('#login-screen'),
      loginToken: document.querySelector('#login-token'),
      logout: document.querySelector('#logout'),
      modelList: document.querySelector('#model-list'),
      modelSelect: document.querySelector('#model-select'),
      modelStat: document.querySelector('#model-stat'),
      navButtons: document.querySelectorAll('[data-view]'),
      noteModal: document.querySelector('#note-modal'),
      noteModalBody: document.querySelector('#note-modal-body'),
      noteModalSubtitle: document.querySelector('#note-modal-subtitle'),
      noteModalTitle: document.querySelector('#note-modal-title'),
      noteCount: document.querySelector('#note-count'),
      noteForm: document.querySelector('#note-form'),
      notes: document.querySelector('#notes'),
      notice: document.querySelector('#notice'),
      refresh: document.querySelector('#refresh'),
      saveNote: document.querySelector('#save-note'),
      saveSettings: document.querySelector('#save-settings'),
      search: document.querySelector('#search'),
      serviceStatus: document.querySelector('#service-status'),
      settingsForm: document.querySelector('#settings-form'),
      settingsNotice: document.querySelector('#settings-notice'),
      sources: document.querySelector('#sources'),
      toastStack: document.querySelector('#toast-stack'),
      toggleApiKey: document.querySelector('#toggle-api-key'),
      viewSubtitle: document.querySelector('#view-subtitle'),
      viewTitle: document.querySelector('#view-title')
    };

    els.askForm.addEventListener('submit', askNotes);
    els.loginForm.addEventListener('submit', login);
    els.logout.addEventListener('click', logout);
    els.noteForm.addEventListener('submit', saveNote);
    els.refresh.addEventListener('click', refreshNotes);
    els.search.addEventListener('input', debounce(() => loadNotes(), 240));
    els.settingsForm.addEventListener('submit', saveSettings);
    els.loadModels.addEventListener('click', loadModels);
    els.llmProvider.addEventListener('change', updateProviderHints);
    els.toggleApiKey.addEventListener('click', toggleApiKeyVisibility);
    els.closeNoteModal.addEventListener('click', closeNoteModal);
    els.noteModal.addEventListener('click', (event) => {
      if (event.target === els.noteModal) {
        closeNoteModal();
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !els.noteModal.hidden) {
        closeNoteModal();
      }
    });
    els.modelSelect.addEventListener('change', () => {
      if (els.modelSelect.value) {
        els.llmModel.value = els.modelSelect.value;
      }
    });
    els.navButtons.forEach((button) => {
      button.addEventListener('click', () => setView(button.dataset.view));
    });
    document.querySelectorAll('[data-view-jump]').forEach((button) => {
      button.addEventListener('click', () => setView(button.dataset.viewJump));
    });

    boot();

    async function boot() {
      try {
        const info = await api('/api/info', {}, { allowNoToken: true });
        state.authRequired = Boolean(info.notesAuthRequired);

        if (state.authRequired) {
          if (!state.token) {
            showLogin();
            return;
          }

          try {
            await api('/api/session', {
              method: 'POST',
              body: JSON.stringify({})
            });
          } catch {
            clearSessionToken();
            state.token = '';
            showLogin();
            return;
          }
        }

        showApp();
        await refreshApp(info);
      } catch (error) {
        showLoginError(error.message);
      }
    }

    async function refreshApp(info) {
      renderInfo(info);
      await loadSettings();
      await loadNotes();
    }

    async function login(event) {
      event.preventDefault();

      state.token = els.loginToken.value.trim();
      els.loginButton.disabled = true;

      try {
        await api('/api/session', {
          method: 'POST',
          body: JSON.stringify({})
        });
        writeSessionToken(state.token);
        els.loginToken.value = '';
        showApp();
        await refreshApp(await api('/api/info'));
        showToast('Login berhasil.');
      } catch (error) {
        state.token = '';
        clearSessionToken();
        showLoginError(error.message || 'Login failed.');
        showToast(error.message || 'Login gagal.', true);
      } finally {
        els.loginButton.disabled = false;
      }
    }

    function logout() {
      state.token = '';
      clearSessionToken();
      state.notes = [];
      state.settings = null;
      renderNotes([]);

      if (state.authRequired) {
        showLogin();
        showToast('Logout berhasil.');
        return;
      }

      boot();
      showToast('Logout berhasil.');
    }

    function showLogin() {
      els.app.hidden = true;
      els.loginScreen.hidden = false;
      els.loginToken.focus();
    }

    function showApp() {
      els.loginScreen.hidden = true;
      els.app.hidden = false;
      setView(state.view);
    }

    async function loadSettings() {
      const response = await api('/api/settings');
      state.settings = response;
      fillSettingsForm(response.llm || {});
      renderLlmStatus(response.llm || {});
    }

    async function saveSettings(event) {
      event.preventDefault();
      els.saveSettings.disabled = true;

      try {
        const payload = {
          provider: els.llmProvider.value,
          baseUrl: els.llmBaseUrl.value,
          apiKey: els.llmApiKey.value,
          clearApiKey: els.llmClearKey.checked,
          model: els.llmModel.value,
          maxContextNotes: els.llmMaxContext.value
        };
        const response = await api('/api/settings/llm', {
          method: 'PUT',
          body: JSON.stringify(payload)
        });

        state.settings = response;
        els.llmApiKey.value = '';
        els.llmClearKey.checked = false;
        fillSettingsForm(response.llm || {});
        renderLlmStatus(response.llm || {});
        showSettingsNotice('Settings saved.', false);
        showToast('Settings berhasil disimpan.');
      } catch (error) {
        showSettingsNotice(error.message, true);
        showToast(error.message, true);
      } finally {
        els.saveSettings.disabled = false;
      }
    }

    async function loadModels() {
      els.loadModels.disabled = true;
      showSettingsNotice('Loading models...', false);

      try {
        const response = await api('/api/settings/llm/models', {
          method: 'POST',
          body: JSON.stringify({
            provider: els.llmProvider.value,
            baseUrl: els.llmBaseUrl.value,
            apiKey: els.llmApiKey.value,
            model: els.llmModel.value,
            maxContextNotes: els.llmMaxContext.value
          })
        });
        const models = response.models || [];

        if (!models.length) {
          showSettingsNotice('No models returned by provider.', true);
          showToast('Provider tidak mengembalikan model.', true);
          return;
        }

        els.modelList.innerHTML = models.map((model) => '<option value="' + escapeHtml(model) + '"></option>').join('');
        els.modelSelect.innerHTML = '<option value="">Select a loaded model</option>' +
          models.map((model) => '<option value="' + escapeHtml(model) + '">' + escapeHtml(model) + '</option>').join('');
        els.modelSelect.hidden = false;
        showSettingsNotice(models.length + ' models loaded.', false);
        showToast(models.length + ' models berhasil dimuat.');
      } catch (error) {
        showSettingsNotice(error.message, true);
        showToast(error.message, true);
      } finally {
        els.loadModels.disabled = false;
      }
    }

    async function refreshNotes() {
      els.refresh.disabled = true;

      try {
        await loadNotes();
        showNotice('Notes refreshed.', false);
        showToast('Notes berhasil direfresh.');
      } catch (error) {
        showNotice(error.message, true);
        showToast(error.message, true);
      } finally {
        els.refresh.disabled = false;
      }
    }

    async function loadNotes() {
      const query = els.search.value.trim();
      const response = await api('/api/notes' + (query ? '?query=' + encodeURIComponent(query) : ''));
      state.notes = response.notes || [];
      els.noteCount.textContent = response.stats?.noteCount ?? state.notes.length;
      els.latestNote.textContent = 'Latest note: ' + (response.stats?.latestNoteAt ? formatDate(response.stats.latestNoteAt) : '-');
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
        showNotice('Note saved.', false);
        showToast('Note berhasil disimpan.');
        await loadNotes();
        setView('notes');
      } catch (error) {
        showNotice(error.message, true);
        showToast(error.message, true);
      } finally {
        els.saveNote.disabled = false;
      }
    }

    async function askNotes(event) {
      event.preventDefault();

      const question = els.askQuestion.value.trim();

      if (!question) {
        showAskNotice('Question is required.', true);
        showToast('Question is required.', true);
        return;
      }

      if (!state.llmConfigured) {
        showAskNotice('LLM is not configured yet.', true);
        showToast('LLM belum dikonfigurasi.', true);
        setView('settings');
        return;
      }

      els.askButton.disabled = true;
      els.answer.hidden = false;
      els.answer.textContent = 'Thinking...';
      els.sources.hidden = true;
      els.sources.innerHTML = '';

      try {
        const response = await api('/api/ask', {
          method: 'POST',
          body: JSON.stringify({ question })
        });
        els.askNotice.hidden = true;
        els.answer.textContent = response.answer || 'No answer returned.';
        renderSources(response.sources || []);
        showToast('Jawaban sudah siap.');
      } catch (error) {
        els.answer.hidden = true;
        showAskNotice(error.message, true);
        showToast(error.message, true);
      } finally {
        els.askButton.disabled = false;
      }
    }

    async function deleteNote(id) {
      await api('/api/notes/' + encodeURIComponent(id), { method: 'DELETE' });
      showNotice('Note deleted.', false);
      showToast('Note berhasil dihapus.');
      await loadNotes();
    }

    async function api(path, options = {}, flags = {}) {
      const headers = {
        Accept: 'application/json',
        ...(options.headers || {})
      };

      if (options.body) {
        headers['Content-Type'] = 'application/json';
      }

      if (state.token && !flags.allowNoToken) {
        headers.Authorization = 'Bearer ' + state.token;
      }

      const response = await fetch(path, { ...options, headers });
      const text = await response.text();
      const body = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(body.message || body.error || 'Request failed.');
      }

      return body;
    }

    function setView(view) {
      state.view = viewMeta[view] ? view : 'ask';

      Object.keys(viewMeta).forEach((name) => {
        document.querySelector('#view-' + name).hidden = name !== state.view;
      });
      els.navButtons.forEach((button) => {
        button.setAttribute('aria-current', button.dataset.view === state.view ? 'page' : 'false');
      });
      els.viewTitle.textContent = viewMeta[state.view].title;
      els.viewSubtitle.textContent = viewMeta[state.view].subtitle;
    }

    function renderInfo(info) {
      els.serviceStatus.textContent = 'Online';
      els.noteCount.textContent = info.stats?.noteCount ?? '-';
      els.modelStat.textContent = info.llm?.model || '-';
    }

    function fillSettingsForm(llm) {
      els.llmProvider.value = llm.provider || '';
      els.llmBaseUrl.value = llm.baseUrl || '';
      els.llmApiKey.value = llm.apiKey || '';
      els.llmModel.value = llm.model || '';
      els.llmMaxContext.value = llm.maxContextNotes || 6;
      els.keyStatus.textContent = llm.hasApiKey ? 'API key saved on server.' : 'No API key saved.';
      updateProviderHints();
    }

    function updateProviderHints() {
      const hint = providerHints[els.llmProvider.value] || {
        baseUrl: 'https://provider.example/v1',
        model: 'model-name'
      };

      els.llmBaseUrl.placeholder = hint.baseUrl;
      els.llmModel.placeholder = hint.model;
    }

    function renderLlmStatus(llm) {
      state.llmConfigured = Boolean(llm.configured);
      els.modelStat.textContent = llm.model || '-';

      if (llm.configured) {
        els.llmStatus.textContent = 'Ready: ' + llm.provider + ' / ' + llm.model;
        els.askButton.disabled = false;
        return;
      }

      els.llmStatus.textContent = 'LLM is not configured yet.';
      els.askButton.disabled = true;
    }

    function renderSources(sources) {
      if (!sources.length) {
        els.sources.hidden = true;
        els.sources.innerHTML = '';
        return;
      }

      els.sources.hidden = false;
      els.sources.innerHTML = sources
        .map((source) => '<span class="source-pill">' + escapeHtml(source.title || source.id) + '</span>')
        .join('');
    }

    function renderNotes(notes) {
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
              (tags.length ? '<div class="tags">' + tags.map((tag) => '<span class="tag">' + escapeHtml(tag) + '</span>').join('') + '</div>' : '<p class="muted">No tags</p>') +
            '</div>' +
            '<div class="note-actions">' +
              '<button type="button" class="secondary" data-view-note="' + escapeHtml(note.id) + '">View</button>' +
              '<button type="button" class="danger" data-delete="' + escapeHtml(note.id) + '">Delete</button>' +
            '</div>' +
          '</div>' +
        '</article>';
      }).join('');

      els.notes.querySelectorAll('[data-view-note]').forEach((button) => {
        button.addEventListener('click', () => openNoteModal(button.dataset.viewNote));
      });

      els.notes.querySelectorAll('[data-delete]').forEach((button) => {
        button.addEventListener('click', () => {
          deleteNote(button.dataset.delete).catch((error) => {
            showNotice(error.message, true);
            showToast(error.message, true);
          });
        });
      });
    }

    function openNoteModal(id) {
      const note = state.notes.find((item) => item.id === id);

      if (!note) {
        showToast('Note tidak ditemukan.', true);
        return;
      }

      const tags = Array.isArray(note.tags) ? note.tags : [];
      els.noteModalTitle.textContent = note.title || 'Untitled note';
      els.noteModalSubtitle.textContent = note.source || 'Full note information.';
      els.noteModalBody.innerHTML =
        '<div class="detail-item">' +
          '<span>ID</span>' +
          '<strong>' + escapeHtml(note.id) + '</strong>' +
        '</div>' +
        '<div class="detail-item">' +
          '<span>Source</span>' +
          '<strong>' + escapeHtml(note.source || '-') + '</strong>' +
        '</div>' +
        '<div class="detail-item">' +
          '<span>Created</span>' +
          '<strong>' + escapeHtml(formatDate(note.createdAt)) + '</strong>' +
        '</div>' +
        '<div class="detail-item">' +
          '<span>Updated</span>' +
          '<strong>' + escapeHtml(formatDate(note.updatedAt)) + '</strong>' +
        '</div>' +
        '<div class="detail-item full">' +
          '<span>Tags</span>' +
          '<div class="tags">' + (tags.length ? tags.map((tag) => '<span class="tag">' + escapeHtml(tag) + '</span>').join('') : '<span class="muted">No tags</span>') + '</div>' +
        '</div>' +
        '<div class="detail-item full">' +
          '<span>Content</span>' +
          '<div class="content-box">' + escapeHtml(note.content || '-') + '</div>' +
        '</div>';
      els.noteModal.hidden = false;
    }

    function closeNoteModal() {
      els.noteModal.hidden = true;
      els.noteModalBody.innerHTML = '';
    }

    function showNotice(message, isError) {
      els.notice.textContent = message;
      els.notice.hidden = false;
      els.notice.classList.toggle('warn', Boolean(isError));
      els.notice.classList.toggle('ok', !isError);

      if (!isError) {
        setTimeout(() => {
          els.notice.hidden = true;
        }, 2400);
      }
    }

    function showAskNotice(message, isError) {
      els.askNotice.textContent = message;
      els.askNotice.hidden = false;
      els.askNotice.classList.toggle('warn', Boolean(isError));
      els.askNotice.classList.toggle('ok', !isError);
    }

    function showSettingsNotice(message, isError) {
      els.settingsNotice.textContent = message;
      els.settingsNotice.hidden = false;
      els.settingsNotice.classList.toggle('warn', Boolean(isError));
      els.settingsNotice.classList.toggle('ok', !isError);
    }

    function showLoginError(message) {
      els.loginError.textContent = message;
      els.loginError.hidden = false;
    }

    function toggleApiKeyVisibility() {
      const isHidden = els.llmApiKey.type === 'password';
      els.llmApiKey.type = isHidden ? 'text' : 'password';
      els.toggleApiKey.textContent = isHidden ? '🔒' : '👁️';
      els.toggleApiKey.setAttribute('aria-label', isHidden ? 'Hide API key' : 'Show API key');
      els.toggleApiKey.setAttribute('title', isHidden ? 'Hide API key' : 'Show API key');
    }

    function showToast(message, isError = false) {
      const toast = document.createElement('div');
      toast.className = 'toast' + (isError ? ' warn' : '');
      toast.textContent = message;
      els.toastStack.append(toast);

      setTimeout(() => {
        toast.remove();
      }, 3200);
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

    function readSessionToken() {
      try {
        return sessionStorage.getItem(SESSION_KEY) || '';
      } catch {
        return '';
      }
    }

    function writeSessionToken(token) {
      try {
        sessionStorage.setItem(SESSION_KEY, token);
      } catch {
        state.token = token;
      }
    }

    function clearSessionToken() {
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch {
        return;
      }
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
