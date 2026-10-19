# PhishGuardAI — System & Architecture Documentation

**Purpose of this document:** This is a machine-friendly briefing of the PhishGuardAI
system. Any AI model reading this file should be able to accurately describe the
system, reason about its architecture, and produce derivative documents (reports,
proposals, theses chapters, diagrams) without needing to re-explore the codebase.

**Companion file:** `PROJECT_PROPOSAL.md` — an academic project proposal adapted
from the user's sample proposal (105-994_Nestony_Biamungu_Project Proposal.pdf) to
this system. Use this document as the source of truth when regenerating or
extending that proposal.

---

## 1. System overview

**PhishGuardAI** is a web-based, explainable email phishing detection system.

A user submits an email (subject, sender, body, optional headers, links, and
attachment metadata). The backend scores the message against multiple independent
signal categories (keywords, sender reputation, URLs, headers, attachments,
urgency, brand alignment, and an optional ML classifier), subtracts a "trust
credit" for legitimacy signals, and returns:

- a binary verdict: `Phishing` or `Safe`
- a fine-grained `category`
- a numeric `score` (0–1, higher = riskier) and `risk_level` (Low / Medium / High)
- a human-readable `summary`, `reason`, `risk_signals`, `trust_signals`,
  `recommended_actions`
- an `analysis_breakdown`: the per-signal contribution that produced the score

The core design principle is **explainability**: every verdict comes with a
per-signal breakdown so users and reviewers can see *why* a message was flagged.
A second principle is **graceful degradation**: heavy ML/network dependencies
(transformers, spaCy, WHOIS) are optional and individually switchable; when
absent, the detector runs as pure heuristics with no code changes.

Two personas use the system:

- **End users** — scan single or batch emails, view their scan history, manage
  settings, submit feedback on wrong verdicts, request features.
- **Admins** — manage users, review all stored results, respond to feedback,
  manage trusted domains (for sign-up auto-approval), toggle global and per-user
  feature flags, approve/reject sign-up requests, view platform statistics.

---

## 2. Technology stack

| Layer | Technology | Notes |
| --- | --- | --- |
| Backend framework | FastAPI 0.135 (Python 3.12) | OpenAPI docs at `/docs` (Swagger) and `/redoc` |
| Server | Uvicorn 0.42 | `uvicorn backend.main:app --reload --port 8000` |
| ORM / Database | SQLAlchemy 2.0 + SQLite (`backend/phishguard.db`) | Lightweight, file-based; no external DB server |
| Migrations | Hand-rolled `PRAGMA table_info` column adds in `models.py::_ensure_sqlite_columns` | No Alembic |
| Auth | JWT (python-jose, HS256) + bcrypt (passlib) | 60-minute access tokens |
| Rate limiting | slowapi (`core/limiter.py`) | Per-endpoint limits, keyed by remote address |
| Parsing | Python `email` stdlib + BeautifulSoup 4 | Raw MIME parsing, HTML link extraction |
| Optional ML | transformers (`facebook/bart-large-mnli` zero-shot), spaCy (`en_core_web_sm`), python-whois | In `requirements-ml.txt`; all feature-flag gated |
| Frontend | React 19 + Vite 8 + Tailwind CSS 4 | `frontend/`, SPA with client-side routing |
| Routing (FE) | react-router-dom 7 | Public, `/app` (user), `/admin` (admin) areas |
| UI extras | react-hot-toast, recharts, FontAwesome, jwt-decode | Charts on admin dashboard, toast notifications |
| Tests | pytest (backend), ESLint (frontend) | `python -m pytest backend/tests` |
| CI | GitHub Actions (`.github/workflows/ci.yml`) | Backend pytest job + frontend lint/build job |

---

## 3. Repository layout

