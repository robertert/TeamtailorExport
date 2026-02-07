# Teamtailor Candidate Export

A full-stack application for exporting candidate data from the [Teamtailor API](https://docs.teamtailor.com/) into CSV files. Built with **Node.js / Express 5** on the backend and **React / Vite** on the frontend, written entirely in **TypeScript**.

---

## Technical Highlights

### Streaming CSV Generation

The export endpoint does **not** buffer the entire dataset in memory. Instead, it pipes an `AsyncGenerator` (paginated API responses) through a `csv-stringify` stream directly into the HTTP response. Back-pressure is handled via the `drain` event, so memory usage stays constant regardless of how many candidates exist in the account.

See: `src/services/teamtailor.service.ts` (async generator) and `src/controllers/exportController.ts` (stream piping).

### Graceful Shutdown

The server listens for `SIGINT` / `SIGTERM` signals and stops accepting new connections while allowing in-flight downloads to finish before the process exits. This prevents partially-written CSV files during deployments or container orchestration restarts.

### Security Defaults

- **Helmet** is applied globally with HSTS explicitly disabled in development to avoid certificate issues on `localhost` (see _Troubleshooting_ below). In production behind an AWS ALB, HSTS should be re-enabled at the load-balancer level.
- **CORS** /api is restricted to `localhost` origins only (`/^http:\/\/localhost:\d+$/`).
- **Rate limiting** (100 req / 15 min window) with `draft-7` standard headers.
- API responses from Teamtailor are validated at runtime with **Zod** schemas before deserialization.

### Structured Logging

All logging is handled by **Pino** — a low-overhead, JSON-structured logger. In development, output is piped through `pino-pretty` for human-readable formatting. In production, logs are emitted as newline-delimited JSON, ready for ingestion by log aggregators (CloudWatch, Datadog, ELK, etc.). Key events — server start, shutdown signals, API retries, page fetches — are logged with contextual metadata for easy filtering and tracing.

### Resilient API Client

Requests to the Teamtailor API use an automatic retry mechanism with exponential backoff and jitter. `429` responses respect the `Retry-After` header. Network errors and 5xx responses are retried up to 3 times.


---

## CI/CD

The project uses **GitHub Actions** for continuous integration and deployment. The entire pipeline is defined in a single workflow (`.github/workflows/ci.yml`).

### Pipeline Overview

```
push / PR to main
  ├── Backend  (type-check, test, build)   ─┐
  ├── Frontend (lint, build)                ├──> Build & Push to AWS ECR
  └────────────────────────────────────────-┘
```

- **Backend** job: installs dependencies, runs TypeScript type checking, Vitest tests, and compiles the project.
- **Frontend** job: installs dependencies, runs ESLint, and builds the Vite production bundle.
- **Build & Push** job: runs only after both Backend and Frontend succeed. Builds the Docker image and pushes it to **Amazon ECR** on pushes to `main`.

### Deployment

The application is deployed on **AWS App Runner** and is available at:

**https://iskdmghb3w.eu-central-1.awsapprunner.com**

App Runner automatically picks up new images pushed to ECR and deploys them, providing zero-downtime rolling deployments.

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM access key with ECR push permissions |
| `AWS_SECRET_ACCESS_KEY` | Corresponding IAM secret key |

### Concurrency

The workflow uses `cancel-in-progress: true`, so pushing a new commit to a branch automatically cancels any in-progress run for that branch, saving CI minutes and providing faster feedback.


---

## Getting Started

### Prerequisites

- **Node.js** >= 18 (LTS recommended)
- A **Teamtailor API key** (Settings > API keys in your Teamtailor account)

### Installation

```bash
npm install
```

If you plan to work on the frontend as well:

```bash
cd frontend && npm install
```

### Configuration (single source)

All configuration is read from **environment variables**. One place for the whole app:

| Variable | Description | Default |
|----------|-------------|---------|
| `TEAMTAILOR_API_KEY` | Teamtailor API key (required) | — |
| `PORT` | Server port | `3000` |

- **Backend** reads them from `src/config/env.ts`. Validation (e.g. required API key) happens at startup.
- **Frontend (dev only)** — the Vite dev server proxies `/api` to the backend; the proxy target is taken from the same `PORT` (see `frontend/vite.config.ts`, which uses `loadEnv` from the repo root). So one `.env` drives both backend and frontend proxy in development.

**Development:** use a single `.env` file at the **repo root**:

```bash
cp .env.example .env
```

Edit `.env`:

```
TEAMTAILOR_API_KEY=your-api-key-here
PORT=3000
```

The backend loads `.env` only when `NODE_ENV !== 'production'` (see `src/loadEnv.ts`). The frontend dev server reads the same file for the proxy target.

**Production:** there is no `.env` file. Set environment variables on the process (e.g. Docker `-e`, `docker-compose` `environment`, or Kubernetes `env`). The backend uses only `process.env` and does not load any `.env` in production.

> **Do not** commit `.env` or your API key to version control. The `.gitignore` already excludes it.

### Running in Development

```bash
npm run dev
```

This starts the backend server with `ts-node-dev` (auto-reload on file changes). For frontend development, start the Vite dev server separately:

```bash
cd frontend && npm run dev
```

### Running in Production

Set environment variables on the process (no `.env` file is loaded in production):

```bash
export TEAMTAILOR_API_KEY=your-api-key
export PORT=3000   # optional, default 3000
npm run build      # compiles TypeScript to dist/
npm start          # serves the compiled backend + frontend static assets
```

The production build serves the React SPA from `frontend/dist/` via Express static middleware, so no separate frontend server is needed.


### Containerization (Docker)

The app uses a multi-stage Dockerfile: it builds the frontend (Vite), then the backend (TypeScript), and runs a minimal production image with Node 20 Alpine. The `.env` file is not copied into the image (see `.dockerignore`); pass configuration via environment variables at runtime.

**Build the image** (from the repo root):

```bash
docker build -t teamtailor-recruitment .
```

**Run the container:**

```bash
docker run --rm -p 3000:3000 \
  -e TEAMTAILOR_API_KEY=your-api-key-here \
  teamtailor-recruitment
```


Configuration Flags:
- e TEAMTAILOR_API_KEY=...: Required. Your API key.
- p 3000:3000: Maps the Host Port (left) to the Container Port (right).
- e PORT=3000: Optional. Sets the internal port the app listens on (default is 3000).
⚠️ Important: If you change the internal PORT variable, you must update the container port mapping in the -p flag to match.

Example (Running on internal port 4000):
If you set -e PORT=4000, the app listens on port 4000 inside the container. You must map traffic to that port:
Bash

```bash
docker run --rm -p 3000:4000 -e PORT=4000 ...
(Host port 3000 forwards to Container port 4000)
```

**Using an env file** (do not commit it):

```bash
# .env.docker (example)
TEAMTAILOR_API_KEY=your-api-key-here
PORT=3000
```

```bash
docker run --rm -p 3000:3000 --env-file .env.docker teamtailor-recruitment
```

**Health check:** once the container is running, you can call:

```bash
curl http://localhost:3000/api/health
```

### Running Tests

```bash
npm test               # single run (vitest)
npm run test:watch     # watch mode
```

---

## API Endpoints

| Method | Path                        | Description                        |
|--------|-----------------------------|------------------------------------|
| GET    | `/api/health`               | Health check (`{ status: "OK" }`)  |
| GET    | `/api/export/candidates`    | Stream a CSV download of all candidates and their job applications |

Example:

```bash
curl -o candidates.csv http://localhost:3000/api/export/candidates
```

The CSV contains the following columns: `candidate_id`, `first_name`, `last_name`, `email`, `job_application_id`, `job_application_created_at`.

---

## Project Structure

```
.
├── src/
│   ├── server.ts                  # Express app entry point
│   ├── loadEnv.ts                 # Loads .env in development only (production uses process env)
│   ├── config/env.ts              # Environment variable validation
│   ├── controllers/               # Route handlers
│   ├── middleware/                 # Error handler, rate limiter, request ID, validation
│   ├── routes/                    # API route definitions
│   ├── schemas/                   # Zod schemas (API response & domain types)
│   ├── services/                  # Business logic (Teamtailor API integration)
│   ├── lib/                       # Logger (pino), graceful shutdown
│   ├── types/                     # Ambient type declarations
│   └── utils/                     # Helpers (API client, CSV writer, retry, AppError)
├── frontend/                      # React + Vite + Tailwind SPA
├── dist/                          # Compiled backend (generated)
├── Dockerfile                     # Multi-stage build (frontend + backend → production)
├── .dockerignore                  # Excludes node_modules, .env, .git, dist, etc.
├── .env.example                   # Environment template
├── tsconfig.json
└── package.json
```

---

## Troubleshooting

### HSTS / SSL issues on localhost (Safari / macOS)

Safari aggressively caches HSTS headers. If you have previously visited `localhost` over HTTPS (from another project), Safari may refuse to load `http://localhost:3000` and silently redirect to HTTPS.

**Workarounds:**

1. Always navigate to `http://localhost:3000` explicitly (not just `localhost:3000`).
2. HSTS is already disabled in this project's Helmet configuration to prevent this issue.
3. If Safari still redirects, clear the HSTS cache: _Safari > Clear History_, or delete `~/Library/Cookies/HSTS.plist` and restart Safari.

---

## Tech Stack

| Layer      | Technology                                                    |
|------------|---------------------------------------------------------------|
| Runtime    | Node.js, TypeScript                                           |
| Backend    | Express 5, Helmet, CORS, express-rate-limit                   |
| Frontend   | React 19, Vite, Tailwind CSS                                  |
| Validation | Zod                                                           |
| HTTP       | Axios (with retry + exponential backoff)                      |
| Logging    | Pino (+ pino-pretty in dev)                                   |
| Testing    | Vitest, Supertest                                             |
| API Format | JSON:API (jsonapi-serializer)                                 |
| CI/CD      | GitHub Actions                                                |
| Container  | Docker (multi-stage, Node 20 Alpine)                          |
| Cloud      | AWS App Runner, Amazon ECR                                    |

---

## License

MIT
