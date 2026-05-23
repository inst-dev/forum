# NullForum Deployment Guide — forum.inst.lk

## Prerequisites

Your server needs:
- Node.js 20+ (LTS)
- MySQL 8+
- Redis 7+
- PM2 (process manager)
- Nginx (already configured via BT Panel)

---

## Step-by-Step Deployment

### 1. Install Node.js 20 (if not already)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v   # should show v20.x
npm -v    # should show 10.x
```

### 2. Install PM2 globally

```bash
npm install -g pm2
pm2 startup   # enables PM2 to start on boot
```

### 3. Install Redis (if not already)

```bash
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server
redis-cli ping   # should return PONG
```

### 4. Create MySQL Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE nullforum CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nullforum_user'@'127.0.0.1' IDENTIFIED BY 'YOUR_STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON nullforum.* TO 'nullforum_user'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

### 5. Clone the repository

```bash
cd /www/wwwroot/forum.inst.lk
git clone https://github.com/inst-dev/forum.git .
```

> If already cloned, just `git pull origin main`

### 6. Create the .env file

```bash
cp .env.production .env
nano .env
```

**Fill in these values (REQUIRED):**

| Variable | What to put |
|----------|-------------|
| `DATABASE_URL` | `mysql://nullforum_user:YOUR_PASSWORD@127.0.0.1:3306/nullforum` |
| `JWT_SECRET` | Run: `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Run: `openssl rand -hex 32` |
| `COOKIE_SECRET` | Run: `openssl rand -hex 16` |
| `SESSION_SECRET` | Run: `openssl rand -hex 16` |
| `SMTP_USER` | Your email address |
| `SMTP_PASS` | Your email app password |

Save and exit (`Ctrl+X`, `Y`, `Enter`).

### 7. Create frontend .env

```bash
cp apps/web/.env.production apps/web/.env.local
```

> No changes needed — it's already configured for forum.inst.lk

### 8. Create uploads directory

```bash
mkdir -p /www/wwwroot/forum.inst.lk/uploads/{avatars,banners,attachments}
chown -R www:www /www/wwwroot/forum.inst.lk/uploads
chmod -R 755 /www/wwwroot/forum.inst.lk/uploads
```

### 9. Install dependencies & build

```bash
cd /www/wwwroot/forum.inst.lk

# Install all dependencies
npm install

# Generate Prisma client
cd packages/database
npx prisma generate

# Push schema to MySQL
npx prisma db push

# Seed the database
npx ts-node prisma/seed.ts
cd /www/wwwroot/forum.inst.lk

# Build shared package
cd packages/shared
npx tsc
cd /www/wwwroot/forum.inst.lk

# Build backend
cd services/backend
npx tsc
cd /www/wwwroot/forum.inst.lk

# Build Next.js frontend
cd apps/web
npx next build
cd /www/wwwroot/forum.inst.lk
```

> **Or run the all-in-one script:**
> ```bash
> chmod +x deploy.sh
> ./deploy.sh
> ```

### 10. Replace Nginx configuration

```bash
cp nginx/forum.inst.lk.conf /www/server/panel/vhost/nginx/forum.inst.lk.conf
nginx -t          # test config - must show "ok"
nginx -s reload   # apply
```

### 11. Start with PM2

```bash
cd /www/wwwroot/forum.inst.lk
pm2 start ecosystem.config.js
pm2 save
```

### 12. Verify deployment

```bash
# Check processes are running
pm2 status

# Test health endpoint
curl http://127.0.0.1:4000/health

# Test frontend
curl -I https://forum.inst.lk
```

---

## Post-Deployment

### Default Admin Login

- **Email:** `admin@nullforum.com`
- **Password:** `Admin@12345`

> ⚠️ **Change this immediately** after first login via Settings > Security.

### Verify everything works

1. Visit https://forum.inst.lk — Homepage loads
2. Visit https://forum.inst.lk/login — Login page
3. Login with admin credentials
4. Visit https://forum.inst.lk/admin — Admin panel loads
5. Create a forum via Admin > Forums
6. Create a test thread

---

## Useful Commands

```bash
# View logs
pm2 logs
pm2 logs nullforum-backend
pm2 logs nullforum-web

# Restart services
pm2 restart all
pm2 restart nullforum-backend
pm2 restart nullforum-web

# Stop all
pm2 stop all

# Monitor
pm2 monit

# Rebuild after code changes
cd /www/wwwroot/forum.inst.lk
git pull origin main
./deploy.sh
```

---

## Troubleshooting

### "502 Bad Gateway"
```bash
pm2 status               # check if processes are online
pm2 logs nullforum-web   # check for errors
```

### "Database connection failed"
```bash
mysql -u nullforum_user -p -h 127.0.0.1 nullforum   # test connection
cat .env | grep DATABASE_URL                          # verify URL
```

### "Redis connection error"
```bash
redis-cli ping        # should return PONG
systemctl status redis-server
```

### Frontend build fails
```bash
cd apps/web
rm -rf .next
npx next build        # check errors
```

### Prisma issues
```bash
cd packages/database
npx prisma db push --force-reset    # WARNING: drops all data
npx prisma generate
```

---

## Architecture (Production)

```
Internet
   │
   ▼
┌─────────────────────────────────────────┐
│  Nginx (port 443 SSL)                   │
│                                         │
│  /api/*        → 127.0.0.1:4000       │
│  /socket.io/*  → 127.0.0.1:4001 (WS)  │
│  /uploads/*    → static files           │
│  /_next/static → static assets          │
│  /*            → 127.0.0.1:3000       │
└─────────────────────────────────────────┘
         │              │             │
         ▼              ▼             ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ Fastify  │  │ Next.js  │  │Socket.IO │
   │ Backend  │  │ Frontend │  │ Realtime │
   │ :4000    │  │ :3000    │  │ :4001    │
   └────┬─────┘  └──────────┘  └────┬─────┘
        │                            │
        ▼                            ▼
   ┌──────────┐              ┌──────────┐
   │  MySQL   │              │  Redis   │
   │  :3306   │              │  :6379   │
   └──────────┘              └──────────┘
```
