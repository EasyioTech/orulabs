# PIJAM Makerspace — Live Session Runbook

Single-operator playbook for the live training. Goal: zero dead air, fast recovery.
Stack: API `:3001` · web `:3000` · postgres `:5433` · redis `:6379`.

---

## T-24h — Pre-flight (do this the day before)

- [ ] **Build green**: `bun run build` clean. No type errors blocking deploy.
- [ ] **Prod deployed** (if running on VPS): deploy command in COMMANDS.md, then load `orulabs.in` and confirm login works.
- [ ] **Load proof**: `bun --cwd apps/api run load-test` (or `LOAD_TEST_N=80`) →
      connect = N/N, submit ack = N/N, DB persisted = N, **Ghosts: 0/…**.
- [ ] **Training created** in the workspace, all modules added in order, configs filled.
- [ ] **Join artifacts printed**: QR code + 6-digit code + link tested on a phone NOT on your account.
- [ ] **Email deliverability**: send yourself a verification mail — confirm it lands (Resend/orulabs.in DNS).

## T-30m — Room setup

- [ ] Infra up: `docker compose up postgres redis -d` then `bun run dev` (or prod already live).
- [ ] Open the training → trainer live room. Session status = **draft**.
- [ ] Project the **Join slide** (QR + code). Verify it scans from the back of the room.
- [ ] Have a backup join path ready: short link written on the board in case the QR fails.
- [ ] Trainer device on the **most stable** network (ethernet/hotspot you control, not venue guest WiFi).

## T-0 — Go live

1. Flip session status **draft → connecting** (or **live**) when you start.
2. Watch the participant roster fill. Presence = green/online via heartbeat.
3. Unlock modules **one at a time** as you reach them — don't pre-unlock everything.
4. After each interactive module: watch the trainer progress bar (`submitted / total`).
   It only updates on the trainer dashboard, not participant screens — that's intended.

---

## Failure recovery (memorize these 4)

| Symptom | Cause | Fix |
|---|---|---|
| **A participant shows offline but they're present** | network blip | Do nothing — guard auto-reconciles on their reconnect (~1s). If stuck >30s, have them refresh; their queued answers flush on rejoin. |
| **API restarted / crashed mid-session** | server blip | Just restart it (`bun run api`). Session state restores from Redis (active module, roster). Participants auto-reconnect and re-join. **Don't reset the training.** |
| **Whole room can't submit / sync frozen** | API down or DB/Redis down | Check `:3001` responds; `docker compose ps` for postgres+redis. Restart the dead one. Active module survives in Redis. |
| **Module shows locked for participants after you unlocked** | missed event | Re-toggle the unlock, or have them refresh — ParticipantLiveRoom restores the active module from DB on load. |

**Hard reset (last resort only):** ControlPanel → "Reset to Draft". This wipes live presence — use only if the session is unrecoverable. Responses already in the DB are NOT deleted.

---

## What CANNOT be fixed live (so don't try)

- Missing module configs → fix before T-0, not during.
- A participant who never verified their email / can't log in → use the join-code path (no account needed) if enabled, else move on.
- Bad venue WiFi for participants → out of our control; the offline answer-queue means late submits still land on reconnect.

## T+0 — After

- [ ] Flip session status → **completed**.
- [ ] Export responses (Data page / Excel export) once the queue finishes.
- [ ] Note anything that broke → it goes in the post-PIJAM backlog (Phase 1+).