```
AI-Phishing-Detection-System/
├── .github/workflows/ci.yml    # CI: backend pytest + frontend lint/build
├── README.md                   # Project readme (setup/run instructions)
├── SYSTEM_DOCUMENTATION.md     # THIS FILE
├── PROJECT_PROPOSAL.md         # Academic proposal adapted to this system
├── backend/                    # FastAPI service
│   ├── main.py                 # App factory: CORS, rate limiting, docs, routers
│   ├── models.py               # SQLAlchemy models + SQLite column migrations
│   ├── auth.py                 # JWT issuing/verification + bcrypt (HS256, 60 min)
│   ├── dependencies.py         # get_current_user / require_admin
│   ├── seed_admin.py           # Create the first admin user
│   ├── feature_flags.json      # Global ENABLE_* flags
│   ├── core/limiter.py         # slowapi rate limiter instance
│   ├── routes/
│   │   ├── predict.py          # /api/v1 predict, batch, results, feedback
│   │   ├── auth.py             # /api/v1/auth/login
│   │   ├── signup.py           # /api/v1/auth/signup-request
│   │   ├── settings.py         # /api/v1/settings feature flags & requests
│   │   └── admin.py            # /api/v1/admin/* (require_admin)
│   ├── services/
│   │   ├── detector.py         # Detection engine (913 lines) — heart of the system
│   │   └── feature_flags.py    # Flag resolution: env > per-user > global file
│   ├── schemas/email.py        # Pydantic request/response models
│   ├── evaluation/             # Offline evaluation harness + labeled dataset
│   ├── static/                 # Swagger CSS + logo
│   ├── tests/                  # pytest suite (4 test modules)
│   ├── requirements.txt        # Core deps (heuristics-only runtime)
│   ├── requirements-ml.txt     # Optional ML extras (torch/transformers/spacy)
│   ├── requirements-dev.txt    # Test/dev deps
│   └── phishguard.db           # SQLite database (created at runtime)
└── frontend/                   # React SPA
    ├── src/
    │   ├── App.jsx             # All route definitions
    │   ├── pages/              # Landing, Pricing, Scanner, BatchScanner, History,
    │   │                       # Dashboard, Settings, Admin* pages
    │   ├── components/         # ResultPanel, ScoreGauge, VerdictBadge,
    │   │                       # ProtectedRoute, EmailFormSections, CollapsibleSection
    │   ├── services/api.js     # Fetch wrapper + response normalization
    │   └── utils/              # analysis.js, payload.js, emailContract.js
    └── dist/                   # Production build output
```

> Note: `backend/` and `frontend/` each currently carry their own `.git`/remote;
> the root repo also tracks the overall project.

---

## 4. Backend architecture

### 4.1 Application factory (`backend/main.py`)

- Creates the `FastAPI` app titled **PhishGuardAI API** v1.1.0 with custom
  OpenAPI tags (`phishing-detection`, `system`, `auth`, `admin`).
- Calls `init_db()` at import time (creates tables + applies column migrations).
- Middleware stack (outermost last):
  1. **CORS** — origins from `PHISHGUARD_CORS_ORIGINS` env (default
     `http://localhost:5173`, `http://127.0.0.1:5173`), credentials allowed.
  2. **slowapi rate limiting** (`SlowAPIMiddleware`) + `RateLimitExceeded` handler.
  3. **Request timing** — adds `X-Process-Time` header, logs method/path/status/duration.
  4. **Unhandled-exception handler** — returns a generic 500 JSON, never leaks stack traces.
- Custom Swagger UI at `/docs` (bundled `swagger-custom.css`), ReDoc at `/redoc`.
- Static files mounted at `/static`.
- System endpoints: `GET /` (API overview), `GET /health` (status/version/timestamp).
- Routers mounted:
  - `predict_router` → prefix `/api/v1`
  - `auth_router` → prefix `/api/v1/auth` (declared in the router itself)
  - `signup_router` → prefix `/api/v1/auth`
  - `settings_router` → prefix `/api/v1/settings`
  - `admin_router` → prefix `/api/v1/admin`, router-level `Depends(require_admin)`

### 4.2 API reference

**Auth: `/api/v1/auth`**

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `POST /api/v1/auth/login` | public | Email + password → JWT (`sub`=email, `role`), 60-min expiry |
| `POST /api/v1/auth/signup-request` | public | Create sign-up request; **auto-approves** if the email domain is in `trusted_domains`, else status `pending` for admin approval |

**Detection: `/api/v1`**

| Method & path | Auth | Rate limit | Purpose |
| --- | --- | --- | --- |
| `POST /api/v1/predict` | JWT | 30/min | Analyze a single email; stores a `detection_results` row; returns `EmailResponse` with `record_id` |
| `POST /api/v1/batch-predict` | JWT | 10/min | Analyze up to **10** emails in one request; per-item validation errors include the item index |
| `GET /api/v1/results/recent?limit=` | JWT | 30/min | The authenticated user's most recent stored results (limit clamped 1–50) |
| `GET /api/v1/results/{record_id}` | JWT | 30/min | Full stored record incl. breakdown, headers, attachments, linked feedback (admins may read any record) |
| `POST /api/v1/feedback` | JWT | 20/min | Submit reviewer feedback on a verdict (`detection_result_id` or legacy `email_id` required) |

