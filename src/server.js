import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';

import { renderDashboard } from './dashboard-app.js';
import { answerFromNotes, isLlmConfigured, loadLlmModels, resolveLlmConfig } from './llm.js';
import { createNoteStore } from './storage.js';

const DEFAULT_PORT = 3000;

export function resolveConfig(env = process.env) {
  return {
    appName: env.APP_NAME || 'Hermes',
    appUrl: env.APP_URL || `http://localhost:${env.PORT || DEFAULT_PORT}`,
    authToken: env.HERMES_TOKEN || '',
    dataDir: env.DATA_DIR || 'data',
    llm: resolveLlmConfig(env),
    logLevel: env.LOG_LEVEL || 'info',
    nodeEnv: env.NODE_ENV || 'development',
    port: parsePort(env.PORT),
    trustProxy: parseBoolean(env.TRUST_PROXY, true),
    version: env.npm_package_version || '0.1.0'
  };
}

export function createHermesServer(options = {}) {
  const { fetchImpl = fetch, noteStore, ...overrides } = options;
  const config = { ...resolveConfig(), ...overrides };
  const store = noteStore || createNoteStore({ dataDir: config.dataDir });
  const dependencies = { fetchImpl };

  return createServer((request, response) => {
    routeRequest(request, response, config, store, dependencies).catch((error) => {
      const statusCode = error.statusCode || 500;
      sendJson(response, statusCode, {
        error: error.code || 'internal_error',
        message: statusCode === 500 ? 'Internal server error.' : error.message
      });
    });
  });
}

async function routeRequest(request, response, config, store, dependencies) {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    const method = request.method || 'GET';

    setBaseHeaders(response);

    if (url.pathname === '/health' || url.pathname === '/ready') {
      if (!allowsMethod(method, ['GET', 'HEAD'])) {
        return methodNotAllowed(response, ['GET', 'HEAD'], method);
      }

      return sendJson(response, 200, healthPayload(config), method);
    }

    if (url.pathname === '/api/info') {
      if (!allowsMethod(method, ['GET', 'HEAD'])) {
        return methodNotAllowed(response, ['GET', 'HEAD'], method);
      }

      return sendJson(response, 200, await infoPayload(config, request, store), method);
    }

    if (url.pathname === '/api/session') {
      return handleSession(request, response, method, config);
    }

    if (url.pathname === '/api/settings') {
      return handleSettings(request, response, method, config, store);
    }

    if (url.pathname === '/api/settings/llm') {
      return handleLlmSettings(request, response, method, config, store);
    }

    if (url.pathname === '/api/settings/llm/models') {
      return handleLlmModels(request, response, method, config, store, dependencies);
    }

    if (url.pathname === '/api/notes') {
      return handleNotesCollection(request, response, method, url, config, store);
    }

    if (url.pathname.startsWith('/api/notes/')) {
      return handleNotesItem(request, response, method, url, config, store);
    }

    if (url.pathname === '/api/ask') {
      return handleAsk(request, response, method, config, store, dependencies);
    }

    if (url.pathname === '/favicon.ico') {
      response.statusCode = 204;
      return response.end();
    }

    if (url.pathname === '/') {
      if (!allowsMethod(method, ['GET', 'HEAD'])) {
        return methodNotAllowed(response, ['GET', 'HEAD'], method);
      }

      return sendHtml(response, 200, renderDashboard(config), method);
    }

    return sendJson(response, 404, { error: 'not_found' }, method);
}

function parsePort(value) {
  const port = Number.parseInt(value || DEFAULT_PORT, 10);

  if (Number.isNaN(port) || port < 1 || port > 65535) {
    return DEFAULT_PORT;
  }

  return port;
}

function parseBoolean(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function allowsMethod(method, allowedMethods) {
  return allowedMethods.includes(method);
}

function methodNotAllowed(response, allowedMethods, method = 'GET') {
  response.setHeader('Allow', allowedMethods.join(', '));
  return sendJson(response, 405, { error: 'method_not_allowed' }, method);
}

function setBaseHeaders(response) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"
  );
}

function sendJson(response, statusCode, payload, method = 'GET') {
  const body = JSON.stringify(payload);
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Content-Length', Buffer.byteLength(body));

  if (method === 'HEAD') {
    return response.end();
  }

  return response.end(body);
}

