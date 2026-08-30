# DESIGN.md — Acuan Desain Platform Virtual Tour 360° Properti360

> **Sumber kebenaran PRD:** `docs/PRD-Virtual-Tour-360.md:1` — versi 1.1 (29 Aug 2026)
> **Sistem warna & token:** `docs/DESIGN_SYSTEM.md:1`, `app/globals.css:3`
> **Arsitektur & routing:** `docs/ARCHITECTURE.md:1`, `prisma/schema.prisma:1`
> **Konvensi:** `docs/CONVENTIONS.md:1`

Dokumen ini adalah **acuan tunggal untuk desain UI/UX** sebelum generate via Google Stitch maupun implementasi manual di Next.js 15. Semua prompt Stitch di PRD Bab 10 (`docs/PRD-Virtual-Tour-360.md:298`) diringkas + diperluas di sini supaya konsisten antar halaman dan siap handoff ke kode.

---

## 1. Ringkasan Produk & Tujuan Desain

**Platform:** jasa fotografi virtual tour 360° untuk properti. Setiap customer dapat listing publik SEO-friendly + dashboard view/lead. Lihat `docs/PRD-Virtual-Tour-360.md:9`.

**4 bagian utama** (`docs/PRD-Virtual-Tour-360.md:17`):
| Bagian | Route Next.js | Pengguna |
|---|---|---|
| Landing Page | `app/(marketing)/page.tsx:1` | Calon customer |
| Dashboard Customer | `app/(dashboard)/customer/page.tsx` | Pemilik properti |
| Dashboard Admin / CMS | `app/(dashboard)/admin/**` | Admin/tim |
| Halaman Listing Publik | `app/listing/[slug]/page.tsx:1` | Publik |

**Tujuan desain:**
1. Konversi landing → booking jasa foto (CTA jelas, social proof).
2. Kepercayaan premium/terpercaya untuk properti (banyak whitespace, biru sebagai warna trust).
3. SEO-first: listing publik harus ringan (<3s di 4G), viewer 360 lazy-load (`docs/PRD-Virtual-Tour-360.md:231`).
4. Self-service customer: dashboard sederhana, mobile-first (`docs/PRD-Virtual-Tour-360.md:278`).

**Non-goals v1:** bukan marketplace transaksi, tanpa payment/booking properti (`docs/PRD-Virtual-Tour-360.md:41`).

---

## 2. Prinsip Desain

1. **Trust & Premium** — real-estate aesthetic: whitespace lega, rounded-xl, shadow-sm, foto besar. Hindari shadow tebal (`docs/DESIGN_SYSTEM.md:74`).
2. **Mobile-first, lalu desktop** — mayoritas pengunjung dari HP (`docs/ARCHITECTURE.md:68`). Uji 320px dulu, baru 768/1024/1280.
3. **Satu palet, satu bahasa** — JANGAN hardcode hex di komponen (`docs/DESIGN_SYSTEM.md:3`). Pakai token Tailwind v4 `app/globals.css:3`.
4. **SEO adalah fitur desain** — SSR/SSG, heading hierarchy benar, alt text, struktur teks di sekitar iframe (`docs/PRD-Virtual-Tour-360.md:253`).
5. **Konsistensi Stitch** — semua halaman pakai palet yang sama (prompt Bab 10). Jika generate via Stitch MCP, paste prompt verbatim dari §13.

---

## 3. Brand & Token

### 3.1 Palet Warna (wajib via CSS variable)

Sudah terpasang di `app/globals.css:3` dengan `@theme`:

| Token | Hex | Token Tailwind | Pemakaian |
|---|---|---|---|
| `primary` | `#1D4ED8` | `bg-primary` `text-primary` | CTA, link aktif |
| `primary-dark` | `#1E3A8A` | `bg-primary-dark` | Sidebar, footer, navbar dark |
| `accent` | `#60A5FA` | `bg-accent` | Highlight, active state, chart |
| `background` | `#F8FAFC` | `bg-background` | Background halaman |
| `surface` | `#FFFFFF` | `bg-white` | Card/panel |
| `foreground` | `#0F172A` | `text-foreground` | Teks utama |
| `muted` | `#64748B` | `text-muted` | Teks sekunder |
| `border` | `#E2E8F0` | `border-border` | Divider, input border |
| `success` | `#16A34A` | `bg-success` | PUBLISHED |
| `warning` | `#F59E0B` | `bg-warning` | DRAFT |
| `danger` | `#DC2626` | `bg-danger` | Hapus/error |