**Settings: `/api/v1/settings`**

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `GET /api/v1/settings/features` | JWT | Read effective global feature flags |
| `PUT /api/v1/settings/features` | admin | Update global flags (persisted to `feature_flags.json`) |
| `GET /api/v1/settings/my-features` | JWT | The current user's effective flags (global + per-user overrides) |
| `POST /api/v1/settings/feature-request` | JWT | Request a feature be enabled for the account |

**Admin: `/api/v1/admin/*` — every route requires the `admin` role**

| Method & path | Purpose |
| --- | --- |
| `GET/POST /users`, `PUT/DELETE /users/{id}` | User CRUD (create sets hashed password + role) |
| `GET /results`, `DELETE /results/{id}` | List/delete all stored analyses |
| `GET /feedback`, `PUT/DELETE /feedback/{id}` | Reviewer feedback queue; respond/close |
| `GET /stats` | Platform statistics for the admin dashboard |
| `GET /signup-requests`, `PUT .../{id}/approve`, `PUT .../{id}/reject`, `POST /signup-requests/bulk-approve` | Sign-up moderation |
| `GET/POST /trusted-domains`, `DELETE /trusted-domains/{id}` | Manage domains that auto-approve sign-ups |
| `GET /feature-requests`, `PUT .../{id}/resolve`, `PUT .../{id}/dismiss` | Triage user feature requests |
| `GET/POST /user-features`, `DELETE /user-features?email=&feature=` | Per-user flag overrides |

**System:** `GET /`, `GET /health`, `GET /docs`, `GET /redoc`.

### 4.3 Authentication & authorization

- `auth.py`: secret from `PHISHGUARD_SECRET_KEY` env, otherwise generated once and
  stored in gitignored `backend/.secret_key` (warning logged — must be set in
  production). Algorithm **HS256**, token TTL **60 minutes**.
- Passwords hashed with **bcrypt** (`passlib.CryptContext`).
- `dependencies.get_current_user` reads `Authorization: Bearer <jwt>` via
  OAuth2 bearer scheme, verifies token, returns `{sub: email, role: ...}`.
  `require_admin` additionally rejects non-`admin` roles (403).
- Roles: `user` (default), `admin`. First admin created via `seed_admin.py`
  (env `PHISHGUARD_ADMIN_EMAIL` / `PHISHGUARD_ADMIN_PASSWORD`).
- Sign-up moderation flow (trust-based):
  1. User submits name/email/password/organization.
  2. If email domain ∈ `trusted_domains` → user created immediately, request
     recorded as `auto_approved`.
  3. Else → request stored as `pending`; admin approves/rejects; approval creates
     the user account.

### 4.4 Data model (SQLite via SQLAlchemy — `backend/models.py`)

| Table | Key columns | Notes |
| --- | --- | --- |
| `users` | `id`, `email` (unique), `hashed_password`, `role` (`user`/`admin`) | Login principals |
| `detection_results` | `id`, `subject`, `sender`, `body`, `prediction`, `category`, `confidence`, `score`, `risk_level`, `matched_keywords` (JSON str), `reason`, `summary`, `risk_signals`, `trust_signals`, `recommended_actions`, `analysis_breakdown` (JSON str), `headers` (JSON str), `attachment_metadata` (JSON str), `created_at`, `user_id` FK → users | One row per analysis; `user_id` links to the scanner |
| `feedback` | `id`, `email_id`, `detection_result_id` FK, `actual_prediction`, `user_feedback`, `admin_response`, `status` (`open`…), `matched_keywords`, `reason`, `created_at` | Human review of verdicts (false positives/negatives) |
| `signup_requests` | `id`, `full_name`, `email` (unique), `organization`, `hashed_password`, `status` (`pending`/`approved`/`rejected`/`auto_approved`), `created_at` | Moderation queue + audit |
| `trusted_domains` | `id`, `domain` (unique) | Domains whose sign-ups auto-approve |
| `user_features` | `id`, `user_id` FK, `feature_name`, `enabled` | Per-user feature-flag overrides |
| `feature_requests` | `id`, `user_email`, `feature_name`, `status`, `created_at` | Users asking for a feature to be enabled |