function sendHtml(response, statusCode, html, method = 'GET') {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.setHeader('Content-Length', Buffer.byteLength(html));

  if (method === 'HEAD') {
    return response.end();
  }

  return response.end(html);
}

function healthPayload(config) {
  return {
    status: 'ok',
    service: config.appName,
    version: config.version,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  };
}

async function infoPayload(config, request, store) {
  const stats = await store.stats();
  const llm = await getEffectiveLlmConfig(config, store);

  return {
    service: config.appName,
    environment: config.nodeEnv,
    url: config.appUrl,
    llm: {
      configured: isLlmConfigured(llm),
      provider: llm.provider || null,
      model: llm.model || null
    },
    notesAuthRequired: Boolean(config.authToken),
    stats,
    clientIp: getClientIp(config, request)
  };
}

function getClientIp(config, request) {
  if (config.trustProxy && request.headers['x-forwarded-for']) {
    return String(request.headers['x-forwarded-for']).split(',')[0].trim();
  }

  return request.socket.remoteAddress || null;
}

async function handleNotesCollection(request, response, method, url, config, store) {
  if (!allowsMethod(method, ['GET', 'HEAD', 'POST'])) {
    return methodNotAllowed(response, ['GET', 'HEAD', 'POST'], method);
  }

  if (!isAuthorized(config, request)) {
    return unauthorized(response, method);
  }

  if (method === 'POST') {
    const payload = await readRequestJson(request);
    const note = await store.createNote(payload);
    return sendJson(response, 201, { note }, method);
  }

  const query = url.searchParams.get('query') || '';
  const notes = await store.listNotes({ query });
  const stats = await store.stats();

  return sendJson(response, 200, { notes, stats }, method);
}

async function handleNotesItem(request, response, method, url, config, store) {
  if (!allowsMethod(method, ['DELETE'])) {
    return methodNotAllowed(response, ['DELETE'], method);
  }

  if (!isAuthorized(config, request)) {
    return unauthorized(response, method);
  }

  const id = decodeURIComponent(url.pathname.slice('/api/notes/'.length));

  if (!id) {
    return sendJson(response, 400, { error: 'invalid_note_id' }, method);
  }

  const deleted = await store.deleteNote(id);

  if (!deleted) {
    return sendJson(response, 404, { error: 'note_not_found' }, method);
  }

  response.statusCode = 204;
  return response.end();
}

async function handleSession(request, response, method, config) {
  if (!allowsMethod(method, ['POST'])) {
    return methodNotAllowed(response, ['POST'], method);
  }

  if (!isAuthorized(config, request)) {
    return unauthorized(response, method);
  }

  return sendJson(response, 200, {
    ok: true,
    authRequired: Boolean(config.authToken)
  }, method);
}

async function handleSettings(request, response, method, config, store) {
  if (!allowsMethod(method, ['GET', 'HEAD'])) {
    return methodNotAllowed(response, ['GET', 'HEAD'], method);
  }

  if (!isAuthorized(config, request)) {
    return unauthorized(response, method);
  }

  return sendJson(response, 200, await settingsPayload(config, store), method);
}

async function handleLlmSettings(request, response, method, config, store) {
  if (!allowsMethod(method, ['PUT'])) {
    return methodNotAllowed(response, ['PUT'], method);
  }

  if (!isAuthorized(config, request)) {
    return unauthorized(response, method);
  }

  const payload = await readRequestJson(request);

  await store.updateLlmSettings(payload);

  return sendJson(response, 200, await settingsPayload(config, store), method);
}

async function handleLlmModels(request, response, method, config, store, dependencies) {
  if (!allowsMethod(method, ['POST'])) {
    return methodNotAllowed(response, ['POST'], method);
  }

  if (!isAuthorized(config, request)) {
    return unauthorized(response, method);
  }

  const payload = await readRequestJson(request);
  const llm = await getEffectiveLlmConfig(config, store, payload);
  const models = await loadLlmModels({
    config: llm,
    fetchImpl: dependencies.fetchImpl
  });

  return sendJson(response, 200, { models }, method);
}

