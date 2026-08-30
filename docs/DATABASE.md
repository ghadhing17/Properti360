# Database Reference — Prisma Schema

> Ini dokumen sumber kebenaran (source of truth) untuk struktur data.
> Kalau AI coding tool perlu menambah field/model baru, **update file ini
> juga**, jangan biarkan `schema.prisma` dan dokumen ini berbeda.

## Ringkasan Model

| Model | Fungsi |
|---|---|
| `User` | Akun admin & customer |
| `Listing` | Data properti yang di-tour 360-kan |
| `Media` | Foto galeri & embed tour 360 (Panoee) per listing |
| `Category` | Kategori properti (Rumah, Apartemen, dst) |
| `Lead` | Pesan masuk dari pengunjung lewat form "Hubungi Pemilik" |
| `BlogPost` | Artikel untuk content SEO |
| `ListingViewLog` | Log harian jumlah view per listing (untuk grafik statistik) |
| `BookingRequest` | Pesan masuk dari form booking jasa foto di landing page |
| `SiteSettings` | Singleton pengaturan situs: profil bisnis + SEO/OG (dikelola /admin/settings) |
| `OperatingHour` | Jam operasional per hari (7 baris: Minggu–Sabtu) untuk batas slot booking |
| `Holiday` | Hari libur (tanggal string "YYYY-MM-DD", opsional berulang tahunan) |
| `ActiveRegion` | Subset provinsi & kab/kota dari Wilayah yang aktif (filter dropdown form) |

## Detail Model

### User
```
id            String    @id @default(cuid())
name          String
email         String    @unique
phone         String?
password      String    // hashed dengan bcrypt
role          Role      // ADMIN | CUSTOMER
isActive      Boolean   @default(true) // false = akun dinonaktifkan admin (gagal login)
createdAt     DateTime  @default(now())
updatedAt     DateTime  @updatedAt
listings      Listing[] // relasi: customer bisa punya banyak listing
```
Catatan: role ADMIN **tidak boleh** bisa dibuat lewat halaman register publik.
Akun nonaktif diblokir saat login (`authorize` cek `isActive`); session JWT lama
tetap valid sampai expire — deaktivasi baru berlaku penuh untuk login berikutnya.

