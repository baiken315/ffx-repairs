# Fairfax County Energy & Home Repair Eligibility Checker

A mobile-first, accessible, bilingual (English/Spanish) eligibility checker that helps Fairfax County residents find heating, cooling, and home repair assistance programs. Replaces the unworkable 116-column Excel spreadsheet used by OEEC staff.

## Features

- 7-question adaptive questionnaire (questions suppress when they have no filtering power)
- Client-side filtering — all programs fetched once, filtered in memory (no per-question round trips)
- Case worker view — verbose program details, income tables, full contact info, print-ready
- Admin GUI — manage programs, eligibility criteria, seasonal windows, income thresholds
- Bilingual — English + Spanish, switchable without page reload
- WCAG 2.1 AA accessible — focus management, ARIA roles, 48px touch targets, skip link

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Vue 3 + Vite + TypeScript + Pinia + vue-i18n v9 |
| Backend | Node.js + Express + TypeScript |
| Database | Neon PostgreSQL (postgres 17) |
| Auth | HTTP Basic Auth (admin only, bcrypt) |
| Deployment | Docker + docker-compose + nginx |

## Quick Start (Development)

### Prerequisites
- Node.js 20+
- npm 10+
- Access to the Neon DB (connection string in `.env`)

### 1. Install dependencies

```bash
npm install        # from repo root — installs all workspaces
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

Required variables:

```
DATABASE_URL=postgresql://...        # Neon connection string
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<bcrypt hash>    # see "Generating a password hash" below
```

### 3. Run database migrations

```bash
npm run migrate --workspace=backend
```

This runs all files in `db/migrations/` in order. Safe to re-run (idempotent).

### 4. Start development servers

In two terminals:

```bash
# Terminal 1 — backend (port 3001, hot reload via tsx watch)
npm run dev --workspace=backend

# Terminal 2 — frontend (port 5173, Vite HMR)
npm run dev --workspace=frontend
```
OR

```bash
npm run dev --concurrently
```


Open http://localhost:5173

### 5. Smoke test the API

```bash
# Health
curl http://localhost:3001/api/v1/health

# Programs (27 programs)
curl http://localhost:3001/api/v1/programs | python3 -c "import sys,json; print(len(json.load(sys.stdin)), 'programs')"

# Eligibility check — should return 19 programs
curl -s -X POST http://localhost:3001/api/v1/eligibility/check \
  -H "Content-Type: application/json" \
  -d '{"geography":"fairfax_county","need_types":["heating"]}' | python3 -c "import sys,json; print(len(json.load(sys.stdin)), 'programs')"
```

## Changing the Admin Password

Use the built-in helper script from the repo root:

```bash
npm run set-password -- <new-password>
```

The script:
1. Generates a bcrypt hash (cost factor 12)
2. Automatically updates `ADMIN_PASSWORD_HASH` in `.env`
3. Prints the new hash so you can copy it elsewhere if needed

Then **restart the backend** for the change to take effect:

```bash
# Stop the running backend (Ctrl+C), then:
npm run dev --workspace=backend
```
Alternative to kill backend/frontend:

```bash
lsof -ti:3001 -ti:5173 | xargs kill -9 2>/dev/null && echo "Stopped" || echo "Nothing running"
```
**Default dev credentials:** username `admin`, password `changeme`

> ⚠ Change the password before deploying to production. The default hash is committed to the repo and is not secure.

## Admin Interface

Navigate to http://localhost:5173/admin

- Login with the credentials from `.env`
- Dashboard: program count, programs open today
- Programs list: search, filter, inline activate/deactivate
- Program edit: 5-tab form (Basic Info, Eligibility, Income, Seasonal, Administrators)
- Seasonal calendar: visual grid of all programs × months

## Importing from Excel (one-time setup)

The `All_Energy_Services.xlsx` was already parsed and loaded into Neon. If you need to re-import:

```bash
# Step 1: Parse Excel → JSON (place xlsx in repo root)
npm run seed --workspace=backend
# Output: programs_import.json — REVIEW CAREFULLY before importing

# Step 2: Load into DB via admin endpoint
curl -X POST http://localhost:3001/api/v1/admin/import \
  -H "Authorization: Basic $(echo -n 'admin:changeme' | base64)" \
  -H "Content-Type: application/json" \
  -d @programs_import.json
```

## Production Deployment (Docker)

### Build and start

```bash
# Set production env vars
cp .env.example .env
# Edit .env with real DATABASE_URL, ADMIN_PASSWORD_HASH, etc.

