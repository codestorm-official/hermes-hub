import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

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
