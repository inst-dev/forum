#!/bin/bash
set -e

echo "========================================"
echo "  NullForum Production Deployment"
echo "========================================"

APP_DIR="/www/wwwroot/forum.inst.lk"
cd "$APP_DIR"

echo ""
echo "[1/8] Installing dependencies..."
npm install --production=false

echo ""
echo "[2/8] Generating Prisma client..."
cd packages/database
npx prisma generate
cd "$APP_DIR"

echo ""
echo "[3/8] Building shared package..."
cd packages/shared
npx tsc
cd "$APP_DIR"

echo ""
echo "[4/8] Building backend..."
cd services/backend
npx tsc
cd "$APP_DIR"

echo ""
echo "[5/8] Building Next.js frontend..."
cd apps/web
npx next build
cd "$APP_DIR"

echo ""
echo "[6/8] Running database migrations..."
cd packages/database
npx prisma db push --accept-data-loss
cd "$APP_DIR"

echo ""
echo "[7/8] Seeding database (if first run)..."
cd packages/database
npx ts-node prisma/seed.ts 2>/dev/null || echo "Seed skipped (already seeded or error)"
cd "$APP_DIR"

echo ""
echo "[8/8] Starting/Restarting PM2 processes..."
pm2 delete nullforum-backend nullforum-web nullforum-socket 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "========================================"
echo "  Deployment Complete!"
echo "========================================"
echo ""
echo "Admin Login: admin@nullforum.com / Admin@12345"
echo "Frontend:    https://forum.inst.lk"
echo "API:         https://forum.inst.lk/api"
echo ""
echo "Commands:"
echo "  pm2 status          - Check process status"
echo "  pm2 logs            - View logs"
echo "  pm2 restart all     - Restart all"
echo ""
