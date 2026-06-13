FROM oven/bun:1.2-alpine AS base
WORKDIR /app

# ── Install deps ──────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json bun.lock turbo.json tsconfig.json ./
COPY packages/types/       packages/types/
COPY packages/validators/  packages/validators/
COPY packages/utils/       packages/utils/
COPY apps/api/             apps/api/
COPY apps/web/package.json apps/web/package.json
RUN bun install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────
FROM base AS builder
# Copy the full installed workspace (includes workspace symlinks)
COPY --from=deps /app ./
# bun resolves workspace links through /app/node_modules
RUN bun build apps/api/src/index.ts --outdir apps/api/dist --target bun --sourcemap=none

# ── Runner ────────────────────────────────────────────────────────────────────
FROM oven/bun:1.2-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Bundled app
COPY --from=builder /app/apps/api/dist              ./dist
# Migration runtime: drizzle-kit CLI + pg driver + config + SQL files
COPY --from=builder /app/node_modules               ./node_modules
COPY --from=builder /app/apps/api/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/apps/api/src/db/migrations ./src/db/migrations
COPY --from=builder /app/apps/api/package.json      ./package.json

COPY apps/api/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["./entrypoint.sh"]
