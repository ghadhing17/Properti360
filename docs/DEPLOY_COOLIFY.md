# Deploy Properti360 ke Coolify — Panduan Lengkap

Dokumen ini menjelaskan cara deploy aplikasi Properti360 (Next.js 15 + Prisma + PostgreSQL) ke VPS via **Coolify** dengan **single container** + **managed Postgres**.

---

## 1. Arsitektur di Coolify

```
VPS (Coolify)
├── Resource: PostgreSQL (postgres_properti360)
│   └── Internal host: v8lmc6i9xwspbwydwenrcxrq  (hostname container, berubah tiap recreate)
│       Port internal: 5432
└── Application: Properti360 (Dockerfile)
    ├── Build: Dockerfile (multi-stage, output standalone)
    ├── Runtime: node server.js :3000
    ├── Entrypoint: docker-entrypoint.sh → prisma migrate deploy (+ optional seed)
    └── Volume: /app/storage/uploads  (persistent)
```

---

## 2. Persiapan Repository

Repository sudah disiapkan:

| File | Fungsi |
|------|--------|
| `Dockerfile` | Multi-stage build (deps → builder → runner), base `node:20-bookworm-slim` |
| `.dockerignore` | Kecilkan build context |
| `docker-entrypoint.sh` | Auto `prisma migrate deploy` + retry DB, optional `SEED_ON_BOOT` |
| `next.config.ts` | `output: "standalone"` — menghasilkan `server.js` untuk Docker |
| `.env.example` | Template semua ENV |
| `prisma/migrations/*` | **Sudah di-commit** (jangan di-gitignore) — dibutuhkan `migrate deploy` |

> **PENTING:** `package-lock.json` dan `prisma/migrations/` **wajib ter-commit** — jangan di-ignore.

---

## 3. Buat Resource PostgreSQL di Coolify

1. Coolify Dashboard → **Project → New Resource → PostgreSQL** (versi 16).
2. Catat:
   - **Username:** `postgres`  (atau `postgres_properti360` tergantung template — cek di env resource)
   - **Password:** (auto-generate, copy)
   - **Database:** `postgres` (default)
   - **Internal Host:** hostname container, mis. `v8lmc6i9xwspbwydwenrcxrq` — lihat di tab **General → Connection String (internal)**
   - Port internal selalu `5432`.

3. **JANGAN** expose ke public kecuali butuh SSH tunnel untuk dev lokal.

---

## 4. Buat Application di Coolify

1. **New Resource → Application → Public Repository** (atau Private jika repo private).
2. Repo: `https://github.com/ghadhing17/Properti360` branch `main`.
3. **Build Pack:** `Dockerfile` (Coolify akan auto-detect `Dockerfile` di root). Jangan pilih Nixpacks.
4. **Port:** `3000` (sesuai `ENV PORT=3000` di Dockerfile).
5. **Health Check:** `GET /api` — Dockerfile sudah punya `HEALTHCHECK` yang hit `http://127.0.0.1:3000/api`.

---

## 5. Environment Variables (WAJIB di Coolify UI)

Buka **Application → Environment Variables** dan isi:

### Wajib

| Variable | Contoh Production | Keterangan |
|----------|-------------------|------------|
| `DATABASE_URL` | `postgresql://postgres:X3py0bf83pg0ZSoXFNmu3piYL9oYqpWCwMWgDncfB5P3B0dZlaZ0pIFnfbEIzrq0@v8lmc6i9xwspbwydwenrcxrq:5432/postgres` | **Gunakan internal host** Postgres (hostname container), bukan `localhost`. User `postgres`, bukan `postgres_properti360`. Cek `docs/inv.txt` lokal atau copy dari tab Postgres resource di Coolify. |
| `AUTH_SECRET` | `wkms8povEjHRImLPaIJq926Wj47v1/xXFeRvX6Yh73Y=` atau generate baru `openssl rand -base64 32` | **Wajib**, jangan kosong. Generate baru untuk production jika ingin rotasi. |
| `AUTH_URL` | `https://properti360.com` | URL publik aplikasi (tanpa trailing slash) |
| `NEXTAUTH_URL` | `https://properti360.com` | Sama dengan `AUTH_URL` (Auth.js v5 butuh keduanya untuk kompatibilitas) |
| `NEXT_PUBLIC_SITE_URL` | `https://properti360.com` | Untuk canonical URL, OG tags, sitemap — **harus `https://` di production** |

### Storage (Wajib)

| Variable | Nilai | Keterangan |
|----------|-------|------------|
| `STORAGE_DRIVER` | `local` | `local` untuk MVP (volume), `s3` jika sudah pakai Biznet Gio |
| `STORAGE_LOCAL_PATH` | `./storage/uploads` | Path di dalam container — **harus sama** dengan mount volume di bawah |

### Opsional

| Variable | Contoh | Keterangan |
|----------|--------|------------|
| `RESEND_API_KEY` | `re_...` | Kosongkan jika belum pakai email |
| `SEED_ADMIN_EMAIL` | `admin@properti360.local` | Dipakai saat `SEED_ON_BOOT=true` |
| `SEED_ADMIN_PASSWORD` | `Admin123!` | Ganti di production! |
| `SEED_ADMIN_NAME` | `Admin Properti360` | — |
| `SEED_ON_BOOT` | `true` | Set `true` **hanya untuk deploy pertama** agar admin ter-seed otomatis. Setelah admin ada, hapus / set `false`. |
| `STORAGE_S3_*` | — | Isi jika `STORAGE_DRIVER=s3` |

