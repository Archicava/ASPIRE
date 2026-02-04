# ASPIRE - Archicava Case Inference Studio

Prototype Next.js workspace that turns the Romanian autism cohort research into
an interactive UI for Ratio1ʼs decentralized inference pipeline.

## What you will find

- **Landing and dAuth onboarding** – marketing splash plus Ratio1 dAuth
  onboarding.
- **Operator workspace** – cohort metrics, active inference jobs, and quick
  access to cases.
- **Case submission wizard** – multi-section form mirroring the prenatal,
  developmental, neurological, and behavioural fields described in the research
  PDF.
- **Inference review** – probability distribution, narrative explanations, and
  recommended actions.
- **Predictive lab** – dedicated workspace for running cohort-informed
  probability scenarios on uploaded or ad-hoc profiles.
- **Research insights hub** – product decisions traced back to the “Analysis of
  Autism Case Database and Research Context” document.
- **Edge node telemetry** – navigation badge and modal reuse the Ratio1 Drive
  status methodology for CStore/R1FS health.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000 to explore the prototype. Configure the
environment variables below to bind to live Ratio1 services.

### Configuration

- `MOCK_MODE` – set to `true` to enable mock mode (bypasses authentication and
  uses pre-seeded cohort data). **Perfect for demos, development, and testing
  without a live Ratio1 Edge Node.**
- `R1EN_CHAINSTORE_API_URL` / `R1EN_R1FS_API_URL` (or `EE_CHAINSTORE_API_URL` /
  `EE_R1FS_API_URL`) – CStore and R1FS endpoints exposed by the edge node
  container. _Not required when MOCK_MODE=true._
- `R1EN_CHAINSTORE_PEERS` – optional JSON array of peer URLs passed to the
  Ratio1 SDK.
- `R1EN_CSTORE_AUTH_HKEY` / `R1EN_CSTORE_AUTH_SECRET` (or `EE_CSTORE_AUTH_HKEY`
  / `EE_CSTORE_AUTH_SECRET`, or `CSTORE_AUTH_HKEY` / `CSTORE_AUTH_SECRET`) –
  credentials consumed by `@ratio1/cstore-auth-ts` to authenticate operators
  against CStore. _Not required when MOCK_MODE=true._
- `R1EN_CSTORE_AUTH_BOOTSTRAP_ADMIN_PWD` (or legacy
  `EE_CSTORE_AUTH_BOOTSTRAP_ADMIN_PW`) – one-time bootstrap password for the
  initial `admin` user (required until that account exists). _Not required when
  MOCK_MODE=true._
- `AUTH_SESSION_SECRET` – server-side secret for signing auth sessions (required
  in production; use 32+ chars).
- `AUTH_SESSION_COOKIE` / `AUTH_SESSION_TTL_SECONDS` – optional overrides for
  the session cookie name and lifespan (defaults: `r1-session`, 86400 seconds).
- `RATIO1_CASES_HKEY` / `RATIO1_JOBS_HKEY` – hash keys used when persisting case
  records and inference jobs into CStore (defaults align with the ASD prototype
  namespace).

Protected routes and API endpoints require a signed session cookie issued by
`/api/auth/login`.

### Mock Mode

**MOCK_MODE** is a special development and demo mode that displays pre-seeded
data without querying the live Ratio1 Edge Node for case data.

#### Configuration Priority

Mock mode can be controlled in two ways:

1. **MOCK_MODE environment variable** (highest priority)
2. **ENFORCE_MOCK_MODE constant** in `lib/constants.ts` (fallback when env not
   set)

**Priority table:**

| ENFORCE_MOCK_MODE (code) | MOCK_MODE (env) | Result       |
| ------------------------ | --------------- | ------------ |
| `true`                   | not set         | ✅ Mock mode |
| `true`                   | `"true"`        | ✅ Mock mode |
| `true`                   | `"false"`       | ❌ Real mode |
| `false`                  | not set         | ❌ Real mode |
| `false`                  | `"true"`        | ✅ Mock mode |
| `false`                  | `"false"`       | ❌ Real mode |

**How to enable:**

```bash
# Option 1: Via environment variable (overrides constant)
# In .env file
MOCK_MODE=true

# Option 2: Via code constant (when env not set)
# In lib/constants.ts
export const ENFORCE_MOCK_MODE = true;

# Note: You still need valid CStore/R1FS endpoints and auth credentials
R1EN_CHAINSTORE_API_URL=http://localhost:8080
R1EN_R1FS_API_URL=http://localhost:8081
R1EN_CSTORE_AUTH_HKEY=aspire-auth
R1EN_CSTORE_AUTH_SECRET=your-secret
R1EN_CSTORE_AUTH_BOOTSTRAP_ADMIN_PWD=admin-password
```

**Use cases for ENFORCE_MOCK_MODE:**

- Development builds: Set to `true` for mock mode by default
- Production builds: Set to `false` for real data by default
- CI/CD pipelines: Set in code, override with env for specific environments

