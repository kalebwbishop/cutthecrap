# Copilot Instructions — Cut The Crap

Recipe extraction app: paste a URL, get just the recipe. No life stories, no ads.

**GitHub repo:** https://github.com/kalebwbishop/cutthecrap

## Architecture

Three-part monorepo with no shared workspace tooling — each directory is independent:

- **`frontend/`** — Expo SDK 54 (React Native + Web) with expo-router v6 for file-based routing
- **`backend/`** — Python FastAPI (async) with raw asyncpg queries against PostgreSQL
- **`database/`** — Raw SQL schema files + TypeScript migration/seed scripts using the `pg` driver

### Data flow

```
User pastes URL → frontend validates → POST /api/v1/chatgpt/parse-url
→ backend fetches HTML, strips to visible text (≤12k chars)
→ forwards to Azure Function proxy → OpenAI gpt-4o-mini (structured JSON output)
→ recipe result returned to frontend → user can save (auth required)
```

### Auth flow (WorkOS)

```
frontend GET /auth/login → WorkOS authorization URL → browser redirect
→ WorkOS callback → backend 302 redirect to frontend with code
→ frontend POST /auth/exchange → tokens + user
→ JWT on all protected requests (RS256, verified against WorkOS JWKS)
```

Mobile deep-link scheme: `cutthecrap://`

### Monetization

Custom cross-platform billing: Stripe (web), Apple StoreKit via react-native-iap (iOS), Google Play Billing via react-native-iap (Android). Backend entitlement tables are the source of truth. Entitlement key: `"pro"`. Free tier: 5 saved recipes.

## Frontend (`frontend/`)

### Commands

```bash
cd frontend
npm install
npx expo start          # dev server
npx expo start --web    # browser
npm run lint            # ESLint (eslint-config-expo + @typescript-eslint)
npm test                # Jest (configured but no tests exist yet)
```

### Key conventions

- **Route files are thin wrappers.** `app/*.tsx` files only render a screen component from `src/screens/`. All logic lives in `src/`.
- **Three-layer pattern:** `src/api/` (Axios client + endpoints) → `src/store/` (Zustand stores) → `src/screens/` + `src/components/` (UI)
- **Three independent Zustand stores** — `authStore`, `recipeStore`, `subscriptionStore`. No Redux, no Context for state (Context only for theming).
- **Path alias:** `@/*` maps to `./src/*` (configured in tsconfig.json)
- **Theme system:** `createStyles(colors: ThemeColors)` factory pattern called with `useMemo()` in every screen/component. System-aware light/dark mode via `useColorScheme()`.
- **Custom SVG icons** in `src/components/Icons.tsx` — not an icon library.
- **Cross-platform handling:** screens check `Platform.OS === 'web'` explicitly for billing flows, auth redirects, shadows, etc.
- **Max content width:** 768px on web for readability.
- **API client** (`src/api/client.ts`): 60s timeout, auto-detects dev server URL from Expo constants on native.

### Environment variables

Prefixed with `EXPO_PUBLIC_`. See `frontend/.env.example`:
- `EXPO_PUBLIC_API_BASE` — backend URL
- `EXPO_PUBLIC_CHATGPT_API_KEY` — API key for the Azure Function proxy

## Backend (`backend/`)

### Commands

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Key conventions

- **No ORM.** All database access is raw parameterized SQL via asyncpg (`$1, $2, ...` placeholders).
- **Layered pattern:** Routes (thin controllers + Pydantic validation) → Services (business logic + DB queries) → Config (settings, DB pool, WorkOS client)
- **Settings:** `pydantic-settings` `BaseSettings` with `@lru_cache` singleton, loaded from `.env`
- **Error handling:** Custom `AppError` class with HTTP status codes + generic exception handler middleware.
- **Logging:** 3-tier — console (UTF-8 safe), `logs/error.log`, `logs/combined.log`. JSON format in files.
- **CORS:** Origins from env var; `*` appended automatically in development mode.
- **Response format:** camelCase keys (e.g., `sourceUrl`, `accessToken`) to match frontend conventions.

### API routes (all under `/api/v1`)

- `/auth/*` — WorkOS OAuth (login, callback, exchange, refresh, me, logout)
- `/chatgpt/*` — Recipe extraction (parse raw text, parse URL)
- `/recipes/*` — Saved recipe CRUD (auth required)
- `/billing/*` — Billing and entitlements (Stripe, Apple, Google webhooks + sync)
- `/api/health` — DB connectivity check

### Environment variables

See `backend/.env.example` for `POSTGRES_CONNECTION_STRING`, `WORKOS_*`, `CHATGPT_API_BASE`, `OPENAI_API_KEY`, `CORS_ORIGIN`, etc.

## Database (`database/`)

### Commands

```bash
cd database
npm run migrate   # runs all schemas/*.sql files (destructive — drops and recreates tables)
npm run seed      # runs all seeds/*.sql files
```

**Warning:** Migration is destructive (`DROP TABLE IF EXISTS CASCADE`). No incremental migration tracking.

### Schema

PostgreSQL with `uuid-ossp` extension. Tables:

- **`users`** — `id` (UUID), `workos_user_id`, `email`, `name`, `avatar_url`, timestamps
- **`saved_recipes`** — `id` (UUID), `user_id` (FK CASCADE), `title`, `description`, `source_url`, 7 time fields, `servings`, `ingredients` (TEXT[]), `steps` (JSONB array of `{instruction, ingredients[]}`), `notes` (TEXT[]), timestamps
- **`billing_products`** — Maps platform-specific product IDs to entitlement keys
- **`billing_transactions`** — Immutable audit log of all purchase events
- **`user_entitlements`** — Current entitlement state per user/source
- **`billing_webhook_events`** — Idempotency tracking for webhook processing

Both tables have `updated_at` auto-update triggers. Connection string is read from `backend/.env`.