JSON-ish fields are stored as TEXT (JSON strings) and re-hydrated in route
serialization helpers (`_load_json_field`).

### 4.5 Feature flags (`services/feature_flags.py`)

Global flags in `backend/feature_flags.json`:

```json
{ "ENABLE_SPACY": true, "ENABLE_TRANSFORMERS": true, "ENABLE_WHOIS": true }
```

- `ENABLE_SPACY` — spaCy lemmatization during text preprocessing (`en_core_web_sm`).
- `ENABLE_TRANSFORMERS` — zero-shot ML scoring with `facebook/bart-large-mnli`.
- `ENABLE_WHOIS` — WHOIS domain-age lookups for linked URLs (cached).

**Resolution precedence** (`get_effective_flag(name, user_id, db)`):
`PHISHGUARD_<FLAG>` environment variable → per-user override in `user_features`
(admin-managed) → global `feature_flags.json` → code default (`False`).

This layering is why CI sets all three env flags to `false` (fast, offline tests)
while a production deployment can enable them per environment or per user.

---

## 5. The detection engine (`backend/services/detector.py`)

Entry point: `async detect_phishing(subject, sender, body, headers, attachments,
links, body_text, body_html, user_id, db) -> DetectionResult`.

### 5.1 Signal categories and scoring

Each category is computed independently (CPU-bound ones dispatched with
`asyncio.to_thread`, then `asyncio.gather`ed):

| Signal | Function | Contributes to score |
| --- | --- | --- |
| Keywords | `_keyword_analysis` | Weighted suspicious phrases, e.g. `account suspended` 0.28, `wire transfer` 0.28, `click here` 0.22, `reset password` 0.22, `urgent` 0.16 (see `SUSPICIOUS_KEYWORD_WEIGHTS`) |
| Sender | `_sender_analysis` | Free-mailbox (gmail/hotmail/outlook/yahoo/icloud/proton) vs branded domain; local-part markers (`security`, `billing`, `payroll`, `admin`) add small scores |
| URLs | `_url_analysis` | Shorteners (bit.ly, tinyurl, goo.gl, t.co), free/nonsense TLDs (.tk/.ml/.ga/.cf), IP-literal or IDN hosts, `secure-login`/`verify-account` patterns, non-HTTPS, redirect params (e.g. `redirect`/`url`/`continue`), anchor-text vs destination mismatch, sender-domain/link-domain misalignment, WHOIS domain age (if enabled) |
| Headers | `_header_analysis` | SPF/DKIM/DMARC fail adds risk (e.g. SPF fail +0.12); passes yield trust signals |
| Attachments | `_attachment_analysis` | Risky extensions (`.scr`, `.exe`, …), double-extension disguises, oversized files, password-protected attachments |
| Urgency | `_urgency_analysis` | Exclamation marks ×0.04 + CAPS ratio ×0.12 + urgent phrases ×0.05, capped at 0.22 |
| ML (optional) | `_ml_phishing_score` | Zero-shot classifier P(phishing) over labels `phishing/safe/newsletter`, weighted ×0.22 |
| Brand/sender alignment | `_brand_alignment_score` | Reply-To/Return-Path domain vs sender domain mismatch (adds risk); alignment adds trust |

**Scoring formula (the core):**

```
raw_score      = min(keyword + sender + url + (ml × 0.22) + urgency
                     + headers + attachments + alignment, 1.0)
trust_credit   = min( 0.12 (header trust) + 0.07 (marketing patterns)
                    + 0.05 (transactional patterns) + 0.05 (link alignment)
                    + 0.04 (brand alignment trust) + 0.02 (attachment trust),
                    0.24 )
adjusted_score = max(raw_score − trust_credit, 0.0)
```

Trust patterns: `MARKETING_TRUST_PATTERNS` (unsubscribe, preferences, view in
browser…) and `TRANSACTIONAL_TRUST_PATTERNS` (receipt, invoice, order, ticket…)
recognize legitimate newsletter/transactional mail.

### 5.2 Decision thresholds and labels

- **Verdict:** `prediction = "Phishing"` if `adjusted_score ≥ 0.58`
  (`PHISHING_THRESHOLD`), else `"Safe"`. (There is no three-way verdict; the
  `suspicious` value exists only as a *category*.)
- **Risk level** (`_classify_risk_level`): **High** ≥ 0.75, **Medium** ≥ 0.35,
  **Low** < 0.35.
