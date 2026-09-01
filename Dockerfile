# Properti360 — Next.js 15 + Prisma + PostgreSQL
# Optimized multi-stage Dockerfile untuk Coolify (single container)
# Base: Debian slim — kompatibel penuh dengan Prisma & sharp (tanpa musl issue)

# ──────────────────────────────────────────────
# Stage 1: base — shared
# ──────────────────────────────────────────────
FROM node:20-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# ──────────────────────────────────────────────
# Stage 2: deps — install dependencies
# ──────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ──────────────────────────────────────────────
# Stage 3: builder — prisma generate + next build
# ──────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1
RUN npx prisma generate
RUN npm run build

# ──────────────────────────────────────────────
# Stage 4: runner — production image minimal
# ──────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 --ingroup nodejs nextjs

# Public assets (jika ada)
COPY --from=builder /app/public ./public

# Standalone output Next.js (output: "standalone" di next.config.ts)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma: schema + migrations + engine diperlukan untuk `prisma migrate deploy` saat runtime
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/package.json ./package.json

# Entrypoint untuk auto-migrate
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Storage persistent volume — Coolify mount ke path ini
RUN mkdir -p ./storage/uploads && chown nextjs:nodejs ./storage/uploads \
 && mkdir -p /data/uploads && chown nextjs:nodejs /data/uploads

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api').then(r=>{process.exit(r.ok?0:1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
