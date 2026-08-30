# Design System — [NamaBisnis]

## Color Palette

Definisikan sebagai CSS variable / Tailwind theme extend, JANGAN hardcode
hex code langsung di komponen.

| Token | Hex | Pemakaian |
|---|---|---|
| `primary` | `#1D4ED8` | Tombol utama, link aktif, elemen CTA |
| `primary-dark` | `#1E3A8A` | Sidebar, footer, navbar dark section |
| `accent` | `#60A5FA` | Highlight, active state, badge, chart |
| `background` | `#F8FAFC` | Background halaman umum |
| `surface` | `#FFFFFF` | Background card/panel |
| `foreground` | `#0F172A` | Warna teks utama |
| `muted` | `#64748B` | Teks sekunder/deskripsi kecil |
| `border` | `#E2E8F0` | Garis pembatas, input border |
| `success` | `#16A34A` | Status published, konfirmasi sukses |
| `warning` | `#F59E0B` | Status draft, peringatan |
| `danger` | `#DC2626` | Tombol hapus, error |

Contoh Tailwind config extend:
```js
colors: {
  primary: { DEFAULT: '#1D4ED8', dark: '#1E3A8A' },
  accent: '#60A5FA',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  foreground: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
}
```

## Tipografi

- Font: sans-serif modern (misal Inter atau font default sistem), load via
  `next/font` untuk performa.
- Skala ukuran:
  - Heading 1 (hero landing page): `text-4xl md:text-5xl font-bold`
  - Heading 2 (judul section): `text-2xl md:text-3xl font-semibold`
  - Heading 3 (judul card/subsection): `text-lg font-semibold`
  - Body: `text-base text-foreground`
  - Small/caption: `text-sm text-muted`

## Pola Komponen

### Tombol
- Primary: background `primary`, teks putih, `rounded-lg`, `hover:bg-primary-dark`
- Secondary/outline: border `primary`, teks `primary`, background transparan
- Danger: background `danger`, teks putih — khusus aksi hapus/destructive

### Card
- Background `surface`, `rounded-xl`, `shadow-sm`, padding `p-4` atau `p-6`
- Hover state (untuk card yang clickable): `hover:shadow-md transition-shadow`

### Badge Status
- `PUBLISHED` → background `success`/10, teks `success`
- `DRAFT` → background `warning`/10, teks `warning`
- Bentuk: `rounded-full px-2 py-0.5 text-xs font-medium`

### Sidebar (Dashboard Admin/Customer)
- Background `primary-dark`, teks putih/abu terang
- Menu aktif: background `accent`/20, teks putih, border-left aksen `accent`

### Form Input
- Border `border`, `rounded-lg`, focus state: `focus:ring-2 focus:ring-primary`
- Label di atas input, `text-sm font-medium text-foreground`
- Pesan error: `text-sm text-danger` di bawah input terkait

## Prinsip Umum

- Banyak whitespace, jangan padat — kesan profesional & terpercaya untuk
  konteks properti/real estate.
- Rounded corners konsisten (`rounded-lg` untuk elemen umum, `rounded-xl`
  untuk card besar).
- Shadow lembut (`shadow-sm`/`shadow-md`), hindari shadow terlalu tebal.
- Mobile-first: desain & test di layar kecil dulu, baru breakpoint besar.