> Jika butuh warna baru, extend di `app/globals.css:3` + dokumentasikan di `docs/DESIGN_SYSTEM.md:22`. Jangan inline `style="#..."`.

### 3.2 Tipografi

- **Font:** sans-serif modern via `next/font` (Inter / Geist Sans). Sudah `var(--font-geist-sans)` di `app/globals.css:30`.
- **Skala** (`docs/DESIGN_SYSTEM.md:42`):
  - H1 hero: `text-4xl md:text-5xl font-bold tracking-tight`
  - H2 section: `text-2xl md:text-3xl font-semibold`
  - H3 card: `text-lg font-semibold`
  - Body: `text-base text-foreground leading-6`
  - Small/caption: `text-sm text-muted`
  - Label: `text-sm font-medium text-foreground`
- **Heading hierarchy SEO:** 1× H1 per halaman (judul listing / headline hero), H2 untuk section, H3 untuk card.

### 3.3 Spacing, Radius, Shadow

- **Spacing:** seksi vertikal `py-16 md:py-24`, antar card `gap-6`, padding card `p-6` (`docs/DESIGN_SYSTEM.md:57`).
- **Radius:** elemen umum `rounded-lg`, card besar `rounded-xl`, badge `rounded-full`.
- **Shadow:** `shadow-sm` default, `hover:shadow-md transition-shadow` untuk clickable card.
- **Whitespace:** jangan padat — kesan profesional (`docs/DESIGN_SYSTEM.md:75`).

---

## 4. Informasi Arsitektur & Sitemap

```
 / (marketing) ─┬─ /              → Landing Page
                ├─ /blog          → (Fase 3) listing artikel SEO
                └─ /blog/[slug]   → artikel

 /listing/[slug]                  → Halaman listing publik (SSR)

 /(auth) ───────┬─ /login
                └─ /register      → hanya CUSTOMER

 /(dashboard) ──┬─ /admin              → ringkasan + tabel semua listing
                ├─ /admin/listings     → CRUD
                ├─ /admin/listings/new
                ├─ /admin/listings/[id]/edit → CMS editor
                └─ /customer       → listing milik sendiri + leads
```

Routing sudah ada skeleton di `app/(marketing)/layout.tsx`, `app/(dashboard)/layout.tsx`, `app/(auth)/layout.tsx`. Sidebar/drawer memakai `primary-dark` untuk admin/customer (`docs/DESIGN_SYSTEM.md:65`).

---

## 5. Komponen Design System

Semua komponen WAJIB responsive dan pakai token di §3. Referensi pola di `docs/DESIGN_SYSTEM.md:49`.

### 5.1 Tombol

| Varian | Class | Pakai |
|---|---|---|
| Primary | `bg-primary text-white rounded-lg hover:bg-primary-dark` | CTA utama: Pesan Sesi, Simpan & Publish, Hubungi |
| Secondary | `border border-primary/20 text-primary hover:bg-primary/5` | Lihat Contoh, Batal |
| Ghost | `text-foreground hover:bg-foreground/5` | Navigasi sekunder |
| Danger | `bg-danger text-white` | Hapus listing/media |

Ukuran: `px-4 py-2 text-sm font-medium` (default), `px-6 py-3 text-base` untuk hero.

### 5.2 Card

`bg-white rounded-xl shadow-sm border p-6` — hover `hover:shadow-md transition-shadow`. Untuk listing card, thumbnail `aspect-[4/3] rounded-lg overflow-hidden`.

### 5.3 Badge Status

`rounded-full px-2.5 py-0.5 text-xs font-medium` (`docs/DESIGN_SYSTEM.md:60`):
- `PUBLISHED` → `bg-success/10 text-success border-success/20`
- `DRAFT` → `bg-warning/10 text-warning border-warning/20`

### 5.4 Form Input

