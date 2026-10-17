# PhishGuardAI

Explainable email phishing detection. A FastAPI backend scores each message with
weighted heuristics (and optional ML models) and returns a human-readable
breakdown of why a message looks safe or suspicious. A React frontend provides
the user scanner and an admin console for users, results, feedback, and feature
configuration.

## Repository layout

```
AI-Phishing-Detection-System/
├── .github/workflows/ci.yml   # CI: backend tests + frontend lint/build
├── .vscode/settings.json      # shared editor config (venv interpreter)
├── backend/                   # FastAPI service (its own git repository)
│   ├── main.py                # app factory: CORS, rate limiting, docs, routers
│   ├── models.py              # SQLAlchemy models + SQLite column migrations
│   ├── auth.py                # JWT issuing/verification + bcrypt
│   ├── dependencies.py        # get_current_user / require_admin
│   ├── seed_admin.py          # create the first admin user
│   ├── feature_flags.json     # global ENABLE_* flags
│   ├── routes/                # predict, auth, signup, settings, admin routers
│   ├── services/detector.py   # detection engine (heuristics + optional ML)
│   ├── schemas/email.py       # request/response models
│   ├── static/                # swagger CSS + logo
│   ├── evaluation/            # offline evaluation against a labeled dataset
│   ├── requirements.txt       # core deps (no ML)
│   ├── requirements-ml.txt    # optional ML extras (torch/transformers/spacy)
│   └── tests/                 # pytest suite
└── frontend/                  # React 19 + Vite + Tailwind (its own git repository)
    └── src/                   # components/, pages/, services/, utils/
```

> **Note:** `backend/` and `frontend/` each currently carry their own `.git` and
> GitHub remote. They can be published separately or consolidated into a single
> monorepo at the project root.

## Backend

### Setup

```powershell
# from the project root
python -m venv backend/venv
backend\venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt          # core (heuristics only)
pip install -r backend/requirements-ml.txt       # optional: ML extras (torch, transformers, spacy)
```

The optional ML features (`transformers`, `torch`, `spacy`) are heavy and are kept
in `requirements-ml.txt`. If they are not installed or fail to load, the detector
degrades gracefully to pure heuristics. Enable/disable them per deployment with the
flags in `backend/feature_flags.json` (`ENABLE_SPACY`, `ENABLE_TRANSFORMERS`,
`ENABLE_WHOIS`), the matching environment variables (see below), or the admin
feature-flag endpoints.

### Configuration (environment variables)

| Variable | Purpose | Default |
| --- | --- | --- |
| `PHISHGUARD_SECRET_KEY` | JWT signing key. If unset, a key is generated and stored in `backend/.secret_key` (gitignored). **Set this in production.** | generated |
| `PHISHGUARD_CORS_ORIGINS` | Comma-separated allowed origins. | `http://localhost:5173,http://127.0.0.1:5173` |
| `PHISHGUARD_ENABLE_SPACY` | Override the `ENABLE_SPACY` flag (`true`/`false`). | from `feature_flags.json` |
| `PHISHGUARD_ENABLE_TRANSFORMERS` | Override the `ENABLE_TRANSFORMERS` flag. | from `feature_flags.json` |
| `PHISHGUARD_ENABLE_WHOIS` | Override the `ENABLE_WHOIS` flag. | from `feature_flags.json` |
| `PHISHGUARD_ADMIN_EMAIL` | Email for the seed admin script. | `admin@phishguard.ai` |
| `PHISHGUARD_ADMIN_PASSWORD` | Password for the seed admin script (required). | — |

Environment overrides take precedence over `feature_flags.json`, which is useful in
CI (disable the network/ML-dependent flags) and in locked-down deployments.

### Create the first admin

```powershell
# from the project root
$env:PHISHGUARD_ADMIN_PASSWORD = "choose-a-strong-password"
python -m backend.seed_admin
# or: python -m backend.seed_admin --email me@example.com --password "…"
```

### Run

```powershell
# from the project root
uvicorn backend.main:app --reload --port 8000
```

- API docs: http://localhost:8000/docs (ReDoc at `/redoc`, OpenAPI at `/openapi.json`)
- Health check: http://localhost:8000/health

### Test

```powershell
# from the project root
python -m pytest backend/tests
```

### Evaluate the detector offline

```powershell
# from the project root
python -m backend.evaluation.evaluate --dataset backend/evaluation/sample_emails.json
```

Prints prediction/category accuracy plus false-positive and false-negative counts.

## Frontend

```powershell
cd frontend
npm install
npm run dev      # http://localhost:5173 (API target: the backend above)
npm run build
npm run lint
```

The API base URL defaults to `http://localhost:8000` and can be changed at
runtime from the in-app Settings page (persisted in `localStorage`).

User routes live under `/app` (scanner, batch scanner, history, settings);
admin routes under `/admin` (dashboard, users, results, feedback, domains,
feature flags, feature requests, signup requests). Both sections are gated by
`ProtectedRoute`, which reads the JWT role from `localStorage`.

## Detection engine

`backend/services/detector.py` combines independent signals, each contributing a
weighted amount to a raw score that is then reduced by "trust credit":

- **Keywords** — urgent/credential/payment phrasing
- **Sender** — free-mailbox vs. branded domain, risky local-part markers
- **URLs** — shorteners, IP/IDN hosts, mismatched anchor text, non-HTTPS,
  redirect parameters, sender/link domain alignment, WHOIS domain age
- **Headers** — SPF/DKIM/DMARC results and Reply-To/Return-Path alignment
- **Attachments** — risky extensions, double-extension disguises, oversized files
- **Urgency** — exclamation/CAPS pressure and urgent phrasing
- **ML** — optional zero-shot classifier (BART) probability

A message is classified as `Phishing` when the adjusted score reaches `0.58`;
risk levels are Low (<0.35), Medium (0.35–0.75), and High (≥0.75). Every result
includes a per-signal `analysis_breakdown` so the decision is explainable.

## Continuous integration

`.github/workflows/ci.yml` runs two jobs on pushes to `main` and on pull requests:

- **Backend** — Python 3.12, installs the core `backend/requirements.txt` (no ML
  extras), then runs `python -m pytest backend/tests -q`. The `PHISHGUARD_ENABLE_*`
  flags are forced to `false` so CI never downloads models or performs WHOIS lookups.
- **Frontend** — Node 22, `npm ci`, `npm run lint`, `npm run build` (working dir `frontend/`).
