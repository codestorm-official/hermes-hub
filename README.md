# Hermes

Hermes adalah service Node.js kecil yang siap dijalankan dengan Docker Compose dan dideploy ke Dokploy. Project ini tidak memakai dependency runtime eksternal, jadi image tetap ringan dan proses deploy sederhana.

## Arah Project

Hermes project ini disiapkan sebagai fondasi **personal AI hub / command center**. Versi sekarang masih starter service yang bisa hidup di Dokploy, tetapi arah jangka menengahnya adalah menjadi pintu masuk untuk second brain, Telegram/web dashboard, audit log, job queue, dan agent lokal.

Target arsitektur yang diinginkan:

```text
Kamu
  -> Telegram / Web Dashboard
  -> Hermes di VPS
  -> tools aman:
      - notes / second brain
      - audit log
      - job queue
      - local agent di laptop
      - browser profile khusus
```

Use case utama:

- **Second brain** - simpan ide, link, catatan, log kerja, ringkasan chat, lalu cari lagi saat dibutuhkan.
- **Inbox pribadi** - kirim catatan dari Telegram atau web UI seperti "simpan ide ini", "catat link ini", atau "ringkas thread ini".
- **Dashboard kontrol** - lihat status agent, notes terakhir, action pending, health check, dan error deploy.
- **Approval center** - Hermes boleh menyiapkan draft atau rencana action, tetapi action eksternal seperti post, reply, delete, follow, atau DM harus minta approval dulu.
- **Gateway ke komputer lokal** - VPS tetap always-on, sementara hal sensitif seperti Obsidian vault asli atau browser session utama tetap di komputer pribadi.
- **Memory untuk AI pribadi** - Hermes bisa menyimpan konteks project, preferensi, catatan teknis, dan keputusan lama agar AI bisa menjawab berdasarkan data pribadi.

## Hermes Second Brain