`border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary` — label `text-sm font-medium` di atas input, error `text-sm text-danger` di bawah (`docs/DESIGN_SYSTEM.md:69`). Validasi via `zod` (`docs/CONVENTIONS.md:13`).

### 5.5 Sidebar Dashboard

- Background `bg-primary-dark` (`#1E3A8A`), teks `text-white/80`, aktif `bg-accent/20 text-white border-l-2 border-accent` (`docs/DESIGN_SYSTEM.md:65`).
- Navigasi: Dashboard, My Listings, Leads/Inquiries, Analytics, Settings, Logout — icon + label, collapse ke icon-only di tablet.
- Top header putih: page title kiri, avatar + bell kanan.

### 5.6 Elemen SEO-visual

- **Breadcrumb:** `Beranda / Semarang / Rumah 2 Lantai` — bantu internal linking.
- **Share buttons:** WhatsApp (hijau), Copy Link, Facebook — bulat `rounded-full` dengan brand color masing-masing tapi tetap aksen biru dominan.
- **Watermark:** badge `Virtual Tour by [NamaBisnis]` di pojok viewer, link balik ke `/`.

---

## 6. Spesifikasi Halaman

### 6.1 Landing Page — `app/(marketing)/page.tsx:1`

**Tujuan:** konversi → form booking (`docs/PRD-Virtual-Tour-360.md:182`).

**Struktur top→bottom (10 seksi, sesuai prompt Stitch `docs/PRD-Virtual-Tour-360.md:300`):**

1. **Sticky Navbar** — putih, logo kiri, menu (Portofolio, Harga, Cara Kerja, Blog), CTA kanan `Pesan Sesi Foto` (primary). Scroll → shadow-sm.
2. **Hero** — headline besar "Ubah Properti Jadi Virtual Tour 360° Imersif", subheadline "gratis listing SEO-friendly", 2 CTA (primary `Pesan Sekarang` + outline `Lihat Contoh Tour`), mockup viewer 360 di kanan (video-player style + play overlay). Background `bg-background`, aksen dekoratif `accent/10`.
3. **Value Prop** — 4 icon cards: Kualitas Tinggi, Gratis Listing, Proses Cepat, Harga Terjangkau — `grid md:grid-cols-4 gap-6`.
4. **Cara Kerja** — 4 langkah horizontal dengan angka/bullet biru: Booking → Sesi Foto → Tour Live → Listing & Share. Garis penghubung `border-accent/30`.
5. **Portofolio** — grid `md:grid-cols-3` 6 cards: thumbnail, nama properti, lokasi + pin, tombol `Lihat Tour`. Data dari `Listing where status=PUBLISHED orderBy createdAt desc take 6`.
6. **Paket Harga** — 3 tiers (Basic/Pro/Premium), tengah `Most Popular` highlight `ring-2 ring-primary` + badge `accent`.
7. **Testimoni** — carousel/slider, foto bulat, nama, quote, bintang.
8. **FAQ** — accordion (`"use client"`), border, `focus:ring-primary`.
9. **Form Booking** — background `bg-primary-dark`, fields: Nama, No HP, Alamat Properti, Jenis Properti (dropdown `PropertyType`), Jadwal. Submit → `BookingRequest` (`prisma/schema.prisma:106`). Pesan sukses toast.
10. **Footer** — `bg-primary-dark` teks putih, logo, quick links (semua kategori/kota untuk internal linking SEO), sosial, kontak + NAP konsisten (`docs/PRD-Virtual-Tour-360.md:268`).

**Catatan desain:** mobile-first (`docs/PRD-Virtual-Tour-360.md:336`), typography hero `text-4xl md:text-5xl`, CTA kontras tinggi.

### 6.2 Dashboard — `app/(dashboard)/admin/page.tsx` & `app/(dashboard)/customer/page.tsx`

Prompt Stitch di `docs/PRD-Virtual-Tour-360.md:339`.

**Layout:** sidebar `primary-dark` + top header putih + main `bg-[#F1F5F9]` / `bg-background`.

