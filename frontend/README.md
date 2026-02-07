# Teamtailor Recruitment — Frontend

Frontend for the Teamtailor recruitment app: export candidates to CSV with a React, TypeScript, and Vite-based UI.

---

## Installation

### Requirements

- **Node.js** 18+ (20+ recommended)
- **npm** 9+

### Steps

```bash
# From the repository root
cd frontend

# Install dependencies
npm install

# Start the dev server (HMR)
npm run dev
```

The app will be available at `http://localhost:5173`. In dev mode, requests to `/api` are proxied to the backend (`http://localhost:3000`).

### Other scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server (Vite HMR) |
| `npm run build` | Production build (TypeScript + Vite) |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint (TypeScript + React) |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 19 |
| **Language** | TypeScript 5.9 (strict) |
| **Bundler / dev** | Vite 7 |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) |
| **Icons** | lucide-react |
| **Lint** | ESLint 9 (flat config), typescript-eslint, react-hooks, react-refresh |

- **React 19** — current version with `createRoot` and StrictMode.
- **TypeScript** — strict mode, `verbatimModuleSyntax`, no emit (type-check only).
- **Vite 7** — ESM, fast HMR, API proxy in dev.
- **Tailwind v4** — utility-first CSS via Vite plugin, no separate config file.

---

## Project structure

```
frontend/
├── index.html              # HTML entry point
├── vite.config.ts          # Vite: React, Tailwind, proxy /api → backend
├── tsconfig.json           # References to tsconfig.app and tsconfig.node
├── tsconfig.app.json       # TypeScript for src/ (strict, ESNext)
├── tsconfig.node.json      # TypeScript for Vite config
├── eslint.config.js       # ESLint (flat config)
├── package.json
└── src/
    ├── main.tsx            # createRoot + StrictMode, global styles import
    ├── App.tsx             # Layout: header, main, footer, DownloadButton
    ├── index.css           # @import "tailwindcss", keyframes (progress)
    ├── components/
    │   └── DownloadButton.tsx   # CSV export button + progress + states
    └── hooks/
        └── useCsvDownloader.ts  # Hook: streaming download, progress, errors
```

- **`main.tsx`** — mounts the app in `<div id="root">`, enables StrictMode.
- **`App.tsx`** — page component: header, export card, footer.
- **`DownloadButton`** — uses `useCsvDownloader`, shows loading, progress, success, and errors.
- **`useCsvDownloader`** — streaming download (Fetch API + `ReadableStream`), byte counting, Blob/URL creation and download trigger.

---

## License

As per the Teamtailor Recruitment project license.
