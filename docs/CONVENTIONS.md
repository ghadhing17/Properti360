# Konvensi Kode

## Server Actions vs API Routes

- **Default: pakai Server Actions** untuk semua mutasi data dari form
  (create/update/delete listing, submit lead, submit booking, dsb).
- **Pakai API Route** (`/app/api/...`) hanya untuk: webhook eksternal, atau
  endpoint yang memang perlu dipanggil dari luar Next.js (misal kalau nanti
  ada integrasi pihak ketiga yang butuh REST endpoint).
- Route handler `src/app/uploads/[...path]/route.ts` adalah pengecualian yang
  memang harus API route karena fungsinya serving file, bukan mutasi data.

## Validasi Input

- Semua input dari form/user **wajib** divalidasi pakai `zod` sebelum masuk
  ke Server Action atau disimpan ke database.
- Definisikan schema zod di file terpisah per fitur, misal
  `/lib/validations/listing.ts`, jangan inline di dalam komponen.
- Pesan error validasi dalam Bahasa Indonesia, jelas dan actionable (misal
  "Judul minimal 5 karakter", bukan "Invalid input").

## Penamaan

- File komponen: PascalCase (`ListingCard.tsx`)
- File utility/lib: camelCase (`generateSlug.ts`)
- Route folder Next.js: kebab-case sesuai konvensi Next.js (`/listing/[slug]`)
- Server Action function: verb + noun, misal `createListing`, `deleteMedia`,
  `submitLead`
- Prisma model: PascalCase singular (`Listing`, bukan `Listings`)

## Server vs Client Component

- Default semua komponen adalah **Server Component**. Hanya tambahkan
  `"use client"` kalau benar-benar butuh interaktivitas browser (event
  handler, state, hooks) — misal form, drag-and-drop upload, accordion FAQ.
- **Jangan** taruh `"use client"` di level page/layout kalau sebagian besar
  isinya statis/dari database — ini merusak SEO karena search engine perlu
  konten ter-render di server. Pecah jadi komponen kecil: page tetap Server
  Component, hanya bagian interaktif yang jadi Client Component terpisah.

## Error Handling

- Server Actions: return objek `{ success: boolean, error?: string, data?: T }`
  konsisten di semua Server Action, jangan throw error mentah ke client.
- Tampilkan error ke user lewat toast/alert yang jelas, jangan tampilkan
  stack trace atau pesan error teknis mentah ke pengguna akhir.
- Log error teknis lengkap di server (`console.error`) untuk keperluan
  debugging, tapi pesan yang sampai ke user tetap ramah.

## Styling

- Gunakan token warna dari `docs/DESIGN_SYSTEM.md`, jangan hardcode hex
  code baru di komponen.
- Prioritaskan utility class Tailwind, hindari custom CSS kecuali benar-benar
  perlu (misal animasi kompleks).
- Semua komponen harus responsive mobile-first (breakpoint `sm/md/lg`
  standar Tailwind).

## Database & Storage

- Query database HANYA lewat Prisma Client (`/lib/db.ts`), jangan raw SQL
  kecuali untuk kasus khusus yang benar-benar tidak bisa lewat Prisma —
  dan kalau terpaksa, beri komentar alasan kenapa.
- Operasi file HANYA lewat `getStorage()` dari `/lib/storage.ts` (lihat
  `CLAUDE.md` aturan #3).
- Setiap ada perubahan schema Prisma, **update juga** `docs/DATABASE.md`
  di commit yang sama.

## Commit & Progress Tracking

- Setelah menyelesaikan sebuah fitur, update checklist di
  `docs/PROGRESS.md` sebelum menganggap tugas selesai.
- Commit message singkat & deskriptif dalam Bahasa Inggris atau Indonesia
  konsisten, format bebas tapi jelas (misal `feat: add listing CRUD for admin`).
