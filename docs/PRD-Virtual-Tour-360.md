# PRD — Platform Virtual Tour 360° [NamaBisnis]

**Versi:** 1.1 (revisi: arsitektur cost-minimal, self-hosted di VPS sendiri)
**Tanggal:** 29 Agustus 2026
**Pemilik Produk:** [Nama Kamu]

---

## 1. Ringkasan Produk

[NamaBisnis] adalah jasa fotografi virtual tour 360° untuk properti (rumah dijual/disewa, hotel, venue, kantor, dsb). Setiap customer yang memakai jasa foto 360 otomatis mendapat:

1. Virtual tour 360° yang di-hosting di platform ini
2. Listing publik gratis di website [NamaBisnis] yang bisa mereka share ke calon pembeli/penyewa
3. Akses dashboard sederhana untuk memantau listing mereka (jumlah view, edit deskripsi, kontak)

Platform terdiri dari 4 bagian utama:

| Bagian | Fungsi | Pengguna |
|---|---|---|
| **Landing Page** | Marketing, showcase portofolio, konversi jadi order jasa foto | Calon customer (pemilik properti, agen) |
| **Dashboard** | Kelola listing sendiri (customer) & kelola semua data (admin/kamu) | Customer & Admin |
| **CMS** | Input/edit listing baru, upload tour 360, atur kategori, kelola konten blog untuk SEO | Admin (kamu/tim) |
| **Halaman Listing** | Halaman publik per properti, berisi viewer 360, galeri, kontak, dioptimasi SEO | Publik (calon buyer/renter) |

---

## 2. Tujuan Produk

**Tujuan bisnis:**
- Menjadi alat marketing utama yang membuat customer memilih jasa foto 360 kamu dibanding kompetitor (nilai tambah: "gratis listing SEO-friendly")
- Setiap listing customer jadi backlink/traffic generator organik untuk website [NamaBisnis] → makin banyak listing, makin kuat domain authority, makin banyak leads baru masuk lewat SEO

**Metrik sukses (contoh, sesuaikan target):**
- Jumlah listing aktif per bulan
- Organic traffic ke halaman listing (Google Search Console)
- Conversion rate landing page → form order jasa
- Rata-rata view per listing (bukti value ke customer, alat retensi)
- Waktu upload tour 360 baru sampai listing live (target < 15 menit dari sisi admin)

**Non-goals (di luar scope v1):**
- Tidak membangun marketplace transaksi jual-beli properti (bukan platform seperti Rumah123)
- Tidak ada sistem pembayaran/booking online untuk properti (hanya kontak langsung ke pemilik/agen)
- Tidak multi-tenant untuk fotografer lain (ini platform single-brand, bukan SaaS — bisa jadi fase 2)

---

## 3. Persona Pengguna

1. **Pemilik Properti / Agen (Customer)** — order jasa foto 360, butuh cara mudah share properti, ingin listingnya cepat naik di Google, tidak terlalu paham teknis.
2. **Calon Pembeli/Penyewa (Pengunjung Publik)** — datang dari share link atau Google Search, ingin lihat properti secara virtual sebelum survei langsung, browsing dari HP.
3. **Admin (Kamu/Tim)** — upload hasil foto 360, input data listing, kelola semua customer, pantau performa web.

---

## 4. Tech Stack Rekomendasi

Prioritas kamu: **reliable, robust, bisa develop lokal tanpa Docker**. Berikut stack yang direkomendasikan — semuanya jalan dengan `npm install` biasa, tanpa container.

### 4.1 Ringkasan Stack