**Customer:**
- 4 stat cards: Total Views, Total Listings, New Leads (7 hari), Rata-rata Views — icon biru, trend indicator.
- Line chart `Views Over Time` 30 hari (pakai `ListingViewLog` `prisma/schema.prisma:195`) — gradient biru `from-primary/20 to-accent/10`.
- Tabel listing miliknya: thumbnail, title, badge status, views, leads, tombol Edit.
- Card Leads terbaru: nama, phone, preview pesan, tanggal.
- Share box: link + QR code per listing.

**Admin (semua fitur customer +):**
- Kelola semua user & listing (approve/publish, edit, hapus).
- Filter by status/kota/kategori.
- Export leads CSV.
- Analytics ringkas total view & listing terpopuler.
- Kelola kategori & blog (Fase 3).

**States:** empty → ilustrasi + CTA "Buat Listing Pertama"; loading → skeleton cards; error → alert `danger`.

### 6.3 CMS — Listing Editor — `app/(dashboard)/admin/listings/**`

Prompt Stitch di `docs/PRD-Virtual-Tour-360.md:372`. Ini inti operasional harian (`docs/PRD-Virtual-Tour-360.md:213`).

**Top bar sticky:** title `Listing Baru` / `Edit Listing`, toggle Draft/Published, tombol `Simpan & Publish` (primary).

**Dua kolom:**

*Kiri 70% (form utama):*
1. **Basic Info** — Title, Category (dropdown `Category` `prisma/schema.prisma:106`), Address, City, Price (Int nullable `prisma/schema.prisma:126`).
2. **Deskripsi** — rich textarea (`@db.Text`).
3. **Virtual Tour Embed** — input `Panoee Embed Code/URL` + helper "Paste shortcode dari Panoee", preview box live (iframe) setelah paste, + upload `Cover Thumbnail` terpisah. Simpan sebagai `Media type=PANOE_E_TOUR` (`prisma/schema.prisma:159`): `panoeeEmbedUrl` + `panoeeShortcode` + `thumbnailUrl`. Simpan juga link langsung Panoee untuk migrasi (`docs/PRD-Virtual-Tour-360.md:457`).
4. **Galeri Pendukung** — dashed dropzone dengan icon cloud biru "Drag photos here or click to upload", row thumbnail scrollable dengan handle drag reorder + icon hapus. Upload lewat `getStorage()` (`docs/ARCHITECTURE.md:82`), thumbnail via `sharp`. Simpan `Media type=PHOTO` dengan `url`, `altText`, `order`.

*Kanan 30% (sidebar):*
1. **SEO** — Meta Title, Meta Description + counter karakter, preview slug `/listing/[slug]`. Auto-generate dari judul tapi bisa override (`docs/PRD-Virtual-Tour-360.md:252`).
2. **Assign Owner** — searchable dropdown User `role=CUSTOMER` (pilih pemilik).
3. **Featured Image** — grid thumbnail pilih cover (dipakai OG image).

**Validasi:** zod di `lib/validations/listing.ts` (`docs/CONVENTIONS.md:16`), pesan Indonesia. Return `{ success, error }` (`docs/CONVENTIONS.md:41`).

**Media library:** semua file yang pernah upload, akses via storage abstraction `lib/storage.ts:118`.

### 6.4 Halaman Listing Publik — `app/listing/[slug]/page.tsx:1`

Halaman paling penting untuk SEO & share (`docs/PRD-Virtual-Tour-360.md:230`). Harus SSR (`docs/ARCHITECTURE.md:62`), **DRAFT → 404** jika bukan owner/admin (`docs/DATABASE.md:65`).

**Urutan vertikal (prompt `docs/PRD-Virtual-Tour-360.md:414`):**

