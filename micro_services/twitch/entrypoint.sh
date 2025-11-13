#!/bin/sh
set -e

echo "[entrypoint] Running Prisma generate..."
npx prisma generate

echo "[entrypoint] Applying Prisma migrations..."
npx prisma migrate deploy

echo "[entrypoint] Applying Prisma tables..."
npx prisma db push --accept-data-loss

echo "[entrypoint] Seeding database..."
npx prisma db seed

echo "[entrypoint] Starting NestJS (dev)..."
exec npm run start:dev
