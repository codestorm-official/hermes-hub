import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { answerFromNotes, resolveLlmConfig } from '../src/llm.js';
import { createHermesServer, resolveConfig } from '../src/server.js';

test('resolveConfig applies defaults and parses booleans', () => {
  const config = resolveConfig({
    APP_NAME: 'Hermes Test',
    PORT: '8080',
    TRUST_PROXY: 'false'
  });

  assert.equal(config.appName, 'Hermes Test');
  assert.equal(config.port, 8080);
  assert.equal(config.trustProxy, false);
});

test('health endpoint returns ok payload', async (t) => {
  const { baseUrl, close } = await startServer({ appName: 'Hermes Test', version: 'test' });
  t.after(close);

  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'Hermes Test');
  assert.equal(body.version, 'test');
});

test('home page renders configured service name', async (t) => {
  const { baseUrl, close } = await startServer({ appName: 'Hermes Test' });
  t.after(close);

  const response = await fetch(baseUrl);
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(body, /Hermes Test Hub/);
});

test('notes api requires token when configured', async (t) => {
  const dataDir = await createTempDataDir(t);
  const { baseUrl, close } = await startServer({ authToken: 'secret', dataDir });
  t.after(close);

  const unauthorized = await fetch(`${baseUrl}/api/notes`);
  const authorized = await fetch(`${baseUrl}/api/notes`, {
    headers: {
      Authorization: 'Bearer secret'
    }
  });

  assert.equal(unauthorized.status, 401);
  assert.deepEqual(await unauthorized.json(), { error: 'unauthorized' });
  assert.equal(authorized.status, 200);
  assert.deepEqual(await authorized.json(), {
    notes: [],
    stats: {
      noteCount: 0,
      latestNoteAt: null
    }
  });
});

test('session and settings api require token when configured', async (t) => {
  const dataDir = await createTempDataDir(t);
  const { baseUrl, close } = await startServer({ authToken: 'secret', dataDir });
  t.after(close);

  const unauthorizedSession = await fetch(`${baseUrl}/api/session`, {
    method: 'POST',
    body: JSON.stringify({})
  });
  const unauthorizedSettings = await fetch(`${baseUrl}/api/settings`);
  const authorizedSession = await fetch(`${baseUrl}/api/session`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer secret'
    },
    body: JSON.stringify({})
  });
  const authorizedSettings = await fetch(`${baseUrl}/api/settings`, {
    headers: {
      Authorization: 'Bearer secret'
    }
  });
  const settingsBody = await authorizedSettings.json();

  assert.equal(unauthorizedSession.status, 401);
  assert.equal(unauthorizedSettings.status, 401);
  assert.equal(authorizedSession.status, 200);
  assert.deepEqual(await authorizedSession.json(), { ok: true, authRequired: true });
  assert.equal(authorizedSettings.status, 200);
  assert.equal(settingsBody.llm.configured, false);
  assert.equal(settingsBody.llm.hasApiKey, false);
});

test('notes api creates, searches, and deletes notes', async (t) => {
  const dataDir = await createTempDataDir(t);
  const { baseUrl, close } = await startServer({ dataDir });
  t.after(close);

  const created = await fetch(`${baseUrl}/api/notes`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Dokploy checklist',
      content: 'Route domain to internal port 3000.',
      tags: 'deploy, hermes',
      source: 'manual'
    })
  });
  const createBody = await created.json();

  assert.equal(created.status, 201);
  assert.equal(createBody.note.title, 'Dokploy checklist');
  assert.deepEqual(createBody.note.tags, ['deploy', 'hermes']);

  const search = await fetch(`${baseUrl}/api/notes?query=dokploy`);
  const searchBody = await search.json();

  assert.equal(search.status, 200);
  assert.equal(searchBody.notes.length, 1);
  assert.equal(searchBody.stats.noteCount, 1);

  const deleted = await fetch(`${baseUrl}/api/notes/${createBody.note.id}`, {
    method: 'DELETE'
  });
  const listAfterDelete = await fetch(`${baseUrl}/api/notes`);
  const listAfterDeleteBody = await listAfterDelete.json();

  assert.equal(deleted.status, 204);
  assert.equal(listAfterDeleteBody.notes.length, 0);
  assert.equal(listAfterDeleteBody.stats.noteCount, 0);
});

