# Teamtailor Recruitment Server

Serwer Express + Node.js + TypeScript do eksportu danych kandydatów z Teamtailor API do pliku CSV.

## Wymagania

- Node.js (wersja 14 lub wyższa)
- npm lub yarn

## Instalacja

1. Zainstaluj zależności:

```bash
npm install
```

2. Skonfiguruj zmienne środowiskowe:
   - Utwórz plik `.env` w katalogu głównym projektu.
   - **Wymagana** zmienna: `TEAMTAILOR_API_KEY` (klucz API Teamtailor).
   - Opcjonalnie: `PORT` (domyślnie 3000), `NODE_ENV`.

Przykładowa zawartość `.env`:

```
TEAMTAILOR_API_KEY=your-api-key-here
PORT=3000
NODE_ENV=development
```

**Uwaga:** Nie commituj pliku `.env` ani klucza API do repozytorium.

## Uruchamianie

### Tryb deweloperski (z auto-przeładowaniem):

```bash
npm run dev
```

### Kompilacja TypeScript:

```bash
npm run build
```

### Tryb produkcyjny (po kompilacji):

```bash
npm start
```

### Sprawdzenie typów (bez kompilacji):

```bash
npm run type-check
```

### Testy:

```bash
npm test
```

Serwer jest dostępny pod adresem: `http://localhost:3000` (lub inny port z `PORT`).

## Struktura projektu

```
TeamtailorRecrutmentServer/
├── package.json
├── tsconfig.json
├── .env                    # Zmienne środowiskowe (nie w repo)
├── .gitignore
├── README.md
├── src/
│   ├── server.ts           # Punkt wejścia aplikacji
│   ├── config/
│   │   └── env.ts          # Konfiguracja ze zmiennych środowiskowych
│   ├── controllers/
│   │   └── exportController.ts
│   ├── middleware/
│   │   ├── errorHandler.ts
│   │   └── validateResource.ts
│   ├── routes/
│   │   └── apiRoutes.ts
│   ├── schemas/
│   │   ├── candidate.schema.ts
│   │   └── teamtailor.schema.ts
│   ├── services/
│   │   └── teamtailor.service.ts
│   ├── types/
│   │   └── jsonapi-serializer.d.ts
│   └── utils/
│       ├── apiClient.ts
│       ├── AppError.ts
│       └── csvWriter.ts
└── dist/                   # Skompilowany JavaScript (generowany)
```

## Endpointy API

### Podstawowe

- `GET /` – informacja o serwerze i wersji
- `GET /api/health` – status serwera (health check)

### Eksport CSV

- `GET /api/export/candidates` – pobiera plik CSV z danymi kandydatów i ich aplikacji

Plik CSV zawiera kolumny: `candidate_id`, `first_name`, `last_name`, `email`, `job_application_id`, `job_application_created_at`. Dane są strumieniowane z Teamtailor API (paginacja JSON:API) i zapisywane partiami, bez ładowania całego zestawu do pamięci.

Przykład pobrania (curl):

```bash
curl -N http://localhost:3000/api/export/candidates -o candidates.csv
```

## Technologie

- **Express.js** – framework webowy
- **TypeScript** – typowanie
- **Zod** – walidacja (m.in. odpowiedzi API)
- **axios** – klient HTTP do Teamtailor API
- **jsonapi-serializer** – deserializacja odpowiedzi JSON:API
- **dotenv** – zmienne środowiskowe
- **cors** – CORS
- **ts-node-dev** – dev z auto-reload
- **Vitest** – testy jednostkowe

## Rozwój

Nowe endpointy dodawaj w `src/routes/` i podłącz w `src/server.ts`. Kod TypeScript znajduje się w `src/`, wynik kompilacji w `dist/`.
