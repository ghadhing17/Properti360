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

## Detail Model

### User
```
id            String    @id @default(cuid())
name          String
email         String    @unique
phone         String?
password      String    // hashed dengan bcrypt
role          Role      // ADMIN | CUSTOMER
createdAt     DateTime  @default(now())
updatedAt     DateTime  @updatedAt
listings      Listing[] // relasi: customer bisa punya banyak listing
```
Catatan: role ADMIN **tidak boleh** bisa dibuat lewat halaman register publik.

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
