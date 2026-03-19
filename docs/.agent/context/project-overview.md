# Cut The Crap — Project Overview

Paste a recipe URL, get just the recipe — no life stories, no ads, no pop-ups.

## Architecture

Three-part monorepo with no shared workspace tooling — each directory is independent:

| Directory | Stack | Purpose |
|-----------|-------|---------|
| `frontend/` | Expo SDK 54 · React Native + Web · TypeScript | Cross-platform client (iOS, Android, Web) |
| `backend/` | Python 3.12 · FastAPI · asyncpg | Async REST API, HTML scraping, OpenAI proxy |
| `database/` | PostgreSQL · TypeScript migration scripts | Schema definitions and seed data |

### Data Flow

```
User pastes URL
  → frontend validates URL format
  → POST /api/v1/chatgpt/parse-url
  → backend fetches HTML, strips to visible text (≤ 12 000 chars)
  → forwards to Azure Function proxy → OpenAI gpt-4o-mini (structured JSON output)
  → recipe result returned to frontend
  → user can save (auth required, free tier: 5 saved recipes)
```

### Auth Flow (WorkOS)

```
frontend GET /auth/login → WorkOS authorization URL → browser redirect
→ WorkOS callback → backend 302 redirect to frontend with code
→ frontend POST /auth/exchange → { user, accessToken, refreshToken }
→ JWT on all protected requests (RS256, verified against WorkOS JWKS)
```

Mobile deep-link scheme: `cutthecrap://`

### Monetization

RevenueCat in-app purchases (iOS / Android / Web). Entitlement: `"Cut The Crap Pro"`. Free tier: 5 saved recipes.

---

## Frontend (`frontend/`)

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo SDK 54 (managed workflow), expo-router v6 (file-based routing) |
| Language | TypeScript (strict mode) |
| UI | React Native 0.81.5 + React 19.1 + react-native-web |
| State | Zustand 4.4 (3 stores) |
| HTTP | Axios 1.9 (60 s timeout) |
| IAP | RevenueCat — `react-native-purchases` (native) + `@revenuecat/purchases-js` (web) |
| Auth | WorkOS (OAuth via backend proxy) |
| Styling | StyleSheet + theme context (system-aware light/dark) |

### Commands

```bash
cd frontend
npm install
npm start              # expo start --offline
npm run web            # expo start --web
npm run ios            # expo start --ios
npm run android        # expo start --android
npm run lint           # eslint .
npm test               # jest (no tests written yet)
npm run clean          # rm -rf node_modules .expo
```

### Project Structure

```
frontend/
├── app/                            # Expo Router file-based routes (thin wrappers)
│   ├── _layout.tsx                 # Root layout — ThemeProvider, SafeArea, RevenueCat init
│   ├── index.tsx                   # → InputScreen (home)
│   ├── auth.tsx                    # OAuth callback handler
│   ├── loading.tsx                 # → LoadingScreen
│   ├── result.tsx                  # → ResultScreen
│   ├── paywall.tsx                 # → PaywallScreen
│   └── customer-center.tsx         # → CustomerCenterScreen
├── src/
│   ├── api/
│   │   ├── client.ts              # Axios instance, base URL auto-detection
│   │   ├── authApi.ts             # Auth endpoints (login, exchange, refresh, me, logout)
│   │   └── recipeApi.ts           # Recipe endpoints (parse URL, save, list, get, health)
│   ├── store/
│   │   ├── authStore.ts           # Auth state (user, tokens, login/logout/restore)
│   │   ├── recipeStore.ts         # Recipe state (URL input, loading, results, health check)
│   │   └── subscriptionStore.ts   # Subscription state (isPro, offerings, customer info)
│   ├── screens/
│   │   ├── InputScreen.tsx        # Home — hero, URL input, API health status dot
│   │   ├── LoadingScreen.tsx      # Animated loading with cycling humorous messages
│   │   ├── ResultScreen.tsx       # Parsed recipe, not-recipe fallback, or error; save button
│   │   ├── PaywallScreen.tsx      # RevenueCat paywall (native component + web presentPaywall)
│   │   └── CustomerCenterScreen.tsx
│   ├── components/
│   │   ├── RecipeCard.tsx         # Full recipe display (meta badges, ingredients, steps, notes)
│   │   ├── SidebarDrawer.tsx      # Animated drawer with saved recipes list
│   │   ├── LoadingView.tsx        # Spinning scissors, progress bar, bouncing dots
│   │   ├── NotRecipePage.tsx      # "Not a recipe" fallback UI
│   │   └── Icons.tsx              # 8 custom SVG icon components
│   ├── theme/
│   │   ├── colors.ts             # Light + dark palettes (~50 semantic tokens each)
│   │   ├── spacing.ts            # Spacing scale (xs–xxl) + border radii
│   │   ├── typography.ts         # Font sizes + pre-composed text styles
│   │   └── ThemeContext.tsx       # React context provider, useThemeColors, useIsDarkMode
│   ├── types/
│   │   └── recipe.ts             # Recipe, RecipeStep, SummarizeResponse interfaces
│   └── config/
│       └── revenuecat.ts         # RevenueCat per-platform API keys + entitlement config
├── assets/                        # Icon, splash, favicon images
├── app.json                       # Expo config (scheme: cutthecrap, web output: single)
├── tsconfig.json                  # Path alias: @/* → ./src/*
├── metro.config.cjs               # Forces CJS resolution for Zustand on web
└── dockerfile
```

