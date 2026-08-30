# Environment Variables & Setup

## Daftar Environment Variable

| Variable | Wajib | Contoh / Keterangan |
|---|---|---|
| `DATABASE_URL` | Ya | Connection string Postgres. Lokal: lewat SSH tunnel (`localhost:5433`). Production: internal Coolify network. |
| `AUTH_SECRET` | Ya | Secret key untuk Auth.js, generate random string panjang (`openssl rand -base64 32`) |
| `RESEND_API_KEY` | Ya | API key dari Resend untuk kirim email notifikasi |
| `STORAGE_DRIVER` | Ya | `local` (default, MVP) atau `s3` (nanti saat pindah ke Biznet Gio) |
| `STORAGE_LOCAL_PATH` | Ya (kalau `STORAGE_DRIVER=local`) | Default `./storage/uploads`, di production path ini yang di-mount sebagai persistent volume Coolify |
| `STORAGE_S3_ENDPOINT` | Nanti | Endpoint Biznet Gio Neo Object Storage |
| `STORAGE_S3_ACCESS_KEY` | Nanti | Access key Biznet Gio |
| `STORAGE_S3_SECRET_KEY` | Nanti | Secret key Biznet Gio |
| `STORAGE_S3_BUCKET` | Nanti | Nama bucket Biznet Gio |
| `NEXT_PUBLIC_SITE_URL` | Ya | URL production untuk generate canonical URL, sitemap, OG tags (misal `https://namabisnis.com`) |

Simpan template kosong di `.env.example`, JANGAN pernah commit `.env.local`
atau `.env.production` ke git.

## Setup Development Lokal

1. Clone repo, `npm install`
2. Copy `.env.example` ke `.env.local`, isi semua variable wajib
3. Buka SSH tunnel via PuTTY ke Postgres Coolify:
   - Session → Host = IP VPS, Port `22`
   - Connection → SSH → Tunnels → Source port `5433`, Destination
     `localhost:[port-postgres-coolify]` (cek port ini di dashboard Coolify),
     pilih Local, klik Add
   - Kembali ke Session, klik Open, login SSH, biarkan window ini terbuka
4. Set `DATABASE_URL` di `.env.local`:
   ```
   DATABASE_URL="postgresql://user:pass@localhost:5433/nama_db"
   ```
   (user, pass, nama_db diambil dari dashboard Coolify resource Postgres)
5. Jalankan migration: `npx prisma migrate dev`
6. Jalankan dev server: `npm run dev`

> Simpan konfigurasi tunnel di PuTTY sebagai "Saved Session" supaya tidak
> setup ulang tiap kali.

## Setup Production (Coolify)

1. Hubungkan repo Git ke Coolify, pilih build method (Nixpacks otomatis
   deteksi Next.js, atau `Dockerfile` custom kalau sudah dibuat)
2. Set semua environment variable wajib di UI Coolify (Application → Environment Variables)
3. Set `DATABASE_URL` ke connection string internal (Coolify biasanya
   otomatis sediakan ini kalau resource Postgres dibuat di project yang sama)
4. **Konfigurasi Persistent Volume**: mount path sesuai `STORAGE_LOCAL_PATH`
   ke volume permanen — WAJIB sebelum go-live, kalau tidak foto hilang tiap
   redeploy
5. Deploy, lalu jalankan `npx prisma migrate deploy` lewat terminal/exec
   Coolify (bukan `migrate dev`)
6. Arahkan domain ke Coolify, aktifkan SSL (Let's Encrypt) lewat UI
7. Aktifkan scheduled backup untuk resource Postgres di UI Coolify
8. Setup cron terpisah untuk backup volume `storage/uploads` (di luar
   cakupan backup otomatis database)

## Migrasi Storage ke Biznet Gio (Nanti)

Saat storage VPS mulai penuh:
1. Buat bucket di Biznet Gio Neo Object Storage
2. Set `STORAGE_S3_*` di environment variable Coolify
3. Ganti `STORAGE_DRIVER=s3`
4. Foto baru otomatis lewat S3, foto lama tetap di disk lokal sampai ada
   waktu migrasi batch (tidak perlu big-bang migration)