1. **Navbar** — putih sticky, logo kiri, CTA `Pesan Jasa Foto 360` kanan.
2. **Viewer Hero** — full-width `aspect-video` facade pattern: tampilkan `thumbnailUrl` sebagai cover + tombol play "Lihat Tour 360" di tengah. Iframe Panoee baru di-render setelah klik (atau `loading="lazy"` saat masuk viewport) untuk jaga LCP/CLS (`docs/PRD-Virtual-Tour-360.md:252`). Watermark badge `Virtual Tour by [NamaBisnis]` di pojok bawah linking ke `/`.
3. **Header Info** — judul H1 + lokasi (pin icon) + harga bold `text-primary` + 3 share buttons (WhatsApp/Copy/Facebook) rata kanan. Canonical & JSON-LD `RealEstateListing` di `<head>`.
4. **Dua kolom:** Kiri (lebar) → Deskripsi (H2) + galeri grid foto pendukung dengan alt text SEO; Kanan (sticky sidebar) → card `Hubungi Pemilik` (Name, Phone, Message → `Lead` `prisma/schema.prisma:179`, kirim email via Resend `docs/ARCHITECTURE.md:78`) + peta kecil Google Maps embed alamat.
5. **Listing Serupa** — `Properti Lain di [Kota]` horizontal scroll 3-4 cards (internal linking, `where city = current.city take 4`).
6. **Footer** — `bg-primary-dark`.

**SEO teks di sekitar iframe adalah sumber ranking** karena konten iframe Panoee tidak ter-index (`docs/PRD-Virtual-Tour-360.md:253`). Pastikan judul, deskripsi, alamat, alt text kaya keyword lokasi/jenis properti.

**Performace:** lazy-load iframe, thumbnail ter-optimize `sharp`, `next/image` dengan `sizes`.

---

## 7. Pola Interaksi & State

- **Loading:** skeleton `animate-pulse bg-border` untuk card/tabel; spinner `border-primary` untuk form submit.
- **Empty:** ilustrasi sederhana + teks `muted` + CTA primary (mis. "Belum ada listing").
- **Error:** Server Action return `{ success:false, error }` → toast/alert `bg-danger/10 text-danger`.
- **Auth:** halaman `(auth)` form login/register — input `border` + `focus:ring-primary`. Role ADMIN tidak bisa register publik (`docs/DATABASE.md:34`). Session via Auth.js (`auth.ts`).
- **Konfirmasi destruktif:** modal konfirmasi untuk Hapus listing/media — tombol danger.

---

## 8. Responsive & Aksesibilitas

- **Breakpoint:** `sm 640`, `md 768`, `lg 1024`, `xl 1280` (Tailwind default).
- **Mobile:** navbar → hamburger drawer; dashboard sidebar → icon-only atau drawer overlay; listing dua kolom → stack vertikal; viewer tetap `aspect-video`.
- **Aksesibilitas:** kontras teks `foreground` di `background` lolos WCAG AA (slate 900 di slate 50). Focus visible `ring-primary`. Alt text wajib untuk semua `Media.altText` (`prisma/schema.prisma:169`) — auto-generate "{title} - {city}" jika kosong. Heading hierarchy benar (`docs/PRD-Virtual-Tour-360.md:260`).

---

## 9. SEO & Performance (implikasi desain)

- **Technical SEO** (`docs/PRD-Virtual-Tour-360.md:247`): SSR/SSG, sitemap otomatis, robots.txt (allow listing/blog, disallow dashboard/admin), JSON-LD, canonical, URL slug bersih `docs/PRD-Virtual-Tour-360.md:254`.
- **On-Page** (`docs/PRD-Virtual-Tour-360.md:257`): meta title template `{Judul} - Virtual Tour 360° | [NamaBisnis]`, alt deskriptif, H1/H2 benar, internal linking.
- **Core Web Vitals:** viewer facade pattern, `next/image` optimized, lazy iframe, berat halaman listing < 500KB initial (tanpa iframe).
- **OG Image:** cover thumbnail `Media.thumbnailUrl` untuk share WhatsApp/Facebook.

---

## 10. Workflow Google Stitch (MCP)

MCP Stitch tersedia di `https://stitch.googleapis.com/mcp` (header `X-Goog-Api-Key`). Gunakan sebagai **referensi generate** lalu rapikan manual ke Tailwind v4.

### Cara pakai

1. Buka Stitch (atau via MCP) → pilih **"Create design from prompt"**.
2. Paste salah satu prompt dari §13 (identik dengan `docs/PRD-Virtual-Tour-360.md:300`). Stitch akan generate artboard Figma-like.
3. Iterasi dengan follow-up prompt, contoh:
   - "Make the pricing card 'Pro' more prominent with a blue ring"
   - "Add empty state for dashboard table when no listings"
   - "Make the 360 viewer use facade pattern with play button"