| Layer | Pilihan | Alasan |
|---|---|---|
| Framework Utama | **Next.js 15 (App Router) + TypeScript** | Full-stack dalam satu repo (frontend + API routes jadi satu), SSR/SSG native → SEO bagus, ekosistem paling matang |
| Styling | **Tailwind CSS v4** | Cepat develop UI konsisten, ringan, gampang di-maintain sendiri |
| Database | **PostgreSQL** — disediakan **Coolify** sebagai managed service (container) di VPS kamu sendiri | Coolify provision Postgres lewat UI-nya (tinggal klik "New Resource" → Postgres), dapat connection string otomatis. Secara default hanya bisa diakses dari dalam jaringan Docker Coolify (internal), tidak exposed ke publik. Akses dari PC lokal untuk development pakai **SSH tunnel via PuTTY** (lihat 4.2) |
| ORM | **Prisma** | Type-safe query, migration terkontrol, gampang generate admin queries |
| Auth | **Auth.js (NextAuth v5)** | 100% gratis, open-source, self-hosted bareng aplikasi, tidak ada biaya per-user seperti Clerk — cocok untuk minimalkan biaya |
| Storage Foto (MVP) | **Persistent Volume Coolify** di VPS sendiri (misal dipetakan ke `/data/[app]/uploads` di host) | $0 biaya tambahan untuk MVP. Foto galeri disimpan di disk VPS lewat volume yang dikonfigurasi di Coolify (App → Storage → Add Volume), supaya data tidak hilang tiap kali container di-redeploy. **Catatan penting:** bangun sejak awal lewat *storage abstraction layer* (lihat 4.4) supaya nanti gampang pindah ke object storage tanpa rombak kode |
| Storage Foto (Fase Lanjut) | **Biznet Gio Neo Object Storage** (S3-compatible) | Dipakai nanti kalau storage VPS mulai penuh atau butuh CDN/reliability lebih tinggi. Karena S3-compatible, migrasinya tinggal ganti implementasi adapter storage, bukan tulis ulang fitur upload |
| 360° Viewer | **Panoee** (embed shortcode/iframe) | Tour 360 dibuat & di-host sepenuhnya di Panoee. Platform kita cukup simpan embed code/URL dari Panoee, tidak perlu storage atau render viewer sendiri |
| Image Processing | **sharp** (library Node) | Generate thumbnail otomatis untuk foto galeri pendukung |
| Email Transaksional | **Resend** (free tier 3000 email/bulan) | Kirim notifikasi lead masuk, welcome email ke customer baru |
| Analytics | **Google Analytics 4** + **Google Search Console** | Gratis, wajib untuk tracking SEO performance |
| Hosting/Deploy | **Coolify** di VPS kamu sendiri (self-hosted PaaS) | Coolify berjalan di VPS dan mengelola container Docker **di sisi server** — bukan di PC kamu, jadi tetap sesuai keinginan awal "tanpa Docker di laptop". Coolify otomatis handle: build & deploy dari Git, reverse proxy, SSL gratis (Let's Encrypt), provisioning Postgres sebagai managed service, dan auto-restart kalau container crash. Tidak ada tagihan Vercel/Neon/Supabase/R2 sama sekali |

### 4.2 Setup Lokal via SSH Tunnel (PuTTY) ke Postgres Coolify

Postgres yang di-provision Coolify secara default hanya bisa diakses dari dalam jaringan internal VPS. Begini cara akses dari PC lokal (Windows + PuTTY) tanpa install Postgres sama sekali:

**Cari info koneksi Postgres di Coolify:**
1. Buka dashboard Coolify → resource Postgres yang sudah dibuat
2. Catat **port** yang di-expose ke host VPS (Coolify biasanya kasih opsi "Public Port" atau port mapping, misal `5432` atau port acak — cek di tab Configuration/General resource tersebut), plus username, password, dan nama database

**Setup tunnel di PuTTY:**
1. Buka PuTTY → di **Session**, isi Host Name dengan IP VPS kamu, Port `22`
2. Pindah ke **Connection → SSH → Tunnels**
3. Isi **Source port**: `5433` (bebas, ini port lokal di PC kamu)
4. Isi **Destination**: `localhost:[port-postgres-coolify]` (misal `localhost:5432`)
5. Pilih **Local**, klik **Add**
6. Kembali ke **Session**, klik **Open**, login SSH seperti biasa (biarkan jendela PuTTY ini tetap terbuka selama development)

**Di `.env.local` project Next.js:**
```
DATABASE_URL="postgresql://user_dari_coolify:password_dari_coolify@localhost:5433/nama_db"
```

Prisma di lokal akan mengira konek ke Postgres di `localhost:5433`, padahal sebenarnya tembus lewat tunnel PuTTY ke Postgres yang jalan di container Coolify. **Tidak ada instalasi Postgres maupun Docker apapun di PC kamu.**

> Tips: simpan konfigurasi tunnel ini di PuTTY sebagai "Saved Session" (isi nama sesi lalu klik Save di tab Session) supaya tidak perlu setting ulang tiap kali mau develop.

### 4.3 Deployment Production (Coolify)

Karena Coolify yang mengurus orkestrasi container, alur deploy jadi jauh lebih simpel dibanding setup manual PM2/Nginx:

1. **Hubungkan repo Git** (GitHub/GitLab) ke Coolify — Coolify bisa auto-build pakai Nixpacks (deteksi otomatis project Next.js) atau `Dockerfile` custom kalau kamu mau kontrol penuh
2. **Set environment variables** di Coolify (connection string database internal, secret Auth.js, dsb) lewat UI-nya
3. **Konfigurasi Persistent Volume** untuk folder upload (misal container path `/app/storage/uploads` ↔ host path tertentu) — **wajib** dilakukan sebelum go-live, supaya foto customer tidak hilang saat ada redeploy
4. **Reverse proxy & SSL** sudah otomatis ditangani Coolify (berbasis Traefik/Caddy di baliknya) — tinggal arahkan domain kamu ke Coolify dan aktifkan Let's Encrypt lewat UI, tidak perlu konfigurasi Nginx manual
5. **Auto-deploy on push** — bisa diaktifkan supaya tiap push ke branch `main` otomatis ter-deploy

Alur trafik: `User → Coolify Proxy (SSL) → Container Next.js app → Container Postgres (internal Docker network) + Volume uploads (disk VPS)`

### 4.4 Storage Abstraction Layer (Penting untuk Migrasi Nanti)

Supaya nanti gampang pindah dari filesystem VPS ke **Biznet Gio Neo Object Storage** (S3-compatible) tanpa bongkar fitur upload, buat 1 file abstraksi sejak awal, misal `lib/storage.ts`, dengan interface seperti:

```ts
interface StorageAdapter {
  upload(file: Buffer, path: string): Promise<string>; // return URL
  delete(path: string): Promise<void>;
  getUrl(path: string): string;
}
```

Buat 2 implementasi:
- `LocalDiskStorage` — implementasi awal, `fs.writeFile` ke path volume yang sudah di-mount Coolify (misal `/app/storage/uploads` di dalam container)
- `S3CompatibleStorage` — implementasi nanti, pakai `@aws-sdk/client-s3` yang tinggal diarahkan ke endpoint Biznet Gio (karena S3-compatible, SDK AWS bisa dipakai langsung, tinggal ganti `endpoint`, `accessKeyId`, `secretAccessKey`)

Semua kode upload di CMS memanggil `storage.upload()` tanpa peduli implementasi di baliknya — jadi saat pindah nanti, cukup ganti 1 file ini + environment variable, tidak perlu sentuh halaman/komponen lain.

### 4.5 Struktur Folder (Next.js App Router)

```
/app
  /(marketing)          → landing page, blog SEO
  /(dashboard)
    /admin              → CMS & admin dashboard
    /customer           → dashboard customer
  /listing/[slug]        → halaman listing publik
  /api                   → API routes (upload, leads, auth)
/prisma
  schema.prisma
/lib
  db.ts, auth.ts, storage.ts   → storage.ts = abstraction layer (lihat 4.4)
/storage
  /uploads               → folder ini di-mount sebagai Persistent Volume
                           Coolify (bukan sekadar folder lokal biasa),
                           BUKAN di-commit ke git — kalau tidak di-mount
                           sebagai volume, data hilang tiap redeploy
/components
/public
```

---

## 5. Data Model (Inti)

```
User          → id, name, email, role (admin/customer), phone
Listing       → id, slug, title, description, propertyType, address,
                city, price, status (draft/published), ownerId (User),
                viewCount, createdAt
Media         → id, listingId, type (panoeeTour/photo/video), url
                (untuk foto/video biasa) ATAU panoeeEmbedUrl +
                panoeeShortcode (untuk tour 360), thumbnailUrl
                (cover image tour, bisa manual upload atau screenshot
                dari Panoee), order
Category      → id, name (Rumah, Apartemen, Hotel, Ruko, Venue...)
Lead          → id, listingId, name, phone, message, createdAt
BlogPost      → id, slug, title, content, coverImage, publishedAt (untuk SEO)
```

Relasi: 1 Listing bisa punya banyak Media (multi-scene tour), 1 Listing dipunya 1 User (customer), 1 Listing bisa punya banyak Lead (yang menghubungi lewat form).

---

## 6. Modul & Fitur Detail

### 6.1 Landing Page

**Tujuan:** konversi pengunjung jadi order jasa foto 360.

Section yang dibutuhkan:
1. **Hero** — headline kuat + CTA ("Pesan Sesi Foto 360" / "Lihat Portofolio"), background bisa embed 1 virtual tour contoh
2. **Value Proposition** — 3-4 poin kenapa pakai jasa ini (kualitas, gratis listing SEO, harga, area jangkauan)
3. **Cara Kerja** — 3-4 langkah simpel (booking → sesi foto → tour live → dapat listing gratis)
4. **Portofolio/Contoh Tour** — grid listing terbaru yang bisa langsung diklik untuk lihat tour aslinya (sekaligus jadi social proof)
5. **Paket Harga** — tabel paket (misal: Basic, Pro, Premium) beserta fitur (jumlah scene, drone, dsb)
6. **Testimoni** — dari customer sebelumnya
7. **FAQ** — pertanyaan umum (berapa lama proses, area coverage, dsb)
8. **Form Kontak/Booking** — nama, no HP, alamat properti, jenis properti, jadwal
9. **Footer** — link ke semua listing/kategori (bagus untuk internal linking SEO)

### 6.2 Dashboard

**Dashboard Customer** (role: customer)
- Lihat listing miliknya + status (draft/published)
- Statistik: total view, view 7 hari terakhir, jumlah lead masuk
- Edit info dasar: deskripsi, harga, kontak yang ditampilkan
- Download/share link + QR code listing
- Lihat daftar leads yang masuk (nama, no HP, pesan)

**Dashboard Admin** (role: admin — kamu)
- Semua fitur customer dashboard, plus:
- Kelola semua user & listing (approve/publish, edit, hapus)
- Upload media 360 baru ke listing
- Kelola kategori & lokasi
- Kelola konten blog (untuk SEO)
- Analytics ringkas semua listing (total view keseluruhan, listing terpopuler)
- Export data leads ke CSV

### 6.3 CMS (Content Management untuk Listing)

Ini bagian inti operasional harian kamu. Alur input listing baru:

1. **Buat listing baru** — isi judul, kategori, alamat, deskripsi, harga
2. **Input Virtual Tour (Panoee)** — proses tour 360 (upload foto, atur scene/hotspot) dilakukan di dashboard Panoee seperti biasa. Setelah tour selesai, admin tinggal **copy embed shortcode/URL dari Panoee** dan paste ke field "Panoee Embed Code" di form listing ini. Sistem akan otomatis membungkusnya jadi iframe responsive di halaman listing. Admin juga upload 1 gambar cover/thumbnail manual (screenshot tour) untuk dipakai di kartu listing & OG image share.
3. **Upload foto galeri pendukung** — drag & drop foto biasa (non-360), sistem otomatis generate thumbnail (pakai `sharp`)
4. **Set SEO fields per listing** — meta title, meta description, alt text foto (bisa auto-generate dari data listing, tapi tetap bisa di-override manual)
5. **Assign ke customer** — pilih/undang user pemilik listing supaya bisa akses dashboard-nya sendiri
6. **Publish** — listing langsung live di `/listing/[slug]`, otomatis masuk sitemap

CMS juga meng-handle:
- Manajemen kategori & kota (untuk struktur URL & filter)
- Editor blog post (untuk artikel SEO pendukung, misal "5 Alasan Pakai Virtual Tour Saat Jual Rumah")
- Media library terpusat (semua file yang pernah diupload)

### 6.4 Halaman Listing Publik

Ini halaman yang paling sering diakses & paling penting untuk SEO. Struktur:

1. **360° Virtual Tour** full-width di atas — embed iframe dari Panoee (pakai shortcode yang diinput admin di CMS). Iframe di-*lazy load* (baru dimuat saat elemen masuk viewport, atau pakai pola "klik untuk load" dengan gambar cover sebagai facade) supaya tidak membebani waktu load awal halaman
2. **Judul + Lokasi + Harga**
3. **Tombol Share** (WhatsApp, Copy Link, Facebook) — penting karena ini yang bikin customer suka share
4. **Deskripsi properti**
5. **Galeri foto pendukung** (foto biasa selain 360)
6. **Info kontak / Form "Hubungi Pemilik"** → masuk ke tabel Lead
7. **Peta lokasi** (embed Google Maps)
8. **Listing serupa** (internal linking, "Properti Lain di [Kota]")
9. **Watermark/badge kecil "Virtual Tour by [NamaBisnis]"** dengan link balik ke landing page — ini penting supaya listing yang di-share jadi marketing gratis buat kamu

---

## 7. SEO Strategy

### 7.1 Technical SEO
- Semua halaman listing & blog di-render **SSR/SSG** (Next.js) — bukan client-side rendering, supaya Google bisa crawl konten penuh
- **Sitemap otomatis** (`next-sitemap`) yang update setiap ada listing baru
- **robots.txt** yang benar (allow crawl listing & blog, disallow dashboard/admin)
- **Structured Data (JSON-LD)** pakai schema `RealEstateListing` / `Product` + `AggregateRating` kalau ada review, supaya bisa muncul rich snippet di Google
- **Core Web Vitals** — karena tour di-embed via iframe pihak ketiga (Panoee), wajib pakai *lazy loading* (`loading="lazy"` pada iframe, atau facade pattern: tampilkan gambar cover dulu, iframe baru di-render setelah user klik "Lihat Tour 360"). Ini penting supaya iframe eksternal tidak memperlambat skor LCP/CLS halaman
- **Catatan khusus SEO iframe:** konten *di dalam* iframe Panoee tidak ikut ter-index Google sebagai teks (karena berada di domain Panoee, bukan domain kita). Karena itu, semua kekuatan SEO listing harus datang dari **teks di sekitar iframe** — judul, deskripsi properti, alamat, dan alt text foto galeri pendukung. Jangan sampai halaman listing kosong konten teks hanya mengandalkan embed tour
- URL bersih & deskriptif: `/listing/rumah-2-lantai-semarang-tembalang` (bukan `/listing/123`)
- Canonical tag di tiap halaman listing untuk hindari duplicate content

### 7.2 On-Page SEO
- Meta title & description unik tiap listing (template: `{Judul Properti} - Virtual Tour 360° | [NamaBisnis]`)
- Alt text di semua gambar (deskriptif, mengandung kata kunci lokasi/jenis properti)
- Heading hierarchy yang benar (H1 = judul listing, H2 = section deskripsi/lokasi)
- Internal linking antar listing sejenis & antar listing-blog

### 7.3 Content SEO (Blog)
- Artikel pendukung seputar properti & virtual tour (target keyword long-tail seperti "jasa foto 360 [kota]", "virtual tour rumah dijual")
- Setiap listing customer = konten baru yang terindex → strategi "growth engine" karena makin banyak customer, makin banyak halaman ter-index otomatis

### 7.4 Local SEO
- Setup & optimasi **Google Business Profile**
- NAP (Nama, Alamat, No Telepon) konsisten di semua halaman & GBP
- Dorong customer kasih review Google setelah listing live

---

## 8. Non-Functional Requirements

- **Performance:** halaman listing harus load < 3 detik di koneksi 4G, viewer 360 lazy-load
- **Security:** semua endpoint upload & dashboard butuh auth, validasi file upload (tipe & ukuran), rate limit form leads (hindari spam)
- **Scalability:** desain data model harus siap untuk ribuan listing tanpa refactor besar (index kolom slug, city, category)
- **Mobile-first:** mayoritas pengunjung dari HP → semua UI wajib responsive
- **Backup:** Coolify punya fitur **scheduled backup** bawaan untuk resource database (aktifkan ini dari UI Coolify untuk Postgres, arahkan hasil backup ke storage terpisah kalau memungkinkan). Untuk **volume uploads foto**, ini biasanya di luar cakupan backup otomatis Coolify untuk database — tetap perlu cron job terpisah (`tar`/`rsync`) untuk backup folder volume tersebut ke lokasi lain (disk tambahan, atau nanti ke Biznet Gio Object Storage sebagai off-site backup). Jangan andalkan satu VPS itu sendiri sebagai satu-satunya salinan data
- **Keamanan VPS:** firewall (`ufw`) hanya buka port yang perlu (80/443 untuk web, 22 untuk SSH — idealnya pakai key-based auth), jangan expose port Postgres Coolify ke publik (biarkan hanya bisa diakses via SSH tunnel/internal Docker network), update Coolify & OS secara rutin, pertimbangkan `fail2ban` untuk proteksi brute-force SSH

---

## 9. Roadmap Bertahap

| Fase | Fokus |
|---|---|
| **Fase 1 (MVP)** | Landing page, CMS dasar (input listing + upload 360), halaman listing publik, SEO basic |
| **Fase 2** | Dashboard customer (statistik & edit), form leads, email notifikasi |
| **Fase 3** | Blog CMS untuk konten SEO, analytics dashboard admin lebih lengkap |
| **Fase 4 (opsional)** | Multi-scene tour dengan hotspot antar ruangan, drone/video 360, program referral customer |

---

## 10. Prompt Google Stitch (per Halaman)

Google Stitch generate UI dari prompt teks. Gunakan prompt di bawah ini apa adanya (copy-paste), sudah disetel dengan **color palette biru** yang konsisten di semua halaman. Palet: primary blue `#1D4ED8`, dark blue `#1E3A8A`, accent light blue `#60A5FA`, background putih/abu muda `#F8FAFC`, teks gelap `#0F172A`.

### 10.1 Prompt — Landing Page

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

### 10.2 Prompt — Dashboard (Admin & Customer)

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

### 10.3 Prompt — CMS (Listing Editor / Upload 360)

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

### 10.4 Prompt — Halaman Listing Publik

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

## 11. Catatan Implementasi Tambahan

- Karena tour 360 sepenuhnya di-host di Panoee, multi-scene/hotspot antar-ruangan sudah otomatis ditangani di sisi Panoee — platform kita cukup menyimpan 1 embed code per listing, tidak perlu logic tambahan untuk itu.
- Cek batasan akun Panoee yang dipakai (jumlah tour aktif, storage, watermark Panoee sendiri di free/basic plan) karena ini akan membatasi berapa banyak listing yang bisa live bersamaan — sesuaikan dengan proyeksi jumlah customer per bulan.
- Selalu simpan juga **link langsung ke tour di Panoee** (bukan cuma embed code) di database, supaya kalau suatu saat pindah provider viewer 360 lain, migrasi data lebih mudah dilacak.
- Pertimbangkan watermark kecil tambahan di halaman listing (bukan di foto, karena foto sudah di-host Panoee) — misalnya badge "Virtual Tour by [NamaBisnis]" di sekitar embed — untuk proteksi branding & marketing pasif saat listing di-share/screenshot.
- **Trade-off arsitektur single-VPS (perlu disadari):** App, database, dan storage jadi satu titik kegagalan (single point of failure) — kalau VPS down, seluruh layanan down bareng, termasuk semua listing customer yang sudah di-share ke publik. Coolify membantu mengurangi sebagian risiko operasional (auto-restart container, rollback deployment gampang, UI monitoring resource), tapi tidak menghilangkan risiko VPS itu sendiri down. Untuk MVP ini acceptable risk demi biaya minimal, tapi pastikan: (1) backup rutin ke lokasi terpisah seperti disebut di NFR, (2) monitoring uptime sederhana (misal UptimeRobot, gratis) supaya kamu cepat tahu kalau server down, (3) sudah punya rencana "kapan waktunya upgrade" — misal saat jumlah listing publik sudah cukup banyak dan downtime mulai berdampak nyata ke bisnis, baru pisahkan storage ke Biznet Gio Object Storage dan/atau pindahkan DB ke managed Postgres atau VPS kedua.
- Kalau VPS kamu sudah dekat kapasitas disk karena foto makin banyak, migrasi ke Biznet Gio Object Storage bisa dilakukan bertahap: foto baru langsung upload ke object storage, foto lama tetap di VPS sampai ada waktu migrasi batch — tidak perlu migrasi big-bang sekaligus.
- Domain & hosting terpisah dari layanan foto: pastikan domain listing memakai domain utama [NamaBisnis] (bukan subdomain pihak ketiga) supaya semua SEO juice terkumpul di satu domain.