- **Category** (`_classify_category`) — one of:
  `phishing`, `suspicious`, `legitimate_marketing`, `transactional`,
  `security_notice`, `general_safe`.
- **Confidence:** equals `adjusted_score` when Phishing, `1 − adjusted_score`
  when Safe.

### 5.3 Output / explainability contract (`EmailResponse`)

```
record_id              # saved DB row id
prediction             # "Phishing" | "Safe"
category               # phishing | suspicious | legitimate_marketing |
                       # transactional | security_notice | general_safe
confidence, score      # floats 0–1
risk_level             # Low | Medium | High
matched_keywords[]     # keyword/sender/url/urgency/header/attachment markers
reason                 # short primary explanation
summary                # analyst-style paragraph for UI display
risk_signals[]         # human-readable statements that raised risk
trust_signals[]        # human-readable statements that supported legitimacy
recommended_actions[]  # practical next steps for the user
analysis_breakdown{}   # per-signal contributions:
                       # keyword, sender, url, ml, urgency, headers,
                       # attachments, alignment, trust_credit
```

`analysis_breakdown` is the explainability artifact: its entries sum to (roughly)
the raw score, and `trust_credit` is subtracted to produce `score`.

### 5.4 Robustness properties

- Optional dependencies never hard-fail: classifier/NLP/WHOIS loads are wrapped
  in try/except, attempted once, and degrade to `0.0`/no-op with a logged warning.
- Heavy work is async (`asyncio.to_thread`), so the event loop stays responsive;
  batch scans run concurrently via `asyncio.gather` while sharing one DB session
  safely (session touched only on the event-loop thread).
- Detection runs even if headers/links/attachments are omitted.

---

## 6. Frontend architecture (`frontend/`)

### 6.1 Stack & scripts

React 19.2, Vite 8, Tailwind CSS 4 (`@tailwindcss/vite`), react-router-dom 7,
react-hot-toast, recharts, jwt-decode, FontAwesome. Scripts: `npm run dev`
(port 5173), `npm run build`, `npm run lint`, `npm run preview`.

### 6.2 Routing (`src/App.jsx`)

| Area | Routes | Guard |
| --- | --- | --- |
| Public | `/` (Landing), `/pricing` (Pricing) | none |
| User | `/app` (Dashboard), `/app/scan` (Scanner), `/app/batch` (BatchScanner), `/app/history` (History), `/app/settings` (Settings) | `<ProtectedRoute>` |
| Admin | `/admin` (AdminDashboard), `/admin/users`, `/admin/results`, `/admin/feedback`, `/admin/domains`, `/admin/features`, `/admin/feature-requests`, `/admin/requests` | `<ProtectedRoute roleRequired="admin">` |
| Legacy redirects | `/scanner/*` → `/app/*` | — |
| Fallback | `*` → `/` | — |

`ProtectedRoute` reads the JWT from `localStorage.authToken` (decoded with
jwt-decode) and redirects unauthenticated users to `/`; role is checked for the
admin area.

### 6.3 API layer (`src/services/api.js`)

- Base URL: `localStorage.API_BASE_URL` or default `http://localhost:8000`
  (runtime-changeable from the Settings page).
- Helpers: `getApi/postApi/putApi/deleteApi` (auto `Authorization: Bearer` header),
  `loginUser`, `scanEmail`, `batchScanEmails`, `getRecentResults`, `getResultById`,
  `submitSignupRequest`, feature-flag helpers.
- Central `handleResponse` maps 422 (validation issues), 429 (rate limit), and
  `detail` errors to friendly JS errors.
- Response normalizers (`normalizeAnalysisResult` etc.) clamp scores, derive
  labels via `utils/analysis.js`, and default missing arrays/objects — the UI
  never assumes backend fields are present.

### 6.4 Key pages & components

- **Scanner** — single-email form (subject/sender/body + optional headers, links,
  attachments; `utils/payload.js` builds the request payload, `utils/emailContract.js`
  defines the contract) → renders `ResultPanel` with `ScoreGauge` (score meter)
  and `VerdictBadge` (Phishing/Safe + risk color).
- **BatchScanner** — up to 10 emails per `batch-predict` call.
- **History** — recent stored results with detail view.
- **Dashboard** — overview of recent activity.
- **Settings** — API base URL override, personal feature flags, feature requests.
- **Admin pages** — users CRUD, all results, feedback triage, trusted domains,
  global feature flags, feature requests, sign-up requests (approve/reject/bulk),
  stats (recharts).