4. **Export:** Stitch → Copy as code / Figma. Sesuaikan warna agar pakai token `app/globals.css:3`, bukan hex hardcode.
5. **Handoff ke kode:** buat komponen di `components/` (PascalCase `docs/CONVENTIONS.md:23`), util di `lib/` (camelCase).

### Mapping Stitch → Tailwind App

| Stitch output | Padanan di app |
|---|---|
| `background: #1D4ED8` | `bg-primary` |
| `background: #1E3A8A` | `bg-primary-dark` |
| `color: #60A5FA` | `text-accent` / `bg-accent` |
| Auto-layout gap 24 | `gap-6` |
| Corner radius 12 | `rounded-xl` |
| Shadow soft | `shadow-sm` |

### Batasan Stitch

- Stitch tidak tahu schema Prisma — jangan biarkan generate form field yang tidak ada di `prisma/schema.prisma:118` (mis. field fiktif). Selalu cek `docs/DATABASE.md:36`.
- Stitch mungkin generate hex hardcode — ganti ke token setelah export.
- Upload/drag-drop di Stitch hanya mockup — interaksi asli pakai Client Component `"use client"` terpisah (`docs/CONVENTIONS.md:31`).

---

## 11. Handoff ke Developer

- **Styling:** utility Tailwind saja, hindari custom CSS (`docs/CONVENTIONS.md:53`).
- **Icon:** lucide-react atau heroicons (outline, konsisten stroke 1.5).
- **Gambar placeholder:** pakai `https://picsum.photos/seed/...` atau `storage/uploads` lokal via `getStorage()`.
- **Struktur file saran:**
  ```
  components/
    ui/Button.tsx
    ui/Card.tsx
    ui/Badge.tsx
    marketing/Hero.tsx
    marketing/PricingTable.tsx
    listing/ViewerFacade.tsx   // "use client" — facade iframe
    dashboard/StatCard.tsx
    cms/GalleryDropzone.tsx    // "use client"
  lib/
    storage.ts                 // abstraction (sudah ada)
    validations/listing.ts     // zod
  ```
- **Server vs Client:** page tetap Server Component (SEO), hanya bagian interaktif jadi Client Component kecil (`docs/CONVENTIONS.md:31`).

---

## 12. Prompt Stitch Siap-Pakai (copy-paste verbatim)

> Sumber: `docs/PRD-Virtual-Tour-360.md:298`. Prompt di bawah sudah disetel palet biru konsisten. Pakai apa adanya untuk hasil paling setia.

### 12.1 Landing Page

```
Design a modern, professional landing page for a 360° virtual tour photography
service for real estate properties (houses, apartments, hotels, venues).

Color palette: primary deep blue (#1D4ED8), dark navy blue (#1E3A8A) for
headers/footer, light sky blue (#60A5FA) as accent, white and light gray
(#F8FAFC) backgrounds, dark slate text (#0F172A). Clean, trustworthy,
tech-forward real estate aesthetic. Generous white space, rounded corners,
soft shadows.

Sections needed, top to bottom:
1. Sticky navbar with logo left, menu (Portofolio, Harga, Cara Kerja, Blog),
   and a blue "Pesan Sesi Foto" CTA button on the right.
2. Hero section: large bold headline about turning properties into
   immersive 360° virtual tours, subheadline mentioning "free SEO-friendly
   listing included", two CTA buttons (primary blue "Pesan Sekarang",
   secondary outline "Lihat Contoh Tour"), and a large embedded 360 tour
   widget preview mockup (styled like a video player with a play/view
   button overlay) on the right or as background.
3. Value proposition row with 4 icon cards: High Quality 360 Photos,
   Free Website Listing, Fast Turnaround, Affordable Pricing.
4. "How it works" horizontal 4-step process with numbered icons: Booking,
   Photo Session, Tour Goes Live, Free Listing & Share.
5. Portfolio grid: 6 property cards with thumbnail, property name,
   location, and a "View Tour" button, in a 3-column responsive grid.
6. Pricing table: 3 tiers (Basic, Pro, Premium) as cards, middle one
   highlighted in blue as "Most Popular".
7. Testimonials carousel with customer photo, name, and quote.
8. FAQ accordion section.
9. Contact/booking form section with fields: Name, Phone, Property Address,
   Property Type dropdown, Preferred Date, dark navy blue background.
10. Footer in dark navy blue with logo, quick links, social icons, and
    contact info.

Mobile-first responsive design, modern sans-serif typography.
```

