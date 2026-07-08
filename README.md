# Hermes Hub

Hermes Hub adalah lightweight second-brain starter service dan AI-ready personal hub. Project ini menyediakan dashboard kecil untuk capture notes, search notes, health check, dan fondasi awal untuk integrasi berikutnya seperti Telegram capture, local agent, browser workflow, approval queue, dan AI retrieval.

Project ini sengaja dibuat sederhana:

- Node.js runtime.
- Tanpa dependency runtime eksternal.
- Siap Docker Compose.
- Cocok untuk deploy lokal, VPS manual, atau Dokploy.
- Notes persisten melalui Docker volume.
- Notes API bisa dikunci dengan `HERMES_TOKEN`.

## Fitur

- **Dashboard admin** di `/` dengan login, sidebar, capture, search, delete, Ask Notes, dan Settings.
- **Ask Notes / basic RAG** untuk bertanya ke notes memakai LLM yang dikonfigurasi.
- **LLM Settings dari UI** untuk memilih provider, base URL, API key, model, dan max context notes.
- **Load Models** untuk provider yang punya endpoint model list seperti OpenAI-compatible dan Ollama.
- **Notes API** untuk integrasi programmatic.
- **Health endpoints** untuk deployment checks.
- **Token guard** dengan `HERMES_TOKEN` untuk notes dashboard dan API.
- **Persistent storage** di `/app/data/notes.json`.
- **Persistent settings** di `/app/data/settings.json`.
- **Docker Compose deployment** untuk lokal, VPS, dan Dokploy.
- **Dokploy-safe compose** tanpa host port binding langsung di `compose.yaml`.

Versi saat ini adalah MVP. Fitur notes adalah fondasi pertama, bukan tujuan akhir. Hermes Hub ditujukan sebagai control plane pribadi untuk capture, memory, audit log, approval workflow, Telegram capture, local agent, dan integrasi AI/browser yang lebih aman.

Hermes Hub mendukung LLM opsional untuk fitur Ask Notes. Jika LLM belum dikonfigurasi, dashboard dan notes tetap berjalan, tetapi fitur Ask akan menampilkan status bahwa LLM belum siap. LLM bisa dikonfigurasi dari menu `Settings` di dashboard, atau lewat environment variables sebagai default awal.

Hermes Hub saat ini belum menjadi full AI agent, Telegram bot, Obsidian sync engine, atau browser controller. Fondasi deployment, data, dan basic RAG sudah siap untuk dikembangkan ke arah itu.

## Status AI / LLM

LLM bersifat opsional. Ada dua cara konfigurasi:

- lewat menu `Settings` di dashboard;
- lewat environment variables sebagai default/bootstrap config.

Jika konfigurasi disimpan dari UI, nilainya disimpan di `/app/data/settings.json` dan akan dipakai oleh Hermes setelah redeploy selama volume `hermes-data` tetap ada. API key tidak pernah dikirim balik ke browser; dashboard hanya menampilkan status apakah API key sudah tersimpan atau belum.

Yang sudah ada:

- dashboard;
- notes API;
- Ask Notes / basic RAG;
- token guard;
- persistent notes storage;
- health check;
- Docker/Dokploy deployment.

Yang belum ada:

- Telegram bot token/input;
- Telegram capture;
- embedding/vector search;
- agent tools;
- browser automation.

Dengan kata lain, Hermes Hub sekarang punya **basic RAG**: pertanyaan user dicocokkan ke notes dengan keyword scoring, notes relevan dikirim sebagai konteks ke LLM, lalu LLM menjawab berdasarkan konteks tersebut. Semantic RAG dengan embeddings/vector search belum tersedia.

Provider LLM yang didukung:

| Option | Cocok Untuk | Env yang Dibutuhkan |
| --- | --- | --- |
| OpenAI-compatible API | Deploy VPS/Dokploy dengan model cloud. | `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL` |
| Anthropic-compatible API | Provider seperti Anthropic native atau gateway yang expose `/messages`. | `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL` |
| Ollama/local model | Data lebih privat, model berjalan di mesin sendiri. | `LLM_PROVIDER`, `LLM_BASE_URL`, `LLM_MODEL` |
| No LLM | Notes/search/dashboard saja. | Tidak perlu API key. |

Untuk Ollama, gunakan `LLM_PROVIDER=ollama`, `LLM_BASE_URL`, dan `LLM_MODEL`. `LLM_API_KEY` biasanya kosong kecuali Ollama dipasang di balik proxy yang membutuhkan bearer token.

## Arsitektur

Arsitektur saat ini:

```text
Browser / API Client
  -> Hermes Hub
      -> Dashboard
      -> Notes API
      -> Health API
      -> JSON storage volume
```

Arah jangka panjang:

```text
User
  -> Telegram / Web Dashboard
  -> Hermes Hub di VPS
  -> safe tools:
      - notes / second brain
      - audit log
      - job queue
      - approval workflow
      - local agent
      - browser profile khusus
```

## Use Case

- **Second brain** - simpan ide, link, catatan, log kerja, ringkasan chat, lalu cari lagi saat dibutuhkan.
- **Inbox pribadi** - kirim catatan dari dashboard atau integrasi seperti Telegram.
- **Dashboard kontrol** - lihat status agent, notes terakhir, action pending, health check, dan error deploy.
- **Approval center** - Hermes boleh menyiapkan draft atau rencana action, tetapi action eksternal seperti post, reply, delete, follow, atau DM harus minta approval dulu.
- **Gateway ke komputer lokal** - VPS tetap always-on, sementara hal sensitif seperti Obsidian vault atau browser session bisa tetap di komputer pribadi.
- **Memory untuk AI pribadi** - Hermes dapat berkembang menjadi memory layer untuk project, preferensi, catatan teknis, dan keputusan lama.

## Requirements

Untuk local development:

- Node.js 20.11 atau lebih baru.

Untuk Docker deployment:

- Docker.
- Docker Compose.

Untuk Dokploy deployment:

- Dokploy server.
- Repository Git berisi project ini.
- Domain atau subdomain yang mengarah ke server Dokploy.

## Quick Start

Ada tiga cara umum menjalankan Hermes Hub:

| Mode | Cocok Untuk | File Compose |
| --- | --- | --- |
| Local Node.js | Development cepat tanpa Docker. | Tidak perlu Compose. |
| Local Docker / VPS manual | Server biasa dengan reverse proxy sendiri. | `compose.yaml` + `compose.local.yaml` |
| Dokploy | VPS yang dikelola oleh Dokploy. | `compose.yaml` |

Setelah service berjalan, buka dashboard:

```text
http://localhost:3000
```

atau domain production:

```text
https://hermes.example.com
```

## Cara Pakai

Buka URL Hermes Hub:

```text
https://hermes.example.com
```

Dashboard `/` sekarang bisa dipakai untuk:

- melihat status service;
- menyimpan note cepat;
- mencari note berdasarkan title, content, tags, atau source;
- menghapus note;
- bertanya ke notes lewat panel `Ask Notes` jika LLM sudah dikonfigurasi;
- melihat jumlah note dan update terakhir.

Jika `HERMES_TOKEN` diset di environment server, dashboard akan meminta access token sebelum notes bisa dibaca atau ditulis. Token ini tidak otomatis diketahui browser, karena `.env` hanya dibaca di sisi server. Browser perlu mengirim token sebagai `Authorization: Bearer ...` agar API tahu request tersebut boleh mengakses notes.

Token dashboard hanya disimpan di memory tab browser. Jika halaman di-refresh, token perlu diisi ulang.

Flow penggunaan harian:

1. Buka dashboard Hermes.
2. Login memakai token yang sama dengan `HERMES_TOKEN`.
3. Buka menu `Settings` untuk mengatur LLM provider, base URL, API key, dan model.
4. Model bisa diketik manual, atau klik `Load Models` lalu pilih dari dropdown jika provider mendukung model list.
5. Buka menu `Capture` untuk menyimpan note.
6. Buka menu `Notes` untuk mencari dan menghapus note.
7. Buka menu `Ask` untuk bertanya ke notes jika LLM sudah siap.
8. Klik `Logout` untuk menghapus token dari sesi browser.

Data notes disimpan di `/app/data/notes.json` di dalam container dan dipersist lewat Docker volume `hermes-data`.

Data settings dashboard disimpan di `/app/data/settings.json` di dalam container dan dipersist lewat volume yang sama.

Cara kerja `Ask Notes`:

1. User mengirim pertanyaan.
2. Hermes mencari notes yang paling relevan dengan keyword scoring.
3. Hermes mengirim pertanyaan dan notes relevan ke LLM.
4. LLM menjawab hanya berdasarkan konteks notes.
5. Dashboard menampilkan jawaban dan source note yang dipakai.

## API Notes

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

Create note:

```sh
curl -X POST https://hermes.example.com/api/notes \
  -H "Authorization: Bearer YOUR_HERMES_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Deploy note","content":"Route domain to service hermes port 3000.","tags":"deploy,hermes","source":"manual"}'
```

Delete note:

```sh
curl -X DELETE https://hermes.example.com/api/notes/NOTE_ID \
  -H "Authorization: Bearer YOUR_HERMES_TOKEN"
```

Ask notes:

```sh
curl -X POST https://hermes.example.com/api/ask \
  -H "Authorization: Bearer YOUR_HERMES_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question":"Apa catatan saya tentang deploy Dokploy?"}'
```

## Endpoint

- `/` - dashboard Hermes Hub
- `/health` - health check JSON
- `/ready` - alias health check
- `/api/info` - metadata runtime
- `/api/session` - validasi login token dashboard
- `/api/settings` - baca settings yang aman untuk UI
- `/api/settings/llm` - simpan settings LLM
- `/api/settings/llm/models` - load model list dari provider
- `/api/notes` - list dan create notes
- `/api/notes/:id` - delete note
- `/api/ask` - basic RAG over notes using configured LLM

## Environment

Gunakan `.env.example` sebagai template. Untuk Docker lokal atau VPS manual, buat file `.env`. Untuk Dokploy, isi variable ini lewat menu Environment app Dokploy.

Mulai versi ini, variable `LLM_*` bersifat opsional sebagai default awal. Anda bisa membiarkannya kosong lalu mengatur provider dari dashboard `Settings`. Jika settings disimpan dari UI, settings tersebut akan override default dari environment.

| Name | Default | Keterangan |
| --- | --- | --- |
| `APP_NAME` | `Hermes` | Nama service yang tampil di halaman dan health payload. |
| `APP_URL` | `http://localhost:3000` | URL publik aplikasi, contoh `https://hermes.example.com`. |
| `DATA_DIR` | `/app/data` | Lokasi file data notes di container. |
| `HERMES_TOKEN` | kosong | Token untuk mengunci API notes dan dashboard notes. Wajib diset untuk deploy publik. |
| `HOST_PORT` | `3000` | Port host untuk Docker Compose lokal lewat `compose.local.yaml`. Tidak perlu diset untuk Dokploy. |
| `LLM_PROVIDER` | kosong | Provider LLM: `openai-compatible`, `anthropic`, atau `ollama`. Kosong berarti fitur Ask Notes nonaktif. |
| `LLM_API_KEY` | kosong | API key LLM. Kosong untuk Ollama lokal tanpa auth. |
| `LLM_BASE_URL` | kosong | Base URL provider, misalnya `https://api.openai.com/v1`, `https://api.anthropic.com/v1`, `https://ollama.com/api`, atau `http://ollama:11434/api`. |
| `LLM_MODEL` | kosong | Nama model yang tersedia di provider, misalnya `your-openai-compatible-model`, `your-claude-model`, atau `llama3.1`. |
| `LLM_MAX_CONTEXT_NOTES` | `6` | Jumlah maksimal notes yang dikirim sebagai konteks ke LLM. |
| `LOG_LEVEL` | `info` | Disiapkan untuk konfigurasi logging berikutnya. |
| `TRUST_PROXY` | `true` | Aktifkan pembacaan `X-Forwarded-For`, cocok saat di belakang proxy Dokploy. |