Ada referensi project public: [andrihakim146/hermes-second-brain](https://github.com/andrihakim146/hermes-second-brain). Project itu adalah AI second brain untuk Obsidian yang dikendalikan dari Telegram lewat Hermes Agent dan MCP.

Konsepnya:

```text
Telegram -> Hermes Agent -> Capability Gateway -> Second Brain Core -> Obsidian Vault
```

Poin yang bisa diadopsi:

- Vault Markdown/Obsidian tetap menjadi source of truth untuk catatan.
- SQLite dipakai untuk job, audit, index pencarian, dan metadata operasional.
- Tool dibatasi dengan capability/permission level.
- Operasi write seperti capture, move, update, dan undo harus atomik, reversible, dan tercatat di audit log.
- Note sensitif tidak boleh sembarang dikirim ke AI, di-embed, atau diindeks penuh.

Untuk project ini, jalur paling masuk akal adalah **hybrid**: Hermes di VPS/Dokploy menjadi orchestrator dan dashboard, sedangkan vault Obsidian atau browser agent yang sensitif tetap berjalan di mesin lokal melalui koneksi privat seperti Tailscale atau tunnel lain.

## VPS vs Lokal

Hermes bisa dijalankan di VPS, terutama untuk bagian yang butuh always-on seperti gateway Telegram, webhook, health check, dashboard, job queue, dan API kecil.

Namun tidak semua hal sebaiknya dipindahkan ke VPS:

- Jika vault Obsidian berisi catatan pribadi, lebih aman vault tetap di komputer pribadi atau disinkronkan dengan strategi backup/encryption yang jelas.
- Jika Hermes perlu mengakses browser yang sudah login, sebaiknya akses itu berjalan di komputer lokal dengan browser profile khusus.
- VPS sebaiknya tidak menyimpan token, cookies, atau session browser utama kecuali benar-benar diperlukan dan sudah dipisahkan dari akun utama.

Pilihan deployment:

| Model | Cocok Untuk | Risiko |
| --- | --- | --- |
| Full VPS | Bot always-on, notes non-sensitif, dashboard publik dengan auth. | Data pribadi dan secrets hidup di server. |
| Full lokal | Vault pribadi, browser session utama, eksperimen aman. | Tidak always-on kecuali komputer selalu menyala. |
| Hybrid | VPS sebagai gateway, komputer lokal sebagai executor sensitif. | Butuh tunnel/private network dan desain permission yang rapi. |

Rekomendasi default: **hybrid**.

## Browser Control

Beberapa workflow Hermes/agent bisa mengendalikan browser yang sudah login, misalnya untuk membaca halaman atau menyiapkan balasan di Threads. Ini berbeda dengan membuka browser session baru: agent memakai session/profile yang sudah ada, biasanya lewat browser extension, local browser automation agent, remote debugging, atau browser profile khusus.

Batas aman yang disarankan:

- Jangan pakai browser profile utama untuk automation.
- Buat browser profile khusus untuk Hermes.
- Pisahkan akun eksperimen dari akun utama jika memungkinkan.
- Semua action eksternal harus melalui approval: post, reply, delete, follow, DM, email, transaksi, atau perubahan setting akun.
- Log semua action dan simpan status pending sebelum dieksekusi.
- Jangan simpan cookies/session browser di VPS jika browser aslinya ada di komputer lokal.

Arsitektur yang lebih aman:

```text
Telegram / Web UI
  -> Hermes di VPS
  -> MCP / private API
  -> Local Agent di komputer pribadi
  -> Browser profile khusus
```

## Roadmap MVP

Urutan implementasi yang disarankan:

1. **Hermes Hub MVP** - auth sederhana, notes, search, audit log, dan dashboard.
2. **Telegram capture** - simpan note/link dari Telegram dengan allowlist user.
3. **Second brain storage** - integrasi Markdown vault atau storage SQLite dulu.
4. **Approval center** - action pending, approve/reject, dan audit trail.
5. **Local agent** - koneksi privat ke komputer lokal untuk vault/browser sensitif.
6. **AI/RAG** - jawaban berbasis notes pribadi dengan proteksi note sensitif.
7. **Browser control terbatas** - draft reply dulu, eksekusi hanya setelah approval.

## Endpoint

- `/` - halaman status service
- `/health` - health check JSON
- `/ready` - alias health check
- `/api/info` - metadata runtime

## Environment

Gunakan `.env.example` sebagai template. Untuk deploy di Dokploy, isi variable ini lewat menu Environment app Dokploy.

| Name | Default | Keterangan |
| --- | --- | --- |
| `APP_NAME` | `Hermes` | Nama service yang tampil di halaman dan health payload. |
| `APP_URL` | `http://localhost:3000` | URL publik aplikasi, contoh `https://hermes.domainmu.com`. |
| `HOST_PORT` | `3000` | Port host untuk Docker Compose lokal lewat `compose.local.yaml`. Tidak perlu diset untuk Dokploy. |
| `LOG_LEVEL` | `info` | Disiapkan untuk konfigurasi logging berikutnya. |
| `TRUST_PROXY` | `true` | Aktifkan pembacaan `X-Forwarded-For`, cocok saat di belakang proxy Dokploy. |

Contoh production:

```env
APP_NAME=Hermes
APP_URL=https://hermes.domainmu.com
HOST_PORT=3000
LOG_LEVEL=info
TRUST_PROXY=true
```

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
curl https://hermes.domainmu.com/health
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

## Deploy Lokal dengan Docker Compose

Jalankan dari root project:

```sh
docker compose -f compose.yaml -f compose.local.yaml up --build
```

Buka:

```text
http://localhost:3000
```

Untuk menjalankan di background:

```sh
docker compose -f compose.yaml -f compose.local.yaml up -d --build
```

Untuk melihat log:

```sh
docker compose -f compose.yaml -f compose.local.yaml logs -f hermes
```

Untuk mematikan service:

```sh
docker compose -f compose.yaml -f compose.local.yaml down
```

## Development Lokal

Requirements:

- Node.js 20.11 atau lebih baru

Jalankan:

```sh
npm test
npm run check
npm start
```

App akan listen di `http://localhost:3000`.

## Struktur Deploy

- [Dockerfile](Dockerfile) membuat image Node.js production.
- [compose.yaml](compose.yaml) mendefinisikan service `hermes`, internal port `3000`, restart policy, dan environment untuk Dokploy.
- [compose.local.yaml](compose.local.yaml) menambahkan host port mapping untuk development lokal.
- [.env.example](.env.example) adalah template variable untuk lokal dan Dokploy.

## Troubleshooting

- Jika deploy Dokploy gagal dengan `Bind for 0.0.0.0:3000 failed`, pastikan Dokploy memakai `compose.yaml` saja, bukan `compose.local.yaml`.
- Jika domain Dokploy menampilkan 502, pastikan route domain mengarah ke service `hermes` port `3000`.
- Jika `/api/info` menampilkan IP proxy, pastikan `TRUST_PROXY=true`.
- Jika port lokal bentrok, ubah `HOST_PORT` di `.env`, misalnya `HOST_PORT=3001`.
- Jika health check gagal, cek log dengan `docker compose logs -f hermes`.
