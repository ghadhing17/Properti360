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

- _(belum ada entry, isi seiring development)_

## Known Issues / Technical Debt

> Catat hal-hal yang sengaja disederhanakan dulu untuk MVP dan perlu
> diperbaiki nanti, supaya tidak terlupa.

- _(belum ada entry, isi seiring development)_

## Yang TIDAK Boleh Berubah Tanpa Diskusi

- Struktur schema Prisma inti (`User`, `Listing`, `Media`) — kalau harus
  berubah, update `docs/DATABASE.md` di commit yang sama dan catat di
  Decision Log di atas.
- Storage abstraction pattern — semua fitur baru yang butuh upload file
  wajib pakai `getStorage()`, jangan bikin jalur upload baru yang langsung
  akses filesystem.
