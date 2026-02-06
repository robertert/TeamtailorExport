# Teamtailor Recruitment Server

Basic Express + Node.js + TypeScript server for Teamtailor Recruitment application.

## Requirements

- Node.js (version 14 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Create a `.env` file and adjust values as needed
   - By default, the server runs on port 3000
   - Example `.env` content:
     ```
     PORT=3000
     NODE_ENV=development
     ```

## Running

### Development mode (with auto-reload):
```bash
npm run dev
```

### TypeScript compilation:
```bash
npm run build
```

### Production mode (after compilation):
```bash
npm start
```

### Type checking (without compilation):
```bash
npm run type-check
```

The server will be available at: `http://localhost:3000`

## Project Structure

```
TeamtailorRecrutmentServer/
├── package.json          # npm configuration with dependencies
├── tsconfig.json         # TypeScript configuration
├── .env                  # Environment variables
├── .gitignore            # Files ignored by git
├── README.md             # Project documentation
├── src/                  # TypeScript source code folder
│   ├── server.ts         # Main server file
│   ├── routes/           # Routes folder
│   │   └── index.ts      # Example router
│   └── middleware/       # Middleware folder
│       └── errorHandler.ts # Error handling
└── dist/                 # Compiled JavaScript code (generated)
```

## Endpoints

### Basic
- `GET /` - Home page with server information
- `GET /api/health` - Server status check

### Example API endpoints
- `GET /api/test` - Example GET endpoint
- `POST /api/test` - Example POST endpoint

## Technologies

- **Express.js** - Web framework for Node.js
- **TypeScript** - Typed superset of JavaScript
- **dotenv** - Environment variables management
- **cors** - Cross-Origin Resource Sharing handling
- **ts-node-dev** - Auto-reload server in development mode with TypeScript

## Development

To add new endpoints, create files in the `src/routes/` folder and import them in `src/server.ts`. All TypeScript files are located in the `src/` folder, and compiled JavaScript code is generated to the `dist/` folder.
