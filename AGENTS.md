# AGENTS.md — Standar Coding & Guardrail Project Properti360

> File ini WAJIB diikuti di setiap sesi kerja pada project ini.
> Tujuan: setiap hasil coding **clean, efficient, reliable, robust, bulletproof** —
> tanpa pernah mengubah behavior yang sudah jalan di production.

Stack: **Next.js 15 (App Router) + TypeScript, Tailwind v4 + MUI v9, Prisma + PostgreSQL,
Auth.js v5 (JWT), self-hosted Coolify/VPS (satu container).**

---

## 0. Prinsip hierarchy (urutan prioritas saat ada konflik)

1. **Behavior dulu** — fitur yang sudah jalan HARUS tetap jalan persis sama.
2. **Reliability** — error tidak boleh silent; user selalu dapat feedback jelas.
3. **Security** — validasi input + cek role di server, jangan pernah percaya client.
4. **Performance** — hanya setelah 1-3 aman.
5. **Estetika kode** — paling terakhir.

Kalau ragu apakah sebuah perubahan mengubah behavior → **JANGAN lakukan**.
Tandai sebagai catatan terpisah dan tanyakan ke user.

---

## 1. Struktur & Boundary (modular monolith)

```
/src
  /app                    # routing + composition SAJA (logika berat dilarang di sini)
    /(auth)/              # /login /register
    /(landing)/           # /, /blog, /booking
    /(dashboard)/customer # /customer/*
    /(cms)/admin          # /admin/* — group (cms) TIDAK muncul di URL
    /(public-listing)/listing/[slug]   # SEO-critical
    /api/                 # route handlers
    /uploads/[...path]/   # serving file local storage
  /modules/<domain>/      # landing | listing | dashboard | cms
    components/ actions/ queries/ index.ts
  /shared/
    auth/ ui/ storage/ lib/
```

Aturan yang TIDAK boleh dilanggar:

- **`app/` dilarang memanggil `prisma` langsung.** Semua query lewat
  `modules/<domain>/queries/`. Halaman hanya: auth guard → panggil query → render.
- **Import lintas domain hanya lewat `modules/<domain>/index.ts`.**
  Di dalam modul sendiri: direct path diperbolehkan.
- **Komponen client JANGAN di-export lewat barrel untuk dipakai page yang sama**
  (barrel menarik semua komponen client ke bundle halaman — terbukti menaikkan
  First Load JS `/` dari 169 kB ke 237 kB). Page di modul sendiri: direct path.
- Komponen yang dipakai ≥2 domain → pindahkan ke `shared/ui`. Jangan duplikasi.
- File komponen `PascalCase` atau kebab-case konsisten per folder; lib/utility `camelCase`.
- Satu file = satu tanggung jawab. Page >400 baris harus dipecah (komponen ke `modules/`).

---

## 2. Server vs Client Component

- Default: **Server Component**. Tambahkan `"use client"` HANYA jika butuh
  interaktivitas (state, event handler, browser API).
- Server Action (`"use server"`) dipisah di `actions/`, bukan inline di komponen besar.
- Jangan pernah mengubah Server Component menjadi Client hanya demi styling.

---

## 3. Data Layer (Prisma)

- Query berulang → fungsi di `queries/`. Dilarang copy-paste `findMany` identik antar file.
- **`select`/`include` seminimal mungkin** — jangan fetch kolom/relasi yang tidak dirender.
- Waspada N+1: kalau render list lalu query per-item, refactor ke `include`/`_count`.
- Pagination wajib untuk list yang bisa besar (leads, bookings): `count` + `skip/take`.
- Query best-effort untuk halaman publik (landing/listing): `try/catch` + fallback
  `[]`/`null` — DB down tidak boleh membuat halaman marketing 500.
- **Dilarang mengubah `prisma/schema.prisma` tanpa rencana migrasi terpisah yang
  disetujui user.** Kode ≠ skema.

---

## 4. Server Actions & API Routes

- Default mutasi = **Server Action**. API Route hanya untuk: serving file, webhook,
  atau endpoint yang dipanggil dari luar Next.js.
- **Semua input divalidasi `zod`** sebelum menyentuh DB. Schema di `shared/lib/validations/`.
- Pesan error **Bahasa Indonesia, actionable**: "Judul minimal 5 karakter",
  bukan "Invalid input".
- Guard role di awal setiap action/route: `await requireRole("ADMIN")` atau
  `requireRole(["ADMIN","CUSTOMER"])`. Jangan pernah percaya data dari client
  (role, ownerId, status) — set/cek di server.
- Pola return action: `{ success?: boolean; error?: string; fieldErrors?: Record<string, string[]> }`.
- Error tak terduga: `console.error("[namaFungsi]", e)` + pesan generik ke user.
  **Dilarang silent catch tanpa log** untuk operasi tulis.
- Operasi yang boleh gagal tanpa menggagalkan utama (mis. kirim email notifikasi):
  fire-and-forget dengan `.catch(() => {})` + `console.error` di dalam catch bila perlu.
- `revalidatePath()` setelah mutasi yang mengubah halaman terkait (list + detail).

---

## 5. Auth & Otorisasi

- Session JWT — role & id tersedia tanpa query DB (`getCurrentUser`, `requireRole`).
- Ownership check di level **query**: `where: { ownerId: user.id }` untuk CUSTOMER
  (`buildOwnerFilter`); ADMIN bebas. Resource milik orang lain → `notFound()` (anti-enumeration).
