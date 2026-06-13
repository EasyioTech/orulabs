# OruLabs — Production Launch Plan
**Audit Date:** 2026-06-10 | **Audit Score:** 5.1/10  
**Goal:** Reach production-readiness for paying customers

---

## PHASE 1 — Critical Blockers ✅ = done, 🔄 = in progress, ⏳ = pending

| # | Task | Status |
|---|------|--------|
| P1-1 | Fix checkout bypass — wire Razorpay or gate `/success` | ⏳ intentional |
| P1-2 | Fix `error.tsx` — remove raw `error.message` exposure | ✅ |
| P1-3 | Fix `returnTo` open redirect in signup | ✅ |
| P1-4 | Add Refund Policy page `/refund-policy` | ✅ |
| P1-5 | Fix Socket.IO CORS — reject unknown origins (not fallback) | ✅ |
| P1-6 | Add SIGTERM graceful shutdown to API | ✅ |

## PHASE 2 — Payment Integration

| # | Task | Status |
|---|------|--------|
| P2-1 | Add `subscriptions`, `plans`, `invoices` DB tables + migration | ⏳ |
| P2-2 | `POST /api/payments/create-order` + webhook endpoint | ⏳ |
| P2-3 | Wire Razorpay SDK in frontend checkout | ⏳ |
| P2-4 | Plan quota enforcement middleware | ⏳ |

## PHASE 3 — Auth & Security Hardening

| # | Task | Status |
|---|------|--------|
| P3-1 | Embed `emailVerified` in JWT — remove DB lookup from authMiddleware | ✅ |
| P3-2 | Add `DELETE /api/auth/me` account deletion endpoint | ✅ |
| P3-3 | Add per-email account lockout after 10 failed logins | ✅ |
| P3-4 | Remove refresh token body fallback | ✅ |
| P3-5 | Add Socket.IO per-socket event rate limiting | ✅ |

## PHASE 4 — Database Fixes

| # | Task | Status |
|---|------|--------|
| P4-1 | Add missing indexes (refresh_tokens, participants, facilitators) | ✅ |
| P4-2 | Add CHECK constraints on enum text fields | ✅ |
| P4-3 | Add FK constraint on `currentActiveModuleId` | ✅ |
| P4-4 | Resolve `avatar_url` vs `image` duplicate columns | ✅ |
| P4-5 | Add `updatedAt` to `workspaces` table | ✅ |
| P4-6 | Add text length constraints | ✅ |

## PHASE 5 — SEO & Content

| # | Task | Status |
|---|------|--------|
| P5-1 | Remove placeholder pages from sitemap | ✅ |
| P5-2 | Add `/compare` sub-pages to sitemap | ✅ |
| P5-3 | Add per-page metadata to all marketing pages | ✅ |
| P5-4 | Write real About page content | ✅ |
| P5-5 | Add public `/pricing` page (no auth required) | ✅ |
| P5-6 | Fix sitemap `lastModified` — use real static dates | ✅ |
| P5-7 | Add Cookie Policy page | ✅ |

## PHASE 6 — Monitoring & Reliability

| # | Task | Status |
|---|------|--------|
| P6-1 | Add Sentry (frontend + API) | ✅ |
| P6-2 | Improve `/health` — probe DB + Redis | ✅ |
| P6-3 | Automated pg_dump cron → R2 | ✅ `scripts/backup-db.sh` |
| P6-4 | External uptime monitoring setup | ⏳ |
| P6-5 | BullMQ `.on('failed', ...)` handlers | ✅ |
| P6-6 | CI deployment pipeline | ✅ `.github/workflows/deploy.yml` |

## PHASE 7 — Legal & Compliance

| # | Task | Status |
|---|------|--------|
| P7-1 | Cookie Policy page | ✅ |
| P7-2 | `GET /api/auth/me/export` data export (DPDPA) | ✅ |

---

## Remaining

| # | Task | Notes |
|---|------|-------|
| P6-4 | External uptime monitoring | UptimeRobot / BetterUptime → `https://api.orulabs.in/health` |

## Production DB Migrations Applied
- `0010_indexes_constraints.sql` — applied 2026-06-11 via psql
- `0011_drop_image_column.sql` — applied 2026-06-11 via psql

*Update status in this file and in `memory/production_launch_plan.md` after each item is completed.*