- Styling: dark theme (`#0a0c10` background, slate text), Tailwind utilities;
  landing styles in `src/assets/landing-style.css`.

---

## 7. Evaluation, tests, CI

### 7.1 Offline evaluation (`backend/evaluation/`)

```powershell
python -m backend.evaluation.evaluate --dataset backend/evaluation/sample_emails.json
```

- Loads a labeled JSON dataset (15 samples in `sample_emails.json`, each with
  `name`, `subject`, `sender`, `body`, optional `headers`/`attachments`,
  `expected_prediction`, `expected_category`, optional `notes`).
- Runs `detect_phishing` on each sample and prints JSON metrics:
  `prediction_accuracy`, `category_accuracy`, `false_positives`,
  `false_negatives`, `category_misses`, plus per-sample rows.
- `import_real_emails.py` merges additional real-world labeled emails into the
  dataset (deduplicated by name).

### 7.2 Test suite (`backend/tests/`, pytest)

| File | Covers |
| --- | --- |
| `test_api.py` | Predict/batch/results/feedback endpoints, response contract, score bounds |
| `test_auth_admin.py` | Login, JWT, admin-only guard, admin user CRUD |
| `test_signup_requests.py` | Sign-up flow incl. trusted-domain auto-approval |
| `test_feature_requests_admin.py` | Feature requests + admin triage endpoints |

Run: `python -m pytest backend/tests`. Frontend quality gate: `npm run lint` + `npm run build`.

### 7.3 CI (`.github/workflows/ci.yml`)

- Triggers: push to `main`, all pull requests; concurrency cancels stale runs.
- **Backend job:** Python 3.12, installs `requirements-dev.txt`, runs pytest with
  `PHISHGUARD_ENABLE_SPACY/TRANSFORMERS/WHOIS=false` and a CI-only secret key —
  tests never download models or hit the network.
- **Frontend job:** Node 22, `npm ci`, `npm run lint`, `npm run build`.

---

## 8. Configuration (environment variables)

| Variable | Purpose | Default |
| --- | --- | --- |
| `PHISHGUARD_SECRET_KEY` | JWT signing key | auto-generated → `backend/.secret_key` |
| `PHISHGUARD_CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173,http://127.0.0.1:5173` |
| `PHISHGUARD_ENABLE_SPACY` | Override `ENABLE_SPACY` | from `feature_flags.json` |
| `PHISHGUARD_ENABLE_TRANSFORMERS` | Override `ENABLE_TRANSFORMERS` | from `feature_flags.json` |
| `PHISHGUARD_ENABLE_WHOIS` | Override `ENABLE_WHOIS` | from `feature_flags.json` |
| `PHISHGUARD_ADMIN_EMAIL` | Seed-admin email (in `seed_admin.py`) | `admin@phishguard.ai` |
| `PHISHGUARD_ADMIN_PASSWORD` | Seed-admin password (required) | — |

Env overrides always beat `feature_flags.json`.

---

## 9. Running the system

```powershell
# Backend
python -m venv backend/venv
backend\venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt        # core; add requirements-ml.txt for ML
uvicorn backend.main:app --reload --port 8000  # docs: http://localhost:8000/docs

# First admin
$env:PHISHGUARD_ADMIN_PASSWORD = "strong-password"
python -m backend.seed_admin

# Backend tests / evaluation
python -m pytest backend/tests
python -m backend.evaluation.evaluate

# Frontend
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run lint; npm run build
```

---

## 10. Design principles & conventions (for anyone extending the system)

1. **Explainability first** — never return a bare verdict; add signals and keep
   `analysis_breakdown` keys in sync with the scoring formula.
2. **Graceful degradation** — new optional dependencies must be feature-flagged
   and fail soft (like ML/WHOIS/spaCy today).
3. **Two-tier flags** — global file, per-user override, env override; use
   `get_effective_flag(name, user_id, db)`.
4. **JSON-in-text columns** — complex fields stored as JSON strings; serialize
   with `dumps_json` and parse with `_load_json_field`.
5. **Dual import style** — backend modules import via
   `try: backend.x / except ModuleNotFoundError: x` so files work both as a
   package and standalone. Preserve this pattern when editing.
6. **Auth on every non-public route** — JWT dependency; admin routes additionally
   `Depends(require_admin)` at the router level.
