# Commands

> Run from `F:\OruClass` root.

## Run

```bash
docker compose up postgres redis -d   # infra first (postgres 5433, redis 6379)
bun run dev                           # backend + frontend together
bun run api                           # backend only (http://localhost:3001)
bun run web                           # frontend only (http://localhost:3000)
```

## Kill

```bash
npx kill-port 3001                    # backend
npx kill-port 3000                    # frontend
npx kill-port 3000 3001               # both
docker compose stop                   # postgres + redis
docker compose down                   # stop + remove containers
```

## Restart

```bash
docker compose down && docker compose up postgres redis -d && npx kill-port 3000 3001 && bun run dev
```

## Database Migrations

```bash
cd apps/api
bun run db:generate                   # Generate a new migration after updating apps/api/src/db/schema.ts
bun run db:push                       # Push schema changes directly to the database (for rapid local dev)
bun run migrate                       # Run pending migrations against the database
bun run db:studio                     # Open Drizzle Studio to view database (http://local.drizzle.studio)
```

## Production Deployment (VPS)

```bash
# Run this from F:\OruClass
ssh oru "cd /docker/OruClass && git stash && git pull && docker compose down && docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml up -d --build"
```