### 12.2 Dashboard (Admin & Customer)

```
Design a clean SaaS-style dashboard for a 360° virtual tour management
platform, used by both admins and property owners (customers).

Color palette: primary blue (#1D4ED8), dark navy sidebar (#1E3A8A), white
content area (#FFFFFF), light gray background (#F1F5F9), accent light blue
(#60A5FA) for active states and charts, dark slate text (#0F172A).

Layout:
- Left sidebar (dark navy blue) with logo at top, navigation icons + labels:
  Dashboard, My Listings, Leads/Inquiries, Analytics, Settings, Logout.
  Active menu item highlighted with light blue background.
- Top header bar (white) with page title on the left, user avatar and
  notification bell on the right.
- Main content area with light gray background containing:
  1. Row of 4 stat cards at top: Total Views, Total Listings, New Leads
     (this week), Avg. Views per Listing — each card white with a blue
     accent icon and a small trend indicator.
  2. A line chart card showing "Views Over Time" (last 30 days) using
     blue gradient fill.
  3. A table below listing all properties: thumbnail, title, status
     badge (Published/Draft in blue/gray), views count, leads count,
     and an "Edit" button.
  4. A recent leads/inquiries list card on the side showing name, phone,
     message preview, and date.

Rounded cards with soft shadows, generous padding, modern dashboard
aesthetic similar to Linear or Notion but in blue theme. Fully responsive,
sidebar collapses to icons-only on tablet.
```

### 12.3 CMS (Listing Editor / Upload 360)

```
Design a content management interface for uploading and editing a 360°
virtual tour property listing.

Color palette: primary blue (#1D4ED8), white background (#FFFFFF), light
gray section dividers (#F1F5F9), accent light blue (#60A5FA) for active
tabs and buttons, dark slate text (#0F172A).

Layout: a form-based editor page with a sticky top bar showing "New
Listing" title, a status toggle (Draft/Published), and a blue "Save &
Publish" button on the top right.

Below, a two-column layout:
LEFT COLUMN (main form, ~70% width):
1. Basic Info card: Title input, Category dropdown (Rumah, Apartemen,
   Hotel, Ruko, Venue), Address input, City dropdown, Price input.
2. Description card: a rich text editor textarea.
3. Virtual Tour Embed card: a text input field labeled "Panoee Embed
   Code / URL" with a small helper text below it ("Paste the embed
   shortcode from your Panoee tour"), a live preview box below showing
   the embedded tour once a code is pasted, and a separate small image
   upload box labeled "Cover Thumbnail" for manually uploading one
   cover image of the tour.
4. Regular Photo Gallery upload card: a dashed-border drag-and-drop zone
   with a blue cloud upload icon and text "Drag photos here or click to
   upload", below it a horizontal scrollable row of uploaded thumbnail
   previews with drag handles to reorder, each thumbnail has a small
   delete icon.

RIGHT COLUMN (sidebar, ~30% width):
1. SEO card: Meta Title input, Meta Description textarea with character
   counter, URL slug preview.
2. Assign Owner card: a searchable dropdown to select which customer
   account owns this listing.
3. Featured Image selector: grid of small thumbnails to pick the cover
   image.

Clean form styling with blue focus states on inputs, rounded corners,
clear section labels, modern admin-panel aesthetic.
```

### 12.4 Halaman Listing Publik

