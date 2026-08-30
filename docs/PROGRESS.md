# Progress Tracker

> **PENTING:** AI coding tool wajib baca file ini SEBELUM mulai kerja di
> sesi manapun, dan update file ini SETELAH menyelesaikan sebuah tugas.
> Tujuannya supaya sesi berikutnya (walau ini adalah instance/model AI yang
> berbeda) tahu persis apa yang sudah ada dan tidak mengulang atau
> bertentangan dengan keputusan sebelumnya.

## Status per Modul

Update kolom **Status** ke salah satu: `Belum Mulai` / `Sedang Dikerjakan` /
`Selesai` / `Selesai (butuh review)`. Isi kolom **Catatan** dengan keputusan
penting yang diambil, deviasi dari plan awal, atau known issue.

| # | Modul (sesuai AI-Coding-Prompts.md) | Status | Catatan |
|---|---|---|---|
| 1 | Inisialisasi Project | Belum Mulai | |
| 2 | Prisma Schema & Database | Belum Mulai | |
| 3 | Auth.js (role admin/customer) | Belum Mulai | |
| 4 | Storage Abstraction Layer | Belum Mulai | |
| 5 | CMS CRUD Listing (Admin) | Belum Mulai | |
| 6 | Upload Galeri Foto Pendukung | Belum Mulai | |
| 7 | Dashboard Admin | Belum Mulai | |
| 8 | Dashboard Customer | Belum Mulai | |
| 9 | Halaman Listing Publik | Belum Mulai | |
| 10 | Landing Page | Belum Mulai | |
| 11 | SEO Teknis | Belum Mulai | |
| 12 | Konfigurasi Deployment (Coolify) | Belum Mulai | |

## Keputusan Desain Penting (Decision Log)

> Catat di sini setiap keputusan yang menyimpang dari dokumen PRD/prompt
> awal, atau keputusan baru yang diambil di tengah jalan, supaya tidak
> hilang konteksnya. Format: tanggal — keputusan — alasan.

- 2026-08-30 — Fitur Settings admin ditambahkan (`/admin/settings`, 6 tab:
  Umum, SEO & OG, Jam Operasional, Hari Libur, Profil Admin, Pengguna) —
  skema baru: `SiteSettings` (singleton id=1), `OperatingHour` (7 baris),
  `Holiday` (date string "YYYY-MM-DD" untuk hindari timezone bug), plus
  `User.isActive`. Migrasi: `20260830012001_add_site_settings_operating_hours_holidays_user_active`.
- 2026-08-30 — Metadata root layout kini async dari `SiteSettings`
  (`generateMetadata`); fallback string placeholder lama diganti default
  dinamis (`{siteName} — Virtual Tour 360° Properti`). OG image disimpan via
  `shared/storage` path `settings/og/`.
- 2026-08-30 — Validasi booking (landing + admin) kini juga cek
  `schedule-settings` (hari tutup, hari libur, jam per hari). Default seed
  mempertahankan perilaku lama: Senin–Sabtu 09:00–16:00, Minggu tutup.
- 2026-08-30 — Manajemen pengguna: ADMIN bisa ubah role/aktifkan/hapus akun
  lain, TAPI tidak bisa menurunkan/menonaktifkan/menghapus akun sendiri
  (anti lockout). Reset password menghasilkan password sementara yang hanya
  ditampilkan sekali di dialog. Akun nonaktif diblokir di `authorize`;
  session JWT lama tetap valid hingga expire (keterbatasan JWT strategy).
- 2026-08-30 — Fitur pilih wilayah aktif: tabel `ActiveRegion` (kode+nama
  denormalisasi, level PROVINCE/REGENCY), tab baru "Wilayah" di
  /admin/settings, filter di `/api/wilayah` untuk daftar provinsi & kab/kota.
  Tabel kosong = semua aktif (auto-seed), prefill `?kode` & resolve `?codes`
  tidak difilter agar listing lama tetap bisa tampil/diedit. Migrasi:
  `20260830023220_add_active_regions`.

## Known Issues / Technical Debt

> Catat hal-hal yang sengaja disederhanakan dulu untuk MVP dan perlu
> diperbaiki nanti, supaya tidak terlupa.

- Nonaktif-kan akun (`User.isActive = false`) tidak langsung memutus session
  JWT yang sudah ada — user aktif tetap login sampai token expire (30 hari)
  karena strategy JWT tanpa query DB per-request. Blokir login sudah aktif.
- Kalender booking publik (`closedDates`) di-fetch sekali saat mount — perubahan
  jam operasional/libur baru terlihat setelah reload halaman.

## Yang TIDAK Boleh Berubah Tanpa Diskusi

- Struktur schema Prisma inti (`User`, `Listing`, `Media`) — kalau harus
  berubah, update `docs/DATABASE.md` di commit yang sama dan catat di
  Decision Log di atas.
- Storage abstraction pattern — semua fitur baru yang butuh upload file
  wajib pakai `getStorage()`, jangan bikin jalur upload baru yang langsung
  akses filesystem.