async function handleAsk(request, response, method, config, store, dependencies) {
  if (!allowsMethod(method, ['POST'])) {
    return methodNotAllowed(response, ['POST'], method);
  }

  if (!isAuthorized(config, request)) {
    return unauthorized(response, method);
  }

  const payload = await readRequestJson(request);
  const notes = await store.listNotes();
  const llm = await getEffectiveLlmConfig(config, store);
  const answer = await answerFromNotes({
    question: payload.question,
    notes,
    config: llm,
    fetchImpl: dependencies.fetchImpl
  });

  return sendJson(response, 200, answer, method);
}

async function settingsPayload(config, store) {
  const settings = await store.readSettings();
  const llm = await getEffectiveLlmConfig(config, store);
  const savedLlm = getSavedLlmSettings(settings);

  return {
    llm: {
      provider: llm.provider || '',
      baseUrl: llm.baseUrl || '',
      model: llm.model || '',
      maxContextNotes: llm.maxContextNotes,
      apiKey: llm.apiKey || '',
      configured: isLlmConfigured(llm),
      hasApiKey: Boolean(llm.apiKey),
      saved: Boolean(settings.llm),
      savedHasApiKey: Boolean(savedLlm.apiKey)
    }
  };
}

async function getEffectiveLlmConfig(config, store, overrides = {}) {
  const settings = await store.readSettings();
  const savedLlm = getSavedLlmSettings(settings);
  const llm = {
    ...savedLlm,
    ...normaliseLlmOverrides(overrides)
  };

  return resolveLlmConfig({
    LLM_PROVIDER: readLlmField(llm, 'provider', config.llm.provider),
    LLM_API_KEY: readLlmField(llm, 'apiKey', config.llm.apiKey),
    LLM_BASE_URL: readLlmField(llm, 'baseUrl', config.llm.baseUrl),
    LLM_MODEL: readLlmField(llm, 'model', config.llm.model),
    LLM_MAX_CONTEXT_NOTES: String(readLlmField(llm, 'maxContextNotes', config.llm.maxContextNotes))
  });
}

function getSavedLlmSettings(settings) {
  return settings.llm && typeof settings.llm === 'object' ? settings.llm : {};
}

function normaliseLlmOverrides(input = {}) {
  const overrides = {};

  for (const key of ['provider', 'apiKey', 'baseUrl', 'model', 'maxContextNotes']) {
    if (Object.prototype.hasOwnProperty.call(input, key) && input[key] !== '') {
      overrides[key] = input[key];
    }
  }

  return overrides;
}

function readLlmField(settings, key, fallback) {
  if (Object.prototype.hasOwnProperty.call(settings, key)) {
    return settings[key];
  }

  return fallback;
}

function isAuthorized(config, request) {
  if (!config.authToken) {
    return true;
  }

  const headerToken = request.headers['x-hermes-token'];
  const authHeader = request.headers.authorization || '';
  const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice('bearer '.length).trim()
    : '';
  const token = String(headerToken || bearerToken || '');

  return safeEqual(token, config.authToken);
}

function safeEqual(left, right) {
  if (!left || !right) {
    return false;
  }

  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function unauthorized(response, method = 'GET') {
  response.setHeader('WWW-Authenticate', 'Bearer realm="Hermes"');
  return sendJson(response, 401, { error: 'unauthorized' }, method);
}

async function readRequestJson(request, maxBytes = 1024 * 1024) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    totalBytes += chunk.length;

    if (totalBytes > maxBytes) {
      const error = new Error('Request body is too large.');
      error.statusCode = 413;
      error.code = 'payload_too_large';
      throw error;
    }

    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks).toString('utf8').trim();

  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    const error = new Error('Request body must be valid JSON.');
    error.statusCode = 400;
    error.code = 'invalid_json';
    throw error;
  }
}

