# Hermes Hub

Hermes Hub is a lightweight second-brain starter service and AI-ready personal hub. It provides a private dashboard for capturing notes, searching memory, asking questions over saved notes, configuring an LLM provider, and deploying the whole service with Docker Compose or Dokploy.

The project is intentionally simple:

- Node.js runtime.
- No runtime npm dependencies.
- Docker Compose ready.
- Dokploy friendly.
- Persistent notes and settings through a Docker volume.
- Token-protected dashboard and API with `HERMES_TOKEN`.
- LLM configuration from the dashboard or from optional environment defaults.

## Features

- Admin dashboard at `/` with login, sidebar navigation, capture, notes, Ask Notes, and Settings.
- Token login using `HERMES_TOKEN`.
- Notes API for programmatic capture and search.
- Ask Notes / basic RAG over saved notes.
- LLM Settings UI for provider, base URL, API key, model, context size, and connection checks before saving.
- Check / Load Models support for OpenAI-compatible providers and Ollama.
- Channel Settings UI for validating Telegram, setting a webhook, and asking notes from Telegram chat.
- Persistent notes at `/app/data/notes.json`.
- Persistent dashboard settings at `/app/data/settings.json`.
- Health endpoints for deployment checks.
- Logo and favicon served from `/logo.svg` and `/favicon.svg`.

Hermes Hub is still an MVP. It is not yet a full AI agent, Telegram chat bot, Obsidian sync engine, or browser controller. The current goal is to provide a reliable control plane that can grow into those workflows safely.

## Current AI Status

LLM usage is optional. If no LLM is configured, notes and search still work, while Ask Notes shows that the LLM is not ready.

There are two ways to configure the LLM:

- Use the dashboard `Settings` menu.
- Use `LLM_*` environment variables as bootstrap defaults.

Dashboard settings are stored in `/app/data/settings.json` and override environment defaults. After login, the dashboard can show saved secrets with the eye buttons in `Settings`, so anyone who can access the dashboard should be treated as an admin who can view secrets.

LLM settings cannot be saved while a provider is selected until the connection check succeeds. For OpenAI-compatible providers and Ollama, the `Check / Load Models` button calls the provider model-list endpoint and verifies the selected model when a model list is available. For Anthropic-compatible providers, Hermes checks the `/messages` endpoint with a tiny request because model-list endpoints are not standardized.

Supported providers:

| Provider | Use Case | Required Values |
| --- | --- | --- |
| `openai-compatible` | OpenAI or compatible cloud gateways. | Provider, base URL, model, API key |
| `anthropic` | Anthropic native or compatible `/messages` gateways. | Provider, base URL, model, API key |
| `ollama` | Local Ollama or Ollama Cloud. | Provider, base URL, model, optional API key |
| empty | Notes/search only. | None |

Ask Notes currently uses keyword scoring to choose relevant notes, sends those notes to the configured LLM, and asks the model to answer only from the provided context. Embeddings/vector search are not implemented yet.

## Current Channel Status

Telegram channel settings are available from the dashboard. Add a Telegram bot token, click `Test Connection`, then save it after the check succeeds. Hermes validates the token through Telegram `getMe` before writing it to `/app/data/settings.json`.

If `APP_URL` is an HTTPS URL, saving the bot also registers a Telegram webhook at `/telegram/webhook`. After that, messages sent to the bot are treated as Ask Notes questions and Hermes replies from saved notes using the configured LLM. You can send a plain question or use `/ask your question`.

Telegram capture, notifications, user allowlists, and approval workflows are not implemented yet.

## Architecture

Current shape:

```text
Browser / API Client
  -> Hermes Hub
      -> Dashboard
      -> Notes API
      -> Settings API
      -> Health API
      -> JSON files on persistent volume
```

Longer-term direction:

```text
User
  -> Telegram / Web Dashboard
  -> Hermes Hub on VPS
  -> safe tools:
      - notes / second brain
      - audit log
      - job queue
      - approval workflow
      - local agent
      - dedicated browser profile
```

## Use Cases

