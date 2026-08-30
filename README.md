# Properti360 — Virtual Tour 360°

Platform virtual tour 360° untuk jasa foto properti bernama **[NamaBisnis]**.
Skeleton **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS v4** — siap dikembangkan.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 — palette biru via CSS variables (`--color-primary` dll)
- Prisma + PostgreSQL
- zod + react-hook-form untuk validasi form/input

## Struktur Folder

```
/app
  /(marketing)      -> landing page & blog nanti
  /(dashboard)
    /admin
    /customer
  /listing/[slug]   -> detail listing + viewer 360°
  /api              -> route handlers
/prisma             -> schema.prisma
/lib                -> utils, db (PrismaClient), env validation
/storage/uploads    -> file upload lokal (di-gitignore, hanya .gitkeep)
/components         -> ui components
```

## Setup Lokal

### 1. Install dependencies

```bash
npm install
```

### 2. Copy env

```bash
cp .env.example .env.local
# lalu isi DATABASE_URL, AUTH_SECRET, RESEND_API_KEY, dll
```

`.env.example` berisi key kosong/bawaan:

```
DATABASE_URL=
AUTH_SECRET=
RESEND_API_KEY=
STORAGE_DRIVER="local"
STORAGE_LOCAL_PATH="./storage/uploads"
```

### 3. Buka SSH tunnel PuTTY ke Postgres Coolify (port 5433)

Di PuTTY: `Connection > SSH > Tunnels`

- Source port: `5433` (atau `5434` sesuai `-L` di `.env.local`)
- Destination: `10.0.1.10:5432` **atau** `v8lmc6i9xwspbwydwenrcxrq:5432`
- Add → Open

Pastikan `DATABASE_URL` di `.env.local` mengarah ke `localhost:5433` (atau `5434`).

Contoh:

```
DATABASE_URL="postgresql://postgres:***@localhost:5433/postgres"
```

> Lihat `docs/inv.txt` (jangan commit) untuk credential asli Coolify.

### 4. Prisma migrate

```bash
npx prisma migrate dev --name init
# atau
npm run prisma:migrate
npx prisma generate
```

### 5. Jalankan dev

```bash
npm run dev
# http://localhost:3000
```

## Palette

Didefinisikan di `app/globals.css` via `@theme` Tailwind v4:

| Token | Hex |
|---|---|
| `primary` | `#1D4ED8` |
| `primary-dark` | `#1E3A8A` |
| `accent` | `#60A5FA` |
| `background` | `#F8FAFC` |
| `foreground` | `#0F172A` |

Pakai konsisten sebagai class Tailwind: `bg-primary`, `text-primary`, `bg-primary-dark`, `bg-accent`, `bg-background`, `text-foreground`, atau via CSS var `var(--color-primary)`.

## Catatan

- Folder `storage/uploads` sudah di-`.gitignore` — hanya `.gitkeep` yang ter-commit.
- Belum ada fitur bisnis — hanya skeleton rapi siap dikembangkan.

---
Generated: 29 Aug 2026