### Key Conventions

- **Route files are thin wrappers.** `app/*.tsx` files only render a screen component from `src/screens/`. All logic lives in `src/`.
- **Three-layer pattern:** `src/api/` (Axios client + endpoints) → `src/store/` (Zustand) → `src/screens/` + `src/components/` (UI).
- **Three independent Zustand stores** — `authStore`, `recipeStore`, `subscriptionStore`. No Redux; Context only for theming.
- **Path alias:** `@/*` maps to `./src/*`.
- **Theme system:** `createStyles(colors)` factory pattern, memoized with `useMemo`. System-aware light/dark via `useColorScheme()`.
- **Custom SVG icons** in `Icons.tsx` — no icon library.
- **Platform branching:** Screens check `Platform.OS === 'web'` for RevenueCat, auth redirects, shadows, etc.
- **Max content width:** 768 px on web for readability.
- **API client auto-detection:** Reads `EXPO_PUBLIC_API_BASE` → falls back to Expo debugger host → `localhost:8000` (web) or `10.0.2.2:8000` (Android emulator).
- **Humorous UX copy** throughout loading messages and error states.
- **No persistent auth storage** — tokens live in Zustand memory only (sessions don't survive app restarts).

### Routes

| Path | Screen | Purpose |
|------|--------|---------|
| `/` | `InputScreen` | Home — paste URL, check API health |
| `/auth` | Auth callback | Receives `?code=` from WorkOS, exchanges for tokens |
| `/loading` | `LoadingScreen` | Animated loading while scraping |
| `/result` | `ResultScreen` | Display parsed recipe or error; save button |
| `/paywall` | `PaywallScreen` | RevenueCat subscription paywall |
| `/customer-center` | `CustomerCenterScreen` | Manage existing subscription |

**Navigation flow:** `/` → `/loading` → `/result`. Paywall is pushed when saving exceeds the free limit.

### Environment Variables

Prefixed with `EXPO_PUBLIC_`. See `frontend/.env.example`:

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_BASE` | Backend URL (used by API client) |
| `EXPO_PUBLIC_CHATGPT_API_BASE` | Legacy — backend URL (in .env.example) |
| `EXPO_PUBLIC_CHATGPT_API_KEY` | API key (defined in .env.example, not used by current client) |

---

## Backend (`backend/`)

### Tech Stack

| Layer | Technology |
|-------|------------|
| Language | Python 3.12 |
| Framework | FastAPI 0.115.6 |
| Server | Uvicorn 0.34.0 |
| Database | asyncpg 0.30.0 (async PostgreSQL, no ORM) |
| Auth | WorkOS SDK 5.42.0 + PyJWT (RS256 JWKS verification) |
| HTTP client | httpx 0.28.1 (async) |
| Settings | pydantic-settings 2.7.1 |
| Container | Docker (python:3.12-slim) |

### Commands

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Project Structure

```
backend/
├── app/
│   ├── main.py                    # FastAPI app factory, lifespan, middleware, route mounting
│   ├── config/
│   │   ├── settings.py            # Pydantic BaseSettings (env vars, @lru_cache singleton)
│   │   ├── database.py            # asyncpg connection pool (min 2 / max 20, lazy init)
│   │   └── workos_client.py       # WorkOS client singleton
│   ├── middleware/
│   │   ├── auth.py                # JWT verification dependency + CurrentUser dataclass
│   │   └── error_handler.py       # AppError exception class + generic exception handler
│   ├── routes/
│   │   ├── auth.py                # Auth endpoints (login, callback, exchange, refresh, me, logout)
│   │   ├── chatgpt.py             # ChatGPT / recipe-parsing endpoints
│   │   └── recipes.py             # Saved recipe CRUD endpoints
│   ├── services/
│   │   ├── auth_service.py        # User DB operations (find/create/get profile)
│   │   └── recipe_service.py      # HTML extraction, OpenAI proxy, saved-recipe CRUD
│   └── utils/
│       └── logger.py              # 3-tier logging: console + error.log + combined.log
├── requirements.txt
├── dockerfile
├── containerapp-update.yaml       # Azure Container App deployment
└── logs/                          # Runtime log files
```

### API Routes

All routes under `/api/v1` unless noted. **14 endpoints total.**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| **Infrastructure** | | | |
| `GET` | `/api/health` | No | Health check — pings DB with `SELECT 1` |
| `GET` | `/api/v1/status` | No | Returns API version + timestamp |
| **Auth** (`/api/v1/auth`) | | | |
| `GET` | `/auth/login` | No | Returns WorkOS authorization URL; accepts optional `redirect_uri` for mobile |
| `GET` | `/auth/callback` | No | OAuth callback — 302 redirect to frontend/mobile with auth code |
| `POST` | `/auth/exchange` | No | Exchanges auth code for user + access/refresh tokens; upserts user in DB |
| `POST` | `/auth/refresh` | No | Exchanges refresh token for new access + rotated refresh token |
| `GET` | `/auth/me` | **Yes** | Returns authenticated user's full profile |
| `POST` | `/auth/logout` | **Yes** | Revokes session via WorkOS; returns logout URL |
| **ChatGPT** (`/api/v1/chatgpt`) | | | |
| `POST` | `/chatgpt/parse` | No | Sends raw text to OpenAI for structured recipe extraction |
| `POST` | `/chatgpt/parse-url` | No | Fetches URL, extracts visible text, sends to OpenAI |
| **Recipes** (`/api/v1/recipes`) | | | |
| `GET` | `/recipes` | **Yes** | Lists all saved recipes for authenticated user (newest first) |
| `GET` | `/recipes/count` | **Yes** | Returns count of saved recipes |
| `GET` | `/recipes/{recipe_id}` | **Yes** | Gets a single saved recipe by ID |
| `POST` | `/recipes` | **Yes** | Saves a new recipe |

### Key Conventions

- **No ORM.** All database access is raw parameterized SQL via asyncpg (`$1, $2, ...` placeholders).
- **Layered pattern:** Routes (thin controllers + Pydantic validation) → Services (business logic + DB queries) → Config (settings, pool, WorkOS client).
- **Settings:** `pydantic-settings` `BaseSettings` with `@lru_cache` singleton, loaded from `.env`.
- **Error handling:** Custom `AppError` class with HTTP status codes + generic exception handler middleware. Some routes also return `JSONResponse` directly (mixed pattern).
- **Logging:** 3-tier — console (UTF-8 safe), `logs/error.log` (ERROR only, JSON), `logs/combined.log` (all levels, JSON).
- **CORS:** Origins from env var; `*` appended automatically in development mode. Credentials allowed.
- **Response format:** camelCase keys (manual mapping from snake_case DB columns).
- **Request logging middleware:** Logs `METHOD /path — STATUS (Xms)` for every request.
- **Azure Function proxy for OpenAI** — backend forwards to an Azure Function at `CHATGPT_API_BASE`, not directly to OpenAI.
- **Regex-based HTML parsing** — uses regex to strip tags (no BeautifulSoup).
- **Text truncation** — visible text sent to OpenAI is capped at 12 000 characters.
- **Connection pool:** asyncpg pool, min 2 / max 20, 30 s command timeout, custom `NoResetConnection` for performance.
- **`redirect_slashes=False`** — FastAPI won't auto-redirect `/path/` to `/path`.
- **No tests** exist.

### Pydantic Models

**Auth:** `ExchangePayload` (code), `RefreshPayload` (refreshToken), `UserOut` (id, email, name, …)

**ChatGPT:** `ParseTextPayload` (text, system_prompt?, model, temperature, max_tokens), `ParseUrlPayload` (url, same optional fields)

**Recipes:** `StepPayload` (instruction, ingredients[]), `SaveRecipePayload` (title, description?, sourceUrl?, 7 time fields, servings?, ingredients[], steps[], notes[])

**Auth middleware:** `CurrentUser` dataclass — id, workos_user_id, email, name, session_id

### Environment Variables

See `backend/.env.example`:

| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | Server port | `8000` |
| `ENVIRONMENT` | `development` / `production` | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `POSTGRES_CONNECTION_STRING` | PostgreSQL DSN | localhost dev DB |
| `FRONTEND_URL` | Frontend base URL (for OAuth redirect) | `http://localhost:8081` |
| `WORKOS_CLIENT_ID` | WorkOS OAuth client ID | — |
| `WORKOS_API_KEY` | WorkOS API key | — |
| `WORKOS_REDIRECT_URI` | OAuth callback URL | `http://localhost:8000/api/v1/auth/callback` |
| `CHATGPT_API_BASE` | Azure Function base URL | — |
| `OPENAI_API_KEY` | API key passed to Azure Function | — |
| `CORS_ORIGIN` | Comma-separated allowed origins | localhost dev origins |

---

## Database (`database/`)

### Tech Stack

| Component | Technology |
|-----------|------------|
| Database | PostgreSQL (with `uuid-ossp` extension) |
| Migration scripts | TypeScript (`ts-node`) |
| DB client | `pg` (node-postgres) |
| Env management | `dotenv` (loads from `backend/.env`) |

### Commands

```bash
cd database
npm run migrate   # drops and recreates all tables (destructive)
npm run seed      # inserts dev seed data (currently broken — stale columns)
```

⚠️ **Migration is destructive** — `DROP TABLE IF EXISTS CASCADE` before `CREATE`. No incremental migration tracking. Not production-safe without manual backups.

### Project Structure

```
database/
├── schemas/
│   └── public_schema.sql     # Full DDL: extensions, functions, tables, indexes, triggers
├── scripts/
│   ├── migrate.ts            # Reads all schemas/*.sql and executes them
│   └── seed.ts               # Reads all seeds/*.sql and executes them
├── seeds/
│   └── dev_data.sql          # Sample users (stale — references removed columns)
├── package.json
├── tsconfig.json
└── README.md
```

### Schema

Two tables, both with UUID primary keys and auto-updating `updated_at` triggers:

#### `users`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK, default `uuid_generate_v4()` |
| `workos_user_id` | `VARCHAR(255)` | UNIQUE NOT NULL |
| `email` | `VARCHAR(255)` | UNIQUE NOT NULL |
| `name` | `VARCHAR(255)` | NOT NULL |
| `avatar_url` | `VARCHAR(500)` | nullable |
| `created_at` | `TIMESTAMPTZ` | default `CURRENT_TIMESTAMP` |
| `updated_at` | `TIMESTAMPTZ` | default `CURRENT_TIMESTAMP` |

Indexes: `idx_users_email`, `idx_users_workos_id`

#### `saved_recipes`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK, default `uuid_generate_v4()` |
| `user_id` | `UUID` | NOT NULL, FK → `users(id)` ON DELETE CASCADE |
| `title` | `VARCHAR(500)` | NOT NULL |
| `description` | `TEXT` | nullable |
| `source_url` | `VARCHAR(2000)` | nullable |
| `prep_time` | `VARCHAR(100)` | nullable |
| `cook_time` | `VARCHAR(100)` | nullable |
| `cool_time` | `VARCHAR(100)` | nullable |
| `chill_time` | `VARCHAR(100)` | nullable |
| `rest_time` | `VARCHAR(100)` | nullable |
| `marinate_time` | `VARCHAR(100)` | nullable |
| `soak_time` | `VARCHAR(100)` | nullable |
| `total_time` | `VARCHAR(100)` | nullable |
| `servings` | `VARCHAR(100)` | nullable |
| `ingredients` | `TEXT[]` | NOT NULL, default `'{}'` |
| `steps` | `JSONB` | NOT NULL, default `'[]'` — array of `{instruction, ingredients[]}` |
| `notes` | `TEXT[]` | NOT NULL, default `'{}'` |
| `created_at` | `TIMESTAMPTZ` | default `CURRENT_TIMESTAMP` |
| `updated_at` | `TIMESTAMPTZ` | default `CURRENT_TIMESTAMP` |

Indexes: `idx_saved_recipes_user`, `idx_saved_recipes_created_at` (DESC)

### Known Issues

- **Stale seed data:** `dev_data.sql` references `password_hash` and `is_verified` columns that no longer exist in the schema.
- **Inconsistent dotenv paths:** `migrate.ts` loads from `../../backend/.env`; `seed.ts` uses default `dotenv.config()`.
- **No incremental migrations:** Full drop-and-recreate on every run.