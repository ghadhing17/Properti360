# Arsitektur — [NamaBisnis] Virtual Tour Platform

## Struktur Kode (Modular Monolith — /src)

Satu aplikasi Next.js (satu container Coolify), diorganisir per domain dengan
route groups + `modules/`. URL produksi TIDAK berubah oleh struktur folder.

```
/src
  /app                        # routing + composition saja
    /(auth)/                  # login, register
    /(landing)/               # /, /blog, /booking  (marketing publik)
    /(dashboard)/             # /customer/*         (dashboard customer)
    /(cms)/admin/*            # /admin/*            (panel admin; group tidak muncul di URL)
    /(public-listing)/listing/[slug]   # halaman publik per properti (SEO-critical)
    /api/                     # route handlers (auth, leads, bookings, gallery, wilayah, uploads)
    /uploads/[...path]/       # serving file dari STORAGE_LOCAL_PATH (di luar /public)

  /modules                    # logic per domain — isolasi boundary
    /landing/                 # components, actions, queries, index.ts
    /listing/                 # halaman publik listing (viewer, contact, SEO helpers)
    /dashboard/               # dashboard customer (edit listing sendiri, QR, share)
    /cms/                     # panel admin (listings, blog, kategori, produk, bookings)

  /shared                     # dipakai lintas domain
    /auth/                    # auth.ts (index), config.ts, session.ts, actions.ts, next-auth.d.ts
    /ui/                      # design system + shell (header, footer, sidebar, stat-card, dashboard-shell, ...)
    /storage/                 # storage abstraction (local disk / S3-compatible)
    /lib/                     # db (prisma), utils, mui-theme, booking-schedule, validations/
```

Aturan boundary:
- Halaman di `app/` TIDAK memanggil `prisma` langsung — semua query lewat
  `modules/<domain>/queries/`.
- Import antar modul hanya boleh lewat `modules/<domain>/index.ts`
  (public API). Di dalam modul sendiri, direct path diperbolehkan.
- Komponen yang dipakai lebih dari satu domain (mis. header/footer,
  stat-card, sidebar) ditaruh di `shared/ui`.
- Barrels (`index.ts`) jangan di-import oleh page di modul yang sama untuk
  komponen client — pakai direct path agar tree-shaking efektif.

## Topologi Deployment

Semua komponen (app, database, storage) berjalan di **satu VPS**, dikelola
lewat **Coolify**. Ini pilihan sengaja untuk minimalkan biaya di fase MVP.

```
                         ┌─────────────────────────────────────┐
                         │              VPS + Coolify           │
                         │                                       │
  User Browser ───────▶ │  Coolify Proxy (Traefik/Caddy + SSL)  │
                         │            │                          │
                         │            ▼                          │
                         │  Container: Next.js App (PM-managed  │
                         │  oleh Coolify, auto-restart)          │
                         │            │              │            │
                         │            ▼              ▼            │
                         │  Container: Postgres   Volume:        │
                         │  (internal network)    /storage/uploads│
                         │                                       │
                         └─────────────────────────────────────┘
                                      ▲
                                      │ SSH Tunnel (PuTTY)
                                      │ hanya untuk development lokal
                                      │
                              Developer PC (local)
```

## Kenapa Single-VPS

Database Postgres bersifat **private** (tidak diexpose ke publik), sehingga
app yang mengaksesnya juga harus berjalan di jaringan yang sama (internal
Docker network Coolify). Ini mengeliminasi kebutuhan Vercel/Neon/Supabase/R2
sama sekali, tapi konsekuensinya:

- App, DB, dan storage adalah **satu titik kegagalan**. VPS down = semua down.
- Mitigasi: aktifkan scheduled backup Postgres di Coolify, backup manual
  (cron `tar`/`rsync`) untuk volume `/storage/uploads`, dan monitoring uptime
  eksternal (misal UptimeRobot, gratis).
- Kapan upgrade: kalau traffic/jumlah listing sudah cukup besar sehingga
  downtime mulai berdampak nyata ke bisnis, pisahkan storage ke Biznet Gio
  Object Storage dan/atau pindahkan DB ke VPS/managed service terpisah.

## Alur Development Lokal (SSH Tunnel via PuTTY)

Developer TIDAK install Postgres atau Docker apapun di PC lokal. Koneksi ke
database Coolify dilakukan lewat SSH tunnel:

1. PuTTY Session → Host = IP VPS, Port 22
2. Connection → SSH → Tunnels → Source port `5433`, Destination
   `localhost:[port-postgres-coolify]`, Add, lalu Open
3. `.env.local`: `DATABASE_URL="postgresql://user:pass@localhost:5433/db"`

Detail lengkap ada di `docs/ENVIRONMENT.md`.

## Alur Data Utama

**Alur upload listing baru:**
```
Admin isi form CMS → Server Action validasi (zod) → simpan record Listing
  di Postgres → upload foto galeri lewat storage.upload() → thumbnail
  di-generate via sharp → simpan record Media → admin paste embed code
  Panoee → simpan sebagai Media type PANOEE_TOUR
```

**Alur pengunjung buka halaman listing:**
```
Request /listing/[slug] → cek status (404 kalau DRAFT & bukan owner/admin)
  → render Server Component (SEO-friendly) → increment viewCount +
  ListingViewLog → tampilkan facade cover 360 (iframe belum di-load)
  → user klik "Lihat Tour" → iframe Panoee baru di-render
```

**Alur lead masuk:**
```
Pengunjung isi form "Hubungi Pemilik" → Server Action insert ke tabel Lead
  → kirim email notifikasi ke admin via Resend → tampil di dashboard admin
  & dashboard customer terkait
```

## Storage Abstraction

Semua operasi file WAJIB lewat `src/shared/storage/index.ts` (lihat
`CLAUDE.md` aturan #3). Implementasi awal: `LocalDiskStorage` menulis ke
volume Coolify yang di-mount ke path sesuai `STORAGE_LOCAL_PATH`. File
disajikan lewat route handler `src/app/uploads/[...path]/route.ts` (karena
folder ini di luar `/public`). Migrasi ke `S3CompatibleStorage` nanti hanya
perlu ganti environment variable `STORAGE_DRIVER=s3` + kredensial Biznet Gio,
tanpa ubah kode di halaman/komponen manapun.