# Build and start (frontend on :80, API proxied via nginx)
docker-compose up --build -d
```

### Dev with hot reload

```bash
docker-compose -f docker-compose.yml -f docker-compose.override.yml up
# Frontend HMR on :5173, backend tsx watch on :3001
```

### Environment variables for production

```
DATABASE_URL=postgresql://...         # Neon connection string (required)
ADMIN_USERNAME=admin                  # Admin login username
ADMIN_PASSWORD_HASH=<bcrypt hash>     # Generated with bcrypt, rounds=12
FRONTEND_URL=https://your-domain.com  # For CORS origin
PORT=3001                             # Backend port (default 3001)
NODE_ENV=production
```

## Project Structure

```
ffx_home_repair/
├── docker-compose.yml               # Production: nginx(:80) + backend(:3001)
├── docker-compose.override.yml      # Dev: HMR + tsx watch
├── .env.example                     # Template — copy to .env
├── package.json                     # npm workspace root
│
├── backend/
│   ├── src/
│   │   ├── index.ts                 # Express app entry point
│   │   ├── config.ts                # Env var loader
│   │   ├── db/
│   │   │   ├── pool.ts              # Neon pg connection pool
│   │   │   └── migrate.ts           # Idempotent migration runner
│   │   ├── middleware/
│   │   │   ├── auth.ts              # Basic Auth for /admin/* routes
│   │   │   └── errorHandler.ts
│   │   ├── routes/
│   │   │   ├── programs.ts          # GET /api/v1/programs
│   │   │   ├── questions.ts         # GET /api/v1/questions
│   │   │   ├── eligibility.ts       # POST /api/v1/eligibility/check
│   │   │   └── admin/               # CRUD for programs, import, thresholds
│   │   ├── services/
│   │   │   └── programService.ts    # Batch-fetches all program data
│   │   └── types/index.ts
│
├── frontend/
│   ├── src/
│   │   ├── stores/eligibility.ts    # Pinia: questionnaire state + filtering
│   │   ├── locales/
│   │   │   ├── en.json              # English UI strings
│   │   │   └── es.json              # Spanish UI strings
│   │   ├── components/
│   │   │   ├── questionnaire/       # QuestionSingle, QuestionMulti, QuestionIncome
│   │   │   ├── results/             # ProgramCard, ProgramCardCW
│   │   │   └── common/             # AppHeader, LanguageToggle, ProgressBar
│   │   └── views/
│   │       ├── HomeView.vue
│   │       ├── QuestionnaireView.vue
│   │       ├── ResultsView.vue
│   │       ├── CaseWorkerView.vue   # /caseworker — verbose, print-ready
│   │       └── admin/               # Login, Dashboard, Programs, Seasonal
│
└── db/
    ├── migrations/
    │   ├── 001_initial_schema.sql   # All tables (run first)
    │   └── 002_seed_lookups.sql     # Reference data + questions
    └── seeds/
        └── import_excel.ts          # One-time xlsx → JSON converter
```

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/health` | — | Health check + timestamp |
| GET | `/api/v1/questions` | — | All questionnaire questions + options |
| GET | `/api/v1/programs` | — | All active programs with full embedded data |
| GET | `/api/v1/programs?view=caseworker` | — | Same + `full_description` |
| POST | `/api/v1/eligibility/check` | — | Server-side filter fallback |
| GET/POST | `/api/v1/admin/programs` | Basic | List / create programs |
| GET/PUT/DELETE | `/api/v1/admin/programs/:id` | Basic | Get / update / delete program |
| GET/PUT | `/api/v1/admin/programs/:id/seasonal` | Basic | Manage seasonal windows |
| GET/PUT | `/api/v1/admin/income-thresholds/:id` | Basic | Update income thresholds |
| POST | `/api/v1/admin/import` | Basic | Bulk JSON import |

**Locale**: Include `Accept-Language: es` header for Spanish responses.

## Adding a New Language

1. Copy `frontend/src/locales/en.json` to `frontend/src/locales/fr.json`
2. Translate all values (keys must be identical)
3. Register in `frontend/src/main.ts`:
   ```typescript
   import fr from './locales/fr.json'
   const i18n = createI18n({ messages: { en, es, fr } })
   ```
4. Add button to `LanguageToggle.vue`
5. Add bilingual columns to DB and backend locale resolver (optional — program names/descriptions)

## Database Notes

- All program content (names, descriptions) is stored in `_en` / `_es` columns
- Income thresholds are normalized: one row per `(benchmark_id, household_size)` pair
- Seasonal windows are date ranges — programs with no windows are open year-round
- Decision tree questions live in the DB — reorder without code deploys

### Useful queries

```sql
-- Program count by need type
SELECT nt.code, COUNT(*) FROM programs p
JOIN program_need_types pnt ON pnt.program_id = p.id
JOIN need_types nt ON nt.id = pnt.need_type_id
GROUP BY nt.code;

-- Programs open in February 2026
SELECT p.name_en FROM programs p
JOIN seasonal_windows sw ON sw.program_id = p.id
WHERE sw.open_date <= '2026-02-28' AND sw.close_date >= '2026-02-01'
UNION
SELECT name_en FROM programs WHERE id NOT IN (
  SELECT DISTINCT program_id FROM seasonal_windows
);
```
