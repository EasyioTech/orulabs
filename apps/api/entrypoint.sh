#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."
bun node_modules/.bin/drizzle-kit migrate --config drizzle.config.ts

echo "[entrypoint] Starting API server..."
exec bun dist/index.js
