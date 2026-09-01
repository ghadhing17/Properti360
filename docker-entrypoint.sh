#!/bin/sh
set -e

echo "[entrypoint] Starting Properti360..."
if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] DATABASE_URL is set"
else
  echo "[entrypoint] WARNING: DATABASE_URL is empty!"
fi
echo "[entrypoint] NODE_ENV=$NODE_ENV PORT=$PORT"

# ──────────────────────────────────────────────
# Prisma migrate deploy — idempotent, aman di-restart
# Retry hingga 15x jika DB belum siap (Coolify Postgres baru start)
# ──────────────────────────────────────────────
echo "[entrypoint] Running prisma migrate deploy..."
ATTEMPTS=0
MAX_ATTEMPTS=15
until npx prisma migrate deploy; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    echo "[entrypoint] ERROR: prisma migrate deploy failed after $MAX_ATTEMPTS attempts — exiting"
    exit 1
  fi
  echo "[entrypoint] Migrate failed, retry $ATTEMPTS/$MAX_ATTEMPTS in 3s..."
  sleep 3
done
echo "[entrypoint] Migrate deploy OK."

# ──────────────────────────────────────────────
# Optional seed — hanya jika SEED_ON_BOOT=true
# Untuk bootstrap admin pertama kali. Di production yang
# sudah ada data, biarkan false / unset.
# ──────────────────────────────────────────────
if [ "$SEED_ON_BOOT" = "true" ]; then
  echo "[entrypoint] SEED_ON_BOOT=true — running prisma seed..."
  if npx prisma db seed 2>&1; then
    echo "[entrypoint] Seed OK."
  else
    echo "[entrypoint] prisma db seed failed, trying npm run db:seed..."
    npm run db:seed || echo "[entrypoint] Seed failed — continuing anyway"
  fi
else
  echo "[entrypoint] SEED_ON_BOOT not set — skipping seed."
fi

echo "[entrypoint] Launching: $@"
exec "$@"
