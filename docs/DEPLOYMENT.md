# Deployment Guide

## Prerequisites

- Docker 24+ and Docker Compose v2
- A VPS with 2GB+ RAM (Ubuntu 22.04 recommended)
- A domain name with DNS A record pointing to your server
- Google OAuth credentials (Client ID + Secret)

## Environment Variables

Copy `.env.example` → `.env` and fill in all values:

```bash
cp .env.example .env
```

Required values:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `JWT_SECRET` — Random 64-char hex string: `openssl rand -hex 64`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — From Google Cloud Console
- `NEXT_PUBLIC_API_URL` — Public URL of the API (e.g. `https://api.yourdomain.com`)
- `RESEND_API_KEY` — From resend.com
- `R2_*` — From Cloudflare R2 dashboard

## Local Development

```bash
# Start postgres + redis
docker compose up postgres redis -d

# Install dependencies
bun install

# Run migrations
cd apps/api && bun run migrate && cd ../..

# Start all services
bun run dev
```

Visit `http://localhost:3000`.

## Production Docker Compose

```bash
# Build images
docker compose -f docker-compose.yml build

# Start all services
docker compose up -d

# Check health
curl https://api.yourdomain.com/health

# View logs
docker compose logs -f api
```

## Running Migrations in Production

```bash
docker compose exec api bun run migrate
```

## SSL with Nginx

Add a reverse proxy container or configure Nginx on the host:

```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";  # required for WebSocket
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

WebSocket upgrade headers are required for Socket.IO to work through Nginx.

## Backups

```bash
# Database backup
docker compose exec postgres pg_dump -U oruclass oruclass > backup_$(date +%Y%m%d).sql

# Restore
docker compose exec -T postgres psql -U oruclass oruclass < backup_20260101.sql
```