test('ask endpoint reports missing llm configuration', async (t) => {
  const dataDir = await createTempDataDir(t);
  const { baseUrl, close } = await startServer({ dataDir });
  t.after(close);

  const response = await fetch(`${baseUrl}/api/ask`, {
    method: 'POST',
    body: JSON.stringify({ question: 'What do my notes say about Dokploy?' })
  });
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.error, 'llm_not_configured');
});

test('llm settings api saves provider config and ask uses it', async (t) => {
  const dataDir = await createTempDataDir(t);
  const calls = [];
  const { baseUrl, close } = await startServer({
    dataDir,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });

      return new Response(JSON.stringify({
        choices: [
          {
            message: {
              content: 'Dokploy routes to internal port 3000.'
            }
          }
        ]
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  });
  t.after(close);

  await fetch(`${baseUrl}/api/notes`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Dokploy route',
      content: 'Route the Dokploy domain to internal port 3000.',
      tags: 'deploy',
      source: 'manual'
    })
  });

  const settings = await fetch(`${baseUrl}/api/settings/llm`, {
    method: 'PUT',
    body: JSON.stringify({
      provider: 'openai-compatible',
      apiKey: 'test-key',
      baseUrl: 'https://llm.example.com/v1',
      model: 'test-model',
      maxContextNotes: 4
    })
  });
  const settingsBody = await settings.json();

  assert.equal(settings.status, 200);
  assert.equal(settingsBody.llm.configured, true);
  assert.equal(settingsBody.llm.hasApiKey, true);
  assert.equal(Object.hasOwn(settingsBody.llm, 'apiKey'), false);

  const asked = await fetch(`${baseUrl}/api/ask`, {
    method: 'POST',
    body: JSON.stringify({
      question: 'How is Dokploy routed?'
    })
  });
  const askedBody = await asked.json();

  assert.equal(asked.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://llm.example.com/v1/chat/completions');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-key');
  assert.equal(askedBody.answer, 'Dokploy routes to internal port 3000.');
});