> **Catatan DATABASE_URL:**
> - Format Coolify internal: `postgresql://postgres:<PASSWORD>@<POSTGRES_HOST>:5432/postgres`
> - `<POSTGRES_HOST>` = hostname container Postgres (contoh `v8lmc6i9xwspbwydwenrcxrq`), **bukan** `localhost` dan **bukan** `postgres_properti360`.
> - Password ada di `docs/inv.txt` (lokal) atau di dashboard Coolify resource Postgres.
> - Jika salah host/user, error akan seperti `Can't reach database server at v8lmc...:5432`.

---

## 6. Persistent Volume (WAJIB sebelum go-live)

Tanpa volume, foto yang di-upload **hilang tiap redeploy**.

1. Application → **Storages** (atau Persistent Storage / Volumes).
2. Tambah volume:
   - **Source / volume name:** `properti360-uploads` (atau biarkan Coolify generate)
   - **Destination / mount path:** `/app/storage/uploads`
   - Type: `directory` / `volume`
3. **Jangan** mount ke `/data/uploads` — Dockerfile sudah siapkan keduanya tapi app membaca `STORAGE_LOCAL_PATH=./storage/uploads` → `/app/storage/uploads`.
4. Pastikan `.gitkeep` sudah ada di `storage/uploads/` (sudah ter-commit sebagai placeholder).

> Jika `STORAGE_DRIVER=s3`, volume tetap disarankan sebagai fallback, tapi tidak kritikal.

---

## 7. Domain & SSL

1. Application → **Domains** → tambah domain, mis. `properti360.com` + `www.properti360.com`.
2. Arahkan DNS `A record` ke IP VPS Coolify.
3. Coolify akan auto-provision **Let's Encrypt SSL** (tunggu 1-2 menit setelah DNS propagasi).
4. Setelah domain aktif, **update** `AUTH_URL`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL` ke `https://properti360.com` lalu **Redeploy**.

---

## 8. Deploy

1. Klik **Deploy** (atau push ke `main` akan auto-deploy jika webhook aktif).
2. Lihat **Logs** → `docker-entrypoint.sh` akan:
   ```
   [entrypoint] Running prisma migrate deploy...
   [entrypoint] Migrate deploy OK.
   [entrypoint] Launching: node server.js
   ```
3. Jika `SEED_ON_BOOT=true`, akan ada log `Seed OK` dan admin bisa login.
4. Cek health: `https://properti360.com/api` → `{"ok":true,...}`

### Jika deploy gagal

- **Can't reach database server** → cek `DATABASE_URL` host & password. Pastikan Postgres resource **Running**.
- **Env variable is not set: DATABASE_URL** → belum set di Application → Environment Variables (bukan di Postgres resource).
- **Prisma migrate failed** → cek logs, pastikan `prisma/migrations/` ada di repo (sudah di-commit).

---

## 9. Post-Deploy

### Seed wilayah (91k baris — hanya sekali)

Wilayah Indonesia (Kepmendagri) tidak ikut `migrate deploy`, harus di-seed manual:

```bash
# Via Coolify: Application → Terminal / Exec
npx tsx prisma/seed-wilayah.ts
# Atau jika wilayah.sql belum ada di container, upload dulu lalu:
WILAYAH_SQL_PATH=/app/prisma/wilayah.sql npx tsx prisma/seed-wilayah.ts
```

> Untuk dev lokal yang sudah punya SSH tunnel: `npm run db:seed:wilayah`

### Buat admin (jika tidak pakai SEED_ON_BOOT)

Via terminal Coolify:

```bash
SEED_ADMIN_EMAIL=admin@properti360.com SEED_ADMIN_PASSWORD='StrongPass123!' npm run db:seed
```

### Backup

- **Database:** Coolify → Postgres resource → **Backups** → aktifkan scheduled backup (S3 atau local).
- **Uploads volume:** backup `/app/storage/uploads` secara terpisah (cron `tar` atau snapshot VPS).

---

## 10. Update / Redeploy

- Push ke `main` → Coolify auto-build & deploy (jika webhook aktif), atau klik **Redeploy** manual.
- `docker-entrypoint.sh` akan otomatis `migrate deploy` lagi (idempotent) — migration baru akan ter-apply tanpa hapus data.

---

## 11. Development Lokal (SSH Tunnel)

Untuk dev lokal tetap via SSH tunnel PuTTY:

```env
DATABASE_URL="postgresql://postgres:X3py0bf83pg0ZSoXFNmu3piYL9oYqpWCwMWgDncfB5P3B0dZlaZ0pIFnfbEIzrq0@localhost:5434/postgres"
AUTH_SECRET="wkms8povEjHRImLPaIJq926Wj47v1/xXFeRvX6Yh73Y="
AUTH_URL="http://localhost:4000"
NEXTAUTH_URL="http://localhost:4000"
NEXT_PUBLIC_SITE_URL="http://localhost:4000"
STORAGE_DRIVER="local"
STORAGE_LOCAL_PATH="./storage/uploads"
```

---

## Checklist Deploy Pertama

- [ ] Postgres resource Running, catat internal host & password
- [ ] Application dibuat, Build Pack = Dockerfile, Port = 3000
- [ ] Semua ENV wajib terisi di Application (bukan hanya di Postgres)
- [ ] `DATABASE_URL` pakai host internal + user `postgres`
- [ ] Volume `/app/storage/uploads` ter-mount
- [ ] Deploy → logs `Migrate deploy OK`
- [ ] `SEED_ON_BOOT=true` untuk bootstrap admin (lalu matikan)
- [ ] Seed wilayah jika butuh filter wilayah di form
- [ ] Domain + SSL aktif → update `AUTH_URL`/`NEXT_PUBLIC_SITE_URL` → Redeploy
- [ ] Backup database & volume diaktifkan
