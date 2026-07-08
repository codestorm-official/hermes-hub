import assert from 'node:assert/strict';
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
  assert.match(body, /Hermes Test/);
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
