import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

const DEFAULT_PORT = 3000;

export function resolveConfig(env = process.env) {
  return {
    appName: env.APP_NAME || 'Hermes',
    appUrl: env.APP_URL || `http://localhost:${env.PORT || DEFAULT_PORT}`,
    logLevel: env.LOG_LEVEL || 'info',
    nodeEnv: env.NODE_ENV || 'development',
    port: parsePort(env.PORT),
    trustProxy: parseBoolean(env.TRUST_PROXY, true),
    version: env.npm_package_version || '0.1.0'
  };
}

export function createHermesServer(options = {}) {
  const config = { ...resolveConfig(), ...options };

  return createServer((request, response) => {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    const method = request.method || 'GET';

    setBaseHeaders(response);

    if (method !== 'GET' && method !== 'HEAD') {
      response.setHeader('Allow', 'GET, HEAD');
      return sendJson(response, 405, { error: 'method_not_allowed' }, method);
    }

    if (url.pathname === '/health' || url.pathname === '/ready') {
      return sendJson(response, 200, healthPayload(config), method);
    }

    if (url.pathname === '/api/info') {
      return sendJson(response, 200, infoPayload(config, request), method);
    }

    if (url.pathname === '/favicon.ico') {
      response.statusCode = 204;
      return response.end();
    }

    if (url.pathname === '/') {
      return sendHtml(response, 200, renderHome(config), method);
    }

    return sendJson(response, 404, { error: 'not_found' }, method);
  });
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

function setBaseHeaders(response) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'"
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

function infoPayload(config, request) {
  return {
    service: config.appName,
    environment: config.nodeEnv,
    url: config.appUrl,
    clientIp: getClientIp(config, request)
  };
}

function getClientIp(config, request) {
  if (config.trustProxy && request.headers['x-forwarded-for']) {
    return String(request.headers['x-forwarded-for']).split(',')[0].trim();
  }

  return request.socket.remoteAddress || null;
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