### Listing
```
id                String        @id @default(cuid())
slug              String        @unique
title             String
description       String        @db.Text
propertyType      PropertyType  // RUMAH | APARTEMEN | HOTEL | RUKO | VENUE | LAINNYA
address           String
city              String
price             Int?          // nullable, tidak semua listing tampilkan harga
status            ListingStatus // DRAFT | PUBLISHED
viewCount         Int           @default(0)
ownerId           String
owner             User          @relation(fields: [ownerId], references: [id])
categoryId        String
category          Category      @relation(fields: [categoryId], references: [id])
metaTitle         String?
metaDescription   String?
media             Media[]
leads             Lead[]
viewLogs          ListingViewLog[]
createdAt         DateTime      @default(now())
updatedAt         DateTime      @updatedAt

@@index([slug])
@@index([city])
@@index([status])
@@index([categoryId])
```
Catatan: listing dengan `status = DRAFT` wajib 404 untuk publik (lihat
`CLAUDE.md` aturan #8).

### Media
```
id                String     @id @default(cuid())
listingId         String
listing           Listing    @relation(fields: [listingId], references: [id])
type              MediaType  // PANOEE_TOUR | PHOTO | VIDEO
url               String?    // untuk PHOTO/VIDEO, path relatif lewat storage abstraction
panoeeEmbedUrl    String?    // untuk PANOEE_TOUR
panoeeShortcode   String?    @db.Text
thumbnailUrl      String?
altText           String?    // wajib diisi untuk SEO, auto-generate kalau kosong
order             Int        @default(0)
createdAt         DateTime   @default(now())
```
Catatan: satu listing biasanya punya 1 record `PANOEE_TOUR` + banyak record
`PHOTO` untuk galeri pendukung.

### Category
```
id        String     @id @default(cuid())
name      String     @unique
slug      String     @unique
listings  Listing[]
```

### Lead
```
id          String    @id @default(cuid())
listingId   String
listing     Listing   @relation(fields: [listingId], references: [id])
name        String
phone       String
message     String    @db.Text
createdAt   DateTime  @default(now())
```

### BlogPost
```
id                String     @id @default(cuid())
slug              String     @unique
title             String
content           String     @db.Text
coverImage        String?
metaTitle         String?
metaDescription   String?
publishedAt       DateTime?  // null = masih draft
createdAt         DateTime   @default(now())
updatedAt         DateTime   @updatedAt
```

### ListingViewLog
```
id          String    @id @default(cuid())
listingId   String
listing     Listing   @relation(fields: [listingId], references: [id])
date        DateTime  @db.Date
count       Int       @default(0)

@@unique([listingId, date])
```
Dipakai untuk grafik "Views 30 Hari Terakhir" di dashboard admin & customer.

### BookingRequest
```
id              String    @id @default(cuid())
name            String
phone           String
address         String
propertyType    String
preferredDate   DateTime?
status          String    @default("NEW") // NEW | CONTACTED | DONE
createdAt       DateTime  @default(now())
```
Ini terpisah dari `Lead` — `Lead` adalah pesan ke pemilik listing tertentu,
`BookingRequest` adalah orang yang mau **order jasa foto 360** lewat landing
page (belum tentu jadi listing).

### SiteSettings (singleton, id=1)
```
id              Int     @id @default(1)
siteName        String  @default("Properti 360")
tagline         String?
description     String? @db.Text
contactEmail    String?
contactPhone    String?
whatsapp        String?
address         String? @db.Text
instagramUrl    String?
facebookUrl     String?
metaTitle       String?   // fallback judul situs
metaDescription String?   // fallback description situs
ogTitle         String?
ogDescription   String?
ogImage         String?   // URL (biasanya /uploads/settings/og/<uuid>.jpg)
updatedAt       DateTime  @updatedAt
```
Dibaca oleh `generateMetadata` root layout (OG situs) dan dipakai di
`/admin/settings` tab "Umum" & "SEO & OG". Query via `getSiteSettings()` yang
auto-create baris default. Upload OG image wajib lewat `shared/storage`.

### OperatingHour (7 baris tetap)
```
id          Int     @id @default(autoincrement())
dayOfWeek   Int     @unique // 0=Minggu .. 6=Sabtu (Date.getDay())
isClosed    Boolean @default(false) // default seed: Minggu tutup
openTime    String  @default("09:00") // "HH:MM"
closeTime   String  @default("16:00")
```
Dipakai `shared/lib/schedule-settings.ts` untuk memvalidasi slot booking
(API available-slots, action booking landing, action admin bookings).
Hari tutup: openTime/closeTime tetap tersimpan tapi diabaikan.

### Holiday
```
id          String   @id @default(cuid())
date        String   @unique @db.VarChar(10) // "YYYY-MM-DD" (lokal, bukan UTC)
name        String
isRecurring Boolean  @default(false) // true = berulang tiap tahun (MM-DD saja)
createdAt   DateTime @default(now())
```
`date` sengaja string (bukan DateTime) agar bebas masalah timezone.
Slot booking pada tanggal libur otomatis ditutup.

### ActiveRegion
```
id    String @id @default(cuid())
code  String @unique // kode Wilayah: "32" (prov) atau "32.73" (kab/kota)
name  String // denormalisasi dari Wilayah.nama saat disimpan
level String // "PROVINCE" | "REGENCY"
```
Subset wilayah aktif dari tabel `Wilayah` (Kepmendagri) — dikelola via
`/admin/settings` tab "Wilayah". Dipakai `/api/wilayah` untuk memfilter
dropdown provinsi & kab/kota (form listing admin/customer + form lead).
Aturan:
- Tabel **kosong = semua wilayah aktif** (fallback; auto-seed semua provinsi
  + kab/kota saat pertama diakses jika Wilayah sudah ter-seed).
- Kab/kota hanya boleh aktif jika provinsi induknya aktif (divalidasi di
  action `updateActiveRegions`).
- Mode `?kode` (prefill) & `?codes` (resolve nama) TIDAK difilter — listing
  lama di wilayah nonaktif tetap tampil & bisa diedit.

## Enum

```
enum Role { ADMIN CUSTOMER }
enum PropertyType { RUMAH APARTEMEN HOTEL RUKO VENUE LAINNYA }
enum ListingStatus { DRAFT PUBLISHED }
enum MediaType { PANOEE_TOUR PHOTO VIDEO }
```

## Migration

Development: `npx prisma migrate dev --name <deskripsi_perubahan>`
Production (lewat Coolify terminal/exec): `npx prisma migrate deploy`
(JANGAN pernah `migrate dev` langsung di production).
