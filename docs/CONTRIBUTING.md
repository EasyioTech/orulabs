# Contributing Guide

## Local Dev Setup

```bash
git clone <repo>
cd OruClass
cp .env.example .env   # fill in values
docker compose up postgres redis -d
bun install
cd apps/api && bun run migrate && cd ../..
bun run dev
```

- API: http://localhost:3001
- Web: http://localhost:3000

## Project Structure

```
apps/api/src/
  db/          schema + client + migrations
  middleware/  auth, workspace (tenant), roleGuard
  routes/      one file per resource
  socket/      handlers, state
  services/    (Phase 4+) business logic extracted from routes
apps/web/src/
  app/         Next.js App Router pages
  components/  ui components, grouped by domain
  hooks/       data-fetching and socket hooks
  store/       Zustand slices
  lib/         singletons (api-client, socket, permissions)
packages/
  types/       pure TypeScript interfaces — no runtime deps
  validators/  Zod schemas shared by API + web
  utils/       cn, dateFormat, permissions
```

## Code Style

- **Formatter**: Prettier (`.prettierrc` at root) — run automatically on commit
- **Linter**: ESLint — `bun run lint`
- **TypeScript**: strict mode, no `any`
- **Imports**: use `@oruclass/types`, `@oruclass/validators`, `@oruclass/utils` — never relative cross-package imports
- **Comments**: only for non-obvious WHY, never WHAT

## Branch Naming

```
feat/short-description
fix/short-description
chore/short-description
```

## Commits

Conventional Commits:

```
feat: add quiz aggregate live update
fix: workspace middleware ignores OPTIONS preflight
chore: upgrade drizzle-orm to 0.31
```

## Pull Requests

1. Open against `main`
2. Title = commit message style
3. Description: what changed + how to test
4. All CI checks must pass before merge

## Adding a New Module Type

1. Add the type literal to `packages/types/src/training.ts` → `TrainingModule.moduleType`
2. Add the Zod literal to `packages/validators/src/training.ts` → `CreateModuleSchema`
3. Create `apps/web/src/components/tools/YourToolRenderer.tsx`
4. Register it in `apps/web/src/components/tools/ActiveModuleRenderer.tsx` → `moduleComponentMap`

No other files need changing — the dynamic renderer handles the rest.

## Adding a New API Route

1. Create `apps/api/src/routes/yourResource.ts`
2. Apply `requireAuth` (and `requireWorkspace` if workspace-scoped)
3. Use `requireTrainingPermission("permission")` HOF for role-gated endpoints
4. Register the router in `apps/api/src/index.ts`

## Database Migrations

```bash
# After editing apps/api/src/db/schema.ts:
cd apps/api
bun run drizzle-kit generate
bun run migrate
```

Never edit migration files by hand. Commit both the schema change and the generated migration together.

## Environment Variables

Never commit `.env`. All new vars must be added to `.env.example` with a description comment.

## Testing

```bash
bun run test              # all packages
cd apps/api && bun test   # API only
```

Integration tests hit a real local database — ensure postgres is running before `bun test`.