Contoh production:

```env
APP_NAME=Hermes
APP_URL=https://hermes.example.com
DATA_DIR=/app/data
HERMES_TOKEN=change-me-to-a-long-random-token
HOST_PORT=3000
LLM_PROVIDER=openai-compatible
LLM_API_KEY=change-me
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=your-openai-compatible-model
LLM_MAX_CONTEXT_NOTES=6
LOG_LEVEL=info
TRUST_PROXY=true
```

Contoh Ollama lokal:

```env
LLM_PROVIDER=ollama
LLM_BASE_URL=http://host.docker.internal:11434/api
LLM_MODEL=llama3.1
LLM_API_KEY=
```

Contoh Ollama cloud dengan API key dari `https://ollama.com/settings/keys`:

```env
LLM_PROVIDER=ollama
LLM_BASE_URL=https://ollama.com/api
LLM_MODEL=gpt-oss:120b
LLM_API_KEY=your-ollama-api-key
```

Contoh Anthropic native:

```env
LLM_PROVIDER=anthropic
LLM_BASE_URL=https://api.anthropic.com/v1
LLM_MODEL=your-claude-model
LLM_API_KEY=change-me
```

Contoh Aerolink Anthropic-compatible:

```env
LLM_PROVIDER=anthropic
LLM_BASE_URL=https://api.aerolink.example/v1
LLM_MODEL=your-aerolink-model
LLM_API_KEY=your-aerolink-key
```

Untuk provider Anthropic-compatible, jangan masukkan `/messages` di `LLM_BASE_URL`. Hermes akan memanggil `${LLM_BASE_URL}/messages` secara otomatis.

Jika Aerolink yang dipakai ternyata OpenAI-compatible, gunakan:

```env
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://api.aerolink.example/v1
LLM_MODEL=your-aerolink-model
LLM_API_KEY=your-aerolink-key
```

Untuk OpenAI-compatible provider, jangan masukkan `/chat/completions` di `LLM_BASE_URL`. Hermes akan memanggil `${LLM_BASE_URL}/chat/completions` secara otomatis.

## Deploy Lokal dengan Node.js

Mode ini cocok untuk development cepat tanpa Docker.

Jalankan checks dan tests:

```sh
npm run check
npm test
```

Start server:

```sh
npm start
```

Buka:

```text
http://localhost:3000
```

## Deploy Lokal dengan Docker Compose

Gunakan dua file compose untuk lokal. `compose.yaml` berisi service utama, sedangkan `compose.local.yaml` menambahkan port mapping ke host.

Start:

```sh
docker compose -f compose.yaml -f compose.local.yaml up --build
```

Buka:

```text
http://localhost:3000
```

Run in background:

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

Jika port lokal `3000` bentrok, ubah `HOST_PORT`:

```env
HOST_PORT=3001
```

## Deploy ke VPS Manual

Mode ini cocok untuk VPS biasa tanpa Dokploy.

1. Install Docker dan Docker Compose di VPS.
2. Clone repository:

```sh
git clone https://github.com/YOUR_ORG/YOUR_REPO.git
cd YOUR_REPO
```

3. Buat `.env` dari `.env.example`, lalu isi production values:

```env
APP_NAME=Hermes Hub
APP_URL=https://hermes.example.com
DATA_DIR=/app/data
HERMES_TOKEN=change-me-to-a-long-random-token
TRUST_PROXY=true
```