**What it does:**

- **Authentication still required** – uses real CStore authentication with valid
  credentials
- **Uses pre-seeded cohort data** – displays cases from
  `data/cohort-cstore.json` (Romanian ASD cohort) instead of querying CStore for
  cases
- **Returns mock inference jobs** – generates realistic job statuses (queued,
  running, succeeded, failed)
- **Simulates platform health** – returns mock CStore/R1FS status responses
- **Skips data persistence** – case submissions are accepted but not stored in
  CStore/R1FS

**Perfect for:**

- Development with limited Edge Node data
- Demos with consistent, realistic data
- UI/UX testing with pre-seeded cohort
- Testing without creating real case records

**What still works normally:**

- ✅ User authentication (login/logout with real credentials)
- ✅ User management (create/update users in CStore)
- ✅ Session management (signed cookies, TTL)
- ✅ Role-based access control

**What is mocked:**

- 📦 Case records (returns pre-seeded cohort data)
- 📦 Inference jobs (generates mock statuses)
- 📦 Platform status (simulated health checks)
- 📦 Case submission persistence (accepted but not stored)

**Note:** Mock mode is ideal for demos and development where you want consistent
data without modifying the live CStore database.

Run `npm run seed:cohort` to regenerate the JSON seeds (`data/cohort-seed.json`,
`data/cohort-cstore.json`) from the Excel workbook when the source dataset is
updated.

When the endpoints are configured the server routes reuse the Ratio1 Drive
methodology-constructing a singleton Edge SDK instance via
`@ratio1/edge-sdk-ts`, hydrating the node via the env-driven URLs, and
persisting submissions into CStore while surfacing R1FS/CStore health snapshots.

## Tech stack

- Next.js App Router (TypeScript, React 18)
- Session-backed auth via `@ratio1/cstore-auth-ts` plus React context for UI
  state and toast notifications
- Ratio1 Edge Node SDK integration for live CStore/R1FS operations

## Folder structure

- `app/` – Next.js routes (landing, login, workspace, cases, research)
- `components/` – shared UI widgets (forms, charts, stats, feedback)
- `lib/` – domain types, sample data, and formatting helpers
- `public/` – static assets (placeholder for future images, icons)

## Research alignment

The UI content, field choices, and metrics are grounded directly in the two
source documents:

1. **Analysis of Autism Case Database and Research Context** – informs cohort
   insights, prevalence statistics, and roadmap recommendations.
2. **Ratio1 Case Inference Application – Technical Specification** – drives the
   Ratio1-specific flows (dAuth login, Edge Node job pipeline, CStore audit
   trail).

Use this app as the frontend companion to future Ratio1 service integrations or
as a design reference when extending the ASD inference program.

## Cohort dataset

- `data/cohort-seed.json` – compact metrics extracted from
  `baza de date pacienți 1.xlsx`, used to drive on-screen analytics.
- `data/cohort-cstore.json` – normalized `CaseRecord` objects ready for import
  into CStore.
- `npm run seed:cohort` rebuilds both files from the Excel source; the ingestion
  logic lives in `scripts/build-cohort.js`.

## Ratio1 Edge Node deployment

Server routes (`app/api/cases`) and data loaders use live CStore/R1FS
operations. Submissions are stored via `cstore.hset` and jobs recorded under the
configured hash keys, mirroring the patterns in
[`ratio1-drive`](https://github.com/Ratio1/ratio1-drive). Workspace health cards
display the direct `getStatus` responses from the Ratio1 services.

## Predictive lab

- Route: `/predict`
- Sources cases from CStore and lets operators run cohort-informed probability
  scenarios without altering the primary record.
- Inputs mirror the high-signal risk factors called out in the cohort PDF
  (language stage, EEG/MRI findings, prenatal factors, delays, behavioural
  load).
- Outputs include softmax-normalised probabilities for three archetypes
  (“Profound sensory”, “High-functioning”, “Syndromic”) plus tailored
  recommendations.
- Case detail pages expose a shortcut (`Open predictive lab →`) that
  pre-populates the form for that record, while manual mode supports what-if
  exploration before dispatching an actual Ratio1 inference job.

This dual-path approach allows designers to iterate on the UI locally while
guaranteeing the containerised build will bind to the correct endpoints when
running inside a Ratio1 Edge Node.

## Citation

```bibtex
@software{Butusina2024ASPIRE,
  author       = {Butusina, Petrica and Defranceschi, Alessandro and Caprita, Irina and Sofia, Andreea and Tomuta, Raluca and Toderian, Vitalii},
  title        = {{ASPIRE Lab}: Decentralized Distributed Inferential Analytics for Genetic Syndrome Qualitative and Quantitative Research},
  year         = {2024},
  url          = {https://github.com/archicava/aspire},
  organization = {ARCHICAVA and Godyris},
  note         = {Software library}
}
```