- Register: role selalu `CUSTOMER` hard-coded server-side.
- Middleware hanya proteksi route (`/admin/*`, `/customer/*`, `/login`, `/register`) —
  **jangan pindahkan logika ownership ke middleware**.

---

## 6. Storage

- **Satu-satunya pintu ke filesystem/object storage = `shared/storage/index.ts`.**
  Dilarang import `fs` langsung di modul/page (pengecualian: `app/uploads/[...path]/route.ts`).
- Upload gambar → `uploadImageWithThumbnail` (sharp). Thumbnail jangan digenerate
  ulang per request — hasilnya disimpan.
- Nama file selalu UUID-generated (anti collision & anti path traversal).
- `STORAGE_LOCAL_PATH` = persistent volume Coolify. **Jangan pernah menyentuh
  konfigurasi/path volume saat refactor kode.**

---

## 7. SEO (halaman listing publik — CRITICAL)

- `generateMetadata` di `(public-listing)/listing/[slug]/page.tsx` + helper
  `modules/listing/lib/seo.ts` = **zona sensitif**. Setiap perubahan wajib:
  diff output sebelum-sesudah (title, description, canonical, OG, JSON-LD).
- Canonical & URL absolut hanya lewat `listingCanonicalUrl`/`absoluteUrl`
  (base dari `NEXT_PUBLIC_SITE_URL`).
- DRAFT listing: hanya owner/ADMIN yang boleh lihat, selain itu `notFound()`.
- Meta title/description custom > fallback > slice description 160 char —
  pertahankan urutan prioritas ini.

---

## 8. Performance

- `export const dynamic = "force-dynamic"` HANYA untuk halaman berdata user-spesifik
  (dashboard). Halaman publik (landing/blog) pakai `revalidate = 60` + cache.
- Increment view pakai cookie-dedup yang sudah ada (30 menit) — jangan hilangkan.
- Komponen client sekecil mungkin; data fetch tetap di server.
- Setelah refactor struktur: bandingkan tabel Route (app) hasil `next build` —
  First Load JS tidak boleh membengkak tanpa alasan jelas.

---

## 9. UI (MUI v9 + Tailwind)

- **Grid MUI v9 pakai API baru**: `<Grid spacing={2}>` + `<Grid size={{ xs: 12, md: 7 }}>`.
  Dilarang `item xs={}` gaya lama (error TS2769).
- Warna token konsisten: primary `#1D4ED8`, primary-dark `#1E3A8A`, text `#0F172A`,
  muted `#64748B`, border `#E2E8F0`, bg `#F1F5F9`/`#F8FAFC`. Jangan hardcoded warna baru.
- Ikon: `@mui/icons-material` dengan `sx={{ fontSize: 14..22 }}`.
- Empty state wajib ada untuk setiap list/tabel (icon + teks + CTA).
- Komponen form: label Bahasa Indonesia, `disabled={pending}` saat submit,
  feedback sukses/error visible.

---

## 10. Definition of Done — WAJIB sebelum selesai

1. `npx tsc --noEmit` → 0 error.
2. `npm run build` → "Compiled successfully" + 12/12 static pages.
3. Daftar route output build **identik** dengan sebelum perubahan
   (kecuali route memang ditambah/hapus secara eksplisit & disetujui).
4. Untuk perubahan batch/list file: scan UTF-8 strict (semua file valid, tanpa BOM).
5. Lint saat sudah diperbaiki tooling-nya (saat ini `eslint-config-next` patcher
   error — pre-existing; jangan abaikan begitu sudah jalan).
6. Zona SEO belum tersentuh, atau sudah di-diff metadata-nya.
7. Tidak ada `console.log` sisa (boleh `console.error` untuk logging error).

---

## 11. Catatan Tooling Mesin Ini (Windows/PowerShell) — pelajaran nyata

- **Path berkarakter `[ ]`** (mis. `[slug]`, `[...nextauth]`) di-glob oleh PowerShell.
  Selalu pakai `-LiteralPath`, atau .NET API: `[System.IO.File]::ReadAllText/WriteAllText`
  + `UTF8Encoding($false)` (no BOM). **Dilarang `Set-Content`/`Get-Content` tanpa
  -LiteralPath** untuk file tersebut (pernah menimpa file dengan konten file lain).
- **Mass-replace** di banyak file: .NET API saja, dan VERIFIKASI hasilnya
  (grep path lama harus 0) + `tsc` setelahnya.
- **File encoding**: UTF-8 tanpa BOM. Deteksi korupsi: strict decode
  `UTF8Encoding($false, $true)`; repair CP1252→UTF-8 hanya jika tidak ada U+FFFD.
- **Checkpoint git sebelum operasi besar** (mass move/replace). Repo ini dulu
  kosong saat insiden — hampir tidak bisa restore. Sekarang: commit dulu baru kerja.
- Build verification via log file (`Out-File` + baca) karena output panjang terpotong.

---

## 12. Hal yang diketahui rusak / keputusan tertunda (jangan "perbaiki" tanpa izin)

- `npm run lint` gagal karena patcher `eslint-config-next` (bukan error kode).
- Tombol "Tambah Listing" `/customer` → `/customer/listings/new` belum punya halaman (404).
- Duplikasi logika lead: `submitLead` (action) vs `app/api/leads/route.ts` (inline) —
  konsolidasi menunggu keputusan (response shape beda).
- `GET /api` masih pesan skeleton — endpoint live, sengaja dipertahankan.
