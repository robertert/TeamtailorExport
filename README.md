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
- **CORS** is restricted to `localhost` origins only (`/^http:\/\/localhost:\d+$/`).
- **Rate limiting** (100 req / 15 min window) with `draft-7` standard headers.
- API responses from Teamtailor are validated at runtime with **Zod** schemas before deserialization.

### Structured Logging

All logging is handled by **Pino** — a low-overhead, JSON-structured logger. In development, output is piped through `pino-pretty` for human-readable formatting. In production, logs are emitted as newline-delimited JSON, ready for ingestion by log aggregators (CloudWatch, Datadog, ELK, etc.). Key events — server start, shutdown signals, API retries, page fetches — are logged with contextual metadata for easy filtering and tracing.

### Resilient API Client

Requests to the Teamtailor API use an automatic retry mechanism with exponential backoff and jitter. `429` responses respect the `Retry-After` header. Network errors and 5xx responses are retried up to 3 times.

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

### Environment

Copy the example file and fill in your API key:

```bash
cp .env.example .env
```

`.env` contents:

```
TEAMTAILOR_API_KEY=your-api-key-here
PORT=3001
```

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

```bash
npm run build          # compiles TypeScript to dist/
npm start              # serves the compiled backend + frontend static assets
```

The production build serves the React SPA from `frontend/dist/` via Express static middleware, so no separate frontend server is needed.

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
curl -o candidates.csv http://localhost:3001/api/export/candidates
```

The CSV contains the following columns: `candidate_id`, `first_name`, `last_name`, `email`, `job_application_id`, `job_application_created_at`.

---

## Project Structure

```
.
├── src/
│   ├── server.ts                  # Express app entry point
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
├── .env.example                   # Environment template
├── tsconfig.json
└── package.json
```

---

## Troubleshooting

```

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

---

## License

MIT