- Personal second brain for notes, links, project context, and decisions.
- Private inbox for future integrations such as Telegram capture.
- AI memory layer for project history and preferences.
- Approval center for actions that should be reviewed before execution.
- VPS gateway for always-on workflows.
- Hybrid local agent bridge for sensitive browser or vault access.

## Requirements

Local development:

- Node.js 20.11 or newer.

Docker deployment:

- Docker.
- Docker Compose.

Dokploy deployment:

- A Dokploy server.
- A Git repository containing this project.
- A domain or subdomain pointing to the Dokploy server.

## Quick Start

Common run modes:

| Mode | Best For | Compose Files |
| --- | --- | --- |
| Local Node.js | Fast development without Docker. | None |
| Local Docker / manual VPS | Normal server with your own reverse proxy. | `compose.yaml` + `compose.local.yaml` |
| Dokploy | VPS managed by Dokploy. | `compose.yaml` |

After the service starts, open:

```text
http://localhost:3000
```

or your production domain:

```text
https://hermes.example.com
```

## Daily Usage

1. Open the Hermes Hub dashboard.
2. Login with the same value as `HERMES_TOKEN`.
3. Open `Settings` to configure the LLM provider, base URL, API key, model, and context size.
4. Click `Check / Load Models`.
5. Select a loaded model or type a model and run the check successfully.
6. Save the LLM settings.
7. In `Channel Settings`, paste a Telegram bot token, click `Test Connection`, then save it after the check succeeds. For Telegram chat replies, `APP_URL` must be your public HTTPS domain before saving.
8. Open `Capture` to save notes.
9. Open `Notes` to search, view, and delete notes.
10. Open `Ask` to ask questions over saved notes.
11. Click `Logout` to clear the browser session token.

The browser stores the token in `sessionStorage`, so closing the tab or logging out clears it.

## API

Use `Authorization: Bearer YOUR_HERMES_TOKEN` when `HERMES_TOKEN` is set.

List notes:

```sh
curl https://hermes.example.com/api/notes \
  -H "Authorization: Bearer YOUR_HERMES_TOKEN"
```

Search notes:

```sh
curl "https://hermes.example.com/api/notes?query=dokploy" \
  -H "Authorization: Bearer YOUR_HERMES_TOKEN"
```

Create a note:

```sh
curl -X POST https://hermes.example.com/api/notes \
  -H "Authorization: Bearer YOUR_HERMES_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Deploy note","content":"Route the domain to service hermes on port 3000.","tags":"deploy,hermes","source":"manual"}'
```

Delete a note:

```sh
curl -X DELETE https://hermes.example.com/api/notes/NOTE_ID \
  -H "Authorization: Bearer YOUR_HERMES_TOKEN"
```

Ask notes:

```sh
curl -X POST https://hermes.example.com/api/ask \
  -H "Authorization: Bearer YOUR_HERMES_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question":"What do my notes say about Dokploy deployment?"}'
```

## Endpoints

- `/` - Hermes Hub dashboard
- `/logo.svg` - logo asset
- `/favicon.svg` - favicon asset
- `/health` - health check JSON
- `/ready` - health check alias
- `/api/info` - runtime metadata
- `/api/session` - validates the dashboard login token
- `/api/settings` - returns UI-safe settings for the dashboard
- `/api/settings/llm` - saves LLM settings
- `/api/settings/llm/check` - checks LLM connectivity before saving
- `/api/settings/llm/models` - loads model names from the provider
- `/api/settings/channels/telegram/test` - validates a Telegram bot token through Telegram `getMe`
- `/api/settings/channels/telegram` - saves Telegram bot settings after validation
- `/telegram/webhook` - receives Telegram bot updates and replies through Ask Notes
- `/api/notes` - lists and creates notes
- `/api/notes/:id` - deletes a note
- `/api/ask` - asks the configured LLM using relevant notes as context

## Environment

Use `.env.example` as the template. For Docker local or manual VPS deployment, create a `.env` file. In Dokploy, set the same values through the application Environment screen.

Recommended public deployment flow:

1. Set the core variables first: `APP_AUTHOR`, `APP_NAME`, `APP_URL`, `DATA_DIR`, `HERMES_TOKEN`, `LOG_LEVEL`, and `TRUST_PROXY`.
2. Leave `LLM_*` empty unless you want server-side bootstrap defaults.
3. Deploy the app.
4. Login to the dashboard and configure the LLM and channel settings from `Settings`.

Environment variables:

| Name | Default | Description |
| --- | --- | --- |
| `APP_AUTHOR` | `Asep Saputra` | Name shown in the sidebar attribution. |
| `APP_NAME` | `Hermes` | Service name shown in the dashboard title and health payload. |
| `APP_URL` | `http://localhost:3000` | Public app URL, such as `https://hermes.example.com`. |
| `DATA_DIR` | `/app/data` | Data directory inside the container. |
| `HERMES_TOKEN` | empty | Token used to protect the dashboard and API. Required for public deployment. |
| `HOST_PORT` | `3000` | Host port for local Docker via `compose.local.yaml`. Not needed for Dokploy. |
| `LLM_PROVIDER` | empty | Optional bootstrap provider: `openai-compatible`, `anthropic`, or `ollama`. |
| `LLM_BASE_URL` | empty | Optional bootstrap base URL. |
| `LLM_MODEL` | empty | Optional bootstrap model name. |
| `LLM_API_KEY` | empty | Optional bootstrap API key. |
| `LLM_MAX_CONTEXT_NOTES` | `6` | Maximum number of notes sent to the LLM as context. |
| `LOG_LEVEL` | `info` | Reserved for future logging configuration. |
| `TRUST_PROXY` | `true` | Enables `X-Forwarded-For` support behind Dokploy/reverse proxies. |

Telegram bot tokens and webhook secrets are configured from the dashboard `Settings` page and are stored in `/app/data/settings.json`; there is no Telegram environment variable by default.

Minimal production example:

```env
APP_AUTHOR=Asep Saputra
APP_NAME=Hermes
APP_URL=https://hermes.example.com
DATA_DIR=/app/data
HERMES_TOKEN=change-me-to-a-long-random-token
HOST_PORT=3000
LOG_LEVEL=info
TRUST_PROXY=true

LLM_PROVIDER=
LLM_BASE_URL=
LLM_MODEL=
LLM_API_KEY=
LLM_MAX_CONTEXT_NOTES=6
```

OpenAI-compatible bootstrap example:

```env
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=your-openai-compatible-model
LLM_API_KEY=change-me
LLM_MAX_CONTEXT_NOTES=6
```

Ollama local example:

```env
LLM_PROVIDER=ollama
LLM_BASE_URL=http://host.docker.internal:11434/api
LLM_MODEL=llama3.1
LLM_API_KEY=
```

Ollama Cloud example:

```env
LLM_PROVIDER=ollama
LLM_BASE_URL=https://ollama.com/api
LLM_MODEL=gpt-oss:120b
LLM_API_KEY=your-ollama-api-key
```

Anthropic native example:

```env
LLM_PROVIDER=anthropic
LLM_BASE_URL=https://api.anthropic.com/v1
LLM_MODEL=your-claude-model
LLM_API_KEY=change-me
```

Anthropic-compatible gateway example:

```env
LLM_PROVIDER=anthropic
LLM_BASE_URL=https://api.provider.example/v1
LLM_MODEL=your-model
LLM_API_KEY=your-key
```

OpenAI-compatible gateway example:

```env
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://api.provider.example/v1
LLM_MODEL=your-model
LLM_API_KEY=your-key
```

Do not include `/messages` in `LLM_BASE_URL` for Anthropic-compatible providers. Hermes calls `${LLM_BASE_URL}/messages` automatically.

Do not include `/chat/completions` in `LLM_BASE_URL` for OpenAI-compatible providers. Hermes calls `${LLM_BASE_URL}/chat/completions` automatically.

## Local Node.js Deployment

Run checks and tests:

```sh
npm run check
npm test
```

Start the server:

```sh
npm start
```

