/**
 * Loads .env from the project root in development only.
 * In production, configuration comes solely from process environment (e.g. Docker, K8s).
 */
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

if (!process.env.TEAMTAILOR_API_KEY) {
  throw new Error('TEAMTAILOR_API_KEY is not set');
}

export const config = {
  TEAMTAILOR_API_KEY: process.env.TEAMTAILOR_API_KEY,
  PORT: parseInt(process.env.PORT || '3000', 10),
};