7. **Rate limits are part of the contract** — see §4.2; tests may hit them.
8. **CI must stay offline** — never make core tests require ML downloads/WHOIS.
9. **Frontend normalizes everything** — backend responses pass through the
   normalizers in `api.js`; tolerate missing/extra fields.

---

## 11. Writing an academic proposal from this system (AI guidance)

When asked to produce or adapt a project proposal (e.g., matching the structure of
the user's sample: *105-994_Nestony_Biamungu_Project Proposal.pdf*, Faculty of ICT,
Cavendish University Zambia), map the system onto the sample's chapters as follows:

| Sample proposal section | What to write for PhishGuardAI |
| --- | --- |
| Title / cover | e.g. "Explainable AI-Powered Phishing Email Detection and Risk Analysis" — keep the student's name, number, email, mobile from the sample |
| 1.0 Introduction / 1.5 Problem Statement | Email phishing is a leading attack vector; manual inspection of emails is slow, inconsistent, and non-technical users cannot judge headers/URLs. Existing tools give black-box scores. |
| 1.1 Background | Evolution from rule-based filters → ML spam/phishing filters → explainable AI; context of Zambia/institutions with limited tooling. |
| 1.3 Significance | End users (safe decisions, learn why), admins (review queue, statistics), institutions (data-driven email security), research (explainable AI in the local context). |
| 1.4 Scope | Single + batch email analysis, explainable breakdowns, role-based web app, offline evaluation harness. Tech actually used: **FastAPI + SQLAlchemy/SQLite backend, React 19 + Tailwind frontend** (do NOT copy MongoDB/Node from the sample — it must reflect this system). |
| 1.6–1.7 Objectives / Research Questions | Derive from the engine: analyze which signals discriminate phishing (keywords/URLs/headers/urgency), evaluate heuristic+ML hybrid scoring, quantify accuracy vs labeled data, design explainable output, build the web dashboard with roles. |
| 1.8 Conceptual framework | Signal-fusion + explainability model: `[email fields] → signal analyzers → weighted raw score → trust credit → adjusted score → verdict/risk level → breakdown → user & admin action`. Ground in Behavioural/Pattern-analytics + ensemble scoring theories. |
| 2.x Literature review | ML for phishing detection (URL/text features, ML classifiers), explainability gap, gap = few systems combining multi-signal weighted scoring with per-signal explanations + human feedback loop + configurable ML. |
| 3.x Research design | Quantitative, descriptive, predictive; development via iterative/prototype software engineering (Pressman/Sommerville). |
| 3.2 Baseline study | Data: labeled email datasets (`backend/evaluation/sample_emails.json` + real imported emails); metrics: prediction accuracy, category accuracy, FP/FN counts (`evaluate.py`); techniques: weighted heuristics + optional zero-shot BART classifier. |
| 3.3 System design | Context diagram: Users → System (scan/history/settings); Admins → System (users/results/feedback/flags); Optional AI/WHOIS modules → scoring. Layers: Presentation (React SPA) / Application (FastAPI routers + auth) / Detection (detector service) / Data (SQLite). Modules: Authentication, Detection, Persistence/History, Feedback, Feature flags, Admin console, Evaluation. Class diagram: `User`, `DetectionResult`, `Feedback`, `SignupRequest`, `TrustedDomain`, `FeatureRequest`, `UserFeature` (see §4.4). Data model: the seven tables in §4.4. |
| 3.3.5 Timeline | 16 weeks: literature → dataset & baseline → detector signals & thresholds → API/auth/persistence → React UI → evaluation & tuning → testing/docs. |
| Bibliography | Keep domain-relevant citations: phishing detection surveys, ML/anti-phishing literature, software-engineering texts (Pressman, Sommerville) used by the sample. Verify every citation before submission. |

**Rules when generating:**
1. Mirror the sample's chapter structure and numbering exactly (Chapter One/Two/Three, `1.0`, `1.1`, …).
2. Use only facts from this document — no invented endpoints, tech, or metrics.
3. Where the sample names different tech (MongoDB Atlas, Node/Flask), substitute
   this system's real stack (FastAPI, SQLite, React 19 + Tailwind).
4. State measured metrics only if actually run (e.g., from `evaluate.py`);
   otherwise phrase as expected/target metrics.
5. Keep the sample's tone: short declarative paragraphs, citations in
   (Author, Year) form, bullets for scope/objectives, ASCII diagrams for design.