4. Jalankan service:

```sh
docker compose -f compose.yaml -f compose.local.yaml up -d --build
```

5. Pasang reverse proxy seperti Caddy, Nginx, atau Traefik dari domain publik ke:

```text
127.0.0.1:3000
```

6. Verifikasi:

```sh
curl https://hermes.example.com/health
```

Untuk VPS manual, `compose.local.yaml` dipakai karena reverse proxy biasanya perlu host port. Jika reverse proxy berada di Docker network yang sama, host port bisa dihindari dan proxy dapat route langsung ke service `hermes` port `3000`.

## Deploy ke Dokploy

1. Push project ini ke repository Git.
2. Di Dokploy, buat `Project` baru atau pilih project yang sudah ada.
3. Buat `Application` baru.
4. Pilih source dari Git repository project ini.
5. Pilih deployment type `Docker Compose`.
6. Isi compose file path dengan `compose.yaml`.
7. Tambahkan environment variables dari bagian Environment di atas.
8. Tambahkan domain, lalu arahkan ke service `hermes` dengan internal port `3000`.
9. Set health check path ke `/health` jika Dokploy meminta health check.
10. Jalankan deploy.

Catatan penting: `compose.yaml` tidak mem-publish host port seperti `3000:3000`. Di Dokploy, routing dilakukan lewat proxy internal ke service `hermes` port `3000`. Ini menghindari error seperti:

```text
Bind for 0.0.0.0:3000 failed: port is already allocated
```

Setelah deploy selesai, cek:

```sh
curl https://hermes.example.com/health
```

Respons sehat akan terlihat seperti ini:

```json
{
  "status": "ok",
  "service": "Hermes",
  "version": "0.1.0"
}
```

Payload asli juga menyertakan `uptime` dan `timestamp`.

## Data Persistence

Dalam deployment Docker, notes disimpan di:

```text
/app/data/notes.json
```

`compose.yaml` membuat volume:

```text
hermes-data
```

Volume ini menjaga notes tetap ada setelah container rebuild atau redeploy. Jika notes dianggap penting, backup volume ini secara berkala.

## Security Checklist

Untuk deployment publik:

- Set `HERMES_TOKEN` dengan token panjang dan acak.
- Gunakan HTTPS.
- Jangan commit `.env`.
- Jangan commit atau export isi volume data jika berisi API key di `settings.json`.
- Backup volume `hermes-data`.
- Jangan simpan secrets penting di notes sebelum ada encryption dan access control yang lebih kuat.
- Gunakan approval workflow sebelum menambahkan integrasi yang bisa melakukan action eksternal.

## VPS, Lokal, dan Hybrid

Hermes Hub bisa dijalankan sepenuhnya di VPS, terutama untuk workflow yang butuh always-on seperti dashboard, notes API, webhook, queue, dan health check.

Namun, beberapa workflow lebih aman dijalankan secara lokal:

- vault Obsidian atau notes yang sangat sensitif;
- browser session yang sudah login;
- tools yang bisa melakukan action eksternal atas nama user.

Pilihan deployment:

| Model | Cocok Untuk | Risiko |
| --- | --- | --- |
| Full VPS | Dashboard publik, notes non-sensitif, webhook, queue, bot always-on. | Data dan secrets hidup di server. |
| Full lokal | Private vault, browser session utama, eksperimen sensitif. | Tidak always-on kecuali mesin lokal selalu hidup. |
| Hybrid | VPS sebagai gateway, komputer lokal sebagai executor sensitif. | Butuh tunnel/private network dan permission yang rapi. |

Rekomendasi umum: gunakan **full VPS** untuk Hermes Hub dasar, lalu gunakan **hybrid** jika mulai menghubungkan vault pribadi atau browser agent.

## Browser Control

Browser control adalah integrasi lanjutan dan belum menjadi fitur bawaan Hermes Hub. Jika nanti ditambahkan, gunakan batas aman berikut:

- Jangan pakai browser profile utama untuk automation.
- Buat browser profile khusus untuk Hermes.
- Pisahkan akun eksperimen dari akun utama jika memungkinkan.
- Semua action eksternal harus melalui approval: post, reply, delete, follow, DM, email, transaksi, atau perubahan setting akun.
- Log semua action dan simpan status pending sebelum dieksekusi.
- Jangan simpan cookies/session browser utama di VPS.

Arsitektur yang lebih aman:

```text
Telegram / Web UI
  -> Hermes Hub di VPS
  -> private API / tunnel
  -> Local Agent di komputer pribadi
  -> Browser profile khusus
```

## Second Brain Direction

Hermes Hub dapat berkembang menjadi second-brain system. Referensi yang relevan: [andrihakim146/hermes-second-brain](https://github.com/andrihakim146/hermes-second-brain), sebuah project AI second brain untuk Obsidian yang dikendalikan dari Telegram lewat Hermes Agent dan MCP.

Konsep yang bisa diadopsi:

- Vault Markdown/Obsidian sebagai source of truth.
- SQLite untuk job, audit, index pencarian, dan metadata operasional.
- Capability/permission layer untuk membatasi tools.
- Write operation yang atomik, reversible, dan tercatat di audit log.
- Proteksi note sensitif agar tidak sembarang dikirim ke AI, di-embed, atau diindeks penuh.

## Roadmap

Urutan pengembangan yang disarankan:

1. **Audit log** - catat create/delete note, token usage, error, dan action penting.
2. **SQLite storage** - pindahkan storage dari JSON ke SQLite untuk query dan durability yang lebih baik.
3. **Full-text search** - tambah pencarian yang lebih kuat untuk content dan tags.
4. **Provider validation** - test connection, better provider presets, dan pesan error yang lebih ramah.
5. **Ask notes / RAG yang lebih kuat** - embeddings/vector search dan proteksi note sensitif.
6. **Telegram capture** - simpan note/link dari Telegram dengan allowlist user.
7. **Approval center** - action pending, approve/reject, dan audit trail.
8. **Local agent** - koneksi privat ke komputer lokal untuk vault/browser sensitif.
9. **Browser control terbatas** - draft reply dulu, eksekusi hanya setelah approval.

## Struktur Project

- [Dockerfile](Dockerfile) membuat image Node.js production.
- [compose.yaml](compose.yaml) mendefinisikan service `hermes`, internal port `3000`, restart policy, dan environment untuk Dokploy.
- [compose.local.yaml](compose.local.yaml) menambahkan host port mapping untuk development lokal.
- [.env.example](.env.example) adalah template variable untuk lokal dan Dokploy.
- `src/storage.js` mengelola file notes persisten.
- `src/dashboard-app.js` merender dashboard admin Hermes Hub.
- `src/dashboard.js` adalah renderer dashboard lama yang masih disimpan sebagai legacy.

## Troubleshooting

- Jika deploy Dokploy gagal dengan `Bind for 0.0.0.0:3000 failed`, pastikan Dokploy memakai `compose.yaml` saja, bukan `compose.local.yaml`.
- Jika domain Dokploy menampilkan 502, pastikan route domain mengarah ke service `hermes` port `3000`.
- Jika `/api/info` menampilkan IP proxy, pastikan `TRUST_PROXY=true`.
- Jika dashboard notes menampilkan locked state, isi token yang sama dengan `HERMES_TOKEN`.
- Jika notes hilang setelah redeploy, pastikan volume `hermes-data` aktif di Dokploy.
- Jika port lokal bentrok, ubah `HOST_PORT` di `.env`, misalnya `HOST_PORT=3001`.
- Jika health check gagal, cek log dengan `docker compose logs -f hermes`.
- Jika `Load Models` gagal untuk Anthropic-compatible provider, ketik nama model manual. Endpoint model list belum standar untuk semua provider Anthropic-compatible.