test('llm model loader returns openai-compatible model ids', async (t) => {
  const dataDir = await createTempDataDir(t);
  const calls = [];
  const { baseUrl, close } = await startServer({
    dataDir,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });

      return new Response(JSON.stringify({
        data: [
          { id: 'zeta-model' },
          { id: 'alpha-model' },
          { id: 'alpha-model' }
        ]
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  });
  t.after(close);

  const response = await fetch(`${baseUrl}/api/settings/llm/models`, {
    method: 'POST',
    body: JSON.stringify({
      provider: 'openai-compatible',
      apiKey: 'test-key',
      baseUrl: 'https://llm.example.com/v1'
    })
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://llm.example.com/v1/models');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-key');
  assert.deepEqual(body.models, ['alpha-model', 'zeta-model']);
});

test('answerFromNotes sends matching notes to an openai-compatible llm', async () => {
  const config = resolveLlmConfig({
    LLM_PROVIDER: 'openai-compatible',
    LLM_API_KEY: 'test-key',
    LLM_BASE_URL: 'https://llm.example.com/v1',
    LLM_MODEL: 'test-model'
  });
  const calls = [];
  const answer = await answerFromNotes({
    question: 'How is Dokploy routed?',
    config,
    notes: [
      {
        id: 'note-1',
        title: 'Dokploy route',
        content: 'Route the domain to service hermes on internal port 3000.',
        tags: ['deploy'],
        source: 'manual',
        updatedAt: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 'note-2',
        title: 'Shopping list',
        content: 'Buy coffee.',
        tags: [],
        source: '',
        updatedAt: '2026-01-02T00:00:00.000Z'
      }
    ],
    fetchImpl: async (url, options) => {
      calls.push({ url, options });

      return new Response(JSON.stringify({
        choices: [
          {
            message: {
              content: 'Dokploy should route the domain to hermes on internal port 3000.'
            }
          }
        ]
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://llm.example.com/v1/chat/completions');
  assert.match(calls[0].options.body, /Dokploy route/);
  assert.equal(answer.answer, 'Dokploy should route the domain to hermes on internal port 3000.');
  assert.deepEqual(answer.sources, [
    {
      id: 'note-1',
      title: 'Dokploy route',
      source: 'manual',
      updatedAt: '2026-01-01T00:00:00.000Z'
    }
  ]);
});

test('answerFromNotes returns natural text without inline source formatting', async () => {
  const config = resolveLlmConfig({
    LLM_PROVIDER: 'openai-compatible',
    LLM_API_KEY: 'test-key',
    LLM_BASE_URL: 'https://llm.example.com/v1',
    LLM_MODEL: 'test-model'
  });
  const answer = await answerFromNotes({
    question: 'Kapan deploy Pefindo?',
    config,
    notes: [
      {
        id: 'note-1',
        title: 'Jadwal Deploy Juli',
        content: 'Pefindo masuk daftar deployment bulan Juli 2026.',
        tags: ['deploy'],
        source: 'manual',
        updatedAt: '2026-07-01T00:00:00.000Z'
      }
    ],
    fetchImpl: async () => new Response(JSON.stringify({
      choices: [
        {
          message: {
            content: 'Menurut catatan **"Jadwal Deploy Juli"**, proyek **Pefindo** termasuk dalam daftar kegiatan deployment untuk bulan Juli. Jadi, deployment Pefindo dijadwalkan terjadi pada Juli\u202f2026. (Catatan 1)'
          }
        }
      ]
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  });

  assert.equal(
    answer.answer,
    'Menurut catatan "Jadwal Deploy Juli", proyek Pefindo termasuk dalam daftar kegiatan deployment untuk bulan Juli. Jadi, deployment Pefindo dijadwalkan terjadi pada Juli 2026.'
  );
});

test('answerFromNotes supports ollama cloud base url', async () => {
  const config = resolveLlmConfig({
    LLM_PROVIDER: 'ollama',
    LLM_API_KEY: 'ollama-key',
    LLM_BASE_URL: 'https://ollama.com/api',
    LLM_MODEL: 'gpt-oss:120b'
  });
  const calls = [];
  const answer = await answerFromNotes({
    question: 'What is Hermes?',
    config,
    notes: [
      {
        id: 'note-1',
        title: 'Hermes',
        content: 'Hermes is a personal second brain hub.',
        tags: ['hermes'],
        source: '',
        updatedAt: '2026-01-01T00:00:00.000Z'
      }
    ],
    fetchImpl: async (url, options) => {
      calls.push({ url, options });

      return new Response(JSON.stringify({
        message: {
          content: 'Hermes is a personal second brain hub.'
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://ollama.com/api/chat');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer ollama-key');
  assert.equal(answer.answer, 'Hermes is a personal second brain hub.');
});

test('unsupported routes and methods are explicit', async (t) => {
  const { baseUrl, close } = await startServer();
  t.after(close);

  const notFound = await fetch(`${baseUrl}/missing`);
  const methodNotAllowed = await fetch(`${baseUrl}/health`, { method: 'POST' });

  assert.equal(notFound.status, 404);
  assert.deepEqual(await notFound.json(), { error: 'not_found' });
  assert.equal(methodNotAllowed.status, 405);
  assert.equal(methodNotAllowed.headers.get('allow'), 'GET, HEAD');
});

async function startServer(options = {}) {
  const server = createHermesServer(options);

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    })
  };
}

async function createTempDataDir(t) {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'hermes-test-'));
  t.after(() => rm(dataDir, { recursive: true, force: true }));
  return dataDir;
}
