# Pre-Launch Checklist

Comprehensive audit of frontend, backend, and database for production readiness.

---

## 🔴 P0 — Blockers

These must be resolved before going live.

- [ ] **Audit & rotate committed secrets** — Real secrets exist in `backend/.env` and `frontend/.env` (WorkOS API key, DB password, OpenAI key, ChatGPT API key). Verify `.env` is not committed to git history. If it is, rotate ALL credentials.
- [ ] **Add rate limiting** — No rate limiting exists anywhere. Install `slowapi` or similar. At minimum, rate-limit `/chatgpt/parse` and `/chatgpt/parse-url` to prevent OpenAI cost abuse. Consider per-IP and per-user limits.
- [ ] **Protect ChatGPT parse endpoints** — `POST /chatgpt/parse` and `/chatgpt/parse-url` are completely unauthenticated. Anyone can call them and run up OpenAI costs. Add auth requirement or at minimum an API key check.
- [ ] **Add SSRF protection on parse-url** — `parse-url` accepts any URL including `file://`, `javascript:`, and internal IPs. Validate URL scheme (http/https only) and block private IP ranges in `recipe_service.py`.
- [ ] **Add persistent auth token storage** — Tokens only live in Zustand in-memory state. Users must re-login on every app restart. Add `expo-secure-store` for native and secure storage for web.
- [ ] **Create EAS build configuration** — No `eas.json` exists. `app.json` projectId is an empty string. Create `eas.json` with development/preview/production profiles and set the EAS projectId.
- [ ] **Verify billing service configuration** — `frontend/src/services/billing/constants.ts` — Ensure product IDs match App Store Connect. Move any environment-specific config to env vars.

---

## 🟡 P1 — High Priority

- [ ] **Fix `verify=False` SSL in production** — `recipe_service.py:215` (OpenAI call) and `:250` (URL fetch) use `verify=False` unconditionally. Only disable in dev mode, or fix the underlying cert issue.
- [ ] **Fix backend Dockerfile for production** — Remove `--reload` flag from CMD. Add `--workers` flag. Add `.dockerignore`. Remove unnecessary PyTorch install. Run as non-root user. Consider multi-stage build.
- [ ] **Add React Error Boundary** — No `ErrorBoundary` component exists. An unhandled JS exception crashes the entire app with no recovery UI. Add ErrorBoundary in `_layout.tsx` using expo-router support.
- [ ] **Fix frontend env var name mismatch** — `.env.example` uses `EXPO_PUBLIC_CHATGPT_API_BASE` but code reads `EXPO_PUBLIC_API_BASE`. Align the names. Remove unused `EXPO_PUBLIC_CHATGPT_API_KEY` from `.env.example`.
- [ ] **Add crash reporting (Sentry)** — No crash reporting exists in frontend or backend. Add Sentry (or similar) to catch production errors.
- [ ] **Set up CI/CD pipeline** — No GitHub Actions workflows exist. Add workflows for: lint, test (backend pytest), build (frontend EAS), and deploy. *(Depends on: EAS build config)*
- [ ] **Add log rotation to backend** — `backend/app/utils/logger.py` uses `FileHandler` instead of `RotatingFileHandler`. Logs will grow unbounded in production.

---

## 🟠 P2 — Medium Priority

- [ ] **Replace placeholder splash screen** — `frontend/splash.png` is a generic placeholder (blue circle with layers icon). Replace with branded Cut The Crap splash screen.
- [ ] **Fix or remove broken seed data** — `database/seeds/dev_data.sql` references non-existent columns. Fix or delete. Add guard so seeds cannot run in production.
- [ ] **Guard destructive migration command** — `npm run migrate:reset` drops all tables. Add `NODE_ENV !== 'production'` check or remove the command to prevent accidental production data loss.
- [ ] **Enable JWT audience validation** — `backend/app/middleware/auth.py` has `verify_aud: False`. A valid WorkOS JWT from a different app could be accepted. Enable audience verification.
- [ ] **Tighten API input validation** — `ParseUrlPayload.url` has no format validation. `max_tokens` has no upper bound. `model` field allows any value including expensive models. Add Pydantic validators.
- [ ] **Switch container probes to HTTP** — `containerapp-update.yaml` uses TCP socket probes. Switch to HTTP probes hitting `/api/health` so probes fail when DB is down.
- [ ] **Verify react-native-iap in app.json plugins** — `react-native-iap` may need to be added to the `app.json` plugins array for EAS builds on iOS/Android. *(Depends on: EAS build config)*
- [ ] **Create database backup strategy** — No backup/restore scripts exist. Add `pg_dump`-based backup automation and document restore procedure.
- [ ] **Fix CORS credentials + wildcard conflict** — In dev mode, `allow_credentials=True` + `allow_origins=["*"]` is invalid per CORS spec. Fix the dev CORS config.

---

## 🟢 P3 — Nice to Have

- [ ] **Add basic accessibility support** — Zero `accessibilityLabel`, `accessibilityRole`, or `aria-*` props in any component. Add labels to all interactive elements at minimum.
- [ ] **Add analytics/event tracking** — No analytics SDK. Add tracking for key funnels: recipe extractions, paywall views, purchases, sign-ups.
- [ ] **Fix silent error swallowing in frontend** — `SidebarDrawer.tsx:59`, `ResultScreen.tsx:56`, `recipeStore.ts:93` all have empty `catch {}` blocks. Add error logging or user feedback.
- [ ] **Add Pydantic response models to backend** — No response models defined on any route. Add them for OpenAPI docs, output validation, and to prevent leaking extra DB fields.
- [ ] **Pin PyJWT version** — `requirements.txt` uses `>=2.0.0` which is too broad. Pin to a specific version.
- [ ] **Use FlatList for sidebar recipe list** — `SidebarDrawer.tsx` renders recipes with `ScrollView` + `.map()`. Use `FlatList` for virtualization with many saved recipes.
- [ ] **Configure universal links / app links** — Only custom scheme (`cutthecrap://`) is configured. Add iOS universal links and Android app links for better UX.
- [ ] **Add real contact info to privacy/terms** — Privacy and terms pages say "contact us through the App" but no actual email or contact form exists.
- [ ] **Add docker-compose for local dev** — No `docker-compose.yml` exists. Add one to orchestrate backend + database + frontend.
- [ ] **Improve .gitignore coverage** — Missing: `.DS_Store`, `Thumbs.db`, `*.egg-info/`, `.mypy_cache/`, `.pytest_cache/`, `.env.local`, `.env.production`.