```
Design a public property listing page featuring an embedded 360° virtual
tour, for a real estate photography brand.

Color palette: primary blue (#1D4ED8) for buttons and accents, white
background (#FFFFFF), dark navy (#1E3A8A) for header/footer, light gray
(#F8FAFC) for section backgrounds, dark slate text (#0F172A).

Layout, top to bottom:
1. Simple top navbar (white, sticky) with logo left and a blue "Pesan
   Jasa Foto 360" button right.
2. Full-width immersive 360° virtual tour section taking up most of the
   top viewport: shown as a large cover image with a centered play/view
   button overlay (facade pattern, tour loads on click), with a small
   "Virtual Tour by [Brand]" watermark badge in the bottom corner linking
   back to the homepage.
3. Below the viewer, a header row: large property title, location with a
   map pin icon, price in bold blue, and three share icon buttons
   (WhatsApp, Copy Link, Facebook) aligned right.
4. Two-column section: LEFT (wide) has "Description" heading with
   paragraph text, and below it a photo gallery grid of supporting
   images. RIGHT (narrow, sticky sidebar) has a "Hubungi Pemilik" contact
   card with Name, Phone, Message form fields and a blue submit button,
   plus an embedded small map showing the property location below the
   form.
5. "Properti Serupa di [Kota]" section: horizontal scrollable row of
   3-4 related listing cards with thumbnail, title, price, "Lihat Tour"
   button.
6. Dark navy footer with brand logo, links, and contact info.

Modern real estate aesthetic, trustworthy and premium feel, mobile-first
responsive, the 360 viewer should feel like the hero/star of the page.
```

---

## 13. Checklist Implementasi & QA Visual

Gunakan sebelum merge/launch tiap halaman:

- [ ] Semua warna pakai token `app/globals.css:3`, tidak ada hex hardcode
- [ ] `rounded-lg` / `rounded-xl` konsisten, `shadow-sm` lembut
- [ ] Tipografi sesuai §3.2, H1 tunggal, H2/H3 berurutan
- [ ] Responsive: cek 375px, 768px, 1024px, 1280px
- [ ] Form focus `ring-primary`, error `text-danger`, pesan Indonesia
- [ ] Empty/loading/error states didesain, bukan halaman kosong
- [ ] Gambar pakai `next/image` + `altText`, thumbnail via `sharp`
- [ ] Viewer listing pakai facade + lazy iframe, tidak block LCP
- [ ] Badge status `PUBLISHED`/`DRAFT` sesuai §5.3
- [ ] Sidebar aktif highlight `accent/20` + `border-accent`
- [ ] Server Component default, `"use client"` hanya untuk interaksi (`docs/CONVENTIONS.md:31`)
- [ ] Aksesibilitas: keyboard focus visible, kontras AA, aria-label untuk icon button
- [ ] SEO: meta title/description unik, slug bersih, canonical, OG image

---

## 14. Referensi Silang

- PRD lengkap: `docs/PRD-Virtual-Tour-360.md:1`
- Design system token: `docs/DESIGN_SYSTEM.md:1`
- Database model: `docs/DATABASE.md:1` + `prisma/schema.prisma:44`
- Arsitektur & storage abstraction: `docs/ARCHITECTURE.md:1`
- Environment & tunnel: `docs/ENVIRONMENT.md`
- Konvensi kode: `docs/CONVENTIONS.md:1`
- Progress tracker: `docs/PROGRESS.md:1` — update setelah tiap modul selesai

---

## 15. Next Steps (disarankan)

1. Generate 4 artboard via Stitch MCP pakai prompt §12 → export.
2. Audit token: pastikan `app/globals.css:3` sudah cover semua warna Stitch; tambah `success/warning/danger` jika belum.
3. Bangun komponen `Button`, `Card`, `Badge`, `Input` dulu — dipakai di semua halaman.
4. Implement Landing → Listing Publik → Dashboard → CMS (urutan roadmap Fase 1 `docs/PRD-Virtual-Tour-360.md:287`).
5. QA visual checklist §13 + Lighthouse (Performance >90, SEO >95, Accessibility >95).

> Catatan biaya/ops: desain ini sengaja tanpa dependensi eksternal berbayar. Viewer 360 sepenuhnya Panoee embed (`docs/PRD-Virtual-Tour-360.md:455`), storage awal volume VPS (`docs/ARCHITECTURE.md:21`), migrasi ke Biznet Gio tinggal ganti `STORAGE_DRIVER` tanpa ubah komponen.
