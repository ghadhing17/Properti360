# SEO Checklist

> Dipakai sebagai acceptance criteria saat mengerjakan/mereview halaman
> publik (landing page, listing, blog). Centang tiap kali sebuah halaman
> baru dibuat, jangan anggap fitur selesai kalau item di sini belum lolos.

## Technical SEO

- [ ] Halaman render sebagai Server Component (bukan `"use client"` di
      level page) supaya konten ter-crawl penuh
- [ ] `generateMetadata()` diisi lengkap: title, description, canonical URL
- [ ] Open Graph tags diisi (og:title, og:description, og:image)
- [ ] JSON-LD structured data terpasang (`RealEstateListing`/`Product` untuk
      listing, `Organization` untuk root layout, `Article` untuk blog post)
- [ ] `app/sitemap.ts` otomatis include halaman ini kalau statusnya published
- [ ] `app/robots.ts` allow crawl untuk halaman publik, disallow untuk
      `/admin`, `/customer`, `/api`
- [ ] Semua gambar pakai `next/image` dengan width/height benar (hindari
      layout shift / Core Web Vitals CLS)
- [ ] Iframe Panoee TIDAK ter-render saat initial load — wajib facade
      pattern (cover image + klik untuk load), lihat `CLAUDE.md` aturan #6
- [ ] URL bersih & deskriptif (slug dari title, bukan ID angka)

## On-Page SEO

- [ ] Meta title unik per halaman, format: `{Judul} - Virtual Tour 360° | [NamaBisnis]`
- [ ] Meta description unik, informatif, mengandung kata kunci lokasi/jenis
      properti relevan
- [ ] Semua `<img>`/`next/image` punya `alt` text deskriptif (bukan kosong
      atau generic "image")
- [ ] Heading hierarchy benar: H1 sekali per halaman (judul listing/artikel),
      H2 untuk section, tidak loncat level (H1 langsung ke H3)
- [ ] Internal linking: listing link ke "Properti Serupa", blog link ke
      listing terkait kalau relevan

## Content SEO

- [ ] Setiap listing published otomatis masuk sitemap tanpa aksi manual
- [ ] Blog post punya kategori/tag yang konsisten untuk internal linking
- [ ] Watermark/badge "Virtual Tour by [NamaBisnis]" ada di halaman listing
      dan link balik ke homepage (bagus untuk branding saat listing di-share)

## Local SEO (dikerjakan di luar codebase, tapi dicatat di sini)

- [ ] Google Business Profile sudah setup & terverifikasi
- [ ] NAP (Nama, Alamat, No Telepon) konsisten antara website & GBP
- [ ] Google Search Console terhubung & sitemap sudah di-submit

## Performance (terkait SEO lewat Core Web Vitals)

- [ ] Lighthouse score halaman listing minimal 80+ untuk Performance & SEO
      (cek sebelum menganggap halaman selesai)
- [ ] Tidak ada render-blocking script yang tidak perlu di halaman publik
- [ ] Font di-load lewat `next/font` (hindari layout shift dari web font)