function renderHome(config) {
  const appName = escapeHtml(config.appName);
  const appUrl = escapeHtml(config.appUrl);
  const nodeEnv = escapeHtml(config.nodeEnv);
  const version = escapeHtml(config.version);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${appName}</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #f7f8fb;
      --panel: #ffffff;
      --text: #172033;
      --muted: #607089;
      --line: #dce2ea;
      --accent: #176f78;
      --accent-strong: #0d4d54;
      --ok: #12805c;
      --warn: #a35c00;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    body {
      min-height: 100vh;
      margin: 0;
      background:
        radial-gradient(circle at 18% 18%, rgba(23, 111, 120, 0.13), transparent 28rem),
        linear-gradient(135deg, #f7f8fb 0%, #eef4f4 48%, #f6f2eb 100%);
      color: var(--text);
      display: grid;
      place-items: center;
      padding: 32px;
    }

    main {
      width: min(960px, 100%);
      display: grid;
      grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
      gap: 24px;
      align-items: stretch;
    }

    section,
    aside {
      background: color-mix(in srgb, var(--panel) 90%, transparent);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: 0 24px 70px rgba(23, 32, 51, 0.08);
    }

    section {
      padding: clamp(28px, 5vw, 52px);
    }

    aside {
      padding: 24px;
      display: grid;
      gap: 16px;
    }

    .mark {
      width: 54px;
      aspect-ratio: 1;
      border-radius: 8px;
      background: linear-gradient(135deg, var(--accent), #e2aa4f);
      display: grid;
      place-items: center;
      color: white;
      font-weight: 800;
      font-size: 1.35rem;
      margin-bottom: 32px;
    }

    h1 {
      margin: 0;
      font-size: clamp(2.4rem, 7vw, 4.8rem);
      line-height: 0.95;
      letter-spacing: 0;
    }

    p {
      margin: 18px 0 0;
      color: var(--muted);
      font-size: 1.05rem;
      line-height: 1.7;
      max-width: 58ch;
    }

    a {
      color: var(--accent-strong);
      font-weight: 700;
      text-decoration-thickness: 0.08em;
      text-underline-offset: 0.24em;
    }

    .status {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 800;
      color: var(--ok);
    }

    .dot {
      width: 12px;
      aspect-ratio: 1;
      border-radius: 999px;
      background: var(--ok);
      box-shadow: 0 0 0 6px rgba(18, 128, 92, 0.12);
      flex: 0 0 auto;
    }

    dl {
      margin: 0;
      display: grid;
      gap: 14px;
    }

    div.row {
      display: grid;
      gap: 4px;
      padding-top: 14px;
      border-top: 1px solid var(--line);
    }

    dt {
      color: var(--muted);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }

    dd {
      margin: 0;
      overflow-wrap: anywhere;
      font-weight: 700;
    }

    @media (max-width: 760px) {
      body {
        padding: 20px;
        place-items: start center;
      }

      main {
        grid-template-columns: 1fr;
      }
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #121720;
        --panel: #172033;
        --text: #f4f7fb;
        --muted: #abb7c8;
        --line: #2d394b;
        --accent: #30a9b5;
        --accent-strong: #8cdde5;
        --ok: #4bd29c;
        --warn: #e7b25e;
      }

      body {
        background:
          radial-gradient(circle at 18% 18%, rgba(48, 169, 181, 0.18), transparent 28rem),
          linear-gradient(135deg, #10151e 0%, #172033 58%, #241d18 100%);
      }

      section,
      aside {
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
      }
    }
  </style>
</head>
<body>
  <main>
    <section aria-labelledby="title">
      <div class="mark" aria-hidden="true">H</div>
      <h1 id="title">${appName}</h1>
      <p>Service is running and ready to deploy through Docker Compose or Dokploy. Use <a href="/health">/health</a> for health checks and <a href="/api/info">/api/info</a> for runtime metadata.</p>
    </section>
    <aside aria-label="Runtime status">
      <div class="status"><span class="dot" aria-hidden="true"></span>Online</div>
      <dl>
        <div class="row">
          <dt>Environment</dt>
          <dd>${nodeEnv}</dd>
        </div>
        <div class="row">
          <dt>Version</dt>
          <dd>${version}</dd>
        </div>
        <div class="row">
          <dt>Configured URL</dt>
          <dd>${appUrl}</dd>
        </div>
      </dl>
    </aside>
  </main>
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const config = resolveConfig();
  const server = createHermesServer(config);

  server.listen(config.port, '0.0.0.0', () => {
    console.log(`${config.appName} listening on port ${config.port}`);
  });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      server.close(() => {
        console.log(`${config.appName} stopped`);
        process.exit(0);
      });
    });
  }
}