Open:

```text
http://localhost:3000
```

## Local Docker Compose Deployment

Use both compose files locally. `compose.yaml` defines the service, while `compose.local.yaml` adds host port mapping.

Start:

```sh
docker compose -f compose.yaml -f compose.local.yaml up --build
```

Run in the background:

```sh
docker compose -f compose.yaml -f compose.local.yaml up -d --build
```

View logs:

```sh
docker compose -f compose.yaml -f compose.local.yaml logs -f hermes
```

Stop:

```sh
docker compose -f compose.yaml -f compose.local.yaml down
```

If port `3000` is already used, set another `HOST_PORT` in `.env`:

```env
HOST_PORT=3001
```

## Manual VPS Deployment

1. Install Docker and Docker Compose on the VPS.
2. Clone the repository:

```sh
git clone https://github.com/YOUR_ORG/YOUR_REPO.git
cd YOUR_REPO
```

3. Create `.env` from `.env.example` and set production values:

```env
APP_AUTHOR=Asep Saputra
APP_NAME=Hermes
APP_URL=https://hermes.example.com
DATA_DIR=/app/data
HERMES_TOKEN=change-me-to-a-long-random-token
TRUST_PROXY=true
```

4. Start the service:

```sh
docker compose -f compose.yaml -f compose.local.yaml up -d --build
```

5. Route your reverse proxy to:

```text
127.0.0.1:3000
```

6. Verify:

```sh
curl https://hermes.example.com/health
```

Use `compose.local.yaml` for manual VPS deployments when the reverse proxy needs a host port. If the reverse proxy is in the same Docker network, you can route directly to service `hermes` on internal port `3000`.

## Dokploy Deployment

1. Push this project to a Git repository.
2. In Dokploy, create or select a project.
3. Create a new application.
4. Select the Git repository as the source.
5. Choose `Docker Compose` deployment.
6. Set the compose file path to `compose.yaml`.
7. Add the core environment variables from the Environment section. `LLM_*` may stay empty if you want to configure the provider from the dashboard after deployment.
8. Add your domain and route it to service `hermes` on internal port `3000`.
9. Set the health check path to `/health` if Dokploy asks for one.
10. Deploy.

Important: `compose.yaml` does not publish a host port such as `3000:3000`. In Dokploy, the proxy routes to the internal service port. This avoids errors such as:

```text
Bind for 0.0.0.0:3000 failed: port is already allocated
```

After deployment:

```sh
curl https://hermes.example.com/health
```

Expected healthy response:

```json
{
  "status": "ok",
  "service": "Hermes",
  "version": "0.1.0"
}
```

The real payload also includes `uptime` and `timestamp`.

## Data Persistence

Docker deployments store notes at:

```text
/app/data/notes.json
```

Dashboard settings are stored at:

```text
/app/data/settings.json
```

This file can contain LLM API keys, Telegram bot tokens, and Telegram webhook secrets if they are configured from the dashboard.

Both are persisted by the Docker volume:

```text
hermes-data
```

Back up this volume if the notes or settings are important.

## Security Checklist

For public deployments:

- Set a long random `HERMES_TOKEN`.
- Use HTTPS.
- Do not commit `.env`.
- Treat `settings.json` as sensitive if it contains an LLM API key, Telegram bot token, or Telegram webhook secret.
- Treat anyone who can log into the dashboard as someone who can view saved secrets.
- Back up `hermes-data`.
- Avoid storing highly sensitive secrets in notes until encryption and stronger access controls exist.
- Require approval before adding integrations that can post, reply, delete, follow, message, transact, or change external accounts.

## VPS, Local, and Hybrid Modes

Hermes Hub can run fully on a VPS for always-on dashboard, notes API, webhook, queue, and health-check workflows.

Some workflows are safer locally:

- Sensitive Obsidian vaults.
- Logged-in browser sessions.
- Tools that can act externally on your behalf.

Deployment models:

| Model | Best For | Risk |
| --- | --- | --- |
| Full VPS | Public dashboard, non-sensitive notes, webhooks, always-on bots. | Data and secrets live on the server. |
| Full local | Private vaults, main browser session, sensitive experiments. | Not always-on unless your computer stays online. |
| Hybrid | VPS gateway with a local executor for sensitive work. | Requires a private network/tunnel and clear permissions. |

Recommended path: start with full VPS for the basic Hermes Hub, then move sensitive vault or browser automation into a hybrid local agent.

## Browser Control

Browser control is not built in yet. If it is added later, use these constraints:

- Do not automate your main browser profile.
- Use a dedicated browser profile for Hermes.
- Prefer secondary/test accounts for experiments.
- Require approval for external actions such as post, reply, delete, follow, DM, email, transactions, and account setting changes.
- Log all actions and keep pending state before execution.
- Do not store main browser cookies or sessions on the VPS.

Safer shape:

```text
Telegram / Web UI
  -> Hermes Hub on VPS
  -> private API / tunnel
  -> local agent on personal computer
  -> dedicated browser profile
```

## Second-Brain Direction

Hermes Hub can grow into a full second-brain system. A relevant reference is [andrihakim146/hermes-second-brain](https://github.com/andrihakim146/hermes-second-brain), an AI second-brain project for Obsidian controlled through Hermes Agent and MCP.

Ideas worth adopting later:

- Markdown/Obsidian vault as source of truth.
- SQLite for jobs, audit log, search index, and operational metadata.
- Capability and permission layers for tools.
- Atomic, reversible, audited write operations.
- Sensitive-note protection before sending data to AI, embeddings, or search indexes.

## Roadmap

Suggested next steps:

1. Audit log for note changes, token usage, provider errors, and important actions.
2. SQLite storage for stronger query and durability guarantees.
3. Full-text search for better note retrieval.
4. Provider error history and clearer operational diagnostics.
5. Stronger RAG with embeddings/vector search and sensitive-note controls.
6. Telegram capture with user allowlist.
7. Approval center for pending actions.
8. Local agent bridge for vault/browser workflows.
9. Limited browser control that drafts first and executes only after approval.

## Project Structure

- [Dockerfile](Dockerfile) builds the production Node.js image.
- [compose.yaml](compose.yaml) defines the `hermes` service, internal port `3000`, restart policy, and Dokploy-safe environment.
- [compose.local.yaml](compose.local.yaml) adds host port mapping for local Docker use.
- [.env.example](.env.example) is the environment template for local and Dokploy deployments.
- [public/logo.svg](public/logo.svg) is the dashboard logo.
- [public/favicon.svg](public/favicon.svg) is the favicon.
- `src/storage.js` manages persistent JSON notes and settings.
- `src/dashboard-app.js` renders the admin dashboard.
- `src/dashboard.js` is the legacy dashboard renderer kept for reference.

## Troubleshooting

- If Dokploy fails with `Bind for 0.0.0.0:3000 failed`, make sure Dokploy uses only `compose.yaml`, not `compose.local.yaml`.
- If the Dokploy domain shows 502, route the domain to service `hermes` on internal port `3000`.
- If `/api/info` shows proxy IP behavior you do not expect, check `TRUST_PROXY`.
- If the dashboard shows a locked state, login with the same value as `HERMES_TOKEN`.
- If notes disappear after redeploy, make sure volume `hermes-data` is active.
- If local port `3000` is busy, set `HOST_PORT=3001` or another free port.
- If the health check fails, inspect logs with `docker compose logs -f hermes`.
- If `Check / Load Models` fails for an Anthropic-compatible provider, make sure the model name is filled. Model-list endpoints are not standardized across Anthropic-compatible providers, so Hermes checks the `/messages` endpoint instead.
- If Telegram settings cannot be saved, click `Test Connection` first and confirm the bot token is valid in Telegram BotFather.
- If Telegram saves successfully but the bot does not reply, confirm `APP_URL` is your public HTTPS domain, save the Telegram bot again, and make sure the dashboard shows `Webhook active`.
- If Telegram replies that the LLM is not configured, configure and save LLM Settings first, then ask again.
